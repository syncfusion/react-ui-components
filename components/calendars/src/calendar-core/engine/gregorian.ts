import { cldrData, getDefaultDateObject, getValue, isNullOrUndefined, formatDate } from '@syncfusion/react-base';
import { CalendarSystem, CalendarType, CalendarOptions, CalendarCellData } from '../types';
import { CalendarView } from '../../calendar/types';

export const WEEK_LENGTH: number = 7;
export const DEFAULT_WEEKS: number = 6;
export const MS_PER_DAY: number = 86400000;
export const MS_PER_MINUTE: number = 60000;

export class GregorianCalendar implements CalendarSystem {
    public readonly name: CalendarType = 'gregorian';

    public getWeekDayNames(locale: string, firstDayOfWeek: number, weekDaysFormat: string): string[] {
        const fmt: string = (weekDaysFormat || 'short').toLowerCase();
        const fDow: number = ((firstDayOfWeek ?? 0) % WEEK_LENGTH + WEEK_LENGTH) % WEEK_LENGTH;

        const values: string[] = this.getCultureValues(locale, fmt);
        if (values.length === WEEK_LENGTH) {
            return this.shiftArray(values, fDow);
        }
        const fallback: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return this.shiftArray(fallback, fDow);
    }

    private getCultureValues(locale: string, weekDaysFormat: string): string[] {
        const culShortNames: string[] = [];
        let cldrObj: string[];
        const dayFormat: string = 'days.stand-alone.' + weekDaysFormat?.toLowerCase();
        if ((locale === 'en' || locale === 'en-US') && !isNullOrUndefined(dayFormat)) {
            cldrObj = getValue(dayFormat, getDefaultDateObject()) as string[];
        } else {
            const gregorianFormat: string = weekDaysFormat
                ? `.dates.calendars.gregorian.days.format.${weekDaysFormat.toLowerCase()}`
                : '';
            const mainVal: string = 'main.';
            cldrObj = getValue(`${mainVal}${locale || 'en-US'}${gregorianFormat}`, cldrData);
        }

        if (!isNullOrUndefined(cldrObj)) {
            for (const obj of Object.keys(cldrObj)) {
                culShortNames.push(getValue(obj, cldrObj));
            }
        }
        return culShortNames;
    }

    private shiftArray<T>(array: T[], places: number): T[] {
        if (!Array.isArray(array) || array.length === 0) {
            return array;
        }
        const n: number = array.length;
        const p: number = ((places % n) + n) % n;
        if (p === 0) {
            return array.slice();
        }
        return array.slice(p).concat(array.slice(0, p));
    }

    private getMaxDays(date: Date): number {
        if (!(date instanceof Date)  || isNaN(date.getTime())) {
            return 31;
        }
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    public getMonthName(
        monthIndex: number,
        format: 'long' | 'short' = 'long',
        locale: string = 'en-US'
    ): string {
        if (!isFinite(monthIndex)) {
            return '';
        }
        const m: number = Math.max(0, Math.min(11, Math.trunc(monthIndex)));
        const date: Date = new Date(2000, m, 15);
        const pattern: string = format === 'short' ? 'MMM' : 'MMMM';
        const name: string = formatDate(date, {
            format: pattern,
            locale,
            calendar: 'gregorian'
        });
        return name || '';
    }

    public addMonths(date: Date, months: number): Date {
        if (!(date instanceof Date) || isNaN(date.getTime()) || !isFinite(months)) {
            return new Date(NaN);
        }
        const d: Date = new Date(date.getTime());
        const targetMonth: number = d.getMonth() + months;
        const day: number = d.getDate();
        d.setDate(1);
        d.setMonth(targetMonth);
        d.setDate(Math.min(day, this.getMaxDays(d)));
        return d;
    }

    public addYears(date: Date, years: number): Date {
        if (!(date instanceof Date) || isNaN(date.getTime()) || !isFinite(years)) {
            return new Date(NaN);
        }
        const d: Date = new Date(date.getTime());
        const origMonth: number = d.getMonth();
        const origDay: number = d.getDate();
        const targetYear: number = d.getFullYear() + years;
        d.setDate(1);
        d.setFullYear(targetYear);
        d.setMonth(origMonth);
        d.setDate(Math.min(origDay, this.getMaxDays(d)));
        return d;
    }

    public getYear(date: Date): number { return date.getFullYear(); }

    public getMonth(date: Date): number { return date.getMonth(); }

    public getDay(date: Date): number { return date.getDate(); }

    public isSameMonth(date1: Date, date2: Date): boolean {
        return this.getYear(date1) === this.getYear(date2) && this.getMonth(date1) === this.getMonth(date2);
    }

    public isSameYear(date1: Date, date2: Date): boolean {
        return this.getYear(date1) === this.getYear(date2);
    }

    public isSameDate(date1: Date, date2: Date): boolean {
        return this.getYear(date1) === this.getYear(date2) &&
            this.getMonth(date1) === this.getMonth(date2) &&
            this.getDay(date1) === this.getDay(date2);
    }

    public getWeekNumber(date: Date): number {
        const currentDate: number = new Date(date).valueOf();
        const firstDayOfYear: number = new Date(date.getFullYear(), 0, 1).valueOf();
        return Math.ceil((((currentDate - firstDayOfYear) + MS_PER_DAY) / MS_PER_DAY) / WEEK_LENGTH);
    }

    public startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);

    public endOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    public startOfYear = (d: Date): Date => new Date(d.getFullYear(), 0, 1);

    public endOfYear = (d: Date): Date => new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);

    public startOfDecade = (d: Date): Date => new Date(d.getFullYear() - (d.getFullYear() % 10), 0, 1);

    public addDays = (d: Date, n: number): Date => {
        const x: Date = new Date(d);
        x.setDate(x.getDate() + n);
        return x;
    };

    public trimOutsideRows(matrix: CalendarCellData[][]): CalendarCellData[][] {
        if (!Array.isArray(matrix) || matrix.length === 0) {
            return matrix;
        }
        const rowIsOut: (row: CalendarCellData[]) => boolean = (row: CalendarCellData[]): boolean => {
            return row.every((c: CalendarCellData): boolean => !c.inRange);
        };
        let start: number = 0;
        let end: number = matrix.length - 1;
        while (start <= end && rowIsOut(matrix[start as number])) {
            start++;
        }
        while (end >= start && rowIsOut(matrix[end as number])) {
            end--;
        }
        return matrix.slice(Math.max(0, start), Math.max(start, end + 1));
    }

    public getMonthMatrix(baseDate: Date, options?: CalendarOptions): CalendarCellData[][] {
        const rows: number = options?.rows ?? DEFAULT_WEEKS;
        const cols: number = options?.cols ?? WEEK_LENGTH;
        const firstDayOfWeek: number = ((options?.firstDayOfWeek ?? 0) % WEEK_LENGTH + WEEK_LENGTH) % WEEK_LENGTH;
        const locale: string = options?.locale || 'en-US';
        const showOutside: boolean = options?.showDaysOutsideCurrentMonth ?? true;
        const base: Date = new Date(baseDate);
        if (isNaN(base.getTime())) {
            return [];
        }
        const baseYear: number = base.getFullYear();
        const baseMonth: number = base.getMonth();
        const today: Date = new Date();
        today.setHours(0, 0, 0, 0);
        const firstOfMonth: Date = new Date(baseYear, baseMonth, 1);
        const start: Date = new Date(firstOfMonth);
        const offset: number = (start.getDay() - firstDayOfWeek + WEEK_LENGTH) % WEEK_LENGTH;
        start.setDate(start.getDate() - offset);
        const weekendDays: number[] = (options)?.weekendDays ?? [0, 6];
        const weekendFn: ((d: Date) => boolean) | undefined = (options)?.isWeekend;
        const matrix: CalendarCellData[][] = [];
        const cursor: Date = new Date(start);

        for (let r: number = 0; r < rows; r++) {
            const row: CalendarCellData[] = [];
            for (let c: number = 0; c < cols; c++) {
                const cellDate: Date = new Date(cursor);
                cellDate.setHours(0, 0, 0, 0);
                const isToday: boolean = cellDate.getTime() === today.getTime();
                const wd: number = cellDate.getDay();
                const isWeekend: boolean = typeof weekendFn === 'function'
                    ? !!weekendFn(cellDate)
                    : weekendDays.includes(wd);
                row.push({
                    kind: CalendarView.Month,
                    date: cellDate,
                    row: r,
                    col: c,
                    label: formatDate(cellDate, { format: 'd', locale, type: 'date', skeleton: 'yMd' }),
                    inRange: cellDate.getMonth() === baseMonth,
                    isToday,
                    isWeekend
                });
                cursor.setDate(cursor.getDate() + 1);
            }
            matrix.push(row);
        }
        return showOutside ? matrix : this.trimOutsideRows(matrix);
    }

    public getYearMatrix(baseDate: Date, options?: CalendarOptions): CalendarCellData[][] {
        const rows: number = options?.rows ?? 4;
        const cols: number = options?.cols ?? 3;
        const locale: string = options?.locale || 'en-US';
        const baseYear: number = baseDate.getFullYear();
        const matrix: CalendarCellData[][] = [];
        let m: number = 0;
        for (let r: number = 0; r < rows; r++) {
            const row: CalendarCellData[] = [];
            for (let c: number = 0; c < cols; c++) {
                const date: Date = new Date(baseYear, Math.max(0, Math.min(11, m)), 1);
                const label: string = this.getMonthName(Math.max(0, Math.min(11, m)), 'short', locale);
                row.push({
                    kind: CalendarView.Year,
                    date,
                    row: r,
                    col: c,
                    label,
                    inRange: m >= 0 && m <= 11
                });
                m++;
            }
            matrix.push(row);
        }

        return matrix;
    }

    public getDecadeMatrix(baseDate: Date, options?: CalendarOptions): CalendarCellData[][] {
        const rows: number = options?.rows ?? 4;
        const cols: number = options?.cols ?? 3;
        const locale: string = options?.locale || 'en-US';
        const baseYear: number = baseDate.getFullYear();
        const baseStart: number = baseYear - (baseYear % 10);
        const startYear: number = baseStart - 1;
        const endYear: number = baseStart + 9;
        const matrix: CalendarCellData[][] = [];
        let y: number = startYear;

        for (let r: number = 0; r < rows; r++) {
            const row: CalendarCellData[] = [];
            for (let c: number = 0; c < cols; c++) {
                const inDecade: boolean = y >= baseStart && y <= endYear;
                const date: Date = new Date(y, 0, 1);
                row.push({
                    kind: CalendarView.Decade,
                    date,
                    row: r,
                    col: c,
                    label: formatDate(date, { format: 'y', locale, type: 'date', skeleton: 'y' }),
                    inRange: inDecade
                });
                y++;
            }
            matrix.push(row);
        }

        return matrix;
    }
}
