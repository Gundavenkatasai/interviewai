const { chromium } = require('playwright');

async function testLinks() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });

  const testUrls = [
    { source: 'Naukri', url: 'https://www.naukri.com/job-listings-software-engineer-cisco-bengaluru-2-to-3-years-111126502684' },
    { source: 'Indeed', url: 'https://in.indeed.com/viewjob?jk=9586d62f128eaf63' },
    { source: 'Glassdoor', url: 'https://www.glassdoor.co.in/job-listing/sr-engineer-ii-c-developer-aristocrat-JV_IC4477468_KO0,26_KE27,37.htm?jl=1010313563018' },
    { source: 'Naukri Campus', url: 'https://www.naukri.com/job-listings-inside-sales-associate-delhivery-chandigarh-bengaluru-0-to-4-years-270826019158' }
  ];

  for (const t of testUrls) {
    const page = await context.newPage();
    try {
      console.log(`Checking ${t.source}: ${t.url}`);
      const resp = await page.goto(t.url, { timeout: 25000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const title = await page.title();
      const currentUrl = page.url();
      console.log(`[${t.source}] HTTP: ${resp?.status()}, Title: "${title}", Final URL: ${currentUrl}`);
    } catch (e) {
      console.log(`[${t.source}] Error:`, e.message);
    }
    await page.close();
  }

  await browser.close();
}

testLinks().catch(console.error);

