import { createContext, useCallback, useMemo, useState } from 'react';
import * as React from 'react';
import { LayoutProvider } from './LayoutContext';
import { PieChartCenterLabelProps, PieChartTitleProps, PieChartComponentProps, PieChartSeriesProps, PieChartLegendProps, PieChartTooltipProps } from '../base/interfaces';
import { defaultChartConfigs } from '../base/default-properties';
import { ElementWithSize } from '../base/internal-interfaces';

const defaultContextValue: ChartProviderChildProps = {} as ChartProviderChildProps;
export const ChartContext: React.Context<ChartProviderChildProps> = createContext<ChartProviderChildProps>(defaultContextValue);

interface ChartProviderProps {
    chartProps: PieChartComponentProps;
    parentElement: ElementWithSize;
}
export const ChartProvider: React.FC<{
    chartProps: PieChartComponentProps, parentElement: ElementWithSize
}> = ({ chartProps, parentElement }: ChartProviderProps) => {

    const chartRender: boolean = React.Children.count(chartProps.children) > 0;
    const [render, setRender] = useState<boolean>(!chartRender);
    const [chartTitle, setChartTitleState] = React.useState<PieChartTitleProps>(defaultChartConfigs.ChartTitle as PieChartTitleProps);
    const [chartSubTitle, setChartSubTitleState] = useState<PieChartTitleProps>(defaultChartConfigs.ChartSubTitle as PieChartTitleProps);
    const [chartLegend, setChartLegendState] = useState<PieChartLegendProps>(defaultChartConfigs.ChartLegend as PieChartLegendProps);
    const [centerLabel, setChartCenterLabelState] = useState<PieChartCenterLabelProps>(defaultChartConfigs.CenterLabel);
    const [chartSeries, setchartSeriesState] =
        useState<PieChartSeriesProps[]>([defaultChartConfigs.ChartSeries as PieChartSeriesProps]);
    const [chartTooltip, setChartTooltipState] = useState<PieChartTooltipProps>(defaultChartConfigs.ChartTooltip);

    const setChartTitle: (titleProps: PieChartTitleProps) => void = useCallback((titleProps: PieChartTitleProps) => {
        setChartTitleState(titleProps);
        setRender(true);
    }, []);

    const setChartSubTitle: (subtitleProps: PieChartTitleProps) => void = useCallback((subtitleProps: PieChartTitleProps) => {
        setChartSubTitleState(subtitleProps);
        setRender(true);
    }, []);

    const setChartLegend: (legendProps: PieChartLegendProps) => void = useCallback((legendProps: PieChartLegendProps) => {
        setChartLegendState(legendProps);
        setRender(true);
    }, []);

    const setChartTooltip: (tooltip: PieChartTooltipProps) => void = useCallback((tooltip: PieChartTooltipProps) => {
        setChartTooltipState(tooltip);
    }, []);

    const setChartSeries: (series: PieChartSeriesProps[]) => void = useCallback((series: PieChartSeriesProps[]) => {
        setchartSeriesState(series);
        setRender(true);
    }, []);

    const setChartCenterLabel: (centerLaebl: PieChartCenterLabelProps) => void = useCallback((centerLaebl: PieChartCenterLabelProps) => {
        setChartCenterLabelState(centerLaebl);
        setRender(true);
    }, []);

    const contextValue: ChartProviderChildProps = useMemo(() => ({
        parentElement,
        chartProps,
        chartTitle,
        chartSubTitle,
        chartLegend,
        render,
        chartSeries,
        centerLabel,
        chartTooltip,
        setChartTooltip,
        setChartTitle,
        setRender,
        setChartSubTitle,
        setChartLegend,
        setChartSeries,
        setChartCenterLabel
    }), [parentElement, chartProps, chartTitle, chartSeries, chartSubTitle, render, chartLegend, centerLabel, chartTooltip,
        setChartTitle, setChartSubTitle, setRender, setChartSeries, setChartLegend, setChartCenterLabel, setChartTooltip]);

    return (
        <ChartContext.Provider value={contextValue}>
            {chartProps.children}
            <LayoutProvider />
        </ChartContext.Provider>
    );
};

/**
 * Defines the properties passed to child components within the chart provider context.
 * These properties include chart configuration, data, rendering flags, and update methods.
 *
 * @private
 */
export interface ChartProviderChildProps {

    /**
     * General properties for the chart component such as dimensions, theme, and rendering options.
     */
    chartProps: PieChartComponentProps;

    /**
     * Indicates whether the chart should be rendered.
     */
    render: boolean;

    /**
     * Reference to the parent DOM element along with its size information.
     */
    parentElement: ElementWithSize;

    /**
     * Configuration for the chart's main title including text, style, and alignment.
     */
    chartTitle: PieChartTitleProps;

    /**
     * Configuration for the chart's subtitle including text, style, and alignment.
     */
    chartSubTitle: PieChartTitleProps;

    /**
     * Configuration for the chart legend.
     */
    chartLegend: PieChartLegendProps;

    /**
     * Configuration for the chart's main title including text, style, and alignment.
     */
    centerLabel: PieChartCenterLabelProps;

    /**
     * Updates the chart title configuration.
     */
    setChartTitle: (titleProps: PieChartTitleProps) => void;

    /**
     * Updates the chart subtitle configuration.
     */
    setChartSubTitle: (subtitleProps: PieChartTitleProps) => void;

    /**
     * Updates the chart legend configuration.
     */
    setChartLegend: (legendProps: PieChartLegendProps) => void;

    /**
     * Series configuration including type, data mapping, and styling.
     */
    chartSeries: PieChartSeriesProps[];

    /**
     * Updates the chart series configuration.
     */
    setChartSeries: (series: PieChartSeriesProps[]) => void;

    /**
     * Updates the chart center labels configuration.
     */
    setChartCenterLabel: (centerLaebl: PieChartCenterLabelProps) => void;

    /**
     * Tooltip configuration for displaying data point information on hover.
     */
    chartTooltip: PieChartTooltipProps;

    /**
     * Updates the chart tooltip configuration.
     */
    setChartTooltip: (tooltip: PieChartTooltipProps) => void

}
