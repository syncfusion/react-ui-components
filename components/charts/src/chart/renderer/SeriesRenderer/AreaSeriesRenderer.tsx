import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { AreaSeriesAnimateState, AreaSeriesRendererType, PathCommand, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { applyPointRenderCallback, getPoint } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import MarkerRenderer from './MarkerRenderer';
import { AnimationState, interpolatePathD } from './SeriesAnimation';

const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * Specialized path interpolation for area charts - handles both area fill and borders
 *
 * @param {string} startD - Starting path data
 * @param {string} endD - Ending path data
 * @param {number} progress - Animation progress (0-1)
 * @returns {string} Interpolated path data
 * @private
 */
export function interpolateAreaPath(startD: string, endD: string, progress: number): string {
    if (!startD || !endD) {
        return endD || startD || '';
    }

    // Split paths into commands
    const startCommands: PathCommand[] = parsePathCommands(startD);
    const endCommands: PathCommand[] = parsePathCommands(endD);

    // If formats don't match, use standard interpolation
    if (startCommands.length === 0 || endCommands.length === 0 ||
        startCommands[0].type !== endCommands[0].type) {
        return interpolatePathD(startD, endD, progress);
    }

    // Get baseline Y values from the first command
    const startBaselineY: number = startCommands[0].coords?.[1] ?? 0;
    const endBaselineY: number = endCommands[0].coords?.[1] ?? 0;

    // Identify where data points end and closing path begins
    const findLastDataPointIndex: (commands: PathCommand[]) => number = (commands: PathCommand[]): number => {
        // Last data point is typically followed by a drop to the baseline
        for (let i: number = commands.length - 3; i > 0; i--) {
            if (commands[i as number].type === 'L' && commands[i + 1].type === 'L') {
                // Check if this point is followed by a drop to baseline
                if (Math.abs(commands[i + 1].coords[0] - commands[i as number].coords[0]) < 0.1 &&
                    Math.abs(commands[i + 1].coords[1] - startBaselineY) < 1) {
                    return i;
                }
            }
        }

        // Fallback: assume all but the last 2 commands are data
        return Math.max(0, commands.length - 3);
    };

    // Find data point indices
    const startLastDataIndex: number = findLastDataPointIndex(startCommands);
    const endLastDataIndex: number = findLastDataPointIndex(endCommands);

    // Generate path with data points
    let result: string = '';

    // First point (M command)
    result += 'M ';
    result += `${startCommands[0].coords[0] + (endCommands[0].coords[0] - startCommands[0].coords[0]) * progress} `;
    result += `${startCommands[0].coords[1] + (endCommands[0].coords[1] - startCommands[0].coords[1]) * progress} `;

    // Data points
    for (let i: number = 1; i <= Math.max(startLastDataIndex, endLastDataIndex); i++) {
        const startIdx: number = Math.min(i, startLastDataIndex);
        const endIdx: number = Math.min(i, endLastDataIndex);

        const startCmd: PathCommand = startCommands[startIdx as number];
        const endCmd: PathCommand = endCommands[endIdx as number];

        result += 'L ';

        // Important: Ensure proper last point animation by using actual corresponding points
        const x: number = startCmd.coords[0] + (endCmd.coords[0] - startCmd.coords[0]) * progress;
        const y: number = startCmd.coords[1] + (endCmd.coords[1] - startCmd.coords[1]) * progress;
        result += `${x} ${y} `;
    }

    // Closing points - get last data point coordinates
    const lastStartData: PathCommand = startCommands[startLastDataIndex as number];
    const lastEndData: PathCommand = endCommands[endLastDataIndex as number];

    // Calculate interpolated values for the last point
    const lastX: number = lastStartData.coords[0] + (lastEndData.coords[0] - lastStartData.coords[0]) * progress;
    //const lastY = lastStartData.coords[1] + (lastEndData.coords[1] - lastStartData.coords[1]) * progress;

    // Interpolate baseline
    const interpolatedBaselineY: number = startBaselineY + (endBaselineY - startBaselineY) * progress;

    // First command coordinates (for closing)
    const firstX: number = startCommands[0].coords[0] + (endCommands[0].coords[0] - startCommands[0].coords[0]) * progress;

    // Add vertical line down to baseline
    result += `L ${lastX} ${interpolatedBaselineY} `;

    // Add horizontal line to start X
    result += `L ${firstX} ${interpolatedBaselineY} `;

    // Close path back to start point
    result += `L ${firstX} ${startCommands[0].coords[1] + (endCommands[0].coords[1] - startCommands[0].coords[1]) * progress} `;

    return result;
}

/**
 * Specialized interpolation for the border path of area charts
 * Just handles the top line without closing the path
 *
 * @param {string} startD - Starting border path data
 * @param {string} endD - Ending border path data
 * @param {number} progress - Animation progress (0-1)
 * @returns {string} Interpolated border path
 * @private
 */
export function interpolateBorderPath(startD: string, endD: string, progress: number): string {
    if (!startD || !endD) {
        return endD || startD || '';
    }

    // Parse commands from both paths
    const startCommands: PathCommand[] = parsePathCommands(startD);
    const endCommands: PathCommand[] = parsePathCommands(endD);

    // If formats don't match or no commands, use standard interpolation
    if (startCommands.length === 0 || endCommands.length === 0) {
        return interpolatePathD(startD, endD, progress);
    }

    // Generate interpolated path
    let result: string = '';
    const maxPoints: number = Math.max(startCommands.length, endCommands.length);

    for (let i: number = 0; i < maxPoints; i++) {
        // If we've run out of points in either path, use the last known point
        const startCmd: PathCommand = i < startCommands.length ? startCommands[i as number] : startCommands[startCommands.length - 1];
        const endCmd: PathCommand = i < endCommands.length ? endCommands[i as number] : endCommands[endCommands.length - 1];

        // Add command type (M or L)
        result += startCmd.type + ' ';

        // Interpolate coordinates
        const x: number = startCmd.coords[0] + (endCmd.coords[0] - startCmd.coords[0]) * progress;
        const y: number = startCmd.coords[1] + (endCmd.coords[1] - startCmd.coords[1]) * progress;
        result += `${x} ${y} `;
    }

    return result;
}

/**
 * Renders an Area series for the chart.
 * This module provides functions to generate SVG paths for the area fill and its border,
 * handle animations for initial rendering and data updates, and integrate with markers.
 */
const AreaSeriesRenderer: AreaSeriesRendererType = {
    getAreaPathDirection: (
        xValue: number, yValue: number, series: SeriesProperties,
        isInverted: boolean, getPointLocation: Function, startPoint: ChartLocationProps | null,
        startPath: string
    ): string => {
        let direction: string = '';
        let firstPoint: ChartLocationProps;
        if (startPoint === null) {
            firstPoint = getPointLocation(xValue, yValue, series.xAxis, series.yAxis, isInverted, series);
            direction += (startPath + ' ' + (firstPoint.x) + ' ' + (firstPoint.y) + ' ');
        }
        return direction;
    },

    getAreaEmptyDirection: (
        firstPoint: ChartLocationProps, secondPoint: ChartLocationProps, series: SeriesProperties,
        isInverted: boolean, getPointLocation: Function
    ): string => {
        let direction: string = '';
        direction += AreaSeriesRenderer.getAreaPathDirection(
            firstPoint.x, firstPoint.y, series, isInverted, getPointLocation, null,
            'L'
        );
        direction += AreaSeriesRenderer.getAreaPathDirection(
            secondPoint.x, secondPoint.y, series, isInverted, getPointLocation, null,
            'L'
        );
        return direction;
    },

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
        animatedDirection?: string;
        animatedTransform?: string;
        animatedClipPath?: string;
    } => {
        // Extract animation state
        const { isInitialRenderRef, renderedPathDRef, animationProgress } = animationState;
        if (!renderedPathDRef.current) {
            renderedPathDRef.current = {};
        }
        const isInitial: boolean = isInitialRenderRef.current[index as number];

        // Get path data
        const pathD: string = pathOptions.d as string;
        const id: string = pathOptions.id ? pathOptions.id.toString() : '';
        const isBorder: boolean = id.includes('_border_');
        const idParts: string[] = id.split('_');
        const seriesIndexStr: string = idParts.length > 0 ? idParts[idParts.length - 1] : '0';
        const seriesIndex: number = parseInt(seriesIndexStr, 10);

        const storedKey: string = `${isBorder ? 'border' : 'area'}_${seriesIndex}`;

        if (enableAnimation) {
            // For initial render animation
            if (isInitial) {
                if (animationProgress === 1) {
                    isInitialRenderRef.current[index as number] = false;
                    (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                }

                // Parse the path to find min/max X values
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

                // Find min/max x values
                const minX: number = Math.min(...xCoords);
                const maxX: number = Math.max(...xCoords);
                const range: number = maxX - minX;

                // Create a clip rect based on progress
                const animWidth: number = range * animationProgress;
                const isInverted: boolean = currentSeries.chart?.requireInvertedAxis;
                const isXAxisInverse: boolean = currentSeries?.xAxis?.isAxisInverse;
                const isYAxisInverse: boolean = currentSeries?.yAxis?.isAxisInverse;
                let clipPathStr: string = '';

                if (!isInverted) {
                    // Normal orientation - clip horizontally based on X values
                    const xCoordinates: number[] = xCoords.map((coord: number) => coord);
                    const minX: number = Math.min(...xCoordinates);
                    const maxX: number = Math.max(...xCoordinates);
                    const range: number = maxX - minX;

                    if (isXAxisInverse) {
                        // X-axis is inverted - clip from right to left
                        const animWidth: number = range * animationProgress;
                        clipPathStr = `inset(0 0 0 ${range - animWidth}px)`;
                    } else {
                        clipPathStr = `inset(0 ${range - animWidth}px 0 0)`;
                    }
                } else {
                    const yCoords: number[] = commands
                        .filter((cmd: PathCommand) => cmd.type !== 'Z' && cmd.coords.length >= 2)
                        .map((cmd: PathCommand) => cmd.coords[1]); // Get Y coordinates for transposed mode

                    if (yCoords.length === 0) {
                        return {
                            strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                            strokeDashoffset: 0
                        };
                    }

                    const minY: number = Math.min(...yCoords);
                    const maxY: number = Math.max(...yCoords);
                    const range: number = maxY - minY;
                    const animHeight: number = range * animationProgress;

                    if (isYAxisInverse) {
                        // Y-axis inverted - clip from top to bottom
                        clipPathStr = `inset(${Math.max(0, range - animHeight)}px 0 0 0)`;
                    } else {
                        clipPathStr = `inset(${Math.max(0, range - animHeight)}px 0 0 0)`;
                    }
                }
                // Use CSS clip-path for both the area and border
                return {
                    strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                    strokeDashoffset: 0,
                    animatedClipPath: clipPathStr
                };
            }

            else if (pathD && (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string]) {
                const storedD: string = (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string];

                if (pathD !== storedD) {
                    let endPath: string = pathD;
                    const startPathCommands: string[] = storedD.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) as string[];
                    const endPathCommands: string[] = (pathD).match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) as string[];
                    const maxLength: number = Math.max(startPathCommands.length, endPathCommands.length);
                    const minLength: number = Math.min(startPathCommands.length, endPathCommands.length);
                    if (startPathCommands.length > endPathCommands.length) {
                        for (let i: number = minLength; i < maxLength; i++) {
                            if (endPathCommands.length !== startPathCommands.length) {
                                if (currentSeries.removedPointIndex === currentSeries.points.length) {
                                    if (endPathCommands.length === 1) {
                                        endPathCommands.push(endPathCommands[endPathCommands.length - (isBorder ? 1 : 2)].replace('M', 'L'));
                                    } else {
                                        endPathCommands.splice(endPathCommands.length - 1, 0,
                                                               endPathCommands[endPathCommands.length - (isBorder ? 1 : 2)]);
                                    }
                                }
                                else {
                                    endPathCommands.splice(1, 0, endPathCommands[1] ?
                                        (isBorder ? endPathCommands[0] : endPathCommands[1]) : endPathCommands[0]);
                                }
                            }
                        }
                        endPath = endPathCommands.join('');
                    }
                    // Use specialized interpolation based on whether it's border or fill
                    const interpolatedD: string = isBorder ?
                        interpolateBorderPath(storedD, endPath, animationProgress) :
                        interpolateAreaPath(storedD, endPath, animationProgress);

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
        let startPoint: ChartLocationProps | null = null;
        let direction: string = '';
        let seriesFill: string | undefined;
        const origin: number = Math.max(series.yAxis.visibleRange.minimum, 0);
        const getCoordinate: Function = getPoint;
        const isDropMode: boolean = (series.emptyPointSettings && series.emptyPointSettings.mode === 'Drop') as boolean;
        const borderWidth: number = series.border?.width as number;
        const borderColor: string = series.border?.color ? series.border?.color : seriesFill as string;
        const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series);
        let point: Points;
        // First point for completing the area path
        let firstPointX: number = 0;
        let firstPointY: number = 0;
        let hasPoints: boolean = false;

        // First pass - collect area fill path directions
        for (let i: number = 0; i < visiblePoints.length; i++) {
            point = visiblePoints[i as number];
            const currentXValue: number = point.xValue as number;
            point.symbolLocations = [];
            point.regions = [];

            if (point.visible) {
                hasPoints = true;
                // Store first point for later closing the path
                if (i === 0) {
                    const baselinePoint: ChartLocationProps = getCoordinate(
                        currentXValue, origin, series.xAxis,
                        series.yAxis, isInverted, series);
                    firstPointX = baselinePoint.x;
                    firstPointY = baselinePoint.y;
                }

                // Area fill path
                direction += AreaSeriesRenderer.getAreaPathDirection(
                    currentXValue, origin, series, isInverted, getCoordinate, startPoint,
                    startPoint === null ? 'M' : 'L'
                );

                startPoint = startPoint || { x: currentXValue, y: origin };
                direction += AreaSeriesRenderer.getAreaPathDirection(
                    currentXValue, point.yValue as number, series, isInverted, getCoordinate, null,
                    'L'
                );

                const customizedValues: string = applyPointRenderCallback(({
                    seriesIndex: series.index as number, color: series.interior as string,
                    xValue: point.xValue as  number | Date | string | null,
                    yValue: point.yValue as  number | Date | string | null
                }), series.chart);
                point.interior = customizedValues;

                if (!seriesFill) { seriesFill = customizedValues; }

                // Handle empty points
                if (visiblePoints[i + 1] && !visiblePoints[i + 1].visible && !isDropMode) {
                    direction += AreaSeriesRenderer.getAreaEmptyDirection(
                        { 'x': currentXValue, 'y': origin },
                        startPoint, series, isInverted, getCoordinate
                    );
                    startPoint = null;
                }

                lineBaseInstance.storePointLocation(point, series, isInverted, getCoordinate);
            }
        }
        series.visiblePoints = visiblePoints;
        // Complete the area path by returning to the baseline and closing it
        let finalDirection: string = '';

        if (hasPoints) {
            // Get last point
            const lastPoint: Points = visiblePoints[visiblePoints.length - 1];
            const lastPointLoc: ChartLocationProps = getCoordinate(
                lastPoint.xValue as number, origin, series.xAxis, series.yAxis, isInverted, series);

            // Create the final direction with proper closing of the path
            finalDirection = direction;

            // Return to baseline
            finalDirection += `L ${lastPointLoc.x} ${lastPointLoc.y} `;

            // Close the path by returning to the first point
            finalDirection += `L ${firstPointX} ${firstPointY} `;
        }

        // First, create the area fill path
        const name: string = series.chart.element.id + '_Series_' + series.index;
        const seriesOptions: RenderOptions = {
            id: name,
            fill: seriesFill as string,
            strokeWidth: 0,
            stroke: 'transparent',
            opacity: series.opacity,
            dashArray: series.dashArray,
            d: finalDirection
        };

        const options: RenderOptions[] = [seriesOptions];

        // Then add the border path with the same timing
        if (series.border?.width !== 0) {
            const borderName: string = series.chart.element.id + '_Series_border_' + series.index;
            const borderOptions: RenderOptions = {
                id: borderName,
                fill: 'transparent',
                strokeWidth: borderWidth,
                stroke: borderColor,
                opacity: 1,
                dashArray: series.border?.dashArray,
                d: lineBaseInstance.removeEmptyPointsBorder(direction) // Use separate border path for top line only
            };
            options.push(borderOptions);
        }
        const marker: ChartMarkerProps | null = series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
        return marker ? { options, marker } : options;
    }
};

/**
 * Parses SVG path commands into structured objects.
 *
 * @param {string} path - SVG path data string
 * @returns {PathCommand[]} Array of structured command objects
 * @private
 */
export function parsePathCommands(path: string): PathCommand[] {
    const result: PathCommand[] = [];
    const commandRegex: RegExp = /([MLZ])([^MLZ]*)/g;
    let match: RegExpExecArray | null;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        match = commandRegex.exec(path);
        if (match === null) {
            break;
        }
        const [, type, coordsStr] = match;
        const coords: number[] = coordsStr.trim().split(/\s+/).map(parseFloat).filter((n: number) => !isNaN(n));

        result.push({
            type,
            coords
        });
    }
    return result;
}
export default AreaSeriesRenderer;
