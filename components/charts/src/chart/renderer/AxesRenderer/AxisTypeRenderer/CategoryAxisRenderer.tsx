import { extend, isNullOrUndefined } from '@syncfusion/react-base';
import { ChartFontProps } from '../../../base/interfaces';
import { getActualDesiredIntervalsCount, withIn } from '../../../utils/helper';
import { calculateRange, calculateVisibleRange, createDoubleRange, initializeDoubleRange, triggerLabelRender, DoubleRange } from './DoubleAxisRenderer';
import { getMaxLabelWidth } from './AxisUtils';
import { AxisModel, Chart, SeriesProperties, ChartSizeProps} from '../../../chart-area/chart-interfaces';
import { ChartSeriesType } from '../../../base/enum';

/**
 * Calculates the range and interval for a Category axis within a chart.
 * This involves adjusting the axis properties based on the chart size and configuration.
 *
 * @param {ChartSizeProps} size - The dimensions of the chart area, which influence axis calculations.
 * @param {AxisModel} axis - The axis model to be calculated, containing data and settings.
 * @param {Chart} chart - The chart instance that includes the axis and other relevant properties.
 * @returns {void} This function modifies axis properties related to range and interval without returning a value.
 * @private
 */
export function calculateCategoryAxis(size: ChartSizeProps, axis: AxisModel, chart: Chart): void {
    calculateRangeAndInterval(size, axis, chart);
}

/**
 * The function to calculate the range and labels for the axis.
 *
 * @private
 * @returns {void}
 */

/**
 * Calculates the range and interval for the category axis within a chart.
 * This involves adjusting the axis properties based on the chart size and configuration.
 *
 * @param {Size} size - The dimensions of the chart area, which influence axis calculations.
 * @param {AxisModel} axis - The axis model to be calculated, containing data and settings.
 * @param {Chart} chart - The chart instance that includes the axis and other relevant properties.
 * @returns {void} This function modifies axis properties related to range and interval without returning a value.
 * @private
 */
function calculateRangeAndInterval(size: ChartSizeProps, axis: AxisModel, chart: Chart): void {
    const categoryRange: DoubleRange = {
        min: null,
        max: null
    };
    calculateRange(axis, chart, categoryRange as Required<DoubleRange>);
    getActualRange(axis, size, categoryRange as Required<DoubleRange>);
    applyRangePadding(axis, size);
    calculateVisibleLabels(axis);
}

/**
 * Calculates the actual range for the category axis.
 *
 * @param {AxisModel} axis - The axis model containing axis settings.
 * @param {Size} size - The size of the chart area.
 * @param {DoubleRange} categoryRange - The calculated range for categories.
 * @returns {void} Does not return a value.
 * @private
 */
export function getActualRange(axis: AxisModel, size: ChartSizeProps, categoryRange: DoubleRange): void {
    initializeDoubleRange(axis, categoryRange as Required<DoubleRange>);
    if (!axis.interval) {
        axis.actualRange.interval = Math.max(1, Math.floor(axis.doubleRange.delta / getActualDesiredIntervalsCount(size, axis)));
    } else {
        axis.actualRange.interval = Math.ceil(axis.interval);
    }
    axis.actualRange.minimum = axis.doubleRange.start;
    axis.actualRange.maximum = axis.doubleRange.end;
    axis.actualRange.delta = axis.doubleRange.delta;
}

/**
 * Padding for the axis.
 *
 * @param {AxisModel} axis - The axis for which padding is applied.
 * @param {ChartSizeProps} size - The size of the chart area.
 * @returns {void}
 * @private
 */
export function applyRangePadding(axis: AxisModel, size: ChartSizeProps): void {
    let  hasColumnOrBarSeries: boolean = false;
    const AXIS_OFFSET: number = 0.5;
    axis.series.forEach((element: SeriesProperties) => {
        if (!hasColumnOrBarSeries) { hasColumnOrBarSeries = ((element.type as Required<ChartSeriesType>).indexOf('Column') > -1 || (element.type as Required<ChartSeriesType>).indexOf('Bar') > -1) && !(axis.zoomFactor as Required<number> < 1 || axis.zoomPosition as Required<number> > 0) && isNullOrUndefined(axis.minimum) && isNullOrUndefined(axis.maximum); }
    });
    const shouldOffsetTicks: boolean = axis.labelStyle.placement === 'BetweenTicks' || hasColumnOrBarSeries;
    const ticks: number = shouldOffsetTicks ? AXIS_OFFSET : 0;
    if (ticks > 0) {
        axis.actualRange.minimum -= ticks;
        axis.actualRange.maximum += ticks;
    } else {
        axis.actualRange.maximum += axis.actualRange.maximum ? 0 : AXIS_OFFSET;
    }
    axis.doubleRange = createDoubleRange(axis.actualRange.minimum, axis.actualRange.maximum);
    axis.actualRange.delta = axis.doubleRange.delta;
    calculateVisibleRange(axis, size);
}


/**
 * Calculates and generates visible labels for the axis.
 *
 * @param {AxisModel} axis - The axis for which labels are generated.
 * @returns {void} Does not return a value.
 * @private
 */
export function calculateVisibleLabels(axis: AxisModel): void {
    /** Generate axis labels */
    axis.visibleLabels = [];
    axis.visibleRange.interval = axis.visibleRange.interval < 1 ? 1 : axis.visibleRange.interval;
    let tempInterval: number = Math.ceil(axis.visibleRange.minimum);
    let labelStyle: ChartFontProps;
    if (axis.zoomFactor as Required<number> < 1 || axis.zoomPosition as Required<number> > 0) {
        tempInterval = axis.visibleRange.minimum - (axis.visibleRange.minimum % axis.visibleRange.interval);
    }
    let position: number;
    axis.startLabel = axis.labels[Math.round(axis.visibleRange.minimum)];
    axis.endLabel = axis.labels[Math.floor(axis.visibleRange.maximum)];
    for (; tempInterval <= axis.visibleRange.maximum; tempInterval += axis.visibleRange.interval) {
        labelStyle = (extend({}, axis.labelStyle, undefined, true));
        if (withIn(tempInterval, axis.visibleRange) && axis.labels.length > 0) {
            position = Math.round(tempInterval);
            triggerLabelRender(
                position,
                axis.labels[position as number] ? axis.labels[position as number].toString() : '',
                labelStyle, axis
            );
        }
    }
    getMaxLabelWidth(axis.chart, axis);
}

