# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Auth E2E >> User can register, login, and access dashboard
- Location: tests\e2e\auth.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:5173/register", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Auth E2E', () => {
  4  |   test('User can register, login, and access dashboard', async ({ page }) => {
> 5  |     await page.goto('/register');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  6  |     
  7  |     const uniqueEmail = `e2e-user-${Date.now()}@applyhustle.test`;
  8  |     await page.fill('input[name="firstName"]', 'Playwright');
  9  |     await page.fill('input[name="lastName"]', 'Tester');
  10 |     await page.fill('input[name="email"]', uniqueEmail);
  11 |     await page.fill('input[name="password"]', 'Password123!');
  12 |     
  13 |     await page.click('button[type="submit"]');
  14 |     
  15 |     // Should navigate to dashboard after successful registration
  16 |     await expect(page).toHaveURL(/.*\/dashboard/);
  17 |     await expect(page.locator('text=Welcome, Playwright')).toBeVisible();
  18 | 
  19 |     // Logout
  20 |     await page.click('button:has-text("Logout")');
  21 |     await expect(page).toHaveURL(/.*\/login/);
  22 | 
  23 |     // Login again
  24 |     await page.fill('input[name="email"]', uniqueEmail);
  25 |     await page.fill('input[name="password"]', 'Password123!');
  26 |     await page.click('button[type="submit"]');
  27 |     
  28 |     await expect(page).toHaveURL(/.*\/dashboard/);
  29 |   });
  30 | });
  31 | 
```