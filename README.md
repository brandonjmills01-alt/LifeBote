# Lifebote — AI Career Platform

Navigate your career with AI-powered tools for job seekers.

---

## Features

| # | Feature | Endpoint |
|---|---------|----------|
| 1 | AI Resume Tailoring | `POST /api/resume/tailor` |
| 2 | Job Matching Engine | `POST /api/jobs/search` |
| 3 | Resume Optimization Score | (included in tailor response) |
| 4 | Human-Reviewed Auto Apply | `POST /api/applications/autofill` |
| 7 | AI Cover Letter & Outreach | `POST /api/interview/outreach` |
| 8 | Application Tracker | `GET/POST/PATCH/DELETE /api/applications` |
| 12 | Salary Intelligence | `POST /api/salary/lookup` |
| 13 | Portfolio Builder | `POST /api/portfolio/build` |
| 17 | Fake Job Detection | (auto-runs on every job search) |
| — | Resume Upload (PDF + DOCX) | `POST /api/resume/upload` |
| — | Resume Profile Extraction  | `POST /api/resume/analyze` |
| — | Resume Export (PDF)        | `POST /api/resume/export/pdf` |
| — | Resume Export (DOCX)       | `POST /api/resume/export/docx` |

### Resume upload / export

- `POST /api/resume/upload` — multipart `file` field. Accepts PDF or DOCX up to 10 MB.
  Returns `{filename, size_bytes, format, text, pages}`. Friendly errors for password-protected,
  image-only, or corrupted files.
- `POST /api/resume/export/pdf` and `/docx` — JSON body `{resume_text, full_name?, contact_email?, contact_phone?, contact_linkedin?}`,
  returns a downloadable file with a `Content-Disposition` filename.
- `POST /api/resume/analyze` — JSON body `{resume_text}`, returns
  `{skills, experience_years, job_titles, seniority, industries, locations}`.
  Used by the Auto Apply tab to match jobs to the resume automatically.

### Auto Apply flow (T3 redesign)

The Auto Apply tab no longer asks the user to fill four text fields. The new flow:

1. User uploads (or pastes) a resume — text is shared with Resume AI and Job Search via `localStorage`.
2. Frontend calls `/api/resume/analyze` to extract a structured profile.
3. Frontend calls `/api/jobs/search` with the resume text **and** the structured profile.
4. User clicks any matched job to open a slide-in panel with the full description, match details,
   and two actions: **Tailor Resume + Apply** or **Auto Apply**.
5. Either action calls `/api/applications/autofill` (the tailor flow also calls `/api/resume/tailor` first)
   and shows pre-filled fields for review with per-field copy buttons.
6. **I've Submitted This** adds the job to the Tracker with status `applied`.

---

## Project Structure

```
lifebote/
├── backend/
│   ├── main.py               # Entry point
│   ├── requirements.txt
│   ├── .env.example          # Copy to .env
│   ├── auth/                 # Auth (bcrypt + JWT)
│   ├── models/schemas.py     # All data shapes
│   ├── routers/              # One file per feature group
│   └── services/             # AI calls + job data
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── AuthContext.jsx
│       ├── AuthPage.jsx
│       ├── App.jsx
│       └── api.js
├── railway.toml              # Railway deployment config
├── nixpacks.toml             # Build instructions for Railway
└── .gitignore
```

---

## Local Development

### Backend
```bash
cd backend
py -3.12 -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env         # Fill in your keys
uvicorn main:app --reload --reload-exclude venv
```
Runs at: `http://localhost:8000`
API docs: `http://localhost:8000/api/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at: `http://localhost:5173`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | JWT signing key. Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `OPENAI_API_KEY` | No | GPT-4o-mini for AI features. Rule-based fallback used if missing. |
| `JSEARCH_API_KEY` | No | Real job listings. Mock data used if missing. |

---

## Works Without API Keys

| Feature | Without Keys | With Keys |
|---------|-------------|-----------|
| Auth | ✅ Full | ✅ Full |
| Job Search | ✅ 100 mock jobs | ✅ Real listings |
| Resume Score | ✅ Rule-based | ✅ AI-powered |
| Resume Tailor | ✅ Keyword-based | ✅ Full AI rewrite |
| Cover Letter | ✅ Template | ✅ Personalized |
| Salary Intel | ✅ Formula-based | ✅ AI analysis |
| Portfolio | ✅ Always works | ✅ Always works |
| Fake Detection | ✅ Rule-based | ✅ AI-enhanced |

---

## Production Notes

- Replace in-memory stores (`auth/store.py`, `routers/applications.py`) with PostgreSQL
- Set `ALLOWED_ORIGINS` env variable to your Railway domain
- Tighten CORS in `main.py` after launch
- The Tracker is currently localStorage-only on the client. The backend exposes
  `GET/POST/PATCH/DELETE /api/applications` and the frontend best-effort-syncs PATCH
  calls, but applications won't survive a logout until the backend store is persistent.

## Known: OneDrive + Python venv

If the project lives inside OneDrive, OneDrive may rename files inside a Python
`venv/` during sync conflicts (e.g. `__init__.py` → `__init__-Brandons-Laptop.py`),
which breaks imports. To avoid this, create the venv outside the OneDrive folder:

```bash
py -3.12 -m venv C:\LifeBoteVenv
C:\LifeBoteVenv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd backend && C:\LifeBoteVenv\Scripts\python.exe -m uvicorn main:app --reload
```
