# Smetalab v2 — GitHub Copilot Custom Instructions

## Project Summary
Smetalab v2 — multi-tenant SaaS с RBAC, custom JWT auth, AI-функциями (OpenAI embeddings) и строгой типизацией.  
Next.js 15 (Canary) App Router + React 19 + TypeScript 5.8 strict + PostgreSQL + Drizzle ORM.

## Always Follow These Rules
- Отвечай кратко, без лишних объяснений, если не попросили "объясни" / "почему".
- Всегда TypeScript strict: `strict: true`, `noImplicitAny`, полная типизация (Zod + Drizzle → UI).
- Modern React/Next: optional chaining, nullish coalescing, top-level await.
- Перед изменениями > 10 строк или новыми фичами — план в 4–8 шагов (markdown список).
- Атомарные коммиты: conventional commits (feat:, fix:, refactor:, test:, chore:).
- Никогда не используй: any, class components, CSS modules, styled-components, lodash, raw fetch/axios, Redux.

## Tech Stack & Preferences — Strictly Enforce
- Framework: Next.js 15 Canary (App Router) + Server Actions
- UI: React 19, Shadcn/UI (Radix primitives + Lucide icons), Tailwind CSS 4, clsx + tailwind-merge
- Forms: React Hook Form + Zod + @hookform/resolvers/zod
- Database: PostgreSQL + Drizzle ORM + Drizzle Kit
  - schema.ts — только определения таблиц (export const table = pgTable(...))
  - queries.ts — переиспользуемые prepared queries / composable builders
  - Всегда: withActiveTenant() или явный tenantId в where
  - Мутации: db.transaction(async (tx) => { ... })
- Auth & Security: Custom JWT (jose), RBAC (Superadmin / Tenant Owner / Member / ...)
  - middleware.ts — проверка сессии + права ДО рендеринга
  - Server Actions — повторная проверка auth + RBAC
- AI: OpenAI SDK (chat completions + embeddings)
- Monitoring: Sentry (captureException, captureMessage на front/back)
- Testing:
  - Vitest: unit/integration, AAA pattern, vi.fn()/vi.mock, RTL

## Architecture Layers — Strict Separation
1. **Presentation** (app/ + components/ + hooks/)
   - app/ — Route Groups ((workspace), (auth), ...)
   - components/ui/ — dumb components (без логики, props only)
   - hooks/ — client logic, data fetching, state

2. **Server Actions** (app/actions/)
   - Валидация Zod, auth/RBAC check, вызов сервиса
   - revalidatePath / revalidateTag после мутаций
   - НЕ бизнес-логика здесь!

3. **Domain / Services** (lib/services/)
   - Вся бизнес-логика
   - Вход: валидированные данные (Zod parsed)
   - Мутации: db.transaction обязательно
   - Транзакции для multi-table операций

4. **Data Access** (lib/db/)
   - schema.ts — таблицы + relations
   - queries.ts — composable queries
   - Запрещено: прямые db.select().where() без tenantId!

## Multi-Tenancy & Security — Critical
- Никогда не пиши where без tenantId (или withActiveTenant helper)
- Все мутации — в транзакции
- Server Actions: всегда проверяй сессию + права (даже если middleware прошёл)
- Не храни secrets в коде, используй env + jose для JWT

## Testing Guidelines
- Unit: Vitest + @testing-library/react, AAA, happy path + 2–3 edges
- После генерации тестов — предлагай: npm run test

## Agent / Copilot Behavior
- В Agent mode: всегда начинай с плана, используй #file: для явного контекста
- После изменений: предлагай git add/commit, запуск тестов, Sentry check
- Если задача большая — предлагай разбить на подзадачи

## Additional Files Recommendation
- Создай .github/AGENTS.md для описания custom agents (Test Writer, Security Reviewer и т.д.)
- Для специфичных частей проекта добавляй .github/instructions/db.instructions.md и т.п.

Эти правила применяются ко всем взаимодействиям Copilot в репозитории.