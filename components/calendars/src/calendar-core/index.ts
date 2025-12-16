import { GregorianCalendar, IslamicCalendar } from './engine';
import { CalendarSystem, CalendarType } from './types';

export * from './types';
export * from './engine';

/**
 * Get the calendar system object.
 *
 * @param {CalendarType} type Specify the calendar type.
 * @returns {object} returns the calendar instance.
 */
export function createCalendarSystem(type: CalendarType): CalendarSystem {
    switch (type) {
    case 'gregorian':
        return new GregorianCalendar();
    case 'islamic':
        return new IslamicCalendar();
    default:
        return new GregorianCalendar();
    }
}
