# MASTER TEST STRATEGY: 100% COVERAGE GOAL

**Role:** Lead QA Automation Engineer & SDET (Software Development Engineer in Test).
**Objective:** Architect and implement a complete testing pyramid to achieve near 100% test coverage for critical business logic and UI interactions.

## 🧱 Layer 1: Unit & Component Testing (Vitest + React Testing Library)
**Target:** 100% coverage for `lib/` utils and `components/ui` atoms.

*   **[ ] UI Components:** Create snapshot and interaction tests for:
    *   Forms: `Input`, `Select`, `Textarea`, `Checkbox`, `RadioGroup`.
    *   Layout: `Card`, `Dialog`, `Sheet`, `DropdownMenu`.
    *   *Action:* Verify props passing `className`, `disabled` state, and event handlers `onClick/onChange`.
*   **[ ] Utilities (`lib/`):**
    *   `lib/utils.ts` (cn, formatting).
    *   `lib/auth/*` (session helpers, permission checks).
*   **[ ] Hooks (`hooks/`):**
    *   `use-permissions.ts`, `use-mobile.ts`.

## 🔗 Layer 2: API & Integration Testing (Vitest or Playwright API)
**Target:** Cover all Next.js API Routes in `app/api/**`.

*   **[ ] Team Management:**
    *   `GET /api/team` (Verify fetching correct members).
    *   `POST /api/invites` (Invite user flow + DB check).
    *   `DELETE /api/team/member` (Verify removal + RBAC check).
*   **[ ] Projects:**
    *   CRUD operations for Projects.
    *   **Security:** Verify that a user cannot query projects from another organization.

## 🎭 Layer 3: End-to-End (E2E) Testing (Playwright)
**Target:** Cover critical User Journeys (Happy Paths).

*   **[ ] Auth Flow (Enhanced):**
    *   Sign Up with Invite Code.
    *   Password Reset Flow.
*   **[ ] Workspace Flow:**
    *   User logs in -> Navigates to Projects -> Creates "New Project" -> Verifies it appears in list.
*   **[ ] Team Settings:**
    *   Admin logs in -> Invites "new@user.com" -> Verifies invite sent.
*   **[ ] Responsive Check:**
    *   Run critical flows on Mobile Viewport (iPhone 13).

## 🛠 Infrastructure & Config
*   **[ ] Coverage Report:** Configure Vitest to output coverage repors (`c8` or `v8`).
    *   Command: `pnpm test:coverage`.
    *   Threshold: Fail CI if coverage < 80% (initially).
*   **[ ] Mocking:**
    *   Set up robust mocks for **Stripe** and **Resend** (Email) to avoid hitting external APIs during tests.

## 🚀 EXECUTION ORDER
1.  **Configure Coverage:** Enable coverage reporting in `vitest.config.ts`.
2.  **Fix Gaps:** Iterate folder by folder (`lib`, then `components`, then `api`).
3.  **Refactor:** If code is untestable, refactor it to accept dependency injection or simpler props.

**Start now. Do not stop until the project is fortified.**
