const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('--- Testing Naukri ---');
  try {
    await page.goto('https://www.naukri.com/software-engineer-jobs', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const title = await page.title();
    console.log('Naukri page title:', title);
    const naukriLinks = await page.$$eval('a[href*="job-listings"]', links =>
      links.map(a => ({ text: a.innerText.trim(), href: a.href })).filter(x => x.text.length > 2)
    );
    console.log('Naukri real job links count:', naukriLinks.length);
    console.log('Sample Naukri links:', JSON.stringify(naukriLinks.slice(0, 10), null, 2));
  } catch (e) {
    console.log('Naukri error:', e.message);
  }

  await browser.close();
})();
