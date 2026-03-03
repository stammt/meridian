import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";

const typewriterSpeed = 16;

const CREW = [
  {
    name: "Captain Elia Thorn",
    rank: "Commanding Officer",
    species: "Human",
    age: "52",
    color: "#e05c00",
    initial: "T",
    details: [
      {
        label: "Background",
        text: "Born on Proxima Colony, Thorn joined Starfleet as a tactical officer and spent her early career on the front lines — Wolf 359 left its mark, though she rarely speaks of it. She served a brief but formative assignment under Captain Picard on the Enterprise-E.",
      },
      {
        label: "Personality",
        text: "Thorn leads with dry, understated humor that can disarm a tense bridge in seconds. She is unshakeable under pressure and believes in her people completely.",
      },
      {
        label: "Relationship with Voss",
        text: "Thorn championed Voss's mission proposal at Starfleet Command. She treats Voss as a near-equal and often asks for her read on a situation before making calls.",
      },
    ],
  },
  {
    name: "Lieutenant Jorek",
    rank: "Chief Engineer",
    species: "Vulcan",
    age: "130",
    color: "#4a9eff",
    initial: "J",
    details: [
      {
        label: "Background",
        text: "At 130, Jorek has served on eleven starships. He was present during the Cardassian withdrawal from Bajor, first contact with the Dominion, and the Breen attack on Earth.",
      },
      {
        label: "Personality",
        text: "Jorek speaks in declaratives and rarely wastes a word. He is meticulous with the ship's systems to the point where engineering staff suspect he talks to the warp core.",
      },
      {
        label: "Hidden Depths",
        text: "Despite his Vulcan detachment, Jorek has developed something resembling fondness for humans — particularly their capacity for irrational optimism. He would deny this categorically.",
      },
    ],
  },
  {
    name: "Ensign Priti Bashara",
    rank: "Conn Officer",
    species: "Human",
    age: "24",
    color: "#cc9900",
    initial: "B",
    details: [
      {
        label: "Background",
        text: "The youngest senior staff member aboard the Meridian, Bashara graduated top 5% at the Academy. She turned down a battlecruiser posting to take the conn on an exploratory vessel.",
      },
      {
        label: "Personality",
        text: "Quick, enthusiastic, and occasionally reckless. She has an instinct for spatial reasoning that borders on uncanny — she once navigated a debris field at warp without instruments on a bet.",
      },
      {
        label: "Arc",
        text: "Still learning the difference between courage and bravado. Voss has taken her under her wing, recognizing something of her younger self in Bashara's eagerness to prove she belongs.",
      },
    ],
  },
  {
    name: "Dr. Owin Fesh",
    rank: "Chief Medical Officer",
    species: "Bolian",
    age: "47",
    color: "#5bc8af",
    initial: "F",
    details: [
      {
        label: "Background",
        text: "Fesh came to medicine through loss — his partner died of a condition Federation medicine couldn't treat in time. He volunteered for the Meridian specifically because uncharted space means uncharted biology.",
      },
      {
        label: "Personality",
        text: "Warm, theatrical, and relentlessly optimistic. His sickbay is the most visited room on the ship for non-medical reasons.",
      },
      {
        label: "Medical Philosophy",
        text: "Fesh believes the best medicine is prevention, and the best prevention is a crew that talks to each other. Thorn quietly relies on his read of crew morale.",
      },
    ],
  },
  {
    name: "Lieutenant K'veth",
    rank: "Security Chief",
    species: "Klingon",
    age: "38",
    color: "#c84040",
    initial: "K",
    details: [
      {
        label: "Background",
        text: "K'veth fought in the Dominion War on the Cardassian front. She accepted a Starfleet integration posting not because she was ordered to, but because she was curious what honor looked like outside of war.",
      },
      {
        label: "Personality",
        text: "Direct to the point of bluntness. Deeply honorable — the first to acknowledge when she's wrong, the last to abandon a crew member in danger.",
      },
      {
        label: "On the Meridian",
        text: "She finds deep-space science 'frustratingly peaceful' but has come to see the mission as a different kind of courage. She and Jorek have a running philosophical debate about duty that shows no signs of resolution.",
      },
    ],
  },
];

function TerminalCursor() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "2px",
        height: "1.1em",
        background: "#f5a623",
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
        color: isLatest ? "#e8dcc8" : "#7a6d58",
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
        borderLeft: "2px solid #c8830a33",
      }}
    >
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.58rem",
          color: "#c8830a77",
          letterSpacing: "0.2em",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        ▶ VOSS
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          ref={textRef}
          style={{
            margin: 0,
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "0.8rem",
            color: "#5a5040",
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
              color: "#c8830a66",
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
        border: `1px solid ${failed ? "#c8403044" : "#5bc8af44"}`,
        borderLeft: `3px solid ${failed ? "#c84030" : "#5bc8af"}`,
        background: failed ? "rgba(200,64,48,0.06)" : "rgba(91,200,175,0.06)",
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
          color: failed ? "#c84030" : "#5bc8af",
          marginBottom: "0.5rem",
        }}
      >
        ── {failed ? "MISSION FAILED" : "MISSION COMPLETE"} ──
      </div>
      <p
        style={{
          color: "#9e8f72",
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
          border: `1px solid ${failed ? "#c84030" : "#5bc8af"}`,
          color: failed ? "#c84030" : "#5bc8af",
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
        width: isOpen ? "280px" : "0px",
        flexShrink: 0,
        overflow: "hidden",
        transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div
        style={{
          width: "280px",
          height: "100%",
          borderLeft: "2px solid #c8830a22",
          background: "rgba(10,8,4,0.85)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            borderBottom: "1px solid #c8830a22",
            padding: "1rem",
            position: "sticky",
            top: 0,
            background: "rgba(10,8,4,0.98)",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", gap: "4px", marginBottom: "0.6rem" }}>
            <div
              style={{
                background: "#5bc8af",
                height: "8px",
                flex: 2,
                borderRadius: "4px",
              }}
            />
            <div
              style={{
                background: "#c8830a",
                height: "8px",
                flex: 1,
                borderRadius: "4px",
              }}
            />
            <div
              style={{
                background: "#cc9900",
                height: "8px",
                width: "20px",
                borderRadius: "4px",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.58rem",
              color: "#5bc8af",
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
              color: "#f5a623",
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
              color: "#c8830a",
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
                  color: "#9e8f72",
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
              background: "#5bc8af44",
              height: "6px",
              width: "24px",
              borderRadius: "3px",
            }}
          />
          <div
            style={{
              background: "#c8830a22",
              flex: 1,
              height: "6px",
              borderRadius: "3px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Crew Panel ────────────────────────────────────────────────────────────────

function CrewPanel({ isOpen }) {
  const [expandedCrew, setExpandedCrew] = useState(null);
  return (
    <div
      style={{
        width: isOpen ? "280px" : "0px",
        flexShrink: 0,
        overflow: "hidden",
        transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div
        style={{
          width: "280px",
          height: "100%",
          borderLeft: "2px solid #c8830a22",
          background: "rgba(10,8,4,0.85)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            borderBottom: "1px solid #c8830a22",
            padding: "1rem",
            position: "sticky",
            top: 0,
            background: "rgba(10,8,4,0.98)",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", gap: "4px", marginBottom: "0.6rem" }}>
            <div
              style={{
                background: "#c8830a",
                height: "8px",
                flex: 2,
                borderRadius: "4px",
              }}
            />
            <div
              style={{
                background: "#cc9900",
                height: "8px",
                flex: 1,
                borderRadius: "4px",
              }}
            />
            <div
              style={{
                background: "#e05c00",
                height: "8px",
                width: "20px",
                borderRadius: "4px",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.58rem",
              color: "#c8830a",
              letterSpacing: "0.3em",
            }}
          >
            CREW MANIFEST · USS MERIDIAN
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.72rem",
              color: "#f5a623",
              letterSpacing: "0.1em",
              marginTop: "0.2rem",
            }}
          >
            SENIOR STAFF — NCC-74700
          </div>
        </div>
        <div style={{ padding: "0.6rem 0" }}>
          {CREW.map((member) => {
            const isExpanded = expandedCrew === member.name;
            return (
              <div
                key={member.name}
                style={{ borderBottom: "1px solid #c8830a11" }}
              >
                <button
                  onClick={() =>
                    setExpandedCrew(isExpanded ? null : member.name)
                  }
                  style={{
                    width: "100%",
                    background: isExpanded
                      ? "rgba(200,131,10,0.08)"
                      : "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.7rem",
                    textAlign: "left",
                    transition: "background 0.2s",
                    borderLeft: `3px solid ${isExpanded ? member.color : "transparent"}`,
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: `${member.color}22`,
                      border: `1.5px solid ${member.color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: member.color,
                    }}
                  >
                    {member.initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: "#e8dcc8",
                        letterSpacing: "0.05em",
                        lineHeight: 1.2,
                      }}
                    >
                      {member.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.62rem",
                        color: "#6a5d48",
                        marginTop: "0.15rem",
                      }}
                    >
                      {member.rank}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      color: "#c8830a",
                      transition: "transform 0.25s",
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  >
                    ▶
                  </div>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 1rem 1rem",
                      animation: "fadeUp 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        marginBottom: "0.9rem",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: "0.6rem",
                          color: member.color,
                          background: `${member.color}18`,
                          border: `1px solid ${member.color}44`,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "3px",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {member.species.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: "0.6rem",
                          color: "#6a5d48",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid #c8830a22",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "3px",
                          letterSpacing: "0.1em",
                        }}
                      >
                        AGE {member.age}
                      </span>
                    </div>
                    {member.details.map(({ label, text }) => (
                      <div key={label} style={{ marginBottom: "0.85rem" }}>
                        <div
                          style={{
                            fontFamily: "'Rajdhani', sans-serif",
                            fontSize: "0.58rem",
                            color: member.color,
                            letterSpacing: "0.2em",
                            marginBottom: "0.3rem",
                            textTransform: "uppercase",
                          }}
                        >
                          {label}
                        </div>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#9e8f72",
                            lineHeight: 1.75,
                            margin: 0,
                          }}
                        >
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding: "0.8rem 1rem", display: "flex", gap: "4px" }}>
          <div
            style={{
              background: "#e05c00",
              height: "6px",
              width: "24px",
              borderRadius: "3px",
            }}
          />
          <div
            style={{
              background: "#c8830a22",
              flex: 1,
              height: "6px",
              borderRadius: "3px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main Game Page ────────────────────────────────────────────────────────────

export default function Game() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [segments, setSegments] = useState([]);
  const [status, setStatus] = useState("active");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [rightPanel, setRightPanel] = useState(null); // "crew" | "mission" | null
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
      .then(({ story, messages }) => {
        setStory(story);
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
      ? "#c84030"
      : status === "complete"
        ? "#5bc8af"
        : "#c8830a";

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
    ::-webkit-scrollbar-track { background: #0a0c14; }
    ::-webkit-scrollbar-thumb { background: #c8830a; border-radius: 2px; }
    textarea:focus { outline: none; }
    button { cursor: pointer; }
  `;

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#05060f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#c8830a",
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
        background: "#05060f",
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
          background: "#0a0c1a",
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
                ? "STARFLEET SCIENCE DIVISION · NCC-74700"
                : status === "failed"
                  ? "MISSION FAILED · NCC-74700"
                  : "MISSION COMPLETE · NCC-74700"}
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#f5a623",
                letterSpacing: "0.08em",
                lineHeight: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "400px",
              }}
            >
              {story?.title || "USS MERIDIAN"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Mission briefing toggle */}
            {scenario && (
              <button
                onClick={() => togglePanel("mission")}
                style={{
                  background:
                    rightPanel === "mission" ? "#5bc8af22" : "#1a1020",
                  color: rightPanel === "mission" ? "#5bc8af" : "#5bc8af88",
                  border: `1px solid ${rightPanel === "mission" ? "#5bc8af" : "#5bc8af33"}`,
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
              onClick={() => togglePanel("crew")}
              style={{
                background: rightPanel === "crew" ? "#c8830a22" : "#1a1020",
                color: rightPanel === "crew" ? "#f5a623" : "#c8830a",
                border: `1px solid ${rightPanel === "crew" ? "#c8830a" : "#c8830a44"}`,
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
              ▤ Crew
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "#1a1020",
                color: "#c8830a",
                border: "1px solid #c8830a44",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                padding: "0.35rem 0.8rem",
                borderRadius: "12px",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#c8830a22";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#1a1020";
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
        {/* Left LCARS sidebar */}
        <div
          style={{
            width: "48px",
            flexShrink: 0,
            padding: "1.2rem 0 1.2rem 1.2rem",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignSelf: "stretch",
          }}
        >
          <div
            style={{
              background: statusColor,
              height: "48px",
              borderRadius: "24px 0 0 24px",
              transition: "background 0.5s",
            }}
          />
          <div
            style={{
              background: "#cc9900",
              height: "24px",
              borderRadius: "12px 0 0 12px",
            }}
          />
          <div
            style={{
              background: "#e05c00",
              height: "16px",
              borderRadius: "8px 0 0 8px",
            }}
          />
          <div
            style={{
              background: "#c8830a22",
              flex: 1,
              borderRadius: "8px 0 0 8px",
            }}
          />
          <div
            style={{
              background: "#e05c00",
              height: "16px",
              borderRadius: "8px 0 0 8px",
            }}
          />
          <div
            style={{
              background: statusColor,
              height: "24px",
              borderRadius: "12px 0 0 12px",
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
                color: "#e05c00",
                fontSize: "0.75rem",
                padding: "0.6rem 0.8rem",
                borderLeft: "3px solid #e05c00",
                background: "rgba(224,92,0,0.06)",
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
                    borderTop: "1px solid #c8830a11",
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

        {/* Right panels — only one shown at a time */}
        {rightPanel === "crew" && <CrewPanel isOpen={true} />}
        {rightPanel === "mission" && (
          <ScenarioPanel isOpen={true} scenario={scenario} />
        )}
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
              border: "1px solid #c8830a33",
              borderLeft: "3px solid #c8830a",
              background: "rgba(10,8,4,0.95)",
              padding: "1rem 1.2rem",
            }}
          >
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.6rem",
                color: "#c8830a",
                letterSpacing: "0.25em",
                marginBottom: "0.6rem",
              }}
            >
              ── VOSS · AWAITING ORDERS ──
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="What do you do, Lieutenant Commander?"
              rows={3}
              autoFocus
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#e8dcc8",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.88rem",
                lineHeight: 1.75,
                resize: "none",
                caretColor: "#f5a623",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.8rem",
                borderTop: "1px solid #c8830a22",
                paddingTop: "0.8rem",
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.6rem",
                  color: "#4a4030",
                  letterSpacing: "0.1em",
                }}
              >
                ENTER TO TRANSMIT · SHIFT+ENTER FOR NEW LINE
              </span>
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                style={{
                  background:
                    input.trim() && !sending ? "#c8830a" : "transparent",
                  color: input.trim() && !sending ? "#05060f" : "#4a4030",
                  border: `1px solid ${input.trim() && !sending ? "#c8830a" : "#c8830a33"}`,
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
      )}
    </div>
  );
}
