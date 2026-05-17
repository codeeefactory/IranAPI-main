import { expect, test } from "@playwright/test";


test("route smoke and protected redirect stay healthy", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/IranAPI/);

  await page.locator('a[href="/browse"]').first().click();
  await expect(page).toHaveURL(/\/browse$/);
  await expect(page.locator('main a[href^="/api/"]').first()).toBeVisible();

  await page.locator('main a[href^="/api/"]').first().click();
  await expect(page).toHaveURL(/\/api\/.+/);
  await expect(page.locator("h1")).toBeVisible();

  await page.goto("/pricing", { waitUntil: "domcontentloaded" });
  await expect(page.locator('a[href^="/payment?plan="]').first()).toBeVisible();

  await page.goto("/documentation", { waitUntil: "domcontentloaded" });
  await expect(page.locator("article").first()).toBeVisible();

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/signin$/, { timeout: 15000 });
  await expect(page.locator("#username")).toBeVisible();

  await page.goto("/this-route-does-not-exist", { waitUntil: "domcontentloaded" });
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
});
