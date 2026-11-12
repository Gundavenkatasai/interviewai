const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/interviewai');
  const Job = mongoose.connection.collection('jobs');
  const jobs = await Job.find({}).toArray();
  console.log(`Found ${jobs.length} jobs:`);
  jobs.forEach((j, i) => {
    console.log(`${i+1}. [${j.source || 'UNKNOWN'}] url: ${j.applyUrl}`);
  });
  await mongoose.disconnect();
}
run().catch(console.error);

