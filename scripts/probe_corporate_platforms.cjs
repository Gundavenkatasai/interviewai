const axios = require('axios');

async function testLinkedIn() {
  console.log('--- TESTING LINKEDIN GUEST API ---');
  try {
    const url = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=software%20intern&location=India&start=0';
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    console.log('LinkedIn status:', res.status, 'Len:', res.data.length);
    const matches = [...res.data.matchAll(/<h3 class="base-search-card__title">([\s\S]*?)<\/h3>/gi)];
    console.log(`Found ${matches.length} job titles on LinkedIn:`);
    matches.slice(0, 5).forEach(m => console.log(' - ' + m[1].trim()));

    const compMatches = [...res.data.matchAll(/<h4 class="base-search-card__subtitle">([\s\S]*?)<\/h4>/gi)];
    console.log('Sample companies:', compMatches.slice(0, 3).map(m => m[1].replace(/<[^>]+>/g, '').trim()));

    const linkMatches = [...res.data.matchAll(/<a class="base-card__full-link[^"]*" href="([^"]+)"/gi)];
    console.log('Sample links:', linkMatches.slice(0, 3).map(m => m[1].split('?')[0]));
  } catch (e) {
    console.log('LinkedIn error:', e.message, e.response?.status);
  }
}

async function testIndeedRSS() {
  console.log('\n--- TESTING INDEED RSS / FEED ---');
  try {
    const url = 'https://in.indeed.com/rss?q=software+intern&l=India';
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    console.log('Indeed RSS status:', res.status, 'Len:', res.data.length);
    const items = [...res.data.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    console.log(`Found ${items.length} items in Indeed RSS:`);
    items.slice(0, 3).forEach(it => {
      const title = it[1].match(/<title>([\s\S]*?)<\/title>/i);
      const link = it[1].match(/<link>([\s\S]*?)<\/link>/i);
      console.log(' -', title ? title[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : 'N/A', '-->', link ? link[1].trim() : 'N/A');
    });
  } catch (e) {
    console.log('Indeed RSS error:', e.message, e.response?.status);
  }
}

async function testTimesJobs() {
  console.log('\n--- TESTING TIMESJOBS ---');
  try {
    const url = 'https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&txtKeywords=Software+Engineer&cboPresLocation=India';
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    console.log('TimesJobs status:', res.status, 'Len:', res.data.length);
    const titles = [...res.data.matchAll(/<h2[^>]*><a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>/gi)];
    console.log(`Found ${titles.length} titles on TimesJobs:`);
    titles.slice(0, 3).forEach(t => console.log(' -', t[2].replace(/<[^>]+>/g, '').trim(), '-->', t[1]));
  } catch (e) {
    console.log('TimesJobs error:', e.message, e.response?.status);
  }
}

async function testNaukriCampus() {
  console.log('\n--- TESTING NAUKRI CAMPUS ---');
  try {
    const url = 'https://www.naukri.com/naukri-campus';
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    console.log('Naukri Campus status:', res.status, 'Len:', res.data.length);
    const preview = res.data.slice(0, 300).replace(/\s+/g, ' ');
    console.log('Naukri Campus preview:', preview);
  } catch (e) {
    console.log('Naukri Campus error:', e.message, e.response?.status);
  }
}

async function run() {
  await testLinkedIn();
  await testIndeedRSS();
  await testTimesJobs();
  await testNaukriCampus();
}

run();

