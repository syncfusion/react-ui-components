import { cldrData, getDefaultDateObject, getValue, isNullOrUndefined } from '@syncfusion/react-base';
import { CalendarCellData } from '../types';

export const WEEK_LENGTH: number = 7;
export const DEFAULT_WEEKS: number = 6;



export const getCultureValues: (locale: string, weekDaysFormat: string, calendarType: string)
=> string[] = (locale: string, weekDaysFormat: string, calendarType: string) => {
    const culShortNames: string[] = [];
    let cldrObj: string[];
    const dayFormat: string = 'days.stand-alone.' + weekDaysFormat?.toLowerCase();
    if ((locale === 'en' || locale === 'en-US') && !isNullOrUndefined(dayFormat)) {
        cldrObj = getValue(dayFormat, getDefaultDateObject());
    } else {
        const calendarFormat: string = weekDaysFormat
            ? `.dates.calendars.${calendarType}.days.format.${weekDaysFormat.toLowerCase()}`
            : '';
        const mainVal: string = 'main.';
        cldrObj = getValue(`${mainVal}${locale || 'en-US'}${calendarFormat}`, cldrData);
    }
    if (!isNullOrUndefined(cldrObj)) {
        for (const key of Object.keys(cldrObj)) {
            culShortNames.push(getValue(key, cldrObj));
        }
    }
    return culShortNames;
};

export const shiftArray: <T>(array: T[], places: number) => T[] = <T>(
    array: T[],
    places: number
): T[] => {
    if (!Array.isArray(array) || array.length === 0) {
        return array;
    }
    const n: number = array.length;
    const p: number = ((places % n) + n) % n;
    if (p === 0) {
        return array.slice();
    }
    return array.slice(p).concat(array.slice(0, p));
};


export const trimOutsideRows: (matrix: CalendarCellData[][])
=> CalendarCellData[][] = (matrix: CalendarCellData[][]) => {
    if (!Array.isArray(matrix) || matrix.length === 0) {
        return matrix;
    }
    const rowIsOut: (row: CalendarCellData[]) => boolean = (row: CalendarCellData[]) => {
        return row.every((c: CalendarCellData) => !c.inRange);
    };
    let start: number = 0;
    let end: number = matrix.length - 1;
    while (start <= end && rowIsOut(matrix[start as number])) {
        start++;
    }
    while (end >= start && rowIsOut(matrix[end as number])) {
        end--;
    }
    return matrix.slice(Math.max(0, start), Math.max(start, end + 1));
};
