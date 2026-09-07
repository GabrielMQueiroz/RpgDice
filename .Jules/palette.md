## 2024-03-24 - Screen Reader Support for Dynamic UI Updates
**Learning:** Screen readers won't automatically read out dynamic UI updates that happen without a page reload (like rolling a dice and displaying the result on the same page).
**Action:** Always add `aria-live="polite"` and `aria-atomic="true"` to regions of the page where dynamic but important information is updated synchronously (like dice rolls, error messages, or form submission results) so screen readers are notified of the changes immediately.
