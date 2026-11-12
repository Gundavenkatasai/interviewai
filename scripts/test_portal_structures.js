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

  console.log('--- Testing Indeed India ---');
  try {
    await page.goto('https://in.indeed.com/jobs?q=software+engineer&l=Bengaluru%2C+Karnataka&fromage=3', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    console.log('Indeed title:', await page.title());
    const indeedLinks = await page.$$eval('a[href*="/rc/clk"], a[href*="/viewjob"]', links =>
      links.map(a => ({ text: a.innerText.trim(), href: a.href })).filter(x => x.text.length > 2)
    );
    console.log('Indeed links count:', indeedLinks.length);
    console.log('Sample Indeed links:', JSON.stringify(indeedLinks.slice(0, 5), null, 2));
  } catch (e) {
    console.log('Indeed error:', e.message);
  }

  console.log('--- Testing Glassdoor India ---');
  try {
    await page.goto('https://www.glassdoor.co.in/Job/india-software-engineer-jobs-SRCH_IL.0,5_IN115_KO6,23.htm', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    console.log('Glassdoor title:', await page.title());
    const gdLinks = await page.$$eval('a[href*="/job-listing/"], a[href*="/partner/jobListing"]', links =>
      links.map(a => ({ text: a.innerText.trim(), href: a.href })).filter(x => x.text.length > 2)
    );
    console.log('Glassdoor links count:', gdLinks.length);
    console.log('Sample Glassdoor links:', JSON.stringify(gdLinks.slice(0, 5), null, 2));
  } catch (e) {
    console.log('Glassdoor error:', e.message);
  }

  console.log('--- Testing Naukri Campus ---');
  try {
    await page.goto('https://www.naukri.com/campus', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    console.log('Naukri Campus title:', await page.title());
    console.log('Naukri Campus URL:', page.url());
    const campusLinks = await page.$$eval('a[href*="campus"], a[href*="job-listings"]', links =>
      links.map(a => ({ text: a.innerText.trim(), href: a.href })).filter(x => x.text.length > 2)
    );
    console.log('Campus links count:', campusLinks.length);
    console.log('Sample Campus links:', JSON.stringify(campusLinks.slice(0, 5), null, 2));
  } catch (e) {
    console.log('Naukri Campus error:', e.message);
  }

  await browser.close();
})();

