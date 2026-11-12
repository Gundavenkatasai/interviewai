const axios = require('axios');
const cheerio = require('cheerio'); // if available or regex

async function inspectUnstop() {
  console.log('=== INSPECTING UNSTOP ===');
  const res = await axios.get('https://unstop.com/api/public/opportunity/search-result?opportunity=internships&per_page=3');
  const items = res.data?.data?.data || [];
  console.log(`Unstop items (${items.length}):`);
  items.forEach(it => {
    console.log({
      id: it.id,
      title: it.title,
      company: it.organisation?.name || it.organisation_name || it.subtitle,
      url: `https://unstop.com/${it.public_url}`,
      region: it.region,
      updated_at: it.updated_at,
      filters: it.filters
    });
  });
}

async function inspectFreshersworld() {
  console.log('\n=== INSPECTING FRESHERSWORLD ===');
  const res = await axios.get('https://www.freshersworld.com/jobs/jobsearch/internship-jobs', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  // Match job blocks or links
  const jobLinks = [...html.matchAll(/<a[^>]+href="([^"]*\/jobs\/[a-z0-9-]+-(\d{4,8}))"[^>]*>([^<]+)<\/a>/gi)];
  console.log(`Found ${jobLinks.length} job link matches in Freshersworld.`);
  jobLinks.slice(0, 3).forEach(m => {
    console.log({ href: m[1], id: m[2], title: m[3].trim() });
  });

  // Let's inspect job container patterns
  const titles = [...html.matchAll(/class="[^"]*job-title[^"]*"[^>]*>([^<]+)</gi)];
  console.log('Job title classes:', titles.slice(0, 3).map(m => m[1].trim()));
  const companies = [...html.matchAll(/class="[^"]*company-name[^"]*"[^>]*>([^<]+)</gi)];
  console.log('Company classes:', companies.slice(0, 3).map(m => m[1].trim()));
}

async function inspectLetsIntern() {
  console.log('\n=== INSPECTING LETSINTERN.IN ===');
  const res = await axios.get('https://letsintern.in/category/internships/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  const articles = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
  console.log(`Found ${articles.length} articles on LetsIntern.in:`);
  articles.slice(0, 3).forEach(a => {
    const titleMatch = a[1].match(/<h2[^>]*><a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h2>/i);
    const dateMatch = a[1].match(/<time[^>]+datetime="([^"]+)"[^>]*>([^<]+)<\/time>/i);
    console.log({
      title: titleMatch ? titleMatch[2].trim() : 'N/A',
      url: titleMatch ? titleMatch[1] : 'N/A',
      date: dateMatch ? dateMatch[1] : 'N/A'
    });
  });
}

async function inspectYouth4work() {
  console.log('\n=== INSPECTING YOUTH4WORK ===');
  const res = await axios.get('https://www.cos.youth4work.com/Jobs', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  // Look for job blocks
  const jobLinks = [...html.matchAll(/<a[^>]+href="(\/Jobs\/[^\"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  console.log(`Found ${jobLinks.length} job links on Youth4work.`);
  jobLinks.slice(0, 3).forEach(m => {
    console.log({ href: 'https://www.cos.youth4work.com' + m[1], text: m[2].replace(/<[^>]+>/g, '').trim() });
  });
}

async function inspectFoundit() {
  console.log('\n=== INSPECTING FOUNDIT FRESHER ===');
  const res = await axios.get('https://www.foundit.in/fresher-jobs', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  // Check if __NEXT_DATA__ exists
  const nextData = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextData) {
    try {
      const parsed = JSON.parse(nextData[1]);
      console.log('Foundit __NEXT_DATA__ keys:', Object.keys(parsed));
      console.log('pageProps keys:', Object.keys(parsed.props?.pageProps || {}));
      const jobs = parsed.props?.pageProps?.initialData?.jobs || parsed.props?.pageProps?.jobs || [];
      console.log(`Found ${jobs.length} jobs in __NEXT_DATA__`);
      if (jobs.length > 0) {
        console.log('Sample Foundit job:', {
          id: jobs[0].jobId || jobs[0].id,
          title: jobs[0].title,
          company: jobs[0].company?.name || jobs[0].companyName,
          location: jobs[0].locations?.[0]?.city || jobs[0].location
        });
      }
    } catch (e) {
      console.log('Error parsing __NEXT_DATA__:', e.message);
    }
  } else {
    console.log('No __NEXT_DATA__ found. Matching job titles:');
    const titles = [...html.matchAll(/class="[^"]*jobTitle[^"]*"[^>]*>([^<]+)</gi)];
    console.log('Titles:', titles.slice(0, 3).map(m => m[1].trim()));
  }
}

async function run() {
  try { await inspectUnstop(); } catch(e) { console.error('Unstop err', e.message); }
  try { await inspectFreshersworld(); } catch(e) { console.error('FW err', e.message); }
  try { await inspectLetsIntern(); } catch(e) { console.error('LetsIntern err', e.message); }
  try { await inspectYouth4work(); } catch(e) { console.error('Y4W err', e.message); }
  try { await inspectFoundit(); } catch(e) { console.error('Foundit err', e.message); }
}

run();

