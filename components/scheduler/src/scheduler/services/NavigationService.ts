import { DateService } from './DateService';
import { View } from '../types/enums';

/** @private */
export interface NavigationOptions {
    currentDate: Date;
    viewType: View;
    interval: number;
    showWeekend?: boolean;
    workDays?: number[];
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
        const { currentDate, viewType, interval, showWeekend, workDays } = options;

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
            return DateService.addMonths(currentDate, direction * interval);

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
     * Navigate to today's date
     *
     * @returns {Date} Today's date
     */
    static navigateToToday(): Date {
        return new Date();
    }
}
