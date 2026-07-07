import { forwardRef, JSX, RefObject, useContext, useEffect, useLayoutEffect } from 'react';
import { BaseSelection, ChartSelectionProps, ChartIndexesProps } from '../base/interfaces';
import { useLayout } from '../layout/LayoutContext';
import { registerChartEventHandler } from '../hooks/useClipRect';
import { Chart, ChartTrendlineModel, SeriesProperties } from '../chart-area/chart-interfaces';
import { AnimationOptions, Animation, extend, isNullOrUndefined, IAnimation } from '@syncfusion/react-base';
import { indexFinder, isRangeColorEnabled, withInBounds } from '../utils/helper';
import { SelectionMode, SelectionPattern } from '../base/enum';
import { ChartContext } from '../layout/ChartProvider';
import * as React from 'react';
import { applySeriesLabelBlurEffect } from './SeriesRenderer/SeriesLabelRenderer';

/**
 * The SelectionRenderer component is responsible for handling the selection interactions on the chart.
 * It manages the logic for selecting and deselecting data points or series based on user interactions like clicks.
 * It uses `useLayoutEffect` and `useEffect` hooks to manage the component's lifecycle and updates related to selection.
 *
 * @param {ChartSelectionProps} props - The properties for the SelectionRenderer component, including mode, allowMultiSelection, selectedDataIndexes, and pattern.
 * @param {React.ForwardedRef<SVGPatternElement>} ref - Forwarded ref to the rendered SVG pattern element.
 * @returns {JSX.Element} A JSX fragment that conditionally renders selection patterns.
 * @private
 */
export const SelectionRenderer: React.FC<ChartSelectionProps & React.RefAttributes<SVGPatternElement>> = forwardRef<SVGPatternElement,
ChartSelectionProps>((props: ChartSelectionProps, ref: React.ForwardedRef<SVGPatternElement>) => {
    const { layoutRef, phase, reportMeasured, setLayoutValue, seriesRef, legendRef, highlightRef, selectionRef } = useLayout();
    const { chartLegend } = useContext(ChartContext);
    let chartSelection: BaseSelection = layoutRef.current?.chartSelection as BaseSelection;
    let chart: Chart = layoutRef.current?.chart as Chart;

    useLayoutEffect(() => {
        if (phase === 'measuring') {
            if ((props.mode !== 'None') && layoutRef.current?.chart) {
                const chartSelection: BaseSelection =
                    getSelectionOptions(props, layoutRef.current?.chart as Chart, chartLegend.toggleVisibility as boolean);
                setLayoutValue('chartSelection', chartSelection);
            }
            reportMeasured('ChartSelection');

            chartSelection = layoutRef.current?.chartSelection as BaseSelection;
            chart = layoutRef.current?.chart as Chart;

            if (
                chart &&
                chartSelection &&
                chartSelection.selectedDataIndexes &&
                chartSelection.selectedDataIndexes.length > 0
            ) {
                setTimeout(() => {
                    for (let i: number = 0; i < chartSelection.selectedDataIndexes!.length; i++) {
                        let selectionElement: HTMLElement | undefined = undefined;
                        const index: ChartIndexesProps = chartSelection.selectedDataIndexes?.[i as number] as ChartIndexesProps;
                        if (chartSelection.mode === 'Point') {
                            const chartId: string = chart.element.id;
                            const allChildren: Element[] = Array.from(seriesRef?.current?.children || []);
                            const isScatterOrBubble: boolean = (chart.visibleSeries[index.seriesIndex as number]?.type?.indexOf('Scatter') as number > -1) || chart.visibleSeries[index.seriesIndex as number]?.type === 'Bubble';
                            const groupId: string = isScatterOrBubble ? `${chartId}_Series_${index.seriesIndex}_SymbolGroup` : `${chartId}SeriesGroup${index.seriesIndex}`;
                            const seriesGroup: SVGGElement | undefined =
                            allChildren.find((c: Element) => c.id === groupId) as SVGGElement | undefined;
                            const seriesChildren: Element[] = seriesGroup ? Array.from(seriesGroup.children) : [];
                            const baseId: string = `${chartId}_Series_${index.seriesIndex}_Point_${index.pointIndex}`;
                            selectionElement = seriesChildren.find((e: Element) => e.id === baseId) as HTMLElement;
                        }
                        performSelection(
                            chart,
                            chartSelection,
                            legendRef,
                            seriesRef,
                            chartSelection.selectedDataIndexes![i as number] as ChartIndexesProps,
                            selectionElement,
                            false,
                            highlightRef,
                            selectionRef
                        );
                    }
                }, 100);
            }
        }
    }, [phase]);

    useEffect(() => {
        if ( phase !== 'measuring' && layoutRef.current?.chartSelection) {
            (layoutRef.current?.chartSelection as BaseSelection).mode = props.mode;
            (layoutRef.current?.chartSelection as BaseSelection).allowMultiSelection = props.allowMultiSelection;
            (layoutRef.current?.chartSelection as BaseSelection).selectedDataIndexes =
                props.selectedDataIndexes && props.selectedDataIndexes.length > 0 ? [...props.selectedDataIndexes] : [];
            chartSelection = layoutRef.current?.chartSelection as BaseSelection;
            if (chartSelection.previousSelectedElements && chartSelection.previousSelectedElements?.length as number > 0) {
                const pointElements: Element[] = chartSelection.previousSelectedElements as Element[];
                pointElements.forEach((selectedElement: Element) => {
                    selectedElement.removeAttribute('data-selected');
                });
                chartSelection.isAdd = true;
                chartSelection.chartSelectedDataIndexes = [];
                blurEffect(chart, chart.visibleSeries, chartSelection, legendRef, seriesRef);
                chartSelection.previousSelectedElements = [];
                chartSelection.isSelected = false;
            }
        }

    }, [props.mode, props.allowMultiSelection, props.selectedDataIndexes]);

    useEffect(() => {
        if ( phase !== 'measuring' && layoutRef.current?.chartSelection) {
            (layoutRef.current?.chartSelection as BaseSelection).pattern = props.pattern as SelectionPattern;
            chartSelection = layoutRef.current?.chartSelection as BaseSelection;
            if (chartSelection.previousSelectedElements?.length as number > 0) {
                const pointElements: Element[] = chartSelection.previousSelectedElements as Element[];
                pointElements.forEach((selectedElement: Element) => {
                    if (chartSelection.pattern !== 'None' && selectedElement.getAttribute('data-selected') === 'true') {
                        const patternId: string = `${chart.element.id}_${chartSelection.pattern}_${chartSelection.name}_${indexFinder(selectedElement.id).seriesIndex}`;
                        (selectedElement as HTMLElement).style.fill = `url(#${patternId})`;
                    }
                    else {
                        (selectedElement as HTMLElement).style.fill = '';
                    }
                });
            }
        }
    }, [props.pattern]);

    useEffect(() => {
        const handleSelection: (e: Event) => void = (e: Event): void => {
            chartSelection = layoutRef.current?.chartSelection as BaseSelection;
            chart = layoutRef.current?.chart as Chart;
            if (chartSelection && chart && chartSelection.mode !== 'None') {
                calculateSelectedElements(chart, chartSelection, legendRef
                    , seriesRef, e.target!, true, undefined, highlightRef, selectionRef);
            }
        };


        const unregister: () => void = registerChartEventHandler(
            'click',
            handleSelection,
            (layoutRef.current?.chart as Chart)?.element.id
        );


        return unregister;
    }, [props.mode, props]);


    return (
        <>
            {props.pattern !== 'None' &&
                props.mode !== 'None' &&
                chart &&
                chartSelection &&
                chart.visibleSeries.map((_: SeriesProperties, i: number) => {

                    return (
                        <React.Fragment key={`selectionPattern_${i}`}>{
                            ensureSelectionPattern(
                                chart.element.id,
                                props.pattern as SelectionPattern,
                                chart.visibleSeries[i as number].interior,
                                i,
                                chart.visibleSeries[i as number].opacity as number,
                                'Selection',
                                ref)}
                        </React.Fragment>
                    );
                })}
        </>
    );
});

/**
 * Retrieves and initializes the selection options for the chart.
 * This function extends the provided props and sets default values or properties specific to chart selection.
 *
 * @param {ChartSelectionProps} chartSelection - The selection properties passed to the renderer.
 * @param {Chart} chart - The chart instance.
 * @param {boolean} toggleVisibility - A boolean indicating if toggle visibility is enabled for legend selection.
 * @returns {BaseSelection} A BaseSelection object configured for chart selection.
 * @private
 */
function getSelectionOptions(chartSelection: ChartSelectionProps, chart: Chart, toggleVisibility: boolean): BaseSelection {
    const selection: BaseSelection = extend({}, chartSelection) as BaseSelection;
    selection.chart = chart;
    selection.isLegendSelection = false;
    selection.chartSelectedDataIndexes = chartSelection.selectedDataIndexes ? [...chartSelection.selectedDataIndexes] : [];
    selection.isSelected = selection.chartSelectedDataIndexes.length > 0;
    selection.isLegendToggle = toggleVisibility;
    selection.previousSelectedElements = [];
    selection.isAdd = false;
    selection.name = 'Selection';
    selection.isLegendHighlight = false;
    selection.isTooltipHighlight = false;

    return selection;
}

/**
 * Calculates and applies the selected elements on the chart based on user interaction.
 * This function determines which elements (points or series) should be selected or deselected and updates their visual state.
 *
 * @param {Chart} chart - The chart instance.
 * @param {BaseSelection} chartSelection - The selection configuration object.
 * @param {RefObject<SVGGElement | null>} legendRef - A reference to the chart's legend element.
 * @param {RefObject<SVGGElement | null>} seriesRef - A reference to the chart's series element.
 * @param {EventTarget} targetElement - The DOM element that triggered the selection event.
 * @param {boolean} [pointClick] - An optional boolean indicating if the event was triggered by a point click.
 * @param {boolean} [isSelected] - An optional boolean indicating if any data points are already selected.
 * @param {RefObject<SVGPatternElement | null>} [highlightRef] - Reference to the SVG pattern used for highlighting.
 * @param {RefObject<SVGPatternElement | null>} [selectionRef] - Reference to the SVG pattern used for selection.
 * @returns {void}
 * @private
 */
export const calculateSelectedElements: (chart: Chart, chartSelection: BaseSelection, legendRef: RefObject<SVGGElement | null>,
    seriesRef: RefObject<SVGGElement | null>, targetElement: EventTarget, pointClick?: boolean
    , isSelected?: boolean, highlightRef?: RefObject<SVGPatternElement | null>
    , selectionRef?: RefObject<SVGPatternElement | null>) => void = (
    chart: Chart,
    chartSelection: BaseSelection,
    legendRef: RefObject<SVGGElement | null>,
    seriesRef: RefObject<SVGGElement | null>,
    targetElement: EventTarget,
    pointClick?: boolean,
    isSelected?: boolean, highlightRef?: RefObject<SVGPatternElement | null>, selectionRef?: RefObject<SVGPatternElement | null>
) => {
    if (isNullOrUndefined(targetElement)) {
        return;
    }
    const target: HTMLElement = targetElement as HTMLElement;
    const cylinderGroup: HTMLElement = target.closest('.e-cylinder-point-group') as HTMLElement;
    if (cylinderGroup) {
        targetElement = cylinderGroup;
    }
    chartSelection.isLegendSelection = (targetElement as HTMLElement).id.indexOf('_legend_shape') > -1
            || (targetElement as HTMLElement).id.indexOf('_legend_text') > -1 || (targetElement as HTMLElement).id.indexOf('_legend_g_') > -1;

    // FIX: When tooltip highlight is enabled, prioritize using the tooltip's identified series
    // instead of DOM element order to ensure highlight matches the tooltip's nearest point detection.
    // This ensures that overlapping area series highlight the correct series based on actual mouse position,
    // not DOM rendering order.
    if (chartSelection.isTooltipHighlight && !isNullOrUndefined(chart.toolTipSeriesIndex) &&
        targetElement && withInBounds(chart.mouseX, chart.mouseY, chart.clipRect)) {
        const tooltipSeries: SeriesProperties = chart.visibleSeries[chart.toolTipSeriesIndex as number];
        const pointIndex: number | undefined = !isNullOrUndefined(chart.toolTipPointIndex) && chart.toolTipPointIndex >= 0
            ? chart.toolTipPointIndex
            : undefined;
        const indexInfo: ChartIndexesProps = tooltipSeries.category === 'TrendLine' ? {
            seriesIndex: tooltipSeries.sourceIndex
            , pointIndex: pointIndex, trendlineIndex: tooltipSeries.trendIndex
        } : { seriesIndex: chart.toolTipSeriesIndex, pointIndex: pointIndex };
        performSelection(chart, chartSelection, legendRef, seriesRef, indexInfo,
                         targetElement as HTMLElement, pointClick, highlightRef, selectionRef);
    }
    else if (((targetElement as HTMLElement).id && (targetElement as HTMLElement).id.indexOf('_Series_') > -1 && (targetElement as HTMLElement).id.indexOf('_Text_') === -1 &&
            (chartSelection.mode !== 'None' || chartSelection.isTooltipHighlight)) || (chartSelection.isLegendSelection && (chartSelection.isLegendHighlight || !chartSelection.isLegendToggle))) {
        let indexInfo: ChartIndexesProps = indexFinder((targetElement as HTMLElement).id);
        indexInfo.seriesIndex = isRangeColorEnabled(chart) ? 0 : indexInfo.seriesIndex;
        if ((chartSelection.isLegendSelection || (targetElement as HTMLElement).id.includes('Trackball')) && chart.visibleSeries[indexInfo.seriesIndex as number].category === 'TrendLine') {
            indexInfo = {
                seriesIndex: chart.visibleSeries[indexInfo.seriesIndex as number].sourceIndex, pointIndex: undefined
                , trendlineIndex: chart.visibleSeries[indexInfo.seriesIndex as number].trendIndex
            };
        }
        performSelection(chart, chartSelection, legendRef, seriesRef, indexInfo,
                         targetElement as HTMLElement, pointClick, highlightRef, selectionRef);
    }
    else if (chartSelection.previousSelectedElements && chartSelection.previousSelectedElements.length > 0) {
        const pointElements: Element[] = chartSelection.previousSelectedElements as Element[];
        const attributes: 'data-selected' | 'data-highlighted' = chartSelection.name === 'Selection' ? 'data-selected' : 'data-highlighted';
        pointElements.forEach((selectedElement: Element) => {
            selectedElement.removeAttribute(attributes);
        });
        chartSelection.isAdd = !isNullOrUndefined(isSelected) ? !isSelected : true;
        chartSelection.chartSelectedDataIndexes = [];
        blurEffect(chart, chart.visibleSeries, chartSelection, legendRef, seriesRef);
        chartSelection.previousSelectedElements = [];
        chartSelection.isSelected = false;
    }
};

/**
 * Performs the actual selection action on the chart elements.
 * This function updates the chart's visual state (e.g., applying styles, patterns) based on the selected elements and selection mode.
 *
 * @param {Chart} chart - The chart instance.
 * @param {BaseSelection} chartSelection - The selection configuration object.
 * @param {RefObject<SVGGElement | null>} legendRef - A reference to the chart's legend element.
 * @param {RefObject<SVGGElement | null>} seriesRef - A reference to the chart's series element.
 * @param {ChartIndexesProps} index - The index information of the selected element(s).
 * @param {HTMLElement} [element] - The specific HTML element that was selected (if applicable).
 * @param {boolean} [pointClick] - An optional boolean indicating if the event was triggered by a point click.
 * @param {RefObject<SVGPatternElement | null>} [highlightRef] - Reference to the SVG pattern used for highlighting.
 * @param {RefObject<SVGPatternElement | null>} [selectionRef] - Reference to the SVG pattern used for selection.
 * @returns {void}
 * @private
 */
export const performSelection: (chart: Chart, chartSelection: BaseSelection, legendRef: RefObject<SVGGElement | null>,
    seriesRef: RefObject<SVGGElement | null>, index: ChartIndexesProps, element?: HTMLElement, pointClick?: boolean
    , highlightRef?: RefObject<SVGPatternElement | null>, selectionRef?: RefObject<SVGPatternElement | null>) => void = (
    chart: Chart,
    chartSelection: BaseSelection,
    legendRef: RefObject<SVGGElement | null>,
    seriesRef: RefObject<SVGGElement | null>,
    index: ChartIndexesProps,
    element?: HTMLElement,
    pointClick?: boolean,
    highlightRef?: RefObject<SVGPatternElement | null>, selectionRef?: RefObject<SVGPatternElement | null>

): void => {
    if (chartSelection.isLegendSelection && !isNullOrUndefined(index?.seriesIndex) &&
        (Number.isNaN(index.trendlineIndex as number) ? !chart.visibleSeries[index.seriesIndex as number].visible
            : !((chart.visibleSeries[index.seriesIndex as number].trendlines?.[index.trendlineIndex as number] as ChartTrendlineModel
            ).targetSeries?.visible))) {
        return;
    }

    // FIX: For single-point selection mode, clear previously selected elements from the same series
    if (chartSelection.mode === 'Point' && !chartSelection.allowMultiSelection &&
            chartSelection.previousSelectedElements && chartSelection.previousSelectedElements.length > 0) {
        const previousElements: Element[] = chartSelection.previousSelectedElements as Element[];
        const currentSeriesIdx: number = index.seriesIndex as number;
        const currentPointIdx: number | undefined = index.pointIndex;

        // Check if clicking the same point again (toggle off)
        let isSamePointClicked: boolean = false;
        previousElements.forEach((selectedElement: Element) => {
            const elementIdx: ChartIndexesProps = indexFinder(selectedElement.id);
            const elementSeriesIdx: number = elementIdx.seriesIndex as number;
            const elementPointIdx: number | undefined = elementIdx.pointIndex;

            if (elementSeriesIdx === currentSeriesIdx && elementPointIdx === currentPointIdx) {
                isSamePointClicked = true;
            }
        });
        if (!isSamePointClicked) {
            previousElements.forEach((selectedElement: Element) => {
                const elementSeriesIdx: number = indexFinder(selectedElement.id).seriesIndex as number;

                // Only remove if it's from the same series
                if (elementSeriesIdx === currentSeriesIdx) {
                    selectedElement.removeAttribute('data-selected');
                    (selectedElement as HTMLElement).style.opacity = '';
                    (selectedElement as HTMLElement).style.fill = '';
                    const elementSeries: SeriesProperties = chart.visibleSeries[elementSeriesIdx as number];
                    if (elementSeries && elementSeries.isRectSeries) {
                        selectedElement.setAttribute('stroke-width', elementSeries.width ? elementSeries.width.toString() : '1');
                    }
                }
            });
            // Update previousSelectedElements to only keep elements from other series
            chartSelection.previousSelectedElements = previousElements.filter((element: Element) => {
                const elementSeriesIdx: number = indexFinder(element.id).seriesIndex as number;
                return elementSeriesIdx !== currentSeriesIdx;
            });

            // Clear indexes only for the current series
            chartSelection.chartSelectedDataIndexes = (chartSelection.chartSelectedDataIndexes as ChartIndexesProps[]).filter(
                (idx: ChartIndexesProps) => idx.seriesIndex !== currentSeriesIdx
            );
        }
    }

    const selectionMode: SelectionMode = chartSelection.isLegendSelection || chartSelection.isTooltipHighlight || !Number.isNaN(index.trendlineIndex) ? 'Series' : chartSelection.mode as SelectionMode;
    let pointElements: Element[];
    switch (selectionMode) {
    case 'Series':
        pointElements = getSeriesElements(seriesRef, legendRef, index.seriesIndex!, chart, index.trendlineIndex!, element);
        selection(chartSelection, chart, pointElements, index, highlightRef, selectionRef);
        blurEffect(chart, chart.visibleSeries, chartSelection, legendRef, seriesRef);
        break;
    case 'Point':
        if ((!isNaN(index?.pointIndex as number) && element) || (!pointClick && isNaN((index?.pointIndex as number)!))) {
            pointElements = [];
            const uniqueIds: Set<string> = new Set<string>();
            const pushIfUnique: (el?: Element | null) => void = (el?: Element | null): void => {
                if (el && (el as HTMLElement) && el.id && !uniqueIds.has(el.id)) {
                    uniqueIds.add(el.id);
                    pointElements.push(el);
                }
            };
            pushIfUnique(element!);
            const chartId: string = chart.element.id;
            const seriesIdx: number = index.seriesIndex as number;
            const baseId: string = `${chartId}_Series_${seriesIdx}_Point_${index.pointIndex}`;
            const allChildren: Element[] = Array.from(seriesRef?.current?.children || []);
            const series: SeriesProperties = chart.visibleSeries[seriesIdx as number];
            if (series?.marker?.visible || series?.marker?.dataLabel?.visible) {
                const isScatterOrBubble: boolean = (chart.visibleSeries[seriesIdx as number]?.type?.indexOf('Scatter') as number > -1) || chart.visibleSeries[seriesIdx as number]?.type === 'Bubble';
                const symbolGroupId: string = isScatterOrBubble ? `${chartId}_Series_${seriesIdx}_SymbolGroup` : `${chartId}SymbolGroup${seriesIdx}`;
                const symbolGroups: SVGGElement[] = allChildren.filter((child: Element) => child.id === symbolGroupId) as SVGGElement[];
                // The base point element resides under the series group, not the symbol group. Find it once.
                const seriesGroup: SVGGElement | undefined = allChildren.find((child: Element) => child.id === `${chartId}SeriesGroup${seriesIdx}`) as SVGGElement | undefined;
                const seriesChildren: Element[] = seriesGroup ? Array.from(seriesGroup.children) : [];

                for (const symbolGroup of symbolGroups) {
                    const children: Element[] = Array.from(symbolGroup.children);
                    const symbolEl: Element | undefined = children.find((element: Element) => element.id.startsWith(`${baseId}_Symbol`));
                    const basePointEl: Element | undefined = seriesChildren.find((element: Element) => element.id === baseId);
                    const isClickedSymbol: boolean = !!element?.id && /_Symbol\d*$/.test(element.id);
                    if (isClickedSymbol) {
                        // When a marker (symbol) is clicked, also select the corresponding series point element
                        pushIfUnique(element);
                        pushIfUnique(basePointEl);
                    } else {
                        // When a series point element is clicked, also select the corresponding marker
                        pushIfUnique(basePointEl);
                        pushIfUnique(symbolEl);
                    }
                }

                // Highlight Text and TextShape elements
                const dataLabelRoot: Element | undefined = allChildren.find((child: Element) => child.id === 'containerDataLabelCollection');
                const labelChildren: Element[] = dataLabelRoot ? Array.from((dataLabelRoot as SVGGElement).children) : allChildren;

                // Get TextShape elements
                const shapeGroupId: string = `containerShapeGroup${seriesIdx}`;
                const shapeGroup: Element | undefined = labelChildren.find((child: Element) => child.id === shapeGroupId);
                if (shapeGroup) {
                    const textShapeElements: Element[] = Array.from(shapeGroup.children).filter(
                        (element: Element) => element.id.startsWith(`${baseId}_TextShape_`)
                    );
                    textShapeElements.forEach((textShapeElement: Element) => pushIfUnique(textShapeElement));
                }

                // Get Text elements
                const textGroupId: string = `containerTextGroup${seriesIdx}`;
                const textGroup: Element | undefined = labelChildren.find((child: Element) => child.id === textGroupId);
                if (textGroup) {
                    const textElements: Element[] = Array.from(textGroup.children).filter(
                        (element: Element) => element.id.startsWith(`${baseId}_Text_`)
                    );
                    textElements.forEach((textElement: Element) => pushIfUnique(textElement));
                }
            }
            if (chart.legendSettings.mode !== 'Gradient' && legendRef?.current) {
                const legendTranslateGroup: Element | undefined = (legendRef.current as SVGGElement)?.children[0];
                if (legendTranslateGroup && element) {
                    // For range color mode in Point mode, match legend shapes by fill color
                    if (chart.legendSettings.mode === 'Range' && isRangeColorEnabled(chart)) {
                        const targetFill: string | null = element.getAttribute('fill');
                        if (targetFill) {
                            const legendShapes: Element[] = Array.from(
                                legendTranslateGroup.querySelectorAll('[id*="_chart_legend_shape_"]')
                            );
                            for (const shape of legendShapes) {
                                const shapeFill: string | null = shape.getAttribute('fill');
                                if (shapeFill === targetFill) {
                                    pushIfUnique(shape);
                                }
                            }
                        }
                    } else {
                        // For non-range color mode or Series mode, use index-based lookup
                        const legendLookupId: string = chart.legendSettings.mode === 'Point'
                            ? `${chartId}_chart_legend_shape_${index.pointIndex}`
                            : `${chartId}_chart_legend_shape_${seriesIdx}`;

                        const legendShape: Element | undefined = Array.from(legendTranslateGroup.children).find(
                            (child: Element) => child.querySelector(`#${legendLookupId}`) !== null
                        );
                        if (legendShape) {
                            const shapeElement: Element | null = legendShape.querySelector(`#${legendLookupId}`);
                            pushIfUnique(shapeElement);
                        }
                    }
                }
            }
            selection(chartSelection, chart, pointElements, index, highlightRef, selectionRef);
            blurEffect(chart, chart.visibleSeries, chartSelection, legendRef, seriesRef);
        }
        break;
    case 'Cluster':
        pointElements = getClusterElements(seriesRef, chart.element.id, index.pointIndex!);
        selection(chartSelection, chart, pointElements, index, highlightRef, selectionRef);
        blurEffect(chart, chart.visibleSeries, chartSelection, legendRef, seriesRef);
        break;
    }
};

/**
 * Applies selection logic for the given elements and index.
 * Handles removal of multi-select elements if necessary, and applies styles to the selected elements.
 *
 * @param {BaseSelection} chartSelection - The selection configuration object.
 * @param {Chart} chart - The chart instance.
 * @param {Element[]} [selectedElements] - An array of elements to be selected.
 * @param {ChartIndexesProps} [index] - The index information of the selected element(s).
 * @param {RefObject<SVGPatternElement | null>} [highlightRef] - Reference to the SVG pattern used for highlighting.
 * @param {RefObject<SVGPatternElement | null>} [selectionRef] - Reference to the SVG pattern used for selection.
 * @returns {void}
 * @private
 */
function selection(
    chartSelection: BaseSelection, chart: Chart, selectedElements?: Element[], index?: ChartIndexesProps
    , highlightRef?: RefObject<SVGPatternElement | null>, selectionRef?: RefObject<SVGPatternElement | null>
): void {
    if (chartSelection.name === 'Selection' && !chartSelection.allowMultiSelection && chartSelection.mode !== 'None') {
        removeMultiSelectElements(chart, chartSelection.chartSelectedDataIndexes!, index!, chartSelection);
    }
    if (!isNullOrUndefined(selectedElements![0])) {
        applyStyles(selectedElements!, chartSelection, chart, highlightRef, selectionRef);
        addOrRemoveIndex(chartSelection.chartSelectedDataIndexes as ChartIndexesProps[], index!, chartSelection, !chartSelection.isAdd);
    }
}

/**
 * Handles the visual effects of blurring or highlighting other elements when a selection is made.
 * It adjusts the opacity and stroke width of elements to emphasize the selected ones.
 *
 * @param {Chart} chart - The chart instance.
 * @param {SeriesProperties[]} visibleSeries - An array of visible series in the chart.
 * @param {BaseSelection} chartSelection - The selection configuration object.
 * @param {RefObject<SVGGElement | null>} legendRef - A reference to the chart's legend element.
 * @param {RefObject<SVGGElement | null>} seriesRef - A reference to the chart's series element.
 * @returns {void}
 * @private
 */
export const blurEffect: (chart: Chart, visibleSeries: SeriesProperties[],
    chartSelection: BaseSelection, legendRef: RefObject<SVGGElement | null>, seriesRef: RefObject<SVGGElement | null>) => void =
    (chart: Chart, visibleSeries: SeriesProperties[], chartSelection: BaseSelection,
     legendRef: RefObject<SVGGElement | null>, seriesRef: RefObject<SVGGElement | null>): void => {
        const selected: Set<number> = new Set<number>(
            (chartSelection.chartSelectedDataIndexes ?? []).map((index: ChartIndexesProps) => index.seriesIndex).filter(
                (value: number | undefined): value is number => typeof value === 'number')
        );
        const hasSelection: boolean = selected.size > 0 && chartSelection.isSelected as boolean;
        const chartId: string = chart.element.id;
        const seriesChildren: Element[] = Array.from(seriesRef.current?.children ?? []);
        const seriesLabelRoot: Element | undefined = seriesChildren.find(
            (c: Element) => (c as HTMLElement).id === `${chartId}_SeriesLabelCollection`
        );
        if (seriesLabelRoot) { applySeriesLabelBlurEffect(seriesLabelRoot, selected, hasSelection, indexFinder); }
        const attributes: 'data-selected' | 'data-highlighted' = chartSelection.name === 'Selection' ? 'data-selected' : 'data-highlighted';

        visibleSeries.forEach((series: SeriesProperties, seriesIndex: number) => {
            const chartId: string = chart.element.id;
            const children: Element[] = Array.from(seriesRef?.current?.children || []);

            const seriesGroup: SVGGElement | undefined = children.find((c: Element) => c.id === `${chartId}SeriesGroup${seriesIndex}`) as SVGGElement | undefined;
            // There can be multiple symbol groups with the same id; collect all of them
            const symbolGroups: SVGGElement[] = children.filter((c: Element) => c.id === ((chart.visibleSeries[seriesIndex as number]?.type?.indexOf('Scatter') as number > -1) || chart.visibleSeries[seriesIndex as number]?.type === 'Bubble' ? `${chartId}_Series_${seriesIndex}_SymbolGroup` : `${chartId}SymbolGroup${seriesIndex}`)) as SVGGElement[];
            // Data labels can be under a separate container
            const dataLabelRoot: SVGGElement | undefined = children.find((c: Element) => c.id === 'containerDataLabelCollection') as SVGGElement | undefined;
            const dlChildren: Element[] = dataLabelRoot ? Array.from(dataLabelRoot.children) : children;
            const shapeGroup: SVGGElement | undefined = dlChildren.find((c: Element) => c.id === `containerShapeGroup${seriesIndex}`) as SVGGElement | undefined;
            const textGroup: SVGGElement | undefined = dlChildren.find((c: Element) => c.id === `containerTextGroup${seriesIndex}`) as SVGGElement | undefined;

            let trendlineGroups: SVGGElement[] = [];
            let trendlinePathElement: HTMLElement | null = null;

            if (series.category === 'TrendLine') {
                const sourceIndex: number = series.sourceIndex as number;
                const trendIndex: number = series.trendIndex as number;

                const trendlineCollection: SVGGElement | undefined =
                    children.find((c: Element) => c.id === `${chartId}TrendlineCollection`) as SVGGElement | undefined;

                if (trendlineCollection) {
                    const trendlineSeriesGroupId: string = `${chartId}TrendlineSeriesGroup${sourceIndex}`;
                    const trendlineSeriesGroup: SVGGElement | undefined = Array.from(trendlineCollection.children)
                        .find((el: Element) => el.id === trendlineSeriesGroupId) as SVGGElement | undefined;

                    if (trendlineSeriesGroup) {
                        const trendlinePathId: string = `${chartId}_Series_${sourceIndex}_Trendline_${trendIndex}`;
                        trendlinePathElement = Array.from(trendlineSeriesGroup.children)
                            .find((el: Element) => el.id === trendlinePathId) as HTMLElement | null;

                        const trendlineMarkerGroupId: string = `${chartId}TrendlineSymbolGroup${trendIndex}`;
                        const trendlineMarkerGroup: SVGGElement | undefined = Array.from(trendlineSeriesGroup.children)
                            .find((el: Element) => el.id === trendlineMarkerGroupId) as SVGGElement | undefined;

                        const trendlineDataLabelCollectionId: string = `${chartId}Trendline_${trendIndex}_DataLabelCollection`;
                        const trendlineDataLabelCollection: SVGGElement | undefined = Array.from(trendlineSeriesGroup.children)
                            .find((el: Element) => el.id === trendlineDataLabelCollectionId) as SVGGElement | undefined;

                        let trendlineShapeGroup: SVGGElement | undefined;
                        let trendlineTextGroup: SVGGElement | undefined;

                        if (trendlineDataLabelCollection) {
                            trendlineShapeGroup = Array.from(trendlineDataLabelCollection.children)
                                .find((el: Element) => el.id === `${chartId}TrendlineShapeGroup${trendIndex}`) as SVGGElement | undefined;

                            trendlineTextGroup = Array.from(trendlineDataLabelCollection.children)
                                .find((el: Element) => el.id === `${chartId}TrendlineTextGroup${trendIndex}`) as SVGGElement | undefined;
                        }

                        trendlineGroups = [
                            ...(trendlineMarkerGroup ? [trendlineMarkerGroup] : []),
                            ...(trendlineShapeGroup ? [trendlineShapeGroup] : []),
                            ...(trendlineTextGroup ? [trendlineTextGroup] : [])
                        ];
                    }
                }
            }
            // Build a flat list including all symbol groups and the single shape/text groups if present
            const groups: SVGGElement[] = series.category === 'TrendLine'
                ? trendlineGroups
                : [
                    ...(seriesGroup ? [seriesGroup] : []),
                    ...symbolGroups,
                    ...(shapeGroup ? [shapeGroup] : []),
                    ...(textGroup ? [textGroup] : [])
                ];

            for (const g of groups) {
                if (!g) { continue; }
                for (const node of Array.from(g.children)) {
                    if (!node || node.tagName.toLowerCase() === 'defs' || node.id === '') { continue; }
                    const pointElement: HTMLElement = node as HTMLElement;

                    const isSelected: boolean = pointElement.getAttribute('data-selected') === 'true' || pointElement.getAttribute(attributes) === 'true';
                    const isActive: boolean = isSelected || (chartSelection.isAdd && !((chartSelection.allowMultiSelection || chartSelection.mode === 'Point') && (chartSelection.chartSelectedDataIndexes?.length as number > 0))) as boolean;

                    if (isActive && !isSelected && pointElement.style.opacity === '0.3') {
                        highlightAnimation(chart, chartSelection, pointElement, seriesIndex,
                                           chartSelection.isTooltipHighlight ? chart.tooltipModule.fadeOutDuration as number : 700, 0.3);
                    } else {
                        stopElementAnimation(pointElement);
                        if (isActive) {
                            pointElement.style.opacity = '';
                        }
                        else if (!isSelected) {
                            pointElement.style.opacity = '0.3';
                        }
                    }

                    // Only series path (no _Point_) should get stroke-width updates for non-rect series
                    if (!series.isRectSeries && pointElement.id === `${chartId}_Series_${seriesIndex}`) {
                        if (isActive && !isSelected) {
                            highlightAnimation(chart, chartSelection, pointElement, seriesIndex, 700, 0.3, true);
                        } else {
                            const strokeWidth: number = isActive ? (series.width ? series.width + 1 : 3) :
                                (series.width ? series.width : 1);
                            pointElement.setAttribute('stroke-width', strokeWidth.toString());
                        }
                    }
                    if (!isSelected && (chartSelection.pattern !== 'None' || (chartSelection.name === 'Highlight' && chartSelection.fill))) {
                        (pointElement as HTMLElement).style.fill = '';
                    }
                }
            }
            if (series.category === 'TrendLine' && trendlinePathElement) {
                const el: HTMLElement = trendlinePathElement;

                const isSelected: boolean = el.getAttribute('data-selected') === 'true' ||
                    el.getAttribute(attributes) === 'true';
                const isActive: boolean = isSelected ||
                    (chartSelection.isAdd && !((chartSelection.allowMultiSelection || chartSelection.mode === 'Point') &&
                        (chartSelection.chartSelectedDataIndexes?.length as number > 0))) as boolean;

                if (isActive && !isSelected && el.style.opacity === '0.3') {
                    highlightAnimation(chart, chartSelection, el, seriesIndex,
                                       chartSelection.isTooltipHighlight ? chart.tooltipModule.fadeOutDuration as number : 700, 0.3);
                } else {
                    stopElementAnimation(el);
                    if (isActive) {
                        el.style.opacity = '';
                    } else if (!isSelected) {
                        el.style.opacity = '0.3';
                    }
                }

                // Stroke-width animation for trendline path (treat like non-rect series main path)
                const tlPathId: string = `${chartId}_Series_${series.sourceIndex}_Trendline_${series.trendIndex}`;
                if (el.id === tlPathId) {
                    if (isActive && !isSelected) {
                        highlightAnimation(chart, chartSelection, el, seriesIndex, 700, 0.3, true);
                    } else {
                        const strokeWidth: number = isActive ? (series.width ? series.width + 1 : 3) :
                            (series.width ? series.width : 1);
                        el.setAttribute('stroke-width', strokeWidth.toString());
                    }
                }

                if (!isSelected && (chartSelection.pattern !== 'None' || (chartSelection.name === 'Highlight' && chartSelection.fill))) {
                    el.style.fill = '';
                }
            }
        });

        const legendTranslateGroup: Element = (legendRef?.current as SVGGElement)?.children[0];
        if (chart.legendSettings.mode !== 'Gradient' && legendTranslateGroup) {
            for (const node of Array.from(legendTranslateGroup.children)) {
                const legendShape: HTMLElement = node?.children.item(0) as HTMLElement;
                const isSelected: boolean = legendShape?.getAttribute('data-selected') === 'true' || legendShape?.getAttribute(attributes) === 'true';
                const isActive: boolean = isSelected || !(chartSelection.mode === 'Series' || chartSelection.isLegendHighlight || (chartSelection.isLegendSelection)) || (chartSelection.isAdd && !((chartSelection.allowMultiSelection || chartSelection.mode === 'Point') && (chartSelection.chartSelectedDataIndexes?.length as number > 0))) as boolean;
                const notActive: boolean = legendShape.getAttribute('fill') === '#D3D3D3' || (legendShape.getAttribute('fill') === 'transparent' && legendShape.getAttribute('stroke') === '#D3D3D3');
                if (legendShape) {
                    if (isActive) {
                        legendShape.style.opacity = '';
                    }
                    else if (!isSelected && !notActive) {
                        legendShape.style.opacity = '0.3';
                    }
                }
                const legendMarker: HTMLElement | undefined = Array.from(node.children).find((markerElement: Element) =>
                    markerElement.id.includes('legend_shape_marker')
                ) as HTMLElement | undefined;

                if (legendMarker) {
                    if (isActive) {
                        legendMarker.style.opacity = '';
                    }
                    else if (!isSelected && !notActive) {
                        legendMarker.style.opacity = '0.3';
                    }
                }
                if (!isSelected && (chartSelection.pattern !== 'None' || (chartSelection.name === 'Highlight' && chartSelection.fill))) {
                    (legendShape as HTMLElement).style.fill = '';
                    (legendShape as HTMLElement).style.stroke = '';
                    if (legendMarker) {
                        legendMarker.style.fill = '';
                        legendMarker.style.stroke = '';
                    }
                }
            }
        }

        chartSelection.isAdd = false;
    };

/**
 * Applies styles and updates the selection state for the given elements.
 * This function is responsible for applying visual styles (like fill colors or patterns) and managing the `data-selected` attribute.
 *
 * @param {Element[]} elements - An array of HTML elements to apply styles to.
 * @param {BaseSelection} chartSelection - The selection configuration object.
 * @param {Chart} chart - The chart instance.
 * @param {RefObject<SVGPatternElement | null>} [highlightRef] - Reference to the SVG pattern used for highlighting.
 * @param {RefObject<SVGPatternElement | null>} [selectionRef] - Reference to the SVG pattern used for selection.
 * @returns {void}
 * @private
 */
const applyStyles: (elements: Element[], chartSelection: BaseSelection, chart: Chart, highlightRef?: RefObject<SVGPatternElement | null>
    , selectionRef?: RefObject<SVGPatternElement | null> ) => void =
    (elements: Element[], chartSelection: BaseSelection, chart: Chart, highlightRef?: RefObject<SVGPatternElement | null>
        , selectionRef?: RefObject<SVGPatternElement | null>): void => {
        const attributes: string = chartSelection.name === 'Selection' ? 'data-selected' : 'data-highlighted';
        for (const element of elements) {
            if (element) {
                if (element.getAttribute(attributes) !== 'true') {
                    const seriesIndex: number = isRangeColorEnabled(chart)
                        ? 0 : indexFinder(element.id)!.seriesIndex!;
                    element.setAttribute(attributes, 'true');
                    const rectSeries: boolean = chart.visibleSeries[seriesIndex as number].type?.indexOf('Line') === -1 && chart.visibleSeries[seriesIndex as number].type !== 'Spline';
                    if (chartSelection.name === 'Selection' && element.hasAttribute('data-highlighted')) {
                        element.removeAttribute('data-highlighted');
                    }
                    if (chartSelection.pattern !== 'None' && rectSeries && !(element.id.indexOf('Text') > -1)) {
                        const patternId: string = `${chart.element.id}_${chartSelection.pattern}_${chartSelection.name}_${seriesIndex}`;
                        (element as HTMLElement).style.fill = `url(#${patternId})`;
                        const shouldSkipPatternFillUpdate: boolean = chart.legendSettings.mode === 'Series' && element.id.indexOf('legend') > -1;
                        if (isRangeColorEnabled(chart) && !shouldSkipPatternFillUpdate) {
                            const pattern: SVGPatternElement | null = (chartSelection.name === 'Selection' ? selectionRef?.current : highlightRef?.current) ?? null;
                            if (pattern) {
                                const fillValue: string | null = element.getAttribute('fill') || (element as HTMLElement).style.fill || '';
                                for (let i: number = 1; i < pattern.children.length; i++) {
                                    const child: Element = pattern.children[i as number];
                                    if (fillValue !== null) {
                                        child.setAttribute('fill', fillValue as string);
                                        child.setAttribute('stroke', fillValue as string);
                                    }
                                }
                            }
                        }
                    }
                    else if (chartSelection.name === 'Highlight' && chartSelection.fill && rectSeries) {
                        (element as HTMLElement).style.fill = chartSelection.fill;
                    }
                    if (element.id.indexOf('_legend_') > -1 && chartSelection.name === 'Highlight' && chartSelection.fill && rectSeries) {
                        (element as HTMLElement).style.stroke = chartSelection.fill;
                    }
                    chartSelection.isSelected = true;
                    chartSelection.previousSelectedElements?.push(element);
                } else {
                    chartSelection.isAdd = true;
                    element.removeAttribute(attributes);
                    chartSelection.isSelected = false;
                    if (chartSelection.allowMultiSelection) {
                        chartSelection.previousSelectedElements = chartSelection.previousSelectedElements?.filter(
                            (el: Element) => el.id !== element.id
                        );
                    }
                    else {
                        chartSelection.previousSelectedElements = [];
                    }
                }

            }
        }
    };

/**
 * Removes elements from multi-select mode based on specific criteria.
 * Used to deselect elements that should no longer be part of the multi-select group.
 *
 * @param {Chart} chart - The chart instance.
 * @param {ChartIndexesProps[]} index - An array of currently selected index properties.
 * @param {ChartIndexesProps} currentIndex - The index properties of the element being interacted with.
 * @param {BaseSelection} chartSelection - The selection configuration object.
 * @returns {void}
 * @private
 */
function removeMultiSelectElements(
    chart: Chart, index: ChartIndexesProps[], currentIndex: ChartIndexesProps, chartSelection: BaseSelection
): void {

    for (let i: number = 0; i < index.length; i++) {
        const targetIndex: ChartIndexesProps = index[i as number];

        const shouldRemove: boolean =
            ((chartSelection.mode === 'Series' || (!chartSelection.isLegendToggle && chartSelection.isLegendSelection)) && !toEquals(targetIndex, currentIndex, true, chartSelection)) ||
            (chartSelection.mode === 'Cluster' && !toEquals(targetIndex, currentIndex, false, chartSelection)) ||
            (chartSelection.mode === 'Point' && chartSelection.allowMultiSelection !== false && (toEquals(targetIndex, currentIndex, true, chartSelection) && !toEquals(targetIndex, currentIndex, false, chartSelection)));

        if (shouldRemove) {

            if (chartSelection.previousSelectedElements) {
                const pointElements: Element[] = chartSelection.mode === 'Point'
                    ? chartSelection.previousSelectedElements.filter((element: Element) => {
                        const baseId: string = `${chart.element.id}_Series_${targetIndex.seriesIndex}_Point_${targetIndex.pointIndex}`;
                        // Match either the base point element or any corresponding marker (symbol) element
                        return element.id === baseId || element.id.startsWith(`${baseId}_Symbol`);
                    })
                    : chartSelection.previousSelectedElements;
                pointElements.forEach((selectedElement: Element) => {
                    selectedElement.removeAttribute('data-selected');
                    (selectedElement as HTMLElement).style.opacity = '0.3';
                    const elementSeries: SeriesProperties = chart.visibleSeries[indexFinder(selectedElement.id).seriesIndex as number];
                    if (elementSeries.isRectSeries) {
                        selectedElement.setAttribute('stroke-width', elementSeries.width ? elementSeries.width.toString() : '1');
                    }
                    if (chartSelection.pattern !== 'None' || (chartSelection.name === 'Highlight' && chartSelection.fill)) {
                        (selectedElement as HTMLElement).style.fill = '';
                    }
                });

                if (chartSelection.mode === 'Point') {
                    chartSelection.previousSelectedElements = chartSelection.previousSelectedElements.filter(
                        (element: Element) => !pointElements.includes(element)
                    );
                } else {
                    chartSelection.previousSelectedElements = [];
                }

            }


            index.splice(i, 1);
            i--;
        }
    }
}

/**
 * Adds or removes an index from the list of selected indexes.
 * Manages the `chartSelectedDataIndexes` array based on user interaction.
 *
 * @param {ChartIndexesProps[]} indexes - The array of currently selected indexes.
 * @param {ChartIndexesProps} index - The index to add or remove.
 * @param {BaseSelection} chartSelection - The selection configuration object.
 * @param {boolean} [isAdd] - A boolean indicating whether to add the index (true) or remove it (false).
 * @returns {void}
 * @private
 */
function addOrRemoveIndex(indexes: ChartIndexesProps[], index: ChartIndexesProps, chartSelection: BaseSelection, isAdd?: boolean): void {
    for (let i: number = 0; i < indexes.length; i++) {
        if (toEquals(indexes[i as number], index, chartSelection.mode === 'Series', chartSelection)) {
            indexes.splice(i, 1);
            i--;
        }
    }
    if (isAdd) { indexes.push(index); }
}

/**
 * Compares two chart index properties to determine equality based on selection mode.
 *
 * @param {ChartIndexesProps} first - The first chart index properties.
 * @param {ChartIndexesProps} second - The second chart index properties.
 * @param {boolean} checkSeriesOnly - If true, only compares series index; otherwise, compares both series and point index.
 * @param {BaseSelection} chartSelection - The selection configuration object.
 * @returns {boolean} True if the indexes are considered equal based on the criteria, false otherwise.
 * @private
 */
function toEquals(first: ChartIndexesProps, second: ChartIndexesProps, checkSeriesOnly: boolean, chartSelection: BaseSelection): boolean {
    const hasFirstTrendline: boolean = !Number.isNaN(first.trendlineIndex as number);
    const hasSecondTrendline: boolean = !Number.isNaN(second.trendlineIndex as number);

    if (hasFirstTrendline || hasSecondTrendline) {
        if (hasFirstTrendline && hasSecondTrendline) {
            return first.trendlineIndex === second.trendlineIndex;
        }
        return false;
    }
    return (
        (first.seriesIndex === second.seriesIndex || (chartSelection.mode === 'Cluster' && !checkSeriesOnly)) &&
        (checkSeriesOnly || first.pointIndex === second.pointIndex)
    );
}

/**
 * Retrieves all SVG elements corresponding to a specific series.
 * This is used to select or deselect all points within a given series.
 *
 * @param {RefObject<SVGGElement | null>} seriesRef - A reference to the SVG group element containing all series.
 * @param {RefObject<SVGGElement | null>} legendRef - A reference to the chart's legend element.
 * @param {number} seriesIndex - The index of the series whose elements are to be retrieved.
 * @param {Chart} chart - The chart instance.
 * @param {number} trendlineIndex - Index of the trendline.
 * @param {HTMLElement} [targetElement] - Optional DOM element that triggered the selection; used to match legend shapes when range-color mapping is active.
 * @returns {SVGElement[]} An array of SVG elements belonging to the specified series.
 * @private
 */
function getSeriesElements(
    seriesRef: React.RefObject<SVGGElement | null>,
    legendRef: RefObject<SVGGElement | null>,
    seriesIndex: number,
    chart: Chart,
    trendlineIndex: number,
    targetElement?: HTMLElement
): SVGElement[] {
    if (!seriesRef.current) { return []; }

    const chartId: string = chart.element.id;
    const checkById: (element: Element | null, id: string) => boolean =
    (element: Element | null, id: string) => !!element && element.id === id;
    const startsWith: (element: Element | null, prefix: string) => boolean = (element: Element | null, prefix: string) => !!element && (element.id || '').startsWith(prefix);

    // Group IDs used by renderer
    const seriesGroupId: string = `${chartId}SeriesGroup${seriesIndex}`;
    const symbolGroupId: string = (chart.visibleSeries[seriesIndex as number]?.type?.indexOf('Scatter') as number > -1) || chart.visibleSeries[seriesIndex as number]?.type === 'Bubble' ? `${chartId}_Series_${seriesIndex}_SymbolGroup` : `${chartId}SymbolGroup${seriesIndex}`;
    const shapeGroupId: string = `containerShapeGroup${seriesIndex}`;
    const textGroupId: string = `containerTextGroup${seriesIndex}`;
    const pathPrefix: string = `${chartId}_Series_`; // path and general series elements
    const pointPrefix: string = `${chartId}_Series_${seriesIndex}_Point_`; // point-related (markers, labels)

    // Locate groups under the series container
    const children: Element[] = Array.from(seriesRef.current.children);
    const seriesGroup: Element | undefined = children.find((c: Element) => checkById(c, seriesGroupId));
    const symbolGroups: Element = children.find((c: Element) => checkById(c, symbolGroupId)) as Element;

    // Data labels may be wrapped in a collection group: {chartId}DataLabelCollection
    const dataLabelRoot: Element | undefined = children.find((c: Element) => checkById(c, 'containerDataLabelCollection'));
    const labelChildren: Element[] = dataLabelRoot ? Array.from((dataLabelRoot as SVGGElement).children) : children;
    const shapeGroup: Element | undefined = labelChildren.find((c: Element) => checkById(c, shapeGroupId));
    const textGroup: Element | undefined = labelChildren.find((c: Element) => checkById(c, textGroupId));

    const collected: SVGElement[] = [];

    const trendlineCollection: Element | undefined = children.find((c: Element) => checkById(c, `${chartId}TrendlineCollection`));

    const seriesLabelCollectionId: string = `${chartId}_SeriesLabelCollection`;
    const seriesLabelRoot: Element | undefined = children.find((child: Element) => checkById(child, seriesLabelCollectionId));
    if (seriesLabelRoot) {
        const labelElementChildren: Element[] = Array.from((seriesLabelRoot as SVGGElement).children);
        for (const childElement of labelElementChildren) {
            if (childElement.tagName.toLowerCase() !== 'text') { continue; }
            const info: ChartIndexesProps = indexFinder((childElement as SVGTextElement).id);
            if (info?.seriesIndex === seriesIndex) {
                collected.push(childElement as SVGElement);
            }
        }
    }
    let targetID: string = '';
    let targetLegendShapeElement: HTMLElement | undefined;
    let isPointElement: boolean = false;
    if (isRangeColorEnabled(chart)) {
        if (targetElement && targetElement.id.indexOf('text') > 1) {
            targetID = targetElement.id.replace('text', 'shape');
        }
        else if (targetElement && targetElement.id.indexOf('marker') > 1) {
            targetID = targetElement.id.replace('_marker', '');
        }
        else if (targetElement && targetElement.id.indexOf('_g') > 1) {
            targetID = targetElement.id.replace('_g_', '_shape_');
        }
        else if (targetElement && targetElement.id.indexOf('_shape_') > 1) {
            targetID = targetElement.id;
        }
        else{
            isPointElement = true;
        }
        // If we have a targetID and a legend, look up the corresponding legend shape element by id
        if ((targetID || isPointElement) && legendRef && legendRef.current) {
            const legendTranslateGroup: Element | undefined = (legendRef.current as SVGGElement).children[0];
            if (legendTranslateGroup) {
                for (const node of Array.from(legendTranslateGroup.children)) {
                    const shapeEl: HTMLElement | null = node?.children?.item(0) as HTMLElement | null;
                    if (shapeEl && (isPointElement ? targetElement?.getAttribute('fill') === shapeEl.getAttribute('fill') : shapeEl.id === targetID)) {
                        targetLegendShapeElement = shapeEl;
                        break;
                    }
                }
            }
        }
    }
    if (Number.isFinite(trendlineIndex) && trendlineCollection) {
        const trendlineRoot: SVGGElement = trendlineCollection as SVGGElement;
        const seriesTrendlineGroupId: string = `${chartId}TrendlineSeriesGroup${seriesIndex}`;
        const seriesTrendlineGroup: SVGGElement | undefined = Array.from(trendlineRoot.children)
            .find((el: Element) => checkById(el, seriesTrendlineGroupId)) as SVGGElement | undefined;

        if (seriesTrendlineGroup) {
            const trendlinePathId: string = `${chartId}_Series_${seriesIndex}_Trendline_${trendlineIndex}`;
            const trendlinePathEl: Element | undefined = Array.from(seriesTrendlineGroup.children)
                .find((el: Element) => checkById(el, trendlinePathId));
            if (trendlinePathEl) {
                collected.push(trendlinePathEl as SVGElement);
            }

            const trendlineMarkerGroupId: string = `${chartId}TrendlineSymbolGroup${trendlineIndex}`;
            const trendlineMarkerGroup: SVGGElement | undefined = Array.from(seriesTrendlineGroup.children)
                .find((el: Element) => checkById(el, trendlineMarkerGroupId)) as SVGGElement | undefined;
            if (trendlineMarkerGroup) {
                for (const node of Array.from(trendlineMarkerGroup.children)) {
                    if (node && node.tagName.toLowerCase() !== 'defs') {
                        collected.push(node as SVGElement);
                    }
                }
            }

            const dataLabelCollectionId: string = `${chartId}Trendline_${trendlineIndex}_DataLabelCollection`;
            const dataLabelCollection: SVGGElement | undefined = Array.from(seriesTrendlineGroup.children)
                .find((el: Element) => checkById(el, dataLabelCollectionId)) as SVGGElement | undefined;

            if (dataLabelCollection) {
                const trendlineShapeGroupId: string = `${chartId}TrendlineShapeGroup${trendlineIndex}`;
                const trendlineShapeGroup: SVGGElement | undefined = Array.from(dataLabelCollection.children)
                    .find((el: Element) => checkById(el, trendlineShapeGroupId)) as SVGGElement | undefined;
                if (trendlineShapeGroup) {
                    for (const node of Array.from(trendlineShapeGroup.children)) {
                        if (node && node.tagName.toLowerCase() !== 'defs') {
                            collected.push(node as SVGElement);
                        }
                    }
                }
                const trendlineTextGroupId: string = `${chartId}TrendlineTextGroup${trendlineIndex}`;
                const trendlineTextGroup: SVGGElement | undefined = Array.from(dataLabelCollection.children)
                    .find((el: Element) => checkById(el, trendlineTextGroupId)) as SVGGElement | undefined;
                if (trendlineTextGroup) {
                    for (const node of Array.from(trendlineTextGroup.children)) {
                        if (node && node.tagName.toLowerCase() !== 'defs') {
                            collected.push(node as SVGElement);
                        }
                    }
                }
            }
        }
    }
    else {

        // 1) Collect series path/area elements
        if (seriesGroup) {
            for (const element of Array.from(seriesGroup.children)) {
                const tag: string = element.tagName.toLowerCase();
                if (tag === 'defs') { continue; }
                if (isRangeColorEnabled(chart)) {
                    if (targetLegendShapeElement ? (targetLegendShapeElement.getAttribute('fill') === element.getAttribute('fill') && startsWith(element, pathPrefix)) : startsWith(element, pathPrefix)) {
                        collected.push(element as SVGElement);
                    }
                } else {
                    if (startsWith(element, pathPrefix)) { collected.push(element as SVGElement); }
                }
            }
        } else {
            // Fallback: search directly under root for path element
            const directPath: Element | undefined = children.find((child: Element) => startsWith(child, pathPrefix));
            if (directPath) {
                if (isRangeColorEnabled(chart)) {
                    if (targetLegendShapeElement ? (targetLegendShapeElement.getAttribute('fill') === directPath.getAttribute('fill') && startsWith(directPath, pathPrefix)) : startsWith(directPath, pathPrefix)) {
                        collected.push(directPath as SVGElement);
                    }
                } else {
                    collected.push(directPath as SVGElement);
                }
            }
        }

        // 2) Collect marker symbols for the series
        if (symbolGroups) {
            for (const element of Array.from((symbolGroups as SVGGElement).children)) {
                const tag: string = element.tagName.toLowerCase();
                if (tag === 'defs') { continue; }
                if (startsWith(element, pointPrefix)) { collected.push(element as SVGElement); }
            }
        }

        // 3) Collect data label shapes (TextShape) and text
        if (shapeGroup) {
            for (const element of Array.from(shapeGroup.children)) {
                if (isRangeColorEnabled(chart)) {
                    if (startsWith(element, pointPrefix) && element.id.includes('_TextShape_')) {
                        const shapeBaseId: string = element.id.split('_TextShape_')[0];
                        const shapeBaseSelector: string = `[id^="${shapeBaseId}"]`;
                        const matchingElementInDom: Element | null = typeof document !== 'undefined' ? document.querySelector(shapeBaseSelector) : null;
                        const isBaseFoundInCollected: boolean = !!matchingElementInDom
                        && collected.some((c: SVGElement) => c.id === (matchingElementInDom as Element).id);
                        if (isBaseFoundInCollected) { collected.push(element as SVGElement); }
                    }
                } else {
                    if (startsWith(element, pointPrefix) && element.id.includes('_TextShape_')) { collected.push(element as SVGElement); }
                }
            }
        }
        if (textGroup) {
            for (const element of Array.from(textGroup.children)) {
                if (isRangeColorEnabled(chart)) {
                    if (startsWith(element, pointPrefix) && element.id.includes('_Text_')) {
                        const textBaseId: string = element.id.split('_Text_')[0];
                        const baseIdSelector: string = `[id^="${textBaseId}"]`;
                        const matchingElementInDom: Element | null = typeof document !== 'undefined' ? document.querySelector(baseIdSelector) : null;
                        const isBaseFoundInCollected: boolean = !!matchingElementInDom
                        && collected.some((c: SVGElement) => c.id === (matchingElementInDom as Element).id);
                        if (isBaseFoundInCollected) { collected.push(element as SVGElement); }
                    }
                } else {
                    if (startsWith(element, pointPrefix) && element.id.includes('_Text_')) { collected.push(element as SVGElement); }
                }
            }
        }
    }
    if (legendRef.current) {
        const effectiveSeriesIndex: number =
            Number.isFinite(trendlineIndex) &&
                chart.visibleSeries[seriesIndex as number]?.trendlines?.[trendlineIndex as number]?.targetSeries?.index !== undefined
                ? (chart.visibleSeries[seriesIndex as number]!.trendlines![trendlineIndex as number]!.targetSeries!.index as number)
                : seriesIndex;
        const legendRoot: SVGGElement = legendRef.current;
        const legendTranslateGroup: Element = legendRoot?.children[0];
        if (legendTranslateGroup) {
            if (isRangeColorEnabled(chart)) {
                // For range color mode with point element, find ALL legend shapes that match the target fill
                if (isPointElement && targetElement) {
                    const targetFill: string | null = targetElement.getAttribute('fill');
                    if (targetFill) {
                        // Get all legend shape elements
                        const legendShapes: Element[] = Array.from(legendTranslateGroup.querySelectorAll('[id*="_chart_legend_shape_"]'));
                        // Push all shapes that match the target fill color
                        for (const shape of legendShapes) {
                            if (shape.getAttribute('fill') === targetFill) {
                                collected.push(shape as SVGElement);
                            }
                        }
                    }
                } else if (targetLegendShapeElement && targetLegendShapeElement.id) {
                    // Fallback for other cases - find by specific ID
                    const selector: string = `[id="${targetLegendShapeElement.id}"]`;
                    const found: Element | null = (legendTranslateGroup as Element).querySelector(selector);
                    if (found) { collected.push(found as SVGElement); }
                }
            } else {
                const legendItemGroup: Element = legendTranslateGroup.children.item(effectiveSeriesIndex) as Element;
                const legendShape: Element = legendItemGroup?.children.item(0) as Element;
                void ((legendShape) && (
                    collected.push(legendShape as SVGElement)
                ));
            }
        }
    }

    return collected;
}

/**
 * Retrieves all HTML elements that constitute a cluster for a given point index.
 * This function iterates through series and their elements to find all elements associated with a specific data point cluster.
 * Includes elements like the main point, marker symbol, and data labels.
 *
 * @param {RefObject<SVGGElement | null>} seriesRef - A reference to the SVG group element containing all series.
 * @param {string} chartId - The ID of the chart.
 * @param {number} pointIndex - The index of the data point.
 * @returns {Element[]} An array of HTML elements that form the cluster for the specified point.
 * @private
 */
export function getClusterElements(
    seriesRef: React.RefObject<SVGGElement | null>,
    chartId: string,
    pointIndex: number
): Element[] {
    const clusters: Element[] = [];
    const seriesContainer: SVGGElement | null = seriesRef.current;
    if (!seriesContainer) { return clusters; }

    for (let s: number = 0; s < seriesContainer.childElementCount; s++) {
        const seriesGroup: Element | null = seriesContainer.children.item(s);
        if (!seriesGroup || seriesGroup.tagName.toLowerCase() === 'defs') { continue; }

        const seriesIndex: number = indexFinder(seriesGroup.id)?.seriesIndex as number;
        const basePointId: string = `${chartId}_Series_${seriesIndex}_Point_${pointIndex}`;

        const matchingElements: Element[] = Array.from(seriesGroup.children).filter((child: Element) => {
            const id: string = child.id || '';
            return (
                id === basePointId ||
                id === `${basePointId}_Symbol` ||
                id === `${basePointId}_Text_0` ||
                id === `${basePointId}_TextShape_0`
            );
        });

        if (seriesGroup.id?.includes(`SeriesGroup${seriesIndex}`)) {
            if (matchingElements.length > 0) {
                clusters.push(...matchingElements);
            } else {
                clusters.push(...Array.from(seriesGroup.children).filter((child: Element) => child.tagName.toLowerCase() !== 'defs'));
            }
        } else {
            if (matchingElements.length > 0) {
                clusters.push(...matchingElements);
            } else {
                for (let i: number = 0; i < seriesGroup.childElementCount; i++) {
                    const child: Element | null = seriesGroup.children.item(i);
                    if (child && child.id.includes(`_Series_${seriesIndex}_Point_${pointIndex}`)) {
                        clusters.push(child);
                        break;
                    }
                }

            }
        }
    }

    return clusters;
}

/**
 * Generates SVG pattern elements for various selection patterns (e.g., Dots, Chessboard, etc.).
 * These patterns are used to visually represent the selection or highlight style on chart elements.
 *
 * @param {string} chartId - The ID of the chart.
 * @param {SelectionPattern} patternName - The name of the selection pattern to generate.
 * @param {string} color - The base color to be used in the pattern.
 * @param {number} index - The index of the series or element the pattern is associated with.
 * @param {number} opacity - The opacity of the pattern fill.
 * @param {string} interaction - The type of interaction (e.g., 'Selection', 'Highlight').
 * @param {React.Ref<SVGPatternElement>} ref - Ref forwarded to the generated SVG pattern element.
 * @returns {JSX.Element} An SVG pattern element.
 * @private
 */
export function ensureSelectionPattern(
    chartId: string,
    patternName: SelectionPattern,
    color: string,
    index: number,
    opacity: number,
    interaction: string,
    ref: React.Ref<SVGPatternElement>
): JSX.Element {
    const patternId: string = `${chartId}_${patternName}_${interaction}_${index}`;

    const backgroundColor: string = '#ffffff';
    const WIDTH: number = 10;
    const HEIGHT: number = 12;
    const PATTERN_NUM: number = 6;
    const CIRCLE_NUM: number = 9;
    const BUB_NUM: number = 20;

    const bg: (patternWidth: number, patternHeight: number) => JSX.Element =
        (patternWidth: number, patternHeight: number) => (
            <rect key="bg" x="0" y="0" width={patternWidth} height={patternHeight} transform="translate(0,0)" fill={backgroundColor} opacity={opacity} />
        );

    let patternWidth: number = 10;
    let patternHeight: number = 10;
    let body: JSX.Element[] = [];

    switch (patternName) {
    case 'Dots':
        patternWidth = patternHeight = PATTERN_NUM;
        body = [bg(patternWidth, patternHeight), <circle key="dot" cx="3" cy="3" r="2" strokeWidth="1" fill={color} />];
        break;

    case 'Pacman':
        patternWidth = 17.917; patternHeight = 18.384;
        body = [
            bg(patternWidth, patternHeight),
            <path
                key="pacman"
                d="M9.081,9.194l5.806-3.08c-0.812-1.496-2.403-3.052-4.291-3.052H8.835C6.138,3.063,3,6.151,3,8.723v1.679
             c0,2.572,3.138,5.661,5.835,5.661h1.761c2.085,0,3.835-1.76,4.535-3.514L9.081,9.194z"
                strokeWidth="1"
                stroke={color}
                fill={color}
            />
        ];
        break;

    case 'Chessboard':
        patternWidth = patternHeight = WIDTH;
        body = [
            bg(patternWidth, patternHeight),
            <rect key="chess1" x="0" y="0" width="5" height="5" fill={color} opacity={opacity} />,
            <rect key="chess2" x="5" y="5" width="5" height="5" fill={color} opacity={opacity} />
        ];
        break;

    case 'Crosshatch':
        patternWidth = patternHeight = 8;
        body = [
            bg(patternWidth, patternHeight),
            <path key="crosshatch" d="M0 0L8 8ZM8 0L0 8Z" strokeWidth="1" stroke={color} fill="none" />
        ];
        break;

    case 'DiagonalForward':
        patternWidth = patternHeight = PATTERN_NUM;
        body = [
            bg(patternWidth, patternHeight),
            <path key="diagF" d="M 3 -3 L 9 3 M 6 6 L 0 0 M 3 9 L -3 3" strokeWidth="2" stroke={color} fill="none" />
        ];
        break;

    case 'DiagonalBackward':
        patternWidth = patternHeight = PATTERN_NUM;
        body = [
            bg(patternWidth, patternHeight),
            <path key="diagB" d="M 3 -3 L -3 3 M 0 6 L 6 0 M 9 3 L 3 9" strokeWidth="2" stroke={color} fill="none" />
        ];
        break;

    case 'Grid':
        patternWidth = patternHeight = PATTERN_NUM;
        body = [
            bg(patternWidth, patternHeight),
            <path
                key="grid"
                d="M1 3.5L11 3.5 M0 3.5L11 3.5 M0 7.5L11 7.5 M0 11.5L11 11.5 M5.5 0L5.5 12 M11.5 0L11.5 12Z"
                strokeWidth="1"
                stroke={color}
                fill="none"
            />
        ];
        break;

    case 'Circle':
        patternWidth = patternHeight = CIRCLE_NUM;
        body = [bg(patternWidth, patternHeight), <circle key="circle" cx="5.125" cy="3.875" r="3.625" strokeWidth="1" fill={color} />];
        break;

    case 'HorizontalDash':
        patternWidth = patternHeight = HEIGHT;
        body = [
            bg(patternWidth, patternHeight),
            <path key="hdash" d="M0,1.5 L10 1.5 M0,5.5 L10 5.5 M0,9.5 L10 9.5 z" strokeWidth="1" stroke={color} fill={color} />
        ];
        break;

    case 'VerticalDash':
        patternWidth = patternHeight = HEIGHT;
        body = [
            bg(patternWidth, patternHeight),
            <path key="vdash" d="M1.5,0 L1.5 10 M5.5,0 L5.5 10 M9.5,0 L9.5 10 z" strokeWidth="1" stroke={color} fill={color} />
        ];
        break;

    case 'Rectangle':
        patternWidth = patternHeight = HEIGHT;
        body = [
            <rect key="rect-bg" width={patternHeight} height={patternHeight} fill={backgroundColor} opacity={opacity} />,
            <rect key="rect1" x="1" y="2" width="4" height="9" fill={color} opacity={opacity} />,
            <rect key="rect2" x="7" y="2" width="4" height="9" fill={color} opacity={opacity} />
        ];
        break;

    case 'Box':
        patternWidth = patternHeight = WIDTH;
        body = [
            <rect key="box-bg" width="13" height="13" fill={backgroundColor} opacity={opacity} />,
            <rect key="box" x="1.5" y="1.5" width={WIDTH} height="9" fill={color} opacity={opacity} />
        ];
        break;

    case 'HorizontalStripe':
        patternWidth = WIDTH; patternHeight = HEIGHT;
        body = [
            bg(patternWidth, patternHeight),
            <path key="hstripe" d="M0,0.5 L10 0.5 M0,4.5 L10 4.5 M0,8.5 L10 8.5 z" strokeWidth="1" stroke={color} fill={color} />
        ];
        break;

    case 'VerticalStripe':
        patternWidth = HEIGHT; patternHeight = WIDTH;
        body = [
            bg(patternWidth, patternHeight),
            <path key="vstripe" d="M0.5,0 L0.5 10 M4.5,0 L4.5 10 M8.5,0 L8.5 10 z" strokeWidth="1" stroke={color} fill={color} />
        ];
        break;

    case 'Bubble':
        patternWidth = patternHeight = BUB_NUM;
        body = [
            bg(patternWidth, patternHeight),
            <circle key="bub1" cx="5.217" cy="11.325" r="3.429" strokeWidth="1" fill="#D0A6D1" />,
            <circle key="bub2" cx="13.328" cy="6.24" r="4.884" strokeWidth="1" fill={color} />,
            <circle key="bub3" cx="13.277" cy="14.66" r="3.018" strokeWidth="1" fill="#D0A6D1" />
        ];
        break;

    default:
        patternWidth = patternHeight = 6;
        body = [bg(patternWidth, patternHeight), <circle key="default" cx="3" cy="3" r="1.5" fill={color} />];
    }

    return (
        <pattern ref={ref} key={patternId} id={patternId} patternUnits="userSpaceOnUse" width={patternWidth} height={patternHeight}>
            {body}
        </pattern>
    );
}

/**
 * Performs a highlight animation on the specified HTML element.
 *
 * @param {Chart} chart - The chart instance.
 * @param {BaseSelection} chartSelection - The selection options for the chart.
 * @param {HTMLElement} element - The HTML element to animate.
 * @param {number} index - The index to find the opacity value of the series.
 * @param {number} duration - The duration of the animation in milliseconds.
 * @param {number} startOpacity - The starting opacity value for the animation.
 * @param {boolean} strokeWidth - The starting opacity value for the animation.
 * @returns {void}
 * @private
 */
export function highlightAnimation(chart: Chart, chartSelection: BaseSelection, element: HTMLElement, index: number,
                                   duration: number, startOpacity: number, strokeWidth?: boolean): void {
    let endOpacity: number = 0;
    let endWidth: number = 0;
    const startWidth: number = parseFloat(chart.visibleSeries[index as number].width!.toString()) + 1;
    if (strokeWidth) {
        if (element.id.indexOf('border') !== -1 && chart.visibleSeries[index as number].border!.width) {
            endWidth = parseFloat(chart.visibleSeries[index as number].border!.width!.toString());
        }
        else if (element.id.indexOf('Symbol') !== -1 && chart.visibleSeries[index as number].marker!.border!.width) {
            endWidth = parseFloat(chart.visibleSeries[index as number].marker!.border!.width!.toString());
        }
        else {
            endWidth = parseFloat(chart.visibleSeries[index as number].width!.toString());
        }
    }
    else {
        if (element.id.indexOf('border') !== -1) {
            endOpacity = 1;
        }
        else if (element.id.indexOf('Symbol') !== -1) {
            endOpacity = parseFloat(chart.visibleSeries[index as number].marker!.opacity!.toString());
        }
        else {
            endOpacity = parseFloat(chart.visibleSeries[index as number].opacity!.toString());
        }
        if (chartSelection && chartSelection.mode === 'None' && chartSelection.fill !== '') {
            startOpacity = 1;
        }
    }
    if (endOpacity !== 0 || (strokeWidth && endWidth !== 0 && startWidth)) {
        const animationProps: AnimationOptions = {
            duration: duration,
            progress: (args: AnimationOptions): void => {
                element.style.animation = '';
                const progress: number = args.timeStamp! / args.duration!;
                if (strokeWidth) {
                    const currentWidth: number = startWidth + (endWidth - startWidth) * progress;
                    element.setAttribute('stroke-width', currentWidth.toString());
                }
                else {
                    const currentOpacity: number = startOpacity + (endOpacity - startOpacity) * progress;
                    element.style.opacity = currentOpacity.toString();
                }
            },
            end: (): void => {
                if (!chartSelection.isSelected) {
                    if (strokeWidth) {
                        element.setAttribute('stroke-width', endWidth.toString());
                    }
                    else {
                        element.style.opacity = '';
                    }
                }
            }
        };
        const animation: IAnimation = Animation(animationProps);
        (animation as IAnimation).animate(element, animationProps);
    }
}

/**
 * Stops the animation and sets opacity of the specified HTML element.
 *
 * @param {HTMLElement} element - The HTML element to stop the animation.
 * @returns {void}
 * @private
 */
export function stopElementAnimation(element: HTMLElement): void {
    const animationProps: AnimationOptions = {
        end: (): void => {
            element.style.opacity = '';
        }
    };
    if (element.getAttribute('sf-animate')) {
        Animation.stop(element, animationProps);
    }
}
