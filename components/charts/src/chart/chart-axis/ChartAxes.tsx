
import { JSX, ReactElement, useContext, useEffect, useMemo } from 'react';
import { ChartAxisProps, MajorGridLines, MajorTickLines, MinorGridLines, MinorTickLines } from '../base/interfaces';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartContext } from '../layout/ChartProvider';
import { ChartAxisLabelProps, ChartAxisTitleProps } from './base';
import { ChartMajorGridLines } from './MajorGridLines';
import { ChartMinorGridLines } from './MinorGridLines';
import { ChartMajorTickLines } from './MajorTickLines';
import { ChartMinorTickLines } from './MinorTickLines';
import { ChartAxisLabel } from './LabelStyle';
import { ChartAxisTitle } from './TitleStyle';
import { AxisModel, ChartProviderChildProps } from '../chart-area/chart-interfaces';
import { ChartStripLines } from './StripLines';
import { processChildElement, processStripLines } from './PrimaryXAxis';
import { ChartStripLineProps } from '../base/interfaces';
import * as React from 'react';
import { extend, isNullOrUndefined } from '@syncfusion/react-base';

/**
 * Interface for ChartAxes props.
 * Represents a container component to group multiple chart axes (category or value).
 */
interface AxesProps {
    /**
     * Child axis components (`ChartAxis`) to be rendered.
     */
    children?: ReactElement<ChartAxisProps>[] | ReactElement<ChartAxisProps>;
}
const axisCollection: AxisModel[] = [];

/**
 * `ChartAxes` is a non-rendering wrapper component used to group multiple axis components.
 * It can include multiple `ChartAxis` components as children.
 *
 * @param {AxesProps} props - The properties for the ChartAxes component which include children that can be `ChartAxis` components.
 * @returns {JSX.Element} - The ChartAxes component.
 */
export const ChartAxes: React.FC<AxesProps> = (props: AxesProps): JSX.Element => {
    const context: ChartProviderChildProps = useContext(ChartContext);
    useEffect(() => {
        context.setChartAxes(axisCollection);
    }, [props.children]);
    return <>{props.children}</>;
};
ChartAxes.displayName = 'ChartAxes';

/**
 * `ChartAxis` defines an individual axis (either X or Y) in the chart.
 * It can be configured as a category or value axis.
 *
 * @param {Axis} props - The properties for the ChartAxis component.
 * @returns {JSX.Element} - The ChartAxis component.
 */
export const ChartAxis: React.FC<ChartAxisProps> = (props: ChartAxisProps): JSX.Element => {
    const childArray: React.ReactNode[] = React.Children.toArray(props.children);
    const childrenPropsSignature: string = childArray
        .map((child: React.ReactNode) => processChildElement(child, ChartStripLines))
        .join('|'); // simple delimiter for the string array
    const serializedProps: string = useMemo(() => {
        const { children, ...rest } = props;
        return JSON.stringify(rest);
    }, [props]);
    useEffect(() => {
        const axisProps: Partial<AxisModel> = { ...defaultChartConfigs.SecondaryAxis, ...props };
        let majorGridLines: MajorGridLines = defaultChartConfigs.MajorGridLines;
        let minorGridLines: MinorGridLines = defaultChartConfigs.MinorGridLines;
        let majorTickLines: MinorTickLines = defaultChartConfigs.MajorTickLines;
        let minorTickLines: MinorTickLines = defaultChartConfigs.MinorTickLines;
        let labelStyle: ChartAxisLabelProps = defaultChartConfigs.LabelStyle;
        let titleStyle: ChartAxisTitleProps = defaultChartConfigs.TitleStyle;
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
        });
        axisProps.majorGridLines = extend({}, majorGridLines);
        axisProps.majorGridLines.width = isNullOrUndefined(axisProps.majorGridLines.width) ? 0 : axisProps.majorGridLines.width;
        axisProps.minorGridLines = minorGridLines;
        axisProps.majorTickLines = majorTickLines;
        axisProps.minorTickLines = minorTickLines;
        axisProps.labelStyle = labelStyle;
        axisProps.titleStyle = titleStyle;
        axisProps.stripLines = stripLines;
        axisProps.lineStyle = { ...defaultChartConfigs.SecondaryAxis.lineStyle, ...props.lineStyle };
        if (axisCollection.length > 0 && axisCollection.some((axis: AxisModel) => axis.name === axisProps.name)) {
            const index: number = axisCollection.findIndex((axis: AxisModel) => axis.name === axisProps.name);
            axisCollection[index as number] = axisProps as AxisModel;
        } else {
            axisCollection.push(axisProps as AxisModel);
        }
    }, [serializedProps, childrenPropsSignature]);
    return <></>;
};
ChartAxis.displayName = 'ChartAxis';
