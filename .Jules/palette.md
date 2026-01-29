## 2026-01-28 - Interactive Element Accessibility
**Learning:** Adding new interactive elements (like a password toggle button) requires explicit focus management. Using `focus:outline-none` without a replacement `focus-visible` ring creates a barrier for keyboard users.
**Action:** Always verify keyboard navigation and focus visibility for any new button or input, ensuring `focus-visible` styles are consistent with the design system.

## 2026-01-29 - List Item Interactivity
**Learning:** List items that perform actions (like "mark as read") are often implemented as `div`s with `onClick`, blocking keyboard users.
**Action:** Convert interactive list items to `<button>` elements with `w-full text-left` and proper focus styles (`focus-visible:ring-2`) to ensure keyboard accessibility without breaking layout.
