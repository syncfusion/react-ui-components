import { HorizontalAlignment, isNullOrUndefined, merge, VerticalAlignment } from '@syncfusion/react-base';
import { PieChartSizeProps, PieChartFontProps, PieChartLocationProps, PieChartBorderProps, PieLegendClickEvent } from '../../base/interfaces';
import { createLegendOption, createPathOption, createRectOption, degreeToLocation, getTitle, measureText, stringToNumber, subtractThickness, titlePositionX, useTextWrap } from '../../utils/helper';
import { useRegisterSeriesRender } from '../../hooks/events';
import { TextOverflow, Theme, LegendPosition } from '../../../common';
import { BaseLegend, SeriesProperties, Chart, Rect, LegendOptions, TextOption, RectOption, PathOptions, Points } from '../../base/internal-interfaces';

// === LEGEND INITIALIZATION & CONFIGURATION ===

/**
 * Retrieves the legend options based on the visible series collection and chart.
 *
 * @param {BaseLegend} chartLegend - The chart legend properties.
 * @param {SeriesProperties[]} visibleSeriesCollection - The collection of visible series.
 * @param {Chart} chart - The chart object.
 * @returns {void} An object containing the configuration for the legend, tailored to the provided series and chart settings.
 * @private
 */
export function getLegendOptions(chartLegend: BaseLegend, visibleSeriesCollection: SeriesProperties[], chart: Chart): void {
    chart.chartLegend.isRtlEnable = isNullOrUndefined(chart.enableRtl) ? false : chart.enableRtl;
    chart.chartLegend.isReverse = !chartLegend.isRtlEnable && chartLegend.reverse;
    chart.chartLegend.legendID = chart.element.id + '_chart_legend';
    chart.chartLegend.legendCollections = [];
    for (const series of visibleSeriesCollection) {
        const seriesType: string = (series.innerRadius && series.innerRadius !== '0' && series.innerRadius !== '0%') ?
            'Doughnut' : 'Pie';
        for (const point of series.points) {
            if (!isNullOrUndefined(point.x) && !isNullOrUndefined(point.y)) {
                chart.chartLegend.legendCollections.push(createLegendOption(
                    point.x.toString(), point.color, chart.chartLegend.shape, point.visible,
                    seriesType, chartLegend.imageUrl, point.index, series.index, null, point.x.toString()
                ));
            }
        }
    }
    if (chartLegend.reverse) {
        chart.chartLegend.legendCollections.reverse();
    }

}

/**
 * Calculate the bounds for the legends.
 *
 * @param {BaseLegend} legend - The legend object.
 * @param {Rect} rect - The rectangle defining the legend area.
 * @param {PieChartSizeProps} availableSize - The available size for rendering.
 * @param {Chart} chart - The chart object.
 * @param {Rect} [previousLegendBounds] - The previous legend bounds, if available.
 * @param {boolean} [pointAnimation] - Indicates if point animation is enabled.
 * @returns {void} This function does not return a value.
 * @private
 */
export function calculateLegendBound(
    legend: BaseLegend,
    rect: Rect,
    availableSize: PieChartSizeProps,
    chart: Chart,
    previousLegendBounds?: Rect,
    pointAnimation?: boolean
): void {
    const defaultValue: string = '20%';
    legend.legendBounds = { x: rect.x, y: rect.y, width: 0, height: 0 };
    legend.legendPosition = (legend.position !== 'Auto') ? legend.position :
        (availableSize.width > availableSize.height ? 'Right' : 'Bottom');
    legend.isVertical = (legend.legendPosition === 'Left' || legend.legendPosition === 'Right');
    legend.legendItemPadding = legend.itemPadding ? legend.itemPadding : legend.isVertical ? 8 : 20;
    if (legend.isVertical) {
        legend.legendBounds.height = stringToNumber(
            legend.height, availableSize.height - (rect.y - chart.margin.top)) || rect.height;
        legend.legendBounds.width = stringToNumber(legend.width || defaultValue, availableSize.width);
    } else {
        legend.legendBounds.width = stringToNumber(legend.width, availableSize.width) || rect.width;
        legend.legendBounds.height = stringToNumber(legend.height || defaultValue, availableSize.height);
    }
    getLegendBounds(availableSize, legend.legendBounds, chart, legend);
    legend.legendBounds.width += (legend.containerPadding?.left as Required<number> +
        (legend.containerPadding?.right as Required<number>));
    legend.legendBounds.height += (legend.containerPadding?.top as Required<number> +
        (legend.containerPadding?.bottom as Required<number>));
    if (legend.legendBounds.height > 0 && legend.legendBounds.width > 0) {
        getLocation(legend.legendPosition as Required<LegendPosition>, legend.align as Required<HorizontalAlignment | VerticalAlignment>,
                    legend.legendBounds, rect, availableSize, chart, legend, previousLegendBounds, pointAnimation);
    }
}

// === LAYOUT CALCULATION & POSITIONING ===

/**
 * Calculates the rendering point for the legend item based on various parameters.
 *
 * @param {PieChartSizeProps} availableSize - The available size for rendering.
 * @param {Rect} legendBounds - The bounds within which the legend is to be positioned.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function getLegendBounds(
    availableSize: PieChartSizeProps,
    legendBounds: Rect,
    chart: Chart,
    legend: BaseLegend
): void {
    calculateLegendTitle(legend, legendBounds, chart);
    legend.isTitle = legend.title ? true : false;
    legend.chartRowCount = 1;
    legend.rowHeights = [];
    legend.columnHeights = [];
    legend.pageHeights = [];
    const padding: number = legend.padding as Required<number>;
    let extraHeight: number = 0;
    let legendOption: LegendOptions;
    let extraWidth: number = 0;
    const arrowWidth: number = legend.arrowWidth as Required<number>;
    const arrowHeight: number = legend.arrowHeight as Required<number>;
    const verticalArrowSpace: number = legend.isVertical && !legend.enablePages ? arrowHeight : 0;
    const titleSpace: number = legend.isTitle ? legend.legendTitleSize?.height as Required<number> +
        (legend.fivePixel as Required<number>) : 0;
    if (!legend.isVertical) {
        extraHeight = !legend.height ? ((availableSize.height / 100) * 5) : 0;
    } else {
        extraWidth = !legend.width ? ((availableSize.width / 100) * 5) : 0;
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
    const textStyle: PieChartFontProps = legend.textStyle as Required<PieChartFontProps>;
    legend.maxItemHeight = Math.max(measureText('MeasureText', textStyle, chart.themeStyle.legendLabelFont).height, (legend.shapeHeight || 10) as Required<number>);
    if (legend.fixedWidth) {
        for (let i: number = 0; legend.legendCollections && i < legend.legendCollections.length; i++) {
            const textWidth: number = shapeWidth + shapePadding + (!(legend.isVertical as Required<boolean>) ? (i === 0) ? padding :
                (legend.legendItemPadding as Required<number>) : padding) + (legend.maxLabelWidth ?
                legend.maxLabelWidth :
                measureText(legend.legendCollections[i as number].text, (legend.textStyle as Required<PieChartFontProps>),
                            chart.themeStyle.legendLabelFont).width);
            legend.maxWidth = Math.max(legend.maxWidth as Required<number>, textWidth);
        }
    }
    for (let i: number = 0; legend.legendCollections && i < legend.legendCollections.length; i++) {
        legendOption = legend.legendCollections[i as number];
        legendOption.textSize = measureText(legendOption.text, legend.textStyle as Required<PieChartFontProps>,
                                            chart.themeStyle.legendLabelFont);
        shapeWidth = legendOption.text ? (legend.shapeWidth || 10) as Required<number> : 0;
        shapePadding = legendOption.text ? legend.shapePadding as Required<number> : 0;
        if (legendOption.render && legendOption.text) {
            render = true;
            const textWidth: number = legend.maxLabelWidth || legendOption.textSize.width;
            let paddingValue: number = padding;
            const isHorizontalLayout: boolean = !legend.isVertical;

            if (isHorizontalLayout) {
                const isFirstItem: boolean = i === 0;

                if (!isFirstItem) {
                    paddingValue = legend.legendItemPadding as Required<number>;
                }
            }

            legendWidth = legend.fixedWidth ?
                legend.maxWidth as Required<number> :
                shapeWidth + shapePadding + textWidth + paddingValue;

            rowWidth = rowWidth + legendWidth;
            if (!legend.enablePages && !legend.isVertical) {
                titlePlusArrowSpace = 0;
                titlePlusArrowSpace += arrowWidth;
            }
            getLegendHeight(legendOption, legend, legendBounds, rowWidth, legend.maxItemHeight, padding, chart);
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
                , Math.max(legendOption.textSize.height, (legend.shapeHeight || 10) as Required<number>));
            legend.columnHeights[columnCount as number] = (legend.columnHeights[columnCount as number] ?
                legend.columnHeights[columnCount as number] : 0) + (((legend.isVertical as Required<boolean>) || (rowCount > 0 &&
                    legend.itemPadding)) ? (i === 0) ? padding : legend.legendItemPadding as Required<number> : padding) +
                Math.max(legendOption.textSize.height, (legend.shapeHeight || 10) as Required<number>);
            columnCount++;
        }
    }
    columnHeight = Math.max.apply(null, legend.columnHeights) + padding + titleSpace;
    columnHeight = Math.max(columnHeight, (legend.maxItemHeight + padding) + padding + titleSpace);
    legend.isPaging = (legendBounds.height < columnHeight);
    if (legend.isPaging && !legend.enablePages) {
        if (!legend.isVertical) {
            columnHeight = (legend.maxItemHeight + padding) + padding + titleSpace;
        }
    }
    legend.totalPages = rowCount;
    if (render) {
        setBounds(Math.max((rowWidth + padding), maximumWidth), columnHeight, legendBounds, legend);
    } else {
        setBounds(0, 0, legendBounds, legend);
    }
}
// === TITLE HANDLING ===

/**
 * Calculates the legend title text width and height.
 *
 * @param {BaseLegend} legend - The legend object.
 * @param {Rect} legendBounds - The bounding rectangle for the legend.
 * @param {Chart} chart - The chart object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function calculateLegendTitle(
    legend: BaseLegend,
    legendBounds: Rect,
    chart: Chart
): void {
    if (legend.title) {
        const padding: number = (legend).titleOverflow === 'Trim' ? 2 * (legend.padding as Required<number>) : 0;
        legend.legendTitleCollections = getTitle(legend.title, (legend.titleStyle as Required<PieChartFontProps>), (
            legendBounds.width - padding), chart.enableRtl, chart.themeStyle.legendTitleFont,
                                                 legend.titleOverflow as Required<TextOverflow>);
        const text: string = legend.title;
        legend.legendTitleSize = measureText(text, (legend.titleStyle as Required<PieChartFontProps>),
                                             chart.themeStyle.legendTitleFont);
        ((legend.legendTitleSize as Required<PieChartSizeProps>).height as Required<number>) *=
            (legend.legendTitleCollections as Required<string[]>).length;
    } else {
        legend.legendTitleSize = { width: 0, height: 0 };
    }
}

/**
 * Calculates the total height of the legend (including paddings, title, and items).
 *
 * @param {LegendOptions} legendOption - Options for the legend configuration.
 * @param {BaseLegend} chartLegend - The chart legend properties.
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
    chartLegend: BaseLegend,
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
                (legendBounds.width - textPadding)), chartLegend.textStyle as Required<PieChartFontProps>, chart.enableRtl,
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
 * @param {Rect} legendBounds - The bounding rectangle for the legend.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void}
 * @private
 */
export function setBounds(
    computedWidth: number,
    computedHeight: number,
    legendBounds: Rect,
    legend: BaseLegend
): void {
    let titleHeight: number = legend.title && legend.legendTitleSize && legend.legendTitleSize.height ?
        legend.legendTitleSize.height + (legend.fivePixel as Required<number>) : 0;
    if (legend.isVertical && legend.isPaging && !legend.enablePages) {
        titleHeight = legend.title ? (legend.legendTitleSize?.height as Required<number>) + (legend.fivePixel as Required<number>) : 0;
        titleHeight += ((legend.pageButtonSize as Required<number>) + (legend.fivePixel as Required<number>));
    }
    computedWidth = Math.min(computedWidth, legendBounds.width);
    computedHeight = Math.min(computedHeight, legendBounds.height);
    legendBounds.width = !legend.width ? computedWidth : legendBounds.width;
    legendBounds.height = !legend.height ? computedHeight : legendBounds.height;
    if (legend.titleOverflow !== 'None') {
        calculateLegendTitle(legend, legendBounds, legend.chart as Chart);
        legendBounds.height += legend.titleOverflow === 'Wrap' && (legend.legendTitleCollections as Required<string[]>).length > 1 ? ((legend.legendTitleSize?.height as Required<number>) - ((legend.legendTitleSize?.height as Required<number>)
            / (legend.legendTitleCollections as Required<string[]>).length)) : 0;
    }
    legend.rowCount = Math.max(1, Math.ceil((legendBounds.height - (legend.padding as Required<number>) - titleHeight) /
        ((legend.maxItemHeight as Required<number>) + (legend.padding as Required<number>))));
}

/**
 * Determines the location of the legend based on its position and alignment.
 *
 * @param {LegendPosition} position - Position of the legend.
 * @param {HorizontalAlignment} alignment - Alignment of the legend.
 * @param {Rect} legendBounds - The bounding rectangle of the legend.
 * @param {Rect} rect - The main chart area rectangle.
 * @param {PieChartSizeProps} availableSize - The available size for the legend.
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
    availableSize: PieChartSizeProps,
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
    if (position === 'Bottom') {
        legendAlignment = alignment === 'Left' || alignment === 'Right' ? alignment : 'Center';
        legendBounds.x = alignLegend(legendBounds.x, availableSize.width, legendBounds.width, legendAlignment);
        legendBounds.y = rect.y + (rect.height - legendHeight) + (padding as Required<number>) +
            (legend.margin?.top as Required<number>);
        if ((!pointAnimation || (legendBounds.height !== previousLegendBounds?.height))) {
            subtractThickness(rect, { left: 0, right: 0, top: 0, bottom: legendHeight + legendPadding });
        }
    } else if (position === 'Top') {
        legendAlignment = alignment === 'Left' || alignment === 'Right' ? alignment : 'Center';
        legendBounds.x = alignLegend(legendBounds.x, availableSize.width, legendBounds.width, legendAlignment);
        legendBounds.y = rect.y + (padding as Required<number>) + (legend.margin?.top as Required<number>);
        legendHeight -= -padding * 2;
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
 * @param {Rect} legendBounds - The bounding rectangle for the legend.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function renderLegend(legendBounds: Rect, chart: Chart, legend: BaseLegend): void {
    let titleHeight: number = 0; let titlePlusArrowWidth: number = 0;
    let pagingLegendBounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
    let requireLegendBounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
    const firstLegend: number = findFirstLegendPosition(legend.legendCollections as Required<LegendOptions[]>);
    const padding: number = legend.padding as Required<number>;
    const isPaging: boolean = legend.enablePages as Required<boolean>;
    const upArrowHeight: number = legend.isPaging && !legend.enablePages && legend.isVertical ?
        legend.pageButtonSize as Required<number> : 0;
    createLegendElements(legendBounds, legend, legend.legendID as Required<string>);
    legend.legendRegions = [];
    legend.chartRowCount = 1;
    let maxHeight: number = 0;
    titleHeight = !legend.isTitle ? 0 : legend.legendTitleSize?.height as Required<number>;

    let pageCount: number = 1;
    let rowHeights: number = (((legend.isVertical) || ((legend.rowHeights?.length as Required<number>) > 1 &&
        (legend.itemPadding))) ? legend.legendItemPadding as Required<number> : padding) +
        (legend.rowHeights as Required<number[]>)[0];
    for (let i: number = 1; legend.rowHeights && i < legend.rowHeights.length; i++) {
        if ((rowHeights + legend.rowHeights[i as number] + (((legend.isVertical || (legend.rowHeights.length > 1)) &&
            legend.itemPadding) ? legend.legendItemPadding as Required<number> : padding))
            > ((legend.legendBounds?.height as Required<number>) - (legend.pageButtonSize as Required<number>) -
                (legend.maxItemHeight as Required<number>) / 2) - (legend.containerPadding?.top as Required<number>) -
            (legend.containerPadding?.bottom as Required<number>)) {
            (legend.pageHeights as Required<number[]>)[pageCount - 1] = rowHeights + titleHeight;
            pageCount++;
            rowHeights = 0;
        }
        rowHeights += (legend.rowHeights[i as number] + ((legend.isVertical || (legend.rowHeights.length > 1 &&
            legend.itemPadding)) ? legend.legendItemPadding as Required<number> : padding));
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
            (((legend.shapeWidth || 10) as Required<number>) / 2) + (legend.containerPadding?.left as Required<number>);
        const xLocation: number = (!legend.isRtlEnable) ? legendBounds.x + startPadding : legendBounds.x +
            (legendBounds.width) - startPadding;
        const start: PieChartLocationProps = {
            x: xLocation, y: legendBounds.y + titleHeight + upArrowHeight + padding +
                ((legend.maxItemHeight as Required<number>) / 2) + (legend.containerPadding?.top as Required<number>)
        };
        const anchor: string = (chart as Chart).enableRtl ? 'end' : 'start';
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
        const textPadding: number = legend.shapePadding as Required<number> + (legend.legendItemPadding as Required<number>) +
            ((legend.shapeWidth || 10) as Required<number>);
        legend.legendCollections[firstLegend as number].location = start;
        let legendIndex: number;
        if (!legend.enablePages && legend.isPaging) {
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
            getRenderPoint(legendOption, start, textPadding, previousLegend, requireLegendBounds, count,
                           firstLegend, legend);
            renderSymbol(legendOption, legendIndex, chart, legend);
            renderText(legendOption, legendTextOption, legendIndex, chart, legend);
            previousLegend = legendOption;
            count++;
        }
        legend.totalPages = (legend.isPaging && !legend.enablePages && !legend.isVertical &&
            legend.totalPages > legend.chartRowCount) ? legend.chartRowCount : legend.totalPages;
        legend.currentPage = (legend.currentPage as Required<number>) > 1 &&
            (legend.currentPage as Required<number>) > legend.totalPages ? legend.totalPages : legend.currentPage;
        if (legend.isPaging && legend.totalPages > 1) {
            renderPagingElements(legendBounds, textOptions, chart, legend);
        } else {
            legend.totalPages = 1;
        }
    }
}

/**
 * Calculates the rendering point for the legend item based on various parameters.
 *
 * @param {LegendOptions} legendOption - The legend option to be rendered.
 * @param {PieChartLocationProps} start - The starting location for the legend item.
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
    legendOption: LegendOptions,
    start: PieChartLocationProps,
    textPadding: number,
    previousLegend: LegendOptions,
    rect: Rect,
    count: number,
    firstLegend: number,
    legend: BaseLegend
): void {
    const padding: number = legend.padding as Required<number>;
    const textWidth: number = legend.fixedWidth ? legend.maxWidth as Required<number> : textPadding +
        (legend.maxLabelWidth ? legend.maxLabelWidth as Required<number> : previousLegend.textSize.width);
    const rightSpace: number = 0;
    const previousBound: number = previousLegend.location.x + ((!legend.isRtlEnable) ? textWidth : -textWidth);
    if (isWithinBounds(previousBound + rightSpace, (legend.maxLabelWidth ?
        legend.maxLabelWidth : legendOption.textSize.width) + textPadding - (legend.legendItemPadding as Required<number>), rect, legend)
        || (legend.isVertical)) {
        legendOption.location.x = start.x;
        if (count !== firstLegend) {
            (legend.chartRowCount as Required<number>)++;
        }
        legendOption.location.y = (count === firstLegend) ? previousLegend.location.y : previousLegend.location.y +
            (legend.isVertical ? Math.max(previousLegend.textSize.height, (legend.shapeHeight || 10) as Required<number>) :
                (legend.rowHeights as Required<number[]>)[(legend.chartRowCount as Required<number> - 2)]) +
            ((legend.isVertical || ((legend.chartRowCount as Required<number>) > 1
                && legend.itemPadding)) ? legend.legendItemPadding as Required<number> : padding);
    } else {
        legendOption.location.x = (count === firstLegend) ? previousLegend.location.x : previousBound;
        legendOption.location.y = previousLegend.location.y;
    }
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
    const options: RectOption = createRectOption(id + '_element', legend.background as Required<string>, legend.border as Required<PieChartBorderProps>, legend.opacity as Required<number>, legendBounds, 0, 0, '', legend.border?.dashArray as Required<string>);
    if (legend.title) {
        renderLegendTitle(legend, legendBounds);
    }
    options.y += legend.legendTitleSize?.height as Required<number> +
        (legend.containerPadding?.top as Required<number>);
    options.height -= legend.legendTitleSize?.height as Required<number> +
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
    let x: number = titlePositionX(legendBounds, legend.titleAlign as Required<HorizontalAlignment>);
    x = alignment === 'Left' ? (x + padding) : alignment === 'Right' ? (x - padding) : x;
    const y: number = legendBounds.y +
        ((legend.legendTitleSize?.height as Required<number>) / (legend.legendTitleCollections as Required<string[]>).length);
    legend.legendTitleLoction = { x: x, y: y };
}

// === PAGING & NAVIGATION ===
/**
 * To render legend paging elements for chart.
 *
 * @param {Rect} bounds - The bounding rectangle for the legend elements.
 * @param {TextOption} textOption - The options for the text elements.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function renderPagingElements(
    bounds: Rect,
    textOption: TextOption,
    chart: Chart,
    legend: BaseLegend
): void {
    const titleHeight: number = legend.legendTitleSize?.height as Required<number>;
    const grayColor: string = ((chart.theme as Theme).indexOf('Dark') > -1) ? '#FFFFFF' : '#545454';
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
    if ((legend.enablePages && legend.isPaging)) {
        legend.clipPathHeight = (legend.pageHeights as Required<number[]>)[0] - (legend.isTitle ?
            legend.legendTitleSize?.height as Required<number> : 0) - (legend.containerPadding?.top as Required<number>) -
            (legend.containerPadding?.bottom as Required<number>);
    } else {
        legend.clipPathHeight = ((legend.rowCount as Required<number>) * ((legend.maxItemHeight as Required<number>) +
            (legend.padding as Required<number>)));
    }
    (legend.clipRect as Required<RectOption>).height = legend.clipPathHeight as Required<number>;
    let x: number = (bounds.x + iconSize / 2);
    let y: number = bounds.y + legend.clipPathHeight + ((titleHeight + bounds.height - legend.clipPathHeight) / 2);
    if (legend.isPaging && !legend.enablePages && !legend.isVertical) {
        x = (bounds.x + (legend.pageButtonSize as Required<number>) + titleWidth);
        y = legend.title ? (bounds.y + padding + titleHeight + (iconSize / 1) + 0.5) :
            (bounds.y + padding + iconSize + 0.5);
    }
    const size: PieChartSizeProps = measureText(legend.totalPages + '/' + legend.totalPages, {} as PieChartFontProps, chart.themeStyle.legendLabelFont);
    const translateX: number = (legend.isRtlEnable) ? (legend.border?.width as Required<number>) + (iconSize / 2) :
        bounds.width - (2 * (iconSize + padding) + padding + size.width);
    if (legend.isVertical && !legend.enablePages) {
        x = bounds.x + (bounds.width / 2);
        y = bounds.y + (iconSize / 2) + (padding / 2) + titleHeight;
        (legend.pageUpOption as Required<PathOptions>).opacity = legend.backwardArrowOpacity;
        legend.pageUpOption = calculateShapes({ x: x, y: y }, { width: iconSize, height: iconSize }, 'UpArrow', (legend.pageUpOption as Required<PathOptions>), '');
    } else {
        (legend.pageUpOption as Required<PathOptions>).opacity = (legend.enablePages ? 1 : !legend.isRtlEnable ?
            legend.backwardArrowOpacity : legend.forwardArrowOpacity);
        legend.pageUpOption = calculateShapes({ x: x, y: y }, { width: iconSize, height: iconSize }, 'LeftArrow', (legend.pageUpOption as Required<PathOptions>), '');
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
        legend.pageDownOption = calculateShapes({ x: x, y: y }, { width: iconSize, height: iconSize }, 'DownArrow', (legend.pageDownOption as Required<PathOptions>), '');
    } else {
        legend.pageDownOption = calculateShapes({ x: x, y: y }, { width: iconSize, height: iconSize }, 'RightArrow', (legend.pageDownOption as Required<PathOptions>), '');
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
            translatePage((legend.currentPage as Required<number>) - 1, legend.currentPage as Required<number>, legend);
        }
    }
}

/**
 * To render legend symbols for chart.
 *
 * @param {LegendOptions} legendOption - Options for configuring the legend symbols.
 * @param {number} legendIndex - The index of the specific legend item.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void} This function does not return a value.
 * @private
 */
export function renderSymbol(
    legendOption: LegendOptions,
    legendIndex: number,
    chart: Chart,
    legend: BaseLegend
): void {
    const symbolColor: string = legendOption.visible ? legendOption.fill : '#D3D3D3';
    let shape: string = (legendOption.shape === 'SeriesType') ? legendOption.type : legendOption.shape;
    const strokewidth: number = 1;
    let symbolOption: PathOptions = createPathOption(
        legend.legendID + '_shape_' + legendIndex, symbolColor, strokewidth,
        symbolColor, legend.opacity as Required<number>, legendOption.dashArray as Required<string>, '');
    const textSize: PieChartSizeProps = measureText(legendOption.text, legend.textStyle as Required<PieChartFontProps>,
                                                    chart.themeStyle.legendLabelFont);
    const x: number = legend.inversed && !legend.isRtlEnable ? legendOption.location.x + textSize.width +
        (legend.shapePadding as Required<number>) : legendOption.location.x;
    const y: number = legendOption.location.y;
    const shapeWidth: number = shape === 'Rectangle' && !legend.shapeWidth ? 8 : (legend.shapeWidth || 10) as Required<number>;
    const shapeHeight: number = shape === 'Rectangle' && !legend.shapeHeight ? 8 : (legend.shapeHeight || 10) as Required<number>;
    symbolOption = calculateShapes({ x: x, y: y }, {
        width: shapeWidth,
        height: shapeHeight
    }, shape, symbolOption, legendOption.url as Required<string>) as PathOptions;
    legendOption.symbolOption = symbolOption;
    if (legendOption.type === 'Doughnut' && shape === 'Doughnut') {
        let markerOption: PathOptions = createPathOption(
            legend.legendID + '_shape_marker_' + legendIndex, symbolColor, strokewidth,
            symbolColor, legend.opacity as Required<number>, legendOption.dashArray as Required<string>, '');
        shape = 'Circle';
        markerOption = calculateShapes({ x: x, y: y }, {
            width: ((legend.shapeWidth || 10) as Required<number>) / 2,
            height: ((legend.shapeHeight || 10) as Required<number>) / 2
        }, shape,
                                       markerOption, legendOption.url as Required<string>) as PathOptions;
        legendOption.markerOption = markerOption;
    }
}

/**
 * To render legend text for chart.
 *
 * @param {LegendOptions} legendOption - Options for the legend.
 * @param {TextOption} textOptions - Options for rendering the text.
 * @param {number} legendIndex - Index of the legend.
 * @param {Chart} chart - The chart object.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void}
 * @private
 */
export function renderText(
    legendOption: LegendOptions,
    textOptions: TextOption,
    legendIndex: number,
    chart: Chart,
    legend: BaseLegend
): void {
    const hiddenColor: string = '#D3D3D3';
    const fontcolor: string = legendOption.visible ? (legend.textStyle as Required<PieChartFontProps>).color ||
        chart.themeStyle.legendLabelFont.color as string : hiddenColor;
    textOptions.fill = fontcolor;
    textOptions.id = legend.legendID + '_text_' + legendIndex;
    textOptions.text = (legendOption.textCollection?.length as Required<number>) > 0 ?
        legendOption.textCollection as Required<string[]> : legendOption.text;
    if (legend.inversed && !legend.isRtlEnable) {
        textOptions.x = legendOption.location.x - (((legend.shapeWidth || 10) as Required<number>) / 2);
    }
    else if (legend.isRtlEnable) {
        const textWidth: number = measureText(legendOption.text, legend.textStyle as Required<PieChartFontProps>,
                                              chart.themeStyle.legendLabelFont).width;
        textOptions.x = legendOption.location.x - (((legendOption.textCollection as Required<string[]>).length > 1 ?
            textWidth / (legendOption.textCollection as Required<string[]>).length : textWidth) +
            ((legend.shapeWidth || 10) as Required<number>) / 2 + (legend.shapePadding as Required<number>));
    }
    else {
        textOptions.x = legendOption.location.x + (((legend.shapeWidth || 10) as Required<number>) / 2) +
            (legend.shapePadding as Required<number>);
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
 * @param {BaseLegend} legend - The legend object
 * @param {Function} [updateTransform] - Callback to update the transform of the legend
 * @param {Function} [updatePageText] - Callback to update the text of the legend page
 * @returns {number} The calculated size after translating the page
 * @private
 */
export function translatePage(
    page: number,
    pageNumber: number,
    legend: BaseLegend,
    updateTransform?: (transform: string) => void,
    updatePageText?: (text: string) => void
): number {
    const size: number = (page ? getPageHeight(legend.pageHeights as Required<number[]>, page, legend) : 0);
    (legend.clipRect as Required<RectOption>).height = (legend.pageHeights as Required<number[]>)[page as number] -
        (legend.isTitle ? (legend.legendTitleSize as Required<PieChartSizeProps>).height : 0) -
        (legend.containerPadding?.top as Required<number>) - (legend.containerPadding?.bottom as Required<number>);
    const translate: string = 'translate(0,-' + size + ')';
    legend.legendTranslate = translate;
    if (updateTransform) {
        updateTransform(translate);
    }
    if (legend.enablePages) {
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
        sum += pageHeights[i as number] - ((legend.isTitle)
            ? (legend.legendTitleSize as Required<PieChartSizeProps>).height : 0);
    }
    return sum;
}

/**
 * To change legend pages for chart
 *
 * @param {boolean} pageUp - Indicates whether to move the page up.
 * @param {Function} updateTransform - Callback to update the transform of the legend.
 * @param {Function} updatePageText - Callback to update the text of the legend page.
 * @param {BaseLegend} legend - The legend object.
 * @returns {void}
 * @private
 */
export function changePage(
    pageUp: boolean,
    updateTransform: (transform: string) => void,
    updatePageText: (text: string) => void,
    legend: BaseLegend
): void {
    const page: number = legend.currentPage as Required<number>;
    if (pageUp && page > 1) {
        translatePage((page - 2), (page - 1), legend, updateTransform, updatePageText);
    } else if (!pageUp && page < (legend.totalPages as Required<number>)) {
        translatePage(page, (page + 1), legend, updateTransform, updatePageText);
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
 * @param {number} index - The index of the legend item
 * @param {Chart} chart - The chart object
 * @param {BaseLegend} legend - The legend object
 * @returns {void}
 * @private
 */
export function LegendClick(index: number, chart: Chart, legend: BaseLegend): void {
    const pointIndex: number = index;
    const currentSeries: SeriesProperties = chart.visibleSeries[0];
    const point: Points = pointByIndex(pointIndex, currentSeries.points) as Points;
    const chartLegend: LegendOptions = legendByIndex(pointIndex, legend.legendCollections as LegendOptions[]) as LegendOptions;
    const legendClickArgs: PieLegendClickEvent = {
        text: chartLegend.text, shape: chartLegend.shape,
        seriesName: currentSeries.name as string, cancel: false
    };
    chart?.onLegendClick?.(legendClickArgs);

    legend.shape = legendClickArgs.shape;
    if (!legendClickArgs.cancel) {
        point.visible = !point.visible;
        chartLegend.visible = (point.visible as Required<boolean>);
        currentSeries.sumOfPoints += point.visible ? point.y : -point.y;
        if (chartLegend.markerOption) {
            chartLegend.markerOption.fill = chartLegend.visible ? point.color as Required<string> : '#D3D3D3';
            chartLegend.markerOption.stroke = chartLegend.visible ? point.color as Required<string> : '#D3D3D3';
        }
        if (chartLegend.symbolOption) {
            chartLegend.symbolOption.fill = chartLegend.visible ? point.color as Required<string> : '#D3D3D3';
            //chartLegend.symbolOption.stroke = chartLegend.visible ? point.color as Required<string> : '#D3D3D3';
        }
        if (chartLegend.textOption) {
            chartLegend.textOption.fill = chartLegend.visible ? (legend.textStyle as Required<PieChartFontProps>).color ||
                chart.themeStyle.legendLabelFont.color : '#D3D3D3';
        }
        chart.animateSeries = false;
        chart.isLegendClicked = true;
        const chartId: string = chart.element.id;
        const triggerSeriesRender: (chartId?: string) => void = useRegisterSeriesRender();
        triggerSeriesRender(chartId);
    }
}

/**
 * method to get point from index.
 *
 * @param {number} index - The index of the point to retrieve.
 * @param {Points[]} points - The array of points in the data set.
 * @returns {Points} - The point retrieved from the specified index.
 * @private
 */
export function pointByIndex(index: number, points: Points[]): Points | null {
    for (const point of points) {
        if (point.index === index) {
            return point;
        }
    }
    return null;
}

/**
 * To get legend by index.
 *
 * @param {number} index - The index of the legend.
 * @param {LegendOptions[]} legendCollections - The array of legend options.
 * @returns {LegendOptions} - Return legend index.
 * @private
 */
export function legendByIndex(index: number, legendCollections: LegendOptions[]): LegendOptions | null {
    for (const legend of legendCollections) {
        if (legend.pointIndex === index) {
            return legend;
        }
    }
    return null;
}

/**
 * Calculates the shapes based on the specified parameters.
 *
 * @param {PieChartLocationProps} location - The location for the shape.
 * @param {PieChartSizeProps} size - The size of the shape.
 * @param {string} shape - The type of shape.
 * @param {PathOptions} options - Additional options for the path.
 * @param {string} url - A URL for the shape if applicable.
 * @returns {PathOptions} The calculated shapes.
 * @private
 */
export const calculateShapes: (
    location: PieChartLocationProps,
    size: PieChartSizeProps,
    shape: string,
    options: PathOptions,
    url: string
) => PathOptions = (
    location: PieChartLocationProps,
    size: PieChartSizeProps,
    shape: string,
    options: PathOptions,
    url: string
): PathOptions => {
    let dir: string;
    const width: number = size.width;
    const height: number = size.height;
    const space: number = 2;
    const lx: number = location.x;
    const ly: number = location.y;
    const y: number = location.y + (-height / 2);
    const x: number = location.x + (-width / 2);
    const eq: number = 72;
    let xVal: number;
    let yVal: number;
    switch (shape) {
    case 'Circle':
        merge(options, { 'rx': width / 2, 'ry': height / 2, 'cx': lx, 'cy': ly });
        break;
    case 'Plus':
        dir = 'M' + ' ' + x + ' ' + ly + ' ' + 'L' + ' ' + (lx + (width / 2)) + ' ' + ly + ' ' +
                    'M' + ' ' + lx + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + lx + ' ' +
                    (ly + (-height / 2));
        merge(options, { 'd': dir });
        break;
    case 'Cross':
        dir = 'M' + ' ' + x + ' ' + (ly + (-height / 2)) + ' ' + 'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' +
                    'M' + ' ' + x + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (-height / 2));
        merge(options, { 'd': dir });
        break;
    case 'Multiply':
        dir = 'M ' + (lx) + ' ' + (ly) + ' L ' +
                    (lx) + ' ' + (ly) + ' M ' +
                    (lx) + ' ' + (ly) + ' L ' + (lx) + ' ' + (ly);
        merge(options, { 'd': dir, stroke: options.fill });
        break;
    case 'HorizontalLine':
        dir = 'M' + ' ' + x + ' ' + ly + ' ' + 'L' + ' ' + (lx + (width / 2)) + ' ' + ly;
        merge(options, { 'd': dir });
        break;
    case 'VerticalLine':
        dir = 'M' + ' ' + lx + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + lx + ' ' + (ly + (-height / 2));
        merge(options, { 'd': dir });
        break;
    case 'Diamond':
        dir = 'M' + ' ' + x + ' ' + ly + ' ' +
                    'L' + ' ' + lx + ' ' + (ly + (-height / 2)) + ' ' +
                    'L' + ' ' + (lx + (width / 2)) + ' ' + ly + ' ' +
                    'L' + ' ' + lx + ' ' + (ly + (height / 2)) + ' ' +
                    'L' + ' ' + x + ' ' + ly + ' z';
        merge(options, { 'd': dir });
        break;
    case 'Rectangle':
        dir = 'M' + ' ' + x + ' ' + (ly + (-height / 2)) + ' ' +
                    'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (-height / 2)) + ' ' +
                    'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' +
                    'L' + ' ' + x + ' ' + (ly + (height / 2)) + ' ' +
                    'L' + ' ' + x + ' ' + (ly + (-height / 2)) + ' z';
        merge(options, { 'd': dir });
        break;
    case 'Triangle':
        dir = 'M' + ' ' + x + ' ' + (ly + (height / 2)) + ' ' +
                    'L' + ' ' + lx + ' ' + (ly + (-height / 2)) + ' ' +
                    'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' +
                    'L' + ' ' + x + ' ' + (ly + (height / 2)) + ' z';
        merge(options, { 'd': dir });
        break;
    case 'InvertedTriangle':
        dir = 'M' + ' ' + (lx + (width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                    'L' + ' ' + lx + ' ' + (ly + (height / 2)) + ' ' +
                    'L' + ' ' + (lx - (width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                    'L' + ' ' + (lx + (width / 2)) + ' ' + (ly - (height / 2)) + ' z';
        merge(options, { 'd': dir });
        break;
    case 'Pentagon':
        dir = '';
        for (let i: number = 0; i <= 5; i++) {
            xVal = (width / 2) * Math.cos((Math.PI / 180) * (i * eq));
            yVal = (height / 2) * Math.sin((Math.PI / 180) * (i * eq));
            if (i === 0) {
                dir = 'M' + ' ' + (lx + xVal) + ' ' + (ly + yVal) + ' ';
            } else {
                dir = dir.concat('L' + ' ' + (lx + xVal) + ' ' + (ly + yVal) + ' ');
            }
        }
        dir = dir.concat('Z');
        merge(options, { 'd': dir });
        break;
    case 'Image':
        merge(options, { 'href': url, 'height': height, 'width': width, x: x, y: y });
        break;
    case 'Star': {
        const cornerPoints: number = 5;
        const outerRadius: number = Math.min(width, height) / 2;
        const innerRadius: number = outerRadius / 2;
        const angle: number = Math.PI / cornerPoints;
        let starPath: string = '';
        for (let i: number = 0; i < 2 * cornerPoints; i++) {
            const radius: number = (i % 2 === 0) ? outerRadius : innerRadius;
            const currentX: number = lx + radius * Math.cos(i * angle - Math.PI / 2);
            const currentY: number = ly + radius * Math.sin(i * angle - Math.PI / 2);
            starPath += (i === 0 ? 'M' : 'L') + currentX + ',' + currentY;
        }
        starPath += 'Z';
        merge(options, { 'd': starPath });
        break;
    }
    case 'Pie':
    case 'Doughnut': {
        options.stroke = 'transparent';
        const r: number = Math.min(height, width) / 2;
        dir = getAccumulationLegend(lx, ly, r, height, width);
        merge(options, { 'd': dir });
        break;
    }
    case 'UpArrow':
        options.fill = options.stroke;
        options.stroke = 'transparent';
        dir = 'M' + ' ' + (lx + (-width / 2)) + ' ' + (ly + (height / 2)) + ' ' +
                    'L' + ' ' + (lx) + ' ' + (ly - (height / 2)) + ' ' +
                    'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (height / 2)) +
                    'L' + ' ' + (lx + (width / 2) - space) + ' ' + (ly + (height / 2)) + ' ' +
                    'L' + ' ' + (lx) + ' ' + (ly - (height / 2) + (2 * space)) +
                    'L' + (lx - (width / 2) + space) + ' ' + (ly + (height / 2)) + ' Z';
        merge(options, { 'd': dir });
        break;
    case 'DownArrow':
        options.fill = options.stroke;
        options.stroke = 'transparent';
        dir = 'M' + ' ' + (lx - (width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                    'L' + ' ' + (lx) + ' ' + (ly + (height / 2)) + ' ' +
                    'L' + ' ' + (lx + (width / 2)) + ' ' + (ly - (height / 2)) +
                    'L' + ' ' + (lx + (width / 2) - space) + ' ' + (ly - (height / 2)) + ' ' +
                    'L' + ' ' + (lx) + ' ' + (ly + (height / 2) - (2 * space)) +
                    'L' + (lx - (width / 2) + space) + ' ' + (ly - (height / 2)) + ' Z';
        merge(options, { 'd': dir });
        break;
    case 'RightArrow':
        options.fill = options.stroke;
        options.stroke = 'transparent';
        dir = 'M' + ' ' + (lx + (-width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                    'L' + ' ' + (lx + (width / 2)) + ' ' + (ly) + ' ' + 'L' + ' ' +
                    (lx + (-width / 2)) + ' ' + (ly + (height / 2)) + ' L' + ' ' + (lx + (-width / 2)) + ' ' +
                    (ly + (height / 2) - space) + ' ' + 'L' + ' ' + (lx + (width / 2) - (2 * space)) + ' ' + (ly) +
                    ' L' + (lx + (-width / 2)) + ' ' + (ly - (height / 2) + space) + ' Z';
        merge(options, { 'd': dir });
        break;
    case 'LeftArrow':
        options.fill = options.stroke;
        options.stroke = 'transparent';
        dir = 'M' + ' ' + (lx + (width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                    'L' + ' ' + (lx + (-width / 2)) + ' ' + (ly) + ' ' + 'L' + ' ' +
                    (lx + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' +
                    (lx + (width / 2)) + ' ' + (ly + (height / 2) - space) + ' L' + ' ' + (lx + (-width / 2) + (2 * space))
                    + ' ' + (ly) + ' L' + (lx + (width / 2)) + ' ' + (ly - (height / 2) + space) + ' Z';
        merge(options, { 'd': dir });
        break;
    }
    return options;
};

/**
 * Generates the legend for accumulation chart.
 *
 * @param {number} locX - The x-coordinate of the legend position.
 * @param {number} locY - The y-coordinate of the legend position.
 * @param {number} r - The radius of the chart.
 * @param {number} height - The height of the legend.
 * @param {number} width - The width of the legend.
 * @returns {string} - The generated legend.
 */
function getAccumulationLegend(locX: number, locY: number, r: number, height: number, width: number): string {
    const cartesianlarge: PieChartLocationProps = degreeToLocation(270, r, { x: locX, y: locY });
    const cartesiansmall: PieChartLocationProps = degreeToLocation(270, r, { x: locX + (width / 10), y: locY });
    return 'M' + ' ' + locX + ' ' + locY + ' ' + 'L' + ' ' + (locX + r) + ' ' + (locY) + ' ' + 'A' + ' ' + (r) + ' ' + (r) +
        ' ' + 0 + ' ' + 1 + ' ' + 1 + ' ' + cartesianlarge.x + ' ' + cartesianlarge.y + ' ' + 'Z' + ' ' + 'M' + ' ' + (locX +
            (width / 10)) + ' ' + (locY - (height / 10)) + ' ' + 'L' + (locX + (r)) + ' ' + (locY - height / 10) + ' ' + 'A' + ' '
        + (r) + ' ' + (r) + ' ' + 0 + ' ' + 0 + ' ' + 0 + ' ' + cartesiansmall.x + ' ' + cartesiansmall.y + ' ' + 'Z';
}
