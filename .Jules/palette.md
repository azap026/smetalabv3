## 2026-01-28 - Interactive Element Accessibility
**Learning:** Adding new interactive elements (like a password toggle button) requires explicit focus management. Using `focus:outline-none` without a replacement `focus-visible` ring creates a barrier for keyboard users.
**Action:** Always verify keyboard navigation and focus visibility for any new button or input, ensuring `focus-visible` styles are consistent with the design system.

## 2026-02-18 - Semantic Elements for Interactive Lists
**Learning:** Using `div` with `onClick` for interactive list items (like notifications) creates a keyboard trap. Screen readers and keyboard users cannot easily access or activate these elements.
**Action:** Always use `<button>` (or `<a>` if navigation) for interactive list items, applying `w-full text-left` to maintain the list-like appearance while preserving accessibility.
