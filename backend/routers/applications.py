"""
routers/applications.py
Feature 4: Human-Reviewed Auto Apply (autofill)
Feature 8: Application Tracker Dashboard

GET    /api/applications           — list all tracked applications
POST   /api/applications/autofill  — AI pre-fill (registered FIRST to avoid path conflict)
POST   /api/applications           — add a new application
PATCH  /api/applications/{id}      — update status/notes
DELETE /api/applications/{id}      — remove application

IMPORTANT: /autofill must be registered before /{app_id} routes.
FastAPI matches routes top-to-bottom, so 'autofill' would be caught
by /{app_id} if ordered incorrectly.
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from models.schemas import Application, ApplicationCreate, ApplicationUpdate, AutofillRequest, AutofillResponse
from services import ai_service

router = APIRouter()

VALID_STATUSES = {"saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"}

# In-memory store — replace with PostgreSQL for production
_store: dict[str, dict] = {}


@router.post("/autofill", response_model=AutofillResponse)
async def autofill_application(body: AutofillRequest):
    """
    Pre-fill application fields for user review.
    User MUST review and submit manually — we never auto-submit.
    Registered first to prevent 'autofill' being caught by /{app_id}.
    """
    try:
        result = await ai_service.autofill_application(
            body.resume_text, body.job_description, body.job_title, body.company_name
        )
        return AutofillResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=list[Application])
def list_applications():
    apps = list(_store.values())
    apps.sort(key=lambda a: a.get("applied_date") or a.get("id", ""), reverse=True)
    return apps


@router.post("/", response_model=Application, status_code=201)
def create_application(body: ApplicationCreate):
    app_id = str(uuid.uuid4())
    record = {
        "id":             app_id,
        "job_id":         body.job_id,
        "job_title":      body.job_title,
        "company":        body.company,
        "location":       body.location,
        "salary_range":   body.salary_range,
        "status":         "saved",
        "applied_date":   None,
        "follow_up_date": None,
        "notes":          body.notes,
        "next_step":      None,
        "contacts":       [],
    }
    _store[app_id] = record
    return record


@router.patch("/{app_id}", response_model=Application)
def update_application(app_id: str, body: ApplicationUpdate):
    if app_id not in _store:
        raise HTTPException(status_code=404, detail="Application not found.")

    record = _store[app_id]
    if body.status:
        if body.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {VALID_STATUSES}")
        record["status"] = body.status
        if body.status == "applied" and not record["applied_date"]:
            record["applied_date"] = datetime.now(timezone.utc).isoformat()

    if body.notes          is not None: record["notes"]          = body.notes
    if body.follow_up_date is not None: record["follow_up_date"] = body.follow_up_date
    if body.next_step      is not None: record["next_step"]      = body.next_step
    if body.contacts       is not None: record["contacts"]       = body.contacts

    return record


@router.delete("/{app_id}")
def delete_application(app_id: str):
    if app_id not in _store:
        raise HTTPException(status_code=404, detail="Application not found.")
    del _store[app_id]
    return {"deleted": True}
