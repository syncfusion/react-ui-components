/**
 * Polar Spline Area Series Renderer
 * Renders spline area series in polar coordinate systems with smooth bezier curves and area fill.
 *
 * @private
 */

import { ChartMarkerProps, ChartLocationProps } from '../../base/interfaces';
import { monotonicSplineCoefficients, transformToPolarCoordinates } from '../../utils/polarRadarHelper';
import { Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback } from '../../utils/helper';
import SplineSeriesRenderer from '../SeriesRenderer/SplineSeriesRenderer';

/**
 * Renders a polar spline area series with smooth bezier curves and filled area.
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
    let bottomPathD: string = '';
    let coefficients: number[] = [];

    // Use custom monotonic implementation for polar coordinates
    if (series.splineType === 'Monotonic') {
        coefficients = monotonicSplineCoefficients(visiblePoints);
    } else {
        coefficients = SplineSeriesRenderer.findSplineCoefficients(visiblePoints, series);
    }

    const minValue: number = series.yAxis.visibleRange.minimum;

    // Top path (spline through data points)
    for (let i: number = 0; i < visiblePoints.length; i++) {
        const point: Points = visiblePoints[i as number];
        point.regions = [];
        point.symbolLocations = [];

        // Transform to polar coordinates
        const polarPoint: ChartLocationProps = transformToPolarCoordinates(
            point.xValue as number,
            point.yValue as number,
            series.xAxis,
            series.yAxis,
            series.chart
        );

        // Set marker location
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

        // Build top path
        if (i === 0) {
            pathD = `M ${polarPoint.x} ${polarPoint.y}`;
        } else {
            const prevPoint: Points = visiblePoints[i - 1];
            const controlPoints: {
                controlPoint1: ChartLocationProps;
                controlPoint2: ChartLocationProps;
            } = SplineSeriesRenderer.getControlPoints(prevPoint, point, coefficients[i - 1], coefficients[i as number], series);

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

    // Bottom path (baseline at minimum value)
    for (let i: number = visiblePoints.length - 1; i >= 0; i--) {
        const point: Points = visiblePoints[i as number];
        const bottomPolarPoint: ChartLocationProps = transformToPolarCoordinates(
            point.xValue as number,
            minValue,
            series.xAxis,
            series.yAxis,
            series.chart
        );

        if (i === visiblePoints.length - 1) {
            bottomPathD = `L ${bottomPolarPoint.x} ${bottomPolarPoint.y}`;
        } else {
            bottomPathD += ` L ${bottomPolarPoint.x} ${bottomPolarPoint.y}`;
        }
    }

    const fullAreaPath: string = series.isClosedPath ? pathD : pathD + bottomPathD + ' Z';

    series.visiblePoints = visiblePoints;

    // Create area fill path
    const customizedValues: string = applyPointRenderCallback(({
        seriesIndex: series.index as number,
        color: series.interior as string,
        xValue: null,
        yValue: null
    }), series.chart);

    const pathId: string = `${series.chart.element.id}_Series_${series.index}`;
    options.push({
        id: pathId,
        fill: customizedValues,
        strokeWidth: 0,
        stroke: 'transparent',
        opacity: series.opacity,
        dashArray: '',
        d: fullAreaPath
    });

    // Create border path if enabled
    if (series.isClosedPath) {
        pathD += ' Z';
    }
    if (series.border && (series.border?.width as number) > 0) {
        const borderPathId: string = `${series.chart.element.id}_Series_border_${series.index}`;
        options.push({
            id: borderPathId,
            fill: 'none',
            strokeWidth: series.border.width,
            stroke: series.border.color || customizedValues,
            opacity: 1,
            dashArray: series.border.dashArray || '',
            d: pathD
        });
    }

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
 * Polar Spline Area Series Renderer
 */
const PolarSplineAreaSeriesRenderer: {
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

export default PolarSplineAreaSeriesRenderer;
