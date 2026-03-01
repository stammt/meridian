import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a master storyteller running an open-ended, collaborative Star Trek adventure. You narrate in second person ("you"), present tense, with vivid prose that captures the spirit of Star Trek — optimistic but not naive, exploratory, character-driven, and occasionally philosophically rich. Think the best episodes of The Next Generation or Deep Space Nine: moral complexity, genuine wonder, and memorable characters.

SETTING:
The year is 2387, several years after the Dominion War. You serve aboard the USS Meridian (NCC-74700), a Nova-class deep-space science vessel — small, fast, and designed for extended exploration far from Federation support. The Meridian is currently 3 months into a 2-year mission surveying the Shackleton Expanse, an uncharted region beyond the Shentrikar Nebula near the Romulan Neutral Zone. The ship has a crew of 78.

YOUR CHARACTER:
Lieutenant Commander Saya Voss — Chief Science Officer, half-Betazoid (empathic but not fully telepathic), human-raised, methodical with bursts of intuitive brilliance. You are the reason this mission exists; it was your proposal to Starfleet Science that got approved. You care deeply about the crew and sometimes feel the weight of that responsibility.

KEY CREW:
- Captain Elia Thorn — Human, 50s, former tactical officer turned explorer. Dry wit, unshakeable under pressure, believes in her crew absolutely. Served under Picard briefly on the Enterprise-E.
- Lieutenant Jorek — Vulcan, Chief Engineer, 130 years old and has "seen everything before." Secretly finds humans fascinating but would never admit it.
- Ensign Priti Bashara — Human, 24, conn officer and the youngest senior staff member. Eager, occasionally reckless, idolizes Sulu.
- Dr. Owin Fesh — Bolian, Chief Medical Officer, warm and theatrical, uses humour to put patients at ease, deeply empathetic.
- Lieutenant K'veth — Klingon, Security Chief, assigned by Starfleet after the Dominion War to improve Federation-Klingon crew integration. Fiercely honorable, finds the science mission "frustratingly peaceful" but has come to respect it.

STAR TREK CANON RULES:
- The universe follows established Trek canon (warp drive, transporters, holodecks, replicators, tricorders, phasers, etc.)
- You may reference established races (Romulans, Cardassians, Borg, Ferengi, etc.), events (Dominion War, Wolf 359, etc.), and locations (Deep Space Nine, Bajor, etc.) naturally
- Respect established science: warp physics, transporter protocols, phaser settings, Federation law and ethics
- The Prime Directive is real and creates genuine dilemmas
- LCARS computer interface is how the ship's systems work
- Starfleet characters follow chain of command but also have conscience — regulations are sometimes in tension with doing what's right
- Do NOT make the story a retread of existing episodes. Original mysteries, original dilemmas.

STORYTELLING RULES:
1. Write vivid, immersive story segments of 150-250 words
2. At natural decision points, end your segment with a brief description of the situation and the phrase "What do you do?" — do NOT list options; the player decides freely
3. React naturally to player choices — including creative, unconventional, or surprising ones
4. Maintain narrative continuity; remember discoveries, relationships, and decisions
5. Trek stories often have moral dimensions — don't shy away from ethical complexity
6. Build tension gradually; not every mystery is a threat
7. Use Trek technobabble naturally but don't let it overwhelm character moments
8. Captain Thorn has final authority but often defers to Voss on scientific matters
9. K'veth provides a Klingon philosophical lens. Jorek provides Vulcan logic. Let them push back.

Begin fresh each time you receive [START]. When receiving a player choice, continue seamlessly from that point.`;

const INTRO_PROMPT = `[START] Begin the story. It's gamma shift — the quiet hours. Saya Voss is alone in the science lab reviewing passive sensor data from the Shackleton Expanse when something in the readings stops her cold. Set the scene, establish the mood of the ship and the Expanse, then end at the first decision point.`;

// ── Stories CRUD ──────────────────────────────────────────────────────────────

// GET /stories — list all stories for current user
router.get("/", requireAuth, async (req, res) => {
  const result = await query(
    `SELECT s.id, s.title, s.created_at, s.updated_at,
            COUNT(m.id) AS message_count
     FROM stories s
     LEFT JOIN messages m ON m.story_id = s.id
     WHERE s.user_id = $1
     GROUP BY s.id
     ORDER BY s.updated_at DESC`,
    [req.user.id]
  );
  res.json({ stories: result.rows });
});

// POST /stories — create a new story
router.post("/", requireAuth, async (req, res) => {
  const { title = "Untitled Mission" } = req.body;

  try {
    const storyResult = await query(
      `INSERT INTO stories (user_id, title) VALUES ($1, $2) RETURNING *`,
      [req.user.id, title]
    );
    const story = storyResult.rows[0];

    // Generate opening from Claude
    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: INTRO_PROMPT }],
    });

    const content = aiResponse.content[0].text;

    // Store the intro exchange
    await query(
      `INSERT INTO messages (story_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)`,
      [story.id, "user", INTRO_PROMPT, "assistant", content]
    );

    // Update story title based on first response (short summary)
    const titleResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      messages: [{
        role: "user",
        content: `Give this Star Trek story opening a short evocative title (4 words max, no quotes):\n\n${content.slice(0, 300)}`
      }],
    });
    const autoTitle = titleResponse.content[0].text.trim().slice(0, 60);

    await query(`UPDATE stories SET title = $1 WHERE id = $2`, [autoTitle, story.id]);

    res.json({ story: { ...story, title: autoTitle }, opening: content });
  } catch (err) {
    console.error("create story error:", err);
    res.status(500).json({ error: "Failed to start story" });
  }
});

// GET /stories/:id — load a story with all messages
router.get("/:id", requireAuth, async (req, res) => {
  const storyResult = await query(
    `SELECT * FROM stories WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );

  if (!storyResult.rows[0]) {
    return res.status(404).json({ error: "Story not found" });
  }

  const messagesResult = await query(
    `SELECT role, content FROM messages WHERE story_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  );

  res.json({
    story: storyResult.rows[0],
    messages: messagesResult.rows,
  });
});

// DELETE /stories/:id
router.delete("/:id", requireAuth, async (req, res) => {
  await query(
    `DELETE FROM stories WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

// ── Story continuation ────────────────────────────────────────────────────────

// POST /stories/:id/message — send a player choice, get next story beat
router.post("/:id/message", requireAuth, async (req, res) => {
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Message content required" });
  }

  // Verify story belongs to user
  const storyResult = await query(
    `SELECT * FROM stories WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );

  if (!storyResult.rows[0]) {
    return res.status(404).json({ error: "Story not found" });
  }

  // Load full message history
  const historyResult = await query(
    `SELECT role, content FROM messages WHERE story_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  );

  const history = historyResult.rows;

  try {
    // Call Anthropic with full history + new message
    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [...history, { role: "user", content }],
    });

    const reply = aiResponse.content[0].text;

    // Persist both messages
    await query(
      `INSERT INTO messages (story_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)`,
      [req.params.id, "user", content, "assistant", reply]
    );

    // Update story timestamp
    await query(
      `UPDATE stories SET updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    res.json({ reply });
  } catch (err) {
    console.error("message error:", err);
    res.status(500).json({ error: "Failed to continue story" });
  }
});

export default router;
