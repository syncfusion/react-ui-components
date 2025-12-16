import { ChartLocationProps } from '../../base/interfaces';
import { PathCommand, Rect, SeriesProperties } from '../../chart-area/chart-interfaces';

/**
 * Determines whether the two consecutive points are almost same value.
 *
 * @param {number} firstPoint - The fisrt value of data point.
 * @param {number} secondPoint - The second value of data point.
 * @param {number} elapsed - Number compared with difference of two points.
 * @returns {boolean} - Whether the two pints are almost same
 */
function nearlyEqual(firstPoint: number, secondPoint: number, elapsed: number = 1e-6): boolean {
    return Math.abs(firstPoint - secondPoint) <= elapsed;
}

/**
 * Splits a Range-Area fill segment into low-forward and high-backward polylines.
 *
 * @param {PathCommand[]} commands - The path commands to be split.
 * @param {number} startIndex - The starting index of the segment in the path command array.
 * @returns {{ low: ChartLocationProps[], high: ChartLocationProps[], nextIndex: number, closedWithZ: boolean } | null} - The split segment details or null if invalid.
 * @private
 */
export function splitRangeAreaSegment(commands: PathCommand[], startIndex: number)
    : { low: ChartLocationProps[]; high: ChartLocationProps[]; nextIndex: number; closedWithZ: boolean; } | null {
    const points: ChartLocationProps[] = [];
    let i: number = startIndex;
    if (commands[i as number].type !== 'M') { return null; }

    points.push({ x: commands[i as number].coords[0], y: commands[i as number].coords[1] });
    i++;

    const segmentPoints: ChartLocationProps[] = [points[0]];
    for (; i < commands.length; i++) {
        const command: PathCommand = commands[i as number];
        if (command.type === 'Z' || command.type === 'M') { break; }
        segmentPoints.push({ x: command.coords[0], y: command.coords[1] });
    }

    let pivotIndex: number = -1;
    for (let k: number = 0; k + 1 < segmentPoints.length; k++) {
        if (nearlyEqual(segmentPoints[k as number].x, segmentPoints[k + 1].x) &&
            !nearlyEqual(segmentPoints[k as number].y, segmentPoints[k + 1].y)) {
            pivotIndex = k;
            break;
        }
    }
    if (pivotIndex < 0) {
        pivotIndex = Math.floor((segmentPoints.length - 1) / 2);
    }

    const lowPoints: ChartLocationProps[] = segmentPoints.slice(0, pivotIndex + 1);
    const highPoints: ChartLocationProps[] = segmentPoints.slice(pivotIndex + 1);

    return {
        low: lowPoints,
        high: highPoints,
        nextIndex: i < commands.length && commands[i as number].type === 'Z' ? i + 1 : i,
        closedWithZ: i < commands.length && commands[i as number].type === 'Z'
    };
}

/**
 * Duplicates elements in polylines to match target length for smooth interpolation.
 *
 *
 * @param {ChartLocationProps[]} firstSegment - First polyline.
 * @param {ChartLocationProps[]} secondSegment - Second polyline.
 * @returns {{ a: ChartLocationProps[], b: ChartLocationProps[] }} - Equalized polylines.
 * @private
 */
export function equalizePolyline(firstSegment: ChartLocationProps[], secondSegment: ChartLocationProps[])
    : { firstSegment: ChartLocationProps[]; secondSegment: ChartLocationProps[] } {
    const firstPoint: ChartLocationProps[] = firstSegment.slice();
    const secondPoint: ChartLocationProps[] = secondSegment.slice();
    if (firstPoint.length === secondPoint.length) { return { firstSegment: firstPoint, secondSegment: secondPoint }; }

    const target: number = Math.max(firstPoint.length, secondPoint.length);

    // Decide which end is already aligned; duplicate on the opposite end to preserve that "anchor".
    const headGap: number =
        (firstPoint.length && secondPoint.length)
            ? Math.hypot(firstPoint[0].x - secondPoint[0].x, firstPoint[0].y - secondPoint[0].y)
            : Number.POSITIVE_INFINITY;
    const tailGap: number =
        (firstPoint.length && secondPoint.length)
            ? Math.hypot(firstPoint[firstPoint.length - 1].x - secondPoint[secondPoint.length - 1].x,
                         firstPoint[firstPoint.length - 1].y - secondPoint[secondPoint.length - 1].y)
            : Number.POSITIVE_INFINITY;

    // If heads are closer, keep head anchored and duplicate near tail; else duplicate near head.
    const duplicateSide: 'head' | 'tail' = headGap <= tailGap ? 'tail' : 'head';

    const grow: (array: ChartLocationProps[], tgt: number) => ChartLocationProps[]
    = (array: ChartLocationProps[], tgt: number): ChartLocationProps[] => {
        if (array.length === 0) { return array; }
        while (array.length < tgt) {
            const idx: number = duplicateSide === 'head'
                ? (array.length > 1 ? 1 : 0)              // duplicate near front to keep tail anchored
                : (array.length > 1 ? array.length - 1 : 0); // duplicate near tail to keep head anchored
            array.splice(idx, 0, { ...array[idx as number] });
        }
        return array;
    };

    return {
        firstSegment: grow(firstPoint, target),
        secondSegment: grow(secondPoint, target)
    };
}

/**
 * Calculates the positions of the high and low markers for a given rectangular area,
 * based on the orientation and axis inversion of the series.
 *
 * @param {Rect} rect - The bounding rectangle in coordinate space.
 * @param {SeriesProperties} series - The series object containing chart and axis orientation information.
 * @returns {[number, number]} A tuple containing the coordinates of the high and low markers.
 * @private
 */
export function getHighLowMarkerLocations(
    rect: Rect,
    series: SeriesProperties
): [{ x: number; y: number }, { x: number; y: number }] {
    if (!series.chart.requireInvertedAxis) {
        // Vertical bars: value varies along Y
        const top: { x: number; y: number; } = { x: rect.x + rect.width / 2, y: rect.y };
        const bottom: { x: number; y: number; } = { x: rect.x + rect.width / 2, y: rect.y + rect.height };
        return series.yAxis?.isAxisInverse ? [bottom, top] : [top, bottom];
    }
    // Horizontal bars: value varies along X
    const left: { x: number; y: number; } = { x: rect.x, y: rect.y + rect.height / 2 };
    const right: { x: number; y: number; } = { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
    return series.xAxis?.isAxisInverse ? [left, right] : [right, left];
}
