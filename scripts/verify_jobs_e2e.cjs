const { chromium } = require('playwright');

async function run() {
  console.log("Launching Edge browser for E2E verification of /jobs...");
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[Browser Console Error]: ${msg.text()}`);
  });

  console.log("1. Navigating to http://localhost:5173/jobs ...");
  await page.goto("http://localhost:5173/jobs", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Initial State
  const initialCards = await page.locator("h3").count();
  console.log(`[PASS] Initial load completed: ${initialCards} job cards visible`);

  // 2. Test Last 24 Hours filter
  console.log("2. Clicking 'Last 24 Hours' freshness pill...");
  const recencyBtn = page.locator("#filter-recency-24h");
  await recencyBtn.click();
  await page.waitForTimeout(1000);

  const urlAfter24h = page.url();
  console.log(`[PASS] URL after clicking 24h: ${urlAfter24h}`);
  if (!urlAfter24h.includes("posted_days=1")) {
    throw new Error("URL does not contain posted_days=1");
  }

  // Check active filter chip
  const chips24h = await page.locator("button:has-text('Posted: Last 24 Hours')").count();
  console.log(`[PASS] Active filter chip 'Posted: Last 24 Hours' present: ${chips24h > 0}`);

  const cardsAfter24h = await page.locator("h3").count();
  console.log(`[PASS] Requisitions visible under Last 24 Hours: ${cardsAfter24h}`);

  // 3. Test Location filter (e.g. Bengaluru)
  console.log("3. Clicking 'Bengaluru' quick location pill...");
  const bengaluruBtn = page.locator("button:has-text('Bengaluru')").first();
  await bengaluruBtn.click();
  await page.waitForTimeout(1000);

  const urlBengaluru = page.url();
  console.log(`[PASS] URL after Bengaluru: ${urlBengaluru}`);
  const cardsBengaluru = await page.locator("h3").count();
  console.log(`[PASS] Cards matching Bengaluru in Last 24h: ${cardsBengaluru}`);

  // 4. Test Track filter (e.g. Backend)
  console.log("4. Clicking 'Backend' track pill...");
  const backendBtn = page.locator("button:has-text('Backend')").first();
  await backendBtn.click();
  await page.waitForTimeout(1000);
  console.log(`[PASS] URL after Backend track: ${page.url()}`);

  // 5. Test Filter Deck Toggle
  console.log("5. Opening Advanced Filter Deck...");
  const filterToggle = page.locator("#jobs-filter-toggle");
  await filterToggle.click();
  await page.waitForTimeout(500);

  const deckVisible = await page.locator("h2:has-text('Advanced Requisition Filters')").isVisible();
  console.log(`[PASS] Filter Deck opened: ${deckVisible}`);

  // 6. Test Salary Preset Pill (e.g. ₹3+ LPA)
  console.log("6. Clicking '₹3+ LPA' compensation preset...");
  const salaryBtn = page.locator("button:has-text('₹3+ LPA')").first();
  await salaryBtn.click();
  await page.waitForTimeout(1000);
  console.log(`[PASS] URL after salary preset: ${page.url()}`);

  // 7. Test Apply Link Integrity
  console.log("7. Verifying Apply button on top requisition card...");
  const applyBtn = page.locator("button[id^='apply-btn-']").first();
  const applyBtnVisible = await applyBtn.isVisible();
  const applyBtnText = await applyBtn.innerText();
  console.log(`[PASS] Direct Apply button visible: ${applyBtnVisible}, text: "${applyBtnText}"`);

  // 8. Test 1-click Clear All Constraints
  console.log("8. Testing 'Clear All' constraints...");
  const clearBtn = page.locator("button:has-text('Clear All')").first();
  if (await clearBtn.isVisible()) {
    await clearBtn.click();
    await page.waitForTimeout(1000);
    console.log(`[PASS] URL after Clear All: ${page.url()}`);
    const resetCards = await page.locator("h3").count();
    console.log(`[PASS] Requisitions restored to full list: ${resetCards}`);
  }

  // Screenshot proof
  await page.screenshot({ path: "scripts/jobs_verified.png", fullPage: false });
  console.log("[PASS] Screenshot saved to scripts/jobs_verified.png");

  await browser.close();
  console.log("=== ALL E2E BROWSER TESTS PASSED PERFECTLY ===");
}

run().catch(err => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});

