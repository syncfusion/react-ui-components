import { JSX } from 'react';
import { ChartScrollbarProps  } from '../base/interfaces';

/**
 * Placeholder React component for chart scrollbar configuration.
 *
 * Acts as a declarative component to enable and configure scrollbar behavior
 * via props. This component does not render any visual output directly; instead,
 * it integrates with the chart's internal layout and rendering pipeline.
 *
 * @returns {JSX.Element | null} - It is used only to pass the scroll bar configuration to the chart through the React context.
 */
export const ChartScrollbar: React.FC<ChartScrollbarProps > = (): JSX.Element | null => {
    return null;
};

ChartScrollbar.displayName = 'ChartScrollbar';
