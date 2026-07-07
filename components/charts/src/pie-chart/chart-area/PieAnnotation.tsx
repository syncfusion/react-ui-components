import * as React from 'react';
import { useContext, useEffect, useMemo } from 'react';
import { ChartProviderChildProps } from '../layout/ChartProvider';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { PieChartAnnotationProps } from '../base/interfaces';

/**
 * Represents a declarative configuration for a pie chart annotation.
 *
 * This component does not render any DOM. It is intended to be used as a child of
 * PieChartAnnotationCollection to declare annotation configuration in JSX.
 *
 * @returns {null}- It is used only to pass the annotation configuration into the pie chart through React context.
 */
export const PieChartAnnotation: React.FC<PieChartAnnotationProps> = (): null => {
    return null;
};

/**
 * Props for PieChartAnnotationCollection.
 *
 * @private
 */
export interface PieAnnotationCollectionProps {
    children?: React.ReactNode;
}

/**
 * Collects PieChartAnnotation children, merges them with defaults, and publishes
 * the resulting annotation list to ChartContext.
 *
 * This component does not render any DOM; it only coordinates annotation config.
 *
 * Behavior:
 * - Filters its children to include only PieChartAnnotation nodes.
 * - Merges each child's props with defaultChartConfigs.PieChartAnnotation.
 * - Pushes the merged list into the chart context via setPieChartAnnotation.
 *
 * @param {React.ReactNode} children - One or more PieChartAnnotation nodes.
 * @returns {null}- It is used only to pass the annotations configuration into the pie chart through React context.
 */
export const PieChartAnnotationCollection: React.FC<PieAnnotationCollectionProps> = (
    { children }: PieAnnotationCollectionProps
): null => {
    const pieChartContext: ChartProviderChildProps = useContext(ChartContext) as ChartProviderChildProps;

    const mergedChildren: PieChartAnnotationProps[] = useMemo((): PieChartAnnotationProps[] => {
        const childNodes: React.ReactElement[] = React.Children.toArray(children) as React.ReactElement[];

        const annotationNodes: Array<React.ReactElement<PieChartAnnotationProps>> = childNodes.filter(
            (child: React.ReactElement): boolean =>
                React.isValidElement(child) && child.type === PieChartAnnotation
        ) as Array<React.ReactElement<PieChartAnnotationProps>>;

        return annotationNodes.map(
            (el: React.ReactElement<PieChartAnnotationProps>): PieChartAnnotationProps => ({
                ...defaultChartConfigs.PieChartAnnotation,
                ...el.props
            })
        );
    }, [children]);

    useEffect((): void => {
        pieChartContext?.setPieChartAnnotation?.(mergedChildren);
    }, [pieChartContext, mergedChildren]);

    return null;
};

export default PieChartAnnotationCollection;
