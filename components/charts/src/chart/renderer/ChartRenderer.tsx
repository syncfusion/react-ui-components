// ChartRenderer.tsx
import { useLayout } from '../layout/LayoutContext';
import { ChartBorderProps, ChartAreaProps, ChartComponentProps, ChartTooltipProps, ChartZoomSettingsProps, Column, ChartMarginProps, Row } from '../base/interfaces';
import { JSX, useContext, useEffect, useLayoutEffect } from 'react';
import { calculateVisibleAxis } from './AxesRenderer/AxisRender';
import { extend, useProviderContext } from '@syncfusion/react-base';
import { getSeriesColor, getThemeColor } from '../utils/theme';
import { processChartSeries } from './SeriesRenderer/ProcessData';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { AxisModel, Chart, ColumnProps, ElementWithSize, RowProps, SeriesProperties, ChartSizeProps } from '../chart-area/chart-interfaces';
import { markerShapes } from './SeriesRenderer/MarkerRenderer';
import { Theme } from '../../common';

/**
 * ChartRenderer - Core functional component responsible for rendering the complete chart layout and structure.
 *
 * `ChartRenderer` is the root functional component responsible for rendering the entire chart layout.
 * It handles the layout measurements, sizing, and rendering logic for all chart elements.
 *
 * @param {ChartComponentProps} props - The properties used to configure and render the chart,
 * including series, axes, title, legend, and other chart-specific options.
 *
 * @returns {JSX.Element} The complete chart element with its layout and visual components.
 */
export const ChartRenderer: React.FC<ChartComponentProps> = (props: ChartComponentProps) => {
    const { layoutRef, availableSize, reportMeasured, phase, setLayoutValue,
        triggerRemeasure, disableAnimation, setDisableAnimation } = useLayout();
    const { parentElement, rows, columns, chartArea, chartSeries, axisCollection, chartZoom, chartTooltip } = useContext(ChartContext);
    const { locale, dir } = useProviderContext();
    useLayoutEffect(() => {
        if (phase === 'measuring') {
            const border: ChartBorderProps = { ...defaultChartConfigs.chart.border, ...props.border };
            const margin: Required<ChartMarginProps> = { ...defaultChartConfigs.chart.margin, ...props.margin };
            const borderWidth: number = border.width as number;
            const rectWidth: number = availableSize.width - borderWidth;
            const rectHeight: number = availableSize.height - borderWidth;
            const theme: Theme = props.theme || 'Material';
            let visibleSeries: SeriesProperties[] = calculateVisibleSeries(chartSeries as SeriesProperties[], props, theme);
            const requireInvertedAxis: boolean = calculateAreaType(visibleSeries, props);
            const visibleAxisCollection: AxisModel[] = calculateVisibleAxis(
                requireInvertedAxis, axisCollection, visibleSeries);

            visibleSeries = processChartSeries(visibleSeries);

            const chartRows: RowProps[] = rows.map((row: Row) => {
                const newRow: RowProps = extend({}, row) as RowProps;
                newRow.axes = [];
                return newRow;
            });

            const chartColumns: ColumnProps[] = columns.map((c: Column) => {
                const newColumn: ColumnProps = extend({}, c) as ColumnProps;
                newColumn.axes = [];
                return newColumn;
            });

            const chartConfiguration: Partial<Chart> = createChartLayoutConfig(
                props, parentElement, margin, disableAnimation as boolean, border as Required<ChartBorderProps>, availableSize,
                dir, borderWidth, rectWidth, rectHeight, locale, theme, requireInvertedAxis, axisCollection,
                triggerRemeasure, visibleAxisCollection, chartRows, chartColumns, visibleSeries, chartArea, chartZoom
                , chartTooltip);
            setLayoutValue('chart', chartConfiguration);
            setDisableAnimation?.(false);
            reportMeasured('Chart');
        }
    }, [phase, layoutRef]);

    useEffect(() => {
        if (phase !== 'measuring') {
            triggerRemeasure();
        }
    }, [props.border?.width, props.theme, props.margin?.left, props.margin?.right, props.margin?.top, props.margin?.bottom, locale, dir]);

    return phase === 'rendering' && (
        <>
            {renderChartBorder(layoutRef.current.chart as Chart, props)}
            {renderBackground(layoutRef.current.chart as Chart, props)}
        </>
    );
};

/**
 * Renders the border rectangle element for the chart container.
 *
 * Creates an SVG rect element that serves as the visual border around the entire chart.
 * The border styling is determined by the chart's border configuration and theme settings.
 *
 * @param {Chart} chart - The complete chart configuration object containing layout and styling information.
 * @param {ChartComponentProps} chartProps - The properties of the chart component that may affect how the border is rendered.
 * @returns {JSX.Element} A JSX rectangle element representing the chart border.
 * @private
 */
function renderChartBorder(chart: Chart, chartProps: ChartComponentProps): JSX.Element {
    return (
        <rect
            id={chart.element.id + '_ChartBorder'}
            width={chart.rect.width}
            height={chart.rect?.height}
            x={chart.rect.x}
            y={chart.rect.y}
            fill={chart.background}
            stroke={chartProps.border?.color}
            strokeWidth={chart.border.width}
            strokeDasharray={chartProps.border?.dashArray || ''}
        />
    );
}

/**
 * Conditionally renders a background image element for the chart if specified.
 *
 * Creates an SVG image element to display a background image behind all chart elements.
 * The function performs a null check and only renders when a background image is configured.
 *
 * @param {Chart} chart - The chart instance containing specifications for rendering.
 * @param {ChartComponentProps} chartProps - Additional properties for rendering the chart.
 * @returns {JSX.Element|null} A JSX element representing the chart's background or null if no background image is set.
 * @private
 */
function renderBackground(chart: Chart, chartProps: ChartComponentProps): JSX.Element | null {
    if (!chart.backgroundImage) {
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
 * Determines if an inverted axis is required based on the series collection and chart properties.
 *
 * Analyzes the primary series type and chart transposition setting to determine
 * if the chart requires inverted axes. This is essential for proper rendering of bar charts
 * and transposed chart layouts.
 *
 * @param {SeriesProperties[]} seriesCollection - An array of series used in the chart to evaluate the axis requirement.
 * @param {ChartComponentProps} chart - Properties of the chart used to determine the need for an inverted axis.
 * @returns {boolean} A boolean indicating whether an inverted axis is necessary for the chart's area type.
 * @private
 */
export function calculateAreaType(seriesCollection: SeriesProperties[], chart: ChartComponentProps): boolean {
    const series: SeriesProperties = seriesCollection[0];
    const isBarType: boolean = series.type?.includes('Bar') as boolean;
    const isTransposed: boolean = chart.transposed as boolean;
    return (isBarType && !isTransposed) || (!isBarType && isTransposed);
}

/**
 * Calculates and returns the visible series based on the provided chart series and theme.
 *
 * Transforms raw chart series data into a processed collection of visible series
 * with applied themes, colors, markers, and sorting. Handles color palette assignment,
 * marker shape configuration, and z-order sorting for proper rendering layering.
 *
 * @param {SeriesProperties} chartSeries - The series of the chart that needs to be evaluated for visibility.
 * @param {ChartComponentProps} chart - The chart component props.
 * @param {Theme} theme - The theme applied to the chart.
 * @returns {SeriesProperties[]} An array of series that are deemed visible according to the given criteria.
 * @private
 */
export function calculateVisibleSeries(chartSeries: SeriesProperties[], chart: ChartComponentProps, theme: Theme): SeriesProperties[] {
    let series: SeriesProperties;
    const visibleSeries: SeriesProperties[] = [];
    const palettes: string[] = getSeriesColor(theme);
    const colors: string[] = chart.palettes?.length ? chart.palettes : palettes;
    const count: number = colors.length;
    const seriesCollection: SeriesProperties[] = ([] as SeriesProperties[]).
        concat(chartSeries).sort((a: SeriesProperties, b: SeriesProperties) => {
            const zOrderA: number = a.zOrder as number; // Default to 0 if a.zOrder is null or undefined
            const zOrderB: number = b.zOrder as number; // Default to 0 if b.zOrder is null or undefined
            return zOrderA - zOrderB;
        });
    for (let i: number = 0; i < seriesCollection.length; i++) {
        series = seriesCollection[i as number];
        if (series.marker && series.marker.visible && !series.marker.shape) {
            series.marker.shape = markerShapes[i % (markerShapes.length - 1)];
        }
        series.category = 'Series';
        series.index = i;
        series.interior = series.fill || colors[i % count];
        series.chartProps = chart;
        visibleSeries.push(series);
        seriesCollection[i as number] = series;
    }
    return visibleSeries;
}

/**
 * Creates a partial chart configuration object based on layout and rendering parameters.
 * This function is used to compute the layout and visual settings for rendering a chart.
 *
 * Constructs a complete Chart configuration object by combining layout measurements,
 * styling properties, behavioral flags, and component references. This configuration serves as the
 * single source of truth for chart rendering and interaction handling.
 *
 * @param {ChartComponentProps} props - Properties of the chart component.
 * @param {ElementWithSize} parentElement - The parent DOM element with size information.
 * @param {Required<ChartMarginProps>} margin - Margin settings around the chart area.
 * @param {boolean} disableAnimation - Flag to disable chart animations.
 * @param {Required<ChartBorderProps>} border - Border settings for the chart container.
 * @param {ChartSizeProps} availableSize - The available size for rendering the chart.
 * @param {string} dir - Text direction (e.g., 'ltr' or 'rtl').
 * @param {number} borderWidth - Width of the chart border.
 * @param {number} rectWidth - Width of the chart's bounding rectangle.
 * @param {number} rectHeight - Height of the chart's bounding rectangle.
 * @param {string} locale - Locale identifier for formatting and localization.
 * @param {Theme} theme - Theme settings for chart appearance.
 * @param {boolean} requireInvertedAxis - Flag indicating if axes should be inverted.
 * @param {AxisModel[]} axisCollection - Collection of all axis models.
 * @param {Function} triggerRemeasure - Callback to trigger layout re-measurement.
 * @param {AxisModel[]} visibleAxisCollection - Collection of currently visible axes.
 * @param {RowProps[]} chartRows - Configuration for chart rows.
 * @param {ColumnProps[]} chartColumns - Configuration for chart columns.
 * @param {SeriesProperties[]} visibleSeries - Collection of visible series to be rendered.
 * @param {ChartAreaProps} chartArea - Properties defining the chart area.
 * @param {ChartZoomSettingsProps} chartZoom - Zoom settings for the chart.
 * @param {ChartTooltipProps} chartTooltip - Tooltip configuration for the chart.
 * @returns {Partial<Chart>} A partial chart configuration object used for rendering.
 * @private
 */
function createChartLayoutConfig(
    props: ChartComponentProps, parentElement: ElementWithSize,
    margin: Required<ChartMarginProps>, disableAnimation: boolean,
    border: Required<ChartBorderProps>, availableSize: ChartSizeProps, dir: string,
    borderWidth: number, rectWidth: number, rectHeight: number, locale: string, theme: Theme,
    requireInvertedAxis: boolean, axisCollection: AxisModel[], triggerRemeasure: () => void, visibleAxisCollection: AxisModel[],
    chartRows: RowProps[], chartColumns: ColumnProps[], visibleSeries: SeriesProperties[], chartArea: ChartAreaProps,
    chartZoom: ChartZoomSettingsProps, chartTooltip: ChartTooltipProps): Partial<Chart> {
    const chartConfig: Partial<Chart> = {
        element: parentElement.element,
        margin: margin,
        animateSeries: !disableAnimation,
        border: border,
        availableSize: availableSize,
        enableRtl: dir === 'rtl' || locale === 'ar'  ? true : false,
        rect: { x: borderWidth / 2, y: borderWidth / 2, width: rectWidth, height: rectHeight },
        background: props.background || 'transparent',
        backgroundImage: props.backgroundImage,
        locale: locale,
        palettes: props.palettes || [],
        theme: theme,
        themeStyle: getThemeColor(theme),
        requireInvertedAxis: requireInvertedAxis,
        axes: axisCollection.slice(2),
        currentLegendIndex: 0,
        currentSeriesIndex: 0,
        currentPointIndex: 0,
        previousTargetId: '',
        chartProps: props,
        triggerRemeasure: triggerRemeasure,
        clipRect: {
            x: margin.left + borderWidth,
            y: margin.top + borderWidth,
            height: availableSize.height - (margin.top + borderWidth + borderWidth + margin.bottom),
            width: availableSize.width - (margin.left + borderWidth + margin.right + borderWidth)
        },
        iSTransPosed: props.transposed,
        axisCollection: visibleAxisCollection,
        rows: chartRows,
        columns: chartColumns,
        visibleSeries: visibleSeries,
        horizontalAxes: [],
        verticalAxes: [],
        enableAnimation: props.enableAnimation ?? true,
        chartArea: chartArea,
        paneLineOptions: [],
        zoomSettings: chartZoom,
        clickCount: 0,
        delayRedraw: true,
        isGestureZooming: false,
        enableSideBySidePlacement: props.enableSideBySidePlacement,
        startPanning: false,
        tooltipModule: chartTooltip,
        dataLabelCollections: []
    };
    return chartConfig;
}

