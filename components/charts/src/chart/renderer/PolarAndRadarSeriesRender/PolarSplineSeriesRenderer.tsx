/**
 * Polar Spline Series Renderer
 * Renders spline series in polar coordinate systems using smooth bezier curves.
 *
 * @private
 */

import { ChartMarkerProps, ChartLocationProps } from '../../base/interfaces';
import { monotonicSplineCoefficients, transformToPolarCoordinates } from '../../utils/polarRadarHelper';
import { ControlPoints, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback } from '../../utils/helper';
import SplineSeriesRenderer from '../SeriesRenderer/SplineSeriesRenderer';


/**
 * Renders a polar spline series by creating smooth bezier curves between data points.
 *
 * @param {SeriesProperties} series - The series configuration object
 * @param {boolean} _isInverted - Not used for polar series
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

        const polarPoint: ChartLocationProps = transformToPolarCoordinates(
            point.xValue as number,
            point.yValue as number,
            series.xAxis,
            series.yAxis,
            series.chart
        );

        point.symbolLocations = [{
            x: polarPoint.x - (series.clipRect?.x as number),
            y: polarPoint.y - (series.clipRect?.y as number)
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
            pathD = `M ${polarPoint.x} ${polarPoint.y}`;
        } else {
            const prevPoint: Points = visiblePoints[i - 1];

            const controlPoints: ControlPoints = SplineSeriesRenderer.getControlPoints(
                prevPoint,
                point,
                coefficients[i - 1],
                coefficients[i as number],
                series
            );

            const cp1Polar: ChartLocationProps = transformToPolarCoordinates(
                controlPoints.controlPoint1.x,
                controlPoints.controlPoint1.y,
                series.xAxis,
                series.yAxis,
                series.chart
            );

            const cp2Polar: ChartLocationProps = transformToPolarCoordinates(
                controlPoints.controlPoint2.x,
                controlPoints.controlPoint2.y,
                series.xAxis,
                series.yAxis,
                series.chart
            );

            pathD += ` C ${cp1Polar.x} ${cp1Polar.y} ${cp2Polar.x} ${cp2Polar.y} ${polarPoint.x} ${polarPoint.y}`;
        }
    }

    if (series.isClosedPath) {
        const firstPoint: Points = visiblePoints[0];
        const firstPolarPoint: ChartLocationProps = transformToPolarCoordinates(
            firstPoint.xValue as number,
            firstPoint.yValue as number,
            series.xAxis,
            series.yAxis,
            series.chart
        );

        pathD += ` L ${firstPolarPoint.x} ${firstPolarPoint.y}`;
    }

    series.visiblePoints = visiblePoints;

    const customizedValues: string = applyPointRenderCallback(({
        seriesIndex: series.index as number,
        color: series.interior as string,
        xValue: null,
        yValue: null
    }), series.chart);

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

    const marker: Object | null = series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
    return marker ? { options, marker } : options;
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
): { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string; animatedTransform?: string } => {
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
 * Polar Spline Series Renderer
 */
const PolarSplineSeriesRenderer: {
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
        _currentSeries: SeriesProperties,
        _currentPoint: Points | undefined,
        _pointIndex: number,
        visibleSeries: SeriesProperties[]
    ) => { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string; animatedTransform?: string };
} = {
    render,
    doAnimation
};

export default PolarSplineSeriesRenderer;
