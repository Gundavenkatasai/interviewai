# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: resume-ats.spec.ts >> Resume & ATS E2E >> User can access Resume Studio and view canonical resume
- Location: tests\e2e\resume-ats.spec.ts:16:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "Interview AI Coach" [ref=e7] [cursor=pointer]:
          - /url: /
          - generic [ref=e13]:
            - text: Interview
            - generic [ref=e14]: AI
            - generic [ref=e15]: Coach
        - button "Collapse sidebar" [ref=e16] [cursor=pointer]
      - generic [ref=e21]:
        - generic [ref=e22]: GET STARTED
        - generic [ref=e23]:
          - link "Try Demo Interview" [ref=e24] [cursor=pointer]:
            - /url: /setup
          - link "Privacy & Security" [ref=e29] [cursor=pointer]:
            - /url: /privacy
    - generic [ref=e35]:
      - link "Sign In" [ref=e36] [cursor=pointer]:
        - /url: /login
      - link "Get Started" [ref=e37] [cursor=pointer]:
        - /url: /register
  - main [ref=e39]:
    - generic [ref=e41]:
      - generic [ref=e42]:
        - heading "Welcome Back" [level=1] [ref=e46]
        - paragraph [ref=e47]: Sign in to access your mock interview performance.
      - generic [ref=e48]:
        - generic [ref=e49]:
          - generic [ref=e50]: Email Address
          - textbox "you@example.com" [ref=e55]
        - generic [ref=e56]:
          - generic [ref=e57]: Password
          - textbox "••••••••" [ref=e62]
        - button "Sign In" [ref=e63] [cursor=pointer]
      - generic [ref=e67]:
        - text: Don't have an account?
        - link "Create Account" [ref=e68] [cursor=pointer]:
          - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const E2E_USER_EMAIL = "e2e-user@applyhustle.test";
  4  | const E2E_PASSWORD = "Password123!";
  5  | 
  6  | test.describe('Resume & ATS E2E', () => {
  7  |   test.beforeEach(async ({ page }) => {
  8  |     // Login
  9  |     await page.goto('/login');
> 10 |     await page.fill('input[name="email"]', E2E_USER_EMAIL);
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  11 |     await page.fill('input[name="password"]', E2E_PASSWORD);
  12 |     await page.click('button[type="submit"]');
  13 |     await expect(page).toHaveURL(/.*\/dashboard/);
  14 |   });
  15 | 
  16 |   test('User can access Resume Studio and view canonical resume', async ({ page }) => {
  17 |     await page.click('a:has-text("Resumes")');
  18 |     await expect(page).toHaveURL(/.*\/resumes/);
  19 |     
  20 |     // Expect to see at least one resume option
  21 |     await expect(page.locator('text=Resume Studio')).toBeVisible();
  22 |     
  23 |     // If the frontend has an ATS scan button, test it
  24 |     // Note: Depends on exact frontend implementation of ATS scan
  25 |   });
  26 | });
  27 | 
```