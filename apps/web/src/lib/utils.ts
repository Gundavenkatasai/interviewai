import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatSalary(min?: number, max?: number, currency = "INR", period = "year"): string {
  if (!min && !max) return "Not disclosed";
  const fmt = (n: number) => {
    if (currency === "INR") {
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      return `₹${n.toLocaleString("en-IN")}`;
    }
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export function getCompanyPortalUrl(job?: { company_name?: string; title?: string; application_url?: string } | null): string {
  if (!job) return "https://www.google.com/search?q=jobs+careers+apply";

  // If there's an existing valid application_url that is not an example.com placeholder, return it
  if (job.application_url && !job.application_url.includes("example.com")) {
    return job.application_url;
  }

  const company = (job.company_name || "").trim();
  const title = (job.title || "").trim();
  const c = company.toLowerCase();
  const t = encodeURIComponent(title);

  if (c.includes("google")) return `https://www.google.com/about/careers/applications/jobs/results/?q=${t}&location=India`;
  if (c.includes("microsoft")) return `https://jobs.careers.microsoft.com/global/en/search?q=${t}&lc=India`;
  if (c.includes("amazon")) return `https://www.amazon.jobs/en/search?base_query=${t}&loc_query=India`;
  if (c.includes("infosys")) return `https://career.infosys.com/jobs?keyword=${t}`;
  if (c.includes("tcs") || c.includes("tata consultancy")) return `https://www.tcs.com/careers/india`;
  if (c.includes("wipro")) return `https://careers.wipro.com/careers-home/jobs?keywords=${t}`;
  if (c.includes("hcl")) return `https://www.hcltech.com/careers/careers-in-india`;
  if (c.includes("tech mahindra")) return `https://careers.techmahindra.com/`;
  if (c.includes("zoho")) return `https://www.zoho.com/careers/`;
  if (c.includes("freshworks")) return `https://www.freshworks.com/company/careers/`;
  if (c.includes("swiggy")) return `https://careers.swiggy.com/#/jobs`;
  if (c.includes("zomato")) return `https://www.zomato.com/careers`;
  if (c.includes("phonepe")) return `https://www.phonepe.com/careers/`;
  if (c.includes("paytm")) return `https://paytm.com/careers/`;
  if (c.includes("razorpay")) return `https://razorpay.com/jobs/`;
  if (c.includes("cred")) return `https://cred.club/careers`;
  if (c.includes("flipkart")) return `https://www.flipkartcareers.com/#!/`;
  if (c.includes("myntra")) return `https://careers.myntra.com/`;
  if (c.includes("nykaa")) return `https://www.nykaa.com/careers`;
  if (c.includes("thoughtworks")) return `https://www.thoughtworks.com/careers/jobs?location=India&keyword=${t}`;
  if (c.includes("persistent")) return `https://www.persistent.com/careers/`;
  if (c.includes("nagarro")) return `https://www.nagarro.com/en/careers`;
  if (c.includes("l&t") || c.includes("ltts")) return `https://www.ltts.com/careers`;
  if (c.includes("ola")) return `https://careers.olacabs.com/`;
  if (c.includes("unacademy")) return `https://jobs.lever.co/unacademy`;
  if (c.includes("vedantu")) return `https://www.vedantu.com/careers`;
  if (c.includes("policybazaar")) return `https://www.policybazaar.com/careers/`;
  if (c.includes("lenskart")) return `https://hiring.lenskart.com/`;
  if (c.includes("capgemini")) return `https://www.capgemini.com/in-en/careers/job-search/?search=${t}`;
  if (c.includes("cognizant")) return `https://careers.cognizant.com/global/en/search-results?keywords=${t}`;
  if (c.includes("accenture")) return `https://www.accenture.com/in-en/careers/jobsearch?jk=${t}`;
  if (c.includes("ibm")) return `https://www.ibm.com/careers/search?q=${t}`;
  if (c.includes("oracle")) return `https://careers.oracle.com/jobs/#en/sites/jobsearch/requisitions?keyword=${t}`;
  if (c.includes("sap")) return `https://jobs.sap.com/search/?q=${t}&locationsearch=India`;
  if (c.includes("dell")) return `https://jobs.dell.com/search-jobs/${t}/India`;
  if (c.includes("groww")) return `https://groww.in/careers`;
  if (c.includes("zerodha")) return `https://zerodha.com/careers`;
  if (c.includes("meesho")) return `https://www.meesho.io/jobs`;
  if (c.includes("postman")) return `https://www.postman.com/company/careers/`;
  if (c.includes("makemytrip")) return `https://careers.makemytrip.com/`;
  if (c.includes("urban company")) return `https://www.urbancompany.com/careers`;
  if (c.includes("mphasis")) return `https://careers.mphasis.com/`;
  if (c.includes("hexaware")) return `https://jobs.hexaware.com/`;
  if (c.includes("globallogic")) return `https://www.globallogic.com/careers/`;
  if (c.includes("epam")) return `https://www.epam.com/careers`;

  // Fallback: Google search direct to career apply
  const query = encodeURIComponent(`${company} ${title} careers apply`.trim());
  return `https://www.google.com/search?q=${query}`;
}

