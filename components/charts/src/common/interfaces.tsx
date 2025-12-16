/**
 * Defines the appearance of the focus outline for interactive UI elements.
 */
export interface FocusOutlineProps {

    /**
     * Customizes the focus border color.
     * If not specified, the default focus border color is used.
     *
     * @default null
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
