/**
 * Radar Stacking Area Series Renderer
 * Renders stacking area series in radar coordinate systems with radial expansion.
 *
 * @private
 */

import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { transformToRadarCoordinates } from '../../utils/polarRadarHelper';
import { Chart, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback } from '../../utils/helper';
import { getStackedValues } from './PolarStackingAreaSeriesRenderer';

/**
 * Generates the SVG path for a radar stacking area series.
 * Creates both the outer and inner edges so the stacked area can be filled correctly.
 *
 * @param {SeriesProperties} series - The stacking area series configuration.
 * @returns {string} The SVG path string for the stacked area.
 */
function generateRadarStackingAreaPath(series: SeriesProperties): string {
    let path: string = '';
    const chart: Chart = series.chart;
    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);

    if (visiblePoints.length === 0) {
        return path;
    }

    const wrap: boolean = series.isClosedPath !== false;

    // ---------- OUTER EDGE ----------
    const firstStack: {start: number; end: number; } = getStackedValues(0, series);
    const firstOuter: ChartLocationProps = transformToRadarCoordinates(
        visiblePoints[0].xValue as number,
        firstStack.end,
        series.xAxis,
        series.yAxis,
        chart
    );

    path += `M ${firstOuter.x} ${firstOuter.y}`;

    for (let i: number = 1; i < visiblePoints.length; i++) {
        const stacked: {start: number; end: number; } = getStackedValues(i, series);
        const p: ChartLocationProps = transformToRadarCoordinates(
            visiblePoints[i as number].xValue as number,
            stacked.end,
            series.xAxis,
            series.yAxis,
            chart
        );
        path += ` L ${p.x} ${p.y}`;
    }

    //  Wrap only when isClosedPath === true
    if (wrap) {
        path += ` L ${firstOuter.x} ${firstOuter.y}`;
    }

    // ---------- INNER EDGE (ALWAYS REQUIRED) ----------
    const firstInnerStack: {start: number; end: number; } = getStackedValues(0, series);
    const firstInner: ChartLocationProps = transformToRadarCoordinates(
        visiblePoints[0].xValue as number,
        firstInnerStack.start,
        series.xAxis,
        series.yAxis,
        chart
    );

    path += ` M ${firstInner.x} ${firstInner.y}`;

    for (let i: number = visiblePoints.length - 1; i >= 0; i--) {
        const stacked: {start: number; end: number; } = getStackedValues(i, series);
        const p: ChartLocationProps = transformToRadarCoordinates(
            visiblePoints[i as number].xValue as number,
            stacked.start,
            series.xAxis,
            series.yAxis,
            chart
        );
        path += ` L ${p.x} ${p.y}`;
    }

    //  Close geometry (SVG requirement)
    path += ' Z';

    return path;
}

/**
 * Generates the SVG path for the border of a radar stacking area series.
 * Follows the outer stacked edge and then returns along the inner stacked edge.
 *
 * @param {SeriesProperties} series - The stacking area series configuration.
 * @returns {string} The SVG path string for the stacked area border.
 */
function generateRadarStackingAreaBorderPath(series: SeriesProperties): string {
    let path: string = '';
    const chart: Chart = series.chart;
    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);

    if (visiblePoints.length === 0) {
        return path;
    }

    const firstStackedValue: {start: number; end: number; } = getStackedValues(0, series);
    const firstOuter: ChartLocationProps = transformToRadarCoordinates(
        visiblePoints[0].xValue as number,
        firstStackedValue.end,
        series.xAxis,
        series.yAxis,
        chart
    );

    path += `M ${firstOuter.x} ${firstOuter.y}`;

    // Add outer edge points
    for (let i: number = 1; i < visiblePoints.length; i++) {
        const stackedValue: {start: number; end: number; } = getStackedValues(i, series);
        const point: ChartLocationProps = transformToRadarCoordinates(
            visiblePoints[i as number].xValue as number,
            stackedValue.end,
            series.xAxis,
            series.yAxis,
            chart
        );
        path += ` L ${point.x} ${point.y}`;
    }

    // Close the path if isClosedPath is true (default behavior for polar/radar)
    if (series.isClosedPath !== false) {
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

    const areaPath: string = generateRadarStackingAreaPath(series);
    const borderPath: string =
            series.border?.width && series.border.width > 0
                ? generateRadarStackingAreaBorderPath(series)
                : '';

    series.visiblePoints = series.points.filter((p: Points) => p.visible);

    for (let i: number = 0; i < series.visiblePoints.length; i++) {
        const point: Points = series.visiblePoints[i as number];
        point.regions = [];
        point.symbolLocations = [];

        const stackedValue: {start: number; end: number; } = getStackedValues(i, series);
        const pointLoc: ChartLocationProps = transformToRadarCoordinates(
            point.xValue as number,
            stackedValue.end,
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

    const marker: Object | null =
            series.marker?.visible
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
}, enableAnimation: boolean, currentSeries: SeriesProperties,
    _currentPoint: Points | undefined, _pointIndex: number, visibleSeries: SeriesProperties[]) => {} = (
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
 * Radar Stacking Area Series Renderer
 */
const RadarStackingAreaSeriesRenderer: {
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

export default RadarStackingAreaSeriesRenderer;
