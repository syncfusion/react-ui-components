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
    editEvent: 'Edit event',
    today: 'Today',
    previous: 'previous',
    next: 'next',
    allDay: 'All day',
    day: 'Day',
    week: 'Week',
    workweek: 'Work week',
    month: 'Month',
    agenda: 'Agenda',
    more: 'more',
    expandAllDaySection: 'Expand all-day section',
    collapseAllDaySection: 'Collapse all-day section',
    deleteEvent: 'Delete Event',
    confirmDeleteMessage: 'Are you sure you want to delete this event?',
    cancel: 'Cancel',
    title: 'Title',
    subject: 'Subject',
    location: 'Location',
    description: 'Description',
    startDate: 'Start date',
    endDate: 'End date',
    startTime: 'Start time',
    endTime: 'End time',
    startTimezone: 'Start timezone',
    endTimezone: 'End timezone',
    searchTimezone: 'Search timezone',
    timezone: 'Timezone',
    eventOverlap: 'Event Overlap',
    overlapAlert: 'Events cannot be scheduled during the chosen time as it overlaps with another event.',
    blockAlert: 'Events cannot be scheduled within the blocked time range.',
    ok: 'OK',
    alert: 'Alert',
    invalidDateValue: 'The entered date value is invalid.',
    invalidTimeValue: 'The entered time value is invalid.',
    invalidDateRange: 'The selected end date occurs before the start date.',
    repeat: 'Repeat',
    never: 'Never',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom',
    customRecurrence: 'Custom recurrence',
    seriesChangeAlert: 'Do you want to cancel the changes made to specific ' +
        'instances of this series and match it to the whole series again?',
    createError: 'The duration of the event must be shorter than how frequently it occurs. ' +
        'Shorten the duration, or change the recurrence pattern in the recurrence event editor.',
    sameDayAlert: 'Two occurrences of the same event cannot occur on the same day.',
    occurenceAlert: 'Cannot reschedule an occurrence of the recurring appointment if it skips over ' +
        'a later occurrence of the same appointment.',
    editEventContent: 'How would you like to change the appointment in the series?',
    editThisEvent: 'Edit Event',
    editEntireSeries: 'Entire Series',
    yes: 'Yes',
    no: 'No',
    followingEvents: 'Following Events',
    eventsFor: 'Events for',
    noEvents: 'No events'
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

