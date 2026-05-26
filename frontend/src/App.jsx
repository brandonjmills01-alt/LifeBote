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

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { apiPost, apiPatch, apiDelete, apiUpload, apiDownload } from "./api";

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

function ScoreBar({ label, value, color="#0A2342", animate=false }) {
  // When `animate` is set, start at 0 and ease up to `value` on next paint —
  // gives the score bars a satisfying fill on results render.
  const [width, setWidth] = useState(animate ? 0 : value);
  useEffect(() => {
    if (!animate) { setWidth(value); return; }
    setWidth(0);
    const id = requestAnimationFrame(() => setWidth(value));
    return () => cancelAnimationFrame(id);
  }, [value, animate]);
  const fill = value>=75 ? "#00A86B" : value>=50 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:13, color:"#374151", fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color }}>{value}/100</span>
      </div>
      <div style={{ height:6, background:"#F1F5F9", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${width}%`, background:fill, borderRadius:3, transition:"width 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }} />
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

function SuccessToast({ msg }) {
  // Brief green confirmation shown after actions complete.
  if (!msg) return null;
  return (
    <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", color:"#15803D", padding:"10px 14px", borderRadius:8, marginBottom:12, fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ fontSize:16 }}>✓</span>{msg}
    </div>
  );
}

function HelperText({ children }) {
  // Inline hint shown below labels for fields that might confuse first-time users.
  return <div style={{ fontSize:11, color:"#9CA3AF", marginTop:-2, marginBottom:6, lineHeight:1.4 }}>{children}</div>;
}

function formatBytes(n) {
  if (n < 1024)         return `${n} B`;
  if (n < 1024 * 1024)  return `${(n/1024).toFixed(1)} KB`;
  return `${(n/(1024*1024)).toFixed(2)} MB`;
}

/**
 * DropZone — drag-and-drop file picker for resumes.
 * Calls /api/resume/upload, then hands extracted text to the parent via onText.
 */
function DropZone({ onText, helper }) {
  const [hover,     setHover]     = useState(false);
  const [error,     setError]     = useState("");
  const [meta,      setMeta]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setError("");
    // Reject silently-large files in the UI before round-trip
    if (file.size > 10 * 1024 * 1024) {
      setError("That file is over 10 MB. Try a smaller version or paste your text below.");
      return;
    }
    setUploading(true);
    try {
      const r = await apiUpload("/resume/upload", file);
      setMeta({ filename: r.filename, size: r.size_bytes, format: r.format, pages: r.pages });
      onText(r.text);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function reset(ev) {
    ev?.stopPropagation();
    setMeta(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const borderColor = error ? "#FECACA" : hover ? "#00A86B" : meta ? "#BBF7D0" : "#CBD5E1";
  const bg          = hover ? "#F0FDF4" : meta ? "#F0FDF4" : "#FAFBFC";

  return (
    <div
      onDragOver={e => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={e => { e.preventDefault(); setHover(false); handleFile(e.dataTransfer.files?.[0]); }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${borderColor}`, borderRadius: 10,
        padding: meta ? "14px 18px" : "20px 18px",
        background: bg, textAlign: "center", cursor: "pointer",
        transition: "all 0.18s ease", marginBottom: 12,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display:"none" }}
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {uploading && (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:10, color:"#0A2342" }}>
          <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid #E5E7EB", borderTopColor:"#0A2342", animation:"spin 0.7s linear infinite" }} />
          <span style={{ fontSize:13, fontWeight:600 }}>Reading file…</span>
        </div>
      )}

      {!uploading && meta && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
            <span style={{ background:"#00A86B", color:"#fff", borderRadius:6, padding:"3px 8px", fontSize:11, fontWeight:700, letterSpacing:0.5 }}>{meta.format.toUpperCase()}</span>
            <div style={{ minWidth:0, textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0A2342", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:280 }}>{meta.filename}</div>
              <div style={{ fontSize:11, color:"#6B7280" }}>{formatBytes(meta.size)}{meta.pages ? ` · ${meta.pages} page${meta.pages===1?"":"s"}` : ""} · text extracted</div>
            </div>
          </div>
          <button onClick={reset} style={{ background:"transparent", border:"1px solid #E5E7EB", color:"#6B7280", borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Replace</button>
        </div>
      )}

      {!uploading && !meta && (
        <div>
          <div style={{ fontSize:22, color:"#00A86B", marginBottom:4 }}>⬆</div>
          <div style={{ fontSize:13, fontWeight:600, color:"#0A2342" }}>Drop your resume here, or <span style={{ color:"#00A86B" }}>click to browse</span></div>
          <div style={{ fontSize:11, color:"#6B7280", marginTop:4 }}>{helper || "PDF or DOCX · up to 10 MB"}</div>
        </div>
      )}

      {error && <div style={{ marginTop:10, background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", borderRadius:6, padding:"8px 12px", fontSize:12 }}>{error}</div>}
    </div>
  );
}


// ── Feature 1 & 3: Resume AI ──────────────────────────────────────────────────

function ResumeTab({ token, resume, setResume, userName }) {
  const [jobDesc,    setJobDesc]    = useState("");
  const [tone,       setTone]       = useState("professional");
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [version,    setVersion]    = useState("tailored");
  const [exporting,  setExporting]  = useState("");

  async function handle() {
    if (!resume.trim() || !jobDesc.trim()) { setError("Paste your resume and the job description before tailoring."); return; }
    setError(""); setSuccess(""); setLoading(true); setResult(null);
    try {
      const r = await apiPost("/resume/tailor", { resume_text:resume, job_description:jobDesc, tone }, token);
      setResult(r);
      setSuccess("Resume tailored — scroll down for scores and your rewritten resume.");
    }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const displayText = result
    ? (version === "tailored" ? result.tailored_resume : result.resume_versions?.[version] || result.tailored_resume)
    : "";

  async function doExport(format) {
    setExporting(format); setError("");
    try {
      await apiDownload(`/resume/export/${format}`, {
        resume_text: displayText,
        full_name:   userName || "",
      }, token, `resume.${format}`);
      setSuccess(`Downloaded ${format.toUpperCase()} — check your downloads folder.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting("");
    }
  }

  return (
    <div>
      <Card>
        <SectionTitle>Step 1 — Your Resume</SectionTitle>
        <DropZone onText={t => setResume(t)} helper="Upload a PDF or DOCX — we'll extract the text for review" />
        <label style={S.label}>Or paste your resume text</label>
        <HelperText>You can edit anything we extracted from your file before tailoring.</HelperText>
        <textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste or edit your resume text here..." style={{...S.textarea, height:180}} />
      </Card>
      <Card>
        <SectionTitle>Step 2 — Target Job Description</SectionTitle>
        <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Paste the job description you want to apply for..." style={{...S.textarea, height:180}} />
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:14 }}>
          <div style={{ minWidth:160 }}>
            <label style={S.label}>Tone</label>
            <select value={tone} onChange={e=>setTone(e.target.value)} style={S.select}>
              <option value="professional">Professional</option>
              <option value="technical">Technical</option>
              <option value="creative">Creative</option>
            </select>
          </div>
          <button onClick={handle} disabled={loading} style={{...S.btn, alignSelf:"flex-end"}}>
            {loading ? "Analyzing…" : "✦ Tailor My Resume"}
          </button>
        </div>
      </Card>

      <ErrorBox msg={error} />
      <SuccessToast msg={success} />
      {loading && <ResultsSkeleton />}

      {result && !loading && (
        <div>
          <Card>
            <SectionTitle>Optimization Scores</SectionTitle>
            <div style={S.twoCol}>
              <div>
                <ScoreBar label="Overall Score"  value={result.score.overall_score} animate />
                <ScoreBar label="ATS Score"      value={result.score.ats_score}     animate />
              </div>
              <div>
                <ScoreBar label="Keyword Match"  value={result.score.keyword_score}     animate />
                <ScoreBar label="Readability"    value={result.score.readability_score} animate />
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
              <HelperText>Consider weaving these into your resume naturally — never copy-paste a list.</HelperText>
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
                <button onClick={()=>{ navigator.clipboard.writeText(displayText); setSuccess("Copied to clipboard."); }} style={S.btnOutline} title="Copy text to clipboard">Copy</button>
                <button onClick={()=>doExport("pdf")}  disabled={!!exporting} style={S.btnOutline} title="Download as PDF">{exporting==="pdf"  ? "…" : "⬇ PDF"}</button>
                <button onClick={()=>doExport("docx")} disabled={!!exporting} style={S.btnOutline} title="Download as DOCX">{exporting==="docx" ? "…" : "⬇ DOCX"}</button>
              </div>
            </div>
            <pre style={S.codeBlock}>{displayText}</pre>
          </Card>
        </div>
      )}
    </div>
  );
}

// Lightweight skeleton shown while results are computing — replaces the
// generic spinner with structure that hints at what's coming.
function ResultsSkeleton() {
  const block = { background:"linear-gradient(90deg, #F1F5F9 0%, #E5E7EB 50%, #F1F5F9 100%)", backgroundSize:"200% 100%", borderRadius:6, animation:"shimmer 1.4s linear infinite" };
  return (
    <Card>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{...block, height:14, width:180, marginBottom:18}} />
      <div style={{...block, height:8, marginBottom:10}} />
      <div style={{...block, height:8, marginBottom:10}} />
      <div style={{...block, height:8, width:"82%", marginBottom:24}} />
      <div style={{...block, height:14, width:140, marginBottom:14}} />
      <div style={{...block, height:8, marginBottom:8}} />
      <div style={{...block, height:8, width:"66%"}} />
    </Card>
  );
}


// ── Feature 2 & 17: Job Search + Fake Detection ───────────────────────────────

function JobsTab({ token, onTrack, resume, setResume }) {
  const [title,    setTitle]    = useState("");
  const [location, setLocation] = useState("");
  const [mode,     setMode]     = useState("any");
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handle() {
    if (!resume.trim()) { setError("Upload or paste your resume so we can score how well each job matches."); return; }
    setError(""); setLoading(true); setResults(null);
    try { setResults(await apiPost("/jobs/search", { resume_text:resume, job_title:title, location:location||null, work_mode:mode }, token)); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <Card>
        <SectionTitle>Match jobs to your resume</SectionTitle>
        <DropZone onText={t => setResume(t)} helper="PDF or DOCX — text is extracted into the box below" />
        <label style={S.label}>Resume (used for match scoring)</label>
        <HelperText>Edit before searching if you want to emphasize different skills.</HelperText>
        <textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste or edit your resume here..." style={{...S.textarea, height:100, marginBottom:14}} />
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
            {loading ? "Searching…" : "Find Jobs"}
          </button>
        </div>
      </Card>
      <ErrorBox msg={error} />
      {loading && <JobListSkeleton />}
      {results && !loading && results.jobs.length === 0 && (
        <EmptyState
          icon="🔎"
          title="No matches found"
          body="Try a broader job title, a different location, or switching work mode to Any."
        />
      )}
      {results && !loading && results.jobs.length > 0 && (
        <div>
          <p style={{ color:"#6B7280", marginBottom:12, fontSize:14 }}>
            Found <strong style={{color:"#0A2342"}}>{results.total}</strong> matching {results.total === 1 ? "job" : "jobs"}
          </p>
          {results.jobs.map(job => <JobCard key={job.id} job={job} onTrack={onTrack} />)}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, onTrack }) {
  return (
    <Card style={{ borderLeft: job.is_fake ? "4px solid #EF4444" : "4px solid #00A86B" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
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
  );
}

function JobListSkeleton() {
  const block = { background:"linear-gradient(90deg, #F1F5F9 0%, #E5E7EB 50%, #F1F5F9 100%)", backgroundSize:"200% 100%", borderRadius:6, animation:"shimmer 1.4s linear infinite" };
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {[0,1,2].map(i => (
        <Card key={i}>
          <div style={{...block, height:14, width:240, marginBottom:10}} />
          <div style={{...block, height:10, width:340, marginBottom:14}} />
          <div style={{...block, height:8, marginBottom:6}} />
          <div style={{...block, height:8, width:"72%"}} />
        </Card>
      ))}
    </>
  );
}

function EmptyState({ icon="○", title, body }) {
  return (
    <Card style={{ textAlign:"center", padding:"36px 24px" }}>
      <div style={{ fontSize:34, marginBottom:10 }}>{icon}</div>
      <div style={{ fontWeight:700, color:"#0A2342", fontSize:15, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:"#6B7280", maxWidth:420, margin:"0 auto", lineHeight:1.6 }}>{body}</div>
    </Card>
  );
}


// ── Feature 4: Auto Apply ─────────────────────────────────────────────────────

/**
 * AutoApplyTab (T3 redesign)
 * --------------------------
 * Flow:
 *   1. Upload or paste resume (carries over from Resume AI tab)
 *   2. Click "Find Matching Jobs" — backend extracts a profile, then searches
 *   3. Browse ranked matches; click any to open the detail panel
 *   4. Detail panel offers two paths:
 *       a) Tailor Resume + Apply  → rewrite resume then pre-fill application
 *       b) Auto Apply             → pre-fill with the existing resume
 *   5. Review the pre-filled fields
 *   6. "I've Submitted This" moves the job to the Tracker (status: applied)
 *
 * We never auto-submit to an employer; the user always copies the fields
 * into the employer's form and clicks submit themselves.
 */
function AutoApplyTab({ token, resume, setResume, onSubmitted, userName }) {
  const [step,     setStep]     = useState("input");  // input | browse
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [profile,  setProfile]  = useState(null);
  const [matches,  setMatches]  = useState([]);
  const [selected, setSelected] = useState(null);     // job currently in detail panel

  async function findMatches() {
    if (!resume.trim()) { setError("Upload or paste your resume to start auto matching."); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const p = await apiPost("/resume/analyze", { resume_text: resume }, token);
      setProfile(p);
      const search = await apiPost("/jobs/search", {
        resume_text:    resume,
        resume_profile: p,
        work_mode:      "any",
      }, token);
      setMatches(search.jobs || []);
      setStep("browse");
      if ((search.jobs || []).length === 0) {
        setError("We couldn't find matches yet. Try adding more skills or experience details to your resume.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("input"); setProfile(null); setMatches([]); setSelected(null); setError(""); setSuccess("");
  }

  return (
    <div>
      <Card style={{ background:"#FFFBEB", borderColor:"#FDE68A" }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:20 }}>ℹ</span>
          <div>
            <div style={{ fontWeight:700, color:"#92400E", marginBottom:4 }}>Human review required</div>
            <div style={{ fontSize:13, color:"#78350F" }}>
              Lifebote pre-fills your application. <strong>You review every field before submitting.</strong>{" "}
              We never auto-submit on your behalf — this protects your professional reputation.
            </div>
          </div>
        </div>
      </Card>

      {step === "input" && (
        <Card>
          <SectionTitle>Step 1 — Your Resume</SectionTitle>
          <HelperText>Drop a file or paste text. We'll extract your skills, experience and target roles, then find jobs that fit.</HelperText>
          <DropZone onText={t => setResume(t)} helper="PDF or DOCX — we'll read it and pre-fill the box below" />
          <label style={S.label}>Resume text</label>
          <textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste or edit your resume here..." style={{...S.textarea, height:180}} />
          <div style={{ marginTop:14, display:"flex", justifyContent:"flex-end", gap:10 }}>
            <button onClick={findMatches} disabled={loading} style={S.btn}>
              {loading ? "Analyzing & matching…" : "Find Matching Jobs →"}
            </button>
          </div>
          <ErrorBox msg={error} />
          {loading && <ResultsSkeleton />}
        </Card>
      )}

      {step === "browse" && profile && (
        <>
          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
              <SectionTitle style={{ marginBottom:0 }}>Your profile</SectionTitle>
              <button onClick={reset} style={S.btnOutline}>← Change resume</button>
            </div>
            <ProfileChips profile={profile} />
          </Card>

          <SuccessToast msg={success} />
          <ErrorBox msg={error} />

          {matches.length === 0 ? (
            <EmptyState
              icon="🔎"
              title="No matches yet"
              body="Add more skills, job titles, or recent experience to your resume to help us find a better fit."
            />
          ) : (
            <>
              <p style={{ color:"#6B7280", marginBottom:12, fontSize:14 }}>
                <strong style={{color:"#0A2342"}}>{matches.length}</strong> job{matches.length===1?"":"s"} matched — click any to apply
              </p>
              {matches.map(job => (
                <button
                  key={job.id}
                  onClick={() => setSelected(job)}
                  style={{ all:"unset", display:"block", width:"100%", cursor:"pointer" }}
                >
                  <Card style={{
                    borderLeft: job.is_fake ? "4px solid #EF4444" : "4px solid #00A86B",
                    transition:"transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 4px 12px rgba(10,35,66,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)";    e.currentTarget.style.boxShadow="none"; }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
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
                        {job.match_reasons?.slice(0,3).map((r,i) => <Tag key={i} label={"✓ "+r} color="#059669" bg="#ECFDF5" />)}
                      </div>
                      <div style={{ textAlign:"center", flexShrink:0 }}>
                        <div style={{ fontSize:28, fontWeight:800, color:job.match_score>=75?"#00A86B":job.match_score>=50?"#F59E0B":"#EF4444" }}>{job.match_score}%</div>
                        <div style={{ fontSize:11, color:"#6B7280" }}>Match</div>
                        <div style={{ marginTop:6, color:"#0A2342", fontSize:11, fontWeight:600 }}>Open →</div>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </>
          )}
        </>
      )}

      {selected && (
        <JobDetailPanel
          job={selected}
          resume={resume}
          profile={profile}
          userName={userName}
          token={token}
          onClose={() => setSelected(null)}
          onSubmitted={app => { onSubmitted(app); setSelected(null); setSuccess(`Added ${app.job_title} to your Tracker.`); }}
        />
      )}
    </div>
  );
}

function ProfileChips({ profile }) {
  if (!profile) return null;
  const sections = [
    { label:"Target roles", values: profile.job_titles, bg:"#EEF2FF", color:"#1E40AF" },
    { label:"Top skills",   values: profile.skills,     bg:"#ECFDF5", color:"#065F46" },
    { label:"Industries",   values: profile.industries, bg:"#FEF3C7", color:"#92400E" },
    { label:"Locations",    values: profile.locations,  bg:"#F3F4F6", color:"#374151" },
  ];
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:14, marginBottom:8 }}>
        <Stat label="Experience" value={`${profile.experience_years} yr${profile.experience_years===1?"":"s"}`} />
        <Stat label="Seniority"  value={profile.seniority} capitalize />
        <Stat label="Skills"     value={profile.skills.length} />
        <Stat label="Matches by" value={`${(profile.industries||[]).length} industr${(profile.industries||[]).length===1?"y":"ies"}`} />
      </div>
      {sections.map(s => (
        s.values?.length ? (
          <div key={s.label} style={{ marginBottom:6 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>{s.label}</div>
            <div>{s.values.slice(0,12).map((v,i) => <Tag key={i} label={v} color={s.color} bg={s.bg} />)}</div>
          </div>
        ) : null
      ))}
    </div>
  );
}

function Stat({ label, value, capitalize }) {
  return (
    <div style={{ background:"#F8FAFC", border:"1px solid #E5E7EB", borderRadius:8, padding:"8px 14px", minWidth:80 }}>
      <div style={{ fontSize:10, color:"#6B7280", textTransform:"uppercase", letterSpacing:0.5, fontWeight:700 }}>{label}</div>
      <div style={{ fontSize:14, color:"#0A2342", fontWeight:700, textTransform:capitalize?"capitalize":"none" }}>{value}</div>
    </div>
  );
}

/**
 * Side panel that handles the apply flow for a single job.
 * Three internal states: detail → autofill in flight → review pre-filled fields.
 */
function JobDetailPanel({ job, resume, profile, userName, token, onClose, onSubmitted }) {
  const [busy,    setBusy]    = useState("");       // "" | "tailor" | "auto" | "tailoring"
  const [filled,  setFilled]  = useState(null);     // AutofillResponse
  const [tailored,setTailored]= useState(null);     // tailored resume text (when via tailor flow)
  const [error,   setError]   = useState("");

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function doAutoApply() {
    setError(""); setBusy("auto");
    try {
      const r = await apiPost("/applications/autofill", {
        resume_text:    resume,
        resume_profile: profile,
        job_description: job.job_description || job.title + " at " + job.company,
        job_title:       job.title,
        company_name:    job.company,
        job_id:          job.id,
      }, token);
      setFilled(r);
    } catch (e) { setError(e.message); }
    finally { setBusy(""); }
  }

  async function doTailorAndApply() {
    setError(""); setBusy("tailor");
    try {
      const tailorRes = await apiPost("/resume/tailor", {
        resume_text:     resume,
        job_description: job.job_description || `${job.title} at ${job.company}`,
        tone:            "professional",
      }, token);
      setTailored(tailorRes.tailored_resume);
      const r = await apiPost("/applications/autofill", {
        resume_text:     tailorRes.tailored_resume,
        resume_profile:  profile,
        job_description: job.job_description || `${job.title} at ${job.company}`,
        job_title:       job.title,
        company_name:    job.company,
        job_id:          job.id,
      }, token);
      setFilled(r);
    } catch (e) { setError(e.message); }
    finally { setBusy(""); }
  }

  function markSubmitted() {
    onSubmitted({
      id:            crypto.randomUUID(),
      job_id:        job.id,
      job_title:     job.title,
      company:       job.company,
      location:      job.location,
      salary_range:  job.salary_range,
      status:        "applied",
      applied_date:  new Date().toISOString(),
      follow_up_date:null,
      notes:         tailored ? "Applied with tailored resume." : null,
      next_step:     null,
      contacts:      [],
    });
  }

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(10,35,66,0.45)", zIndex:50, display:"flex", justifyContent:"flex-end", animation:"fadeIn 0.18s ease" }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"min(640px, 100%)",
          background:"#fff",
          overflowY:"auto",
          boxShadow:"-12px 0 32px rgba(0,0,0,0.18)",
          animation:"slideIn 0.22s ease",
        }}
      >
        <div style={{ position:"sticky", top:0, background:"#0A2342", color:"#fff", padding:"16px 22px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{job.title}</div>
            <div style={{ fontSize:12, color:"#94A3B8" }}>{job.company} · {job.location}</div>
          </div>
          <button onClick={onClose} title="Close (Esc)" style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.18)", color:"#fff", borderRadius:6, padding:"6px 12px", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Close ✕</button>
        </div>

        <div style={{ padding:"20px 22px" }}>
          {!filled && (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                <div style={{ fontSize:34, fontWeight:800, color:job.match_score>=75?"#00A86B":job.match_score>=50?"#F59E0B":"#EF4444" }}>{job.match_score}%</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0A2342" }}>Match score</div>
                  <div style={{ fontSize:12, color:"#6B7280" }}>How well your resume fits this role</div>
                </div>
              </div>

              {job.match_reasons?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={S.label}>Why you match</div>
                  {job.match_reasons.map((r,i) => <div key={i} style={{ fontSize:13, color:"#374151", marginBottom:4 }}>✓ {r}</div>)}
                </div>
              )}

              {job.missing_skills?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={S.label}>Gaps to consider</div>
                  <HelperText>These came up in the job description but not your resume. Tailoring helps cover them.</HelperText>
                  <div>{job.missing_skills.map((m,i) => <Tag key={i} label={m} color="#DC2626" bg="#FEF2F2" />)}</div>
                </div>
              )}

              {job.is_fake && job.fake_signals?.length > 0 && (
                <div style={{ background:"#FEF2F2", padding:"10px 14px", borderRadius:8, marginBottom:14, border:"1px solid #FECACA" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#DC2626", marginBottom:4 }}>⚠ Suspicious listing</div>
                  {job.fake_signals.map((s,i) => <div key={i} style={{ fontSize:12, color:"#991B1B" }}>• {s}</div>)}
                </div>
              )}

              <div style={{ marginBottom:14 }}>
                <div style={S.label}>Job description</div>
                <div style={{ background:"#F8FAFC", border:"1px solid #E5E7EB", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#374151", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
                  {job.job_description || `${job.title} at ${job.company}. (Full description not provided by source.)`}
                </div>
              </div>

              <ErrorBox msg={error} />
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:18 }}>
                <button onClick={doTailorAndApply} disabled={!!busy} style={{...S.btn, flex:1, minWidth:200}}>
                  {busy==="tailor" ? "Tailoring + pre-filling…" : "✦ Tailor Resume + Apply"}
                </button>
                <button onClick={doAutoApply} disabled={!!busy} style={{...S.btnOutline, flex:1, minWidth:200}}>
                  {busy==="auto" ? "Pre-filling…" : "Auto Apply (skip tailoring)"}
                </button>
              </div>
              <div style={{ fontSize:11, color:"#9CA3AF", marginTop:8, lineHeight:1.5 }}>
                Both options pre-fill an application for your review. <strong>You</strong> submit it on the employer's site.
              </div>
            </>
          )}

          {filled && (
            <ReviewPanel
              filled={filled}
              tailored={tailored}
              job={job}
              onMarkSubmitted={markSubmitted}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewPanel({ filled, tailored, job, onMarkSubmitted, onClose }) {
  const [copied, setCopied] = useState("");
  function copy(label, text) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1400);
  }
  const fields = [
    ["Full Name",   filled.full_name],
    ["Email",       filled.email],
    ["Phone",       filled.phone],
    ["LinkedIn",    filled.linkedin_url],
  ];

  return (
    <div>
      <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"12px 14px", marginBottom:14 }}>
        <div style={{ fontWeight:700, color:"#15803D", fontSize:14 }}>✓ Application is pre-filled</div>
        <div style={{ fontSize:12, color:"#166534", marginTop:2 }}>
          Copy each field into the employer's form on <a href={job.apply_url} target="_blank" rel="noreferrer" style={{ color:"#15803D", fontWeight:700 }}>{job.apply_url ? "their site" : "the apply page"}</a>, then come back and confirm.
        </div>
      </div>

      {tailored && (
        <div style={{ marginBottom:14 }}>
          <div style={S.label}>Tailored resume (used for this application)</div>
          <pre style={{...S.codeBlock, maxHeight:160 }}>{tailored}</pre>
          <button onClick={()=>copy("resume", tailored)} style={S.btnOutline}>{copied==="resume" ? "Copied ✓" : "Copy resume"}</button>
        </div>
      )}

      {fields.map(([label, value]) => (
        <div key={label} style={S.fieldGroup}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <label style={S.label}>{label}</label>
            <button onClick={()=>copy(label, value || "")} style={{ background:"transparent", border:"none", color:"#00A86B", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{copied===label ? "Copied ✓" : "Copy"}</button>
          </div>
          <div style={S.fieldVal}>{value}</div>
        </div>
      ))}

      <div style={S.fieldGroup}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <label style={S.label}>Summary</label>
          <button onClick={()=>copy("summary", filled.summary || "")} style={{ background:"transparent", border:"none", color:"#00A86B", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{copied==="summary" ? "Copied ✓" : "Copy"}</button>
        </div>
        <div style={{...S.fieldVal, lineHeight:1.7}}>{filled.summary}</div>
      </div>

      {filled.skills?.length > 0 && (
        <div style={S.fieldGroup}>
          <label style={S.label}>Skills</label>
          <div>{filled.skills.map((s,i) => <Tag key={i} label={s} />)}</div>
        </div>
      )}

      {filled.work_experience?.length > 0 && (
        <div style={S.fieldGroup}>
          <label style={S.label}>Work Experience</label>
          {filled.work_experience.map((w,i) => (
            <div key={i} style={{ background:"#F8FAFC", borderRadius:8, padding:"12px 14px", marginBottom:8 }}>
              <div style={{ fontWeight:700, color:"#0A2342", marginBottom:4 }}>{w.title} · {w.company} <span style={{ color:"#6B7280", fontWeight:400, fontSize:13 }}>({w.dates})</span></div>
              {w.bullets?.map((b,j) => <div key={j} style={{ fontSize:13, color:"#374151", paddingLeft:12, borderLeft:"2px solid #E5E7EB", marginBottom:3 }}>• {b}</div>)}
            </div>
          ))}
        </div>
      )}

      <div style={S.fieldGroup}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <label style={S.label}>Cover Letter</label>
          <button onClick={()=>copy("cover", filled.cover_letter || "")} style={{ background:"transparent", border:"none", color:"#00A86B", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{copied==="cover" ? "Copied ✓" : "Copy"}</button>
        </div>
        <pre style={{...S.codeBlock, fontSize:13, lineHeight:1.7 }}>{filled.cover_letter}</pre>
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:18 }}>
        {job.apply_url && (
          <a href={job.apply_url} target="_blank" rel="noreferrer" style={{...S.btnOutline, textDecoration:"none", display:"inline-flex", alignItems:"center"}}>Open employer's site →</a>
        )}
        <button onClick={onMarkSubmitted} style={{...S.btn, flex:1, minWidth:200}}>
          I've Submitted This → Add to Tracker
        </button>
      </div>
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

  // Resume text is shared across Resume AI, Job Search, and Auto Apply so users
  // don't have to paste it three times. Persisted to localStorage so it survives
  // a page reload (intentionally NOT sent to the backend yet — the backend
  // store is in-memory and the "save resume to account" feature is deferred).
  const [resumeText, setResumeText] = useState(() => {
    try { return localStorage.getItem("lb_resume") || ""; } catch { return ""; }
  });
  function saveResume(t) {
    setResumeText(t);
    try { localStorage.setItem("lb_resume", t); } catch {}
  }

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

  // Used by the Auto Apply flow when the user clicks "I've Submitted This".
  // Adds the job to the tracker with status: "applied" and switches tab.
  function handleSubmittedFromAutoApply(app) {
    // Idempotency: if the same job is already in the tracker, just bump its status.
    if (applications.find(a => a.job_id === app.job_id)) {
      saveApps(applications.map(a => a.job_id === app.job_id ? { ...a, status:"applied", applied_date:a.applied_date || app.applied_date } : a));
    } else {
      saveApps([...applications, app]);
    }
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
      {/* Header — stacks on narrow screens via flex-wrap */}
      <div style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22, color:"#00A86B" }}>⚓</span>
          <span style={{ fontSize:19, fontWeight:800, color:"#fff", letterSpacing:-0.5 }}>Lifebote</span>
          <span style={{ fontSize:11, color:"#00A86B", fontWeight:700, background:"rgba(0,168,107,0.15)", padding:"2px 8px", borderRadius:4 }}>BETA</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ color:"#94A3B8", fontSize:13 }} title={user?.email}>{user?.full_name}</span>
          <span style={{ background:"rgba(0,168,107,0.15)", color:"#00A86B", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{user?.plan}</span>
          <button onClick={logout} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.15)", color:"#94A3B8", borderRadius:6, padding:"5px 12px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Sign Out</button>
        </div>
      </div>

      {/* Nav */}
      <div style={S.nav}>
        <div style={{ display:"flex", gap:2, overflowX:"auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={tab===t.id ? S.navTabOn : S.navTabOff} title={t.label}>
              <span style={{ marginRight:6 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        {tab==="resume"    && <ResumeTab    token={token} resume={resumeText} setResume={saveResume} userName={user?.full_name} />}
        {tab==="jobs"      && <JobsTab      token={token} onTrack={handleTrack} resume={resumeText} setResume={saveResume} />}
        {tab==="apply"     && <AutoApplyTab token={token} resume={resumeText} setResume={saveResume} onSubmitted={handleSubmittedFromAutoApply} userName={user?.full_name} />}
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
  header:     { background:"#0A2342", padding:"14px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" },
  nav:        { background:"#fff", borderBottom:"2px solid #E5E7EB", padding:"0 22px", overflowX:"auto" },
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
