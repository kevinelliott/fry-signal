import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

async function readFirstWave(page: Page, keyboard = false) {
  const desktopTicket = page.getByRole("button", { name: /read road forecast: commuter drift/i });
  if (await desktopTicket.isVisible()) {
    if (keyboard) {
      await desktopTicket.focus();
      await page.keyboard.press("Enter");
    } else {
      await desktopTicket.click();
    }
    return;
  }

  const forecastToggle = page.getByRole("button", { name: "Open three-wave road forecast" });
  await forecastToggle.click();
  await page.getByRole("button", { name: /Read mobile forecast wave 1: Commuter Drift/i }).click();
}

async function startShift(page: Page, keyboard = false) {
  await readFirstWave(page, keyboard);
  const commit = page.getByRole("button", { name: /commit opening batch/i });
  if (keyboard) {
    await commit.focus();
    await page.keyboard.press("Space");
  } else {
    await commit.click();
  }
}

async function advanceThroughArrival(page: Page, orderId: string) {
  await page.getByRole("button", { name: new RegExp(`run next arrival · ${orderId}`, "i") }).click();
}

async function completeShift(page: Page) {
  for (let step = 0; step < 40; step += 1) {
    if (await page.getByText("Choice open", { exact: true }).isVisible().catch(() => false)) {
      const shortBatch = page.getByRole("button", { name: /Short Batch/i });
      if (await shortBatch.count()) {
        await shortBatch.click();
        continue;
      }
      await page.getByRole("button", { name: /Loopback Save/i }).click();
      continue;
    }
    const progress = page.getByRole("button", { name: /run next arrival|close service|settle shift/i });
    if (/mm-05/i.test((await progress.textContent()) ?? "")) {
      await page.getByRole("button", { name: /switch gate b toward pack b and window 2/i }).click();
    }
    await progress.click();
    if (await page.getByRole("heading", { name: "House Book" }).isVisible().catch(() => false)) return;
  }
  throw new Error("Shift did not settle within the deterministic journey bound");
}

test.beforeEach(async ({ page }) => {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1") {
      throw new Error(`Walletless evidence journey attempted a non-loopback request: ${url.origin}`);
    }
    await route.continue();
  });
  await page.goto("/");
  await page.getByText(/Saved locally/i).waitFor();
  await page.getByRole("button", { name: "Reset local shift" }).click();
});

test("actual reducer recovery identity, options, and cost are keyboard-operable", async ({ page }, testInfo) => {
  await expect(page.getByRole("heading", { name: "Signal board" })).toBeVisible();
  await startShift(page, true);

  for (const orderId of ["mm-01", "mm-02", "mm-03", "mm-04", "mm-05"]) {
    await advanceThroughArrival(page, orderId);
  }

  const rail = page.getByRole("complementary", { name: "Exception rail" });
  if (testInfo.project.name === "mobile") {
    const context = rail.getByLabel("Selected exception order and announced cause");
    await expect(context).toContainText("mm-05");
    await expect(context).toContainText("lane-2");
    await expect(context).toContainText("Route blocked");
  } else {
    await expect(rail.getByText("mm-05", { exact: true })).toBeVisible();
    await expect(rail.getByText("Lane 2 arrival", { exact: true })).toBeVisible();
    await expect(rail.getByText("Route blocked", { exact: true })).toBeVisible();
  }
  const loopback = rail.getByRole("button", { name: /Loopback Save.*\+5 ticks.*−3 freshness.*\$1\.25/i });
  await loopback.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Resolved", { exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: /mm-05 Biscuit Basket resolved with Loopback Save/i })).toBeVisible();
});

test("the announced Rain Detour requires and rewards a real route switch", async ({ page }) => {
  await startShift(page);
  for (const orderId of ["mm-01", "mm-02", "mm-03", "mm-04"]) {
    await advanceThroughArrival(page, orderId);
  }

  await expect(
    page.getByRole("group", { name: /Rain Detour: Gate A is closed to new hot trays/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /switch gate b toward pack b and window 2/i }).click();
  await expect(
    page.getByRole("group", { name: /Rain Detour: hot trays are set to the safe Pack B crossover/i }),
  ).toBeVisible();

  await advanceThroughArrival(page, "mm-05");
  await expect(page.getByText("Choice open", { exact: true })).not.toBeVisible();
  await expect(page.getByLabel(/mm-05, Biscuit Basket, dispatched/i)).toBeVisible();
});

test("all three waves settle into the reducer-derived House Book", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "complete journey is covered once on the desktop authority surface");
  await startShift(page);
  await completeShift(page);

  await expect(page.getByRole("heading", { name: "House Book" })).toBeVisible();
  await expect(page.getByText(/15 \/ 15 orders dispatched/i)).toBeVisible();
  await expect(page.getByText(/Restaurant health margin/i)).toBeVisible();
  await expect(page.getByText(/Margin keeps Mile 42 healthy/i)).toBeVisible();
  await expect(page.getByText(/Tick 420 \/ 420/i)).toBeVisible();
  const postcard = page.getByLabel("Local Shift Postcard");
  await expect(postcard.getByText(/Midnight Merge complete/i)).toBeVisible();
  await expect(postcard).not.toContainText(/route|gate|crossover|switch|recovery|batch|score|reward/i);
  await expect(page.getByRole("button", { name: /Run Midnight Merge again/i })).toBeEnabled();
});

test("versioned local save resumes exactly and reset clears it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "save and reset semantics are viewport-independent");
  await startShift(page);
  await page.getByRole("button", { name: /run next arrival · mm-01/i }).click();
  await expect(page.getByText(/Tick 20 \/ 420/i)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/Tick 20 \/ 420/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /batch committed/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /run next arrival · mm-02/i })).toBeEnabled();

  await page.getByRole("button", { name: "Reset local shift" }).click();
  await expect(page.getByText(/Tick 0 \/ 420/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /commit opening batch/i })).toBeDisabled();
});

test("the mobile board stays visible with three forecasts, real context, and four conditions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only responsive contract");
  const board = page.getByRole("heading", { name: "Signal board" });
  await expect(board).toBeVisible();

  const forecastToggle = page.getByRole("button", { name: "Open three-wave road forecast" });
  await forecastToggle.click();
  await expect(page.getByRole("button", { name: /Read mobile forecast wave/i })).toHaveCount(3);
  await expect(board).toBeVisible();
  await page.getByRole("button", { name: /Read mobile forecast wave 2: Rain Detour/i }).click();
  await expect(page.getByText(/Viewing wave 2 · current 1/i)).toBeVisible();

  const exceptionContext = page.getByLabel("Selected exception order and announced cause");
  await expect(exceptionContext).toContainText("No active exception");
  await expect(exceptionContext).not.toContainText("Order #14");

  const serviceConditions = page.getByRole("group", { name: "All service conditions" });
  await expect(serviceConditions).toBeVisible();
  await expect(serviceConditions).toContainText("Warmth");
  await expect(serviceConditions).toContainText("Accuracy");
  await expect(serviceConditions).toContainText("Flow");
  await expect(serviceConditions).toContainText("Crew condition");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("reduced motion preserves the actual resolved route and costs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startShift(page);
  for (const orderId of ["mm-01", "mm-02", "mm-03", "mm-04", "mm-05"]) {
    await advanceThroughArrival(page, orderId);
  }
  await page.getByRole("button", { name: /Pull Forward.*\+7 ticks.*−2 freshness.*\$1\.75/i }).click();
  await expect(page.getByRole("group", { name: /mm-05 Biscuit Basket resolved with Pull Forward/i })).toBeVisible();
  await expect(page.getByText(/Applied · \+5t\/3 freshness or \+7t\/2 freshness/i)).toBeVisible();
});

test("captures the rebuilt authority surface", async ({ page }, testInfo) => {
  await startShift(page);
  for (const orderId of ["mm-01", "mm-02", "mm-03", "mm-04", "mm-05"]) {
    await advanceThroughArrival(page, orderId);
  }
  await expect(page.getByText("Choice open", { exact: true })).toBeVisible();

  const reviewDirectory = resolve(process.cwd(), "../../.impeccable/review");
  mkdirSync(reviewDirectory, { recursive: true });
  await page.screenshot({ path: resolve(reviewDirectory, `${testInfo.project.name}.png`), fullPage: true });
});

test("the authority surface has no horizontal overflow", async ({ page }) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
