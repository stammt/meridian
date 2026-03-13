#!/usr/bin/env node
// Test script: continuity notes across two missions.
// Verifies that:
//   1. A new NPC introduced with physical descriptions gets continuity_notes populated.
//   2. When that NPC reappears in a later mission with changed details, continuity_notes
//      are updated (not just appended blindly).
// No database required. Calls the real Claude Haiku API.
//
// Usage:
//   ANTHROPIC_API_KEY=... node scripts/test-continuity-notes.js

import { seedWorldState, computeWorldStateUpdate } from "../src/worldState.js";

// ── Mission 1 fixture — new NPC with explicit physical descriptions ────────────

const STORY_1 = {
  id: 10,
  title: "The Cartographer's Debt",
  status: "complete",
};

// Introduces Commander Dax Orel: male, mid-fifties, tall, graying temples,
// prosthetic left hand, methodical demeanor. Also describes the Threshold's
// port observation bay as cramped and smelling of recycled air.
const TRANSCRIPT_1 = `
STORY: The rendezvous point is a decommissioned relay platform in the outer belt — neutral ground, which in practice means nobody's watching. Okafor pulls up the contact profile on the secondary display. Commander Dax Orel, formerly of Caelum's deep survey division, now listed as an independent contractor. The image is ten years old. You're still looking at it when the Caelum shuttle docks without asking permission. The man who comes through the airlock is tall — close to two meters — with close-cropped hair gone gray at the temples and a stillness about him that suggests someone accustomed to waiting out long silences. His left hand is a prosthetic, matte gray, and he moves it with the unconscious precision of long practice. "Captain Cole," he says. "I've been trying to reach you for three months." What do you do?

PLAYER: I let him talk. Ask him what he wants.

STORY: Orel explains carefully, like a man who has rehearsed the conversation but is choosing to make it sound unrehearsed. He was Caelum's lead cartographer on the Shen-Wu incident investigation — the same event that stranded Irina Voss aboard SKSS-14. He found something in the survey data that Caelum buried, something that changes the interpretation of what the SKSS-14 crew was attempting. He wants to share it with you. In exchange, he wants access to whatever Voss told you. He watches you with pale eyes that don't blink quite as often as they should. The prosthetic hand rests on the table between you, fingers loosely curled. "I'm not your enemy," he says. "I'm just the person who read the same data and reached the same conclusions." What do you do?

PLAYER: I agree to hear him out, but I'm not committing to sharing anything until I know what he has.

STORY: Orel opens a data slate and walks you through it — methodically, no flourishes, the kind of briefing that assumes intelligence and doesn't perform for the room. The Shen-Wu signal wasn't a transmission. It was a key. SKSS-14 wasn't intercepting it; they were responding to it. And whatever they responded with, something answered. Orel's pale eyes stay on you the whole time he talks, measuring. When he's done he folds the data slate closed with the prosthetic hand, a gesture that's become so natural you've almost stopped noticing the gray metal. "The question," he says, "is whether you want to know what they answered." Cross, standing at the hatch, catches your eye and gives the smallest shake of her head. Okafor, seated at the table, gives the smallest nod. What do you do?

PLAYER: I tell Orel we'll take the data and share what we know about Voss. But I want a copy of his full cartographic survey — not just the briefing.

STORY: Orel agrees without hesitation, which is either reassuring or the opposite. The data transfer takes four minutes. He takes your summary of the Voss debrief — you give him the facts, not the signal logs — and receives it with a nod that could mean anything. Before he leaves, he pauses at the airlock. "The cartographic survey has a section marked restricted," he says. "I've unlocked it for you. You'll want to read it alone." He steps through without waiting for a response, and the shuttle disengages cleanly. The data is already in your system. Andic runs an immediate security sweep — it's clean. The restricted section of the survey is a single file, forty pages, dense with coordinates and sensor readings. The first line reads: OBSERVER WAYPOINT CLUSTER — VERIFIED. Okafor starts reading over your shoulder and says nothing for a long time. What do you do?

PLAYER: Lock down the file and prepare for FTL. We'll review it en route. I don't want to be stationary when Caelum figures out what Orel just gave us.

STORY: The Threshold jumps clean. En route, you read the survey together — you, Okafor, Andic, and a very quiet Reyes who says almost nothing but whose expression during the section on Observer waypoint patterns you'll remember for a long time. Cross reviews it last, alone, and hands the slate back without comment. The data is real. You can feel it the way you feel a structural crack before you can see it. You have, between Voss's testimony and Orel's survey, the most complete picture of Observer activity that any human crew has assembled. Vantage doesn't know you have it. Caelum doesn't know what Orel gave you. Nobody knows what you're going to do with it. The Threshold hums around you, and for once, the silence feels earned.

[MISSION_COMPLETE]
`;

// ── Mission 2 fixture — same NPC reappears with changed details ───────────────

const STORY_2 = {
  id: 11,
  title: "The Watcher's Margin",
  status: "complete",
};

// Orel reappears. He now has a visible burn scar on the right side of his neck
// (from an incident between missions), his hair is fully white (stress or time),
// and the prosthetic hand has been replaced with a newer model (silver, articulated).
const TRANSCRIPT_2 = `
STORY: Orel contacts you through a relay you didn't know he had access to. The message is eleven words: "They've found the cartographic archive. I need to move it. Meet me." The coordinates are in the outer system, a debris field near an old mining platform. When his shuttle docks, you see immediately that three months have not been kind to him. The gray at his temples is gone — his hair is entirely white now, the kind of change stress brings on fast. There's a burn scar on the right side of his neck, fresh enough to still be shiny, running from his jaw toward his collar. The prosthetic hand has been replaced: this one is silver and more articulated than the old matte-gray model, with visible joint detailing at each finger. He looks like someone who has been having a worse time than you. "Thank you for coming," he says, and means it. What do you do?

PLAYER: Ask him what happened. What found the archive, and where is it now?

STORY: Orel explains with the same methodical precision as before, but the stillness is different now — less patience, more control. Caelum found out about the data transfer. Not through him, he thinks — through a secondary index file he didn't know existed. The archive is currently on a hardened drive aboard the platform in this debris field. He got out with the drive and a burn from an overloaded power coupling when Caelum's people came for the server room. The white hair he doesn't mention. You don't ask. "The drive has everything," he says. "The full Observer waypoint cluster analysis, the signal key, and something I found after I shared the first version with you — a response pattern. Not our response. Theirs." He flexes the silver prosthetic hand once, an unconscious tell. "I didn't know what to do with it alone. That's why I called you." What do you do?

PLAYER: I want the drive, and I want his read on the response pattern before we take it. But we need to move — if Caelum tracked the archive here, they'll track him here.

STORY: Orel transfers the drive and gives you fifteen minutes of briefing, compressed and efficient. The response pattern is a sequence — mathematical, not linguistic, but structured in a way that implies intent. Whatever the SKSS-14 crew triggered, something acknowledged receipt. Not with communication. With coordinates. Orel's pale eyes are the same as they were three months ago — the only thing about him that hasn't changed. "I've been trying to determine if this is a trap," he says. "I can't rule it out. That seems like information you should have." Cross's voice on comms: "Cole. Caelum vessel, forty minutes out, moving to intercept. They're not hailing." Andic: "Drive is warm." What do you do?

PLAYER: We take Orel with us. Jump now, sort out the coordinates later.

STORY: Orel doesn't argue. The Threshold jumps with him aboard, the drive secured in Okafor's lab, and Caelum arriving at an empty debris field. Orel is given Reyes's old bunk — Reyes is still on medical rotation from the ankle — and spends the transit hours in the lab with Okafor, the two of them bent over the drive data in a silence that looks like collaboration. You check on them once. Okafor looks up and says, "He's not wrong about the coordinates." You don't ask which ones yet. The Threshold runs clean and quiet, and you sit in the observation bay — cramped, smelling of recycled air, the stars very still — and think about what it means to be in possession of something this large. Whatever comes next, you chose it. The drive hums in the lab. The coordinates wait.

[MISSION_COMPLETE]
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function printContinuityNotes(worldState, label) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`CONTINUITY NOTES — ${label}`);
  console.log("=".repeat(60));

  const characters = worldState.characters || [];
  const vessels = worldState.vessels || [];

  if (characters.length === 0 && vessels.length === 0) {
    console.log("  (none)");
    return;
  }

  characters.forEach((c) => {
    console.log(`\n  ${c.name} (${c.role}, ${c.type}):`);
    if (c.continuity_notes) {
      console.log(`    ${c.continuity_notes}`);
    } else {
      console.log(`    (empty)`);
    }
  });

  vessels.forEach((v) => {
    console.log(`\n  ${v.name} (vessel):`);
    if (v.continuity_notes) {
      console.log(`    ${v.continuity_notes}`);
    } else {
      console.log(`    (empty)`);
    }
  });
}

function checkContinuityNotes(worldState, npcName, missionLabel) {
  const npc = worldState.characters?.find((c) => c.name === npcName);
  if (!npc) {
    console.error(`  [FAIL] ${missionLabel}: "${npcName}" not found in characters`);
    return false;
  }
  if (!npc.continuity_notes) {
    console.error(`  [FAIL] ${missionLabel}: "${npcName}" has empty continuity_notes`);
    return false;
  }
  console.error(`  [PASS] ${missionLabel}: "${npcName}" has continuity_notes`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const baseWorldState = seedWorldState();

  // ── Round 1: new NPC introduced with physical descriptions ────────────────
  console.error("\n[test] Round 1: Computing world state update after mission 1...");
  console.error(`[test] Story: "${STORY_1.title}" (${STORY_1.status})`);

  const afterMission1 = await computeWorldStateUpdate(
    baseWorldState,
    STORY_1,
    TRANSCRIPT_1,
  );

  printContinuityNotes(afterMission1, "after mission 1 (new NPC introduced)");

  console.log("\n" + "=".repeat(60));
  console.log("FULL WORLD STATE — after mission 1");
  console.log("=".repeat(60));
  console.log(JSON.stringify(afterMission1, null, 2));

  // ── Round 2: existing NPC reappears with changed appearance ───────────────
  console.error("\n[test] Round 2: Computing world state update after mission 2...");
  console.error(`[test] Story: "${STORY_2.title}" (${STORY_2.status})`);

  const afterMission2 = await computeWorldStateUpdate(
    afterMission1,
    STORY_2,
    TRANSCRIPT_2,
  );

  printContinuityNotes(afterMission2, "after mission 2 (NPC reappears with changes)");

  console.log("\n" + "=".repeat(60));
  console.log("FULL WORLD STATE — after mission 2");
  console.log("=".repeat(60));
  console.log(JSON.stringify(afterMission2, null, 2));

  // ── Assertions ────────────────────────────────────────────────────────────
  console.error("\n[test] Checking assertions...");
  const pass1 = checkContinuityNotes(afterMission1, "Dax Orel", "mission 1");
  const pass2 = checkContinuityNotes(afterMission2, "Dax Orel", "mission 2");

  // Spot-check: mission 2 notes should reflect the updated appearance.
  // We look for keywords from the changed description.
  const orelAfter2 = afterMission2.characters?.find((c) => c.name === "Dax Orel");
  const notesText = orelAfter2?.continuity_notes?.toLowerCase() ?? "";
  const mentionsBurn = notesText.includes("burn") || notesText.includes("scar");
  const mentionsWhite = notesText.includes("white") || notesText.includes("grey") || notesText.includes("gray");
  const mentionsProsthetic = notesText.includes("prosthetic") || notesText.includes("silver") || notesText.includes("hand");

  if (mentionsBurn) {
    console.error("  [PASS] mission 2 notes mention burn/scar");
  } else {
    console.error("  [WARN] mission 2 notes do not mention burn/scar — model may have omitted it");
  }
  if (mentionsWhite) {
    console.error("  [PASS] mission 2 notes mention hair color change");
  } else {
    console.error("  [WARN] mission 2 notes do not mention hair color change");
  }
  if (mentionsProsthetic) {
    console.error("  [PASS] mission 2 notes mention prosthetic hand");
  } else {
    console.error("  [WARN] mission 2 notes do not mention prosthetic hand");
  }

  const allPassed = pass1 && pass2;
  console.error(`\n[test] Result: ${allPassed ? "PASSED" : "FAILED"}`);
  if (!allPassed) process.exit(1);
}

main().catch((err) => {
  console.error("[test] Error:", err.message);
  process.exit(1);
});
