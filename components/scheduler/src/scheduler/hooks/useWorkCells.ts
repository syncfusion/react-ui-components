import { useMemo, JSX, ReactNode } from 'react';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { DateService, MINUTES_PER_HOUR } from '../services/DateService';
import { TimeScaleProps, WorkHoursProps, SchedulerCellProps } from '../types/scheduler-types';
import { CellData, TimelineSlot } from '../types/internal-interface';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { SchedulerHeaderRowsType, useSchedulerHeaderRowsContext } from '../context/scheduler-header-rows-context';
import { TimelineResourceRowMeta } from '../services/ResourceGroupingService';
import { CSS_CLASSES } from '../common/constants';

/**
 * Interface for the props accepted by useWorkCells hook
 */
interface UseWorkCellsProps {
    /**
     * The dates to render
     */
    renderDates: Date[];

    /**
     * The work days configuration
     */
    workDays: number[];

    /**
     * The work hours configuration
     */
    workHours: WorkHoursProps;

    /**
     * The custom template for cells
     */
    cell?: (props: SchedulerCellProps) => ReactNode;

    /**
     * The time scale configuration
     */
    timeScale: TimeScaleProps;

    /**
     * The start hour of the scheduler
     */
    startHour: string;

    /**
     * The end hour of the scheduler
     */
    endHour: string;

    /**
     * Whether it is a timeline view
     */
    isTimelineView?: boolean;

    /**
     * The time slots for timeline view
     */
    timeSlots?: TimelineSlot[];

    /**
     * Whether it is a month view
     */
    isMonthView?: boolean;
}

/**
 * Interface for a work cell
 *
 * @private
 */
export interface WorkCell {
    /**
     * The date for this cell
     */
    date: Date;

    /**
     * CSS class names for the cell
     */
    className: string;

    /**
     * Unique key for React rendering
     */
    key: string;

    /**
     * Data attributes for the cell
     */
    dataAttributes: {
        date: number;
        dateKey?: string;
        groupIndex?: number;
    };

    /**
     * Whether this cell is part of work hours
     */
    isWorkHour?: boolean;

    /**
     * Whether this date is today
     */
    isToday: boolean;

    /**
     * Whether this date is a weekend
     */
    isWeekend: boolean;

    /**
     * Whether this is an alternate cell
     */
    isAlternate?: boolean;

    /**
     * Resource group index (sequential position among leaf resources)
     */
    groupIndex?: number;

    /**
     * Horizontal column span in adaptive date/slot units (last-level grain).
     * Week/Month/Year last-track cells use this so one work cell fills the
     * full spanned width via `--sf-scheduler-col-span`.
     */
    colSpan?: number;

    /**
     * End date for cells that span a range (e.g. Week/Month/Year last-track header groups).
     */
    endDate?: Date;
}

/**
 * Interface for the result of useWorkCells hook
 */
interface UseWorkCellsResult {
    /**
     * Processed work cell rows
     */
    workCellRows: {
        key: string;
        dataAttribute?: string;
        cells: WorkCell[];
    }[];

    /**
     * Function to render the cell template
     */
    renderCellTemplate: (date: Date) => JSX.Element | null;
}

/**
 * Custom hook to process work cells and provide related functionalities
 *
 * @param {UseWorkCellsProps} props - The props for work cells
 * @returns {UseWorkCellsResult} Processed cells data and related functions
 * @private
 */
export const useWorkCells: (props: UseWorkCellsProps) => UseWorkCellsResult = (props: UseWorkCellsProps): UseWorkCellsResult => {
    const {
        renderDates,
        workDays,
        workHours,
        cell,
        timeScale,
        startHour,
        endHour,
        isTimelineView,
        timeSlots,
        isMonthView
    } = props;

    const { hours: startHours, minutes: startMinutes } = DateService.parseTimeString(startHour || '00:00');
    const { hours: endHours, minutes: endMinutes } = endHour === '24:00'
        ? { hours: 24, minutes: 0 } : DateService.parseTimeString(endHour || '24:00');

    const { isGroupingEnabled, columnLevels, visibleResourceHeaders } = useResourceGroupingContext();
    const { timezone } = useSchedulerPropsContext();
    const columnLastLevelData: CellData[] = isGroupingEnabled && !isTimelineView && columnLevels.length > 0
        ? columnLevels[columnLevels.length - 1]
        : [];

    const headerRowsInfo: SchedulerHeaderRowsType = useSchedulerHeaderRowsContext();
    const headerLastLevelData: CellData[] = (isTimelineView && headerRowsInfo && headerRowsInfo.headerLastLevel.length > 0)
        ? headerRowsInfo.headerLastLevel : [];
    const effectiveLastLevelData: CellData[] = columnLastLevelData.length > 0
        ? columnLastLevelData : headerLastLevelData;
    const effectiveRenderDates: Date[] = columnLastLevelData.length > 0
        ? columnLastLevelData.map((cell: CellData) => cell.date as Date) : renderDates;

    const renderCellTemplate: (date: Date) => JSX.Element | null =
        (date: Date): JSX.Element | null => {
            if (!cell) { return null; }
            return cell({ date, type: 'workCell' }) as JSX.Element;
        };

    const workCellRows: {
        key: string;
        dataAttribute?: string;
        cells: WorkCell[];
    }[] = useMemo(() => {
        const rows: {
            key: string;
            dataAttribute?: string;
            cells: WorkCell[];
        }[] = [];

        if (isTimelineView && timeSlots) {
            const now: Date = DateService.getCurrentTime(timezone);

            const buildCells: (groupIndex?: number) => WorkCell[] = (groupIndex?: number): WorkCell[] =>
                effectiveLastLevelData.map((cell: CellData, colIdx: number) => {
                    const isWeekendRow: boolean = DateService.isWeekend(cell.date, workDays);
                    const isTodayRow: boolean = DateService.isSameDay(cell.date, now);
                    const isWorkDayRow: boolean = DateService.isWorkDay(cell.date, workDays);
                    const isMajor: boolean = cell.isMajorSlot;
                    const cellKey: string = !isNullOrUndefined(groupIndex) ? `cell-${groupIndex}-${colIdx}` : `cell-${colIdx}`;
                    const isWorkHour: boolean = DateService.isWorkHour(cell.date, workHours, workDays) ||
                        (!isMonthView && isWorkDayRow && isNullOrUndefined(isMajor)); // IsMajor is undefined means no hour header.
                    const className: string = [
                        CSS_CLASSES.WORK_CELLS,
                        !isMonthView && isMajor ? CSS_CLASSES.ALTERNATE_CELLS : '',
                        isTodayRow ? CSS_CLASSES.TODAY : '',
                        isWeekendRow ? CSS_CLASSES.WEEKEND : '',
                        isWorkHour ? CSS_CLASSES.WORK_HOURS : '',
                        isMonthView && isWorkDayRow ? CSS_CLASSES.WORK_DAYS : ''
                    ].filter(Boolean).join(' ');
                    const groupIndexProps: { groupIndex?: number } = !isNullOrUndefined(groupIndex) ? { groupIndex } : {};

                    return {
                        date: cell.date,
                        className,
                        key: cellKey,
                        dataAttributes: {
                            date: cell.date.getTime(),
                            dateKey: DateService.generateDateKey(cell.date),
                            ...groupIndexProps
                        },
                        isWorkHour,
                        isToday: isTodayRow,
                        isWeekend: isWeekendRow,
                        isAlternate: !isMonthView && isMajor,
                        ...groupIndexProps,
                        colSpan: cell.colSpan ?? 1,
                        endDate: cell.endDate
                    };
                });

            if (visibleResourceHeaders?.length > 0) {
                visibleResourceHeaders.forEach((row: TimelineResourceRowMeta) => {
                    const groupIndex: number = row.groupIndex;
                    rows.push({
                        key: !isNullOrUndefined(groupIndex) ? `timeline-row-${groupIndex}` : 'timeline-row',
                        cells: buildCells(groupIndex)
                    });
                });
            } else {
                rows.push({ key: 'timeline-row', cells: buildCells() });
            }
            return rows;
        }

        if (!timeScale?.enable) {
            // For disabled time scale, create a single row with full-day cells
            const cells: WorkCell[] = effectiveRenderDates.map((date: Date, dateIndex: number) => {
                const cellDate: Date = new Date(date);
                cellDate.setHours(0, 0, 0, 0);
                const isToday: boolean = DateService.isSameDay(date, new Date());
                const isWeekend: boolean = DateService.isWeekend(date, workDays);
                const groupIndex: number | undefined = columnLastLevelData[parseInt(dateIndex.toString(), 10)]?.groupIndex;
                const isWorkHour: boolean = DateService.isWorkHour(cellDate, {start: '00:00', end: '24:00', highlight: true }, workDays);

                const className: string = [
                    CSS_CLASSES.WORK_CELLS,
                    CSS_CLASSES.TIMESCALE_DISABLED_CELL,
                    isToday ? CSS_CLASSES.TODAY : '',
                    isWeekend ? CSS_CLASSES.WEEKEND : '',
                    isWorkHour ? CSS_CLASSES.WORK_HOURS : ''
                ].filter(Boolean).join(' ');

                return {
                    date: cellDate,
                    className,
                    key: `${dateIndex}-${date.getTime()}-timescale-disabled`,
                    dataAttributes: {
                        date: cellDate.getTime(),
                        dateKey: DateService.generateDateKey(date),
                        groupIndex
                    },
                    isToday,
                    isWeekend,
                    groupIndex
                };
            });

            rows.push({
                key: 'disabled-timescale-row',
                cells
            });
        } else {
            // For enabled time scale, create rows based on time slots
            const startTimeInMinutes: number = startHours * MINUTES_PER_HOUR + startMinutes;
            const endTimeInMinutes: number = endHours * MINUTES_PER_HOUR + endMinutes;
            let intervalStartTime: number = startTimeInMinutes;

            while (intervalStartTime < endTimeInMinutes) {
                for (let slotIndex: number = 0; slotIndex < timeScale.slotCount; slotIndex++) {
                    const slotTimeInMinutes: number = intervalStartTime + (slotIndex * (timeScale.interval / timeScale.slotCount));
                    if (slotTimeInMinutes >= endTimeInMinutes) {
                        break;
                    }

                    const currentHour: number = Math.floor(slotTimeInMinutes / MINUTES_PER_HOUR);
                    const currentMinute: number = Math.floor(slotTimeInMinutes % MINUTES_PER_HOUR);
                    const isLastSlotOfInterval: boolean = slotIndex === timeScale.slotCount - 1;
                    const isAlternate: boolean = !isLastSlotOfInterval;

                    const rowKey: string = `${currentHour}-${currentMinute}`;
                    const dataAttribute: string = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;

                    // Create cells for this row
                    const cells: WorkCell[] = effectiveRenderDates.map((date: Date, dateIndex: number) => {
                        const cellDate: Date = new Date(date);
                        cellDate.setHours(currentHour, currentMinute, 0, 0);
                        const isWorkHour: boolean = DateService.isWorkHour(cellDate, workHours, workDays);
                        const isToday: boolean = DateService.isSameDay(date, new Date());
                        const isWeekend: boolean = DateService.isWeekend(date, workDays);
                        const groupIndex: number | undefined = columnLastLevelData[parseInt(dateIndex.toString(), 10)]?.groupIndex;

                        const className: string = [
                            CSS_CLASSES.WORK_CELLS,
                            isAlternate ? CSS_CLASSES.ALTERNATE_CELLS : '',
                            isToday ? CSS_CLASSES.TODAY : '',
                            isWeekend ? CSS_CLASSES.WEEKEND : '',
                            isWorkHour ? CSS_CLASSES.WORK_HOURS : ''
                        ].filter(Boolean).join(' ');

                        return {
                            date: cellDate,
                            className,
                            key: `${dateIndex}-${date.getTime()}-${currentHour}-${currentMinute}`,
                            dataAttributes: {
                                date: cellDate.getTime(),
                                groupIndex
                            },
                            isWorkHour,
                            isToday,
                            isWeekend,
                            isAlternate,
                            groupIndex
                        };
                    });

                    rows.push({
                        key: rowKey,
                        dataAttribute,
                        cells
                    });
                }
                intervalStartTime += timeScale.interval;
            }
        }

        return rows;
    }, [
        effectiveRenderDates,
        timeScale,
        startHours,
        startMinutes,
        endHours,
        endMinutes,
        workDays,
        workHours,
        columnLastLevelData,
        isTimelineView,
        timeSlots,
        isMonthView,
        timezone,
        visibleResourceHeaders
    ]);

    return {
        workCellRows,
        renderCellTemplate
    };
};

export default useWorkCells;
