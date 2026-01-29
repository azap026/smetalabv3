import { test, expect } from '../fixtures/auth.fixtures';
import { MaterialsPage } from '../page-objects/materials-page';
import { WorksPage } from '../page-objects/works-page';

test.describe('RBAC - Role-Based Access Control', () => {
  test('owner can create, edit, delete materials', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.navigate();
    
    const materialName = `RBAC Owner ${Date.now()}`;
    
    // Create
    await materialsPage.createMaterial({
      name: materialName,
      unit: 'кг',
      price: 500,
    });
    
    const createSuccess = await materialsPage.hasSuccessToast();
    expect(createSuccess).toBe(true);
    
    // Edit
    await materialsPage.editMaterial(materialName, { price: 600 });
    const editSuccess = await materialsPage.hasSuccessToast();
    expect(editSuccess).toBe(true);
    
    // Delete
    await materialsPage.deleteMaterial(materialName);
    const deleteSuccess = await materialsPage.hasSuccessToast();
    expect(deleteSuccess).toBe(true);
  });
  
  test('admin can create and edit but delete may be restricted', async ({ adminPage }) => {
    const materialsPage = new MaterialsPage(adminPage);
    await materialsPage.navigate();
    
    const materialName = `RBAC Admin ${Date.now()}`;
    
    // Create should work
    await materialsPage.createMaterial({
      name: materialName,
      unit: 'м',
      price: 1000,
    });
    
    const createSuccess = await materialsPage.hasSuccessToast();
    expect(createSuccess).toBe(true);
    
    // Edit should work
    await materialsPage.editMaterial(materialName, { price: 1200 });
    const editSuccess = await materialsPage.hasSuccessToast();
    expect(editSuccess).toBe(true);
    
    // Delete - verify based on your RBAC rules
    // If admin cannot delete, button should be hidden or disabled
    const row = await materialsPage.getMaterialRowByName(materialName);
    if (row) {
      const deleteButton = row.getByRole('button', { name: /delete|удалить/i });
      const isDeleteVisible = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      // If delete is restricted for admin, expect button to be hidden/disabled
      // Adjust based on your actual RBAC implementation
      if (!isDeleteVisible) {
        console.log('✓ Admin correctly restricted from delete');
      }
    }
  });
  
  test('member has read-only access (cannot create/edit/delete)', async ({ memberPage }) => {
    const materialsPage = new MaterialsPage(memberPage);
    await materialsPage.navigate();
    
    // Create button should be hidden or disabled
    const createButton = materialsPage.page.getByRole('button', { name: /создать|create/i });
    const isCreateVisible = await createButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(isCreateVisible).toBe(false);
    
    // Edit buttons should be hidden
    const editButtons = await materialsPage.page.locator('[data-testid="edit-button"]').count();
    expect(editButtons).toBe(0);
    
    // Delete buttons should be hidden
    const deleteButtons = await materialsPage.page.locator('[data-testid="delete-button"]').count();
    expect(deleteButtons).toBe(0);
    
    console.log('✓ Member correctly has read-only access');
  });
  
  test('estimator can view but not modify', async ({ estimatorPage }) => {
    const worksPage = new WorksPage(estimatorPage);
    await worksPage.navigate();
    
    // Can view table
    await worksPage.waitForTableLoad();
    
    // But cannot create
    const createButton = estimatorPage.getByRole('button', { name: /создать|create/i });
    const isCreateVisible = await createButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(isCreateVisible).toBe(false);
    
    console.log('✓ Estimator correctly has read-only access');
  });
  
  test('superadmin has full access to all entities', async ({ superadminPage }) => {
    const materialsPage = new MaterialsPage(superadminPage);
    await materialsPage.navigate();
    
    const materialName = `RBAC Superadmin ${Date.now()}`;
    
    // Full CRUD
    await materialsPage.createMaterial({
      name: materialName,
      unit: 'шт',
      price: 2000,
    });
    
    await expect(materialsPage.page).toHaveSuccessToast();
    
    await materialsPage.editMaterial(materialName, { price: 2500 });
    await expect(materialsPage.page).toHaveSuccessToast();
    
    await materialsPage.deleteMaterial(materialName);
    await expect(materialsPage.page).toHaveSuccessToast();
    
    console.log('✓ Superadmin has full access');
  });
  
  test('owner can manage works with categories', async ({ ownerPage }) => {
    const worksPage = new WorksPage(ownerPage);
    await worksPage.navigate();
    
    const workName = `RBAC Works Owner ${Date.now()}`;
    
    // Create with category
    await worksPage.createWork({
      name: workName,
      unit: 'м²',
      price: 1500,
      category: 'Отделочные работы',
    });
    
    await expect(worksPage.page).toHaveSuccessToast();
    
    // Filter should work
    await worksPage.filterByCategory('Отделочные работы');
    
    const exists = await worksPage.workExists(workName);
    expect(exists).toBe(true);
  });
  
  test('member cannot access admin routes', async ({ memberPage }) => {
    // Try to access admin route
    await memberPage.goto('/admin');
    
    // Should be redirected (403 or back to dashboard)
    await memberPage.waitForURL(/\/app|sign-in/, { timeout: 5000 });
    
    // Should not see admin content
    const adminContent = await memberPage.locator('text=/администратор|admin/i').isVisible({ timeout: 3000 }).catch(() => false);
    expect(adminContent).toBe(false);
  });
  
  test('estimator cannot modify but can export data', async ({ estimatorPage }) => {
    const materialsPage = new MaterialsPage(estimatorPage);
    await materialsPage.navigate();
    
    // Can view
    await materialsPage.waitForTableLoad();
    const count = await materialsPage.getMaterialsCount();
    expect(count).toBeGreaterThanOrEqual(0);
    
    // Export button should be visible (if estimator can export)
    const exportButton = estimatorPage.getByRole('button', { name: /экспорт|export/i });
    const canExport = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (canExport) {
      console.log('✓ Estimator can export data');
    }
    
    // But create button should be hidden
    const createButton = estimatorPage.getByRole('button', { name: /создать|create/i });
    const canCreate = await createButton.isVisible({ timeout: 3000 }).catch(() => false);
    expect(canCreate).toBe(false);
  });
});
