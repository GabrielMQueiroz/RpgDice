## 2026-09-16 - Add aria-live for dynamically toggled sections
**Learning:** Dynamically shown or updated content, like a dice roll result that appears after a button click, must use an `aria-live` region so screen readers reliably announce the new information.
**Action:** When adding or modifying interactive components that reveal hidden feedback or results, wrap the output container with `aria-live="polite"` and `aria-atomic="true"`.
