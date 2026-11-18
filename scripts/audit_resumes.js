const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/interviewai');
  const db = mongoose.connection.db;

  const resumes = await db.collection('resumes').find({}).toArray();
  console.log(`=== RESUMES IN DB: ${resumes.length} ===`);
  for (const r of resumes) {
    console.log(`\n--- RESUME [${r._id}] name: "${r.name}", role: "${r.targetRole}", version: ${r.version}, template: ${r.template}`);
    const pd = r.profileData || {};
    console.log(`Personal:`, pd.personal?.fullName, pd.personal?.email);
    console.log(`Summary:`, pd.summary ? pd.summary.slice(0, 100) + '...' : 'NONE');
    console.log(`Skills:`, pd.skills);
    console.log(`Experience count:`, (pd.experience || []).length);
    (pd.experience || []).forEach((e, idx) => {
      console.log(`  Exp ${idx}: ${e.role} at ${e.company} (${e.startDate} - ${e.endDate})`);
      console.log(`    bullets (${(e.bullets || []).length}):`, e.bullets);
    });
    console.log(`Projects count:`, (pd.projects || []).length);
    (pd.projects || []).forEach((p, idx) => {
      console.log(`  Proj ${idx}: "${p.name}" (role: "${p.role}")`);
      console.log(`    technologies:`, p.technologies || p.keywords);
      console.log(`    description:`, p.description ? p.description.slice(0, 100) + '...' : 'NONE');
      console.log(`    bullets:`, p.bullets);
      console.log(`    links:`, p.link || p.githubUrl || p.liveUrl);
    });
    console.log(`Education count:`, (pd.education || []).length);
    (pd.education || []).forEach((ed, idx) => {
      console.log(`  Edu ${idx}: ${ed.degree} in ${ed.fieldOfStudy} at ${ed.institution}`);
    });
    console.log(`Certifications:`, pd.certifications);
    console.log(`RawText present?`, !!r.rawText, r.rawText ? `Length: ${r.rawText.length}` : '');
  }

  const profiles = await db.collection('profiles').find({}).toArray();
  console.log(`\n=== PROFILES IN DB: ${profiles.length} ===`);
  for (const p of profiles) {
    console.log(`\n--- PROFILE [${p._id}] userId: "${p.userId}"`);
    console.log(`Full Name:`, p.fullName || p.basics?.name);
    console.log(`Headline:`, p.headline);
    console.log(`Skills count:`, (p.skills || []).length);
    console.log(`Projects count:`, (p.projects || []).length);
    (p.projects || []).forEach((proj, i) => {
      console.log(`  Proj ${i}:`, JSON.stringify(proj, null, 2));
    });
    console.log(`Experience count:`, (p.experience || []).length);
    (p.experience || []).forEach((exp, i) => {
      console.log(`  Exp ${i}:`, JSON.stringify(exp, null, 2));
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
