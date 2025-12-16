import { useEffect, useState } from 'react';
import { Chart } from '../base/internal-interfaces';

/**
 * Represents a generic event handler for chart interactions.
 *
 * @param {Event} e - The DOM event object triggered by the user interaction.
 * @param {Chart} chart - The chart instance associated with the event.
 * @param args - Additional optional arguments that may include:
 *   - `number`, `string`, `boolean`, `null`, or `undefined`
 *   - An object with optional properties:
 *     - `x`: The x-coordinate related to the event.
 *     - `y`: The y-coordinate related to the event.
 *     - `targetId`: Identifier of the target element involved in the event.
 *
 * @private
 */
export type ChartEventHandler = (
    e: Event,
    chart: Chart,
    ...args: (number | string | boolean | null | undefined | { x?: number; y?: number; targetId?: string })[]
) => void;
type EventType = 'click' | 'mouseMove' | 'mouseDown' | 'mouseUp' | 'mouseWheel' | 'mouseLeave';

interface EventHandlers {
    [key: string]: ChartEventHandler[];
}

// Initialize with chart-specific event types
const chartEventHandlers: { [chartId: string]: EventHandlers } = {};


/**
 * Registers an event handler for a specific chart event type.
 *
 * @param {EventType} eventType - The type of chart event to listen for (e.g., 'click', 'hover').
 * @param {ChartEventHandler} handler - The function to handle the event when triggered.
 * @param {string} chartId - Optional identifier for the chart instance. Defaults to 'default' if not provided.
 * @returns {void} A function that can be called to unregister the event handler.
 * @private
 */
export function registerChartEventHandler(
    eventType: EventType,
    handler: ChartEventHandler,
    chartId?: string
): () => void {
    const id: string = chartId as string;

    // Initialize handlers for this chart ID if they don't exist
    if (!chartEventHandlers[id as string]) {
        chartEventHandlers[id as string] = {
            click: [],
            mouseDown: [],
            mouseMove: [],
            mouseUp: [],
            mouseLeave: []
        };
    }

    if (Object.prototype.hasOwnProperty.call(chartEventHandlers[id as string], eventType)) {
        chartEventHandlers[id as string][eventType as string].push(handler);
        return () => {
            if (chartEventHandlers[id as string] && Object.prototype.hasOwnProperty.call(chartEventHandlers[id as string], eventType)) {
                chartEventHandlers[id as string][eventType as string] =
                    chartEventHandlers[id as string][eventType as string].filter((h: ChartEventHandler) => h !== handler);
            }
        };
    }
    return () => { /* No-op if eventType is invalid */ };
}

/**
 * Defines the value type for chart event, loaction and target.
 *
 * @private
 */
export type ChartEventArg = number | string | boolean | null | undefined;

/**
 * Represents a location in chart coordinate space.
 *
 * @private
 */
export type ChartLocationArg = { x: number; y: number };

/**
 * Represents a reference to a chart target element.
 *
 * @private
 */
export type ChartTargetArg = { targetId: string };

/**
 * Calls all registered handlers for a specific event type
 *
 * @param {EventType} eventType - Type of event to trigger
 * @param {MouseEvent|TouchEvent|WheelEvent} e - The event object
 * @param {Chart} chart - The chart instance
 * @param {ChartEventArg} args - Chart event arguments.
 * @returns {void} - No return value
 * @private
 */
export function callChartEventHandlers(
    eventType: EventType,
    e: MouseEvent | TouchEvent | WheelEvent,
    chart: Chart,
    ...args: (ChartEventArg | ChartLocationArg | ChartTargetArg)[]
): void {
    const chartId: string = chart?.element?.id;

    // Call handlers registered for this specific chart
    if (chartEventHandlers[chartId as string] && Object.prototype.hasOwnProperty.call(chartEventHandlers[chartId as string], eventType)) {
        for (const handler of chartEventHandlers[chartId as string][eventType as string]) {
            handler(e, chart, ...args);
        }
    }

    // // Also call default handlers for backward compatibility
    // if (chartId !== 'default' && chartEventHandlers['default'] &&
    //     Object.prototype.hasOwnProperty.call(chartEventHandlers['default'], eventType)) {
    //     for (const handler of chartEventHandlers['default'][eventType as string]) {
    //         handler(e, chart, ...args);
    //     }
    // }
}
// For axis render version
interface VersionInfo {
    version: number;
    id: string;
}
// For center label render version
const centerLabelVersions: { [chartId: string]: number } = {};
let centerLabelListeners: ((info: VersionInfo) => void)[] = [];

/**
 * Hook to register center label change trigger function
 *
 * @returns {Function} Function to trigger center label updates
 */
export const useRegisterCenterLabelRender: () => (chartId?: string) => void = () => {
    return (chartId?: string) => {
        const id: string = chartId as string;

        if (!centerLabelVersions[id as string]) {
            centerLabelVersions[id as string] = 0;
        }

        centerLabelVersions[id as string]++;
        centerLabelListeners.forEach((fn: (info: VersionInfo) => void) => fn({ version: centerLabelVersions[id as string], id }));
    };
};

/**
 * Hook to subscribe to center label changes
 *
 * @param {string} [chartId] - Optional chart ID
 * @returns {VersionInfo} The current version info for center label changes
 */
export const useCenterLabelRenderVersion: (chartId?: string) => VersionInfo = (chartId?: string): VersionInfo => {
    const id: string = chartId as string;

    if (centerLabelVersions[id as string] === undefined) {
        centerLabelVersions[id as string] = 0;
    }

    const [versionInfo, setVersionInfo] = useState<VersionInfo>({
        version: centerLabelVersions[id as string] || 0,
        id
    });

    useEffect(() => {
        const updateVersion: (info: VersionInfo) => void = (info: VersionInfo) => {
            setVersionInfo(info);
        };

        centerLabelListeners.push(updateVersion);
        return () => {
            centerLabelListeners = centerLabelListeners.filter((fn: (info: VersionInfo) => void) => fn !== updateVersion);
        };
    }, []);

    return versionInfo;
};


const seriesRenderVersions: { [chartId: string]: number } = {};
let listeners: ((info: VersionInfo) => void)[] = [];

export const useRegisterChartRender: () => (chartId?: string) => void = () => {
    return (chartId?: string) => {
        const id: string = chartId as string;

        if (!seriesRenderVersions[id as string]) {
            seriesRenderVersions[id as string] = 0;
        }

        seriesRenderVersions[id as string]++;
        listeners.forEach((fn: (info: VersionInfo) => void) => fn({ version: seriesRenderVersions[id as string], id }));
    };
};

export const useChartRenderVersion: (chartId?: string) => VersionInfo = (chartId?: string) => {
    const id: string = chartId as string;

    if (seriesRenderVersions[id as string] === undefined) {
        seriesRenderVersions[id as string] = 0;
    }

    const [versionInfo, setVersionInfo] = useState<VersionInfo>({
        version: seriesRenderVersions[id as string] || 0,
        id
    });

    useEffect(() => {
        const updateVersion: (info: VersionInfo) => void = (info: VersionInfo) => {
            // Update when any version changes - components can check the ID
            setVersionInfo(info);
        };

        listeners.push(updateVersion);
        return () => {
            listeners = listeners.filter((fn: (info: VersionInfo) => void) => fn !== updateVersion);
        };
    }, []);

    return versionInfo;
};

// For series render version
const legendSeriesRenderVersions: {[chartId: string]: number} = {};
let seriesListeners: ((info: VersionInfo) => void)[] = [];
export const useRegisterSeriesRender: () => (chartId?: string) => void = () => {
    return (chartId?: string) => {
        const id: string = chartId as string;
        if (!legendSeriesRenderVersions[id as string]) {
            legendSeriesRenderVersions[id as string] = 0;
        }
        legendSeriesRenderVersions[id as string]++;
        seriesListeners.forEach((fn: (info: VersionInfo) => void) => fn({version: legendSeriesRenderVersions[id as string], id}));
    };
};
export const useSeriesRenderVersion: (chartId?: string) => VersionInfo = (chartId?: string) => {
    const id: string = chartId as string;
    if (legendSeriesRenderVersions[id as string] === undefined) {
        legendSeriesRenderVersions[id as string] = 0;
    }
    const [versionInfo, setVersionInfo] = useState<VersionInfo>({
        version: legendSeriesRenderVersions[id as string] || 0,
        id
    });
    useEffect(() => {
        const updateVersion: (info: VersionInfo) => void = (info: VersionInfo) => {
            // Update when any version changes - components can check the ID
            setVersionInfo(info);
        };
        seriesListeners.push(updateVersion);
        return () => {
            seriesListeners = seriesListeners.filter((fn: (info: VersionInfo) => void) => fn !== updateVersion);
        };
    }, []);
    return versionInfo;
};

// Legend manual update hooks
const legendUpdateVersions: { [chartId: string]: number } = {};
let legendUpdateListeners: ((info: VersionInfo) => void)[] = [];

export const useRegisterLegendUpdate: () => (chartId?: string) => void = () => {
    return (chartId?: string) => {
        const id: string = chartId as string;
        if (!legendUpdateVersions[id as string]) {
            legendUpdateVersions[id as string] = 0;
        }
        legendUpdateVersions[id as string]++;
        legendUpdateListeners.forEach((fn: (info: VersionInfo) => void) => fn({ version: legendUpdateVersions[id as string], id }));
    };
};

export const useLegendUpdateVersion: (chartId?: string) => VersionInfo = (chartId?: string): VersionInfo => {
    const id: string = chartId as string;
    if (legendUpdateVersions[id as string] === undefined) {
        legendUpdateVersions[id as string] = 0;
    }
    const [versionInfo, setVersionInfo] = useState<VersionInfo>({
        version: legendUpdateVersions[id as string] || 0,
        id
    });

    useEffect(() => {
        const updateVersion: (info: VersionInfo) => void = (info: VersionInfo) => {
            setVersionInfo(info);
        };
        legendUpdateListeners.push(updateVersion);
        return () => {
            legendUpdateListeners = legendUpdateListeners.filter((fn: (info: VersionInfo) => void) => fn !== updateVersion);
        };
    }, []);

    return versionInfo;
};
