import { MouseEvent, useCallback } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { SchedulerCellClickEvent } from '../types/scheduler-types';
import { clearAndSelect, getGroupIndexFromElement } from '../utils/actions';
import { MS_PER_MINUTE } from '../services/DateService';
import { CSS_CLASSES } from '../common/constants';
import { isNullOrUndefined } from '@syncfusion/react-base';

/** @private */
export interface CellInteraction {
    /**
     * Handle cell click for event creation
     */
    handleCellClick: (e: MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
        startDate: Date, isAllDay?: boolean, endDate?: Date) => void;

    /**
     * Handle header cell double click for event creation
     */
    handleCellDoubleClick: (e: MouseEvent<HTMLElement>, startDate: Date, isAllDay?: boolean, endDate?: Date) => void;

    /**
     * Handle key down event for accessibility
     */
    handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, startDate: Date, isAllDay?: boolean, endDate?: Date) => void;
}

export const useCellInteraction: () => CellInteraction = (): CellInteraction => {

    const { timeScale, onCellClick, onCellDoubleClick, readOnly, quickPopupRef } = useSchedulerPropsContext();

    const createEventArgs: (e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean, endDate?: Date) => SchedulerCellClickEvent =
        useCallback((e: MouseEvent<HTMLElement>, date: Date, isAllDay?: boolean, endDate?: Date): SchedulerCellClickEvent => {
            const startTime: Date = new Date(date);
            let endTime: Date = new Date(date);
            if (endDate) {
                startTime.setHours(0, 0, 0, 0);
                endTime = new Date(endDate);
                isAllDay = true;
            } else if (!timeScale.enable || isAllDay) {
                startTime.setHours(0, 0, 0, 0);
                endTime.setHours(0, 0, 0, 0);
                isAllDay = true;
            } else {
                endTime.setTime(startTime.getTime() + (timeScale.interval / timeScale.slotCount) * MS_PER_MINUTE);
            }
            const args: SchedulerCellClickEvent = {
                cancel: false,
                nativeEvent: e.nativeEvent,
                startTime,
                endTime,
                isAllDay: !!isAllDay,
                element: e.currentTarget
            };
            const groupIndex: number = getGroupIndexFromElement(e.currentTarget as HTMLElement);
            if (!isNullOrUndefined(groupIndex)) {
                args.groupIndex = groupIndex;
            }
            return args;
        }, [timeScale]);

    const handleCellClick: (e: MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
        startDate: Date, isAllDay?: boolean, endDate?: Date) => void = useCallback(
        (e: MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
         startDate: Date,
         isAllDay?: boolean,
         endDate?: Date
        ): void => {
            if ((e.target as HTMLElement)?.classList.contains(CSS_CLASSES.DATE_HEADER) ||
                (e.target as HTMLElement)?.classList.contains(CSS_CLASSES.HEADER_DATE) || readOnly) {
                return;
            }
            clearAndSelect(e.currentTarget as HTMLElement);
            if (onCellClick) {
                const args: SchedulerCellClickEvent = createEventArgs(e as MouseEvent<HTMLElement>, startDate, isAllDay, endDate);
                onCellClick(args);
                if (args.cancel) { return; }
            }
        }, [onCellClick, createEventArgs]);

    const handleCellDoubleClick: (e: MouseEvent<HTMLElement>, startDate: Date, isAllDay?: boolean, endDate?: Date) => void =
        useCallback((e: MouseEvent<HTMLElement>, startDate: Date, isAllDay?: boolean, endDate?: Date): void => {
            if (readOnly) { return; }
            clearAndSelect(e.currentTarget as HTMLElement);
            if (onCellDoubleClick) {
                quickPopupRef?.current?.hide();
                const args: SchedulerCellClickEvent = createEventArgs(e, startDate, isAllDay, endDate);
                onCellDoubleClick(args);
                if (args.cancel) { return; }
            }
        }, [onCellDoubleClick, createEventArgs]);

    const handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, startDate: Date, isAllDay?: boolean, endDate?: Date) => void =
        (e: React.KeyboardEvent<HTMLElement>, startDate: Date, isAllDay?: boolean, endDate?: Date): void => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCellClick(e, startDate, isAllDay, endDate);
            }
        };

    return {
        handleCellClick,
        handleCellDoubleClick,
        handleKeyDown
    };
};

export default useCellInteraction;
