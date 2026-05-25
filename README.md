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
