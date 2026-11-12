const axios = require('axios');

async function inspectFWMarkup() {
  const res = await axios.get('https://www.freshersworld.com/jobs/jobsearch/internship-jobs', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  // Find where company-name appears and print 500 characters around it
  const idx = html.indexOf('company-name');
  if (idx !== -1) {
    console.log('--- FRESHERSWORLD JOB BLOCK ---');
    console.log(html.slice(Math.max(0, idx - 200), idx + 800));
  }
}

async function inspectAICTEMarkup() {
  const res = await axios.get('https://internship.aicte-india.org/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  // Search for internship cards or keywords
  console.log('--- AICTE SEARCH MATCHES ---');
  const matches = [...html.matchAll(/<a[^>]+href="([^"]*internship[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
  console.log(`AICTE internship link matches (${matches.length}):`);
  matches.slice(0, 5).forEach(m => console.log(m[1], m[2].replace(/<[^>]+>/g, '').trim()));

  // Check if there is embedded JSON data in script tags
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    if (s[1].includes('internship') && (s[1].includes('"title"') || s[1].includes('"id"'))) {
      console.log('AICTE script snippet:', s[1].slice(0, 300));
      break;
    }
  }
}

async function inspectYouth4workMarkup() {
  const res = await axios.get('https://www.cos.youth4work.com/Jobs', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  const idx = html.indexOf('job-title');
  if (idx !== -1) {
    console.log('--- YOUTH4WORK JOB BLOCK ---');
    console.log(html.slice(Math.max(0, idx - 100), idx + 500));
  } else {
    // print all hrefs with /job/ or /Jobs/
    const links = [...html.matchAll(/href="([^"]*\/job[s]?\/[^"]+)"/gi)];
    console.log('Y4W job links:', links.slice(0, 10).map(m => m[1]));
  }
}

async function run() {
  await inspectFWMarkup();
  await inspectAICTEMarkup();
  await inspectYouth4workMarkup();
}

run();

