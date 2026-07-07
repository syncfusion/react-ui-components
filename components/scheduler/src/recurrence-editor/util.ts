import { DayFormatType, DropdownData, FreqType, RecurrenceItems, RecurrenceState } from './types';
import { cldrData, getDefaultDateObject, getValue } from '@syncfusion/react-base';
import { DateService, WEEK_LENGTH } from '../scheduler/services/DateService';
import { getDateFromRecurrenceDateString } from './date-generator';


const WEEKDAY_CODES: readonly string[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * Generates a default iCalendar recurrence rule (RFC 5545) string for a given frequency and reference date.
 *
 * @param {FreqType} freq - Recurrence frequency.
 * @param {Date} date - Reference `Date` used to derive day/month parts. If falsy or invalid, the current date is used.
 * @returns {string} A recurrence rule string (for example: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;').
 */
export function getDefaultRule(freq: FreqType, date: Date): string {
    if (!date || isNaN(date.getTime())) {
        date = new Date();
    }

    switch (freq) {
    case 'DAILY':
        return 'FREQ=DAILY;INTERVAL=1;';
    case 'WEEKLY': {
        const dayCode: string = getByDayFromDate(date);
        return `FREQ=WEEKLY;INTERVAL=1;BYDAY=${dayCode};`;
    }
    case 'MONTHLY': {
        const monthDay: number = date.getDate();
        return `FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=${monthDay};`;
    }
    case 'YEARLY': {
        const month: number = date.getMonth() + 1;
        const monthDay: number = date.getDate();
        return `FREQ=YEARLY;INTERVAL=1;BYMONTH=${month};BYMONTHDAY=${monthDay};`;
    }
    default:
        return `FREQ=${freq};INTERVAL=1;`;
    }
}

/**
 * Gets the two-letter weekday code for a given date.
 *
 * @param {Date} date The input Date object to extract the weekday from.
 * @returns {Date} The corresponding two-letter weekday code from WEEKDAY_CODES (e.g. 'MO', 'TU'). Defaults to 'SU' if index is out of range.
 */
export function getByDayFromDate(date: Date): string {
    const index: number = date.getDay();
    return WEEKDAY_CODES[`${index}`] ?? 'SU';
}

/**
 * Calculates the set position (week index) of the provided date within its month
 * for recurrence rule generation. If the date falls into the final overflow week
 * of the month, this method returns -1 to indicate the "last" week.
 *
 * @param {Date} date The date to evaluate.
 * @returns {number} The 1-based week index within the month, or -1 to indicate the last week.
 */
export function getBySetPosFromDate(date: Date): number {
    const day: number = date.getDate();
    const idx: number = Math.ceil(day / WEEK_LENGTH);
    const lastDay: number = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    ).getDate();
    return day + WEEK_LENGTH > lastDay ? -1 : idx;
}

export const getMonthData: (locale: string, calendarMode: string) => DropdownData[] = (
    locale: string,
    calendarMode: string
): DropdownData[] => {
    const monthData: DropdownData[] = [];
    let cldrObj: Record<string, unknown> | undefined;

    if (locale === 'en' || locale === 'en-US') {
        const nameSpaceString: string = 'months.stand-alone.wide';
        cldrObj = getValue(nameSpaceString, getDefaultDateObject(calendarMode)) as Record<string, unknown>;
    } else {
        const nameSpaceString: string =
            'main.' + locale + '.dates.calendars.' + calendarMode + '.months.stand-alone.wide';
        cldrObj = getValue(nameSpaceString, cldrData) as Record<string, unknown>;
    }

    if (cldrObj) {
        for (const obj of Object.keys(cldrObj)) {
            if (Object.prototype.hasOwnProperty.call(cldrObj, obj)) {
                const monthName: string = String(getValue(obj, cldrObj));
                monthData.push({
                    text: DateService.capitalizeFirstWord(monthName, 'single'),
                    value: parseInt(obj, 10)
                });
            }
        }
    }

    return monthData;
};

export const getDayData: (
    locale: string,
    calendarMode: string,
    firstDayOfWeek: number,
    format: DayFormatType
) => RecurrenceItems[] = (
    locale: string,
    calendarMode: string,
    firstDayOfWeek: number,
    format: DayFormatType
): RecurrenceItems[] => {
    const weekday: string[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayData: RecurrenceItems[] = [];
    const safeCount: number = Math.max(0, firstDayOfWeek | 0);
    for (let index: number = 0; index < safeCount; index++) {
        const tempVal: string | undefined = weekday.shift();
        if (typeof tempVal !== 'undefined') {
            weekday.push(tempVal);
        }
    }

    let cldrObj: Record<string, unknown> | undefined;
    if (locale === 'en' || locale === 'en-US') {
        const nameSpaceString: string = 'days.stand-alone.' + format;
        cldrObj = getValue(nameSpaceString, getDefaultDateObject(calendarMode)) as Record<string, unknown>;
    } else {
        const nameSpaceString: string =
            'main.' + locale + '.dates.calendars.' + calendarMode + '.days.stand-alone.' + format;
        cldrObj = getValue(nameSpaceString, cldrData) as Record<string, unknown>;
    }

    for (const obj of weekday) {
        if (cldrObj && Object.prototype.hasOwnProperty.call(cldrObj, obj)) {
            const day: string = String(getValue(obj, cldrObj as Record<string, unknown>));

            let value: string;
            switch (obj) {
            case 'sun':
                value = 'SU';
                break;
            case 'mon':
                value = 'MO';
                break;
            case 'tue':
                value = 'TU';
                break;
            case 'wed':
                value = 'WE';
                break;
            case 'thu':
                value = 'TH';
                break;
            case 'fri':
                value = 'FR';
                break;
            case 'sat':
                value = 'SA';
                break;
            default:
                value = 'SU';
                break;
            }

            dayData.push({
                text: format === 'narrow' ? day : DateService.capitalizeFirstWord(day, 'single'),
                value
            });
        }
    }

    return dayData;
};

/**
 * Get the recurrence states from rule
 *
 * @param {string} rule - Recurrence rule string
 * @param {RecurrenceState} state - Initial recurrence states
 * @returns {RecurrenceState} processed recurrence rule states
 */
export function getRecurrenceStateFromRule(rule: string, state: RecurrenceState): RecurrenceState {
    const rulesList: string[] = rule.split(';');
    let splitData: string[] = [];
    let temp: string;
    state.endType = 'Never';
    state.dayWeekMode = 'day';
    rulesList.forEach((data: string) => {
        splitData = data.split('=');
        switch (splitData[0]) {
        case 'UNTIL':
            temp = splitData[1];
            state.until = getDateFromRecurrenceDateString(temp);
            state.endType = 'Until';
            break;
        case 'BYDAY':
            state.weekDays = splitData[1].split(',');
            state.weekDay = state.weekDays && state.weekDays[0];
            state.dayWeekMode = 'week';
            break;
        case 'BYMONTHDAY':
            state.monthDate = splitData[1].split(',').map(Number)[0];
            state.dayWeekMode = 'day';
            break;
        case 'BYMONTH':
            state.month = splitData[1].split(',').map(Number)[0];
            break;
        case 'INTERVAL':
            state.interval = parseInt(splitData[1], 10);
            break;
        case 'COUNT':
            state.count = parseInt(splitData[1], 10);
            state.endType = 'Count';
            break;
        case 'BYSETPOS':
            state.weekNumber = parseInt(splitData[1], 10) > 4 ? -1 : parseInt(splitData[1], 10);
            state.dayWeekMode = 'week';
            break;
        case 'FREQ':
            state.freq = <FreqType>splitData[1];
            break;
        }
    });
    return state;
}

/**
 * Method to generate string from date
 *
 * @param {Date} date Accepts the date value
 * @returns {string} Returns the string value
 */
export function getRecurrenceStringFromDate(date: Date): string {
    return [date.getUTCFullYear(),
        roundDateValues(date.getUTCMonth() + 1),
        roundDateValues(date.getUTCDate()),
        'T',
        roundDateValues(date.getUTCHours()),
        roundDateValues(date.getUTCMinutes()),
        roundDateValues(date.getUTCSeconds()),
        'Z'].join('');
}

/**
 * Internal method to round the date values
 *
 * @param {string | number} date Accepts the date value in either string or number format
 * @returns {string} Returns the date value in string format
 * @private
 */
function roundDateValues(date: string | number): string {
    return ('0' + date).slice(-2);
}
