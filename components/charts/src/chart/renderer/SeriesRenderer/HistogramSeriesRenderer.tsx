import { RenderOptions, SeriesProperties, Points, HistogramValues, AxisModel } from '../../chart-area/chart-interfaces';
import ColumnSeries from './ColumnSeriesRenderer';
import { AnimationState, AnimationResult } from './ColumnSeriesRenderer';
import { getPoint } from '../../utils/helper';
import { JSX } from 'react';
import { ChartHistogramSettings, ChartLocationProps } from '../../base/interfaces';


/**
 * Histogram render result.
 *
 * @private
 */
interface HistogramRenderResult {
    options: RenderOptions[];           // column paths
    marker?: object;
    normalCurveOptions?: RenderOptions[]; //  curve paths
}

type HistogramRenderOptions = RenderOptions & {
    isRectPath?: boolean;
};

/**
 * Histogram Series Renderer
 *
 */
const HistogramSeriesRenderer: {
    render(series: SeriesProperties, isInverted: boolean): HistogramRenderResult;
    doAnimation(pathOptions: RenderOptions, index: number, animationState: AnimationState,
        enableAnimation: boolean, currentSeries: SeriesProperties, currentPoint: Points | undefined, pointIndex: number): AnimationResult;
    processInternalData(series: SeriesProperties): void;
    renderNormalDistribution(series: SeriesProperties): RenderOptions[];
} = {

    /**
     * Renders the Histogram series
     *
     * @param {SeriesProperties} series - The histogram series configuration
     * @param {boolean} isInverted - Indicates whether the chart is transposed
     * @returns {HistogramRenderResult} Collection of SVG render options
     */
    render(
        series: SeriesProperties,
        isInverted: boolean
    ): HistogramRenderResult {
        HistogramSeriesRenderer.processInternalData(series);
        const columnResult: HistogramRenderResult = ColumnSeries.render(series, isInverted) as HistogramRenderResult;
        const extraOptions: RenderOptions[] = [];

        //Render normal distribution curve
        if (series.histogramSettings?.showNormalDistribution) {
            extraOptions.push(
                ...HistogramSeriesRenderer.renderNormalDistribution(series)
            );
        }
        return {
            options: [
                ...columnResult.options,   // bars
                ...extraOptions             // ND curve INSIDE options
            ],
            marker: columnResult.marker
        };
    },

    /**
     * Handles animation for histogram series elements.
     *
     * Animation behavior is delegated to ColumnSeriesRenderer,
     * since histogram bars behave identically to column bars.
     *
     * @param {RenderOptions} pathOptions - SVG render options for the element
     * @param {number} index - Series index
     * @param {AnimationState} animationState - Shared animation state
     * @param {boolean} enableAnimation - Specifies whether animation is enabled
     * @param {SeriesProperties} currentSeries - Current series instance
     * @param {Points | undefined} currentPoint - Associated data point
     * @param {number} pointIndex - Index of the point
     * @returns {AnimationResult} Animation properties for the current frame
     */
    doAnimation(
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties,
        currentPoint: Points | undefined,
        pointIndex: number
    ): AnimationResult {

        return ColumnSeries.doAnimation(
            pathOptions,
            index,
            animationState,
            enableAnimation,
            currentSeries,
            currentPoint,
            pointIndex
        );
    },
    /**
     * Converts raw Y values into histogram bins.
     *
     * @param {SeriesProperties} series - The histogram series to process
     * @returns {void}
     * @private
     */
    processInternalData(series: SeriesProperties): void {
        const histogramSeries: SeriesProperties & {
            originalPoints?: Points[];
        } = series as SeriesProperties & {
            originalPoints?: Points[];
        };

        //  Preserve raw points once
        if (!histogramSeries.originalPoints) {
            histogramSeries.originalPoints = series.points.slice();
        }

        const originalPoints: Points[] = histogramSeries.originalPoints;
        const rawYAxisValues: number[] = [];
        for (const point of originalPoints) {
            if (typeof point.yValue === 'number') {
                rawYAxisValues.push(point.yValue);
            }
        }
        if (rawYAxisValues.length === 0) {
            series.points = [];
            return;
        }
        const templatePoint: Points = series.points[0];
        if (!templatePoint) {
            series.points = [];
            return;
        }
        const totalValueCount: number = rawYAxisValues.length;
        const minimumValue: number = Math.min(...rawYAxisValues);
        const maximumValue: number = Math.max(...rawYAxisValues);
        // Mean
        const mean: number =
            rawYAxisValues.reduce((sum: number, value: number) => sum + value, 0) / totalValueCount;
        // Standard deviation
        let varianceSum: number = 0;
        for (const value of rawYAxisValues) {
            varianceSum += (value - mean) * (value - mean);
        }
        const standardDeviation: number = Math.sqrt(varianceSum / totalValueCount);
        // Bin width (Scott's rule)
        const calculatedWidth: number =
            Math.round((3.5 * standardDeviation) / Math.pow(totalValueCount, 1 / 3));

        const binWidth: number = series.histogramSettings?.binInterval ?? Math.max(1, calculatedWidth);
        const bins: Points[] = [];
        let currentBinStart: number = minimumValue;
        let index: number = 0;

        while (currentBinStart < maximumValue) {
            const nextBinStart: number = currentBinStart + binWidth;
            let binCount: number = 0;
            for (const value of rawYAxisValues) {
                if (value >= currentBinStart && value < nextBinStart) {
                    binCount++;
                }
            }
            bins.push({
                ...templatePoint,
                index,
                xValue: currentBinStart + binWidth / 2,
                yValue: binCount,
                x: currentBinStart + binWidth / 2,
                y: binCount,
                originalY: binCount,
                symbolLocations: [],
                regions: [],
                visible: true,
                textValue: binCount.toString(),
                isEmpty: false
            });
            currentBinStart = nextBinStart;
            index++;
        }

        if (bins.length === 0) {
            series.points = [];
            return;
        }
        // X-axis range (critical for ND curve)
        const xMinimum: number = bins[0].xValue as number - binWidth / 2;
        const xMaximum: number = bins[bins.length - 1].xValue as number + binWidth / 2;

        series.histogramValues = {
            yValues: rawYAxisValues,
            binWidth,
            mean,
            standardDeviation,
            xMinimum,
            xMaximum
        };
        series.points = bins;
        series.xMin = xMinimum;
        series.xMax = xMaximum;
        const yValues: number[] = bins
            .map((p: Points) => p.yValue)
            .filter((v: number | null): v is number => v !== null);

        series.yMin = 0;
        series.yMax = yValues.length ? Math.max(...yValues) : 0;
        const xAxis: AxisModel = series.xAxis;
        if (xAxis && xAxis.minimum == null && xAxis.maximum == null) {
            xAxis.actualRange = {
                minimum: xMinimum,
                maximum: xMaximum,
                delta: xMaximum - xMinimum,
                interval: binWidth
            };
            xAxis.visibleRange = { ...xAxis.actualRange };
            xAxis.rangePadding = 'None';
        }

    },

    /**
     * Renders the Normal Distribution curve for the histogram.
     *
     * The curve is computed using the Gaussian probability density
     *
     * @param {SeriesProperties} series - The histogram series
     * @returns {RenderOptions[]} SVG render options for the curve
     * @private
     */
    renderNormalDistribution(series: SeriesProperties): RenderOptions[] {
        const histogramValues: HistogramValues & HistogramValues =
            (series as SeriesProperties & { histogramValues: HistogramValues }).histogramValues;

        if (!histogramValues) {
            return [];
        }
        // const curveStrokeColor: string = series.border?.color ? series.border.color : series.interior as string;
        const settings : ChartHistogramSettings | undefined = series.histogramSettings;

        const strokeColor: string =
            settings?.normalCurveColor ||
            series.chart.themeStyle.histogram ||
            series.interior as string;
        const { mean, standardDeviation, binWidth, yValues } = histogramValues;
        const minimumValue: number = series.xAxis.visibleRange.minimum as number;
        const maximumValue: number = series.xAxis.visibleRange.maximum as number;
        const pointsCount: number = 500;
        const stepSize: number = (maximumValue - minimumValue) / (pointsCount - 1);
        let curvePath: string = '';
        let pathCommand: string = 'M';

        for (let i: number = 0; i < pointsCount; i++) {
            const x: number = minimumValue + i * stepSize;
            const y: number = (Math.exp(-(x - mean) * (x - mean) / (2 * standardDeviation * standardDeviation)) /
                (standardDeviation * Math.sqrt(2 * Math.PI))) * binWidth * yValues.length;
            const location: ChartLocationProps = getPoint(
                x,
                y,
                series.xAxis,
                series.yAxis,
                series.chart.requireInvertedAxis
            );
            curvePath += `${pathCommand} ${location.x} ${location.y} `;
            pathCommand = 'L';
        }
        return [{
            id: `${series.chart.element.id}_Series_${series.index}_NDLine`,
            d: curvePath,
            fill: 'transparent',
            stroke: strokeColor,
            strokeWidth: settings?.normalCurveWidth ?? 2,
            opacity: settings?.normalCurveOpacity ?? series.opacity ?? 1,
            dashArray: settings?.normalCurveDashArray ?? '',
            isRectPath: false
        } as HistogramRenderOptions];
    }
};

/**
 * Renders the SVG path element for the Normal Distribution curve.
 *
 * @param {RenderOptions} pathOption - SVG render options
 * @param {SeriesProperties} series - Histogram series instance
 * @param {number} animationProgress - Current animation progress (0–1)
 * @returns {JSX.Element} SVG path element
 * @private
 */
export function drawHistogramNormalDistribution(
    pathOption: RenderOptions,
    series: SeriesProperties,
    animationProgress: number
): JSX.Element {
    return (
        <path
            key={pathOption.id}
            id={pathOption.id}
            d={pathOption.d}
            fill="none"
            stroke={pathOption.stroke}
            strokeWidth={pathOption.strokeWidth}
            strokeDasharray={pathOption.dashArray}
            opacity={pathOption.opacity}
            style={{
                outline: 'none',
                visibility:
                    series.isLegendClicked || animationProgress === 1
                        ? 'visible'
                        : 'hidden'
            }}
        />
    );
}
export default HistogramSeriesRenderer;
