import { JSX, useEffect, useState, useMemo } from 'react';
import { ChartLocationProps, ChartZoomSettingsProps, ToolbarPosition } from '../../base/interfaces';
import { useLayout } from '../../layout/LayoutContext';
import { applyZoomToolkit, reset, togglePan, zoomIn, zoomOut } from './zooming';
import { useZoomToolkitVisibility, useRegisterZoomToolkitVisibility } from '../../hooks/useClipRect';
import { measureText } from '../../utils/helper';
import * as React from 'react';
import { Browser, IL10n, L10n } from '@syncfusion/react-base';
import { BaseZoom, Chart, Rect } from '../../chart-area/chart-interfaces';
import { ToolbarItems } from '../../base/enum';
import { TextAnchor } from '../../../common';

/**
 * Interface representing the state of the zoom tooltip
 *
 * @interface ZoomTooltipState
 * @public
 */
interface ZoomTooltipState {
    /**
     * Indicates whether the tooltip is currently visible
     *
     * @type {boolean}
     */
    visible: boolean;

    /**
     * The text content to display in the tooltip
     *
     * @type {string}
     */
    text: string;

    /**
     * The y-coordinate position of the tooltip
     *
     * @type {number}
     */
    top: number;

    /**
     * The x-coordinate position of the tooltip
     *
     * @type {number}
     */
    left: number;
}

/**
 * Type definition for toolbar item references
 *
 * @interface ToolbarRefs
 */
interface ToolbarRefs {
    rect: React.RefObject<SVGRectElement>;
    mainIcon: React.RefObject<SVGPathElement>;
    secondaryIcon: React.RefObject<SVGPolygonElement>;
}

/**
 * Configuration interface for icon rendering
 *
 * @interface IconRenderConfig
 */
interface IconRenderConfig {
    /** The unique identifier suffix for this icon */
    idSuffix: string;
    /** The path d attribute for the main icon */
    pathD: string;
    /** The polygon points for the icon (if applicable) */
    polygonPoints?: string;
    /** The fill color for the icon */
    fillColor: string;
    /** The background fill color for the icon rectangle */
    rectFill: string;
}

/**
 * Global map storing zoom tooltip states for different charts identified by their IDs
 * Each chart has its own tooltip state to handle multiple charts on same page
 *
 * @type {Object.<string, ZoomTooltipState>}
 * @private
 */
export const zoomTooltipStates: {[chartId: string]: ZoomTooltipState} = {};
/**
 * Global map storing listener functions for zoom tooltip state changes
 * Enables push-based notification when tooltip state changes
 *
 * @type {Object.<string, Array<function(ZoomTooltipState): void>>}
 * @private
 */
export const zoomTooltipListeners: {[chartId: string]: ((state: ZoomTooltipState) => void)[]} = {};

/**
 * Creates and returns a function to update zoom tooltip state for a specific chart
 *
 * @returns {Function} A function that takes ZoomTooltipState and optional chartId to update the tooltip state
 * @example
 * ```typescript
 * const updateTooltip = useRegisterZoomTooltipState();
 * updateTooltip({ visible: true, text: "Zoom In", top: 100, left: 200 }, "chart1");
 * ```
 *
 * @private
 */
export const useRegisterZoomTooltipState: () => ((state: ZoomTooltipState, chartId?: string) => void) = (): ((state: ZoomTooltipState,
    chartId?: string) => void) => {
    return (state: ZoomTooltipState, chartId?: string) => {
        const id: string = chartId as string;

        if (!zoomTooltipStates[id as string]) {
            zoomTooltipStates[id as string] = {
                visible: false,
                text: '',
                top: 0,
                left: 0
            };
        }

        zoomTooltipStates[id as string] = state;

        if (zoomTooltipListeners[id as string]) {
            zoomTooltipListeners[id as string].forEach((fn: (state: ZoomTooltipState) => void) => fn(zoomTooltipStates[id as string]));
        }
    };
};

/**
 * Hook to use zoomTooltip state for a specific chart
 *
 * @param {string} [chartId] - Optional chart ID to identify the specific chart
 * @returns {ZoomTooltipState} The current zoomTooltip state for the chart
 * @private
 */
export const useZoomTooltipState: (chartId?: string) => ZoomTooltipState = (chartId?: string): ZoomTooltipState => {
    const id: string = chartId as string;

    if (!zoomTooltipStates[id as string]) {
        zoomTooltipStates[id as string] = {
            visible: false,
            text: '',
            top: 0,
            left: 0
        };
    }

    if (!zoomTooltipListeners[id as string]) {
        zoomTooltipListeners[id as string] = [];
    }

    const [state, setState] = useState(zoomTooltipStates[id as string]);

    useEffect(() => {
        zoomTooltipListeners[id as string].push(setState);
        return () => {
            void ((zoomTooltipListeners[id as string]) && (
                zoomTooltipListeners[id as string] = zoomTooltipListeners[id as string].filter(
                    (fn: (state: ZoomTooltipState) => void) => fn !== setState
                ))
            );
        };
    }, [id as string]);

    return state;
};

/**
 * ZoomToolkit component for rendering zooming controls in a chart
 *
 * @param {ChartZoomSettingsProps} props - The zoom settings props
 * @returns {JSX.Element | null} The rendered zoom toolkit or null if not visible
 * @public
 */
export const ZoomToolkit: React.FC<ChartZoomSettingsProps> = (props: ChartZoomSettingsProps) => {
    const { layoutRef, phase } = useLayout();
    const [toolkitVisible, setToolkitVisible] = useState(false);
    const toolkitVersion: number = useZoomToolkitVisibility();
    let chart: Chart = layoutRef.current.chart as Chart;
    const zoom: BaseZoom = layoutRef.current?.chartZoom as BaseZoom;
    const chartId: string = chart?.element?.id;
    const zoomTooltipState: ZoomTooltipState = useZoomTooltipState(chartId);
    const setZoomTooltipState: ((state: ZoomTooltipState, chartId?: string) => void) = useRegisterZoomTooltipState();

    /**
     * Clear zoomTooltip when zooming state changes
     */
    useEffect(() => {
        if (!zoom?.isZoomed) {
            setZoomTooltipState({
                visible: false,
                text: '',
                top: 0,
                left: 0
            }, chartId);
        }
    }, [zoom?.isZoomed, chartId]);

    useEffect(() => {
        if (phase === 'measuring' && layoutRef.current?.chart && zoom) {
            chart = layoutRef.current.chart as Chart;
            const shouldShowToolkit: boolean = applyZoomToolkit(chart, chart.axisCollection, zoom);
            setToolkitVisible(shouldShowToolkit);
        }
    }, [phase, props.toolbar?.visible]);

    /**
     * Memoized calculation of the zoom toolkit JSX element
     * Recalculates only when relevant dependencies change to optimize performance
     *
     * @returns {JSX.Element | null} The rendered zoom toolkit or null if it shouldn't be displayed
     */
    const zoomToolkit: JSX.Element | null = useMemo(() => {
        // Cache the expensive calculations
        const shouldShowToolkit: boolean  = toolkitVisible || props.toolbar?.visible as boolean;
        const canRender: boolean  = (phase === 'rendering' && chart && zoom) as boolean;

        if (canRender && (shouldShowToolkit || applyZoomToolkit(chart, chart.axisCollection, zoom))) {
            void ((layoutRef.current?.chart) && ((layoutRef.current?.chart as Chart).zoomSettings = props));
            return renderZoomingToolkit(chart, zoom, setZoomTooltipState);
        }
        return null;
    }, [toolkitVersion, toolkitVisible, phase, props.toolbar?.position, chart, zoom]);

    /**
     * Renders a custom SVG tooltip
     *
     * @returns {JSX.Element | null} The rendered tooltip or null if not visible
     */
    const renderTooltip: () => JSX.Element | null = (): JSX.Element | null => {
        if (!zoomTooltipState || !zoomTooltipState.visible || Browser.isDevice) {
            return null;
        }
        const enableRTL: boolean = chart.enableRtl;

        const textWidth: number = measureText(zoomTooltipState.text, {
            fontSize: '10px',
            color: '',
            fontStyle: '',
            fontFamily: '',
            fontWeight: ''
        }, {
            fontSize: '10px',
            fontStyle: 'Normal',
            fontWeight: '400',
            fontFamily: 'Segoe UI',
            color: ''
        }).width;

        const paddedWidth: number = textWidth + 12; // Add padding
        const height: number = 22;
        const anchor: string = enableRTL ? 'end' : 'start';

        return (
            <g id={`${chart.element.id}_Chart_ZoomTip`} transform={`translate(${zoomTooltipState.left},${zoomTooltipState.top})`}>
                <rect
                    x="0"
                    y="0"
                    width={paddedWidth}
                    height={height}
                    rx="2"
                    ry="2"
                    fill="#FFFFFF"
                    stroke="#707070"
                    strokeWidth="1"
                />
                <text
                    x="6"
                    y={(height / 2) + 3}
                    fontSize="10px"
                    fontFamily="Segoe UI"
                    fill="black"
                    textAnchor={anchor as TextAnchor}
                >
                    {zoomTooltipState.text}
                </text>
            </g>
        );
    };

    return (phase === 'rendering') && (
        <>
            {zoomToolkit}
            {renderTooltip()}
        </>
    );
};

/**
 * Creates and shows the zooming toolkit
 *
 * @param {Chart} chart - The chart instance
 * @param {BaseZoom} zoom - The zoom controller
 * @param {Function} setZoomTooltipState - Function to update zoomTooltip state
 * @returns {JSX.Element | null} The rendered zoom toolkit or null
 * @private
 */
function renderZoomingToolkit(
    chart: Chart,
    zoom: BaseZoom,
    setZoomTooltipState: (state: ZoomTooltipState, chartId?: string) => void
): JSX.Element | null {
    const areaBounds: Rect = chart.chartAxislayout.seriesClipRect;
    if ( zoom.toolbar && chart.zoomSettings.toolbar && !zoom.toolbar.items) {
        zoom.toolbar.items  = chart.zoomSettings.toolbar.items = ['ZoomIn', 'ZoomOut', 'Pan', 'Reset'];
    }
    const position: ChartLocationProps = calculateToolbarPosition(chart, areaBounds);
    let toolboxItems: ToolbarItems[] = chart.zoomSettings.toolbar?.items as ToolbarItems[];
    toolboxItems = Browser.isDevice && toolboxItems.length > 0 ? ['Reset'] : toolboxItems;

    if (toolboxItems.length === 0) {
        return null;
    }
    const handleToolbarMouseEnter: () => void = () => {
        if (chart.tooltipRef && chart.tooltipRef.current) {
            chart.tooltipRef.current?.fadeOut();
        }
        if (chart.trackballRef && chart.trackballRef.current) {
            const childElements: HTMLCollection = chart.trackballRef.current.children as HTMLCollection;
            for (let i: number = 0; i < childElements.length; i++) {
                const element: HTMLElement = childElements[i as number] as HTMLElement;
                if (element) {
                    element.style.display = 'none';
                }
            }
        }
        chart.zoomRedraw = true;
    };

    const handleToolbarMouseLeave: () => void = () => {
        chart.zoomRedraw = false;
    };

    return (
        <g
            id={`${chart.element.id}_Zooming_KitCollection`}
            transform={`translate(${position.x},${position.y})`}
            opacity={'1'}
            cursor={'auto'}
            onMouseEnter={handleToolbarMouseEnter}
            onMouseMove={handleToolbarMouseEnter}
            onMouseLeave={handleToolbarMouseLeave}
        >
            {renderToolkitShadowEffects(chart.element.id)}
            {renderToolkitBackground(chart)}
            {toolboxItems.map((item: ToolbarItems, index: number) =>
                renderToolbarItemGroup(item, index, chart, zoom, setZoomTooltipState)
            )}
        </g>
    );
}

/**
 * Calculates the position for the toolbar
 *
 * @param {Chart} chart - The chart instance
 * @param {Rect} areaBounds - The area bounds
 * @returns {ChartLocationProps} The x and y coordinates for the toolbar
 *  @private
 */
function calculateToolbarPosition(chart: Chart, areaBounds: Rect): ChartLocationProps {
    const spacing: number = 10;
    if (chart.zoomSettings.toolbar && !chart.zoomSettings.toolbar.items) {
        chart.zoomSettings.toolbar.items = ['ZoomIn', 'ZoomOut', 'Pan', 'Reset'];
    }
    const toolboxItems: ToolbarItems[] = chart.zoomSettings.toolbar?.items as ToolbarItems[];
    const length: number = Browser.isDevice ? (toolboxItems.length === 0 ? 0 : 1) : toolboxItems.length;
    const iconSize: number = Browser.isDevice ?
        measureText('Reset Zoom', { fontSize: '12px', color: '#000000', fontStyle: 'Normal', fontFamily: 'Segoe UI', fontWeight: '400' },
                    { fontSize: '12px', fontStyle: 'Normal', color: '', fontWeight: '400', fontFamily: 'Segoe UI' }).width : 16;
    const height: number = Browser.isDevice ?
        measureText('Reset Zoom', { fontSize: '12px', color: '#000000', fontStyle: 'Normal', fontFamily: 'Segoe UI', fontWeight: '400' },
                    { fontSize: '12px', fontStyle: 'Normal', color: '', fontWeight: '400', fontFamily: 'Segoe UI' }).height : 22;
    const width: number = (length * iconSize) + ((length + 1) * spacing) + ((length - 1) * spacing);
    const position: ToolbarPosition = chart.zoomSettings.toolbar?.position ||
        { hAlign: 'Right', vAlign: 'Top', x: 0, y: 0 };

    let transX: number = 0;
    let transY: number = 0;

    // Calculate X position based on horizontal alignment
    switch (position.hAlign) {
    case 'Right':
        transX = areaBounds.x + areaBounds.width - width - spacing;
        break;
    case 'Left':
        transX = areaBounds.x + spacing;
        break;
    default:
        transX = (areaBounds.width / 2) - (width / 2) + areaBounds.x;
        break;
    }
    transX += position.x || 0;

    // Calculate Y position based on vertical alignment
    switch (position.vAlign) {
    case 'Bottom':
        transY = areaBounds.height - (areaBounds.y + height + spacing);
        break;
    case 'Top':
        transY = areaBounds.y + spacing;
        break;
    default:
        transY = (areaBounds.height / 2) - (height / 2) + areaBounds.y;
        break;
    }
    transY += position.y || 0;

    return { x: transX, y: transY };
}

/**
 * Renders the shadow effects for the toolbar
 *
 * @param {string} chartId - The ID of the chart
 * @returns {JSX.Element} The rendered shadow effects
 * @private
 */
function renderToolkitShadowEffects(chartId: string): JSX.Element {
    const filterId: string = `${chartId}_chart_shadow`;
    return (
        <defs>
            <filter id={filterId} height="130%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                <feOffset dx="-3" dy="4" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="1" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    );
}

/**
 * Renders the background of the toolkit
 *
 * @param {Chart} chart - The chart instance
 * @returns {JSX.Element} The rendered background
 */
function renderToolkitBackground(chart: Chart): JSX.Element {
    const zoomFillColor: string = '#FFFFFF';
    const spacing: number = 10;
    const toolboxItems: ToolbarItems[] = chart.zoomSettings.toolbar?.items as ToolbarItems[];
    const length: number = Browser.isDevice ? (toolboxItems.length === 0 ? 0 : 1) : toolboxItems.length;
    const iconSize: number = Browser.isDevice ?
        measureText('Reset Zoom', { fontSize: '12px', color: '#000000', fontStyle: 'Normal', fontFamily: 'Segoe UI', fontWeight: '400' },
                    { fontSize: '12px', fontStyle: 'Normal', color: '', fontWeight: '400', fontFamily: 'Segoe UI' }).width : 16;
    const height: number = Browser.isDevice ?
        measureText('Reset Zoom', { fontSize: '12px', color: '#000000', fontStyle: 'Normal', fontFamily: 'Segoe UI', fontWeight: '400' },
                    { fontSize: '12px', fontStyle: 'Normal', color: '', fontWeight: '400', fontFamily: 'Segoe UI' }).height : 22;
    const width: number = (length * iconSize) + ((length + 1) * spacing) + ((length - 1) * spacing);
    const filterId: string = `${chart.element.id}_chart_shadow`;

    return (
        <>
            <rect
                id={`${chart.element.id}_Zooming_Rect`}
                fill={zoomFillColor}
                stroke="transparent"
                strokeWidth="1"
                opacity="1"
                x="0"
                y="0"
                width={width}
                height={height + (spacing * 2)}
                rx="4"
                ry="4"
                transform=""
            />
            <rect
                id={`${chart.element.id}_Zooming_Rect_Shadow`}
                fill={zoomFillColor}
                stroke="transparent"
                strokeWidth="1"
                opacity="0.1"
                x="0"
                y="0"
                width={width}
                height={height + (spacing * 2)}
                rx="4"
                ry="4"
                transform=""
                filter={`url(#${filterId})`}
            />
        </>
    );
}

/**
 * Renders a toolbar item group
 *
 * @param {ToolbarItems} item - The toolbar item to render
 * @param {number} index - The index of the toolbar item
 * @param {Chart} chart - The chart instance
 * @param {BaseZoom} zoom - The zoom controller
 * @param {Function} setZoomTooltipState - Function to update zoom tooltip state
 * @returns {JSX.Element} The rendered toolbar item group
 */
function renderToolbarItemGroup(
    item: ToolbarItems,
    index: number,
    chart: Chart,
    zoom: BaseZoom,
    setZoomTooltipState: (state: ZoomTooltipState, chartId?: string) => void
): JSX.Element {
    // Each icon should be placed with proper spacing
    const xPosition: number = 10 + (index * 36); // 36px between icons
    const yPosition: number = 10 + 3; // Adjusted position
    const chartId: string = chart.element.id;

    // Create refs for this toolbar item
    const rectRef: React.RefObject<SVGRectElement | null> = React.createRef<SVGRectElement>();
    const mainIconRef: React.RefObject<SVGPathElement | null> = React.createRef<SVGPathElement>();
    const secondaryIconRef: React.RefObject<SVGPolygonElement | null> = React.createRef<SVGPolygonElement>();
    const refs: {
        rect: React.RefObject<SVGRectElement>;
        mainIcon: React.RefObject<SVGPathElement>;
        secondaryIcon: React.RefObject<SVGPolygonElement>;
    } = {
        rect: rectRef as React.RefObject<SVGRectElement>,
        mainIcon: mainIconRef as React.RefObject<SVGPathElement>,
        secondaryIcon: secondaryIconRef as React.RefObject<SVGPolygonElement>
    };

    // Event handlers for this toolbar item
    const handleMouseOver: (e: React.MouseEvent) => void = (e: React.MouseEvent) =>
        handleZoomTooltipShow(e, item, refs, setZoomTooltipState, chartId, chart);
    const handleMouseOut: () => void = () => handleZoomTooltipHide(refs, zoom, chart);
    const handleClick: (e: React.MouseEvent) => void = (e: React.MouseEvent) => {
        // Then process the normal click event
        handleToolbarClick(item, chart, zoom)(e);
    };
    const opacity: number = item === 'ZoomIn' ? 1 : zoom.isZoomed ? 1 : 0.2;

    return (
        <g
            key={item}
            transform={`translate(${xPosition},${yPosition})`}
            id={`${chart.element.id}_Zooming_${item}`}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onClick={handleClick}
            tabIndex={0}
            role="button"
            aria-label={getZoomTooltipText(item, chart.locale)}
            cursor="pointer"
            opacity={opacity}
            style={{ outline: 'none' }}
        >
            {renderToolbarItemIcon(item, chart, zoom, refs)}
        </g>
    );
}

/**
 * Handles showing the zoom tooltip
 *
 * @param {React.MouseEvent} e - The mouse event
 * @param {ToolbarItems} item - The toolbar item
 * @param {Object} refs - References to SVG elements
 * @param {React.RefObject<SVGRectElement>} refs.rect - Reference to the rectangle SVG element
 * @param {React.RefObject<SVGPathElement>} refs.mainIcon - Reference to the path SVG element
 * @param {React.RefObject<SVGPolygonElement>} refs.secondaryIcon - Reference to the polygon SVG element
 * @param {Function} setZoomTooltipState - Function to update zoom tooltip state
 * @param {string} chartId - The chart ID
 * @param {Chart} chart - The chart instance
 * @returns {void} This function doesn't return a value
 * @private
 */
export function handleZoomTooltipShow(
    e: React.MouseEvent,
    item: ToolbarItems,
    refs: ToolbarRefs,
    setZoomTooltipState: (state: ZoomTooltipState, chartId?: string) => void,
    chartId: string,
    chart: Chart
): void {
    const text: string = getZoomTooltipText(item, chart.locale);
    const textWidth: number = measureText(text, {
        fontSize: '10px',
        color: '',
        fontStyle: '',
        fontFamily: '',
        fontWeight: ''
    }, {
        fontSize: '10px', fontStyle: 'Normal', fontWeight: '400', fontFamily: 'Segoe UI',
        color: ''
    }).width;

    const chartRect: DOMRect = getChartRect(e.currentTarget as Element);
    chart.zoomRedraw = true;
    if (chart.tooltipRef && chart.tooltipRef.current) {
        chart.tooltipRef.current?.fadeOut();
    }
    if (chart.trackballRef && chart.trackballRef.current) {
        const childElements: HTMLCollection = chart.trackballRef.current.children as HTMLCollection;
        for (let i: number = 0; i < childElements.length; i++) {
            const element: HTMLElement = childElements[i as number] as HTMLElement;
            if (element) {
                element.style.display = 'none';
            }
        }
    }
    const left: number = e.clientX - chartRect.left - (textWidth + 5);
    const top: number = e.clientY - chartRect.top + 20;

    // Show zoomTooltip
    setZoomTooltipState({
        visible: true,
        text,
        top,
        left
    }, chartId);

    // Apply hover styles using refs
    void ((!Browser.isDevice) && (applyHoverStyles(refs)));
}

/**
 * Safely retrieves the bounding client rectangle of a chart element
 * Handles null checks and provides fallback when elements can't be found
 *
 * @param {Element} element - The DOM element to get bounds from
 * @returns {DOMRect} The bounding client rectangle or a default empty rectangle
 */
function getChartRect(element: Element): DOMRect {
    try {
        const svgElement: SVGSVGElement = element.closest('svg') as SVGSVGElement;
        if (!svgElement || !svgElement.parentElement) {
            return new DOMRect(0, 0, 0, 0);
        }
        return svgElement.parentElement.getBoundingClientRect();
    } catch (error) {
        console.warn('Failed to get chart bounds:', error);
        return new DOMRect(0, 0, 0, 0);
    }
}

/**
 * Applies hover styles to toolbar item references
 *
 * @param {ToolbarRefs} refs - The references to SVG elements
 * @returns {void}
 */
function applyHoverStyles(refs: ToolbarRefs): void {
    // Apply hover styles using refs
    void (refs.rect.current && refs.rect.current.setAttribute('fill', '#f5f5f5'));

    void (refs.mainIcon.current && refs.mainIcon.current.setAttribute('fill', '#0075ff'));

    void (refs.secondaryIcon.current && refs.secondaryIcon.current.setAttribute('fill', '#0075ff'));
}

/**
 * Handles hiding the zoom tooltip
 *
 * @param {Object} refs - Object containing references to SVG elements
 * @param {React.RefObject<SVGRectElement>} refs.rect - Reference to the rectangle SVG element
 * @param {React.RefObject<SVGPathElement>} refs.mainIcon - Reference to the path SVG element
 * @param {React.RefObject<SVGPolygonElement>} refs.secondaryIcon - Reference to the polygon SVG element
 * @param {BaseZoom} zoom - The zoom controller
 * @param {Chart} chart - The chart instance
 * @returns {void} This function doesn't return a value
 */
function handleZoomTooltipHide(
    refs: {
        rect: React.RefObject<SVGRectElement>;
        mainIcon: React.RefObject<SVGPathElement>;
        secondaryIcon: React.RefObject<SVGPolygonElement>;
    },
    zoom: BaseZoom,
    chart: Chart
): void {
    // Get chart ID
    const chartId: string = chart?.element?.id;

    // Directly call the tooltip state updater to hide the tooltip
    // This is the key fix - make sure we use the proper function to update state
    if (zoomTooltipListeners[chartId as string]) {
        const updatedState: ZoomTooltipState = {
            visible: false,
            text: '',
            top: 0,
            left: 0
        };

        // Update the stored state
        zoomTooltipStates[chartId as string] = updatedState;

        // Notify all listeners for this specific chart
        zoomTooltipListeners[chartId as string].forEach((fn: (state: ZoomTooltipState) => void) => {
            fn(updatedState);
        });
    }

    // Rest of the function for updating element styles...
    if (refs.rect.current) {
        const id: string = refs.rect.current.id;
        const isPanning: boolean = zoom.isPanning as boolean;
        const isPanButton: boolean = id.indexOf('_Pan_') > -1;

        let rectColor: string = 'transparent';
        if (isPanning && isPanButton) {
            rectColor = chart.themeStyle?.toolkitIconRectSelectionFill;
        }

        refs.rect.current.setAttribute('fill', rectColor);
    }

    // Reset icon colors using refs
    if (refs.mainIcon.current) {
        const id: string = refs.mainIcon.current.id;
        let iconColor: string = chart.themeStyle?.toolkitFill;

        if (zoom.isPanning && id.indexOf('_Pan_') > -1) {
            iconColor = chart.themeStyle?.toolkitSelectionColor;
        }

        refs.mainIcon.current.setAttribute('fill', iconColor);
    }
    const iconColor: string = chart.themeStyle?.toolkitFill;
    void ((refs.secondaryIcon.current) && refs.secondaryIcon.current.setAttribute('fill', iconColor));
}

/**
 * Returns a click handler for toolbar items
 *
 * @param {ToolbarItems} action - The toolbar item action
 * @param {Chart} chart - The chart instance
 * @param {BaseZoom} zoom - The zoom controller
 * @returns {Function} The click handler
 */
function handleToolbarClick(action: ToolbarItems, chart: Chart, zoom: BaseZoom): (e: React.MouseEvent) => void {
    return (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const setToolkitVisible: (visible: boolean) => void = useRegisterZoomToolkitVisibility();

        switch (action) {
        case 'Pan':
            togglePan(chart, zoom);
            break;
        case 'ZoomIn':
            zoomIn(chart);
            break;
        case 'ZoomOut':
            zoomOut(chart);
            break;
        case 'Reset':
            reset(chart, zoom);
            break;
        }

        const shouldShowToolkit: boolean = applyZoomToolkit(chart, chart.axisCollection, zoom);
        setToolkitVisible(shouldShowToolkit);
    };
}

/**
 * Returns zoom tooltip text for chart toolbar items based on locale.
 *
 * @param {ToolbarItems} item - The toolbar item key (e.g., 'ZoomIn', 'ZoomOut', 'Reset', 'Pan').
 * @param {string} locale - The locale code (e.g., 'fr-CH', 'ar', 'zh-CN', 'de-DE').
 * @returns {string} - The localized tooltip text for the given toolbar item.
 *
 * If the provided locale is not supported, it defaults to English ('en-US').
 */
function getZoomTooltipText(item: ToolbarItems, locale: string): string {

    const defaultChartLocale: {
        zoom: string;
        zoomIn: string;
        zoomOut: string;
        reset: string;
        pan: string;
        resetZoom: string;
    } = {
        zoom: 'Zoom',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        reset: 'Reset',
        pan: 'Pan',
        resetZoom: 'Reset Zoom'
    };

    const localeObj: IL10n = L10n('chart', defaultChartLocale, locale);
    return localeObj.getConstant(item.charAt(0).toLowerCase() + item.slice(1));
}

/**
 * Renders the icon for a toolbar item
 *
 * @param {ToolbarItems} item - The toolbar item to render
 * @param {Chart} chart - The chart instance
 * @param {BaseZoom} zoom - The zoom controller
 * @param {Object} refs - Object containing refs for SVG elements
 * @param {React.RefObject<SVGRectElement>} refs.rect - Reference to the rectangle SVG element
 * @param {React.RefObject<SVGPathElement>} refs.mainIcon - Reference to the path SVG element
 * @param {React.RefObject<SVGPolygonElement>} refs.secondaryIcon - Reference to the polygon SVG element
 * @returns {JSX.Element} The rendered toolbar item icon
 */
function renderToolbarItemIcon(
    item: ToolbarItems,
    chart: Chart,
    zoom: BaseZoom,
    refs: {
        rect: React.RefObject<SVGRectElement>,
        mainIcon: React.RefObject<SVGPathElement>,
        secondaryIcon: React.RefObject<SVGPolygonElement>
    }
): JSX.Element {
    const iconSize: number = 32;

    switch (item) {
    case 'ZoomIn':
        return renderZoomInIcon(chart, refs, iconSize);
    case 'ZoomOut':
        return renderZoomOutIcon(chart, refs, iconSize);
    case 'Pan':
        return renderPanIcon(chart, zoom, refs, iconSize);
    case 'Reset':
    default:
        return renderResetIcon(chart, refs, iconSize, Browser.isDevice, zoom);
    }
}

/**
 * Renders the ZoomIn icon
 *
 * @param {Chart} chart - The chart instance
 * @param {Object} refs - Object containing refs for SVG elements
 * @param {number} iconSize - The size of the icon
 * @returns {JSX.Element} The rendered icon
 */
function renderZoomInIcon(
    chart: Chart,
    refs: {
        rect: React.RefObject<SVGRectElement>,
        mainIcon: React.RefObject<SVGPathElement>,
        secondaryIcon: React.RefObject<SVGPolygonElement>
    },
    iconSize: number
): JSX.Element {
    const fillColor: string = chart.themeStyle?.toolkitFill;

    const config: IconRenderConfig = {
        idSuffix: 'ZoomIn',
        pathD: 'M5.29297 3.28906H6.10156V5.29297H8.12305V6.10156H6.10156V8.12305H5.29297V6.10156H3.28906V5.29297H5.29297V3.28906ZM5.69727 1.67188L5.50391 1.68945H5.29297L4.88867 1.75977L4.50195 1.86523L4.13281 1.98828L3.78125 2.16406L3.44727 2.35742L3.14844 2.60352L2.84961 2.84961L2.60352 3.14844L2.35742 3.44727L2.16406 3.78125L1.98828 4.13281L1.86523 4.50195L1.75977 4.88867L1.68945 5.29297L1.67188 5.69727L1.68945 6.11914L1.75977 6.50586L1.86523 6.89258L1.98828 7.26172L2.16406 7.61328L2.35742 7.94727L2.60352 8.26367L2.84961 8.54492L3.14844 8.80859L3.44727 9.03711L3.78125 9.24805L4.13281 9.40625L4.50195 9.54688L4.88867 9.65234L5.29297 9.70508L5.69727 9.72266L6.11914 9.70508L6.50586 9.65234L6.89258 9.54688L7.26172 9.40625L7.61328 9.24805L7.94727 9.03711L8.26367 8.80859L8.54492 8.54492L8.80859 8.26367L9.03711 7.94727L9.24805 7.61328L9.40625 7.26172L9.54688 6.89258L9.65234 6.50586L9.70508 6.11914L9.72266 5.69727L9.70508 5.29297L9.65234 4.88867L9.54688 4.50195L9.40625 4.13281L9.24805 3.78125L9.03711 3.44727L8.80859 3.14844L8.54492 2.84961L8.26367 2.60352L7.94727 2.35742L7.61328 2.16406L7.26172 1.98828L6.89258 1.86523L6.50586 1.75977L6.11914 1.68945L5.69727 1.67188ZM5.69727 0.0722656H5.99609L6.27734 0.0898438L6.55859 0.125L6.83984 0.177734L7.10352 0.248047L7.38477 0.318359L7.63086 0.40625L7.89453 0.511719L8.14062 0.617188L8.38672 0.740234L8.61523 0.880859L8.86133 1.02148L9.07227 1.17969L9.2832 1.35547L9.49414 1.53125L9.6875 1.72461L9.88086 1.91797L10.0566 2.11133L10.2148 2.33984L10.373 2.55078L10.5312 2.7793L10.6543 3.02539L10.7773 3.25391L10.9004 3.51758L11.0059 3.76367L11.0938 4.02734L11.1641 4.29102L11.2168 4.57227L11.2695 4.83594L11.3047 5.13477L11.3398 5.41602V5.69727V5.96094L11.3223 6.22461L11.2871 6.48828L11.252 6.73438L11.1992 6.98047L11.1289 7.22656L11.0586 7.47266L10.9707 7.70117L10.8828 7.92969L10.7773 8.1582L10.6543 8.38672L10.5488 8.59766L10.4082 8.80859L10.2676 9.00195L10.127 9.19531L9.96875 9.38867L10.4258 9.8457L11.1113 9.96875L15.9453 14.8027L14.8027 15.9277L9.96875 11.1113L9.8457 10.4258L9.38867 9.96875L9.19531 10.127L9.00195 10.2676L8.80859 10.4082L8.59766 10.5488L8.38672 10.6543L8.1582 10.7773L7.92969 10.8828L7.70117 10.9707L7.47266 11.0586L7.22656 11.1289L6.98047 11.1992L6.73438 11.252L6.48828 11.2871L6.22461 11.3223L5.96094 11.3398H5.69727H5.41602L5.13477 11.3047L4.85352 11.2695L4.57227 11.2344L4.29102 11.1641L4.02734 11.0938L3.76367 11.0059L3.51758 10.9004L3.25391 10.7773L3.02539 10.6543L2.7793 10.5312L2.55078 10.373L2.32227 10.2148L2.11133 10.0566L1.91797 9.88086L1.72461 9.6875L1.53125 9.49414L1.35547 9.2832L1.17969 9.07227L1.02148 8.86133L0.880859 8.63281L0.740234 8.38672L0.617188 8.14062L0.511719 7.89453L0.40625 7.63086L0.318359 7.38477L0.248047 7.10352L0.177734 6.83984L0.125 6.55859L0.0898438 6.27734L0.0722656 5.99609L0.0546875 5.69727L0.0722656 5.41602L0.0898438 5.13477L0.125 4.85352L0.177734 4.57227L0.248047 4.29102L0.318359 4.02734L0.40625 3.76367L0.511719 3.51758L0.617188 3.25391L0.740234 3.02539L0.880859 2.7793L1.02148 2.55078L1.17969 2.33984L1.35547 2.11133L1.53125 1.91797L1.72461 1.72461L1.91797 1.53125L2.11133 1.35547L2.32227 1.17969L2.55078 1.02148L2.7793 0.880859L3.02539 0.740234L3.25391 0.617188L3.51758 0.511719L3.76367 0.40625L4.02734 0.318359L4.29102 0.248047L4.57227 0.177734L4.85352 0.125L5.13477 0.0898438L5.41602 0.0722656H5.69727Z',
        fillColor,
        rectFill: 'transparent'
    };

    return renderToolbarIcon(chart, refs, iconSize, config);
}

/**
 * Renders the ZoomOut icon
 *
 * @param {Chart} chart - The chart instance
 * @param {Object} refs - Object containing refs for SVG elements
 * @param {number} iconSize - The size of the icon
 * @returns {JSX.Element} The rendered icon
 */
function renderZoomOutIcon(
    chart: Chart,
    refs: {
        rect: React.RefObject<SVGRectElement>,
        mainIcon: React.RefObject<SVGPathElement>,
        secondaryIcon: React.RefObject<SVGPolygonElement>
    },
    iconSize: number
): JSX.Element {
    const fillColor: string = chart.themeStyle?.toolkitFill;

    const config: IconRenderConfig = {
        idSuffix: 'ZoomOut',
        pathD: 'M3.28906 5.29297H8.12305V6.10156H3.28906V5.29297ZM5.69727 1.67188L5.50391 1.68945H5.29297L4.88867 1.75977L4.50195 1.86523L4.13281 1.98828L3.78125 2.16406L3.44727 2.35742L3.14844 2.60352L2.84961 2.84961L2.60352 3.14844L2.35742 3.44727L2.16406 3.78125L1.98828 4.13281L1.86523 4.50195L1.75977 4.88867L1.68945 5.29297L1.67188 5.69727L1.68945 6.11914L1.75977 6.50586L1.86523 6.89258L1.98828 7.26172L2.16406 7.61328L2.35742 7.94727L2.60352 8.26367L2.84961 8.54492L3.14844 8.80859L3.44727 9.03711L3.78125 9.24805L4.13281 9.40625L4.50195 9.54688L4.88867 9.65234L5.29297 9.70508L5.69727 9.72266L6.11914 9.70508L6.50586 9.65234L6.89258 9.54688L7.26172 9.40625L7.61328 9.24805L7.94727 9.03711L8.26367 8.80859L8.54492 8.54492L8.80859 8.26367L9.03711 7.94727L9.24805 7.61328L9.40625 7.26172L9.54688 6.89258L9.65234 6.50586L9.70508 6.11914L9.72266 5.69727L9.70508 5.29297L9.65234 4.88867L9.54688 4.50195L9.40625 4.13281L9.24805 3.78125L9.03711 3.44727L8.80859 3.14844L8.54492 2.84961L8.26367 2.60352L7.94727 2.35742L7.61328 2.16406L7.26172 1.98828L6.89258 1.86523L6.50586 1.75977L6.11914 1.68945L5.69727 1.67188ZM5.69727 0.0722656H5.99609L6.27734 0.0898438L6.55859 0.125L6.83984 0.177734L7.10352 0.248047L7.38477 0.318359L7.63086 0.40625L7.89453 0.511719L8.14062 0.617188L8.38672 0.740234L8.61523 0.880859L8.84375 1.02148L9.07227 1.17969L9.2832 1.35547L9.49414 1.53125L9.6875 1.72461L9.88086 1.91797L10.0566 2.11133L10.2148 2.33984L10.373 2.55078L10.5137 2.7793L10.6543 3.02539L10.7773 3.25391L10.9004 3.51758L11.0059 3.76367L11.0938 4.02734L11.1641 4.29102L11.2168 4.57227L11.2695 4.83594L11.3047 5.13477L11.3398 5.41602V5.69727V5.96094L11.3223 6.22461L11.2871 6.48828L11.252 6.73438L11.1992 6.98047L11.1289 7.22656L11.0586 7.47266L10.9707 7.70117L10.8828 7.92969L10.7773 8.1582L10.6543 8.38672L10.5488 8.59766L10.4082 8.80859L10.2676 9.00195L10.127 9.19531L9.96875 9.38867L10.4258 9.8457L11.1113 9.96875L15.9453 14.8027L14.8027 15.9277L9.96875 11.1113L9.8457 10.4258L9.38867 9.96875L9.00195 10.2676L8.80859 10.4082L8.59766 10.5488L8.38672 10.6543L8.1582 10.7773L7.92969 10.8828L7.70117 10.9707L7.47266 11.0586L7.22656 11.1289L6.98047 11.1992L6.73438 11.252L6.48828 11.2871L6.22461 11.3223L5.96094 11.3398H5.69727H5.41602L5.13477 11.3047L4.85352 11.2695L4.57227 11.2344L4.29102 11.1641L4.02734 11.0938L3.76367 11.0059L3.51758 10.9004L3.25391 10.7773L3.02539 10.6543L2.7793 10.5312L2.55078 10.373L2.32227 10.2148L2.11133 10.0566L1.91797 9.88086L1.72461 9.6875L1.53125 9.49414L1.35547 9.2832L1.17969 9.07227L1.02148 8.86133L0.880859 8.63281L0.740234 8.38672L0.617188 8.14062L0.511719 7.89453L0.40625 7.63086L0.318359 7.38477L0.248047 7.10352L0.177734 6.83984L0.125 6.55859L0.0898438 6.27734L0.0722656 5.99609L0.0546875 5.69727L0.0722656 5.41602L0.0898438 5.13477L0.125 4.85352L0.177734 4.57227L0.248047 4.29102L0.318359 4.02734L0.40625 3.76367L0.511719 3.51758L0.617188 3.25391L0.740234 3.02539L0.880859 2.7793L1.02148 2.55078L1.17969 2.33984L1.35547 2.11133L1.53125 1.91797L1.72461 1.72461L1.91797 1.53125L2.11133 1.35547L2.32227 1.17969L2.55078 1.02148L2.7793 0.880859L3.02539 0.740234L3.25391 0.617188L3.51758 0.511719L3.76367 0.40625L4.02734 0.318359L4.29102 0.248047L4.57227 0.177734L4.85352 0.125L5.13477 0.0898438L5.41602 0.0722656H5.69727Z',
        fillColor,
        rectFill: 'transparent'
    };

    return renderToolbarIcon(chart, refs, iconSize, config);
}

/**
 * Renders the Pan icon
 *
 * @param {Chart} chart - The chart instance
 * @param {BaseZoom} zoom - The zoom controller
 * @param {Object} refs - Object containing refs for SVG elements
 * @param {React.RefObject<SVGRectElement>} refs.rect - Reference to the rectangle SVG element
 * @param {React.RefObject<SVGPathElement>} refs.mainIcon - Reference to the path SVG element
 * @param {React.RefObject<SVGPolygonElement>} refs.secondaryIcon - Reference to the polygon SVG element
 * @param {number} iconSize - The size of the icon
 * @returns {JSX.Element} The rendered icon
 */
function renderPanIcon(
    chart: Chart,
    zoom: BaseZoom,
    refs: {
        rect: React.RefObject<SVGRectElement>,
        mainIcon: React.RefObject<SVGPathElement>,
        secondaryIcon: React.RefObject<SVGPolygonElement>
    },
    iconSize: number
): JSX.Element {
    // Set fill color based on isPanning state
    const fillColor: string = zoom.isPanning ?
        chart.themeStyle?.toolkitSelectionColor :
        chart.themeStyle?.toolkitFill;

    const rectFill: string = zoom.isPanning ?
        chart.themeStyle?.toolkitIconRectSelectionFill :
        'transparent';

    return (
        <>
            <rect
                ref={refs.rect}
                id={`${chart.element.id}_Zooming_Pan_1`}
                width={iconSize}
                height={iconSize}
                fill={rectFill}
                rx={4}
                ry={0}
                transform="translate(-7,-8)"
            />
            <path
                ref={refs.mainIcon}
                id={`${chart.element.id}_Zooming_Pan_2`}
                d="M8.0625 9.91406H3.25781L4.28906 10.9453C4.47656 11.1328 4.57031 11.3594 4.57031 11.625C4.57031 11.8906 4.47656 12.1172 4.28906 12.3047C4.10156 12.4922 3.875 12.5859 3.60938 12.5859C3.34375 12.5859 3.11719 12.4922 2.92969 12.3047L0.28125 9.65625C0.09375 9.46875 0 9.25 0 9C0 8.75 0.09375 8.53125 0.28125 8.34375L2.92969 5.69531C3.11719 5.50781 3.33984 5.41406 3.59766 5.41406C3.85547 5.41406 4.07812 5.50781 4.26562 5.69531C4.45312 5.88281 4.54688 6.10547 4.54688 6.36328C4.54688 6.62109 4.45312 6.84375 4.26562 7.03125L3.23438 8.0625H8.0625V3.23438L7.00781 4.28906C6.82031 4.47656 6.60156 4.57031 6.35156 4.57031C6.10156 4.57031 5.88281 4.47656 5.69531 4.28906C5.50781 4.10156 5.41406 3.87891 5.41406 3.62109C5.41406 3.36328 5.50781 3.14062 5.69531 2.95312L8.34375 0.28125C8.53125 0.09375 8.75 0 9 0C9.25 0 9.46875 0.09375 9.65625 0.28125L12.3281 2.95312C12.5156 3.14062 12.6094 3.35938 12.6094 3.60938C12.6094 3.85938 12.5156 4.07812 12.3281 4.26562C12.1406 4.45312 11.918 4.54688 11.6602 4.54688C11.4023 4.54688 11.1797 4.45312 10.9922 4.26562L9.9375 3.23438V8.0625L14.7422 8.08594L13.7109 7.05469C13.5234 6.86719 13.4297 6.64062 13.4297 6.375C13.4297 6.10938 13.5234 5.88281 13.7109 5.69531C13.8984 5.50781 14.125 5.41406 14.3906 5.41406C14.6562 5.41406 14.8828 5.50781 15.0703 5.69531L17.7188 8.34375C17.9062 8.53125 18 8.75 18 9C18 9.25 17.9062 9.46875 17.7188 9.65625L15.0469 12.3281C14.8594 12.5156 14.6367 12.6055 14.3789 12.5977C14.1211 12.5898 13.8984 12.4922 13.7109 12.3047C13.5234 12.1172 13.4297 11.8945 13.4297 11.6367C13.4297 11.3789 13.5234 11.1562 13.7109 10.9688L14.7656 9.91406H9.9375V14.7422L10.9453 13.7109C11.1328 13.5234 11.3594 13.4297 11.625 13.4297C11.8906 13.4297 12.1172 13.5234 12.3047 13.7109C12.4922 13.8984 12.5859 14.125 12.5859 14.3906C12.5859 14.6562 12.4922 14.8828 12.3047 15.0703L9.65625 17.7188C9.46875 17.9062 9.25 18 9 18C8.75 18 8.53125 17.9062 8.34375 17.7188L5.67188 15.0469C5.48438 14.8594 5.39453 14.6367 5.40234 14.3789C5.41016 14.1211 5.50781 13.8984 5.69531 13.7109C5.88281 13.5234 6.10547 13.4297 6.36328 13.4297C6.62109 13.4297 6.84375 13.5234 7.03125 13.7109L8.0625 14.7656V9.91406Z"
                fill={fillColor}
            />
            <path
                ref={refs.secondaryIcon}
                id={`${chart.element.id}_Zooming_Pan_3`}
                d=""
                fill={fillColor}
            />
        </>
    );
}

/**
 * Renders the Reset icon
 *
 * @param {Chart} chart - The chart instance
 * @param {Object} refs - Object containing refs for SVG elements
 * @param {React.RefObject<SVGRectElement>} refs.rect - Reference to the rectangle SVG element
 * @param {React.RefObject<SVGPathElement>} refs.mainIcon - Reference to the path SVG element
 * @param {React.RefObject<SVGPolygonElement>} refs.secondaryIcon - Reference to the polygon SVG element
 * @param {number} iconSize - The size of the icon
 * @param {boolean} isDevice - to check the Browser is Device for mobile mode
 * @param {BaseZoom} zoom - The zoom controller
 *
 * @returns {JSX.Element} The rendered icon
 */
function renderResetIcon(
    chart: Chart,
    refs: {
        rect: React.RefObject<SVGRectElement>,
        mainIcon: React.RefObject<SVGPathElement>,
        secondaryIcon: React.RefObject<SVGPolygonElement>
    },
    iconSize: number,
    isDevice: boolean,
    zoom: BaseZoom
): JSX.Element {
    const fillColor: string = chart.themeStyle?.toolkitFill;
    const elementOpacity: string = !zoom.isZoomed && zoom.toolbar?.visible ? '0.2' : '1';
    if (isDevice) {
        return (
            <>
                <rect
                    ref={refs.rect}
                    id={`${chart.element.id}_Zooming_Reset_1`}
                    width={63}
                    height={16}
                    fill="transparent"
                    rx={0}
                />
                <text
                    id={`${chart.element.id}_Zooming_Reset_2`}
                    x={31.5}
                    y={7}
                    fontSize="12px"
                    fontFamily="Segoe UI"
                    fill="#000000"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity={elementOpacity}
                    pointerEvents="none"
                    aria-hidden="true"
                    style={{
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                    }}
                >
                    Reset Zoom
                </text>
            </>
        );
    }
    return (
        <>
            <rect
                ref={refs.rect}
                id={`${chart.element.id}_Zooming_Reset_1`}
                width={iconSize}
                height={iconSize}
                fill="transparent"
                rx={4}
                ry={0}
                transform="translate(-7,-8)"
            />
            <path
                ref={refs.mainIcon}
                id={`${chart.element.id}_Zooming_Reset_2`}
                d="M13.4297 9H14.9062V13.4297V13.5879L14.8711 13.7285L14.8359 13.8691L14.7832 14.0098L14.7305 14.1328L14.6602 14.2559L14.5723 14.3613L14.4668 14.4668L14.3613 14.5723L14.2559 14.6602L14.1328 14.7305L14.0098 14.7832L13.8691 14.8359L13.7285 14.8711L13.5879 14.9062H13.4297H4.57031V17.1211L0.878906 14.168L4.57031 11.2148V13.4297H13.4297V9ZM13.4297 0.878906L17.1211 3.83203L13.4297 6.78516V4.57031H4.57031V9H3.09375V3.84961L3.11133 3.69141L3.14648 3.55078L3.2168 3.42773L3.32227 3.32227L3.42773 3.2168L3.55078 3.14648L3.62109 3.12891L3.76172 3.09375H13.4297V0.878906Z"
                fill={fillColor}
            />
            <path
                ref={refs.secondaryIcon}
                id={`${chart.element.id}_Zooming_Reset_3`}
                d=""
                fill={fillColor}
            />
        </>
    );
}

/**
 * Renders a toolbar icon based on provided configuration
 *
 * @param {Chart} chart - The chart instance
 * @param {Object} refs - Object containing refs for SVG elements
 * @param {React.RefObject<SVGRectElement>} refs.rect - Reference to the rectangle SVG element
 * @param {React.RefObject<SVGPathElement>} refs.mainIcon - Reference to the path SVG element
 * @param {React.RefObject<SVGPolygonElement>} refs.secondaryIcon - Reference to the polygon SVG element
 * @param {number} iconSize - The size of the icon
 * @param {IconRenderConfig} config - The icon configuration
 * @returns {JSX.Element} The rendered icon
 *
 * @private
 */
export function renderToolbarIcon(
    chart: Chart,
    refs: {
        rect: React.RefObject<SVGRectElement>,
        mainIcon: React.RefObject<SVGPathElement>,
        secondaryIcon: React.RefObject<SVGPolygonElement>
    },
    iconSize: number,
    config: IconRenderConfig
): JSX.Element {
    const { idSuffix, pathD, polygonPoints, fillColor, rectFill } = config;

    return (
        <>
            <rect
                ref={refs.rect}
                id={`${chart.element.id}_Zooming_${idSuffix}_1`}
                width={iconSize}
                height={iconSize}
                fill={rectFill}
                rx={4}
                ry={0}
                transform="translate(-7,-8)"
            />
            <path
                ref={refs.mainIcon}
                id={`${chart.element.id}_Zooming_${idSuffix}_2`}
                d={pathD}
                fill={fillColor}
            />
            {polygonPoints ? (
                <polygon
                    ref={refs.secondaryIcon}
                    id={`${chart.element.id}_Zooming_${idSuffix}_3`}
                    points={polygonPoints}
                    fill={fillColor}
                />
            ) : (
                <path
                    ref={refs.secondaryIcon}
                    id={`${chart.element.id}_Zooming_${idSuffix}_3`}
                    d=""
                    fill={fillColor}
                />
            )}
        </>
    );
}
