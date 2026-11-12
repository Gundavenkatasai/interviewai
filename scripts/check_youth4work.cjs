const axios = require('axios');

async function check() {
  try {
    const r = await axios.get('https://www.youth4work.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    console.log('Homepage status:', r.status, 'Len:', r.data.length);
    const matches = r.data.match(/href="([^"]*job[^"]*|[^"]*intern[^"]*)"/gi);
    console.log('Job/intern links:', matches ? [...new Set(matches)].slice(0, 15) : 'None');
  } catch (e) {
    console.log('Err:', e.message);
  }
}

check();

