import { test, expect } from '@playwright/test';

test.describe('Auth E2E', () => {
  test('User can register, login, and access dashboard', async ({ page }) => {
    await page.goto('/register');
    
    const uniqueEmail = `e2e-user-${Date.now()}@applyhustle.test`;
    await page.fill('input[name="fullName"]', 'Playwright Tester');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.check('input[name="termsAccepted"]');
    
    await page.click('button[type="submit"]');
    
    // Should navigate to dashboard after successful registration
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Career Acceleration Dashboard')).toBeVisible();

    // Logout
    await page.click('button[data-testid="logout-btn"]');
    await expect(page).toHaveURL(/.*\/login/);

    // Login again
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Career Acceleration Dashboard')).toBeVisible();
  });
});
