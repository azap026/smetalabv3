---
description: Before each commit, run through the following checklist to maintain code quality and consistency:
---

Database Migrations in Sync: Run the Drizzle ORM migration generation and apply it. Use drizzle-kit generate to create any new migration files for schema changes, and then run drizzle-kit push to apply them. This ensures your database schema and migration files are up to date and in sync.

Lint and Type-Check: Execute the linters and TypeScript checker to catch any syntax or type errors. For example, run pnpm lint and pnpm type-check. Resolve all linting warnings/errors and TypeScript issues before committing. The codebase should pass all linting rules and strict type checks at commit time.

Run Tests: Run the full test suite with pnpm test (or the appropriate test command). Verify that all unit tests and integration tests pass. If any test fails, fix the underlying issue or update the test as needed. The goal is that the repository’s tests are green (passing) on every commit.

Update Documentation: Review whether your changes affect any documented behavior, API, or configuration. If so, update the README.md and any other relevant documentation files to reflect these changes. This includes updating usage examples, API endpoints, environment variables, or instructions if they have been altered. Ensure that documentation is consistent with the code. Only commit once you’ve confirmed that docs are adjusted for any new or changed features.