import { useCallback, MouseEvent } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { DateService } from '../services/DateService';
import { Browser, formatDate, useProviderContext } from '@syncfusion/react-base';
import { MonthCellsProps } from '../types/internal-interface';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import useMonthEvents from './useMonthEvents';
import { useMoreIndicator } from './useMoreIndicator';


/**
 * Interface for month work cell data
 *
 * @private
 */
export interface MonthCell {
    /**
     * The date for this cell
     */
    date: Date;

    /**
     * CSS class names for the cell
     */
    className: string;

    /**
     * Date timestamp for data attribute
     */
    dateTimestamp: number;

    /**
     * Formatted date display string
     */
    displayText: string;

    /**
     * Unique key for React rendering
     */
    key: string;
}

/**
 * Interface for month work cells hook result
 *
 * @private
 */
export interface MonthCellsResult {
    /**
     * Processed data for month work cells
     */
    workCells: MonthCell[];

    /**
     * Handle more click for more event creation
     */
    handleMoreClick: (e: MouseEvent<HTMLElement>, date: Date) => void;
}

/**
 * Custom hook for month work cells logic
 *
 * @param {MonthCellsProps} props - The props for month cells
 * @returns {MonthCellsResult} Month cells data and functions
 * @private
 */
export function useMonthCells(props: MonthCellsProps): MonthCellsResult {
    const { weekRenderDates, rowIndex } = props;

    const {
        selectedDate,
        workDays,
        showWeekend,
        maxEventsPerRow = 3
    } = useSchedulerPropsContext();

    const { locale } = useProviderContext();
    const { renderDates } = useSchedulerRenderDatesContext();

    const { getAllEventsForDate } = useMonthEvents(renderDates, maxEventsPerRow);
    const { handleMoreClick } = useMoreIndicator(getAllEventsForDate);

    /**
     * Get the class names for a date cell
     *
     * @param {Date} date - The date to get class names for
     * @returns {string} The class names string
     */
    const getCellClassNames: (date: Date) => string = useCallback((date: Date): string => {
        let classNames: string = 'sf-work-cells';
        if (DateService.isWorkDay(date, workDays)) {
            classNames += ' sf-work-days';
        }
        if (DateService.isToday(date)) {
            classNames += ' sf-current-date';
        }
        if (!DateService.isSameMonth(date, selectedDate)) {
            classNames += ' sf-other-month';
        }
        return classNames;
    }, [workDays, selectedDate]);

    /**
     * Format the date display in the cell
     *
     * @param {Date} date - The date to format
     * @returns {string} The formatted date string
     */
    const getDateDisplay: (date: Date) => string = useCallback((date: Date): string => {
        if (date.getDate() === 1 && !Browser.isDevice) {
            return formatDate(date, {
                type: 'dateTime',
                format: 'MMM d',
                locale: locale
            });
        } else {
            return formatDate(date, {
                type: 'dateTime',
                format: 'd',
                locale: locale
            });
        }
    }, [locale]);

    /**
     * Process the week dates into structured row cells
     */
    const workCells: MonthCell[] = useCallback((): MonthCell[] => {

        const filteredRowDates: Date[] = showWeekend
            ? weekRenderDates
            : weekRenderDates.filter((date: Date) => DateService.isWorkDay(date, workDays));

        return filteredRowDates.map((date: Date, j: number): MonthCell => ({
            date,
            className: getCellClassNames(date),
            dateTimestamp: date.getTime(),
            displayText: getDateDisplay(date),
            key: `date-${rowIndex}-${j}`
        }));
    }, [weekRenderDates, getCellClassNames, getDateDisplay, showWeekend, workDays, rowIndex])();

    return {
        workCells,
        handleMoreClick
    };
}
