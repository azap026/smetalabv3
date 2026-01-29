## 2026-01-28 - Interactive Element Accessibility
**Learning:** Adding new interactive elements (like a password toggle button) requires explicit focus management. Using `focus:outline-none` without a replacement `focus-visible` ring creates a barrier for keyboard users.
**Action:** Always verify keyboard navigation and focus visibility for any new button or input, ensuring `focus-visible` styles are consistent with the design system.
