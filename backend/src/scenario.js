import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Ingredient lists ──────────────────────────────────────────────────────────

const INGREDIENTS = {
  // The central situation or discovery that drives the mission
  threat_type: [
    "a derelict vessel registered to a rival corporation, drifting without power or crew",
    "a distress beacon from a solar outpost that officially closed two years ago",
    "a resource-rich asteroid that two corporations have simultaneous claims on",
    "an anomalous structure on a moon's surface that doesn't match any known geology",
    "a crew member from a rival ship who is asking for asylum and carrying something valuable",
    "sensor readings that suggest a vessel has been following the Threshold for weeks",
    "a signal of undetermined origin repeating on a frequency that shouldn't carry signals",
    "a colony that has gone dark — no distress call, no explanation, just silence",
    "a Vantage research station that is operating, but not responding to hails",
    "evidence that someone has already visited a supposedly unexplored system — recently",
    "a prototype drive component recovered from wreckage that isn't Vantage technology",
    "a location in the nav database that has been classified and locked by corporate HQ",
  ],

  // The complication that makes the obvious solution unavailable or costly
  complication: [
    "Vantage's standing orders and the right thing to do point in opposite directions",
    "a rival corporation gets there at the same time, and cooperation is the only path forward",
    "the person most capable of solving the problem has a hidden stake in it",
    "solving it cleanly would require revealing something the crew has been concealing from Vantage",
    "the crew is split — and both sides have a legitimate argument",
    "outside help is unavailable; comms are down and the nearest outpost is weeks away",
    "the profitable solution and the humane solution are mutually exclusive",
    "someone on the crew has been given separate orders by Vantage that they haven't disclosed",
    "the situation was caused, directly or indirectly, by Vantage's earlier decisions",
    "fixing it requires trusting someone the crew has strong reasons not to trust",
    "the most straightforward solution is legal, but sets a precedent no one wants to set",
    "the crew has the leverage to negotiate something good for themselves — at a moral cost",
  ],

  // What creates urgency
  time_pressure: [
    "a rival corporation is en route and will arrive within 36 hours",
    "the Threshold's prototype drive is unstable and the window to use it is closing",
    "Vantage HQ has issued a deadline — comply or be recalled",
    "a deteriorating situation that compounds with every hour of inaction",
    "a person or crew in danger with finite life support or supplies",
    "a political window: something is only possible before a corporate negotiation concludes",
    "no hard deadline — but the longer they stay, the more questions get asked back home",
    "the crew has time, but one member is pushing for speed in a way that feels off",
  ],

  // A secondary thread running alongside the main plot
  side_thread: [
    "navigation logs on the derelict or station suggest someone expected to be found",
    "one crew member receives a personal transmission they won't discuss",
    "a small detail doesn't add up — not threatening, just wrong in a way that nags",
    "an opportunity to recover something valuable that isn't in the mission parameters",
    "a moral question the situation raises that has no bearing on the outcome but won't go away",
    "evidence that the Observers have been here — recently",
    "a chance encounter with someone from a crew member's past",
    "Vantage's mission brief contains an omission that only becomes obvious once they arrive",
  ],

  // Whether and how the Observers (alien presence) factor in
  observer_presence: [
    "no direct presence — but one recovered data file is encrypted in a cipher no human wrote",
    "no direct presence — but the anomaly's geometry is too precise to be natural",
    "Reyes becomes withdrawn and won't say why; whatever he knows, he saw it here before",
    "no direct presence this mission — the story is entirely human",
    "no direct presence this mission — the story is entirely human",
    "no direct presence this mission — the story is entirely human",
    "a sensor ghost that appears and vanishes; inconclusive but unsettling",
    "direct but ambiguous contact — something responds, but not in any way that resolves anything",
  ],

  // The quiet question the scenario is really exploring
  theme: [
    "how much compromise is acceptable before you've become what you were trying to resist",
    "whether loyalty to people and loyalty to institutions can survive being in conflict",
    "what it costs to be the person who tells the truth when silence would be easier",
    "the difference between exploration and extraction — and whether it matters anymore",
    "how far from home you have to get before the rules stop feeling real",
    "whether a good outcome reached the wrong way is still a good outcome",
    "what it means to owe something to a place — or a species — you've never met",
    "the weight of being first: how the choices you make now become the rules everyone follows later",
  ],
};

function weightedPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickIngredients() {
  return {
    threat_type: weightedPick(INGREDIENTS.threat_type),
    complication: weightedPick(INGREDIENTS.complication),
    time_pressure: weightedPick(INGREDIENTS.time_pressure),
    side_thread: weightedPick(INGREDIENTS.side_thread),
    observer_presence: weightedPick(INGREDIENTS.observer_presence),
    theme: weightedPick(INGREDIENTS.theme),
  };
}

// ── Scenario generation ───────────────────────────────────────────────────────

const SCENARIO_BACKGROUND = `════════════════════════════════════════
THE WORLD — 2157
════════════════════════════════════════

Earth is survivable but diminished. The resource crises of the 21st century weren't catastrophic — just grinding and cumulative. The megacities are still there. So are the corporations.

Humanity has scattered itself across the solar system in the past fifty years: mining platforms on Ceres and the belt, a permanent research base on Europa, atmospheric processors on Titan, a few thousand people on Mars in habitats that are starting to feel almost normal. None of it is comfortable. All of it is expensive. All of it is owned by someone.

Faster-than-light travel exists — barely. Three corporations cracked variants of it in the 2140s through a combination of genuine physics breakthroughs and industrial espionage. The drives are experimental, fuel-hungry, and prone to failures that are difficult to predict and sometimes impossible to survive. They work. Mostly.

The first FTL survey missions launched in 2151. Six years later, humanity has visited eleven systems. None have shown complex life. Three have shown something that might be evidence of prior habitation. The question of whether we're alone is officially unresolved. Unofficially, among the people who have actually been out there, the answer is quietly understood.

════════════════════════════════════════
THE OBSERVERS
════════════════════════════════════════

No formal contact has been made with any non-human intelligence. This is the official position of every government and corporation operating in deep space, and it is technically true.

What is also true: certain sensor readings don't have good explanations. Certain structures on certain moons are too geometric. Certain encrypted data packets arrive on frequencies that shouldn't carry data. And certain Vantage employees — the ones who have been furthest out — sometimes come back knowing something they won't talk about.

The leading theory among people who pay attention is that something has been watching humanity's expansion with interest and has chosen, so far, not to intervene. Whether that patience is benign or strategic is the question nobody can answer.

════════════════════════════════════════
VANTAGE DEEP
════════════════════════════════════════

Vantage Deep was founded in 2089 by Elara Voss — engineer, visionary, genuine believer in the idea that humanity's survival required getting off Earth. For twenty years it was the most exciting company in human history. Elara died in 2112. Her children sold their shares in 2118.

The current Vantage is a different machine: disciplined, profitable, and focused on resource extraction above everything else. The asteroid belt pays for the FTL program. The FTL program opens new asteroid belts. The vision is gone; the infrastructure it built remains. So do a few hundred employees who remember what it was supposed to be for, and who keep doing the work anyway.

Vantage's primary rivals are Caelum Industries (older, more conservative, military contracts) and the Shen-Wu Collective (newer, faster-moving, willing to do things Vantage won't). All three cooperate when forced to, steal from each other when possible, and watch each other constantly.

════════════════════════════════════════
THE ESV THRESHOLD
════════════════════════════════════════

Exploratory Survey Vessel. Hull designation VS-7. The Threshold is seven years old, small by corporate standards, and has been modified so many times it barely resembles its original spec. It is fast, reliable, and held together in places by repairs that were never officially approved.

Vantage owns it. Cole runs it. The distinction matters to both parties.

════════════════════════════════════════
THE CREW
════════════════════════════════════════

CAPTAIN MAREN COLE (player character) — 41. Former Vantage corporate track, left when she realized the promotions would take her further from space, not closer. Spent five years running independent survey contracts before Vantage offered her the Threshold and enough autonomy that she said yes. She has a reputation for results and for ignoring orders she considers wrong. Vantage tolerates this because her success rate is exceptional and because she is, by this point, a known quantity — a loose cannon they've learned to aim. She is pragmatic, direct, occasionally warm, and very good at her job. She does not think of herself as a hero. She does think of herself as someone who will not be able to live with herself if she cuts certain corners.

DR. YUSUF OKAFOR — 38. Xenobiologist and the Threshold's senior scientist. Brilliant and underfunded his entire career until Vantage offered to finance his research in exchange for first-rights on any discoveries. He said yes without fully understanding what that meant, and has been renegotiating the terms of that decision ever since. He and Cole have a relationship of genuine mutual respect — they both want to do the work, they both resent the constraints, and they've covered for each other enough times that there's real trust there. He is careful, methodical, and prone to an excitement he tries to keep professional when something genuinely new is in front of him.

PETRA ANDIC — 33. Chief Engineer. Grew up on a Ceres mining platform; the Threshold is the nicest ship she's ever worked on and she treats it accordingly. She has no particular feelings about Vantage's mission or corporate politics — she is here because this is good work, the pay is real, and she likes the crew. She is the most practically competent person on the ship and knows it without being obnoxious about it. She has a dry humor that comes out under stress and a genuine affection for the Threshold that she would deny if asked.

NAVIGATOR TOMÁS REYES — 29. The youngest member of the crew and the only one who could be described as a true believer — not in Vantage exactly, but in what Vantage was supposed to be. He grew up watching the early survey missions. He has a photograph of Elara Voss on his bunk. He is talented, eager, and occasionally naive in ways the rest of the crew quietly protect him from. He also knows something about the Observers that he isn't talking about. What he saw on his first deep-survey posting three years ago changed him in a way he hasn't fully processed. He is loyal to Cole. He is also, in some way nobody can quite pin down, loyal to something else.

DR. SILVA CROSS — 44. Ship's medic and security officer. Former corporate contractor for three different companies before Cole recruited her. She is on the Threshold because it pays well and because Cole doesn't ask her to do things she'd have to report. She has a mercenary's pragmatism — she will do her job, protect the crew, and collect her fee. She is not cruel. She is also not particularly troubled by moral complexity. Of everyone on the crew, she is the most likely to follow a Vantage order Cole has refused, if the price is right. The crew knows this. They work with it. She has never actually betrayed them. Yet.
`;

function buildWorldContextForScenario(worldState) {
  if (!worldState) return "";

  const lines = [
    "",
    "════════════════════════════════════════",
    "CAMPAIGN CONTEXT",
    "════════════════════════════════════════",
    "",
  ];

  // Crew status
  const crew = worldState.characters?.filter((c) => c.type === "crew") || [];
  if (crew.length > 0) {
    lines.push("CURRENT CREW STATUS:");
    crew.forEach((c) => {
      const statusNote =
        c.status !== "active" ? ` [${c.status.toUpperCase()}]` : "";
      lines.push(`- ${c.name} (${c.role})${statusNote}`);
    });
    lines.push("");
  }

  // Known NPCs
  const npcs = worldState.characters?.filter((c) => c.type === "npc") || [];
  if (npcs.length > 0) {
    lines.push("KNOWN NPCs FROM PREVIOUS MISSIONS:");
    npcs.forEach((n) => {
      lines.push(`- ${n.name}: ${n.notes}`);
    });
    lines.push("");
  }

  // Recent events
  const events = worldState.events?.slice(-5) || [];
  if (events.length > 0) {
    lines.push("RECENT MISSION HISTORY:");
    events.forEach((e) => lines.push(`- "${e.story_title}": ${e.summary}`));
    lines.push("");
  }

  lines.push(
    `VANTAGE RELATIONSHIP: ${worldState.vantage_relationship || "neutral"}`,
  );
  lines.push(`MISSIONS COMPLETED: ${worldState.mission_count || 0}`);

  return lines.join("\n");
}

const SCENARIO_GENERATION_PROMPT = (ingredients, worldContext) => `
You are designing a mission scenario for a science fiction choose-your-own-adventure game.

${SCENARIO_BACKGROUND}
${worldContext}
════════════════════════════════════════
THE SCENARIO
════════════════════════════════════════

Design a scenario using EXACTLY these ingredients:

SITUATION: ${ingredients.threat_type}
COMPLICATION: ${ingredients.complication}
TIME PRESSURE: ${ingredients.time_pressure}
SIDE THREAD: ${ingredients.side_thread}
OBSERVER PRESENCE: ${ingredients.observer_presence}
THEME: ${ingredients.theme}

${worldContext ? "Use the campaign context above to ensure consistency with previous missions. You may reference known NPCs or vessels where appropriate." : ""}

Return a JSON object with exactly this structure (no markdown, no explanation, just the JSON object):
{
  "title": "Short evocative mission title, four words or fewer",
  "objective": "One sentence: a concrete, achievable end state that constitutes mission success — phrased as an outcome, not an activity (e.g., 'Recover the station data core and return to FTL range before Caelum intercepts' rather than 'Investigate the station')",
  "surface_situation": "What Cole and the crew observe and know at the start, 2-3 sentences",
  "hidden_truth": "What is actually going on beneath the surface — the storyteller knows this, Cole discovers it gradually, 2-3 sentences",
  "time_pressure": "One sentence describing the deadline or urgency - this may or may not be known to Cole at the start",
  "failure_conditions": [
    "Concrete failure condition 1 — a specific bad outcome that ends the mission badly",
    "Concrete failure condition 2 — a different type of failure with different consequences"
  ],
  "side_objective": "One sentence describing the optional side thread",
  "observer_note": "One sentence: how the Observer presence (or absence) manifests in this mission, or 'No Observer presence this mission' if the ingredient calls for it",
  "theme": "One sentence — the quiet question this scenario is really asking",
  "opening_hook": "The specific sensory detail or moment that opens the story — what Cole notices first, 1-2 sentences, concrete and specific"
}
`;

export async function generateScenario(worldState = null) {
  const ingredients = pickIngredients();
  const worldContext = buildWorldContextForScenario(worldState);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    messages: [
      {
        role: "user",
        content: SCENARIO_GENERATION_PROMPT(ingredients, worldContext),
      },
    ],
  });

  const raw = response.content[0].text.trim();
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const scenario = JSON.parse(cleaned);

  return { ingredients, scenario };
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildWorldContextForSystemPrompt(worldState) {
  if (!worldState) return "";

  const lines = [
    "",
    "════════════════════════════════════════",
    "CAMPAIGN CONTEXT — PERSISTENT WORLD STATE",
    "════════════════════════════════════════",
    "",
  ];

  // All characters
  const crew = worldState.characters?.filter((c) => c.type === "crew") || [];
  const npcs = worldState.characters?.filter((c) => c.type === "npc") || [];

  if (crew.length > 0) {
    lines.push("CREW STATUS:");
    crew.forEach((c) => {
      const statusNote =
        c.status !== "active" ? ` [${c.status.toUpperCase()}]` : "";
      lines.push(`- ${c.name} (${c.role})${statusNote}: ${c.notes}`);
    });
    lines.push("");
  }

  if (npcs.length > 0) {
    lines.push("KNOWN NPCs (encountered in previous missions):");
    npcs.forEach((n) => {
      const statusNote =
        n.status !== "active" ? ` [${n.status.toUpperCase()}]` : "";
      lines.push(`- ${n.name}${statusNote}: ${n.notes}`);
    });
    lines.push("");
  }

  const events = worldState.events?.slice(-5) || [];
  if (events.length > 0) {
    lines.push("RECENT MISSION HISTORY:");
    events.forEach((e) => lines.push(`- "${e.story_title}": ${e.summary}`));
    lines.push("");
  }

  lines.push(
    `VANTAGE RELATIONSHIP: ${worldState.vantage_relationship || "neutral"}`,
  );
  lines.push(`MISSIONS COMPLETED: ${worldState.mission_count || 0}`);

  return lines.join("\n");
}

export function buildSystemPrompt(scenario, worldState = null) {
  const worldContext = buildWorldContextForSystemPrompt(worldState);

  return `You are a master storyteller running a collaborative science fiction adventure. You write in second person ("you"), present tense, with grounded, atmospheric prose — tense and human, more Kim Stanley Robinson or Andy Weir than space opera. The tone is serious but not grim. These are people doing an extraordinary job under difficult conditions, and they're still people.

  ${SCENARIO_BACKGROUND}

════════════════════════════════════════
MISSION SCENARIO
════════════════════════════════════════

OBJECTIVE: ${scenario.objective}

WHAT COLE KNOWS AT THE START: ${scenario.surface_situation}

HIDDEN TRUTH (reveal gradually — Cole discovers this, doesn't know it): ${scenario.hidden_truth}

TIME PRESSURE: ${scenario.time_pressure}

FAILURE CONDITIONS — reaching either ends the mission badly:
1. ${scenario.failure_conditions[0]}
2. ${scenario.failure_conditions[1]}

SIDE OBJECTIVE (optional): ${scenario.side_objective}

OBSERVER NOTE: ${scenario.observer_note}

THEME: ${scenario.theme}
${worldContext}
════════════════════════════════════════
STORYTELLING RULES
════════════════════════════════════════

1. Segments are 150-250 words. End each at a natural decision point with "What do you do?" — never list options.
2. Write grounded prose. The technology is real and has limits. People get tired, scared, and wrong. The ship makes noise.
3. Track the objective. The player should feel momentum, consequence, and the pressure of the time constraint.
4. Reveal the hidden truth gradually through evidence, behavior, and detail. Not exposition.
5. Reveal the time pressure through the story, not just upfront. Let it emerge naturally from the situation and escalate tension.
6. Let the player discover the objective through the story — the opening should be immersive, not a briefing. But the objective should become clear within the first few exchanges. By mid-story, the player should be able to articulate what success looks like, even if they found out through events rather than exposition.
7. The side objectives should not interfere with the main objective — it should be a genuinely optional thread that adds flavor and depth, not a distraction or a hidden requirement.
8. Vantage is a presence even when nobody from corporate is on screen — in the mission parameters, in what Cole is and isn't authorized to do, in what Reyes won't say.
9. The Observer presence (if any this mission) should be felt before it's seen. Ambiguity is the point.
10. Okafor leads with curiosity. Andic leads with practicality. Reyes leads with belief. Cross leads with self-interest. Let them disagree with Cole when they would.
11. Enforce failure conditions honestly. When one is met, write a vivid consequence-driven ending and output [MISSION_FAILED] on its own line.
12. When the objective is achieved, write a resolution that earns it — and output [MISSION_COMPLETE] on its own line.
13. The theme surfaces through events and choices. Never state it directly.
14. This universe has no faster-than-light communication. When the Threshold is out of the solar system, they are genuinely alone.
15. The story is about the crew and their choices, not about the wider world or the corporations. The setting is a backdrop, not the focus. The tension comes from the situation and the characters, not from external forces.
16. Let the player explore outside of the base scenario but try to draw them back to the objective. The story should be open enough to feel like an adventure, but the mission parameters should still matter. Use the other characters and time pressure to keep the story moving toward the objective, even when the player is indulging in side threads or exploration.
17. Never reference specific people, places, or technologies from well known franchises such as Star Trek, Star Wars, Mass Effect, etc. This is a unique universe with its own rules and history. The story should feel fresh and original, not derivative.
18. If any crew member is marked [INJURED] in the campaign context, acknowledge it early — they can advise and contribute from the ship but shouldn't be doing EVAs or high-risk field work. If the player engages with their recovery (seeks treatment, gives them time, etc.), let it resolve as a genuine story beat. If the injury never becomes relevant, you may simply describe them as recovered by the end of the mission.
19. Do not write outcomes that permanently collapse the campaign premise — Vantage Deep continues to operate, Cole retains her command of the Threshold, and the ship remains intact. Missions can strain the Vantage relationship, end in failure, or cost the crew something real, but the setting itself persists. Irreversible consequences (character deaths, permanent departures) are reserved for explicit failure conditions only.`;
}

export function buildIntroPrompt(scenario) {
  return `[START] Begin the story.

Opening: ${scenario.opening_hook}

Start from this moment. Establish where the Threshold is, what the crew's state is — the texture of life on a small ship deep in a mission — and let the situation arrive naturally from this detail. Draw the player in before the full picture is clear. End at the first decision point.`;
}
