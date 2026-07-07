/* eslint-disable max-len */
import { isNullOrUndefined, IL10n, getDefaultDateObject, getValue, cldrData } from '@syncfusion/react-base';
import { DateService, MS_PER_DAY } from '../scheduler/services/DateService';
import { CalendarUtil, Gregorian } from '../common/calendar-util';
import { FreqType } from './types';
import { useRecurrenceEditorLocalization } from './locale';
// import { Timezone } from '../schedule/timezone/timezone';

/**
 * Date Generator from Recurrence Rule
 */

/**
 * Generate Summary from Recurrence Rule
 *
 * @param {string} rule Accepts the Recurrence rule
 * @param {string} locale Accepts the locale name
 * @param {IL10n | undefined} localeObject Accepts the locale object (optional)
 * @returns {string} Returns the summary string from given recurrence rule
 */
export function getRecurrenceSummary(rule: string, locale: string, localeObject?: IL10n): string {
    const localeObj: IL10n = localeObject ??
        (useRecurrenceEditorLocalization(locale ?? 'en-US').l10nInstance);
    const calendarType: string = 'Gregorian';
    const ruleObject: RecRule = extractObjectFromRule(rule);
    let summary: string = localeObj.getConstant(EVERY) + ' ';
    let cldrObj: string[];
    let cldrObj1: string[];
    const calendarMode: string = calendarType.toLowerCase();
    if (locale === 'en' || locale === 'en-US') {
        const nameSpace1: string = 'months.stand-alone.abbreviated';
        const nameSpace: string = 'days.stand-alone.abbreviated';
        cldrObj1 = getValue(nameSpace1, getDefaultDateObject(calendarMode)) as string[];
        cldrObj = getValue(nameSpace, getDefaultDateObject(calendarMode)) as string[];
    } else {
        const nameSpace1: string =
            'main.' + locale + '.dates.calendars.' + calendarMode + '.months.stand-alone.abbreviated';
        const nameSpace: string =
            'main.' + locale + '.dates.calendars.' + calendarMode + '.days.stand-alone.abbreviated';
        cldrObj1 = getValue(nameSpace1, cldrData) as string[];
        cldrObj = getValue(nameSpace, cldrData) as string[];
    }
    if (ruleObject.interval > 1) {
        summary += ruleObject.interval + ' ';
    }
    switch (ruleObject.freq) {
    case 'DAILY':
        summary += localeObj.getConstant(DAYS);
        break;
    case 'WEEKLY':
        summary += localeObj.getConstant(WEEKS) + ' ' + localeObj.getConstant(ON) + ' ';
        ruleObject.day.forEach((day: string, index: number) => {
            summary += DateService.capitalizeFirstWord(getValue(DAYINDEXOBJECT[`${day}`], cldrObj) as string, 'single');
            summary += (((ruleObject.day.length - 1) === index) ? '' : ', ');
        });
        break;
    case 'MONTHLY':
        summary += localeObj.getConstant(MONTHS) + ' ' + localeObj.getConstant(ON) + ' ';
        summary += getMonthSummary(ruleObject, cldrObj, localeObj);
        break;
    case 'YEARLY':
        summary += localeObj.getConstant(YEARS) + ' ' + localeObj.getConstant(ON) + ' ';
        summary += DateService.capitalizeFirstWord(getValue((ruleObject.month[0]).toString(), cldrObj1) as string, 'single') + ' ';
        summary += getMonthSummary(ruleObject, cldrObj, localeObj);
        break;
    }
    if (ruleObject.count) {
        summary += ', ' + (ruleObject.count) + ' ' + localeObj.getConstant(TIMES);
    } else if (ruleObject.until) {
        const tempDate: Date = ruleObject.until;
        summary += ', ' + localeObj.getConstant(UNTIL)
            + ' ' + tempDate.getDate()
            + ' ' + DateService.capitalizeFirstWord(getValue((tempDate.getMonth() + 1).toString(), cldrObj1) as string, 'single')
            + ' ' + tempDate.getFullYear();
    }
    return summary;
}

/**
 * Generates Month summary
 *
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {string[]} cldrObj Accepts the collections of month name from calendar
 * @param {IL10n} localeObj Accepts the locale object
 * @returns {string} Returns the month summary string from given recurrence rule object
 * @private
 */
function getMonthSummary(ruleObject: RecRule, cldrObj: string[], localeObj: IL10n): string {
    let summary: string = '';
    if (ruleObject.monthDay.length) {
        summary += ruleObject.monthDay[0];
    } else if (ruleObject.day) {
        const pos: number = ruleObject.setPosition - 1;
        summary += localeObj.getConstant(WEEKPOS[pos > -1 ? pos : (WEEKPOS.length - 1)])
            + ' ' + DateService.capitalizeFirstWord(getValue(DAYINDEXOBJECT[ruleObject.day[0]], cldrObj) as string, 'single');
    }
    return summary;
}

/**
 * Generates the date collections from the given recurrence rule
 *
 * @param {Date} startDate Accepts the rule start date
 * @param {string} rule Accepts the recurrence rule
 * @param {string} excludeDate Accepts the exception dates in string format
 * @param {number} startDayOfWeek Accepts the start day index of week
 * @param {number} maximumCount Accepts the maximum number count to generate date collections
 * @param {Date} viewDate Accepts the current date instead of start date
 * @param {string} calendarMode Accepts the calendar type
 * @returns {number[]} Returns the collection of dates
 */
export function getRecurrenceDates(startDate: Date, rule: string, excludeDate: string, startDayOfWeek: number, maximumCount: number = MAXOCCURRENCE, viewDate: Date = null, calendarMode: string = 'Gregorian'): number[] {
    const ctx: RecurrenceContext = createContext(calendarMode, maximumCount);
    const ruleObject: RecRule = extractObjectFromRule(rule);
    let cacheDate: Date;
    const data: number[] = [];
    const modifiedDate: Date = new Date(startDate.getTime());
    const tempDate: string[] = excludeDate ? excludeDate.split(',') : [];
    tempDate.forEach((content: string) => {
        const parsedDate: Date = getDateFromRecurrenceDateString(content);
        ctx.tempExcludeDate.push(new Date(parsedDate.getTime()).setHours(0, 0, 0, 0));
    });
    ruleObject.recExceptionCount = !isNullOrUndefined(ruleObject.count) ? ctx.tempExcludeDate.length : 0;

    if (viewDate && viewDate > startDate && !ruleObject.count) {
        ctx.tempViewDate = new Date(new Date(viewDate.getTime()).setHours(0, 0, 0));
    } else {
        ctx.tempViewDate = null;
    }

    if (!ruleObject.until && ctx.tempViewDate) {
        cacheDate = new Date(ctx.tempViewDate.getTime());
        cacheDate.setDate(ctx.tempViewDate.getDate() + maximumCount * (ruleObject.interval));
        ruleObject.until = cacheDate;
    }
    if (ruleObject.until && startDate > ruleObject.until) {
        return data;
    }

    startDayOfWeek = startDayOfWeek || 0;
    setFirstDayOfWeek(DAYINDEX[parseInt(startDayOfWeek.toString(), 10)], ctx);

    switch (ruleObject.freq) {
    case 'DAILY':
        dailyType(modifiedDate, ruleObject.until, data, ruleObject, ctx);
        break;
    case 'WEEKLY':
        weeklyType(modifiedDate, ruleObject.until, data, ruleObject, startDayOfWeek, ctx);
        break;
    case 'MONTHLY':
        monthlyType(modifiedDate, ruleObject.until, data, ruleObject, ctx);
        break;
    case 'YEARLY':
        yearlyType(modifiedDate, ruleObject.until, data, ruleObject, ctx);
        break;
    }
    return data;
}

/**
 * Generate date object from given date string
 *
 * @param {string} recDateString Accepts the exception date as string
 * @returns {Date} Returns the date from exception date string
 */
export function getDateFromRecurrenceDateString(recDateString: string): Date {
    return new Date(recDateString.substring(0, 4) +
        '-' + recDateString.substring(4, 6) +
        '-' + recDateString.substring(6, 11) +
        ':' + recDateString.substring(11, 13) +
        ':' + recDateString.substring(13));
}

/**
 * Internal method to handle exclude date
 *
 * @param {number[]} data Accepts the exception date collections
 * @param {number} date Accepts the new exclude date
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function excludeDateHandler(data: number[], date: number, ctx: RecurrenceContext): void {
    const zeroIndex: number = new Date(date).setHours(0, 0, 0, 0);
    if (ctx.tempExcludeDate.indexOf(zeroIndex) === -1 && (!ctx.tempViewDate || zeroIndex >= ctx.tempViewDate.getTime())) {
        data.push(date);
    }
}

/**
 * Internal method for get date count
 *
 * @param {Date} startDate Accepts the date
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {number} Returns the number of date count
 * @private
 */
function getDateCount(startDate: Date, ruleObject: RecRule, ctx: RecurrenceContext): number {
    let count: number = ctx.maxOccurrence;
    if (ruleObject.count) {
        count = ruleObject.count;
    } else if (ruleObject.until) {
        if (ruleObject.freq === 'DAILY' || ruleObject.freq === 'WEEKLY') {
            count = Math.floor((ruleObject.until.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
        } else if (ruleObject.freq === 'MONTHLY' || ruleObject.freq === 'YEARLY') {
            count = Math.floor(((ruleObject.until.getMonth() + 12 * ruleObject.until.getFullYear()) -
                (startDate.getMonth() + 12 * startDate.getFullYear())) / ruleObject.interval) +
                (ruleObject.day.length > 1 ? (Math.floor((ruleObject.until.getTime() - startDate.getTime()) / MS_PER_DAY) + 1) : 1);
            if (ruleObject.freq === 'YEARLY') {
                count = ruleObject.month.length > 1 ? ((count as number) * ruleObject.month.length) : count;
            }
        }
    }
    return count;
}

/**
 *  Internal method for daily type recurrence rule
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function dailyType(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    const tempDate: Date = new Date(startDate.getTime());
    const interval: number = ruleObject.interval;
    const expectedCount: number = getDateCount(startDate, ruleObject, ctx);
    let state: boolean;
    const expectedDays: string[] = ruleObject.day;
    while (compareDates(tempDate, endDate)) {
        state = true;
        state = validateRules(tempDate, ruleObject, ctx);
        if (state && (expectedDays.indexOf(DAYINDEX[tempDate.getDay()]) > -1 || expectedDays.length === 0)) {
            excludeDateHandler(data, tempDate.getTime(), ctx);
            if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
                break;
            }
        }
        tempDate.setDate(tempDate.getDate() + interval);
        if (tempDate.getHours() !== startDate.getHours()) {
            tempDate.setHours(startDate.getHours());
        }
    }
}

/**
 * Internal method for weekly type recurrence rule
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {number} startDayOfWeek Accepts the start day index of week
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function weeklyType(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, startDayOfWeek: number, ctx: RecurrenceContext): void {
    let tempDate: Date = new Date(startDate.getTime());
    if (!ruleObject.day.length) {
        ruleObject.day.push(DAYINDEX[startDate.getDay()]);
    }
    const interval: number = ruleObject.interval;
    const expectedDays: string[] = ruleObject.day;
    const expectedCount: number = getDateCount(startDate, ruleObject, ctx);
    let weekState: boolean = true;
    let wkstIndex: number;
    let weekCollection: number[][] = [];
    if (expectedDays.length > 1) {
        if (isNullOrUndefined(ruleObject.wkst) || ruleObject.wkst === '') {
            ruleObject.wkst = ctx.dayIndex[0];
        }
        wkstIndex = DAYINDEX.indexOf(ruleObject.wkst);
        while (compareDates(tempDate, endDate)) {
            let startDateDiff: number = DAYINDEX.indexOf(DAYINDEX[tempDate.getDay()]) - wkstIndex;
            startDateDiff = startDateDiff === -1 ? 6 : startDateDiff;
            const weekstartDate: Date = DateService.addDays(tempDate, -startDateDiff);
            let weekendDate: Date = DateService.addDays(weekstartDate, 6);
            let compareTempDate: Date = new Date(tempDate.getTime());
            weekendDate = DateService.resetTime(weekendDate);
            compareTempDate = DateService.resetTime(compareTempDate);
            while (weekendDate >= compareTempDate) {
                if (expectedDays.indexOf(DAYINDEX[tempDate.getDay()]) > -1) {
                    weekCollection.push([tempDate.getTime()]);
                }
                if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
                    break;
                }
                tempDate.setDate(tempDate.getDate() + 1);
                if (tempDate.getHours() !== startDate.getHours()) {
                    tempDate.setHours(startDate.getHours());
                }
                compareTempDate = new Date(tempDate.getTime());
                compareTempDate = DateService.resetTime(compareTempDate);
            }
            tempDate.setDate(tempDate.getDate() - 1);
            if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
                break;
            }
            tempDate.setDate((tempDate.getDate()) + 1 + ((interval - 1) * 7));
            insertDataCollection(weekCollection, weekState, startDate, endDate, data, ruleObject, ctx);
            weekCollection = [];
        }
    } else {
        tempDate = getStartDateForWeek(startDate, ruleObject.day);
        if (interval > 1 && ctx.dayIndex.indexOf(ruleObject.day[0]) < (startDate.getDay() - startDayOfWeek)) {
            tempDate.setDate(tempDate.getDate() + ((interval - 1) * 7));
        }
        while (compareDates(tempDate, endDate)) {
            weekState = validateRules(tempDate, ruleObject, ctx);
            if (weekState && (expectedDays.indexOf(DAYINDEX[tempDate.getDay()]) > -1)) {
                excludeDateHandler(data, tempDate.getTime(), ctx);
            }
            if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
                break;
            }
            tempDate.setDate(tempDate.getDate() + (interval * 7));
        }
        insertDataCollection(weekCollection, weekState, startDate, endDate, data, ruleObject, ctx);
        weekCollection = [];
    }
}

/**
 *  Internal method for monthly type recurrence rule
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function monthlyType(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    // Set monthday value if BYDAY, BYMONTH and Month day property is not set based on start date
    if (!ruleObject.month.length && !ruleObject.day.length && !ruleObject.monthDay.length) {
        ruleObject.monthDay.push(startDate.getDate());
        if (ruleObject.freq === 'YEARLY') {
            ruleObject.month.push(startDate.getMonth() + 1);
        }
    } else if (ruleObject.month.length > 0 && !ruleObject.day.length && !ruleObject.monthDay.length) {
        ruleObject.monthDay.push(startDate.getDate());
    }
    const ruleType: MonthlyType = validateMonthlyRuleType(ruleObject);
    switch (ruleType) {
    case 'day':
        switch (ruleObject.freq) {
        case 'MONTHLY':
            monthlyDayTypeProcessforMonthFreq(startDate, endDate, data, ruleObject, ctx);
            break;
        case 'YEARLY':
            monthlyDayTypeProcess(startDate, endDate, data, ruleObject, ctx);
            break;
        }
        break;
    case 'both':
    case 'date':
        switch (ruleObject.freq) {
        case 'MONTHLY':
            monthlyDateTypeProcessforMonthFreq(startDate, endDate, data, ruleObject, ctx);
            break;
        case 'YEARLY':
            monthlyDateTypeProcess(startDate, endDate, data, ruleObject, ctx);
            break;
        }
        break;
    }
}

/**
 * Internal method for yearly type recurrence rule
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function yearlyType(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    const typeValue: YearRuleType = checkYearlyType(ruleObject);
    switch (typeValue) {
    case 'MONTH':
        monthlyType(startDate, endDate, data, ruleObject, ctx);
        break;
    case 'WEEKNO':
        processWeekNo(startDate, endDate, data, ruleObject, ctx);
        break;
    case 'YEARDAY':
        processYearDay(startDate, endDate, data, ruleObject, ctx);
        break;
    }
}

/**
 * Internal method for process week no
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function processWeekNo(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    let stDate: Date = ctx.calendarUtil.getYearLastDate(startDate, 0);
    let tempDate: Date;
    const expectedCount: number = getDateCount(startDate, ruleObject, ctx);
    let state: boolean;
    let startDay: number;
    let firstWeekSpan: number;
    const weekNos: number[] = ruleObject.weekNo;
    let weekNo: number;
    let maxDate: number;
    let minDate: number;
    let weekCollection: number[][] = [];
    const expectedDays: string[] = ruleObject.day;
    while (compareDates(stDate, endDate)) {
        startDay = ctx.dayIndex.indexOf(DAYINDEX[stDate.getDay()]);
        firstWeekSpan = (6 - startDay) + 1;
        for (let index: number = 0; index < weekNos.length; index++) {
            weekNo = weekNos[parseInt(index.toString(), 10)];
            weekNo = (weekNo > 0) ? weekNo : 53 + weekNo + 1;
            maxDate = (weekNo === 1) ? firstWeekSpan : firstWeekSpan + ((weekNo - 1) * 7);
            minDate = (weekNo === 1) ? firstWeekSpan - 7 : firstWeekSpan + ((weekNo - 2) * 7);
            while (minDate < maxDate) {
                tempDate = new Date(stDate.getTime() + (MS_PER_DAY * minDate));
                if (expectedDays.length === 0 || expectedDays.indexOf(DAYINDEX[tempDate.getDay()]) > -1) {
                    if (isNullOrUndefined(ruleObject.setPosition)) {
                        insertDateCollection(state, startDate, endDate, data, ruleObject, tempDate.getTime(), ctx);
                    } else {
                        weekCollection.push([tempDate.getTime()]);
                    }
                }
                minDate++;
            }
        }
        if (!isNullOrUndefined(ruleObject.setPosition)) {
            insertDatasIntoExistingCollection(weekCollection, state, startDate, endDate, data, ruleObject, ctx);
        }
        if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
            return;
        }
        stDate = ctx.calendarUtil.getYearLastDate(tempDate, ruleObject.interval);
        weekCollection = [];
    }
}

/**
 * Internal method for process year day
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function processYearDay(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    let stDate: Date = ctx.calendarUtil.getYearLastDate(startDate, 0);
    let tempDate: Date;
    const expectedCount: number = getDateCount(startDate, ruleObject, ctx);
    let state: boolean;
    let dateCollection: number[][] = [];
    let date: number;
    const expectedDays: string[] = ruleObject.day;
    while (compareDates(stDate, endDate)) {
        for (let index: number = 0; index < ruleObject.yearDay.length; index++) {
            date = ruleObject.yearDay[parseInt(index.toString(), 10)];
            tempDate = new Date(stDate.getTime());
            if ((date === ctx.calendarUtil.getLeapYearDaysCount() || date === -ctx.calendarUtil.getLeapYearDaysCount()) &&
                (!ctx.calendarUtil.isLeapYear(ctx.calendarUtil.getFullYear(tempDate), 1))) {
                tempDate.setDate(tempDate.getDate() + 1);
                continue;
            }
            tempDate.setDate(tempDate.getDate() + ((date < 0) ?
                ctx.calendarUtil.getYearDaysCount(tempDate, 1) + 1 + date : date));
            if (expectedDays.length === 0 || expectedDays.indexOf(DAYINDEX[tempDate.getDay()]) > -1) {
                if (isNullOrUndefined(ruleObject.setPosition)) {
                    insertDateCollection(state, startDate, endDate, data, ruleObject, tempDate.getTime(), ctx);
                } else {
                    dateCollection.push([tempDate.getTime()]);
                }
            }
        }
        if (!isNullOrUndefined(ruleObject.setPosition)) {
            insertDatasIntoExistingCollection(dateCollection, state, startDate, endDate, data, ruleObject, ctx);
        }
        if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
            return;
        }
        stDate = ctx.calendarUtil.getYearLastDate(tempDate, ruleObject.interval);
        dateCollection = [];
    }
}

/**
 * Internal method to check yearly type
 *
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @returns {YearRuleType} Returns the Yearly rule type object
 * @private
 */
function checkYearlyType(ruleObject: RecRule): YearRuleType {
    if (ruleObject.yearDay.length) {
        return 'YEARDAY';
    } else if (ruleObject.weekNo.length) {
        return 'WEEKNO';
    }
    return 'MONTH';
}

/**
 * Internal method to initialize recurrence rule variables
 *
 * @param {Date} startDate Accepts the start date
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {RuleData} Return the rule data object
 * @private
 */
function initializeRecRuleVariables(startDate: Date, ruleObject: RecRule, ctx: RecurrenceContext): RuleData {
    const ruleData: RuleData = {
        monthCollection: [],
        index: 0,
        tempDate: new Date(startDate.getTime()),
        mainDate: new Date(startDate.getTime()),
        expectedCount: getDateCount(startDate, ruleObject, ctx),
        monthInit: 0,
        dateCollection: []
    };
    if (ruleObject.month.length) {
        ctx.calendarUtil.setMonth(ruleData.tempDate, ruleObject.month[0], ruleData.tempDate.getDate());
    }
    return ruleData;
}

/**
 * Internal method for process monthly date type recurrence rule
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function monthlyDateTypeProcess(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    if (ruleObject.month.length) {
        monthlyDateTypeProcessforMonthFreq(startDate, endDate, data, ruleObject, ctx);
        return;
    }
    const ruleData: RuleData = initializeRecRuleVariables(startDate, ruleObject, ctx);
    let currentMonthDate: Date;
    ruleData.tempDate = ruleData.mainDate = ctx.calendarUtil.getMonthStartDate(ruleData.tempDate);
    while (compareDates(ruleData.tempDate, endDate)) {
        currentMonthDate = new Date(ruleData.tempDate.getTime());
        while (ctx.calendarUtil.isSameYear(currentMonthDate, ruleData.tempDate) &&
            (ruleData.expectedCount && (data.length + ruleObject.recExceptionCount) <= ruleData.expectedCount)) {
            if (ruleObject.month.length === 0 || (ruleObject.month.length > 0
                && !ctx.calendarUtil.checkMonth(ruleData.tempDate, ruleObject.month))) {
                processDateCollectionForByMonthDay(ruleObject, ruleData, endDate, false, ctx);
                ruleData.beginDate = new Date(ruleData.tempDate.getTime());
                ruleData.monthInit = setNextValidDate(
                    ruleData.tempDate, ruleObject, ruleData.monthInit, ruleData.beginDate, ctx);
            } else {
                ctx.calendarUtil.setValidDate(ruleData.tempDate, 1, 1);
                ruleData.tempDate = getStartDateForWeek(ruleData.tempDate, ruleObject.day);
                break;
            }
        }
        ruleData.tempDate.setFullYear(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), currentMonthDate.getDate());
        insertDataCollection(ruleData.dateCollection, ruleData.state, startDate, endDate, data, ruleObject, ctx);
        if (ctx.calendarUtil.isLastMonth(ruleData.tempDate)) {
            ctx.calendarUtil.setValidDate(ruleData.tempDate, 1, 1);
            ruleData.tempDate = getStartDateForWeek(ruleData.tempDate, ruleObject.day);
        }
        if (ruleData.expectedCount && (data.length + ruleObject.recExceptionCount) >= ruleData.expectedCount) {
            return;
        }
        ruleData.tempDate.setFullYear(ruleData.tempDate.getFullYear() + ruleObject.interval - 1);
        ruleData.tempDate = getStartDateForWeek(ruleData.tempDate, ruleObject.day);
        ruleData.monthInit = setNextValidDate(
            ruleData.tempDate, ruleObject, ruleData.monthInit, ruleData.beginDate, ctx);
        ruleData.dateCollection = [];
    }
}

/**
 * Internal method for process monthly date type with month frequency from recurrence rule
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function monthlyDateTypeProcessforMonthFreq(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    const ruleData: RuleData = initializeRecRuleVariables(startDate, ruleObject, ctx);
    ruleData.tempDate = ruleData.mainDate = ctx.calendarUtil.getMonthStartDate(ruleData.tempDate);
    if (((ruleObject.freq === 'MONTHLY' && ruleObject.interval === 12) || (ruleObject.freq === 'YEARLY')) &&
        ctx.calendarUtil.getMonthDaysCount(startDate) < ruleObject.monthDay[0]) {
        return;
    }
    while (compareDates(ruleData.tempDate, endDate)) {
        ruleData.beginDate = new Date(ruleData.tempDate.getTime());
        processDateCollectionForByMonthDay(ruleObject, ruleData, endDate, true, ctx, startDate, data);
        if (!isNullOrUndefined(ruleObject.setPosition)) {
            insertDatasIntoExistingCollection(ruleData.dateCollection, ruleData.state, startDate, endDate, data, ruleObject, ctx);
        }
        if (ruleData.expectedCount && (data.length + ruleObject.recExceptionCount) >= ruleData.expectedCount) {
            return;
        }
        ruleData.monthInit = setNextValidDate(ruleData.tempDate, ruleObject, ruleData.monthInit, ruleData.beginDate, ctx);
        ruleData.dateCollection = [];
    }
}

/**
 * To process date collection for Monthly & Yearly based on BYMONTH Day property
 *
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RuleData} recRuleVariables Accepts the rule data
 * @param {Date} endDate Accepts the end date
 * @param {boolean} isByMonth Accepts the boolean to validate either month or not
 * @param {RecurrenceContext} ctx The recurrence context
 * @param {Date} startDate Accepts the start date
 * @param {number[]} data Accepts the collection of dates
 * @returns {void}
 * @private
 */
function processDateCollectionForByMonthDay(ruleObject: RecRule, recRuleVariables: RuleData, endDate: Date, isByMonth?: boolean, ctx?: RecurrenceContext, startDate?: Date, data?: number[]): void {
    for (let index: number = 0; index < ruleObject.monthDay.length; index++) {
        recRuleVariables.date = ruleObject.monthDay[parseInt(index.toString(), 10)];
        recRuleVariables.tempDate = ctx.calendarUtil.getMonthStartDate(recRuleVariables.tempDate);
        const maxDate: number = ctx.calendarUtil.getMonthDaysCount(recRuleVariables.tempDate);
        recRuleVariables.date = recRuleVariables.date > 0 ? recRuleVariables.date : (maxDate + recRuleVariables.date + 1);
        if (validateProperDate(recRuleVariables.tempDate, recRuleVariables.date, recRuleVariables.mainDate, ctx)
            && (recRuleVariables.date > 0)) {
            ctx.calendarUtil.setDate(recRuleVariables.tempDate, recRuleVariables.date);
            if (endDate && recRuleVariables.tempDate > endDate) {
                return;
            }
            if (ruleObject.day.length === 0 || ruleObject.day.indexOf(DAYINDEX[recRuleVariables.tempDate.getDay()]) > -1) {
                if (isByMonth && isNullOrUndefined(ruleObject.setPosition) && (recRuleVariables.expectedCount
                    && (data.length + ruleObject.recExceptionCount) < recRuleVariables.expectedCount)) {
                    insertDateCollection(recRuleVariables.state, startDate, endDate, data, ruleObject, recRuleVariables.tempDate.getTime(), ctx);
                } else {
                    recRuleVariables.dateCollection.push([recRuleVariables.tempDate.getTime()]);
                }
            }
        }
    }
}

/**
 * Internal method to set next valid date
 *
 * @param {Date} tempDate Accepts the date
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {number} monthInit Accepts the initial month
 * @param {Date} beginDate Accepts the initial date
 * @param {RecurrenceContext} ctx The recurrence context
 * @param {number} interval Accepts the interval duration
 * @returns {number} Returnx the next valid date
 * @private
 */
function setNextValidDate(tempDate: Date, ruleObject: RecRule, monthInit: number, beginDate: Date = null, ctx?: RecurrenceContext, interval?: number): number {
    let monthData: number = beginDate ? beginDate.getMonth() : 0;
    const startDate: Date = ctx.calendarUtil.getMonthStartDate(tempDate);
    interval = isNullOrUndefined(interval) ? ruleObject.interval : interval;
    tempDate.setFullYear(startDate.getFullYear());
    tempDate.setMonth(startDate.getMonth());
    tempDate.setDate(startDate.getDate());
    if (ruleObject.month.length) {
        monthInit++;
        monthInit = monthInit % ruleObject.month.length;
        ctx.calendarUtil.setMonth(tempDate, ruleObject.month[parseInt(monthInit.toString(), 10)], 1);
        if (monthInit === 0) {
            ctx.calendarUtil.addYears(tempDate, interval, ruleObject.month[0]);
        }
    } else {
        if (beginDate && (beginDate.getFullYear() < tempDate.getFullYear())) {
            monthData = tempDate.getMonth() - 1;
        }
        ctx.calendarUtil.setValidDate(tempDate, interval, 1, monthData, beginDate);
    }
    return monthInit;
}

/**
 * To get month collection when BYDAY property having more than one value in list.
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function getMonthCollection(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    const expectedDays: string[] = ruleObject.day;
    let tempDate: Date = new Date(startDate.getTime());
    tempDate = ctx.calendarUtil.getMonthStartDate(tempDate);
    let monthCollection: number[][] = [];
    let dateCollection: number[][] = [];
    let dates: number[] = [];
    let index: number;
    let state: boolean;
    const expectedCount: number = getDateCount(startDate, ruleObject, ctx);
    let monthInit: number = 0;
    let beginDate: Date;
    if (ruleObject.month.length) {
        ctx.calendarUtil.setMonth(tempDate, ruleObject.month[0], 1);
    }
    tempDate = getStartDateForWeek(tempDate, ruleObject.day);
    while (compareDates(tempDate, endDate)
        && (expectedCount && (data.length + ruleObject.recExceptionCount) < expectedCount)) {
        const currentMonthDate: Date = new Date(tempDate.getTime());
        const isHavingNumber: boolean[] = expectedDays.map((item: string) => HASNUMBER.test(item));
        if (isHavingNumber.indexOf(true) > -1) {
            for (let j: number = 0; j <= expectedDays.length - 1; j++) {
                const expectedDaysArray: string[] = expectedDays[parseInt(j.toString(), 10)].match(SPLITNUMBERANDSTRING);
                const position: number = parseInt(expectedDaysArray[0], 10);
                tempDate = new Date(tempDate.getTime());
                tempDate = ctx.calendarUtil.getMonthStartDate(tempDate);
                tempDate = getStartDateForWeek(tempDate, expectedDays);
                currentMonthDate.setFullYear(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
                while (ctx.calendarUtil.isSameYear(currentMonthDate, tempDate) && ctx.calendarUtil.isSameMonth(currentMonthDate, tempDate)) {
                    if (expectedDaysArray[expectedDaysArray.length - 1] === DAYINDEX[currentMonthDate.getDay()]) {
                        monthCollection.push([currentMonthDate.getTime()]);
                    }
                    currentMonthDate.setDate(currentMonthDate.getDate() + (1));
                }
                currentMonthDate.setDate(currentMonthDate.getDate() - (1));
                if (expectedDaysArray[0].indexOf('-') > -1) {
                    index = monthCollection.length - (-1 * position);
                } else {
                    index = position - 1;
                }
                index = isNaN(index) ? 0 : index;
                if (monthCollection.length > 0) {
                    if (isNullOrUndefined(ruleObject.setPosition)) {
                        insertDatasIntoExistingCollection(monthCollection, state, startDate, endDate, data, ruleObject, ctx, index);
                    } else {
                        dateCollection = [(filterDateCollectionByIndex(monthCollection, index, dates))];
                    }
                }
                if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
                    return;
                }
                monthCollection = [];
            }
            if (!isNullOrUndefined(ruleObject.setPosition)) {
                insertDateCollectionBasedonBySetPos(dateCollection, state, startDate, endDate, data, ruleObject, ctx);
                dates = [];
            }
            monthInit = setNextValidDate(tempDate, ruleObject, monthInit, beginDate, ctx);
            tempDate = getStartDateForWeek(tempDate, ruleObject.day);
            monthCollection = [];
        } else {
            let weekCollection: number[] = [];
            const dayCycleData: { [key: string]: number } = processWeekDays(expectedDays, ctx);
            currentMonthDate.setFullYear(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
            const initialDate: Date = new Date(tempDate.getTime());
            beginDate = new Date(tempDate.getTime());
            while (ctx.calendarUtil.isSameMonth(initialDate, tempDate)) {
                weekCollection.push(tempDate.getTime());
                if (expectedDays.indexOf(DAYINDEX[tempDate.getDay()]) > -1) {
                    monthCollection.push(weekCollection);
                    weekCollection = [];
                }
                tempDate.setDate(tempDate.getDate()
                    + dayCycleData[DAYINDEX[tempDate.getDay()]]);
            }
            index = ((ruleObject.setPosition < 1) ? (monthCollection.length + ruleObject.setPosition) : ruleObject.setPosition - 1);
            if (isNullOrUndefined(ruleObject.setPosition)) {
                index = 0;
                const datas: number[] = [];
                for (let week: number = 0; week < monthCollection.length; week++) {
                    for (let row: number = 0; row < monthCollection[parseInt(week.toString(), 10)].length; row++) {
                        datas.push(monthCollection[parseInt(week.toString(), 10)][parseInt(row.toString(), 10)]);
                    }
                }
                monthCollection = [datas];
            }
            if (monthCollection.length > 0) {
                insertDatasIntoExistingCollection(monthCollection, state, startDate, endDate, data, ruleObject, ctx, index);
            }
            if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
                return;
            }
            monthInit = setNextValidDate(tempDate, ruleObject, monthInit, beginDate, ctx);
            tempDate = getStartDateForWeek(tempDate, ruleObject.day);
            monthCollection = [];
        }
    }
}

/**
 * To process monday day type for FREQ=MONTHLY
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function monthlyDayTypeProcessforMonthFreq(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    const expectedDays: string[] = ruleObject.day;
    // When BYDAY property having more than 1 value.
    if (expectedDays.length > 1) {
        getMonthCollection(startDate, endDate, data, ruleObject, ctx);
        return;
    }
    let tempDate: Date = new Date(startDate.getTime());
    const expectedCount: number = getDateCount(startDate, ruleObject, ctx);
    let monthCollection: number[][] = [];
    let beginDate: Date;
    let monthInit: number = 0;
    tempDate = ctx.calendarUtil.getMonthStartDate(tempDate);
    if (ruleObject.month.length) {
        ctx.calendarUtil.setMonth(tempDate, ruleObject.month[0], 1);
    }
    tempDate = getStartDateForWeek(tempDate, ruleObject.day);
    while (compareDates(tempDate, endDate) && (expectedCount && (data.length + ruleObject.recExceptionCount) < expectedCount)) {
        beginDate = new Date(tempDate.getTime());
        const currentMonthDate: Date = new Date(tempDate.getTime());
        while (ctx.calendarUtil.isSameMonth(tempDate, currentMonthDate)) {
            monthCollection.push([currentMonthDate.getTime()]);
            currentMonthDate.setDate(currentMonthDate.getDate() + (7));
        }
        // To filter date collection based on BYDAY Index, then BYSETPOS and to insert datas into existing collection
        insertDateCollectionBasedonIndex(monthCollection, startDate, endDate, data, ruleObject, ctx);
        monthInit = setNextValidDate(tempDate, ruleObject, monthInit, beginDate, ctx);
        tempDate = getStartDateForWeek(tempDate, ruleObject.day);
        monthCollection = [];
    }
}

/**
 * To process monday day type for FREQ=YEARLY
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function monthlyDayTypeProcess(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    const expectedDays: string[] = ruleObject.day;
    const isHavingNumber: boolean[] = expectedDays.map((item: string) => HASNUMBER.test(item));
    // If BYDAY property having more than 1 value in list
    if (expectedDays.length > 1 && isHavingNumber.indexOf(true) > -1) {
        processDateCollectionforByDayWithInteger(startDate, endDate, data, ruleObject, ctx);
        return;
    } else if (ruleObject.month.length && expectedDays.length === 1 && isHavingNumber.indexOf(true) > -1) {
        monthlyDayTypeProcessforMonthFreq(startDate, endDate, data, ruleObject, ctx);
        return;
    }
    let tempDate: Date = new Date(startDate.getTime());
    let currentMonthDate: Date;
    const expectedCount: number = getDateCount(startDate, ruleObject, ctx);
    const interval: number = ruleObject.interval;
    let monthCollection: number[][] = [];
    if (ruleObject.month.length) {
        ctx.calendarUtil.setMonth(tempDate, ruleObject.month[0], tempDate.getDate());
    }
    // Set the date as start date of the yeear if yearly freq having ByDay property alone
    if (isNullOrUndefined(ruleObject.setPosition) && ruleObject.month.length === 0 && ruleObject.weekNo.length === 0) {
        tempDate.setFullYear(startDate.getFullYear(), 0, 1);
    }
    tempDate = ctx.calendarUtil.getMonthStartDate(tempDate);
    tempDate = getStartDateForWeek(tempDate, ruleObject.day);
    while (compareDates(tempDate, endDate)) {
        currentMonthDate = new Date(tempDate.getTime());
        while (ctx.calendarUtil.isSameYear(currentMonthDate, tempDate) &&
            (expectedCount && (data.length + ruleObject.recExceptionCount) <= expectedCount)) {
            currentMonthDate = new Date(tempDate.getTime());
            while (ctx.calendarUtil.isSameYear(currentMonthDate, tempDate)) {
                if (ruleObject.month.length === 0 || (ruleObject.month.length > 0
                    && !ctx.calendarUtil.checkMonth(tempDate, ruleObject.month))) {
                    if (expectedDays.length > 1) {
                        if (ctx.calendarUtil.compareMonth(currentMonthDate, tempDate)) {
                            ctx.calendarUtil.setValidDate(tempDate, 1, 1);
                            tempDate = getStartDateForWeek(tempDate, ruleObject.day);
                            break;
                        }
                        if (expectedDays.indexOf(DAYINDEX[currentMonthDate.getDay()]) > -1) {
                            monthCollection.push([currentMonthDate.getTime()]);
                        }
                        currentMonthDate.setDate(currentMonthDate.getDate() + (1));
                    } else {
                        // If BYDAY property having 1 value in list
                        if (currentMonthDate.getFullYear() > tempDate.getFullYear()) {
                            ctx.calendarUtil.setValidDate(tempDate, 1, 1);
                            tempDate = getStartDateForWeek(tempDate, ruleObject.day);
                            break;
                        }
                        const newstr: string = getDayString(expectedDays[0]);
                        if (DAYINDEX[currentMonthDate.getDay()] === newstr
                            && new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 0)
                            > new Date(startDate.getFullYear())) {
                            monthCollection.push([currentMonthDate.getTime()]);
                        }
                        currentMonthDate.setDate(currentMonthDate.getDate() + (7));
                    }
                } else {
                    ctx.calendarUtil.setValidDate(tempDate, 1, 1);
                    tempDate = getStartDateForWeek(tempDate, ruleObject.day);
                    break;
                }
            }
        }
        tempDate.setFullYear(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), currentMonthDate.getDate());
        // To filter date collection based on BYDAY Index, then BYSETPOS and to insert datas into existing collection
        insertDateCollectionBasedonIndex(monthCollection, startDate, endDate, data, ruleObject, ctx);
        if (ctx.calendarUtil.isLastMonth(tempDate)) {
            ctx.calendarUtil.setValidDate(tempDate, 1, 1);
            tempDate = getStartDateForWeek(tempDate, ruleObject.day);
        }
        tempDate.setFullYear(tempDate.getFullYear() + interval - 1);
        if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
            return;
        }
        tempDate = getStartDateForWeek(tempDate, ruleObject.day);
        monthCollection = [];
    }
}

/**
 * To process the recurrence rule when BYDAY property having values with integer
 *
 * @param {Date} startDate Accepts the strat date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of dates
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function processDateCollectionforByDayWithInteger(startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    const expectedDays: string[] = ruleObject.day;
    const expectedCount: number = getDateCount(startDate, ruleObject, ctx);
    let tempDate: Date = new Date(startDate.getTime());
    const interval: number = ruleObject.interval;
    let monthCollection: number[][] = [];
    let dateCollection: number[][] = [];
    let index: number;
    let state: boolean;
    let monthInit: number = 0;
    let currentMonthDate: Date;
    let currentDate: Date;
    let beginDate: Date;
    tempDate = ctx.calendarUtil.getMonthStartDate(tempDate);
    let datas: number[] = [];
    if (ruleObject.month.length) {
        ctx.calendarUtil.setMonth(tempDate, ruleObject.month[0], 1);
    }
    tempDate = getStartDateForWeek(tempDate, ruleObject.day);
    while (compareDates(tempDate, endDate)) {
        currentMonthDate = new Date(tempDate.getTime());
        for (let i: number = 0; i <= ruleObject.month.length; i++) {
            for (let j: number = 0; j <= expectedDays.length - 1; j++) {
                tempDate = ctx.calendarUtil.getMonthStartDate(tempDate);
                tempDate = getStartDateForWeek(tempDate, ruleObject.day);
                monthCollection = [];
                while (ctx.calendarUtil.isSameYear(currentMonthDate, tempDate) &&
                    (expectedCount && (data.length + ruleObject.recExceptionCount) <= expectedCount)) {
                    while (ctx.calendarUtil.isSameYear(currentMonthDate, tempDate)) {
                        currentMonthDate = new Date(tempDate.getTime());
                        if (ruleObject.month.length === 0 ||
                            (ruleObject.month.length > 0 && ruleObject.month[parseInt(i.toString(), 10)] === ctx.calendarUtil.getMonth(currentMonthDate))) {
                            const expectedDaysArray: string[] = expectedDays[parseInt(j.toString(), 10)].match(SPLITNUMBERANDSTRING);
                            const position: number = parseInt(expectedDaysArray[0], 10);
                            currentDate = new Date(tempDate.getTime());
                            while (ctx.calendarUtil.isSameYear(currentDate, tempDate)
                                && ctx.calendarUtil.isSameMonth(currentDate, tempDate)) {
                                if (expectedDaysArray[expectedDaysArray.length - 1] === DAYINDEX[currentDate.getDay()]) {
                                    monthCollection.push([currentDate.getTime()]);
                                }
                                currentDate.setDate(currentDate.getDate() + (1));
                            }
                            currentDate.setDate(currentDate.getDate() - (1));
                            if (expectedDaysArray[0].indexOf('-') > -1) {
                                index = monthCollection.length - (-1 * position);
                            } else {
                                index = position - 1;
                            }
                            index = isNaN(index) ? 0 : index;
                        }
                        monthInit = setNextValidDate(tempDate, ruleObject, monthInit, beginDate, ctx, 1);
                        tempDate = getStartDateForWeek(tempDate, ruleObject.day);
                    }
                }
                tempDate = j === 0 && currentDate ? new Date(currentDate.getTime()) : new Date(currentMonthDate.getTime());
                if (monthCollection.length > 0) {
                    if (isNullOrUndefined(ruleObject.setPosition)) {
                        insertDatasIntoExistingCollection(monthCollection, state, startDate, endDate, data, ruleObject, ctx, index);
                    } else {
                        dateCollection = [(filterDateCollectionByIndex(monthCollection, index, datas))];
                    }
                }
                if (expectedCount && (data.length + ruleObject.recExceptionCount) >= expectedCount) {
                    return;
                }
            }
        }
        if (!isNullOrUndefined(ruleObject.setPosition)) {
            insertDateCollectionBasedonBySetPos(dateCollection, state, startDate, endDate, data, ruleObject, ctx);
            datas = [];
        }
        if (ctx.calendarUtil.isLastMonth(tempDate)) {
            ctx.calendarUtil.setValidDate(tempDate, 1, 1);
            tempDate.setFullYear(tempDate.getFullYear() + interval - 1);
        } else {
            tempDate.setFullYear(tempDate.getFullYear() + interval);
        }
        tempDate = getStartDateForWeek(tempDate, ruleObject.day);
        if (ruleObject.month.length) {
            ctx.calendarUtil.setMonth(tempDate, ruleObject.month[0], tempDate.getDate());
        }
    }
}

/**
 * To get recurrence collection if BYSETPOS is null
 *
 * @param {number[]} monthCollection Accepts the month collection dates
 * @param {string[]} expectedDays Accepts the exception dates
 * @returns {RuleData} Returns the rule data object
 * @private
 */
function getRecurrenceCollection(monthCollection: number[][], expectedDays: string[]): RuleData {
    let index: number;
    const recurrenceCollectionObject: RuleData = { monthCollection: [], index: 0 };
    if (expectedDays.length === 1) {
        // To split numeric value from BYDAY property value
        const expectedDaysArrays: string[] = expectedDays[0].match(SPLITNUMBERANDSTRING);
        let arrPosition: number;
        if (expectedDaysArrays.length > 1) {
            arrPosition = parseInt(expectedDaysArrays[0], 10);
            index = ((arrPosition < 1) ? (monthCollection.length + arrPosition) : arrPosition - 1);
        } else {
            index = 0;
            monthCollection = getDateCollectionforBySetPosNull(monthCollection);
        }
    } else {
        index = 0;
        monthCollection = getDateCollectionforBySetPosNull(monthCollection);
    }
    recurrenceCollectionObject.monthCollection = monthCollection;
    recurrenceCollectionObject.index = index;
    return recurrenceCollectionObject;
}

/**
 * Internal method to process the data collections
 *
 * @param {number[]} dateCollection Accepts the date collections
 * @param {boolean} state Accepts the state
 * @param {Date} startDate Accepts the start date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of numbers
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function insertDataCollection(dateCollection: number[][], state: boolean, startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    let index: number = ((ruleObject.setPosition < 1) ?
        (dateCollection.length + ruleObject.setPosition) : ruleObject.setPosition - 1);
    if (isNullOrUndefined(ruleObject.setPosition)) {
        index = 0;
        dateCollection = getDateCollectionforBySetPosNull(dateCollection);
    }
    if (dateCollection.length > 0) {
        insertDatasIntoExistingCollection(dateCollection, state, startDate, endDate, data, ruleObject, ctx, index);
    }
}

/**
 * To process month collection if BYSETPOS is null
 *
 * @param {number[]} monthCollection Accepts the month date collections
 * @returns {number[]} Returns the month date collections
 * @private
 */
function getDateCollectionforBySetPosNull(monthCollection: number[][]): number[][] {
    const datas: number[] = [];
    for (let week: number = 0; week < monthCollection.length; week++) {
        for (let row: number = 0; row < monthCollection[parseInt(week.toString(), 10)].length; row++) {
            datas.push(new Date(monthCollection[parseInt(week.toString(), 10)][parseInt(row.toString(), 10)]).getTime());
        }
    }
    monthCollection = datas.length > 0 ? [datas] : [];
    return monthCollection;
}

/**
 * To filter date collection based on BYDAY Index, then BYSETPOS and to insert datas into existing collection
 *
 * @param {number[]} monthCollection Accepts the month date collections
 * @param {Date} startDate Accepts the start date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the date collections
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function insertDateCollectionBasedonIndex(monthCollection: number[][], startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext): void {
    const expectedDays: string[] = ruleObject.day;
    let state: boolean;
    let datas: number[] = [];
    let dateCollection: number[][] = [];
    const recurrenceCollections: RuleData = getRecurrenceCollection(monthCollection, expectedDays);
    monthCollection = recurrenceCollections.monthCollection;
    const index: number = recurrenceCollections.index;
    if (!isNullOrUndefined(ruleObject.setPosition)) {
        dateCollection = [(filterDateCollectionByIndex(monthCollection, index, datas))];
        insertDateCollectionBasedonBySetPos(dateCollection, state, startDate, endDate, data, ruleObject, ctx);

    } else {
        if (monthCollection.length > 0) {
            insertDatasIntoExistingCollection(monthCollection, state, startDate, endDate, data, ruleObject, ctx, index);
        }
    }
    datas = [];
}

/**
 * To filter date collection when BYDAY property having values with number
 *
 * @param {number[]} monthCollection Accepts the date collections
 * @param {number} index Accepts the index of date collections
 * @param {number[]} datas Accepts the collection of dates
 * @returns {number[]} Returns the collection of dates
 * @private
 */
function filterDateCollectionByIndex(monthCollection: number[][], index: number, datas: number[]): number[] {
    for (let week: number = 0; week < monthCollection[parseInt(index.toString(), 10)].length; week++) {
        datas.push(monthCollection[parseInt(index.toString(), 10)][parseInt(week.toString(), 10)]);
    }
    return datas;
}

/**
 * To insert processed date collection in final array element
 *
 * @param {boolean} state Accepts the state of the recurrence rule
 * @param {Date} startDate Accepts the start date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of date
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {number} dayData Accepts the date index
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function insertDateCollection(state: boolean, startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, dayData: number, ctx: RecurrenceContext): void {
    const expectedCount: number = getDateCount(startDate, ruleObject, ctx);
    const chDate: Date = new Date(dayData);
    state = validateRules(chDate, ruleObject, ctx);
    if ((chDate >= startDate) && compareDates(chDate, endDate) && state
        && expectedCount && (data.length + ruleObject.recExceptionCount) < expectedCount) {
        excludeDateHandler(data, dayData, ctx);
    }
}

/**
 * Return the last week number of given month and year.
 *
 * @param {number} year Accepts the Year in number format
 * @param {number} startDayOfWeek Accepts the start date
 * @param {number[]} monthCollection Accepts the collection of dates
 * @param {number} week Accepts the week in number format
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {number} returns week number
 * @private
 */
function weekCount(year: number, startDayOfWeek: number, monthCollection: number[][], week: number, ruleObject: RecRule, ctx: RecurrenceContext): number {
    const firstDayOfWeek: number = startDayOfWeek || 0;
    const firstOfMonth: Date = new Date(year, ruleObject.month[0] - 1, 1);
    const lastOfMonth: Date = new Date(year, ruleObject.month[0], 0);
    const numberOfDaysInMonth: number = lastOfMonth.getDate();
    const firstWeekDay: number = (firstOfMonth.getDay() - firstDayOfWeek + 7) % 7;
    const used: number = firstWeekDay + numberOfDaysInMonth;
    const count: number = Math.ceil(used / 7) - 1;
    const dayData: number = monthCollection[parseInt(week.toString(), 10)][parseInt(count.toString(), 10)];
    const chDate: Date = new Date(dayData);
    const state: boolean = validateRules(chDate, ruleObject, ctx);
    return (state) ? count : count - 1;
}

/**
 * To process date collection based on Byset position after process the collection based on BYDAY property value index: EX:BYDAY=1SUm-1SU
 *
 * @param {number[]} monthCollection Accepts the collection of dates
 * @param {boolean} state Accepts the state of the recurrence rule
 * @param {Date} startDate Accepts the start date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of date
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function insertDateCollectionBasedonBySetPos
(monthCollection: number[][], state: boolean, startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext)
    : void {
    if (monthCollection.length > 0) {
        for (let week: number = 0; week < monthCollection.length; week++) {
            monthCollection[parseInt(week.toString(), 10)].sort();
            const expectedDays: string[] = ruleObject.day;
            const isHavingNumber: boolean[] = expectedDays.map((item: string) => HASNUMBER.test(item));
            const weekIndex: number = (ruleObject.freq === 'YEARLY' && (ruleObject.validRules.indexOf('BYMONTH') > -1) &&
                !(isHavingNumber.indexOf(true) > -1)) ?
                weekCount(new Date(monthCollection[0][0]).getFullYear(), 0, monthCollection, week, ruleObject, ctx)
                : (monthCollection[parseInt(week.toString(), 10)].length + ruleObject.setPosition);
            const index: number = ((ruleObject.setPosition < 1) ? weekIndex : ruleObject.setPosition - 1);
            const dayData: number = monthCollection[parseInt(week.toString(), 10)][parseInt(index.toString(), 10)];
            insertDateCollection(state, startDate, endDate, data, ruleObject, dayData, ctx);
        }
    }
}

/**
 * To insert datas into existing collection which is processed from previous loop.
 *
 * @param {number[]} monthCollection Accepts the collection of dates
 * @param {boolean} state Accepts the state of the recurrence rule
 * @param {Date} startDate Accepts the start date
 * @param {Date} endDate Accepts the end date
 * @param {number[]} data Accepts the collection of date
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @param {number} index Accepts the index value
 * @returns {void}
 * @private
 */
function insertDatasIntoExistingCollection(monthCollection: number[][], state: boolean, startDate: Date, endDate: Date, data: number[], ruleObject: RecRule, ctx: RecurrenceContext, index?: number): void {
    if (monthCollection.length > 0) {
        index = !isNullOrUndefined(index) ? index :
            ((ruleObject.setPosition < 1)
                ? (monthCollection.length + ruleObject.setPosition) : ruleObject.setPosition - 1);
        monthCollection[parseInt(index.toString(), 10)].sort();
        for (let week: number = 0; week < monthCollection[parseInt(index.toString(), 10)].length; week++) {
            const dayData: number = monthCollection[parseInt(index.toString(), 10)][parseInt(week.toString(), 10)];
            insertDateCollection(state, startDate, endDate, data, ruleObject, dayData, ctx);
        }
    }
}

/**
 * Internal method to compare dates
 *
 * @param {Date} startDate Accepts the start date
 * @param {Date} endDate Accepts the end date
 * @returns {boolean} Returns the result of checking start and end dates
 * @private
 */
function compareDates(startDate: Date, endDate: Date): boolean {
    return endDate ? (startDate <= endDate) : true;
}

/**
 * Internal method to get day string
 *
 * @param {string} expectedDays Accepts the exception date string
 * @returns {string} Returns the valid string
 * @private
 */
function getDayString(expectedDays: string): string {
    // To get BYDAY value without numeric value
    const newstr: string = expectedDays.replace(REMOVENUMBERINSTRING, '');
    return newstr;
}

/**
 * Internal method to check day index
 *
 * @param {number} day Accepts the day index
 * @param {string[]} expectedDays Accepts the exception dates
 * @returns {boolean} Returns the index date
 * @private
 */
function checkDayIndex(day: number, expectedDays: string[]): boolean {
    const sortedExpectedDays: string[] = [];
    expectedDays.forEach((element: string) => {
        const expectedDaysNumberSplit: string[] = element.match(SPLITNUMBERANDSTRING);
        if (expectedDaysNumberSplit.length === 2) {
            sortedExpectedDays.push(expectedDaysNumberSplit[1]);
        } else {
            sortedExpectedDays.push(expectedDaysNumberSplit[0]);
        }
    });
    return (sortedExpectedDays.indexOf(DAYINDEX[parseInt(day.toString(), 10)]) === -1);
}

/**
 * Internal method to get start date of week
 *
 * @param {Date} startDate Accepts the start date
 * @param {string[]} expectedDays Accepts the exception dates
 * @returns {Date} Return the week start date
 * @private
 */
function getStartDateForWeek(startDate: Date, expectedDays: string[]): Date {
    const tempDate: Date = new Date(startDate.getTime());
    let newstr: string;
    if (expectedDays.length > 0) {
        const expectedDaysArr: string[] = [];
        for (let i: number = 0; i <= expectedDays.length - 1; i++) {
            newstr = getDayString(expectedDays[parseInt(i.toString(), 10)]);
            expectedDaysArr.push(newstr);
        }
        if (expectedDaysArr.indexOf(DAYINDEX[tempDate.getDay()]) === -1) {
            do {
                tempDate.setDate(tempDate.getDate() + 1);
            } while (expectedDaysArr.indexOf(DAYINDEX[tempDate.getDay()]) === -1);
        }
    }
    return tempDate;
}

/**
 * Method to generate recurrence rule object from given rule
 *
 * @param {string} rules Accepts the recurrence rule
 * @returns {RecRule} Returns the recurrence rule object
 */
export function extractObjectFromRule(rules: string): RecRule {
    const ruleObject: RecRule = {
        freq: null,
        interval: 1,
        count: null,
        until: null,
        day: [],
        wkst: null,
        month: [],
        weekNo: [],
        monthDay: [],
        yearDay: [],
        setPosition: null,
        validRules: []
    };
    const rulesList: string[] = rules.split(';');
    let splitData: string[] = [];
    let temp: string;
    rulesList.forEach((data: string) => {
        splitData = data.split('=');
        switch (splitData[0]) {
        case 'UNTIL':
            temp = splitData[1];
            ruleObject.until = getDateFromRecurrenceDateString(temp);
            break;
        case 'BYDAY':
            ruleObject.day = splitData[1].split(',');
            ruleObject.validRules.push(splitData[0]);
            break;
        case 'BYMONTHDAY':
            ruleObject.monthDay = splitData[1].split(',').map(Number);
            ruleObject.validRules.push(splitData[0]);
            break;
        case 'BYMONTH':
            ruleObject.month = splitData[1].split(',').map(Number);
            ruleObject.validRules.push(splitData[0]);
            break;
        case 'BYYEARDAY':
            ruleObject.yearDay = splitData[1].split(',').map(Number);
            ruleObject.validRules.push(splitData[0]);
            break;
        case 'BYWEEKNO':
            ruleObject.weekNo = splitData[1].split(',').map(Number);
            ruleObject.validRules.push(splitData[0]);
            break;
        case 'INTERVAL':
            ruleObject.interval = parseInt(splitData[1], 10);
            break;
        case 'COUNT':
            ruleObject.count = parseInt(splitData[1], 10);
            break;
        case 'BYSETPOS':
            ruleObject.setPosition = parseInt(splitData[1], 10) > 4 ? -1 : parseInt(splitData[1], 10);
            break;
        case 'FREQ':
            ruleObject.freq = <FreqType>splitData[1];
            break;
        case 'WKST':
            ruleObject.wkst = splitData[1];
            break;
        }
    });
    if ((ruleObject.freq === 'MONTHLY') && (ruleObject.monthDay.length === 0)) {
        const index: number = ruleObject.validRules.indexOf('BYDAY');
        ruleObject.validRules.splice(index, 1);
    }
    return ruleObject;
}

/**
 * Internal method to validate proper date
 *
 * @param {Date} tempDate Accepts the date value
 * @param {number} data Accepts the data value
 * @param {Date} startDate Accepts the start date
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {boolean} Returns the result of date validate
 * @private
 */
function validateProperDate(tempDate: Date, data: number, startDate: Date, ctx: RecurrenceContext): boolean {
    const maxDate: number = ctx.calendarUtil.getMonthDaysCount(tempDate);
    return (data <= maxDate) && (tempDate >= startDate);
}

/**
 * Internal method to process week days
 *
 * @param {string[]} expectedDays Accepts the expection dates
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {Object} Returns the weekdays object
 * @private
 */
function processWeekDays(expectedDays: string[], ctx: RecurrenceContext): { [key: string]: number } {
    const dayCycle: { [key: string]: number } = {};
    expectedDays.forEach((element: string, index: number) => {
        if (index === expectedDays.length - 1) {
            const startIndex: number = ctx.dayIndex.indexOf(element);
            let temp: number = startIndex;
            while (temp % 7 !== ctx.dayIndex.indexOf(expectedDays[0])) {
                temp++;
            }
            dayCycle[`${element}`] = temp - startIndex;
        } else {
            dayCycle[`${element}`] = ctx.dayIndex.indexOf(expectedDays[(<number>index + 1)]) - ctx.dayIndex.indexOf(element);
        }
    });
    return dayCycle;
}

/**
 * Internal method to check date
 *
 * @param {Date} tempDate Accepts the date value
 * @param {number[]} expectedDate Accepts the exception dates
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {boolean} Returns the boolean value
 * @private
 */
function checkDate(tempDate: Date, expectedDate: number[], ctx: RecurrenceContext): boolean {
    const temp: number[] = expectedDate.slice(0);
    let data: number;
    const maxDate: number = ctx.calendarUtil.getMonthDaysCount(tempDate);
    data = temp.shift();
    while (data) {
        if (data < 0) {
            data = <number>data + maxDate + 1;
        }
        if (data === tempDate.getDate()) {
            return false;
        }
        data = temp.shift();
    }
    return true;
}

/**
 * Internal method to check the year value
 *
 * @param {Date} tempDate Accepts the date value
 * @param {number[]} expectedyearDay Accepts the exception dates in year
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {boolean} Returns the boolean value
 * @private
 */
function checkYear(tempDate: Date, expectedyearDay: number[], ctx: RecurrenceContext): boolean {
    const temp: number[] = expectedyearDay.slice(0);
    let data: number;
    const yearDay: number = getYearDay(tempDate, ctx);
    data = temp.shift();
    while (data) {
        if (data < 0) {
            data = <number>data + ctx.calendarUtil.getYearDaysCount(tempDate, 0) + 1;
        }
        if (data === yearDay) {
            return false;
        }
        data = temp.shift();
    }
    return true;
}

/**
 * Internal method to get the year day
 *
 * @param {Date} currentDate Accepts the date value
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {number} Returns the boolean value
 * @private
 */
function getYearDay(currentDate: Date, ctx: RecurrenceContext): number {
    if (!ctx.startDateCollection[ctx.calendarUtil.getFullYear(currentDate)]) {
        ctx.startDateCollection[ctx.calendarUtil.getFullYear(currentDate)] = ctx.calendarUtil.getYearLastDate(currentDate, 0);
    }
    const tempDate: Date = ctx.startDateCollection[ctx.calendarUtil.getFullYear(currentDate)];
    const diff: number = currentDate.getTime() - tempDate.getTime();
    return Math.ceil(diff / MS_PER_DAY);
}

/**
 * Internal method to validate monthly rule type
 *
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @returns {MonthlyType} Returns the monthly type object
 * @private
 */
function validateMonthlyRuleType(ruleObject: RecRule): MonthlyType {
    if (ruleObject.monthDay.length && !ruleObject.day.length) {
        return 'date';
    } else if (!ruleObject.monthDay.length && ruleObject.day.length) {
        return 'day';
    }
    return 'both';
}

/**
 * Internal method to re-order the week days based on first day of week
 *
 * @param {string[]} days Accepts the week days value
 * @returns {void}
 * @private
 */
function rotate(days: string[]): void {
    const data: string = days.shift();
    days.push(data);
}

/**
 * Internal method to set first day of week
 *
 * @param {string} day Accepts the first day string
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {void}
 * @private
 */
function setFirstDayOfWeek(day: string, ctx: RecurrenceContext): void {
    while (ctx.dayIndex[0] !== day) {
        rotate(ctx.dayIndex);
    }
}

/**
 * Internal method to validate recurrence rule
 *
 * @param {Date} tempDate Accepts the date value
 * @param {RecRule} ruleObject Accepts the recurrence rule object
 * @param {RecurrenceContext} ctx The recurrence context
 * @returns {boolean} Returns the boolean value
 * @private
 */
function validateRules(tempDate: Date, ruleObject: RecRule, ctx: RecurrenceContext): boolean {
    let state: boolean = true;
    const expectedDays: string[] = ruleObject.day;
    const expectedMonth: number[] = ruleObject.month;
    const expectedDate: number[] = ctx.calendarUtil.getExpectedDays(tempDate, ruleObject.monthDay);
    const expectedyearDay: number[] = ruleObject.yearDay;
    ruleObject.validRules.forEach((rule: string) => {
        switch (rule) {
        case 'BYDAY':
            if (checkDayIndex(tempDate.getDay(), expectedDays)) {
                state = false;
            }
            break;
        case 'BYMONTH':
            if (ctx.calendarUtil.checkMonth(tempDate, expectedMonth)) {
                state = false;
            }
            break;
        case 'BYMONTHDAY':
            if (checkDate(tempDate, expectedDate, ctx)) {
                state = false;
            }
            break;
        case 'BYYEARDAY':
            if (checkYear(tempDate, expectedyearDay, ctx)) {
                state = false;
            }
            break;
        }
    });
    return state;
}

/**
 * Internal method to get calendar util
 *
 * @param {string} calendarMode Accepts the calendar type object
 * @returns {CalendarUtil} Returns the calendar util object
 * @private
 */
export function getCalendarUtil(calendarMode: string): CalendarUtil {
    if (calendarMode === 'Gregorian') {
        return new Gregorian();
    }
    return new Gregorian();
}

/** @private */
export interface RecRule {
    freq: FreqType;
    interval: number;
    count: number;
    until: Date;
    day: string[];
    wkst: string;
    month: number[];
    weekNo: number[];
    monthDay: number[];
    yearDay: number[];
    setPosition: number;
    validRules: string[];
    recExceptionCount?: number;
}

// Variables which are used for recurrence date generation
interface RuleData {
    monthCollection?: number[][];
    index?: number;
    tempDate?: Date;
    mainDate?: Date;
    expectedCount?: number;
    monthInit?: number;
    date?: number;
    dateCollection?: number[][];
    beginDate?: Date;
    state?: boolean;
}

/**
 * Recurrence generation context - holds all mutable state for a single generation operation
 * This ensures thread-safety and testability by eliminating module-level mutable state
 *
 * @private
 */
interface RecurrenceContext {
    tempExcludeDate: number[];
    maxOccurrence: number;
    tempViewDate: Date | null;
    calendarUtil: CalendarUtil;
    dayIndex: string[];
    startDateCollection: { [key: string]: Date };
}

/** @private */
type MonthlyType = 'date' | 'day' | 'both';
type YearRuleType = 'MONTH' | 'WEEKNO' | 'YEARDAY';
const DAYINDEX: string[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MAXOCCURRENCE: number = 43;

/**
 * Creates an isolated context for recurrence generation
 *
 * @param {string} calendarMode - Calendar system to use (default: 'Gregorian')
 * @param {number} maximumCount - Maximum number of occurrences to generate
 * @returns {RecurrenceContext} A new context with initialized state
 * @private
 */
function createContext(calendarMode: string, maximumCount: number): RecurrenceContext {
    return {
        tempExcludeDate: [],
        maxOccurrence: maximumCount,
        tempViewDate: null,
        calendarUtil: getCalendarUtil(calendarMode),
        dayIndex: [...DAYINDEX], // Mutable copy for rotation
        startDateCollection: {}
    };
}
const WEEKPOS: string[] = ['first', 'second', 'third', 'fourth', 'last'];
const TIMES: string = 'summaryTimes';
const ON: string = 'summaryOn';
const EVERY: string = 'every';
const UNTIL: string = 'summaryUntil';
const DAYS: string = 'summaryDay';
const WEEKS: string = 'summaryWeek';
const MONTHS: string = 'summaryMonth';
const YEARS: string = 'summaryYear';
const DAYINDEXOBJECT: { [key: string]: string } = {
    SU: 'sun',
    MO: 'mon',
    TU: 'tue',
    WE: 'wed',
    TH: 'thu',
    FR: 'fri',
    SA: 'sat'
};

// To check string has number
const HASNUMBER: RegExp = /\d/;

// To find the numbers in string
const REMOVENUMBERINSTRING: RegExp = /[^A-Z]+/;

// To split number and string
const SPLITNUMBERANDSTRING: RegExp = /[a-z]+|[^a-z]+/gi;
