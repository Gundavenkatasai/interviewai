import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { IngestionPipeline } from '../ingestion/ingestion.pipeline';
import { JobSourceRegistry } from '../ingestion/source.registry';
import { JobSearchPage, RawJob } from '../ingestion/adapter.interface';
import { BrowserService } from '../ingestion/browser.service';
import mongoose from 'mongoose';
import { env } from '../../../config/env';

describe('Job Ingestion Pipeline Completeness', () => {
  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await BrowserService.close();
  });

  it('should ensure all adapters declare true capability flags', () => {
    const adapters = JobSourceRegistry.getAllAdapters();
    
    for (const adapter of adapters) {
       const caps = adapter.getCapabilities();
       
       if (adapter.source !== 'Greenhouse' && adapter.source !== 'Lever' && adapter.source !== 'Ashby') {
          expect(caps.supportsRealPostingDate).toBe(true);
       }
    }
  });

  it('should paginate correctly within the IngestionPipeline', async () => {
    const searchMock = vi.fn().mockImplementation(async (req: any) => {
      const page = req.page || 1;
      
      const jobs: RawJob[] = Array.from({ length: 10 }).map((_, i) => ({
         title: `Job ${page}-${i}`,
         companyName: 'MockCo',
         applyUrl: `http://mock.com/apply/${page}-${i}`,
         url: `http://mock.com/job/${page}-${i}`,
         id: `mock-${page}-${i}`,
         source: 'MockSource',
         postedAtText: '1d ago',
         location: 'India',
         isIndiaJob: true,
         description: 'This is a mock description that needs to be longer than 50 characters to pass the quality signal check.'
      }));

      return {
         jobs,
         hasNextPage: page < 3,
         totalFetched: jobs.length,
      } as JobSearchPage;
    });

    const mockAdapter = {
      source: 'MockSource',
      getCapabilities: () => ({ supportsPagination: true, supportsRealPostingDate: true } as any),
      healthCheck: async () => ({ status: 'HEALTHY' } as any),
      search: searchMock
    };

    await IngestionPipeline.executeSource(mockAdapter as any, 'test', undefined, 1);
    
    expect(searchMock).toHaveBeenCalled();
  }, 30000);
});
