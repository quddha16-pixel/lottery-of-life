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
import { SAVE_KEY, serialize } from "../src/game/storage";

// In-process static hosting of the real production bundle, including Pages subpath.
// No app server or external network is needed; JS executes normally in Chromium.
test.beforeEach(async ({ context }) => {
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "life-simulator.test") return route.abort();
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
) {
  await page.goto("./");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/overview-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Begin a new life", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose species", exact: true })
    .click();
  await page.getByLabel("Unlocked species").selectOption({ label: species });
  await page
    .getByRole("textbox", { name: "03 / WORLD SEED" })
    .fill("browser-check");
  await page.getByRole("button", { name: "Draw a life", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your story begins here." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enter this life", exact: true })
    .click();
}
test("draws a valid life, resolves phases, and preserves the individual on reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await begin(page);
  await expect(page.getByText("Pup", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Hunt with the pack/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Receive nourishment/ }).click();
  await expect(
    page.getByLabel("Day phases").locator('[aria-current="step"]'),
  ).toContainText("Afternoon");
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.phase).toBe(1);
  await page.reload();
  await page
    .getByRole("button", { name: "Continue your life", exact: true })
    .click();
  await expect(
    page.getByLabel("Day phases").locator('[aria-current="step"]'),
  ).toContainText("Afternoon");
  await page.getByRole("button", { name: "Next day", exact: false }).click();
  await expect(page.getByRole("status")).toContainText("3 phases resolved");
  await expect(page.getByText("1 day", { exact: true })).toBeVisible();
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
    scenarioId: "1900",
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
      name: "Read your latest lifetime record",
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
  expect(download.suggestedFilename()).toBe("life-simulator-save.json");
  const s = abandonLife(
    startLife(createGame(), {
      speciesId: "bumblebee",
      scenarioId: "1980",
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
    scenarioId: "1980",
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
  await expect(
    page.getByText(`${child.ageDays} days`, { exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.currentId).toBe(childId);
  expect(saved.date).toEqual(beforeDate);
  expect(saved.family[saved.currentId].generation).toBe(2);
  expect(saved.family[s.currentId!].alive).toBe(false);
});
