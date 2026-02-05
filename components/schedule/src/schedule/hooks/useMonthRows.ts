import { useMemo, CSSProperties } from 'react';
import { useSchedulePropsContext } from '../context/schedule-context';
import { useScheduleRenderDatesContext } from '../context/schedule-render-dates-context';
import { DateService, WEEK_LENGTH } from '../services/DateService';

/**
 * Interface for month rows hook result
 */
export interface MonthRowsResult {
    /**
     *  Week numbers for the month view
     */
    weekNumbers: number[];

    /**
     * Array of week render dates for each row
     */
    weeksToRender: Date[][];

    /**
     * CSS properties for the content table
     */
    contentTableStyle?: React.CSSProperties;

    /**
     * Additional class for custom weeks
     */
    additionalClass: string;

    /**
     * Specifies to hide the other month dates.
     */
    hideOtherMonths: boolean;
}

/**
 * Custom hook for month rows logic that processes render dates by week
 *
 * @returns {MonthRowsResult} Month rows data and configuration
 */
export function useMonthRows(): MonthRowsResult {
    const {
        numberOfWeeks,
        interval,
        showTrailingAndLeadingDates = true,
        showWeekend,
        workDays
    } = useSchedulePropsContext();

    const { renderDates } = useScheduleRenderDatesContext();

    /**
     * processes both week dates and week numbers
     */
    const { weeksToRender, weekNumbers } = useMemo(() => {
        if (!renderDates || renderDates.length === 0) {
            return { weeksToRender: [], weekNumbers: [] };
        }

        const weeks: Date[][] = [];
        const weekNums: number[] = [];
        const daysPerRow: number = showWeekend ? WEEK_LENGTH : workDays?.length;

        for (let i: number = 0; i < renderDates.length; i += daysPerRow) {
            const weekDates: Date[] = renderDates.slice(i, i + daysPerRow);
            if (weekDates.length > 0) {
                weeks.push(weekDates);
                // Calculate week number from the first date of the week
                const weekStartDate: Date = weekDates[0];
                const weekNumber: number = DateService.getWeekNumber(weekStartDate);
                weekNums.push(weekNumber);
            }
        }

        return { weeksToRender: weeks, weekNumbers: weekNums };
    }, [renderDates, showWeekend, workDays]);

    const hideOtherMonths: boolean = useMemo(() => {
        return !showTrailingAndLeadingDates && !(numberOfWeeks || interval > 1);
    }, [showTrailingAndLeadingDates, numberOfWeeks, interval]);

    const contentTableStyle: CSSProperties = useMemo(() => {
        return numberOfWeeks ? { '--week-count': numberOfWeeks } as CSSProperties : undefined;
    }, [numberOfWeeks]);

    const additionalClass: string = useMemo(() => {
        return [
            numberOfWeeks && 'sf-custom-weeks',
            hideOtherMonths && 'sf-hide-dates'
        ].filter(Boolean).join(' ');
    }, [numberOfWeeks, hideOtherMonths]);

    return {
        weekNumbers,
        weeksToRender,
        contentTableStyle,
        additionalClass,
        hideOtherMonths
    };
}
