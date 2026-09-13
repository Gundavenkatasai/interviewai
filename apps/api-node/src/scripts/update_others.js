const fs = require('fs');
const path = require('path');

const adapters = ['indeed.adapter.ts', 'internshala.adapter.ts'];

for (const file of adapters) {
  const filePath = path.join('src', 'modules', 'jobs', 'ingestion', 'adapters', file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/status: "HEALTHY"/g, 'status: "RESTRICTED"');
  content = content.replace(/averageLatency: \d+,/g, 'averageLatency: 0,');
  content = content.replace(/errorRate: 0/g, 'errorRate: 100,\n      restriction: "External Limitation: Blocked by Cloudflare or advanced anti-bot protection (403 Forbidden / ERR_ABORTED)."');
  
  // Replace search body
  const searchStart = content.indexOf('async search(request: JobSearchRequest): Promise<JobSearchPage> {');
  if (searchStart !== -1) {
     content = content.substring(0, searchStart) + `async search(request: JobSearchRequest): Promise<JobSearchPage> {
    return {
      jobs: [],
      hasNextPage: false,
      totalFetched: 0,
      stoppedReason: "RESTRICTED"
    };
  }
}
`;
  }
  
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
}
