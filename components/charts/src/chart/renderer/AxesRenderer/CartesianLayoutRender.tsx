import { extend } from '@syncfusion/react-base';
import { ChartBorderProps, ChartLocationProps } from '../../base/interfaces';
import { degreeToRadian, getRotatedTextSize, inside, isBreakLabel, isRotatedRectIntersect, measureText, stringToNumber, useTextTrim, withInBounds } from '../../utils/helper';
import { findLabelSize, refreshAxis } from './AxisTypeRenderer/AxisUtils';
import { calculateDoubleAxis } from './AxisTypeRenderer/DoubleAxisRenderer';
import { JSX } from 'react';
import { Orientation } from '../../base/enum';
import { calculateCategoryAxis } from './AxisTypeRenderer/CategoryAxisRenderer';
import { calculateDateTimeAxis } from './AxisTypeRenderer/DateTimeAxisRenderer';
import { calculateLogarithmicAxis } from './AxisTypeRenderer/LogarithmicAxisRenderer';
import { calculateRowSize } from './ChartRowsRender';
import { calculateColumnSize } from './ChartColumnsRender';
import { AxisModel, Chart, ChartAxisLayout, ColumnProps, PathOptions, Rect, RowProps, ChartSizeProps, TextOption, TextStyleModel, Thickness, VisibleLabel } from '../../chart-area/chart-interfaces';
import { crossAt, updateCrossValue, axisInside } from './AxisTypeRenderer/CrossAxisHerlper';

/**
 * Measures and computes the layout of axes within the given chart rectangle.
 *
 * @param {Rect} rect - The bounding rectangle (`Rect`) available for the chart, typically the full chart area excluding padding.
 * @param {Chart} chart - The chart instance (`Chart`) for which the axis layout needs to be measured.
 * @returns {void}
 * @private
 */
export function measureAxis(rect: Rect, chart: Chart): void {

    const chartAxisLayout: ChartAxisLayout = {
        initialClipRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        leftSize: 0,
        rightSize: 0,
        topSize: 0,
        bottomSize: 0,
        seriesClipRect: { x: 0, y: 0, width: 0, height: 0 }
    };
    const chartAreaWidth: number = chart.chartArea.width ? stringToNumber(chart.chartArea.width, chart.availableSize.width) : 0;
    crossAt(chart);
    chartAxisLayout.seriesClipRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    chart.chartAxislayout = chartAxisLayout;
    measureRowAxis(chart, chartAxisLayout.initialClipRect);
    chartAxisLayout.initialClipRect = subtractThickness(
        chartAxisLayout.initialClipRect, { left: chartAxisLayout.leftSize, right: chartAxisLayout.rightSize, top: 0, bottom: 0 });
    measureColumnAxis(chart, chartAxisLayout.initialClipRect);
    chartAxisLayout.initialClipRect = subtractThickness(
        chartAxisLayout.initialClipRect, { left: 0, right: 0, top: chartAxisLayout.topSize, bottom: chartAxisLayout.bottomSize });
    calculateAxisSize(chartAxisLayout.initialClipRect, chart);
    chartAxisLayout.leftSize = 0;
    chartAxisLayout.rightSize = 0;
    chartAxisLayout.topSize = 0;
    chartAxisLayout.bottomSize = 0;
    measureRowAxis(chart, chartAxisLayout.initialClipRect);
    chartAxisLayout.seriesClipRect = subtractThickness(
        chartAxisLayout.seriesClipRect, { left: chartAxisLayout.leftSize, right: chartAxisLayout.rightSize, top: 0, bottom: 0 });
    measureColumnAxis(chart, chartAxisLayout.seriesClipRect);
    chartAxisLayout.seriesClipRect = subtractThickness(
        chartAxisLayout.seriesClipRect, { left: 0, right: 0, top: chartAxisLayout.topSize, bottom: chartAxisLayout.bottomSize });
    if (chartAreaWidth) {
        calculateFixedChartArea(chart, chartAreaWidth);
    }
    refreshAxis(chart);
    calculateAxisSize(chartAxisLayout.seriesClipRect, chart);
}

/**
 * Measures the row axis on the given chart and adjusts its size according to the specified rectangular area.
 *
 * @param {Chart} chart - The chart for which the row axis is being measured.
 * @param {Rect} rect - The rectangular area used as a reference for measuring the row axis.
 * @returns {void} This function does not return any value.
 * @private
 */
export function measureRowAxis(chart: Chart, rect: Rect): void {
    calculateRowSize(chart, rect);
    const chartAxisLayout: ChartAxisLayout = chart.chartAxislayout;
    for (const row of chart.rows) {
        row.nearSizes = [];
        row.farSizes = [];
        row.insideNearSizes = [];
        row.insideFarSizes = [];
        arrangeAxis(row);
        measureDefinition(row, chart, { width: chart.availableSize.width, height: row.computedHeight });
        if (chartAxisLayout.leftSize < calculateAxisSum(row.nearSizes)) {
            chartAxisLayout.leftSize = calculateAxisSum(row.nearSizes);
        }
        if (chartAxisLayout.rightSize < calculateAxisSum(row.farSizes)) {
            chartAxisLayout.rightSize = calculateAxisSum(row.farSizes);
        }
    }
}

/**
 * Measures the column axis on the given chart and adjusts its size based on the specified rectangular area.
 *
 * @param {Chart} chart - The chart whose column axis is being measured.
 * @param {Rect} rect - The rectangular area used as a reference to measure the column axis.
 * @returns {void} This function does not return any value.
 * @private
 */
function measureColumnAxis(chart: Chart, rect: Rect): void {
    calculateColumnSize(rect, chart);
    const chartAxisLayout: ChartAxisLayout = chart.chartAxislayout;
    for (const column of chart.columns) {
        column.farSizes = [];
        column.nearSizes = [];
        column.insideNearSizes = [];
        column.insideFarSizes = [];
        arrangeAxis(column);
        measureDefinition(column, chart, { width: column.computedWidth, height: chart.availableSize.height });
        if (chartAxisLayout.bottomSize < calculateAxisSum(column.nearSizes)) {
            chartAxisLayout.bottomSize = calculateAxisSum(column.nearSizes);
        }
        if (chartAxisLayout.topSize < calculateAxisSum(column.farSizes)) {
            chartAxisLayout.topSize = calculateAxisSum(column.farSizes);
        }
    }
}

/**
 * Computes the sum of an array of numbers.
 *
 * @param {number[]} values - An array of numbers to be summed.
 * @returns {number} The total sum of the numbers in the array.
 * @private
 */
export function calculateAxisSum(values: number[]): number {
    return values.reduce((acc: number, value: number) => acc + value, 0);
}

/**
 * Arranges the axes for the given definition, preparing an axis collection.
 *
 * @param {RowProps | ColumnProps} definition - The definition containing the axis properties to be arranged.
 * @returns {void} This function does not return a value.
 * @private
 */
function arrangeAxis(definition: RowProps | ColumnProps): void {
    const axisCollection: AxisModel[] = [];

    for (let i: number = 0, len: number = definition.axes.length; i <= len; i++) {
        if (definition.axes[i as number]) {
            axisCollection.push(definition.axes[i as number]);
        }
    }

    definition.axes = axisCollection;
}

/**
 * Measures the given definition to adjust axis sizes based on the chart and size provided.
 *
 * @param {RowProps | ColumnProps} definition - The axis-related definition to be measured.
 * @param {Chart} chart - The chart to which the axes belong.
 * @param {ChartSizeProps} size - The size object used for measurement reference.
 * @returns {void} This function does not return a value.
 * @private
 */
function measureDefinition(definition: RowProps | ColumnProps, chart: Chart, size: ChartSizeProps): void {
    const axisPadding: number = 10;
    for (const axis of definition.axes) {
        axis.chart = chart;
        switch (axis.valueType) {
        case 'Double':
            calculateDoubleAxis(size, axis, chart);
            break;
        case 'DateTime':
            calculateDateTimeAxis(size, axis, chart);
            break;
        case 'Category':
            calculateCategoryAxis(size, axis, chart);
            break;
        case 'Logarithmic':
            calculateLogarithmicAxis(size, axis, chart);
            break;
        }
        computeSize(axis, definition, chart);
    }

    if (definition.farSizes.length > 0) {
        definition.farSizes[definition.farSizes.length - 1] -= axisPadding;
    }
    if (definition.nearSizes.length > 0) {
        definition.nearSizes[definition.nearSizes.length - 1] -= axisPadding;
    }
}

/**
 * Computes and assigns the size for the given axis based on its definition.
 *
 * @param {AxisModel} axis - The axis model object containing details about the axis.
 * @param {RowProps | ColumnProps} definition - The definition of the row or column model affecting layout.
 * @param {Chart} chart - The chart instance to which this axis belongs and is being rendered for.
 * @returns {void}
 * @private
 */
export function computeSize(axis: AxisModel, definition: RowProps | ColumnProps, chart: Chart): void {
    let width: number = 0;
    const innerPadding: number = 5;

    if (axis.visible && axis.internalVisibility) {
        width = findTickSize(axis) + findLabelSize(axis, innerPadding, definition, chart) +
            ((axis.lineStyle?.width as number) * 0.5);
    }
    if (axis.isAxisOpposedPosition) {
        definition.farSizes.push(width);
    } else {
        definition.nearSizes.push(width);
    }
}

/**
 * Modifies the given rectangle by reducing its size based on the provided thickness.
 *
 * @param {Rect} rect - The rectangle that will be adjusted in place by subtracting thickness.
 * @param {Thickness} thickness - The thickness values to subtract from each side of the rectangle.
 * @returns {Rect} - The modified rectangle with updated dimensions.
 * @private
 */
export function subtractThickness(rect: Rect, thickness: Thickness): Rect {
    rect.x += thickness.left;
    rect.y += thickness.top;
    rect.width -= thickness.left + thickness.right;
    rect.height -= thickness.top + thickness.bottom;
    return rect;
}

/**
 * Computes the offset value for an axis based on given position values and plot offset.
 *
 * @param {number} position1 - The primary position value.
 * @param {number} position2 - The secondary position value.
 * @param {number} plotOffset - The default plot offset value.
 * @returns {number} The calculated offset for the axis.
 * @private
 */
function getAxisOffsetValue(position1: number, position2: number, plotOffset: number): number {
    return position1 ? (position1 + (position2 ? position2 : plotOffset)) : (position2 ? position2 + plotOffset : 2 * plotOffset);
}

/**
 * Returns a new array containing the elements from the start of the input array up to the specified index.
 *
 * @param {number[]} values - The input array of numbers.
 * @param {number} index - The index up to which elements are included in the new array.
 * @returns {number[]} A new array containing elements from the start up to the specified index.
 * @private
 */
function subArray(values: number[], index: number): number[] {
    return values.slice(0, index);
}

/**
 * Calculates the size of the axis for a given chart based on the provided rectangular area.
 *
 * @param {Rect} rect - The rectangular area to calculate the axis size within.
 * @param {Chart} chart - The chart for which the axis size is calculated.
 * @returns {void} This function does not return a value.
 * @private
 */
function calculateAxisSize(rect: Rect, chart: Chart): void {
    calculateRowSize(chart, rect);
    let x: number;
    let y: number;
    for (let i: number = 0; i < chart.rows.length; i++) {
        const row: RowProps = chart.rows[i as number];
        let nearCount: number = 0;
        let farCount: number = 0;

        for (let j: number = 0; j < row.axes.length; j++) {
            const axis: AxisModel = row.axes[j as number];
            const axisOffset: number = 0;

            if (axis.rect.height === 0) {
                axis.rect.height = row.computedHeight;
                let size: number = 0;
                for (let k: number = i + 1, len: number = i + (axis.span as number); k < len; k++) {
                    size += chart.rows[k as number].computedHeight;
                }
                axis.rect.y = (row.computedTop - size) + (axis.plotOffset?.top || axisOffset);
                axis.rect.height += size - getAxisOffsetValue(
                    axis.plotOffset?.top as number, axis.plotOffset?.bottom as number, 0);
                axis.rect.width = 0;
            }
            const ticksHeight: number = axis.majorTickLines.height as number;
            const axisLabelPadding: number = axis.labelStyle.padding as number;
            if (axis.isAxisOpposedPosition) {
                if (axis.labelStyle.position === 'Inside' && axis.orientation === 'Vertical') {
                    if (farCount > 0) {
                        x = rect.x + rect.width + calculateAxisSum(subArray(row.farSizes, farCount))
                            + axis.maxLabelSize.width + (axis.tickPosition === 'Inside' ? ticksHeight : 0) + axisLabelPadding;
                    }
                    else {
                        x = rect.x + rect.width - calculateAxisSum(subArray(row.insideFarSizes, farCount));
                    }
                }
                else {
                    x = rect.x + rect.width + calculateAxisSum(subArray(row.farSizes, farCount));

                }
                axis.rect.x = axis.rect.x >= x ? axis.rect.x : x;
                farCount++;
            } else {
                if (axis.labelStyle.position === 'Inside' && axis.orientation === 'Vertical') {
                    if (nearCount > 0) {
                        x = rect.x - calculateAxisSum(subArray(row.nearSizes, nearCount)) - axis.maxLabelSize.width -
                            (axis.tickPosition === 'Inside' ? ticksHeight : 0) - axisLabelPadding;
                    }
                    else {
                        x = rect.x + calculateAxisSum(subArray(row.insideNearSizes, nearCount));
                    }
                }
                else {
                    x = rect.x - calculateAxisSum(subArray(row.nearSizes, nearCount));
                }
                axis.rect.x = axis.rect.x <= x ? axis.rect.x : x;
                nearCount++;
            }
        }
    }

    calculateColumnSize(rect, chart);

    for (let i: number = 0; i < chart.columns.length; i++) {
        const column: ColumnProps = chart.columns[i as number];
        let nearCount: number = 0;
        let farCount: number = 0;

        for (let j: number = 0; j < column.axes.length; j++) {
            const axis: AxisModel = column.axes[j as number];
            const axisOffset: number = 0;

            if (axis.rect.width === 0) {
                for (let k: number = i, len: number = (i + (axis.span as number)); k < len; k++) {
                    axis.rect.width += chart.columns[k as number].computedWidth;
                }
                axis.rect.x = column.computedLeft + (axis.plotOffset?.left || axisOffset);
                axis.rect.width -= getAxisOffsetValue(
                    axis.plotOffset?.left as number, axis.plotOffset?.right as number, 0);
                axis.rect.height = 0;
            }
            const ticksHeight: number = axis.majorTickLines.height as number;
            const axisLabelPadding: number = axis.labelStyle.padding as number;
            if (axis.isAxisOpposedPosition) {
                if (axis.labelStyle.position === 'Inside' && axis.orientation === 'Horizontal') {
                    if (farCount > 0) {
                        y = rect.y - calculateAxisSum(subArray(column.farSizes, farCount)) - axis.maxLabelSize.height
                            - (axis.tickPosition === 'Inside' ? ticksHeight : 0) - axisLabelPadding;
                    }
                    else {
                        y = rect.y + calculateAxisSum(subArray(column.insideFarSizes, farCount));
                    }
                }
                else {
                    y = rect.y - calculateAxisSum(subArray(column.farSizes, farCount));
                }
                axis.rect.y = axis.rect.y <= y ? axis.rect.y : y;
                farCount++;
            } else {
                if (axis.labelStyle.position === 'Inside' && axis.orientation === 'Horizontal') {
                    if (nearCount > 0) {
                        y = rect.y + rect.height + calculateAxisSum(subArray(column.nearSizes, nearCount)) + axis.maxLabelSize.height
                            + (axis.tickPosition === 'Inside' ? ticksHeight : 0) + axisLabelPadding;
                    }
                    else {
                        y = rect.y + rect.height - calculateAxisSum(subArray(column.insideNearSizes, nearCount));
                    }
                }
                else {
                    y = rect.y + rect.height + calculateAxisSum(subArray(column.nearSizes, nearCount));
                }
                axis.rect.y = axis.rect.y >= y ? axis.rect.y : y;
                nearCount++;
            }
        }
    }
}

/**
 * Renders the axes for the given chart control.
 *
 * @param {Chart} control - The chart control containing the axis collection to be rendered.
 * @returns {void} This function does not return a value.
 * @private
 */
export function renderAxis(control: Chart): void {
    for (let i: number = 0; i < control.axisCollection.length; i++) {
        const axis: AxisModel = control.axisCollection[i as number];
        drawAxis(axis, i, control);
    }
    drawPaneLines(control);
}

/**
 * Draws the pane lines for the specified chart.
 *
 * @param {Chart} chart - The chart instance for which the pane lines need to be drawn.
 * @returns {void} - This function does not return a value; it updates the chart's visualization directly.
 * @private
 */
function drawPaneLines(chart: Chart): void {
    for (let j: number = 0, len: number = chart.rows.length; j < len; j++) {
        const row: RowProps = chart.rows[j as number];
        if (row.border.color) {
            drawBottomLine(chart, row, j, true);
        }
    }
    for (let j: number = 0, len: number = chart.columns.length; j < len; j++) {
        const column: ColumnProps = chart.columns[j as number];
        if (column.border.color) {
            drawBottomLine(chart, column, j, false);
        }
    }
}

/**
 * Draws the bottom line for a chart's row or column based on the given definition.
 *
 * @param {Chart} chart - The chart instance for which the bottom line is drawn.
 * @param {RowProps | ColumnProps} definition - The model definition used to specify dimensions and properties for drawing.
 * @param {number} index - The index of the row or column for which the line is drawn.
 * @param {boolean} isRow - Flag indicating whether the line is drawn for a row (true) or a column (false).
 * @returns {void} - This function does not return a value; it modifies the chart directly.
 * @private
 */
export function drawBottomLine(chart: Chart, definition: RowProps | ColumnProps, index: number, isRow: boolean): void {
    let x1: number; let x2: number;
    let y1: number; let y2: number;
    let definitionName: string;
    if (isRow) {
        definition = definition as RowProps;
        y1 = y2 = definition.computedTop + definition.computedHeight;
        x1 = chart.chartAxislayout.seriesClipRect.x;
        x2 = x1 + chart.chartAxislayout.seriesClipRect.width;
        definitionName = 'Row';
    } else {
        x1 = x2 = (definition as ColumnProps).computedLeft;
        y1 = chart.chartAxislayout.seriesClipRect.y;
        y2 = y1 + chart.chartAxislayout.seriesClipRect.height;
        definitionName = 'Column';
    }
    const optionsLine: PathOptions = {
        id: chart.element.id + '_AxisBottom_' + definitionName + index,
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        strokeWidth: definition.border.width as number,
        stroke: definition.border.color
    };
    chart.paneLineOptions.push(optionsLine);
}

/**
 * Draws the specified axis on the chart by updating its cross value and checking its visibility status.
 *
 * @param {AxisModel} axis - The axis model representing the axis to draw, which includes properties like visibility.
 * @param {number} index - The index of the axis in the chart's collection, used for order and identification.
 * @param {Chart} control - The chart instance that manages rendering and holds configuration for axes and other components.
 * @returns {void} This function does not return a value.
 * @private
 */
function drawAxis(axis: AxisModel, index: number, control: Chart): void {
    updateCrossValue(axis);
    const isVisible: boolean = (axis.visible as boolean && axis.internalVisibility);
    const lineWidth: number = axis.lineStyle?.width as number;
    if (axis.orientation === 'Horizontal') {
        if (isVisible && lineWidth > 0) {
            calculateAxisLineOptions(
                control, axis, index, 0, 0, 0, 0, axis.plotOffset?.left as number,
                axis.plotOffset?.right as number, axis.updatedRect
            );
        }
        calculateXAxisTitleOptions(axis, index, axis.updatedRect, control);
    } else {
        if (isVisible && lineWidth > 0) {
            calculateAxisLineOptions(control, axis, index, 0, 0, axis.plotOffset?.bottom as number,
                                     axis.plotOffset?.top as number, 0, 0, axis.updatedRect);
        }
        calculateYAxisTitleOptions(axis, index, axis.updatedRect, control);
    }
}

/**
 * Draws the axis line on the chart based on the provided axis model and plotting area dimensions.
 *
 * @param {Chart} chart - The chart instance where the axis line will be drawn.
 * @param {AxisModel} axis - The axis model that defines properties such as color, width, and style of the axis line.
 * @param {number} index - The index of the axis in the chart's axis collection.
 * @param {number} plotX - The X-coordinate for the plot area reference point.
 * @param {number} plotY - The Y-coordinate for the plot area reference point.
 * @param {number} plotBottom - The bottom boundary of the plot area.
 * @param {number} plotTop - The top boundary of the plot area.
 * @param {number} plotLeft - The left boundary of the plot area.
 * @param {number} plotRight - The right boundary of the plot area.
 * @param {Rect} rect - The rectangle defining the exact space allocated for the axis.
 * @returns {void} This function does not return any value.
 * @private
 */
function calculateAxisLineOptions(
    chart: Chart, axis: AxisModel, index: number, plotX: number, plotY: number, plotBottom: number, plotTop: number, plotLeft: number,
    plotRight: number, rect: Rect): void {

    const optionsLine: PathOptions = {
        'id': chart.element.id + 'AxisLine_' + index,
        'd': 'M ' + (rect.x - plotX - plotLeft) + ' ' + (rect.y - plotY - plotTop) +
            ' L ' + (rect.x + rect.width + plotX + plotRight) + ' ' + (rect.y + rect.height + plotY + plotBottom),
        strokeDasharray: axis.lineStyle?.dashArray || '',
        strokeWidth: axis.lineStyle?.width as number,
        'stroke': axis.lineStyle?.color || chart.themeStyle.axisLine,
        dashArray: axis.lineStyle?.dashArray || ''
    };
    axis.axisLineOptions = optionsLine;
}

/**
 * Renders the labels for the X-axis of the chart.
 *
 * @param {AxisModel} axis - The axis model containing label configuration and styling for the X-axis.
 * @param {number} index - The index of the axis in the axis collection.
 * @param {Rect} rect - The rectangular area where the axis is being rendered.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @param {Function} xScale - A scaling function used to map axis values to pixel positions.
 * @returns {JSX.Element[]} An array of JSX elements representing the X-axis labels.
 * @private
 */
export function drawXAxisLabels(axis: AxisModel, index: number, rect: Rect, chart: Chart, xScale: Function): JSX.Element {
    const labelElements: JSX.Element[] = [];
    let pointX: number = 0;
    let pointY: number = 0;
    let previousLabel: number = 0;
    const labelSpace: number = axis.labelStyle.padding as number;
    let labelHeight: number;
    let elementSize: ChartSizeProps; let labelPadding: number; let anchor: string; const pixel: number = 10;
    const islabelInside: boolean = axis.labelStyle.position === 'Inside';
    const isOpposed: boolean = axis.isAxisOpposedPosition;
    const tickSpace: number = axis.labelStyle.position === axis.tickPosition ? (axis.majorTickLines.height as number) : 0;
    let padding: number = tickSpace + labelSpace + (axis.lineStyle?.width as number) * 0.5;
    const angle: number = axis.angle % 360;
    const isHorizontalAngle: boolean = (angle === 0 || angle === -180 || angle === 180);
    let labelWidth: number;
    const isInverse: boolean = axis.isAxisInverse;
    let isLeft: boolean = false;
    let previousEnd: number = isInverse ? (rect.x + rect.width) : rect.x;
    let width: number = 0; const length: number = axis.visibleLabels.length;
    let intervalLength: number; let label: VisibleLabel; let isAxisBreakLabel: boolean;
    const scrollBarHeight: number = 0;

    const textPoints: ChartLocationProps[][] = [];
    let rotatedLabelSize: ChartSizeProps = { height: 0, width: 0 };
    padding += (angle === 90 || angle === 270 || angle === -90 || angle === -270) ? (islabelInside ? 5 : -5) : 0;
    const isLabelUnderAxisLine: boolean = ((!isOpposed && !islabelInside) || (isOpposed && islabelInside));
    const newPoints: ChartLocationProps[][] = [];
    const legendWidth: number = 0;
    const isEndAnchor: boolean = isLabelUnderAxisLine ?
        ((360 >= angle && angle >= 180) || (-1 >= angle && angle >= -180)) :
        ((1 <= angle && angle <= 180) || (-181 >= angle && angle >= -360));
    for (let i: number = 0, len: number = length; i < len; i++) {
        extend({}, axis.rect, undefined, true) as Rect;
        label = extend({}, axis.visibleLabels[i as number], undefined, true) as VisibleLabel;
        isAxisBreakLabel = isBreakLabel(label.originalText) || (axis.labelStyle.intersectAction === 'Wrap' && label.text.length > 1);
        pointX = xScale(label.value, rect, axis);
        elementSize = label.size;
        if (axis.labelStyle.enableWrap) {
            elementSize.height = measureText(label.text as string, axis.labelStyle as TextStyleModel,
                                             chart.themeStyle.axisLabelFont).height;
        }
        intervalLength = rect.width / length;
        labelWidth = isAxisBreakLabel ? label.breakLabelSize.width : elementSize.width;
        width = ((axis.labelStyle.intersectAction === 'Trim' || axis.labelStyle.intersectAction === 'Wrap') && angle === 0 &&
            labelWidth > intervalLength) ? intervalLength : labelWidth;
        labelHeight = elementSize.height / 4;
        pointX -= (isAxisBreakLabel || angle !== 0) ? 0 : (width / 2);

        // label X value adjustment for label rotation (Start)
        if (angle !== 0) {
            if (isAxisBreakLabel) {
                pointX -= 0;
            } else {
                pointX -= (angle === -90 || angle === 270 ? -labelHeight : (angle === 90 || angle === -270) ? labelHeight : 0);
            }
        }
        // label X value adjustment for label rotation (End)

        if (axis.labelStyle?.align === 'Right') {
            pointX = pointX + width - pixel;
        } else if (axis.labelStyle?.align === 'Left') {
            pointX = pointX - width + pixel;
        }

        const paddingForBreakLabel: number = isAxisBreakLabel ?
            (isHorizontalAngle ? (axis.opposedPosition || islabelInside ? 0 : elementSize.height) :
                (label.breakLabelSize.width / 2)) : 0;
        padding = isAxisBreakLabel ? (tickSpace + labelSpace + (axis.lineStyle?.width as number) * 0.5) : padding;

        // label Y value adjustment (Start)
        if (islabelInside && angle) {
            if (isAxisBreakLabel) {
                pointY = isOpposed ? (rect.y + padding + (paddingForBreakLabel)) : (rect.y - padding - (paddingForBreakLabel));
            } else {
                pointY = isOpposed ? (rect.y + padding + labelHeight) : (rect.y - padding - labelHeight);
            }
        } else {
            if (isAxisBreakLabel) {
                labelPadding = !isLabelUnderAxisLine ? -(padding + scrollBarHeight + (paddingForBreakLabel)) :
                    padding + scrollBarHeight + (angle ? paddingForBreakLabel : (3 * labelHeight));
            } else {
                labelPadding = !isLabelUnderAxisLine ?
                    -(padding + scrollBarHeight + (angle ? labelHeight : (label.index > 1 ? (2 * labelHeight) : 0))) :
                    padding + scrollBarHeight + ((angle ? 1 : 3) * labelHeight);
            }
            pointY = (rect.y + (labelPadding * label.index));
        }
        // label Y value adjustment (End)

        if (isAxisBreakLabel) {
            anchor = 'middle';
        } else {
            anchor = (chart.enableRtl) ? ((isEndAnchor) ? '' : 'end') : (chart.enableRtl || isEndAnchor) ? 'end' : '';
        }
        const options: TextOption = {
            id: `${chart.element.id}_${index}_AxisLabel_${i}`,
            x: pointX,
            y: pointY,
            anchor: anchor,
            text: getLabelText(label, axis, intervalLength, chart),
            transform: 'rotate(' + angle + ',' + pointX + ',' + pointY + ')',
            labelRotation: angle,
            fill: label.labelStyle?.color || chart.themeStyle.axisLabelFont.color,
            fontSize: label.labelStyle?.fontSize || chart.themeStyle.axisLabelFont.fontSize,
            fontFamily: label.labelStyle?.fontFamily || chart.themeStyle.axisLabelFont.fontFamily,
            fontWeight: label.labelStyle?.fontWeight || chart.themeStyle.axisLabelFont.fontWeight,
            fontStyle: label.labelStyle?.fontStyle || chart.themeStyle.axisLabelFont.fontStyle,
            opacity: axis.labelStyle?.opacity as number,
            baseLine: '',
            XPositionWidth: width,
            isAxisBreakLabel: isAxisBreakLabel
        };

        if (angle !== 0) {
            rotatedLabelSize = getRotatedTextSize(label.originalText, label.labelStyle as TextStyleModel,
                                                  angle, chart.themeStyle.axisLabelFont);
            isLeft = ((angle < 0 && angle > -90) || (angle < -180 && angle > -270) ||
                (angle > 90 && angle < 180) || (angle > 270 && angle < 360));
        }
        switch (axis.labelStyle.edgeLabelPlacement) {
        case 'None':
            break;
        case 'Hide':
            if (((i === 0 || (isInverse && i === len - 1)) &&
                    (anchor === '' ? options.x + labelWidth / 2 < rect.x : options.x < rect.x)) ||
                    ((i === len - 1 || (isInverse && i === 0)) &&
                        (options.x + (angle === 0 ? width : rotatedLabelSize.width) > rect.x + rect.width))) {
                continue;
            }
            break;
        case 'Shift':
            if (i === len - 2 && axis.labelStyle.intersectAction !== 'MultipleRows') {
                if (anchor === 'start' || anchor === '') {
                    previousLabel = options.x + width; // For start anchor
                } else if (anchor === 'middle') {
                    previousLabel = options.x + (width / 2); // For middle anchor
                } else {
                    previousLabel = options.x; // For end anchor
                }
            }
            if ((i === 0 || (isInverse && i === len - 1)) && (options.x < rect.x || (angle !== 0 && isLeft && options.x < rect.x) ||
                    (options.x - (label.size.width / label.text.length) / 2 < rect.x && angle === 0))) {
                intervalLength -= (rect.x - options.x);
                if (anchor === '') {
                    if (options.x <= 0) { pointX = options.x = 0; }
                    else { pointX = options.x; }
                    intervalLength = rect.width / length;
                }
                else if (isLeft && angle !== 0) {
                    intervalLength = rect.width / length;
                    if (rect.x + intervalLength > options.x + rotatedLabelSize.width) {
                        options.x = pointX = rect.x + padding;
                    }
                    else {
                        options.x = pointX = rect.x + intervalLength - padding;
                    }
                }
                else if (isAxisBreakLabel && axis.labelStyle.placement === 'OnTicks' && angle === 0) {
                    let maxWidth: number = 0;
                    for (let i: number = 0; i < label.text.length; i++) {
                        const breakLabelWidth: number = measureText(
                            label.text[i as number] as string,
                            axis.labelStyle as TextStyleModel, chart.themeStyle.axisLabelFont).width;
                        if (breakLabelWidth > maxWidth) {
                            maxWidth = breakLabelWidth;
                        }
                    }
                    options.x = pointX = rect.x + maxWidth / 2;
                }
                else if (!(anchor === 'start' && options.x > 0)) {
                    options.x = pointX = !isHorizontalAngle ? rect.x + padding : rect.x;
                }
            } else if (
                (i === len - 1 || (isInverse && i === 0)) &&
                        (
                            ((options.x + width) > chart.availableSize.width - chart.border.width - legendWidth && (anchor === 'start' || anchor === '') && angle === 0) ||
                            ((anchor === 'start') && angle !== 0 && !isLeft && (options.x + rotatedLabelSize.width) > chart.availableSize.width - chart.border.width - legendWidth) ||
                            (anchor === 'middle' && angle !== 0 && !isLeft && (options.x + rotatedLabelSize.width / 2) > chart.availableSize.width - chart.border.width - legendWidth) ||
                            (anchor === 'end' && angle !== 0 && !isLeft && options.x > chart.availableSize.width - chart.border.width - legendWidth) ||
                            (anchor === 'end' && options.x > chart.availableSize.width - chart.border.width - legendWidth && angle === 0) ||
                            (anchor === 'middle' && (options.x + width / 2) > chart.availableSize.width - chart.border.width - legendWidth && angle === 0)
                        )) {
                const axisLabelWidth: number = angle !== 0 ? rotatedLabelSize.width : width;
                let shiftedXValue: number;
                //Apply a default 5px padding between the edge label and the chart container
                const padding: number = 5;
                if (anchor === 'start' || anchor === '') {
                    shiftedXValue = options.x - ((options.x + axisLabelWidth) -
                                chart.availableSize.width + chart.border.width + padding + legendWidth);
                } else if (anchor === 'middle') {
                    shiftedXValue = options.x - ((options.x + axisLabelWidth / 2) -
                                chart.availableSize.width + chart.border.width + padding + legendWidth);
                } else {
                    shiftedXValue = options.x - (options.x - (chart.availableSize.width + chart.border.width + padding
                                + legendWidth));
                }

                // Check for overlap with previous label
                if (previousLabel !== 0 && shiftedXValue < previousLabel) {
                    const maxAvailableWidth: number = chart.availableSize.width - previousLabel;
                    label.text = useTextTrim(maxAvailableWidth, label.originalText, axis.labelStyle as TextStyleModel,
                                             chart.isRtlEnabled, chart.themeStyle.axisLabelFont);
                } else {
                    options.x = pointX = shiftedXValue;
                }
            }
            break;
        }
        options.text = getLabelText(label, axis, intervalLength, chart);
        options.labelRotation = angle;
        // ------- Hide Calculation (Start) -------------
        // Currect label actual start value (Start)
        let xValue: number; let xValue2: number;
        if (isAxisBreakLabel && angle === 0) {
            xValue = (options.x - (width / 2)); xValue2 = options.x + (width / 2);

        } else {
            xValue = options.x; xValue2 = options.x + width;
        }
        // Currect label actual start value (End)

        if (angle === 0 && axis.labelStyle.intersectAction === 'Hide' && i !== 0 &&
            (!isInverse ? xValue <= previousEnd : xValue2 >= previousEnd)) {
            continue;
        }

        // Previous label actual end value (Start)
        if (isAxisBreakLabel) {
            previousEnd = isInverse ? (options.x - (width / 2)) : options.x + (width / 2);
        } else {
            previousEnd = isInverse ? options.x : options.x + width;
        }

        if (angle !== 0) {
            let height: number; let rect: Rect;
            if (isAxisBreakLabel) {
                let xAdjustment: number = 0; let yAdjustment: number = 0;
                height = (label.breakLabelSize.height);
                yAdjustment = (label.breakLabelSize.height) - 4; // 4 for label bound correction

                // xAdjustment (Start)
                xAdjustment = -(label.breakLabelSize.width / 2);

                if (isLabelUnderAxisLine) {
                    yAdjustment = (label.breakLabelSize.height) / (options.text.length + 1);
                }
                rect = { x: options.x + xAdjustment, y: options.y - (yAdjustment), width: label.breakLabelSize.width, height: height };
            } else {
                height = (pointY) - (options.y - ((label.size.height / 2)));
                rect = { x: options.x, y: options.y - ((label.size.height / 2) - 5), width: label.size.width, height: height };
            }
            const rectCoordinates: ChartLocationProps[] = getRectanglePoints(rect);
            const rectCenterX: number = isAxisBreakLabel ? rect.x + (rect.width / 2) : pointX;
            const rectCenterY: number = isAxisBreakLabel ? rect.y + (rect.height / 2) : (pointY - (height / 2));
            if (isAxisBreakLabel) {
                options.transform = 'rotate(' + angle + ',' + rectCenterX + ',' + rectCenterY + ')';
            } else {
                options.transform = 'rotate(' + angle + ',' + pointX + ',' + pointY + ')';
            }
            newPoints.push(getRotatedRectangleCoordinates(rectCoordinates, rectCenterX, rectCenterY, angle));
            if (axis.labelStyle.intersectAction !== 'None') {
                for (let index: number = i; index > 0; index--) {
                    if (newPoints[i as number] && newPoints[index - 1] &&
                        isRotatedRectIntersect(newPoints[i as number], newPoints[index - 1])) {
                        newPoints[i as number] = [];
                        break;
                    }
                }
            }
            const rotateAngle: boolean = ((angle > 0 && angle < 90) || (angle > 180 && angle < 270) ||
                (angle < -90 && angle > -180) || (angle < -270 && angle > -360));
            const textRect: Rect = {
                x: options.x, y: options.y - (elementSize.height / 2 + padding / 2),
                width: label.size.width, height: height
            };
            const textRectCoordinates: ChartLocationProps[] = getRectanglePoints(textRect);
            const rectPoints: ChartLocationProps[] = [];
            const axisPadding: number = 5;
            rectPoints.push({ x: rotateAngle ? chart.availableSize.width : axisPadding, y: axis.rect.y });
            rectPoints.push({
                x: rotateAngle ? chart.availableSize.width :
                    axisPadding, y: axis.rect.y + axis.maxLabelSize.height
            });
            textPoints.push(getRotatedRectangleCoordinates(textRectCoordinates, rectCenterX, rectCenterY, angle));
            const newRect: Rect = { x: 0, y: axis.rect.y, width: chart.availableSize.width, height: axis.maxLabelSize.height * 2 };
            for (let k: number = 0; k < textPoints[i as number].length; k++) {
                if (!axis.opposedPosition && !withInBounds(textPoints[i as number][k as number].x, textPoints[i as number][k as number].y, newRect) && typeof options.text === 'string') {
                    const interSectPoint: ChartLocationProps = calculateIntersection(
                        textPoints[i as number][0], textPoints[i as number][1], rectPoints[0], rectPoints[1]);
                    const rectPoint1: number = rotateAngle ? chart.availableSize.width - pointX : pointX;
                    const rectPoint2: number = interSectPoint.y - axis.rect.y;
                    const trimValue: number = Math.sqrt((rectPoint1 * rectPoint1) + (rectPoint2 * rectPoint2));
                    options.text = useTextTrim(trimValue, label.text as string, label.labelStyle as TextStyleModel,
                                               chart.enableRtl, chart.themeStyle.axisLabelFont);
                }
            }
        }
        axis.axislabelOptions.push(options);
        labelElements.push(
            <text
                key={options.id}
                id={options.id}
                x={options.x}
                y={options.y}
                textAnchor={options.anchor}
                style={{
                    transition: 'fill 0.4s ease, opacity 0.4s ease'
                }}
                fill={options.fill}
                fontFamily={options.fontFamily}
                fontSize={options.fontSize}
                fontStyle={options.fontStyle}
                fontWeight={options.fontWeight}
                opacity={options.opacity}
                dominantBaseline={options.baseLine}
                transform={axis.angle !== undefined ? `rotate(${axis.angle}, ${options.x}, ${options.y})` : ''}
            >
                {typeof options.text !== 'string' && options.text.length > 1
                    ? options.text.map((line: string, index: number) => (
                        <tspan key={index} x={options.x}
                            dy={index === 0 ? 0 : elementSize.height}>
                            {line}
                        </tspan>
                    ))
                    : options.text
                }
            </text>
        );
    }
    const labelElement: JSX.Element = <>
        <defs>
            <clipPath id={`${chart.element.id}_Axis_Label_${index}_Clip`}>
                <rect x={chart.clipRect.x - axis.maxLabelSize.width} y={chart.chartAreaRect.y}
                    width={chart.chartAreaRect.width + axis.maxLabelSize.width}
                    height={chart.chartAreaRect.height + axis.maxLabelSize.height} />
            </clipPath>
        </defs>
        <g clipPath={`url(#${chart.element.id}_Axis_Label_${index}_Clip)`} id={chart.element.id + '_Axis_' + index + '_Labels'}>
            {labelElements}
        </g>
    </>;
    axis.labelElement = labelElement;
    if (axis.labelStyle.position === 'Outside') {
        return labelElement;
    } else {
        return <></>;
    }
}

/**
 * Get rect coordinates
 *
 * @param {Rect} rect rect
 * @returns {ChartLocationProps[]} rectangle points
 * @private
 */
function getRectanglePoints(rect: Rect): ChartLocationProps[] {
    const point1: ChartLocationProps = { x: rect.x, y: rect.y };
    const point2: ChartLocationProps = { x: rect.x + rect.width, y: rect.y };
    const point3: ChartLocationProps = { x: rect.x + rect.width, y: rect.y + rect.height };
    const point4: ChartLocationProps = { x: rect.x, y: rect.y + rect.height };
    return [point1, point2, point3, point4];
}

/**
 * Get the coordinates of a rotated rectangle.
 *
 * @param {ChartLocationProps[]} actualPoints - The coordinates of the original rectangle.
 * @param {number} centerX - The x-coordinate of the center of rotation.
 * @param {number} centerY - The y-coordinate of the center of rotation.
 * @param {number} angle - The angle of rotation in degrees.
 * @returns {ChartLocationProps[]} - The coordinates of the rotated rectangle.
 * @private
 */
export function getRotatedRectangleCoordinates(
    actualPoints: ChartLocationProps[], centerX: number, centerY: number, angle: number
): ChartLocationProps[] {
    const coordinatesAfterRotation: ChartLocationProps[] = [];
    for (let i: number = 0; i < 4; i++) {
        const point: ChartLocationProps = actualPoints[i as number];
        // translate point to origin
        const tempX: number = point.x - centerX;
        const tempY: number = point.y - centerY;
        // now apply rotation
        const rotatedX: number = tempX * Math.cos(degreeToRadian(angle)) - tempY * Math.sin(degreeToRadian(angle));
        const rotatedY: number = tempX * Math.sin(degreeToRadian(angle)) + tempY * Math.cos(degreeToRadian(angle));
        // translate back
        point.x = rotatedX + centerX;
        point.y = rotatedY + centerY;
        coordinatesAfterRotation.push({ x: point.x, y: point.y });
    }
    return coordinatesAfterRotation;
}

/**
 * Retrieves the text for a given label on the axis, potentially modifying it according to axis settings.
 *
 * @param {VisibleLabel} label - The label object containing text and formatting details.
 * @param {AxisModel} axis - The axis model related to the label.
 * @param {number} intervalLength - The interval length for spacing labels along the axis.
 * @param {Chart} chart - The chart instance that provides context for the axis and its labels.
 * @returns {string} The final text of the label, after processing and any necessary modifications.
 * @private
 */
export function getLabelText(
    label: VisibleLabel,
    axis: AxisModel,
    intervalLength: number,
    chart: Chart
): string | string[] {
    if (isBreakLabel(label.originalText)) {
        const result: string[] = [];
        for (let index: number = 0; index < label.text.length; index++) {
            const str: string = findAxisLabel(axis, label.text[index as number], intervalLength, chart);
            result.push(str);
        }
        return result;
    } else {
        return findAxisLabel(axis, label.text as string, intervalLength, chart);
    }
}

/**
 * Determines the appropriate label for an axis by trimming it if necessary.
 *
 * @param {AxisModel} axis - The axis model containing details for the axis.
 * @param {string} label - The original label of the axis.
 * @param {number} width - The available width for the label.
 * @param {Chart} chart - The chart instance which contains configuration for trimming.
 * @returns {string} The processed label, trimmed if necessary to fit the specified width.
 * @private
 */
export function findAxisLabel(axis: AxisModel, label: string, width: number, chart: Chart): string {
    return (axis.labelStyle.intersectAction === 'Trim' && !axis.labelStyle.enableWrap ?
        ((axis.angle % 360 === 0 && !axis.labelStyle.enableTrim) ?
            useTextTrim(width, label, axis.labelStyle as TextStyleModel, chart.enableRtl, chart.themeStyle.axisLabelFont)
            : label) : label);
}

/**
 * Draws the Y-axis labels for a chart based on the provided axis and scaling function.
 *
 * @param {AxisModel} axis - The axis model that defines the parameters for the labels.
 * @param {number} index - The index position for the label in the axis label collection.
 * @param {Rect} rect - The rectangular area where the labels will be drawn.
 * @param {Chart} chart - The chart object for which the labels are being drawn.
 * @param {Function} yScale - The scaling function used to position the labels correctly.
 * @returns {JSX.Element[]} An array of JSX elements representing each Y-axis label.
 * @private
 */
export function drawYAxisLabels(axis: AxisModel, index: number, rect: Rect, chart: Chart, yScale: Function): JSX.Element {
    const labelElements: JSX.Element[] = [];
    let label: VisibleLabel;
    let pointX: number = 0;
    let pointY: number = 0;
    let elementSize: ChartSizeProps;
    const labelSpace: number = axis.labelStyle.padding as number;
    let isAxisBreakLabel: boolean;
    const isLabelInside: boolean = axis.labelStyle.position === 'Inside';
    const isOpposed: boolean = axis.isAxisOpposedPosition;
    let RotatedWidth: number;
    const tickSpace: number = axis.labelStyle.position === axis.tickPosition ? (axis.majorTickLines.height as number) : 0;
    let padding: number = tickSpace + labelSpace + (axis.lineStyle?.width as number) * 0.5;
    const angle: number = axis.angle % 360;
    const isVerticalAngle: boolean = (angle === -90 || angle === 90 || angle === 270 || angle === -270);
    padding += (isVerticalAngle) ? (isLabelInside ? 5 : -5) : 0;
    padding = (isOpposed) ? padding : -padding;
    const scrollBarHeight: number = 0;
    let textHeight: number; let textPadding: number; let maxLineWidth: number; const pixel: number = 10;
    const isInverse: boolean = axis.isAxisInverse;
    let previousEnd: number = isInverse ? rect.y : (rect.y + rect.height);
    let labelPadding: number; let intervalLength: number; let labelHeight: number; let yAxisLabelX: number;
    const isLabelOnAxisLineLeft: boolean = ((!isOpposed && !isLabelInside) || (isOpposed && isLabelInside));
    if (isLabelInside) {
        labelPadding = !isLabelOnAxisLineLeft ? -padding : padding;
    } else {
        labelPadding = !isLabelOnAxisLineLeft ? -padding + (chart.enableRtl ? -scrollBarHeight : scrollBarHeight) :
            padding + (chart.enableRtl ? -scrollBarHeight : scrollBarHeight);
    }
    const sizeWidth: number[] = []; const breakLabelSizeWidth: number[] = [];
    axis.visibleLabels.map((item: VisibleLabel) => {
        sizeWidth.push(item.size['width']);
        breakLabelSizeWidth.push(item.breakLabelSize['width']);
    });
    const LabelMaxWidth: number = Math.max(...sizeWidth);
    const breakLabelMaxWidth: number = Math.max(...breakLabelSizeWidth);
    RotatedWidth = LabelMaxWidth;
    if (angle >= -45 && angle <= 45 && angle !== 0) {
        RotatedWidth = LabelMaxWidth * Math.cos(angle * Math.PI / 180);
        if (RotatedWidth < 0) { RotatedWidth = - RotatedWidth; }
    }
    for (let i: number = 0, len: number = axis.visibleLabels.length; i < len; i++) {
        label = axis.visibleLabels[i as number];
        isAxisBreakLabel = isBreakLabel(label.originalText);
        elementSize = isAxisBreakLabel ? axis.visibleLabels[i as number].breakLabelSize : label.size;
        pointY = yScale(label.value, axis.updatedRect, axis);
        textHeight = ((elementSize.height / 8) * axis.visibleLabels[i as number].text.length / 2);
        textPadding = (chart.requireInvertedAxis && axis.labelStyle.position === 'Inside') ? 0 : ((elementSize.height / 4) * 3) + 3;
        intervalLength = rect.height / axis.visibleLabels.length;
        labelHeight = ((axis.labelStyle.intersectAction === 'Trim' || axis.labelStyle.intersectAction === 'Wrap') && angle !== 0 &&
            elementSize.width > intervalLength) ? intervalLength : elementSize.width;
        pointY = (isAxisBreakLabel ? (axis.labelStyle.position === 'Inside' ? (pointY - (elementSize.height / 2) - textHeight + textPadding)
            : (pointY - textHeight)) : (axis.labelStyle.position === 'Inside' ? pointY + textPadding : pointY));
        if (axis.labelStyle.position === 'Inside' && ((i === 0 && !axis.inverted) || (i === len - 1 && axis.inverted))) {
            pointY -= (textPadding - ((chart.requireInvertedAxis && axis.labelStyle.position === 'Inside') ? 0 : (axis.opposedPosition ? -padding : padding)));
        }
        const gridWidth: number = axis.majorGridLines.width as number;
        const tickWidth: number = axis.majorTickLines.width as number;
        if (gridWidth > tickWidth) {
            maxLineWidth = gridWidth;
        } else {
            maxLineWidth = tickWidth;
        }

        if (axis.labelStyle?.align === 'Right') {
            pointY = pointY - maxLineWidth - pixel;
        } else if (axis.labelStyle?.align === 'Left') {
            pointY = pointY + maxLineWidth + pixel;
        }

        // label X value adjustment (Start)
        if (isLabelInside) {
            yAxisLabelX = labelPadding + ((angle === 0 ? elementSize.width :
                (isAxisBreakLabel ? breakLabelMaxWidth : LabelMaxWidth)) / 2);
        } else {
            yAxisLabelX = labelPadding - ((angle === 0 ? elementSize.width :
                (isAxisBreakLabel ? breakLabelMaxWidth : RotatedWidth)) / 2);
        }
        if (axis.labelStyle.enableWrap && chart.requireInvertedAxis && angle && ((!axis.opposedPosition && axis.labelStyle.position === 'Inside') || (axis.opposedPosition && axis.labelStyle.position === 'Outside'))) {
            yAxisLabelX = axis.opposedPosition ? yAxisLabelX - LabelMaxWidth / 2 : yAxisLabelX + LabelMaxWidth / 2;
        }
        pointX = isOpposed ? (rect.x - yAxisLabelX) : (rect.x + yAxisLabelX);
        if (isVerticalAngle) {
            pointX += (isOpposed) ? 5 : -5;
        }
        yAxisLabelX = labelPadding;
        const options: TextOption = {
            id: `${chart.element.id}${index}_AxisLabel_${i}`,
            x: pointX,
            y: pointY,
            anchor: 'middle',
            text: label.text,
            transform: `rotate(${angle},${pointX},${pointY})`,
            labelRotation: angle,
            fill: label.labelStyle?.color || chart.themeStyle.axisLabelFont.color,
            fontSize: label.labelStyle?.fontSize || chart.themeStyle.axisLabelFont.fontSize,
            fontFamily: label.labelStyle?.fontFamily || chart.themeStyle.axisLabelFont.fontFamily,
            fontWeight: label.labelStyle?.fontWeight || chart.themeStyle.axisLabelFont.fontWeight,
            fontStyle: label.labelStyle?.fontStyle || chart.themeStyle.axisLabelFont.fontStyle,
            opacity: axis.labelStyle?.opacity as number,
            baseLine: 'middle'
        };
        switch (axis.labelStyle.edgeLabelPlacement) {
        case 'None':
            break;
        case 'Hide':
            if (((i === 0 || (isInverse && i === len - 1)) && options.y > rect.y) ||
                    (((i === len - 1) || (isInverse && i === 0)) && options.y - elementSize.height * 0.5 < rect.y)) {
                options.text = '';
            }
            break;
        case 'Shift':
            if ((i === 0 || (isInverse && i === len - 1)) && options.y > rect.y + rect.height) {
                options.y = pointY = rect.y + rect.height;
            } else if (((i === len - 1) || (isInverse && i === 0)) &&
                    (options.y <= 0)) {
                options.y = pointY = rect.y + elementSize.height * 0.5;
            }
            break;
        }

        // ------- Hide Calculation (Start) -------------
        let previousYValue: number = options.y; let currentYValue: number = options.y - labelHeight;
        if (isAxisBreakLabel) {
            previousYValue = (options.y - (labelHeight / 2)); currentYValue = options.y + (labelHeight / 2);
        }
        if ((angle === 90 || angle === 270) && axis.labelStyle.intersectAction === 'Hide' && i !== 0 &&
            (!isInverse ? previousYValue >= previousEnd : currentYValue <= previousEnd)) {
            continue;
        }
        previousEnd = isInverse ? previousYValue : currentYValue;
        // ------- Hide Calculation (End) -------------;

        axis.axislabelOptions.push(options);
        labelElements.push(
            <text
                key={options.id}
                id={options.id}
                x={options.x}
                y={options.y}
                textAnchor={options.anchor}
                style={{
                    transition: 'fill 0.4s ease, opacity 0.4s ease'
                }}
                fill={options.fill}
                fontFamily={options.fontFamily}
                fontSize={options.fontSize}
                fontStyle={options.fontStyle}
                fontWeight={options.fontWeight}
                opacity={options.opacity}
                dominantBaseline={options.baseLine}
                transform={axis.angle !== undefined ? `rotate(${axis.angle}, ${options.x}, ${pointY})` : ''}
            >
                {typeof options.text !== 'string' && options.text.length > 1
                    ? options.text.map((line: string, index: number) => (
                        <tspan key={index} x={options.x}
                            dy={index === 0 ? 0 : label.size.height}>
                            {line}
                        </tspan>
                    ))
                    : options.text
                }
            </text>
        );
    }
    const axislabelElement: JSX.Element = <>
        <g id={chart.element.id + '_Axis_' + index + '_Labels'}>
            {labelElements}
        </g>
    </>;
    axis.labelElement = axislabelElement;
    if (axis.labelStyle.position === 'Outside') {
        return axislabelElement;
    } else {
        return <></>;
    }
}

/**
 * Draws the title for the Y-axis of the chart.
 *
 * @param {AxisModel} axis - The axis model containing details for the axis.
 * @param {number} index - The index position of the axis in its collection.
 * @param {Rect} rect - The rectangle area where the axis title will be drawn.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @returns {void}
 * @private
 */
function calculateYAxisTitleOptions(axis: AxisModel, index: number, rect: Rect, chart: Chart): void {
    if (!axis.titleStyle.text) { return; }

    let isRotated: boolean = false;
    const labelPadding: number = 5;
    const isOpposed: boolean = axis.isAxisOpposedPosition;
    const labelRotation: number = (axis.titleStyle.rotationAngle === undefined ?
        (isOpposed ? 90 : -90) : axis.titleStyle.rotationAngle) % 360;
    let padding: number =
        (axis.tickPosition === 'Inside' ? 0 : (axis.majorTickLines.height as number) + (axis.titleStyle.padding as number)) +
        (axis.labelStyle.position === 'Inside' ? 0 : axis.maxLabelSize.width + labelPadding);

    padding =
        axis.tickPosition !== 'Outside' && (axis.tickPosition === 'Inside' || axis.labelStyle.position === 'Inside')
            ? (axis.titleStyle.padding === 5 ? padding : padding + (axis.titleStyle.padding as number))
            : padding;

    const scrollPadding: number = 0;
    padding = isOpposed ? padding + scrollPadding : -padding - scrollPadding;
    if ((labelRotation !== -90 && !isOpposed) || (labelRotation !== 90 && isOpposed)) {
        const axislabelPadding: number = axis.labelStyle.padding as number;
        const labelPad: number = axis.labelStyle.position === 'Inside' ? axislabelPadding !== 5 ? 0 :
            axislabelPadding : axislabelPadding;
        padding += isOpposed
            ? axis.titleSize.width / 2 + labelPad
            : -axis.titleSize.width / 2 - labelPad;

        isRotated = true;
    }
    const x: number = rect.x + padding;
    let y: number;
    let anchor: string;
    switch (axis.titleStyle?.align) {
    case 'Left':
        anchor = axis.opposedPosition ? 'end' : 'start';
        y = rect.height + rect.y;
        break;
    case 'Right':
        anchor = axis.opposedPosition ? 'start' : 'end';
        y = rect.y;
        break;
    default:
        anchor = 'middle';
        y = rect.y + rect.height * 0.5;
        break;
    }

    const titleOffset: number = axis.titleSize.height * (axis.titleCollection.length - 1);
    const labelPad: number =
        axis.labelStyle.position === 'Inside'
            ? axis.labelStyle.padding !== 5
                ? 0
                : (axis.labelStyle.padding as number)
            : (axis.labelStyle.padding as number);

    const finalY: number = y + (isRotated ? -titleOffset : -labelPad - titleOffset);
    const transform: string = `rotate(${labelRotation},${x},${y})`;
    const options: TextOption = {
        id: `${chart.element.id}_AxisTitle_${index}`,
        x: x,
        y: finalY,
        anchor: anchor,
        text: axis.titleCollection,
        transform: transform,
        labelRotation: labelRotation,
        fontFamily: axis.titleStyle?.fontFamily || chart.themeStyle.axisTitleFont.fontFamily,
        fontWeight: axis.titleStyle?.fontWeight || chart.themeStyle.axisTitleFont.fontWeight,
        fontSize: axis.titleStyle?.fontSize || chart.themeStyle.axisTitleFont.fontSize,
        fontStyle: axis.titleStyle?.fontStyle || chart.themeStyle.axisTitleFont.fontStyle,
        opacity: axis.titleStyle?.opacity as number,
        fill: axis.titleStyle?.color || chart.themeStyle.axisTitleFont.color,
        baseLine: ''
    };
    axis.axisTitleOptions.push(options);
}

/**
 * Draws the title for the X-axis of the chart.
 *
 * @param {AxisModel} axis - The axis model containing details for the axis.
 * @param {number} index - The index position of the axis in its collection.
 * @param {Rect} rect - The rectangle area where the axis title will be drawn.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @returns {void}
 * @private
 */
function calculateXAxisTitleOptions(axis: AxisModel, index: number, rect: Rect, chart: Chart): void {
    if (!axis.titleStyle.text) { return; }

    const elementSize: ChartSizeProps = measureText(
        axis.titleStyle.text,
        axis.titleStyle as TextStyleModel,
        chart.themeStyle.axisTitleFont
    );
    const labelRotation: number = (axis.titleStyle.rotationAngle ? axis.titleStyle.rotationAngle : 0) % 360;
    const scrollBarHeight: number = 0;
    let padding: number =
        (axis.tickPosition === 'Inside' ? 0 : (axis.majorTickLines.height as number) + (axis.titleStyle.padding as number)) +
        (axis.labelStyle.position === 'Inside'
            ? 0
            : axis.maxLabelSize.height + (axis.labelStyle.padding  as number));

    padding =
        axis.tickPosition !== 'Outside' &&
            (axis.labelStyle.position === 'Inside' || axis.tickPosition === 'Inside')
            ? axis.titleStyle.padding  === 5
                ? padding
                : padding + (axis.titleStyle.padding  as number)
            : padding;
    padding += 5 / 2;

    const titleSize: number = axis.titleSize.height * (axis.titleCollection.length - 1);
    padding = axis.isAxisOpposedPosition
        ? -(padding + elementSize.height / 4 + scrollBarHeight + titleSize)
        : padding + (3 * elementSize.height) / 4 + scrollBarHeight;

    let y: number = rect.y + padding;
    let x: number;
    let anchor: 'start' | 'middle' | 'end';

    switch (axis.titleStyle?.align) {
    case 'Left':
        anchor = 'start';
        x = rect.x;
        break;
    case 'Right':
        anchor = 'end';
        x = rect.x + rect.width;
        break;
    default:
        anchor = 'middle';
        x = rect.x + rect.width * 0.5;
        break;
    }

    if (labelRotation !== 0) {
        y += axis.opposedPosition
            ? -(axis.titleSize.height / 2 + elementSize.height / 4)
            : axis.titleSize.height / 2 - elementSize.height / 4;
    }

    const options: TextOption = {
        id: `${chart.element.id}_AxisTitle_${index}`,
        x: x,
        y: y,
        anchor: anchor,
        text: axis.titleCollection,
        transform: `rotate(${labelRotation},${x},${y})`,
        labelRotation: axis.titleStyle.rotationAngle as number,
        fontFamily: axis.titleStyle?.fontFamily || chart.themeStyle.axisTitleFont.fontFamily,
        fontWeight: axis.titleStyle?.fontWeight || chart.themeStyle.axisTitleFont.fontWeight,
        fontSize: axis.titleStyle?.fontSize || chart.themeStyle.axisTitleFont.fontSize,
        fontStyle: axis.titleStyle?.fontStyle || chart.themeStyle.axisTitleFont.fontStyle,
        opacity: axis.titleStyle?.opacity as number,
        fill: axis.titleStyle?.color || chart.themeStyle.axisTitleFont.color,
        baseLine: ''
    };
    axis.axisTitleOptions.push(options);
}

/**
 * Determines if the given axis border should be rendered.
 *
 * @param {AxisModel} axis - The axis model to check.
 * @param {number} index - The index of the axis.
 * @param {number} value - The current value on the axis.
 * @param {Rect} seriesClipRect - The rectangle defining the series clipping area.
 * @param {Chart} chart - The chart instance.
 * @returns {boolean} True if the border should be drawn, false otherwise.
 * @private
 */
export function isBorder(axis: AxisModel, index: number, value: number, seriesClipRect: Rect, chart: Chart): boolean {
    const border: Required<ChartBorderProps> = chart.chartArea.border as Required<ChartBorderProps>;
    const rect: Rect = seriesClipRect;
    const orientation: Required<Orientation> = axis.orientation as Required<Orientation>;
    const start: number = orientation === 'Horizontal' ? rect.x : rect.y;
    const size: number = orientation === 'Horizontal' ? rect.width : rect.height;
    const startIndex: number = orientation === 'Horizontal' ? 0 : axis.visibleLabels.length - 1;
    const endIndex: number = orientation === 'Horizontal' ? axis.visibleLabels.length - 1 : 0;

    if ((value === start || value === start + size) &&
        (border.width <= 0 || border.color === 'transparent')) {
        return true;
    } else if ((value !== start && index === startIndex) ||
        (value !== (start + size) && index === endIndex)) {
        return true;
    }
    return false;
}

/**
 * Calculates the appropriate tick size for an axis in relation to its crossing axis.
 *
 * @param {AxisModel} axis - The main axis model for which the tick size is calculated.
 * @param {AxisModel} crossAxis - The crossing axis model that may influence the tick size.
 * @returns {number} The computed tick size for the main axis.
 * @private
 */
export function findTickSize(
    axis: AxisModel
): number {
    if (axis.tickPosition === 'Inside') {
        return 0;
    }
    if (
        axis &&
        (!axis.visibleRange || axisInside(axis, axis.visibleRange))
    ) {
        return 0;
    }

    return (axis.majorTickLines.height as number);
}

/**
 * Calculates and sets the fixed chart area dimensions based on the provided chart and width.
 *
 * @param {Chart} chart - The chart instance for which the fixed area is calculated.
 * @param {number} chartAreaWidth - The width to set for the chart's series clip rectangle.
 * @returns {void}
 * @private
 */
function calculateFixedChartArea(chart: Chart, chartAreaWidth: number): void {
    chart.chartAxislayout.seriesClipRect.width = chartAreaWidth;
    chart.chartAxislayout.seriesClipRect.x = chart.availableSize.width - chart.margin.right - chartAreaWidth;
    // - (chart.legendSettings.position === 'Right' ? chart.legendModule.legendBounds.width : 0);
    for (const item of chart.rows) {
        chart.chartAxislayout.seriesClipRect.x -= calculateAxisSum((item).farSizes);
    }
}

/**
 * Calculates the intersection point of two lines represented by two pairs of coordinates.
 *
 * @param {ChartLocationProps} p1 - The first point of the first line.
 * @param {ChartLocationProps} p2 - The second point of the first line.
 * @param {ChartLocationProps} p3 - The first point of the second line.
 * @param {ChartLocationProps} p4 - The second point of the second line.
 * @returns {ChartLocationProps} The intersection point of the two lines.
 * @private
 */
function calculateIntersection(
    p1: ChartLocationProps, p2: ChartLocationProps,
    p3: ChartLocationProps, p4: ChartLocationProps): ChartLocationProps {
    const c2x: number = p3.x - p4.x;
    const c3x: number = p1.x - p2.x;
    const c2y: number = p3.y - p4.y;
    const c3y: number = p1.y - p2.y;
    const d: number = c3x * c2y - c3y * c2x;
    const u1: number = p1.x * p2.y - p1.y * p2.x;
    const u4: number = p3.x * p4.y - p3.y * p4.x;
    const px: number = (u1 * c2x - c3x * u4) / d;
    const py: number = (u1 * c2y - c3y * u4) / d;
    const p: ChartLocationProps = { x: px, y: py };
    return p;
}

/**
 * Draws major grid lines on a chart based on the given axis and scale.
 *
 * @param {number} index - The index of the grid line.
 * @param {AxisModel} axis - The axis model for which the grid lines are to be drawn.
 * @param {Chart} chart - The chart instance on which the grid lines will appear.
 * @param {AxisModel} currentAxis - The current axis model being used for drawing.
 * @param {Function} scale - The scale function used to determine the placement of the grid lines.
 * @returns {JSX.Element | null} A JSX element representing the grid line, or null if not applicable.
 * @private
 */
export function drawMajorGridLines(
    index: number,
    axis: AxisModel,
    chart: Chart,
    currentAxis: AxisModel,
    scale: Function
): JSX.Element | null {
    const isVertical: boolean = axis.orientation === 'Vertical';
    const seriesClipRect: Rect = chart.chartAxislayout.seriesClipRect;
    const gridElements: JSX.Element[] = [];
    let length: number = axis.visibleLabels.length;
    if (axis.valueType === 'Category' && length > 0 && axis.labelStyle.placement === 'BetweenTicks') {
        length += 1;
    }
    const ticksbwtLabel: number = (axis.valueType === 'Category' && currentAxis.labelStyle.placement === 'BetweenTicks') ? 0.5 : 0;
    for (let i: number = 0; i < length; i++) {
        const tempInterval: number = axis.visibleLabels[i as number] ? axis.visibleLabels[i as number].value - ticksbwtLabel
            : (axis.visibleLabels[i - 1].value + axis.visibleRange.interval) - ticksbwtLabel;
        const position: number = scale(tempInterval, axis.updatedRect, axis);
        const isInBounds: boolean = isVertical
            ? position >= axis.updatedRect.y && axis.updatedRect.y + axis.updatedRect.height >= position
            : position >= axis.updatedRect.x && axis.updatedRect.x + axis.updatedRect.width >= position;
        if (isInBounds && ((inside(tempInterval, axis.visibleRange)) || isBorder(axis, i, position, seriesClipRect, chart))) {
            const element: JSX.Element = <line
                key={'x-major-grid-' + i}
                x1={isVertical ? seriesClipRect.x + ((currentAxis.lineStyle?.width as number) / 2) : position}
                x2={isVertical ? seriesClipRect.x + seriesClipRect.width -
                    ((currentAxis.lineStyle?.width as number) / 2) : position}
                y1={isVertical ? position : seriesClipRect.y}
                y2={isVertical ? position : seriesClipRect.y + seriesClipRect.height}
                stroke={currentAxis.majorGridLines.color || chart.themeStyle.majorGridLine}
                strokeWidth={currentAxis.majorGridLines.width as number}
                strokeDasharray={currentAxis.majorGridLines.dashArray}
            />;
            gridElements.push(element);
        }
    }
    return (
        <g clipPath={`url(#${chart.element.id}_Axis_${index}_Clip)`} id={chart.element.id + '_Axis_' + index + '_Major_Grid_Lines'}>
            {gridElements}
        </g>
    );
}

/**
 * Draws an axis line on a chart.
 *
 * @param {AxisModel} axis - The axis model representing the parameters for the main axis line.
 * @param {AxisModel} currentAxis - Represents the current axis settings being rendered.
 * @param {Chart} chart - The chart object on which the axis line will be drawn.
 * @returns {JSX.Element} A JSX element representing the axis line.
 * @private
 */
export function drawAxisLine(
    axis: AxisModel,
    currentAxis: AxisModel,
    chart: Chart
): JSX.Element {
    return (
        <path
            d={axis.axisLineOptions.d}
            stroke={currentAxis.lineStyle?.color || chart.themeStyle.axisLine}
            strokeWidth={currentAxis.lineStyle?.width}
            strokeDasharray={currentAxis.lineStyle?.dashArray || ''}
            style={{ transition: 'all 0.4s ease' }}
        />
    );
}

/**
 * Draws the Y-axis labels for a chart based on the given axis and scaling function.
 *
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element[]} An array of JSX Elements for the labels.
 * @private
 */
export function drawBottomLines(chart: Chart): JSX.Element {
    return (
        <g id={chart.element.id + 'Definition_Line'}>
            {chart.paneLineOptions.map((line: PathOptions, index: number) => (
                <line
                    key={index}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={line.stroke || 'black'}
                    strokeWidth={line.strokeWidth || 1}
                />
            ))}
        </g>
    );
}


/**
 * Renders the title for a given axis in the chart.
 *
 * @param {AxisModel} axis - The axis model containing the title configuration and styling.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @param {number} index - The index of the axis in the axis collection.
 * @param {AxisModel} currentAxis - The currently processed axis for which the title is being rendered.
 * @returns {JSX.Element} A JSX element representing the axis title.
 * @private
 */
export function drawAxisTitle(axis: AxisModel, chart: Chart, index: number, currentAxis: AxisModel): JSX.Element {
    let titleElement: JSX.Element = <></>;
    axis.axisTitleOptions.map((title: TextOption, i: number) => {
        titleElement =
            <text
                id={chart.element.id + '_AxisTitle_' + index}
                key={title.id || i}
                x={title.x}
                y={title.y}
                textAnchor={title.anchor}
                style={{ transition: 'all 0.4s ease' }}
                fill={currentAxis.titleStyle?.color || chart.themeStyle.axisTitleFont.color}
                fontFamily={currentAxis.titleStyle?.fontFamily || chart.themeStyle.axisTitleFont.fontFamily}
                fontSize={currentAxis.titleStyle?.fontSize || chart.themeStyle.axisTitleFont.fontSize}
                fontStyle={currentAxis.titleStyle?.fontStyle || chart.themeStyle.axisTitleFont.fontStyle}
                fontWeight={currentAxis.titleStyle?.fontWeight || chart.themeStyle.axisTitleFont.fontWeight}
                opacity={currentAxis.titleStyle?.opacity}
                dominantBaseline={title.baseLine}
                transform={title.transform}
            >
                {axis.titleCollection.length > 1
                    ? (title.text as string[]).map((line: string, index: number) => (
                        <tspan key={index} x={title.x}
                            dy={index === 0 ? 0 : axis.titleSize.height}>
                            {line}
                        </tspan>
                    ))
                    : title.text[0]
                }
            </text>;
    });
    return (
        titleElement
    );
}

/**
 * Renders the major tick lines for the X-axis of the chart.
 *
 * @param {AxisModel} axis - The axis model containing configuration for the X-axis.
 * @param {number} index - The index of the axis in the axis collection.
 * @param {Function} scale - A scaling function used to map axis values to pixel positions.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @param {AxisModel} currentAxis - The currently processed axis for which tick lines are being rendered.
 * @returns {JSX.Element} A JSX element representing the X-axis major tick lines.
 * @private
 */
export function drawYAxisTickLines(axis: AxisModel, index: number, scale: Function, chart: Chart, currentAxis: AxisModel): JSX.Element {
    const ticksbwtLabel: number = (axis.valueType === 'Category' && currentAxis.labelStyle.placement === 'BetweenTicks') ? 0.5 : 0;
    let length: number = axis.visibleLabels.length;
    if (axis.valueType === 'Category' && length > 0 && axis.labelStyle.placement === 'BetweenTicks') {
        length += 1;
    }
    const tickElements: JSX.Element[] = [];
    for (let i: number = 0; i < length; i++) {
        const tempInterval: number = !axis.visibleLabels[i as number] ?
            (axis.visibleLabels[i - 1].value + axis.visibleRange.interval) - ticksbwtLabel
            : axis.visibleLabels[i as number].value - ticksbwtLabel;
        const y: number = scale(tempInterval, axis.updatedRect, axis);
        const isTickInside: boolean = axis.tickPosition === 'Inside';
        const isOpposed: boolean = axis.isAxisOpposedPosition;
        const tickSize: number = isOpposed ? (currentAxis.majorTickLines.height as number) :
            -(currentAxis.majorTickLines.height as number);
        const axisLineSize: number = isOpposed ? (currentAxis.lineStyle?.width as number) * 0.5 :
            -(currentAxis.lineStyle?.width as number) * 0.5;
        const ticks: number = isTickInside
            ? axis.updatedRect.x - tickSize - axisLineSize
            : axis.updatedRect.x + tickSize + axisLineSize;
        const x1: number = axis.updatedRect.x + axisLineSize;
        const x2: number = ticks;
        if (y >= axis.updatedRect.y && axis.updatedRect.y + axis.updatedRect.height >= y) {
            const element: JSX.Element = <line
                key={`major-tick-${i}`}
                x1={x1}
                x2={x2}
                y1={y}
                y2={y}
                stroke={currentAxis.majorTickLines.color || chart.themeStyle.majorTickLine}
                strokeWidth={currentAxis.majorTickLines.width}
            />;
            tickElements.push(element);
        }
    }
    const tickLineElement: JSX.Element = <>
        <g clipPath={`url(#${chart.element.id}_Axis_${index}_Clip)`} id={chart.element.id + '_Axis_' + index + '_Major_Ticks'}>
            {tickElements}
        </g>
    </>;
    if (axis.tickPosition === 'Outside') {
        return tickLineElement;
    } else {
        axis.majorTickLineElement = tickLineElement;
        return <></>;
    }
}

/**
 * Renders the major tick lines for the X-axis of the chart.
 *
 * @param {AxisModel} axis - The axis model containing configuration for the X-axis.
 * @param {number} index - The index of the axis in the axis collection.
 * @param {Function} scale - A scaling function used to map axis values to pixel positions.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @param {AxisModel} currentAxis - The currently processed axis for which tick lines are being rendered.
 * @returns {JSX.Element} A JSX element representing the X-axis major tick lines.
 * @private
 */
export function drawXAxisTickLines(axis: AxisModel, index: number, scale: Function, chart: Chart, currentAxis: AxisModel): JSX.Element {
    const ticksbwtLabel: number = (axis.valueType === 'Category' && currentAxis.labelStyle.placement === 'BetweenTicks') ? 0.5 : 0;
    let length: number = axis.visibleLabels.length;
    if (axis.valueType === 'Category' && length > 0 && axis.labelStyle.placement === 'BetweenTicks') {
        length += 1;
    }
    const gridElements: JSX.Element[] = [];
    for (let i: number = 0; i < length; i++) {
        const tempInterval: number = axis.visibleLabels[i as number] ? axis.visibleLabels[i as number].value - ticksbwtLabel
            : (axis.visibleLabels[i - 1].value + axis.visibleRange.interval) - ticksbwtLabel;
        const x: number = scale(tempInterval, axis.updatedRect, axis);
        const isOpposed: boolean = axis.isAxisOpposedPosition;
        const tickSize: number = isOpposed ? -(currentAxis.majorTickLines.height as number) :
            (currentAxis.majorTickLines.height as number);
        const axisLineSize: number = isOpposed ? -(currentAxis.lineStyle?.width as number) * 0.5 :
            (currentAxis.lineStyle?.width as number) * 0.5;
        const isTickInside: boolean = axis.tickPosition === 'Inside';
        const ticks: number = isTickInside ? axis.updatedRect.y - tickSize - axisLineSize
            : axis.updatedRect.y + tickSize + axisLineSize;
        if (x >= axis.updatedRect.x && axis.updatedRect.x + axis.updatedRect.width >= x) {
            const element: JSX.Element = <line
                key={`x-major-tick-${i}`}
                x1={x}
                x2={x}
                y1={axis.updatedRect.y + axisLineSize}
                y2={ticks}
                stroke={currentAxis.majorTickLines.color || chart.themeStyle.majorTickLine}
                strokeWidth={currentAxis.majorTickLines.width}
            />;
            gridElements.push(element);
        }
    }

    const tickLineElement: JSX.Element = <>
        <g clipPath={`url(#${chart.element.id}_Axis_${index}_Clip)`} id={chart.element.id + '_Axis_' + index + '_Major_Ticks'}>
            {gridElements}
        </g>
    </>;
    if (axis.tickPosition === 'Outside') {
        return tickLineElement;
    } else {
        axis.majorTickLineElement = tickLineElement;
        return <></>;
    }
}

/**
 * Renders the minor tick marks for the X-axis of the chart.
 *
 * @param {AxisModel} axis - The axis model containing configuration for the X-axis.
 * @param {number} index - The index of the axis in the axis collection.
 * @param {Function} scale - A scaling function used to map axis values to pixel positions.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @param {AxisModel} currentAxis - The currently processed axis for which minor ticks are being rendered.
 * @returns {JSX.Element} A JSX element representing the X-axis minor tick marks.
 * @private
 */
export function drawXAxisMinorTicks(axis: AxisModel, index: number, scale: Function, chart: Chart, currentAxis: AxisModel): JSX.Element {
    const ticksbwtLabel: number = (axis.valueType === 'Category' && currentAxis.labelStyle.placement === 'BetweenTicks') ? 0.5 : 0;
    const tickLineElement: JSX.Element = <>
        <g clipPath={`url(#${chart.element.id}_Axis_${index}_Clip)`} id={chart.element.id + '_Axis_' + index + '_Minor_Ticks'}>
            {(currentAxis.minorTicksPerInterval as number) > 0 &&
                axis.visibleLabels.map((label: VisibleLabel, i: number, arr: VisibleLabel[]) => {
                    const current: number = label.value;
                    const next: number = arr[i + 1]?.value ?? current + axis.visibleRange.interval;
                    const interval: number = (next - current) / ((currentAxis.minorTicksPerInterval as number) + 1);
                    return Array.from({
                        length: currentAxis.minorTicksPerInterval as number
                    }, (_: unknown, j: number) => {
                        const val: number = current + interval * (j + 1);
                        if (!inside(val - ticksbwtLabel, axis.visibleRange)) { return null; }
                        const x: number = scale(val - ticksbwtLabel, axis.updatedRect, axis);
                        const isTickInside: boolean = axis.tickPosition === 'Inside';
                        const tickSize: number = axis.isAxisOpposedPosition ?
                            -(currentAxis.minorTickLines.height as number) :
                            (currentAxis.minorTickLines.height as number);
                        const ticksX: number = isTickInside ? (axis.updatedRect.y - tickSize) :
                            (axis.updatedRect.y + tickSize);
                        return (
                            x >= axis.updatedRect.x && axis.updatedRect.x + axis.updatedRect.width >= x && <line
                                key={`x-minor-tick-${i}-${j}`}
                                x1={x}
                                x2={x}
                                y1={axis.updatedRect.y}
                                y2={ticksX}
                                stroke={currentAxis.minorTickLines.color || chart.themeStyle.minorTickLine}
                                strokeWidth={currentAxis.minorTickLines.width}
                            />
                        );
                    });
                })
            }
        </g>
    </>;
    if (axis.tickPosition === 'Outside') {
        return tickLineElement;
    } else {
        axis.minorTickLineElement = tickLineElement;
        return <></>;
    }
}

/**
 * Renders the minor tick marks for the Y-axis of the chart.
 *
 * @param {AxisModel} axis - The axis model containing configuration for the Y-axis.
 * @param {number} index - The index of the axis in the axis collection.
 * @param {Function} scale - A scaling function used to map axis values to pixel positions.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @param {AxisModel} currentAxis - The currently processed axis for which minor ticks are being rendered.
 * @returns {JSX.Element} A JSX element representing the Y-axis minor tick marks.
 * @private
 */
export function drawYAxisMinorTicks(axis: AxisModel, index: number, scale: Function, chart: Chart, currentAxis: AxisModel): JSX.Element {
    const ticksbwtLabel: number = (axis.valueType === 'Category' && currentAxis.labelStyle.placement === 'BetweenTicks') ? 0.5 : 0;
    const tickLineElement: JSX.Element = <>
        <g clipPath={`url(#${chart.element.id}_Axis_${index}_Clip)`} id={chart.element.id + '_Axis_' + index + '_Minor_Ticks'}>
            {(currentAxis.minorTicksPerInterval as number) > 0 &&
                axis.visibleLabels.map((label: VisibleLabel, i: number, arr: VisibleLabel[]) => {
                    const current: number = label.value;
                    const next: number = arr[i + 1]?.value ?? current + axis.visibleRange.interval;
                    const interval: number = (next - current) / ((axis.minorTicksPerInterval as number) + 1);
                    const isTickInside: boolean = axis.tickPosition === 'Inside';
                    const tickSize: number = axis.isAxisOpposedPosition ?
                        -(currentAxis.minorTickLines.height as number) :
                        currentAxis.minorTickLines.height as number;
                    const ticksY: number = isTickInside ? (axis.updatedRect.x + tickSize) :
                        (axis.updatedRect.x - tickSize);
                    return Array.from({
                        length: currentAxis.minorTicksPerInterval as number
                    }, (_: unknown, j: number) => {
                        const val: number = current + interval * (j + 1);
                        if (!inside(val - ticksbwtLabel, axis.visibleRange)) {
                            return null;
                        }
                        const y: number = scale(val - ticksbwtLabel, axis.updatedRect, axis);
                        const x1: number = axis.rect.x + axis.rect.width;
                        return (
                            (<line
                                key={`minor-tick-${i}-${j}`}
                                x1={x1}
                                x2={ticksY}
                                y1={y}
                                y2={y}
                                stroke={currentAxis.minorTickLines.color || chart.themeStyle.minorTickLine}
                                strokeWidth={currentAxis.minorTickLines.width}
                            />)
                        );
                    });
                })
            }
        </g>
    </>;
    if (axis.tickPosition === 'Outside') {
        return tickLineElement;
    } else {
        axis.minorTickLineElement = tickLineElement;
        return <></>;
    }
}

/**
 * Renders the minor grid lines for the X-axis of the chart.
 *
 * @param {AxisModel} axis - The axis model containing configuration for the X-axis.
 * @param {number} index - The index of the axis in the axis collection.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @param {Function} scale - A scaling function used to map axis values to pixel positions.
 * @param {AxisModel} currentAxis - The currently processed axis for which minor grid lines are being rendered.
 * @returns {JSX.Element} A JSX element representing the X-axis minor grid lines.
 * @private
 */
export function drawXAxisMinorGridLines(
    axis: AxisModel, index: number, chart: Chart, scale: Function, currentAxis: AxisModel): JSX.Element {
    const ticksbwtLabel: number = (axis.valueType === 'Category' && currentAxis.labelStyle.placement === 'BetweenTicks') ? 0.5 : 0;
    return (
        <g clipPath={`url(#${chart.element.id}_Axis_${index}_Clip)`} id={chart.element.id + '_Axis_' + index + '_Minor_Grid_Lines'}>
            {(currentAxis.minorTicksPerInterval as number) > 0 &&
                axis.visibleLabels.map((label: VisibleLabel, i: number, arr: VisibleLabel[]) => {
                    const current: number = label.value;
                    const next: number = arr[i + 1]?.value ?? current + axis.visibleRange.interval;
                    const interval: number = (next - current) / ((currentAxis.minorTicksPerInterval as number) + 1);

                    return Array.from({
                        length: currentAxis.minorTicksPerInterval as number
                    }, (_: unknown, j: number) => {
                        const val: number = current + interval * (j + 1);
                        if (!inside(val - ticksbwtLabel, axis.visibleRange)) { return null; }
                        const x: number = scale(val - ticksbwtLabel, axis.updatedRect, axis);
                        const seriesClipRect: Rect = chart.chartAxislayout.seriesClipRect;
                        return (
                            x >= axis.updatedRect.x && axis.updatedRect.x + axis.updatedRect.width >= x && <line
                                key={`x-minor-grid-${i}-${j}`}
                                x1={x}
                                x2={x}
                                y1={seriesClipRect.y}
                                y2={seriesClipRect.y + seriesClipRect.height}
                                stroke={currentAxis.minorGridLines.color || chart.themeStyle.minorGridLine}
                                strokeWidth={currentAxis.minorGridLines.width}
                                strokeDasharray={currentAxis.minorGridLines.dashArray}
                            />
                        );
                    });
                })
            }

        </g>
    );
}

/**
 * Renders the minor grid lines for the Y-axis of the chart.
 *
 * @param {AxisModel} axis - The axis model containing configuration for the Y-axis.
 * @param {number} index - The index of the axis in the axis collection.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @param {Function} scale - A scaling function used to map axis values to pixel positions.
 * @param {AxisModel} currentAxis - The currently processed axis for which minor grid lines are being rendered.
 * @returns {JSX.Element} A JSX element representing the Y-axis minor grid lines.
 * @private
 */
export function drawYAxisMinorGridLines(axis: AxisModel, index: number, chart: Chart,
                                        scale: Function, currentAxis: AxisModel): JSX.Element {
    const ticksbwtLabel: number = (axis.valueType === 'Category' && currentAxis.labelStyle.placement === 'BetweenTicks') ? 0.5 : 0;
    return (
        <g clipPath={`url(#${chart.element.id}_Axis_${index}_Clip)`} id={chart.element.id + '_Axis_' + index + '_Minor_Grid_Lines'}>
            {(axis.minorTicksPerInterval as number) > 0 &&
                axis.visibleLabels.map((label: VisibleLabel, i: number, arr: VisibleLabel[]) => {
                    const current: number = label.value;
                    const next: number = arr[i + 1]?.value ?? current + axis.visibleRange.interval;
                    const interval: number = (next - current) / ((currentAxis.minorTicksPerInterval as number) + 1);
                    return Array.from({
                        length: (currentAxis.minorTicksPerInterval as number)
                    }, (_: unknown, j: number) => {
                        const val: number = current + interval * (j + 1);
                        if (!inside(val - ticksbwtLabel, axis.visibleRange)) {
                            return null;
                        }
                        const y: number = scale(val - ticksbwtLabel, axis.updatedRect, axis);
                        const seriesClipRect: Rect = chart.chartAxislayout.seriesClipRect;
                        return (
                            y >= axis.updatedRect.y && axis.updatedRect.y +
                            axis.updatedRect.height >= y && (<line
                                key={`minor-grid-${i}-${j}`}
                                x1={seriesClipRect.x + ((currentAxis.lineStyle?.width as number) / 2)}
                                x2={seriesClipRect.x + seriesClipRect.width -
                                    ((currentAxis.lineStyle?.width as number) / 2)}
                                y1={y}
                                y2={y}
                                stroke={currentAxis.minorGridLines.color ||
                                    chart.themeStyle.minorGridLine}
                                strokeWidth={currentAxis.minorGridLines.width}
                                strokeDasharray={currentAxis.minorGridLines.dashArray}
                            />
                            )
                        );
                    });
                })
            }
        </g>
    );
}
