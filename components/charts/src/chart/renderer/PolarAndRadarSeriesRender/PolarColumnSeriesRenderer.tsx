/**
 * Polar Column Series Renderer
 * Renders column series in polar coordinate systems using arc-based rectangular shapes.
 *
 * @private
 */

import { ChartMarkerProps, ChartLocationProps } from '../../base/interfaces';
import { transformToPolarCoordinates } from '../../utils/polarRadarHelper';
import { Chart, Points, Rect, RenderOptions, SeriesProperties, VisibleLabel } from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback, setPointColor } from '../../utils/helper';

/**
 * Generates the SVG path for a polar column segment.
 * Builds an arc-shaped rectangle between the inner and outer radii for a single category angle.
 *
 * @param {number} pointAngle - The center angle of the column in degrees.
 * @param {number} columnHalfWidth - Half of the angular width of the column in degrees.
 * @param {number} innerRadius - The inner radius of the column.
 * @param {number} outerRadius - The outer radius of the column.
 * @param {number} centerX - The X coordinate of the chart center.
 * @param {number} centerY - The Y coordinate of the chart center.
 * @returns {string} The SVG path string for the polar column.
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

    // Create path: outer arc -> line to inner -> inner arc back
    let path: string = `M ${outerStart.x} ${outerStart.y}`;
    path += ` A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`;
    path += ` L ${innerEnd.x} ${innerEnd.y}`;
    path += ` A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`;
    path += ' Z';

    return path;
}

/**
 * Renders a polar column series by creating arc-based rectangular segments at each data point.
 * Columns expand radially from the center.
 *
 * @param {SeriesProperties} series - The series configuration object
 * @param {boolean} _isInverted - Not used for polar series
 * @returns {RenderOptions[] | Object} Array of render options or object with options and marker
 */
const render: (series: SeriesProperties, _isInverted: boolean) => RenderOptions[] | {
    options: RenderOptions[];
    marker: ChartMarkerProps;
} = (
    series: SeriesProperties,
    _isInverted: boolean
): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
    void _isInverted;

    const options: RenderOptions[] = [];
    const chart: Chart = series.chart;

    series.isRectSeries = true;

    const centerX: number = chart.polarCenterX;

    const centerY: number = chart.polarCenterY;

    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);
    if (!visiblePoints.length) {
        return [];
    }
    series.polarColumnHitRegions = [];
    const columnSeries: SeriesProperties[] = chart.visibleSeries.filter((s: SeriesProperties) =>
        s.stackingGroup === series.stackingGroup &&
        s.type?.includes('Column')
    );

    const rectCount: number = columnSeries.length;
    const position: number = columnSeries.indexOf(series);

    series.rectCount = rectCount;
    series.position = position;

    const categoryCount: number = visiblePoints.length;
    const totalAngle: number = 360;
    const angularInterval: number = totalAngle / categoryCount;

    const columnWidth: number = series.columnWidth ?? 0.98;
    const singleSeriesAngle: number = (angularInterval * columnWidth) / rectCount;

    const seriesAngularOffset: number =
        -(angularInterval * columnWidth) / 2 +
        singleSeriesAngle * position +
        singleSeriesAngle / 2;

    const minValue: number = series.yAxis.visibleRange.minimum;

    for (const point of visiblePoints) {

        point.regions = [];
        point.symbolLocations = [];

        const value: number = Number(point.yValue);
        const startValue: number = Math.min(value, minValue);
        const endValue: number = Math.max(value, minValue);

        const outerPoint: ChartLocationProps = transformToPolarCoordinates(
            point.xValue as number,
            endValue,
            series.xAxis,
            series.yAxis,
            chart
        );

        const innerPoint: ChartLocationProps = transformToPolarCoordinates(
            point.xValue as number,
            startValue,
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

        // Calculate angle in degrees, matching coefficientToVector formula
        // coefficientToVector uses: angle = 270 + 360 * coefficient + startAngle
        // where coefficient calculation depends on axis label placement
        let coefficient: number;

        if (series.xAxis?.valueType === 'Category') {
            const visibleLabels: VisibleLabel[] = series.xAxis?.visibleLabels;
            const totalCount: number = visibleLabels.length;

            if (series.xAxis?.labelStyle?.placement === 'BetweenTicks' && totalCount > 0) {
                // BetweenTicks: offset by 0.5
                coefficient = (Number(point.xValue) + 0.5) / totalCount;
            } else if (totalCount > 0) {
                // OnTicks: direct index distribution
                coefficient = Number(point.xValue) / totalCount;
            } else {
                // Fallback
                coefficient = Number(point.xValue) / categoryCount;
            }
        } else {
            coefficient = Number(point.xValue) / categoryCount;
        }

        const axisStartAngle: number = series.xAxis?.startAngle as number;
        let baseAngle: number = 270 + 360 * coefficient + axisStartAngle;

        // Apply axis inversion if enabled
        const isInverted: boolean = (series.xAxis?.isAxisInverse as boolean) || false;
        if (isInverted) {
            coefficient = 1 - coefficient;
            baseAngle = 270 + 360 * coefficient + axisStartAngle;
        }

        // Apply offset to position column when there are multiple series
        const finalAngle: number = baseAngle + seriesAngularOffset;

        // HIT-TEST GEOMETRY (SVG radians) - Apply offset to match visual rendering
        let startAngleDeg: number = finalAngle - singleSeriesAngle / 2;
        let endAngleDeg: number = finalAngle + singleSeriesAngle / 2;

        // Normalize angles to 0-360 range efficiently using modulo
        startAngleDeg = ((startAngleDeg % 360) + 360) % 360;
        endAngleDeg = ((endAngleDeg % 360) + 360) % 360;

        const startAngle: number = (startAngleDeg * Math.PI) / 180;
        const endAngle: number = (endAngleDeg * Math.PI) / 180;

        series.polarColumnHitRegions.push({
            point,
            startAngle,
            endAngle,
            innerRadius,
            outerRadius,
            centerX,
            centerY
        });
        const pathD: string = generatePolarColumnPath(
            finalAngle,
            singleSeriesAngle / 2,
            innerRadius,
            outerRadius,
            centerX,
            centerY
        );

        const fill: string = applyPointRenderCallback({
            seriesIndex: series.index,
            color: setPointColor(point, series.interior),
            xValue: point.xValue,
            yValue: point.yValue
        }, chart);

        options.push({
            id: `${chart.element.id}_Series_${series.index}_Point_${point.index}`,
            d: pathD,
            fill,
            stroke: series.border?.color,
            strokeWidth: series.border?.width,
            opacity: series.opacity,
            dashArray: series.dashArray
        });

        // Calculate symbol location at the center angle of the column, at the outer radius
        // Use finalAngle to match visual rendering position when multiple series exist
        const centerAngleRad: number = (finalAngle * Math.PI) / 180;
        const symbolX: number = centerX + outerRadius * Math.cos(centerAngleRad) - (series.clipRect as Rect).x;
        const symbolY: number = centerY + outerRadius * Math.sin(centerAngleRad) - (series.clipRect as Rect).y;

        point.symbolLocations.push({
            x: symbolX,
            y: symbolY
        });

        // Set regions for tooltip interaction
        // Use a marker-like region around the symbol location
        const markerWidth: number = (series.marker && series.marker.width) ? series.marker.width : 8;
        const markerHeight: number = (series.marker && series.marker.height) ? series.marker.height : 8;
        point.regions.push({
            x: symbolX - markerWidth / 2,
            y: symbolY - markerHeight / 2,
            width: markerWidth,
            height: markerHeight
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
 * Polar Column Series Renderer
 */
const PolarColumnSeriesRenderer: {
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

export default PolarColumnSeriesRenderer;
