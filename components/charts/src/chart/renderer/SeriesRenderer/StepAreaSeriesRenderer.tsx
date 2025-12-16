import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { StepPosition } from '../../base/enum';
import { AreaSeriesAnimateState, AxisModel, PathCommand, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { applyPointRenderCallback, getPoint } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import MarkerRenderer from './MarkerRenderer';
import { AnimationState, interpolatePathD } from './SeriesAnimation';
import { parsePathCommands } from './AreaSeriesRenderer';

const lineBaseInstance: LineBaseReturnType = LineBase;
const ID_PREFIX: string = '_Series_';
const BORDER_SUFFIX: string = '_Series_border_';
/**
 * Interpolates between two SVG path definitions for step area animation.
 *
 * @param {string} startDirection - The starting SVG path string.
 * @param {string} endDirection - The ending SVG path string.
 * @param {number} progress - The animation progress (0 to 1).
 * @returns {string} The interpolated SVG path string.
 * @private
 */
export function interpolateStepAreaPath(startDirection: string, endDirection: string, progress: number): string {
    if (!startDirection || !endDirection) {
        return endDirection || startDirection || '';
    }
    const startCommands: PathCommand[] = parsePathCommands(startDirection);
    const endCommands: PathCommand[] = parsePathCommands(endDirection);

    if (startCommands.length === 0 || endCommands.length === 0 ||
        startCommands[0].type !== endCommands[0].type) {
        return interpolatePathD(startDirection, endDirection, progress);
    }
    const startBaselineY: number = startCommands[0].coords?.[1] ?? 0;
    const endBaselineY: number = endCommands[0].coords?.[1] ?? 0;

    // Identify where data points end and closing path begins
    const findLastDataPointIndex: (commands: PathCommand[]) => number = (commands: PathCommand[]): number => {
        for (let i: number = commands.length - 3; i > 0; i--) {
            if (commands[i as number].type === 'L' && commands[i + 1].type === 'L') {
                // Check if this point is followed by a drop to baseline
                if (Math.abs(commands[i + 1].coords[0] - commands[i as number].coords[0]) < 0.1 &&
                    Math.abs(commands[i + 1].coords[1] - startBaselineY) < 1) {
                    return i;
                }
            }
        }
        return Math.max(0, commands.length - 3);
    };
    const startLastDataIndex: number = findLastDataPointIndex(startCommands);
    const endLastDataIndex: number = findLastDataPointIndex(endCommands);
    let result: string = '';

    // First point (M command)
    result += 'M ';
    result += `${startCommands[0].coords[0] + (endCommands[0].coords[0] - startCommands[0].coords[0]) * progress} `;
    result += `${startCommands[0].coords[1] + (endCommands[0].coords[1] - startCommands[0].coords[1]) * progress} `;

    // Data points
    for (let i: number = 1; i <= Math.max(startLastDataIndex, endLastDataIndex); i++) {
        const startIndex: number = Math.min(i, startLastDataIndex);
        const endIndex: number = Math.min(i, endLastDataIndex);
        const startCommand: PathCommand = startCommands[startIndex as number];
        const endCommand: PathCommand = endCommands[endIndex as number];
        result += 'L ';

        const x: number = startCommand.coords[0] + (endCommand.coords[0] - startCommand.coords[0]) * progress;
        const y: number = startCommand.coords[1] + (endCommand.coords[1] - startCommand.coords[1]) * progress;
        result += `${x} ${y} `;
    }
    const lastStartData: PathCommand = startCommands[startLastDataIndex as number];
    const lastEndData: PathCommand = endCommands[endLastDataIndex as number];

    const lastX: number = lastStartData.coords[0] + (lastEndData.coords[0] - lastStartData.coords[0]) * progress;
    const interpolatedBaselineY: number = startBaselineY + (endBaselineY - startBaselineY) * progress;
    const firstX: number = startCommands[0].coords[0] + (endCommands[0].coords[0] - startCommands[0].coords[0]) * progress;

    result += `L ${lastX} ${interpolatedBaselineY} `;
    result += `L ${firstX} ${interpolatedBaselineY} `;
    result += `L ${firstX} ${startCommands[0].coords[1] + (endCommands[0].coords[1] - startCommands[0].coords[1]) * progress} `;

    return result;
}

/**
 * Parses a step line path data string into an array of points.
 *
 * @param {string} pathData - The step line path data string to parse.
 * @returns {[number, number][]} - The array of points parsed from the path data.
 */
function parseStepPath(pathData: string): [number, number][] {
    const points: [number, number][] = [];
    const pointSegments: string[] = pathData.split(/(?=[ML])/);

    pointSegments.forEach((segment: string) => {
        const match: RegExpMatchArray = segment.match(/([ML]) ([\d.-]+) ([\d.-]+)/) as RegExpMatchArray;
        if (match) {
            const [, command, xString, yString] = match;
            if (command === 'M' || command === 'L') {
                points.push([parseFloat(xString), parseFloat(yString)]);
            }
        }
    });
    return points;
}

/**
 * Generates a step area path data string from an array of points.
 *
 * @param {[number, number][]} points - The array of points to generate the step line path from.
 * @param {string} stepPosition - The position of the step (Left, Right, Center).
 * @returns {string} - The generated step line path data string.
 * @private
 */
export function generateStepAreaPath(points: [number, number][], stepPosition: string = 'Center'): string {
    if (points.length === 0) {
        return '';
    }

    let pathData: string = `M ${points[0][0]} ${points[0][1]}`;

    for (let i: number = 1; i < points.length; i++) {
        const [x1, y1]: number[] = points[i - 1];
        const [x2, y2]: number[] = points[i as number];
        if (stepPosition === 'Center') {
            const midX: number = (x1 + x2) / 2;
            pathData += ` L ${midX} ${y1} L ${midX} ${y2}`;
        } else if (stepPosition === 'Left') {
            pathData += ` L ${x1} ${y2}`;
        } else if (stepPosition === 'Right') {
            pathData += ` L ${x2} ${y1}`;
        }
        pathData += ` L ${x2} ${y2}`;
    }
    return pathData;
}

/**
 * Interpolate the top border— no closing baseline.
 * Falls back to interpolatePathD if formats are incompatible.
 * Uses point-based interpolation  chart to avoid vertical artifacts.
 *
 * @param {string} startPath - The starting SVG path string.
 * @param {string} endPath - The ending SVG path string.
 * @param {number} progress - The interpolation progress (0 to 1).
 * @param {StepPosition} stepPosition - The step position (Left, Right, Center).
 * @returns {string} The interpolated path string.
 * @private
 */
export function interpolateStepBorderPath(
    startPath: string,
    endPath: string,
    progress: number,
    stepPosition: StepPosition = 'Left'
): string {
    if (!startPath || !endPath) {
        return endPath || startPath || '';
    }
    const startPoints: [number, number][] = parseStepPath(startPath);
    const endPoints: [number, number][] = parseStepPath(endPath);

    if (startPoints.length === 0 || endPoints.length === 0) {
        return interpolatePathD(startPath, endPath, progress);
    }

    // Handle unequal point counts (e.g., adding/removing points)
    const maxPoints: number = Math.max(startPoints.length, endPoints.length);
    const interpolatedPoints: [number, number][] = [];

    for (let i: number = 0; i < maxPoints; i++) {
        const startPoint: [number, number] = startPoints[Math.min(i, startPoints.length - 1)];
        const endPoint: [number, number] = endPoints[Math.min(i, endPoints.length - 1)];
        const x: number = startPoint[0] + (endPoint[0] - startPoint[0]) * progress;
        const y: number = startPoint[1] + (endPoint[1] - startPoint[1]) * progress;
        interpolatedPoints.push([x, y]);
    }
    return generateStepAreaPath(interpolatedPoints, stepPosition);
}

/**
 *
 * @param {Points[]} points - Ordered data points (must include xValue and yValue).
 * @param {SeriesProperties} series - Series configuration (uses yAxis.visibleRange.minimum and step).
 * @param {boolean} isInverted - Whether the chart is transposed (X/Y swapped in rendering).
 * @param {GetCoordinateFn} getCoordinate - Function that converts data (x, y) to screen coordinates.
 * @returns {string} SVG path data (d attribute) for the filled step-area polygon, or empty string.
 */
export function getStepAreaPathDirection(
    points: Points[],
    series: SeriesProperties,
    isInverted: boolean,
    getCoordinate: (
        x: number,
        y: number,
        xAxis: AxisModel | undefined,
        yAxis: AxisModel | undefined,
        isInverted: boolean,
        series: SeriesProperties
    ) => ChartLocationProps
): string {
    if (!points || points.length === 0) { return ''; }

    const origin: number = Math.max(series.yAxis.visibleRange.minimum, 0);

    // Map baseline points with getPoint so transposition is respected
    const firstPoints: Points = points[0];
    const firstBase: ChartLocationProps = getCoordinate(firstPoints.xValue as number,
                                                        origin, series.xAxis, series.yAxis, isInverted, series);
    const firstData: ChartLocationProps = getCoordinate(firstPoints.xValue as number,
                                                        firstPoints.yValue as number, series.xAxis, series.yAxis, isInverted, series);

    let stepAreaPathDirection: string = `M ${firstBase.x} ${firstBase.y} L ${firstData.x} ${firstData.y} `;

    for (let i: number = 1; i < points.length; i++) {
        const previousPoints: Points = points[i - 1];
        const currentPoints: Points = points[i as number];

        const previousPoint: ChartLocationProps = getCoordinate(previousPoints.xValue as number,
                                                                previousPoints.yValue as number, series.xAxis,
                                                                series.yAxis, isInverted, series);
        const currentPoint: ChartLocationProps = getCoordinate(currentPoints.xValue as number,
                                                               currentPoints.yValue as number, series.xAxis,
                                                               series.yAxis, isInverted, series);

        if (series.step === 'Center') {
            const midX: number = (previousPoint.x + currentPoint.x) / 2;
            stepAreaPathDirection += `L ${midX} ${previousPoint.y} L ${midX} ${currentPoint.y} L ${currentPoint.x} ${currentPoint.y} `;
        } else if (series.step === 'Left') {
            stepAreaPathDirection += `L ${currentPoint.x} ${previousPoint.y} L ${currentPoint.x} ${currentPoint.y} `;
        } else { // 'Right'
            stepAreaPathDirection += `L ${previousPoint.x} ${currentPoint.y} L ${currentPoint.x} ${currentPoint.y} `;
        }
    }

    // Close to baseline using mapped coordinates to respect transposition
    const lastPoint: Points = points[points.length - 1];
    const lastBase: ChartLocationProps = getCoordinate(lastPoint.xValue as number, origin, series.xAxis, series.yAxis, isInverted, series);
    stepAreaPathDirection += `L ${lastBase.x} ${lastBase.y} L ${firstBase.x} ${firstBase.y} Z`;

    return stepAreaPathDirection;
}

/**
 * Generate the border path string for a Step Area series.
 *
 * @param {Points[]} points - The set of data points used to construct the path.
 * @param {StepPosition} stepPosition - The step alignment (Left, Right, or Center).
 * @param {SeriesProperties} series - The series configuration for rendering.
 * @returns {string} The constructed SVG path string for the border.
 * @private
 */
export function getStepAreaBorderPath(
    points: Points[],
    stepPosition: StepPosition,
    series: SeriesProperties
): string {
    if (!points || points.length === 0) {
        return '';
    }

    const firstPoint: ChartLocationProps = { x: points[0].x as number, y: points[0].y as number };
    let borderDirection: string = `M ${firstPoint.x} ${firstPoint.y} `;

    for (let pointIndex: number = 1; pointIndex < points.length; pointIndex++) {
        const currentPoint: ChartLocationProps = { x: points[pointIndex as number].x as number,
            y: points[pointIndex as number ].y as number };
        const previousPoint: ChartLocationProps = { x: points[pointIndex - 1].x as number, y: points[pointIndex - 1].y as number };

        borderDirection += LineBase.getStepLineDirection(
            currentPoint,
            previousPoint,
            stepPosition,
            'L',
            series,
            false
        );
    }
    return borderDirection;
}

/**
 * The StepAreaSeriesRenderer object.
 */
const StepAreaSeriesRenderer: {
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState | AreaSeriesAnimateState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties
    ) => {
        strokeDasharray: string | number;
        strokeDashoffset: number;
        interpolatedD?: string;
        animatedDirection?: string;
        animatedTransform?: string;
        animatedClipPath?: string;
    };
    render: (
        series: SeriesProperties,
        isInverted: boolean
    ) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };
} = {
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
        const { isInitialRenderRef, renderedPathDRef, animationProgress } = animationState;
        if (!renderedPathDRef.current) {
            renderedPathDRef.current = {};
        }
        const isInitialRender: boolean = !!isInitialRenderRef.current[index as number];
        const pathData: string = pathOptions.d as string;
        const elementId: string = pathOptions.id ? pathOptions.id.toString() : '';
        const isBorderPath: boolean = elementId.includes('_border_');
        const idParts: string[] = elementId.split('_');
        const seriesIndexString: string = idParts[idParts.length - 1];
        const seriesIndex: number = parseInt(seriesIndexString, 10);
        const storedPathKey: string = `${isBorderPath ? 'border' : 'area'}_${seriesIndex}`;
        if (enableAnimation) {
            if (isInitialRender) {
                if (animationProgress === 1) {
                    isInitialRenderRef.current[index as number] = false;
                    (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedPathKey as string] = pathData;
                }
                const commands: PathCommand[] = parsePathCommands(pathData);
                // Extract X coordinates
                const xCoordinates: number[] = commands
                    .filter((cmd: PathCommand) => cmd.type !== 'Z' && cmd.coords.length >= 2)
                    .map((cmd: PathCommand) => cmd.coords[0]);

                // Early return if no X coordinates
                if (!xCoordinates || xCoordinates.length === 0) {
                    return {
                        strokeDasharray: isBorderPath ? (pathOptions.dashArray || 'none') : 'none',
                        strokeDashoffset: 0
                    };
                }

                const minX: number = Math.min(...xCoordinates);
                const maxX: number = Math.max(...xCoordinates);
                const xRange: number = maxX - minX;
                const animatedWidth: number = xRange * animationProgress;
                const isChartInverted: boolean = currentSeries.chart?.requireInvertedAxis;
                const isXAxisInverted: boolean = currentSeries?.xAxis?.isAxisInverse;
                const isYAxisInverted: boolean = !!currentSeries?.yAxis?.isAxisInverse;
                let clipPathString: string = '';

                if (!isChartInverted) {
                    clipPathString = isXAxisInverted
                        ? `inset(0 0 0 ${xRange - animatedWidth}px)`
                        : `inset(0 ${xRange - animatedWidth}px 0 0)`;
                } else {
                    // Extract Y coordinates
                    const yCoordinates: number[] = commands
                        .filter((cmd: PathCommand) => cmd.type !== 'Z' && cmd.coords.length >= 2)
                        .map((cmd: PathCommand) => cmd.coords[1]);

                    // Early return if no Y coordinates
                    if (!yCoordinates || yCoordinates.length === 0) {
                        return {
                            strokeDasharray: isBorderPath ? (pathOptions.dashArray || 'none') : 'none',
                            strokeDashoffset: 0
                        };
                    }
                    const minY: number = Math.min(...yCoordinates);
                    const maxY: number = Math.max(...yCoordinates);
                    const yRange: number = maxY - minY;
                    const animatedHeight: number = yRange * animationProgress;
                    // clipPathString = `inset(${Math.max(0, yRange - animatedHeight)}px 0 0 0)`;
                    clipPathString = isYAxisInverted
                        ? `inset(${Math.max(0, yRange - animatedHeight)}px 0 0 0)`
                        : `inset(${Math.max(0, yRange - animatedHeight)}px 0 0 0)`;
                }
                return {
                    strokeDasharray: isBorderPath ? (pathOptions.dashArray || 'none') : 'none',
                    strokeDashoffset: 0,
                    animatedClipPath: clipPathString
                };
            }
            // Non-initial render logic remains unchanged
            else if (pathData && (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedPathKey as string]) {
                const storedPathData: string = (renderedPathDRef as
                     React.RefObject<Record<string, string>>).current[storedPathKey as string];

                if (pathData !== storedPathData) {
                    let endPath: string = pathData;
                    const startPathCommands: string[] = storedPathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) as string[];
                    const endPathCommands: string[] = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) as string[];
                    const maxLength: number = Math.max(startPathCommands.length, endPathCommands.length);
                    const minLength: number = Math.min(startPathCommands.length, endPathCommands.length);

                    // Handle point removal by padding endPathCommands
                    if (startPathCommands.length > endPathCommands.length) {
                        for (let i: number = minLength; i < maxLength; i++) {
                            if (endPathCommands.length !== startPathCommands.length) {
                                if (currentSeries.removedPointIndex === currentSeries.points.length) {
                                    if (endPathCommands.length === 1) {
                                        endPathCommands.push(endPathCommands[endPathCommands.length - (isBorderPath ? 1 : 2)].replace('M', 'L'));
                                    } else {
                                        endPathCommands.splice(
                                            endPathCommands.length - 1,
                                            0,
                                            endPathCommands[endPathCommands.length - (isBorderPath ? 1 : 2)]
                                        );
                                    }
                                } else {
                                    endPathCommands.splice(
                                        1,
                                        0,
                                        endPathCommands[1] ? (isBorderPath ? endPathCommands[0] : endPathCommands[1]) : endPathCommands[0]
                                    );
                                }
                            }
                        }
                        endPath = endPathCommands.join('');
                    }

                    // Step-specific interpolation
                    const interpolatedPathData: string = isBorderPath
                        ? interpolateStepBorderPath(storedPathData, endPath, animationProgress)
                        : interpolateStepAreaPath(storedPathData, endPath, animationProgress);

                    if (animationProgress === 1) {
                        (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedPathKey as string] = pathData;
                    }

                    return {
                        strokeDasharray: isBorderPath ? (pathOptions.dashArray || 'none') : 'none',
                        strokeDashoffset: 0,
                        interpolatedD: interpolatedPathData
                    };
                }
            }
            if (animationProgress === 1) {
                (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedPathKey as string] = pathData;
            }
        }
        return {
            strokeDasharray: isBorderPath ? (pathOptions.dashArray || 'none') : 'none',
            strokeDashoffset: 0
        };
    },

    /**
     * render - build step-area fill and border renderOptions and associated marker (if any).
     *
     * @param {SeriesProperties} series - The series properties.
     * @param {boolean} isInverted - Flag indicating if the chart is inverted.
     * @returns {RenderOptions[] | {options: RenderOptions[], marker: ChartMarkerProps}} The render options and optional marker.
     */
    render: (
        series: SeriesProperties,
        isInverted: boolean
    ): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
        type GetCoordinateFn = (
            x: number,
            y: number,
            xAxis: AxisModel | undefined,
            yAxis: AxisModel | undefined,
            isInverted: boolean,
            series: SeriesProperties
        ) => ChartLocationProps;

        const getCoordinate: GetCoordinateFn = getPoint as GetCoordinateFn;
        const isDropMode: boolean = (series.emptyPointSettings?.mode === 'Drop');
        const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series);
        const pointSegments: Points[][] = [];
        let activeSegment: Points[] = [];
        let seriesFill: string | undefined;
        for (let pointIndex: number = 0; pointIndex < visiblePoints.length; pointIndex++) {
            const currentPoint: Points = visiblePoints[pointIndex as number];
            currentPoint.regions = [];
            currentPoint.symbolLocations = [];

            if (currentPoint.visible && currentPoint.yValue !== null && currentPoint.yValue !== undefined) {
                lineBaseInstance.storePointLocation(currentPoint, series, isInverted, getCoordinate);
                activeSegment.push(currentPoint);

                const customizedValues: string = applyPointRenderCallback(({
                    seriesIndex: series.index as number, color: series.interior as string,
                    xValue: currentPoint.xValue as number | Date | string | null,
                    yValue: currentPoint.yValue as number | Date | string | null
                }), series.chart);
                currentPoint.interior = customizedValues;

                if (!seriesFill) { seriesFill = customizedValues; }

                // If next point is invisible and not Drop, end segment
                if (
                    pointIndex < visiblePoints.length - 1 &&
                    !visiblePoints[pointIndex + 1].visible &&
                    !isDropMode
                ) {
                    pointSegments.push([...activeSegment]);
                    activeSegment = [];
                }
            } else {
                pointSegments.push([]);
            }
        }
        if (activeSegment.length > 0) {
            pointSegments.push([...activeSegment]);
        }
        const renderOptions: RenderOptions[] = [];
        let stepPosition: StepPosition;
        if (series.step === 'Center' || series.step === 'Right') {
            stepPosition = series.step;
        } else {
            stepPosition = 'Left'; // default branch explicitly hit
        }

        for (const segment of pointSegments) {
            const transformedPoints: Points[] = [];
            for (const point of segment) {
                const location: ChartLocationProps = getCoordinate(point.xValue as number, point.yValue as number
                    , series.xAxis, series.yAxis, isInverted, series);
                transformedPoints.push({ ...point, x: location.x, y: location.y } as Points);
            }
            if (transformedPoints.length === 0) {
                continue;
            }

            // Area path: always closed to baseline

            const areaDirection: string = getStepAreaPathDirection(transformedPoints, series, isInverted, getCoordinate);
            const seriesElementId: string = `${series.chart.element.id}${ID_PREFIX}${series.index}`;
            renderOptions.push({
                id: seriesElementId,
                fill: seriesFill as string,
                strokeWidth: 0,
                stroke: 'none',
                opacity: series.opacity,
                dashArray: '',
                d: areaDirection
            });

            // Border path: respects noRisers (skip vertical risers)
            if (series.border?.width) {
                const borderDirection: string = getStepAreaBorderPath(transformedPoints, stepPosition, series);
                const borderElementId: string = `${series.chart.element.id}${BORDER_SUFFIX}${series.index}`;
                renderOptions.push({
                    id: borderElementId,
                    fill: 'none',
                    strokeWidth: series.border.width,
                    stroke: series.border.color ?? seriesFill,
                    opacity: series.opacity,
                    dashArray: series.border.dashArray ?? series.dashArray ?? '',
                    d: borderDirection
                });
            }
        }
        series.visiblePoints = visiblePoints;
        const marker: ChartMarkerProps | null = series.marker?.visible
            ? (MarkerRenderer.render(series) as ChartMarkerProps)
            : null;
        return marker ? { options: renderOptions, marker } : renderOptions;
    }
};

export default StepAreaSeriesRenderer;
