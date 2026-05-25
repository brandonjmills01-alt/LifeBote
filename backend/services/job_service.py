"""
services/job_service.py
------------------------
Job search — real JSearch API when key is set, mock data otherwise.
parse_job_listing() converts either format into a clean JobListing.
"""

import os
import httpx
from models.schemas import JobListing
from services.job_data import ALL_JOBS


async def search_jobs(query: str, location: str | None, work_mode: str) -> list[dict]:
    api_key = os.environ.get("JSEARCH_API_KEY", "")
    if not api_key or api_key == "placeholder":
        return _filter_mock(query, location, work_mode)

    params = {"query": f"{query} {location or ''}".strip(), "num_pages": "1"}
    if work_mode == "remote":
        params["remote_jobs_only"] = "true"

    async with httpx.AsyncClient() as http:
        resp = await http.get(
            "https://jsearch.p.rapidapi.com/search",
            params=params,
            headers={"X-RapidAPI-Key": api_key, "X-RapidAPI-Host": "jsearch.p.rapidapi.com"},
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json().get("data", [])


def parse_job_listing(raw: dict, match_score: int, match_reasons: list[str], missing_skills: list[str]) -> JobListing:
    salary = None
    if raw.get("job_min_salary") and raw.get("job_max_salary"):
        cur    = raw.get("job_salary_currency", "USD")
        salary = f"{cur} {int(raw['job_min_salary']):,} – {int(raw['job_max_salary']):,}"

    city  = raw.get("job_city", "")
    state = raw.get("job_state", "")
    loc   = f"{city}{', ' + state if state else ''}" if city else "Location not specified"

    return JobListing(
        id=raw.get("job_id", ""),
        title=raw.get("job_title", ""),
        company=raw.get("employer_name", ""),
        location=loc,
        work_mode="remote" if raw.get("job_is_remote") else raw.get("job_work_mode", "onsite"),
        salary_range=salary,
        match_score=match_score,
        match_reasons=match_reasons,
        missing_skills=missing_skills,
        apply_url=raw.get("job_apply_link", "#"),
        posted_date=raw.get("job_posted_at_datetime_utc", ""),
        industry=raw.get("industry", ""),
        is_fake=False,
        fake_signals=[],
    )


def _filter_mock(query: str, location: str | None, work_mode: str) -> list[dict]:
    """Filter mock jobs by work mode and optional keyword. Returns up to 30."""
    jobs = ALL_JOBS

    if work_mode != "any":
        jobs = [j for j in jobs if j["job_work_mode"] == work_mode or (work_mode == "remote" and j["job_is_remote"])]

    if query and query.lower() not in ("", "software engineer"):
        q       = query.lower()
        matched = [j for j in jobs if q in j["job_title"].lower() or q in j.get("industry","").lower()]
        if matched:
            jobs = matched

    if location:
        loc     = location.lower()
        located = [j for j in jobs if loc in j.get("job_city","").lower() or loc in j.get("job_state","").lower() or j.get("job_is_remote")]
        if located:
            jobs = located

    return jobs[:30]
