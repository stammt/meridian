import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../hooks/useAuth.jsx";

const typewriterSpeed = 16;

const GAME_STARS = [...Array(60)].map(() => ({
  w: Math.random() > 0.9 ? "3px" : "1px",
  h: Math.random() > 0.9 ? "3px" : "1px",
  opacity: 0.15 + Math.random() * 0.5,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
}));

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

function StorySegment({
  text,
  isLatest,
  typewrite,
  showDebug,
  onDebug,
  debugLoading,
  debugResult,
}) {
  const [displayed, setDisplayed] = useState(typewrite ? "" : text);
  const [done, setDone] = useState(!typewrite);
  const idx = useRef(typewrite ? 0 : text.length);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!typewrite) return;
    intervalRef.current = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(intervalRef.current);
        setDone(true);
      }
    }, typewriterSpeed);
    return () => clearInterval(intervalRef.current);
  }, [text, typewrite]);

  return (
    <>
      <p
        style={{
          margin: "0 0 1.5rem 0",
          lineHeight: 1.9,
          color: isLatest ? "#d8e8f2" : "#506878",
          fontSize: "0.95rem",
          transition: "color 0.6s",
          whiteSpace: "pre-wrap",
        }}
      >
        {displayed}
        {typewrite && !done && <TerminalCursor />}
      </p>
      {showDebug && (
        <div style={{ marginBottom: "1.5rem", marginTop: "-1rem" }}>
          <button
            onClick={onDebug}
            disabled={debugLoading}
            title="Debug: why wasn't the objective met at this point?"
            style={{
              background: "transparent",
              color: debugLoading ? "#a0702044" : "#a07020",
              border: "1px solid #a0702033",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.55rem",
              letterSpacing: "0.1em",
              padding: "0.2rem 0.6rem",
              borderRadius: "8px",
              cursor: debugLoading ? "default" : "pointer",
            }}
          >
            {debugLoading ? "…" : "? OBJ"}
          </button>
          {debugResult && (
            <div
              style={{
                marginTop: "0.6rem",
                background: "#080600",
                border: "1px solid #a0702044",
                borderLeft: "3px solid #a07020",
                padding: "0.75rem 1rem",
                animation: "fadeUp 0.2s ease",
              }}
            >
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.52rem",
                  color: "#a07020",
                  letterSpacing: "0.25em",
                  marginBottom: "0.4rem",
                }}
              >
                ── DEBUG · OBJECTIVE STATUS ──
              </div>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#b09050",
                  lineHeight: 1.75,
                  margin: 0,
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              >
                {debugResult}
              </p>
            </div>
          )}
        </div>
      )}
    </>
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

// ── Scenario Debug Panel ──────────────────────────────────────────────────────

function ScenarioDebugPanel({ scenario }) {
  if (!scenario) return null;
  const fields = [
    ["title", scenario.title],
    ["objective", scenario.objective],
    ["surface_situation", scenario.surface_situation],
    ["hidden_truth", scenario.hidden_truth],
    ["time_pressure", scenario.time_pressure],
    ["failure_conditions[0]", scenario.failure_conditions?.[0]],
    ["failure_conditions[1]", scenario.failure_conditions?.[1]],
    ["side_objective", scenario.side_objective],
    ["observer_note", scenario.observer_note],
    ["theme", scenario.theme],
    ["opening_hook", scenario.opening_hook],
  ];
  return (
    <details style={{ marginBottom: "1.5rem" }}>
      <summary
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.55rem",
          color: "#a07020",
          letterSpacing: "0.2em",
          cursor: "pointer",
          listStyle: "none",
          userSelect: "none",
          padding: "0.3rem 0",
        }}
      >
        ▸ DEBUG · SCENARIO
      </summary>
      <div
        style={{
          marginTop: "0.6rem",
          background: "#080600",
          border: "1px solid #a0702044",
          borderLeft: "3px solid #a07020",
          padding: "0.75rem 1rem",
        }}
      >
        {fields.map(([key, value]) =>
          value != null ? (
            <div key={key} style={{ marginBottom: "0.6rem" }}>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.5rem",
                  color: "#a07020",
                  letterSpacing: "0.2em",
                  marginBottom: "0.15rem",
                }}
              >
                {key.toUpperCase()}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "#b09050",
                  lineHeight: 1.6,
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              >
                {value}
              </p>
            </div>
          ) : null,
        )}
      </div>
    </details>
  );
}

// ── Mission Prologue ──────────────────────────────────────────────────────────

function MissionPrologue({ scenario }) {
  if (!scenario) return null;
  return (
    <div style={{ marginBottom: "2.5rem", animation: "fadeUp 0.4s ease" }}>
      {/* File header rule */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "0.9rem",
        }}
      >
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.65rem",
            color: "#1aadad44",
            whiteSpace: "nowrap",
          }}
        >
          ───
        </div>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.6rem",
            color: "#1aadad",
            letterSpacing: "0.4em",
            whiteSpace: "nowrap",
          }}
        >
          MISSION FILE
        </div>
        <div
          style={{
            flex: 1,
            height: "1px",
            background: "linear-gradient(90deg, #1aadad44, transparent)",
          }}
        />
      </div>

      {/* Mission title */}
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: "1.4rem",
          color: "#4ad8a8",
          letterSpacing: "0.05em",
          lineHeight: 1.1,
          marginBottom: "1rem",
          paddingBottom: "0.85rem",
          borderBottom: "1px solid #1aadad1a",
        }}
      >
        {scenario.title}
      </div>

      {/* Situation body */}
      <p
        style={{
          fontSize: "0.83rem",
          color: "#5a8070",
          lineHeight: 1.8,
          margin: 0,
          fontFamily: "'Share Tech Mono', monospace",
        }}
      >
        {scenario.surface_situation}
      </p>
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

// ── Main Game Page ────────────────────────────────────────────────────────────

export default function Game() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const initialScrollDone = useRef(false);
  const [story, setStory] = useState(null);
  const [world, setWorld] = useState(null);
  const [segments, setSegments] = useState([]);
  const [status, setStatus] = useState("active");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [transmitFlash, setTransmitFlash] = useState(false);
  const [error, setError] = useState(null);
  const [rightPanel, setRightPanel] = useState(null); // "mission" | null
  const [debugState, setDebugState] = useState(null); // { idx, loading, result }
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const hasUserActions = segments.some((s) => s.role === "user");
    if (!initialScrollDone.current) {
      if (segments.length === 0) return; // wait for data to load
      initialScrollDone.current = true;
      if (hasUserActions) {
        window.console.log("initial scroll to bottom");
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      } else {
        window.console.log("initial scroll to top");
        window.scrollTo(0, 0);
      }
      return;
    } else if (hasUserActions) {
      window.console.log("scrolling to bottom");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [segments]);

  // Focus textarea without scrolling (autoFocus would scroll to bottom)
  useEffect(() => {
    if (!loading && status === "active") {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, [loading, status]);

  useEffect(() => {
    api.stories
      .get(id)
      .then(({ story, messages, world }) => {
        setStory(story);
        setWorld(world || null);
        setStatus(story.status);
        // Skip the first message (internal intro prompt), show all others with roles
        const displayMessages = messages.slice(1).map((m, i) => ({
          text: m.content,
          id: i,
          role: m.role,
          typewrite: false,
        }));
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
    setTransmitFlash(true);
    setTimeout(() => setTransmitFlash(false), 700);
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
        { text: reply, id: Date.now() + 1, role: "assistant", typewrite: true },
      ]);
      setStatus(newStatus);
    } catch (e) {
      setError(e.message);
    }
    setSending(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  async function handleDebugObjective(segIdx) {
    // segIdx is index in segments (which start from messages.slice(1)), so DB messageCount = segIdx + 2
    setDebugState({ idx: segIdx, loading: true, result: null });
    try {
      const { explanation } = await api.stories.debugObjective(id, segIdx + 2);
      setDebugState({ idx: segIdx, loading: false, result: explanation });
    } catch (e) {
      setDebugState({
        idx: segIdx,
        loading: false,
        result: `Error: ${e.message}`,
      });
    }
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
    @keyframes signalFlash { 0%{transform:scaleX(0);opacity:0.8} 50%{transform:scaleX(0.7);opacity:1} 100%{transform:scaleX(1);opacity:0} }
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

      {/* Starfield + nav grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(26,173,173,0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(26,173,173,0.2) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.5) 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.5) 0%, transparent 70%)",
          }}
        />
        {GAME_STARS.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: s.w,
              height: s.h,
              background: `rgba(255,255,255,${s.opacity})`,
              left: s.left,
              top: s.top,
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
                borderRight: "1px solid #1aadad1a",
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
            {scenario && (
              <button
                onClick={() => togglePanel("mission")}
                style={{
                  background:
                    rightPanel === "mission" ? "#1aadad22" : "transparent",
                  color: "#1aadad",
                  border: "none",
                  borderRight: world ? "1px solid #1aadad1a" : "none",
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
                  (e.currentTarget.style.background =
                    rightPanel === "mission" ? "#1aadad22" : "transparent")
                }
              >
                ◎ Mission
              </button>
            )}
            {world && (
              <button
                onClick={() => navigate(`/world/${world.id}/codex`)}
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
                ▤ Codex
              </button>
            )}
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

          {(import.meta.env.DEV || user?.is_admin) && (
            <ScenarioDebugPanel scenario={scenario} />
          )}
          <MissionPrologue scenario={scenario} />

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
                  typewrite={seg.typewrite ?? false}
                  showDebug={import.meta.env.DEV || user?.is_admin}
                  onDebug={() => handleDebugObjective(i)}
                  debugLoading={debugState?.idx === i && debugState.loading}
                  debugResult={debugState?.idx === i ? debugState.result : null}
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
            {/* Signal strength bar */}
            <div
              style={{
                height: "2px",
                marginBottom: "0.7rem",
                position: "relative",
                overflow: "hidden",
                background: "#1aadad0d",
              }}
            >
              {transmitFlash && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(90deg, transparent, #1aadad, #22c8b8, transparent)",
                    transformOrigin: "left",
                    animation: "signalFlash 0.7s ease-out forwards",
                  }}
                />
              )}
            </div>

            {/* Inline prompt + textarea */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.88rem",
                  color: "#22c8b8",
                  whiteSpace: "nowrap",
                  lineHeight: 1.75,
                  flexShrink: 0,
                  userSelect: "none",
                }}
              >
                THRESHOLD / CMD &gt;
              </span>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Act or speak…"
                rows={3}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#d8e8f2",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.88rem",
                  lineHeight: 1.75,
                  resize: "none",
                  caretColor: "#22c8b8",
                  padding: 0,
                }}
              />
            </div>
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
                    padding: "0.4rem 1.2rem",
                    borderRadius: "0",
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

      {/* Overlay panels — fixed, slide in from right */}
      <ScenarioPanel isOpen={rightPanel === "mission"} scenario={scenario} />
    </div>
  );
}
