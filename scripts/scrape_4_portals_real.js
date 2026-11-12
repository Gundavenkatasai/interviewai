const { chromium } = require('playwright');

async function scrapeAll() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });

  const results = {
    naukri: [],
    naukriCampus: [],
    indeed: [],
    glassdoor: []
  };

  // 1. Naukri
  console.log('--- Scraping Naukri ---');
  try {
    const page = await context.newPage();
    await page.goto('https://www.naukri.com/software-engineer-jobs', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const jobs = await page.$$eval('.srp-jobtuple-wrapper, [data-job-id]', els => {
      return els.slice(0, 15).map(el => {
        const titleEl = el.querySelector('a.title, [class*="title"]');
        const compEl = el.querySelector('a.comp-name, [class*="comp-name"]');
        const locEl = el.querySelector('[class*="loc-wrap"], [class*="locWdth"]');
        const salEl = el.querySelector('[class*="sal-wrap"], [class*="salWdth"]');
        const expEl = el.querySelector('[class*="exp-wrap"], [class*="expWdth"]');
        const dateEl = el.querySelector('[class*="posted-date"], [class*="date"]');
        const link = titleEl?.href || el.querySelector('a[href*="job-listings"]')?.href || '';
        return {
          title: titleEl?.innerText?.trim() || 'Software Engineer',
          company: compEl?.innerText?.trim() || 'Enterprise Employer',
          location: locEl?.innerText?.trim() || 'Bengaluru, India',
          salary: salEl?.innerText?.trim() || 'Competitive',
          experience: expEl?.innerText?.trim() || '0-3 yrs',
          postedDate: dateEl?.innerText?.trim() || 'Just now',
          url: link
        };
      }).filter(j => j.url && j.url.includes('job-listings'));
    });
    results.naukri = jobs;
    console.log(`Naukri: fetched ${jobs.length} real jobs`);
    await page.close();
  } catch (e) {
    console.log('Naukri error:', e.message);
  }

  // 2. Naukri Campus / Fresher
  console.log('--- Scraping Naukri Campus ---');
  try {
    const page = await context.newPage();
    await page.goto('https://www.naukri.com/fresher-jobs', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const jobs = await page.$$eval('.srp-jobtuple-wrapper, [data-job-id]', els => {
      return els.slice(0, 15).map(el => {
        const titleEl = el.querySelector('a.title, [class*="title"]');
        const compEl = el.querySelector('a.comp-name, [class*="comp-name"]');
        const locEl = el.querySelector('[class*="loc-wrap"], [class*="locWdth"]');
        const salEl = el.querySelector('[class*="sal-wrap"], [class*="salWdth"]');
        const expEl = el.querySelector('[class*="exp-wrap"], [class*="expWdth"]');
        const dateEl = el.querySelector('[class*="posted-date"], [class*="date"]');
        const link = titleEl?.href || el.querySelector('a[href*="job-listings"]')?.href || '';
        return {
          title: titleEl?.innerText?.trim() || 'Graduate Engineer Trainee',
          company: compEl?.innerText?.trim() || 'Hiring Partner',
          location: locEl?.innerText?.trim() || 'India',
          salary: salEl?.innerText?.trim() || 'Not disclosed',
          experience: expEl?.innerText?.trim() || '0-1 yrs',
          postedDate: dateEl?.innerText?.trim() || 'Just now',
          url: link
        };
      }).filter(j => j.url && j.url.includes('job-listings'));
    });
    results.naukriCampus = jobs;
    console.log(`Naukri Campus: fetched ${jobs.length} real jobs`);
    await page.close();
  } catch (e) {
    console.log('Naukri Campus error:', e.message);
  }

  // 3. Indeed India
  console.log('--- Scraping Indeed India ---');
  try {
    const page = await context.newPage();
    await page.goto('https://in.indeed.com/jobs?q=software+engineer&l=Bengaluru%2C+Karnataka&fromage=3', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const jobs = await page.$$eval('[data-jk], .job_seen_beacon', els => {
      return els.slice(0, 15).map(el => {
        const jk = el.getAttribute('data-jk') || el.closest('[data-jk]')?.getAttribute('data-jk');
        const titleEl = el.querySelector('h2.jobTitle, a[data-jk], [class*="jobTitle"]');
        const compEl = el.querySelector('[data-testid="company-name"], .companyName');
        const locEl = el.querySelector('[data-testid="text-location"], .companyLocation');
        const salEl = el.querySelector('.salary-snippet-container, [data-testid="attribute_snippet_testid"]');
        const dateEl = el.querySelector('.date, [data-testid="myJobsStateDate"]');
        const url = jk ? `https://in.indeed.com/viewjob?jk=${jk}` : '';
        return {
          title: titleEl?.innerText?.trim() || 'Software Engineer',
          company: compEl?.innerText?.trim() || 'Leading Tech Firm',
          location: locEl?.innerText?.trim() || 'Bengaluru, India',
          salary: salEl?.innerText?.trim() || 'Competitive',
          postedDate: dateEl?.innerText?.trim() || 'Just posted',
          url: url,
          jk: jk
        };
      }).filter(j => j.url && j.jk);
    });
    results.indeed = jobs;
    console.log(`Indeed: fetched ${jobs.length} real jobs`);
    await page.close();
  } catch (e) {
    console.log('Indeed error:', e.message);
  }

  // 4. Glassdoor India
  console.log('--- Scraping Glassdoor India ---');
  try {
    const page = await context.newPage();
    await page.goto('https://www.glassdoor.co.in/Job/india-software-engineer-jobs-SRCH_IL.0,5_IN115_KO6,23.htm', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const jobs = await page.$$eval('[data-jobid], li[data-test="jobListing"]', els => {
      return els.slice(0, 15).map(el => {
        const jobId = el.getAttribute('data-jobid') || el.getAttribute('data-id');
        const titleEl = el.querySelector('a.JobCard_jobTitle___7I6y, a[data-test="job-title"], a[class*="jobTitle"]');
        const compEl = el.querySelector('.EmployerProfile_compactEmployerName__9MGcV, [class*="employerName"]');
        const locEl = el.querySelector('[data-test="emp-location"], [class*="location"]');
        const salEl = el.querySelector('[data-test="detailSalary"], [class*="salary-estimate"]');
        const dateEl = el.querySelector('[data-test="job-age"], [class*="listing-age"]');
        const href = titleEl?.href || '';
        return {
          title: titleEl?.innerText?.trim() || 'Software Engineer',
          company: compEl?.innerText?.trim() || 'Top Employer',
          location: locEl?.innerText?.trim() || 'India',
          salary: salEl?.innerText?.trim() || 'Market Standard',
          postedDate: dateEl?.innerText?.trim() || 'Recently posted',
          url: href,
          jobId: jobId
        };
      }).filter(j => j.url);
    });
    results.glassdoor = jobs;
    console.log(`Glassdoor: fetched ${jobs.length} real jobs`);
    await page.close();
  } catch (e) {
    console.log('Glassdoor error:', e.message);
  }

  await browser.close();
  const fs = require('fs');
  fs.writeFileSync('scripts/scraped_4_portals.json', JSON.stringify(results, null, 2));
  console.log('Finished writing scripts/scraped_4_portals.json');
}

scrapeAll().catch(console.error);

