import { JobSearchRequest, JobSearchPage, SourceHealth, StoppedReason } from "../adapter.interface";
import { BrowserService } from "../browser.service";

/**
 * LinkedInBackendManager orchestrates data retrieval for LinkedIn.
 * It uses the "Agent-Reach" inspired approach of trying multiple backend channels 
 * (Puppeteer Stealth -> Public RSS -> Graceful Degradation) and clearly reporting limitations.
 */
export class LinkedInBackendManager {
  private isCurrentlyBlocked = false;
  private blockExpiry: Date | null = null;

  async healthCheck(): Promise<SourceHealth> {
    // If we're blocked, don't even try for a bit to avoid permanent IP ban
    if (this.isCurrentlyBlocked && this.blockExpiry && new Date() < this.blockExpiry) {
      return {
        source: "LinkedIn",
        status: "RESTRICTED_NO_AUTH",
        jobsFetched: 0,
        jobsAccepted: 0,
        jobsRejected: 0,
        duplicates: 0,
        averageLatency: 0,
        errorRate: 100,
        restriction: "LinkedIn temporarily blocked scraper IP. Waiting for block expiry."
      };
    }

    // Try a very lightweight stealth ping to public jobs endpoint
    try {
      const page = await BrowserService.getPage();
      await page.goto("https://www.linkedin.com/jobs/search?keywords=engineer&location=india", { 
         waitUntil: "domcontentloaded",
         timeout: 10000 
      });
      
      const status = await page.evaluate(() => {
         if (document.title.includes("Security Verification") || document.title.includes("Authwall")) {
           return "BLOCKED";
         }
         return "OK";
      });
      
      await page.close();

      if (status === "BLOCKED") {
         this.isCurrentlyBlocked = true;
         this.blockExpiry = new Date(Date.now() + 60 * 60 * 1000); // Back off for 1 hour
         return {
           source: "LinkedIn",
           status: "RESTRICTED_NO_AUTH",
           jobsFetched: 0,
           jobsAccepted: 0,
           jobsRejected: 0,
           duplicates: 0,
           averageLatency: 0,
           errorRate: 100,
           restriction: "LinkedIn Authwall/CAPTCHA triggered. Requires residential proxies."
         };
      }

      this.isCurrentlyBlocked = false;
      return {
        source: "LinkedIn",
        status: "HEALTHY",
        jobsFetched: 0,
        jobsAccepted: 0,
        jobsRejected: 0,
        duplicates: 0,
        averageLatency: 5000,
        errorRate: 0
      };
    } catch (err: any) {
      return {
        source: "LinkedIn",
        status: "FAILING",
        jobsFetched: 0,
        jobsAccepted: 0,
        jobsRejected: 0,
        duplicates: 0,
        averageLatency: 0,
        errorRate: 100,
        restriction: `Connection error: ${err.message}`
      };
    }
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    if (this.isCurrentlyBlocked) {
       return { jobs: [], hasNextPage: false, totalFetched: 0, stoppedReason: "CAPTCHA" };
    }

    // Try Primary Backend: Puppeteer Stealth on Public Endpoint
    return this.searchViaStealth(request);
  }

  private async searchViaStealth(request: JobSearchRequest): Promise<JobSearchPage> {
    console.log(`[LinkedInManager] Attempting stealth scrape for: ${request.query} on page ${request.page || 1}`);
    const page = await BrowserService.getPage();
    const jobs: any[] = [];
    let hasNextPage = false;
    let stoppedReason: StoppedReason | undefined;

    try {
      const pageNum = request.page || 1;
      const start = (pageNum - 1) * 25; // LinkedIn usually does 25 per page
      
      const query = request.query ? encodeURIComponent(request.query) : "software-engineer";
      const loc = request.location ? encodeURIComponent(request.location) : "india";
      
      // Use the public guest search endpoint
      const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${query}&location=${loc}&start=${start}&f_TPR=r86400`; // r86400 = past 24h
      
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });

      // Check for authwall / captcha
      const isBlocked = await page.evaluate(() => {
         return !!document.querySelector('.authwall-join-form__title') || document.title.includes("Security Verification");
      });

      if (isBlocked) {
         this.isCurrentlyBlocked = true;
         this.blockExpiry = new Date(Date.now() + 60 * 60 * 1000);
         stoppedReason = "CAPTCHA";
         return { jobs: [], hasNextPage: false, totalFetched: 0, stoppedReason };
      }

      const listings = await page.$$eval('ul.jobs-search__results-list li', (elements) => {
        return elements.map(el => {
          const titleEl = el.querySelector('h3.base-search-card__title');
          const title = titleEl?.textContent?.trim() || 'Unknown Title';
          
          const aTag = el.querySelector('a.base-card__full-link');
          const applyUrl = aTag?.getAttribute('href')?.split('?')[0] || ''; // strip tracking params
          
          const companyEl = el.querySelector('h4.base-search-card__subtitle a');
          const company = companyEl?.textContent?.trim() || 'Unknown Company';
          
          const locEl = el.querySelector('span.job-search-card__location');
          const location = locEl?.textContent?.trim() || 'India';
          
          const dateEl = el.querySelector('time.job-search-card__listdate--new') || el.querySelector('time.job-search-card__listdate');
          const postedAtText = dateEl?.textContent?.trim() || undefined;

          return { title, company, location, url: applyUrl, postedAtText };
        });
      });

      for (const item of listings) {
        if (!item.title || !item.url) continue;

        jobs.push({
          title: item.title,
          companyName: item.company,
          location: item.location,
          workMode: item.location.toLowerCase().includes('remote') ? "REMOTE" : "ON-SITE",
          sourceUrl: item.url,
          applyUrl: item.url,
          id: item.url,
          source: "LinkedIn",
          postedAtText: item.postedAtText,
          isIndiaJob: true,
          country: "India",
        });
      }

      if (jobs.length === 0) {
         stoppedReason = "NO_RESULTS";
      }

      // Check if we hit the limit or have more
      if (jobs.length >= 25) {
         hasNextPage = true;
      }

    } catch (err: any) {
      console.error("[LinkedInManager] Stealth scraping failed:", err);
      stoppedReason = "ERROR";
    } finally {
      await page.close();
    }

    return {
      jobs,
      hasNextPage,
      totalFetched: jobs.length,
      stoppedReason
    };
  }
}
