# React Popups Components

The Syncfusion React popup package is a feature-rich collection of UI components such as Dialog, Tooltip, and Spinner, used to display contextual information or messages in separate pop-ups.

## Setup

To install `popups` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-popups
```

## React Dialog

The Dialog component is a modal pop-up used to display important information, gather user input, or present detailed content without navigating away from the current page. It offers flexible positioning, interaction, and customization options to suit various application needs.

**Key features**

- **Positioning:** Control where the dialog appears on the screen using the position property, allowing alignment relative to the viewport.

- **Full-Screen Mode:** Enable the fullscreen property to make the dialog occupy the entire screen—ideal for mobile layouts or content-heavy dialogs.

- **Draggable Dialog:** Make the dialog movable by enabling the draggable property, allowing users to reposition it by dragging the header.

- **Resizable Dialog:** Allow users to resize the dialog by enabling the resizable property, which is useful for content that may vary in size.

- **Custom Animations:** Use the animation property to apply custom open and close animations, enhancing the visual experience and user feedback.

**Usage**

```tsx

import React, { useState } from "react";
import { Dialog } from "@syncfusion/react-popups";

export default function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      modal={true}
      header="Dialog Title"
      footer={
        <>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </>
      }
    >
      <p>This is the dialog content.</p>
    </Dialog>
  );

```

**Resources**

- [Dialog Demo/Docs](https://react.syncfusion.com/react-ui/dialog)
- [Dialog API](https://react.syncfusion.com/api/dialog/overview)

## React Tooltip

The Tooltip component displays additional information when users hover, click, or focus on an element. It provides a flexible way to enhance user experience by showing contextual information.

**Key features**

- **Multiple Trigger Modes:** Display tooltips through various interaction methods including hover, click or focus.

- **Positioning:** Place tooltips in 12 different positions (TopLeft, TopCenter, TopRight, BottomLeft, BottomCenter, BottomRight, LeftTop, LeftCenter, LeftBottom, RightTop, RightCenter, RightBottom).

- **Animation Effects:** Choose from 15 built-in animation effects for both opening and closing tooltips.

- **Follow Cursor:** Option to make tooltips follow the mouse cursor movement.

- **Sticky Mode:** Keep tooltips open until explicitly closed by the user.

- **Arrow Pointer:** Configurable arrow pointer that indicates which element the tooltip relates to.

**Usage**

```tsx
import { Tooltip } from "@syncfusion/react-popups";

export default function App() {
    return (
      <Tooltip content={<>This is a Tooltip</>}>
        Hover me
      </Tooltip>
    );
}
```

**Resources**

- [Tooltip Demo/Docs](https://react.syncfusion.com/react-ui/tooltip)
- [Tooltip API](https://react.syncfusion.com/api/tooltip/overview)

## React Spinner

The Spinner component indicates loading or background processing. It supports multiple visual styles, sizing, theming, and fullscreen overlay.

**Key features**

- **Variants:** Circular (default), Cupertino, SingleCircle, DoubleCircle.
- **Size and Thickness:** Control overall size and stroke thickness.
- **Animation Duration:** Customize rotation/fade speed.
- **Overlay Mode:** Show as a fullscreen overlay.
- **Theming:** Built-in color styles via the Color enum (Primary, Secondary, Success, Warning, Error, Info).

**Usage**

```tsx
import { Spinner, SpinnerType, Color } from "@syncfusion/react-popups";

export default function App() {
    return (<Spinner label="Loading data…" type={SpinnerType.Circular} size={36} color={Color.Primary} />);
}
```

**Resources**

- [Spinner Demo/Docs](https://react.syncfusion.com/react-ui/spinner)
- [Spinner API](https://react.syncfusion.com/api/spinner/overview)

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

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/popups/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
