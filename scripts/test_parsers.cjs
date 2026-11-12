const axios = require('axios');

async function checkFW() {
  const res = await axios.get('https://www.freshersworld.com/jobs/jobsearch/internship-jobs', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  // Match job-desc-block
  const blocks = html.split('job-desc-block').slice(1);
  console.log(`Freshersworld blocks: ${blocks.length}`);
  for (let i = 0; i < Math.min(3, blocks.length); i++) {
    const b = blocks[i];
    const titleMatch = b.match(/class="[^"]*job-new-title[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const companyMatch = b.match(/class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const linkMatch = b.match(/href="([^"]*\/jobs\/[^"]+)"/i);
    const locMatch = b.match(/class="[^"]*job-location[^"]*"[^>]*>([\s\S]*?)<\/span>/i) || b.match(/class="job-details-span[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    console.log(`FW [${i+1}]`, {
      title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'N/A',
      company: companyMatch ? companyMatch[1].replace(/<[^>]+>/g, '').trim() : 'N/A',
      url: linkMatch ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.freshersworld.com${linkMatch[1]}`) : 'N/A',
      location: locMatch ? locMatch[1].replace(/<[^>]+>/g, '').trim() : 'N/A'
    });
  }
}

async function checkAICTE() {
  const res = await axios.get('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  console.log('AICTE /internships HTML length:', html.length);
  // Match link to individual internship
  const internLinks = [...html.matchAll(/href="(\/internship\/[^"]+|\/internships\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  console.log(`Found ${internLinks.length} internship links in AICTE:`);
  internLinks.slice(0, 3).forEach(m => {
    console.log({ url: 'https://internship.aicte-india.org' + m[1], text: m[2].replace(/<[^>]+>/g, '').trim().slice(0, 80) });
  });
}

async function checkY4W() {
  const res = await axios.get('https://www.cos.youth4work.com/Jobs/search-jobs-by-job-title/software-developer', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = res.data;
  console.log('Y4W search length:', html.length);
  const jobLinks = [...html.matchAll(/href="(\/Jobs\/[a-zA-Z0-9_-]+)"[^>]*>([^<]+)<\/a>/gi)];
  console.log('Y4W job links:', jobLinks.slice(0, 3).map(m => ({ url: 'https://www.cos.youth4work.com' + m[1], title: m[2].trim() })));
}

async function run() {
  await checkFW();
  await checkAICTE();
  await checkY4W();
}

run();

