#!/usr/bin/env node
// Test script: world state update after a completed mission.
// No database required. Calls the real Claude Haiku API.
//
// Usage:
//   ANTHROPIC_API_KEY=... node scripts/test-world-update.js
//   ANTHROPIC_API_KEY=... node scripts/test-world-update.js > /tmp/worldstate.json

import { seedWorldState, computeWorldStateUpdate } from "../src/worldState.js";

// ── Fixture data ──────────────────────────────────────────────────────────────

const FIXTURE_STORY = {
  id: 1,
  title: "Into the Husk",
  status: "failed",
};

// A realistic 6-exchange mission transcript.
// Crew boards a derelict. Reyes is injured. They meet a station engineer NPC.
// They encounter a rival vessel. Mission fails — crew had to retreat.
// Vantage relationship is strained.
const FIXTURE_TRANSCRIPT = `
STORY: The beacon has been pinging for eleven days. The Threshold drops out of FTL at 0400 and the derelict fills your forward view: a Shen-Wu survey hulk, hull designation SKSS-14, rotating slowly on a dead axis. No power signature. No heat. One of the docking rings has been sheared off — explosive decompression, old, weeks at least. Andic runs the initial scan from the pilot's chair and says nothing for a long moment. "Life support was running until maybe seventy-two hours ago," she says. "Someone was in there. Isn't now." Okafor is already pulling on his EVA suit. What do you do?

PLAYER: We suit up and take a boarding team over. Me, Okafor, and Reyes. Cross stays on the Threshold and monitors.

STORY: The derelict's interior is wrong in small ways before it's wrong in large ones. The emergency lighting flickers in a rhythm that doesn't match any standard diagnostic cycle. Half the interior doors have been manually sealed from the inside — bolt locks, not electronic. Okafor stops in what was once a laboratory and spends three minutes examining something on one of the workbenches that he doesn't describe out loud. You're in the main corridor heading aft when the groan comes through the hull — not structural, not environmental. Something deliberate. Reyes freezes. "That's not metal stress," he says. Then the deck plate beneath him gives. It's not a full collapse — a section bolted over an access shaft that someone unbolted from below. He drops two meters and hits the lower level hard, left leg taking the impact wrong. His voice on comms is controlled but tight: "I'm okay. I'm — ankle, I think. Maybe worse." What do you do?

PLAYER: I tell Reyes to stay put and not move the ankle. Okafor and I drop down to him. We need to assess the injury and figure out if he can move.

STORY: Okafor gets to Reyes first. The ankle is bad — swollen fast, possibly fractured, definitely not weight-bearing. You're getting Reyes stabilized when you hear movement from the aft section of the lower level. Not collapse-noise. Footsteps. A figure emerges from a secondary compartment — human, mid-fifties, wearing a Shen-Wu EVA suit with the helmet off and the faceplate cracked. She stops when she sees you. Her name tag reads VOSS, I. — which means nothing to you, but she reads your Vantage patches and the calculations happen visibly on her face. "You're not here to recover the data," she says. It's not a question. Her name is Irina Voss. She was SKSS-14's lead station engineer. She has been hiding in the lower decks for six days with emergency rations and a damaged suit, waiting for a signal she could trust. "I need to get off this ship," she says. "And I need you to understand what Shen-Wu was doing here before you decide what to do with what I tell you." What do you do?

PLAYER: I tell her we're getting her out. But I need to know what she knows before we start moving. Ask her what happened here.

STORY: Irina talks fast, like someone who has had six days to rehearse the conversation. The short version: SKSS-14 was not here for geological survey. They were here for signal intercept — specifically, a repeating transmission that Shen-Wu had been tracking for eight months, origin unknown, content unreadable. Three weeks ago, the signal changed. Started responding to their presence. The crew panicked. The captain made decisions Irina still won't describe directly, just says "he tried to make contact in a way that was not sanctioned and not wise." Whatever happened afterward, she survived it and the rest of the crew didn't. She has the full signal logs. She will share them with you. She will not hand them to Vantage without conditions. You're processing this when Cross's voice comes over comms, clipped and careful: "Cole. We have company. A Caelum vessel just dropped in, two thousand klicks out. They're hailing us. They know the SKSS-14 designation and they're asking if we have the station engineer." A pause. "They sound like they were expecting her." What do you do?

PLAYER: We need to move. Tell Cross to stall the Caelum hail. I'm getting everyone back to the Threshold — Reyes, Irina, Okafor. We can figure out the signal logs once we're clear.

STORY: Getting three people out of a crippled lower deck with one of them non-weight-bearing is not fast. Okafor improvises a brace from cargo strapping. Irina knows the layout better than you do and leads you to a secondary airlock that cuts ten minutes off the EVA route. Cross stalls the Caelum hail for eight minutes before they stop waiting for an answer and begin closing. By the time you're back on the Threshold and the docking collar is sealed, the Caelum ship is six hundred klicks out and accelerating. Andic has the drive warming. "We can jump in four minutes," she says. "They can intercept in three." Cross, still at comms: "They're being polite. Asking us to stand by for a 'coordinated asset transfer.' They know Voss is with us." Irina, in the medbay hatch, says quietly: "If they take me, the logs go with me. Caelum is not here to help." What do you do?

PLAYER: Jump. Now. We're not handing anyone over.

STORY: Andic doesn't argue. The jump is rough — early ignition, incomplete pre-calculation — and the Threshold comes out of FTL thirty light-minutes off the planned exit point, which is close enough. The Caelum ship doesn't follow, or if it does, it comes out somewhere else. Reyes is in the medbay with a confirmed fracture — Okafor says six weeks minimum before he's weight-bearing, and the jump didn't help. Irina Voss is sitting in the mess, drinking coffee with both hands wrapped around the mug, looking like someone who has recently stopped being certain she was going to die. The signal logs are on a Shen-Wu data chip she's been carrying in her suit's inner pocket for six days. She will give them to you. She will not give them to Vantage directly — not without guarantees she doesn't believe Vantage will honor. The mission parameters called for securing the SKSS-14 and any Shen-Wu data assets for Vantage. You have neither. What you have is a witness, a fractured navigator, and something that is either the most important recording in human history or a very good way to get everyone on this ship killed. Vantage is going to want a full debrief. You're not sure what you're going to tell them.

[MISSION_FAILED]
`;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const worldState = seedWorldState();

  console.error("[test] Calling Claude Haiku to update world state...");
  console.error(
    `[test] Story: "${FIXTURE_STORY.title}" (${FIXTURE_STORY.status})`,
  );
  console.error(`[test] Transcript length: ${FIXTURE_TRANSCRIPT.length} chars`);

  const updated = await computeWorldStateUpdate(
    worldState,
    FIXTURE_STORY,
    FIXTURE_TRANSCRIPT,
  );

  // Output the JSON to stdout (can be piped to a file)
  process.stdout.write(JSON.stringify(updated, null, 2) + "\n");

  // Summary to stderr so it doesn't pollute the JSON output
  console.error("\n[test] Done. Summary of changes:");
  console.error(`  mission_count: ${updated.mission_count}`);
  console.error(`  vantage_relationship: ${updated.vantage_relationship}`);
  console.error(
    `  characters: ${updated.characters?.length} (was ${worldState.characters.length})`,
  );
  console.error(`  events: ${updated.events?.length}`);
  const injured = updated.characters?.filter((c) => c.status !== "active");
  if (injured?.length) {
    console.error(
      `  non-active crew/npcs: ${injured.map((c) => `${c.name} [${c.status}]`).join(", ")}`,
    );
  }
}

main().catch((err) => {
  console.error("[test] Error:", err.message);
  process.exit(1);
});
