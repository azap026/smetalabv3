import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page Object для страницы Materials (/app/materials)
 */
export class MaterialsPage extends BasePage {
  // Page-specific locators
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly materialsTable: Locator;
  readonly tableRows: Locator;
  
  // Dialog locators
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly nameInput: Locator;
  readonly unitSelect: Locator;
  readonly priceInput: Locator;
  readonly stockInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  
  // Table action buttons
  readonly editButtons: Locator;
  readonly deleteButtons: Locator;
  
  constructor(page: Page) {
    super(page);
    
    // Main page elements
    this.createButton = page.locator('button:has-text("Добавить материал")');
    this.searchInput = page.locator('input[placeholder*="Поиск"]');
    this.materialsTable = page.locator('table');
    this.tableRows = page.locator('tbody tr');
    
    // Dialog elements
    this.dialog = page.locator('[role="dialog"]');
    this.dialogTitle = this.dialog.locator('h2');
    this.nameInput = this.dialog.locator('input[name="name"]');
    this.unitSelect = this.dialog.locator('[data-testid="unit-select"]');
    this.priceInput = this.dialog.locator('input[name="price"]');
    this.stockInput = this.dialog.locator('input[name="stock"]');
    this.submitButton = this.dialog.locator('button[type="submit"]');
    this.cancelButton = this.dialog.locator('button:has-text("Отмена")');
    
    // Table actions
    this.editButtons = page.locator('button[aria-label="Редактировать"]');
    this.deleteButtons = page.locator('button[aria-label="Удалить"]');
  }
  
  /**
   * Navigate to materials page
   */
  async navigate() {
    await this.goto('/app/materials');
  }
  
  /**
   * Open create material dialog
   */
  async openCreateDialog() {
    await this.createButton.click();
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });
  }
  
  /**
   * Create new material
   */
  async createMaterial(data: {
    name: string;
    unit: string;
    price: number;
    stock?: number;
  }) {
    await this.openCreateDialog();
    
    // Fill form
    await this.nameInput.fill(data.name);
    await this.selectComboboxOption(this.unitSelect, data.unit);
    await this.priceInput.fill(data.price.toString());
    
    if (data.stock !== undefined) {
      await this.stockInput.fill(data.stock.toString());
    }
    
    // Submit and wait for Server Action
    const responsePromise = this.waitForServerAction('materials/create');
    await this.submitButton.click();
    await responsePromise;
    
    // Wait for dialog to close
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 });
    
    // Wait for success toast
    await this.page.waitForSelector('[data-sonner-toast]', { 
      state: 'visible', 
      timeout: 10000 
    });
  }
  
  /**
   * Search for material by name
   */
  async searchMaterial(query: string) {
    await this.searchInput.fill(query);
    
    // Wait for debounced search
    await this.page.waitForTimeout(500);
    
    // Wait for table to update
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
  
  /**
   * Get material by name from table
   */
  async getMaterialRowByName(name: string): Promise<Locator | null> {
    const row = this.tableRows.filter({ hasText: name }).first();
    const isVisible = await row.isVisible({ timeout: 5000 }).catch(() => false);
    
    return isVisible ? row : null;
  }
  
  /**
   * Get material data from row
   */
  async getMaterialData(row: Locator): Promise<{
    name: string;
    unit: string;
    price: string;
    stock: string;
  }> {
    const cells = row.locator('td');
    
    return {
      name: await cells.nth(0).textContent() || '',
      unit: await cells.nth(1).textContent() || '',
      price: await cells.nth(2).textContent() || '',
      stock: await cells.nth(3).textContent() || '',
    };
  }
  
  /**
   * Edit material by name
   */
  async editMaterial(materialName: string, updates: Partial<{
    name: string;
    unit: string;
    price: number;
    stock: number;
  }>) {
    const row = await this.getMaterialRowByName(materialName);
    if (!row) throw new Error(`Material "${materialName}" not found in table`);
    
    // Click edit button in row
    await row.locator('button[aria-label="Редактировать"]').click();
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Update fields
    if (updates.name) {
      await this.nameInput.fill(updates.name);
    }
    if (updates.unit) {
      await this.selectComboboxOption(this.unitSelect, updates.unit);
    }
    if (updates.price !== undefined) {
      await this.priceInput.fill(updates.price.toString());
    }
    if (updates.stock !== undefined) {
      await this.stockInput.fill(updates.stock.toString());
    }
    
    // Submit
    const responsePromise = this.waitForServerAction('materials/update');
    await this.submitButton.click();
    await responsePromise;
    
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 });
  }
  
  /**
   * Delete material by name
   */
  async deleteMaterial(materialName: string) {
    const row = await this.getMaterialRowByName(materialName);
    if (!row) throw new Error(`Material "${materialName}" not found in table`);
    
    // Click delete button
    await row.locator('button[aria-label="Удалить"]').click();
    
    // Confirm in alert dialog
    const confirmButton = this.page.locator('[role="alertdialog"] button:has-text("Удалить")');
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    
    const responsePromise = this.waitForServerAction('materials/delete');
    await confirmButton.click();
    await responsePromise;
    
    // Wait for success toast
    await this.page.waitForSelector('[data-sonner-toast]', { 
      state: 'visible', 
      timeout: 10000 
    });
  }
  
  /**
   * Get total number of materials in table
   */
  async getMaterialsCount(): Promise<number> {
    // Wait for table to be visible
    await this.materialsTable.waitFor({ state: 'visible', timeout: 5000 });
    
    const rows = await this.tableRows.count();
    
    // Check if "no results" row exists
    const noResults = await this.page.locator('tbody tr td:has-text("Нет результатов")').isVisible({ timeout: 1000 }).catch(() => false);
    
    return noResults ? 0 : rows;
  }
  
  /**
   * Check if material exists by name
   */
  async materialExists(name: string): Promise<boolean> {
    const row = await this.getMaterialRowByName(name);
    return row !== null;
  }
  
  /**
   * Wait for materials table to load
   */
  async waitForTableLoad() {
    await this.materialsTable.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
  
  /**
   * Get all material names from current page
   */
  async getAllMaterialNames(): Promise<string[]> {
    await this.waitForTableLoad();
    
    const count = await this.getMaterialsCount();
    if (count === 0) return [];
    
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const row = this.tableRows.nth(i);
      const name = await row.locator('td').nth(0).textContent();
      if (name) names.push(name);
    }
    
    return names;
  }
}
