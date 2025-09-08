import { LayoutMap } from '../layout/LayoutContext';


/**
 * Defines animation settings for chart series in a React component.
 */
export interface Animation {

    /**
     * When set to `false`, animation is disabled during the initial rendering of the chart series.
     *
     * @default true
     */
    enable: boolean;

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
 * Represents a single SVG path command used in rendering chart elements.
 *
 * @private
 */
export interface PathCommand {
    /**
     * The type of path command (e.g., 'M', 'L', 'C', etc.).
     */
    type: string;

    /**
     * The numeric parameters associated with the path command.
     */
    params: number[];
}

/**
 * Defines the context type for layout-related operations in the charting system.
 * @private
 */
export interface LayoutContextType {
    /**
     * Updates layout-related values by key.
     *
     * @param key - The identifier for the layout value.
     * @param values - A partial object containing the new layout values.
     */
    setLayoutValue: (key: string, values: Partial<any>) => void;

    /**
     * Indicates the current phase of layout processing.
     * Can be either 'measuring' or 'rendering'.
     */
    phase: 'measuring' | 'rendering';

    /**
     * Triggers a re-measurement of layout dimensions and properties.
     */
    triggerRemeasure: () => void;

    /**
     * Reports that a specific layout measurement has been completed.
     *
     * @param key - The identifier of the measured layout item.
     */
    reportMeasured: (key: string) => void;

    /**
     * A mutable reference to the layout map, containing chart layout data.
     */
    layoutRef: React.MutableRefObject<LayoutMap>;

    /**
     * Optional flag to disable chart animations.
     */
    disableAnimation?: boolean;

    /**
     * Optional setter to update the animation disable flag.
     *
     * @param val - Boolean value to enable or disable animations.
     */
    setDisableAnimation?: (val: boolean) => void;

    /**
     * The available size for layout rendering, including width and height.
     */
    availableSize: { width: number, height: number };

    /**
     * Indicates the current progress of chart animations (0 to 1).
     */
    animationProgress: number;

    /**
     * Updates the animation progress value.
     *
     * @param progress - A number between 0 and 1 representing animation progress.
     */
    setAnimationProgress: (progress: number) => void;
}

