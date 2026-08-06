import { MouseEvent, useCallback } from 'react';
import { useSchedulePropsContext } from '../context/schedule-context';
import { CellClickEvent } from '../types/schedule-types';
import { clearAndSelect } from '../utils/actions';
import { MS_PER_MINUTE } from '../services/DateService';
import { CSS_CLASSES } from '../common/constants';

export interface CellInteraction {
    /**
     * Handle cell click for event creation
     */
    handleCellClick: (e: MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>, date: Date, isAllDay?: boolean) => void;

    /**
     * Handle header cell double click for event creation
     */
    handleCellDoubleClick: (e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean) => void;

    /**
     * Handle key down event for accessibility
     */
    handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, date: Date) => void;
}

export const useCellInteraction: () => CellInteraction = (): CellInteraction => {

    const { timeScale, onCellClick, onCellDoubleClick } = useSchedulePropsContext();

    const createEventArgs: (e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean) => CellClickEvent =
        useCallback((e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean): CellClickEvent => {
            const endTime: Date = new Date(date);
            if (!timeScale.enable || isAllDay) {
                date.setHours(0, 0, 0, 0);
                endTime.setDate(endTime.getDate() + 1);
                endTime.setHours(0, 0, 0, 0);
                isAllDay = true;
            } else {
                endTime.setTime(date.getTime() + (timeScale.interval / timeScale.slotCount) * MS_PER_MINUTE);
            }
            return {
                nativeEvent: e.nativeEvent,
                startTime: date,
                endTime,
                isAllDay: !!isAllDay,
                element: e.currentTarget
            };
        }, [timeScale]);

    const handleCellClick: (e: MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
        date: Date, isAllDay?: boolean) => void = useCallback(
        (e: MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
         date: Date,
         isAllDay?: boolean
        ): void => {
            if ((e.target as HTMLElement)?.classList.contains(CSS_CLASSES.DATE_HEADER) ||
                (e.target as HTMLElement)?.classList.contains(CSS_CLASSES.HEADER_DATE)) {
                return;
            }
            clearAndSelect(e.currentTarget as HTMLElement);
            if (onCellClick) {
                onCellClick(createEventArgs(e as MouseEvent<HTMLElement>, date, isAllDay));
            }
        }, [onCellClick, createEventArgs]);

    const handleCellDoubleClick: (e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean) => void =
        useCallback((e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean): void => {
            clearAndSelect(e.currentTarget as HTMLElement);
            if (onCellDoubleClick) {
                onCellDoubleClick(createEventArgs(e, date, isAllDay));
            }
        }, [onCellDoubleClick, createEventArgs]);

    const handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, date: Date) => void =
        (e: React.KeyboardEvent<HTMLElement>, date: Date): void => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCellClick(e, date);
            }
        };

    return {
        handleCellClick,
        handleCellDoubleClick,
        handleKeyDown
    };
};

export default useCellInteraction;
