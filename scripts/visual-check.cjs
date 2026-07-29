const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const output = path.resolve("test-results/visual");
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const results = [];

  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile-390", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(output, `${viewport.name}-home.png`),
      fullPage: true,
    });
    await page.getByLabel(/例如|For example/).fill("我一直拖着没写周报");
    await page.getByRole("button", { name: "发送" }).click();
    await page.getByRole("button", { name: "开始行动" }).waitFor();
    await page.getByRole("button", { name: "开始行动" }).click();
    await page.screenshot({
      path: path.join(output, `${viewport.name}-countdown.png`),
      fullPage: true,
    });

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    results.push({ viewport, dimensions, errors });
    await page.close();
  }

  await browser.close();
  fs.writeFileSync(
    path.join(output, "result.json"),
    JSON.stringify(results, null, 2),
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
