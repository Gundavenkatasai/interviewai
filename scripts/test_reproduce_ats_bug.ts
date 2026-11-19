import { AtsScoringService } from "../apps/api-node/src/modules/ats/ats-scoring.service";

async function reproduceBug() {
  console.log("================================================================================");
  console.log("REPRODUCING THE BUG: Fresher resume with NO experience section getting 15/15");
  console.log("================================================================================");

  const fresherResumeText = `
Alex Student
alex.student@university.edu | +1 (555) 123-4567 | San Jose, CA
linkedin.com/in/alexstudent | github.com/alexstudent

Professional Summary
Enthusiastic Computer Science graduate with strong foundational skills in React, TypeScript, and Node.js. Seeking entry-level software engineering opportunities.

Technical Skills
Languages: JavaScript, TypeScript, Python, HTML/CSS, SQL
Frameworks & Libraries: React, Node.js, Express, Tailwind CSS
Tools: Git, GitHub, VS Code, Postman

Key Engineering Projects
Project 1: E-Commerce Storefront
• Engineered full-stack e-commerce web application with React and Node.js, supporting 1,000+ mock products.
• Implemented JWT authentication and Stripe payment integration, reducing checkout errors by 25%.

Project 2: Task Collaboration Tool
• Architected real-time kanban board using WebSockets and PostgreSQL, handling 20 concurrent rooms.
• Optimized state management with Zustand, improving client render latency by 30%.

Education
Bachelor of Science in Computer Science
San Jose State University | 2020 – 2024 | GPA: 3.8
`;

  const profileData = {
    personal: {
      fullName: "Alex Student",
      email: "alex.student@university.edu",
      phone: "+1 555-123-4567",
      linkedin: "linkedin.com/in/alexstudent",
      github: "github.com/alexstudent",
    },
    summary: "Enthusiastic Computer Science graduate with strong foundational skills in React, TypeScript, and Node.js.",
    skills: {
      languages: ["JavaScript", "TypeScript", "Python", "SQL"],
      frameworks: ["React", "Node.js", "Express", "Tailwind CSS"],
      tools: ["Git", "Postman"],
    },
    experience: [], // ZERO PROFESSIONAL EXPERIENCE!
    projects: [
      {
        name: "E-Commerce Storefront",
        bullets: [
          "Engineered full-stack e-commerce web application with React and Node.js, supporting 1,000+ mock products.",
          "Implemented JWT authentication and Stripe payment integration, reducing checkout errors by 25%.",
        ],
      },
      {
        name: "Task Collaboration Tool",
        bullets: [
          "Architected real-time kanban board using WebSockets and PostgreSQL, handling 20 concurrent rooms.",
          "Optimized state management with Zustand, improving client render latency by 30%.",
        ],
      },
    ],
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: "San Jose State University",
        graduationYear: "2024",
      },
    ],
  };

  const result = AtsScoringService.evaluate(fresherResumeText, profileData, {
    mode: "GENERAL",
    pageCount: 1,
    fileName: "Alex_Student_Resume.pdf",
  });

  console.log("\nEvaluation Results for Candidate with 0 Experience and 2 Projects:");
  console.log(`- Candidate Classification: ${result.candidateClassification.experienceLevel}`);
  console.log(`- Applied Policy: ${result.candidateClassification.appliedScoringPolicy}`);
  console.log(`- Professional Experience records in profile: ${profileData.experience.length}`);
  console.log(`- Projects in profile: ${profileData.projects.length}`);
  console.log(`- Professional Employment Sub-Score: ${result.categoryScores.experienceProjects.professionalEmploymentScore}`);
  console.log(`- Project Quality Sub-Score: ${result.categoryScores.experienceProjects.projectScore}/15`);
  console.log(`- Total Experience & Projects Score: ${result.categoryScores.experienceProjects.score}/${result.categoryScores.experienceProjects.maxScore}`);

  if (result.categoryScores.experienceProjects.score === 15) {
    console.log("\n❌ BUG CONFIRMED: Engine awarded 15/15 for Experience & Projects to a candidate with NO professional experience!");
    console.log("   Reason: The engine indiscriminately pooled project bullets into the experience calculation without distinguishing candidate classification or employment history.");
  } else {
    console.log("\n✅ SUCCESS: The bug is resolved!");
    console.log(`   - Candidate was correctly classified as ${result.candidateClassification.experienceLevel}.`);
    console.log(`   - Professional corporate employment was marked: ${result.categoryScores.experienceProjects.professionalEmploymentScore}.`);
    console.log(`   - Project Quality was evaluated independently: ${result.categoryScores.experienceProjects.projectScore}/15.`);
    console.log(`   - Category 3 score earned strictly on project evidence: ${result.categoryScores.experienceProjects.score}/15.`);
  }
}

reproduceBug().catch(console.error);
