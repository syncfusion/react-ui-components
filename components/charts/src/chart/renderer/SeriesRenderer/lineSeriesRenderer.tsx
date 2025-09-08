
import { ChartMarkerProps, ChartLocationProps } from '../../base/interfaces';
import { getPoint } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import { calculatePathAnimation } from './SeriesAnimation';
import MarkerRenderer from './MarkerRenderer';
import { Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';

// Access LineBase directly as it's now a constant object, not a function
const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * Gets the line direction path between two points
 *
 * @param {Points} firstPoint - The starting point coordinates and data
 * @param {Points} secondPoint - The ending point coordinates and data
 * @param {SeriesProperties} series - Series configuration properties including axes information
 * @param {boolean} isInverted - Flag indicating if the chart orientation is inverted
 * @param {Function} getPointLocation - Function to convert data coordinates to chart pixel coordinates
 * @param {string} startPoint - SVG path command for the starting point (typically 'M' for move or 'L' for line)
 * @returns {string} SVG path string representing the line direction between the two points
 */
const getLineDirection: (
    firstPoint: Points,
    secondPoint: Points,
    series: SeriesProperties,
    isInverted: boolean,
    getPointLocation: Function,
    startPoint: string
) => string = (
    firstPoint: Points,
    secondPoint: Points,
    series: SeriesProperties,
    isInverted: boolean,
    getPointLocation: Function,
    startPoint: string
): string => {
    let direction: string = '';
    if (firstPoint != null) {
        const point1: ChartLocationProps = getPointLocation(
            firstPoint.xValue, firstPoint.yValue, series.xAxis, series.yAxis, isInverted, series
        );
        const point2: ChartLocationProps = getPointLocation(
            secondPoint.xValue, secondPoint.yValue, series.xAxis, series.yAxis, isInverted, series
        );

        direction = startPoint + ' ' + (point1.x) + ' ' + (point1.y) + ' ' +
            'L' + ' ' + (point2.x) + ' ' + (point2.y) + ' ';
    }
    return direction;
};

/**
 * Handles animation for line series.
 *
 * @param {RenderOptions} pathOptions - The path rendering options and properties
 * @param {number} index - The index of the series being animated
 * @param {Object} animationState - Animation state object containing refs and progress
 * @param {Object} animationState.previousPathLengthRef - Reference to store previous path lengths for animation
 * @param {Object} animationState.isInitialRenderRef - Reference to track if this is the initial render for each series
 * @param {Object} animationState.renderedPathDRef - Reference to store previously rendered path data
 * @param {number} animationState.animationProgress - Current animation progress value (0 to 1)
 * @param {Object} animationState.isFirstRenderRef - Reference to track if this is the very first render
 * @param {Object} animationState.previousSeriesOptionsRef - Reference to store previous series options for comparison
 * @param {boolean} enableAnimation - Flag indicating if animation is enabled
 * @param {SeriesProperties} _currentSeries - The current series being processed (unused)
 * @param {Points} _currentPoint - The current point being processed (unused)
 * @param {number} _pointIndex - The index of the current point (unused)
 * @param {SeriesProperties[]} visibleSeries - Array of visible series for animation calculation
 * @returns {Object} Animation properties including dash patterns and transforms
 */
const doAnimation: (
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
    _currentSeries: SeriesProperties,
    _currentPoint: Points | undefined,
    _pointIndex: number,
    visibleSeries: SeriesProperties[]
) => { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string | undefined } = (
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
    _currentSeries: SeriesProperties,
    _currentPoint: Points | undefined,
    _pointIndex: number,
    visibleSeries: SeriesProperties[]
) => {
    return calculatePathAnimation(pathOptions, index, animationState, enableAnimation, visibleSeries);
};


/**
 * Renders a line series by processing visible points and generating SVG path data for chart visualization.
 *
 * @param {SeriesProperties} series - The series configuration object containing data points, styling properties, and chart settings
 * @param {boolean} isInverted - Flag indicating whether the chart axes are inverted (swaps x-axis and y-axis positions)
 * @returns {RenderOptions[]|Object} Either an array of RenderOptions for the line path, or an object containing both options and marker configuration when markers are enabled
 */
const render: (
    series: SeriesProperties,
    isInverted: boolean
) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } = (
    series: SeriesProperties,
    isInverted: boolean
): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
    let direction: string = '';
    let prevPoint: Points | null = null;
    let startPoint: string = 'M';
    const getCoordinate: typeof getPoint = getPoint;
    const isDrop: boolean = Boolean(series.emptyPointSettings && series.emptyPointSettings.mode === 'Drop');
    const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series) || [];

    for (const point of visiblePoints) {
        point.regions = [];
        point.symbolLocations = [];

        if (point.visible) {
            direction += getLineDirection(prevPoint as Points, point, series, isInverted, getCoordinate, startPoint);
            startPoint = prevPoint ? 'L' : startPoint;
            prevPoint = point;
            lineBaseInstance.storePointLocation(point, series, isInverted, getCoordinate);

            if (direction === '' && visiblePoints.length === 1) {
                direction = 'M ' + point.symbolLocations[0].x + ' ' + point.symbolLocations[0].y;
            }
        } else {
            prevPoint = isDrop ? prevPoint : null;
            startPoint = isDrop ? startPoint : 'M';
        }
    }
    series.visiblePoints = visiblePoints;
    const name: string =
        series.chart.element.id + '_Series_' + series.index;
    const options: RenderOptions[] = [{
        id: name,
        fill: 'none',
        strokeWidth: series.width,
        stroke: series.interior,
        opacity: series.opacity,
        dashArray: series.dashArray,
        d: direction
    }];
    const marker: Object | null = series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
    return marker ? { options, marker } : options;
};

/**
 * Line Series Renderer - Pure functional approach
 */
const LineSeriesRenderer: {
    getLineDirection: (
        firstPoint: Points,
        secondPoint: Points,
        series: SeriesProperties,
        isInverted: boolean,
        getPointLocation: Function,
        startPoint: string
    ) => string;
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
        _currentSeries: SeriesProperties,
        _currentPoint: Points | undefined,
        _pointIndex: number,
        visibleSeries: SeriesProperties[]
    ) => { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string | undefined };
    render: (
        series: SeriesProperties,
        isInverted: boolean
    ) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };
} = {
    getLineDirection,
    doAnimation,
    render
};

export default LineSeriesRenderer;
