const axios = require('axios');

async function testDirect(name, url, headers = {}) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...headers
      },
      timeout: 10000
    });
    console.log(`[${name} DIRECT] Status: ${res.status}, Len: ${typeof res.data === 'string' ? res.data.length : JSON.stringify(res.data).length}`);
    const preview = typeof res.data === 'string' ? res.data.slice(0, 300).replace(/\s+/g, ' ') : JSON.stringify(res.data).slice(0, 300);
    console.log(`[${name} DIRECT] Preview:`, preview);
    return true;
  } catch (e) {
    console.log(`[${name} DIRECT] Error: ${e.message} (status: ${e.response?.status})`);
    return false;
  }
}

async function testJina(name, url) {
  try {
    const res = await axios.get(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'markdown'
      },
      timeout: 15000
    });
    const content = res.data?.data?.content || (typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
    console.log(`[${name} JINA] Status: ${res.status}, Content Len: ${content.length}`);
    console.log(`[${name} JINA] Preview:`, content.slice(0, 300).replace(/\s+/g, ' '));
    return true;
  } catch (e) {
    console.log(`[${name} JINA] Error: ${e.message} (status: ${e.response?.status})`);
    return false;
  }
}

async function run() {
  console.log('=== TESTING UNSTOP ===');
  await testDirect('Unstop API', 'https://unstop.com/api/public/opportunity/search-result?opportunity=internships&per_page=5');

  console.log('\n=== TESTING FRESHERSWORLD ===');
  await testDirect('Freshersworld Direct', 'https://www.freshersworld.com/jobs/jobsearch/internship-jobs');
  await testJina('Freshersworld', 'https://www.freshersworld.com/jobs/jobsearch/internship-jobs');

  console.log('\n=== TESTING LETSINTERN ===');
  await testDirect('LetsIntern Direct', 'https://www.letsintern.com/internships');
  await testDirect('LetsIntern in', 'https://letsintern.in/');
  await testJina('LetsIntern', 'https://www.letsintern.com/internships');

  console.log('\n=== TESTING AICTE INTERNSHIP ===');
  await testDirect('AICTE Direct', 'https://internship.aicte-india.org/');
  await testDirect('AICTE API', 'https://internship.aicte-india.org/internship_search.php');
  await testJina('AICTE', 'https://internship.aicte-india.org/');

  console.log('\n=== TESTING YOUTH4WORK ===');
  await testDirect('Youth4work Direct', 'https://www.youth4work.com/Jobs/Internships');
  await testJina('Youth4work', 'https://www.youth4work.com/Jobs/Internships');

  console.log('\n=== TESTING FOUNDIT ZUNO ===');
  await testDirect('Foundit Zuno Direct', 'https://www.foundit.in/zuno/');
  await testDirect('Foundit Search API', 'https://www.foundit.in/middleware/jobsearch?query=internship&locations=india');
  await testJina('Foundit Zuno', 'https://www.foundit.in/zuno/');
}

run();

