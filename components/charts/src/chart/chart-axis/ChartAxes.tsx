
import { JSX, ReactElement, useContext, useEffect, useMemo } from 'react';
import { ChartCrosshairTooltipProps, ChartAxisProps, MajorGridLines, MajorTickLines, MinorGridLines, MinorTickLines, ChartScrollbarProps } from '../base/interfaces';
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
import { processChildElement, processStripLines, processMultiLevelLabels } from './PrimaryXAxis';
import { ChartStripLineProps, ChartMultiLevelLabelProps } from '../base/interfaces';
import { ChartMultiLevelLabels } from './ChartMultiLevelLabel';
import * as React from 'react';
import { extend, isNullOrUndefined } from '@syncfusion/react-base';
import { ChartCrosshairTooltip } from './CrosshairTooltip';
import { ChartScrollbar } from './ChartScrollBar';

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

/**
 * `ChartAxes` collects `ChartAxis` children, processes their nested
 * configuration (gridlines, ticklines, labels, strip lines, etc.) and
 * publishes a merged `AxisModel[]` into the chart context via
 * `setChartAxes`, similar to how `ChartAnnotationCollection` operates.
 *
 * @param {AxesProps} props - The properties for the `ChartAxes` container.
 * @returns {JSX.Element} The rendered children (passes through the axis children).
 */
export const ChartAxes: React.FC<AxesProps> = (props: AxesProps): JSX.Element => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    const mergedAxes: AxisModel[] = useMemo(() => {
        const childNodes: React.ReactElement[] = React.Children.toArray(props.children) as React.ReactElement[];

        const axisElements: Array<React.ReactElement<ChartAxisProps>> = childNodes.filter(
            (child: React.ReactElement): boolean => React.isValidElement(child) && child.type === ChartAxis
        ) as Array<React.ReactElement<ChartAxisProps>>;

        const axisMetas: Array<{ axisEl: React.ReactElement<ChartAxisProps>; childArray: React.ReactNode[];
            childrenPropsSignature: string; serializedProps: string; }> =
            axisElements.map((axisEl: React.ReactElement<ChartAxisProps>) => {
                const childArray: React.ReactNode[] = React.Children.toArray(axisEl.props.children);
                const childrenPropsSignature: string = childArray
                    .map((child: React.ReactNode) => {
                        if (React.isValidElement(child) && child.type === ChartMultiLevelLabels) {
                            const processedMultiLevelLabels: ChartMultiLevelLabelProps[] =
                            processMultiLevelLabels(child, defaultChartConfigs.MultiLevelLabels);
                            return JSON.stringify({ type: 'ChartMultiLevelLabels', props: processedMultiLevelLabels });
                        }
                        return processChildElement(child, ChartStripLines);
                    })
                    .join('|');

                const serializedProps: string = (() => {
                    const { children, ...rest } = axisEl.props as ChartAxisProps;
                    try { return JSON.stringify(rest); } catch { return '{}'; }
                })();

                return { axisEl, childArray, childrenPropsSignature, serializedProps };
            });

        return axisMetas.map(({ axisEl, childArray }: { axisEl: React.ReactElement<ChartAxisProps>; childArray: React.ReactNode[] }) => {
            const axisProps: Partial<AxisModel> = { ...defaultChartConfigs.SecondaryAxis, ...axisEl.props };

            let majorGridLines: MajorGridLines = defaultChartConfigs.MajorGridLines;
            let minorGridLines: MinorGridLines = defaultChartConfigs.MinorGridLines;
            let majorTickLines: MajorTickLines = defaultChartConfigs.MajorTickLines;
            let minorTickLines: MinorTickLines = defaultChartConfigs.MinorTickLines;
            let labelStyle: ChartAxisLabelProps = defaultChartConfigs.LabelStyle;
            let titleStyle: ChartAxisTitleProps = defaultChartConfigs.TitleStyle;
            let stripLines: ChartStripLineProps[] = [...defaultChartConfigs.StripLines];
            let axisCrosshairTooltip: ChartCrosshairTooltipProps = defaultChartConfigs.AxisCrosshairTooltip;
            let scrollbarSettings: ChartScrollbarProps = defaultChartConfigs.ChartScrollBar;
            let multiLevelLabels: ChartMultiLevelLabelProps[] = [...defaultChartConfigs.MultiLevelLabels];

            childArray.forEach((child: React.ReactNode) => {
                if (!React.isValidElement(child)) { return; }
                const childProps: Record<string, MajorGridLines | MinorGridLines | MajorTickLines | MinorTickLines |
                ChartAxisLabelProps | ChartAxisTitleProps | ChartStripLineProps
                | ChartCrosshairTooltipProps | ChartScrollbarProps | ChartMultiLevelLabelProps> =
                    child.props as Record<string, MajorGridLines | MinorGridLines | MajorTickLines
                    | MinorTickLines | ChartAxisLabelProps | ChartAxisTitleProps | ChartStripLineProps
                    | ChartCrosshairTooltipProps | ChartScrollbarProps | ChartMultiLevelLabelProps>;
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
                else if (child.type === ChartScrollbar) {
                    scrollbarSettings = {
                        ...defaultChartConfigs.ChartScrollBar,
                        ...child.props as ChartScrollbarProps
                    };
                }
                else if (child.type === ChartMultiLevelLabels) {
                    multiLevelLabels = processMultiLevelLabels(child, defaultChartConfigs.MultiLevelLabels);
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
            axisProps.crossAt = { ...defaultChartConfigs.SecondaryAxis.crossAt, ...axisEl.props.crossAt };
            axisProps.lineStyle = { ...defaultChartConfigs.SecondaryAxis.lineStyle, ...axisEl.props.lineStyle };
            axisProps.crosshairTooltip = axisCrosshairTooltip;
            axisProps.scrollbarSettings = scrollbarSettings;
            axisProps.multiLevelLabels = multiLevelLabels;

            return axisProps as AxisModel;
        });
    }, [props.children]);

    useEffect(() => {
        context.setChartAxes(mergedAxes);
    }, [context, mergedAxes]);

    return <>{props.children}</>;
};
ChartAxes.displayName = 'ChartAxes';

/**
 * `ChartAxis` defines an individual axis (either X or Y) in the chart.
 * It can be configured as a category or value axis.
 *
 * @param {ChartAxisProps} props - The properties for the ChartAxis component.
 * @returns {JSX.Element} - The ChartAxis component.
 */
export const ChartAxis: React.FC<ChartAxisProps> = (): null => {
    return null;
};
ChartAxis.displayName = 'ChartAxis';
