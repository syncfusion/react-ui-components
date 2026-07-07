import { useMemo, useCallback } from 'react';
import { useProviderContext, cldrData, getValue, getDefaultDateObject, Browser } from '@syncfusion/react-base';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { CellData } from '../types/internal-interface';
import { ResourceGroupingService } from '../services/ResourceGroupingService';
import { useResourceGroupingContext } from '../context/resource-grouping-context';

/**
 * Interface for weekday header cell data
 *
 * @private
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

    /**
     * Column levels for grouped Month view (when grouping is enabled)
     */
    monthColumnLevels?: CellData[][];
}

/**
 * Custom hook for weekday header logic
 *
 * @returns {WeekDayHeaderResult} Weekday header data
 * @private
 */
export function useWeekDayHeader(): WeekDayHeaderResult {
    const { locale } = useProviderContext();
    const { firstDayOfWeek, showWeekend, workDays } = useSchedulerPropsContext();
    const { isGroupingEnabled, resourceTree, leafResources, groupConfig } = useResourceGroupingContext();

    /**
     * Get the weekday names for the month view header
     * Shows full weekday names based on firstDayOfWeek
     */
    const getWeekDayNames: () => string[] = useCallback((): string[] => {
        const weekDays: string[] = [];
        const mode: string = 'gregorian';
        const formatType: string = Browser.isDevice ? 'abbreviated' : 'wide';
        const standAloneKey: string = `days.stand-alone.${formatType}`;
        let cldrObj: string[];

        if (!locale || locale === 'en' || locale === 'en-US') {
            cldrObj = getValue(standAloneKey, getDefaultDateObject(mode));
        } else {
            const nameSpace: string = `main.${locale}.dates.calendars.${mode}.days.format.${formatType}`;
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

    /* weekdayHeaderCells defined after weekdayItems to avoid temporal dead zone */

    /**
     * Build weekday slots for month view grouping
     * Each slot represents a weekday column for resource grouping
     */
    /**
     * Generate a neutral list of weekday items to share logic
     */
    interface WeekdayItem {
        label: string;
        actualDayIndex: number;
        isCurrentDay: boolean;
        sourceIndex: number;
    }

    const weekdayItems: WeekdayItem[] = useMemo(() => {
        const weekDayNames: string[] = getWeekDayNames();
        const items: WeekdayItem[] = [];
        const dayOfWeek: number = new Date().getDay();

        if (showWeekend) {
            weekDayNames.forEach((day: string, index: number) => {
                const actualDayIndex: number = (index + firstDayOfWeek) % 7;
                const isCurrentDay: boolean = actualDayIndex === dayOfWeek;
                items.push({ label: day, actualDayIndex, isCurrentDay, sourceIndex: index });
            });
        } else {
            for (let i: number = 0; i < 7; i++) {
                const actualDayIndex: number = (i + firstDayOfWeek) % 7;
                if (workDays.includes(actualDayIndex)) {
                    const isCurrentDay: boolean = actualDayIndex === dayOfWeek;
                    items.push({
                        label: weekDayNames[i >= 0 && i < weekDayNames.length ? i : 0],
                        actualDayIndex,
                        isCurrentDay,
                        sourceIndex: i
                    });
                }
            }
        }

        return items;
    }, [firstDayOfWeek, showWeekend, workDays, getWeekDayNames]);

    /**
     * Map neutral weekday items to `CellData[]` slots
     */
    const weekdaySlots: CellData[] = useMemo(() => {
        return weekdayItems.map((item: WeekdayItem) => ({
            type: 'monthWeekday',
            dayName: item.label,
            weekdayIndex: item.actualDayIndex,
            className: ['sf-header-cells', ...(item.isCurrentDay ? ['sf-current-day'] : [])],
            key: `weekday-${item.sourceIndex}`
        } as CellData));
    }, [weekdayItems]);

    /**
     * Memoized weekday header cells mapped from shared weekday items
     */
    const weekdayHeaderCells: WeekDayHeaderCell[] = useMemo(() => {
        return weekdayItems.map((item: WeekdayItem) => ({
            day: item.label,
            isCurrentDay: item.isCurrentDay,
            className: `sf-header-cells ${item.isCurrentDay ? 'sf-current-day' : ''}`,
            key: `header-${item.sourceIndex}`
        }));
    }, [weekdayItems]);

    /**
     * Generate month column levels for grouped resource layout
     */
    const monthColumnLevels: CellData[][] = useMemo(() => {
        if (!isGroupingEnabled) { return undefined; }
        return ResourceGroupingService.generateColumnLevels(
            resourceTree,
            groupConfig,
            weekdaySlots,
            leafResources
        );
    }, [isGroupingEnabled, weekdaySlots, resourceTree, groupConfig, leafResources]);

    return {
        weekdayHeaderCells,
        monthColumnLevels
    };
}

export default useWeekDayHeader;
