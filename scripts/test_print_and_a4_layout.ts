import { computeLayoutDensity, getDensityStyles } from "../apps/web/src/components/resume-templates/density-config";
import { IStructuredResume } from "../apps/web/src/types/resume-schema";
import { ResumePdfExporterService } from "../apps/api-node/src/modules/resume/pdf-export/resume-pdf-exporter.service";
import { PDFDocument } from "pdf-lib";

async function runTests() {
  console.log("==================================================");
  console.log("TEST A: SHORT RESUME (SPACIOUS DENSITY CALIBRATION)");
  console.log("==================================================");
  const shortResume: IStructuredResume = {
    basics: {
      name: "Alex Morgan",
      title: "Junior Frontend Engineer",
      email: "alex@example.com",
      phone: "+91 98765 43210",
      location: "Bengaluru, India",
      links: [{ label: "GitHub", url: "https://github.com/alex" }]
    },
    summary: "Passionate frontend developer specializing in responsive React applications, modern UI state architecture, and accessible web experiences.",
    skills: [
      { category: "Frontend", items: ["React.js", "TypeScript", "Tailwind CSS", "Next.js"] },
      { category: "Tools", items: ["Git", "Vite", "Jest", "Figma"] }
    ],
    experience: [],
    projects: [
      {
        name: "ShopSphere E-Commerce",
        technologies: ["React", "TypeScript", "Tailwind CSS"],
        bullets: [
          "Developed responsive checkout experience reducing cart abandonment by 18%",
          "Architected client-side filtering for 500+ SKU catalog with sub-50ms render latency"
        ]
      },
      {
        name: "Telemetry Dashboard",
        technologies: ["React", "Chart.js", "WebSocket"],
        bullets: [
          "Implemented live streaming telemetry feeds updating at 60fps with zero layout thrashing",
          "Engineered dark mode theme persistence and role-based access controls"
        ]
      }
    ],
    education: [
      {
        institution: "National Institute of Technology",
        degree: "B.Tech in Computer Science",
        startDate: "2020",
        endDate: "2024",
        gpa: "8.8/10"
      }
    ],
    certifications: [
      { name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", date: "2024" }
    ]
  };

  const shortDensity = computeLayoutDensity(shortResume);
  console.log("Short resume computed density:", shortDensity);
  if (shortDensity !== "spacious") {
    throw new Error(`Expected 'spacious' density for short resume, got ${shortDensity}`);
  }
  const shortStyles = getDensityStyles(shortDensity);
  console.log("Spacious styles headerName:", shortStyles.headerName, "| body:", shortStyles.summaryText);
  console.log("✓ Short resume correctly configured with spacious executive spacing.");

  // Test PDF generation for short resume
  const shortPdfBuffer = await ResumePdfExporterService.exportToPdf(shortResume, "tech-fresher");
  const shortPdfDoc = await PDFDocument.load(shortPdfBuffer);
  console.log(`Short resume PDF: ${shortPdfBuffer.length} bytes, Page count: ${shortPdfDoc.getPageCount()}`);
  if (shortPdfDoc.getPageCount() !== 1) {
    throw new Error(`Short resume PDF page count must be 1, got ${shortPdfDoc.getPageCount()}`);
  }
  console.log("✓ Short resume PDF successfully generated on EXACTLY 1 A4 page.");

  console.log("\n==================================================");
  console.log("TEST B: LONG / EXPERIENCED RESUME (COMPACT DENSITY)");
  console.log("==================================================");
  const longResume: IStructuredResume = {
    basics: {
      name: "Marcus Vance",
      title: "Senior Full Stack Architect",
      email: "marcus.vance@example.com",
      phone: "+91 99887 76655",
      location: "Hyderabad, India",
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/marcus" },
        { label: "GitHub", url: "https://github.com/marcus" }
      ]
    },
    summary: "Senior Full Stack Systems Architect with 7+ years of expertise in high-concurrency distributed web platforms, microservices architecture, and cloud reliability engineering across multi-region enterprise deployments.",
    skills: [
      { category: "Languages", items: ["TypeScript", "JavaScript", "Python", "Go", "Java", "SQL"] },
      { category: "Backend", items: ["Node.js", "Express", "Fastify", "GraphQL", "gRPC", "Redis"] },
      { category: "Frontend", items: ["React", "Next.js", "Vue.js", "Tailwind CSS", "Redux Toolkit"] },
      { category: "DevOps & Cloud", items: ["Docker", "Kubernetes", "AWS", "GCP", "Terraform", "CI/CD"] }
    ],
    experience: [
      {
        company: "Stripe Infrastructure",
        role: "Lead Platform Engineer",
        startDate: "2021",
        endDate: "Present",
        current: true,
        bullets: [
          "Architected multi-tenant billing engine processing $120M+ annualized GMV with 99.995% SLA availability",
          "Reduced distributed trace latency by 34% by migrating monolithic RPC routes to asynchronous Kafka workers"
        ]
      },
      {
        company: "Acme Cloud Services",
        role: "Senior Software Engineer",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Led 8-person engineering team shipping real-time collaboration canvas with WebRTC mesh audio",
          "Optimized PostgreSQL connection pool and materialized query caches saving $45k monthly cloud spend"
        ]
      }
    ],
    projects: [
      {
        name: "KubeScale Autoscaler",
        technologies: ["Go", "Kubernetes API", "Prometheus"],
        bullets: [
          "Developed open-source horizontal pod autoscaler based on custom queue depth metrics with 1.2k GitHub stars",
          "Automated dynamic spot instance drain cycles preventing dropped requests during cluster scaling events"
        ]
      },
      {
        name: "Distributed Lock Manager",
        technologies: ["Rust", "Redis", "Raft Consensus"],
        bullets: [
          "Engineered Redlock consensus algorithm implementation handling 50k lock acquisitions per second",
          "Eliminated split-brain network partition hazards through deterministic lease expiration timers"
        ]
      }
    ],
    education: [
      {
        institution: "Indian Institute of Technology",
        degree: "M.Tech in Distributed Systems",
        startDate: "2016",
        endDate: "2018",
        gpa: "9.2/10"
      },
      {
        institution: "Birla Institute of Technology",
        degree: "B.Tech in Computer Science",
        startDate: "2012",
        endDate: "2016",
        gpa: "8.9/10"
      }
    ],
    certifications: [
      { name: "Certified Kubernetes Administrator (CKA)", issuer: "CNCF", date: "2023" },
      { name: "AWS Solutions Architect Professional", issuer: "Amazon Web Services", date: "2022" },
      { name: "Google Cloud Professional Data Engineer", issuer: "Google", date: "2021" }
    ],
    achievements: [
      { title: "Keynote Speaker at KubeCon Global 2023 on Resilient Edge Microservices" },
      { title: "Winner of Global FinTech Hackathon 2022 for Real-time Fraud Detection Model" }
    ]
  };

  const longDensity = computeLayoutDensity(longResume);
  console.log("Long resume computed density:", longDensity);
  if (longDensity !== "compact") {
    throw new Error(`Expected 'compact' density for long resume, got ${longDensity}`);
  }
  const longStyles = getDensityStyles(longDensity);
  console.log("Compact styles headerName:", longStyles.headerName, "| body:", longStyles.summaryText);
  console.log("✓ Long resume correctly configured with compact spacing.");

  // Test PDF generation for long resume across templates
  const longPdfBuffer = await ResumePdfExporterService.exportToPdf(longResume, "experienced-prof");
  const longPdfDoc = await PDFDocument.load(longPdfBuffer);
  console.log(`Long resume PDF: ${longPdfBuffer.length} bytes, Page count: ${longPdfDoc.getPageCount()}`);
  if (longPdfDoc.getPageCount() !== 1) {
    throw new Error(`Long resume PDF page count must be 1, got ${longPdfDoc.getPageCount()}`);
  }
  console.log("✓ Long resume PDF successfully generated on EXACTLY 1 A4 page with zero overflow.");

  console.log("\n==================================================");
  console.log("TEST C: ALL 6 TEMPLATES ON LONG RESUME (STRICT 1 PAGE)");
  console.log("==================================================");
  const templates = ["classic-ats", "tech-fresher", "modern-minimal", "experienced-prof", "academic", "modern-tech"] as const;
  for (const t of templates) {
    const buf = await ResumePdfExporterService.exportToPdf(longResume, t);
    const doc = await PDFDocument.load(buf);
    const count = doc.getPageCount();
    console.log(`Template [${t}] -> Size: ${buf.length} bytes | Pages: ${count}`);
    if (count !== 1) {
      throw new Error(`Template ${t} produced ${count} pages instead of 1!`);
    }
  }
  console.log("✓ All 6 templates passed strict 1 A4 page verification on heavy content!");

  console.log("\n>>> ALL TESTS PASSED WITH 100% SUCCESS! <<<");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
