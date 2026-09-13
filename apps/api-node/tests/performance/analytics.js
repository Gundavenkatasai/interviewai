import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 5 },
    { duration: '10s', target: 5 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // Analytics target < 1500ms
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000';

export function setup() {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'e2e-user@applyhustle.test',
    password: 'Password123!',
  }), { headers: { 'Content-Type': 'application/json' } });
  
  let extractedToken = '';
  try { extractedToken = res.json().token || ''; } catch (e) {}
  return { token: extractedToken };
}

export default function (data) {
  const params = { headers: {} };
  if (data.token) params.headers['Authorization'] = `Bearer ${data.token}`;
  
  const res = http.get(`${BASE_URL}/api/analytics`, params);
  check(res, { 'status is 200': (r) => r.status === 200 });

  sleep(Math.random() * 3);
}
