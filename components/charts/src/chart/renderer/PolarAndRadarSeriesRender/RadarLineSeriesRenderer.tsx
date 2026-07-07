/**
 * Radar Line Series Renderer
 * Renders closed-path line series in radar coordinate systems.
 * Lines connect points in angular-radial space and close the path back to the starting point.
 *
 * @private
 */

import { ChartMarkerProps, ChartLocationProps } from '../../base/interfaces';
import { applyPointRenderCallback } from '../../utils/helper';
import { transformToRadarCoordinates } from '../../utils/polarRadarHelper';
import { LineBase, LineBaseReturnType } from '../SeriesRenderer/LineBase';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';

const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * Gets the radar line direction path between two points.
 * Points are transformed from radar coordinates to pixel coordinates.
 * Unlike radar, radar doesn't close automatically - that's done in render().
 *
 * @param {Points} firstPoint - The starting point data
 * @param {Points} secondPoint - The ending point data
 * @param {SeriesProperties} series - Series configuration with axes and chart info
 * @param {boolean} _isInverted - Not used for radar, kept for interface compatibility
 * @param {string} startPoint - SVG path command ('M' for move, 'L' for line)
 * @returns {string} SVG path string for the line segment
 */
export const getRadarLineDirection: (
    firstPoint: Points,
    secondPoint: Points,
    series: SeriesProperties,
    _isInverted: boolean,
    startPoint: string
) => string = (
    firstPoint: Points,
    secondPoint: Points,
    series: SeriesProperties,
    _isInverted: boolean,
    startPoint: string
): string => {
    let direction: string = '';
    if (firstPoint != null && firstPoint.xValue != null && firstPoint.yValue != null) {
        const point1: ChartLocationProps = transformToRadarCoordinates(
            firstPoint.xValue as number, firstPoint.yValue as number, series.xAxis, series.yAxis, series.chart
        );
        const point2: ChartLocationProps = transformToRadarCoordinates(
            secondPoint.xValue as number, secondPoint.yValue as number, series.xAxis, series.yAxis, series.chart
        );

        direction = startPoint + ' ' + (point1.x) + ' ' + (point1.y) + ' ' +
                'L' + ' ' + (point2.x) + ' ' + (point2.y) + ' ';
    }
    return direction;
};

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
    currentSeries: SeriesProperties,
    _currentPoint: Points | undefined,
    _pointIndex: number,
    visibleSeries: SeriesProperties[]
) => { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string; animatedTransform?: string } = (
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
    _currentPoint: Points | undefined,
    _pointIndex: number,
    visibleSeries: SeriesProperties[]
) => {
    // Use polar/radar-specific animation that expands from center
    return calculatePolarRadarAnimation(
        pathOptions,
        index,
        animationState,
        enableAnimation,
        currentSeries,
        undefined,
        _pointIndex,
        visibleSeries
    );
};

/**
 * Renders a radar line series by processing visible points and generating SVG path data.
 * The path connects points in radar space and closes the path to form a closed polygon.
 *
 * @param {SeriesProperties} series - The series configuration object
 * @param {boolean} _isInverted - Not used for radar series
 * @returns {RenderOptions[] | Object} Array of render options or object with options and marker
 */
const render: (
    series: SeriesProperties,
    _isInverted: boolean
) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } = (
    series: SeriesProperties,
    _isInverted: boolean
): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
    void _isInverted;
    let direction: string = '';
    let prevPoint: Points | null = null;
    let startPoint: string = 'M';
    let firstRadarLocation: ChartLocationProps | null = null;
    const isDrop: boolean = Boolean(series.emptyPointSettings && series.emptyPointSettings.mode === 'Drop');
    const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series) || [];
    let seriesStroke: string | undefined;

    for (const point of visiblePoints) {
        point.regions = [];
        point.symbolLocations = [];

        if (point.visible) {
            direction += getRadarLineDirection(prevPoint as Points, point, series, false, startPoint);
            startPoint = prevPoint ? 'L' : startPoint;
            prevPoint = point;

            // Store point location in radar coordinates for interactions
            const radarLocation: ChartLocationProps = transformToRadarCoordinates(
                point.xValue as number, point.yValue as number, series.xAxis, series.yAxis, series.chart
            );

            // Track first point for closing the polygon
            if (firstRadarLocation === null) {
                firstRadarLocation = radarLocation;
            }
            const markerWidth: number = (series.marker && series.marker.width) ? series.marker.width : 0;
            const markerHeight: number = (series.marker && series.marker.height) ? series.marker.height : 0;
            point.symbolLocations = [{ x: radarLocation.x - (series.clipRect?.x as number),
                y: radarLocation.y - (series.clipRect?.y as number) }];
            point.regions.push({
                x: point.symbolLocations[0].x - markerWidth,
                y: point.symbolLocations[0].y - markerHeight,
                width: 2 * markerWidth,
                height: 2 * markerHeight
            });

            const customizedValues: string = applyPointRenderCallback(({
                seriesIndex: series.index as number, color: series.interior as string,
                xValue: point.xValue as number | Date | string | null,
                yValue: point.yValue as number | Date | string | null
            }), series.chart);
            point.interior = customizedValues;
            if (!seriesStroke) { seriesStroke = customizedValues; }

            if (direction === '' && visiblePoints.length === 1) {
                direction = 'M ' + radarLocation.x + ' ' + radarLocation.y;
            }
        } else {
            prevPoint = isDrop ? prevPoint : null;
            startPoint = isDrop ? startPoint : 'M';
        }
    }

    // Close the path only if isClosedPath is true
    if (series.isClosedPath && firstRadarLocation !== null && prevPoint !== null) {
        direction += 'L ' + firstRadarLocation.x + ' ' + firstRadarLocation.y + ' ';
    }

    series.visiblePoints = visiblePoints;
    const name: string = series.chart.element.id + '_Series_' + series.index;
    const options: RenderOptions[] = [{
        id: name,
        fill: 'none',
        strokeWidth: series.width,
        stroke: seriesStroke,
        opacity: series.opacity,
        dashArray: series.dashArray,
        d: direction
    }];

    const marker: Object | null = series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
    return marker ? { options, marker } : options;
};

/**
 * Radar Line Series Renderer - Pure functional approach
 */
const RadarLineSeriesRenderer: {
    getRadarLineDirection: (
        firstPoint: Points,
        secondPoint: Points,
        series: SeriesProperties,
        _isInverted: boolean,
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
    ) => { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string | undefined; animatedTransform?: string };
    render: (
        series: SeriesProperties,
        _isInverted: boolean
    ) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };
} = {
    getRadarLineDirection,
    doAnimation,
    render
};

export default RadarLineSeriesRenderer;
