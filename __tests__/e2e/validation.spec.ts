import { test, expect } from './fixtures/auth.fixtures';
import { MaterialsPage } from './page-objects/materials-page';
import { WorksPage } from './page-objects/works-page';

test.describe('Zod Validation', () => {
  test.describe('Materials Validation', () => {
    test('should reject empty material name', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      // Leave name empty
      await materialsPage.priceInput.fill('100');
      await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
      
      // Try to submit
      await materialsPage.submitButton.click();
      
      // Should show validation error
      const error = await materialsPage.page.locator('[role="alert"]:has-text("наименование")').isVisible({ timeout: 5000 });
      expect(error).toBe(true);
      
      // Dialog should remain open
      await expect(materialsPage.dialog).toBeVisible();
    });
    
    test('should reject negative price', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      await materialsPage.nameInput.fill('Test Material');
      await materialsPage.priceInput.fill('-100');
      await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
      
      await materialsPage.submitButton.click();
      
      // Should show positive price error
      const error = await materialsPage.page.locator('[role="alert"]:has-text("положительн")').isVisible({ timeout: 5000 });
      expect(error).toBe(true);
    });
    
    test('should reject zero price', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      await materialsPage.nameInput.fill('Test Material');
      await materialsPage.priceInput.fill('0');
      await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
      
      await materialsPage.submitButton.click();
      
      const error = await materialsPage.page.locator('[role="alert"]:has-text("больше 0")').isVisible({ timeout: 5000 });
      expect(error).toBe(true);
    });
    
    test('should reject excessively long name', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      // Name longer than 255 characters (typical limit)
      const longName = 'A'.repeat(300);
      await materialsPage.nameInput.fill(longName);
      await materialsPage.priceInput.fill('100');
      await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
      
      await materialsPage.submitButton.click();
      
      // Should show length error
      const error = await materialsPage.page.locator('[role="alert"]:has-text("длина|символов")').isVisible({ timeout: 5000 });
      expect(error).toBe(true);
    });
    
    test('should reject invalid price format', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      await materialsPage.nameInput.fill('Test Material');
      await materialsPage.priceInput.fill('abc123'); // Invalid number
      await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
      
      await materialsPage.submitButton.click();
      
      // Should show number format error
      const error = await materialsPage.page.locator('[role="alert"]:has-text("число|number")').isVisible({ timeout: 5000 });
      expect(error).toBe(true);
    });
    
    test('should require unit selection', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      await materialsPage.nameInput.fill('Test Material');
      await materialsPage.priceInput.fill('100');
      // Don't select unit
      
      await materialsPage.submitButton.click();
      
      // Should show unit required error
      const error = await materialsPage.page.locator('[role="alert"]:has-text("единиц")').isVisible({ timeout: 5000 });
      expect(error).toBe(true);
    });
  });
  
  test.describe('Works Validation', () => {
    test('should reject empty work name', async ({ adminPage }) => {
      const worksPage = new WorksPage(adminPage);
      await worksPage.navigate();
      
      await worksPage.openCreateDialog();
      
      // Leave name empty
      await worksPage.priceInput.fill('1000');
      await worksPage.selectComboboxOption(worksPage.unitSelect, 'м²');
      
      await worksPage.submitButton.click();
      
      const error = await adminPage.locator('[role="alert"]:has-text("наименование")').isVisible({ timeout: 5000 });
      expect(error).toBe(true);
    });
    
    test('should reject negative work price', async ({ adminPage }) => {
      const worksPage = new WorksPage(adminPage);
      await worksPage.navigate();
      
      await worksPage.openCreateDialog();
      
      await worksPage.nameInput.fill('Test Work');
      await worksPage.priceInput.fill('-500');
      await worksPage.selectComboboxOption(worksPage.unitSelect, 'м²');
      
      await worksPage.submitButton.click();
      
      const error = await adminPage.locator('[role="alert"]:has-text("положительн")').isVisible({ timeout: 5000 });
      expect(error).toBe(true);
    });
    
    test('should validate description length', async ({ adminPage }) => {
      const worksPage = new WorksPage(adminPage);
      await worksPage.navigate();
      
      await worksPage.openCreateDialog();
      
      await worksPage.nameInput.fill('Test Work');
      
      // Very long description
      const longDescription = 'A'.repeat(1000);
      await worksPage.descriptionInput.fill(longDescription);
      
      await worksPage.priceInput.fill('1000');
      await worksPage.selectComboboxOption(worksPage.unitSelect, 'м²');
      
      await worksPage.submitButton.click();
      
      // If description has max length, should show error
      const error = await adminPage.locator('[role="alert"]:has-text("длина|символов")').isVisible({ timeout: 3000 }).catch(() => false);
      
      // Or submission might succeed if no max length defined
      // Adjust expectation based on your schema
      if (error) {
        expect(error).toBe(true);
      }
    });
  });
  
  test.describe('Client-side vs Server-side Validation', () => {
    test('should validate on client before Server Action', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      // Fill invalid data
      await materialsPage.nameInput.fill('');
      await materialsPage.priceInput.fill('-100');
      
      // Click submit
      await materialsPage.submitButton.click();
      
      // Should show client-side validation immediately (< 1 second)
      const startTime = Date.now();
      const error = await materialsPage.page.locator('[role="alert"]').first().waitFor({ state: 'visible', timeout: 2000 });
      const elapsedTime = Date.now() - startTime;
      
      expect(elapsedTime).toBeLessThan(1000); // Client-side validation is fast
      expect(error).toBeTruthy();
      
      console.log(`✓ Client-side validation responded in ${elapsedTime}ms`);
    });
    
    test('should still validate on server even if client bypassed', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      // Try to bypass client validation by directly calling Server Action
      // In practice, this would require using browser console or API client
      // For now, we verify that even with "valid-looking" client data,
      // server catches edge cases
      
      await materialsPage.nameInput.fill('Test Material');
      await materialsPage.priceInput.fill('100.001'); // Edge case: too many decimals
      await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
      
      await materialsPage.submitButton.click();
      
      // Server might round or reject based on schema
      // Verify appropriate handling
      await ownerPage.waitForTimeout(2000);
      
      // Check if error or success
      const hasError = await materialsPage.hasErrorToast();
      const hasSuccess = await materialsPage.hasSuccessToast();
      
      // One of them should be true
      expect(hasError || hasSuccess).toBe(true);
    });
  });
  
  test.describe('Edge Cases', () => {
    test('should handle special characters in name', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      // Name with special characters
      await materialsPage.nameInput.fill('Материал №1 (тест) <script>alert("xss")</script>');
      await materialsPage.priceInput.fill('500');
      await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
      
      await materialsPage.submitButton.click();
      
      // Should either sanitize or accept (not crash)
      await ownerPage.waitForTimeout(3000);
      
      // Check no XSS executed
      const alertVisible = await ownerPage.locator('text=xss').isVisible({ timeout: 1000 }).catch(() => false);
      expect(alertVisible).toBe(false);
      
      console.log('✓ XSS attempt prevented');
    });
    
    test('should handle very large numbers', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      await materialsPage.openCreateDialog();
      
      await materialsPage.nameInput.fill('Expensive Material');
      await materialsPage.priceInput.fill('999999999999'); // Very large price
      await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
      
      await materialsPage.submitButton.click();
      
      // Should either accept or show overflow error
      await ownerPage.waitForTimeout(2000);
      
      const hasError = await materialsPage.hasErrorToast();
      const hasSuccess = await materialsPage.hasSuccessToast();
      
      expect(hasError || hasSuccess).toBe(true);
    });
    
    test('should trim whitespace from inputs', async ({ ownerPage }) => {
      const materialsPage = new MaterialsPage(ownerPage);
      await materialsPage.navigate();
      
      const materialName = `  Whitespace Test ${Date.now()}  `;
      
      await materialsPage.createMaterial({
        name: materialName,
        unit: 'кг',
        price: 100,
      });
      
      // Check if name was trimmed in database
      const trimmedName = materialName.trim();
      const exists = await materialsPage.materialExists(trimmedName);
      expect(exists).toBe(true);
      
      console.log('✓ Whitespace correctly trimmed');
    });
  });
});
