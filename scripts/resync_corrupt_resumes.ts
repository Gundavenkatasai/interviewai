import mongoose from "mongoose";
import { ResumeParser } from "../apps/api-node/src/modules/resume/resume.parser";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/interviewai");
  const db = mongoose.connection.db;

  const resumes = await db.collection("resumes").find({ rawText: { $exists: true, $ne: "" } }).toArray();
  console.log(`Found ${resumes.length} resumes with rawText to re-parse.`);

  for (const r of resumes) {
    console.log(`\nRe-parsing resume: ${r.name} (${r._id}) ...`);
    const { profileData, confidence, confidenceMessage } = ResumeParser.parseTextToResume(r.rawText, r.name);

    console.log(`- Extracted Projects (${profileData.projects?.length}):`, profileData.projects?.map((p: any) => p.name));
    console.log(`- Extracted Education (${profileData.education?.length}):`, profileData.education?.map((e: any) => `${e.degree} at ${e.institution}`));
    console.log(`- Extracted Certifications (${profileData.certifications?.length}):`, profileData.certifications?.map((c: any) => c.name));
    console.log(`- Extracted Achievements (${profileData.achievements?.length}):`, profileData.achievements?.map((a: any) => a.title));
    console.log(`- Extracted Custom Training:`, profileData.customSections?.length);

    // Update resume in DB
    await db.collection("resumes").updateOne(
      { _id: r._id },
      {
        $set: {
          profileData,
          confidence,
          confidenceMessage,
          updatedAt: new Date()
        }
      }
    );
    console.log(`✓ Updated resume ${r._id} in MongoDB.`);

    // If there is an associated profile for this user, also update the profile's projects, education, certifications, and skills!
    if (r.userId) {
      const profile = await db.collection("profiles").findOne({ userId: r.userId });
      if (profile) {
        console.log(`- Updating profile for userId: ${r.userId}`);
        const profileProjects = profileData.projects.map((p: any) => ({
          name: p.name,
          description: p.description || p.name,
          role: p.role || "Developer",
          technologies: p.technologies || [],
          url: p.url || "",
          bullets: p.bullets || [],
          provenance: p.provenance
        }));

        const profileSkills = (profileData.skills.structured || []).map((s: any) => ({
          name: s.raw || s.normalized,
          category: s.category || "technical",
          isVerified: true
        }));

        const profileEducation = profileData.education.map((e: any) => ({
          institution: e.institution,
          degree: e.degree,
          fieldOfStudy: e.field || "",
          gpa: e.gpa || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          provenance: e.provenance
        }));

        const profileCertifications = profileData.certifications.map((c: any) => ({
          name: c.name,
          issuer: c.issuer,
          issueDate: c.date,
          provenance: c.provenance
        }));

        await db.collection("profiles").updateOne(
          { _id: profile._id },
          {
            $set: {
              projects: profileProjects,
              skills: profileSkills,
              education: profileEducation,
              certifications: profileCertifications,
              updatedAt: new Date()
            }
          }
        );
        console.log(`✓ Updated candidate profile ${profile._id} with verified unfragmented data.`);
      }
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error in re-parsing script:", err);
  process.exit(1);
});
