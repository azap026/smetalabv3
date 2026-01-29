# Agent Instructions for Smetalab

You are an autonomous coding agent working on the Smetalab project.

## Project Overview
Smetalab is a SaaS application built with Next.js, Postgres, Drizzle, and Stripe. It features a robust Role-Based Access Control (RBAC) system.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: Postgres with Drizzle ORM
- **Authentication**: Custom JWT-based auth
- **Payments**: Stripe
- **Email**: Resend
- **Package Manager**: pnpm

## Project Structure
- `app/`: Next.js App Router pages and API routes.
- `components/ui/`: Reusable UI components from shadcn/ui.
- `lib/`: Business logic, database schemas, and utility functions.
  - `lib/db/`: Database schema and configuration.
  - `lib/auth/`: Authentication logic and RBAC.
  - `lib/payments/`: Stripe integration.
- `drizzle/`: Database migrations.
- `__tests__/`: Testing suite (Unit, Integration).

## Strict Rules (MANDATORY)
1. **Architecture**: Follow Next.js App Router rules. Use "use client" only when necessary. Keep clear separation between client and server logic.
2. **UI**: Only use `shadcn/ui` components. Do not create custom UI libraries or use raw CSS unless explicitly justified.
3. **TypeScript**: Strict typing only. No `any`. Use Zod for validation of all inputs and data structures.
4. **Database Security**: **Always** use `withActiveTenant` helper from `lib/db/queries.ts` for all queries involving tables with `tenantId` and `deletedAt`. Never filter manually if the helper is available.
5. **Database Integrity**: All bulk operations or multi-table writes must be wrapped in `db.transaction()`.
6. **Service Layer**: Business logic must reside in `lib/services/*.service.ts`. Server Actions should be thin wrappers around these services.
7. **AI Batching**: Use `generateEmbeddingsBatch` for any operations involving more than 1 embedding generation to optimize OpenAI API usage.
8. **Frontend Decomposition**: Large components must be decomposed into custom hooks (for logic) and atomic UI components (for presentation).
9. **Project Structure**: Follow Next.js App Router rules. Use "use client" only when necessary.
10. **Database**: Migration files must always reflect the actual schema state. Keep `drizzle/*.sql` and `schema.ts` in sync.
11. **RBAC**: Respect `owner`, `admin`, `member`, `estimator`, `manager` roles. Admin-only features must live under `/admin/**`.
12. **Mutations**: Always validate inputs and check authorization before any database modification.
13. **Environment**: Use **Git Bash only** for terminal commands. Avoid PowerShell or Zsh-specific syntax.
14. **Commits**: Use **Conventional Commits** format (e.g., `feat:`, `fix:`, `refactor:`).
15. **Naming**: 
   - Components: `PascalCase`
   - Hooks: `camelCase`
   - Database tables: `snake_case`
16. **Testing (CRITICAL)**: **Every new feature, page, or API endpoint must be accompanied by corresponding tests.** You are NOT allowed to push code that reduces test coverage or leaves new logic untested.
17. **Cleanup**: Before every commit, remove temporary, unused, or debug files (logs, tmp, console.log).

## Testing Standards
The project uses Vitest for Unit/Integration testing.

### 1. Unit Tests (`__tests__/unit/`)
- Target: Individual functions, utility libs, and simple UI components.
- Rule: Cover edge cases and error handling.
- Command: `pnpm test`

### 2. Integration Tests (`__tests__/integration/`)
- Target: API routes, database queries, and complex RBAC logic.
- Rule: Test interaction with the database (use mock data where necessary, or local Postgres).
- Command: `pnpm test`

## Pre-Push Protocol (MANDATORY Checklist)
Before proposing a push or finishing a task, you MUST execute:
1. `pnpm lint` — Fix all linting errors.
2. `pnpm type-check` — Fix all TypeScript errors.
3. `pnpm test` — Ensure all unit/integration tests pass.
4. **Sync Documentation**: Update README.md if architecture or features changed.
5. **File Inventory**: Remove `test_output.txt`, `.tmp`, and any other temporary artifacts.

## Important Context
- All payment logic is encapsulated in `lib/payments/`.
- Authentication uses JWTs stored in cookies.
- Middleware handles route protection and RBAC checks.
- Activity logging is centralized.
