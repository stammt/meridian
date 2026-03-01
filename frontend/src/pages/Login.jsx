import { useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../hooks/useAuth.jsx";

const errorMessages = {
  missing_token: "Login link was incomplete.",
  invalid_token: "Login link not recognised — it may have already been used.",
  token_used: "This login link has already been used. Request a new one.",
  token_expired: "Login link has expired. Request a new one.",
  server_error: "Something went wrong. Please try again.",
};

export default function Login() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(searchParams.get("error"));

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.auth.sendLink(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
    * { box-sizing: border-box; }
    body { background: #05060f; }
    input:focus { outline: none; }
  `;

  return (
    <div style={{ minHeight: "100vh", background: "#05060f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Share Tech Mono', monospace", padding: "1rem" }}>
      <style>{styles}</style>

      <div style={{ width: "100%", maxWidth: "440px" }}>
        {/* LCARS header decoration */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "1.5rem" }}>
          <div style={{ background: "#c8830a", width: "48px", height: "56px", borderRadius: "28px 4px 4px 28px" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ background: "#c8830a", height: "18px", borderRadius: "4px" }} />
            <div style={{ display: "flex", gap: "6px" }}>
              <div style={{ background: "#cc9900", height: "32px", flex: 2, borderRadius: "4px" }} />
              <div style={{ background: "#e05c00", height: "32px", flex: 1, borderRadius: "4px" }} />
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid #c8830a22", background: "rgba(12,10,5,0.95)", padding: "2rem" }}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.58rem", color: "#c8830a", letterSpacing: "0.35em", marginBottom: "0.4rem" }}>
            STARFLEET COMPUTER // ACCESS TERMINAL
          </div>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.9rem", fontWeight: 700, color: "#f5a623", margin: "0 0 0.2rem", textShadow: "0 0 20px rgba(245,166,35,0.3)" }}>
            USS MERIDIAN
          </h1>
          <div style={{ fontSize: "0.62rem", color: "#c8830a", letterSpacing: "0.18em", marginBottom: "2rem" }}>
            NCC-74700 · SHACKLETON EXPANSE MISSION
          </div>

          {error && (
            <div style={{ color: "#e05c00", fontSize: "0.75rem", padding: "0.6rem 0.8rem", borderLeft: "3px solid #e05c00", background: "rgba(224,92,0,0.06)", marginBottom: "1.2rem" }}>
              ⚠ {errorMessages[error] || error}
            </div>
          )}

          {submitted ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📡</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", color: "#c8830a", letterSpacing: "0.2em", marginBottom: "0.8rem" }}>
                TRANSMISSION SENT
              </div>
              <p style={{ color: "#9e8f72", fontSize: "0.82rem", lineHeight: 1.75 }}>
                Check your inbox for a login link. It expires in 15 minutes.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{ marginTop: "1.5rem", background: "none", border: "none", color: "#c8830a", fontFamily: "inherit", fontSize: "0.72rem", cursor: "pointer", letterSpacing: "0.1em" }}
              >
                ← Use a different address
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "1.2rem" }}>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", color: "#c8830a", letterSpacing: "0.2em", marginBottom: "0.5rem" }}>
                  OFFICER EMAIL ADDRESS
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  style={{
                    width: "100%", background: "rgba(0,0,0,0.4)",
                    border: "1px solid #c8830a44", borderLeft: "3px solid #c8830a",
                    color: "#f5a623", fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "0.9rem", padding: "0.75rem 0.9rem", caretColor: "#f5a623",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                style={{
                  width: "100%",
                  background: submitting || !email.trim() ? "#4a3010" : "#c8830a",
                  color: submitting || !email.trim() ? "#6a5030" : "#05060f",
                  border: "none", fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.2em",
                  padding: "0.9rem", cursor: submitting ? "wait" : "pointer",
                  borderRadius: "0 0 20px 0", transition: "all 0.2s",
                  textTransform: "uppercase",
                }}
              >
                {submitting ? "Sending..." : "Send Login Link →"}
              </button>

              <p style={{ color: "#4a4030", fontSize: "0.65rem", marginTop: "1rem", lineHeight: 1.6, textAlign: "center" }}>
                No password required. We'll email you a one-time link.
              </p>
            </form>
          )}
        </div>

        <div style={{ display: "flex", gap: "6px", marginTop: "1rem" }}>
          <div style={{ background: "#e05c00", width: "60px", height: "10px", borderRadius: "4px" }} />
          <div style={{ background: "#c8830a", flex: 1, height: "10px", borderRadius: "4px" }} />
          <div style={{ background: "#cc9900", width: "30px", height: "10px", borderRadius: "4px" }} />
        </div>
      </div>
    </div>
  );
}
