import { CalendarView } from '../calendar/types';
import { CalendarCellData, CalendarSystem } from '../calendar-core';

export const getViewNumber: (view: CalendarView) => number = (view: CalendarView): number => {
    switch (view) {
    case CalendarView.Month:
        return 0;
    case CalendarView.Year:
        return 1;
    case CalendarView.Decade:
        return 2;
    default:
        return 0;
    }
};

export const stepByCell: (
    base: Date,
    view: CalendarView,
    step: number,
    calendarSystem: CalendarSystem
) => Date = (
    base: Date,
    view: CalendarView,
    step: number,
    calendarSystem: CalendarSystem
) => {
    switch (view) {
    case CalendarView.Month:
        return calendarSystem.addDays(base, step);
    case CalendarView.Year:
        return calendarSystem.addMonths(base, step);
    case CalendarView.Decade:
    default:
        return calendarSystem.addYears(base, step);
    }
};


export const stepByView: (
    base: Date,
    view: CalendarView,
    step: number,
    calendarSystem: CalendarSystem
) => Date = (
    base: Date,
    view: CalendarView,
    step: number,
    calendarSystem: CalendarSystem
) => {
    switch (view) {
    case CalendarView.Month:
        return calendarSystem.addMonths(base, step);
    case CalendarView.Year:
        return calendarSystem.addYears(base, step);
    case CalendarView.Decade:
    default:
        return calendarSystem.addYears(base, step * 10);
    }
};

export const clampDate: (d: Date, min: Date, max: Date) => Date = (
    d: Date,
    min: Date,
    max: Date
): Date => {
    return d < min ? new Date(min) : d > max ? new Date(max) : new Date(d);
};

export const inRange: (d: Date, min?: Date | null, max?: Date | null) => boolean = (
    d: Date,
    min?: Date | null,
    max?: Date | null
): boolean => {
    const minTime: number = isValidDateObj(min) ? +min : +d;
    const maxTime: number = isValidDateObj(max) ? +max : +d;
    const t: number = +d;
    return t >= minTime && t <= maxTime;
};

export const isValidDateObj: (x: unknown) => x is Date = (x: unknown): x is Date => {
    return x instanceof Date && !isNaN(x.getTime());
};

export const isInViewRange: (
    d: Date,
    view: CalendarView,
    min?: Date | null,
    max?: Date | null,
    calendarSystem?: CalendarSystem
) => boolean = (d: Date, view: CalendarView, min?: Date | null, max?: Date | null, calendarSystem?: CalendarSystem): boolean => {
    const minV: Date = isValidDateObj(min) ? min : d;
    const maxV: Date = isValidDateObj(max) ? max : d;

    if (view === CalendarView.Month) {
        return inRange(d, minV, maxV);
    }
    if (!calendarSystem) {
        return inRange(d, minV, maxV);
    }
    if (view === CalendarView.Year) {
        const s: Date = calendarSystem.startOfMonth(d);
        const e: Date = calendarSystem.endOfMonth(d);
        return +e >= +minV && +s <= +maxV;
    }
    const s: Date = calendarSystem.startOfYear(d);
    const e: Date = calendarSystem.endOfYear(d);
    return +e >= +minV && +s <= +maxV;
};

export const getVisibleDates: (baseDate: Date, view: CalendarView) => Date[] = (
    baseDate: Date,
    view: CalendarView
): Date[] => {
    const dates: Date[] = [];
    if (view === CalendarView.Month) {
        const start: Date = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        const end: Date = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        for (let d: Date = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
    } else if (view === CalendarView.Year) {
        for (let m: number = 0; m < 12; m++) {
            dates.push(new Date(baseDate.getFullYear(), m, 1));
        }
    } else {
        const decadeStart: number = baseDate.getFullYear() - (baseDate.getFullYear() % 10) - 1;
        for (let y: number = decadeStart; y < decadeStart + 12; y++) {
            dates.push(new Date(y, 0, 1));
        }
    }
    return dates;
};

export const findFirstFocusableInView: (
    baseDate: Date,
    view: CalendarView,
    min: Date,
    max: Date,
    calendarSystem: CalendarSystem
) => Date = (baseDate: Date, view: CalendarView, min: Date, max: Date, calendarSystem: CalendarSystem): Date => {
    const dates: Date[] = getVisibleDates(baseDate, view);
    for (const d of dates) {
        if (isInViewRange(d, view, min, max, calendarSystem)) {
            return d;
        }
    }
    return clampDate(baseDate, min, max);
};

export const findLastFocusableInView: (
    baseDate: Date,
    view: CalendarView,
    min: Date,
    max: Date,
    calendarSystem: CalendarSystem
) => Date = (baseDate: Date, view: CalendarView, min: Date, max: Date, calendarSystem: CalendarSystem): Date => {
    const dates: Date[] = getVisibleDates(baseDate, view).reverse();
    for (const d of dates) {
        if (isInViewRange(d, view, min, max, calendarSystem)) {
            return d;
        }
    }
    return clampDate(baseDate, min, max);
};

export interface CommonContext {
    minDate: Date;
    maxDate: Date;
    disabled: boolean;
    focusedDate: Date | null;
    normalizedDates?: Date[];
    selectedDate?: Date | null;
    multiSelect?: boolean;
}

export interface CellState {
    isOutOfBounds: boolean;
    isOtherRange: boolean;
    isWeekend: boolean;
    isToday: boolean;
    isFocused: boolean;
    isSelected: boolean;
    className: string;
    ariaSelected?: boolean;
    ariaDisabled?: boolean;
}

export const computeDisabled: (
    date: Date,
    minDate: Date,
    maxDate: Date
) => boolean = (date: Date, minDate: Date, maxDate: Date) => {
    const d0: Date = new Date(date); d0.setHours(0, 0, 0, 0);
    const min0: Date = new Date(minDate); min0.setHours(0, 0, 0, 0);
    const max0: Date = new Date(maxDate); max0.setHours(23, 59, 59, 999);
    return d0 < min0 || d0 > max0;
};


export const computeSelectedForMonth: (
    date: Date,
    normalizedDates?: Date[],
    multi?: boolean
) => boolean = (date: Date, normalizedDates: Date[] = [], multi: boolean = false) => {
    if (multi) {
        return normalizedDates.some((d: Date) => d.toDateString() === date.toDateString());
    }
    return normalizedDates.length > 0 && date.toDateString() === normalizedDates[0].toDateString();
};



export const getSelectedDateFromValue: (
    value: Date | Date[] | null | undefined,
    multiSelect: boolean
) => Date | null = (
    value: Date | Date[] | null | undefined,
    multiSelect: boolean
) => {
    if (multiSelect) {
        return Array.isArray(value) && value.length > 0 ? (value[value.length - 1] as Date) : null;
    }
    return value && !Array.isArray(value) ? (value as Date) : null;
};


export const buildCellState: (
    kind: string,
    cell: CalendarCellData,
    ctx: CommonContext,
    calendarSystem: CalendarSystem
) => CellState = (
    kind: string,
    cell: CalendarCellData,
    ctx: CommonContext,
    calendarSystem: CalendarSystem
) => {
    const date: Date = cell.date;

    let isOutOfBounds: boolean;
    if (kind === 'month') {
        isOutOfBounds = computeDisabled(date, ctx.minDate, ctx.maxDate);
    } else if (kind === 'year') {
        isOutOfBounds = !isInViewRange(date, CalendarView.Year, ctx.minDate, ctx.maxDate, calendarSystem);
    } else {
        isOutOfBounds = !isInViewRange(date, CalendarView.Decade, ctx.minDate, ctx.maxDate, calendarSystem);
    }

    const isOtherRange: boolean = !cell.inRange;
    const isWeekend: boolean = !!cell.isWeekend;
    const isToday: boolean = !!cell.isToday;

    let isFocused: boolean = false;
    if (ctx.focusedDate && !isOutOfBounds) {
        if (kind === 'month') {
            isFocused = calendarSystem.isSameDate(date, ctx.focusedDate);
        } else if (kind === 'year') {
            isFocused = calendarSystem.isSameMonth(date, ctx.focusedDate);
        } else {
            isFocused = calendarSystem.isSameYear(date, ctx.focusedDate);
        }
    }

    let isSelected: boolean = false;
    if (kind === 'month') {
        isSelected = computeSelectedForMonth(date, ctx.normalizedDates, !!ctx.multiSelect);
    } else if (kind === 'year') {
        isSelected = !!ctx.selectedDate && calendarSystem.isSameMonth(date, ctx.selectedDate);
    } else {
        isSelected = !!ctx.selectedDate && calendarSystem.isSameYear(date, ctx.selectedDate);
    }

    const base: string[] = ['sf-cell'];
    if (isOtherRange) {
        base.push(kind === CalendarView.Decade ? 'sf-other-year' : 'sf-other-month');
    }
    if (isWeekend) {
        base.push('sf-weekend');
    }
    if (isOutOfBounds || ctx.disabled) {
        base.push('sf-disabled');
    }
    if (isToday) {
        base.push('sf-today');
    }
    if (isFocused && !ctx.disabled) {
        base.push('sf-focused-date');
    }
    if (isSelected) {
        base.push('sf-selected');
    }

    return {
        isOutOfBounds,
        isOtherRange,
        isWeekend,
        isToday,
        isFocused,
        isSelected,
        className: base.join(' ').trim(),
        ariaSelected: isSelected || undefined,
        ariaDisabled: isOutOfBounds || ctx.disabled || undefined
    };
};


export const isDateDisabledByRule: (
    date: Date,
    disablePastDays: boolean,
    disableFutureDays: boolean,
    view?: CalendarView
) => boolean = (
    date: Date,
    disablePastDays: boolean,
    disableFutureDays: boolean,
    view: CalendarView = CalendarView.Month
) => {
    const today: Date = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate: Date = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const isSameDay: boolean = checkDate.getTime() === today.getTime();
    const isSameMonth: boolean = checkDate.getFullYear() === today.getFullYear() && checkDate.getMonth() === today.getMonth();
    const isSameYear: boolean = checkDate.getFullYear() === today.getFullYear();

    if (view === CalendarView.Month) {
        if (isSameDay) {
            return false;
        }
        if (disablePastDays && checkDate < today) {
            return true;
        }
        if (disableFutureDays && checkDate > today) {
            return true;
        }
    } else if (view === CalendarView.Year) {
        if (isSameMonth) {
            return false;
        }
        const monthCmp: number = checkDate.getFullYear() === today.getFullYear()
            ? checkDate.getMonth() - today.getMonth()
            : checkDate.getFullYear() - today.getFullYear();
        if (disablePastDays && monthCmp < 0) {
            return true;
        }
        if (disableFutureDays && monthCmp > 0) {
            return true;
        }
    } else if (view === CalendarView.Decade) {
        if (isSameYear) {
            return false;
        }
        const yearCmp: number = checkDate.getFullYear() - today.getFullYear();
        if (disablePastDays && yearCmp < 0) {
            return true;
        }
        if (disableFutureDays && yearCmp > 0) {
            return true;
        }
    }
    return false;
};
