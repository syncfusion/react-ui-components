import type { JSX, RefObject } from 'react';
import { ChartMarkerProps, ChartWaterfallSettings } from '../../base/interfaces';
import { DoubleRangeType, PointRenderingEvent, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { calculateVisiblePoints } from '../../utils/helper';
import { ColumnBase, ColumnBaseReturnType } from './ColumnBase';
import MarkerRenderer from './MarkerRenderer';
import { handleRectAnimation } from './SeriesAnimation';

const columnBaseInstance: ColumnBaseReturnType = ColumnBase();

/**
 * Animation-related refs/state used while rendering animated series frames.
 */
interface AnimationState {
    previousPathLengthRef: RefObject<number[]>;
    isInitialRenderRef: RefObject<boolean[]>;
    renderedPathDRef: RefObject<string[]>;
    animationProgress: number;
    isFirstRenderRef: RefObject<boolean>;
    previousSeriesOptionsRef: RefObject<RenderOptions[][]>;
}

/**
 * Consistent return type for render() in this renderer.
 * options contains the SVG draw options for all primitives in the series.
 * marker is optional and included only when markers are visible.
 */
type RenderResult = { options: RenderOptions[]; marker?: ChartMarkerProps };

/**
 * Result interface for animation handler. Returned by doAnimation to
 * describe the animated attributes to be applied on this frame.
 */
type AnimationResult = {
    strokeDasharray: string | number;
    strokeDashoffset: number;
    interpolatedD?: string;
    animatedDirection?: string;
    animatedTransform?: string;
};

/**
 * WaterfallSeriesRenderer
 *
 * Renders a Waterfall series and connector path with animation support.
 */
const WaterfallSeriesRenderer : {
    sideBySideInfo: DoubleRangeType[];
    render: (series: SeriesProperties, _isInverted: boolean) => RenderResult;
    doAnimation: (pathOptions: RenderOptions, index: number, animationState: AnimationState,
        enableAnimation: boolean, currentSeries: SeriesProperties, currentPoint: Points | undefined, pointIndex: number) => AnimationResult;
} = {
    sideBySideInfo: [] as DoubleRangeType[],

    /**
     * Main render method for Waterfall series.
     *
     * @param {SeriesProperties} series - Series configuration and data points.
     * @returns {RenderResult} RenderOptions array and optional marker information.
     */
    render: (
        series: SeriesProperties
    ): RenderResult => {
        const points: Points[] = series.points;
        const settings: ChartWaterfallSettings | undefined = series.waterfallSettings;
        const intermediateSumIndexes: number[] = settings?.intermediateSumIndexes ?? [];
        const finalSumIndexes: number[] = settings?.sumIndexes ?? [];
        const sideBySideInfo: DoubleRangeType = (WaterfallSeriesRenderer.sideBySideInfo[series.index] =
            columnBaseInstance.getSideBySideInfo(series));
        const origin: number = Math.max(series.yAxis.visibleRange.minimum as number, 0);

        let previousCumulativeEnd: number = 0;
        let currentCumulativeEnd: number = 0;
        let intermediateBase: number = 0;
        let connectorPathD: string = '';
        const options: RenderOptions[] = [];
        const isChartInverted: boolean = !!series.chart.requireInvertedAxis;
        const isXAxisInversed: boolean = !!series.xAxis?.inverted;
        let previousRegion: Rect | null = null;

        for (const point of points) {
            point.symbolLocations = [];
            point.regions = [];
            const isIntermediateSum : boolean = intermediateSumIndexes.includes(point.index);
            const isSumIndex : boolean = finalSumIndexes.includes(point.index);
            if ((isIntermediateSum || isSumIndex) && point.visible === false) {
                (point).visible = true;
            }
            if (!point.visible) {continue; }
            const xValue: number = typeof point.xValue === 'number' ? point.xValue : point.index;
            const cumulativeValue: number = point.yValue ?? 0;
            if (!isIntermediateSum && !isSumIndex) {
                currentCumulativeEnd += cumulativeValue;
            }
            const originValue: number = isIntermediateSum ? intermediateBase : (!isSumIndex ? previousCumulativeEnd : origin);
            const deltaValue : number = currentCumulativeEnd - originValue;

            // Assign numeric y for summaries (enables rectangle and interactions)
            if (isIntermediateSum || isSumIndex) {
                point.yValue = deltaValue;
                point.y = deltaValue;
            }

            // Update intermediate origin when we meet an intermediate sum
            if (isIntermediateSum) {intermediateBase = currentCumulativeEnd; }
            previousCumulativeEnd = currentCumulativeEnd;

            const rect: Rect = columnBaseInstance.getRectangle(
                xValue + sideBySideInfo.start,
                currentCumulativeEnd,
                xValue + sideBySideInfo.end,
                originValue,
                series
            );

            // Guard for invalid/zero areas to avoid rendering glitches
            if (!isFinite(rect.x) || !isFinite(rect.y)) {continue; }
            if (!isFinite(rect.height) || rect.height === 0) {(rect as Rect).height = 0.0001; }
            if (!isFinite(rect.width) || rect.width === 0) {(rect as Rect).width = 0.0001; }

            if ((isIntermediateSum || isSumIndex) && rect.height < 2) {
                rect.height = Math.max(rect.height, 2);
            }
            const settings: ChartWaterfallSettings | undefined = series.waterfallSettings;
            let fillColor: string ;

            if (isIntermediateSum) {
                fillColor = settings?.subtotalColor ?? settings?.totalColor ?? '#4E81BC';
            }
            else if (isSumIndex) {
                fillColor = settings?.totalColor ?? settings?.subtotalColor ?? '#4E81BC';
            }
            else {
                if (cumulativeValue < 0) {
                    fillColor = settings?.negativeColor ?? '#C64E4A';
                } else {
                    fillColor = settings?.positiveColor ?? series.interior;
                }
            }

            const borderWidth: number = isIntermediateSum || isSumIndex ? (series.border?.width ?? 1 ) : (series.border?.width ?? 0 );
            const pointArgs: PointRenderingEvent = columnBaseInstance.triggerEvent( series, point, fillColor, { width: borderWidth,
                color: series.border?.color });
            point.color = fillColor;
            pointArgs.fill = fillColor;
            point.interior = fillColor;
            point.marker.border = {
                width: series.marker?.border?.width,
                color: series.marker?.border?.color
            };
            // Normalize args for both summary and non-summary points
            if (isIntermediateSum || isSumIndex) {
                pointArgs.border = {
                    width: series.border?.width,
                    color: series.border?.color
                };
            } else {
                pointArgs.fill = cumulativeValue < 0 ? (settings?.negativeColor ?? series.interior) : series.interior;

                pointArgs.border = {
                    width: series.border?.width,
                    color: series.border?.color
                };
            }
            columnBaseInstance.updateSymbolLocation(point, rect, series);

            if (!pointArgs.cancel) {
                const name : string = `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`;
                pointArgs.fill = fillColor;
                options.push(
                    columnBaseInstance.drawRectangle(series, point, rect, pointArgs, name)
                );

            }
            // Connector computation
            const currentRegion: Rect | undefined = point.regions[0];

            if (previousRegion && currentRegion) {
                let connectorY: number;
                const previousPoint: Points = series.points[(point.index - 1 === -1) ? 1 : point.index - 1];
                const prevLeft: number = isChartInverted ? previousRegion.x : previousRegion.y;
                const currentLeft: number = isChartInverted ? currentRegion.x : currentRegion.y;
                let prevBottom: number;
                let currentBottom: number;
                let currentYValue: number = currentRegion.y;
                let currentXValue: number = currentRegion.x;

                if (point.yValue === 0) {
                    // Zero-height current bar: use center or symbol location as anchor
                    prevBottom = isChartInverted
                        ? previousRegion.x + previousRegion.width
                        : previousRegion.y + previousRegion.height;

                    currentBottom = isChartInverted
                        ? (point.symbolLocations[0]?.x ?? (currentRegion.x + currentRegion.width / 2))
                        : (point.symbolLocations[0]?.y ?? (currentRegion.y + currentRegion.height / 2));
                } else {
                    // Normal current bar
                    prevBottom = isChartInverted
                        ? ((previousPoint.yValue === 0)
                            ? ((previousPoint.symbolLocations?.[0]?.x) ?? (previousRegion.x + previousRegion.width / 2))
                            : (previousRegion.x + previousRegion.width))
                        : ((previousPoint.yValue === 0)
                            ? (previousPoint.symbolLocations?.[0]?.y ?? previousRegion.y + previousRegion.height / 2)
                            : (previousRegion.y + previousRegion.height));

                    currentBottom = isChartInverted
                        ? (currentRegion.x + currentRegion.width)
                        : (currentRegion.y + currentRegion.height);
                }

                if (
                    Math.round(prevLeft) === Math.round(currentLeft) ||
                    Math.round(prevBottom) === Math.round(currentLeft)
                ) {
                    connectorY = isChartInverted ? (currentRegion.x === 0 && previousRegion.x === 0) ? currentBottom : currentRegion.x
                        : currentRegion.y;
                    connectorY = (point.yValue === 0) ? (isChartInverted ? (point.symbolLocations[0]?.x ?? connectorY)
                        : (point.symbolLocations[0]?.y ?? connectorY)) : connectorY;
                } else {
                    connectorY = currentBottom;
                }

                if (isChartInverted) {
                    // Vertical connector (inverted chart)
                    if (previousPoint.yValue === 0) {
                        previousRegion.y = ((previousRegion.y + previousRegion.height / 2) + (rect.height / 2)) - previousRegion.height;
                    }
                    if (point.yValue === 0) {
                        currentYValue = ((currentRegion.y + currentRegion.height / 2) - (rect.height / 2));
                    }
                    connectorPathD += `M ${connectorY} ${isXAxisInversed ? (previousRegion.y + previousRegion.height) : previousRegion.y } L ${connectorY} ${isXAxisInversed
                        ? currentYValue : (currentYValue + currentRegion.height)} `;
                } else {
                    // Horizontal connector (non-inverted chart)
                    let connectorX: number = previousRegion.x;

                    if (previousPoint.yValue === 0) {
                        connectorX = ((connectorX + previousRegion.width / 2) + (rect.width / 2)) - previousRegion.width;
                        currentXValue = ((currentRegion.x + currentRegion.width / 2) + (rect.width / 2)) - currentRegion.width;
                    }

                    if (point.yValue === 0) {
                        currentXValue = ((currentRegion.x + currentRegion.width / 2) - (rect.width / 2));
                    }
                    connectorPathD += `M ${isXAxisInversed ? connectorX : (connectorX + previousRegion.width)} ${connectorY} L ${isXAxisInversed ? (currentXValue + currentRegion.width)
                        : currentXValue} ${connectorY} `;
                }
            }

            // Advance connector chain to the current region when available
            previousRegion = currentRegion ?? null;
        }
        // Emit one connector path for the entire series
        if (settings?.connectorLine?.visible !== false && connectorPathD) {
            options.push({
                id: `${series.chart.element.id}_Series_${series.index}_Connector_`,
                fill: 'none',
                stroke: settings?.connectorLine?.strokeColor ?? '#5F6A6A',
                strokeWidth: settings?.connectorLine?.strokeWidth ?? 1,
                opacity: settings?.connectorLine?.strokeOpacity ?? series.opacity,
                strokeOpacity: settings?.connectorLine?.strokeOpacity ?? series.opacity,
                dashArray: settings?.connectorLine?.dashArray ?? '',
                d: connectorPathD
            });
        }
        series.visiblePoints = calculateVisiblePoints(series).filter((point : Points) =>
            point.symbolLocations &&
            point.symbolLocations.length &&
            isFinite(point.symbolLocations[0].x) &&
            isFinite(point.symbolLocations[0].y)
        );

        // Marker support
        const marker: ChartMarkerProps | undefined = series.marker?.visible ? (MarkerRenderer.render(series) as ChartMarkerProps)
            : undefined;

        return { options, marker };
    },

    /**
     * doAnimation
     *
     * @param {RenderOptions} pathOptions - The RenderOptions for the current element.
     * @param {number} index - Series index.
     * @param {AnimationState} animationState - Shared animation state/refs.
     * @param {boolean} enableAnimation - Whether animations are enabled.
     * @param {SeriesProperties} currentSeries - The series being animated.
     * @param {Points | undefined} currentPoint - The point for this element (if applicable).
     * @param {number} pointIndex - The index of the point in the series.
     * @returns {AnimationResult} Animated attributes to apply this frame.
     */
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties,
        currentPoint: Points | undefined,
        pointIndex: number
    ): AnimationResult => {
        const animatedValues: {
            animatedDirection?: string | undefined;
            animatedTransform?: string | undefined;
        } =
            handleRectAnimation(
                pathOptions,
                currentSeries,
                index,
                currentPoint,
                pointIndex,
                animationState,
                enableAnimation
            );

        return {
            strokeDasharray: 'none',
            strokeDashoffset: 0,
            interpolatedD: undefined,
            animatedDirection: animatedValues.animatedDirection,
            animatedTransform: animatedValues.animatedTransform
        };
    }

};
/**
 * Renders the connector line path for a Waterfall series with styling and visibility logic.
 *
 * @param {RenderOptions} pathOption - The generated connector path options (id, d, strokeWidth, etc.).
 * @param {SeriesProperties} currentSeries - The current Waterfall series configuration.
 * @param {number} animationProgress - Shared animation progress in [0..1] for rect series.
 * @returns {JSX.Element} The SVG path element for the connector line.
 * @private
 */
export function drawConnectorLines(
    pathOption: RenderOptions,
    currentSeries: SeriesProperties,
    animationProgress: number
): JSX.Element {
    return (
        <path
            key={pathOption.id}
            id={pathOption.id}
            d={pathOption.d}
            stroke={pathOption.stroke ?? currentSeries.waterfallSettings?.connectorLine?.strokeColor ?? '#5F6A6A'}
            strokeWidth={currentSeries.waterfallSettings?.connectorLine?.strokeWidth ?? pathOption.strokeWidth ?? 1}
            fill="none"
            strokeDasharray={currentSeries.waterfallSettings?.connectorLine?.dashArray ?? ''}
            strokeOpacity={currentSeries.waterfallSettings?.connectorLine?.strokeOpacity ?? pathOption.strokeOpacity ?? 1}
            style={{
                outline: 'none',
                visibility: currentSeries.isLegendClicked ? 'visible' : animationProgress === 1 ? 'visible' : 'hidden'
            }}
        />
    );
}

export default WaterfallSeriesRenderer;
