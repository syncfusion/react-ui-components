# Syncfusion React Calendars Components

The Syncfusion® React Calendar components provide an integrated suite for managing date and time. The package includes `Calendar`, `DatePicker`, `TimePicker`, `DateTimePicker`, and `DateRangePicker`, supporting date and time formatting, controlled and uncontrolled selection, range restriction, month and year views, strict-mode validation, masked input, and form integration.

## Setup

```sh
npm install @syncfusion/react-calendars
```
Apply a theme by installing the corresponding theme package and importing its styles, for example with the [Material theme](https://www.npmjs.com/package/@syncfusion/react-material-theme):

```sh
npm install @syncfusion/react-material-theme
```

```css
/* App.css */
@import '../node_modules/@syncfusion/react-material-theme/styles/calendar/index.css';
```
> Note: For other components, use their corresponding index.css files from their respective style folders

## React Calendar

The `Calendar` component renders an interactive month, year, and decade interface for selecting dates with custom cell rendering, range restrictions, and multiple orientation and view modes.

### Key Features

- **[Views](https://react.syncfusion.com/react-ui/calendar/#views):** Switch between Month, Year, and Decade views using `start` and `depth` with the `CalendarView` enum to set the initial view and the deepest navigation level.

- **[Date Range Restriction](https://react.syncfusion.com/react-ui/calendar/#date-range):** Constrain selectable dates with `minDate` and `maxDate`, and disable all past or future dates independently using `disablePastDays` and `disableFutureDays`.

- **[Multi Selection](https://react.syncfusion.com/react-ui/calendar/#multi-selection):** Enable `multiSelect` to let users choose several non-consecutive dates at once, storing them in a `Date[]` value.

- **[Custom Cell Rendering](https://react.syncfusion.com/react-ui/calendar/#disabled-dates):** Apply `cellTemplate` with `CalendarCellProps` to style, highlight, or disable individual dates, such as marking holidays.

- **[Toolbar and Orientation](https://react.syncfusion.com/react-ui/calendar/#toolbar):** Toggle the selected-date header with `showToolBar` and lay out months side by side or stacked through `orientation` using `Orientation.Horizontal` and `Orientation.Vertical`.

- **[Week Numbers and Formatting](https://react.syncfusion.com/react-ui/calendar/#week-numbers):** Display ISO week numbers with `weekNumber`, and format the weekday header via `weekDaysFormat` using the `WeekDaysFormats` enum.

- **[Islamic Calendar](https://react.syncfusion.com/react-ui/calendar/#islamic-calendar):** Switch from Gregorian to the Hijri calendar through `calendarType`, with automatic date conversion and localized month and day names.

- **[Controlled and Uncontrolled Mode](https://react.syncfusion.com/react-ui/calendar/#controlled-vs-uncontrolled):** Drive the selection with `value` in controlled mode, or initialize internal state with `defaultValue`; `onChange` and `onViewChange` report updates.

**Usage**

```tsx
import { Calendar } from '@syncfusion/react-calendars';

export default function App() {
  return (
    <Calendar
      value={new Date(2026, 9, 7)}
      minDate={new Date(2025, 0, 1)}
      maxDate={new Date(2027, 11, 31)}
      showToolBar
      onChange={(e) => console.log(e.value)}
    />
  );
}
```

**Resources**

- [Calendar Demo/Docs](https://react.syncfusion.com/react-ui/calendar/)
- [Calendar API](https://react.syncfusion.com/api/Calendar/overview/)

## React DatePicker

The `DatePicker` component combines an editable input with an integrated calendar popup for selecting a single date, offering input formatting, masking, validation, and configurable popup display.

### Key Features

- **[Date Formatting](https://react.syncfusion.com/react-ui/datepicker/#format):** Display and parse values with `format` (e.g., `MM/dd/yyyy`, `yyyy-MM-dd`), and accept multiple typed patterns through the `inputFormats` array.

- **[Dialog Mode](https://react.syncfusion.com/react-ui/datepicker/#dialog-mode):** Present the picker as an anchored `Inline` popup, a centered `Dialog` overlay, or `Auto` (desktop inline, mobile dialog) using the `pickerVariant` prop and the `PopupSettings` type for positioning.

- **[Segment-Based Masked Input](https://react.syncfusion.com/react-ui/datepicker/#mask-support):** Enable `inputMask` for segment-guided entry keyed to the current format, and customize per-segment characters with `maskPlaceholder`.

- **Strict Mode Validation:** Turn on `strictMode` to prevent and auto-correct typed values that fall outside the supported format and the configured date range.

- **[Views](https://react.syncfusion.com/react-ui/datepicker/#views):** Navigate Month, Year, and Decade views using `start` and `depth`, tracking the active view through the `onViewChange` `ViewChangeEvent`.

- **[Appearance and Adornments](https://react.syncfusion.com/react-ui/datepicker/#appearance):** Choose among `Standard`, `Outlined`, and `Filled` variants with `variant`, float the label via `labelMode`, and add contextual hints with `helperText`.

- **[Islamic Calendar](https://react.syncfusion.com/react-ui/datepicker/#islamic-calendar):** Enable the Hijri calendar with `calendarType` so dates are displayed and selected using Islamic month and day names.

**Usage**

```tsx
import { DatePicker } from '@syncfusion/react-calendars';

export default function App() {
  return (
    <DatePicker
      value={new Date(2026, 9, 7)}
      format="dd-MMM-yyyy"
      minDate={new Date(2026, 0, 1)}
      maxDate={new Date(2027, 11, 31)}
      helperText="Select your appointment date."
      onChange={(e) => console.log(e.value)}
    />
  );
}
```

**Resources**

- [DatePicker Demo/Docs](https://react.syncfusion.com/react-ui/datepicker/)
- [DatePicker API](https://react.syncfusion.com/api/DatePicker/overview/)

## React TimePicker

The `TimePicker` component provides a time input with a list-based selector, supporting flexible formats, range and step constraints, strict validation, and inline, dialog, or full-screen popups.

### Key Features

- **[Time Formats](https://react.syncfusion.com/react-ui/timepicker/#format):** Render and parse times with `format` using patterns such as `h:mm a`, `HH:mm`, or `HH:mm:ss`.

- **[Range Restriction](https://react.syncfusion.com/react-ui/timepicker/#time-range):** Bound selectable times with `minTime` and `maxTime`, and set the interval between list items in minutes with `step`.

- **Strict Mode:** Enable `strictMode` to block invalid input and snap the closest value within the configured time range.

- **[Popup Variants](https://react.syncfusion.com/react-ui/timepicker/#dialog-mode):** Display the list as an anchored `Inline` popup, a centered `Dialog`, `Auto`, or a mobile full-screen panel with `fullScreenMode`.

- **[Custom List Items](https://react.syncfusion.com/react-ui/timepicker/#customization):** Apply `itemTemplate` to render each time entry with custom content or styling.

- **[Helper Text and Adornments](https://react.syncfusion.com/react-ui/timepicker/#helper-text):** Surface guidance with `helperText`, and place icons or labels at the input edges using `prefix` and `suffix`.

**Usage**

```tsx
import { TimePicker } from '@syncfusion/react-calendars';

export default function App() {
  return (
    <TimePicker
      value={new Date(2026, 9, 7, 18, 30)}
      format="h:mm a"
      minTime={new Date(2026, 9, 7, 9, 0)}
      maxTime={new Date(2026, 9, 7, 18, 0)}
      step={30}
      onChange={(e) => console.log(e.value)}
    />
  );
}
```

**Resources**

- [TimePicker Demo/Docs](https://react.syncfusion.com/react-ui/timepicker/)
- [TimePicker API](https://react.syncfusion.com/api/Timepicker/overview/)

## React DateTimePicker

The `DateTimePicker` component merges a calendar and a time list into a single input for selecting a precise date-time value, with combined formatting, step control, and configurable popup display.

### Key Features

- **[Combined Date and Time Selection](https://react.syncfusion.com/react-ui/datetimepicker/):** Tab between the calendar and time list inside a single popup to set both the date and the time in one control.

- **[Date-Time Formatting](https://react.syncfusion.com/react-ui/datetimepicker/#formats):** Display and parse combined values with `format` (e.g., `MM/dd/yyyy h:mm a`), and accept extra input patterns through `inputFormats`.

- **Range and Step Constraints:** Bound the selection with `minDate`, `maxDate`, `minTime`, and `maxTime`, and set the time-list interval in minutes with `step`.

- **Strict Mode Validation:** Turn on `strictMode` to reject or auto-correct typed values that fall outside the supported format and the configured range.

- **[Popup Variants](https://react.syncfusion.com/react-ui/datetimepicker/#dialog-mode):** Present the picker as an `Inline` popup, a centered `Dialog`, or `Auto` using `pickerVariant` with `PopupSettings` for positioning and collision handling.

- **[Custom Templates](https://react.syncfusion.com/react-ui/datetimepicker/#customization):** Personalize the calendar with `cellTemplate`, the header with `headerTemplate`, and each time row with `itemTemplate`.

- **[Islamic Calendar](https://react.syncfusion.com/react-ui/datetimepicker/#islamic-calendar):** Enable the Hijri calendar with `calendarType` so both date and time values follow Islamic month and day names.

**Usage**

```tsx
import { DateTimePicker } from '@syncfusion/react-calendars';

export default function App() {
  return (
    <DateTimePicker
      value={new Date(2026, 9, 7, 18, 45)}
      format="MM/dd/yyyy h:mm a"
      minDate={new Date(2026, 0, 1)}
      maxDate={new Date(2027, 11, 31)}
      step={15}
      onChange={(e) => console.log(e.value)}
    />
  );
}
```

**Resources**

- [DateTimePicker Demo/Docs](https://react.syncfusion.com/react-ui/datetimepicker/)
- [DateTimePicker API](https://react.syncfusion.com/api/DateTimePicker/overview/)

## React DateRangePicker

The `DateRangePicker` component selects a continuous start and end date range, supporting preset shortcuts, range-duration constraints, and both inline and dialog presentation.

### Key Features

- **[Range Selection](https://react.syncfusion.com/react-ui/daterangepicker/#controlled-vs-uncontrolled):** Pick a start and end date with a single input, and manage the values through `value` and `defaultValue` as a `[Date, Date]` pair.

- **[Duration Constraints](https://react.syncfusion.com/react-ui/daterangepicker/#range-restriction):** Restrict how long a selection may span using `minRangeDays` and `maxRangeDays`, and bound the overall dates with `minDate` and `maxDate`.

- **[Preset Ranges](https://react.syncfusion.com/react-ui/daterangepicker/#presets):** Offer one-click shortcuts through the `presets` array of `DateRangePreset` objects, with an automatic Custom Range option.

- **[Month and Year Ranges](https://react.syncfusion.com/react-ui/daterangepicker/#month-range-picker):** Select ranges at month or year granularity by setting `start` and `depth` to `CalendarView.Year` or `CalendarView.Decade`.

- **[Custom Formatting and Separator](https://react.syncfusion.com/react-ui/daterangepicker/#separator):** Control how the range renders with `format`, and the text between dates with `separator` (default `' - '`).

- **[Popup Variants](https://react.syncfusion.com/react-ui/daterangepicker/#dialog-mode):** Render as an `Inline` popup, a centered `Dialog`, or `Auto` using `pickerVariant` and `PopupSettings`.

- **[Islamic Calendar](https://react.syncfusion.com/react-ui/daterangepicker/#islamic-calendar):** Enable the Hijri calendar with `calendarType` so the full range uses Islamic month and day names.

**Usage**

```tsx
import { DateRangePicker } from '@syncfusion/react-calendars';

export default function App() {
  return (
    <DateRangePicker
      value={[new Date(2026, 2, 10), new Date(2026, 3, 20)]}
      format="MM/dd/yyyy"
      separator=" - "
      minRangeDays={1}
      maxRangeDays={60}
      onChange={(e) => console.log(e.value)}
    />
  );
}
```

**Resources**

- [DateRangePicker Demo/Docs](https://react.syncfusion.com/react-ui/daterangepicker/)
- [DateRangePicker API](https://react.syncfusion.com/api/DateRangePicker/overview/)

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

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/calendars/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
 