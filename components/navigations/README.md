# Syncfusion React Navigation Components

The Syncfusion React Navigations package provides a collection of UI components for building modern, interactive React applications. It includes the `Toolbar`, `ContextMenu`, `Menu`, `TreeView`, `Sidebar`, and `Accordion` components for organizing commands, rendering hierarchical data, managing navigation drawers, and building collapsible content sections.

## Setup

```sh
npm install @syncfusion/react-navigations
```
Apply a theme by installing the corresponding theme package and importing its styles, for example with the [Material theme](https://www.npmjs.com/package/@syncfusion/react-material-theme):

```sh
npm install @syncfusion/react-material-theme
```

```css
/* App.css */
@import '../node_modules/@syncfusion/react-material-theme/styles/context-menu/index.css';
```
> Note: For other components, use their corresponding index.css files from their respective style folders

## React Context Menu

The `ContextMenu` component displays a popup menu of context-specific actions when a target element is right-clicked or long-pressed.

### Key Features

- **[Target Binding](https://react.syncfusion.com/react-ui/context-menu/#getting-started):** Associate the menu with a specific element through the `targetRef` prop, which determines where the pointer-triggered menu opens and displays, with options composed from `MenuItem` children.

- **[Custom Icons and Composition](https://react.syncfusion.com/react-ui/context-menu/#custom-icons):** Build rich, nested items to unlimited depth by composing `MenuItemIcon`, `MenuItemLabel`, `MenuSeparator`, and `MenuItemLink` inside `MenuItem` for icons, custom content, dividers, and link navigation.

- **[Animation Effects](https://react.syncfusion.com/react-ui/context-menu/#animation-effects):** Control how the menu appears with the `animation` property, supporting `FadeIn`, `ZoomIn`, and `SlideDown`, each with configurable `duration` and `easing`.

- **[Scrollable Menu](https://react.syncfusion.com/react-ui/context-menu/#scrollable-menu):** Render large, data-heavy menus efficiently through a recursive item loop, constrained with `className` and CSS to scroll when content exceeds the default 500px height.

- **[Action Menu and Controlled Visibility](https://react.syncfusion.com/react-ui/context-menu/#action-menu):** Process user selections with the `onSelect` callback and drive menu visibility directly through the controlled `open` and `onClose` pattern.

- **[Keyboard Navigation](https://react.syncfusion.com/react-ui/context-menu/#keyboard-interaction):** Follows the WAI-ARIA menubar pattern, with arrow keys to move focus, `Enter`/`Space` to select, `Right`/`Left` arrows to open and close submenus, and `Esc` to dismiss.

**Usage**

```tsx
import { useRef } from "react";
import { ContextMenu, MenuItem, MenuItemLabel } from "@syncfusion/react-navigations";

export default function App() {
  const targetRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button ref={targetRef}>Right click me</button>
      <ContextMenu targetRef={targetRef as React.RefObject<HTMLElement>}>
        <MenuItem><MenuItemLabel>Cut</MenuItemLabel></MenuItem>
        <MenuItem><MenuItemLabel>Copy</MenuItemLabel></MenuItem>
        <MenuItem><MenuItemLabel>Rename</MenuItemLabel></MenuItem>
      </ContextMenu>
    </div>
  );
}
```

**Resources**

- [Context Menu Demo/Docs](https://react.syncfusion.com/react-ui/context-menu/)
- [Context Menu API](https://react.syncfusion.com/api/context-menu/overview/)

## React Menu

The `Menu` component renders a hierarchical navigation menu for commands and application navigation, in horizontal or vertical layouts.

### Key Features

- **[Hierarchical Structure](https://react.syncfusion.com/react-ui/menu/#nested-menu):** Create nested submenus of unlimited depth by placing `MenuItem` components inside another `MenuItem` for file explorers, document menus, and application command groups.

- **[Flexible Orientation](https://react.syncfusion.com/react-ui/menu/#navigation-menu):** Render as a horizontal navigation menubar or an application-level vertical menu by setting the `orientation` property to `Horizontal` or `Vertical`.

- **[URL Navigation](https://react.syncfusion.com/react-ui/menu/#url-navigation):** Enable items to open internal routes or external pages through the `MenuItemLink` component, which wraps a menu item as a navigational link.

- **[Custom Item Content](https://react.syncfusion.com/react-ui/menu/#menu-item-types):** Compose rich item layouts inside `MenuItem` using `MenuItemIcon` and `MenuItemLabel`, and apply separators, disabled states, and custom classes per item.

- **[Hover Delay and Click Opening](https://react.syncfusion.com/react-ui/menu/#hover-delay):** Prevent accidental activation in dense menus with the `hoverDelay` property, or switch to touch-friendly click-to-open behavior with `itemOnClick`.

- **[Animation Effects](https://react.syncfusion.com/react-ui/menu/#animation-effects):** Provide visual feedback when submenus appear through the `animation` property, supporting `None`, `FadeIn`, `ZoomIn`, and `SlideDown` with configurable duration and easing.

- **[Keyboard Navigation](https://react.syncfusion.com/react-ui/menu/#keyboard-interaction):** Follows the WAI-ARIA menubar pattern, with `Enter`/`Space` to select or open, arrow keys to move between items and into submenus, `Home`/`End` for first and last, and `Esc` to close.

**Usage**

```tsx
import { Menu, MenuItem, MenuItemIcon, MenuItemLabel } from "@syncfusion/react-navigations";
import { CutIcon } from "@syncfusion/react-icons";

export default function App() {
  return (
    <Menu>
      <MenuItem>
        <MenuItemIcon><CutIcon /></MenuItemIcon>
        <MenuItemLabel>File</MenuItemLabel>
        <MenuItem><MenuItemLabel>New</MenuItemLabel></MenuItem>
        <MenuItem><MenuItemLabel>Open</MenuItemLabel></MenuItem>
      </MenuItem>
      <MenuItem><MenuItemLabel>Edit</MenuItemLabel></MenuItem>
    </Menu>
  );
}
```

**Resources**

- [Menu Demo/Docs](https://react.syncfusion.com/react-ui/menu/)
- [Menu API](https://react.syncfusion.com/api/menu/overview/)

## React Toolbar

The `Toolbar` component arranges buttons, inputs, and custom elements in a compact horizontal or vertical layout for quick access to frequently used actions.

### Key Features

- **[Organizational Components](https://react.syncfusion.com/react-ui/toolbar/#tools):** Compose the toolbar from `ToolbarItem`, which wraps individual elements, `ToolbarSeparator` to divide related groups with a dividing line, and `ToolbarSpacer` to add expandable empty space that pushes items to opposite edges.

- **[Multiple Overflow Modes](https://react.syncfusion.com/react-ui/toolbar/#multirow-mode):** Handle items that exceed the available width through the `overflowMode` property, with `Scrollable` for navigation-button scrolling, `MultiRow` to wrap into additional rows, `Popup` to move overflow items behind an expand button, and `Extended` to open a full-width secondary row.

- **[Scroll Step Customization](https://react.syncfusion.com/react-ui/toolbar/#scrollable-mode):** In `Scrollable` mode, the `scrollStep` property defines the scrolling distance in pixels applied when the user navigates items using the navigation buttons.

- **[Orientation](https://react.syncfusion.com/react-ui/toolbar/#orientation):** Render in `Horizontal` (default) or `Vertical` layout by setting the `orientation` property, which changes the arrangement from left-to-right to top-to-bottom for side panels and tool groups.

- **[Keyboard Navigation](https://react.syncfusion.com/react-ui/toolbar/#keyboard-interaction):** Follows the WAI-ARIA toolbar pattern with arrow-key focus movement, `Home`/`End` for first and last items, `Enter` to open the overflow popup in `Popup` and `Extended` modes, and `Esc` to close it.

**Usage**

```tsx
import { Toolbar, ToolbarItem, ToolbarSeparator, ToolbarSpacer, OverflowMode } from "@syncfusion/react-navigations";
import { Button, Variant, Color } from "@syncfusion/react-buttons";

export default function App() {
  return (
    <Toolbar aria-label="Formatting tools" overflowMode={OverflowMode.Popup}>
      <ToolbarItem><Button variant={Variant.Standard}>Cut</Button></ToolbarItem>
      <ToolbarItem><Button variant={Variant.Standard}>Copy</Button></ToolbarItem>
      <ToolbarItem><Button variant={Variant.Standard}>Paste</Button></ToolbarItem>
      <ToolbarSeparator />
      <ToolbarSpacer />
      <ToolbarItem><Button variant={Variant.Filled} color={Color.Primary}>Help</Button></ToolbarItem>
    </Toolbar>
  );
}
```

**Resources**

- [Toolbar Demo/Docs](https://react.syncfusion.com/react-ui/toolbar/)
- [Toolbar API](https://react.syncfusion.com/api/toolbar/overview/)

## React Sidebar

The `Sidebar` component renders a collapsible drawer for navigation and custom content, anchorable to either edge of the page and composable with a coordinated layout.

### Key Features

- **[Positioning and Interaction Modes](https://react.syncfusion.com/react-ui/sidebar/#sidebar-configuration):** Anchor the sidebar to the `Left` or `Right` side of the page with the `position` property, and control how the drawer coexists with surrounding content using the `mode` property, where `Push` shifts the main content and `Over` displays the sidebar above it.

- **[Controlled and Uncontrolled Modes](https://react.syncfusion.com/react-ui/sidebar/#controlled-and-uncontrolled-modes):** Own the open state with the `open` property and `onOpenChange` callback in controlled mode, or set the initial state with `defaultOpen` and let the component manage transitions internally.

- **[Backdrop and Outside Click Handling](https://react.syncfusion.com/react-ui/sidebar/#uncontrolled-mode):** Render a translucent overlay with the `backdrop` property to focus attention, and close the drawer on outside clicks with the `closeOnDocumentClick` property.

- **[Dockable State](https://react.syncfusion.com/react-ui/sidebar/#dockable-sidebar):** Keep a compact navigation rail visible when collapsed with the `dockable` property, whose width is set by `dockableWidth`, preserving access to navigation icons.

- **[Multiple Sidebars](https://react.syncfusion.com/react-ui/sidebar/#multiple-sidebars):** Render more than one `Sidebar` in a single layout to provide primary navigation alongside contextual, settings, or additional information panels.

- **[Composite Layout API](https://react.syncfusion.com/react-ui/sidebar/#adding-the-sidebar-component):** Pair the sidebar with `SidebarLayout` and `SidebarMain` to coordinate the drawer, the primary content, and a `SidebarTrigger` toggle button within the page structure.

**Usage**

```tsx
import { useState } from "react";
import { Sidebar, SidebarLayout, SidebarMain, SidebarTrigger } from "@syncfusion/react-navigations";

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <SidebarLayout>
      <Sidebar open={open} onOpenChange={(e) => setOpen(e.open)} style={{ width: 250 }}>
        <nav>
          <ul>
            <li>Dashboard</li>
            <li>Projects</li>
            <li>Settings</li>
          </ul>
        </nav>
      </Sidebar>
      <SidebarMain>
        <SidebarTrigger aria-label="Toggle navigation">☰</SidebarTrigger>
        <div>Dashboard content</div>
      </SidebarMain>
    </SidebarLayout>
  );
}
```

**Resources**

- [Sidebar Demo/Docs](https://react.syncfusion.com/react-ui/sidebar/)
- [Sidebar API](https://react.syncfusion.com/api/sidebar/overview/)

## React TreeView

The `TreeView` component renders hierarchical data as an expandable, navigable tree, supporting flat and nested sources with configurable selection, expansion, and inline editing.

### Key Features

- **[Hierarchical Data Binding](https://react.syncfusion.com/react-ui/tree-view/#hierarchical-data-binding):** Bind to nested data by mapping the `fields` property to `id`, `label`, `children`, and `parentId`, so the tree renders nodes from a `children` field or a self-referential `parentId` field.

- **[Remote Data and Lazy Loading](https://react.syncfusion.com/react-ui/tree-view/#remote-data):** Load a flat record list from a remote `DataManager` through the `data` property, and defer child fetching until a row is expanded using the `fields.hasChildren` mapping.

- **[Selection Modes](https://react.syncfusion.com/react-ui/tree-view/#selection):** Choose how rows respond to interaction with the `selectionMode` property, supporting `Single`, `Multiple`, `Checkbox`, and `None` to match the workflow.

- **[Tri-State Checkboxes](https://react.syncfusion.com/react-ui/tree-view/#checkbox):** In `Checkbox` mode, cascade the check state to descendants and update parent states with `autoCheck`, and toggle the checkbox on row click with `checkOnClick` for faster bulk selection.

- **[Controlled and Uncontrolled Expansion](https://react.syncfusion.com/react-ui/tree-view/#controlled-vs-uncontrolled):** Own the expanded set with `expandedIds` and `onExpandedChange` in controlled mode, or seed the initial state with `defaultExpandedIds` and let the component manage later changes internally.

- **[Expansion Trigger](https://react.syncfusion.com/react-ui/tree-view/#expansion):** Set the user action that toggles a row through the `expandOn` property, accepting `Click`, `DoubleClick`, or `None`, and make the whole row the interaction surface with `fullRowSelect`.

- **[Sorting and Editing](https://react.syncfusion.com/react-ui/tree-view/#editing):** Sort siblings at every level with `sortOrder`, and enable inline renaming with `editable`, where `onNodeEdit` validates the change and a `TreeViewEditInput` slot customizes the editor.

- **[Row Templates](https://react.syncfusion.com/react-ui/tree-view/#custom-rendering):** Replace default rendering with the `TreeViewNodes` render-prop, or compose `TreeViewItemLabel`, `TreeViewItemIcon`, `TreeViewItemToggle`, and `TreeViewItemCheckbox` to match a design system; rows can also carry a link target and tooltip through `fields`.

- **[Keyboard Navigation](https://react.syncfusion.com/react-ui/tree-view/#keyboard-interaction):** Follows the WAI-ARIA tree pattern, with arrow keys to move and expand, `Home`/`End` for first and last, `Enter`/`Space` to activate, `Esc` to cancel editing, and `F2` to open the inline editor.

**Usage**

```tsx
import { TreeView } from "@syncfusion/react-navigations";

interface Node { id: string; label: string; parentId?: string | null; }

export default function App() {
  const data: Node[] = [
    { id: "1", label: "Documents" },
    { id: "2", label: "Reports", parentId: "1" },
    { id: "3", label: "Invoices", parentId: "1" },
    { id: "4", label: "Downloads" },
    { id: "5", label: "Pictures" }
  ];
  return <TreeView data={data} defaultExpandedIds={["1"]} />;
}
```

**Resources**

- [Tree View Demo/Docs](https://react.syncfusion.com/react-ui/tree-view/)
- [Tree View API](https://react.syncfusion.com/api/tree-view/overview/)

## React Accordion

The `Accordion` component renders a vertically stacked list of collapsible panels, each pairing a header with a content region, with single or multi-open behavior and controlled and uncontrolled value support.

### Key Features

- **[Composite Parts](https://react.syncfusion.com/react-ui/accordion/#getting-started):** Compose each section from `AccordionPanel`, `AccordionHeader`, `AccordionTrigger`, `AccordionIndicator`, and `AccordionContent` to control the structure, clickable surface, state icon, and body of every panel.

- **[Single and Multi-Open Modes](https://react.syncfusion.com/react-ui/accordion/#multiple-open):** Toggle the `multiple` property to allow several panels open at once, or keep the classic single-open behavior where opening one section closes the others.

- **[Controlled and Uncontrolled Values](https://react.syncfusion.com/react-ui/accordion/#controlled):** Own the active set with the `value` and `onChange` callback for controlled state, or seed the initial open panels with `defaultValue` and let the component manage later changes internally.

- **[Focus-Open Behavior](https://react.syncfusion.com/react-ui/accordion/#multiple-open):** Enable `openOnFocus` so a panel expands automatically when its header receives keyboard focus, without requiring an additional activation step.

- **Panel Mount Strategies:** Choose how panel content is mounted through the `renderMode` property, with `Active` (default) keeping only expanded panels in the tree, `Retained` mounting on first expansion, and `All` mounting every panel on initial render.

- **[Disabled Panels and Borderless Layout](https://react.syncfusion.com/react-ui/accordion/#disabled-item):** Mark individual sections as non-interactive through the `disabled` prop on `AccordionPanel`, and remove the dividers with `borderless` for a flush, edge-to-edge layout.

- **[Keyboard Navigation](https://react.syncfusion.com/react-ui/accordion/#keyboard-interaction):** Follows the WAI-ARIA accordion pattern with `ArrowUp`/`ArrowDown` to move between headers, `Home`/`End` for first and last, and `Enter`/`Space` to expand or collapse the focused panel.

**Usage**

```tsx
import { Accordion, AccordionPanel, AccordionHeader, AccordionTrigger, AccordionIndicator, AccordionContent } from "@syncfusion/react-navigations";

export default function App() {
  return (
    <Accordion defaultValue={["service"]}>
      <AccordionPanel value="service">
        <AccordionHeader>
          <AccordionTrigger>What is this service about? <AccordionIndicator /></AccordionTrigger>
        </AccordionHeader>
        <AccordionContent>
          Service details…
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  );
}
```

**Resources**

- [Accordion Demo/Docs](https://react.syncfusion.com/react-ui/accordion/)
- [Accordion API](https://react.syncfusion.com/api/accordion/overview/)

<p align="center">
Trusted by the world's leading companies
  <a href="https://www.syncfusion.com/">
    <img src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/syncfusion/syncfusion-trusted-companies.webp" alt="Company logo">
  </a>
</p>

## Support

Product support is available through following mediums.

* [Support ticket](https://support.syncfusion.com/support/tickets/create) - Guaranteed Response in 24 hours | Unlimited tickets | Holiday support
* Live chat

## Changelog

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/navigations/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
