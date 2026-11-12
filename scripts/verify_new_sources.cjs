const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function verify() {
  console.log('Testing /api/jobs/sources ...');
  const sourcesRes = await fetchJson('http://localhost:8001/api/jobs/sources');
  console.log('Sources reported by API:', sourcesRes.sources?.map(s => s.label));

  const testSources = ['Unstop', 'AICTE Internship', 'Freshersworld', 'LetsIntern', 'Youth4work', 'Foundit Zuno', 'Internshala'];

  for (const s of testSources) {
    const jobsRes = await fetchJson(`http://localhost:8001/api/jobs?source=${encodeURIComponent(s)}&limit=3`);
    console.log(`\n--- Source [${s}] ---`);
    console.log(`Total found: ${jobsRes.total}`);
    if (jobsRes.jobs && jobsRes.jobs.length > 0) {
      jobsRes.jobs.forEach((j, i) => {
        console.log(`  ${i+1}. ${j.title} | ${j.company_name} | ${j.location} | Apply: ${j.apply_url}`);
      });
    } else {
      console.log(`  No jobs returned for source: ${s}`);
    }
  }
}

verify().catch(console.error);

