const axios = require('axios');

async function checkLinkedInParsing() {
  const url = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=software%20engineer&location=India&start=0';
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const cards = res.data.split('<li').slice(1);
  console.log(`LinkedIn raw card blocks: ${cards.length}`);
  cards.slice(0, 3).forEach((c, idx) => {
    const titleMatch = c.match(/<h3 class="base-search-card__title">([\s\S]*?)<\/h3>/i);
    const compMatch = c.match(/<h4 class="base-search-card__subtitle">([\s\S]*?)<\/h4>/i);
    const locMatch = c.match(/<span class="job-search-card__location">([\s\S]*?)<\/span>/i);
    const linkMatch = c.match(/<a class="base-card__full-link[^"]*" href="([^"]+)"/i);
    const dateMatch = c.match(/<time[^>]+datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);

    console.log(`Card ${idx + 1}:`, {
      title: titleMatch ? titleMatch[1].trim() : 'N/A',
      company: compMatch ? compMatch[1].replace(/<[^>]+>/g, '').trim() : 'N/A',
      location: locMatch ? locMatch[1].trim() : 'N/A',
      link: linkMatch ? linkMatch[1].split('?')[0] : 'N/A',
      date: dateMatch ? dateMatch[1] : 'N/A',
      relativeText: dateMatch ? dateMatch[2].trim() : 'N/A'
    });
  });
}

checkLinkedInParsing().catch(console.error);

