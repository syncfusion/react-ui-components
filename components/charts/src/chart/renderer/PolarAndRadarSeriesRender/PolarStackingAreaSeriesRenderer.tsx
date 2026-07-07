/**
 * Polar Stacking Area Series Renderer
 * Renders stacking area series in polar coordinate systems with radial expansion.
 *
 * @private
 */

import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { transformToPolarCoordinates } from '../../utils/polarRadarHelper';
import { Chart, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback } from '../../utils/helper';


/**
 * Calculates the stacked start and end values for a point in a stacking area series.
 * Sums the previous visible stacking series values at the specified point index.
 *
 * @param {number} pointIndex - The index of the point to calculate stacked values for.
 * @param {SeriesProperties} currentSeries - The active stacking series.
 * @returns {{start: number, end: number}} The stacked start and end values for the point.
 * @private
 */
export function getStackedValues(
    pointIndex: number,
    currentSeries: SeriesProperties
): { start: number; end: number } {

    const chart: Chart = currentSeries.chart as Chart;

    const visibleStackingSeries: SeriesProperties[] = chart.visibleSeries.filter((s: SeriesProperties) =>
        s.visible &&
        s.stackingGroup === currentSeries.stackingGroup &&
        s.type?.includes('StackingArea')
    );

    const stackPosition: number = visibleStackingSeries.indexOf(currentSeries);

    let start: number = 0;

    for (let i: number = 0; i < stackPosition; i++) {
        const series: SeriesProperties = visibleStackingSeries[i as number];
        const point: Points = series.points?.[pointIndex as number];

        if (point && point.visible) {
            start += Number(point.yValue);
        }
    }

    const currentValue: number =
        Number(currentSeries.points?.[pointIndex as number]?.yValue);

    return {
        start,
        end: start + currentValue
    };
}

/**
 * Generates the SVG path for a polar stacking area series.
 * Creates both the outer and inner edges so the stacked area can be filled correctly.
 *
 * @param {SeriesProperties} series - The stacking area series configuration.
 * @returns {string} The SVG path string for the stacked area.
 */
function generatePolarStackingAreaPath(series: SeriesProperties): string {
    let path: string = '';
    const chart: Chart = series.chart;
    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);

    if (visiblePoints.length === 0) {
        return path;
    }

    const wrap: boolean = series.isClosedPath !== false;

    // ---------- OUTER EDGE ----------
    const firstStack: {
        start: number;
        end: number;
    } = getStackedValues(0, series);
    const firstOuter: ChartLocationProps = transformToPolarCoordinates(
        visiblePoints[0].xValue as number,
        firstStack.end,
        series.xAxis,
        series.yAxis,
        chart
    );

    path += `M ${firstOuter.x} ${firstOuter.y}`;

    for (let i: number = 1; i < visiblePoints.length; i++) {
        const stacked: {
            start: number;
            end: number;
        } = getStackedValues(i, series);
        const p: ChartLocationProps = transformToPolarCoordinates(
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
    const firstInnerStack: {
        start: number;
        end: number;
    } = getStackedValues(0, series);
    const firstInner: ChartLocationProps = transformToPolarCoordinates(
        visiblePoints[0].xValue as number,
        firstInnerStack.start,
        series.xAxis,
        series.yAxis,
        chart
    );

    path += ` M ${firstInner.x} ${firstInner.y}`;

    for (let i: number = visiblePoints.length - 1; i >= 0; i--) {
        const stacked: {
            start: number;
            end: number;
        } = getStackedValues(i, series);
        const p: ChartLocationProps = transformToPolarCoordinates(
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
 * Generates the SVG path for the border of a polar stacking area series.
 * Follows the outer stacked edge and then returns along the inner stacked edge.
 *
 * @param {SeriesProperties} series - The stacking area series configuration.
 * @returns {string} The SVG path string for the stacked area border.
 */
function generatePolarStackingAreaBorderPath(series: SeriesProperties): string {
    let path: string = '';
    const chart: Chart = series.chart;
    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);

    if (visiblePoints.length === 0) {
        return path;
    }

    // Start with first outer point
    const firstStackedValue: {
        start: number;
        end: number;
    } = getStackedValues(0, series);
    const firstOuter: ChartLocationProps = transformToPolarCoordinates(
        visiblePoints[0].xValue as number,
        firstStackedValue.end,
        series.xAxis,
        series.yAxis,
        chart
    );

    path += `M ${firstOuter.x} ${firstOuter.y}`;

    // Add outer edge points
    for (let i: number = 1; i < visiblePoints.length; i++) {
        const stackedValue: {
            start: number;
            end: number;
        } = getStackedValues(i, series);
        const point: ChartLocationProps = transformToPolarCoordinates(
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
): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {

    const options: RenderOptions[] = [];
    void _isInverted;

    // Generate area fill path
    const areaPath: string = generatePolarStackingAreaPath(series);

    // Generate border path (if border is visible)
    const borderPath: string = series.border?.width && series.border.width > 0 ? generatePolarStackingAreaBorderPath(series) : '';

    // Process points for regions and symbol locations
    series.visiblePoints = series.points.filter((p: Points) => p.visible);

    for (let i: number = 0; i < series.visiblePoints.length; i++) {
        const point: Points = series.visiblePoints[i as number];
        point.regions = [];
        point.symbolLocations = [];

        // Use the outer edge (end) value for marker positioning
        const stackedValue: {
            start: number;
            end: number;
        } = getStackedValues(i, series);
        const pointLoc: ChartLocationProps = transformToPolarCoordinates(
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

        const symbolLocation: ChartLocationProps | undefined = point.symbolLocations?.[0];
        if (symbolLocation) {
            const regions: Rect[] = point.regions ?? [];
            regions.push({
                x: symbolLocation.x - markerWidth,
                y: symbolLocation.y - markerHeight,
                width: 2 * markerWidth,
                height: 2 * markerHeight
            });
            point.regions = regions;
        }
    }

    // Create render options for area fill
    const customizedColor: string = applyPointRenderCallback(({
        seriesIndex: series.index as number,
        color: series.interior as string,
        xValue: series.visiblePoints[0]?.xValue,
        yValue: series.visiblePoints[0]?.yValue
    }), series.chart);

    // When isClosedPath is false, render as outline only; when true, render as filled area
    if (series.isClosedPath === false) {
        // Render as open line/outline without fill
        options.push({
            id: `${series.chart.element.id}_Series_${series.index}`,
            fill: customizedColor,
            strokeWidth: series.border?.width,
            stroke: series.border?.color,
            opacity: series.opacity,
            dashArray: series.dashArray,
            d: areaPath
        });
    } else {
        // Render as closed filled area
        options.push({
            id: `${series.chart.element.id}_Series_${series.index}`,
            fill: customizedColor,
            strokeWidth: 0,
            stroke: 'transparent',
            opacity: series.opacity,
            dashArray: series.dashArray,
            d: areaPath
        });

        // Add border if visible
        if (borderPath !== '') {
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
 * Polar Stacking Area Series Renderer
 */
const PolarStackingAreaSeriesRenderer: {
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

export default PolarStackingAreaSeriesRenderer;
