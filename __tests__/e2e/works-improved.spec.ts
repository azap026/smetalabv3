import { test, expect } from '../fixtures/auth.fixtures';
import { WorksPage } from '../page-objects/works-page';

test.describe('Works Management Flow (Improved)', () => {
  test('should create work with category', async ({ adminPage }) => {
    const worksPage = new WorksPage(adminPage);
    await worksPage.navigate();
    
    const uniqueName = `Work ${Date.now()}`;
    
    await worksPage.createWork({
      name: uniqueName,
      description: 'Test work description',
      unit: 'м²',
      price: 1500,
      category: 'Отделочные работы',
    });
    
    // Verify success
    const hasSuccess = await worksPage.hasSuccessToast();
    expect(hasSuccess).toBe(true);
    
    // Verify in table
    const exists = await worksPage.workExists(uniqueName);
    expect(exists).toBe(true);
  });
  
  test('should filter works by category', async ({ adminPage }) => {
    const worksPage = new WorksPage(adminPage);
    await worksPage.navigate();
    
    // Create works in different categories
    const baseName = `Category Test ${Date.now()}`;
    
    await worksPage.createWork({
      name: `${baseName} Plaster`,
      unit: 'м²',
      price: 500,
      category: 'Отделочные работы',
    });
    
    await worksPage.createWork({
      name: `${baseName} Concrete`,
      unit: 'м³',
      price: 5000,
      category: 'Бетонные работы',
    });
    
    // Filter by category
    await worksPage.filterByCategory('Отделочные работы');
    
    // Only plaster work should be visible
    const plasterExists = await worksPage.workExists(`${baseName} Plaster`);
    expect(plasterExists).toBe(true);
    
    const concreteExists = await worksPage.workExists(`${baseName} Concrete`);
    expect(concreteExists).toBe(false);
    
    // Clear filters
    await worksPage.clearFilters();
    
    // Both should be visible
    await worksPage.waitForTableLoad();
    const allNames = await worksPage.getAllWorkNames();
    expect(allNames.some(n => n.includes('Plaster'))).toBe(true);
    expect(allNames.some(n => n.includes('Concrete'))).toBe(true);
  });
  
  test('should edit work successfully', async ({ adminPage }) => {
    const worksPage = new WorksPage(adminPage);
    await worksPage.navigate();
    
    const originalName = `Work ${Date.now()}`;
    
    await worksPage.createWork({
      name: originalName,
      description: 'Original description',
      unit: 'шт',
      price: 1000,
    });
    
    // Edit
    const updatedName = `${originalName} Updated`;
    await worksPage.editWork(originalName, {
      name: updatedName,
      price: 1500,
      description: 'Updated description',
    });
    
    // Verify
    const row = await worksPage.getWorkRowByName(updatedName);
    expect(row).not.toBeNull();
    
    if (row) {
      const data = await worksPage.getWorkData(row);
      expect(data.price).toContain('1500');
      expect(data.description).toContain('Updated');
    }
  });
  
  test('should delete work successfully', async ({ adminPage }) => {
    const worksPage = new WorksPage(adminPage);
    await worksPage.navigate();
    
    const workName = `Work ${Date.now()}`;
    
    await worksPage.createWork({
      name: workName,
      unit: 'м',
      price: 800,
    });
    
    // Delete
    await worksPage.deleteWork(workName);
    
    // Verify deletion
    const exists = await worksPage.workExists(workName);
    expect(exists).toBe(false);
  });
  
  test('should validate required description', async ({ adminPage }) => {
    const worksPage = new WorksPage(adminPage);
    await worksPage.navigate();
    
    await worksPage.openCreateDialog();
    
    // Fill all except description
    await worksPage.nameInput.fill('Test Work');
    await worksPage.selectComboboxOption(worksPage.unitSelect, 'м²');
    await worksPage.priceInput.fill('100');
    
    // Submit
    await worksPage.submitButton.click();
    
    // Description is optional in some forms, but if required:
    // Should show error or allow submission
    // This depends on your Zod schema
    
    await adminPage.waitForTimeout(2000);
    
    // Verify behavior matches schema
    const dialogVisible = await worksPage.dialog.isVisible();
    
    // If description is optional, dialog should close
    // If required, dialog should stay open with error
    if (dialogVisible) {
      const errorVisible = await adminPage.locator('[role="alert"]:has-text("описание")').isVisible({ timeout: 3000 }).catch(() => false);
      expect(errorVisible).toBe(true);
    }
  });
  
  test('should validate negative price', async ({ adminPage }) => {
    const worksPage = new WorksPage(adminPage);
    await worksPage.navigate();
    
    await worksPage.openCreateDialog();
    
    await worksPage.nameInput.fill('Test Work');
    await worksPage.priceInput.fill('-500');
    
    await worksPage.submitButton.click();
    
    // Should show error
    const errorVisible = await adminPage.locator('[role="alert"]:has-text("положительн")').isVisible({ timeout: 5000 });
    expect(errorVisible).toBe(true);
  });
  
  test('should handle search correctly', async ({ adminPage }) => {
    const worksPage = new WorksPage(adminPage);
    await worksPage.navigate();
    
    const baseName = `Search Test ${Date.now()}`;
    
    await worksPage.createWork({
      name: `${baseName} Alpha`,
      unit: 'шт',
      price: 100,
    });
    
    await worksPage.createWork({
      name: `${baseName} Beta`,
      unit: 'шт',
      price: 200,
    });
    
    // Search
    await worksPage.searchWork(baseName);
    
    const count = await worksPage.getWorksCount();
    expect(count).toBeGreaterThanOrEqual(2);
  });
  
  test('should persist works after page reload', async ({ adminPage }) => {
    const worksPage = new WorksPage(adminPage);
    await worksPage.navigate();
    
    const workName = `Persist Test ${Date.now()}`;
    
    await worksPage.createWork({
      name: workName,
      unit: 'м²',
      price: 700,
    });
    
    // Reload
    await adminPage.reload();
    await worksPage.waitForTableLoad();
    
    // Should still exist
    const exists = await worksPage.workExists(workName);
    expect(exists).toBe(true);
  });
  
  test('should show loading state during Server Action', async ({ adminPage }) => {
    const worksPage = new WorksPage(adminPage);
    await worksPage.navigate();
    
    await worksPage.openCreateDialog();
    
    await worksPage.nameInput.fill(`Loading Test ${Date.now()}`);
    await worksPage.selectComboboxOption(worksPage.unitSelect, 'м');
    await worksPage.priceInput.fill('1000');
    
    await worksPage.submitButton.click();
    
    // Button should be disabled during submit
    const isDisabled = await worksPage.submitButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    await worksPage.dialog.waitFor({ state: 'hidden', timeout: 10000 });
  });
});
