import { test, expect } from '@playwright/test';

test.describe('Authentication & Basic Navigation', () => {
    test('should show landing page', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Smetalab/i);
        await expect(page.getByText(/Smart Engineering/i)).toBeVisible();
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
            await page.waitForURL(/\/app(\/.*)?$/, { timeout: 20000 });
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

        await page.waitForURL(/\/app(\/.*)?$/, { timeout: 20000 });
        await expect(page.getByRole('link', { name: /Главная/i })).toBeVisible({ timeout: 15000 });

        // Open User Menu (The button with initials or avatar)
        // In Shadcn, it's often a button with a class 'rounded-full' containing an avatar
        await page.locator('button.rounded-full').last().click();

        // Wait for dropdown and click Logout
        const logoutItem = page.getByRole('menuitem', { name: /Выйти/i });
        await expect(logoutItem).toBeVisible({ timeout: 5000 });
        await logoutItem.click();

        // Should redirect back to landing or sign-in
        await page.waitForURL(url => url.pathname === '/' || url.pathname === '/sign-in', { timeout: 20000 });
    });
});
