import * as React from 'react';
import { ChartParetoOptionsProps } from '../base/interfaces';

/**
 * @description Provides declarative configuration for Pareto cumulative line series behavior and appearance.
 * @returns {null} - It is used only to pass the pareto configuration to the chart through the React context.
 */
export const ChartParetoOptions: React.FC<ChartParetoOptionsProps & { children?: React.ReactNode }> = () => {
    return null;
};

ChartParetoOptions.displayName = 'ChartParetoOptions';
