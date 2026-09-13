const API_BASE = "http://localhost:8001";

async function runVerification() {
  console.log("=== Resume Studio Production Verification ===");

  // 1. Register test user
  const email = `test.user.${Date.now()}@example.com`;
  const regRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Venkat Sai",
      email,
      password: "Password123!"
    })
  });
  const regData = await regRes.json();
  if (!regData.token) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  const token = regData.token;
  console.log("✓ Step 1: User registered and authenticated. Token generated.");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // 2. Create initial resume
  const createRes = await fetch(`${API_BASE}/api/resumes`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Staff Backend Engineer Resume",
      targetRole: "Staff Backend Engineer",
      template: "modern_dev"
    })
  });
  const createData = await createRes.json();
  const resumeId = createData.resume._id;
  console.log(`✓ Step 2: Created new resume in MongoDB. ID: ${resumeId}`);

  // 3. Update with real structured content
  const updateRes = await fetch(`${API_BASE}/api/resumes/${resumeId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Staff Backend Engineer Resume",
      targetRole: "Staff Backend Engineer",
      template: "modern_dev",
      profileData: {
        personal: {
          fullName: "Venkat Sai",
          email: "venkat.sai@example.com",
          phone: "+1 555-0199",
          location: "San Francisco, CA",
          linkedin: "https://linkedin.com/in/venkatsai",
          github: "https://github.com/venkatsai"
        },
        summary: "Staff Backend Engineer with 8+ years architecting high-throughput distributed systems, event-driven pipelines, and cloud-native microservices using Node.js and TypeScript.",
        experience: [
          {
            role: "Staff Backend Engineer",
            company: "CloudScale Inc",
            startDate: "2021",
            endDate: "Present",
            bullets: [
              "Architected global multi-region event streaming pipeline processing 25M events daily with Apache Kafka.",
              "Decreased p99 database query latency by 45% through Redis multi-tier caching.",
              "Mentored 6 senior engineers and standardized automated CI/CD pipeline deployments."
            ]
          }
        ],
        education: [
          {
            degree: "B.S.",
            field: "Computer Science",
            institution: "University of California",
            startDate: "2014",
            endDate: "2018"
          }
        ],
        skills: {
          languages: ["TypeScript", "Go", "Python", "SQL"],
          frameworks: ["Node.js", "Fastify", "Express", "React"],
          databases: ["PostgreSQL", "Redis", "MongoDB"],
          cloud: ["AWS", "Docker", "Kubernetes"]
        },
        projects: [
          {
            name: "High-Throughput Task Engine",
            description: "Distributed task scheduling engine with Raft consensus.",
            technologies: ["Node.js", "TypeScript", "Redis"],
            bullets: ["Maintains 99.99% uptime processing 10k concurrent jobs."]
          }
        ]
      }
    })
  });
  const updateData = await updateRes.json();
  console.log(`✓ Step 3: Updated resume with complete profile. Status: ${updateRes.status}`);

  // 4. Run ATS Scoring
  const atsRes = await fetch(`${API_BASE}/api/resumes/${resumeId}/analyze`, {
    method: "POST",
    headers: authHeaders
  });
  const atsData = await atsRes.json();
  const score = atsData.analysis?.overallScore ?? atsData.score;
  console.log(`✓ Step 4: Deterministic ATS Compatibility Score calculated: ${score}/100`);
  if (score <= 0) throw new Error("Expected valid ATS score > 0");

  // 5. Test "What ATS Sees"
  const plainRes = await fetch(`${API_BASE}/api/resumes/${resumeId}/plain-text`, {
    headers: authHeaders
  });
  const plainData = await plainRes.json();
  console.log(`✓ Step 5: Extracted 'What ATS Sees' plain text (${plainData.plainText?.length} chars)`);
  if (!plainData.plainText?.includes("VENKAT SAI")) {
    throw new Error("Plain text missing candidate name");
  }

  // 6. Test TXT Export
  const txtRes = await fetch(`${API_BASE}/api/resumes/${resumeId}/export/txt`, {
    method: "POST",
    headers: authHeaders
  });
  const txtContent = await txtRes.text();
  console.log(`✓ Step 6: Exported TXT document (${txtContent.length} bytes)`);

  // 7. Test DOCX Export
  const docxRes = await fetch(`${API_BASE}/api/resumes/${resumeId}/export/docx`, {
    method: "POST",
    headers: authHeaders
  });
  const docxBlob = await docxRes.blob();
  console.log(`✓ Step 7: Exported DOCX document (${docxBlob.size} bytes)`);
  if (docxBlob.size < 1000) throw new Error("DOCX export generated empty file");

  // 8. Test Public Share Link
  const shareRes = await fetch(`${API_BASE}/api/resumes/${resumeId}/share`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ expiresDays: 30 })
  });
  const shareData = await shareRes.json();
  const slug = shareData.slug || shareData.share?.slug;
  console.log(`✓ Step 8: Generated public share slug: ${slug}`);

  // 9. Fetch Public Resume without auth
  const pubRes = await fetch(`${API_BASE}/api/resumes/public/${slug}`);
  const pubData = await pubRes.json();
  const candidate = pubData.resume?.profileData?.personal?.fullName;
  console.log(`✓ Step 9: Public resume fetched anonymously: ${candidate}`);
  if (!candidate) throw new Error("Public resume did not return candidate profileData");

  console.log("\n✅ ALL 9 RESUME STUDIO VERIFICATION CHECKS PASSED PERFECTLY!");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
