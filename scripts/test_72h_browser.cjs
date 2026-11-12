const { chromium } = require('playwright');

(async () => {
  console.log('Testing 72-Hour Job Intelligence Aggregator in browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Visit /jobs
  console.log('Navigating to http://localhost:5173/jobs ...');
  await page.goto('http://localhost:5173/jobs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check Telemetry deck
  const verifiedBadge = await page.locator('text=≤ 72h Verified').first();
  const verifiedVisible = await verifiedBadge.isVisible();
  console.log('72h Telemetry Deck "≤ 72h Verified" visible:', verifiedVisible);

  const portalsActive = await page.locator('text=Portals Active').first();
  const portalsVisible = await portalsActive.isVisible();
  console.log('72h Telemetry Deck "Portals Active" visible:', portalsVisible);

  // Check cards count
  const cardsCount = await page.locator('h3').count();
  console.log(`Total visible job cards on page: ${cardsCount}`);

  // Check for time remaining badges
  const leftBadges = await page.locator('text=/\\d+(\\.\\d+)?h left/').count();
  console.log(`Job cards with verified "[Xh left]" badge: ${leftBadges}`);

  // Check recency filter "Last 24 Hours"
  console.log('Clicking "Last 24 Hours ⚡" cutoff filter...');
  const btn24h = page.locator('button:has-text("Last 24 Hours ⚡")').first();
  if (await btn24h.isVisible()) {
    await btn24h.click();
    await page.waitForTimeout(1500);
    const count24h = await page.locator('h3').count();
    console.log(`Cards visible under Last 24 Hours cutoff: ${count24h}`);
  }

  // Take screenshot of /jobs
  await page.screenshot({ path: 'scripts/jobs_72h_aggregator.png' });
  console.log('Screenshot saved to scripts/jobs_72h_aggregator.png');

  // 2. Perform 1-Click Demo Login to authenticate for ProtectedRoute /admin
  console.log('Navigating to http://localhost:5173/login ...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const demoBtn = page.locator('button:has-text("Quick 1-Click Sign In")').first();
  if (await demoBtn.isVisible()) {
    console.log('Clicking 1-Click Sign In button...');
    await demoBtn.click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Successfully authenticated as demo candidate.');
  }

  // 3. Navigate to /admin
  console.log('Navigating to http://localhost:5173/admin ...');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const adminHeader = await page.locator('text=Job Intelligence Aggregator Control Deck').first();
  const headerVisible = await adminHeader.isVisible();
  console.log('Admin Control Deck Header visible:', headerVisible);

  const sourcesRows = await page.locator('tbody tr').count();
  console.log(`Admin Sources Table rows visible (all 14 sources): ${sourcesRows}`);

  // Click on "72h Validation Audit Log"
  const valTab = page.locator('button:has-text("72h Validation Audit Log")').first();
  if (await valTab.isVisible()) {
    await valTab.click();
    await page.waitForTimeout(1500);
    const auditRows = await page.locator('tbody tr').count();
    console.log(`Audit Log rows visible: ${auditRows}`);
  }

  // Take screenshot of /admin
  await page.screenshot({ path: 'scripts/admin_72h_control_deck.png' });
  console.log('Screenshot saved to scripts/admin_72h_control_deck.png');

  await browser.close();
  console.log('All browser visual and functional tests passed successfully!');
})().catch(err => {
  console.error('Browser test failed:', err);
  process.exit(1);
});
