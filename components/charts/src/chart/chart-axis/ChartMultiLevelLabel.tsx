import * as React from 'react';
import { ChartMultiLevelLabelProps } from '../base/interfaces';

/**
 * Represents a collection of multi-level labels for a chart axis.
 *
 * @private
 */
export interface ChartMultiLevelLabelCollectionProps {
    /**
     * One or more `ChartMultiLevelLabel` child elements
     * that define grouped axis labels.
     */
    children?: React.ReactNode;
}

/**
 * ChartMultiLevelLabels component for configuring multi-level axis labels in the chart.
 * This is a configuration-only container component that does not render any visual output.
 *
 * @returns {null} - It is used only to pass the multi level label configuration to the chart through the React context.
 */
export const ChartMultiLevelLabels: React.FC<ChartMultiLevelLabelCollectionProps> = () => {
    return null;
};

/**
 * ChartMultiLevelLabel component for configuring a single level of multi-level axis labels.
 * This is a configuration-only component that does not render any visual output.
 *
 * @returns {null}- It is used only to pass the multi level label configuration to the chart through the React context.
 */
export const ChartMultiLevelLabel: React.FC<ChartMultiLevelLabelProps> = (): null => {
    return null;
};

ChartMultiLevelLabels.displayName = 'ChartMultiLevelLabels';
ChartMultiLevelLabel.displayName = 'ChartMultiLevelLabel';
