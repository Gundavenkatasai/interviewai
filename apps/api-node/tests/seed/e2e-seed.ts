import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../../src/modules/users/users.model";
import { Job } from "../../src/modules/jobs/jobs.model";
import { env } from "../../src/config/env";

const E2E_USER_EMAIL = "e2e-user@applyhustle.test";

export async function runE2ESeed() {
  if (process.env.NODE_ENV !== "test") {
    console.error("Refusing to seed outside of test environment");
    process.exit(1);
  }
  
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  
  // Wipe test DB completely
  await mongoose.connection.dropDatabase();
  console.log("Dropped applyhustle_e2e_test database");

  // Create E2E User
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const user = await User.create({
    email: E2E_USER_EMAIL,
    passwordHash,
    firstName: "Test",
    lastName: "Candidate",
    isEmailVerified: true
  });
  console.log("Created E2E Test User:", user._id);

  // Seed Jobs (5 variations)
  const jobs = await Job.insertMany([
    {
      companyName: "[TEST_ONLY] TechCorp",
      roleName: "Backend Engineer",
      roleCategory: "software-engineering",
      sourceUrl: "https://example.com/job1",
      location: "Remote",
      minExperienceYears: 3,
      salaryMax: 150000,
      salaryMin: 120000,
      description: "We are looking for a Node.js engineer with 3 years of experience. Must know MongoDB and TypeScript.",
      jobType: "FULL_TIME",
      matchScore: 0,
      trustScore: 0,
      source: "TEST_SEED"
    },
    {
      companyName: "[TEST_ONLY] WebScale Inc",
      roleName: "Frontend Engineer",
      roleCategory: "software-engineering",
      sourceUrl: "https://example.com/job2",
      location: "San Francisco, CA",
      description: "React and Vue expert needed. Strong UI/UX skills.",
      jobType: "FULL_TIME",
      source: "TEST_SEED"
    }
  ]);
  
  console.log(`Seeded ${jobs.length} jobs.`);
  console.log("E2E Seed Complete.");
  await mongoose.disconnect();
}

if (require.main === module) {
  runE2ESeed().catch(console.error);
}
