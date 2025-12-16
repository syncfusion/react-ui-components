import { ReactNode } from 'react';
import { SpannedEventPlacement } from './enums';
import { DataManager, Query } from '@syncfusion/react-data';

type SchedulerHTMLAttributes = {
    className?: string;
    id?: string;
    tabIndex?: number;
};

/** @private */
export interface VerticalViewProps {

    /**
     * Controls whether multiple events can occupy the same time slot without visual overlap adjustments.
     * When enabled, overlapping events display side-by-side; when disabled, the scheduler prevents scheduling conflicts.
     *
     * @default true
     */
    eventOverlap?: boolean;

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
     * Enables dragging events to different time slots, automatically updating their start and end times.
     * When enabled, events can be moved freely across the scheduler while maintaining their duration.
     *
     * @default true
     */
    eventDrag?: boolean;

    /**
     * Enables keyboard shortcuts for navigation and event manipulation within the scheduler.
     * Users can navigate cells, open event editors, and perform other actions using keyboard inputs.
     *
     * @default true
     */
    keyboardNavigation?: boolean;

    /**
     * Enables resize handles on events to drag and adjust their start or end time without moving the entire event.
     * Useful for quickly extending or shortening event durations.
     *
     * @default true
     */
    eventResize?: boolean;

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
     * Highlights the standard business hours (default 9 AM to 6 PM) with a distinct color in the scheduler.
     * Can be customized to match your organization's actual working hours.
     *
     * @default { highlight: true, start: '09:00', end: '18:00' }
     */
    workHours?: WorkHoursProps;

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
     * Controls the visibility of the header bar containing date navigation and view switcher buttons.
     * Useful for embedded or custom scheduler implementations.
     *
     * @default true
     */
    showHeaderBar?: boolean;

    /**
     * Displays a compact popup with event or cell details when clicked.
     * Provides a quick preview without opening the full event editor.
     *
     * @default true
     */
    showQuickInfoPopup?: boolean;

    /**
     * Fired before event data is loaded from the data source or remote server.
     * Useful for preprocessing or validating data before it renders in the scheduler.
     *
     * @event onDataRequest
     */
    onDataRequest?: (event: SchedulerDataRequestEvent) => void;

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
     * Supported view components: DayView, WeekView, WorkWeekView, and MonthView.
     *
     * @default null
     * @private
     */
    children?: React.ReactNode;
}

/**
 * Event arguments passed to drag lifecycle callbacks (onDragStart, onDrag, onDragStop).
 * Handlers can modify properties like cancel, interval, or scrolling behavior to control the drag operation.
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
     * Specifies the time increment in minutes used for snapping the resize operation.
     * Overrides the default slot interval when provided by the handler.
     *
     * @private
     */
    interval?: number;

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

    /**
     * Specifies the time increment in minutes used for snapping during the drag operation.
     * Overrides the default slot interval when provided by the handler.
     *
     * @private
     */
    interval?: number;

    /**
     * Configures automatic scrolling behavior when dragging near container edges.
     * Includes enable flag, scroll speed in pixels, and delay between scroll steps.
     *
     * @private
     */
    scroll?: ScrollOptions;

    /**
     * CSS selector(s) that exclude specific elements from participating in drag-and-drop operations.
     *
     * @private
     */
    excludeSelectors?: string;

}

/** @private */
export interface ViewSpecificProps extends VerticalViewProps, MonthViewProps {}

/** @private */
export interface CommonViewProps {
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

/** Defines the properties for DayView of the React Scheduler component */
export interface DayViewProps extends SchedulerCommonProps, VerticalViewProps, CommonViewProps {}

/** Defines the properties for WeekView of the React Scheduler component */
export interface WeekViewProps extends SchedulerCommonProps, VerticalViewProps, CommonViewProps {}

/** Defines the properties for WorkWeek of the React Scheduler component */
export interface WorkWeekViewProps extends SchedulerCommonProps, VerticalViewProps, CommonViewProps {}

/** Defines the properties for MonthView of the React Scheduler component */
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
 * Defines the configuration for event data binding and field mapping in the scheduler.
 * Supports local data arrays, remote data sources, and custom field definitions.
 */
export interface EventSettings {

    /**
     * The event data source for the scheduler. Accepts an array of JavaScript objects or a DataManager instance for remote data.
     * Automatically bound to the scheduler upon initialization.
     *
     * @default []
     */
    dataSource?: Record<string, unknown>[] | DataManager;

    /**
     * Maps database or object properties to scheduler event fields (id, subject, startTime, etc.).
     * Allows flexible integration with existing data structures without requiring data transformation.
     *
     * @default { id: 'Id', subject: 'Subject', startTime: 'StartTime', endTime: 'EndTime', isAllDay: 'IsAllDay', location: 'Location', description: 'Description' }
     */
    fields?: EventFields;

    /**
     * Enables or disables event editing capabilities for end users.
     * When disabled, existing events cannot be modified.
     *
     * @default true
     */
    allowEditing?: boolean;

    /**
     * Enables or disables event creation capabilities for end users.
     * When disabled, users cannot add new events to the scheduler.
     *
     * @default true
     */
    allowAdding?: boolean;

    /**
     * Enables or disables event deletion capabilities for end users.
     * When disabled, users cannot remove existing events from the scheduler.
     *
     * @default true
     */
    allowDeleting?: boolean;

    /**
     * Accepts a custom React component to render event content across all views.
     * Can be overridden by view-level event templates for specific views.
     *
     * @default null
     */
    template?: (props: EventModel) => ReactNode;

    /**
     * Determines how spanned events (longer than 24 hours) are rendered: in an all-day row or within time slot rows.
     * Default behavior displays them in the all-day section for clarity.
     *
     * @default 'AllDayRow'
     */
    spannedEventPlacement?: SpannedEventPlacement;

    /**
     * When enabled, events expand to fill available space, with overflow managed by the "more events" indicator.
     * Improves readability in cells with many events.
     *
     * @default false
     */
    enableIndicator?: boolean;

    /**
     * When enabled, ignores empty space below events within cells, allowing tighter event packing.
     * Useful for maximizing cell usage in views with many events.
     *
     * @default false
     */
    ignoreWhitespace?: boolean;

    /**
     * Applies a predefined query to the data source for filtering, sorting, or custom operations.
     * Particularly useful when working with remote data sources requiring complex query logic.
     *
     * @default null
     *
     */
    query?: Query;
}

/**
 * Configures how time slots are divided and rendered in day, week, and work week views.
 * Supports custom intervals, slot counts, and templated display of time labels.
 */
export interface TimeScaleProps {

    /**
     * Toggles the visibility and functionality of time slots in the scheduler view.
     * When disabled, the time scale section is hidden entirely.
     *
     * @default true
     */
    enable?: boolean;

    /**
     * Specifies the duration of each time slot in minutes (e.g., 30 for 30-minute slots).
     * Smaller intervals provide finer granularity for event scheduling.
     *
     * @default 60
     */
    interval?: number;

    /**
     * Divides each major time slot into this many minor subdivisions.
     * A value of 2 creates two 30-minute slots within each 60-minute major slot.
     *
     * @default 2
     */
    slotCount?: number;

    /**
     * Accepts a custom React component to render the primary (hour) time labels.
     * Enables custom formatting or styling of major time divisions.
     *
     * @default null
     */
    majorSlot?: (props: TimeSlotProps) => ReactNode;

    /**
     * Accepts a custom React component to render the secondary (minute) time labels within each major slot.
     * Enables detailed time formatting or visual differentiation.
     *
     * @default null
     */
    minorSlot?: (props: TimeSlotProps) => ReactNode;
}

/**
 * Defines the business hours configuration for visual highlighting and reference in the scheduler.
 * Allows users to quickly identify standard working hours during event planning.
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
 * Enables the scheduler to correctly interpret event data from various data structures.
 */
export interface EventFields {
    /**
     * Maps the unique event identifier field. Required to perform add, delete and edit actions.
     *
     * @default 'Id'
     */
    id?: string;

    /**
     * Maps the event title or heading field displayed in the scheduler.
     * Provides a brief description or name for each event.
     *
     * @default 'Subject'
     */
    subject?: string;

    /**
     * Maps the event start time field. Must be provided for all valid event objects.
     * Determines when an event begins on the scheduler.
     *
     * @default 'StartTime'
     */
    startTime?: string;

    /**
     * Maps the event end time field. Must be provided for all valid event objects.
     * Determines when an event concludes on the scheduler.
     *
     * @default 'EndTime'
     */
    endTime?: string;

    /**
     * Maps the all-day event indicator field. When true, the event spans the entire day regardless of time.
     * Useful for marking holidays, birthdays, or full-day activities.
     *
     * @default 'IsAllDay'
     */
    isAllDay?: string;

    /**
     * Maps the event location or venue field displayed to users.
     * Helps users understand where the event takes place.
     *
     * @default 'Location'
     */
    location?: string;

    /**
     * Maps the event description or detailed notes field.
     * Provides additional context or instructions for the event.
     *
     * @default 'Description'
     */
    description?: string;

    /**
     * Maps the read-only flag indicating whether an event can be modified.
     * When true, the event cannot be edited or deleted by users.
     *
     * @default 'IsReadonly'
     */
    isReadonly?: string;

    /**
     * Maps the block event indicator that reserves a time slot to prevent other events from being scheduled.
     * Useful for blocking meetings, maintenance windows, or unavailable time periods.
     *
     * @default 'IsBlock'
     */
    isBlock?: string;
}

/**
 * Represents the data structure of a single event in the scheduler.
 * Contains all relevant event details and supports custom properties via the indexed signature.
 */
export interface EventModel {

    /**
     * A unique identifier for the event used for update and delete operations.
     * Can be a string or number depending on your data source.
     */
    id?: string | number;

    /**
     * The event title or heading displayed in the scheduler view.
     * Provides a brief summary of the event's purpose.
     */
    subject?: string;

    /**
     * The exact date and time when the event begins.
     * Determines the event's position and start point in the scheduler.
     */
    startTime?: Date;

    /**
     * The exact date and time when the event concludes.
     * Determines the event's end point and duration in the scheduler.
     */
    endTime?: Date;

    /**
     * Marks the event as spanning the entire day rather than a specific time range.
     * All-day events appear in a separate section above timed events.
     */
    isAllDay?: boolean;

    /**
     * The physical location or venue where the event occurs.
     * Displayed alongside the event details for user reference.
     */
    location?: string;

    /**
     * Additional notes or context for the event that provide supplementary information.
     * Visible in event detail views or custom event templates.
     */
    description?: string;

    /**
     * Prevents the event from being edited or deleted by end users.
     * Useful for protecting important or locked events.
     */
    isReadonly?: boolean;

    /**
     * Marks the event as a time block that prevents scheduling other events in the same slot.
     * Commonly used for meetings, maintenance windows, or reserved time periods.
     */
    isBlock?: boolean;

    /**
     * Allows custom properties beyond the standard event fields for flexible event data modeling.
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
 * Event arguments provided when a scheduler cell is clicked or tapped.
 * Contains the cell's time range and interaction details for custom event handling.
 */
export interface SchedulerCellClickEvent {

    /**
     * The native MouseEvent object triggered by the cell interaction.
     */
    nativeEvent: MouseEvent;

    /**
     * The start time of the clicked time slot or date cell.
     */
    startTime: Date;

    /**
     * The end time of the clicked time slot or date cell.
     */
    endTime: Date;

    /**
     * Indicates whether the clicked cell belongs to the all-day row (true) or a timed slot (false).
     */
    isAllDay: boolean;

    /**
     * The DOM element that was clicked, enabling direct manipulation or inspection if needed.
     */
    element?: HTMLElement;

    /**
     * Set to true to cancel the default cell click behavior (e.g., preventing event creation dialogs).
     */
    cancel?: boolean;
}

/**
 * Event arguments provided when a scheduler event is clicked or tapped.
 * Contains the event data and DOM reference for custom interaction handling.
 */
export interface SchedulerEventClickEvent {

    /**
     * The native React MouseEvent triggered by clicking the event element.
     */
    event?: React.MouseEvent<HTMLElement>;

    /**
     * The complete event data object containing all event properties and custom fields.
     */
    data: Record<string, any>;

    /**
     * The DOM element of the clicked event, enabling direct styling or inspection if needed.
     */
    element?: HTMLElement;

    /**
     * Set to true to cancel the default event click behavior (e.g., preventing event editor from opening).
     */
    cancel?: boolean;
}

/**
 * Event arguments provided when the "+n more events" indicator is clicked in the Scheduler.
 * Allows custom handling of expanded event list display.
 */
export interface SchedulerMoreEventsClickEvent {
    /**
     * Set to true to cancel the more events popup open and handle expansion manually.
     */
    cancel?: boolean;

    /**
     * An array of all event objects for the clicked date or time slot.
     * Useful for custom display or filtering logic.
     */
    data: Record<string, any>[];
}

/**
 * Represents a single time division in the scheduler's time scale (e.g., 9:00 AM, 9:30 AM).
 * Used in custom time slot templates to render hour or minute labels.
 */
export interface TimeSlotProps {
    /**
     * The exact date and time represented by this time slot division.
     */
    date: Date;

    /**
     * Indicates whether this slot is a major division (hourly) or minor division (sub-hourly).
     * Values: 'majorSlot' or 'minorSlot'
     */
    type: string;
}

/**
 * Represents a single scheduler cell for custom rendering in day, week, or month views.
 * Provides context about the cell's date and type for template rendering.
 */
export interface SchedulerCellProps {

    /**
     * The start date and time of the scheduler cell.
     */
    date: Date;

    /**
     * Identifies the cell type to allow conditional rendering logic.
     * Values: 'monthCell' for month view cells or 'workCell' for time-slot cells.
     */
    type: string;
}

/**
 * Represents a date header cell in the scheduler's header row.
 * Used in custom date header templates for day, week, or month views.
 */
export interface SchedulerDateHeaderProps {

    /**
     * The date displayed in the header cell, useful for formatting or rendering date-specific content.
     */
    date: Date;
}

/**
 * Represents a month view cell header in the scheduler.
 * Used in custom cell header templates to render date information or custom decorations.
 */
export interface SchedulerCellHeaderProps {

    /**
     * The date of the cell header, enabling date-aware custom rendering and styling.
     */
    date: Date;
}

/**
 * Represents a weekday label (e.g., "Monday", "Tuesday") in the scheduler's header row.
 * Used in custom weekday templates for rendering or localizing day names.
 */
export interface SchedulerWeekDayProps {

    /**
     * The name or label of the weekday (e.g., "Monday") for display in the scheduler header.
     * Useful for custom formatting or localization.
     */
    day: string;
}

/**
 * Controls automatic scrolling behavior when dragging or resizing events near the container edges.
 * Enhances user experience by smoothly scrolling the view during interactive operations.
 *
 * @private
 */
export interface ScrollOptions {
    /**
     * Toggles auto-scroll on or off during drag or resize operations near container edges.
     */
    enable?: boolean;

    /**
     * The number of pixels to scroll per tick when auto-scrolling is active.
     * Larger values create faster scrolling.
     */
    scrollBy?: number;

    /**
     * The delay in milliseconds between consecutive scroll steps.
     * Smaller values create smoother, more frequent scrolling.
     */
    timeDelay?: number;
}

/**
 * Event arguments provided during scheduler data modification operations (add, update, delete).
 * Allows interception and custom handling of CRUD operations and server-side validation.
 */
export interface SchedulerDataChangeEvent {
    /**
     * Set to true to cancel the entire data modification operation and revert all changes.
     */
    cancel?: boolean;

    /**
     * An array of newly created event records during add operations.
     */
    addedRecords?: Record<string, any>[];

    /**
     * An array of modified event records during update operations.
     */
    changedRecords?: Record<string, any>[];

    /**
     * An array of deleted event records during delete operations.
     */
    deletedRecords?: Record<string, any>[];

    /**
     * An optional promise that validates overlapping events on the server.
     * If resolved with true, overlapping events are found and the operation is canceled.
     * If resolved with false, no conflicts exist and the operation proceeds.
     *
     * @private
     */
    promise?: Promise<boolean>;
}

/**
 * Event arguments provided when event data is requested from the data source.
 * Contains raw data and metadata before field mapping to the event model.
 */
export interface SchedulerDataRequestEvent {
    /**
     * The raw event records returned by the DataManager after executing the query.
     * Each object contains the source data before field mapping to the scheduler event model.
     */
    result?: Object[];

    /**
     * The total number of records available in the data source that match the query (if applicable).
     * Useful for pagination or lazy-loading implementations.
     */
    count?: number;
}

/**
 * Event arguments provided when the active view changes in the scheduler.
 * Fired when users switch between Day, Week, Month, or other view types.
 */
export interface SchedulerViewChangeEvent {
    /**
     * The name or identifier of the newly active view (e.g., 'Day', 'Week', 'Month').
     */
    value: string;
}

/**
 * Event arguments provided when the active date changes in the scheduler.
 * Fired when users navigate to a different date or date range.
 */
export interface SchedulerDateChangeEvent {
    /**
     * The newly selected or navigated date in the scheduler.
     */
    value: Date;
}
