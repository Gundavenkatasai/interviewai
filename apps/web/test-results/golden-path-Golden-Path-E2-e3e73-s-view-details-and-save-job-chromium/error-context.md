# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: golden-path.spec.ts >> Golden Path E2E >> User can browse jobs, view details, and save job
- Location: tests\e2e\golden-path.spec.ts:8:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Use the deterministic test user from e2e-seed.ts
  4  | const E2E_USER_EMAIL = "e2e-user@applyhustle.test";
  5  | const E2E_PASSWORD = "Password123!";
  6  | 
  7  | test.describe('Golden Path E2E', () => {
  8  |   test('User can browse jobs, view details, and save job', async ({ page }) => {
  9  |     // 1. Login
> 10 |     await page.goto('/login');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  11 |     await page.fill('input[name="email"]', E2E_USER_EMAIL);
  12 |     await page.fill('input[name="password"]', E2E_PASSWORD);
  13 |     await page.click('button[type="submit"]');
  14 |     await expect(page).toHaveURL(/.*\/dashboard/);
  15 | 
  16 |     // 2. Job Discovery
  17 |     await page.click('a:has-text("Jobs")');
  18 |     await expect(page).toHaveURL(/.*\/jobs/);
  19 |     
  20 |     // Wait for jobs to load
  21 |     await expect(page.locator('.job-card')).toHaveCount(2); 
  22 | 
  23 |     // Search and filter
  24 |     await page.fill('input[placeholder="Search jobs..."]', 'Backend');
  25 |     await expect(page.locator('.job-card')).toHaveCount(1);
  26 |     await expect(page.locator('.job-card').first()).toContainText('TechCorp');
  27 | 
  28 |     // 3. Job Detail
  29 |     await page.click('.job-card >> text="View Details"');
  30 |     await expect(page).toHaveURL(/.*\/jobs\/.+/);
  31 |     
  32 |     await expect(page.locator('text=TechCorp')).toBeVisible();
  33 |     await expect(page.locator('text=Backend Engineer')).toBeVisible();
  34 | 
  35 |     // 4. Save Job
  36 |     await page.click('button:has-text("Save Job")');
  37 |     await expect(page.locator('button:has-text("Saved")')).toBeVisible();
  38 |     
  39 |     // 5. Navigate to Pipeline / Application Tracker
  40 |     await page.click('a:has-text("Applications")');
  41 |     await expect(page.locator('text=TechCorp')).toBeVisible();
  42 |   });
  43 | });
  44 | 
```