/**
 * Polar Range Column Series Renderer
 * Renders range column series in polar coordinate systems using high/low values with arc-based rectangles.
 *
 * @private
 */

import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { transformToPolarCoordinates } from '../../utils/polarRadarHelper';
import { Chart, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback, setPointColor } from '../../utils/helper';

/**
 * Generates the SVG path for a polar range column segment.
 * Builds an arc-shaped rectangle using the low and high values as the inner and outer radii.
 *
 * @param {number} pointAngle - The center angle of the column in degrees.
 * @param {number} columnHalfWidth - Half of the angular width of the column in degrees.
 * @param {number} innerRadius - The inner radius of the range column.
 * @param {number} outerRadius - The outer radius of the range column.
 * @param {number} centerX - The X coordinate of the chart center.
 * @param {number} centerY - The Y coordinate of the chart center.
 * @returns {string} The SVG path string for the polar range column.
 */
function generatePolarColumnPath(
    pointAngle: number,
    columnHalfWidth: number,
    innerRadius: number,
    outerRadius: number,
    centerX: number,
    centerY: number
): string {
    const startAngle: number = pointAngle - columnHalfWidth;
    const endAngle: number = pointAngle + columnHalfWidth;

    // Convert angles to radians
    const startRad: number = (startAngle * Math.PI) / 180;
    const endRad: number = (endAngle * Math.PI) / 180;

    // Inner radius points
    const innerStart: ChartLocationProps = {
        x: centerX + innerRadius * Math.cos(startRad),
        y: centerY + innerRadius * Math.sin(startRad)
    };

    const innerEnd: ChartLocationProps = {
        x: centerX + innerRadius * Math.cos(endRad),
        y: centerY + innerRadius * Math.sin(endRad)
    };

    // Outer radius points
    const outerStart: ChartLocationProps = {
        x: centerX + outerRadius * Math.cos(startRad),
        y: centerY + outerRadius * Math.sin(startRad)
    };

    const outerEnd: ChartLocationProps = {
        x: centerX + outerRadius * Math.cos(endRad),
        y: centerY + outerRadius * Math.sin(endRad)
    };

    // Calculate arc flags
    const largeArcFlag: number = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

    // Create path
    let path: string = `M ${outerStart.x} ${outerStart.y}`;
    path += ` A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`;
    path += ` L ${innerEnd.x} ${innerEnd.y}`;
    path += ` A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`;
    path += ' Z';

    return path;
}

const render: (
    series: SeriesProperties,
    _isInverted: boolean
) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } = (
    series: SeriesProperties,
    _isInverted: boolean
): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
    void _isInverted;

    const options: RenderOptions[] = [];
    const chart: Chart = series.chart;

    const clipRect: Rect = series.clipRect as Rect;

    const centerX: number =
        chart.polarCenterX;

    const centerY: number =
        chart.polarCenterY;

    series.isRectSeries = true;

    //  Initialize hit-test regions (NEW, does not affect rendering)
    series.polarColumnHitRegions = [];

    const visiblePoints: Points[] = series.points.filter(
        (point: Points) => point.visible
    );

    if (visiblePoints.length < 2) {
        return [];
    }

    const numberOfCategories: number = visiblePoints.length;
    const angularInterval: number = 360 / numberOfCategories;
    const columnWidth: number = series.columnWidth ?? 0.98;
    const columnHalfWidth: number = (angularInterval * columnWidth) / 2;

    for (const point of visiblePoints) {
        point.regions = [];
        point.symbolLocations = [];

        //  High / low values
        const highValue: number = Math.max(
            Number(point.high),
            Number(point.low)
        );

        const lowValue: number = Math.min(
            Number(point.high),
            Number(point.low)
        );

        //  Transform to polar space
        const highPoint: ChartLocationProps =
            transformToPolarCoordinates(
                point.xValue as number,
                highValue,
                series.xAxis,
                series.yAxis,
                chart
            );

        const lowPoint: ChartLocationProps =
            transformToPolarCoordinates(
                point.xValue as number,
                lowValue,
                series.xAxis,
                series.yAxis,
                chart
            );

        const highRadius: number =
            Math.hypot(
                highPoint.x - centerX,
                highPoint.y - centerY
            );

        const lowRadius: number =
            Math.hypot(
                lowPoint.x - centerX,
                lowPoint.y - centerY
            );

        //  Angle based on transformed coordinates (SVG convention)
        const columnAngle: number =
            Math.atan2(
                highPoint.y - centerY,
                highPoint.x - centerX
            ) * (180 / Math.PI);

        //  HIT-TEST GEOMETRY (NEW, SAFE)
        const startAngle: number =
            (columnAngle - columnHalfWidth) * Math.PI / 180;

        const endAngle: number =
            (columnAngle + columnHalfWidth) * Math.PI / 180;

        series.polarColumnHitRegions.push({
            point,
            startAngle,
            endAngle,
            innerRadius: lowRadius,
            outerRadius: highRadius,
            centerX,
            centerY
        });

        //  Marker locations (existing behavior)
        const markerWidth: number = series.marker?.width as number;
        const markerHeight: number = series.marker?.height as number;

        const highMarker: ChartLocationProps = {
            x: highPoint.x - clipRect.x,
            y: highPoint.y - clipRect.y
        };

        const lowMarker: ChartLocationProps = {
            x: lowPoint.x - clipRect.x,
            y: lowPoint.y - clipRect.y
        };

        point.symbolLocations.push(highMarker, lowMarker);

        point.regions.push(
            {
                x: highMarker.x - markerWidth,
                y: highMarker.y - markerHeight,
                width: 2 * markerWidth,
                height: 2 * markerHeight
            },
            {
                x: lowMarker.x - markerWidth,
                y: lowMarker.y - markerHeight,
                width: 2 * markerWidth,
                height: 2 * markerHeight
            }
        );

        //  Point styling callback (existing behavior)
        const fill: string = applyPointRenderCallback(
            {
                seriesIndex: series.index,
                color: setPointColor(point, series.interior) as string,
                xValue: point.xValue,
                yValue: point.yValue
            },
            chart
        );

        point.interior = fill;

        //  Column path (existing behavior)
        const columnPath: string = generatePolarColumnPath(
            columnAngle,
            columnHalfWidth,
            lowRadius,
            highRadius,
            centerX,
            centerY
        );

        options.push({
            id: `${chart.element.id}_Series_${series.index}_Point_${point.index}`,
            fill,
            strokeWidth: series.border?.width,
            stroke: series.border?.color,
            opacity: series.opacity,
            dashArray: series.dashArray,
            d: columnPath
        });
    }

    series.visiblePoints = visiblePoints;

    const marker: ChartMarkerProps | null =
        series.marker?.visible
            ? (MarkerRenderer.render(series) as ChartMarkerProps)
            : null;

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
 * Polar Range Column Series Renderer
 */
const PolarRangeColumnSeriesRenderer: {
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

export default PolarRangeColumnSeriesRenderer;
