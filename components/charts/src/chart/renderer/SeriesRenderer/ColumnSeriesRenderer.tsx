import { ChartMarkerProps } from '../../base/interfaces';
import { DoubleRangeType, PointRenderingEvent, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { calculateVisiblePoints } from '../../utils/helper';
import { ColumnBase, ColumnBaseReturnType } from './ColumnBase';
import MarkerRenderer from './MarkerRenderer';
import { handleRectAnimation } from './SeriesAnimation';

const columnBaseInstance: ColumnBaseReturnType = ColumnBase();

/**
 * Animation state interface for column series animations.
 *
 * @private
 */
export interface AnimationState {
    previousPathLengthRef: React.RefObject<number[]>;
    isInitialRenderRef: React.RefObject<boolean[]>;
    renderedPathDRef: React.RefObject<string[]>;
    animationProgress: number;
    isFirstRenderRef: React.RefObject<boolean>;
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
}

/**
 * Result interface for animation operations.
 *
 * @private
 */
export interface AnimationResult {
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
    ) => RenderOptions | RenderOptions[] | undefined;

    /**
     * Renders SVG elements for Cylinder series.
     *
     * @param currentSeries - Current series instance
     * @param pathOptions - SVG render options
     * @param seriesIndex - Series index
     * @param animationState - Animation state
     * @param chartID - Chart ID
     *
     * @private
     */
    renderCylinderSeries: (
        currentSeries: SeriesProperties,
        pathOptions: RenderOptions[],
        seriesIndex: number,
        animationState: AnimationState,
        chartID: string
    ) => React.ReactNode;
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
     * @returns {RenderOptions[]|Object} Array of render options, or object containing both options array and marker properties when markers are visible
     */
    render: (
        series: SeriesProperties
    ): RenderResult => {
        // Cache side-by-side info to avoid repeated calculations
        ColumnSeries.sideBySideInfo[series.index] = columnBaseInstance.getSideBySideInfo(series);

        const origin: number = Math.max(series.yAxis.visibleRange.minimum as number, 0);
        const options: RenderOptions[] = [];

        // Process each point in the series
        for (const point of series.points) {
            const result: RenderOptions | RenderOptions[] | undefined = ColumnSeries.renderPoint(
                series,
                point,
                ColumnSeries.sideBySideInfo[series.index],
                origin
            );
            // Proper null-safety guard: check if result exists before type checking
            if (result && Array.isArray(result)) {
                options.push(...result);
            } else if (result) {
                options.push(result);
            }
        }

        // Update visible points using optimized helper
        series.visiblePoints = calculateVisiblePoints(series);

        // Render marker if visible
        const marker: ChartMarkerProps | undefined = series.marker?.visible
            ? MarkerRenderer.render(series) as ChartMarkerProps
            : undefined;

        // Return consistent interface
        return { options, marker };
    },

    /**
     * Renders SVG elements for Cylinder series.
     *
     * @param {SeriesProperties} currentSeries - Current series instance
     * @param {RenderOptions[]} pathOptions - SVG render options
     * @param {number} seriesIndex - Series index
     * @param {AnimationState} animationState - Animation state
     * @param {string} chartID - Chart ID
     *
     * @returns {SVGElement[]} SVG elements representing the rendered cylinder series.
     *
     * @private
     */
    renderCylinderSeries: (
        currentSeries: SeriesProperties,
        pathOptions: RenderOptions[],
        seriesIndex: number,
        animationState: AnimationState,
        chartID: string
    ): React.ReactNode => {
        const points: Points[] = (currentSeries.visiblePoints as Points[]).filter(
            (point: Points) => point.yValue !== null && point.yValue !== undefined);
        const pathsPerPoint: number = 3;
        return points.map((currentPoint: Points, pointIndex: number) => {
            const startIndex: number = pointIndex * pathsPerPoint;
            const endIndex: number = startIndex + pathsPerPoint;
            return (
                <g
                    key={`${chartID}_Series_${seriesIndex}_Point_${pointIndex}`}
                    id={`${chartID}_Series_${seriesIndex}_Point_${pointIndex}`}
                    className="e-cylinder-point-group"
                    role="img"
                    aria-label={`${currentPoint.xValue}: ${currentPoint.yValue}, ${currentSeries.name}`}
                >
                    {pathOptions.slice(startIndex, endIndex).map(
                        (pathOption: RenderOptions, partIndex: number) => {

                            const pathIndex: number = startIndex + partIndex;
                            const animationProps: {
                                strokeDasharray: string | number;
                                strokeDashoffset: number;
                                interpolatedD?: string;
                                animatedDirection?: string;
                                animatedTransform?: string;
                                animatedClipPath?: string;
                            } = currentSeries.propsChange
                                ? {
                                    strokeDasharray: 'none',
                                    strokeDashoffset: 0
                                }
                                : ColumnSeries.doAnimation(
                                    pathOption,
                                    seriesIndex,
                                    animationState,
                                    currentSeries.animation?.enable ?? false,
                                    currentSeries,
                                    currentPoint,
                                    pathIndex
                                );
                            return (
                                <path
                                    key={`${pathOption.id}_${partIndex}`}
                                    id={`${pathOption.id}_${partIndex}`}
                                    d={animationProps.animatedDirection ?? pathOption.d}
                                    fill={pathOption.fill}
                                    stroke={pathOption.stroke}
                                    strokeWidth={pathOption.strokeWidth}
                                    fillOpacity={pathOption.opacity}
                                    strokeOpacity={pathOption.opacity}
                                    strokeDasharray={animationProps.strokeDasharray}
                                    strokeDashoffset={animationProps.strokeDashoffset}
                                    transform={animationProps.animatedTransform}
                                    style={{
                                        clipPath: animationProps.animatedClipPath,
                                        outline: 'none'
                                    }}
                                />
                            );
                        }
                    )}
                </g>
            );
        });
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
    ): RenderOptions | RenderOptions[] | undefined => {
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

        if (rect.width <= 0) {
            return undefined;
        }

        // Trigger point render event for customization
        const argsData: PointRenderingEvent = columnBaseInstance.triggerEvent(
            series,
            point,
            series.category === 'Indicator' ? point.color : series.interior,
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
        const name: string = series.category === 'Indicator' ? series.chart.element.id + '_Indicator_Series_' + series.index + '_' + series.name +
            '_Point_' + point.index : `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`;
        if (series.columnFacet === 'Cylinder')
        {
            return columnBaseInstance.drawCylinder(series, point, rect, argsData, name);
        }
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
