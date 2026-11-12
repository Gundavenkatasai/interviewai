const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));
  page.on('response', resp => {
    if (resp.status() >= 400 && resp.url().includes('8001')) {
      errors.push('HTTP_' + resp.status() + ': ' + resp.url());
    }
  });

  await page.goto('http://localhost:5173/jobs', { waitUntil: 'networkidle', timeout: 25000 });
  const indeedBtn = await page.$('button:has-text("Indeed")');
  if (indeedBtn) {
    await indeedBtn.click();
    await page.waitForTimeout(2000);
  }
  const jobCards = await page.$$('div[class*="group relative p-6"]');
  console.log('Indeed job cards visible on screen:', jobCards.length);
  console.log('Network errors encountered:', errors.length === 0 ? 'NONE (100% Clean)' : errors);
  await browser.close();
})();

