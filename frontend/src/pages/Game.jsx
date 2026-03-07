import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";

const typewriterSpeed = 16;

// Fallback crew for stories without a world (backwards compat)
const FALLBACK_CREW = [
  {
    name: "Dr. Yusuf Okafor", role: "Senior Scientist", type: "crew", status: "active",
    notes: "Xenobiologist. Careful and methodical in the lab, genuinely excited by the unknown in a way he tries to keep professional and mostly fails. He and Cole have covered for each other enough times that there is real trust between them.",
  },
  {
    name: "Petra Andic", role: "Chief Engineer", type: "crew", status: "active",
    notes: "Grew up on a Ceres mining platform. Dry humor under stress. No particular interest in corporate politics — here because the work is good, the pay is real, and she likes the crew. Genuinely fond of the Threshold in a way she would not describe as fond.",
  },
  {
    name: "Tomás Reyes", role: "Navigator", type: "crew", status: "active",
    notes: "The youngest crew member and the only true believer in what Vantage was supposed to be. Saw something on his first deep-survey posting he has never described. Loyal to Cole — and to something else he won't name.",
  },
  {
    name: "Dr. Silva Cross", role: "Medic / Security", type: "crew", status: "active",
    notes: "Former corporate contractor. Mercenary pragmatism. Will do her job, protect the crew, collect her fee. Of everyone, most likely to follow a Vantage directive Cole has refused, if the price is right. Has not betrayed them yet.",
  },
];

function TerminalCursor() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "2px",
        height: "1.1em",
        background: "#22c8b8",
        marginLeft: "2px",
        verticalAlign: "text-bottom",
        animation: "blink 1s step-end infinite",
      }}
    />
  );
}

function StorySegment({ text, isLatest }) {
  const [displayed, setDisplayed] = useState(isLatest ? "" : text);
  const [done, setDone] = useState(!isLatest);
  const idx = useRef(isLatest ? 0 : text.length);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isLatest) return;
    intervalRef.current = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(intervalRef.current);
        setDone(true);
      }
    }, typewriterSpeed);
    return () => clearInterval(intervalRef.current);
  }, [text, isLatest]);

  return (
    <p
      style={{
        margin: "0 0 1.5rem 0",
        lineHeight: 1.9,
        color: isLatest ? "#d8e8f2" : "#506878",
        fontSize: "0.95rem",
        transition: "color 0.6s",
      }}
    >
      {displayed}
      {isLatest && !done && <TerminalCursor />}
    </p>
  );
}

function PlayerAction({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      setIsClamped(
        textRef.current.scrollHeight > textRef.current.clientHeight + 1,
      );
    }
  }, [text]);

  return (
    <div
      style={{
        margin: "0 0 1.5rem 0",
        display: "flex",
        alignItems: "baseline",
        gap: "0.6rem",
        paddingLeft: "0.8rem",
        borderLeft: "2px solid #1aadad33",
      }}
    >
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.58rem",
          color: "#1aadad77",
          letterSpacing: "0.2em",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        ▶ COLE
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          ref={textRef}
          style={{
            margin: 0,
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.8rem",
            color: "#405868",
            lineHeight: 1.6,
            ...(expanded
              ? {}
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }),
          }}
        >
          {text}
        </p>
        {(isClamped || expanded) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "#1aadad66",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.15em",
              padding: "0.2rem 0",
              cursor: "pointer",
              marginTop: "0.15rem",
            }}
          >
            {expanded ? "▲ COLLAPSE" : "▼ EXPAND"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Mission Ended Banner ──────────────────────────────────────────────────────

function MissionEndedBanner({ status, onNavigate }) {
  const failed = status === "failed";
  return (
    <div
      style={{
        border: `1px solid ${failed ? "#d0404044" : "#28c89844"}`,
        borderLeft: `3px solid ${failed ? "#d04040" : "#28c898"}`,
        background: failed ? "rgba(208,64,64,0.06)" : "rgba(40,200,152,0.06)",
        padding: "1.5rem",
        margin: "1rem 0 2rem",
        animation: "fadeUp 0.5s ease",
      }}
    >
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.6rem",
          letterSpacing: "0.3em",
          color: failed ? "#d04040" : "#28c898",
          marginBottom: "0.5rem",
        }}
      >
        ── {failed ? "MISSION FAILED" : "MISSION COMPLETE"} ──
      </div>
      <p
        style={{
          color: "#7a9ab0",
          fontSize: "0.82rem",
          lineHeight: 1.7,
          margin: "0 0 1.2rem",
        }}
      >
        {failed
          ? "The mission has ended. The log will remain in your records."
          : "Mission accomplished. The log will remain in your records."}
      </p>
      <button
        onClick={onNavigate}
        style={{
          background: "transparent",
          border: `1px solid ${failed ? "#d04040" : "#28c898"}`,
          color: failed ? "#d04040" : "#28c898",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          fontSize: "0.68rem",
          letterSpacing: "0.15em",
          padding: "0.5rem 1.2rem",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        ← Return to Mission Logs
      </button>
    </div>
  );
}

// ── Scenario / Objective Panel ────────────────────────────────────────────────

function ScenarioPanel({ isOpen, scenario }) {
  if (!scenario) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: "52px",
        right: 0,
        bottom: 0,
        width: "300px",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        zIndex: 15,
        borderLeft: "2px solid #1aadad22",
        background: "rgba(4,6,12,0.97)",
        overflowY: "auto",
      }}
    >
        <div
          style={{
            borderBottom: "1px solid #1aadad22",
            padding: "1rem",
            position: "sticky",
            top: 0,
            background: "rgba(4,6,12,0.98)",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", gap: "4px", marginBottom: "0.6rem" }}>
            <div
              style={{
                background: "#28c898",
                height: "8px",
                flex: 2,
                borderRadius: "4px",
              }}
            />
            <div
              style={{
                background: "#1aadad",
                height: "8px",
                flex: 1,
                borderRadius: "2px",
              }}
            />
            <div
              style={{
                background: "#2a60c0",
                height: "8px",
                width: "20px",
                borderRadius: "2px",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.58rem",
              color: "#28c898",
              letterSpacing: "0.3em",
            }}
          >
            MISSION BRIEFING
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#22c8b8",
              marginTop: "0.2rem",
            }}
          >
            {scenario.title}
          </div>
        </div>

        <div style={{ padding: "1rem" }}>
          {[
            {
              label: "Situation",
              text: scenario.surface_situation,
              color: "#1aadad",
            },
          ].map(({ label, text, color }) => (
            <div key={label} style={{ marginBottom: "1.2rem" }}>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.58rem",
                  color,
                  letterSpacing: "0.2em",
                  marginBottom: "0.35rem",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#7a9ab0",
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>

        <div style={{ padding: "0.8rem 1rem", display: "flex", gap: "4px" }}>
          <div
            style={{
              background: "#28c89844",
              height: "6px",
              width: "24px",
              borderRadius: "3px",
            }}
          />
          <div
            style={{
              background: "#1aadad22",
              flex: 1,
              height: "6px",
              borderRadius: "3px",
            }}
          />
        </div>
    </div>
  );
}

// ── Cast Panel ────────────────────────────────────────────────────────────────

const CREW_COLORS = ["#4a9eff", "#cc9900", "#e05c00", "#c84040", "#28c898", "#9a6fff", "#ff8c42"];

function castColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CREW_COLORS[Math.abs(hash) % CREW_COLORS.length];
}

function statusBadge(status) {
  const cfg = {
    active: null,
    injured: { label: "INJURED", color: "#d08040" },
    dead: { label: "DECEASED", color: "#d04040" },
    absent: { label: "ABSENT", color: "#3d6078" },
  }[status];
  return cfg;
}

function CastPanel({ isOpen, characters }) {
  const [expanded, setExpanded] = useState(null);
  const crew = characters.filter((c) => c.type === "crew");
  const npcs = characters.filter((c) => c.type === "npc");

  function CastMember({ member }) {
    const isExpanded = expanded === member.name;
    const color = castColor(member.name);
    const initial = member.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
    const badge = statusBadge(member.status);

    return (
      <div style={{ borderBottom: "1px solid #1aadad11" }}>
        <button
          onClick={() => setExpanded(isExpanded ? null : member.name)}
          style={{
            width: "100%", background: isExpanded ? "rgba(26,173,173,0.08)" : "transparent",
            border: "none", cursor: "pointer", padding: "0.75rem 1rem",
            display: "flex", alignItems: "center", gap: "0.7rem", textAlign: "left",
            transition: "background 0.2s",
            borderLeft: `3px solid ${isExpanded ? color : "transparent"}`,
            opacity: member.status === "dead" ? 0.5 : 1,
          }}
        >
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
            background: `${color}22`, border: `1.5px solid ${color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.75rem", color,
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "#d8e8f2", letterSpacing: "0.05em", lineHeight: 1.2 }}>
              {member.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.15rem" }}>
              <span style={{ fontSize: "0.62rem", color: "#3d6078" }}>{member.role}</span>
              {badge && (
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.48rem", letterSpacing: "0.1em", color: badge.color, border: `1px solid ${badge.color}44`, padding: "0.05rem 0.3rem", borderRadius: "2px" }}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize: "0.6rem", color: "#1aadad", transition: "transform 0.25s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>▶</div>
        </button>
        {isExpanded && (
          <div style={{ padding: "0 1rem 1rem", animation: "fadeUp 0.2s ease" }}>
            <p style={{ fontSize: "0.75rem", color: "#7a9ab0", lineHeight: 1.75, margin: 0 }}>
              {member.notes}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", top: "52px", right: 0, bottom: 0, width: "300px",
      transform: isOpen ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      zIndex: 15, borderLeft: "2px solid #1aadad22",
      background: "rgba(4,6,12,0.97)", overflowY: "auto",
    }}>
      <div style={{ borderBottom: "1px solid #1aadad22", padding: "1rem", position: "sticky", top: 0, background: "rgba(4,6,12,0.98)", zIndex: 2 }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "0.6rem" }}>
          <div style={{ background: "#1aadad", height: "8px", flex: 2, borderRadius: "2px" }} />
          <div style={{ background: "#2a60c0", height: "8px", flex: 1, borderRadius: "2px" }} />
          <div style={{ background: "#4a80e8", height: "8px", width: "20px", borderRadius: "2px" }} />
        </div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.58rem", color: "#1aadad", letterSpacing: "0.3em" }}>
          CAST · ESV THRESHOLD
        </div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", color: "#22c8b8", letterSpacing: "0.1em", marginTop: "0.2rem" }}>
          CAST MANIFEST
        </div>
      </div>

      {crew.length > 0 && (
        <>
          <div style={{ padding: "0.5rem 1rem 0.2rem", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.5rem", color: "#1aadad44", letterSpacing: "0.25em" }}>
            CREW
          </div>
          <div style={{ padding: "0.2rem 0" }}>
            {crew.map((m) => <CastMember key={m.name} member={m} />)}
          </div>
        </>
      )}

      {npcs.length > 0 && (
        <>
          <div style={{ padding: "0.6rem 1rem 0.2rem", borderTop: "1px solid #1aadad11", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.5rem", color: "#1aadad44", letterSpacing: "0.25em" }}>
            ENCOUNTERED
          </div>
          <div style={{ padding: "0.2rem 0" }}>
            {npcs.map((m) => <CastMember key={m.name} member={m} />)}
          </div>
        </>
      )}

      <div style={{ padding: "0.8rem 1rem", display: "flex", gap: "4px" }}>
        <div style={{ background: "#2a60c0", height: "6px", width: "24px", borderRadius: "2px" }} />
        <div style={{ background: "#1aadad22", flex: 1, height: "6px", borderRadius: "3px" }} />
      </div>
    </div>
  );
}

// ── Main Game Page ────────────────────────────────────────────────────────────

export default function Game() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [world, setWorld] = useState(null);
  const [segments, setSegments] = useState([]);
  const [status, setStatus] = useState("active");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [rightPanel, setRightPanel] = useState(null); // "cast" | "mission" | null
  const [debugOverlay, setDebugOverlay] = useState(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments, sending]);

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY;
      if (y < lastScrollY.current - 5) setHeaderVisible(true);
      else if (y > lastScrollY.current + 5) setHeaderVisible(false);
      lastScrollY.current = y;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    api.stories
      .get(id)
      .then(({ story, messages, world }) => {
        setStory(story);
        setWorld(world || null);
        setStatus(story.status);
        // Skip the first message (internal intro prompt), show all others with roles
        const displayMessages = messages
          .slice(1)
          .map((m, i) => ({ text: m.content, id: i, role: m.role }));
        setSegments(displayMessages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSend() {
    if (!input.trim() || sending || status !== "active") return;
    const content = input.trim();
    setInput("");
    setSending(true);
    setError(null);
    setSegments((prev) => [
      ...prev,
      { text: content, id: Date.now(), role: "user" },
    ]);
    try {
      const { reply, status: newStatus } = await api.stories.sendMessage(
        id,
        content,
      );
      setSegments((prev) => [
        ...prev,
        { text: reply, id: Date.now() + 1, role: "assistant" },
      ]);
      setStatus(newStatus);
    } catch (e) {
      setError(e.message);
    }
    setSending(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  async function handleDebugObjective() {
    setDebugLoading(true);
    setDebugOverlay(null);
    try {
      const { explanation } = await api.stories.debugObjective(id);
      setDebugOverlay(explanation);
    } catch (e) {
      setDebugOverlay(`Error: ${e.message}`);
    }
    setDebugLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function togglePanel(panel) {
    setRightPanel((prev) => (prev === panel ? null : panel));
  }

  const scenario = story?.scenario;
  const missionActive = status === "active";
  const castCharacters = world?.world_state?.characters || FALLBACK_CREW;
  const statusColor =
    status === "failed"
      ? "#d04040"
      : status === "complete"
        ? "#28c898"
        : "#1aadad";

  // Index of the last assistant segment (for typewriter effect)
  const latestAssistantIdx = segments.reduce(
    (acc, seg, i) => (seg.role === "assistant" ? i : acc),
    -1,
  );

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
    * { box-sizing: border-box; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #080a14; }
    ::-webkit-scrollbar-thumb { background: #1aadad; border-radius: 2px; }
    textarea:focus { outline: none; }
    button { cursor: pointer; }
  `;

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#04050a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1aadad",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          letterSpacing: "0.3em",
        }}
      >
        <style>{globalStyles}</style>
        LOADING MISSION LOG...
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#04050a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Share Tech Mono', monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{globalStyles}</style>

      {/* Starfield */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
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

      {/* Header — fixed with scroll-hide */}
      <div
        style={{
          width: "100%",
          background: "#080a16",
          borderBottom: `2px solid ${statusColor}22`,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s ease",
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
              background: statusColor,
              width: "28px",
              height: "36px",
              borderRadius: "18px 0 0 18px",
              flexShrink: 0,
              transition: "background 0.5s",
            }}
          />
          <div style={{ flex: 1, paddingLeft: "6px", minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.55rem",
                color: statusColor,
                letterSpacing: "0.3em",
                transition: "color 0.5s",
              }}
            >
              {status === "active"
                ? "VANTAGE DEEP EXPLORATION · VS-7"
                : status === "failed"
                  ? "MISSION FAILED · ESV THRESHOLD"
                  : "MISSION COMPLETE · ESV THRESHOLD"}
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
                maxWidth: "400px",
              }}
            >
              {story?.title || "ESV THRESHOLD"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Mission briefing toggle */}
            {scenario && (
              <button
                onClick={() => togglePanel("mission")}
                style={{
                  background:
                    rightPanel === "mission" ? "#28c89822" : "#0c1222",
                  color: rightPanel === "mission" ? "#28c898" : "#28c89888",
                  border: `1px solid ${rightPanel === "mission" ? "#28c898" : "#28c89833"}`,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "12px",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                ◎ Mission
              </button>
            )}
            <button
              onClick={() => togglePanel("cast")}
              style={{
                background: rightPanel === "cast" ? "#1aadad22" : "#0c1222",
                color: rightPanel === "cast" ? "#22c8b8" : "#1aadad",
                border: `1px solid ${rightPanel === "cast" ? "#1aadad" : "#1aadad44"}`,
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                padding: "0.35rem 0.8rem",
                borderRadius: "12px",
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
            >
              ▤ Cast
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "#0c1222",
                color: "#1aadad",
                border: "1px solid #1aadad44",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                padding: "0.35rem 0.8rem",
                borderRadius: "12px",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#1aadad22";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#0c1222";
              }}
            >
              ← Missions
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div style={{ height: "52px", flexShrink: 0 }} />

      {/* Content row */}
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          display: "flex",
          flex: 1,
          position: "relative",
          zIndex: 1,
          alignItems: "flex-start",
        }}
      >
        {/* Left sidebar */}
        <div
          style={{
            width: "48px",
            flexShrink: 0,
            padding: "1.2rem 0 1.2rem 1.2rem",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            alignSelf: "stretch",
          }}
        >
          <div
            style={{
              background: statusColor,
              height: "48px",
              borderRadius: "2px 0 0 2px",
              transition: "background 0.5s",
            }}
          />
          <div style={{ background: "#2a60c0", height: "6px" }} />
          <div
            style={{
              background: "#1aadad",
              height: "20px",
              borderRadius: "2px 0 0 2px",
            }}
          />
          <div
            style={{
              background: "#1aadad11",
              flex: 1,
            }}
          />
          <div
            style={{
              background: "#1aadad",
              height: "20px",
              borderRadius: "2px 0 0 2px",
            }}
          />
          <div style={{ background: "#2a60c0", height: "6px" }} />
          <div
            style={{
              background: statusColor,
              height: "48px",
              borderRadius: "2px 0 0 2px",
              transition: "background 0.5s",
            }}
          />
        </div>

        {/* Story */}
        <div
          style={{
            flex: 1,
            padding: "2rem 2rem 0",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {error && (
            <div
              style={{
                color: "#d04040",
                fontSize: "0.75rem",
                padding: "0.6rem 0.8rem",
                borderLeft: "3px solid #d04040",
                background: "rgba(208,64,64,0.06)",
                marginBottom: "1rem",
              }}
            >
              ⚠ {error}
            </div>
          )}

          {segments.map((seg, i) => (
            <div key={seg.id} style={{ animation: "fadeUp 0.4s ease" }}>
              {seg.role === "assistant" && i > 0 && (
                <div
                  style={{
                    borderTop: "1px solid #1aadad11",
                    margin: "0 0 1.5rem",
                    opacity: 0.6,
                  }}
                />
              )}
              {seg.role === "user" ? (
                <PlayerAction text={seg.text} />
              ) : (
                <StorySegment
                  text={seg.text}
                  isLatest={i === latestAssistantIdx && !sending}
                />
              )}
            </div>
          ))}

          {sending && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.8rem",
                padding: "0.5rem 0",
                animation: "fadeUp 0.3s ease",
              }}
            >
              <div style={{ display: "flex", gap: "5px" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "3px",
                      height: "12px",
                      background: "#1aadad",
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
                  color: "#1aadad",
                  letterSpacing: "0.2em",
                }}
              >
                COMPUTER PROCESSING...
              </span>
            </div>
          )}

          {/* Mission ended banner */}
          {!missionActive && (
            <MissionEndedBanner
              status={status}
              onNavigate={() => navigate("/")}
            />
          )}

          <div ref={bottomRef} style={{ height: "1px" }} />
        </div>

      </div>

      {/* Input — hidden when mission is over */}
      {missionActive && (
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            padding: "1rem 2rem 1.5rem 3.75rem",
            boxSizing: "border-box",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              border: "1px solid #1aadad33",
              borderLeft: "3px solid #1aadad",
              background: "rgba(4,6,12,0.95)",
              padding: "1rem 1.2rem",
            }}
          >
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.6rem",
                color: "#1aadad",
                letterSpacing: "0.25em",
                marginBottom: "0.6rem",
              }}
            >
              ── COLE · AWAITING ORDERS ──
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={'Act ("Hail the station") or speak ("What\'s your read, Okafor?")'}
              rows={3}
              autoFocus
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#d8e8f2",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.88rem",
                lineHeight: 1.75,
                resize: "none",
                caretColor: "#22c8b8",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.8rem",
                borderTop: "1px solid #1aadad22",
                paddingTop: "0.8rem",
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.6rem",
                  color: "#283848",
                  letterSpacing: "0.1em",
                }}
              >
                ENTER TO TRANSMIT · SHIFT+ENTER FOR NEW LINE
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
              {import.meta.env.DEV && (
                <button
                  onClick={handleDebugObjective}
                  disabled={debugLoading || sending}
                  title="Debug: why hasn't the mission completed?"
                  style={{
                    background: "transparent",
                    color: debugLoading ? "#a0702044" : "#a07020",
                    border: "1px solid #a0702044",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.6rem",
                    letterSpacing: "0.1em",
                    padding: "0.4rem 0.7rem",
                    borderRadius: "12px",
                    transition: "all 0.2s",
                  }}
                >
                  {debugLoading ? "…" : "? OBJ"}
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                style={{
                  background:
                    input.trim() && !sending ? "#1aadad" : "transparent",
                  color: input.trim() && !sending ? "#04050a" : "#283848",
                  border: `1px solid ${input.trim() && !sending ? "#1aadad" : "#1aadad33"}`,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.68rem",
                  letterSpacing: "0.12em",
                  padding: "0.4rem 1rem",
                  borderRadius: "0 12px 12px 0",
                  transition: "all 0.2s",
                  textTransform: "uppercase",
                }}
              >
                Transmit →
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug objective overlay — dev only */}
      {import.meta.env.DEV && debugOverlay && (
        <div
          style={{
            position: "fixed",
            bottom: missionActive ? "160px" : "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(620px, 90vw)",
            background: "#080600",
            border: "1px solid #a0702066",
            borderLeft: "3px solid #a07020",
            padding: "1rem 1.2rem",
            zIndex: 30,
            animation: "fadeUp 0.2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.7rem",
            }}
          >
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.55rem",
                color: "#a07020",
                letterSpacing: "0.25em",
              }}
            >
              ── DEBUG · OBJECTIVE STATUS ──
            </span>
            <button
              onClick={() => setDebugOverlay(null)}
              style={{
                background: "none",
                border: "none",
                color: "#a07020",
                cursor: "pointer",
                fontSize: "0.75rem",
                padding: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#b09050",
              lineHeight: 1.75,
              margin: 0,
              fontFamily: "'Share Tech Mono', monospace",
            }}
          >
            {debugOverlay}
          </p>
        </div>
      )}

      {/* Overlay panels — fixed, slide in from right */}
      <CastPanel isOpen={rightPanel === "cast"} characters={castCharacters} />
      <ScenarioPanel isOpen={rightPanel === "mission"} scenario={scenario} />
    </div>
  );
}
