import * as React from 'react';
import { extend, HorizontalAlignment, VerticalAlignment } from '@syncfusion/react-base';
import { forwardRef, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import { useLayout } from '../../layout/LayoutContext';
import { calculateLegendBound, calculateLegendTitle, changePage, getLegendOptions, LegendClick, renderLegend, renderSymbol } from './CommonLegend';
import { ThemeStyle } from '../../utils/theme';
import { getTextAnchor } from '../../utils/helper';
import { registerChartEventHandler, useLegendUpdateVersion } from '../../hooks/events';
import { BaseLegend, Chart, LegendOptions, PathOptions, Rect, RectOption, TextOption } from '../../base/internal-interfaces';
import { PieChartAccessibilityProps, PieChartFontProps, PieChartLocationProps, PieChartMarginProps, PieChartPaddingProps, PieChartLegendProps } from '../../base/interfaces';
import { LegendPosition } from '../../../common';
import { PieLegendShape } from '../../base/enum';


// Define reducer state and action types
type LegendState = {
    pageText: string;
    transformValue: string;
    triggerUpdate: number;
};

const LEGEND_PAGE_UP: string = '_pageup';
const LEGEND_PAGE_DOWN: string = '_pagedown';

type LegendAction =
  | { type: 'SET_PAGE_TEXT'; payload: string }
  | { type: 'SET_TRANSFORM'; payload: string }
  | { type: 'TRIGGER_UPDATE' };

// Reducer for legend state management
const legendReducer: (state: LegendState, action: LegendAction) => LegendState =
(state: LegendState, action: LegendAction): LegendState => {
    switch (action.type) {
    case 'SET_PAGE_TEXT':
        return { ...state, pageText: action.payload };
    case 'SET_TRANSFORM':
        return { ...state, transformValue: action.payload };
    case 'TRIGGER_UPDATE':
        return { ...state, triggerUpdate: state.triggerUpdate + 1 };
    default:
        return state;
    }
};

export const ChartLegendRenderer: React.FC<PieChartLegendProps> = (props: PieChartLegendProps): React.ReactElement | null => {
    const { layoutRef, reportMeasured, phase, triggerRemeasure } = useLayout();
    const [, dispatch] = useReducer(legendReducer, {
        pageText: '',
        transformValue: 'translate(0, 0)',
        triggerUpdate: 0
    });

    // Memoize dependencies to prevent unnecessary re-renders
    const propsToWatch: {
        visible: boolean;
        width: string | number;
        height: string | number;
        location: object;
        position: string;
        padding: number;
        isInversed: boolean;
        reverse: boolean;
        fixedWidth: boolean;
        maxLabelWidth: number;
        enablePages: boolean;
        itemPadding: number;
        align: string;
        shapePadding: number;
        margin: object;
        containerPadding: object;
        maxTitleWidth: number;
        textStyle: PieChartFontProps;
    } = useMemo(() => ({
        visible: props.visible as boolean,
        width: props.width as string,
        height: props.height as string,
        location: props.location as PieChartLocationProps,
        position: props.position as LegendPosition,
        padding: props.padding as number,
        isInversed: props.inversed as boolean,
        reverse: props.reverse as boolean,
        fixedWidth: props.fixedWidth as boolean,
        maxLabelWidth: props.maxLabelWidth as number,
        enablePages: props.enablePages as boolean,
        itemPadding: props.itemPadding as number,
        align: props.align as HorizontalAlignment | VerticalAlignment,
        shapePadding: props.shapePadding as number,
        margin: props.margin as PieChartMarginProps,
        containerPadding: props.containerPadding as PieChartPaddingProps,
        maxTitleWidth: props.maxTitleWidth as number,
        textStyle: props.textStyle as PieChartFontProps
    }), [
        props.visible,
        props.width,
        props.height,
        props.location,
        props.position,
        props.padding,
        props.inversed,
        props.reverse,
        props.fixedWidth,
        props.maxLabelWidth,
        props.enablePages,
        props.itemPadding,
        props.align,
        props.shapePadding,
        props.margin,
        props.containerPadding,
        props.maxTitleWidth,
        props.textStyle
    ]);

    // Handle shape property changes
    const shapeProps: {
        shapeHeight: number | undefined;
        shapeWidth: number | undefined;
    } = useMemo(() => ({
        shapeHeight: props.shapeHeight,
        shapeWidth: props.shapeWidth
    }), [props.shapeHeight, props.shapeWidth]);

    // Handle title property changes
    const titleProps: {
        title: string | undefined;
        titleStyle: PieChartFontProps | undefined;
    } = useMemo(() => ({
        title: props.title,
        titleStyle: props.titleStyle
    }), [props.title, props.titleStyle]);

    useLayoutEffect(() => {
        if (phase === 'measuring') {
            const chart: Chart = layoutRef.current as Chart;
            let legend: BaseLegend = extend({}, props) as BaseLegend;
            chart.chartLegend = legend;
            getLegendOptions(
                legend,
                chart.visibleSeries,
                chart
            );
            legend = chart.chartLegend;
            if (layoutRef.current && legend) {
                legend.chart = layoutRef.current as Chart;
            }

            if (layoutRef.current && props.visible) {
                const legendClipRect: Rect = extend({}, chart.clipRect, {}) as Rect;
                layoutRef.current.chartLegend.legendClipRect = legendClipRect;
                calculateLegendBound(
                    layoutRef.current.chartLegend,
                    chart.clipRect,
                    chart.availableSize,
                    chart
                );
                renderLegend(
                    (layoutRef.current.chartLegend as BaseLegend).legendBounds as Rect,
                    chart,
                    layoutRef.current.chartLegend as BaseLegend
                );
            }
            reportMeasured('ChartLegend');
        }
    }, [phase]);

    useEffect(() => {
        if (phase !== 'measuring') {
            triggerRemeasure();
        }
    }, [propsToWatch, shapeProps]);

    useEffect(() => {
        if (phase !== 'measuring' && layoutRef.current && layoutRef.current.chartLegend) {
            const chart: Chart = layoutRef.current as Chart;
            const legend: BaseLegend = layoutRef.current.chartLegend as BaseLegend;
            const legendBounds: Rect = legend.legendBounds as Required<RectOption>;
            calculateLegendBound(
                legend,
                legend.legendClipRect as Rect,
                chart.availableSize,
                chart
            );
            if (legend.legendBounds === legendBounds) {
                calculateLegendTitle(legend, legend.legendBounds, chart);
                dispatch({ type: 'TRIGGER_UPDATE' });
            } else {
                triggerRemeasure();
            }
        }
    }, [titleProps]);

    if (!props.visible || phase === 'measuring' || !layoutRef.current.chartLegend || !layoutRef.current) {
        return null;
    }

    return <></>;
};

/**
 * Component that renders the custom legend for a chart with interactive elements.
 * Handles pagination, visibility toggling, and styling of legend items.
 *
 * @param props - The properties for configuring the chart legend.
 * @param ref - Reference to the SVG group element.
 * @returns The rendered custom legend component or null if not visible.
 */
export const CustomLegendRenderer: React.ForwardRefExoticComponent<PieChartLegendProps & React.RefAttributes<SVGGElement>> =
forwardRef<SVGGElement, PieChartLegendProps>((props: PieChartLegendProps, ref: React.Ref<SVGGElement>): React.ReactElement | null => {
    const { layoutRef, phase } = useLayout();
    const legendRef: React.RefObject<SVGGElement | null> = useRef<SVGGElement>(null);
    // const legendShapeVersion: boolean = layoutRef.current && layoutRef.current.chartLegend &&
    // layoutRef.current.chartLegend.isShapeChanged as boolean;

    const [state, dispatch] = useReducer(legendReducer, {
        pageText: '',
        transformValue: 'translate(0, 0)',
        triggerUpdate: 0
    });

    // Listen for external legend update events
    const legendUpdateInfo: { version: number; id: string } = useLegendUpdateVersion();

    // Update the transform value when it changes
    const updateLegendTransform: (transform: string) => void = (transform: string): void => {
        dispatch({ type: 'SET_TRANSFORM', payload: transform });
    };

    // Update page text when it changes
    const updatePageText: (newPageText: string) => void = (newPageText: string): void => {
        dispatch({ type: 'SET_PAGE_TEXT', payload: newPageText });
    };

    useEffect(() => {
        if (legendRef.current) {
            legendRef.current.setAttribute('transform', state.transformValue);
        }
    }, [state.transformValue]);

    useLayoutEffect(() => {
        if (phase === 'measuring') {
            if (layoutRef.current && props.visible) {
                const legend: BaseLegend = layoutRef.current.chartLegend as BaseLegend;
                if (legend.isPaging) {
                    const initialPageText: string = legend.pageTextOption?.text as string;
                    dispatch({ type: 'SET_PAGE_TEXT', payload: initialPageText });
                }
            }
        }
    }, [phase]);

    // Re-render the legend visuals when a legend update is triggered
    useEffect(() => {
        if (phase === 'measuring' || !layoutRef.current?.chartLegend) { return; }
        if (legendUpdateInfo && legendUpdateInfo.id !== (layoutRef.current as Chart)?.element.id) { return; }
        const chart: Chart = layoutRef.current as Chart;
        const legend: BaseLegend = layoutRef.current.chartLegend as BaseLegend;
        const previousLegendBounds: Rect | undefined = legend.legendBounds as Rect;
        getLegendOptions(legend, chart.visibleSeries, chart);
        calculateLegendBound(legend, legend.legendClipRect as Rect, chart.availableSize, chart, previousLegendBounds, true);
        renderLegend(legend.legendBounds as Rect, chart, legend);
        dispatch({ type: 'TRIGGER_UPDATE' });
    }, [legendUpdateInfo.version]);

    useEffect(() => {
        if (phase !== 'measuring' && layoutRef.current && layoutRef.current.chartLegend) {
            const chart: Chart = layoutRef.current as Chart;
            const legend: BaseLegend = layoutRef.current.chartLegend as BaseLegend;

            for (const seriesLegend of legend.legendCollections as LegendOptions[]) {
                seriesLegend.shape = props.shape as PieLegendShape;
            }

            for (let i: number = 0; legend.legendCollections && i < legend.legendCollections.length; i++) {
                renderSymbol(legend.legendCollections[i as number], i, chart, legend);
            }

            dispatch({ type: 'TRIGGER_UPDATE' });
        }
    }, [props.shape, props.imageUrl]);

    useEffect(() => {
        const handleLegendClick: (e: Event) => void = (e: Event): void => {
            if (!props.visible || !layoutRef.current.chartLegend) {
                return;
            }

            const targetId: string = (e.target as HTMLElement).id;
            if (!targetId || !targetId.includes('_chart_legend')) {
                return;
            }

            const chart: Chart = layoutRef.current as Chart;
            const currentLegend: BaseLegend = layoutRef.current.chartLegend as BaseLegend;

            const legendItemsId: string[] = [
                `${currentLegend.legendID}_text_`,
                `${currentLegend.legendID}_shape_marker_`,
                `${currentLegend.legendID}_shape_`
            ];

            for (const id of legendItemsId) {
                if (targetId.indexOf(id) > -1 && props.toggleVisibility) {
                    const pointIndex: number = parseInt(targetId.split(id)[1], 10);
                    LegendClick(pointIndex, chart, currentLegend);
                    dispatch({ type: 'TRIGGER_UPDATE' });
                    break;
                }
            }

            if (targetId.indexOf(currentLegend.legendID + LEGEND_PAGE_UP) > -1) {
                changePage(true, updateLegendTransform, updatePageText, currentLegend);
            } else if (targetId.indexOf(currentLegend.legendID + LEGEND_PAGE_DOWN) > -1) {
                changePage(false, updateLegendTransform, updatePageText, currentLegend);
            }
        };

        const unregister: () => void = registerChartEventHandler(
            'click',
            handleLegendClick,
            (layoutRef.current as Chart)?.element?.id
        );

        return unregister;
    }, [props.toggleVisibility, props]);

    if (!props.visible || phase === 'measuring' || !layoutRef.current.chartLegend || !layoutRef.current) {
        return null;
    }

    const legend: BaseLegend = layoutRef.current.chartLegend as BaseLegend;
    const chart: Chart = layoutRef.current as Chart;
    const chartTheme: ThemeStyle = chart.themeStyle;
    const { x, y, width, height } = legend.legendBounds as Required<Rect>;
    const clipRect: RectOption = legend.clipRect as Required<RectOption>;
    const pageUpOption: PathOptions = legend.pageUpOption as Required<PathOptions>;
    const pageDownOption: PathOptions = legend.pageDownOption as Required<PathOptions>;
    const pageTextOption: TextOption = legend.pageTextOption as Required<TextOption>;

    return (
        <>
            <clipPath id={`${legend.legendID}_clipPath`}>
                <rect
                    id={clipRect.id}
                    opacity={clipRect.opacity}
                    fill={clipRect.fill}
                    stroke={clipRect.stroke}
                    strokeWidth={clipRect.strokeWidth}
                    x={clipRect.x}
                    y={clipRect.y}
                    width={Math.max(clipRect.width, 0)}
                    height={Math.max(clipRect.height, 0)}
                    rx={clipRect.rx}
                    ry={clipRect.ry}
                />
            </clipPath>
            <g id={`${legend.legendID}_g`} >
                <rect
                    id={`${legend.legendID}_element`}
                    opacity={props.opacity}
                    fill={props.background}
                    stroke={props.border?.color || 'transparent'}
                    strokeWidth={props.border?.width}
                    x={x}
                    y={y}
                    height={height}
                    width={width}
                    rx="0"
                    ry="0"
                />

                {(legend.legendTitleCollections?.length as Required<number>) > 0 && (
                    <LegendTitle
                        legend={legend}
                        chart={chart}
                        props={props}
                        chartTheme={chartTheme}
                    />
                )}

                <g id={`${legend.legendID}_collections`} clipPath={`url(#${legend.legendID}_clipPath)`} ref={ref}>
                    <g
                        id={`${legend.legendID}_translate_g`}
                        transform={legend.isPaging ? 'translate(0, 0)' : ''}
                        ref={legendRef}
                    >
                        <LegendItems
                            legend={legend}
                            props={props}
                            chartTheme={chartTheme}
                        />
                    </g>
                </g>

                {legend?.isPaging && (legend?.totalPages as Required<number>) > 1 && (
                    <LegendPaging
                        legend={legend}
                        pageText={state.pageText}
                        pageUpOption={pageUpOption}
                        pageDownOption={pageDownOption}
                        pageTextOption={pageTextOption}
                        chartTheme={chartTheme}
                    />
                )}
            </g>
        </>
    );
});

interface LegendTitleProps {
    legend: BaseLegend;
    chart: Chart;
    props: PieChartLegendProps;
    chartTheme: ThemeStyle;
}

/**
 * Renders the title for the chart legend
 *
 * This component displays the legend title with proper styling and positioning.
 * It handles multiple lines of text and proper text alignment based on the chart's
 * RTL settings and legend position.
 *
 * @component
 * @param {LegendTitleProps} props - Properties for the legend title
 * @param {BaseLegend} props.legend - The legend configuration object
 * @param {Chart} props.chart - The parent chart instance
 * @param {PieChartLegendProps} props.props - The original legend props from the chart
 * @param {ThemeStyle} props.chartTheme - The theme styling for the chart
 * @returns {React.ReactElement} The rendered legend title element
 */
const LegendTitle: React.FC<LegendTitleProps> = ({
    legend,
    chart,
    props,
    chartTheme
}: LegendTitleProps): React.ReactElement => {
    const textAnchor: string = useMemo(() => {
        return getTextAnchor(
            legend.titleAlign as HorizontalAlignment,
            chart.enableRtl,
            'Top'
        );
    }, [legend, chart]);

    return (
        <text
            id={`${legend.legendID}_title`}
            x={(legend.legendTitleLoction as Required<PieChartLocationProps>).x}
            y={(legend.legendTitleLoction as Required<PieChartLocationProps>).y}
            fill={props.titleStyle?.color || chartTheme.legendTitleFont.color}
            fontSize={props.titleStyle?.fontSize || chartTheme.legendTitleFont.fontSize}
            fontStyle={props.titleStyle?.fontStyle || chartTheme.legendTitleFont.fontStyle}
            fontFamily={props.titleStyle?.fontFamily || chartTheme.legendTitleFont.fontFamily}
            fontWeight={props.titleStyle?.fontWeight || chartTheme.legendTitleFont.fontWeight}
            opacity={props.titleStyle?.opacity || props.opacity}
            textAnchor={textAnchor}
        >
            {(legend.legendTitleCollections as Required<string[]>).map((line: string, index: number) => (
                index === 0 ? (
                    line
                ) : (
                    <tspan
                        key={index}
                        x={(legend.legendTitleLoction as Required<PieChartLocationProps>).x}
                        dy="1.2em"
                    >
                        {line}
                    </tspan>
                )
            ))}
        </text>
    );
};

interface LegendPagingProps {
    legend: BaseLegend;
    pageText: string;
    pageUpOption: PathOptions;
    pageDownOption: PathOptions;
    pageTextOption: TextOption;
    chartTheme: ThemeStyle;
}

/**
 * Renders the pagination controls for the legend
 *
 * This component displays navigation arrows and page indicator when the legend
 * has multiple pages of items. It handles the visual representation of
 * the pagination controls and their active/inactive states.
 *
 * @component
 * @param {LegendPagingProps} props - Properties for the legend pagination
 * @param {BaseLegend} props.legend - The legend configuration object
 * @param {string} props.pageText - The current page indicator text (e.g., "1/3")
 * @param {PathOptions} props.pageUpOption - Configuration for the previous page arrow
 * @param {PathOptions} props.pageDownOption - Configuration for the next page arrow
 * @param {TextOption} props.pageTextOption - Configuration for the page indicator text
 * @param {ThemeStyle} props.chartTheme - The theme styling for the chart
 * @returns {React.ReactElement} The rendered pagination controls
 */
const LegendPaging: React.FC<LegendPagingProps> = ({
    legend,
    pageText,
    pageUpOption,
    pageDownOption,
    pageTextOption,
    chartTheme
}: LegendPagingProps): React.ReactElement => {
    const upRegion: Rect = legend.pagingRegions?.[0] as Rect;
    const downRegion: Rect = legend.pagingRegions?.[1] as Rect;

    const parseTranslate: (t?: string) => {
        x: number;
        y: number;
    } = (t?: string) => {
        if (!t) { return { x: 0, y: 0 }; }
        const start: number = t.indexOf('(');
        const end: number = t.indexOf(')');
        if (start === -1 || end === -1) { return { x: 0, y: 0 }; }
        const [xStr, yStr] = t.slice(start + 1, end).split(',');
        return {
            x: parseFloat(xStr) || 0,
            y: parseFloat(yStr) || 0
        };
    };
    const { x: tx, y: ty } = parseTranslate(legend.transform as string);

    return (
        <g
            id={`${legend.legendID}_navigation`}
            transform={legend.transform as string || ''}
            style={{ cursor: 'pointer', touchAction: 'manipulation' }}
        >
            {upRegion && (
                <rect
                    id={`${String(pageUpOption.id)}_hit`}
                    x={(upRegion.x as number) - 10 - tx}
                    y={(upRegion.y as number) - 10 - ty}
                    width={(upRegion.width as number) + 20}
                    height={(upRegion.height as number) + 20}
                    fill="transparent"
                    pointerEvents="all"
                    rx={4}
                    ry={4}
                />
            )}
            <path
                id={pageUpOption.id}
                opacity={pageUpOption.opacity}
                fill={pageUpOption.fill}
                stroke={pageUpOption.stroke}
                strokeWidth={pageUpOption.strokeWidth}
                d={pageUpOption.d}
            />
            <text
                id={pageTextOption.id}
                x={pageTextOption.x}
                y={pageTextOption.y}
                fill={pageTextOption.fill || chartTheme.legendLabelFont.color}
                fontSize={pageTextOption.fontSize}
                fontStyle={pageTextOption.fontStyle || chartTheme.legendLabelFont.fontStyle}
                fontFamily={pageTextOption.fontFamily || chartTheme.legendLabelFont.fontFamily}
                fontWeight={pageTextOption.fontWeight || chartTheme.legendLabelFont.fontWeight}
                textAnchor={pageTextOption.anchor}
                pointerEvents="none"
            >
                {pageText}
            </text>
            {downRegion && (
                <rect
                    id={`${String(pageDownOption.id)}_hit`}
                    x={(downRegion.x as number) - 10 - tx}
                    y={(downRegion.y as number) - 10 - ty}
                    width={(downRegion.width as number) + 20}
                    height={(downRegion.height as number) + 20}
                    fill="transparent"
                    pointerEvents="all"
                    rx={4}
                    ry={4}
                />
            )}
            <path
                id={pageDownOption.id}
                opacity={pageDownOption.opacity}
                fill={pageDownOption.fill}
                stroke={pageDownOption.stroke}
                strokeWidth={pageDownOption.strokeWidth}
                d={pageDownOption.d}
            />
        </g>
    );
};

interface LegendItemProps {
    index: number;
    legend: BaseLegend;
    legendItem: LegendOptions;
    props: PieChartLegendProps;
    chartTheme: ThemeStyle;
}

/**
 * Renders an individual legend item with shape and text
 *
 * This component displays a single legend entry consisting of a shape/symbol
 * and corresponding text label. It handles accessibility attributes,
 * styling, and optional markers for specific series types.
 *
 * @component
 * @param {LegendItemProps} props - Properties for the legend item
 * @param {number} props.index - The index of this item in the legend collection
 * @param {BaseLegend} props.legend - The legend configuration object
 * @param {LegendOptions} props.legendItem - The specific item's configuration
 * @param {PieChartLegendProps} props.props - The original legend props from the chart
 * @param {ThemeStyle} props.chartTheme - The theme styling for the chart
 * @returns {React.ReactElement} The rendered legend item
 */
const LegendItem: React.FC<LegendItemProps> = ({
    index,
    legend,
    legendItem,
    props,
    chartTheme
}: LegendItemProps): React.ReactElement => {
    const legendShape: Required<PathOptions> = legendItem.symbolOption as Required<PathOptions>;
    const textOption: Required<TextOption> = legendItem.textOption as Required<TextOption>;

    return (
        <g
            id={`${legend.legendID}_g_${index}`}
            role={(legend.accessibility as Required<PieChartAccessibilityProps>).role || 'button'}
            aria-pressed={legendItem.visible ? 'true' : 'false'}
            aria-label={(legend.accessibility as Required<PieChartAccessibilityProps>).ariaLabel ||
            `${legendItem.text} series is ${legendItem.visible ? 'showing, press enter to hide the ' : 'hidden, press enter to show the '} ${legendItem.text} series`}
            style={{
                outline: 'none',
                cursor: !legend.toggleVisibility ? 'auto' : 'pointer'
            }}
            tabIndex={(index === 0 && legend.accessibility && legend.accessibility.focusable) ?
                legend.accessibility.tabIndex : -1}
        >
            {legendItem.shape === 'Circle' ? (
                <ellipse
                    id={legendShape.id}
                    opacity={props.opacity}
                    fill={legendShape.fill}
                    stroke={legendShape.stroke}
                    strokeWidth={legendShape.strokeWidth}
                    cx={legendShape.cx}
                    cy={legendShape.cy}
                    rx={legendShape.rx}
                    ry={legendShape.ry}
                />
            ) : (
                <path
                    id={legendShape.id}
                    opacity={props.opacity}
                    fill={legendShape.fill}
                    stroke={legendShape.stroke}
                    strokeWidth={legendShape.strokeWidth}
                    d={legendShape.d}
                />
            )}
            {legendItem.type === 'Doughnut' && legendItem.markerOption && (
                <ellipse
                    id={legendItem.markerOption.id}
                    opacity={props.opacity}
                    fill='#FFFFFF'
                    stroke='#FFFFFF'
                    strokeWidth={legendItem.markerOption.strokeWidth}
                    cx={legendItem.markerOption.cx}
                    cy={legendItem.markerOption.cy}
                    rx={legendItem.markerOption.rx}
                    ry={legendItem.markerOption.ry}
                />
            )}

            <text
                id={textOption.id}
                x={textOption.x}
                y={textOption.y}
                fontSize={props.textStyle?.fontSize || chartTheme.legendLabelFont.fontSize}
                fontFamily={props.textStyle?.fontFamily || chartTheme.legendLabelFont.fontFamily}
                fill={textOption.fill}
                fontStyle={props.textStyle?.fontStyle || chartTheme.legendLabelFont.fontStyle}
                fontWeight={props.textStyle?.fontWeight || chartTheme.legendLabelFont.fontWeight}
                opacity={props.textStyle?.opacity as Required<number>}
                textAnchor={textOption.anchor}
            >
                {(Array.isArray(textOption.text) ? textOption.text : [textOption.text]).map((line: string, index: number) =>
                    index === 0 ? (
                        line
                    ) : (
                        <tspan key={index} x={textOption.x} dy="1.2em">
                            {line}
                        </tspan>
                    )
                )}
            </text>
        </g>
    );
};

interface LegendItemsProps {
    legend: BaseLegend;
    props: PieChartLegendProps;
    chartTheme: ThemeStyle;
}

/**
 * Renders all legend items as a collection
 *
 * This component serves as a container for all the individual legend items,
 * mapping through the legend collection and rendering each item component.
 *
 * @component
 * @param {LegendItemsProps} props - Properties for the legend items collection
 * @param {BaseLegend} props.legend - The legend configuration object
 * @param {PieChartLegendProps} props.props - The original legend props from the chart
 * @param {ThemeStyle} props.chartTheme - The theme styling for the chart
 * @returns {React.ReactElement | null} The rendered collection of legend items or null if no items exist
 */
const LegendItems: React.FC<LegendItemsProps> = ({
    legend,
    props,
    chartTheme
}: LegendItemsProps): React.ReactElement | null => {
    if (!legend.legendCollections) {
        return null;
    }

    return (
        <>
            {legend.legendCollections.map((chartLegend: LegendOptions, i: number) => (
                <LegendItem
                    key={i}
                    index={i}
                    legend={legend}
                    legendItem={chartLegend}
                    props={props}
                    chartTheme={chartTheme}
                />
            ))}
        </>
    );
};
