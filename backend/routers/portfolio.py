"""
routers/portfolio.py
Feature 13: AI Portfolio Builder
POST /api/portfolio/build
"""

from fastapi import APIRouter, HTTPException
from models.schemas import PortfolioRequest, PortfolioResponse
from services import ai_service

router = APIRouter()


@router.post("/build", response_model=PortfolioResponse)
async def build_portfolio(body: PortfolioRequest):
    try:
        result = await ai_service.build_portfolio(
            full_name=body.full_name,
            title=body.title,
            bio=body.bio,
            skills=body.skills,
            projects=body.projects,
            work_history=body.work_history,
            github_url=body.github_url or "",
            linkedin_url=body.linkedin_url or "",
            email=body.email,
        )
        return PortfolioResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
