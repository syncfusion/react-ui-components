# Changelog

## 34.1.29 (2026-07-06)

### Scheduler

#### Features

- **Resource Grouping:** The Scheduler now supports grouping resources across multiple nested levels, making it easy to track schedules, manage allocations, and compare availability across different resources simultaneously. Grouping can be configured to display dates as the top-level header, establish clear parent-child dependencies between categories, or organize resources in a sequential hierarchy.

- **Agenda view:** A new view that lists upcoming appointments in order by date. This compact layout is optimized for mobile and narrow screens.

- **Timezone:** Support for displaying events accurately across different geographical regions. Features a global timezone property to ensure consistent event rendering regardless of the user's local system time, along with support for defining individual start and end timezones at the event level to manage schedules across multiple locations.

- **Load on Demand:**  Support for dynamically loading event data based on the active view's date range instead of loading the entire dataset at once. This significantly optimizes performance and reduces memory usage when managing extensive datasets.

- **Following occurrence edit:** Support for editing a chosen occurrence and all subsequent events within an ongoing recurring series.

## 33.1.44 (2026-03-16)

### Scheduler

#### Features

- **Recurrence support:** Built-in support for defining and managing recurring events with flexible repeat patterns such as daily, weekly, monthly, and yearly, including end conditions like end date and occurrence count, with options to edit or delete individual occurrences or the entire series.

- **Event resize customization:** Support for customizing event resize behavior, allowing control over resize actions through events and interactive updating of event duration by dragging the resize handle to the desired time slot.

- **Header customization:** Support for customizing the Scheduler header area using custom templates, allowing modification or replacement of the default navigation bar, view buttons, and date range display with custom content and styles.

- **Editor window customization:** Support for customizing the default event editor dialog with custom fields, templates, and layouts, enabling extension or complete redesign to fit application requirements. Includes built-in field validation to define rules such as required fields, format checks, and custom validation logic before saving an event.

- **Quick popup customization:** Support for customizing the quick info popup that appears on cell click and event click, allowing override of the default popup header, content, and footer sections with custom templates and actions.

- **Header indent customization:** Header indent template support for customizing the indent cell area displayed at the top-left corner, enabling placement of custom content such as labels, icons, or controls in that region.

- **Context menu integration:** Context menu support providing a right click menu on Scheduler cells and events, offering quick access actions such as add, edit, and delete, with full support for custom menu items and action handling.

- **Tooltip integration:** Built-in tooltip support for events, enabling display of additional event details on hover through default or fully customizable tooltip templates.

## 32.1.23 (2026-01-13)

### Scheduler

#### Bug Fixes

- Fixed an issue where event resizing did not work when TimeScale was disabled.
- Fixed an issue that prevented scheduling an event on the same day when its end time matched another event’s start time.
- Fixed an issue where the 24-hour time format was not displayed in the cell and event quick info popup.

## 32.1.19 (2025-12-16)

### Scheduler

The **Syncfusion React Scheduler** component is a flexible, configurable, and high-performance event calendar component. It is designed to be highly customizable and extensible, offering a comprehensive feature set that addresses a wide range of scheduling needs. With day, week, work week, and month views, customizable templates, robust event management (CRUD, drag-and-drop, resizing), data binding, globalization and accessibility, the Scheduler integrates seamlessly and delivers an optimal experience on both desktop and mobile devices.

**Key Features**
- **Views:** Day, Week, Work Week, and Month views with per-view configuration (Week is default).

- **Data binding:** Seamless data binding with local arrays/objects and remote APIs with custom field mappings.

- **Customization:** The key elements like events, date header, work cells come with the default template support which allows the flexible end-user customization to embed any kind of text, images, or styles to it.

- **Working days and hours:** Configurable visible/working hours (highlighted) and working/non-working days.

- **Responsiveness:** Adapts with optimal user interfaces for mobile and desktop form-factors, thus helping the user’s application to scale elegantly across all the form-factors without any additional effort.

- **Event interactions:** Built-in CRUD via editor dialog and quick pop-ups.

- **Drag-and-drop and resizing:** Easy rescheduling and duration adjustments.

- **Accessibility:** ARIA support and full keyboard navigation.

- **Localization:** All the static text and date content can be localized to any desired language. Also, it can be displayed with appropriate time mode and date-format as per the localized language.

- **RTL:** Supports displaying the component to display in the direction from right to left.
