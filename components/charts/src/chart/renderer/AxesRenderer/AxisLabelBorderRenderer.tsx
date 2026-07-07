import { ChartBorderProps, ChartMultiLevelLabelProps } from '../../base/interfaces';
import { valueToCoefficient } from '../../utils/helper';
import { AxisModel, Chart, PathOptions, Rect } from '../../chart-area/chart-interfaces';
import { shouldAllocateScrollbarSpace } from '../Zooming/scrollbarUtils';
import { hasValidMultiLevelLabels } from './ChartMultiLevelLabelRender';

/**
 * Get the Y position of the axis line from the path data.
 *
 * @param {AxisModel} axis - The axis model containing the rendered axis line path information.
 * @param {number} fallbackY - The default Y value to return if the axis line path is not available or parsing fails.
 * @param {'X' | 'Y'} coordinate - Specifies whether to extract the X or Y coordinate from the axis line path.
 * @returns {number} Returns the extracted Y coordinate of the axis line or the fallback value.
 * @private
 */
export function getAxisLineCoordinate(axis: AxisModel, fallbackY: number, coordinate: 'X' | 'Y'): number {
    const axisLinePathData: string = (axis.axisLineOptions as PathOptions)?.d as string;
    if (!axisLinePathData) { return fallbackY; }
    const pathSegments: string[] = axisLinePathData.trim().split(/\s+/);
    const coordinateIndex: number = coordinate === 'X' ? 1 : 2;
    if (pathSegments.length >= coordinateIndex + 1 && (pathSegments[0] === 'M' || pathSegments[0] === 'm')) {
        const axisLineCoordinate: number = parseFloat(pathSegments[coordinateIndex as number]);
        return isFinite(axisLineCoordinate) ? axisLineCoordinate : fallbackY;
    }
    return fallbackY;
}

/**
 * To render the xAxis label border based on label positions and axis layout.
 *
 * @param {AxisModel} axis - The axis model that contains label, tick, and style configurations.
 * @param {Rect} axisRect - The rectangle area allocated for the xAxis rendering.
 * @param {Chart} chart - The chart instance used to calculate boundary constraints and layout adjustments.
 * @returns {string} Returns the SVG path string used to draw the xAxis label border.
 * @private
 */
export function drawXAxisBorder(axis: AxisModel, axisRect: Rect, chart: Chart): string {
    let labelBorderPath: string = '';
    const labelBorderStyle: ChartBorderProps = axis.labelStyle?.border as ChartBorderProps;
    if (!labelBorderStyle || (labelBorderStyle.width as number) <= 0) {
        return labelBorderPath;
    }
    const isOpposed: boolean = axis.isAxisOpposedPosition;
    const reservedScrollThickness: number = (chart && shouldAllocateScrollbarSpace(chart, axis))
        ? ((axis.scrollbarThickness as number) || (axis.scrollbarSettings?.thickness as number)) : 0;
    const scrollBarHeight: number = (axis.labelStyle.position === 'Outside' &&
            axis.scrollbarSettings?.position !== 'Top' && axis.scrollbarSettings?.position !== 'Bottom') ? reservedScrollThickness : 0;
    const axisLineY: number = getAxisLineCoordinate(axis, axisRect.y, 'Y');
    const borderStartY: number = axisLineY + ((isOpposed ? -1 : 1) * scrollBarHeight);
    const padding: number = 10;
    const length: number = axis.maxLabelSize.height + ((axis.tickPosition === axis.labelStyle.position) ?
        (axis.majorTickLines?.height as number) : 0);
    let borderEndY: number = ((isOpposed && axis.labelStyle.position === 'Inside') || (!isOpposed && axis.labelStyle.position === 'Outside'))
        ? (axisLineY + length + padding + scrollBarHeight) : (axisLineY - length - padding - scrollBarHeight);
    const hasMultiLevel: boolean = axis.labelStyle.position === 'Outside' &&
        hasValidMultiLevelLabels(axis.multiLevelLabels as ChartMultiLevelLabelProps[]);
    if (hasMultiLevel) {
        const majorTickHeight: number = axis.majorTickLines?.height as number;
        const axisLabelHeight: number = axis.maxLabelSize.height + ((axis.labelStyle.padding as number));
        borderEndY = !isOpposed ? (axisLineY + majorTickHeight + axisLabelHeight + padding) :
            (axisLineY - majorTickHeight - axisLabelHeight - padding);
    }
    if (chart) {
        const chartBorderWidth: number = chart.border?.width as number;
        const minAllowedY: number = chartBorderWidth * 0.5;
        const maxAllowedY: number = chart.availableSize.height - chartBorderWidth * 0.5;
        const halfStroke: number = (labelBorderStyle.width as number) * 0.5;
        if (!isOpposed) {
            borderEndY = Math.min(borderEndY, maxAllowedY - halfStroke);
        } else {
            borderEndY = Math.max(borderEndY, minAllowedY + halfStroke);
        }
    }
    const betweenTicksLabelOffset: number = (axis.valueType === 'Category' && axis.labelStyle.placement === 'BetweenTicks') ? -0.5 : 0;
    const labelSlotWidth: number = (axisRect.width / axis.visibleRange.delta) * (axis.valueType === 'DateTime' ? axis.dateTimeInterval : axis.visibleRange.interval);
    let borderStartX: number;
    let borderEndX: number;
    let labelPixelX: number;
    for (let labelIndex: number = 0, labelIndexlength: number = axis.visibleLabels.length; labelIndex < labelIndexlength; labelIndex++) {
        labelPixelX = valueToCoefficient(axis.visibleLabels[labelIndex as number].value + betweenTicksLabelOffset, axis);
        labelPixelX = (axis.isAxisInverse ? (1 - labelPixelX) : labelPixelX) * axisRect.width;
        if (axis.valueType === 'Category' && axis.labelStyle.placement === 'BetweenTicks') {
            borderStartX = labelPixelX + axisRect.x;
            borderEndX = labelPixelX + labelSlotWidth + axisRect.x;
        } else {
            borderStartX = labelPixelX - labelSlotWidth * 0.5 + axisRect.x;
            borderEndX = labelPixelX + labelSlotWidth * 0.5 + axisRect.x;
        }
        if (borderStartX < axisRect.x && axis.labelStyle.placement !== 'OnTicks') {
            labelBorderPath += `M ${axisRect.x} ${borderEndY} L ${borderEndX} ${borderEndY} `;
        } else if (
            Math.floor(borderEndX) > axisRect.width + axisRect.x &&
            axis.visibleLabels.length !== 1 &&
            labelIndex !== axis.visibleLabels.length - 1
        ) {
            labelBorderPath += `M ${borderStartX} ${borderStartY} L ${borderStartX} ${borderEndY} L ${axisRect.width + axisRect.x} ${borderEndY} `;
        } else {
            borderStartX = (labelIndex === 0 && axis.labelStyle.placement === 'OnTicks') ? axisRect.x : borderStartX;
            borderEndX = (labelIndex === axis.visibleLabels.length - 1 && axis.labelStyle.placement === 'OnTicks') ? borderEndX - labelSlotWidth * 0.5 : borderEndX;
            labelBorderPath += `M ${borderStartX} ${borderStartY} L ${borderStartX} ${borderEndY} L ${borderEndX} ${borderEndY} `;
            if (labelIndex === 0) {
                labelBorderPath += `M ${borderStartX} ${borderStartY} L ${borderStartX} ${borderEndY} M ${borderStartX} ${borderEndY} L ${axisRect.x} ${borderEndY} `;
            }
            if (labelIndex === axis.visibleLabels.length - 1) {
                labelBorderPath += `M ${borderEndX} ${borderStartY} L ${borderEndX} ${borderEndY} M ${borderEndX} ${borderEndY} L ${axisRect.width + axisRect.x} ${borderEndY} `;
            }
        }
    }
    labelBorderPath += `M ${axisRect.x} ${borderStartY} L ${axisRect.x + axisRect.width} ${borderStartY} `;
    return labelBorderPath;
}

/**
 * To render the yAxis label border based on label positions and axis layout.
 *
 * @param {AxisModel} axis - The axis model that contains label, tick, and style configurations.
 * @param {Rect} rect - The rectangle area allocated for the yAxis rendering.
 * @param {Chart} chart - The chart instance used to calculate boundary constraints and layout adjustments.
 * @returns {string} Returns the SVG path string used to draw the yAxis label border.
 * @private
 */
export function drawYAxisBorder(axis: AxisModel, rect: Rect, chart: Chart): string {
    let labelBorderPath: string = '';
    const labelBorderStyle: ChartBorderProps = axis.labelStyle?.border as ChartBorderProps;
    if (!labelBorderStyle || (labelBorderStyle.width as number) <= 0) { return labelBorderPath; }
    const isOpposed: boolean = axis.isAxisOpposedPosition;
    const padding: number = 10;
    const reservedScrollThickness: number = (chart && shouldAllocateScrollbarSpace(chart, axis))
        ? ((axis.scrollbarThickness as number) || (axis.scrollbarSettings?.thickness as number)) : 0;
    let scrollBarHeight: number = (axis.labelStyle.position === 'Outside' && axis.scrollbarSettings?.position !== 'Right' &&
            axis.scrollbarSettings?.position !== 'Left') ? reservedScrollThickness : 0;
    scrollBarHeight = (isOpposed ? 1 : -1) * scrollBarHeight;
    const axisLineX: number = getAxisLineCoordinate(axis, rect.x, 'X');
    const axisStartX: number = axisLineX + scrollBarHeight;
    const tickSpace: number = (axis.tickPosition === axis.labelStyle.position) ? (axis.majorTickLines?.height as number) : 0;
    const length: number = (axis.maxLabelSize.width) + padding + tickSpace;
    let borderEndX: number = ((isOpposed && axis.labelStyle.position === 'Inside') || (!isOpposed && axis.labelStyle.position === 'Outside'))
        ? (axisLineX - length + scrollBarHeight) : (axisLineX + length + scrollBarHeight);
    const hasMultiLevel: boolean = axis.labelStyle.position === 'Outside' &&
        hasValidMultiLevelLabels(axis.multiLevelLabels as ChartMultiLevelLabelProps[]);
    if (hasMultiLevel) {
        const axisLabelWidth: number = (axis.maxLabelSize.width) + (axis.labelStyle.padding as number);
        const boundary: number = isOpposed ? (axisLineX + axisLabelWidth + tickSpace + padding + scrollBarHeight)
            : (axisLineX - axisLabelWidth - tickSpace - padding + scrollBarHeight);
        borderEndX = boundary;
    }
    if (chart) {
        const chartBorderWidth: number = chart.border?.width as number;
        const minAllowedX: number = chartBorderWidth * 0.5;
        const maxAllowedX: number = chart.availableSize.width - chartBorderWidth * 0.5;
        const halfStroke: number = ((labelBorderStyle.width as number)) * 0.5;
        if (!isOpposed) {
            borderEndX = Math.max(borderEndX, minAllowedX + halfStroke);
        } else {
            borderEndX = Math.min(borderEndX, maxAllowedX - halfStroke);
        }
    }
    let borderStartY: number;
    let labelPixelY: number;
    let borderEndY: number;
    const betweenTicksLabelOffset: number = (axis.valueType === 'Category' && axis.labelStyle.placement === 'BetweenTicks') ? -0.5 : 0;
    const labelSlotWidth: number = (rect.height / axis.visibleRange.delta) *
        (axis.valueType === 'DateTime' ? axis.dateTimeInterval : axis.visibleRange.interval);
    for (let labelIndex: number = 0, labelIndexlength: number = axis.visibleLabels.length; labelIndex < labelIndexlength; labelIndex++) {
        labelPixelY = valueToCoefficient(axis.visibleLabels[labelIndex as number].value + betweenTicksLabelOffset, axis);
        labelPixelY = (axis.isAxisInverse ? (1 - labelPixelY) : labelPixelY) * rect.height;
        if (axis.valueType === 'Category' && axis.labelStyle.placement === 'BetweenTicks') {
            borderStartY = (labelPixelY * -1) + (rect.y + rect.height);
            borderEndY = (labelPixelY * -1) - labelSlotWidth + (rect.y + rect.height);
        } else {
            borderStartY = (labelPixelY * -1) + labelSlotWidth / 2 + (rect.y + rect.height);
            borderEndY = (labelPixelY * -1) - labelSlotWidth / 2 + (rect.y + rect.height);
        }
        if (borderStartY > (rect.y + rect.height)) {
            labelBorderPath += `M ${borderEndX} ${rect.y + rect.height} L ${borderEndX} ${borderEndY} `;
        } else if (Math.floor(rect.y) > borderEndY) {
            labelBorderPath += `M ${axisStartX} ${borderStartY} L ${borderEndX} ${borderStartY} L ${borderEndX} ${rect.y} `;
        } else {
            labelBorderPath += `M ${axisStartX} ${borderStartY} L ${borderEndX} ${borderStartY} L ${borderEndX} ${borderEndY} `;
            if (labelIndex === axis.visibleLabels.length - 1) {
                labelBorderPath += `M ${axisStartX} ${borderEndY} L ${borderEndX} ${borderEndY} `;
            }
        }
    }
    labelBorderPath += `M ${axisStartX} ${rect.y} L ${axisStartX} ${rect.y + rect.height} `;
    return labelBorderPath;
}
