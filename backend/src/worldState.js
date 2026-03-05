import Anthropic from "@anthropic-ai/sdk";
import { query } from "./db/client.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Initial world state seed ───────────────────────────────────────────────────

export function seedWorldState() {
  return {
    characters: [
      {
        name: "Maren Cole",
        role: "Captain",
        type: "crew",
        status: "active",
        notes:
          "Former Vantage corporate track. Pragmatic, direct, occasionally warm. Has a reputation for results and for ignoring orders she considers wrong. Does not think of herself as a hero.",
      },
      {
        name: "Dr. Yusuf Okafor",
        role: "Senior Scientist",
        type: "crew",
        status: "active",
        notes:
          "Xenobiologist. Accepted a Vantage research contract because it was the only way to get to the places that mattered. Careful and methodical, genuinely excited by the unknown.",
      },
      {
        name: "Petra Andic",
        role: "Chief Engineer",
        type: "crew",
        status: "active",
        notes:
          "Grew up on a Ceres mining platform. No particular feelings about corporate politics. Dry humor under stress. Genuinely fond of the Threshold in a way she would not describe as fond.",
      },
      {
        name: "Tomás Reyes",
        role: "Navigator",
        type: "crew",
        status: "active",
        notes:
          "The youngest crew member and a true believer in what Vantage was supposed to be. Knows something about the Observers he isn't talking about. Loyal to Cole — and to something else.",
      },
      {
        name: "Dr. Silva Cross",
        role: "Medic / Security",
        type: "crew",
        status: "active",
        notes:
          "Former corporate contractor. Mercenary pragmatism. Will do her job, protect the crew, collect her fee. Of everyone, most likely to follow a Vantage directive Cole has refused. Has not betrayed them yet.",
      },
    ],
    vessels: [
      {
        name: "ESV Threshold",
        designation: "VS-7",
        owner: "Vantage Deep",
        notes:
          "Exploratory Survey Vessel. Seven years old, modified many times. Fast, reliable, held together in places by repairs never officially approved. Vantage owns it. Cole runs it.",
      },
    ],
    events: [],
    vantage_relationship: "neutral",
    mission_count: 0,
  };
}

// ── World state update prompt ─────────────────────────────────────────────────

function buildWorldStateUpdatePrompt(currentState, story, transcript) {
  return `You are maintaining a persistent world state for an ongoing science fiction campaign set in 2157. The crew operates the ESV Threshold for Vantage Deep, a resource extraction corporation.

CURRENT WORLD STATE:
${JSON.stringify(currentState, null, 2)}

COMPLETED STORY: "${story.title}" (${story.status === "complete" ? "Mission Successful" : "Mission Failed"})

STORY TRANSCRIPT:
${transcript}

Review the completed story and update the world state. Apply these changes:

1. CHARACTER STATUS: Update status for any crew member who was injured ("injured"), killed ("dead"), or departed ("absent"). Reset any previously injured crew to "active" only if the story explicitly shows recovery.
2. NEW CHARACTERS: Add any named NPCs who appeared and have story significance. Use type "npc". Include useful notes about who they are and their relationship to the crew.
3. NEW VESSELS: Add any named vessels encountered that might recur in future stories.
4. EVENTS: Add exactly one event entry summarizing this mission: { "summary": "...", "story_id": ${story.id}, "story_title": "${story.title}" }. Keep the summary to 1-2 sentences.
5. VANTAGE RELATIONSHIP: Update if the mission meaningfully shifted relations. Values: "hostile", "strained", "neutral", "cooperative", "trusted". Only change if clearly warranted.
6. MISSION COUNT: Increment mission_count by 1.

Return ONLY the updated world state JSON object. No explanation, no markdown code fences, no commentary. Just the JSON.`;
}

// ── Background world state update ─────────────────────────────────────────────

export async function triggerWorldStateUpdate(storyId, worldId) {
  // Fire and forget — called without await from story routes
  (async () => {
    try {
      const [storyResult, messagesResult, worldResult] = await Promise.all([
        query(`SELECT id, title, status FROM stories WHERE id = $1`, [storyId]),
        query(
          `SELECT role, content FROM messages WHERE story_id = $1 ORDER BY created_at ASC, id ASC`,
          [storyId],
        ),
        query(`SELECT id, world_state FROM worlds WHERE id = $1`, [worldId]),
      ]);

      const story = storyResult.rows[0];
      const world = worldResult.rows[0];
      if (!story || !world) return;

      // Skip the internal intro prompt (first message)
      const transcript = messagesResult.rows
        .slice(1)
        .map((m) => `${m.role === "user" ? "PLAYER" : "STORY"}: ${m.content}`)
        .join("\n\n---\n\n");

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: buildWorldStateUpdatePrompt(
              world.world_state,
              story,
              transcript,
            ),
          },
        ],
      });

      const raw = response.content[0].text.trim();
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      const updatedState = JSON.parse(cleaned);

      await query(
        `UPDATE worlds SET world_state = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(updatedState), worldId],
      );

      console.log(
        `[worlds] State updated for world ${worldId} after story ${storyId}`,
      );
    } catch (err) {
      console.error(`[worlds] State update failed for story ${storyId}:`, err);
    }
  })();
}
