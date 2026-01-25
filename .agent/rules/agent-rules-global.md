---
trigger: always_on
---

Project Structure: Place new components in the proper directories according to the Smetalab Next.js project structure. Use the app/ directory for route segments and pages, components/ui/ for reusable UI components, and lib/ for libraries. Maintain clear separation between client and server code (use client components only where needed and keep server-side logic out of client components).

UI Components: Use only the approved Shadcn/UI components for all UI work. Do not introduce or use any other UI libraries or raw HTML/CSS for common components – stick to the Shadcn/UI design system to ensure consistency.

TypeScript Strictness: Enforce strict TypeScript practices throughout the codebase. Avoid using any – every value should have an explicit type. Define clear interface or type definitions for component props and function arguments/returns. When handling data structures, use schema validation (e.g. with Zod or Drizzle schema utilities) to ensure type safety and validate inputs and outputs.

Payments Module: Keep all payment logic encapsulated under the lib/payments/ module. Interactions with Stripe or other payment providers should only occur in this area. Do not call Stripe APIs or write payment logic outside of lib/payments/*. Other parts of the app should interact with payments through the functions provided in this module, ensuring a single source of truth for payment handling.

Role-Based Access Control (RBAC): Gate all feature access and actions by proper roles. Every protected page, API route, or action must check the user’s role/permissions before proceeding. For example, only allow owners/admins to perform admin-level actions, and enforce member or guest restrictions as defined by the project’s RBAC policy. No new feature should bypass these role checks.

Safe Data Mutations: All create/update/delete operations (any data mutation) must be done safely. Always validate incoming data against a schema (using Zod or database schema validation) before mutating the database. Additionally, perform permission checks to ensure the acting user is allowed to make that change. This guarantees that invalid or unauthorized data modifications are prevented at the business-logic layer.

Linting and Tests for Changes: Any time code is updated or new code is added, corresponding linting rules and tests must be updated as well. If you introduce a new pattern or module, consider adding or adjusting ESLint rules to cover it. Likewise, write unit tests and integration tests for all new features or changes to ensure they work as expected. No code should be merged without appropriate test coverage and lint rules passing.

9. Run Tests & Coverage: Ensure all tests pass. You MUST run:
   - `pnpm test` (Unit & Integration)
   - `pnpm test:e2e` (E2E Browser scenarios)
   **Mandatory**: If you added a new page, component, or API endpoint, you MUST add or update tests in the `__tests__` directory. No new feature is considered complete without test coverage.

10. Update Documentation: If your changes modify any features, API, or project structure, update README.md and other relevant docs (Rule #8). This includes keeping workflows like this one up to date with the actual project scripts.

11. Final Cleanup: Remove `test_output.txt`, `.log`, `.tmp`, and any other temporary artifacts created during development.

**MANDATORY Pre-Commit Checklist**: Before EVERY `git commit` and `git push`, you MUST execute the workflow defined in `.agent/workflows/before-each-commit.md`. This includes:
1. **Database Migrations**: Run `pnpm db:generate` if schema changed, then `pnpm db:migrate`.
2. **Lint**: Run `pnpm lint` — fix ALL errors.
3. **Type-Check**: Run `pnpm type-check` — fix ALL errors.
5. **E2E Tests**: Run `pnpm test:e2e` — ALL browser tests must pass.
6. **Feature Coverage**: Ensure every new page, endpoint, or feature has corresponding tests in `__tests__`.
7. **Documentation**: Update README.md if architecture/features changed.
8. **File Cleanup**: Remove temporary/debug files (*.log, *.tmp, console.log statements).

Do NOT skip any step. Do NOT commit with failing checks. This is NON-NEGOTIABLE.