import { useMemo, JSX } from 'react';
import { DateService, MINUTES_PER_HOUR } from '../services/DateService';
import { TimeScaleModel, WorkHoursModel } from '../types/schedule-types';

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
    workHours: WorkHoursModel;

    /**
     * The custom template for cells
     */
    cellTemplate?: React.ReactNode | ((props: { date: Date, type: string }) => React.ReactNode);

    /**
     * The time scale configuration
     */
    timeScale: TimeScaleModel;

    /**
     * The start hour of the schedule
     */
    startHour: string;

    /**
     * The end hour of the schedule
     */
    endHour: string;

}

/**
 * Interface for a work cell
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
 */
export const useWorkCells: (props: UseWorkCellsProps) => UseWorkCellsResult = (props: UseWorkCellsProps): UseWorkCellsResult => {
    const {
        renderDates,
        workDays,
        workHours,
        cellTemplate,
        timeScale,
        startHour,
        endHour
    } = props;

    const { hours: startHours, minutes: startMinutes } = DateService.parseTimeString(startHour || '00:00');
    const { hours: endHours, minutes: endMinutes } = endHour === '24:00'
        ? { hours: 24, minutes: 0 } : DateService.parseTimeString(endHour || '24:00');

    const renderCellTemplate: (date: Date) => JSX.Element | null =
    (date: Date): JSX.Element | null => {
        if (!cellTemplate) {
            return null;
        }
        return typeof cellTemplate === 'function' ?
            cellTemplate({ date, type: 'workCell' }) as JSX.Element :
            cellTemplate as JSX.Element;
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

        if (!timeScale.enable) {
            // For disabled time scale, create a single row with full-day cells
            const cells: WorkCell[] = renderDates.map((date: Date) => {
                const cellDate: Date = new Date(date);
                cellDate.setHours(0, 0, 0, 0);
                const isToday: boolean = DateService.isSameDay(date, new Date());
                const isWeekend: boolean = DateService.isWeekend(date, workDays);

                const className: string = [
                    'sf-work-cells',
                    'sf-timescale-disabled-cell',
                    isToday ? 'sf-today' : '',
                    isWeekend ? 'sf-weekend' : ''
                ].filter(Boolean).join(' ');

                return {
                    date: cellDate,
                    className,
                    key: `${date.getTime()}-timescale-disabled`,
                    dataAttributes: {
                        date: cellDate.getTime(),
                        dateKey: DateService.generateDateKey(date)
                    },
                    isToday,
                    isWeekend
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
                    const cells: WorkCell[] = renderDates.map((date: Date) => {
                        const cellDate: Date = new Date(date);
                        cellDate.setHours(currentHour, currentMinute, 0, 0);
                        const isWorkHour: boolean = DateService.isWorkHour(cellDate, workHours, workDays);
                        const isToday: boolean = DateService.isSameDay(date, new Date());
                        const isWeekend: boolean = DateService.isWeekend(date, workDays);

                        const className: string = [
                            'sf-work-cells',
                            isAlternate ? 'sf-alternate-cells' : '',
                            isToday ? 'sf-today' : '',
                            isWeekend ? 'sf-weekend' : '',
                            isWorkHour ? 'sf-work-hours' : ''
                        ].filter(Boolean).join(' ');

                        return {
                            date: cellDate,
                            className,
                            key: `${date.getTime()}-${currentHour}-${currentMinute}`,
                            dataAttributes: {
                                date: cellDate.getTime()
                            },
                            isWorkHour,
                            isToday,
                            isWeekend,
                            isAlternate
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
        renderDates,
        timeScale,
        startHours,
        startMinutes,
        endHours,
        endMinutes,
        workDays,
        workHours
    ]);

    return {
        workCellRows,
        renderCellTemplate
    };
};

export default useWorkCells;
