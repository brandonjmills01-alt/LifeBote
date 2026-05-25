import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function AuthPage() {
  const [mode,     setMode]     = useState("login");
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const { login, signup }       = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (mode === "signup" && password !== confirm) { setError("Passwords don't match."); return; }
    if (mode === "signup" && password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      mode === "login" ? await login(email, password) : await signup(fullName, email, password);
    } catch (err) { setError(String(err.message)); }
    finally { setLoading(false); }
  }

  function sw(m) { setMode(m); setError(""); setFullName(""); setEmail(""); setPassword(""); setConfirm(""); }

  return (
    <div style={S.page}>
      {/* Left panel */}
      <div style={S.left}>
        <div style={S.leftInner}>
          <div style={S.logo}>
            <span style={S.logoIcon}>⚓</span>
            <span style={S.logoText}>Lifebote</span>
          </div>
          <h1 style={S.headline}>Navigate your career with confidence.</h1>
          <p style={S.sub}>AI-powered job matching, resume tailoring, and career intelligence — all in one platform.</p>
          <div style={S.features}>
            {["AI Resume Tailoring","Smart Job Matching","Salary Intelligence","Portfolio Builder","Fake Job Detection"].map((f,i) => (
              <div key={i} style={S.feature}><span style={S.featureDot} />  {f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={S.right}>
        <div style={S.formBox}>
          <h2 style={S.formTitle}>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p style={S.formSub}>{mode === "login" ? "Sign in to continue" : "Free to get started"}</p>

          <div style={S.tabs}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => sw(m)} style={mode===m ? S.tabOn : S.tabOff}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode === "signup" && (
              <div>
                <label style={S.label}>Full Name</label>
                <input style={S.input} type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Jane Smith" required />
              </div>
            )}
            <div>
              <label style={S.label}>Email Address</label>
              <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="signup" ? "Min. 8 characters" : "Your password"} required />
            </div>
            {mode === "signup" && (
              <div>
                <label style={S.label}>Confirm Password</label>
                <input style={S.input} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" required />
              </div>
            )}
            {error && <div style={S.error}>{error}</div>}
            <button type="submit" disabled={loading} style={S.submit}>
              {loading ? "Please wait..." : (mode==="login" ? "Sign In →" : "Create Account →")}
            </button>
          </form>

          <p style={S.switchText}>
            {mode==="login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={()=>sw(mode==="login"?"signup":"login")} style={S.switchBtn}>
              {mode==="login" ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:       { display:"flex", minHeight:"100vh", fontFamily:"'DM Sans', sans-serif" },
  left:       { flex:1, background:"#0A2342", display:"flex", alignItems:"center", padding:"60px 48px" },
  leftInner:  { maxWidth:440 },
  logo:       { display:"flex", alignItems:"center", gap:10, marginBottom:48 },
  logoIcon:   { fontSize:28, color:"#00A86B" },
  logoText:   { fontSize:22, fontWeight:800, color:"#fff", letterSpacing:-0.5 },
  headline:   { fontSize:"2.2rem", fontWeight:700, color:"#fff", lineHeight:1.2, marginBottom:16, fontFamily:"'DM Serif Display', serif" },
  sub:        { color:"#94A3B8", fontSize:15, lineHeight:1.7, marginBottom:36 },
  features:   { display:"flex", flexDirection:"column", gap:12 },
  feature:    { color:"#CBD5E1", fontSize:14, display:"flex", alignItems:"center", gap:10 },
  featureDot: { width:6, height:6, borderRadius:"50%", background:"#00A86B", flexShrink:0, display:"inline-block" },
  right:      { flex:1, background:"#F8FAFC", display:"flex", alignItems:"center", justifyContent:"center", padding:40 },
  formBox:    { width:"100%", maxWidth:420, background:"#fff", borderRadius:12, padding:"40px 36px", boxShadow:"0 4px 32px rgba(0,0,0,0.08)" },
  formTitle:  { fontSize:"1.6rem", fontWeight:700, color:"#0A2342", marginBottom:4, fontFamily:"'DM Serif Display', serif" },
  formSub:    { color:"#6B7280", fontSize:14, marginBottom:28 },
  tabs:       { display:"flex", background:"#F1F5F9", borderRadius:8, padding:4, marginBottom:24 },
  tabOn:      { flex:1, padding:"9px 0", background:"#0A2342", color:"#fff", border:"none", borderRadius:6, fontWeight:700, fontSize:14, cursor:"pointer" },
  tabOff:     { flex:1, padding:"9px 0", background:"transparent", color:"#6B7280", border:"none", borderRadius:6, fontWeight:500, fontSize:14, cursor:"pointer" },
  label:      { display:"block", color:"#374151", fontSize:12, fontWeight:600, marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 },
  input:      { width:"100%", boxSizing:"border-box", border:"1.5px solid #E5E7EB", borderRadius:8, padding:"11px 14px", fontSize:14, fontFamily:"inherit", color:"#1F2937", outline:"none", background:"#FAFAFA" },
  submit:     { width:"100%", padding:"13px 0", background:"#0A2342", color:"#fff", border:"none", borderRadius:8, fontSize:15, fontWeight:700, cursor:"pointer", marginTop:4 },
  error:      { background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, color:"#DC2626", padding:"10px 14px", fontSize:13 },
  switchText: { textAlign:"center", color:"#6B7280", fontSize:13, marginTop:20 },
  switchBtn:  { background:"none", border:"none", color:"#00A86B", cursor:"pointer", fontWeight:700, fontSize:13, padding:0 },
};
