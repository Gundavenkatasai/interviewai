import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto("https://wellfound.com/role/l/software-engineer/india", { waitUntil: 'domcontentloaded' });
  
  // Find all links that might be jobs
  const links = await page.$$eval('a', (anchors) => 
    anchors.map(a => a.href).filter(href => href.includes('/jobs/') || href.includes('company'))
  );
  
  console.log("Found links:", links.slice(0, 10));
  
  // Try to find generic job containers
  const containers = await page.$$eval('div', divs => 
    divs.map(d => d.className).filter(c => typeof c === 'string' && c.toLowerCase().includes('job'))
  );
  
  console.log("Job classes:", Array.from(new Set(containers)).slice(0, 10));
  
  await browser.close();
}

run().catch(console.error);
