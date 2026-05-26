"""
models/schemas.py
-----------------
All Pydantic request/response models for the Lifebote platform.
One file = the full data contract visible at a glance.
"""

from __future__ import annotations
from enum import Enum
from typing import Literal, Optional
from pydantic import BaseModel, Field


# ── Feature 1 & 3: Resume Tailoring + Optimization Score ─────────────────────

class ResumeTailorRequest(BaseModel):
    resume_text:     str = Field(..., description="User's current resume as plain text")
    job_description: str = Field(..., description="Target job description")
    tone: Literal["professional", "technical", "creative"] = "professional"
    target_role:     Optional[str] = None


class ResumeScore(BaseModel):
    ats_score:          int = Field(..., ge=0, le=100)
    keyword_score:      int = Field(..., ge=0, le=100)
    readability_score:  int = Field(..., ge=0, le=100)
    overall_score:      int = Field(..., ge=0, le=100)
    missing_keywords:   list[str]
    suggestions:        list[str]
    strengths:          list[str]


class ResumeTailorResponse(BaseModel):
    tailored_resume:  str
    score:            ResumeScore
    changes_summary:  list[str]
    resume_versions:  dict[str, str]   # e.g. {"technical": "...", "executive": "..."}


# ── T2: Resume Upload / Export ────────────────────────────────────────────────

class ResumeUploadResponse(BaseModel):
    filename:   str
    size_bytes: int
    format:     Literal["pdf", "docx"]
    text:       str
    pages:      Optional[int] = None


class ResumeExportRequest(BaseModel):
    resume_text:       str
    full_name:         Optional[str] = None
    contact_email:     Optional[str] = None
    contact_phone:     Optional[str] = None
    contact_linkedin:  Optional[str] = None


# ── T3: Structured Profile (drives Auto Apply auto-matching) ─────────────────

SeniorityLevel = Literal["entry", "junior", "mid", "senior", "lead", "principal", "executive"]


class ResumeProfile(BaseModel):
    skills:           list[str] = []
    experience_years: int       = Field(default=0, ge=0, le=60)
    job_titles:       list[str] = []
    seniority:        SeniorityLevel = "mid"
    industries:       list[str] = []
    locations:        list[str] = []


class ResumeAnalyzeRequest(BaseModel):
    resume_text: str


# ── Feature 2: Job Matching ───────────────────────────────────────────────────

class JobSearchRequest(BaseModel):
    # resume_text remains required for backward compatibility with the existing
    # Job Search tab. The Auto Apply tab also sends a richer resume_profile when
    # available so the backend can build a stronger query.
    resume_text:    str
    job_title:      Optional[str] = None
    location:       Optional[str] = None
    work_mode:      Literal["remote", "hybrid", "onsite", "any"] = "any"
    salary_min:     Optional[int] = None
    salary_max:     Optional[int] = None
    industries:     list[str]     = []
    resume_profile: Optional[ResumeProfile] = None


class JobListing(BaseModel):
    id:             str
    title:          str
    company:        str
    location:       str
    work_mode:      str
    salary_range:   Optional[str]
    match_score:    int = Field(..., ge=0, le=100)
    match_reasons:  list[str]
    missing_skills: list[str]
    apply_url:      str
    posted_date:    str
    industry:       str
    is_fake:        bool = False
    fake_signals:   list[str] = []   # Feature 17: signals that triggered the flag


class JobSearchResponse(BaseModel):
    jobs:  list[JobListing]
    total: int


# ── Feature 4: Human-Reviewed Auto Apply ──────────────────────────────────────

class AutofillRequest(BaseModel):
    # Either resume_text OR resume_profile may be provided.
    # resume_text is the historical path; resume_profile is the new T3 path
    # used by the redesigned Auto Apply flow.
    resume_text:     Optional[str] = None
    resume_profile:  Optional[ResumeProfile] = None
    job_description: str
    job_title:       str
    company_name:    str
    job_id:          Optional[str] = None   # opaque identifier carried back to the client


class AutofillResponse(BaseModel):
    """
    Pre-filled application fields for user review.
    We NEVER auto-submit — the user must review and click submit themselves.
    This is by design: prevents spam and protects the user's reputation.
    """
    full_name:       str
    email:           str
    phone:           str
    linkedin_url:    str
    summary:         str
    work_experience: list[dict]
    education:       list[dict]
    skills:          list[str]
    cover_letter:    str
    ready_to_review: bool = True


# ── Feature 7: Cover Letter Generator ────────────────────────────────────────

class CoverLetterRequest(BaseModel):
    resume_text:     str
    job_description: str
    company_name:    str
    hiring_manager:  Optional[str] = None
    doc_type: Literal[
        "cover_letter",
        "recruiter_message",
        "linkedin_connection",
        "thank_you_email"
    ] = "cover_letter"
    tone: Literal["formal", "conversational", "enthusiastic"] = "formal"


class CoverLetterResponse(BaseModel):
    content:      str
    subject_line: str
    doc_type:     str


# ── Feature 8: Application Tracker ───────────────────────────────────────────

class ApplicationStatus(str, Enum):
    SAVED     = "saved"
    APPLIED   = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER     = "offer"
    REJECTED  = "rejected"
    WITHDRAWN = "withdrawn"


class Application(BaseModel):
    id:              str
    job_id:          str
    job_title:       str
    company:         str
    location:        str
    salary_range:    Optional[str]
    status:          str
    applied_date:    Optional[str]
    follow_up_date:  Optional[str]
    notes:           Optional[str]
    next_step:       Optional[str]
    contacts:        list[str] = []


class ApplicationCreate(BaseModel):
    job_id:       str
    job_title:    str
    company:      str
    location:     str = ""
    salary_range: Optional[str] = None
    notes:        Optional[str] = None


class ApplicationUpdate(BaseModel):
    status:         Optional[str] = None
    notes:          Optional[str] = None
    follow_up_date: Optional[str] = None
    next_step:      Optional[str] = None
    contacts:       Optional[list[str]] = None


# ── Feature 12: Salary Intelligence ──────────────────────────────────────────

class SalaryRequest(BaseModel):
    job_title:   str
    location:    str
    years_exp:   int = Field(default=3, ge=0, le=40)
    industry:    Optional[str] = None
    skills:      list[str] = []


class SalaryResponse(BaseModel):
    title:               str
    location:            str
    salary_low:          int
    salary_median:       int
    salary_high:         int
    salary_range_label:  str
    market_demand:       Literal["low", "medium", "high", "very high"]
    competition_level:   Literal["low", "medium", "high", "very high"]
    cost_of_living_note: str
    negotiation_tips:    list[str]
    top_paying_cities:   list[dict]
    comparable_roles:    list[dict]


# ── Feature 13: Portfolio Builder ────────────────────────────────────────────

class PortfolioRequest(BaseModel):
    full_name:      str
    title:          str
    bio:            str
    skills:         list[str]
    projects:       list[dict]   # [{name, description, url, tech_stack}]
    work_history:   list[dict]   # [{company, role, dates, bullets}]
    github_url:     Optional[str] = None
    linkedin_url:   Optional[str] = None
    email:          str


class PortfolioResponse(BaseModel):
    html:      str    # Full standalone HTML portfolio page
    css_theme: str    # The theme name used
    preview_url: Optional[str] = None


# ── Feature 17: Fake Job Detection ───────────────────────────────────────────

class FakeJobCheckRequest(BaseModel):
    job_title:       str
    company_name:    str
    job_description: str
    salary_range:    Optional[str] = None
    apply_url:       Optional[str] = None


class FakeJobCheckResponse(BaseModel):
    is_suspicious:   bool
    risk_level:      Literal["safe", "low", "medium", "high"]
    signals:         list[str]   # Specific reasons why it was flagged
    recommendation:  str
