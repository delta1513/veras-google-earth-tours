import { expect, test, type Page } from "@playwright/test";
import { regions } from "./places";

const MIN_PIN = 64; // px, pin touch target
const MIN_CARD_HEIGHT = 96; // px
const MIN_CLOSE = 56; // px

async function insideViewport(page: Page, locator: ReturnType<Page["locator"]>) {
  const box = (await locator.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
  return box;
}

test.afterEach(() => {
  expect(dialogs, "alert/confirm/prompt dialogs are not allowed").toEqual([]);
});

const pin = (page: Page, id: string) => page.locator(`[data-testid=pin][data-region="${id}"]`);

let dialogs: string[] = [];

test.beforeEach(async ({ page }) => {
  dialogs = [];
  // Vera cannot read dialogs: record (and dismiss) any, then fail in afterEach.
  page.on("dialog", (d) => {
    dialogs.push(`${d.type()}: ${d.message()}`);
    void d.dismiss();
  });
  await page.goto("/");
  await expect(page.getByTestId("map")).toBeVisible();
});

test("map: pins are big, on screen, and the page does not scroll", async ({ page }) => {
  await expect(page.getByTestId("pin")).toHaveCount(regions.length);
  for (const region of regions) {
    const box = await insideViewport(page, pin(page, region.id));
    expect(box.width).toBeGreaterThanOrEqual(MIN_PIN);
    expect(box.height).toBeGreaterThanOrEqual(MIN_PIN);
  }
  const scroll = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight <= innerHeight,
    w: document.documentElement.scrollWidth <= innerWidth,
  }));
  expect(scroll).toEqual({ h: true, w: true });
});

test("every region: overlay lists its places as plain links and closes (twice)", async ({ page }) => {
  for (const region of regions) {
    for (let round = 0; round < 2; round++) {
      await pin(page, region.id).tap();
      const overlay = page.getByTestId("overlay");
      await expect(overlay).toBeVisible();
      await expect(overlay).toHaveAttribute("data-region", region.id);

      const cards = page.getByTestId("card");
      await expect(cards).toHaveCount(region.places.length);
      for (const [i, place] of region.places.entries()) {
        const card = cards.nth(i);
        await expect(card).toHaveAttribute("href", place.url);
        await expect(card).not.toHaveAttribute("target", /.*/);
        expect((await card.boundingBox())!.height).toBeGreaterThanOrEqual(MIN_CARD_HEIGHT);
        await expect(card).toHaveText(place.name);
      }

      const close = page.getByTestId("close");
      const box = await insideViewport(page, close);
      expect(box.width).toBeGreaterThanOrEqual(MIN_CLOSE);
      expect(box.height).toBeGreaterThanOrEqual(MIN_CLOSE);
      // The close button sits on the top-left corner of the sheet.
      const sheet = (await page.getByTestId("sheet").boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - sheet.x)).toBeLessThanOrEqual(box.width);
      expect(Math.abs(box.y + box.height / 2 - sheet.y)).toBeLessThanOrEqual(box.height);
      await close.tap();
      await expect(overlay).toHaveCount(0);
    }
  }
});

test("thumbnails: loaded image when set, grey placeholder when null", async ({ page }) => {
  for (const region of regions) {
    await pin(page, region.id).tap();
    const cards = page.getByTestId("card");
    for (const [i, place] of region.places.entries()) {
      const card = cards.nth(i);
      if (place.thumbnail) {
        const img = card.locator("img");
        await expect(img).toHaveCount(1);
        await expect(card.getByTestId("placeholder")).toHaveCount(0);
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), {
            message: `${region.id}/${place.name} thumbnail did not load`,
          })
          .toBeGreaterThan(0);
      } else {
        await expect(card.getByTestId("placeholder")).toHaveCount(1);
        await expect(card.locator("img")).toHaveCount(0);
      }
    }
    await page.getByTestId("close").tap();
    await expect(page.getByTestId("overlay")).toHaveCount(0);
  }
});

const hitAt = (page: Page, x: number, y: number) =>
  page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.getAttribute("data-testid"), [x, y]);

test("tap outside the sheet closes it; tap inside does not", async ({ page }) => {
  const vp = page.viewportSize()!;
  const outside = [
    { x: vp.width - 4, y: 4 }, // top-right corner
    { x: 4, y: vp.height - 4 }, // bottom-left corner
    { x: vp.width / 2, y: vp.height - 4 }, // bottom edge
    { x: vp.width - 4, y: vp.height / 2 }, // right edge
  ];
  for (const pt of outside) {
    await pin(page, regions[0].id).tap();
    const overlay = page.getByTestId("overlay");
    await expect(overlay).toBeVisible();

    // Let the cards settle, then tap the sheet padding (not a card): it stays open.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime))
          .map((a) => a.finished.catch(() => {})), // cancelled ones count as done
      ),
    );
    const sheet = (await page.getByTestId("sheet").boundingBox())!;
    const inside = { x: sheet.x + sheet.width / 2, y: sheet.y + 12 };
    expect(await hitAt(page, inside.x, inside.y)).toBe("sheet");
    await page.touchscreen.tap(inside.x, inside.y);
    await expect(overlay).toBeVisible();

    // Outside the sheet: it closes.
    expect(await hitAt(page, pt.x, pt.y)).toBe("backdrop");
    await page.touchscreen.tap(pt.x, pt.y);
    await expect(overlay).toHaveCount(0);
  }
  await expect(page.getByTestId("map")).toBeVisible();
});

test("Vera rules: no dialogs, no console or page errors", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  page.on("requestfailed", (r) => problems.push(`requestfailed: ${r.url()}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()}: ${r.url()}`));

  // Reload so listeners see the whole page load, then run the open/close flow.
  await page.reload();
  for (const region of regions) {
    await pin(page, region.id).tap();
    await expect(page.getByTestId("overlay")).toBeVisible();
    await page.getByTestId("close").tap();
    await expect(page.getByTestId("overlay")).toHaveCount(0);
  }
  expect(problems).toEqual([]);
});

test.describe("coming back from Google Earth", () => {
  const launch = async (page: Page) => {
    // Google Earth is an app on the iPad: here the navigation (204) leaves this page as it is.
    await page.route("https://earth.google.com/**", (route) => route.fulfill({ status: 204 }));
    await pin(page, regions[0].id).click();
    await page.getByTestId("card").first().click();
    await page.waitForTimeout(700); // take-off is over, the link was followed
  };

  test("pageshow (bfcache) returns to a clean map", async ({ page }) => {
    await launch(page);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    await expect(page.getByTestId("overlay")).toHaveCount(0);
    await expect(page.locator(".going")).toHaveCount(0);
    await pin(page, regions[0].id).click();
    await expect(page.getByTestId("sheet")).toBeVisible();
    await page.getByTestId("close").click();
    await expect(page.getByTestId("overlay")).toHaveCount(0);
  });

  test("visibilitychange back to visible returns to a clean map", async ({ page }) => {
    await launch(page);
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(page.getByTestId("overlay")).toHaveCount(0);
  });

  test("close works even right after a tap, and a stuck take-off clears by itself", async ({ page }) => {
    await launch(page);
    await page.getByTestId("close").click();
    await expect(page.getByTestId("overlay")).toHaveCount(0);
    await pin(page, regions[0].id).click();
    await page.getByTestId("card").first().click();
    await page.waitForTimeout(3300);
    await expect(page.locator(".going")).toHaveCount(0);
    await expect(page.getByTestId("overlay")).toHaveCount(0);
  });
});
