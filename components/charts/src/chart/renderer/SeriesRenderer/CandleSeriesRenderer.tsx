import * as React from 'react';
import { ChartBorderProps, ChartMarkerProps, ChartSeriesProps } from '../../base/interfaces';
import { DoubleRangeType, PointRenderingEvent, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { ColumnBase, ColumnBaseReturnType, FinacialSeriesType } from './ColumnBase';
import { applyPointRenderCallback, useVisiblePoints } from '../../utils/helper';
import { handleRectAnimation } from './SeriesAnimation';
import MarkerRenderer from './MarkerRenderer';

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
 * Creates a renderer for candle series.
 * This factory function encapsulates the internal state and helper methods,
 * exposing only the necessary 'render' and 'doAnimation' functions.
 *
 * @returns {Object} - The public API for candle series rendering.
 */
function createCandleSeriesRenderer(): FinacialSeriesType {

    // Encapsulated instance of ColumnBase logic.
    const candleBaseInstance: ColumnBaseReturnType = ColumnBase();

    // Internal state for side-by-side calculations, now private to this module instance.
    const sideBySideInfo: DoubleRangeType[] = [];

    /**
     * Applies the candle color.
     *
     * @param {Points} point - The corresponding data point.
     * @param {SeriesProperties} series - The series to be rendered.
     * @returns {string} The fill color for each candles.
     */
    const getCandleColor: (point: Points, series: SeriesProperties) => string =
        (point: Points, series: SeriesProperties): string => {
            const previousPoint: Points = series.points[point.index - 1];

            const isUpVsPrev: boolean = previousPoint ? (point.close as number) > (previousPoint.close as number) : true;

            const bullCandle: string = series.bullFillColor ?? series.chart.themeStyle.bullFillColor;
            const bearCandle: string = series.bearFillColor ?? series.chart.themeStyle.bearFillColor;

            return isUpVsPrev ? bullCandle : bearCandle;
        };

    /**
     * Represents the point render event triggering.
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {Points} point - The corresponding data point.
     * @returns {Function} Returns a function call to trigger event from base.
     */
    const setBorderProperties: (series: SeriesProperties, point: Points) => PointRenderingEvent =
    (series: SeriesProperties, point: Points): PointRenderingEvent => {
        const fill: string = getCandleColor(point, series);
        const border: ChartBorderProps = { color: series.border?.color, width: Math.max((series.border?.width as number), 1) };
        const customizedValues: string = applyPointRenderCallback(({
            seriesIndex: series.index as number, color: fill,
            xValue: point.xValue as number | Date | string | null,
            yValue: point.yValue as number | Date | string | null
        }), series.chart);
        const pointRenderingData: PointRenderingEvent = candleBaseInstance.triggerEvent(series, point, customizedValues, border);
        point.interior = customizedValues;
        return pointRenderingData;
    };

    /**
     * Build the candles using SVG path
     *
     * @param {Rect} topRect - The top recatngle.
     * @param {Rect} midRect - The middle rectangle.
     * @param {SeriesProperties} series - The series to be rendered.
     * @returns {string} Returns the SVG path direction as string.
     */
    const getPathString: (topRect: Rect, midRect: Rect, series: SeriesProperties) => string =
    (topRect: Rect, midRect: Rect, series: SeriesProperties): string => {
        let direction: string = '';
        const center: number = series.chart.requireInvertedAxis ? topRect.y + topRect.height / 2 : topRect.x + topRect.width / 2;

        // Top wick
        direction += !series.chart.requireInvertedAxis ?
            `M ${center} ${topRect.y} L ${center} ${midRect.y}` :
            `M ${topRect.x} ${center} L ${midRect.x} ${center}`;

        // Body
        direction += ` M ${midRect.x} ${midRect.y} L ${midRect.x + midRect.width} ${midRect.y} 
            L ${midRect.x + midRect.width} ${midRect.y + midRect.height} 
            L ${midRect.x} ${midRect.y + midRect.height} Z`;

        // Bottom wick
        direction += !series.chart.requireInvertedAxis ?
            ` M ${center} ${midRect.y + midRect.height} L ${center} ${topRect.y + topRect.height}` :
            ` M ${midRect.x + midRect.width} ${center} L ${topRect.x + topRect.width} ${center}`;

        return direction;
    };

    /**
     * Applies the final series properties to each candle.
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {Points} point - The corresponding data point.
     * @param {Rect} rect - The point region responsible for drawing candles.
     * @param {PointRenderingEvent} argsData - Point render event data, if triggered.
     * @param {string} direction - SVG path direction.
     * @param {string} name - Unique id for each candles.
     * @returns {Object} The candles with its finally assigned properties.
     */
    const drawCandle: (series: SeriesProperties, point: Points, rect: Rect, argsData: PointRenderingEvent, direction: string, name: string)
    => RenderOptions = (series: SeriesProperties, point: Points, rect: Rect,
                        argsData: PointRenderingEvent, direction: string, name: string): RenderOptions => {
        const renderDimension: number = series.chart.requireInvertedAxis ? rect.height : rect.width;

        if (renderDimension <= 0) {
            return {} as RenderOptions;
        }

        const fill: string = !series.enableSolidCandles ?
            (point.open > point.close ? argsData.fill : 'transparent') : argsData.fill;

        return {
            id: name,
            fill: fill,
            strokeWidth: (argsData.border).width as number,
            stroke: argsData.fill,
            opacity: series.opacity,
            dashArray: series.dashArray || '',
            d: direction,
            fillOpacity: series.opacity,
            strokeOpacity: 1
        };
    };

    /**
     * Renders each candles with appropriate properties.
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {Points} point - The corresponding data point.
     * @param {DoubleRangeType} sideBySide - Previous and Next data point information.
     * @param {number} borderWidth - Indicates the width of candle border.
     * @returns {Function} Returns the function call to drawCandle method if point is appropriate.
     */
    const renderPoint: (series: SeriesProperties, point: Points, sideBySide: DoubleRangeType, borderWidth: number)
    => RenderOptions | undefined = (series: SeriesProperties, point: Points, sideBySide: DoubleRangeType, borderWidth: number):
    RenderOptions | undefined => {
        point.regions = [];
        point.symbolLocations = [];

        if (!point.visible) {
            return undefined;
        }

        const tickRegion: Rect = candleBaseInstance.getRectangle(
            ((point.xValue as number) + sideBySide.median),
            Math.max((point.high as number), (point.low as number)),
            ((point.xValue as number) + sideBySide.median),
            Math.min((point.high as number), (point.low as number)),
            series
        );

        if (!series.chart.requireInvertedAxis) {
            tickRegion.x -= borderWidth / 2;
            tickRegion.width = borderWidth;
        } else {
            tickRegion.y -= borderWidth / 2;
            tickRegion.height = borderWidth;
        }

        const centerRegion: Rect = candleBaseInstance.getRectangle(
            ((point.xValue as number) + sideBySide.start),
            Math.max((point.open as number), (point.close as number)),
            ((point.xValue as number) + sideBySide.end),
            Math.min((point.open as number), (point.close as number)),
            series
        );

        point.regions.push(tickRegion, centerRegion);

        const direction: string = getPathString(tickRegion, centerRegion, series);
        const argsData: PointRenderingEvent = setBorderProperties(series, point);

        candleBaseInstance.updateSymbolLocation(point, tickRegion, series);
        candleBaseInstance.updateSymbolLocation(point, centerRegion, series);

        const seriesElementId: string = `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`;
        return drawCandle(series, point, centerRegion, argsData, direction, seriesElementId);
    };

    // Return the public API for the renderer
    return {
        /**
         * Renders the candle series.
         *
         * @param {SeriesProperties} series - The series to be rendered.
         * @param {boolean} _isInverted - Specifies whether the chart is inverted.
         * @returns {Object} Returns the final series with assigned data point properties.
         */
        render: (series: SeriesProperties, _isInverted: boolean):
        RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
            sideBySideInfo[series.index] = candleBaseInstance.getSideBySideInfo(series);
            const borderWidth: number = Math.max(((series.border as ChartSeriesProps).width as number), 1);
            const options: RenderOptions[] = [];

            for (const point of series.points) {
                const result: RenderOptions = renderPoint(
                    series, point, sideBySideInfo[series.index], borderWidth
                ) as RenderOptions;
                if (result) {
                    options.push(result);
                }
            }

            series.visiblePoints = useVisiblePoints(series);
            const marker: ChartMarkerProps | null = series.marker?.visible ? MarkerRenderer.render(series) as ChartMarkerProps : null;
            return marker ? { options, marker } : options;
        },

        /**
         * Animates the hilos while rendering.
         *
         * @param {RenderOptions} pathOptions - The rendering options for the candle path.
         * @param {number} index - The index of the current series in the chart.
         * @param {Object} animationState - Represent the state of animation and its properties.
         * @param {boolean} enableAnimation - Flag indicating whether animation should be performed.
         * @param {SeriesProperties} currentSeries - The current series being rendered.
         * @param {Points | undefined} currentPoint - The current point being rendered.
         * @param {number} pointIndex - The index of the current point.
         * @returns {RenderOptions} The animated render options path data.
         */
        doAnimation: (
            pathOptions: RenderOptions,
            index: number,
            animationState: AnimationState,
            enableAnimation: boolean,
            currentSeries: SeriesProperties,
            currentPoint: Points | undefined,
            pointIndex: number
        ) => {
            const animatedValues: {
                animatedDirection?: string;
                animatedTransform?: string;
            } = handleRectAnimation(
                pathOptions, currentSeries, index, currentPoint, pointIndex, animationState, enableAnimation
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
}

/**
 * Default instance of the candle series renderer.
 * Recommended to be used as a singleton across the application.
 */
const CandleSeriesRenderer: FinacialSeriesType = createCandleSeriesRenderer();
export default CandleSeriesRenderer;
