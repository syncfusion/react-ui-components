# React Navigation Components

The Syncfusion React Navigation package provides a feature-rich collection of UI components. Includes a tree view, context menu, toolbar, sidebar, and menu components for building modern, interactive React applications.

## Setup

To install `navigations` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-navigations
```

## React Context Menu

The ContextMenu component displays a menu with options when triggered by a right-click or custom event. It provides a powerful way to offer context-specific actions with support for nested submenus, icons, and various customization options.

**Key features**

  - **Nested Submenus:** Create hierarchical menu structures with unlimited nesting levels, allowing for organization of related commands and options.
  - **Icon Support:** Enhance visual recognition by adding icons to menu items using CSS classes or React components (SVG).
  - **Animation Effects:** Choose from various animation effects like FadeIn, SlideDown, and ZoomIn to control how the menu appears.
  - **Keyboard Navigation:** Comprehensive keyboard support for accessibility, including arrow keys for navigation, Enter for selection, and Escape to close menus.
  - **Custom Positioning:** Control the exact position of the context menu using offset coordinates or automatic positioning relative to the target element.
  - **Template Customization:** Create fully customized menu item displays using React components as templates for advanced UI requirements.
  - **Separator Items:** Visual grouping of related menu items using separator lines.

**Usage**

```tsx
import { ContextMenu, MenuItem, MenuItemLabel } from "@syncfusion/react-navigations";

export default function App() {
  const targetRef = useRef<HTMLButtonElement>(null);
  return (
    <div >
       <button ref={targetRef}> Right Click Me </button>
        <ContextMenu targetRef={targetRef as React.RefObject<HTMLElement>}>
           <MenuItem>
             <MenuItemLabel>Cut</MenuItemLabel>
           </MenuItem>
           <MenuItem>
             <MenuItemLabel>Copy</MenuItemLabel>
           </MenuItem>
           <MenuItem>
             <MenuItemLabel>Rename</MenuItemLabel>
           </MenuItem>
       </ContextMenu>
    </div>    
  );
};
```

**Resources**

- [Context Menu Demo/Docs](https://react.syncfusion.com/react-ui/context-menu)
- [Context Menu API](https://react.syncfusion.com/api/context-menu/overview)

## React Menu

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

**Usage**

```tsx
import { Menu, MenuItem, MenuItemLabel, MenuItemIcon, Orientation } from "@syncfusion/react-navigations";

export default function App() {
  return (
    <Menu orientation={Orientation.Horizontal}>
      <MenuItem>
        <MenuItemLabel>File</MenuItemLabel>
        <MenuItem>
          <MenuItemLabel>New</MenuItemLabel>
        </MenuItem>
        <MenuItem>
          <MenuItemLabel>Open</MenuItemLabel>
        </MenuItem>
      </MenuItem>
      <MenuItem>
        <MenuItemLabel>Edit</MenuItemLabel>
      </MenuItem>
    </Menu>
  );
};
```

**Resources**

- [Menu Demo/Docs](https://react.syncfusion.com/react-ui/menu)
- [Menu API](https://react.syncfusion.com/api/menu/overview)

## React Toolbar

The Toolbar component helps users efficiently organize and access frequently used actions through a compact and customizable interface. It offers multiple overflow handling modes to accommodate different UI requirements and screen sizes.

**Key features**

  - **Multiple Overflow Modes:** Choose from four different handling strategies when toolbar items exceed the available space:
    - **Scrollable**: Maintains overflow items with scrolling
    - **Popup**: Moves overflow items to a popup menu accessed via an expand button
    - **MultiRow**: Wraps overflow items to additional rows within the toolbar
    - **Extended**: Hides overflow items in a secondary row accessible through an expand button
  - **Orientation Options:** Configure the toolbar in either horizontal or vertical layout to fit different UI design requirements.
  - **Keyboard Navigation:** Comprehensive keyboard accessibility with arrow key navigation, Home/End for first/last item access, and Tab for focus management.
  - **Scroll Step Customization:** Configure the scrolling distance in pixels for the Scrollable overflow mode.
  - **Flexible Item Layout:** Supports toolbar items, separators, and spacers for organized grouping of actions.

**Usage**

```tsx
import { Toolbar, ToolbarItem, ToolbarSeparator, ToolbarSpacer, OverflowMode } from "@syncfusion/react-navigations";

export default function App() {
  return (
    <Toolbar overflowMode={OverflowMode.Popup}>
      <ToolbarItem><Button>Cut</Button></ToolbarItem>
      <ToolbarItem><Button>Copy</Button></ToolbarItem>
      <ToolbarSeparator />
      <ToolbarItem><Button>Paste</Button></ToolbarItem>
      <ToolbarSpacer />
      <ToolbarItem><Button>Help</Button></ToolbarItem>
   </Toolbar>    
  );
};
```

**Resources**

- [Toolbar Demo/Docs](https://react.syncfusion.com/react-ui/toolbar)
- [Toolbar API](https://react.syncfusion.com/api/toolbar/overview)

## React Sidebar

The Sidebar component renders a collapsible drawer for navigation and custom content. It supports flexible positioning, multiple interaction modes, and a composite layout API that coordinates the drawer, main content, and toggle trigger.

**Key features**

  - **Positioning:** Anchor the sidebar to either the `Left` or `Right` edge of the viewport to fit different navigation patterns.
  - **Interaction Modes:** Choose between `Over` (floats above content) and `Push` (shifts main content) modes to control how the sidebar coexists with surrounding content.
  - **Backdrop Overlay:** Render an optional backdrop when the sidebar is open to focus attention and intercept outside interactions.
  - **Configurable Transitions:** Customize the enter and exit transition durations independently for smooth, polished animations.
  - **Dockable State:** Collapse the sidebar into a compact docked state that remains visible, configurable via a `dockableWidth` value.
  - **Responsive Media Queries:** Drive the sidebar's open/closed state automatically based on a media query for adaptive layouts.
  - **Composite Layout API:** Pair the sidebar with `SidebarLayout`, `SidebarMain`, and `SidebarTrigger` components to coordinate drawer, content area, and toggle button.
  - **Outside Click Handling:** Automatically close the sidebar when clicking outside, configurable via `closeOnDocumentClick`.

**Usage**

```tsx
import { useState } from "react";
import { Sidebar, SidebarLayout, SidebarMain, SidebarTrigger } from "@syncfusion/react-navigations";

export default function App() {
    const [open, setOpen] = useState(false);

    return (
        <SidebarLayout>
            <Sidebar
                open={open}
                onChange={(e) => setOpen(e.open)}
            >
                <nav>
                    <ul>
                        <li>Dashboard</li>
                        <li>Projects</li>
                        <li>Settings</li>
                    </ul>
                </nav>
            </Sidebar>

            <SidebarMain>
                <SidebarTrigger aria-label="Toggle navigation">
                    ☰
                </SidebarTrigger>

                <div>Dashboard Content</div>
            </SidebarMain>
        </SidebarLayout>
    );
};
```

**Resources**

- [Sidebar Demo/Docs](https://react.syncfusion.com/react-ui/sidebar)
- [Sidebar API](https://react.syncfusion.com/api/sidebar/overview)


## React TreeView

The TreeView component renders structured node collections as an expandable, navigable list. It supports both local arrays and remote `DataManager` data sources, controlled and uncontrolled expansion and selection, multiple selection modes, tri-state checkboxes, inline label editing, and rich keyboard interaction for accessibility.

**Key features**

  - **Hierarchical Data Binding:** Render nested trees from a `children` field, a self-referential `parentId` field, or a remote `DataManager` with a `Query` and lazy-loaded children.
  - **Custom Field Mapping:** Map any `datasource` property names to the TreeView fields (`id`, `label`, `children`, `parentId`, `disabled`, `icon`, `hasChildren`, `tooltip`, `navigateUrl`, and more) using the `fields` prop.
  - **Selection Modes:** Choose between `None`, `Single`, `Multiple`, or `Checkbox` selection. Checkbox mode supports tri-state checkboxes with optional cascading to descendants and disabled-children participation via `autoCheck` and `checkDisabledChildren`.
  - **Expansion Control:** Expand on `Click`, `DoubleClick`, or `None`, and drive the expanded set through `expandedIds` (controlled) or `defaultExpandedIds` (uncontrolled).
  - **Inline Editing:** Enable `editable` to let users rename nodes in place. The `onNodeEdit` callback receives the old and new label and can return `false` to reject the change. A `TreeViewEditInput` slot is provided for full editor customization.
  - **Sorting and Empty State:** Sort siblings with `sortOrder` and render a custom `TreeViewEmptyState` when the resolved list is empty.
  - **Row Templates:** Replace the default row rendering with a `TreeViewNodes` render-prop child, or compose individual parts using `TreeViewItemIcon`, `TreeViewItemLabel`, `TreeViewItemToggle`, and `TreeViewItemCheckbox`.
  - **Keyboard Navigation:** Comprehensive keyboard support for accessibility, including arrow keys to move focus, Home/End for first/last, Enter/Space to select, and F2 to begin editing.

**Usage**

```tsx
import { TreeView } from "@syncfusion/react-navigations";

interface Node { id: string; label: string; parentId?: string | null; }

export default function App() {
    const data: Node[] = [
        { id: '1', label: 'Documents' },
        { id: '2', label: 'Reports', parentId: '1' },
        { id: '3', label: 'Invoices', parentId: '1' },
        { id: '4', label: 'Downloads' },
        { id: '5', label: 'Pictures' }
    ];
    return (
        <TreeView data={data} defaultExpandedIds={['1']} />
    );
}
```

**Resources**

- [TreeView Demo/Docs](https://react.syncfusion.com/react-ui/tree-view)
- [TreeView API](https://react.syncfusion.com/api/tree-view/overview)

<p align="center">
Trusted by the world's leading companies
  <a href="https://www.syncfusion.com/">
    <img src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/syncfusion/syncfusion-trusted-companies.webp" alt="Syncfusion logo">
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
