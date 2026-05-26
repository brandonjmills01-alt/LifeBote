"""
routers/jobs.py
Feature 2: Job Matching Engine
Feature 17: Fake Job Detection (runs on every result automatically)
POST /api/jobs/search
POST /api/jobs/check-fake
"""

import asyncio
from fastapi import APIRouter, HTTPException
from models.schemas import JobSearchRequest, JobSearchResponse, FakeJobCheckRequest, FakeJobCheckResponse
from services import ai_service, job_service

router = APIRouter()


@router.post("/search", response_model=JobSearchResponse)
async def search_jobs(body: JobSearchRequest):
    # Prefer the structured profile when present: it gives the user the best
    # default query even if they didn't type a job title.
    query = body.job_title or ""
    if not query and body.resume_profile and body.resume_profile.job_titles:
        query = body.resume_profile.job_titles[0]
    if not query:
        query = "professional"

    # Use profile locations as a default when the user didn't specify one
    location = body.location
    if not location and body.resume_profile and body.resume_profile.locations:
        first = body.resume_profile.locations[0]
        if first.lower() != "remote":
            location = first

    raw_jobs = await job_service.search_jobs(
        query=query,
        location=location,
        work_mode=body.work_mode,
    )
    if not raw_jobs:
        return JobSearchResponse(jobs=[], total=0)

    # Build the text used for AI scoring. Profile-only callers (Auto Apply)
    # still get rich matching because the profile is rendered as text.
    scoring_text = body.resume_text or _profile_to_scoring_text(body.resume_profile)

    # Score all jobs + check for fakes — both run in parallel
    score_tasks    = [ai_service.score_job_match(scoring_text, str(j)) for j in raw_jobs]
    fake_tasks     = [
        ai_service.check_fake_job(
            j.get("job_title",""), j.get("employer_name",""),
            j.get("job_description",""), None, j.get("job_apply_link",""),
        )
        for j in raw_jobs
    ]
    scores, fakes = await asyncio.gather(
        asyncio.gather(*score_tasks, return_exceptions=True),
        asyncio.gather(*fake_tasks, return_exceptions=True),
    )

    listings = []
    for raw, score_r, fake_r in zip(raw_jobs, scores, fakes):
        match_score   = score_r.get("match_score", 0) if not isinstance(score_r, Exception) else 0
        match_reasons = score_r.get("match_reasons", []) if not isinstance(score_r, Exception) else []
        missing       = score_r.get("missing_skills", []) if not isinstance(score_r, Exception) else []
        is_fake       = fake_r.get("is_suspicious", False) if not isinstance(fake_r, Exception) else False
        fake_signals  = fake_r.get("signals", []) if not isinstance(fake_r, Exception) else []

        listing           = job_service.parse_job_listing(raw, match_score, match_reasons, missing)
        listing.is_fake   = is_fake
        listing.fake_signals = fake_signals
        listings.append(listing)

    listings.sort(key=lambda j: j.match_score, reverse=True)
    return JobSearchResponse(jobs=listings, total=len(listings))


def _profile_to_scoring_text(profile) -> str:
    """Flatten a ResumeProfile into the kind of free-form text the scorer expects."""
    if not profile:
        return ""
    bits = []
    if profile.job_titles: bits.append(", ".join(profile.job_titles))
    bits.append(f"{profile.experience_years} years experience · {profile.seniority} level")
    if profile.skills:     bits.append("Skills: " + ", ".join(profile.skills))
    if profile.industries: bits.append("Industries: " + ", ".join(profile.industries))
    return "\n".join(bits)


@router.post("/check-fake", response_model=FakeJobCheckResponse)
async def check_fake_job(body: FakeJobCheckRequest):
    try:
        result = await ai_service.check_fake_job(
            body.job_title, body.company_name, body.job_description,
            body.salary_range, body.apply_url,
        )
        return FakeJobCheckResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
