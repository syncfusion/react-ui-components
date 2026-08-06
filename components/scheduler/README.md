# Syncfusion React Scheduler Component

The **Syncfusion React Scheduler** is a flexible, configurable, and high-performance event calendar component. It is designed to be highly customizable and extensible, offering a comprehensive feature set that addresses a wide range of scheduling needs. With day, week, work week, and month views, customizable templates, robust event management (CRUD, drag-and-drop, resizing), data binding, globalization and accessibility, the Scheduler integrates seamlessly and delivers an optimal experience on both desktop and mobile devices.

**Key Features**
- **Views:** Day, Week, Work Week, and Month with per-view configuration (Week is default).
- **Data binding:** Seamless data bining with local arrays/objects and remote APIs with custom field mappings.
- **Recurrence support:** Supports creating and managing recurring events with daily, weekly, monthly, and yearly repeat patterns, along with options to edit or delete individual occurrences or the entire series.
- **Customization:** The key elements like events, date header, work cells, header, editor window, quick popup, event resizing, event tooltip, header indent come with the default template support which allows the flexible end-user customization to embed any kind of text, images, or styles to it.
- **Working days and hours:** Configurable visible/working hours (highlighted) and working/non-working days.
- **Responsiveness:** Adapts with optimal user interfaces for mobile and desktop form-factors, thus helping the user's application to scale elegantly across all the form-factors without any additional effort.
- **Event interactions and validation:** Built-in CRUD via dialogs and quick popups with field validation.
- **Drag-and-drop and resizing:** Easy rescheduling and duration adjustments.
- **Context menu integration:** Supports right-click context menu on cells and events with built-in and custom menu items for quick actions.
- **Accessibility:** ARIA support and full keyboard navigation.
- **Localization:** All the static text and date content can be localized to any desired language. Also, it can be displayed with appropriate time mode and date-format as per the localized language.
- **RTL:** Supports displaying the component to display in the direction from right to left.
- **Robust API** Provides a comprehensive and extensible API for programmatic control over scheduler behavior, data updates, and event handling.

**Setup**

To install `scheduler` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-scheduler
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

- [Scheduler Demo/Docs](https://react.syncfusion.com/scheduler/overview)
- [Scheduler API](https://react-api.syncfusion.com/scheduler/overview)

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
Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/grid/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2025 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
