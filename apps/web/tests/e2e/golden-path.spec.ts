import { test, expect } from '@playwright/test';

// Use the deterministic test user from e2e-seed.ts
const E2E_USER_EMAIL = "e2e-user@applyhustle.test";
const E2E_PASSWORD = "Password123!";

test.describe('Golden Path E2E', () => {
  test('User can browse jobs, view details, and save job', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', E2E_USER_EMAIL);
    await page.fill('input[name="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Job Discovery
    await page.click('a:has-text("Jobs")');
    await expect(page).toHaveURL(/.*\/jobs/);
    
    // Wait for jobs to load
    await expect(page.locator('.job-card')).toHaveCount(2); 

    // Search and filter
    await page.fill('input[placeholder="Search jobs..."]', 'Backend');
    await expect(page.locator('.job-card')).toHaveCount(1);
    await expect(page.locator('.job-card').first()).toContainText('TechCorp');

    // 3. Job Detail
    await page.click('.job-card >> text="View Details"');
    await expect(page).toHaveURL(/.*\/jobs\/.+/);
    
    await expect(page.locator('text=TechCorp')).toBeVisible();
    await expect(page.locator('text=Backend Engineer')).toBeVisible();

    // 4. Save Job
    await page.click('button:has-text("Save Job")');
    await expect(page.locator('button:has-text("Saved")')).toBeVisible();
    
    // 5. Navigate to Pipeline / Application Tracker
    await page.click('a:has-text("Applications")');
    await expect(page.locator('text=TechCorp')).toBeVisible();
  });
});
