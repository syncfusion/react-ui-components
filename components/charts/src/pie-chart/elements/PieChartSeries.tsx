import { ReactElement, useContext, useEffect, useMemo } from 'react';
import { ChartContext, ChartProviderChildProps } from '../layout/ChartProvider';
import { SeriesProperties } from '../base/internal-interfaces';
import * as React from 'react';
import { defaultChartConfigs } from '../base/default-properties';
import { PieChartDataLabelProps, PieChartSeriesProps } from '../base/interfaces';
import { PieChartDataLabel } from './PieChartDataLabel';

/**
 * Represents the props for the SeriesCollection component.
 *
 * This interface is used to define a container that groups multiple pie chart series.
 * It acts as a parent component for one or more `PieChartSeriesProps` elements.
 */
interface PieSeriesCollectionProps {
    /**
     * Child series components to be rendered inside the collection.
     *
     * Accepts either a single `ReactElement<PieChartSeriesProps>` or an array of such elements.
     */
    children?: ReactElement<PieChartSeriesProps>[] | ReactElement<PieChartSeriesProps>;
}

export const PieChartSeriesCollection: React.FC<PieSeriesCollectionProps> = (props: PieSeriesCollectionProps) => {
    const children: React.JSX.Element = (React.Children.toArray(props.children)[0] || <></>) as React.JSX.Element;
    return <>{children}</>;
};

/**
 * Represents a circular chart series component.
 *
 * This component serializes its props (excluding children and other React-specific props)
 * using `JSON.stringify` and memoizes the result to avoid unnecessary recalculations.
 *
 * @param {PieChartSeriesProps} props - The properties used to configure the circular chart series.
 * @returns {React.JSXElement } A React functional component for rendering circular chart series.
 */
export const PieChartSeries: React.FC<PieChartSeriesProps> = (props: PieChartSeriesProps) => {
    const childArray: React.ReactNode[] = React.Children.toArray(props.children);
    const childrenPropsSignature: string = childArray
        .map((child: React.ReactNode) => {
            if (!React.isValidElement(child)) { return ''; }
            const typeName: string = (child.type as any)?.displayName;
            return `${typeName}:${JSON.stringify(child.props)}`;
        }).join('|');

    const serializedProps: string = useMemo(() => {
        const { children, ...rest } = props;
        return JSON.stringify(rest);
    }, [props]);
    const context: ChartProviderChildProps = useContext(ChartContext);
    useEffect(() => {
        const base: SeriesProperties = (() => {
            try { return JSON.parse(JSON.stringify(defaultChartConfigs.ChartSeries)); }
            catch { return { ...defaultChartConfigs.ChartSeries }; }
        })();
        const seriesProperties: SeriesProperties = {
            ...base,
            ...props,
            border: { ...(base.border), ...(props.border || {}) },
            animation: { ...(base.animation), ...(props.animation || {}) }
        };

        let dataLabel: PieChartDataLabelProps = (() => {
            try { return JSON.parse(JSON.stringify(defaultChartConfigs.ChartDataLabel)); }
            catch { return { ...defaultChartConfigs.ChartDataLabel }; }
        })();

        childArray.forEach((child: React.ReactNode) => {
            if (!React.isValidElement(child)) { return; }
            if (child.type === PieChartDataLabel) {
                dataLabel = { ...dataLabel, ...(child.props as PieChartDataLabelProps) };
            }
        });
        seriesProperties.dataLabel = dataLabel;

        context.setChartSeries([seriesProperties]);
    }, [serializedProps, childrenPropsSignature]);
    return <></>;
};
