"""
routers/salary.py
Feature 12: Salary Intelligence
POST /api/salary/lookup
"""

from fastapi import APIRouter, HTTPException
from models.schemas import SalaryRequest, SalaryResponse
from services import ai_service

router = APIRouter()


@router.post("/lookup", response_model=SalaryResponse)
async def salary_lookup(body: SalaryRequest):
    try:
        result = await ai_service.get_salary_intelligence(
            job_title=body.job_title,
            location=body.location,
            years_exp=body.years_exp,
            industry=body.industry,
            skills=body.skills,
        )
        return SalaryResponse(title=body.job_title, location=body.location, **result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
