import { useCallback, MouseEvent, useMemo } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { DateService } from '../services/DateService';
import { Browser, formatDate, isNullOrUndefined, useProviderContext } from '@syncfusion/react-base';
import { MonthCellsProps } from '../types/internal-interface';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { ResourceLevel } from '../services/ResourceGroupingService';
import useMonthEvents from './useMonthEvents';
import { useMoreIndicator } from './useMoreIndicator';
import { CSS_CLASSES } from '../common/constants';


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

    /**
     * Cell style used for calculating the width of month cells
     */
    cellStyle?: React.CSSProperties;

    /**
     * Resource information for this cell (grouped rendering mode only)
     * Only populated when resource grouping is enabled
     */
    resource?: ResourceLevel;

    /**
     * GroupIndex for data-group-index attribute
     * Represents the resource's position in the group sequence
     * For byDate=false: same groupIndex across all dates for a resource
     * For byDate=true: cycles through innermost resource count per date
     */
    groupIndex?: number;
}

/**
 * Interface for resource-specific month cells
 *
 * @private
 */
export interface ResourceMonthCells {
    /**
     * The resource this set of cells belongs to
     */
    resource: ResourceLevel;

    /**
     * Month cells for this resource
     */
    cells: MonthCell[];
}

/**
 * Interface for month work cells hook result
 * Supports both grouped (with resources) and non-grouped rendering modes
 *
 * @private
 */
export interface MonthCellsResult {
    /**
     * Processed data for non-grouped work cells.
     */
    workCells?: MonthCell[];

    /**
     * Resources with their associated cells for grouped mode (byDate=false).
     */
    resourceCells?: ResourceMonthCells[];

    /**
     * Cells organized by date then resource for grouped mode (byDate=true).
     */
    resourceByDateCells?: MonthCell[];

    /**
     * Handle more click for more event creation
     */
    handleMoreClick: (e: MouseEvent<HTMLElement>, date: Date, resource?: ResourceLevel) => void;
}

/**
 * Custom hook for month work cells logic
 * Supports both grouped (with resources) and non-grouped rendering modes
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
    const { isGroupingEnabled, leafResources, groupConfig } = useResourceGroupingContext();

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
     * Create a single month cell object
     * Helper to reduce duplication in cell generation logic
     *
     * @private
     */
    const createMonthCell: (params: {
        date: Date;
        rowIndex: number;
        cellIndex?: number;
        dateIndex?: number;
        resourceIndex?: number;
        resource: ResourceLevel;
        keyPrefix: string;
    }) => MonthCell = useCallback((params: {
        date: Date;
        rowIndex: number;
        cellIndex?: number;
        dateIndex?: number;
        resourceIndex?: number;
        resource: ResourceLevel;
        keyPrefix: string;
    }) => {
        const { date, rowIndex, cellIndex, dateIndex, resourceIndex, resource, keyPrefix } = params;
        const resourceKey: string = resource.groupOrder.join('-') || 'default';

        const key: string = (!isNullOrUndefined(cellIndex))
            ? `${keyPrefix}-${resourceKey}-${rowIndex}-${cellIndex}`
            : `${keyPrefix}-${resourceKey}-date-${rowIndex}-${dateIndex}-${resourceIndex}`;

        let className: string = getCellClassNames(date);
        className = `${className} ${CSS_CLASSES.RESOURCE_GROUPED_MONTH_CELL}`;

        return {
            date,
            className,
            dateTimestamp: date.getTime(),
            displayText: getDateDisplay(date),
            key,
            resource,
            groupIndex: resource.groupIndex ?? resourceIndex
        };
    }, [getCellClassNames, getDateDisplay]);

    /**
     * Generate cells for a specific resource's week
     * This creates the cell array that corresponds to the resource in the header
     *
     * @param {ResourceLevel} resource - The resource to generate cells for
     * @returns {MonthCell[]} Array of cells for this resource for this week
     */
    const generateCellsForResource: (resource: ResourceLevel) => MonthCell[] = useCallback(
        (resource: ResourceLevel): MonthCell[] => {
            const filteredRowDates: Date[] = showWeekend
                ? weekRenderDates
                : weekRenderDates.filter((date: Date) => DateService.isWorkDay(date, workDays));

            return filteredRowDates.map((date: Date, cellIndex: number): MonthCell =>
                createMonthCell({
                    date,
                    rowIndex,
                    cellIndex,
                    resource,
                    keyPrefix: 'resource'
                })
            );
        },
        [weekRenderDates, createMonthCell, showWeekend, workDays, rowIndex]
    );

    /**
     * Process the week dates into structured row cells (non-grouped mode)
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

    /**
     * Generate content slots for all resources
     * Used for byDate=false (resources as primary grouping)
     */
    const resourceCells: ResourceMonthCells[] | undefined = useMemo(() => {
        if (!isGroupingEnabled || !leafResources || groupConfig.byDate) {
            return undefined;
        }
        return leafResources.map((resource: ResourceLevel) => ({
            resource,
            cells: generateCellsForResource(resource)
        }));
    }, [isGroupingEnabled, generateCellsForResource, groupConfig.byDate]);

    /**
     * Generate cells organized by date first, then resource
     * Used for byDate=true (dates as primary grouping)
     */
    const resourceByDateCells: MonthCell[] | undefined = useMemo(() => {
        if (!isGroupingEnabled || !leafResources || !groupConfig.byDate) {
            return undefined;
        }

        const filteredRowDates: Date[] = showWeekend
            ? weekRenderDates
            : weekRenderDates.filter((date: Date) => DateService.isWorkDay(date, workDays));

        const cells: MonthCell[] = [];
        filteredRowDates.forEach((date: Date, dateIndex: number) => {
            leafResources.forEach((resource: ResourceLevel, resourceIndex: number) => {
                cells.push(createMonthCell({
                    date,
                    rowIndex,
                    dateIndex,
                    resourceIndex,
                    resource,
                    keyPrefix: 'bydate'
                }));
            });
        });

        return cells;
    }, [isGroupingEnabled, leafResources, groupConfig.byDate, weekRenderDates, createMonthCell, showWeekend, workDays, rowIndex]);

    return {
        workCells,
        resourceCells,
        resourceByDateCells,
        handleMoreClick
    };
}
