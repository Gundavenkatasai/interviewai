import { describe, it, expect } from 'vitest';
import { JobDeduplicator } from '../ingestion/job.deduplicator';

describe('Job Deduplication & Provenance', () => {
  it('should append new source to sourceReferences when deduplicating', async () => {
    const job1 = {
      title: 'Software Engineer',
      companyName: 'Tech Corp',
      location: 'India',
      description: 'A great role',
      source: 'Indeed',
      sourceJobId: '123'
    };

    const hash = JobDeduplicator.generateContentHash(job1);
    const key = JobDeduplicator.generateCanonicalKey(job1);
    
    // Simulate what the DB returns on content match
    const existingJob = {
      _id: 'mock-uuid',
      title: 'Software Engineer',
      source: 'Indeed',
      contentHash: hash,
      duplicateClusterId: key,
      sourceReferences: [{ source: 'Indeed', sourceJobId: '123' }],
      save: async () => {} // Mock save
    };

    // New job from Foundit that is identical
    const job2 = {
      title: 'Software Engineer',
      companyName: 'Tech Corp',
      location: 'India',
      description: 'A great role',
      source: 'Foundit',
      sourceJobId: 'abc',
      sourceReferences: [{ source: 'Foundit', sourceJobId: 'abc' }]
    };

    // Override Job.findOne for the test
    const { Job } = require('../jobs.model');
    const originalFindOne = Job.findOne;
    
    try {
      Job.findOne = async (query: any) => {
        if (query.source === 'Foundit') return null; // exact source match fails
        if (query.contentHash === hash) return existingJob; // content match succeeds
        return null;
      };

      const result = await JobDeduplicator.deduplicate(job2);
      
      expect(result).toBeDefined();
      expect(result?.source).toBe('Indeed'); // primary source remains original
      expect(result?.sourceReferences.length).toBe(2);
      expect(result?.sourceReferences[1].source).toBe('Foundit');
      
    } finally {
      Job.findOne = originalFindOne;
    }
  });
});
