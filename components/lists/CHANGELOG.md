# Changelog

## 33.1.44 (2026-03-16)

### ListView

The React ListView component renders a flexible, accessible list UI that supports multiple data sources (plain arrays or `DataManager`), field mappings, grouping and sorting, templates for items and group headers, optional header/footer content, virtualization for large lists, and scroll/data lifecycle events. It is designed for high-performance scenarios (virtualization + windowed rendering) while providing templating hooks and a small public API surface for integration via refs.

**Key features**

- **Flexible Data Sources:** Accepts arrays of primitives/objects or a `DataManager` with `Query` support for remote operations.
- **Field Mapping:** `fields` mapping merges with sensible defaults to map `id`, `text`, `icon`, `imageUrl`, `groupBy`, and more.
- **Templates:** `itemTemplate`, `groupTemplate`, `headerTemplate`, and `footerTemplate` for complete visual customization.
- **Grouping & Sorting:** Group items by a field and control sort behavior with `sortOrder` and `fields.sortBy`.
- **Virtualization & Performance:** Windowed rendering with `virtualization` props and scroll request callback for very large data sets.
- **Data Events:** `onDataRequest` and `onDataLoad` hooks for request/response lifecycle; `onScroll` for virtualization-aware scrolling.
- **Accessibility & RTL:** Supports provider `dir` (RTL) and includes focus/interaction-friendly structure.
- **Disabled State:** Disable user interactions via the `disabled` prop.

Explore the demo <a href="https://react.syncfusion.com/listview" target="_blank" rel="noopener noreferrer">here</a>
