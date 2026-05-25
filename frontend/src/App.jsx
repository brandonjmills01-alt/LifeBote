/**
 * App.jsx — Lifebote Main Dashboard
 * -----------------------------------
 * 9 features across 7 tabs:
 *   Resume AI     — Feature 1 (Tailoring) + Feature 3 (Score)
 *   Job Search    — Feature 2 (Matching) + Feature 17 (Fake Detection)
 *   Auto Apply    — Feature 4 (Human-Reviewed Autofill)
 *   Outreach      — Feature 7 (Cover Letter / Messages)
 *   Tracker       — Feature 8 (Application Dashboard)
 *   Salary        — Feature 12 (Salary Intelligence)
 *   Portfolio     — Feature 13 (Portfolio Builder)
 *
 * UI: Deloitte-inspired — navy, white, green accent, DM Sans/DM Serif Display
 */

import { useState } from "react";
import { useAuth } from "./AuthContext";
import { apiPost, apiPatch, apiDelete } from "./api";

// ── Shared Components ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:48 }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E5E7EB", borderTopColor:"#0A2342", animation:"spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, color:"#DC2626", padding:"12px 16px", marginBottom:16, fontSize:14 }}>{msg}</div>;
}

function ScoreBar({ label, value, color="#0A2342" }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:13, color:"#374151", fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color }}>{value}/100</span>
      </div>
      <div style={{ height:6, background:"#F1F5F9", borderRadius:3 }}>
        <div style={{ height:"100%", width:`${value}%`, background:value>=75?"#00A86B":value>=50?"#F59E0B":"#EF4444", borderRadius:3, transition:"width 0.6s ease" }} />
      </div>
    </div>
  );
}

function Tag({ label, color="#0A2342", bg="#EEF2FF" }) {
  return <span style={{ background:bg, color, padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:500, display:"inline-block", margin:"2px 3px" }}>{label}</span>;
}

function Card({ children, style={} }) {
  return <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:10, padding:24, marginBottom:16, ...style }}>{children}</div>;
}

function SectionTitle({ children }) {
  return <h3 style={{ fontSize:15, fontWeight:700, color:"#0A2342", marginBottom:16, marginTop:0, borderLeft:"3px solid #00A86B", paddingLeft:12 }}>{children}</h3>;
}

function StatusPill({ status }) {
  const map = { saved:"#3B82F6", applied:"#8B5CF6", screening:"#F59E0B", interview:"#10B981", offer:"#00A86B", rejected:"#EF4444", withdrawn:"#9CA3AF" };
  const c   = map[status] || "#6B7280";
  return <span style={{ background:c+"18", color:c, border:`1px solid ${c}33`, borderRadius:20, padding:"2px 12px", fontSize:12, fontWeight:600, textTransform:"capitalize" }}>{status}</span>;
}


// ── Feature 1 & 3: Resume AI ──────────────────────────────────────────────────

function ResumeTab({ token }) {
  const [resume,  setResume]  = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [tone,    setTone]    = useState("professional");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [version, setVersion] = useState("tailored");

  async function handle() {
    if (!resume.trim() || !jobDesc.trim()) { setError("Both fields are required."); return; }
    setError(""); setLoading(true); setResult(null);
    try { setResult(await apiPost("/resume/tailor", { resume_text:resume, job_description:jobDesc, tone }, token)); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const displayText = result
    ? (version === "tailored" ? result.tailored_resume : result.resume_versions?.[version] || result.tailored_resume)
    : "";

  return (
    <div>
      <div style={S.twoCol}>
        <div>
          <label style={S.label}>Your Current Resume</label>
          <textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste your resume text here..." style={{...S.textarea, height:220}} />
        </div>
        <div>
          <label style={S.label}>Job Description</label>
          <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Paste the target job description..." style={{...S.textarea, height:220}} />
        </div>
      </div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
        <select value={tone} onChange={e=>setTone(e.target.value)} style={S.select}>
          <option value="professional">Professional</option>
          <option value="technical">Technical</option>
          <option value="creative">Creative</option>
        </select>
        <button onClick={handle} disabled={loading} style={S.btn}>
          {loading ? "Analyzing..." : "✦ Tailor My Resume"}
        </button>
      </div>
      <ErrorBox msg={error} />
      {loading && <Spinner />}
      {result && (
        <div>
          <Card>
            <SectionTitle>Optimization Scores</SectionTitle>
            <div style={S.twoCol}>
              <div>
                <ScoreBar label="Overall Score"  value={result.score.overall_score} />
                <ScoreBar label="ATS Score"      value={result.score.ats_score} />
              </div>
              <div>
                <ScoreBar label="Keyword Match"  value={result.score.keyword_score} />
                <ScoreBar label="Readability"    value={result.score.readability_score} />
              </div>
            </div>
          </Card>

          <div style={S.twoCol}>
            {result.score.strengths?.length > 0 && (
              <Card>
                <SectionTitle>✓ Strengths</SectionTitle>
                {result.score.strengths.map((s,i) => <div key={i} style={{ fontSize:14, color:"#374151", marginBottom:6, paddingLeft:8, borderLeft:"2px solid #00A86B" }}>{s}</div>)}
              </Card>
            )}
            {result.score.suggestions?.length > 0 && (
              <Card>
                <SectionTitle>↑ Suggestions</SectionTitle>
                {result.score.suggestions.map((s,i) => <div key={i} style={{ fontSize:14, color:"#374151", marginBottom:6, paddingLeft:8, borderLeft:"2px solid #F59E0B" }}>{s}</div>)}
              </Card>
            )}
          </div>

          {result.score.missing_keywords?.length > 0 && (
            <Card>
              <SectionTitle>Missing Keywords</SectionTitle>
              <div>{result.score.missing_keywords.map((k,i) => <Tag key={i} label={k} color="#DC2626" bg="#FEF2F2" />)}</div>
            </Card>
          )}

          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <SectionTitle style={{ marginBottom:0 }}>Tailored Resume</SectionTitle>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {["tailored","technical","executive"].map(v => (
                  <button key={v} onClick={()=>setVersion(v)} style={version===v ? S.btn : S.btnOutline}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
                ))}
                <button onClick={()=>navigator.clipboard.writeText(displayText)} style={S.btnOutline}>Copy</button>
              </div>
            </div>
            <pre style={S.codeBlock}>{displayText}</pre>
          </Card>
        </div>
      )}
    </div>
  );
}


// ── Feature 2 & 17: Job Search + Fake Detection ───────────────────────────────

function JobsTab({ token, onTrack }) {
  const [resume,   setResume]   = useState("");
  const [title,    setTitle]    = useState("");
  const [location, setLocation] = useState("");
  const [mode,     setMode]     = useState("any");
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handle() {
    if (!resume.trim()) { setError("Paste your resume so we can match you to the best jobs."); return; }
    setError(""); setLoading(true); setResults(null);
    try { setResults(await apiPost("/jobs/search", { resume_text:resume, job_title:title, location:location||null, work_mode:mode }, token)); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <Card>
        <label style={S.label}>Your Resume (for match scoring)</label>
        <textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste your resume..." style={{...S.textarea, height:100, marginBottom:14}} />
        <div style={S.searchGrid}>
          <div><label style={S.label}>Job Title</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Data Analyst" style={S.input} /></div>
          <div><label style={S.label}>Location</label><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Chicago, IL" style={S.input} /></div>
          <div>
            <label style={S.label}>Work Mode</label>
            <select value={mode} onChange={e=>setMode(e.target.value)} style={S.select}>
              <option value="any">Any</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-Site</option>
            </select>
          </div>
          <button onClick={handle} disabled={loading} style={{...S.btn, alignSelf:"flex-end"}}>
            {loading ? "Searching..." : "Find Jobs"}
          </button>
        </div>
      </Card>
      <ErrorBox msg={error} />
      {loading && <Spinner />}
      {results && !loading && (
        <div>
          <p style={{ color:"#6B7280", marginBottom:12, fontSize:14 }}>
            Found <strong style={{color:"#0A2342"}}>{results.total}</strong> matching jobs
          </p>
          {results.jobs.map(job => (
            <Card key={job.id} style={{ borderLeft: job.is_fake ? "4px solid #EF4444" : "4px solid #00A86B" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    <h3 style={{ margin:0, color:"#0A2342", fontSize:16, fontWeight:700 }}>{job.title}</h3>
                    {job.is_fake && <span style={{ background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700 }}>⚠ SUSPICIOUS</span>}
                    <Tag label={job.industry} color="#4B5563" bg="#F3F4F6" />
                  </div>
                  <div style={{ color:"#6B7280", fontSize:13, marginBottom:8 }}>
                    <strong>{job.company}</strong> · {job.location} · {job.work_mode}
                    {job.salary_range && <span style={{ color:"#00A86B", fontWeight:600 }}> · {job.salary_range}</span>}
                  </div>
                  {job.match_reasons?.length > 0 && (
                    <div style={{ marginBottom:6 }}>{job.match_reasons.map((r,i) => <Tag key={i} label={"✓ "+r} color="#059669" bg="#ECFDF5" />)}</div>
                  )}
                  {job.is_fake && job.fake_signals?.length > 0 && (
                    <div style={{ background:"#FEF2F2", padding:"8px 12px", borderRadius:6, marginTop:8 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#DC2626", marginBottom:4 }}>Fraud signals detected:</div>
                      {job.fake_signals.map((s,i) => <div key={i} style={{ fontSize:12, color:"#991B1B" }}>• {s}</div>)}
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, flexShrink:0 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:800, color:job.match_score>=75?"#00A86B":job.match_score>=50?"#F59E0B":"#EF4444" }}>{job.match_score}%</div>
                    <div style={{ fontSize:11, color:"#6B7280" }}>Match</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>onTrack(job)} style={{...S.btnOutline, fontSize:12}}>+ Track</button>
                    {!job.is_fake && <a href={job.apply_url} target="_blank" rel="noreferrer" style={{...S.btn, textDecoration:"none", fontSize:12, padding:"6px 12px"}}>Apply →</a>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Feature 4: Auto Apply ─────────────────────────────────────────────────────

function AutoApplyTab({ token }) {
  const [resume,  setResume]  = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [title,   setTitle]   = useState("");
  const [company, setCompany] = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handle() {
    if (!resume.trim()||!jobDesc.trim()||!title.trim()||!company.trim()) { setError("All fields are required."); return; }
    setError(""); setLoading(true); setResult(null);
    try { setResult(await apiPost("/applications/autofill", { resume_text:resume, job_description:jobDesc, job_title:title, company_name:company }, token)); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <Card style={{ background:"#FFFBEB", borderColor:"#FDE68A" }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:20 }}>ℹ</span>
          <div>
            <div style={{ fontWeight:700, color:"#92400E", marginBottom:4 }}>Human Review Required</div>
            <div style={{ fontSize:13, color:"#78350F" }}>Lifebote pre-fills your application. <strong>You review every field before submitting.</strong> We never auto-submit on your behalf — this protects your professional reputation.</div>
          </div>
        </div>
      </Card>

      <div style={S.twoCol}>
        <div>
          <label style={S.label}>Your Resume</label>
          <textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste your resume..." style={{...S.textarea, height:180}} />
        </div>
        <div>
          <label style={S.label}>Job Description</label>
          <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Paste the job description..." style={{...S.textarea, height:180}} />
        </div>
      </div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
        <div style={{ flex:1, minWidth:180 }}>
          <label style={S.label}>Job Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Product Manager" style={S.input} />
        </div>
        <div style={{ flex:1, minWidth:180 }}>
          <label style={S.label}>Company Name</label>
          <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g. Stripe" style={S.input} />
        </div>
        <button onClick={handle} disabled={loading} style={{...S.btn, alignSelf:"flex-end"}}>
          {loading ? "Pre-filling..." : "Pre-fill Application"}
        </button>
      </div>
      <ErrorBox msg={error} />
      {loading && <Spinner />}
      {result && (
        <div>
          <Card style={{ borderTop:"3px solid #00A86B" }}>
            <SectionTitle>Application Preview — Review Before Submitting</SectionTitle>
            <div style={S.twoCol}>
              <div>
                <div style={S.fieldGroup}><label style={S.label}>Full Name</label><div style={S.fieldVal}>{result.full_name}</div></div>
                <div style={S.fieldGroup}><label style={S.label}>Email</label><div style={S.fieldVal}>{result.email}</div></div>
                <div style={S.fieldGroup}><label style={S.label}>Phone</label><div style={S.fieldVal}>{result.phone}</div></div>
                <div style={S.fieldGroup}><label style={S.label}>LinkedIn</label><div style={S.fieldVal}>{result.linkedin_url}</div></div>
              </div>
              <div>
                <div style={S.fieldGroup}><label style={S.label}>Professional Summary</label><div style={{...S.fieldVal, lineHeight:1.6}}>{result.summary}</div></div>
                <div style={S.fieldGroup}><label style={S.label}>Skills</label><div>{result.skills?.map((s,i)=><Tag key={i} label={s} />)}</div></div>
              </div>
            </div>
            {result.work_experience?.length > 0 && (
              <div style={S.fieldGroup}>
                <label style={S.label}>Work Experience</label>
                {result.work_experience.map((w,i) => (
                  <div key={i} style={{ background:"#F8FAFC", borderRadius:8, padding:"12px 16px", marginBottom:8 }}>
                    <div style={{ fontWeight:700, color:"#0A2342", marginBottom:4 }}>{w.title} · {w.company} <span style={{ color:"#6B7280", fontWeight:400, fontSize:13 }}>({w.dates})</span></div>
                    {w.bullets?.map((b,j) => <div key={j} style={{ fontSize:13, color:"#374151", paddingLeft:12, borderLeft:"2px solid #E5E7EB", marginBottom:3 }}>• {b}</div>)}
                  </div>
                ))}
              </div>
            )}
            <div style={S.fieldGroup}>
              <label style={S.label}>Cover Letter</label>
              <pre style={{ ...S.codeBlock, fontSize:13, lineHeight:1.7 }}>{result.cover_letter}</pre>
            </div>
            <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"12px 16px" }}>
              <strong style={{ color:"#15803D" }}>✓ Ready for your review.</strong> <span style={{ color:"#166534", fontSize:13 }}>Copy these fields into the employer's application form. Never submit without reviewing.</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}


// ── Feature 7: Outreach Generator ────────────────────────────────────────────

function OutreachTab({ token }) {
  const [resume,  setResume]  = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [company, setCompany] = useState("");
  const [manager, setManager] = useState("");
  const [docType, setDocType] = useState("cover_letter");
  const [tone,    setTone]    = useState("formal");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handle() {
    if (!resume.trim()||!company.trim()) { setError("Resume and company name are required."); return; }
    setError(""); setLoading(true); setResult(null);
    try { setResult(await apiPost("/interview/outreach", { resume_text:resume, job_description:jobDesc, company_name:company, hiring_manager:manager, doc_type:docType, tone }, token)); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const docLabels = { cover_letter:"Cover Letter", recruiter_message:"Recruiter Message", linkedin_connection:"LinkedIn Note", thank_you_email:"Thank You Email" };

  return (
    <div>
      <div style={S.twoCol}>
        <div>
          <label style={S.label}>Your Resume</label>
          <textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste your resume..." style={{...S.textarea, height:180}} />
        </div>
        <div>
          <label style={S.label}>Job Description (optional)</label>
          <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Paste the job description for a more personalized result..." style={{...S.textarea, height:180}} />
        </div>
      </div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
        <div style={{ flex:1, minWidth:160 }}><label style={S.label}>Company</label><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g. Google" style={S.input} /></div>
        <div style={{ flex:1, minWidth:160 }}><label style={S.label}>Hiring Manager (optional)</label><input value={manager} onChange={e=>setManager(e.target.value)} placeholder="e.g. John Smith" style={S.input} /></div>
        <div style={{ flex:1, minWidth:160 }}>
          <label style={S.label}>Document Type</label>
          <select value={docType} onChange={e=>setDocType(e.target.value)} style={S.select}>
            {Object.entries(docLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div style={{ flex:1, minWidth:140 }}>
          <label style={S.label}>Tone</label>
          <select value={tone} onChange={e=>setTone(e.target.value)} style={S.select}>
            <option value="formal">Formal</option>
            <option value="conversational">Conversational</option>
            <option value="enthusiastic">Enthusiastic</option>
          </select>
        </div>
        <button onClick={handle} disabled={loading} style={{...S.btn, alignSelf:"flex-end"}}>
          {loading ? "Writing..." : "Generate"}
        </button>
      </div>
      <ErrorBox msg={error} />
      {loading && <Spinner />}
      {result && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <SectionTitle>{docLabels[result.doc_type] || "Document"}</SectionTitle>
            <div style={{ display:"flex", gap:8 }}>
              {result.subject_line && <div style={{ fontSize:12, color:"#6B7280", alignSelf:"center" }}>Subject: <strong>{result.subject_line}</strong></div>}
              <button onClick={()=>navigator.clipboard.writeText(result.content)} style={S.btnOutline}>Copy</button>
            </div>
          </div>
          <pre style={{...S.codeBlock, lineHeight:1.8}}>{result.content}</pre>
        </Card>
      )}
    </div>
  );
}


// ── Feature 8: Application Tracker ───────────────────────────────────────────

function TrackerTab({ applications, onStatusChange, onDelete }) {
  const STATUS = ["saved","applied","screening","interview","offer","rejected","withdrawn"];
  const pipeline = [
    {s:"saved",icon:"🔖"},{s:"applied",icon:"📤"},{s:"screening",icon:"📞"},
    {s:"interview",icon:"🎯"},{s:"offer",icon:"🎉"}
  ];
  const counts = STATUS.reduce((a,s)=>({...a,[s]:applications.filter(x=>x.status===s).length}),{});

  if (!applications.length) return (
    <div style={{ textAlign:"center", padding:64, color:"#6B7280" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
      <p>No applications yet. Search for jobs and click "+ Track" to start.</p>
    </div>
  );

  return (
    <div>
      <div style={S.pipelineGrid}>
        {pipeline.map(p => (
          <Card key={p.s} style={{ textAlign:"center", padding:16, marginBottom:0 }}>
            <div style={{ fontSize:22 }}>{p.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#0A2342" }}>{counts[p.s]||0}</div>
            <div style={{ fontSize:12, color:"#6B7280", textTransform:"capitalize" }}>{p.s}</div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop:16 }}>
        {applications.map(app => (
          <Card key={app.id} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, color:"#0A2342", marginBottom:2 }}>{app.job_title}</div>
              <div style={{ color:"#6B7280", fontSize:13 }}>{app.company}{app.location ? ` · ${app.location}` : ""}</div>
              {app.salary_range && <div style={{ color:"#00A86B", fontSize:13, fontWeight:600 }}>{app.salary_range}</div>}
              {app.applied_date && <div style={{ color:"#9CA3AF", fontSize:11, marginTop:2 }}>Applied {new Date(app.applied_date).toLocaleDateString()}</div>}
              {app.next_step && <div style={{ color:"#374151", fontSize:12, marginTop:4 }}>Next: {app.next_step}</div>}
            </div>
            <StatusPill status={app.status} />
            <select value={app.status} onChange={e=>onStatusChange(app.id, e.target.value)} style={{...S.select, width:"auto", fontSize:12, padding:"6px 10px"}}>
              {STATUS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={()=>onDelete(app.id)} style={{ background:"none", border:"none", color:"#9CA3AF", cursor:"pointer", fontSize:18, padding:4 }} title="Remove">✕</button>
          </Card>
        ))}
      </div>
    </div>
  );
}


// ── Feature 12: Salary Intelligence ──────────────────────────────────────────

function SalaryTab({ token }) {
  const [title,    setTitle]    = useState("");
  const [location, setLocation] = useState("");
  const [exp,      setExp]      = useState(3);
  const [skills,   setSkills]   = useState("");
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handle() {
    if (!title.trim()||!location.trim()) { setError("Job title and location are required."); return; }
    setError(""); setLoading(true); setResult(null);
    try { setResult(await apiPost("/salary/lookup", { job_title:title, location, years_exp:exp, skills:skills.split(",").map(s=>s.trim()).filter(Boolean) }, token)); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <Card>
        <div style={S.searchGrid}>
          <div><label style={S.label}>Job Title</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Software Engineer" style={S.input} /></div>
          <div><label style={S.label}>Location</label><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. New York, NY" style={S.input} /></div>
          <div>
            <label style={S.label}>Years of Experience</label>
            <select value={exp} onChange={e=>setExp(Number(e.target.value))} style={S.select}>
              {[0,1,2,3,5,7,10,15,20].map(n=><option key={n} value={n}>{n===0?"Entry Level":n===1?"1 year":`${n} years`}</option>)}
            </select>
          </div>
          <button onClick={handle} disabled={loading} style={{...S.btn, alignSelf:"flex-end"}}>
            {loading ? "Looking up..." : "Get Salary Data"}
          </button>
        </div>
        <div style={{ marginTop:12 }}>
          <label style={S.label}>Key Skills (comma-separated, optional)</label>
          <input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="e.g. Python, AWS, React" style={S.input} />
        </div>
      </Card>
      <ErrorBox msg={error} />
      {loading && <Spinner />}
      {result && (
        <div>
          <Card style={{ background:"#0A2342", border:"none" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:"#94A3B8", fontSize:13, marginBottom:8 }}>{result.title} · {result.location}</div>
              <div style={{ fontSize:"2.5rem", fontWeight:800, color:"#fff", marginBottom:4 }}>{result.salary_range_label}</div>
              <div style={{ color:"#00A86B", fontWeight:600, fontSize:14 }}>Annual Salary Range</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginTop:24 }}>
              {[["Low",result.salary_low],["Median",result.salary_median],["High",result.salary_high]].map(([l,v])=>(
                <div key={l} style={{ textAlign:"center", background:"rgba(255,255,255,0.07)", borderRadius:8, padding:16 }}>
                  <div style={{ color:"#94A3B8", fontSize:12, marginBottom:4 }}>{l}</div>
                  <div style={{ color:"#fff", fontWeight:700, fontSize:20 }}>${v?.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:16 }}>
              <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:8, padding:12, textAlign:"center" }}>
                <div style={{ color:"#94A3B8", fontSize:12 }}>Market Demand</div>
                <div style={{ color:"#00A86B", fontWeight:700, textTransform:"capitalize" }}>{result.market_demand}</div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:8, padding:12, textAlign:"center" }}>
                <div style={{ color:"#94A3B8", fontSize:12 }}>Competition</div>
                <div style={{ color:"#F59E0B", fontWeight:700, textTransform:"capitalize" }}>{result.competition_level}</div>
              </div>
            </div>
          </Card>

          <div style={S.twoCol}>
            <Card>
              <SectionTitle>Top Paying Cities</SectionTitle>
              {result.top_paying_cities?.map((c,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #F3F4F6" }}>
                  <span style={{ fontSize:14, color:"#374151" }}>{c.city}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:"#0A2342" }}>${c.median?.toLocaleString()}</span>
                </div>
              ))}
            </Card>
            <Card>
              <SectionTitle>Comparable Roles</SectionTitle>
              {result.comparable_roles?.map((r,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #F3F4F6" }}>
                  <span style={{ fontSize:14, color:"#374151" }}>{r.title}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:"#0A2342" }}>${r.median?.toLocaleString()}</span>
                </div>
              ))}
            </Card>
          </div>

          <Card>
            <SectionTitle>💼 Negotiation Tips</SectionTitle>
            {result.negotiation_tips?.map((t,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:10 }}>
                <span style={{ color:"#00A86B", fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                <span style={{ fontSize:14, color:"#374151", lineHeight:1.6 }}>{t}</span>
              </div>
            ))}
            {result.cost_of_living_note && (
              <div style={{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:8, padding:"10px 14px", marginTop:8, fontSize:13, color:"#0369A1" }}>
                ℹ {result.cost_of_living_note}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}


// ── Feature 13: Portfolio Builder ─────────────────────────────────────────────

function PortfolioTab({ token }) {
  const [form, setForm] = useState({
    full_name:"", title:"", bio:"", email:"", github_url:"", linkedin_url:"",
    skills:"", projects:[{ name:"", description:"", url:"", tech_stack:"" }],
    work_history:[{ company:"", role:"", dates:"", bullets:"" }],
  });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  function set(field, val) { setForm(p=>({...p,[field]:val})); }
  function setProject(i, field, val) { const a=[...form.projects]; a[i]={...a[i],[field]:val}; set("projects",a); }
  function setWork(i, field, val)    { const a=[...form.work_history]; a[i]={...a[i],[field]:val}; set("work_history",a); }

  async function handle() {
    if (!form.full_name.trim()||!form.email.trim()) { setError("Name and email are required."); return; }
    setError(""); setLoading(true); setResult(null);
    const body = {
      ...form,
      skills:      form.skills.split(",").map(s=>s.trim()).filter(Boolean),
      projects:    form.projects.map(p=>({...p, tech_stack:p.tech_stack.split(",").map(s=>s.trim()).filter(Boolean)})),
      work_history:form.work_history.map(w=>({...w, bullets:w.bullets.split("\n").filter(Boolean)})),
    };
    try { setResult(await apiPost("/portfolio/build", body, token)); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function download() {
    const blob = new Blob([result.html], { type:"text/html" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `${form.full_name.replace(/\s+/g,"-")}-portfolio.html`;
    a.click();
  }

  return (
    <div>
      <Card>
        <SectionTitle>Basic Info</SectionTitle>
        <div style={S.twoCol}>
          <div><label style={S.label}>Full Name</label><input value={form.full_name} onChange={e=>set("full_name",e.target.value)} placeholder="Jane Smith" style={S.input} /></div>
          <div><label style={S.label}>Professional Title</label><input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Senior Data Analyst" style={S.input} /></div>
          <div><label style={S.label}>Email</label><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="jane@example.com" style={S.input} /></div>
          <div><label style={S.label}>LinkedIn URL</label><input value={form.linkedin_url} onChange={e=>set("linkedin_url",e.target.value)} placeholder="https://linkedin.com/in/..." style={S.input} /></div>
          <div><label style={S.label}>GitHub URL (optional)</label><input value={form.github_url} onChange={e=>set("github_url",e.target.value)} placeholder="https://github.com/..." style={S.input} /></div>
          <div><label style={S.label}>Skills (comma-separated)</label><input value={form.skills} onChange={e=>set("skills",e.target.value)} placeholder="Python, SQL, Tableau, Agile" style={S.input} /></div>
        </div>
        <div style={{ marginTop:12 }}><label style={S.label}>Bio / Summary</label><textarea value={form.bio} onChange={e=>set("bio",e.target.value)} placeholder="Brief professional summary..." style={{...S.textarea, height:80}} /></div>
      </Card>

      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <SectionTitle>Projects</SectionTitle>
          <button onClick={()=>set("projects",[...form.projects,{name:"",description:"",url:"",tech_stack:""}])} style={S.btnOutline}>+ Add Project</button>
        </div>
        {form.projects.map((p,i)=>(
          <div key={i} style={{ background:"#F8FAFC", borderRadius:8, padding:16, marginBottom:12 }}>
            <div style={S.twoCol}>
              <div><label style={S.label}>Project Name</label><input value={p.name} onChange={e=>setProject(i,"name",e.target.value)} placeholder="My Project" style={S.input} /></div>
              <div><label style={S.label}>URL (optional)</label><input value={p.url} onChange={e=>setProject(i,"url",e.target.value)} placeholder="https://..." style={S.input} /></div>
            </div>
            <div style={{ marginTop:8 }}><label style={S.label}>Description</label><textarea value={p.description} onChange={e=>setProject(i,"description",e.target.value)} placeholder="What did you build?" style={{...S.textarea, height:60}} /></div>
            <div style={{ marginTop:8 }}><label style={S.label}>Tech Stack (comma-separated)</label><input value={p.tech_stack} onChange={e=>setProject(i,"tech_stack",e.target.value)} placeholder="React, Node.js, PostgreSQL" style={S.input} /></div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <SectionTitle>Work History</SectionTitle>
          <button onClick={()=>set("work_history",[...form.work_history,{company:"",role:"",dates:"",bullets:""}])} style={S.btnOutline}>+ Add Role</button>
        </div>
        {form.work_history.map((w,i)=>(
          <div key={i} style={{ background:"#F8FAFC", borderRadius:8, padding:16, marginBottom:12 }}>
            <div style={S.twoCol}>
              <div><label style={S.label}>Company</label><input value={w.company} onChange={e=>setWork(i,"company",e.target.value)} placeholder="Acme Corp" style={S.input} /></div>
              <div><label style={S.label}>Role</label><input value={w.role} onChange={e=>setWork(i,"role",e.target.value)} placeholder="Senior Analyst" style={S.input} /></div>
              <div><label style={S.label}>Dates</label><input value={w.dates} onChange={e=>setWork(i,"dates",e.target.value)} placeholder="2021 – Present" style={S.input} /></div>
            </div>
            <div style={{ marginTop:8 }}><label style={S.label}>Accomplishments (one per line)</label><textarea value={w.bullets} onChange={e=>setWork(i,"bullets",e.target.value)} placeholder={"Led team of 5 engineers\nIncreased revenue by 30%"} style={{...S.textarea, height:80}} /></div>
          </div>
        ))}
      </Card>

      <div style={{ textAlign:"center", marginBottom:16 }}>
        <button onClick={handle} disabled={loading} style={{...S.btn, padding:"13px 32px", fontSize:15}}>
          {loading ? "Building..." : "⚓ Build My Portfolio"}
        </button>
      </div>
      <ErrorBox msg={error} />
      {loading && <Spinner />}
      {result && (
        <Card style={{ borderTop:"3px solid #00A86B" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <SectionTitle>Portfolio Ready!</SectionTitle>
            <button onClick={download} style={S.btn}>⬇ Download HTML</button>
          </div>
          <iframe srcDoc={result.html} style={{ width:"100%", height:500, border:"1px solid #E5E7EB", borderRadius:8 }} title="Portfolio Preview" />
        </Card>
      )}
    </div>
  );
}


// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const { user, token, logout } = useAuth();
  const [tab, setTab] = useState("resume");

  const [applications, setApplications] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lb_apps") || "[]"); } catch { return []; }
  });

  function saveApps(next) {
    setApplications(next);
    try { localStorage.setItem("lb_apps", JSON.stringify(next)); } catch {}
  }

  function handleTrack(job) {
    if (applications.find(a=>a.job_id===job.id)) { setTab("tracker"); return; }
    saveApps([...applications, {
      id: crypto.randomUUID(), job_id:job.id,
      job_title:job.title, company:job.company, location:job.location,
      salary_range:job.salary_range, status:"saved",
      applied_date:null, follow_up_date:null, notes:null, next_step:null, contacts:[],
    }]);
    setTab("tracker");
  }

  function handleStatusChange(appId, newStatus) {
    saveApps(applications.map(a => a.id!==appId ? a : {
      ...a, status:newStatus,
      applied_date: newStatus==="applied"&&!a.applied_date ? new Date().toISOString() : a.applied_date,
    }));
    // Sync to backend (best-effort)
    apiPatch(`/applications/${appId}`, { status:newStatus }, token).catch(()=>{});
  }

  function handleDelete(appId) {
    saveApps(applications.filter(a=>a.id!==appId));
  }

  const tabs = [
    { id:"resume",    label:"Resume AI",      icon:"✦" },
    { id:"jobs",      label:"Job Search",     icon:"⊙" },
    { id:"apply",     label:"Auto Apply",     icon:"⊛" },
    { id:"outreach",  label:"Outreach",       icon:"✉" },
    { id:"tracker",   label:`Tracker${applications.length?` (${applications.length})`:""}`, icon:"◈" },
    { id:"salary",    label:"Salary Intel",   icon:"$" },
    { id:"portfolio", label:"Portfolio",      icon:"⬡" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22, color:"#00A86B" }}>⚓</span>
          <span style={{ fontSize:19, fontWeight:800, color:"#fff", letterSpacing:-0.5 }}>Lifebote</span>
          <span style={{ fontSize:11, color:"#00A86B", fontWeight:700, background:"rgba(0,168,107,0.15)", padding:"2px 8px", borderRadius:4 }}>BETA</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ color:"#94A3B8", fontSize:13 }}>{user?.full_name}</span>
          <span style={{ background:"rgba(0,168,107,0.15)", color:"#00A86B", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{user?.plan}</span>
          <button onClick={logout} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.15)", color:"#94A3B8", borderRadius:6, padding:"5px 12px", fontSize:12, cursor:"pointer" }}>Sign Out</button>
        </div>
      </div>

      {/* Nav */}
      <div style={S.nav}>
        <div style={{ display:"flex", gap:2, overflowX:"auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={tab===t.id ? S.navTabOn : S.navTabOff}>
              <span style={{ marginRight:6 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        {tab==="resume"    && <ResumeTab    token={token} />}
        {tab==="jobs"      && <JobsTab      token={token} onTrack={handleTrack} />}
        {tab==="apply"     && <AutoApplyTab token={token} />}
        {tab==="outreach"  && <OutreachTab  token={token} />}
        {tab==="tracker"   && <TrackerTab   applications={applications} onStatusChange={handleStatusChange} onDelete={handleDelete} />}
        {tab==="salary"    && <SalaryTab    token={token} />}
        {tab==="portfolio" && <PortfolioTab token={token} />}
      </div>
    </div>
  );
}


// ── Design System ─────────────────────────────────────────────────────────────

const S = {
  header:     { background:"#0A2342", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  nav:        { background:"#fff", borderBottom:"2px solid #E5E7EB", padding:"0 28px", overflowX:"auto" },
  navTabOn:   { padding:"14px 18px", background:"none", border:"none", cursor:"pointer", fontWeight:700, fontSize:13, color:"#0A2342", borderBottom:"2px solid #0A2342", marginBottom:-2, whiteSpace:"nowrap", fontFamily:"inherit" },
  navTabOff:  { padding:"14px 18px", background:"none", border:"none", cursor:"pointer", fontWeight:500, fontSize:13, color:"#6B7280", borderBottom:"2px solid transparent", marginBottom:-2, whiteSpace:"nowrap", fontFamily:"inherit" },
  main:       { maxWidth:1100, margin:"0 auto", padding:"28px 20px" },
  twoCol:     { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:16 },
  searchGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, alignItems:"end" },
  pipelineGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:10, marginBottom:4 },
  label:      { display:"block", fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 },
  input:      { width:"100%", boxSizing:"border-box", border:"1.5px solid #E5E7EB", borderRadius:8, padding:"10px 12px", fontSize:14, fontFamily:"inherit", color:"#1F2937", outline:"none", background:"#fff" },
  textarea:   { width:"100%", boxSizing:"border-box", border:"1.5px solid #E5E7EB", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:"inherit", color:"#1F2937", resize:"vertical", outline:"none", background:"#fff" },
  select:     { width:"100%", boxSizing:"border-box", border:"1.5px solid #E5E7EB", borderRadius:8, padding:"10px 12px", fontSize:14, fontFamily:"inherit", color:"#1F2937", cursor:"pointer", outline:"none", background:"#fff" },
  btn:        { background:"#0A2342", color:"#fff", border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" },
  btnOutline: { background:"transparent", color:"#0A2342", border:"1.5px solid #0A2342", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" },
  codeBlock:  { background:"#F8FAFC", border:"1px solid #E5E7EB", padding:16, borderRadius:8, fontSize:13, whiteSpace:"pre-wrap", fontFamily:"'DM Mono', 'Fira Code', monospace", maxHeight:420, overflowY:"auto", margin:0, color:"#1F2937", lineHeight:1.6 },
  fieldGroup: { marginBottom:16 },
  fieldVal:   { background:"#F8FAFC", border:"1px solid #E5E7EB", borderRadius:8, padding:"10px 14px", fontSize:14, color:"#1F2937", minHeight:38 },
};
