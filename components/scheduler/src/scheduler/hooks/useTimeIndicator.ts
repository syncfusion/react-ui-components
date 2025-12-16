import { useState, useRef, useCallback, useEffect, RefObject } from 'react';
import { DateService, MS_PER_MINUTE, MINUTES_PER_HOUR, HOURS_PER_DAY } from '../services/DateService';

// Define types for the hook
type TimeIndicatorColumn = {
    key: number;
    isCurrentDay: boolean;
    leftPosition: number;
    columnWidth: number;
};

type MultiDayViewInfo = {
    isMultiDayView: boolean;
    hasValidRenderDates: boolean;
    columns: TimeIndicatorColumn[];
    isCurrentDayRendered?: boolean;
};

export const useTimeIndicator: ({
    showTimeIndicator,
    startHour,
    endHour,
    renderDates,
    onPositionUpdate
}: {
    showTimeIndicator: boolean;
    startHour: string;
    endHour: string;
    renderDates: Date[];
    onPositionUpdate?: (position: number, isWithinBounds: boolean) => void;
}) => {
    position: number;
    currentTime: Date;
    isVisible: boolean;
    isWithinBounds: boolean;
    multiDayViewInfo: MultiDayViewInfo;
    updatePosition: () => void;
} = ({
    showTimeIndicator,
    startHour,
    endHour,
    renderDates,
    onPositionUpdate
}: {
    showTimeIndicator: boolean;
    startHour: string;
    endHour: string;
    renderDates: Date[];
    onPositionUpdate?: (position: number, isWithinBounds: boolean) => void;
}) => {
    const [position, setPosition] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [isWithinBounds, setIsWithinBounds] = useState<boolean>(false);
    const intervalRef: RefObject<NodeJS.Timeout | null> = useRef<NodeJS.Timeout | null>(null);

    const isMultiDayView: boolean = renderDates.length > 1;
    const hasValidRenderDates: boolean = Boolean(renderDates && renderDates.length > 0);

    /**
     * Checks if the current time is within the scheduler bounds.
     */
    const isTimeWithinSchedulerBounds: () => boolean = useCallback((): boolean => {
        const now: Date = new Date();
        const startHourDate: Date = DateService.getStartEndHours(startHour);
        const endHourDate: Date = DateService.getStartEndHours(endHour);
        const currentTotalMinutes: number = now.getHours() * MINUTES_PER_HOUR + now.getMinutes();
        const startTotalMinutes: number = startHourDate.getHours() * MINUTES_PER_HOUR + startHourDate.getMinutes();
        const endTotalMinutes: number = endHourDate.getHours() === 0 && endHourDate.getMinutes() === 0 ?
            HOURS_PER_DAY * MINUTES_PER_HOUR : endHourDate.getHours() * MINUTES_PER_HOUR + endHourDate.getMinutes();

        return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
    }, [startHour, endHour]);

    /**
     * Calculates the position of the time indicator based on current time and scheduler hours.
     */
    const calculatePosition: () => number = useCallback((): number => {
        const now: Date = new Date();
        const startHourDate: Date = DateService.getStartEndHours(startHour);
        const endHourDate: Date = DateService.getStartEndHours(endHour);

        const diffInMinutes: number = ((now.getHours() - startHourDate.getHours()) * MINUTES_PER_HOUR) +
            (now.getMinutes() - startHourDate.getMinutes());
        const startTotalMinutes: number = startHourDate.getHours() * MINUTES_PER_HOUR + startHourDate.getMinutes();
        const endTotalMinutes: number = endHourDate.getHours() === 0 && endHourDate.getMinutes() === 0 ?
            HOURS_PER_DAY * MINUTES_PER_HOUR : endHourDate.getHours() * MINUTES_PER_HOUR + endHourDate.getMinutes();
        const totalSchedulerMinutes: number = endTotalMinutes - startTotalMinutes;
        const positionPercentage: number = (diffInMinutes / totalSchedulerMinutes) * 100;
        return Math.max(0, Math.min(100, positionPercentage));
    }, [startHour, endHour]);

    /**
     * Updates the position of the time indicator.
     */
    const updatePosition: () => void = useCallback((): void => {
        const now: Date = new Date();
        const withinBounds: boolean = isTimeWithinSchedulerBounds();

        if (Math.abs(now.getTime() - currentTime.getTime()) >= MS_PER_MINUTE) {
            setCurrentTime(now);
        }

        if (isWithinBounds !== withinBounds) {
            setIsWithinBounds(withinBounds);
        }

        if (isVisible !== (withinBounds && showTimeIndicator)) {
            setIsVisible(withinBounds && showTimeIndicator);
        }

        if (!withinBounds) {
            return;
        }

        const newPosition: number = calculatePosition();

        if (Math.abs(newPosition - position) > 0.1) {
            setPosition(newPosition);
        }

    }, [calculatePosition, currentTime, isVisible, isWithinBounds, position, showTimeIndicator, isTimeWithinSchedulerBounds]);

    // Set up the interval to update the position
    useEffect(() => {
        if (showTimeIndicator) {
            updatePosition();

            intervalRef.current = setInterval(() => {
                updatePosition();
            }, MS_PER_MINUTE);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }
        return undefined;
    }, [showTimeIndicator, updatePosition]);

    useEffect(() => {
        if (onPositionUpdate) {
            onPositionUpdate(position, isVisible && isWithinBounds);
        }
    }, [position, isVisible, isWithinBounds, onPositionUpdate]);

    /**
     * Gets date information about rendered dates
     */
    const getMultiDayViewInfo: () => MultiDayViewInfo = useCallback((): MultiDayViewInfo => {
        const now: Date = new Date();

        // Check if current day is included in render dates
        const isCurrentDayRendered: boolean = renderDates?.length > 0 &&
            renderDates.some((date: Date) => DateService.isSameDay(date, now));

        if (!hasValidRenderDates || !isCurrentDayRendered) {
            return {
                isMultiDayView,
                hasValidRenderDates,
                columns: [],
                isCurrentDayRendered: false
            };
        }

        if (!isMultiDayView) {
            const singleDayIsCurrentDay: boolean = renderDates.length === 1 &&
                DateService.isSameDay(renderDates[0], now);

            return {
                isMultiDayView,
                hasValidRenderDates,
                columns: [],
                isCurrentDayRendered: singleDayIsCurrentDay
            };
        }

        const columns: TimeIndicatorColumn[] = renderDates.map((date: Date, index: number) => {
            const isCurrentDay: boolean = DateService.isSameDay(date, now);
            const isPreviousDay: boolean = date < now && !DateService.isSameDay(date, now);
            const isFutureDay: boolean = date > now && !DateService.isSameDay(date, now);

            if (isFutureDay || (!isCurrentDay && !isPreviousDay)) {
                return null;
            }

            const columnWidthPercentage: number = 100 / renderDates.length;
            const leftPosition: number = index * columnWidthPercentage;

            return {
                key: date.getTime(),
                isCurrentDay,
                leftPosition,
                columnWidth: columnWidthPercentage
            };
        }).filter(Boolean);

        return {
            isMultiDayView,
            hasValidRenderDates,
            columns,
            isCurrentDayRendered
        };
    }, [isMultiDayView, hasValidRenderDates, renderDates]);

    return {
        position,
        currentTime,
        isVisible,
        isWithinBounds,
        multiDayViewInfo: getMultiDayViewInfo(),
        updatePosition
    };
};

export default useTimeIndicator;
