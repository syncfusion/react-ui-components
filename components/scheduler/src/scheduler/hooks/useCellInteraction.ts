import { MouseEvent, useCallback } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { SchedulerCellClickEvent } from '../types/scheduler-types';
import { clearAndSelect } from '../utils/actions';
import { MS_PER_MINUTE } from '../services/DateService';
import { CSS_CLASSES } from '../common/constants';

/** @private */
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

    const { timeScale, onCellClick, onCellDoubleClick, readOnly, quickPopupRef } = useSchedulerPropsContext();

    const createEventArgs: (e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean) => SchedulerCellClickEvent =
        useCallback((e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean): SchedulerCellClickEvent => {
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
                cancel: false,
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
                (e.target as HTMLElement)?.classList.contains(CSS_CLASSES.HEADER_DATE) || readOnly) {
                return;
            }
            clearAndSelect(e.currentTarget as HTMLElement);
            if (onCellClick) {
                const args: SchedulerCellClickEvent = createEventArgs(e as MouseEvent<HTMLElement>, date, isAllDay);
                onCellClick(args);
                if (args.cancel) { return; }
            }
        }, [onCellClick, createEventArgs]);

    const handleCellDoubleClick: (e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean) => void =
        useCallback((e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean): void => {
            if (readOnly) { return; }
            clearAndSelect(e.currentTarget as HTMLElement);
            if (onCellDoubleClick) {
                quickPopupRef?.current?.hide();
                const args: SchedulerCellClickEvent = createEventArgs(e, date, isAllDay);
                onCellDoubleClick(args);
                if (args.cancel) { return; }
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
