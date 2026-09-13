# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: interview.spec.ts >> Interview Real-time E2E >> User can access Interview Intelligence
- Location: tests\e2e\interview.spec.ts:15:3

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
  6  | test.describe('Interview Real-time E2E', () => {
  7  |   test.beforeEach(async ({ page }) => {
  8  |     await page.goto('/login');
> 9  |     await page.fill('input[name="email"]', E2E_USER_EMAIL);
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  10 |     await page.fill('input[name="password"]', E2E_PASSWORD);
  11 |     await page.click('button[type="submit"]');
  12 |     await expect(page).toHaveURL(/.*\/dashboard/);
  13 |   });
  14 | 
  15 |   test('User can access Interview Intelligence', async ({ page, context }) => {
  16 |     // Grant permissions for mock microphone/camera
  17 |     await context.grantPermissions(['microphone', 'camera']);
  18 |     
  19 |     await page.click('a:has-text("Interviews")');
  20 |     await expect(page).toHaveURL(/.*\/interviews/);
  21 |     
  22 |     // Additional testing logic depends on WebSocket / Start Mock Interview UI
  23 |     await expect(page.locator('text=Mock Interview')).toBeVisible();
  24 |   });
  25 | });
  26 | 
```