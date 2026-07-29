import { expect, test } from "@playwright/test";

async function prepareAction(page: import("@playwright/test").Page) {
  const input = page.getByLabel(/例如|For example/);
  await input.fill("我一直拖着没写周报");
  await page.getByRole("button", { name: "发送" }).click();
  await expect(page.getByRole("button", { name: "开始行动" })).toBeVisible();
}

test("chat produces a fixed action and countdown starts once", async ({ page }) => {
  await page.goto("/");
  await prepareAction(page);

  const start = page.getByRole("button", { name: "开始行动" });
  await start.dblclick();

  const ring = page.getByLabel(/\d+ 秒/);
  await expect(ring).toBeVisible();
  const initial = Number((await ring.getAttribute("aria-label"))?.match(/\d+/)?.[0]);
  await page.waitForTimeout(2200);
  const later = Number((await ring.getAttribute("aria-label"))?.match(/\d+/)?.[0]);

  expect(initial - later).toBeGreaterThanOrEqual(1);
  expect(initial - later).toBeLessThanOrEqual(3);
});

test("cancel and language switch remain usable", async ({ page }) => {
  await page.goto("/");
  await prepareAction(page);
  await page.getByRole("button", { name: "开始行动" }).click();
  await page.getByRole("button", { name: "取消行动" }).click();
  await expect(page.getByRole("button", { name: "开始行动" })).toBeVisible();

  await page.getByRole("button", { name: "切换到英文" }).click();
  await expect(page.getByRole("button", { name: "Start action" })).toBeVisible();
});

test("countdown completes and go again returns to ready", async ({ page }) => {
  test.slow();
  await page.goto("/");
  await prepareAction(page);
  await page.getByRole("button", { name: "开始行动" }).click();

  await expect(page.getByText("很好，你已经开始了。")).toBeVisible({
    timeout: 35_000,
  });
  await expect(page.getByTestId("cycle-count")).toHaveText("1");
  await page.getByRole("button", { name: "再来一轮" }).click();
  await expect(page.getByRole("button", { name: "开始行动" })).toBeVisible();
});

test("390px layout has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
