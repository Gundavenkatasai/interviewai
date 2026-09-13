import { JobSourceAdapter, JobSearchRequest, JobSearchPage, SourceHealth, SourceCapabilities, StoppedReason } from "../adapter.interface";
import { BrowserService } from "../browser.service";

export class NaukriAdapter implements JobSourceAdapter {
  public source = "Naukri";

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
      averageLatency: 3000,
      errorRate: 0
    };
  }

  async search(request: JobSearchRequest): Promise<JobSearchPage> {
    console.log(`[NaukriAdapter] Scraping Naukri for: ${request.query} on page ${request.page || 1}`);
    const page = await BrowserService.getPage();
    const jobs: any[] = [];
    let hasNextPage = false;
    let stoppedReason: StoppedReason | undefined;
    
    try {
      // Naukri encodes search terms with dashes
      const queryParam = request.query ? request.query.toLowerCase().replace(/\s+/g, '-') : 'software-engineer';
      const pageNum = request.page || 1;
      const searchUrl = pageNum > 1 ? `https://www.naukri.com/${queryParam}-jobs-${pageNum}` : `https://www.naukri.com/${queryParam}-jobs`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Naukri uses aggressive bot protection, but basic headless might bypass the first few pages
      const listings = await page.$$eval('div.srp-jobtuple-wrapper', (elements) => {
        return elements.map(el => {
          const titleEl = el.querySelector('a.title');
          const title = titleEl?.textContent?.trim() || 'Unknown Title';
          const applyUrl = titleEl?.getAttribute('href') || '';
          
          const companyEl = el.querySelector('a.comp-name');
          const company = companyEl?.textContent?.trim() || 'Unknown Company';
          
          const expEl = el.querySelector('.exp-wrap span');
          const experience = expEl?.textContent?.trim() || '';
          
          const locEl = el.querySelector('.loc-wrap span');
          const location = locEl?.textContent?.trim() || 'Remote';
          
          const salEl = el.querySelector('.sal-wrap span');
          const salary = salEl?.textContent?.trim() || '';
          
          const descEl = el.querySelector('.job-desc');
          const description = descEl?.textContent?.trim() || '';
          
          const tags = Array.from(el.querySelectorAll('.tags-gt .tag-li')).map(t => t.textContent?.trim() || '');
          
          const dateEl = el.querySelector('.job-post-day');
          const postedAtText = dateEl?.textContent?.trim() || undefined;

          return { title, company, location, experience, salary, description, tags, url: applyUrl, postedAtText };
        });
      });

      for (const item of listings) {
        if (!item.title || !item.url) continue;

        jobs.push({
          title: item.title,
          companyName: item.company,
          location: item.location,
          description: item.description,
          workMode: item.location.toLowerCase().includes('remote') ? "REMOTE" : "ON-SITE",
          skills: item.tags,
          salaryText: item.salary,
          experienceText: item.experience,
          sourceUrl: item.url,
          applyUrl: item.url,
          id: item.url,
          source: this.source,
          postedAtText: item.postedAtText,
          isIndiaJob: true,
          country: "India",
        });
      }
      
      if (jobs.length === 0) {
         stoppedReason = "NO_RESULTS";
      }

      // Check for next page button
      const nextBtn = await page.$('.styles_btn-secondary__2g5SQ'); // Common Naukri pagination next button class
      if (nextBtn && jobs.length > 0) {
         hasNextPage = true;
      }

    } catch (err: any) {
      console.error("[NaukriAdapter] Scraping failed:", err);
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
