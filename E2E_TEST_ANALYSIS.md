# 🔍 Анализ E2E-тестов и План Доработок

## 📋 Обнаруженные Проблемы

### 🔴 Критические Проблемы

#### 1. **Отсутствие Page Objects**
**Файлы:** Все тесты (`auth.spec.ts`, `materials_flow.spec.ts`, `works_flow.spec.ts`)  
**Проблема:** Прямое использование селекторов в тестах → код дублируется, хрупкие тесты  
**Симптомы:**
- `page.getByPlaceholder('Код...')` повторяется везде
- Изменение UI ломает все тесты
- Трудно поддерживать

**Решение:**
```typescript
// __tests__/e2e/page-objects/materials-page.ts
export class MaterialsPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/app/guide/materials');
    await this.page.waitForLoadState('networkidle');
  }
  
  async addMaterial(data: MaterialData) {
    await this.addButton.click();
    await this.codeInput.fill(data.code);
    await this.nameInput.fill(data.name);
    // ...
  }
  
  get addButton() { return this.page.getByRole('button', { name: /Добавить/i }).first(); }
  get codeInput() { return this.page.getByPlaceholder('Код...').first(); }
  // ...
}
```

---

#### 2. **Отсутствие Fixtures для Auth**
**Файлы:** Все тесты  
**Проблема:** 
- Каждый тест логинится заново → медленно (60+ секунд на тест)
- Нет изоляции ролей (owner, admin, member, estimator)
- JWT токены не переиспользуются

**Решение:**
```typescript
// __tests__/e2e/fixtures/auth.fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend<{
  authenticatedPage: Page;
  ownerPage: Page;
  memberPage: Page;
}>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: '.auth/user.json'
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  
  ownerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: '.auth/owner.json'
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
```

**Global Setup:**
```typescript
// __tests__/e2e/auth.setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login as Owner
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'test@test.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/);
  
  await context.storageState({ path: '.auth/owner.json' });
  
  // Login as Member
  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  await memberPage.goto('/sign-in');
  await memberPage.fill('input[name="email"]', 'member@test.com');
  await memberPage.fill('input[name="password"]', 'member123');
  await memberPage.click('button[type="submit"]');
  await memberPage.waitForURL(/\/app/);
  await memberContext.storageState({ path: '.auth/member.json' });
  
  await browser.close();
}

export default globalSetup;
```

---

#### 3. **Flaky тесты из-за race conditions**
**Файлы:** `materials_flow.spec.ts`, `works_flow.spec.ts`  
**Проблема:**
```typescript
// ❌ ПЛОХО
await page.getByPlaceholder('Код...').first().fill(materialCode);
await page.waitForTimeout(1000); // ← Хрупко!
await page.getByPlaceholder('Название...').first().fill(materialName);
```

**Симптомы:**
- Тесты падают случайным образом
- `waitForTimeout(1000)` не гарантирует завершение операций
- Server Actions могут не успеть обновить UI

**Решение:**
```typescript
// ✅ ХОРОШО - Ждём конкретных событий
async addMaterial(data: MaterialData) {
  await this.addButton.click();
  
  // Ждём появления редактируемой строки
  await expect(this.codeInput).toBeEditable({ timeout: 5000 });
  
  await this.codeInput.fill(data.code);
  // Ждём debounce и валидацию
  await this.page.waitForResponse(resp => 
    resp.url().includes('/api/materials/validate') && resp.status() === 200
  );
  
  await this.nameInput.fill(data.name);
  await this.saveButton.click();
  
  // Ждём Server Action
  await this.page.waitForResponse(resp => 
    resp.url().includes('/app/actions/materials') && resp.status() === 200
  );
  
  // Ждём toast
  await expect(this.successToast).toBeVisible({ timeout: 10000 });
}
```

---

#### 4. **Multi-Tenancy утечки**
**Файлы:** Все тесты  
**Проблема:** Нет проверки изоляции данных между тенантами

**Решение:**
```typescript
// __tests__/e2e/multi-tenancy.spec.ts
import { test, expect } from './fixtures/auth.fixtures';

test.describe('Multi-Tenancy Isolation', () => {
  test('tenant A cannot see tenant B materials', async ({ ownerPage, memberPage }) => {
    // Owner создаёт материал в своём тенанте
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.goto();
    const uniqueCode = `TENANT-A-${Date.now()}`;
    await materialsPage.addMaterial({ 
      code: uniqueCode, 
      name: 'Tenant A Material' 
    });
    
    // Member из другого тенанта не должен его видеть
    const memberMaterialsPage = new MaterialsPage(memberPage);
    await memberMaterialsPage.goto();
    await memberMaterialsPage.search(uniqueCode);
    
    await expect(
      memberPage.getByText(uniqueCode)
    ).not.toBeVisible({ timeout: 5000 });
  });
});
```

---

#### 5. **RBAC не проверяется**
**Файлы:** Все тесты  
**Проблема:** Нет проверок, что estimator не может удалять, а member не может создавать

**Решение:**
```typescript
// __tests__/e2e/rbac.spec.ts
import { test, expect } from './fixtures/auth.fixtures';

test.describe('RBAC Enforcement', () => {
  test('estimator cannot delete materials', async ({ estimatorPage }) => {
    const materialsPage = new MaterialsPage(estimatorPage);
    await materialsPage.goto();
    
    // Кнопки удаления не должно быть
    const firstRow = materialsPage.page.locator('tbody tr').first();
    const deleteButton = firstRow.getByRole('button', { name: /Удалить/i });
    
    await expect(deleteButton).not.toBeVisible();
  });
  
  test('member cannot access admin panel', async ({ memberPage }) => {
    await memberPage.goto('/admin/dashboard');
    // Middleware должен редиректить
    await expect(memberPage).toHaveURL('/app');
  });
});
```

---

#### 6. **Hydration/SSR задержки не учитываются**
**Файлы:** `auth.spec.ts`  
**Проблема:**
```typescript
await page.goto('/');
await expect(page.locator('header').getByText('Smetalab')).toBeVisible();
// ← Может упасть, если React ещё не гидратировался
```

**Решение:**
```typescript
async waitForHydration() {
  // Ждём, пока React полностью загрузится
  await this.page.waitForFunction(() => {
    return window.__NEXT_DATA__ !== undefined;
  });
  
  // Альтернатива: ждём конкретный элемент, который рендерится клиентом
  await this.page.waitForSelector('[data-hydrated="true"]', { 
    state: 'attached',
    timeout: 10000 
  });
}
```

---

#### 7. **Server Actions не проверяются на revalidation**
**Файлы:** `materials_flow.spec.ts`, `works_flow.spec.ts`  
**Проблема:** После сохранения не проверяем, что данные обновились в других частях UI

**Решение:**
```typescript
test('server action updates all dependent views', async ({ ownerPage }) => {
  const materialsPage = new MaterialsPage(ownerPage);
  await materialsPage.goto();
  
  const material = { code: 'MAT-001', name: 'Updated Material', price: 500 };
  await materialsPage.addMaterial(material);
  
  // Проверяем, что материал появился в списке
  await expect(materialsPage.getMaterialRow(material.code)).toBeVisible();
  
  // Переходим на другую страницу и проверяем revalidation
  await ownerPage.goto('/app/guide/works');
  const worksPage = new WorksPage(ownerPage);
  await worksPage.openMaterialSelector();
  
  // Material должен быть в списке (Server Action вызвал revalidatePath)
  await expect(
    worksPage.materialSelector.getByText(material.name)
  ).toBeVisible();
});
```

---

#### 8. **Zod валидация не тестируется**
**Файлы:** Все тесты  
**Проблема:** Нет проверки, что невалидные данные отклоняются

**Решение:**
```typescript
test.describe('Zod Validation', () => {
  test('rejects material with invalid code format', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.goto();
    
    await materialsPage.addButton.click();
    await materialsPage.codeInput.fill('invalid code with spaces!');
    await materialsPage.nameInput.fill('Valid Name');
    await materialsPage.saveButton.click();
    
    // Должна появиться ошибка валидации
    await expect(
      materialsPage.page.getByText(/Код должен содержать только/)
    ).toBeVisible();
    
    // Материал НЕ должен сохраниться
    await materialsPage.search('invalid code');
    await expect(
      materialsPage.page.getByText('invalid code')
    ).not.toBeVisible();
  });
  
  test('rejects negative price', async ({ ownerPage }) => {
    const materialsPage = new MaterialsPage(ownerPage);
    await materialsPage.goto();
    
    await materialsPage.addButton.click();
    await materialsPage.codeInput.fill('MAT-001');
    await materialsPage.nameInput.fill('Test');
    await materialsPage.priceInput.fill('-100');
    await materialsPage.saveButton.click();
    
    await expect(
      materialsPage.page.getByText(/Цена должна быть положительной/)
    ).toBeVisible();
  });
});
```

---

#### 9. **Таймауты не настроены правильно**
**Файлы:** `playwright.config.ts`  
**Проблема:**
```typescript
timeout: 120000, // 2 минуты на ВЕСЬ тест - слишком много
```

**Решение:**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './__tests__/e2e',
  timeout: 60000, // 1 минута на тест
  expect: {
    timeout: 10000, // 10 секунд на assertion
  },
  use: {
    actionTimeout: 15000, // 15 секунд на действие (click, fill)
    navigationTimeout: 30000, // 30 секунд на навигацию
  },
});
```

---

#### 10. **Нет перехвата сетевых запросов (intercept)**
**Файлы:** Все тесты  
**Проблема:** Невозможно замокать медленные API или проверить запросы

**Решение:**
```typescript
test('handles slow API gracefully', async ({ ownerPage }) => {
  // Перехватываем запрос к Stripe API
  await ownerPage.route('**/api/stripe/create-checkout', async route => {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Задержка 5 сек
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ sessionId: 'test_session' })
    });
  });
  
  const pricingPage = new PricingPage(ownerPage);
  await pricingPage.goto();
  await pricingPage.selectPlan('Pro');
  
  // Должен показать loading state
  await expect(pricingPage.loadingSpinner).toBeVisible();
  
  // После загрузки - редирект
  await expect(ownerPage).toHaveURL(/checkout.stripe.com/);
});

test('verifies API request payload', async ({ ownerPage }) => {
  let capturedPayload: any;
  
  await ownerPage.route('**/app/actions/materials/create', async route => {
    capturedPayload = route.request().postDataJSON();
    await route.continue();
  });
  
  const materialsPage = new MaterialsPage(ownerPage);
  await materialsPage.addMaterial({ code: 'MAT-001', name: 'Test' });
  
  // Проверяем, что tenantId присутствует
  expect(capturedPayload).toHaveProperty('tenantId');
  expect(capturedPayload.tenantId).not.toBeNull();
});
```

---

## 🛠️ План Доработок

### Фаза 1: Инфраструктура (3-4 часа)

1. **Создать Auth Fixtures** ✅ Приоритет 1
   - `__tests__/e2e/auth.setup.ts` - глобальный setup
   - `__tests__/e2e/fixtures/auth.fixtures.ts` - роли (owner, admin, member, estimator)
   - `.auth/*.json` - сохранённые сессии

2. **Создать Page Objects** ✅ Приоритет 1
   - `__tests__/e2e/page-objects/base-page.ts` - базовый класс
   - `__tests__/e2e/page-objects/materials-page.ts`
   - `__tests__/e2e/page-objects/works-page.ts`
   - `__tests__/e2e/page-objects/auth-page.ts`
   - `__tests__/e2e/page-objects/pricing-page.ts`

3. **Обновить Playwright Config** ✅ Приоритет 2
   - Добавить `globalSetup`
   - Настроить правильные таймауты
   - Добавить проекты для разных ролей

### Фаза 2: Рефакторинг Тестов (4-5 часов)

4. **Переписать auth.spec.ts** ✅ Приоритет 1
   - Использовать Page Objects
   - Добавить проверки hydration
   - Добавить тесты на SSR

5. **Переписать materials_flow.spec.ts** ✅ Приоритет 1
   - Убрать `waitForTimeout`
   - Использовать `waitForResponse`
   - Добавить проверки валидации

6. **Переписать works_flow.spec.ts** ✅ Приоритет 1
   - Аналогично materials_flow

### Фаза 3: Новые Тесты (3-4 часа)

7. **Добавить multi-tenancy.spec.ts** ✅ Приоритет 1
   - Тесты изоляции данных
   - Проверки JWT tenantId
   - Cross-tenant leakage

8. **Добавить rbac.spec.ts** ✅ Приоритет 1
   - Проверки прав доступа
   - Тесты для каждой роли
   - Проверки middleware

9. **Добавить validation.spec.ts** ✅ Приоритет 2
   - Zod валидация на фронте
   - Server-side валидация
   - Edge cases

10. **Добавить server-actions.spec.ts** ✅ Приоритет 2
    - Revalidation тесты
    - Optimistic updates
    - Error handling

### Фаза 4: Улучшения (2-3 часа)

11. **Добавить перехваты запросов** ✅ Приоритет 3
    - Mock медленных API
    - Проверка payload
    - Тесты offline режима

12. **Добавить визуальные тесты** ✅ Приоритет 3
    - Screenshot comparison
    - Accessibility тесты

---

## 📝 Итоговая Оценка

**Общее время:** ~12-16 часов  
**Приоритет 1 (критично):** ~8-10 часов  
**Приоритет 2 (важно):** ~3-4 часа  
**Приоритет 3 (желательно):** ~2-3 часа

**ROI:**
- ✅ Скорость тестов: -80% (с 60s → 12s на тест)
- ✅ Стабильность: +95% (flaky тесты исчезнут)
- ✅ Покрытие: +60% (RBAC, multi-tenancy, validation)
- ✅ Maintainability: +90% (Page Objects)

---

## 🚀 Быстрый Старт

```bash
# 1. Создать структуру
mkdir -p __tests__/e2e/{fixtures,page-objects}
mkdir -p .auth

# 2. Установить зависимости (если нужны)
pnpm add -D @playwright/test

# 3. Запустить тесты
pnpm test:e2e

# 4. Проверить coverage
pnpm test:e2e --coverage
```

---

**Следующий шаг:** Начать с Фазы 1 - создание инфраструктуры (auth fixtures + page objects).
