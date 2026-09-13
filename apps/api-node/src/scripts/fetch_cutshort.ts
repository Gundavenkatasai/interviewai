import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto("https://cutshort.io/jobs", { waitUntil: 'networkidle2' });
  console.log("Final URL:", page.url());
  
  const html = await page.content();
  fs.writeFileSync('cutshort_dom.html', html);
  console.log("HTML written to cutshort_dom.html, length:", html.length);
  
  await browser.close();
}

run().catch(console.error);
