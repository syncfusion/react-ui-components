import { useState, useCallback, MouseEvent } from 'react';
import { DateService } from '../services/DateService';
import { useProviderContext, formatDate } from '@syncfusion/react-base';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { SchedulerViewChangeEvent, SchedulerDateChangeEvent } from '../types/scheduler-types';
import { ViewService } from '../services/ViewService';

/**
 * Interface for date header cell data
 *
 * @private
 */
export interface DateHeaderCell {
    /**
     * The date for this cell
     */
    date?: Date;

    /**
     * Display name of the weekday
     */
    dayName: string;

    /**
     * The date for this cell
     */
    dateNumber?: string;

    /**
     * Whether this date is today
     */
    isToday?: boolean;

    /**
     * Whether this date is a weekend
     */
    isWeekend?: boolean;

    /**
     * CSS class names for the cell
     */
    className: string;

    /**
     * Unique key for React rendering
     */
    key: string;
}

/**
 * Interface for date header hook result
 *
 * @private
 */
interface DateHeaderResult {
    /**
     * Processed header cells data for date headers
     * (For day/week/workweek views: date cells)
     */
    headerCells: DateHeaderCell[];

    /**
     * Whether the all-day section is collapsed
     */
    isAllDayCollapsed: boolean;

    /**
     * Whether to show the all-day toggle button
     */
    showAllDayToggle: boolean;

    /**
     * Week number for the current date range
     */
    weekNumber: number | null;

    /**
     * Toggle the collapsed state of all-day section
     */
    toggleAllDayCollapse: () => void;

    /**
     * Callback to handle changes in more events indicator state
     */
    handleMoreEventsChange: (hasMoreEvents: boolean) => void;
}

/**
 * Custom hook for date header logic
 *
 * @returns {DateHeaderResult} Date header data and functions
 * @private
 */
export function useDateHeader(): DateHeaderResult {

    const { renderDates } = useSchedulerRenderDatesContext();
    const { showWeekNumber, workDays } = useSchedulerPropsContext();
    const { locale } = useProviderContext();

    const [isAllDayCollapsed, setIsAllDayCollapsed] = useState<boolean>(true);
    const [showAllDayToggle, setShowAllDayToggle] = useState<boolean>(false);

    const weekNumber: number | null = renderDates.length > 0 && showWeekNumber
        ? DateService.getWeekNumber(renderDates[0])
        : null;

    const handleMoreEventsChange: (hasMoreEvents: boolean) => void = useCallback((hasMoreEvents: boolean): void => {
        setShowAllDayToggle(hasMoreEvents);
    }, []);

    const toggleAllDayCollapse: () => void = useCallback((): void => {
        setIsAllDayCollapsed((prevState: boolean) => !prevState);
    }, []);

    const headerCells: DateHeaderCell[] = renderDates.map((date: Date, index: number): DateHeaderCell => {
        const isToday: boolean = DateService.isSameDay(date, new Date());
        const isWeekend: boolean = DateService.isWeekend(date, workDays);
        const dayName: string = formatDate(date, { type: 'date', skeleton: 'E', locale });
        const dateNumber: string = formatDate(date, { type: 'date', skeleton: 'd', locale });

        const cellClassNames: string = [
            'sf-header-cells',
            isToday ? 'sf-current-day' : '',
            isWeekend ? 'sf-weekend' : ''
        ].filter(Boolean).join(' ');

        return {
            date,
            dayName,
            dateNumber,
            isToday,
            isWeekend,
            className: cellClassNames,
            key: `sf-header-cells-${index}`
        };
    });

    return {
        headerCells,
        isAllDayCollapsed,
        showAllDayToggle,
        weekNumber,
        toggleAllDayCollapse,
        handleMoreEventsChange
    };
}

/**
 * Interface for naviagte hook result
 */
interface NavigateResult {

    /**
     * Handle date click to navigate to day view
     */
    handleDateClick: (event: MouseEvent<HTMLElement>, date: Date) => void;
}

/**
 * Custom hook for date navigation logic
 *
 * @returns {NavigateResult} Date header data and functions
 * @private
 */
export function useNavigate(): NavigateResult {

    const {
        onViewChange,
        onSelectedDateChange, getAvailableViews
    } = useSchedulerPropsContext();

    /**
     * Handle date click to navigate to day view
     *
     * @param {MouseEvent<HTMLElement>} event - The mouse event that initiated the date click.
     * @param {Date} date - The date that was clicked
     */
    const handleDateClick: (event: MouseEvent<HTMLElement>, date: Date) => void =
    useCallback((event: MouseEvent<HTMLElement>, date: Date): void => {
        event.preventDefault();
        event.stopPropagation();
        const isDayViewAvailable: boolean = ViewService.isDayViewAvailable(getAvailableViews);
        if (isDayViewAvailable) {
            const dateChangeEvent: SchedulerDateChangeEvent = {
                value: date
            };
            onSelectedDateChange(dateChangeEvent);
            const viewChangeEvent: SchedulerViewChangeEvent = {
                value: 'Day'
            };
            onViewChange(viewChangeEvent);
        }
    }, [onSelectedDateChange, onViewChange]);

    return {
        handleDateClick
    };
}
