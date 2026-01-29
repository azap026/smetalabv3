import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Setup для E2E тестов
 * Создаёт authenticated sessions для разных ролей
 * Сохраняет их в .auth/*.json для переиспользования
 */
async function globalSetup(config: FullConfig) {
  const authDir = path.join(process.cwd(), '.auth');
  
  // Создаём папку .auth если её нет
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const projectConfig = config.projects[0].use;
  const baseURL = projectConfig?.baseURL || 'http://localhost:3000';
  const browser = await chromium.launch();

  try {
    // ============================================
    // 1. Owner Role (Tenant Owner)
    // ============================================
    console.log('🔐 Setting up Owner session...');
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    
    await ownerPage.goto(`${baseURL}/sign-in`);
    await ownerPage.fill('input[name="email"]', 'test@test.com');
    await ownerPage.fill('input[name="password"]', 'admin123');
    await ownerPage.click('button[type="submit"]');
    
    // Ждём успешной навигации
    await ownerPage.waitForURL(/\/app/, { timeout: 30000 });
    
    // Убедимся, что сессия установлена
    const cookies = await ownerContext.cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');
    if (!sessionCookie) {
      throw new Error('Owner session cookie not found');
    }
    
    await ownerContext.storageState({ path: path.join(authDir, 'owner.json') });
    await ownerContext.close();
    console.log('✅ Owner session saved');

    // ============================================
    // 2. Admin Role (Tenant Admin)
    // ============================================
    console.log('🔐 Setting up Admin session...');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto(`${baseURL}/sign-in`);
    await adminPage.fill('input[name="email"]', 'admin@test.com');
    await adminPage.fill('input[name="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL(/\/app/, { timeout: 30000 });
    
    await adminContext.storageState({ path: path.join(authDir, 'admin.json') });
    await adminContext.close();
    console.log('✅ Admin session saved');

    // ============================================
    // 3. Member Role (Regular Team Member)
    // ============================================
    console.log('🔐 Setting up Member session...');
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    
    await memberPage.goto(`${baseURL}/sign-in`);
    await memberPage.fill('input[name="email"]', 'member@test.com');
    await memberPage.fill('input[name="password"]', 'member123');
    await memberPage.click('button[type="submit"]');
    await memberPage.waitForURL(/\/app/, { timeout: 30000 });
    
    await memberContext.storageState({ path: path.join(authDir, 'member.json') });
    await memberContext.close();
    console.log('✅ Member session saved');

    // ============================================
    // 4. Estimator Role (Read-only for estimates)
    // ============================================
    console.log('🔐 Setting up Estimator session...');
    const estimatorContext = await browser.newContext();
    const estimatorPage = await estimatorContext.newPage();
    
    await estimatorPage.goto(`${baseURL}/sign-in`);
    await estimatorPage.fill('input[name="email"]', 'estimator@test.com');
    await estimatorPage.fill('input[name="password"]', 'estimator123');
    await estimatorPage.click('button[type="submit"]');
    await estimatorPage.waitForURL(/\/app/, { timeout: 30000 });
    
    await estimatorContext.storageState({ path: path.join(authDir, 'estimator.json') });
    await estimatorContext.close();
    console.log('✅ Estimator session saved');

    // ============================================
    // 5. Superadmin Role (Platform Admin)
    // ============================================
    console.log('🔐 Setting up Superadmin session...');
    const superadminContext = await browser.newContext();
    const superadminPage = await superadminContext.newPage();
    
    await superadminPage.goto(`${baseURL}/sign-in`);
    await superadminPage.fill('input[name="email"]', 'superadmin@test.com');
    await superadminPage.fill('input[name="password"]', 'superadmin123');
    await superadminPage.click('button[type="submit"]');
    
    // Superadmin должен попасть в /admin/dashboard
    await superadminPage.waitForURL(/\/(admin|app)/, { timeout: 30000 });
    
    await superadminContext.storageState({ path: path.join(authDir, 'superadmin.json') });
    await superadminContext.close();
    console.log('✅ Superadmin session saved');

    console.log('🎉 All auth sessions created successfully!');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
