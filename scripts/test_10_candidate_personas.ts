import { AtsScoringService } from "../apps/api-node/src/modules/ats/ats-scoring.service";
import { ResumeParser } from "../apps/api-node/src/modules/resume/resume.parser";

interface ITestCase {
  testNumber: number;
  title: string;
  description: string;
  resumeText: string;
  expectedClassification: string;
  expectedEmpScoreCheck: (score: any) => boolean;
  expectedCat3ScoreCheck: (score: number) => boolean;
  expectedOverallScoreBand?: string[];
  options?: any;
}

const testCases: ITestCase[] = [
  // ── TEST 1: Fresher with two strong projects and no employment ─────────────
  {
    testNumber: 1,
    title: "Fresher with 2 Strong Projects & 0 Experience",
    description: "Must classify as FRESHER. Employment marked N/A. Project quality evaluated independently.",
    resumeText: `
John Doe
john.doe@gmail.com | (555) 019-2834 | New York, NY
linkedin.com/in/johndoe | github.com/johndoe

Summary
Computer Science graduate with hands-on experience building full-stack web applications in TypeScript and Node.js.

Technical Skills
Languages: TypeScript, JavaScript, Python, SQL
Frameworks: React, Node.js, Express, Next.js
Tools: Docker, Git, PostgreSQL, Redis

Projects
E-Commerce Cloud Platform | React, Node.js, PostgreSQL
• Designed a microservices-based e-commerce platform handling 500+ requests/sec with Node.js and Redis caching.
• Integrated Stripe payment gateway and automated webhook event verification, reducing failure rates by 35%.

Real-Time Collaborative Code Editor | WebSocket, TypeScript, Docker
• Implemented operational transformation algorithms supporting 15 concurrent collaborators in low-latency rooms.
• Containerized backend services with Docker Compose, reducing environment setup time by 75%.

Education
Bachelor of Science in Computer Science
Columbia University | 2020 – 2024 | GPA: 3.8
`,
    expectedClassification: "FRESHER",
    expectedEmpScoreCheck: (score) => score === "N/A",
    expectedCat3ScoreCheck: (score) => score >= 11 && score <= 14, // Not 15/15, but high based on strong projects
  },

  // ── TEST 2: Fresher with NO projects ─────────────────────────────────────────
  {
    testNumber: 2,
    title: "Fresher with 0 Projects & 0 Experience",
    description: "Must classify as FRESHER or UNKNOWN. Project score must be 0/15. Must not award unearned points.",
    resumeText: `
Alice Wonder
alice@wonderland.edu | 555-432-1098 | Boston, MA
linkedin.com/in/alicewonder

Summary
Motivated student seeking first software engineering opportunity.

Technical Skills
Python, Java, C++, Git

Education
Bachelor of Science in Software Engineering
Boston University | 2021 – 2025
`,
    expectedClassification: "FRESHER",
    expectedEmpScoreCheck: (score) => score === "N/A",
    expectedCat3ScoreCheck: (score) => score === 0, // 0 points because no projects and no experience!
  },

  // ── TEST 3: Internship-Only Resume ───────────────────────────────────────────
  {
    testNumber: 3,
    title: "Internship-Only Candidate",
    description: "Must classify as INTERNSHIP_ONLY. Evaluated on internship deliverables (max 10) + projects (max 5).",
    resumeText: `
Bob Smith
bob.smith@tech.org | +1 555-888-9999 | Austin, TX
linkedin.com/in/bobsmith | github.com/bobsmith

Summary
Junior developer with software engineering internship experience in distributed backend systems.

Technical Skills
Go, Kubernetes, Docker, gRPC, PostgreSQL, Git

Internship Experience
Software Engineer Intern | CloudScale Systems | Jun 2023 – Aug 2023
• Built REST and gRPC microservices in Go, reducing inter-service request latency by 28%.
• Engineered unit and integration test suites, elevating test coverage from 62% to 89%.

Projects
Distributed Key-Value Store | Go, Raft, gRPC
• Implemented Raft consensus protocol supporting leader election and log replication across 5 nodes.
• Benchmarked cluster throughput to 12,000 queries per second with zero data corruption.

Education
B.S. in Computer Science | University of Texas at Austin | 2020 – 2024
`,
    expectedClassification: "INTERNSHIP_ONLY",
    expectedEmpScoreCheck: (score) => score === "N/A",
    expectedCat3ScoreCheck: (score) => score >= 11 && score <= 15,
  },

  // ── TEST 4: Experienced with 3 employment records ────────────────────────────
  {
    testNumber: 4,
    title: "Experienced Professional with 3 Employment Records",
    description: "Must classify as EXPERIENCED. Evaluated on employment quality (max 10) + key projects (max 5).",
    resumeText: `
Carol Senior
carol.senior@enterprise.com | 555-777-3333 | Seattle, WA
linkedin.com/in/carolsenior | github.com/carolsenior

Summary
Senior Software Engineer with 7+ years of industry experience leading high-throughput cloud infrastructure and API systems.

Technical Skills
Java, Spring Boot, AWS, Kafka, Kubernetes, PostgreSQL, TypeScript, React

Experience
Lead Backend Engineer | Amazon Web Services | Jan 2022 – Present
• Architected event-driven data streaming pipelines with Apache Kafka, processing 40M daily events.
• Reduced infrastructure operational costs by 34% through Kubernetes autoscaling and spot instances.

Software Engineer II | Microsoft | Jun 2019 – Dec 2021
• Developed customer identity management microservices with Spring Boot, serving 12M global users.
• Migrated legacy monolithic authentication to OAuth 2.0 / OIDC, slashing login failure rates by 45%.

Software Engineer | Expedia Group | Aug 2017 – May 2019
• Built search and booking flight aggregation service, increasing query throughput by 50%.
• Refactored SQL queries and database indexes, reducing p99 latency from 1.8s to 210ms.

Key Projects
Open-Source Distributed Cache | Java, Netty
• Developed high-speed caching engine achieving 100k OPS with custom LRU eviction policy.

Education
Master of Science in Computer Science | University of Washington | 2015 – 2017
Bachelor of Science in Computer Science | Purdue University | 2011 – 2015
`,
    expectedClassification: "EXPERIENCED",
    expectedEmpScoreCheck: (score) => typeof score === "number" && score >= 8,
    expectedCat3ScoreCheck: (score) => score >= 13 && score <= 15,
  },

  // ── TEST 5: Experienced with missing employment dates ─────────────────────────
  {
    testNumber: 5,
    title: "Experienced Professional with Missing Employment Dates",
    description: "Must classify as EXPERIENCED but trigger date warning and deduct tenure points.",
    resumeText: `
Dan Ambiguous
dan@techcorp.io | 555-222-1111 | Chicago, IL
linkedin.com/in/danambiguous

Summary
Software developer with experience in Node.js and React.

Technical Skills
JavaScript, React, Node.js, Express, MongoDB

Experience
Full Stack Developer | Acme Digital
• Built responsive web applications using React and Redux.
• Maintained MongoDB databases and designed RESTful endpoints.

Junior Developer | Beta Solutions
• Assisted with bug fixes and customer support requests.
• Developed front-end components using HTML and CSS.

Education
Bachelor of Arts in Information Technology | DePaul University
`,
    expectedClassification: "EXPERIENCED",
    expectedEmpScoreCheck: (score) => typeof score === "number" && score <= 7, // Penalized for lack of dates & metrics
    expectedCat3ScoreCheck: (score) => score <= 9,
  },

  // ── TEST 6: Mislabelled Projects under Experience ────────────────────────────
  {
    testNumber: 6,
    title: "Projects Incorrectly Labeled Under Work Experience",
    description: "Parser must detect 'Academic Project' / 'Personal Project' and route to projects, classifying as FRESHER.",
    resumeText: `
Emma Student
emma@college.edu | 555-901-2345 | Atlanta, GA
linkedin.com/in/emmastudent | github.com/emmastudent

Summary
Graduate student passionate about machine learning and data engineering.

Technical Skills
Python, PyTorch, Pandas, Scikit-Learn, SQL, Docker

Work Experience
Academic Project: Deep Learning Image Classifier | Jan 2024 – May 2024
• Trained convolutional neural networks with PyTorch, achieving 92.4% test accuracy on CIFAR-100.
• Deployed model inference service via FastAPI and Docker, handling 50 requests per second.

Personal Project: Stock Market Trend Predictor | Sep 2023 – Dec 2023
• Built LSTM recurrent neural network predicting daily equity price movements with Pandas.
• Visualized predictions using Streamlit interactive charts.

Education
B.S. in Computer Science | Georgia Institute of Technology | 2020 – 2024
`,
    expectedClassification: "FRESHER", // Must NOT classify as EXPERIENCED!
    expectedEmpScoreCheck: (score) => score === "N/A",
    expectedCat3ScoreCheck: (score) => score >= 10 && score <= 14,
  },

  // ── TEST 7: Claimed 5 Years Experience but Unverifiable ────────────────────────
  {
    testNumber: 7,
    title: "Claimed 5+ Years Experience but 0 Structured Records",
    description: "Must detect inconsistency, flag confidence warning, and award 0 for employment presence.",
    resumeText: `
Frank Phantom
frank@phantom.net | 555-666-4444 | Denver, CO
linkedin.com/in/frankphantom

Summary
Results-driven Senior Full Stack Architect with 5+ years of software experience delivering high-impact cloud platforms.

Technical Skills
Node.js, React, AWS, Docker, Kubernetes, GraphQL

Projects
Portfolio Platform | React, Tailwind
• Created personal developer portfolio showcasing web widgets.

Education
B.S. in Computer Science | University of Colorado | 2019
`,
    expectedClassification: "FRESHER", // Filtered to fresher because 0 employment records, but with warning
    expectedEmpScoreCheck: (score) => score === "N/A" || score === 0,
    expectedCat3ScoreCheck: (score) => score <= 8, // Severely penalized for weak project history
  },

  // ── TEST 8: Mixed Experience (Internship + Full-Time Employment) ─────────────
  {
    testNumber: 8,
    title: "Mixed Career Candidate (Full-Time Employment + Internship)",
    description: "Must classify as MIXED. Evaluated under Mixed policy (Emp 8 + Int 3 + Prj 4).",
    resumeText: `
Grace Mixed
grace@mixedcareer.com | 555-333-8888 | San Francisco, CA
linkedin.com/in/gracemixed | github.com/gracemixed

Summary
Software Engineer with 2 years of full-time industry experience and prior internships in fintech.

Technical Skills
TypeScript, Node.js, Go, React, PostgreSQL, Docker, AWS

Experience
Software Engineer | FinTech Corp | Jul 2022 – Present
• Engineered payment ledger reconciliation service processing $5M daily transaction volume.
• Reduced database query latency by 44% by implementing Redis read caching.

Internship Experience
Software Engineer Intern | PaymentTech Inc | May 2021 – Aug 2021
• Developed automated KYC document verification pipeline with Python and AWS S3.
• Accelerated onboarding verification throughput by 22%.

Key Projects
Algorithmic Trading Bot | Go, WebSockets
• Architected low-latency market making bot connecting to Binance order books.

Education
B.S. in Computer Science | UC Berkeley | 2018 – 2022
`,
    expectedClassification: "MIXED",
    expectedEmpScoreCheck: (score) => typeof score === "number" && score >= 5,
    expectedCat3ScoreCheck: (score) => score >= 12 && score <= 15,
  },

  // ── TEST 9: Strong Technical Skills but Poor Project Descriptions ────────────
  {
    testNumber: 9,
    title: "Strong Technical Skills with Weak, Passive Project Descriptions",
    description: "Must classify as FRESHER. Must penalize passive voice and lack of metrics in Category 3.",
    resumeText: `
Hannah Student
hannah@univ.edu | 555-111-2222 | Dallas, TX
linkedin.com/in/hannahstudent

Summary
Student with extensive knowledge of modern technologies looking for an internship or entry role.

Technical Skills
Languages: Python, JavaScript, TypeScript, Java, C++, Go, Rust, Ruby, SQL, HTML, CSS
Frameworks: React, Angular, Vue, Node.js, Django, Spring Boot, Express, Flask
Databases: PostgreSQL, MongoDB, Redis, MySQL, Cassandra
Cloud & Tools: AWS, GCP, Docker, Kubernetes, Git, Jenkins, Terraform

Projects
Web App
• Worked on a web application with React and Node.js.
• Helped team members write code for different features.
• Responsible for testing and fixing bugs in the application.

Database Project
• Involved in database design using SQL.
• Handled queries for the backend.

Education
B.S. in Computer Science | UT Dallas | 2020 – 2024
`,
    expectedClassification: "FRESHER",
    expectedEmpScoreCheck: (score) => score === "N/A",
    expectedCat3ScoreCheck: (score) => score <= 8, // Severely penalized for passive descriptions without metrics
  },

  // ── TEST 10: Scanned PDF / Empty Text Layer ──────────────────────────────────
  {
    testNumber: 10,
    title: "Scanned PDF / Low Extraction Confidence",
    description: "Must flag scanned document in Formatting and deduct critical points in Category 4.",
    resumeText: "Scanned Document Page 1",
    options: { isScanned: true },
    expectedClassification: "UNKNOWN",
    expectedEmpScoreCheck: (score) => true,
    expectedCat3ScoreCheck: (score) => score <= 5,
  },
];

async function runAll10PersonaTests() {
  console.log("================================================================================");
  console.log("       INTERVIEWAI — 10 CANDIDATE PERSONA REGRESSION TEST SUITE");
  console.log("================================================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  for (const tc of testCases) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`RUNNING TEST ${tc.testNumber}: ${tc.title}`);
    console.log(`Intent: ${tc.description}`);
    console.log(`--------------------------------------------------------------------------------`);

    // Step 1: Parse resume text using ResumeParser
    const parsed = ResumeParser.parseTextToResume(tc.resumeText, `candidate_${tc.testNumber}.pdf`);

    // Step 2: Evaluate using AtsScoringService
    const result = AtsScoringService.evaluate(tc.resumeText, parsed.profileData, {
      mode: "GENERAL",
      pageCount: 1,
      isScanned: tc.options?.isScanned ?? false,
      fileName: `candidate_${tc.testNumber}.pdf`,
    });

    const classification = result.candidateClassification;
    const cat3 = result.categoryScores.experienceProjects;

    console.log(`[Results]`);
    console.log(`• Extracted Full-Time Roles: ${parsed.profileData.experience.length}`);
    console.log(`• Extracted Internships:     ${parsed.profileData.internships.length}`);
    console.log(`• Extracted Projects:        ${parsed.profileData.projects.length}`);
    console.log(`• Candidate Classification:  ${classification.experienceLevel} (Expected: ${tc.expectedClassification})`);
    console.log(`• Applied Scoring Policy:    ${classification.appliedScoringPolicy}`);
    console.log(`• Professional Emp Score:    ${cat3.professionalEmploymentScore}`);
    console.log(`• Project Quality Score:     ${cat3.projectScore}`);
    console.log(`• Cat 3 Total Score:         ${cat3.score}/${cat3.maxScore}`);
    console.log(`• Overall Resume ATS Score:  ${result.overallScore}/100 (${result.scoreBand})`);

    // Assertions
    const classPassed = classification.experienceLevel === tc.expectedClassification;
    const empPassed = tc.expectedEmpScoreCheck(cat3.professionalEmploymentScore);
    const cat3Passed = tc.expectedCat3ScoreCheck(cat3.score);

    let testSuccess = classPassed && empPassed && cat3Passed;

    if (testSuccess) {
      console.log(`>>> STATUS: ✅ PASSED\n`);
      passedTests++;
    } else {
      console.log(`>>> STATUS: ❌ FAILED`);
      if (!classPassed) console.log(`   - Classification Mismatch: Got ${classification.experienceLevel}, Expected ${tc.expectedClassification}`);
      if (!empPassed) console.log(`   - Employment Subscore Check Failed: Got ${cat3.professionalEmploymentScore}`);
      if (!cat3Passed) console.log(`   - Cat 3 Score Range Check Failed: Got ${cat3.score}`);
      console.log("");
      failedTests++;
    }
  }

  console.log("================================================================================");
  console.log(`TEST RUN COMPLETE: ${passedTests}/${testCases.length} Passed, ${failedTests} Failed.`);
  console.log("================================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAll10PersonaTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
