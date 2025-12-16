//LayoutContext.tsx
import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChartRenderer } from '../renderer/ChartRenderer';
import { AxisLabelClickEvent, ChartMouseEvent, PointClickEvent, ResizeEvent, ChartSeriesProps, ChartLocationProps, ChartStripLineProps, ChartAnnotationProps, BaseSelection } from '../base/interfaces';
import { ChartTitleRenderer } from '../renderer/ChartTitleRenderer';
import { ChartSubTitleRenderer } from '../renderer/ChartSubtitleRender';
import { ChartLegendRenderer, CustomLegendRenderer } from '../renderer/LegendRenderer/ChartLegendRenderer';
import { ChartAreaRenderer } from '../renderer/ChartAreaRender';
import { AxisRenderer } from '../renderer/AxesRenderer/AxisRender';
import { dataLabelOptionsByChartId, SeriesRenderer } from '../renderer/SeriesRenderer/SeriesRenderer';
import { ChartContext } from './ChartProvider';
import { doPan, performZoomRedraw, redrawOnZooming, reset, ZoomContent, zoomInOutCalculation } from '../renderer/Zooming/zooming';
import { ZoomToolkit } from '../renderer/Zooming/zoom-toolbar';
import { ChartColumnsRender } from '../renderer/AxesRenderer/ChartColumnsRender';
import { ChartRowsRender } from '../renderer/AxesRenderer/ChartRowsRender';
import { TooltipRenderer } from '../renderer/TooltipRenderer';
import { callChartEventHandlers } from '../hooks/useClipRect';
import { getData, PointData } from '../utils/getData';
import { Browser, isNullOrUndefined } from '@syncfusion/react-base';
import TrackballRenderer from '../renderer/TrackballRenderer';
import { stringToNumber } from '../utils/helper';
import { AxisOutsideRenderer } from '../renderer/AxesRenderer/AxisOutsideRenderer';
import ChartStackLabelsRenderer from '../renderer/ChartStackLabelsRenderer';
import { AxisModel, BaseZoom, Chart, LayoutState, Rect, SeriesProperties, ChartSizeProps } from '../chart-area/chart-interfaces';
import { ZoomMode } from '../base/enum';
import { StripLineBeforeRenderer } from '../renderer/AxesRenderer/ChartStripLinesRender';
import { StripLineAfterRenderer } from '../renderer/AxesRenderer/ChartStripLinesRender';
import { LayoutContextType } from '../common/base';
import { SelectionRenderer } from '../renderer/SelectionRenderer';
import { highlightChart, HighlightRenderer } from '../renderer/HighlightRenderer';
import { renderDataLabelTemplates } from '../renderer/SeriesRenderer/DataLabelRender';
import ChartCrosshairRenderer from '../renderer/ChartCrosshairRenderer';
import ChartAnnotationRenderer, { renderChartAnnotations, isHtmlContent } from '../renderer/ChartAnnotationRenderer';

/**
 * Represents a mapping between layout keys and their corresponding layout state or chart instance.
 *
 * @private
 */
export type LayoutMap = Record<string, LayoutState | Chart | BaseZoom>;

/**
 * React context for managing layout-related state and operations.
 * Provides access to layout phase, animation control, size, and chart references.
 */
const LayoutContext: React.Context<LayoutContextType | null> = createContext<LayoutContextType | null>(null);

/**
 * Provides layout context to child components.
 * Manages layout phase, animation state, and chart measurement lifecycle.
 *
 * @returns {Element} The layout context provider component.
 */
export const LayoutProvider: React.FC = () => {
    const [phase, setPhase] = useState<'measuring' | 'rendering'>('measuring');
    const { render, chartProps, chartTitle, chartSubTitle, chartArea, chartLegend, chartZoom,
        parentElement, rows, columns, chartSeries, chartStackLabels, axisCollection, chartSelection, chartHighlight
        , chartTooltip, chartCrosshair, chartAnnotation } = useContext(ChartContext);
    const measuredKeysRef: React.RefObject<Set<string>> = useRef<Set<string>>(new Set());
    const layoutRef: React.RefObject<LayoutMap> = useRef<LayoutMap>({});
    const striplineVisibility: boolean = axisCollection.some(
        (axis: AxisModel) => Array.isArray(axis.stripLines) &&
            axis.stripLines.some((stripLine: ChartStripLineProps) => stripLine?.visible === true)
    );
    const expectedKeys: string[] = useMemo(() => {
        const keys: string[] = ['Chart', 'ChartArea', 'ChartAxis'];
        if (chartTitle?.text) {
            keys.push('ChartTitle');
        }
        if (chartSubTitle?.text) {
            keys.push('ChartSubTitle');
        }
        if (chartLegend.visible) {
            keys.push('ChartLegend');
        }
        if (chartSeries.length > 0) {
            keys.push('ChartSeries');
        }
        if (chartZoom.selectionZoom || chartZoom.mouseWheelZoom || chartZoom.pinchZoom) {
            keys.push('ChartZoom');
        }
        if (chartStackLabels.visible) {
            keys.push('ChartStackLabels');
        }
        if (striplineVisibility) {
            keys.push('ChartStripLinesBehind');
            keys.push('ChartStripLinesOver');
        }
        return keys;
    }, [
        chartTitle?.text,
        chartSubTitle?.text,
        chartLegend.visible,
        chartSeries.length,
        chartZoom.selectionZoom,
        chartZoom.mouseWheelZoom,
        chartZoom.pinchZoom,
        chartStackLabels.visible,
        chartSelection.mode,
        chartHighlight.mode
    ]);

    const setLayoutValue: (key: string, value: Partial<Rect>) => void = useCallback((key: string, value: Partial<Rect>) => {
        layoutRef.current[key as string] = { ...layoutRef.current[key as string], ...value }; // Update ref

    }, []);

    const titleRef: React.RefObject<SVGTextElement | null> = useRef<SVGTextElement>(null);
    const subtitleRef: React.RefObject<SVGTextElement | null> = useRef<SVGTextElement>(null);
    const seriesRef: React.RefObject<SVGGElement | null> = useRef<SVGGElement>(null);
    const legendRef: React.RefObject<SVGGElement | null> = useRef<SVGGElement>(null);
    const trackballRef: React.RefObject<SVGGElement | null> = useRef<SVGGElement>(null);
    const [animationProgress, setAnimationProgress] = useState(0);

    // Add a ref to track if mouse is currently inside the chart
    const [isMouseInside, setIsMouseInside] = useState(false);

    useLayoutEffect(() => {
        if (phase === 'rendering') {
            const chartContainer: HTMLElement = parentElement.element;
            const disableScroll: boolean = (chartZoom.selectionZoom || chartZoom.pinchZoom as boolean);
            chartContainer.style.touchAction = disableScroll ? 'none' : 'element';
        }
        return undefined;
    }, [phase]);

    const reportMeasured: (key: string) => void = useCallback((key: string) => {
        measuredKeysRef.current.add(key);

        if (measuredKeysRef.current.size === expectedKeys.length) {

            setPhase('rendering');
        }
    }, [expectedKeys]);
    const [disableAnimation, setDisableAnimation] = useState(false);

    useEffect(() => {
        if (phase === 'rendering') {
            triggerRemeasure();
        }
    }, [expectedKeys.length]);

    /**
     * Triggers a re-measurement of the chart layout.
     * Disables animations, clears previously measured keys, resets layout reference,
     * and sets the layout phase to 'measuring' to prepare for a fresh layout calculation.
     *
     * @returns {void} This function does not return a value.
     */
    const triggerRemeasure: () => void = useCallback(() => {
        setDisableAnimation(true);
        measuredKeysRef.current.clear();
        layoutRef.current = {};
        setPhase('measuring');
    }, []);

    /**
     * Handles pointer movement over the chart area.
     * Retrieves the chart instance and layout dimensions to support dynamic interactions
     * such as tooltips, crosshairs, or hover effects.
     *
     * @param {PointerEvent} event - The pointer event triggered by user movement.
     * @returns {void} This function does not return a value.
     */
    const handleMouseMove: (event: PointerEvent) => void = useCallback((event: PointerEvent) => {
        const chart: Chart = layoutRef.current.chart as Chart;
        const rect: DOMRect = parentElement.element.getBoundingClientRect();

        let pageY: number;
        let pageX: number;
        if (event.type === 'touchmove') {
            const touchArg: TouchEvent = event as unknown as TouchEvent;
            pageX = touchArg.changedTouches[0].clientX;
            chart.isTouch = true;
            pageY = touchArg.changedTouches[0].clientY;
        } else {
            pageY = event.clientY;
            pageX = event.clientX;
            if (chart) {
                chart.isTouch = event.pointerType === 'touch' || event.pointerType === '2';
            }
        }

        const mouseX: number = pageX - rect.left;
        const mouseY: number = pageY - rect.top;
        void (chart && (chart.mouseX = mouseX, chart.mouseY = mouseY));
        callChartEventHandlers('mouseMove', event, chart, mouseX, mouseY);
        if (chartProps.onMouseMove) {
            const mouseArgs: ChartMouseEvent = {
                target: (event.target as HTMLElement)?.id,
                x: event.clientX,
                y: event.clientY
            };
            chartProps.onMouseMove(mouseArgs);
        }
    }, [chartProps]);

    /**
     * Handles the mouse enter event on the chart area.
     * Only triggers when the mouse first enters the chart area, not during movement within the chart.
     * Resets when the mouse leaves and re-enters the chart.
     *
     * @param {MouseEvent} event - The mouse event triggered when the pointer enters the chart.
     * @returns {void} This function does not return a value.
     */
    const handleMouseEnter: (event: MouseEvent) => void = useCallback((event: MouseEvent) => {
        if (!isMouseInside) {
            setIsMouseInside(true);
            const chart: Chart = layoutRef.current.chart as Chart;
            const rect: DOMRect = parentElement.element.getBoundingClientRect();

            const mouseX: number = event.clientX - rect.left;
            const mouseY: number = event.clientY - rect.top;

            // Update chart mouse coordinates
            if (chart) {
                chart.mouseX = mouseX;
                chart.mouseY = mouseY;
            }

            // // Call chart event handlers for mouse enter
            // callChartEventHandlers('mouseEnter', event, chart, mouseX, mouseY);

            // Trigger the user-defined onMouseEnter callback if provided
            if (chartProps.onMouseEnter) {
                const mouseArgs: ChartMouseEvent = {
                    target: (event.target as HTMLElement)?.id,
                    x: event.clientX,
                    y: event.clientY
                };
                chartProps.onMouseEnter(mouseArgs);
            }
        }
    }, [chartProps, isMouseInside]);

    /**
     * Handles mouse click events on the chart area.
     * Retrieves the chart instance and identifies the clicked target element.
     * Increments the chart's internal click count for interaction tracking.
     *
     * @param {MouseEvent} event - The mouse event triggered by user interaction.
     * @returns {void} This function does not return a value.
     */
    const handleMouseClick: (event: MouseEvent) => void = useCallback((event: MouseEvent) => {
        const chart: Chart = layoutRef.current.chart as Chart;
        const targetId: string = (event.target as HTMLElement)?.id || '';
        chart.clickCount++;
        // Call all registered click handlers
        callChartEventHandlers('click', event, chart, targetId);
        if (chartProps.onClick) {
            const mouseArgs: ChartMouseEvent = {
                target: (event.target as HTMLElement)?.id,
                x: event.clientX,
                y: event.clientY
            };
            chartProps.onClick(mouseArgs);
        }
        if (chartProps.onAxisLabelClick) {
            triggerAxisLabelClickEvent(event as PointerEvent, layoutRef.current.chart as Chart);
        }

        if (chart.clickCount === 1 && chartProps.onPointClick) {
            chart.clickCount = 0;
            triggerPointClickEvent(event as PointerEvent, chart);
        }
        removeNavigationStyle(parentElement.element);
        removeChartNavigationStyle();
    }, [chartProps]);

    /**
     * Handles global keyboard shortcuts for chart navigation.
     * Applies navigation styles to the chart container when the user presses Alt + J.
     *
     * @param {KeyboardEvent} e - The keyboard event triggered by user input.
     * @returns {void} This function does not return a value.
     */
    const documentKeyHandler: (e: KeyboardEvent) => void = (e: KeyboardEvent) => {
        if (e.altKey && e.key === 'j') { // Use 'j' for key instead of keyCode
            setNavigationStyle(parentElement.element);
        }
    };

    /**
     * Applies navigation-related styles to the specified HTML element.
     * Sets focus on the element and applies a visible outline and margin
     * to indicate keyboard navigation focus, using chart-specific styling.
     *
     * @param {HTMLElement} element - The target element to style and focus.
     * @returns {void} This function does not return a value.
     */
    const setNavigationStyle: (element: HTMLElement) => void = (element: HTMLElement) => {
        if (element) {
            element.focus();
            element.style.outline = `${chartProps.focusOutline?.width || 1.5}px solid ${chartProps.focusOutline?.color || (layoutRef.current.chart as Chart).themeStyle.tabColor}`;
            element.style.margin = `${chartProps.focusOutline?.offset || 0}px`;
        }
    };

    /**
     * Removes navigation-related styles from the specified HTML element.
     * Clears the outline and resets margin to ensure a clean visual state,
     * typically used after keyboard or focus interactions.
     *
     * @param {HTMLElement} element - The target element from which styles should be removed.
     * @returns {void} This function does not return a value.
     */
    const removeNavigationStyle: (element: HTMLElement) => void = (element: HTMLElement) => {
        element.style.outline = 'none';
        element.style.margin = `${0}px`;
    };

    /**
     * Handles the keydown event for chart keyboard interactions.
     * Prevents default behavior for specific keys when the chart is zoomed or when the spacebar is pressed,
     * to maintain custom navigation and interaction logic.
     *
     * @param {KeyboardEvent} e - The keyboard event triggered by user input.
     * @returns {boolean} Indicates whether the keydown event was handled.
     */
    const chartKeyDown: (e: KeyboardEvent) => boolean = (e: KeyboardEvent) => {
        let actionKey: string = '';
        const chart: Chart = layoutRef.current.chart as Chart;
        if ((chart.isZoomed && e.code === 'Tab') || e.code === 'Space') {
            e.preventDefault();
        }
        if (chart.tooltipModule.enable && ((e.code === 'Tab' && chart.previousTargetId.indexOf('Series') > -1) || e.code === 'Escape')) {
            actionKey = 'ESC';
        }
        if (e.ctrlKey && (e.key === '+' || e.code === 'Equal' || e.key === '-' || e.code === 'Minus')) {
            e.preventDefault();
            chart.isZoomed = (chart.zoomSettings.selectionZoom ||
                chart.zoomSettings.pinchZoom || (chart.zoomSettings.mouseWheelZoom as boolean));
            actionKey = chart.isZoomed ? e.code : '';
        }
        else if (e['keyCode'] === 82 && chart.isZoomed) { // KeyCode 82 (R) for reseting
            e.preventDefault();
            chart.isZoomed = false;
            actionKey = 'R';
        }
        else if (e.code.indexOf('Arrow') > -1) {
            e.preventDefault();
            actionKey = chart.isZoomed ? e.code : '';
        }
        if (e.ctrlKey && (e.key === 'p')) {
            e.preventDefault();
            actionKey = 'CtrlP';
        }
        if (actionKey !== '') {
            chartKeyboardNavigations(e, (e.target as HTMLElement).id, actionKey);
        }
        if (e.code === 'Tab') {
            removeNavigationStyle(parentElement.element);
            removeChartNavigationStyle();
        }
        return false;
    };

    /**
     * Removes navigation-related styles from chart text elements such as title and subtitle.
     * Clears any focus-related visual indicators to reset chart accessibility state.
     *
     * @returns {void} This function does not return a value.
     */
    const removeChartNavigationStyle: () => void = () => {
        const chartElements: React.RefObject<SVGTextElement | null>[] = [titleRef, subtitleRef];
        for (let i: number = 0; i < chartElements.length; i++) {
            const element: SVGTextElement = chartElements[i as number].current as SVGTextElement;
            if (element) {
                element.style.outline = 'none';
                element.style.margin = `${0}px`;
            }
        }
        if (legendRef.current) {
            const childElements: HTMLCollection = legendRef.current.firstElementChild?.children as HTMLCollection;
            for (let i: number = 0; i < childElements.length; i++) {
                const element: HTMLElement = childElements[i as number] as HTMLElement;
                if (element) {
                    element.style.outline = 'none';
                    element.style.margin = `${0}px`;
                }
            }
        }
        if (seriesRef.current) {
            const childElements: HTMLCollection = seriesRef.current?.children as HTMLCollection;
            for (let i: number = 0; i < childElements.length; i++) {
                const element: HTMLElement = childElements[i as number] as HTMLElement;
                if (element) {
                    element.style.outline = 'none';
                    element.style.margin = `${0}px`;
                    if (element.children[1]) {
                        (element.children[1] as HTMLElement).style.outline = 'none';
                        (element.children[1] as HTMLElement).style.margin = `${0}px`;
                    }
                }
                for (let j: number = 0; j < element.children?.length; j++) {
                    const pointElement: HTMLElement = element.children[j as number] as HTMLElement;
                    if (pointElement) {
                        pointElement.style.outline = 'none';
                        pointElement.style.margin = `${0}px`;
                    }
                }
            }
        }
    };

    /**
     * Handles the keyup event for chart keyboard interactions.
     * Determines the action key and target element, and prepares chart-related elements
     * for further processing such as marker or group selection.
     *
     * @param {KeyboardEvent} e - The keyboard event triggered by user input.
     * @returns {boolean} Indicates whether the keyup event was handled.
     */
    const chartKeyUp: (e: KeyboardEvent) => boolean = (e: KeyboardEvent): boolean => {
        let actionKey: string = '';
        let targetId: string = (e.target as Element)['id'];
        const chart: Chart = layoutRef.current.chart as Chart;
        let groupElement: SVGGElement | HTMLElement;
        let markerGroup: HTMLElement | null = null;
        const targetElement: HTMLElement = e.target as HTMLElement;
        const seriesElement: SVGGElement = seriesRef.current as SVGGElement;
        const legendElement: SVGGElement = legendRef.current?.firstElementChild as SVGGElement;
        if (seriesElement && seriesElement.firstElementChild && seriesElement.firstElementChild.children[1]) {
            const firstChild: HTMLElement = seriesElement.firstElementChild.children[1] as HTMLElement;
            let className: string = firstChild.getAttribute('class') as string;
            if (className && className.indexOf('sf-chart-focused') === -1) {
                className = className + ' sf-chart-focused';
            } else if (!className) {
                className = 'sf-chart-focused';
            }
            firstChild.setAttribute('class', className);
        }
        if (legendElement && legendElement.firstElementChild) {
            const firstChild: HTMLElement = legendElement.firstElementChild as HTMLElement;
            let className: string = firstChild.getAttribute('class') as string;
            if (className && className.indexOf('sf-chart-focused') === -1) {
                className = className + ' sf-chart-focused';
            }
            else if (!className) {
                className = 'sf-chart-focused';
            }
            firstChild.setAttribute('class', className);
        }
        if (e.code === 'Tab') {
            if (!isNullOrUndefined(chart.previousTargetId) && chart.previousTargetId !== '') {
                if ((chart.previousTargetId.indexOf('_Series_') > -1 && targetId.indexOf('_Series_') === -1)) {
                    groupElement = seriesRef.current as SVGGElement;
                    chart.currentPointIndex = 0;
                    chart.currentSeriesIndex = 0;
                }
                else if (chart.previousTargetId.indexOf('_chart_legend_g_') > -1 && targetId.indexOf('_chart_legend_g_') === -1) {
                    groupElement = legendRef.current?.firstElementChild as SVGGElement;
                    setTabIndex(groupElement.children[chart.currentLegendIndex] as HTMLElement,
                                groupElement.firstElementChild as HTMLElement);
                }
            }
            chart.previousTargetId = targetId;
            if (targetId.indexOf('SeriesGroup') > -1) {
                chart.currentSeriesIndex = +targetId.split('SeriesGroup')[1];
                targetElement.removeAttribute('tabindex');
                targetElement.blur();
                if (targetElement.children[1].id.indexOf('_Point_') === -1) {
                    markerGroup = document.getElementById(chart.element.id + 'SymbolGroup' + targetId.split('SeriesGroup')[1]) as HTMLElement;
                }
                targetId = focusChild(markerGroup != null ? markerGroup.children[1] as HTMLElement
                    : targetElement.children[1] as HTMLElement);
            }
            if (targetId.indexOf('_ChartTitle') > -1 || targetId.indexOf('_ChartSubTitle') > -1) {
                setNavigationStyle(e.target as HTMLElement);
            }
            actionKey = targetId !== parentElement.element.id ? 'Tab' : '';
        }
        else if (e.code.indexOf('Arrow') > -1) {
            e.preventDefault();
            if ((targetId.indexOf('_chart_legend_') > -1)) {
                const legendElement: HTMLCollection = targetElement?.parentElement?.children as HTMLCollection;
                legendElement[chart.currentLegendIndex].removeAttribute('tabindex');
                chart.currentLegendIndex += (e.code === 'ArrowUp' || e.code === 'ArrowRight') ? + 1 : - 1;
                chart.currentLegendIndex = getActualIndex(chart.currentLegendIndex, legendElement.length);
                const currentLegend: HTMLElement = legendElement[chart.currentLegendIndex] as HTMLElement;
                focusChild(currentLegend as HTMLElement);
                removeChartNavigationStyle();
                setNavigationStyle(currentLegend);
                targetId = currentLegend.children[1].id;
                actionKey = '';
            }
            else if (targetId.indexOf('_Series_') > -1) {
                groupElement = targetElement.parentElement?.parentElement as HTMLElement;
                let currentPoint: Element = e.target as Element;
                targetElement.removeAttribute('tabindex');
                targetElement.blur();
                if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
                    const seriesIndexes: number[] = [];
                    for (let i: number = 0; i < groupElement.children.length; i++) {
                        if (groupElement.children[i as number].id.indexOf('SeriesGroup') > -1) {
                            seriesIndexes.push(+groupElement.children[i as number].id.split('SeriesGroup')[1]);
                        }
                    }
                    chart.currentSeriesIndex = seriesIndexes.indexOf(chart.currentSeriesIndex) + (e.code === 'ArrowRight' ? 1 : -1);
                    chart.currentSeriesIndex = seriesIndexes[getActualIndex(chart.currentSeriesIndex, seriesIndexes.length)];
                }
                else {
                    chart.currentPointIndex += e.code === 'ArrowUp' ? 1 : -1;
                }
                if (targetId.indexOf('_Symbol') > -1) {
                    chart.currentPointIndex = getActualIndex(chart.currentPointIndex,
                                                             (document.getElementById(chart.element.id + 'SymbolGroup' + chart.currentSeriesIndex)?.childElementCount as number) - 2);
                    currentPoint = document.getElementById(chart.element.id + '_Series_' + chart.currentSeriesIndex + '_Point_' +
                        chart.currentPointIndex + '_Symbol0') as HTMLElement;
                }
                else if (targetId.indexOf('_Point_') > -1) {
                    chart.currentPointIndex = getActualIndex(chart.currentPointIndex,
                                                             (document.getElementById(chart.element.id + 'SeriesGroup' + chart.currentSeriesIndex)?.childElementCount as number) - 1);
                    currentPoint = document.getElementById(chart.element.id + '_Series_' + chart.currentSeriesIndex + '_Point_' +
                        chart.currentPointIndex) as HTMLElement;
                }
                targetId = focusChild(currentPoint as HTMLElement);
                actionKey = 'ArrowMove';
            }
        }
        else if ((e.code === 'Enter' || e.code === 'Space') && ((targetId.indexOf('_chart_legend_') > -1) ||
            (targetId.indexOf('_Point_') > -1) || layoutRef.current.chartSelection)) {
            targetId = (targetId.indexOf('_chart_legend_page') > -1) ? targetId : ((targetId.indexOf('_chart_legend_') > -1) ?
                targetElement.children[1]?.id : targetId);
            actionKey = 'Enter';
        }
        if (actionKey !== '') {
            chartKeyboardNavigations(e, targetId, actionKey);
        }
        return false;
    };

    /**
     * Handles keyboard navigation events within the chart.
     * Dispatches the appropriate chart event based on the action key and updates internal chart state.
     *
     * @param {KeyboardEvent} e - The keyboard event triggered by user interaction.
     * @param {string} targetId - The ID of the target element receiving the keyboard action.
     * @param {string} actionKey - The key representing the intended chart navigation action.
     * @returns {void} This function does not return a value.
     */
    const chartKeyboardNavigations: (e: KeyboardEvent, targetId: string, actionKey: string) => void =
        (e: KeyboardEvent, targetId: string, actionKey: string) => {
            const chart: Chart = layoutRef.current.chart as Chart;
            chart.isLegendClicked = false;
            const zoom: BaseZoom = layoutRef.current?.chartZoom as BaseZoom;
            removeChartNavigationStyle();
            if (actionKey !== 'Enter' && actionKey !== 'Space') {
                setNavigationStyle(document.getElementById(targetId) as HTMLElement);
            }
            const yArrowPadding: number = actionKey === 'ArrowUp' ? 10 : (actionKey === 'ArrowDown' ? -10 : 0);
            const xArrowPadding: number = actionKey === 'ArrowLeft' ? -10 : (actionKey === 'ArrowRight' ? 10 : 0);
            switch (actionKey) {
            case 'Tab':
            case 'ArrowMove':
                if (targetId?.indexOf('_Point_') > -1) {
                    const seriesIndex: number = +(targetId.split('_Series_')[1].split('_Point_')[0]);
                    const pointIndex: number = +(targetId.split('_Series_')[1].replace('_Symbol0', '').split('_Point_')[1]);
                    const pointRegion: ChartLocationProps = chart.visibleSeries[seriesIndex as number]?.points[pointIndex as number]?.
                        symbolLocations?.[0] as ChartLocationProps;
                    const seriesType: string =  chart.visibleSeries[seriesIndex as number]?.type as string;
                    chart.mouseX = pointRegion.x + chart.chartAxislayout.initialClipRect.x -
                        (seriesType.indexOf('StackingBar') > -1 ?
                            chart.visibleSeries[seriesIndex as number].marker?.height as number / 2 : 0);
                    chart.mouseY = pointRegion.y + chart.chartAxislayout.initialClipRect.y +
                        (seriesType.indexOf('StackingColumn') > -1 ?
                            chart.visibleSeries[seriesIndex as number].marker?.height as number / 2 : 0);

                    if (chart.tooltipModule?.enable || layoutRef.current.chartHighlight) {
                        const mouseEvent: MouseEvent = new MouseEvent('mousemove', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: chart.mouseX,
                            clientY: chart.mouseY
                        });
                        callChartEventHandlers('mouseMove', mouseEvent, chart, chart.mouseX, chart.mouseY);
                        if (layoutRef.current.chartHighlight) {
                            const targetElement: HTMLElement | null = document.getElementById(targetId);
                            const chartHighlight: BaseSelection = layoutRef.current?.chartHighlight as BaseSelection;
                            if (chartHighlight && chart) {
                                highlightChart(chart, chartHighlight, targetElement as Element,
                                               legendRef, seriesRef, layoutRef.current?.chartSelection &&
                                    (layoutRef.current?.chartSelection as BaseSelection).chartSelectedDataIndexes?.length as number > 0);
                            }
                        }
                    }
                }
                break;
            case 'Enter':
            case 'Space':
                if (targetId?.indexOf('_chart_legend_') > -1 || layoutRef.current.chartSelection) {
                    chart.isLegendClicked = true;
                    (chartSeries as unknown as SeriesProperties).visible = false;

                    const clickEvent: MouseEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    const targetElement: HTMLElement | null = document.getElementById(targetId);
                    targetElement?.dispatchEvent(clickEvent);
                    if (targetId?.indexOf('_chart_legend_') > -1) {
                        focusChild(targetElement?.parentElement as HTMLElement);
                        setNavigationStyle(targetElement?.parentElement as HTMLElement);
                    }
                    else {
                        focusChild(targetElement as HTMLElement);
                        setNavigationStyle(targetElement as HTMLElement);
                    }

                } else {
                    setNavigationStyle(e.target as HTMLElement);
                }
                break;
            case 'ESC':
                chart.tooltipRef?.current?.fadeOut();
                callChartEventHandlers('mouseLeave', new MouseEvent('mouseleave'), chart);
                if (trackballRef && trackballRef.current) {
                    const childElements: HTMLCollection = trackballRef.current.children as HTMLCollection;
                    for (let i: number = 0; i < childElements.length; i++) {
                        const element: HTMLElement = childElements[i as number] as HTMLElement;
                        if (element) {
                            element.style.display = 'none';
                        }
                    }
                }
                break;
            case 'Equal':
            case 'Minus':
                chart.isZoomed = chart.performedUI = true;
                zoom.isPanning = chart.isChartDrag = false;
                if (actionKey === 'Equal') {
                    zoomInOutCalculation(1, chart, chart.axisCollection, chart.zoomSettings.mode as ZoomMode);
                }
                else {
                    zoomInOutCalculation(-1, chart, chart.axisCollection, chart.zoomSettings.mode as ZoomMode);
                }
                performZoomRedraw(chart);
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                zoom.isPanning = chart.isChartDrag = true;
                chart.isChartDrag = true;
                doPan(chart, chart.axisCollection, xArrowPadding, yArrowPadding);
                performZoomRedraw(chart);
                redrawOnZooming(chart, true);
                break;
            case 'R':
                reset(chart, layoutRef.current?.chartZoom as BaseZoom);
                break;
            }
        };

    /**
     * Handles the pointer up event on the chart area.
     * Retrieves chart and layout dimensions to assist with interaction logic,
     * such as determining pointer position relative to the chart.
     *
     * @param {PointerEvent} event - The pointer event triggered when the user releases the mouse or touch input.
     * @returns {void} This function does not return a value.
     */
    const handleMouseUp: (event: PointerEvent) => void = useCallback((event: PointerEvent) => {
        const chart: Chart = layoutRef.current.chart as Chart;
        const rect: DOMRect = parentElement.element.getBoundingClientRect();
        let pageY: number;
        let pageX: number;
        if (event.type === 'touchend') {
            const touchArg: TouchEvent = event as unknown as TouchEvent;
            pageX = touchArg.changedTouches[0].clientX;
            chart.isTouch = true;
            pageY = touchArg.changedTouches[0].clientY;
        } else {
            pageY = event.clientY;
            pageX = event.clientX;
            chart.isTouch = event.pointerType === 'touch' || event.pointerType === '2';
        }

        const mouseX: number = pageX - rect.left;
        const mouseY: number = pageY - rect.top;

        chart.mouseX = mouseX;
        chart.mouseY = mouseY;
        chart.isChartDrag = false;
        callChartEventHandlers('mouseUp', event, chart, mouseX, mouseY);
        if (chart.isTouch) {
            chart.threshold = new Date().getTime() + 300;
        }
    }, [chartProps]);

    /**
     * Handles the mouse down event on the chart area.
     * Captures the chart instance and calculates layout-related dimensions
     * such as the bounding rectangles of the chart container and SVG element.
     * Also applies device-specific offset logic.
     *
     * @param {MouseEvent} event - The mouse event triggered by user interaction.
     * @returns {void} This function does not return a value.
     */
    const handleMouseDown: (event: MouseEvent) => void = useCallback((event: MouseEvent) => {
        const chart: Chart = layoutRef.current.chart as Chart;
        const rect: DOMRect = parentElement.element.getBoundingClientRect();
        const svgElement: SVGSVGElement = parentElement.element.querySelector('svg') as SVGSVGElement;
        const svgRect: DOMRect = svgElement?.getBoundingClientRect();
        const offset: number = Browser.isDevice ? 20 : 30;
        let pageX: number; let pageY: number;
        if (event.type === 'touchstart') {
            const touchEvent: TouchEvent = event as unknown as TouchEvent;
            chart.isTouch = true;
            pageX = touchEvent.changedTouches[0].clientX;
            pageY = touchEvent.changedTouches[0].clientY;
        } else {
            chart.isTouch = false;
            pageX = event.clientX;
            pageY = event.clientY;
        }
        const mouseDownX: number = (pageX - rect.left) - Math.max((svgRect?.left || 0) - rect.left, 0);
        const mouseDownY: number = (pageY - rect.top) - Math.max((svgRect?.top || 0) - rect.top, 0);

        chart.mouseDownX = chart.previousMouseMoveX = mouseDownX;
        chart.mouseDownY = chart.previousMouseMoveY = mouseDownY;
        chart.mouseX = mouseDownX;
        chart.mouseY = mouseDownY;

        //Handle double tap detection for touch events
        if (chart.isTouch) {
            const target: Element = event.target as Element;
            chart.isDoubleTap = (new Date().getTime() < chart.threshold && target.id.indexOf(chart.element.id + '_Zooming_') === -1 &&
                (chart.mouseDownX - offset >= chart.mouseX || chart.mouseDownX + offset >= chart.mouseX) &&
                (chart.mouseDownY - offset >= chart.mouseY || chart.mouseDownY + offset >= chart.mouseY) &&
                (chart.mouseX - offset >= chart.mouseDownX || chart.mouseX + offset >= chart.mouseDownX) &&
                (chart.mouseY - offset >= chart.mouseDownY || chart.mouseY + offset >= chart.mouseDownY));
        }
        callChartEventHandlers('mouseDown', event, chart, mouseDownX, mouseDownY);
    }, [chartProps]);

    /**
     * Handles the mouse wheel event on the chart area.
     * Dispatches the 'mouseWheel' event to chart event handlers if the chart instance is available.
     *
     * @param {WheelEvent} event - The wheel event triggered by user interaction.
     * @returns {void} This function does not return a value.
     */
    const handleMouseWheel: (event: WheelEvent) => void = useCallback((event: WheelEvent) => {
        const chart: Chart = layoutRef.current.chart as Chart;
        if (chart) {
            callChartEventHandlers('mouseWheel', event, chart);
        }
    }, []);

    /**
     * Triggers a click event for the data point under the cursor.
     *
     * @param {MouseEvent | PointerEvent} e - The mouse or pointer event that triggered the click
     * @param {Chart} chart - The chart instance containing the clicked point
     * @returns {void}
     */
    function triggerPointClickEvent(e: MouseEvent | PointerEvent, chart: Chart): void {
        triggerPointEvent(chart, e);
    }

    /**
     * Triggers a specific point event with the provided parameters.
     *
     * @param {Chart} chart - The chart instance containing the point
     * @param {MouseEvent | PointerEvent} evt - The original DOM event that triggered this action
     * @returns {void}
     */
    function triggerPointEvent(
        chart: Chart,
        evt: PointerEvent | MouseEvent
    ): void {
        // Get data for the point under cursor
        const pointData: PointData = getData(chart);
        const eventArgs: PointClickEvent = {
            seriesIndex: pointData.series?.index as number,
            pointIndex: pointData.point?.index as number,
            x: chart.mouseX,
            y: chart.mouseY,
            pageX: evt.pageX,
            pageY: evt.pageY
        };
        if (pointData.series && pointData.point) {
            if (chart.chartProps.onPointClick) {
                chart.chartProps.onPointClick(eventArgs);
            }
        }
    }

    /**
     * Handles the mouse leave event on the chart area.
     * Dispatches the 'mouseLeave' event to chart event handlers and resets drag state.
     *
     * @param {MouseEvent} event - The mouse event triggered when the pointer leaves the chart.
     * @returns {void} This function does not return a value.
     */
    const handleMouseLeave: (event: MouseEvent) => void = useCallback((event: MouseEvent) => {
        setIsMouseInside(false);
        const chart: Chart = layoutRef.current.chart as Chart;
        const element: Element = event.target as Element;
        const mouseArgs: ChartMouseEvent = {
            target: element.id,
            x: chart?.mouseX || 0,
            y: chart?.mouseY || 0
        };
        if (chartProps.onMouseLeave) {
            chartProps.onMouseLeave(mouseArgs);
        }
        callChartEventHandlers('mouseLeave', event, chart);
        void (chart && (chart.isChartDrag = false));
    }, [chartProps, parentElement]);

    /**
     * Handles chart resizing logic and disables animation during the resize event.
     * Constructs and dispatches a resize event to notify chart components.
     *
     * @returns {boolean} Indicates whether the resize operation was initiated.
     */
    const chartResize: () => boolean = () => {
        const chart: Chart = layoutRef.current.chart as Chart;
        chart.animateSeries = false;
        const arg: ResizeEvent = {
            currentSize: {
                width: 0,
                height: 0
            },
            previousSize: {
                width: availableSize.width,
                height: availableSize.height
            }
        };

        if (chart.resizeTo) {
            clearTimeout(chart.resizeTo);
        }

        chart.resizeTo = +setTimeout(() => {
            chart.availableSize = {
                height: stringToNumber(chartProps.height, parentElement.element.clientHeight) || 450,
                width: stringToNumber(chartProps.width, parentElement.element.clientWidth) || parentElement.element.clientWidth
            };
            parentElement.availableSize = arg.currentSize = chart.availableSize;
            triggerRemeasure();
            chartProps.onResize?.(arg);
        }, 500);

        return false;
    };

    // Attach events to the chart container
    useEffect(() => {
        const chartContainer: HTMLElement = parentElement.element;
        chartContainer.addEventListener('mousemove', handleMouseMove as EventListener);
        chartContainer.addEventListener('click', handleMouseClick);
        chartContainer.addEventListener('mousedown', handleMouseDown);
        chartContainer.addEventListener('mouseenter', handleMouseEnter);
        chartContainer.addEventListener('mouseup', handleMouseUp as EventListener);
        chartContainer.addEventListener('mouseleave', handleMouseLeave);
        chartContainer.addEventListener('wheel', handleMouseWheel);
        chartContainer.addEventListener('touchstart', handleMouseDown as EventListener);
        chartContainer.addEventListener('touchmove', handleMouseMove as EventListener);
        chartContainer.addEventListener('touchend', handleMouseUp as EventListener);
        window.addEventListener('keydown', documentKeyHandler);
        chartContainer.addEventListener('keydown', chartKeyDown);
        chartContainer.addEventListener('keyup', chartKeyUp);
        window.addEventListener('resize', chartResize);
        return () => {
            // Cleanup event listeners
            chartContainer.removeEventListener('mousemove', handleMouseMove as EventListener);
            chartContainer.removeEventListener('click', handleMouseClick);
            chartContainer.removeEventListener('mousedown', handleMouseDown);
            chartContainer.removeEventListener('mouseenter', handleMouseEnter);
            chartContainer.removeEventListener('mouseup', handleMouseUp as EventListener);
            chartContainer.removeEventListener('mouseleave', handleMouseLeave);
            chartContainer.removeEventListener('wheel', handleMouseWheel);
            chartContainer.removeEventListener('touchstart', handleMouseDown as EventListener);
            chartContainer.removeEventListener('touchmove', handleMouseMove as EventListener);
            chartContainer.removeEventListener('touchend', handleMouseUp as EventListener);
            window.removeEventListener('keydown', documentKeyHandler);
            chartContainer.removeEventListener('keydown', chartKeyDown);
            chartContainer.removeEventListener('keyup', chartKeyUp);
            window.removeEventListener('resize', chartResize);
        };
    }, [parentElement, handleMouseMove]);

    useEffect(() => {
        if (phase === 'rendering') {
            triggerRemeasure();
        }
    }, [parentElement?.availableSize?.height, parentElement?.availableSize?.width]);

    if (layoutRef.current.chart as Chart) {
        (layoutRef.current.chart as Chart).trackballRef = trackballRef;
    }

    const availableSize: ChartSizeProps = parentElement?.availableSize;
    return (
        render && <LayoutContext.Provider value={{
            setLayoutValue, layoutRef, phase, availableSize, triggerRemeasure, reportMeasured, disableAnimation,
            setDisableAnimation, animationProgress, setAnimationProgress, seriesRef, legendRef
        }}>
            <div
                id={`${parentElement?.element?.id}_Secondary_Element`}
            >
                {renderDataLabelTemplates(layoutRef.current.chart as Chart, dataLabelOptionsByChartId, animationProgress)}
                {chartAnnotation.length > 0 &&
                    renderChartAnnotations(
                        layoutRef.current.chart as Chart,
                        (chartAnnotation as ChartAnnotationProps[]).filter(
                            (annotation: ChartAnnotationProps) => isHtmlContent(annotation.content as string)),
                        animationProgress
                    )
                }
                {chartTooltip.template && chartTooltip.enable && (
                    <div id={`${parentElement?.element?.id}_tooltip`}>
                        <TooltipRenderer {...chartTooltip} />
                    </div>
                )}
            </div>
            <svg id={parentElement?.element?.id + '_svg'} width={availableSize.width} height={availableSize.height}>
                <ChartRenderer {...chartProps} />
                {chartTitle.text &&
                    <ChartTitleRenderer ref={titleRef} {...chartTitle}></ChartTitleRenderer>
                }
                {chartSubTitle.text &&
                    <ChartSubTitleRenderer ref={subtitleRef} {...chartSubTitle}></ChartSubTitleRenderer>
                }
                {chartLegend.visible &&
                    <ChartLegendRenderer {...chartLegend}></ChartLegendRenderer>
                }
                <ChartAreaRenderer {...chartArea}></ChartAreaRenderer>
                <ChartColumnsRender columns={columns} ></ChartColumnsRender>
                <ChartRowsRender rows={rows} ></ChartRowsRender>
                <AxisRenderer axes={axisCollection} ></AxisRenderer>
                {striplineVisibility &&
                    <StripLineBeforeRenderer axes={axisCollection} />
                }
                {(chartSeries.length > 0) &&
                    <SeriesRenderer ref={seriesRef} {...chartSeries as ChartSeriesProps[]} />
                }
                <AxisOutsideRenderer></AxisOutsideRenderer>
                {striplineVisibility &&
                    <StripLineAfterRenderer axes={axisCollection} />
                }
                {chartStackLabels.visible &&
                    <ChartStackLabelsRenderer {...chartStackLabels} />
                }
                {(chartZoom.selectionZoom || chartZoom.mouseWheelZoom || chartZoom.pinchZoom) &&
                    <>
                        <ZoomContent {...chartZoom}></ZoomContent>
                        <ZoomToolkit {...chartZoom}></ZoomToolkit>
                    </>
                }
                {chartLegend.visible &&
                    < CustomLegendRenderer ref={legendRef}  {...chartLegend}></CustomLegendRenderer >
                }
                {chartCrosshair.enable &&
                    <ChartCrosshairRenderer {...chartCrosshair} />
                }
                {chartAnnotation.length > 0 &&
                    <ChartAnnotationRenderer {...chartAnnotation} />
                }
                {chartTooltip.enable &&
                    <TrackballRenderer ref={trackballRef}  {...chartTooltip} />
                }
                {!chartTooltip.template && chartTooltip.enable &&
                    <TooltipRenderer {...chartTooltip} />
                }
                <SelectionRenderer {...chartSelection}></SelectionRenderer>
                <HighlightRenderer {...chartHighlight}></HighlightRenderer>
            </svg>
        </LayoutContext.Provider>
    );
};

/**
 * Custom React hook to access the layout context.
 * Provides layout-related state and functions such as phase tracking,
 * animation control, and chart measurement utilities.
 *
 * @returns {LayoutContextType} The current layout context object.
 */
export const useLayout: () => LayoutContextType = () => {
    const ctx: LayoutContextType = useContext(LayoutContext) as LayoutContextType;
    return ctx;
};

/**
 * Triggers a click event on an axis label within a chart.
 *
 * @param {PointerEvent | TouchEvent} e - The event object representing the pointer or touch interaction.
 * @param {Chart} chart - The chart instance to which the axis label belongs.
 * @returns {void}
 * @private
 */
export function triggerAxisLabelClickEvent(e: PointerEvent | TouchEvent, chart: Chart): void {
    const targetElement: Element = e.target as Element;
    const clickEvt: PointerEvent = e as PointerEvent;
    if (targetElement.id.indexOf('_AxisLabel_') !== -1) {
        const index: string[] = targetElement.id.split('_AxisLabel_');
        const axisIndex: number = +index[0].slice(-1);
        const labelIndex: number = +index[1];
        const currentAxis: AxisModel = chart.axisCollection[axisIndex as number];
        if (currentAxis.visible) {
            const argsData: AxisLabelClickEvent = {
                axisName: currentAxis.name as string,
                text: currentAxis.visibleLabels[labelIndex as number].text as string,
                index: labelIndex,
                location: { x: clickEvt.pageX, y: clickEvt.pageY },
                value: currentAxis.visibleLabels[labelIndex as number].value
            };
            chart.chartProps.onAxisLabelClick?.(argsData);
        }
    }
}

/**
 * Returns a valid index within the bounds of a collection.
 * If the index exceeds the upper bound, it wraps to 0.
 * If the index is below 0, it wraps to the last item.
 *
 * @param {number} index - The desired index to validate.
 * @param {number} totalLength - The total number of items in the collection.
 * @returns {number} A valid index within the range [0, totalLength - 1].
 */
export const getActualIndex: (index: number, totalLength: number) => number = (index: number, totalLength: number) => {
    return index > totalLength - 1 ? 0 : (index < 0 ? totalLength - 1 : index);
};

/**
 * Updates the tabindex attributes to manage focus between two HTML elements.
 * Removes the tabindex from the previously focused element and sets it on the current one
 * to ensure proper keyboard navigation and accessibility.
 *
 * @param {HTMLElement} previousElement - The element that previously had focus.
 * @param {HTMLElement} currentElement - The element to receive focus.
 * @returns {void} This function does not return a value.
 */

export const setTabIndex: (previousElement: HTMLElement, currentElement: HTMLElement) => void =
    (previousElement: HTMLElement, currentElement: HTMLElement) => {
        if (previousElement) {
            previousElement.removeAttribute('tabindex');
        }
        if (currentElement) {
            currentElement.setAttribute('tabindex', '0');
        }
    };

/**
 * Sets focus on the specified HTML element and applies a focus-related CSS class.
 * Ensures the element is keyboard-focusable and visually marked as focused.
 *
 * @param {HTMLElement} element - The target HTML element to focus.
 * @returns {string} The ID of the focused element.
 */
export const focusChild: (element: HTMLElement) => string = (element: HTMLElement) => {
    element?.setAttribute('tabindex', '0');
    let className: string = element?.getAttribute('class') as string;
    element?.setAttribute('tabindex', '0');
    if (className && className.indexOf('sf-chart-focused') === -1) {
        className = 'sf-chart-focused ' + className;
    } else if (!className) {
        className = 'sf-chart-focused';
    }
    element?.setAttribute('class', className);
    element?.focus();
    return element?.id;
};
