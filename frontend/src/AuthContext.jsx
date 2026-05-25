import { createContext, useContext, useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const Ctx  = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("lb_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u  => { if (u) setUser(u); else _clear(); })
      .catch(_clear)
      .finally(() => setLoading(false));
  }, []);

  function _save(tok, u) { localStorage.setItem("lb_token", tok); setToken(tok); setUser(u); }
  function _clear()       { localStorage.removeItem("lb_token"); setToken(null); setUser(null); }

  async function signup(fullName, email, password) {
    const res  = await fetch(`${API}/auth/signup`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({full_name:fullName,email,password}) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Signup failed.");
    _save(data.access_token, data.user);
  }

  async function login(email, password) {
    const res  = await fetch(`${API}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,password}) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed.");
    _save(data.access_token, data.user);
  }

  return <Ctx.Provider value={{ user, token, loading, signup, login, logout: _clear }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const API_URL = API;
