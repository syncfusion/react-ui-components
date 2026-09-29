import { AlertAction, CrudAction, View } from '../types/enums';
import { ReactElement, CSSProperties, RefObject } from 'react';
import { EventModel, TimeSlotProps, SchedulerProps, ViewSpecificProps, EventDragProps, EventResizeProps, SchedulerResource } from './scheduler-types';
import { CalendarView, CalendarChangeEvent } from '@syncfusion/react-calendars';
import { IMorePopup } from '../components/popup/more-popup';
import { IQuickInfoPopup } from '../components/popup/quick-info-popup';
import { IScheduler } from '../index';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import { MonthCell } from '../hooks/useMonthCells';

/**
 * Describes measured dimensions returned by `getCellDimensions`.
 *
 * @private
 */
export interface ViewDimensions {
    cellHeight: number;
    cellWidth?: number;
}

/** @private */
export interface ActiveViewProps extends SchedulerProps, ViewSpecificProps {

    /**
     * Active scheduler view type.
     */
    viewType?: View;

    /**
     * Indicates whether the active view is a Timeline view (TimelineDay, TimelineWeek, TimelineWorkWeek, TimelineMonth).
     *
     * Derived once in `useScheduler` and exposed via the Scheduler context so consumers
     * do not need to repeat the `viewType?.startsWith('Timeline')` check.
     */
    isTimelineView?: boolean;

    /**
     * Indicates whether the active view is a Month view (Month or TimelineMonth).
     *
     * Derived once in `useScheduler` and exposed via the Scheduler context so consumers
     * do not need to repeat the `viewType === 'Month' || viewType === 'TimelineMonth'` check.
     */
    isMonthView?: boolean;

    /**
     * Specifies whether to use the displayDate or not.
     */
    useDisplayDate?: boolean;

    /**
     * Pre-parsed start hour [hour, minute] to avoid repeated string splits
     */
    startHourTuple?: [number, number];

    /**
     * Pre-parsed end hour [hour, minute] to avoid repeated string splits
     */
    endHourTuple?: [number, number];

    /**
     * Scheduler component reference
     */
    schedulerRef?: RefObject<IScheduler>;

    /**
     * Calendar change handler
     */
    handleCalendarChange?: (args: CalendarChangeEvent | Date, calendar?: CalendarView) => void;

    /**
     * View button click handler
     */
    handleViewButtonClick?: (view: string) => void;

    /**
     * Navigate to previous time period (keyboard support)
     */
    handlePreviousClick?: () => void;

    /**
     * Navigate to next time period (keyboard support)
     */
    handleNextClick?: () => void;

    /**
     * Navigate to current date (keyboard support)
     */
    handleTodayClick?: () => void;

    /**
     * Navigate to current View (keyboard support)
     */
    handleCurrentViewChange?: (view: string) => void;

    /**
     * Exposes the MorePopup ref (optional)
     */
    morePopupRef?: RefObject<IMorePopup>;

    /**
     * Exposes the MorePopup ref (optional)
     */
    quickPopupRef?: RefObject<IQuickInfoPopup>;

    /**
     * Handler to show delete confirmation dialog
     *
     * @param callback - Function to execute on delete confirmation
     * @param message - Optional custom message for the dialog
     */
    showDeleteAlert?: (callback: () => void, message?: string) => void;

    /**
     * Handler to show recurrence confirmation dialog for recurring events
     *
     * @param action - The alert action type (RecurrenceEdit or RecurrenceDelete)
     * @param onSelect - Callback function that receives the selected option (EditOccurrence, EditSeries, DeleteOccurrence, DeleteSeries)
     */
    showRecurrenceAlert?: (action: AlertAction, onSelect: (selectOption: CrudAction) => void) => void;

    /**
     * return the available views (optional)
     */
    getAvailableViews?: () => ViewsInfo[];

    /**
     * Handler to show alert dialog
     */
    confirmationDialog?: ReturnType<typeof useConfirmationDialog>;

    /**
     * Configuration for event drag-and-drop behavior.
     */
    eventDrag?: EventDragProps;

    /**
     * Configuration for event resize behavior.
     */
    eventResize?: EventResizeProps;
}

/** @private */
export interface IAllDayRow {
    hasMoreEvents: boolean;
}

/** @private */
export interface AppointmentProps {
    /** The event data to render. */
    eventInfo: ProcessedEventsData;
    /** Whether the event is in a vertical time-slot view. */
    isVertical?: boolean;
    /** Spanned indicators. */
    hasPrevious?: boolean;
    /** Spanned indicators. */
    hasNext?: boolean;
    /** Defines resource grouping index */
    groupIndex?: number;
}

/** @private */
export interface TimeCellsProps {
    currentTime?: Date;
    currentTimePosition?: number;
    isTimeWithinBounds?: boolean;
}

/** @private */
export interface TimeIndicatorProps {
    onPositionUpdate?: (position: number, isWithinBounds: boolean) => void;
    viewMode?: 'vertical' | 'timeline';
}

/** @private */
export interface VerticalViewProps {
    viewType?: View;
}

/** @private */
export interface ViewsInfo {
    /** The view type */
    viewType: View;
    /** The unique name identifier for the view */
    name: string;
    /** The display name of the view */
    displayName: string;
    /** The component element */
    component: ReactElement;
    interval: number;
}

/** @private */
export interface AllDayRowProps {
    isCollapsed: boolean;
    onCollapseChange?: () => void;
    onMoreEventsChange?: (hasMoreEvents: boolean) => void;
    renderDates?: CellData[];
}

/** @private */
export interface DayEventProps extends ProcessedEventsData {
    /**
     * Array of dates in the current week
     */
    weekRenderDates?: Date[];

    /**
     * Specifies the all day blocked event for month view.
     */
    isBlockedEvent?: boolean;

    /**
     * Unique index identifying the resource group.
     */
    groupIndex?: number;
}

/** @private */
export interface MonthCellsProps {
    /**
     * Handler for date click to navigate to day view
     */
    onDateClick?: (date: Date) => void;

    /**
     * Array of dates for this specific week/row
     */
    weekRenderDates: Date[];

    /**
     * Row index for unique key generation
     */
    rowIndex: number;

    /**
     * Specifies to hide the other month dates.
     */
    hideOtherMonths?: boolean;

    /**
     * Callback to share the calculated height for this row
     */
    onHeightCalculated?: (rowIndex: number, height: string) => void;

    /**
     * Pre-generated cells list for grouped/resource layouts
     * If provided, these cells will be used instead of generating from weekRenderDates
     *
     * @private
     */
    resourceWorkCells?: MonthCell[];
}

/** @private */
export interface ProcessedEventsData {
    event: EventModel;
    startDate?: Date;
    endDate?: Date;
    positionIndex?: number;
    timeDisplay?: string;
    eventKey?: string;
    guid?: string;
    eventClasses?: string[];
    eventStyle?: CSSProperties;
    totalOverlapping?: number;
    isFirstDay?: boolean;
    isLastDay?: boolean;
    isFirstSegmentInRenderRange?: boolean;
    segmentIndex?: number;
    totalSegments?: number;
    isMonthEvent?: boolean;
    rowIndex?: number;
    columnIndex?: number;
    isOverflowLeft?: boolean;
    isOverflowRight?: boolean;
    week?: Date[];
    groupIndex?: number;
    resourceIndex?: number;
}

/** @private */
export interface TimeSlot {
    key: string;
    date: Date;
    isMajorSlot: boolean;
    isLastSlotOfInterval: boolean;
    isLastSlotBeforeEnd: boolean;
    label: string;
    templateProps: TimeSlotProps;
    index: number;
    hour?: number;
    minute?: number;
    slotIndex?: number;
    minutesFromStart?: number;
}

/** @private */
export type Point = { clientX: number; clientY: number; }

/** @private */
export type AlertDialog = { isValid: boolean; shouldAlert: boolean; messageKey?: string; }

/** @private */
export interface CellData {
    /**
     * Specifies the cell type.
     */
    type: 'resourceHeader' | 'dateHeader' | 'monthWeekday' | 'hourHeader' | 'customRowsHeader';

    /**
     * Specifies the resource configuration.
     */
    resource?: SchedulerResource;

    /**
     * Specifies the resource data instance.
     */
    resourceData?: Record<string, any>;

    /**
     * Specifies the date value.
     */
    date?: Date;

    /**
     * Specifies the display name of the weekday.
     */
    dayName?: string;

    /**
     * Specifies the weekday index.
     */
    weekdayIndex?: number;

    /**
     * Specifies the CSS class for styling.
     */
    cssClass?: string;

    /**
     * Specifies resource-specific CSS classes.
     */
    className?: string[];

    /**
     * Specifies the column span for merged headers.
     */
    colSpan?: number;

    /**
     * Specifies the display text.
     */
    displayName?: string;

    /**
     * Specifies the level in the hierarchy.
     */
    level?: number;

    /**
     * Specifies the resource level index.
     */
    resourceLevelIndex?: number;

    /**
     * Specifies the hierarchical group order path.
     */
    groupOrder?: string[];

    /**
     * Specifies the group ID.
     */
    groupId?: string;

    /**
     * Specifies the sequential index for the resource slot.
     */
    groupIndex?: number;

    /**
     * Specifies the render dates for the resource.
     */
    renderDates?: Date[];

    /**
     * Specifies whether the cell represents a major (primary) time slot.
     */
    isMajorSlot?: boolean;

    /**
     * Specifies the end date for the cell, used when a cell spans a date range.
     */
    endDate?: Date;
}

/** @private */
export interface TimelineSlot {
    hour?: number;
    minute?: number;
    slotIndex?: number;
    isMajorBoundary?: boolean;
    minutesFromStart: number;
    state?: boolean;
    top?: number;
    width?: number;
    label?: string;
}

/** @private */
export interface TimelineProcessedEvent extends ProcessedEventsData {
    leftPx: number;
    widthPx: number;
    topPx: number;
    isBlockIndicator?: boolean;
}

/** @private */
export interface TimelineEventRow {
    key: string;
    date: Date;
    dateTimestamp: number;
    dateIndex: number;
    rowHeight: number;
    stackCount: number;
    events: TimelineProcessedEvent[];
    hiddenEventsInfo?: { count: number; };
    hiddenEventsInfoBySlot?: Map<number, { count: number; }>;
    eventsBySlot?: Map<number, TimelineProcessedEvent[]>;
}

/** @private */
export interface HeaderRowGroup {
    startDate: Date;
    endDate?: Date;
    startIndex?: number;
    endIndex?: number;
    label: string;
    weekNumber: number;
}

/**
 * Minimal structural shape accepted by id-resolution helpers. Both
 * `ResourceLevel` (tree nodes) and `TimelineResourceRowMeta` (header rows)
 * expose `resource` and `resourceData`, so the helpers can resolve the same
 * composite id from either without an intermediate lookup.
 *
 * @private
 */
export interface ResourceNodeRef {
    resource?: SchedulerResource;
    resourceData?: Record<string, any>;
}

/**
 * Item shape for the TreeView's bound data.
 *
 * Mirrors a `ResourceLevel` node from `useResourceGroupingContext().resourceTree`.
 * `selectable` is `false` on parent rows so only leaves drive selection.
 *
 * @private
 */
export interface ResourceTreeItem {
    /** Stable TreeView node id, composed as `${resource.name}_${getNodeId(node)}`. */
    id: string;
    /** Display label for the row. */
    label: string;
    /** `true` for leaf rows only; parents are non-selectable. */
    selectable: boolean;
    /** Nested child items; empty for leaves. */
    child?: ResourceTreeItem[];
    /** Zero-based leaf index; set on leaf rows and used by `onSelectedChange`. */
    leafIndex?: number;
    /** Original row data from the grouping service. */
    resourceData?: Record<string, any>;
    /** Original resource configuration. */
    resource?: SchedulerResource;
}
