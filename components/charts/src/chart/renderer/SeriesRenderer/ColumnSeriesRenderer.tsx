import { ChartMarkerProps } from '../../base/interfaces';
import { DoubleRangeType, PointRenderingEvent, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { useVisiblePoints } from '../../utils/helper';
import { ColumnBase, ColumnBaseReturnType } from './ColumnBase';
import MarkerRenderer from './MarkerRenderer';
import { handleRectAnimation } from './SeriesAnimation';

const columnBaseInstance: ColumnBaseReturnType = ColumnBase();

/**
 * Animation state interface for column series animations
 */
interface AnimationState {
    previousPathLengthRef: React.RefObject<number[]>;
    isInitialRenderRef: React.RefObject<boolean[]>;
    renderedPathDRef: React.RefObject<string[]>;
    animationProgress: number;
    isFirstRenderRef: React.RefObject<boolean>;
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
}

/**
 * Result interface for animation operations
 */
interface AnimationResult {
    strokeDasharray: string;
    strokeDashoffset: number;
    interpolatedD: string | undefined;
    animatedDirection?: string;
    animatedTransform?: string;
}

/**
 * Result interface for render operations - ensures consistent return type
 */
interface RenderResult {
    options: RenderOptions[];
    marker?: ChartMarkerProps;
}

/**
 * Interface defining the structure and methods for column series rendering
 * Used for rendering column charts with proper positioning, animations, and markers
 *
 * @interface ColumnSeriesType
 *
 */
interface ColumnSeriesType {
    /** Array storing side-by-side positioning information for multiple series */
    sideBySideInfo: DoubleRangeType[];

    /**
     * Main render function for column series.
     *
     * @param {SeriesProperties} series - Series configuration and data points
     * @param {boolean} _isInverted - Chart inversion state (currently unused)
     * @param {Object} chartProps - Chart-level properties including event handlers
     * @returns {RenderOptions[]|Object} Array of render options or object containing options and marker properties
     */
    render: (
        series: SeriesProperties,
        isInverted: boolean
    ) => RenderResult | RenderOptions[];

    /**
     * Animation handler for column series.
     *
     * @param {RenderOptions} pathOptions - Current render options for the path
     * @param {number} index - Index of the current series
     * @param {AnimationState} animationState - Complete animation state including refs and progress
     * @param {boolean} enableAnimation - Flag to enable/disable animations
     * @param {SeriesProperties} currentSeries - Series being animated
     * @param {Points | undefined} currentPoint - Point being animated (optional)
     * @param {number} pointIndex - Index of the current point
     * @returns {Object} Animation result with transform and direction properties
     */
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties,
        currentPoint: Points | undefined,
        pointIndex: number
    ) => AnimationResult;

    /**
     * Renders individual point as a column rectangle.
     *
     * @param series - Series properties
     * @param point - Individual data point to render
     * @param sideBySideInfo - Positioning information for side-by-side placement
     * @param origin - Origin point for the column base
     * @returns Render options for the point or undefined if not visible
     */
    renderPoint: (
        series: SeriesProperties,
        point: Points,
        sideBySideInfo: DoubleRangeType,
        origin: number
    ) => RenderOptions | undefined;
}

/**
 * Column Series Renderer
 *
 * Handles rendering of column chart series including:
 * - Side-by-side positioning for multiple series
 * - Individual point rendering as rectangles
 * - Animation support
 * - Marker rendering
 *
 */
const ColumnSeries: ColumnSeriesType = {
    sideBySideInfo: [] as DoubleRangeType[],

    /**
     * Renders the complete column series
     *
     * Processes all points in the series, calculates side-by-side positioning,
     * and optionally renders markers. Uses memoized calculations to avoid
     * expensive recomputations on each render.
     *
     * @param {SeriesProperties} series - Series configuration and data points
     * @param {boolean} _isInverted - Chart inversion state (currently unused)
     * @returns {RenderOptions[]|Object} Array of render options, or object containing both options array and marker properties when markers are visible
     */
    render: (
        series: SeriesProperties,
        _isInverted: boolean
    ): RenderResult => {
        // Cache side-by-side info to avoid repeated calculations
        ColumnSeries.sideBySideInfo[series.index] = columnBaseInstance.getSideBySideInfo(series);

        const origin: number = Math.max(series.yAxis.visibleRange.minimum as number, 0);
        const options: RenderOptions[] = [];

        // Process each point in the series
        for (const point of series.points) {
            const result: RenderOptions | undefined = ColumnSeries.renderPoint(
                series,
                point,
                ColumnSeries.sideBySideInfo[series.index],
                origin
            );

            if (result) {
                options.push(result);
            }
        }

        // Update visible points using optimized helper
        series.visiblePoints = useVisiblePoints(series);

        // Render marker if visible
        const marker: ChartMarkerProps | undefined = series.marker?.visible
            ? MarkerRenderer.render(series) as ChartMarkerProps
            : undefined;

        // Return consistent interface
        return { options, marker };
    },

    /**
     * Renders an individual data point as a column rectangle
     *
     * Calculates the rectangle bounds, applies column width settings,
     * triggers point render events, and creates the visual representation.
     *
     * @param {SeriesProperties} series - Series containing styling and configuration
     * @param {Points} point - Individual data point with x,y values
     * @param {DoubleRangeType} sideBySideInfo - Calculated positioning for multiple series
     * @param {number} origin - Base line for column height calculation
     * @returns {RenderOptions} Render options for the rectangle or undefined if point is hidden
     *
     */
    renderPoint: (
        series: SeriesProperties,
        point: Points,
        sideBySideInfo: DoubleRangeType,
        origin: number
    ): RenderOptions | undefined => {
        // Initialize point properties
        point.symbolLocations = [];
        point.regions = [];

        if (!point.visible) {
            return undefined;
        }

        // Calculate base rectangle bounds
        const rect: Rect = columnBaseInstance.getRectangle(
            (point.xValue || 0) + sideBySideInfo.start,
            point.yValue ?? 0,
            (point.xValue || 0) + sideBySideInfo.end,
            origin,
            series
        );

        if (series.columnWidthInPixel) {
            const spacingReduction: number = series.chart.enableSideBySidePlacement
                ? series.columnWidthInPixel * (series.columnSpacing ?? 0)
                : 0;

            rect.width = series.columnWidthInPixel - spacingReduction;

            const offsetCalculation: number = ((series.columnWidthInPixel / 2) * Number(series.rectCount))
                - (series.columnWidthInPixel * series.index);

            rect.x = rect.x - offsetCalculation;
        }

        // Trigger point render event for customization
        const argsData: PointRenderingEvent = columnBaseInstance.triggerEvent(
            series,
            point,
            series.interior,
            {
                width: series.border?.width,
                color: series.border?.color
            }
        );

        // Update symbol location for interactions
        columnBaseInstance.updateSymbolLocation(point, {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
        }, series);

        // Generate unique identifier for the rendered element
        const name: string = `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`;

        return columnBaseInstance.drawRectangle(series, point, rect, argsData, name);

    },

    /**
     * Handles animation for column series rendering
     *
     * Processes animation state and applies appropriate transforms for
     * smooth column animations including height and position changes.
     *
     * @param {RenderOptions} pathOptions - Current render options for the path
     * @param {number} index - Index of the current series
     * @param {AnimationState} animationState - Complete animation state including refs and progress
     * @param {boolean} enableAnimation - Flag to enable/disable animations
     * @param {SeriesProperties} currentSeries - Series being animated
     * @param {Points | undefined} currentPoint - Point being animated (optional)
     * @param {number} pointIndex - Index of the current point
     * @returns {Object} Animation configuration with transforms and directions
     *
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
        // Handle rectangle-specific animations
        const animatedValues: { animatedDirection?: string; animatedTransform?: string; } =
            handleRectAnimation(
                pathOptions,
                currentSeries,
                index,
                currentPoint,
                pointIndex,
                animationState,
                enableAnimation
            );

        // Return standardized animation result
        return {
            strokeDasharray: 'none',
            strokeDashoffset: 0,
            interpolatedD: undefined,
            animatedDirection: animatedValues.animatedDirection,
            animatedTransform: animatedValues.animatedTransform
        };
    }
};

export default ColumnSeries;
