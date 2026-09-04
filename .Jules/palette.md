## 2024-09-04 - Screen Reader Announcements for Dynamic Updates
**Learning:** For interactive tools like a dice roller, visual updates to numbers aren't automatically announced by screen readers, making the core functionality inaccessible to visually impaired users.
**Action:** Always add `aria-live="polite"` and `aria-atomic="true"` to containers that display dynamic results of user actions, ensuring the updated content is announced smoothly.
