import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { AreaSeriesAnimateState, Points, RenderOptions, SeriesProperties, PathCommand } from '../../chart-area/chart-interfaces';
import { getPoint } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import { AnimationState } from './SeriesAnimation';
import AreaSeriesRenderer, { interpolateAreaPath, interpolateBorderPath, parsePathCommands } from './AreaSeriesRenderer';
import MarkerRenderer from './MarkerRenderer';

const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * Defines the contract for the Multi Colored Area Series Renderer module.
 */
interface MultiColoredAreaSeriesRendererType {
    /**
     * Calculates and returns animation properties for multi colored area series paths.
     */
    doAnimation: Function;
    /**
     * The main rendering function that processes an entire multi colored area series and generates all required SVG paths.
     */
    render: Function;
}

/**
 * Renderer for Multi-Colored Area series.
 * Splits the area path into colored segments based on axis values.
 * Supports initial left-to-right reveal animations per segment.
 * Handles data updates by morphing paths using specialized interpolation.
 */
const MultiColoredAreaSeriesRenderer: MultiColoredAreaSeriesRendererType = {
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
        const isInitial: boolean = isInitialRenderRef.current[index as number];
        const pathD: string = pathOptions.d as string;
        const id: string = pathOptions.id ? pathOptions.id.toString() : '';
        const isBorder: boolean = id.includes('_border_');
        const segmentMatch: RegExpMatchArray | null = id.match(/_Point_(\d+)/);
        const segmentIndex: number = segmentMatch ? parseInt(segmentMatch[1], 10) : index;
        const storedKey: string = `${isBorder ? 'border' : 'area'}_${currentSeries.index}_Point_${segmentIndex}`;
        const xAxisInverse: boolean = currentSeries?.xAxis?.isAxisInverse;
        const { minX: globalMinX, maxX: globalMaxX } = getSeriesXBounds(currentSeries);

        // Invalidate stored path cache for this series if X-bounds changed
        // (occurs on resize / axis transform). Use explicit types instead of `any`.
        {
            const boundsKey: string = `_series_bounds_${currentSeries.index}`;
            const cache: Record<string, string | {minX: number; maxX: number; }> = renderedPathDRef.current as Record<string, string |
            { minX: number; maxX: number }>;
            const cachedBounds : { minX: number; maxX: number; } | undefined = cache[boundsKey as string] as { minX: number; maxX: number }
            | undefined;
            const boundsChanged: boolean = !cachedBounds ||
                Math.abs(cachedBounds.minX - globalMinX) > 0.5 ||
                Math.abs(cachedBounds.maxX - globalMaxX) > 0.5;
            if (boundsChanged) {
                // Remove only keys related to this series to preserve other series cache
                const prefixArea : string = `area_${currentSeries.index}_`;
                const prefixBorder : string = `border_${currentSeries.index}_`;
                for (const key of Object.keys(cache)) {
                    if (key.indexOf(prefixArea) === 0 || key.indexOf(prefixBorder) === 0) {
                        delete cache[key as string];
                    }
                }
                // Store latest bounds with explicit shape
                cache[boundsKey as string] = { minX: globalMinX, maxX: globalMaxX };
            }
        }
        if (enableAnimation) {
            if (isInitial) {
                const partialD: string = isBorder
                    ? buildLeftToRightBorderReveal(pathD, animationProgress, xAxisInverse, globalMinX, globalMaxX)
                    : buildLeftToRightAreaReveal(pathD, animationProgress, xAxisInverse, globalMinX, globalMaxX);
                if (animationProgress === 1) {
                    isInitialRenderRef.current[index as number] = false;
                    (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] = pathD;
                }
                return {
                    strokeDasharray: isBorder ? (pathOptions.dashArray || 'none') : 'none',
                    strokeDashoffset: 0,
                    interpolatedD: partialD
                };
            }
            else if ((renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string] && pathD) {
                const storedD: string = (renderedPathDRef as React.RefObject<Record<string, string>>).current[storedKey as string];
                if (pathD !== storedD) {
                    const interpolatedD: string = isBorder
                        ? interpolateBorderPath(storedD, pathD, animationProgress)
                        : interpolateAreaPath(storedD, pathD, animationProgress);
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
        const origin: number = Math.max(series.yAxis.visibleRange.minimum, 0);
        const getCoordinate: Function = getPoint;
        const borderWidth: number = series.border?.width as number;
        const borderColor: string = series.border?.color ? series.border?.color : series.interior;
        const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series);
        let emptyPointDirection:  string = '';
        const isSinglePath: boolean = series.colorField === '';
        let startPoint: ChartLocationProps | null = null;
        let direction: string = '';
        let hasPoints: boolean = false;
        let previous: Points | null = null;
        const options: RenderOptions[] = [];
        for (let i: number = 0; i < visiblePoints.length; i++) {
            const point: Points = visiblePoints[i as number];
            const currentXValue: number = point.xValue as number;
            point.symbolLocations = [];
            point.regions = [];
            if (point.visible) {
                hasPoints = true;
                direction += AreaSeriesRenderer.getAreaPathDirection(currentXValue, origin, series, isInverted, getCoordinate, startPoint, startPoint === null ? 'M' : 'L');
                startPoint = { x: currentXValue, y: origin };
                const firstPoint: ChartLocationProps = getCoordinate(currentXValue, point.yValue as number,
                                                                     series.xAxis, series.yAxis, isInverted, series);
                if (!isSinglePath && previous && setPointColor(point, previous, series)) {
                    const startRegion: ChartLocationProps = getCoordinate(startPoint.x, origin, series.xAxis,
                                                                          series.yAxis, isInverted, series);
                    direction += `L ${firstPoint.x} ${firstPoint.y} `;
                    direction += `L ${firstPoint.x} ${startRegion.y} `;
                    const name: string = `${series.chart.element.id}_Series_${series.index}_Point_${previous.index}`;
                    options.push({
                        id: name,
                        fill: previous.interior || series.interior,
                        strokeWidth: 0,
                        stroke: 'transparent',
                        opacity: series.opacity,
                        dashArray: series.dashArray,
                        d: direction
                    });
                    direction = `M ${firstPoint.x} ${startRegion.y} L ${firstPoint.x} ${firstPoint.y} `;
                } else {
                    direction += `L ${firstPoint.x} ${firstPoint.y} `;
                    setPointColor(point, null, series);
                }
                if (visiblePoints[i + 1] && !visiblePoints[i + 1].visible && series.emptyPointSettings?.mode !== 'Drop') {
                    direction += AreaSeriesRenderer.getAreaEmptyDirection(
                        { x: point.xValue as number, y: origin },
                        startPoint, series, isInverted, getCoordinate
                    );
                    startPoint = null;
                }
                previous = point;
                lineBaseInstance.storePointLocation(point, series, isInverted, getCoordinate);
            }
        }
        series.visiblePoints = visiblePoints;
        if (hasPoints && previous) {
            const lastPointLoc: ChartLocationProps = getCoordinate(previous.xValue as number, origin, series.xAxis,
                                                                   series.yAxis, isInverted, series);
            if (isSinglePath) {
                direction += `L ${lastPointLoc.x} ${lastPointLoc.y} `;
                const name: string = `${series.chart.element.id}_Series_${series.index}`;
                options.push({
                    id: name,
                    fill: previous.interior || series.interior,
                    strokeWidth: 0,
                    stroke: 'transparent',
                    opacity: series.opacity,
                    dashArray: series.dashArray,
                    d: direction
                });
            } else if (direction) {
                const startRegion: ChartLocationProps = getCoordinate((startPoint as ChartLocationProps).x, origin,
                                                                      series.xAxis, series.yAxis, isInverted, series);
                direction += `L ${lastPointLoc.x} ${lastPointLoc.y} `;
                direction += `L ${lastPointLoc.x} ${startRegion.y} `;
                const name: string = `${series.chart.element.id}_Series_${series.index}`;
                options.push({
                    id: name,
                    fill: previous.interior || series.interior,
                    strokeWidth: 0,
                    stroke: 'transparent',
                    opacity: series.opacity,
                    dashArray: series.dashArray,
                    d: direction
                });
            }
        }
        if (borderWidth !== 0) {
            const borderName: string = `${series.chart.element.id}_Series_border_${series.index}`;
            emptyPointDirection = lineBaseInstance.removeEmptyPointsBorder(getBorderDirection(direction));
            options.push({
                id: borderName,
                fill: 'transparent',
                strokeWidth: borderWidth,
                stroke: borderColor,
                opacity: 1,
                dashArray: series.border?.dashArray,
                d: emptyPointDirection
            });
        }
        const marker: ChartMarkerProps | null = series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
        return marker ? { options, marker } : options;
    }
};

/**
 * Determines the interior color for a point based on segment boundaries and
 * optional colorField. If colorField is empty, uses the segments configuration;
 * otherwise, it compares computed colors to detect color change boundaries.
 *
 * @param {Points} currentPoint - Current data point.
 * @param {Points | null} previous - Previous point, used to detect color changes.
 * @param {SeriesProperties} series - Series configuration.
 * @returns {boolean} True if a color boundary was crossed between previous and current points.
 * @private
 */
export function setPointColor(currentPoint: Points, previous: Points | null, series: SeriesProperties): boolean {
    if (series.colorField === '') {
        if (currentPoint.interior == null) {
            currentPoint.interior = series.interior;
        }
        return false;
    } else {
        if (previous) {
            const currentColor: string = currentPoint.interior || series.interior;
            const previousColor: string = previous.interior || series.interior;
            return currentColor !== previousColor;
        } else {
            return false;
        }
    }
}

/**
 * Builds a partially revealed area path from left-to-right (or inverted direction)
 * based on a global progress value and optional global X-bounds.
 *
 * @param {string} fullAreaPath - Target full area path 'd' string.
 * @param {number} progress - Animation progress in [0, 1].
 * @param {boolean} [isXAxisInverted] - Whether the x-axis is inverse (reverses reveal direction).
 * @param {number} [globalMinX] - Global minimum X for synchronized reveal across segments.
 * @param {number} [globalMaxX] - Global maximum X for synchronized reveal across segments.
 * @returns {string} The partially revealed area path.
 * @private
 */
export function buildLeftToRightAreaReveal(fullAreaPath: string, progress: number, isXAxisInverted?: boolean, globalMinX?: number,
                                           globalMaxX?: number): string {
    const pathCommands: PathCommand[] = parsePathCommands(fullAreaPath);
    if (!pathCommands.length) { return fullAreaPath; }
    type AreaSegment = { baselineX: number; baselineY: number; upperPolylinePoints: Array<{ chartX: number; chartY: number }> };
    const areaSegments: AreaSegment[] = [];
    let currentSegment: AreaSegment | null = null;
    for (const command of pathCommands) {
        if (command.type === 'M' && command.coords.length >= 2) {
            if (currentSegment && currentSegment.upperPolylinePoints.length) {
                areaSegments.push(currentSegment);
            }
            const moveChartX: number = command.coords[0];
            const moveChartY: number = command.coords[1];
            currentSegment = {
                baselineX: moveChartX,
                baselineY: moveChartY,
                upperPolylinePoints: []
            };
        } else if (command.type === 'L' && command.coords.length >= 2 && currentSegment) {
            const lineChartX: number = command.coords[0];
            const lineChartY: number = command.coords[1];
            if (lineChartY !== currentSegment.baselineY) {
                currentSegment.upperPolylinePoints.push({ chartX: lineChartX, chartY: lineChartY });
            }
        }
    }
    if (currentSegment && currentSegment.upperPolylinePoints.length) {
        areaSegments.push(currentSegment);
    }
    if (!areaSegments.length) { return fullAreaPath; }
    const allChartXValues: number[] = [];
    for (const segment of areaSegments) {
        for (const point of segment.upperPolylinePoints) { allChartXValues.push(point.chartX); }
    }
    const computedMinX: number = allChartXValues.length ? Math.min(...allChartXValues) : areaSegments[0].baselineX;
    const computedMaxX: number = allChartXValues.length ? Math.max(...allChartXValues) : areaSegments[areaSegments.length - 1].baselineX;
    const minRevealX: number = globalMinX ?? computedMinX;
    const maxRevealX: number = globalMaxX ?? computedMaxX;
    const revealSpanX: number = Math.max(1e-6, maxRevealX - minRevealX);
    const normalizedProgress: number = Math.max(0, Math.min(1, isXAxisInverted ? 1 - progress : progress));
    const revealCutoffX: number = minRevealX + normalizedProgress * revealSpanX;
    let revealedPath: string = '';
    let hasRevealedAnySegment: boolean = false;
    for (const segment of areaSegments) {
        if (!segment.upperPolylinePoints.length) { continue; }
        const segmentMinX: number = segment.upperPolylinePoints[0].chartX;
        const segmentMaxX: number = segment.upperPolylinePoints[segment.upperPolylinePoints.length - 1].chartX;
        if (revealCutoffX >= segmentMaxX) {
            revealedPath += `M ${segment.baselineX} ${segment.baselineY}`;
            for (const point of segment.upperPolylinePoints) {
                revealedPath += ` L ${point.chartX} ${point.chartY}`;
            }
            revealedPath += ` L ${segmentMaxX} ${segment.baselineY} L ${segment.baselineX} ${segment.baselineY}`;
            hasRevealedAnySegment = true;
            continue;
        }
        if (revealCutoffX <= segmentMinX) {
            if (!hasRevealedAnySegment) {
                revealedPath = `M ${segment.baselineX} ${segment.baselineY} L ${segmentMinX} ${segment.baselineY} L ${segment.baselineX} ${segment.baselineY}`;
            }
            return revealedPath || `M ${areaSegments[0].baselineX} ${areaSegments[0].baselineY}`;
        }
        revealedPath += `M ${segment.baselineX} ${segment.baselineY}`;
        let polylineIndex: number = 0;
        while (polylineIndex < segment.upperPolylinePoints.length &&
          segment.upperPolylinePoints[polylineIndex as number].chartX <= revealCutoffX) {
            const pointOnUpperLine: { chartX: number, chartY: number } = segment.upperPolylinePoints[polylineIndex as number];
            revealedPath += ` L ${pointOnUpperLine.chartX} ${pointOnUpperLine.chartY}`;
            polylineIndex++;
        }
        if (polylineIndex > 0 && polylineIndex < segment.upperPolylinePoints.length) {
            const leftUpperPoint: { chartX: number, chartY: number } = segment.upperPolylinePoints[polylineIndex - 1];
            const rightUpperPoint: { chartX: number, chartY: number } = segment.upperPolylinePoints[polylineIndex as number];
            const interpolationFactor: number = (revealCutoffX - leftUpperPoint.chartX) /
                                                 Math.max(1e-6, rightUpperPoint.chartX - leftUpperPoint.chartX);
            const interpolatedChartY: number = leftUpperPoint.chartY +
                                               (rightUpperPoint.chartY - leftUpperPoint.chartY) * interpolationFactor;
            revealedPath += ` L ${revealCutoffX} ${interpolatedChartY}`;
        }
        revealedPath += ` L ${revealCutoffX} ${segment.baselineY} L ${segment.baselineX} ${segment.baselineY}`;
        hasRevealedAnySegment = true;
        return revealedPath;
    }
    return hasRevealedAnySegment ? revealedPath : fullAreaPath;
}

/**
 * Builds a partially revealed border (polyline) path from left-to-right (or inverted direction)
 * based on a global progress value and optional global X-bounds.
 *
 * @param {string} fullBorderPath - Target full border path 'd' string.
 * @param {number} progress - Animation progress in [0, 1].
 * @param {boolean} [isXAxisInverted] - Whether the x-axis is inverse (reverses reveal direction).
 * @param {number} [globalMinX] - Global minimum X for synchronized reveal across segments.
 * @param {number} [globalMaxX] - Global maximum X for synchronized reveal across segments.
 * @returns {string} The partially revealed border path.
 * @private
 */
export function buildLeftToRightBorderReveal(fullBorderPath: string, progress: number, isXAxisInverted?: boolean, globalMinX?: number,
                                             globalMaxX?: number): string {
    const pathCommands: PathCommand[] = parsePathCommands(fullBorderPath);
    if (!pathCommands.length) { return fullBorderPath; }
    type BorderSegment = { startPoint: { chartX: number; chartY: number }; polylinePoints: Array<{ chartX: number; chartY: number }> };
    const borderSegments: BorderSegment[] = [];
    let currentSegment: BorderSegment | null = null;
    for (const command of pathCommands) {
        if (command.type === 'M' && command.coords.length >= 2) {
            if (currentSegment && (currentSegment.polylinePoints.length || currentSegment.startPoint)) {
                borderSegments.push(currentSegment);
            }
            currentSegment = {
                startPoint: { chartX: command.coords[0], chartY: command.coords[1] },
                polylinePoints: []
            };
        } else if (command.type === 'L' && command.coords.length >= 2 && currentSegment) {
            currentSegment.polylinePoints.push({ chartX: command.coords[0], chartY: command.coords[1] });
        }
    }
    if (currentSegment && (currentSegment.polylinePoints.length || currentSegment.startPoint)) {
        borderSegments.push(currentSegment);
    }
    if (!borderSegments.length) { return fullBorderPath; }
    const allChartXValues: number[] = [];
    for (const segment of borderSegments) {
        allChartXValues.push(segment.startPoint.chartX,
                             ...segment.polylinePoints.map((point: { chartX: number, chartY: number }) => point.chartX));
    }
    const computedGlobalMinX: number = globalMinX ?? Math.min(...allChartXValues);
    const computedGlobalMaxX: number = globalMaxX ?? Math.max(...allChartXValues);
    const globalSpanX: number = Math.max(1e-6, computedGlobalMaxX - computedGlobalMinX);
    const normalizedProgress: number = Math.max(0, Math.min(1, isXAxisInverted ? 1 - progress : progress));
    const revealCutoffX: number = computedGlobalMinX + normalizedProgress * globalSpanX;
    let revealedPath: string = '';
    let hasRevealedAnySegment: boolean = false;
    for (const segment of borderSegments) {
        const segmentChartXValues: number[] = [segment.startPoint.chartX,
            ...segment.polylinePoints.map((point: { chartX: number, chartY: number }) => point.chartX)];
        const segmentMinX: number = Math.min(...segmentChartXValues);
        const segmentMaxX: number = Math.max(...segmentChartXValues);
        if (revealCutoffX <= segmentMinX) {
            if (!hasRevealedAnySegment) {
                revealedPath = `M ${segment.startPoint.chartX} ${segment.startPoint.chartY}`;
            }
            return revealedPath || `M ${borderSegments[0].startPoint.chartX} ${borderSegments[0].startPoint.chartY}`;
        }
        if (revealCutoffX >= segmentMaxX) {
            revealedPath += (revealedPath ? ' ' : '') + `M ${segment.startPoint.chartX} ${segment.startPoint.chartY}`;
            for (const polylinePoint of segment.polylinePoints) {
                revealedPath += ` L ${polylinePoint.chartX} ${polylinePoint.chartY}`;
            }
            hasRevealedAnySegment = true;
            continue;
        }
        revealedPath += (revealedPath ? ' ' : '') + `M ${segment.startPoint.chartX} ${segment.startPoint.chartY}`;
        let polylineIndex: number = 0;
        while (polylineIndex < segment.polylinePoints.length && segment.polylinePoints[polylineIndex as number].chartX <= revealCutoffX) {
            const polylinePoint: { chartX: number, chartY: number } = segment.polylinePoints[polylineIndex as number];
            revealedPath += ` L ${polylinePoint.chartX} ${polylinePoint.chartY}`;
            polylineIndex++;
        }
        if (polylineIndex > 0 && polylineIndex < segment.polylinePoints.length) {
            const leftPolylinePoint: { chartX: number, chartY: number } = segment.polylinePoints[polylineIndex - 1];
            const rightPolylinePoint: { chartX: number, chartY: number } = segment.polylinePoints[polylineIndex as number];
            const interpolationFactor: number = (revealCutoffX - leftPolylinePoint.chartX) /
                                                 Math.max(1e-6, rightPolylinePoint.chartX - leftPolylinePoint.chartX);
            const interpolatedChartY: number = leftPolylinePoint.chartY +
                                               (rightPolylinePoint.chartY - leftPolylinePoint.chartY) * interpolationFactor;
            revealedPath += ` L ${revealCutoffX} ${interpolatedChartY}`;
        }
        hasRevealedAnySegment = true;
        return revealedPath;
    }
    return hasRevealedAnySegment ? revealedPath : fullBorderPath;
}

/**
 * Extracts the border (top line) path direction from a full area path direction
 * by removing the final three coordinates used to close to the baseline.
 *
 * @param {string} direction - Full area path direction string.
 * @returns {string} Border-only path direction string.
 * @private
 */
export function getBorderDirection(direction: string): string {
    const coordinates: string[] = direction.split(' ');
    if (coordinates.length > 3) {
        coordinates.splice(coordinates.length - 4, 3);
    }
    return coordinates.join(' ');
}

/**
 * Computes the minimum and maximum X-coordinate (in chart coordinates) across
 * all visible points of a series. This avoids caching pixel bounds which can
 * become stale when the chart is resized or axis transforms change.
 *
 * @param {SeriesProperties} series - Series whose visible points will be inspected.
 * @returns {{ minX: number, maxX: number }} The computed X-bounds in pixels.
 * @private
 */
export function getSeriesXBounds(series: SeriesProperties): { minX: number; maxX: number } {
    const isInverted: boolean = series.chart?.requireInvertedAxis;
    let minX: number = Number.POSITIVE_INFINITY;
    let maxX: number = Number.NEGATIVE_INFINITY;
    const visiblePoints: Points[] = series.visiblePoints || [];
    for (let pointIndex: number = 0; pointIndex < visiblePoints.length; pointIndex++) {
        const point: Points = visiblePoints[pointIndex as number];
        if (!point || !point.visible) {
            continue;
        }
        const projectedPoint: ChartLocationProps = getPoint(
            point.xValue as number,
            point.yValue as number,
            series.xAxis,
            series.yAxis,
            isInverted
        );
        if (Number.isFinite(projectedPoint.x)) {
            if (projectedPoint.x < minX) {
                minX = projectedPoint.x;
            }
            if (projectedPoint.x > maxX) {
                maxX = projectedPoint.x;
            }
        }
    }
    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || minX === maxX) {
        minX = isFinite(minX) ? minX : 0;
        maxX = isFinite(maxX) ? maxX + 1 : minX + 1;
    }
    return { minX, maxX };
}

export default MultiColoredAreaSeriesRenderer;
