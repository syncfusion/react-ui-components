/**
 * Radar Spline Area Series Renderer
 * Renders spline area series in radar coordinate systems with smooth bezier curves and area fill.
 *
 * @private
 */

import { ChartMarkerProps, ChartLocationProps } from '../../base/interfaces';
import { monotonicSplineCoefficients, transformToRadarCoordinates } from '../../utils/polarRadarHelper';
import { ControlPoints, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback } from '../../utils/helper';
import SplineSeriesRenderer from '../SeriesRenderer/SplineSeriesRenderer';

const render: (
    series: SeriesProperties,
    _isInverted: boolean
) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } =
(series: SeriesProperties, _isInverted: boolean) => {
    void _isInverted;
    const options: RenderOptions[] = [];
    series.isRectSeries = false;

    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);
    if (visiblePoints.length < 2) {
        return [];
    }

    let pathD: string = '';
    let bottomPathD: string = '';
    let coefficients: number[] = [];

    // Use custom monotonic implementation for polar coordinates
    if (series.splineType === 'Monotonic') {
        coefficients = monotonicSplineCoefficients(visiblePoints);
    } else {
        coefficients = SplineSeriesRenderer.findSplineCoefficients(visiblePoints, series);
    }
    const minValue: number = series.yAxis.visibleRange.minimum;

    // Top spline path
    for (let i: number = 0; i < visiblePoints.length; i++) {
        const point: Points = visiblePoints[i as number];
        point.regions = [];
        point.symbolLocations = [];

        const radarPoint: ChartLocationProps = transformToRadarCoordinates(
            point.xValue as number,
            point.yValue as number,
            series.xAxis,
            series.yAxis,
            series.chart
        );

        point.symbolLocations = [{
            x: radarPoint.x - (series.clipRect?.x as number),
            y: radarPoint.y - (series.clipRect?.y as number)
        }];

        const markerWidth: number = series.marker?.width as number;
        const markerHeight: number = series.marker?.height as number;

        point.regions.push({
            x: point.symbolLocations[0].x - markerWidth,
            y: point.symbolLocations[0].y - markerHeight,
            width: 2 * markerWidth,
            height: 2 * markerHeight
        });

        if (i === 0) {
            pathD = `M ${radarPoint.x} ${radarPoint.y}`;
        } else {
            const prevPoint: Points = visiblePoints[i - 1];
            const controlPoints: ControlPoints = SplineSeriesRenderer.getControlPoints(
                prevPoint,
                point,
                coefficients[i - 1],
                coefficients[i as number],
                series
            );

            const cp1Radar: ChartLocationProps = transformToRadarCoordinates(
                controlPoints.controlPoint1.x,
                controlPoints.controlPoint1.y,
                series.xAxis,
                series.yAxis,
                series.chart
            );

            const cp2Radar: ChartLocationProps = transformToRadarCoordinates(
                controlPoints.controlPoint2.x,
                controlPoints.controlPoint2.y,
                series.xAxis,
                series.yAxis,
                series.chart
            );

            pathD += ` C ${cp1Radar.x} ${cp1Radar.y} ${cp2Radar.x} ${cp2Radar.y} ${radarPoint.x} ${radarPoint.y}`;
        }
    }

    // Bottom baseline (min value)
    for (let i: number = visiblePoints.length - 1; i >= 0; i--) {
        const point: Points = visiblePoints[i as number];
        const bottomPoint: ChartLocationProps = transformToRadarCoordinates(
            point.xValue as number,
            minValue,
            series.xAxis,
            series.yAxis,
            series.chart
        );

        bottomPathD += ` L ${bottomPoint.x} ${bottomPoint.y}`;
    }

    const fullAreaPath: string = series.isClosedPath ? pathD : pathD + bottomPathD + ' Z';

    const customizedColor: string = applyPointRenderCallback(
        {
            seriesIndex: series.index as number,
            color: series.interior as string,
            xValue: null,
            yValue: null
        },
        series.chart
    );

    options.push({
        id: `${series.chart.element.id}_Series_${series.index}`,
        fill: customizedColor,
        strokeWidth: 0,
        stroke: 'transparent',
        opacity: series.opacity,
        dashArray: '',
        d: fullAreaPath
    });

    if (series.isClosedPath) {
        pathD += ' Z';
    }
    if (series.border?.width && series.border.width > 0) {
        options.push({
            id: `${series.chart.element.id}_Series_border_${series.index}`,
            fill: 'none',
            strokeWidth: series.border.width,
            stroke: series.border.color || customizedColor,
            opacity: 1,
            dashArray: series.border.dashArray || '',
            d: pathD
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
 * Radar Spline Area Series Renderer
 */
const RadarSplineAreaSeriesRenderer: {
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

export default RadarSplineAreaSeriesRenderer;
