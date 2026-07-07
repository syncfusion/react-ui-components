import { ChartMultiLevelLabelProps, ChartMultiLevelLabelCategoryProps, MajorTickLines, MultiLevelLabelClickEvent } from '../../base/interfaces';
import { valueToCoefficient, measureText, useTextTrim, useTextWrap } from '../../utils/helper';
import { AxisModel, Rect, TextStyleModel, ChartSizeProps, AxisMultiLabelRenderEventArgs, Chart, TextOption, ChartMultiLevelLabelsProps } from '../../chart-area/chart-interfaces';
import { JSX } from 'react';
import { HorizontalAlignment, isNullOrUndefined } from '@syncfusion/react-base';
import { AxisLabelPosition } from '../../base/enum';

/**
 * Renders the multilevel labels for the X-axis.
 *
 * @param {ChartMultiLevelLabelProps[]} labels - Collection of multi-level label configurations to be rendered on the X-axis.
 * @returns {boolean} Returns the rendered JSX element containing multi-level labels, or null if no labels are rendered.
 * @private
 */
export function hasValidMultiLevelLabels(labels?: ChartMultiLevelLabelProps[]): boolean {
    return !!labels?.some((level: ChartMultiLevelLabelProps) =>
        level.categories?.some((category: ChartMultiLevelLabelCategoryProps) => {
            const hasText: boolean =
                typeof category.text === 'string' && category.text.trim() !== '';
            const hasStart: boolean =
                category.start !== null && category.start !== undefined && String(category.start).trim() !== '';
            const hasEnd: boolean =
                category.end !== null && category.end !== undefined && String(category.end).trim() !== '';
            return hasText && hasStart && hasEnd;
        })
    );
}

/**
 * Gets the height of multilevel labels for the axis.
 *
 * @param {AxisModel} axis - The axis model that defines properties and behavior of the axis.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @returns {void}
 * @private
 */
export function getMultilevelLabelsHeight(axis: AxisModel, chart: Chart): void {
    const isVerticalAxis: boolean = axis.orientation === 'Vertical';
    const axisMultiLabelMeta: ChartMultiLevelLabelsProps =
        axis.multiLevelLabels as ChartMultiLevelLabelsProps;
    if (!hasValidMultiLevelLabels(axis.multiLevelLabels as ChartMultiLevelLabelProps[])) {
        axis.multiLevelLabelHeight = 0;
        if (axisMultiLabelMeta) {
            if (isVerticalAxis) {
                axisMultiLabelMeta.yAxisPrevHeight = [];
                axisMultiLabelMeta.yAxisMultiLabelHeight = [];
            } else {
                axisMultiLabelMeta.xAxisPrevHeight = [];
                axisMultiLabelMeta.xAxisMultiLabelHeight = [];
            }
        }
        return;
    }
    let totalMultiLevelSize: number = 0;
    const multiLevelLabelsHeight: number[] = [];
    const previousLevelOffsets: number[] = [];
    const levelPadding: number = 10;
    const axisLength: number = isVerticalAxis ? axis.rect.height : axis.rect.width;
    let measuredLabelSize: ChartSizeProps;
    let labelHeight: number;
    let categorySpan: number;
    let maxLabelBorderWidth: number = 0;
    axis.multiLevelLabels?.forEach(
        (multiLevelConfig: ChartMultiLevelLabelProps, index: number) => {
            let maximumHeight: number = 0;
            const borderWidth: number = multiLevelConfig.border?.width as number;
            maxLabelBorderWidth = Math.max(maxLabelBorderWidth, borderWidth);
            multiLevelConfig.categories?.forEach(
                (categoryConfig: ChartMultiLevelLabelCategoryProps, categoryIndex: number) => {
                    if (categoryConfig.text !== '' && categoryConfig.start !== null && categoryConfig.end !== null) {
                        measuredLabelSize = measureText(categoryConfig.text, (multiLevelConfig.textStyle) as TextStyleModel,
                                                        chart.themeStyle.axisLabelFont);
                        const availableWidth: number = categoryConfig.maximumTextWidth ??
                            (valueToCoefficient(typeof categoryConfig.end === 'string' ? Number(new Date(categoryConfig.end)) : (categoryConfig.end as number), axis) *
                                axisLength - valueToCoefficient(typeof categoryConfig.start === 'string' ? Number(new Date(categoryConfig.start)) : (categoryConfig.start as number), axis) * axisLength);
                        let wrappedText: string | string[] = categoryConfig.text;
                        if (multiLevelConfig.overflow === 'Wrap' && !isVerticalAxis) {
                            wrappedText = useTextWrap(
                                categoryConfig.text, availableWidth - levelPadding, (multiLevelConfig.textStyle) as TextStyleModel,
                                chart.enableRtl, chart.themeStyle.axisLabelFont, undefined, undefined);
                        }
                        const lineCount: number = typeof wrappedText === 'string' ? 1 : (Array.isArray(wrappedText) ? wrappedText.length : 1);
                        labelHeight = isVerticalAxis ? (categoryConfig.maximumTextWidth ?? measuredLabelSize.width) :
                            (measuredLabelSize.height * lineCount);
                        labelHeight += 2 * (multiLevelConfig.border?.width as number);
                        categorySpan = (categoryConfig.maximumTextWidth ??
                                (valueToCoefficient(typeof categoryConfig.end === 'string' ? Number(new Date(categoryConfig.end)) : (categoryConfig.end as number), axis) *
                                    axisLength - valueToCoefficient(typeof categoryConfig.start === 'string'
                                    ? Number(new Date(categoryConfig.start)) : (categoryConfig.start as number), axis) * axisLength));
                        const categoryCount: number = axis.multiLevelLabels?.[index as number]?.categories?.length ?? 0;
                        if ((categoryIndex === 0 || categoryIndex === categoryCount - 1) &&
                            axis.labelStyle.placement === 'OnTicks' &&
                            axis.labelStyle.edgeLabelPlacement === 'Shift'
                        ) {
                            categorySpan = categorySpan / 2;
                        }
                        maximumHeight = Math.max(maximumHeight, labelHeight);
                    }
                }
            );
            if (maximumHeight > 0) {
                multiLevelLabelsHeight[index as number] = maximumHeight;
                previousLevelOffsets[index as number] = totalMultiLevelSize;
                totalMultiLevelSize += maximumHeight + levelPadding;
            }
        }
    );
    axis.multiLevelLabelHeight = totalMultiLevelSize > 0 ? totalMultiLevelSize + 2 * maxLabelBorderWidth + levelPadding : 0;
    if (isVerticalAxis) {
        axisMultiLabelMeta.yAxisMultiLabelHeight = multiLevelLabelsHeight;
        axisMultiLabelMeta.yAxisPrevHeight = previousLevelOffsets;
    } else {
        axisMultiLabelMeta.xAxisMultiLabelHeight = multiLevelLabelsHeight;
        axisMultiLabelMeta.xAxisPrevHeight = previousLevelOffsets;
    }
}

/**
 * Renders the multilevel labels for the X-axis.
 *
 * @param {ChartMultiLevelLabelProps[]} labels - Collection of multi-level label configurations to be rendered on the X-axis.
 * @param {AxisModel} axis - The axis model that defines properties and behavior of the X-axis.
 * @param {Rect} axisRect - The bounding rectangle that represents the axis layout area.
 * @param {number} axisIndex - The index of the current axis within the chart.
 * @param {string} chartId - The unique identifier of the chart instance.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @returns {JSX.Element | null} Returns the rendered JSX element containing multi-level labels, or null if no labels are rendered.
 * @private
 */
export function drawXAxisMultiLevelLabels(
    labels: ChartMultiLevelLabelProps[],
    axis: AxisModel,
    axisRect: Rect,
    axisIndex: number,
    chartId: string,
    chart: Chart
): JSX.Element | null {
    if (!hasValidMultiLevelLabels(labels)) {
        return null;
    }
    let labelTextX: number;
    let labelTextY: number;
    const labelPadding: number = 10;
    let labelStartPixelX: number;
    let pointIndex: number;
    let labelEndPixelX: number;
    let labelStartValue: number | Date;
    let labelEndValue: number | Date;
    const axisLabelHeight: number = (axis.maxLabelSize.height ?? 0) + (axis.labelStyle.padding ?? 0);
    let borderSvgPath: string = '';
    let labelSize: ChartSizeProps;
    const isOutside: boolean = axis.labelStyle.position === 'Outside';
    let availableLabelWidth: number;
    const leftTextAnchor: 'start' | 'end' = chart.enableRtl ? 'end' : 'start';
    const rightTextAnchor: 'start' | 'end' = chart.enableRtl ? 'start' : 'end';
    let textAnchorAlignment: 'start' | 'middle' | 'end' = leftTextAnchor;
    const isInversed: boolean = axis.isAxisInverse;
    let argsData: AxisMultiLabelRenderEventArgs;
    const opposedPosition: boolean = axis.isAxisOpposedPosition;
    let length: number;
    const scrollBarHeight: number = axis.scrollbarSettings?.enable || (isOutside && isNullOrUndefined(axis.crossAt)) ?
        (axis.scrollbarSettings?.thickness as number) : 0;
    const majorTickLinesHeight: number = axis.majorTickLines?.height ?? 0;
    const multiLevelLabelHeight: number = axis.multiLevelLabelHeight ?? 0;
    let clipRegionY: number;
    if (isOutside) {
        if (opposedPosition) {
            clipRegionY = axisRect.y - multiLevelLabelHeight - majorTickLinesHeight - axisLabelHeight - labelPadding;
        } else {
            clipRegionY = axisRect.y + majorTickLinesHeight + axisLabelHeight;
        }
    } else {
        clipRegionY = opposedPosition ? axisRect.y + axisLabelHeight + (labelPadding / 2)
            : axisRect.y + axisRect.height - axisLabelHeight - multiLevelLabelHeight - (labelPadding / 2);
    }
    let maxMultiLevelBorderWidth: number = 0;
    labels.forEach((level: ChartMultiLevelLabelProps) => {
        maxMultiLevelBorderWidth = Math.max(maxMultiLevelBorderWidth, level.border?.width as number);
    });
    const clipRegionPadding: number = maxMultiLevelBorderWidth;
    const multiLevelBaseY: number = clipRegionY;
    const clipPathId: string = `${chartId}_XAxis_Clippath_${axisIndex}`;
    const multiLevelLayout: ChartMultiLevelLabelsProps = (axis.multiLevelLabels) as ChartMultiLevelLabelsProps;
    const levelGroups: JSX.Element[] = [];
    labels.forEach((multiLevel: ChartMultiLevelLabelProps, levelIndex: number) => {
        pointIndex = 0;
        const categoryOptions: JSX.Element[] = [];
        multiLevel.categories?.forEach(
            (categoryLabel: ChartMultiLevelLabelCategoryProps, categoryIndex: number) => {
                if (categoryLabel.start == null || categoryLabel.end == null || categoryLabel.end === '') {
                    return;
                }
                length = multiLevel.categories?.length as number;
                borderSvgPath = '';
                labelStartValue = typeof categoryLabel.start === 'string' ? Number(new Date(categoryLabel.start)) : categoryLabel.start as number;
                labelEndValue = typeof categoryLabel.end === 'string' ? Number(new Date(categoryLabel.end)) : categoryLabel.end as number;
                const labelFontStyle: TextStyleModel = {
                    color: multiLevel.textStyle?.color as string,
                    fontSize: multiLevel.textStyle?.fontSize as string,
                    fontFamily: multiLevel.textStyle?.fontFamily as string,
                    fontWeight: multiLevel.textStyle?.fontWeight as string,
                    fontStyle: multiLevel.textStyle?.fontStyle as string,
                    opacity: multiLevel.textStyle?.opacity as number
                };
                argsData = {
                    cancel: false,
                    name: 'axisMultiLabelRender',
                    axis: axis,
                    text: categoryLabel.text,
                    textStyle: labelFontStyle as TextStyleModel,
                    alignment: (
                        (axis.multiLevelLabels as ChartMultiLevelLabelProps[])?.[levelIndex as number]?.alignment) as HorizontalAlignment
                };
                if (!argsData.cancel) {
                    labelStartPixelX = valueToCoefficient(labelStartValue, axis) * axisRect.width;
                    labelEndPixelX = valueToCoefficient(labelEndValue, axis) * axisRect.width;
                    labelEndPixelX = isInversed ? [labelStartPixelX, labelStartPixelX = labelEndPixelX][0] : labelEndPixelX;
                    labelSize = measureText(argsData.text, argsData.textStyle as TextStyleModel, chart.themeStyle.axisLabelFont);
                    availableLabelWidth = ((categoryLabel.maximumTextWidth === undefined) ? labelEndPixelX - labelStartPixelX :
                        categoryLabel.maximumTextWidth) - labelPadding;
                    labelTextX = labelStartPixelX + axisRect.x + labelPadding;
                    const previousLevelHeight: number = (multiLevelLayout.xAxisPrevHeight as number[])?.[levelIndex as number] ?? 0;
                    const currentLevelHeight: number = (multiLevelLayout.xAxisMultiLabelHeight as number[])?.[levelIndex as number] ??
                                                        labelSize.height;
                    const levelBorderY: number = isOutside ? (opposedPosition ? multiLevelBaseY + multiLevelLabelHeight -
                        previousLevelHeight - currentLevelHeight :
                        multiLevelBaseY + previousLevelHeight + (labelPadding / 2) + scrollBarHeight)
                        : (opposedPosition ? multiLevelBaseY + previousLevelHeight + (labelPadding / 2)
                            : multiLevelBaseY + multiLevelLabelHeight - previousLevelHeight - currentLevelHeight);
                    labelTextY = levelBorderY + currentLevelHeight / 2;
                    if (argsData.alignment === 'Center') {
                        labelTextX += (labelEndPixelX - labelStartPixelX - labelPadding) / 2;
                        textAnchorAlignment = 'middle';
                    } else if (argsData.alignment === 'Right') {
                        labelTextX = labelTextX + (labelEndPixelX - labelStartPixelX - labelPadding) -
                        (multiLevel.border?.width as number) / 2;
                        if (axis.labelStyle.placement === 'OnTicks' && (categoryIndex === 0 || categoryIndex === length - 1)) {
                            labelTextX += (labelEndPixelX - labelStartPixelX - labelPadding) / 2;
                            labelTextX = labelTextX - labelSize.width / 2;
                        }
                        textAnchorAlignment = rightTextAnchor;
                    } else {
                        textAnchorAlignment = leftTextAnchor;
                        labelTextX += multiLevel.border?.width as number / 2;
                    }
                    const textOption: TextOption = {
                        id: `${chartId}${levelIndex}_Axis_MultiLevelLabel_Level_${levelIndex}_Text_${categoryIndex}`,
                        x: labelTextX,
                        y: labelTextY,
                        anchor: textAnchorAlignment,
                        text: categoryLabel.text,
                        fill: argsData.textStyle.color || chart.themeStyle.axisLabelFont.color,
                        fontSize: argsData.textStyle.fontSize || chart.themeStyle.axisLabelFont.fontSize,
                        fontFamily: argsData.textStyle.fontFamily || chart.themeStyle.axisLabelFont.fontFamily,
                        fontWeight: argsData.textStyle.fontWeight || chart.themeStyle.axisLabelFont.fontWeight,
                        fontStyle: argsData.textStyle?.fontStyle || chart.themeStyle.axisLabelFont.fontStyle,
                        opacity: argsData.textStyle?.opacity || chart.themeStyle.axisLabelFont.opacity
                    };
                    if (multiLevel.overflow !== 'None') {
                        if (axis.labelStyle.edgeLabelPlacement && axis.labelStyle.placement === 'OnTicks') {
                            switch (axis.labelStyle.edgeLabelPlacement) {
                            case 'None':
                                break;
                            case 'Shift':
                                if ((categoryIndex === 0 || (isInversed && categoryIndex === length - 1))) {
                                    if (argsData.alignment === 'Center' && ((textOption.x < axisRect.x + labelPadding) || ((textOption.x - labelSize.width / 2) < axisRect.x))) {
                                        textOption.x += axisRect.x / 2;
                                        if ((textOption.x / 2) < axisRect.x) {
                                            textOption.x = axisRect.x + labelPadding / 2;
                                            textAnchorAlignment = leftTextAnchor;
                                        }
                                    }
                                    else if (argsData.alignment === 'Right' && ((textOption.x < axisRect.x + labelPadding) || (textOption.x > axisRect.x + labelPadding))) {
                                        textOption.x += labelSize.width / 2 - availableLabelWidth / 2;
                                    }
                                    else if (argsData.alignment === 'Left' && ((textOption.x < axisRect.x + labelPadding) || (textOption.x > axisRect.x + labelPadding))) {
                                        textOption.x = axisRect.x + labelPadding;
                                    }
                                    availableLabelWidth = availableLabelWidth / 2;
                                }
                                else if ((categoryIndex === length - 1 || (isInversed && categoryIndex === 0))) {
                                    if (argsData.alignment === 'Center' && (textOption.x > axisRect.x + axisRect.width)) {
                                        textOption.x -= labelPadding;
                                        if (textOption.x > axisRect.width) {
                                            textOption.x = axisRect.width + axisRect.x;
                                            textAnchorAlignment = rightTextAnchor;
                                        }
                                    }
                                    else if (argsData.alignment === 'Right') {
                                        textOption.x = axisRect.width + axisRect.x;
                                    }
                                    availableLabelWidth = availableLabelWidth / 2;
                                }
                                break;
                            }
                        }
                        textOption.text = (multiLevel.overflow === 'Wrap') ?
                            useTextWrap(argsData.text, availableLabelWidth, argsData.textStyle, chart.enableRtl,
                                        chart.themeStyle.axisLabelFont, undefined, undefined) :
                            useTextTrim(availableLabelWidth, argsData.text, argsData.textStyle, chart.enableRtl,
                                        chart.themeStyle.axisLabelFont);
                        textOption.x = textOption.x - labelPadding / 2;
                        if (multiLevel.overflow === 'Wrap' && typeof textOption.text !== 'string' && textOption.text.length > 1) {
                            const wrappedTextHeight: number = labelSize.height * textOption.text.length;
                            const textOffsetY: number = (currentLevelHeight - wrappedTextHeight) / 2;
                            textOption.y = levelBorderY + textOffsetY + labelSize.height / 2;
                        }
                    }
                    categoryOptions.push(
                        <text
                            key={categoryIndex}
                            id={`${chartId}${axisIndex}_Axis_MultiLevelLabel_Level_${levelIndex}_Text_${categoryIndex}`}
                            x={textOption.x}
                            y={textOption.y}
                            textAnchor={textAnchorAlignment}
                            fontFamily={argsData.textStyle.fontFamily || chart.themeStyle.axisLabelFont.fontFamily}
                            fontSize={argsData.textStyle.fontSize || chart.themeStyle.axisLabelFont.fontSize}
                            fontWeight={argsData.textStyle.fontWeight || chart.themeStyle.axisLabelFont.fontWeight}
                            fontStyle={argsData.textStyle.fontStyle || chart.themeStyle.axisLabelFont.fontStyle}
                            opacity={argsData.textStyle.opacity || chart.themeStyle.axisLabelFont.opacity}
                            fill={argsData.textStyle.color || chart.themeStyle.axisLabelFont.color}
                        >
                            {typeof textOption.text !== 'string' && textOption.text.length > 1
                                ? textOption.text.map((line: string, index: number) => (
                                    <tspan key={index} x={textOption.x}
                                        dy={index === 0 ? 0 : labelSize.height}>
                                        {line}
                                    </tspan>
                                ))
                                : textOption.text
                            }
                        </text>
                    );
                    const hasBorder: boolean =
                        !!axis.multiLevelLabels?.[levelIndex as number]?.border &&
                        (axis.multiLevelLabels[levelIndex as number].border?.width as number) > 0;
                    borderSvgPath =
                        hasBorder
                            ? renderXAxisLabelBorder(
                                levelIndex,
                                labelEndPixelX - labelStartPixelX - labelPadding,
                                axis,
                                labelStartPixelX,
                                axisRect,
                                borderSvgPath,
                                isOutside,
                                opposedPosition,
                                pointIndex
                            )
                            : '';
                    if (borderSvgPath !== '') {
                        pointIndex++;
                    }
                    if (hasBorder && borderSvgPath !== '') {
                        categoryOptions.push(
                            <path
                                key={`border_${levelIndex}_${categoryIndex}`}
                                id={`${chartId}${axisIndex}_Axis_MultiLevelLabel_Rect_${levelIndex}_${categoryIndex}`}
                                d={borderSvgPath}
                                fill="Transparent"
                                stroke={multiLevel.border?.color as string}
                                strokeWidth={multiLevel.border?.width as number}
                                strokeDasharray={multiLevel.border?.dashArray as string}
                                style={{ pointerEvents: 'none' }}
                            />
                        );
                    }
                }
            }
        );
        const levelGroup: JSX.Element = (
            <g
                key={levelIndex}
                id={`${chartId}${axisIndex}_MultiLevelLabel${levelIndex}`}
            >
                {categoryOptions}
            </g>
        );
        levelGroups.push(levelGroup);
    });
    return (
        <>
            <g
                id={`${chartId}XAxisMultiLevelLabel${axisIndex}`}
                clipPath={`url(#${clipPathId})`}
            >
                <defs>
                    <clipPath id={clipPathId}>
                        <rect
                            id={`${clipPathId}_Rect`}
                            x={axisRect.x - (axis.majorTickLines.width as number) - clipRegionPadding}
                            y={(opposedPosition && isOutside ? clipRegionY + scrollBarHeight - (labelPadding * 2) :
                                clipRegionY - clipRegionPadding)}
                            width={axisRect.width + 2 * (axis.majorTickLines.width as number) + 2 * clipRegionPadding}
                            height={(axis.multiLevelLabelHeight as number) + labelPadding + 2 * clipRegionPadding}
                            fill="white"
                            stroke="Gray"
                            strokeWidth={1}
                        />
                    </clipPath>
                </defs>
                {levelGroups}
            </g>
        </>
    );
}


/**
 * Renders the border path for X-axis multilevel labels.
 *
 * @param {number} multiLevelIndex - The index of the multilevel label group.
 * @param {number} labelSpanWidth - The width of the label category span.
 * @param {AxisModel} axis - The axis model associated with the label.
 * @param {number} labelStartPixelX - The starting X position of the label.
 * @param {Rect} axisRect - The bounding rectangle of the axis.
 * @param {string} borderSvgPath - The existing SVG path string.
 * @param {boolean} isOutside - Indicates whether labels are rendered outside the axis.
 * @param {boolean} opposedPosition - Indicates whether the axis is in opposed position.
 * @param {number} categoryIndex - The index of the category within the label group.
 * @returns {string} Returns a SVG path.
 * @private
 */
export function renderXAxisLabelBorder(
    multiLevelIndex: number, labelSpanWidth: number, axis: AxisModel, labelStartPixelX: number,
    axisRect: Rect, borderSvgPath: string, isOutside: boolean, opposedPosition: boolean, categoryIndex: number): string {
    const padding: number = 10;
    const labelBorderWidth: number = labelSpanWidth + padding;
    const majorTickLinesHeight: number = axis.majorTickLines?.height ?? 0;
    const labelStylePadding: number = axis.labelStyle.padding ?? 0;
    const multiLevelLayout: ChartMultiLevelLabelsProps = (axis.multiLevelLabels) as ChartMultiLevelLabelsProps;
    let labelBorderHeight: number = isNullOrUndefined(
        (multiLevelLayout.xAxisMultiLabelHeight as number[])?.[multiLevelIndex as number]) ? 0 :
        ((multiLevelLayout.xAxisMultiLabelHeight as number[])?.[multiLevelIndex as number] + padding);
    const labelRegionStartX: number = labelStartPixelX + axisRect.x;
    const axisLabelHeight: number = (axis.maxLabelSize.height ?? 0) + labelStylePadding;
    const borderBaseY: number = isOutside ? (axis.isAxisOpposedPosition ? axisRect.y - (axis.multiLevelLabelHeight ?? 0) -
        majorTickLinesHeight - axisLabelHeight - padding : axisRect.y + majorTickLinesHeight + axisLabelHeight + padding )
        : (axis.isAxisOpposedPosition ? axisRect.y + axisLabelHeight : axisRect.y + axisRect.height - axisLabelHeight - (padding / 2));
    let borderStartY: number;
    const xAxisPreviousHeight: number = (multiLevelLayout.xAxisPrevHeight as number[])?.[multiLevelIndex as number];
    if (isOutside) {
        if (opposedPosition) {
            borderStartY = borderBaseY + (axis.multiLevelLabelHeight as number) - xAxisPreviousHeight;
        } else {
            borderStartY = borderBaseY + xAxisPreviousHeight;
        }
    } else {
        if (opposedPosition) {
            borderStartY = borderBaseY + xAxisPreviousHeight;
        } else {
            borderStartY = borderBaseY - xAxisPreviousHeight;
        }
    }
    const multiLevelLabels: ChartMultiLevelLabelProps[] = axis.multiLevelLabels as ChartMultiLevelLabelProps[];
    const categories: ChartMultiLevelLabelCategoryProps[] =
        multiLevelLabels[multiLevelIndex as number].categories as ChartMultiLevelLabelCategoryProps[];
    const length: number = categories.length;
    const plotRight: number = axisRect.x + axisRect.width;
    const labelRegionEndX: number = (categoryIndex === length - 1 && (labelRegionStartX + labelBorderWidth > plotRight)) ?
        plotRight : labelRegionStartX + labelBorderWidth;
    const startValue: number = typeof categories[0].start === 'string' ? Number(new Date(categories[0].start))
        : categories[0].start instanceof Date ? categories[0].start.getTime() : categories[0].start;
    const borderStartX: number = (categoryIndex === 0 && startValue <= 0) ? axisRect.x : labelRegionStartX;
    labelBorderHeight = ((!opposedPosition && isOutside) || (opposedPosition && !isOutside)) ? labelBorderHeight : -labelBorderHeight;
    borderSvgPath +=
        'M ' + borderStartX + ' ' + borderStartY +
        ' L ' + labelRegionEndX + ' ' + borderStartY +
        ' L ' + labelRegionEndX + ' ' + (borderStartY + labelBorderHeight) +
        ' L ' + borderStartX + ' ' + (borderStartY + labelBorderHeight) +
        ' Z';
    return borderSvgPath;
}
/**
 * Renders the multilevel labels for the X-axis.
 *
 * @param {ChartMultiLevelLabelProps[]} labels - Collection of multi-level label configurations to be rendered on the X-axis.
 * @param {AxisModel} axis - The axis model that defines properties and behavior of the X-axis.
 * @param {Rect} axisRect - The bounding rectangle that represents the axis layout area.
 * @param {number} axisIndex - The index of the current axis within the chart.
 * @param {string} chartId - The unique identifier of the chart instance.
 * @param {Chart} chart - The chart instance to which the axis belongs.
 * @returns {JSX.Element | null} Returns the rendered JSX element containing multi-level labels, or null if no labels are rendered.
 * @private
 */
export function drawYAxisMultiLevelLabels(
    labels: ChartMultiLevelLabelProps[],
    axis: AxisModel,
    axisRect: Rect,
    axisIndex: number,
    chartId: string,
    chart: Chart
): JSX.Element | null {
    if (!hasValidMultiLevelLabels(labels)) {
        return null;
    }
    let labelSize: ChartSizeProps;
    const isOutside: boolean = axis.labelStyle.position === 'Outside';
    let labelPixelX: number;
    let labelPixelY: number;
    const padding: number = 10;
    const axisStartOffsetX: number = (((axis.tickPosition as AxisLabelPosition) === ((axis.labelStyle)?.position as AxisLabelPosition)) ?
        ((axis.majorTickLines as MajorTickLines)?.height as number) : 0) +
        (axis.maxLabelSize.width) + padding;
    let labelStartPixelY: number; let borderSvgPath: string = '';
    let labelEndPixelY: number; let argsData: AxisMultiLabelRenderEventArgs;
    const isInversed: boolean = axis.isAxisInverse;
    let labelStartValue: number | Date; let labelEndValue: number | Date;
    let labelSpanHeight: number;
    const leftTextAnchor: 'start' | 'end' = chart.enableRtl ? 'end' : 'start';
    const rightTextAnchor: 'start' | 'end' = chart.enableRtl ? 'start' : 'end';
    let textAnchorAlignment: 'start' | 'middle' | 'end' = 'middle';
    const opposedPosition: boolean = axis.isAxisOpposedPosition;
    let scrollBarHeight: number = (isOutside && isNullOrUndefined(axis.crossAt)) ?
        (axis.scrollbarSettings?.thickness as number) : 0;
    scrollBarHeight = scrollBarHeight * (opposedPosition ? 1 : -1);
    const multiLevelHeight: number = axis.multiLevelLabelHeight ?? 0;
    const majorTickLinesHeight: number = axis.majorTickLines?.height ?? 0;
    const maximumLabelSizeWidth: number = axis.maxLabelSize.width ?? 0;
    const labelStylePadding: number = axis.labelStyle.padding ?? 0;
    const axisLabelWidth: number = axis.labelStyle.position === 'Outside' ? maximumLabelSizeWidth + labelStylePadding : 0;
    let clipStartX: number;
    if (isOutside) {
        if (opposedPosition) {
            clipStartX = axisRect.x + axisLabelWidth + majorTickLinesHeight + padding;
        } else {
            clipStartX = axisRect.x - multiLevelHeight - axisStartOffsetX - padding;
        }
    } else {
        clipStartX = opposedPosition ? axisRect.x + axisRect.width - axisStartOffsetX - multiLevelHeight : axisRect.x + axisStartOffsetX;
    }
    let maxMultiLevelBorderWidth: number = 0;
    labels.forEach((level: ChartMultiLevelLabelProps) => {
        maxMultiLevelBorderWidth = Math.max(maxMultiLevelBorderWidth, level.border?.width as number);
    });
    const clipRegionPadding: number = maxMultiLevelBorderWidth + 2;
    const clipPathId: string = `${chartId}_YAxis_Clippath_${axisIndex}`;
    const multiLevelLayout: ChartMultiLevelLabelsProps = (axis.multiLevelLabels) as ChartMultiLevelLabelsProps;
    const levelGroups: JSX.Element[] = [];
    labels.forEach((multiLevel: ChartMultiLevelLabelProps, levelIndex: number) => {
        const categoryOptions: JSX.Element[] = [];
        multiLevel.categories?.forEach(
            (categoryLabel: ChartMultiLevelLabelCategoryProps, categoryIndex: number) => {
                if (categoryLabel.start == null || categoryLabel.end == null || categoryLabel.end === '') {
                    return;
                }
                borderSvgPath = '';
                labelStartValue = typeof categoryLabel.start === 'string' ? Number(new Date(categoryLabel.start)) : categoryLabel.start as number;
                labelEndValue = typeof categoryLabel.end === 'string' ? Number(new Date(categoryLabel.end)) : categoryLabel.end as number;
                labelStartPixelY = valueToCoefficient(labelStartValue, axis) * axisRect.height;
                labelEndPixelY = valueToCoefficient(labelEndValue, axis) * axisRect.height;
                labelEndPixelY = isInversed ? [labelStartPixelY, labelStartPixelY = labelEndPixelY][0] : labelEndPixelY;
                const labelFontStyle: TextStyleModel = {
                    color: multiLevel.textStyle?.color as string,
                    fontSize: multiLevel.textStyle?.fontSize as string,
                    fontFamily: multiLevel.textStyle?.fontFamily as string,
                    fontWeight: multiLevel.textStyle?.fontWeight as string,
                    fontStyle: multiLevel.textStyle?.fontStyle as string,
                    opacity: multiLevel.textStyle?.opacity as number
                };
                argsData = {
                    cancel: false,
                    name: 'axisMultiLabelRender',
                    axis: axis,
                    text: categoryLabel.text,
                    textStyle: labelFontStyle,
                    alignment: (
                        (axis.multiLevelLabels as ChartMultiLevelLabelProps[])[levelIndex as number]?.alignment as HorizontalAlignment)
                };
                if (!argsData.cancel) {
                    labelSize = measureText(argsData.text, argsData.textStyle as TextStyleModel, chart.themeStyle.axisLabelFont);
                    labelSpanHeight = labelEndPixelY - labelStartPixelY;
                    const axisLabelWidth: number = axis.labelStyle.position === 'Outside' ? maximumLabelSizeWidth + labelStylePadding : 0;
                    const levelWidth: number = ((multiLevelLayout.yAxisMultiLabelHeight as number[])?.[levelIndex as number] ?? 0) / 2;
                    const yAxisPrevHeight: number = (multiLevelLayout.yAxisPrevHeight as number[])?.[levelIndex as number] ?? 0;
                    const labelBaseX: number = isOutside ? (!axis.isAxisOpposedPosition ? axisRect.x - axisLabelWidth -
                        majorTickLinesHeight - yAxisPrevHeight - levelWidth - (2 * padding) :
                        axisRect.x + axisLabelWidth + majorTickLinesHeight + yAxisPrevHeight + levelWidth + 2 * padding)
                        : (!axis.isAxisOpposedPosition ? axisRect.x + majorTickLinesHeight
                                + maximumLabelSizeWidth + labelStylePadding + yAxisPrevHeight +
                                levelWidth + (padding / 2) : axisRect.x + axisRect.width - (majorTickLinesHeight
                                + maximumLabelSizeWidth + labelStylePadding) - yAxisPrevHeight -
                                levelWidth - (padding / 2));
                    if (isOutside) {
                        if (opposedPosition) {
                            labelPixelX = axisRect.x + axisLabelWidth + majorTickLinesHeight + padding +
                                yAxisPrevHeight + levelWidth + padding / 2;
                        } else {
                            labelPixelX = labelBaseX + scrollBarHeight + (padding / 2);
                        }
                    } else {
                        labelPixelX = labelBaseX;
                    }
                    labelPixelY = axisRect.height + axisRect.y - labelStartPixelY - (labelSpanHeight / 2);
                    if (opposedPosition && isOutside) {
                        labelPixelY = labelPixelY + (padding / 2);
                    } else {
                        labelPixelY += labelSize.height / 4;
                    }
                    const horizontalLabelOffset: number = levelWidth - (padding / 2) - (((multiLevel.border?.width as number) || 0) / 2);
                    if (argsData.alignment === 'Center') {
                        textAnchorAlignment = 'middle';
                    } else if (argsData.alignment === 'Right') {
                        labelPixelX += horizontalLabelOffset;
                        textAnchorAlignment = rightTextAnchor;
                    } else {
                        labelPixelX -= horizontalLabelOffset;
                        textAnchorAlignment = leftTextAnchor;
                    }

                    const textOption: TextOption = {
                        id: `${chartId}${levelIndex}_Axis_MultiLevelLabel_Level_${levelIndex}_Text_${categoryIndex}`,
                        x: labelPixelX,
                        y: labelPixelY,
                        anchor: textAnchorAlignment,
                        text: categoryLabel.text,
                        fill: argsData.textStyle.color || chart.themeStyle.axisLabelFont.color,
                        fontSize: argsData.textStyle.fontSize || chart.themeStyle.axisLabelFont.fontSize,
                        fontFamily: argsData.textStyle.fontFamily || chart.themeStyle.axisLabelFont.fontFamily,
                        fontWeight: argsData.textStyle.fontWeight || chart.themeStyle.axisLabelFont.fontWeight,
                        fontStyle: argsData.textStyle?.fontStyle || chart.themeStyle.axisLabelFont.fontStyle,
                        opacity: argsData.textStyle?.opacity || chart.themeStyle.axisLabelFont.opacity
                    };
                    const yAxisLevelHeight: number = (multiLevelLayout.yAxisMultiLabelHeight as number[])?.[levelIndex as number] ?? 0;
                    textOption.text = (multiLevel.overflow === 'Trim') ?
                        useTextTrim(
                            (categoryLabel.maximumTextWidth === null ? yAxisLevelHeight :
                                categoryLabel.maximumTextWidth as number),
                            argsData.text, argsData.textStyle as TextStyleModel, chart.enableRtl,
                            chart.themeStyle.axisLabelFont) : textOption.text;
                    textOption.text = (multiLevel.overflow === 'Wrap') ?
                        useTextWrap(argsData.text, (categoryLabel.maximumTextWidth === undefined ? yAxisLevelHeight :
                            categoryLabel.maximumTextWidth), argsData.textStyle as TextStyleModel, chart.enableRtl,
                                    chart.themeStyle.axisLabelFont, undefined, undefined) : textOption.text;
                    if (typeof textOption.text !== 'string' && textOption.text.length > 1) {
                        textOption.y -= (padding * textOption.text.length / 2);
                    }
                    categoryOptions.push(
                        <text
                            key={categoryIndex}
                            id={`${chartId}${axisIndex}_Axis_MultiLevelLabel_Level_${levelIndex}_Text_${categoryIndex}`}
                            x={textOption.x}
                            y={textOption.y}
                            textAnchor={textAnchorAlignment}
                            fontFamily={argsData.textStyle.fontFamily || chart.themeStyle.axisLabelFont.fontFamily}
                            fontSize={argsData.textStyle.fontSize || chart.themeStyle.axisLabelFont.fontSize}
                            fontWeight={argsData.textStyle.fontWeight || chart.themeStyle.axisLabelFont.fontWeight}
                            fontStyle={argsData.textStyle.fontStyle || chart.themeStyle.axisLabelFont.fontStyle}
                            opacity={argsData.textStyle.opacity || chart.themeStyle.axisLabelFont.opacity}
                            fill={argsData.textStyle.color || chart.themeStyle.axisLabelFont.color}
                        >
                            {textOption.text}
                        </text>
                    );
                    const hasBorder: boolean =
                        !!axis.multiLevelLabels?.[levelIndex as number]?.border &&
                        (axis.multiLevelLabels[levelIndex as number].border?.width as number) > 0;
                    borderSvgPath =
                        hasBorder
                            ? renderYAxisLabelBorder(
                                levelIndex,
                                axis,
                                labelEndPixelY,
                                labelStartPixelY,
                                axisRect,
                                borderSvgPath,
                                opposedPosition
                            )
                            : '';
                    if (hasBorder && borderSvgPath !== '') {
                        categoryOptions.push(
                            <path
                                key={`border_${levelIndex}_${categoryIndex}`}
                                id={`${chartId}${axisIndex}_Axis_MultiLevelLabel_Rect_${levelIndex}_${categoryIndex}`}
                                d={borderSvgPath}
                                fill="Transparent"
                                stroke={multiLevel.border?.color as string}
                                strokeWidth={multiLevel.border?.width as number}
                                strokeDasharray={multiLevel.border?.dashArray as string}
                                style={{ pointerEvents: 'none' }}
                            />
                        );
                    }
                }
            }
        );
        const levelGroup: JSX.Element = (
            <g
                key={levelIndex}
                id={`${chartId}${axisIndex}_MultiLevelLabel${levelIndex}`}
            >
                {categoryOptions}
            </g>
        );
        levelGroups.push(levelGroup);
    });
    return (
        <>
            <g
                id={`${chartId}YAxisMultiLevelLabel${axisIndex}`}
                clipPath={`url(#${clipPathId})`}
            >
                <defs>
                    <clipPath id={clipPathId}>
                        <rect
                            id={`${clipPathId}_Rect`}
                            x={opposedPosition && isOutside ? clipStartX - padding - maxMultiLevelBorderWidth :
                                clipStartX - padding - maxMultiLevelBorderWidth}
                            y={axisRect.y - clipRegionPadding}
                            width={(axis.multiLevelLabelHeight as number) + 2 * padding + 2 * maxMultiLevelBorderWidth}
                            height={axisRect.height + 2 * clipRegionPadding}
                            fill="white"
                            stroke="Gray"
                            strokeWidth={1}
                        />
                    </clipPath>
                </defs>
                {levelGroups}
            </g>
        </>
    );
}

/**
 * Renders the border path for Y-axis multilevel labels.
 *
 * @private
 * @param {number} multiLevelIndex - The index of the multilevel label group.
 * @param {AxisModel} axis - The axis model associated with the label.
 * @param {number} labelEndPixelY - The ending Y position of the label category.
 * @param {number} labelStartPixelY - The starting Y position of the label category.
 * @param {Rect} axisRect - The bounding rectangle of the axis.
 * @param {string} borderSvgPath - The existing SVG path string.
 * @param {boolean} opposedPosition - Indicates whether the axis is in opposed position.
 * @returns {string} Returns a SVG path.
 */
export function renderYAxisLabelBorder(
    multiLevelIndex: number, axis: AxisModel, labelEndPixelY: number, labelStartPixelY: number,
    axisRect: Rect, borderSvgPath: string, opposedPosition: boolean): string {
    const labelSpanHeight: number = labelEndPixelY - labelStartPixelY;
    const padding: number = 10;
    const multiLevelLayout: ChartMultiLevelLabelsProps = (axis.multiLevelLabels) as ChartMultiLevelLabelsProps;
    const borderStartY: number = axisRect.y + axisRect.height - labelEndPixelY;
    let labelBorderWidth: number = (multiLevelLayout.yAxisMultiLabelHeight as number[])?.[multiLevelIndex as number] + padding;
    const maximumLabelSizeWidth: number = axis.maxLabelSize.width ?? 0;
    const labelStylePadding: number = axis.labelStyle.padding ?? 0;
    const majorTickLinesHeight: number = axis.majorTickLines?.height ?? 0;
    const axisLabelWidth: number = axis.labelStyle.position === 'Outside' ? maximumLabelSizeWidth + labelStylePadding : 0;
    const multiLevelThickness: number = (multiLevelLayout.yAxisMultiLabelHeight as number[])?.[multiLevelIndex as number] ?? 0;
    const yAxisPrevHeight: number = (multiLevelLayout.yAxisPrevHeight as number[])?.[multiLevelIndex as number] ?? 0;
    const borderBaseX: number = axis.labelStyle.position === 'Outside' ? (!axis.isAxisOpposedPosition ? axisRect.x -
        axisLabelWidth - majorTickLinesHeight - yAxisPrevHeight - multiLevelThickness - (2 * padding)
        : axisRect.x + axisLabelWidth + majorTickLinesHeight + yAxisPrevHeight + padding
    ) : (!axis.isAxisOpposedPosition ? axisRect.x + yAxisPrevHeight + padding :
        axisRect.x + axisRect.width - yAxisPrevHeight - multiLevelThickness - padding);
    const borderStartX: number = axis.labelStyle.position === 'Inside' ? (!axis.isAxisOpposedPosition ? axisRect.x + majorTickLinesHeight + maximumLabelSizeWidth
                + labelStylePadding : axisRect.x + axisRect.width -
                (majorTickLinesHeight + maximumLabelSizeWidth + labelStylePadding)) : borderBaseX;
    if (opposedPosition) {
        labelBorderWidth = multiLevelThickness + padding;
    }
    const borderEndX: number = axis.labelStyle.position === 'Inside' ? (!axis.isAxisOpposedPosition ? borderStartX + labelBorderWidth
        : borderStartX - labelBorderWidth) : (borderStartX + labelBorderWidth);
    borderSvgPath +=
        'M ' + borderStartX + ' ' + borderStartY +
        ' L ' + borderEndX + ' ' + borderStartY +
        ' L ' + borderEndX + ' ' + (borderStartY + labelSpanHeight) +
        ' L ' + borderStartX + ' ' + (borderStartY + labelSpanHeight) +
        ' Z';
    return borderSvgPath;
}

/**
 * Triggers the multi-level label click callback with the clicked label details.
 *
 * @param {string} labelIndex - Encoded label identifier containing the level and category index.
 * @param {number} axisIndex - Index of the axis in the chart axis collection.
 * @param {Chart} chart - Chart instance used to resolve axis and label metadata.
 * @returns {MultiLevelLabelClickEvent} - The event arguments for multi-level label click.
 * @private
 */
export function MultiLevelLabelClick(labelIndex: string, axisIndex: number, chart: Chart): MultiLevelLabelClickEvent {
    const levelIndex: number = parseInt(labelIndex.substr(0, 1), 10);
    const categoryIndex: number = parseInt(labelIndex.substr(7), 10);
    const currentAxis: AxisModel = chart.axisCollection[axisIndex as number];
    const multiLevelLabel: ChartMultiLevelLabelProps = (currentAxis.multiLevelLabels as ChartMultiLevelLabelProps[])[levelIndex as number];
    const categories: ChartMultiLevelLabelCategoryProps[] = multiLevelLabel.categories as ChartMultiLevelLabelCategoryProps[];
    const clickedCategory: ChartMultiLevelLabelCategoryProps = categories[categoryIndex as number];
    const multiLevelClickArgs: MultiLevelLabelClickEvent = {
        axisName: currentAxis.name as string,
        text: clickedCategory.text,
        level: levelIndex,
        start: clickedCategory.start,
        end: clickedCategory.end
    };
    chart.chartProps.onMultiLevelLabelClick?.(multiLevelClickArgs);
    return multiLevelClickArgs;
}

/**
 * Handles DOM click events and routes them to the multi-level label click handler
 * when the click target corresponds to a multi-level axis label element.
 *
 * @param {Event} event - Native DOM click event.
 * @param {Chart} chart - Chart instance used for axis resolution and event dispatch.
 * @returns {void}
 * @private
 */
export function click(event: Event, chart: Chart): void {
    const clickedElementId: string = (event.target as HTMLElement).id;
    const multiLevelID: string = '_Axis_MultiLevelLabel_Level_';
    let textId: string;
    let elementId: string;
    let axisIndex: number;
    if (clickedElementId.indexOf(multiLevelID) > -1) {
        textId = clickedElementId.split(multiLevelID)[1];
        elementId = clickedElementId.split(multiLevelID)[0];
        axisIndex = parseInt(elementId.charAt(elementId.length - 1), 10);
        MultiLevelLabelClick(textId, axisIndex, chart);
    }
}
