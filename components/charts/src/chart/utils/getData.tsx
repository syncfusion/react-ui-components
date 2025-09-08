import { Chart, Points, Rect, SeriesProperties } from '../chart-area/chart-interfaces';
import { withInBounds } from './helper';

/**
 * Interface for point data result
 * @private
 */
export interface PointData {
    point: Points | null;
    series: SeriesProperties | null;
}

/**
 * Gets the data point at the current mouse position.
 *
 * @param {Chart} chart - The chart instance
 * @returns {PointData} Object containing point and series data
 * @private
 */
export function getData(chart: Chart): PointData {
    let point: Points | null = null;
    let series: SeriesProperties | null = null;
    let width: number;
    let height: number;
    let mouseX: number;
    let mouseY: number;
    const insideRegion: boolean = false;

    // Search through all visible series for point at current mouse position
    for (let i: number = chart.visibleSeries.length - 1; i >= 0; i--) {
        series = chart.visibleSeries[i as number];
        width = (series.type === 'Scatter' || (series.marker?.visible))
            ? (series.marker?.height ?? 0 + 5) / 2 : 0;
        height = (series.type === 'Scatter' || (series.marker?.visible))
            ? (series.marker?.width ?? 0 + 5) / 2 : 0;
        mouseX = chart.mouseX;
        mouseY = chart.mouseY;


        // Check if point is within bounds
        if (series.visible && series.clipRect && withInBounds(mouseX, mouseY, series.clipRect, width, height)) {
            point = getRectPoint(series, series.clipRect, mouseX, mouseY, insideRegion);
            if (point) {
                break;
            }
        }
    }

    return { point, series };
}

/**
 * Finds a point in the given rectangle
 *
 * @param {Series} series - The current series
 * @param {Rect} rect - The rectangle to search in
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {boolean} insideRegion - Flag to track if inside a region
 * @returns {Points | null} Point if found, null otherwise
 *@private
 */
function getRectPoint(
    series: SeriesProperties,
    rect: Rect,
    x: number,
    y: number,
    insideRegion: boolean
): Points | null {


    for (const point of series.points) {
        if (!point.regionData) {
            if (!point.regions || !point.regions.length) {
                continue;
            }
        }

        if ((series.isRectSeries && series.marker?.visible )) {
            if (isPointInThresholdRegion(x, y, point, rect, series)) {
                return point;
            }
        }

        if (!insideRegion && checkRegionContainsPoint(point?.regions, rect, x, y)) {
            return point;
        } else if (insideRegion && checkRegionContainsPoint(point?.regions, rect, x, y)) {
            return point;
        }
    }

    return null;
}

/**
 * Check if a point exists within the specified regions
 *
 * @param {Rect[]} regionRect - Array of rectangles defining regions
 * @param {Rect} rect - The chart rectangle
 * @param {number} x - X coordinate to check
 * @param {number} y - Y coordinate to check
 * @param {Chart} chart - The chart instance
 * @returns {boolean} True if point is in region
 * @private
 */
function checkRegionContainsPoint(
    regionRect: Rect[] | null,
    rect: Rect,
    x: number,
    y: number
): boolean | undefined {
    return regionRect?.some((region: Rect) => {
        return withInBounds(
            x, y,
            {
                x: (rect.x) + region.x,
                y: ( rect.y) + region.y,
                width: region.width,
                height: region.height
            }
        );
    });
}

/**
 * Checks if the given point is within the threshold region of a data point
 *
 * @param {number} x - The x-coordinate of the point to check
 * @param {number} y - The y-coordinate of the point to check
 * @param {Points} point - The data point
 * @param {Rect} rect - The rectangle representing the threshold region
 * @param {Series} series - The series to which the data point belongs
 * @param {Chart} chart - The chart instance
 * @returns {boolean} True if the point is within the threshold region
 * @private
 */
function isPointInThresholdRegion(
    x: number,
    y: number,
    point: Points,
    rect: Rect,
    series: SeriesProperties
): boolean {
    if (!point.regions || point.regions.length === 0) {
        return false;
    }
    const isBar: boolean = series.type === 'Bar';
    const isInversed: boolean = series.yAxis.isAxisInverse;
    const isTransposed: boolean = series.chart.iSTransPosed;
    const heightValue: number = 10;
    let yValue: number = 0;
    let xValue: number = 0;
    let width: number;
    let height: number = width = 2 * heightValue;

    if (isInversed && isTransposed) {
        if (isBar) {
            yValue = point.regions[0].height - heightValue;
            width = point.regions[0].width;
        } else {
            xValue = -heightValue;
            height = point.regions[0].height;
        }
    } else if (isInversed || point.yValue! < 0) {
        if (isBar) {
            xValue = -heightValue;
            height = point.regions[0].height;
        } else {
            yValue = point.regions[0].height - heightValue;
            width = point.regions[0].width;
        }
    } else if (isTransposed) {
        if (isBar) {
            yValue = -heightValue;
            width = point.regions[0].width;
        } else {
            xValue = point.regions[0].width - heightValue;
            height = point.regions[0].height;
        }
    } else {
        if (isBar) {
            xValue = point.regions[0].width - heightValue;
            height = point.regions[0].height;
        } else {
            yValue = -heightValue;
            width = point.regions[0].width;
        }
    }

    return point?.regions?.some((region: Rect) => {
        return withInBounds(
            x, y,
            {
                x: (rect.x ) + region.x + xValue,
                y: ( rect.y ) + region.y + yValue,
                width,
                height
            }
        );
    });
}
