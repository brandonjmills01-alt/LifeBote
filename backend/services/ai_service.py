"""
services/ai_service.py
-----------------------
All AI calls for Lifebote.

Two modes:
  1. AI mode   — real OpenAI calls when OPENAI_API_KEY is set
  2. Fallback  — rich mock data so the demo works without any API key

To swap AI providers: only change _chat_json().
All feature functions stay the same.
"""

import json
import os
import re

MODEL = "gpt-4o-mini"


def _has_key() -> bool:
    key = os.environ.get("OPENAI_API_KEY", "")
    return bool(key) and key not in ("sk-placeholder", "placeholder", "")


def _get_client():
    from openai import AsyncOpenAI
    return AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


async def _chat_json(system: str, user: str) -> dict:
    client = _get_client()
    res    = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(res.choices[0].message.content)


# ── Feature 1 & 3: Resume Tailoring + Score ───────────────────────────────────

TAILOR_SYSTEM = """
You are an expert resume writer and ATS optimization specialist.
Rewrite the resume to match the job description precisely.
Never invent facts. Use strong action verbs. Match the tone requested.
Return ONLY valid JSON:
{
  "tailored_resume": "full rewritten resume",
  "ats_score": 85,
  "keyword_score": 78,
  "readability_score": 90,
  "overall_score": 84,
  "missing_keywords": ["keyword1"],
  "suggestions": ["suggestion1"],
  "strengths": ["strength1"],
  "changes_summary": ["change1"],
  "resume_versions": {
    "technical": "more technical version",
    "executive": "executive summary version"
  }
}
"""

async def tailor_resume(resume_text: str, job_description: str, tone: str, target_role: str) -> dict:
    if _has_key():
        prompt = f"Tone: {tone}\nTarget Role: {target_role or 'not specified'}\n\n--- RESUME ---\n{resume_text}\n\n--- JOB ---\n{job_description}"
        return await _chat_json(TAILOR_SYSTEM, prompt)

    # ── Fallback: rule-based scoring ──────────────────────────────────────
    from services.resume_scorer import score_resume, tailor_basic
    scores  = score_resume(resume_text, job_description)
    tailored = tailor_basic(resume_text, job_description)
    return {
        "tailored_resume":  tailored,
        "changes_summary":  ["Flagged weak phrases", "Added keyword suggestions", "Connect OpenAI key for full AI rewriting"],
        "strengths":        ["Resume has clear structure", "Contains relevant experience"],
        "resume_versions":  {"technical": tailored, "executive": tailored},
        **scores,
    }


# ── Feature 2: Job Match Scoring ──────────────────────────────────────────────

MATCH_SYSTEM = """
Score how well a resume matches a job listing.
Return ONLY valid JSON:
{
  "match_score": 82,
  "match_reasons": ["Strong Python experience", "SQL expertise matches requirement"],
  "missing_skills": ["Kubernetes", "Terraform"]
}
"""

async def score_job_match(resume_text: str, job_description: str) -> dict:
    if _has_key():
        return await _chat_json(MATCH_SYSTEM, f"--- RESUME ---\n{resume_text}\n\n--- JOB ---\n{job_description}")

    from services.resume_scorer import score_resume
    scores = score_resume(resume_text, job_description)
    return {
        "match_score":    scores["overall_score"],
        "match_reasons":  [f"Keyword match: {scores['keyword_score']}%", "Experience level aligns"],
        "missing_skills": scores["missing_keywords"][:4],
    }


# ── T3 (Auto Apply Redesign): Resume Profile Extraction ──────────────────────

ANALYZE_SYSTEM = """
Extract a structured profile from a resume. Be conservative — never invent.
Choose seniority from: entry, junior, mid, senior, lead, principal, executive.
Return ONLY valid JSON:
{
  "skills":           ["Python", "AWS"],
  "experience_years": 7,
  "job_titles":       ["Software Engineer", "Backend Engineer"],
  "seniority":        "senior",
  "industries":       ["Technology", "Finance"],
  "locations":        ["San Francisco, CA", "Remote"]
}
"""

# Rule-based fallback: keep additions cheap and predictable.
_SENIORITY_KEYWORDS = [
    ("executive", ["chief executive", "cto", "cfo", "ceo", "vp ", "vice president", "head of"]),
    ("principal", ["principal "]),
    ("lead",      ["lead ", " lead,", "engineering lead", "team lead", "tech lead"]),
    ("senior",    ["senior ", "sr. ", "sr ", "staff "]),
    ("junior",    ["junior ", "jr. ", "jr ", "entry-level", "associate "]),
    ("entry",     ["intern", "trainee", "graduate"]),
]

_TITLE_RE = re.compile(
    r"\b(software engineer|backend engineer|frontend engineer|full[\s-]?stack engineer|"
    r"data (?:scientist|analyst|engineer)|machine learning engineer|product manager|"
    r"project manager|program manager|designer|ux designer|ui designer|"
    r"marketing manager|sales (?:manager|representative)|recruiter|"
    r"financial analyst|accountant|consultant|attorney|teacher|nurse|"
    r"devops engineer|site reliability engineer|qa engineer|security engineer|"
    r"architect|developer|engineer|analyst|manager|director)\b",
    re.IGNORECASE,
)

_LOCATION_RE = re.compile(
    r"\b([A-Z][a-zA-Z\.]+(?:\s+[A-Z][a-zA-Z\.]+){0,2}),\s*([A-Z]{2})\b"
)

_INDUSTRY_HINTS = {
    "Technology":     ["python", "java", "aws", "docker", "kubernetes", "react", "saas", "software", "engineer"],
    "Healthcare":     ["nurse", "patient", "clinic", "hospital", "medical", "pharma"],
    "Finance":        ["finance", "investment", "trading", "accounting", "cpa", "audit"],
    "Education":      ["teacher", "professor", "curriculum", "school", "university", "edtech"],
    "Marketing":      ["marketing", "seo", "campaign", "brand", "content", "social media"],
    "Legal":          ["attorney", "paralegal", "litigation", "compliance", "law firm"],
    "Construction":   ["construction", "civil engineer", "structural", "hvac"],
    "Retail":         ["retail", "merchandise", "store manager", "e-commerce", "shopify"],
    "Non-Profit":     ["non-profit", "nonprofit", "grant", "foundation", "ngo"],
    "Media":          ["video", "editor", "journalism", "newsroom", "broadcast"],
    "Aerospace":      ["aerospace", "satellite", "defense", "uav"],
    "Energy":         ["solar", "petroleum", "renewable", "battery"],
    "Human Resources":["talent acquisition", "people operations", "recruiting", "hrbp"],
    "Consulting":     ["consultant", "advisory"],
}


_ACRONYM_SKILLS = {"aws", "gcp", "sql", "ci/cd", "qa", "ml", "ai", "api", "css", "html", "ios"}
_SPECIAL_SKILL_CASE = {
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "nodejs":     "Node.js",
    "node":       "Node.js",
    "c++":        "C++",
    "fastapi":    "FastAPI",
    "postgresql": "PostgreSQL",
    "mongodb":    "MongoDB",
    "powerbi":    "Power BI",
    "power bi":   "Power BI",
}


def _normalize_skill(s: str) -> str:
    low = s.lower()
    if low in _SPECIAL_SKILL_CASE: return _SPECIAL_SKILL_CASE[low]
    if low in _ACRONYM_SKILLS:     return low.upper()
    return s.title() if s.islower() else s


def _rule_based_analyze(resume_text: str) -> dict:
    text = resume_text or ""
    lower = text.lower()

    # Skills via the existing SKILL_RE, normalized so known acronyms stay uppercase.
    from services.resume_scorer import extract_keywords
    skills = sorted({_normalize_skill(s) for s in extract_keywords(text)}, key=str.lower)

    # Years of experience: take the largest "X years" mention, then sanity-clamp
    yrs = [int(m.group(1)) for m in re.finditer(r"(\d{1,2})\+?\s+years?", lower)]
    experience_years = min(max(yrs) if yrs else 0, 50)

    # Job titles — dedupe while preserving order
    seen: set[str] = set()
    job_titles: list[str] = []
    for m in _TITLE_RE.finditer(text):
        t = " ".join(w.capitalize() for w in m.group(0).split())
        if t.lower() not in seen:
            seen.add(t.lower())
            job_titles.append(t)
    job_titles = job_titles[:8]

    # Seniority: highest match wins
    seniority = "mid"
    for label, hints in _SENIORITY_KEYWORDS:
        if any(h in lower for h in hints):
            seniority = label
            break
    if seniority == "mid" and experience_years >= 8:
        seniority = "senior"
    elif seniority == "mid" and experience_years <= 2 and experience_years > 0:
        seniority = "junior"

    # Industries: any hint match counts
    industries = [ind for ind, hints in _INDUSTRY_HINTS.items() if any(h in lower for h in hints)]

    # Locations — common "City, ST" pattern. Always include "Remote" if mentioned.
    locations: list[str] = []
    seen_locs: set[str] = set()
    for m in _LOCATION_RE.finditer(text):
        loc = f"{m.group(1)}, {m.group(2)}"
        if loc.lower() not in seen_locs:
            seen_locs.add(loc.lower())
            locations.append(loc)
    if "remote" in lower and "Remote" not in locations:
        locations.append("Remote")
    locations = locations[:5]

    return {
        "skills":           skills[:20],
        "experience_years": experience_years,
        "job_titles":       job_titles,
        "seniority":        seniority,
        "industries":       industries[:5],
        "locations":        locations,
    }


async def analyze_resume(resume_text: str) -> dict:
    """Extract a structured profile. Falls back to rules when no AI key."""
    if _has_key():
        try:
            result = await _chat_json(ANALYZE_SYSTEM, f"--- RESUME ---\n{resume_text}")
            # Coerce shape so the response model accepts it
            result.setdefault("skills", [])
            result.setdefault("experience_years", 0)
            result.setdefault("job_titles", [])
            result.setdefault("seniority", "mid")
            result.setdefault("industries", [])
            result.setdefault("locations", [])
            return result
        except Exception:
            pass  # Fall through to rule-based
    return _rule_based_analyze(resume_text)


# ── Feature 4: Auto-fill Application ──────────────────────────────────────────

AUTOFILL_SYSTEM = """
Pre-fill job application fields from a resume. Be accurate — never invent data.
ALWAYS set ready_to_review = true. Never auto-submit.
Return ONLY valid JSON:
{
  "full_name": "...",
  "email": "...",
  "phone": "...",
  "linkedin_url": "...",
  "summary": "2-3 tailored sentences",
  "work_experience": [{"title": "...", "company": "...", "dates": "...", "bullets": ["..."]}],
  "education": [{"degree": "...", "school": "...", "year": "..."}],
  "skills": ["skill1"],
  "cover_letter": "personalized cover letter",
  "ready_to_review": true
}
"""

async def autofill_application(resume_text: str, job_description: str, job_title: str, company: str) -> dict:
    if _has_key():
        prompt = f"Job: {job_title} at {company}\n\n--- RESUME ---\n{resume_text}\n\n--- JOB ---\n{job_description}"
        return await _chat_json(AUTOFILL_SYSTEM, prompt)

    return {
        "full_name":       "Add your name",
        "email":           "Add your email",
        "phone":           "Add your phone",
        "linkedin_url":    "https://linkedin.com/in/yourprofile",
        "summary":         f"Experienced professional applying for {job_title} at {company}. Add OpenAI key for personalized AI autofill.",
        "work_experience": [{"title": "Your Role", "company": "Your Company", "dates": "2022–Present", "bullets": ["Add your accomplishments here"]}],
        "education":       [{"degree": "Your Degree", "school": "Your University", "year": "2020"}],
        "skills":          ["Add", "Your", "Skills"],
        "cover_letter":    f"Dear Hiring Team at {company},\n\nI am applying for the {job_title} position. Connect an OpenAI API key for a fully personalized cover letter.\n\nBest regards",
        "ready_to_review": True,
    }


# ── Feature 7: Cover Letter / Outreach Generator ──────────────────────────────

COVER_LETTER_SYSTEM = """
Write professional career outreach content. Be specific, engaging, and match the tone.
Return ONLY valid JSON:
{
  "content": "full content here",
  "subject_line": "email subject line"
}
"""

DOC_TYPE_INSTRUCTIONS = {
    "cover_letter":       "Write a professional cover letter (3-4 paragraphs).",
    "recruiter_message":  "Write a concise recruiter outreach message (under 150 words).",
    "linkedin_connection": "Write a LinkedIn connection request note (under 300 characters).",
    "thank_you_email":    "Write a post-interview thank you email (2-3 paragraphs).",
}

async def generate_outreach(
    resume_text: str,
    job_description: str,
    company_name: str,
    hiring_manager: str,
    doc_type: str,
    tone: str,
) -> dict:
    if _has_key():
        instructions = DOC_TYPE_INSTRUCTIONS.get(doc_type, DOC_TYPE_INSTRUCTIONS["cover_letter"])
        prompt = f"{instructions}\nCompany: {company_name}\nHiring Manager: {hiring_manager or 'Unknown'}\nTone: {tone}\n\n--- RESUME ---\n{resume_text}\n\n--- JOB ---\n{job_description}"
        return await _chat_json(COVER_LETTER_SYSTEM, prompt)

    templates = {
        "cover_letter":       (f"Dear {hiring_manager or 'Hiring Manager'} at {company_name},\n\nI am writing to express my strong interest in this role. My background and skills make me a strong candidate for your team.\n\nConnect an OpenAI API key for a fully personalized cover letter.\n\nBest regards", f"Application – {company_name}"),
        "recruiter_message":  (f"Hi {hiring_manager or 'there'},\n\nI came across an opening at {company_name} and would love to connect. My experience aligns well with what you're looking for. Would you be open to a quick chat?\n\nBest,", "Exploring Opportunities"),
        "linkedin_connection": (f"Hi {hiring_manager or 'there'}, I'm interested in opportunities at {company_name} and would love to connect!", ""),
        "thank_you_email":    (f"Dear {hiring_manager or 'Hiring Manager'},\n\nThank you for taking the time to speak with me today about the role at {company_name}. I'm very excited about the opportunity.\n\nBest regards,", f"Thank You – Interview at {company_name}"),
    }
    content, subject = templates.get(doc_type, templates["cover_letter"])
    return {"content": content, "subject_line": subject}


# ── Feature 12: Salary Intelligence ──────────────────────────────────────────

SALARY_SYSTEM = """
Provide detailed salary intelligence for a job title and location.
Return ONLY valid JSON:
{
  "salary_low": 85000,
  "salary_median": 110000,
  "salary_high": 145000,
  "salary_range_label": "$85K – $145K",
  "market_demand": "high",
  "competition_level": "medium",
  "cost_of_living_note": "San Francisco has a cost of living 80% above the national average.",
  "negotiation_tips": ["tip1", "tip2", "tip3"],
  "top_paying_cities": [{"city": "San Francisco, CA", "median": 145000}],
  "comparable_roles": [{"title": "Senior Analyst", "median": 115000}]
}
"""

async def get_salary_intelligence(
    job_title: str,
    location: str,
    years_exp: int,
    industry: str,
    skills: list[str],
) -> dict:
    if _has_key():
        prompt = f"Job: {job_title}\nLocation: {location}\nYears Experience: {years_exp}\nIndustry: {industry or 'General'}\nSkills: {', '.join(skills)}"
        return await _chat_json(SALARY_SYSTEM, prompt)

    # Realistic mock salary data by experience level
    base = 60000 + (years_exp * 5000)
    return {
        "salary_low":          int(base * 0.8),
        "salary_median":       base,
        "salary_high":         int(base * 1.35),
        "salary_range_label":  f"${int(base*0.8):,} – ${int(base*1.35):,}",
        "market_demand":       "high" if years_exp > 3 else "medium",
        "competition_level":   "medium",
        "cost_of_living_note": f"Salaries in {location} reflect local market conditions. Research cost of living before negotiating.",
        "negotiation_tips": [
            "Research the company's funding stage and revenue — public companies pay differently than startups.",
            f"The median for {job_title} in {location} is around ${base:,}. Use that as your anchor.",
            "Never give a number first. Ask: 'What is the budgeted range for this role?'",
            "Negotiate the full package: base salary, equity, bonus, PTO, remote flexibility.",
            "Get any verbal offer in writing before resigning from your current role.",
        ],
        "top_paying_cities": [
            {"city": "San Francisco, CA", "median": int(base * 1.4)},
            {"city": "New York, NY",      "median": int(base * 1.3)},
            {"city": "Seattle, WA",       "median": int(base * 1.25)},
            {"city": "Austin, TX",        "median": int(base * 1.1)},
            {"city": "Chicago, IL",       "median": int(base * 1.05)},
        ],
        "comparable_roles": [
            {"title": f"Senior {job_title}",  "median": int(base * 1.3)},
            {"title": f"Lead {job_title}",    "median": int(base * 1.5)},
            {"title": f"Junior {job_title}",  "median": int(base * 0.75)},
        ],
    }


# ── Feature 13: Portfolio Builder ─────────────────────────────────────────────

async def build_portfolio(
    full_name: str,
    title: str,
    bio: str,
    skills: list[str],
    projects: list[dict],
    work_history: list[dict],
    github_url: str,
    linkedin_url: str,
    email: str,
) -> dict:
    """
    Generate a complete standalone HTML portfolio.
    This is pure Python — no AI key needed. Always works.
    """
    skills_html   = "".join(f'<span class="skill-tag">{s}</span>' for s in skills)
    projects_html = ""
    for p in projects:
        tech = "".join(f'<span class="tech-tag">{t}</span>' for t in p.get("tech_stack", []))
        url_btn = f'<a href="{p["url"]}" target="_blank" class="proj-link">View Project →</a>' if p.get("url") else ""
        projects_html += f"""
        <div class="project-card">
            <h3>{p.get("name","Project")}</h3>
            <p>{p.get("description","")}</p>
            <div class="tech-stack">{tech}</div>
            {url_btn}
        </div>"""

    work_html = ""
    for w in work_history:
        bullets = "".join(f"<li>{b}</li>" for b in w.get("bullets", []))
        work_html += f"""
        <div class="work-item">
            <div class="work-header">
                <div><strong>{w.get("role","")}</strong> · {w.get("company","")}</div>
                <span class="work-dates">{w.get("dates","")}</span>
            </div>
            <ul>{bullets}</ul>
        </div>"""

    github_link   = f'<a href="{github_url}" target="_blank">GitHub</a>' if github_url else ""
    linkedin_link = f'<a href="{linkedin_url}" target="_blank">LinkedIn</a>' if linkedin_url else ""
    social_links  = " · ".join(filter(None, [github_link, linkedin_link]))

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>{full_name} — Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
  :root {{
    --navy:  #0A2342;
    --green: #00A86B;
    --white: #FFFFFF;
    --gray:  #F4F6F9;
    --text:  #1A1A2E;
    --muted: #6B7280;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'DM Sans', sans-serif; color: var(--text); background: var(--white); }}
  a {{ color: var(--green); text-decoration: none; }}
  a:hover {{ text-decoration: underline; }}

  .hero {{
    background: var(--navy);
    color: var(--white);
    padding: 80px 40px;
    text-align: center;
  }}
  .hero h1 {{
    font-family: 'DM Serif Display', serif;
    font-size: 3rem;
    margin-bottom: 12px;
  }}
  .hero .title {{ font-size: 1.2rem; color: var(--green); margin-bottom: 16px; font-weight: 500; }}
  .hero .bio {{ max-width: 600px; margin: 0 auto 24px; color: #CBD5E1; line-height: 1.7; }}
  .hero .social {{ font-size: 14px; color: #94A3B8; }}
  .hero .social a {{ color: #60A5FA; }}
  .hero .contact-btn {{
    display: inline-block;
    background: var(--green);
    color: white;
    padding: 12px 28px;
    border-radius: 6px;
    font-weight: 600;
    margin-top: 20px;
    font-size: 15px;
  }}

  section {{ padding: 64px 40px; max-width: 960px; margin: 0 auto; }}
  h2 {{
    font-family: 'DM Serif Display', serif;
    font-size: 1.8rem;
    color: var(--navy);
    margin-bottom: 32px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--green);
    display: inline-block;
  }}

  .skills-grid {{ display: flex; flex-wrap: wrap; gap: 10px; }}
  .skill-tag {{
    background: var(--navy);
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
  }}

  .projects-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }}
  .project-card {{
    background: var(--gray);
    border-radius: 12px;
    padding: 24px;
    border-left: 4px solid var(--green);
  }}
  .project-card h3 {{ font-size: 1rem; font-weight: 700; margin-bottom: 8px; color: var(--navy); }}
  .project-card p {{ font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 12px; }}
  .tech-stack {{ display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }}
  .tech-tag {{ background: #E0E7FF; color: #3730A3; padding: 3px 10px; border-radius: 10px; font-size: 12px; }}
  .proj-link {{ font-size: 13px; font-weight: 600; color: var(--green); }}

  .work-item {{ margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid #E5E7EB; }}
  .work-item:last-child {{ border-bottom: none; }}
  .work-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 4px; }}
  .work-item strong {{ color: var(--navy); font-size: 15px; }}
  .work-dates {{ color: var(--muted); font-size: 13px; }}
  .work-item ul {{ padding-left: 20px; }}
  .work-item li {{ font-size: 14px; color: #374151; line-height: 1.7; margin-bottom: 4px; }}

  footer {{ background: var(--navy); color: #94A3B8; text-align: center; padding: 32px 20px; font-size: 13px; }}
  footer span {{ color: var(--green); font-weight: 600; }}

  @media (max-width: 600px) {{
    .hero h1 {{ font-size: 2rem; }}
    section {{ padding: 40px 20px; }}
  }}
</style>
</head>
<body>

<div class="hero">
  <h1>{full_name}</h1>
  <div class="title">{title}</div>
  <p class="bio">{bio}</p>
  <div class="social">{social_links}</div>
  <a href="mailto:{email}" class="contact-btn">Get In Touch</a>
</div>

<section>
  <h2>Skills</h2>
  <div class="skills-grid">{skills_html}</div>
</section>

<section style="background: #F4F6F9; max-width: 100%; padding: 64px 40px;">
  <div style="max-width: 960px; margin: 0 auto;">
    <h2>Projects</h2>
    <div class="projects-grid">{projects_html}</div>
  </div>
</section>

<section>
  <h2>Experience</h2>
  {work_html}
</section>

<footer>
  Built with <span>Lifebote</span> · {full_name} · <a href="mailto:{email}" style="color:#60A5FA;">{email}</a>
</footer>

</body>
</html>"""

    return {"html": html, "css_theme": "lifebote-navy", "preview_url": None}


# ── Feature 17: Fake Job Detection ───────────────────────────────────────────

FAKE_JOB_SYSTEM = """
Analyze this job listing for signs of fraud or being fake.
Look for: vague descriptions, no company name, unrealistic pay, 
requests for personal info upfront, generic email domains, 
reposted ghost jobs, and too-good-to-be-true language.
Return ONLY valid JSON:
{
  "is_suspicious": true,
  "risk_level": "high",
  "signals": ["No company name specified", "Requests SSN before interview"],
  "recommendation": "Do not apply. This listing shows multiple fraud signals."
}
"""

# Rule-based signals — works without API key
SCAM_SIGNALS = {
    "no experience required, earn $5000/week":        "Unrealistic pay promise for no experience",
    "work from home, make money fast":                "Vague 'make money fast' language",
    "send your bank details":                         "Requests bank details upfront",
    "western union":                                  "Requests payment via Western Union",
    "wire transfer":                                  "Requests wire transfer",
    "social security":                                "Requests SSN upfront",
    "no interview required":                          "No interview — classic ghost job signal",
    "immediate hire":                                 "'Immediate hire' with no screening process",
    "gmail.com":                                      "Company using personal Gmail instead of corporate email",
    "yahoo.com":                                      "Company using Yahoo instead of corporate email",
    "earn up to $10,000":                             "Vague 'earn up to' salary claim",
}

async def check_fake_job(
    job_title: str,
    company_name: str,
    job_description: str,
    salary_range: str,
    apply_url: str,
) -> dict:
    full_text = f"{job_title} {company_name} {job_description} {salary_range or ''} {apply_url or ''}".lower()

    # Always run rule-based check first
    triggered = [label for phrase, label in SCAM_SIGNALS.items() if phrase in full_text]
    no_company = not company_name.strip() or company_name.lower() in ("company", "employer", "n/a", "unknown")
    if no_company:
        triggered.append("No company name provided")

    rule_suspicious = len(triggered) > 0
    rule_level      = "safe" if not triggered else ("high" if len(triggered) >= 3 else ("medium" if len(triggered) >= 2 else "low"))

    if _has_key():
        prompt = f"Title: {job_title}\nCompany: {company_name}\nSalary: {salary_range}\nURL: {apply_url}\n\n--- DESCRIPTION ---\n{job_description}"
        try:
            ai_result = await _chat_json(FAKE_JOB_SYSTEM, prompt)
            # Merge AI signals with rule-based signals
            ai_result["signals"] = list(set(ai_result.get("signals", []) + triggered))
            return ai_result
        except Exception:
            pass  # Fall through to rule-based result

    recommendations = {
        "safe":   "This listing appears legitimate. Always verify the company independently before applying.",
        "low":    "One minor signal detected. Verify the company on LinkedIn before applying.",
        "medium": "Multiple signals detected. Research this company carefully before sharing personal information.",
        "high":   "High fraud risk. Do not apply or share personal information.",
    }

    return {
        "is_suspicious":  rule_suspicious,
        "risk_level":     rule_level,
        "signals":        triggered if triggered else ["No obvious fraud signals detected"],
        "recommendation": recommendations[rule_level],
    }
