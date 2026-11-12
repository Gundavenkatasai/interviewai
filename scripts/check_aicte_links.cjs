const axios = require('axios');

async function run() {
  const r = await axios.get('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const matches = [...r.data.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  console.log('Total a tags:', matches.length);
  matches.filter(m => !m[1].startsWith('#') && !m[1].includes('css') && !m[1].startsWith('javascript')).slice(0, 30).forEach(m => {
    console.log(m[1], '-->', m[2].replace(/<[^>]+>/g, '').trim().slice(0, 60));
  });

  // Check if AICTE has an API endpoint call in the HTML:
  const apiMatches = r.data.match(/https?:\/\/[^"'\s]+\/api\/[^"'\s]+/gi) || r.data.match(/\/api\/[^"'\s]+/gi);
  console.log('AICTE API matches:', apiMatches);
}

run();

