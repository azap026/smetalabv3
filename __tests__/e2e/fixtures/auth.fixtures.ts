import { test as base, expect as baseExpect, Page } from '@playwright/test';
import * as path from 'path';

/**
 * Extended Playwright fixtures with authenticated pages for different roles
 * Использует pre-authenticated sessions из .auth/*.json
 */

type AuthFixtures = {
  /** Authenticated page with Owner role (full access) */
  ownerPage: Page;
  
  /** Authenticated page with Admin role (can manage team) */
  adminPage: Page;
  
  /** Authenticated page with Member role (standard access) */
  memberPage: Page;
  
  /** Authenticated page with Estimator role (read-only for estimates) */
  estimatorPage: Page;
  
  /** Authenticated page with Superadmin role (platform admin) */
  superadminPage: Page;
  
  /** Generic authenticated page (uses owner by default) */
  authenticatedPage: Page;
};

/**
 * Helper to create authenticated page from storage state
 */
async function createAuthenticatedPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  browser: any, 
  storageStatePath: string
): Promise<Page> {
  const authFile = path.join(process.cwd(), '.auth', storageStatePath);
  
  const context = await browser.newContext({
    storageState: authFile,
  });
  
  const page = await context.newPage();
  
  // Add custom page methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (page as any).waitForHydration = async () => {
    // Wait for Next.js hydration
    await page.waitForFunction(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).__NEXT_DATA__ !== undefined;
    }, { timeout: 10000 });
    
    // Wait for no pending requests
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (page as any).waitForServerAction = async (actionUrl?: string) => {
    // Wait for Server Action to complete
    const timeout = 15000;
    const pattern = actionUrl || '**/app/actions/**';
    
    try {
      await page.waitForResponse(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (resp: any) => resp.url().includes(pattern) && resp.ok(),
        { timeout }
      );
    } catch {
      console.warn(`Server Action timeout (${timeout}ms) for pattern: ${pattern}`);
    }
  };
  
  return page;
}

/**
 * Extended test with auth fixtures
 */
export const test = base.extend<AuthFixtures>({
  ownerPage: async ({ browser }, use) => {
    const page = await createAuthenticatedPage(browser, 'owner.json');
    await use(page);
    await page.context().close();
  },
  
  adminPage: async ({ browser }, use) => {
    const page = await createAuthenticatedPage(browser, 'admin.json');
    await use(page);
    await page.context().close();
  },
  
  memberPage: async ({ browser }, use) => {
    const page = await createAuthenticatedPage(browser, 'member.json');
    await use(page);
    await page.context().close();
  },
  
  estimatorPage: async ({ browser }, use) => {
    const page = await createAuthenticatedPage(browser, 'estimator.json');
    await use(page);
    await page.context().close();
  },
  
  superadminPage: async ({ browser }, use) => {
    const page = await createAuthenticatedPage(browser, 'superadmin.json');
    await use(page);
    await page.context().close();
  },
  
  authenticatedPage: async ({ browser }, use) => {
    // Default to owner for generic authenticated tests
    const page = await createAuthenticatedPage(browser, 'owner.json');
    await use(page);
    await page.context().close();
  },
});

/**
 * Custom matchers for Playwright
 */
export const expect = baseExpect.extend({
  async toHaveSuccessToast(page: Page) {
    const toastLocator = page.locator('[data-sonner-toast]').filter({ hasText: /успешно|добавлен|создан|обновлен|удален/i });
    
    return {
      message: () => 'Expected success toast to be visible',
      pass: await toastLocator.isVisible({ timeout: 10000 }),
      actual: await toastLocator.count(),
    };
  },
  
  async toHaveErrorToast(page: Page, errorText?: string) {
    const toastLocator = errorText 
      ? page.locator('[data-sonner-toast]').filter({ hasText: errorText })
      : page.locator('[data-sonner-toast]').filter({ hasText: /ошибка|error|failed/i });
    
    return {
      message: () => `Expected error toast${errorText ? ` with text "${errorText}"` : ''} to be visible`,
      pass: await toastLocator.isVisible({ timeout: 10000 }),
      actual: await toastLocator.count(),
    };
  },
});
