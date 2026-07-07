import { ChartCrosshairTooltipProps } from '../base/interfaces';

/**
 * ChartCrosshairTooltip component for enabling/configuring axis crosshair tooltip.
 * This is a configuration-only component and does not render any visual output.
 *
 * @returns {null} - It is used only to pass the crosshair tooltip configuration to the chart through the React context.
 */
export const ChartCrosshairTooltip: React.FC<ChartCrosshairTooltipProps> = () => {
    return null;
};

ChartCrosshairTooltip.displayName = 'ChartCrosshairTooltip';
