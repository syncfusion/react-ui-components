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
    const date: Date = new Date(d); date.setHours(0, 0, 0, 0);
    const time: number = date.getTime();
    const minTime: Date = new Date(isValidDateObj(min) ? min : date);
    minTime.setHours(0, 0, 0, 0);
    const maxTime: Date = new Date(isValidDateObj(max) ? max : date);
    maxTime.setHours(23, 59, 59, 999);
    return time >= minTime.getTime() && time <= maxTime.getTime();
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

export const getVisibleDates: (baseDate: Date, view: CalendarView, calendarSystem?: CalendarSystem) => Date[] = (
    baseDate: Date,
    view: CalendarView,
    calendarSystem?: CalendarSystem
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
        const startOfDecade: Date = calendarSystem ? calendarSystem.startOfDecade(baseDate)
            : new Date(baseDate.getFullYear() - (baseDate.getFullYear() % 10) - 1, 0, 1);
        for (let i: number = 0; i < 12; i++) {
            const date: Date = calendarSystem ? calendarSystem.addYears(startOfDecade, i) : new Date(startOfDecade.getFullYear() + i, 0, 1);
            dates.push(date);
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
    const dates: Date[] = getVisibleDates(baseDate, view, calendarSystem);
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
    const dates: Date[] = getVisibleDates(baseDate, view, calendarSystem).reverse();
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
    range?:  [Date | null, Date | null] | undefined;
    focusTodayOnOtherMonth?: boolean;
    suppressRangeSelection?: boolean;
    isRangePreview?: boolean;
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
    suppressDisabledClass?: boolean
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
    let isToday: boolean = !!cell.isToday;
    const isMonthView: boolean = kind === 'month' || kind === CalendarView.Month;
    const isYearView: boolean = kind === 'year' || kind === CalendarView.Year;
    const isDecadeView: boolean = kind === 'decade' || kind === CalendarView.Decade;

    let isOutOfBounds: boolean;
    if (isMonthView) {
        isOutOfBounds = computeDisabled(date, ctx.minDate, ctx.maxDate);
    } else if (isYearView) {
        isOutOfBounds = !isInViewRange(date, CalendarView.Year, ctx.minDate, ctx.maxDate, calendarSystem);
        isToday = calendarSystem.isSameMonth(date, new Date());
    } else {
        isOutOfBounds = !isInViewRange(date, CalendarView.Decade, ctx.minDate, ctx.maxDate, calendarSystem);
        isToday = calendarSystem.isSameYear(date, new Date());
    }

    const isOtherRange: boolean = !cell.inRange;
    const isWeekend: boolean = !!cell.isWeekend;
    let isFocused: boolean = false;

    if (ctx.focusedDate && !isOutOfBounds) {
        if (isMonthView) {
            isFocused = calendarSystem.isSameDate(date, ctx.focusedDate);
        } else if (isYearView) {
            isFocused = calendarSystem.isSameMonth(date, ctx.focusedDate);
            isToday = calendarSystem.isSameMonth(date, new Date());
        } else {
            isFocused = calendarSystem.isSameYear(date, ctx.focusedDate);
            isToday = calendarSystem.isSameYear(date, new Date());
        }
    }

    let isSelected: boolean = false;
    let isRangeEndpointSelected: boolean = false;
    if (isMonthView) {
        isSelected = computeSelectedForMonth(date, ctx.normalizedDates, !!ctx.multiSelect);
        if (!isSelected && ctx.range && Array.isArray(ctx.range) &&
            (cell.inRange || (!!ctx.focusTodayOnOtherMonth && !ctx.isRangePreview))) {
            const [start, end] = ctx.range;
            if (!ctx.suppressRangeSelection) {
                if (start instanceof Date && !isNaN(start.getTime())) {
                    isRangeEndpointSelected = date.toDateString() === start.toDateString();
                    isSelected = isRangeEndpointSelected;
                }
                if (!isSelected && end instanceof Date && !isNaN(end.getTime())) {
                    isRangeEndpointSelected = date.toDateString() === end.toDateString();
                    isSelected = isRangeEndpointSelected;
                }
            }
        }
    } else if (isYearView) {
        if (ctx.range && Array.isArray(ctx.range) && (cell.inRange || !!ctx.focusTodayOnOtherMonth)) {
            const [start, end] = ctx.range;
            if (!ctx.suppressRangeSelection) {
                if (start instanceof Date && !isNaN(start.getTime())) {
                    isRangeEndpointSelected = calendarSystem.isSameMonth(date, start);
                    isSelected = isRangeEndpointSelected;
                }
                if (!isSelected && end instanceof Date && !isNaN(end.getTime())) {
                    isRangeEndpointSelected = calendarSystem.isSameMonth(date, end);
                    isSelected = isRangeEndpointSelected;
                }
            }
        }
        if (!isSelected) {
            isSelected = !!ctx.selectedDate && calendarSystem.isSameMonth(date, ctx.selectedDate);
        }
    } else {
        if (ctx.range && Array.isArray(ctx.range) && (cell.inRange || (!!ctx.focusTodayOnOtherMonth && !ctx.isRangePreview))) {
            const [start, end] = ctx.range;
            if (!ctx.suppressRangeSelection) {
                if (start instanceof Date && !isNaN(start.getTime())) {
                    isRangeEndpointSelected = calendarSystem.isSameYear(date, start);
                    isSelected = isRangeEndpointSelected;
                }
                if (!isSelected && end instanceof Date && !isNaN(end.getTime())) {
                    isRangeEndpointSelected = calendarSystem.isSameYear(date, end);
                    isSelected = isRangeEndpointSelected;
                }
            }
        }
        if (!isSelected) {
            isSelected = !!ctx.selectedDate && calendarSystem.isSameYear(date, ctx.selectedDate);
        }
    }

    const base: string[] = ['sf-cell'];

    if (ctx.focusTodayOnOtherMonth && isOtherRange) {
        isToday = isFocused = false;
        if (!isRangeEndpointSelected) {
            isSelected = false;
        }
    }

    const rangeStart: Date | null | undefined = ctx.range?.[0];
    const suppressDisabledClass: boolean = isMonthView && isSelected && isOutOfBounds && !ctx.disabled &&
        isValidDateObj(rangeStart) && calendarSystem.isSameDate(date, rangeStart);

    if (isOtherRange) {
        base.push(isDecadeView ? 'sf-other-year' : 'sf-other-month');
    }
    if (isWeekend) {
        base.push('sf-weekend');
    }
    if ((isOutOfBounds || ctx.disabled) && !suppressDisabledClass) {
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
        ariaDisabled: isOutOfBounds || ctx.disabled || undefined,
        suppressDisabledClass
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

export const isCellWithinRange: (
    cellDate: Date,
    range: [Date | null, Date | null] | undefined,
    precision: 'month' | 'year',
    calendarSystem?: CalendarSystem
) => boolean = (
    cellDate: Date,
    range: [Date | null, Date | null] | undefined,
    precision: 'month' | 'year',
    calendarSystem?: CalendarSystem
): boolean => {
    const [start, end] = range ?? [null, null];
    if (!isValidDateObj(start) || !isValidDateObj(end)) {
        return false;
    }
    const getComparableValue: (date: Date) => number = (date: Date): number => {
        const year: number = calendarSystem ? calendarSystem.getYear(date) : date.getFullYear();
        if (precision === 'month') {
            const month: number = calendarSystem ? calendarSystem.getMonth(date) : date.getMonth();
            return year * 12 + month;
        }
        return year;
    };
    const cellValue: number = getComparableValue(cellDate);
    const startValue: number = getComparableValue(start);
    const endValue: number = getComparableValue(end);
    return cellValue > Math.min(startValue, endValue) && cellValue < Math.max(startValue, endValue);
};
