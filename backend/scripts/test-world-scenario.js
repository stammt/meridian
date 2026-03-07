#!/usr/bin/env node
// Test script: world-aware scenario generation + storyteller opening beat.
// No database required. Calls the real Claude Sonnet API.
//
// Usage:
//   ANTHROPIC_API_KEY=... node scripts/test-world-scenario.js
//   ANTHROPIC_API_KEY=... node scripts/test-world-scenario.js /tmp/worldstate.json

import { readFileSync } from "fs";
import Anthropic from "@anthropic-ai/sdk";
import {
  generateScenario,
  buildSystemPrompt,
  buildIntroPrompt,
} from "../src/scenario.js";
import { seedWorldState } from "../src/worldState.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Default fixture world state (post-mission, matches test-world-update output) ──

function buildFixtureWorldState() {
  const base = seedWorldState();
  return {
    ...base,
    characters: [
      ...base.characters.map((c) =>
        c.name === "Tomás Reyes"
          ? {
              ...c,
              status: "injured",
              notes:
                c.notes +
                " Currently recovering from a fractured ankle sustained during the Into the Husk mission.",
            }
          : c,
      ),
      {
        name: "Irina Voss",
        role: "Station Engineer (former Shen-Wu)",
        type: "npc",
        status: "active",
        notes:
          "Survivor of the SKSS-14 incident. Sole witness to whatever Shen-Wu attempted with the unknown signal. Has signal logs she refuses to give directly to Vantage. Cautious, pragmatic, deeply shaken.",
      },
    ],
    vessels: [
      ...base.vessels,
      {
        name: "SKSS-14",
        designation: "Shen-Wu Survey Hulk",
        owner: "Shen-Wu Collective",
        notes:
          "Derelict, encountered during the Into the Husk mission. Entire crew lost under unclear circumstances related to unauthorized contact attempt with an anomalous signal.",
      },
    ],
    events: [
      {
        summary:
          "The Threshold boarded a derelict Shen-Wu hulk and extracted the sole survivor, station engineer Irina Voss, but failed to secure the site or deliver Voss and her signal logs to Vantage as ordered.",
        story_id: 1,
        story_title: "Into the Husk",
      },
    ],
    vantage_relationship: "strained",
    mission_count: 1,
  };
}

// ── Load world state ──────────────────────────────────────────────────────────

function loadWorldState() {
  const arg = process.argv[2];
  if (arg) {
    try {
      const raw = readFileSync(arg, "utf8");
      const parsed = JSON.parse(raw);
      console.error(`[test] Loaded world state from ${arg}`);
      return parsed;
    } catch (err) {
      console.error(`[test] Failed to read ${arg}: ${err.message}`);
      process.exit(1);
    }
  }
  console.error(
    "[test] No world state file provided — using built-in post-mission fixture",
  );
  return buildFixtureWorldState();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const worldState = loadWorldState();

  // ── 1. Generate scenario ──────────────────────────────────────────────────
  console.error("\n[test] Generating scenario with Claude Sonnet...");
  const { ingredients, scenario } = await generateScenario(worldState);

  console.log("\n" + "=".repeat(60));
  console.log("SCENARIO INGREDIENTS");
  console.log("=".repeat(60));
  Object.entries(ingredients).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log("\n" + "=".repeat(60));
  console.log("GENERATED SCENARIO");
  console.log("=".repeat(60));
  console.log(JSON.stringify(scenario, null, 2));

  // ── 2. Print the full system prompt ──────────────────────────────────────
  const systemPrompt = buildSystemPrompt(scenario, worldState);

  console.log("\n" + "=".repeat(60));
  console.log("SYSTEM PROMPT (what the storyteller receives)");
  console.log("=".repeat(60));
  console.log(systemPrompt);

  // ── 3. Fire the intro prompt and print the opening story beat ────────────
  const introPrompt = buildIntroPrompt(scenario);

  console.log("\n" + "=".repeat(60));
  console.log("INTRO PROMPT");
  console.log("=".repeat(60));
  console.log(introPrompt);

  console.error("\n[test] Calling Claude Sonnet for opening story beat...");
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: "user", content: introPrompt }],
  });

  console.log("\n" + "=".repeat(60));
  console.log("OPENING STORY BEAT");
  console.log("=".repeat(60));
  console.log(response.content[0].text);

  console.error("\n[test] Done.");
}

main().catch((err) => {
  console.error("[test] Error:", err.message);
  process.exit(1);
});
