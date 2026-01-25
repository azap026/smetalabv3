---
description: Before each commit, run through the following checklist to maintain code quality and consistency:
---

1. **Database Migrations in Sync**: Run the Drizzle ORM migration generation and apply it. Use `pnpm db:generate` to create any new migration files for schema changes, and then run `pnpm db:migrate` to apply them.

2. **Lint and Type-Check**: Before every commit, you MUST execute the linters and TypeScript checker. Run `pnpm lint` and `pnpm type-check`. All errors must be resolved.

3. **Run Unit & Integration Tests**: Ensure all tests pass by running `pnpm test`. 

4. **Run E2E Tests**: Ensure all browser scenarios pass by running `pnpm test:e2e`. 

5. **ACTUALIZE TESTS**: If you added a new page, API endpoint, or logic, you MUST update or create corresponding tests in the `__tests__/` directory. **No new feature is complete without test coverage.**

6. **Update Documentation**: If your changes modify any features, API, or project structure, update `README.md` and `AGENTS.md`.

7. **Final Cleanup**: Remove `test_output.txt`, `.log`, `.tmp`, and any other temporary artifacts created during development.