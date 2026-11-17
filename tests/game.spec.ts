import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  abandonLife,
  act,
  current,
  createGame,
  startLife,
  PACK,
  advanceDays,
} from "../src/game/engine";
import { SPECIES } from "../src/data/species";
import { SAVE_KEY, serialize } from "../src/game/storage";

// In-process static hosting of the real production bundle, including Pages subpath.
// No app server or external network is needed; JS executes normally in Chromium.
test.beforeEach(async ({ context }) => {
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "lottery-of-life.test") return route.abort();
    const relative =
      decodeURIComponent(url.pathname).replace(/^\/lottery-of-life\//, "") ||
      "index.html";
    const file = path.resolve("dist", relative);
    if (!file.startsWith(path.resolve("dist") + path.sep))
      return route.fulfill({ status: 403 });
    const contentType: Record<string, string> = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".jpg": "image/jpeg",
      ".woff2": "font/woff2",
      ".woff": "font/woff",
    };
    try {
      await route.fulfill({
        body: await readFile(file),
        contentType:
          contentType[path.extname(file)] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404, body: "Not found" });
    }
  });
});
async function begin(
  page: import("@playwright/test").Page,
  species = "Gray wolf",
  loadMenu = true,
) {
  if (loadMenu) await page.goto("./");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/overview-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "New Life", exact: true }).click();
  await page
    .getByRole("button", { name: "Choose species", exact: true })
    .click();
  await page.getByLabel("Unlocked species").selectOption({ label: species });
  await page
    .getByText("World seed & historical scope", { exact: true })
    .click();
  await page.getByRole("textbox", { name: "World seed" }).fill("browser-check");
  await page
    .getByRole("button", { name: "Reveal species", exact: true })
    .click();
  await expect(
    page.getByRole("main", { name: "Birth sequence" }),
  ).toBeVisible();
  await expect(page.getByText("BIRTHPLACE", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Reveal birthplace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reveal birth date", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reveal circumstances", exact: true })
    .click();
  await page.getByRole("button", { name: "Begin Life", exact: true }).click();
  await expect(page.getByRole("main", { name: "Active life" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lottery of Life", exact: true }),
  ).toHaveCount(0);
}
test("draws a valid life, resolves phases, and preserves the individual on reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await begin(page);
  await page.screenshot({
    path: `test-results/active-first-screen-${test.info().project.name}.png`,
    animations: "disabled",
  });
  await expect(page.getByLabel("Animal identity")).toContainText("Pup");
  await expect(
    page.getByRole("button", { name: /Hunt with the pack/ }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: /Seek food from your mother/ })
    .click();
  await expect(
    page.getByLabel("Day phases").locator('[aria-current="step"]'),
  ).toContainText("Afternoon");
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.phase).toBe(1);
  await page.reload();
  await expect(page.getByRole("main", { name: "Active life" })).toBeVisible();
  await expect(
    page.getByLabel("Day phases").locator('[aria-current="step"]'),
  ).toContainText("Afternoon");
  await page
    .getByRole("navigation", { name: "Gameplay navigation" })
    .getByRole("button", { name: "More", exact: true })
    .click();
  await page.getByRole("button", { name: "Next day", exact: false }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "phases resolved" }),
  ).toContainText("3 phases resolved");
  await expect(page.getByLabel("Animal identity")).toContainText("1 day");
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/daily-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("all screens work on touch and desktop without horizontal overflow", async ({
  page,
}) => {
  await page.goto("./");
  for (const label of [
    "Species",
    "Field packs",
    "Bloodline",
    "Journal",
    "Your life",
    "Overview",
  ]) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: label, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Species", exact: true })
    .click();
  await expect(page.locator(".species-card")).toHaveCount(13);
  await page
    .getByRole("button", { name: /African savanna elephant.*View field guide/ })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Begin a life as this species" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close field guide" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/collection-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("earned currency opens real packs and persists the result", async ({
  page,
}) => {
  const s = createGame("test-pack");
  s.coins = PACK.cost;
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: serialize(s) },
  );
  await page.goto("./");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Field packs", exact: true })
    .click();
  await page.getByRole("button", { name: /Open pack/ }).click();
  await expect(
    page.getByText("NEW SPECIES UNLOCKED", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Open pack/ })).toBeDisabled();
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(save.coins).toBe(0);
  expect(save.unlocked).toHaveLength(11);
  expect(save.lastPack.duplicate).toBe(false);
});
test("permanent death exposes a lifetime record and blocks continuing the dead animal", async ({
  page,
}) => {
  let s = startLife(createGame(), {
    speciesId: "rabbit",
    year: 1900,
    seed: "dying",
  });
  current(s)!.ageDays = 200;
  current(s)!.stats.health = 0;
  current(s)!.stats.hunger = 100;
  s = act(s, "rest");
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: serialize(s) },
  );
  await page.goto("./");
  await page
    .getByRole("button", {
      name: "Lifetime Records",
      exact: false,
    })
    .click();
  await expect(page.getByText("Starvation", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Your life", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "This life has ended." }),
  ).toBeVisible();
});
test("corrupt saves are preserved until an explicit reset, and reset requires confirmation", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "unreadable original"),
    SAVE_KEY,
  );
  await page.goto("./");
  await expect(page.getByRole("status")).toContainText("Autosave is paused");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
  ).toBe("unreadable original");
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  if (await settings.isVisible()) await settings.click();
  else
    await page
      .getByRole("button", { name: "Settings & saves", exact: true })
      .click();
  await page.getByRole("button", { name: "Reset this device’s save" }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
  ).toBe("unreadable original");
  await page.getByRole("button", { name: "Reset this device’s save" }).click();
  await page
    .getByRole("button", { name: "Delete all local progress", exact: true })
    .click();
  const fresh = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(fresh.unlocked).toHaveLength(10);
  expect(fresh.coins).toBe(0);
});
test("validated imports restore save state and exports produce a JSON file", async ({
  page,
}) => {
  await page.goto("./");
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  if (await settings.isVisible()) await settings.click();
  else
    await page
      .getByRole("button", { name: "Settings & saves", exact: true })
      .click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Export save as JSON", exact: false })
      .click(),
  ]);
  expect(download.suggestedFilename()).toBe("lottery-of-life-save.json");
  const s = abandonLife(
    startLife(createGame(), {
      speciesId: "bumblebee",
      year: 1980,
      seed: "imported",
    }),
  );
  s.coins = 127;
  await page
    .getByRole("textbox", { name: "Or paste save JSON" })
    .fill(serialize(s));
  await page
    .getByRole("button", { name: "Validate & import", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Import backup", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "127 Coins, open field packs" }),
  ).toBeVisible();
});

test("a surviving offspring takes over at its real age without resetting the world", async ({
  page,
}) => {
  let s = startLife(createGame(), {
    speciesId: "rabbit",
    year: 1980,
    seed: "test-101",
  });
  const parent = current(s)!;
  parent.ageDays = 150;
  parent.pregnantUntil = 151;
  parent.pendingOffspring = 4;
  s.phase = 3;
  s = act(s, "feed");
  s = advanceDays(s, 7).state;
  const childId = current(s)!.children.find((id) => s.family[id].alive)!;
  const child = s.family[childId],
    beforeDate = s.date;
  current(s)!.stats.health = 0;
  current(s)!.stats.hunger = 100;
  s = act(s, "rest");
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: serialize(s) },
  );
  await page.goto("./");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Bloodline", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Continue as ${child.name}`, exact: false })
    .first()
    .click();
  await expect(page.getByLabel("Animal identity")).toBeVisible();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.currentId).toBe(childId);
  expect(saved.date).toEqual(beforeDate);
  expect(saved.family[saved.currentId].generation).toBe(2);
  expect(saved.family[s.currentId!].alive).toBe(false);
});

test("immersive gameplay starts at the animal and actions, and returning to the menu preserves the life", async ({
  page,
}) => {
  await begin(page);
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await expect(page.locator(".hero")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Animal identity" }),
  ).toBeVisible();
  const firstAction = await page.locator(".game-action").first().boundingBox();
  expect(firstAction!.y).toBeLessThan(page.viewportSize()!.height);
  expect(firstAction!.y + firstAction!.height).toBeLessThan(
    page.viewportSize()!.height,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  await page
    .getByRole("button", { name: "Save & Main Menu", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lottery of Life", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Created by Quentin Warminsky", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("main", { name: "Active life" })).toBeVisible();
  await page
    .getByRole("button", { name: "Save & Main Menu", exact: false })
    .click();
  await page.getByRole("button", { name: "New Life", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A life is already unfolding." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue Life", exact: true })
    .click();
  const resumed = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(resumed).toEqual(saved);
});

test("routine pacing, living-world drawers and touch navigation remain functional", async ({
  page,
}) => {
  await begin(page);
  await page
    .getByRole("navigation", { name: "Gameplay navigation" })
    .getByRole("button", { name: "More", exact: true })
    .click();
  await page.getByLabel("Your pace").selectOption("story");
  await page
    .getByRole("navigation", { name: "Gameplay navigation" })
    .getByRole("button", { name: "Life", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Advance routine care", exact: false })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "phases resolved" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Gameplay navigation" })
    .getByRole("button", { name: "Explore", exact: true })
    .click();
  await page.getByText("Local world", { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Continuing situations" }),
  ).toBeVisible();
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(save.world.elapsedDays).toBeGreaterThan(0);
  expect(save.pacing).toBe("story");
  await page
    .getByRole("navigation", { name: "Gameplay navigation" })
    .getByRole("button", { name: "Journal", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open historical records", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Return to Life", exact: true })
    .click();
  await expect(page.getByRole("main", { name: "Active life" })).toBeVisible();
});

async function fixture(
  page: import("@playwright/test").Page,
  s: ReturnType<typeof createGame>,
) {
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    { key: SAVE_KEY, value: serialize(s) },
  );
  await page.goto("./#life");
  await expect(page.getByRole("main", { name: "Active life" })).toBeVisible();
}
const gameNav = (page: import("@playwright/test").Page, name: string) =>
  page
    .getByRole("navigation", { name: "Gameplay navigation" })
    .getByRole("button", { name, exact: true });

test("elephant calf explores with family, persists location and relationships, and uses functional navigation", async ({
  page,
}) => {
  const s = startLife(createGame(), {
    speciesId: "elephant",
    year: 2020,
    seed: "elephant-rpg",
  });
  current(s)!.ageDays = 1;
  current(s)!.stats.energy = 100;
  await fixture(page, s);
  await expect(page.getByRole("figure")).toHaveAccessibleName(
    /Morning at Herd gathering area/,
  );
  await gameNav(page, "Explore").click();
  await page
    .getByRole("button", { name: /Watering hole/, exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: /Follow family/ }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /Follow family/ }).click();
  await expect(page.getByRole("figure")).toHaveAccessibleName(
    /Afternoon at Watering hole/,
  );
  const before = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(before.world.activePatch).toBe("water");
  expect(
    before.area.animals.find((n: { role: string }) => n.role === "mother")
      .location,
  ).toBe("water");
  await page.reload();
  await expect(page.getByRole("figure")).toHaveAccessibleName(/Watering hole/);
  await gameNav(page, "Social").click();
  await expect(page.getByRole("heading", { name: /Mara/ })).toBeVisible();
  await page.getByRole("button", { name: "Meet Mara", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Current encounter" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Approach peacefully", exact: true })
    .click();
  const after = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(
    after.area.animals.find((n: { role: string }) => n.role === "mother").bond,
  ).toBeGreaterThan(
    before.area.animals.find((n: { role: string }) => n.role === "mother").bond,
  );
  await gameNav(page, "Journal").click();
  await expect(
    page.getByRole("region", { name: "Life Journal" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Life Journal" }),
  ).toBeVisible();
  await page.goBack();
  await expect(gameNav(page, "Life")).toHaveAttribute("aria-current", "page");
});

test("ant brood cannot travel, while workers contribute through meaningful garden and leaf-trail actions", async ({
  page,
}) => {
  const s = startLife(createGame(), {
    speciesId: "ant",
    year: 2020,
    seed: "ant-rpg",
  });
  await fixture(page, s);
  await expect(
    page.getByRole("button", { name: /^Watch life unfold/ }),
  ).toBeVisible();
  await gameNav(page, "Explore").click();
  await page.getByRole("button", { name: /Leaf trail/ }).click();
  await expect(
    page.getByRole("button", { name: /Follow family/ }),
  ).toBeDisabled();
  // Restore an older individual via the normal validated save shape, then reload.
  current(s)!.ageDays = 60;
  current(s)!.stats.energy = 100;
  s.world!.patches[0].food = 0.4;
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key: SAVE_KEY,
    value: serialize(s),
  });
  await page.goto("./#life");
  await page.reload();
  await page
    .getByRole("button", { name: /Care for the fungus garden/ })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "colony’s lasting food stores" }),
  ).toBeVisible();
  await gameNav(page, "Explore").click();
  await page.getByRole("button", { name: /Leaf trail/ }).click();
  await page.getByRole("button", { name: /Travel here/ }).click();
  await expect(
    page.getByRole("button", { name: /Gather leaves for the colony/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Gather leaves for the colony/ })
    .click();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.family[saved.currentId].colonyService).toBeGreaterThan(2);
  await page.screenshot({
    path: `test-results/ant-worker-${test.info().project.name}.png`,
    animations: "disabled",
  });
});

test("narration settings, optional discoveries and transparent earned-currency packs remain accessible", async ({
  page,
}) => {
  await begin(page, "African savanna elephant");
  await gameNav(page, "More").click();
  await page.getByLabel("Narration", { exact: true }).selectOption("detailed");
  await page
    .getByText("Discover this species · optional field notes", { exact: true })
    .click();
  for (const title of [
    "Biology",
    "Habitat",
    "Diet",
    "Development",
    "Predators & safety",
    "Social life",
    "Geography",
    "Historical world",
  ])
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.narration).toBe("detailed");
  await page.reload();
  await expect(page.getByLabel("Narration", { exact: true })).toHaveValue(
    "detailed",
  );
  await page.getByRole("button", { name: /Coins · Field packs/ }).click();
  await expect(page.getByText("60%", { exact: true })).toBeVisible();
  await expect(page.getByText("30%", { exact: true })).toBeVisible();
  await expect(page.getByText("10%", { exact: true })).toBeVisible();
  await expect(page.getByText(/No real money/)).toBeVisible();
});

test("archive notification never leaks into a newly living elephant", async ({
  page,
}) => {
  await begin(page);
  await gameNav(page, "More").click();
  await page
    .getByRole("button", { name: "Settings & saves", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Abandon current life", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "End this life", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Life archived without Coins" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  await begin(page, "African savanna elephant", false);
  await expect(
    page.getByText(
      "Life archived without Coins. Collection progress is preserved.",
      { exact: true },
    ),
  ).toHaveCount(0);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.family[saved.currentId].alive).toBe(true);
  expect(saved.records).toHaveLength(1);
  expect(saved.coins).toBe(0);
});

test("primary phone actions fit above navigation, controls work by keyboard, and scenes follow day and weather", async ({
  page,
}) => {
  if (test.info().project.name === "mobile")
    await page.setViewportSize({ width: 390, height: 664 });
  const s = startLife(createGame(), {
    speciesId: "wolf",
    year: 2020,
    seed: "scene-qa",
  });
  await fixture(page, s);
  const first = await page.locator(".game-action").first().boundingBox(),
    nav = await page
      .getByRole("navigation", { name: "Gameplay navigation" })
      .boundingBox();
  expect(first!.y + first!.height).toBeLessThan(nav!.y);
  await gameNav(page, "Explore").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("region", { name: "Explore nearby locations" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await gameNav(page, "Life").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("figure")).toHaveAccessibleName(/Morning/);
  s.phase = 3;
  s.world!.precipitation = 20;
  s.environment!.weather = "Heavy rain";
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key: SAVE_KEY,
    value: serialize(s),
  });
  await page.reload();
  await expect(page.getByRole("figure")).toHaveAccessibleName(
    /Night.*Heavy rain/,
  );
  await expect(page.locator(".wildlife-scene")).toHaveClass(/night.*raining/);
  await page.screenshot({
    path: `test-results/night-rain-${test.info().project.name}.png`,
    animations: "disabled",
  });
});

const speciesFlow: Record<string, { location: string; action: string }> = {
  bumblebee: { location: "forage", action: "Gather nectar and pollen" },
  ant: { location: "home", action: "Care for the fungus garden" },
  rabbit: { location: "home", action: "Digest in the safety of the warren" },
  wolf: { location: "forage", action: "Gather your pack" },
  elephant: { location: "water", action: "Dig for shallow water" },
  mallard: { location: "water", action: "Dabble in the shallows" },
  octopus: { location: "shade", action: "Arrange a crevice den" },
  meerkat: { location: "edge", action: "Take a turn as lookout" },
  bullfrog: { location: "water", action: "Wait for passing prey" },
  raccoon: { location: "water", action: "Feel for food in the shallows" },
  fox: { location: "forage", action: "Hide a surplus meal" },
  robin: { location: "home", action: "Sing from your territory" },
  seal: { location: "forage", action: "Forage in shallow water" },
};
for (const sp of SPECIES)
  test(`${sp.name} exposes a real species activity and persists its consequences`, async ({
    page,
  }) => {
    const base = createGame();
    if (!base.unlocked.includes(sp.id)) base.unlocked.push(sp.id);
    const s = startLife(base, {
      speciesId: sp.id,
      year: 2020,
      seed: `browser-species-${sp.id}`,
    });
    current(s)!.ageDays = sp.adultDay;
    current(s)!.stats.energy = 100;
    current(s)!.biology!.stores.fiber = 30;
    current(s)!.biology!.stores.parcel = 40;
    s.phase = 0;
    s.environment!.temperature = 20;
    s.world!.precipitation = 0;
    s.world!.activePatch = speciesFlow[sp.id].location;
    for (const n of s.area!.animals) {
      n.location = ["mother", "companion"].includes(n.role)
        ? s.world!.activePatch
        : "edge";
      n.engagedUntil = 100;
    }
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await fixture(page, s);
    await page
      .getByRole("button", {
        name: new RegExp(`^${speciesFlow[sp.id].action}`),
      })
      .click();
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      SAVE_KEY,
    );
    expect(saved.phase).toBe(1);
    expect(saved.currentId).toBe(s.currentId);
    expect(saved.coins).toBe(s.coins);
    expect(saved.unlocked).toEqual(s.unlocked);
    expect(saved.family[saved.currentId].biology).not.toEqual(
      current(s)!.biology,
    );
    await page.reload();
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!),
        SAVE_KEY,
      ),
    ).toEqual(saved);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        oversized: [...document.querySelectorAll("*")]
          .map((e) => ({
            tag: e.tagName,
            cls: e.className,
            w: e.getBoundingClientRect().width,
            right: e.getBoundingClientRect().right,
          }))
          .filter((e) => e.right > innerWidth + 1 && e.w > 0)
          .slice(0, 10),
      })),
    ).toMatchObject({ scroll: page.viewportSize()!.width });
    if (["elephant", "wolf", "ant"].includes(sp.id)) {
      const actor = await page.locator(".scene-player").boundingBox();
      const caption = await page.locator("figcaption").boundingBox();
      expect(actor!.y + actor!.height * 0.65).toBeLessThan(caption!.y);
      await page.screenshot({
        path: `test-results/phase3-${sp.id}-${test.info().project.name}.png`,
        animations: "disabled",
      });
    }
  });
