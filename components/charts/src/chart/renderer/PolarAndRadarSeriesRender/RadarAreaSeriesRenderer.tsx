/**
 * Radar Area Series Renderer
 * Renders area series in radar coordinate systems with radial expansion animation.
 *
 * @private
 */

import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { transformToRadarCoordinates } from '../../utils/polarRadarHelper';
import { Chart, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback } from '../../utils/helper';

/**
 * Generates the SVG path for the filled radar area shape.
 * Connects all visible points and optionally closes the path to the baseline.
 *
 * @param {SeriesProperties} series - The series configuration that provides points, axes, and chart context.
 * @param {number} minValue - The minimum Y-axis value used as the area baseline.
 * @returns {string} The SVG path string for the area fill.
 * @private
 */
function generateRadarAreaPath(series: SeriesProperties, minValue: number): string {
    let path: string = '';
    const chart: Chart = series.chart;
    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);

    if (visiblePoints.length === 0) {
        return path;
    }

    // Start path with first point
    const firstPoint: ChartLocationProps = transformToRadarCoordinates(
        visiblePoints[0].xValue as number,
        visiblePoints[0].yValue as number,
        series.xAxis,
        series.yAxis,
        chart
    );

    path += `M ${firstPoint.x} ${firstPoint.y}`;

    // Add line to each visible point
    for (let i: number = 1; i < visiblePoints.length; i++) {
        const point: ChartLocationProps = transformToRadarCoordinates(
            visiblePoints[i as number].xValue as number,
            visiblePoints[i as number].yValue as number,
            series.xAxis,
            series.yAxis,
            chart
        );
        path += ` L ${point.x} ${point.y}`;
    }

    // Close path by connecting back through minimum value
    if (!series.isClosedPath) {
        for (let i: number = visiblePoints.length - 1; i >= 0; i--) {
            const point: ChartLocationProps = transformToRadarCoordinates(
                visiblePoints[i as number].xValue as number,
                minValue,
                series.xAxis,
                series.yAxis,
                chart
            );
            path += ` L ${point.x} ${point.y}`;
        }

        path += ' Z';
    }

    return path;
}

/**
 * Generates the SVG path for the radar area border.
 * The path follows the visible points and closes only when the series is configured to do so.
 *
 * @param {SeriesProperties} series - The series configuration that provides points, axes, and chart context.
 * @returns {string} The SVG path string for the border stroke.
 *
 * @private
 */
function generateRadarAreaBorderPath(series: SeriesProperties): string {
    let path: string = '';
    const chart: Chart = series.chart;
    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);

    if (visiblePoints.length === 0) {
        return path;
    }

    const firstPoint: ChartLocationProps = transformToRadarCoordinates(
        visiblePoints[0].xValue as number,
        visiblePoints[0].yValue as number,
        series.xAxis,
        series.yAxis,
        chart
    );

    path += `M ${firstPoint.x} ${firstPoint.y}`;

    for (let i: number = 1; i < visiblePoints.length; i++) {
        const point: ChartLocationProps = transformToRadarCoordinates(
            visiblePoints[i as number].xValue as number,
            visiblePoints[i as number].yValue as number,
            series.xAxis,
            series.yAxis,
            chart
        );
        path += ` L ${point.x} ${point.y}`;
    }

    if (series.isClosedPath) {
        path += ' Z';
    }

    return path;
}

const render: (
    series: SeriesProperties,
    _isInverted: boolean
) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } = (
    series: SeriesProperties,
    _isInverted: boolean
) => {
    void _isInverted;
    const options: RenderOptions[] = [];
    const minValue: number = series.yAxis.visibleRange.minimum;

    const areaPath: string = generateRadarAreaPath(series, minValue);
    const borderPath: string =
            series.border?.width && series.border.width > 0
                ? generateRadarAreaBorderPath(series)
                : '';

    series.visiblePoints = series.points.filter((p: Points) => p.visible);

    for (const point of series.visiblePoints) {
        point.regions = [];
        point.symbolLocations = [];

        const pointLoc: ChartLocationProps = transformToRadarCoordinates(
            point.xValue as number,
            point.yValue as number,
            series.xAxis,
            series.yAxis,
            series.chart
        );

        const markerWidth: number = series.marker?.width as number;
        const markerHeight: number = series.marker?.height as number;

        point.symbolLocations = [{
            x: pointLoc.x - (series.clipRect?.x as number),
            y: pointLoc.y - (series.clipRect?.y as number)
        }];

        point.regions.push({
            x: point.symbolLocations[0].x - markerWidth,
            y: point.symbolLocations[0].y - markerHeight,
            width: 2 * markerWidth,
            height: 2 * markerHeight
        });
    }

    const customizedColor: string = applyPointRenderCallback(
        {
            seriesIndex: series.index as number,
            color: series.interior as string,
            xValue: series.visiblePoints[0]?.xValue,
            yValue: series.visiblePoints[0]?.yValue
        },
        series.chart
    );

    options.push({
        id: `${series.chart.element.id}_Series_${series.index}`,
        fill: customizedColor,
        strokeWidth: 0,
        stroke: 'transparent',
        opacity: series.opacity,
        dashArray: series.dashArray,
        d: areaPath
    });

    if (borderPath) {
        options.push({
            id: `${series.chart.element.id}_Series_border_${series.index}`,
            fill: 'none',
            strokeWidth: series.border?.width,
            stroke: series.border?.color,
            opacity: 1,
            dashArray: series.border?.dashArray,
            d: borderPath
        });
    }

    const marker: Object | null = series.marker?.visible
        ? (MarkerRenderer.render(series) as Object)
        : null;

    return marker ? { options, marker } : options;
};


const doAnimation: (pathOptions: RenderOptions, index: number, animationState: {
    previousPathLengthRef: React.RefObject<number[]>;
    isInitialRenderRef: React.RefObject<boolean[]>;
    renderedPathDRef: React.RefObject<string[]>;
    animationProgress: number;
    isFirstRenderRef: React.RefObject<boolean>;
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
}, enableAnimation: boolean, currentSeries: SeriesProperties, _currentPoint: Points | undefined,
    _pointIndex: number, visibleSeries: SeriesProperties[]) => {} = (
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
 * Radar Area Series Renderer
 */
const RadarAreaSeriesRenderer: {
    render: (series: SeriesProperties, _isInverted: boolean) => RenderOptions[] | {
        options: RenderOptions[];
        marker: ChartMarkerProps;
    };
    doAnimation: (pathOptions: RenderOptions, index: number, animationState: {
        previousPathLengthRef: React.RefObject<number[]>;
        isInitialRenderRef: React.RefObject<boolean[]>;
        renderedPathDRef: React.RefObject<string[]>;
        animationProgress: number;
        isFirstRenderRef: React.RefObject<boolean>;
        previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
    }, enableAnimation: boolean, currentSeries: SeriesProperties,
        _currentPoint: Points | undefined, _pointIndex: number, visibleSeries: SeriesProperties[]) => {};
} = {
    render,
    doAnimation
};

export default RadarAreaSeriesRenderer;
