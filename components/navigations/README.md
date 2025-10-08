# React Navigation Components

The Syncfusion React Navigation package provides a feature-rich collection of UI components. Includes a context menu and toolbar components for building modern, interactive React applications.

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
import { ContextMenu } from "@syncfusion/react-navigations";

export default function App() {
  const targetRef = useRef<HTMLButtonElement>(null);
  return (
    <div >
       <button ref={targetRef}> Right Click Me </button>
        <ContextMenu targetRef={targetRef as React.RefObject<HTMLElement>}>
           <MenuItem text="Cut" />
            <MenuItem text="Copy" />
           <MenuItem text="Rename" />
       </ContextMenu>
    </div>    
  );
};
```

**Resources**

- [Context Menu Demo/Docs](https://react.syncfusion.com/context-menu)
- [Context Menu API](https://react-api.syncfusion.com/context-menu/overview)

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

- [Toolbar Demo/Docs](https://react.syncfusion.com/toolbar)
- [Toolbar API](https://react-api.syncfusion.com/toolbar/overview)

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

&copy; Copyright 2025 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
