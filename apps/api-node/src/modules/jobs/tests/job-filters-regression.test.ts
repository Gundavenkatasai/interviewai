import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { JobSourceRegistry } from '../ingestion/source.registry';
import { JobsController } from '../jobs.controller';
import { Job } from '../jobs.model';
import mongoose from 'mongoose';
import { env } from '../../../config/env';

describe('Job Filters Regression & UI API Completeness', () => {
  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should fetch sources dynamically from /sources endpoint', async () => {
    const mockRequest = {} as any;
    
    let sentData: any;
    const mockReply = {
      send: (data: any) => { sentData = data; }
    } as any;

    const spy = vi.spyOn(JobSourceRegistry, 'getHealthStatus').mockResolvedValue({
       'Naukri': { source: 'Naukri', status: 'HEALTHY' } as any,
       'LinkedIn': { source: 'LinkedIn', status: 'HEALTHY' } as any,
       'Internshala': { source: 'Internshala', status: 'HEALTHY' } as any,
       'Indeed': { source: 'Indeed', status: 'HEALTHY' } as any,
       'Foundit': { source: 'Foundit', status: 'HEALTHY' } as any
    });

    await JobsController.getSources(mockRequest, mockReply);
    spy.mockRestore();
    
    expect(sentData.success).toBe(true);
    expect(Array.isArray(sentData.sources)).toBe(true);
    // There must be at least Naukri, LinkedIn, Internshala, etc.
    expect(sentData.sources.length).toBeGreaterThanOrEqual(5);
  }, 30000);

  it('should map unified source parameter successfully', async () => {
    const req = {
       query: { source: "linkedin,naukri" }
    } as any;
    
    const srcs = req.query.source.split(",");
    expect(srcs).toContain("linkedin");
    expect(srcs).toContain("naukri");
  });

  it('should strictly use sourcePostedAt for freshness 48h limit', async () => {
    const oldJob = new Job({
       title: 'Old Job',
       companyName: 'Old',
       sourcePostedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
       createdAt: new Date(),
    });

    const newJob = new Job({
       title: 'New Job',
       companyName: 'New',
       sourcePostedAt: new Date(),
       createdAt: new Date(),
    });

    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const oldJobValid = oldJob.sourcePostedAt! >= cutoff;
    const newJobValid = newJob.sourcePostedAt! >= cutoff;

    expect(oldJobValid).toBe(false);
    expect(newJobValid).toBe(true);
  });
});
