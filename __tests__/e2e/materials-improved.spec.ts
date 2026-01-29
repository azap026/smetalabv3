import { test, expect } from '../fixtures/auth.fixtures';
import { MaterialsPage } from '../page-objects/materials-page';

test.describe('Materials Management Flow (Improved)', () => {
  test('should create material with all validations', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    const uniqueName = `Material ${Date.now()}`;
    
    // Create material using page object
    await materialsPage.createMaterial({
      name: uniqueName,
      unit: 'кг',
      price: 500,
      stock: 100,
    });
    
    // Verify success toast appeared
    const hasSuccess = await materialsPage.hasSuccessToast('добавлен');
    expect(hasSuccess).toBe(true);
    
    // Verify material appears in table
    await materialsPage.searchMaterial(uniqueName);
    const exists = await materialsPage.materialExists(uniqueName);
    expect(exists).toBe(true);
  });
  
  test('should edit material successfully', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    // Create test material
    const originalName = `Material ${Date.now()}`;
    await materialsPage.createMaterial({
      name: originalName,
      unit: 'кг',
      price: 500,
    });
    
    // Edit it
    const updatedName = `${originalName} Updated`;
    await materialsPage.editMaterial(originalName, {
      name: updatedName,
      price: 750,
    });
    
    // Verify update
    await materialsPage.searchMaterial(updatedName);
    const row = await materialsPage.getMaterialRowByName(updatedName);
    expect(row).not.toBeNull();
    
    if (row) {
      const data = await materialsPage.getMaterialData(row);
      expect(data.price).toContain('750');
    }
  });
  
  test('should delete material successfully', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    // Create test material
    const materialName = `Material ${Date.now()}`;
    await materialsPage.createMaterial({
      name: materialName,
      unit: 'шт',
      price: 100,
    });
    
    // Delete it
    await materialsPage.deleteMaterial(materialName);
    
    // Verify deletion
    await materialsPage.searchMaterial(materialName);
    const exists = await materialsPage.materialExists(materialName);
    expect(exists).toBe(false);
  });
  
  test('should validate negative price', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    await materialsPage.openCreateDialog();
    
    // Try to enter negative price
    await materialsPage.nameInput.fill('Test Material');
    await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
    await materialsPage.priceInput.fill('-100');
    
    // Attempt submit
    await materialsPage.submitButton.click();
    
    // Should show validation error
    const errorVisible = await ownerPage.locator('[role="alert"]:has-text("положительн")').isVisible({ timeout: 5000 });
    expect(errorVisible).toBe(true);
    
    // Dialog should still be open
    await expect(materialsPage.dialog).toBeVisible();
  });
  
  test('should validate required fields', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    await materialsPage.openCreateDialog();
    
    // Leave name empty, try to submit
    await materialsPage.priceInput.fill('100');
    await materialsPage.submitButton.click();
    
    // Should show required field error
    const nameError = await ownerPage.locator('[data-testid="name-error"]').isVisible({ timeout: 3000 });
    expect(nameError).toBe(true);
  });
  
  test('should handle search debounce correctly', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    // Create multiple materials
    const baseName = `Search Test ${Date.now()}`;
    await materialsPage.createMaterial({
      name: `${baseName} Alpha`,
      unit: 'кг',
      price: 100,
    });
    await materialsPage.createMaterial({
      name: `${baseName} Beta`,
      unit: 'кг',
      price: 200,
    });
    
    // Search should be debounced
    await materialsPage.searchInput.fill(baseName);
    
    // Wait for debounce
    await ownerPage.waitForTimeout(600);
    
    // Both should appear
    const count = await materialsPage.getMaterialsCount();
    expect(count).toBeGreaterThanOrEqual(2);
  });
  
  test('should persist data after page reload', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    const materialName = `Persist Test ${Date.now()}`;
    await materialsPage.createMaterial({
      name: materialName,
      unit: 'м',
      price: 300,
    });
    
    // Reload page
    await ownerPage.reload();
    await materialsPage.waitForTableLoad();
    
    // Material should still exist
    await materialsPage.searchMaterial(materialName);
    const exists = await materialsPage.materialExists(materialName);
    expect(exists).toBe(true);
  });
  
  test('should handle server action revalidation', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    const initialCount = await materialsPage.getMaterialsCount();
    
    // Create new material
    await materialsPage.createMaterial({
      name: `Revalidation Test ${Date.now()}`,
      unit: 'кг',
      price: 500,
    });
    
    // Table should automatically update (Server Action revalidated)
    await materialsPage.waitForTableLoad();
    const newCount = await materialsPage.getMaterialsCount();
    
    expect(newCount).toBe(initialCount + 1);
  });
  
  test('should show loading state during Server Action', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    await materialsPage.openCreateDialog();
    
    // Fill form
    await materialsPage.nameInput.fill(`Loading Test ${Date.now()}`);
    await materialsPage.selectComboboxOption(materialsPage.unitSelect, 'кг');
    await materialsPage.priceInput.fill('100');
    
    // Click submit
    await materialsPage.submitButton.click();
    
    // Should show loading/disabled state
    const isDisabled = await materialsPage.submitButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    // Wait for completion
    await materialsPage.dialog.waitFor({ state: 'hidden', timeout: 10000 });
  });
});
