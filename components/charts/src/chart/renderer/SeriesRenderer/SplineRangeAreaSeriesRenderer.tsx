import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { AreaSeriesAnimateState, PathCommand, Points, RangeAreaSeriesRendererType, RenderOptions, SeriesProperties} from '../../chart-area/chart-interfaces';
import { getPoint } from '../../utils/helper';
import { parsePathCommands } from './AreaSeriesRenderer';
import { LineBase, LineBaseReturnType } from './LineBase';
import MarkerRenderer from './MarkerRenderer';
import { equalizePolyline, splitRangeAreaSegment } from './RangeBase';
import { AnimationState, interpolatePathD } from './SeriesAnimation';

const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * Converts an array of points into a smooth spline path string (Catmull Rom to cubic Bézier).
 *
 * @param {ChartLocationProps[]} points - The array of point objects containing x and y coordinates.
 * @returns {string} The generated SVG path string representing a smooth spline curve.
 * @private
 */
export function splinePath(points: ChartLocationProps[]): string {
    if (!points || points.length === 0) {return ''; }
    if (points.length === 1) {return `M ${points[0].x} ${points[0].y} `; }

    const rawPoints : ChartLocationProps[] = points.map((point: ChartLocationProps)  => ({ x: point.x, y: point.y }));
    const extendedPoints: ChartLocationProps[]   = [
        { x: rawPoints[0].x, y: rawPoints[0].y },
        ...rawPoints,
        { x: rawPoints[rawPoints.length - 1].x, y: rawPoints[rawPoints.length - 1].y }
    ];

    let path: string = `M ${extendedPoints[1].x} ${extendedPoints[1].y} `;
    for (let i: number = 1; i < extendedPoints.length - 2; i++) {
        const previousPoint: ChartLocationProps = extendedPoints[i - 1];
        const currentPoint: ChartLocationProps  = extendedPoints[i as number];
        const nextPoint: ChartLocationProps = extendedPoints[i + 1];
        const afterNextPoint : ChartLocationProps = extendedPoints[i + 2];

        const tension : number = 1 / 6;
        // Calculate control points
        const controlPoint1: ChartLocationProps = {
            x: currentPoint.x + (nextPoint.x - previousPoint.x) * tension,
            y: currentPoint.y + (nextPoint.y - previousPoint.y) * tension
        };

        const controlPoint2: ChartLocationProps = {
            x: nextPoint.x - (afterNextPoint.x - currentPoint.x) * tension,
            y: nextPoint.y - (afterNextPoint.y - currentPoint.y) * tension
        };

        // Append csegment to the path
        path += `C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${nextPoint.x} ${nextPoint.y} `;
    }
    return path;
}

/**
 * @private
 * Interpolates between two spline polylines based on a progress value and returns
 * the corresponding smooth spline path string.
 *
 * @param {ChartLocationProps[]} startPoints - The array of starting polyline points, each containing x and y coordinates.
 * @param {ChartLocationProps[]} endPoints - The array of ending polyline points, each containing x and y coordinates.
 * @param {number} progress - The interpolation progress between 0 (start) and 1 (end).
 * @returns {string} The generated SVG path string representing the interpolated spline.
 */
export function interpolateSplinePolylinePath(
    startPoints: ChartLocationProps[],
    endPoints: ChartLocationProps[],
    progress: number
): string {
    const { firstSegment: startSegment, secondSegment: endSegment } = equalizePolyline(startPoints, endPoints);

    if (startSegment.length === 0) {
        return '';
    }
    const roundTo3Decimals: (value: number) => number = (value: number): number =>
        Math.round(value * 1000) / 1000;

    const interpolatedPoints: ChartLocationProps[] = [];

    for (let i: number = 0; i < startSegment.length; i++) {
        const startX: number = startSegment[i as number].x;
        const startY: number = startSegment[i as number].y;
        const endX: number = endSegment[i as number].x;
        const endY: number = endSegment[i as number].y;

        interpolatedPoints.push({
            x: roundTo3Decimals(startX + (endX - startX) * progress),
            y: roundTo3Decimals(startY + (endY - startY) * progress)
        });
    }

    return splinePath(interpolatedPoints);
}


/**
 * @private
 * Interpolates between two spline range-area SVG path strings based on a progress value
 * and returns the interpolated path for smooth range transitions.
 *
 * @param {string} startD - The starting SVG path data string representing the initial spline range area.
 * @param {string} endD - The ending SVG path data string representing the target spline range area.
 * @param {number} progress - The interpolation progress between 0 (start) and 1 (end).
 * @returns {string} The generated interpolated SVG path string for the spline range area.
 */
export function interpolateSplineRangeAreaPath(startD: string, endD: string, progress: number): string {
    if (!startD || !endD) {return endD || startD || ''; }

    const startCommands: PathCommand[] = parsePathCommands(startD);
    const endCommands: PathCommand[] = parsePathCommands(endD);
    if (startCommands.length === 0 || endCommands.length === 0) {
        return interpolatePathD(startD, endD, progress);
    }

    let startCmdIndex: number = 0;
    let endCmdIndex: number = 0;
    let output: string = '';

    while (startCmdIndex < startCommands.length || endCmdIndex < endCommands.length) {
        while (startCmdIndex < startCommands.length && startCommands[startCmdIndex as number].type !== 'M') {startCmdIndex++; }
        while (endCmdIndex < endCommands.length && endCommands[endCmdIndex as number].type !== 'M') {endCmdIndex++; }
        if (startCmdIndex >= startCommands.length && endCmdIndex >= endCommands.length) {break; }

        const startSegment: {low: ChartLocationProps[]; high: ChartLocationProps[]; nextIndex: number; closedWithZ: boolean;
        } | null = startCmdIndex < startCommands.length ? splitRangeAreaSegment(startCommands, startCmdIndex) : null;
        const endSegment: {low: ChartLocationProps[]; high: ChartLocationProps[]; nextIndex: number; closedWithZ: boolean;
        } | null = endCmdIndex < endCommands.length ? splitRangeAreaSegment(endCommands, endCmdIndex) : null;

        if (!startSegment || !endSegment) {
            return interpolatePathD(startD, endD, progress);
        }

        const lowPath: string = interpolateSplinePolylinePath(startSegment.low, endSegment.low, progress);
        let highPath: string = interpolateSplinePolylinePath(startSegment.high, endSegment.high, progress);

        if (lowPath && highPath.startsWith('M')) {
            highPath = highPath.replace(/^M\s+/, 'L ');
        }

        output += lowPath + highPath;
        if (startSegment.closedWithZ || endSegment.closedWithZ) {
            output += 'Z ';
        }

        startCmdIndex = startSegment.nextIndex;
        endCmdIndex = endSegment.nextIndex;
    }

    return output.trim();
}

/**
 * @private
 * Interpolates between two spline range-border SVG path strings based on a progress value
 * and returns a smooth interpolated border path.
 *
 * @param {string} startD - The starting SVG path data string representing the initial spline border.
 * @param {string} endD - The ending SVG path data string representing the target spline border.
 * @param {number} progress - The interpolation progress value between 0 (start) and 1 (end).
 * @returns {string} The interpolated SVG path string representing the range border transition.
 */
export function interpolateSplineRangeBorderPath(startD: string, endD: string, progress: number): string {
    if (!startD || !endD) {return endD || startD || ''; }

    const startCommands: PathCommand[] = parsePathCommands(startD);
    const endCommands: PathCommand[] = parsePathCommands(endD);
    if (startCommands.length === 0 || endCommands.length === 0) {
        return interpolatePathD(startD, endD, progress);
    }

    const extractPolylines: (commands: PathCommand[]) => ChartLocationProps[][] = (commands: PathCommand[]): ChartLocationProps[][] => {
        const polylines: ChartLocationProps[][] = [];
        let index: number = 0;
        while (index < commands.length) {
            while (index < commands.length && commands[index as number].type !== 'M') {index++; }
            if (index >= commands.length) {break; }
            const segment: ChartLocationProps[] = [{ x: commands[index as number].coords[0], y: commands[index as number].coords[1] }];
            index++;
            while (index < commands.length && commands[index as number].type === 'L') {
                segment.push({ x: commands[index as number].coords[0], y: commands[index as number].coords[1] });
                index++;
            }
            polylines.push(segment);
        }
        return polylines;
    };

    const startPolylines: ChartLocationProps[][] = extractPolylines(startCommands);
    const endPolylines: ChartLocationProps[][] = extractPolylines(endCommands);
    const segmentCount: number = Math.max(startPolylines.length, endPolylines.length);

    let output: string = '';
    for (let i: number = 0; i < segmentCount; i++) {
        const startPolyline: ChartLocationProps[] = startPolylines[Math.min(i, startPolylines.length - 1)] ?? [];
        const endPolyline: ChartLocationProps[] = endPolylines[Math.min(i, endPolylines.length - 1)] ?? [];
        output += interpolateSplinePolylinePath(startPolyline, endPolyline, progress);
    }
    return output.trim();
}

/**
 * @private
 * Calculates the bounding box (minimum and maximum X/Y coordinates)
 * for the given SVG path string.
 *
 * @param {string} pathD - The SVG path data string to parse and measure.
 * @returns {{minX: number, maxX: number, minY: number, maxY: number}}
 * An object containing the minimum and maximum X and Y coordinates.
 */
export function getPathBounds(pathD: string): { minX: number; maxX: number; minY: number; maxY: number } {
    const commands: PathCommand[]
 = parsePathCommands(pathD);
    const xCoordinate: number[] = [];
    const yCoordinate: number[] = [];

    for (const cmd of commands) {
        if (cmd.type === 'M' || cmd.type === 'L' || cmd.type === 'C') {
            for (let i: number = 0; i < cmd.coords.length; i += 2) {
                xCoordinate.push(cmd.coords[i as number]);
                yCoordinate.push(cmd.coords[i + 1]);
            }
        }
    }

    return {
        minX: xCoordinate.length > 0 ? Math.min(...xCoordinate) : 0,
        maxX: xCoordinate.length > 0 ? Math.max(...xCoordinate) : 0,
        minY: yCoordinate.length > 0 ? Math.min(...yCoordinate) : 0,
        maxY: yCoordinate.length > 0 ? Math.max(...yCoordinate) : 0
    };
}

/**
 * Generates an initial SVG path string from the given final path.
 * Used to create a simplified or placeholder version of the full path,
 * such as for animation or rendering initialization.
 *
 * @param {string} finalPath - The complete SVG path data string to process.
 * @param {boolean} isBorder - Specifies whether the path represents a border segment.
 * @param {boolean} _isInverted - Indicates whether the chart orientation is inverted.
 * @returns {string} The generated initial SVG path string.
 * @private
 */
export function generateInitialPath(finalPath: string, isBorder: boolean, _isInverted: boolean): string {
    if (!finalPath) {return ''; }

    const commands : PathCommand[] = parsePathCommands(finalPath);
    if (commands.length === 0) {return ''; }

    let firstPoint: ChartLocationProps | null = null;
    for (const command of commands) {
        if (command.type === 'M') {
            firstPoint = { x: command.coords[0], y: command.coords[1] };
            break;
        }
    }

    if (!firstPoint) {return ''; }

    let initialPath: string = `M ${firstPoint.x} ${firstPoint.y} `;
    if (!isBorder) {
        initialPath += 'Z ';
    }

    if (isBorder) {
        let firstMoveFound: boolean = false;
        for (const command of commands) {
            if (command.type !== 'M') {
                continue;
            }
            if (!firstMoveFound) {
                firstMoveFound = true;
                continue;
            }
            initialPath += `M ${command.coords[0]} ${command.coords[1]} `;
            break;
        }
    }

    return initialPath.trim();
}

/**
 * Spline Range Area Renderer
 */
const SplineRangeAreaSeriesRenderer: RangeAreaSeriesRendererType = {
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState | AreaSeriesAnimateState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties
    ): {
        strokeDasharray: string | number;
        strokeDashoffset: number;
        interpolatedD?: string;
        animatedClipPath?: string;
    } => {
        const { isInitialRenderRef, renderedPathDRef, animationProgress } = animationState;

        if (!renderedPathDRef.current) {
            (renderedPathDRef as React.RefObject<Record<string, string>>).current = {};
        }

        const pathD: string = (pathOptions.d as string) || '';
        const id: string = pathOptions.id ? pathOptions.id.toString() : '';
        const isBorder: boolean = id.includes('_border_');

        const idParts: string[] = id.split('_');
        const seriesIndexStr: string = idParts.length > 0 ? idParts[idParts.length - 1] : '0';
        const seriesIndex: number = parseInt(seriesIndexStr, 10);
        const storedKey: string = `${isBorder ? 'border' : 'area'}_${seriesIndex}`;

        if (enableAnimation && pathD) {
            const isInitial: boolean = isInitialRenderRef.current[index as number];

            // Initial animation via clip path (unchanged)
            if (isInitial) {
                const bounds: { minX: number; maxX: number; minY: number; maxY: number; } = getPathBounds(pathD);
                const hasBounds: boolean =
                    bounds.minX !== 0 || bounds.maxX !== 0 || bounds.minY !== 0 || bounds.maxY !== 0;

                if (hasBounds) {
                    const isInverted: boolean = currentSeries.chart?.requireInvertedAxis ?? false;

                    if (!isInverted) {
                        const minX: number = Math.min(bounds.minX, bounds.maxX);
                        const maxX: number = Math.max(bounds.minX, bounds.maxX);
                        const range: number = maxX - minX;
                        const visibleWidth: number = Math.max(0, range * animationProgress);
                        const isXAxisInverse: boolean = currentSeries?.xAxis?.isAxisInverse ?? false;
                        const clipPathString: string = isXAxisInverse
                            ? `inset(0 0 0 ${Math.max(0, range - visibleWidth)}px)`
                            : `inset(0 ${Math.max(0, range - visibleWidth)}px 0 0)`;

                        if (animationProgress >= 1) {
                            isInitialRenderRef.current[index as number] = false;
                            (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                        }

                        return {
                            strokeDasharray: isBorder ? (pathOptions.dashArray ?? 'none') : 'none',
                            strokeDashoffset: 0,
                            animatedClipPath: clipPathString
                        };
                    } else {
                        const minY: number = Math.min(bounds.minY, bounds.maxY);
                        const maxY: number = Math.max(bounds.minY, bounds.maxY);
                        const range: number = maxY - minY;
                        const visibleHeight: number = Math.max(0, range * animationProgress);
                        const clipPathString: string = `inset(${Math.max(0, range - visibleHeight)}px 0 0 0)`;

                        if (animationProgress >= 1) {
                            isInitialRenderRef.current[index as number] = false;
                            (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                        }

                        return {
                            strokeDasharray: isBorder ? (pathOptions.dashArray ?? 'none') : 'none',
                            strokeDashoffset: 0,
                            animatedClipPath: clipPathString
                        };
                    }
                }

                // Fallback to path morphing if clip-path is not applicable
                const initialPath: string = generateInitialPath(pathD, isBorder, currentSeries.chart?.requireInvertedAxis ?? false);
                const interpolatedD: string = isBorder
                    ? interpolateSplineRangeBorderPath(initialPath, pathD, animationProgress)
                    : interpolateSplineRangeAreaPath(initialPath, pathD, animationProgress);

                if (animationProgress >= 1) {
                    isInitialRenderRef.current[index as number] = false;
                    (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                }

                return {
                    strokeDasharray: isBorder ? (pathOptions.dashArray ?? 'none') : 'none',
                    strokeDashoffset: 0,
                    interpolatedD
                };
            }

            if (isBorder) {
                if (animationProgress >= 1) {
                    (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                }
                return {
                    strokeDasharray: pathOptions.dashArray ?? 'none',
                    strokeDashoffset: 0
                };
            }

            if (animationProgress >= 1) {
                (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
            }
        }

        return {
            strokeDasharray: isBorder ? (pathOptions.dashArray ?? 'none') : 'none',
            strokeDashoffset: 0
        };
    },

    render: (series: SeriesProperties, isInverted: boolean): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
        const getCoordinate: Function = getPoint;
        const borderWidth: number = (series.border?.width as number) || 0;
        const borderColor: string = series.border?.color ? series.border.color : series.interior;

        // Fallback to series.dashArray if border.dashArray not set
        const borderDashArray: string = (series.border?.dashArray as string) || (series.dashArray as string) || 'none';

        const emptyPointMode: string = series.emptyPointSettings?.mode as string;
        const skipLabelForEmptyPoint: boolean = !(emptyPointMode === 'Average' || emptyPointMode === 'Zero');

        const visiblePoints: Points[] = (LineBase as LineBaseReturnType).enableComplexProperty(series);

        // Allow null for skipped points
        const lowPoints: (ChartLocationProps | null)[] = new Array(visiblePoints.length);
        const highPoints: (ChartLocationProps | null)[] = new Array(visiblePoints.length);

        let fillPath: string = '';
        let borderPath: string = '';
        let currentLowSegment: ChartLocationProps[] = [];
        let currentHighSegment: ChartLocationProps[] = [];

        for (let i: number = 0; i < visiblePoints.length; i++) {
            const point: Points = visiblePoints[i as number];

            if (!Array.isArray(point.symbolLocations)) { point.symbolLocations = []; }
            if (!Array.isArray(point.regions)) { point.regions = []; }

            const usable: boolean = point.visible && point.xValue != null;

            if (!usable) {
                // Close prior segment if open before skipping
                if (currentLowSegment.length > 0) {
                    // Inline segment generation for fill
                    const segLen: number = currentLowSegment.length;
                    if (segLen === 1) {
                        const low : ChartLocationProps = currentLowSegment[0];
                        const high : ChartLocationProps = currentHighSegment[0];
                        fillPath += `M ${low.x} ${low.y} L ${high.x} ${high.y} Z `;
                    } else {
                        const highPath: string = splinePath(currentHighSegment);
                        const lowPathBackward: string = splinePath(currentLowSegment.slice().reverse());

                        const highCurveSegment: string = highPath.replace(/^M\s+[^\s]+\s+[^\s]+\s+/, '');
                        const lowCurveSegment: string = lowPathBackward.replace(/^M\s+[^\s]+\s+[^\s]+\s+/, '');

                        const startLow: ChartLocationProps = currentLowSegment[0];
                        const startHigh: ChartLocationProps = currentHighSegment[0];
                        const endLow: ChartLocationProps = currentLowSegment[segLen - 1];

                        fillPath += `M ${startLow.x} ${startLow.y} L ${startHigh.x} ${startHigh.y} ` + highCurveSegment + `L ${endLow.x} ${endLow.y} ` + lowCurveSegment + 'Z ';
                    }

                    // Inline segment generation for border
                    if (borderWidth > 0) {
                        if (segLen === 1) {
                            const low: ChartLocationProps = currentLowSegment[0];
                            const high: ChartLocationProps = currentHighSegment[0];
                            borderPath += `M ${low.x} ${low.y} L ${high.x} ${high.y} `;
                        } else {
                            const lowPath: string = splinePath(currentLowSegment);
                            const highPathFull: string = splinePath(currentHighSegment);
                            borderPath += lowPath + ' ' + highPathFull + ' ';
                        }
                    }

                    currentLowSegment = [];
                    currentHighSegment = [];
                }
                lowPoints[i as number] = null;
                highPoints[i as number] = null;
                continue;
            }

            let lowValue: number = Math.min(point.low as number, point.high as number);
            let highValue: number = Math.max(point.low as number, point.high as number);
            if (series.yAxis?.isAxisInverse) {
                const temp: number = lowValue; lowValue = highValue; highValue = temp;
            }

            const lowPoint: ChartLocationProps = getCoordinate(point.xValue, lowValue, series.xAxis, series.yAxis, isInverted, series);
            const highPoint: ChartLocationProps = getCoordinate(point.xValue, highValue, series.xAxis, series.yAxis, isInverted, series);

            const isGetEmptyPoint: boolean = point.isEmpty === true;
            point.symbolLocations.length = 0;

            if (!(isGetEmptyPoint && skipLabelForEmptyPoint)) {
                point.symbolLocations.push(highPoint);
                point.symbolLocations.push(lowPoint);
            }

            // Collect for current segment
            currentLowSegment.push(lowPoint);
            currentHighSegment.push(highPoint);

            lowPoints[i as number] = lowPoint;
            highPoints[i as number] = highPoint;

            const markerWidth: number = (series.marker?.width as number) || 0;
            const width: number = Math.max(Math.abs(highPoint.x - lowPoint.x), markerWidth);
            const height: number = Math.max(Math.abs(highPoint.y - lowPoint.y), markerWidth);
            const regionX: number = Math.min(lowPoint.x, highPoint.x) - (!isInverted ? markerWidth / 2 : 0);
            const regionY: number = Math.min(lowPoint.y, highPoint.y) - (isInverted ? markerWidth / 2 : 0);

            point.regions.length = 0;
            point.regions.push({ x: regionX, y: regionY, width: width, height: height });

            // Safety assignments
            if (point.text == null) {
                point.text = '';
            }
            if (point.yValue == null && typeof point.low === 'number' && typeof point.high === 'number') {
                point.yValue = (point.low + point.high) / 2;
            }

            const savedLocations: ChartLocationProps[] = point.symbolLocations.slice();
            (lineBaseInstance as LineBaseReturnType).storePointLocation(point, series, isInverted, getCoordinate);
            point.symbolLocations = savedLocations;

            // Check if next is not usable to close segment
            const nextUsable: boolean = (i + 1 < visiblePoints.length) && visiblePoints[i + 1].visible
            && visiblePoints[i + 1].xValue != null;
            if (!nextUsable) {
                // Inline segment generation for fill
                const segLen: number = currentLowSegment.length;
                if (segLen === 1) {
                    const low: ChartLocationProps = currentLowSegment[0];
                    const high: ChartLocationProps = currentHighSegment[0];
                    fillPath += `M ${low.x} ${low.y} L ${high.x} ${high.y} Z `;
                } else {
                    const highPath: string = splinePath(currentHighSegment);
                    const lowPathBackward: string = splinePath(currentLowSegment.slice().reverse());

                    const highCurveSegment: string = highPath.replace(/^M\s+[^\s]+\s+[^\s]+\s+/, '');
                    const lowCurveSegment: string = lowPathBackward.replace(/^M\s+[^\s]+\s+[^\s]+\s+/, '');

                    const startLow: ChartLocationProps = currentLowSegment[0];
                    const startHigh: ChartLocationProps = currentHighSegment[0];
                    const endLow: ChartLocationProps = currentLowSegment[segLen - 1];

                    fillPath += `M ${startLow.x} ${startLow.y} L ${startHigh.x} ${startHigh.y} ` + highCurveSegment + `L ${endLow.x} ${endLow.y} ` + lowCurveSegment + 'Z ';
                }

                if (borderWidth > 0) {
                    if (segLen === 1) {
                        const low: ChartLocationProps = currentLowSegment[0];
                        const high: ChartLocationProps = currentHighSegment[0];
                        borderPath += `M ${low.x} ${low.y} L ${high.x} ${high.y} `;
                    } else {
                        const lowPath: string = splinePath(currentLowSegment);
                        const highPathFull: string = splinePath(currentHighSegment);
                        borderPath += lowPath + ' ' + highPathFull + ' ';
                    }
                }

                currentLowSegment = [];
                currentHighSegment = [];
            }
        }

        series.visiblePoints = visiblePoints;

        const renderOptions: RenderOptions[] = [];

        renderOptions.push({
            id: `${series.chart.element.id}_Series_${series.index}`,
            fill: series.interior,
            strokeWidth: 0,
            stroke: 'transparent',
            opacity: series.opacity,
            dashArray: borderDashArray,
            d: fillPath.trim()
        });

        if (borderWidth !== 0 && borderPath.trim()) {
            renderOptions.push({
                id: `${series.chart.element.id}_Series_border_${series.index}`,
                fill: 'transparent',
                strokeWidth: borderWidth,
                stroke: borderColor,
                opacity: 1,
                dashArray: borderDashArray,
                d: borderPath.trim()
            });
        }

        const originalAnimate: boolean = series.animation?.enable ?? true;
        series.skipMarkerAnimation = true;

        if (series.animation) {
            series.animation.enable = false;
        }

        const marker: ChartMarkerProps | null = series.marker?.visible
            ? (MarkerRenderer.render(series) as ChartMarkerProps)
            : null;

        if (series.animation) {
            series.animation.enable = originalAnimate;
        }

        return marker ? { options: renderOptions, marker } : renderOptions;
    }
};
export const { doAnimation } = SplineRangeAreaSeriesRenderer;

export default SplineRangeAreaSeriesRenderer;
