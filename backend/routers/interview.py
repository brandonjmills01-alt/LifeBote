"""
routers/interview.py
Feature 7: AI Cover Letter & Outreach Generator
POST /api/interview/outreach
"""

from fastapi import APIRouter, HTTPException
from models.schemas import CoverLetterRequest, CoverLetterResponse
from services import ai_service

router = APIRouter()


@router.post("/outreach", response_model=CoverLetterResponse)
async def generate_outreach(body: CoverLetterRequest):
    """
    Generate cover letters, recruiter messages, LinkedIn notes, or thank-you emails.
    Controlled by body.doc_type.
    """
    try:
        result = await ai_service.generate_outreach(
            resume_text=body.resume_text,
            job_description=body.job_description,
            company_name=body.company_name,
            hiring_manager=body.hiring_manager,
            doc_type=body.doc_type,
            tone=body.tone,
        )
        return CoverLetterResponse(doc_type=body.doc_type, **result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
