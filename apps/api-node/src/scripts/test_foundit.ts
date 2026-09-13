import puppeteer from 'puppeteer';

async function testFoundit() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto("https://www.foundit.in/srp/results?query=software-engineer", { waitUntil: 'networkidle2', timeout: 30000 });
  const html = await page.content();
  console.log("HTML length:", html.length);
  
  const cards = await page.$$eval('.srpResultCardContainer', els => els.length);
  console.log("Cards found:", cards);
  
  await browser.close();
}

testFoundit().catch(console.error);
