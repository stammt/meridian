import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../hooks/useAuth.jsx";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0a0c14; }
  ::-webkit-scrollbar-thumb { background: #c8830a; border-radius: 2px; }
  button { cursor: pointer; }
`;

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Starfield() {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      {[...Array(60)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: Math.random() > 0.9 ? "2px" : "1px",
            height: Math.random() > 0.9 ? "2px" : "1px",
            background: `rgba(255,255,255,${0.15 + Math.random() * 0.5})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            borderRadius: "50%",
          }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.stories
      .list()
      .then(({ stories }) => setStories(stories))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const { story } = await api.stories.create();
      navigate(`/story/${story.id}`);
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this mission log? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.stories.delete(id);
      setStories((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e.message);
    }
    setDeletingId(null);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05060f",
        fontFamily: "'Share Tech Mono', monospace",
      }}
    >
      <style>{styles}</style>
      <Starfield />

      {/* Header */}
      <div
        style={{
          background: "#0a0c1a",
          borderBottom: "2px solid #c8830a22",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            alignItems: "center",
            height: "52px",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "#c8830a",
              width: "28px",
              height: "36px",
              borderRadius: "18px 0 0 18px",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.55rem",
                color: "#c8830a",
                letterSpacing: "0.3em",
              }}
            >
              VANTAGE DEEP EXPLORATION
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#f5a623",
                letterSpacing: "0.08em",
                lineHeight: 1,
              }}
            >
              MISSION LOGS
            </div>
          </div>
          <div
            style={{
              fontSize: "0.65rem",
              color: "#6a5d48",
              marginRight: "0.5rem",
            }}
          >
            {user?.email}
          </div>
          <button
            onClick={logout}
            style={{
              background: "none",
              border: "1px solid #c8830a44",
              color: "#c8830a",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              padding: "0.3rem 0.7rem",
              borderRadius: "8px",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#c8830a22";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "none";
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: "820px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* New mission button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.6rem",
                color: "#c8830a",
                letterSpacing: "0.3em",
                marginBottom: "0.2rem",
              }}
            >
              ESV THRESHOLD · VS-7
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "#e8dcc8",
              }}
            >
              {stories.length === 0 && !loading
                ? "No missions on record"
                : `${stories.length} mission${stories.length !== 1 ? "s" : ""} on record`}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              background: creating ? "#4a3010" : "#c8830a",
              color: creating ? "#6a5030" : "#05060f",
              border: "none",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              padding: "0.7rem 1.5rem",
              borderRadius: "0 16px 16px 0",
              textTransform: "uppercase",
              transition: "all 0.2s",
              boxShadow: creating ? "none" : "0 0 20px rgba(200,131,10,0.2)",
            }}
            onMouseEnter={(e) => {
              if (!creating) {
                e.target.style.background = "#f5a623";
              }
            }}
            onMouseLeave={(e) => {
              if (!creating) {
                e.target.style.background = "#c8830a";
              }
            }}
          >
            {creating ? "Generating..." : "+ New Mission"}
          </button>
        </div>

        {creating && (
          <div
            style={{
              border: "1px solid #c8830a33",
              borderLeft: "3px solid #c8830a",
              background: "rgba(200,131,10,0.04)",
              padding: "1.2rem 1.4rem",
              marginBottom: "1.5rem",
              animation: "fadeUp 0.3s ease",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}
            >
              <div style={{ display: "flex", gap: "4px" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "3px",
                      height: "10px",
                      background: "#c8830a",
                      borderRadius: "2px",
                      animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.68rem",
                  color: "#c8830a",
                  letterSpacing: "0.2em",
                }}
              >
                VANTAGE COMPUTER GENERATING MISSION...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              color: "#e05c00",
              fontSize: "0.75rem",
              padding: "0.6rem 0.8rem",
              borderLeft: "3px solid #e05c00",
              background: "rgba(224,92,0,0.06)",
              marginBottom: "1.5rem",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              color: "#4a4030",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              padding: "2rem 0",
            }}
          >
            LOADING MISSION LOGS...
          </div>
        ) : stories.length === 0 ? (
          <div
            style={{
              border: "1px dashed #c8830a22",
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "#4a4030",
                letterSpacing: "0.1em",
                marginBottom: "0.8rem",
              }}
            >
              NO MISSIONS ON RECORD
            </div>
            <div
              style={{ fontSize: "0.75rem", color: "#6a5d48", lineHeight: 1.7 }}
            >
              Start a new mission to begin your journey into the deep.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {stories.map((story, i) => (
              <div
                key={story.id}
                onClick={() => navigate(`/story/${story.id}`)}
                style={{
                  border: "1px solid #c8830a22",
                  borderLeft: "3px solid #c8830a44",
                  background: "rgba(12,10,5,0.7)",
                  padding: "1.2rem 1.4rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderLeftColor = "#c8830a";
                  e.currentTarget.style.background = "rgba(200,131,10,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderLeftColor = "#c8830a44";
                  e.currentTarget.style.background = "rgba(12,10,5,0.7)";
                }}
              >
                {/* Status indicator */}
                {(() => {
                  const cfg = {
                    active: { color: "#c8830a", label: "ACTIVE" },
                    complete: { color: "#5bc8af", label: "COMPLETE" },
                    failed: { color: "#c84040", label: "FAILED" },
                  }[story.status] || { color: "#c8830a", label: "ACTIVE" };
                  return (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: cfg.color,
                        flexShrink: 0,
                        marginTop: "2px",
                        boxShadow: `0 0 6px ${cfg.color}88`,
                      }}
                      title={cfg.label}
                    />
                  );
                })()}

                {/* Story info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      marginBottom: "0.2rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        color: "#e8dcc8",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {story.title}
                    </div>
                    {story.status !== "active" && (
                      <span
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: "0.55rem",
                          letterSpacing: "0.15em",
                          color:
                            story.status === "complete" ? "#5bc8af" : "#c84040",
                          border: `1px solid ${story.status === "complete" ? "#5bc8af44" : "#c8404044"}`,
                          padding: "0.1rem 0.4rem",
                          borderRadius: "3px",
                        }}
                      >
                        {story.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {story.scenario?.surface_situation && (
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#4a4a30",
                        marginBottom: "0.25rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {story.scenario.surface_situation}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#6a5d48",
                      display: "flex",
                      gap: "1rem",
                    }}
                  >
                    <span>Created {formatDate(story.created_at)}</span>
                    <span>·</span>
                    <span>Updated {formatDate(story.updated_at)}</span>
                    <span>·</span>
                    <span>{Math.floor(story.message_count / 2)} exchanges</span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(story.id, e)}
                  disabled={deletingId === story.id}
                  style={{
                    background: "none",
                    border: "1px solid transparent",
                    color: "#4a4030",
                    fontFamily: "inherit",
                    fontSize: "0.65rem",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "4px",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "#e05c0044";
                    e.target.style.color = "#e05c00";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "transparent";
                    e.target.style.color = "#4a4030";
                  }}
                  title="Delete mission"
                >
                  {deletingId === story.id ? "..." : "✕"}
                </button>

                <div
                  style={{
                    color: "#c8830a",
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  ›
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
