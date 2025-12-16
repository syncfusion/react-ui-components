import * as React from 'react';
import { ChartCrosshairTooltipProps, ChartAxisProps, MajorGridLines, MajorTickLines, MinorGridLines, MinorTickLines } from '../base/interfaces';
import { ChartContext } from '../layout/ChartProvider';
import { useContext, useEffect, useMemo } from 'react';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartMajorGridLines } from './MajorGridLines';
import { ChartMinorGridLines } from './MinorGridLines';
import { ChartMajorTickLines } from './MajorTickLines';
import { ChartMinorTickLines } from './MinorTickLines';
import { ChartAxisLabelProps, ChartAxisTitleProps } from './base';
import { ChartAxisLabel } from './LabelStyle';
import { ChartAxisTitle } from './TitleStyle';
import { AxisModel, ChartProviderChildProps } from '../chart-area/chart-interfaces';
import { ChartStripLines } from './StripLines';
import { processChildElement, processStripLines } from './PrimaryXAxis';
import { ChartStripLineProps } from '../base/interfaces';
import { extend, isNullOrUndefined } from '@syncfusion/react-base';
import { ChartCrosshairTooltip } from './CrosshairTooltip';

/**
 * Primary Y-Axis component for the chart.
 * Renders the vertical axis with customizable properties like labels, grid lines, tick marks, and strip lines.
 * A non-rendering component that configures the chart's primary Y-axis.
 *
 * @param {ChartAxisProps} props - The properties for configuring the Y-axis
 * @returns {null} This component doesn't render any visible elements
 */
export const ChartPrimaryYAxis: React.FC<ChartAxisProps> = (props: ChartAxisProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);
    const childArray: React.ReactNode[] = React.Children.toArray(props.children);
    const childrenPropsSignature: string = childArray
        .map((child: React.ReactNode) => processChildElement(child, ChartStripLines))
        .join('|'); // simple delimiter for the string array

    const serializedProps: string = useMemo(() => {
        const { children, ...rest } = props;
        return JSON.stringify(rest);
    }, [props]);

    useEffect(() => {
        const axisProps: Partial<AxisModel> = { ...defaultChartConfigs.PrimaryYAxis, ...props };
        let majorGridLines: MajorGridLines = defaultChartConfigs.MajorGridLines;
        let minorGridLines: MinorGridLines = defaultChartConfigs.MinorGridLines;
        let majorTickLines: MinorTickLines = defaultChartConfigs.MajorTickLines;
        let minorTickLines: MinorTickLines = defaultChartConfigs.MinorTickLines;
        let labelStyle: ChartAxisLabelProps = defaultChartConfigs.LabelStyle;
        let titleStyle: ChartAxisTitleProps = defaultChartConfigs.TitleStyle;
        let axisCrosshairTooltip: ChartCrosshairTooltipProps = defaultChartConfigs.AxisCrosshairTooltip;
        let stripLines: ChartStripLineProps[] = [...defaultChartConfigs.StripLines];

        childArray.forEach((child: React.ReactNode) => {
            if (!React.isValidElement(child)) { return; }
            const childProps: Record<string, MajorGridLines | MajorTickLines> =
                child.props as Record<string, MajorGridLines | MajorTickLines>;

            if (child.type === ChartMajorGridLines) {
                majorGridLines = {
                    ...defaultChartConfigs.MajorGridLines,
                    ...childProps
                };
            } else if (child.type === ChartMinorGridLines) {
                minorGridLines = {
                    ...defaultChartConfigs.MinorGridLines,
                    ...childProps
                };
            } else if (child.type === ChartMajorTickLines) {
                majorTickLines = {
                    ...defaultChartConfigs.MajorTickLines,
                    ...childProps
                };
            } else if (child.type === ChartMinorTickLines) {
                minorTickLines = {
                    ...defaultChartConfigs.MinorTickLines,
                    ...childProps
                };
            } else if (child.type === ChartAxisLabel) {
                labelStyle = {
                    ...defaultChartConfigs.LabelStyle,
                    ...childProps
                };
            } else if (child.type === ChartAxisTitle) {
                titleStyle = {
                    ...defaultChartConfigs.TitleStyle,
                    ...childProps
                };
            } else if (child.type === ChartStripLines) {
                stripLines = processStripLines(child, defaultChartConfigs.StripLines);
            }
            else if (child.type === ChartCrosshairTooltip) {
                axisCrosshairTooltip = {
                    ...defaultChartConfigs.AxisCrosshairTooltip,
                    ...childProps
                };
            }
        });
        axisProps.majorGridLines = extend({}, majorGridLines);
        axisProps.majorGridLines.width = isNullOrUndefined(axisProps.majorGridLines.width) ? 1 : axisProps.majorGridLines.width;
        axisProps.minorGridLines = minorGridLines;
        axisProps.majorTickLines = majorTickLines;
        axisProps.minorTickLines = minorTickLines;
        axisProps.labelStyle = labelStyle;
        axisProps.titleStyle = titleStyle;
        axisProps.stripLines = stripLines;
        axisProps.crosshairTooltip = axisCrosshairTooltip;
        axisProps.crossAt = { ...defaultChartConfigs.PrimaryYAxis.crossAt, ...props.crossAt};
        axisProps.lineStyle = { ...defaultChartConfigs.PrimaryYAxis.lineStyle, ...props.lineStyle };
        context?.setChartPrimaryYAxis(axisProps as AxisModel);
    }, [serializedProps, childrenPropsSignature]);

    return null;
};
