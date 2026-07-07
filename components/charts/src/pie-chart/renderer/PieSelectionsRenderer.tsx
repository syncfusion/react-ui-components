
import { RefObject, useContext, useEffect, useLayoutEffect } from 'react';
import { PieChartDataIndexProps, PieChartSelectionProps } from '../base/interfaces';
import { useLayout } from '../layout/LayoutContext';
import { registerChartEventHandler } from '../hooks/events';
import { Chart, SeriesProperties, PieBaseSelection, BaseLegend, Points, LegendOptions } from '../base/internal-interfaces';
import { extend, isNullOrUndefined } from '@syncfusion/react-base';
import { PieSelectionPattern } from '../base/enum';
import * as React from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { animateOpacityRestore, calculateSelectedElements, ensureSelectionPattern, removeMultiSelectElements, updateSelectionProps } from './PieHighlightRenderer';

/**
 * PieSelectionRenderer mirrors the general SelectionRenderer for cartesian charts,
 * but supports only `Point` and `None` modes for pie charts.
 *
 * Responsibilities:
 *  - Initialize selection options in the measuring phase.
 *  - Register a click handler to select/deselect slices (and optionally via legend).
 *  - Apply selection patterns/fills to selected slices.
 *  - Dim non-selected slices/legend items via blurEffect.
 *
 * @param {PieChartSelectionProps} props - Selection configuration for the pie chart.
 * @returns {Element} A JSX fragment that conditionally renders highlight elements.
 * @private
 */
export const PieSelectionRenderer: React.FC<PieChartSelectionProps> = (props: PieChartSelectionProps) => {
    const { layoutRef, phase, reportMeasured, setLayoutValue, seriesRef, legendRef } = useLayout();
    const { chartLegend } = useContext(ChartContext);

    let chartSelection: PieBaseSelection = layoutRef.current?.chartSelection as PieBaseSelection;
    let chartInstance: Chart = layoutRef.current as Chart;

    /**
     * Measuring phase:
     *  - Seeds a runtime selection object into layoutRef (when mode !== 'None').
     *  - Reports measured.
     *  - Replays preselected indexes (if provided).
     */
    useLayoutEffect(() => {
        if (phase === 'measuring') {
            if (props.mode !== 'None' && layoutRef.current) {
                const selection: PieBaseSelection = getSelectionOptions(props, layoutRef.current as Chart, !!chartLegend?.toggleVisibility);
                setLayoutValue('chartSelection', selection);
            }

            reportMeasured('PieChartSelection');
            chartSelection = layoutRef.current?.chartSelection as PieBaseSelection;
            chartInstance = layoutRef.current as Chart;

            // Replay preselected indexes once slices exist
            if (
                chartInstance &&
                chartSelection &&
                chartSelection.selectedDataIndexes &&
                chartSelection.selectedDataIndexes.length > 0
            ) {
                setTimeout(() => {
                    const totalPoints: number = chartInstance.visibleSeries[0].points.length;
                    // Keep only valid indexes
                    const valid: PieChartDataIndexProps[] =
                        (chartSelection.selectedDataIndexes as PieChartDataIndexProps[]).filter((d: PieChartDataIndexProps) =>
                            d.pointIndex != null && d.pointIndex >= 0 && d.pointIndex < totalPoints
                        );
                    chartSelection.chartSelectedDataIndexes = valid.slice();
                    chartSelection.isSelected = valid.length > 0;

                    for (let i: number = 0; i < valid.length; i++) {
                        performSelection(chartInstance, chartSelection, legendRef, seriesRef, valid[i as number], undefined, false);
                    }
                }, 100);
            }
        }
    }, [phase]);

    /**
     * Props update:
     *  - Sync mode, allowMultiSelection, selectedDataIndexes into the runtime object.
     *  - Clear previous DOM states when selection props change.
     */
    useEffect(() => {
        updateSelectionProps(layoutRef, props, legendRef, seriesRef, phase);
    }, [props.mode, props.allowMultiSelection, props.selectedDataIndexes, phase]);

    /**
     * Pattern update:
     *  - Applies the new pattern to previously selected elements.
     */
    useEffect(() => {
        if (phase !== 'measuring' && layoutRef.current?.chartSelection) {
            (layoutRef.current?.chartSelection as PieBaseSelection).pattern = props.pattern as PieSelectionPattern;
            chartSelection = layoutRef.current?.chartSelection as PieBaseSelection;
            chartInstance = layoutRef.current as Chart;
            const series: SeriesProperties = chartInstance.visibleSeries?.[0];
            if (chartSelection.name === 'Highlight' && series?.applyPattern) { return; }

            const previouslySelectedElement: Element[] = chartSelection.previousSelectedElements as Element[];
            if (chartSelection.pattern !== 'None' && (chartSelection.previousSelectedElements?.length || 0) > 0) {
                const preferredColor: string | undefined =
                    chartSelection.name === 'Highlight' && chartSelection.fill
                        ? chartSelection.fill
                        : undefined;

                const getPointIndexFromElementId: (id: string) => number = (id: string): number => {
                    if (id.includes('_legend_')) {
                        const n: number = Number.parseInt(id.split('_').pop() as string, 10);
                        return Number.isFinite(n) ? n : 0;
                    }
                    const mactchingRegex: RegExpMatchArray | null = id.match(/_Series_\d+_Point_(\d+)$/);
                    return mactchingRegex ? Number.parseInt(mactchingRegex[1], 10) : 0;
                };
                const palette: string[] = Array.from(new Set(series.points.map((point: Points) => point.color as string)));

                previouslySelectedElement.forEach((element: Element) => {
                    if ((element as HTMLElement).id.includes('_legend_text')) { return; }

                    const isSelectedAttr: string = chartSelection.name === 'Selection' ? 'data-selected' : 'data-highlighted';
                    if ((element as HTMLElement).getAttribute(isSelectedAttr) === 'true') {
                        const elId: string = (element as HTMLElement).id;
                        const pointIdx: number = getPointIndexFromElementId(elId);

                        let patternId: string;
                        if (chartSelection.name === 'Highlight') {
                            const baseColor: string = (preferredColor ?? series.points[pointIdx as number]?.color) as string;
                            const colorHash: string = (baseColor).replace(/[^a-zA-Z0-9]/g, '');
                            patternId = `${chartInstance.element.id}_${chartSelection.pattern}_Highlight_${colorHash}_${pointIdx}`;
                        } else {
                            const baseColor: string = series.points[pointIdx as number]?.color as string;
                            const colorHash: string = (baseColor).replace(/[^a-zA-Z0-9]/g, '');
                            const colorIndex: number = Math.max(0, palette.indexOf(baseColor));
                            patternId = `${chartInstance.element.id}_${chartSelection.pattern}_Selection_${colorHash}_${colorIndex}`;
                        }
                        (element as HTMLElement).style.fill = `url(#${patternId})`;
                    } else {
                        (element as HTMLElement).style.fill = '';
                    }
                });
            } else if (chartSelection.pattern === 'None' && (previouslySelectedElement.length || 0) > 0) {
                previouslySelectedElement.forEach((element: Element) => {
                    const selectedElement: HTMLElement = element as HTMLElement;
                    if (!selectedElement.id.includes('_legend_text')) {
                        selectedElement.style.fill = '';
                    }
                });
            }
        }
    }, [props.pattern, phase]);

    /**
     * Registers an event handler for chart click events, which drives the
     * slice/legend selection behavior when mode !== 'None'.
     */
    useEffect(() => {
        const chartId: string = (layoutRef.current as Chart)?.element?.id as string;

        const handleSelection: (event: Event) => void = (event: Event): void => {
            const selection: PieBaseSelection = layoutRef.current?.chartSelection as PieBaseSelection;
            const currentChart: Chart = layoutRef.current as Chart;
            const target: HTMLElement = event.target as HTMLElement;

            if (!selection || !currentChart) { return; }

            const clickedLegend: boolean = isLegendTarget(target, currentChart);

            if (clickedLegend && selection.isLegendToggle) {
                setTimeout(() => {
                    const chart: Chart = layoutRef.current as Chart;
                    const selectionState: PieBaseSelection = layoutRef.current?.chartSelection as PieBaseSelection;
                    const highlightState: PieBaseSelection = layoutRef.current?.chartHighlight as PieBaseSelection;

                    const clean: (state?: PieBaseSelection) => void = (state?: PieBaseSelection) => {
                        if (!state) { return; }

                        // Drop elements that are now hidden/removed
                        if (state.previousSelectedElements?.length) {
                            state.previousSelectedElements = state.previousSelectedElements.filter((element: Element) => {
                                const elementInDOM: HTMLElement = element as HTMLElement;
                                const detached: boolean = !elementInDOM.ownerDocument || !elementInDOM.ownerDocument.contains(elementInDOM);
                                const hidden: boolean = elementInDOM.style.visibility === 'hidden' || elementInDOM.getAttribute('visibility') === 'hidden';
                                if (detached || hidden) {
                                    element.removeAttribute('data-selected');
                                    element.removeAttribute('data-highlighted');
                                    elementInDOM.style.opacity = '';
                                    elementInDOM.style.fill = '';
                                    return false;
                                }
                                return true;
                            });
                        }

                        const allIndexes: PieChartDataIndexProps[] = [...(state.chartSelectedDataIndexes as PieChartDataIndexProps[])];
                        const keepVisibleIndexes: PieChartDataIndexProps[] = allIndexes.filter(
                            (indexEntry: PieChartDataIndexProps) => {
                                const sliceId: string = `${chart.element.id}_Series_0_Point_${indexEntry.pointIndex}`;
                                const node: HTMLElement = seriesRef.current?.querySelector<HTMLElement>(`#${sliceId}`) as HTMLElement;
                                const isHidden: boolean = !node || node.style.visibility === 'hidden' || node.getAttribute('visibility') === 'hidden';
                                return !isHidden;
                            }
                        );

                        const removedIndexes: PieChartDataIndexProps[] = allIndexes.filter(
                            (indexEntry: PieChartDataIndexProps) =>
                                !keepVisibleIndexes.some(
                                    (visibleIndex: PieChartDataIndexProps) => visibleIndex.pointIndex === indexEntry.pointIndex)
                        );

                        const legendTranslateGroup: Element | undefined = (legendRef?.current as SVGGElement)?.children?.[0];
                        if (legendTranslateGroup && removedIndexes.length > 0) {
                            const removedPointIndices: Set<number | undefined> = new Set(removedIndexes.map(
                                (idx: PieChartDataIndexProps) => idx.pointIndex));

                            const itemNodes: Element[] = Array.from(legendTranslateGroup.children);
                            itemNodes.forEach((node: Element, legendIndex: number) => {
                                if (!removedPointIndices.has(legendIndex)) { return; }

                                const legendShape: HTMLElement | null = node.children.item(0) as HTMLElement | null;
                                if (legendShape) {
                                    legendShape.removeAttribute('data-selected');
                                    legendShape.removeAttribute('data-highlighted');
                                    legendShape.style.fill = '';
                                    legendShape.style.stroke = '';
                                    legendShape.style.opacity = ''; // ensure no lingering dim/full state

                                    // Remove from tracking if it was there
                                    state.previousSelectedElements = state.previousSelectedElements?.filter(
                                        (element: Element) => element !== legendShape
                                    ) || [];
                                }

                                // Clear marker if present (same logic as blurEffect)
                                const legendMarker: HTMLElement | undefined = Array.from(node.children).find(
                                    (markerElement: Element) => markerElement.id?.includes('legend_shape_marker')
                                ) as HTMLElement | undefined;

                                if (legendMarker) {
                                    legendMarker.removeAttribute('data-selected');
                                    legendMarker.removeAttribute('data-highlighted');
                                    legendMarker.style.fill = '';
                                    legendMarker.style.stroke = '';
                                    legendMarker.style.opacity = '';

                                    state.previousSelectedElements = state.previousSelectedElements?.filter(
                                        (element: Element) => element !== legendMarker
                                    ) || [];
                                }
                            });
                        }
                        state.chartSelectedDataIndexes = keepVisibleIndexes;
                        state.isSelected = (state.chartSelectedDataIndexes?.length as number) > 0;
                    };

                    // Clean selection & highlight states (if present)
                    clean(selectionState);
                    clean(highlightState);
                    if (selectionState) {
                        blurEffect(chart, chart.visibleSeries, selectionState, legendRef, seriesRef);
                    }
                    if (highlightState?.isLegendHighlight) {
                        blurEffect(chart, chart.visibleSeries, highlightState, legendRef, seriesRef);
                    }
                }, 5);
                return;
            }
            if (selection.mode !== 'None') {
                calculateSelectedElements(currentChart, selection, legendRef, seriesRef, event.target as Element, true);
                requestAnimationFrame(() => {
                    const chart: Chart = layoutRef.current as Chart;
                    const currentSelection: PieBaseSelection = layoutRef.current?.chartSelection as PieBaseSelection;
                    if (!chart || !currentSelection || currentSelection.mode === 'None') { return; }
                    blurEffect(chart, chart.visibleSeries, currentSelection, legendRef, seriesRef);
                });
            }
        };

        const unregister: () => void = registerChartEventHandler('click', handleSelection, chartId);
        return unregister;
    }, [props.mode, props]);

    // Assign runtime references for render phase usage
    chartSelection = layoutRef.current?.chartSelection as PieBaseSelection;
    chartInstance = layoutRef.current as Chart;

    /**
     * Renders <pattern> defs used by selection fills, per visible series.
     * For pie charts, pattern is keyed per series index to keep ids stable.
     */
    return (
        <>
            {props.pattern !== 'None' &&
            props.mode !== 'None' &&
            chartInstance &&
            chartSelection &&
            chartInstance.visibleSeries[0] && (() => {
                // Extract unique colors from all points
                const uniqueColors: Set<string> = new Set<string>();
                chartInstance.visibleSeries[0].points.forEach((point: Points) => {
                    if (point.color) { uniqueColors.add(point.color as string); }
                });

                // Generate one pattern per unique color
                return Array.from(uniqueColors).map((color: string, index: number) => (
                    <React.Fragment key={`pie-selection-pattern-${color}-${index}`}>
                        {ensureSelectionPattern(
                            chartInstance.element.id,
                            props.pattern as PieSelectionPattern,
                            color,
                            index, // Use a fixed index (0) or a unique identifier per pattern, not point index for global pattern.
                            chartInstance.visibleSeries[0].opacity as number,
                            'Selection'
                        )}
                    </React.Fragment>
                ));
            })()}
        </>
    );
};

/**
 * Builds a runtime `PieBaseSelection` object from component props.
 *
 * @param {PieChartSelectionProps} chartSelection - Selection props passed by the ChartProvider.
 * @param {Chart} chart - The chart instance reference.
 * @param {boolean} toggleVisibility - Whether legend toggling is enabled.
 * @returns {PieBaseSelection} A mutable runtime selection object with additional fields (indexes, tracking arrays).
 */
function getSelectionOptions(chartSelection: PieChartSelectionProps, chart: Chart, toggleVisibility: boolean): PieBaseSelection {
    const selection: PieBaseSelection = extend({}, chartSelection) as PieBaseSelection;
    selection.chart = chart;
    selection.isLegendSelection = false;
    selection.chartSelectedDataIndexes = chartSelection.selectedDataIndexes ? chartSelection.selectedDataIndexes : [];
    selection.isSelected = (selection.chartSelectedDataIndexes as PieChartDataIndexProps[]).length > 0;
    selection.isLegendToggle = toggleVisibility;
    selection.previousSelectedElements = [];
    selection.isAdd = false;
    selection.name = 'Selection';
    selection.isLegendHighlight = false;
    selection.isTooltipHighlight = false;
    return selection;
}

/**
 * Checks whether the given target element belongs to the chart legend.
 *
 * @param {HTMLElement} target - The element under the pointer/click.
 * @param {Chart} chart - The chart instance.
 * @returns {boolean} True if the target is a legend shape/text/marker; otherwise false.
 * @private
 */
export function isLegendTarget(target: HTMLElement, chart: Chart): boolean {
    const legend: BaseLegend = chart.chartLegend;
    const id: string = target.id;
    const prefix: string = legend?.legendID as string;
    return (
        id.indexOf(`${prefix}_shape_`) > -1 ||
        id.indexOf(`${prefix}_shape_marker_`) > -1 ||
        id.indexOf(`${prefix}_text_`) > -1 ||
        id.indexOf(`${prefix}_g_`) > -1 ||
        id.indexOf('_chart_legend') > -1
    );
}

/**
 * Performs selection for a given (seriesIndex, pointIndex), collecting:
 *  - the slice element for that index
 *  - the event target (if applicable)
 *  - and the legend shape for that point (when present)
 *
 * @param {Chart}chart - chart The chart instance.
 * @param {PieBaseSelection} chartSelection - The runtime selection object.
 * @param {RefObject<SVGGElement | null>} legendRef - Ref to the legend container.
 * @param {RefObject<SVGGElement | null>} seriesRef - Ref to the series container.
 * @param {PieChartDataIndexProps} index - Target index ({seriesIndex, pointIndex}).
 * @param {HTMLElement} element - Optional raw event target (useful when the clicked element differs from the slice node).
 * @returns {void}
 * @private
 */
export const performSelection: (chart: Chart, chartSelection: PieBaseSelection,
    legendRef: RefObject<SVGGElement | null>,
    seriesRef: RefObject<SVGGElement | null>,
    index: PieChartDataIndexProps, element?: HTMLElement, _pointClick?: boolean) => void = (
    chart: Chart,
    chartSelection: PieBaseSelection,
    legendRef: RefObject<SVGGElement | null>,
    seriesRef: RefObject<SVGGElement | null>,
    index: PieChartDataIndexProps,
    element?: HTMLElement
): void => {
    if (chartSelection.isLegendSelection && !isNullOrUndefined(index?.pointIndex)) {
        const slice: HTMLElement = getPieSliceElement(seriesRef, chart.element.id, index.pointIndex as number) as HTMLElement;
        const hiddenOrMissing: boolean = !slice || slice.style.visibility === 'hidden' || slice.getAttribute('visibility') === 'hidden';
        if (hiddenOrMissing) { return; }
    }
    if (chartSelection.mode === 'None') { return; }

    // Clear any active HOVER-HIGHLIGHT before applying selection (prevents it from undoing dimming)
    const chartHighlight: PieBaseSelection | undefined = (chart as Chart).chartHighlight as PieBaseSelection | undefined;
    if (chartHighlight && chartHighlight.previousSelectedElements?.length) {
        const pointElements: Element[] = chartHighlight.previousSelectedElements as Element[];
        pointElements.forEach((selectedElement: Element) => {
            selectedElement.removeAttribute('data-highlighted');
            // Always clear highlight-applied styling (both slice and legend)
            const node: HTMLElement = selectedElement as HTMLElement;
            node.style.fill = '';
            node.style.stroke = '';
        });
        chartHighlight.previousSelectedElements = [];
    }

    const chartId: string = chart.element.id;
    const pointIndex: number = index.pointIndex as number;
    const selectedElements: Element[] = [];
    const unique: Set<string> = new Set<string>();
    const pushIfUnique: (element?: Element | null) => void = (element?: Element | null) => {
        if (element && element.id && !unique.has(element.id)) {
            selectedElements.push(element);
            unique.add(element.id);
        }
    };

    // Slice element
    const sliceElement: Element = getPieSliceElement(seriesRef, chartId, pointIndex) as Element;
    pushIfUnique(sliceElement);

    // Collect all nodes belonging to this slice
    const seriesGroup: SVGGElement | null = seriesRef?.current as SVGGElement | null;
    if (seriesGroup) {
        const suffix: string = `_Series_0_Point_${pointIndex}`;
        const allMatches: Element[] = Array.from(
            seriesGroup.querySelectorAll<Element>(`#${chartId}${suffix}, [id$="${suffix}"]`)
        );
        allMatches.forEach(pushIfUnique);
    }

    // Raw target, if provided
    if (element && element.id) { pushIfUnique(element); }

    // Legend shape for this point
    const legendTranslateGroup: Element | undefined = (legendRef?.current as SVGGElement)?.children?.[0];
    if (legendTranslateGroup && !isNaN(pointIndex)) {
        const legendItemGroup: Element | null = legendTranslateGroup.children.item(pointIndex);
        const legendShape: Element = legendItemGroup?.children.item(0) as Element;
        pushIfUnique(legendShape);
    }
    // Apply styles and blur
    selection(chartSelection, chart, selectedElements, index, legendRef);
    blurEffect(chart, chart.visibleSeries, chartSelection, legendRef, seriesRef);
};

/**
 * Applies selection/highlight DOM attributes and styles for a given set of elements,
 * and updates the runtime index list according to the selection mode.
 *
 * @param {PieBaseSelection} chartSelection - The runtime selection object (mutable).
 * @param {Chart} chart - The chart instance.
 * @param {Element[]} selectedElements - The target DOM elements to toggle (slice, legend).
 * @param {PieChartDataIndexProps} index - Target {seriesIndex, pointIndex}.
 * @param {RefObject<SVGGElement | null>} legendRef - Ref to legend container (used by multi-select cleanup).
 * @returns {void}
 */
function selection(
    chartSelection: PieBaseSelection,
    chart: Chart,
    selectedElements?: Element[],
    index?: PieChartDataIndexProps,
    legendRef?: RefObject<SVGGElement | null>
): void {
    if (!selectedElements || !selectedElements[0] || !index) { return; }

    // Single-select: clear others before applying a new selection
    if (chartSelection.name === 'Selection' &&
        !chartSelection.allowMultiSelection &&
        chartSelection.mode !== 'None') {
        removeMultiSelectElements(chart, (chartSelection?.chartSelectedDataIndexes as PieChartDataIndexProps[]), index,
                                  chartSelection, legendRef as RefObject<SVGGElement | null>);
    }

    // Check if this exact index already exists in our tracking
    const exists: boolean = (chartSelection.chartSelectedDataIndexes as PieChartDataIndexProps[]).some(
        (i: PieChartDataIndexProps) => i.pointIndex === index.pointIndex
    );

    // Check if ANY of the target elements are currently marked as selected
    const attributesName: 'data-selected' | 'data-highlighted' =
        chartSelection.name === 'Selection' ? 'data-selected' : 'data-highlighted';

    const isVisuallySelected: boolean = selectedElements.some((element: Element) =>
        element.getAttribute(attributesName) === 'true'
    );

    // Apply or remove the visual styles
    applyStyles(selectedElements, chartSelection, chart);

    // Update the index tracking array to match the new visual state
    if (chartSelection.name === 'Selection') {
        if (chartSelection.allowMultiSelection) {
            // Multi-select: toggle the index in/out
            if (isVisuallySelected && exists) {
                // Was selected, now deselected - remove from array
                chartSelection.chartSelectedDataIndexes =
                    (chartSelection.chartSelectedDataIndexes as PieChartDataIndexProps[]).filter(
                        (i: PieChartDataIndexProps) => i.pointIndex !== index.pointIndex
                    );
            } else if (!isVisuallySelected && !exists) {
                // Was not selected, now selected - add to array
                chartSelection.chartSelectedDataIndexes = [
                    ...(chartSelection.chartSelectedDataIndexes as PieChartDataIndexProps[]),
                    index
                ];
            }
        } else {
            // Single-select mode
            if (isVisuallySelected && exists) {
                // Clicking already selected slice - deselect it
                chartSelection.chartSelectedDataIndexes = [];
            } else {
                // Selecting a new slice (or re-selecting after prop change)
                chartSelection.chartSelectedDataIndexes = [index];
            }
        }
    } else {
        const prevHighlightIndex: number | undefined = (chartSelection.chartSelectedDataIndexes?.length as number) > 0 ?
            (chartSelection.chartSelectedDataIndexes as PieChartDataIndexProps[])[0].pointIndex : undefined;
        if (prevHighlightIndex === index.pointIndex && isVisuallySelected) {
            chartSelection.chartSelectedDataIndexes = [];
        } else {
            chartSelection.chartSelectedDataIndexes = [index];
        }
    }

    // Reflect final selected state flag
    chartSelection.isSelected = ((chartSelection.chartSelectedDataIndexes?.length as number) > 0);
}

/**
 * Dims non-selected elements (slices, data labels, and legend items) and restores full opacity
 * when no selection/highlight is active.
 *
 * @param {Chart} chart - The chart instance (unused here; retained for signature parity).
 * @param {SeriesProperties[]} _visibleSeries - Visible series list (unused for pie single-series; retained for parity).
 * @param {PieBaseSelection} chartSelection - The runtime selection/highlight object.
 * @param {RefObject<SVGGElement | null>} legendRef - Ref to legend container.
 * @param {RefObject<SVGGElement | null>} seriesRef - Ref to series container.
 * @returns {void}
 * @private
 */
export const blurEffect: (chart: Chart, _visibleSeries: SeriesProperties[], chartSelection: PieBaseSelection,
    legendRef: RefObject<SVGGElement | null>, seriesRef: RefObject<SVGGElement | null>) => void = (
    chart: Chart,
    _visibleSeries: SeriesProperties[],
    chartSelection: PieBaseSelection,
    legendRef: RefObject<SVGGElement | null>,
    seriesRef: RefObject<SVGGElement | null>
): void => {
    const attributes: 'data-selected' | 'data-highlighted' =
        chartSelection.name === 'Selection' ? 'data-selected' : 'data-highlighted';

    if (chartSelection.previousSelectedElements && chartSelection.previousSelectedElements.length > 0) {
        chartSelection.previousSelectedElements = chartSelection.previousSelectedElements.filter((element: Element) => {
            const elementInHTML: HTMLElement = element as HTMLElement;
            const notInDOM: boolean = !elementInHTML || !elementInHTML.ownerDocument ||
                !elementInHTML.ownerDocument.contains(elementInHTML);
            const hidden: boolean = elementInHTML.style.visibility === 'hidden' || elementInHTML.getAttribute('visibility') === 'hidden';
            if (notInDOM || hidden) {
                element.removeAttribute('data-selected');
                element.removeAttribute('data-highlighted');
                elementInHTML.style.opacity = '';
                elementInHTML.style.fill = '';
                return false;
            }
            return true;
        });
    }

    const seriesGroup: SVGGElement | null = seriesRef?.current as SVGGElement;
    if (!seriesGroup) { return; }

    const series: SeriesProperties = chart?.visibleSeries?.[0];
    const isSelectionContext: boolean = chartSelection.name === 'Selection';

    // Prepare selected point index set
    const selectedPointSet: Set<number> = new Set<number>(
        (chartSelection.chartSelectedDataIndexes as PieChartDataIndexProps[])
            .map((index: PieChartDataIndexProps) => Number(index.pointIndex))
            .filter((number: number) => Number.isFinite(number))
    );

    // Visibility check for hasSelection
    const anyIndexVisible: boolean = (chartSelection.chartSelectedDataIndexes as PieChartDataIndexProps[]).some(
        (index: PieChartDataIndexProps) => {
            const element: HTMLElement = getPieSliceElement(seriesRef, chart.element.id, index.pointIndex as number) as HTMLElement;
            return !!element && element.isConnected &&
                element.style.visibility !== 'hidden' && element.getAttribute('visibility') !== 'hidden';
        }
    );

    const hasSelection: boolean = isSelectionContext
        ? (((chartSelection.chartSelectedDataIndexes?.length as number) > 0) && anyIndexVisible)
        : (((chartSelection.previousSelectedElements?.length as number) > 0) && anyIndexVisible);

    // 1) Slices: never dim exploded ones
    for (const node of Array.from(seriesGroup.children)) {
        if (!node || node.tagName.toLowerCase() === 'defs' || !node.id) { continue; }
        const element: HTMLElement = node as HTMLElement;

        if (element.id.endsWith('_hover_border')) { continue; }
        if (element.style.visibility === 'hidden' || element.getAttribute('visibility') === 'hidden') {
            element.style.opacity = '';
            continue;
        }

        // Resolve point index for this element to detect explosion
        let isExploded: boolean = false;
        if (series && element.id.includes('_Series_') && element.id.includes('_Point_')) {
            const matchingRegex: RegExpMatchArray | null = element.id.match(/_Series_\d+_Point_(\d+)$/);
            if (matchingRegex) {
                const pointIndex: number = parseInt(matchingRegex[1], 10);
                if (!isNaN(pointIndex) && series.points?.[pointIndex as number]) {
                    isExploded = !!series.points[pointIndex as number].isExplode;
                }
            }
        }

        const isSelected: boolean =
            element.getAttribute('data-selected') === 'true' ||
            element.getAttribute(attributes) === 'true';

        // Do NOT dim exploded slice
        const shouldDim: boolean = !isExploded && !isSelected && hasSelection;

        if (shouldDim) {
            // Cancel any ongoing restore animation before re-dimming
            const existingAnimationId: string | null = element.getAttribute('data-animation-id');
            if (existingAnimationId) {
                cancelAnimationFrame(parseInt(existingAnimationId, 10));
                element.removeAttribute('data-animation-id');
            }

            element.style.opacity = '0.3';
            if (!(chartSelection.name === 'Highlight' && series?.applyPattern)) {
                element.style.fill = '';
            }
        } else {
            // Restore slice opacity with animation (slices only)
            const existingAnimationId: string | null = element.getAttribute('data-animation-id');
            if (!existingAnimationId) {
                // Prefer inline opacity; fall back to computed opacity
                const inlineOpacity: string = element.style.opacity;
                const computedOpacity: string =
                    inlineOpacity !== ''
                        ? inlineOpacity
                        : (element.ownerDocument?.defaultView?.getComputedStyle(element)?.opacity ?? '1');

                const opacityValue: number = parseFloat(computedOpacity);

                if (!Number.isNaN(opacityValue) && opacityValue < 1) {
                    animateOpacityRestore(element, opacityValue, 1, 600);
                } else {
                    element.style.opacity = '';
                }
            }
        }

        if (!isSelected && (chartSelection.pattern !== 'None' ||
            (chartSelection.name === 'Highlight' && chartSelection.fill))) {
            if (!(chartSelection.name === 'Highlight' && series?.applyPattern)) {
                if (!shouldDim) {
                    element.style.fill = '';
                }
            }
        }
    }

    // Find the SVG root that contains the series and data labels
    let svgRoot: SVGSVGElement | null = null;
    if (seriesGroup?.ownerDocument) {
        // Get the closest SVG ancestor from seriesGroup
        let current: Element | null = seriesGroup;
        while (current) {
            if (current.tagName.toLowerCase() === 'svg') {
                svgRoot = current as SVGSVGElement;
                break;
            }
            current = current.parentElement;
        }
    }

    const allDataLabelElements: Element[] = svgRoot
        ? Array.from(svgRoot.querySelectorAll<Element>('[id*="_datalabel_Series_"][id*="_text_"]'))
        : [];

    for (const dataLabelElement of allDataLabelElements) {
        const element: HTMLElement = dataLabelElement as HTMLElement;

        // Extract point index from data label id
        // Format: <chartId>_datalabel_Series_<seriesIndex>_text_<pointIndex>
        const match: RegExpMatchArray = element.id.match(/_text_(\d+)$/) as RegExpMatchArray;

        const pointIndex: number = parseInt(match[1], 10);
        if (!Number.isFinite(pointIndex) || !match) { continue; }

        // Check if this data label's corresponding slice is selected
        const isDataLabelSelected: boolean = selectedPointSet.has(pointIndex);

        // Determine if the corresponding slice is exploded
        let isCorrespondingSliceExploded: boolean = false;
        if (series?.points?.[pointIndex as number]) {
            isCorrespondingSliceExploded = !!series.points[pointIndex as number].isExplode;
        }

        // Dim data label if its corresponding slice is not selected and has selection
        const shouldDimDataLabel: boolean = !isCorrespondingSliceExploded && !isDataLabelSelected && hasSelection;

        // Apply opacity directly without animation for data labels
        element.style.opacity = shouldDimDataLabel ? '0.3' : '';
    }

    // 2) Legend (snaps to full opacity; if you prefer animation here, you can restore it)
    const legendTranslateGroup: Element = (legendRef?.current as SVGGElement)?.children?.[0];
    const legendCollections: LegendOptions[] | undefined = (chart.chartLegend?.legendCollections as LegendOptions[] | undefined);
    if (legendTranslateGroup) {
        const itemNodes: Element[] = Array.from(legendTranslateGroup.children);
        for (let index: number = 0; index < itemNodes.length; index++) {
            const node: Element = itemNodes[index as number] as Element;
            const legendShape: HTMLElement = node?.children.item(0) as HTMLElement;
            if (!legendShape) { continue; }

            let pointExploded: boolean = false;
            if (series?.points?.[index as number]) { pointExploded = !!series.points[index as number].isExplode; }

            const attrSelectedLegend: boolean =
                legendShape.getAttribute('data-selected') === 'true' ||
                legendShape.getAttribute(attributes) === 'true';
            const belongsToSelectedPointLegend: boolean = selectedPointSet.has(index);
            const isSelectedLegend: boolean = attrSelectedLegend || belongsToSelectedPointLegend;

            const isPointVisible: boolean = series?.points?.[index as number]?.visible !== false;
            const isLegendItemVisible: boolean =
                legendCollections && legendCollections[index as number]
                    ? legendCollections[index as number].visible !== false
                    : true;

            const notActive: boolean = !(isPointVisible && isLegendItemVisible);
            const shouldDimLegend: boolean = !pointExploded && !isSelectedLegend && !notActive && hasSelection;


            legendShape.style.opacity = shouldDimLegend ? '0.3' : '';

            const legendMarker: HTMLElement | undefined =
                Array.from(node.children).find((m: Element) => m.id.includes('legend_shape_marker')) as HTMLElement | undefined;
            if (legendMarker) {
                const markerShouldDim: boolean = !pointExploded && !isSelectedLegend && !notActive && hasSelection;
                legendMarker.style.opacity = markerShouldDim ? '0.3' : '';
            }

            if (!pointExploded && !isSelectedLegend && (chartSelection.pattern !== 'None' ||
                (chartSelection.name === 'Highlight' && chartSelection.fill))) {
                if (!(chartSelection.name === 'Highlight' && series?.applyPattern)) {
                    legendShape.style.fill = '';
                    legendShape.style.stroke = '';
                    if (legendMarker) {
                        legendMarker.style.fill = '';
                        legendMarker.style.stroke = '';
                    }
                }
            }
        }
    }
    chartSelection.isAdd = false;
};

/**
 * Applies DOM attribute toggling (`data-selected` or `data-highlighted`) and styles
 * (pattern/fill) to a list of target elements, and manages the `previousSelectedElements`
 * tracking list.
 *
 * @param {Element[]} elements - Target DOM elements to toggle.
 * @param {PieBaseSelection} chartSelection - Runtime selection/highlight object.
 * @param {Chart} chart - Chart instance (used to build pattern ids).
 * @returns {void}
 */
function applyStyles(
    elements: Element[],
    chartSelection: PieBaseSelection,
    chart: Chart
): void {
    const getPointIndexFromElementId: (id: string) => number = (id: string): number => {
        if (id.includes('_legend_')) {
            const number: number = Number.parseInt(id.split('_').pop() as string, 10);
            return Number.isFinite(number) ? number : 0;
        }
        const m: RegExpMatchArray | null = id.match(/_Series_\d+_Point_(\d+)$/);
        return m ? Number.parseInt(m[1], 10) : 0;
    };
    const attributesName: 'data-selected' | 'data-highlighted' =
        chartSelection.name === 'Selection' ? 'data-selected' : 'data-highlighted';

    const series: SeriesProperties = chart.visibleSeries?.[0];
    for (const element of elements) {
        const elementId: string = (element as HTMLElement).id;
        if (elementId.includes('_legend_text')) { continue; }

        const isCurrentlySelected: boolean = element.getAttribute(attributesName) === 'true';

        if (!isCurrentlySelected) {
            element.setAttribute(attributesName, 'true');
            if (chartSelection.name === 'Selection' && element.hasAttribute('data-highlighted')) {
                element.removeAttribute('data-highlighted');
            }

            if (chartSelection.name === 'Highlight' && series?.applyPattern) {
                // keep Initial pattern; Highlight only toggles the attribute
            } else if (chartSelection.pattern !== 'None') {
                let patternId: string;

                if (chartSelection.name === 'Highlight') {
                    const pointIdx: number = getPointIndexFromElementId(elementId);
                    const preferredColor: string | undefined =
                        chartSelection.fill && chartSelection.fill.length > 0 ? chartSelection.fill : undefined;
                    const baseColor: string = preferredColor ?? (series?.points[pointIdx as number]?.color as string);
                    const colorHash: string = baseColor ? (baseColor).replace(/[^a-zA-Z0-9]/g, '') : '';
                    patternId = `${chart.element.id}_${chartSelection.pattern}_Highlight_${colorHash}_${pointIdx}`;
                } else {
                    // Selection: use the point's base color from the model to map into the Selection <defs>
                    const pointIdx: number = getPointIndexFromElementId(elementId);
                    const baseColor: string = series.points[pointIdx as number]?.color as string;
                    const colorHash: string = (baseColor).replace(/[^a-zA-Z0-9]/g, '');
                    const palette: string[] = Array.from(new Set(series.points.map((point: Points) => point.color as string)));
                    const colorIndex: number = Math.max(0, palette.indexOf(baseColor));
                    patternId = `${chart.element.id}_${chartSelection.pattern}_Selection_${colorHash}_${colorIndex}`;
                }

                (element as HTMLElement).style.fill = `url(#${patternId})`;
            } else if (chartSelection.name === 'Highlight' && chartSelection.fill) {
                (element as HTMLElement).style.fill = chartSelection.fill;
            }
            (chartSelection.previousSelectedElements as Element[]).push(element);
        } else {
            // DESELECTING: Remove attribute and restore to dimmed state
            element.removeAttribute(attributesName);

            if (chartSelection.name === 'Selection') {
                // Check if there are OTHER selected slices (not this one)
                const hasOtherSelection: boolean =
                    (chartSelection.chartSelectedDataIndexes as PieChartDataIndexProps[]).length > 0 ||
                    (chartSelection.previousSelectedElements as Element[]).some(
                        (currentElement: Element) => currentElement !== element && currentElement.getAttribute('data-selected') === 'true'
                    );

                if (hasOtherSelection) {
                    // Immediately dim this deselected slice
                    (element as HTMLElement).style.opacity = '0.3';
                } else {
                    // No other selection - clear opacity (all slices at full brightness)
                    (element as HTMLElement).style.opacity = '';
                }
            } else {
                // Highlight mode - clear opacity (blurEffect will handle restoration)
                (element as HTMLElement).style.opacity = '';
            }

            // Clear fill/pattern
            if (chartSelection.name === 'Highlight' && series?.applyPattern) {
                // keep Initial on unhighlight
            } else if (chartSelection.pattern !== 'None' ||
                (chartSelection.name === 'Highlight' && chartSelection.fill)) {
                (element as HTMLElement).style.fill = '';
            }

            // Remove from tracking array
            if (chartSelection.allowMultiSelection) {
                chartSelection.previousSelectedElements =
                    (chartSelection.previousSelectedElements as Element[]).filter((e: Element) => e.id !== elementId);
            } else {
                chartSelection.previousSelectedElements = [];
            }
        }
    }
    chartSelection.isSelected = ((chartSelection.chartSelectedDataIndexes?.length || 0) > 0);
}

/**
 * Helper to resolve a pie slice element from the series group by chart/series/point index.
 *
 * @remarks
 * The `seriesRef` for pie points directly references the series group element
 * (e.g., an SVG <g> with id `${chartId}_Series_0`).
 *
 * @param {RefObject<SVGGElement | null>} seriesRef - Ref to the SVG group containing pie slices.
 * @param {string} chartId - Chart element id (base prefix).
 * @param {number} pointIndex - Point index (slice index) within the series.
 * @returns {Element | null} The specific slice element, or null if not found.
 */
function getPieSliceElement(
    seriesRef: RefObject<SVGGElement | null>,
    chartId: string,
    pointIndex: number
): Element | null {
    const seriesGroup: SVGGElement = seriesRef?.current as SVGGElement;
    if (!seriesGroup) { return null; }

    const baseId: string = `${chartId}_Series_0_Point_${pointIndex}`;

    let node: Element | null = seriesGroup?.querySelector<Element>(`#${baseId}`);
    if (node) { return node; }

    node = seriesGroup.querySelector<Element>(`[id$="_Series_0_Point_${pointIndex}"]`);
    return node || null;
}
