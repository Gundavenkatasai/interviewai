import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testSites() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const sites = [
    "https://wellfound.com/jobs",
    "https://cutshort.io/jobs",
    "https://www.hirist.tech/",
    "https://www.shine.com/job-search",
    "https://www.timesjobs.com/"
  ];
  
  for (const url of sites) {
    console.log(`\nTesting ${url}...`);
    const page = await browser.newPage();
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      console.log(`[SUCCESS] ${url} - Status: ${response?.status()}`);
    } catch (err: any) {
      console.error(`[FAILED] ${url} - ${err.message}`);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
}

testSites().catch(console.error);
