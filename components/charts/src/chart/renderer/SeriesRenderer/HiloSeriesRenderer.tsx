import * as React from 'react';
import { ChartBorderProps, ChartMarkerProps } from '../../base/interfaces';
import { DoubleRangeType, PointRenderingEvent, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { ColumnBase, ColumnBaseReturnType, FinacialSeriesType } from './ColumnBase';
import { useVisiblePoints } from '../../utils/helper';
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
 * Creates a renderer for Hilo series.
 * This factory function encapsulates the internal state and helper methods,
 * exposing only the necessary 'render' and 'doAnimation' functions.
 *
 * @returns {Object} - The public API for hilo series rendering.
 */
function createHiloSeriesRenderer(): FinacialSeriesType {

    // Encapsulated instance of ColumnBase logic.
    const hiloBaseInstance: ColumnBaseReturnType = ColumnBase();

    // Internal state for side-by-side calculations, now private to this module instance.
    const sideBySideInfo: DoubleRangeType[] = [];

    /**
     * Represents the point render event triggering.
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {Points} point - The corresponding data point.
     * @returns {Function} Returns a function call to trigger event from base.
     */
    const setBorderProperties: (series: SeriesProperties, point: Points) => PointRenderingEvent =
        (series: SeriesProperties, point: Points): PointRenderingEvent => {
            const border: ChartBorderProps = {
                color: series.fill as string,
                width: Math.max((series.border as ChartBorderProps)?.width as number, 2)
            };
            return hiloBaseInstance.triggerEvent(series, point, series.interior, border);
        };

    /**
     * Renders each Hilo ticks with appropriate properties.
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {Points} point - The corresponding data point.
     * @param {DoubleRangeType} sideBySide - Previous and Next data point information.
     * @returns {Function} Returns the function call to drawCandle method if point is appropriate.
     */
    const renderPoint: (series: SeriesProperties, point: Points, sideBySide: DoubleRangeType) => RenderOptions | undefined =
    (series: SeriesProperties, point: Points, sideBySide: DoubleRangeType):
    RenderOptions | undefined => {
        point.symbolLocations = [];
        point.regions = [];

        if (!point.visible) {
            return undefined;
        }

        const region: Rect = hiloBaseInstance.getRectangle(
            ((point.xValue as number) + sideBySide.median),
            Math.max((point.high as number), (point.low as number)),
            ((point.xValue as number) + sideBySide.median),
            Math.min((point.high as number), (point.low as number)),
            series
        );

        const argsData: PointRenderingEvent = setBorderProperties(series, point);

        if (!series.chart.requireInvertedAxis) {
            region.width = argsData.border?.width as number;
            region.x -= (region.width / 2);
        } else {
            region.height = argsData.border?.width as number;
            region.y -= (region.height / 2);
        }

        // The line is drawn using the region's fill, so we clear the border.
        argsData.border = { ...argsData.border, width: 0 };

        hiloBaseInstance.updateSymbolLocation(point, region, series);

        const seriesElementId: string = `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`;
        return hiloBaseInstance.drawRectangle(series, point, region, argsData, seriesElementId);
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
            sideBySideInfo[series.index] = hiloBaseInstance.getSideBySideInfo(series);
            const options: RenderOptions[] = [];

            for (const point of series.points) {
                const result: RenderOptions = renderPoint(
                    series, point, sideBySideInfo[series.index]
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
            const animatedvalues: { animatedDirection?: string; animatedTransform?: string; } = handleRectAnimation(
                pathOptions, currentSeries, index, currentPoint, pointIndex, animationState, enableAnimation
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
}

/**
 * Default instance of the Hilo series renderer.
 * Recommended to be used as a singleton across the application.
 */
const HiloSeriesRenderer: FinacialSeriesType = createHiloSeriesRenderer();

export default HiloSeriesRenderer;
