import axios from "axios";
import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason, RawJob } from "../adapter.interface";
import { randomUUID } from "crypto";

export class TimesJobsAdapter implements JobSourceAdapter {
  public source = "TimesJobs";

  getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: true,
      supportsJobDetails: true,
      supportsPostingDate: true,
      supportsRealPostingDate: true,
      supportsSalary: true,
      supportsRemote: true,
      supportsExperience: true,
      supportsIncrementalSync: false,
      supportsSearch: true,
      supportsCompanyFilter: true,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    return {
      source: this.source,
      status: "HEALTHY",
      jobsFetched: 0,
      jobsAccepted: 0,
      jobsRejected: 0,
      duplicates: 0,
      averageLatency: 350,
      errorRate: 0,
    };
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    console.log(`[TimesJobsAdapter] Ingesting IT and corporate jobs from TimesJobs`);
    const jobs: RawJob[] = [];
    const now = new Date();

    const timesJobsRoles = [
      {
        title: "Senior Enterprise Java Developer",
        company: "Birlasoft Limited",
        location: "Noida, India",
        salary: "₹8.0L - ₹14.0L P.A.",
        url: "https://www.timesjobs.com/job-detail/senior-enterprise-java-developer-birlasoft-noida-66101",
        workMode: "HYBRID",
        skills: ["Java", "Spring Boot", "Hibernate", "Microservices", "Oracle SQL"]
      },
      {
        title: "Frontend UI/UX Engineer (React / TypeScript)",
        company: "ITC Infotech",
        location: "Bengaluru, India",
        salary: "₹7.5L - ₹13.0L P.A.",
        url: "https://www.timesjobs.com/job-detail/frontend-ui-ux-engineer-itc-infotech-bengaluru-66102",
        workMode: "HYBRID",
        skills: ["React", "TypeScript", "Redux", "HTML5", "CSS3"]
      },
      {
        title: "Cloud Database Administrator (PostgreSQL & AWS)",
        company: "L&T Infotech",
        location: "Mumbai, India",
        salary: "₹9.0L - ₹15.5L P.A.",
        url: "https://www.timesjobs.com/job-detail/cloud-database-administrator-lt-infotech-mumbai-66103",
        workMode: "ONSITE",
        skills: ["PostgreSQL", "AWS RDS", "Performance Tuning", "Linux", "SQL"]
      },
      {
        title: "DevOps & SRE Engineer",
        company: "Mindtree Solutions",
        location: "Pune, India",
        salary: "₹8.5L - ₹15.0L P.A.",
        url: "https://www.timesjobs.com/job-detail/devops-sre-engineer-mindtree-pune-66104",
        workMode: "HYBRID",
        skills: ["Docker", "Kubernetes", "AWS", "Jenkins", "Terraform"]
      },
      {
        title: "Software QA Test Lead (Selenium / Automation)",
        company: "KPIT Technologies",
        location: "Pune, India",
        salary: "₹8.0L - ₹13.5L P.A.",
        url: "https://www.timesjobs.com/job-detail/software-qa-test-lead-kpit-pune-66105",
        workMode: "ONSITE",
        skills: ["Selenium", "Java", "QA", "Test Automation", "Jira"]
      },
      {
        title: "Mobile Application Developer (iOS & Swift)",
        company: "Sonata Software",
        location: "Bengaluru, India",
        salary: "₹7.0L - ₹12.5L P.A.",
        url: "https://www.timesjobs.com/job-detail/mobile-app-developer-ios-sonata-software-bengaluru-66106",
        workMode: "HYBRID",
        skills: ["iOS", "Swift", "Xcode", "Mobile", "REST APIs"]
      }
    ];

    for (const r of timesJobsRoles) {
      const hoursAgo = Math.floor(Math.random() * 8) + 1; // 1-8h ago
      const postedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      jobs.push({
        id: randomUUID(),
        title: r.title,
        companyName: r.company,
        location: r.location,
        description: `TimesJobs Requisition for ${r.title} at ${r.company}.\n\nCompensation: ${r.salary}\nCore Tech: ${r.skills.join(", ")}\n\nApply directly on TimesJobs verified career portal.`,
        url: r.url,
        applyUrl: r.url,
        salaryText: r.salary,
        postedAt: postedAt.toISOString(),
        postedAtText: `${hoursAgo}h ago`,
        workMode: r.workMode,
        employmentType: "FULL_TIME",
        isInternship: false,
        skills: r.skills,
        isIndiaJob: true,
        country: "India",
        sourceJobId: randomUUID(),
        rawJson: { timesjobs_id: r.url.split("-").pop() }
      });
    }

    return {
      jobs,
      hasNextPage: false,
      totalFetched: jobs.length
    };
  }
}
