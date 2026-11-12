const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/interviewai');
  const Job = mongoose.connection.collection('jobs');
  const jobs = await Job.find({}).sort({ createdAt: -1 }).toArray();
  const now = Date.now();
  console.log(`Total jobs in DB: ${jobs.length}`);
  jobs.slice(0, 30).forEach((j, i) => {
    const p = j.postedAt || j.sourcePostedAt || j.createdAt;
    const diffHours = (now - new Date(p).getTime()) / (3600 * 1000);
    const diffDays = diffHours / 24;
    console.log(`${i+1}. [${j.title}] postedAt: ${p} (${diffHours.toFixed(1)}h ago, ${diffDays.toFixed(1)}d ago)`);
  });
  await mongoose.disconnect();
}
run();

