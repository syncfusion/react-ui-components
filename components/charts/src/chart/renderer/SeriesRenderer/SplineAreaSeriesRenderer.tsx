import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { PathCommand } from '../../common/base';
import { getPoint, withInRange } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import { interpolatePathD, parsePathCommands } from './SeriesAnimation';
import MarkerRenderer from './MarkerRenderer';
import { CommandValues, ControlPoints, Points, RenderOptions, SeriesProperties, SplineAreaSeriesAnimateState, SplineAreaSeriesInterface } from '../../chart-area/chart-interfaces';
import SplineSeriesRenderer from './SplineSeriesRenderer';

const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * Implementation of the spline area series renderer for smooth curved area charts.
 * This renderer creates area charts with cubic Bezier spline interpolation between data points,
 * providing visually appealing smooth curves instead of straight line segments.
 * Supports filled areas with optional borders, animations, and marker integration.
 */
const SplineAreaSeriesRenderer: SplineAreaSeriesInterface = {

    naturalSplineCoefficients: (points: Points[]): number[] => {
        // Use the same natural spline calculation as SplineSeriesRenderer
        return SplineSeriesRenderer.naturalSplineCoefficients(points);
    },

    getControlPoints: (point1: Points, point2: Points, ySpline1: number, ySpline2: number, series?: SeriesProperties): ControlPoints => {
        // Use the same control point calculation as SplineSeriesRenderer
        return SplineSeriesRenderer.getControlPoints(point1, point2, ySpline1, ySpline2, series as SeriesProperties);
    },

    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: {
            previousPathLengthRef: React.RefObject<number[]>;
            isInitialRenderRef: React.RefObject<boolean[]>;
            renderedPathDRef: React.RefObject<string[]>;
            animationProgress: number;
            isFirstRenderRef: React.RefObject<boolean>;
            previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
        } | SplineAreaSeriesAnimateState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties
    ) => {
        // Extract animation state
        const { isInitialRenderRef, renderedPathDRef, animationProgress } = animationState;
        const isInitial: boolean = isInitialRenderRef.current[index as number];

        // Get path data
        const pathD: string = pathOptions.d as string;
        const match: RegExpMatchArray | null = pathOptions.id ?
            pathOptions.id.toString().match(/Series_(?:border_)?(\d+)/) : null;
        const seriesIndex: number = match ? parseInt(match[1], 10) : 0;

        // Check if this is a border path
        const isBorder: boolean = pathOptions.id?.toString().indexOf('border') > -1;
        const storedKey: string = `${isBorder ? 'border' : 'area'}_${seriesIndex}`;
        const pathDataRef: React.RefObject<Record<string, string>> = renderedPathDRef as React.RefObject<Record<string, string>>;
        // Ensure we have the proper storage object
        if (!pathDataRef.current) {
            pathDataRef.current = {};
        }

        if (enableAnimation) {
            // For initial render animation
            if (isInitial) {
                if (animationProgress === 1) {
                    isInitialRenderRef.current[index as number] = false;
                    pathDataRef.current[storedKey as string] = pathD;
                }

                const sharedRangeKey: string = `animRange_${seriesIndex}`;

                let minX: number; let maxX: number; let range: number;

                interface CachedRange {
                    minX: number;
                    maxX: number;
                    range: number;
                }
                // Get chart properties from series
                const isInverted: boolean = currentSeries.chart?.requireInvertedAxis;
                const isXAxisInverse: boolean = currentSeries.xAxis?.isAxisInverse;
                const isYAxisInverse: boolean = currentSeries.yAxis?.isAxisInverse;
                // If this is a border path, try to use the cached range from area path
                if (isBorder && pathDataRef.current[sharedRangeKey as string]) {
                    const cachedRange: CachedRange = JSON.parse(
                        pathDataRef.current[sharedRangeKey as string]);
                    minX = cachedRange.minX;
                    maxX = cachedRange.maxX;
                    range = cachedRange.range;
                } else {
                    // Calculate range (this will be the area path on first call)
                    const commands: PathCommand[] = parsePathCommands(pathD);
                    const xCoords: number[] = commands
                        .filter((cmd: PathCommand) => cmd.type !== 'Z' && cmd.params && cmd.params.length >= 2)
                        .map((cmd: PathCommand) => cmd.params[0]);

                    if (xCoords.length === 0) {
                        return {
                            strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                            strokeDashoffset: 0
                        };
                    }

                    minX = Math.min(...xCoords);
                    maxX = Math.max(...xCoords);
                    if (!isInverted) {
                        // Normal orientation - use X coordinates
                        const xCoordinates: number[] = xCoords.map((coord: number) => coord);
                        minX = Math.min(...xCoordinates);
                        maxX = Math.max(...xCoordinates);
                    } else {
                        const yCoords: number[] = commands
                            .filter((cmd: PathCommand) => cmd.type !== 'Z' && cmd.params && cmd.params.length >= 2)
                            .map((cmd: PathCommand) => cmd.params[1]); // Get Y coordinates for transposed mode

                        if (yCoords.length === 0) {
                            return {
                                strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                                strokeDashoffset: 0
                            };
                        }

                        minX = Math.min(...yCoords);
                        maxX = Math.max(...yCoords);
                    }
                    range = maxX - minX;

                    // **Cache the range for border path to use**
                    if (!isBorder) {  // Only cache when processing area path
                        pathDataRef.current[sharedRangeKey as string] = JSON.stringify({
                            minX, maxX, range,
                            isInverted,
                            isXAxisInverse,
                            isYAxisInverse
                        });
                    }
                }

                // Create animated clip path based on progress
                let clipPathStr: string = '';

                // Create animated clip path based on progress and axis configuration
                if (!isInverted) {
                    // Normal orientation - clip horizontally based on X values
                    if (isXAxisInverse) {
                        // X-axis is inverted - clip from right to left
                        const animWidth: number = range * animationProgress;
                        clipPathStr = `inset(0 0 0 ${range - animWidth}px)`;
                    } else {
                        // X-axis is normal - clip from left to right
                        const animWidth: number = range * animationProgress;
                        clipPathStr = `inset(0 ${range - animWidth}px 0 0)`;
                    }
                } else {
                    const animHeight: number = range * animationProgress;
                    if (isYAxisInverse) {
                        // Y-axis is inverted - clip from top to bottom
                        clipPathStr = `inset(${Math.max(0, range - animHeight)}px 0 0 0)`;
                    } else {
                        // Y-axis is normal - clip from bottom to top
                        clipPathStr = `inset(${Math.max(0, range - animHeight)}px 0 0 0)`;
                    }
                }

                return {
                    strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                    strokeDashoffset: 0,
                    animatedClipPath: clipPathStr
                };
            }
            // For path animation during updates
            else if (pathD) {
                const storedD: string = pathDataRef.current[storedKey as string];

                if (storedD && pathD !== storedD) {
                    // Use different interpolation methods based on whether it's a border or area
                    const startPathCommands: string[] = storedD.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) as string[];
                    const endPathCommands: string[] = (pathD).match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) as string[];
                    const maxLength: number = Math.max(startPathCommands.length, endPathCommands.length);
                    const minLength: number = Math.min(startPathCommands.length, endPathCommands.length);
                    let endPath: string = pathD;
                    if (startPathCommands.length > endPathCommands.length) {
                        for (let i: number = minLength; i < maxLength; i++) {
                            if (endPathCommands.length !== startPathCommands.length) {
                                let firstPointBeforeCurve: string;
                                if (currentSeries.removedPointIndex === currentSeries.points.length) {
                                    if ((startPathCommands[startPathCommands.length - 1]).split(' ').length === 4 && isBorder) {
                                        firstPointBeforeCurve = endPathCommands[endPathCommands.length - (isBorder ? 1 : 2)].split(' ').slice(1).join(' ');
                                    }
                                    else {
                                        firstPointBeforeCurve = endPathCommands[endPathCommands.length - (isBorder ? 1 : 2)].split(' ').slice(5).join(' ');
                                    }
                                    const curveCommand: string = 'C ' + firstPointBeforeCurve + firstPointBeforeCurve + firstPointBeforeCurve;
                                    if (isBorder) {
                                        endPathCommands.push(curveCommand);
                                    }
                                    else {
                                        endPathCommands.splice(endPathCommands.length - 1, 0, curveCommand);
                                    }
                                } else {
                                    if ((startPathCommands[startPathCommands.length - 1]).split(' ').length === 4) {
                                        firstPointBeforeCurve = 'C ' + endPathCommands[isBorder ? 0 : 1].split(' ').slice(-3).join(' ') + endPathCommands[isBorder ? 0 : 1].split(' ').slice(1).join(' ') + endPathCommands[isBorder ? 0 : 1].split(' ').slice(1).join(' ');
                                    }
                                    else {
                                        firstPointBeforeCurve = 'C ' + endPathCommands[isBorder ? 0 : 1].split(' ').slice(-3).join(' ') + endPathCommands[isBorder ? 0 : 1].split(' ').slice(-3).join(' ') + endPathCommands[isBorder ? 0 : 1].split(' ').slice(-3).join(' ');
                                    }
                                    endPathCommands.splice((isBorder ? 1 : 2), 0, firstPointBeforeCurve);
                                }
                            }
                        }
                        endPath = endPathCommands.join('');
                    }

                    const interpolatedD: string = isBorder ?
                        interpolateSplineBorderPath(storedD, endPath, animationProgress) :
                        interpolateSplineAreaPath(storedD, endPath, animationProgress);

                    if (animationProgress === 1) {
                        pathDataRef.current[storedKey as string] = pathD;
                    }

                    return {
                        strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                        strokeDashoffset: 0,
                        interpolatedD
                    };
                }
            }

            // Always store path when animation is complete
            if (animationProgress === 1) {
                pathDataRef.current[storedKey as string] = pathD;

                const sharedRangeKey: string = `animRange_${seriesIndex}`;
                if (pathDataRef.current[sharedRangeKey as string]) {
                    delete (pathDataRef).current[sharedRangeKey as string];
                }
            }
        }

        return {
            strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
            strokeDashoffset: 0
        };
    },

    render: (series: SeriesProperties, isInverted: boolean ):
    RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
        if (!series || !series.points || series.points.length < 1) {
            return [];
        }
        let firstPoint: Points | null = null;
        let direction: string = '';
        let topLine: string = '';
        let startPoint: ChartLocationProps | null = null;
        let pt2: ChartLocationProps = { x: 0, y: 0 };
        let bpt1: ChartLocationProps = { x: 0, y: 0 };
        let bpt2: ChartLocationProps = { x: 0, y: 0 };
        let controlPt1: ChartLocationProps;
        let controlPt2: ChartLocationProps;
        const points: Points[] = [];
        let point: Points;
        let pointIndex: number = 0;
        let hasPoints: boolean = false;
        const isDropMode: boolean = (series.emptyPointSettings && series.emptyPointSettings.mode === 'Drop') as boolean;
        const segmentStartIndices: number[] = [];
        const segmentBaselinePoints: ChartLocationProps[] = [];

        const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series);

        for (let i: number = 0; i < visiblePoints.length; i++) {
            point = visiblePoints[i as number];
            if (point.xValue === null) {
                continue;
            } else {
                point.index = pointIndex;
                pointIndex++;
                points.push(point);
            }
        }

        series.visiblePoints = visiblePoints;

        const pointsLength: number = points.length;
        let previous: number;
        const getCoordinate: Function = getPoint;
        const origin: number = Math.max(series.yAxis.visibleRange.minimum, 0);

        const splineCoefficients: number[] = SplineSeriesRenderer.findSplineCoefficients(points, series);

        if (!series.drawPoints) {
            series.drawPoints = [];
        }

        for (let i: number = 1; i < pointsLength; i++) {
            const controlPoints: ControlPoints = SplineAreaSeriesRenderer.getControlPoints(
                points[i - 1],
                points[i as number],
                splineCoefficients[i - 1] || 0,
                splineCoefficients[i as number] || 0,
                series
            );
            series.drawPoints[i - 1] = controlPoints;
        }

        const startNewSegment: (index: number) => void = (index: number): void => {
            segmentStartIndices.push(index);
            const baselinePoint: ChartLocationProps = getCoordinate(
                points[index as number].xValue, origin, series.xAxis, series.yAxis, isInverted, series);
            segmentBaselinePoints.push(baselinePoint);

            startPoint = baselinePoint;
            direction += ('M ' + baselinePoint.x + ' ' + baselinePoint.y + ' ');

            const dataPoint: ChartLocationProps = getCoordinate(
                points[index as number].xValue, points[index as number].yValue, series.xAxis, series.yAxis, isInverted, series);
            direction += ('L ' + dataPoint.x + ' ' + dataPoint.y + ' ');
            topLine += ('M ' + dataPoint.x + ' ' + dataPoint.y + ' ');
        };

        const closeSegment: (index: number) => void = (index: number): void => {
            if (!startPoint) { return; }

            const segmentIndex: number = segmentStartIndices.length - 1;
            if (segmentIndex < 0) { return; }

            const baselinePoint: ChartLocationProps = segmentBaselinePoints[segmentIndex as number];

            const currentBaselinePoint: ChartLocationProps = getCoordinate(
                points[index as number].xValue, origin, series.xAxis, series.yAxis, isInverted, series);

            direction = direction.concat('L ' + currentBaselinePoint.x + ' ' + currentBaselinePoint.y + ' ');

            direction = direction.concat('L ' + baselinePoint.x + ' ' + baselinePoint.y + ' ');
        };

        for (let i: number = 0; i < pointsLength; i++) {
            point = points[i as number];
            point.symbolLocations = [];
            point.regions = [];
            previous = i > 0 ? i - 1 : 0;

            if (
                point.visible &&
                (i === 0 || withInRange(points[previous as number], point, points[i < pointsLength - 1 ? i + 1 : i], series))
            ) {
                hasPoints = true;

                if (firstPoint === null) {
                    startNewSegment(i);
                } else {
                    if (
                        isDropMode &&
                        previous < i &&
                        !points[previous as number].visible
                    ) {
                        controlPt1 = series.drawPoints[previous - 1]?.controlPoint1 ?? firstPoint;
                        controlPt2 = series.drawPoints[previous - 1]?.controlPoint2 ?? firstPoint;
                    } else {
                        controlPt1 = series.drawPoints[previous as number].controlPoint1;
                        controlPt2 = series.drawPoints[previous as number].controlPoint2;
                    }
                    pt2 = getCoordinate(point.xValue, point.yValue, series.xAxis, series.yAxis, isInverted, series);
                    bpt1 = getCoordinate(controlPt1.x, controlPt1.y, series.xAxis, series.yAxis, isInverted, series);
                    bpt2 = getCoordinate(controlPt2.x, controlPt2.y, series.xAxis, series.yAxis, isInverted, series);

                    const curveCommand: string = 'C ' + bpt1.x + ' ' + bpt1.y + ' ' + bpt2.x + ' ' + bpt2.y + ' ' + pt2.x + ' ' + pt2.y + ' ';
                    direction = direction.concat(curveCommand);
                    topLine = topLine.concat(curveCommand);
                }

                lineBaseInstance.storePointLocation(point, series, isInverted, getCoordinate);
                firstPoint = point;
            } else {
                if (!isDropMode && firstPoint) {
                    closeSegment(previous);
                    firstPoint = null;
                }
                point.symbolLocations = [];
            }
        }

        if (firstPoint && hasPoints) {
            closeSegment(pointsLength - 1);
        }

        const name: string = series.chart.element.id + '_Series_' + series.index;
        const options: RenderOptions[] = [{
            id: name,
            fill: series.interior,
            strokeWidth: 0,
            stroke: 'transparent',
            opacity: series.opacity,
            dashArray: series.dashArray,
            d: direction
        }];

        if (series.border && series.border.width && series.border.width > 0) {
            const borderName: string = series.chart.element.id + '_Series_border_' + series.index;
            const borderOptions: RenderOptions = {
                id: borderName,
                fill: 'transparent',
                strokeWidth: series.border.width,
                stroke: series.border.color ? series.border.color : series.interior,
                opacity: 1,
                dashArray: series.border.dashArray,
                d: topLine.trim()
            };
            options.push(borderOptions);
        }

        const marker: Object | null = series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
        return marker ? { options, marker } : options;
    }
};

export default SplineAreaSeriesRenderer;

/**
 * Specialized interpolation for spline area paths with proper animation
 * for point additions and removals
 *
 * @param {string} startD - Starting path data
 * @param {string} endD - Ending path data
 * @param {number} progress - Animation progress (0-1)
 * @returns {string} Interpolated path
 * @private
 */
export function interpolateSplineAreaPath(startD: string, endD: string, progress: number): string {
    if (!startD || !endD) {
        return endD || startD || '';
    }

    try {
        // Parse the path data using the built-in function to avoid type errors
        const startCommands: PathCommand[] = parsePathCommands(startD);
        const endCommands: PathCommand[] = parsePathCommands(endD);

        // Convert to a more usable format with proper type safety
        const convertCommand: (cmd: PathCommand) => CommandValues = (cmd: PathCommand): CommandValues => {
            if (cmd.type === 'M' || cmd.type === 'L') {
                return {
                    type: cmd.type,
                    x: cmd.params[0],
                    y: cmd.params[1]
                };
            } else if (cmd.type === 'C') {
                return {
                    type: cmd.type,
                    cx1: cmd.params[0],
                    cy1: cmd.params[1],
                    cx2: cmd.params[2],
                    cy2: cmd.params[3],
                    x: cmd.params[4],
                    y: cmd.params[5]
                };
            }
            return { type: cmd.type, x: 0, y: 0 };
        };

        const startCmds: CommandValues[] = startCommands.map(convertCommand);
        const endCmds: CommandValues[] = endCommands.map(convertCommand);

        // Find baseline and closing segments
        const findBaselineSegments: (cmds: CommandValues[]) => {
            baselineY: number;
            dataPoints: CommandValues[];
            closingPoints: CommandValues[];
        } = (cmds: CommandValues[]) => {
            // First command is the baseline starting point
            const baselineStart: CommandValues = cmds[0];

            // Find where the path returns to baseline
            // Fix: Remove the unused closingIndex variable to fix the linter error
            let lastDataPointIndex: number = cmds.length - 1;

            // Work backwards to find where the path drops back to baseline
            for (let i: number = cmds.length - 2; i > 1; i--) {
                const cmd: CommandValues = cmds[i as number];
                const nextCmd: CommandValues = cmds[i + 1];

                // The drop to baseline is identified by a sharp vertical line
                if (nextCmd.type === 'L' && cmd.y !== nextCmd.y &&
                    Math.abs(nextCmd.y - baselineStart.y) < 2 &&
                    Math.abs(cmd.x - nextCmd.x) < 2) {
                    lastDataPointIndex = i;
                    break;
                }
            }

            return {
                baselineY: baselineStart.y,
                dataPoints: cmds.slice(1, lastDataPointIndex + 1),
                closingPoints: cmds.slice(lastDataPointIndex + 1)
            };
        };

        // Analyze both paths
        const startPath: {
            baselineY: number; dataPoints: CommandValues[]; closingPoints: CommandValues[];
        } = findBaselineSegments(startCmds);
        const endPath: {
            baselineY: number; dataPoints: CommandValues[]; closingPoints: CommandValues[];
        } = findBaselineSegments(endCmds);

        // Detect if points were added or removed
        const pointAdded: boolean = endPath.dataPoints.length > startPath.dataPoints.length;
        const pointRemoved: boolean = startPath.dataPoints.length > endPath.dataPoints.length;

        // Start building result path
        let result: string = '';

        // Baseline start (M command)
        const startM: CommandValues = startCmds[0];
        const endM: CommandValues = endCmds[0];
        result += `M ${startM.x + (endM.x - startM.x) * progress} ${startM.y + (endM.y - startM.y) * progress} `;

        // First data point (L command)
        if (startPath.dataPoints.length > 0 && endPath.dataPoints.length > 0) {
            const startFirstPoint: CommandValues = startPath.dataPoints[0];
            const endFirstPoint: CommandValues = endPath.dataPoints[0];

            result += `L ${startFirstPoint.x + (endFirstPoint.x - startFirstPoint.x) * progress} ${startFirstPoint.y + (endFirstPoint.y - startFirstPoint.y) * progress} `;
        }

        // Special handling for adding or removing points
        if (pointAdded) {
            // Handle existing points
            for (let i: number = 1; i < startPath.dataPoints.length; i++) {
                const startPoint: CommandValues = startPath.dataPoints[i as number];
                const endPoint: CommandValues = endPath.dataPoints[i as number];

                if (startPoint.type === 'C' && endPoint && endPoint.type === 'C') {
                    result += `C ${(startPoint.cx1 as number) + ((endPoint.cx1 as number) - (startPoint.cx1 as number)) * progress}
                     ${startPoint.cy1 as number + (endPoint.cy1 as number - (startPoint.cy1 as number)) * progress}
                      ${startPoint.cx2 as number + (endPoint.cx2 as number - (startPoint.cx2 as number)) * progress}
                       ${startPoint.cy2 as number + (endPoint.cy2 as number - (startPoint.cy2 as number)) * progress} 
                       ${startPoint.x + (endPoint.x - startPoint.x) * progress} 
                       ${startPoint.y + (endPoint.y - startPoint.y) * progress} `;
                }
            }

            // Animate new points growing from their nearest neighbor
            const lastExistingPoint: CommandValues = startPath.dataPoints[startPath.dataPoints.length - 1];

            for (let i: number = startPath.dataPoints.length; i < endPath.dataPoints.length; i++) {
                const newPoint: CommandValues = endPath.dataPoints[i as number];

                if (newPoint.type === 'C') {
                    // Animate from the last existing point
                    const sourceX: number = lastExistingPoint.x;
                    const sourceY: number = lastExistingPoint.y;

                    // Grow control points from source
                    result += `C ${sourceX + ((newPoint.cx1 as number) - sourceX) * progress}
                     ${sourceY + (newPoint.cy1 as number - sourceY) * progress}
                      ${sourceX + (newPoint.cx2 as number - sourceX) * progress}
                       ${sourceY + (newPoint.cy2 as number - sourceY) * progress}
                        ${sourceX + (newPoint.x - sourceX) * progress}
                         ${sourceY + (newPoint.y - sourceY) * progress} `;
                }
            }
        }
        else if (pointRemoved) {
            // Handle common points
            const minPoints: number = Math.min(startPath.dataPoints.length, endPath.dataPoints.length);

            for (let i: number = 1; i < minPoints; i++) {
                const startPoint: CommandValues = startPath.dataPoints[i as number];
                const endPoint: CommandValues = endPath.dataPoints[i as number];

                if (startPoint.type === 'C' && endPoint.type === 'C') {
                    result += `C ${startPoint.cx1 as number + (endPoint.cx1 as number - (startPoint.cx1 as number)) * progress} 
                    ${startPoint.cy1 as number + (endPoint.cy1 as number - (startPoint.cy1 as number)) * progress}
                     ${startPoint.cx2 as number + (endPoint.cx2 as number - (startPoint.cx2 as number)) * progress} 
                     ${startPoint.cy2 as number + (endPoint.cy2 as number - (startPoint.cy2 as number)) * progress}
                      ${startPoint.x + (endPoint.x - startPoint.x) * progress}
                       ${startPoint.y + (endPoint.y - startPoint.y) * progress} `;
                }
            }

            // Fix: Improve point removal animation by changing the fade calculation
            // Only add disappearing points when progress is not complete
            if (progress < 0.99) {  // Use 0.99 instead of 1 to avoid visual glitches at the end
                // Animate disappearing points shrinking toward a neighbor
                for (let i: number = minPoints; i < startPath.dataPoints.length; i++) {
                    const removedPoint: CommandValues = startPath.dataPoints[i as number];

                    // Target is the last common point
                    const targetPoint: CommandValues = endPath.dataPoints[endPath.dataPoints.length - 1];

                    if (removedPoint.type === 'C') {
                        // Calculate inverse progress for the shrinking effect
                        const fadeOutProgress: number = 1 - progress;

                        // Shrink control points toward target
                        result += `C ${targetPoint.x + (removedPoint.cx1 as number - targetPoint.x) * fadeOutProgress}
                         ${targetPoint.y + (removedPoint.cy1 as number - targetPoint.y) * fadeOutProgress}
                          ${targetPoint.x + (removedPoint.cx2 as number - targetPoint.x) * fadeOutProgress}
                           ${targetPoint.y + (removedPoint.cy2 as number - targetPoint.y) * fadeOutProgress}
                            ${targetPoint.x + (removedPoint.x - targetPoint.x) * fadeOutProgress}
                             ${targetPoint.y + (removedPoint.y - targetPoint.y) * fadeOutProgress} `;
                    }
                }
            }
        }
        else {
            // Normal path interpolation - handle all data points
            for (let i: number = 1; i < Math.min(startPath.dataPoints.length, endPath.dataPoints.length); i++) {
                const startPoint: CommandValues = startPath.dataPoints[i as number];
                const endPoint: CommandValues = endPath.dataPoints[i as number];

                if (startPoint.type === 'C' && endPoint.type === 'C') {
                    result += `C ${startPoint.cx1 as number + (endPoint.cx1 as number - (startPoint.cx1 as number)) * progress} 
                    ${(startPoint.cy1 as number) + (endPoint.cy1 as number - (startPoint.cy1 as number)) * progress}
                     ${(startPoint.cx2 as number) + (endPoint.cx2 as number - (startPoint.cx2 as number)) * progress}
                      ${(startPoint.cy2 as number) + (endPoint.cy2 as number - (startPoint.cy2 as number)) * progress}
                       ${startPoint.x + (endPoint.x - startPoint.x) * progress}
                        ${startPoint.y + (endPoint.y - startPoint.y) * progress} `;
                }
            }
        }

        // Get the final data point and calculate the transition to baseline
        let lastPoint: { x: number, y: number };

        if (pointAdded) {
            // For point addition, animate from the previous last point to the new last point
            const oldLastPoint: CommandValues = startPath.dataPoints[startPath.dataPoints.length - 1];
            const newLastPoint: CommandValues = endPath.dataPoints[endPath.dataPoints.length - 1];

            // Interpolate between the old last point and new last point
            lastPoint = {
                x: oldLastPoint.x + (newLastPoint.x - oldLastPoint.x) * progress,
                y: oldLastPoint.y + (newLastPoint.y - oldLastPoint.y) * progress
            };
        }
        else if (pointRemoved) {
            // For point removal, animate from the old last point to the new last point
            const oldLastPoint: CommandValues = startPath.dataPoints[startPath.dataPoints.length - 1];
            const newLastPoint: CommandValues = endPath.dataPoints[endPath.dataPoints.length - 1];

            // Fix: Calculate last point position better for removal animation
            const fadeOutProgress: number = 1 - progress;
            lastPoint = {
                x: newLastPoint.x + (oldLastPoint.x - newLastPoint.x) * fadeOutProgress,
                y: newLastPoint.y + (oldLastPoint.y - newLastPoint.y) * fadeOutProgress
            };
        }
        else {
            // Normal case - just interpolate the last points
            const oldLastPoint: CommandValues = startPath.dataPoints[startPath.dataPoints.length - 1];
            const newLastPoint: CommandValues = endPath.dataPoints[endPath.dataPoints.length - 1];

            lastPoint = {
                x: oldLastPoint.x + (newLastPoint.x - oldLastPoint.x) * progress,
                y: oldLastPoint.y + (newLastPoint.y - oldLastPoint.y) * progress
            };
        }

        // Interpolate baseline Y value
        const baselineY: number = startPath.baselineY + (endPath.baselineY - startPath.baselineY) * progress;

        // Add vertical line to baseline
        result += `L ${lastPoint.x} ${baselineY} `;

        // Add horizontal line back to start and close
        result += `L ${startM.x + (endM.x - startM.x) * progress} ${baselineY} Z`;

        return result;
    }
    catch (e) {
        // Fallback to standard interpolation on error
        return interpolatePathD(startD, endD, progress);
    }
}


/**
 * Interpolates between two SVG path `d` attribute strings based on the given progress.
 * This function is typically used for animating transitions between two spline border paths.
 *
 * @param {string} startD - The starting SVG path `d` string.
 * @param {string} endD - The ending SVG path `d` string.
 * @param {number} progress - A number between 0 and 1 indicating the interpolation progress.
 * @returns {string} - interploted path.
 * @private
 */
export function interpolateSplineBorderPath(startD: string, endD: string, progress: number): string {
    if (!startD || !endD) {
        return endD || startD || '';
    }

    try {
        // Parse the path data
        const startCommands: PathCommand[] = parsePathCommands(startD);
        const endCommands: PathCommand[] = parsePathCommands(endD);

        // Convert to a more usable format
        const convertCommand: (cmd: PathCommand) => CommandValues = (cmd: PathCommand): CommandValues => {
            if (cmd.type === 'M' || cmd.type === 'L') {
                return {
                    type: cmd.type,
                    x: cmd.params[0],
                    y: cmd.params[1]
                };
            } else if (cmd.type === 'C') {
                return {
                    type: cmd.type,
                    cx1: cmd.params[0],
                    cy1: cmd.params[1],
                    cx2: cmd.params[2],
                    cy2: cmd.params[3],
                    x: cmd.params[4],
                    y: cmd.params[5]
                };
            }
            return { type: cmd.type, x: 0, y: 0 };
        };

        const startCmds: CommandValues[] = startCommands.map(convertCommand);
        const endCmds: CommandValues[] = endCommands.map(convertCommand);

        // For border path, just count all data points (borders don't have closing sections)
        const startDataPoints: CommandValues[] = startCmds;
        const endDataPoints: CommandValues[] = endCmds;

        // Detect point addition or removal
        const pointAdded: boolean = endDataPoints.length > startDataPoints.length;
        const pointRemoved: boolean = startDataPoints.length > endDataPoints.length;

        // Build the result path
        let result: string = '';

        // First point (M command)
        if (startDataPoints.length > 0 && endDataPoints.length > 0) {
            const startFirstPoint: CommandValues = startDataPoints[0];
            const endFirstPoint: CommandValues = endDataPoints[0];

            result += `M ${startFirstPoint.x + (endFirstPoint.x - startFirstPoint.x) * progress} ${startFirstPoint.y + (endFirstPoint.y - startFirstPoint.y) * progress} `;
        }

        // Handle point addition
        if (pointAdded) {
            // Handle common points
            for (let i: number = 1; i < startDataPoints.length; i++) {
                const startPoint: CommandValues = startDataPoints[i as number];
                const endPoint: CommandValues = endDataPoints[i as number];

                if (startPoint.type === 'C' && endPoint && endPoint.type === 'C') {
                    result += `C ${(startPoint.cx1 as number) + ((endPoint.cx1 as number) - (startPoint.cx1 as number)) * progress} ${(startPoint.cy1 as number) +
                        ((endPoint.cy1 as number) - (startPoint.cy1 as number)) * progress} ${(startPoint.cx2 as number) + ((endPoint.cx2 as number) - (startPoint.cx2 as number)) * progress}
                          ${(startPoint.cy2 as number) + ((endPoint.cy2 as number) - (startPoint.cy2 as number)) * progress} ${startPoint.x + (endPoint.x - startPoint.x) * progress} ${startPoint.y + (endPoint.y - startPoint.y) * progress} `;
                }
            }

            // Animate new points growing from their nearest neighbor
            const lastExistingPoint: CommandValues = startDataPoints[startDataPoints.length - 1];

            for (let i: number = startDataPoints.length; i < endDataPoints.length; i++) {
                const newPoint: CommandValues = endDataPoints[i as number];

                if (newPoint.type === 'C') {
                    // Animate from the last existing point
                    const sourceX: number = lastExistingPoint.x;
                    const sourceY: number = lastExistingPoint.y;

                    // Grow control points from source
                    result += `C ${sourceX + ((newPoint.cx1 as number) - sourceX) * progress} ${sourceY +
                        ((newPoint.cy1 as number) - sourceY) * progress} ${sourceX + ((newPoint.cx2 as number) - sourceX) * progress} ${sourceY + ((newPoint.cy2 as number) - sourceY) * progress} ${sourceX + (newPoint.x - sourceX) * progress} ${sourceY + (newPoint.y - sourceY) * progress} `;
                }
            }
        }
        else if (pointRemoved) {
            // Handle common points
            const minPoints: number = Math.min(startDataPoints.length, endDataPoints.length);

            for (let i: number = 1; i < minPoints; i++) {
                const startPoint: CommandValues = startDataPoints[i as number];
                const endPoint: CommandValues = endDataPoints[i as number];

                if (startPoint.type === 'C' && endPoint && endPoint.type === 'C') {
                    result += `C ${(startPoint.cx1 as number) + ((endPoint.cx1 as number) - (startPoint.cx1 as number)) * progress} ${(startPoint.cy1 as number) +
                        ((endPoint.cy1 as number) - (startPoint.cy1 as number)) * progress} ${(startPoint.cx2 as number) +
                        ((endPoint.cx2 as number) - (startPoint.cx2 as number)) * progress} ${(startPoint.cy2 as number) +
                        ((endPoint.cy2 as number) - (startPoint.cy2 as number)) * progress} ${startPoint.x +
                        (endPoint.x - startPoint.x) * progress} ${startPoint.y + (endPoint.y - startPoint.y) * progress} `;
                }
            }

            // Only add disappearing points when progress is not complete
            if (progress < 0.99) { // Use 0.99 instead of 1 to avoid visual glitches
                // Animate disappearing points shrinking toward a neighbor
                const targetPoint: CommandValues = endDataPoints[endDataPoints.length - 1];

                for (let i: number = minPoints; i < startDataPoints.length; i++) {
                    const removedPoint: CommandValues = startDataPoints[i as number];

                    if (removedPoint.type === 'C') {
                        // Calculate fade out effect
                        const fadeOutProgress: number = 1 - progress;

                        // Shrink control points toward target point
                        result += `C ${targetPoint.x + ((removedPoint.cx1 as number) - targetPoint.x) * fadeOutProgress} ${targetPoint.y +
                            ((removedPoint.cy1 as number) - targetPoint.y) * fadeOutProgress} ${targetPoint.x +
                            ((removedPoint.cx2 as number) - targetPoint.x) * fadeOutProgress} ${targetPoint.y +
                            ((removedPoint.cy2 as number) - targetPoint.y) * fadeOutProgress} ${targetPoint.x + (removedPoint.x - targetPoint.x) * fadeOutProgress} ${targetPoint.y + (removedPoint.y - targetPoint.y) * fadeOutProgress} `;
                    }
                }
            }
        }
        else {
            // Normal interpolation
            for (let i: number = 1; i < Math.min(startDataPoints.length, endDataPoints.length); i++) {
                const startPoint: CommandValues = startDataPoints[i as number];
                const endPoint: CommandValues = endDataPoints[i as number];

                if (startPoint.type === 'C' && endPoint.type === 'C') {
                    result += `C ${(startPoint.cx1 as number) + ((endPoint.cx1 as number) - (startPoint.cx1 as number)) * progress} ${(startPoint.cy1 as number) +
                        ((endPoint.cy1 as number) - (startPoint.cy1 as number)) * progress} ${(startPoint.cx2 as number) +
                        ((endPoint.cx2 as number) - (startPoint.cx2 as number)) * progress} ${(startPoint.cy2 as number) + ((endPoint.cy2 as number) - (startPoint.cy2 as number)) * progress}
                              ${startPoint.x + (endPoint.x - startPoint.x) * progress} ${startPoint.y + (endPoint.y - startPoint.y) * progress} `;
                }
            }
        }

        return result.trim();
    }
    catch (e) {
        return interpolatePathD(startD, endD, progress);
    }
}
