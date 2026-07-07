import { HijriParser, formatDate } from '@syncfusion/react-base';
import { CalendarSystem, CalendarType, CalendarOptions, CalendarCellData } from '../types';
import { CalendarView } from '../../calendar/types';
import { DEFAULT_WEEKS, getCultureValues, shiftArray, trimOutsideRows, WEEK_LENGTH } from './utils';

/**
 * Specifies an Islamic (Hijri) date
 */
export interface HijriDate {
    year: number;
    month: number;
    date: number;
}

export class IslamicCalendar implements CalendarSystem {
    public readonly name: CalendarType = 'islamic';

    private getDaysInIslamicMonth(year: number, month: number): number {
        if (month < 1 || month > 12) {
            return 30;
        }
        if (month % 2 === 1) {
            return 30;
        } else if (month === 12) {
            return this.isLeapYear(year) ? 30 : 29;
        } else {
            return 29;
        }
    }

    private isLeapYear(year: number): boolean {
        const cycle: number = year % 30;
        return [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(cycle);
    }

    public getWeekDayNames(locale: string, firstDayOfWeek: number, weekDaysFormat: string): string[] {
        const fmt: string = (weekDaysFormat || 'short').toLowerCase();
        const fDow: number = ((firstDayOfWeek ?? 0) % WEEK_LENGTH + WEEK_LENGTH) % WEEK_LENGTH;
        const values: string[] = getCultureValues(locale, fmt, 'islamic');
        if (values.length === WEEK_LENGTH) {
            return shiftArray(values, fDow);
        }
        const fallback: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return shiftArray(fallback, fDow);
    }

    public getMonthName(monthIndex: number, format: 'long' | 'short' = 'long', locale: string = 'en-US'): string {
        if (!isFinite(monthIndex)) {
            return '';
        }
        const clampedMonth: number = Math.max(0, Math.min(11, Math.trunc(monthIndex)));
        const gregDate: Date = HijriParser.toGregorian(1444, clampedMonth + 1, 1);
        const pattern: string = format === 'short' ? 'MMM' : 'MMMM';
        return formatDate(gregDate, { format: pattern, locale, calendar: 'islamic' }) || '';
    }

    public addDays(date: Date, numberOfDays: number): Date {
        const result: Date = new Date(date);
        result.setDate(result.getDate() + numberOfDays);
        return result;
    }

    public addMonths(date: Date, numberOfMonths: number): Date {
        if (!(date instanceof Date) || isNaN(date.getTime()) || !isFinite(numberOfMonths)) {
            return new Date(NaN);
        }
        const hijri: HijriDate = HijriParser.getHijriDate(date);
        let newMonth: number = hijri.month + numberOfMonths;
        let newYear: number = hijri.year;
        while (newMonth > 12) {
            newMonth -= 12;
            newYear++;
        }
        while (newMonth < 1) {
            newMonth += 12;
            newYear--;
        }
        const maxDays: number = this.getDaysInIslamicMonth(newYear, newMonth);
        const day: number = Math.min(hijri.date, maxDays);
        return HijriParser.toGregorian(newYear, newMonth, day);
    }

    public addYears(date: Date, numberOfYears: number): Date {
        if (!(date instanceof Date) || isNaN(date.getTime()) || !isFinite(numberOfYears)) {
            return new Date(NaN);
        }
        const hijri: HijriDate = HijriParser.getHijriDate(date);
        const newYear: number = hijri.year + numberOfYears;
        const maxDays: number = this.getDaysInIslamicMonth(newYear, hijri.month);
        const day: number = Math.min(hijri.date, maxDays);
        return HijriParser.toGregorian(newYear, hijri.month, day);
    }

    public getYear(date: Date): number {
        return HijriParser.getHijriDate(date).year;
    }

    public getMonth(date: Date): number {
        return HijriParser.getHijriDate(date).month - 1;
    }

    public getDay(date: Date): number {
        return HijriParser.getHijriDate(date).date;
    }

    public isSameMonth(firstDate: Date, secondDate: Date): boolean {
        if (!(firstDate instanceof Date) || isNaN(firstDate.getTime()) ||
            !(secondDate instanceof Date) || isNaN(secondDate.getTime())) {
            return false;
        }
        const h1: HijriDate = HijriParser.getHijriDate(firstDate);
        const h2: HijriDate = HijriParser.getHijriDate(secondDate);
        return h1.year === h2.year && h1.month === h2.month;
    }

    public isSameYear(firstDate: Date, secondDate: Date): boolean {
        return HijriParser.getHijriDate(firstDate).year === HijriParser.getHijriDate(secondDate).year;
    }

    public isSameDate(firstDate: Date, secondDate: Date): boolean {
        const h1: HijriDate = HijriParser.getHijriDate(firstDate);
        const h2: HijriDate = HijriParser.getHijriDate(secondDate);
        return h1.year === h2.year && h1.month === h2.month && h1.date === h2.date;
    }

    public getWeekNumber(date: Date): number {
        const hijri: HijriDate = HijriParser.getHijriDate(date);
        let dayOfYear: number = hijri.date;
        for (let m: number = 1; m < hijri.month; m++) {
            dayOfYear += this.getDaysInIslamicMonth(hijri.year, m);
        }
        return Math.ceil(dayOfYear / WEEK_LENGTH);
    }

    public toDate(
        year: number,
        month: number,
        day: number,
        hour: number = 0,
        minute: number = 0,
        second: number = 0
    ): Date {
        const greg: Date = HijriParser.toGregorian(year, month + 1, day);
        greg.setHours(hour, minute, second, 0);
        return greg;
    }

    public getDaysInMonth(year: number, month: number): number {
        return this.getDaysInIslamicMonth(year, month + 1);
    }

    public startOfMonth(date: Date): Date {
        const hijri: HijriDate = HijriParser.getHijriDate(date);
        return HijriParser.toGregorian(hijri.year, hijri.month, 1);
    }

    public endOfMonth(date: Date): Date {
        const hijri: HijriDate = HijriParser.getHijriDate(date);
        const lastDay: number = this.getDaysInIslamicMonth(hijri.year, hijri.month);
        const endDate: Date = HijriParser.toGregorian(hijri.year, hijri.month, lastDay);
        endDate.setHours(23, 59, 59, 999);
        return endDate;
    }

    public startOfYear(date: Date): Date {
        const hijri: HijriDate = HijriParser.getHijriDate(date);
        return HijriParser.toGregorian(hijri.year, 1, 1);
    }

    public endOfYear(date: Date): Date {
        const hijri: HijriDate = HijriParser.getHijriDate(date);
        const endDate: Date = HijriParser.toGregorian(hijri.year, 12, 30);
        endDate.setHours(23, 59, 59, 999);
        return endDate;
    }

    public startOfDecade(date: Date): Date {
        const hijri: HijriDate = HijriParser.getHijriDate(date);
        const decadeStart: number = hijri.year - (hijri.year % 10);
        return HijriParser.toGregorian(decadeStart, 1, 1);
    }

    public getMonthMatrix(baseDate: Date, options?: CalendarOptions): CalendarCellData[][] {
        const rows: number = options?.rows ?? DEFAULT_WEEKS;
        const cols: number = options?.cols ?? WEEK_LENGTH;
        const firstDayOfWeek: number = ((options?.firstDayOfWeek ?? 0) % WEEK_LENGTH + WEEK_LENGTH) % WEEK_LENGTH;
        const locale: string = options?.locale || 'en-US';
        const showOutside: boolean = options?.showDaysOutsideCurrentMonth ?? true;
        if (!(baseDate instanceof Date) || isNaN(baseDate.getTime())) {
            return [];
        }
        const baseHijri: HijriDate = HijriParser.getHijriDate(baseDate);
        const today: Date = new Date();
        today.setHours(0, 0, 0, 0);
        const firstOfMonth: Date = HijriParser.toGregorian(baseHijri.year, baseHijri.month, 1);
        const start: Date = new Date(firstOfMonth);
        const offset: number = (start.getDay() - firstDayOfWeek + WEEK_LENGTH) % WEEK_LENGTH;
        start.setDate(start.getDate() - offset);
        const weekendDays: number[] = (options?.weekendDays ?? [4, 5]);
        const weekendFn: ((d: Date) => boolean) | undefined = (options?.isWeekend);
        const matrix: CalendarCellData[][] = [];
        const cursor: Date = new Date(start);
        for (let r: number = 0; r < rows; r++) {
            const row: CalendarCellData[] = [];
            for (let c: number = 0; c < cols; c++) {
                const cellDate: Date = new Date(cursor);
                cellDate.setHours(0, 0, 0, 0);
                const hijri: HijriDate = HijriParser.getHijriDate(cellDate);
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
                    inRange: hijri.month === baseHijri.month,
                    isToday,
                    isWeekend
                });
                cursor.setDate(cursor.getDate() + 1);
            }
            matrix.push(row);
        }
        return showOutside ? matrix : trimOutsideRows(matrix);
    }

    public getYearMatrix(baseDate: Date, options?: CalendarOptions): CalendarCellData[][] {
        const rows: number = options?.rows ?? 4;
        const cols: number = options?.cols ?? 3;
        const locale: string = options?.locale || 'en-US';
        const baseHijri: HijriDate = HijriParser.getHijriDate(baseDate);
        const baseYear: number = baseHijri.year;
        const matrix: CalendarCellData[][] = [];
        let m: number = 0;
        for (let r: number = 0; r < rows; r++) {
            const row: CalendarCellData[] = [];
            for (let c: number = 0; c < cols; c++) {
                const clampedMonth: number = Math.max(0, Math.min(11, m));
                const date: Date = HijriParser.toGregorian(baseYear, clampedMonth + 1, 1);
                const label: string = this.getMonthName(clampedMonth, 'short', locale);
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
        const baseHijri: HijriDate = HijriParser.getHijriDate(baseDate);
        const baseYear: number = baseHijri.year;
        const baseStart: number = baseYear - (baseYear % 10);
        const startYear: number = baseStart - 1;
        const endYear: number = baseStart + 9;
        const matrix: CalendarCellData[][] = [];
        let y: number = startYear;
        for (let r: number = 0; r < rows; r++) {
            const row: CalendarCellData[] = [];
            for (let c: number = 0; c < cols; c++) {
                const inDecade: boolean = y >= baseStart && y <= endYear;
                const date: Date = HijriParser.toGregorian(y, 1, 1);
                row.push({
                    kind: CalendarView.Decade,
                    date,
                    row: r,
                    col: c,
                    label: formatDate(date, { format: 'y', locale, type: 'date', skeleton: 'y', calendar: 'islamic' }),
                    inRange: inDecade
                });
                y++;
            }
            matrix.push(row);
        }
        return matrix;
    }
}
