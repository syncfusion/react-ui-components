import { isNullOrUndefined } from '@syncfusion/react-base';
import { LabelIntersectMode, TextOverflow } from '../../../base/enum';
import { AxisTextStyle } from '../../../chart-axis/base';
import { getMaxRotatedTextSize, getRotatedTextSize, getTitle, isBreakLabel, isZoomSet, measureText, useTextWrap, valueToCoefficient } from '../../../utils/helper';
import { createDoubleRange } from './DoubleAxisRenderer';
import { AxisModel, Chart, ColumnProps, RowProps, ChartSizeProps, TextStyleModel, VisibleLabel } from '../../../chart-area/chart-interfaces';

/**
 * Calculates the maximum width of visible labels on the specified chart axis.
 *
 * @param {Chart} chart - The chart instance containing the axis.
 * @param {AxisModel} axis - The axis model whose visible labels' width is being calculated.
 * @returns {void} This function does not return any value; it performs the calculation on the provided axis.
 * @private
 */
export function getMaxLabelWidth(chart: Chart, axis: AxisModel): void {
    const visibleLabels: VisibleLabel[] = axis.visibleLabels;
    const action: LabelIntersectMode = axis.labelStyle.intersectAction as LabelIntersectMode;
    let isIntersect: boolean = false;
    let pointX: number; let previousEnd: number = 0;
    axis.angle = (axis.labelStyle.rotationAngle as number) % 360;
    axis.maxLabelSize = { width: 0, height: 0 };
    visibleLabels.forEach((label: VisibleLabel, i: number) => {
        const isAxisLabelBreak: boolean = isBreakLabel(label.originalText);
        const labelStyle: Required<AxisTextStyle> = label.labelStyle as Required<AxisTextStyle>;
        if (isAxisLabelBreak) {
            label.size = getMaxRotatedTextSize([label.originalText.replace(/<br>/g, ' ')], 0, labelStyle, chart.themeStyle.axisLabelFont);
            label.breakLabelSize = getMaxRotatedTextSize([axis.labelStyle.enableTrim ? ((label.text as string[]).join('<br>')) : label.originalText], 0,
                                                         labelStyle, chart.themeStyle.axisLabelFont);
        } else if (axis.labelStyle.enableWrap) {
            const maximumLabelHeight: number = chart.chartAxislayout.initialClipRect.height / visibleLabels.length;
            label.text = useTextWrap(
                label.text as string,
                axis.labelStyle.maxLabelWidth as number,
                labelStyle,
                chart.enableRtl,
                chart.themeStyle.axisLabelFont,
                false,
                (axis.orientation === 'Vertical' ? maximumLabelHeight as number : null) as number
            );
            let maxTextWidth: number = 0;
            let maxTextHeight: number = 0;
            label.text.forEach((textLine: string) => {
                const textSize: ChartSizeProps = measureText(textLine, labelStyle, chart.themeStyle.axisLabelFont);
                maxTextWidth = Math.max(maxTextWidth, textSize.width);
                maxTextHeight += textSize.height;
            });
            label.size.width = maxTextWidth;
            label.size.height = maxTextHeight;
        } else {
            if ((axis.angle === -90 || axis.angle === 90 || axis.angle === 270 || axis.angle === -270) && axis.orientation === 'Vertical') {
                label.size = getRotatedTextSize(label.text as string, labelStyle, axis.angle, chart.themeStyle.axisLabelFont);
            } else {
                label.size = measureText(label.text as string, labelStyle, chart.themeStyle.axisLabelFont);
            }
        }

        const labelWidth: number = isAxisLabelBreak ? label.breakLabelSize.width : label.size.width;
        if (labelWidth > axis.maxLabelSize.width) {
            axis.maxLabelSize.width = labelWidth;
            axis.rotatedLabel = label.text as string;
        }
        const labelHeight: number = isAxisLabelBreak ? label.breakLabelSize.height : label.size.height;
        if (labelHeight > axis.maxLabelSize.height) {
            axis.maxLabelSize.height = labelHeight;
        }
        if (isAxisLabelBreak) {
            label.text = axis.labelStyle.enableTrim ? label.text : label.originalText.split('<br>');
        }
        if (action !== 'None' && axis.orientation === 'Horizontal' && axis.rect.width > 0 && !isIntersect) {
            const newwidth: number = isAxisLabelBreak ? label.breakLabelSize.width : label.size.width;
            pointX = (valueToCoefficient(label.value, axis) * axis.rect.width) + axis.rect.x;
            pointX -= newwidth / 2;

            if (axis.labelStyle.edgeLabelPlacement === 'Shift') {
                if (i === 0 && pointX < axis.rect.x) {
                    pointX = axis.rect.x;
                }
                if (i === visibleLabels.length - 1 && ((pointX + newwidth) > (axis.rect.x + axis.rect.width))) {
                    pointX = axis.rect.x + axis.rect.width - newwidth;
                }
            }
            let height: number;
            switch (action) {
            case 'Hide':
            case 'Trim':
                break;
            case 'MultipleRows':
                if (i > 0) {
                    findMultiRows(i, axis, pointX, label, isAxisLabelBreak);
                }
                break;

            case 'Rotate45':
            case 'Rotate90':
                if (i > 0 && (!axis.isAxisInverse ? pointX <= previousEnd : pointX + newwidth >= previousEnd)) {
                    axis.angle = action === 'Rotate45' ? 45 : 90;
                    isIntersect = true;
                }
                break;

            default:
                if (isAxisLabelBreak) {
                    let result: string[];
                    const result1: string[] = [];
                    for (let index: number = 0; index < label.text.length; index++) {
                        result = useTextWrap(
                            label.text[index as number],
                            axis.rect.width / visibleLabels.length,
                            labelStyle,
                            chart.enableRtl,
                            chart.themeStyle.axisLabelFont,
                            false
                        );
                        if (result.length > 1) {
                            result1.push(...result);
                        } else {
                            result1.push(result[0]);
                        }
                    }
                    label.text = result1;
                } else {
                    label.text = useTextWrap(
                        label.text as string,
                        axis.rect.width / visibleLabels.length,
                        labelStyle,
                        chart.enableRtl,
                        chart.themeStyle.axisLabelFont,
                        false
                    );
                }
                height = label.size.height * label.text.length;
                if (height > axis.maxLabelSize.height) {
                    axis.maxLabelSize.height = height;
                }
                break;
            }
            previousEnd = axis.isAxisInverse ? pointX : pointX + newwidth;
        }
    });
    if (axis.angle !== 0 && axis.angle !== undefined && axis.orientation === 'Horizontal') {
        const isHorizontalAngle: boolean = axis.angle === -360 || axis.angle === 0 || axis.angle === -180 ||
         axis.angle === 180 || axis.angle === 360;
        if (axis.labelStyle.position === 'Outside' && !isHorizontalAngle && isBreakLabel(axis.rotatedLabel)) {
            axis.maxLabelSize = { width: axis.maxLabelSize.height, height: axis.maxLabelSize.width };
        } else {
            axis.maxLabelSize = getRotatedTextSize(axis.rotatedLabel, axis.labelStyle as TextStyleModel,
                                                   axis.angle, chart.themeStyle.axisLabelFont);
        }
    } else if (axis.angle !== 0 && axis.angle !== undefined && axis.orientation === 'Vertical') {
        axis.rotatedLabel = isNullOrUndefined(axis.rotatedLabel) ? '' : axis.rotatedLabel;
        const isHorizontalAngle: boolean = axis.angle === -360 || axis.angle === 0 || axis.angle === -180 ||
         axis.angle === 180 || axis.angle === 360;
        if (axis.labelStyle.position === 'Outside' && !isHorizontalAngle && isBreakLabel(axis.rotatedLabel)) {
            axis.maxLabelSize = { width: axis.maxLabelSize.height, height: axis.maxLabelSize.width };
        } else {
            axis.maxLabelSize = getRotatedTextSize(axis.rotatedLabel, axis.labelStyle as TextStyleModel,
                                                   axis.angle, chart.themeStyle.axisLabelFont);
        }
    }
}

/**
 * Finds the maximum size required for axis labels, incorporating inner padding.
 *
 * @param {AxisModel} axis - The axis model containing label information.
 * @param {number} innerPadding - The padding inside the chart area contributing to the label size.
 * @param {RowProps | ColumnProps} definition - The row or column model defining layout properties.
 * @param {Chart} chart - The chart instance containing the axis.
 * @returns {number} The determined size for the axis labels considering padding and layout.
 * @private
 */
export function findLabelSize(axis: AxisModel, innerPadding: number, definition: RowProps | ColumnProps, chart: Chart): number {
    let titleSize: number = 0;
    const isHorizontal: boolean = axis.orientation === 'Horizontal';
    if (axis.titleStyle.text) {
        if (axis.titleStyle.rotationAngle === undefined) {
            axis.titleSize = measureText(axis.titleStyle.text, axis.titleStyle as TextStyleModel, chart.themeStyle.axisTitleFont);
            titleSize = axis.titleSize.height + innerPadding;
        }
        else {
            axis.titleSize = getRotatedTextSize(axis.titleStyle.text, axis.titleStyle as TextStyleModel,
                                                axis.titleStyle.rotationAngle, chart.themeStyle.axisTitleFont);
            titleSize = (axis.orientation === 'Vertical' ? axis.titleSize.width : axis.titleSize.height) + innerPadding;
        }
        if (axis.rect.width || axis.rect.height) {
            const length: number = isHorizontal ? axis.rect.width : axis.rect.height;
            axis.titleCollection = getTitle(
                axis.titleStyle.text, axis.titleStyle as TextStyleModel, length, chart.enableRtl,
                chart.themeStyle.axisTitleFont, axis.titleStyle?.overflow as TextOverflow);
            titleSize *= axis.titleCollection.length;
        }
    }

    const labelSize: number = titleSize + innerPadding + (axis.titleStyle.padding as number) + (axis.labelStyle.padding as number) +
        (axis.orientation === 'Vertical' ? axis.maxLabelSize.width : axis.maxLabelSize.height);
    const computedTitlePadding: number = ((axis.titleStyle.text !== '' && axis.titleStyle.padding !== 5) ? axis.titleStyle.padding as number : 0);
    if (axis.isAxisOpposedPosition) {
        definition.insideFarSizes.push(labelSize);
    } else {
        definition.insideNearSizes.push(labelSize);
    }

    if (axis.labelStyle.position === 'Inside') {
        if ((axis.isAxisOpposedPosition && definition.farSizes.length < 1) ||
            (!axis.isAxisOpposedPosition && definition.nearSizes.length < 1)) {
            innerPadding = (axis.labelStyle.position === 'Inside' && (chart.axes.indexOf(axis) > -1)) ? -5 : 5;
            return titleSize + innerPadding + computedTitlePadding;
        } else {
            return titleSize + innerPadding + computedTitlePadding + (axis.labelStyle.padding || 0) +
                (axis.orientation === 'Vertical' ? axis.maxLabelSize.width : axis.maxLabelSize.height);
        }
    }
    return labelSize;
}

/**
 * Refreshes the axis by resetting its graphical rectangle dimensions.
 *
 * @param {Chart} chart - The chart instance containing the collection of axes to be refreshed.
 * @returns {void} This function does not return a value; it modifies the chart's axes in place.
 * @private
 */
export function refreshAxis(chart: Chart): void {
    for (const axis of chart.axisCollection) {
        axis.rect = {
            x: axis.isAxisOpposedPosition ? -Infinity : Infinity,
            y: axis.isAxisOpposedPosition ? Infinity : -Infinity, width: 0, height: 0
        };
        axis.isStack100 = false;
    }
}

/**
 * Determines the arrangement of axis labels over multiple rows, considering label breaks and alignment.
 *
 * @param {number} length - The total number of labels to consider for multi-row arrangement.
 * @param {AxisModel} axis - The axis model containing label information and properties.
 * @param {number} currentX - The current X position of the label being processed.
 * @param {VisibleLabel} currentLabel - The current label being evaluated for row placement.
 * @param {boolean} isBreakLabels - Indicates if the labels are allowed to break or wrap.
 * @returns {void} This function does not return a value; it adjusts the label positions on the axis.
 * @private
 */
function findMultiRows(length: number, axis: AxisModel, currentX: number, currentLabel: VisibleLabel, isBreakLabels: boolean): void {
    const store: number[] = [];
    let label: VisibleLabel;
    let isMultiRows: boolean;
    let pointX: number; let width2: number;
    for (let i: number = length - 1; i >= 0; i--) {
        label = axis.visibleLabels[i as number];
        width2 = isBreakLabels ? label.breakLabelSize.width : label.size.width;
        pointX = (valueToCoefficient(label.value, axis) * axis.rect.width) + axis.rect.x;
        isMultiRows = !axis.isAxisInverse ? currentX < (pointX + width2 * 0.5) :
            currentX + currentLabel.size.width > (pointX - width2 * 0.5);
        if (isMultiRows) {
            store.push(label.index);
            currentLabel.index = (currentLabel.index > label.index) ? currentLabel.index : label.index + 1;
        } else {
            currentLabel.index = store.indexOf(label.index) > - 1 ? currentLabel.index : label.index;
        }
    }
    const height: number = ((isBreakLabels ? currentLabel.breakLabelSize.height : currentLabel.size.height) * currentLabel.index) +
        (5 * (currentLabel.index - 1));
    if (height > axis.maxLabelSize.height) {
        axis.maxLabelSize.height = height;
    }
}

/**
 * Calculate the visible range for the axis.
 *
 * @param {AxisModel} axis - The axis model containing label information and properties.
 * @returns {void}
 * @private
 */
export function calculateVisibleRangeOnZooming(axis: AxisModel): void {
    if (isZoomSet(axis)) {
        let start: number;
        let end: number;
        if (!axis.isAxisInverse) {
            start = axis.actualRange.minimum + (axis.zoomPosition as number) * axis.actualRange.delta;
            end = start + (axis.zoomFactor as number) * axis.actualRange.delta;
        } else {
            start = axis.actualRange.maximum - ((axis.zoomPosition as number) * axis.actualRange.delta);
            end = start - ((axis.zoomFactor as number) * axis.actualRange.delta);
        }
        axis.doubleRange = createDoubleRange(start, end);
        axis.visibleRange = {
            minimum: axis.doubleRange.start, maximum: axis.doubleRange.end,
            delta: axis.doubleRange.delta, interval: axis.visibleRange.interval
        };
    }
}
