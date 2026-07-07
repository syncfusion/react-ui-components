import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, parseDate } from '@syncfusion/react-base';
import { filterTimesByRange, isTimeWithinRange } from '../timepicker/utils';
import type { TimeListRef } from '../timepicker/timepicker-list';

export interface UseTimePanelOptions {
    step: number;
    minTime?: Date | null;
    maxTime?: Date | null;
    locale?: string | null;
    timeFormat?: string;
}

export interface UseTimePanelResult {
    displayedTimes: Date[];
    formatTime: (time: Date) => string;
    parseTime: (input: string, requireExact?: boolean) => Date | null;
    isValidTime: (time: Date | null) => boolean;
    timeListRef: React.RefObject<TimeListRef | null>;
    ensureSelectedVisible: () => void;
    forwardListKeyDown: (e: React.KeyboardEvent<HTMLElement>, isOpen: boolean) => void;
}

/**
 * Hook for managing time panel state, including time list generation, formatting, parsing, and keyboard navigation.
 *
 * @param {UseTimePanelOptions} options - Configuration options including step, min/max time, locale, and format.
 * @returns {UseTimePanelResult} Object containing displayed times and interaction utilities.
 */
export default function useTimePanel(options: UseTimePanelOptions): UseTimePanelResult {
    const { step, minTime, maxTime, locale, timeFormat } = options;

    const [timeList, setTimeList] = useState<Date[]>([]);
    const timeListRef: RefObject<TimeListRef | null> = useRef<TimeListRef | null>(null);

    useEffect(() => {
        const times: Date[] = [];
        const startTime: Date = new Date();
        startTime.setHours(0, 0, 0, 0);
        const endTime: Date = new Date();
        endTime.setHours(23, 59, 59, 999);
        const current: Date = new Date(startTime);
        while (current <= endTime) {
            times.push(new Date(current));
            current.setMinutes(current.getMinutes() + step);
        }
        setTimeList(times);
    }, [step]);

    const displayedTimes: Date[] = useMemo(() => {
        return filterTimesByRange(timeList, minTime, maxTime);
    }, [timeList, minTime, maxTime]);

    const formatTime: (time: Date) => string = useCallback((time: Date): string => {
        if (!time || isNaN(time.getTime())) {
            return '';
        }
        return formatDate(time, {
            format: timeFormat || 'h:mm a',
            type: 'time',
            locale: locale || 'en-US'
        });
    }, [locale, timeFormat]);

    const parseTime: (inputVal: string, requireExact?: boolean) => Date | null = useCallback(
        (inputVal: string, requireExact: boolean = false): Date | null => {
            if (!inputVal || !inputVal.trim()) {
                return null;
            }
            const normalizedInput: string = inputVal
                .replace(/(am|pm|Am|aM|pM|Pm)/g, (m: string) => m.toUpperCase())
                .trim();
            const tryFormats: string[] = [
                timeFormat,
                'h:mm a',
                'h:mm:ss a',
                'HH:mm',
                'HH:mm:ss'
            ].filter(Boolean) as string[];

            for (const fmt of tryFormats) {
                const parsed: Date = parseDate(normalizedInput, {
                    format: fmt,
                    type: 'time',
                    locale: locale || 'en-US'
                });
                if (parsed && !isNaN(parsed.getTime())) {
                    if (!requireExact) {
                        return parsed;
                    }
                    const back: string = formatDate(parsed, { format: fmt, type: 'time', locale: locale || 'en-US' }).trim();
                    if (back === normalizedInput) {
                        return parsed;
                    }
                }
            }
            if (!requireExact) {
                const today: Date = new Date();
                const dateStr: string = today.toLocaleDateString(locale || 'en-US');
                const parsedDate: Date = new Date(`${dateStr} ${normalizedInput}`);
                if (!isNaN(parsedDate.getTime())) {
                    return parsedDate;
                }
            }

            return null;
        },
        [locale, timeFormat]
    );

    const isValidTime: (time: Date | null) => boolean = useCallback((time: Date | null): boolean => {
        if (!time || isNaN(time.getTime())) {
            return false;
        }
        const safeMin: Date | null = minTime || null;
        const safeMax: Date | null = maxTime || null;
        return isTimeWithinRange(time, safeMin, safeMax);
    }, [minTime, maxTime]);

    const ensureSelectedVisible: () => void = useCallback((): void => {
        timeListRef.current?.ensureSelectedVisible?.();
    }, []);

    const forwardListKeyDown: (e: React.KeyboardEvent<HTMLElement>, isOpen: boolean)
    => void = useCallback((e: React.KeyboardEvent<HTMLElement>, isOpen: boolean): void => {
        if (!isOpen) {
            return;
        }
        if (timeListRef.current && typeof timeListRef.current.handleKeyDown === 'function') {
            timeListRef.current.handleKeyDown(e);
        }
    }, []);

    return {
        displayedTimes,
        formatTime,
        parseTime,
        isValidTime,
        timeListRef,
        ensureSelectedVisible,
        forwardListKeyDown
    };
}
