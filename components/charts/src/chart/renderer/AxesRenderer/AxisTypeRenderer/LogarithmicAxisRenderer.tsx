import { extend, getNumberFormat, NumberFormatOptions } from '@syncfusion/react-base';
import { ChartFontProps } from '../../../base/interfaces';
import { getActualDesiredIntervalsCount, logBase, withIn } from '../../../utils/helper';
import { calculateRange, initializeDoubleRange, triggerLabelRender, DoubleRange, getFormat, formatValue, triggerRangeRender } from './DoubleAxisRenderer';
import { calculateVisibleRangeOnZooming, getMaxLabelWidth } from './AxisUtils';
import { AxisModel, Chart, ChartSizeProps } from '../../../chart-area/chart-interfaces';

/**
 * Calculates the range and interval for a Logarithmic axis within a chart.
 * This involves adjusting the axis properties based on the chart size and configuration.
 *
 * @param {Size} size - The dimensions of the chart area (width and height in pixels)
 * @param {AxisModel} axis - The logarithmic axis model containing configuration settings
 * @param {Chart} chart - The parent chart instance that contains this axis
 * @returns {void} Updates the axis model with calculated range, interval, and labeling properties
 * @private
 */
export function calculateLogarithmicAxis(size: ChartSizeProps, axis: AxisModel, chart: Chart): void {
    calculateRangeAndInterval(size, axis, chart);
}

/**
 * Calculates the range and interval for the logarithmic axis.
 * Processes raw data into usable axis information by calculating ranges and intervals.
 *
 * @param {Size} size - The chart area dimensions that influence axis calculations
 * @param {AxisModel} axis - The axis model to update with calculated values
 * @param {Chart} chart - The chart instance for accessing related configuration
 * @returns {void} Modifies the axis object with calculated range and interval values
 * @private
 *
 * @example
 * // Internal calculation of range and interval
 * calculateRangeAndInterval({ width: 800, height: 400 }, logarithmicAxis, chart);
 *
 * @throws Will produce incorrect results if axis.logBase is not properly set
 */
function calculateRangeAndInterval(size: ChartSizeProps, axis: AxisModel, chart: Chart): void {
    const logarithmicRange: DoubleRange = {
        min: null,
        max: null
    };
    calculateRange(axis, chart, logarithmicRange as Required<DoubleRange>);

    getActualRange(axis, size, logarithmicRange as Required<DoubleRange>);

    calculateVisibleRange(axis, size);

    calculateVisibleLabels(axis, chart);
}

/**
 * Calculates the actual logarithmic range for the axis based on data values.
 * Transforms regular values to logarithmic scale and ensures proper range boundaries.
 *
 * @param {AxisModel} axis - The axis model with logBase and range configurations
 * @param {Size} size - The chart dimensions used for range calculations
 * @param {DoubleRange} logarithmicRange - Object to store calculated min/max values
 * @returns {void} Updates the logarithmicRange object and sets axis.actualRange properties
 * @private
 *
 * @example
 * // Calculate actual range for logarithmic axis with base 10
 * const logRange = { min: null, max: null };
 * getActualRange(logAxis, chartSize, logRange);
 * // After execution, logRange might contain { min: 0, max: 3 } for values 1-1000
 *
 * @throws Will return incorrect results if logarithmicRange contains negative values
 */
function getActualRange(axis: AxisModel, size: ChartSizeProps, logarithmicRange: DoubleRange): DoubleRange {
    const LOG_UNIT: number = 1;
    initializeDoubleRange(axis, logarithmicRange);
    logarithmicRange.min = (logarithmicRange.min as Required<number>) < 0 ? 0 : logarithmicRange.min;
    let logStart: number = logBase(logarithmicRange.min as Required<number>, axis.logBase as Required<number>);
    logStart = isFinite(logStart) ? logStart : logarithmicRange.min as Required<number>;
    let logEnd: number = logarithmicRange.max === 1 ? 1 : logBase(logarithmicRange.max as number, axis.logBase as number);
    logEnd = isFinite(logEnd) ? logEnd : logarithmicRange.max as Required<number>;
    logarithmicRange.min = Math.floor(logStart / LOG_UNIT);
    logarithmicRange.max = Math.ceil(logEnd / LOG_UNIT);
    logarithmicRange.max = logarithmicRange.max === logarithmicRange.min ? logarithmicRange.max + 1 : logarithmicRange.max;
    axis.actualRange.interval = axis.interval || calculateLogNiceInterval(logarithmicRange.max - logarithmicRange.min, size, axis);
    axis.actualRange.minimum = logarithmicRange.min;
    axis.actualRange.maximum = logarithmicRange.max;
    axis.actualRange.delta = logarithmicRange.max - logarithmicRange.min;
    return logarithmicRange;
}

/**
 * Calculates the visible range for the axis, applying zooming factors if needed.
 * Handles user zoom interactions by adjusting the visible portion of the axis.
 *
 * @param {AxisModel} axis - The axis model with zoom settings and actual range
 * @param {Size} size - The chart dimensions used for interval calculations
 * @returns {void} Updates axis.visibleRange with values representing the currently visible portion
 * @private
 *
 * @example
 * // Calculate visible range with 50% zoom factor at 25% position
 * axis.zoomFactor = 0.5;
 * axis.zoomPosition = 0.25;
 * calculateVisibleRange(axis, { width: 800, height: 400 });
 *
 * @throws May produce unexpected results if zoom factor or position are outside valid ranges (0-1)
 */
function calculateVisibleRange(axis: AxisModel, size: ChartSizeProps): void {
    axis.visibleRange = {
        interval: axis.actualRange.interval, maximum: axis.actualRange.maximum,
        minimum: axis.actualRange.minimum, delta: axis.actualRange.delta
    };
    //const isLazyLoad: boolean = isNullOrUndefined(axis.zoomingScrollBar) ? false : AxisModel.zoomingScrollBar.isLazyLoad;
    if ((axis.zoomFactor as number) < 1 || (axis.zoomPosition as number) > 0) {
        calculateVisibleRangeOnZooming(axis);
        axis.visibleRange.interval = calculateLogNiceInterval(axis.doubleRange.delta, size, axis);
        axis.visibleRange.interval = Math.floor(axis.visibleRange.interval) === 0 ? 1 : Math.floor(axis.visibleRange.interval);
        triggerRangeRender(axis.visibleRange.minimum, axis.visibleRange.maximum, axis.visibleRange.interval, axis);
    }
}

/**
 * Calculates a nicely rounded interval for logarithmic axis labels.
 * Uses axis interval divisions to find an appropriate interval that creates readable labels.
 *
 * @param {number} delta - The difference between axis maximum and minimum values
 * @param {Size} size - The chart dimensions used to determine label density
 * @param {AxisModel} axis - The axis model containing intervalDivs and other settings
 * @returns {number} A calculated interval value that produces visually appealing labels
 * @private
 *
 * @example
 * // Calculate nice interval for log axis with delta of 3 (e.g., 10^1 to 10^4)
 * const interval = calculateLogNiceInterval(3, { width: 800, height: 400 }, logAxis);
 * // Might return 1 for labels at 10, 100, 1000
 *
 * @throws Returns potentially incorrect values if axis.intervalDivs is empty or contains invalid values
 */
function calculateLogNiceInterval(delta: number, size: ChartSizeProps, axis: AxisModel): number {
    const actualDesiredIntervalsCount: number = getActualDesiredIntervalsCount(size, axis);
    let niceInterval: number = delta;
    const minInterval: number = Math.pow(axis.logBase as Required<number>, Math.floor(logBase(niceInterval, 10)));
    for (let j: number = 0, len: number = axis.intervalDivs.length; j < len; j++) {
        const currentInterval: number = minInterval * axis.intervalDivs[j as number];
        if (actualDesiredIntervalsCount < (delta / currentInterval)) {
            break;
        }
        niceInterval = currentInterval;
    }
    return niceInterval;
}

/**
 * Generates visible labels for the logarithmic axis based on calculated range and interval.
 * Creates formatted labels at appropriate positions along the axis.
 *
 * @param {AxisModel} axis - The axis model with visibleRange and formatting settings
 * @param {Chart} chart - The chart instance providing locale and grouping settings
 * @returns {void} Populates axis.visibleLabels with formatted label objects at calculated positions
 * @private
 *
 * @example
 * // Generate labels for a logarithmic axis with base 10
 * // After calculation, axis.visibleLabels might contain entries for 1, 10, 100, 1000
 * calculateVisibleLabels(logAxis, chart);
 *
 * @throws May produce incorrect labels if axis.logBase is not properly set
 */
function calculateVisibleLabels(axis: AxisModel, chart: Chart): void {
    /** Generate axis labels */
    let tempInterval: number = axis.visibleRange.minimum;
    axis.visibleLabels = [];
    let labelStyle: ChartFontProps;
    let value: number;
    if ((axis.zoomFactor as number) < 1 || (axis.zoomPosition as number) > 0) {
        tempInterval = axis.visibleRange.minimum - (axis.visibleRange.minimum % axis.visibleRange.interval);
    }
    const axisFormat: string = getFormat(axis);
    const isCustomFormat: boolean = axisFormat.match('{value}') !== null;
    const startValue: number = Math.pow(axis.logBase as Required<number>, axis.visibleRange.minimum);

    const option: NumberFormatOptions = {
        locale: axis.chart.locale,
        useGrouping: false,
        format: isCustomFormat ? '' : axisFormat,
        maximumFractionDigits: startValue < 1 ? 20 : 3
    };
    axis.format = getNumberFormat(option);
    axis.startLabel = axis.format(startValue < 1 ? +startValue.toPrecision(1) : startValue);
    axis.endLabel = axis.format(Math.pow(axis.logBase as Required<number>, axis.visibleRange.maximum));
    for (; tempInterval <= axis.visibleRange.maximum; tempInterval += axis.visibleRange.interval) {
        labelStyle = (extend({}, axis.labelStyle, undefined, true));
        if (withIn(tempInterval, axis.visibleRange)) {
            value = Math.pow(axis.logBase as Required<number>, tempInterval);
            triggerLabelRender(
                tempInterval, formatValue(axis, isCustomFormat, axisFormat, value < 1 ? +value.toPrecision(1) : value),
                labelStyle, axis
            );
        }
    }
    getMaxLabelWidth(chart, axis);
}
