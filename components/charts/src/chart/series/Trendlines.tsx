import * as React from 'react';
import { ChartTrendlineProps } from '../base/interfaces';

/**
 * Interface defining the props for the TrendlineCollection component.
 *
 * @private
 */
export interface ChartTrendlineCollectionProps {
    /**
     * React child elements (ChartTrendline components) to be rendered inside the collection.
     */
    children?: React.ReactNode;
}

/**
 * @description Component that acts as a container for multiple ChartTrendline components.
 * This component wraps trendline definitions and passes them to the parent series.
 * @param {ChartTrendlineCollectionProps} props - Properties for the trendline collection
 * @returns {Element} A React element that renders its trendline children
 */
export const ChartTrendlineCollection: React.FC<ChartTrendlineCollectionProps> = (
    props: ChartTrendlineCollectionProps
): React.JSX.Element => {
    return <>{props.children}</>;
};

ChartTrendlineCollection.displayName = 'ChartTrendlineCollection';

/**
 * @typedef ChartTrendlineProperty
 * @extends ChartTrendlineProps
 * @property {React.ReactNode} [children] - Optional content to be rendered inside the trendline (e.g., ChartMarker with ChartDataLabel)
 * @private
 */
type ChartTrendlineProperty = ChartTrendlineProps & {
    children?: React.ReactNode
};

/**
 * @description Component for configuring a single trendline in a chart series.
 * This component supports nesting ChartMarker and ChartDataLabel as children.
 * Must be used inside a ChartTrendlineCollection component.
 * @param {ChartTrendlineProperty} props - Properties for configuring the trendline
 * @returns {Element} A React element that renders the trendline with its children
 */
export const ChartTrendline: React.FC<ChartTrendlineProperty> = (
    props: ChartTrendlineProperty
): React.JSX.Element => {
    return <>{props.children}</>;
};

ChartTrendline.displayName = 'ChartTrendline';
