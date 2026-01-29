
import { test, expect } from '@playwright/test';

test.describe('Works Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Sign in
        await page.goto('/sign-in');
        await page.fill('input[name="email"]', 'test@test.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/app(\/.*)?$/);
    });

    test('should create, find, and delete a work', async ({ page }) => {
        // 2. Navigate to Works
        await page.goto('/app/guide/works');
        await expect(page.getByRole('heading', { name: 'Работы' }).first()).toBeVisible();

        const workName = `Test Work ${Date.now()}`;

        // 3. Add new work
        await page.getByRole('button', { name: /Добавить/i }).first().click();

        // 4. Fill details in placeholder row
        const nameInput = page.getByPlaceholder('Наименование работы...');
        await nameInput.fill(workName);

        const priceInput = page.getByPlaceholder('Цена');
        await priceInput.fill('1234');

        // Note: Unit is a select, let's see if we can just type or if we need to click
        // Assuming UnitSelect might need a click
        // Note: Unit is a combobox
        await page.getByRole('combobox').filter({ hasText: /Ед\. изм\.\.\./i }).click();

        // Type and click to select/create unit
        await page.getByPlaceholder('Поиск или ввод...').fill('шт');
        await page.locator('[cmdk-item], [cmdk-empty] button').first().click();

        // Wait for popover to close and value to be set
        await expect(page.locator('tr').filter({ has: page.getByPlaceholder('Наименование работы...') }).getByRole('combobox')).toHaveText(/шт/i);

        // 5. Save (using the Check icon button)
        await page.locator('tr').filter({ has: page.getByPlaceholder('Наименование работы...') }).locator('button').filter({ has: page.locator('svg.lucide-check') }).click();

        // 7. Find and Delete it
        await page.getByPlaceholder('Поиск по наименованию...').fill(workName);
        const row = page.locator('tr').filter({ hasText: workName });
        await expect(row).toBeVisible({ timeout: 20000 });
        await row.getByRole('button').filter({ has: page.locator('svg.lucide-settings') }).click();

        await page.getByRole('menuitem', { name: /Удалить/i }).click();

        // Confirm deletion in AlertDialog
        await page.getByRole('button', { name: 'Удалить' }).click();

        // 9. Verify success toast for deletion
        await expect(page.getByText(/удалена|успешно/i).first()).toBeVisible({ timeout: 15000 });
    });
});
