import { DateService, DEFAULT_WEEKS, WEEK_LENGTH } from './DateService';
import { Timezone } from './Timezone';
import { View } from '../types/enums';

/** @private */
export interface NavigationOptions {
    currentDate: Date;
    viewType: View;
    interval: number;
    showWeekend?: boolean;
    workDays?: number[];
    agendaDaysCount?: number;
    numberOfWeeks?: number;
    firstDayOfWeek?: number;
    displayDate?: Date;
    renderDates?: Date[];
}

/**
 * Service for handling scheduler navigation operations
 *
 * @private
 */
export class NavigationService {

    /**
     * Move forward or backward a number of workdays from a given date.
     *
     * @param {Date} currentDate The starting date.
     * @param {number} interval The number of workdays to move.
     * @param {1 | -1} direction The direction to move (1 for next, -1 for previous).
     * @param {number[]} [workDays] Optional list of workday indices (0-6).
     * @returns {Date} The resulting date after moving the specified number of workdays.
     * @private
     */
    static addWorkDays(currentDate: Date, interval: number, direction: 1 | -1, workDays?: number[]): Date {
        if (interval <= 0) {
            return new Date(currentDate);
        }
        let date: Date = new Date(currentDate);
        let moved: number = 0;

        while (moved < interval) {
            const next: Date = DateService.addDays(date, direction);
            if (DateService.isWorkDay(next, workDays)) {
                moved += 1;
            }
            date = next;
        }
        return date;
    }

    /**
     * Navigate to a new date based on the given options and direction.
     *
     * @param {1 | -1} direction The direction to navigate (1 for next, -1 for previous).
     * @param {NavigationOptions} options Navigation options including currentDate, viewType, interval, etc.
     * @returns {Date} The computed date after applying the navigation rules.
     * @private
     */
    static navigate(direction: 1 | -1, options: NavigationOptions): Date {
        const { currentDate, viewType, interval, showWeekend, workDays, agendaDaysCount, numberOfWeeks, firstDayOfWeek, renderDates,
            displayDate } = options;

        switch (viewType) {
        case 'Day':
            if (showWeekend === false) {
                return this.addWorkDays(currentDate, interval, direction, workDays);
            }
            return DateService.addDays(currentDate, direction * interval);

        case 'Week':
        case 'WorkWeek':
            return DateService.addDays(currentDate, direction * 7 * interval);

        case 'Month':
            if (displayDate || numberOfWeeks > 0) {
                const viewDate: Date = direction === 1 ? renderDates[renderDates.length - 1] : renderDates[0];
                const weekStart: Date = DateService.getWeekFirstDate(viewDate, firstDayOfWeek);
                const numberOfDays: number = direction === 1 ? WEEK_LENGTH : direction * (numberOfWeeks || DEFAULT_WEEKS) * WEEK_LENGTH;
                return DateService.addDays(weekStart, numberOfDays);
            }
            return DateService.addMonths(currentDate, direction * interval);

        case 'Agenda':
            return DateService.addDays(currentDate, direction * (agendaDaysCount || 7) * interval);

        default:
            return DateService.addDays(currentDate, direction);
        }
    }

    /**
     * Navigate to the previous time period based on view type and interval.
     *
     * @param {NavigationOptions} options Navigation options including currentDate, viewType, interval, etc.
     * @returns {Date} The new date after navigating backward.
     */
    static navigateToPrevious(options: NavigationOptions): Date {
        return this.navigate(-1, options);
    }

    /**
     * Navigate to the next time period based on view type and interval.
     *
     * @param {NavigationOptions} options Navigation options including currentDate, viewType, interval, etc.
     * @returns {Date} The new date after navigating forward.
     */
    static navigateToNext(options: NavigationOptions): Date {
        return this.navigate(1, options);
    }

    /**
     * Navigate to today's date in the specified timezone.
     *
     * @param {string} timezone - The timezone to compute today's date in (IANA name)
     * @returns {Date} Today's date in the specified timezone
     */
    static navigateToToday(timezone?: string): Date {
        if (!timezone) {
            return new Date();
        }
        const now: Date = new Date();
        const convertedDate: Date = Timezone.add(now, timezone);
        const today: Date = DateService.normalizeDate(convertedDate);
        return today;
    }
}
