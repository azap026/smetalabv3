import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page Object для страницы Works (/app/works)
 */
export class WorksPage extends BasePage {
  // Page-specific locators
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly worksTable: Locator;
  readonly tableRows: Locator;
  
  // Dialog locators
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly unitSelect: Locator;
  readonly priceInput: Locator;
  readonly categorySelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  
  // Table action buttons
  readonly editButtons: Locator;
  readonly deleteButtons: Locator;
  
  constructor(page: Page) {
    super(page);
    
    // Main page elements
    this.createButton = page.locator('button:has-text("Добавить работу")');
    this.searchInput = page.locator('input[placeholder*="Поиск"]');
    this.worksTable = page.locator('table');
    this.tableRows = page.locator('tbody tr');
    
    // Dialog elements
    this.dialog = page.locator('[role="dialog"]');
    this.dialogTitle = this.dialog.locator('h2');
    this.nameInput = this.dialog.locator('input[name="name"]');
    this.descriptionInput = this.dialog.locator('textarea[name="description"]');
    this.unitSelect = this.dialog.locator('[data-testid="unit-select"]');
    this.priceInput = this.dialog.locator('input[name="price"]');
    this.categorySelect = this.dialog.locator('[data-testid="category-select"]');
    this.submitButton = this.dialog.locator('button[type="submit"]');
    this.cancelButton = this.dialog.locator('button:has-text("Отмена")');
    
    // Table actions
    this.editButtons = page.locator('button[aria-label="Редактировать"]');
    this.deleteButtons = page.locator('button[aria-label="Удалить"]');
  }
  
  /**
   * Navigate to works page
   */
  async navigate() {
    await this.goto('/app/works');
  }
  
  /**
   * Open create work dialog
   */
  async openCreateDialog() {
    await this.createButton.click();
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });
  }
  
  /**
   * Create new work
   */
  async createWork(data: {
    name: string;
    description?: string;
    unit: string;
    price: number;
    category?: string;
  }) {
    await this.openCreateDialog();
    
    // Fill form
    await this.nameInput.fill(data.name);
    
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
    
    await this.selectComboboxOption(this.unitSelect, data.unit);
    await this.priceInput.fill(data.price.toString());
    
    if (data.category) {
      await this.selectComboboxOption(this.categorySelect, data.category);
    }
    
    // Submit and wait for Server Action
    const responsePromise = this.waitForServerAction('works/create');
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
   * Search for work by name
   */
  async searchWork(query: string) {
    await this.searchInput.fill(query);
    
    // Wait for debounced search
    await this.page.waitForTimeout(500);
    
    // Wait for table to update
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
  
  /**
   * Get work row by name from table
   */
  async getWorkRowByName(name: string): Promise<Locator | null> {
    const row = this.tableRows.filter({ hasText: name }).first();
    const isVisible = await row.isVisible({ timeout: 5000 }).catch(() => false);
    
    return isVisible ? row : null;
  }
  
  /**
   * Get work data from row
   */
  async getWorkData(row: Locator): Promise<{
    name: string;
    description: string;
    unit: string;
    price: string;
    category: string;
  }> {
    const cells = row.locator('td');
    
    return {
      name: await cells.nth(0).textContent() || '',
      description: await cells.nth(1).textContent() || '',
      unit: await cells.nth(2).textContent() || '',
      price: await cells.nth(3).textContent() || '',
      category: await cells.nth(4).textContent() || '',
    };
  }
  
  /**
   * Edit work by name
   */
  async editWork(workName: string, updates: Partial<{
    name: string;
    description: string;
    unit: string;
    price: number;
    category: string;
  }>) {
    const row = await this.getWorkRowByName(workName);
    if (!row) throw new Error(`Work "${workName}" not found in table`);
    
    // Click edit button in row
    await row.locator('button[aria-label="Редактировать"]').click();
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Update fields
    if (updates.name) {
      await this.nameInput.fill(updates.name);
    }
    if (updates.description) {
      await this.descriptionInput.fill(updates.description);
    }
    if (updates.unit) {
      await this.selectComboboxOption(this.unitSelect, updates.unit);
    }
    if (updates.price !== undefined) {
      await this.priceInput.fill(updates.price.toString());
    }
    if (updates.category) {
      await this.selectComboboxOption(this.categorySelect, updates.category);
    }
    
    // Submit
    const responsePromise = this.waitForServerAction('works/update');
    await this.submitButton.click();
    await responsePromise;
    
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 });
  }
  
  /**
   * Delete work by name
   */
  async deleteWork(workName: string) {
    const row = await this.getWorkRowByName(workName);
    if (!row) throw new Error(`Work "${workName}" not found in table`);
    
    // Click delete button
    await row.locator('button[aria-label="Удалить"]').click();
    
    // Confirm in alert dialog
    const confirmButton = this.page.locator('[role="alertdialog"] button:has-text("Удалить")');
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    
    const responsePromise = this.waitForServerAction('works/delete');
    await confirmButton.click();
    await responsePromise;
    
    // Wait for success toast
    await this.page.waitForSelector('[data-sonner-toast]', { 
      state: 'visible', 
      timeout: 10000 
    });
  }
  
  /**
   * Get total number of works in table
   */
  async getWorksCount(): Promise<number> {
    // Wait for table to be visible
    await this.worksTable.waitFor({ state: 'visible', timeout: 5000 });
    
    const rows = await this.tableRows.count();
    
    // Check if "no results" row exists
    const noResults = await this.page.locator('tbody tr td:has-text("Нет результатов")').isVisible({ timeout: 1000 }).catch(() => false);
    
    return noResults ? 0 : rows;
  }
  
  /**
   * Check if work exists by name
   */
  async workExists(name: string): Promise<boolean> {
    const row = await this.getWorkRowByName(name);
    return row !== null;
  }
  
  /**
   * Wait for works table to load
   */
  async waitForTableLoad() {
    await this.worksTable.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
  
  /**
   * Get all work names from current page
   */
  async getAllWorkNames(): Promise<string[]> {
    await this.waitForTableLoad();
    
    const count = await this.getWorksCount();
    if (count === 0) return [];
    
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const row = this.tableRows.nth(i);
      const name = await row.locator('td').nth(0).textContent();
      if (name) names.push(name);
    }
    
    return names;
  }
  
  /**
   * Filter works by category
   */
  async filterByCategory(category: string) {
    const filterButton = this.page.locator('[data-testid="category-filter"]');
    await filterButton.click();
    
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 5000 });
    await this.page.locator(`[role="option"]:has-text("${category}")`).click();
    await this.page.waitForSelector('[role="listbox"]', { state: 'hidden', timeout: 5000 });
    
    await this.waitForTableLoad();
  }
  
  /**
   * Clear all filters
   */
  async clearFilters() {
    const clearButton = this.page.locator('button:has-text("Очистить фильтры")');
    const isVisible = await clearButton.isVisible({ timeout: 1000 }).catch(() => false);
    
    if (isVisible) {
      await clearButton.click();
      await this.waitForTableLoad();
    }
  }
}
