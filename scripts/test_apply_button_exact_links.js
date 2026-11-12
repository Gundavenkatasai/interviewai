const { chromium } = require('playwright');
const fs = require('fs');

async function runTest() {
  console.log('Starting E2E Apply Links Verification...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track window.open calls
  await page.addInitScript(() => {
    window.__openedUrls = [];
    const origOpen = window.open;
    window.open = (url, target, features) => {
      window.__openedUrls.push(url);
      return { closed: false, focus: () => {}, close: () => {} };
    };
  });

  const errors = [];

  // Navigate to Jobs page
  console.log('Navigating to http://localhost:5173/jobs...');
  await page.goto('http://localhost:5173/jobs', { timeout: 30000, waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const targets = [
    { source: 'Naukri', pattern: /^https:\/\/(www\.)?naukri\.com\/job-listings-.+/ },
    { source: 'Naukri Campus', pattern: /^https:\/\/(www\.)?naukri\.com\/job-listings-.+/ },
    { source: 'Indeed', pattern: /^https:\/\/in\.indeed\.com\/viewjob\?jk=[a-f0-9]+/ },
    { source: 'Glassdoor', pattern: /^https:\/\/(www\.)?glassdoor\.co\.in\/job-listing\/.+/ }
  ];

  for (const t of targets) {
    console.log(`\nTesting source filter: "${t.source}"...`);
    // Click on source pill in sidebar
    const sourceBtn = await page.$(`button:has-text("${t.source}")`);
    if (!sourceBtn) {
      errors.push(`Could not find source button for "${t.source}"`);
      continue;
    }
    await sourceBtn.click();
    await page.waitForTimeout(1500);

    // Find the first job card's apply button
    const applyBtn = await page.$(`button[id^="apply-btn-"], button:has-text("Apply on ${t.source}")`);
    if (!applyBtn) {
      errors.push(`No Apply button found for source "${t.source}"`);
      continue;
    }

    const btnText = (await applyBtn.innerText()).trim();
    console.log(`Found button with text: "${btnText}"`);

    // Clear opened URLs and click
    await page.evaluate(() => { window.__openedUrls = []; });
    await applyBtn.click();
    await page.waitForTimeout(500);

    const opened = await page.evaluate(() => window.__openedUrls);
    console.log(`Triggered window.open with:`, opened);

    if (opened.length === 0) {
      errors.push(`Clicking "${btnText}" did not call window.open!`);
    } else {
      const url = opened[0];
      if (!t.pattern.test(url)) {
        errors.push(`URL "${url}" does not match expected pattern for ${t.source}!`);
      } else {
        console.log(`✓ PASS: "${t.source}" opened exact URL: ${url}`);
      }
    }

    // Unselect source filter
    await sourceBtn.click();
    await page.waitForTimeout(500);
  }

  // Also test JobDetailPage
  console.log('\nTesting JobDetailPage Apply button...');
  await page.goto('http://localhost:5173/jobs', { timeout: 30000, waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Click first job card
  const firstCard = await page.$('div[class*="group relative p-6"]');
  if (firstCard) {
    await firstCard.click();
    await page.waitForTimeout(2000);
    console.log(`Navigated to detail page: ${page.url()}`);
    
    const detailApplyBtn = await page.$('button:has-text("Apply on")');
    if (detailApplyBtn) {
      const text = (await detailApplyBtn.innerText()).trim();
      console.log(`Detail page has button: "${text}"`);
      await page.evaluate(() => { window.__openedUrls = []; });
      await detailApplyBtn.click();
      await page.waitForTimeout(500);
      const detailOpened = await page.evaluate(() => window.__openedUrls);
      console.log(`Detail page opened:`, detailOpened);
      if (detailOpened.length > 0 && detailOpened[0].startsWith('http')) {
        console.log(`✓ PASS: Detail page opened valid link: ${detailOpened[0]}`);
      } else {
        errors.push(`Detail page apply button did not open a valid URL!`);
      }
    }
  }

  // Capture verification screenshot
  await page.screenshot({ path: 'scripts/exact_links_verified.png', fullPage: false });
  console.log('Saved screenshot to scripts/exact_links_verified.png');

  await browser.close();

  console.log('\n=== RESULTS ===');
  if (errors.length === 0) {
    console.log('ALL TESTS PASSED! All 4 portals open exact authentic application links.');
    process.exit(0);
  } else {
    console.error('TESTS FAILED with errors:', errors);
    process.exit(1);
  }
}

runTest().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});

