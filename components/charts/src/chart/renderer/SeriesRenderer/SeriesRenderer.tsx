
import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChartSeriesProps, ChartDataLabelProps, ChartMarkerProps, SeriesAccessibility, ChartErrorBarProps } from '../../base/interfaces';
import { areDataSourcesEqual, checkTabindex, firstToLowerCase, useVisiblePoints } from '../../utils/helper';
import ColumnSeries from './ColumnSeriesRenderer';
import * as React from 'react';
import { useLayout } from '../../layout/LayoutContext';
import { useAxesRendereVersion, useRegisterLegendShapeRender, useSeriesRenderVersion } from '../../hooks/useClipRect';
import {
    animatePath,
    addPoint,
    removePoint,
    setData
} from './updatePoint';
import LineSeriesRenderer from './lineSeriesRenderer';
import BarSeries from './BarSeriesRenderer';
import { processJsonData } from './ProcessData';
import SplineSeriesRenderer from './SplineSeriesRenderer';
import StepLineSeriesRenderer from './StepLineSeriesRenderer';
import AreaSeriesRenderer from './AreaSeriesRenderer';
import MarkerRenderer, { renderMarkerJSX } from './MarkerRenderer';
import DataLabelRenderer, {
    renderDataLabelShapesJSX,
    renderDataLabelTextJSX
} from './DataLabelRender';
import StackingColumnSeriesRenderer from './StackingColumnSeriesRenderer';
import StackingBarSeriesRenderer from './StackingBarSeriesRenderer';
import ScatterSeriesRenderer from './ScatterSeriesRenderer';
import BubbleSeriesRenderer from './BubbleSeriesRenderer';
import SplineAreaSeriesRenderer from './SplineAreaSeriesRenderer';
import { ChartSeriesType } from '../../base/enum';
import { Chart, DataLabelRendererResult, DataPoint, MarkerOptions, MarkerProperties, Points, Rect, RenderOptions, SeriesModules, SeriesProperties } from '../../chart-area/chart-interfaces';
import { isEqual, useStableDataLabelProps, useStableDataSources, useStableMarkerProps } from '../../hooks/useDeepCompare';
import CandleSeriesRenderer from './CandleSeriesRenderer';
import HiloSeriesRenderer from './HiloSeriesRenderer';
import HiloOpenCloseSeriesRenderer from './HiloOpenCloseRenderer';
import RangeAreaSeriesRenderer from './RangeAreaSeriesRenderer';
import StepAreaSeriesRenderer from './StepAreaSeriesRenderer';
import StackingAreaSeriesRenderer from './StackingAreaSeriesRenderer';
import RangeColumnSeriesRenderer from './RangeColumnSeriesRenderer';
import SplineRangeAreaRenderer from './SplineRangeAreaSeriesRenderer';
import { renderErrorBarsJSX } from './ErrorBarRender';
import MultiColoredLineSeriesRenderer from './MultiColoredLineSeriesRenderer';
import { isNullOrUndefined } from '@syncfusion/react-base';

// Create a global chart instance for storing options
export const chart: Chart = {} as Chart;
// Add our custom properties to the chart object
/**
 * Constants for animation durations
 */
const LEGEND_ANIMATION_DURATION: number = 300;
const DEFAULT_ANIMATION_DURATION: number = 500;
/**
 * Extensions to the Chart type with additional properties for rendering.
 * These properties store options needed for rendering various chart elements.
 */
type ChartExtensions = {
    /** Array of render options for each series */
    seriesOptions: RenderOptions[][];
    /** Marker properties for series data points */
    markerOptions: ChartMarkerProps[];
    /** Data label configuration and position information */
    dataLabelOptions: DataLabelRendererResult[][];
};

(chart as Chart & ChartExtensions).seriesOptions = [];
(chart as Chart & ChartExtensions).markerOptions = [];
(chart as Chart & ChartExtensions).dataLabelOptions = [];

/**
 * Storage for chart-specific rendering options, organized by chart ID.
 * This allows multiple charts to maintain their own configuration state.
 */
const seriesOptionsByChartId: { [chartId: string]: RenderOptions[][] } = {};
const markersOptionsByChartId: { [chartId: string]: ChartMarkerProps[] } = {};
export const dataLabelOptionsByChartId: { [chartId: string]: DataLabelRendererResult[][] } = {};

export const seriesModules: SeriesModules = {
    'lineSeriesModule': LineSeriesRenderer,
    'multiColoredLineSeriesModule': MultiColoredLineSeriesRenderer,
    'splineSeriesModule': SplineSeriesRenderer,
    'columnSeriesModule': ColumnSeries,
    'barSeriesModule': BarSeries,
    'stepLineSeriesModule': StepLineSeriesRenderer,
    'areaSeriesModule': AreaSeriesRenderer,
    'stackingColumnSeriesModule': StackingColumnSeriesRenderer,
    'stackingBarSeriesModule': StackingBarSeriesRenderer,
    'scatterSeriesModule': ScatterSeriesRenderer,
    'bubbleSeriesModule': BubbleSeriesRenderer,
    'splineAreaSeriesModule': SplineAreaSeriesRenderer,
    'stepAreaSeriesModule': StepAreaSeriesRenderer,
    'stackingAreaSeriesModule': StackingAreaSeriesRenderer,
    'candleSeriesModule': CandleSeriesRenderer,
    'hiloSeriesModule': HiloSeriesRenderer,
    'hiloOpenCloseSeriesModule': HiloOpenCloseSeriesRenderer,
    'rangeAreaSeriesModule': RangeAreaSeriesRenderer,
    'rangeColumnSeriesModule': RangeColumnSeriesRenderer,
    'splineRangeAreaSeriesModule': SplineRangeAreaRenderer
};

const processRenderResult: (renderResult: RenderOptions[] | {
    options: RenderOptions[];
    marker: ChartMarkerProps;
}, chartId: string, series: SeriesProperties) => RenderOptions[] = (
    renderResult: RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps },
    chartId: string,
    series: SeriesProperties
): RenderOptions[] => {
    // Check if the result has options property (indicating it's an object with options and marker)
    const hasMarkerData: boolean = typeof renderResult === 'object' && 'options' in renderResult;
    const options: RenderOptions[] = hasMarkerData ?
        (renderResult as { options: RenderOptions[] }).options :
        renderResult as RenderOptions[];
    if (!seriesOptionsByChartId[chartId as string]) {
        seriesOptionsByChartId[chartId as string] = [];
    }
    // Process marker data if it exists
    if (hasMarkerData && 'marker' in renderResult) {
        if (!markersOptionsByChartId[chartId as string] && !series.skipMarkerAnimation) {
            markersOptionsByChartId[chartId as string] = [];
        }
        const markerData: ChartMarkerProps = (renderResult as { marker: ChartMarkerProps }).marker;
        markersOptionsByChartId[chartId as string].push(markerData);
        (chart as Chart).markerOptions = [...((chart as Chart).markerOptions as ChartMarkerProps[]), markerData];
    }
    // Store and return the render options
    seriesOptionsByChartId[chartId as string].push(options);
    (chart as Chart & ChartExtensions as { seriesOptions: RenderOptions[][] }).seriesOptions = seriesOptionsByChartId[chartId as string];

    return options;
};

/**
 * Calculates and assigns the clip rectangle for a series based on its axis properties.
 *
 * @param {SeriesProperties} series - The series for which to calculate the clip rectangle.
 * @returns {void}
 */
const findClipRect: (series: SeriesProperties) => void = (series: SeriesProperties): void => {
    const rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
    if (series.chart?.requireInvertedAxis) {
        rect.x = series.yAxis.rect.x;
        rect.y = series.xAxis.rect.y;
        rect.width = series.yAxis.rect.width;
        rect.height = series.xAxis.rect.height;
    } else {
        rect.x = series.xAxis.rect.x;
        rect.y = series.yAxis.rect.y;
        rect.width = series.xAxis.rect.width;
        rect.height = series.yAxis.rect.height;
    }
    series.clipRect = rect;
};

/**
 * Updates the collection of series to be rendered based on changes to the x or y axes.
 *
 * @param {boolean} xAxis - Indicates if the update is related to the x-axis.
 * @param {boolean} yAxis - Indicates if the update is related to the y-axis.
 * @param {SeriesProperties} series - The series to update.
 * @param {boolean} [isLegendClicked] - Whether the update was triggered by a legend click event.
 * @returns {void}
 */
const updateSeries: (xAxis: boolean, yAxis: boolean, series: SeriesProperties, isLegendClicked?: boolean) => void =
    (xAxis: boolean, yAxis: boolean, series: SeriesProperties, isLegendClicked?: boolean): void => {
        const chartId: string = series.chart ? series.chart.element.id : 'default';
        let seriesCollection: SeriesProperties[] = [];
        seriesCollection = (xAxis && yAxis)
            ? Array.from(new Set(series.xAxis.series.concat(series.yAxis.series)))
            : (xAxis ? series.xAxis.series : series.yAxis.series).slice();
        if (isLegendClicked) {
            if (series.visible || series.type?.indexOf('Stacking') !== -1) {
                findClipRect(series);
                let seriesType: string = firstToLowerCase(series.type as string);
                seriesType = seriesType.replace('100', '');
                const renderResult: RenderOptions[] | {
                    options: RenderOptions[];
                    marker: ChartMarkerProps;
                } = seriesModules[seriesType + 'SeriesModule' as keyof typeof seriesModules]
                    .render(series, series.chart.requireInvertedAxis);
                processRenderResult(renderResult, chartId, series);
            }
        }
        else {
            seriesOptionsByChartId[chartId as string] = [];
            (chart as Chart).seriesOptions = [];
            if (series.skipMarkerAnimation) {
                markersOptionsByChartId[chartId as string] = [];
            }
            for (const series of seriesCollection) {
                if (series.visible || series.type?.indexOf('Stacking') !== -1) {
                    findClipRect(series);
                    let seriesType: string = firstToLowerCase(series.type as string);
                    seriesType = seriesType.replace('100', '');
                    const renderResult: RenderOptions[] | {
                        options: RenderOptions[];
                        marker: ChartMarkerProps;
                    } = seriesModules[seriesType + 'SeriesModule' as keyof typeof seriesModules]
                        .render(series, series.chart.requireInvertedAxis);
                    processRenderResult(renderResult, chartId, series);
                }
            }
        }
    };

/**
 * Component responsible for rendering all chart series types.
 * Handles animations, markers, data labels, and series paths.
 *
 * @param {SeriesProperties} props - The properties for the series
 * @param {React.ForwardedRef<SVGGElement>} ref - Reference to the SVG group element
 * @returns {React.ReactElement | null} The rendered series elements or null during measuring phase
 */
export const SeriesRenderer: React.ForwardRefExoticComponent<ChartSeriesProps[] & React.RefAttributes<SVGGElement>> =
    forwardRef<SVGGElement, ChartSeriesProps[]>((props: ChartSeriesProps[], ref: React.ForwardedRef<SVGGElement>) => {
        const [_markerVersion, setMarkerVersion] = useState(0);
        const [labelOpacity, setLabelOpacity] = useState(0);
        const [_dataLabelVersion, setDataLabelVersion] = useState(0);
        const [_seriesVersion, setSeriesVersion] = useState(0);
        const [_errorBarVersion, setErrorBarVersion] = useState(0);
        const { layoutRef, reportMeasured, setDisableAnimation, phase, triggerRemeasure
            , animationProgress, setAnimationProgress } = useLayout();
        const animationFrameRef: React.RefObject<number> = useRef<number>(0);
        const previousPathLengthRef: React.RefObject<number[]> = useRef<number[]>([]);
        const previousSeriesOptionsRef: React.RefObject<RenderOptions[][]> = useRef<RenderOptions[][]>([]);
        const isInitialRenderRef: React.RefObject<boolean[]> = useRef<boolean[]>([]);
        const isFirstRenderRef: React.RefObject<boolean> = useRef<boolean>(true);
        const renderedPathDRef: React.RefObject<string[]> = useRef<string[]>([]);
        const internalDataUpdateRef: React.RefObject<boolean> = useRef<boolean>(false);
        const previousDataSourcesRef: React.RefObject<Object[]> = useRef<Object[]>([]);

        if (phase !== 'measuring') {
            previousDataSourcesRef.current = (layoutRef.current.chart as Chart).visibleSeries?.
                map((s: SeriesProperties) => s.dataSource) as Object[];
        }
        /**
         * Analyzes changes in a series data source and applies appropriate animations.
         *
         * @param {DataPoint[]} newDataSource - The updated data source to analyze.
         * @param {number} index - The index of the series in the chart.
         * @returns {void}
         */
        const observeDataSourceChange: (newDataSource: DataPoint[], index: number) => void =
        (newDataSource: DataPoint[], index: number) => {
            const series: SeriesProperties | undefined = (layoutRef.current.chart as Chart)?.visibleSeries?.[index as number];
            const prevDataSource: DataPoint[] = previousDataSourcesRef.current[index as number] as DataPoint[];
            let xValueChanged: boolean = false;
            if (prevDataSource && newDataSource && prevDataSource.length < newDataSource.length) {
                for (let id: number = 0; id < newDataSource.length; id++) {
                    if (prevDataSource && id < prevDataSource.length && prevDataSource[id as number] &&
                        prevDataSource[id as number].x !== newDataSource[id as number].x) {
                        xValueChanged = true;
                        break;
                    }
                }
            }
            if (series?.animation?.enable && !xValueChanged) {
                if (newDataSource.length > prevDataSource.length && (newDataSource.length - prevDataSource.length) === 1) {
                    const addedPoint: DataPoint | undefined = newDataSource.find((np: DataPoint) =>
                        !prevDataSource.some((p: DataPoint) => p.x === np.x && p.y === np.y)
                    );

                    if (addedPoint) {
                        series.skipMarkerAnimation = true;
                        series.isPointAdded = true;
                        addPoint(
                            addedPoint as DataPoint,
                            series.animation.duration || DEFAULT_ANIMATION_DURATION,
                            series,
                            internalDataUpdateRef,
                            setAnimationProgress,
                            animationFrameRef,
                            updateSeries
                        );
                    }
                } else if (newDataSource.length < prevDataSource.length && (prevDataSource.length - newDataSource.length) === 1) {
                    const removedIndex: number = prevDataSource.findIndex((p: DataPoint) =>
                        !newDataSource.some((np: DataPoint) => np.x === p.x && np.y === p.y)
                    );
                    if (removedIndex >= 0) {
                        series.isPointRemoved = true;
                        series.skipMarkerAnimation = true;
                        removePoint(
                            removedIndex,
                            series.animation.duration || DEFAULT_ANIMATION_DURATION,
                            series,
                            internalDataUpdateRef,
                            setAnimationProgress,
                            animationFrameRef,
                            updateSeries
                        );
                        if (previousSeriesOptionsRef &&
                            previousSeriesOptionsRef.current &&
                            previousSeriesOptionsRef.current[series.index] &&
                            Array.isArray(previousSeriesOptionsRef.current[series.index])) {
                            previousSeriesOptionsRef.current[series.index].splice(removedIndex, 1);
                        }
                    }
                } else {
                    let hasUpdate: boolean = false;
                    const updatedData: Object[] = Array.isArray(prevDataSource)
                        ? prevDataSource.map((prevPoint: DataPoint, idx: number) => {
                            const newPoint: DataPoint = newDataSource[idx as number];
                            if (series.type === 'Candle' || series.type === 'Hilo' || series.type === 'HiloOpenClose') {
                                // For candles, check if close value changed (not y value)
                                if (prevPoint.x === newPoint.x &&
                                    prevPoint?.close !== newPoint.close) {
                                    hasUpdate = true;
                                    return newPoint;
                                }
                            } else if (series.type === 'RangeArea' || series.type === 'RangeColumn') {
                                if (prevPoint.x === newPoint.x &&
                                    (prevPoint?.high !== newPoint.high ||
                                        prevPoint?.low !== newPoint.low)) {
                                    hasUpdate = true;
                                    return newPoint;
                                }
                            } else {
                                // Standard series logic
                                if (prevPoint.x === newPoint.x && prevPoint.y !== newPoint.y) {
                                    hasUpdate = true;
                                    return newPoint;
                                }
                            }
                            return prevPoint;
                        })
                        : [];

                    if (hasUpdate) {
                        series.skipMarkerAnimation = true;
                        series.pointUpdated = true;
                        setData(
                            updatedData,
                            series.animation.duration || DEFAULT_ANIMATION_DURATION,
                            series,
                            internalDataUpdateRef,
                            setAnimationProgress,
                            animationFrameRef,
                            updateSeries
                        );
                    }
                }
            }
            previousDataSourcesRef.current[index as number] = [newDataSource];
        };

        const seriesList: ChartSeriesProps[] = Object.values(props);
        type SeriesLike = SeriesProperties | null | undefined | object;

        function isSeriesProperties(item: SeriesLike): item is SeriesProperties {
            return (
                typeof item === 'object' &&
                item !== null &&
                'visible' in item &&
                'fill' in item &&
                'name' in item
            );
        }
        /**
         * Effect that monitors changes to series data sources and triggers appropriate animations.
         * Detects point additions, removals, and updates to animate them smoothly.
         */
        useEffect(() => {
            if (phase !== 'measuring') {
                seriesList.forEach((seriesConfig: ChartSeriesProps, index: number) => {
                    if (Array.isArray(seriesConfig.dataSource) && seriesConfig.dataSource.length > 0) {
                        const newDataSource: DataPoint[] = seriesConfig.dataSource as DataPoint[];
                        const prevDataSource: Object[] = previousDataSourcesRef.current[index as number] as Object[];
                        void (!areDataSourcesEqual(prevDataSource, newDataSource) && observeDataSourceChange(newDataSource, index));
                        previousDataSourcesRef.current[index as number] = newDataSource;
                    }
                });
            }
        }, [useStableDataSources(seriesList)]);
        const visibleSeries: ChartSeriesProps | undefined = seriesList.find(
            (series: ChartSeriesProps) => series.visible
        );
        const isDataLabelEnabled: boolean = !!visibleSeries?.marker?.dataLabel?.visible;
        const isAnimationEnabled: boolean = !!visibleSeries?.animation?.enable;
        const durations: number = visibleSeries?.animation?.duration || 1000;
        const firstAnimationCompletedRef: React.RefObject<boolean> = useRef(false);

        useEffect(() => {
            if (
                isDataLabelEnabled &&
                isAnimationEnabled &&
                animationProgress === 1 &&
                !firstAnimationCompletedRef.current
            ) {
                firstAnimationCompletedRef.current = true;
                const dataLabelAnimationDuration: number = durations * 0.2;
                let raf: number;
                let start: number | null = null;
                /**
                 * Animates the opacity of data labels from 0 to 1 over time.
                 *
                 * @param {number} timestamp - The current animation timestamp
                 * @returns {void}
                 */
                const animateOpacity: (timestamp: number) => void = (timestamp: number) => {
                    if (!start) {start = timestamp; }
                    const elapsed: number = timestamp - start;
                    const eased: number = Math.min(elapsed / (dataLabelAnimationDuration), 1);
                    setLabelOpacity(eased);
                    if (eased < 1) {
                        raf = requestAnimationFrame(animateOpacity);
                    }
                };
                raf = requestAnimationFrame(animateOpacity);
                return () => cancelAnimationFrame(raf);
            }
            if (!isDataLabelEnabled || !isAnimationEnabled) {
                setLabelOpacity(isAnimationEnabled ? 0 : 1);
            }
            return undefined;
        }, [isDataLabelEnabled, animationProgress, isAnimationEnabled, durations]);

        useEffect(() => {
            if (phase === 'measuring' || !layoutRef.current?.chart) {
                return;
            }
            const visibleSeries: SeriesProperties[] = (layoutRef.current.chart as Chart).visibleSeries;
            const hasErrorBarChanges: boolean = visibleSeries.some((series: SeriesProperties) => {
                const nextErrorBar: ChartErrorBarProps = (seriesList[series.index] as SeriesProperties)?.errorBar;
                return !isEqual(series.errorBar, nextErrorBar);
            });
            if (!hasErrorBarChanges) {
                return;
            }
            visibleSeries.forEach((series: SeriesProperties) => {
                if ((seriesList[series.index] as SeriesProperties)?.errorBar) {
                    let changeStyleProps: boolean = false;
                    const updatedErrorBar: ChartErrorBarProps = (seriesList[series.index] as SeriesProperties)?.errorBar;
                    const currentErrorBar: ChartErrorBarProps = series.errorBar;
                    if (
                        updatedErrorBar?.errorBarCap?.color !== currentErrorBar?.errorBarCap?.color ||
                        updatedErrorBar?.errorBarCap?.width !== currentErrorBar?.errorBarCap?.width ||
                        updatedErrorBar?.errorBarCap?.opacity !== currentErrorBar?.errorBarCap?.opacity ||
                        updatedErrorBar?.color !== currentErrorBar?.color ||
                        updatedErrorBar?.width !== currentErrorBar?.width
                    ) {
                        changeStyleProps = true;
                    }
                    series.errorBar = (seriesList[series.index] as SeriesProperties)?.errorBar;
                    renderErrorBarsJSX(series, changeStyleProps);
                }
            });
            setErrorBarVersion((prev: number) => prev + 1);
        }, [seriesList]);

        /**
         * Effect that detects and responds to changes in marker properties.
         * Updates marker rendering when properties like fill, shape, size, etc. change.
         */
        useEffect(() => {
            if (phase !== 'measuring') {
                const hasMarkerChanges: boolean | undefined =
                    (layoutRef.current.chart as Chart)?.visibleSeries?.some((series: SeriesProperties, index: number) => {
                        const currentSeries: ChartSeriesProps = seriesList[index as number];

                        const currentMarker: ChartMarkerProps = currentSeries?.marker as ChartMarkerProps;
                        const previousMarker: ChartMarkerProps = series.marker as ChartMarkerProps;

                        return (
                            currentMarker?.fill !== previousMarker?.fill ||
                            currentMarker?.shape !== previousMarker?.shape ||
                            currentMarker?.width !== previousMarker?.width ||
                            currentMarker?.height !== previousMarker?.height ||
                            currentMarker?.visible !== previousMarker?.visible ||
                            currentMarker?.opacity !== previousMarker?.opacity ||
                            !isEqual(currentMarker?.border, previousMarker?.border)
                        );
                    });

                if (hasMarkerChanges) {
                    // Reset marker options
                    const chartId: string = (layoutRef.current.chart as Chart)?.element.id;
                    markersOptionsByChartId[chartId as string] = [];
                    (chart as Chart).markerOptions = [];

                    (layoutRef.current.chart as Chart)?.visibleSeries?.forEach((series: SeriesProperties, index: number) => {
                        series.marker = {
                            ...series.marker,
                            ...seriesList[index as number]?.marker
                        };

                        void (series.visible && (
                            ((marker: Object) => {
                                void (marker && (
                                    (markersOptionsByChartId[chartId as string] ??= []),
                                    markersOptionsByChartId[chartId as string].push(marker as ChartMarkerProps)
                                ));
                            })(MarkerRenderer.render(series))
                        ));
                    });
                    setMarkerVersion((prev: number) => prev + 1);
                }
            }
        }, [
            useStableMarkerProps(Object.values(props))
        ]);
        /**
         * Effect that handles updates to data label configurations.
         * Manages data label rendering and appearance based on series configuration.
         */
        useEffect(() => {
            if (phase !== 'measuring') {
                if (layoutRef.current.chart as Chart) {
                    (layoutRef.current.chart as Chart).dataLabelCollections = [];
                    (chart as Chart).dataLabelOptions = [];
                    const chartId: string = (layoutRef.current.chart as Chart)?.element.id;
                    dataLabelOptionsByChartId[chartId as string] = [];

                    (layoutRef.current.chart as Chart)?.visibleSeries?.forEach((series: SeriesProperties, index: number) => {
                        if (!series.visible || (!series.marker?.visible && !series.marker?.dataLabel?.visible)) {
                            return;
                        }
                        // Merge updated dataLabel for each series (if applicable)
                        series.marker = {
                            ...series.marker,
                            dataLabel: {
                                ...series.marker?.dataLabel as ChartDataLabelProps,
                                ...seriesList[index as number]?.marker?.dataLabel
                            }
                        };
                        void (series.visible && (
                            ((dataLabel: DataLabelRendererResult[]) => {
                                void (dataLabel && (
                                    (dataLabelOptionsByChartId[chartId as string] ??= []),
                                    dataLabelOptionsByChartId[chartId as string].push(dataLabel),
                                    ((chart as Chart & ChartExtensions as ChartExtensions).dataLabelOptions =
                                        [...((chart as Chart & ChartExtensions as ChartExtensions).dataLabelOptions), dataLabel])
                                ));
                            })(DataLabelRenderer.render(
                                series,
                                series.marker?.dataLabel as ChartDataLabelProps
                            ) as DataLabelRendererResult[])
                        ));
                    });
                }
                setDataLabelVersion((prev: number) => prev + 1);
            }
        }, [
        // This dependency array ensures the effect watches ALL essential style changes in dataLabelOptions
            useStableDataLabelProps(Object.values(props)),
            animationProgress
        ]);

        const seriesDelayTimeoutRef: React.RefObject<{
            [key: number]: number;
        }> = useRef<{ [key: number]: number }>({});
        useEffect(() => {
            return () => {
                // Clear all delay timers on unmount
                Object.values(seriesDelayTimeoutRef.current).forEach((timerId: number) => clearTimeout(timerId));
                seriesDelayTimeoutRef.current = {};
            };
        }, []);

        /**
         * Renders a given series based on its axis type and available points, including animations if enabled.
         *
         * @param {SeriesProperties} series - The series to render.
         * @returns {void} This function does not return a value.
         */
        const renderSeries: (series: SeriesProperties) => void = (series: SeriesProperties): void => {
            const chartId: string = series.chart.element.id;
            let seriesType: string = firstToLowerCase(series.type as string);
            seriesType = seriesType.replace('100', '');
            let options: RenderOptions[] = [];
            let marker: ChartMarkerProps | null = null;
            series.skipMarkerAnimation = false;
            void (series.marker && (
                ((result: RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps }) => {
                    options = 'options' in result ? result.options as RenderOptions[] : result;
                    marker = 'marker' in result ? result.marker as ChartMarkerProps : null;
                })(seriesModules[seriesType + 'SeriesModule' as keyof typeof seriesModules].render(series, series.chart.requireInvertedAxis))
            ));
            series.visiblePoints = useVisiblePoints(series);
            let labelOptions: DataLabelRendererResult[] | undefined;

            // Always check for and render dataLabels if they should be visible
            const hasDataLabel: boolean = series.marker?.dataLabel?.visible === true;
            if (hasDataLabel && series.marker?.dataLabel) {
                labelOptions = DataLabelRenderer.render(series, series.marker.dataLabel) as
                 DataLabelRendererResult[];

                // Always ensure data labels are stored in the chart options
                // This is crucial to prevent them from disappearing on resize
                if (labelOptions && labelOptions.length > 0) {
                // Store data label options directly in chart
                    dataLabelOptionsByChartId[chartId as string] = dataLabelOptionsByChartId[chartId as string] ?? [];

                    // Find and replace existing data labels for this series
                    const seriesIndex: number = series.index as number;
                    const existingIndex: number = dataLabelOptionsByChartId[chartId as string].
                        findIndex((_: DataLabelRendererResult[], i: number) => i === seriesIndex);

                    if (existingIndex !== -1) {
                        dataLabelOptionsByChartId[chartId as string][existingIndex as number] = labelOptions;
                    } else {
                        while (dataLabelOptionsByChartId[chartId as string].length < seriesIndex) {
                            dataLabelOptionsByChartId[chartId as string].push([]);
                        }
                        dataLabelOptionsByChartId[chartId as string][seriesIndex as number] = labelOptions;
                    }
                    (chart as Chart & ChartExtensions as { dataLabelOptions: DataLabelRendererResult[][] }).dataLabelOptions =
                    dataLabelOptionsByChartId[chartId as string];
                }
            }

            if (series.animation?.enable && (layoutRef.current.chart as Chart).animateSeries) {
                const seriesDelay: number = Number(series.animation?.delay) || 0;
                /**
                 * Starts the animation for a series from the specified start time.
                 *
                 * @param {DOMHighResTimeStamp} startTime - The timestamp when the animation starts
                 * @returns {void}
                 */
                const startAnimation: (startTime: DOMHighResTimeStamp) => void = (startTime: DOMHighResTimeStamp) => {
                    seriesOptionsByChartId[chartId as string] = seriesOptionsByChartId[chartId as string] ?? [];
                    const hasSeries: boolean = options?.length > 0 &&
                    seriesOptionsByChartId[chartId as string].some((seriesOption: RenderOptions[]) =>
                        seriesOption?.[0]?.id === options?.[0]?.id);
                    if (!hasSeries) {
                        seriesOptionsByChartId[chartId as string].push(options);
                        (chart as Chart & ChartExtensions as ChartExtensions).seriesOptions = seriesOptionsByChartId[chartId as string];
                    }

                    if (marker) {
                        markersOptionsByChartId[chartId as string] = markersOptionsByChartId[chartId as string] ?? [];
                        const firstMarkerOption: MarkerOptions = (marker as MarkerProperties)?.markerOptionsList?.[0] as MarkerOptions;
                        const markerId: string = firstMarkerOption?.id;
                        const hasMarker: boolean = !isNullOrUndefined(markerId) &&
                        markersOptionsByChartId[chartId as string].some((chartMarker: ChartMarkerProps) =>
                            (chartMarker as MarkerProperties)?.markerOptionsList?.[0]?.id === markerId);
                        if (!hasMarker) {
                            markersOptionsByChartId[chartId as string].push(marker);
                            (chart as Chart).markerOptions = markersOptionsByChartId[chartId as string];
                        }
                    }
                    animatePath(startTime, series.animation?.duration as number, setAnimationProgress, animationFrameRef, startTime);
                };

                if (seriesDelay > 0) {
                    seriesDelayTimeoutRef.current[series.index as number] = + setTimeout(() => {
                        requestAnimationFrame(startAnimation);
                        delete seriesDelayTimeoutRef.current[series.index as number];
                    }, seriesDelay);
                } else {
                    requestAnimationFrame(startAnimation);
                }
            } else {
            // Store series options directly in chart
                seriesOptionsByChartId[chartId as string] = seriesOptionsByChartId[chartId as string] ?? [];
                seriesOptionsByChartId[chartId as string].push(options);
                (chart as Chart & ChartExtensions as ChartExtensions).seriesOptions = seriesOptionsByChartId[chartId as string];

                if (marker) {
                // Store marker options directly in chart
                    markersOptionsByChartId[chartId as string] = markersOptionsByChartId[chartId as string] ?? [];
                    markersOptionsByChartId[chartId as string].push(marker);
                    (chart as Chart).markerOptions = markersOptionsByChartId[chartId as string];
                }
            }
        };

        const triggerLegendShapeRender: (chartId?: string) => void = useRegisterLegendShapeRender();
        /**
         * Effect that updates legend shapes when series properties change.
         * Ensures legend items correctly reflect the visual appearance of series.
         */
        useEffect(() => {
            if (phase !== 'measuring' && layoutRef.current.chart) {
                (layoutRef.current.chart as Chart).visibleSeries?.forEach((series: SeriesProperties, index: number) => {
                    series.legendShape = seriesList[index as number]?.legendShape || series.legendShape;
                });
                triggerLegendShapeRender((layoutRef.current.chart as Chart).element.id);
            }
        }, [JSON.stringify(seriesList.map((s: ChartSeriesProps) => s.legendShape)), phase]);
        /**
         * Effect that runs during the measuring phase to initialize series rendering.
         * Resets chart options and prepares series for rendering.
         */
        useLayoutEffect(() => {
            if (phase === 'measuring') {
            // Reset options when measuring
                const chartId: string = (layoutRef.current.chart as Chart).element.id;

                seriesOptionsByChartId[chartId as string] = [];
                markersOptionsByChartId[chartId as string] = [];

                // Don't reset data label options - this causes them to disappear on resize
                if (!dataLabelOptionsByChartId[chartId as string]) {
                    dataLabelOptionsByChartId[chartId as string] = [];
                }

                (chart as Chart).seriesOptions = [];
                (chart as Chart).markerOptions = [];
                // Don't reset global data labels either
                if (!(chart as Chart).dataLabelOptions || (chart as Chart).dataLabelOptions?.length === 0) {
                    (chart as Chart).dataLabelOptions = [];
                }

                isInitialRenderRef.current = (layoutRef.current.chart as Chart).visibleSeries?.map(() => true) as boolean[];
                previousPathLengthRef.current = (layoutRef.current.chart as Chart).visibleSeries?.map(() => 0) as number[];
                if (isFirstRenderRef.current) {
                    previousSeriesOptionsRef.current = (layoutRef.current.chart as Chart).visibleSeries?.map(() => []) as RenderOptions[][];
                    isFirstRenderRef.current = true;
                } else {
                    isFirstRenderRef.current = false;
                }

                (layoutRef.current.chart as Chart).visibleSeries?.map((series: SeriesProperties) => {
                    if (series.visible) {
                        series.chart = layoutRef.current.chart as Chart;
                        findClipRect(series);
                        renderSeries(series);
                    }
                });
                reportMeasured('ChartSeries');
            }
        }, [phase, layoutRef]);

        /**
         * Extracts and processes essential properties from each series in the props.
         * This creates a lightweight representation of series data for change detection.
         *
         * @returns {Array<Object>} Array of processed series data objects
         */
        const processedSeriesData: {
            fill: string | undefined | null;
            name: string | undefined;
            width: number | undefined;
            dashArray: string | undefined;
            opacity: number | undefined;
            splineType: string | undefined;
            type: string | undefined;
            emptyPointSettings: {
                mode?: string,
            },
            columnSpacing: number | undefined;
            columnWidth: number | undefined;
            columnWidthInPixel: number | undefined;
        }[] = useMemo(() => {
            return Object.keys(props)
                .filter((key: string) => !isNaN(Number(key)))
                .map((key: string): SeriesLike => props[(Number(key))])
                .filter(isSeriesProperties)
                .map((series: SeriesProperties) => ({
                    fill: series.fill,
                    name: series.name,
                    width: series.width,
                    dashArray: series.dashArray,
                    opacity: series.opacity,
                    splineType: series.splineType,
                    type: series.type,
                    step: series.step,
                    emptyPointSettings: {
                        mode: series.emptyPointSettings?.mode
                    },
                    columnSpacing: series.columnSpacing,
                    columnWidth: series.columnWidth,
                    columnWidthInPixel: series.columnWidthInPixel
                }));
        }, [props]);

        const serializedSeriesData: string = useMemo(() => {
            return JSON.stringify(processedSeriesData);
        }, [processedSeriesData]);

        /**
         * Effect that responds to changes in series data to update rendering.
         * Handles series visibility, property updates, and re-rendering.
         */
        useEffect(() => {
            if (phase !== 'measuring' && layoutRef.current.chart) {
                let reRender: boolean = false;
                const chartId: string = (layoutRef.current.chart as Chart).element.id;
                seriesOptionsByChartId[chartId as string] = [];
                markersOptionsByChartId[chartId as string] = [];
                dataLabelOptionsByChartId[chartId as string] = [];
                (layoutRef.current.chart as Chart).dataLabelCollections = [];
                (chart as Chart).seriesOptions = [];
                (chart as Chart).markerOptions = [];
                (chart as Chart).dataLabelOptions = [];

                (layoutRef.current.chart as Chart).visibleSeries?.forEach((visibleSeries: SeriesProperties) => {
                    const matchingSeries: ChartSeriesProps | SeriesProperties = seriesList[visibleSeries.index];
                    if (matchingSeries) {
                        const newType: ChartSeriesType | undefined = matchingSeries.type || visibleSeries.type;
                        matchingSeries.visible = visibleSeries.visible;
                        if (visibleSeries.type !== newType) {
                            reRender = true;
                        }
                        visibleSeries.type = newType;
                    }
                });

                if ((layoutRef.current.chart as Chart).visibleSeries?.length !== processedSeriesData.length || reRender) {
                    triggerRemeasure();
                    setDisableAnimation?.(false);
                    internalDataUpdateRef.current = true;
                } else {
                    (layoutRef.current.chart as Chart).visibleSeries?.forEach((series: SeriesProperties) => {
                        series.propsChange = true;
                    });
                    (layoutRef.current.chart as Chart).animateSeries = false;
                    (layoutRef.current.chart as Chart).visibleSeries?.map((visibleSeries: SeriesProperties) => {
                        const matchingSeries: ChartSeriesProps = seriesList[visibleSeries.index];

                        // Update properties directly on visibleSeries
                        visibleSeries.interior = matchingSeries.fill || visibleSeries.interior || '';
                        visibleSeries.width = matchingSeries.width || visibleSeries.width;
                        visibleSeries.dashArray = matchingSeries.dashArray || visibleSeries.dashArray;
                        visibleSeries.name = matchingSeries.name || visibleSeries.name;
                        visibleSeries.visible = matchingSeries.visible !== undefined ? matchingSeries.visible : visibleSeries.visible;
                        visibleSeries.opacity = matchingSeries.opacity || visibleSeries.opacity;
                        visibleSeries.splineType = matchingSeries.splineType || visibleSeries.splineType;
                        visibleSeries.type = matchingSeries.type || visibleSeries.type;
                        visibleSeries.emptyPointSettings = matchingSeries.emptyPointSettings || visibleSeries.emptyPointSettings;
                        visibleSeries.step = matchingSeries.step || visibleSeries.step;
                        visibleSeries.columnWidth = matchingSeries.columnWidth || visibleSeries.columnWidth;
                        visibleSeries.columnSpacing = matchingSeries.columnSpacing || visibleSeries.columnSpacing;
                        visibleSeries.columnWidthInPixel = matchingSeries.columnWidthInPixel || visibleSeries.columnWidthInPixel;
                        // Render if visible
                        if (visibleSeries.visible) {
                            visibleSeries.chart = layoutRef.current.chart as Chart;
                            findClipRect(visibleSeries);
                            visibleSeries.currentViewData = visibleSeries.dataSource || [];
                            processJsonData(visibleSeries);
                            renderSeries(visibleSeries);
                        }

                        return visibleSeries;
                    });
                }
                setSeriesVersion((prev: number) => prev + 1);
            }
        }, [serializedSeriesData]);

        useEffect(() => {
            if (internalDataUpdateRef.current) {
                internalDataUpdateRef.current = false;
                return;
            }
            if (phase !== 'measuring') {
                const chartId: string = (layoutRef.current.chart as Chart)?.element.id;
                seriesOptionsByChartId[chartId as string] = [];
                (chart as Chart).seriesOptions = [];
                triggerRemeasure();
                setDisableAnimation?.(true);
            }

        }, [
            JSON.stringify(
                seriesList.map((series: ChartSeriesProps) => ({
                    dataSource: series?.dataSource
                }))
            )
        ]);

        // Use the correct type annotation for the version info objects
        const legendClickedInfo: { version: number; id: string } = useSeriesRenderVersion();
        const axesChanged: { version: number; id: string } = useAxesRendereVersion();

        useEffect(() => {
            if (phase !== 'measuring' && ((legendClickedInfo && legendClickedInfo.id === (layoutRef.current.chart as Chart)?.element.id) ||
            (axesChanged && axesChanged.id === (layoutRef.current.chart as Chart)?.element.id))) {
                const chartId: string = (layoutRef.current.chart as Chart).element.id;
                seriesOptionsByChartId[chartId as string] = [];
                markersOptionsByChartId[chartId as string] = [];
                dataLabelOptionsByChartId[chartId as string] = [];
                internalDataUpdateRef.current = true;
                (layoutRef.current.chart as Chart).dataLabelCollections = [];

                (layoutRef.current.chart as Chart).visibleSeries?.map((series: SeriesProperties) => {

                    const startTimestamp: number = performance.now();
                    if (series.visible) {
                        series.position = undefined;
                    }
                    if (series.chart && series.chart.isGestureZooming) {
                        updateSeries(true, true, series, false);
                        if (series.visible) {
                            if (series.marker?.dataLabel?.visible) {
                                const dataLabel: DataLabelRendererResult[] = DataLabelRenderer.
                                    render(series, series.marker?.dataLabel as
                                        ChartDataLabelProps) as DataLabelRendererResult[];
                                if (dataLabel) {
                                    if (!dataLabelOptionsByChartId[chartId as string]) {
                                        dataLabelOptionsByChartId[chartId as string] = [];
                                    }
                                    dataLabelOptionsByChartId[chartId as string].push(dataLabel);
                                }
                            }
                        }
                        if ((layoutRef.current.chart as Chart).visibleSeries
                            && series.index === (layoutRef.current.chart as Chart).visibleSeries.length - 1) {
                            (layoutRef.current.chart as Chart).zoomRedraw = false;
                        }
                        series.chart.isGestureZooming = false;
                        setSeriesVersion((prev: number) => prev + 1);
                    }
                    else {
                        requestAnimationFrame(() => {
                            updateSeries(true, true, series, true);
                            if (series.visible) {
                                if (legendClickedInfo?.version !== 0) {
                                    series.isLegendClicked = true;
                                }
                                if (series.marker?.dataLabel?.visible) {
                                    const dataLabel: DataLabelRendererResult[] = DataLabelRenderer.
                                        render(series, series.marker?.dataLabel as
                                            ChartDataLabelProps) as DataLabelRendererResult[];
                                    if (dataLabel) {
                                        // Store data label options
                                        if (!dataLabelOptionsByChartId[chartId as string]) {
                                            dataLabelOptionsByChartId[chartId as string] = [];
                                        }
                                        dataLabelOptionsByChartId[chartId as string].push(dataLabel);
                                    }
                                }
                            }
                            animatePath(startTimestamp, (series && series.type
                                && series.type?.indexOf('Stacking') > -1) ? DEFAULT_ANIMATION_DURATION
                                : LEGEND_ANIMATION_DURATION, setAnimationProgress, animationFrameRef, startTimestamp);
                            if ((layoutRef.current.chart as Chart).visibleSeries
                                && series.index === (layoutRef.current.chart as Chart).visibleSeries.length - 1) {
                                (layoutRef.current.chart as Chart).zoomRedraw = false;
                            }
                        });
                    }
                });
            }
        }, [legendClickedInfo?.version, axesChanged]);

        if (phase === 'measuring') {
            return null;
        }

        // Get the current chart ID
        const currentChartId: string = (layoutRef.current.chart as Chart).element.id;
        // Get the series options for the current chart - prioritize the per-chartId collections
        const currentChartSeriesOptions: RenderOptions[][] = seriesOptionsByChartId[currentChartId as string];

        return (
            <g id={`${(layoutRef.current.chart as Chart).element.id}_SeriesCollection`} ref={ref}>
                {currentChartSeriesOptions.length > 0 && currentChartSeriesOptions.map(
                    (_options: RenderOptions[], index: number) => {
                        const pathOptions: RenderOptions[] = currentChartSeriesOptions[index as number];
                        if (pathOptions !== undefined) {
                            const seriesOption: RenderOptions | MarkerOptions | null | undefined =
                                pathOptions?.[0]
                                    ? pathOptions[0]
                                    : (markersOptionsByChartId[currentChartId as string]
                                        ? (markersOptionsByChartId[currentChartId as string][index as number] as MarkerProperties)
                                            ?.markerOptionsList?.[0]
                                        : null);
                            const seriesId: string = seriesOption?.id ?? '';
                            const part: string = seriesId.split('_Series_')[1]?.split('_')[0];
                            const parsed: number = part ? parseInt(part, 10) : NaN;
                            const seriesIndex: number = Number.isFinite(parsed) ? parsed : (index as number);
                            if (!Array.isArray(pathOptions) || !(layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number]) {
                                return null;
                            }
                            const visibleSeries: ChartSeriesProps[] | undefined = (layoutRef.current?.chart as Chart)?.visibleSeries;
                            const animationState: {
                                previousPathLengthRef: React.RefObject<number[]>;
                                isInitialRenderRef: React.RefObject<boolean[]>;
                                renderedPathDRef: React.RefObject<string[]>;
                                animationProgress: number;
                                isFirstRenderRef: React.RefObject<boolean>;
                                previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
                            } = {
                                previousPathLengthRef,
                                isInitialRenderRef,
                                renderedPathDRef,
                                animationProgress,
                                isFirstRenderRef,
                                previousSeriesOptionsRef
                            };
                            const accessibility: SeriesAccessibility =
                            visibleSeries![seriesIndex as number].accessibility as SeriesAccessibility;
                            let tabIndex: number = accessibility?.focusable ? accessibility?.tabIndex as number : -1;
                            tabIndex = accessibility?.focusable ? (index === 0 ? 0 :
                                !checkTabindex(visibleSeries as ChartSeriesProps[], seriesIndex) ?
                                    accessibility?.tabIndex as number : -1) : -1;
                            // Prepare animation state for series rendering
                            return (
                                <React.Fragment key={`series_${seriesIndex}_${index}`}>
                                    <>
                                        <g
                                            key={`${(layoutRef.current.chart as Chart).element.id}SeriesGroup${seriesIndex}`}
                                            id={`${(layoutRef.current.chart as Chart).element.id}SeriesGroup${seriesIndex}`}
                                            transform={`translate(${(layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number].clipRect?.x}, ${(layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number].clipRect?.y})`}
                                            clipPath={`url(#${(layoutRef.current.chart as Chart).element.id}_ChartSeriesClipRect_${seriesIndex})`}
                                            style={{ outline: 'none' }}
                                            role={(layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number].accessibility!.role ? (layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number].accessibility!.role : 'region'}
                                            tabIndex={tabIndex}
                                            aria-label={(layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number].accessibility?.ariaLabel ? (layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number].accessibility?.ariaLabel : ((layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number].name + ',' + (layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number].type + ' series with ' + (layoutRef.current.chart as Chart).visibleSeries![seriesIndex as number].points?.length + ' data points')}
                                            aria-hidden="false"
                                        >
                                            <defs>
                                                <clipPath id={`${(layoutRef.current.chart as Chart).element.id}_ChartSeriesClipRect_${seriesIndex}`}>
                                                    <rect
                                                        id={`${(layoutRef.current.chart as Chart).element.id}ChartSeriesClipRect${seriesIndex}_Rect`}
                                                        fill={'transparent'}
                                                        stroke={'grey'}
                                                        strokeWidth={1}
                                                        opacity={1}
                                                        x={0}
                                                        y={0}
                                                        width={(layoutRef.current.chart as Chart).
                                                            visibleSeries![seriesIndex as number].clipRect!.width}
                                                        height={(layoutRef.current.chart as Chart).
                                                            visibleSeries![seriesIndex as number].clipRect!.height}
                                                    />
                                                </clipPath>
                                            </defs>

                                            {pathOptions.map((pathOption: RenderOptions, pathIndex: number) => {
                                                const currentSeries: SeriesProperties = (layoutRef.current.chart as Chart).
                                                    visibleSeries?.[seriesIndex as number] as SeriesProperties;
                                                let seriesType: string = firstToLowerCase(currentSeries.type as string);
                                                seriesType = seriesType.replace('100', '');
                                                const currentPoint: Points | undefined =
                                                currentSeries?.visiblePoints?.[pathIndex as number];
                                                if (currentPoint !== undefined && currentSeries && seriesType && pathOption) {
                                                    const animationProps: {
                                                        strokeDasharray: string | number;
                                                        strokeDashoffset: number;
                                                        interpolatedD?: string;
                                                        animatedDirection?: string;
                                                        animatedTransform?: string;
                                                        animatedClipPath?: string;
                                                        scatterTransform?: string;
                                                    } = currentSeries.propsChange ? {
                                                        strokeDasharray: 'none',
                                                        strokeDashoffset: 0
                                                    } : seriesModules[seriesType + 'SeriesModule' as keyof typeof seriesModules].doAnimation(
                                                        pathOption,
                                                        seriesIndex,
                                                        animationState,
                                                        visibleSeries?.[seriesIndex as number]?.animation?.enable || false,
                                                        currentSeries,
                                                        currentPoint,
                                                        pathIndex,
                                                        visibleSeries as SeriesProperties[]
                                                    );

                                                    return (
                                                        <path
                                                            key={pathOption.id}
                                                            id={pathOption.id}
                                                            d={currentSeries?.isRectSeries
                                                                ? animationProps.animatedDirection ?
                                                                    animationProps.animatedDirection : pathOption.d
                                                                : animationProps.interpolatedD ?? pathOption.d}
                                                            stroke={pathOption.stroke}
                                                            strokeWidth={!currentSeries.visible &&
                                                                animationProgress === 1 ? 0 : pathOption.strokeWidth}
                                                            fill={pathOption.fill}
                                                            fillOpacity={currentSeries.type === 'Candle' ? pathOption.fillOpacity : pathOption.opacity}
                                                            strokeOpacity={currentSeries.type === 'Candle' ? 1 : pathOption.opacity}
                                                            strokeDasharray={currentSeries?.isRectSeries ? 'none' : animationProps.strokeDasharray}
                                                            strokeDashoffset={currentSeries?.isRectSeries ? 0 :
                                                                animationProps.strokeDashoffset}
                                                            opacity={currentSeries.type === 'Candle' ? '' : pathOption.opacity}
                                                            transform={seriesType === 'Scatter' ? animationProps.scatterTransform : animationProps.animatedTransform}
                                                            style={{ clipPath: animationProps.animatedClipPath, outline: 'none' }}
                                                        />
                                                    );
                                                }
                                                return null;
                                            })}
                                        </g>
                                        {/* Render markers with exact same animation progress as the series */}
                                        {markersOptionsByChartId[currentChartId as string] &&
                                        markersOptionsByChartId[currentChartId as string].length !== 0
                                        && (((layoutRef.current.chart as Chart).visibleSeries as SeriesProperties[])[seriesIndex as number]
                                            ?.isRectSeries && ((layoutRef.current.chart as Chart)
                                            .visibleSeries as SeriesProperties[])[seriesIndex as number]
                                            ?.animation?.enable ? animationProgress === 1 : true) &&
                                    (
                                        <React.Fragment key={`markers_${seriesIndex}`}>{
                                            renderMarkerJSX(
                                                markersOptionsByChartId[currentChartId as string],
                                                seriesIndex,
                                                animationProgress,
                                                ((layoutRef.current.chart as Chart).visibleSeries as
                                                    SeriesProperties[])[seriesIndex as number]?.type,
                                                (layoutRef.current.chart as Chart).element.id,
                                                (((layoutRef.current.chart as Chart).visibleSeries as
                                                SeriesProperties[])[seriesIndex as number]
                                                    ?.propsChange),
                                                ((layoutRef.current.chart as Chart).visibleSeries as
                                                SeriesProperties[])[seriesIndex as number],
                                                // Pass distinct progress for add/remove
                                                ((layoutRef.current.chart as Chart).visibleSeries as
                                                    SeriesProperties[])[seriesIndex as number]?.isPointAdded ? animationProgress : 1,
                                                ((layoutRef.current.chart as Chart).visibleSeries as
                                                SeriesProperties[])[seriesIndex as number]?.isPointRemoved ? animationProgress : 1
                                            )}
                                        </React.Fragment>
                                    )}
                                        {(() => {
                                            const currentSeries: SeriesProperties = (layoutRef.current.chart as Chart)
                                                .visibleSeries?.[seriesIndex as number] as SeriesProperties;
                                            if (currentSeries?.errorBar?.visible && (animationProgress === 1
                                                || currentSeries?.isLegendClicked)) {
                                                return (<React.Fragment key={`errorBars_${seriesIndex}`}>
                                                    {renderErrorBarsJSX(currentSeries)}
                                                </React.Fragment>);
                                            }
                                            return null;
                                        })()}
                                    </>
                                </React.Fragment>
                            );
                        }
                        return null;
                    }
                )}

                {/* Render a single data label collection for all series */}
                {dataLabelOptionsByChartId[currentChartId as string] &&
                dataLabelOptionsByChartId[currentChartId as string].length > 0 && (
                    <g id="containerDataLabelCollection" style={{
                        opacity: legendClickedInfo?.version ||
                                (layoutRef.current.chart as Chart).visibleSeries?.some(
                                    (series: SeriesProperties) => series.skipMarkerAnimation) ? 1 : labelOpacity
                    }}>
                        {/* First render all shape groups */}
                        {(dataLabelOptionsByChartId[currentChartId as string])
                            .map((dataLabel: DataLabelRendererResult[], mapIndex: number) => {

                                // Extract series index from ID dynamically
                                let foundId: string | undefined;
                                for (const lbl of dataLabel) {
                                    if (lbl && lbl.textOption && lbl.textOption.renderOptions && lbl.textOption.renderOptions.id) {
                                        foundId = lbl.textOption.renderOptions.id;
                                        break;
                                    }
                                }

                                let actualSeriesIndex: number = mapIndex;
                                if (foundId) {
                                    const match: RegExpMatchArray = foundId.match(/_Series_(\d+)_/) as RegExpMatchArray;
                                    if (match) {actualSeriesIndex = parseInt(match[1], 10); }
                                }

                                if (!dataLabel ||
                                    dataLabel.length === 0 ||
                                    !(layoutRef.current?.chart as Chart)?.visibleSeries?.[actualSeriesIndex as number] ||
                                    !(layoutRef.current?.chart as Chart)?.visibleSeries?.[actualSeriesIndex as number]?.
                                        marker?.dataLabel?.visible || (dataLabel[0] && dataLabel[0].template)) {
                                    return null;
                                }

                                return (
                                    <React.Fragment key={`shapeGroup_${actualSeriesIndex}`}>
                                        {renderDataLabelShapesJSX(dataLabel, actualSeriesIndex, layoutRef, animationProgress)}
                                    </React.Fragment>
                                );
                            })}

                        {(dataLabelOptionsByChartId[currentChartId as string])
                            .map((dataLabel: DataLabelRendererResult[], seriesIndex: number) => {
                                let id: string | undefined;
                                let actualSeriesIndex: number = seriesIndex;
                                for (const lbl of dataLabel) {
                                    if (lbl && lbl.textOption && lbl.textOption.renderOptions && lbl.textOption.renderOptions.id) {
                                        id = lbl.textOption.renderOptions.id;
                                        break;
                                    }
                                }

                                if (id) {
                                    const match: RegExpMatchArray = id.match(/_Series_(\d+)_/) as RegExpMatchArray;
                                    if (match) {actualSeriesIndex = parseInt(match[1], 10); }
                                }
                                if (!dataLabel ||
                                        dataLabel.length === 0 ||
                                        !(layoutRef.current?.chart as Chart)?.visibleSeries?.[actualSeriesIndex as number] ||
                                        !(layoutRef.current?.chart as Chart)?.visibleSeries?.
                                            [actualSeriesIndex as number]?.marker?.dataLabel?.visible ||
                                            (dataLabel[0] && dataLabel[0].template)) {
                                    return null;
                                }

                                return (
                                    <React.Fragment key={`textGroup_${actualSeriesIndex}`}>
                                        {renderDataLabelTextJSX(dataLabel, actualSeriesIndex, layoutRef, animationProgress)}
                                    </React.Fragment>
                                );
                            })}

                    </g>
                )}

            </g>
        );
    });



