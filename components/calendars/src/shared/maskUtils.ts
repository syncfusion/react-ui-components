import { formatDate } from '@syncfusion/react-base';
import { CalendarSystem } from '../calendar-core';

export type SegmentKind = | 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second' | 'meridiem' | 'literal' | 'dayOfWeek';

export interface SegmentDescriptor {
    kind: SegmentKind;
    token: string;
    min: number;
    max: number;
    digits: number;
    placeholder: string;
}

export type SegmentPlaceholder = Partial<Record<SegmentKind, string>>;

const FORMAT_TOKENS: string[] = [
    'yyyy', 'yy', 'y',
    'MMMM', 'MMM', 'MM', 'M',
    'cccc', 'ccc', 'dddd', 'ddd', 'dd', 'd',
    'EEEE', 'EEE', 'EE', 'E',
    'HH', 'H',
    'hh', 'h',
    'mm',
    'ss',
    'tt', 'am', 'AM', 'pm', 'PM', 'a', 'A'
];

export const getMaxFirstDigit: (desc: SegmentDescriptor) => number = (desc: SegmentDescriptor) => {
    return Math.floor(desc.max / 10);
};

export const parseFormat: (
    format: string,
    placeholders?: Partial<Record<SegmentKind, string>>
) => SegmentDescriptor[] = (format: string, placeholders?: Partial<Record<SegmentKind, string>>) => {
    const segments: SegmentDescriptor[] = [];
    let i: number = 0;
    while (i < format.length) {
        if (format[i as number] === '\'') {
            let j: number = i + 1;
            while (j < format.length && format[j as number] !== '\'') {
                j++;
            }
            const quotedText: string = format.substring(i + 1, j);
            if (quotedText.length > 0) {
                segments.push({
                    kind: 'literal',
                    token: quotedText,
                    min: 0,
                    max: 0,
                    digits: 0,
                    placeholder: quotedText
                });
            }
            i = j + 1;
            continue;
        }

        let matched: boolean = false;
        for (const token of FORMAT_TOKENS) {
            if (format.startsWith(token, i)) {
                segments.push(buildDescriptor(token, placeholders));
                i += token.length;
                matched = true;
                break;
            }
        }
        if (!matched) {
            const char: string = format[i as number];
            const last: SegmentDescriptor | undefined = segments[segments.length - 1];
            if (last && last.kind === 'literal') {
                last.token += char;
                last.placeholder += char;
            } else {
                segments.push({
                    kind: 'literal',
                    token: char,
                    min: 0,
                    max: 0,
                    digits: 0,
                    placeholder: char
                });
            }
            i += 1;
        }
    }
    return segments;
};

const buildDescriptor: (
    token: string,
    placeholders?: Partial<Record<SegmentKind, string>>
) => SegmentDescriptor = (token: string, placeholders?: Partial<Record<SegmentKind, string>>) => {
    const getPlaceholder: (kind: SegmentKind, fallback: string) => string =
        (kind: SegmentKind, fallback: string) => placeholders?.[kind as SegmentKind] ?? fallback;
    switch (token) {
    case 'yyyy':
        return { kind: 'year', token, min: 1, max: 9999, digits: 4, placeholder: getPlaceholder('year', 'yyyy') };
    case 'yy':
        return { kind: 'year', token, min: 0, max: 99, digits: 2, placeholder: getPlaceholder('year', 'yy') };
    case 'y':
        return { kind: 'year', token, min: 1, max: 9999, digits: 4, placeholder: getPlaceholder('year', 'y') };
    case 'MMMM':
        return { kind: 'month', token, min: 1, max: 12, digits: 4, placeholder: getPlaceholder('month', 'month') };
    case 'MMM':
        return { kind: 'month', token, min: 1, max: 12, digits: 3, placeholder: getPlaceholder('month', 'month') };
    case 'MM':
    case 'M':
        return { kind: 'month', token, min: 1, max: 12, digits: 2, placeholder: getPlaceholder('month', 'mm') };
    case 'dd':
    case 'd':
        return { kind: 'day', token, min: 1, max: 31, digits: 2, placeholder: getPlaceholder('day', 'dd') };
    case 'cccc':
    case 'ccc':
    case 'dddd':
    case 'ddd':
    case 'EEEE':
    case 'EEE':
    case 'EE':
    case 'E':
        return { kind: 'dayOfWeek', token, min: 0, max: 0, digits: 0, placeholder: getPlaceholder('dayOfWeek', 'day of the week') };
    case 'HH':
    case 'H':
        return { kind: 'hour', token, min: 0, max: 23, digits: 2, placeholder: getPlaceholder('hour', 'HH') };
    case 'hh':
    case 'h':
        return { kind: 'hour', token, min: 1, max: 12, digits: 2, placeholder: getPlaceholder('hour', 'hh') };
    case 'mm':
        return { kind: 'minute', token, min: 0, max: 59, digits: 2, placeholder: getPlaceholder('minute', 'mm') };
    case 'ss':
        return { kind: 'second', token, min: 0, max: 59, digits: 2, placeholder: getPlaceholder('second', 'ss') };
    case 'tt':
    case 'AM':
    case 'PM':
    case 'a':
    case 'A':
        return { kind: 'meridiem', token, min: 0, max: 1, digits: 0, placeholder: getPlaceholder('meridiem', 'AM') };
    default:
        return { kind: 'literal', token, min: 0, max: 0, digits: 0, placeholder: token };
    }
};

export const buildDisplayValue: (
    descriptors: SegmentDescriptor[],
    values: string[],
    locale: string,
    calendarSystem: CalendarSystem
) => string = (
    descriptors: SegmentDescriptor[],
    values: string[],
    locale: string = 'en-US',
    calendarSystem: CalendarSystem
) => {
    const composedDate: Date | null = composeDate(descriptors, values, locale, false, calendarSystem);
    let result: string = '';
    let editIdx: number = 0;
    for (const desc of descriptors) {
        if (desc.kind === 'literal') {
            result += desc.token;
        } else if (desc.kind === 'dayOfWeek') {
            if (composedDate && !isNaN(composedDate.getTime())) {
                const isLong: boolean =
                    desc.token === 'cccc' ||
                    desc.token === 'dddd' ||
                    desc.token === 'EEEE';
                result += formatDate(composedDate, {
                    format: isLong ? 'EEEE' : 'EEE',
                    locale,
                    type: 'date'
                });
            } else {
                result += desc.placeholder;
            }
        } else {
            const val: string = values[editIdx as number];
            result += (val && val !== desc.placeholder) ? val : desc.placeholder;
            editIdx++;
        }
    }
    return result;
};

export const resolveSegmentPosition: (descriptors: SegmentDescriptor[], values: string[],
    options: | { kind: 'range'; segmentIndex: number } | { kind: 'index'; caret: number }, calendarSystem: CalendarSystem
) => [number, number] | number = (
    descriptors: SegmentDescriptor[],
    values: string[],
    options:
    | { kind: 'range'; segmentIndex: number }
    | { kind: 'index'; caret: number },
    calendarSystem: CalendarSystem
) => {
    let cursorPosition: number = 0;
    let focusIndex: number = 0;
    let lastFocusIndex: number = 0;
    const composedDate: Date | null = composeDate(descriptors, values, 'en-US', false, calendarSystem);
    let editIdx: number = 0;
    for (const descriptor of descriptors) {
        if (descriptor.kind === 'literal') {
            cursorPosition += descriptor.token.length;
            continue;
        }
        let segmentText: string;
        if (descriptor.kind === 'dayOfWeek') {
            if (composedDate) {
                segmentText = formatDate(composedDate, {
                    format: (descriptor.token === 'cccc' || descriptor.token === 'dddd') ? 'EEEE' : 'EEE',
                    type: 'date'
                });
            } else {
                segmentText = descriptor.placeholder;
            }
            cursorPosition += segmentText.length;
            continue;
        }

        segmentText = values[editIdx as number] ?? descriptor.placeholder;
        const start: number = cursorPosition;
        const end: number = cursorPosition + segmentText.length;
        if (options.kind === 'range') {
            if (focusIndex === options.segmentIndex) {
                return [start, end];
            }
        } else {
            lastFocusIndex = focusIndex;
            if (options.caret <= end) {
                return focusIndex;
            }
        }

        cursorPosition = end;
        focusIndex++;
        editIdx++;
    }
    return options.kind === 'range' ? [cursorPosition, cursorPosition] : lastFocusIndex;
};

export const getSegmentRange: (
    descriptors: SegmentDescriptor[],
    values: string[],
    segmentIndex: number,
    calendarSystem: CalendarSystem
) => [number, number] = (
    descriptors: SegmentDescriptor[],
    values: string[],
    segmentIndex: number,
    calendarSystem: CalendarSystem
) =>
    resolveSegmentPosition(descriptors, values, { kind: 'range', segmentIndex }, calendarSystem) as [number, number];

export const segmentIndexFromCaret: (
    descriptors: SegmentDescriptor[],
    values: string[],
    caret: number,
    calendarSystem: CalendarSystem
) => number = (
    descriptors: SegmentDescriptor[],
    values: string[],
    caret: number,
    calendarSystem: CalendarSystem
) =>
    resolveSegmentPosition(descriptors, values, { kind: 'index', caret }, calendarSystem) as number;


export const isFocusableSegment: (kind: SegmentKind) => boolean =
    (kind: SegmentKind): boolean =>
        kind !== 'literal' && kind !== 'dayOfWeek';


export const editableCount: (descriptors: SegmentDescriptor[]) => number = (descriptors: SegmentDescriptor[]) => {
    return descriptors.filter((d: SegmentDescriptor) => isFocusableSegment(d.kind)).length;
};

export const editableDescriptor: (
    descriptors: SegmentDescriptor[],
    index: number
) => SegmentDescriptor = (descriptors: SegmentDescriptor[], index: number) => {
    return descriptors.filter((d: SegmentDescriptor) => isFocusableSegment(d.kind))[index as number];
};

export const dateToSegmentValues: (
    date: Date | null | undefined,
    descriptors: SegmentDescriptor[],
    locale: string,
    calendarSystem: CalendarSystem
) => string[] = (
    date: Date | null | undefined,
    descriptors: SegmentDescriptor[],
    locale: string = 'en-US',
    calendarSystem: CalendarSystem
) => {
    const editable: SegmentDescriptor[] = descriptors.filter(
        (d: SegmentDescriptor) => isFocusableSegment(d.kind)
    );
    if (!date || isNaN(date.getTime())) {
        return editable.map((d: SegmentDescriptor) => d.placeholder);
    }

    return editable.map((desc: SegmentDescriptor) => {
        switch (desc.kind) {
        case 'day':
        case 'month':
        case 'year':
        case 'hour':
        case 'minute':
        case 'second':
            return formatDate(date, {
                format: desc.token,
                locale,
                type: desc.kind === 'hour' && (desc.token === 'h' || desc.token === 'hh') ? 'time' : 'date',
                calendar: calendarSystem?.name
            });
        case 'meridiem': {
            return formatDate(date, {
                format: desc.token,
                locale,
                type: 'time',
                calendar: calendarSystem?.name
            });
        }
        default:
            return desc.placeholder;
        }
    });
};

export const normalizeToAsciiDigits: (str: string) => string = (str: string): string => {
    return str
        .replace(/[\u0660-\u0669]/g, (c: string) => String(c.charCodeAt(0) - 0x0660))
        .replace(/[\u06F0-\u06F9]/g, (c: string) => String(c.charCodeAt(0) - 0x06F0));
};

const buildDateFromParts: (
    vals: Partial<Record<SegmentKind, number>>,
    editable: SegmentDescriptor[],
    meridiem: 'AM' | 'PM' | null,
    calendarSystem: CalendarSystem
) => Date | null = (
    vals: Partial<Record<SegmentKind, number>>,
    editable: SegmentDescriptor[],
    meridiem: 'AM' | 'PM' | null,
    calendarSystem: CalendarSystem
) => {
    const year: number = vals['year'] ?? calendarSystem.getYear(new Date());
    const month: number = (vals['month'] ?? 1) - 1;
    const day: number = vals['day'] ?? 1;
    let hour: number = vals['hour'] ?? 0;
    const minute: number = vals['minute'] ?? 0;
    const second: number = vals['second'] ?? 0;
    const has12h: boolean = editable.some(
        (d: SegmentDescriptor) =>
            d.kind === 'hour' && (d.token === 'h' || d.token === 'hh')
    );
    if (has12h && meridiem) {
        if (meridiem === 'AM' && hour === 12) {
            hour = 0;
        }
        if (meridiem === 'PM' && hour !== 12) {
            hour += 12;
        }
    }
    const result: Date = calendarSystem.toDate(year, month, day, hour, minute, second);
    return isNaN(result.getTime()) ? null : result;
};

export const tryParseFullDate: (
    inputText: string,
    formatDescriptors: SegmentDescriptor[],
    calendarSystem: CalendarSystem
) => Date | null = (
    inputText: string,
    formatDescriptors: SegmentDescriptor[],
    calendarSystem: CalendarSystem
) => {
    const nativeParsedDate: Date = new Date(inputText);
    if (!isNaN(nativeParsedDate.getTime())) {
        return nativeParsedDate;
    }
    const editableSegments: SegmentDescriptor[] = formatDescriptors.filter(
        (descriptor: SegmentDescriptor) => descriptor.kind !== 'literal'
    );
    let cursorPosition: number = 0;
    const parsedValues: Partial<Record<SegmentKind, number>> = {};
    let parsedMeridiem: 'AM' | 'PM' | null = null;
    for (const descriptor of formatDescriptors) {
        if (descriptor.kind === 'literal') {
            cursorPosition += descriptor.token.length;
            continue;
        }
        const segmentLength: number =
            descriptor.kind === 'meridiem'
                ? 2
                : descriptor.digits || 2;

        const segmentText: string = inputText.substring(
            cursorPosition,
            cursorPosition + segmentLength
        );
        if (descriptor.kind === 'meridiem') {
            parsedMeridiem =
                segmentText.toUpperCase() === 'PM' ? 'PM' : 'AM';
        } else {
            const numericValue: number = parseInt(normalizeToAsciiDigits(segmentText), 10);
            if (isNaN(numericValue)) {
                return null;
            }
            parsedValues[descriptor.kind] = numericValue;
        }
        cursorPosition += segmentText.length;
    }
    return buildDateFromParts(parsedValues, editableSegments, parsedMeridiem, calendarSystem);
};

export const parseMonthName: (monthName: string, locale?: string) => number = (monthName: string, locale: string = 'en-US') => {
    for (let month: number = 0; month < 12; month++) {
        const testMonthDate: Date = new Date(2000, month, 15);
        const shortName: string = formatDate(testMonthDate, {
            format: 'MMM',
            locale,
            type: 'date'
        });
        const longName: string = formatDate(testMonthDate, {
            format: 'MMMM',
            locale,
            type: 'date'
        });
        if (monthName.toLowerCase() === shortName.toLowerCase() ||
            monthName.toLowerCase() === longName.toLowerCase()) {
            return month;
        }
    }
    return -1;
};

export const composeDate: (
    formatDescriptors: SegmentDescriptor[],
    segmentValues: string[],
    locale: string,
    showMaskByDefault: boolean,
    calendarSystem: CalendarSystem
) => Date | null = (
    formatDescriptors: SegmentDescriptor[],
    segmentValues: string[],
    locale: string = 'en-US',
    showMaskByDefault: boolean = false,
    calendarSystem: CalendarSystem
) => {
    const editableSegments: SegmentDescriptor[] = formatDescriptors.filter(
        (descriptor: SegmentDescriptor) => isFocusableSegment(descriptor.kind)
    );
    const parsedValues: Partial<Record<SegmentKind, number>> = {};
    let parsedMeridiem: 'AM' | 'PM' | null = null;
    for (let index: number = 0; index < editableSegments.length; index++) {
        const segmentDescriptor: SegmentDescriptor = editableSegments[index as number];
        const segmentValue: string = segmentValues[index as number];
        if (showMaskByDefault && segmentValue === segmentDescriptor.placeholder) {
            return null;
        }
        if (!segmentValue || segmentValue === segmentDescriptor.placeholder) {
            return null;
        }
        if (segmentDescriptor.kind === 'meridiem') {
            const { pm: localePM } = getLocaleMeridiemPair(segmentDescriptor.token, locale);
            parsedMeridiem = segmentValue === localePM ? 'PM' : 'AM';
        } else if (segmentDescriptor.kind === 'month' && (segmentDescriptor.token === 'MMM' || segmentDescriptor.token === 'MMMM')) {
            const monthIndex: number = parseMonthName(segmentValue, locale);
            if (monthIndex === -1) {
                return null;
            }
            parsedValues[segmentDescriptor.kind] = monthIndex + 1;
        } else {
            const numericValue: number = parseInt(normalizeToAsciiDigits(segmentValue), 10);
            if (isNaN(numericValue)) {
                return null;
            }
            parsedValues[segmentDescriptor.kind] = numericValue;
        }
    }
    return buildDateFromParts(parsedValues, editableSegments, parsedMeridiem, calendarSystem);
};

export const getLocaleMeridiem: (
    isPM: boolean,
    token: string,
    locale: string
) => string = (isPM: boolean, token: string, locale: string): string => {
    const refDate: Date = new Date(2000, 0, 1, isPM ? 13 : 9, 0, 0);
    return formatDate(refDate, { format: token, locale, type: 'time' });
};

export const getLocaleMeridiemPair: (
    token: string,
    locale: string
) => { am: string; pm: string } = (token: string, locale: string): { am: string; pm: string } => ({
    am: getLocaleMeridiem(false, token, locale),
    pm: getLocaleMeridiem(true, token, locale)
});


export const getBaseDate: (
    descriptors: SegmentDescriptor[],
    values: string[],
    calendarSystem: CalendarSystem,
    fallbackDate?: Date
) => Date = (
    descriptors: SegmentDescriptor[],
    values: string[],
    calendarSystem: CalendarSystem,
    fallbackDate?: Date
): Date => {
    const composed: Date | null = composeDate(descriptors, values, 'en-US', false, calendarSystem);
    if (composed) {
        return composed;
    }
    if (fallbackDate instanceof Date && !isNaN(fallbackDate.getTime())) {
        return new Date(fallbackDate);
    }
    return new Date();
};
