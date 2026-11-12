const axios = require('axios');

async function testUrl(name, url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });
    console.log(`[${name}] Status: ${res.status}, Len: ${res.data.length}`);
    return res.data;
  } catch (e) {
    console.log(`[${name}] Failed: ${e.message} (status: ${e.response?.status})`);
    return null;
  }
}

async function run() {
  console.log('--- TESTING NAUKRI CAMPUS VARIANTS ---');
  await testUrl('Naukri Campus 1', 'https://campus.naukri.com/');
  await testUrl('Naukri Campus 2', 'https://www.naukri.com/campus-jobs');
  await testUrl('Naukri Fresher', 'https://www.naukri.com/fresher-jobs');

  console.log('\n--- TESTING INDEED INDIA ---');
  await testUrl('Indeed India', 'https://in.indeed.com/q-software-engineer-intern-jobs.html');

  console.log('\n--- TESTING GLASSDOOR INDIA ---');
  await testUrl('Glassdoor India', 'https://www.glassdoor.co.in/Job/india-software-engineer-jobs-SRCH_IL.0,5_IN115_KO6,23.htm');

  console.log('\n--- TESTING TIMESJOBS HTML ---');
  const tjHtml = await testUrl('TimesJobs', 'https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&txtKeywords=IT+Software&cboPresLocation=India');
  if (tjHtml) {
    console.log('TJ HTML snippet:', tjHtml.slice(0, 500).replace(/\s+/g, ' '));
    // check classes
    const classes = [...tjHtml.matchAll(/class="([^"]*job[^"]*)"/gi)].map(m => m[1]);
    console.log('TJ classes with job:', [...new Set(classes)].slice(0, 10));
  }
}

run();

