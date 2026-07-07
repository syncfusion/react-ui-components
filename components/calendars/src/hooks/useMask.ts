import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as React from 'react';
import { buildDisplayValue, composeDate, dateToSegmentValues, editableCount, editableDescriptor,
    getLocaleMeridiemPair,
    getMaxFirstDigit, getSegmentRange, isFocusableSegment, normalizeToAsciiDigits, parseFormat,
    parseMonthName, segmentIndexFromCaret, SegmentKind, tryParseFullDate, type SegmentDescriptor } from '../shared/maskUtils';
import { CalendarSystem, CalendarType, createCalendarSystem, GregorianCalendar } from '../calendar-core';
import { formatDate } from '@syncfusion/react-base';
import { MaskPlaceholder } from '../datepicker';

export interface UseMaskOptions {
    format: string;
    locale: string;
    value?: Date | null;
    onChange?: (e: Date | null) => void;
    min?: Date | null;
    max?: Date | null;
    inputRef?: RefObject<HTMLInputElement | null>;
    minDate?: Date;
    calendarType?: CalendarType;
    maskPlaceholder?: MaskPlaceholder;
}

export interface UseMaskResult {
    inputProps: {
        value: string;
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
        onClick: (e: React.MouseEvent<HTMLInputElement>) => void;
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        readOnly?: boolean;
    };
    hasPartialInput: boolean;
    reset: () => void;
}

export function useMask(options: UseMaskOptions): UseMaskResult {
    const {
        format,
        locale,
        value,
        onChange,
        inputRef,
        minDate,
        maskPlaceholder,
        calendarType = 'gregorian'
    } = options;

    const gregorian: GregorianCalendar = useMemo(() => new GregorianCalendar(), []);

    const calendarSystem: CalendarSystem = useMemo(
        () => createCalendarSystem(calendarType),
        [calendarType]
    );

    const defaultPlaceholders: MaskPlaceholder = useMemo(() => ({
        day: 'day',
        month: 'month',
        year: 'year',
        hour: 'hour',
        minute: 'minute',
        second: 'second',
        meridiem: 'am'
    }), []);

    const effectivePlaceholders: MaskPlaceholder = useMemo(() => ({
        ...defaultPlaceholders,
        ...(maskPlaceholder || {})
    }), [defaultPlaceholders, maskPlaceholder]);

    const descriptors: SegmentDescriptor[] = useMemo(
        () => parseFormat(format, effectivePlaceholders),
        [format, locale, effectivePlaceholders]
    );
    const numEditable: number = useMemo(
        () => editableCount(descriptors),
        [descriptors]
    );

    const reset: () => void = useCallback((): void => {
        const next: string[] = dateToSegmentValues(value ?? null, descriptors, locale, calendarSystem);
        setValues(next);
        digitBufferRef.current = '';
        setActiveIndex(0);
    }, [value, descriptors, locale, calendarSystem]);

    const [values, setValues] = useState<string[]>(
        () => dateToSegmentValues(value, descriptors, locale, calendarSystem)
    );
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const digitBufferRef: RefObject<string> = useRef<string>('');
    const [focusCount, setFocusCount] = useState<number>(0);

    useEffect(() => {
        setValues(dateToSegmentValues(value, descriptors, locale, calendarSystem));
    }, [value, descriptors, calendarSystem]);

    useEffect(() => {
        digitBufferRef.current = '';
    }, [format, locale]);

    const getFallbackDate: () => Date = useCallback((): Date => {
        if (minDate instanceof Date && !isNaN(minDate.getTime())) {
            return new Date(minDate);
        }
        return new Date();
    }, [minDate]);

    const clampDayValues: (editable: SegmentDescriptor[], currentValues: string[]) => string[] = useCallback(
        (editable: SegmentDescriptor[], currentValues: string[]): string[] => {
            const dayIdx: number = editable.findIndex((d: SegmentDescriptor) => d.kind === 'day');
            const monthIdx: number = editable.findIndex((d: SegmentDescriptor) => d.kind === 'month');
            const yearIdx: number = editable.findIndex((d: SegmentDescriptor) => d.kind === 'year');
            if (dayIdx < 0) { return currentValues; }
            const dayDesc: SegmentDescriptor | undefined = editable[dayIdx as number];
            const dayRaw: string | undefined = currentValues[dayIdx as number];

            if (!dayDesc || !dayRaw || dayRaw === dayDesc.placeholder) {
                return currentValues;
            }
            const currentDay: number = parseInt(normalizeToAsciiDigits(dayRaw), 10);
            if (isNaN(currentDay)) {
                return currentValues;
            }
            const fallbackDate: Date = getFallbackDate();
            let monthVal: number = fallbackDate.getMonth() + 1;
            if (monthIdx >= 0) {
                const mv: number = parseInt(normalizeToAsciiDigits(currentValues[monthIdx as number]), 10);
                if (!isNaN(mv)) { monthVal = mv; }
            }
            let yearVal: number = fallbackDate.getFullYear();
            if (yearIdx >= 0) {
                const yv: number = parseInt(normalizeToAsciiDigits(currentValues[yearIdx as number]), 10);
                if (!isNaN(yv)) { yearVal = yv; }
            }
            const maxDaysForMonth: number = calendarSystem.getDaysInMonth(yearVal, monthVal - 1);
            if (currentDay <= maxDaysForMonth) { return currentValues; }
            const nextValues: string[] = [...currentValues];
            nextValues[dayIdx as number] = String(maxDaysForMonth).padStart(dayDesc.digits || 2, '0');
            return nextValues;
        }, [getFallbackDate, gregorian]);

    useEffect(() => {
        const clampedValues: string[] = clampDayValues(editable, values);
        const hasChanged: boolean =
            clampedValues.length !== values.length ||
            clampedValues.some((val: string, index: number) => val !== values[index as number]);

        if (hasChanged) {
            setValues(clampedValues);
            commitChange(clampedValues);
        }
    }, [values, descriptors, clampDayValues, onChange]);

    useLayoutEffect(() => {
        const el: HTMLInputElement | null | undefined = inputRef?.current;
        if (!el || document.activeElement !== el) {
            return;
        }

        const [start, end] = getSegmentRange(descriptors, values, activeIndex, calendarSystem);
        el.setSelectionRange(start, end);
    }, [activeIndex, values, descriptors, inputRef, focusCount]);

    const getActiveDescriptor: () => SegmentDescriptor = useCallback(
        () => editableDescriptor(descriptors, activeIndex),
        [descriptors, activeIndex]
    );

    const commitChange: (newValues: string[]) => void = useCallback((newValues: string[]): void => {
        const date: Date | null = composeDate(descriptors, newValues, locale, false, calendarSystem);
        if (date === null) {
            return;
        }
        onChange?.(date);
    }, [descriptors, onChange]);

    const updateSegment: (index: number, val: string, baseValues?: string[]) => string[] = useCallback(
        (index: number, val: string, baseValues?: string[]): string[] => {
            const nextValues: string[] = baseValues ? [...baseValues] : [...values];
            nextValues[index as number] = val;
            setValues(nextValues);
            commitChange(nextValues);
            return nextValues;
        }, [values, commitChange]);

    const validateAndClampDay: (editable: SegmentDescriptor[], currentValues: string[], activeIndex?: number)
    => void = useCallback((editable: SegmentDescriptor[], currentValues: string[], activeIndex?: number) => {
        const findNearest: (kind: SegmentKind, pivot: number) => number = (kind: SegmentKind, pivot: number) => {
            let bestIdx: number = -1;
            let bestDist: number = Infinity;
            editable.forEach((d: SegmentDescriptor, i: number) => {
                if (d.kind === kind) {
                    const dist: number = Math.abs(i - pivot);
                    if (dist < bestDist) { bestDist = dist; bestIdx = i; }
                }
            });
            return bestIdx;
        };
        const pivot: number = activeIndex ?? 0;
        const dayIdx: number = findNearest('day', pivot);
        const monthIdx: number = findNearest('month', pivot);
        const yearIdx: number = findNearest('year', pivot);
        if (dayIdx < 0) {
            return;
        }
        const dayVal: string = currentValues[dayIdx as number];
        if (!dayVal || dayVal === editable[dayIdx as number].placeholder) {
            return;
        }
        const currentDay: number = parseInt(dayVal, 10);
        if (isNaN(currentDay)) {
            return;
        }
        const monthVal: number = monthIdx >= 0 ? parseInt(currentValues[monthIdx as number], 10) : 1;
        const yearVal: number = yearIdx >= 0 ? parseInt(currentValues[yearIdx as number], 10) : new Date().getFullYear();
        if (isNaN(monthVal) || isNaN(yearVal)) {
            return;
        }
        const maxDaysForMonth: number = calendarSystem.getDaysInMonth(yearVal, monthVal - 1);
        if (currentDay > maxDaysForMonth) {
            updateSegment(dayIdx, String(maxDaysForMonth).padStart(2, '0'), currentValues);
        }
    }, [gregorian, updateSegment]);

    const findNearestKind: (editable: SegmentDescriptor[], kind: SegmentKind, pivot: number) => number =
    (editable: SegmentDescriptor[], kind: SegmentKind, pivot: number) => {
        let bestIdx: number = -1;
        let bestDist: number = Infinity;

        editable.forEach((d: SegmentDescriptor, i: number) => {
            if (d.kind === kind) {
                const dist: number = Math.abs(i - pivot);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
        });
        return bestIdx;
    };

    const applyDelta: (activeIndex: number, delta: number) => void = useCallback((activeIndex: number, delta: number) => {
        const desc: SegmentDescriptor = editable[activeIndex as number];
        if (!desc) { return; }
        const today: Date = new Date();
        const refDate: Date = minDate ?? today;
        const currentSegmentVal: number = parseInt(normalizeToAsciiDigits(values[activeIndex as number]), 10);
        switch (desc.kind) {
        case 'year': {
            const nearestYearIdx: number = findNearestKind(editable, 'year', activeIndex);
            const raw: number = nearestYearIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[nearestYearIdx as number]), 10) : NaN;
            const current: number = isNaN(raw) ? calendarSystem.getYear(refDate) : raw;
            const next: number = current + delta;
            const tempDate: Date = calendarSystem.toDate(next, 0, 1);
            const yearStr: string = formatDate(tempDate, {
                format: desc.token,
                locale,
                type: 'date',
                calendar: calendarType
            });
            const yearValues: string[] = updateSegment(activeIndex, yearStr);
            validateAndClampDay(editable, yearValues, activeIndex);
            return;
        }
        case 'month': {
            let resolvedCurrent: number;
            if (desc.token === 'MMM' || desc.token === 'MMMM') {
                const parsedIdx: number = parseMonthName(values[activeIndex as number], locale);
                resolvedCurrent = parsedIdx >= 0 ? parsedIdx + 1 : calendarSystem.getMonth(refDate) + 1;
            } else {
                resolvedCurrent = isNaN(currentSegmentVal as number) ? calendarSystem.getMonth(refDate) + 1 : currentSegmentVal;
            }
            let next: number = resolvedCurrent + delta;
            let yearRollDelta: number = 0;
            if (next > 12) { next = 1; yearRollDelta = 1; }
            else if (next < 1) { next = 12; yearRollDelta = -1; }
            const nearestYearIdx: number = findNearestKind(editable, 'year', activeIndex);
            let monthStrVal: string;
            if (desc.token === 'MMM' || desc.token === 'MMMM') {
                const yearRaw: number = nearestYearIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[nearestYearIdx as number]), 10) : NaN;
                const yearForName: number = isNaN(yearRaw) ? calendarSystem.getYear(refDate) : yearRaw;
                const tempDate: Date = calendarSystem.toDate(yearForName, next - 1, 1);
                monthStrVal = formatDate(tempDate, { format: desc.token, locale, type: 'date', calendar: calendarType });
            } else {
                const yearRaw: number = nearestYearIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[nearestYearIdx as number]), 10) : NaN;
                const yearForNum: number = isNaN(yearRaw) ? calendarSystem.getYear(refDate) : yearRaw;
                const tempDate: Date = calendarSystem.toDate(yearForNum, next - 1, 1);
                monthStrVal = formatDate(tempDate, {
                    format: desc.token,
                    locale,
                    type: 'date',
                    calendar: calendarType
                });
            }
            const working: string[] = [...values];
            working[activeIndex as number] = monthStrVal;
            if (yearRollDelta !== 0 && nearestYearIdx >= 0) {
                const yearDesc: SegmentDescriptor = editable[nearestYearIdx as number];
                const currentYear: number = parseInt(normalizeToAsciiDigits(values[nearestYearIdx as number]), 10);
                if (!isNaN(currentYear)) {
                    const fullYear: number = yearDesc.token === 'yy'
                        ? 2000 + currentYear + yearRollDelta
                        : currentYear + yearRollDelta;
                    const yearTempDate: Date = calendarSystem.toDate(fullYear, 0, 1);
                    working[nearestYearIdx as number] = formatDate(yearTempDate, {
                        format: yearDesc.token,
                        locale,
                        type: 'date',
                        calendar: calendarType
                    });
                }
            }
            setValues(working);
            commitChange(working);
            validateAndClampDay(editable, working, activeIndex);
            return;
        }
        case 'day': {
            const nearestMonthIdx: number = findNearestKind(editable, 'month', activeIndex);
            const nearestYearIdx: number = findNearestKind(editable, 'year', activeIndex);
            const monthRaw: number = nearestMonthIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[nearestMonthIdx as number]), 10) : NaN;
            const yearRaw: number = nearestYearIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[nearestYearIdx as number]), 10) : NaN;
            const monthForCalc: number = isNaN(monthRaw) ? calendarSystem.getMonth(refDate) + 1 : monthRaw;
            const yearForCalc: number = isNaN(yearRaw) ? calendarSystem.getYear(refDate) : yearRaw;
            const maxDays: number = calendarSystem.getDaysInMonth(yearForCalc, monthForCalc - 1);
            const safeCurrentDay: number = isNaN(currentSegmentVal) ? calendarSystem.getDay(refDate) : currentSegmentVal;
            const next: number = safeCurrentDay + delta;
            let newMonth: number = monthForCalc;
            let newYear: number = yearForCalc;
            let newDay: number = next;
            const canRollMonth: boolean = nearestMonthIdx >= 0 && !isNaN(monthRaw);
            if (next > maxDays) {
                if (canRollMonth) { newMonth++; newDay = 1; if (newMonth > 12) { newMonth = 1; newYear++; } }
                else { newDay = 1; }
            } else if (next < 1) {
                if (canRollMonth) {
                    newMonth--;
                    if (newMonth < 1) { newMonth = 12; newYear--; }
                    newDay = calendarSystem.getDaysInMonth(newYear, newMonth - 1);
                } else { newDay = 31; }
            }
            const working: string[] = [...values];
            const tempDayDate: Date = calendarSystem.toDate(newYear, newMonth - 1, newDay);
            working[activeIndex as number] = formatDate(tempDayDate, {
                format: desc.token,
                locale,
                type: 'date',
                calendar: calendarType
            });
            if (canRollMonth && newMonth !== monthForCalc) {
                const monthDesc: SegmentDescriptor = editable[nearestMonthIdx as number];
                const tempDate: Date = calendarSystem.toDate(newYear, newMonth - 1, 1);
                working[nearestMonthIdx as number] = formatDate(tempDate, {
                    format: monthDesc.token,
                    locale,
                    type: 'date',
                    calendar: calendarType
                });
            }
            if (newYear !== yearForCalc && nearestYearIdx >= 0 && !isNaN(yearRaw)) {
                const yearDesc: SegmentDescriptor = editable[nearestYearIdx as number];
                const yearTempDate: Date = calendarSystem.toDate(newYear, 0, 1);
                working[nearestYearIdx as number] = formatDate(yearTempDate, {
                    format: yearDesc.token,
                    locale,
                    type: 'date',
                    calendar: calendarType
                });
            }
            setValues(working);
            commitChange(working);
            return;
        }
        case 'hour':
        case 'minute':
        case 'second':
        case 'meridiem': {
            const nearestDayIdx: number = findNearestKind(editable, 'day', activeIndex);
            const nearestMonthIdx: number = findNearestKind(editable, 'month', activeIndex);
            const nearestYearIdx: number = findNearestKind(editable, 'year', activeIndex);
            const hourIdx: number = findNearestKind(editable, 'hour', activeIndex);
            const minuteIdx: number = findNearestKind(editable, 'minute', activeIndex);
            const secondIdx: number = findNearestKind(editable, 'second', activeIndex);
            const meridiemIdx: number = findNearestKind(editable, 'meridiem', activeIndex);
            const dayRaw: number = nearestDayIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[nearestDayIdx as number]), 10) : NaN;
            const monthRaw: number = nearestMonthIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[nearestMonthIdx as number]), 10) : NaN;
            const yearRaw: number = nearestYearIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[nearestYearIdx as number]), 10) : NaN;
            const hourRaw: number = hourIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[hourIdx as number]), 10) : NaN;
            const minuteRaw: number = minuteIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[minuteIdx as number]), 10) : NaN;
            const secondRaw: number = secondIdx >= 0 ? parseInt(normalizeToAsciiDigits(values[secondIdx as number]), 10) : NaN;
            const meridiemVal: string | null = meridiemIdx >= 0 ? values[meridiemIdx as number] : null;
            const yearForBase: number = isNaN(yearRaw) ? calendarSystem.getYear(refDate) : yearRaw;
            const monthForBase: number = isNaN(monthRaw) ? calendarSystem.getMonth(refDate) : monthRaw - 1;
            const dayForBase: number = isNaN(dayRaw) ? calendarSystem.getDay(refDate) : dayRaw;
            const baseDate: Date = calendarSystem.toDate(yearForBase, monthForBase, dayForBase);
            let resolvedHour: number = isNaN(hourRaw) ? 0 : hourRaw;
            if (meridiemVal && meridiemIdx >= 0) {
                const merDesc: SegmentDescriptor = editable[meridiemIdx as number];
                const { pm: localePM } = getLocaleMeridiemPair(merDesc.token, locale);
                const isPM: boolean = meridiemVal === localePM;
                if (isPM && resolvedHour < 12) {
                    resolvedHour += 12;
                } else if (!isPM && resolvedHour === 12) {
                    resolvedHour = 0;
                }
            }
            baseDate.setHours(resolvedHour, isNaN(minuteRaw) ? 0 : minuteRaw, isNaN(secondRaw) ? 0 : secondRaw);
            const newDate: Date = new Date(baseDate);
            if (desc.kind === 'second') {
                newDate.setSeconds(newDate.getSeconds() + delta);
            } else if (desc.kind === 'minute') {
                newDate.setMinutes(newDate.getMinutes() + delta);
            } else if (desc.kind === 'hour') {
                newDate.setHours(newDate.getHours() + delta);
            } else if (desc.kind === 'meridiem') {
                const h: number = newDate.getHours();
                newDate.setHours(h >= 12 ? h - 12 : h + 12);
            }
            const working: string[] = [...values];
            const writeIfPresent: (idx: number, val: () => string) => void = (idx: number, val: () => string) => {
                if (idx >= 0) {
                    working[idx as number] = val();
                }
            };
            writeIfPresent(hourIdx, () => {
                const hourDesc: SegmentDescriptor | undefined = editable[hourIdx as number];
                return formatDate(newDate, {
                    format: hourDesc?.token || 'HH',
                    locale,
                    type: hourDesc?.token === 'h' || hourDesc?.token === 'hh' ? 'time' : 'date',
                    calendar: calendarType
                });
            });
            writeIfPresent(minuteIdx, () => {
                const minuteDesc: SegmentDescriptor | undefined = editable[minuteIdx as number];
                return formatDate(newDate, {
                    format: minuteDesc?.token || 'mm',
                    locale,
                    type: 'date',
                    calendar: calendarType
                });
            });
            writeIfPresent(secondIdx, () => {
                const secondDesc: SegmentDescriptor | undefined = editable[secondIdx as number];
                return formatDate(newDate, {
                    format: secondDesc?.token || 'ss',
                    locale,
                    type: 'date',
                    calendar: calendarType
                });
            });
            writeIfPresent(meridiemIdx, () => {
                const merDesc: SegmentDescriptor | undefined = editable[meridiemIdx as number];
                return formatDate(newDate, {
                    format: merDesc?.token || 'a',
                    locale,
                    type: 'time'
                });
            });
            const newDay: number = calendarSystem.getDay(newDate);
            const newMonth: number = calendarSystem.getMonth(newDate);
            const newYear: number = calendarSystem.getYear(newDate);
            if (nearestDayIdx >= 0 && newDay !== dayForBase) {
                const dayDesc: SegmentDescriptor | undefined = editable[nearestDayIdx as number];
                const dayTempDate: Date = calendarSystem.toDate(newYear, newMonth, newDay);
                working[nearestDayIdx as number] = formatDate(dayTempDate, {
                    format: dayDesc?.token || 'dd',
                    locale,
                    type: 'date',
                    calendar: calendarType
                });
            }
            if (nearestMonthIdx >= 0 && newMonth !== monthForBase) {
                const monthDesc: SegmentDescriptor | undefined = editable[nearestMonthIdx as number];
                const monthTempDate: Date = calendarSystem.toDate(newYear, newMonth, 1);
                working[nearestMonthIdx as number] = formatDate(monthTempDate, {
                    format: monthDesc?.token || 'MM',
                    locale,
                    type: 'date',
                    calendar: calendarType
                });
            }
            if (nearestYearIdx >= 0 && newYear !== yearForBase) {
                const yearDesc: SegmentDescriptor | undefined = editable[nearestYearIdx as number];
                const yearTempDate: Date = calendarSystem.toDate(newYear, 0, 1);
                working[nearestYearIdx as number] = formatDate(yearTempDate, {
                    format: yearDesc?.token || 'yyyy',
                    locale,
                    type: 'date',
                    calendar: calendarType
                });
            }
            setValues(working);
            commitChange(working);
            return;
        }
        default: break;
        }
    }, [values, minDate, locale, gregorian, updateSegment, validateAndClampDay, commitChange, calendarSystem, calendarType]);

    const monthNamesByToken: Record<string, string[]> = useMemo(() => {
        const months: { MMM: string[]; MMMM: string[] } = { MMM: [], MMMM: [] };
        for (let i: number = 0; i < 12; i++) {
            months.MMM.push(calendarSystem.getMonthName(i, 'short', locale));
            months.MMMM.push(calendarSystem.getMonthName(i, 'long', locale));
        }
        return months;
    }, [calendarSystem, locale]);

    const onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
        const desc: SegmentDescriptor = getActiveDescriptor();
        if (!desc) {
            return;
        }
        switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            setActiveIndex((i: number) => Math.max(0, i - 1));
            digitBufferRef.current = '';
            break;
        case 'ArrowRight':
            e.preventDefault();
            setActiveIndex((i: number) => Math.min(numEditable - 1, i + 1));
            digitBufferRef.current = '';
            break;
        case 'Tab':
            if (!e.shiftKey) {
                if (activeIndex >= numEditable - 1) {
                    digitBufferRef.current = '';
                    return;
                }
                e.preventDefault();
                setActiveIndex((i: number) => i + 1);
            } else {
                if (activeIndex <= 0) {
                    digitBufferRef.current = '';
                    return;
                }
                e.preventDefault();
                setActiveIndex((i: number) => i - 1);
            }
            digitBufferRef.current = '';
            break;
        case 'ArrowUp':
            e.preventDefault();
            applyDelta(activeIndex, 1);
            digitBufferRef.current = '';
            break;
        case 'ArrowDown':
            e.preventDefault();
            applyDelta(activeIndex, -1);
            digitBufferRef.current = '';
            break;
        case 'Backspace':
        case 'Delete':
            e.preventDefault();
            updateSegment(activeIndex, desc.placeholder);
            setActiveIndex((i: number) => Math.max(0, i - 1));
            digitBufferRef.current = '';
            break;
        case 'Escape':
            e.preventDefault();
            inputRef?.current?.blur();
            digitBufferRef.current = '';
            break;
        default:
            if (handleSegmentInput(e.key, desc)) {
                e.preventDefault();
            }
            break;
        }
    }, [activeIndex, numEditable, descriptors, inputRef, getActiveDescriptor, updateSegment, applyDelta, clampDayValues, commitChange,
        values, calendarSystem, calendarType, locale]);

    const onFocus: (e: React.FocusEvent<HTMLInputElement>) => void = useCallback((e: React.FocusEvent<HTMLInputElement>): void => {
        setActiveIndex(0);
        setFocusCount((c: number) => c + 1);
        digitBufferRef.current = '';
        const [start, end] = getSegmentRange(descriptors, values, 0, calendarSystem);
        e.currentTarget.setSelectionRange(start, end);
    }, [descriptors, values]);

    const onClick: (e: React.MouseEvent<HTMLInputElement>) => void = useCallback((e: React.MouseEvent<HTMLInputElement>): void => {
        const target: HTMLInputElement = e.target as HTMLInputElement;
        const caret: number = target.selectionStart !== null ? target.selectionStart : 0;
        const idx: number = segmentIndexFromCaret(descriptors, values, caret, calendarSystem);
        setActiveIndex(idx);
        digitBufferRef.current = '';
    }, [descriptors, values]);

    const onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void = useCallback((e: React.ClipboardEvent<HTMLInputElement>): void => {
        e.preventDefault();
        const text: string = e.clipboardData.getData('text');
        const parsed: Date | null = tryParseFullDate(text, descriptors, calendarSystem);
        if (parsed) {
            const newValues: string[] = dateToSegmentValues(parsed, descriptors, locale, calendarSystem);
            setValues(newValues);
            commitChange(newValues);
        }
    }, [descriptors, commitChange]);

    const displayValue: string = useMemo(
        () => buildDisplayValue(descriptors, values, locale, calendarSystem),
        [descriptors, values, locale, effectivePlaceholders]
    );

    const editable: SegmentDescriptor[] = descriptors.filter(
        (d: SegmentDescriptor) => isFocusableSegment(d.kind)
    );

    const hasPartialInput: boolean = useMemo(() => {
        return editable.some(
            (desc: SegmentDescriptor, idx: number) => values[idx as number] !== desc.placeholder
        );
    }, [descriptors, values]);

    const handleSegmentInput: (key: string, desc: SegmentDescriptor) => boolean =
    useCallback((key: string, desc: SegmentDescriptor): boolean => {
        if (/^[aApP]$/.test(key) && desc.kind === 'meridiem') {
            const isAM: boolean = key.toLowerCase() === 'a';
            const merRefDate: Date = isAM ? new Date(2000, 0, 1, 9, 0, 0) : new Date(2000, 0, 1, 13, 0, 0);
            const localeMeridiem: string = formatDate(merRefDate, { format: desc.token, locale, type: 'time' });
            updateSegment(activeIndex, localeMeridiem);
            digitBufferRef.current = '';
            return true;
        }
        if (/^\d$/.test(key) && desc.kind !== 'meridiem' && desc.kind !== 'literal' &&
            !(desc.kind === 'month' && (desc.token === 'MMM' || desc.token === 'MMMM'))) {
            const digitBuffer: string = (digitBufferRef.current + key).slice(-desc.digits);
            digitBufferRef.current = digitBuffer;
            const parsedNumber: number = parseInt(digitBuffer, 10);
            if (digitBuffer.length < desc.digits) {
                const partial: string = digitBuffer.padStart(desc.digits, '0');
                const nextValues: string[] = updateSegment(activeIndex, partial);
                const clampedValues: string[] = clampDayValues(editable, nextValues);
                if (clampedValues.some((val: string, index: number) => val !== nextValues[index as number])) {
                    setValues(clampedValues);
                    commitChange(clampedValues);
                }
                const maxFirst: number = getMaxFirstDigit(desc);
                if (digitBuffer.length === 1 && parsedNumber > maxFirst) {
                    const clamped: number = Math.min(Math.max(parsedNumber, desc.min), desc.max);
                    const strVal: string = String(clamped).padStart(desc.digits, '0');
                    const nextValues2: string[] = updateSegment(activeIndex, strVal);
                    const clampedValues2: string[] = clampDayValues(editable, nextValues2);
                    if (clampedValues2.some((val: string, index: number) => val !== nextValues2[index as number])) {
                        setValues(clampedValues2);
                        commitChange(clampedValues2);
                    }
                    digitBufferRef.current = '';
                    setActiveIndex((i: number) => Math.min(numEditable - 1, i + 1));
                }
            } else {
                const clamped: number = Math.min(Math.max(parsedNumber, desc.min), desc.max);
                const strVal: string = String(clamped).padStart(desc.digits, '0');
                const nextValues: string[] = updateSegment(activeIndex, strVal);
                const clampedValues: string[] = clampDayValues(editable, nextValues);
                if (clampedValues.some((val: string, index: number) => val !== nextValues[index as number])) {
                    setValues(clampedValues);
                    commitChange(clampedValues);
                }
                digitBufferRef.current = '';
                setActiveIndex((i: number) => Math.min(numEditable - 1, i + 1));
            }
            return true;
        }
        if (desc.kind === 'month' && (desc.token === 'MMM' || desc.token === 'MMMM') && /^[a-zA-Z]$/.test(key)) {
            const newChar: string = key.toLowerCase();
            const monthNames: string[] = monthNamesByToken[desc.token] || [];
            const findMatches: (prefix: string) => number[] = (prefix: string) => monthNames
                .map((monthName: string, monthIndex: number): { name: string; index: number } => ({
                    name: monthName.toLowerCase(), index: monthIndex
                })).filter(({ name }: { name: string; index: number }): boolean => name.startsWith(prefix))
                .map(({ index }: { name: string; index: number }): number => index);
            const extended: string = digitBufferRef.current + newChar;
            let matchingMonthIndexes: number[] = findMatches(extended);
            const isExtended: boolean = matchingMonthIndexes.length > 0;
            if (!isExtended) {
                matchingMonthIndexes = findMatches(newChar);
            }
            if (!matchingMonthIndexes.length) {
                return false;
            }
            const isSameChar: boolean = !isExtended && digitBufferRef.current === newChar;
            digitBufferRef.current = isExtended ? extended : newChar;
            const selectedMonthIndex: number = !isSameChar || matchingMonthIndexes.length === 1 ? matchingMonthIndexes[0]
                : matchingMonthIndexes[(matchingMonthIndexes.findIndex((monthIndex: number): boolean =>
                    monthNames[monthIndex as number].toLowerCase() ===
                    values[activeIndex as number].toLowerCase()) + 1) % matchingMonthIndexes.length];
            setValues((currentValues: string[]): string[] => {
                const updatedValues: string[] = [...currentValues];
                updatedValues[activeIndex as number] = monthNames[selectedMonthIndex as number];
                return updatedValues;
            });
            return true;
        }
        if (desc.kind === 'meridiem') {
            return true;
        }
        return false;
    }, [activeIndex, editable, values, monthNamesByToken, numEditable, updateSegment, clampDayValues, commitChange, locale]);

    const handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void =
    useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        const oldValue: string = displayValue;
        const newValue: string = e.target.value;
        const restoreSelection: () => void = () => setFocusCount((count: number) => count + 1);
        if (newValue === oldValue) {
            return restoreSelection();
        }
        let diffStart: number = 0;
        while (
            diffStart < oldValue.length &&
            diffStart < newValue.length &&
            oldValue[diffStart as number] === newValue[diffStart as number]
        ) {
            diffStart++;
        }
        const isDeletion: boolean = newValue.length < oldValue.length && diffStart >= newValue.length;
        const key: string = isDeletion ? 'Backspace' : newValue[diffStart as number] ?? '';
        if (!key) {
            return restoreSelection();
        }
        const desc: SegmentDescriptor = getActiveDescriptor();
        handleSegmentInput(key, desc);
        restoreSelection();
    }, [displayValue, getActiveDescriptor, handleSegmentInput]);

    return {
        inputProps: {
            value: displayValue,
            onKeyDown,
            onFocus,
            onClick,
            onPaste,
            onChange: handleInputChange
        },
        hasPartialInput,
        reset
    };
}

export default useMask;
