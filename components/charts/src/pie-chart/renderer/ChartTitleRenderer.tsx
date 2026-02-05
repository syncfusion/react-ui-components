import { ForwardedRef, forwardRef, JSX, useContext, useEffect, useLayoutEffect } from 'react';
import { useLayout } from '../layout/LayoutContext';
import { PieChartMarginProps, PieChartSizeProps, PieChartTitleProps, PieChartFontProps } from '../base/interfaces';
import { ChartContext } from '../layout/ChartProvider';
import { TextAnchor, TextOverflow, TitlePosition } from '../../common';
import { HorizontalAlignment } from '@syncfusion/react-base';

import { getMaxRotatedTextSize, getMaxTextSize, getTextAnchor, getTitle, measureText, titlePositionX } from '../utils/helper';
import { Chart, Rect, TitleOptions } from '../base/internal-interfaces';

/**
 * `PieChartTitleRenderer` is a functional component that renders the main title of the chart.
 * It integrates with the chart layout system to measure and position the title appropriately.
 *
 * @param {PieChartTitleProps} props - Properties required to render the chart title,
 * including the title content, style, and alignment settings.
 *
 * @returns {JSX.Element | null} The rendered chart title element or null if not applicable.
 */
export const ChartTitleRenderer: React.ForwardRefExoticComponent<PieChartTitleProps & React.RefAttributes<SVGTextElement>> =
    forwardRef<SVGTextElement, PieChartTitleProps>((props: PieChartTitleProps, ref: React.ForwardedRef<SVGTextElement>) => {
        const { layoutRef, reportMeasured, phase, triggerRemeasure } = useLayout();
        const { chartSubTitle, chartProps } = useContext(ChartContext);
        useLayoutEffect(() => {
            if (phase === 'measuring') {
                if (props.text) {
                    const chart: Chart = layoutRef.current;
                    const margin: Required<PieChartMarginProps> = chart.margin;
                    const rect: Rect = {
                        x: margin.left, y: margin.top, width: chart.availableSize.width - margin.left - margin.right,
                        height: chart.availableSize.height - margin.top - margin.bottom
                    };
                    if (!chartProps.accessibility?.ariaLabel) {
                        chart.element.setAttribute('aria-label', props.text + '. Syncfusion interactive chart.');
                    }
                    const titleCollection: string[] = getTitle(props.text, props.font as PieChartFontProps, ((props.position === 'Top' ||
                        props.position === 'Bottom') ? rect.width : rect.height), chart.enableRtl, chart.themeStyle.chartTitleFont, props.textOverflow as TextOverflow);
                    const alignment: HorizontalAlignment = props.align as HorizontalAlignment;
                    const aligmentAnchor: string = getTextAnchor(alignment, chart.enableRtl, props.position as TitlePosition);
                    const titleOptions: TitleOptions = calculateTitlePosition(
                        props, chart, titleCollection, aligmentAnchor, chartSubTitle);
                    chart.titleSettings = titleOptions;
                }
                reportMeasured('ChartTitle');
            }
        }, [phase, layoutRef]);

        useEffect(() => {
            if (phase !== 'measuring') {
                triggerRemeasure();
            }
        }, [props?.font?.fontSize, props?.position, props.x,
            props?.y, props?.text, props?.align, props?.textOverflow]);

        return (phase === 'rendering' && props.text) && (
            <>
                {titleBorder((layoutRef.current), props)}
                {titleElement((layoutRef.current), props, ref)}
            </>
        );
    });

/**
 * Calculates the position of the chart title based on various settings such as text style and alignment.
 *
 * @param {PieChartTitleProps} titleProps - The style settings for the title text.
 * @param {Chart} chart - The chart object containing layout and data details.
 * @param {string[]} title - An array representing the title text lines.
 * @param {string} alignment - The alignment setting determining how the title is positioned.
 * @param {PieChartTitleProps} subTitle - Properties related to the subtitle of the chart.
 * @returns {TitleOptions} The calculated position and options for rendering the title.
 * @private
 */
function calculateTitlePosition(
    titleProps: PieChartTitleProps, chart: Chart, title: string[], alignment: string,
    subTitle: PieChartTitleProps): TitleOptions {
    const textStyle: PieChartFontProps = titleProps.font as PieChartFontProps;
    const margin: Required<PieChartMarginProps> = chart.margin;
    let titleSize: PieChartSizeProps = getMaxTextSize(title, textStyle, chart.themeStyle.chartTitleFont);
    let y: number = margin.top + ((titleSize.height) * 3 / 4); // ascent  - to align with vertical center
    const rect: Rect = {
        x: margin.left, y: margin.top, width: chart.availableSize.width - margin.left - margin.right,
        height: chart.availableSize.height - margin.top - margin.bottom
    };
    const textAlignment: HorizontalAlignment = titleProps.align as HorizontalAlignment;
    let x: number = titlePositionX(rect, textAlignment) + (titleProps.border?.width as number);
    let rotation: string = '';
    const borderWidth: number = (titleProps?.border?.width as number);
    const padding: number = subTitle && subTitle.text ? 10 : 15;
    const ascentOffset: number = titleSize.height * 3 / 4;
    let titleBorderX: number = 0;
    let titleBorderY: number = 0;
    let titleBorderWidth: number = 0;
    let titleBorderHeight: number = 0;
    const elementSpacing: number = 5;
    let totalTitleHeight: number = 0;
    const chartBorderWidth: number = chart.border?.width ?? 0;
    switch (titleProps.position) {
    case 'Top':
        titleSize = getMaxTextSize(title, textStyle, chart.themeStyle.chartTitleFont);
        y = margin.top + ((titleSize.height) * 3 / 4) + (borderWidth * 0.5);
        chart.clipRect.y += (titleSize.height * title.length) + borderWidth + padding;
        chart.clipRect.height -= (titleSize.height * title.length) + borderWidth + padding;
        titleBorderX = x - (alignment === 'middle' ? (titleSize.width / 2) + elementSpacing : alignment === 'end' ? titleSize.width + elementSpacing : elementSpacing);
        titleBorderY = y - titleSize.height + (titleSize.height / 4);
        titleBorderWidth = titleSize.width + elementSpacing * 2;
        titleBorderHeight = title.length * titleSize.height;
        break;
    case 'Bottom':
        totalTitleHeight = titleSize.height * title.length;
        y = chart.availableSize.height - margin.bottom - totalTitleHeight + ascentOffset - (borderWidth * 0.5);
        if (subTitle && subTitle.text && subTitle.position === 'Bottom') {
            const rect: Rect = {
                x: margin.left, y: margin.top, width: chart.availableSize.width - margin.left - margin.right,
                height: chart.availableSize.height - margin.top - margin.bottom
            };
            const subtitleCollection: string[] = getTitle(
                subTitle.text, subTitle.font as PieChartFontProps, (rect.width),
                false, chart.themeStyle.chartSubTitleFont, subTitle.textOverflow as TextOverflow);
            const subTitleSize: PieChartSizeProps = measureText(subtitleCollection[0], textStyle, chart.themeStyle.chartSubTitleFont);
            y -= (subTitleSize.height * subtitleCollection.length) + (subTitle.border?.width as number) + padding / 2;
        }
        chart.clipRect.height -= (titleSize.height * title.length) + borderWidth + padding;
        titleBorderX = x - (alignment === 'middle' ? (titleSize.width / 2) + elementSpacing : alignment === 'end' ? titleSize.width + elementSpacing : elementSpacing);
        titleBorderY = y - titleSize.height + (titleSize.height / 4);
        titleBorderWidth = titleSize.width + elementSpacing * 2;
        titleBorderHeight = title.length * titleSize.height;
        break;
    case 'Left':
        titleSize = getMaxRotatedTextSize(title, -90, textStyle, chart.themeStyle.chartTitleFont);
        x = margin.left + (titleSize.width * 3 / 4) + borderWidth;
        y = textAlignment === 'Left' ? margin.bottom + (borderWidth * 0.5) + chartBorderWidth :
            textAlignment === 'Right' ? chart.availableSize.height - margin.bottom - (borderWidth * 0.5) - chartBorderWidth : chart.availableSize.height / 2;
        rotation = `rotate(-90, ${x}, ${y})`;
        chart.clipRect.x += (titleSize.width * title.length) + borderWidth + padding;
        chart.clipRect.width -= (titleSize.width * title.length) + borderWidth + padding;
        titleBorderX = x - (alignment === 'middle' ? (titleSize.height / 2) + elementSpacing : alignment === 'end' ? titleSize.height + elementSpacing : elementSpacing);
        titleBorderY = y - titleSize.width + (titleSize.width / 4);
        titleBorderWidth = titleSize.height + elementSpacing * 2;
        titleBorderHeight = title.length * titleSize.width;
        break;
    case 'Right':
        titleSize = getMaxRotatedTextSize(title, 90, textStyle, chart.themeStyle.chartTitleFont);
        x = chart.availableSize.width - margin.right - (titleSize.width * 3 / 4) - borderWidth * 0.5;
        y = textAlignment === 'Left' ? margin.bottom + (borderWidth * 0.5) + chartBorderWidth :
            textAlignment === 'Right' ? chart.availableSize.height - margin.bottom - (borderWidth * 0.5) - chartBorderWidth : chart.availableSize.height / 2;
        rotation = `rotate(90, ${x}, ${y})`;
        chart.clipRect.x -= borderWidth + padding;
        chart.clipRect.width -= (titleSize.width * title.length) + borderWidth + padding;
        titleBorderX = x - (alignment === 'middle' ? (titleSize.height / 2) + elementSpacing : alignment === 'end' ? titleSize.height + elementSpacing : elementSpacing);
        titleBorderY = y - titleSize.width + (titleSize.width / 4);
        titleBorderWidth = titleSize.height + elementSpacing * 2;
        titleBorderHeight = title.length * titleSize.width;
        break;
    case 'Custom':
        x = titleProps.x as number;
        y = titleProps.y as number;
        titleBorderX = x - (alignment === 'middle' ? (titleSize.width / 2) + elementSpacing : alignment === 'end' ? titleSize.width + elementSpacing : elementSpacing);
        titleBorderY = y - titleSize.height + (titleSize.height / 4);
        titleBorderWidth = titleSize.width + elementSpacing * 2;
        titleBorderHeight = title.length * titleSize.height;
        break;
    }
    return {
        x: x, y: y,
        rotation: rotation,
        textStyle: textStyle,
        title: title,
        titleSize: titleSize,
        textAnchor: alignment,
        borderWidth: borderWidth,
        position: titleProps.position as TitlePosition,
        titleBorder: {
            x: titleBorderX,
            y: titleBorderY,
            width: titleBorderWidth,
            height: titleBorderHeight
        }
    };
}

/**
 * Renders the border for the chart title based on the provided title options and properties.
 *
 * @param {Chart} chart - The chart instance to which the title belongs.
 * @param {PieChartTitleProps} titleProps - The properties containing details of the chart title.
 * @returns {JSX.Element} A rectangle SVG element representing the border of the chart title.
 * @private
 */
function titleBorder(chart: Chart, titleProps: PieChartTitleProps): JSX.Element {
    const titleOptions: TitleOptions = chart.titleSettings;
    return (titleOptions) && (
        <rect
            id={chart.element?.id + '_Title_Border'}
            width={titleOptions.titleBorder.width}
            height={titleOptions.titleBorder.height}
            x={titleOptions.titleBorder.x}
            y={titleOptions.titleBorder.y}
            fill={titleProps.background}
            stroke={titleProps.border?.color}
            strokeWidth={titleProps.border?.color}
            strokeDasharray={titleProps.border?.dashArray}
            transform={titleOptions.rotation}
            rx={titleProps.border?.cornerRadius}
            ry={titleProps.border?.cornerRadius}
        />);
}

/**
 * Renders the text element for the chart title using the given options and properties.
 *
 * @param {Chart} chart - The chart instance to which the title belongs.
 * @param {PieChartTitleProps} titleProps - The properties that define the title's attributes in the chart.
 * @param {ForwardedRef<SVGTextElement>} ref - The reference to the SVG text element.
 * @returns {JSX.Element} A text SVG element used to display the chart title.
 * @private
 */
function titleElement(chart: Chart, titleProps: PieChartTitleProps, ref: ForwardedRef<SVGTextElement>): JSX.Element {
    const titleOptions: TitleOptions = chart.titleSettings;
    return (titleOptions) && (
        <text
            ref={ref}
            id={chart.element?.id + '_ChartTitle'}
            x={titleOptions.x}
            y={titleOptions.y}
            textAnchor={titleOptions.textAnchor as TextAnchor}
            fill={titleProps.font?.color || chart.themeStyle.chartTitleFont.color}
            fontFamily={titleProps.font?.fontFamily || chart.themeStyle.chartTitleFont.fontFamily}
            fontSize={titleProps.font?.fontSize || chart.themeStyle.chartTitleFont.fontSize}
            fontWeight={titleProps.font?.fontWeight || chart.themeStyle.chartTitleFont.fontWeight}
            fontStyle={titleProps.font?.fontStyle || chart.themeStyle.chartTitleFont.fontStyle}
            transform={titleOptions.rotation}
            opacity={titleProps.font?.opacity}
            aria-label={titleProps.accessibility?.ariaLabel}
            role={titleProps.accessibility?.role}
            tabIndex={titleProps.accessibility?.focusable ? titleProps.accessibility?.tabIndex : -1}
            style={{ outline: 'none' }}
        >
            {titleOptions.title.length > 1
                ? titleOptions.title.map((line: string, index: number) => (
                    <tspan key={index} x={titleOptions.x}
                        dy={index === 0 ? 0 : titleOptions.position === 'Left' || titleOptions.position === 'Right' ? titleOptions.titleSize.width : titleOptions.titleSize.height}>
                        {line}
                    </tspan>
                ))
                : titleOptions.title
            }
        </text>
    );
}
