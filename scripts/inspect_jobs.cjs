const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/interviewai');
  const Job = mongoose.connection.collection('jobs');
  const count = await Job.countDocuments();
  console.log('Total jobs:', count);
  const sample = await Job.find({}).limit(10).toArray();
  sample.forEach((j, i) => {
    console.log(`\n=== Job ${i+1} ===`);
    console.log('Title:', j.title);
    console.log('Company:', j.companyName || j.company);
    console.log('Location:', j.location);
    console.log('City:', j.city);
    console.log('WorkMode:', j.workMode);
    console.log('SalaryMin:', j.salaryMin, 'SalaryMax:', j.salaryMax);
    console.log('MinExp:', j.minExperience);
    console.log('Skills:', j.skills);
    console.log('SourcePostedAt:', j.sourcePostedAt);
    console.log('CreatedAt:', j.createdAt);
    console.log('ApplyUrl:', j.applyUrl);
  });
  await mongoose.disconnect();
}
run().catch(console.error);

