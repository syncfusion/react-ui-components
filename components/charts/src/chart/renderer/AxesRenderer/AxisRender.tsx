import * as React from 'react';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useLayout } from '../../layout/LayoutContext';
import { ChartSeriesProps, Column, Row } from '../../base/interfaces';
import { drawXAxisLabels, drawYAxisLabels, drawAxisTitle, drawBottomLines, drawMajorGridLines, drawXAxisMinorGridLines, drawXAxisMinorTicks, drawXAxisTickLines, drawYAxisMinorGridLines, drawYAxisMinorTicks, drawYAxisTickLines, measureAxis, renderAxis, drawAxisLine } from './CartesianLayoutRender';
import { extend } from '@syncfusion/react-base';
import { calculateStackValues, pushCategoryData } from '../SeriesRenderer/ProcessData';
import { useAxisRenderVersion, useClipRectSetter, useRegisterAxesRender, useRegisterAxieOutsideRender } from '../../hooks/useClipRect';
import { AxisModel, Chart, ColumnProps, Rect, RowProps, SeriesProperties, VisibleRangeProps } from '../../chart-area/chart-interfaces';
import { isSecondaryAxis } from '../LegendRenderer/CommonLegend';

/**
 * Represents the properties required to configure chart axes.
 *
 * @private
 */
export type ChartAxesProps = {
    /**
     * An array of axis models that define the configuration for each axis in the chart.
     */
    axes: AxisModel[];
};

// cubic easing function for smooth animation
const ease: (t: number) => number = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A React functional component responsible for rendering chart axes.
 *
 * @param {AxisModel[]} axes - An array of AxisModel objects representing the chart's axes.
 * @returns {Element} The rendered axis elements.
 */
export const AxisRenderer: React.FC<ChartAxesProps> = ({ axes }: { axes: AxisModel[] }) => {
    const { layoutRef, phase, setLayoutValue, reportMeasured } = useLayout();
    const chart: Chart = layoutRef.current.chart as Chart;
    const setClipRect: ((clipRect: Rect) => void) | null = useClipRectSetter();
    const [axisVisibleRanges, setAxisVisibleRanges] = useState(() => {
        const initial: { [key: string]: VisibleRangeProps } = {};
        chart?.axisCollection?.forEach((axis: AxisModel) => {
            initial[axis.name as string] = axis.visibleRange;
        });
        return initial;
    });

    const axisInfo: { version: number; id: string } = useAxisRenderVersion();
    // Animate from old axis range to new axis range;
    const animateYAxis: (axes: AxisModel[]) => void = useCallback((axes: AxisModel[]) => {
        const duration: number = !chart.delayRedraw ? 300 : 1000;
        const start: number = performance.now();
        const step: (now: number) => void = (now: number) => {
            const elapsed: number = now - start;
            const progress: number = Math.min(1, elapsed / duration);
            const eased: number = ease(progress);
            const visibleRangeCollection: { [key: string]: VisibleRangeProps; } = {};
            for (let i: number = 0; i < axes.length; i++) {
                const axis: AxisModel = axes[i as number];
                const newAxisRange: VisibleRangeProps = axis.visibleRange;
                const oldAxisRange: VisibleRangeProps = extend({}, axisVisibleRanges[axis.name as string]) as VisibleRangeProps;
                const xAxis: VisibleRangeProps = {
                    ...oldAxisRange, minimum: oldAxisRange.minimum + (newAxisRange.minimum - oldAxisRange.minimum) * eased,
                    maximum: oldAxisRange.maximum + (newAxisRange.maximum - oldAxisRange.maximum) * eased,
                    interval: oldAxisRange.interval + (newAxisRange.interval - oldAxisRange.interval) * eased
                };
                visibleRangeCollection[axis.name as string] = xAxis;
            }
            setAxisVisibleRanges(visibleRangeCollection);
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        if (chart.isGestureZooming) {
            const progress: number = 1;
            const eased: number = ease(progress);
            const visibleRangeCollection: { [key: string]: VisibleRangeProps; } = {};
            for (let i: number = 0; i < axes.length; i++) {
                const axis: AxisModel = axes[i as number];
                const newAxisRange: VisibleRangeProps = axis.visibleRange;
                const oldAxisRange: VisibleRangeProps = extend({}, axisVisibleRanges[axis.name as string]) as VisibleRangeProps;
                const xAxis: VisibleRangeProps = {
                    ...oldAxisRange, minimum: oldAxisRange.minimum + (newAxisRange.minimum - oldAxisRange.minimum) * eased,
                    maximum: oldAxisRange.maximum + (newAxisRange.maximum - oldAxisRange.maximum) * eased,
                    interval: oldAxisRange.interval + (newAxisRange.interval - oldAxisRange.interval) * eased
                };
                visibleRangeCollection[axis.name as string] = xAxis;
            }
            setAxisVisibleRanges(visibleRangeCollection);
        }
        else {
            requestAnimationFrame(step);
        }

    }, [axisVisibleRanges]);

    // Measuring phase: compute layout but render nothing.
    useLayoutEffect(() => {
        if (phase === 'measuring') {
            const chart: Chart = layoutRef.current.chart as Chart;
            measure(chart, chart.axisCollection);
            calculateStackValues(chart);
            measureAxis(chart.clipRect, chart);
            chart.clipRect = chart.chartAxislayout.seriesClipRect;
            renderAxis(chart);
            setLayoutValue('ChartAxis', {});
            reportMeasured('ChartAxis');
            setAxisVisibleRanges(() => {
                const initial: { [key: string]: VisibleRangeProps } = {};
                chart?.axisCollection?.forEach((axis: AxisModel) => {
                    initial[axis.name as string] = axis.visibleRange;
                });
                return initial;
            });
        }
    }, [phase, layoutRef, setLayoutValue, reportMeasured]);


    const memoizedSetClipRect: (rect: Rect) => void = useCallback((rect: Rect) => {
        if (setClipRect) {
            setClipRect(rect);
        }
    }, [setClipRect]);

    const axisReRender: (isLegendClicked?: boolean) => void = (isLegendClicked?: boolean) => {
        const chart: Chart = layoutRef.current.chart as Chart;
        if (!chart) {
            return;
        }
        // Recompute axis collection
        chart.axisCollection = !chart.delayRedraw || isLegendClicked ? chart.axisCollection : calculateVisibleAxis(
            chart.requireInvertedAxis,
            axes,
            chart.visibleSeries
        );
        (layoutRef.current.chart as Chart).visibleSeries?.map((series: SeriesProperties) => {
            refreshAxisLabel(series);
        });
        const chartRows: RowProps[] = chart.rows.map((r: Row) => {
            const newRow: RowProps = extend({}, r) as RowProps;
            newRow.axes = [];
            return newRow;
        });

        const chartColumns: ColumnProps[] = chart.columns.map((c: Column) => {
            const newColumn: ColumnProps = extend({}, c) as ColumnProps;
            newColumn.axes = [];
            return newColumn;
        });
        chart.rows = chartRows; chart.columns = chartColumns;
        measure(chart, chart.axisCollection);
        calculateStackValues(chart);
        measureAxis(chart.chartAreaRect, chart);
        chart.clipRect = chart.chartAxislayout.seriesClipRect;
        renderAxis(chart);
        animateYAxis(chart.axisCollection);
        if (setClipRect) {
            memoizedSetClipRect({
                x: chart.clipRect.x, y: chart.clipRect.y,
                width: chart.clipRect.width, height: chart.clipRect.height
            });
        }
    };
    if (chart) {
        chart.axisRender = axisReRender;
    }
    // Rendering phase: recalc axes and trigger animation on prop changes
    useEffect(() => {
        if (phase !== 'measuring') {
            axisReRender();
            const triggerSeriesRender: (chartId?: string) => void = useRegisterAxesRender();
            triggerSeriesRender(chart?.element?.id);
        }
    }, [
        ...axes.flatMap((axis: AxisModel) => [
            axis.minimum,
            axis.maximum,
            axis.interval,
            axis.titleStyle?.fontSize,
            axis.labelStyle?.fontSize,
            axis.valueType,
            axis.majorTickLines.height,
            axis.titleStyle.text,
            axis.plotOffset,
            axis.rangePadding,
            axis.intervalType,
            axis.labelStyle?.intersectAction,
            axis.labelStyle?.padding,
            axis.titleStyle?.padding,
            axis.titleStyle?.text,
            axis.labelStyle.position,
            axis.labelStyle.rotationAngle,
            axis.labelStyle.maxLabelWidth,
            axis.majorTickLines.height,
            axis.minorTickLines.height,
            axis.lineStyle?.width,
            axis.zoomFactor,
            axis.zoomPosition,
            axis.inverted,
            axis.opposedPosition,
            axis.labelStyle.placement,
            axis.labelStyle.align,
            axis.labelStyle.format,
            axis.indexed,
            axis.crossAt?.value,
            axis.crossAt?.axis,
            axis.crossAt?.allowOverlap,
            axis.crosshairTooltip
        ])
    ]);

    useEffect(() => {
        if (phase !== 'measuring' && axisInfo.id === (layoutRef.current.chart as Chart)?.element.id) {
            axisReRender(true);
        }
    }, [
        axisInfo.version
    ]);

    useEffect(() => {
        if (phase !== 'measuring') {
            axisReRender();
        }
    }, [
        ...axes.flatMap((axis: AxisModel) => [
            axis.labelStyle.edgeLabelPlacement
        ])
    ]);

    // Don't render while measuring
    if (phase === 'measuring') {
        return null;
    }

    /**
     * Calculates the pixel Y-coordinate on the chart for a given data value,
     * based on the axis visible range and chart area.
     *
     * @param {number} value - The numeric data value to convert.
     * @param {Rect} rect - The rectangle representing the chart's drawing area.
     * @param {AxisModel} axis - The axis model used for computing the scaling.
     * @returns {number} - The computed Y-coordinate in pixels.
     */
    const yScale: (value: number, rect: Rect, axis: AxisModel) => number = (
        value: number, rect: Rect, axis: AxisModel) => {
        const visibleRange: VisibleRangeProps = axisVisibleRanges[axis.name as string];  // yAxisRange;
        const range: number = ((value - visibleRange.minimum) / (visibleRange.maximum - visibleRange.minimum));
        return (
            axis.isAxisInverse ? (rect.y + range * rect.height) : (rect.y + rect.height - range * rect.height)
        );
    };

    /**
     * Calculates the scaled x-coordinate position of a given value based on the axis's visible range
     * and the provided rendering rectangle. This function respects axis inversion settings.
     *
     * @param {number} value - The data value to be converted to a scaled x-coordinate.
     * @param {Rect} rect - The bounding rectangle within which the axis is rendered.
     * @param {AxisModel} axis - The X axis model containing configuration and inversion settings.
     * @returns {number} - The pixel position (x-coordinate) corresponding to the input value within the given rectangle.
     */
    const xScale: (value: number, rect: Rect, axis: AxisModel) => number = (
        value: number, rect: Rect, axis: AxisModel) => {
        const visibleRange: VisibleRangeProps = axisVisibleRanges[axis.name as string];
        const range: number = ((value - visibleRange.minimum) / (visibleRange.maximum - visibleRange.minimum));
        return (
            axis.isAxisInverse ? (rect.x + rect.width - range * rect.width) : (rect.x + range * rect.width)
        );
    };
    const secondaryAxes: AxisModel[] = axes.slice(2);
    return (
        <g id={chart.element.id + '_AxisInsideCollection'}>
            {chart.axisCollection.map((axis: AxisModel, idx: number) => {
                let currentAxis: AxisModel = axis;
                if (axis.name === 'primaryXAxis') {
                    currentAxis = axes[0];
                } else if (axis.name === 'primaryYAxis') {
                    currentAxis = axes[1];
                } else {
                    const secondaryAxis: AxisModel[] = secondaryAxes;
                    const foundAxis: AxisModel | undefined = secondaryAxis.find(
                        (secondaryAxis: AxisModel) => secondaryAxis.name === axis.name
                    );
                    if (foundAxis) {
                        currentAxis = foundAxis;
                    }
                }
                if (axis.labelStyle.position === 'Inside' || axis.tickPosition === 'Inside') {
                    const triggerSeriesRender: () => void = useRegisterAxieOutsideRender();
                    triggerSeriesRender();
                }
                return (
                    <g
                        id={chart.element.id + '_AxisGroup_' + idx + '_Inside'}
                        key={idx}
                    >

                        {axis.visible && axis.internalVisibility && axis.orientation === 'Vertical' && (
                            <>
                                <defs>
                                    <clipPath id={`${chart.element.id}_Axis_${idx}_Clip`}>
                                        <rect x={0}
                                            y={chart.chartAreaRect.y - (currentAxis.majorGridLines.width as number)}
                                            width={chart.chartAreaRect.width + chart.chartAreaRect.x}
                                            height={chart.chartAreaRect.height + (currentAxis.majorGridLines.width as number)} />
                                    </clipPath>
                                </defs>
                                {drawMajorGridLines(idx, axis, chart, currentAxis, yScale)}
                                {drawYAxisTickLines(axis, idx, yScale, chart, currentAxis)}
                                {drawYAxisMinorGridLines(axis, idx, chart, yScale, currentAxis)}
                                {drawYAxisMinorTicks(axis, idx, yScale, chart, currentAxis)}
                                {drawYAxisLabels(axis, idx, axis.crossAt?.allowOverlap ? axis.updatedRect : axis.rect, chart, yScale)}
                                {drawAxisTitle(axis, chart, idx, currentAxis)}
                                {drawAxisLine(axis, currentAxis, chart)}
                            </>
                        )}

                        {axis.visible && axis.internalVisibility && axis.orientation === 'Horizontal' && (
                            <>
                                <defs>
                                    <clipPath id={`${chart.element.id}_Axis_${idx}_Clip`}>
                                        <rect x={chart.clipRect.x - (currentAxis.majorGridLines.width as number)} y={chart.chartAreaRect.y}
                                            width={chart.chartAreaRect.width} height={chart.chartAreaRect.height} />
                                    </clipPath>
                                </defs>
                                {drawMajorGridLines(idx, axis, chart, currentAxis, xScale)}
                                {drawXAxisTickLines(axis, idx, xScale, chart, currentAxis)}
                                {drawXAxisMinorGridLines(axis, idx, chart, xScale, currentAxis)}
                                {drawXAxisMinorTicks(axis, idx, xScale, chart, currentAxis)}
                                {drawXAxisLabels(axis, idx, axis.crossAt?.allowOverlap ? axis.updatedRect : axis.rect, chart, xScale)}
                                {drawAxisTitle(axis, chart, idx, currentAxis)}
                                {drawAxisLine(axis, currentAxis, chart)}
                            </>
                        )}
                    </g>
                );
            })}
            {drawBottomLines(chart)}
        </g>
    );
};


/**
 * Custom hook that calculates and returns the visible axes based on the chart's orientation
 * and the series that are currently visible.
 *
 * @param {boolean} requireInvertedAxis - Indicates whether the chart orientation is inverted (e.g., horizontal chart).
 * @param {AxisModel[]} axisCollection - The full collection of axis models defined in the chart.
 * @param {SeriesProperties[]} visibleSeries - The list of series that are currently visible in the chart.
 * @returns {AxisModel[]} An array of axis models that are determined to be visible based on the current chart state.
 * @private
 */
export function calculateVisibleAxis(
    requireInvertedAxis: boolean, axisCollection: AxisModel[], visibleSeries: SeriesProperties[]): AxisModel[] {
    const axisCollections: AxisModel[] = [];
    const calculatedAxes: AxisModel[] = [];
    axisCollection.map((axis: AxisModel) => {
        calculatedAxes.push(extend({}, axis) as AxisModel);
    });
    calculatedAxes.forEach((axis: AxisModel) => {
        axis.series = [];
        axis.labels = [];
        axis.indexLabels = {};
        axis.axisMajorGridLineOptions = [];
        axis.axisMajorTickLineOptions = [];
        axis.axisMinorGridLineOptions = [];
        axis.axisMinorTickLineOptions = [];
        axis.axislabelOptions = [];
        axis.axisTitleOptions = [];
        axis.internalVisibility = true;
        axis.actualRange = { minimum: 0, maximum: 0, interval: 0, delta: 0 };
        axis.doubleRange = { start: 0, end: 0, delta: 0, median: 0 };
        axis.intervalDivs = [10, 5, 2, 1];
        axis.visibleRange = { minimum: 0, maximum: 0, interval: 0, delta: 0 };
        axis.visibleLabels = [];
        axis.startLabel = '';
        axis.endLabel = '';
        axis.maxLabelSize = { height: 0, width: 0 };
        axis.rect = { x: 0, y: 0, width: 0, height: 0 };
        axis.updatedRect = { x: 0, y: 0, width: 0, height: 0 };
        axis.axisLineOptions = {
            id: '',
            d: '',
            stroke: '',
            strokeWidth: 0,
            dashArray: '',
            fill: ''
        };
        axis.series = [];
        axis.paddingInterval = 0;
        axis.maxPointLength = 0;
        axis.isStack100 = false;
        axis.titleCollection = [];
        axis.titleSize = { height: 0, width: 0 };
        for (const series of visibleSeries) {
            initAxis(requireInvertedAxis, series, axis, true);
        }
        if (axis.orientation != null) {
            axisCollections.push(axis);
        }
        const secondaryAxes: AxisModel[] = axisCollection.slice(2);
        if (isSecondaryAxis(axis, secondaryAxes)) {
            axis.internalVisibility = axis.series.some((value: ChartSeriesProps) => (value.visible));
        }
    });
    return axisCollections;
}

/**
 * Measures the dimensions and computes necessary positioning for chart axes.
 * Adjusts axis positions and calculates specific layout measurements required for rendering.
 *
 * @param {Chart} chart - The chart instance containing the configuration and elements to be measured.
 * @param {AxisModel[]} axes - An array of axis models to be measured and processed for layout.
 * @returns {void} This function performs measurements in-place and does not return a value.
 * @private
 */
export function measure(chart: Chart, axes: AxisModel[]): void {
    for (const axis of axes) {
        let actualIndex: number;
        let span: number;
        let definition: RowProps | ColumnProps;
        if (axis.orientation === 'Vertical') {
            chart.verticalAxes.push(axis);
            actualIndex = getActualRow(chart.rows, axis);
            const row: RowProps = chart.rows[actualIndex as number];
            pushAxis(row, axis);
            span = Math.min(actualIndex + (axis.span as number), chart.rows.length);
            for (let j: number = actualIndex + 1; j < span; j++) {
                definition = { ...chart.rows[j as number] };
                definition.axes = [...(definition.axes || [])];
                definition.axes[row.axes.length - 1] = { ...axis };
                chart.rows[j as number] = definition;
            }
            chart.rows[actualIndex as number] = row;
        } else {
            actualIndex = getActualColumn(chart.columns, axis);
            const column: ColumnProps = chart.columns[actualIndex as number];
            pushAxis(chart.columns[actualIndex as number], axis);
            chart.horizontalAxes.push(axis);
            span = Math.min(actualIndex + (axis.span as number), chart.columns.length);
            for (let j: number = actualIndex + 1; j < span; j++) {
                definition = { ...chart.columns[j as number] };
                definition.axes = [...(definition.axes || [])];
                definition.axes[column.axes.length - 1] = { ...axis };
                chart.columns[j as number] = definition;
            }
            chart.columns[actualIndex as number] = column;
        }
        axis.isRTLEnabled = chart.enableRtl || false;
        setIsInversedAndOpposedPosition(axis);
    }
}

/**
 * Initializes the orientation of the axis for a given series, determining if it should be vertical or horizontal.
 * Sets the axis orientation based on the necessity to invert the axis and the association with the series.
 *
 * @param {boolean} requireInvertedAxis - Indicates if the axis should be set to a vertical orientation.
 * @param {SeriesProperties} series - The data series which might dictate the axis orientation.
 * @param {AxisModel} axis - The axis model to be initialized and oriented.
 * @param {boolean} isSeries - Specifies if the axis is related to the series or not.
 * @returns {void} This function modifies the axis directly and does not return a value.
 * @private
 */
function initAxis(requireInvertedAxis: boolean, series: SeriesProperties, axis: AxisModel, isSeries: boolean): void {
    if (series.xAxisName === axis.name || (series.xAxisName == null && axis.name === 'primaryXAxis')) {
        axis.orientation = requireInvertedAxis ? 'Vertical' : 'Horizontal';
        series.xAxis = axis;
        if (isSeries) { axis.series.push(series); }
    } else if (series.yAxisName === axis.name || (series.yAxisName == null && axis.name === 'primaryYAxis')) {
        axis.orientation = requireInvertedAxis ? 'Horizontal' : 'Vertical';
        series.yAxis = axis;
        if (isSeries) { axis.series.push(series); }
    }
}

/**
 * Determines the actual column index for an axis within a collection of columns.
 * Validates that the column index is within the acceptable range of the supplied columns array.
 *
 * @param {ColumnProps[]} columns - The array of column definitions in which to locate the axis.
 * @param {AxisModel} axis - The axis for which to find the correct column index.
 * @returns {number} The actual column index ensuring it falls within the valid range of columns.
 * @private
 */
function getActualColumn(columns: ColumnProps[], axis: AxisModel): number {
    const position: number = axis.columnIndex as number;
    return position >= columns.length ? columns.length - 1 : Math.max(0, position);
}

/**
 * Determines the actual row index for an axis within a collection of rows.
 * Ensures the row index is within valid bounds of the provided rows array.
 *
 * @param {RowProps[]} rows - The array of row definitions in which to locate the axis.
 * @param {AxisModel} axis - The axis for which to find the correct row index.
 * @returns {number} The actual row index ensuring it falls within the valid range of rows.
 * @private
 */
function getActualRow(rows: RowProps[], axis: AxisModel): number {
    const position: number = axis.rowIndex as number;
    return position >= rows.length ? rows.length - 1 : Math.max(0, position);
}

/**
 * Adds an axis to the specified definition object, which could represent either a row or a column.
 * Finds the first empty slot in the axes array of the definition and assigns the axis to that slot.
 *
 * @param {RowProps | ColumnProps} definition - The row or column definition to which the axis will be added.
 * @param {AxisModel} axis - The axis instance to be inserted into the definition.
 * @returns {void} This function modifies the definition directly and does not return any value.
 * @private
 */
function pushAxis(definition: RowProps | ColumnProps, axis: AxisModel): void {
    for (let i: number = 0; i <= definition.axes.length; i++) {
        if (!definition.axes[i as number]) {
            definition.axes[i as number] = axis;
            break;
        }
    }
}

/**
 * Refreshes the axis labels for category axes
 *
 * @param {SeriesProperties} series - The series for which to refresh axis labels
 * @returns {void}
 * @private
 */
export function refreshAxisLabel(series: SeriesProperties): void {
    if (!series.xAxis || (series.xAxis.valueType !== 'Category')) {
        return;
    }
    series.xAxis.labels = [];
    series.xAxis.indexLabels = {};

    for (const item of series.xAxis.series) {
        if (item.visible) {
            item.xMin = Infinity;
            item.xMax = -Infinity;

            if (item.points) {
                for (const point of item.points) {
                    pushCategoryData(point, point.x as string, item, point.index);
                    item.xMin = Math.min(item.xMin, point.xValue as number);
                    item.xMax = Math.max(item.xMax, point.xValue as number);
                }
            }
        }
    }
}

/**
 * Configures the axis position properties such as inverseness and whether it is in an opposed position.
 * Determines the orientation to set properties that influence how the axis is displayed.
 *
 * @param {AxisModel} axis - The axis model to configure inverseness and opposed position properties.
 * @returns {void} This function modifies axis properties directly and does not return any value.
 * @private
 */
function setIsInversedAndOpposedPosition(axis: AxisModel): void {
    const isVertical: boolean = axis.orientation === 'Vertical';
    const isHorizontal: boolean = axis.orientation === 'Horizontal';

    // Determine if the axis should be opposed
    axis.isAxisOpposedPosition = (axis.opposedPosition || false) || ((axis.isRTLEnabled || false) && isVertical);
    if (axis.opposedPosition && axis.isRTLEnabled && isVertical) {
        axis.isAxisOpposedPosition = false;
    }

    // Determine if the axis should be inverted
    axis.isAxisInverse = (axis.inverted || (axis.isRTLEnabled && isHorizontal)) || false;
    if (axis.inverted && axis.isRTLEnabled && isHorizontal) {
        axis.isAxisInverse = false;
    }
}
