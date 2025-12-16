import * as React from 'react';
import { useLayoutEffect, useEffect, useState } from 'react';
import { DataUtil } from '@syncfusion/react-data/src/util';
import { logBase, measureText, withIn } from '../../utils/helper';
import { isNullOrUndefined, getDateParser, getDateFormat, VerticalAlignment, HorizontalAlignment } from '@syncfusion/react-base';
import { DateFormatOptions } from '../../chart-axis/base';
import { useLayout } from '../../layout/LayoutContext';
import { StripLineSizeUnit, ZIndex } from '../../base/enum';
import { ChartStripLineProps } from '../../base/interfaces';
import { Rect, AxisModel, Chart, ChartSizeProps, TextStyleModel, StriplineOptions, VisibleRangeProps, SeriesProperties } from '../../chart-area/chart-interfaces';
import { useAxisRenderVersion } from '../../hooks/useClipRect';

/**
 * Props interface for strip line renderer components.
 */
interface StripLineRendererProps {
    axes: AxisModel[];
}

/**
 * Renders striplines behind the chart series.
 *
 * @param {object} props - Component properties.
 * @param {AxisModel[]} props.axes - The axis models containing stripline configurations.
 * @returns {React.ReactNode | null} The rendered stripline elements or null when not in rendering phase.
 */
export const StripLineBeforeRenderer: React.FC<StripLineRendererProps> = ({ axes }: { axes: AxisModel[] }) => {
    const { layoutRef, reportMeasured, phase, animationProgress } = useLayout();
    const [, setStriplineBehindElements] = useState<number>(0);
    const axisBehindInfo: { version: number; id: string } = useAxisRenderVersion();
    useLayoutEffect(() => {
        if (phase === 'measuring') {
            const chart: Chart = layoutRef.current.chart as Chart;
            const stripLineBehindValue: StriplineOptions[] = renderStripLineElements(chart, chart.axisCollection, 'Behind');
            chart.striplineBehind = stripLineBehindValue;
            reportMeasured('ChartStripLinesBehind');
        }
    }, [phase, layoutRef, reportMeasured]);

    useEffect(() => {
        if (phase !== 'measuring') {
            const chart: Chart = layoutRef.current?.chart as Chart;
            if (chart && axes && axes.some((axis: AxisModel) => axis.stripLines?.length as number > 0)) {
                const updatedBehindValue: StriplineOptions[] = renderStripLineElements(chart, axes, 'Behind');
                chart.striplineBehind = updatedBehindValue;
            }
            setStriplineBehindElements((prev: number) => prev + 1);
        }
    },
              [
                  ...axes?.flatMap((axis: AxisModel) => (axis.stripLines?.flatMap((stripLine: ChartStripLineProps) => [
                      stripLine.visible,
                      stripLine.range?.start,
                      stripLine.range?.end,
                      stripLine.style?.zIndex,
                      stripLine.range?.size,
                      stripLine.range?.sizeType,
                      stripLine.text?.content,
                      stripLine.text?.hAlign,
                      stripLine.text?.vAlign,
                      stripLine.text?.rotation,
                      stripLine.repeat?.every,
                      stripLine.repeat?.until,
                      stripLine.segment?.start,
                      stripLine.segment?.end,
                      stripLine.segment?.axisName,
                      stripLine.text?.font?.fontSize
                  ]))
                  )
              ]
    );

    useEffect(() => {
        const chart: Chart = layoutRef.current?.chart as Chart;
        if (phase !== 'measuring' && axisBehindInfo.id === chart.element.id) {
            if (chart && axes && axes.some((axis: AxisModel) => axis.stripLines?.length as number > 0)) {
                const updatedBehindValue: StriplineOptions[] = renderStripLineElements(chart, axes, 'Behind');
                chart.striplineBehind = updatedBehindValue;
            }
            setStriplineBehindElements((prev: number) => prev + 1);
        }
    }, [
        axisBehindInfo.version
    ]);

    return (phase === 'rendering') && (() => {
        const chart: Chart = layoutRef.current.chart as Chart;
        const seriesClipRect: Rect = chart.chartAxislayout.seriesClipRect;
        const id: string = `${chart.element.id}_stripline_Behind`;
        const renderedBehindElements: React.ReactNode[] = chart.striplineBehind ?
            createStripeLineElements(chart.striplineBehind, animationProgress) : [];

        const hasAnimatedSeries: boolean = chart.visibleSeries?.some((series: SeriesProperties) => series.animation?.enable) || false;
        const striplineVisibility: 'visible' | 'hidden' = hasAnimatedSeries && !chart.isLegendClicked && chart.delayRedraw ? (animationProgress === 1 ? 'visible' : 'hidden') : 'visible';

        return (
            <g
                id={`${id}_collections`}
                clipPath={`url(#${id}_ClipRect)`}
                style={{ visibility: striplineVisibility }}
            >
                <defs>
                    <clipPath id={`${id}_ClipRect`}>
                        <rect
                            id={`${id}_ClipRect_Rect`}
                            opacity="1"
                            fill="transparent"
                            stroke="Gray"
                            strokeWidth="1"
                            strokeDasharray=""
                            x={seriesClipRect.x}
                            y={seriesClipRect.y}
                            width={seriesClipRect.width}
                            height={seriesClipRect.height}
                            rx={0}
                            ry={0}
                        />
                    </clipPath>
                </defs>
                {renderedBehindElements}
            </g>
        );
    })();
};

/**
 * Renders striplines over the chart series.
 *
 * @param {object} props - Component properties.
 * @param {AxisModel[]} props.axes - The axis models containing stripline configurations.
 * @returns {React.ReactNode | null} The rendered stripline elements or null when not in rendering phase.
 */
export const StripLineAfterRenderer: React.FC<StripLineRendererProps> = ({ axes }: { axes: AxisModel[] }) => {
    const { layoutRef, reportMeasured, phase, animationProgress } = useLayout();
    const [, setStriplineOverElements] = useState<number>(0);
    const axisOverInfo: { version: number; id: string } = useAxisRenderVersion();
    useLayoutEffect(() => {
        if (phase === 'measuring') {
            const chart: Chart = layoutRef.current.chart as Chart;
            const stripLineOverValue: StriplineOptions[] = renderStripLineElements(chart, chart.axisCollection, 'Over');
            chart.striplineOver = stripLineOverValue;
            reportMeasured('ChartStripLinesOver');
        }
    }, [phase, layoutRef, reportMeasured]);

    useEffect(() => {
        if (phase !== 'measuring') {
            const chart: Chart = layoutRef.current?.chart as Chart;
            if (chart && axes && axes.some((axis: AxisModel) => axis.stripLines?.length as number > 0)) {
                const updatedOverValue: StriplineOptions[] = renderStripLineElements(chart, axes, 'Over');
                chart.striplineOver = updatedOverValue;
            }
            setStriplineOverElements((prev: number) => prev + 1);
        }
    },
              [
                  ...axes?.flatMap((axis: AxisModel) => (axis.stripLines?.flatMap((stripLine: ChartStripLineProps) => [
                      stripLine.visible,
                      stripLine.range?.start,
                      stripLine.range?.end,
                      stripLine.style?.zIndex,
                      stripLine.range?.size,
                      stripLine.range?.sizeType,
                      stripLine.text?.content,
                      stripLine.text?.hAlign,
                      stripLine.text?.vAlign,
                      stripLine.text?.rotation,
                      stripLine.repeat?.every,
                      stripLine.repeat?.until,
                      stripLine.segment?.start,
                      stripLine.segment?.end,
                      stripLine.segment?.axisName,
                      stripLine.text?.font?.fontSize
                  ]))
                  )
              ]
    );

    useEffect(() => {
        const chart: Chart = layoutRef.current?.chart as Chart;
        if (phase !== 'measuring' && axisOverInfo.id === chart.element.id) {
            if (chart && axes && axes.some((axis: AxisModel) => axis.stripLines?.length as number > 0)) {
                const updatedOverValue: StriplineOptions[] = renderStripLineElements(chart, axes, 'Over');
                chart.striplineOver = updatedOverValue;
            }
            setStriplineOverElements((prev: number) => prev + 1);
        }
    }, [
        axisOverInfo.version
    ]);

    return (phase === 'rendering') && (() => {
        const chart: Chart = layoutRef.current.chart as Chart;
        const seriesClipRect: Rect = chart.chartAxislayout.seriesClipRect;
        const id: string = `${chart.element.id}_stripline_Over`;
        const renderedOverElements: React.ReactNode[] = chart.striplineOver ?
            createStripeLineElements(chart.striplineOver, animationProgress) : [];
        const hasAnimatedSeries: boolean = chart.visibleSeries?.some((series: SeriesProperties) => series.animation?.enable) || false;
        const striplineVisibility: 'visible' | 'hidden' = hasAnimatedSeries && !chart.isLegendClicked && chart.delayRedraw ? (animationProgress === 1 ? 'visible' : 'hidden') : 'visible';

        return (
            <g
                id={`${id}_collections`}
                clipPath={`url(#${id}_ClipRect)`}
                style={{ visibility: striplineVisibility }}
            >
                <defs>
                    <clipPath id={`${id}_ClipRect`}>
                        <rect
                            id={`${id}_ClipRect_Rect`}
                            opacity="1"
                            fill="transparent"
                            stroke="Gray"
                            strokeWidth="1"
                            strokeDasharray=""
                            x={seriesClipRect.x}
                            y={seriesClipRect.y}
                            width={seriesClipRect.width}
                            height={seriesClipRect.height}
                            rx={0}
                            ry={0}
                        />
                    </clipPath>
                </defs>
                {renderedOverElements}
            </g>
        );
    })();
};

/**
 * Renders stripline elements for the chart.
 *
 * @param {Chart} chart - The chart instance.
 * @param {AxisModel[]} axes - Array of axis models.
 * @param {ZIndex} position - Z-index position of the striplines.
 * @returns {StriplineOptions[]} Array of stripline option objects.
 * @private
 */
function renderStripLineElements(chart: Chart, axes: AxisModel[], position: ZIndex): StriplineOptions[] {
    const stripLineOptions: StriplineOptions[] = [];
    const seriesClipRect: Rect = chart.chartAxislayout.seriesClipRect;
    const id: string = `${chart.element.id}_stripline_${position}`;
    const xAxisIndices: Record<string, number> = {};
    const yAxisIndices: Record<string, number> = {};
    let end: number = 0;
    let limit: number = 0;
    let startValue: number = 0;
    let segmentAxis: AxisModel | null = null;
    let range: boolean;
    for (let a: number = 0; a < axes.length; a++) {
        const axis: AxisModel = axes[a as number];
        if (!axis.stripLines || axis.stripLines.length === 0) {
            continue;
        }
        const axisName: string = axis.name as string;
        let validAxis: AxisModel = axis;
        if (chart.axisCollection?.length) {
            const foundAxis: AxisModel = chart.axisCollection.find((currentAxis: AxisModel) => currentAxis.name === axis.name) as AxisModel;
            if (foundAxis) {
                validAxis = foundAxis;
            }
        }
        if (validAxis.orientation === 'Horizontal') {
            if (!xAxisIndices[axisName as string]) {
                xAxisIndices[axisName as string] = 0;
            }
        } else {
            if (!yAxisIndices[axisName as string]) {
                yAxisIndices[axisName as string] = 0;
            }
        }
        for (let i: number = 0; i < axis.stripLines.length; i++) {
            const stripLine: ChartStripLineProps = axis.stripLines[i as number];
            if (!stripLine.visible || stripLine.style?.zIndex !== position) {
                continue;
            }
            if (stripLine.segment?.enable && stripLine.segment?.start !== undefined &&
                stripLine.segment?.end !== undefined && stripLine.range?.sizeType !== 'Pixel') {
                segmentAxis = getSegmentAxis(axes, axis, stripLine);
            }
            if (stripLine.repeat?.enable && stripLine.repeat?.every !== undefined &&
                stripLine.range?.size !== undefined && stripLine.range?.sizeType !== 'Pixel') {
                limit = stripLine.repeat?.until !== undefined ?
                    (axis.valueType === 'DateTime' ?
                        dateToMilliSeconds(stripLine.repeat?.until) :
                        +stripLine.repeat?.until) :
                    validAxis.actualRange.maximum;
                startValue = axis.valueType === 'DateTime' && isCoreDate(stripLine.range.start as number) ?
                    dateToMilliSeconds(stripLine.range.start as number) :
                    stripLine.range.start as number;
                if ((stripLine.range.shouldStartFromAxis && axis.valueType === 'DateTime' && stripLine.range.sizeType === 'Auto') ||
                    (stripLine.range.start === undefined) || (stripLine.range.start as number < validAxis.visibleRange.minimum)) {
                    startValue = validAxis.visibleLabels[0] &&
                        validAxis.visibleLabels[0].value === validAxis.visibleRange.minimum ?
                        validAxis.visibleRange.minimum :
                        validAxis.visibleLabels[0] && validAxis.visibleLabels[0].value -
                        (axis.valueType === 'DateTime' ? axis.dateTimeInterval : validAxis.visibleRange.interval);
                }
                startValue = stripLine.range.shouldStartFromAxis && axis.valueType !== 'DateTime' ?
                    validAxis.visibleRange.minimum : startValue;
                while (startValue < limit) {
                    end = startValue + (axis.valueType === 'DateTime' ?
                        axis.dateTimeInterval * (stripLine.range.size !== undefined ? +stripLine.range.size : 0) :
                        (stripLine.range.size ?? 0));
                    range = withIn(end, validAxis.visibleRange);
                    if ((startValue >= validAxis.visibleRange.minimum && startValue < validAxis.visibleRange.maximum) || range) {
                        const axisIndex: number = validAxis.orientation === 'Horizontal' ?
                            xAxisIndices[axisName as string]++ : yAxisIndices[axisName as string]++;
                        const rect: Rect = measureStripLine(axis, stripLine, seriesClipRect, startValue, segmentAxis, chart);
                        stripLineOptions.push({
                            id: `${id}`,
                            rect: rect,
                            stripLine: stripLine,
                            axis: axis,
                            axisIndex: axisIndex,
                            chart: chart,
                            position: position
                        });
                    }
                    startValue = getStartValue(axis, stripLine, startValue, chart);
                }
            } else {
                if ((stripLine.range?.start === undefined || stripLine.range?.end === undefined) &&
                    !(stripLine.range?.shouldStartFromAxis && stripLine.range?.size !== undefined)) {
                    continue;
                }
                const axisIndex: number = validAxis.orientation === 'Horizontal' ?
                    xAxisIndices[axisName as string]++ : yAxisIndices[axisName as string]++;
                const rect: Rect = measureStripLine(axis, stripLine, seriesClipRect, 0, segmentAxis, chart);
                stripLineOptions.push({
                    id: `${id}`,
                    rect: rect,
                    stripLine: stripLine,
                    axis: validAxis,
                    axisIndex: axisIndex,
                    chart: chart,
                    position: position
                });
            }
        }
    }
    return stripLineOptions;
}

/**
 * Adds stripline elements to the elements array.
 *
 * @param {StriplineOptions[]} stripLineOptions - The stripline options array.
 * @param {number} animationProgress - The animation progress (0-1).
 * @returns {React.ReactNode[]} Array of React nodes representing the stripline elements.
 * @private
 */
function createStripeLineElements(stripLineOptions: StriplineOptions[], animationProgress: number = 1): React.ReactNode[] {
    const resultElements: React.ReactNode[] = [];
    const chart: Chart = stripLineOptions[0]?.chart as Chart;
    const hasAnimatedSeries: boolean = chart?.visibleSeries?.some((series: SeriesProperties) => series.animation?.enable) || false;
    const elementVisibility: 'visible' | 'hidden' = hasAnimatedSeries && !chart.isLegendClicked && chart.delayRedraw ? (animationProgress === 1 ? 'visible' : 'hidden') : 'visible';

    for (let i: number = 0; i < stripLineOptions.length; i++) {
        const option: StriplineOptions = stripLineOptions[i as number];
        if (option.stripLine?.style?.imageUrl) {
            resultElements.push(
                <image
                    height={option.rect?.height}
                    width={option.rect?.width}
                    href={option.stripLine?.style?.imageUrl}
                    x={option.rect?.x}
                    y={option.rect?.y}
                    key={`${option.id}_rect_${option.axis?.name}_${option.axisIndex}`}
                    id={`${option.id}_rect_${option.axis?.name}_${option.axisIndex}`}
                    visibility={elementVisibility}
                    preserveAspectRatio="none"
                />
            );
        } else {
            let strokeWidth: number = option.stripLine?.range?.size as number;
            let direction: string = (option.axis?.orientation === 'Vertical') ?
                ('M ' + option.rect?.x + ' ' + option.rect?.y + ' ' + 'L ' + ((option.rect?.x || 0) + (option.rect?.width || 0)) + ' ' + option.rect?.y) :
                ('M ' + option.rect?.x + ' ' + option.rect?.y + ' ' + 'L ' + option.rect?.x + ' ' + ((option.rect?.y || 0) + (option.rect?.height || 0)));

            if (option.stripLine?.range?.sizeType !== 'Pixel') {
                direction = (option.axis?.orientation === 'Vertical') ?
                    ('M ' + option.rect?.x + ' ' + ((option.rect?.y || 0) + ((option.rect?.height || 0) / 2)) + ' ' + 'L ' + ((option.rect?.x || 0) + (option.rect?.width || 0)) + ' ' + ((option.rect?.y || 0) + ((option.rect?.height || 0) / 2))) :
                    ('M ' + ((option.rect?.x || 0) + ((option.rect?.width || 0) / 2)) + ' ' + option.rect?.y + ' ' + 'L ' + ((option.rect?.x || 0) + ((option.rect?.width || 0) / 2)) + ' ' + ((option.rect?.y || 0) + (option.rect?.height || 0)));

                strokeWidth = (option.axis?.orientation === 'Vertical' ? option.rect?.height : option.rect?.width) as number;
            }
            resultElements.push(
                <path
                    key={`${option.id}_${option.stripLine?.range?.sizeType === 'Pixel' ? 'path_' : 'rect_'}${option.axis?.name}_${option.axisIndex}`}
                    id={`${option.id}_${option.stripLine?.range?.sizeType === 'Pixel' ? 'path_' : 'rect_'}${option.axis?.name}_${option.axisIndex}`}
                    opacity={option.stripLine?.style?.opacity}
                    fill="none"
                    stroke={option.stripLine?.style?.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={option.stripLine?.style?.dashArray}
                    d={direction}
                    visibility={elementVisibility}
                />
            );
            const pixelRect: Rect = option.stripLine?.range?.sizeType === 'Pixel' ? {
                x: option.axis?.orientation === 'Horizontal' ? ((option.rect?.x as number) - (option.stripLine.range.size as number) / 2) : (option.rect?.x as number),
                y: option.axis?.orientation === 'Vertical' ? ((option.rect?.y as number) - (option.stripLine.range.size as number) / 2) : (option.rect?.y as number),
                width: (option.rect?.width as number) ? (option.rect?.width as number) : (option.stripLine.range.size as number),
                height: (option.rect?.height as number) ? (option.rect?.height as number) : (option.stripLine.range.size as number)
            } : (option.rect as Rect || { x: 0, y: 0, width: 0, height: 0 });
            resultElements.push(
                <rect
                    key={`${option.id}_border_${option.axis?.name}_${option.axisIndex}`}
                    id={`${option.id}_border_${option.axis?.name}_${option.axisIndex}`}
                    opacity={option.stripLine?.style?.opacity}
                    fill={option.stripLine?.range?.sizeType === 'Pixel' ? option.stripLine?.style?.color : 'none'}
                    stroke={option.stripLine?.style?.border?.color || 'transparent'}
                    strokeWidth={option.stripLine?.style?.border?.width}
                    strokeDasharray={option.stripLine?.style?.border?.dashArray}
                    x={pixelRect.x}
                    y={pixelRect.y}
                    width={pixelRect.width}
                    height={pixelRect.height}
                    rx={0}
                    ry={0}
                    visibility={elementVisibility}
                />
            );
        }
        if (option.stripLine?.text) {
            const textElement: React.ReactNode = renderText(option.stripLine, option.rect as Rect, `${option.id}_text_${option.axis?.name}_${option.axisIndex}`, option.chart as Chart, option.axis as AxisModel, elementVisibility);
            resultElements.push(textElement);
        }
    }
    return resultElements;
}

/**
 * Gets the axis for a segment based on the provided axes, current axis, and stripline settings.
 *
 * @param {AxisModel[]} axes - Array of available axis models.
 * @param {AxisModel} axis - The current axis model.
 * @param {ChartStripLineProps} stripLine - The stripline settings that may specify a segment axis.
 * @returns {AxisModel | null} The segment axis if found, otherwise null.
 * @private
 */
function getSegmentAxis(axes: AxisModel[], axis: AxisModel, stripLine: ChartStripLineProps): AxisModel | null {
    let segment: AxisModel | null = null;
    if (stripLine.segment?.axisName == null) {
        return (axis.orientation === 'Horizontal') ? axes[1] : axes[0];

    } else {
        for (let i: number = 0; i < axes.length; i++) {
            if (stripLine.segment.axisName === axes[i as number].name) {
                segment = axes[i as number];
            }
        }
        return segment;
    }
}

/**
 * Calculates the rectangular dimensions for a stripline based on axis and stripline settings.
 *
 * @param {AxisModel} axis - The axis model on which the stripline will be rendered.
 * @param {ChartStripLineProps} stripline - The settings model defining the stripline properties.
 * @param {Rect} seriesClipRect - The rectangle defining the series clip area.
 * @param {number} startValue - The starting value for the stripline, if defined.
 * @param {AxisModel | null} segmentAxis - Optional secondary axis for segmented striplines.
 * @param {Chart} chart - The chart instance.
 * @returns {Rect} The calculated rectangle for the stripline.
 * @private
 */
function measureStripLine(axis: AxisModel, stripline: ChartStripLineProps, seriesClipRect: Rect,
                          startValue: number, segmentAxis: AxisModel | null, chart: Chart): Rect {
    let actualStart: number;
    let actualEnd: number;
    let validAxis: AxisModel = axis;
    let validSegmentAxis: AxisModel | null = segmentAxis;
    if (chart.axisCollection?.length) {
        const foundAxis: AxisModel = chart.axisCollection.find((currentAxis: AxisModel) => currentAxis.name === axis.name) as AxisModel;
        if (foundAxis) {
            validAxis = foundAxis;
        }
        if (segmentAxis) {
            const foundSegmentAxis: AxisModel = chart.axisCollection.find((currentSegmentAxis: AxisModel) =>
                currentSegmentAxis.name === segmentAxis.name) as AxisModel;
            if (foundSegmentAxis) {
                validSegmentAxis = foundSegmentAxis;
            }
        }
    }
    const orientation: string = validAxis.orientation as string;
    const isDateTimeAxis: boolean = axis.valueType === 'DateTime';
    if (stripline.repeat?.enable && stripline.range?.size !== null) {
        actualStart = startValue as number;
        actualEnd = 0;
    } else {
        actualStart = stripline.range?.start === 0 ? 0 : isDateTimeAxis &&
            isCoreDate(stripline.range?.start as Date | number | Object | string) ?
            dateToMilliSeconds(stripline.range?.start as Date | number | Object) : +(axis.valueType === 'Logarithmic' ? logBase(stripline.range?.start as number, axis.logBase as number) : stripline.range?.start as Date | number | Object);
        actualEnd = stripline.range?.end === 0 ? 0 : isDateTimeAxis &&
            isCoreDate(stripline.range?.start as Date | number | Object | string) ?
            dateToMilliSeconds(stripline.range?.end as Date | number | Object) : +(axis.valueType === 'Logarithmic' ? logBase(stripline.range?.end as number, axis.logBase as number) : stripline.range?.end as Date | number | Object);
    }
    const rect: { from: number, to: number } = getFromToValue(
        actualStart, actualEnd, stripline.range?.size as number, stripline.range?.shouldStartFromAxis || false,
        axis, stripline, chart.axisCollection, chart
    );
    let height: number = (orientation === 'Vertical') ? (rect.to - rect.from) * validAxis.rect.height : seriesClipRect.height;
    let width: number = (orientation === 'Horizontal') ? (rect.to - rect.from) * validAxis.rect.width : seriesClipRect.width;
    let x: number = (orientation === 'Vertical') ? seriesClipRect.x : ((rect.from * validAxis.rect.width) + validAxis.rect.x);
    let y: number = (orientation === 'Horizontal') ? seriesClipRect.y : (validAxis.rect.y + validAxis.rect.height -
        ((stripline.range?.sizeType === 'Pixel' ? rect.from : rect.to) * validAxis.rect.height));
    if (stripline.segment?.enable && stripline.segment.start != null && stripline.segment.end != null &&
        (stripline.range?.sizeType as string) !== 'Pixel' && validSegmentAxis) {
        const start: number = isDateTimeAxis && isCoreDate(stripline.segment.start) ?
            dateToMilliSeconds(stripline.segment.start) : +stripline.segment.start;
        const end: number = isDateTimeAxis && isCoreDate(stripline.segment.end) ?
            dateToMilliSeconds(stripline.segment.end) : +stripline.segment.end;
        const segRect: { from: number, to: number } = getFromToValue(start, end, 0, false, validSegmentAxis,
                                                                     stripline, chart.axisCollection, chart);
        if (validSegmentAxis.orientation === 'Vertical') {
            y = (validSegmentAxis.rect.y + validSegmentAxis.rect.height - (segRect.to * validSegmentAxis.rect.height));
            height = (segRect.to - segRect.from) * validSegmentAxis.rect.height;
        } else {
            x = ((segRect.from * validSegmentAxis.rect.width) + validSegmentAxis.rect.x);
            width = (segRect.to - segRect.from) * validSegmentAxis.rect.width;
        }
    }
    if ((height !== 0 && width !== 0) || ((stripline.range?.sizeType as string) === 'Pixel' &&
        (stripline.range?.start !== undefined || stripline.range?.shouldStartFromAxis))) {
        return { x: x, y: y, width: width, height: height };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
}

/**
 * Converts a date value to milliseconds.
 *
 * @param {Date | number | Object} value - The date value to convert.
 * @returns {number} The date value converted to milliseconds.
 * @private
 */
function dateToMilliSeconds(value: Date | number | Object): number {
    return dateParse(value).getTime();
}

/**
 * Parses a date value using the chart's locale settings.
 *
 * @param {Date | Object} value - The date value to parse.
 * @returns {Date} The parsed date object.
 * @private
 */
function dateParse(value: Date | Object): Date {
    const option: DateFormatOptions = {
        skeleton: 'full',
        type: 'dateTime'
    };
    const dateParser: Function = getDateParser(option);
    const dateFormatter: Function = getDateFormat(option);
    return new Date(Date.parse(dateParser(dateFormatter(new Date(
        (DataUtil.parse as Required<typeof DataUtil.parse>).parseJson({ val: value }).val)))));
}

/**
 * Determines if a value is a core date (string representation).
 *
 * @param {string | number | Object | Date} value - The value to check.
 * @returns {boolean} True if the value is a string (core date), false otherwise.
 * @private
 */
function isCoreDate(value: string | number | Object | Date): boolean {
    return typeof value === 'string' ? true : false;
}

/**
 * Calculates the 'from' and 'to' values for a stripline.
 *
 * @param {number} start - The starting value of the stripline.
 * @param {number} end - The ending value of the stripline.
 * @param {number} size - The size of the stripline.
 * @param {boolean} startFromAxis - Whether the stripline should start from the axis.
 * @param {AxisModel} axis - The axis model associated with the stripline.
 * @param {ChartStripLineProps} stripline - The stripline settings model.
 * @param {AxisModel[]} axisCollection - Collection of all axes in the chart.
 * @param {Chart} chart - The chart instance.
 * @returns {{ from: number, to: number }} An object containing the calculated 'from' and 'to' values.
 * @private
 */
function getFromToValue(start: number, end: number, size: number,
                        startFromAxis: boolean, axis: AxisModel, stripline: ChartStripLineProps,
                        axisCollection: AxisModel[], chart: Chart): { from: number, to: number } {
    let visibleRange: VisibleRangeProps = axis.visibleRange;
    if (axisCollection?.length) {
        const validAxis: AxisModel = axisCollection.find((currentAxis: AxisModel) => currentAxis.name === axis.name) as AxisModel;
        if (validAxis?.visibleRange) {
            visibleRange = validAxis.visibleRange;
        }
    }
    let from: number = (!stripline.repeat?.enable && startFromAxis) ? visibleRange.minimum : (start as number);
    if (axis.valueType === 'Double' && size !== undefined && !startFromAxis && stripline.range?.start === undefined) {
        from += (size || 0);
    }
    let to: number = getToValue(
        Math.max(start || 0, isNullOrUndefined(end) ? (start || 0) : (end || 0)),
        from, size || 0, axis, end || null, stripline, chart
    );
    from = findValue(from, axis, axisCollection);
    to = findValue(to, axis, axisCollection);
    return {
        from: striplineValueToCoefficient(axis.isAxisInverse ? to : from, axis, axisCollection),
        to: striplineValueToCoefficient(axis.isAxisInverse ? from : to, axis, axisCollection)
    };
}

/**
 * Calculates the 'to' value for a stripline based on provided parameters.
 *
 * @param {number} to - The initial 'to' value.
 * @param {number} from - The 'from' value.
 * @param {number} size - The size of the stripline.
 * @param {AxisModel} axis - The axis model associated with the stripline.
 * @param {number | null} end - The end value, if specified.
 * @param {ChartStripLineProps} stripline - The stripline settings model.
 * @param {Chart} chart - The chart instance.
 * @returns {number} The calculated 'to' value for the stripline.
 * @private
 */
function getToValue(to: number, from: number, size: number, axis: AxisModel, end: number | null,
                    stripline: ChartStripLineProps, chart: Chart): number {
    let sizeType: StripLineSizeUnit = stripline.range?.sizeType as StripLineSizeUnit;
    const isEnd: boolean = (end === null);
    let validAxis: AxisModel = axis;
    if (chart.axisCollection?.length) {
        const foundAxis: AxisModel = chart.axisCollection.find((currentAxis: AxisModel) => currentAxis.name === axis.name) as AxisModel;
        if (foundAxis) {
            validAxis = foundAxis;
        }
    }
    if (axis.valueType === 'DateTime') {
        const fromValue: Date = new Date(from);
        if (sizeType === 'Auto') {
            sizeType = validAxis.actualIntervalType;
            size *= validAxis.visibleRange.interval;
        }
        switch (sizeType) {
        case 'Years':
            return isEnd ? +new Date(fromValue.setFullYear(fromValue.getFullYear() + size)) : to;
        case 'Months':
            return isEnd ? +new Date(fromValue.setMonth(fromValue.getMonth() + size)) : to;
        case 'Days':
            return isEnd ? +new Date(fromValue.setDate(fromValue.getDate() + size)) : to;
        case 'Hours':
            return isEnd ? +new Date(fromValue.setHours(fromValue.getHours() + size)) : to;
        case 'Minutes':
            return isEnd ? +new Date(fromValue.setMinutes(fromValue.getMinutes() + size)) : to;
        case 'Seconds':
            return isEnd ? +new Date(fromValue.setSeconds(fromValue.getSeconds() + size)) : to;
        default:
            return from;
        }
    } else {
        return stripline.range?.sizeType === 'Pixel' ? from : (isEnd ? (from + size) : to);
    }
}

/**
 * Constrains a value to be within the visible range of an axis.
 *
 * @param {number} value - The value to constrain.
 * @param {AxisModel} axis - The axis model containing the visible range.
 * @param {AxisModel[]} axisCollection - Collection of all axes in the chart.
 * @returns {number} The value constrained to be within the axis visible range.
 * @private
 */
function findValue(value: number, axis: AxisModel, axisCollection: AxisModel[]): number {
    let targetAxis: AxisModel = axis;
    if (axisCollection?.length) {
        const foundAxis: AxisModel = axisCollection.find((currentAxis: AxisModel) => currentAxis.name === axis.name) as AxisModel;
        if (foundAxis && foundAxis.visibleRange &&
            (foundAxis.visibleRange.minimum !== 0 || foundAxis.visibleRange.maximum !== 0)) {
            targetAxis = foundAxis;
        }
    }
    if (value < targetAxis.visibleRange.minimum) {
        value = targetAxis.visibleRange.minimum;
    } else if (value > targetAxis.visibleRange.maximum) {
        value = targetAxis.visibleRange.maximum;
    }
    return value;
}

/**
 * Renders the text element for a stripline.
 *
 * @param {ChartStripLineProps} stripline - The settings model for the stripline.
 * @param {Rect} rect - The rectangular area for the stripline.
 * @param {string} id - The unique identifier for the stripline.
 * @param {Chart} chart - The chart instance.
 * @param {AxisModel} axis - The axis model associated with the stripline.
 * @param {'visible' | 'hidden'} visibility - The visibility state of the text element.
 * @returns {React.ReactNode} The rendered text element for the stripline.
 * @private
 */
function renderText(stripline: ChartStripLineProps, rect: Rect, id: string, chart: Chart, axis: AxisModel, visibility: 'visible' | 'hidden' = 'visible'): React.ReactNode {
    const textSize: ChartSizeProps = measureText(stripline.text as string, stripline.text?.font as TextStyleModel,
                                                 chart.themeStyle.stripLineLabelFont);
    let validAxis: AxisModel = axis;
    if (chart.axisCollection?.length) {
        const foundAxis: AxisModel = chart.axisCollection.find((currentAxis: AxisModel) => currentAxis.name === axis.name) as AxisModel;
        if (foundAxis) {
            validAxis = foundAxis;
        }
    }
    const isRotationNull: boolean = (stripline.text?.rotation === undefined);
    const textMid: number = isRotationNull ? 3 * (textSize.height / 8) : 0;
    let ty: number = rect.y + (rect.height / 2) + textMid;
    const rotation: number | undefined = isRotationNull ? ((validAxis.orientation === 'Vertical') ? 0 : -90) : stripline.text?.rotation;
    let tx: number = rect.x + (rect.width / 2);
    let anchor: VerticalAlignment | HorizontalAlignment = 'Center';
    const hAlign: HorizontalAlignment = stripline.text?.hAlign as HorizontalAlignment;
    const vAlign: VerticalAlignment = stripline.text?.vAlign as VerticalAlignment;
    const padding: number = 5;
    if (validAxis.orientation === 'Horizontal') {
        tx = getTextStart(
            tx + (textMid * getAlignmentFactor(hAlign)),
            rect.width, hAlign
        );
        ty = getTextStart(ty - textMid, rect.height, vAlign) +
            (vAlign === 'Top' && !isRotationNull ? (textSize.height / 4) : 0);
        anchor = isRotationNull ? invertAlignment(vAlign) : hAlign;
        anchor = tx - textSize.width / 2 < validAxis.rect.x ? 'Left' : tx + textSize.width / 2 > validAxis.rect.width ? 'Right' : anchor;
    } else {
        tx = getTextStart(tx, rect.width, hAlign);
        ty = getTextStart(
            ty + (textMid * getAlignmentFactor(vAlign)) - padding,
            rect.height, vAlign
        );
        anchor = hAlign;
        anchor = chart.enableRtl ? (anchor === 'Right' ? 'Left' : anchor === 'Left' ? 'Right' : anchor) : anchor;
    }
    return (
        <text
            key={id}
            id={id}
            x={tx}
            y={ty}
            fill={stripline.text?.font?.color || chart.themeStyle.stripLineLabelFont.color}
            fontSize={stripline.text?.font?.fontSize || '12px'}
            fontStyle={stripline.text?.font?.fontStyle || 'Normal'}
            fontFamily={stripline.text?.font?.fontFamily || 'Roboto'}
            fontWeight={stripline.text?.font?.fontWeight || '400'}
            textAnchor={mapToTextAnchor(anchor)}
            transform={`rotate(${rotation} ${tx},${ty})`}
            opacity={stripline.text?.font?.opacity}
            dominantBaseline="middle"
            visibility={visibility}
        >
            {stripline.text?.content}
        </text>
    );
}

/**
 * Calculates the starting coordinate for stripline text based on its alignment.
 *
 * @param {HorizontalAlignment | VerticalAlignment} alignment - Maps a horizontal or vertical alignment to its corresponding `text-anchor` value.
 * @returns {'Start' | 'Middle' | 'End'} The corresponding value for the `text-anchor` attribute.
 * @private
 */
function mapToTextAnchor(alignment: HorizontalAlignment | VerticalAlignment): 'Start' | 'Middle' | 'End' {
    if (alignment === 'Left' || alignment === 'Top') {
        return 'Start';
    } else if (alignment === 'Right' || alignment === 'Bottom') {
        return 'End';
    } else {
        return 'Middle';
    }
}

/**
 * Calculates the starting coordinate for stripline text based on its alignment.
 *
 * @param {number} xy - The initial x or y coordinate of the stripline.
 * @param {number} size - The width or height of the text, used to calculate the offset.
 * @param {HorizontalAlignment | VerticalAlignment} textAlignment - The desired alignment ('Left', 'Top', 'Right', 'Bottom', or 'Center').
 * @returns {number} The adjusted coordinate for the text's starting position.
 * @private
 */
function getTextStart(xy: number, size: number, textAlignment: HorizontalAlignment | VerticalAlignment): number {
    const padding: number = 5;
    switch (textAlignment) {
    case 'Left':
    case 'Top':
        xy = xy - (size / 2) + padding;
        break;
    case 'Right':
    case 'Bottom':
        xy = xy + (size / 2) - padding;
        break;
    }
    return xy;
}

/**
 * Converts a text alignment into a numeric factor for positioning calculations.
 *
 * @param {HorizontalAlignment | VerticalAlignment} anchor - The alignment anchor ('Top', 'Bottom', 'Left', 'Right', or 'Center').
 * @returns {number} Returns `1` for 'Left'/'Top', `-1` for 'Right'/'Bottom', and `0` for 'Center'.
 * @private
 */
function getAlignmentFactor(anchor: HorizontalAlignment | VerticalAlignment): number {
    let factor: number = 0;
    switch (anchor) {
    case 'Left':
    case 'Top':
        factor = 1;
        break;
    case 'Right':
    case 'Bottom':
        factor = -1;
        break;
    }
    return factor;
}

/**
 * Translates a VerticalAlignment into its corresponding HorizontalAlignment.
 *
 * @param {VerticalAlignment} anchor - The vertical alignment to invert ('Top', 'Bottom', or 'Center').
 * @returns {HorizontalAlignment} The inverted horizontal alignment ('Right', 'Left', or 'Center').
 * @private
 */
function invertAlignment(anchor: VerticalAlignment): HorizontalAlignment {
    switch (anchor) {
    case 'Top':
        return 'Right';
    case 'Bottom':
        return 'Left';
    default:
        return 'Center';
    }
}

/**
 * Calculates the start value for a stripline based on axis type.
 *
 * @param {AxisModel} axis - The axis model.
 * @param {ChartStripLineProps} stripLine - The stripline settings.
 * @param {number} startValue - The initial start value.
 * @param {Chart} chart - The chart instance.
 * @returns {number} The calculated start value, adjusted for datetime or with repeatEvery added.
 * @private
 */
function getStartValue(axis: AxisModel, stripLine: ChartStripLineProps, startValue: number, chart: Chart): number {
    if (axis.valueType === 'DateTime') {
        return (getToValue(
            0, startValue,
            stripLine.repeat?.every ? +stripLine.repeat.every : 0,
            axis, null, stripLine, chart
        ));
    } else {
        return startValue + (stripLine.repeat?.every ? +stripLine.repeat.every : 0);
    }
}

/**
 * Converts a value to a coefficient relative to a specified axis.
 *
 * @param {number} value - The numerical value to convert to a coefficient.
 * @param {AxisModel} axis - The axis model containing the visible range information.
 * @param {AxisModel[]} axisCollection - Optional collection of all axes in the chart.
 * @returns {number} The coefficient representing the position of the value relative to the axis range.
 * @private
 */
function striplineValueToCoefficient(value: number, axis: AxisModel, axisCollection: AxisModel[]): number {
    let range: VisibleRangeProps = axis.visibleRange;
    if (axisCollection?.length) {
        const validAxis: AxisModel = axisCollection.find((currentAxis: AxisModel) => currentAxis.name === axis.name) as AxisModel;
        if (validAxis?.visibleRange &&
           (validAxis.visibleRange.minimum !== 0 || validAxis.visibleRange.maximum !== 0)) {
            range = validAxis.visibleRange;
        }
    }
    const result: number = (value - range.minimum) / (range.delta);
    const isInverse: boolean = axis.isAxisInverse as boolean;
    return isInverse ? (1 - result) : result;
}
