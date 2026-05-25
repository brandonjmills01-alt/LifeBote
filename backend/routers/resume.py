"""
routers/resume.py
Features 1 & 3: Resume Tailoring + Optimization Score
POST /api/resume/tailor
POST /api/resume/upload-pdf
"""

import io
from fastapi import APIRouter, HTTPException, UploadFile, File
from models.schemas import ResumeTailorRequest, ResumeTailorResponse, ResumeScore
from services import ai_service

router = APIRouter()


@router.post("/tailor", response_model=ResumeTailorResponse)
async def tailor_resume(body: ResumeTailorRequest):
    try:
        r = await ai_service.tailor_resume(
            body.resume_text, body.job_description, body.tone, body.target_role or ""
        )
        return ResumeTailorResponse(
            tailored_resume=r["tailored_resume"],
            changes_summary=r.get("changes_summary", []),
            resume_versions=r.get("resume_versions", {}),
            score=ResumeScore(
                ats_score=r["ats_score"],
                keyword_score=r["keyword_score"],
                readability_score=r["readability_score"],
                overall_score=r["overall_score"],
                missing_keywords=r.get("missing_keywords", []),
                suggestions=r.get("suggestions", []),
                strengths=r.get("strengths", []),
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    import pdfplumber
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    contents = await file.read()
    try:
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            page_count = len(pdf.pages)
            text = "\n".join(p.extract_text() or "" for p in pdf.pages)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse PDF: {e}")
    if not text.strip():
        raise HTTPException(status_code=422, detail="PDF appears empty or is image-only.")
    return {"text": text, "pages": page_count}
