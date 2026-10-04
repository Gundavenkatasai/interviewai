import mongoose from "mongoose";

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/applyhustle");
  const count = await mongoose.connection.collection("jobs").countDocuments();
  const sources = await mongoose.connection.collection("jobs").aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } }
  ]).toArray();
  const indexes = await mongoose.connection.collection("jobs").indexes();
  const sample = await mongoose.connection.collection("jobs").find().limit(5).toArray();
  
  console.log("Total jobs:", count);
  console.log("Sources:", JSON.stringify(sources, null, 2));
  console.log("Indexes:", JSON.stringify(indexes.map(i => i.key), null, 2));
  console.log("Sample Jobs:", JSON.stringify(sample.map(s => ({
    id: s._id,
    title: s.title,
    company: s.companyName,
    source: s.source,
    location: s.location,
    isIndiaJob: s.isIndiaJob,
    postedAt: s.postedAt,
    sourcePostedAt: s.sourcePostedAt,
    applyUrl: s.applyUrl
  })), null, 2));
  
  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
