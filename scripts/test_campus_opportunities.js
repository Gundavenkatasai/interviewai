const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('--- Testing Naukri Campus Opportunities ---');
  try {
    await page.goto('https://www.naukri.com/campus/opportunities', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    console.log('Naukri Campus Opportunities title:', await page.title());
    console.log('Final URL:', page.url());
    const oppLinks = await page.$$eval('a[href*="campus"], a[href*="job-listings"], a[href*="drive"]', links =>
      links.map(a => ({ text: a.innerText.trim(), href: a.href })).filter(x => x.text.length > 2)
    );
    console.log('Campus opportunities count:', oppLinks.length);
    console.log('Sample campus opp links:', JSON.stringify(oppLinks.slice(0, 10), null, 2));
  } catch (e) {
    console.log('Campus error:', e.message);
  }

  await browser.close();
})();

