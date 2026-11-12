const { chromium } = require('playwright');

async function testFoundit() {
  console.log('Testing Foundit via Playwright Edge...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://www.foundit.in/fresher-jobs', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(4000);
    const title = await page.title();
    console.log('Foundit Page Title:', title);

    const jobs = await page.$$eval('.card, [class*="cardContainer"], [class*="jobCard"]', cards => {
      return cards.map(c => {
        const titleEl = c.querySelector('h3, [class*="title"], a');
        const compEl = c.querySelector('[class*="company"], [class*="recruiter"]');
        const linkEl = c.querySelector('a[href*="/job/"], a[href*="/seeker/"]');
        return {
          title: titleEl?.innerText?.trim(),
          company: compEl?.innerText?.trim(),
          href: linkEl?.getAttribute('href')
        };
      }).filter(j => j.title && j.title.length > 3);
    });

    console.log(`Extracted ${jobs.length} jobs from Foundit:`);
    console.log(jobs.slice(0, 3));
  } catch (e) {
    console.log('Foundit error:', e.message);
  } finally {
    await browser.close();
  }
}

async function testYouth4work() {
  console.log('\nTesting Youth4work via Playwright Edge...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://www.cos.youth4work.com/Jobs', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    const title = await page.title();
    console.log('Y4W Page Title:', title);

    const jobs = await page.$$eval('[class*="job"], [class*="listing"], [class*="card"]', els => {
      return els.map(el => {
        const titleEl = el.querySelector('a[href*="/Jobs/"], h3, h4');
        const link = el.querySelector('a[href*="/Jobs/"]');
        return {
          title: titleEl?.innerText?.trim(),
          href: link?.getAttribute('href')
        };
      }).filter(j => j.title && j.title.length > 5);
    });

    console.log(`Extracted ${jobs.length} jobs from Youth4work:`);
    console.log(jobs.slice(0, 3));
  } catch (e) {
    console.log('Y4W error:', e.message);
  } finally {
    await browser.close();
  }
}

async function run() {
  await testFoundit();
  await testYouth4work();
}

run();

