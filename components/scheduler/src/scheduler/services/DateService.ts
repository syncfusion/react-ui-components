import { View } from '../types/enums';
import { ActiveViewProps } from '../types/internal-interface';
import { WorkHoursProps, EventModel } from '../types/scheduler-types';
import { cldrData, formatDate, getDefaultDateObject, getValue } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../../scheduler/common/locale';

export const DAYS_PER_WEEK: number = 7;
export const MINUTES_PER_HOUR: number = 60;
export const WEEK_LENGTH: number = 7;
export const DEFAULT_WEEKS: number = 6;
export const MS_PER_MINUTE: number = 60000;
export const HOURS_PER_DAY: number = 24;
export const MINUTES_PER_DAY: number = 1440;
export const MS_PER_DAY: number = 86400000;

/**
 * Service for handling scheduler date operations
 *
 * @private
 */
export class DateService {
    /**
     * Generates a date key string in YYYY-MM-DD format
     *
     * @param {Date} date - The date to convert to a key
     * @returns {string} Date formatted as a string key
     */
    static generateDateKey(date: Date): string {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }

    /**
     * Gets the dates to render for a specific view
     *
     * @param {View} viewType - Type of view (Day, Week, WorkWeek)
     * @param {Date} selectedDate - The currently selected date
     * @param {ActiveViewProps} activeViewProps - The current active view props
     * @returns {Date[]} Array of dates to render
     */
    static getRenderDates(
        viewType: View,
        selectedDate: Date,
        activeViewProps: ActiveViewProps
    ): Date[] {

        const {
            interval,
            firstDayOfWeek,
            workDays,
            showWeekend,
            displayDate,
            numberOfWeeks
        } = activeViewProps;

        let dates: Date[] = [];
        selectedDate = this.setValidDate(selectedDate);
        const startDate: Date = (viewType === 'Week' || viewType === 'WorkWeek')
            ? this.getWeekFirstDate(selectedDate, firstDayOfWeek)
            : new Date(selectedDate);
        const totalDays: number = viewType === 'Week' || viewType === 'WorkWeek'
            ? DAYS_PER_WEEK * interval
            : interval;

        let currentDate: Date = new Date(startDate);
        if (viewType === 'Week') {
            for (let i: number = 0; i < totalDays; i++) {
                if (showWeekend || this.isWorkDay(currentDate, workDays)) {
                    dates.push(new Date(currentDate));
                }
                currentDate = this.addDays(currentDate, 1);
            }
        }
        else if (viewType === 'WorkWeek') {
            for (let i: number = 0; i < totalDays; i++) {
                const dayOfWeek: number = currentDate.getDay();
                if (workDays.includes(dayOfWeek)) {
                    dates.push(new Date(currentDate));
                }
                currentDate = this.addDays(currentDate, 1);
            }
        }
        else if (viewType === 'Day') {
            do {
                if (showWeekend || this.isWorkDay(currentDate, workDays)) {
                    dates.push(new Date(currentDate));
                }
                currentDate = this.addDays(currentDate, 1);
            } while (interval !== dates.length);
        }
        else if (viewType === 'Month') {
            dates = this.getMonthRenderDates(selectedDate, interval, firstDayOfWeek, workDays, showWeekend, displayDate, numberOfWeeks);
        }
        return dates;
    }

    static getRenderWeeks(renderDates: Date[], showWeekend: boolean, workDays: number[]): Date[][] {
        const weeks: Date[][] = [];
        const daysPerRow: number = showWeekend ? WEEK_LENGTH : workDays?.length;
        for (let i: number = 0; i < renderDates.length; i += daysPerRow) {
            weeks.push(renderDates.slice(i, i + daysPerRow));
        }
        return weeks;
    }

    static getMonthRenderDates(
        selectedDate: Date,
        interval: number,
        firstDayOfWeek: number,
        workDays: number[],
        showWeekend: boolean,
        displayDate?: Date,
        numberOfWeeks? : number
    ): Date[] {
        const renderDates: Date[] = [];
        displayDate = this.setValidDate(displayDate);
        const currentDate: Date = this.normalizeDate(selectedDate);
        let start: Date = this.getMonthStart(currentDate, displayDate, firstDayOfWeek);
        const monthEnd: Date = this.getMonthEnd(currentDate, displayDate, firstDayOfWeek, numberOfWeeks, interval);
        do {
            if (showWeekend) {
                renderDates.push(start);
            } else {
                if (this.isWorkDay(start, workDays)) {
                    renderDates.push(start);
                }
            }
            start = this.addDays(start, 1);
            if (start.getHours() > 0) {
                start = this.normalizeDate(start);
            }
        } while (start.getTime() <= monthEnd.getTime());
        return renderDates;
    }

    /**
     * Adds the specified number of days to a date
     *
     * @param {Date} date - The date to which days will be added
     * @param {number} days - The number of days to add
     * @returns {Date} A new Date object with the days added
     */
    static addDays(date: Date, days: number): Date {
        const result: Date = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Adds the specified number of months to a date
     *
     * @param {Date} date - The date to which months will be added
     * @param {number} months - The number of months to add
     * @returns {Date} A new Date object with the months added
     */
    static addMonths(date: Date, months: number): Date {
        const result: Date = new Date(date);
        const originalDay: number = result.getDate();
        result.setDate(1);
        result.setMonth(result.getMonth() + months);
        const daysInTargetMonth: number = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
        result.setDate(Math.min(originalDay, daysInTargetMonth));
        return result;
    }

    static isFullDayEvent(startTime: Date, endTime: Date): boolean {
        const startDate: Date = this.normalizeDate(startTime);
        const endDate: Date = this.normalizeDate(endTime);

        const nextDay: Date = new Date(startDate);
        nextDay.setDate(startDate.getDate() + 1);

        return this.isMidnight(startTime) && this.isMidnight(endTime) && endDate.getTime() === nextDay.getTime();
    }

    /**
     * Gets the first date of the month for the specified date
     *
     * @param {Date} date - The date from which to get the first date of the month
     * @returns {Date} A new Date object representing the first date of the month
     */
    static firstDateOfMonth(date: Date): Date {
        const result: Date = new Date(date);
        result.setDate(1);
        return result;
    }

    /**
     * Gets the last date of the month for the specified date
     *
     * @param {Date} date - The date from which to get the last date of the month
     * @returns {Date} A new Date object representing the last date of the month
     */
    static lastDateOfMonth(date: Date): Date {
        const result: Date = new Date(date);
        result.setMonth(result.getMonth() + 1);
        result.setDate(0);
        return result;
    }

    static getMonthStart(currentDate: Date, displayDate: Date, firstDayOfWeek: number): Date {
        const date: Date = displayDate ? displayDate : this.firstDateOfMonth(currentDate);
        const monthStart: Date = this.getWeekFirstDate(date, firstDayOfWeek);
        return new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate());
    }

    static getMonthEnd(
        currentDate: Date,
        displayDate: Date,
        firstDayOfWeek: number,
        numberOfWeeks: number,
        interval: number
    ): Date {
        if (displayDate || numberOfWeeks > 0) {
            const start: Date = this.getMonthStart(currentDate, displayDate, firstDayOfWeek);
            const numberOfDays: number = WEEK_LENGTH * (numberOfWeeks > 0 ?
                numberOfWeeks : DEFAULT_WEEKS);
            return this.addDays(start, (numberOfDays - 1));
        } else {
            const endDate: Date = this.addMonths(currentDate, interval - 1);
            const lastWeekOfMonth: Date =
                this.getWeekFirstDate(this.lastDateOfMonth(endDate), firstDayOfWeek);
            return this.addDays(lastWeekOfMonth, WEEK_LENGTH - 1);
        }
    }

    /**
     * Gets the number of days in the month for the specified date
     *
     * @param {number} month - The month (0-11)
     * @param {number} year - The year
     * @returns {number} The number of days in the month
     */
    static getDaysInMonth(month: number, year: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    /**
     * Gets the week number for the specified date
     *
     * @param {Date} date - The date for which to get the week number
     * @returns {number} The week number
     */
    static getWeekNumber(date: Date): number {
        const firstDayOfYear: Date = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear: number = (date.getTime() - firstDayOfYear.getTime()) / MS_PER_DAY;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    /**
     * Gets the number of days between two dates
     *
     * @param {Date} startDate - The start date
     * @param {Date} endDate - The end date
     * @param {boolean} isAllday - Denotes event is all day.
     * @returns {number} The number of days between the dates
     */
    static getDaysCount(startDate: Date, endDate: Date, isAllday?: boolean): number {
        if (this.isSameDay(startDate, endDate)) {
            return 1;
        }
        const isStartMidnight: boolean = this.isMidnight(startDate);
        const isEndMidnight: boolean = this.isMidnight(endDate);
        const start: Date = this.normalizeDate(startDate);
        const end: Date = this.normalizeDate(endDate);
        const timeInMs: number = end.getTime() - start.getTime();
        const daysDiff: number = Math.floor(timeInMs / MS_PER_DAY);
        if (isAllday) {
            return Math.max(1, daysDiff + 1);
        }
        if (isEndMidnight || (isStartMidnight && isEndMidnight)) {
            return daysDiff;
        }
        return daysDiff + 1;
    }

    /**
     * Gets the first day of the week for the specified date
     *
     * @param {Date} date - The date from which to get the first day of the week
     * @param {number} firstDayOfWeek - The first day of the week (0 for Sunday, 1 for Monday, etc.)
     * @returns {Date} A new Date object representing the first day of the week
     */
    static getWeekFirstDate(date: Date, firstDayOfWeek: number): Date {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            date = new Date();
        }
        const day: number = date.getDay();
        const diff: number = (day < firstDayOfWeek ? 7 : 0) + day - firstDayOfWeek;
        return this.addDays(date, -diff);
    }

    /**
     * Gets the last day of the week for the specified date
     *
     * @param {Date} date - The date from which to get the last day of the week
     * @param {number} firstDayOfWeek - The first day of the week (0 for Sunday, 1 for Monday, etc.)
     * @returns {Date} A new Date object representing the last day of the week
     */
    static getWeekLastDate(date: Date, firstDayOfWeek: number): Date {
        const firstDate: Date = this.getWeekFirstDate(date, firstDayOfWeek);
        return this.addDays(firstDate, 6);
    }

    /**
     * Checks if two dates are in the same month
     *
     * @param {Date} date1 - The first date
     * @param {Date} date2 - The second date
     * @returns {boolean} True if the dates are in the same month, false otherwise
     */
    static isSameMonth(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
    }

    /**
     * Checks if two dates are on the same day
     *
     * @param {Date} date1 - The first date
     * @param {Date} date2 - The second date
     * @returns {boolean} True if the dates are on the same day, false otherwise
     */
    static isSameDay(date1: Date, date2: Date): boolean {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }

    /**
     * Checks if date is on mid night
     *
     * @param {Date} date - The date
     * @returns {boolean} True if the date on mid night, false otherwise
     */
    static isMidnight(date: Date): boolean {
        if (!date || !(date instanceof Date)) { return null; }
        return (
            date.getHours() === 0 && date.getMinutes() === 0 &&
            date.getSeconds() === 0 && date.getMilliseconds() === 0
        );
    }

    static isLessthan24Hours(startTime: Date, endTime: Date): boolean {
        const duration: number = endTime.getTime() - startTime.getTime();
        return duration < MS_PER_DAY;
    }

    /**
     * Parses a time string into hours and minutes
     *
     * @param {string} timeString - The time string to parse (e.g., '09:00')
     * @returns {Object} An object with hours and minutes
     */
    static parseTimeString(timeString: string): { hours: number; minutes: number } {
        const [hours, minutes] = timeString.split(':').map(Number);
        return { hours, minutes };
    }

    /**
     * Creates a date with the specified time
     *
     * @param {Date} date - The base date
     * @param {string} timeString - The time string to set (e.g., '09:00')
     * @returns {Date} A new Date object with the specified time
     */
    static createDateWithTime(date: Date, timeString: string): Date {
        const { hours, minutes } = this.parseTimeString(timeString);
        const result: Date = new Date(date);
        result.setHours(hours, minutes, 0, 0);
        return result;
    }

    static combineDateAndTime(date?: Date, time?: Date): Date | undefined {
        if (!date && !time) { return undefined; }
        const combinedDate: Date = date ? new Date(date) : new Date();
        if (time) {
            combinedDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
        }
        return combinedDate;
    }

    /**
     * Checks if a date is a weekend
     *
     * @param {Date} date - The date to check
     * @param {number[]} workDays - The work days (0 for Sunday, 1 for Monday, etc.)
     * @returns {boolean} True if the date is a weekend, false otherwise
     */
    static isWeekend(date: Date, workDays: number[]): boolean {
        return !workDays.includes(date.getDay());
    }

    /**
     * Checks if a date is within the specified work days
     *
     * @param {Date} date - The date to check
     * @param {number[]} workDays - The work days (0 for Sunday, 1 for Monday, etc.)
     * @returns {boolean} True if the date is a work day, false otherwise
     */
    static isWorkDay(date: Date, workDays: number[]): boolean {
        return workDays.includes(date.getDay());
    }

    /**
     * Check if a date is the current date
     *
     * @param {Date} date - The date to check
     * @returns {boolean} True if it's the current date
     */
    static isToday(date: Date): boolean {
        const today: Date = new Date();
        return this.isSameDay(date, today);
    }

    /**
     * Checks if a date is within work hours
     *
     * @param {Date} date - The date to check
     * @param {WorkHoursProps} workHours - The work hours configuration
     * @param {number[]} workDays - The work days (0 for Sunday, 1 for Monday, etc.)
     * @returns {boolean} True if the date is within work hours, false otherwise
     */
    static isWorkHour(date: Date, workHours: WorkHoursProps, workDays: number[]): boolean {
        if (!workHours || !workHours.highlight) {
            return false;
        }
        if (!this.isWorkDay(date, workDays)) {
            return false;
        }
        const { hours: startWorkHours, minutes: startWorkMinutes } = this.parseTimeString(workHours.start);
        const { hours: endWorkHours, minutes: endWorkMinutes } = this.parseTimeString(workHours.end);
        const hours: number = date.getHours();
        const minutes: number = date.getMinutes();
        const dateMinutes: number = hours * MINUTES_PER_HOUR + minutes;
        const startWorkMinutesTotal: number = startWorkHours * MINUTES_PER_HOUR + startWorkMinutes;
        const endWorkMinutesTotal: number = endWorkHours * MINUTES_PER_HOUR + endWorkMinutes;
        return dateMinutes >= startWorkMinutesTotal && dateMinutes < endWorkMinutesTotal;
    }

    /**
     * Gets a date object for a time string, handling special cases
     *
     * @param {string} timeString - The time string (e.g., '09:00', '24:00')
     * @returns {Date} A date object with the correct time set
     */
    static getStartEndHours(timeString: string): Date {
        const [hourStr, minuteStr] = timeString.split(':');
        const hour: number = parseInt(hourStr, 10);
        const minute: number = parseInt(minuteStr, 10);
        const date: Date = new Date();
        if (hour === 0 && minute === 0) {
            date.setHours(0, 0, 0, 0);
        } else if (hour === 24 && minute === 0) {
            // Set to midnight of the next day
            date.setDate(date.getDate() + 1);
            date.setHours(0, 0, 0, 0);
        } else {
            date.setHours(hour, minute, 0, 0);
        }
        return date;
    }

    static getSchedulerStartAndEndMinutes(startHour: string, endHour: string):
    { schedulerStartMinutes: number; schedulerEndMinutes: number } {
        const startHourDate: Date = this.getStartEndHours(startHour);
        const endHourDate: Date = this.getStartEndHours(endHour);
        const schedulerStartMinutes: number = startHour === '00:00' ? 0 :
            startHourDate.getHours() * MINUTES_PER_HOUR + startHourDate.getMinutes();
        const schedulerEndMinutes: number = endHour === '24:00' ? MINUTES_PER_DAY :
            endHourDate.getHours() * MINUTES_PER_HOUR + endHourDate.getMinutes();

        return { schedulerStartMinutes, schedulerEndMinutes};
    }

    /**
     * Normalizes a date by removing time components
     *
     * @param {Date} date - The date to normalize
     * @returns {Date} A new date with time component set to midnight
     */
    static normalizeDate(date: Date): Date {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            return null;
        }
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    /**
     * Reassign a time from required time components
     *
     * @param {Date} newTime - The time to set hours
     * @param {Date} setTimeFrom - The time to get hours
     * @returns {void}
     */
    static setHours(newTime: Date, setTimeFrom: Date): void {
        if (!newTime || !(newTime instanceof Date) || !setTimeFrom || !(setTimeFrom instanceof Date)) {
            return null;
        }
        newTime.setHours(
            setTimeFrom.getHours(),
            setTimeFrom.getMinutes(),
            setTimeFrom.getSeconds(),
            setTimeFrom.getMilliseconds()
        );
    }

    /**
     * Reassign a year from required year components
     *
     * @param {Date} newYear - The time to set year
     * @param {Date} setYearFrom - The time to get year
     * @returns {void}
     */
    static setYear(newYear: Date, setYearFrom: Date): void {
        if (!newYear || !(newYear instanceof Date) || !setYearFrom || !(setYearFrom instanceof Date)) {
            return null;
        }
        newYear.setFullYear(setYearFrom.getFullYear(), setYearFrom.getMonth(), setYearFrom.getDate());
    }

    /**
     * Method to get date object from date string
     *
     * @param {string} date Accepts the date string
     * @returns {Date} Returns the date object
     */
    static getDateFromString(date: string): Date {
        return date.indexOf('Date') !== -1 ? new Date(parseInt(date.match(/\d+/g).toString(), 10)) :
            date.indexOf('T') !== -1 ? new Date(date) : new Date(date.replace(/-/g, '/'));
    }

    /**
     * Formats the start date of a date range based on context
     *
     * @param {string} locale - The locale to use for formatting
     * @param {Date} date - The date to format
     * @param {Date} endDate - The end date (for context)
     * @param {string} format - Base format type ('d' for day-first, 'm' for month-first)
     * @param {string} mode - Calendar mode
     * @returns {string} Formatted start date string
     */
    static formatRangeStart(locale: string, date: Date, endDate: Date, format: string, mode: string = 'gregorian'): string {
        if (date.getFullYear() === endDate.getFullYear() && date.getMonth() === endDate.getMonth()) {
            if (format === 'd') {
                return formatDate(date, { format: 'dd', calendar: mode, locale: locale });
            } else {
                return formatDate(date, { format: 'MMMM dd', calendar: mode, locale: locale });
            }
        }

        if (date.getFullYear() === endDate.getFullYear()) {
            if (format === 'd') {
                return formatDate(date, { format: 'dd MMM', calendar: mode, locale: locale });
            } else {
                return formatDate(date, { format: 'MMM dd', calendar: mode, locale: locale });
            }
        }

        if (format === 'd') {
            return formatDate(date, { format: 'dd MMM yyyy', calendar: mode, locale: locale });
        } else {
            return formatDate(date, { format: 'MMM dd, yyyy', calendar: mode, locale: locale });
        }
    }

    /**
     * Formats the end date of a date range based on context
     *
     * @param {string} locale - The locale to use for formatting
     * @param {Date} date - The date to format
     * @param {Date} startDate - The start date (for context)
     * @param {string} format - Base format type ('d' for day-first, 'm' for month-first)
     * @param {string} mode - Calendar mode
     * @returns {string} Formatted end date string
     */
    static formatRangeEnd(locale: string, date: Date, startDate: Date, format: string, mode: string = 'gregorian'): string {
        if (date.getFullYear() === startDate.getFullYear() && date.getMonth() === startDate.getMonth()) {
            if (format === 'd') {
                return formatDate(date, { format: 'dd MMMM yyyy', calendar: mode, locale: locale });
            } else {
                return formatDate(date, { format: 'dd, yyyy', calendar: mode, locale: locale });
            }
        }

        if (format === 'd') {
            return formatDate(date, { format: 'dd MMM yyyy', calendar: mode, locale: locale });
        } else {
            return formatDate(date, { format: 'MMM dd, yyyy', calendar: mode, locale: locale });
        }
    }

    /**
     * Sorts events by start time ascending, then by duration descending when start times are equal.
     *
     * @param {EventModel[]} events - Array of events to sort; each should include a startTime and may include an endTime.
     * @returns {EventModel[]} The sorted array reference, ordered by start time (ASC) then duration (DESC).
     */
    static sortByTimeAndSpan: (events: EventModel[]) => EventModel[] = (events: EventModel[]): EventModel[] => {
        return events.sort((a: EventModel, b: EventModel) => {
            if (!a.startTime || !b.startTime) {
                return 0;
            }
            const startDiff: number = a.startTime.getTime() - b.startTime.getTime();
            if (startDiff !== 0) {
                return startDiff;
            }
            // For events with same start time, calculate duration in milliseconds
            const aEndTime: number = a.endTime ? a.endTime.getTime() : a.startTime.getTime();
            const bEndTime: number = b.endTime ? b.endTime.getTime() : b.startTime.getTime();
            const aDuration: number = aEndTime - a.startTime.getTime();
            const bDuration: number = bEndTime - b.startTime.getTime();
            // Sort by duration in descending order (longest first)
            return bDuration - aDuration;
        });
    };

    static formatTimeDisplay(event: EventModel, locale: string, timeFormat: string): string {
        if (!event.startTime || !event.endTime) {
            return '';
        }

        const startTimeDisplay: string = formatDate(event.startTime, {
            type: 'time',
            skeleton: 'short',
            format: timeFormat,
            locale: locale
        });

        const endTimeDisplay: string = formatDate(event.endTime, {
            type: 'time',
            skeleton: 'short',
            format: timeFormat,
            locale: locale
        });

        return `${startTimeDisplay} - ${endTimeDisplay}`;
    }

    /**
     * Capitalizes the first word of a string based on the specified type
     *
     * @param {string} inputString - The string to capitalize
     * @param {'single' | 'multiple'} type - The type of capitalization ('single' or 'multiple')
     * @returns {string} The capitalized string
     */
    static capitalizeFirstWord(inputString: string, type: 'single' | 'multiple'): string {
        if (!inputString) {
            return inputString;
        }

        if (type === 'multiple') {
            return inputString.split(' ').map((word: string) =>
                word.charAt(0).toLocaleUpperCase() + word.substring(1)
            ).join(' ');
        } else if (type === 'single') {
            let result: string = inputString;

            if (result[0] >= '0' && result[0] <= '9') {
                const letterMatch: RegExpMatchArray | null = result.match(/[a-zA-Z]/);
                if (letterMatch && letterMatch.index !== undefined) {
                    result = result.slice(0, letterMatch.index) +
                        result[letterMatch.index].toLocaleUpperCase() +
                        result.slice(letterMatch.index + 1);
                }
            }

            result = result[0].toLocaleUpperCase() + result.slice(1);
            return result;
        }

        return inputString;
    }

    /**
     * Method that formats a date range as a string
     *
     * @param {string} locale The locale to use for formatting
     * @param {Date} startDate The start date
     * @param {Date} endDate The end date
     * @param {string} customDateFormat Optional custom date format
     * @returns {string} Returns the formatted date range
     */
    static formatDateRange(
        locale: string,
        startDate: Date,
        endDate?: Date,
        customDateFormat?: string
    ): string {
        const mode: string = 'gregorian';

        if (endDate && this.isSameDay(startDate, endDate)) {
            endDate = undefined;
        }

        if (customDateFormat) {
            let text: string = '';
            if (!endDate) {
                text = formatDate(startDate, { format: customDateFormat, calendar: mode, locale: locale });
                return this.capitalizeFirstWord(text, 'multiple');
            }
            text = (formatDate(startDate, { format: customDateFormat, calendar: mode, locale: locale }) +
                ' - ' + formatDate(endDate, { format: customDateFormat, calendar: mode, locale: locale }));
            return this.capitalizeFirstWord(text, 'multiple');
        }

        let longDateFormat: string;

        if (!locale || locale === 'en' || locale === 'en-US') {
            longDateFormat = getValue('dateFormats.long', getDefaultDateObject(mode));
        } else {
            longDateFormat = getValue(`main.${locale}.dates.calendars.${mode}.dateFormats.long`, cldrData);
        }

        if (!endDate) {
            return this.capitalizeFirstWord(
                formatDate(startDate, { format: longDateFormat, calendar: mode, locale: locale }),
                'single'
            );
        }

        const dateFormat: string = longDateFormat.trim().toLocaleLowerCase();
        const formatType: string = dateFormat.substring(0, 1) === 'd' ? 'd' : 'm';

        const formattedStr: string = this.formatRangeStart(locale, startDate, endDate, formatType, mode) + ' - ' +
            this.formatRangeEnd(locale, endDate, startDate, formatType, mode);

        return this.capitalizeFirstWord(formattedStr, 'multiple');
    }

    static setValidDate(date: Date | number): Date {
        return typeof date === 'number' ? new Date(date) : date;
    }

    static setValidFirstDayOfWeek(viewFirstDayOfWeek?: number, rootFirstDayOfWeek?: number): number {
        const firstDayOfWeek: number = viewFirstDayOfWeek ?? rootFirstDayOfWeek;
        const isValidDay: boolean = typeof firstDayOfWeek === 'number' && firstDayOfWeek >= 0 && firstDayOfWeek <= 6;
        return isValidDay ? firstDayOfWeek : 0;
    }

    static getMonthRangeText(
        selectedDate: Date,
        interval: number,
        displayDate: Date,
        numberOfWeeks: number,
        dateFormat: string,
        renderDates: Date[],
        locale: string
    ): string {
        displayDate = this.setValidDate(displayDate);
        const modeOfCalendar: string = 'gregorian';
        if (!dateFormat) {
            selectedDate = renderDates && renderDates.length > WEEK_LENGTH - 1
                ? renderDates[WEEK_LENGTH - 1] : selectedDate;
            let endDate: Date;
            let updateCustomRange: boolean = false;

            if (displayDate || numberOfWeeks > 0) {
                updateCustomRange = renderDates[0].getMonth() !== renderDates[renderDates.length - 1].getMonth() ||
                    renderDates[0].getFullYear() !== renderDates[renderDates.length - 1].getFullYear();
                if (updateCustomRange) {
                    selectedDate = renderDates[0];
                    endDate = renderDates[renderDates.length - 1];
                }
            }

            if (interval > 1 && !(displayDate || numberOfWeeks > 0) || updateCustomRange) {
                endDate = endDate ? endDate : this.addMonths(this.lastDateOfMonth(selectedDate), interval - 1);
                if (selectedDate.getFullYear() === endDate.getFullYear()) {
                    const monthNames: string = (formatDate(
                        selectedDate, { format: 'MMMM', calendar: modeOfCalendar })) + ' - ' +
                        (formatDate(endDate, { format: 'MMMM ', calendar: modeOfCalendar })) +
                        formatDate(endDate, { skeleton: 'y', calendar: modeOfCalendar });
                    return this.capitalizeFirstWord(monthNames, 'single');
                }
                const text: string = (formatDate(
                    selectedDate, { format: 'MMMM', calendar: modeOfCalendar })) + ' ' +
                    selectedDate.getFullYear() + ' - ' +
                    formatDate(endDate, { format: 'MMMM ', calendar: modeOfCalendar }) +
                    formatDate(endDate, { skeleton: 'y', calendar: modeOfCalendar });
                return this.capitalizeFirstWord(text, 'single');
            }
            const format: string = (dateFormat) ? dateFormat : 'MMMM y';
            return this.capitalizeFirstWord(
                formatDate(selectedDate, { format: format, calendar: modeOfCalendar, locale: locale }), 'single');
        }
        return this.formatDateRange(locale, renderDates?.length > 0 ? renderDates[0] : selectedDate);
    }

    /**
     * Generates a human-readable string for the date range with time display.
     *
     * @param {EventModel} eventData Start date and time
     * @param {string} locale Locale string for formatting
     * @returns {string} Formatted date range string
     */
    static formatPopupDateRange(eventData: EventModel, locale: string): string {
        const resolvedLocale: string = locale || 'en-US';
        const { getString } = useSchedulerLocalization(resolvedLocale);

        const start: Date = eventData.startTime;
        const end: Date = eventData.endTime;
        const isAllDay: boolean = !!eventData.isAllDay;

        const startDateDetails: string = formatDate(start, { type: 'date', skeleton: 'long', locale: resolvedLocale });

        const endDateDetails: string = formatDate(end, { type: 'date', skeleton: 'long', locale: resolvedLocale });

        const startTimeStr: string = formatDate(start, { type: 'time', skeleton: 'short', locale: resolvedLocale });
        const endTimeStr: string = formatDate(end, { type: 'time', skeleton: 'short', locale: resolvedLocale });

        const isMultiDay: boolean = this.getDaysCount(start, end, isAllDay) > 1;

        if (isAllDay) {
            return isMultiDay
                ? `${startDateDetails} (${getString('allDay')}) - ${endDateDetails} (${getString('allDay')})`
                : `${startDateDetails} (${getString('allDay')})`;
        }

        return isMultiDay
            ? `${startDateDetails} (${startTimeStr}) - ${endDateDetails} (${endTimeStr})`
            : `${startDateDetails} (${startTimeStr} - ${endTimeStr})`;
    }

    /**
     * Gets localized month names from CLDR data
     *
     * @param {string} locale The locale string
     * @returns {string[]} Array of localized month names
     */
    static getMonthNames(locale: string): string[] {
        const monthNames: string[] = [];
        const mode: string = 'gregorian';
        let cldrObj: string[];
        if (!locale || locale === 'en' || locale === 'en-US') {
            cldrObj = getValue('months.stand-alone.wide', getDefaultDateObject(mode));
        } else {
            const nameSpace: string = `main.${locale}.dates.calendars.${mode}.months.format.wide`;
            cldrObj = getValue(nameSpace, cldrData);
        }
        for (const obj of Object.keys(cldrObj)) {
            monthNames.push(getValue(obj, cldrObj));
        }
        return monthNames;
    }
    /**
     * Format date range for cell popup as shown in the design
     *
     * @param {Date} startDate Start date and time
     * @param {Date} endDate End date and time
     * @param {string} locale Locale string for formatting
     * @returns {string} Formatted date range string for cell popup (e.g., "July 14, 2025 (9:30 AM - 10:00 AM)")
     */
    static formatCellDateRange(
        startDate: Date,
        endDate: Date,
        locale: string
    ): string {
        const monthNames: string[] = this.getMonthNames(locale);
        const month: string = monthNames[startDate.getMonth()];
        const day: number = startDate.getDate();
        const year: number = startDate.getFullYear();
        const startTime: string = formatDate(startDate, { type: 'time', skeleton: 'short', locale: locale });
        const endTime: string = formatDate(endDate, { type: 'time', skeleton: 'short', locale: locale });
        return `${month} ${day}, ${year} (${startTime} - ${endTime})`;
    }

    static getVisibleAndStartDays(renderDates: Date[], eventStartDay: Date, eventEndDay: Date, originalEvent: EventModel):
    { visibleDayCount: number, startDayIndex: number } {

        let visibleDayCount: number = 0;
        let startDayIndex: number = -1;
        // If all-day, include the end day even if the end time is midnight
        const includeEndMidnight: boolean = originalEvent.isAllDay ? true : !this.isMidnight(originalEvent.endTime);
        // Find how many days of this event are visible in this week
        for (let i: number = 0; i < renderDates.length; i++) {
            const currentDate: Date = this.normalizeDate(renderDates[i >= 0 && i < renderDates.length ? i : 0]);
            // If this date is between event start and end
            const shouldIncludeDate: boolean = currentDate >= eventStartDay && (currentDate < eventEndDay ||
                (currentDate.getTime() === eventEndDay.getTime() && includeEndMidnight)
            );
            if (shouldIncludeDate) {
                visibleDayCount++;
                if (startDayIndex === -1) {
                    startDayIndex = i;
                }
            }
        }
        return { visibleDayCount, startDayIndex };
    }
}
