"""
question_normalizer.py
──────────────────────
Normalizes question text for exact and near-exact duplicate detection.

The normalization pipeline:
  1. Lowercase
  2. Strip punctuation (keep spaces)
  3. Remove common question-preamble phrases
  4. Collapse whitespace
  5. Strip leading/trailing whitespace

Two questions that are paraphrases of the same query (e.g., "What is REST API?"
vs "Can you explain what a REST API is?") will not collide on exact match, but
the semantic-similarity layer (TF-IDF cosine) handles those cases.
"""

import re
import unicodedata

# Filler phrases to strip from the beginning of question text.
# These are matched case-insensitively AFTER lowercasing.
_PREAMBLE_PATTERNS = [
    r"^can you (please )?(explain|describe|walk me through|tell me about|discuss|talk about)\s+",
    r"^could you (please )?(explain|describe|walk me through|tell me about|discuss)\s+",
    r"^would you (please )?(explain|describe)\s+",
    r"^please (explain|describe|walk me through|tell me about|discuss)\s+",
    r"^tell me (about|how|what|why|when|where)\s+",
    r"^describe (how|what|the|your|a|an)\s+",
    r"^explain (how|what|the|why|when|your|a|an)\s+",
    r"^walk me through\s+",
    r"^how would you\s+",
    r"^how do you\s+",
    r"^what (is|are|do|does|would|can|should)\s+(the|a|an|your)?\s*",
    r"^why (is|are|do|does|would)\s+",
    r"^when (is|are|do|does|would|should)\s+",
    r"^in your (experience|opinion|view),?\s+",
    r"^as a (developer|engineer|candidate|professional),?\s+",
    r"^from a (technical|developer|engineering) (perspective|standpoint|point of view),?\s+",
    r"^given (that|your|the)?\s+",
    r"^suppose (that|you|a)?\s+",
    r"^imagine (that|you|a)?\s+",
    r"^(if|when) you (were|are|had to)\s+",
]

_COMPILED_PREAMBLES = [re.compile(p, re.IGNORECASE) for p in _PREAMBLE_PATTERNS]

# Additional noise words that add no semantic value for comparison
_NOISE_WORDS = frozenset([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "dare",
    "ought", "used", "to", "of", "in", "on", "at", "by", "for",
    "with", "about", "against", "between", "into", "through",
    "during", "before", "after", "above", "below", "from", "up",
    "down", "out", "off", "over", "under", "again", "further",
    "then", "once", "here", "there", "when", "where", "why",
    "how", "all", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "just", "it", "its", "this",
    "that", "these", "those", "i", "you", "he", "she", "we", "they",
    "what", "which", "who", "whom", "whose"
])


def normalize(text: str) -> str:
    """
    Returns a normalized, comparable version of the question text.
    Used for exact-match dedup BEFORE semantic similarity is computed.
    """
    if not text:
        return ""

    # 1. Unicode normalization
    text = unicodedata.normalize("NFKD", text)

    # 2. Lowercase
    text = text.lower()

    # 3. Strip trailing question mark and punctuation
    text = re.sub(r"[?!.]+$", "", text)

    # 4. Remove preamble phrases (applied iteratively — some questions have stacked preambles)
    changed = True
    iterations = 0
    while changed and iterations < 5:
        changed = False
        for pattern in _COMPILED_PREAMBLES:
            new_text = pattern.sub("", text, count=1)
            if new_text != text:
                text = new_text.strip()
                changed = True
        iterations += 1

    # 5. Remove all punctuation except alphanumeric and spaces
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # 6. Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def normalize_for_storage(text: str) -> str:
    """
    A lighter normalization used when storing a question for later comparison.
    Keeps more text than `normalize()` to enable better semantic indexing,
    but is still lower-cased and whitespace-collapsed.
    """
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text).lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def are_exact_duplicates(a: str, b: str) -> bool:
    """Returns True if two questions normalize to the same string."""
    return normalize(a) == normalize(b)
