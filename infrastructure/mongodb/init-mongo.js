// MongoDB initialization script
db = db.getSiblingDB("applyhustle");

// Create collections with indexes
db.createCollection("users");
db.users.createIndex({ email: 1 }, { unique: true });

db.createCollection("jobs");
db.jobs.createIndex({ identityHash: 1 }, { unique: true, sparse: true });
db.jobs.createIndex({ postedAt: -1 });

db.createCollection("interviewsessions");
db.interviewsessions.createIndex({ userId: 1, createdAt: -1 });

print("Interview AI MongoDB Database Initialized.");
