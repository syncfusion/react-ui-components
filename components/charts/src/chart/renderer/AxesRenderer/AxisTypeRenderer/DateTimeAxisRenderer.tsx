import { getDateFormat, getDateParser } from '@syncfusion/react-base/src/internationalization';
import { ChartFontProps } from '../../../base/interfaces';
import { DateFormatOptions } from '../../../chart-axis/base';
import { calculateNumericNiceInterval, calculateRange, createDoubleRange, getRangePadding, triggerLabelRender, triggerRangeRender, DoubleRange } from './DoubleAxisRenderer';
import { DataUtil } from '@syncfusion/react-data/src/util';
import { firstToLowerCase, isZoomSet, setRange, withIn } from '../../../utils/helper';
import { ChartRangePadding, IntervalType } from '../../../base/enum';
import { extend, isNullOrUndefined } from '@syncfusion/react-base';
import { calculateVisibleRangeOnZooming, getMaxLabelWidth } from './AxisUtils';
import { AxisModel, Chart, ChartSizeProps, Points, SeriesProperties, VisibleRangeProps } from '../../../chart-area/chart-interfaces';

/**
 * Calculates the range and interval for a DateTime axis within a chart.
 * This involves adjusting the axis properties based on the chart size and configuration.
 *
 * @param {Size} size - The dimensions of the chart area, which influence axis calculations.
 * @param {AxisModel} axis - The axis model to be calculated, containing data and settings.
 * @param {Chart} chart - The chart instance that includes the axis and other relevant properties.
 * @returns {void} This function modifies axis properties related to range and interval without returning a value.
 * @private
 */
export function calculateDateTimeAxis(size: ChartSizeProps, axis: AxisModel, chart: Chart): void {
    calculateRangeAndInterval(size, axis, chart);
}

/**
 * Calculates the range and interval for an axis based on the provided chart size and configuration.
 * This adjusts the axis range and interval properties according to the chart's needs.
 *
 * @param {Size} size - The overall size of the chart, affecting the range and interval calculations.
 * @param {AxisModel} axis - The axis model for which the range and interval are calculated.
 * @param {Chart} chart - The chart context that contains the axis and its configuration.
 * @returns {void} This function updates properties on the axis for range and interval; it does not return a value.
 * @private
 */
function calculateRangeAndInterval(size: ChartSizeProps, axis: AxisModel, chart: Chart): void {
    const dateTimeRange: DoubleRange = {
        min: null,
        max: null
    };
    calculateRange(axis, chart, dateTimeRange as Required<DoubleRange>);
    getActualRange(axis, size, dateTimeRange as Required<DoubleRange>);
    applyRangePadding(axis, size, dateTimeRange as Required<DoubleRange>);
    calculateVisibleLabels(axis, axis.chart);
}

/**
 * Calculates the actual range for the DateTime axis.
 *
 * @private
 * @param {AxisModel} axis - The axis for which the actual range is calculated.
 * @param {Size} size - The size used for calculation.
 * @param {DoubleRange} dateTimeRange - The range for datetime calculations.
 * @returns {void}
 * @private
 */
function getActualRange(axis: AxisModel, size: ChartSizeProps, dateTimeRange: DoubleRange): void {
    const option: DateFormatOptions = {
        skeleton: 'full',
        type: 'dateTime',
        locale: axis.chart.locale
    };
    const dateParser: Function = getDateParser(option);
    const dateFormatter: Function = getDateFormat(option);
    // Axis min
    if (!isNullOrUndefined(axis.minimum)) {
        dateTimeRange.min = Date.parse(dateParser(dateFormatter(new Date(
            (DataUtil.parse as Required<typeof DataUtil.parse>).parseJson({ val: axis.minimum }).val
        ))));
    } else if (isNullOrUndefined(dateTimeRange.min) || dateTimeRange.min === Number.POSITIVE_INFINITY) {
        dateTimeRange.min = Date.parse(dateParser(dateFormatter(new Date(1970, 1, 1))));
    }
    // Axis Max
    if (!isNullOrUndefined(axis.maximum)) {
        dateTimeRange.max = Date.parse(dateParser(dateFormatter(new Date(
            (DataUtil.parse as Required<typeof DataUtil.parse>).parseJson({ val: axis.maximum }).val
        ))));
    } else if (isNullOrUndefined(dateTimeRange.max) || dateTimeRange.max === Number.NEGATIVE_INFINITY) {
        dateTimeRange.max = Date.parse(dateParser(dateFormatter(new Date(1970, 5, 1))));
    }

    if (dateTimeRange.min === dateTimeRange.max) {
        const MONTH_IN_MILLISECONDS: number = 2592000000;
        dateTimeRange.max = dateTimeRange.max as Required<number> + MONTH_IN_MILLISECONDS;
        dateTimeRange.min = dateTimeRange.min as Required<number> - MONTH_IN_MILLISECONDS;
    }
    axis.actualRange = {} as Required<VisibleRangeProps>;
    axis.doubleRange = createDoubleRange(dateTimeRange.min as Required<number>, dateTimeRange.max as Required<number>);
    const datetimeInterval: number = calculateDateTimeNiceInterval(axis, size, axis.doubleRange.start, axis.doubleRange.end);

    if (!axis.interval) {
        axis.actualRange.interval = datetimeInterval;
    } else {
        axis.actualRange.interval = axis.interval;
    }
    axis.actualRange.minimum = axis.doubleRange.start;
    axis.actualRange.maximum = axis.doubleRange.end;
}

/**
 * Returns all series that are bound to the given x-axis.
 *
 * @param {AxisModel} axis - The x-axis whose bound series should be resolved.
 * @returns {SeriesProperties[]} An array of series bound to the provided axis (may be empty).
 */
function getSeriesOnAxis(axis: AxisModel): SeriesProperties[] {
    const seriesInAxis: SeriesProperties[] = axis.series as SeriesProperties[];
    if (Array.isArray(seriesInAxis) && seriesInAxis.length) { return seriesInAxis; }

    if (axis.chart && Array.isArray(axis.chart.visibleSeries)) {
        return axis.chart.visibleSeries.filter((currentSeries: SeriesProperties) => currentSeries.xAxis === axis);
    }
    return [];
}

/**
 * Determines whether the given axis contains financial (rect-style) candle & OHLC series.
 *
 * @param {AxisModel} axis - The axis to inspect.
 * @returns {boolean} True if at least one Candle or HiloOpenClose series is bound to the axis; otherwise false.
 */
function hasFinancialSeries(axis: AxisModel): boolean {
    return getSeriesOnAxis(axis).some((series: SeriesProperties) => (series?.type === 'Candle' || series?.type === 'HiloOpenClose'));
}

/**
 * Computes half of the smallest adjacent x-distance (in milliseconds) among
 * all Candle/HiloOpenClose series bound to the given axis.
 *
 *
 * @param {AxisModel} axis - The axis for which to compute the half-slot.
 * @returns {number} Half of the minimum adjacent x-distance in milliseconds; 0 if not applicable.
 */
function getHalfCandleSlotMs(axis: AxisModel): number {
    const seriesList: SeriesProperties[] = getSeriesOnAxis(axis).filter((series: SeriesProperties) => (series?.type === 'Candle' || series?.type === 'HiloOpenClose'));
    if (!seriesList.length) { return 0; }

    let minDelta: number = Number.POSITIVE_INFINITY;
    for (const series of seriesList) {
        const pointsInSeries: Points[] = Array.isArray(series.points) ? series.points : [];
        for (let i: number = 1; i < pointsInSeries.length; i++) {
            const previousPoint: number = Number(pointsInSeries[i - 1]?.xValue);
            const currentPoint: number = Number(pointsInSeries[i as number]?.xValue);
            if (isFinite(previousPoint) && isFinite(currentPoint)) {
                const delta: number = Math.abs(currentPoint - previousPoint);
                if (delta > 0 && delta < minDelta) { minDelta = delta; }
            }
        }
    }
    if (!isFinite(minDelta) || minDelta === Number.POSITIVE_INFINITY) { return 0; }
    return Math.max(0, Math.floor(minDelta / 2)) + 1;
}
/**
 * Apply padding for the range.
 *
 * @private
 * @param {AxisModel} axis - The axis for which padding is applied.
 * @param {Size} size - The size of the chart area.
 * @param {DoubleRange} dateTimeRange - The range for which padding is applied.
 * @returns {void}
 */
function applyRangePadding(axis: AxisModel, size: ChartSizeProps, dateTimeRange: DoubleRange ): void {
    dateTimeRange.min = (axis.actualRange.minimum); dateTimeRange.max = (axis.actualRange.maximum);
    let minimum: Date; let maximum: Date;
    const interval: number = axis.actualRange.interval;
    if (!setRange(axis)) {
        const rangePadding: string = getRangePadding(axis, axis.chart);
        minimum = new Date(dateTimeRange.min); maximum = new Date(dateTimeRange.max);
        const intervalType: IntervalType = axis.actualIntervalType;
        if (rangePadding === 'None') {
            dateTimeRange.min = minimum.getTime();
            dateTimeRange.max = maximum.getTime();
        } else if (rangePadding === 'Additional' || rangePadding === 'Round') {
            switch (intervalType) {
            case 'Years':
                getYear(minimum, maximum, rangePadding, interval, dateTimeRange);
                break;
            case 'Months':
                getMonth(minimum, maximum, rangePadding, interval, dateTimeRange);
                break;
            case 'Days':
                getDay(minimum, maximum, rangePadding, interval, dateTimeRange);
                break;
            case 'Hours':
                getHour(minimum, maximum, rangePadding, interval, dateTimeRange);
                break;
            case 'Minutes': {
                const minute: number = (minimum.getMinutes() / interval) * interval;
                const endMinute: number = maximum.getMinutes() + (minimum.getMinutes() - minute);
                if (rangePadding === 'Round') {
                    dateTimeRange.min = (
                        new Date(
                            minimum.getFullYear(), minimum.getMonth(), minimum.getDate(),
                            minimum.getHours(), minute, 0
                        )
                    ).getTime();
                    dateTimeRange.max = (
                        new Date(
                            maximum.getFullYear(), maximum.getMonth(), maximum.getDate(),
                            maximum.getHours(), endMinute, 59
                        )
                    ).getTime();
                } else {
                    dateTimeRange.min = (
                        new Date(
                            minimum.getFullYear(), minimum.getMonth(), minimum.getDate(),
                            minimum.getHours(), minute + (-interval), 0
                        )
                    ).getTime();
                    dateTimeRange.max = (
                        new Date(
                            maximum.getFullYear(), maximum.getMonth(),
                            maximum.getDate(), maximum.getHours(), endMinute + (interval), 0
                        )
                    ).getTime();
                }
                break;
            }
            case 'Seconds': {
                const second: number = (minimum.getSeconds() / interval) * interval;
                const endSecond: number = maximum.getSeconds() + (minimum.getSeconds() - second);
                if (rangePadding === 'Round') {
                    dateTimeRange.min = (
                        new Date(
                            minimum.getFullYear(), minimum.getMonth(), minimum.getDate(),
                            minimum.getHours(), minimum.getMinutes(), second, 0
                        )
                    ).getTime();
                    dateTimeRange.max = (
                        new Date(
                            maximum.getFullYear(), maximum.getMonth(), maximum.getDate(),
                            maximum.getHours(), maximum.getMinutes(), endSecond, 0
                        )
                    ).getTime();
                } else {
                    dateTimeRange.min = (
                        new Date(
                            minimum.getFullYear(), minimum.getMonth(), minimum.getDate(),
                            minimum.getHours(), minimum.getMinutes(), second + (-interval), 0
                        )
                    ).getTime();
                    dateTimeRange.max = (
                        new Date(
                            maximum.getFullYear(), maximum.getMonth(), maximum.getDate(),
                            maximum.getHours(), maximum.getMinutes(), endSecond + (interval), 0
                        )).getTime();
                }
                break;
            }
            }
        }
    }
    // Candle-only symmetric half-slot padding in time-domain
    try {
        if (hasFinancialSeries(axis)) {
            const halfSlot: number = getHalfCandleSlotMs(axis);
            if (halfSlot > 0) {
                dateTimeRange.min = (dateTimeRange.min as number) - halfSlot;
                dateTimeRange.max = (dateTimeRange.max as number) + halfSlot;
            }
        }
    } catch {
        // no-op
    }
    axis.actualRange.minimum = !isNullOrUndefined(axis.minimum) ? dateTimeRange.min : dateTimeRange.min;
    axis.actualRange.maximum = !isNullOrUndefined(axis.maximum) ? dateTimeRange.max : dateTimeRange.max;
    axis.actualRange.delta = (axis.actualRange.maximum - axis.actualRange.minimum);
    axis.doubleRange = createDoubleRange(axis.actualRange.minimum, axis.actualRange.maximum);
    calculateVisibleRange(axis, size);
}

/**
 * Calculate visible labels for the axis.
 *
 * @param {AxisModel} axis axis
 * @param {Chart} chart chart
 * @returns {void}
 * @private
 */
function calculateVisibleLabels(axis: AxisModel, chart: Chart): void {
    axis.visibleLabels = [];
    let tempInterval: number = axis.visibleRange.minimum;
    let labelStyle: ChartFontProps;
    let startValue: number = 0;
    if (isNullOrUndefined(axis.minimum)) {
        tempInterval = alignRangeStart(axis, tempInterval, axis.visibleRange.interval).getTime();
    }
    if (startValue && startValue < tempInterval) {
        tempInterval = startValue;
    }
    else {
        startValue = tempInterval;
    }
    while (tempInterval <= axis.visibleRange.maximum) {
        labelStyle = (extend({}, axis.labelStyle, undefined, true));
        const option: DateFormatOptions = {
            locale: axis.chart.locale,
            format: findCustomFormats(axis),
            type: firstToLowerCase(axis.skeletonType as string),
            skeleton: getSkeleton(axis)
        };
        axis.format = getDateFormat(option);
        axis.startLabel = axis.format(new Date(axis.visibleRange.minimum));
        axis.endLabel = axis.format(new Date(axis.visibleRange.maximum));
        if (withIn(tempInterval, axis.visibleRange)) {
            const interval: number = increaseDateTimeInterval(axis, tempInterval, axis.visibleRange.interval).getTime();
            if (interval > axis.visibleRange.maximum) {
                axis.endLabel = axis.format(new Date(tempInterval));
            }
            triggerLabelRender(tempInterval, axis.format(new Date(tempInterval)), labelStyle, axis);
        }
        const actualInterval: number = tempInterval;
        tempInterval = increaseDateTimeInterval(axis, tempInterval, axis.visibleRange.interval).getTime();
        if (actualInterval === tempInterval) {
            break;
        }
    }
    //tooltip and crosshair formats for 'Months' and 'Days' interval types
    if ((axis.actualIntervalType === 'Months' || axis.actualIntervalType === 'Days')) {
        const option: DateFormatOptions = {
            locale: chart.locale,
            format: axis.labelStyle.format || (axis.actualIntervalType === 'Months' && !axis.skeleton ? 'y MMM' : ''),
            type: firstToLowerCase(axis.skeletonType as string),
            skeleton: axis.skeleton || (axis.actualIntervalType === 'Days' ? 'MMMd' : '')
        };
        axis.format = getDateFormat(option);
    }
    getMaxLabelWidth(chart, axis);

}
/**
 * Aligns the range start based on the axis and interval size.
 *
 * @param {AxisModel} axis - The axis model containing axis settings and interval type information.
 * @param {number} sDate - The start date in milliseconds to be aligned.
 * @param {number} intervalSize - The size of the interval used for alignment calculation.
 * @returns {Date} The aligned start date based on the interval type and size.
 * @private
 */
function alignRangeStart(axis: AxisModel, sDate: number, intervalSize: number): Date {
    let sResult: Date = new Date(sDate);
    switch (axis.actualIntervalType) {
    case 'Years': {
        const year: number = Math.floor(Math.floor(sResult.getFullYear() / intervalSize) * intervalSize);
        sResult = new Date(year, sResult.getMonth(), sResult.getDate(), 0, 0, 0);
        return sResult;
    }
    case 'Months': {
        const month: number = Math.floor(Math.floor((sResult.getMonth()) / intervalSize) * intervalSize);
        sResult = new Date(sResult.getFullYear(), month, sResult.getDate(), 0, 0, 0);
        return sResult;
    }
    case 'Days': {
        const day: number = Math.floor(Math.floor((sResult.getDate()) / intervalSize) * intervalSize);
        sResult = new Date(sResult.getFullYear(), sResult.getMonth(), day, 0, 0, 0);
        return sResult;
    }
    case 'Hours': {
        const hour: number = Math.floor(Math.floor((sResult.getHours()) / intervalSize) * intervalSize);
        sResult = new Date(sResult.getFullYear(), sResult.getMonth(), sResult.getDate(), hour, 0, 0);
        return sResult;
    }
    case 'Minutes': {
        const minutes: number = Math.floor(Math.floor((sResult.getMinutes()) / intervalSize) * intervalSize);
        sResult = new Date(sResult.getFullYear(), sResult.getMonth(), sResult.getDate(), sResult.getHours(), minutes, 0, 0);
        return sResult;
    }
    case 'Seconds': {
        const seconds: number = Math.floor(Math.floor((sResult.getSeconds()) / intervalSize) * intervalSize);
        sResult = new Date(
            sResult.getFullYear(), sResult.getMonth(), sResult.getDate(),
            sResult.getHours(), sResult.getMinutes(), seconds, 0
        );
        return sResult;
    }
    }
    return sResult;
}

/**
 * Method to calculate numeric datetime interval.
 *
 * @param {AxisModel} axis - The axis for which to calculate the interval.
 * @param {Size} size - The size of the axis.
 * @param {number} start - The start value of the axis.
 * @param {number} end - The end value of the axis.
 * @returns {number} - The calculated numeric datetime interval.
 * @private
 */
export function calculateDateTimeNiceInterval(axis: AxisModel, size: ChartSizeProps, start: number, end: number): number {
    const oneDay: number = 24 * 60 * 60 * 1000;
    const DAYS_IN_YEAR: number = 365;
    const DAYS_IN_MONTH: number = 30;
    const startDate: Date = new Date(start);
    const endDate: Date = new Date(end);
    //var axisInterval ;
    const totalDays: number = (Math.abs((startDate.getTime() - endDate.getTime()) / (oneDay)));
    let interval: number;
    axis.actualIntervalType = axis.intervalType as IntervalType;
    const type: IntervalType = axis.intervalType as IntervalType;
    switch (type) {
    case 'Years':
        interval = calculateNumericNiceInterval(axis, totalDays / DAYS_IN_YEAR, size);
        break;
    case 'Months':
        interval = calculateNumericNiceInterval(axis, totalDays / DAYS_IN_MONTH, size);
        break;
    case 'Days':
        interval = calculateNumericNiceInterval(axis, totalDays, size);
        break;
    case 'Hours':
        interval = calculateNumericNiceInterval(axis, totalDays * 24, size);
        break;
    case 'Minutes':
        interval = calculateNumericNiceInterval(axis, totalDays * 24 * 60, size);
        break;
    case 'Seconds':
        interval = calculateNumericNiceInterval(axis, totalDays * 24 * 60 * 60, size);
        break;
    case 'Auto':
        interval = calculateNumericNiceInterval(axis, totalDays / DAYS_IN_YEAR, size);
        if (interval >= 1) {
            axis.actualIntervalType = 'Years';
            return interval;
        }

        interval = calculateNumericNiceInterval(axis, totalDays / DAYS_IN_MONTH, size);
        if (interval >= 1) {
            axis.actualIntervalType = 'Months';
            return interval;
        }

        interval = calculateNumericNiceInterval(axis, totalDays / 7, size);

        interval = calculateNumericNiceInterval(axis, totalDays, size);
        if (interval >= 1) {
            axis.actualIntervalType = 'Days';
            return interval;
        }

        interval = calculateNumericNiceInterval(axis, totalDays * 24, size);
        if (interval >= 1) {
            axis.actualIntervalType = 'Hours';
            return interval;
        }

        interval = calculateNumericNiceInterval(axis, totalDays * 24 * 60, size);
        if (interval >= 1) {
            axis.actualIntervalType = 'Minutes';
            return interval;
        }

        interval = calculateNumericNiceInterval(axis, totalDays * 24 * 60 * 60, size);
        axis.actualIntervalType = 'Seconds';
        return interval;
    }
    return interval;
}

/**
 * Calculate visible range for axis.
 *
 * @private
 * @param {AxisModel} axis - The axis for which the visible range is calculated.
 * @param {Size} size - The size of the chart area.
 * @returns {void}
 */
function calculateVisibleRange(axis: AxisModel, size: ChartSizeProps): void {

    axis.visibleRange = {
        minimum: axis.actualRange.minimum,
        maximum: axis.actualRange.maximum,
        interval: axis.actualRange.interval,
        delta: axis.actualRange.delta
    };
    //const isLazyLoad : boolean = isNullOrUndefined(axis.zoomingScrollBar) ? false : axis.zoomingScrollBar.isLazyLoad;
    if (isZoomSet(axis)) {
        calculateVisibleRangeOnZooming(axis);
        axis.visibleRange.interval = calculateDateTimeNiceInterval(axis, size, axis.visibleRange.minimum, axis.visibleRange.maximum);
        try {
            if (hasFinancialSeries(axis)) {
                const halfSlot: number = getHalfCandleSlotMs(axis);
                if (halfSlot > 0) {
                    axis.visibleRange.minimum -= halfSlot;
                    axis.visibleRange.maximum += halfSlot;
                    axis.visibleRange.delta = axis.visibleRange.maximum - axis.visibleRange.minimum;
                }
            }
        } catch {
            // no-op
        }
    }
    axis.dateTimeInterval = increaseDateTimeInterval(axis, axis.visibleRange.minimum, axis.visibleRange.interval).getTime()
        - axis.visibleRange.minimum;
    triggerRangeRender(axis.visibleRange.minimum, axis.visibleRange.maximum, axis.visibleRange.interval, axis);
}

/**
 * Increase the date-time interval.
 *
 * @param {AxisModel} axis - The axis for which the interval is increased.
 * @param {number} value - The value of the interval.
 * @param {number} interval - The interval to increase.
 * @returns {Date} - The increased date-time interval.
 * @private
 */
function increaseDateTimeInterval(axis: AxisModel, value: number, interval: number): Date {
    let result: Date = new Date(value);
    if (axis.interval) {
        axis.isIntervalInDecimal = (interval % 1) === 0;
        axis.visibleRange.interval = interval;
    } else {
        interval = Math.ceil(interval);
        axis.visibleRange.interval = interval;
    }
    const intervalType: IntervalType = axis.actualIntervalType as IntervalType;
    if (axis.isIntervalInDecimal) {
        switch (intervalType) {
        case 'Years':
            result.setFullYear(result.getFullYear() + interval);
            return result;
        case 'Months':
            result.setMonth(result.getMonth() + interval);
            return result;
        case 'Days':
            result.setDate(result.getDate() + interval);
            return result;
        case 'Hours':
            result.setHours(result.getHours() + interval);
            return result;
        case 'Minutes':
            result.setMinutes(result.getMinutes() + interval);
            return result;
        case 'Seconds':
            result.setSeconds(result.getSeconds() + interval);
            return result;
        }
    } else {
        result = getDecimalInterval(result, interval, intervalType);
    }
    return result;
}

/**
 * Calculates the decimal interval based on the given date, interval, and interval type.
 *
 * @param {Date} result - The initial date to adjust.
 * @param {number} interval - The interval value with decimal component.
 * @param {IntervalType} intervalType - The type of the interval (Years, Months, Days, Hours, Minutes, Seconds).
 * @returns {Date} The adjusted date based on the interval calculation.
 * @private
 */
function getDecimalInterval(result: Date, interval: number, intervalType: IntervalType): Date {
    const roundValue: number = Math.floor(interval);
    const decimalValue: number = interval - roundValue;
    switch (intervalType) {
    case 'Years': {
        const month: number = Math.round(12 * decimalValue);
        result.setFullYear(result.getFullYear() + roundValue);
        result.setMonth(result.getMonth() + month);
        return result;
    }
    case 'Months': {
        const days: number = Math.round(30 * decimalValue);
        result.setMonth(result.getMonth() + roundValue);
        result.setDate(result.getDate() + days);
        return result;
    }
    case 'Days': {
        const hour: number = Math.round(24 * decimalValue);
        result.setDate(result.getDate() + roundValue);
        result.setHours(result.getHours() + hour);
        return result;
    }
    case 'Hours': {
        const min: number = Math.round(60 * decimalValue);
        result.setHours(result.getHours() + roundValue);
        result.setMinutes(result.getMinutes() + min);
        return result;
    }
    case 'Minutes': {
        const sec: number = Math.round(60 * decimalValue);
        result.setMinutes(result.getMinutes() + roundValue);
        result.setSeconds(result.getSeconds() + sec);
        return result;
    }
    case 'Seconds': {
        const milliSec: number = Math.round(1000 * decimalValue);
        result.setSeconds(result.getSeconds() + roundValue);
        result.setMilliseconds(result.getMilliseconds() + milliSec);
        return result;
    }
    }
    return result;
}

/**
 * Calculates the year boundaries based on given parameters for a DateTime axis.
 *
 * @param {Date} minimum - The minimum date value for the year calculation.
 * @param {Date} maximum - The maximum date value for the year calculation.
 * @param {ChartRangePadding} rangePadding - The type of range padding to apply ('None', 'Additional', or 'Round').
 * @param {number} interval - The interval value for year calculations.
 * @param {DoubleRange} dateTimeRange - The range object to store calculated min and max values in time format.
 * @returns {void} Updates the dateTimeRange object with calculated values.
 * @private
 */
function getYear(minimum: Date, maximum: Date, rangePadding: ChartRangePadding, interval: number, dateTimeRange: DoubleRange): void {
    const startYear: number = minimum.getFullYear();
    const endYear: number = maximum.getFullYear();
    if (rangePadding === 'Additional') {
        dateTimeRange.min = (new Date(startYear - interval, 1, 1, 0, 0, 0)).getTime();
        dateTimeRange.max = (new Date(endYear + interval, 1, 1, 0, 0, 0)).getTime();
    } else {
        dateTimeRange.min = new Date(startYear, 0, 0, 0, 0, 0).getTime();
        dateTimeRange.max = new Date(endYear, 11, 30, 23, 59, 59).getTime();
    }
}
/**
 * Calculates the month boundaries based on given parameters for a DateTime axis.
 *
 * @param {Date} minimum - The minimum date value for the month calculation.
 * @param {Date} maximum - The maximum date value for the month calculation.
 * @param {ChartRangePadding} rangePadding - The type of range padding to apply ('None', 'Additional', or 'Round').
 * @param {number} interval - The interval value for month calculations.
 * @param {DoubleRange} dateTimeRange - The range object to store calculated min and max values in time format.
 * @returns {void} Updates the dateTimeRange object with calculated values.
 * @private
 */
function getMonth(minimum: Date, maximum: Date, rangePadding: ChartRangePadding, interval: number, dateTimeRange: DoubleRange): void {
    const month: number = minimum.getMonth();
    const endMonth: number = maximum.getMonth();
    if (rangePadding === 'Round') {
        dateTimeRange.min = (new Date(minimum.getFullYear(), month, 0, 0, 0, 0)).getTime();
        dateTimeRange.max = (
            new Date(
                maximum.getFullYear(), endMonth,
                new Date(maximum.getFullYear(), maximum.getMonth(), 0).getDate(), 23, 59, 59
            )
        ).getTime();
    } else {
        dateTimeRange.min = (new Date(minimum.getFullYear(), month + (-interval), 1, 0, 0, 0)).getTime();
        dateTimeRange.max = (new Date(maximum.getFullYear(), endMonth + (interval), endMonth === 2 ? 28 : 30, 0, 0, 0)).getTime();
    }
}
/**
 * Calculates the day boundaries based on given parameters for a DateTime axis.
 *
 * @param {Date} minimum - The minimum date value for the day calculation.
 * @param {Date} maximum - The maximum date value for the day calculation.
 * @param {ChartRangePadding} rangePadding - The type of range padding to apply ('None', 'Additional', or 'Round').
 * @param {number} interval - The interval value for day calculations.
 * @param {DoubleRange} dateTimeRange - The range object to store calculated min and max values in time format.
 * @returns {void} Updates the dateTimeRange object with calculated values.
 * @private
 */
function getDay(minimum: Date, maximum: Date, rangePadding: ChartRangePadding, interval: number, dateTimeRange: DoubleRange): void {
    const day: number = minimum.getDate();
    const endDay: number = maximum.getDate();
    if (rangePadding === 'Round') {
        dateTimeRange.min = (new Date(minimum.getFullYear(), minimum.getMonth(), day, 0, 0, 0)).getTime();
        dateTimeRange.max = (new Date(maximum.getFullYear(), maximum.getMonth(), endDay, 23, 59, 59)).getTime();
    } else {
        dateTimeRange.min = (new Date(minimum.getFullYear(), minimum.getMonth(), day + (-interval), 0, 0, 0)).getTime();
        dateTimeRange.max = (new Date(maximum.getFullYear(), maximum.getMonth(), endDay + (interval), 0, 0, 0)).getTime();
    }
}
/**
 * Calculates the hour boundaries based on given parameters for a DateTime axis.
 *
 * @param {Date} minimum - The minimum date value for the hour calculation.
 * @param {Date} maximum - The maximum date value for the hour calculation.
 * @param {ChartRangePadding} rangePadding - The type of range padding to apply ('None', 'Additional', or 'Round').
 * @param {number} interval - The interval value for hour calculations.
 * @param {DoubleRange} dateTimeRange - The range object to store calculated min and max values in time format.
 * @returns {void} Updates the dateTimeRange object with calculated values.
 * @private
 */
function getHour(minimum: Date, maximum: Date, rangePadding: ChartRangePadding, interval: number, dateTimeRange: DoubleRange): void {
    const hour: number = (minimum.getHours() / interval) * interval;
    const endHour: number = maximum.getHours() + (minimum.getHours() - hour);
    if (rangePadding === 'Round') {
        dateTimeRange.min = (new Date(minimum.getFullYear(), minimum.getMonth(), minimum.getDate(), hour, 0, 0)).getTime();
        dateTimeRange.max = (new Date(maximum.getFullYear(), maximum.getMonth(), maximum.getDate(), endHour, 59, 59)).getTime();
    } else {
        dateTimeRange.min = (new Date(
            minimum.getFullYear(), minimum.getMonth(), minimum.getDate(),
            hour + (-interval), 0, 0
        )).getTime();
        dateTimeRange.max = (new Date(
            maximum.getFullYear(), maximum.getMonth(), maximum.getDate(),
            endHour + (interval), 0, 0
        )).getTime();
    }
}

/**
 * To get the skeleton for the DateTime axis.
 *
 * @param {AxisModel} axis - The DateTime axis for which to get the skeleton.
 * @returns {string} - The skeleton for the DateTime axis.
 * @private
 */
function getSkeleton(axis: AxisModel): string {
    let skeleton: string;
    const intervalType: IntervalType = axis.actualIntervalType as IntervalType;
    if (axis.skeleton) {
        return axis.skeleton;
    }
    if (intervalType === 'Years') {
        skeleton = (axis.valueType === 'DateTime' && axis.isIntervalInDecimal) ? 'y' : 'yMMM';
    } else if (intervalType === 'Months') {
        skeleton = 'MMMd';
    } else if (intervalType === 'Days') {
        skeleton = (axis.valueType === 'DateTime' ? 'MMMd' : 'yMd');
    } else if (intervalType === 'Hours') {
        skeleton = (axis.valueType === 'DateTime' ? 'Hm' : 'EHm');
    } else if (intervalType === 'Minutes') {
        skeleton = 'Hms';
    } else {
        skeleton = 'Hms';
    }
    return skeleton;
}

/**
 * Finds the appropriate label format for the DateTime axis.
 *
 * @param {AxisModel} axis - The axis model containing formatting preferences.
 * @returns {string} The determined label format string or empty string if no format is specified.
 * @private
 */
function findCustomFormats(axis: AxisModel): string {
    let labelFormat: string = axis.labelStyle.format ? axis.labelStyle.format : '';
    if (!axis.skeleton && axis.actualIntervalType === 'Months' && !labelFormat) {
        labelFormat = axis.valueType === 'DateTime' ? 'MMM yyyy' : 'yMMM';
    }
    return labelFormat;
}
