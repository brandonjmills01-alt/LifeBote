"""
services/resume_scorer.py
--------------------------
Rule-based resume scoring and light tailoring.
No API key needed. Used as fallback when OpenAI is unavailable.
"""

import re

STRONG_VERBS = {
    "achieved","built","created","delivered","designed","developed","drove",
    "engineered","established","executed","generated","grew","improved",
    "increased","launched","led","managed","optimized","reduced","scaled",
    "shipped","spearheaded","streamlined","transformed","automated","deployed",
}

WEAK_PHRASES = [
    "responsible for","helped with","worked on","assisted with",
    "involved in","participated in","part of a team","duties included",
]

SKILL_RE = re.compile(
    r'\b(python|java|javascript|typescript|react|node|sql|aws|azure|gcp|docker|'
    r'kubernetes|machine learning|data analysis|project management|agile|scrum|'
    r'excel|tableau|power bi|salesforce|leadership|communication|c\+\+|golang|'
    r'rust|fastapi|django|flask|postgresql|mongodb|redis|figma|sketch|'
    r'photoshop|illustrator|java|spring|hibernate)\b',
    re.IGNORECASE,
)


def extract_keywords(text: str) -> set[str]:
    return {m.lower() for m in SKILL_RE.findall(text)}


def score_resume(resume_text: str, job_description: str) -> dict:
    resume_lower = resume_text.lower()

    resume_kw = extract_keywords(resume_text)
    job_kw    = extract_keywords(job_description)

    if job_kw:
        matched       = resume_kw & job_kw
        missing       = sorted(job_kw - resume_kw)[:10]
        keyword_score = int((len(matched) / len(job_kw)) * 100)
    else:
        matched, missing = set(), []
        keyword_score    = 50

    ats_checks = [
        len(resume_text) > 300,
        "@" in resume_text,
        any(str(y) in resume_text for y in range(2015, 2026)),
        bool(re.search(r'\d+%|\$[\d,]+|\d+\s*years?', resume_text)),
        len(resume_text.split("\n")) > 8,
    ]
    ats_score = int(sum(ats_checks) / len(ats_checks) * 100)

    words          = set(resume_lower.split())
    strong_count   = len(STRONG_VERBS & words)
    weak_count     = sum(1 for p in WEAK_PHRASES if p in resume_lower)
    readability    = min(100, max(0, 60 + strong_count * 5 - weak_count * 10))

    overall = int(keyword_score * 0.4 + ats_score * 0.35 + readability * 0.25)

    suggestions, strengths = [], []
    if weak_count:    suggestions.append("Replace phrases like 'responsible for' with strong action verbs.")
    if not re.search(r'\d+%|\$[\d,]+', resume_text): suggestions.append("Add quantified achievements (e.g. 'Increased revenue by 30%').")
    if len(resume_text) < 400: suggestions.append("Resume is too short — expand experience descriptions.")
    if keyword_score < 60: suggestions.append("Add more keywords from the job description naturally.")
    if strong_count >= 3:  strengths.append("Uses strong action verbs throughout.")
    if ats_score >= 70:    strengths.append("Good ATS compatibility — has email, dates, and metrics.")
    if not missing:        strengths.append("Excellent keyword coverage for this role.")

    return {
        "ats_score":         ats_score,
        "keyword_score":     keyword_score,
        "readability_score": readability,
        "overall_score":     overall,
        "missing_keywords":  missing,
        "suggestions":       suggestions or ["Resume looks solid overall."],
        "strengths":         strengths or ["Clear formatting detected."],
    }


def tailor_basic(resume_text: str, job_description: str) -> str:
    job_kw    = extract_keywords(job_description)
    resume_kw = extract_keywords(resume_text)
    missing   = job_kw - resume_kw

    lines  = resume_text.split("\n")
    output = []
    for line in lines:
        flagged = line
        for phrase in WEAK_PHRASES:
            if phrase in line.lower():
                flagged = line + "  ← [Tip: rewrite with a strong action verb]"
                break
        output.append(flagged)

    if missing:
        output += [
            "",
            "── Suggested Keywords to Add ──────────────────────────────",
            "Consider naturally incorporating these into your resume:",
            ", ".join(sorted(missing)),
        ]
    return "\n".join(output)
