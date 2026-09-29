# Changelog

## 34.1.29 (2026-09-28)

### TreeView

The TreeView component renders structured node collections as an expandable, navigable list. It supports both local arrays and remote `DataManager` data sources, controlled and uncontrolled expansion and selection, multiple selection modes, tri-state checkboxes, inline label editing, and rich keyboard interaction for accessibility.

  **Key features**

  - **Hierarchical Data Binding:** Render nested trees from a `children` field, a self-referential `parentId` field, or a remote `DataManager` with a `Query` and lazy-loaded children.
  - **Custom Field Mapping:** Map any `dataSource` property names to the TreeView fields (`id`, `label`, `children`, `parentId`, `disabled`, `icon`, `hasChildren`, `tooltip`, `navigateUrl`, and more) using the `fields` prop.
  - **Selection Modes:** Choose between `None`, `Single`, `Multiple`, or `Checkbox` selection. Checkbox mode supports tri-state checkboxes with optional cascading to descendants and disabled-children participation via `autoCheck` and `checkDisabledChildren`.
  - **Expansion Control:** Expand on `Click`, `DoubleClick`, or `None`, and drive the expanded set through `expandedIds` (controlled) or `defaultExpandedIds` (uncontrolled).
  - **Inline Editing:** Enable `editable` to let users rename nodes in place. The `onNodeEdit` callback receives the old and new label and can return `false` to reject the change. A `TreeViewEditInput` slot is provided for full editor customization.
  - **Sorting and Empty State:** Sort siblings with `sortOrder` and render a custom `TreeViewEmptyState` when the resolved list is empty.
  - **Row Templates:** Replace the default row rendering with a `TreeViewNodes` render-prop child, or compose individual parts using `TreeViewItemIcon`, `TreeViewItemLabel`, `TreeViewItemToggle`, and `TreeViewItemCheckbox`.
  - **Keyboard Navigation:** Comprehensive keyboard support for accessibility, including arrow keys to move focus, Home/End for first/last, Enter/Space to select, and F2 to begin editing.

### Sidebar

The Sidebar component renders a collapsible drawer for navigation and custom content. It supports left/right anchoring, push/over interaction modes, optional backdrop, configurable transitions, and a dockable compact state for responsive layouts.

  **Key features**

  - **Positioning:** Anchor the sidebar to either the `Left` or `Right` edge of the viewport to fit different navigation patterns.
  - **Interaction Modes:** Choose between `Over` (floats above content) and `Push` (shifts main content) modes to control how the sidebar coexists with surrounding content.
  - **Backdrop Overlay:** Render an optional backdrop when the sidebar is open to focus attention and intercept outside interactions.
  - **Configurable Transitions:** Customize the enter and exit transition durations independently for smooth, polished animations.
  - **Dockable State:** Collapse the sidebar into a compact docked state that remains visible, configurable via a `dockableWidth` value.
  - **Responsive Media Queries:** Drive the sidebar's open/closed state automatically based on a media query for adaptive layouts.
  - **Controlled and Uncontrolled State:** Manage visibility through `open`/`onOpenChange` for controlled usage or `defaultOpen` for uncontrolled usage.
  - **Composite Layout API:** Pair the sidebar with `SidebarLayout`, `SidebarMain`, and `SidebarTrigger` components to coordinate drawer, content area, and toggle button.
  - **Outside Click Handling:** Automatically close the sidebar when clicking outside, configurable via `closeOnDocumentClick`.

## 34.1.29 (2026-07-06)

### Menu

The Menu component is a layout navigation menu with support for hierarchical menu items. It provides powerful control over menu interactions, customization options, and displays context-specific actions with nested submenus.

  **Key features**

  - **Hierarchical Structure:** Create nested menus with unlimited nesting levels, allowing for organization of related menu items and commands.
  - **Flexible Orientation:** Configure the menu in either horizontal or vertical layout to fit different UI design requirements and navigation patterns.
  - **Icon Support:** Enhance visual recognition by adding icons to menu items using CSS classes or React components (SVG).
  - **Submenu Rendering Modes:** Choose between inline and portal rendering modes:
    - **Inline**: Submenu is rendered inline within the parent menu item
    - **Portal**: Submenu is rendered in the document body for advanced positioning control
  - **Interaction Modes:** Support for both hover-based and click-based submenu opening with customizable hover delay.
  - **Animation Effects:** Choose from various animation effects like FadeIn, SlideDown, ZoomIn, and None to control how the menu appears.
  - **Keyboard Navigation:** Comprehensive keyboard support for accessibility, including arrow keys for navigation, Enter for selection, and Escape to close menus.

### Context Menu

#### Features

- **Custom Container Rendering:** The ContextMenu component supports rendering within a custom container using the `container` prop, allowing better control over positioning context and element scoping instead of rendering to the document body.

#### Breaking Changes

- The `items` and `itemTemplate` props are removed. Use the composite pattern by passing custom elements to the `children` of `MenuItem` component instead for building menu items and customizing their appearance.
- The `ContextMenuSelectEvent` event interface has been renamed to `MenuSelectEvent` for consistency across menu components.

## 32.2.3 (2026-02-05)

### Context Menu

#### Bug Fixes

- Fixed an issue where sample states were not updated in the `onOpen` event callback of the ContextMenu component.

## 31.1.17 (2025-09-05)

### Context Menu

#### Breaking Changes

- The `onSelect` event callback now uses `ContextMenuSelectEvent` type instead of the `MenuEvent` type for better type safety and component-specific event handling.
- The `MenuAnimationProp` interface has been renamed to `MenuAnimationProps`.
- The `offset` property type has been changed from `{ left: number; top: number }` to `OffsetPosition`.

## 30.1.37 (2025-06-25)

### Context Menu

The ContextMenu component displays a menu with options when triggered by a right-click or custom event. It provides a powerful way to offer context-specific actions with support for nested submenus, icons, and various customization options.

  **Key features**

  - **Icon Support:** Enhance visual recognition by adding icons to menu items using CSS classes or React components (SVG).
  - **Separator Items:** Visual grouping of related menu items using separator lines.
  - **Nested Submenus:** Create hierarchical menu structures with unlimited nesting levels, allowing for organization of related commands and options.
  - **Custom Positioning:** Control the exact position of the context menu using offset coordinates or automatic positioning relative to the target element.
  - **Template Customization:** Create fully customized menu item displays using React components as templates for advanced UI requirements.
  - **Animation Effects:** Choose from various animation effects like FadeIn, SlideDown, and ZoomIn to control how the menu appears.
  - **Keyboard Navigation:** Comprehensive keyboard support for accessibility, including arrow keys for navigation, Enter for selection, and Escape to close menus.
  
  
### Toolbar

The Toolbar component helps users efficiently organize and access frequently used actions through a compact and customizable interface. It offers multiple overflow handling modes to accommodate different UI requirements and screen sizes.

  **Key features**

  - **Flexible Item Layout:** Supports toolbar items, separators, and spacers for organized grouping of actions.
  - **Multiple Overflow Modes:** Choose from four different handling strategies when toolbar items exceed the available space:
    - **Scrollable**: Maintains overflow items with scrolling
    - **Popup**: Moves overflow items to a popup menu accessed via an expand button
    - **MultiRow**: Wraps overflow items to additional rows within the toolbar
    - **Extended**: Hides overflow items in a secondary row accessible through an expand button
  - **Orientation Options:** Configure the toolbar in either horizontal or vertical layout to fit different UI design requirements.
  - **Keyboard Navigation:** Comprehensive keyboard accessibility with arrow key navigation, Home/End for first/last item access, and Tab for focus management.
