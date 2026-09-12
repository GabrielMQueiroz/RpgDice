## 2024-09-12 - Tab Accessibility
**Learning:** Adding explicit ARIA tab roles (`tablist`, `tab`, `tabpanel`) alongside keyboard focus styles drastically improves screen reader functionality for purely aesthetic custom tab layouts. The pairing ensures visual cues match auditory descriptions.
**Action:** For all custom tabs, apply the `role` structure and toggle `aria-selected` dynamically in JS. Combine this with explicit `focus-visible` ring styling to keep keyboard users in sync.
