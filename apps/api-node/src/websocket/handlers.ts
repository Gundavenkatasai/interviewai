import { FastifyInstance, FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import { WebSocketManager } from "./manager";
import { ClientEventSchema } from "./types";
import {
  InterviewSession,
  InterviewQuestion,
  InterviewState,
  VALID_STATE_TRANSITIONS,
} from "../modules/interview/interview.model";

const processedEvents = new Set<string>();
function isDuplicate(eventId: string): boolean {
  if (processedEvents.has(eventId)) return true;
  processedEvents.add(eventId);
  if (processedEvents.size > 10000) {
    const iterator = processedEvents.values();
    for (let i = 0; i < 1000; i++) {
      const val = iterator.next().value;
      if (val) processedEvents.delete(val);
    }
  }
  return false;
}

export async function websocketRoutes(app: FastifyInstance) {
  app.get(
    "/ws/interview/:sessionId",
    { websocket: true },
    async (connection: WebSocket, req: FastifyRequest<{ Params: { sessionId: string } }>) => {
      const { sessionId } = req.params;

      try {
        const token =
          (req.query as any)?.token ||
          req.cookies?.token ||
          req.headers?.authorization?.replace("Bearer ", "");
        if (!token) {
          connection.close(1008, "Unauthorized: No token provided");
          return;
        }

        const decoded = app.jwt.verify(token);
        if (!decoded) {
          connection.close(1008, "Unauthorized: Invalid token");
          return;
        }

        const session = await InterviewSession.findOne({ _id: sessionId, userId: (decoded as any).sub });
        if (!session) {
          connection.close(1008, "Unauthorized: Session not found or owned by user");
          return;
        }

        WebSocketManager.addConnection(sessionId, connection);

        connection.on("message", async (message: string) => {
          try {
            const rawData = JSON.parse(message);
            const parsed = ClientEventSchema.safeParse(rawData);
            if (!parsed.success) {
              WebSocketManager.sendToSession(sessionId, "ERROR", {
                code: "INVALID_EVENT",
                message: "Event does not match expected schema",
                errors: parsed.error.issues,
              });
              return;
            }

            const clientEvent = parsed.data;
            const eventKey = clientEvent.eventId || `${clientEvent.type}_${Date.now()}`;
            if (isDuplicate(eventKey)) {
              return;
            }

            await handleMessage(sessionId, clientEvent, session.userId);
          } catch (err) {
            console.error("Failed to parse websocket message", err);
          }
        });
      } catch (error) {
        console.error("WS Auth Exception:", error);
        connection.close(1008, "Unauthorized: Token verification failed");
      }
    }
  );
}

async function handleMessage(sessionId: string, clientEvent: any, userId: string) {
  const { type, payload, eventId, stateVersion } = clientEvent;

  switch (type) {
    case "STATE_SYNC_REQUEST":
      await handleStateSync(sessionId, userId, eventId);
      break;

    case "AI_SPEAKING_STARTED":
      await transitionState(sessionId, "AI_SPEAKING", eventId);
      break;

    case "AI_SPEAKING_COMPLETED":
    case "CANDIDATE_READY":
      await transitionState(sessionId, "CANDIDATE_READY", eventId);
      break;

    case "CANDIDATE_SPEAKING_STARTED":
      await transitionState(sessionId, "CANDIDATE_SPEAKING", eventId);
      break;

    case "TRANSCRIPT_UPDATE":
    case "TRANSCRIPT_PARTIAL":
    case "TRANSCRIPT_FINAL":
      // Echo or log if needed
      break;

    case "PING":
      await WebSocketManager.sendToSession(sessionId, "PONG", {}, undefined, eventId);
      break;

    default:
      console.warn("Unknown websocket event type:", type);
  }
}

async function handleStateSync(sessionId: string, userId: string, correlationId?: string) {
  try {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return;

    const questions = await InterviewQuestion.find({ sessionId }).sort({ questionOrder: 1 });
    const currentQuestion = questions[session.currentQuestionIndex || 0];

    const syncPayload = {
      state: session.state,
      status: session.status,
      stateVersion: session.stateVersion,
      currentQuestionIndex: session.currentQuestionIndex,
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion._id,
            _id: currentQuestion._id,
            question_id: currentQuestion._id,
            question_text: currentQuestion.questionText,
            questionText: currentQuestion.questionText,
            category: currentQuestion.category,
            difficulty: currentQuestion.difficulty,
          }
        : null,
      totalQuestions: session.maxQuestions || questions.length,
      elapsedSeconds: session.elapsedSeconds,
      score: session.score,
    };

    await WebSocketManager.sendToSession(
      sessionId,
      "STATE_SYNC_RESPONSE",
      syncPayload,
      currentQuestion?._id,
      correlationId
    );
  } catch (error) {
    console.error("State sync failed", error);
  }
}

async function transitionState(sessionId: string, targetState: InterviewState, correlationId?: string) {
  const session = await InterviewSession.findById(sessionId);
  if (!session) return;

  const currentState = session.state as InterviewState;
  const allowed = VALID_STATE_TRANSITIONS[currentState] || [];

  if (targetState !== currentState && !allowed.includes(targetState)) {
    console.warn(`Rejected invalid WS transition from ${currentState} to ${targetState}`);
    return;
  }

  session.state = targetState;
  session.stateVersion += 1;
  await session.save();

  await WebSocketManager.sendToSession(
    sessionId,
    "INTERVIEW_STATE",
    {
      state: session.state,
      stateVersion: session.stateVersion,
    },
    session.currentQuestionId,
    correlationId
  );
}
