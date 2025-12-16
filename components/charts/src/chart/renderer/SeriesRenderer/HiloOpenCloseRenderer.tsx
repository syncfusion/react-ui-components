import * as React from 'react';
import { ChartBorderProps, ChartMarkerProps } from '../../base/interfaces';
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
 * Creates a renderer for Hilo Open/Close series.
 * This factory function encapsulates the internal state and helper methods,
 * exposing only the necessary 'render' and 'doAnimation' functions.
 *
 * @returns {Object} - The public API for OHLC series rendering.
 */
function createHiloOpenCloseSeriesRenderer(): FinacialSeriesType {

    // Encapsulated instance of ColumnBase logic.
    const hiloOpenCloseBaseInstance: ColumnBaseReturnType = ColumnBase();

    // Internal state for side-by-side calculations, now private.
    const sideBySideInfo: DoubleRangeType[] = [];

    /**
     * Updates the tick region based on the specified parameters.
     *
     * @param {boolean} horizontal - Specifies whether the tick region is horizontal.
     * @param {Rect} region - The region to update.
     * @param {number} borderWidth - The width of the border.
     * @returns {void}
     */
    const updateTickRegion: (horizontal: boolean, region: Rect, borderWidth: number) => void =
        (horizontal: boolean, region: Rect, borderWidth: number): void => {
            if (horizontal) {
                region.x -= borderWidth / 2;
                region.width = borderWidth;
            } else {
                region.y -= borderWidth / 2;
                region.height = borderWidth;
            }
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
            const isUpBar: boolean = (point.close as number) >= (point.open as number); // equal counted as up
            const bull: string = series.bullFillColor ?? series.chart.themeStyle.bullFillColor;
            const bear: string = series.bearFillColor ?? series.chart.themeStyle.bearFillColor;
            const fill: string = isUpBar ? bull : bear;
            const borderFromSeries: ChartBorderProps = series.border as ChartBorderProps;
            const border: ChartBorderProps = {
                color: borderFromSeries?.color,
                width: Math.max((borderFromSeries?.width as number) ?? 1, 1)
            };
            const customizedValues: string = applyPointRenderCallback(({
                seriesIndex: series.index as number, color: fill,
                xValue: point.xValue as  number | Date | string | null,
                yValue: point.yValue as  number | Date | string | null
            }), series.chart);
            return hiloOpenCloseBaseInstance.triggerEvent(series, point, customizedValues, border);
        };

    /**
     * Build the SVG path for Open/Close/High/Low ticks
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {{x: number, y: number}} open - Coordinates for the Open tick.
     * @param {{x: number, y: number}} close - Coordinates for the Close tick.
     * @param {Rect} rect - The point region responsible for drawing Hilo ticks.
     * @param {PointRenderingEvent} argsData - Point render event data, if triggered.
     * @returns {string} Returns the SVG path direction as string.
     */
    const getOpenClosePath: (series: SeriesProperties, open: {
        x: number;
        y: number;
    }, close: {
            x: number;
            y: number;
        }, rect: Rect, argsData: PointRenderingEvent) => string = (
        series: SeriesProperties,
        open: { x: number, y: number },
        close: { x: number, y: number },
        rect: Rect,
        argsData: PointRenderingEvent
    ): string => {
        let direction: string = '';
        if (series.chart.requireInvertedAxis) {
            // High-Low main line
            direction += `M ${rect.x} ${rect.y + rect.height / 2} L ${rect.x + rect.width} ${rect.y + rect.height / 2} `;
            // Open tick
            direction += `M ${open.x} ${rect.y + rect.height / 2} L ${open.x} ${rect.y + rect.height} `;
            // Close tick
            direction += `M ${close.x} ${rect.y + rect.height / 2} L ${close.x} ${rect.y} `;
        } else {
            // High-Low main line
            direction += `M ${rect.x + rect.width / 2} ${rect.y + rect.height} L ${rect.x + rect.width / 2} ${rect.y} `;
            // Open tick
            direction += `M ${rect.x} ${open.y} L ${rect.x + rect.width / 2 + (argsData.border.width as number) / 2} ${open.y} `;
            // Close tick
            direction += `M ${rect.x + rect.width / 2 - (argsData.border.width as number) / 2} ${close.y} L ${rect.x + rect.width} ${close.y} `;
        }
        return direction;
    };

    /**
     * Renders each Hilo ticks with appropriate properties.
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
        point.symbolLocations = [];
        point.regions = [];
        // let highLowRect: Rect | undefined;

        if (!point.visible) {
            return undefined;
        }

        const highLowRect: Rect = hiloOpenCloseBaseInstance.getRectangle(
            (point.xValue as number) + sideBySide.start, Math.max(point.high as number, point.low as number),
            (point.xValue as number) + sideBySide.end, Math.min(point.high as number, point.low as number),
            series
        );

        point.regions.push(hiloOpenCloseBaseInstance.getRectangle(
            (point.xValue as number) + sideBySide.median, Math.max(point.high as number, point.low as number),
            (point.xValue as number) + sideBySide.median, Math.min(point.high as number, point.low as number),
            series
        ));
        updateTickRegion(!series.chart.requireInvertedAxis, point.regions[0], borderWidth);

        point.regions.push(hiloOpenCloseBaseInstance.getRectangle(
            (point.xValue as number) + sideBySide.start, Math.max(point.open as number, point.close as number),
            (point.xValue as number) + sideBySide.median, Math.max(point.open as number, point.close as number),
            series
        ));
        point.regions.push(hiloOpenCloseBaseInstance.getRectangle(
            (point.xValue as number) + sideBySide.median, Math.min(point.open as number, point.close as number),
            (point.xValue as number) + sideBySide.end, Math.min(point.open as number, point.close as number),
            series
        ));

        const argsData: PointRenderingEvent = setBorderProperties(series, point);

        hiloOpenCloseBaseInstance.updateSymbolLocation(point, point.regions[0], series);

        const index1: number = point.open > point.close ? 1 : 2;
        const index2: number = point.open > point.close ? 2 : 1;
        const openPointLocation: { x: number; y: number } = { x: point.regions[index1 as number].x, y: point.regions[index1 as number].y };
        const closePointLocation: { x: number; y: number } = { x: point.regions[index2 as number].x, y: point.regions[index2 as number].y };

        const direction: string = getOpenClosePath(series, openPointLocation, closePointLocation, highLowRect, argsData);
        const seriesElementId: string = `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`;

        updateTickRegion(series.chart.requireInvertedAxis, point.regions[1], borderWidth);
        updateTickRegion(series.chart.requireInvertedAxis, point.regions[2], borderWidth);

        return {
            id: seriesElementId,
            fill: argsData.fill,
            strokeWidth: (argsData.border as ChartBorderProps)?.width as number,
            stroke: argsData.fill,
            opacity: series.opacity,
            dashArray: series.dashArray || '',
            d: direction
        };
    };

    // Return the public API for the renderer
    return {
        /**
         * Renders the Hilo open close series.
         *
         * @param {SeriesProperties} series - The series to be rendered.
         * @param {boolean} _isInverted - Specifies whether the chart is inverted.
         * @returns {Object} Returns the final series with assigned data point properties.
         */
        render: (series: SeriesProperties, _isInverted: boolean) => {
            sideBySideInfo[series.index] = hiloOpenCloseBaseInstance.getSideBySideInfo(series);
            const borderWidth: number = Math.max((series.border as ChartBorderProps).width as number, 2);
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
         * Animates the HLOCs while rendering.
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
            const animatedvalues: {
                animatedDirection?: string;
                animatedTransform?: string;
            } = handleRectAnimation(
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
 * Default instance of the Hilo Open/Close series renderer.
 * Recommended to be used as a singleton across the application.
 */
const HiloOpenCloseSeriesRenderer: FinacialSeriesType = createHiloOpenCloseSeriesRenderer();

export default HiloOpenCloseSeriesRenderer;
