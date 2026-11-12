const { chromium } = require('playwright');

async function testNaukriCampus() {
  console.log('--- Testing Naukri Campus in Edge ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://www.naukri.com/campus-jobs', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    const title = await page.title();
    console.log('Naukri Campus Title:', title);

    const cards = await page.$$eval('[class*="srp-jobtuple"], [class*="jobTuple"], article, .row', els => {
      return els.map(e => {
        const titleEl = e.querySelector('a.title, [class*="title"], h2, h3');
        const compEl = e.querySelector('a.comp-name, [class*="comp-name"], [class*="company"]');
        return {
          title: titleEl?.innerText?.trim(),
          company: compEl?.innerText?.trim(),
          href: titleEl?.getAttribute('href')
        };
      }).filter(c => c.title && c.title.length > 3);
    });

    console.log(`Found ${cards.length} cards on Naukri Campus:`);
    console.log(cards.slice(0, 3));
  } catch (e) {
    console.log('Naukri Campus error:', e.message);
  } finally {
    await browser.close();
  }
}

async function testTimesJobs() {
  console.log('\n--- Testing TimesJobs in Edge ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&txtKeywords=IT+Software&cboPresLocation=India', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    const title = await page.title();
    console.log('TimesJobs Title:', title);

    const jobs = await page.$$eval('a[href*="/job-detail/"], [class*="job-tuple"], h2 a', els => {
      return els.map(e => ({
        text: e.innerText.trim(),
        href: e.getAttribute('href')
      })).filter(j => j.text.length > 5);
    });
    console.log(`Found ${jobs.length} jobs on TimesJobs:`);
    console.log(jobs.slice(0, 3));
  } catch (e) {
    console.log('TimesJobs error:', e.message);
  } finally {
    await browser.close();
  }
}

async function run() {
  await testNaukriCampus();
  await testTimesJobs();
}

run();

