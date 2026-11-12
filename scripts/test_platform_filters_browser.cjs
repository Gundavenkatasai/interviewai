const { chromium } = require('playwright');

(async () => {
  console.log('Testing live Corporate & Internship Platform filters in browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/jobs ...');
  await page.goto('http://localhost:5173/jobs', { waitUntil: 'networkidle' });

  // 1. Initial State
  const initialCardsCount = await page.locator('h3').count();
  console.log('Initial total visible cards:', initialCardsCount);

  // 2. Click "LinkedIn" platform button
  console.log('Clicking "LinkedIn" platform filter...');
  const linkedinBtn = page.locator('button:has-text("LinkedIn")').first();
  await linkedinBtn.click();
  await page.waitForTimeout(1500);

  const linkedinCount = await page.locator('h3').count();
  const linkedinTitles = await page.$$eval('h3', hs => hs.map(h => h.innerText.trim()).slice(0, 3));
  console.log(`LinkedIn Filter active: ${linkedinCount} cards visible. Sample titles:`, linkedinTitles);

  // 3. Click "Naukri"
  console.log('Deselecting LinkedIn and selecting "Naukri"...');
  await linkedinBtn.click();
  const naukriBtn = page.locator('button:has-text("Naukri")').first();
  await naukriBtn.click();
  await page.waitForTimeout(1500);

  const naukriCount = await page.locator('h3').count();
  const naukriTitles = await page.$$eval('h3', hs => hs.map(h => h.innerText.trim()).slice(0, 3));
  console.log(`Naukri Filter active: ${naukriCount} cards visible. Sample titles:`, naukriTitles);

  // 4. Click "Naukri Campus"
  console.log('Deselecting Naukri and selecting "Naukri Campus"...');
  await naukriBtn.click();
  const campusBtn = page.locator('button:has-text("Naukri Campus")').first();
  await campusBtn.click();
  await page.waitForTimeout(1500);

  const campusCount = await page.locator('h3').count();
  const campusTitles = await page.$$eval('h3', hs => hs.map(h => h.innerText.trim()).slice(0, 3));
  console.log(`Naukri Campus Filter active: ${campusCount} cards visible. Sample titles:`, campusTitles);

  // 5. Click "Indeed"
  console.log('Deselecting Naukri Campus and selecting "Indeed"...');
  await campusBtn.click();
  const indeedBtn = page.locator('button:has-text("Indeed")').first();
  await indeedBtn.click();
  await page.waitForTimeout(1500);

  const indeedCount = await page.locator('h3').count();
  const indeedTitles = await page.$$eval('h3', hs => hs.map(h => h.innerText.trim()).slice(0, 3));
  console.log(`Indeed Filter active: ${indeedCount} cards visible. Sample titles:`, indeedTitles);

  // 6. Click "Glassdoor"
  console.log('Deselecting Indeed and selecting "Glassdoor"...');
  await indeedBtn.click();
  const glassdoorBtn = page.locator('button:has-text("Glassdoor")').first();
  await glassdoorBtn.click();
  await page.waitForTimeout(1500);

  const glassdoorCount = await page.locator('h3').count();
  const glassdoorTitles = await page.$$eval('h3', hs => hs.map(h => h.innerText.trim()).slice(0, 3));
  console.log(`Glassdoor Filter active: ${glassdoorCount} cards visible. Sample titles:`, glassdoorTitles);

  // Take screenshot of Glassdoor filtered view
  await page.screenshot({ path: 'scripts/jobs_glassdoor_filtered.png' });
  console.log('Screenshot saved to scripts/jobs_glassdoor_filtered.png');

  // 7. Click "TimesJobs"
  console.log('Deselecting Glassdoor and selecting "TimesJobs"...');
  await glassdoorBtn.click();
  const timesjobsBtn = page.locator('button:has-text("TimesJobs")').first();
  await timesjobsBtn.click();
  await page.waitForTimeout(1500);

  const timesjobsCount = await page.locator('h3').count();
  const timesjobsTitles = await page.$$eval('h3', hs => hs.map(h => h.innerText.trim()).slice(0, 3));
  console.log(`TimesJobs Filter active: ${timesjobsCount} cards visible. Sample titles:`, timesjobsTitles);

  // 8. Click "Foundit"
  console.log('Deselecting TimesJobs and selecting "Foundit"...');
  await timesjobsBtn.click();
  const founditBtn = page.locator('button:has-text("Foundit")').first();
  await founditBtn.click();
  await page.waitForTimeout(1500);

  const founditCount = await page.locator('h3').count();
  const founditTitles = await page.$$eval('h3', hs => hs.map(h => h.innerText.trim()).slice(0, 3));
  console.log(`Foundit Filter active: ${founditCount} cards visible. Sample titles:`, founditTitles);

  // Reset to All Platforms
  const allPlatformsBtn = page.locator('button:has-text("All Platforms")').first();
  await allPlatformsBtn.click();
  await page.waitForTimeout(1500);
  const resetCount = await page.locator('h3').count();
  console.log(`Reset to All Platforms: ${resetCount} cards visible.`);

  await browser.close();
  console.log('All platform browser tests completed successfully!');
})();
