
import { test, expect } from '@playwright/test';

test.describe('Materials Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Sign in
        await page.goto('/sign-in');
        await page.fill('input[name="email"]', 'test@test.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/app(\/.*)?$/);
    });

    test('should create, search, and delete a material', async ({ page }) => {
        // 2. Navigate to Materials
        await page.goto('/app/guide/materials');
        await expect(page.getByRole('heading', { name: 'Материалы' }).first()).toBeVisible();

        const materialCode = `MAT-${Date.now()}`;
        const materialName = `Test Material ${Date.now()}`;

        // 3. Add new material
        await page.getByRole('button', { name: /Добавить/i }).first().click();

        // Inputs order: 0: Code, 1: Name, 2: Photo, 3: Unit, 4: Price, 5: Category
        // Using global selectors to avoid potential stale row references during re-renders

        // Fill Code
        await page.getByPlaceholder('Код...').first().fill(materialCode);
        await page.waitForTimeout(1000);

        // Fill Name
        await page.getByPlaceholder('Название...').first().fill(materialName);
        await page.waitForTimeout(500);

        // Fill Unit (assuming only placeholder row has this input setup)
        await page.locator('input.text-center').first().fill('кг');
        await page.waitForTimeout(500);

        // Fill Price
        await page.locator('input[type="number"]').first().fill('500');
        await page.waitForTimeout(500);

        // 5. Save
        // Find the check button globally (it should be unique as only one row is editable)
        const saveButton = page.locator('.lucide-check').first();
        await expect(saveButton).toBeVisible();
        await saveButton.click({ force: true });

        // Wait for success toast to confirm data persistence and successful server action
        await expect(page.getByText('Материал добавлен')).toBeVisible({ timeout: 30000 });

        // 6. Verify success (wait for row)
        await page.getByPlaceholder('Поиск по наименованию...').fill(materialName);
        const row = page.locator('tr').filter({ hasText: materialName });
        await expect(row).toBeVisible({ timeout: 15000 });

        // 7. Delete it
        await row.getByRole('button').filter({ has: page.locator('svg.lucide-settings') }).click();
        await page.getByRole('menuitem', { name: /Удалить/i }).click();
        await page.getByRole('button', { name: 'Удалить' }).click();

        // 8. Verify deletion success toast
        await expect(page.getByText(/удалена|успешно/i).first()).toBeVisible();
    });
});
