/**
 * Radar Stacking Column Series Renderer
 * Renders stacking column series in radar coordinate systems with arc-based rectangles.
 *
 * @private
 */

import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { transformToRadarCoordinates } from '../../utils/polarRadarHelper';
import { Chart, Points, Rect, RenderOptions, SeriesProperties, VisibleLabel } from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback, setPointColor } from '../../utils/helper';

/**
 * Generates the SVG path for a radar stacking column segment.
 * Builds an arc-shaped rectangle using the stacked inner and outer radii.
 *
 * @param {number} pointAngle - The center angle of the column in degrees.
 * @param {number} columnHalfWidth - Half of the angular width of the column in degrees.
 * @param {number} innerRadius - The inner radius of the stacked column.
 * @param {number} outerRadius - The outer radius of the stacked column.
 * @param {number} centerX - The X coordinate of the chart center.
 * @param {number} centerY - The Y coordinate of the chart center.
 * @returns {string} The SVG path string for the radar stacking column.
 */
function generateRadarColumnPath(
    pointAngle: number,
    columnHalfWidth: number,
    innerRadius: number,
    outerRadius: number,
    centerX: number,
    centerY: number
): string {
    const startAngle: number = pointAngle - columnHalfWidth;
    const endAngle: number = pointAngle + columnHalfWidth;

    const startRad: number = (startAngle * Math.PI) / 180;
    const endRad: number = (endAngle * Math.PI) / 180;

    const innerStart: ChartLocationProps = {
        x: centerX + innerRadius * Math.cos(startRad),
        y: centerY + innerRadius * Math.sin(startRad)
    };

    const innerEnd: ChartLocationProps = {
        x: centerX + innerRadius * Math.cos(endRad),
        y: centerY + innerRadius * Math.sin(endRad)
    };

    const outerStart: ChartLocationProps = {
        x: centerX + outerRadius * Math.cos(startRad),
        y: centerY + outerRadius * Math.sin(startRad)
    };

    const outerEnd: ChartLocationProps = {
        x: centerX + outerRadius * Math.cos(endRad),
        y: centerY + outerRadius * Math.sin(endRad)
    };

    const largeArcFlag: number = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

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

    const centerX: number = chart.polarCenterX;
    const centerY: number = chart.polarCenterY;

    series.isRectSeries = true;

    const visiblePoints: Points[] = series.points.filter(
        (point: Points) => point.visible
    );

    if (!visiblePoints.length) {
        return [];
    }

    //  Initialize hit‑test regions for tooltip / interaction
    series.polarColumnHitRegions = [];

    const totalAngle: number = 360;
    const categoryCount: number = visiblePoints.length;
    const angularInterval: number = totalAngle / categoryCount;

    const columnWidth: number = series.columnWidth ?? 0.98;
    const columnHalfWidth: number = (angularInterval * columnWidth) / 2;

    for (const point of visiblePoints) {

        point.regions = [];
        point.symbolLocations = [];

        let stackStart: number = 0;
        let stackEnd: number = 0;

        for (const s of chart.visibleSeries) {
            if (s === series) {
                stackEnd =
                    stackStart + ((point.yValue as number));
                break;
            }

            if (
                s.visible &&
                s.stackingGroup === series.stackingGroup
            ) {
                const stackedPoint: Points = s.points?.[point.index];
                if (stackedPoint?.visible) {
                    stackStart +=
                        (stackedPoint.yValue as number);
                }
            }
        }

        const outerPoint: ChartLocationProps = transformToRadarCoordinates(
            point.xValue as number,
            stackEnd,
            series.xAxis,
            series.yAxis,
            chart
        );

        const innerPoint: ChartLocationProps = transformToRadarCoordinates(
            point.xValue as number,
            stackStart,
            series.xAxis,
            series.yAxis,
            chart
        );

        const outerRadius: number = Math.hypot(
            outerPoint.x - centerX,
            outerPoint.y - centerY
        );

        const innerRadius: number = Math.hypot(
            innerPoint.x - centerX,
            innerPoint.y - centerY
        );

        //  Category‑based angle (correct for Radar)
        const pointIndex: number = visiblePoints.indexOf(point);

        // Calculate angle in degrees, matching coefficientToVector formula
        // coefficientToVector uses: angle = 270 + 360 * coefficient + startAngle
        let coefficient: number;

        if (series.xAxis?.valueType === 'Category') {
            const visibleLabels: VisibleLabel[] = series.xAxis?.visibleLabels;
            const totalCount: number = visibleLabels.length;

            if (series.xAxis?.labelStyle?.placement === 'BetweenTicks' && totalCount > 0) {
                // BetweenTicks: offset by 0.5
                coefficient = (pointIndex + 0.5) / totalCount;
            } else if (totalCount > 0) {
                // OnTicks: direct index distribution
                coefficient = pointIndex / totalCount;
            } else {
                // Fallback
                coefficient = (pointIndex + 0.5) / visiblePoints.length;
            }
        } else {
            coefficient = (pointIndex + 0.5) / visiblePoints.length;
        }

        let startAngleDeg: number = series.xAxis?.startAngle as number;
        let baseAngle: number = 270 + 360 * coefficient + startAngleDeg;

        // Apply axis inversion if enabled
        const isInverted: boolean = (series.xAxis?.isAxisInverse as boolean) || false;
        if (isInverted) {
            coefficient = 1 - coefficient;
            baseAngle = 270 + 360 * coefficient + startAngleDeg;
        }

        //  HIT‑TEST GEOMETRY (SVG radians)
        // Normalize angles to 0-360 range for proper conversion to SVG radian system
        startAngleDeg = baseAngle - columnHalfWidth;
        let endAngleDeg: number = baseAngle + columnHalfWidth;

        while (startAngleDeg < 0) {startAngleDeg += 360; }
        while (startAngleDeg >= 360) {startAngleDeg -= 360; }
        while (endAngleDeg < 0) {endAngleDeg += 360; }
        while (endAngleDeg >= 360) {endAngleDeg -= 360; }

        series.polarColumnHitRegions.push({
            point,
            startAngle: (startAngleDeg * Math.PI) / 180,
            endAngle: (endAngleDeg * Math.PI) / 180,
            innerRadius,
            outerRadius,
            centerX,
            centerY
        });

        const columnPath: string = generateRadarColumnPath(
            baseAngle,
            columnHalfWidth,
            innerRadius,
            outerRadius,
            centerX,
            centerY
        );

        const fill: string = applyPointRenderCallback(
            {
                seriesIndex: series.index,
                color: setPointColor(point, series.interior),
                xValue: point.xValue,
                yValue: point.yValue
            },
            chart
        );

        options.push({
            id: `${chart.element.id}_Series_${series.index}_Point_${point.index}`,
            d: columnPath,
            fill,
            stroke: series.border?.color,
            strokeWidth: series.border?.width,
            opacity: series.opacity,
            dashArray: series.dashArray
        });

        //  Marker location at top of stacked column
        const markerAngle: number = (baseAngle * Math.PI) / 180;
        point.symbolLocations.push({
            x: centerX + outerRadius * Math.cos(markerAngle) - clipRect.x,
            y: centerY + outerRadius * Math.sin(markerAngle) - clipRect.y
        });
    }

    series.visiblePoints = visiblePoints;

    const marker: ChartMarkerProps | null =
        series.marker?.visible
            ? (MarkerRenderer.render(series) as ChartMarkerProps)
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
 * Radar Stacking Column Series Renderer
 */
const RadarStackingColumnSeriesRenderer: {
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

export default RadarStackingColumnSeriesRenderer;
