import { test, expect } from '@playwright/test';

test.describe('Authentication & Basic Navigation', () => {
    test('should redirect root to sign-in', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/.*sign-in/);
        await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
    });

    test('should redirect unauthenticated user to sign-in from dashboard', async ({ page }) => {
        await page.goto('/app');
        await expect(page).toHaveURL(/.*sign-in/);
    });

    test('should login successfully with test credentials', async ({ page }) => {
        await page.goto('/sign-in');

        await page.fill('input[name="email"]', 'test@test.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Give it a moment to navigate or show an error
        try {
            await page.waitForURL(/\/app(\/.*)?$/, { timeout: 60000 });
        } catch (e) {
            const errorLocator = page.locator('.text-red-500');
            if (await errorLocator.isVisible()) {
                const errorText = await errorLocator.innerText();
                throw new Error(`Login failed with UI error: "${errorText}". Did you run pnpm db:seed?`);
            }
            throw e;
        }

        // Check for dashboard navigation link
        await expect(page.getByRole('link', { name: /Главная/i })).toBeVisible({ timeout: 15000 });
    });
});
