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

## Strict Rules (MANDATORY)
1. **Architecture**: Follow Next.js App Router rules. Use "use client" only when necessary. Keep clear separation between client and server logic.
2. **UI**: Only use `shadcn/ui` components. Do not create custom UI libraries or use raw CSS unless explicitly justified.
3. **TypeScript**: Strict typing only. No `any`. Use Zod for validation of all inputs and data structures.
4. **Database**: Migration files must always reflect the actual schema state. Keep `drizzle/*.sql` and `schema.ts` in sync.
5. **RBAC**: Respect `owner`, `admin`, `member`, `estimator`, `manager` roles. Admin-only features must live under `/admin/**`.
6. **Mutations**: Always validate inputs and check authorization before any database modification.
7. **Environment**: Use **Git Bash only** for terminal commands. Avoid PowerShell or Zsh-specific syntax.
8. **Commits**: Use **Conventional Commits** format (e.g., `feat:`, `fix:`, `refactor:`).
9. **Naming**: 
   - Components: `PascalCase`
   - Hooks: `camelCase`
   - Database tables: `snake_case`
10. **Cleanup**: Before every commit, remove temporary, unused, or debug files (logs, tmp, console.log).

## Workflow Commands
- **Install Dependencies**: `pnpm install`
- **Database Migration**: `pnpm db:generate` then `pnpm db:migrate`
- **Seed Permissions**: `pnpm db:seed:permissions`
- **Run Development**: `pnpm dev`
- **Lint**: `pnpm lint`
- **Type Check**: `pnpm type-check`
- **Test**: `pnpm test`

## Important Context
- All payment logic is encapsulated in `lib/payments/`.
- Authentication uses JWTs stored in cookies.
- Middleware handles route protection and RBAC checks.
- Activity logging is centralized.
