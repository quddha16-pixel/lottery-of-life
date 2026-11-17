import { urgentNeed } from "./outcomes";
import { SPECIES_RULES } from "../data/species-rules";
import { speciesById } from "../data/species";
import { describeSituation } from "./world";
import { dependent, locationNow, type Interaction } from "./wildlife";
import type { GameState } from "./types";
// Presentation only: no random draws, mutations, eligibility changes or simulation shortcuts.
export function situationText(s: GameState) {
  const urgent = urgentNeed(s);
  if (urgent) return urgent;
  if (s.narration === "detailed") return describeSituation(s);
  const a = s.family[s.currentId!];
  const need =
    a.stats.injury > 15
      ? "You are hurt. Rest and shelter can help."
      : a.stats.hunger > 65
        ? "You are hungry. Look for a safe chance to eat."
        : a.stats.hydration < 30
          ? "You need water soon."
          : a.stats.energy < 35
            ? "You are tired. A safe rest would help."
            : dependent(s)
              ? "You still need care while you grow."
              : "You have time to choose your next step.";
  const weather =
    s.world!.precipitation > 15
      ? "Heavy rain is falling."
      : s.world!.precipitation > 3
        ? "Rain is falling."
        : s.environment!.temperature > 30
          ? "The air is warm."
          : "The weather is calm.";
  return `${weather} ${need}`;
}
export function eventText(text: string, mode: GameState["narration"]) {
  if (mode === "detailed") return text;
  return text
    .replace(/[^.!?]*: a successful feeding opportunity\./g, "You find food.")
    .replaceAll("provisioning", "food from caregivers")
    .replaceAll("Provisioning", "Food from caregivers")
    .replaceAll("hydration", "water needs")
    .replaceAll("cohort", "group of young")
    .replaceAll("substrate", "plant material")
    .replaceAll("persistent", "lasting")
    .replaceAll("metabolism", "daily needs")
    .replaceAll("senescence", "decline with age")
    .replaceAll("Predation / conflict", "Predator or rival encounter");
}
export function interactionText(s: GameState, option: Interaction) {
  if (s.narration === "detailed") return option;
  const simple: Partial<Record<Interaction["id"], [string, string]>> = {
    nurse: [option.title, "Your caregiver may share food."],
    "stay-close": [option.title, "Stay together and build trust."],
    "follow-group": [
      option.title,
      "Go together. Travel takes time and energy.",
    ],
    rest: [
      locationNow(s).kind === "shade" ? "Rest in the shade" : "Rest here",
      "Recover energy. You will still get hungry.",
    ],
    shelter: ["Take cover", "Find shelter and let injuries heal."],
    drink: ["Drink water", "Use the water here. Stay alert for other animals."],
    explore: [
      "Look around",
      "Learn this place and look for signs of other animals.",
    ],
    evade: ["Stay hidden", "Use energy to stay out of sight."],
    groom: [option.title, "Spend time together and build trust."],
    "cut-leaves": [
      "Gather leaves for the colony",
      "Leaves help grow the fungus that ants eat.",
    ],
    "tend-garden": [
      "Care for the fungus garden",
      "Help grow the colony’s food. This takes energy.",
    ],
    "mark-boundary": [
      "Check the territory edge",
      "Learn this place. Other wolves may live here.",
    ],
    "track-prey": [
      "Follow the deer tracks",
      "Try to find a meal. A hunt may fail.",
    ],
    care: ["Care for your young", "Share food and help protect them."],
    wait: [
      "Grow in the nursery",
      "You cannot explore yet. Your body is still developing.",
    ],
  };
  if (option.id === "feed")
    return {
      ...option,
      title: dependent(s)
        ? "Wait for food"
        : s.family[s.currentId!].speciesId === "wolf"
          ? "Look for food with the pack"
          : "Look for food",
      detail:
        "A meal depends on the food available here. Searching uses energy.",
    };
  const words = simple[option.id];
  return words ? { ...option, title: words[0], detail: words[1] } : option;
}
export function discoveries(s: GameState) {
  const a = s.family[s.currentId!],
    sp = speciesById(a.speciesId);
  return [
    {
      topic: "Biology",
      fact: `${sp.name} (${sp.scientific}) belongs to ${sp.group.toLowerCase()}. ${SPECIES_RULES[sp.id].discovery} ${sp.note}`,
    },
    {
      topic: "Habitat",
      fact: `${s.environment!.location.habitat}. ${sp.challenge}`,
    },
    { topic: "Diet", fact: `${sp.diet}. ${sp.feeding}` },
    {
      topic: "Development",
      fact: `Life stages: ${sp.stages.map((x) => x.name).join(" → ")}. Young animals gain abilities as their bodies develop.`,
    },
    {
      topic: "Predators & safety",
      fact: `Known threats include ${sp.predators.join(", ")}. ${sp.mortality.join(", ")} can also affect survival.`,
    },
    { topic: "Social life", fact: `${sp.social} ${sp.reproduction}` },
    {
      topic: "Geography",
      fact: `${sp.range} This life begins in ${s.environment!.location.region}, ${s.environment!.location.continent}.`,
    },
    {
      topic: "Historical world",
      fact: `${s.environment!.history?.epoch ?? "Recorded world"}. ${s.environment!.history?.description ?? ""} The birthplace is a broad regional reconstruction. Local sites and neighboring animals are simulated, not historical observations.`,
    },
  ];
}
export function deathExplanation(cause: string) {
  if (cause === "Pond drying")
    return "The pond lost too much water for this aquatic young animal to survive.";
  if (cause === "Fungal garden failure")
    return "The colony’s fungus garden could no longer supply enough food.";
  if (cause === "Life abandoned")
    return "This life was ended by the player. No Coins were earned.";
  if (cause.includes("Starvation"))
    return "There was not enough food to keep this animal alive.";
  if (cause.includes("Dehydration"))
    return "There was not enough water to keep this animal alive.";
  if (cause.includes("Exposure"))
    return "The temperature became too difficult for this animal to survive.";
  if (cause.includes("Predation") || cause.includes("conflict"))
    return "An encounter with a predator or rival ended this life.";
  if (cause.includes("Injury"))
    return "The animal could not recover from its injuries.";
  if (cause.includes("Age") || cause.includes("senescence"))
    return "The animal’s body declined with age or its natural breeding cycle.";
  return "The animal’s health declined until it could no longer survive.";
}
