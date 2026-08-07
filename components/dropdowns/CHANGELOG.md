# Changelog

## 34.1.29 (2026-07-06)

### MultiSelect

**Features**

- **Grouped Checkbox Support:** The MultiSelect component includes checkboxes in group headers, making it easy to select or clear all items in a group at once for faster bulk selection.

- **Selection Order Support:** The MultiSelect component keeps selected items grouped at the top of the list when checkbox selection is enabled, making current selections easier to review and manage.

- **Helper Text Support:** The MultiSelect component supports a `helperText` prop, allowing to display descriptive or instructional text below the input field for improved user guidance and accessibility.
- This helper text support is also available for Autocomplete, ComboBox, and Dropdown List components, enabling consistent contextual messaging across all input fields.

## 33.2.3 (2026-04-21)

### Autocomplete

**Features**

- **Adornments Support:** The Autocomplete component supports `prefix` and `suffix` props, allowing to display custom icons or elements at the start and end of the input field for enhanced customization and usability.
- This adornment support is also available for ComboBox, MultiSelect, and Dropdown List components, enabling consistent UI customization across all dropdown input fields.

## 33.1.44 (2026-03-16)

### Dropdown List

#### Bug Fixes

- `#I820104` - Fixed an issue where the dropdown filter input loses focus when pressing the Space key.

### Autocomplete
 
**Features**
 
- **Helper Text Support:** The Autocomplete component supports a `helperText` prop, allowing to display descriptive or instructional text below the input field for improved user guidance and accessibility.
- This helper text support is also available for ComboBox, MultiSelect, and Dropdown List components, enabling consistent contextual messaging across all input fields.

## 33.2.3 (2026-04-21)

### Autocomplete

**Features**

- **Adornments Support:** The Autocomplete component supports `prefix` and `suffix` props, allowing to display custom icons or elements at the start and end of the input field for enhanced customization and usability.
- This adornment support is also available for ComboBox, MultiSelect, and Dropdown List components, enabling consistent UI customization across all dropdown input fields.

## 33.1.44 (2026-03-16)

### Dropdown List

#### Bug Fixes

- `#I820104` - Fixed an issue where the dropdown filter input loses focus when pressing the Space key.

### Autocomplete

The React Autocomplete component is a compact, accessible single-input control that provides typed suggestions as users enter text. It supports local or remote data, autofill and highlighting, customizable rendering, and full keyboard navigation for quick, accurate entry in forms and search flows.

Explore the demo <a href="https://react.syncfusion.com/react-ui/autocomplete" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Type-to-Suggest:** Show matching suggestions as the user types with configurable `minLength` and `debounce`.
- **Autofill & Highlighting:** Optional autofill of the first match and visual highlighting of matched text.
- **Custom Templates:** Customize suggestion items and input value rendering.
- **Controlled/Uncontrolled:** Use value/defaultValue patterns for managed or unmanaged usage.
- **Local & Remote Data:** Bind arrays or remote data sources with fields mapping and query support.
- **Keyboard & Accessibility:** Complete keyboard navigation, `Enter` to commit, and accessible (ARIA) behaviour.
- **Custom Values:** Allow free-form/custom values with an `onCustomValueSelect` callback.
- **Performance:** Filtering, virtualization, and debounce for large datasets.

### ComboBox

The React ComboBox component combines a text input with a dropdown list to let users type to search or pick a single option. It includes filtering, optional custom values, templating, and icon support, making it suitable for compact single-select scenarios in forms and toolbars.

Explore the demo <a href="https://react.syncfusion.com/react-ui/combobox" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Hybrid Input + List:** Search-enabled list with a selectable popup and optional dropdown icon.
- **Filtering:** Built-in filtering modes (StartsWith/Contains) with debounce for responsive UX.
- **Custom Values:** Accept and commit free-form input when enabled.
- **Custom Templates:** Item and value templates for rich visual presentation.
- **Controlled/Uncontrolled:** value/defaultValue usage for flexible state management.
- **Data Binding:** Works with local arrays or remote data, supports fields mapping and queries.
- **Accessibility & Keyboard:** Full keyboard support and ARIA attributes for screen readers.
- **Virtualization & Performance:** Handles large lists efficiently with virtualization and sorting.

### MultiSelect

The React MultiSelect component enables selection of multiple options from a list with tag/chip or delimiter display. It supports filtering, select-all, checkboxes, custom templates, and flexible display modes for dense forms and tag-based inputs.

Explore the demo <a href="https://react.syncfusion.com/react-ui/multiselect" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Multiple Selection Modes:** Tags/chips or delimiter display, plus checkbox mode for bulk selection.
- **Tag/Chip Templates:** Customize tag appearance and behaviour, including `chipTemplate` and delete handlers.
- **Select All / Clear:** Optional `Select All` / `Unselect All` controls and corresponding callbacks.
- **Filtering & Search:** Instant filtering with configurable filter modes and debounce delay.
- **Maximum Selection & Hiding:** Limit selections via `maximumSelectionLength` and `hideSelectedItem` option.
- **Custom Values:** Accept custom entries and expose `onCustomValueSelect`.
- **Performance:** Virtualization, efficient rendering for large datasets, and server-side querying.
- **Accessibility:** Keyboard navigation, accessible features (ARIA), and configurable open/close behaviour.

### Dropdown List

**Features**

The Dropdown List now includes virtualization to efficiently render very large datasets by only mounting visible items. This reduces memory usage, improves rendering and scroll performance for long lists.

## 32.1.19 (2025-12-16)

### Dropdown List

The React Dropdown List component is a compact, accessible single-select input that combines a text box with a popup list. It supports fast data binding, search and filtering, grouping, and full keyboard navigation. With localization, RTL, and rich templating, it fits everything from simple forms to enterprise dashboards.

Explore the demo <a href="https://react.syncfusion.com/react-ui/dropdown-list" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Popup List:** Open/close an options overlay for quick selection.
- **Search & Filtering:** Search-enabled list with built-in filtering for large lists.
- **Controlled/Uncontrolled:** Use `value` or `defaultValue` to manage state.
- **Data Binding:** Bind arrays or remote data with fields mapping.
- **Grouping & Sorting:** Organize options with group headers and ordered lists.
- **Custom Templates:** Customize items, value display, and headers/footers.
- **Localization & RTL:** Locale-aware text with right-to-left support.
- **Keyboard & Accessibility:** Arrow navigation, Enter to select, and accessible (ARIA) behaviour.
