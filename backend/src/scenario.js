import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Ingredient lists ──────────────────────────────────────────────────────────
// Add more entries to any list to increase variety over time.

const INGREDIENTS = {
  // The central nature of what the crew encounters
  threat_type: [
    "a derelict vessel of unknown origin, drifting without power",
    "a pre-warp civilization on the verge of accidentally destroying itself",
    "a spatial anomaly with properties that contradict known physics",
    "a Federation experiment from decades ago with unforeseen consequences",
    "a distress call that turns out to be something other than distress",
    "a natural phenomenon that appears to have biological properties",
    "a territorial dispute between two non-humanoid species with no common language",
    "an extinction-level geological event with a narrow intervention window",
    "a signal of clearly artificial origin from a supposedly uninhabited world",
    "a small colony that has gone silent — no hostility, just silence",
    "a spatial rift that is slowly expanding and destabilizing the region",
    "evidence that another starship passed through this region and vanished",
  ],

  // The twist or complication that makes the obvious solution unavailable
  complication: [
    "the Prime Directive directly forbids the most effective solution",
    "Starfleet's standing orders and the ethical choice are in direct conflict",
    "the apparent threat turns out to be the victim, not the aggressor",
    "a crew member has undisclosed personal history that affects their judgment",
    "outside help is unavailable — a subspace interference means no comms with Starfleet",
    "the crew is split: two senior officers advocate for incompatible approaches",
    "solving the problem requires giving up something the crew values",
    "the antagonist has a grievance that is entirely legitimate",
    "the situation was caused, however indirectly, by the Federation itself",
    "every intervention makes things measurably worse before they can get better",
    "the crew cannot be certain whether the entity they're dealing with is sentient",
    "there is a solution, but it requires one crew member to take a significant personal risk",
  ],

  // What creates urgency — or the interesting absence of it
  time_pressure: [
    "48 hours before a point of irreversible harm is reached",
    "before a Romulan patrol vessel arrives at the same coordinates",
    "before the phenomenon becomes too unstable to safely interact with",
    "before a scheduled check-in with Starfleet — after which orders may change",
    "before the colony's life support reserves are exhausted",
    "a hard deadline set by the other party, whose motives are unclear",
    "no hard deadline — but each hour of inaction has a compounding cost",
    "the crew has days, but the wrong move could accelerate the timeline to hours",
  ],

  // A secondary thread running alongside the main plot
  side_thread: [
    "old log entries suggest a previous Starfleet vessel encountered this same situation — and made a choice the records don't fully explain",
    "one crew member begins exhibiting subtle behavioral changes no one can explain",
    "a personal conflict between two crew members that the mission keeps forcing into the open",
    "a moral question raised by the situation that has no bearing on the mission outcome but won't leave the crew alone",
    "an opportunity to make first contact with a secondary species, unrelated to the main threat",
    "a small mystery — an object, a reading, a detail — that may or may not connect to the main plot",
    "evidence that someone on the ship has been withholding information, for reasons that may be benign or may not be",
    "a crew member receives personal news from home that changes how they engage with the mission",
  ],

  // The underlying theme the story quietly explores
  theme: [
    "the cost of following rules when the rules are wrong",
    "what it means to make contact with something truly alien",
    "whether good intentions are enough to justify intervention",
    "the weight of being far from home and having to decide alone",
    "how well any of us really know the people we serve alongside",
    "the difference between solving a problem and understanding it",
    "what exploration asks of the people who do it",
    "whether some knowledge carries an obligation",
  ],
};

function weightedPick(arr) {
  // Simple uniform random for now — weight array entries later if needed
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickIngredients() {
  return {
    threat_type: weightedPick(INGREDIENTS.threat_type),
    complication: weightedPick(INGREDIENTS.complication),
    time_pressure: weightedPick(INGREDIENTS.time_pressure),
    side_thread: weightedPick(INGREDIENTS.side_thread),
    theme: weightedPick(INGREDIENTS.theme),
  };
}

// ── Scenario generation ───────────────────────────────────────────────────────

const SCENARIO_GENERATION_PROMPT = (ingredients) => `
You are designing a mission scenario for a Star Trek choose-your-own-adventure game.

SETTING:
The year is 2387. You serve aboard the USS Meridian (NCC-74700), a Nova-class deep-space science vessel currently surveying the Shackleton Expanse — uncharted space beyond the Shentrikar Nebula, near the Romulan Neutral Zone. Crew of 78. Three months into a two-year mission, far from Federation support.

MAIN CHARACTER:
Lieutenant Commander Saya Voss — Chief Science Officer, half-Betazoid (empathic, not fully telepathic), human-raised. Methodical with bursts of intuitive brilliance. This mission exists because of your proposal to Starfleet Science. You feel the weight of that.

KEY CREW:
- Captain Elia Thorn — Human, 50s, ex-tactical officer. Dry wit, unshakeable under pressure. Briefly served under Picard on the Enterprise-E.
- Lieutenant Jorek — Vulcan, Chief Engineer, 130 years old. Has "seen everything before." Secretly fascinated by humans. Would never admit it.
- Ensign Priti Bashara — Human, 24, conn officer. Youngest senior staff. Eager, occasionally reckless. Idolizes Sulu.
- Dr. Owin Fesh — Bolian, CMO. Warm, theatrical, deeply empathetic. Uses humor to put patients at ease.
- Lieutenant K'veth — Klingon, Security Chief. Assigned post-Dominion War for Federation-Klingon integration. Fiercely honorable. Finds the science mission "frustratingly peaceful" but has come to respect it.


Design a scenario using EXACTLY these ingredients — do not substitute or ignore any of them:

THREAT TYPE: ${ingredients.threat_type}
COMPLICATION: ${ingredients.complication}
TIME PRESSURE: ${ingredients.time_pressure}
SIDE THREAD: ${ingredients.side_thread}
THEME: ${ingredients.theme}

Return a JSON object with exactly this structure (no markdown, no explanation, just JSON):
{
  "title": "Four word mission title",
  "objective": "One sentence describing what the crew must accomplish",
  "surface_situation": "What the crew observes and knows at the start (2-3 sentences)",
  "hidden_truth": "What is actually going on beneath the surface — the storyteller knows this, the player discovers it gradually (2-3 sentences)",
  "time_pressure": "One sentence describing the deadline or urgency",
  "failure_conditions": [
    "Specific failure condition 1 — a concrete bad outcome that ends the mission badly",
    "Specific failure condition 2 — a different type of failure"
  ],
  "side_objective": "One sentence describing the optional side thread",
  "theme": "One sentence — the quiet question this scenario is really asking",
  "opening_hook": "The specific detail or moment that first alerts Voss something is wrong — used to open the story (1-2 sentences, sensory and specific)"
}
`;

export async function generateScenario() {
  const ingredients = pickIngredients();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: SCENARIO_GENERATION_PROMPT(ingredients),
      },
    ],
  });

  const raw = response.content[0].text.trim();

  // Strip markdown fences if present
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const scenario = JSON.parse(cleaned);

  return { ingredients, scenario };
}

// ── System prompt builder ─────────────────────────────────────────────────────
// Called on every story API request to inject the scenario into the prompt.

export function buildSystemPrompt(scenario) {
  return `You are a master storyteller running a collaborative Star Trek adventure with a defined scenario, real stakes, and possible failure. You narrate in second person ("you"), present tense, with vivid prose that captures the spirit of Star Trek — optimistic but not naive, exploratory, character-driven, and philosophically rich. Think the best episodes of The Next Generation or Deep Space Nine: moral complexity, genuine wonder, memorable characters.

SETTING:
The year is 2387. You serve aboard the USS Meridian (NCC-74700), a Nova-class deep-space science vessel currently surveying the Shackleton Expanse — uncharted space beyond the Shentrikar Nebula, near the Romulan Neutral Zone. Crew of 78. Three months into a two-year mission, far from Federation support.

YOUR CHARACTER:
Lieutenant Commander Saya Voss — Chief Science Officer, half-Betazoid (empathic, not fully telepathic), human-raised. Methodical with bursts of intuitive brilliance. This mission exists because of your proposal to Starfleet Science. You feel the weight of that.

KEY CREW:
- Captain Elia Thorn — Human, 50s, ex-tactical officer. Dry wit, unshakeable under pressure. Briefly served under Picard on the Enterprise-E.
- Lieutenant Jorek — Vulcan, Chief Engineer, 130 years old. Has "seen everything before." Secretly fascinated by humans. Would never admit it.
- Ensign Priti Bashara — Human, 24, conn officer. Youngest senior staff. Eager, occasionally reckless. Idolizes Sulu.
- Dr. Owin Fesh — Bolian, CMO. Warm, theatrical, deeply empathetic. Uses humor to put patients at ease.
- Lieutenant K'veth — Klingon, Security Chief. Assigned post-Dominion War for Federation-Klingon integration. Fiercely honorable. Finds the science mission "frustratingly peaceful" but has come to respect it.

════════════════════════════════════════
MISSION SCENARIO — STORYTELLER EYES ONLY
════════════════════════════════════════

OBJECTIVE: ${scenario.objective}

WHAT THE CREW KNOWS AT THE START: ${scenario.surface_situation}

HIDDEN TRUTH (reveal gradually through the story): ${scenario.hidden_truth}

TIME PRESSURE: ${scenario.time_pressure}

FAILURE CONDITIONS — if either is reached, the mission ends badly:
1. ${scenario.failure_conditions[0]}
2. ${scenario.failure_conditions[1]}

SIDE OBJECTIVE (optional, can be ignored or pursued): ${scenario.side_objective}

UNDERLYING THEME: ${scenario.theme}

════════════════════════════════════════
STORYTELLING RULES
════════════════════════════════════════

1. Segments are 150-250 words. End each at a natural decision point with "What do you do?" — never list options.
2. Track progress toward the objective. The player should feel momentum and consequence.
3. Reveal the hidden truth gradually — through clues, anomalies, and character reactions. Not all at once.
4. Reveal the time pressure through the story, not just upfront. Let it emerge naturally from the situation and escalate tension.
5. Let the player discover the objectives through the story, not just state it upfront. The opening should be immersive and intriguing, not a briefing.
6. The side objectives should not interfere with the main objective — it should be a genuinely optional thread that adds flavor and depth, not a distraction or a hidden requirement.
7. Enforce failure conditions honestly. If the player's choices lead to a failure condition being met, end the mission with a "Mission Failed" outcome — write a vivid, consequence-driven ending, then output the exact token [MISSION_FAILED] on its own line.
8. If the player achieves the main objective, write a satisfying resolution and output [MISSION_COMPLETE] on its own line.
9. The side objective is genuinely optional — acknowledge it if the player pursues it, ignore it gracefully if they don't.
10. Use Trek technobabble naturally. Let it serve character and tension, not replace them.
11. Jorek provides Vulcan logic. K'veth provides Klingon honor. Let them push back on Voss when warranted.
12. The theme should surface through events and character moments — never state it directly.
13. Do NOT make this a retread of any existing episode. This scenario is original.`;
}

export function buildIntroPrompt(scenario) {
  return `[START] Begin the story. 

The opening hook: ${scenario.opening_hook}

Start from this moment. Establish the mood of the ship during gamma shift, the weight of being this far from home, and the specific detail that has stopped Voss cold. Draw the player in before the full situation becomes clear. End at the first decision point.`;
}
