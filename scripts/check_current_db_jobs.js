const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/interviewai');
  const targetSources = ['Naukri', 'Naukri Campus', 'Indeed', 'Glassdoor'];
  for (const s of targetSources) {
    const jobs = await mongoose.connection.collection('jobs').find({ source: s }).toArray();
    console.log(`Source: [${s}] -> Count in DB: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log(`Sample [${s}] applyUrl:`, jobs[0].applyUrl || jobs[0].applicationUrl || jobs[0].sourceUrl);
    }
  }
  await mongoose.disconnect();
}

check().catch(console.error);

