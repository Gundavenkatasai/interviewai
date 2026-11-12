const { chromium } = require('playwright');

async function run() {
  console.log("Launching Edge browser for E2E verification of /jobs...");
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('requestfailed', req => {
    console.log(`[Request Failed]: ${req.method()} ${req.url()} -> ${req.failure()?.errorText}`);
  });

  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`[Response Error]: ${res.status()} ${res.url()}`);
    }
  });

  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type()}]: ${msg.text()}`);
  });

  console.log("Navigating to http://localhost:5173/jobs ...");
  await page.goto("http://localhost:5173/jobs", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const html = await page.content();
  console.log("Page title:", await page.title());
  console.log("Requisition count text:", await page.locator("p:has-text('Displaying')").textContent().catch(() => "Not found"));
  console.log("Empty state:", await page.locator("h3").allTextContents());

  await browser.close();
}

run().catch(console.error);

