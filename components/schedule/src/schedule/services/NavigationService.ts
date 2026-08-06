import { DateService } from './DateService';
import { View } from '../types/enums';

/**
 * Service for handling schedule navigation operations
 */
export class NavigationService {
    /**
     * Navigate to the previous time period based on view type and interval
     *
     * @param {Date} currentDate - The current selected date
     * @param {View} viewType - The current view type
     * @param {number} interval - The interval for the view
     * @returns {Date} The new date after navigating backward
     */
    static navigateToPrevious(currentDate: Date, viewType: View, interval: number): Date {
        switch (viewType) {
        case 'Day':
            return DateService.addDays(currentDate, -interval);
        case 'Week':
        case 'WorkWeek':
            return DateService.addDays(currentDate, -7 * interval);
        case 'Month':
            return DateService.addMonths(currentDate, -interval);
        default:
            return DateService.addDays(currentDate, -1);
        }
    }

    /**
     * Navigate to the next time period based on view type and interval
     *
     * @param {Date} currentDate - The current selected date
     * @param {View} viewType - The current view type
     * @param {number} interval - The interval for the view
     * @returns {Date} The new date after navigating forward
     */
    static navigateToNext(currentDate: Date, viewType: View, interval: number): Date {
        switch (viewType) {
        case 'Day':
            return DateService.addDays(currentDate, interval);
        case 'Week':
        case 'WorkWeek':
            return DateService.addDays(currentDate, 7 * interval);
        case 'Month':
            return DateService.addMonths(currentDate, interval);
        default:
            return DateService.addDays(currentDate, 1);
        }
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
