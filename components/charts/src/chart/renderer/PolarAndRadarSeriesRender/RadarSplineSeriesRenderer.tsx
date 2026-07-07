/**
 * Radar Spline Series Renderer
 * Renders spline series in radar coordinate systems using smooth bezier curves.
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


/**
 * Renders a radar spline series by creating smooth bezier curves between data points.
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
) => {
    void _isInverted;
    const options: RenderOptions[] = [];
    series.isRectSeries = false;

    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);
    if (visiblePoints.length < 2) {
        return [];
    }

    let pathD: string = '';
    let coefficients: number[] = [];

    // Use custom monotonic implementation for polar coordinates
    if (series.splineType === 'Monotonic') {
        coefficients = monotonicSplineCoefficients(visiblePoints);
    } else {
        coefficients = SplineSeriesRenderer.findSplineCoefficients(visiblePoints, series);
    }

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

    if (series.isClosedPath) {
        const firstPoint: Points = visiblePoints[0];
        const firstRadarPoint: ChartLocationProps = transformToRadarCoordinates(
            firstPoint.xValue as number,
            firstPoint.yValue as number,
            series.xAxis,
            series.yAxis,
            series.chart
        );

        pathD += ` L ${firstRadarPoint.x} ${firstRadarPoint.y}`;
    }

    series.visiblePoints = visiblePoints;

    const customizedValues: string = applyPointRenderCallback(
        {
            seriesIndex: series.index as number,
            color: series.interior as string,
            xValue: null,
            yValue: null
        },
        series.chart
    );

    const pathId: string = `${series.chart.element.id}_Series_${series.index}`;
    options.push({
        id: pathId,
        fill: 'none',
        strokeWidth: series.width,
        stroke: customizedValues,
        opacity: series.opacity,
        dashArray: series.dashArray,
        d: pathD
    });

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
 * Radar Spline Series Renderer
 */
const RadarSplineSeriesRenderer: {
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

export default RadarSplineSeriesRenderer;
