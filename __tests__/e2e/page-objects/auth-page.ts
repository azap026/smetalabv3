import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page Object для страниц аутентификации
 * /sign-in и /sign-up
 */
export class AuthPage extends BasePage {
  // Sign-in locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signUpLink: Locator;
  
  // Sign-up locators
  readonly nameInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signUpButton: Locator;
  readonly signInLink: Locator;
  
  // Common elements
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  
  constructor(page: Page) {
    super(page);
    
    // Sign-in elements
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]:has-text("Войти")');
    this.signUpLink = page.locator('a:has-text("Регистрация")');
    
    // Sign-up elements
    this.nameInput = page.locator('input[name="name"]');
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    this.signUpButton = page.locator('button[type="submit"]:has-text("Зарегистрироваться")');
    this.signInLink = page.locator('a:has-text("Войти")');
    
    // Messages
    this.errorMessage = page.locator('[role="alert"]');
    this.successMessage = page.locator('[data-sonner-toast]');
  }
  
  /**
   * Navigate to sign-in page
   */
  async navigateToSignIn() {
    await this.goto('/sign-in');
  }
  
  /**
   * Navigate to sign-up page
   */
  async navigateToSignUp() {
    await this.goto('/sign-up');
  }
  
  /**
   * Fill email input
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }
  
  /**
   * Fill password input
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }
  
  /**
   * Fill name input (sign-up only)
   */
  async fillName(name: string) {
    await this.nameInput.fill(name);
  }
  
  /**
   * Fill confirm password input (sign-up only)
   */
  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }
  
  /**
   * Perform login
   */
  async login(email: string, password: string) {
    await this.navigateToSignIn();
    await this.fillEmail(email);
    await this.fillPassword(password);
    
    // Click login and wait for navigation
    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes('/api/auth') && resp.ok(),
      { timeout: 60000 }
    );
    
    await this.loginButton.click();
    await responsePromise;
    
    // Wait for redirect to dashboard/app
    await this.page.waitForURL(/\/(dashboard|app)/, { timeout: 10000 });
    await this.waitForHydration();
  }
  
  /**
   * Perform registration
   */
  async signUp(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) {
    await this.navigateToSignUp();
    
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.confirmPassword || data.password);
    
    // Click sign up and wait for response
    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes('/api/auth/register') && resp.ok(),
      { timeout: 60000 }
    );
    
    await this.signUpButton.click();
    await responsePromise;
    
    // Wait for redirect
    await this.page.waitForURL(/\/(dashboard|app|sign-in)/, { timeout: 10000 });
  }
  
  /**
   * Attempt login with invalid credentials
   */
  async attemptInvalidLogin(email: string, password: string) {
    await this.navigateToSignIn();
    await this.fillEmail(email);
    await this.fillPassword(password);
    
    await this.loginButton.click();
    
    // Wait for error message or toast
    await Promise.race([
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 }),
      this.page.locator('[data-sonner-toast][data-type="error"]').waitFor({ 
        state: 'visible', 
        timeout: 10000 
      }),
    ]);
  }
  
  /**
   * Switch to sign-up page
   */
  async switchToSignUp() {
    await this.signUpLink.click();
    await this.page.waitForURL('/sign-up', { timeout: 5000 });
  }
  
  /**
   * Switch to sign-in page
   */
  async switchToSignIn() {
    await this.signInLink.click();
    await this.page.waitForURL('/sign-in', { timeout: 5000 });
  }
  
  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
  }
  
  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 10000 });
    return await this.errorMessage.textContent() || '';
  }
  
  /**
   * Check if success message is displayed
   */
  async hasSuccess(): Promise<boolean> {
    return await this.successMessage.isVisible({ timeout: 5000 }).catch(() => false);
  }
  
  /**
   * Verify login button is disabled
   */
  async isLoginButtonDisabled(): Promise<boolean> {
    return await this.loginButton.isDisabled();
  }
  
  /**
   * Verify email input has validation error
   */
  async hasEmailValidationError(): Promise<boolean> {
    const ariaInvalid = await this.emailInput.getAttribute('aria-invalid');
    return ariaInvalid === 'true';
  }
  
  /**
   * Verify password input has validation error
   */
  async hasPasswordValidationError(): Promise<boolean> {
    const ariaInvalid = await this.passwordInput.getAttribute('aria-invalid');
    return ariaInvalid === 'true';
  }
  
  /**
   * Get validation error message for a field
   */
  async getFieldError(fieldName: string): Promise<string> {
    const errorLocator = this.page.locator(`[data-testid="${fieldName}-error"]`);
    const isVisible = await errorLocator.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!isVisible) return '';
    
    return await errorLocator.textContent() || '';
  }
  
  /**
   * Wait for login form to be ready
   */
  async waitForLoginFormReady() {
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.loginButton.waitFor({ state: 'visible', timeout: 5000 });
  }
  
  /**
   * Wait for sign-up form to be ready
   */
  async waitForSignUpFormReady() {
    await this.nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.confirmPasswordInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.signUpButton.waitFor({ state: 'visible', timeout: 5000 });
  }
}
