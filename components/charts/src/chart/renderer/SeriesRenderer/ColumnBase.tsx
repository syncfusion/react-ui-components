import { isNullOrUndefined } from '@syncfusion/react-base';
import { ChartBorderProps, ChartLocationProps, ChartMarkerProps, ChartSeriesProps } from '../../base/interfaces';
import { getPoint, getMinPointsDelta, findSeriesCollection, setPointColor, setBorderColor, StackValuesType, applyPointRenderCallback } from '../../utils/helper';
import { createDoubleRange } from '../AxesRenderer/AxisTypeRenderer/DoubleAxisRenderer';
import { DoubleRangeType, PointRenderingEvent, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';

// Named constants to replace magic numbers
const DEFAULT_COLUMN_WIDTH: number = 0.7; // default column width ratio
const MAX_COLUMN_WIDTH: number = 1; // maximum column width
const HALF_POSITION_OFFSET: number = 0.5; // offset for centering position calculation

/**
 * Interface for Bar Series renderer functionality
 *
 * @interface BarSeriesType
 * @description Defines the core structure for bar series rendering with support for
 * side-by-side positioning, animation, and individual point rendering
 *
 */
export interface BarSeriesType {
    sideBySideInfo: DoubleRangeType[];
    render: Function,
    doAnimation: Function,
    renderPoint: Function
}

/**
 * Interface for Stacking Column Series renderer functionality
 *
 * @interface StackingColumnSeriesRendererType
 * @description Defines the complete structure for stacking column series rendering with support for
 * animation, side-by-side positioning, marker handling, and custom styling
 *
 */
export interface StackingColumnSeriesRendererType {
    sideBySideInfo: DoubleRangeType[];
    render: (
        series: SeriesProperties,
        _isInverted: boolean
    ) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };
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
        strokeDasharray: string;
        strokeDashoffset: number;
        interpolatedD: string | undefined;
        animatedDirection: string | undefined;
        animatedTransform: string | undefined;
    };
    renderPoint: (
        series: SeriesProperties,
        point: Points,
        sideBySideInfo: DoubleRangeType,
        stackedValue: StackValuesType
    ) => RenderOptions | undefined;
}

/**
 * Interface for the StackingBarSeriesRenderer object
 * @interface StackingBarSeriesRendererType
 * @private
 */
export interface StackingBarSeriesRendererType {
    /** Array to store side-by-side positioning information for multiple series */
    sideBySideInfo: DoubleRangeType[];

    /**
     * Renders the stacking bar series with all its points.
     *
     * @param {SeriesProperties} series - Series configuration and data points
     * @param {boolean} _isInverted - Chart inversion state (currently unused)
     * @param {Object} chartProps - Chart-level properties including event handlers
     * @returns {RenderOptions[]|Object} Array of render options or object containing options and marker properties
     */
    render: (
        series: SeriesProperties,
        _isInverted: boolean
    ) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };

    /**
     * Handles animation for the stacking bar series.
     *
     * @param {RenderOptions} pathOptions - Current render options for the path
     * @param {number} index - Index of the current series
     * @param {AnimationState} animationState - Complete animation state including refs and progress
     * @param {boolean} enableAnimation - Flag to enable/disable animations
     * @param {SeriesProperties} currentSeries - Series being animated
     * @param {Points | undefined} currentPoint - Point being animated (optional)
     * @param {number} pointIndex - Index of the current point
     * @returns {Object} Animation properties object
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
        strokeDasharray: string;
        strokeDashoffset: number;
        interpolatedD: string | undefined;
        animatedDirection: string | undefined;
        animatedTransform: string | undefined;
    };

    /**
     * Renders a single point in the stacking bar series.
     *
     * @param series - The series properties
     * @param point - The individual point to render
     * @param sideBySideInfo - Positioning information for side-by-side series
     * @param stackedValue - Stacked values for the current series
     * @returns Render options for the point or undefined if not rendered
     */
    renderPoint: (
        series: SeriesProperties,
        point: Points,
        sideBySideInfo: DoubleRangeType,
        stackedValue: StackValuesType
    ) => RenderOptions | undefined;
}

/**
 * Interface defining the functions available in the ColumnBase utility.
 *
 * @private
 */
export type ColumnBaseReturnType = {
    updateSymbolLocation: (point: Points, rect: Rect, series: SeriesProperties) => void;
    getRectangle: (x1: number, y1: number, x2: number, y2: number, series: SeriesProperties) => Rect;
    getSideBySideInfo: (series: SeriesProperties) => DoubleRangeType;
    calculateRoundedRectPath: (
        rect: Rect,
        topLeft: number,
        topRight: number,
        bottomLeft: number,
        bottomRight: number
    ) => string;
    drawRectangle: (series: SeriesProperties, point: Points, rect: Rect, argsData: PointRenderingEvent, name: string) => RenderOptions;
    triggerEvent: Function;
};

/**
 * Helper function to find rectangle positions for series collection
 * @param {SeriesProperties[]} seriesCollection - Collection of series properties
 * @returns {void}
 */
const findRectPositionHelper: (seriesCollection: SeriesProperties[]) => void
    = (seriesCollection: SeriesProperties[]): void => {
        const groupingValues: Record<string, number> = {};
        const verticalSeries: { rectCount: number; position: number | null } = { rectCount: 0, position: null };

        for (let i: number = 0; i < seriesCollection.length; i++) {
            const value: SeriesProperties = seriesCollection[i as number];
            if (value?.type?.indexOf('Stacking') !== -1 || value.groupName !== '') {
                const groupName: string | undefined = value?.type?.indexOf('Stacking') !== -1 ? value.stackingGroup : value.type + value.groupName;
                if (groupName) {
                    if (groupingValues[groupName as string] === undefined) {
                        value.position = verticalSeries.rectCount;
                        groupingValues[groupName as string] = verticalSeries.rectCount++;
                    } else {
                        value.position = groupingValues[groupName as string];
                    }
                } else {
                    if (verticalSeries.position === null) {
                        value.position = verticalSeries.rectCount;
                        verticalSeries.position = verticalSeries.rectCount++;
                    } else {
                        value.position = verticalSeries.position;
                    }
                }
            } else {
                value.position = verticalSeries.rectCount++;
            }
        }
        for (let i: number = 0; i < seriesCollection.length; i++) {
            const value: SeriesProperties = seriesCollection[i as number];
            value.rectCount = verticalSeries.rectCount;
        }
    };

/**
 * Helper function for getting region information for a data point
 * @param {Points} point - The data point
 * @param {Rect} rect - The rectangle bounds
 * @param {SeriesProperties} series - The series properties
 * @returns {void}
 */
const getRegionHelper: (point: Points, rect: Rect, series: SeriesProperties) => void
    = (point: Points, rect: Rect, series: SeriesProperties): void => {
        point.regions = point.regions || [];
        point.symbolLocations = point.symbolLocations || [];

        if (point.y === 0) {
            const markerWidth: number = (series.marker && series.marker.width) ? series.marker.width : 0;
            const markerHeight: number = (series.marker && series.marker.height) ? series.marker.height : 0;

            point.regions.push({
                x: point.symbolLocations[0].x - markerWidth,
                y: point.symbolLocations[0].y - markerHeight,
                width: 2 * markerWidth,
                height: 2 * markerHeight
            });
        } else {
            point.regions.push(rect);
        }
    };

/**
 * Helper function for updating X region symbol location.
 *
 * @param {Points} point - The data point
 * @param {Rect} rect - The rectangle bounds
 * @param {SeriesProperties} series - The series properties
 * @returns {void}
 */
const updateXRegionHelper: (point: Points, rect: Rect, series: SeriesProperties) => void
    = (point: Points, rect: Rect, series: SeriesProperties): void => {
        point.symbolLocations?.push({
            x: rect.x + (rect.width) / 2,
            y: ((series.seriesValueType && series.seriesValueType.indexOf('HighLow') !== -1) ||
                (point.yValue !== undefined && (point.yValue ?? 0) >= 0 === !series.yAxis.isAxisInverse)) ? rect.y : (rect.y + rect.height)
        });

        getRegionHelper(point, rect, series);
    };

/**
 * Helper function for updating Y region symbol location
 * @param {Points} point - The data point
 * @param {Rect} rect - The rectangle bounds
 * @param {SeriesProperties} series - The series properties
 * @returns {void}
 */
const updateYRegionHelper: (point: Points, rect: Rect, series: SeriesProperties) => void
    = (point: Points, rect: Rect, series: SeriesProperties): void => {
        point.symbolLocations?.push({
            x: ((series.seriesValueType && series.seriesValueType.indexOf('HighLow') !== -1) ||
                (point.yValue !== undefined && (point.yValue ?? 0) >= 0 === !series.yAxis.isAxisInverse)) ? rect.x + rect.width : rect.x,
            y: rect.y + rect.height / 2
        });

        getRegionHelper(point, rect, series);
    };

/**
 * Provides base functionality for column and bar series types
 * @returns {ColumnBaseReturnType} Object with column series rendering methods
 * @private
 */
export function ColumnBase(): ColumnBaseReturnType {

    /**
     * Gets the rectangle bounds based on two points.
     * @param {number} x1 - The x-coordinate of the first point
     * @param {number} y1 - The y-coordinate of the first point
     * @param {number} x2 - The x-coordinate of the second point
     * @param {number} y2 - The y-coordinate of the second point
     * @param {SeriesProperties} series - The series associated with the rectangle
     * @returns {Rect} The rectangle bounds
     */
    const getRectangle: (x1: number, y1: number, x2: number, y2: number, series: SeriesProperties) => Rect
        = (x1: number, y1: number, x2: number, y2: number, series: SeriesProperties): Rect => {
            const point1: ChartLocationProps = getPoint(x1, y1, series.xAxis, series.yAxis, series.chart.requireInvertedAxis);
            const point2: ChartLocationProps = getPoint(x2, y2, series.xAxis, series.yAxis, series.chart.requireInvertedAxis);
            return {
                x: Math.min(point1.x, point2.x),
                y: Math.min(point1.y, point2.y),
                width: Math.abs(point2.x - point1.x),
                height: Math.abs(point2.y - point1.y)
            };
        };

    /**
     * Updates symbol location for a data point based on chart orientation
     * @param {Points} point - The data point
     * @param {Rect} rect - The rectangle bounds
     * @param {SeriesProperties} series - The series properties
     * @returns {void}
     */
    const updateSymbolLocation: (point: Points, rect: Rect, series: SeriesProperties) => void
        = (point: Points, rect: Rect, series: SeriesProperties): void => {
            if (!series.chart.requireInvertedAxis) {
                updateXRegionHelper(point, rect, series);
            } else {
                updateYRegionHelper(point, rect, series);
            }
        };

    /**
     * Gets side-by-side positions for all series in the chart.
     *
     * @param {SeriesProperties} series - The series properties
     * @returns {void}
     */
    const getSideBySidePositions: (series: SeriesProperties) => void
        = (series: SeriesProperties): void => {
            const chart: SeriesProperties['chart'] = series.chart;
            for (const columnItem of chart.columns) {
                for (const item of chart.rows) {
                    findRectPositionHelper(findSeriesCollection(columnItem, item, false));
                }
            }
        };

    /**
     * Gets side-by-side information for column positioning.
     *
     * @param {SeriesProperties} series - The series properties
     * @returns {DoubleRangeType} The range information for side-by-side positioning
     */
    const getSideBySideInfo: (series: SeriesProperties) => DoubleRangeType
        = (series: SeriesProperties): DoubleRangeType => {
            series.isRectSeries = true;

            if ((series.chart.enableSideBySidePlacement && !series.position) || !isNullOrUndefined(series.columnWidthInPixel)) {
                getSideBySidePositions(series);
            }

            if (series.columnWidthInPixel) {
                return createDoubleRange(0, 0);
            }

            const position: number | undefined = !series.chart.enableSideBySidePlacement ? 0 : series.position;
            const rectCount: number | undefined = !series.chart.enableSideBySidePlacement ? 1 : series.rectCount;
            const visibleSeries: SeriesProperties[] = series.chart.visibleSeries;
            const seriesSpacing: number = series.chart.enableSideBySidePlacement
                ? (series.columnSpacing || 0) : 0;
            const pointSpacing: number = (series.columnWidth === null || series.columnWidth === undefined || isNaN(+(series.columnWidth)))
                ? DEFAULT_COLUMN_WIDTH : Math.min(series.columnWidth, MAX_COLUMN_WIDTH);

            const minimumPointDelta: number = getMinPointsDelta(series.xAxis, visibleSeries);
            const width: number = minimumPointDelta * pointSpacing;

            const location: number = (position!) / rectCount! - HALF_POSITION_OFFSET;
            let doubleRange: DoubleRangeType = createDoubleRange(location, location + (1 / rectCount!));

            if (!(isNaN(doubleRange.start) || isNaN(doubleRange.end))) {
                if (series.groupName && series?.type?.indexOf('Stacking') === -1) {
                    let mainColumnWidth: number = DEFAULT_COLUMN_WIDTH;
                    if (series.chart.visibleSeries) {
                        series.chart.visibleSeries.filter(function (series: ChartSeriesProps): void {
                            if ((series.columnWidth ?? 0) > mainColumnWidth) {
                                mainColumnWidth = series.columnWidth ?? 0;
                            }
                        });
                    }
                    const mainWidth: number = minimumPointDelta * mainColumnWidth;
                    const mainDoubleRange: DoubleRangeType = createDoubleRange(doubleRange.start * mainWidth, doubleRange.end * mainWidth);
                    const difference: number = (mainDoubleRange.delta - (doubleRange.end * width - doubleRange.start * width)) / 2;

                    doubleRange = createDoubleRange(mainDoubleRange.start + difference, mainDoubleRange.end - difference);
                } else {
                    doubleRange = createDoubleRange(doubleRange.start * width, doubleRange.end * width);
                }

                const radius: number = seriesSpacing * doubleRange.delta;
                doubleRange = createDoubleRange(doubleRange.start + radius / 2, doubleRange.end - radius / 2);
            }

            return doubleRange;
        };

    /**
     * Calculates the SVG path for a rounded rectangle
     * @param {Rect} rect - The rectangle bounds
     * @param {number} topLeft - Top-left corner radius
     * @param {number} topRight - Top-right corner radius
     * @param {number} bottomLeft - Bottom-left corner radius
     * @param {number} bottomRight - Bottom-right corner radius
     * @param {boolean} [inverted=false] - Whether the chart is inverted
     * @returns {string} SVG path string for the rounded rectangle
     */
    const calculateRoundedRectPath: (
        rect: Rect,
        topLeft: number,
        topRight: number,
        bottomLeft: number,
        bottomRight: number
    ) => string = (
        rect: Rect,
        topLeft: number,
        topRight: number,
        bottomLeft: number,
        bottomRight: number
    ): string => {
        const halfWidth: number = rect.width / 2;
        const halfHeight: number = rect.height / 2;
        topLeft = Math.min(topLeft, halfWidth, halfHeight);
        topRight = Math.min(topRight, halfWidth, halfHeight);
        bottomLeft = Math.min(bottomLeft, halfWidth, halfHeight);
        bottomRight = Math.min(bottomRight, halfWidth, halfHeight);

        return 'M' + ' ' + rect.x + ' ' + (topLeft + rect.y) +
            ' Q ' + rect.x + ' ' + rect.y + ' ' + (rect.x + topLeft) + ' ' +
            rect.y + ' ' + 'L' + ' ' + (rect.x + rect.width - topRight) + ' ' + rect.y +
            ' Q ' + (rect.x + rect.width) + ' ' + rect.y + ' ' +
            (rect.x + rect.width) + ' ' + (rect.y + topRight) + ' ' + 'L ' +
            (rect.x + rect.width) + ' ' + (rect.y + rect.height - bottomRight) +
            ' Q ' + (rect.x + rect.width) + ' ' + (rect.y + rect.height) + ' ' +
            (rect.x + rect.width - bottomRight) + ' ' + (rect.y + rect.height) +
            ' ' + 'L ' + (rect.x + bottomLeft) + ' ' + (rect.y + rect.height) +
            ' Q ' + rect.x + ' ' + (rect.y + rect.height) + ' ' + rect.x + ' ' +
            (rect.y + rect.height - bottomLeft) + ' ' + 'L' + ' ' + rect.x + ' ' +
            (topLeft + rect.y) + ' ' + 'Z';
    };

    /**
     * Draws a rectangle for a data point in a chart series.
     *
     * @param {SeriesProperties} series - The series object containing the data point
     * @param {Points} point - The data point to be rendered
     * @param {Rect} rect - The rectangle dimensions for the data point
     * @param {PointRenderingEvent} argsData - Arguments for rendering including styling properties
     * @param {string} name - The identifier for the rendered element
     * @returns {RenderOptions} Object containing SVG path properties including id, fill, stroke, etc.
     */
    const drawRectangle: (
        series: SeriesProperties,
        point: Points,
        rect: Rect,
        argsData: PointRenderingEvent,
        name: string
    ) => RenderOptions = (
        series: SeriesProperties,
        point: Points,
        rect: Rect,
        argsData: PointRenderingEvent,
        name: string
    ): RenderOptions => {
        const chart: SeriesProperties['chart'] = series.chart;
        const check: number = chart.requireInvertedAxis ? rect.height : rect.width;

        if (check <= 0) {
            return {} as RenderOptions;
        }

        let direction: string;
        if (point.y === 0) {
            // For 0 values corner radius will not calculate
            direction = calculateRoundedRectPath(rect, 0, 0, 0, 0);
        } else {
            let topLeft: number;
            let topRight: number;
            let bottomLeft: number;
            let bottomRight: number;
            const isNegative: boolean = (point.y as number) < 0;

            if (chart.requireInvertedAxis) {
                topLeft = isNegative ? argsData.cornerRadius?.topRight ?? 0 : argsData.cornerRadius?.topLeft ?? 0;
                topRight = isNegative ? argsData.cornerRadius?.topLeft ?? 0 : argsData.cornerRadius?.topRight ?? 0;
                bottomLeft = isNegative ? argsData.cornerRadius?.bottomRight ?? 0 : argsData.cornerRadius?.bottomLeft ?? 0;
                bottomRight = isNegative ? argsData.cornerRadius?.bottomLeft ?? 0 : argsData.cornerRadius?.bottomRight ?? 0;
            } else {
                topLeft = isNegative ? argsData.cornerRadius?.bottomLeft ?? 0 : argsData.cornerRadius?.topLeft ?? 0;
                topRight = isNegative ? argsData.cornerRadius?.bottomRight ?? 0 : argsData.cornerRadius?.topRight ?? 0;
                bottomLeft = isNegative ? argsData.cornerRadius?.topLeft ?? 0 : argsData.cornerRadius?.bottomLeft ?? 0;
                bottomRight = isNegative ? argsData.cornerRadius?.topRight ?? 0 : argsData.cornerRadius?.bottomRight ?? 0;
            }

            direction = calculateRoundedRectPath(rect, topLeft, topRight, bottomLeft, bottomRight);
        }
        const customPointRendering: string = applyPointRenderCallback(({
            seriesIndex: series.index as number, color: argsData.fill as string,
            xValue: point.xValue as  number | Date | string | null, yValue: point.yValue as  number | Date | string | null
        }), series.chart);

        return {
            id: name,
            fill: customPointRendering,
            strokeWidth: argsData.border?.width,
            stroke: argsData.border?.color,
            opacity: series.opacity,
            dashArray: series.border?.dashArray || '',
            d: direction
        };
    };

    /**
     * Triggers the point render event.
     *
     * @param {SeriesProperties} series - The series associated with the point
     * @param {Points} point - The data point for which the event is triggered
     * @param {string} fill - The fill color of the point
     * @param {ChartBorderProps} border - The border settings of the point
     * @returns {PointRenderingEvent} The event arguments
     */
    const triggerEvent: (series: SeriesProperties, point: Points, fill: string, border: ChartBorderProps)
    => PointRenderingEvent = (series: SeriesProperties, point: Points, fill: string, border: ChartBorderProps): PointRenderingEvent => {
        const argsData: PointRenderingEvent = {
            cancel: false,
            seriesName: series.name as string,
            point: point,
            fill: setPointColor(point, fill),
            border: setBorderColor(point, border),
            cornerRadius: series.cornerRadius
        };
        const customPointRendering: string = applyPointRenderCallback(({
            seriesIndex: series.index as number, color: argsData.fill as string,
            xValue: point.xValue as  number | Date | string | null, yValue: point.yValue as  number | Date | string | null
        }), series.chart);
        point.color = customPointRendering;
        return argsData;
    };

    return {
        updateSymbolLocation,
        getRectangle,
        getSideBySideInfo,
        calculateRoundedRectPath,
        drawRectangle,
        triggerEvent
    };
}

/**
 * Represents the type definition and contains parameters required for financial series types.
 *
 * @private
 */
export interface FinacialSeriesType {
    /**
     * Renders the complete series.
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {boolean} isInverted - Specifies whether the chart is inverted.
     * @returns {RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps }} The renderable options.
     */
    render: (series: SeriesProperties, isInverted: boolean) =>
    RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };

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
     * @param {SeriesProperties[]} [visibleSeries] - Optional list of visible series.
     * @returns {object} The animated render options path data.
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
        pointIndex: number,
        visibleSeries?: SeriesProperties[]
    ) => {
        strokeDasharray: string | number;
        strokeDashoffset: number;
        interpolatedD?: string;
        animatedDirection?: string;
        animatedTransform?: string;
    };
}

// Using only named export for consistency
export { ColumnBase as default };
