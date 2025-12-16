import { JSX, useEffect, useState } from 'react';
import { Chart, Rect } from '../chart-area/chart-interfaces';
const clipRectRef: { current: null | ((clipRect: Rect) => void); } =
{
    current: null as null | ((clipRect: Rect) => void)
};

export const useRegisterClipRectSetter: () => (fn: (clipRect: Rect) => void) => void = () => {
    return (fn: (clipRect: Rect) => void) => {
        clipRectRef.current = fn;
    };
};

export const useUnregisterClipRectSetter: () => () => void = () => {
    return () => {
        clipRectRef.current = null;
    };
};

export const useClipRectSetter: () => ((clipRect: Rect) => void) | null = () => {
    return clipRectRef.current;
};

// For axis render version
interface VersionInfo {
    version: number;
    id: string;
}

const axisRenderVersions: {[chartId: string]: number} = {};
let listeners: ((info: VersionInfo) => void)[] = [];

export const useRegisterAxisRender: () => (chartId?: string) => void = () => {
    return (chartId?: string) => {
        const id: string = chartId || 'default';

        if (!axisRenderVersions[id as string]) {
            axisRenderVersions[id as string] = 0;
        }

        axisRenderVersions[id as string]++;
        listeners.forEach((fn: (info: VersionInfo) => void) => fn({version: axisRenderVersions[id as string], id}));
    };
};

export const useAxisRenderVersion: (chartId?: string) => VersionInfo = (chartId?: string) => {
    const id: string = chartId || 'default';

    if (axisRenderVersions[id as string] === undefined) {
        axisRenderVersions[id as string] = 0;
    }

    const [versionInfo, setVersionInfo] = useState<VersionInfo>({
        version: axisRenderVersions[id as string] || 0,
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
const seriesRenderVersions: {[chartId: string]: number} = {};
let seriesListeners: ((info: VersionInfo) => void)[] = [];

export const useRegisterSeriesRender: () => (chartId?: string) => void = () => {
    return (chartId?: string) => {
        const id: string = chartId || 'default';

        if (!seriesRenderVersions[id as string]) {
            seriesRenderVersions[id as string] = 0;
        }

        seriesRenderVersions[id as string]++;
        seriesListeners.forEach((fn: (info: VersionInfo) => void) => fn({version: seriesRenderVersions[id as string], id}));
    };
};

export const useSeriesRenderVersion: (chartId?: string) => VersionInfo = (chartId?: string) => {
    const id: string = chartId || 'default';

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

        seriesListeners.push(updateVersion);
        return () => {
            seriesListeners = seriesListeners.filter((fn: (info: VersionInfo) => void) => fn !== updateVersion);
        };
    }, []);

    return versionInfo;
};

let zoomToolkitVersion: number = 0;
let zoomToolkitListeners: ((version: number) => void)[] = [];

export const useRegisterZoomToolkitVisibility: () => () => void = () => {
    return () => {
        zoomToolkitVersion++;
        zoomToolkitListeners.forEach((fn: (version: number) => void) => fn(zoomToolkitVersion));
    };
};

export const useZoomToolkitVisibility: () => number = (): number => {
    const [version, setVersion] = useState(zoomToolkitVersion);

    useEffect(() => {
        zoomToolkitListeners.push(setVersion);
        return () => {
            zoomToolkitListeners = zoomToolkitListeners.filter((fn: (version: number) => void) => fn !== setVersion);
        };
    }, []);

    return version;
};

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
const chartEventHandlers: {[chartId: string]: EventHandlers} = {};


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
    const id: string = chartId || 'default';

    // Initialize handlers for this chart ID if they don't exist
    if (!chartEventHandlers[id as string]) {
        chartEventHandlers[id as string] = {
            click: [],
            mouseDown: [],
            mouseMove: [],
            mouseUp: [],
            mouseWheel: [],
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
 * @param {...any} args - Additional arguments to pass to handlers
 * @returns {void}
 * @private
 */
export function callChartEventHandlers(
    eventType: EventType,
    e: MouseEvent | TouchEvent | WheelEvent,
    chart: Chart,
    ...args: (ChartEventArg | ChartLocationArg | ChartTargetArg)[]
): void {
    const chartId: string = chart && chart.element ? chart.element.id : 'default';

    // Call handlers registered for this specific chart
    if (chartEventHandlers[chartId as string] && Object.prototype.hasOwnProperty.call(chartEventHandlers[chartId as string], eventType)) {
        for (const handler of chartEventHandlers[chartId as string][eventType as string]) {
            handler(e, chart, ...args);
        }
    }

    // Also call default handlers for backward compatibility
    if (chartId !== 'default' && chartEventHandlers['default'] &&
        Object.prototype.hasOwnProperty.call(chartEventHandlers['default'], eventType)) {
        for (const handler of chartEventHandlers['default'][eventType as string]) {
            handler(e, chart, ...args);
        }
    }
}

// Shorthand for zoom rect setter (keeping for backward compatibility)
let zoomRectSetter: ((rect: JSX.Element | null) => void) | null = null;
/**
 * Registers a function to set the zoom rectangle
 *
 * @param {Function} setter - Function to set the zoom rectangle
 * @returns {void}
 * @private
 */
export function registerZoomRectSetter(setter: (rect: JSX.Element | null) => void): void {
    zoomRectSetter = setter;
}

/**
 * Returns the current zoom rectangle setter
 *
 * @returns {Function|null} The current zoom rectangle setter or null
 * @private
 */
export function getZoomRectSetter(): ((rect: JSX.Element | null) => void) | null {
    return zoomRectSetter;
}

const axisVersion: { [chartId: string]: number } = {};
let axisListeners: ((info: VersionInfo) => void)[] = [];

export const useRegisterAxesRender: () => (chartId?: string) => void = () => {
    return (chartId?: string) => {
        const id: string = chartId || 'default';

        if (!axisVersion[id as string]) {
            axisVersion[id as string] = 0;
        }

        axisVersion[id as string]++;
        axisListeners.forEach((fn: (info: VersionInfo) => void) => fn({ version: axisVersion[id as string], id }));
    };
};

export const useAxesRendereVersion: (chartId?: string) => VersionInfo = (chartId?: string) => {
    const id: string = chartId || 'default';

    if (axisVersion[id as string] === undefined) {
        axisVersion[id as string] = 0;
    }

    const [versionInfo, setVersionInfo] = useState<VersionInfo>({
        version: axisVersion[id as string] || 0,
        id
    });

    useEffect(() => {
        const updateVersion: (info: VersionInfo) => void = (info: VersionInfo) => {
            // Update when any version changes - components can check the ID
            setVersionInfo(info);
        };

        axisListeners.push(updateVersion);
        return () => {
            axisListeners = axisListeners.filter((fn: (info: VersionInfo) => void) => fn !== updateVersion);
        };
    }, []);

    return versionInfo;
};

const legendShapeVersions: {[chartId: string]: number} = {};
let legendShapeListeners: ((info: VersionInfo) => void)[] = [];

/**
 * Hook to register legend shape change trigger function
 *
 * @returns {Function} Function to trigger legend shape updates
 */
export const useRegisterLegendShapeRender: () => (chartId?: string) => void = () => {
    return (chartId?: string) => {
        const id: string = chartId || 'default';

        if (!legendShapeVersions[id as string]) {
            legendShapeVersions[id as string] = 0;
        }

        legendShapeVersions[id as string]++;
        legendShapeListeners.forEach((fn: (info: VersionInfo) => void) => fn({version: legendShapeVersions[id as string], id}));
    };
};

/**
 * Hook to subscribe to legend shape changes
 *
 * @param {string} [chartId] - Optional chart ID
 * @returns {VersionInfo} The current version info for legend shape changes
 */
export const useLegendShapeRenderVersion: (chartId?: string) => VersionInfo = (chartId?: string): VersionInfo => {
    const id: string = chartId || 'default';

    if (legendShapeVersions[id as string] === undefined) {
        legendShapeVersions[id as string] = 0;
    }

    const [versionInfo, setVersionInfo] = useState<VersionInfo>({
        version: legendShapeVersions[id as string] || 0,
        id
    });

    useEffect(() => {
        const updateVersion: (info: VersionInfo) => void = (info: VersionInfo) => {
            setVersionInfo(info);
        };

        legendShapeListeners.push(updateVersion);
        return () => {
            legendShapeListeners = legendShapeListeners.filter((fn: (info: VersionInfo) => void) => fn !== updateVersion);
        };
    }, []);

    return versionInfo;
};

let axisOutSideVersion: number = 0;
let axisOutsideListeres: ((v: number) => void)[] = [];
export const useRegisterAxieOutsideRender: () => () => void = () => {
    return () => {
        axisOutSideVersion++;
        axisOutsideListeres.forEach((fn: (v: number) => void) => fn(axisOutSideVersion));
    };
};

export const useAxisOutsideRendereVersion: () => number = (): number => {
    const [version, setVersion] = useState(axisOutSideVersion);

    useEffect(() => {
        axisOutsideListeres.push(setVersion);
        return () => {
            axisOutsideListeres = axisOutsideListeres.filter((fn: (v: number) => void) => fn !== setVersion);
        };
    }, []);

    return version;
};
