import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./AuthContext";
import AuthPage from "./AuthPage";
import App from "./App";

function Root() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0A2342", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontFamily:"sans-serif", fontSize:18 }}>
      ⚓ Loading Lifebote...
    </div>
  );
  return user ? <App /> : <AuthPage />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>
);
