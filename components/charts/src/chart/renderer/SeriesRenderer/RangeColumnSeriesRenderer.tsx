import { ChartMarkerProps } from '../../base/interfaces';
import { DoubleRangeType, PointRenderingEvent, Points, RangeColumnSeriesRendererType, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { useVisiblePoints } from '../../utils/helper';
import { ColumnBase, ColumnBaseReturnType } from './ColumnBase';
import { AnimationResult, AnimationState } from './ColumnSeriesRenderer';
import MarkerRenderer from './MarkerRenderer';
import { getHighLowMarkerLocations } from './RangeBase';
import { handleRectAnimation } from './SeriesAnimation';

const columnBase: ColumnBaseReturnType = ColumnBase();

/**
 * Result interface for render operations - ensures consistent return type
 */
interface RenderResult {
    options: RenderOptions[];
    marker?: ChartMarkerProps;
}

/**
 * Range Column Series Renderer
 */
const RangeColumnSeriesRenderer: RangeColumnSeriesRendererType = {
    sideBySideInfo: [],

    /**
     * The main rendering function that processes an entire area series and generates all required SVG paths.
     *
     * @param {SeriesProperties} series - Series configuration and data.
     * @param {boolean} _isInverted - Flag indicating if axes are inverted.
     * @returns {RenderOptions[] | { options: RenderOptions[], marker: ChartMarkerProps }} - Rendered path options and optional marker.
     */
    render: (series: SeriesProperties, _isInverted: boolean): RenderResult => {
        series.isRectSeries = true;
        RangeColumnSeriesRenderer.sideBySideInfo[series.index] = columnBase.getSideBySideInfo(series);
        const options: RenderOptions[] = [];

        for (const point of series.points) {
            const option: RenderOptions | undefined = RangeColumnSeriesRenderer.renderPoint(
                series, point, RangeColumnSeriesRenderer.sideBySideInfo[series.index]
            );
            if (option) { options.push(option); }
        }
        series.visiblePoints = useVisiblePoints(series);
        const marker: ChartMarkerProps | undefined = series.marker?.visible
            ? (MarkerRenderer.render(series) as ChartMarkerProps)
            : undefined;

        return { options, marker };
    },

    /**
     * Renders an individual data point as a column rectangle
     *
     * Calculates the rectangle bounds, applies column width settings, and creates the visual representation.
     *
     * @param {SeriesProperties} series - Series containing styling and configuration
     * @param {Points} point - Individual data point with x,y values
     * @param {DoubleRangeType} sideBySide - Calculated positioning for multiple series
     * @returns {RenderOptions} Render options for the rectangle or undefined if point is hidden
     */
    renderPoint: ( series: SeriesProperties, point: Points, sideBySide: DoubleRangeType): RenderOptions | undefined => {
        point.symbolLocations = [];
        point.regions = [];

        if (!point.visible) { return undefined; }

        const originalLowValue: number = Number(point.low);
        const originalHighValue: number = Number(point.high);
        const lowValue: number = Math.min(originalLowValue, originalHighValue);
        const highValue: number = Math.max(originalLowValue, originalHighValue);

        const rect: Rect = columnBase.getRectangle(
            (Number(point.xValue)) + sideBySide.start, highValue,
            (Number(point.xValue)) + sideBySide.end, lowValue, series);

        if (series.columnWidthInPixel) {
            const spacingReduction: number = series.chart.enableSideBySidePlacement
                ? series.columnWidthInPixel * (series.columnSpacing as number) : 0;
            rect.width = series.columnWidthInPixel - spacingReduction;

            const offset: number =
                ((series.columnWidthInPixel / 2) * Number(series.rectCount)) -
                series.columnWidthInPixel * series.index;
            rect.x = rect.x - offset;
        }
        const args: PointRenderingEvent = columnBase.triggerEvent(
            series, point, series.interior,
            { width: series.border?.width, color: series.border?.color }
        );

        columnBase.updateSymbolLocation(point, rect, series);
        const [markerLocationInHigh, markerLocationInLow] = getHighLowMarkerLocations(rect, series);
        point.symbolLocations = [markerLocationInHigh, markerLocationInLow];
        point.regions = [rect];

        const id: string = `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`;
        const renderOptions: RenderOptions = columnBase.drawRectangle(series, point, rect, args, id);
        return renderOptions;
    },

    /**
     * Animates the series during rendering or updates.
     *
     * @param {RenderOptions} pathOptions - The rendering options for the series body path.
     * @param {number} index - The index of the current series in the chart.
     * @param {object} animationState - Represents the state of animation and its properties.
     * @param {boolean} enableAnimation - Flag indicating whether animation should be performed.
     * @param {SeriesProperties} currentSeries - The current series being rendered.
     * @param {Points | undefined} currentPoint - The current point being rendered.
     * @param {number} pointIndex - The index of the current point.
     * @returns {object} The animated render options path data.
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

        return {
            strokeDasharray: 'none',
            strokeDashoffset: 0,
            interpolatedD: undefined,
            animatedDirection: animatedValues.animatedDirection,
            animatedTransform: animatedValues.animatedTransform
        };
    }
};

export default RangeColumnSeriesRenderer;
