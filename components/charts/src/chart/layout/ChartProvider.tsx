import { createContext, useCallback, useMemo, useState } from 'react';
import * as React from 'react';
import { LayoutProvider } from './LayoutContext';
import { ChartAreaProps, ChartComponentProps, ChartLegendProps, ChartStackLabelsProps, ChartTitleProps, Column, Row, ChartTooltipProps, ChartSeriesProps, ChartZoomSettingsProps } from '../base/interfaces';
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
    const [chartAxes, setAxes] = useState<AxisModel[]>([]);
    const [chartZoom, setZoom] = useState<ChartZoomSettingsProps>(defaultChartConfigs.ChartZoom);
    const [chartStackLabels, setChartStackLabelsState] = useState<ChartStackLabelsProps>(defaultChartConfigs.ChartStackLabels);
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
        chartTooltip,
        chartStackLabels,
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
        setChartTooltip,
        setChartZoom,
        setChartStackLabels,
        axisCollection: [primaryXAxis as AxisModel, primaryYAxis as AxisModel, ...chartAxes]
    }), [chartProps, chartTitle, chartSubTitle, chartArea, render, chartLegend,
        setChartLegend, parentElement, columns, rows, chartSeries, chartTooltip, chartStackLabels,
        setChartTitle, setChartSubTitle, setChartArea, setChartColumns,
        setChartRows, setChartPrimaryXAxis, setChartPrimaryYAxis, setChartSeries, setChartAxes, setChartTooltip,
        setChartStackLabels, chartZoom, setChartZoom,
        [primaryXAxis as AxisModel, primaryYAxis as AxisModel, ...chartAxes]
    ]);

    return (
        <ChartContext.Provider value={contextValue}>
            {props.children}
            <LayoutProvider />
        </ChartContext.Provider>
    );
};
