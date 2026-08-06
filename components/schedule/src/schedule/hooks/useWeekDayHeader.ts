import { useCallback } from 'react';
import { useProviderContext, cldrData, getValue, getDefaultDateObject } from '@syncfusion/react-base';
import { useSchedulePropsContext } from '../context/schedule-context';

/**
 * Interface for weekday header cell data
 */
export interface WeekDayHeaderCell {
    /**
     * Display name of the weekday
     */
    day: string;

    /**
     * Whether this date is a current day
     */
    isCurrentDay: boolean;

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
 * Interface for weekday header hook result
 */
interface WeekDayHeaderResult {
    /**
     * Processed header cells data for weekday headers
     */
    weekdayHeaderCells: WeekDayHeaderCell[];
}

/**
 * Custom hook for weekday header logic
 *
 * @returns {WeekDayHeaderResult} Weekday header data
 */
export function useWeekDayHeader(): WeekDayHeaderResult {
    const { locale } = useProviderContext();
    const { firstDayOfWeek, showWeekend, workDays } = useSchedulePropsContext();

    /**
     * Get the weekday names for the month view header
     * Shows full weekday names based on firstDayOfWeek
     */
    const getWeekDayNames: () => string[] = useCallback((): string[] => {
        const weekDays: string[] = [];
        const mode: string = 'gregorian';
        let cldrObj: string[];

        if (!locale || locale === 'en' || locale === 'en-US') {
            cldrObj = getValue('days.stand-alone.wide', getDefaultDateObject(mode));
        } else {
            const nameSpace: string = `main.${locale}.dates.calendars.${mode}.days.format.wide`;
            cldrObj = getValue(nameSpace, cldrData);
        }

        for (const obj of Object.keys(cldrObj)) {
            weekDays.push(getValue(obj, cldrObj));
        }

        return Array.from({ length: 7 }, (_: unknown, i: number) => {
            const dayIndex: number = (i + firstDayOfWeek) % 7;
            return weekDays[dayIndex >= 0 && dayIndex < weekDays.length ? dayIndex : 0];
        });
    }, [firstDayOfWeek, locale]);

    /**
     * Process weekday headers for month view with current day highlighting
     */
    const weekdayHeaderCells: () => WeekDayHeaderCell[] = useCallback((): WeekDayHeaderCell[] => {
        const weekDayNames: string[] = getWeekDayNames();
        const dayOfWeek: number = new Date().getDay();

        if (showWeekend) {
            return weekDayNames.map((day: string, index: number) => {
                const actualDayIndex: number = (index + firstDayOfWeek) % 7;
                const isCurrentDay: boolean = actualDayIndex === dayOfWeek;
                return {
                    day,
                    isCurrentDay,
                    className: `sf-header-cells ${isCurrentDay ? 'sf-current-day' : ''}`,
                    key: `header-${index}`
                };
            });
        } else {
            const result: WeekDayHeaderCell[] = [];
            for (let i: number = 0; i < 7; i++) {
                const actualDayIndex: number = (i + firstDayOfWeek) % 7;
                if (workDays.includes(actualDayIndex)) {
                    const isCurrentDay: boolean = actualDayIndex === dayOfWeek;
                    result.push({
                        day: weekDayNames[i >= 0 && i < weekDayNames.length ? i : 0],
                        isCurrentDay,
                        className: `sf-header-cells ${isCurrentDay ? 'sf-current-day' : ''}`,
                        key: `header-${i}`
                    });
                }
            }
            return result;
        }
    }, [firstDayOfWeek, showWeekend, workDays, getWeekDayNames]);

    return {
        weekdayHeaderCells: weekdayHeaderCells()
    };
}

export default useWeekDayHeader;
