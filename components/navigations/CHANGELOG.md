# Changelog

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
