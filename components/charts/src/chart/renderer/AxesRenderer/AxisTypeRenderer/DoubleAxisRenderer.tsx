import { extend, getNumberFormat, isNullOrUndefined, NumberFormatOptions } from '@syncfusion/react-base';
import { ChartRangePadding } from '../../../base/enum';
import { getActualDesiredIntervalsCount, getMinPointsDelta, lineBreakLabelTrim, logBase, setRange, useTextTrim, withIn } from '../../../utils/helper';
import { calculateVisibleRangeOnZooming, getMaxLabelWidth } from './AxisUtils';
import { AxisLabelContentFunction, AxisTextStyle } from '../../../chart-axis/base';
import { AxisModel, Chart, DoubleRangeType, SeriesProperties, ChartSizeProps, TextStyleModel } from '../../../chart-area/chart-interfaces';

let isColumn: number = 0;
let isStacking: boolean | undefined = false;

/**
 * Represents a numeric range with a minimum and maximum value.
 *
 * @private
 */
export interface DoubleRange {
    /**
     * The minimum value of the range.
     * Can be a number or null if not set.
     */
    min: number | null;

    /**
     * The maximum value of the range.
     * Can be a number or null if not set.
     */
    max: number | null;
}

/**
 * Calculates a "nice" numeric interval for axis rendering, based on the axis model, delta, and size.
 *
 * @param {AxisModel} axis - The model representing axis data and configurations.
 * @param {number} delta - The difference between the maximum and minimum data values.
 * @param {ChartSizeProps} size - The size of the chart or axis area to help determine intervals.
 * @returns {number} A numeric value representing a nicely calculated interval for rendering.
 * @private
 */
export function calculateNumericNiceInterval(axis: AxisModel, delta: number, size: ChartSizeProps): number {
    const actualDesiredIntervalsCount: number = getActualDesiredIntervalsCount(size, axis);
    let niceInterval: number = delta / actualDesiredIntervalsCount;
    if (!isNullOrUndefined(axis.desiredIntervals)) {
        if (isAutoIntervalOnBothAxis(axis)) {
            return niceInterval;
        }
    }

    const minInterval: number = Math.pow(10, Math.floor(logBase(niceInterval, 10)));
    for (const interval of axis.intervalDivs) {
        const currentInterval: number = minInterval * interval;
        if (actualDesiredIntervalsCount < (delta / currentInterval)) {
            break;
        }
        niceInterval = currentInterval;
    }
    return niceInterval;
}

/**
 * Determines whether the auto interval calculation is enabled on both axes.
 * This function checks if auto intervals are used based on the zoom settings.
 *
 * @param {AxisModel} axis - The axis model that includes zoom factors and interval settings.
 * @returns {boolean} A boolean value indicating if auto intervals are applied on both axes.
 * @private
 */
function isAutoIntervalOnBothAxis(axis: AxisModel): boolean {
    return !(((axis.zoomFactor ?? 1) < 1 || (axis.zoomPosition ?? 0) > 0));
}

/**
 * Calculates the range and interval for a double axis within a chart.
 * This involves adjusting the axis properties based on the chart size and configuration.
 *
 * @param {ChartSizeProps} size - The dimensions of the chart area, which influence axis calculations.
 * @param {AxisModel} axis - The axis model to be calculated, containing data and settings.
 * @param {Chart} chart - The chart instance that includes the axis and other relevant properties.
 * @returns {void} This function modifies axis properties related to range and interval without returning a value.
 * @private
 */
export function calculateDoubleAxis(size: ChartSizeProps, axis: AxisModel, chart: Chart): void {
    calculateRangeAndInterval(size, axis, chart);
}

/**
 * Calculates the range and interval for an axis based on the provided chart size and configuration.
 * This adjusts the axis range and interval properties according to the chart's needs.
 *
 * @param {ChartSizeProps} size - The overall size of the chart, affecting the range and interval calculations.
 * @param {AxisModel} axis - The axis model for which the range and interval are calculated.
 * @param {Chart} chart - The chart context that contains the axis and its configuration.
 * @returns {void} This function updates properties on the axis for range and interval; it does not return a value.
 * @private
 */
function calculateRangeAndInterval(size: ChartSizeProps, axis: AxisModel, chart: Chart): void {
    const doubleRange: DoubleRange = {
        min: null,
        max: null
    };
    calculateRange(axis, chart, doubleRange);
    getActualRange(axis, size, doubleRange);
    applyRangePadding(axis, size, chart);
    calculateVisibleLabels(axis, chart);
}

/**
 * Calculates and sets the minimum and maximum range values for a given axis.
 *
 * @param {AxisModel} axis - The axis model for which the range is being calculated.
 * @param {Chart} chart - The chart instance containing relevant context and data for the axis.
 * @param {DoubleRange} doubleRange - An object used to capture and update the min and max range values.
 * @returns {void} This function modifies the `doubleRange` with calculated min and max values; it does not return a value.
 * @private
 */
export function calculateRange(axis: AxisModel, chart: Chart, doubleRange: DoubleRange): void {
    doubleRange.min = null;
    doubleRange.max = null;
    if (!setRange(axis)) {
        axis.series.forEach((series: SeriesProperties) => {
            if (!series.visible) {
                return;
            }
            axis.paddingInterval = 0;
            if (!isNullOrUndefined(series.points)) {
                axis.maxPointLength = (series.points?.length || 0);
            }

            if (((series.type?.includes('Column') || series.type?.includes('Histogram')) && axis.orientation === 'Horizontal')
                || (series.type?.includes('Bar') && axis.orientation === 'Vertical')) {
                if ((series.xAxis.valueType === 'Double' || series.xAxis.valueType === 'DateTime') && series.xAxis?.rangePadding === 'Auto') {
                    axis.paddingInterval = getMinPointsDelta(series.xAxis, axis.series) * 0.5;
                }
            }

            if (axis.orientation === 'Horizontal') {
                if (chart.requireInvertedAxis) {
                    yAxisRange(series, doubleRange);
                } else {
                    findMinMax((series.xMin as number) - axis.paddingInterval, (series.xMax as number) + axis.paddingInterval, doubleRange);
                }
            }

            if (axis.orientation === 'Vertical') {
                isColumn += (series.type?.includes('Column') || series.type?.includes('Bar')) ? 1 : 0;
                isStacking = series.type?.includes('Stacking');
                if (chart.requireInvertedAxis) {
                    findMinMax((series.xMin as number) - axis.paddingInterval, (series.xMax as number) + axis.paddingInterval, doubleRange);
                } else {
                    yAxisRange(series, doubleRange);
                }
            }
        });
    }
}

/**
 * Prepares and configures the actual range for a given axis based on chart settings.
 * This function initializes the double range and adjusts it according to specific conditions.
 *
 * @param {AxisModel} axis - The axis model to update with the actual range.
 * @param {ChartSizeProps} size - The dimensions of the chart affecting calculations.
 * @param {DoubleRange} doubleRange - The range to be initialized and updated.
 * @returns {void} This function modifies the passed double range and does not return a value.
 * @private
 */
function getActualRange(axis: AxisModel, size: ChartSizeProps, doubleRange: DoubleRange): void {
    initializeDoubleRange(axis, doubleRange);
    if ((!axis.startFromZero) && (isColumn > 0)) {
        axis.actualRange.interval = axis.interval || calculateNumericNiceInterval(axis, axis.doubleRange.delta, size);
        axis.actualRange.maximum = axis.doubleRange.end + axis.actualRange.interval;
        axis.actualRange.minimum = (axis.doubleRange.start - axis.actualRange.interval < 0 && axis.doubleRange.start > 0)
            ? 0
            : axis.doubleRange.start - (isStacking ? 0 : axis.actualRange.interval);
    } else {
        axis.actualRange.interval = axis.interval || calculateNumericNiceInterval(axis, axis.doubleRange.delta, size);
        axis.actualRange.minimum = axis.doubleRange.start;
        axis.actualRange.maximum = axis.doubleRange.end;
    }

}

/**
 * Initializes the given double range with values from the axis model.
 * Sets the minimum of the range based on the axis settings, if provided.
 *
 * @param {AxisModel} axis - The axis model containing potential minimum and maximum values.
 * @param {DoubleRange} doubleRange - The double range to be initialized.
 * @returns {void} This function updates the double range and does not return a value.
 * @private
 */
export function initializeDoubleRange(axis: AxisModel, doubleRange: DoubleRange): void  {
    if (!isNullOrUndefined(axis.minimum)) {
        doubleRange.min = axis.minimum as number;
    } else if (doubleRange.min === null || doubleRange.min === Number.POSITIVE_INFINITY) {
        doubleRange.min = 0;
    }
    if (!isNullOrUndefined(axis.maximum)) {
        doubleRange.max = axis.maximum as number;
    } else if (doubleRange.max === null || doubleRange.max === Number.NEGATIVE_INFINITY) {
        doubleRange.max = 5;
    }

    if (doubleRange.min === doubleRange.max) {
        doubleRange.max = axis.valueType?.includes('Category') ? doubleRange.max : doubleRange.min + 1;
    }
    axis.doubleRange = createDoubleRange(doubleRange.min, doubleRange.max);
}

/**
 * Creates a double range object with a given start and end value.
 * Ensures the start value is the minimum and the end value is the maximum.
 *
 * @param {number} start - The starting value of the range.
 * @param {number} end - The ending value of the range.
 * @returns {DoubleRangeType} An object representing the double range from `start` to `end`.
 * @private
 */
export function createDoubleRange(start: number, end: number): DoubleRangeType {
    const mStart: number = Math.min(start, end);
    const mEnd: number = Math.max(start, end);

    return {
        start: mStart,
        end: mEnd,
        delta: mEnd - mStart,
        median: mStart + (mEnd - mStart) / 2
    };
}

/**
 * Adjusts the y-axis range for a given series and updates the specified double range.
 * Takes into account series settings and potential drag adjustments.
 *
 * @param {SeriesProperties} series - The data series for which the y-axis range is being calculated.
 * @param {DoubleRange} doubleRange - The double range to be adjusted for the y-axis.
 * @returns {void} This function modifies the provided double range and does not return a value.
 */
function yAxisRange(series: SeriesProperties, doubleRange: DoubleRange): void {
    // if (series.dragSettings.enable && chart.dragY) {
    //     if (chart.dragY >= axis.visibleRange.max) {
    //         series.yMax = chart.dragY + axis.visibleRange.interval;
    //     }
    //     if (chart.dragY <= axis.visibleRange.min) {
    //         series.yMin = chart.dragY - axis.visibleRange.interval;
    //     }
    // }

    // if (series.type === 'Waterfall') {
    //     let cumulativeMax = 0;
    //     let cumulativeValue = 0;
    //     for (let i = 0; i < series.yData.length; i++) {
    //         if (!(series.intermediateSumIndexes && series.intermediateSumIndexes.includes(i)) &&
    //             !(series.sumIndexes && series.sumIndexes.includes(i))) {
    //             cumulativeValue += series.yData[i];
    //         }
    //         if (cumulativeValue > cumulativeMax) {
    //             cumulativeMax = cumulativeValue;
    //         }
    //     }
    //     findMinMax(series.yMin, cumulativeMax);
    // } else {
    //     findMinMax(series.yMin, series.yMax);
    // }
    findMinMax(series.yMin as number, series.yMax as number, doubleRange);
}

/**
 * Updates the double range with the minimum and maximum values extracted from the specified inputs.
 * Ensures the double range's minimum and maximum are adjusted only when new values are more extreme.
 *
 * @param {number} minValue - The candidate minimum value for the range.
 * @param {number} maxValue - The candidate maximum value for the range.
 * @param {DoubleRange} doubleRange - The range object to be updated with new min and max values.
 * @returns {void} This function modifies the double range directly and does not return a value.
 * @private
 */
function findMinMax(minValue: number, maxValue: number, doubleRange: DoubleRange): void {
    doubleRange.min = (doubleRange.min === null || doubleRange.min > minValue) ? minValue : doubleRange.min;
    doubleRange.max = (doubleRange.max === null || doubleRange.max < maxValue) ? maxValue : doubleRange.max;
    if ((doubleRange.max === doubleRange.min) && doubleRange.max < 0 && doubleRange.min < 0) {
        doubleRange.max = 0;
    }
}

/**
 * Applies padding to the range of the specified axis based on the chart's dimensions.
 * Modifies the range to ensure visual appeal and data accuracy within the chart.
 *
 * @param {AxisModel} axis - The axis model to which the range padding should be applied.
 * @param {ChartSizeProps} size - The size dimensions of the chart affecting the range calculation.
 * @param {Chart} chart - The chart object that provides context for axis adjustments.
 * @returns {void} This function adjusts the axis range and does not return any value.
 * @private
 */
function applyRangePadding(axis: AxisModel, size: ChartSizeProps, chart: Chart): void {
    const start: number = axis.actualRange.minimum;
    const end: number = axis.actualRange.maximum;
    if (!setRange(axis)) {
        const interval: number = axis.actualRange.interval;
        const padding: ChartRangePadding = getRangePadding(axis, chart);
        if (padding === 'Additional' || padding === 'Round') {
            findAdditional(axis, start, end, interval, size);
        } else if (padding === 'Normal') {
            findNormal(axis, start, end, interval, size);
        } else {
            updateActualRange(axis, start, end, interval);
        }
    }
    axis.actualRange.delta = axis.actualRange.maximum - axis.actualRange.minimum;
    calculateVisibleRange(axis, size);
}

/**
 * Calculates additional range limits based on start, end, and interval values.
 * Sets up the axis with adjusted minimum and maximum limits for visualization.
 *
 * @param {AxisModel} axis - The axis model to be updated with new range values.
 * @param {number} start - The starting point of the current range.
 * @param {number} end - The ending point of the current range.
 * @param {number} interval - The interval value used to calculate the range limits.
 * @param {ChartSizeProps} size - The size dimensions relevant for axis adjustments.
 * @returns {void} This function modifies the axis range directly and does not return any value.
 * @private
 */
function findAdditional(axis: AxisModel, start: number, end: number, interval: number, size: ChartSizeProps): void {
    let minimum: number = Math.floor(start / interval) * interval;
    let maximum: number = Math.ceil(end / interval) * interval;
    if (axis.rangePadding === 'Additional') {
        minimum -= interval;
        maximum += interval;
    }
    if (!isNullOrUndefined(axis.desiredIntervals)) {
        const delta: number = maximum - minimum;
        interval = calculateNumericNiceInterval(axis, delta, size);
    }
    updateActualRange(axis, minimum, maximum, interval);
}

/**
 * Updates the actual range of the specified axis using given minimum, maximum, and interval values.
 * Ensures the axis range reflects accurate minimum and maximum limits.
 *
 * @param {AxisModel} axis - The axis model to update with the new range values.
 * @param {number} minimum - The calculated or provided minimum value for the range.
 * @param {number} maximum - The calculated or provided maximum value for the range.
 * @param {number} interval - The interval value used in setting the range limits.
 * @returns {void} This function updates the actualRange property of the axis and does not return a value.
 * @private
 */
function updateActualRange(axis: AxisModel, minimum: number, maximum: number, interval: number): void {
    axis.actualRange = {
        minimum: axis.minimum != null ? axis.minimum as number : minimum,
        maximum: axis.maximum != null ? axis.maximum as number : maximum,
        interval: axis.interval != null ? axis.interval : interval,
        delta: axis.actualRange?.delta
    };
}

/**
 * Determines the range padding for a specified axis based on the current chart settings.
 * Returns the resolved padding type, considering custom and default settings.
 *
 * @param {AxisModel} axis - The axis model from which to derive range padding.
 * @param {Chart} chart - The chart object providing context for axis padding determination.
 * @returns {ChartRangePadding} The type of range padding applied to the axis.
 * @private
 */
export function getRangePadding(axis: AxisModel, chart: Chart): ChartRangePadding  {
    let padding: ChartRangePadding = axis.rangePadding as ChartRangePadding;
    if (padding !== 'Auto') {
        return padding;
    }
    switch (axis.orientation) {
    case 'Horizontal':
        if (chart.requireInvertedAxis) {
            padding = 'Normal';
        } else {
            padding = 'None';
        }
        break;
    case 'Vertical':
        if (!chart.requireInvertedAxis) {
            padding = 'Normal';
        } else {
            padding = 'None';
        }
        break;
    }
    return padding;
}

/**
 * Calculates and updates the normal range for an axis using start, end, and interval values.
 * Adjusts the axis to ensure the range aligns with the chart's dimension and interval settings.
 *
 * @param {AxisModel} axis - The axis model to be modified with the normal range.
 * @param {number} start - The starting point used for calculating the range.
 * @param {number} end - The endpoint used for calculating the range.
 * @param {number} interval - The interval value for range calculation.
 * @param {ChartSizeProps} size - The size dimensions that may influence range adjustments.
 * @returns {void} Updates the axis range, but does not return a value.
 * @private
 */
function findNormal(axis: AxisModel, start: number, end: number, interval: number, size: ChartSizeProps): void {
    let remaining: number;
    let minimum: number;
    let maximum: number;
    let startValue: number = start;
    if (start < 0) {
        startValue = 0;
        minimum = start + (start * 0.05);
        remaining = interval + (minimum % interval);
        if ((0.365 * interval) >= remaining) {
            minimum -= interval;
        }
        if (minimum % interval < 0) {
            minimum = (minimum - interval) - (minimum % interval);
        }
    } else {
        minimum = start < ((5.0 / 6.0) * end) ? 0 : (start - (end - start) * 0.5);
        if (minimum % interval > 0) {
            minimum -= (minimum % interval);
        }
    }
    maximum = (end > 0) ? (end + (end - startValue) * 0.05) : (end - (end - startValue) * 0.05);
    remaining = interval - (maximum % interval);
    if ((0.365 * interval) >= remaining) {
        maximum += interval;
    }
    if (maximum % interval > 0) {
        maximum = (maximum + interval) - (maximum % interval);
    }
    axis.doubleRange = createDoubleRange(minimum, maximum);
    if (minimum === 0 || (minimum < 0 && maximum < 0)) {
        interval = calculateNumericNiceInterval(axis, axis.doubleRange.delta, size);
        maximum = Math.ceil(maximum / interval) * interval;
    }
    updateActualRange(axis, minimum, maximum, interval);
}

/**
 * Calculates and updates the visible range for the specified axis.
 *
 * @param {AxisModel} axis - The axis model for which the visible range is being calculated.
 * @param {ChartSizeProps} size - The size of the chart area.
 * @returns {void} This function updates the `visibleRange` property on the axis and does not return a value.
 * @private
 */
export function calculateVisibleRange(axis: AxisModel, size: ChartSizeProps): void {
    axis.visibleRange = {
        maximum: axis.actualRange.maximum, minimum: axis.actualRange.minimum,
        delta: axis.actualRange.delta, interval: axis.actualRange.interval
    };

    // if (chart.chartAreaType === 'Cartesian') {
    //const isLazyLoad = isNullOrUndefined(axis.zoomingScrollBar) ? false : axis.zoomingScrollBar.isLazyLoad;
    if ((axis.zoomFactor as number) < 1 || (axis.zoomPosition as number) > 0) {
        calculateVisibleRangeOnZooming(axis);
        axis.visibleRange.interval = calculateNumericNiceInterval(axis, axis.doubleRange.delta, size);
    }
    //}

    const rangeDifference: number = (axis.visibleRange.maximum - axis.visibleRange.minimum) % axis.visibleRange.interval;
    if (rangeDifference !== 0 && !isNaN(rangeDifference) && axis.valueType === 'Double' &&
        axis.orientation === 'Vertical' && axis.rangePadding === 'Auto') {
        let duplicateTempInterval: number = Infinity;
        let tempInterval: number = axis.visibleRange.minimum;
        for (; (tempInterval <= axis.visibleRange.maximum) &&
        (duplicateTempInterval !== tempInterval); tempInterval += axis.visibleRange.interval) {
            duplicateTempInterval = tempInterval;
        }
        if (duplicateTempInterval < axis.visibleRange.maximum) {
            axis.visibleRange.maximum = duplicateTempInterval + axis.visibleRange.interval;
        }
    }

    triggerRangeRender(axis.visibleRange.minimum, axis.visibleRange.maximum, axis.visibleRange.interval, axis);
}

/**
 * Triggers the rendering of the axis range based on the minimum, maximum, and interval values.
 *
 * @param {number} minimum - The minimum value of the axis range to render.
 * @param {number} maximum - The maximum value of the axis range to render.
 * @param {number} interval - The interval between values in the axis range.
 * @param {AxisModel} axis - The axis model associated with the rendering process.
 * @returns {void} This function performs side effects related to range rendering and does not return a value.
 * @private
 */
export function triggerRangeRender(minimum: number, maximum: number, interval: number, axis: AxisModel): void {
    axis.visibleRange = {
        minimum: minimum, maximum: maximum, interval: interval,
        delta: maximum - minimum
    };
}

/**
 * Calculates and updates the visible labels on the specified axis for the given chart.
 *
 * @param {AxisModel} axis - The axis model for which visible labels need to be calculated.
 * @param {Chart} chart - The chart instance containing the axis for rendering.
 * @returns {void} This function updates the `visibleLabels` property on the axis model and does not return a value.
 * @private
 */
function calculateVisibleLabels(axis: AxisModel, chart: Chart): void {
    axis.visibleLabels = [];
    let tempInterval: number = axis.visibleRange.minimum;
    if ((axis.zoomFactor as number) < 1 || (axis.zoomPosition as number) > 0 || axis.paddingInterval) {
        tempInterval = axis.visibleRange.minimum - (axis.visibleRange.minimum % axis.visibleRange.interval);
    }
    const format: string = getFormat(axis);
    const isCustom: boolean = format.match('{value}') !== null;
    let intervalDigits: number = 0;
    let formatDigits: number = 0;
    if (axis.labelStyle.format && axis.labelStyle.format.indexOf('n') > -1) {
        formatDigits = parseInt(axis.labelStyle.format.substring(1, axis.labelStyle.format.length), 10);
    }
    const option: NumberFormatOptions = {
        locale: axis.chart.locale,
        useGrouping: false,
        format: isCustom ? '' : format
    };
    axis.format = getNumberFormat(option);

    axis.startLabel = axis.format(axis.visibleRange.minimum);
    axis.endLabel = axis.format(axis.visibleRange.maximum);

    if (axis.visibleRange.interval && (axis.visibleRange.interval + '').indexOf('.') >= 0) {
        intervalDigits = (axis.visibleRange.interval + '').split('.')[1].length;
    }
    const labelStyle: AxisTextStyle = extend({}, axis.labelStyle, undefined, true);
    let duplicateTempInterval: number | null = null;
    for (; (tempInterval <= axis.visibleRange.maximum) && (duplicateTempInterval !== tempInterval);
        tempInterval += axis.visibleRange.interval) {
        duplicateTempInterval = tempInterval;

        if (withIn(tempInterval, axis.visibleRange)) {
            triggerLabelRender(tempInterval, formatValue(axis, isCustom, format, tempInterval), labelStyle, axis);
        }
    }

    if (tempInterval && (tempInterval + '').indexOf('.') >= 0 && (tempInterval + '').split('.')[1].length > 10) {
        tempInterval = (tempInterval + '').split('.')[1].length > (formatDigits || intervalDigits) ?
            +tempInterval.toFixed(formatDigits || intervalDigits) : tempInterval;
        if (tempInterval <= axis.visibleRange.maximum) {
            triggerLabelRender(tempInterval, formatValue(axis, isCustom, format, tempInterval), labelStyle, axis);
        }
    }
    getMaxLabelWidth(chart, axis);

}


/**
 * Applies a custom content callback to modify the axis label text.
 *
 * @param {number} value - The raw value associated with the axis label.
 * @param {string} text - The original text content of the axis label.
 * @param {AxisModel} axis - The axis model to which the label belongs.
 * @returns {string} The modified label content after applying the callback. If the callback fails, the original text is returned.
 * @private
 */
export function applyLabelContentCallback(
    value: number,
    text: string,
    axis: AxisModel
): string | boolean {
    const contentCallback: AxisLabelContentFunction = axis.labelStyle?.formatter as AxisLabelContentFunction;
    if (contentCallback && typeof contentCallback === 'function') {
        try {
            const customProps: string | boolean = contentCallback(value, text);
            return customProps;
        } catch (error) {
            return text;
        }
    }
    return text;
}

/**
 * Triggers an event to render axis labels based on the given parameters.
 *
 * @param {number} tempInterval - The interval at which the labels are to be calculated/rendered.
 * @param {string} text - The text content for display in the label.
 * @param {AxisTextStyle} labelStyle - The style attributes to be applied to the label text.
 * @param {AxisModel} axis - The axis model containing relevant data and label formatting methods.
 * @returns {void} This function does not return a value but triggers a label render event.
 * @private
 */
export function triggerLabelRender(tempInterval: number, text: string, labelStyle: AxisTextStyle, axis: AxisModel
): void {
    const customText: string | boolean = applyLabelContentCallback(tempInterval, text, axis);
    if (typeof customText !== 'boolean') {
        const isLineBreakLabels: boolean = text.indexOf('<br>') !== -1;
        const formattedText: string | string[] = (axis.labelStyle.enableTrim)
            ? (isLineBreakLabels
                ? lineBreakLabelTrim(axis.labelStyle.maxLabelWidth as number,
                                     customText as string, labelStyle, axis.chart.themeStyle.axisLabelFont)
                : useTextTrim(axis.labelStyle.maxLabelWidth as number, customText as string,
                              labelStyle as TextStyleModel, axis.chart.enableRtl, axis.chart.themeStyle.axisLabelFont))
            : customText;
        axis.visibleLabels.push({
            text: formattedText,
            value: tempInterval,
            labelStyle: labelStyle,
            size: { width: 0, height: 0 },
            breakLabelSize: { width: 0, height: 0 },
            index: 1,
            originalText: customText as string
        });
    }
}

/**
 * Determines and returns the appropriate format string for axis labels.
 *
 * @param {AxisModel} axis - The axis model containing label formatting information.
 * @returns {string} A string representing the format for the axis labels.
 * @private
 */
export function getFormat(axis: AxisModel): string {
    const format: string = axis.labelStyle?.format || '';
    const isStack100: boolean = axis.isStack100 || axis.series.some((series: SeriesProperties) => series.type?.includes('100'));
    if (format) {
        if (format.indexOf('p') === 0 && format.indexOf('{value}') === -1 && isStack100) {
            return '{value}%';
        }
        return format;
    }
    return isStack100 ? '{value}%' : '';
}

/**
 * Formats the value for axis labels based on the axis model and formatting rules.
 *
 * @param {AxisModel} axis - The axis model containing data and formatting methods.
 * @param {boolean} isCustom - A flag indicating whether a custom format should be used.
 * @param {string} format - The string pattern to format the value, containing placeholders like '{value}'.
 * @param {number} tempInterval - The numeric interval used to calculate label values.
 * @returns {string} A formatted string for the axis label.
 * @private
 */
export function formatValue(axis: AxisModel, isCustom: boolean, format: string, tempInterval: number): string {
    const labelValue: number = !(tempInterval % 1) ? tempInterval : Number(tempInterval.toLocaleString('en-US').split(',').join(''));
    return isCustom ? format.replace('{value}', axis.format(labelValue))
        : format ? axis.format(tempInterval) : axis.format(labelValue);
}
