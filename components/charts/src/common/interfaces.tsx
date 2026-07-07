import { ConnectorType } from './enum';

/**
 * Defines the appearance of the focus outline for interactive UI elements.
 */
export interface FocusOutlineProps {

    /**
     * Customizes the focus border color.
     * If not specified, the default focus border color is used.
     *
     * @default ''
     */
    color?: string;

    /**
     * Customizes the focus border width.
     * If not specified, the default width is used.
     *
     * @default 1.5
     */
    width?: number;

    /**
     * Customizes the focus border margin.
     * If not specified, the default margin is used.
     *
     * @default 0
     */
    offset?: number;
}

/**
 * Defines animation settings for chart series in a React component.
 */
export interface Animation {

    /**
     * When set to `false`, animation is disabled during the initial rendering of the chart series.
     *
     * @default true
     */
    enable?: boolean;

    /**
     * Duration of the animation in milliseconds.
     * Controls how long the animation effect lasts.
     *
     * @default 1000
     */
    duration?: number;

    /**
     * Delay before the animation starts, in milliseconds.
     * Useful for sequencing animations or staggering effects.
     *
     * @default 0
     */
    delay?: number;
}

/**
 * Represents configuration options for connector lines in the chart.
 */
export interface ConnectorProps {

    /**
     * Specifies the type of connector line used in the chart.
     * The available options are:
     * - `Curve`: Renders a smooth curved connector line.
     * - `Line`: Renders a straight connector line.
     *
     * @default 'Curve'
     */
    type?: ConnectorType;

    /**
     * Specifies the color of the connector line.
     * Accepts any valid CSS color string (e.g., hex, rgba).
     *
     * @default ''
     */
    color?: string;

    /**
     * Specifies the width of the connector line in pixels.
     *
     * @default 1
     */
    width?: number;

    /**
     * Specifies the length of the connector line.
     * Accepts CSS length values such as pixel values (e.g., `'100px'`) or percentage values (e.g., `'50%'`).
     *
     * @default ''
     */
    length?: string;

    /**
     * Specifies the dash pattern of the connector line.
     *
     * @default ''
     */
    dashArray?: string;
}
