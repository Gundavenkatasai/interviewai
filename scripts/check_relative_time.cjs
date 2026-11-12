const mongoose = require('mongoose');

function formatRelativeTime(date) {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/interviewai');
  const Job = mongoose.connection.collection('jobs');
  const jobs = await Job.find({}).toArray();
  const results = {};
  jobs.forEach(j => {
    const d = j.sourcePostedAt || j.postedAt || j.createdAt;
    const rel = formatRelativeTime(d);
    results[rel] = (results[rel] || 0) + 1;
    if (rel.includes("day") || rel.includes("week") || rel.includes("month")) {
      console.log(`[${rel}] ${j.title} -> sourcePostedAt: ${j.sourcePostedAt}, postedAt: ${j.postedAt}`);
    }
  });
  console.log("Distribution of formatRelativeTime:", results);
  await mongoose.disconnect();
}
run();

