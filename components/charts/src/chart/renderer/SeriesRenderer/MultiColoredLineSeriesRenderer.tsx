import { withInRange, getPoint } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import { calculatePathAnimation } from './SeriesAnimation';
import MarkerRenderer from './MarkerRenderer';
import { getLineDirection } from './lineSeriesRenderer';
import { AxisModel, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';

const lineBaseInstance: LineBaseReturnType = LineBase;

interface LineSegmentRenderOptions extends RenderOptions {
    computedPathLength?: number;
    totalPathLength?: number;
    cumulativeStartLength?: number;
}

type AnimationState = {
    previousPathLengthRef: React.RefObject<number[]>;
    isInitialRenderRef: React.RefObject<boolean[]>;
    renderedPathDRef: React.RefObject<string[]>;
    animationProgress: number;
    isFirstRenderRef: React.RefObject<boolean>;
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
};

type AnimationResult = {
    strokeDasharray: string | number;
    strokeDashoffset: number;
    interpolatedD?: string;
};

type DoAnimation = (
    pathOptions: RenderOptions,
    index: number,
    animationState: AnimationState,
    enableAnimation: boolean,
    _currentSeries: SeriesProperties,
    _currentPoint: Points | undefined,
    _pointIndex: number,
    visibleSeries: SeriesProperties[]
) => AnimationResult;

/**
 * Handles animation for multi-colored line series.
 *
 * When path metrics are present and animation is enabled, computes per-segment
 * stroke-dash values to reveal the segment progressively. Otherwise delegates
 * to calculatePathAnimation to keep behavior identical to the Line series renderer.
 *
 * @param {Object} pathOptions - Rendering options for the current path segment.
 * @param {number} index - Segment index within the series.
 * @param {Object} animationState - Mutable refs and progress used for animation.
 * @param {boolean} enableAnimation - Whether animation is enabled.
 * @param {Object} _currentSeries - Current series (unused in this handler).
 * @param {Object|undefined} _currentPoint - Current point (unused in this handler).
 * @param {number} _pointIndex - Index of the current point (unused in this handler).
 * @param {Object[]} visibleSeries - All visible series.
 * @returns {{strokeDasharray: (string|number), strokeDashoffset: number, interpolatedD: (string|undefined)}}
 *          Stroke dash styling and optionally an interpolated path data string.
 */
export const doAnimation: DoAnimation = (
    pathOptions: RenderOptions,
    index: number,
    animationState: AnimationState,
    enableAnimation: boolean,
    _currentSeries: SeriesProperties,
    _currentPoint: Points | undefined,
    _pointIndex: number,
    visibleSeries: SeriesProperties[]
) => {
    const lineSegmentOptions: LineSegmentRenderOptions = pathOptions as LineSegmentRenderOptions;

    const hasPathMetrics: boolean =
        lineSegmentOptions.computedPathLength !== undefined &&
        lineSegmentOptions.totalPathLength !== undefined &&
        lineSegmentOptions.cumulativeStartLength !== undefined;

    if (enableAnimation && hasPathMetrics) {
        const segmentPathLength: number = lineSegmentOptions.computedPathLength as number;
        const totalPathLength: number = lineSegmentOptions.totalPathLength as number;
        const cumulativeStartLength: number = lineSegmentOptions.cumulativeStartLength as number;
        const animationProgress: number = animationState.animationProgress;
        const totalDrawnLength: number = animationProgress * totalPathLength;

        let segmentDrawnLength: number = 0;
        if (totalDrawnLength > cumulativeStartLength) {
            segmentDrawnLength = Math.min(totalDrawnLength - cumulativeStartLength, segmentPathLength);
        }

        const segmentProgress: number = segmentPathLength > 0 ? segmentDrawnLength / segmentPathLength : 1;
        const segmentStrokeDashArray: number = segmentPathLength;
        const segmentStrokeDashOffset: number = segmentPathLength * (1 - segmentProgress);

        if (animationState.previousPathLengthRef.current) {
            animationState.previousPathLengthRef.current[index as number] = segmentPathLength;
        }

        return {
            strokeDasharray: segmentStrokeDashArray,
            strokeDashoffset: segmentStrokeDashOffset,
            interpolatedD: undefined
        };
    }
    return calculatePathAnimation(pathOptions, index, animationState, enableAnimation, visibleSeries);
};

/**
 * Determines the color for a point based on colorField and sets it on the point.
 * Returns true if the color changed from the previous point, false otherwise.
 *
 * @param {Points} currentPoint - The current point to evaluate.
 * @param {(Points|null)} previous - The previous point for context (e.g., for transitions).
 * @param {SeriesProperties} series - The series configuration.
 * @returns {boolean} True if color changed, false otherwise.
 * @private
 */
const setPointColor: (currentPoint: Points, previous: Points | null, series: SeriesProperties & {
    colorField?: string;
    interior?: string;
}) => boolean = (
    currentPoint: Points,
    previous: Points | null,
    series: SeriesProperties & { colorField?: string; interior?: string }
): boolean => {
    const defaultInteriorColor: string = series.interior;
    const previousPointColor: string = previous ? (previous.interior || defaultInteriorColor) : defaultInteriorColor;
    let resolvedPointColor: string = defaultInteriorColor;

    if (series.colorField && series.colorField !== '') {
        const colorMappingKey: keyof Points = series.colorField as keyof Points;

        // Allowed value types when probing color field
        type ProbeValue = string | number | boolean | Date | null | undefined;

        // Try to get color from the current point
        let rawColorValue: ProbeValue = currentPoint[colorMappingKey as keyof Points] as ProbeValue;

        // Fallback to the original series points if not present in currentPoint
        if ((rawColorValue === undefined || rawColorValue === null || rawColorValue === '') && Array.isArray(series.points)) {
            const sourcePoint: Points | undefined = series.points[currentPoint.index];
            if (sourcePoint) {
                rawColorValue = sourcePoint[colorMappingKey as keyof Points] as ProbeValue;
            }
        }

        // Define a structural type for dataSource lookups
        type ColorSource = Partial<Record<keyof Points, string | null | undefined>>;

        // Fallback to the data source if available
        const dsContainer: {
            dataSource?: Partial<Record<keyof Points, string | null | undefined>>[] | undefined;
        } = series as { dataSource?: ColorSource[] };
        if ((rawColorValue === undefined || rawColorValue === null || rawColorValue === '') && Array.isArray(dsContainer.dataSource)) {
            const dataSourceItem: ColorSource | undefined = dsContainer.dataSource![currentPoint.index];
            if (dataSourceItem) {
                rawColorValue = dataSourceItem[colorMappingKey as keyof Points] ?? rawColorValue;
            }
        }

        resolvedPointColor =
            typeof rawColorValue === 'string' && rawColorValue.trim() ? rawColorValue : defaultInteriorColor;
    }

    currentPoint.interior = resolvedPointColor;
    return previousPointColor.toLowerCase() !== resolvedPointColor.toLowerCase();
};

/**
 * Renders a multi-colored line series by splitting path segments when color changes occur
 *
 * Additional optional flags:
 * - pointAnimate: pass-through for axis-segment application behavior (mirrors EJ2 usage)
 * - pointUpdate: when true, avoids marker re-render in this call (mirrors EJ2 usage)
 *
 * @param {Object} series - The series to render.
 * @param {boolean} isInverted - Whether the chart uses an inverted axis.
 * @param {boolean} [pointUpdate=false] - If true, skips marker re-render during this call.
 * @returns {(Object[]|{options: Object[], marker: Object})} Render options array, or an object with options and a marker element.
 */
const render: (
    series: SeriesProperties,
    isInverted: boolean,
    pointUpdate?: boolean
) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } = (
    series: SeriesProperties,
    isInverted: boolean,
    pointUpdate: boolean = false
): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
    let previousPoint: Points | null = null;
    let currentSegmentPath: string = '';
    let currentSegmentColor: string | undefined = undefined;
    let currentSegmentPathLength: number = 0;

    const getPointCoordinate: (x: number,
        y: number,
        xAxis: AxisModel,
        yAxis: AxisModel,
        isInverted?: boolean) => ChartLocationProps = getPoint;
    const segmentRenderOptions: LineSegmentRenderOptions[] = [];
    const isDropMode: boolean = Boolean(series.emptyPointSettings && series.emptyPointSettings.mode === 'Drop');

    const visibleDataPoints: Points[] = lineBaseInstance.enableComplexProperty(series) || [];

    for (const currentPoint of visibleDataPoints) {
        currentPoint.regions = [];

        if (currentPoint.visible && withInRange(visibleDataPoints[currentPoint.index - 1],
                                                currentPoint, visibleDataPoints[currentPoint.index + 1], series)) {
            lineBaseInstance.storePointLocation(currentPoint, series, isInverted, getPointCoordinate);
            // Determine color and whether it changed
            let isColorChanged: boolean = false;
            if (series.colorField) {
                isColorChanged = setPointColor(currentPoint, previousPoint, series);
            }
            if (series.colorField && (currentPoint.interior == null || currentPoint.interior === '')) {
                currentPoint.interior = previousPoint?.interior ?? series.interior;
                isColorChanged = false;
            }
            // Guard: if setPointColor fell back to series.interior, keep previous color instead of splitting
            if (
                series.colorField &&
                isColorChanged &&
                previousPoint?.interior &&
                currentPoint.interior === series.interior &&
                previousPoint.interior !== series.interior
            ) {
                currentPoint.interior = previousPoint.interior;
                isColorChanged = false;
            }
            // Continue with existing logic
            if (!previousPoint) {
                currentSegmentColor = currentPoint.interior || series.interior;
                currentSegmentPath = `M ${currentPoint.symbolLocations![0].x} ${currentPoint.symbolLocations![0].y}`;
                currentSegmentPathLength = 0;
            } else {
                const previousLocation: ChartLocationProps | null = previousPoint.symbolLocations && previousPoint.symbolLocations[0];
                const currentLocation: ChartLocationProps | null = currentPoint.symbolLocations && currentPoint.symbolLocations[0];
                const deltaX: number = previousLocation && currentLocation ? currentLocation.x - previousLocation.x : 0;
                const deltaY: number = previousLocation && currentLocation ? currentLocation.y - previousLocation.y : 0;
                const segmentDistance: number = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                // Break segment on color change
                if (isColorChanged) {
                    if (currentSegmentPath !== '') {
                        segmentRenderOptions.push({
                            id: `${series.chart.element.id}_Series_${series.index}_Segment_${segmentRenderOptions.length}`,
                            d: currentSegmentPath,
                            fill: 'none',
                            stroke: currentSegmentColor,
                            strokeWidth: series.width,
                            opacity: series.opacity,
                            dashArray: series.dashArray,
                            ...(series.colorField ? { computedPathLength: currentSegmentPathLength } : {})
                        });
                    }
                    currentSegmentColor = currentPoint.interior || series.interior;
                    currentSegmentPath = `M ${previousPoint.symbolLocations![0].x} ${previousPoint.symbolLocations![0].y}`;
                    currentSegmentPath += ` L ${currentPoint.symbolLocations![0].x} ${currentPoint.symbolLocations![0].y}`;
                    currentSegmentPathLength = segmentDistance;
                } else {
                    currentSegmentPath += getLineDirection(previousPoint, currentPoint, series, isInverted, getPointCoordinate, 'L');
                    if (!currentSegmentColor) {
                        currentSegmentColor = currentPoint.interior || series.interior;
                    }
                    currentSegmentPathLength += segmentDistance;
                }
            }
            previousPoint = currentPoint;
        } else {
            if (currentSegmentPath !== '') {
                segmentRenderOptions.push({
                    id: `${series.chart.element.id}_Series_${series.index}_Segment_${segmentRenderOptions.length}`,
                    d: currentSegmentPath,
                    fill: 'none',
                    stroke: currentSegmentColor,
                    strokeWidth: series.width,
                    opacity: series.opacity,
                    dashArray: series.dashArray,
                    ...(series.colorField ? { computedPathLength: currentSegmentPathLength } : {})
                });
            }
            currentSegmentPath = '';
            currentSegmentColor = undefined;
            currentSegmentPathLength = 0;
            previousPoint = isDropMode ? previousPoint : null;
            currentPoint.symbolLocations = [];
        }
    }
    if (currentSegmentPath !== '' && currentSegmentColor !== undefined && previousPoint && previousPoint.symbolLocations && previousPoint.symbolLocations.length > 0) {
        segmentRenderOptions.push({
            id: `${series.chart.element.id}_Series_${series.index}_Segment_${segmentRenderOptions.length}`,
            d: currentSegmentPath,
            fill: 'none',
            stroke: currentSegmentColor,
            strokeWidth: series.width,
            opacity: series.opacity,
            dashArray: series.dashArray,
            ...(series.colorField ? { computedPathLength: currentSegmentPathLength } : {})
        });
    }
    const finalSegmentOptions: RenderOptions[] = segmentRenderOptions;
    if (series.colorField) {
        const totalPathLength: number = segmentRenderOptions.reduce((accumulatedLength: number, option: LineSegmentRenderOptions) =>
            accumulatedLength + (option.computedPathLength || 0), 0);
        let cumulativeStartLength: number = 0;
        for (let i: number = 0; i < segmentRenderOptions.length; i++) {
            const segmentLength: number = segmentRenderOptions[i as number].computedPathLength || 0;
            segmentRenderOptions[i as number].totalPathLength = totalPathLength;
            segmentRenderOptions[i as number].cumulativeStartLength = cumulativeStartLength;
            cumulativeStartLength += segmentLength;
        }
    }
    series.visiblePoints = visibleDataPoints;
    const markerElement: ChartMarkerProps | null = (!pointUpdate && series.marker?.visible)
        ? (MarkerRenderer.render(series) as ChartMarkerProps)
        : null;
    return markerElement ? { options: finalSegmentOptions, marker: markerElement } : finalSegmentOptions;
};

/**
 * Multi-Colored Line Series Renderer - Functional API
 */
const MultiColoredLineSeriesRenderer: {
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
        },
        enableAnimation: boolean,
        _currentSeries: SeriesProperties,
        _currentPoint: Points | undefined,
        _pointIndex: number,
        visibleSeries: SeriesProperties[]
    ) => { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string | undefined };
    render: (
        series: SeriesProperties,
        isInverted: boolean,
        pointAnimate?: boolean,
        pointUpdate?: boolean
    ) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };
} = {
    doAnimation,
    render
};

export default MultiColoredLineSeriesRenderer;
