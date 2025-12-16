import { extend, HorizontalAlignment, VerticalAlignment } from '@syncfusion/react-base';
import { ChartBorderProps,  ChartLegendProps, ChartFontProps, LegendClickEvent, ChartLocationProps } from '../../base/interfaces';
import { ChartSeriesType, LegendShape } from '../../base/enum';
import { BaseLegend, createLegendOption, createPathOption, createRectOption, RectOption } from '../../base/Legend-base';
import { LegendOptions } from '../../base/Legend-base';
import { calculateLegendShapes, calculateShapes, getTitle, measureText, stringToNumber, titlePositionX, useTextTrim, useTextWrap } from '../../utils/helper';
import { subtractThickness } from '../AxesRenderer/CartesianLayoutRender';
import { AxisTextStyle } from '../../chart-axis/base';
import { useRegisterAxisRender, useRegisterSeriesRender } from '../../hooks/useClipRect';
import { AxisModel, Chart, PathOptions, Rect, SeriesProperties, ChartSizeProps, TextOption, TextStyleModel } from '../../chart-area/chart-interfaces';
import { LegendPosition, TextOverflow } from '../../../common';

// === LEGEND INITIALIZATION & CONFIGURATION ===

/**
 * Retrieves the legend options based on the visible series collection and chart.
 *
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {SeriesProperties[]} visibleSeriesCollection - The collection of visible series.
 * @param {Chart} chart - The chart object.
 * @returns {BaseLegend} An object containing the configuration for the legend, tailored to the provided series and chart settings.
 * @private
 */
export function getLegendOptions(chartLegend: ChartLegendProps, visibleSeriesCollection: SeriesProperties[], chart: Chart): BaseLegend {
    const legend: BaseLegend = extend({}, chartLegend) as BaseLegend;

    legend.maxItemHeight = 0;
    legend.rowHeights = [];
    legend.pageHeights = [];
    legend.columnHeights = [];
    legend.legendCollections = [];
    legend.legendTitleCollections = [];
    legend.itemPadding = 0;
    legend.isRtlEnable = false;
    legend.isReverse = false;
    legend.isVertical = false;
    legend.isPaging = false;
    legend.clipPathHeight = 0;
    legend.totalPages = 0;
    legend.fivePixel = 5;
    legend.rowCount = 0;
    legend.pageButtonSize = 8;
    legend.pageXCollections = [];
    legend.maxColumns = 0;
    legend.maxWidth = 0;
    legend.legendID = chart.element.id + '_chart_legend';
    legend.currentPage = 1;
    legend.backwardArrowOpacity = 0;
    legend.forwardArrowOpacity = 1;
    legend.accessbilityText = '';
    legend.arrowWidth = 26; // 2 * (5 + 8 + 5)
    legend.arrowHeight = 26;
    legend.chartRowCount = 1;
    legend.legendTitleSize = { height: 0, width: 0 };
    legend.isTop = false;
    legend.isTitle = false;
    legend.clearTooltip = 0;
    legend.currentPageNumber = 1;
    legend.legendRegions = [];
    legend.pagingRegions = [];
    legend.totalNoOfPages = 0;
    legend.legendTranslate = '';

    let seriesType: ChartSeriesType;
    let fill: string;
    let dashArray: string;
    legend.isRtlEnable = chart.enableRtl;
    legend.isReverse = !legend.isRtlEnable && chartLegend.reverse;
    for (const series of visibleSeriesCollection) {
        if (series.name !== '') {
            seriesType = series.type as Required<ChartSeriesType>;
            dashArray = series.dashArray as Required<string>;
            fill = series.interior as Required<string>;
            legend.legendCollections.push(createLegendOption(
                series.name as Required<string>, fill, series.legendShape as Required<LegendShape>,
                series.visible as Required<boolean>, seriesType, series.legendImageUrl ? series.legendImageUrl : '',
                series.marker?.shape,
                series.marker?.visible, undefined, undefined, dashArray
            ));
        }
    }
    if (legend.reverse) {
        legend.legendCollections.reverse();
    }
    return legend;
}

/**
 * Calculate the bounds for the legends.
 *
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {Rect} rect - The rectangle defining the legend area.
 * @param {ChartSizeProps} availableSize - The available size for rendering.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @param {Rect} [previousLegendBounds] - The previous legend bounds, if available.
 * @param {boolean} [pointAnimation] - Indicates if point animation is enabled.
 * @returns {void} This function does not return a value.
 * @private
 */
export function calculateLegendBound(
    chartLegend: ChartLegendProps,
    rect: Rect,
    availableSize: ChartSizeProps,
    chart: Chart,
    legend: BaseLegend,
    previousLegendBounds?: Rect,
    pointAnimation?: boolean
): void {
    const defaultValue: string = '20%';
    legend.legendBounds = { x: rect.x, y: rect.y, width: 0, height: 0 };
    legend.isVertical = (legend.position === 'Left' || legend.position === 'Right');
    legend.itemPadding = chartLegend.itemPadding ? chartLegend.itemPadding : legend.isVertical ? 8 : 20;
    if (legend.isVertical) {
        legend.legendBounds.height = stringToNumber(
            legend.height, availableSize.height - (rect.y - chart.margin.top)) || rect.height;
        legend.legendBounds.width = stringToNumber(legend.width || defaultValue, availableSize.width);
    } else {
        legend.legendBounds.width = stringToNumber(legend.width, availableSize.width) || rect.width;
        legend.legendBounds.height = stringToNumber(legend.height || defaultValue, availableSize.height);
    }
    getLegendBounds(availableSize, legend.legendBounds, chartLegend, chart, legend);
    legend.legendBounds.width += (chartLegend.containerPadding?.left as Required<number> +
        (chartLegend.containerPadding?.right as Required<number>));
    legend.legendBounds.height += (chartLegend.containerPadding?.top as Required<number> +
        (chartLegend.containerPadding?.bottom as Required<number>));
    if (legend.legendBounds.height > 0 && legend.legendBounds.width > 0) {
        getLocation(legend.position as Required<LegendPosition>, legend.align as Required<HorizontalAlignment | VerticalAlignment>,
                    legend.legendBounds, rect, availableSize, chart, legend, previousLegendBounds, pointAnimation);
    }
}

// === LAYOUT CALCULATION & POSITIONING ===

/**
 * Calculates the rendering point for the legend item based on various parameters.
 *
 * @param {ChartSizeProps} availableSize - The available size for rendering.
 * @param {Rect} legendBounds - The bounds within which the legend is to be positioned.
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function getLegendBounds(
    availableSize: ChartSizeProps,
    legendBounds: Rect,
    chartLegend: ChartLegendProps,
    chart: Chart,
    legend: BaseLegend
): void {
    calculateLegendTitle(chartLegend, legendBounds, chart, legend);
    legend.isTitle = chartLegend.title ? true : false;
    legend.chartRowCount = 1;
    legend.rowHeights = [];
    legend.columnHeights = [];
    legend.pageHeights = [];
    const padding: number = chartLegend.padding as Required<number>;
    let extraHeight: number = 0;
    let legendOption: LegendOptions;
    let extraWidth: number = 0;
    const arrowWidth: number = legend.arrowWidth as Required<number>;
    const arrowHeight: number = legend.arrowHeight as Required<number>;
    const verticalArrowSpace: number = legend.isVertical && !chartLegend.enablePages ? arrowHeight : 0;
    const titleSpace: number = legend.isTitle ? legend.legendTitleSize?.height as Required<number> +
    (legend.fivePixel as Required<number>) : 0;
    if (!legend.isVertical) {
        extraHeight = !chartLegend.height ? ((availableSize.height / 100) * 5) : 0;
    } else {
        extraWidth = !chartLegend.width ? ((availableSize.width / 100) * 5) : 0;
    }
    legendBounds.height += extraHeight;
    legendBounds.width += extraWidth;
    let shapeWidth: number = (legend.shapeWidth || 10) as Required<number>;
    let shapePadding: number = legend.shapePadding as Required<number>;
    let maximumWidth: number = 0;
    let rowWidth: number = 0;
    let legendWidth: number = 0;
    let columnHeight: number = 0;
    let columnCount: number = 0;
    let rowCount: number = 0;
    let titlePlusArrowSpace: number = 0;
    let render: boolean = false;
    const textStyle: TextStyleModel = chartLegend.textStyle as Required<TextStyleModel>;
    legend.maxItemHeight = Math.max(measureText('MeasureText', textStyle, chart.themeStyle.legendLabelFont).height, (chartLegend.shapeHeight || 10) as Required<number>);
    if (chartLegend.fixedWidth) {
        for (let i: number = 0; legend.legendCollections && i < legend.legendCollections.length; i++) {
            const textWidth: number = shapeWidth + shapePadding + (!(legend.isVertical as Required<boolean>) ? (i === 0) ? padding :
                (legend.itemPadding as Required<number>) : padding) + (chartLegend.maxLabelWidth ?
                chartLegend.maxLabelWidth :
                measureText(legend.legendCollections[i as number].text, (chartLegend.textStyle as Required<ChartFontProps>),
                            chart.themeStyle.legendLabelFont).width);
            legend.maxWidth = Math.max(legend.maxWidth as Required<number>, textWidth);
        }
    }
    for (let i: number = 0; legend.legendCollections && i < legend.legendCollections.length; i++) {
        legendOption = legend.legendCollections[i as number];
        legendOption.textSize = measureText(legendOption.text, legend.textStyle as Required<ChartFontProps>,
                                            chart.themeStyle.legendLabelFont);
        shapeWidth = legendOption.text ? (chartLegend.shapeWidth || 10) as Required<number> : 0;
        shapePadding = legendOption.text ? chartLegend.shapePadding as Required<number> : 0;
        if (legendOption.render && legendOption.text) {
            render = true;
            const textWidth: number = chartLegend.maxLabelWidth || legendOption.textSize.width;
            let paddingValue: number = padding;
            const isHorizontalLayout: boolean = !legend.isVertical;

            if (isHorizontalLayout) {
                const isFirstItem: boolean = i === 0;

                if (!isFirstItem) {
                    paddingValue = legend.itemPadding as Required<number>;
                }
            }

            legendWidth = chartLegend.fixedWidth ?
                legend.maxWidth as Required<number> :
                shapeWidth + shapePadding + textWidth + paddingValue;

            rowWidth = rowWidth + legendWidth;
            if (!chartLegend.enablePages && !legend.isVertical) {
                titlePlusArrowSpace = 0;
                titlePlusArrowSpace += arrowWidth;
            }
            getLegendHeight(legendOption, chartLegend, legendBounds, rowWidth, legend.maxItemHeight, padding, chart);
            if (legendBounds.width < (rowWidth + titlePlusArrowSpace) || (legend.isVertical)) {
                maximumWidth = Math.max(maximumWidth, (rowWidth + padding + titlePlusArrowSpace - (legend.isVertical ? 0 : legendWidth)));
                if (rowCount === 0 && (legendWidth !== rowWidth)) {
                    rowCount = 1;
                }
                rowWidth = legend.isVertical ? 0 : legendWidth;
                rowCount++;
                columnCount = 0;
                columnHeight = verticalArrowSpace;
            }
            const len: number = (rowCount > 0 ? (rowCount - 1) : 0);
            legend.rowHeights[len as number] = Math.max((legend.rowHeights[len as number] ? legend.rowHeights[len as number] : 0)
                , Math.max(legendOption.textSize.height, (chartLegend.shapeHeight || 10) as Required<number>));
            legend.columnHeights[columnCount as number] = (legend.columnHeights[columnCount as number] ?
                legend.columnHeights[columnCount as number] : 0) + (((legend.isVertical as Required<boolean>) || (rowCount > 0 &&
                    chartLegend.itemPadding)) ? (i === 0) ? padding : legend.itemPadding as Required<number> : padding) +
                Math.max(legendOption.textSize.height, (chartLegend.shapeHeight || 10) as Required<number>);
            columnCount++;
        }
    }
    columnHeight = Math.max.apply(null, legend.columnHeights) + padding + titleSpace;
    columnHeight = Math.max(columnHeight, (legend.maxItemHeight + padding) + padding + titleSpace);
    legend.isPaging = (legendBounds.height < columnHeight);
    if (legend.isPaging && !chartLegend.enablePages) {
        if (!legend.isVertical) {
            columnHeight = (legend.maxItemHeight + padding) + padding + titleSpace;
        }
    }
    legend.totalPages = rowCount;
    if (render) {
        setBounds(Math.max((rowWidth + padding), maximumWidth), columnHeight, chartLegend, legendBounds, legend);
    } else {
        setBounds(0, 0, chartLegend, legendBounds, legend);
    }
}
// === TITLE HANDLING ===

/**
 * Calculates the legend title text width and height.
 *
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {Rect} legendBounds - The bounding rectangle for the legend.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function calculateLegendTitle(
    chartLegend: ChartLegendProps,
    legendBounds: Rect,
    chart: Chart,
    legend: BaseLegend
): void {
    if (chartLegend.title) {
        legend.isTop = true;
        const padding: number = (chartLegend).titleOverflow === 'Trim' ? 2 * (chartLegend.padding as Required<number>) : 0;
        if (legend.isTop || legend.isVertical) {
            legend.legendTitleCollections = getTitle(chartLegend.title, (chartLegend.titleStyle as Required<ChartFontProps>), (
                legendBounds.width - padding), chart.enableRtl, chart.themeStyle.legendTitleFont,
                                                     chartLegend.titleOverflow as Required<TextOverflow>);
        } else {
            (legend.legendTitleCollections as Required<string[]>)[0] =
                useTextTrim(chartLegend.maxTitleWidth as Required<number>, chartLegend.title,
                            chartLegend.titleStyle as Required<ChartFontProps>, chart.enableRtl, chart.themeStyle.legendTitleFont);
        }
        const text: string = legend.isTop ? chartLegend.title : (legend.legendTitleCollections as Required<string[]>)[0];
        legend.legendTitleSize = measureText(text, (chartLegend.titleStyle as Required<ChartFontProps>),
                                             chart.themeStyle.legendTitleFont);
        ((legend.legendTitleSize as Required<ChartSizeProps>).height as Required<number>) *=
            (legend.legendTitleCollections as Required<string[]>).length;
    } else {
        legend.legendTitleSize = { width: 0, height: 0 };
    }
}

/**
 * Calculates the total height of the legend (including paddings, title, and items).
 *
 * @param {LegendOptions} legendOption - Options for the legend configuration.
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {Rect} legendBounds - The bounding rectangle for the legend.
 * @param {number} rowWidth - The width of a row in the legend.
 * @param {number} legendHeight - The current height of the legend.
 * @param {number} padding - The padding applied to the legend layout.
 * @param {Chart} chart - The chart object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function getLegendHeight(
    legendOption: LegendOptions,
    chartLegend: ChartLegendProps,
    legendBounds: Rect,
    rowWidth: number,
    legendHeight: number,
    padding: number,
    chart: Chart
): void {
    const legendWidth: number = legendOption.textSize.width;
    const textPadding: number = chartLegend.shapePadding as Required<number> + (padding * 2) +
        ((chartLegend.shapeWidth || 10) as Required<number>);
    if (legendWidth > (chartLegend.maxLabelWidth as Required<number>) || legendWidth + rowWidth > legendBounds.width) {
        legendOption.textCollection = useTextWrap(
            legendOption.text,
            (chartLegend.maxLabelWidth ? Math.min(chartLegend.maxLabelWidth, (legendBounds.width - textPadding)) :
                (legendBounds.width - textPadding)), chartLegend.textStyle as Required<ChartFontProps>, chart.enableRtl,
            chart.themeStyle.legendLabelFont
        );
    } else {
        (legendOption.textCollection as Required<string[]>).push(legendOption.text);
    }
    legendOption.textSize.height = (legendHeight * (legendOption.textCollection?.length as Required<number>));
}

/**
 * To set bounds for chart.
 *
 * @param {number} computedWidth - The computed width of the legend.
 * @param {number} computedHeight - The computed height of the legend.
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {Rect} legendBounds - The bounding rectangle for the legend.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void}
 * @private
 */
export function setBounds(
    computedWidth: number,
    computedHeight: number,
    chartLegend: ChartLegendProps,
    legendBounds: Rect,
    legend: BaseLegend
): void {
    let titleHeight: number = chartLegend.title && legend.legendTitleSize && legend.legendTitleSize.height ?
        legend.legendTitleSize.height + (legend.fivePixel as Required<number>) : 0;
    if (legend.isVertical && legend.isPaging && !chartLegend.enablePages) {
        titleHeight = chartLegend.title ? (legend.legendTitleSize?.height as Required<number>) + (legend.fivePixel as Required<number>) : 0;
        titleHeight += ((legend.pageButtonSize as Required<number>) + (legend.fivePixel as Required<number>));
    }
    computedWidth = Math.min(computedWidth, legendBounds.width);
    computedHeight = Math.min(computedHeight, legendBounds.height);
    legendBounds.width = !chartLegend.width ? computedWidth : legendBounds.width;
    legendBounds.height = !chartLegend.height ? computedHeight : legendBounds.height;
    if (legend.isTop && chartLegend.titleOverflow !== 'None') {
        calculateLegendTitle(chartLegend, legendBounds, legend.chart as Chart, legend);
        legendBounds.height += chartLegend.titleOverflow === 'Wrap' && (legend.legendTitleCollections as Required<string[]>).length > 1 ? ((legend.legendTitleSize?.height as Required<number>) - ((legend.legendTitleSize?.height as Required<number>)
            / (legend.legendTitleCollections as Required<string[]>).length)) : 0;
    }
    legend.rowCount = Math.max(1, Math.ceil((legendBounds.height - (chartLegend.padding as Required<number>) - titleHeight) /
        ((legend.maxItemHeight as Required<number>) + (chartLegend.padding as Required<number>))));
}

/**
 * Determines the location of the legend based on its position and alignment.
 *
 * @param {LegendPosition} position - Position of the legend.
 * @param {HorizontalAlignment} alignment - Alignment of the legend.
 * @param {Rect} legendBounds - The bounding rectangle of the legend.
 * @param {Rect} rect - The main chart area rectangle.
 * @param {ChartSizeProps} availableSize - The available size for the legend.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @param {Rect} [previousLegendBounds] - The previous bounding rectangle of the legend.
 * @param {boolean} [pointAnimation] - Whether point animation is enabled.
 * @returns {void} Does not return a value.
 * @private
 */
export function getLocation(
    position: LegendPosition,
    alignment: HorizontalAlignment | VerticalAlignment,
    legendBounds: Rect,
    rect: Rect,
    availableSize: ChartSizeProps,
    chart: Chart,
    legend: BaseLegend,
    previousLegendBounds?: Rect,
    pointAnimation?: boolean
): void {
    const padding: number = legend.border?.width as Required<number>;
    const marginBottom: number = chart.margin.bottom;
    const legendPadding: number = legend.padding as Required<number> + 10;
    let legendAlignment: HorizontalAlignment;
    let legendHeight: number = legendBounds.height + padding +
            (legend.margin?.top as Required<number>) + (legend.margin?.bottom as Required<number>);
    const legendWidth: number = legendBounds.width + padding +
            (legend.margin?.left as Required<number>) + (legend.margin?.right as Required<number>);
    if (position === 'Bottom' || position === 'Auto') {
        legendAlignment = alignment === 'Left' || alignment === 'Right' ? alignment : 'Center';
        legendBounds.x = alignLegend(legendBounds.x, availableSize.width, legendBounds.width, legendAlignment);
        legendBounds.y = rect.y + (rect.height - legendHeight) + (padding as Required<number>) +
                (legend.margin?.top as Required<number>);
        if ((!pointAnimation || (legendBounds.height !== previousLegendBounds?.height))) {
            subtractThickness(rect, { left: 0, right: 0, top: 0, bottom: legendHeight + legendPadding });
        }
    } else if (position === 'Top') {
        legendAlignment = alignment === 'Left' || alignment === 'Right' ? alignment : 'Center';
        const axisTextSize: ChartSizeProps = measureText('100', chart.axisCollection[1].labelStyle as Required<AxisTextStyle>, chart.themeStyle.legendLabelFont);
        legendBounds.x = alignLegend(legendBounds.x, availableSize.width, legendBounds.width, legendAlignment);
        legendBounds.y = rect.y + (padding as Required<number>) + (legend.margin?.top as Required<number>);
        legendHeight -= -padding * 2 - axisTextSize.height / 2;
        if (!pointAnimation || (legendBounds.height !== previousLegendBounds?.height)) {
            subtractThickness(rect, { left: 0, right: 0, top: legendHeight + (legend.padding as Required<number>), bottom: 0 });
        }
    } else if (position === 'Right') {
        legendAlignment = alignment === 'Top' ? 'Left' : alignment === 'Bottom' ? 'Right' : 'Center';
        legendBounds.x = rect.x + (rect.width - legendBounds.width) - (legend.margin?.right as Required<number>);
        legendBounds.y = rect.y + alignLegend(0, availableSize.height - (rect.y + marginBottom),
                                              legendBounds.height, legendAlignment);
        if (!pointAnimation || (legendBounds.width !== previousLegendBounds?.width)) {
            subtractThickness(rect, { left: 0, right: legendWidth + legendPadding, top: 0, bottom: 0 });
        }

    } else if (position === 'Left') {
        legendAlignment = alignment === 'Top' ? 'Left' : alignment === 'Bottom' ? 'Right' : 'Center';
        legendBounds.x = legendBounds.x + (legend.margin?.left as Required<number>);
        legendBounds.y = rect.y + alignLegend(0, availableSize.height - (rect.y + marginBottom),
                                              legendBounds.height, legendAlignment);
        if (!pointAnimation || (legendBounds.width !== previousLegendBounds?.width)) {
            subtractThickness(rect, { left: legendWidth + legendPadding, right: 0, top: 0, bottom: 0 });
        }
    } else {
        legendBounds.x = legend.location?.x as Required<number>;
        legendBounds.y = legend.location?.y as Required<number>;
        subtractThickness(rect, { left: 0, right: 0, top: 0, bottom: 0 });
    }
}

/**
 * To find legend alignment for chart.
 *
 * @param {number} start - The starting position for alignment.
 * @param {number} size - The size of the available space for the legend.
 * @param {number} legendSize - The size of the legend.
 * @param {HorizontalAlignment} alignment - The desired alignment (e.g., start, center, end).
 * @returns {number} The calculated position for aligning the legend within the chart.
 * @private
 */
export function alignLegend(start: number, size: number, legendSize: number, alignment: HorizontalAlignment): number {
    switch (alignment) {
    case 'Right':
        start = (size - legendSize) - start;
        break;
    case 'Center':
        start = ((size - legendSize) / 2);
        break;
    }
    return start;
}

// === RENDERING FUNCTIONS ===

/**
 * Renders the legend.
 *
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {Rect} legendBounds - The bounding rectangle for the legend.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function renderLegend(chartLegend: ChartLegendProps, legendBounds: Rect, chart: Chart, legend: BaseLegend): void {
    let titleHeight: number = 0; let titlePlusArrowWidth: number = 0;
    let pagingLegendBounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
    let requireLegendBounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
    const firstLegend: number = findFirstLegendPosition(legend.legendCollections as Required<LegendOptions[]>);
    const padding: number = chartLegend.padding as Required<number>;
    const isPaging: boolean = chartLegend.enablePages as Required<boolean>;
    const upArrowHeight: number = legend.isPaging && !chartLegend.enablePages && legend.isVertical ?
        legend.pageButtonSize as Required<number> : 0;
    createLegendElements(legendBounds, legend, legend.legendID as Required<string>);
    legend.legendRegions = [];
    legend.chartRowCount = 1;
    let maxHeight: number = 0;
    titleHeight = !legend.isTitle ? 0 : (legend.isTop || legend.isVertical ? legend.legendTitleSize?.height as Required<number>
        : 0);

    let pageCount: number = 1;
    let rowHeights: number = (((legend.isVertical) || ((legend.rowHeights?.length as Required<number>) > 1 &&
        (chartLegend.itemPadding))) ? legend.itemPadding as Required<number> : padding) +
        (legend.rowHeights as Required<number[]>)[0];
    for (let i: number = 1; legend.rowHeights && i < legend.rowHeights.length; i++) {
        if ((rowHeights + legend.rowHeights[i as number] + (((legend.isVertical || (legend.rowHeights.length > 1)) &&
            chartLegend.itemPadding) ? legend.itemPadding as Required<number> : padding))
            > ((legend.legendBounds?.height as Required<number>) - (legend.pageButtonSize as Required<number>) -
                (legend.maxItemHeight as Required<number>) / 2) - (chartLegend.containerPadding?.top as Required<number>) -
            (chartLegend.containerPadding?.bottom as Required<number>)) {
            (legend.pageHeights as Required<number[]>)[pageCount - 1] = rowHeights + titleHeight;
            pageCount++;
            rowHeights = 0;
        }
        rowHeights += (legend.rowHeights[i as number] + ((legend.isVertical || (legend.rowHeights.length > 1 &&
            chartLegend.itemPadding)) ? legend.itemPadding as Required<number> : padding));
    }
    (legend.pageHeights as Required<number[]>)[pageCount - 1] = rowHeights + titleHeight;
    legend.totalPages = pageCount;

    for (let i: number = 0; legend.legendCollections && i < legend.legendCollections.length; i++) {
        maxHeight = Math.max(legend.legendCollections[i as number].textSize.height, maxHeight);
        break;
    }
    if (!isPaging && legend.isPaging && !legend.isVertical) {
        titlePlusArrowWidth = 0;
        titlePlusArrowWidth += ((legend.pageButtonSize as Required<number>) + (2 * (legend.fivePixel as Required<number>)));
    } else if (legend.isTitle && !legend.isVertical) {
        titlePlusArrowWidth = 0;
    }
    if (legend.legendCollections && firstLegend !== legend.legendCollections.length) {
        let count: number = 0;
        let previousLegend: LegendOptions = legend.legendCollections[firstLegend as number];
        const startPadding: number = titlePlusArrowWidth + padding +
            (((chartLegend.shapeWidth || 10) as Required<number>) / 2) + (chartLegend.containerPadding?.left as Required<number>);
        const xLocation: number = (!legend.isRtlEnable) ? legendBounds.x + startPadding : legendBounds.x +
            (legendBounds.width) - startPadding;
        const start: ChartLocationProps = {
            x: xLocation, y: legendBounds.y + titleHeight + upArrowHeight + padding +
                ((legend.maxItemHeight as Required<number>) / 2) + (legend.containerPadding?.top as Required<number>)
        };
        const anchor: string = (chart as Chart).isRtlEnabled || (chart as Chart).enableRtl ? 'end' : 'start';
        const textOptions: TextOption = {
            id: '',
            x: start.x,
            y: start.y,
            anchor: anchor,
            text: '',
            labelRotation: 0,
            fontFamily: '',
            fontWeight: '',
            fontSize: '',
            fontStyle: '',
            opacity: 0,
            fill: '',
            baseLine: ''
        };
        const textPadding: number = chartLegend.shapePadding as Required<number> + (legend.itemPadding as Required<number>) +
            ((chartLegend.shapeWidth || 10) as Required<number>);
        legend.pageXCollections = [];
        legend.legendCollections[firstLegend as number].location = start;
        let legendIndex: number;
        if (!chartLegend.enablePages && legend.isPaging) {
            const x: number = start.x - (legend.fivePixel as Required<number>);
            const y: number = start.y - (legend.fivePixel as Required<number>);
            const leftSpace: number = 0;
            const bottomSapce: number = legend.isVertical ? (legend.pageButtonSize as Required<number>) +
                Math.abs(y - legendBounds.y) : 0;
            let rightSpace: number = 0;
            rightSpace += legend.isVertical ? 0 : ((legend.fivePixel as Required<number>) +
                (legend.pageButtonSize as Required<number>) + (legend.fivePixel as Required<number>));
            pagingLegendBounds = {
                x: x, y: y, width: legendBounds.width - rightSpace - leftSpace, height:
                    legendBounds.height - bottomSapce
            };
            requireLegendBounds = pagingLegendBounds;
        } else {
            requireLegendBounds = legendBounds;
        }
        let legendOption: LegendOptions;

        for (let i: number = 0; i < legend.legendCollections.length; i++) {
            const legendTextOption: TextOption = {
                id: '',
                x: start.x,
                y: start.y,
                anchor: anchor,
                text: '',
                labelRotation: 0,
                fontFamily: '',
                fontWeight: '',
                fontSize: '',
                fontStyle: '',
                opacity: 0,
                fill: '',
                baseLine: ''
            };
            legendOption = legend.legendCollections[i as number];
            legendIndex = !legend.isReverse ? count : (legend.legendCollections.length - 1) - count;
            legend.accessbilityText = 'Click to show or hide the ' + legendOption.text + ' series';
            getRenderPoint(chartLegend, legendOption, start, textPadding, previousLegend, requireLegendBounds, count,
                           firstLegend, legend);
            renderSymbol(chartLegend, legendOption, legendIndex, chart, legend);
            renderText(chartLegend, legendOption, legendTextOption, legendIndex, chart, legend);
            previousLegend = legendOption;
            count++;
        }
        legend.totalPages = (legend.isPaging && !chartLegend.enablePages && !legend.isVertical &&
            legend.totalPages > legend.chartRowCount) ? legend.chartRowCount : legend.totalPages;
        legend.currentPage = (legend.currentPage as Required<number>) > 1 &&
            (legend.currentPage as Required<number>) > legend.totalPages ? legend.totalPages : legend.currentPage;
        if (legend.isPaging && legend.totalPages > 1) {
            renderPagingElements(chartLegend, legendBounds, textOptions, chart, legend);
        } else {
            legend.totalPages = 1;
        }
    }
}

/**
 * Calculates the rendering point for the legend item based on various parameters.
 *
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {LegendOptions} legendOption - The legend option to be rendered.
 * @param {ChartLocationProps} start - The starting location for the legend item.
 * @param {number} textPadding - The padding between legend text and shapes.
 * @param {LegendOptions} previousLegend - The previously rendered legend option.
 * @param {Rect} rect - The rectangle defining the rendering bounds.
 * @param {number} count - The current legend item count.
 * @param {number} firstLegend - The index of the first visible legend item.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function getRenderPoint(
    chartLegend: ChartLegendProps,
    legendOption: LegendOptions,
    start: ChartLocationProps,
    textPadding: number,
    previousLegend: LegendOptions,
    rect: Rect,
    count: number,
    firstLegend: number,
    legend: BaseLegend
): void {
    const padding: number = chartLegend.padding as Required<number>;
    const textWidth: number = chartLegend.fixedWidth ? legend.maxWidth as Required<number> : textPadding +
            (chartLegend.maxLabelWidth ? chartLegend.maxLabelWidth as Required<number> : previousLegend.textSize.width);
    const rightSpace: number = 0;
    const previousBound: number = previousLegend.location.x + ((!legend.isRtlEnable) ? textWidth : -textWidth);
    if (isWithinBounds(previousBound + rightSpace, (chartLegend.maxLabelWidth ?
        chartLegend.maxLabelWidth : legendOption.textSize.width) + textPadding - (legend.itemPadding as Required<number>), rect, legend)
         || (legend.isVertical)) {
        legendOption.location.x = start.x;
        if (count !== firstLegend) {
            (legend.chartRowCount as Required<number>)++;
        }
        legendOption.location.y = (count === firstLegend) ? previousLegend.location.y : previousLegend.location.y +
            (legend.isVertical ? Math.max(previousLegend.textSize.height, (chartLegend.shapeHeight || 10) as Required<number>) :
                (legend.rowHeights as Required<number[]>)[(legend.chartRowCount as Required<number> - 2)]) +
                ((legend.isVertical || ((legend.chartRowCount as Required<number>) > 1
                    && chartLegend.itemPadding)) ? legend.itemPadding as Required<number> : padding);
    } else {
        legendOption.location.x = (count === firstLegend) ? previousLegend.location.x : previousBound;
        legendOption.location.y = previousLegend.location.y;
    }
    let availwidth: number = (!legend.isRtlEnable) ? (legend.legendBounds?.x as Required<number> +
            (legend.legendBounds?.width as Required<number>)) -
            (legendOption.location.x + textPadding - (legend.itemPadding as Required<number>) -
                ((chartLegend.shapeWidth || 10) as Required<number>) / 2) : (legendOption.location.x - textPadding +
                    (legend.itemPadding as Required<number>) + (((chartLegend.shapeWidth || 10) as Required<number>) / 2)) -
        (legend.legendBounds?.x as Required<number>);
    if (!legend.isVertical && legend.isPaging && !chartLegend.enablePages) {
        availwidth = legend.legendBounds?.width as Required<number> - (legend.fivePixel as Required<number>);
    }
    availwidth = chartLegend.maxLabelWidth ? Math.min(chartLegend.maxLabelWidth, availwidth) : availwidth;
}

/**
 * To create legend rendering elements.
 *
 * @param {Rect} legendBounds - The bounding rectangle for the legend.
 * @param {BaseLegend} legend - The legend object.
 * @param {string} id - The unique identifier for the legend elements.
 * @returns {void} This function does not return a value.
 * @private
 */
export function createLegendElements(legendBounds: Rect, legend: BaseLegend, id: string): void {
    const options: RectOption = createRectOption(id + '_element', legend.background as Required<string>, legend.border as Required<ChartBorderProps>, legend.opacity as Required<number>, legendBounds, 0, 0, '', legend.border?.dashArray as Required<string>);
    if (legend.title) {
        renderLegendTitle(legend, legendBounds);
    }
    options.y += (legend.isTop ? legend.legendTitleSize?.height as Required<number> : 0) +
        (legend.containerPadding?.top as Required<number>);
    options.height -= (legend.isTop ? legend.legendTitleSize?.height as Required<number> : 0) +
        (legend.containerPadding?.top as Required<number>);
    options.id += '_clipPath_rect';
    options.width = legendBounds.width;
    legend.clipRect = options;
    legend.pagingClipRect = options;
}

/**
 * Render the legend title.
 *
 * @param {BaseLegend} legend - The legend object.
 * @param {Rect} legendBounds - The bounding rectangle for the legend.
 * @returns {void} This function does not return a value.
 * @private
 */
export function renderLegendTitle(legend: BaseLegend, legendBounds: Rect): void {
    const padding: number = legend.padding as Required<number>;
    const alignment: HorizontalAlignment = legend.titleAlign as HorizontalAlignment;
    legend.isTop = true;
    let x: number = titlePositionX(legendBounds, legend.titleAlign as Required<HorizontalAlignment>);
    x = alignment === 'Left' ? (x + padding) : alignment === 'Right' ? (x - padding) : x;
    x = (legend.isTop || legend.isVertical) ? x : ((legendBounds.x) + (
        (legendBounds.width - (legend.legendTitleSize?.width as Required<number>) - 5)));
    const topPadding: number = (legendBounds.height / 2) + ((legend.legendTitleSize?.height as Required<number>) / 4);
    const y: number = legendBounds.y + (!legend.isTop && !legend.isVertical ? topPadding :
        ((legend.legendTitleSize?.height as Required<number>) / (legend.legendTitleCollections as Required<string[]>).length));
    legend.legendTitleLoction = { x: x, y: y };
}

// === PAGING & NAVIGATION ===
/**
 * To render legend paging elements for chart.
 *
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {Rect} bounds - The bounding rectangle for the legend elements.
 * @param {TextOption} textOption - The options for the text elements.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function renderPagingElements(
    chartLegend: ChartLegendProps,
    bounds: Rect,
    textOption: TextOption,
    chart: Chart,
    legend: BaseLegend
): void {
    const titleHeight: number = legend.legendTitleSize?.height as Required<number>;
    const grayColor: string = (chart.theme.indexOf('Dark') > -1) ? '#FFFFFF' : '#545454';
    const padding: number = 8;
    const pageUp: string = legend.legendID + (!legend.isRtlEnable ? '_pageup' : '_pagedown');
    const pageDown: string = legend.legendID + (!legend.isRtlEnable ? '_pagedown' : '_pageup');
    legend.pageUpOption = createPathOption(pageUp, 'transparent', 5, grayColor, 1, '', '');
    legend.pageDownOption = createPathOption(pageDown, 'transparent', 5, grayColor, 1, '', '');
    const iconSize: number = chart.availableSize.width < 110 || chart.availableSize.height < 190 ? 4 :
        legend.pageButtonSize as Required<number>;
    const titleWidth: number = 0;
    legend.pagingRegions = [];
    legend.backwardArrowOpacity = legend.currentPage !== 1 ? 1 : 0;
    legend.forwardArrowOpacity = legend.currentPage === legend.totalPages ? 0 : 1;
    if ((chartLegend.enablePages && legend.isPaging)) {
        legend.clipPathHeight = (legend.pageHeights as Required<number[]>)[0] - (legend.isTitle && legend.isTop ?
            legend.legendTitleSize?.height as Required<number> : 0) - (legend.containerPadding?.top as Required<number>) -
            (legend.containerPadding?.bottom as Required<number>);
    } else {
        legend.clipPathHeight = ((legend.rowCount as Required<number>) * ((legend.maxItemHeight as Required<number>) +
            (legend.padding as Required<number>)));
    }
    (legend.clipRect as Required<RectOption>).height = legend.clipPathHeight as Required<number>;
    let x: number = (bounds.x + iconSize / 2);
    let y: number = bounds.y + legend.clipPathHeight + ((titleHeight + bounds.height - legend.clipPathHeight) / 2);
    if (legend.isPaging && !chartLegend.enablePages && !legend.isVertical) {
        x = (bounds.x + (legend.pageButtonSize as Required<number>) + titleWidth);
        y = legend.title && legend.isTop ? (bounds.y + padding + titleHeight + (iconSize / 1) + 0.5) :
            (bounds.y + padding + iconSize + 0.5);
    }
    const size: ChartSizeProps = measureText(legend.totalPages + '/' + legend.totalPages, {} as TextStyleModel, chart.themeStyle.legendLabelFont);
    const translateX: number = (legend.isRtlEnable) ? (legend.border?.width as Required<number>) + (iconSize / 2) :
        bounds.width - (2 * (iconSize + padding) + padding + size.width);
    if (legend.isVertical && !legend.enablePages) {
        x = bounds.x + (bounds.width / 2);
        y = bounds.y + (iconSize / 2) + (padding / 2) + titleHeight;
        (legend.pageUpOption as Required<PathOptions>).opacity = legend.backwardArrowOpacity;
        legend.pageUpOption = calculateLegendShapes({ x: x, y: y }, { width: iconSize, height: iconSize }, 'UpArrow', (legend.pageUpOption as Required<PathOptions>));
    } else {
        (legend.pageUpOption as Required<PathOptions>).opacity = (legend.enablePages ? 1 : !legend.isRtlEnable ?
            legend.backwardArrowOpacity : legend.forwardArrowOpacity);
        legend.pageUpOption = calculateLegendShapes({ x: x, y: y }, { width: iconSize, height: iconSize }, 'LeftArrow', (legend.pageUpOption as Required<PathOptions>));
    }
    legend.pageUpOption = legend.pageUpOption as Required<PathOptions>;
    legend.pagingRegions.push({
        x: !legend.isRtlEnable ? x + bounds.width - (2 * (iconSize + padding) + padding + size.width)
            - iconSize * 0.5 : x, y: y - iconSize * 0.5, width: iconSize, height: iconSize
    });
    textOption.x = x + (iconSize / 2) + padding;
    textOption.y = y + (size.height / 4);
    textOption.id = legend.legendID + '_pagenumber';
    textOption.text = !legend.isRtlEnable ? '1/' + legend.totalPages : legend.totalPages + '/1';
    textOption.fontSize = chart.themeStyle.legendLabelFont.fontSize;
    legend.pageTextOption = textOption;
    x = textOption.x + padding + (iconSize / 2) + size.width;
    if (legend.isPaging && !legend.enablePages && !legend.isVertical) {
        x = bounds.x + bounds.width - (legend.pageButtonSize as Required<number>);
    }

    (legend.pageDownOption as Required<PathOptions>).id = pageDown;
    (legend.pageDownOption as Required<PathOptions>).opacity = !legend.enablePages ? !legend.isRtlEnable ? legend.forwardArrowOpacity :
        legend.backwardArrowOpacity : 1;
    if (legend.isVertical && !legend.enablePages) {
        x = bounds.x + (bounds.width / 2);
        y = bounds.y + bounds.height - (iconSize / 2);
        legend.pageDownOption = calculateLegendShapes({ x: x, y: y }, { width: iconSize, height: iconSize }, 'DownArrow', (legend.pageDownOption as Required<PathOptions>));
    } else {
        legend.pageDownOption = calculateLegendShapes({ x: x, y: y }, { width: iconSize, height: iconSize }, 'RightArrow', (legend.pageDownOption as Required<PathOptions>));
    }
    legend.pageDownOption = legend.pageDownOption as Required<PathOptions>;
    legend.pagingRegions.push({
        x: !legend.isRtlEnable ? x + (bounds.width - (2 * (iconSize + padding) + padding + size.width) - iconSize * 0.5) : x,
        y: y - iconSize * 0.5, width: iconSize, height: iconSize
    });
    if (legend.enablePages) {
        legend.transform = 'translate(' + translateX + ', ' + 0 + ')';
    } else {
        if (legend.currentPageNumber === 1 && legend.enablePages) {
            legend.totalNoOfPages = legend.totalPages;
        }
        if (!legend.enablePages) {
            translatePage((legend.currentPage as Required<number>) - 1, legend.currentPage as Required<number>, chartLegend, legend);
        }
    }
}

/**
 * To render legend symbols for chart.
 *
 * @param {ChartLegendProps} chartLegend - The chart legend properties.
 * @param {LegendOptions} legendOption - Options for configuring the legend symbols.
 * @param {number} legendIndex - The index of the specific legend item.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function renderSymbol(
    chartLegend: ChartLegendProps,
    legendOption: LegendOptions,
    legendIndex: number,
    chart: Chart,
    legend: BaseLegend
): void {
    const symbolColor: string = legendOption.visible ? legendOption.fill : '#D3D3D3';
    const isStrokeWidth: boolean = (((legendOption.shape === 'SeriesType') &&
        (legendOption.type.toLowerCase().indexOf('line') > -1) && (legendOption.type.toLowerCase().indexOf('area') === -1)) ||
        ((legendOption.shape === 'HorizontalLine') || (legendOption.shape === 'VerticalLine') || (legendOption.shape === 'Cross')));
    let shape: string = (legendOption.shape === 'SeriesType') ? legendOption.type : legendOption.shape;
    shape = shape === 'Scatter' ? legendOption.markerShape as string : shape;
    const strokewidth: number = isStrokeWidth ? chart.visibleSeries[legendIndex as number].width as Required<number> : 1;
    let symbolOption: PathOptions = createPathOption(
        legend.legendID + '_shape_' + legendIndex, symbolColor, strokewidth,
        symbolColor, legend.opacity as Required<number>, legendOption.dashArray as Required<string>, '');
    const textSize: ChartSizeProps = measureText(legendOption.text, chartLegend.textStyle as Required<ChartFontProps>,
                                                 chart.themeStyle.legendLabelFont);
    const x: number = chartLegend.inversed && !legend.isRtlEnable ? legendOption.location.x + textSize.width +
        (chartLegend.shapePadding as Required<number>) : legendOption.location.x;
    const y: number = legendOption.location.y;
    const shapeWidth: number = shape === 'Rectangle' && !chartLegend.shapeWidth ? 8 : (chartLegend.shapeWidth || 10) as Required<number>;
    const shapeHeight: number = shape === 'Rectangle' && !chartLegend.shapeHeight ? 8 : (chartLegend.shapeHeight || 10) as Required<number>;
    symbolOption = calculateShapes({ x: x, y: y }, { width: shapeWidth,
        height: shapeHeight }, shape, symbolOption, legendOption.url as Required<string>) as PathOptions;
    legendOption.symbolOption = symbolOption;
    if (shape === 'Line' && legendOption.markerVisibility && legendOption.markerShape !== 'Image') {
        let markerOption: PathOptions = createPathOption(
            legend.legendID + '_shape_marker_' + legendIndex, symbolColor, strokewidth,
            symbolColor, legend.opacity as Required<number>, legendOption.dashArray as Required<string>, '');
        shape = legendOption.markerShape as Required<string>;
        markerOption = calculateShapes({ x: x, y: y }, { width: ((chartLegend.shapeWidth || 10) as Required<number>) / 2,
            height: ((chartLegend.shapeHeight || 10) as Required<number>) / 2 }, shape,
                                       markerOption, legendOption.url as Required<string>) as PathOptions;
        legendOption.markerOption = markerOption;
    }
}

/**
 * To render legend text for chart.
 *
 * @param {ChartLegendProps} chartLegend - Properties for the chart legend.
 * @param {LegendOptions} legendOption - Options for the legend.
 * @param {TextOption} textOptions - Options for rendering the text.
 * @param {number} legendIndex - Index of the legend.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void}
 * @private
 */
export function renderText(
    chartLegend: ChartLegendProps,
    legendOption: LegendOptions,
    textOptions: TextOption,
    legendIndex: number,
    chart: Chart,
    legend: BaseLegend
): void {
    const hiddenColor: string = '#D3D3D3';
    const fontcolor: string = legendOption.visible ? (legend.textStyle as Required<ChartFontProps>).color ||
        chart.themeStyle.legendLabelFont.color : hiddenColor;
    textOptions.fill = fontcolor;
    textOptions.id = legend.legendID + '_text_' + legendIndex;
    textOptions.text = (legendOption.textCollection?.length as Required<number>) > 0 ?
        legendOption.textCollection as Required<string[]> : legendOption.text;
    if (chartLegend.inversed && !legend.isRtlEnable) {
        textOptions.x = legendOption.location.x - (((chartLegend.shapeWidth || 10) as Required<number>) / 2);
    }
    else if (legend.isRtlEnable) {
        const textWidth: number = measureText(legendOption.text, legend.textStyle as Required<ChartFontProps>,
                                              chart.themeStyle.legendLabelFont).width;
        textOptions.x = legendOption.location.x - (((legendOption.textCollection as Required<string[]>).length > 1 ?
            textWidth / (legendOption.textCollection as Required<string[]>).length : textWidth) +
         ((legend.shapeWidth || 10) as Required<number>) / 2 + (legend.shapePadding as Required<number>));
    }
    else {
        textOptions.x = legendOption.location.x + (((chartLegend.shapeWidth || 10) as Required<number>) / 2) +
            (chartLegend.shapePadding as Required<number>);
    }
    textOptions.y = legendOption.location.y + (legend.maxItemHeight as Required<number>) / 4;
    legendOption.textOption = textOptions;
}

/**
 * Checks whether the provided coordinates are within the bounds.
 *
 * @param {number} previousBound - Description for previousBound.
 * @param {number} textWidth - Width of the text.
 * @param {Rect} rect - Bounding rectangle.
 * @param {BaseLegend} legend - The legend object.
 * @returns {boolean} `true` if the coordinates are within the bounds, otherwise `false`.
 * @private
 */
export function isWithinBounds(
    previousBound: number,
    textWidth: number,
    rect: Rect,
    legend: BaseLegend
): boolean {
    if (!legend.isRtlEnable) {
        return (previousBound + textWidth) > (rect.x + rect.width + (((legend.shapeWidth || 10) as Required<number>) / 2));
    }
    return (previousBound - textWidth) < (rect.x - (((legend.shapeWidth || 10) as Required<number>) / 2));
}

// === EVENT HANDLING & UTILITIES ===
/**
 * To find first valid legend text index for chart.
 *
 * @param {LegendOptions[]} legendCollections - Array of legend options.
 * @returns {number} The index of the first valid legend text.
 * @private
 */
export function findFirstLegendPosition(legendCollections: LegendOptions[]): number {
    let count: number = 0;
    for (const legend of legendCollections) {
        if (legend.render && legend.text && legend.text !== '') {
            break;
        }
        count++;
    }
    return count;
}

/**
 * To translate legend pages for chart
 *
 * @param {number} page - The current page to translate
 * @param {number} pageNumber - The specific page number to translate to
 * @param {ChartLegendProps} chartLegend - Properties for the chart legend.
 * @param {BaseLegend} legend - The legend object
 * @param {Function} [updateTransform] - Callback to update the transform of the legend
 * @param {Function} [updatePageText] - Callback to update the text of the legend page
 * @returns {number} The calculated size after translating the page
 * @private
 */
export function translatePage(
    page: number,
    pageNumber: number,
    chartLegend: ChartLegendProps,
    legend: BaseLegend,
    updateTransform?: (transform: string) => void,
    updatePageText?: (text: string) => void
): number {
    const size: number = (page ? getPageHeight(legend.pageHeights as Required<number[]>, page, legend) : 0);
    (legend.clipRect as Required<RectOption>).height = (legend.pageHeights as Required<number[]>)[page as number] -
                (legend.isTitle && legend.isTop ? (legend.legendTitleSize as Required<ChartSizeProps>).height : 0) -
                (chartLegend.containerPadding?.top as Required<number>) - (chartLegend.containerPadding?.bottom as Required<number>);
    const translate: string = 'translate(0,-' + size + ')';
    legend.legendTranslate = translate;
    if (updateTransform) {
        updateTransform(translate);
    }
    if (chartLegend.enablePages) {
        if (updatePageText) {
            updatePageText((pageNumber) + '/' + legend.totalPages);
        }
    }
    legend.currentPage = pageNumber;
    return size;
}

/**
 * Returns the total height required for all legend pages up to a certain count
 *
 * @param {number[]} pageHeights - Array of heights for each legend page.
 * @param {number} pageCount - The page count up to which the height is calculated.
 * @param {BaseLegend} legend - The legend object.
 * @returns {number} The total height required for all pages up to the specified count.
 * @private
 */
export function getPageHeight(pageHeights: number[], pageCount: number, legend: BaseLegend): number {
    let sum: number = 0;
    for (let i: number = 0; i < pageCount; i++) {
        sum += pageHeights[i as number] - ((legend.isTitle && legend.isTop)
            ? (legend.legendTitleSize as Required<ChartSizeProps>).height : 0);
    }
    return sum;
}

/**
 * To change legend pages for chart
 *
 * @param {ChartLegendProps} chartLegend - Properties for the chart legend.
 * @param {boolean} pageUp - Indicates whether to move the page up.
 * @param {Function} updateTransform - Callback to update the transform of the legend.
 * @param {Function} updatePageText - Callback to update the text of the legend page.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void}
 * @private
 */
export function changePage(
    chartLegend: ChartLegendProps,
    pageUp: boolean,
    updateTransform: (transform: string) => void,
    updatePageText: (text: string) => void,
    legend: BaseLegend
): void {
    const page: number = legend.currentPage as Required<number>;
    if (pageUp && page > 1) {
        translatePage((page - 2), (page - 1), chartLegend, legend, updateTransform, updatePageText);
    } else if (!pageUp && page < (legend.totalPages as Required<number>)) {
        translatePage(page, (page + 1), chartLegend, legend, updateTransform, updatePageText);
    }
    if (legend.isPaging && !legend.enablePages) {
        if (legend.currentPage === legend.totalPages) {
            (legend.pageDownOption as Required<PathOptions>).opacity = 0;
        }
        else {
            (legend.pageDownOption as Required<PathOptions>).opacity = 1;
        }
        if (legend.currentPage === 1) {
            (legend.pageUpOption as Required<PathOptions>).opacity = 0;
        }
        else {
            (legend.pageUpOption as Required<PathOptions>).opacity = 1;
        }
    }
}

/**
 * Handles the click event for a legend item.
 *
 * @param {ChartLegendProps} props - The properties of the legend item clicked
 * @param {number} index - The index of the legend item
 * @param {Chart} chart - The chart object
 * @param {BaseLegend} legend - The legend object
 * @returns {void}
 * @private
 */
export function LegendClick(props: ChartLegendProps, index: number, chart: Chart, legend: BaseLegend): void {
    const seriesIndex: number = index;
    const legendIndex: number = !legend.isReverse ? index : ((legend.legendCollections as Required<LegendOptions[]>).length - 1)
        - index;
    const series: SeriesProperties = chart.visibleSeries[seriesIndex as number];
    const chartLegend: LegendOptions = (legend.legendCollections as Required<LegendOptions[]>)[legendIndex as number];
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
    const legendClickArgs: LegendClickEvent = {
        text: chartLegend.text, shape: chartLegend.shape,
        seriesName: series.name as string, cancel: false
    };
    chart.chartProps?.onLegendClick?.(legendClickArgs);
    series.legendShape = legendClickArgs.shape;
    if (!legendClickArgs.cancel) {
        if (series.fill !== null) {
            chart.visibleSeries[index as number].interior = series.fill || '';
        }
        if (props.toggleVisibility) {
            series.isLegendClicked = true;
            changeSeriesVisiblity(series, series.visible, chart);
            chartLegend.visible = (series.visible as Required<boolean>);
            if (chartLegend.markerOption) {
                chartLegend.markerOption.fill = chartLegend.visible ? series.interior as Required<string> : '#D3D3D3';
                chartLegend.markerOption.stroke = chartLegend.visible ? series.interior as Required<string> : '#D3D3D3';
            }
            if (chartLegend.symbolOption) {
                if (!((series.type === 'Spline' || series.type === 'StepLine') && chartLegend.shape === 'SeriesType')) {
                    chartLegend.symbolOption.fill = chartLegend.visible ? series.interior as Required<string> : '#D3D3D3';
                }
                chartLegend.symbolOption.stroke = chartLegend.visible ? series.interior as Required<string> : '#D3D3D3';
            }
            if (chartLegend.textOption) {
                chartLegend.textOption.fill = chartLegend.visible ? (legend.textStyle as Required<ChartFontProps>).color ||
                    chart.themeStyle.legendLabelFont.color : '#D3D3D3';
            }
            chart.animateSeries = false;
            chart.isLegendClicked = true;
            const chartId: string = chart.element.id;
            const triggerRender: (chartId?: string) => void = useRegisterAxisRender();
            triggerRender(chartId);
            const triggerSeriesRender: (chartId?: string) => void = useRegisterSeriesRender();
            triggerSeriesRender(chartId);
        }
    }
}

/**
 * Changes the visibility of a series and updates secondary axis visibility if necessary.
 *
 * @param {SeriesProperties} series - The series to change visibility for.
 * @param {boolean} visibility - The new visibility state.
 * @param {Chart} chart - The chart object.
 * @returns {void}
 * @private
 */
export function changeSeriesVisiblity(series: SeriesProperties, visibility: boolean, chart: Chart): void {
    series.visible = !visibility;
    if (isSecondaryAxis(series.xAxis, chart.axes)) {
        series.xAxis.internalVisibility = series.xAxis.series.some((value: SeriesProperties) => (value.visible));
    }
    if (isSecondaryAxis(series.yAxis, chart.axes)) {
        series.yAxis.internalVisibility = series.yAxis.series.some((value: SeriesProperties) => (value.visible));
    }
}

/**
 * Checks if the axis is a secondary axis within the chart
 *
 * @param {AxisModel} axis - The axis model to check.
 * @param {AxisModel[]} axes - The secondary axis collection.
 * @returns {boolean} `true` if the axis is a secondary axis, otherwise `false`.
 * @private
 */
export function isSecondaryAxis(axis: AxisModel, axes: AxisModel[]): boolean {
    return axes.some((secondaryAxis: AxisModel) => secondaryAxis.name === axis.name);
}
