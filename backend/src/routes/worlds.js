import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/node";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { claudeLimiter } from "../middleware/limiters.js";
import {
  generateScenario,
  buildSystemPrompt,
  buildIntroPrompt,
} from "../scenario.js";
import { seedWorldState } from "../worldState.js";
import { trackAnthropicCall } from "../analytics.js";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseMissionStatus(text) {
  if (text.includes("[MISSION_FAILED]")) return "failed";
  if (text.includes("[MISSION_COMPLETE]")) return "complete";
  return "active";
}

function stripStatusToken(text) {
  return text
    .replace(/\[MISSION_FAILED\]/g, "")
    .replace(/\[MISSION_COMPLETE\]/g, "")
    .trim();
}

// ── World CRUD ────────────────────────────────────────────────────────────────

// GET /worlds — list user's worlds with active story info
router.get("/", requireAuth, async (req, res) => {
  const result = await query(
    `SELECT w.id, w.name, w.world_state, w.created_at, w.updated_at,
            COUNT(s.id) AS story_count
     FROM worlds w
     LEFT JOIN stories s ON s.world_id = w.id AND s.status NOT IN ('abandoned')
     WHERE w.user_id = $1
     GROUP BY w.id
     ORDER BY w.updated_at DESC`,
    [req.user.id],
  );
  res.json({ worlds: result.rows });
});

// POST /worlds — create a new world with seeded state and auto-generated name
router.post("/", requireAuth, claudeLimiter, async (req, res) => {
  try {
    const initialState = seedWorldState();

    // Create the world row first with a placeholder name
    const worldResult = await query(
      `INSERT INTO worlds (user_id, name, world_state) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, "New Campaign", JSON.stringify(initialState)],
    );
    const world = worldResult.rows[0];

    // Auto-generate a name via haiku (non-blocking on failure)
    try {
      const nameResponse = await trackAnthropicCall(
        anthropic,
        {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 30,
          messages: [
            {
              role: "user",
              content:
                'Generate a 2-3 word evocative campaign name for a science fiction deep-space exploration story. The crew works for Vantage Deep corporation aboard the ESV Threshold in 2157. The name should feel like a campaign arc title — atmospheric and slightly ominous. Return ONLY the name, nothing else. Examples: "The Long Dark", "Pale Survey", "Signal Season".',
            },
          ],
        },
        { operation: "generateWorldName", userId: req.user.id },
      );
      const name = nameResponse.content[0].text
        .trim()
        .replace(/^["']|["']$/g, "");
      await query(`UPDATE worlds SET name = $1 WHERE id = $2`, [
        name,
        world.id,
      ]);
      world.name = name;
    } catch (nameErr) {
      Sentry.captureException(nameErr, {
        extra: {
          operation: "generateWorldName",
          model: "claude-haiku-4-5-20251001",
          worldId: world.id,
        },
      });
      console.error("[worlds] Name generation failed:", nameErr);
      // Keep default name
    }

    res.json({ world });
  } catch (err) {
    console.error("create world error:", err);
    res.status(500).json({ error: "Failed to create world" });
  }
});

// PATCH /worlds/:id — update world name
router.patch("/:id", requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Name required" });
  }

  const result = await query(
    `UPDATE worlds SET name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
    [name.trim(), req.params.id, req.user.id],
  );

  if (!result.rows[0]) {
    return res.status(404).json({ error: "World not found" });
  }

  res.json({ world: result.rows[0] });
});

// DELETE /worlds/:id
router.delete("/:id", requireAuth, async (req, res) => {
  await query(`DELETE FROM worlds WHERE id = $1 AND user_id = $2`, [
    req.params.id,
    req.user.id,
  ]);
  res.json({ ok: true });
});

// GET /worlds/:id — world with active story and story list
router.get("/:id", requireAuth, async (req, res) => {
  const worldResult = await query(
    `SELECT * FROM worlds WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id],
  );

  if (!worldResult.rows[0]) {
    return res.status(404).json({ error: "World not found" });
  }

  const world = worldResult.rows[0];

  const storiesResult = await query(
    `SELECT s.id, s.title, s.status, s.scenario, s.created_at, s.updated_at,
            COUNT(m.id) AS message_count
     FROM stories s
     LEFT JOIN messages m ON m.story_id = s.id
     WHERE s.world_id = $1
     GROUP BY s.id
     ORDER BY s.updated_at DESC`,
    [req.params.id],
  );

  const stories = storiesResult.rows;
  const activeStory = stories.find((s) => s.status === "active") || null;

  res.json({ world, activeStory, stories });
});

// GET /worlds/:id/codex — full world state for display
router.get("/:id/codex", requireAuth, async (req, res) => {
  const worldResult = await query(
    `SELECT * FROM worlds WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id],
  );

  if (!worldResult.rows[0]) {
    return res.status(404).json({ error: "World not found" });
  }

  const activeStoryResult = await query(
    `SELECT id FROM stories WHERE world_id = $1 AND status = 'active'`,
    [req.params.id],
  );

  const activeStoryId = activeStoryResult.rows[0]?.id || null;

  res.json({ world: worldResult.rows[0], activeStoryId });
});

// ── World story creation ───────────────────────────────────────────────────────

// POST /worlds/:id/stories — create a new story in this world
router.post("/:id/stories", requireAuth, claudeLimiter, async (req, res) => {
  try {
    // Check world belongs to user
    const worldResult = await query(
      `SELECT * FROM worlds WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id],
    );

    if (!worldResult.rows[0]) {
      return res.status(404).json({ error: "World not found" });
    }

    const world = worldResult.rows[0];

    // Enforce one active story per world
    const activeCheck = await query(
      `SELECT id FROM stories WHERE world_id = $1 AND status = 'active'`,
      [req.params.id],
    );

    if (activeCheck.rows.length > 0) {
      return res.status(409).json({
        error:
          "This world already has an active mission. Complete or abandon it before starting a new one.",
        active_story_id: activeCheck.rows[0].id,
      });
    }

    // Generate scenario with world context
    const { ingredients, scenario } = await generateScenario(world.world_state, req.user.id);

    // Create story row
    const storyResult = await query(
      `INSERT INTO stories (user_id, world_id, title, scenario, ingredients)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        req.user.id,
        req.params.id,
        scenario.title,
        JSON.stringify(scenario),
        JSON.stringify(ingredients),
      ],
    );
    const story = storyResult.rows[0];

    // Generate opening with world-aware system prompt
    const systemPrompt = buildSystemPrompt(scenario, world.world_state);
    const introPrompt = buildIntroPrompt(scenario);

    const aiResponse = await trackAnthropicCall(
      anthropic,
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: introPrompt }],
      },
      { operation: "generateWorldStoryOpening", userId: req.user.id },
    );

    const rawContent = aiResponse.content[0].text;
    const status = parseMissionStatus(rawContent);
    const content = stripStatusToken(rawContent);

    await query(
      `INSERT INTO messages (story_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)`,
      [story.id, "user", introPrompt, "assistant", content],
    );

    if (status !== "active") {
      await query(`UPDATE stories SET status = $1 WHERE id = $2`, [
        status,
        story.id,
      ]);
    }

    res.json({
      story: { ...story, status },
      opening: content,
      scenario,
      world,
    });
  } catch (err) {
    console.error("create world story error:", err);
    res.status(500).json({ error: "Failed to start story" });
  }
});

// POST /worlds/:id/abandon — abandon the active story in this world
router.post("/:id/abandon", requireAuth, async (req, res) => {
  const worldResult = await query(
    `SELECT id FROM worlds WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id],
  );

  if (!worldResult.rows[0]) {
    return res.status(404).json({ error: "World not found" });
  }

  const result = await query(
    `UPDATE stories SET status = 'abandoned', updated_at = NOW()
     WHERE world_id = $1 AND status = 'active'
     RETURNING id`,
    [req.params.id],
  );

  if (!result.rows[0]) {
    return res.status(404).json({ error: "No active story to abandon" });
  }

  res.json({ ok: true, story_id: result.rows[0].id });
});

export default router;
