import { useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { Starfield } from "../components/Starfield.jsx";
import { CornerBrackets } from "../components/CornerBrackets.jsx";
import shipImg from "../assets/esv_threshold_jupiter.png";

const errorMessages = {
  missing_token: "Login link was incomplete.",
  invalid_token: "Login link not recognised — it may have already been used.",
  token_used: "This login link has already been used. Request a new one.",
  token_expired: "Login link has expired. Request a new one.",
  server_error: "Something went wrong. Please try again.",
  not_in_beta: "The game is not open yet. Check back soon.",
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
    body { background: #04050a; }
    input:focus { outline: none; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
    @keyframes pulseGlow { 0%,100%{opacity:0.6; filter:brightness(1)} 50%{opacity:1; filter:brightness(1.5)} }
  `;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#04050a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end", // Push content down
        fontFamily: "'Share Tech Mono', monospace",
        padding: "2rem 1rem 6rem", // Add extra padding at the bottom to balance the push
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{styles}</style>
      <Starfield />

      {/* Hero Image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "1000px",
          height: "70vh",
          opacity: 0.8,
          pointerEvents: "none",
          zIndex: 1,
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      >
        <img
          src={shipImg}
          alt="ESV Threshold"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            animation: "float 14s ease-in-out infinite",
          }}
        />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          position: "relative",
          zIndex: 2,
          animation: "fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        }}
      >


        {/* Main Panel */}
        <div
          style={{
            border: "1px solid #1aadad2a",
            borderLeft: "3px solid #1aadad55",
            background: "rgba(4,6,12,0.85)",
            padding: "2.5rem 2.2rem",
            position: "relative",
            backdropFilter: "blur(6px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}
        >
          <CornerBrackets />

          <h1
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "2.3rem",
              fontWeight: 700,
              color: "#d8e8f2",
              margin: "0 0 0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            VANTAGE DEEP
          </h1>
          <div
            style={{
              fontSize: "0.7rem",
              color: "#1aadad",
              letterSpacing: "0.22em",
              marginBottom: "2rem",
              borderBottom: "1px solid #1aadad22",
              paddingBottom: "1.2rem",
            }}
          >
            DEEP SPACE EXPLORATION COMMAND
          </div>

          <div
            style={{
              marginBottom: "2.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
            }}
          >
            <p
              style={{
                color: "#8aa0b0",
                fontSize: "0.85rem",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              The universe is vast, uncaring, and entirely reactive to your commands. You are Captain Maren Cole of the ESV Threshold. The choices you make ripple across the system.
            </p>
            <p
              style={{
                color: "#5a7888",
                fontSize: "0.85rem",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              No preset paths. Speak your orders into the terminal and watch the crew, the ship, and the void respond.
            </p>
          </div>

          {error && (
            <div
              style={{
                color: "#d04040",
                fontSize: "0.75rem",
                padding: "0.9rem 1.1rem",
                borderLeft: "3px solid #d04040",
                background: "rgba(208,64,64,0.08)",
                marginBottom: "1.5rem",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.2em",
                  marginBottom: "0.3rem",
                }}
              >
                SYS_ERR
              </div>
              {errorMessages[error] || error}
            </div>
          )}

          {submitted ? (
            <div
              style={{
                textAlign: "center",
                padding: "1.5rem 0",
                animation: "fadeIn 0.5s ease",
              }}
            >
              <div
                style={{
                  fontSize: "2.5rem",
                  marginBottom: "1rem",
                  animation: "pulseGlow 2s infinite",
                }}
              >
                📡
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.85rem",
                  color: "#28c898",
                  letterSpacing: "0.25em",
                  marginBottom: "0.8rem",
                  fontWeight: 600,
                }}
              >
                TRANSMISSION SENT
              </div>
              <p
                style={{
                  color: "#7a9ab0",
                  fontSize: "0.85rem",
                  lineHeight: 1.75,
                }}
              >
                A one-time access link has been dispatched. Awaiting operator authorization.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  marginTop: "2rem",
                  background: "none",
                  border: "1px solid #1aadad33",
                  padding: "0.6rem 1.2rem",
                  color: "#1aadad",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  letterSpacing: "0.15em",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(26,173,173,0.1)";
                  e.currentTarget.style.borderColor = "#1aadad66";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.borderColor = "#1aadad33";
                }}
              >
                ← RE-ENTER CREDENTIALS
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ animation: "fadeIn 0.5s ease" }}
            >
              <div style={{ marginBottom: "1.8rem" }}>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.65rem",
                    color: "#1aadad",
                    letterSpacing: "0.2em",
                    marginBottom: "0.6rem",
                  }}
                >
                  OPERATOR EMAIL CLEARANCE
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="commander@vantage.deep"
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    background: "rgba(0,4,12,0.6)",
                    border: "1px solid #1aadad44",
                    borderLeft: "3px solid #1aadad",
                    color: "#22c8b8",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "1rem",
                    padding: "1rem 1.2rem",
                    caretColor: "#22c8b8",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#22c8b8";
                    e.target.style.background = "rgba(4,10,20,0.8)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#1aadad44";
                    e.target.style.background = "rgba(0,4,12,0.6)";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                style={{
                  width: "100%",
                  background:
                    submitting || !email.trim()
                      ? "rgba(26,173,173,0.05)"
                      : "rgba(26,173,173,0.15)",
                  color:
                    submitting || !email.trim() ? "#2a5060" : "#22c8b8",
                  border: `1px solid ${
                    submitting || !email.trim() ? "#1aadad22" : "#1aadad"
                  }`,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  letterSpacing: "0.25em",
                  padding: "1rem",
                  cursor: submitting
                    ? "wait"
                    : email.trim()
                      ? "pointer"
                      : "not-allowed",
                  transition: "all 0.2s",
                  textTransform: "uppercase",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  if (!submitting && email.trim()) {
                    e.currentTarget.style.background = "#1aadad";
                    e.currentTarget.style.color = "#04050a";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting && email.trim()) {
                    e.currentTarget.style.background = "rgba(26,173,173,0.15)";
                    e.currentTarget.style.color = "#22c8b8";
                  }
                }}
              >
                {submitting ? "UPLINKING..." : "INITIALIZE LOGIN SEQ →"}
              </button>

              <p
                style={{
                  color: "#3d5060",
                  fontSize: "0.65rem",
                  marginTop: "1.2rem",
                  lineHeight: 1.6,
                  textAlign: "center",
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: "0.1em",
                }}
              >
                NO PASSWORD REQUIRED. SECURE LINK DISPATCHED VIA EMAIL.
              </p>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
