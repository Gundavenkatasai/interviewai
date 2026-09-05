"""
resume_rag.py
─────────────
Semantic chunking and context retrieval for resumes.
Chunks structured resume profile (projects, skills, experience) and text,
builds an in-memory TF-IDF index cached per resume, and retrieves the most
relevant context snippet for a given topic/category to send to the AI interviewer.
"""

import json
import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger("interviewai.resume_rag")

_sklearn_available = False
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    _sklearn_available = True
except ImportError:
    pass

# In-memory cache for computed resume indexes: resume_id -> {chunks: [...], vectorizer: ..., matrix: ...}
_RESUME_INDEX_CACHE: Dict[str, Dict[str, Any]] = {}


def chunk_resume(resume_obj: Any) -> List[Dict[str, Any]]:
    """
    Deconstructs a Resume ORM model or dict into discrete semantic chunks:
    - Project chunks (highest priority)
    - Experience chunks
    - Skill blocks
    - Raw text paragraphs
    """
    chunks: List[Dict[str, Any]] = []

    # 1. Project chunks
    projects = getattr(resume_obj, "parsed_projects", None)
    if not projects and isinstance(resume_obj, dict):
        projects = resume_obj.get("projects") or resume_obj.get("parsed_projects")

    if projects and isinstance(projects, list):
        for idx, p in enumerate(projects):
            if not isinstance(p, dict):
                continue
            name = p.get("name") or f"Project {idx + 1}"
            desc = p.get("description") or ""
            techs = p.get("technologies") or []
            db = p.get("database") or ""
            auth = p.get("authentication") or ""
            features = p.get("features") or []
            responsibilities = p.get("responsibilities") or []
            arch = p.get("architecture") or ""

            tech_str = ", ".join(str(t) for t in techs)
            feat_str = ", ".join(str(f) for f in features)
            resp_str = "; ".join(str(r) for r in responsibilities)

            text_repr = (
                f"Project: {name}\n"
                f"Description: {desc}\n"
                f"Technologies: {tech_str}\n"
                f"{f'Database: {db}' if db else ''}\n"
                f"{f'Authentication: {auth}' if auth else ''}\n"
                f"{f'Architecture: {arch}' if arch else ''}\n"
                f"{f'Key Features: {feat_str}' if feat_str else ''}\n"
                f"{f'Responsibilities: {resp_str}' if resp_str else ''}"
            ).strip()

            chunks.append({
                "type": "project",
                "title": name,
                "project_name": name,
                "technologies": techs,
                "database": db,
                "authentication": auth,
                "text": text_repr,
                "raw_data": p
            })

    # 2. Skill chunks
    skills = getattr(resume_obj, "parsed_skills", None)
    if not skills and isinstance(resume_obj, dict):
        skills = resume_obj.get("skills") or resume_obj.get("parsed_skills")

    if skills and isinstance(skills, list):
        skill_str = ", ".join(str(s) for s in skills)
        chunks.append({
            "type": "skills",
            "title": "Technical Skills",
            "technologies": skills,
            "text": f"Technical Skills: {skill_str}",
            "raw_data": {"skills": skills}
        })

    # 3. Experience chunks
    experience = getattr(resume_obj, "parsed_experience", None)
    if not experience and isinstance(resume_obj, dict):
        experience = resume_obj.get("experience") or resume_obj.get("parsed_experience")

    if experience and isinstance(experience, list):
        for exp in experience:
            if isinstance(exp, dict):
                role = exp.get("role") or "Engineer"
                comp = exp.get("company") or ""
                resp = exp.get("responsibilities") or exp.get("highlights") or []
                resp_str = "; ".join(str(r) for r in resp)
                chunks.append({
                    "type": "experience",
                    "title": f"{role} at {comp}".strip(),
                    "text": f"Role: {role} {f'at {comp}' if comp else ''}\nResponsibilities: {resp_str}",
                    "raw_data": exp
                })

    # 4. Raw text fallback chunk if chunks are sparse
    raw_text = getattr(resume_obj, "raw_text", None)
    if not raw_text and isinstance(resume_obj, dict):
        raw_text = resume_obj.get("raw_text")

    if (not chunks or len(chunks) <= 1) and raw_text:
        paragraphs = [p.strip() for p in raw_text.split("\n\n") if len(p.strip()) > 30]
        for idx, para in enumerate(paragraphs[:5]):
            chunks.append({
                "type": "text",
                "title": f"Resume Section {idx + 1}",
                "text": para,
                "raw_data": {}
            })

    return chunks


def index_resume(resume_id: str, resume_obj: Any) -> Dict[str, Any]:
    """
    Builds or retrieves the cached TF-IDF index for the given resume.
    Stores embeddings/TF-IDF matrix once per resume.
    """
    if resume_id in _RESUME_INDEX_CACHE:
        return _RESUME_INDEX_CACHE[resume_id]

    chunks = chunk_resume(resume_obj)
    if not chunks:
        entry = {"chunks": [], "vectorizer": None, "matrix": None}
        _RESUME_INDEX_CACHE[resume_id] = entry
        return entry

    texts = [c["text"] for c in chunks]

    if _sklearn_available and len(texts) > 0:
        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
            matrix = vectorizer.fit_transform(texts)
            entry = {"chunks": chunks, "vectorizer": vectorizer, "matrix": matrix}
            _RESUME_INDEX_CACHE[resume_id] = entry
            return entry
        except Exception as e:
            logger.warning("[RESUME_RAG] TF-IDF indexing error: %s", e)

    entry = {"chunks": chunks, "vectorizer": None, "matrix": None}
    _RESUME_INDEX_CACHE[resume_id] = entry
    return entry


def retrieve_relevant_resume_context(
    resume_id: str,
    resume_obj: Any,
    query_topic: str,
    top_k: int = 1
) -> Dict[str, Any]:
    """
    Retrieves the most relevant resume chunk for the specified topic/technology/project.
    Returns:
    {
        "context_text": "...",
        "project_name": "...",
        "referenced_entity": "...",
        "chunk_type": "project" | "skills" | "experience",
        "similarity_score": 0.xx
    }
    """
    indexed = index_resume(resume_id, resume_obj)
    chunks = indexed.get("chunks", [])

    if not chunks:
        return {
            "context_text": "",
            "project_name": None,
            "referenced_entity": None,
            "chunk_type": None,
            "similarity_score": 0.0
        }

    # If query matches a project name or tech explicitly, prioritize project chunk
    q_clean = query_topic.lower().strip()
    for c in chunks:
        if c.get("type") == "project":
            p_name = (c.get("project_name") or "").lower()
            techs = [str(t).lower() for t in c.get("technologies", [])]
            db = (c.get("database") or "").lower()
            auth = (c.get("authentication") or "").lower()
            if q_clean in p_name or any(q_clean == t for t in techs) or q_clean == db or q_clean == auth:
                return {
                    "context_text": c["text"],
                    "project_name": c.get("project_name"),
                    "referenced_entity": c.get("project_name") or query_topic,
                    "chunk_type": "project",
                    "similarity_score": 1.0
                }

    # Use TF-IDF vector similarity if sklearn is active
    vectorizer = indexed.get("vectorizer")
    matrix = indexed.get("matrix")

    if vectorizer is not None and matrix is not None and _sklearn_available:
        try:
            query_vec = vectorizer.transform([query_topic])
            sims = cosine_similarity(query_vec, matrix).flatten()
            best_idx = int(np.argmax(sims))
            best_score = float(sims[best_idx])
            best_chunk = chunks[best_idx]

            return {
                "context_text": best_chunk["text"],
                "project_name": best_chunk.get("project_name"),
                "referenced_entity": best_chunk.get("project_name") or query_topic,
                "chunk_type": best_chunk.get("type"),
                "similarity_score": best_score
            }
        except Exception as e:
            logger.warning("[RESUME_RAG] Retrieval calculation error: %s", e)

    # Fallback to the first project chunk or first available chunk
    fallback_chunk = next((c for c in chunks if c.get("type") == "project"), chunks[0])
    return {
        "context_text": fallback_chunk["text"],
        "project_name": fallback_chunk.get("project_name"),
        "referenced_entity": fallback_chunk.get("project_name") or query_topic,
        "chunk_type": fallback_chunk.get("type"),
        "similarity_score": 0.5
    }
