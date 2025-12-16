import { DateFormatOptions, getDateParser, getDateFormat, extend } from '@syncfusion/react-base';
import { DataUtil } from '@syncfusion/react-data';
import { AxisModel, Chart, Rect, VisibleRangeProps } from '../../../chart-area/chart-interfaces';
import { logBase, inside, valueToCoefficient } from '../../../utils/helper';
import { findDifference } from './AxisUtils';

/**
 * Calculates the label size while the cross axis support enabled
 *
 * @param {AxisModel} axis - Respective axis to be evaluated.
 * @param {number} labelSize - Size of label need to be computed in cross axis.
 * @returns {number} - calculated label size for cross axis
 * @private
 */
export function calculateCrossAxisLabelSize(
    axis: AxisModel,
    labelSize: number
): number {
    let diff: number;
    let value: number;
    const crossAxis: AxisModel = axis.crossInAxis as AxisModel;

    if (crossAxis && axis.crossAt?.allowOverlap) {
        const range: VisibleRangeProps = crossAxis.visibleRange;
        const size: number = (crossAxis.orientation === 'Horizontal') ? crossAxis.rect.width : crossAxis.rect.height;

        if (!range || !size) {
            return 0;
        } else if (axisInside(axis, range)) {
            value = findDifference(crossAxis);
            diff = value * (size / range.delta);
            diff = value * ((size - (diff < labelSize ? (labelSize - diff) : 0)) / range.delta);
            labelSize = (diff < labelSize) ? (labelSize - diff) : 0;
        }
    }

    return labelSize;
}

/**
 * Updates the `crossesAt` positions for each axis in the chart's axis collection.
 *
 * @param {Chart} chart - The chart whose axes need their `crossAt` values evaluated.
 * @returns {void}
 * @private
 */
export function crossAt(chart: Chart): void {
    for (const axis of chart.axisCollection) {
        if (axis.crossAt?.value === null || axis.crossAt?.value === undefined) {
            continue;
        }
        if (!axis.crossAt.axis) {
            if (chart.requireInvertedAxis) {
                axis.crossInAxis = ((axis.orientation === 'Horizontal')) ? chart.axisCollection[0] : chart.axisCollection[1];
            } else {
                axis.crossInAxis = ((axis.orientation === 'Horizontal')) ? chart.axisCollection[1] : chart.axisCollection[0];
            }
            axis.axisCrossesAt = updateCrossAt(axis.crossAt.value, axis);
            continue;
        }
        else {
            for (let i: number = 2, len: number = chart.axisCollection.length; i < len; i++) {
                if (axis.crossAt.axis === chart.axisCollection[i as number].name) {
                    axis.crossInAxis = chart.axisCollection[i as number];
                    axis.axisCrossesAt = updateCrossAt((axis.crossAt.value), axis);
                    continue;
                }
            }
        }
    }
}

/**
 * Updates the crossAt value for a given axis based on its value type.
 *
 * @param {Object} crossAt - The value to cross at, which will be adapted based on the axis's value type.
 * @param {AxisModel} axis - The axis model
 * @returns {number} The updated crossAt value.
 * @private
 */
export function updateCrossAt(crossAt: Object, axis: AxisModel): number {
    switch (axis.valueType) {
    case 'DateTime': {
        const option: DateFormatOptions = {
            skeleton: 'full',
            type: 'dateTime'
        };
        const dateParser: Function = getDateParser(option);
        const dateFormatter: Function = getDateFormat(option);
        return Date.parse(dateParser(dateFormatter(new Date(
            (DataUtil.parse as Required<typeof DataUtil.parse>).parseJson({ val: crossAt }).val))));
    }
    case 'Category':
        return parseFloat(crossAt as string) ? parseFloat(crossAt as string) : axis.labels.indexOf(crossAt as string);
    case 'Logarithmic':
        return logBase(crossAt as number, axis.logBase as number);
    default:
        return crossAt as number;
    }
}

/**
 * Checks if an axis is positioned inside the visible range based on its `crossAt` property.
 *
 * @param {AxisModel} axis - The axis model being evaluated.
 * @param {VisibleRangeProps} range - The visible range within which the axis positioning is checked.
 * @returns {boolean} True if the axis is inside the visible range; otherwise, false.
 * @private
 */
export function axisInside(axis: AxisModel, range: VisibleRangeProps): boolean {
    return (inside(axis.axisCrossesAt as number, range) ||
        (!axis.isAxisOpposedPosition && (axis.axisCrossesAt as number) >= range.maximum) ||
        (axis.isAxisOpposedPosition && (axis.axisCrossesAt as number) <= range.minimum));
}

/**
 * Updates the cross value of the given axis. If the `crossAt` value is null or the
 * axis is not inside the visible range, further processing is intended.
 *
 * @param {AxisModel} axis - The axis model to update the cross value for. This model
 *                           contains properties like `crossAt` and `crossInAxis`.
 * @returns {void} This function does not return a value.
 * @private
 */
export function updateCrossValue(axis: AxisModel): void {
    let value: number = axis.axisCrossesAt as number;
    const crossAxis: AxisModel = axis.crossInAxis as AxisModel;
    if (value === null || value === undefined || !axisInside(axis, crossAxis.visibleRange)) {
        axis.updatedRect = axis.rect;
        return;
    }
    const range: VisibleRangeProps = crossAxis.visibleRange;
    if (!axis.isAxisOpposedPosition) {
        if (value > range.maximum) {
            value = range.maximum;
        }
    } else {
        if (value < range.minimum) {
            value = range.minimum;
        }
    }
    axis.updatedRect = extend({}, axis.rect, undefined, true) as Rect;
    if (axis.orientation === 'Horizontal') {
        value = crossAxis.rect.height - (valueToCoefficient(value, crossAxis) * crossAxis.rect.height);
        axis.updatedRect.y = crossAxis.rect.y + value;
    } else {
        value = valueToCoefficient(value, crossAxis) * crossAxis.rect.width;
        axis.updatedRect.x = crossAxis.rect.x + value;
    }
}

