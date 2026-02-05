// ChartSubTitleRenderer.tsx
import { ForwardedRef, forwardRef, JSX, useEffect, useLayoutEffect } from 'react';
import { useLayout } from '../layout/LayoutContext';
import { PieChartSizeProps, PieChartTitleProps, PieChartFontProps, PieChartMarginProps } from '../base/interfaces';
import { getMaxRotatedTextSize, getTextAnchor, getTitle, measureText, titlePositionX } from '../utils/helper';
import { TextAnchor, TextOverflow, TitlePosition } from '../../common';
import { HorizontalAlignment } from '@syncfusion/react-base';
import { Chart, Rect, TitleOptions } from '../base/internal-interfaces';

/**
 * `PieChartSubTitleRenderer` is a functional component used to render the subtitle of the chart.
 * It participates in the layout system and reports its measurements during the measuring phase.
 *
 * @param {PieChartTitleProps} props - Contains properties required for rendering the chart subtitle,
 * including the title content and styling options.
 *
 * @returns {JSX.Element | null} The subtitle element or null if no subtitle is defined.
 */
export const ChartSubTitleRenderer: React.ForwardRefExoticComponent<PieChartTitleProps & React.RefAttributes<SVGTextElement>> =
    forwardRef<SVGTextElement, PieChartTitleProps>((props: PieChartTitleProps, ref: React.ForwardedRef<SVGTextElement>) => {
        const { layoutRef, phase, reportMeasured, triggerRemeasure } = useLayout();
        useLayoutEffect(() => {
            if (phase === 'measuring') {
                if (props.text) {
                    const chart: Chart = layoutRef.current;
                    const margin: Required<PieChartMarginProps> = chart.margin;
                    const rect: Rect = {
                        x: margin.left, y: margin.top, width: chart.availableSize.width - margin.left - margin.right,
                        height: chart.availableSize.height - margin.top - margin.bottom
                    };
                    const titleCollection: string[] = getTitle(
                        props.text, props.font as PieChartFontProps, ((props.position === 'Top' || props.position === 'Bottom') ? rect.width : rect.height),
                        chart.enableRtl, chart.themeStyle.chartSubTitleFont, (props.textOverflow as TextOverflow));
                    const titleOptions: TitleOptions = computeSubtitlePosition(
                        chart, props, props.font as PieChartFontProps, titleCollection);
                    chart.subTitleSettings = titleOptions;
                }
                reportMeasured('ChartSubTitle');
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
                {subTitleBorder((layoutRef.current), props)}
                {renderSubTitleElement((layoutRef.current), props, ref)}
            </>
        );
    });

/**
 * Computes the position for the chart subtitle based on the chart dimensions and text style.
 *
 * @param {Chart} chart - The chart object containing dimensions and margin details.
 * @param {PieChartTitleProps} subtitleProps - The style settings for the subtitle text.
 * @param {PieChartFontProps} textStyle - The text style model for the subtitle.
 * @param {string[]} subTitle - An array of strings representing the subtitle text lines.
 * @returns {TitleOptions} The calculated position and options for rendering the subtitle.
 * @private
 */
function computeSubtitlePosition(chart: Chart, subtitleProps: PieChartTitleProps, textStyle: PieChartFontProps,
                                 subTitle: string[]): TitleOptions {
    const margin: Required<PieChartMarginProps> = chart.margin;
    let subTitleSize: PieChartSizeProps;
    let maxWidth: number = 0;
    let maxHeight: number = 0;
    subTitle.forEach((text: string) => {
        const size: PieChartSizeProps = measureText(text, textStyle, chart.themeStyle.chartSubTitleFont);
        maxWidth = Math.max(maxWidth, size.width);
        maxHeight = Math.max(maxHeight, size.height);
    });
    subTitleSize = { height: maxHeight, width: maxWidth };
    const rect: Rect = {
        x: margin.left, y: margin.top, width: chart.availableSize.width - margin.left - margin.right,
        height: chart.availableSize.height - margin.top - margin.bottom
    };
    let positionX: number = titlePositionX(rect, subtitleProps.align as HorizontalAlignment) + (subtitleProps.border?.width as number);
    let positionY: number = 0;
    let rotation: string = '';
    const subtitleBorderWidth: number = subtitleProps.border?.width || 0;
    const textAnchor: string = getTextAnchor(
        subtitleProps.align as HorizontalAlignment, chart.enableRtl, subtitleProps.position as TitlePosition);
    const padding: number = 5;
    const chartAreaPadding: number = 10;
    const titleoptions: TitleOptions = chart.titleSettings;
    const ascentOffset: number = subTitleSize.height * 3 / 4;
    let titleBorderX: number = 0;
    let titleBorderY: number = 0;
    let titleBorderWidth: number = 0;
    let titleBorderHeight: number = 0;
    let totalSubtitleHeight: number = 0;
    const elementSpacing: number = 5;
    const chartBorderWidth: number = chart.border?.width ?? 0;
    switch (subtitleProps.position) {
    case 'Top':
        if (titleoptions && titleoptions.position === 'Top') {
            positionY += (titleoptions.y * titleoptions.title.length) + titleoptions.borderWidth
                    + (subTitleSize.height) + (subtitleBorderWidth * 0.5) + padding;
            chart.clipRect.y += (subTitleSize.height * subTitle.length) + subtitleBorderWidth + chartAreaPadding;
            chart.clipRect.height -= (subTitleSize.height * subTitle.length) + subtitleBorderWidth + chartAreaPadding;
        } else {
            positionY += (subTitleSize.height * 3 / 4) + subtitleBorderWidth + margin.top;
            chart.clipRect.y += (subTitleSize.height * subTitle.length) + subtitleBorderWidth + chartAreaPadding;
            chart.clipRect.height -= (subTitleSize.height * subTitle.length) + subtitleBorderWidth + chartAreaPadding;
        }
        titleBorderX = positionX - (textAnchor === 'middle' ? (subTitleSize.width / 2) + elementSpacing : textAnchor === 'end' ? subTitleSize.width + elementSpacing : elementSpacing);
        titleBorderY = positionY - subTitleSize.height + (subTitleSize.height / 4);
        titleBorderWidth = subTitleSize.width + elementSpacing * 2;
        titleBorderHeight = subTitle.length * subTitleSize.height;
        break;
    case 'Bottom':
        totalSubtitleHeight = subTitleSize.height * subTitle.length;
        positionY = chart.availableSize.height - totalSubtitleHeight + ascentOffset - margin.bottom;
        chart.clipRect.height -= totalSubtitleHeight + subtitleBorderWidth + chartAreaPadding;
        titleBorderX = positionX - (textAnchor === 'middle' ? (subTitleSize.width / 2) + elementSpacing : textAnchor === 'end' ? subTitleSize.width + elementSpacing : elementSpacing);
        titleBorderY = positionY - subTitleSize.height + (subTitleSize.height / 4);
        titleBorderWidth = subTitleSize.width + elementSpacing * 2;
        titleBorderHeight = subTitle.length * subTitleSize.height;
        break;
    case 'Left':
        subTitleSize = getMaxRotatedTextSize(subTitle, -90, textStyle, chart.themeStyle.chartSubTitleFont);
        if (titleoptions && titleoptions.position === 'Left') {
            positionX = margin.left + (titleoptions.titleSize.width * titleoptions.title.length) + subTitleSize.width +
                    (titleoptions.borderWidth) + padding;
            chart.clipRect.x += (subTitleSize.width * subTitle.length) + subtitleBorderWidth + chartAreaPadding;
            chart.clipRect.width -= (subTitleSize.width * subTitle.length) + subtitleBorderWidth + chartAreaPadding;
        } else {
            positionX = margin.left + (subTitleSize.width * 3 / 4) + (subtitleBorderWidth * 0.5);
            chart.clipRect.x += (subTitleSize.width * subTitle.length) + subtitleBorderWidth + chartAreaPadding;
            chart.clipRect.width -= (subTitleSize.width * subTitle.length) + subtitleBorderWidth + chartAreaPadding;
        }
        positionY = subtitleProps.align === 'Left' ? margin.bottom + (subtitleBorderWidth * 0.5) + chartBorderWidth :
            subtitleProps.align === 'Right' ? chart.availableSize.height - margin.bottom - (subtitleBorderWidth * 0.5) - chartBorderWidth : chart.availableSize.height / 2;
        rotation = `rotate(-90, ${positionX}, ${positionY})`;
        titleBorderX = positionX - (textAnchor === 'middle' ? (subTitleSize.height / 2) + elementSpacing : textAnchor === 'end' ? subTitleSize.height + elementSpacing : elementSpacing);
        titleBorderY = positionY - subTitleSize.width + (subTitleSize.width / 4);
        titleBorderWidth = subTitleSize.height + elementSpacing * 2;
        titleBorderHeight = subTitle.length * subTitleSize.width;
        break;
    case 'Right':
        subTitleSize = getMaxRotatedTextSize(subTitle, 90, textStyle, chart.themeStyle.chartSubTitleFont);
        if (titleoptions && titleoptions.position === 'Right') {
            positionY = subtitleProps.align === 'Left' ? margin.bottom + (subtitleBorderWidth * 0.5) + chartBorderWidth :
                subtitleProps.align === 'Right' ? chart.availableSize.height - margin.bottom - (subtitleBorderWidth * 0.5) - chartBorderWidth : chart.availableSize.height / 2;
            positionX = chart.availableSize.width - (margin.right + (titleoptions.titleSize.width * titleoptions.title.length) +
                    subTitleSize.width + (titleoptions.borderWidth) + padding);
            chart.clipRect.x -= subtitleBorderWidth - margin.left;
            chart.clipRect.width -= (subTitleSize.width * subTitle.length) + margin.left + subtitleBorderWidth + chartAreaPadding;
        } else {
            positionX = chart.availableSize.width - (margin.right + (subTitleSize.width * 3 / 4) + (subtitleBorderWidth) * 0.5);
            chart.clipRect.x -= (subtitleBorderWidth) + chartAreaPadding - margin.left;
            chart.clipRect.width -= (subTitleSize.width * subTitle.length) + margin.left + subtitleBorderWidth + chartAreaPadding;
            positionY += chart.availableSize.height / 2;
        }
        positionY = subtitleProps.align === 'Left' ? margin.bottom + (subtitleBorderWidth * 0.5) + chartBorderWidth :
            subtitleProps.align === 'Right' ? chart.availableSize.height - margin.bottom - (subtitleBorderWidth * 0.5) - chartBorderWidth : chart.availableSize.height / 2;
        rotation = `rotate(90, ${positionX}, ${positionY})`;
        titleBorderX = positionX - (textAnchor === 'middle' ? (subTitleSize.height / 2) + elementSpacing : textAnchor === 'end' ? subTitleSize.height + elementSpacing : elementSpacing);
        titleBorderY = positionY - subTitleSize.width + (subTitleSize.width / 4);
        titleBorderWidth = subTitleSize.height + elementSpacing * 2;
        titleBorderHeight = subTitle.length * subTitleSize.width;
        break;
    case 'Custom':
        positionX = subtitleProps.x as number;
        positionY = subtitleProps.y as number;
        titleBorderX = positionX - (textAnchor === 'middle' ? (subTitleSize.width / 2) + elementSpacing : textAnchor === 'end' ? subTitleSize.width + elementSpacing : elementSpacing);
        titleBorderY = positionY - subTitleSize.height + (subTitleSize.height / 4);
        titleBorderWidth = subTitleSize.width + elementSpacing * 2;
        titleBorderHeight = subTitle.length * subTitleSize.height;
        break;
    }
    return {
        x: positionX, y: positionY,
        rotation: rotation,
        textAnchor: textAnchor,
        textStyle: textStyle,
        borderWidth: subtitleBorderWidth,
        title: subTitle,
        titleSize: subTitleSize,
        position: subtitleProps.position as TitlePosition,
        titleBorder: {
            x: titleBorderX,
            y: titleBorderY,
            width: titleBorderWidth,
            height: titleBorderHeight
        }
    };
}

/**
 * Renders the SVG rectangle element for the subtitle border using the specified options and properties.
 *
 * @param {Chart} chart - The chart instance to which the subtitle belongs.
 * @param {PieChartTitleProps} titleProps - Properties that provide details about the chart subtitle.
 * @returns {JSX.Element} A rectangle SVG element representing the border around the subtitle.
 * @private
 */
function subTitleBorder(chart: Chart, titleProps: PieChartTitleProps): JSX.Element {
    const titleOptions: TitleOptions = chart.subTitleSettings;
    return (titleOptions) && (
        <rect
            id={chart.element?.id + '_Sub_Title_Border'}
            width={titleOptions.titleBorder.width}
            height={titleOptions.titleBorder.height}
            x={titleOptions.titleBorder.x}
            y={titleOptions.titleBorder.y}
            fill={titleProps.background}
            stroke={titleProps.border?.color}
            strokeWidth={titleProps.border?.width}
            strokeDasharray={titleProps.border?.dashArray ?? ''}
            transform={titleOptions.rotation}
            rx={titleProps.border?.cornerRadius ?? 0.8}
            ry={titleProps.border?.cornerRadius ?? 0.8}
        />
    );
}

/**
 * Renders the SVG text element for the chart subtitle based on provided options and properties.
 *
 * @param {Chart} chart - The chart instance to which the subtitle belongs.
 * @param {PieChartTitleProps} titleProps - Properties that define the subtitle characteristics in the chart.
 * @param {ForwardedRef<SVGTextElement>} ref - A reference to the SVG text element.
 * @returns {JSX.Element} A text SVG element used to display the chart subtitle.
 * @private
 */
function renderSubTitleElement(chart: Chart, titleProps: PieChartTitleProps, ref: ForwardedRef<SVGTextElement>): JSX.Element {
    const subTitleOptions: TitleOptions = chart.subTitleSettings;
    return (subTitleOptions) && (
        <text
            ref={ref}
            id={chart.element?.id + '_ChartSubTitle'}
            x={subTitleOptions.x}
            y={subTitleOptions.y}
            textAnchor={subTitleOptions.textAnchor as TextAnchor}
            fill={titleProps.font?.color || chart.themeStyle.chartSubTitleFont.color}
            fontFamily={titleProps.font?.fontFamily || chart.themeStyle.chartSubTitleFont.fontFamily}
            fontSize={titleProps.font?.fontSize || chart.themeStyle.chartSubTitleFont.fontSize}
            fontWeight={titleProps.font?.fontWeight || chart.themeStyle.chartSubTitleFont.fontWeight}
            fontStyle={titleProps.font?.fontStyle || chart.themeStyle.chartSubTitleFont.fontStyle}
            transform={subTitleOptions.rotation}
            opacity={titleProps.font?.opacity}
            aria-label={titleProps.accessibility?.ariaLabel}
            role={titleProps.accessibility?.role}
            tabIndex={titleProps.accessibility?.focusable ? (titleProps.accessibility?.tabIndex ?? 0) : -1}
            style={{ outline: 'none' }}
        >
            {subTitleOptions.title.length > 1
                ? subTitleOptions.title.map((line: string, index: number) => (
                    <tspan key={index} x={subTitleOptions.x}
                        dy={index === 0 ? 0 : subTitleOptions.position === 'Left' || subTitleOptions.position === 'Right' ? subTitleOptions.titleSize.width : subTitleOptions.titleSize.height}>
                        {line}
                    </tspan>
                ))
                : subTitleOptions.title
            }
        </text>
    );
}
