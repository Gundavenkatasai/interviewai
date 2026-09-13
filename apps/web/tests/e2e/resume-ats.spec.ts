import { test, expect } from '@playwright/test';

const E2E_USER_EMAIL = "e2e-user@applyhustle.test";
const E2E_PASSWORD = "Password123!";

test.describe('Resume & ATS E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', E2E_USER_EMAIL);
    await page.fill('input[name="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('User can access Resume Studio and view canonical resume', async ({ page }) => {
    await page.click('a:has-text("Resumes")');
    await expect(page).toHaveURL(/.*\/resumes/);
    
    // Expect to see at least one resume option
    await expect(page.locator('text=Resume Studio')).toBeVisible();
    
    // If the frontend has an ATS scan button, test it
    // Note: Depends on exact frontend implementation of ATS scan
  });
});
