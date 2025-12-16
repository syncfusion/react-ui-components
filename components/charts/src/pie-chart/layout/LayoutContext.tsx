//LayoutContext.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ChartContext } from './ChartProvider';
import { Chart, Points, SeriesProperties } from '../base/internal-interfaces';
import { ChartRenderer } from '../renderer/ChartRenderer';
import { ChartTitleRenderer } from '../renderer/ChartTitleRenderer';
import { ChartSubTitleRenderer } from '../renderer/ChartSubtitleRender';
import { ChartLegendRenderer, CustomLegendRenderer } from '../renderer/LegendRenderer/ChartLegendRenderer';
import { ChartSeriesRenderer } from '../renderer/series-renderer/ChartSeriesRenderer';
import { callChartEventHandlers } from '../hooks/events';
import { CenterLabelRenderer } from '../renderer/ChartCenterLabelRender';
import { PieChartMouseEvent, PieChartSizeProps, PiePointClickEvent, PieResizeEvent } from '../base/interfaces';
import { Browser, isNullOrUndefined } from '@syncfusion/react-base';
import { PieChartTooltipRenderer, PointData } from '../renderer/ChartTooltipRenderer';
import { indexFinder, stringToNumber } from '../utils/helper';

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

    const { render, parentElement, chartProps, chartTitle, chartSubTitle, chartSeries, centerLabel
        , chartLegend, chartTooltip } = useContext(ChartContext);

    const measuredKeysRef: React.RefObject<Set<string>> = useRef<Set<string>>(new Set());
    const layoutRef: React.RefObject<Chart> = useRef<Chart>({} as Chart);
    const titleRef: React.RefObject<SVGTextElement | null> = useRef<SVGTextElement>(null);
    const subtitleRef: React.RefObject<SVGTextElement | null> = useRef<SVGTextElement>(null);
    const seriesRef: React.RefObject<SVGGElement | null> = useRef<SVGGElement>(null);
    const legendRef: React.RefObject<SVGGElement | null> = useRef<SVGGElement>(null);
    const [isMouseInside, setIsMouseInside] = useState(false);
    const [disableAnimation, setDisableAnimation] = useState(false);
    const [isSeriesAnimated, setSeriesAnimated] = useState(false);

    useEffect(() => {
        if (phase === 'rendering') {
            triggerRemeasure();
        }
    }, [parentElement?.availableSize?.height, parentElement?.availableSize?.width]);

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
        layoutRef.current = {} as Chart;
        setPhase('measuring');
    }, []);

    const expectedKeys: string[] = useMemo(() => {
        const keys: string[] = ['Chart', 'ChartSeries'];
        if (chartTitle?.text) {
            keys.push('ChartTitle');
        }
        if (chartSubTitle?.text) {
            keys.push('ChartSubTitle');
        }
        if (chartLegend.visible) {
            keys.push('ChartLegend');
        }
        return keys;
    }, [
        chartTitle?.text,
        chartSubTitle?.text,
        chartLegend?.visible
    ]);

    const reportMeasured: (key: string) => void = useCallback((key: string) => {
        measuredKeysRef.current.add(key);

        if (measuredKeysRef.current.size === expectedKeys.length) {

            setPhase('rendering');
        }
    }, [expectedKeys]);

    /**
     * Handles mouse click events on the chart area.
     * Retrieves the chart instance and identifies the clicked target element.
     * Increments the chart's internal click count for interaction tracking.
     *
     * @param {MouseEvent} event - The mouse event triggered by user interaction.
     * @returns {void} This function does not return a value.
     */
    const handleMouseClick: (event: MouseEvent) => void = useCallback((event: MouseEvent) => {
        const chart: Chart = layoutRef.current as Chart;
        const targetId: string = (event.target as HTMLElement)?.id || '';
        chart.clickCount++;
        // Call all registered click handlers
        callChartEventHandlers('click', event, chart, targetId);
        if (chartProps.onClick) {
            const mouseArgs: PieChartMouseEvent = {
                target: (event.target as HTMLElement)?.id,
                x: event.clientX,
                y: event.clientY
            };
            chartProps.onClick(mouseArgs);
        }

        if (chart.clickCount === 1 && chartProps.onPointClick) {
            chart.clickCount = 0;
            triggerPointClickEvent(event as PointerEvent, chart);
        }
        removeNavigationStyle(parentElement.element);
        removeChartNavigationStyle();
    }, [chartProps]);

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

        const element: Element | null = evt.target as Element | null;
        const id: string = element?.id ?? '';
        const pointIndex: number = indexFinder(id) as number;
        if (isNullOrUndefined(pointIndex) || Number.isNaN(pointIndex)) {
            return;
        }
        const series: SeriesProperties | undefined = chart.visibleSeries?.[0];
        if (!series) { return; }

        const points: Points[] = series.points as Points[];
        const point: Points | undefined = points[pointIndex as number];

        const pointData: PointData = { point, series };

        const eventArgs: PiePointClickEvent = {
            seriesIndex: pointData.series?.index as number,
            pointIndex: pointData.point?.index as number,
            x: chart.mouseX,
            y: chart.mouseY
        };
        if (pointData.series && pointData.point) {
            if (chartProps?.onPointClick) {
                chartProps?.onPointClick(eventArgs);
            }
        }
    }

    /**
     * Handles chart resizing logic and disables animation during the resize event.
     * Constructs and dispatches a resize event to notify chart components.
     *
     * @returns {boolean} Indicates whether the resize operation was initiated.
     */
    const chartResize: () => boolean = () => {
        const chart: Chart = layoutRef.current as Chart;
        chart.animateSeries = false;
        const arg: PieResizeEvent = {
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
            const parentEl: HTMLElement = parentElement.element as HTMLElement;
            const svg: SVGSVGElement| null = parentEl.querySelector('svg') as SVGSVGElement | null;

            // Temporarily collapse the SVG so it does not contribute to parent's size
            let prevCssText: string = '';
            if (svg) {
                prevCssText = (svg.style && svg.style.cssText) || '';
                svg.style.cssText = `${prevCssText};position:absolute !important;visibility:hidden !important;width:0 !important;height:0 !important;overflow:hidden !important;pointer-events:none !important;`;
            }

            const measuredHeight: number = parentEl.clientHeight || 0;
            const measuredWidth: number = parentEl.clientWidth || 0;

            // Restore SVG styles
            if (svg) {
                svg.style.cssText = prevCssText;
            }

            chart.availableSize = {
                height: stringToNumber(chartProps.height, measuredHeight) || measuredHeight || 450,
                width: stringToNumber(chartProps.width, measuredWidth) || measuredWidth
            };
            parentElement.availableSize = arg.currentSize = chart.availableSize;
            triggerRemeasure();
            chartProps.onResize?.(arg);
        }, 500);

        return false;
    };

    /**
     * Handles pointer movement over the chart area.
     * Retrieves the chart instance and layout dimensions to support dynamic interactions
     * such as tooltips, crosshairs, or hover effects.
     *
     * @param {PointerEvent} event - The pointer event triggered by user movement.
     * @returns {void} This function does not return a value.
     */
    const handleMouseMove: (event: PointerEvent) => void = useCallback((event: PointerEvent) => {
        const chart: Chart = layoutRef.current as Chart;
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
            const mouseArgs: PieChartMouseEvent = {
                target: (event.target as HTMLElement)?.id,
                x: event.clientX,
                y: event.clientY
            };
            chartProps.onMouseMove(mouseArgs);
        }
    }, [chartProps]);

    useEffect(() => {
        if (phase === 'rendering') {
            triggerRemeasure();
        }
    }, [parentElement?.availableSize?.height, parentElement?.availableSize?.width]);

    /**
     * Handles the pointer up event on the chart area.
     * Retrieves chart and layout dimensions to assist with interaction logic,
     * such as determining pointer position relative to the chart.
     *
     * @param {PointerEvent} event - The pointer event triggered when the user releases the mouse or touch input.
     * @returns {void} This function does not return a value.
     */
    const handleMouseUp: (event: PointerEvent) => void = useCallback((event: PointerEvent) => {
        const chart: Chart = layoutRef.current as Chart;
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
        const chart: Chart = layoutRef.current as Chart;
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
            const chart: Chart = layoutRef.current as Chart;
            const rect: DOMRect = parentElement.element.getBoundingClientRect();

            const mouseX: number = event.clientX - rect.left;
            const mouseY: number = event.clientY - rect.top;

            // Update chart mouse coordinates
            if (chart) {
                chart.mouseX = mouseX;
                chart.mouseY = mouseY;
            }

            if (chartProps.onMouseEnter) {
                const mouseArgs: PieChartMouseEvent = {
                    target: (event.target as HTMLElement)?.id,
                    x: event.clientX,
                    y: event.clientY
                };
                chartProps.onMouseEnter(mouseArgs);
            }
        }
    }, [chartProps, isMouseInside]);

    /**
     * Handles the mouse leave event on the chart area.
     * Dispatches the 'mouseLeave' event to chart event handlers and resets drag state.
     *
     * @param {MouseEvent} event - The mouse event triggered when the pointer leaves the chart.
     * @returns {void} This function does not return a value.
     */
    const handleMouseLeave: (event: MouseEvent) => void = useCallback((event: MouseEvent) => {
        setIsMouseInside(false);
        const chart: Chart = layoutRef.current as Chart;
        const element: Element = event.target as Element;
        const mouseArgs: PieChartMouseEvent = {
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
     * Applies visual focus styling to the specified chart element.
     * Sets outline and margin styles to indicate keyboard focus.
     *
     * @param {HTMLElement} element - The target element to style and focus.
     * @returns {void} This function does not return a value.
     */
    const setNavigationStyle: (element: HTMLElement) => void = (element: HTMLElement) => {
        if (element) {
            element.focus();
            element.style.outline = `${chartProps.focusOutline?.width || 1.5}px solid ${chartProps.focusOutline?.color || layoutRef.current.themeStyle.tabColor}`;
            element.style.margin = `${chartProps.focusOutline?.offset || 0}px`;
        }
    };

    /**
     * Clears focus styling from all navigable chart elements.
     * Removes outline and margin styles applied during keyboard navigation.
     *
     * @returns {void} This function does not return a value.
     */
    const removeKeyboardNavigationStyle: () => void = () => {
        const currentElement: NodeList = document.querySelectorAll(`path[id*=_Series_0_Point_], [id*=${layoutRef.current.element.id}], [id*=_ChartBorder], text[id*=_title],g[id*=_chart_legend]`);
        if (currentElement) {
            currentElement.forEach((element: Node) => {
                if (element instanceof HTMLElement || element instanceof SVGElement) {
                    element.style.setProperty('outline', 'none');
                    element.style.setProperty('margin', '');
                }
            });
        }
    };

    /**
     * Returns a valid index within bounds by wrapping around the total length.
     * Used for cyclic navigation (e.g., legend items or slices).
     *
     * @param {number} index - The desired index to validate.
     * @param {number} totalLength - The total number of items in the collection.
     * @returns {number} A valid index within the range [0, totalLength - 1].
     */
    const getActualIndex: (index: number, totalLength: number) => number = (index: number, totalLength: number): number => {
        return index > totalLength - 1 ? 0 : (index < 0 ? totalLength - 1 : index);
    };

    /**
     * Updates tabindex attributes for keyboard navigation.
     * Removes tabindex from the previously focused element and sets it on the current one.
     *
     * @param {HTMLElement} previousElement - The element that previously had focus.
     * @param {HTMLElement} currentElement - The element to receive focus.
     * @returns {void} This function does not return a value.
     */
    const setTabIndex: (previousElement: HTMLElement, currentElement: HTMLElement) => void =
    (previousElement: HTMLElement, currentElement: HTMLElement): void => {
        void ((previousElement) &&
            previousElement.removeAttribute('tabindex'));
        void ((currentElement) &&
            currentElement.setAttribute('tabindex', '0'));
    };

    /**
     * Sets focus on the specified chart element and applies focus class.
     * Ensures the element is keyboard-navigable by setting tabindex.
     *
     * @param {HTMLElement} element - The target HTML element to focus.
     * @returns {string} The ID of the focused element.
     */
    const focusTarget: (element: HTMLElement) => string = (element: HTMLElement) => {
        let className: string = element.getAttribute('class') as string;
        element?.setAttribute('tabindex', '0');
        if (className && className.indexOf('e-pieChart-focused') === -1) {
            className = className + ' e-pieChart-focused';
        } else if (!className) {
            className = 'e-pieChart-focused';
        }
        element.setAttribute('tabindex', '0');
        element.setAttribute('class', className);
        element.focus();
        return element.id;
    };

    /**
     * Handles global keyboard shortcuts for chart accessibility.
     * Focuses the chart container when Alt + J is pressed.
     *
     * @param {KeyboardEvent} e - The keyboard event triggered by user input.
     * @returns {void} This function does not return a value.
     */
    const documentKeyHandler: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
        if (e.altKey && e.keyCode === 74 && layoutRef.current.element) {
            layoutRef.current.element.focus();
        }
    };

    /**
     * Handles keydown events for keyboard navigation in accumulation charts.
     * Detects Tab, Escape, and Arrow keys to manage focus and tooltip behavior.
     *
     * @param {KeyboardEvent} e - The keyboard event triggered by user input.
     * @returns {boolean} Indicates whether the keydown event was handled.
     */
    const accumulationChartKeyDown: (e: KeyboardEvent) => boolean = (e: KeyboardEvent): boolean => {
        const chart: Chart & {tabHandled?: boolean } = layoutRef.current as Chart & {tabHandled?: boolean };
        let actionKey: string = '';
        if (e.code === 'Tab') {
            const currId: string = (e.target as Element)?.id || '';

            // Determine if a legend target exists
            const legendId: string = chart?.chartLegend?.legendID as string;
            const legendTranslate: HTMLElement | null = document.getElementById(`${legendId}_translate_g`) as HTMLElement;
            const pageUpEl: HTMLElement | null = document.getElementById(`${legendId}_pageup`) as HTMLElement;
            const hasLegendTarget: boolean = !!(legendTranslate?.firstElementChild || pageUpEl);

            // When tabbing from a slice
            if (currId.indexOf('_Point_') > -1) {
                if (hasLegendTarget) {
                    // We can move focus within chart to legend: prevent default and focus the legend
                    e.preventDefault();

                    try {
                        chart.tooltipRef?.current?.fadeOut?.();
                        const leaveEvt: MouseEvent = new MouseEvent('mouseleave', { bubbles: true, cancelable: true, view: window });
                        // Dispatch on the chart container so internal mouse-leave logic runs
                        parentElement.element.dispatchEvent(leaveEvt);
                        callChartEventHandlers('mouseLeave', leaveEvt, chart);
                    } catch {
                        // no op
                    }

                    const toFocus: HTMLElement =
                        (legendTranslate?.firstElementChild as HTMLElement) ?? (pageUpEl as HTMLElement);

                    if (toFocus) {
                        focusTarget(toFocus);
                        setNavigationStyle(toFocus);
                        if (legendTranslate && legendTranslate.firstElementChild?.lastElementChild?.id) {
                            chart.previousTargetId = (legendTranslate.firstElementChild.lastElementChild as Element).id;
                        } else {
                            chart.previousTargetId = toFocus.id;
                        }
                    }
                    chart.tooltipRef?.current?.fadeOut?.();
                    chart.tabHandled = true;
                    return false;
                } else {
                    try {
                        chart.tooltipRef?.current?.fadeOut?.();
                        const leaveEvt: MouseEvent = new MouseEvent('mouseleave', { bubbles: true, cancelable: true, view: window });
                        parentElement.element.dispatchEvent(leaveEvt);
                        callChartEventHandlers('mouseLeave', leaveEvt, chart);
                    } catch {
                        // no op
                    }
                    removeKeyboardNavigationStyle();
                    chart.previousTargetId = currId;
                    chart.tabHandled = false;
                    return false;
                }
            }
        }
        if (chart.tooltipModule.enable && ((e.code === 'Tab' && chart.previousTargetId.indexOf('Series') > -1) || e.code === 'Escape')) {
            actionKey = 'ESC';
        }
        if (e.code.indexOf('Arrow') > -1) {
            e.preventDefault();
        }
        if (actionKey !== '') {
            accumulationChartKeyboardNavigations(e, (e.target as HTMLElement).id, actionKey);
        }
        if (e.code === 'Tab') {
            removeKeyboardNavigationStyle();
        }
        return false;
    };

    /**
     * Handles keyup events for keyboard navigation in accumulation charts.
     * Manages focus transitions between title, subtitle, series slices, and legend items.
     * Dispatches appropriate action keys for tooltip and legend interactions.
     *
     * @param {KeyboardEvent} e - The keyboard event triggered by user input.
     * @returns {boolean} Indicates whether the keyup event was handled.
     */
    const accumulationChartKeyUp: (e: KeyboardEvent) => boolean = (e: KeyboardEvent): boolean => {
        const chart: Chart & {
            currentLegendIndex?: number;
            currentPointIndex?: number;
            previousTargetId?: string;
            tabHandled: boolean;
        } = layoutRef.current as Chart & {
            currentLegendIndex?: number;
            currentPointIndex?: number;
            previousTargetId?: string;
            tabHandled: boolean;
        };

        chart.currentLegendIndex = chart.currentLegendIndex ?? 0;
        chart.currentPointIndex = chart.currentPointIndex ?? 0;
        //chart.previousTargetId = chart.previousTargetId;

        let actionKey: string = '';
        let targetId: string = (e.target as Element)?.id || '';
        const activeElement: HTMLElement = (document.activeElement as HTMLElement) || (e.target as HTMLElement);

        const legendId: string | undefined = (chart)?.chartLegend?.legendID;
        const legendTranslate: HTMLElement = document.getElementById(`${legendId}_translate_g`) as HTMLElement;
        const pageUpEl: HTMLElement = (document.getElementById(`${legendId}_pageup`) as (HTMLElement));

        if (legendTranslate && legendTranslate.firstElementChild) {
            const firstElement: Element = legendTranslate.firstElementChild as Element;
            const firstElementClass: string = firstElement.getAttribute('class') || '';
            if (firstElementClass.indexOf('e-pieChart-focused') === -1) {
                firstElement.setAttribute('class', (firstElementClass ? `${firstElementClass} ` : '') + 'e-pieChart-focused');
            }
        }
        if (pageUpEl) {
            pageUpEl.setAttribute('class', 'e-pieChart-focused');
        }
        removeKeyboardNavigationStyle();
        if (e.code === 'Tab') {
            if (chart.tabHandled) {
                targetId = activeElement?.id || targetId;
                chart.tabHandled = false;
            }
            if (chart.previousTargetId !== '') {
                if (chart.previousTargetId.indexOf('_Point_') > -1 && targetId.indexOf('_Point_') === -1) {
                    try {
                        chart.tooltipRef?.current?.fadeOut?.();
                        const leaveEvt: MouseEvent = new MouseEvent('mouseleave', { bubbles: true, cancelable: true, view: window });
                        parentElement.element.dispatchEvent(leaveEvt);
                        callChartEventHandlers('mouseLeave', leaveEvt, chart);
                    } catch {
                        // no op
                    }
                    const groupElement: HTMLElement = document.getElementById(chart.previousTargetId)?.parentElement as HTMLElement;
                    if (groupElement && groupElement.children.length > 0) {
                        setTabIndex(groupElement.children[chart.currentPointIndex as number] as HTMLElement,
                                    groupElement.firstElementChild as HTMLElement);
                    }
                    chart.currentPointIndex = 0;
                } else if (
                    chart.previousTargetId.indexOf('_chart_legend_g_') > -1 &&
                    targetId.indexOf('_chart_legend_g_') === -1 &&
                    legendTranslate
                ) {
                    setTabIndex(legendTranslate.children[chart.currentLegendIndex as number] as HTMLElement,
                                legendTranslate.firstElementChild as HTMLElement);
                }
            }

            chart.previousTargetId = targetId;

            if (targetId.indexOf('_chart_legend_g_') > -1) {
                const labelId: string = (e.target as Element)?.lastElementChild?.id as string;
                if (labelId) { targetId = labelId; }
                actionKey = 'Tab'; // only when landing on legend (normalize label id)
            } else if (targetId.indexOf('_Point_') > -1) {
                // Make only the current slice tabbable; others not
                const groupElement: HTMLElement | null = (document.getElementById(targetId) as HTMLElement)?.parentElement as HTMLElement;
                if (groupElement) {
                    for (let i: number = 0; i < groupElement.children.length; i++) {
                        const child: HTMLElement = groupElement.children[i as number] as HTMLElement;
                        if (child.id.indexOf('_Point_') > -1) {
                            child.setAttribute('tabindex', child.id === targetId ? '0' : '-1');
                        }
                    }
                }
                if ((chart)?.tooltipModule?.enable) {
                    actionKey = 'Tab'; // only for slice to show tooltip via simulated mousemove
                }
            } else {
                // Focus moved outside chart; ensure tooltip is hidden
                chart?.tooltipRef?.current?.fadeOut?.();
            }

            // Apply focus styles to the current target if it’s inside the chart
            const isInsideChart: boolean = !!targetId && targetId.indexOf(chart.element.id) > -1;
            if (isInsideChart) {
                const targetElement: HTMLElement = document.getElementById(targetId) as HTMLElement;
                if (targetElement) { setNavigationStyle(targetElement); }
            }
        }
        else if (e.code.indexOf('Arrow') > -1) {
            e.preventDefault();
            if (targetId.indexOf('_chart_legend_page') > -1) {
                (activeElement as Element).removeAttribute('tabindex');
                const nextId: string = `${legendId}_page${e.code === 'ArrowRight' ? 'up' : 'down'}`;
                chart.previousTargetId = targetId = nextId;
                const el: HTMLElement = document.getElementById(nextId) as HTMLElement;
                void (el && focusTarget(el as HTMLElement));
            }
            else if (targetId.indexOf('_chart_legend_') > -1 && legendTranslate) {
                (activeElement as Element).removeAttribute('tabindex');
                const arrowDirection: 1 | -1 = (e.code === 'ArrowUp' || e.code === 'ArrowRight') ? +1 : -1;
                chart.currentLegendIndex = getActualIndex((chart.currentLegendIndex as number)
                + arrowDirection, legendTranslate.children.length);
                const currentLegend: HTMLElement = legendTranslate.children[chart.currentLegendIndex as number] as HTMLElement;
                focusTarget(currentLegend);
                setNavigationStyle(currentLegend);
                chart.previousTargetId = targetId = (currentLegend.lastElementChild as Element).id;
                actionKey = 'ArrowMove';
            }
            else if (targetId.indexOf('_Point_') > -1) {
                (activeElement as Element).setAttribute('tabindex', '-1');
                const arrowDirection: 1 | -1 = (e.code === 'ArrowUp' || e.code === 'ArrowRight') ? +1 : -1;
                chart.currentPointIndex = (chart.currentPointIndex ?? 0) + arrowDirection;
                const groupElement: HTMLElement = (e.target as Element).parentElement as HTMLElement;
                let total: number = 0;
                if (groupElement) {
                    for (let i: number = 0; i < groupElement.children.length; i++) {
                        void (groupElement.children[i as number].id.indexOf('_Point_') > -1 && (total++));
                    }
                }
                chart.currentPointIndex = getActualIndex(chart.currentPointIndex as number, total);
                const nextPointId: string = `${chart.element.id}_Series_0_Point_${chart.currentPointIndex}`;
                const pointElement: HTMLElement = document.getElementById(nextPointId) as HTMLElement;
                if (pointElement) {
                    focusTarget(pointElement);
                    setNavigationStyle(pointElement);
                }
                actionKey = ((chart)?.tooltipModule?.enable) ? 'ArrowMove' : '';
                targetId = nextPointId;
            }
        }
        else if (
            (e.code === 'Enter' || e.code === 'Space') &&
            (targetId.indexOf('_chart_legend_') > -1 || targetId.indexOf('_Point_') > -1)
        ) {
            if (targetId.indexOf('_chart_legend_g') > -1) {
                const labelId: string = (e.target as Element)?.lastElementChild?.id as string;
                void (labelId && (targetId = labelId));
            }
            actionKey = 'Enter';
        }
        if (actionKey !== '') {
            accumulationChartKeyboardNavigations(e, targetId, actionKey);
        }
        return false;
    };

    /**
     * Executes chart-specific actions based on keyboard navigation.
     * Supports tooltip rendering, legend item activation, and tooltip dismissal.
     *
     * @param {KeyboardEvent} e - The keyboard event triggered by user interaction.
     * @param {string} targetId - The ID of the target element receiving the keyboard action.
     * @param {string} actionKey - The key representing the intended chart navigation action.
     * @returns {void} This function does not return a value.
     */
    const accumulationChartKeyboardNavigations: (e: KeyboardEvent, targetId: string, actionKey: string) => void =
        (e: KeyboardEvent, targetId: string, actionKey: string): void => {
            layoutRef.current.isLegendClicked = false;
            switch (actionKey) {
            case 'Tab':
            case 'ArrowMove': {
                if (targetId.indexOf('_Point_') > -1) {
                    const seriesIndex: number = +(targetId.split('_Series_')[1].split('_Point_')[0]);
                    const pointIndex: number = +(targetId.split('_Series_')[1].replace('_Symbol', '').split('_Point_')[1]);
                    const pointRegion: Points = layoutRef.current.visibleSeries?.[seriesIndex as number]?.points?.[pointIndex as number];
                    if (pointRegion?.symbolLocation) {
                        layoutRef.current.mouseX = pointRegion.symbolLocation.x + layoutRef.current.clipRect.x;
                        layoutRef.current.mouseY = pointRegion.symbolLocation.y + layoutRef.current.clipRect.y;
                        if (layoutRef.current.tooltipModule?.enable && layoutRef.current.tooltipRef.current) {
                            const pointElement: HTMLElement = document.getElementById(targetId) as HTMLElement;
                            const container: HTMLElement = layoutRef.current.element as HTMLElement;
                            const rect: DOMRect = container.getBoundingClientRect();
                            const clientX: number = layoutRef.current.mouseX + rect.left;
                            const clientY: number = layoutRef.current.mouseY + rect.top;
                            const mouseEvent: MouseEvent = new MouseEvent('mousemove', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                clientX,
                                clientY
                            });
                            if (pointElement) { pointElement.dispatchEvent(mouseEvent); }
                            callChartEventHandlers(
                                'mouseMove', mouseEvent, layoutRef.current, layoutRef.current.mouseX, layoutRef.current.mouseY
                            );
                        }
                    }
                }
                break;
            }
            case 'Enter':
            case 'Space': {
                if (targetId.indexOf('_chart_legend_') > -1) {
                    layoutRef.current.isLegendClicked = true;
                    const element: HTMLElement = document.getElementById(targetId) as HTMLElement;
                    if (element) {
                        const clickEvent: MouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                        element.dispatchEvent(clickEvent);
                        const parent: HTMLElement = element.parentElement as HTMLElement;
                        void (parent && (
                            focusTarget(parent) &&
                            setNavigationStyle(document.getElementById(targetId)?.parentElement as HTMLElement)));
                    }
                } else {
                    setNavigationStyle(e.target as HTMLElement);
                }
                break;
            }
            case 'ESC': {
                layoutRef.current.tooltipRef?.current?.fadeOut();
                break;
            }
            }
        };

    useEffect(() => {
        const chartContainer: HTMLElement = parentElement.element;
        // Add event listeners
        chartContainer.addEventListener('mousemove', handleMouseMove as EventListener);
        chartContainer.addEventListener('click', handleMouseClick);
        chartContainer.addEventListener('mouseleave', handleMouseLeave);
        chartContainer.addEventListener('mousedown', handleMouseDown);
        chartContainer.addEventListener('mouseenter', handleMouseEnter);
        chartContainer.addEventListener('mouseup', handleMouseUp as EventListener);
        chartContainer.addEventListener('touchstart', handleMouseDown as EventListener);
        chartContainer.addEventListener('touchmove', handleMouseMove as EventListener);
        chartContainer.addEventListener('touchend', handleMouseUp as EventListener);
        window.addEventListener('keydown', documentKeyHandler);
        chartContainer.addEventListener('keydown', accumulationChartKeyDown);
        chartContainer.addEventListener('keyup', accumulationChartKeyUp);
        window.addEventListener('resize', chartResize);
        return () => {
            // Cleanup event listeners
            chartContainer.removeEventListener('mousemove', handleMouseMove as EventListener);
            chartContainer.removeEventListener('click', handleMouseClick);
            chartContainer.removeEventListener('mouseleave', handleMouseLeave);
            chartContainer.removeEventListener('mousedown', handleMouseDown);
            chartContainer.removeEventListener('mouseenter', handleMouseEnter);
            chartContainer.removeEventListener('mouseup', handleMouseUp as EventListener);
            chartContainer.removeEventListener('touchstart', handleMouseDown as EventListener);
            chartContainer.removeEventListener('touchmove', handleMouseMove as EventListener);
            chartContainer.removeEventListener('touchend', handleMouseUp as EventListener);
            window.removeEventListener('keydown', documentKeyHandler);
            chartContainer.removeEventListener('keydown', accumulationChartKeyDown);
            chartContainer.removeEventListener('keyup', accumulationChartKeyUp);
            window.removeEventListener('resize', chartResize);
        };
    }, [parentElement]);

    const availableSize: PieChartSizeProps = parentElement?.availableSize;
    return (
        render &&
        <LayoutContext.Provider value={{
            layoutRef, phase, availableSize, triggerRemeasure, reportMeasured, disableAnimation
            , setDisableAnimation, isSeriesAnimated, setSeriesAnimated
        }}>
            <div
                id={`${parentElement?.element?.id}_Secondary_Element`}
            >
                {chartTooltip.template && chartTooltip.enable && (
                    <div id={`${parentElement?.element?.id}_tooltip`}>
                        <PieChartTooltipRenderer {...chartTooltip} />
                    </div>
                )}
            </div>
            <svg id={layoutRef.current.element?.id + '_svg'} width={availableSize.width} height={availableSize.height}>
                <ChartRenderer {...chartProps}></ChartRenderer>
                {chartTitle.text &&
                    <ChartTitleRenderer ref={titleRef} {...chartTitle}></ChartTitleRenderer>
                }
                {chartSubTitle.text &&
                    <ChartSubTitleRenderer ref={subtitleRef} {...chartSubTitle}></ChartSubTitleRenderer>
                }
                {chartLegend.visible &&
                    <ChartLegendRenderer {...chartLegend}></ChartLegendRenderer>
                }
                <ChartSeriesRenderer ref={seriesRef} {...chartSeries}></ChartSeriesRenderer>
                {chartLegend.visible &&
                    < CustomLegendRenderer ref={legendRef}  {...chartLegend}></CustomLegendRenderer >
                }
                {centerLabel.label?.length && centerLabel.label?.length > 0 &&
                    <CenterLabelRenderer {...centerLabel}></CenterLabelRenderer>
                }
                {!chartTooltip.template && chartTooltip.enable &&
                    <PieChartTooltipRenderer {...chartTooltip} />
                }
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
 * Defines the context type for layout-related operations in the charting system.
 *
 * @private
 */
export interface LayoutContextType {

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
    layoutRef: React.RefObject<Chart>

    /**
     * The available size for layout rendering, including width and height.
     */
    availableSize: { width: number, height: number };

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
     * Optional flag indicating whether the initial series animation has completed.
     * When true, the series has finished its first render animation.
     */
    isSeriesAnimated: boolean;

    /**
     * Optional setter to update the initial animation completion flag for the series.
     *
     * @param val - True if the series has finished its initial animation; otherwise, false.
     */
    setSeriesAnimated: (val: boolean) => void;
}
