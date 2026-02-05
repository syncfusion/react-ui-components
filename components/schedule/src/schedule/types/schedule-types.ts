import { ReactNode } from 'react';
import { View, SpannedEventPlacement, CalendarType } from './enums';
import { DataManager, Query, ReturnType } from '@syncfusion/react-data';

type ScheduleHTMLAttributes = {
    className?: string;
    id?: string;
    tabIndex?: number;
};

export interface ScheduleCommonProps {

    /**
     * Determines whether events can overlap.
     * When set to false, overlapping events will be prevented.
     *
     * @default true
     */
    allowOverlap?: boolean;

    /**
     * When set to `true`, allows the keyboard interaction to take place on Schedule.
     *
     * @default true
     */
    allowKeyboardInteraction?: boolean;

    /**
     * Toggles the visibility of the quick info popup.
     * When set to false, the popup will not be displayed.
     *
     * @default true
     */
    showQuickInfoPopup?: boolean;

    /**
     * The start hour of the Schedule component.
     *
     * @default '00:00'
     */
    startHour?: string;

    /**
     * The end hour of the Schedule component.
     *
     * @default '24:00'
     */
    endHour?: string;

    /**
     * The date format for the Schedule component.
     *
     * @default null
     */
    dateFormat?: string;

    /**
     * Indicates whether to show weekends in the Schedule component.
     *
     * @default true
     */
    showWeekend?: boolean;

    /**
     * The time format for the Schedule component.
     *
     * @default null
     */
    timeFormat?: string;

    /**
     * The time scale configuration for the Schedule component.
     *
     * @default { enable: true, interval: 60, slotCount: 2 }
     */
    timeScale?: TimeScaleModel;

    /**
     * The first day of the week in the Schedule component.
     *
     * @default 0
     */
    firstDayOfWeek?: number;

    /**
     * The work days of the week in the Schedule component.
     *
     * @default [1, 2, 3, 4, 5]
     */
    workDays?: number[];

    /**
     * Indicates whether to show week numbers in the Schedule component.
     *
     * @default false
     */
    showWeekNumber?: boolean;

    /**
     * The template for rendering date header cells in this specific view.
     * This can be at both view and root level.
     *
     * @default null
     */
    dateHeaderTemplate?: ReactNode | ((props: { date: Date, type: string }) => ReactNode);

    /**
     * The template for rendering cells in this specific view.
     * This can be at both view and root level.
     *
     * @default null
     */
    cellTemplate?: ReactNode | ((props: { date: Date, type: string, groupIndex?: number }) => ReactNode);

}

export interface ScheduleProps extends ScheduleCommonProps, ScheduleHTMLAttributes {

    /**
     * The height of the Schedule component.
     *
     * @default 'auto'
     */
    height?: string;

    /**
     * The width of the Schedule component.
     *
     * @default 'auto'
     */
    width?: string;

    /**
     * The selected date in the Schedule component.
     *
     * @default new Date()
     */
    selectedDate?: Date;

    /**
     * The current view of the Schedule component.
     * Can be either a View type ('Day', 'Week', 'WorkWeek') or a specific view name
     * that matches with a child view's name property.
     *
     * @default 'Week'
     */
    currentView?: string;

    /**
     * The event settings for the Schedule component.
     *
     * @default { dataSource: [], fields: { id: 'Id', subject: 'Subject', startTime: 'StartTime', endTime: 'EndTime', isAllDay: 'IsAllDay', location: 'Location', description: 'Description' } }
     */
    eventSettings?: EventSettings;

    /**
     * The work hours configuration for the Schedule component.
     *
     * @default { highlight: false, start: '09:00', end: '18:00' }
     */
    workHours?: WorkHoursModel;

    /**
     * Indicates whether to show the current time indicator in the Schedule component.
     *
     * @default true
     */
    showTimeIndicator?: boolean;

    /**
     * When true, row height will automatically adjust to fit all events.
     * This takes precedence over maxEventsPerRow when both are set.
     *
     * @default false
     */
    rowAutoHeight?: boolean;

    /**
     * When set to true, makes the Schedule to render in a read only mode.
     * No CRUD actions will be allowed at this time.
     *
     * @default false
     */
    readOnly?: boolean;

    /**
     * It allows the Scheduler to display in other calendar modes.
     * By default, Scheduler is displayed in Gregorian calendar mode.
     *
     * @default 'Gregorian'
     */
    calendarMode?: CalendarType;

    /**
     * Toggles the visibility of the scheduler’s header bar, containing navigation and view options.
     *
     * @default true
     */
    showHeaderBar?: boolean;

    /**
     * Triggers before the data binds to the scheduler.
     *
     * @event dataBinding
     */
    onDataBinding?: (args: ReturnType) => void;

    /**
     * Callback when the selected date changes.
     *
     * @event selectedDateChange
     */
    onSelectedDateChange?: (date: Date) => void;

    /**
     * Callback when the current view changes.
     *
     * @event currentViewChange
     */
    onCurrentViewChange?: (view: View) => void;

    /**
     * Triggers on beginning of every scheduler action.
     *
     * @event actionBegin
     */
    onActionBegin?: (args: ActionEventArgs) => void;

    /**
     * Triggers on successful completion of the scheduler actions.
     *
     * @event actionComplete
     */
    onActionComplete?: (args: ActionEventArgs) => void;

    /**
     * Triggers before the date or view navigation takes place on scheduler.
     *
     * @event onNavigating
     */
    onNavigating?: (args: NavigatingEventArgs) => void;

    /**
     * Callback when a cell is clicked.
     *
     * @event cellClick
     */
    onCellClick?: (args: CellClickEvent) => void;

    /**
     * Callback when a cell is double-clicked.
     *
     * @event cellDoubleClick
     */
    onCellDoubleClick?: (args: CellClickEvent) => void;

    /**
     * Callback when an event is clicked.
     *
     * @event eventClick
     */
    onEventClick?: (args: EventClickArgs) => void;

    /**
     * Callback when an event is double-clicked.
     *
     * @event eventDoubleClick
     */
    onEventDoubleClick?: (args: EventClickArgs) => void;

    /**
     * Callback triggered before an event is rendered.
     *
     * @event eventRendered
     */
    onEventRendered?: (args: EventRenderedArgs) => void;

    /**
     * Enables or disables drag and drop functionality.
     *
     * @default true
     */
    allowDragAndDrop?: boolean;

    /**
     * Triggers when an appointment is started to drag.
     *
     * @event dragStart
     */
    onDragStart?: (args: DragEventArgs) => void;

    /**
     * Triggers when an appointment is dragged.
     *
     * @event drag
     */
    onDrag?: (args: DragEventArgs) => void;

    /**
     * Triggers when the dragging of appointment is stopped.
     *
     * @event dragStop
     */
    onDragStop?: (args: DragEventArgs) => void;

    /**
     * Callback when more events are clicked.
     *
     * @event onMoreEventsClick
     */
    onMoreEventsClick?: (args: MoreClickEvent) => void;

    /**
     * Enables resizing support for events. When true, resize handles are rendered and resizing is enabled.
     *
     * @default true
     */
    allowResizing?: boolean;

    /**
     * Triggers when resize starts from a resize handle.
     *
     * @event resizeStart
     */
    onResizeStart?: (args: ResizeEventArgs) => void;

    /**
     * Triggers continuously while resizing.
     *
     * @event resizing
     */
    onResizing?: (args: ResizeEventArgs) => void;

    /**
     * Triggers when resize completes.
     *
     * @event resizeStop
     */
    onResizeStop?: (args: ResizeEventArgs) => void;

    /**
     * Triggers when a scheduler action gets failed or interrupted and an error information will be returned.
     */
    onActionFailure?: (error: any) => void;

    /**
     * The children components.
     */
    children?: React.ReactNode;
}

export interface ResizeEventArgs {
    cancel?: boolean;
    data?: any;
    element?: HTMLElement;
    event?: MouseEvent | TouchEvent;
    interval?: number;
    startTime?: Date;
    endTime?: Date;
    scroll?: ScrollOptions;
    groupIndex?: number;
}

export interface DragEventArgs {
    cancel?: boolean;
    element?: HTMLElement;
    event?: MouseEvent | TouchEvent;
    target?: HTMLElement;
    data?: unknown;
    navigation?: { enable?: boolean; timeDelay?: number };
    scroll?: ScrollOptions;
    excludeSelectors?: string;
    interval?: number;
}


export interface ViewSpecificProps extends MonthViewProps, ScheduleCommonProps {

    /**
     * It accepts the number value denoting to include the number of days, weeks, workweeks or months on the defined view type.
     *
     * @default 1
     */
    interval?: number;

    /**
     * A unique name identifier for the view.
     * Used to identify and switch between views using currentView.
     *
     * @default null
     */
    name?: string;

    /**
     * When the same view is customized with different intervals, this property allows the user to set different display name
     * for those views. The displayName is used in the view switcher.
     *
     * @default null
     */
    displayName?: string;

    /**
     * The template for rendering events in this specific view.
     * This is specifically a view-level prop, not at root level.
     *
     * @default null
     */
    eventTemplate?: ReactNode | ((props: EventModel) => ReactNode);
}

export interface MonthViewProps {

    /**
     * Specifies the starting week date at an initial rendering of month view.
     * This property is only applicable for month view.
     * If this property value is not set, then the month view will be rendered from the first week of the month.
     *
     * @default null
     */
    displayDate?: Date;

    /**
     * This property customizes the number of weeks that are shown in month view.
     * By default, it shows all weeks in the current month.
     * Use `displayDate` property to customize the starting week of month.
     *
     * @default null
     */
    numberOfWeeks?: number;

    /**
     * The template for rendering week day in this specific view.
     * This can be at in view level.
     *
     * @default null
     */
    weekDayTemplate?: ReactNode | ((props: { day: string, type: string }) => ReactNode);

    /**
     * It accepts either the string or HTMLElement as template design content and parse it appropriately
     * before displaying it onto the month date cells.
     * This template is only applicable for month view day cells.
     *
     * @default null
     */
    cellHeaderTemplate?: ReactNode | ((props: { date: Date, type: string }) => ReactNode);

    /**
     * Hide the previous and next month dates of a Schedule month view.
     * When set to true, dates from previous and next months will be shown.
     * When set to false, only the current month dates will be displayed.
     * This property is only applicable for Month view.
     *
     * @default true
     */
    showTrailingAndLeadingDates?: boolean;

    /**
     * Maximum number of events to display per row in month view.
     * Additional events will be shown as "+n more" text.
     *
     * @default null
     */
    maxEventsPerRow?: number;
}

/**
 * Interface for the event settings.
 */
export interface EventSettings {

    /**
     * The data source for events.
     *
     * @default []
     */
    dataSource?: Record<string, unknown>[] | DataManager;

    /**
     * The field mapping for event data.
     *
     * @default { id: 'Id', subject: 'Subject', startTime: 'StartTime', endTime: 'EndTime', isAllDay: 'IsAllDay', location: 'Location', description: 'Description' }
     */
    fields?: {
        id?: string
        subject?: string
        startTime?: string
        endTime?: string
        isAllDay?: string
        location?: string
        description?: string
        isReadonly?: string
        isBlock?: string
        [key: string]: string | undefined
    };

    /**
     * Enables or disables event editing.
     *
     * @default true
     */
    allowEditing?: boolean;

    /**
     * Enables or disables event adding.
     *
     * @default true
     */
    allowAdding?: boolean;

    /**
     * Enables or disables event deleting.
     *
     * @default true
     */
    allowDeleting?: boolean;

    /**
     * Custom template for rendering events.
     *
     * @default null
     */
    template?: React.ReactNode | ((props: EventModel) => React.ReactNode);

    /**
     * Defines how to render events that span more than 24 hours.
     *
     * @default 'AllDayRow'
     */
    spannedEventPlacement?: SpannedEventPlacement;

    /**
     * Enables or disables the use of maximum height for events.
     * When true, events occupy the full height of the cell without headers.
     *
     * @default false
     */
    enableMaxHeight?: boolean;

    /**
     * Shows a "more" indicator when multiple events occupy the same cell.
     *
     * @default false
     */
    enableIndicator?: boolean;

    /**
     * This property ignores or include the Events element bottom white space.
     *
     * @default false
     */
    ignoreWhitespace?: boolean;

    /**
     * Defines a query to execute against the data source.
     *
     * Allows you to apply a predefined `Query` object to the data source.
     * This is especially useful when working with remote data sources or when you need complex data operations.
     *
     * @default null
     *
     */
    query?: Query;
}

/**
 * Defines the time scale model for the Schedule component.
 */
export interface TimeScaleModel {

    /**
     * Enables or disables the time scale.
     *
     * @default true
     */
    enable?: boolean;

    /**
     * Defines the interval between time slots in minutes.
     *
     * @default 60
     */
    interval?: number;

    /**
     * Defines the number of minor slots per major slot.
     *
     * @default 2
     */
    slotCount?: number;

    /**
     * Template for major time slots.
     *
     * @default null
     */
    majorSlotTemplate?: ReactNode | ((props: TimeSlotTemplateProps) => ReactNode);

    /**
     * Template for minor time slots.
     *
     * @default null
     */
    minorSlotTemplate?: ReactNode | ((props: TimeSlotTemplateProps) => ReactNode);
}

/**
 * Defines the work hours model for the Schedule component.
 */
export interface WorkHoursModel {

    /**
     * Enables or disables the highlighting of work hours.
     *
     * @default false
     */
    highlight?: boolean;

    /**
     * Defines the start time of work hours.
     *
     * @default '09:00'
     */
    start?: string;

    /**
     * Defines the end time of work hours.
     *
     * @default '18:00'
     */
    end?: string;

}

/**
 * Defines the event model for the Schedule component.
 */
export interface EventModel {

    /**
     * Unique identifier for the event.
     */
    id?: string | number;

    /**
     * Subject or title of the event.
     */
    subject?: string;

    /**
     * Start time of the event.
     */
    startTime?: Date;

    /**
     * End time of the event.
     */
    endTime?: Date;

    /**
     * Indicates whether the event is an all-day event.
     */
    isAllDay?: boolean;

    /**
     * Location of the event.
     */
    location?: string;

    /**
     * Description of the event.
     */
    description?: string;

    /**
     * Indicates whether the event is read-only.
     */
    isReadonly?: boolean;

    /**
     * Indicates whether the event is a block event.
     */
    isBlock?: boolean;

    /**
     * Additional custom fields for the event.
     */
    [key: string]: unknown;

    /**
     * Internal use only.
     *
     * @internal
     */
    guid?: string;
}

/**
 * Defines the cell click event for the Schedule component.
 */
export interface CellClickEvent {

    /**
     * The native event object.
     */
    nativeEvent: MouseEvent;

    /**
     * The start time of the cell.
     */
    startTime: Date;

    /**
     * The end time of the cell.
     */
    endTime: Date;

    /**
     * Indicates whether the cell is an all-day cell.
     */
    isAllDay: boolean;

    /**
     * The element that was clicked.
     */
    element?: HTMLElement;

    /**
     * The group index if resources are used.
     */
    groupIndex?: number;

}

/**
 * Defines the event click event for the Schedule component.
 */
export interface EventClickArgs {

    /**
     * The React mouse event object.
     */
    event?: React.MouseEvent<HTMLElement>;

    /**
     * The event data record.
     */
    data: Record<string, any>;

    /**
     * The group index if resources are used.
     */
    groupIndex?: number;

    /**
     * The date of the event (optional).
     */
    date?: Date;

    /**
     * The HTML element(s) that was clicked.
     */
    element?: HTMLElement | HTMLElement[];

    /**
     * Allows cancellation of the event action.
     */
    cancel?: boolean;

}

/**
 * Defines the event click event for the Schedule component.
 */
export interface MoreClickEvent {
    /**
     * The date of the time slot.
     */
    date: Date;
    /**
     * The element that was clicked.
     */
    element?: HTMLElement;
}

export interface TimeSlotTemplateProps {

    /**
     * The date of the time slot.
     */
    date: Date;

    /**
     * The type of the time slot.
     */
    type: string;
}

/** Defines options for auto-scrolling during drag/resize operations. */
export interface ScrollOptions {
    /** Enables or disables auto scroll. */
    enable?: boolean;
    /** Number of pixels to scroll per tick. */
    scrollBy?: number;
    /** Delay in ms between scroll steps while dragging near edges. */
    timeDelay?: number;
}

/**
 * Event rendered event arguments
 */
export interface EventRenderedArgs {

    /**
     * The event data.
     */
    event: EventModel;

    /**
     * The HTML element of the rendered event.
     */
    element: HTMLElement;

    /**
     * The view in which the event is rendered.
     */
    viewType: View;
}

/** An interface that holds options to control the actions of scheduler such as editing, adding, deleting. */
export interface ActionEventArgs {
    /** Returns the request type of the current action. */
    requestType: string;
    /** Defines the type of the event. */
    event?: Event;
    /** Defines the cancel option for the action taking place. */
    cancel?: boolean;
    /** Returns the appropriate added data based on the action. */
    addedRecords?: Record<string, any>[];
    /** Returns the appropriate changed data based on the action. */
    changedRecords?: Record<string, any>[];
    /** Returns the appropriate deleted data based on the action. */
    deletedRecords?: Record<string, any>[];
    /**
     * A Promise that, when provided, checks for overlapping events on the server.
     * If the promise resolves with overlapping events, the action (add/update) will be
     * canceled, and an alert will be displayed to the user.
     * If no overlapping events are found, the scheduler proceeds with the action.
     */
    promise?: Promise<boolean>;
}

export interface NavigatingEventArgs {
    /** Returns the action type either as `date` or `view` due to which the navigation takes place. */
    action: string;
    /** Defines the cancel option. */
    cancel: boolean;
    /** Returns the date value before date navigation takes place. */
    previousDate?: Date;
    /** Returns the current date value after navigation takes place. */
    currentDate?: Date;
    /** Returns the view name before the view navigation takes place. */
    previousView?: string;
    /** Returns the active view name after the view navigation takes place. */
    currentView?: string;
    /** Returns the active view index after the view navigation takes place. */
    viewIndex?: number;
}
