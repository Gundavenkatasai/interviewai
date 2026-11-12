const { chromium } = require('playwright');

async function sniff(url, name) {
  console.log(`\n=== Sniffing network for ${name} (${url}) ===`);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const apiCalls = [];

  page.on('response', async resp => {
    const u = resp.url();
    const ct = resp.headers()['content-type'] || '';
    if (ct.includes('application/json') || u.includes('/api/') || u.includes('/search') || u.includes('opportunity') || u.includes('job') || u.includes('intern')) {
      if (!u.includes('.js') && !u.includes('.css') && !u.includes('.png') && !u.includes('.svg') && !u.includes('.woff')) {
        try {
          const body = await resp.text();
          apiCalls.push({ url: u, status: resp.status(), length: body.length, snippet: body.slice(0, 200).replace(/\s+/g, ' ') });
        } catch (_) {}
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  } catch (e) {
    console.log(`Nav error: ${e.message}`);
  }

  console.log(`Captured ${apiCalls.length} API/Data responses for ${name}:`);
  apiCalls.slice(0, 10).forEach(c => {
    console.log(`-> [${c.status}] ${c.url}\n   Body: ${c.snippet}`);
  });

  await browser.close();
}

async function run() {
  await sniff('https://internship.aicte-india.org/internships', 'AICTE');
  await sniff('https://www.foundit.in/search/internship-jobs', 'Foundit');
  await sniff('https://www.cos.youth4work.com/Jobs', 'Youth4work');
}

run();

