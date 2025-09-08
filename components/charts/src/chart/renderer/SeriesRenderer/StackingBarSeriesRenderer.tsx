import { ChartMarkerProps } from '../../base/interfaces';
import { DoubleRangeType, PointRenderingEvent, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { StackValuesType, useVisiblePoints } from '../../utils/helper';
import { ColumnBase, ColumnBaseReturnType, StackingBarSeriesRendererType } from './ColumnBase';
import MarkerRenderer from './MarkerRenderer';
import { handleRectAnimation } from './SeriesAnimation';

const columnBaseInstance: ColumnBaseReturnType = ColumnBase();

/**
 * Stacking Bar Series Renderer implementation for rendering stacked bar charts.
 * Handles the rendering of stacking bar series with proper positioning, animation, and styling.
 *
 */
const StackingBarSeriesRenderer: StackingBarSeriesRendererType = {
    sideBySideInfo: [] as DoubleRangeType[],

    /**
     * Renders the stacking bar series with all its data points.
     * Calculates positioning, handles markers, and generates render options for each point.
     *
     * @param {SeriesProperties} series - The series data containing points, styling, and configuration
     * @param {boolean} _isInverted - Flag indicating if the chart is inverted (currently unused)
     * @returns {RenderOptions[]|Object} Array of render options or object containing options and marker data
     *
     */
    render: (series: SeriesProperties, _isInverted: boolean ):
    RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
        series.isRectSeries = true;
        StackingBarSeriesRenderer.sideBySideInfo[series.index] = columnBaseInstance.getSideBySideInfo(series);
        const stackedValue: StackValuesType = series.stackedValues;
        const options: RenderOptions[] = [];

        // Optimized loop: Use for...of with index when needed, or use forEach for better performance
        series.points.forEach((point: Points) => {
            const renderOption: RenderOptions | undefined = StackingBarSeriesRenderer.renderPoint(
                series,
                point,
                StackingBarSeriesRenderer.sideBySideInfo[series.index],
                stackedValue
            );
            if (renderOption) {
                options.push(renderOption);
            }
        });

        series.visiblePoints = useVisiblePoints(series);
        const marker: ChartMarkerProps | null = series.marker?.visible
            ? MarkerRenderer.render(series) as ChartMarkerProps : null;
        return marker ? { options, marker } : options;
    },

    /**
     * Renders an individual point in the stacking bar series.
     * Handles positioning calculations, legend click scenarios, and rectangle drawing.
     *
     * @param {SeriesProperties} series - The series containing the point to render
     * @param {Points} point - The individual data point to render
     * @param {DoubleRangeType} sideBySideInfo - Positioning information for multiple series
     * @param {StackValuesType} stackedValue - Stacked values containing start and end positions
     * @returns {RenderOptions | undefined} Render options for the point or undefined if not visible
     *
     * @description
     * This method handles complex scenarios including:
     * - Normal stacking bar rendering
     * - Legend click state where series is hidden but needs to show placeholder
     * - Side-by-side positioning for multiple series
     * - Column width adjustments for both normal and transposed charts
     *
     */
    renderPoint: (series: SeriesProperties, point: Points, sideBySideInfo: DoubleRangeType, stackedValue: StackValuesType) => {
        point.symbolLocations = [];
        point.regions = [];

        if (!point.visible) {
            return undefined;
        }

        let index: number | undefined;
        let startvalue: number | undefined = 0;

        if (!series.visible && series.isLegendClicked) {
            // Find the last visible series before the current one
            for (let index: number = series.index; index >= 0; index--) {
                const currentVisibleSeries: SeriesProperties = series.chart.visibleSeries[index as number];
                if (currentVisibleSeries?.visible) {
                    index = currentVisibleSeries.index;
                    break;
                }
            }

            // Replace the existing if-else block with this ternary operator
            startvalue = series.index > 0 && index !== undefined
                ? series.chart.visibleSeries[index as number]?.stackedValues?.endValues?.[point.index]
                : series.stackedValues?.startValues?.[point.index];
        }

        // Calculate rectangle coordinates with null safety
        const endValue: number | undefined = (!series.visible && series.isLegendClicked)
            ? startvalue
            : (stackedValue.endValues?.[point.index] ?? 0);

        const startValueForRect: number | undefined = (!series.visible && series.isLegendClicked)
            ? startvalue
            : (stackedValue.startValues?.[point.index] ?? 0);

        const rect: Rect = columnBaseInstance.getRectangle(
            Number(point.xValue) + sideBySideInfo.start,
            Number(endValue),
            Number(point.xValue) + sideBySideInfo.end,
            Number(startValueForRect),
            series
        );

        // Apply column width adjustments based on chart orientation
        if (series.chart.iSTransPosed && series.columnWidthInPixel) {
            rect.width = series.columnWidthInPixel;
            rect.x -= series.columnWidthInPixel / 2;
        } else if (series.columnWidthInPixel) {
            rect.height = series.columnWidthInPixel;
        }

        if (series.columnWidthInPixel) {
            rect.y = series.chart.iSTransPosed ? rect.y : rect.y - (series.columnWidthInPixel / 2);
        }

        // Trigger point render event
        const argsData: PointRenderingEvent = columnBaseInstance.triggerEvent(
            series,
            point,
            series.interior,
            {
                width: series.border?.width ?? 0,
                color: series.border?.color ?? 'transparent'
            }
        );
        // Update symbol location and draw rectangle
        columnBaseInstance.updateSymbolLocation(point, {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
        }, series);

        const name: string = `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`;
        const option: RenderOptions = columnBaseInstance.drawRectangle(series, point, rect, argsData, name);

        return option;
    },

    /**
     * Handles animation for the stacking bar series rendering.
     * Manages rectangle-based animations including direction and transform properties.
     *
     * @param {RenderOptions} pathOptions - Current rendering options for the path/rectangle
     * @param {number} index - Index of the series being animated
     * @param {Object} animationState - Current state of the animation system
     * @param {boolean} enableAnimation - Flag to enable or disable animation
     * @param {SeriesProperties} currentSeries - Current series being animated
     * @param {Points | undefined} currentPoint - Current point being animated
     * @param {number} pointIndex - Index of the current point
     * @returns {Object} Animation properties object containing stroke and transform values
     *
     */
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
        const animatedvalues: { animatedDirection?: string; animatedTransform?: string; } = handleRectAnimation(
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
            animatedDirection: animatedvalues.animatedDirection,
            animatedTransform: animatedvalues.animatedTransform
        };
    }
};

export default StackingBarSeriesRenderer;
