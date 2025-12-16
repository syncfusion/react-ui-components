import { JSX, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ChartLocationProps, ChartZoomSettingsProps, ZoomEndEvent, ZoomStartEvent } from '../../base/interfaces';
import { getRectLocation, minMax, withInBounds } from '../../utils/helper';
import { registerChartEventHandler, registerZoomRectSetter, useRegisterAxisRender, useRegisterSeriesRender, useRegisterZoomToolkitVisibility } from '../../hooks/useClipRect';
import { useLayout } from '../../layout/LayoutContext';
import { Browser, extend } from '@syncfusion/react-base';
import { AxisModel, BaseZoom, Chart, AxisDataProps, ITouches, IZoomAxisRange, Rect, VisibleRangeProps } from '../../chart-area/chart-interfaces';
import { ZoomMode } from '../../base/enum';

let zoom: BaseZoom;

/**
 * Options for performing zoom redraw operations
 *
 * @interface ZoomRedrawOptions
 */
interface ZoomRedrawOptions {
    /**
     * The zooming rectangl
     */
    rect?: Rect;

    /**
     * Whether the chart is currently zoomed
     *
     * @default false
     */
    zoomed?: boolean;

    /**
     * Whether panning is active
     *
     * @default false
     */
    panning?: boolean;

    /**
     * Whether UI interactions have been performed
     *
     * @default false
     */
    performedUI?: boolean;

    /**
     * Whether panning has started
     *
     * @default false
     */
    startPanning?: boolean;
}

/**
 * ZoomContent component that manages the zooming functionality for charts
 *
 * This component handles chart zooming interactions including mouse/touch selection,
 * mouse wheel zooming, pinch gestures, and panning. It renders the zoom selection
 * rectangle and coordinates with the chart's axes for proper zoom behavior.
 *
 * @component
 * @param {ChartZoomSettingsProps} props - The zoom settings configuration
 * @param {boolean} [props.selectionZoom=false] - Enables zooming by selecting an area
 * @param {boolean} [props.mouseWheelZoom=false] - Enables zooming using mouse wheel
 * @param {boolean} [props.pinchZoom=false] - Enables zooming with touch pinch gestures
 * @param {boolean} [props.pan=false] - Enables panning of the zoomed chart
 * @param {ZoomMode} [props.mode='XY'] - Determines zoom direction ('X', 'Y', or 'XY')
 * @param {boolean} [props.toolbar=false] - Whether to always show the zoom toolbar
 * @returns {JSX.Element | null} The zoom selection rectangle or null when not in selection mode
 *
 * @example
 * ```tsx
 * <ZoomContent
 *   selectionZoom={true}
 *   mouseWheelZoom={true}
 *   mode="XY"
 *   items={['ZoomIn', 'ZoomOut', 'Pan', 'Reset']}
 * />
 * ```
 *
 * @see {@link ZoomToolkit} - For the zoom controls toolbar component
 * @see {@link applyZoomToolkit} - For applying zoom settings to chart
 * @see {@link handleChartMouseMove} - For zoom mouse interactions
 * @private
 */
export const ZoomContent: React.FC<ChartZoomSettingsProps> = (props: ChartZoomSettingsProps) => {
    const { layoutRef, phase, setLayoutValue, reportMeasured } = useLayout();
    const initialZoomRect: null = useMemo(() => null, []);
    const [zoomRect, setZoomRect] = useState<JSX.Element | null>(initialZoomRect);
    if (layoutRef.current?.chartZoom) {
        zoom = layoutRef.current.chartZoom as BaseZoom;
    }

    useLayoutEffect(() => {
        if (phase === 'measuring') {
            if ((props.selectionZoom || props.mouseWheelZoom || props.pinchZoom) && layoutRef.current?.chart) {
                zoom = layoutRef.current?.chartZoom as BaseZoom;
                const chartZoom: BaseZoom = getZoomOptions(props, layoutRef.current?.chart as Chart);
                setLayoutValue('chartZoom', chartZoom);
            }
            reportMeasured('ChartZoom');
        }
    }, [phase]);

    useEffect(() => {
        if (phase !== 'measuring' && layoutRef.current?.chart) {
            zoom = layoutRef.current?.chartZoom as BaseZoom;
            (layoutRef.current?.chart as Chart).zoomSettings = props;
        }
    }, [props.selectionZoom, props.accessibility, props.mouseWheelZoom,
        props.pinchZoom, props.pan,
        props.mode, props.toolbar?.items]);

    // In ZoomContent component, replace the existing useEffect with:
    useEffect(() => {
        if ((props.selectionZoom || props.mouseWheelZoom || props.pinchZoom) && layoutRef.current?.chart) {
            registerZoomRectSetter(setZoomRect);

            // Register zoom mouse handlers
            const unregisterMouseDown: () => void = registerChartEventHandler(
                'mouseDown', (_e: Event, chart: Chart) => {
                    zoom = layoutRef.current?.chartZoom as BaseZoom;
                    handleChartMouseDown(_e as MouseEvent, chart);
                }, (layoutRef.current?.chart as Chart)?.element.id);

            const unregisterMouseMove: () => void = registerChartEventHandler(
                'mouseMove', (_e: Event, chart: Chart) => {
                    zoom = layoutRef.current?.chartZoom as BaseZoom;
                    handleChartMouseMove(_e as MouseEvent, chart, setZoomRect);
                }, (layoutRef.current?.chart as Chart)?.element.id);

            const unregisterMouseUp: () => void = registerChartEventHandler(
                'mouseUp', (_e: Event, chart: Chart) => {
                    zoom = layoutRef.current?.chartZoom as BaseZoom;
                    handleChartMouseUp(_e as MouseEvent, chart, setZoomRect);
                }, (layoutRef.current?.chart as Chart)?.element.id);

            const unregisterMouseWheel: () => void = registerChartEventHandler(
                'mouseWheel', (_e: Event, chart: Chart) => {
                    zoom = layoutRef.current?.chartZoom as BaseZoom;
                    handleChartMouseWheel(_e as WheelEvent, chart);
                }, (layoutRef.current?.chart as Chart)?.element.id);

            const unregisterMouseLeave: () => void = registerChartEventHandler(
                'mouseLeave', (_e: Event, chart: Chart) => {
                    zoom = layoutRef.current?.chartZoom as BaseZoom;
                    handleChartMouseCancel(chart, setZoomRect);
                }, (layoutRef.current?.chart as Chart)?.element.id);

            // Return cleanup function
            return () => {
                unregisterMouseDown();
                unregisterMouseMove();
                unregisterMouseUp();
                unregisterMouseWheel();
                unregisterMouseLeave();
            };
        }
        return () => { /* empty cleanup function */ };

    }, []);

    const shouldRenderZoomRect: boolean | undefined = useMemo(() => phase === 'rendering' &&
        props.selectionZoom, [phase, props.selectionZoom]);

    return shouldRenderZoomRect ? <>{zoomRect}</> : null;
};

/**
 * Gets zoom options from the provided settings
 *
 * @param {ChartZoomSettingsProps} chartZoom - The chart zoom settings
 * @param {Chart} chart - The chart instance
 * @returns {BaseZoom} The configured zoom controller
 * @private
 */
function getZoomOptions(chartZoom: ChartZoomSettingsProps, chart: Chart): BaseZoom {
    const Zoom: BaseZoom = extend({}, chartZoom) as BaseZoom;

    Zoom.zoomingRect = { x: 0, y: 0, width: 0, height: 0 };
    Zoom.isZoomed = isAxisZoomed(chart.axisCollection);
    Zoom.isPanning = Zoom.isZoomed && Zoom.pan;
    Zoom.performedUI = false;
    Zoom.startPanning = false;
    Zoom.zoomAxes = [];
    Zoom.touchStartList = [];
    Zoom.touchMoveList = [];
    Zoom.offset = { x: 0, y: 0, width: 0, height: 0 };

    return Zoom;
}


/**
 * Handles mouse or touch move events for chart zooming/panning
 *
 * @param {MouseEvent | TouchEvent | WheelEvent} e - The mouse/touch/wheel event
 * @param {Chart} chart - The chart instance
 * @param {Function} setZoomRect - Function to update the zoom rectangle
 * @returns {void}
 * @private
 */
export function handleChartMouseMove(
    e: MouseEvent | TouchEvent | WheelEvent,
    chart: Chart,
    setZoomRect?: (rect: JSX.Element | null) => void
): void {    // Zooming for chart
    if (chart.isChartDrag) {
        const touches: TouchList | null = (e as TouchEvent).touches || null;
        if (e.type === 'touchmove') {
            if (zoom.isPanning) {
                chart.startPanning = true;
            }
            zoom.touchMoveList = addTouchPointer(zoom.touchMoveList as ITouches[] | TouchList,
                                                 e as PointerEvent, touches) as Required<ITouches[] | TouchList>;
            if (chart.zoomSettings.pinchZoom && (zoom.touchMoveList as Required<ITouches[] | TouchList>).length > 1 &&
                (zoom.touchStartList?.length as Required<number>) > 1) {
                performPinchZooming(chart);
            }
        }
        renderZooming(e, chart, setZoomRect, chart.isTouch);
    }
}

/**
 * Handles mouse or touch down events for chart zooming/panning
 *
 * @param {MouseEvent | TouchEvent | WheelEvent} e - The mouse/touch/wheel event
 * @param {Chart} chart - The chart instance
 * @returns {void}
 * @private
 */
export function handleChartMouseDown(e: MouseEvent | TouchEvent | WheelEvent, chart: Chart): void {
    let target: Element;
    let touches: TouchList | null = null;

    if (e.type === 'touchstart') {
        touches = (e as TouchEvent & PointerEvent).touches;
        target = (e as TouchEvent & PointerEvent).target as Element;
    } else {
        target = e.target as Element;
    }

    if (target.id.indexOf(chart.element.id + '_Zooming_') === -1 &&
        (chart.zoomSettings.pinchZoom || chart.zoomSettings.selectionZoom || zoom.isPanning) &&
        withInBounds(chart.previousMouseMoveX, chart.previousMouseMoveY, chart.chartAxislayout.seriesClipRect)) {
        chart.isChartDrag = true;
        if (chart.element) {
            if (zoom.isPanning) {
                chart.element.style.cursor = 'grab';
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
            } else if (chart.zoomSettings.selectionZoom) {
                chart.element.style.cursor = 'crosshair';
            }
        }
    }

    if (chart.isTouch) {
        const result: ITouches[] | TouchList = addTouchPointer(zoom.touchStartList as ITouches[] | TouchList, e as PointerEvent, touches);
        zoom.touchStartList = result as Required<ITouches[] | TouchList>;
    }
}

/**
 * Handles mouse up events for chart zooming
 *
 * @param {MouseEvent} e - The mouse event
 * @param {Chart} chart - The chart instance
 * @param {Function} setZoomRect - Function to update the zoom rectangle
 * @returns {void}
 * @private
 */
export function handleChartMouseUp(e: MouseEvent, chart: Chart, setZoomRect?: (rect: JSX.Element | null) => void): void {
    let performZoomRedraw: boolean = true;
    void ((e.target instanceof Element) && (e.target as Element)?.id && (
        performZoomRedraw = (e.target as Element)?.id.indexOf(chart.element.id + '_ZoomOut_') === -1 ||
        (e.target as Element)?.id.indexOf(chart.element.id + '_ZoomIn_') === -1));

    void ((chart.isChartDrag || performZoomRedraw) && (redrawOnZooming(chart, true, true)));

    setZoomRect?.(null);

    void (chart.element && (chart.element.style.cursor = ''));

    if (chart.isTouch) {
        if (chart.isDoubleTap &&
            withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect) &&
            (zoom.touchStartList as Required<ITouches[] | TouchList>).length === 1 && zoom.isZoomed) {
            // Reset zoom functionality
            reset(chart, zoom);
        }
        zoom.touchStartList = [];
        chart.isDoubleTap = false;
    }

    // Reset chart drag state
    chart.isChartDrag = false;
}

/**
 * Handles the mouse cancel event on the chart.
 *
 * @param {Chart} chart - The chart instance
 * @param {Function} setZoomRect - Function to update the zoom rectangle
 * @returns {void}
 * @private
 */
export function handleChartMouseCancel(
    chart: Chart,
    setZoomRect?: (rect: JSX.Element | null) => void
): void {
    if (zoom.isZoomed) {
        redrawOnZooming(chart, true, true);
    }
    void (chart.element && (chart.element.style.cursor = ''));

    setZoomRect?.(null);

    // Reset chart states
    chart.isChartDrag = false;

    // Clear touch-related properties
    zoom.pinchTarget = undefined;
    zoom.touchStartList = [];
    zoom.touchMoveList = [];
}

/**
 * Renders zooming rectangle or performs panning
 *
 * @param {MouseEvent | TouchEvent} e - The mouse/touch event
 * @param {Chart} chart - The chart instance
 * @param {Function} setZoomRect - Function to update the zoom rectangle
 * @param {boolean} isTouch - Whether the event is a touch event
 * @returns {void}
 * @private
 */
export function renderZooming(
    e: MouseEvent | TouchEvent,
    chart: Chart,
    setZoomRect?: (rect: JSX.Element | null) => void,
    isTouch?: boolean
): void {
    calculateZoomAxesRange(chart);

    if (chart.zoomSettings.selectionZoom && (!isTouch
        || (chart.isDoubleTap && (zoom.touchStartList as Required<ITouches[] | TouchList>).length === 1))
        && (!zoom.isPanning || chart.isDoubleTap)) {
        zoom.isPanning = Browser.isDevice ? true : zoom.isPanning;
        zoom.performedUI = true;
        const zoomRectElement: JSX.Element = drawZoomingRectangle(chart) as JSX.Element;
        setZoomRect?.(zoomRectElement);
    } else if (zoom.isPanning && chart.isChartDrag) {
        if (!isTouch || (isTouch && (zoom.touchStartList as Required<ITouches[] | TouchList>).length === 1)) {
            zoom.pinchTarget = isTouch ? (e.target as Element) : undefined;
            doPan(chart, chart.axisCollection);
        }
    }
}

/**
 * Draws the zooming rectangle
 *
 * @param {Chart} chart - The chart instance
 * @returns {JSX.Element | null} The rendered zoom rectangle or null
 * @private
 */
export function drawZoomingRectangle(chart: Chart): JSX.Element | null {
    const areaBounds: Rect = chart.chartAxislayout.seriesClipRect;
    const startLocation: ChartLocationProps = { x: chart.previousMouseMoveX, y: chart.previousMouseMoveY };
    const endLocation: ChartLocationProps = { x: chart.mouseX, y: chart.mouseY };
    const rect: Rect = zoom.zoomingRect = getRectLocation(startLocation, endLocation, areaBounds);

    if (rect.width > 0 && rect.height > 0) {
        zoom.isZoomed = true;
        chart.disableTrackTooltip = true;

        if (chart.zoomSettings.mode === 'X') {
            rect.height = areaBounds.height;
            rect.y = areaBounds.y;
        } else if (chart.zoomSettings.mode === 'Y') {
            rect.width = areaBounds.width;
            rect.x = areaBounds.x;
        }
        chart.zoomRedraw = true;
        if (chart.tooltipRef && chart.tooltipRef.current) {
            chart.tooltipRef.current?.fadeOut();
        }
        return (
            <rect
                id={`${chart.element.id}_ZoomArea`}
                opacity="1"
                fill={chart.themeStyle.selectionRectFill}
                stroke={chart.themeStyle.selectionRectStroke}
                strokeWidth="1"
                strokeDasharray="3"
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx="0"
                ry="0"
                transform=""
            />
        );
    }

    return null;
}

/**
 * Performs panning on the chart
 *
 * @param {Chart} chart - The chart instance
 * @param {AxisModel[]} axes - The axes to pan
 * @param {number} xDifference - Optional X difference for panning
 * @param {number} yDifference - Optional Y difference for panning
 * @returns {void}
 * @private
 */
export function doPan(chart: Chart, axes: AxisModel[], xDifference: number = 0, yDifference: number = 0): void {

    let currentScale: number;
    let offsetValue: number;
    zoom.isZoomed = true;
    chart.startPanning = true;
    zoom.zoomCompleteEvtCollection = [];
    chart.disableTrackTooltip = true;
    zoom.offset = !chart.delayRedraw ? chart.chartAxislayout.seriesClipRect : zoom.offset;

    const zoomedAxisCollection: AxisDataProps[] = [];

    for (const axis of (axes as AxisModel[])) {
        const argsData: ZoomEndEvent = {
            axisName: axis.name,
            previousZoomFactor: axis.zoomFactor,
            previousZoomPosition: axis.zoomPosition,
            currentZoomFactor: axis.zoomFactor,
            currentZoomPosition: axis.zoomPosition,
            previousVisibleRange: axis.visibleRange,
            currentVisibleRange: undefined
        };

        currentScale = Math.max(1 / minMax(axis.zoomFactor as number, 0, 1), 1);

        if (axis.orientation === 'Horizontal') {
            offsetValue = (xDifference !== 0 ? xDifference : (chart.previousMouseMoveX - chart.mouseX)) / axis.rect.width / currentScale;
            argsData.currentZoomPosition = minMax((axis.zoomPosition as number) + offsetValue, 0, (1 - (axis.zoomFactor as number)));
        } else {
            offsetValue = (yDifference !== 0 ? yDifference : (chart.previousMouseMoveY - chart.mouseY)) / axis.rect.height / currentScale;
            argsData.currentZoomPosition = minMax((axis.zoomPosition as number) - offsetValue, 0, (1 - (axis.zoomFactor as number)));
        }
        axis.zoomFactor = argsData.currentZoomFactor;
        axis.zoomPosition = argsData.currentZoomPosition;
        zoom.zoomCompleteEvtCollection.push(argsData);
        zoomedAxisCollection.push({
            zoomFactor: axis.zoomFactor as number,
            zoomPosition: axis.zoomPosition as number,
            axisName: axis.name as string,
            axisRange: axis.visibleRange
        });
    }

    const zoomingEventArgs: ZoomStartEvent = {
        cancel: false,
        axisData: zoomedAxisCollection
    };
    chart.chartProps?.onZoomStart?.(zoomingEventArgs);

    if (zoomingEventArgs.cancel) {
        zoomCancel(axes, zoom.zoomCompleteEvtCollection);
    } else {
        performDeferredZoom(chart);
        redrawOnZooming(chart, false);
    }
}

/**
 * Performs a deferred zoom operation on the chart
 *
 * @param {Chart} chart - The chart instance to perform the zoom on
 * @returns {void} This function doesn't return a value
 * @private
 */
function performDeferredZoom(chart: Chart): void {
    let translateX: number;
    let translateY: number;

    translateX = chart.mouseX - chart.mouseDownX;
    translateY = chart.mouseY - chart.mouseDownY;

    switch (chart.zoomSettings.mode) {
    case 'X':
        translateY = 0;
        break;
    case 'Y':
        translateX = 0;
        break;
    }

    setTransform(translateX, translateY, null, null, chart, false);

    chart.previousMouseMoveX = chart.mouseX;
    chart.previousMouseMoveY = chart.mouseY;
}

/**
 * Sets transform for series elements during panning/zooming
 *
 * @param {number} transX - X translation
 * @param {number} transY - Y translation
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 * @param {Chart} chart - The chart instance
 * @param {boolean} isPinch - Whether this is a pinch operation
 * @returns {void}
 * @private
 */
function setTransform(transX: number, transY: number, scaleX: number | null, scaleY: number | null, chart: Chart, isPinch: boolean): void {

    let translate: string;
    let xAxisLoc: number;
    let yAxisLoc: number;

    if (transX !== null && transY !== null) {
        for (const series of chart.visibleSeries) {
            if (!series.visible) { continue; }

            xAxisLoc = chart.requireInvertedAxis ? series.yAxis.rect.x : series.xAxis.rect.x;
            yAxisLoc = chart.requireInvertedAxis ? series.xAxis.rect.y : series.yAxis.rect.y;

            translate = `translate(${transX + (isPinch ? ((scaleX ? scaleX : 0) * xAxisLoc) : xAxisLoc)},${transY + (isPinch ? ((scaleY ? scaleY : 0) * yAxisLoc) : yAxisLoc)})`;
            translate = (scaleX || scaleY) ? `${translate} scale(${scaleX} ${scaleY})` : translate;

            if (series.seriesElement) {
                series.seriesElement.setAttribute('transform', translate);
            }
        }
    }
}

/**
 * Calculates the zoom axes range for the chart.
 *
 * @param {Chart} chart - The chart instance
 * @returns {void}
 * @private
 */
function calculateZoomAxesRange(chart: Chart): void {
    let range: IZoomAxisRange;
    let axisRange: VisibleRangeProps;

    for (let index: number = 0; index < chart.axisCollection.length; index++) {
        const axis: AxisModel = chart.axisCollection[index as number];
        axisRange = axis.visibleRange;

        if ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number]) {
            if (!chart.delayRedraw) {
                (zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].min = axisRange.minimum;
                (zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].delta = axisRange.delta;
            }
        } else {
            range = {
                actualMin: axis.actualRange.minimum,
                actualDelta: axis.actualRange.delta,
                min: axisRange.minimum,
                delta: axisRange.delta
            };
            (zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number] = range;
        }
    }
}

/**
 * Redraws the chart after zooming operations
 *
 * @param {Chart} chart - The chart instance
 * @param {boolean} isRedraw - Whether to perform a full redraw
 * @param {boolean} isMouseUp - Whether this is triggered by a mouse up event
 * @returns {void}
 * @private
 */
export function redrawOnZooming(chart: Chart, isRedraw: boolean = true, isMouseUp: boolean = false): void {
    const zoomCompleteCollection: ZoomEndEvent[] = isMouseUp ? [] : zoom.zoomCompleteEvtCollection;

    if (isRedraw) {
        performZoomRedraw(chart, {
            rect: zoom.zoomingRect,
            zoomed: zoom.isZoomed,
            panning: zoom.isPanning,
            performedUI: zoom.performedUI,
            startPanning: chart.startPanning
        });
    }

    for (let i: number = 0; i < zoomCompleteCollection.length; i++) {
        const argsData: ZoomEndEvent = {
            axisName: chart.axisCollection[i as number].name,
            previousZoomFactor: zoomCompleteCollection[i as number].previousZoomFactor,
            previousZoomPosition: zoomCompleteCollection[i as number].previousZoomPosition,
            currentZoomFactor: chart.axisCollection[i as number].zoomFactor,
            currentZoomPosition: chart.axisCollection[i as number].zoomPosition,
            currentVisibleRange: chart.axisCollection[i as number].visibleRange,
            previousVisibleRange: zoomCompleteCollection[i as number].previousVisibleRange
        };
        chart.chartProps?.onZoomEnd?.(argsData);
    }
}

/**
 * Performs the redraw operation after zooming/panning
 *
 * @param {Chart} chart - The chart instance
 * @param {ZoomRedrawOptions} [options={}] - Configuration options for zoom redraw, including rectangle dimensions, zoom state flags
 * @returns {void}
 * @private
 */
export function performZoomRedraw(
    chart: Chart,
    options: ZoomRedrawOptions = {}
): void {
    const {
        rect = { x: 0, y: 0, width: 0, height: 0 },
        zoomed = false,
        panning = false,
        performedUI = false,
        startPanning = false
    } = options;
    const zoomRect: Rect = rect || (zoom.zoomingRect as Required<Rect>);
    chart.animateSeries = false;

    if (zoomed !== undefined ? zoomed : zoom.isZoomed) {
        if (zoomRect.width > 0 && zoomRect.height > 0) {
            zoom.performedUI = performedUI !== undefined ? performedUI : true;
            doZoom(
                chart,
                chart.axisCollection,
                chart.chartAxislayout.seriesClipRect,
                zoomRect,
                panning !== undefined ? panning : zoom.isPanning
            );
            chart.isDoubleTap = false;
        } else if (chart.disableTrackTooltip) {
            chart.disableTrackTooltip = false;
            chart.delayRedraw = false;

            const chartDuration: number = chart.duration || 0;
            if (!(panning && (chart.isChartDrag || startPanning))) {
                chart.duration = 600;
            }
            chart.zoomRedraw = true;
            const chartId: string = chart.element.id;
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
            // Trigger renders
            const triggerAxisRender: (chartId?: string) => void = useRegisterAxisRender();
            triggerAxisRender(chartId);

            const triggerSeriesRender: (chartId?: string) => void = useRegisterSeriesRender();
            triggerSeriesRender(chartId);

            const setToolkitVisible: () => void = useRegisterZoomToolkitVisibility();
            setToolkitVisible();

            chart.startPanning = false;
            chart.redraw = false;
            chart.duration = chartDuration;
        }
    }
}

/**
 * Performs zooming operations on the chart based on user interactions.
 *
 * @param {Chart} chart - The chart instance to perform zooming on
 * @param {AxisModel[]} axes - The axes to apply zooming to
 * @param {Rect} bounds - The bounds of the chart area
 * @param {Rect} zoomingRectParam - The rectangle defining the zoom area
 * @param {boolean} isPanningParam - Whether panning is active
 * @returns {void}
 * @private
 */
export function doZoom(
    chart: Chart,
    axes: AxisModel[],
    bounds: Rect,
    zoomingRectParam: Rect,
    isPanningParam: boolean = false
): void {
    const zoomRect: Rect = zoomingRectParam;
    const mode: ZoomMode = chart.zoomSettings.mode as ZoomMode;
    zoom.isPanning = chart.zoomSettings.pan || isPanningParam;
    const zoomedAxisCollections: AxisDataProps[] = [];
    zoom.zoomCompleteEvtCollection = [];

    for (const axis of (axes as AxisModel[])) {
        const argsData: ZoomEndEvent = {
            axisName: axis.name,
            previousZoomFactor: axis.zoomFactor,
            previousZoomPosition: axis.zoomPosition,
            currentZoomFactor: axis.zoomFactor,
            currentZoomPosition: axis.zoomPosition,
            previousVisibleRange: axis.visibleRange,
            currentVisibleRange: undefined
        };

        if (axis.orientation === 'Horizontal') {
            if (mode !== 'Y') {
                (argsData.currentZoomPosition as Required<number>) += (Math.abs((zoomRect.x - bounds.x) / (bounds.width)) *
                    (axis.zoomFactor as number) as number);
                (argsData.currentZoomFactor as Required<number>) *= (zoomRect.width / bounds.width);
            }
        } else {
            if (mode !== 'X') {
                (argsData.currentZoomPosition as Required<number>) += (1 - Math.abs((zoomRect.height +
                    (zoomRect.y - bounds.y)) / (bounds.height))) * (axis.zoomFactor as Required<number>);
                (argsData.currentZoomFactor as Required<number>) *= (zoomRect.height / bounds.height);
            }
        }

        if (parseFloat((argsData.currentZoomFactor as Required<number>).toFixed(3)) <= 0.001) {
            argsData.currentZoomFactor = argsData.previousZoomFactor;
            argsData.currentZoomPosition = argsData.previousZoomPosition;
        }

        axis.zoomFactor = argsData.currentZoomFactor;
        axis.zoomPosition = argsData.currentZoomPosition;
        zoom.zoomCompleteEvtCollection.push(argsData);

        zoomedAxisCollections.push({
            zoomFactor: axis.zoomFactor as number,
            zoomPosition: axis.zoomPosition as number,
            axisName: axis.name as string,
            axisRange: axis.visibleRange
        });
    }

    const onZoomingEventArg: ZoomStartEvent = {
        cancel: false,
        axisData: zoomedAxisCollections
    };

    // Trigger onZooming event
    chart.chartProps?.onZoomStart?.(onZoomingEventArg);

    if (onZoomingEventArg.cancel) {
        zoomCancel(axes, zoom.zoomCompleteEvtCollection);
    } else {
        // Reset zooming rectangle
        zoom.zoomingRect = { x: 0, y: 0, width: 0, height: 0 };
        redrawOnZooming(chart);
    }
}

/**
 * Performs mouse wheel zooming on the chart
 *
 * @param {WheelEvent} e - The wheel event
 * @param {number} mouseX - The x-coordinate of the mouse position
 * @param {number} mouseY - The y-coordinate of the mouse position
 * @param {Chart} chart - The chart instance
 * @param {AxisModel[]} axes - The axes to zoom
 * @returns {void}
 * @private
 */
export function performMouseWheelZooming(e: WheelEvent, mouseX: number, mouseY: number, chart: Chart, axes: AxisModel[]): void {

    const browserName: string = (Browser.info.name && typeof Browser.info.name === 'string')
        ? Browser.info.name : '';
    const isMozilla: boolean = browserName.toLowerCase().includes('mozilla') ||
        browserName.toLowerCase().includes('firefox');
    const isPointer: boolean = Browser?.isPointer || false;
    const direction: number = (isMozilla && !isPointer) ?
        -(e.detail) / 3 > 0 ? 1 : -1 : (e.deltaY > 0 ? -1 : 1);
    const mode: ZoomMode = chart.zoomSettings.mode as ZoomMode;

    zoom.isZoomed = true;
    chart.isGestureZooming = true;
    calculateZoomAxesRange(chart);
    chart.disableTrackTooltip = true;
    zoom.performedUI = true;
    zoom.isPanning = true;
    zoom.zoomCompleteEvtCollection = [];

    const zoomedAxisCollection: AxisDataProps[] = calculateWheelZoomFactors(
        direction, mouseX, mouseY, chart, axes, mode, zoom
    );

    const onZoomingEventArgs: ZoomStartEvent = {
        cancel: false,
        axisData: zoomedAxisCollection
    };

    // Trigger onZooming event
    chart.chartProps?.onZoomStart?.(onZoomingEventArgs);

    if (!onZoomingEventArgs.cancel) {
        redrawOnZooming(chart);
    } else {
        zoomCancel(axes, zoom.zoomCompleteEvtCollection);
    }
}

/**
 * Calculates zoom factors for each axis based on mouse wheel zooming
 *
 * @param {number} direction - The zoom direction (1 for in, -1 for out)
 * @param {number} mouseX - Mouse X position
 * @param {number} mouseY - Mouse Y position
 * @param {Chart} chart - The chart instance
 * @param {AxisModel[]} axes - The axes to zoom
 * @param {ZoomMode} mode - The zoom mode (X, Y, or XY)
 * @param {BaseZoom} zoom - The zoom controller
 * @returns {AxisDataProps[]} Collection of zoomed axis data
 * @private
 */
function calculateWheelZoomFactors(
    direction: number,
    mouseX: number,
    mouseY: number,
    chart: Chart,
    axes: AxisModel[],
    mode: ZoomMode,
    zoom: BaseZoom
): AxisDataProps[] {
    const zoomedAxisCollection: AxisDataProps[] = [];
    let anyAxisZoomed: boolean = false;

    for (const axis of axes) {
        const argsData: ZoomEndEvent = {
            axisName: axis.name,
            previousZoomFactor: axis.zoomFactor,
            previousZoomPosition: axis.zoomPosition,
            currentZoomFactor: axis.zoomFactor,
            currentZoomPosition: axis.zoomPosition,
            currentVisibleRange: undefined,
            previousVisibleRange: axis.visibleRange
        };

        if ((axis.orientation === 'Vertical' && mode !== 'X') ||
            (axis.orientation === 'Horizontal' && mode !== 'Y')) {
            const ZOOM_FACTOR_INCREMENT: number = 0.25;
            const MAX_ZOOM_CUMULATIVE: number = 50000000000;

            let cumulative: number = Math.max(Math.max(1 / minMax(axis.zoomFactor as number, 0, 1), 1)
             + (ZOOM_FACTOR_INCREMENT * direction), 1);
            cumulative = cumulative > MAX_ZOOM_CUMULATIVE ? MAX_ZOOM_CUMULATIVE : cumulative;

            if (cumulative >= 1) {
                let origin: number = axis.orientation === 'Horizontal' ? mouseX / axis.rect.width : 1 - (mouseY / axis.rect.height);
                origin = origin > 1 ? 1 : origin < 0 ? 0 : origin;
                let zoomFactor: number = (cumulative === 1) ? 1 : minMax((direction > 0 ? 0.9 : 1.1) / cumulative, 0, 1);
                const zoomPosition: number = (cumulative === 1) ? 0 : (axis.zoomPosition as number) + (((axis.zoomFactor as number)
                    - zoomFactor) * origin);

                if (axis.zoomPosition !== zoomPosition || axis.zoomFactor !== zoomFactor) {
                    zoomFactor = (zoomPosition + zoomFactor) > 1 ? (1 - zoomPosition) : zoomFactor;
                }

                if (parseFloat((argsData.currentZoomFactor as Required<number>).toFixed(3)) <= 0.001) {
                    argsData.currentZoomFactor = argsData.previousZoomFactor;
                    argsData.currentZoomPosition = argsData.previousZoomPosition;
                } else {
                    argsData.currentZoomFactor = zoomFactor;
                    argsData.currentZoomPosition = zoomPosition;
                }
            }

            if (argsData.currentZoomFactor !== argsData.previousZoomFactor ||
                argsData.currentZoomPosition !== argsData.previousZoomPosition) {
                anyAxisZoomed = true;
            }

            axis.zoomFactor = argsData.currentZoomFactor;
            axis.zoomPosition = argsData.currentZoomPosition;
            zoom.zoomCompleteEvtCollection.push(argsData);
        }

        zoomedAxisCollection.push({
            zoomFactor: axis.zoomFactor as number,
            zoomPosition: axis.zoomPosition as number,
            axisName: axis.name as string,
            axisRange: axis.visibleRange
        });
    }
    if (!anyAxisZoomed) {
        chart.disableTrackTooltip = false;
    }

    return zoomedAxisCollection;
}

/**
 * Performs pinch zooming on the chart
 *
 * @param {Chart} chart - The chart instance to perform pinch zooming on
 * @returns {boolean} Whether pinch zooming was successfully performed
 * @private
 */
export function performPinchZooming(chart: Chart): boolean {
    if (!zoom.touchStartList || !zoom.touchMoveList ||
        zoom.touchStartList.length < 2 || zoom.touchMoveList.length < 2) {
        return false;
    }

    if ((zoom.zoomingRect && zoom.zoomingRect.width > 0 && zoom.zoomingRect.height > 0)) {
        return false;
    }

    calculateZoomAxesRange(chart);
    chart.isGestureZooming = true;
    zoom.isZoomed = true;
    zoom.isPanning = true;
    zoom.performedUI = true;
    zoom.offset = chart.delayRedraw ? chart.chartAxislayout.seriesClipRect : zoom.offset;
    chart.delayRedraw = true;
    chart.disableTrackTooltip = true;

    const elementOffset: DOMRect = chart.element.getBoundingClientRect();
    const touchDown: TouchList = zoom.touchStartList as TouchList;
    const touchMove: TouchList = zoom.touchMoveList as TouchList;

    const touch0StartX: number = touchDown[0].pageX - elementOffset.left;
    const touch0StartY: number = touchDown[0].pageY - elementOffset.top;
    const touch0EndX: number = touchMove[0].pageX - elementOffset.left;
    const touch0EndY: number = touchMove[0].pageY - elementOffset.top;
    const touch1StartX: number = touchDown[1].pageX - elementOffset.left;
    const touch1StartY: number = touchDown[1].pageY - elementOffset.top;
    const touch1EndX: number = touchMove[1].pageX - elementOffset.left;
    const touch1EndY: number = touchMove[1].pageY - elementOffset.top;

    const scaleX: number = Math.abs(touch0EndX - touch1EndX) / Math.abs(touch0StartX - touch1StartX);
    const scaleY: number = Math.abs(touch0EndY - touch1EndY) / Math.abs(touch0StartY - touch1StartY);
    const clipX: number = (((zoom.offset as Required<Rect>).x - touch0EndX) / scaleX) + touch0StartX;
    const clipY: number = (((zoom.offset as Required<Rect>).y - touch0EndY) / scaleY) + touch0StartY;
    const pinchRect: Rect = {
        x: clipX, y: clipY, width: (zoom.offset as Required<Rect>).width / scaleX,
        height: (zoom.offset as Required<Rect>).height / scaleY
    };
    const translateXValue: number = (touch0EndX - (scaleX * touch0StartX));
    const translateYValue: number = (touch0EndY - (scaleY * touch0StartY));

    if (!isNaN(scaleX - scaleX) && !isNaN(scaleY - scaleY)) {
        switch (chart.zoomSettings.mode) {
        case 'XY':
            setTransform(translateXValue, translateYValue, scaleX, scaleY, chart, true);
            break;
        case 'X':
            setTransform(translateXValue, 0, scaleX, 1, chart, true);
            break;
        case 'Y':
            setTransform(0, translateYValue, 1, scaleY, chart, true);
            break;
        }
    }

    if (!calculatePinchZoomFactor(chart, pinchRect)) {
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
        const chartId: string = chart.element.id;
        const triggerAxisRender: (chartId?: string) => void = useRegisterAxisRender();
        triggerAxisRender(chartId);

        const triggerSeriesRender: (chartId?: string) => void = useRegisterSeriesRender();
        triggerSeriesRender(chartId);

        const setToolkitVisible: () => void = useRegisterZoomToolkitVisibility();
        setToolkitVisible();
    }

    return true;
}

/**
 * Calculates pinch zoom factor
 *
 * @param {Chart} chart - The chart instance
 * @param {Rect} pinchRect - The pinch rectangle
 * @returns {boolean} Whether zoom factor calculation was cancelled
 * @private
 */
function calculatePinchZoomFactor(chart: Chart, pinchRect: Rect): boolean {
    const mode: ZoomMode = chart.zoomSettings.mode as ZoomMode;
    let selectionMin: number;
    let selectionMax: number;
    let rangeMin: number;
    let rangeMax: number;
    let value: number;
    let axisTrans: number;
    let argsData: ZoomEndEvent;
    let currentZF: number;
    let currentZP: number;
    const zoomedAxisCollection: AxisDataProps[] = [];
    zoom.zoomCompleteEvtCollection = [];

    for (let index: number = 0; index < chart.axisCollection.length; index++) {
        const axis: AxisModel = chart.axisCollection[index as number];
        if ((axis.orientation === 'Horizontal' && mode !== 'Y') ||
            (axis.orientation === 'Vertical' && mode !== 'X')) {
            currentZF = axis.zoomFactor as Required<number>;
            currentZP = axis.zoomPosition as Required<number>;
            argsData = {
                axisName: axis.name,
                previousZoomFactor: axis.zoomFactor,
                previousZoomPosition: axis.zoomPosition,
                currentZoomFactor: currentZF,
                currentZoomPosition: currentZP,
                previousVisibleRange: axis.visibleRange,
                currentVisibleRange: undefined
            };

            if (axis.orientation === 'Horizontal') {
                value = pinchRect.x - (zoom.offset as Required<Rect>).x;

                axisTrans =
                    axis.rect.width / ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].delta as Required<number>);
                rangeMin = value / axisTrans + ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].min as Required<number>);
                value = pinchRect.x + pinchRect.width - (zoom.offset as Required<Rect>).x;
                rangeMax = value / axisTrans + ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].min as Required<number>);
            } else {
                value = pinchRect.y - (zoom.offset as Required<Rect>).y;
                axisTrans = axis.rect.height / ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].delta as Required<number>);
                rangeMin = (value * -1 + axis.rect.height) / axisTrans +
                    ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].min as Required<number>);
                value = pinchRect.y + pinchRect.height - (zoom.offset as Required<Rect>).y;
                rangeMax = (value * -1 + axis.rect.height) / axisTrans +
                    ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].min as Required<number>);
            }

            selectionMin = Math.min(rangeMin, rangeMax);
            selectionMax = Math.max(rangeMin, rangeMax);
            currentZP = (selectionMin -
                ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].actualMin as Required<number>)) /
                ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].actualDelta as Required<number>);
            currentZF = (selectionMax -
                selectionMin) / ((zoom.zoomAxes as Required<IZoomAxisRange[]>)[index as number].actualDelta as Required<number>);
            argsData.currentZoomPosition = currentZP < 0 ? 0 : currentZP;
            argsData.currentZoomFactor = currentZF > 1 ? 1 : (currentZF < 0.003) ? 0.003 : currentZF;

            axis.zoomFactor = argsData.currentZoomFactor;
            axis.zoomPosition = argsData.currentZoomPosition;
            zoom.zoomCompleteEvtCollection.push(argsData);

            zoomedAxisCollection.push({
                zoomFactor: axis.zoomFactor as number,
                zoomPosition: axis.zoomPosition as number,
                axisName: axis.name as string,
                axisRange: axis.visibleRange
            });
        }
    }

    const onZoomingEventArgs: ZoomStartEvent = {
        cancel: false,
        axisData: zoomedAxisCollection
    };

    if (!onZoomingEventArgs.cancel) {
        chart.chartProps?.onZoomStart?.(onZoomingEventArgs);
    }
    else {
        zoomCancel(chart.axisCollection, zoom.zoomCompleteEvtCollection);
        return true;
    }

    return false;
}

/**
 * Applies the zoom toolkit on the chart
 *
 * @param {Chart} chart - The chart instance
 * @param {AxisModel[]} axes - The axes to check
 * @returns {boolean} Whether the toolkit should be shown
 * @param {BaseZoom} zoom - The zoom controller
 * @private
 */
export function applyZoomToolkit(chart: Chart, axes: AxisModel[], zoom: BaseZoom): boolean {
    const showToolkit: boolean = isAxisZoomed(axes);

    if (showToolkit) {
        zoom.isZoomed = true;
        return true;
    } else if (chart.zoomSettings.toolbar?.visible) {
        zoom.isZoomed = showToolkit;
        return true;
    } else {
        zoom.isPanning = false;
        zoom.isZoomed = false;
        chart.isZoomed = false;
        return false;
    }
}

/**
 * Cancels the zoom action
 *
 * @param {AxisModel[]} axes - The axes to reset
 * @param {ZoomEndEvent[]} zoomCompleteEventCollection - Collection of zoom complete events
 * @returns {void}
 * @private
 */
export function zoomCancel(axes: AxisModel[], zoomCompleteEventCollection: ZoomEndEvent[]): void {
    for (const zoomCompleteEvent of zoomCompleteEventCollection) {
        for (const axis of (axes as AxisModel[])) {
            if (axis.name === zoomCompleteEvent.axisName) {
                axis.zoomFactor = zoomCompleteEvent.previousZoomFactor;
                axis.zoomPosition = zoomCompleteEvent.previousZoomPosition;
                axis.visibleRange = zoomCompleteEvent.previousVisibleRange as VisibleRangeProps;
                break;
            }
        }
    }
}

/**
 * Checks if any of the axes is zoomed
 *
 * @param {AxisModel[]} axes - The axes to check
 * @returns {boolean} Whether any axis is zoomed
 * @private
 */
export function isAxisZoomed(axes: AxisModel[]): boolean {
    let showToolkit: boolean = false;
    for (const axis of (axes as AxisModel[])) {
        showToolkit = (showToolkit || (axis.zoomFactor !== 1 || axis.zoomPosition !== 0));
    }
    return showToolkit;
}

/**
 * Handles mouse wheel zooming
 *
 * @param {WheelEvent} e - The wheel event
 * @param {Chart} chart - The chart instance
 * @returns {boolean} Whether the wheel event was handled
 * @private
 */
export function handleChartMouseWheel(e: WheelEvent, chart: Chart): boolean {
    const offset: DOMRect = chart.element.getBoundingClientRect();
    const svgElement: Element = chart.element.querySelector('svg') as Element;
    const svgRect: DOMRect | null = svgElement?.getBoundingClientRect();
    const mouseX: number = (e.clientX - offset.left) - Math.max((svgRect?.left || 0) - offset.left, 0);
    const mouseY: number = (e.clientY - offset.top) - Math.max((svgRect?.top || 0) - offset.top, 0);

    if (chart.zoomSettings.mouseWheelZoom &&
        withInBounds(mouseX, mouseY, chart.chartAxislayout.seriesClipRect)) {
        e.preventDefault();
        performMouseWheelZooming(e, mouseX, mouseY, chart, chart.axisCollection);
    }

    return false;
}

/**
 * Adds touch pointer to the touch list
 *
 * @param {ITouches[] | TouchList} touchList - The touch list to modify
 * @param {PointerEvent} e - The pointer event
 * @param {TouchList | null} touches - Touch list from the event
 * @returns {ITouches[] | TouchList} The updated touch list
 * @private
 */
export function addTouchPointer(touchList: ITouches[] | TouchList, e: PointerEvent, touches: TouchList | null): ITouches[] | TouchList {
    if (touches) {
        touchList = [];
        for (let i: number = 0, length: number = touches.length; i < length; i++) {
            touchList.push({
                pageX: touches[i as number].clientX,
                pageY: touches[i as number].clientY,
                pointerId: undefined
            });
        }
    } else {
        touchList = touchList ? touchList : [];
        if (touchList.length === 0) {
            (touchList as Required<ITouches[]>).push({
                pageX: e.clientX,
                pageY: e.clientY,
                pointerId: e.pointerId
            });
        } else {
            let found: boolean = false;
            for (let i: number = 0, length: number = touchList.length; i < length; i++) {
                if ((touchList[i as number] as Required<ITouches>).pointerId === e.pointerId) {
                    touchList[i as number] = {
                        pageX: e.clientX,
                        pageY: e.clientY,
                        pointerId: e.pointerId
                    };
                    found = true;
                    break;
                }
            }
            if (!found) {
                (touchList as Required<ITouches[]>).push({
                    pageX: e.clientX,
                    pageY: e.clientY,
                    pointerId: e.pointerId
                });
            }
        }
    }
    return touchList;
}

/**
 * Toggles pan mode for the chart
 *
 * @param {Chart} chart - The chart instance
 * @param {BaseZoom} zoom - The zoom controller
 * @returns {void}
 * @private
 */
export function togglePan(chart: Chart, zoom: BaseZoom): void {
    if (!zoom.isZoomed) {
        return;
    }
    zoom.isPanning = true;
    chart.isZoomed = true;
    const setToolkitVisible: () => void = useRegisterZoomToolkitVisibility();
    setToolkitVisible();
}

/**
 * Performs zoom in operation on the chart
 *
 * @param {Chart} chart - The chart instance
 * @returns {void}
 * @private
 */
export function zoomIn(chart: Chart): void {
    zoomInOutCalculation(1, chart, chart.axisCollection, chart.zoomSettings.mode as ZoomMode);
}

/**
 * Performs zoom out operation on the chart
 *
 * @param {Chart} chart - The chart instance
 * @returns {void}
 * @private
 */
export function zoomOut(chart: Chart): void {
    zoomInOutCalculation(-1, chart, chart.axisCollection, chart.zoomSettings.mode as ZoomMode);
}

/**
 * Calculates zoom factors and positions for zoom in/out actions
 *
 * @param {number} scale - Scale factor (positive for zoom in, negative for zoom out)
 * @param {Chart} chart - The chart instance
 * @param {AxisModel[]} axes - The axes to zoom
 * @param {ZoomMode} mode - The zoom mode (X, Y, or XY)
 * @returns {void}
 * @private
 */
export function zoomInOutCalculation(scale: number, chart: Chart, axes: AxisModel[], mode: ZoomMode): void {
    chart.delayRedraw = false;
    zoom.isPanning = false;

    const zoomCompleteEvtCollection: ZoomEndEvent[] = [];
    const zoomedAxisCollection: AxisDataProps[] = [];

    for (const axis of axes) {
        // Save previous values for zoom complete event
        const argsData: ZoomEndEvent = {
            axisName: axis.name,
            previousZoomFactor: axis.zoomFactor,
            previousZoomPosition: axis.zoomPosition,
            currentZoomFactor: axis.zoomFactor,
            currentZoomPosition: axis.zoomPosition,
            previousVisibleRange: axis.visibleRange,
            currentVisibleRange: undefined
        };

        // Apply zoom calculations only to relevant axes based on mode
        if ((axis.orientation === 'Horizontal' && mode !== 'Y') ||
            (axis.orientation === 'Vertical' && mode !== 'X')) {

            let currentZoomFactor: number;
            let currentZoomPosition: number;

            // For zoom in (scale > 0)
            if (scale > 0) {
                currentZoomFactor = (axis.zoomFactor as number) * 0.8;
                currentZoomPosition = (axis.zoomPosition as number) +
                    (((axis.zoomFactor as number) - currentZoomFactor) * 0.5);
            }
            // For zoom out (scale < 0)
            else {
                currentZoomFactor = Math.min((axis.zoomFactor as number) * 1.25, 1);
                if (currentZoomFactor === 1) {
                    currentZoomPosition = 0;
                } else {
                    currentZoomPosition = Math.max((axis.zoomPosition as number) -
                        ((currentZoomFactor - (axis.zoomFactor as number)) * 0.5), 0);
                }
            }

            argsData.currentZoomFactor = currentZoomFactor;
            argsData.currentZoomPosition = currentZoomPosition;

            axis.zoomFactor = argsData.currentZoomFactor;
            axis.zoomPosition = argsData.currentZoomPosition;
            zoomCompleteEvtCollection.push(argsData);

            zoomedAxisCollection.push({
                zoomFactor: axis.zoomFactor as number,
                zoomPosition: axis.zoomPosition as number,
                axisName: axis.name as string,
                axisRange: axis.visibleRange
            });
        }
    }
    zoom.isZoomed = isAxisZoomed(axes);
    const zoomingEventArgs: ZoomStartEvent = {
        cancel: false,
        axisData: zoomedAxisCollection
    };

    // Trigger onZooming event
    chart.chartProps?.onZoomStart?.(zoomingEventArgs);

    if (zoomingEventArgs.cancel) {
        zoomCancel(axes, zoomCompleteEvtCollection);
    } else {
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
        const chartId: string = chart.element.id;
        const triggerAxisRender: (chartId?: string) => void = useRegisterAxisRender();
        triggerAxisRender(chartId);

        const triggerSeriesRender: (chartId?: string) => void = useRegisterSeriesRender();
        triggerSeriesRender(chartId);

        const setToolkitVisible: () => void = useRegisterZoomToolkitVisibility();
        setToolkitVisible();
    }
}

/**
 * Resets zoom to default state
 *
 * @param {Chart} chart - The chart instance
 * @param {BaseZoom} zoom - The zoom controller
 * @returns {boolean} Whether the reset was successful
 * @private
 */
export function reset(chart: Chart, zoom: BaseZoom): boolean {

    const zoomedAxisCollection: AxisDataProps[] = [];
    zoom.zoomCompleteEvtCollection = [];

    // Reset each axis
    for (const axis of chart.axisCollection) {
        const argsData: ZoomEndEvent = {
            axisName: axis.name,
            previousZoomFactor: axis.zoomFactor,
            previousZoomPosition: axis.zoomPosition,
            currentZoomFactor: 1,
            currentZoomPosition: 0,
            previousVisibleRange: axis.visibleRange,
            currentVisibleRange: undefined
        };

        // Reset axis zoom properties
        axis.zoomFactor = 1;
        axis.zoomPosition = 0;
        axis.zoomFactor = argsData.currentZoomFactor;
        axis.zoomPosition = argsData.currentZoomPosition;
        zoom.zoomCompleteEvtCollection.push(argsData);

        zoomedAxisCollection.push({
            zoomFactor: axis.zoomFactor as number,
            zoomPosition: axis.zoomPosition as number,
            axisName: axis.name as string,
            axisRange: axis.visibleRange
        });

        // Trigger zoom complete event for touch devices
        chart.chartProps?.onZoomEnd?.(argsData);
    }

    // Reset zoom state
    zoom.isZoomed = false;
    zoom.isPanning = false;
    chart.isZoomed = false;
    chart.delayRedraw = false;
    const chartId: string = chart.element.id;
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
    // Trigger renders
    const triggerAxisRender: (chartId?: string) => void = useRegisterAxisRender();
    triggerAxisRender(chartId);

    const triggerSeriesRender: (chartId?: string) => void = useRegisterSeriesRender();
    triggerSeriesRender(chartId);

    const setToolkitVisible: () => void = useRegisterZoomToolkitVisibility();
    setToolkitVisible();
    return true;
}

