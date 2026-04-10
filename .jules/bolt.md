## 2023-10-27 - [React Component Rendering Optimization]
**Learning:** O(n) array operations inside component bodies recalculate on every render, even when their inputs don't change, causing unnecessary CPU usage especially in lists.
**Action:** Use `useMemo` for filtering, mapping, and reducing large data arrays based on states or props, properly specifying the dependency arrays. Never modify or delete lockfiles like `package-lock.json` when adding optimizations.
