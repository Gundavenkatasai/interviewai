import sqlite3 from "sqlite3";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { User } from "../src/modules/users/users.model";
import { Profile } from "../src/modules/profile/profile.model";
import { Resume, ResumeChunk } from "../src/modules/resume/resume.model";
import { Job } from "../src/modules/jobs/jobs.model";
import { InterviewSession, InterviewQuestion, CandidateAnswer, AnswerEvaluation, Transcript, InterviewEvent } from "../src/modules/interview/interview.model";

// Define the connection strings
const SQLITE_PATH = path.join(__dirname, "../../api/interviewai.db");
const MONGO_URL = process.env.MONGODB_URI || "mongodb://localhost:27017/applyhustle";

async function migrate() {
  console.log("Starting SQLite to MongoDB Migration...");
  
  const db = new sqlite3.Database(SQLITE_PATH);
  
  const queryAll = (query: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  await mongoose.connect(MONGO_URL);
  console.log("Connected to both databases.");

  const report = {
    users: { source: 0, destination: 0, failed: 0 },
    profiles: { source: 0, destination: 0, failed: 0 },
    resumes: { source: 0, destination: 0, failed: 0 },
    jobs: { source: 0, destination: 0, failed: 0 },
    interviews: { source: 0, destination: 0, failed: 0 },
  };

  try {
    // 1. Migrate Users
    console.log("Migrating Users...");
    try {
      const sqliteUsers = await queryAll("SELECT * FROM users");
      report.users.source = sqliteUsers.length;
      for (const pgUser of sqliteUsers) {
        try {
          await User.updateOne(
            { _id: pgUser.id }, // Assuming old ids were UUIDs
            {
              email: pgUser.email,
              passwordHash: pgUser.password_hash,
              fullName: pgUser.full_name,
              avatarUrl: pgUser.avatar_url,
              role: pgUser.role,
              isActive: pgUser.is_active,
              isAdmin: pgUser.is_admin,
              lastLoginAt: pgUser.last_login_at,
              createdAt: pgUser.created_at,
              updatedAt: pgUser.updated_at,
            },
            { upsert: true }
          );
          report.users.destination++;
        } catch (err) {
          report.users.failed++;
        }
      }
    } catch(e) {
      console.log("Users table not found, skipping.");
    }

    // 2. Migrate Profiles
    console.log("Migrating Profiles...");
    try {
      const sqliteProfiles = await queryAll("SELECT * FROM profiles");
      report.profiles.source = sqliteProfiles.length;
      for (const pgProfile of sqliteProfiles) {
        try {
          await Profile.updateOne(
            { userId: pgProfile.user_id },
            {
              userId: pgProfile.user_id,
              personal: pgProfile.personal || {},
              location: pgProfile.location || {},
              education: pgProfile.education || [],
              experience: pgProfile.experience || [],
              projects: pgProfile.projects || [],
              skills: pgProfile.skills || [],
              certifications: pgProfile.certifications || [],
              achievements: pgProfile.achievements || [],
              preferredRoles: pgProfile.preferred_roles || [],
              preferredLocations: pgProfile.preferred_locations || [],
              linkedin: pgProfile.linkedin || "",
              github: pgProfile.github || "",
              portfolio: pgProfile.portfolio || "",
            },
            { upsert: true }
          );
          report.profiles.destination++;
        } catch (err) {
          report.profiles.failed++;
        }
      }
    } catch(e) {
      console.log("Profiles table not found, skipping.");
    }

    // 3. Migrate Jobs
    console.log("Migrating Jobs...");
    try {
      const sqliteJobs = await queryAll("SELECT * FROM jobs");
      report.jobs.source = sqliteJobs.length;
      for (const pgJob of sqliteJobs) {
        try {
          await Job.updateOne(
            { _id: pgJob.id },
            {
              title: pgJob.title,
              companyName: pgJob.company,
              description: pgJob.description,
              location: pgJob.location,
              country: pgJob.country,
              isIndiaJob: pgJob.is_india_job,
              status: pgJob.status,
              isActive: pgJob.is_active,
              salaryMin: pgJob.salary_min,
              salaryMax: pgJob.salary_max,
              workMode: pgJob.work_mode,
              employmentType: pgJob.employment_type,
              seniority: pgJob.seniority,
              source: pgJob.source,
              sourceJobId: pgJob.source_job_id,
              applyUrl: pgJob.apply_url,
              canonicalUrl: pgJob.canonical_url,
              sourcePostedAt: pgJob.source_posted_at,
              createdAt: pgJob.created_at,
            },
            { upsert: true }
          );
          report.jobs.destination++;
        } catch (err) {
          report.jobs.failed++;
        }
      }
    } catch(e) {
      console.log("Jobs table not found, skipping.");
    }

    // 4. Migrate Resumes
    console.log("Migrating Resumes...");
    try {
      const sqliteResumes = await queryAll("SELECT * FROM resumes");
      report.resumes.source = sqliteResumes.length;
      for (const pgResume of sqliteResumes) {
        try {
          await Resume.updateOne(
            { _id: pgResume.id },
            {
              userId: pgResume.user_id,
              filename: pgResume.filename,
              fileType: pgResume.file_type,
              processingStatus: pgResume.processing_status,
              rawText: pgResume.raw_text,
              createdAt: pgResume.created_at,
            },
            { upsert: true }
          );
          report.resumes.destination++;
        } catch (err) {
          report.resumes.failed++;
        }
      }
    } catch(e) {
      console.log("Resumes table not found, skipping.");
    }

    // Write final report
    console.log("Migration complete.");
    const reportPath = path.join(__dirname, "migration-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Migration report saved to ${reportPath}`);

  } catch (err) {
    console.error("Migration encountered an error:", err);
  } finally {
    db.close();
    await mongoose.disconnect();
  }
}

migrate();
