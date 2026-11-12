async function testFilter(name, query) {
  const url = `http://127.0.0.1:8001/api/jobs?${query}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`[PASS] ${name.padEnd(30)} -> Total: ${String(data.total).padEnd(4)} Returned: ${data.jobs?.length || 0}`);
    if (data.jobs?.length > 0) {
      const j = data.jobs[0];
      console.log(`       Sample: "${j.title}" at ${j.company_name} in ${j.location_normalized || j.location} (Posted: ${j.posted_at})`);
    }
    return data.total;
  } catch (e) {
    console.error(`[FAIL] ${name}:`, e.message);
    return 0;
  }
}

async function run() {
  console.log("=== TESTING ALL JOB FILTERS ===");
  await testFilter("All Jobs", "");
  await testFilter("Last 24 Hours (posted_days=1)", "posted_days=1");
  await testFilter("Last 3 Days (posted_days=3)", "posted_days=3");
  await testFilter("Location: Bengaluru", "location=Bengaluru");
  await testFilter("Location: Mumbai", "location=Mumbai");
  await testFilter("Location: Remote", "location=Remote");
  await testFilter("Location: Delhi NCR", "location=Delhi%20NCR");
  await testFilter("Track: Frontend", "role_category=frontend");
  await testFilter("Track: Backend", "role_category=backend");
  await testFilter("Track: Mobile", "role_category=mobile");
  await testFilter("Track: QA / Testing", "role_category=qa");
  await testFilter("Track: DevOps / Cloud", "role_category=devops");
  await testFilter("Track: AI / ML", "role_category=ai");
  await testFilter("Work Mode: Remote", "work_mode=remote");
  await testFilter("Work Mode: Onsite", "work_mode=onsite");
  await testFilter("Work Mode: Hybrid", "work_mode=hybrid");
  await testFilter("Exp: Fresher", "experience_range=fresher");
  await testFilter("Exp: 0-1", "experience_range=0-1");
  await testFilter("Exp: 3-5", "experience_range=3-5");
  await testFilter("Salary Min: ₹3 LPA", "salary_min=300000");
  await testFilter("Skills: React", "skills=React");
  await testFilter("Skills: Python", "skills=Python");
  await testFilter("Skills: Java", "skills=Java");
  await testFilter("Search: React", "search=React");
  await testFilter("Search: Tester", "search=Tester");
  await testFilter("Combo: Last 24h + Remote", "posted_days=1&work_mode=remote");
  await testFilter("Combo: Last 24h + Fresher", "posted_days=1&experience_range=fresher");
  console.log("=== FILTER TESTS COMPLETE ===");
}

run().catch(console.error);

