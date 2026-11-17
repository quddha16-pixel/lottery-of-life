import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SAVE_KEY } from "../src/game/storage";
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

const save = (p: Page) =>
  p.evaluate((k) => JSON.parse(localStorage.getItem(k)!), SAVE_KEY);
const nav = (p: Page, n: string) =>
  p
    .getByRole("navigation", { name: "Gameplay navigation" })
    .getByRole("button", { name: n, exact: true });
async function born(p: Page, id: string) {
  await p.goto("./");
  await p.getByRole("button", { name: "New Life", exact: true }).click();
  await p.getByRole("button", { name: "Choose species", exact: true }).click();
  await p.getByLabel("Unlocked species").selectOption(id);
  await p.getByText("World seed & historical scope", { exact: true }).click();
  await p.getByRole("textbox", { name: "World seed" }).fill("audit-new-" + id);
  for (const n of [
    "Reveal species",
    "Reveal birthplace",
    "Reveal birth date",
    "Reveal circumstances",
    "Begin Life",
  ])
    await p.getByRole("button", { name: n, exact: true }).click();
  await expect(p.getByRole("main", { name: "Active life" })).toBeVisible();
}
test("a fresh wolf has two useful choices above navigation and keyboard-accessible scene details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await born(page, "wolf");
  const first = await page
    .locator(".rpg-decisions .game-action:visible")
    .first()
    .boundingBox();
  const next = await page
    .getByRole("button", { name: /^Continue to the next change/ })
    .boundingBox();
  const bottom = await nav(page, "Life").boundingBox();
  expect(first!.y + first!.height).toBeLessThan(bottom!.y);
  expect(next!.y + next!.height).toBeLessThan(bottom!.y);
  const before = await save(page);
  const actor = page.getByRole("button", { name: /^Inspect / });
  await actor.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("den-bound pup");
  await page.keyboard.press("Escape");
  await expect(actor).toBeFocused();
  expect(await save(page)).toEqual(before);
  await nav(page, "Explore").click();
  await page.getByRole("button", { name: /River bend/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Too young");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: /Follow family/ }),
  ).toBeDisabled();
  const text = page.getByRole("dialog").getByText(/Too young/);
  const box = await text.boundingBox();
  expect(box!.y + box!.height).toBeLessThan(664);
});
test("a fresh ant develops through ordinary care, then gardens and harvests through scene and map controls", async ({
  page,
}) => {
  await born(page, "ant");
  let count = 0;
  while (count++ < 8) {
    const s = await save(page);
    if (s.family[s.currentId].ageDays >= 60) break;
    const encounter = page.getByRole("button", {
      name: "Keep a cautious distance",
      exact: true,
    });
    if (await encounter.isVisible()) await encounter.click();
    else await page.getByRole("button", { name: /^Watch life unfold/ }).click();
  }
  let s = await save(page);
  expect(s.family[s.currentId].ageDays).toBe(60);
  expect(s.family[s.currentId].biology.stores.fungus).toBeGreaterThan(30);
  expect(count).toBeLessThanOrEqual(7);
  await page.locator(".scene-target.resource").click();
  await expect(page.getByRole("dialog")).toContainText("Garden food");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Care for the fungus garden/ })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: /colony/ }),
  ).toBeVisible();
  await nav(page, "Explore").click();
  await page.getByRole("button", { name: /Leaf trail/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Travel here/ })
    .click();
  const encounter = page.getByRole("button", {
    name: "Keep a cautious distance",
    exact: true,
  });
  if (await encounter.isVisible()) await encounter.click();
  s = await save(page);
  const material = s.family[s.currentId].biology.stores.substrate;
  await page
    .getByRole("button", { name: /^Gather leaves for the colony/ })
    .click();
  s = await save(page);
  expect(s.family[s.currentId].biology.stores.substrate).toBeGreaterThan(
    material,
  );
  await page
    .getByRole("button", { name: "Explain the last result", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("reaches the colony");
  await expect(page.getByRole("dialog")).toContainText("Leaf material: +");
  await page.screenshot({
    path: `test-results/phase3c-ant-result-${test.info().project.name}.png`,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  const kept = await save(page);
  await page.reload();
  expect(await save(page)).toEqual(kept);
});
test("field discoveries are optional, saved and do not spend a phase or random draw", async ({
  page,
}) => {
  await born(page, "elephant");
  const before = await save(page);
  await page.getByRole("button", { name: /^Discover this species/ }).click();
  await page.getByRole("dialog").getByText("Biology", { exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "African savanna elephant",
  );
  const after = await save(page);
  expect(after.phase).toBe(before.phase);
  expect(after.rng).toBe(before.rng);
  expect(after.coins).toBe(before.coins);
  expect(after.family[after.currentId].biology.skills["note:Biology"]).toBe(1);
  await page.keyboard.press("Escape");
  await page.reload();
  const loaded = await save(page);
  expect(loaded.family[loaded.currentId].biology.skills["note:Biology"]).toBe(
    1,
  );
});
