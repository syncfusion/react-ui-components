// Import necessary types and modules
import { ChartBorderProps,  ChartLocationProps,  ChartSeriesProps } from '../../base/interfaces';
import { createRectOption, drawSymbol, setBorderColor, setPointColor } from '../../utils/helper';
import { createMarkerPathOption } from './MarkerBase';
import { JSX } from 'react';
import { doInitialAnimation, interpolatePathD } from './SeriesAnimation';
import { ChartMarkerShape } from '../../base/enum';
import { MarkerElementData, markerOptions, MarkerOptions, MarkerOptionsList, MarkerPosition, MarkerProperties, PathOptions, PointRenderingEvent, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { isAxisZoomed } from '../Zooming/zooming';

/**
 * Array of available marker shapes that can be used in chart series.
 */
export const markerShapes: ChartMarkerShape[] = ['Circle', 'Triangle', 'Diamond', 'Rectangle', 'Pentagon', 'InvertedTriangle', 'VerticalLine', 'Cross', 'Plus', 'HorizontalLine', 'Star'];

/**
 * Animates the marker element with easing effect.
 *
 * @param {MarkerElementData} elementData - The marker element data to show after delay
 * @param {number} delay - The delay in milliseconds before showing the marker
 * @param {number} duration - The duration of the animation in milliseconds
 * @returns {void}
 */
export const markerAnimate: (
    elementData: MarkerElementData,
    delay: number,
    duration: number
) => void = (
    elementData: MarkerElementData,
    delay: number,
    duration: number
) => {
    const originalOpacity: number = elementData.opacity !== undefined ? elementData.opacity : 1;
    elementData.opacity = 0;
    setTimeout(() => {
        elementData.opacity = originalOpacity;
    }, delay - duration / 10);
};

/**
 * Responsible for rendering and animating data point markers in chart series
 *
 * The MarkerRenderer handles:
 * - Creating SVG elements for markers
 * - Positioning markers at the correct data points
 * - Applying proper styling (fill, stroke, shape)
 * - Animating markers when data changes
 * - Managing marker visibility and clipping
 * - Supporting custom point rendering through callbacks
 */
export const MarkerRenderer: {
    markerElementsMap: Map<string, Element[]>;
    render: (series: SeriesProperties ) => {
        options: Object;
        symbolGroup: Object;
        markerOptionsList: Object[];
    };
    createElement(series: SeriesProperties): {
        options: Object;
        symbolGroup: Object;
    };
    renderMarker(series: SeriesProperties, point: Points,
        location: ChartLocationProps, index: number, symbolGroup: Object): Element | undefined;
    doMarkerAnimation(series: SeriesProperties): void;
    updateMarkerClipRect(series: SeriesProperties, progress: number): void;
    getInitialClipPath(series: SeriesProperties): string;

} = {
    /**
     * Map to store marker elements for each series.
     * The key is a combination of chart element ID and series index.
     */
    markerElementsMap: new Map<string, Element[]>(),
    /**
     * Renders markers for all visible points in a series.
     *
     * @param {SeriesProperties} series - The series containing the points
     * @returns {Object} An object containing options, symbol group, and marker options list
     */
    render: (series: SeriesProperties) => {
        const markerOptionsList: Object[] = [];
        const { options, symbolGroup } = MarkerRenderer.createElement(series);
        const seriesKey: string = `${series.chart.element.id}_${series.index}`;
        const markerElements:  Element[] = [];

        // Use visiblePoints for consistent indexing with animation
        const pointsToProcess: Points[] = series.visiblePoints as Points[];

        for (const point of pointsToProcess) {
            void (point.visible && point.symbolLocations?.length &&
                point.symbolLocations.forEach((location: ChartLocationProps, index: number) => {
                    const markerOptions: Element | undefined = series.marker?.shape !== 'None'
                        ? MarkerRenderer.renderMarker(series, point, location, index, symbolGroup)
                        : undefined;

                    void (markerOptions && (
                        markerOptionsList.push(markerOptions),
                        markerElements.push(markerOptions)
                    ));
                })
            );
        }

        MarkerRenderer.markerElementsMap.set(seriesKey, markerElements);
        void (series.marker!.shape && (markerOptionsList as Object[]).push(series.marker!.shape));

        void (series.animation?.enable && MarkerRenderer.doMarkerAnimation(series));
        return { options, symbolGroup, markerOptionsList };
    },


    /**
     * Creates the base elements needed for marker rendering.
     *
     * @param {SeriesProperties} series - The series for which to create elements
     * @returns {Object} An object containing options and symbol group for the markers
     */
    createElement(series: SeriesProperties): { options: Object; symbolGroup: Object } {
        const marker: MarkerProperties = series.marker as MarkerProperties;
        const explodeValue: number = ((marker.border?.width as number) + (series.chart.zoomRedraw &&
            isAxisZoomed(series.chart.axisCollection) ? 0 : 8 + 5));
        const index: number | string = series.index as number;
        let options: Object = {};
        let symbolGroup: Object = {};
        const transform: string = 'translate(' + series.clipRect?.x + ',' + (series.clipRect?.y) + ')';

        void (marker.visible && (
            ((markerHeight: number, markerWidth: number) => {
                options = createRectOption(
                    series.chart.element.id + '_ChartMarkerClipRect_' + index,
                    'transparent',
                    { width: 1, color: 'Gray' },
                    1,
                    {
                        x: -markerWidth,
                        y: -markerHeight,
                        width: series.clipRect!.width + (markerWidth * 2),
                        height: series.clipRect!.height + markerHeight * 2
                    },
                    0,
                    0,
                    '',
                    series.marker?.border?.dashArray
                );

                symbolGroup = {
                    'id': series.chart.element.id + 'SymbolGroup' + index,
                    'transform': transform,
                    'clip-path': 'url(#' + series.chart.element.id + '_ChartMarkerClipRect_' + index + ')'
                };
            })(((marker.height!) + explodeValue) / 2, ((marker.width!) + explodeValue) / 2)
        ));

        return { options, symbolGroup };
    },


    /**
     * Renders a single marker for a data point.
     *
     * @param {SeriesProperties} series - The series containing the point
     * @param {Points} point - The data point for which to render a marker
     * @param {ChartLocationProps} location - The location where the marker should be rendered
     * @param {number} index - The index of the location when multiple locations exist
     * @param {Object} symbolGroup - The SVG group element where the marker will be added
     * @returns {Element|undefined} The marker element or undefined if marker is cancelled or not rendered
     */
    renderMarker(
        series: SeriesProperties,
        point: Points,
        location: ChartLocationProps,
        index: number,
        symbolGroup: SVGGElement
    ): Element | undefined { const seriesIndex: number | string = series.index as number;
        const marker: MarkerProperties = series.marker as MarkerProperties;
        series.marker!.shape = series.marker!.shape ? series.marker!.shape : markerShapes[seriesIndex as number % 10];

        const border: ChartBorderProps = {
            color: marker.border!.color,
            width: marker.border!.width
        };
        const borderColor: string = marker.border!.color as string;

        location.x = location.x + (marker.offset?.x as number);
        location.y = location.y - (marker.offset?.y as number);
        const fill: string = marker.fill || ((series.marker!.filled) ? point.interior || series.interior : '#ffffff');
        let markerElementOptions: Element | undefined = undefined;
        const parentElement: Element = symbolGroup;
        border.color = borderColor || setPointColor(point, series.interior);
        const symbolId: string = series.chart.element.id + '_Series_' + seriesIndex + '_Point_'
    + (point.index) + '_Symbol' + (index);

        const argsData: PointRenderingEvent = {
            cancel: false,
            seriesName: series.name as string,
            point: point,
            fill: fill,
            border: {
                color: border.color,
                width: border.width
            },
            markerHeight: marker.height,
            markerWidth: marker.width,
            markerShape: marker.shape as ChartMarkerShape
        };
        argsData.border = setBorderColor(point, { width: argsData.border.width, color: argsData.border.color });
        void (!series.isRectSeries && (point.color = argsData.fill));

        const markerFill: string = argsData.fill;
        const markerBorder: ChartBorderProps = { color: argsData.border.color, width: argsData.border.width };
        const markerWidth: number = argsData.markerWidth as number;
        const markerHeight: number = argsData.markerHeight as number;
        const markerOpacity: number = marker.opacity as number;
        const markerShape: ChartMarkerShape = argsData.markerShape as ChartMarkerShape;
        const imageURL: string = marker.imageUrl as string;

        const shapeOption: PathOptions = createMarkerPathOption(
            symbolId, markerFill, markerBorder.width as number, markerBorder.color as string, markerOpacity, series.marker?.border!.dashArray as string, ''
        );

        void ((parentElement !== undefined && parentElement !== null) && (() => {
            markerElementOptions = drawSymbol(
                location, markerShape,
                { width: markerWidth, height: markerHeight },
                imageURL, shapeOption
            );
        })());
        if (markerElementOptions) {
            (markerElementOptions as any).pointIndex = point.index;
        }
        point.marker = {
            border: markerBorder,
            fill: markerFill,
            height: markerHeight,
            visible: true,
            shape: markerShape,
            width: markerWidth,
            imageUrl: imageURL
        };

        return markerElementOptions;
    },

    /**
     * Performs animation for all markers in a series.
     * For line series, markers are animated sequentially based on their distance.
     *
     * @param {SeriesProperties} series - The series containing the markers to animate
     * @returns {void} Nothing is returned
     */
    doMarkerAnimation(series: SeriesProperties): void {
        if (series.propsChange || series.isLegendClicked || series.skipMarkerAnimation) {
            return;
        }

        // Store animation progress for this series in the series object
        if (!series.markerAnimationProgress) {
            series.markerAnimationProgress = 0;
        }
        series.markerClipPath = MarkerRenderer.getInitialClipPath(series);
        const animationDelay: number = series.animation?.delay ?? 0;
        const animationDuration: number = series.animation?.duration as number;

        // Start the clipRect animation
        const startTime: number = performance.now();

        const animateClipRect: (currentTime: number) => void = (currentTime: number) => {
            const elapsed: number = currentTime - startTime - animationDelay;

            if (elapsed < 0) {
                requestAnimationFrame(animateClipRect);
                return;
            }

            const progress: number = Math.min(elapsed / animationDuration, 1);
            series.markerAnimationProgress = progress;

            // Update the marker clipRect based on animation progress
            MarkerRenderer.updateMarkerClipRect(series, progress);

            if (progress < 1) {
                requestAnimationFrame(animateClipRect);
            }
        };

        requestAnimationFrame(animateClipRect);
    },

    /**
     * Returns the initial CSS clip-path value for a chart series,
     * used to hide the series before animation begins.
     *
     * @param {SeriesProperties} series - The series configuration containing chart and axis properties.
     * @returns {string} A CSS clip-path string that hides the series initially.
     */
    getInitialClipPath(series: SeriesProperties): string {
        const isTransposed: boolean = series.chart?.iSTransPosed ?? false;
        const isXAxisInverse: boolean = series.xAxis?.isAxisInverse ?? false;
        const isYAxisInverse: boolean = series.yAxis?.isAxisInverse ?? false;

        if (!isTransposed) {
            // Normal orientation - hide all by clipping horizontally
            if (isXAxisInverse) {
                return 'inset(0 0 0 100%)'; // Hide from left
            } else {
                return 'inset(0 100% 0 0)'; // Hide from right
            }
        } else {
            // Inverted orientation - hide all by clipping vertically
            // **KEY FIX: Transposed mode - hide all by clipping vertically**
            if (isYAxisInverse) {
                return 'inset(100% 0 0 0)'; // Hide from top
            } else {
                return 'inset(0 0 100% 0)'; // Hide from bottom
            }
        }
    },

    /**
     * Updates the clip-path of markers in a chart series based on animation progress.
     * This function ensures that markers are revealed progressively during animation.
     *
     * @param {SeriesProperties} series - The series configuration containing visible points.
     * @param {number} progress - A value between 0 and 1 indicating animation progress.
     * @returns {void} Nothing is returned.
     */
    updateMarkerClipRect(series: SeriesProperties, progress: number): void {
        if (!series.visiblePoints || series.visiblePoints.length === 0) {
            return;
        }

        // Get all marker positions
        const markerPositions: ChartLocationProps[] = [];
        series.visiblePoints.forEach((point: Points) => {
            if (point.visible && point.symbolLocations?.length) {
                markerPositions.push(...point.symbolLocations);
            }
        });

        if (markerPositions.length === 0) {
            return;
        }
        if (progress >= 1) {
            series.markerClipPath = undefined; // Remove clipPath completely
            return;
        }

        // Calculate the range of marker positions
        const xCoords: number[] = markerPositions.map((pos: ChartLocationProps) => pos.x);
        const yCoords: number[] = markerPositions.map((pos: ChartLocationProps) => pos.y);

        const minX: number = Math.min(...xCoords);
        const maxX: number = Math.max(...xCoords);
        const minY: number = Math.min(...yCoords);
        const maxY: number = Math.max(...yCoords);

        const isInverted: boolean = series.chart?.requireInvertedAxis ?? false;
        const isXAxisInverse: boolean = series.xAxis?.isAxisInverse ?? false;
        const isYAxisInverse: boolean = series.yAxis?.isAxisInverse ?? false;

        // Calculate animated clip dimensions
        let clipPath: string = '';

        if (!isInverted) {
            // Normal orientation - clip horizontally
            const range: number = maxX - minX;
            const animWidth: number = range * progress;

            if (isXAxisInverse) {
                // X-axis inverted - animate from right to left
                clipPath = `inset(0 0 0 ${range - animWidth}px)`;
            } else {
                // X-axis normal - animate from left to right
                clipPath = `inset(0 ${range - animWidth}px 0 0)`;
            }
        } else {
            // Inverted orientation - clip vertically
            const range: number = maxY - minY;
            const animHeight: number = range * progress;

            if (isYAxisInverse) {
                // Y-axis inverted - animate from top to bottom
                clipPath = `inset(${Math.max(0, range - animHeight)}px 0 0 0)`;
            } else {
                // Y-axis normal - animate from bottom to top
                clipPath = `inset(${Math.max(0, range - animHeight)}px 0 0 0)`;
            }
        }

        // Store the clip path in the series for use in renderMarkerJSX
        series.markerClipPath = clipPath;
    }

};



/**
 * Renders marker elements as React JSX components.
 *
 * @param {MarkerProperties[]} marker - Array containing marker options
 * @param {number} index - The index of the marker in the array
 * @param {number} animationProgress - The progress of the animation (optional).
 * @param {string} seriesType - The type of the series (optional).
 * @param {string} chartElementId - The ID of the chart element (optional).
 * @returns {JSX.Element | null} React JSX element for rendering markers
 */
/**
 * Track previous marker positions for smooth transitions
 * Maps chart and series ids to marker positions
 */
/**
 * Global store for tracking marker positions across chart animations
 * This ensures markers can follow the exact same path as their series
 */
export const previousMarkerPositions: Map<string, Map<string, MarkerPosition[]>> = new Map<string, Map<string, MarkerPosition[]>>();

/** Sanitizes and returns a valid path 'd' attribute string.
 *
 * @param {string} d - The input path 'd' attribute string to sanitize.
 * @returns {string} The sanitized path 'd' attribute string.
 * @private
 */
export function sanitizePathD(d: string): string {
    if (!d || typeof d !== 'string') {return ''; }

    let cleaned: string = d.replace(/[^MLHVCSQTAZmlhvcsqtaz0-9eE.,\s-]/g, '');
    cleaned = cleaned.replace(/[-+]?\d*\.?\d+e[-+]?\d+/gi, '0');
    cleaned = cleaned.replace(/([a-zA-Z])(?=\d)/g, '$1 ');
    cleaned = cleaned.replace(/(\d)(?=[a-zA-Z])/g, '$1 ');

    return cleaned.replace(/\s+/g, ' ').trim();
}

export function formatAccessibilityDescription(point: Points, series: ChartSeriesProps): string {
    const format: string = series.accessibility?.descriptionFormat as string;
    return format
        .replace('${series.name}', series && series.name ? series.name : '')
        .replace('${point.x}', point && point.x ? point.x.toString() : '')
        .replace('${point.y}', point && point.y ? point.y.toString() : '');
}

/**
 * Renders marker elements as React JSX components.
 *
 * This function creates SVG elements for each marker in a chart series, handling
 * proper positioning, animation, and transitions between states.
 *
 * @param {MarkerProperties[]} marker - Array of marker configuration objects
 * @param {number} _seriesIndexes - Index of the series in the chart
 * @param {number} [animationProgress=1] - Animation progress value between 0 and 1
 * @param {string} [seriesType] - Type of series (Line, Bar, Scatter, etc.)
 * @param {string} [chartElementId] - Unique identifier of the chart element
 * @param {boolean} [propsChange] - Whether the component props have changed
 * @param {SeriesProperties} [series] - Series properties object
 * @param {number} [addProgress] - Animation progress for adding new points
 * @param {number} [removeProgress] - Animation progress for removing points
 * @returns {JSX.Element | null} React JSX element for rendering markers or null if no markers
 *
 */
export const renderMarkerJSX: (
    marker: MarkerProperties[],
    seriesIndexes: number,
    animationProgress?: number,
    seriesType?: string,
    chartElementId?: string,
    propsChange?: boolean,
    series?: SeriesProperties,
    addProgress?: number,
    removeProgress?: number
) => JSX.Element | null = (
    marker: MarkerProperties[],
    _seriesIndexes: number,
    animationProgress: number = 1,
    seriesType?: string,
    chartElementId?: string,
    propsChange?: boolean,
    series?: SeriesProperties,
    addProgress: number = animationProgress,
    removeProgress: number = animationProgress
): JSX.Element | null => {
    if (!marker || marker.length === 0 ) { return null; }
    if (!series?.marker?.visible && seriesType !== 'Bubble' && seriesType !== 'Scatter') {
        return null;
    }
    // Get or initialize positions map for this chart
    const chartKey: string = chartElementId as string;
    const chartPositions: Map<string, MarkerPosition[]> =
        previousMarkerPositions.get(chartKey) ||
        (() => {
            const newMap: Map<string, MarkerPosition[]> = new Map<string, MarkerPosition[]>();
            previousMarkerPositions.set(chartKey, newMap);
            return newMap;
        })();

    return (
        <>
            {marker.map((markerData: MarkerProperties, seriesIndex: number) => {
                if (!markerData) { return null; }
                const clipPathUrl: string = seriesType === 'Bubble'
                    ? `url(#${chartElementId}_ChartSeriesClipRect_${seriesIndex})`
                    : `url(#${markerData.options?.id})`;

                // Get the current series to check for marker animation progress
                const currentSeries: SeriesProperties | undefined = series;
                const isInitialAnimation: boolean | undefined = currentSeries?.animation?.enable &&
                    !propsChange &&
                    !currentSeries?.isLegendClicked &&
                    !currentSeries?.skipMarkerAnimation;

                return (
                    <g key={seriesIndex} id={markerData.symbolGroup?.id}
                        transform={markerData.symbolGroup?.transform}
                        clipPath={clipPathUrl}
                        style={{
                            clipPath: (isInitialAnimation && currentSeries?.markerClipPath && animationProgress < 1)
                                ? currentSeries.markerClipPath
                                : undefined
                        }}>
                        <defs>
                            <clipPath id={markerData.options?.id}>
                                <rect
                                    id={markerData.options?.id + '_Rect'}
                                    opacity={markerData.options?.opacity}
                                    fill={markerData.options?.fill}
                                    stroke={markerData.options?.stroke}
                                    strokeWidth={markerData.options?.strokeWidth}
                                    y={markerData.options?.y}
                                    x={markerData.options?.x}
                                    height={markerData.options?.height}
                                    width={markerData.options?.width}
                                    rx={markerData.options?.rx}
                                    ry={markerData.options?.ry}
                                    transform={markerData.options?.transform}
                                />
                            </clipPath>
                        </defs>
                        {markerData.markerOptionsList && markerData.markerOptionsList.length > 0 &&
                        markerData.markerOptionsList.map((option: MarkerOptions, markerIndex: number) => {
                            const markerOptionsLength: number = markerData.markerOptionsList?.length as number;
                            const lastMarkerOption: MarkerOptions | undefined = markerData.markerOptionsList?.[markerOptionsLength - 1];
                            const shape: string = typeof lastMarkerOption === 'string' ? lastMarkerOption :
                                (lastMarkerOption?.shape as string);
                            let seriesIndexes: number = seriesIndex; // fallback to loop index
                            let pointIndex: number = markerIndex; // fallback to marker index
                            if (option.id) {
                                const match: RegExpMatchArray = option.id.match(/_Series_(\d+)_Point_(\d+)_/) as RegExpMatchArray;
                                if (match) {
                                    seriesIndexes = parseInt(match[1], 10);
                                    pointIndex = parseInt(match[2], 10);
                                }
                            }
                            // Create a unique key for the marker to track its position using extracted indices
                            const markerKey: string = `${seriesIndexes}_${pointIndex}`;


                            // Get current position
                            const currentCx: number = option.cx as number;
                            const currentCy: number = option.cy as number;

                            // Get previous position
                            let previousCx: number = option.previousCx as number;
                            let previousCy: number = option.previousCy as number;
                            const getEasingPower: (type?: string) => number = (type?: string): number => {
                                const QUADRATIC_EASING: number = 2.0; // Strong acceleration/deceleration for sharp movements
                                const LINEAR_EASING: number = 1.0;    // Smooth consistent motion
                                const MEDIUM_EASING: number = 1.5;    // Moderate acceleration/deceleration
                                // Different easing powers for different series types
                                switch (type?.toLowerCase()) {
                                case 'line':
                                case 'stepline':
                                case 'bar':
                                case 'column':
                                    return QUADRATIC_EASING;
                                case 'spline':
                                case 'splinearea':
                                    return LINEAR_EASING; // Linear movement for naturally smooth curves

                                case 'area':
                                    return MEDIUM_EASING; // Middle ground easing

                                default:
                                    return LINEAR_EASING; // Default linear easing
                                }
                            };

                            // Get the appropriate easing power for this series
                            const easingPower: number = getEasingPower(seriesType);

                            // If no previous explicit position, check our tracking map
                            if (previousCx === undefined || previousCy === undefined) {
                                const seriesPositions: markerOptions[] | undefined = chartPositions.get(markerKey);
                                if (seriesPositions && seriesPositions[markerIndex as number]) {
                                    const pos: markerOptions = seriesPositions[markerIndex as number];
                                    previousCx = pos.cx;
                                    previousCy = pos.cy;

                                    if (pos.cx === undefined && pos.cy === undefined && series?.isPointAdded) {
                                        series.isPointRemoved = false;
                                        if (marker && marker[seriesIndex as number] &&
                                            (marker[seriesIndex as number] as
                                                { markerOptionsList: MarkerOptions[] }).markerOptionsList) {
                                            const markerObj: {
                                                markerOptionsList: MarkerOptions[];
                                            } = marker[seriesIndex as number] as { markerOptionsList: MarkerOptions[] };
                                            if (markerObj.markerOptionsList && markerObj.markerOptionsList.length >= 3) {
                                                const seriesPositionsAdd: MarkerPosition[] = chartPositions.get(`${seriesIndex}_${pointIndex - 1}`) as MarkerPosition[];
                                                previousCx = shape === 'Circle' ? seriesPositionsAdd[pointIndex - 1]?.cx as number : 0;
                                                previousCy =
                                                   shape === 'Circle' ?  seriesPositionsAdd[pointIndex - 1]?.cy as number : 0;
                                            }
                                        }
                                    }
                                    else if (series?.isPointRemoved) {
                                        series.isPointAdded = false;
                                        const seriesIdx: number = seriesIndex;
                                        const markerList: MarkerOptionsList | undefined = marker && marker[seriesIdx as number] &&
                                        (marker[seriesIdx as number]).markerOptionsList;
                                        const markerOpt: MarkerOptions | undefined = markerList &&
                                         markerList[markerIndex as number] as MarkerOptions;
                                        const pointIdx: number = markerOpt?.pointIndex as number;
                                        const seriesMap: MarkerPosition[] | undefined = chartPositions.get(`${seriesIdx}_${pointIdx as number + 1}`);
                                        if (
                                            typeof pointIdx === 'number' &&
                                            seriesMap &&
                                            seriesMap[`${pointIdx + 1}`]
                                        ) {
                                            let pos: markerOptions = seriesMap[`${pointIdx + 1}`];
                                            previousCx = pos?.cx;
                                            previousCy = pos?.cy;
                                            if (previousCx === undefined) {
                                                pos = seriesMap[`${pointIdx}`];
                                                previousCx = pos?.cx;
                                                previousCy = pos?.cy;
                                            }
                                        }
                                    }
                                }
                            }

                            let progressValue: number = animationProgress;
                            if (series?.isPointAdded) {progressValue = addProgress; }
                            else if (series?.isPointRemoved) {progressValue = removeProgress; }
                            let cx: number = 0;
                            let cy: number = 0;

                            if ((series?.type === 'Scatter' || series?.type === 'Bubble') && series.isLegendClicked) {
                                cx = currentCx;
                                cy = currentCy;
                            } else {
                                cx = previousCx !== undefined && !propsChange
                                    ? previousCx + (currentCx - previousCx) * Math.pow(progressValue,
                                                                                       series?.isPointAdded ||
                                            series?.isPointRemoved ? 1 : easingPower)
                                    : currentCx;

                                cy = previousCy !== undefined && !propsChange
                                    ? (previousCy + (currentCy - previousCy) * Math.pow(progressValue,
                                                                                        series?.isPointAdded || series?.isPointRemoved ? 1 :
                                                                                            easingPower)) as number
                                    : currentCy as number;
                            }


                            const currentD: string = option.d as string;
                            // Get previous path data
                            let previousD: string = '';

                            previousD = chartPositions.get(markerKey)?.[markerIndex as number]?.d as string ?? previousD;

                            // Store current position and path for future animations if animation is complete
                            if (animationProgress === 1 && series) {
                                void (chartPositions.has(markerKey) ? null : chartPositions.set(markerKey, []));
                                const positions: markerOptions[] = chartPositions.get(markerKey)!;
                                positions[markerIndex as number] = {
                                    cx: currentCx,
                                    cy: currentCy,
                                    d: currentD,
                                    pathShape: shape as string
                                };
                                if (series?.isPointRemoved) {
                                    series.isPointAdded = false;
                                    series.isPointRemoved = false;
                                }
                            }
                            let animatedOpacity: number = option.opacity;
                            let animatedRx: number = option.rx as number;
                            let animatedRy: number = option.ry as number;

                            if ((seriesType === 'Scatter' || seriesType === 'Bubble') &&
                                series?.animation?.enable &&
                                !propsChange &&
                                !series?.isLegendClicked &&
                                !series?.skipMarkerAnimation) {

                                const animationState: {
                                    opacity: number;
                                    scale: number;
                                } = doInitialAnimation(series, animationProgress);
                                animatedOpacity = (option.opacity as number) * animationState.opacity;
                                animatedRx = (option.rx as number) * animationState.scale;
                                animatedRy = (option.ry as number) * animationState.scale;
                            }
                            if ((shape === 'Circle' || option.shape === 'Circle') && option.d === '' && (option.href === undefined || option.href === '')) {
                                return (
                                    <ellipse
                                        key={markerIndex}
                                        id={option.id}
                                        fillOpacity={animatedOpacity}
                                        fill={option.fill}
                                        stroke={option.stroke as string}
                                        strokeWidth={option.strokeWidth as number}
                                        cx={cx}
                                        cy={cy}
                                        rx={animatedRx as number}
                                        ry={animatedRy as number}
                                        strokeDasharray={option.strokeDasharray as string}
                                        strokeOpacity={series?.type !== 'Scatter' ? animatedOpacity : 1}
                                        role="img"
                                        aria-label={(series?.type !== 'Scatter' && series?.type !== 'Bubble') && series?.points[markerIndex as number] !== undefined ? series?.accessibility?.descriptionFormat ? formatAccessibilityDescription(series.points[markerIndex as number], series) : (series?.points[markerIndex as number]?.x + ': ' + series?.points[markerIndex as number]?.y + ', ' + series?.name) : ''}
                                    />
                                );
                            } else if ((shape === 'Image' || option.shape === 'Image') && option.d === '') {
                                return (
                                    <image
                                        key={markerIndex}
                                        id={option.id}
                                        opacity={option.opacity}
                                        href={option.href as string}
                                        height={option.height as number}
                                        width={option.width as number}
                                        x={option.x as number}
                                        y={option.y as number}
                                        visibility="visible"
                                        role="img"
                                        aria-label={(series?.type !== 'Scatter' && series?.type !== 'Bubble') && series?.points[markerIndex as number] !== undefined ? series?.accessibility?.descriptionFormat ? formatAccessibilityDescription(series.points[markerIndex as number], series) : (series?.points[markerIndex as number]?.x + ': ' + series?.points[markerIndex as number]?.y + ', ' + series?.name) : ''}
                                    />
                                );
                            } else {
                                // For non-Circle shapes like Triangle, interpolate the path
                                // Get current path data
                                const previousD: string = sanitizePathD(chartPositions.get(markerKey as string)?.[markerIndex as number]?.d ?? '');
                                const currentD: string = sanitizePathD(option.d as string);
                                let interpolatedPath: string = currentD;


                                if (chartPositions.has(markerKey) && chartPositions.get(markerKey as string)?.[markerIndex as number] &&
                                 previousD !== currentD && series?.type !== 'Scatter') {

                                    interpolatedPath = interpolatePathD(previousD,
                                                                        currentD, animationProgress, series?.isLegendClicked, series?.type);
                                }
                                return (
                                    <path
                                        key={markerIndex}
                                        id={option.id}
                                        fillOpacity={animatedOpacity}
                                        fill={option.fill}
                                        stroke={option.stroke as string}
                                        strokeWidth={option.strokeWidth as number}
                                        d={interpolatedPath}
                                        strokeDasharray={option.strokeDasharray as string}
                                        strokeOpacity={series?.type !== 'Scatter' ? animatedOpacity : 1}
                                        role="img"
                                        aria-label={(series?.type !== 'Scatter' && series?.type !== 'Bubble') && series?.points[markerIndex as number] !== undefined ? series?.accessibility?.descriptionFormat ? formatAccessibilityDescription(series.points[markerIndex as number], series) : (series?.points[markerIndex as number]?.x + ': ' + series?.points[markerIndex as number]?.y + ', ' + series?.name) : ''}
                                    />
                                );
                            }
                        })}
                    </g>
                );
            })}
        </>
    );
};

export default MarkerRenderer;


