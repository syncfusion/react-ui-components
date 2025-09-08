import { ChartMarkerProps } from '../../base/interfaces';
import { DoubleRangeType, PointRenderingEvent, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { StackValuesType, useVisiblePoints } from '../../utils/helper';
import { ColumnBase, ColumnBaseReturnType } from './ColumnBase';
import MarkerRenderer from './MarkerRenderer';
import { handleRectAnimation } from './SeriesAnimation';

const columnBaseInstance: ColumnBaseReturnType = ColumnBase();

interface StackingColumnSeriesRendererType {
    sideBySideInfo: DoubleRangeType[];
    render(
        series: SeriesProperties,
        _isInverted: boolean
    ): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };

    renderPoint(
        series: SeriesProperties,
        point: Points,
        sideBySideInfo: DoubleRangeType,
        stackedValue: StackValuesType
    ): RenderOptions | undefined;

    doAnimation(
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
    ): {
        strokeDasharray: string;
        strokeDashoffset: number;
        interpolatedD: string | undefined;
        animatedDirection: string | undefined;
        animatedTransform: string | undefined;
    };
}

/**
 * Creates a StackingColumnSeriesRenderer instance for rendering stacked column series in chart visualization
 *
 * @description Handles rendering of stacking column series with support for animation,
 * side-by-side positioning, and custom styling. Provides methods for rendering individual
 * points, handling animations, and managing series-level operations.
 *
 * @returns {StackingColumnSeriesRendererType} A renderer object with methods for handling stacking column series
 */
function createStackingColumnSeriesRenderer(): StackingColumnSeriesRendererType {
    const sideBySideInfo: DoubleRangeType[] = [];

    return {
        sideBySideInfo,

        /**
         * Renders the complete stacking column series
         *
         * @param {SeriesProperties} series - The series data and configuration
         * @param {boolean} _isInverted - Whether the chart is inverted (currently unused)
         * @returns {Object} Array of render options or object with options and marker data
         *
         */
        render(series: SeriesProperties, _isInverted: boolean ):
        RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } {
            series.isRectSeries = true;
            this.sideBySideInfo[series.index] = columnBaseInstance.getSideBySideInfo(series);
            const stackedValue: StackValuesType = series.stackedValues;
            const options: RenderOptions[] = [];

            for (const point of series.points) {
                options.push(this.renderPoint(series, point, this.sideBySideInfo[series.index], stackedValue) as RenderOptions);
            }
            series.visiblePoints = useVisiblePoints(series);
            const marker: ChartMarkerProps | null = series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
            return marker ? { options, marker } : options;
        },

        /**
         * Renders an individual point in the stacking column series
         *
         * @param {SeriesProperties} series - The series containing the point
         * @param {Points} point - The specific point data to render
         * @param {DoubleRangeType} sideBySideInfo - Side-by-side positioning information
         * @param {StackValuesType} stackedValue - Stacked values for proper positioning
         * @returns {RenderOptions | undefined} Render options for the point or undefined if not rendered
         *
         */
        renderPoint(series: SeriesProperties, point: Points, sideBySideInfo: DoubleRangeType
            , stackedValue: StackValuesType): RenderOptions | undefined {
            // Add proper validation
            if (!point || !point.visible || !series) {
                return undefined;
            }

            point.symbolLocations = [];
            point.regions = [];

            let index: number | undefined;
            let startvalue: number | undefined = 0;

            if (!series.visible && series.isLegendClicked) {
                for (let i: number = series.index; i >= 0; i--) {
                    const currentSeries: SeriesProperties = series.chart.visibleSeries[i as number];
                    if (currentSeries.visible && currentSeries.stackingGroup === series.stackingGroup) {
                        index = currentSeries.index;
                        break;
                    }
                }
                startvalue = series.index > 0 && index !== undefined ?
                    series.chart.visibleSeries[index as number]?.stackedValues?.endValues?.[point.index] :
                    series.stackedValues?.startValues?.[point.index];
            }

            const rect: Rect = columnBaseInstance.getRectangle(
                Number(point.xValue) + sideBySideInfo.start,
                (!series.visible && series.isLegendClicked) ? Number(startvalue) : Number(stackedValue.endValues?.[point.index]),
                Number(point.xValue) + sideBySideInfo.end,
                (!series.visible && series.isLegendClicked) ? Number(startvalue) : Number(stackedValue.startValues?.[point.index]),
                series
            );

            if (series.chart.iSTransPosed && series.columnWidthInPixel) {
                rect.height = series.columnWidthInPixel ? series.columnWidthInPixel : rect.width;
                rect.y -= series.columnWidthInPixel / 2;
            } else {
                rect.width = series.columnWidthInPixel ? series.columnWidthInPixel : rect.width;
            }

            rect.x = series.columnWidthInPixel ?
                (series.chart.iSTransPosed ? rect.x : rect.x - (((series.columnWidthInPixel / 2) * Number(series.rectCount)) -
                    (series.columnWidthInPixel * (typeof series.position === 'number' ? series.position : 0)))) : rect.x;

            const argsData: PointRenderingEvent = columnBaseInstance.triggerEvent(
                series,
                point,
                series.interior,
                {
                    width: series.border?.width,
                    color: series.border?.color
                }
            );

            columnBaseInstance.updateSymbolLocation(point, {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            }, series);

            const name: string = series.chart.element.id + '_Series_' + series.index + '_Point_' + point.index;
            const option: RenderOptions = columnBaseInstance.drawRectangle(series, point, rect, argsData, name);
            return option;
        },

        /**
         * Handles animation for stacking column series points
         *
         * @param {RenderOptions} pathOptions - The render options for the animated element
         * @param {number} index - The series index
         * @param {object} animationState - Animation state containing references and progress
         * @param {boolean} enableAnimation - Whether animation is enabled
         * @param {SeriesProperties} currentSeries - The current series being animated
         * @param {Points | undefined} currentPoint - The current point being animated (optional)
         * @param {number} pointIndex - Index of the current point
         * @returns {object} Animation properties including stroke dash array/offset and animated transforms
         * @returns {string} returns.strokeDasharray - CSS stroke dash array value
         * @returns {number} returns.strokeDashoffset - CSS stroke dash offset value
         * @returns {string | undefined} returns.interpolatedD - Interpolated path data (unused for rectangles)
         * @returns {string | undefined} returns.animatedDirection - Animated direction transform
         * @returns {string | undefined} returns.animatedTransform - Animated transform properties
         *
         */
        doAnimation(
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
        ): {
                strokeDasharray: string;
                strokeDashoffset: number;
                interpolatedD: string | undefined;
                animatedDirection: string | undefined;
                animatedTransform: string | undefined;
            } {
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
 * StackingColumnSeriesRenderer - Renders stacked column series for chart visualization
 *
 * @description A singleton instance that handles rendering of stacking column series with support for animation,
 * side-by-side positioning, and custom styling. Provides comprehensive functionality for rendering
 * individual points, managing animations, and handling series-level operations.
 *
 */
const StackingColumnSeriesRenderer: StackingColumnSeriesRendererType = createStackingColumnSeriesRenderer();

export default StackingColumnSeriesRenderer;
