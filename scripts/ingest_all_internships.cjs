const mongoose = require('mongoose');

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/interviewai";

async function main() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB successfully!');

  const JobModel = mongoose.model('Job', new mongoose.Schema({}, { strict: false }));

  // Import compiled or ts-node/direct modules from API
  // In our case we can run adapters directly via tsx/node or write an integrated runner
  console.log('Ingesting from all internship platforms...');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

