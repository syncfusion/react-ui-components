# Syncfusion React Popups Components

The `@syncfusion/react-popups` package is a collection of React popup components that display contextual information, messages, and loading states in separate pop-ups. It includes the `Dialog`, `Tooltip`, and `Spinner` components, each with flexible positioning, animation, and customization options for use across desktop and mobile interfaces.

## Setup

To install `popups` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-popups
```

Apply a theme by installing the corresponding theme package and importing its styles, for example with the [Material theme](https://www.npmjs.com/package/@syncfusion/react-material-theme):

```sh
npm install @syncfusion/react-material-theme
```

```css
/* App.css */
@import '../node_modules/@syncfusion/react-material-theme/styles/tooltip/index.css';
```
> Note: For other themes, use the corresponding `index.css` files from their respective style folders.

## React Dialog

The `Dialog` component is a popup window that appears in front of page content to present important information, collect user input, show forms, or display detailed content.

### Key Features

- [Positioning](https://react.syncfusion.com/react-ui/dialog/#positioning): Control where the dialog appears relative to the viewport using the `position` property, which accepts predefined positions or custom coordinates through `style`.

- [Full-screen mode](https://react.syncfusion.com/react-ui/dialog/#full-screen-mode): Expand the dialog to fill the entire viewport with the `fullScreen` property while retaining its header, content, and footer structure.

- [Non-modal](https://react.syncfusion.com/react-ui/dialog/#non-modal-dialog): Set `modal` to `false` to allow interaction with the background content, which is suited to tool windows and information panels.

- [Action buttons](https://react.syncfusion.com/react-ui/dialog/#action-buttons): Place custom controls such as `Close` or `Submit` in the dialog footer with the `footer` property.

- [Draggable](https://react.syncfusion.com/react-ui/dialog/#draggable-dialog): Allow the dialog to be repositioned by dragging its header using the `draggable` property, with `onDrag`, `onDragStart`, and `onDragStop` events.

- [Resizable](https://react.syncfusion.com/react-ui/dialog/#resizable-dialog): Let users resize the dialog from its edges or corners with the `resizable` property, choosing which directions with `resizeHandles` (for example `South`, `East`, `NorthWest`, or `All`).

- [Multiple dialogs](https://react.syncfusion.com/react-ui/dialog/#multiple-dialogs): Open layered or nested dialogs simultaneously with automatic z-index management.

- [Animation](https://react.syncfusion.com/react-ui/dialog/#animation): Specify custom entry and exit effects with the `animation` property, including `effect`, `duration`, and `delay` values.

- [Initial focus](https://react.syncfusion.com/react-ui/dialog/#initial-focus): Direct focus to a specific control when the dialog opens using `initialFocusRef`, which overrides the default focus behavior.

- [Target](https://react.syncfusion.com/react-ui/dialog/#target): Render the dialog within a specific element instead of the document body using the `target` property to scope the experience to a particular area of the page.

- [Scrolling long content](https://react.syncfusion.com/react-ui/dialog/#scrolling-long-content): Automatically adds scrollbars when the content exceeds the available space, keeping the dialog within viewport bounds.

**Usage**

```tsx
import { useState } from 'react';
import { Dialog } from '@syncfusion/react-popups';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      modal={true}
      header="Dialog Title"
      footer={<button onClick={() => setIsOpen(false)}>Close</button>}
    >
      <p>This is the dialog content.</p>
    </Dialog>
  );
}
```

**Resources**

- [Dialog Demo/Docs](https://react.syncfusion.com/react-ui/dialog/)
- [Dialog API](https://react.syncfusion.com/api/dialog/overview/)

## React Tooltip

The `Tooltip` component displays contextual information when users hover, focus, or tap UI elements, offering clarification and additional details without navigating away from the current view.

### Key Features

- [Triggering modes](https://react.syncfusion.com/react-ui/tooltip/#triggering-types): Control when the tooltip appears using the `opensOn` property with `Auto`, `Focus`, `Hover`, `Click`, or `Custom` values. On mobile devices the tooltip triggers on a tap-hold action instead of hover.

- [Positioning](https://react.syncfusion.com/react-ui/tooltip/#tooltip-positions): Place the tooltip in any of twelve directions around the target (`TopLeft`, `TopCenter`, `TopRight`, `LeftTop`, `LeftCenter`, `LeftBottom`, `RightTop`, `RightCenter`, `RightBottom`, `BottomLeft`, `BottomCenter`, `BottomRight`) using the `position` property, with fine-tuning via `offsetX` and `offsetY`.

- [Controlled mode](https://react.syncfusion.com/react-ui/tooltip/#controlled-tooltip): Manage opening and closing programmatically with the `open` property along with the `onOpen` and `onClose` event callbacks.

- [Multiple targets](https://react.syncfusion.com/react-ui/tooltip/#multiple-targets): Apply one tooltip instance to many elements with the `onFilterTarget` callback, which returns the element that should trigger the tooltip and supports unique content per target.

- [Custom templates](https://react.syncfusion.com/react-ui/tooltip/#template): Render rich, structured content through the `content` property, from plain text to complex layouts such as avatars and descriptions.

- [Animations](https://react.syncfusion.com/react-ui/tooltip/#animations): Configure opening and closing effects separately with the `animation` property, which accepts distinct `effect`, `duration`, and `delay` values for each state.

- [Sticky mode](https://react.syncfusion.com/react-ui/tooltip/#sticky-tooltip): Keep the tooltip open after the pointer leaves the target by setting `sticky`, so it stays visible until the user closes it.

- [Scroll mode](https://react.syncfusion.com/react-ui/tooltip/#scroll-mode): Enable scrolling automatically when a fixed `height` is set and the content overflows, keeping the tooltip within its bounds.

- [Delay](https://react.syncfusion.com/react-ui/tooltip/#delay): Control timing with `openDelay` and `closeDelay`, which specify how long the pointer must rest before the tooltip appears and how long it remains visible after the cursor moves away.

- [Mouse trail](https://react.syncfusion.com/react-ui/tooltip/#mouse-trail): Follow the cursor in real time by enabling `followCursor`, useful for inspectors on images or maps. Available on desktop devices only.

- **Arrow pointer:** Show or hide the directional tip with the `arrow` property and adjust its position with `arrowPosition`.

**Usage**

```tsx
import { Tooltip } from '@syncfusion/react-popups';

export default function App() {
  return (
    <Tooltip content={<>This is a Tooltip</>}>
      Hover me
    </Tooltip>
  );
}
```

**Resources**

- [Tooltip Demo/Docs](https://react.syncfusion.com/react-ui/tooltip/)
- [Tooltip API](https://react.syncfusion.com/api/tooltip/overview/)

## React Spinner

The `Spinner` component displays a lightweight loading indicator for pending operations, providing visual feedback during data processing, transitions, and other background activities.

### Key Features

- [Types](https://react.syncfusion.com/react-ui/spinner/#types): Choose the visual style with the `type` property and the `SpinnerType` enum, which offers `Circular`, `Cupertino`, `SingleCircle`, and `DoubleCircle`.

- [Size and thickness](https://react.syncfusion.com/react-ui/spinner/#sizes): Control overall dimensions with the `size` property and the stroke width of circular variants with `thickness` to fit different layouts.

- [Theming](https://react.syncfusion.com/react-ui/spinner/#color): Set a semantic color via the `color` property and the `Color` enum, including `Primary`, `Secondary`, `Success`, `Warning`, `Error`, and `Info`.

- [Animation duration](https://react.syncfusion.com/react-ui/spinner/#animation-duration): Define the speed of rotation or fade effects with the `animationDuration` property using values such as `1s` or `800ms`.

- [Label](https://react.syncfusion.com/react-ui/spinner/#label): Display descriptive text alongside the spinner with the `label` property to indicate the current operation and improve accessibility.

- [Overlay mode](https://react.syncfusion.com/react-ui/spinner/#overlay): Render as a fullscreen fixed overlay with a dimmed backdrop using the `overlay` property to block interaction during critical operations.

- [Custom template](https://react.syncfusion.com/react-ui/spinner/#custom-template): Apply custom color values beyond the semantic palette using inline styles or CSS variables to match specific brand guidelines.

- [Interactive integration](https://react.syncfusion.com/react-ui/spinner/#interactive-integration): Surface the spinner dynamically inside buttons, forms, or API calls based on user actions and application state.

**Usage**

```tsx
import { Spinner, SpinnerType, Color } from '@syncfusion/react-popups';

export default function App() {
  return (
    <Spinner label="Loading data…" type={SpinnerType.Circular} size={36} color={Color.Primary} />
  );
}
```

**Resources**

- [Spinner Demo/Docs](https://react.syncfusion.com/react-ui/spinner/)
- [Spinner API](https://react.syncfusion.com/api/spinner/overview/)


<p align="center">
Trusted by the world's leading companies
  <a href="https://www.syncfusion.com/">
    <img src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/syncfusion/syncfusion-trusted-companies.webp" alt="Company  logo">
  </a>
</p>

## Support

Product support is available through following mediums.

* [Support ticket](https://support.syncfusion.com/support/tickets/create) - Guaranteed Response in 24 hours | Unlimited tickets | Holiday support
* Live chat

## Changelog

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/popups/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
