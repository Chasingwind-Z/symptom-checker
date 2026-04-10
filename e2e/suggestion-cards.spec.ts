import { test, expect } from '@playwright/test';

test.describe('Suggestion Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('onboarding.completed', 'true');
    });
    await page.reload();
  });

  test('suggestion cards are visible on homepage', async ({ page }) => {
    await expect(page.getByText('现在谁不舒服')).toBeVisible({ timeout: 10000 });

    // Should see population tabs
    await expect(page.getByText('我自己')).toBeVisible();
    await expect(page.getByText('孩子')).toBeVisible();

    // Should see at least one suggestion card
    const cards = page.locator('button').filter({ hasText: /怎么办|要不要|还是/ });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('switching population tab changes suggestions', async ({ page }) => {
    await expect(page.getByText('现在谁不舒服')).toBeVisible({ timeout: 10000 });

    // Click "孩子" tab
    await page.getByText('孩子').click();

    // Should see pediatric suggestions
    await expect(page.getByText(/孩子|宝宝|小孩/).first()).toBeVisible({ timeout: 5000 });
  });
});
