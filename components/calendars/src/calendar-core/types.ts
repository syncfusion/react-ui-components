import { CalendarView } from '../calendar/types';

/**
 * Specifies the calendar types.
 */
export type CalendarType = 'gregorian' | 'islamic';

/**
 * Options used to generate a view matrix.
 */
export interface CalendarOptions {
    /**
     * The first day of the week (0 = Sunday, 1 = Monday, ...). Only used for 'month' view.
     *
     * @defaultValue 0
     */
    firstDayOfWeek?: number;

    /**
     * Number of rows in the resulting matrix. Defaults depend on view kind.
     * - month: typically 6
     * - year: typically 4
     * - decade: typically 4
     */
    rows?: number;

    /**
     * Number of columns in the resulting matrix. Defaults depend on view kind.
     * - month: typically 7
     * - year: typically 3
     * - decade: typically 3
     */
    cols?: number;

    /**
     * Locale for Calendar When omitted, calendar engines may fall back to a default locale (e.g., "en-US").
     */
    locale?: string;

    /**
     * Whether to show days from adjacent months in the current calendar view.
     */
    showDaysOutsideCurrentMonth?: boolean;

    /**
     * Specifies the numeric values representing weekend days (0 = Sunday, 6 = Saturday).
     */
    weekendDays?: number[];

    /**
     * Specifies a custom function to determine if a given date is a weekend.
     *
     * @param date - The date to check.
     * @returns True if the date is considered a weekend, otherwise false.
     */
    isWeekend?: (date: Date) => boolean;
}

/**
 * A single cell within a view matrix (month, year, or decade).
 */
export interface CalendarCellData {
    /**
     * The view kind that generated this cell.
     */
    kind: CalendarView;

    /**
     * The canonical date represented by this cell.
     * - month view: the actual date of the day cell
     * - year view: the first day of the month
     * - decade view: January 1st of the year
     */
    date: Date;

    /**
     * The zero-based row index in the matrix.
     */
    row: number;

    /**
     * The zero-based column index in the matrix.
     */
    col: number;

    /**
     * A display label suitable for the cell (e.g., day number, month short name, or year).
     */
    label: string;

    /**
     * Whether this cell belongs to the main range of the base view.
     * - month: same month as baseDate
     * - year: same year as baseDate (typically true for a 4x3 matrix)
     * - decade: within the decade range (baseStart..baseStart+9)
     */
    inRange: boolean;

    /**
     * True if the cell corresponds to today's date (only meaningful for month view, but provided consistently).
     */
    isToday?: boolean;

    /**
     * True if the cell falls on a weekend (only meaningful for month view, but provided consistently).
     */
    isWeekend?: boolean;
}

/**
 * Defines the standard interface for a calendar system.
 * Each calendar system must implement this contract.
 */
export interface CalendarSystem {
    /**
     * The unique name of the calendar system (e.g., "gregorian").
     */
    readonly name: string;

    /**
     * Returns localized names for the days of the week in display order, starting from `firstDayOfWeek`.
     *
     * @param locale A BCP 47 language tag (e.g., "en", "en-US").
     * @param firstDayOfWeek The first day of the week (0 = Sunday, 1 = Monday, ...).
     * @param weekDaysFormat The name format for week days.
     *  Expected values: "Short" | "Narrow" | "Abbreviated" | "Wide".
     * @returns An array of 7 localized day names in the requested format.
     */
    getWeekDayNames(locale: string, firstDayOfWeek: number, weekDaysFormat: string): string[];

    /**
     * Returns the localized name for a specific month.
     *
     * @param monthIndex The zero-based index of the month (0-11).
     * @param format The desired format ("long" | "short").
     * @returns The localized month name in the requested format.
     */
    getMonthName(monthIndex: number, format?: 'long' | 'short', locale?: string): string;

    /**
     * Returns a new date that is `n` days after (or before if negative) the given date.
     *
     * @param d The input date.
     * @param n Number of days to add (negative to subtract).
     * @returns A new Date instance with the adjustment applied.
     */
    addDays(d: Date, n: number): Date;

    /**
     * Returns a new date that is the given number of months from the input date.
     *
     * @param date The input date.
     * @param months Number of months to add (negative to subtract).
     * @returns A new Date instance with the adjustment applied.
     */
    addMonths(date: Date, months: number): Date;

    /**
     * Returns a new date that is the given number of years from the input date.
     *
     * @param date The input date.
     * @param years Number of years to add (negative to subtract).
     * @returns A new Date instance with the adjustment applied.
     */
    addYears(date: Date, years: number): Date;

    /**
     * Gets the calendar year component of the given date.
     *
     * @param date The input date.
     * @returns The year number.
     */
    getYear(date: Date): number;

    /**
     * Gets the zero-based calendar month component of the given date.
     *
     * @param date The input date.
     * @returns The month index (0-11).
     */
    getMonth(date: Date): number;

    /**
     * Gets the day of the month component of the given date.
     *
     * @param date The input date.
     * @returns The day of the month (1-31).
     */
    getDay(date: Date): number;

    /**
     * Determines whether two dates are in the same calendar month and year.
     *
     * @param date1 The first date.
     * @param date2 The second date.
     * @returns True if both dates are in the same month and year; otherwise, false.
     */
    isSameMonth(date1: Date, date2: Date): boolean;

    /**
     * Determines whether two Year are same.
     *
     * @param date1 The first date.
     * @param date2 The second date.
     * @returns True if both Year same; otherwise, false.
     */
    isSameYear(date1: Date, date2: Date): boolean;

    /**
     * Determines whether two dates are same.
     *
     * @param date1 The first date.
     * @param date2 The second date.
     * @returns True if both dates same; otherwise, false.
     */
    isSameDate(date1: Date, date2: Date): boolean;

    /**
     * Calculates the week number for a given date based on the calendar's WeekRule and first day of week rules.
     *
     * @param date The input date.
     * @returns The week number within the year (1-based).
     */
    getWeekNumber(date: Date): number;

    /**
     * Returns a new date representing the start of the month for the given date.
     *
     * @param d The input date.
     * @returns A Date set to the first day of the month (time component may be normalized).
     */
    startOfMonth(d: Date): Date;

    /**
     * Returns a new date representing the end of the month for the given date.
     *
     * @param d The input date.
     * @returns A Date set to the last day of the month (time component may be normalized).
     */
    endOfMonth(d: Date): Date;

    /**
     * Returns a new date representing the start of the year for the given date.
     *
     * @param d The input date.
     * @returns A Date set to January 1st of the year (time component may be normalized).
     */
    startOfYear(d: Date): Date;

    /**
     * Returns a new date representing the end of the year for the given date.
     *
     * @param d The input date.
     * @returns A Date set to December 31st of the year (time component may be normalized).
     */
    endOfYear(d: Date): Date;

    /**
     * Returns a new date representing the start of the decade for the given date.
     *
     * @param d The input date.
     * @returns A Date set to January 1st of the decade start year (time component may be normalized).
     */
    startOfDecade(d: Date): Date;

    /**
     * Builds a month view matrix (typically 6x7) for the given base date.
     *
     * @param baseDate The base date from which the view is generated.
     * @param options Matrix generation options (e.g., firstDayOfWeek, rows, cols).
     * @returns A 2D array of CalendarCellData representing the month view.
     */
    getMonthMatrix(baseDate: Date, options?: CalendarOptions): CalendarCellData[][];

    /**
     * Builds a year view matrix (typically 4x3) for the given base date.
     *
     * @param baseDate The base date from which the view is generated.
     * @param options Matrix generation options (rows, cols).
     * @returns A 2D array of CalendarCellData representing the year view.
     */
    getYearMatrix(baseDate: Date, options?: CalendarOptions): CalendarCellData[][];

    /**
     * Builds a decade view matrix (typically 4x3) for the given base date.
     *
     * @param baseDate The base date from which the view is generated.
     * @param options Matrix generation options (rows, cols).
     * @returns A 2D array of CalendarCellData representing the decade view.
     */
    getDecadeMatrix(baseDate: Date, options?: CalendarOptions): CalendarCellData[][];
}
