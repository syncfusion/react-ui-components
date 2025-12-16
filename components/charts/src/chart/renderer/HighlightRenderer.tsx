import { extend, isNullOrUndefined } from '@syncfusion/react-base';
import { useLayoutEffect, useEffect, RefObject, useContext } from 'react';
import { SelectionPattern } from '../base/enum';
import { BaseSelection, ChartHighlightProps } from '../base/interfaces';
import { Chart, SeriesProperties } from '../chart-area/chart-interfaces';
import { registerChartEventHandler } from '../hooks/useClipRect';
import { useLayout } from '../layout/LayoutContext';
import { blurEffect, calculateSelectedElements, ensureSelectionPattern } from './SelectionRenderer';
import { ChartContext } from '../layout/ChartProvider';

/**
 * The HighlightRenderer component is responsible for rendering the highlight effects on the chart.
 * It handles the logic for applying and removing highlight styles based on user interactions like mouse movements.
 * It uses `useLayoutEffect` and `useEffect` hooks to manage the lifecycle and updates of the highlight rendering.
 *
 * @param {ChartHighlightProps} props - The properties for the HighlightRenderer component, including mode, fill, and pattern.
 * @returns {Element} A JSX fragment that conditionally renders highlight elements.
 * @private
 */
export const HighlightRenderer: React.FC<ChartHighlightProps> = (props: ChartHighlightProps) => {
    const { layoutRef, phase, reportMeasured, setLayoutValue, seriesRef, legendRef } = useLayout();
    const { chartLegend, chartTooltip } = useContext(ChartContext);
    let chartHighlight: BaseSelection = layoutRef.current?.chartHighlight as BaseSelection;
    let chart: Chart = layoutRef.current?.chart as Chart;

    useLayoutEffect(() => {
        if (phase === 'measuring') {
            if ((props.mode !== 'None' || chartLegend.visible || chartTooltip?.enable) && layoutRef.current?.chart) {
                const chartHighlight: BaseSelection =
                    getHighlightOptions(props, layoutRef.current?.chart as Chart, chartLegend.visible as boolean,
                                        (chartTooltip?.enable && props.mode === 'None') as boolean);
                setLayoutValue('chartHighlight', chartHighlight);
            }
            reportMeasured('ChartHighlight');

            chartHighlight = layoutRef.current?.chartHighlight as BaseSelection;
            chart = layoutRef.current?.chart as Chart;
        }
    }, [phase]);

    useEffect(() => {
        if (phase !== 'measuring' && layoutRef.current?.chartHighlight) {
            (layoutRef.current?.chartHighlight as BaseSelection).mode = props.mode;
            (layoutRef.current?.chartHighlight as BaseSelection).fill = props.fill;
            (layoutRef.current?.chartHighlight as BaseSelection).pattern = props.pattern as SelectionPattern;
            chartHighlight = layoutRef.current?.chartHighlight as BaseSelection;
        }
    }, [props.mode, props.fill, props.pattern]);
    useEffect(() => {
        const chartId: string | undefined = (layoutRef.current?.chart as Chart)?.element?.id;
        if (!chartId) { return; }

        const handleHighlight: (e: Event) => void = (e: Event): void => {
            if (isNullOrUndefined(e.target) || !(layoutRef.current?.chartHighlight)) {
                return;
            }
            if ((e.target as HTMLElement).id.includes('_ErrorBarGroup_') || (e.target as HTMLElement).id.includes('_ErrorBarCap_') ){
                return;
            }
            chartHighlight = layoutRef.current?.chartHighlight as BaseSelection;
            chart = layoutRef.current?.chart as Chart;
            if (chartHighlight && chart) {
                highlightChart(chart, chartHighlight, e.target as Element, legendRef, seriesRef, layoutRef.current?.chartSelection &&
                    (layoutRef.current?.chartSelection as BaseSelection).chartSelectedDataIndexes?.length as number > 0);
            }
        };

        const handleSelection: (e: Event) => void = (e: Event): void => {
            if (isNullOrUndefined(e.target) || !(layoutRef.current?.chartHighlight)) {
                return;
            }
            if ((e.target as HTMLElement).id.includes('_ErrorBarGroup_') || (e.target as HTMLElement).id.includes('_ErrorBarCap_') ){
                return;
            }
            chartHighlight = layoutRef.current?.chartHighlight as BaseSelection;
            chart = layoutRef.current?.chart as Chart;

            const targetElement: HTMLElement = e.target as HTMLElement;
            chartHighlight.isLegendSelection =
                targetElement.id.indexOf('_legend_shape') > -1 ||
                targetElement.id.indexOf('_legend_text') > -1 ||
                targetElement.id.indexOf('_legend_g_') > -1;

            if (chartHighlight.isLegendSelection) {
                resetHighlight(chart, chartHighlight, legendRef, seriesRef);
            }
        };

        // Clear highlight when mouse leaves the chart area
        const handleMouseLeave: (e: Event) => void = (_e: Event): void => {
            if (!layoutRef.current?.chartHighlight || (layoutRef.current?.chartSelection &&
                    (layoutRef.current?.chartSelection as BaseSelection).chartSelectedDataIndexes?.length as number > 0)) { return; }
            chartHighlight = layoutRef.current?.chartHighlight as BaseSelection;
            chart = layoutRef.current?.chart as Chart;
            resetHighlight(chart, chartHighlight, legendRef, seriesRef);
        };

        const unregisterMouseMove: () => void = registerChartEventHandler(
            'mouseMove',
            handleHighlight,
            chartId
        );

        const unregisterMouseLeave: () => void = registerChartEventHandler(
            'mouseLeave',
            handleMouseLeave,
            chartId
        );

        const unregisterMouseClick: () => void = registerChartEventHandler(
            'click',
            handleSelection,
            (layoutRef.current?.chart as Chart)?.element.id
        );

        return () => {
            unregisterMouseClick();
            unregisterMouseLeave();
            unregisterMouseMove();
        };
    }, [props.mode, props]);

    return (
        <>
            {props.pattern !== 'None' &&
                (props.mode !== 'None' || (chartTooltip && chartTooltip.enable) || (chartLegend && chartLegend.visible)) &&
                chart &&
                chartHighlight &&
                chart.visibleSeries.map((_: SeriesProperties, i: number) => {

                    return ensureSelectionPattern(
                        chart.element.id,
                        props.pattern as SelectionPattern,
                        props.fill ? props.fill : chart.visibleSeries[i as number].interior,
                        i,
                        chart.visibleSeries[i as number].opacity as number,
                        'Highlight'
                    );
                })}
        </>
    );
};

/**
 * Retrieves and initializes the highlight options for the chart.
 * This function extends the provided props and sets default values or properties specific to chart highlighting.
 *
 * @param {ChartHighlightProps} chartHighlight - The highlight properties passed to the renderer.
 * @param {Chart} chart - The chart instance.
 * @param {boolean} legendHighlight - A boolean indicating if highlight is enabled on the legend.
 * @param {boolean} tooltipHighlight - A boolean indicating if tooltip was enabled.
 * @returns {BaseSelection} A BaseSelection object configured for chart highlighting.
 */
function getHighlightOptions(chartHighlight: ChartHighlightProps, chart: Chart, legendHighlight: boolean,
                             tooltipHighlight: boolean): BaseSelection {
    const highlight: BaseSelection = extend({}, chartHighlight) as BaseSelection;
    highlight.chart = chart;
    highlight.isLegendSelection = false;
    highlight.chartSelectedDataIndexes = [];
    highlight.previousSelectedElements = [];
    highlight.isSelected = false;
    highlight.isAdd = false;
    highlight.name = 'Highlight';
    highlight.isLegendHighlight = legendHighlight;
    highlight.isLegendToggle = false;
    highlight.isTooltipHighlight = tooltipHighlight;

    return highlight;
}

/**
 * Resets the current highlight state and restores the dim/blur effect across the chart.
 * This routine removes highlight attributes from previously highlighted elements,
 * clears internal tracking, and re-applies the default blur state for unselected items.
 *
 * @param {Chart} chart - The chart instance associated with the highlighted elements.
 * @param {BaseSelection} chartHighlight - The highlight state container to reset.
 * @param {RefObject<SVGGElement | null>} legendRef - Reference to the legend root element used by blurEffect.
 * @param {RefObject<SVGGElement | null>} seriesRef - Reference to the series root element used by blurEffect.
 * @returns {void}
 */
function resetHighlight(
    chart: Chart,
    chartHighlight: BaseSelection,
    legendRef: RefObject<SVGGElement | null>,
    seriesRef: RefObject<SVGGElement | null>
): void {
    if (chartHighlight.previousSelectedElements?.length) {
        const elementCollection: Element[] = chartHighlight.previousSelectedElements as Element[];
        elementCollection.forEach((selectedElement: Element) => selectedElement.removeAttribute('data-highlighted'));
        chartHighlight.isAdd = true;
        chartHighlight.chartSelectedDataIndexes = [];
        blurEffect(chart, chart.visibleSeries, chartHighlight, legendRef, seriesRef);
        chartHighlight.previousSelectedElements = [];
        chartHighlight.isSelected = false;
    }
}

/**
 * Handles the logic for highlighting chart elements based on user interaction.
 * It determines which elements should be highlighted or de-highlighted based on the current interaction target and highlight configuration.
 *
 * @param {Chart} chart - The chart instance.
 * @param {BaseSelection} chartHighlight - The highlight configuration object.
 * @param {Element} target - The DOM element that triggered the highlight event (e.g., the element under the mouse cursor).
 * @param {RefObject<SVGGElement | null>} legendRef - A reference to the chart's legend element.
 * @param {RefObject<SVGGElement | null>} seriesRef - A reference to the chart's series element.
 * @param {boolean} [isSelected] - An optional boolean indicating if any data points are already selected.
 * @returns {void}
 * @private
 */
export function highlightChart(chart: Chart, chartHighlight: BaseSelection, target: Element, legendRef: RefObject<SVGGElement | null>,
                               seriesRef: RefObject<SVGGElement | null>, isSelected?: boolean): void {
    if (chartHighlight.mode !== 'None' || chartHighlight.isLegendHighlight || chartHighlight.isTooltipHighlight) {
        if (!isNullOrUndefined(target)) {
            if ((target).hasAttribute('data-highlighted') || (target).hasAttribute('data-selected')) {
                return;
            }
            if (chartHighlight.previousSelectedElements && chartHighlight.previousSelectedElements.length > 0) {
                const pointElements: Element[] = chartHighlight.previousSelectedElements as Element[];
                pointElements.forEach((selectedElement: Element) => {
                    selectedElement.removeAttribute('data-highlighted');
                });
            }
            calculateSelectedElements(chart, chartHighlight, legendRef, seriesRef, target as HTMLElement, false, isSelected);
        }
        return;
    }
}
