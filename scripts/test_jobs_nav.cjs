const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/jobs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('Current URL:', page.url());
  console.log('H1 text:', await page.locator('h1').allTextContents());
  console.log('Job count text:', await page.locator("p:has-text('Displaying')").textContent().catch(() => 'Not found'));
  const cards = await page.locator("h3").allTextContents();
  console.log(`Cards count: ${cards.length}`);
  if (cards.length > 0) {
    console.log('Sample cards:', cards.slice(0, 3));
  }
  await browser.close();
})();

