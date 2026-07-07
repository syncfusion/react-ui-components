import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { StepPosition } from '../../base/enum';
import { AreaSeriesAnimateState, PathCommand, Points, RangeAreaSeriesRendererType, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { applyPointRenderCallback, getPoint } from '../../utils/helper';
import { parsePathCommands } from './AreaSeriesRenderer';
import { getStepAreaBorderPath } from './StepAreaSeriesRenderer';
import { LineBase, LineBaseReturnType } from './LineBase';
import MarkerRenderer from './MarkerRenderer';
import { equalizePolyline, splitRangeAreaSegment } from './RangeBase';
import { AnimationState, interpolatePathD } from './SeriesAnimation';

const lineBaseInstance: LineBaseReturnType = LineBase;

type RangeStepSegment = {
    low: ChartLocationProps[];
    high: ChartLocationProps[];
    nextIndex: number;
    closedWithZ: boolean;
};

type RangeStepVisibleSegment = {
    low: ChartLocationProps[];
    high: ChartLocationProps[];
};

/**
 * Returns the opposite step position.
 * Swaps horizontal positions (`Left` ↔ `Right`) and keeps `Center` unchanged.
 *
 * @param {StepPosition} stepPosition - The current step position.
 * @returns {StepPosition} The opposite step position.
 * @private
 */
function getOppositeStepPosition(stepPosition: StepPosition): StepPosition {
    if (stepPosition === 'Left') { return 'Right'; }
    if (stepPosition === 'Right') { return 'Left'; }
    return 'Center';
}

/**
 * Converts a ChartLocationProps array to a Points array for step boundary path generation.
 *
 * @param {ChartLocationProps[]} points - Points to convert.
 * @returns {Points[]} - Converted points array.
 * @private
 */
function convertToStepBoundaryPoints(points: ChartLocationProps[]): Points[] {
    return points.map((point: ChartLocationProps) => ({ x: point.x, y: point.y } as unknown as Points));
}

/**
 * Builds step boundary path for polyline points.
 *
 * @param {ChartLocationProps[]} points - Boundary points.
 * @param {StepPosition} stepPosition - Step position.
 * @param {SeriesProperties} series - Series configuration.
 * @param {boolean} isBorder - Whether this is a border path.
 * @returns {string} - Generated path string.
 * @private
 */
function buildStepAreaBoundaryPath(
    points: ChartLocationProps[],
    stepPosition: StepPosition,
    series: SeriesProperties,
    isBorder: boolean
): string {
    if (points.length === 0) { return ''; }
    return getStepAreaBorderPath(convertToStepBoundaryPoints(points),
                                 stepPosition, isBorder ? series : { ...series, noRisers: false }).trim();
}

/**
 * Builds a complete segment path (low and high boundaries) for step area rendering.
 *
 * @param {ChartLocationProps[]} low - Low boundary points.
 * @param {ChartLocationProps[]} high - High boundary points.
 * @param {StepPosition} stepPosition - Step position.
 * @param {SeriesProperties} series - Series configuration.
 * @param {boolean} isBorder - Whether this is a border path.
 * @returns {string} - Combined path string.
 * @private
 */
function buildStepSegmentPath(
    low: ChartLocationProps[],
    high: ChartLocationProps[],
    stepPosition: StepPosition,
    series: SeriesProperties,
    isBorder: boolean
): string {
    if (low.length === 0 || low.length !== high.length) { return ''; }
    const lowPath: string = buildStepAreaBoundaryPath(low, stepPosition, series, isBorder);
    if (!lowPath) { return ''; }
    if (isBorder) { return `${lowPath} ${buildStepAreaBoundaryPath(high, stepPosition, series, true)}`.trim(); }
    const reverseStepPosition: StepPosition = getOppositeStepPosition(stepPosition);
    const reversedHigh: ChartLocationProps[] = [...high].reverse();
    let highPath: string = buildStepAreaBoundaryPath(reversedHigh, reverseStepPosition, series, false);
    if (highPath.startsWith('M')) { highPath = highPath.replace(/^M\s+/, 'L '); }
    return `${lowPath} ${highPath} Z`.trim();
}

/**
 * Interpolates two step-bounded polylines at a given progress value.
 *
 * @param {ChartLocationProps[]} startPoints - Starting polyline.
 * @param {ChartLocationProps[]} endPoints - Ending polyline.
 * @param {number} progress - Interpolation progress (0 to 1).
 * @param {StepPosition} stepPosition - Step position.
 * @param {SeriesProperties} series - Series configuration.
 * @param {boolean} isBorder - Whether this is a border path.
 * @returns {string} - Interpolated path string.
 * @private
 */
function interpolateStepBoundaryPath(
    startPoints: ChartLocationProps[],
    endPoints: ChartLocationProps[],
    progress: number,
    stepPosition: StepPosition,
    series: SeriesProperties,
    isBorder: boolean
): string {
    const { firstSegment: startSegment, secondSegment: endSegment } = equalizePolyline(startPoints, endPoints);
    if (startSegment.length === 0) { return ''; }
    const interpolatedPoints: ChartLocationProps[] = startSegment.map((point: ChartLocationProps, index: number) => ({
        x: point.x + (endSegment[index as number].x - point.x) * progress,
        y: point.y + (endSegment[index as number].y - point.y) * progress
    }));
    return buildStepAreaBoundaryPath(interpolatedPoints, stepPosition, series, isBorder);
}

/**
 * Interpolates a range step segment between start and end states.
 *
 * @param {Object} startSegment - Starting segment.
 * @param {ChartLocationProps[]} startSegment.low - Low boundary points.
 * @param {ChartLocationProps[]} startSegment.high - High boundary points.
 * @param {number} startSegment.nextIndex - Next index in command array.
 * @param {boolean} startSegment.closedWithZ - Whether closed with Z.
 *
 * @param {Object} endSegment - Ending segment.
 * @param {ChartLocationProps[]} endSegment.low - Low boundary points.
 * @param {ChartLocationProps[]} endSegment.high - High boundary points.
 * @param {number} endSegment.nextIndex - Next index in command array.
 * @param {boolean} endSegment.closedWithZ - Whether closed with Z.
 *
 * @param {number} progress - Interpolation progress.
 * @param {StepPosition} stepPosition - Step position.
 * @param {SeriesProperties} series - Series configuration.
 * @param {boolean} isBorder - Whether this is a border path.
 *
 * @returns {string} Interpolated SVG path.
 * @private
 */
function interpolateStepSegmentPath(
    startSegment: RangeStepSegment,
    endSegment: RangeStepSegment,
    progress: number,
    stepPosition: StepPosition,
    series: SeriesProperties,
    isBorder: boolean
): string {
    const lowPath: string = interpolateStepBoundaryPath(startSegment.low, endSegment.low, progress, stepPosition, series, isBorder);
    const reverseStepPosition: StepPosition = getOppositeStepPosition(stepPosition);
    let highPath: string = interpolateStepBoundaryPath(
        [...startSegment.high].reverse(),
        [...endSegment.high].reverse(),
        progress,
        reverseStepPosition,
        series,
        isBorder
    );
    if (lowPath && highPath.startsWith('M')) { highPath = highPath.replace(/^M\s+/, 'L '); }
    const closing: string = isBorder ? '' : ((startSegment.closedWithZ || endSegment.closedWithZ) ? ' Z' : '');
    return `${lowPath} ${highPath}${closing}`.trim();
}

/**
 * Extracts polylines from path commands.
 *
 * @param {PathCommand[]} commands - Path commands.
 * @returns {Array<Array<ChartLocationProps>>} - Polylines.
 * @private
 */
function extractPolylinesFromPathCommands(commands: PathCommand[]): ChartLocationProps[][] {
    const polylines: ChartLocationProps[][] = [];
    let index: number = 0;
    while (index < commands.length) {
        while (index < commands.length && commands[index as number].type !== 'M') { index++; }
        if (index >= commands.length) { break; }
        const currentPolyline: ChartLocationProps[] = [{ x: commands[index as number].coords[0], y: commands[index as number].coords[1] }];
        index++;
        while (index < commands.length && commands[index as number].type === 'L') {
            currentPolyline.push({ x: commands[index as number].coords[0], y: commands[index as number].coords[1] });
            index++;
        }
        polylines.push(currentPolyline);
    }
    return polylines;
}

/**
 * Interpolates Range Step Area fill paths across multiple segments.
 * Falls back to generic interpolation if structure is invalid.
 *
 * @param {string} startD - Starting path string.
 * @param {string} endD - Ending path string.
 * @param {number} progress - Animation progress (0 to 1).
 * @param {StepPosition} stepPosition - Step position.
 * @param {SeriesProperties} series - Series configuration.
 * @returns {string} - Interpolated path string.
 * @private
 */
export function interpolateRangeStepAreaPath(
    startD: string,
    endD: string,
    progress: number,
    stepPosition: StepPosition,
    series: SeriesProperties
): string {
    if (!startD || !endD) { return endD || startD || ''; }
    const startCommands: PathCommand[] = parsePathCommands(startD);
    const endCommands: PathCommand[] = parsePathCommands(endD);
    if (startCommands.length === 0 || endCommands.length === 0) { return interpolatePathD(startD, endD, progress); }
    let startIndex: number = 0;
    let endIndex: number = 0;
    let result: string = '';
    while (startIndex < startCommands.length || endIndex < endCommands.length) {
        while (startIndex < startCommands.length && startCommands[startIndex as number].type !== 'M') { startIndex++; }
        while (endIndex < endCommands.length && endCommands[endIndex as number].type !== 'M') { endIndex++; }
        if (startIndex >= startCommands.length && endIndex >= endCommands.length) { break; }
        const startSegment: RangeStepSegment | null = startIndex < startCommands.length ? splitRangeAreaSegment(
            startCommands, startIndex) : null;
        const endSegment: RangeStepSegment | null = endIndex < endCommands.length ? splitRangeAreaSegment(endCommands, endIndex) : null;
        if (!startSegment || !endSegment) { return interpolatePathD(startD, endD, progress); }
        result += interpolateStepSegmentPath(startSegment, endSegment, progress, stepPosition, series, false) + ' ';
        startIndex = startSegment.nextIndex;
        endIndex = endSegment.nextIndex;
    }
    return result.trim();
}

/**
 * Interpolates Range Step Area border paths consisting of low and high edge polylines.
 *
 * @param {string} startD - Starting border path string.
 * @param {string} endD - Ending border path string.
 * @param {number} progress - Animation progress (0 to 1).
 * @param {StepPosition} stepPosition - Step position.
 * @param {SeriesProperties} series - Series configuration.
 * @returns {string} - Interpolated border path string.
 * @private
 */
export function interpolateRangeStepBorderPath(
    startD: string,
    endD: string,
    progress: number,
    stepPosition: StepPosition,
    series: SeriesProperties
): string {
    if (!startD || !endD) { return endD || startD || ''; }
    if (series.noRisers) { return interpolatePathD(startD, endD, progress); }
    const startCommands: PathCommand[] = parsePathCommands(startD);
    const endCommands: PathCommand[] = parsePathCommands(endD);
    if (startCommands.length === 0 || endCommands.length === 0) { return interpolatePathD(startD, endD, progress); }
    const startPolylines: ChartLocationProps[][] = extractPolylinesFromPathCommands(startCommands);
    const endPolylines: ChartLocationProps[][] = extractPolylinesFromPathCommands(endCommands);
    const segmentCount: number = Math.max(startPolylines.length, endPolylines.length);
    let interpolatedPath: string = '';
    for (let i: number = 0; i < segmentCount; i++) {
        const startSegment: ChartLocationProps[] = startPolylines[Math.min(i, startPolylines.length - 1)] ?? [];
        const endSegment: ChartLocationProps[] = endPolylines[Math.min(i, endPolylines.length - 1)] ?? [];
        interpolatedPath += interpolateStepBoundaryPath(startSegment, endSegment, progress, stepPosition, series, true);
    }
    return interpolatedPath.trim();
}

/**
 * Collects and processes point data for a range series including coordinates and regions.
 *
 * @param {SeriesProperties} series - Series configuration.
 * @param {boolean} isInverted - Inverted axis flag.
 * @returns {Object} - Collected low/high points, visible points, and fill color.
 * @private
 */
function buildRangeSeriesPointData(
    series: SeriesProperties,
    isInverted: boolean
): {
        lowPoints: (ChartLocationProps | null)[];
        highPoints: (ChartLocationProps | null)[];
        visiblePoints: Points[];
        seriesFill: string | null;
    } {
    const getCoordinate: Function = getPoint;
    // renderer requires axis and points to compute coordinates safely
    if (!series.xAxis || !series.yAxis || !series.points) {
        series.visiblePoints = series.points ?? [];
        return {
            lowPoints: [],
            highPoints: [],
            visiblePoints: series.points ?? [],
            seriesFill: null
        };
    }
    const visiblePoints: Points[] = series.points;
    const suppressLabelForEmpty: boolean = !(series.emptyPointSettings?.mode === 'Average' || series.emptyPointSettings?.mode === 'Zero');
    const markerWidth: number = series.marker?.width ?? 0;
    const lowPoints: (ChartLocationProps | null)[] = new Array(visiblePoints.length).fill(null);
    const highPoints: (ChartLocationProps | null)[] = new Array(visiblePoints.length).fill(null);
    let seriesFill: string | null = null;

    for (let i: number = 0; i < visiblePoints.length; i++) {
        const point: Points = visiblePoints[i as number];
        point.symbolLocations = [];
        point.regions = [];
        //invalid range values (low/high)
        if (point.low == null || point.high == null) {
            point.visible = false;
            lowPoints[i as number] = null;
            highPoints[i as number] = null;
            continue;
        }
        let lowValue: number = Math.min(point.low as number, point.high as number);
        let highValue: number = Math.max(point.low as number, point.high as number);
        if (series.yAxis?.isAxisInverse) {
            const tempValue: number = lowValue;
            lowValue = highValue;
            highValue = tempValue;
        }

        const lowPoint: ChartLocationProps = getCoordinate(
            point.xValue,
            lowValue,
            series.xAxis,
            series.yAxis,
            isInverted,
            series
        );
        const highPoint: ChartLocationProps = getCoordinate(
            point.xValue,
            highValue,
            series.xAxis,
            series.yAxis,
            isInverted,
            series
        );

        const isGetEmptyPoint: boolean = !!point.isEmpty;
        if (!(isGetEmptyPoint && suppressLabelForEmpty)) {
            point.symbolLocations.push(highPoint);
            point.symbolLocations.push(lowPoint);
        }
        lowPoints[i as number] = lowPoint;
        highPoints[i as number] = highPoint;

        const width: number = Math.max(Math.abs(highPoint.x - lowPoint.x), markerWidth);
        const height: number = Math.max(Math.abs(highPoint.y - lowPoint.y), markerWidth);
        const rx: number = Math.min(lowPoint.x, highPoint.x) - (!isInverted ? markerWidth / 2 : 0);
        const ry: number = Math.min(lowPoint.y, highPoint.y) - (isInverted ? markerWidth / 2 : 0);
        point.regions.push({ x: rx, y: ry, width, height });

        const requiredPointSymbolLocations: ChartLocationProps[] = point.symbolLocations.slice();
        lineBaseInstance.storePointLocation(point, series, isInverted, getCoordinate);
        point.symbolLocations = requiredPointSymbolLocations;

        const customizedValues: string = applyPointRenderCallback(({
            seriesIndex: series.index as number,
            color: series.interior as string,
            xValue: point.xValue as number | Date | string | null,
            yValue: point.yValue as number | Date | string | null
        }), series.chart);

        point.interior = customizedValues;
        series.interior = customizedValues;
        if (!seriesFill && point.visible) { seriesFill = customizedValues; }
    }

    series.visiblePoints = visiblePoints;
    return { lowPoints, highPoints, visiblePoints, seriesFill };
}

/**
 * Partitions visible points into continuous segments separated by invisible points.
 *
 * @param {Points[]} visiblePoints - Point data with visibility flags.
 * @param {(ChartLocationProps | null)[]} lowPoints - Low boundary points.
 * @param {(ChartLocationProps | null)[]} highPoints - High boundary points.
 * @returns {Object[]} - Array of segments with low/high polylines.
 * @private
 */
function getVisibleRangeAreaSegments(
    visiblePoints: Points[],
    lowPoints: (ChartLocationProps | null)[],
    highPoints: (ChartLocationProps | null)[]
): RangeStepVisibleSegment[] {
    const segments: RangeStepVisibleSegment[] = [];
    let activeSegment: RangeStepVisibleSegment | null = null;
    for (let i: number = 0; i < visiblePoints.length; i++) {
        // Break segment on invisible point
        if (!visiblePoints[i as number].visible) {
            if (activeSegment) {
                segments.push(activeSegment);
                activeSegment = null;
            }
            continue;
        }
        const low: ChartLocationProps | null = lowPoints[i as number];
        const high: ChartLocationProps | null = highPoints[i as number];
        // Break segment on invalid range data
        if (!low || !high) {
            if (activeSegment) {
                segments.push(activeSegment);
                activeSegment = null;
            }
            continue;
        }
        // Start new segment if needed
        if (!activeSegment) {
            activeSegment = { low: [], high: [] };
        }
        activeSegment.low.push(low);
        activeSegment.high.push(high);
        // Close segment if next point is invisible or end reached
        if (i === visiblePoints.length - 1 || !visiblePoints[i + 1].visible) {
            segments.push(activeSegment);
            activeSegment = null;
        }
    }
    return segments;
}

/**
 * Renders a Range Step Area series for the chart.
 */
const RangeStepAreaSeriesRenderer: RangeAreaSeriesRendererType = {
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
            (renderedPathDRef as React.RefObject<Record<string, string>>).current = {};
        }

        const pathD: string = (pathOptions.d as string) || '';
        const id: string = pathOptions.id ? pathOptions.id.toString() : '';
        const isBorder: boolean = id.includes('_border_');
        const stepPosition: StepPosition = (currentSeries.step as StepPosition) || 'Left';

        const idParts: string[] = id.split('_');
        const seriesIndexStr: string = idParts.length > 0 ? idParts[idParts.length - 1] : '0';
        let  seriesIndex: number = parseInt(seriesIndexStr, 10);
        if (Number.isNaN(seriesIndex)) { seriesIndex = currentSeries.index ?? index; }
        const storedKey: string = `${isBorder ? 'border' : 'area'}_${seriesIndex}`;

        // Initial reveal animation via clip-path (reuse Area logic)
        if (enableAnimation) {
            const isInitial: boolean = isInitialRenderRef.current[index as number];
            if (isInitial) {
                // When complete, store final path
                if (animationProgress === 1) {
                    isInitialRenderRef.current[index as number] = false;
                    (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                }
                // Compute clip extent from commands
                const cmds: PathCommand[] = parsePathCommands(pathD);
                const coords: PathCommand[] = cmds.filter((c: PathCommand) => c.type !== 'Z' && c.coords.length >= 2);
                if (coords.length === 0) {
                    return {
                        strokeDasharray: isBorder ? (pathOptions.dashArray ?? 'none') : 'none',
                        strokeDashoffset: 0
                    };
                }
                const isInverted: boolean = currentSeries.chart?.requireInvertedAxis;
                if (!isInverted) {
                    const xSegment: number[] = coords.map((c: PathCommand) => c.coords[0]);
                    const minX: number = Math.min(...xSegment);
                    const maxX: number = Math.max(...xSegment);
                    const range: number = maxX - minX;
                    const animationWidth: number = Math.max(0, range * animationProgress);
                    const isXAxisInverse: boolean = currentSeries?.xAxis?.isAxisInverse;
                    const clipPathString: string = isXAxisInverse
                        ? `inset(0 0 0 ${Math.max(0, range - animationWidth)}px)`
                        : `inset(0 ${Math.max(0, range - animationWidth)}px 0 0)`;
                    return {
                        strokeDasharray: isBorder ? (pathOptions.dashArray ?? 'none') : 'none',
                        strokeDashoffset: 0,
                        animatedClipPath: clipPathString
                    };
                } else {
                    const ySegment: number[] = coords.map((c: PathCommand) => c.coords[1]);
                    const minY: number = Math.min(...ySegment);
                    const maxY: number = Math.max(...ySegment);
                    const range: number = maxY - minY;
                    const animationHeight: number = Math.max(0, range * animationProgress);
                    const clipPathString: string = `inset(${Math.max(0, range - animationHeight)}px 0 0 0)`;
                    return {
                        strokeDasharray: isBorder ? (pathOptions.dashArray ?? 'none') : 'none',
                        strokeDashoffset: 0,
                        animatedClipPath: clipPathString
                    };
                }
            } else if (
                pathD &&
                (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string]
            ) {
                // Live morphing between previous and current paths (no string-level padding)
                const storedD: string =
                    (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] || '';

                if (pathD !== storedD) {
                    const endPath: string = pathD;
                    const interpolatedD: string = isBorder
                        ? interpolateRangeStepBorderPath(storedD, endPath, animationProgress, stepPosition, currentSeries)
                        : interpolateRangeStepAreaPath(storedD, endPath, animationProgress, stepPosition, currentSeries);

                    if (animationProgress === 1) {
                        (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                    }

                    return {
                        strokeDasharray: isBorder ? (pathOptions.dashArray ?? 'none') : 'none',
                        strokeDashoffset: 0,
                        interpolatedD
                    };
                }
            }

            // Update stored path when animation finishes
            if (animationProgress === 1) {
                (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
            }
        }

        return {
            strokeDasharray: isBorder ? (pathOptions.dashArray ?? 'none') : 'none',
            strokeDashoffset: 0
        };
    },

    /**
     * The main rendering function that processes an entire step area range series and generates all required SVG paths.
     *
     * @param {SeriesProperties} series - Series configuration and data.
     * @param {boolean} isInverted - Flag indicating if axes are inverted.
     * @returns {RenderOptions[] | { options: RenderOptions[], marker: ChartMarkerProps }} - Rendered path options and optional marker.
     */
    render: (series: SeriesProperties, isInverted: boolean): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps; } => {
        const stepPosition: StepPosition = (series.step as StepPosition);
        const borderWidth: number = series.border?.width as number;
        const borderColor: string = series.border?.color ? series.border?.color : (series.interior as string);

        const { lowPoints, highPoints, visiblePoints, seriesFill } = buildRangeSeriesPointData(series, isInverted);
        const segments: RangeStepVisibleSegment[] = getVisibleRangeAreaSegments(
            visiblePoints, lowPoints, highPoints);

        const fillDirection: string = segments
            .map((segment: RangeStepVisibleSegment) => buildStepSegmentPath(
                segment.low, segment.high, stepPosition, series, false))
            .filter((path: string) => !!path)
            .join(' ')
            .trim();

        const borderDirection: string = borderWidth !== 0
            ? segments
                .map((segment: RangeStepVisibleSegment ) => buildStepSegmentPath(
                    segment.low, segment.high, stepPosition, series, true))
                .filter((path: string) => !!path)
                .join(' ')
                .trim()
            : '';

        const seriesName: string = `${series.chart.element.id}_Series_${series.index}`;

        const fillOptions: RenderOptions = {
            id: seriesName,
            fill: seriesFill as string,
            strokeWidth: 0,
            stroke: 'transparent',
            opacity: series.opacity,
            dashArray: series.dashArray,
            d: fillDirection
        };

        const options: RenderOptions[] = [fillOptions];

        if (borderWidth !== 0) {
            const borderName: string = `${series.chart.element.id}_Series_border_${series.index}`;
            const borderOptions: RenderOptions = {
                id: borderName,
                fill: 'transparent',
                strokeWidth: borderWidth,
                stroke: borderColor,
                opacity: 1,
                dashArray: series.border?.dashArray,
                d: borderDirection
            };
            options.push(borderOptions);
        }

        const marker: ChartMarkerProps | null =
            series.marker?.visible ? (MarkerRenderer.render(series) as Object) : null;

        return marker ? { options, marker } : options;
    }
};

export default RangeStepAreaSeriesRenderer;
