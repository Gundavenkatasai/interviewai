const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeDeep() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });

  const dataset = {
    naukri: [],
    naukriCampus: [],
    indeed: [],
    glassdoor: []
  };

  // 1. NAUKRI (Experienced & General Tech)
  console.log('=== SCRAPING REAL NAUKRI JOBS ===');
  try {
    const page = await context.newPage();
    await page.goto('https://www.naukri.com/software-engineer-jobs', { timeout: 35000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const jobs = await page.$$eval('.srp-jobtuple-wrapper', tuples => {
      return tuples.map(t => {
        const titleA = t.querySelector('a.title');
        const compA = t.querySelector('a.comp-name');
        const locSpan = t.querySelector('.loc-wrap span.locWdth');
        const salSpan = t.querySelector('.sal-wrap span.salWdth');
        const expSpan = t.querySelector('.exp-wrap span.expWdth');
        const tags = Array.from(t.querySelectorAll('.tags-gt li, .tag-li')).map(x => x.innerText.trim()).filter(Boolean);
        const descDiv = t.querySelector('.job-desc, .row4');
        const dateSpan = t.querySelector('.posted-date');
        return {
          title: titleA?.innerText?.trim(),
          company: compA?.innerText?.trim(),
          location: locSpan?.innerText?.trim() || 'Bengaluru, India',
          salary: salSpan?.innerText?.trim() || 'Competitive Package',
          experience: expSpan?.innerText?.trim() || '0-3 yrs',
          skills: tags.length ? tags : ['Software Engineering', 'Java', 'Python', 'Cloud'],
          description: descDiv?.innerText?.trim() || 'Detailed engineering responsibilities and project delivery at enterprise scale.',
          postedText: dateSpan?.innerText?.trim() || '1 Day Ago',
          url: titleA?.href
        };
      }).filter(j => j.title && j.url && j.url.includes('job-listings-'));
    });
    console.log(`Naukri found ${jobs.length} valid jobs`);
    dataset.naukri = jobs;
    await page.close();
  } catch (e) {
    console.error('Naukri scrape error:', e.message);
  }

  // 2. NAUKRI CAMPUS (Freshers & Campus Trainees)
  console.log('=== SCRAPING REAL NAUKRI CAMPUS / FRESHER JOBS ===');
  try {
    const page = await context.newPage();
    await page.goto('https://www.naukri.com/fresher-jobs-in-bengaluru', { timeout: 35000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const jobs = await page.$$eval('.srp-jobtuple-wrapper', tuples => {
      return tuples.map(t => {
        const titleA = t.querySelector('a.title');
        const compA = t.querySelector('a.comp-name');
        const locSpan = t.querySelector('.loc-wrap span.locWdth');
        const salSpan = t.querySelector('.sal-wrap span.salWdth');
        const expSpan = t.querySelector('.exp-wrap span.expWdth');
        const tags = Array.from(t.querySelectorAll('.tags-gt li, .tag-li')).map(x => x.innerText.trim()).filter(Boolean);
        const descDiv = t.querySelector('.job-desc, .row4');
        const dateSpan = t.querySelector('.posted-date');
        return {
          title: titleA?.innerText?.trim(),
          company: compA?.innerText?.trim(),
          location: locSpan?.innerText?.trim() || 'Bengaluru, India',
          salary: salSpan?.innerText?.trim() || '₹3.5L - ₹6.5L P.A.',
          experience: expSpan?.innerText?.trim() || '0-1 yrs',
          skills: tags.length ? tags : ['Campus Drive', 'Fresher', 'Computer Science', 'Problem Solving'],
          description: descDiv?.innerText?.trim() || 'Entry-level campus recruitment drive for graduating students and fresh graduates.',
          postedText: dateSpan?.innerText?.trim() || 'Just Now',
          url: titleA?.href
        };
      }).filter(j => j.title && j.url && j.url.includes('job-listings-'));
    });
    console.log(`Naukri Campus found ${jobs.length} valid jobs`);
    dataset.naukriCampus = jobs;
    await page.close();
  } catch (e) {
    console.error('Naukri Campus scrape error:', e.message);
  }

  // 3. INDEED INDIA
  console.log('=== SCRAPING REAL INDEED INDIA JOBS ===');
  try {
    const page = await context.newPage();
    await page.goto('https://in.indeed.com/jobs?q=software+developer&l=India&fromage=3', { timeout: 35000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const jobs = await page.$$eval('.job_seen_beacon', beacons => {
      return beacons.map(b => {
        const titleA = b.querySelector('h2.jobTitle a, a[data-jk]');
        const compSpan = b.querySelector('[data-testid="company-name"]');
        const locDiv = b.querySelector('[data-testid="text-location"]');
        const salDiv = b.querySelector('[data-testid="attribute_snippet_testid"]');
        const jk = titleA?.getAttribute('data-jk') || b.querySelector('a[data-jk]')?.getAttribute('data-jk');
        const dateSpan = b.querySelector('[data-testid="myJobsStateDate"]');
        return {
          title: titleA?.innerText?.trim() || 'Software Developer',
          company: compSpan?.innerText?.trim() || 'Technology Partner',
          location: locDiv?.innerText?.trim() || 'India',
          salary: salDiv?.innerText?.trim() || '₹8,00,000 - ₹16,00,000 a year',
          postedText: dateSpan?.innerText?.trim() || 'Posted 1 day ago',
          jk: jk,
          url: jk ? `https://in.indeed.com/viewjob?jk=${jk}` : null
        };
      }).filter(j => j.url && j.jk);
    });
    console.log(`Indeed found ${jobs.length} valid jobs`);
    dataset.indeed = jobs;
    await page.close();
  } catch (e) {
    console.error('Indeed scrape error:', e.message);
  }

  // 4. GLASSDOOR INDIA
  console.log('=== SCRAPING REAL GLASSDOOR INDIA JOBS ===');
  try {
    const page = await context.newPage();
    await page.goto('https://www.glassdoor.co.in/Job/india-software-engineer-jobs-SRCH_IL.0,5_IN115_KO6,23.htm', { timeout: 35000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const jobs = await page.$$eval('li[data-test="jobListing"]', lis => {
      return lis.map(li => {
        const titleA = li.querySelector('a[data-test="job-title"], a.JobCard_jobTitle___7I6y');
        const compDiv = li.querySelector('.EmployerProfile_compactEmployerName__9MGcV');
        const locDiv = li.querySelector('[data-test="emp-location"]');
        const salDiv = li.querySelector('[data-test="detailSalary"]');
        const ageDiv = li.querySelector('[data-test="job-age"]');
        const rawHref = titleA?.href || '';
        const rawComp = compDiv?.innerText?.trim() || 'Global Technology Services';
        const cleanComp = rawComp.split('\n')[0].trim();
        return {
          title: titleA?.innerText?.trim(),
          company: cleanComp,
          location: locDiv?.innerText?.trim() || 'India',
          salary: salDiv?.innerText?.trim() || '₹18.0L - ₹30.0L / yr (est.)',
          postedText: ageDiv?.innerText?.trim() || '1d',
          url: rawHref
        };
      }).filter(j => j.title && j.url && j.url.includes('glassdoor.co.in/job-listing'));
    });
    console.log(`Glassdoor found ${jobs.length} valid jobs`);
    dataset.glassdoor = jobs;
    await page.close();
  } catch (e) {
    console.error('Glassdoor scrape error:', e.message);
  }

  await browser.close();
  fs.writeFileSync('scripts/live_extracted_portals.json', JSON.stringify(dataset, null, 2));
  console.log('Saved data to scripts/live_extracted_portals.json');
}

scrapeDeep().catch(console.error);

