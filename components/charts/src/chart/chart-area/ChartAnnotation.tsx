import * as React from 'react';
import { useContext, useEffect, useMemo } from 'react';
import { ChartProviderChildProps } from './chart-interfaces';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartAnnotationProps } from '../base/interfaces';

/**
 * Declarative, no-op component used to describe a single chart annotation.
 *
 * This component does not render any DOM. It is intended to be used as a child of
 * ChartAnnotationCollection to declare annotation configuration in JSX.
 *
 * @param {ChartAnnotationProps} _props - Annotation configuration props.
 * @returns {null} Returns null; this component is declarative and does not render any DOM.
 */
export const ChartAnnotation: React.FC<ChartAnnotationProps> = (_props: ChartAnnotationProps): null => {
    return null;
};

/**
 * Props for ChartAnnotationCollection.
 * @private
 */
export interface AnnotationCollectionProps {
    /**
     * One or more ChartAnnotation children that declare annotation configuration.
     */
    children?: React.ReactNode;
}

/**
 * Collects ChartAnnotation children, merges them with defaults, and publishes
 * the resulting annotation list to ChartContext.
 *
 * This component does not render any DOM; it only coordinates annotation config.
 *
 * Behavior:
 * - Filters its children to include only ChartAnnotation nodes.
 * - Merges each child's props with defaultChartConfigs.ChartAnnotation.
 * - Pushes the merged list into the chart context via setChartAnnotation.
 *
 * @param {React.ReactNode} children - One or more ChartAnnotation nodes.
 * @returns {null} Returns null; this component is declarative and does not render any DOM.
 */
export const ChartAnnotationCollection: React.FC<AnnotationCollectionProps> = (
    { children }: AnnotationCollectionProps
): null => {
    const chartContext: ChartProviderChildProps = useContext(ChartContext) as ChartProviderChildProps;

    /**
     * Memoized to avoid unnecessary recalculations when children are unchanged.
     */
    const mergedChildren: ChartAnnotationProps[] = useMemo((): ChartAnnotationProps[] => {
        const childNodes: React.ReactElement[] = React.Children.toArray(children) as React.ReactElement[];

        const annotationNodes: Array<React.ReactElement<ChartAnnotationProps>> = childNodes.filter(
            (child: React.ReactElement): boolean =>
                React.isValidElement(child) && child.type === ChartAnnotation
        ) as Array<React.ReactElement<ChartAnnotationProps>>;

        return annotationNodes.map(
            (el: React.ReactElement<ChartAnnotationProps>): ChartAnnotationProps => ({
                ...defaultChartConfigs.ChartAnnotation,
                ...el.props
            })
        );
    }, [children]);

    /**
     * Publishes the merged annotations into the ChartContext whenever the
     * collection changes, enabling the chart layout to consume and render them.
     */
    useEffect((): void => {
        chartContext?.setChartAnnotation?.(mergedChildren);
    }, [chartContext, mergedChildren]);

    return null;
};

export default ChartAnnotationCollection;
