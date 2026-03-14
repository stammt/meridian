import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../hooks/useAuth.jsx";
import shipImg from "../assets/esv_threshold_jupiter.png";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
  @keyframes slideCard { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes statusGlow { 0%,100%{opacity:0.75;filter:brightness(0.9)} 50%{opacity:1;filter:brightness(1.5)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #080a14; }
  ::-webkit-scrollbar-thumb { background: #1aadad; border-radius: 2px; }
  button { cursor: pointer; }
  input { box-sizing: border-box; }
`;

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STARS = [...Array(60)].map(() => ({
  w: Math.random() > 0.9 ? "3px" : "1px",
  h: Math.random() > 0.9 ? "3px" : "1px",
  opacity: 0.15 + Math.random() * 0.5,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
}));

function Starfield() {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      {/* Nav grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(26,173,173,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,173,173,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.6) 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.6) 0%, transparent 75%)",
        }}
      />
      {/* Stars */}
      {STARS.map((s, i) => (
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
  );
}

// ── Inline world name editor ──────────────────────────────────────────────────

function WorldNameEditor({ worldId, initialName, onRename }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialName);
  }, [initialName]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialName) {
      setEditing(false);
      setValue(initialName);
      return;
    }
    setSaving(true);
    try {
      await api.worlds.rename(worldId, trimmed);
      onRename(trimmed);
    } catch {
      setValue(initialName);
    }
    setSaving(false);
    setEditing(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setValue(initialName);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKey}
        disabled={saving}
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "1px solid #1aadad",
          color: "#d8e8f2",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: "1.05rem",
          letterSpacing: "0.05em",
          outline: "none",
          width: "100%",
          padding: "0 0 2px",
        }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to rename"
      style={{
        background: "none",
        border: "none",
        padding: 0,
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: "1.05rem",
        color: "#d8e8f2",
        letterSpacing: "0.05em",
        textAlign: "left",
        cursor: "text",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      {initialName}
      <span
        style={{
          fontSize: "0.55rem",
          color: "#1aadad44",
          letterSpacing: "0.1em",
        }}
      >
        ✎
      </span>
    </button>
  );
}

// ── Corner bracket decorations (dossier/hardware panel look) ──────────────────

function CornerBrackets({ color = "#22c8b855", size = 12 }) {
  const base = {
    position: "absolute",
    width: size,
    height: size,
    borderColor: color,
    borderStyle: "solid",
  };
  return (
    <>
      <div style={{ ...base, top: -1, left: -1, borderWidth: "2px 0 0 2px" }} />
      <div
        style={{ ...base, top: -1, right: -1, borderWidth: "2px 2px 0 0" }}
      />
      <div
        style={{ ...base, bottom: -1, left: -1, borderWidth: "0 0 2px 2px" }}
      />
      <div
        style={{ ...base, bottom: -1, right: -1, borderWidth: "0 2px 2px 0" }}
      />
    </>
  );
}

// ── Story list item ───────────────────────────────────────────────────────────

function StoryItem({ story, isActive, onOpen }) {
  const statusCfg = {
    active: { color: "#1aadad", label: "ACTIVE" },
    complete: { color: "#28c898", label: "COMPLETE" },
    failed: { color: "#d04040", label: "FAILED" },
    abandoned: { color: "#3d5060", label: "ABANDONED" },
  }[story.status] || { color: "#1aadad", label: story.status.toUpperCase() };

  return (
    <div
      onClick={() => onOpen(story.id)}
      style={{
        border: `1px solid ${isActive ? "#1aadad44" : "#1aadad18"}`,
        borderLeft: `2px solid ${isActive ? "#1aadad" : "#1aadad33"}`,
        background: isActive ? "rgba(26,173,173,0.06)" : "rgba(4,6,12,0.5)",
        padding: "0.9rem 1.1rem",
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: "0.8rem",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(26,173,173,0.08)";
        e.currentTarget.style.borderLeftColor = "#1aadad66";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isActive
          ? "rgba(26,173,173,0.06)"
          : "rgba(4,6,12,0.5)";
        e.currentTarget.style.borderLeftColor = isActive
          ? "#1aadad"
          : "#1aadad33";
      }}
    >
      <div
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: statusCfg.color,
          flexShrink: 0,
          boxShadow: isActive ? `0 0 6px ${statusCfg.color}88` : "none",
          animation: isActive ? "statusGlow 2.5s ease-in-out infinite" : "none",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.15rem",
          }}
        >
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.88rem",
              color: isActive ? "#d8e8f2" : "#8aa0b0",
              letterSpacing: "0.03em",
            }}
          >
            {story.title}
          </span>
          {story.status !== "active" && (
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                letterSpacing: "0.12em",
                color: statusCfg.color,
                border: `1px solid ${statusCfg.color}44`,
                padding: "0.1rem 0.35rem",
                borderRadius: "2px",
              }}
            >
              {statusCfg.label}
            </span>
          )}
        </div>
        <div style={{ fontSize: "0.68rem", color: "#5a7888" }}>
          {formatDate(story.updated_at)} ·{" "}
          {Math.floor((story.message_count || 0) / 2)} exchanges
        </div>
      </div>
      <div style={{ color: "#1aadad44", fontSize: "0.75rem", flexShrink: 0 }}>
        ›
      </div>
    </div>
  );
}

// ── Lore cards — shown while mission is generating ────────────────────────────

const LORE_CARDS = [
  {
    label: "THE YEAR",
    color: "#1aadad",
    heading: "Earth, 2157",
    body: "The resource crises of the last century weren't catastrophic — just grinding and cumulative. The megacities are still there. So are the corporations. Humanity has scattered itself across the solar system: mining platforms on Ceres, a research base on Europa, a few thousand people on Mars in habitats that are starting to feel almost normal.",
  },
  {
    label: "FTL TRAVEL",
    color: "#2a80e8",
    heading: "Faster Than Light. Barely.",
    body: "Three corporations cracked variants of FTL drives in the 2140s. The drives are experimental, fuel-hungry, and prone to failures that are sometimes impossible to survive. They work. Mostly. The first survey missions launched in 2151. Six years later, humanity has visited eleven systems. None have shown complex life. Three have shown something that might be evidence of prior habitation.",
  },
  {
    label: "THE OBSERVERS",
    color: "#9a6fff",
    heading: "Something Has Been Watching",
    body: "No formal contact has been made with any non-human intelligence. This is the official position of every government and corporation operating in deep space, and it is technically true. What is also true: certain sensor readings don't have good explanations. Certain structures on certain moons are too geometric. Certain employees — the ones who have been furthest out — come back knowing something they won't talk about.",
  },
  {
    label: "VANTAGE DEEP",
    color: "#28c898",
    heading: "The Company",
    body: "Vantage Deep was founded by Elara Voss — engineer, visionary, genuine believer in humanity's survival. She died in 2112. Her children sold their shares in 2118. The current Vantage is a different machine: disciplined, profitable, focused on resource extraction above everything else. The asteroid belt pays for the FTL program. The FTL program opens new asteroid belts. The vision is gone. The infrastructure it built remains.",
  },
  {
    label: "THE CREW",
    color: "#cc9900",
    heading: "ESV Threshold — VS-7",
    body: "You are Captain Maren Cole. Your ship is seven years old, modified so many times it barely resembles its original spec. Your crew: Okafor, the xenobiologist who sold his research to Vantage and has been renegotiating that deal ever since. Andic, the engineer who grew up on Ceres and treats the Threshold like the nicest thing she's ever owned. Reyes, the youngest, who has a photograph of Elara Voss on his bunk and knows something about what's out there that he isn't talking about. Cross, the medic, who will protect the crew — as long as the price is right.",
  },
];

const MISSION_STEPS = [
  "SCANNING SECTOR DATA",
  "IDENTIFYING TARGET PARAMETERS",
  "CROSS-REFERENCING VANTAGE DATABASE",
  "COMPILING MISSION PARAMETERS",
  "GENERATING BRIEFING DOCUMENT",
  "ENCRYPTING ORDERS",
  "UPLOADING TO THRESHOLD",
];

// Varied step durations (ms) — deliberately asymmetric so steps don't sync with lore cards
const STEP_DURATIONS = [3200, 4700, 3900, 6100, 4300, 3600, 5200];

function MissionGeneratingStatus() {
  const [history, setHistory] = useState([0]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let stepIndex = 0;

    function scheduleNext() {
      const delay = STEP_DURATIONS[stepIndex % STEP_DURATIONS.length];
      setTimeout(() => {
        if (cancelled) return;
        stepIndex++;
        setHistory((prev) => {
          const next = (prev[prev.length - 1] + 1) % MISSION_STEPS.length;
          return [...prev, next].slice(-4);
        });
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    const elapsedTimer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      cancelled = true;
      clearInterval(elapsedTimer);
    };
  }, []);

  return (
    <div style={{ marginBottom: "0.9rem" }}>
      {history.map((stepIdx, i) => {
        const isActive = i === history.length - 1;
        return (
          <div
            key={`${stepIdx}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              marginBottom: "0.3rem",
              animation: isActive ? "fadeIn 0.4s ease" : "none",
            }}
          >
            {isActive ? (
              <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                {[0, 1, 2, 3].map((j) => (
                  <div
                    key={j}
                    style={{
                      width: "3px",
                      height: "9px",
                      background: "#1aadad",
                      borderRadius: "2px",
                      animation: `pulse 1s ease-in-out ${j * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.55rem",
                  color: "#1aadad66",
                  flexShrink: 0,
                  width: "18px",
                  textAlign: "center",
                }}
              >
                ✓
              </span>
            )}
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                color: isActive ? "#1aadad" : "#1aadad55",
              }}
            >
              {MISSION_STEPS[stepIdx]}
            </span>
          </div>
        );
      })}
      {elapsed >= 10 && (
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.55rem",
            color: "#1aadad55",
            letterSpacing: "0.1em",
            marginTop: "0.5rem",
            paddingLeft: "22px",
            animation: "fadeIn 0.5s ease",
          }}
        >
          PROCESSING — {elapsed}S ELAPSED
        </div>
      )}
    </div>
  );
}

function LoreCards() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % LORE_CARDS.length);
      setAnimKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const card = LORE_CARDS[activeIdx];

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Bracket navigation */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "0.8rem",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.48rem",
            color: "#1aadad66",
            letterSpacing: "0.2em",
            marginRight: "4px",
          }}
        >
          INTEL
        </span>
        {LORE_CARDS.map((c, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveIdx(i);
              setAnimKey((k) => k + 1);
            }}
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "0.58rem",
              color: i === activeIdx ? card.color : "#1aadad2a",
              background: "none",
              border: "none",
              padding: "0 1px",
              cursor: "pointer",
              transition: "color 0.3s",
              letterSpacing: "-0.05em",
            }}
          >
            {i === activeIdx ? "[■]" : "[ ]"}
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        key={animKey}
        style={{
          border: `1px solid ${card.color}22`,
          borderLeft: `3px solid ${card.color}88`,
          background: "rgba(4,6,12,0.6)",
          padding: "1.1rem 1.3rem",
          animation: "slideCard 0.35s ease",
          minHeight: "110px",
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
            letterSpacing: "0.04em",
            marginBottom: "0.55rem",
            lineHeight: 1.2,
          }}
        >
          {card.heading}
        </div>
        <p
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.72rem",
            color: "#5a7888",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {card.body}
        </p>
      </div>
    </div>
  );
}

// ── Campaign initialization card ──────────────────────────────────────────────

const INIT_STEPS = [
  { text: "ALLOCATING CAMPAIGN RECORD...", delay: 0 },
  { text: "QUERYING DESIGNATION DATABASE...", delay: 0.65 },
  { text: "GENERATING CAMPAIGN IDENTITY...", delay: 1.3 },
];

function CreatingWorldCard({ assignedName }) {
  return (
    <div
      style={{
        border: "1px solid #1aadad2a",
        borderLeft: "3px solid #1aadad55",
        background: "rgba(4,6,12,0.88)",
        marginBottom: "1.5rem",
        position: "relative",
        animation: "fadeUp 0.3s ease",
        padding: "1.2rem 1.4rem",
      }}
    >
      <CornerBrackets />
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.5rem",
          color: "#1aadad33",
          letterSpacing: "0.3em",
          marginBottom: "0.9rem",
        }}
      >
        CAMPAIGN INITIALIZATION
      </div>
      {INIT_STEPS.map((step, i) => (
        <div
          key={i}
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.68rem",
            color: "#3d6878",
            letterSpacing: "0.03em",
            marginBottom: "0.3rem",
            opacity: 0,
            animation: `fadeIn 0.2s ease ${step.delay}s forwards`,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ color: "#1aadad33" }}>›</span>
          {step.text}
        </div>
      ))}
      {assignedName ? (
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.68rem",
            color: "#22c8b8",
            letterSpacing: "0.03em",
            marginTop: "0.5rem",
            animation: "fadeIn 0.3s ease forwards",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>✓</span>
          ASSIGNED: {assignedName}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginTop: "0.6rem",
            opacity: 0,
            animation: "fadeIn 0.2s ease 1.3s forwards",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: "3px",
                height: "10px",
                background: "#1aadad",
                borderRadius: "2px",
                animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── World card ────────────────────────────────────────────────────────────────

function WorldCard({
  world,
  onRename,
  onCreateStory,
  onAbandon,
  onDelete,
  creating,
  abandoning,
}) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allStories = world.stories || [];
  const activeStory = world.activeStory || null;
  const finishedStories = allStories.filter(
    (s) => s.status !== "active" && s.status !== "abandoned",
  );
  const abandonedStories = allStories.filter((s) => s.status === "abandoned");
  const displayFinished = showAll
    ? finishedStories
    : finishedStories.slice(0, 3);

  const missionCount = world.world_state?.mission_count || 0;
  const vantageRel = world.world_state?.vantage_relationship || "neutral";
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
        border: "1px solid #1aadad2a",
        borderLeft: "3px solid #1aadad55",
        background: "rgba(4,6,12,0.88)",
        marginBottom: "1.5rem",
        animation: "fadeUp 0.3s ease",
        position: "relative",
      }}
    >
      <CornerBrackets />
      {/* World header */}
      <div
        style={{
          padding: "1.1rem 1.3rem",
          borderBottom: "1px solid #1aadad11",
          display: "flex",
          alignItems: "center",
          gap: "0.8rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.68rem",
              color: "#1aadadbb",
              letterSpacing: "0.3em",
              marginBottom: "0.2rem",
            }}
          >
            CAMPAIGN
          </div>
          <WorldNameEditor
            worldId={world.id}
            initialName={world.name}
            onRename={(name) => onRename(world.id, name)}
          />
        </div>

        {/* World stats */}
        <div style={{ display: "flex", gap: "0.6rem", flexShrink: 0 }}>
          <div
            style={{
              background: "rgba(26,173,173,0.06)",
              border: "1px solid #1aadad22",
              padding: "0.3rem 0.6rem",
              textAlign: "center",
              minWidth: "3.2rem",
            }}
          >
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                color: "#1aadad77",
                letterSpacing: "0.2em",
                marginBottom: "0.15rem",
              }}
            >
              MISSIONS
            </div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#22c8b8",
                lineHeight: 1,
              }}
            >
              {missionCount}
            </div>
          </div>
          <div
            style={{
              background: `${relColor}0d`,
              border: `1px solid ${relColor}33`,
              padding: "0.3rem 0.6rem",
              textAlign: "center",
              minWidth: "4.5rem",
            }}
          >
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.5rem",
                color: "#1aadad77",
                letterSpacing: "0.2em",
                marginBottom: "0.15rem",
              }}
            >
              VANTAGE
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "0.65rem",
                color: relColor,
                letterSpacing: "0.1em",
                lineHeight: 1,
                animation:
                  vantageRel === "hostile" || vantageRel === "strained"
                    ? "statusGlow 2s ease-in-out infinite"
                    : "none",
              }}
            >
              {vantageRel.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
          <button
            onClick={() => navigate(`/world/${world.id}/codex`)}
            title="View Codex"
            style={{
              background: "none",
              border: "1px solid #1aadad44",
              color: "#1aadad",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              padding: "0.3rem 0.6rem",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#1aadad88";
              e.target.style.color = "#22c8b8";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#1aadad44";
              e.target.style.color = "#1aadad";
            }}
          >
            CODEX
          </button>
          {confirmDelete ? (
            <>
              <button
                onClick={() => {
                  onDelete(world.id);
                  setConfirmDelete(false);
                }}
                style={{
                  background: "#d0404022",
                  border: "1px solid #d04040",
                  color: "#d04040",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.1em",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "4px",
                }}
              >
                CONFIRM
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  background: "none",
                  border: "1px solid #1aadad22",
                  color: "#3d6078",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.1em",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "4px",
                }}
              >
                CANCEL
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete world"
              style={{
                background: "none",
                border: "1px solid transparent",
                color: "#283848",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.55rem",
                padding: "0.3rem 0.5rem",
                borderRadius: "4px",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#d0404044";
                e.target.style.color = "#d04040";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "transparent";
                e.target.style.color = "#283848";
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Active story */}
      {activeStory ? (
        <div
          style={{
            padding: "0.8rem 1.3rem",
            borderBottom:
              finishedStories.length > 0 ? "1px solid #1aadad11" : "none",
          }}
        >
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.68rem",
              color: "#1aadadbb",
              letterSpacing: "0.3em",
              marginBottom: "0.4rem",
            }}
          >
            ACTIVE MISSION
          </div>
          <StoryItem
            story={activeStory}
            isActive={true}
            onOpen={(id) => navigate(`/story/${id}`)}
          />
          <button
            onClick={() => onAbandon(world.id)}
            disabled={abandoning}
            style={{
              marginTop: "0.5rem",
              background: "none",
              border: "none",
              color: "#3d5060",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.52rem",
              letterSpacing: "0.1em",
              padding: "0.2rem 0",
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#d04040";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#3d5060";
            }}
          >
            {abandoning ? "ABANDONING..." : "ABANDON MISSION"}
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: "0.8rem 1.3rem",
            borderBottom:
              finishedStories.length > 0 ? "1px solid #1aadad11" : "none",
          }}
        >
          {allStories.length === 0 && !creating && (
            <div style={{ marginBottom: "0.9rem" }}>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#7a9ab0",
                  lineHeight: 1.85,
                  margin: "0 0 0.6rem",
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              >
                You are Captain Maren Cole of the ESV Threshold — a deep space
                survey vessel owned by Vantage Deep. Humanity has only just
                begun reaching beyond its own solar system, and already there
                are signs that something was out there before us — and may still
                be watching. None of that has slowed the corporations down. The
                asteroid belts still need mining. The quarterly reports still
                need filing.
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#4a6878",
                  lineHeight: 1.8,
                  margin: "0 0 0.9rem",
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              >
                Use the <span style={{ color: "#1aadad" }}>CODEX</span> to
                review your ship and crew before your first mission. Each
                mission is generated fresh — no two are the same. Return to the{" "}
                <span style={{ color: "#1aadad" }}>CODEX</span> at any time to
                review past missions and the evolving state of the world around
                you. Good luck, Captain.
              </p>
            </div>
          )}
          {creating ? (
            <div
              style={{
                border: "1px solid #1aadad33",
                borderLeft: "3px solid #1aadad",
                background: "rgba(26,173,173,0.04)",
                padding: "1rem 1.2rem",
                animation: "fadeUp 0.3s ease",
              }}
            >
              <MissionGeneratingStatus />
              <LoreCards />
            </div>
          ) : (
            <button
              onClick={() => onCreateStory(world.id)}
              style={{
                width: "100%",
                background: "rgba(26,173,173,0.08)",
                border: "1px dashed #1aadad44",
                color: "#1aadad",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.68rem",
                letterSpacing: "0.15em",
                padding: "0.8rem",
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(26,173,173,0.14)";
                e.target.style.borderStyle = "solid";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(26,173,173,0.08)";
                e.target.style.borderStyle = "dashed";
              }}
            >
              + NEW MISSION
            </button>
          )}
        </div>
      )}

      {/* Completed/failed stories */}
      {finishedStories.length > 0 && (
        <div style={{ padding: "0.8rem 1.3rem" }}>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.68rem",
              color: "#1aadadbb",
              letterSpacing: "0.3em",
              marginBottom: "0.4rem",
            }}
          >
            MISSION LOG — {finishedStories.length}{" "}
            {finishedStories.length === 1 ? "ENTRY" : "ENTRIES"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {displayFinished.map((s) => (
              <StoryItem
                key={s.id}
                story={s}
                isActive={false}
                onOpen={(id) => navigate(`/story/${id}`)}
              />
            ))}
          </div>
          {finishedStories.length > 3 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              style={{
                marginTop: "0.5rem",
                background: "none",
                border: "none",
                color: "#1aadad44",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.52rem",
                letterSpacing: "0.12em",
                padding: "0.2rem 0",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#1aadad";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#1aadad44";
              }}
            >
              {showAll
                ? `▲ SHOW FEWER`
                : `▼ SHOW ALL ${finishedStories.length}`}
            </button>
          )}
        </div>
      )}

      {/* Abandoned stories (collapsed, minimal) */}
      {abandonedStories.length > 0 && (
        <div
          style={{
            padding: "0 1.3rem 0.6rem",
            borderTop: "1px solid #1aadad08",
          }}
        >
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.45rem",
              color: "#283848",
              letterSpacing: "0.25em",
              marginTop: "0.6rem",
            }}
          >
            {abandonedStories.length} ABANDONED
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingWorld, setCreatingWorld] = useState(false);
  const [newWorldName, setNewWorldName] = useState(null);
  const [creatingStoryFor, setCreatingStoryFor] = useState(null); // world id
  const [abandoningFor, setAbandoningFor] = useState(null); // world id
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWorlds();
  }, []);

  async function loadWorlds() {
    setLoading(true);
    try {
      const { worlds: worldList } = await api.worlds.list();
      // Load full data (stories) for each world in parallel
      const detailed = await Promise.all(
        worldList.map((w) =>
          api.worlds.get(w.id).then(({ world, activeStory, stories }) => ({
            ...world,
            activeStory,
            stories,
          })),
        ),
      );
      setWorlds(detailed);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleCreateWorld() {
    setCreatingWorld(true);
    setNewWorldName(null);
    setError(null);
    try {
      const { world } = await api.worlds.create();
      setNewWorldName(world.name);
      await new Promise((r) => setTimeout(r, 900));
      setWorlds((prev) => [
        { ...world, activeStory: null, stories: [] },
        ...prev,
      ]);
    } catch (e) {
      setError(e.message);
    }
    setCreatingWorld(false);
    setNewWorldName(null);
  }

  async function handleCreateStory(worldId) {
    setCreatingStoryFor(worldId);
    setError(null);
    try {
      const { story } = await api.worlds.createStory(worldId);
      navigate(`/story/${story.id}`);
    } catch (e) {
      setError(e.message);
      setCreatingStoryFor(null);
    }
  }

  async function handleAbandon(worldId) {
    if (
      !confirm(
        "Abandon the active mission? The log will be kept but no world state will be updated.",
      )
    )
      return;
    setAbandoningFor(worldId);
    try {
      await api.worlds.abandon(worldId);
      // Reload the affected world
      const { world, activeStory, stories } = await api.worlds.get(worldId);
      setWorlds((prev) =>
        prev.map((w) =>
          w.id === worldId ? { ...world, activeStory, stories } : w,
        ),
      );
    } catch (e) {
      setError(e.message);
    }
    setAbandoningFor(null);
  }

  async function handleDelete(worldId) {
    try {
      await api.worlds.delete(worldId);
      setWorlds((prev) => prev.filter((w) => w.id !== worldId));
    } catch (e) {
      setError(e.message);
    }
  }

  function handleRename(worldId, newName) {
    setWorlds((prev) =>
      prev.map((w) => (w.id === worldId ? { ...w, name: newName } : w)),
    );
  }

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
              background: "#1aadad",
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
                color: "#1aadad",
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
                color: "#22c8b8",
                letterSpacing: "0.08em",
                lineHeight: 1,
              }}
            >
              CAMPAIGN RECORDS
            </div>
          </div>
          <div
            style={{
              fontSize: "0.65rem",
              color: "#3d6078",
              marginRight: "0.5rem",
            }}
          >
            {user?.email}
          </div>
          <button
            onClick={logout}
            style={{
              background: "none",
              border: "1px solid #1aadad44",
              color: "#1aadad",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              padding: "0.3rem 0.7rem",
              borderRadius: "8px",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#1aadad22";
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
        {/* Top bar */}
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
                color: "#1aadad",
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
                color: "#d8e8f2",
              }}
            >
              {loading
                ? "Loading..."
                : worlds.length === 0
                  ? "No campaigns on record"
                  : `${worlds.length} campaign${worlds.length !== 1 ? "s" : ""} on record`}
            </div>
          </div>
          <button
            onClick={handleCreateWorld}
            disabled={creatingWorld}
            style={{
              background: creatingWorld ? "#0a2030" : "#1aadad",
              color: creatingWorld ? "#2a5060" : "#04050a",
              border: "none",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              padding: "0.7rem 1.5rem",
              borderRadius: "0 16px 16px 0",
              textTransform: "uppercase",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!creatingWorld) e.target.style.background = "#22c8b8";
            }}
            onMouseLeave={(e) => {
              if (!creatingWorld) e.target.style.background = "#1aadad";
            }}
          >
            {creatingWorld ? "Creating..." : "+ New Campaign"}
          </button>
        </div>

        {creatingWorld && <CreatingWorldCard assignedName={newWorldName} />}

        {error && (
          <div
            style={{
              color: "#d04040",
              fontSize: "0.75rem",
              padding: "0.6rem 0.8rem",
              borderLeft: "3px solid #d04040",
              background: "rgba(208,64,64,0.06)",
              marginBottom: "1.5rem",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              color: "#283848",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              padding: "2rem 0",
            }}
          >
            LOADING CAMPAIGN RECORDS...
          </div>
        ) : worlds.length === 0 ? (
          <div
            style={{
              border: "1px solid #1aadad18",
              borderLeft: "3px solid #1aadad44",
              background: "rgba(4,6,12,0.8)",
              padding: "2rem 2rem",
              animation: "fadeUp 0.3s ease",
            }}
          >
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.58rem",
                color: "#1aadad",
                letterSpacing: "0.3em",
                marginBottom: "0.5rem",
              }}
            >
              ESV THRESHOLD · VS-7 · STANDING BY
            </div>
            <div>
              <img
                src={shipImg}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  margin: "0 auto 1rem",
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.78rem",
                color: "#4a6878",
                lineHeight: 1.8,
                margin: "0 0 1.5rem",
              }}
            >
              Each campaign is a persistent universe — characters,
              relationships, and consequences carry forward across missions.
              Start a campaign, then create your first mission to begin.
            </p>
            <LoreCards />
          </div>
        ) : (
          worlds.map((world) => (
            <WorldCard
              key={world.id}
              world={world}
              onRename={handleRename}
              onCreateStory={handleCreateStory}
              onAbandon={handleAbandon}
              onDelete={handleDelete}
              creating={creatingStoryFor === world.id}
              abandoning={abandoningFor === world.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
