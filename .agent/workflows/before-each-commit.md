---
description: Before each commit, run through the following checklist to maintain code quality and consistency:
---

1. **Database Migrations/Sync**: 
   - Run `pnpm db:generate` if the schema changed.
   - Run `pnpm db:migrate` to ensure your local DB is up to date.

2. **Lint and Type-Check**: 
   - Run `pnpm lint` — ALL errors must be fixed.
   - Run `pnpm type-check` — ALL TypeScript errors must be fixed.

3. **Run Unit & Integration Tests**: 
   - Run `pnpm test` — Ensure core logic is not broken.

4. **ACTUALIZE & DOCUMENT**: 
   - **Coverage**: If you added a new page, component, or endpoint, you MUST add or update tests in `__tests__/`. **No new feature is complete without test coverage.**
   - **Docs**: Update `README.md` and `AGENTS.md` if any architecture, feature, or logic changed.

5. **Project File Inventory (Cleanup)**: 
   - Remove `test_output.txt`, `*.log`, `*.tmp`.
   - Delete unused assets (e.g., unused `svg`, `debug.ts`, temporary images).
   - Ensure NO `console.log` or `debugger` statements are left in the code.

8. **Commit Message**:
   - Ensure your commit message follows the **Conventional Commits** format (e.g., `feat: ...`, `fix: ...`, `chore: ...`).