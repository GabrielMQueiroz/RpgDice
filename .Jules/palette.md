## 2024-05-24 - Custom Tab Accessibility
**Learning:** Custom interactive components like tabs in this application often rely purely on visual class toggles (`.active`, colors) and completely miss native semantic states. This makes them effectively invisible/unusable to screen readers and difficult to navigate for keyboard users.
**Action:** When working with custom navigation elements (tabs, toggles), always explicitly add ARIA roles (`tablist`, `tab`, `tabpanel`), `aria-selected`/`aria-controls` states, and ensure keyboard focus indicators (e.g., `focus-visible:ring-2`) are present.
