"""
Lifebote — AI Career Platform
main.py — Backend Entry Point
------------------------------
Start locally:
    uvicorn main:app --reload --reload-exclude venv

In production (Railway):
    uvicorn main:app --host 0.0.0.0 --port $PORT
"""

from dotenv import load_dotenv
load_dotenv()  # Load .env before any router imports

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from routers import auth, resume, jobs, applications, interview, salary, portfolio

app = FastAPI(
    title="Lifebote API",
    description="AI-powered career navigation platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# In production Railway serves everything from one domain so CORS is relaxed.
# In development the React dev server runs on a different port.

allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten this in production after launch
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routers ───────────────────────────────────────────────────────────────

app.include_router(auth.router,         prefix="/api/auth",         tags=["Auth"])
app.include_router(resume.router,       prefix="/api/resume",       tags=["Resume"])
app.include_router(jobs.router,         prefix="/api/jobs",         tags=["Jobs"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(interview.router,    prefix="/api/interview",    tags=["Interview"])
app.include_router(salary.router,       prefix="/api/salary",       tags=["Salary"])
app.include_router(portfolio.router,    prefix="/api/portfolio",    tags=["Portfolio"])


# ── Serve React Frontend (Production) ────────────────────────────────────────
# When deployed on Railway, the React app is built into /frontend/dist.
# FastAPI serves those static files so we only need one Railway service.

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/")
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str = ""):
        # Don't intercept API routes
        if full_path.startswith("api"):
            return {"detail": "Not found"}
        index = os.path.join(FRONTEND_DIST, "index.html")
        return FileResponse(index)
else:
    @app.get("/")
    def health_check():
        return {"status": "ok", "service": "Lifebote API", "mode": "development"}
