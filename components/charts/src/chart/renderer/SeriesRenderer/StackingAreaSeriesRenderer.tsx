import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { StackingAreaSeriesAnimateState, StackingAreaSeriesRendererType, PathCommand, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { applyPointRenderCallback, getPoint } from '../../utils/helper';
import { parsePathCommands } from './AreaSeriesRenderer';
import { LineBase, LineBaseReturnType } from './LineBase';
import MarkerRenderer from './MarkerRenderer';
import { AnimationState } from './SeriesAnimation';

const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * Type for stacked values, assuming optional arrays.
 */
interface StackValuesType {
    startValues?: number[];
    endValues?: number[];
}

/**
 * Parses SVG path to an array of points.
 *
 * @param {string} pathString - The SVG path data string.
 * @returns {{x: number, y: number}[]} Array of extracted points.
 * @private
 */
export function extractPointsFromPath(pathString: string): { x: number; y: number }[] {
    const pathCommands: PathCommand[] = parsePathCommands(pathString);
    const extractedPoints: { x: number; y: number }[] = [];

    for (const command of pathCommands) {
        const [xCoord, yCoord] = command.coords;
        if ((command.type === 'M' || command.type === 'L') && command.coords.length >= 2) {
            extractedPoints.push({ x: xCoord, y: yCoord });
        }
    }

    return extractedPoints;
}

/**
 * Gets the category coordinate for a point (x for non-inverted, y for inverted).
 *
 * @param {{x: number, y: number}} point - The point object.
 * @param {number} point.x - The x-coordinate of the point.
 * @param {number} point.y - The y-coordinate of the point.
 * @param {boolean} isInverted - Whether the chart is inverted.
 * @returns {number} Category coordinate.
 * @private
 */
export function getCategoryCoord(point: { x: number; y: number }, isInverted: boolean): number {
    return isInverted ? point.y : point.x;
}

/**
 * Determines the direction of category progression (1 for increasing coord, -1 for decreasing).
 *
 * @param {{x: number, y: number}[]} pointList - Array of points.
 * @param {boolean} isInverted - Whether the chart is inverted.
 * @param {boolean} isCatInverse - Whether the category axis is inverted.
 * @returns {number} Direction (1 or -1).
 * @private
 */
export function getCategoryDirection(
    pointList: { x: number; y: number }[],
    isInverted: boolean,
    isCatInverse: boolean
): number {
    if (pointList.length < 3) {
        return isCatInverse ? -1 : 1;
    }

    const category1: number = getCategoryCoord(pointList[1], isInverted);
    const category2: number = getCategoryCoord(pointList[2], isInverted);
    const deltaCategory: number = category2 - category1;
    let direction: number = deltaCategory > 1e-6 ? 1 : (deltaCategory < -1e-6 ? -1 : 0);
    if (direction === 0) {
        direction = isCatInverse ? -1 : 1;
    }
    return direction;
}

/**
 * Finds the split index between forward (upper) and backward (lower) segments based on category direction change.
 *
 * @param {{x: number, y: number}[]} pointList - Array of points to evaluate.
 * @param {boolean} isInverted - Whether the chart is inverted.
 * @param {boolean} isCatInverse - Whether the category axis is inverted.
 * @returns {number} Split index where the direction of category values changes.
 * @private
 */
export function getPathSplitIndex(
    pointList: { x: number; y: number }[],
    isInverted: boolean,
    isCatInverse: boolean
): number {
    if (pointList.length < 2) {
        return 0;
    }

    const dir: number = getCategoryDirection(pointList, isInverted, isCatInverse);
    let splitAtIndex: number = 1;
    let previousCat: number = getCategoryCoord(pointList[0], isInverted);

    for (let currentIndex: number = 1; currentIndex < pointList.length; currentIndex++) {
        const currentCat: number = getCategoryCoord(pointList[currentIndex as number], isInverted);
        const deltaCat: number = currentCat - previousCat;

        if (Math.abs(deltaCat) < 1e-6) {
            // Same category (e.g., vertical/horizontal turn), continue
        } else if ((deltaCat * dir) > 1e-6) {
            // Moving forward in category direction
            splitAtIndex = currentIndex;
        } else {
            // Moving backward (opposite direction)
            return splitAtIndex;
        }

        previousCat = currentCat;
    }

    return splitAtIndex;
}

/**
 * Extracts upper and lower polylines from the given points using a split index.
 *
 * @param {{x: number, y: number}[]} allPoints - Complete array of points.
 * @param {number} splitIndex - Index to separate upper and lower segments.
 * @returns {{upperPoints: Array<{x: number, y: number}>, lowerPoints: Array<{x: number, y: number}>}} Upper and lower point sets.
 * @private
 */
export function separateUpperAndLowerPoints(
    allPoints: { x: number; y: number }[],
    splitIndex: number
): { upperPoints: { x: number; y: number }[]; lowerPoints: { x: number; y: number }[] } {
    const upperPoints: { x: number; y: number }[] = allPoints.slice(1, splitIndex + 1);
    const lowerPoints: { x: number; y: number }[] = [allPoints[0]];

    for (let pointIndex: number = allPoints.length - 2; pointIndex >= splitIndex + 1; pointIndex--) {
        lowerPoints.push(allPoints[pointIndex as number]);
    }

    return { upperPoints, lowerPoints };
}

/**
 * Interpolates two polylines point-wise, padding the shorter one with its last point.
 *
 * @param {{x: number, y: number}[]} startPolyline - Starting polyline.
 * @param {{x: number, y: number}[]} endPolyline - Ending polyline.
 * @param {number} progress - Animation progress (0–1).
 * @returns {{x: number, y: number}[]} Interpolated polyline.
 * @private
 */
export function interpolatePolylines(
    startPolyline: { x: number; y: number }[],
    endPolyline: { x: number; y: number }[],
    progress: number
): { x: number; y: number }[] {
    const maxLength: number = Math.max(startPolyline.length, endPolyline.length);
    const interpolatedPoints: { x: number; y: number }[] = [];

    for (let pointIndex: number = 0; pointIndex < maxLength; pointIndex++) {
        const startPoint: {
            x: number;
            y: number;
        } = pointIndex < startPolyline.length
            ? startPolyline[pointIndex as number]
            : startPolyline[startPolyline.length - 1];
        const endPoint: {
            x: number;
            y: number;
        } = pointIndex < endPolyline.length
            ? endPolyline[pointIndex as number]
            : endPolyline[endPolyline.length - 1];

        interpolatedPoints.push({
            x: startPoint.x + (endPoint.x - startPoint.x) * progress,
            y: startPoint.y + (endPoint.y - startPoint.y) * progress
        });
    }

    return interpolatedPoints;
}

/**
 * Computes the linearly interpolated path value coordinate at a given category coordinate.
 *
 * @param {number} targetCat - The target category coordinate.
 * @param {{x: number, y: number}} leftPoint - The left reference point.
 * @param {number} leftPoint.x - The x-coordinate of the left reference point.
 * @param {number} leftPoint.y - The y-coordinate of the left reference point.
 * @param {{x: number, y: number}} rightPoint - The right reference point.
 * @param {number} rightPoint.x - The x-coordinate of the right reference point.
 * @param {number} rightPoint.y - The y-coordinate of the right reference point.
 * @param {boolean} isInverted - Whether the chart is inverted.
 * @returns {number} Interpolated path value coordinate.
 * @private
 */
export function interpolatePathValueCoord(
    targetCat: number,
    leftPoint: { x: number; y: number },
    rightPoint: { x: number; y: number },
    isInverted: boolean
): number {
    if (!isInverted) {
        // Non-inverted: interpolate y (value) vs x (cat)
        const deltaCat: number = rightPoint.x - leftPoint.x;
        if (Math.abs(deltaCat) < 1e-6) {
            return (leftPoint.y + rightPoint.y) / 2;
        }
        const ratio: number = Math.max(0, Math.min(1, (targetCat - leftPoint.x) / deltaCat));
        return leftPoint.y + ratio * (rightPoint.y - leftPoint.y);
    } else {
        // Inverted: interpolate x (value) vs y (cat)
        const deltaCat: number = rightPoint.y - leftPoint.y;
        if (Math.abs(deltaCat) < 1e-6) {
            return (leftPoint.x + rightPoint.x) / 2;
        }
        const ratio: number = Math.max(0, Math.min(1, (targetCat - leftPoint.y) / deltaCat));
        return leftPoint.x + ratio * (rightPoint.x - leftPoint.x);
    }
}

/**
 * Creates a new point with target category and interpolated value.
 *
 * @param {number} targetCat - Target category coordinate.
 * @param {number} interpolatedVal - Interpolated value coordinate.
 * @param {boolean} isInverted - Whether inverted.
 * @returns {{x: number, y: number}} New point.
 * @private
 */
export function createInterpolatedPoint(
    targetCat: number,
    interpolatedVal: number,
    isInverted: boolean
): { x: number; y: number } {
    return isInverted ? { x: interpolatedVal, y: targetCat } : { x: targetCat, y: interpolatedVal };
}

/**
 * Specialized path interpolation for stacking area charts.
 * Handles cumulative fill and smooth transitions between data sets.
 *
 * @param {string} startPathData - Starting SVG path data.
 * @param {string} endPathData - Ending SVG path data.
 * @param {number} progress - Animation progress (0–1).
 * @param {number} [removedPointIndex] - Index of a removed point for padding logic.
 * @param {boolean} isInverted - Whether the chart is inverted.
 * @param {boolean} isCatInverse - Whether the category axis is inverted.
 * @returns {string} Interpolated path data.
 * @private
 */
export function interpolateStackingAreaPath(
    startPathData: string,
    endPathData: string,
    progress: number,
    removedPointIndex?: number,
    isInverted: boolean = false,
    isCatInverse: boolean = false
): string {
    if (!startPathData || !endPathData) {
        return endPathData || startPathData || '';
    }

    const startPoints: {
        x: number;
        y: number;
    }[] = extractPointsFromPath(startPathData);
    const endPoints: {
        x: number;
        y: number;
    }[] = extractPointsFromPath(endPathData);

    const startSplitIndex: number = getPathSplitIndex(startPoints, isInverted, isCatInverse);
    const endSplitIndex: number = getPathSplitIndex(endPoints, isInverted, isCatInverse);

    const { upperPoints: upperStartPoints, lowerPoints: lowerStartPoints } = separateUpperAndLowerPoints(startPoints, startSplitIndex);
    const { upperPoints: upperEndPoints, lowerPoints: lowerEndPoints } = separateUpperAndLowerPoints(endPoints, endSplitIndex);

    // Handle smooth padding when a point is removed
    if (removedPointIndex !== undefined && upperStartPoints.length > upperEndPoints.length) {
        const newLength: number = upperEndPoints.length;

        if (removedPointIndex >= newLength) {
            // Handle end removal
            if (upperEndPoints.length > 0) { upperEndPoints.push({ ...upperEndPoints[upperEndPoints.length - 1] }); }
            if (lowerEndPoints.length > 0) { lowerEndPoints.push({ ...lowerEndPoints[lowerEndPoints.length - 1] }); }
        } else if (removedPointIndex === 0) {
            // Handle first point removal
            if (upperEndPoints.length > 0) { upperEndPoints.unshift({ ...upperEndPoints[0] }); }
            if (lowerEndPoints.length > 0) { lowerEndPoints.unshift({ ...lowerEndPoints[0] }); }
        } else {
            // Handle internal removal
            if (removedPointIndex > 0 && removedPointIndex < upperEndPoints.length) {
                // Upper padding
                const leftUpper: { x: number; y: number } = upperEndPoints[removedPointIndex - 1];
                const rightUpper: { x: number; y: number } = upperEndPoints[removedPointIndex as number];
                const targetCatUpper: number = getCategoryCoord(upperStartPoints[removedPointIndex as number], isInverted);
                const interpolatedYUpper: number = interpolatePathValueCoord(targetCatUpper, leftUpper, rightUpper, isInverted);
                upperEndPoints.splice(removedPointIndex, 0, createInterpolatedPoint(targetCatUpper, interpolatedYUpper, isInverted));

                // Lower padding
                const leftLower: { x: number; y: number } = lowerEndPoints[removedPointIndex - 1];
                const rightLower: { x: number; y: number } = lowerEndPoints[removedPointIndex as number];
                const targetCatLower: number = getCategoryCoord(lowerStartPoints[removedPointIndex as number], isInverted);
                const interpolatedYLower: number = interpolatePathValueCoord(targetCatLower, leftLower, rightLower, isInverted);
                lowerEndPoints.splice(removedPointIndex, 0, createInterpolatedPoint(targetCatLower, interpolatedYLower, isInverted));
            }
        }
    }

    const interpolatedUpperPoints: {
        x: number;
        y: number;
    }[] = interpolatePolylines(upperStartPoints, upperEndPoints, progress);
    const interpolatedLowerPoints: {
        x: number;
        y: number;
    }[] = interpolatePolylines(lowerStartPoints, lowerEndPoints, progress);

    let interpolatedPath: string = `M ${interpolatedLowerPoints[0].x} ${interpolatedLowerPoints[0].y}`;
    for (const point of interpolatedUpperPoints) {
        interpolatedPath += ` L ${point.x} ${point.y}`;
    }
    for (let pointIndex: number = interpolatedLowerPoints.length - 1; pointIndex >= 0; pointIndex--) {
        interpolatedPath += ` L ${interpolatedLowerPoints[pointIndex as number].x} ${interpolatedLowerPoints[pointIndex as number].y}`;
    }
    interpolatedPath += ' Z';

    return interpolatedPath;
}

/**
 * Specialized interpolation for the border path of stacking area charts.
 * Focuses on interpolating the top boundary for smooth border animation.
 *
 * @param {string} startBorderPath - Starting border path data.
 * @param {string} endBorderPath - Ending border path data.
 * @param {number} progress - Animation progress (0–1).
 * @param {number} [removedPointIndex] - Index of removed point for padding logic.
 * @param {boolean} isInverted - Whether the chart is inverted.
 * @returns {string} Interpolated border path data.
 * @private
 */
export function interpolateStackingBorderPath(
    startBorderPath: string,
    endBorderPath: string,
    progress: number,
    removedPointIndex?: number,
    isInverted: boolean = false
): string {
    if (!startBorderPath || !endBorderPath) {
        return endBorderPath || startBorderPath || '';
    }

    const startBorderPoints: {
        x: number;
        y: number;
    }[] = extractPointsFromPath(startBorderPath);
    const endBorderPoints: {
        x: number;
        y: number;
    }[] = extractPointsFromPath(endBorderPath);

    // Handle smooth padding when a point is removed
    if (removedPointIndex !== undefined && startBorderPoints.length > endBorderPoints.length) {
        const newLength: number = endBorderPoints.length;

        if (removedPointIndex >= newLength) {
            if (endBorderPoints.length > 0) { endBorderPoints.push({ ...endBorderPoints[endBorderPoints.length - 1] }); }
        } else if (removedPointIndex === 0) {
            if (endBorderPoints.length > 0) { endBorderPoints.unshift({ ...endBorderPoints[0] }); }
        } else if (removedPointIndex > 0 && removedPointIndex < endBorderPoints.length) {
            const leftPoint: { x: number; y: number } = endBorderPoints[removedPointIndex - 1];
            const rightPoint: { x: number; y: number } = endBorderPoints[removedPointIndex as number];
            const targetCat: number = getCategoryCoord(startBorderPoints[removedPointIndex as number], isInverted);
            const interpolatedVal: number = interpolatePathValueCoord(targetCat, leftPoint, rightPoint, isInverted);
            endBorderPoints.splice(removedPointIndex, 0, createInterpolatedPoint(targetCat, interpolatedVal, isInverted));
        }
    }

    const interpolatedBorderPoints: {
        x: number;
        y: number;
    }[] = interpolatePolylines(startBorderPoints, endBorderPoints, progress);

    let interpolatedBorderPath: string = `M ${interpolatedBorderPoints[0].x} ${interpolatedBorderPoints[0].y}`;
    for (let i: number = 1; i < interpolatedBorderPoints.length; i++) {
        interpolatedBorderPath += ` L ${interpolatedBorderPoints[i as number].x} ${interpolatedBorderPoints[i as number].y}`;
    }

    return interpolatedBorderPath;
}

/**
 * Renders a Stacking Area series for the chart.
 * This module provides functions to generate SVG paths for the stacked area fill and its border,
 * handle animations for initial rendering and data updates, and integrate with markers.
 * Adapted from EJ2 StackingAreaSeries logic for cumulative stacking.
 */
export const StackingAreaSeriesRenderer: StackingAreaSeriesRendererType = {

    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState | StackingAreaSeriesAnimateState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties
    ): {
        strokeDasharray: string | number;
        strokeDashoffset: number;
        interpolatedD?: string;
        animatedDirection?: string;
        animatedTransform?: string;
        animatedClipPath?: string;
    } => {
        // Extract animation state
        const { isInitialRenderRef, renderedPathDRef, animationProgress } = animationState;
        if (!renderedPathDRef.current) {
            renderedPathDRef.current = {};
        }
        const isInitial: boolean = isInitialRenderRef.current[index as number] ?? false;

        // Get path data
        const pathD: string = pathOptions.d as string;
        const id: string = pathOptions.id ? pathOptions.id.toString() : '';
        const isBorder: boolean = id.includes('_border_');
        const idParts: string[] = id.split('_');
        const seriesIndexString: string = idParts[idParts.length - 1];
        const seriesIndex: number = parseInt(seriesIndexString, 10);

        const storedKey: string = `${isBorder ? 'border' : 'area'}_${seriesIndex}`;

        const isInverted: boolean = currentSeries.chart?.requireInvertedAxis || false;
        const isCatInverse: boolean = currentSeries.xAxis?.isAxisInverse || false;

        if (enableAnimation) {
            // For initial render animation (clip-path similar to AreaSeries)
            if (isInitial) {
                if (animationProgress === 1) {
                    isInitialRenderRef.current[index as number] = false;
                    (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                }

                // Parse the path to find min/max X/Y values
                const commands: PathCommand[] = parsePathCommands(pathD);
                const xCoords: number[] = commands
                    .filter((cmd: PathCommand) => cmd.type !== 'Z' && cmd.coords.length >= 2)
                    .map((cmd: PathCommand) => cmd.coords[0]);

                if (xCoords.length === 0) {
                    return {
                        strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                        strokeDashoffset: 0
                    };
                }

                const minX: number = Math.min(...xCoords);
                const maxX: number = Math.max(...xCoords);
                const range: number = maxX - minX;

                const animWidth: number = range * animationProgress;
                let clipPathStr: string = '';

                if (!isInverted) {
                    if (isCatInverse) {
                        clipPathStr = `inset(0 0 0 ${range - animWidth}px)`;
                    } else {
                        clipPathStr = `inset(0 ${range - animWidth}px 0 0)`;
                    }
                } else {
                    const yCoords: number[] = commands
                        .filter((cmd: PathCommand) => cmd.type !== 'Z' && cmd.coords.length >= 2)
                        .map((cmd: PathCommand) => cmd.coords[1]);

                    if (yCoords.length === 0) {
                        return {
                            strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                            strokeDashoffset: 0
                        };
                    }

                    const minY: number = Math.min(...yCoords);
                    const maxY: number = Math.max(...yCoords);
                    const rangeY: number = maxY - minY;
                    const animHeight: number = rangeY * animationProgress;

                    const isYAxisInverse: boolean = currentSeries?.yAxis?.isAxisInverse || false;
                    if (isYAxisInverse) {
                        clipPathStr = `inset(0 0 ${rangeY - animHeight}px 0)`;
                    } else {
                        clipPathStr = `inset(${rangeY - animHeight}px 0 0 0)`;
                    }
                }

                return {
                    strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                    strokeDashoffset: 0,
                    animatedClipPath: clipPathStr
                };
            } else if (pathD && (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string]) {
                const storedD: string = (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string];

                if (pathD !== storedD) {
                    const endPath: string = pathD;
                    const removedPointIndex: number | undefined = currentSeries.removedPointIndex;

                    // Use specialized interpolation with padding handled internally
                    const interpolatedD: string = isBorder ?
                        interpolateStackingBorderPath(storedD, endPath, animationProgress, removedPointIndex, isInverted) :
                        interpolateStackingAreaPath(storedD, endPath, animationProgress, removedPointIndex, isInverted, isCatInverse);

                    if (animationProgress === 1) {
                        (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                    }
                    return {
                        strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                        strokeDashoffset: 0,
                        interpolatedD
                    };
                }
            }

            // Update stored path when animation completes
            if (animationProgress === 1) {
                (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
            }
        }

        return {
            strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
            strokeDashoffset: 0
        };
    },

    render: (series: SeriesProperties, isInverted: boolean) => {
        let direction: string = '';
        let seriesFill: string | undefined;
        let borderDirection: string = '';
        const getCoordinate: Function = getPoint;
        const emptyPointMode: string = series.emptyPointSettings?.mode ?? 'Gap';
        const visiblePointsRaw: Points[] = lineBaseInstance.enableComplexProperty(series);
        const visiblePoints: Points[] = Array.isArray(visiblePointsRaw) ? visiblePointsRaw : [];
        let point: Points;
        let previousSeries: SeriesProperties | null = null;
        const visibleSeries: SeriesProperties[] = series.chart.visibleSeries || [];
        const currentIndex: number = series.index;
        const axisName: string | null | undefined = series.yAxisName;
        for (let k: number = currentIndex - 1; k >= 0; k--) {
            const prevSer: SeriesProperties = visibleSeries[k as number];
            if (
                prevSer &&
            prevSer.visible &&
            (prevSer.type ?? '').includes('Stacking') &&
            prevSer.yAxisName === axisName
            ) {
                previousSeries = prevSer;
                break;
            }
        }
        const stackedValues: StackValuesType = series.stackedValues || { startValues: [], endValues: [] };

        const mode: string = emptyPointMode.toLowerCase();
        const includeEmptyModes: string[] = ['zero', 'average'];
        const useContribs: boolean = mode === 'zero' || mode === 'average';
        const isEmptyArray: boolean[] = visiblePoints.map((p: Points) => p.yValue == null || p.yValue === undefined);

        let contribs: number[] = [];
        if (useContribs) {
            contribs = new Array(visiblePoints.length).fill(0);
            for (let ii: number = 0; ii < visiblePoints.length; ii++) {
                if (!isEmptyArray[ii as number]) {
                    contribs[ii as number] = (visiblePoints[ii as number].yValue as number) || 0;
                }
            }
            if (mode === 'average') {
                for (let ii: number = 0; ii < visiblePoints.length; ii++) {
                    if (!isEmptyArray[ii as number]) { continue; }
                }
            }
        }

        let lastAddedIndex: number = -1;
        let currentSegmentStartIndex: number = -1;

        for (let i: number = 0; i < visiblePoints.length; i++) {
            point = visiblePoints[i as number];

            point.symbolLocations = point.symbolLocations || [];
            point.regions = point.regions || [];

            const isEmptyPoint: boolean = isEmptyArray[i as number];
            const effectiveVisible: boolean = !isEmptyPoint || includeEmptyModes.includes(mode);

            if (effectiveVisible) {
                const pointIndex: number = point.index as number;
                const adjustedStart: number = previousSeries ?
                    ((previousSeries.stackedValues as StackValuesType)?.endValues?.[pointIndex as number] ?? 0) :
                    0;

                let rawEndValue: number = adjustedStart + ((stackedValues.endValues?.[pointIndex as number] ?? 0) -
                (stackedValues.startValues?.[pointIndex as number] ?? 0));
                if (useContribs) {
                    rawEndValue = adjustedStart + contribs[i as number];
                }
                const endValue: number = (!series.visible && (series.isLegendClicked ?? false)) ? adjustedStart : rawEndValue;

                const currentXValue: number = point.xValue as number;
                const pointLoc: ChartLocationProps = getCoordinate(
                    currentXValue, endValue, series.xAxis, series.yAxis, isInverted, series
                );
                const startLoc: ChartLocationProps = getCoordinate(
                    currentXValue, adjustedStart, series.xAxis, series.yAxis, isInverted, series
                );

                point.symbolLocations.push(pointLoc);

                // Region for hit-testing
                const markerWidth: number = series.marker && series.marker.width ? series.marker.width : 0;
                const markerHeight: number = series.marker && series.marker.height ? series.marker.height : 0;

                point.regions.push({
                    x: pointLoc.x - markerWidth / 2,
                    y: pointLoc.y - markerHeight / 2,
                    width: markerWidth,
                    height: markerHeight
                });

                const customizedValues: string = applyPointRenderCallback(({
                    seriesIndex: series.index as number, color: series.interior as string,
                    xValue: point.xValue as number | Date | string | null,
                    yValue: point.yValue as number | Date | string | null
                }), series.chart);
                point.interior = customizedValues;

                if (!seriesFill) { seriesFill = customizedValues; }

                // Determine if new segment
                const isNewSegment: boolean = (lastAddedIndex === -1) || (i > lastAddedIndex + 1 && mode === 'gap');

                if (isNewSegment) {
                    direction += `M ${startLoc.x} ${startLoc.y} L ${pointLoc.x} ${pointLoc.y} `;
                    borderDirection += `M ${pointLoc.x} ${pointLoc.y} `;
                    currentSegmentStartIndex = i;
                } else {
                    direction += `L ${pointLoc.x} ${pointLoc.y} `;
                    borderDirection += `L ${pointLoc.x} ${pointLoc.y} `;
                }

                lastAddedIndex = i;

                // Check if end of segment
                let nextEffective: boolean = false;
                if (i + 1 < visiblePoints.length) {
                    const nextPoint: Points = visiblePoints[i + 1];
                    const nextIsEmpty: boolean = nextPoint.yValue == null || nextPoint.yValue === undefined;
                    nextEffective = !nextIsEmpty || includeEmptyModes.includes(mode);
                }

                const isEndOfSegment: boolean = (i === visiblePoints.length - 1) ||
                    (mode !== 'drop' && !nextEffective);

                if (isEndOfSegment) {
                    // Close the segment by adding backward bottoms
                    for (let j: number = i; j >= currentSegmentStartIndex; j--) {
                        const segPoint: Points = visiblePoints[j as number];
                        const segPointIndex: number = segPoint.index as number;
                        const segAdjustedStart: number = previousSeries ?
                            ((previousSeries.stackedValues as StackValuesType)?.endValues?.[segPointIndex as number] ?? 0) :
                            0;

                        const segXValue: number = segPoint.xValue as number;
                        const segStartLoc: ChartLocationProps = getCoordinate(
                            segXValue, segAdjustedStart, series.xAxis, series.yAxis, isInverted, series
                        );

                        let segRawEndValue: number = segAdjustedStart + ((stackedValues.endValues?.[segPointIndex as number] ?? 0) -
                        (stackedValues.startValues?.[segPointIndex as number] ?? 0));
                        if (useContribs) {
                            segRawEndValue = segAdjustedStart + contribs[j as number];
                        }
                        const segEndValue: number =
                        (!series.visible && (series.isLegendClicked ?? false)) ? segAdjustedStart : segRawEndValue;

                        if (segAdjustedStart === segEndValue) {
                            segStartLoc.y = Math.floor(segStartLoc.y);
                        }

                        direction += `L ${segStartLoc.x} ${segStartLoc.y} `;
                    }
                    // Close each segment individually for proper multi-subpath filling
                    direction += ' Z';
                }
            }
        }

        // Filter visiblePoints to only include points with symbol locations (avoids tooltip errors on skipped points)
        series.visiblePoints = visiblePoints.filter((point: Points) => point && point.symbolLocations && point.symbolLocations.length > 0);

        // First, create the area fill path
        const name: string = series.chart.element.id + '_Series_' + (series.index);
        const seriesOptions: RenderOptions = {
            id: name,
            fill: seriesFill as string,
            strokeWidth: 0,
            stroke: 'transparent',
            opacity: series.opacity,
            dashArray: series.dashArray,
            d: direction
        };

        const options: RenderOptions[] = [seriesOptions];

        // Then add the border path with the same timing
        if (series.border?.width !== 0) {
            const borderName: string = series.chart.element.id + '_Series_border_' + (series.index);
            const borderOptions: RenderOptions = {
                id: borderName,
                fill: 'transparent',
                strokeWidth: series.border?.width ?? 0,
                stroke: series.border?.color ?? seriesFill,
                opacity: 1,
                dashArray: series.border?.dashArray,
                d: borderDirection
            };
            options.push(borderOptions);
        }
        const marker: ChartMarkerProps | null = series.visible && series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
        return marker ? { options, marker } : options;
    }
};

export default StackingAreaSeriesRenderer;
