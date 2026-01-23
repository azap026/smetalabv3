---
description: Before each commit, run through the following checklist to maintain code quality and consistency:
---

Database Migrations in Sync: Run the Drizzle ORM migration generation and apply it. Use drizzle-kit generate to create any new migration files for schema changes, and then run drizzle-kit push to apply them. This ensures your database schema and migration files are up to date and in sync.

Lint and Type-Check: Before every commit, you MUST execute the linters and TypeScript checker to ensure compliance with the project's strict standards (Rules #3 and #7). Run `npm run lint` and `npm run type-check`. All errors must be resolved. Warnings should be addressed if possible. This step is critical to prevent broken code from reaching the repository.

Run Tests: Ensure all tests pass by running `npm test`. If no test suite is configured yet, work on adding basic unit tests for new logic as required by Rule #7.

Update Documentation: If your changes modify any features, API, or project structure, update README.md and other relevant docs (Rule #8). This includes keeping workflows like this one up to date with the actual project scripts.