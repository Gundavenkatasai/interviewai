"""
interview_state_machine.py
──────────────────────────
Formal state machine for InterviewSession lifecycle.

States (spec §32):
  CREATED        → Session row created, no questions yet
  READY          → First question generated, waiting for candidate
  ASKING         → Question presented / being read aloud
  LISTENING      → Recording candidate's answer
  PROCESSING     → Transcribing audio
  EVALUATING     → AI is scoring the answer (8 dimensions)
  GENERATING_NEXT → AI generating the next question
  COMPLETED      → All max_questions answered, report generated
  FAILED         → Irrecoverable error

Valid transitions (spec §33):
  CREATED → READY → ASKING → LISTENING → PROCESSING → EVALUATING → GENERATING_NEXT → READY
  Any state → COMPLETED  (when question_count >= max_questions)
  Any state → FAILED     (on irrecoverable error)
"""

import logging
from typing import Set

logger = logging.getLogger("interviewai.state_machine")

# ─── Valid state transitions ─────────────────────────────────────────────────

TRANSITIONS: dict[str, Set[str]] = {
    "CREATED":          {"READY", "FAILED"},
    "READY":            {"ASKING", "COMPLETED", "FAILED"},
    "ASKING":           {"LISTENING", "COMPLETED", "FAILED"},
    "LISTENING":        {"PROCESSING", "EVALUATING", "COMPLETED", "FAILED"},
    "PROCESSING":       {"EVALUATING", "FAILED"},
    "EVALUATING":       {"GENERATING_NEXT", "COMPLETED", "FAILED"},
    "GENERATING_NEXT":  {"READY", "COMPLETED", "FAILED"},
    "COMPLETED":        set(),       # terminal state
    "FAILED":           {"READY"},   # allow recovery
}

ALL_STATES = set(TRANSITIONS.keys())


class StateMachineError(Exception):
    """Raised when an invalid state transition is attempted."""
    pass


def can_transition(current_state: str, target_state: str) -> bool:
    """Returns True if the transition from current_state to target_state is valid."""
    allowed = TRANSITIONS.get(current_state, set())
    return target_state in allowed


def validate_transition(current_state: str, target_state: str, session_id: str = "") -> None:
    """Raises StateMachineError if the transition is invalid."""
    if not can_transition(current_state, target_state):
        raise StateMachineError(
            f"[StateMachine] Invalid transition: {current_state} → {target_state} "
            f"(session={session_id})"
        )


def transition(session, target_state: str, db=None) -> str:
    """
    Applies a state transition to the session ORM object.
    Validates the transition, updates session.state, and optionally commits.
    Returns the new state.
    """
    current = getattr(session, "state", "CREATED") or "CREATED"
    validate_transition(current, target_state, session_id=str(getattr(session, "id", "")))
    session.state = target_state
    if db is not None:
        db.add(session)
        db.commit()
        db.refresh(session)
    logger.debug(
        "[StateMachine] %s → %s (session=%s)",
        current, target_state, getattr(session, "id", "?")
    )
    return target_state


def safe_transition(session, target_state: str, db=None) -> str:
    """
    Like transition() but does not raise on invalid transitions — just logs a warning.
    Use this in places where state consistency is desirable but not strictly enforced.
    Returns the resulting state (unchanged if transition was invalid).
    """
    current = getattr(session, "state", "CREATED") or "CREATED"
    if can_transition(current, target_state):
        session.state = target_state
        if db is not None:
            db.add(session)
            db.commit()
            db.refresh(session)
        logger.debug(
            "[StateMachine] safe %s → %s (session=%s)",
            current, target_state, getattr(session, "id", "?")
        )
        return target_state
    else:
        logger.warning(
            "[StateMachine] Ignored invalid safe transition %s → %s (session=%s)",
            current, target_state, getattr(session, "id", "?")
        )
        return current


def is_terminal(state: str) -> bool:
    """Returns True if the state is a terminal state (no further transitions allowed)."""
    return not bool(TRANSITIONS.get(state, set()))


def is_active(state: str) -> bool:
    """Returns True if the session is in an active (non-terminal) state."""
    return state not in ("COMPLETED", "FAILED") and state in ALL_STATES
