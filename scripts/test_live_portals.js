const axios = require('axios');

async function testJina(name, url) {
  try {
    const res = await axios.get(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'application/json' },
      timeout: 20000
    });
    console.log(`[${name}] Jina status: ${res.status}, Title: ${res.data?.data?.title}`);
    const content = res.data?.data?.content || '';
    console.log(`[${name}] Content length: ${content.length}`);
    const matches = content.match(/https?:\/\/[^\s\)\"]+/g) || [];
    const jobLinks = matches.filter(l => l.includes('job') || l.includes('view') || l.includes('career'));
    console.log(`[${name}] Sample job links:`, jobLinks.slice(0, 5));
    return { title: res.data?.data?.title, sampleLinks: jobLinks.slice(0, 5) };
  } catch (e) {
    console.log(`[${name}] Error:`, e.message);
    return null;
  }
}

(async () => {
  await testJina('Naukri', 'https://www.naukri.com/software-engineer-jobs');
  await testJina('Indeed', 'https://in.indeed.com/jobs?q=developer&l=India');
  await testJina('Glassdoor', 'https://www.glassdoor.co.in/Job/india-software-engineer-jobs-SRCH_IL.0,5_IN115_KO6,23.htm');
  await testJina('Naukri Campus', 'https://www.naukri.com/fresher-jobs');
})();

