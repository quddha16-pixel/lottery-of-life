export interface Adventure {
  title: string;
  nursery: string;
  goal: string;
  clue: string;
  resource: string;
  moments: [number, string][];
  stocks: [string, string][];
}
export const ADVENTURES: Record<string, Adventure> = {
  bumblebee: {
    title: "A meadow to discover",
    nursery:
      "Inside a warm nest cell, workers bring food from flowers. Your wings must develop before you can fly.",
    goal: "Bring a pollen load home",
    clue: "Flowers feed you. Pollen carried back feeds the next workers.",
    resource: "Flowers & nest stores",
    moments: [
      [4, "Hatching into a larva"],
      [14, "Changing inside the pupal cell"],
      [25, "Emerging as a winged worker"],
    ],
    stocks: [
      ["pollen", "Pollen load"],
      ["broodFood", "Brood food"],
      ["nectar", "Nest nectar"],
    ],
  },
  ant: {
    title: "A garden beneath your feet",
    nursery:
      "Workers care for the brood above a living fungus garden. Leaves become food through the fungus, not by being eaten directly.",
    goal: "Keep the colony garden growing",
    clue: "Gather leaves, tend fungus and carry waste away. Each job supports the next.",
    resource: "Fungus garden",
    moments: [
      [18, "Hatching into a larva"],
      [40, "Becoming a pupa"],
      [60, "Joining the workers"],
    ],
    stocks: [
      ["leafLoad", "Carried leaves"],
      ["substrate", "Leaf material"],
      ["fungus", "Garden food"],
      ["contamination", "Waste"],
    ],
  },
  rabbit: {
    title: "Beyond the warren",
    nursery:
      "You are a kit in a sheltered nest. Your mother visits to feed you; the warren keeps weather and many threats outside.",
    goal: "Graze, then digest under cover",
    clue: "A plant meal leaves nutrients to recover later. Your tunnels are worth protecting.",
    resource: "Warren & grazing",
    moments: [
      [6, "Familiar scents in the nest"],
      [28, "First independent grazing"],
    ],
    stocks: [
      ["fiber", "Digestive food"],
      ["burrow", "Warren cover"],
    ],
  },
  wolf: {
    title: "Find your place in the pack",
    nursery:
      "You are a den-bound pup. Family brings food and warmth; those same animals need meals and rest of their own.",
    goal: "Learn the den, then follow family",
    clue: "Trust and nearby companions matter. A shared hunt later feeds the pack and costs everyone energy.",
    resource: "Pack & prey",
    moments: [
      [6, "Learning familiar scents"],
      [21, "Following family outside the den"],
      [90, "A more independent juvenile"],
      [365, "Growing into cooperative hunts"],
    ],
    stocks: [["coordination", "Pack coordination"]],
  },
  elephant: {
    title: "Walk the remembered paths",
    nursery:
      "You are a calf among older relatives. Milk supplies fluids; an experienced family member can guide your first journey.",
    goal: "Learn a water route with family",
    clue: "Travel with a caregiver. Memories belong to real places and make later journeys easier.",
    resource: "Water & shade",
    moments: [
      [1, "A first escorted walk"],
      [6, "Learning from familiar relatives"],
      [30, "Joining family at the mud wallow"],
      [365, "Helping relatives uncover water"],
      [1095, "Growing more independent"],
    ],
    stocks: [
      ["mud", "Mud protection"],
      ["groundwater", "Groundwater"],
    ],
  },
  mallard: {
    title: "A small wake on a wide pond",
    nursery:
      "A duckling can swim and find small meals while staying near its brood. Swimming comes long before flight.",
    goal: "Dabble, preen and stay with the brood",
    clue: "Shallow food and cared-for feathers help you cope with wet weather.",
    resource: "Shallows & reeds",
    moments: [
      [60, "Flight feathers develop"],
      [365, "An adult on the wetland"],
    ],
    stocks: [
      ["plumage", "Feather condition"],
      ["nest", "Nest shelter"],
    ],
  },
  octopus: {
    title: "From open current to hidden den",
    nursery:
      "You drift as a tiny hatchling. Food is small and the water is open; a seabed den must wait until settlement.",
    goal: "Settle, find a crevice and blend in",
    clue: "A den protects a place. Camouflage fades as you move and never removes all danger.",
    resource: "Crevices & prey",
    moments: [
      [60, "Settling onto the seabed"],
      [240, "An adult among the rocks"],
    ],
    stocks: [
      ["camouflage", "Camouflage"],
      ["den", "Den cover"],
      ["brood", "Egg care"],
    ],
  },
  meerkat: {
    title: "Many eyes on the horizon",
    nursery:
      "You are a pup in the group burrow. Helpers can bring food, but their time and condition are limited.",
    goal: "Share feeding and lookout duties",
    clue: "A lookout misses a meal to warn companions. Helping pups builds your place in the group.",
    resource: "Group & digging ground",
    moments: [
      [6, "Noticing familiar helpers"],
      [60, "Joining the foraging group"],
    ],
    stocks: [
      ["vigilance", "Group warning"],
      ["help", "Helping"],
    ],
  },
  bullfrog: {
    title: "A life changed by water",
    nursery:
      "Jelly-covered eggs rest in pond water. A grazing tadpole comes next; dry banks are not a safe route for gills and a tail.",
    goal: "Graze in the pond, then meet metamorphosis",
    clue: "Pond water sustains young stages. Legs and lungs later change both food and movement.",
    resource: "Pond & reedy bank",
    moments: [
      [5, "Hatching as a tadpole"],
      [365, "Metamorphosis: legs and lungs"],
      [1095, "Reaching reproductive maturity"],
    ],
    stocks: [
      ["development", "Development"],
      ["skin", "Skin moisture"],
    ],
  },
  raccoon: {
    title: "Curiosity along the waterline",
    nursery:
      "You are a kit in a maternal tree den. Shelter and care come first; nimble searching develops as you grow.",
    goal: "Try fruit and shallow-water food",
    clue: "Fruit and aquatic prey are different supplies. Practice and remembered routes make a difference.",
    resource: "Fruit & shallows",
    moments: [
      [6, "Learning familiar den scents"],
      [70, "Independent searching"],
    ],
    stocks: [["dexterity", "Dexterity"]],
  },
  fox: {
    title: "A meal saved for another day",
    nursery:
      "You are a cub in a family earth. Parents provide food while you grow into the ears and movement needed for a hunt.",
    goal: "Hunt, hide surplus and remember it",
    clue: "A cache stays where you buried it. Time and other animals can take the stored food.",
    resource: "Prey & cache ground",
    moments: [
      [6, "Learning the family earth"],
      [60, "Beginning independent foraging"],
    ],
    stocks: [["parcel", "Carried food"]],
  },
  robin: {
    title: "A song and a sheltered night",
    nursery:
      "You are a nestling waiting for parental food. A fledgling will explore before its flight is fully ready.",
    goal: "Build reserves and choose a roost",
    clue: "Food reserves help a small bird through a cold night. Territory and shelter change feeding chances.",
    resource: "Feeding ground & roost",
    moments: [
      [6, "Familiar sounds around the nest"],
      [14, "Leaving as a fledgling"],
      [21, "Stronger flight"],
    ],
    stocks: [
      ["fat", "Night reserves"],
      ["territory", "Territory"],
    ],
  },
  seal: {
    title: "Between the shore and the sea",
    nursery:
      "You can swim beside your mother, but swimming does not replace milk. The haul-out is a place to rest and recover.",
    goal: "Nurse, then learn coastal foraging",
    clue: "After weaning, find food at sea and recover between diving bouts.",
    resource: "Haul-out & fishing bay",
    moments: [
      [28, "Weaning and independent feeding"],
      [1460, "Adult coastal life"],
    ],
    stocks: [["diveRecovery", "Dive recovery"]],
  },
};
