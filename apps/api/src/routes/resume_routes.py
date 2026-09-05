import logging
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.models import User, Resume, JobDescription, ResumeChunk
from src.services.resume_service import resume_service
from src.services.resume_rag import chunk_resume, index_resume
from src.services.embedding_service import embedding_service
from src.auth.auth import get_current_user

logger = logging.getLogger("interviewai.resume_routes")
router = APIRouter(prefix="", tags=["Resume & Job Description"])

class JobDescriptionTextRequest(BaseModel):
    title: str = "Target Position"
    company: Optional[str] = "Company"
    raw_text: str

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit (spec §52)

async def _process_and_chunk_resume(db_resume: Resume, db: Session, user_id: str):
    """
    Deconstructs resume into semantic chunks, generates vector embeddings,
    and persists them to the resume_chunks table (pgvector compatible).
    """
    try:
        chunks = chunk_resume(db_resume)
        if not chunks:
            return
        
        texts_to_embed = [c["text"] for c in chunks]
        embeddings = embedding_service.embed(texts_to_embed)
        
        # Clear any existing chunks for this resume
        db.query(ResumeChunk).filter(ResumeChunk.resume_id == db_resume.id).delete()
        
        for idx, c in enumerate(chunks):
            chunk_row = ResumeChunk(
                resume_id=db_resume.id,
                user_id=user_id,
                section=c.get("type", "text"),
                chunk_title=c.get("title") or c.get("project_name"),
                chunk_text=c["text"],
                metadata_json=c.get("raw_data", {}),
                embedding_json=embeddings[idx] if idx < len(embeddings) else None
            )
            db.add(chunk_row)
        
        db.commit()
        # Warm the in-memory cache
        index_resume(db_resume.id, db_resume)
        logger.info("[RESUME_RAG] Successfully created and persisted %d chunks with embeddings for resume %s", len(chunks), db_resume.id)
    except Exception as e:
        logger.warning("[RESUME_RAG] Chunking/embedding creation warning for resume %s: %s", db_resume.id, e)

@router.post("/resume/analyze")
@router.post("/resumes/upload")
async def analyze_resume_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads and processes a candidate resume (PDF, DOCX, or TXT).
    Extracts text, parses into structured JSON profile, generates semantic chunks,
    calculates embedding vectors, and persists to database (spec §6, §7, §8, §9, §52, §54).
    """
    filename = file.filename or "resume.pdf"
    file_lower = filename.lower()
    
    # MIME / extension verification
    if file_lower.endswith(".pdf"):
        file_type = "pdf"
    elif file_lower.endswith(".docx"):
        file_type = "docx"
    elif file_lower.endswith(".txt"):
        file_type = "text"
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF, DOCX, or TXT document."
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds maximum size limit of 10MB.")

    if file_type == "pdf":
        raw_text = resume_service.extract_text_from_pdf(content)
    elif file_type == "docx":
        raw_text = resume_service.extract_text_from_docx(content)
    else:
        raw_text = content.decode("utf-8", errors="ignore")

    if not raw_text.strip():
        raise HTTPException(
            status_code=400, 
            detail="Could not extract text from document. Ensure it contains selectable text and is not an image scan."
        )

    analysis = await resume_service.analyze_resume_text(raw_text)

    # Persist structured profile in DB
    db_resume = Resume(
        user_id=current_user.id,
        filename=filename,
        file_type=file_type,
        raw_text=raw_text,
        parsed_skills=analysis.skills,
        parsed_projects=analysis.projects,
        parsed_experience=analysis.experience,
        parsed_education=analysis.education,
        parsed_certifications=analysis.certifications,
        parsed_profile=analysis.profile or {
            "candidate": analysis.candidate.model_dump() if analysis.candidate else {
                "skills": analysis.skills, 
                "experience": analysis.experience, 
                "education": analysis.education
            },
            "projects": analysis.projects,
            "skills": analysis.skills,
            "certifications": analysis.certifications,
            "achievements": analysis.achievements
        }
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)

    # Automatically chunk and create embeddings for pgvector RAG
    await _process_and_chunk_resume(db_resume, db, current_user.id)

    return {
        "resume_id": db_resume.id,
        "filename": filename,
        "analysis": analysis
    }

@router.post("/resumes/{resume_id}/process")
async def reprocess_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explicit endpoint to re-chunk and re-embed an existing resume (spec §54).
    """
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    await _process_and_chunk_resume(resume, db, current_user.id)
    chunks_count = db.query(ResumeChunk).filter(ResumeChunk.resume_id == resume_id).count()
    return {"status": "ok", "resume_id": resume_id, "chunks_processed": chunks_count}

@router.get("/resumes")
def list_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all uploaded resumes for the current user."""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "file_type": r.file_type,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "skills_count": len(r.parsed_skills or []),
            "projects_count": len(r.parsed_projects or []),
            "skills_sample": (r.parsed_skills or [])[:6],
            "projects_sample": [p.get("name") for p in (r.parsed_projects or []) if isinstance(p, dict)][:3]
        }
        for r in resumes
    ]

@router.get("/resumes/{resume_id}")
def get_resume_detail(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches full structured profile and chunks for a resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    chunks = db.query(ResumeChunk).filter(ResumeChunk.resume_id == resume_id).all()
    return {
        "id": resume.id,
        "filename": resume.filename,
        "file_type": resume.file_type,
        "skills": resume.parsed_skills,
        "projects": resume.parsed_projects,
        "experience": resume.parsed_experience,
        "education": resume.parsed_education,
        "profile": resume.parsed_profile,
        "chunks_count": len(chunks),
        "chunks": [
            {
                "id": c.id,
                "section": c.section,
                "title": c.chunk_title,
                "text": c.chunk_text,
                "has_embedding": c.embedding_json is not None
            }
            for c in chunks
        ],
        "created_at": resume.created_at.isoformat() if resume.created_at else None
    }

@router.delete("/resumes/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently purges a resume and all associated chunks/vectors (spec §53 Privacy)."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    db.delete(resume)
    db.commit()
    return None

@router.post("/job-description/analyze")
async def analyze_job_description_endpoint(
    req: JobDescriptionTextRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="Job description text is empty")

    analysis = await resume_service.analyze_job_description(req.raw_text)

    db_jd = JobDescription(
        user_id=current_user.id,
        title=req.title,
        company=req.company,
        raw_text=req.raw_text,
        required_skills=analysis.required_skills,
        preferred_skills=analysis.preferred_skills,
        responsibilities=analysis.responsibilities,
        experience_requirements=analysis.experience_requirements
    )
    db.add(db_jd)
    db.commit()
    db.refresh(db_jd)

    return {
        "job_description_id": db_jd.id,
        "analysis": analysis
    }
