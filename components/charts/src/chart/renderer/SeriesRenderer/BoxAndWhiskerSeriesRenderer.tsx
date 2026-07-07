// BoxAndWhiskerSeriesRenderer.tsx
import { BoxPlotMode } from '../../base/enum';
import { ChartWhiskerStyleProps, ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { DoubleRangeType, Points, Rect, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { getPoint, calculateVisiblePoints, findBoxPlotValues, getSaturationColor, applyPointRenderCallback } from '../../utils/helper';
import { ColumnBase, ColumnBaseReturnType } from './ColumnBase';
import MarkerRenderer from './MarkerRenderer';
import { handleRectAnimation } from './SeriesAnimation';

/**
 * Gets the box fill color by applying pointRender callback if available.
 * Whisker parts (stem/caps) do NOT use pointRender - they use series whiskerStyle settings.
 *
 * @param {SeriesProperties} series - Series configuration.
 * @param {Points} point - Data point.
 * @param {string} defaultFill - Default fill color (series.interior).
 * @returns {string} Customized or default fill color.
 */
const getBoxColorFromPointRender: (series: SeriesProperties, point: Points, defaultFill: string) => string =
    (series: SeriesProperties, point: Points, defaultFill: string): string => {
        return applyPointRenderCallback({
            seriesIndex: series.index as number,
            color: defaultFill,
            xValue: point.x as number | Date | string | null,
            yValue: point.yValue as number | Date | string | null
        }, series.chart);
    };

/**
 * Shared column-base helper used to calculate side-by-side placement
 * and rectangle geometry for box-and-whisker rendering.
 */
const base: ColumnBaseReturnType = ColumnBase();

/**
 * Interface defining the structure and methods for box-and-whisker series rendering.
 *
 * @private
 */
export interface BoxAndWhiskerSeriesType {
    sideBySideInfo?: DoubleRangeType;

    /**
     * The main rendering function that processes the entire box-and-whisker series
     * and generates all required SVG paths and optional outlier markers.
     *
     * @param {SeriesProperties} series - Series configuration and data.
     * @param {boolean} isInverted - Flag indicating if axes are inverted.
     * @returns {RenderOptions[] | { options: RenderOptions[]; marker?: ChartMarkerProps }}
     * Rendered path options and optional marker.
     */
    render: (series: SeriesProperties, isInverted: boolean) => RenderOptions[] | { options: RenderOptions[]; marker?: ChartMarkerProps; };

    /**
     * Renders an individual box-and-whisker data point.
     *
     * Calculates quartiles, median, mean, minimum, maximum, outliers,
     * rectangle bounds, whiskers, caps, and marker locations.
     *
     * @param {SeriesProperties} series - Series containing styling and configuration.
     * @param {Points} point - Individual point containing x-value and box-plot y-values.
     * @param {DoubleRangeType} sideBySideInfo - Calculated positioning information for multiple series.
     * @param {boolean} isInverted - Flag indicating if axes are inverted.
     * @returns {RenderOptions[] | undefined} Render options for the point or undefined if point is hidden/invalid.
     */
    renderPoint: (
        series: SeriesProperties,
        point: Points,
        sideBySideInfo: DoubleRangeType,
        isInverted: boolean
    ) => RenderOptions[] | undefined;

    /**
     * Handles animation for box-and-whisker series rendering
     *
     * Processes animation state and applies appropriate transforms for
     * smooth box, whisker, median, and mean path animations.
     *
     * @param {RenderOptions} pathOptions - Current render options for the path
     * @param {number} index - Index of the current series
     * @param {object} animationState - Complete animation state including refs and progress
     * @param {boolean} enableAnimation - Flag to enable/disable animations
     * @param {SeriesProperties} currentSeries - Series being animated
     * @param {Points | undefined} currentPoint - Point being animated (optional)
     * @param {number} pointIndex - Index of the current point
     * @param {SeriesProperties[]} [visibleSeries] - Collection of visible series (optional)
     * @returns {Object} Animation configuration with transform values
     *
     */
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
        currentSeries: SeriesProperties,
        currentPoint: Points | undefined,
        pointIndex: number,
        visibleSeries?: SeriesProperties[]
    ) => {
        strokeDasharray: string | number;
        strokeDashoffset: number;
        interpolatedD?: string;
        animatedDirection?: string;
        animatedTransform?: string;
    };
}

/**
 * Sorts the given numeric values in ascending order.
 *
 * @param {number[]} values - Collection of numeric values to sort.
 * @returns {number[]} Returns a new array sorted in ascending order.
 *
 * @private
 */
export function sortAsc(values: number[]): number[] {
    return [...values].sort((value1: number, value2: number) => value1 - value2);
}

/** Returns the exclusive percentile value from a sorted numeric array.
 *
 * @param {number[]} sorted - Sorted numeric values.
 * @param {number} percentile - Percentile to calculate.
 * @returns {number} Exclusive percentile value.
 *
 * @private
 */
export function percentileExclusive(sorted: number[], percentile: number): number {
    const valueCount: number = sorted.length;
    if (valueCount === 1) { return sorted[0]; }
    const rank: number = percentile * (valueCount + 1);
    const lowerIndex: number = Math.floor(rank);
    const interpolationFraction: number = rank - lowerIndex;
    if (lowerIndex <= 0) { return sorted[0]; }
    if (lowerIndex >= valueCount) { return sorted[valueCount - 1]; }
    return sorted[lowerIndex - 1] + interpolationFraction * (sorted[lowerIndex as number] - sorted[lowerIndex - 1]);
}

/**
 * Returns the inclusive percentile value from a sorted numeric array.
 *
 * @param {number[]} sorted - Sorted numeric values.
 * @param {number} percentile - Percentile to calculate.
 * @returns {number} Inclusive percentile value.
 *
 * @private
 */
export function percentileInclusive(sorted: number[], percentile: number): number {
    const valueCount: number = sorted.length;
    if (valueCount === 1) { return sorted[0]; }
    const rank: number = percentile * (valueCount - 1);
    const lowerIndex: number = Math.floor(Math.abs(rank));
    const interpolationFraction: number = rank - lowerIndex;
    const upperIndex: number = Math.min(lowerIndex + 1, valueCount - 1);
    return sorted[lowerIndex as number] + interpolationFraction * (sorted[upperIndex as number] - sorted[lowerIndex as number]);
}

/**
 * Returns the median value from a sorted numeric array.
 *
 * @param {number[]} sorted - Sorted numeric values.
 * @returns {number} Median value.
 *
 * @private
 */
export function median(sorted: number[]): number {
    const valueCount: number = sorted.length;
    const middleIndex: number = Math.floor(valueCount / 2);
    return valueCount % 2 ? sorted[middleIndex as number] : (sorted[middleIndex - 1] + sorted[middleIndex as number]) / 2;
}

/**
 * Returns automatic lower and upper quartiles from a sorted numeric array.
 *
 * @param {number[]} sorted - Sorted numeric values.
 * @returns {{ firstQuartile: number, thirdQuartile:number }}Quartile values containing firstQuartile and thirdQuartile.
 *
 * @private
 */
export function quartilesAuto(sorted: number[]): { firstQuartile: number; thirdQuartile: number } {
    const valueCount: number = sorted.length;
    if (valueCount === 1) { return { firstQuartile: sorted[0], thirdQuartile: sorted[0] }; }
    const middleIndex: number = Math.floor(valueCount / 2);
    const isEvenLength: boolean = valueCount % 2 === 0;
    const lowerHalf: number[] = sorted.slice(0, middleIndex);
    const upperHalf: number[] = sorted.slice(isEvenLength ? middleIndex : middleIndex + 1);
    return { firstQuartile: median(lowerHalf), thirdQuartile: median(upperHalf) };
}

/**
 * Builds the SVG path for the box portion of the box-and-whisker series.
 *
 * Creates a closed rectangular path using the given box rectangle bounds.
 *
 * @param {Rect} boxRect - Rectangle representing the quartile box area.
 * @returns {string} SVG path string for the box shape.
 */
function buildBoxPath(boxRect: Rect): string {
    const left: number = boxRect.x;
    const top: number = boxRect.y;
    const right: number = boxRect.x + boxRect.width;
    const bottom: number = boxRect.y + boxRect.height;
    return `M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z`;
}

/**
 * Builds the SVG path for the whisker stem lines.
 *
 * Creates vertical or horizontal stem lines depending on the chart inversion state.
 *
 * @param {boolean} isInverted - Indicates whether the chart is inverted.
 * @param {Rect} boxRect - Rectangle representing the quartile box area.
 * @param {number} centerX - Horizontal center of the box.
 * @param {number} centerY - Vertical center of the box.
 * @param {object} upperCapPoint - Maximum whisker cap point.
 * @param {number} upperCapPoint.x - X-coordinate of the maximum whisker cap point.
 * @param {number} upperCapPoint.y - Y-coordinate of the maximum whisker cap point.
 * @param {object} lowerCapPoint - Minimum whisker cap point.
 * @param {number} lowerCapPoint.x - X-coordinate of the minimum whisker cap point.
 * @param {number} lowerCapPoint.y - Y-coordinate of the minimum whisker cap point.
 * @returns {string} SVG path string for the whisker stems.
 */
function buildStemPath(
    isInverted: boolean,
    boxRect: Rect,
    centerX: number,
    centerY: number,
    upperCapPoint: { x: number; y: number },
    lowerCapPoint: { x: number; y: number }
): string {
    const left: number = boxRect.x;
    const top: number = boxRect.y;
    const right: number = boxRect.x + boxRect.width;
    const bottom: number = boxRect.y + boxRect.height;
    let d: string = '';

    if (!isInverted) {
        d += `M ${centerX} ${upperCapPoint.y} L ${centerX} ${top} `;
        d += `M ${centerX} ${bottom} L ${centerX} ${lowerCapPoint.y} `;
    } else {
        d += `M ${upperCapPoint.x} ${centerY} L ${right} ${centerY} `;
        d += `M ${left} ${centerY} L ${lowerCapPoint.x} ${centerY} `;
    }
    return d.trim();
}

/**
 * Builds the SVG path for the whisker caps.
 *
 * Creates horizontal or vertical cap lines at the minimum and maximum whisker positions.
 *
 * @param {boolean} isInverted - Indicates whether the chart is inverted.
 * @param {Rect} boxRect - Rectangle representing the quartile box area.
 * @param {number} centerX - Horizontal center of the box.
 * @param {number} centerY - Vertical center of the box.
 * @param {object} upperCapPoint - Maximum whisker cap point.
 * @param {number} upperCapPoint.x - X-coordinate of the maximum whisker cap point.
 * @param {number} upperCapPoint.y - Y-coordinate of the maximum whisker cap point.
 * @param {object} lowerCapPoint - Minimum whisker cap point.
 * @param {number} lowerCapPoint.x - X-coordinate of the minimum whisker cap point.
 * @param {number} lowerCapPoint.y - Y-coordinate of the minimum whisker cap point.
 * @param {number} capLengthRatio - Ratio used to determine the whisker cap length.
 * @returns {string} SVG path string for the whisker caps.
 */
function buildCapPath(
    isInverted: boolean,
    boxRect: Rect,
    centerX: number,
    centerY: number,
    upperCapPoint: { x: number; y: number },
    lowerCapPoint: { x: number; y: number },
    capLengthRatio: number
): string {
    const ratio: number = Math.max(0, Math.min(1, capLengthRatio));
    let d: string = '';

    if (!isInverted) {
        const halfCap: number = (boxRect.width * ratio) / 2;
        d += `M ${centerX - halfCap} ${upperCapPoint.y} L ${centerX + halfCap} ${upperCapPoint.y} `;
        d += `M ${centerX - halfCap} ${lowerCapPoint.y} L ${centerX + halfCap} ${lowerCapPoint.y} `;
    } else {
        const halfCap: number = (boxRect.height * ratio) / 2;
        d += `M ${upperCapPoint.x} ${centerY - halfCap} L ${upperCapPoint.x} ${centerY + halfCap} `;
        d += `M ${lowerCapPoint.x} ${centerY - halfCap} L ${lowerCapPoint.x} ${centerY + halfCap} `;
    }
    return d.trim();
}

/**
 * Builds the SVG path for the median line inside the box.
 *
 * Creates a horizontal or vertical median line depending on the chart inversion state.
 *
 * @param {boolean} isInverted - Indicates whether the chart is inverted.
 * @param {Rect} boxRect - Rectangle representing the quartile box area.
 * @param {object} medianPt - Projected median point.
 * @param {number} medianPt.x - X-coordinate of the projected median point.
 * @param {number} medianPt.y - Y-coordinate of the projected median point.
 * @returns {string} SVG path string for the median line.
 */
function buildMedianPath(
    isInverted: boolean,
    boxRect: Rect,
    medianPt: { x: number; y: number }
): string {
    const left: number = boxRect.x;
    const top: number = boxRect.y;
    const right: number = boxRect.x + boxRect.width;
    const bottom: number = boxRect.y + boxRect.height;

    if (!isInverted) {
        return `M ${left} ${medianPt.y} L ${right} ${medianPt.y}`;
    }
    return `M ${medianPt.x} ${top} L ${medianPt.x} ${bottom}`;
}

/**
 * Default half-size used to draw the mean "X" marker.
 */
const DEFAULT_MEAN_HALF_SIZE: number = 5;

/**
 * Builds the SVG path for the mean marker.
 *
 * Draws the mean value as an "X" centered on the projected mean point.
 *
 * @param {object} meanPoint - Projected mean point.
 * @param {number} meanPoint.x - X-coordinate of the projected mean point.
 * @param {number} meanPoint.y - Y-coordinate of the projected mean point.
 * @returns {string} SVG path string for the mean marker.
 */
function buildMeanPath(meanPoint: { x: number; y: number }): string {
    return [
        `M ${meanPoint.x - DEFAULT_MEAN_HALF_SIZE} ${meanPoint.y - DEFAULT_MEAN_HALF_SIZE} L ${meanPoint.x + DEFAULT_MEAN_HALF_SIZE} ${meanPoint.y + DEFAULT_MEAN_HALF_SIZE}`,
        `M ${meanPoint.x + DEFAULT_MEAN_HALF_SIZE} ${meanPoint.y - DEFAULT_MEAN_HALF_SIZE} L ${meanPoint.x - DEFAULT_MEAN_HALF_SIZE} ${meanPoint.y + DEFAULT_MEAN_HALF_SIZE}`
    ].join(' ');
}

/**
 * Box and Whisker series renderer implementation for chart visualization.
 *
 * Handles rendering of box plot charts including quartiles, whiskers,
 * outliers, median line, mean marker, and animation support.
 */
const BoxAndWhiskerSeries: BoxAndWhiskerSeriesType = {

    sideBySideInfo: undefined,

    /**
     * Renders the complete box-and-whisker series with optional outlier markers.
     *
     * Processes all visible points in the series, generates SVG path options,
     * calculates side-by-side placement, and renders markers when outliers exist.
     *
     * @param {SeriesProperties} series - Series configuration and data points.
     * @param {boolean} isInverted - Indicates whether the chart is inverted.
     * @returns {RenderOptions[] | { options: RenderOptions[]; marker?: ChartMarkerProps }}
     * Render options array or object containing render options and marker settings.
     */

    render: (series: SeriesProperties, isInverted: boolean) => {

        if (series.animation?.enable && !Number.isFinite(series.animation.duration)
        ) {
            series.animation.duration = series.chart?.duration ?? 1000;
        }

        const sideBysideInfo: DoubleRangeType = base.getSideBySideInfo(series);
        BoxAndWhiskerSeries.sideBySideInfo = sideBysideInfo;
        const options: RenderOptions[] = [];
        let hasAnyOutlierSymbols: boolean = false;

        for (const point of series.points) {
            const pointOptions: RenderOptions[] | undefined = BoxAndWhiskerSeries.renderPoint(series, point, sideBysideInfo, isInverted);
            if (pointOptions && pointOptions.length) {
                options.push(...pointOptions);
            }

            if ((point.symbolLocations?.length as number) > 0) {
                hasAnyOutlierSymbols = true;
            }
        }

        series.visiblePoints = calculateVisiblePoints(series);
        let marker: ChartMarkerProps | undefined;
        const markerModel: ChartMarkerProps = series.marker as ChartMarkerProps;

        if (hasAnyOutlierSymbols) {
            const originalVisible: boolean | undefined = markerModel.visible;
            markerModel.visible = true;
            marker = MarkerRenderer.render(series) as ChartMarkerProps;
            markerModel.visible = originalVisible;
        }
        return marker ? { options, marker } : options;
    },

    /**
     * Renders an individual box-and-whisker point.
     *
     * Calculates quartiles, median, mean, minimum, maximum, outliers,
     * hit-test regions, whiskers, caps, and SVG paths for the given point.
     *
     * @param {SeriesProperties} series - Series containing configuration and styling.
     * @param {Points} point - Individual point containing x-value and y-value collection.
     * @param {DoubleRangeType} sideBySideInfo - Side-by-side positioning information.
     * @param {boolean} _isInverted - Indicates whether the chart is inverted (currently unused).
     * @returns {RenderOptions[] | undefined} Render options for the point or undefined if skipped.
     */

    renderPoint: (
        series: SeriesProperties,
        point: Points,
        sideBySideInfo: DoubleRangeType,
        _isInverted: boolean
    ): RenderOptions[] | undefined => {
        void _isInverted;
        const yValues: number[] = Array.isArray(point.y)
            ? (point.y as (number | string)[]).map((outlierValue : number | string): number => (typeof outlierValue === 'number' ? outlierValue : Number(outlierValue))).filter((outlierValue: number): boolean => Number.isFinite(outlierValue))
            : [];
        if (!point.visible || yValues.length === 0) {
            return undefined;
        }

        const boxPlotMode: BoxPlotMode = (series.boxAndWhiskerSettings?.boxPlotMode as BoxPlotMode) ?? 'Normal';
        const showOutliers: boolean = series.boxAndWhiskerSettings?.showOutliers as boolean;
        const showMean: boolean = series.boxAndWhiskerSettings?.showMean ?? true;
        const whiskerStyle: ChartWhiskerStyleProps | undefined = series.boxAndWhiskerSettings?.whiskerStyle;
        const { minimum, maximum, lowerQuartile, upperQuartile, median, outliers, average } =
      findBoxPlotValues(yValues, boxPlotMode, showOutliers);

        point.minimum = minimum;
        point.maximum = maximum;
        point.lowerQuartile = lowerQuartile;
        point.upperQuartile = upperQuartile;
        point.median = median;
        point.outliers = outliers;
        point.average = average;
        const sideBySideStart: number = Number.isFinite(sideBySideInfo.start) ? sideBySideInfo.start : 0;
        const sideBySideEnd: number = Number.isFinite(sideBySideInfo.end) ? sideBySideInfo.end : 0;
        const sideBySideCenterOffset: number = (sideBySideStart + sideBySideEnd) / 2; // align to band center when available
        const xCenterValue: number = (Number(point.xValue) || 0) + sideBySideCenterOffset;

        const boxRect: Rect = base.getRectangle(
            (Number(point.xValue) || 0) + sideBySideStart,
            upperQuartile,
            (Number(point.xValue) || 0) + sideBySideEnd,
            lowerQuartile,
            series
        );

        const inverted: boolean = series.chart.requireInvertedAxis;
        const upperCapPoint: ChartLocationProps = getPoint(xCenterValue, maximum, series.xAxis, series.yAxis, inverted);
        const lowerCapPoint: ChartLocationProps = getPoint(xCenterValue, minimum, series.xAxis, series.yAxis, inverted);
        const medianPoint: ChartLocationProps = getPoint(xCenterValue, median, series.xAxis, series.yAxis, inverted);
        const meanPoint: ChartLocationProps | undefined = showMean ?
            getPoint(xCenterValue, average, series.xAxis, series.yAxis, inverted) : undefined;    // 4) Finite guards before path building
        const rectFinite: boolean = [boxRect.x, boxRect.y, boxRect.width, boxRect.height].every(Number.isFinite);
        const projectedPoints: ChartLocationProps[] = [upperCapPoint, lowerCapPoint, medianPoint, meanPoint]
            .filter(Boolean) as {x: number, y: number}[];
        const pointsFinite: boolean = projectedPoints.every((point: ChartLocationProps): boolean =>
            Number.isFinite(point.x) && Number.isFinite(point.y));
        if (!rectFinite || !pointsFinite) {
            return undefined;
        }

        point.regions = [];
        point.symbolLocations = [];
        point.regions.push(boxRect);
        const capHitWidth: number = series.border?.width as number;

        if (inverted) {
            point.regions.push({ x: boxRect.x, y: upperCapPoint.y - capHitWidth / 2, width: boxRect.width, height: capHitWidth }); // top cap
            point.regions.push({ x: boxRect.x, y: lowerCapPoint.y - capHitWidth / 2, width: boxRect.width, height: capHitWidth }); // bottom cap
        } else {
            point.regions.push({ x: upperCapPoint.x - capHitWidth / 2, y: boxRect.y, width: capHitWidth, height: boxRect.height }); // right cap
            point.regions.push({ x: lowerCapPoint.x - capHitWidth / 2, y: boxRect.y, width: capHitWidth, height: boxRect.height }); // left cap
        }

        if (outliers && outliers.length) {
            const markerWidth: number = series.marker?.width as number;
            const markerHeight: number = series.marker?.height as number;

            for (const outlierValue of outliers) {
                const outlierPoint: ChartLocationProps = getPoint(xCenterValue, outlierValue, series.xAxis, series.yAxis, inverted);

                point.symbolLocations.push({ x: outlierPoint.x, y: outlierPoint.y });
                point.regions.push({
                    x: outlierPoint.x - markerWidth / 2,
                    y: outlierPoint.y - markerHeight / 2,
                    width: markerWidth,
                    height: markerHeight
                });
            }
        }

        const centerX: number = boxRect.x + boxRect.width / 2;
        const centerY: number = boxRect.y + boxRect.height / 2;
        const capLengthRatio: number = typeof whiskerStyle?.capLength === 'number' ? whiskerStyle.capLength : 0.5;

        const stemDirection: string = buildStemPath(
            inverted,
            boxRect,
            centerX,
            centerY,
            upperCapPoint,
            lowerCapPoint
        );

        const capDirection: string = buildCapPath(
            inverted,
            boxRect,
            centerX,
            centerY,
            upperCapPoint,
            lowerCapPoint,
            capLengthRatio
        );

        const boxDirection: string = buildBoxPath(boxRect);
        const medianDirection: string = buildMedianPath(inverted, boxRect, medianPoint);
        const meanD: string | undefined = meanPoint ? buildMeanPath(meanPoint) : undefined;
        const pathList: string[] = [stemDirection, capDirection, boxDirection, medianDirection, meanD].filter(Boolean) as string[];
        if (!pathList.length || pathList.some((path: string) => !path || path.includes('NaN'))) {
            return undefined;
        }

        const argsData: { fill?: string; border?: { width?: number; color?: string } } = base.triggerEvent(
            series,
            point,
            series.interior,
            { width: series.border?.width, color: series.border?.color }
        );

        const commonOpacity: number | undefined = series.opacity;
        const boxFillColor: string = getBoxColorFromPointRender(series, point, argsData.fill as string);
        point.interior = boxFillColor;
        point.color = boxFillColor;
        const boxStroke: string = argsData.border?.color && argsData.border.color !== 'transparent' ? argsData.border.color : getSaturationColor(series.interior as string, -0.6);
        const boxStrokeWidth: number = argsData.border?.width && argsData.border.width > 0 ? argsData.border.width : 0.5;
        const boxDirectionashArray: string = series.border?.dashArray ?? '';
        const whiskerStroke: string = whiskerStyle?.stroke && whiskerStyle.stroke !== 'transparent' ? whiskerStyle.stroke : getSaturationColor(series.interior as string, -0.6);
        const whiskerStrokeWidth: number = whiskerStyle?.width && whiskerStyle.width > 0 ? whiskerStyle.width : 1;
        const whiskerDashArray: string = whiskerStyle?.dashArray ?? '';
        const renderOptions: RenderOptions[] = [];

        // Add a wrapper option for keyboard navigation focus (BoxAndWhisker-specific)
        // This serves as the focusable per-point anchor containing all parts of this point
        const pointWrapperOption: RenderOptions = {
            id: `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`,
            d: '', // Empty path (wrapper only, no visual content)
            fill: 'none',
            stroke: 'none',
            opacity: 0,
            strokeWidth: 0,
            dashArray: '',
            isBoxAndWhiskerPointWrapper: true,
            pointIndex: point.index,
            boxPart: 'wrapper'
        };
        renderOptions.push(pointWrapperOption);

        if (stemDirection) {
            renderOptions.push({
                id: `${series.chart.element.id}_Series_${series.index}_Point_${point.index}_StemPath`,
                d: stemDirection,
                fill: 'none',
                stroke: whiskerStroke,
                strokeWidth: whiskerStrokeWidth,
                opacity: commonOpacity,
                dashArray: whiskerDashArray,
                pointIndex: point.index,
                boxPart: 'whisker',
                role: 'img',
                ariaLabel: `Whiskers: minimum ${minimum}, maximum ${maximum}`
            });
        }
        if (capDirection) {
            renderOptions.push({
                id: `${series.chart.element.id}_Series_${series.index}_Point_${point.index}_WhiskerPath`,
                d: capDirection,
                fill: 'none',
                stroke: whiskerStroke,
                strokeWidth: whiskerStrokeWidth,
                opacity: commonOpacity,
                dashArray: whiskerDashArray,
                pointIndex: point.index,
                boxPart: 'whisker',
                role: 'img',
                ariaLabel: `Whisker caps: minimum ${minimum}, maximum ${maximum}`
            });
        }
        if (boxDirection) {
            renderOptions.push({
                id: `${series.chart.element.id}_Series_${series.index}_Point_${point.index}_BoxPath`,
                d: boxDirection,
                fill: boxFillColor,
                stroke: boxStroke,
                strokeWidth: boxStrokeWidth,
                opacity: commonOpacity,
                dashArray: boxDirectionashArray,
                pointIndex: point.index,
                boxPart: 'box',
                role: 'img',
                ariaLabel: `Box: Q1 ${lowerQuartile} to Q3 ${upperQuartile}, median ${median}`
            });
        }
        if (medianDirection) {
            renderOptions.push({
                id: `${series.chart.element.id}_Series_${series.index}_Point_${point.index}_MedianPath`,
                d: medianDirection,
                fill: 'none',
                stroke: boxStroke,
                strokeWidth: boxStrokeWidth,
                opacity: commonOpacity,
                dashArray: boxDirectionashArray,
                pointIndex: point.index,
                boxPart: 'median',
                role: 'img',
                ariaLabel: `Median: ${median}`
            });
        }
        if (meanD) {
            renderOptions.push({
                id: `${series.chart.element.id}_Series_${series.index}_Point_${point.index}_MeanPath`,
                d: meanD,
                fill: 'none',
                stroke: boxStroke,
                strokeWidth: boxStrokeWidth,
                opacity: commonOpacity,
                dashArray: boxDirectionashArray,
                pointIndex: point.index,
                boxPart: 'mean',
                role: 'img',
                ariaLabel: `Mean: ${average}`
            });
        }
        return renderOptions;
    },

    /**
     * Applies animation settings for an individual box-and-whisker path element.
     *
     * Resolves the correct point index from the render option metadata or path id
     * and delegates transform animation handling to the shared rectangle animation helper.
     *
     * @param {RenderOptions} pathOptions - Current render options for the SVG path.
     * @param {number} index - Index of the current series.
     * @param {object} animationState - Animation refs and progress values.
     * @param {boolean} enableAnimation - Indicates whether animation is enabled.
     * @param {SeriesProperties} currentSeries - Series being animated.
     * @param {Points | undefined} currentPoint - Current point associated with the path, if available.
     * @param {number} pointIndex - Fallback point index for the current path.
     * @param {SeriesProperties[]} [_visibleSeries] - Visible series collection (currently unused).
     * @returns {object} Animation settings for the current path element.
     */

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
        currentSeries: SeriesProperties,
        currentPoint: Points | undefined,
        pointIndex: number,
        _visibleSeries?: SeriesProperties[]
    ) => {
        void _visibleSeries;
        let actualPointIndex: number = pointIndex;

        // prefer metadata when available
        if (typeof pathOptions.pointIndex === 'number' && Number.isFinite(pathOptions.pointIndex)) {
            actualPointIndex = pathOptions.pointIndex;
        } else if (pathOptions.id) {
            const pointIdMatch: RegExpMatchArray | null = pathOptions.id.match(/_Point_(\d+)_(BoxPath|StemPath|WhiskerPath|MedianPath|MeanPath)$/);
            if (pointIdMatch) {
                actualPointIndex = parseInt(pointIdMatch[1], 10);
            }
        }
        const correctedPoint: Points = currentSeries?.points?.[actualPointIndex as number] ?? currentPoint;
        const rectAnimation: { animatedDirection?: string; animatedTransform?: string } = handleRectAnimation(
            pathOptions,
            currentSeries,
            index,
            correctedPoint,
            actualPointIndex,
            animationState,
            enableAnimation
        );

        return {
            strokeDasharray: 'none',
            strokeDashoffset: 0,
            interpolatedD: undefined,
            animatedDirection: undefined,
            animatedTransform: rectAnimation.animatedTransform
        };
    }

};

export default BoxAndWhiskerSeries;
