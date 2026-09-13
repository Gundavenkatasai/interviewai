import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
  
  // Use the applyhustle db explicitly if MONGODB_DB_NAME is set
  const dbName = process.env.MONGODB_DB_NAME || 'applyhustle';
  mongoose.connection.useDb(dbName);
  
  const Job = mongoose.connection.useDb(dbName).model('Job', new mongoose.Schema({}, { strict: false }));
  
  const total = await Job.countDocuments();
  
  const bySource = await Job.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]);
  
  const bySource48h = await Job.aggregate([
    { $match: { postedAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } } },
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]);
  
  const bySourceIndia = await Job.aggregate([
    { $match: { isIndiaJob: true } },
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]);
  
  const bySourceFresh = await Job.aggregate([
    { $match: { freshness: 'FRESH' } },
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]);
  
  console.log(JSON.stringify({ total, bySource, bySource48h, bySourceIndia, bySourceFresh }, null, 2));
  process.exit(0);
}

run().catch(console.error);
