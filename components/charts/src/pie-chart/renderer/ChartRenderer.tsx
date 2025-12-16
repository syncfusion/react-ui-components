// ChartRenderer.tsx
import { PieChartBorderProps, PieChartSizeProps, PieChartComponentProps, PieChartSeriesProps, PieChartMarginProps, PieChartTooltipProps } from '../base/interfaces';
import { JSX, useContext, useEffect, useLayoutEffect } from 'react';
import { isNullOrUndefined, useProviderContext } from '@syncfusion/react-base';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartContext } from '../layout/ChartProvider';
import { useLayout } from '../layout/LayoutContext';
import { getThemeColor } from '../utils/theme';
import { processChartSeries } from './series-renderer/ProcessData';
import { Chart, PieBase, SeriesProperties } from '../base/internal-interfaces';
import { DataManager, Query } from '@syncfusion/react-data';

/**
 * React functional component that renders a circular chart layout.
 * It uses layout context to determine available size, rendering phase,
 * and measurement triggers, and accesses the chart's parent DOM element.
 *
 * @param {PieChartComponentProps} props - The properties used to configure the circular chart.
 * @returns {JSX.Element} The rendered chart component.
 */
export const ChartRenderer: React.FC<PieChartComponentProps> = (props: PieChartComponentProps) => {
    const { layoutRef, availableSize, phase, triggerRemeasure, reportMeasured, disableAnimation, setDisableAnimation } = useLayout();
    const { parentElement, chartSeries, chartTooltip } = useContext(ChartContext);

    const { locale, dir } = useProviderContext();
    useLayoutEffect(() => {
        if (phase === 'measuring') {
            const border: PieChartBorderProps = { ...defaultChartConfigs.chart.border, ...props.border };

            const margin: Required<PieChartMarginProps> =
                { ...defaultChartConfigs.chart.margin, ...props.margin } as Required<PieChartMarginProps>;

            const borderWidth: number = border.width as number;
            const chartConfiguration: Partial<Chart> = createChartLayoutConfig(
                props, availableSize, borderWidth, margin, parentElement.element, chartTooltip, dir, disableAnimation as boolean);
            layoutRef.current = chartConfiguration as Chart;
            calculateVisibleSeries(layoutRef.current, chartSeries);
            processChartSeries(layoutRef.current);
            layoutRef.current.triggerRemeasure = triggerRemeasure;
            setDisableAnimation?.(false);
            reportMeasured('Chart');
        }
    }, [phase]);

    useEffect(() => {
        if (phase !== 'measuring') {
            triggerRemeasure();
        }
    }, [
        props.border?.width, props?.theme, props.margin?.left, props.margin?.right,
        props.margin?.top, props.margin?.bottom, locale, dir, props.center
    ]);

    return phase === 'rendering' && (
        <>
            {renderChartBorder(layoutRef.current, props)}
            {renderBackground(layoutRef.current, props)}
        </>
    );
};

/**
 * Renders the border rectangle for a circular chart using SVG.
 *
 * @param {Chart} chart - The chart instance containing layout dimensions and element references.
 * @param {PieChartComponentProps} chartProps - The properties of the circular chart component.
 * @returns {JSX.Element} A JSX element representing the chart border.
 */
function renderChartBorder(chart: Chart, chartProps: PieChartComponentProps): JSX.Element {
    return (
        <rect
            id={chart.element.id + '_ChartBorder'}
            width={chart.rect.width}
            height={chart.rect?.height}
            x={chart.rect.x}
            y={chart.rect.y}
            fill={chartProps.background || 'transparent'}
            stroke={chartProps.border?.color}
            strokeWidth={chartProps.border?.width}
            strokeDasharray={chartProps.border?.dashArray || ''}
        />
    );
}

/**
 * Renders the background image for a circular chart if one is provided in the chart properties.
 *
 * @param {Chart} chart - The chart instance containing layout and rendering information.
 * @param {PieChartComponentProps} chartProps - The properties of the circular chart component, including background image settings.
 * @returns {JSX.Element | null} A JSX element representing the background image, or null if no image is specified.
 */
function renderBackground(chart: Chart, chartProps: PieChartComponentProps): JSX.Element | null {
    if (!chartProps.backgroundImage) {
        return null;
    }
    return (
        <image
            id={chart.element?.id + '_ChartBackground'}
            href={chartProps.backgroundImage}
            x={0}
            y={0}
            width={chart.availableSize.width}
            height={chart.availableSize.height}
            visibility="visible"
        />
    );
}

/**
 * Creates and returns a partial chart layout configuration based on the provided properties,
 * available size, margins, and DOM element. This configuration includes layout dimensions,
 * theme settings, and clipping boundaries for rendering the chart.
 *
 * @param {PieChartComponentProps} props - The chart component properties including theme and other configuration options.
 * @param {PieChartSizeProps} availableSize - The available width and height for rendering the chart.
 * @param {number} borderWidth - The width of the chart border, used to calculate the inner layout dimensions.
 * @param {Required<PieChartMarginProps>} margin - The required margin values (top, right, bottom, left) around the chart content.
 * @param {HTMLElement} element - The HTML element that hosts the chart.
 * @param {PieChartTooltipProps} chartTooltip - The state of tooltip while rendering.
 * @param {string} dir - Text direction (e.g., 'ltr' or 'rtl').
 * @param {boolean} disableAnimation -  Flag for animation.
 * @returns {Partial<Chart>} A partial chart configuration object containing layout, theme, and clipping information.
 */
function createChartLayoutConfig(
    props: (PieChartComponentProps | Chart), availableSize: PieChartSizeProps,
    borderWidth: number, margin: Required<PieChartMarginProps>, element: HTMLElement, chartTooltip: PieChartTooltipProps, dir: string,
    disableAnimation: boolean
): Partial<Chart> {
    const chartConfig: Partial<Chart> = {
        availableSize: availableSize,
        pointRender: props.pointRender,
        onLegendClick: props.onLegendClick,
        element: element,
        rect: {
            x: borderWidth / 2, y: borderWidth / 2,
            width: availableSize.width - borderWidth * 2, height: availableSize.height - borderWidth * 2
        },
        clickCount: 0,
        margin: margin,
        smartLabels: isNullOrUndefined(props.smartLabels) ? true : props.smartLabels,
        theme: props.theme || 'Material',
        themeStyle: getThemeColor(props.theme || 'Material'),
        enableRtl: dir === 'rtl' ? true : false,
        background: props.background,
        clipRect: {
            x: margin.left + borderWidth,
            y: margin.top + borderWidth,
            height: availableSize.height - (margin.top + borderWidth + borderWidth + margin.bottom),
            width: availableSize.width - (margin.left + borderWidth + margin.right + borderWidth)
        },
        center: { x: props.center?.x || '50%', y: props.center?.y || '50%' },
        pieSeries: {} as PieBase,
        animateSeries: disableAnimation,
        format: '',
        previousTargetId: '',
        tooltipModule: chartTooltip,
        centerLabelRenderResults: [],
        textHoverRenderResults: []
    };
    return chartConfig;
}

/**
 * Creates a deep clone of the given `SeriesProperties` object to prevent reference leaks between charts.
 *
 * @param {SeriesProperties} series - The source object of type `SeriesProperties` to clone.
 * @returns {SeriesProperties} A new `SeriesProperties` object that is a deep copy of the input.
 * @private
 */
function cloneSeriesProps(series: SeriesProperties): SeriesProperties {
    // Preserve non-serializable references like DataManager and Query, but deep-clone plain props
    const keepDataSource: Object | DataManager | undefined = (series).dataSource;
    const keepQuery: string | Query | undefined = (series).query;
    let cloned: SeriesProperties;
    try {
        cloned = JSON.parse(JSON.stringify(series)) as SeriesProperties;
    } catch (_e) {
        cloned = { ...(series) } as SeriesProperties;
    }
    // Reattach preserved references if they exist
    if (keepDataSource) {
        (cloned).dataSource = keepDataSource;
    }
    if (keepQuery) {
        (cloned).query = keepQuery;
    }
    return cloned;
}

/**
 * Filters and assigns the visible series to the chart based on the provided series collection.
 * This function updates the `visibleSeries` property of the chart with only those series
 * that are marked as visible or meet specific rendering criteria.
 *
 * @param {Chart} chart - The chart instance where the visible series will be stored.
 * @param {PieChartSeriesProps[]} chartSeries - The complete list of series to evaluate for visibility.
 * @returns {void}
 * @private
 */
export function calculateVisibleSeries(chart: Chart, chartSeries: PieChartSeriesProps[]): void {
    chart.visibleSeries = [];
    for (let i: number = 0, length: number = chartSeries.length; i < length; i++) {
        if (chart.visibleSeries.length === 0) {
            const cloned: SeriesProperties = cloneSeriesProps(chartSeries[i as number] as SeriesProperties);
            chart.visibleSeries.push(cloned);
            chart.visibleSeries[i as number].index = i;
            chart.visibleSeries[i as number].chart = chart;
            break;
        }
    }
}
