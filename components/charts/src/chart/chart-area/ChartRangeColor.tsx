import * as React from 'react';
import { useContext, useEffect, useMemo } from 'react';
import { ChartProviderChildProps } from './chart-interfaces';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartRangeColorProps } from '../base/interfaces';

/**
 * Declarative, no-op component used to describe a single chart range color item.
 *
 * This component does not render any DOM. It is intended to be used as a child of
 * ChartRangeColorCollection to declare range color configuration in JSX.
 *
 * @returns {null} This is a declarative component and does not render DOM.
 */
export const ChartRangeColor: React.FC<ChartRangeColorProps> = (): null => {
    return null;
};

/**
 * Defines a collection container for range color configurations.
 *
 * This interface is used to group one or more range color items as child components.
 * Each child typically represents a distinct color range applied to a specific
 * value interval in the control.
 *
 * @private
 */
export interface ChartRangeColorCollectionProps {
    /**
     * Specifies the range color elements to be rendered within the collection.
     *
     * @remarks
     * Accepts one or more React nodes, usually representing individual range color configurations.
     */
    children?: React.ReactNode;
}

/**
 * Collects ChartRangeColor children, merges them with defaults, and publishes
 * the resulting range color list to ChartContext.
 *
 * @param {React.ReactNode} root0.children - child nodes to collect
 * @returns {null} This component does not render DOM; it updates chart context.
 */
export const ChartRangeColorCollection: React.FC<ChartRangeColorCollectionProps> = (
    { children }: ChartRangeColorCollectionProps
): null => {
    const chartContext: ChartProviderChildProps = useContext(ChartContext) as ChartProviderChildProps;

    const mergedChildren: ChartRangeColorProps[] = useMemo((): ChartRangeColorProps[] => {
        const childNodes: React.ReactElement[] = React.Children.toArray(children) as React.ReactElement[];

        const rangeColorNodes: Array<React.ReactElement<ChartRangeColorProps>> = childNodes.filter(
            (child: React.ReactElement): boolean =>
                React.isValidElement(child) && child.type === ChartRangeColor
        ) as Array<React.ReactElement<ChartRangeColorProps>>;

        return rangeColorNodes.map(
            (el: React.ReactElement<ChartRangeColorProps>): ChartRangeColorProps => ({
                ...defaultChartConfigs.ChartRangeColor,
                ...el.props
            })
        );
    }, [children]);

    useEffect((): void => {
        chartContext?.setChartRangeColor?.(mergedChildren);
    }, [chartContext, mergedChildren]);

    return null;
};

export default ChartRangeColorCollection;
