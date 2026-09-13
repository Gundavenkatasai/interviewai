import { test, expect } from '@playwright/test';

const E2E_USER_EMAIL = "e2e-user@applyhustle.test";
const E2E_PASSWORD = "Password123!";

test.describe('Interview Real-time E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', E2E_USER_EMAIL);
    await page.fill('input[name="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('User can access Interview Intelligence', async ({ page, context }) => {
    // Grant permissions for mock microphone/camera
    await context.grantPermissions(['microphone', 'camera']);
    
    await page.click('a:has-text("Interviews")');
    await expect(page).toHaveURL(/.*\/interviews/);
    
    // Additional testing logic depends on WebSocket / Start Mock Interview UI
    await expect(page.locator('text=Mock Interview')).toBeVisible();
  });
});
