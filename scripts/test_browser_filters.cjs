const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser to test http://localhost:5173/jobs...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Listen to console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  console.log('Navigating to http://localhost:5173/jobs ...');
  await page.goto('http://localhost:5173/jobs', { waitUntil: 'networkidle' });

  // 1. Initial State
  const initialTitle = await page.title();
  console.log('Page Title:', initialTitle);

  // Wait for job cards to render
  await page.waitForSelector('h3');
  const initialCardsCount = await page.locator('h3').count();
  console.log('Initial job cards visible:', initialCardsCount);

  // 2. Click "Last 24 Hours" button
  console.log('Clicking "Last 24 Hours" freshness filter...');
  const recency24hBtn = page.locator('#filter-recency-24h');
  await recency24hBtn.click();
  
  // Wait for network/rerender
  await page.waitForTimeout(1500);

  // Collect all timestamp badges from the rendered cards
  const timeBadges = await page.$$eval('span.text-\\[11px\\]', spans => 
    spans.map(s => s.innerText.trim()).filter(t => t.includes('ago') || t.includes('Just now') || t.includes('d') || t.includes('w'))
  );
  console.log('Filtered 24h Relative Time Badges found on page:', timeBadges.slice(0, 10));

  // Check if any badge has "2d", "3d", "4d", "5d", "6d", "w", "mo", "y", "Yesterday" or "2 days"
  const badBadges = timeBadges.filter(t => 
    /\b([2-9]|[1-9]\d+)d\b/i.test(t) || 
    /\b\d+w\b/i.test(t) || 
    /\b\d+mo\b/i.test(t) || 
    /yesterday/i.test(t) || 
    /week/i.test(t) || 
    /day/i.test(t)
  );

  console.log('Bad badges (should be 0):', badBadges);

  // 3. Test Track Filter: Click "Frontend"
  console.log('Testing Track Filter: Selecting "Frontend"...');
  const frontendBtn = page.locator('button:has-text("Frontend")').first();
  await frontendBtn.click();
  await page.waitForTimeout(1500);

  const frontendTitles = await page.$$eval('h3', headings => 
    headings.map(h => h.innerText.trim()).slice(0, 6)
  );
  console.log('Frontend Track Job Titles:', frontendTitles);

  // 4. Test Track Filter: Click "Backend"
  console.log('Deselecting Frontend and Selecting "Backend"...');
  await frontendBtn.click(); // deselect
  const backendBtn = page.locator('button:has-text("Backend")').first();
  await backendBtn.click();
  await page.waitForTimeout(1500);

  const backendTitles = await page.$$eval('h3', headings => 
    headings.map(h => h.innerText.trim()).slice(0, 6)
  );
  console.log('Backend Track Job Titles:', backendTitles);

  // 5. Test Track Filter: Click "QA / Testing"
  console.log('Deselecting Backend and Selecting "QA / Testing"...');
  await backendBtn.click(); // deselect
  const qaBtn = page.locator('button:has-text("QA / Testing")').first();
  await qaBtn.click();
  await page.waitForTimeout(1500);

  const qaTitles = await page.$$eval('h3', headings => 
    headings.map(h => h.innerText.trim()).slice(0, 6)
  );
  console.log('QA Track Job Titles:', qaTitles);

  // Take screenshot of the QA filter view
  await page.screenshot({ path: 'scripts/jobs_qa_filtered.png' });
  console.log('Screenshot saved to scripts/jobs_qa_filtered.png');

  // Switch back to 24 Hours clean view and screenshot
  await qaBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scripts/jobs_24h_filtered.png' });
  console.log('Screenshot saved to scripts/jobs_24h_filtered.png');

  await browser.close();
  console.log('Browser tests completed successfully!');
})();
