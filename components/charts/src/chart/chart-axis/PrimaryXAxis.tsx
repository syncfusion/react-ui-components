import * as React from 'react';
import { ChartAxisProps, MajorGridLines, MajorTickLines, MinorGridLines, MinorTickLines } from '../base/interfaces';
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
import { ChartStripLines, ChartStripLine } from './StripLines';
import { getCircularReplacer } from '../series/Series';
import { ChartStripLineProps } from '../base/interfaces';
import { extend, isNullOrUndefined } from '@syncfusion/react-base';

/**
 * Safely stringifies an object to JSON, handling circular references.
 *
 * @param {unknown} obj - The object to stringify
 * @returns {string} JSON string representation of the object, or empty object if null/undefined
 */
export const safeStringify: (obj: unknown) => string = (obj: unknown) => {
    return JSON.stringify(obj, getCircularReplacer()) || '{}';
};

/**
 * Safely parses a JSON string to an object.
 *
 * @param {string} jsonString - The JSON string to parse
 * @returns {unknown} Parsed object, or empty object if input is invalid
 */
export const safeParse: (jsonString: string) => unknown = (jsonString: string) => {
    return jsonString ? JSON.parse(jsonString) : {};
};

/**
 * Processes a React child element into a serialized JSON representation.
 * Handles special cases for strip line components.
 *
 * @param {React.ReactNode} child - The child element to process.
 * @param {React.ElementType} ChartStripLines - The strip lines component type to check against.
 * @returns {string | null} A JSON string representation of the element, or null if invalid.
 */
export const processChildElement: (
    child: React.ReactNode,
    ChartStripLines: React.ElementType
) => string | null = (
    child: React.ReactNode,
    ChartStripLines: React.ElementType
): string | null => {
    if (React.isValidElement(child)) {
        const type: React.ElementType<React.PropsWithChildren<unknown>, keyof React.JSX.IntrinsicElements> =
        child.type as React.ElementType;
        const typeName: string = typeof type === 'string'
            ? type // e.g., 'div', 'span'
            : (type.displayName as string);
        if (type !== ChartStripLines) {
            const safeProps: unknown = safeParse(safeStringify(child.props));
            return JSON.stringify({
                type: typeName,
                props: safeProps
            });
        }
        const childProps: Record<string, unknown> = child.props as Record<string, unknown>;
        const stripLineProps: Record<string, unknown> = { ...childProps };
        if (childProps.children) {
            const stripChildren: { [x: string]: unknown; }[] = React.Children.toArray(childProps.children as React.ReactNode)
                .filter((stripChild: React.ReactNode): stripChild is React.ReactElement =>
                    React.isValidElement(stripChild) &&
                    stripChild.type === ChartStripLine)
                .map((stripChild: React.ReactElement) => {
                    const stripChildProps: Record<string, unknown> = stripChild.props as Record<string, unknown>;
                    return { ...stripChildProps };
                });
            stripLineProps.processedChildren = stripChildren;
        }
        const safeProps: unknown = safeParse(safeStringify(stripLineProps));
        return JSON.stringify({
            type: typeName,
            props: safeProps
        });
    }
    return null;
};

/**
 * Processes strip line configurations from a chart component.
 * Extracts and transforms strip line children into proper configuration objects.
 *
 * @param {React.ReactNode} child - The child element containing strip line configurations.
 * @param {ChartStripLineProps[]} defaultStripLines - Default strip line settings to use as fallback.
 * @returns {ChartStripLineProps[]} Processed strip line configuration array.
 */
export const processStripLines: (
    child: React.ReactNode,
    defaultStripLines: ChartStripLineProps[]
) => ChartStripLineProps[] = (
    child: React.ReactNode,
    defaultStripLines: ChartStripLineProps[]
) => {
    if (!React.isValidElement(child) || child.type !== ChartStripLines) {
        return [...defaultStripLines];
    }
    const stripLinesElement: React.ReactElement<{ children?: React.ReactNode }> = child as React.ReactElement<{
        children?: React.ReactNode }>;
    const stripLineChildren: React.ReactNode[] = React.Children.toArray(stripLinesElement.props.children || []);

    if (stripLineChildren.length > 0) {
        return stripLineChildren
            .filter((stripChild: React.ReactNode): stripChild is React.ReactElement =>
                React.isValidElement(stripChild) && stripChild.type === ChartStripLine)
            .map((stripChild: React.ReactElement) => {
                const defaultProps: ChartStripLineProps = defaultChartConfigs.StripLines[0];
                const userProps: ChartStripLineProps = stripChild.props as ChartStripLineProps;
                const mergedProps: ChartStripLineProps = {
                    ...defaultProps,
                    ...userProps,
                    range: {
                        ...defaultProps.range,
                        ...userProps.range
                    },
                    style: {
                        ...defaultProps.style,
                        ...userProps.style
                    },
                    text: {
                        ...defaultProps.text,
                        ...userProps.text
                    },
                    repeat: {
                        ...defaultProps.repeat,
                        ...userProps.repeat
                    },
                    segment: {
                        ...defaultProps.segment,
                        ...userProps.segment
                    }
                };
                return mergedProps;
            });
    } else {
        return [...defaultStripLines];
    }
};

/**
 * Primary X-Axis component for the chart.
 * Renders the vertical axis with customizable properties like labels, grid lines, tick marks, and strip lines.
 * A non-rendering component that configures the chart's primary X-axis.
 *
 * @param {ChartAxisProps} props - The properties for configuring the X-axis
 * @returns {null} This component doesn't render any visible elements
 */
export const ChartPrimaryXAxis: React.FC<ChartAxisProps> = (props: ChartAxisProps) => {
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
        const axisProps: Partial<AxisModel> = { ...defaultChartConfigs.PrimaryXAxis, ...props };
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
        axisProps.lineStyle = { ...defaultChartConfigs.PrimaryXAxis.lineStyle, ...props.lineStyle };
        context?.setChartPrimaryXAxis(axisProps as AxisModel);
    }, [serializedProps, childrenPropsSignature]);
    return null;
};
