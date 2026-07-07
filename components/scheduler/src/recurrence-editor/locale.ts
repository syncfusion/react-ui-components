import { IL10n, L10n } from '@syncfusion/react-base';

/**
 * Default locale strings for Recurrence Editor component
 *
 * @typedef {Record<string, string>} DefaultLocaleStrings
 */
export const DEFAULT_LOCALE_STRINGS: Record<string, string> = {
    day: 'Day',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    repeat: 'Repeat',
    repeatEvery: 'Repeat every',
    repeatedMode: 'Mode',
    end: 'End',
    repeatOn: 'Repeat on',
    repeatMode: 'Repeat Mode',
    first: 'First',
    second: 'Second',
    third: 'Third',
    fourth: 'Fourth',
    last: 'Last',
    never: 'Never',
    until: 'Until',
    count: 'Count',
    every: 'Every',
    days: 'Days',
    weeks: 'Weeks',
    months: 'Months',
    years: 'Years',
    summaryDay: 'day(s)',
    summaryWeek: 'week(s)',
    summaryMonth: 'month(s)',
    summaryYear: 'year(s)',
    summaryOn: 'on',
    summaryUntil: 'until',
    summaryTimes: 'time(s)',
    intervalAriaLabel: 'Number of repeats',
    frequencyAriaLabel: 'Select repeat frequency',
    byMonthAriaLabel: 'Select month of the year',
    byMonthDayAriaLabel: 'Repeat on the day of month',
    byDayAriaLabel: 'Repeat on a specific weekday of the month',
    bySetPositionAriaLabel: 'Select week position in month',
    endTypeAriaLabel: 'Select recurrence end type',
    countAriaLabel: 'Number of occurrences',
    untilAriaLabel: 'Choose recurrence until date',
    untilEarlierThanStart: 'Until date cannot be earlier than the start date',
    ok: 'OK',
    alert: 'Alert'
};

/**
 * Hook for using Recurrence Editor localization
 *
 * @param {string} [locale='en-US'] - The current locale
 * @param {Record<string, string>} [customStrings={}] - Optional custom locale strings
 * @returns {object} Returns an object containing the localization instance and getString helper
 * @private
 */
export const useRecurrenceEditorLocalization: (
    locale?: string,
    customStrings?: Record<string, string>,
) => {
    l10nInstance: IL10n;
    getString: (key: string) => string;
} = (locale: string, customStrings: Record<string, string> = {}) => {
    const localeStrings: Record<string, string> = {
        ...DEFAULT_LOCALE_STRINGS,
        ...customStrings
    };
    const l10nInstance: IL10n = L10n('recurrenceEditor', localeStrings, locale);

    const getString: (key: string) => string = (key: string): string => {
        return l10nInstance.getConstant(key);
    };

    return {
        l10nInstance,
        getString
    };
};
