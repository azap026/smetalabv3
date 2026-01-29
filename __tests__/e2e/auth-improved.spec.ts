import { test, expect } from '../fixtures/auth.fixtures';
import { AuthPage } from '../page-objects/auth-page';

test.describe('Authentication & Authorization', () => {
  test('should render landing page with correct elements', async ({ page }) => {
    const authPage = new AuthPage(page);
    
    await page.goto('/');
    await authPage.waitForHydration();
    
    // Verify key elements are present after hydration
    await expect(page.locator('header').getByText('Smetalab')).toBeVisible();
    await expect(page.getByRole('link', { name: /Войти/i })).toBeVisible();
  });
  
  test('should redirect unauthenticated user from protected routes', async ({ page }) => {
    await page.goto('/app/materials');
    
    // Middleware should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });
  
  test('should login successfully with valid credentials', async ({ page }) => {
    const authPage = new AuthPage(page);
    
    // Login using Page Object
    await authPage.login('test@test.com', 'admin123');
    
    // Should be on dashboard/app
    await expect(page).toHaveURL(/\/app/);
    
    // Verify navigation elements are visible
    await expect(page.getByRole('link', { name: /Главная/i })).toBeVisible({ 
      timeout: 15000 
    });
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    const authPage = new AuthPage(page);
    
    await authPage.attemptInvalidLogin('invalid@test.com', 'wrongpassword');
    
    // Should show error message
    await expect(authPage.errorMessage).toBeVisible();
    
    // Should not navigate away from sign-in
    await expect(page).toHaveURL(/sign-in/);
  });
  
  test('should validate email format', async ({ page }) => {
    const authPage = new AuthPage(page);
    
    await authPage.navigateToSignIn();
    await authPage.fillEmail('not-an-email');
    await authPage.fillPassword('password123');
    
    // Trigger validation (blur or attempt submit)
    await authPage.loginButton.click();
    
    // Should show validation error
    const hasError = await authPage.hasEmailValidationError();
    expect(hasError).toBe(true);
  });
  
  test('should require password field', async ({ page }) => {
    const authPage = new AuthPage(page);
    
    await authPage.navigateToSignIn();
    await authPage.fillEmail('test@test.com');
    // Leave password empty
    
    // Login button should be disabled or show error on submit
    await authPage.loginButton.click();
    
    const hasError = await authPage.hasPasswordValidationError();
    expect(hasError).toBe(true);
  });
  
  test('should persist session across page reloads', async ({ authenticatedPage }) => {
    // Already authenticated via fixture
    await authenticatedPage.goto('/app/materials');
    await expect(authenticatedPage).toHaveURL(/\/app\/materials/);
    
    // Reload page
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Should still be authenticated (no redirect to sign-in)
    await expect(authenticatedPage).toHaveURL(/\/app\/materials/);
    await expect(authenticatedPage.getByRole('link', { name: /Главная/i })).toBeVisible();
  });
  
  test('should logout successfully', async ({ authenticatedPage }) => {
    const authPage = new AuthPage(authenticatedPage);
    
    await authenticatedPage.goto('/app');
    
    // Logout using page object method
    await authPage.logout();
    
    // Should be redirected to sign-in
    await expect(authenticatedPage).toHaveURL('/sign-in');
    
    // Session cookie should be cleared
    const cookies = await authenticatedPage.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');
    expect(sessionCookie).toBeUndefined();
  });
  
  test('should refresh JWT token on navigation', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/app/materials');
    
    // Get initial session cookie
    let cookies = await authenticatedPage.context().cookies();
    let sessionCookie = cookies.find(c => c.name === 'session');
    const initialToken = sessionCookie?.value;
    
    // Wait a moment and navigate to trigger middleware
    await authenticatedPage.waitForTimeout(2000);
    await authenticatedPage.goto('/app/works');
    
    // Get refreshed session cookie
    cookies = await authenticatedPage.context().cookies();
    sessionCookie = cookies.find(c => c.name === 'session');
    const refreshedToken = sessionCookie?.value;
    
    // Token should have been refreshed (different value)
    expect(refreshedToken).toBeDefined();
    expect(refreshedToken).not.toBe(initialToken);
  });
  
  test('should handle SSR hydration correctly on sign-in page', async ({ page }) => {
    const authPage = new AuthPage(page);
    
    await authPage.navigateToSignIn();
    
    // Wait for full hydration
    await authPage.waitForHydration();
    
    // All form elements should be interactive (not hydrating)
    await expect(authPage.emailInput).toBeEditable();
    await expect(authPage.passwordInput).toBeEditable();
    await expect(authPage.loginButton).toBeEnabled();
    
    // Should not have hydration errors in console
    const consoleErrors = await page.evaluate(() => {
      return (window as any).__HYDRATION_ERRORS__ || [];
    });
    expect(consoleErrors.length).toBe(0);
  });
});
