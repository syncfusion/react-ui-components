import { ReactElement, ReactNode } from 'react';
import { CrudAction, ScrollToMode, SpannedEventPlacement, WeekRule } from './enums';
import { DataManager, Query } from '@syncfusion/react-data';
import { DialogProps, Position, TooltipAnimationOptions } from '@syncfusion/react-popups';
import { OverflowMode } from '@syncfusion/react-navigations';
import { Color, Variant } from '@syncfusion/react-base';
import { ButtonSelectEvent, ItemModel } from '@syncfusion/react-splitbuttons';
import { ValidationRules } from '@syncfusion/react-inputs';
type SchedulerHTMLAttributes = {
    className?: string;
    id?: string;
    tabIndex?: number;
};

/** @private */
export interface VerticalViewProps {

    /**
     * Specifies the start hour displayed in the scheduler view. Times before this hour are hidden from the display.
     * Accepts time in short skeleton format (e.g., '08:00').
     *
     * @default '00:00'
     */
    startHour?: string;

    /**
     * Specifies the end hour displayed in the scheduler view. Times after this hour are hidden from the display.
     * Accepts time in short skeleton format (e.g., '20:00').
     *
     * @default '24:00'
     */
    endHour?: string;

    /**
     * Configures the time slot layout, including interval duration, number of slots per hour, and custom slot templates.
     * Allows fine-grained control over how time is segmented and displayed in the scheduler.
     *
     * @default { enable: true, interval: 60, slotCount: 2, majorSlot: null, minorSlot: null }
     */
    timeScale?: TimeScaleProps;
}

/**
 * Configures custom rendering of the header indent area (left section of the date header).
 * Only active when `showWeekNumber` is `true`; otherwise, this interface is not used or instantiated.
 * Enables positioning of week numbers or custom controls within the left indent header section.
 */
export interface HeaderIndentProps {
    /**
     * ISO week number of the currently rendered period.
     * Useful for tracking weeks across multiple months or years.
     * Only present when `showWeekNumber` is `true`.
     *
     * @default null
     */
    weekNumber?: number | null;
}

/** @private */
export interface SchedulerCommonProps {
    /**
     * Applies a specific date format to all date displays in the scheduler.
     * If not provided, the format defaults to the current culture's standard.
     *
     * @default -
     */
    dateFormat?: string;

    /**
     * When set to `false`, it hides the weekend days of a week from the Scheduler. The days which are not defined in the working days
     * collection are usually treated as weekend days.
     *
     * @default true
     */
    showWeekend?: boolean;

    /**
     * Applies a specific time format to all time displays in the scheduler.
     * If not provided, the format defaults to the current culture's standard.
     *
     * @default -
     */
    timeFormat?: string;

    /**
     * Sets which day appears first in scheduler(0 = Sunday, 1 = Monday, etc.).
     * Respects the locale's default unless explicitly overridden.
     *
     * @default 0
     */
    firstDayOfWeek?: number;

    /**
     * Specifies which days of the week are considered working days.
     * Only these days appear in the work week view; other views highlight them with a distinct style.
     *
     * @default [1, 2, 3, 4, 5]
     */
    workDays?: number[];

    /**
     * Displays the ISO week number in the scheduler's header or date labels.
     * Useful for tracking weeks across multiple months or years.
     *
     * @default false
     */
    showWeekNumber?: boolean;

    /**
     * Renders the scheduler in a non-editable state, preventing all add, edit, and delete operations.
     * Event viewing and navigation remain fully functional.
     *
     * @default false
     */
    readOnly?: boolean;

    /**
     * Accepts a custom React component to render the header cells displaying dates.
     * Can be configured at both the root scheduler level and individual view level.
     *
     * @default null
     */
    dateHeader?: (props: SchedulerDateHeaderProps) => ReactNode;

    /**
     * Accepts a custom React component to render individual scheduler cells.
     * Can be configured at both the root scheduler level and individual view level.
     *
     * @default null
     */
    cell?: (props: SchedulerCellProps) => ReactNode;

    /**
     * Accepts a custom React component to render the header indent area (left section of date header).
     * When provided, replaces the default week number and all-day toggle section.
     * Can be configured at both the root scheduler level and individual view level.
     *
     * @default null
     */
    headerIndent?: (props: HeaderIndentProps) => ReactNode;

    /**
     * Provides a factory function for rendering a custom editor popup; defaults to the built-in editor if not specified.
     * View-level editor props override root-level editor when both are provided.
     *
     * @default null
     */
    editor?: (props: SchedulerEditorProps) => React.ReactNode;

    /**
     * Accepts custom React components to render different sections of the Quick Info Popup.
     * Supports separate customization for new event creation (add) and existing event view (edit).
     *
     * @default null
     */
    quickInfo?: SchedulerQuickInfoProps;

    /**
     * Accepts a custom React component to render resource header cells when grouping is enabled.
     * Replaces the default resource name text with custom content.
     * Can be configured at both the root scheduler level and individual view level.
     *
     * @default null
     */
    resourceHeader?: (props: SchedulerResourceHeaderProps) => ReactNode;
}

/**
 * Represents the event submission details from the scheduler's editor dialog.
 * Contains the modified or newly created event data along with operation context for validation or custom processing.
 * Enables fine-grained control over event persistence with support for cancellation and tracking of original data.
 */
export interface SchedulerEditorSubmitEvent {
    /**
     * The event data to be saved.
     */
    data: EventModel;

    /**
     * Set to true to cancel the save operation.
     */
    cancel?: boolean;

    /**
     * Whether this is a new event (add) or editing existing event.
     */
    requestType: CrudAction;

    /**
     * Original event data (only available for edit mode).
     */
    originalData?: EventModel;
}

/** @private */
export interface SchedulerProps extends SchedulerCommonProps, VerticalViewProps, SchedulerHTMLAttributes {

    /**
     * Sets the initial view type when the scheduler operates in uncontrolled mode.
     * This value is read only on first render; subsequent updates are ignored unless using controlled mode.
     *
     * @default 'Week'
     */
    defaultView?: string;

    /**
     * Controls whether multiple events can occupy the same time slot without visual overlap adjustments.
     * When enabled, overlapping events display side-by-side; when disabled, the scheduler prevents scheduling conflicts.
     *
     * @default true
     */
    eventOverlap?: boolean;

    /**
     * Enables or disables drag-and-drop event repositioning with optional detailed behavior configuration.
     * Set to `true` for default drag behavior, `false` to disable, or provide an object for advanced drag options.
     *
     * @default true
     */
    eventDrag?: boolean | EventDragProps;

    /**
     * Enables or disables automatic validation of recurring event rules.
     * When disabled, recurrence validation is skipped, allowing more flexible but potentially invalid recurrence patterns.
     *
     * @default true
     */
    enableRecurrenceValidation?: boolean;

    /**
     * Enables keyboard shortcuts for navigation and event manipulation within the scheduler.
     * Users can navigate cells, open event editors, and perform other actions using keyboard inputs.
     *
     * @default true
     */
    keyboardNavigation?: boolean;

    /**
     * Configures event resizing with optional detailed behavior settings for snapping and constraints.
     * Set to `true` for default resize behavior, `false` to disable, or provide an object for advanced resize options.
     *
     * @default true
     */
    eventResize?: boolean | EventResizeProps;

    /**
     * Sets the vertical dimension of the scheduler container.
     * Use a specific pixel value (e.g., '600px') for fixed height or 'auto' for responsive sizing.
     *
     * @default auto
     */
    height?: string;

    /**
     * Sets the horizontal dimension of the scheduler container.
     * Use 'auto' to fill the parent container or specify a custom pixel value for fixed width.
     *
     * @default auto
     */
    width?: string;

    /**
     * Marks the currently active date and controls which date range is displayed by the scheduler.
     * Defaults to the system's current date when not specified.
     *
     * @default -
     */
    selectedDate?: Date;

    /**
     * Sets the initial active date when the scheduler operates in uncontrolled mode.
     * This value is read only on first render; subsequent updates are ignored unless using controlled mode.
     *
     * @default new Date()
     */
    defaultSelectedDate?: Date;

    /**
     * Controls the currently displayed view in controlled mode (Day, Week, WorkWeek, or Month).
     * When provided, the scheduler becomes controlled and only updates the view when this prop changes.
     *
     * @default -
     */
    view?: string;

    /**
     * Configures event data binding and field mapping for the scheduler.
     * Supports local arrays, remote data via DataManager, and custom field configurations.
     *
     * @default { dataSource: [], fields: { id: 'Id', subject: 'Subject', startTime: 'StartTime', endTime: 'EndTime', isAllDay: 'IsAllDay', location: 'Location', description: 'Description' } }
     */
    eventSettings?: EventSettings;

    /**
     * Defines the resource collections and field mappings.
     * Allows sharing the scheduler across multiple entities (e.g., rooms, employees).
     *
     * @default []
     */
    resources?: SchedulerResource[];

    /**
     * Configures the layout grouping of multiple resources.
     * When provided, resources are organized in the scheduler layout based on names.
     *
     *  @default []
     */
    group?: SchedulerGroup;

    /**
     * Highlights the standard business hours (default 9 AM to 6 PM) with a distinct color in the scheduler.
     * Can be customized to match your organization's actual working hours.
     *
     * @default { highlight: true, start: '09:00', end: '18:00' }
     */
    workHours?: WorkHoursProps;
    /**
     * Specifies the available options for determining how the first week of the year is calculated.
     * Supported week rule components: FirstDay,FirstFourDayWeek,FirstFullWeek.
     * @default WeekRule.FirstDay
     */
    weekRule?: WeekRule;
    /**
     * Displays a moving indicator showing the current system time within the scheduler.
     * Helps users quickly identify the present moment during event planning.
     *
     * @default true
     */
    showTimeIndicator?: boolean;

    /**
     * Automatically adjusts cell heights based on the number of events in each time slot.
     * Prevents event overflow and improves readability when multiple events occupy the same slot.
     *
     * @default false
     */
    rowAutoHeight?: boolean;

    /**
     * Configures or replaces the Scheduler header.
     * - true: renders the built-in header
     * - false: hides the header entirely
     * - (props) => ReactNode: renders a custom SchedulerHeader composition with provided props
     *
     * @default true
     */
    header?: boolean | ((props: SchedulerHeaderProps) => React.ReactNode);

    /**
     * Displays a compact popup with event or cell details when clicked.
     * Provides a quick preview without opening the full event editor.
     *
     * @default true
     */
    showQuickInfoPopup?: boolean;

    /** Enables appointment tooltip. Set to true for default tooltip, false to disable, or provide props to customize
     *
     *  @default false
     */
    eventTooltip?: boolean | SchedulerTooltipProps;

    /** Fires before each tooltip opens. Set args.cancel = true to suppress.
     *
     * @event onTooltipOpen
     */
    onTooltipOpen?: (args: SchedulerTooltipOpenEvent) => void;

    /**
     * Fired before event data is loaded from the data source or remote server.
     * Useful for preprocessing or validating data before it renders in the scheduler.
     *
     * @event onDataBind
     */
    onDataBind?: (event: SchedulerDataBindEvent) => void;

    /**
     * Fired before data is requested from the data source.
     * Use to preprocess, cancel, or attach an async promise.
     *
     * @event onDataRequest
     */
    onDataRequest?: (event: SchedulerDataRequestEvent) => void | Promise<void>;

    /**
     * Fired when the user changes the active date in the scheduler.
     * Use this to synchronize the scheduler with other components or perform related actions.
     *
     * @event onSelectedDateChange
     */
    onSelectedDateChange?: (event: SchedulerDateChangeEvent) => void;

    /**
     * Fired when the user switches between different view types (Day, Week, Month, etc.).
     * Useful for updating UI state or loading view-specific data.
     *
     * @event onViewChange
     */
    onViewChange?: (event: SchedulerViewChangeEvent) => void;

    /**
     * Fired at the start of any scheduler data modification (add, edit, or delete).
     * Can be used to validate changes or display loading indicators.
     *
     * @event onDataChangeStart
     */
    onDataChangeStart?: (event: SchedulerDataChangeEvent) => void;

    /**
     * Fired after a scheduler data modification successfully completes.
     * Useful for refreshing dependent components or displaying success confirmations.
     *
     * @event onDataChangeComplete
     */
    onDataChangeComplete?: (event: SchedulerDataChangeEvent) => void;

    /**
     * Fired when a scheduler cell is clicked (or tapped on mobile devices).
     * Useful for custom cell selection logic or triggering event creation dialogs.
     *
     * @event onCellClick
     */
    onCellClick?: (event: SchedulerCellClickEvent) => void;

    /**
     * Fired when a scheduler cell is double-clicked.
     * Commonly used to open an event creation form for the selected time slot.
     *
     * @event onCellDoubleClick
     */
    onCellDoubleClick?: (event: SchedulerCellClickEvent) => void;

    /**
     * Fired when an event is clicked (or tapped on mobile devices).
     * Use this to display event details or trigger custom event workflows.
     *
     * @event onEventClick
     */
    onEventClick?: (event: SchedulerEventClickEvent) => void;

    /**
     * Fired when an event is double-clicked (or double-tapped on mobile devices).
     * Typically opens the event editor for viewing or modifying event details.
     *
     * @event onEventDoubleClick
     */
    onEventDoubleClick?: (event: SchedulerEventClickEvent) => void;

    /**
     * Fired when the user begins dragging an event.
     * Can be used to cancel the drag, apply restrictions, or trigger visual feedback.
     *
     * @event onDragStart
     */
    onDragStart?: (event: SchedulerDragEvent) => void;

    /**
     * Fired continuously while an event is being dragged across time slots.
     * Useful for real-time validation or updating dependent UI elements.
     *
     * @event onDrag
     */
    onDrag?: (event: SchedulerDragEvent) => void;

    /**
     * Fired when the user releases an event after dragging it.
     * Can be used to apply final validation or persist changes to the data source.
     *
     * @event onDragStop
     */
    onDragStop?: (event: SchedulerDragEvent) => void;

    /**
     * Fired when the user clicks the "+n more events" indicator in Month view.
     * Useful for opening the agenda view to show all events for a specific date.
     *
     * @event onMoreEventsClick
     */
    onMoreEventsClick?: (event: SchedulerMoreEventsClickEvent) => void;

    /**
     * Fired when the user grabs an event resize handle to begin resizing.
     * Can be used to validate or cancel the resize operation.
     *
     * @event onResizeStart
     */
    onResizeStart?: (event: SchedulerResizeEvent) => void;

    /**
     * Fired continuously while the user is dragging an event resize handle.
     * Useful for real-time duration validation or preview updates.
     *
     * @event onResizing
     */
    onResizing?: (event: SchedulerResizeEvent) => void;

    /**
     * Fired when the user releases the resize handle after adjusting an event's duration.
     * Can be used for final validation or to persist the new event duration.
     *
     * @event onResizeStop
     */
    onResizeStop?: (event: SchedulerResizeEvent) => void;

    /**
     * Fired when an error occurs during a scheduler operation (e.g., data loading, event validation).
     * Useful for logging errors or displaying error messages to the user.
     *
     * @event onError
     */
    onError?: (event: Error) => void;

    /**
     * Specifies the available view components as children to enable specific calendar views.
     * Supported view components: DayView, WeekView, WorkWeekView, MonthView, and AgendaView.
     *
     * @default null
     * @private
     */
    children?: React.ReactNode;

    /**
     * Fired when an event is submitted in the editor window.
     * Allows validation and cancellation.
     *
     * @event onEditorSubmit
     */
    onEditorSubmit?: (args: SchedulerEditorSubmitEvent) => void;

    /**
     * Specifies the initial scroll behavior of the main content area.
     * When set, the scheduler automatically scrolls to the defined target after the view has finished rendering.
     */
    scrollToSettings?: SchedulerScrollToProps;

    /**
     * Assigns a specific IANA timezone used to render and interpret all scheduler dates and events.
     * When provided, event date-times (for example, UTC timestamps or values with offsets) are displayed
     * and treated in this timezone so that event times remain consistent across different client systems.
     * This is recommended for schedulers bound to remote or shared data sources to avoid client-local
     * timezone shifts affecting displayed times.
     * Accepts standard IANA timezone identifiers (for example, 'America/New_York').
     *
     * @default timezoneData (uses client system timezone)
     */
    timezone?: string;

    /**
     * Optional list of timezones to display in the editor timezone selector.
     * Each item includes a display text and timezone value (e.g., `[{ text: 'Eastern', value: 'America/New_York' }]`).
     *
     * @default timezoneData (timezone dataSource)
     */
    timezoneDataSource?: TimezoneFields[];
}

/**
 * Event arguments passed to resize lifecycle callbacks (onResizeStart, onResizing, onResizeStop).
 * Handlers can modify properties like cancel, interval, or scrolling behavior to control the resize operation.
 */
export interface SchedulerResizeEvent {
    /**
     * Set to true to prevent the resize operation and revert to the original event duration.
     */
    cancel?: boolean;

    /**
     * Contains the event data being resized.
     */
    data?: EventModel;

    /**
     * The native mouse or touch event triggering the resize action.
     */
    event?: MouseEvent | TouchEvent;

    /**
     * The proposed new start time after resizing. Can be modified by handlers to enforce custom business logic.
     */
    startTime?: Date;

    /**
     * The proposed new end time after resizing. Can be modified by handlers to enforce custom business logic.
     */
    endTime?: Date;
}

/**
 * Event arguments passed to drag-and-drop lifecycle callbacks (onDragStart, onDrag, onDragStop).
 * Handlers can modify properties like cancel, interval, or scroll options to control the drag operation.
 */
export interface SchedulerDragEvent {
    /**
     * Set to true to cancel the drag operation and prevent the event from moving.
     */
    cancel?: boolean;

    /**
     * The DOM element currently being dragged.
     */
    element?: HTMLElement;

    /**
     * The native mouse or touch event triggering the current drag tick.
     */
    event?: MouseEvent | TouchEvent;

    /**
     * The DOM element currently under the pointer that may serve as a drop target.
     */
    target?: HTMLElement;

    /**
     * Contains the event data being dragged.
     */
    data?: EventModel;

}

/** @private */
export interface ViewSpecificProps extends VerticalViewProps, MonthViewProps, AgendaViewProps {}

/** @private */
export interface CommonViewProps {
    /**
     * Controls whether multiple events can occupy the same time slot without visual overlap adjustments.
     * When enabled, overlapping events display side-by-side; when disabled, the scheduler prevents scheduling conflicts.
     *
     * @default true
     */
    eventOverlap?: boolean;

    /**
     * Multiplies the view's time range by this number (e.g., interval: 2 shows 2 weeks in Week view).
     * Useful for displaying extended periods in a single view.
     *
     * @default 1
     */
    interval?: number;

    /**
     * A unique identifier for the view used in programmatic view switching.
     * Custom names allow flexible view management without relying on standard view names.
     *
     * @default -
     */
    name?: string;

    /**
     * A user-friendly label for the view displayed in the view switcher.
     * Useful when the same view type is configured with different intervals or custom settings.
     *
     * @default -
     */
    displayName?: string;

    /**
     * Accepts a custom React component to render events in this specific view.
     * View-level templates override the root-level event template when both are provided.
     *
     * @default null
     */
    eventTemplate?: (props: EventModel) => ReactNode;
}

/**
 * Configures the day view display in the React Scheduler component.
 * Provides properties for customizing time slot layout, overlap behavior, and event rendering for single-day views.
 * Inherits all scheduler common properties while supporting view-specific customizations.
 */
export interface DayViewProps extends SchedulerCommonProps, VerticalViewProps, CommonViewProps {}

/**
 * Configures the week view display in the React Scheduler component.
 * Provides properties for customizing time slot layout, overlap behavior, and event rendering for seven-day week views.
 * Inherits all scheduler common properties while supporting view-specific customizations.
 */
export interface WeekViewProps extends SchedulerCommonProps, VerticalViewProps, CommonViewProps {}

/**
 * Configures the work week view display in the React Scheduler component.
 * Provides properties for customizing time slot layout, overlap behavior, and event rendering for working days only.
 * Inherits all scheduler common properties while supporting view-specific customizations.
 */
export interface WorkWeekViewProps extends SchedulerCommonProps, VerticalViewProps, CommonViewProps {}

/**
 * Configures the month view display in the React Scheduler component.
 * Provides properties for customizing week display, event rendering per cell, and month-specific layout options.
 * Inherits all scheduler common properties while supporting specialized month view customizations.
 */
export interface MonthViewProps extends SchedulerCommonProps, CommonViewProps {

    /**
     * Sets the starting week for month view rendering. If not specified, the view begins with the first week of the month.
     * Useful for aligning the calendar display with custom fiscal or organizational calendars.
     *
     * @default null
     */
    displayDate?: Date;

    /**
     * Restricts the number of weeks displayed in month view, allowing partial month display.
     * Combine with displayDate to show custom date ranges like a 2-week preview.
     *
     * @default null
     */
    numberOfWeeks?: number;

    /**
     * Accepts a custom React component to render weekday headers (Monday, Tuesday, etc.) in month view.
     * Enables custom styling or localization of day names.
     *
     * @default null
     */
    weekDay?: (props: SchedulerWeekDayProps) => ReactNode;

    /**
     * Accepts a custom React component to render the content of month view date cells.
     * Useful for adding event counts, holiday indicators, or other custom cell decorations.
     *
     * @default null
     */
    cellHeader?: (props: SchedulerCellHeaderProps) => ReactNode;

    /**
     * Controls whether grayed-out dates from the previous and next months appear in month view.
     * Set to false to show only the current month's dates for a cleaner appearance.
     *
     * @default true
     */
    showTrailingAndLeadingDates?: boolean;

    /**
     * Limits the number of events displayed per row in month view cells.
     * Excess events are collapsed into a "+n more" indicator to conserve space.
     *
     * @default null
     */
    maxEventsPerRow?: number;
}

/**
 * Configures the Agenda View for displaying events in a chronological, date-grouped list format.
 * Agenda View is read-only and does not support drag-drop or resize interactions; it focuses on event review and navigation.
 */
export interface AgendaViewProps extends SchedulerCommonProps, CommonViewProps {
    /**
     * Number of days to display in the Agenda View.
     * Events within this date range are grouped chronologically and displayed as a scrollable list.
     *
     * @default 7
     */
    agendaDaysCount?: number;

    /**
     * Hides dates with no scheduled events in applicable views (e.g., Agenda View).
     * When enabled, empty dates are filtered out to show only dates with events.
     *
     * @default true
     */
    hideEmptyAgendaDays?: boolean;

    /**
     * Custom template to display when no events are scheduled in the Agenda View.
     * Allows users to provide a function that returns a React node for customization of the empty state.
     *
     * @default null
     */
    noEventsTemplate?: () => React.ReactNode;
}

/**
 * Defines a single resource configuration for the scheduler.
 */
export interface SchedulerResource {
    /**
     * Specifies the unique resource name.
     */
    name: string;

    /**
     * Specifies the field name to bind to the event object.
     */
    field: string;

    /**
     * Specifies the title of the resource field for the editor window.
     */
    title: string;

    /**
     * Specifies whether multiple resources can be selected.
     *
     * @default false
     */
    multiple?: boolean;

    /**
     * Specifies the resource dataSource.
     *
     * @default []
     */
    dataSource?: Record<string, unknown>[] | DataManager;

    /**
     * Specifies the resource ID field name.
     */
    idField: string;

    /**
     * Specifies the resource text field name.
     */
    textField: string;

    /**
     * Specifies the resource color field name.
     *
     * @default null
     */
    colorField?: string;

    /**
     * Specifies the parent group ID field name.
     *
     * @default null
     */
    groupIDField?: string;

    /**
     * Specifies the CSS class field name for the resource.
     *
     * @default null
     */
    cssClassField?: string;
}

/** Configures grouping settings for multiple resources. */
export interface SchedulerGroup {
    /**
     * Specifies the resource group names in order.
     *
     * @default []
     */
    resources: string[];

    /**
     * Specifies whether dates are rendered under each resource.
     *
     * @default false
     */
    byDate?: boolean;

    /**
     * Specifies whether child resources are grouped by parent groupID.
     *
     * @default true
     */
    byGroupID?: boolean;
}

/** * Configures event data binding and field mapping for the scheduler component.
 * Supports local data arrays, remote data sources via DataManager, and custom field definitions for flexible data integration.
 * Enables customization of data source operations, event visibility controls, and advanced rendering options like event indicators.
 */
export interface EventSettings {

    /**
     * The event data source for the scheduler, supporting local arrays or remote DataManager instances.
     * Events are automatically bound to the scheduler upon initialization without requiring manual configuration.
     *
     * @default []
     */
    dataSource?: Record<string, unknown>[] | DataManager;

    /**
     * Maps your data source field names to scheduler event properties (id, subject, startTime, etc.).
     * Eliminates the need for data transformation, directly connecting your existing data structure to the scheduler.
     *
     * @default { id: 'Id', subject: 'Subject', startTime: 'StartTime', endTime: 'EndTime', isAllDay: 'IsAllDay', location: 'Location', description: 'Description' }
     */
    fields?: EventFields;

    /**
     * Enables or disables the ability to edit existing events in the scheduler.
     * When disabled, existing events cannot be modified.
     *
     * @default true
     */
    allowEditing?: boolean;

    /**
     * Enables or disables the ability to create new events in the scheduler.
     * When disabled, users cannot add new events to the scheduler.
     *
     * @default true
     */
    allowAdding?: boolean;

    /**
     * Enables or disables the ability to delete events from the scheduler.
     * When disabled, users cannot remove existing events from the scheduler.
     *
     * @default true
     */
    allowDeleting?: boolean;

    /**
     * Provides a custom React component to render event content across all scheduler views.
     * Individual view-level templates take precedence over this root-level template when both are configured.
     *
     * @default null
     */
    template?: (props: EventModel) => ReactNode;

    /**
     * Determines how multi-day events (longer than 24 hours) are positioned in the scheduler.
     * Set to 'AllDayRow' to display in the all-day section for clarity, or within time slots for compact layouts.
     *
     * @default 'AllDayRow'
     */
    spannedEventPlacement?: SpannedEventPlacement;

    /**
     * When enabled, events automatically expand to fill available cell space with excess events managed by a "+n more" indicator.
     * Improves readability for cells containing many events without compromising layout stability.
     *
     * @default false
     */
    enableIndicator?: boolean;

    /**
     * When enabled, removes vertical gaps between events in cells, allowing tighter, more compact event packing.
     * Maximizes cell usage when displaying many events in high-density scheduling scenarios.
     *
     * @default false
     */
    ignoreWhitespace?: boolean;

    /**
     * Applies a pre-configured query to the data source for filtering, sorting, or advanced operations.
     * Essential when working with remote data sources requiring complex filtering, sorting, or pagination logic.
     *
     * @default null
     */
    query?: Query;

    /**
     * Enables or disables the "Following Events" option in recurrence edit/delete dialogs.
     * When enabled, users can choose to edit or delete this and all following occurrences of a recurring event.
     * When disabled, only "Edit Event" and "Edit Series" options are shown.
     * The following events feature allows splitting a recurring series at a specific date into two independent series.
     *
     * @default false
     */
    editFollowingEvents?: boolean;

    /**
     * Specifies the resource name used to determine which resource level's color will be applied to appointments when scheduler grouping is enabled.
     *
     * @default null
     */
    resourceColorField?: string;
}

/**
 * Configures how time slots are divided and rendered in day, week, and work week views.
 * Supports custom intervals, slot counts, and templated display of time labels with major and minor slot customizations.
 * Enables granular control over time granularity and visual representation of scheduler time divisions.
 */
export interface TimeScaleProps {

    /**
     * Enables or disables the time scale (hour/minute divisions) in day, week, and work week views.
     * When disabled, the time scale section is completely hidden from the scheduler.
     *
     * @default true
     */
    enable?: boolean;

    /**
     * Specifies the interval duration for each time slot in minutes (e.g., 30 for 30-minute slots).
     * Smaller intervals provide finer scheduling granularity; larger intervals simplify the time grid.
     *
     * @default 60
     */
    interval?: number;

    /**
     * Number of subdivisions for each major time slot interval (e.g., a value of 2 creates two 30-minute slots within 60 minutes).
     * Controls the granularity of minor time divisions visible in the scheduler's time scale.
     *
     * @default 2
     */
    slotCount?: number;

    /**
     * Provides a custom React component to render the primary (hourly) time labels in the scheduler's time scale.
     * Enables custom formatting, styling, or localization of major time divisions.
     *
     * @default null
     */
    majorSlot?: (props: TimeSlotProps) => ReactNode;

    /**
     * Provides a custom React component to render secondary (minute-level) time labels within each major time slot.
     * Enables detailed time formatting, custom styling, or alternative time label representations.
     *
     * @default null
     */
    minorSlot?: (props: TimeSlotProps) => ReactNode;
}

/**
 * Defines the business hours configuration for visual highlighting and reference in the scheduler.
 * Enables users to quickly identify standard working hours during event planning with customizable start and end times.
 * Supports visual emphasis through distinct background colors while maintaining the time range for reference purposes.
 */
export interface WorkHoursProps {

    /**
     * Enables visual highlighting of the work hours time range with a distinct background color.
     * When disabled, the time range is used only for reference without visual emphasis.
     *
     * @default false
     */
    highlight?: boolean;

    /**
     * Sets the start time of the business hours range (e.g., '09:00' for 9 AM).
     * Accepts time in short skeleton format.
     *
     * @default '09:00'
     */
    start?: string;

    /**
     * Sets the end time of the business hours range (e.g., '18:00' for 6 PM).
     * Accepts time in short skeleton format.
     *
     * @default '18:00'
     */
    end?: string;

}

/**
 * Maps scheduler event model properties to corresponding data source fields.
 * Enables the scheduler to correctly interpret event data from various data structures with minimal transformation overhead.
 * Supports configuration of all standard event fields including recurrence rules, read-only flags, and blocking indicators.
 */
export interface EventFields {
    /**
     * Maps the unique event identifier field enabling add, update, and delete operations.
     * This field is essential for all CRUD operations in the scheduler.
     *
     * @default 'Id'
     */
    id?: string;

    /**
     * Maps the event title or subject field displayed in the scheduler's event cells.
     * Provides a concise name or description for each event.
     *
     * @default 'Subject'
     */
    subject?: string;

    /**
     * Maps the event start time field that determines when an event begins on the scheduler.
     * This field is required for all valid event records.
     *
     * @default 'StartTime'
     */
    startTime?: string;

    /**
     * Maps the event end time field that determines when an event concludes on the scheduler.
     * This field is required for all valid event records.
     *
     * @default 'EndTime'
     */
    endTime?: string;

    /**
     * Maps the boolean flag indicating all-day events that span entire days without specific times.
     * Ideal for holidays, birthdays, task deadlines, or any events not tied to specific hours.
     *
     * @default 'IsAllDay'
     */
    isAllDay?: string;

    /**
     * Maps the event location or venue field displayed alongside event details for context.
     * Helps users understand where the event takes place (physical or virtual location).
     *
     * @default 'Location'
     */
    location?: string;

    /**
     * Maps the event description or detailed notes field that provides supplementary information.
     * Displayed in event detail views, tooltips, or custom event templates.
     *
     * @default 'Description'
     */
    description?: string;

    /**
     * Maps the read-only flag indicating whether an event can be modified or deleted by users.
     * When true, the event is protected from editing or deletion operations.
     *
     * @default 'IsReadonly'
     */
    isReadonly?: string;

    /**
     * Maps the blocking flag indicating whether an event reserves a time slot blocking other event scheduling.
     * Useful for maintenance windows, meetings, blocked time, or unavailable periods.
     *
     * @default 'IsBlock'
     */
    isBlock?: string;

    /**
     * Maps the recurrence rule field in RFC 5545 format (e.g., 'FREQ=DAILY;INTERVAL=1;UNTIL=2025-12-31').
     * Defines how events repeat across days, weeks, months, or years for recurring event management.
     *
     * @default 'RecurrenceRule'
     */
    recurrenceRule?: string;

    /**
     * Maps the parent recurring event identifier linking individual exception occurrences to the original series.
     * Used internally to manage and track modified instances within a recurring event series.
     *
     * @default 'RecurrenceID'
     */
    recurrenceID?: string | number;

    /**
     * Maps the recurrence exception rule field in RFC 5545 format (e.g., 'EXDATE=2024-01-01,2024-02-01').
     * Specifies dates or rules for excluding specific occurrences from a recurring event series.
     *
     * @default 'RecurrenceException'
     */
    recurrenceException?: string;

    /**
     * Maps the internal unique identifier field generated by the scheduler for tracking events.
     * Used internally for scheduler operations and should not be manually modified.
     *
     * @private
     * @default 'Guid'
     */
    guid?: string;

    /**
     * Maps the parent following event identifier linking occurrences to a "following events" modified series.
     * Only set when this occurrence was created via a "Following Events" edit/delete operation.
     * Used separately from recurrenceID to identify occurrences in the modified (following) branch.
     *
     * @default 'FollowingId'
     */
    followingId?: string | number;

    /**
     * Maps the timezone field for the event start time (e.g., 'America/New_York').
     * Allows custom mapping of timezone metadata for event start times.
     * Should be omitted for all-day events.
     *
     * @default 'StartTimezone'
     */
    startTimezone?: string;

    /**
     * Maps the timezone field for the event end time (e.g., 'America/New_York').
     * Allows custom mapping of timezone metadata for event end times.
     * Should be omitted for all-day events.
     *
     * @default 'EndTimezone'
     */
    endTimezone?: string;
}

/**
 * Represents the complete data structure of a single event in the scheduler.
 * Contains all event details including timing, location, and recurrence information, with support for custom properties.
 * Provides a unified interface for event manipulation across all scheduler views and operations.
 */
export interface EventModel {

    /**
     * A unique identifier for the event used in update and delete operations.
     * Can be a string or number depending on your data source configuration.
     */
    id?: string | number;

    /**
     * The event title or heading displayed in all scheduler views and event cards.
     * Provides a concise summary of the event's purpose or topic.
     */
    subject?: string;

    /**
     * The exact date and time when the event begins, determining its position in the scheduler.
     * Must be a valid JavaScript Date object for proper scheduling.
     */
    startTime?: Date;

    /**
     * The exact date and time when the event concludes, determining its duration in the scheduler.
     * Must be a valid JavaScript Date object later than the start time.
     */
    endTime?: Date;

    /**
     * When true, the event spans the entire day and appears in the all-day row above timed events.
     * Ideal for holidays, birthdays, deadlines, or events without specific times.
     */
    isAllDay?: boolean;

    /**
     * The physical location or venue where the event occurs (in-person or virtual meeting link).
     * Displayed alongside event details for attendee reference and planning.
     */
    location?: string;

    /**
     * Additional notes, agenda items, or context for the event provided to attendees.
     * Visible in event detail views, popups, or custom event templates.
     */
    description?: string;

    /**
     * When true, prevents the event from being edited or deleted by end users.
     * Useful for protecting critical events or events managed by administrators only.
     */
    isReadonly?: boolean;

    /**
     * When true, marks the event as a time block preventing scheduling of other events in the same slot.
     * Commonly used for meetings, lunch breaks, maintenance windows, or reserved availability.
     */
    isBlock?: boolean;

    /**
     * Recurrence rule string in RFC 5545 format (e.g., 'FREQ=DAILY;INTERVAL=1;UNTIL=2025-12-31').
     * Defines event repetition patterns for daily, weekly, monthly, or yearly recurrence.
     */
    recurrenceRule?: string;

    /**
     * The parent recurring event identifier linking this exception occurrence back to the original series.
     * Used internally to manage and track modified instances within recurring event series.
     */
    recurrenceID?: string | number;

    /**
     * Recurrence exception rule string in RFC 5545 format (e.g., 'EXDATE=2024-01-01,2024-02-01').
     * Specifies dates or rules for skipping or excluding specific occurrences from a recurring series.
     */
    recurrenceException?: string;

    /**
     * The parent event identifier linking this occurrence to a "following events" modified series.
     * Only set when this event was created via a "Following Events" edit/delete operation.
     * Used separately from recurrenceID to identify occurrences in the modified (following) branch.
     * When present, the event belongs to an independent recurrence series created by splitting at a specific date.
     */
    followingId?: string | number;

    /**
     * The IANA timezone identifier for the event start (for example, 'America/New_York').
     * When provided, the scheduler treats `startTime` as occurring in that timezone and
     * converts it to the user's/local timezone for display, sorting, and duration calculations.
     * Format: IANA TZ database name (e.g. 'Europe/London', 'America/Los_Angeles').
     * Example: `{ startTime: new Date('2026-05-15T09:00:00'), startTimezone: 'America/New_York' }`
     *
     * @default undefined
     */
    startTimezone?: string;

    /**
     * The IANA timezone identifier for the event end (for example, 'America/New_York').
     * When provided, the scheduler treats `endTime` as occurring in that timezone and
     * converts it to the user's/local timezone for display, sorting, and duration calculations.
     * Format: IANA TZ database name (e.g. 'Europe/London', 'America/Los_Angeles').
     * Example: `{ endTime: new Date('2026-05-15T10:00:00'), endTimezone: 'America/New_York' }`
     *
     * @default undefined
     */
    endTimezone?: string;

    /**
     * Supports custom properties beyond standard event fields for flexible event data modeling.
     * Allows extending event objects with domain-specific attributes and metadata.
     */
    [key: string]: unknown;

    /**
     * Internal unique identifier generated by the scheduler for event tracking.
     *
     * @internal
     */
    guid?: string;
}

/**
 * Event arguments provided when a scheduler cell is clicked or tapped on mobile devices.
 * Contains the cell's time range, all-day status, and interaction details for custom event handling and validation.
 * Enables developers to implement custom cell selection logic or prevent default cell click behaviors.
 */
export interface SchedulerCellClickEvent {

    /**
     * The native browser MouseEvent triggered by the cell interaction.
     * Provides access to event properties like button, coordinates, and modifier keys.
     */
    nativeEvent: MouseEvent;

    /**
     * The start time of the clicked time slot or date cell.
     * Represents the beginning of the time range for the selected cell.
     */
    startTime: Date;

    /**
     * The end time of the clicked time slot or date cell.
     * Represents the end of the time range for the selected cell.
     */
    endTime: Date;

    /**
     * Indicates whether the clicked cell belongs to the all-day row (true) or a timed slot (false).
     * Useful for determining the type of cell and applying appropriate event creation logic.
     */
    isAllDay: boolean;

    /**
     * The DOM element that was clicked, enabling direct manipulation or style inspection if needed.
     * Useful for custom styling or finding parent elements.
     */
    element?: HTMLElement;

    /**
     * Set to true to cancel the default cell click behavior (e.g., preventing auto-opening event creation dialogs).
     * Allows custom handling of cell clicks without triggering default actions.
     */
    cancel?: boolean;

    /**
     * Unique index identifying the resource group.
     */
    groupIndex?: number;
}

/**
 * Event arguments provided when a scheduler event is clicked or tapped on mobile devices.
 * Contains the complete event data and DOM reference for custom interaction handling and event manipulation.
 * Enables developers to trigger custom workflows or prevent default event editing behaviors.
 */
export interface SchedulerEventClickEvent {

    /**
     * The native React MouseEvent triggered by clicking the event element.
     * Provides access to browser event properties, coordinates, and interaction details.
     */
    event?: React.MouseEvent;

    /**
     * The complete event data object containing all event properties, custom fields, and metadata.
     * Provides full context for event manipulation and custom workflow logic.
     */
    data: Record<string, any>;

    /**
     * The DOM element of the clicked event, enabling direct styling, inspection, or parent element access.
     * Useful for custom styling or element manipulation.
     */
    element?: HTMLElement;

    /**
     * Set to true to cancel the default event click behavior (e.g., preventing auto-opening the event editor).
     * Allows custom handling of event clicks without triggering default actions.
     */
    cancel?: boolean;
}

/**
 * Event arguments provided when the "+n more events" indicator is clicked in the scheduler's Month view.
 * Contains all events for the clicked date or time slot to enable custom display or filtering logic.
 * Enables developers to implement custom event expansion behaviors or alternative event display strategies.
 */
export interface SchedulerMoreEventsClickEvent {
    /**
     * Set to true to cancel the more events popup expansion and implement custom event display logic.
     * Allows full control over how overflowing events are presented to users.
     */
    cancel?: boolean;

    /**
     * An array of all event objects for the clicked date or time slot.
     * Provides context for custom display, filtering, or aggregation logic.
     */
    data: Record<string, any>[];
}

/**
 * Represents a single time division in the scheduler's time scale (e.g., 9:00 AM, 9:30 AM).
 * Used in custom time slot templates to render hour or minute labels with context about the slot's position.
 * Enables developers to create specialized time label formatting or localization strategies.
 */
export interface TimeSlotProps {
    /**
     * The exact date and time represented by this time slot division in the scheduler.
     * Useful for formatting custom time labels or applying time-specific logic.
     */
    date: Date;

    /**
     * Indicates whether this slot is a major division (hourly) or minor division (sub-hourly time subdivision).
     * Values: 'majorSlot' for primary hour labels, 'minorSlot' for minute subdivisions.
     */
    type: string;
}

/**
 * Represents a single scheduler cell for custom rendering in day, week, or month views.
 * Provides context about the cell's date and type to enable conditional rendering logic and styling.
 * Enables developers to implement custom cell templates with awareness of view type and time range.
 */
export interface SchedulerCellProps {

    /**
     * The start date and time of the scheduler cell, determining its position in the view.
     * Used for cell positioning, event assignment, and custom rendering logic.
     */
    date: Date;

    /**
     * Identifies the cell type for conditional rendering and styling logic.
     * Values: 'monthCell' for month view or 'workCell' for time-slot cells in day/week views.
     */
    type: string;
}

/**
 * Represents a date header cell in the scheduler's header row across day, week, or month views.
 * Used in custom date header templates to render date-specific content with full formatting control.
 * Enables developers to create custom date display strategies or localization approaches.
 */
export interface SchedulerDateHeaderProps {

    /**
     * The date displayed in the header cell, useful for formatting or rendering date-specific content.
     * Provides context for custom date display strategies and localization.
     */
    date: Date;
}

/**
 * Represents a month view cell header in the scheduler for rendering date information or custom decorations.
 * Provides the cell's date context to enable custom header rendering with awareness of month view positioning.
 * Enables developers to create specialized date headers with event counts, holidays, or other indicators.
 */
export interface SchedulerCellHeaderProps {

    /**
     * The date of the cell header, enabling date-aware custom rendering and styling strategies.
     * Useful for adding event counts, holidays, or other date-specific decorations.
     */
    date: Date;
}

/**
 * Represents a weekday label (e.g., "Monday", "Tuesday") in the scheduler's header row across all views.
 * Used in custom weekday templates for rendering or localizing day names with full formatting control.
 * Enables developers to implement custom day labels or alternative localization approaches.
 */
export interface SchedulerWeekDayProps {

    /**
     * The name or label of the weekday (e.g., "Monday") for display in the scheduler header.
     * Used for custom formatting, localization, or alternative day label representations.
     */
    day: string;
}

/**
 * Represents a resource header cell in the scheduler's grouped header row.
 * Used in custom resource header templates to render custom content for each resource header.
 */
export interface SchedulerResourceHeaderProps {
    /**
     * The raw resource data object from the resource's `dataSource`.
     * Contains all fields defined in the resource configuration (e.g., name, color, id).
     */
    resourceData: Record<string, any>;

    /**
     * The resource configuration that this header belongs to.
     * Provides access to field mappings such as `textField`, `idField`, and `colorField`.
     */
    resource: SchedulerResource;
}

/**
 * Provides granular configuration for the Scheduler event resize behavior.
 * Allows fine-tuned control over how events can be resized, including snapping intervals,
 * directional constraints, and automatic scrolling during resize operations.
 */
export interface EventResizeProps {
    /**
     * Enables or disables the ability to resize events throughout the scheduler.
     * When disabled, resize handles are hidden and event durations cannot be modified.
     *
     * @default true
     */
    enable: boolean;

    /**
     * Specifies the snapping granularity in minutes while resizing events (e.g., 15 for 15-minute increments).
     * When not specified, defaults to the timeScale interval divided by slotCount for optimal alignment.
     *
     * @default Derived from timeScale configuration
     */
    interval?: number;

    /**
     * When enabled, allows events to be resized to zero duration (start time equals end time).
     * When disabled, the minimum event duration is enforced as one interval unit to prevent invalid states.
     *
     * @default false
     */
    resizeToZero?: boolean;

    /**
     * Enables or disables the ability to drag the start edge of an event to change its start time.
     * When disabled, the start time cannot be modified through resizing.
     *
     * @default true
     */
    startResizable?: boolean;

    /**
     * Enables or disables the ability to drag the end edge of an event to change its end time.
     * When disabled, the end time cannot be modified through resizing.
     *
     * @default true
     */
    endResizable?: boolean;

    /**
     * Configures auto-scroll behavior when the user drags a resize handle near the viewport edges.
     * Enables continuous scrolling to allow extending events beyond the visible area.
     *
     */
    scroll?: SchedulerDragScrollProps;
}

/**
 * Provides granular configuration for the Scheduler event drag-and-drop behavior.
 * Enables fine-tuned control over event movement, including snapping intervals, scroll behavior,
 * auto-navigation to adjacent date ranges, and external drag-and-drop capabilities.
 */
export interface EventDragProps {
    /**
     * Enables or disables the ability to drag events throughout the scheduler.
     * When disabled, events remain stationary but remain interactive for other operations.
     *
     * @default true
     */
    enable: boolean;

    /**
     * Specifies the snapping interval in minutes for drag operations (e.g., 15 for 15-minute increments).
     * When not specified, defaults to (timeScale interval / slotCount) or 30 minutes for optimal alignment.
     *
     * @default Derived from timeScale configuration
     */
    interval?: number;

    /**
     * Comma-separated CSS selectors matching elements that should not accept dropped events.
     * Example: '.read-only-cell, .blocked-time' prevents dropping onto read-only or blocked cells.
     *
     * @default ''
     */
    excludeSelectors?: string;

    /**
     * Configures auto-scroll behavior when dragging events near the scheduler viewport edges.
     * Ensures users can drag events beyond the currently visible time range.
     *
     */
    scroll?: SchedulerDragScrollProps;

    /**
     * Configures automatic navigation to previous/next date ranges when the user holds
     * the pointer at extreme edges during dragging. Enables seamless dragging across weeks or months.
     *
     */
    navigation?: SchedulerNavigateProps;

    /**
     * Enables external drag-and-drop using native HTML5 drag and drop API for cross-component event moving.
     * When enabled, events can be dragged outside the scheduler or from external elements into the scheduler.
     *
     * @private
     * @default false
     */
    externalDragAndDrop?: boolean;

    /**
     * CSS selector restricting the draggable area for events (e.g., '.scheduler-container' limits dragging within that container).
     * Set to null or undefined to allow unrestricted dragging throughout the page.
     *
     * @private
     * @default null
     */
    eventDragArea?: string | null;
}

/**
 * Configures automatic navigation behavior when dragging events at viewport extremes.
 * When the user holds an event at the edge of the visible time range, the scheduler
 * automatically navigates to the next or previous time period to enable extended dragging.
 *
 */
export interface SchedulerNavigateProps {
    /**
     * Enables or disables automatic navigation when the user holds an event at viewport extremes during dragging.
     * When enabled, the scheduler automatically moves to the next or previous time period for extended dragging.
     *
     * @default false
     */
    enable: boolean;

    /**
     * Specifies the hold delay in milliseconds before auto-navigation is triggered (recommended: 1000-3000ms).
     * A longer delay prevents accidental navigation from quick drag movements.
     *
     * @default 2000
     */
    timeDelay: number;
}

/**
 * Configures automatic scrolling behavior when dragging or resizing events near viewport edges.
 * Provides smooth scrolling as users move events or resize handles toward the scheduler boundaries,
 * enabling seamless operations across larger time ranges or date spans.
 */
export interface SchedulerDragScrollProps {
    /**
     * Enables or disables automatic scrolling when dragging or resizing events near viewport edges.
     * When disabled, the viewport remains static during drag/resize operations.
     *
     * @default true
     */
    enable?: boolean;

    /**
     * Number of pixels to scroll per scroll step/tick (typical range: 5-20 pixels for balanced responsiveness).
     * Larger values increase scroll speed; smaller values provide finer control.
     *
     * @default 10
     */
    scrollBy?: number;

    /**
     * Specifies the delay in milliseconds between consecutive scroll steps (typical range: 50-200ms).
     * Shorter delays result in faster scrolling; longer delays provide more controlled, slower scrolling.
     *
     * @default 100
     */
    timeDelay?: number;
}

/**
 * Event arguments provided during scheduler data modification operations (add, update, delete).
 * Allows interception and custom handling of CRUD operations with support for server-side validation and cancellation.
 * Enables developers to implement custom validation logic, loading indicators, or data persistence workflows.
 */
export interface SchedulerDataChangeEvent {
    /**
     * Set to true to cancel the entire data modification operation and revert all changes to the scheduler.
     * Useful for validation failures or business logic constraints.
     */
    cancel?: boolean;

    /**
     * Array of newly created event records during add operations.
     * Each record contains the full event data for the newly added events.
     */
    addedRecords?: Record<string, any>[];

    /**
     * Array of modified event records during update operations.
     * Each record contains the updated event data for changed events.
     */
    changedRecords?: Record<string, any>[];

    /**
     * Array of deleted event records during delete operations.
     * Each record contains the full data of removed events.
     */
    deletedRecords?: Record<string, any>[];

    /**
     * Optional promise for server-side overlap validation of events.
     * If resolved with true, overlapping conflicts are found and the operation is canceled; false allows the operation to proceed.
     *
     * @private
     */
    promise?: Promise<boolean>;
}

/**
 * Event arguments provided when event data is requested from the data source.
 * Contains raw event records and metadata before field mapping to the scheduler event model.
 * Enables developers to implement custom data processing or pagination logic.
 */
export interface SchedulerDataBindEvent {
    /**
     * The raw event records returned by the DataManager after executing the data query.
     * Each object contains source data before field mapping to the scheduler event model.
     */
    result?: Object[];

    /**
     * The total number of records available in the complete data source (useful for pagination).
     * Enables pagination or lazy-loading implementations when working with large datasets.
     */
    count?: number;
}

/**
 * Fired before data is requested from the data source.
 * Provides the requested date range, optional promise, cancel flag, and result.
 */
export interface SchedulerDataRequestEvent {
    /**
     * The start date of the requested data range.
     * Useful for server-side filtering or async data fetching.
     */
    startDate?: Date;

    /**
     * The end date of the requested data range.
     * Useful for server-side filtering or async data fetching.
     */
    endDate?: Date;

    /**
     * Set to true to cancel the data request operation.
     */
    cancel?: boolean;

    /**
     * Raw records returned by the data source (before field mapping).
     */
    result?: Record<string, any>;
}

/**
 * Event arguments provided when the active view changes in the scheduler.
 * Fired when users switch between Day, Week, Month, or other view types with the new view identifier.
 * Enables developers to track view changes for analytics or load view-specific data.
 */
export interface SchedulerViewChangeEvent {
    /**
     * The name or identifier of the newly active view (e.g., 'Day', 'Week', 'WorkWeek', 'Month').
     * Useful for tracking view changes or loading view-specific data.
     */
    value: string;
}

/**
 * Event arguments provided when the active date changes in the scheduler.
 * Fired when users navigate to a different date or date range with the newly selected date value.
 * Enables developers to synchronize the scheduler with other components or load date-specific data.
 */
export interface SchedulerDateChangeEvent {
    /**
     * The newly selected or navigated date in the scheduler.
     * Fired when users navigate to a different date or date range.
     */
    value: Date;
}

/**
 * Configures the appearance, behavior, and interaction of tooltips displayed over scheduler events and cells.
 * Provides granular control over tooltip positioning, animation, and custom content rendering for enhanced user guidance.
 * Enables customization of tooltip dimensions, open modes, and interactive behaviors through flexible property configuration.
 */
export interface SchedulerTooltipProps {
    /**
     * Specifies the width of the Tooltip component in pixels or CSS units.
     * Use 'auto' for automatic width based on content.
     *
     * @default 'auto'
     */
    width?: string | number;

    /**
     * Specifies the height of the Tooltip component in pixels or CSS units.
     * Use 'auto' for automatic height based on content.
     *
     * @default 'auto'
     */
    height?: string | number;

    /**
     * Specifies the content of the Tooltip component (text, HTML, or custom React component).
     * Can be a static string or a dynamically rendered component.
     *
     * @default -
     */
    content?: React.ReactNode | Function;

    /**
     * Specifies the vertical and horizontal position of the Tooltip relative to the target element.
     * Options: 'TopCenter', 'TopLeft', 'TopRight', 'BottomCenter', 'BottomLeft', 'BottomRight', etc.
     *
     * @default 'TopCenter'
     */
    position?: Position;

    /**
     * Specifies the device mode to display the Tooltip content.
     *
     * Set of open modes available for Tooltip.
     * ```props
     * Auto :- The Tooltip opens automatically when the trigger element is hovered over.
     * Hover :- The Tooltip opens when the trigger element is hovered over.
     * Click :- The Tooltip opens when the trigger element is clicked.
     * Focus :- The Tooltip opens when the trigger element is focused.
     * Custom :- The Tooltip opens when the trigger element is triggered by a custom event.
     * ```
     *
     * @default 'Auto'
     */
    opensOn?: string;

    /**
     * When enabled, the Tooltip follows the mouse pointer movement over the target element.
     * Provides dynamic tooltip positioning based on cursor location.
     *
     * @default false
     */
    followCursor?: boolean;

    /**
     * When enabled, the Tooltip remains in an open state until manually closed by the user.
     * Provides persistent tooltip display for important information.
     *
     * @default false
     */
    sticky?: boolean;

    /**
     * Controls the Tooltip's visibility state: true to display, false to hide completely.
     * Allows programmatic control over tooltip visibility.
     *
     * @default false
     */
    open?: boolean;

    /**
     * Specifies animation settings for Tooltip open and close actions.
     * Enables smooth transitions with configurable effects, duration, and delay.
     *
     * @default { open: { effect: 'FadeIn', duration: 150, delay: 0 }, close: { effect: 'FadeOut', duration: 150, delay: 0 } }
     */
    animation?: TooltipAnimationOptions;

    /**
     * When enabled, displays a small arrow/pointer showing the direction of the Tooltip relative to its target.
     * Enhances visual clarity of tooltip positioning.
     *
     * @default false
     */
    arrow?: boolean;

    /**
     * Triggers before the Tooltip is displayed over the target element.
     *
     * @event onOpen
     */
    onOpen?: (event: Event) => void;

    /**
     * Triggers before the Tooltip hides from the screen.
     *
     * @event onClose
     */
    onClose?: (event: Event) => void;

    /**
     * Specifies a callback function that determines the target elements on which the Tooltip should be displayed.
     * This can be used for showing Tooltip with multiple targets.
     *
     * @param {HTMLElement} args - The target element for which the Tooltip is being evaluated.
     * @returns {HTMLElement} True to display the Tooltip, false to prevent it from showing.
     * @event onFilterTarget
     */
    onFilterTarget?: (event: HTMLElement) => HTMLElement;
}

/**
 * Event arguments provided before the scheduler tooltip is displayed over a target element.
 * Contains the raw event data and allows cancellation of the tooltip display operation.
 * Enables developers to implement conditional tooltip visibility or custom tooltip filtering logic.
 */
export interface SchedulerTooltipOpenEvent {
    /** Set true to cancel this tooltip open */
    cancel?: boolean;
    /** Raw appointment data */
    data?: Record<string, any>;
}

/**
 * Represents the date range context for custom header rendering in the scheduler.
 * Provides start date, end date, and view information to enable context-aware date range displays.
 * Enables developers to create custom date range representations or localized date formatting strategies.
 */
export interface DateRangeProps {
    /**
     * The start date of the currently visible date range in the scheduler.
     * Indicates the beginning of the period displayed by the active view.
     */
    startDate: Date;

    /**
     * The end date of the currently visible date range in the scheduler.
     * Indicates the end of the period displayed by the active view.
     */
    endDate: Date;

    /**
     * The name of the currently active view type ('Day', 'Week', 'WorkWeek', 'Month', or custom).
     * Indicates which view is displaying the date range.
     */
    view: string;
}

/**
 * Configures the base properties for scheduler toolbar buttons including styling, callbacks, and accessibility attributes.
 * Provides common button configuration options shared across all toolbar button types in the scheduler header.
 * Enables consistent styling and interaction handling for toolbar button customization across the scheduler.
 */
export interface BaseToolbarButtonProps {
    /**
     * Click handler function executed when the button is clicked.
     * Receives the click event as a parameter.
     */
    onClick?: (e?: React.SyntheticEvent) => void;
    /**
     * Adds an accessible ARIA label to the button for screen readers and accessibility tools.
     * Essential for keyboard navigation and voice command support.
     */
    ariaLabel?: string;
    /**
     * Adds a custom tooltip or title text displayed on button hover.
     * Provides user guidance about the button's function.
     */
    title?: string;
    /**
     * When true, disables the button and prevents user interaction.
     * Useful for conditional disabling based on state or permissions.
     */
    disabled?: boolean;
    /**
     * An icon for the button, either as a CSS class name for icon fonts or as a React element.
     * Enhances button visual clarity and user recognition.
     */
    icon?: ReactElement;
    /**
     * Adds a custom CSS class name to the button element for custom styling.
     * Enables fine-grained style control through external CSS.
     */
    className?: string;
    /**
     * Specifies the semantic color of the button for visual hierarchy and intent communication.
     * Options: 'Primary', 'Secondary', 'Warning', 'Success', 'Error', 'Info'.
     */
    color?: Color;
    /**
     * Specifies the visual style variant of the button for design flexibility.
     * Options: 'Outlined', 'Filled', 'Standard' for different visual presentations.
     */
    variant?: Variant;
}

export interface ToolbarButtonProps extends BaseToolbarButtonProps {
    /**
     * Displays the text label within the toolbar button.
     * Provides user-friendly identification of the button's function.
     */
    text?: string;
}

export interface DateRangeButtonProps extends BaseToolbarButtonProps {
    /**
     * The custom React component or content to display within the date range button.
     * Enables flexible date range representation.
     */
    dateRangeContent?: ReactNode;

    /**
     * When true, indicates the calendar picker popup is currently visible.
     * Controls the open/closed state of the date range selector.
     */
    isCalendarOpen?: boolean;

    /**
     * Sets the ARIA expanded attribute for accessibility, indicating whether the popup is open or closed.
     * Essential for screen reader users to understand the button's expanded state.
     */
    ariaExpanded?: boolean;

    /**
     * Callback handler triggered when the user presses a keyboard key while the button has focus.
     * Enables keyboard navigation and custom keyboard handling.
     */
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

export interface ViewButtonProps extends BaseToolbarButtonProps {
    /**
     * An array of available view options presented in the view switcher dropdown.
     * Each item represents a selectable view (Day, Week, Month, etc.).
     */
    items?: ItemModel[];

    /**
     * The name or identifier of the currently active view type in the scheduler.
     * Indicates which view option is selected in the view switcher.
     */
    currentView?: string;

    /**
     * Callback handler triggered when the user selects a different view from the view switcher.
     * Enables custom handling of view changes.
     */
    onSelect?: (args: ButtonSelectEvent) => void;

    /**
     * Reference to the scheduler element for positioning the view switcher dropdown/popup correctly.
     * Used as the viewport element for collision detection and positioning calculations.
     */
    viewPortElementRef?: React.RefObject<HTMLElement | HTMLDivElement>;
}

/**
 * Props passed to custom header renderers in the scheduler, enabling full header bar customization.
 * Provides pre-configured button instances, templates, and configuration objects for comprehensive header control.
 * Enables developers to customize, extend, or completely replace the default scheduler header with custom implementations.
 */
export interface SchedulerHeaderProps {
    /**
     * Configures how toolbar items are displayed when space is limited: Popup, Dropdown, or Scroll.
     * Defaults to Popup mode for optimal space management.
     */
    overflowMode?: OverflowMode;

    /**
     * Provides a custom React component to render the date range display in the scheduler header.
     * Enables custom date range formatting or localization.
     */
    dateRangeTemplate?: (props: DateRangeProps) => React.ReactNode;

    /**
     * Configuration object for the "Today" button in the scheduler header.
     * Set to `null` to completely hide the button from the toolbar.
     */
    todayProps?: ToolbarButtonProps | null;

    /**
     * Configuration object for the "Previous" navigation button in the scheduler header.
     * Set to `null` to completely hide the button from the toolbar.
     */
    previousProps?: ToolbarButtonProps | null;

    /**
     * Configuration object for the "Next" navigation button in the scheduler header.
     * Set to `null` to completely hide the button from the toolbar.
     */
    nextProps?: ToolbarButtonProps | null;

    /**
     * Configuration object for the date range button in the scheduler header.
     * Set to `null` to completely hide the button from the toolbar.
     */
    dateRangeProps?: DateRangeButtonProps | null;

    /**
     * Configuration object for the view switcher button in the scheduler header.
     * Set to `null` to completely hide the button from the toolbar.
     */
    viewSwitcherProps?: ViewButtonProps | null;


    /**
     * Custom toolbar items.
     * - If only children are provided → replaces toolbar.
     * - If combined with button props → extends toolbar.
     */
    children?: React.ReactNode;

    /**
     * A fully configured "Today" button instance ready for rendering.
     * Can be repositioned within the toolbar or excluded from display as needed.
     */
    today?: React.ReactNode;

    /**
     * A fully configured "Previous" navigation button instance ready for rendering.
     * Can be repositioned within the toolbar or excluded from display as needed.
     */
    previous?: React.ReactNode;

    /**
     * A fully configured "Next" navigation button instance ready for rendering.
     * Can be repositioned within the toolbar or excluded from display as needed.
     */
    next?: React.ReactNode;

    /**
     * A fully configured date range button instance ready for rendering.
     * Can be repositioned within the toolbar or excluded from display as needed.
     */
    dateRange?: React.ReactNode;

    /**
     * A fully configured view switcher instance ready for rendering.
     * Can be repositioned within the toolbar or excluded from display as needed.
     */
    viewSwitcher?: React.ReactNode;
}

/**
 * Represents the resolved details for a scheduler cell corresponding to a specific DOM element.
 * Provides timing information, all-day status, and direct access to the DOM element for advanced cell operations.
 * Enables developers to programmatically interact with scheduler cells and retrieve detailed cell context.
 */
export interface SchedulerCellDetails {
    /**
     * The start time of the cell's time range, marking the beginning of the time slot.
     * Used for scheduling and event positioning logic.
     */
    startTime: Date;

    /**
     * The end time of the cell's time range, marking the end of the time slot.
     * Used for scheduling and event positioning logic.
     */
    endTime: Date;

    /**
     * Indicates whether the cell belongs to the all-day row (true) or a timed time slot (false).
     * Useful for determining cell type and appropriate event creation logic.
     */
    isAllDay: boolean;

    /**
     * The underlying DOM element for the selected cell, enabling direct manipulation or inspection.
     * Useful for custom styling or finding parent elements.
     */
    element: HTMLElement;
}

/**
 * Configures custom renderers for the Quick Info Popup shown when selecting cells or events in the scheduler.
 * Supports separate customization for cell creation popups (add) and existing event popups (edit) with header, content, and footer sections.
 * Enables developers to implement specialized popup layouts or alternative quick-edit experiences for different interaction scenarios.
 */
export interface SchedulerQuickInfoProps {
    /**
     * Custom React component to render the header section of the quick info popup for cell selection.
     * Replaces the default header with custom content when adding new events.
     */
    addHeader?: (props: { cellData: SchedulerCellDetails }) => React.ReactNode;

    /**
     * Custom React component to render the content section of the quick info popup for cell selection.
     * Replaces the default body with custom content when adding new events.
     */
    addContent?: (props: { cellData: SchedulerCellDetails }) => React.ReactNode;

    /**
     * Custom React component to render the footer section of the quick info popup for cell selection.
     * Replaces the default footer with custom action buttons when adding new events.
     */
    addFooter?: (props: { cellData: SchedulerCellDetails }) => React.ReactNode;

    /**
     * Custom React component to render the header section of the quick info popup for existing events.
     * Replaces the default header when viewing or editing selected events.
     */
    editHeader?: (props: { eventData: EventModel }) => React.ReactNode;

    /**
     * Custom React component to render the content section of the quick info popup for existing events.
     * Replaces the default event details with custom content when viewing or editing events.
     */
    editContent?: (props: { eventData: EventModel }) => React.ReactNode;

    /**
     * Custom React component to render the footer section of the quick info popup for existing events.
     * Replaces the default footer with custom action buttons when viewing or editing events.
     */
    editFooter?: (props: { eventData: EventModel }) => React.ReactNode;

    /**
     * When enabled, the quick info popup displays in full-screen mode on mobile devices.
     * Provides better usability and visibility on smaller screens.
     */
    adaptive?: boolean;
}

/**
 * Props for configuring the customization options of the scheduler's editor dialog for event creation and editing.
 * Enables control over dialog visibility, event data, fields, validation, and styling through a comprehensive configuration interface.
 * Supports both field-based and children-based rendering approaches for flexible editor customization.
 */
export interface SchedulerEditorProps {
    /**
     * Controls whether the event editor dialog is visible (true) or hidden (false).
     * Allows programmatic control over editor visibility.
     */
    open?: boolean;

    /**
     * Callback function triggered when the user requests to close the event editor dialog.
     * Allows custom close logic or confirmation dialogs.
     */
    onClose?: () => void;

    /**
     * The event data object being edited or created with all property values.
     * Bind to this for two-way data binding with form inputs.
     */
    data?: EventModel;

    /**
     * The original event data before any edits (only present in edit mode; undefined when creating new events).
     * Useful for detecting changes or reverting modifications.
     */
    originalData?: EventModel;

    /**
     * The editor mode indicating whether creating ('Add') a new event or editing ('Edit') an existing one.
     * Useful for conditional rendering or validation logic.
     */
    action?: CrudAction;

    /**
     * Configuration object for the underlying editor dialog component.
     * Allows customization of dialog appearance, behavior, and properties.
     */
    dialogProps?: DialogProps;

    /**
     * An array of field configurations controlling which fields are displayed and how they render.
     * Provides granular control over editor input customization and visibility.
     */
    fields?: SchedulerEditorField[];

    /**
     * Adds custom CSS class names to the editor container element.
     * Enables custom styling and visual customization through external CSS.
     */
    className?: string;

    /**
     * Inline CSS styles applied directly to the editor container element.
     * Enables direct style customization without external CSS.
     */
    style?: React.CSSProperties;

    /**
     * Custom React components or content rendered as editor children when `fields` is not provided.
     * Enables complete custom editor implementations.
     */
    children?: React.ReactNode;
}

/**
 * Field configuration object for customizing individual editor inputs in the scheduler's event editing dialog.
 * Defines field visibility, custom components, component properties, and validation rules for granular editor control.
 * Enables developers to create specialized field inputs or override default field rendering with custom implementations.
 */
export interface SchedulerEditorField {
    /**
     * Unique field identifier used for data binding and validation (e.g., 'subject', 'location', 'description').
     * Must correspond to a property in the event data model.
     */
    name: string;

    /**
     * Controls whether the field is displayed in the editor form.
     * Set to false to hide the field from the editor while maintaining its data structure.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Adds custom CSS class names to the field container element.
     * Enables custom styling of individual fields through external CSS.
     */
    className?: string;

    /**
     * A custom React component to render instead of the default field input component.
     * Enables specialized field rendering for custom data types or interactions.
     */
    component?: React.ReactNode;

    /**
     * Props to override or extend the default field component's properties.
     * Enables fine-grained customization without replacing the entire component.
     */
    props?: Record<string, any>;

    /**
     * Validation rules for the field enforcing required values, patterns, or constraints.
     * Applied before saving event data to ensure data integrity (e.g., { required: [true, 'Field is required'] }).
     */
    validationRule?: ValidationRules[string];
}


/**
 * Specifies the configuration for automatically scrolling the Scheduler when the view is initialized or rendered.
 */
export interface SchedulerScrollToProps {
    /**
     * Specifies whether automatic scrolling should occur when the view is rendered.
     * If omitted or set to `false`, the Scheduler does not perform any automatic scroll.
     */
    enable?: boolean;

    /**
     * Specifies a pixel value that is subtracted from the calculated scroll position.
     * This value represents the exact amount reduced from the final scroll target.
     * Accepts positive or negative values to fine tune the final scroll target.
     */
    offset?: number;

    /**
     * Specifies the scrolling strategy used to determine the target scroll position.
     */
    mode?: ScrollToMode;
}

/**
 * An interface that represents time zone and display text for scheduler.
 */
export interface TimezoneFields {
    /** Assigns the timezone display text. */
    text: string;
    /** Assigns the [`IANA`] timezone value. */
    value: string;
}
