# Syncfusion React Calendars Components
 
The Syncfusion React Calendar components for managing date and time with features like date formatting, inline editing, multiple (range) selection, range restriction, month and year selection, strict mode, and globalization.

## Setup

To install `calendars` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-calendars
```

## React Calendar
 
The Calendar component provides a versatile and interactive date selection interface with support for multiple views, customizations, and selection modes. It is designed to handle a wide range of scheduling and planning use cases.
 
**Key features**
 
- **View Modes:** Switch between month, year, and decade views using the start and depth properties to control the initial view and navigation depth.
 
- **Date Range Control:**  Restrict selectable dates using minDate and maxDate to ensure users can only choose valid dates within a defined range.
 
- **Custom Cell Templates:** Use the cellTemplate property to customize the appearance of specific dates, including disabling dates to prevent selection.
 
- **Week Number Display:** Enable the weekNumber property to show week numbers alongside calendar dates for better context in scheduling.
 
- **Multi-Date Selection:** Activate the multiSelect property to allow users to select multiple non-consecutive dates, ideal for marking events or selecting custom date ranges.

**Usage**

```tsx
import { Calendar } from '@syncfusion/react-calendars';

export default function App() {
  return (
    <Calendar/>
  );
}
```
 
## React DatePicker
 
The DatePicker component offers a streamlined and customizable interface for selecting dates, supporting various formats, view modes, and styling options. It is ideal for forms, scheduling tools, and any application requiring precise date input.
 
**Key features**
 
- **Custom Date Formats:** Display and receive date values in formats that suit your application using the format property, which supports standard date format patterns.
 
- **Read-Only Mode:** Prevent user edits while displaying a selected date by enabling the readOnly property—useful for forms or scenarios where the date is system-generated.
 
- **View Modes:** Navigate through Month, Year, and Decade views to provide flexible date selection experiences.
 
- **Custom Cell Templates:** Highlight important dates, events, or special occasions using the cellTemplate property to apply custom styling, icons, or indicators.

**Usage**

```tsx
import { DatePicker } from '@syncfusion/react-calendars';

export default function App() {
  return (
    <DatePicker/>
  );
}
```

## React TimePicker

The TimePicker component provides an intuitive way to select times with flexible formatting, validation, min/max constraints, and keyboard navigation. It supports inline or dialog (centered) popups, mobile-friendly full-screen mode, and customizable list item templates.

**Key features**

- **Time formats:** Display and parse times using the format property (for example, 'h:mm a', 'HH:mm').

- **Range restriction:** Limit selectable times with the minTime and maxTime properties.

- **Step intervals:** Control the time list interval via step (in minutes).

- **Strict mode:** Enable strictMode to allow only valid times and automatically correct invalid input to the closest valid time within the configured range.

- **Inline or centered popup:** Choose Inline (anchored) or Popup (centered dialog overlay). Auto adapts to device by default.

- **Templates:** Customize list items with itemTemplate for special styling or content.

**Usage**

```tsx
import { TimePicker } from '@syncfusion/react-calendars';

export default function App() {
  return (
    <TimePicker/>
  );
}
```
 
<p align="center">
Trusted by the world's leading companies
  <a href="https://www.syncfusion.com/">
    <img src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/syncfusion/syncfusion-trusted… alt="Syncfusion logo">
  </a>
</p>
 
## Support
 
Product support is available through following mediums.
 
* [Support ticket](https://support.syncfusion.com/support/tickets/create) - Guaranteed Response in 24 hours | Unlimited tickets | Holiday support
* Live chat
 
## Changelog
 
Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/calendars/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.
 
## License and copyright
 
> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).
 
> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.
 
See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campai…) for more info.
 
&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
 