import { createContext, useCallback, useMemo, useState } from 'react';
import * as React from 'react';
import { LayoutProvider } from './LayoutContext';
import { ChartAreaProps, ChartComponentProps, ChartLegendProps, ChartStackLabelsProps, ChartTitleProps, Column, Row, ChartTooltipProps, ChartSeriesProps, ChartZoomSettingsProps, ChartCrosshairProps, ChartSelectionProps, ChartHighlightProps, ChartAnnotationProps  } from '../base/interfaces';
import { defaultChartConfigs } from '../base/default-properties';
import { AxisModel, ChartProviderChildProps, ElementWithSize } from '../chart-area/chart-interfaces';

const defaultContextValue: ChartProviderChildProps = {} as ChartProviderChildProps;
export const ChartContext: React.Context<ChartProviderChildProps> = createContext<ChartProviderChildProps>(defaultContextValue);
interface ChartProviderProps {
    props: ChartComponentProps;
    parentElement: ElementWithSize;
}

/**
 * Provides chart configuration and state management context to child components.
 *
 * @component
 * @example
 * ```tsx
 * <ChartProvider props={chartConfig} parentElement={containerElement}>
 *   <ChartTitle />
 *   <ChartSeries />
 * </ChartProvider>
 * ```
 */

export const ChartProvider: React.FC<{
    props: ChartComponentProps, parentElement: ElementWithSize
}> = ({ props, parentElement }: ChartProviderProps) => {

    const chartRender: boolean = React.Children.count(props.children) > 0;
    const [chartTitle, setChartTitleState] = useState<ChartTitleProps>(defaultChartConfigs.ChartTitle as ChartTitleProps);
    const [chartSubTitle, setChartSubTitleState] = useState<ChartTitleProps>(defaultChartConfigs.ChartSubTitle as ChartTitleProps);
    const [chartArea, setChartAreaState] = useState<ChartAreaProps>(defaultChartConfigs.ChartArea);
    const [chartLegend, setChartLegendState] = useState<ChartLegendProps>(defaultChartConfigs.ChartLegend);
    const [render, setRender] = useState<boolean>(!chartRender);
    const [columns, setColumns] = useState<Column[]>([defaultChartConfigs.Column]);
    const [rows, setRows] = useState<Row[]>([defaultChartConfigs.Row]);
    const [primaryXAxis, setPrimaryXAxis] = useState<Partial<AxisModel>>(defaultChartConfigs.PrimaryXAxis);
    const [primaryYAxis, setPrimaryYAxis] = useState<Partial<AxisModel>>(defaultChartConfigs.PrimaryYAxis);
    const [chartTooltip, setChartTooltipState] = useState<ChartTooltipProps>(defaultChartConfigs.ChartTooltip);
    const [chartSeries, setchartSeriesState] = useState<ChartSeriesProps[]>([defaultChartConfigs.ChartSeries]);
    const [chartSelection, setSelection] = useState<ChartSelectionProps>(defaultChartConfigs.ChartSelection);
    const [chartHighlight, setHighlight] = useState<ChartHighlightProps>(defaultChartConfigs.ChartHighlight);
    const [chartAxes, setAxes] = useState<AxisModel[]>([]);
    const [chartZoom, setZoom] = useState<ChartZoomSettingsProps>(defaultChartConfigs.ChartZoom);
    const [chartStackLabels, setChartStackLabelsState] = useState<ChartStackLabelsProps>(defaultChartConfigs.ChartStackLabels);
    const [chartCrosshair, setChartCrosshairState] = useState<ChartCrosshairProps>(defaultChartConfigs.ChartCrosshair);
    const [chartAnnotation, setChartAnnotationState] = useState<ChartAnnotationProps[]>([defaultChartConfigs.ChartAnnotation]);

    const setChartTitle: (titleProps: ChartTitleProps) => void = useCallback((titleProps: ChartTitleProps) => {
        setChartTitleState(titleProps);
        setRender(true);
    }, []);

    const setChartLegend: (legendProps: ChartLegendProps) => void = useCallback((legendProps: ChartLegendProps) => {
        setChartLegendState(legendProps);
        setRender(true);
    }, []);

    const setChartSubTitle: (subtitleProps: ChartTitleProps) => void = useCallback((subtitleProps: ChartTitleProps) => {
        setChartSubTitleState(subtitleProps);
        setRender(true);
    }, []);

    const setChartArea: (areaProps: ChartAreaProps) => void = useCallback((areaProps: ChartAreaProps) => {
        setChartAreaState(areaProps);
        setRender(true);
    }, []);

    const setChartColumns: (columns: Column[]) => void = useCallback((columns: Column[]) => {
        setColumns(columns);
        setRender(true);
    }, []);

    const setChartRows: (rows: Row[]) => void = useCallback((rows: Row[]) => {
        setRows(rows);
        setRender(true);
    }, []);

    const setChartPrimaryXAxis: (xAxis: AxisModel) => void = useCallback((xAxis: AxisModel) => {
        setPrimaryXAxis(xAxis);
        setRender(true);
    }, []);

    const setChartPrimaryYAxis: (yAxis: AxisModel) => void = useCallback((yAxis: AxisModel) => {
        setPrimaryYAxis(yAxis);
        setRender(true);
    }, []);

    const setChartSeries: (series: ChartSeriesProps[]) => void = useCallback((series: ChartSeriesProps[]) => {
        setchartSeriesState(series);
        setRender(true);
    }, []);

    const setChartSelection: (selectionProps: ChartSelectionProps) => void = useCallback((selectionProps: ChartSelectionProps) => {
        setSelection(selectionProps);
        setRender(true);
    }, []);

    const setChartHighlight: (highlightProps: ChartHighlightProps) => void = useCallback((highlightProps: ChartHighlightProps) => {
        setHighlight(highlightProps);
        setRender(true);
    }, []);

    const setChartAxes: (axes: AxisModel[]) => void = useCallback((axes: AxisModel[]) => {
        setAxes(axes);
        setRender(true);
    }, []);

    const setChartZoom: (zoom: ChartZoomSettingsProps) => void = useCallback((zoom: ChartZoomSettingsProps) => {
        setZoom(zoom);
        setRender(true);
    }, []);

    const setChartTooltip: (tooltip: ChartTooltipProps) => void = useCallback((tooltip: ChartTooltipProps) => {
        setChartTooltipState(tooltip);
    }, []);

    const setChartStackLabels: (stackLabels: ChartStackLabelsProps) => void = useCallback((stackLabels: ChartStackLabelsProps) => {
        setChartStackLabelsState(stackLabels);
        setRender(true);
    }, []);

    const setChartCrosshair: (crosshair: ChartCrosshairProps) => void = useCallback((crosshair: ChartCrosshairProps) => {
        setChartCrosshairState(crosshair);
        setRender(true);
    }, []);

    const setChartAnnotation: (annotation: ChartAnnotationProps[]) => void = useCallback((annotation: ChartAnnotationProps[]) => {
        setChartAnnotationState(annotation);
        setRender(true);
    }, []);

    // Only recreate context value when setter functions or properties actually change
    const chartProps: ChartComponentProps = props;
    const contextValue: ChartProviderChildProps = useMemo(() => ({
        chartProps,
        chartTitle,
        chartSubTitle,
        chartArea,
        chartLegend,
        render,
        parentElement,
        columns,
        rows,
        chartSeries,
        chartSelection,
        chartHighlight,
        chartTooltip,
        chartStackLabels,
        chartCrosshair,
        chartAnnotation,
        setChartAnnotation,
        setChartTitle,
        setChartSubTitle,
        setChartArea,
        chartZoom,
        setChartLegend,
        setChartColumns,
        setChartRows,
        setChartPrimaryXAxis,
        setChartPrimaryYAxis,
        setChartSeries,
        setChartAxes,
        setChartSelection,
        setChartHighlight,
        setChartTooltip,
        setChartZoom,
        setChartStackLabels,
        setChartCrosshair,
        axisCollection: [primaryXAxis as AxisModel, primaryYAxis as AxisModel, ...chartAxes]
    }), [chartProps, chartTitle, chartSubTitle, chartArea, render, chartLegend, chartSelection, chartHighlight,
        setChartLegend, parentElement, columns, rows, chartSeries, chartTooltip, chartStackLabels, chartCrosshair,
        setChartTitle, setChartSubTitle, setChartArea, setChartColumns, setChartSelection, setChartHighlight,
        setChartRows, setChartPrimaryXAxis, setChartPrimaryYAxis, setChartSeries, setChartAxes, setChartTooltip,
        chartAnnotation, setChartStackLabels, chartZoom, setChartZoom, setChartCrosshair, setChartAnnotation,
        [primaryXAxis as AxisModel, primaryYAxis as AxisModel, ...chartAxes]
    ]);

    return (
        <ChartContext.Provider value={contextValue}>
            {props.children}
            <LayoutProvider />
        </ChartContext.Provider>
    );
};
