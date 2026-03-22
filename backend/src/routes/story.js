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
import { triggerWorldStateUpdate } from "../worldState.js";
import { trackAnthropicCall } from "../analytics.js";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Detect mission status signals in storyteller output
function parseMissionStatus(text) {
  if (text.includes("[MISSION_FAILED]")) return "failed";
  if (text.includes("[MISSION_COMPLETE]")) return "complete";
  return "active";
}

// Strip the status token from text before sending to client
function stripStatusToken(text) {
  return text
    .replace(/\[MISSION_FAILED\]/g, "")
    .replace(/\[MISSION_COMPLETE\]/g, "")
    .trim();
}

// ── Stories CRUD ──────────────────────────────────────────────────────────────

// GET /stories — list all stories for current user
router.get("/", requireAuth, async (req, res) => {
  const result = await query(
    `SELECT s.id, s.title, s.status, s.scenario, s.created_at, s.updated_at,
            COUNT(m.id) AS message_count
     FROM stories s
     LEFT JOIN messages m ON m.story_id = s.id
     WHERE s.user_id = $1
     GROUP BY s.id
     ORDER BY s.updated_at DESC`,
    [req.user.id],
  );
  res.json({ stories: result.rows });
});

// POST /stories — create a new story with a generated scenario
router.post("/", requireAuth, claudeLimiter, async (req, res) => {
  try {
    // Step 1: Generate scenario from random ingredients
    const { ingredients, scenario } = await generateScenario(null, req.user.id);

    // Step 2: Create story row with scenario data
    const storyResult = await query(
      `INSERT INTO stories (user_id, title, scenario, ingredients)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        req.user.id,
        scenario.title,
        JSON.stringify(scenario),
        JSON.stringify(ingredients),
      ],
    );
    const story = storyResult.rows[0];

    // Step 3: Generate opening using scenario-aware system prompt
    const systemPrompt = buildSystemPrompt(scenario);
    const introPrompt = buildIntroPrompt(scenario);

    let aiResponse;
    try {
      aiResponse = await trackAnthropicCall(
        anthropic,
        {
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: introPrompt }],
        },
        { operation: "generateStoryOpening", userId: req.user.id },
      );
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          operation: "generateStoryOpening",
          model: "claude-sonnet-4-6",
          storyId: story.id,
        },
      });
      throw err;
    }

    const rawContent = aiResponse.content[0].text;
    const status = parseMissionStatus(rawContent);
    const content = stripStatusToken(rawContent);

    // Step 4: Store the intro exchange
    await query(
      `INSERT INTO messages (story_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)`,
      [story.id, "user", introPrompt, "assistant", content],
    );

    // Step 5: Update status if somehow resolved immediately (edge case)
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
    });
  } catch (err) {
    console.error("create story error:", err);
    res.status(500).json({ error: "Failed to start story" });
  }
});

// GET /stories/:id — load a story with all messages (and world if linked)
router.get("/:id", requireAuth, async (req, res) => {
  const adminResult = await query(`SELECT is_admin FROM users WHERE id = $1`, [
    req.user.id,
  ]);
  const isAdmin = adminResult.rows[0]?.is_admin;

  const storyResult = isAdmin
    ? await query(`SELECT * FROM stories WHERE id = $1`, [req.params.id])
    : await query(`SELECT * FROM stories WHERE id = $1 AND user_id = $2`, [
      req.params.id,
      req.user.id,
    ]);

  if (!storyResult.rows[0]) {
    return res.status(404).json({ error: "Story not found" });
  }

  const story = storyResult.rows[0];

  // note - ordering by id as well as created_at to ensure consistent order even if multiple messages are created in the same second
  const messagesResult = await query(
    `SELECT role, content FROM messages WHERE story_id = $1 ORDER BY created_at ASC, id ASC`,
    [req.params.id],
  );

  const response = { story, messages: messagesResult.rows };

  // Include world state if this story belongs to a world
  if (story.world_id) {
    const worldResult = await query(
      `SELECT id, name, world_state FROM worlds WHERE id = $1`,
      [story.world_id],
    );
    if (worldResult.rows[0]) {
      response.world = worldResult.rows[0];
    }
  }

  res.json(response);
});

// DELETE /stories/:id
router.delete("/:id", requireAuth, async (req, res) => {
  await query(`DELETE FROM stories WHERE id = $1 AND user_id = $2`, [
    req.params.id,
    req.user.id,
  ]);
  res.json({ ok: true });
});

// ── Story continuation ────────────────────────────────────────────────────────

// POST /stories/:id/message — send a player choice, get next story beat
router.post("/:id/message", requireAuth, claudeLimiter, async (req, res) => {
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Message content required" });
  }
  if (content.length > 2000) {
    return res
      .status(400)
      .json({ error: "Message must be 2000 characters or fewer" });
  }

  const storyResult = await query(
    `SELECT * FROM stories WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id],
  );

  if (!storyResult.rows[0]) {
    return res.status(404).json({ error: "Story not found" });
  }

  const story = storyResult.rows[0];

  if (story.status !== "active") {
    return res.status(400).json({ error: "This mission has already ended" });
  }

  // note - ordering by id as well as created_at to ensure consistent order even if multiple messages are created in the same second
  const historyResult = await query(
    `SELECT role, content FROM messages WHERE story_id = $1 ORDER BY created_at ASC, id ASC`,
    [req.params.id],
  );

  // Load world state if story belongs to a world
  let worldState = null;
  if (story.world_id) {
    const worldResult = await query(
      `SELECT world_state FROM worlds WHERE id = $1`,
      [story.world_id],
    );
    worldState = worldResult.rows[0]?.world_state || null;
  }

  try {
    const systemPrompt = buildSystemPrompt(story.scenario, worldState);

    let aiResponse;
    try {
      aiResponse = await trackAnthropicCall(
        anthropic,
        {
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          cache_control: { type: "ephemeral" },
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [...historyResult.rows, { role: "user", content }],
        },
        { operation: "continueStory", userId: req.user.id },
      );
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          operation: "continueStory",
          model: "claude-sonnet-4-6",
          storyId: story.id,
          worldId: story.world_id,
          messageHistoryLength: historyResult.rows.length,
        },
      });
      throw err;
    }

    const rawReply = aiResponse.content[0].text;
    const status = parseMissionStatus(rawReply);
    const reply = stripStatusToken(rawReply);

    await query(
      `INSERT INTO messages (story_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)`,
      [req.params.id, "user", content, "assistant", reply],
    );

    await query(
      `UPDATE stories SET updated_at = NOW(), status = $1 WHERE id = $2`,
      [status, req.params.id],
    );

    // Fire background world state update when mission ends
    if (status !== "active" && story.world_id) {
      triggerWorldStateUpdate(req.params.id, story.world_id, req.user.id);
    }

    res.json({ reply, status });
  } catch (err) {
    console.error("message error:", err);
    res.status(500).json({ error: "Failed to continue story" });
  }
});

// POST /stories/:id/debug-objective — admin-only: ask the storyteller why the mission isn't complete
router.post(
  "/:id/debug-objective",
  requireAuth,
  claudeLimiter,
  async (req, res) => {
    const userResult = await query(`SELECT is_admin FROM users WHERE id = $1`, [
      req.user.id,
    ]);
    if (
      !userResult.rows[0]?.is_admin &&
      process.env.NODE_ENV === "production"
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const storyResult = await query(`SELECT * FROM stories WHERE id = $1`, [
      req.params.id,
    ]);

    if (!storyResult.rows[0]) {
      return res.status(404).json({ error: "Story not found" });
    }

    const story = storyResult.rows[0];
    const { messageCount } = req.body;

    const historyResult = await query(
      `SELECT role, content FROM (
       SELECT role, content, created_at, id FROM messages WHERE story_id = $1 ORDER BY created_at ASC, id ASC
       ${messageCount ? `LIMIT ${parseInt(messageCount, 10)}` : ""}
     ) sub`,
      [req.params.id],
    );

    let worldState = null;
    if (story.world_id) {
      const worldResult = await query(
        `SELECT world_state FROM worlds WHERE id = $1`,
        [story.world_id],
      );
      worldState = worldResult.rows[0]?.world_state || null;
    }

    try {
      const systemPrompt = buildSystemPrompt(story.scenario, worldState, true /* isAdmin */);

      const debugMessage =
        "You are the storyteller. The player believes the mission objective has been met at this point in the story. Explain in 2–3 sentences, from your perspective as the storyteller, why you had not yet output [MISSION_COMPLETE] at this point. What specifically still needed to happen for the objective to be satisfied?";

      let aiResponse;
      try {
        aiResponse = await trackAnthropicCall(
          anthropic,
          {
            model: "claude-sonnet-4-6",
            max_tokens: 300,
            system: systemPrompt,
            messages: [...historyResult.rows, { role: "user", content: debugMessage }],
          },
          { operation: "debugObjective", userId: req.user.id },
        );
      } catch (err) {
        Sentry.captureException(err, {
          extra: {
            operation: "debugObjective",
            model: "claude-sonnet-4-6",
            storyId: story.id,
            messageCount: historyResult.rows.length,
          },
        });
        throw err;
      }

      res.json({ explanation: aiResponse.content[0].text });
    } catch (err) {
      console.error("debug-objective error:", err);
      res.status(500).json({ error: "Failed to get debug explanation" });
    }
  },
);

export default router;
