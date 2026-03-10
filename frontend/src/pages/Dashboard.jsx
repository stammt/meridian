import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../hooks/useAuth.jsx";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
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
        border: "1px solid #1aadad22",
        borderLeft: "3px solid #1aadad44",
        background: "rgba(4,6,12,0.8)",
        marginBottom: "1.5rem",
        animation: "fadeUp 0.3s ease",
      }}
    >
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
        <div style={{ display: "flex", gap: "1rem", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
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
                fontSize: "0.9rem",
                color: "#22c8b8",
              }}
            >
              {missionCount}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.65rem",
                color: "#1aadad99",
                letterSpacing: "0.2em",
              }}
            >
              VANTAGE
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.7rem",
                color: relColor,
                letterSpacing: "0.05em",
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
          {creating ? (
            <div style={{
              border: "1px solid #1aadad33",
              borderLeft: "3px solid #1aadad",
              background: "rgba(26,173,173,0.04)",
              padding: "1rem 1.2rem",
              animation: "fadeUp 0.3s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{
                      width: "3px", height: "10px", background: "#1aadad",
                      borderRadius: "2px", animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", color: "#1aadad", letterSpacing: "0.2em" }}>
                  GENERATING MISSION...
                </span>
              </div>
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
    setError(null);
    try {
      const { world } = await api.worlds.create();
      setWorlds((prev) => [
        { ...world, activeStory: null, stories: [] },
        ...prev,
      ]);
    } catch (e) {
      setError(e.message);
    }
    setCreatingWorld(false);
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

        {creatingWorld && (
          <div
            style={{
              border: "1px solid #1aadad33",
              borderLeft: "3px solid #1aadad",
              background: "rgba(26,173,173,0.04)",
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
                VANTAGE COMPUTER CREATING CAMPAIGN...
              </span>
            </div>
          </div>
        )}

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
              border: "1px dashed #1aadad22",
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "0.9rem", color: "#1aadad", lineHeight: 1.7 }}
            >
              Create a new campaign to begin. Each campaign is a persistent
              universe — characters, events, and consequences carry forward
              across missions.
            </div>
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
