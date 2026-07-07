import * as React from 'react';
import { StripLineProps } from '../chart-area/chart-interfaces';
import { ChartStripLineProps } from '../base/interfaces';

/**
 * ChartStripLines component for configuring multiple strip lines in the chart.
 * This is a configuration-only component and does not render any visual output.
 *
 * @returns {null} - It is used only to pass the strip lines configuration to the chart through the React context.
 */
export const ChartStripLines: React.FC<StripLineProps> = () => {
    return null;
};

/**
 * ChartStripLine component for configuring a single strip line in the chart.
 * This is a configuration-only component and does not render any visual output.
 *
 * @returns {null} It is used only to pass the strip line configuration to the chart through the React context.
 */
export const ChartStripLine: React.FC<ChartStripLineProps> = () => {
    return null;
};

ChartStripLine.displayName = 'ChartStripLine';
ChartStripLines.displayName = 'ChartStripLines';
