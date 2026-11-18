const mongoose = require('mongoose');

// We can import or require the built parser, or execute via tsx
async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/interviewai');
  const db = mongoose.connection.db;

  const resumes = await db.collection('resumes').find({ rawText: { $exists: true, $ne: '' } }).toArray();
  console.log(`Found ${resumes.length} resumes with rawText to re-parse`);

  // We will run this via tsx so it can directly invoke ResumeParser.parseTextToResume
}
run();
