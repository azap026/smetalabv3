import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object для всех страниц приложения
 * Содержит общие методы и хелперы
 */
export class BasePage {
  readonly page: Page;
  
  // Common elements across all pages
  readonly header: Locator;
  readonly userMenu: Locator;
  readonly notificationBell: Locator;
  readonly sidebar: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Common selectors
    this.header = page.locator('header[role="banner"]');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.notificationBell = page.locator('[data-testid="notification-bell"]');
    this.sidebar = page.locator('aside[data-testid="sidebar"]');
  }
  
  /**
   * Navigate to a specific URL and wait for hydration
   */
  async goto(url: string, options?: { waitForHydration?: boolean }) {
    await this.page.goto(url);
    
    if (options?.waitForHydration !== false) {
      await this.waitForHydration();
    }
  }
  
  /**
   * Wait for Next.js hydration to complete
   */
  async waitForHydration() {
    // Wait for __NEXT_DATA__ to be defined
    await this.page.waitForFunction(() => {
      return (window as any).__NEXT_DATA__ !== undefined;
    }, { timeout: 10000 });
    
    // Wait for network to be idle (no pending requests)
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait for React hydration marker
    await this.page.waitForSelector('[data-hydrated="true"]', { 
      timeout: 5000,
      state: 'attached' 
    }).catch(() => {
      // Optional: some pages might not have this marker
      console.warn('Hydration marker not found, continuing...');
    });
  }
  
  /**
   * Wait for Server Action to complete
   */
  async waitForServerAction(actionPattern?: string) {
    const pattern = actionPattern || '**/app/actions/**';
    
    try {
      await this.page.waitForResponse(
        resp => {
          const url = resp.url();
          const matchesPattern = url.includes(pattern);
          const isSuccess = resp.ok();
          
          return matchesPattern && isSuccess;
        },
        { timeout: 15000 }
      );
    } catch (error) {
      console.warn(`Server Action timeout (15s) for pattern: ${pattern}`);
      // Don't throw - let the test continue and fail on assertions if needed
    }
  }
  
  /**
   * Wait for API call and return response
   */
  async waitForApiResponse<T = any>(urlPattern: string | RegExp, timeout = 15000): Promise<T | null> {
    try {
      const response = await this.page.waitForResponse(
        resp => {
          const url = resp.url();
          const matches = typeof urlPattern === 'string' 
            ? url.includes(urlPattern)
            : urlPattern.test(url);
          
          return matches && resp.ok();
        },
        { timeout }
      );
      
      return await response.json();
    } catch (error) {
      console.warn(`API response timeout (${timeout}ms) for pattern: ${urlPattern}`);
      return null;
    }
  }
  
  /**
   * Click and wait for navigation
   */
  async clickAndWaitForNavigation(locator: Locator, options?: { timeout?: number }) {
    await Promise.all([
      this.page.waitForNavigation({ timeout: options?.timeout || 30000 }),
      locator.click(),
    ]);
    
    await this.waitForHydration();
  }
  
  /**
   * Fill form field and wait for debounced validation
   */
  async fillWithDebounce(locator: Locator, value: string, debounceMs = 500) {
    await locator.fill(value);
    await this.page.waitForTimeout(debounceMs);
  }
  
  /**
   * Open combobox and select option by text
   */
  async selectComboboxOption(triggerLocator: Locator, optionText: string) {
    // Click trigger to open
    await triggerLocator.click();
    
    // Wait for popover to appear
    await this.page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 5000 });
    
    // Click option
    await this.page.locator(`[role="option"]:has-text("${optionText}")`).click();
    
    // Wait for popover to close
    await this.page.waitForSelector('[role="listbox"]', { state: 'hidden', timeout: 5000 });
  }
  
  /**
   * Check if success toast is visible
   */
  async hasSuccessToast(partialText?: string): Promise<boolean> {
    const selector = partialText 
      ? `[data-sonner-toast]:has-text("${partialText}")`
      : '[data-sonner-toast]';
    
    return await this.page.locator(selector).isVisible({ timeout: 10000 });
  }
  
  /**
   * Check if error toast is visible
   */
  async hasErrorToast(partialText?: string): Promise<boolean> {
    const selector = partialText 
      ? `[data-sonner-toast][data-type="error"]:has-text("${partialText}")`
      : '[data-sonner-toast][data-type="error"]';
    
    return await this.page.locator(selector).isVisible({ timeout: 10000 });
  }
  
  /**
   * Get text from success toast
   */
  async getSuccessToastText(): Promise<string> {
    const toast = this.page.locator('[data-sonner-toast]').first();
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    return await toast.textContent() || '';
  }
  
  /**
   * Close all toasts
   */
  async closeAllToasts() {
    const closeButtons = this.page.locator('[data-sonner-toast] button[aria-label="Close"]');
    const count = await closeButtons.count();
    
    for (let i = 0; i < count; i++) {
      await closeButtons.nth(i).click();
    }
  }
  
  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.userMenu.click();
    await this.page.waitForSelector('[role="menu"]', { state: 'visible', timeout: 5000 });
  }
  
  /**
   * Logout
   */
  async logout() {
    await this.openUserMenu();
    await this.page.locator('[role="menuitem"]:has-text("Выход")').click();
    await this.page.waitForURL('/sign-in', { timeout: 10000 });
  }
  
  /**
   * Check if user is authenticated (by checking redirect)
   */
  async isAuthenticated(): Promise<boolean> {
    const url = this.page.url();
    return !url.includes('/sign-in') && !url.includes('/sign-up');
  }
  
  /**
   * Get current tenant ID from URL or page data
   */
  async getCurrentTenantId(): Promise<string | null> {
    // Try to extract from URL first
    const url = this.page.url();
    const match = url.match(/tenantId=([^&]+)/);
    if (match) return match[1];
    
    // Try to get from page context
    return await this.page.evaluate(() => {
      return (window as any).__TENANT_ID__ || null;
    });
  }
}
