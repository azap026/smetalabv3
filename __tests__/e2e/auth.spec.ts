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

    test('should allow logout after login', async ({ page }) => {
        await page.goto('/sign-in');
        await page.fill('input[name="email"]', 'test@test.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');

        await page.waitForURL(/\/app(\/.*)?$/, { timeout: 60000 });
        await expect(page.getByRole('link', { name: /Главная/i })).toBeVisible({ timeout: 15000 });

        // Open User Menu
        // Improved selector: specifically find the avatar button in the header
        await page.locator('header button.rounded-full').click();

        // Wait for dropdown and click Logout
        const logoutItem = page.getByRole('menuitem', { name: /Выйти/i });
        await expect(logoutItem).toBeVisible({ timeout: 5000 });
        await logoutItem.click();

        // Should redirect back to sign-in
        await page.waitForURL(url => url.pathname === '/sign-in', { timeout: 60000 });
        await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
    });
});
