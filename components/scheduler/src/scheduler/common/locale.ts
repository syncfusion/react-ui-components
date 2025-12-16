import { IL10n, L10n } from '@syncfusion/react-base';

/**
 * Default locale strings for Scheduler component
 *
 * @typedef {Record<string, string>} DefaultLocaleStrings
 */
export const DEFAULT_LOCALE_STRINGS: Record<string, string> = {
    addTitle: 'Add title',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    moreDetails: 'More details',
    close: 'Close',
    newEvent: 'New event',
    today: 'Today',
    allDay: 'All day',
    day: 'Day',
    week: 'Week',
    workweek: 'WorkWeek',
    month: 'Month',
    more: 'more',
    expandAllDaySection: 'Expand all-day section',
    collapseAllDaySection: 'Collapse all-day section',
    deleteEvent: 'Delete Event',
    confirmDeleteMessage: 'Are you sure you want to delete this event?',
    cancel: 'Cancel',
    title: 'Title',
    location: 'Location',
    description: 'Description',
    startDate: 'Start date',
    endDate: 'End date',
    startTime: 'Start time',
    endTime: 'End time',
    eventOverlap: 'Event Overlap',
    overlapAlert: 'Events cannot be scheduled during the chosen time as it overlaps with another event.',
    blockAlert: 'Events cannot be scheduled within the blocked time range.',
    ok: 'OK',
    alert: 'Alert',
    invalidDateValue: 'The entered date value is invalid.',
    invalidTimeValue: 'The entered time value is invalid.',
    invalidDateRange: 'The selected end date occurs before the start date.'
};

/**
 * Hook for using Scheduler localization
 *
 * @param {string} [locale='en-US'] - The current locale
 * @param {Record<string, string>} [customStrings={}] - Optional custom locale strings
 * @returns {object} Returns an object containing the localization instance and getString helper
 * @private
 */
export const useSchedulerLocalization: (locale?: string, customStrings?: Record<string, string>) => {
    l10nInstance: IL10n; getString: (key: string) => string
} =
    (locale: string, customStrings: Record<string, string> = {}) => {
        const localeStrings: Record<string, string> = {
            ...DEFAULT_LOCALE_STRINGS,
            ...customStrings
        };
        const l10nInstance: IL10n = L10n('scheduler', localeStrings, locale);

        const getString: (key: string) => string = (
            key: string
        ): string => {
            return l10nInstance.getConstant(key);
        };

        return {
            l10nInstance,
            getString
        };
    };

