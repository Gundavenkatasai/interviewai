const axios = require('axios');

async function testUrl(label, url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/json,*/*'
      },
      timeout: 10000
    });
    console.log(`[${label}] Status: ${res.status}, Len: ${typeof res.data === 'string' ? res.data.length : JSON.stringify(res.data).length}`);
    const preview = typeof res.data === 'string' ? res.data.slice(0, 300).replace(/\s+/g, ' ') : JSON.stringify(res.data).slice(0, 300);
    console.log(`[${label}] Preview:`, preview);
  } catch (e) {
    console.log(`[${label}] Failed: ${e.message} (status: ${e.response?.status})`);
  }
}

async function run() {
  console.log('--- FOUNDIT INTERNSHIP ---');
  await testUrl('Foundit Web', 'https://www.foundit.in/search/internship-jobs');
  await testUrl('Foundit Fresher', 'https://www.foundit.in/fresher-jobs');
  await testUrl('Foundit Jina', 'https://r.jina.ai/https://www.foundit.in/search/internship-jobs');

  console.log('--- YOUTH4WORK ---');
  await testUrl('Youth4work 1', 'https://www.youth4work.com/talent/jobs');
  await testUrl('Youth4work 2', 'https://www.youth4work.com/Jobs');
  await testUrl('Youth4work Jina', 'https://r.jina.ai/https://www.youth4work.com/Jobs');

  console.log('--- LETSINTERN.IN ---');
  await testUrl('LetsIntern.in', 'https://letsintern.in/category/internships/');
  await testUrl('LetsIntern.in Jina', 'https://r.jina.ai/https://letsintern.in/');

  console.log('--- AICTE ---');
  await testUrl('AICTE internships', 'https://internship.aicte-india.org/internships');
  await testUrl('AICTE student', 'https://internship.aicte-india.org/internship_search_student.php');
}

run();

