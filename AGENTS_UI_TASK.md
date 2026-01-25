# CRITICAL UI/UX AUDIT & FIX TASK

**Role:** You are a perfectionist QA Engineer & Lead Frontend Developer.
**Goal:** Eliminate ALL layout bugs, overflow issues, and visual glitches on Mobile (320px-480px) and Tablet (768px).

## 🛑 STRICT RULES (READ CAREFULLY)
1.  **NO Horizontal Scroll:** The page body must NEVER scroll horizontally. If content overflows, use `overflow-x-auto` (for tables/charts) or `flex-wrap` (for buttons/tags).
2.  **Button Safety:** Buttons must NEVER touch screen edges. Min margin: `mx-4` or `px-4`.
3.  **Text Safety:** Text inside buttons/cards must NEVER be cut off. Use `truncate` only if necessary, otherwise allow wrapping (`whitespace-normal` + `h-auto`).
4.  **Touch Targets:** Clickable elements must be at least 44px tall.

## 📋 PRECISE ACTION PLAN

### PHASE 1: Authentication (`/sign-in`, `/sign-up`)
- [ ] **Check Inputs:** On valid mobile (375px), inputs must be full width but with padding.
- [ ] **Check Submit Button:** Ensure it doesn't stick to the very bottom or sides. Add bottom padding to the container.
- [ ] **Social Buttons:** If there are "Sign in with Google" buttons, ensure they stack vertically on mobile, not squash horizontally.

### PHASE 2: App Layout (Sidebar & Header)
- [ ] **Mobile Header:** The hamburger menu button and User Avatar must NOT overlap the page title. Use `justify-between`.
- [ ] **Sidebar Sheet:** When opening the menu on mobile, ensure close button is accessible.

### PHASE 3: Dashboard & Content Pages (`/app`, `/app/team`, `/app/projects`)
- [ ] **Grid Audit:** Search for ALL `grid-cols-*`.
    -   *BAD:* `grid-cols-3`
    -   *FIX:* `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- [ ] **Flex Audit:** Search for `flex-row`.
    -   *CHECK:* If items inside are wide, change to `flex-col` on mobile (`flex-col sm:flex-row`).
- [ ] **Tables:** All `<Table>` components MUST be wrapped in `<div className="overflow-x-auto">`.
- [ ] **Cards:** Check `CardHeader` and `CardFooter`. Buttons inside headers often overflow. Stack them on mobile:
    ```tsx
    // Change this:
    <div className="flex justify-between">...</div>
    // To this:
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">...</div>
    ```

### PHASE 4: Specific Component Fixes
- **Dialogs/Modals:** Ensure content inside Modals is scrollable (`max-h-[80vh] overflow-y-auto`) so it doesn't get cut off on small phone screens.
- **Dropdowns:** Ensure they don't open "off-screen".

## 🚀 EXECUTION INSTRUCTION for AGENT
1.  **Scan** `app/(workspace)/app/team/page.tsx` specifically. The "Invite" form often breaks on mobile. Fix the inputs and buttons to stack vertically on small screens.
2.  **Scan** `components/app-header.tsx`. Ensure user name doesn't push the logout button off-screen.
3.  **Apply** these patterns to ALL pages.

**DO NOT** ask for permission. **DO NOT** just "look". **MODIFY CODE** to fix these issues immediately.
