import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #080a14; }
  ::-webkit-scrollbar-thumb { background: #1aadad; border-radius: 2px; }
  button { cursor: pointer; }
`;

function Starfield() {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: Math.random() > 0.9 ? "2px" : "1px",
            height: Math.random() > 0.9 ? "2px" : "1px",
            background: `rgba(255,255,255,${0.1 + Math.random() * 0.4})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            borderRadius: "50%",
          }}
        />
      ))}
    </div>
  );
}

function SectionHeader({ label, color = "#1aadad" }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <div
          style={{
            background: color,
            height: "2px",
            width: "20px",
            borderRadius: "1px",
          }}
        />
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.72rem",
            color,
            letterSpacing: "0.3em",
          }}
        >
          {label}
        </div>
        <div style={{ background: `${color}33`, height: "1px", flex: 1 }} />
      </div>
    </div>
  );
}

// ── Character card ────────────────────────────────────────────────────────────

const CHAR_COLORS = [
  "#4a9eff",
  "#cc9900",
  "#e05c00",
  "#c84040",
  "#28c898",
  "#9a6fff",
  "#ff8c42",
];
function charColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CHAR_COLORS[Math.abs(hash) % CHAR_COLORS.length];
}

const STATUS_CFG = {
  active: { label: "ACTIVE", color: "#28c898" },
  injured: { label: "INJURED", color: "#d08040" },
  dead: { label: "DECEASED", color: "#d04040" },
  absent: { label: "ABSENT", color: "#3d6078" },
};

function CharacterCard({ character, index }) {
  const color = charColor(character.name);
  const initial = character.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const statusCfg = STATUS_CFG[character.status] || STATUS_CFG.active;
  const isDead = character.status === "dead";

  return (
    <div
      style={{
        border: "1px solid #1aadad18",
        borderLeft: `2px solid ${isDead ? "#3d404433" : color + "66"}`,
        background: isDead ? "rgba(4,6,12,0.4)" : "rgba(4,6,12,0.7)",
        padding: "1rem 1.2rem",
        opacity: isDead ? 0.55 : 1,
        animation: `fadeUp 0.3s ease ${index * 0.04}s both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.8rem" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            flexShrink: 0,
            background: `${color}18`,
            border: `1.5px solid ${color}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            color,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "0.25rem",
            }}
          >
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "#d8e8f2",
                letterSpacing: "0.04em",
              }}
            >
              {character.name}
            </span>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.52rem",
                color: color + "aa",
                letterSpacing: "0.1em",
                border: `1px solid ${color}33`,
                padding: "0.1rem 0.4rem",
                borderRadius: "2px",
              }}
            >
              {character.role?.toUpperCase()}
            </span>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                letterSpacing: "0.1em",
                color: statusCfg.color,
                border: `1px solid ${statusCfg.color}44`,
                padding: "0.1rem 0.35rem",
                borderRadius: "2px",
              }}
            >
              {statusCfg.label}
            </span>
            {character.type === "npc" && (
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.48rem",
                  letterSpacing: "0.1em",
                  color: "#3d6078",
                  border: "1px solid #1aadad22",
                  padding: "0.1rem 0.35rem",
                  borderRadius: "2px",
                }}
              >
                NPC
              </span>
            )}
          </div>
          {character.notes && (
            <p
              style={{
                fontSize: "0.77rem",
                color: "#6a8a9a",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {character.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Vessel card ───────────────────────────────────────────────────────────────

function VesselCard({ vessel, index }) {
  return (
    <div
      style={{
        border: "1px solid #1aadad18",
        borderLeft: "2px solid #2a60c066",
        background: "rgba(4,6,12,0.7)",
        padding: "1rem 1.2rem",
        animation: `fadeUp 0.3s ease ${index * 0.04}s both`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.6rem",
          marginBottom: "0.25rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            fontSize: "0.95rem",
            color: "#d8e8f2",
            letterSpacing: "0.04em",
          }}
        >
          {vessel.name}
        </span>
        {vessel.designation && (
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.55rem",
              color: "#2a80e8",
              letterSpacing: "0.1em",
              border: "1px solid #2a60c044",
              padding: "0.1rem 0.4rem",
              borderRadius: "2px",
            }}
          >
            {vessel.designation}
          </span>
        )}
        {vessel.owner && (
          <span style={{ fontSize: "0.65rem", color: "#3d6078" }}>
            {vessel.owner}
          </span>
        )}
      </div>
      {vessel.notes && (
        <p
          style={{
            fontSize: "0.77rem",
            color: "#6a8a9a",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {vessel.notes}
        </p>
      )}
    </div>
  );
}

// ── Event entry ───────────────────────────────────────────────────────────────

function EventEntry({ event, index }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
        padding: "0.8rem 0",
        borderBottom: "1px solid #1aadad0a",
        animation: `fadeUp 0.3s ease ${index * 0.04}s both`,
      }}
    >
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.6rem",
          color: "#1aadad44",
          flexShrink: 0,
          paddingTop: "2px",
          width: "1.5rem",
          textAlign: "right",
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            fontSize: "0.8rem",
            color: "#9ab8c8",
            letterSpacing: "0.04em",
            marginBottom: "0.2rem",
          }}
        >
          {event.story_title}
        </div>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#5a7888",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {event.summary}
        </p>
      </div>
    </div>
  );
}

// ── Codex page ────────────────────────────────────────────────────────────────

export default function Codex() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [world, setWorld] = useState(null);
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.worlds
      .codex(id)
      .then(({ world, activeStoryId }) => {
        setWorld(world);
        setActiveStoryId(activeStoryId);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#04050a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          color: "#1aadad",
          fontSize: "0.75rem",
          letterSpacing: "0.3em",
        }}
      >
        <style>{styles}</style>
        LOADING CODEX...
      </div>
    );

  if (error || !world)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#04050a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          color: "#d04040",
          fontSize: "0.75rem",
        }}
      >
        <style>{styles}</style>
        {error || "World not found"}
      </div>
    );

  const ws = world.world_state || {};
  const crew = (ws.characters || []).filter((c) => c.type === "crew");
  const npcs = (ws.characters || []).filter((c) => c.type === "npc");
  const vessels = ws.vessels || [];
  const events = [...(ws.events || [])].reverse(); // newest first
  const vantageRel = ws.vantage_relationship || "neutral";
  const relColor =
    {
      hostile: "#d04040",
      strained: "#d08040",
      neutral: "#3d6078",
      cooperative: "#28c898",
      trusted: "#1aadad",
    }[vantageRel] || "#3d6078";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#04050a",
        fontFamily: "'Share Tech Mono', monospace",
      }}
    >
      <style>{styles}</style>
      <Starfield />

      {/* Header */}
      <div
        style={{
          background: "#080a16",
          borderBottom: "2px solid #1aadad22",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            alignItems: "center",
            height: "52px",
            gap: "8px",
          }}
        >
          <div
            style={{
              background: "#1aadad",
              width: "28px",
              height: "36px",
              borderRadius: "18px 0 0 18px",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, paddingLeft: "6px", minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.55rem",
                color: "#1aadadaa",
                letterSpacing: "0.3em",
              }}
            >
              VANTAGE DEEP EXPLORATION · VS-7
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#22c8b8",
                letterSpacing: "0.08em",
                lineHeight: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {world.name?.toUpperCase() || "CAMPAIGN CODEX"}
            </div>
          </div>
          {/* HUD instrument button panel */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              border: "1px solid #1aadad22",
              background: "#080e1c",
            }}
          >
            <button
              onClick={() => navigate("/")}
              style={{
                background: "transparent",
                color: "#1aadad",
                border: "none",
                borderRight: activeStoryId ? "1px solid #1aadad1a" : "none",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                padding: "0.4rem 0.9rem",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow:
                  "inset 0 1px 0 rgba(26,173,173,0.07), inset 0 -1px 0 rgba(0,0,0,0.35)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1aadad11")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              ← Campaigns
            </button>
            {activeStoryId && (
              <button
                onClick={() => navigate(`/story/${activeStoryId}`)}
                style={{
                  background: "transparent",
                  color: "#1aadad",
                  border: "none",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  padding: "0.4rem 0.9rem",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow:
                    "inset 0 1px 0 rgba(26,173,173,0.07), inset 0 -1px 0 rgba(0,0,0,0.35)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1aadad11")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                ◎ Mission
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Campaign stats bar */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            padding: "1rem 1.4rem",
            border: "1px solid #1aadad18",
            borderLeft: "3px solid #1aadad44",
            background: "rgba(4,6,12,0.8)",
            marginBottom: "2.5rem",
            animation: "fadeUp 0.3s ease",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.65rem",
                color: "#1aadad99",
                letterSpacing: "0.2em",
              }}
            >
              CAMPAIGN
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#22c8b8",
              }}
            >
              {world.name}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.65rem",
                color: "#1aadad99",
                letterSpacing: "0.2em",
              }}
            >
              MISSIONS
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#22c8b8",
              }}
            >
              {ws.mission_count || 0}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.65rem",
                color: "#1aadad99",
                letterSpacing: "0.2em",
              }}
            >
              VANTAGE REL.
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "0.8rem",
                color: relColor,
                letterSpacing: "0.05em",
              }}
            >
              {vantageRel.toUpperCase()}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.65rem",
                color: "#1aadad99",
                letterSpacing: "0.2em",
              }}
            >
              CREW
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#22c8b8",
              }}
            >
              {crew.length}
            </div>
          </div>
        </div>

        {/* Campaign Briefing */}
        {ws.lore_summaries?.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <SectionHeader label="CAMPAIGN BRIEFING" color="#1aadad" />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1px" }}
            >
              {ws.lore_summaries.map((card, i) => (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${card.color}22`,
                    borderLeft: `3px solid ${card.color}88`,
                    background: "rgba(4,6,12,0.6)",
                    padding: "1rem 1.2rem",
                    animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.55rem",
                      color: card.color,
                      letterSpacing: "0.3em",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      color: "#d8e8f2",
                      marginBottom: "0.55rem",
                    }}
                  >
                    {card.heading}
                  </div>
                  <p
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "0.72rem",
                      color: "#5a7888",
                      lineHeight: 1.75,
                      margin: 0,
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crew */}
        {crew.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <SectionHeader label="CREW — ESV THRESHOLD" color="#1aadad" />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1px" }}
            >
              {crew.map((c, i) => (
                <CharacterCard key={c.name} character={c} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* NPCs */}
        {npcs.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <SectionHeader label="ENCOUNTERED PERSONS" color="#9a6fff" />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1px" }}
            >
              {npcs.map((c, i) => (
                <CharacterCard key={c.name} character={c} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Vessels */}
        {vessels.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <SectionHeader label="VESSELS ON RECORD" color="#2a80e8" />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1px" }}
            >
              {vessels.map((v, i) => (
                <VesselCard key={v.name} vessel={v} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Event log */}
        {events.length > 0 ? (
          <div style={{ marginBottom: "2.5rem" }}>
            <SectionHeader label="MISSION LOG" color="#28c898" />
            <div>
              {events.map((e, i) => (
                <EventEntry key={e.story_id || i} event={e} index={i} />
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              border: "1px dashed #1aadad15",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.7rem",
                color: "#283848",
                letterSpacing: "0.2em",
              }}
            >
              NO MISSIONS ON RECORD YET
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#3d5060",
                marginTop: "0.5rem",
              }}
            >
              Complete a mission to populate the event log.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
