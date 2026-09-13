import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 5 }, // Ramp up to 5 users
    { duration: '10s', target: 5 }, // Stay at 5 users for 10 seconds
    { duration: '5s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'], // less than 1% failure rate
  },
};

const BASE_URL = 'http://localhost:3000';
let token = '';

export function setup() {
  // Login to get token for tests
  const payload = JSON.stringify({
    email: 'e2e-user@applyhustle.test',
    password: 'Password123!',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);
  
  // We assume the backend uses HttpOnly cookies or returns a token. 
  // If it returns a token in the body:
  let extractedToken = '';
  try {
    const body = res.json();
    extractedToken = body.token || '';
  } catch (e) {
    // ignore
  }
  return { token: extractedToken, cookies: res.cookies };
}

export default function (data) {
  // Pass the auth cookie/token
  const params = {
    headers: {},
  };
  if (data.token) {
    params.headers['Authorization'] = `Bearer ${data.token}`;
  }
  
  // 1. Healthcheck
  const healthRes = http.get(`${BASE_URL}/api/health`, params);
  check(healthRes, { 'status is 200': (r) => r.status === 200 });

  // 2. Fetch Jobs
  const jobsRes = http.get(`${BASE_URL}/api/jobs`, params);
  check(jobsRes, { 
    'jobs status is 200': (r) => r.status === 200,
    'jobs fetched': (r) => r.json().length >= 0
  });

  sleep(1);
}
