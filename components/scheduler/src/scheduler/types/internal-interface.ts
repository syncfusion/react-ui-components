import { View } from '../types/enums';
import { ReactElement, CSSProperties, RefObject } from 'react';
import { EventModel, TimeSlotProps, SchedulerProps, ViewSpecificProps } from './scheduler-types';
import { CalendarView, CalendarChangeEvent } from '@syncfusion/react-calendars';
import { IMorePopup } from '../components/popup/more-popup';
import { IQuickInfoPopup } from '../components/popup/quick-info-popup';
import { IScheduler } from '../index';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';

/** @private */
export interface ActiveViewProps extends SchedulerProps, ViewSpecificProps {

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
     * return the available views (optional)
     */
    getAvailableViews?: () => ViewsInfo[];

    /**
     * Handler to show alert dialog
     */
    confirmationDialog?: ReturnType<typeof useConfirmationDialog>;
}

/** @private */
export interface IAllDayRow {
    hasMoreEvents: boolean;
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
    hideOtherMonths: boolean;

    /**
     * Callback to share the calculated height for this row
     */
    onHeightCalculated?: (rowIndex: number, height: string) => void;
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
    week?: Date[]
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
}

/** @private */
export type Point = { clientX: number; clientY: number; }
