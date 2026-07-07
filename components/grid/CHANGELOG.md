# Changelog

## 34.1.29 (2026-07-06)

### Data Grid

**Feature**
- **Infinite Scrolling:** Enables seamless data loading when the total record count is unknown by dynamically fetching additional data during scroll actions, without relying on pagination. This ensures a smooth and continuous scrolling experience for large datasets. View [Infinite Scrolling](https://react.syncfusion.com/react-ui/data-grid/scrolling/infinite-scroll/) demo.
- **Cell Selection:** Enables selection of individual cells within the Grid for granular data interaction. Supports single and multiple cell selection modes and integrates seamlessly with existing selection functionalities. View [Cell Selection](https://react.syncfusion.com/react-ui/data-grid/selection/cell-selection/) demo.
- **Column Chooser:** Provides an interactive interface to show or hide Grid columns dynamically, enabling users to customize the visible columns based on their preferences without affecting the underlying data. View [Column Chooser](https://react.syncfusion.com/react-ui/data-grid/columns/column-chooser/) demo.
- **PDF Export:** Enables exporting Grid data to PDF format while preserving layout, styling, and column structure for consistent document generation. View [PDF Export](https://react.syncfusion.com/react-ui/data-grid/pdf-export) demo.
- **Print:** Supports direct printing of Grid content with maintained formatting and structure for improved readability in printed output. View [Print](https://react.syncfusion.com/react-ui/data-grid/print) demo.
- **Grouping:** Allows organizing data into hierarchical groups based on column values for enhanced data visualization and analysis. View [Grouping](https://react.syncfusion.com/react-ui/data-grid/grouping/configuration) demo.
- **Conditional Selection:** Enables dynamic row selection based on custom conditions, providing greater control over user interaction. View [Conditional Selection](https://react.syncfusion.com/react-ui/data-grid/selection/conditional-selection) demo.
- **Master-Detail:** Supports hierarchical data representation by displaying related records within expandable detail rows. View [Master-Detail](https://react.syncfusion.com/react-ui/data-grid/master-detail/detail-grid) demo.
- **Cell Editing:** Enables in-place editing of individual cells for efficient and seamless data modification within the Grid. View [Cell Editing](https://react.syncfusion.com/react-ui/data-grid/editing/cell-editing) demo.
- **Immediate Filtering:** Provides real-time filtering in both Excel and Checkbox modes by applying filter conditions instantly. View [Excel Immediate Mode](https://react.syncfusion.com/react-ui/data-grid/filtering/excel-mode/?theme=material#excel-filter-with-immediate-mode) and [Checkbox Immediate Mode](https://react.syncfusion.com/react-ui/data-grid/filtering/checkbox-filtering/?theme=material#checkbox-filter-with-immediate-mode) demos.
- **Row and Column Spanning:** Supports merging of adjacent cells across rows and columns to enable advanced layout customization and improved data presentation. View [Row Spanning](https://react.syncfusion.com/react-ui/data-grid/row/row-spanning) and [Column Spanning](https://react.syncfusion.com/react-ui/data-grid/columns/column-spanning) demos.
- **Context Menu:** Provides a customizable right-click menu with built-in and custom actions to enhance user interaction within the Grid. View [Context Menu](https://react.syncfusion.com/react-ui/data-grid/context-menu) demo.

**Bug Fixes**

- **I1007744**: Resolved a React state update warning in `Next.js` during Grid component initialization by aligning state management with React life-cycle best practices.
- Resolved a script error occurring during initial rendering when `virtualizationSettings.scrollMode` is set to `ScrollMode.Virtual` by adding a safeguard to handle undefined `scrollModule` in the row generation logic
- Resolved an issue where Excel and Checkbox filtering failed with `UrlAdaptor` remote data binding due to unsupported `notEqual` operator casing that caused an HTTP 405 ("Method Not Allowed") error by updating the request to use the server-compatible `notequal` format ensuring consistent filter execution

## 33.1.44 (2026-03-16)

### Data Grid

**Features**

- **DOM `Virtualization` & Virtual Scrolling:** Enables efficient rendering of large datasets with improved performance and responsiveness. View [DOM `virtualization` configuration](https://react.syncfusion.com/react-ui/data-grid/scrolling/configuration/#dom-virtualization) & [Virtual Scrolling](https://react.syncfusion.com/react-ui/data-grid/scrolling/virtual-scroll/) demo.
- **Excel Mode & CheckBox Filtering:** Provides advanced filtering options with intuitive, checkbox-based selection. Try [Excel mode filtering](https://react.syncfusion.com/react-ui/data-grid/filtering/excel-mode/) & [CheckBox mode Filtering](https://react.syncfusion.com/react-ui/data-grid/filtering/checkbox-filtering/) demo.
- **Enhanced CheckBox Selection:** Supports multi-row selection, allowing users to select multiple rows efficiently using checkboxes. Try [CheckBox Selection](https://react.syncfusion.com/react-ui/data-grid/selection/checkbox-selection/) demo.

## 32.1.19 (2025-12-16)

### Data Grid

**Features**

- Added Command column line editing support, enabling CRUD actions directly through action buttons in the grid.
- Introduced `Popup` editing and customizable `Popup` template editing, allowing CRUD operations within internal or external forms.
- Enabled filter bar operator `popup` support, letting users select and apply different operators based on their needs.
- Added Checkbox selection, making it possible to select multiple rows efficiently using checkboxes.

## 31.1.17 (2025-09-05)

### Data Grid

The Syncfusion® React `Data Grid component` is a fast and feature-rich UI component built specifically for React. It enables high-performance data display in tabular formats and integrates smoothly into React applications. Supporting both local and remote data sources, it efficiently manages complex data operations while maintaining responsiveness and flexibility.

**Key features**

- **Editing** : Perform inline CRUD operations (add, edit, and delete) using toolbar actions, built-in methods, or keyboard shortcuts for a seamless editing experience.

- **Paging** : Efficiently handle large datasets with built-in pagination. Supports both client-side and server-side paging strategies to optimize performance.

- **Filtering** : Includes a filter bar with customizable UI for selected columns. Features numeric input fields for number columns, date pickers for date columns, and text boxes that support both string and numeric expressions.

- **Sorting** : Sort data by clicking column headers, with support for multi-column sorting.

- **Searching** : Quickly search data using a toolbar-integrated search box.

- **Toolbar** : Customizable toolbar with built-in actions such as Add, Edit, Delete, and Search.

- **Customization** : Supports custom styling, icons, images, and component injection within content and header cells to enhance flexibility and visual presentation.

- **Accessibility and Keyboard** : Fully compliant with WCAG 2.1 standards, offering robust screen reader and keyboard navigation support.

- **Globalization** : Automatically adapts dates, numbers, and text formats for global audiences.
