import { Points, RenderOptions, SeriesProperties, AxisModel, ProcessedParetoOptions, ChartParetoOptionsInternalProps } from '../../chart-area/chart-interfaces';
import { AnimationState } from './SeriesAnimation';
import ColumnSeries from './ColumnSeriesRenderer';
import { markerShapes } from './MarkerRenderer';
import { handleRectAnimation } from './SeriesAnimation';

/**
 * Defines the contract for the Pareto Series Renderer module.
 */
interface ParetoSeriesRendererType {
    /**
     * Calculates and returns animation properties for pareto series paths.
     */
    doAnimation: Function;
    /**
     * The main rendering function that processes an entire pareto series and generates all required SVG paths.
     */
    render: Function;
}

/**
 * Result interface for animation operations.
 *
 * @private
 */
export interface AnimationResult {
    strokeDasharray: string;
    strokeDashoffset: number;
    interpolatedD: string | undefined;
    animatedDirection?: string;
    animatedTransform?: string;
}

/**
 * Renderer for Pareto series.
 */
const ParetoSeriesRenderer: ParetoSeriesRendererType = {
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties,
        currentPoint: Points | undefined,
        pointIndex: number
    ): AnimationResult => {
        const animatedValues: { animatedDirection?: string; animatedTransform?: string; } =
            handleRectAnimation(
                pathOptions,
                currentSeries,
                index,
                currentPoint,
                pointIndex,
                animationState,
                enableAnimation
            );
        return {
            strokeDasharray: 'none',
            strokeDashoffset: 0,
            interpolatedD: undefined,
            animatedDirection: animatedValues.animatedDirection,
            animatedTransform: animatedValues.animatedTransform
        };
    },

    render: (series: SeriesProperties, isInverted: boolean) => {
        return ColumnSeries.render(series, isInverted);
    }
};

/**
 * Performs cumulative percentage calculation for Pareto analysis.
 *
 * @param {Object} json - Source data array (objects with numeric yField).
 * @param {SeriesProperties} series - Series containing yField to accumulate.
 * @returns {Object[]} Mutated data array with yField converted to cumulative percentage.
 * @private
 */
export function performCumulativeCalculation(json: Object, series: SeriesProperties): Object[] {
    const dataPoints: Object[] = json as Object[];
    if (!series.yField) {
        return dataPoints;
    }
    const yField: string = series.yField;
    let sum: number = 0;
    let count: number = 0;
    const length: number = dataPoints.length;
    for (let i: number = 0; i < length; i++) {
        const row: { [k: string]: number; } = dataPoints[i as number] as { [k: string]: number };
        sum += row[yField as string];
    }
    for (let i: number = 0; i < length; i++) {
        const row: { [k: string]: number; } = dataPoints[i as number] as { [k: string]: number };
        count = count + row[yField as string];
        row[yField as string] = Number(((count / sum) * 100).toFixed(2));
    }
    return dataPoints;
}

let markerIndex: number = 0;

/**
 * Initializes a derived Pareto line series that overlays the base (typically column) series.
 *
 * @param {SeriesProperties} targetSeries - Base series from which to derive Pareto overlay.
 * @param {AxisModel[]} axisCollection - Chart axis collection.
 * @param {string[]} colors - Palette used for fallback color assignment.
 * @param {SeriesProperties[]} visibleSeries - Collection of currently visible series.
 * @param {AxisModel[]} paretoAxes - Axes used for rendering the Pareto line.
 * @returns {SeriesProperties} Configured Pareto line series.
 * @private
 */
export function initSeries(targetSeries: SeriesProperties, axisCollection: AxisModel[],
                           colors: string[], visibleSeries: SeriesProperties[], paretoAxes: AxisModel[]): SeriesProperties {
    const base: SeriesProperties = { ...targetSeries };
    const count: number = colors.length;
    const indexValue: number = (visibleSeries.length - 1) + 1;
    base.isRectSeries = false;
    const series: SeriesProperties = {
        ...base,
        name: 'Pareto',
        yAxisName: targetSeries.yAxisName + '_CumulativeAxis',
        category: 'Pareto',
        index: indexValue,
        type: 'Line',
        interior: base.paretoOptions?.fill ? base.paretoOptions.fill : colors[indexValue % count],
        fill: base.paretoOptions?.fill ? base.paretoOptions.fill : colors[indexValue % count],
        width: base.paretoOptions?.width,
        dashArray: base.paretoOptions?.dashArray,
        marker: base.paretoOptions?.marker,
        lastValueLabel: { enable: false }
    };
    if (series.marker && series.marker.visible) {
        const previousSeries: SeriesProperties = visibleSeries[visibleSeries.length - 1];
        const previousHasVisibleMarker: boolean = !!previousSeries?.marker?.visible;
        if (markerIndex === 0) {
            markerIndex = previousHasVisibleMarker ? 1 : 0;
        }
        series.marker.shape = series.marker.shape ? series.marker.shape : markerShapes[markerIndex as number];
        markerIndex++;
    }
    initAxis(targetSeries, series, axisCollection, paretoAxes);
    return series;
}

/**
 * Ensures a dedicated secondary Y-axis for Pareto cumulative percentage is available.
 *
 * @param {SeriesProperties} paretoSeries - Base series from which to copy axis styling.
 * @param {SeriesProperties} targetSeries - Pareto overlay series needing the cumulative axis.
 * @param {AxisModel[]} axisCollection - Chart's available axes.
 * @param {AxisModel[]} paretoAxes - Chart's available axes.
 * @returns {void}
 * @private
 */
export function initAxis(paretoSeries: SeriesProperties, targetSeries: SeriesProperties,
                         axisCollection: AxisModel[], paretoAxes: AxisModel[]): void {
    const isExist: boolean = paretoAxes.some((currentAxis: AxisModel) => {
        return currentAxis.name === targetSeries.yAxisName;
    });
    if (isExist) {
        return;
    }
    if (!isExist) {
        const secondaryAxis: AxisModel = (
            paretoSeries.yAxisName && axisCollection.length
                ? axisCollection.filter((axis: AxisModel) => axis.name === paretoSeries.yAxisName)[0]
                : axisCollection[1]
        );
        const newAxis: AxisModel = {
            ...secondaryAxis,
            name: targetSeries.yAxisName ?? undefined,
            majorGridLines: { width: 0 },
            majorTickLines: secondaryAxis.majorTickLines,
            lineStyle: secondaryAxis.lineStyle,
            minimum: 0,
            maximum: 100,
            interval: 20,
            rowIndex: secondaryAxis.rowIndex,
            opposedPosition: true,
            labelStyle: { format: '{value}%', position: 'Outside', rotationAngle: 0, padding: 5, placement: 'OnTicks', align: 'Center' },
            titleStyle: { ...(secondaryAxis.titleStyle), text: '' }
        };
        paretoAxes.push(newAxis);
    }
}


/**
 * Extracts the Pareto-specific processed options from a SeriesProperties instance.
 * This function mirrors the transformation logic applied inside SeriesRenderer.tsx
 * when constructing the lightweight processedSeriesData object used for change detection.
 *
 * @param {SeriesProperties} series - The series instance containing paretoOptions.
 * @returns {ProcessedParetoOptions | undefined} A flattened, memo-friendly Pareto options object.
 * @private
 */
export function getProcessedParetoOptions(series: SeriesProperties): ProcessedParetoOptions | undefined {
    const paretoOptions: ChartParetoOptionsInternalProps = series.paretoOptions;
    if (paretoOptions) {
        return {
            fill: paretoOptions.fill,
            width: paretoOptions.width,
            dashArray: paretoOptions.dashArray,
            showAxis: paretoOptions.showAxis,
            marker: paretoOptions.marker ? {
                visible: paretoOptions.marker.visible,
                width: paretoOptions.marker.width,
                height: paretoOptions.marker.height,
                shape: paretoOptions.marker.shape,
                filled: paretoOptions.marker.filled,
                imageUrl: paretoOptions.marker.imageUrl,
                fill: paretoOptions.marker.fill,
                opacity: paretoOptions.marker.opacity,
                highlightable: paretoOptions.marker.highlightable,
                border: paretoOptions.marker.border ? {
                    width: paretoOptions.marker.border?.width,
                    color: paretoOptions.marker.border?.color,
                    dashArray: paretoOptions.marker.border?.dashArray
                } : undefined,
                offset: paretoOptions.marker.offset ? {
                    x: paretoOptions.marker.offset?.x,
                    y: paretoOptions.marker.offset?.y
                } : undefined,
                dataLabel: paretoOptions.marker.dataLabel ? {
                    visible: paretoOptions.marker.dataLabel.visible,
                    showZero: paretoOptions.marker.dataLabel.showZero,
                    labelField: paretoOptions.marker.dataLabel.labelField,
                    fill: paretoOptions.marker.dataLabel.fill,
                    format: paretoOptions.marker.dataLabel.format,
                    opacity: paretoOptions.marker.dataLabel.opacity,
                    rotationAngle: paretoOptions.marker.dataLabel.rotationAngle,
                    enableRotation: paretoOptions.marker.dataLabel.enableRotation,
                    template: paretoOptions.marker.dataLabel.template,
                    position: paretoOptions.marker.dataLabel.position,
                    borderRadius: paretoOptions.marker.dataLabel.borderRadius ? {
                        x: paretoOptions.marker.dataLabel.borderRadius?.x,
                        y: paretoOptions.marker.dataLabel.borderRadius?.y
                    } : undefined,
                    textAlign: paretoOptions.marker.dataLabel.textAlign,
                    border: paretoOptions.marker.dataLabel.border ? {
                        width: paretoOptions.marker.dataLabel.border?.width,
                        color: paretoOptions.marker.dataLabel.border?.color
                    } : undefined,
                    margin: paretoOptions.marker.dataLabel.margin ? {
                        right: paretoOptions.marker.dataLabel.margin?.right,
                        bottom: paretoOptions.marker.dataLabel.margin?.bottom,
                        left: paretoOptions.marker.dataLabel.margin?.left,
                        top: paretoOptions.marker.dataLabel.margin?.top
                    } : undefined,
                    font: paretoOptions.marker.dataLabel.font ? {
                        fontStyle: paretoOptions.marker.dataLabel.font?.fontStyle,
                        fontSize: paretoOptions.marker.dataLabel.font?.fontSize,
                        fontWeight: paretoOptions.marker.dataLabel.font?.fontWeight,
                        color: paretoOptions.marker.dataLabel.font?.color,
                        fontFamily: paretoOptions.marker.dataLabel.font?.fontFamily,
                        opacity: paretoOptions.marker.dataLabel.font?.opacity
                    } : undefined
                } : undefined
            } : undefined
        };
    }
    return undefined;
}

export default ParetoSeriesRenderer;
