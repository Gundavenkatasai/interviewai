const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.cos.youth4work.com/Jobs', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Print all links with their texts
  const links = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.innerText.trim() })).filter(a => a.text.length > 5 && (a.href.includes('/job') || a.href.includes('/Job'))));
  console.log(`Youth4work relevant links (${links.length}):`);
  console.log(links.slice(0, 10));

  await browser.close();
})();

