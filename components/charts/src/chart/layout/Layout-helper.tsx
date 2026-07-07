import { getValueXByPoint, getValueYByPoint, withInBounds } from '../utils/helper';
import { AxisModel, Chart, Rect, SeriesProperties } from '../chart-area/chart-interfaces';

/**
 * Calculates axis values based on the mouse position within the chart area.
 * Determines the corresponding X and Y axis values by evaluating the mouse
 * coordinates against the visible axes and the series plotting region.
 *
 * @param {number} mouseX - X coordinate of the mouse relative to the chart container.
 * @param {number} mouseY - Y coordinate of the mouse relative to the chart container.
 * @param {Chart} chart - The chart instance used to access axis and layout information.
 * @returns {Object<string, number>} An object mapping axis names to their calculated values.
 *
 * @private
 */
export const findAxisValuesFromPoint: (
    mouseX: number,
    mouseY: number,
    chart: Chart
) => { [key: string]: number } = (
    mouseX: number,
    mouseY: number,
    chart: Chart
): { [key: string]: number } => {

    const axisData: { [key: string]: number } = {};
    if (!chart || !chart.chartAxislayout || !chart.axisCollection) {
        return axisData;
    }
    const clipRect: Rect = chart.chartAxislayout.seriesClipRect;

    if (!withInBounds(mouseX, mouseY, clipRect) || !chart.visibleSeries?.some((series: SeriesProperties) => series.visible)) {
        return axisData;
    }

    for (let i: number = 0; i < chart.axisCollection.length; i++) {
        const axis: AxisModel = chart.axisCollection[i as number];
        if (!axis.visible || !axis.rect) {
            continue;
        }
        if (axis.orientation === 'Horizontal') {
            const xValue: number = getValueXByPoint(Math.abs(mouseX - axis.rect.x), axis.rect.width, axis);
            axisData[axis.name as string] = xValue;
        } else {
            const yValue: number = getValueYByPoint(Math.abs(mouseY - axis.rect.y), axis.rect.height, axis);
            axisData[axis.name as string] = yValue;
        }
    }
    return axisData;
};
