/**
 * One-off migration script to recompute world_state for worlds that are
 * missing fields added in recent updates (continuity_hook, lore_summaries,
 * restructured continuity_notes/descriptive_notes).
 *
 * For each world that needs updating, finds the most recent completed mission
 * and runs computeWorldStateUpdate against it — the same path that normally
 * fires when a mission ends.
 *
 * Safe to run multiple times — skips worlds that already have all fields.
 *
 * Usage:
 *   node src/db/migrate-world-state.js            # apply changes
 *   node src/db/migrate-world-state.js --dry-run   # preview only
 */

import { query } from "./client.js";
import pool from "./client.js";
import { computeWorldStateUpdate } from "../worldState.js";

const dryRun = process.argv.includes("--dry-run");

function needsMigration(ws) {
  if (!ws || typeof ws !== "object") return true;

  // Check top-level fields
  if (ws.continuity_hook === undefined) return true;
  if (ws.lore_summaries === undefined) return true;

  // Check character/vessel note structure
  for (const char of ws.characters || []) {
    if (!Array.isArray(char.continuity_notes)) return true;
    if (char.descriptive_notes === undefined) return true;
  }
  for (const vessel of ws.vessels || []) {
    if (!Array.isArray(vessel.continuity_notes)) return true;
    if (vessel.descriptive_notes === undefined) return true;
  }

  return false;
}

async function migrate() {
  console.log(dryRun ? "[DRY RUN] Previewing changes...\n" : "Applying migration...\n");

  const { rows: worlds } = await query("SELECT id, name, world_state FROM worlds ORDER BY id");

  if (worlds.length === 0) {
    console.log("No worlds found. Nothing to migrate.");
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;
  let noStoryCount = 0;

  for (const world of worlds) {
    const ws = world.world_state;

    if (!needsMigration(ws)) {
      console.log(`World #${world.id} "${world.name}": already up to date`);
      skippedCount++;
      continue;
    }

    // Find the most recent completed/failed mission for this world
    const { rows: stories } = await query(
      `SELECT id, title, status FROM stories
       WHERE world_id = $1 AND status IN ('complete', 'failed')
       ORDER BY updated_at DESC LIMIT 1`,
      [world.id],
    );

    if (stories.length === 0) {
      console.log(`World #${world.id} "${world.name}": needs migration but has no completed missions, skipping`);
      noStoryCount++;
      continue;
    }

    const story = stories[0];

    // Load the transcript for that mission
    const { rows: messages } = await query(
      `SELECT role, content FROM messages WHERE story_id = $1 ORDER BY created_at ASC, id ASC`,
      [story.id],
    );

    const transcript = messages
      .slice(1) // skip internal intro prompt
      .map((m) => `${m.role === "user" ? "PLAYER" : "STORY"}: ${m.content}`)
      .join("\n\n---\n\n");

    console.log(
      `World #${world.id} "${world.name}": recomputing from story #${story.id} "${story.title}"...`,
    );

    if (!dryRun) {
      const maxAttempts = 3;
      let success = false;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const updatedState = await computeWorldStateUpdate(ws, story, transcript);

          await query("UPDATE worlds SET world_state = $1, updated_at = NOW() WHERE id = $2", [
            JSON.stringify(updatedState),
            world.id,
          ]);

          console.log(`  ✓ updated successfully`);
          success = true;
          break;
        } catch (err) {
          console.error(`  ✗ attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
        }
      }
      if (!success) {
        console.error(`  ✗ giving up on world #${world.id} after ${maxAttempts} attempts`);
        continue;
      }
    }

    updatedCount++;
  }

  console.log(`\nResults:`);
  console.log(`  ${dryRun ? "Would update" : "Updated"}: ${updatedCount}`);
  console.log(`  Already current: ${skippedCount}`);
  if (noStoryCount > 0) {
    console.log(`  Skipped (no completed missions): ${noStoryCount}`);
  }
}

migrate()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
