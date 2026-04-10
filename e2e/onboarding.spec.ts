import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear onboarding state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('onboarding.completed');
      localStorage.removeItem('user.profile');
    });
    await page.reload();
  });

  test('first visit shows onboarding overlay', async ({ page }) => {
    await expect(page.getByText('这不是看病的工具')).toBeVisible({ timeout: 10000 });
  });

  test('can complete 3-step onboarding', async ({ page }) => {
    // Step 1: Disclaimer
    await expect(page.getByText('这不是看病的工具')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /下一步/ }).click();

    // Step 2: Role selection
    await expect(page.getByText('你主要在照顾谁')).toBeVisible();
    await page.getByText('孩子').click();
    await page.getByRole('button', { name: /下一步/ }).click();

    // Step 3: Family details (shown because 'child' was selected)
    await expect(page.getByText('补充一点信息')).toBeVisible();
    await page.getByRole('button', { name: /下一步/ }).click();

    // Step 4: Completion
    await expect(page.getByText('准备好了')).toBeVisible();
    await page.getByRole('button', { name: /开始使用/ }).click();

    // Should see main app
    await expect(page.getByText('现在谁不舒服')).toBeVisible({ timeout: 5000 });
  });

  test('returning visit skips onboarding', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('onboarding.completed', 'true'));
    await page.reload();
    await expect(page.getByText('现在谁不舒服')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('这不是看病的工具')).not.toBeVisible();
  });
});
