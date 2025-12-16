import { isNullOrUndefined } from '@syncfusion/react-base';
import { adjustCornerRadius, degreeToLocation, indexFinder, measureText, stringToNumber } from '../../utils/helper';
import { PieChartFontProps, PieChartLocationProps, PieChartPointRenderProps } from '../../base/interfaces';
import { Chart, PieBase, Points, Rect, SeriesProperties } from '../../base/internal-interfaces';

/**
 * Represents the index of a specific point within a series in the chart.
 *
 * @private
 */
export type Index = {
    series: number;
    point: number | null;
};

/**
 * Provides detailed information about an accumulated point in the chart.
 *
 * @private
 */
export interface AccPointData {
    point: Points | null;
    series: SeriesProperties | null;
    index: number;
}

/**
 * Checks the number of visible slices in the given series points.
 *
 * @param {Points[]} seriesPoints - Array of point objects representing slices in the chart.
 * @returns {number} Returns the count of slices that are marked as visible.
 */
function sliceCheck(seriesPoints: Points[]): number {
    let isOneSlice: number = 0;
    for (let index: number = 0; index < seriesPoints.length; index++) {
        const point: Points = seriesPoints[index as number];
        if (point.visible) { isOneSlice++; }
    }
    return isOneSlice;
}

/**
 * Generates the SVG path string for a pie slice based on geometric parameters.
 *
 * @param {PieChartLocationProps} center - The center coordinates of the pie chart.
 * @param {PieChartLocationProps} start - The starting point on the circumference of the slice.
 * @param {PieChartLocationProps} end - The ending point on the circumference of the slice.
 * @param {number} radius - The radius of the pie slice.
 * @param {number} clockWise - Direction of the arc (1 for clockwise, 0 for counter-clockwise).
 * @param {number} cornerRadius - The radius to apply to the slice corners for rounded edges.
 * @param {Points[]} seriesPoints - Array of point objects representing all slices in the series.
 * @returns {string} Returns the SVG path string representing the pie slice.
 * @private
 */
export function getPiePath(
    center: PieChartLocationProps, start: PieChartLocationProps,
    end: PieChartLocationProps, radius: number, clockWise: number,
    cornerRadius: number, seriesPoints: Points[]): string {
    const sliceCount: number = sliceCheck(seriesPoints);
    cornerRadius = sliceCount === 1 ? 0 : cornerRadius;
    const startAngle: number = Math.atan2(start.y - center.y, start.x - center.x);
    const endAngle: number = Math.atan2(end.y - center.y, end.x - center.x);
    cornerRadius = adjustCornerRadius(startAngle, endAngle, radius, cornerRadius);
    const x1: number = start.x - cornerRadius * Math.cos(startAngle);
    const y1: number = start.y - cornerRadius * Math.sin(startAngle);
    const x2: number = end.x - cornerRadius * Math.cos(Math.PI / 2 + endAngle);
    const y2: number = end.y - cornerRadius * Math.sin(Math.PI / 2 + endAngle);
    const cx2: number = end.x - cornerRadius * Math.cos(endAngle);
    const cy2: number = end.y - cornerRadius * Math.sin(endAngle);
    const cx1: number = start.x + cornerRadius * Math.cos(Math.PI / 2 + startAngle);
    const cy1: number = start.y + cornerRadius * Math.sin(Math.PI / 2 + startAngle);
    const fillPath: string = `M ${center.x} ${center.y} L ${x1} ${y1} A ${cornerRadius} ${cornerRadius} 0 0 1 ${cx1} ${cy1} A ${radius} ${radius} 0 ${clockWise} 1 ${x2} ${y2} A ${cornerRadius} ${cornerRadius} 0 0 1 ${cx2} ${cy2} Z`;
    return fillPath;
}

/**
 * Generates the SVG path string for a doughnut slice based on geometric parameters.
 *
 * @param {PieBase} pieSeries - The pie series configuration object.
 * @param {PieChartLocationProps} start - The starting point on the outer arc of the slice.
 * @param {PieChartLocationProps} end - The ending point on the outer arc of the slice.
 * @param {number} radius - The outer radius of the doughnut slice.
 * @param {PieChartLocationProps} innerStart - The starting point on the inner arc of the slice.
 * @param {PieChartLocationProps} innerEnd - The ending point on the inner arc of the slice.
 * @param {number} innerRadius - The inner radius of the doughnut slice.
 * @param {number} clockWise - Direction of the arc (1 for clockwise, 0 for counter-clockwise).
 * @param {number} cornerRadius - The radius to apply to the slice corners for rounded edges.
 * @param {boolean} isBorder - Indicates whether the path is for a border or a filled slice.
 * @param {Points[]} seriesPoints - Array of point objects representing all slices in the series.
 * @returns {string} Returns the SVG path string representing the doughnut slice.
 * @private
 */
export function getDoughnutPath(
    pieSeries: PieBase, start: PieChartLocationProps, end: PieChartLocationProps, radius: number,
    innerStart: PieChartLocationProps, innerEnd: PieChartLocationProps, innerRadius: number, clockWise: number,
    cornerRadius: number, isBorder: boolean, seriesPoints: Points[]): string {
    const sliceCount: number = sliceCheck(seriesPoints);
    cornerRadius = sliceCount === 1 ? 0 : cornerRadius;
    const startAngle: number = Math.atan2(start.y - innerStart.y, start.x - innerStart.x);
    const endAngle: number = Math.atan2(end.y - innerEnd.y, end.x - innerEnd.x);
    cornerRadius = adjustCornerRadius(startAngle, endAngle, innerRadius, cornerRadius);
    cornerRadius = (isBorder && (pieSeries.innerRadius === 0)) ? cornerRadius * -1 : cornerRadius;
    const x1: number = start.x - cornerRadius * Math.cos(startAngle);
    const y1: number = start.y - cornerRadius * Math.sin(startAngle);
    const x2: number = end.x - cornerRadius * Math.cos(Math.PI / 2 + endAngle);
    const y2: number = end.y - cornerRadius * Math.sin(Math.PI / 2 + endAngle);
    const x3: number = innerEnd.x + cornerRadius * Math.cos(endAngle);
    const y3: number = innerEnd.y + cornerRadius * Math.sin(endAngle);
    const x4: number = innerStart.x + cornerRadius * Math.cos(Math.PI / 2 + startAngle);
    const y4: number = innerStart.y + cornerRadius * Math.sin(Math.PI / 2 + startAngle);
    const cx1: number = start.x + cornerRadius * Math.cos(Math.PI / 2 + startAngle);
    const cy1: number = start.y + cornerRadius * Math.sin(Math.PI / 2 + startAngle);
    const cx2: number = end.x - cornerRadius * Math.cos(endAngle);
    const cy2: number = end.y - cornerRadius * Math.sin(endAngle);
    const cx3: number = innerEnd.x - cornerRadius * Math.cos(Math.PI / 2 + endAngle);
    const cy3: number = innerEnd.y - cornerRadius * Math.sin(Math.PI / 2 + endAngle);
    const cx4: number = innerStart.x + cornerRadius * Math.cos(startAngle);
    const cy4: number = innerStart.y + cornerRadius * Math.sin(startAngle);
    return `M ${x1} ${y1} A ${cornerRadius} ${cornerRadius} 0 0 1 ${cx1} ${cy1} A ${radius} ${radius} 0 ${clockWise} 1 ${x2} ${y2} A ${cornerRadius} ${cornerRadius} 0 0 1 ${cx2} ${cy2} L ${x3} ${y3} A ${cornerRadius} ${cornerRadius} 0 0 1 ${cx3} ${cy3} A ${innerRadius} ${innerRadius} 0 ${clockWise} 0 ${x4} ${y4} A ${cornerRadius} ${cornerRadius} 0 0 1 ${cx4} ${cy4} Z`;
}


/**
 * Determines whether a chart point is considered empty based on its color.
 *
 * @param {Points} point - The data point to evaluate.
 * @param {SeriesProperties} series - The series configuration containing empty point settings.
 * @returns {boolean} Returns true if the point's color matches the empty point fill color; otherwise, false.
 * @private
 */
export function isEmpty(point: Points, series: SeriesProperties): boolean {
    return point.color === series.emptyPointSettings?.fill;
}

/**
 * Linearly interpolates between two angles in degrees, taking the shortest path around the circle.
 * Ensures the result is always within the range [0, 360).
 *
 * @param {number} a - The starting angle in degrees.
 * @param {number} b - The target angle in degrees.
 * @param {number} t - The interpolation factor (typically between 0 and 1).
 * @returns {number} The interpolated angle in degrees, normalized to [0, 360).
 * @private
 */
export function lerpAngleShortest(a: number, b: number, t: number): number {
    const aN: number = ((a % 360) + 360) % 360;
    const bN: number = ((b % 360) + 360) % 360;
    let d: number = bN - aN;
    if (d > 180) { d -= 360; }
    if (d < -180) { d += 360; }
    return ((aN + d * t) + 360) % 360;
}

/**
 * Calculates the positive angular difference from the start angle to the end angle in degrees.
 * The result is always in the range [0, 360).
 *
 * @param {number} start - The starting angle in degrees.
 * @param {number} end - The ending angle in degrees.
 * @returns {number} The smallest positive difference between the two angles in degrees.
 * @private
 */
export function angleDelta(start: number, end: number): number {
    let d: number = end - start; d = d < 0 ? (d + 360) : d;
    return d;
}

/**
 * Computes the start and end angles for each data point in a circular chart (e.g., pie or doughnut),
 * based on the total value and angular span of the chart.
 *
 * @param {SeriesProperties} series - The chart series configuration containing start/end angles and point data.
 * @param {Points[]} points - Optional array of data points to use instead of the series' default points.
 * @param {number} sumOverride - Optional override for the total sum of point values, used for angle calculation.
 * @returns {number} An array of angle ranges, each with a `start` and `end` value in degrees.
 * @private
 *
 */
export function computeAngles(
    series: SeriesProperties,
    points?: Points[], sumOverride?: number): { start: number; end: number }[] {
    const pts: Points[] = points || series.points;
    const endAngle: number = isNullOrUndefined(series.endAngle) ? series.startAngle as number : series.endAngle as number;
    const totalAngleRaw: number = (endAngle - (series.startAngle as number)) % 360;
    const totalAngle: number = totalAngleRaw <= 0 ? (360 + totalAngleRaw) : totalAngleRaw;
    let cur: number = (series.startAngle as number) - 90;
    const sum: number = !isNaN(sumOverride as number) ? (sumOverride as number) : series.sumOfPoints;
    const arr: { start: number; end: number }[] = [];
    for (const p of pts) {
        const y: number = p.visible ? Math.abs(p.y) : 0;
        const span: number = sum ? (y / sum) * totalAngle : 0;
        const s: number = ((cur % 360) + 360) % 360;
        const e: number = (((cur + span) % 360) + 360) % 360;
        arr.push({ start: s, end: e });
        cur += span;
    }
    return arr;
}

/**
 * Calculates a rectangle positioned at a specific angle on the circumference of a pie chart.
 *
 * @param {number} angle - The angle in degrees where the rectangle should be placed.
 * @param {PieBase} pieSeries - The pie series configuration containing center and radius information.
 * @returns {Rect} Returns a rectangle with x and y coordinates at the specified angle, and zero width and height.
 */
function getRectFromAngle(angle: number, pieSeries: PieBase): Rect {
    const location: PieChartLocationProps = degreeToLocation(angle, pieSeries.pieBaseRadius, pieSeries.pieBaseCenter);
    return { x: location.x, y: location.y, width: 0, height: 0 };
}

/**
 * Updates the total bounding rectangle to include the bounds of a given rectangle.
 *
 * @param {Rect} totalbound - The current total bounding rectangle to be updated.
 * @param {Rect} bound - The new rectangle whose bounds should be merged into the total.
 * @returns {void} This function does not return any value.
 * @private
 */
export function findMaxBounds(totalbound: Rect, bound: Rect): void {
    totalbound.x = bound.x < totalbound.x ? bound.x : totalbound.x;
    totalbound.y = bound.y < totalbound.y ? bound.y : totalbound.y;
    totalbound.height = (bound.y + bound.height) > totalbound.height ? (bound.y + bound.height) : totalbound.height;
    totalbound.width = (bound.x + bound.width) > totalbound.width ? (bound.x + bound.width) : totalbound.width;
}

/**
 * Calculates and sets the center coordinates for the pie or doughnut chart.
 *
 * @param {Chart} accumulation - The chart instance containing layout and configuration details.
 * @param {SeriesProperties} series - The series configuration (not used directly here but may be relevant for extended logic).
 * @param {PieBase} pieSeries - The pie series object where the calculated center will be stored.
 * @returns {void} This function does not return any value.
 * @private
 */
export function findCenter(accumulation: Chart, series: SeriesProperties, pieSeries: PieBase): void {
    pieSeries.pieBaseCenter = {
        x: stringToNumber(accumulation.center?.x, accumulation.clipRect.width) + (accumulation.clipRect.x),
        y: stringToNumber(accumulation.center?.y, accumulation.clipRect.height) + (accumulation.clipRect.y)
    };
    const accumulationRect: Rect = getSeriesBound(series, pieSeries);
    const accumulationRectCenter: PieChartLocationProps = {
        x: accumulationRect.x + accumulationRect.width / 2,
        y: accumulationRect.y + accumulationRect.height / 2
    };
    pieSeries.pieBaseCenter.x += (pieSeries.pieBaseCenter.x - accumulationRectCenter.x);
    pieSeries.pieBaseCenter.y += (pieSeries.pieBaseCenter.y - accumulationRectCenter.y);
    accumulation.origin = pieSeries.pieBaseCenter;
}

/**
 * Calculates the bounding rectangle that encompasses all points in a pie or doughnut series.
 *
 * @param {SeriesProperties} series - The series containing chart points and configuration.
 * @param {PieBase} pieSeries - The pie series configuration including center and radius.
 * @returns {Rect} Returns the bounding rectangle that encloses all rendered points.
 * @private
 */
export function getSeriesBound(series: SeriesProperties, pieSeries: PieBase): Rect {
    const rect: Rect = { x: Infinity, y: Infinity, width: -Infinity, height: -Infinity };
    initAngles(series, pieSeries);
    const start: number = pieSeries.startAngle;
    const total: number = pieSeries.totalAngle;
    let end: number = (pieSeries.startAngle + total) % 360;
    end = (end === 0) ? 360 : end;
    findMaxBounds(rect, getRectFromAngle(start, pieSeries));
    findMaxBounds(rect, getRectFromAngle(end, pieSeries));
    findMaxBounds(rect, { x: pieSeries.pieBaseCenter.x, y: pieSeries.pieBaseCenter.y, width: 0, height: 0 });
    let nextQuandrant: number = (Math.floor(start / 90) * 90 + 90) % 360;
    let lastQuadrant: number = (Math.floor(end / 90) * 90) % 360;
    lastQuadrant = (lastQuadrant === 0) ? 360 : lastQuadrant;
    if (total >= 90 || lastQuadrant === nextQuandrant) {
        findMaxBounds(rect, getRectFromAngle(nextQuandrant, pieSeries));
        findMaxBounds(rect, getRectFromAngle(lastQuadrant, pieSeries));
    }
    if (start === 0 || (start + total >= 360)) {
        findMaxBounds(rect, getRectFromAngle(0, pieSeries));
    }
    const length: number = nextQuandrant === lastQuadrant ? 0 : Math.floor(total / 90);
    for (let i: number = 1; i < length; i++) {
        nextQuandrant = nextQuandrant + 90;
        if ((nextQuandrant < lastQuadrant || end < start) || total === 360) {
            findMaxBounds(rect, getRectFromAngle(nextQuandrant, pieSeries));
        }
    }
    rect.width -= rect.x;
    rect.height -= rect.y;
    return rect;
}

/**
 * Initializes the total angle for the pie or doughnut chart series based on start and end angles.
 *
 * @param {SeriesProperties} series - The series configuration containing start and end angles.
 * @param {PieBase} pieSeries - The pie series object where the total angle will be stored.
 * @returns {void} This function does not return any value.
 * @private
 */
export function initAngles(series: SeriesProperties, pieSeries: PieBase): void {
    const endAngle: number = isNullOrUndefined(series.endAngle) ? series.startAngle as number : series.endAngle as number;
    pieSeries.totalAngle = ((endAngle - (series.startAngle as number)) % 360);
    pieSeries.startAngle = (series.startAngle as number) - 90;
    pieSeries.totalAngle = pieSeries.totalAngle <= 0 ? (360 + pieSeries.totalAngle) : pieSeries.totalAngle;
    pieSeries.startAngle = (pieSeries.startAngle < 0 ? (pieSeries.startAngle + 360) : pieSeries.startAngle) % 360;
    pieSeries.originalStartAngle = pieSeries.startAngle;
}


/**
 * Generates the SVG path string for a pie or doughnut arc segment.
 *
 * @param {PieBase} pieSeries - The pie series configuration object.
 * @param {number} start - The starting angle of the arc in radians.
 * @param {number} end - The ending angle of the arc in radians.
 * @param {number} radius - The outer radius of the arc.
 * @param {number} innerRadius - The inner radius for doughnut charts.
 * @param {number} borderRadius - The radius to apply to the arc corners for rounded edges.
 * @param {boolean} isBorder - Indicates whether the path is for a border or a filled arc.
 * @param {Points[]} seriesPoints - Array of point objects representing all slices in the series.
 * @returns {string} Returns the SVG path string representing the arc segment.
 * @private
 */
export function getPathArc(
    pieSeries: PieBase, start: number, end: number, radius: number, innerRadius: number,
    borderRadius: number, isBorder: boolean, seriesPoints: Points[]): string {
    let degree: number = end - start; degree = degree < 0 ? (degree + 360) : degree;
    const flag: number = (degree < 180) ? 0 : 1;
    const center: PieChartLocationProps = pieSeries.center;
    if (!innerRadius && innerRadius === 0) {
        return getPiePath(
            center, degreeToLocation(start, radius, center), degreeToLocation(end, radius, center), radius,
            flag, borderRadius as number, seriesPoints);
    } else {
        return getDoughnutPath(
            pieSeries, degreeToLocation(start, radius, center), degreeToLocation(end, radius, center), radius,
            degreeToLocation(start, innerRadius, center), degreeToLocation(end, innerRadius, center), innerRadius, flag,
            borderRadius, isBorder, seriesPoints);
    }
}

/**
 * Applies a custom tooltip content callback to modify the tooltip's appearance or content.
 *
 * @param {PieChartPointRenderProps} pointsProps point arguments.
 * @param {Chart} chart - The tooltip configuration object that may contain a custom content callback.
 * @returns {string} The modified tooltip content as a string, array of strings, or boolean.
 *
 * @private
 */
export function applyPointRenderCallback(pointsProps: PieChartPointRenderProps, chart: Chart): string {
    const defaultProps: PieChartPointRenderProps = {
        xValue: pointsProps.xValue, yValue: pointsProps.yValue,
        color: pointsProps.color, pointIndex: pointsProps.pointIndex
    };
    const callback: ((args: PieChartPointRenderProps) => string) =
        chart.pointRender as ((args: PieChartPointRenderProps) => string);

    if (callback && typeof callback === 'function') {
        try {
            return callback(defaultProps) as string;
        } catch (error) {
            return defaultProps.color;
        }
    }
    return defaultProps.color;
}

/**
 * Creates a deep clone of the given plain object to prevent cross-instance reference leaks.
 *
 * @param {SeriesProperties} series - The source object of type `SeriesProperties` to clone.
 * @returns {SeriesProperties} - A new `SeriesProperties` object that is a deep copy of the input.
 * @private
 *
 */
export function clonePlain(series: SeriesProperties): SeriesProperties {
    try { return JSON.parse(JSON.stringify(series)); } catch (_e) { return { ...(series || {}) }; }
}

/**
 * Retrieves pie chart data (point and series) from a pointer or touch event by extracting target element indices.
 * Used for identifying the hovered slice in interactive scenarios like tooltips or explosions.
 *
 * @param {PointerEvent | TouchEvent} e - The event containing target information to determine the data point.
 * @param {Chart} chart - The chart instance.
 * @returns {AccPointData} An object containing the point, series, and index for the targeted pie data, or null values if not found.
 * @private
 */
export function getPieData(e: PointerEvent | TouchEvent, chart: Chart): AccPointData {
    const dataIndex: Index = indexFinder((e.target as Element).id, true) as Index;
    if (!isNaN(dataIndex.series)) {
        return {
            point: chart?.visibleSeries[0].points[dataIndex.point as number] as Points,
            series: chart?.visibleSeries[0],
            index: 0
        };

    }
    return { point: null, series: null, index: 0 };
}

/**
 * Trims the text to fit within the specified width.
 *
 * @param {number} maxWidth - The maximum width allowed for the text.
 * @param {string} text - The text string to trim.
 * @param {PieChartFontProps} font - The font style used for the text.
 * @param {boolean} isRtlEnabled - Boolean indicating if right-to-left text is enabled.
 * @param {PieChartFontProps} themeFontStyle - The theme font style.
 * @returns {string} - The trimmed text that fits within the specified width.
 * @private
 */
export function useTextTrim(
    maxWidth: number, text: string, font: PieChartFontProps,
    isRtlEnabled: boolean, themeFontStyle: PieChartFontProps): string {
    let label: string = text;
    let size: number = measureText(text, font, themeFontStyle).width;

    if (size > maxWidth) {
        for (let i: number = text.length - 1; i >= 0; --i) {
            label = isRtlEnabled ? '...' + text.substring(0, i) : text.substring(0, i) + '...';
            size = measureText(label, font, themeFontStyle).width;
            if (size <= maxWidth) {
                return label;
            }
        }
    }
    return label;
}
