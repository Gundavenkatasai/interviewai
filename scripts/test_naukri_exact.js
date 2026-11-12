const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const testUrl = 'https://www.naukri.com/job-listings-software-engineer-cisco-bengaluru-2-to-3-years-111126502684';
  await page.goto(testUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('Title:', await page.title());
  console.log('Final URL:', page.url());
  const applyText = await page.innerText('body');
  console.log('Page has Apply button/text:', applyText.includes('Apply'));
  await browser.close();
})();

