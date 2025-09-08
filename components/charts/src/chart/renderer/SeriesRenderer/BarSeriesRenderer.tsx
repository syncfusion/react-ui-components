import { ChartMarkerProps } from '../../base/interfaces';
import { DoubleRangeType, PointRenderingEvent, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { useVisiblePoints } from '../../utils/helper';
import { BarSeriesType, ColumnBase, ColumnBaseReturnType } from './ColumnBase';
import { MarkerRenderer } from './MarkerRenderer';
import { handleRectAnimation } from './SeriesAnimation';

const columnBaseInstance: ColumnBaseReturnType = ColumnBase();

/**
 * Bar series renderer implementation for chart visualization
 * Handles rendering of horizontal bar charts with animation support
 */
const BarSeries: BarSeriesType = {
    sideBySideInfo: [] as DoubleRangeType[],

    /**
     * Renders the bar series with optional markers.
     *
     * @param {SeriesProperties} series - Series configuration and data points
     * @param {boolean} _isInverted - Chart inversion state (currently unused)
     * @returns {RenderOptions[]|Object} Array of render options or object containing options and marker properties
     */
    render: (series: SeriesProperties, _isInverted: boolean ):
    RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
        // Validate series and required properties
        if (!series || !series.points || !Array.isArray(series.points)) {
            return [];
        }

        // Early exit if no points to process
        if (series.points.length === 0) {
            return [];
        }

        BarSeries.sideBySideInfo[series.index] = columnBaseInstance.getSideBySideInfo(series);
        const origin: number = Math.max(series.yAxis?.visibleRange?.minimum as number ?? 0, 0);
        const options: RenderOptions[] = [];

        // Filter and process only valid points for better performance
        const validPoints: Points[] = series.points.filter((point: Points) => {
            return point &&
                   point.xValue !== null &&
                   point.xValue !== undefined &&
                   point.yValue !== null &&
                   point.yValue !== undefined &&
                   point.visible;
        });

        // Early exit if no valid points found
        if (validPoints.length === 0) {
            return [];
        }

        for (const pointBar of validPoints) {
            const result: RenderOptions | undefined = BarSeries.renderPoint(
                series,
                pointBar,
                BarSeries.sideBySideInfo[series.index],
                origin
            );

            // Only add valid render options
            if (result && typeof result === 'object') {
                options.push(result);
            }

        }

        series.visiblePoints = useVisiblePoints(series);
        const marker: ChartMarkerProps | null = series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
        return marker ? { options, marker } : options;
    },

    /**
     * Renders a single point in the bar series.
     *
     * @param {SeriesProperties} series - The series properties containing styling and configuration
     * @param {Points} pointBar - Individual data point to render
     * @param {DoubleRangeType} sideBySideInfo - Information about positioning for multiple series
     * @param {number} origin - The origin point for bar positioning
     * @returns {RenderOptions} Render options for the point or undefined if point is not visible or rendering is cancelled
     */
    renderPoint: (series: SeriesProperties, pointBar: Points, sideBySideInfo: DoubleRangeType
        , origin: number): RenderOptions | undefined => {
        // Early exit for invalid parameters
        if (!series || !pointBar || !sideBySideInfo) {
            return undefined;
        }
        pointBar.symbolLocations = [];
        pointBar.regions = [];

        if (pointBar.xValue === null || pointBar.xValue === undefined ||
            pointBar.yValue === null || pointBar.yValue === undefined) {
            return undefined;
        }

        // Early exit if point is not visible
        if (!pointBar.visible) {
            return undefined;
        }

        if (!columnBaseInstance || typeof columnBaseInstance.getRectangle !== 'function') {
            return undefined;
        }

        const rect: Rect = columnBaseInstance.getRectangle(
            Number(pointBar.xValue) + sideBySideInfo.start,
            Number(pointBar.yValue),
            Number(pointBar.xValue) + sideBySideInfo.end,
            origin,
            series
        );

        // Early exit if rect creation failed
        if (!rect || typeof rect !== 'object') {
            return undefined;
        }

        // Apply column width adjustments when custom column width is specified
        if (series.columnWidthInPixel && typeof series.columnWidthInPixel === 'number') {
            /**
             * Column height calculation for bar series:
             * Calculate spacing adjustment based on side-by-side placement settings
             */
            let spacingAdjustment: number = 0;
            if (series.chart?.enableSideBySidePlacement && series.columnSpacing) {
                spacingAdjustment = series.columnWidthInPixel * (series.columnSpacing ?? 0);
            }
            rect.height = series.columnWidthInPixel - spacingAdjustment;

            /**
             * Column Y-position calculation for multiple series alignment:
             * Break down the complex positioning logic into clear steps
             */
            const rectCount: number = Number(series.rectCount) || 0;
            const seriesIndex: number = Number(series.index) || 0;

            // Calculate the center offset for all series combined
            const totalSeriesHeight: number = (series.columnWidthInPixel / 2) * rectCount;

            // Calculate the offset for the current series
            const currentSeriesOffset: number = series.columnWidthInPixel * seriesIndex;

            // Apply the positioning: move up by total height, then down by current series offset
            const yPositionAdjustment: number = totalSeriesHeight - currentSeriesOffset;
            rect.y = rect.y - yPositionAdjustment;
        }

        // Early exit if event triggering method is not available
        if (!columnBaseInstance.triggerEvent || typeof columnBaseInstance.triggerEvent !== 'function') {
            return undefined;
        }

        const argsData: PointRenderingEvent = columnBaseInstance.triggerEvent(
            series,
            pointBar,
            series.interior,
            {
                width: series.border?.width ?? 0,
                color: series.border?.color ?? 'transparent'
            }
        );

        // Early exit if required methods are not available
        if (!columnBaseInstance.updateSymbolLocation || typeof columnBaseInstance.updateSymbolLocation !== 'function' ||
            !columnBaseInstance.drawRectangle || typeof columnBaseInstance.drawRectangle !== 'function') {
            return undefined;
        }

        columnBaseInstance.updateSymbolLocation(pointBar, {
            x: rect.x ?? 0,
            y: rect.y ?? 0,
            width: rect.width ?? 0,
            height: rect.height ?? 0
        }, series);

        // Generate unique name for the rendered element
        const chartId: string = series.chart?.element?.id ?? 'chart';
        const seriesIndex: number = series.index ?? 0;
        const pointIndex: number = pointBar.index ?? 0;
        const name: string = `${chartId}_Series_${seriesIndex}_Point_${pointIndex}`;

        return columnBaseInstance.drawRectangle(series, pointBar, rect, argsData, name);
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
        },
        enableAnimation: boolean,
        currentSeries: SeriesProperties,
        currentPoint: Points | undefined,
        pointIndex: number
    ) => {
        const animatedvalues: { animatedDirection?: string; animatedTransform?: string; }
            = handleRectAnimation(pathOptions, currentSeries, index, currentPoint, pointIndex, animationState, enableAnimation);
        return {
            strokeDasharray: 'none',
            strokeDashoffset: 0,
            interpolatedD: undefined,
            animatedDirection: animatedvalues.animatedDirection,
            animatedTransform: animatedvalues.animatedTransform
        };
    }
};

export default BarSeries;
