# Syncfusion React Scheduler Component

The **Syncfusion React Scheduler** is a fully featured, lightweight, and high-performance **event calendar component** designed to manage complex scheduling needs in React applications. It seamlessly handles local or remote data binding, offering robust appointment management, rich resource scheduling, complex recurrence rules, full keyboard accessibility and comprehensive customization options across both desktop and mobile devices.

### Key Features

- **[Day, Week, and Work Week Views](https://react.syncfusion.com/react-ui/scheduler/views/day-and-week-views/):** Configure vertical time-grid views with the `interval` property for multi-period display, and `timeScale` using `interval` and `slotCount` to set grid density. Control business rules with `workDays`, `firstDayOfWeek`, `workHours`, `startHour`, `endHour`, and the `showTimeIndicator` property.

- **[Month View](https://react.syncfusion.com/react-ui/scheduler/views/month-view/):** Plan across months with the `interval` property and tune density using `numberOfWeeks`, `maxEventsStack`, and `displayDate`. Enable ISO week numbers with `showWeekNumber` and `weekRule`, expand rows with `rowAutoHeight`, and hide adjacent dates using `showTrailingAndLeadingDates`.

- **[Timeline Views](https://react.syncfusion.com/react-ui/scheduler/views/timeline-views/):** Render `TimelineDayView`, `TimelineWeekView`, `TimelineWorkWeekView`, and `TimelineMonthView` for horizontally scrollable schedules. Configure `interval`, `timeScale`, `rowAutoHeight`, and `workDays`/`workHours`, and build multi-row headers with the `headerRows` property.

- **[Agenda View](https://react.syncfusion.com/react-ui/scheduler/views/agenda-view/):** Present a compact date-organized list of appointments ideal for narrow layouts. Set the date window with `agendaDaysCount` and `interval`, remove empty dates with `hideEmptyAgendaDays`, and filter weekends using the `showWeekend` property.

- **[Local and Remote Data Binding](https://react.syncfusion.com/react-ui/scheduler/data-binding/remote-data/):** Bind a local JSON array to `eventSettings.dataSource` and map keys with `eventSettings.fields`. Consume REST, Web API, or OData sources through `@syncfusion/react-data` using `UrlAdaptor`, `ODataV4Adaptor`, or `WebApiAdaptor`, plus `headers` and `crossDomain`.

- **[Load on Demand](https://react.syncfusion.com/react-ui/scheduler/data-binding/load-on-demand/):** Fetch only events within the active view's date range to reduce memory usage. Trigger requests from the `onDataRequest` event or wire `DataManager` so the Scheduler retrieves records for the visible period on every navigation.

- **[Event Types and Fields](https://react.syncfusion.com/react-ui/scheduler/appointments/event-types/):** Render normal, all-day, and spanned appointments using `isAllDay`, and place long events in the grid with `eventSettings.spannedEventPlacement="TimeSlot"`. Map built-in `startTime`, `endTime`, `location`, and `description` fields, then extend records with custom fields.

- **[Recurring Events](https://react.syncfusion.com/react-ui/scheduler/appointments/recurring-events/):** Create repeating appointments with an iCalendar `recurrenceRule` such as `FREQ=DAILY;INTERVAL=2;COUNT=3`, and exclude occurrences using `recurrenceException`. Edit a single instance via `recurrenceID`, or split the series with `editFollowingEvents` to modify current and following occurrences.

- **[Block Dates and Read-only Events](https://react.syncfusion.com/react-ui/scheduler/appointments/blockout-dates-and-hours/):** Reserve unavailable periods by setting `isBlock={true}` on an event with `startTime` and `endTime`, which prevents creation within those slots. Make specific appointments uneditable by assigning `isReadonly={true}` to the bound appointment data.

- **[CRUD Actions and Programmatic Control](https://react.syncfusion.com/react-ui/scheduler/crud-actions/add-edit-delete-events/):** Create, edit, and delete appointments through the quick popup or editor dialog, gated by `allowAdding`, `allowEditing`, and `allowDeleting`. Drive changes from external forms with the `addEvent`, `saveEvent`, and `deleteEvent` methods, and intercept them via `onDataChangeStart` and `onDataChangeComplete`.

- **[Drag and Drop and Event Resizing](https://react.syncfusion.com/react-ui/scheduler/crud-actions/event-resizing/):** Reschedule appointments by dragging, enabled by default with `eventDrag` and controlled by `onDragStart`, `onDrag`, and `onDragStop`. Adjust duration through the `eventResize` property using `interval`, `resizeToZero`, `startResizable`, and `endResizable`, with `onResizeStart`, `onResizing`, and `onResizeStop`.

- **[Resource Grouping](https://react.syncfusion.com/react-ui/scheduler/resources/resource-grouping/):** Organize events by shared entities with the `group` property, using `resources` for hierarchy order and `byDate` to lead with dates. Establish parent–child relationships via `byGroupID` with `idField` and `groupIDField`, or repeat child resources under each parent.

- **[Adaptive and Multi-Resource Grouping](https://react.syncfusion.com/react-ui/scheduler/resources/adaptive-grouping/):** Compress grouped schedules for mobile by setting `group.enableCompactView` to a single active resource selected through `selectedResource`. Display one event across several resources with `multiple={true}` and `groupEdit`, keeping a single synchronized record.

- **[Editor Window and Quick Popup](https://react.syncfusion.com/react-ui/scheduler/editor-window/):** Open a full editor dialog by double-clicking an event, or a lightweight quick popup by single-clicking a cell or event. Customize either with `SchedulerEditorPopup` and `SchedulerEditorProps`, add `validationRule` to fields, and disable the popup with `showQuickInfo`.

- **[Templates and Header Customization](https://react.syncfusion.com/react-ui/scheduler/template/):** Replace default rendering with the `eventTemplate`, `dateHeader`, `cellHeader`, `cell`, and `headerIndent` templates to inject custom text, icons, and styles. Rebuild the toolbar through the `header` property and the `SchedulerHeader` component using controls such as `todayProps` and `viewSwitcherProps`.

- **[Time Zone, Globalization, and RTL](https://react.syncfusion.com/react-ui/scheduler/timezone/):** Standardize times with the `timezone` property or per-event `startTimezone` and `endTimezone` fields, and customize the options via `timezoneDataSource`. Localize text and dates through `L10n`, `dateFormat`, `timeFormat`, and `firstDayOfWeek`, and enable right-to-left layout with `dir="rtl"`.

- **[Context Menu and Tooltips](https://react.syncfusion.com/react-ui/scheduler/context-menu/):** Attach a right-click menu to cells and events for quick add, edit, or delete using `openEditor`, `deleteEvent`, and `getEventDetails`. Show event details on hover with `eventTooltip`, or override the default content, arrow, and position with custom tooltip templates.

## Setup

```sh
npm install @syncfusion/react-scheduler
```

Apply a theme by installing the corresponding theme package and importing its styles, for example with the [Material theme](https://www.npmjs.com/package/@syncfusion/react-material-theme):

```sh
npm install @syncfusion/react-material-theme
```

```css
/* App.css */
@import '../node_modules/@syncfusion/react-material-theme/styles/scheduler/index.css';
```

**Usage**

```tsx
import { Scheduler, DayView, WeekView, WorkWeekView, MonthView } from '@syncfusion/react-scheduler';

export default function App() {
    return (
        <Scheduler>
            <DayView />
            <WeekView />
            <WorkWeekView />
            <MonthView />
        </Scheduler>
    );
};
```

**Resources**

- [Scheduler Demo/Docs](https://react.syncfusion.com/react-ui/scheduler/overview/)
- [Scheduler API](https://react.syncfusion.com/api/scheduler/overview/)


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

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/scheduler/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
