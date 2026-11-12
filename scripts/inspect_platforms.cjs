const axios = require('axios');

const platforms = [
  { name: 'LetsIntern', url: 'https://r.jina.ai/https://letsintern.in/' },
  { name: 'Unstop API', url: 'https://unstop.com/api/public/opportunity/search-result?opportunity=internships&per_page=10' },
  { name: 'Unstop Jina', url: 'https://r.jina.ai/https://unstop.com/internships' },
  { name: 'AICTE', url: 'https://r.jina.ai/https://internship.aicte-india.org/' },
  { name: 'Freshersworld', url: 'https://r.jina.ai/https://www.freshersworld.com/jobs/jobsearch/internship-jobs' },
  { name: 'Youth4work', url: 'https://r.jina.ai/https://www.youth4work.com/Jobs/Internships' },
  { name: 'Foundit Zuno', url: 'https://r.jina.ai/https://www.foundit.in/zuno/' },
];

async function probe() {
  for (const p of platforms) {
    try {
      console.log(`\n--- Probing ${p.name} (${p.url}) ---`);
      const resp = await axios.get(p.url, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000
      });
      const dataStr = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      console.log(`[${p.name}] Status: ${resp.status}, Content length: ${dataStr.length}`);
      console.log(`[${p.name}] Preview:`, dataStr.slice(0, 300).replace(/\n/g, ' '));
    } catch (err) {
      console.log(`[${p.name}] FAILED:`, err.message, err.response?.status);
    }
  }
}

probe();

