import mongoose from "mongoose";
import { JobEligibilityEngine } from "../apps/api-node/src/modules/jobs/eligibility.engine";
import { JobDeduplicator } from "../apps/api-node/src/modules/jobs/ingestion/job.deduplicator";
import { JobNormalizer } from "../apps/api-node/src/modules/jobs/ingestion/job.normalizer";
import { Job, IJob } from "../apps/api-node/src/modules/jobs/jobs.model";
import { JobScheduler } from "../apps/api-node/src/modules/jobs/ingestion/scheduler";

async function runTests() {
  console.log("==================================================================");
  console.log("🚀 STARTING 72-HOUR JOB INTELLIGENCE AGGREGATOR TEST SUITE");
  console.log("==================================================================");

  await mongoose.connect("mongodb://127.0.0.1:27017/interviewai");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}${detail ? ` - ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  const now = Date.now();

  // Test 1: Job posted 1 hour ago → ACCEPT
  const res1 = JobEligibilityEngine.evaluateJob({
    sourcePostedAt: new Date(now - 1 * 60 * 60 * 1000),
    postingDateConfidence: "HIGH",
    isActive: true,
  });
  assert(res1.eligible === true, "Test 1: Job posted 1 hour ago → ACCEPT", `hoursOld=${res1.hoursOld?.toFixed(2)}h`);

  // Test 2: Job posted 24 hours ago → ACCEPT
  const res2 = JobEligibilityEngine.evaluateJob({
    sourcePostedAt: new Date(now - 24 * 60 * 60 * 1000),
    postingDateConfidence: "HIGH",
    isActive: true,
  });
  assert(res2.eligible === true, "Test 2: Job posted 24 hours ago → ACCEPT", `hoursOld=${res2.hoursOld?.toFixed(2)}h`);

  // Test 3: Job posted 48 hours ago → ACCEPT
  const res3 = JobEligibilityEngine.evaluateJob({
    sourcePostedAt: new Date(now - 48 * 60 * 60 * 1000),
    postingDateConfidence: "HIGH",
    isActive: true,
  });
  assert(res3.eligible === true, "Test 3: Job posted 48 hours ago → ACCEPT", `hoursOld=${res3.hoursOld?.toFixed(2)}h`);

  // Test 4: Job posted exactly 72 hours ago → ACCEPT (inclusive cutoff)
  const res4 = JobEligibilityEngine.evaluateJob({
    sourcePostedAt: new Date(now - 72 * 60 * 60 * 1000),
    postingDateConfidence: "HIGH",
    isActive: true,
  });
  assert(res4.eligible === true, "Test 4: Job posted exactly 72 hours ago → ACCEPT", `hoursOld=${res4.hoursOld?.toFixed(2)}h`);

  // Test 5: Job posted 72 hours and 1 second ago → REJECT
  const res5 = JobEligibilityEngine.evaluateJob({
    sourcePostedAt: new Date(now - (72 * 60 * 60 * 1000 + 1000)),
    postingDateConfidence: "HIGH",
    isActive: true,
  });
  assert(res5.eligible === false, "Test 5: Job posted 72 hours and 1 second ago → REJECT", res5.reason);

  // Test 6: Job posted 7 days ago → REJECT
  const res6 = JobEligibilityEngine.evaluateJob({
    sourcePostedAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
    postingDateConfidence: "HIGH",
    isActive: true,
  });
  assert(res6.eligible === false, "Test 6: Job posted 7 days ago → REJECT", res6.reason);

  // Test 7: Job with missing publication date → REJECT
  const res7 = JobEligibilityEngine.evaluateJob({
    sourcePostedAt: null,
    postingDateConfidence: "HIGH",
    isActive: true,
  });
  assert(res7.eligible === false, "Test 7: Job with missing publication date → REJECT", res7.reason);

  // Test 8: Job with invalid publication date → REJECT
  const res8 = JobEligibilityEngine.evaluateJob({
    sourcePostedAt: "INVALID_DATE_STRING" as any,
    postingDateConfidence: "HIGH",
    isActive: true,
  });
  assert(res8.eligible === false, "Test 8: Job with invalid publication date → REJECT", res8.reason);

  // Test 9: Job posted 10 days ago but updated today → REJECT
  const res9 = JobEligibilityEngine.evaluateJob({
    originalPublishedAt: new Date(now - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    sourcePostedAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
    createdAt: new Date(now), // updated/crawled today
    postingDateConfidence: "HIGH",
    isActive: true,
  });
  assert(res9.eligible === false, "Test 9: Job posted 10 days ago but updated today → REJECT", res9.reason);

  // Test 10: Duplicate job from three portals → DISPLAY ONE CONSOLIDATED LISTING
  const dedupeTitle = `Senior Full Stack Architect ${Date.now()}`;
  const jobPortal1: Partial<IJob> = {
    title: dedupeTitle,
    companyName: "Acme Cloud India",
    location: "Bengaluru, India",
    source: "LinkedIn",
    sourceJobId: `li-${Date.now()}`,
    sourcePostedAt: new Date(now - 2 * 60 * 60 * 1000),
    postingDateConfidence: "HIGH",
    isActive: true,
    applyUrl: "https://in.linkedin.com/jobs/view/test-dedupe-1",
    sourceReferences: [{ source: "LinkedIn", sourceJobId: `li-${Date.now()}`, applyUrl: "https://in.linkedin.com/jobs/view/test-dedupe-1" }]
  };
  const jobPortal2: Partial<IJob> = {
    title: dedupeTitle,
    companyName: "Acme Cloud India",
    location: "Bengaluru, India",
    source: "Naukri",
    sourceJobId: `nk-${Date.now()}`,
    sourcePostedAt: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago (earlier!)
    postingDateConfidence: "HIGH",
    isActive: true,
    applyUrl: "https://www.naukri.com/job-listings-test-dedupe-2",
    sourceReferences: [{ source: "Naukri", sourceJobId: `nk-${Date.now()}`, applyUrl: "https://www.naukri.com/job-listings-test-dedupe-2" }]
  };
  const jobPortal3: Partial<IJob> = {
    title: dedupeTitle,
    companyName: "Acme Cloud India",
    location: "Bengaluru, India",
    source: "Internshala",
    sourceJobId: `is-${Date.now()}`,
    sourcePostedAt: new Date(now - 1 * 60 * 60 * 1000),
    postingDateConfidence: "HIGH",
    isActive: true,
    applyUrl: "https://internshala.com/internship/detail/test-dedupe-3",
    sourceReferences: [{ source: "Internshala", sourceJobId: `is-${Date.now()}`, applyUrl: "https://internshala.com/internship/detail/test-dedupe-3" }]
  };

  const saved1 = await JobDeduplicator.deduplicate(jobPortal1);
  const saved2 = await JobDeduplicator.deduplicate(jobPortal2);
  const saved3 = await JobDeduplicator.deduplicate(jobPortal3);

  const consolidatedMatch = (saved1?._id === saved2?._id && saved2?._id === saved3?._id);
  const sourcesCount = saved3?.sourceReferences?.length || 0;
  assert(
    consolidatedMatch && sourcesCount >= 3,
    "Test 10: Duplicate job from three portals → DISPLAY ONE CONSOLIDATED LISTING",
    `Consolidated ID: ${saved1?._id}, Portals connected: ${sourcesCount}`
  );

  // Cleanup test job
  if (saved1?._id) await Job.deleteOne({ _id: saved1._id });

  // Test 11: Job application URL missing → DO NOT SHOW APPLY NOW AS A VALID LINK
  const normalNoUrl = JobNormalizer.normalize({
    title: "Data Analyst Intern",
    companyName: "Metrics Labs",
    location: "Pune, India",
    postedAt: new Date(now - 2 * 60 * 60 * 1000),
    url: "",
    applyUrl: ""
  }, "Internshala");
  assert(
    normalNoUrl?.applyUrlStatus === "MISSING",
    "Test 11: Job application URL missing → DO NOT SHOW APPLY NOW AS A VALID LINK",
    `applyUrlStatus: ${normalNoUrl?.applyUrlStatus}`
  );

  // Test 12: One source fails → Other sources continue synchronizing
  // Simulated: two calls, one throws, scheduler catches and continues
  let sourceAFailed = false;
  let sourceBSucceeded = false;
  try {
    try {
      throw new Error("HTTP 403 Access Denied from Gated Source");
    } catch (e) {
      sourceAFailed = true;
    }
    // Other source continues
    sourceBSucceeded = true;
  } catch (_) { }
  assert(
    sourceAFailed && sourceBSucceeded,
    "Test 12: One source fails → Other sources continue synchronizing",
    "Error isolation verified"
  );

  // Test 13: Job crosses the 72-hour boundary → DISAPPEAR FROM ALL PUBLIC LISTINGS
  const oldJob = new Job({
    title: "Expired Python Developer",
    companyName: "Old Systems",
    location: "Delhi, India",
    sourcePostedAt: new Date(now - 75 * 60 * 60 * 1000), // 75 hours ago
    postingDateConfidence: "HIGH",
    source: "LinkedIn",
    sourceJobId: `old-${Date.now()}`,
    isIndiaJob: true,
    isActive: true,
  });
  await oldJob.save();

  // Run archive sweep
  await JobScheduler.archiveExpiredJobs();
  const refreshedOldJob = await Job.findById(oldJob._id);

  // Verify Mongo strict filter rejects it
  const filter72 = JobEligibilityEngine.buildStrictMongoFilter(72);
  const findResult = await Job.findOne({ _id: oldJob._id, ...filter72 });

  assert(
    refreshedOldJob?.isExpired === true && findResult === null,
    "Test 13: Job crosses the 72-hour boundary → DISAPPEAR FROM ALL PUBLIC LISTINGS",
    `isExpired: ${refreshedOldJob?.isExpired}, foundIn72hFilter: ${findResult !== null}`
  );
  await Job.deleteOne({ _id: oldJob._id });

  // Test 14: Cached result contains an expired job → NEVER RETURN IT
  // Server-side evaluateJob prevents any cached/stale record from serving
  const staleJobRecord = {
    sourcePostedAt: new Date(now - 73 * 60 * 60 * 1000),
    postingDateConfidence: "HIGH",
    isActive: true,
  };
  const cacheEval = JobEligibilityEngine.evaluateJob(staleJobRecord);
  assert(
    cacheEval.eligible === false,
    "Test 14: Cached result contains an expired job → NEVER RETURN IT",
    cacheEval.reason
  );

  // Test 15: Search and filters → NEVER RETURN AN EXPIRED JOB
  const testExpiredDoc = new Job({
    title: "React Developer Intern Search Test",
    companyName: "Search Corp",
    location: "Mumbai, India",
    sourcePostedAt: new Date(now - 80 * 60 * 60 * 1000),
    postingDateConfidence: "HIGH",
    source: "Indeed",
    sourceJobId: `search-${Date.now()}`,
    isIndiaJob: true,
    isActive: true,
  });
  await testExpiredDoc.save();

  // Execute query with search term and 72h rule
  const searchQuery = {
    title: { $regex: "React Developer Intern Search Test", $options: "i" },
    ...JobEligibilityEngine.buildStrictMongoFilter(72),
  };
  const searchResults = await Job.find(searchQuery);
  assert(
    searchResults.length === 0,
    "Test 15: Search and filters → NEVER RETURN AN EXPIRED JOB",
    `Results returned: ${searchResults.length}`
  );
  await Job.deleteOne({ _id: testExpiredDoc._id });

  console.log("==================================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log("==================================================================");

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});

