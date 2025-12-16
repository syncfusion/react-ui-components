import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { AreaSeriesAnimateState, PathCommand, Points, RangeAreaSeriesRendererType, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { applyPointRenderCallback, getPoint } from '../../utils/helper';
import { parsePathCommands } from './AreaSeriesRenderer';
import { LineBase, LineBaseReturnType } from './LineBase';
import MarkerRenderer from './MarkerRenderer';
import { equalizePolyline, splitRangeAreaSegment } from './RangeBase';
import { AnimationState, interpolatePathD } from './SeriesAnimation';

const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * Interpolates two polylines into a path string using linear interpolation.
 *
 * @param {ChartLocationProps[]} startPts - Starting polyline points.
 * @param {ChartLocationProps[]} endPts - Ending polyline points.
 * @param {number} timeForInterpolation - Interpolation progress (0 to 1).
 * @returns {string} - Interpolated path string.
 * @private
 */
function interpolatePolylinePath(startPts: ChartLocationProps[], endPts: ChartLocationProps[], timeForInterpolation: number): string {
    const { firstSegment: startSegment, secondSegment: endSegment } = equalizePolyline(startPts, endPts);
    if (startSegment.length === 0) { return ''; }

    // Snap to 3 decimals to reduce sub-pixel shimmer
    const fx: (v: number) => number = (v: number) => Math.round(v * 1000) / 1000;

    let interpolatedPath: string = `M ${fx(startSegment[0].x + (endSegment[0].x - startSegment[0].x)
        * timeForInterpolation)} ${fx(startSegment[0].y + (endSegment[0].y - startSegment[0].y) * timeForInterpolation)} `;
    for (let i: number = 1; i < startSegment.length; i++) {
        const interpolatedX: number = startSegment[i as number].x + (endSegment[i as number].x
            - startSegment[i as number].x) * timeForInterpolation;
        const interpolatedY: number = startSegment[i as number].y + (endSegment[i as number].y
            - startSegment[i as number].y) * timeForInterpolation;
        interpolatedPath += `L ${fx(interpolatedX)} ${fx(interpolatedY)} `;
    }
    return interpolatedPath;
}

/**
 * Interpolates Range-Area fill paths across multiple segments.
 * Falls back to generic interpolation if structure is invalid.
 *
 * @param {string} startD - Starting path string.
 * @param {string} endD - Ending path string.
 * @param {number} progress - Animation progress (0 to 1).
 * @returns {string} - Interpolated path string.
 * @private
 */
export function interpolateRangeAreaPath(startD: string, endD: string, progress: number): string {
    if (!startD || !endD) { return endD || startD || ''; }

    const startCommands: PathCommand[] = parsePathCommands(startD);
    const endCommands: PathCommand[] = parsePathCommands(endD);
    if (startCommands.length === 0 || endCommands.length === 0) {
        // Fallback to generic path interpolation if we can't parse
        return interpolatePathD(startD, endD, progress);
    }

    let startIndex: number = 0;
    let endIndex: number = 0;
    let result: string = '';

    // Iterate segments; best-effort if counts differ
    while (startIndex < startCommands.length || endIndex < endCommands.length) {
        while (startIndex < startCommands.length && startCommands[startIndex as number].type !== 'M') { startIndex++; }
        while (endIndex < endCommands.length && endCommands[endIndex as number].type !== 'M') { endIndex++; }
        if (startIndex >= startCommands.length && endIndex >= endCommands.length) { break; }

        const startSegment: {
            low: ChartLocationProps[];
            high: ChartLocationProps[];
            nextIndex: number;
            closedWithZ: boolean;
        } | null = startIndex < startCommands.length ? splitRangeAreaSegment(startCommands, startIndex) : null;
        const endSegment: {
            low: ChartLocationProps[];
            high: ChartLocationProps[];
            nextIndex: number;
            closedWithZ: boolean;
        } | null = endIndex < endCommands.length ? splitRangeAreaSegment(endCommands, endIndex) : null;

        if (!startSegment || !endSegment) {
            // Fallback for irregular structures
            return interpolatePathD(startD, endD, progress);
        }

        const lowPath: string = interpolatePolylinePath(startSegment.low, endSegment.low, progress);
        let highPath: string = interpolatePolylinePath(startSegment.high, endSegment.high, progress);

        if (lowPath && highPath.startsWith('M')) {
            highPath = highPath.replace(/^M\s+/, 'L ');
        }

        result += lowPath + highPath;
        if (startSegment.closedWithZ || endSegment.closedWithZ) {
            result += 'Z ';
        }

        startIndex = startSegment.nextIndex;
        endIndex = endSegment.nextIndex;
    }

    return result.trim();
}


/**
 * Interpolates Range-Area border paths consisting of low and high edge polylines.
 *
 * @param {string} startD - Starting border path string.
 * @param {string} endD - Ending border path string.
 * @param {number} progress - Animation progress (0 to 1).
 * @returns {string} - Interpolated border path string.
 * @private
 */
export function interpolateRangeBorderPath(startD: string, endD: string, progress: number): string {
    if (!startD || !endD) { return endD || startD || ''; }

    const startCommands: PathCommand[] = parsePathCommands(startD);
    const endCommands: PathCommand[] = parsePathCommands(endD);
    if (startCommands.length === 0 || endCommands.length === 0) {
        return interpolatePathD(startD, endD, progress);
    }

    const extractPolylines: (commands: PathCommand[]) => ChartLocationProps[][] = (commands: PathCommand[]): ChartLocationProps[][] => {
        const polylines: ChartLocationProps[][] = [];
        let index: number = 0;
        while (index < commands.length) {
            while (index < commands.length && commands[index as number].type !== 'M') { index++; }
            if (index >= commands.length) { break; }
            const currentPolyline: ChartLocationProps[] = [{ x: commands[index as number].coords[0],
                y: commands[index as number].coords[1] }];
            index++;
            while (index < commands.length && commands[index as number].type === 'L') {
                currentPolyline.push({ x: commands[index as number].coords[0], y: commands[index as number].coords[1] });
                index++;
            }
            polylines.push(currentPolyline);
        }
        return polylines;
    };

    const startPolylines: ChartLocationProps[][] = extractPolylines(startCommands);
    const endPolylines: ChartLocationProps[][] = extractPolylines(endCommands);

    const segmentCount: number = Math.max(startPolylines.length, endPolylines.length);
    let interpolatedPath: string = '';

    for (let i: number = 0; i < segmentCount; i++) {
        const startSegment: ChartLocationProps[] = startPolylines[Math.min(i, startPolylines.length - 1)] ?? [];
        const endSegment: ChartLocationProps[] = endPolylines[Math.min(i, endPolylines.length - 1)] ?? [];
        interpolatedPath += interpolatePolylinePath(startSegment, endSegment, progress);
    }

    return interpolatedPath.trim();
}

/**
 * Renders a Range Area series for the chart.
 */
const RangeAreaSeriesRenderer: RangeAreaSeriesRendererType = {
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

        // We keep the same storage keys as Area renderer for compatibility
        const idParts: string[] = id.split('_');
        const seriesIndexStr: string = idParts.length > 0 ? idParts[idParts.length - 1] : '0';
        const seriesIndex: number = parseInt(seriesIndexStr, 10);
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
                    const maChartLocationProps: number = Math.max(...ySegment);
                    const range: number = maChartLocationProps - minY;
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
                        ? interpolateRangeBorderPath(storedD, endPath, animationProgress)
                        : interpolateRangeAreaPath(storedD, endPath, animationProgress);

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
     * The main rendering function that processes an entire area series and generates all required SVG paths.
     *
     * @param {SeriesProperties} series - Series configuration and data.
     * @param {boolean} isInverted - Flag indicating if axes are inverted.
     * @returns {RenderOptions[] | { options: RenderOptions[], marker: ChartMarkerProps }} - Rendered path options and optional marker.
     */
    render: (series: SeriesProperties, isInverted: boolean): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps; } => {
        const getCoordinate: Function = getPoint;
        let seriesFill: string | undefined;
        const borderWidth: number = series.border?.width as number;
        const borderColor: string = series.border?.color ? series.border?.color : seriesFill as string;

        const emptyPointMode: string = (series.emptyPointSettings?.mode as string);
        const supressLabelForEmpty: boolean = !(emptyPointMode === 'Average' || emptyPointMode === 'Zero');
        const visiblePoints: Points[] = (LineBase as LineBaseReturnType).enableComplexProperty(series);
        let point: Points;

        let fillDirection: string = '';
        let borderDirection: string = '';

        // Track current open segment [startIndex, ... i]
        let segmentOpen: boolean = false;
        let segmentStartIndex: number = -1;

        // Cache normalized high/low screen points to reuse when closing segments
        const lowPoints: (ChartLocationProps | null)[] = new Array(visiblePoints.length).fill(null);
        const highPoints: (ChartLocationProps | null)[] = new Array(visiblePoints.length).fill(null);

        for (let i: number = 0; i < visiblePoints.length; i++) {
            point = visiblePoints[i as number];
            point.symbolLocations = [];
            point.regions = [];

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

            const isGetEmptyPoint: boolean = point.isEmpty === true;
            if (!(isGetEmptyPoint && supressLabelForEmpty)) {
                point.symbolLocations.push(highPoint);
                point.symbolLocations.push(lowPoint);
            }
            highPoints[i as number] = highPoint;
            lowPoints[i as number] = lowPoint;

            // Region: rect spanning high/low pair (expanded for marker size/orientation)
            const width: number = Math.max(Math.abs(highPoint.x - lowPoint.x), series.marker?.width as number);
            const heigth: number = Math.max(Math.abs(highPoint.y - lowPoint.y), series.marker?.width as number);
            const rx: number = Math.min(lowPoint.x, highPoint.x) - (!isInverted ? (series.marker?.width as number) / 2 : 0);
            const ry: number = Math.min(lowPoint.y, highPoint.y) - (isInverted ? (series.marker?.width as number) / 2 : 0);
            point.regions.push({
                x: rx,
                y: ry,
                width: width,
                height: heigth
            });

            // Store locations for marker/hit tests
            const requiredPointSymbolLocations: ChartLocationProps[] = point.symbolLocations.slice(); // [high, low]
            (lineBaseInstance as LineBaseReturnType).storePointLocation(point, series, isInverted, getCoordinate);
            point.symbolLocations = requiredPointSymbolLocations; // prevent baseline marker from being added

            const customizedValues: string = applyPointRenderCallback(({
                seriesIndex: series.index as number, color: series.interior as string,
                xValue: point.xValue as number | Date | string | null,
                yValue: point.yValue as number | Date | string | null
            }), series.chart);
            point.interior = customizedValues;
            series.interior = customizedValues;

            if (!seriesFill && point.visible) { seriesFill = customizedValues; }
        }

        series.visiblePoints = visiblePoints;

        // Build fill and border directions segment-by-segment
        const closeSegment: (endIndexInclusive: number) => void = (endIndexInclusive: number) => {

            // Fill: append high backward from end -> start
            for (let j: number = endIndexInclusive; j >= segmentStartIndex; j--) {
                const highPointLocation: ChartLocationProps = highPoints[j as number] ?? {x: 0, y: 0};
                fillDirection += `L ${highPointLocation.x} ${highPointLocation.y} `;
                // Border: high edge is a new sub-path starting at the last point's high
                if (j === endIndexInclusive) {
                    borderDirection += `M ${highPointLocation.x} ${highPointLocation.y} `;
                } else {
                    borderDirection += `L ${highPointLocation.x} ${highPointLocation.y} `;
                }
            }
            // Close polygon
            fillDirection += 'Z ';

            segmentOpen = false;
            segmentStartIndex = -1;
        };

        for (let i: number = 0; i < visiblePoints.length; i++) {
            const point: Points = visiblePoints[i as number];
            const usable: boolean = !!point.visible;

            if (usable) {
                const lowPoint: ChartLocationProps = lowPoints[i as number] ?? {x: 0 , y: 0};
                if (!segmentOpen) {
                    fillDirection += `M ${lowPoint.x} ${lowPoint.y} `;
                    borderDirection += `M ${lowPoint.x} ${lowPoint.y} `;
                    segmentOpen = true;
                    segmentStartIndex = i;
                } else {
                    fillDirection += `L ${lowPoint.x} ${lowPoint.y} `;
                    borderDirection += `L ${lowPoint.x} ${lowPoint.y} `;
                }

                const nextInvisible: boolean = i + 1 < visiblePoints.length && !visiblePoints[i + 1].visible;
                if ((nextInvisible) || i === visiblePoints.length - 1) {
                    closeSegment(i);
                }
            }
        }

        // Compose options
        const seriesName: string = `${series.chart.element.id}_Series_${series.index}`;

        const fillOptions: RenderOptions = {
            id: seriesName,
            fill: seriesFill as string,
            strokeWidth: 0,
            stroke: 'transparent',
            opacity: series.opacity,
            dashArray: series.dashArray,
            d: fillDirection.trim()
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
                d: borderDirection.trim()
            };
            options.push(borderOptions);
        }

        const marker: ChartMarkerProps | null =
            series.marker?.visible ? (MarkerRenderer.render(series) as Object) : null;

        return marker ? { options, marker } : options;
    }
};

export default RangeAreaSeriesRenderer;

