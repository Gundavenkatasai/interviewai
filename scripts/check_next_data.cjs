const axios = require('axios');

async function check() {
  const r = await axios.get('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const match = r.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (match) {
    const json = JSON.parse(match[1]);
    console.log('pageProps keys:', Object.keys(json.props?.pageProps || {}));
    console.log('Sample data:', JSON.stringify(json.props?.pageProps || {}).slice(0, 1500));
  } else {
    console.log('No __NEXT_DATA__ found');
    // Check for self.__next_f or similar Next.js App Router chunks
    const chunks = [...r.data.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
    console.log('App Router push chunks:', chunks.length);
    for (const c of chunks) {
      if (c[1].includes('internship') || c[1].includes('stipend') || c[1].includes('title')) {
        console.log('Relevant chunk:', c[1].slice(0, 500));
        break;
      }
    }
  }
}

check();

