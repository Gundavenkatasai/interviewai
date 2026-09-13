const fs = require('fs'); 
const html = fs.readFileSync('cutshort_dom.html', 'utf8'); 
console.log('Contains job-card-wrapper?', html.includes('job-card-wrapper')); 
console.log('Contains job-title?', html.includes('job-title')); 
console.log('Classes containing job:', Array.from(new Set([...html.matchAll(/class="([^"]*job[^"]*)"/g)].map(m => m[1]))).slice(0, 10));
