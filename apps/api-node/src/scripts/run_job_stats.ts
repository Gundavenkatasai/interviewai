import mongoose from 'mongoose';
import { env } from '../config/env';

async function run() {
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  console.log("Connected to MongoDB.");
  const db = mongoose.connection.db;
  if (!db) return;
  
  const jobs = db.collection('jobs');
  
  const count = await jobs.countDocuments();
  console.log("Total Jobs:", count);
  
  const sourceDist = await jobs.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log("\n--- Primary Source Distribution ---");
  console.table(sourceDist);
  
  const refDist = await jobs.aggregate([
    { $unwind: "$sourceReferences" },
    { $group: { _id: "$sourceReferences.source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log("\n--- Source References (Deduplicated) Distribution ---");
  console.table(refDist);
  
  await mongoose.disconnect();
}

run().catch(console.error);
