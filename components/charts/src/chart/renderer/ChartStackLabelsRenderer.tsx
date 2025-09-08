import { useLayoutEffect, JSX, useEffect, useState } from 'react';
import { ChartStackLabelsProps, ChartBorderProps, ChartLocationProps } from '../base/interfaces';
import { useLayout } from '../layout/LayoutContext';
import { measureText } from '../utils/helper';
import { colorNameToHex, convertHexToColor, DataLabelRendererResults } from './SeriesRenderer/DataLabelRender';
import { useSeriesRenderVersion } from '../hooks/useClipRect';
import { Chart, ColorValue, Points, Rect, SeriesProperties, ChartSizeProps, TextOption, TextStyleModel } from '../chart-area/chart-interfaces';

/**
 * Configuration interface for shape rectangle styling and positioning.
 */
interface ShapeRectConfig {
    /** Unique identifier for the shape element */
    id: string;
    /** Fill color for the shape background */
    fill: string;
    /** Border configuration including color and width */
    border: ChartBorderProps;
    /** Opacity level from 0 (transparent) to 1 (opaque) */
    opacity: number;
    /** Rectangle dimensions and position */
    rect: Rect;
    /** Horizontal corner radius */
    rx: number;
    /** Vertical corner radius */
    ry: number;
    /** CSS transform string for positioning and rotation */
    transform: string;
    /** Stroke color for the border, if applicable */
    stroke: string | undefined;
}

/**
 * ChartStackLabelsRenderer is a functional component that renders stack labels for stacked chart series.
 * This component displays cumulative values at the top of stacked data points, making it easier to
 * understand the total contribution of all series at each data point. It integrates with the chart
 * layout system to provide proper positioning, styling, and animation support.
 *
 * The component handles:
 * - Calculating cumulative values for positive and negative stacked series
 * - Positioning labels to avoid overlap with chart elements
 * - Applying custom formatting to label text
 * - Supporting animations and theme-based styling
 * - Managing visibility based on series grouping
 *
 * @param {ChartStackLabelsProps} props - Configuration properties for stack labels including visibility, styling, formatting, and positioning options
 * @returns {JSX.Element | null} The rendered stack labels SVG elements or null if labels are not visible or applicable
 */
export const ChartStackLabelsRenderer: React.FC<ChartStackLabelsProps> = (props: ChartStackLabelsProps): JSX.Element | null => {
    const { layoutRef, reportMeasured, phase, animationProgress } = useLayout();

    const [labelOpacity, setLabelOpacity] = useState<number>(0);

    // Measure phase - register the component in the layout system
    useLayoutEffect(() => {
        if (phase === 'measuring') {
            if (layoutRef.current?.chart && props?.visible) {
                const calculatedLabels: DataLabelRendererResults[] = renderStackLabels(layoutRef.current.chart as Chart, props);
                (layoutRef.current.chart as Chart).stackLabelsOptions = calculatedLabels;
            }
            reportMeasured('ChartStackLabels');
        }
    }, [phase, layoutRef]);

    const legendClickedInfo: { version: number; id: string } = useSeriesRenderVersion();
    // Update stack labels when dependencies change
    useEffect(() => {
        if (phase !== 'measuring' && ((legendClickedInfo && legendClickedInfo.id === (layoutRef.current.chart as Chart)?.element.id))) {
            if (layoutRef.current?.chart && props?.visible) {
                requestAnimationFrame(() => {
                    const calculatedLabels: DataLabelRendererResults[] = renderStackLabels(layoutRef.current.chart as Chart, props);
                    (layoutRef.current.chart as Chart).stackLabelsOptions = calculatedLabels;
                });
            }
            reportMeasured('ChartStackLabels');
        }
    }, [props?.rotationAngle, props.border?.width,
        props.font?.fontSize, props.font?.fontWeight, props.font?.fontFamily, props?.format, props?.margin, legendClickedInfo.version]);

    useEffect(() => {
        let frameId: number | undefined;

        if (props?.visible) {
            const visibleSeries: SeriesProperties = (layoutRef.current.chart as Chart)?.visibleSeries?.find(
                (series: SeriesProperties) => series.visible
            ) as SeriesProperties;

            const durations: number = visibleSeries?.animation?.duration ?? 400;

            if (animationProgress === 1) {
                let start: number | null = null;

                const animate: (timestamp: number) => void = (timestamp: number) => {
                    if (!start) {
                        start = timestamp;
                    }
                    const elapsed: number = timestamp - start;
                    const duration: number = durations; // ms
                    const eased: number = Math.min(elapsed / duration, 1);

                    setLabelOpacity(eased);

                    if (eased < 1) {
                        frameId = requestAnimationFrame(animate);
                    }
                };

                frameId = requestAnimationFrame(animate);
            } else if (!visibleSeries?.animation?.enable) {
                setLabelOpacity(1);
            } else {
                setLabelOpacity(0);
            }
        }

        return () => {
            if (frameId !== undefined) {
                cancelAnimationFrame(frameId);
            }
        };
    }, [animationProgress, props?.visible]);


    // Render the stack labels
    return (phase === 'rendering') && (props.visible && (layoutRef?.current?.chart as Chart)?.stackLabelsOptions) ? (
        <g id={`${(layoutRef.current?.chart as Chart)?.element?.id}_StackLabelsGroup`} style={{ opacity: labelOpacity }}>
            {(layoutRef.current.chart as Chart).stackLabelsOptions.map((labelData: DataLabelRendererResults, labelIdx: number) => (
                <g key={labelIdx}>
                    {labelData.shapeRect && (
                        <rect
                            id={labelData.shapeRect.id}
                            opacity={labelData.shapeRect.opacity}
                            fill={labelData.shapeRect.fill}
                            x={labelData.shapeRect.rect.x}
                            y={labelData.shapeRect.rect.y}
                            width={labelData.shapeRect.rect.width}
                            height={labelData.shapeRect.rect.height}
                            rx={labelData.shapeRect.rx || props.borderRadius?.x}
                            ry={labelData.shapeRect.ry || props.borderRadius?.y}
                            transform={labelData.shapeRect.transform}
                            stroke={labelData.shapeRect.border?.color || props.border?.color}
                            strokeWidth={labelData.shapeRect.border?.width}
                        />
                    )}
                    <text
                        id={labelData.textOption.id}
                        x={labelData.textOption.x}
                        y={labelData.textOption.y}
                        fill={labelData.textOption.fill || props.font?.color}
                        fontSize={labelData.textOption.fontSize}
                        fontFamily={labelData.textOption.fontFamily}
                        fontWeight={labelData.textOption.fontWeight}
                        fontStyle={labelData.textOption.fontStyle || props.font?.fontStyle}
                        textAnchor={'middle'}
                        transform={labelData.textOption.transform}
                    >
                        {labelData.textOption.text}
                    </text>
                </g>
            ))}
        </g>
    ) : null;
};

/**
 * Renders stack labels for all stacked series in the chart by calculating cumulative values
 * and determining appropriate positioning for each label.
 *
 * This function processes all visible series in the chart, groups them by stackingGroup,
 * and calculates the total values for both positive and negative stacks. It then
 * generates the necessary rendering information for each stack label.
 *
 * @param {Chart} chart - The chart instance containing series data, axes, and rendering context
 * @param {ChartStackLabelsProps} props - Configuration properties for stack labels including styling and formatting options
 * @returns {DataLabelRendererResults[]} Array of stack label rendering information containing position, styling, and text data
 * @private
 */
function renderStackLabels(chart: Chart, props: ChartStackLabelsProps): DataLabelRendererResults[] {
    const stackLabels: DataLabelRendererResults[] = [];
    let positivePoints: Record<string, Points> = {};
    let negativePoints: Record<string, Points> = {};
    const groupingValues: Record<string, SeriesProperties[]> = {};
    let keys: string[] = [];

    if (chart.visibleSeries && chart.visibleSeries.length > 0) {
        // Group series by stackingGroup
        for (let i: number = 0; i < chart.visibleSeries.length; i++) {
            const series: SeriesProperties = chart.visibleSeries[i as number];
            const stackGroup: string = series.stackingGroup || '';

            if (!groupingValues[stackGroup as string]) {
                groupingValues[stackGroup as string] = [];
            }
            groupingValues[stackGroup as string].push(series);
        }

        keys = Object.keys(groupingValues);

        if (keys.length > 0) {
            for (let groupIndex: number = 0; groupIndex < keys.length; groupIndex++) {
                positivePoints = {};
                negativePoints = {};
                const seriesGroup: SeriesProperties[] = groupingValues[keys[groupIndex as number]];

                if (!seriesGroup || seriesGroup.length === 0) { continue; }

                const lastSeriesIndex: number = seriesGroup[seriesGroup.length - 1].index;

                for (let seriesIndex: number = lastSeriesIndex; seriesIndex >= 0; seriesIndex--) {
                    const series: SeriesProperties | undefined = chart.visibleSeries[seriesIndex as number];

                    if (!series) { continue; }

                    if (series.visible && series.points && series.points.length > 0) {
                        for (let pointIndex: number = 0; pointIndex < series.points.length; pointIndex++) {
                            const point: Points = series.points[pointIndex as number];
                            const pointXValueAsKey: string = String(point.x);
                            if (!positivePoints[pointXValueAsKey as string] &&
                                (Number(series.stackedValues?.endValues?.[pointIndex as number])) > 0 &&
                                point.visible) {
                                positivePoints[pointXValueAsKey as string] = point;
                            }
                            if (!negativePoints[pointXValueAsKey as string] &&
                                (Number(series.stackedValues?.endValues?.[pointIndex as number])) < 0 &&
                                point.visible) {
                                negativePoints[pointXValueAsKey as string] = point;
                            }
                        }
                    }
                }

                const groupStackLabels: DataLabelRendererResults[] = calculateStackLabel(
                    positivePoints,
                    negativePoints,
                    chart,
                    props
                );
                stackLabels.push(...groupStackLabels);
            }
        }
    }

    return stackLabels;
}

/**
 * Calculates the position, styling, and content for individual stack labels based on
 * positive and negative data points in stacked series.
 *
 * This function performs the core logic for stack label rendering including:
 * - Computing cumulative values for each stack
 * - Applying custom formatting to label text
 * - Calculating optimal positioning within chart boundaries
 * - Determining appropriate text and background colors based on contrast
 * - Creating shape rectangles for label backgrounds
 * - Handling rotation and alignment settings
 *
 * @param {Record<string, Points>} positivePoints - Collection of data points with positive values, keyed by x-axis value
 * @param {Record<string, Points>} negativePoints - Collection of data points with negative values, keyed by x-axis value
 * @param {Chart} chart - The chart instance providing context for positioning and styling calculations
 * @param {ChartStackLabelsProps} props - Stack label configuration including formatting, styling, and positioning properties
 * @returns {DataLabelRendererResults[]} Array of calculated stack label rendering information with position, styling, and content data
 * @private
 */
function calculateStackLabel(
    positivePoints: Record<string, Points>,
    negativePoints: Record<string, Points>,
    chart: Chart,
    props: ChartStackLabelsProps
): DataLabelRendererResults[] {
    const stackLabels: DataLabelRendererResults[] = [];
    let stackLabelIndex: number = 0;
    const chartBackground: string | undefined = chart.chartArea?.background === 'transparent' ?
        chart.background || chart.themeStyle?.background : chart.chartArea?.background;

    [positivePoints, negativePoints].forEach((points: Record<string, Points>, index: number) => {
        if (points && Object.keys(points).length > 0) {
            Object.keys(points).forEach((pointXValueAsKey: string) => {
                let totalValue: number = 0;
                let currentPoint: Points | undefined;

                const currentSeries: SeriesProperties | undefined =
                points[pointXValueAsKey as string]?.series as SeriesProperties | undefined;
                const pointIndex: number | undefined = points[pointXValueAsKey as string]?.index;

                if (!currentSeries?.stackedValues?.endValues || pointIndex === undefined) {
                    return;
                }

                const positiveValue: number = Number(currentSeries.stackedValues.endValues[pointIndex as number]);
                const negativeValue: number = negativePoints[pointXValueAsKey as string] &&
                    negativePoints[pointXValueAsKey as string].series &&
                    (negativePoints[pointXValueAsKey as string].series as SeriesProperties).stackedValues?.endValues ? Number(
                        (negativePoints[pointXValueAsKey as string].series as SeriesProperties).stackedValues?.endValues?.[
                            negativePoints[pointXValueAsKey as string].index
                        ]) : 0;

                if (index === 0) {
                    // Handle positive points
                    totalValue = positiveValue + negativeValue;
                    currentPoint = points[pointXValueAsKey as string];
                } else if (!positivePoints[pointXValueAsKey as string]) {
                    // Handle negative points only if no corresponding positive point
                    totalValue = positiveValue;
                    currentPoint = points[pointXValueAsKey as string];
                } else {
                    // Skip if we already processed this point in positive case
                    return;
                }

                if (currentPoint?.symbolLocations?.[0]) {
                    const series: SeriesProperties = currentPoint.series as SeriesProperties;
                    const symbolLocation: ChartLocationProps = currentPoint.symbolLocations[0];

                    const labelFormat: string | undefined | null = props?.format;
                    let formattedRawValue: string = totalValue.toString();
                    if (!(labelFormat && labelFormat.indexOf('n') > -1)) {
                        formattedRawValue = (totalValue % 1 === 0)
                            ? totalValue.toFixed(0)
                            : (totalValue.toFixed(2).slice(-1) === '0'
                                ? totalValue.toFixed(1)
                                : totalValue.toFixed(2));
                    }
                    const stackLabelText: string = labelFormat && labelFormat.match('{value}') !== null
                        ? labelFormat.replace('{value}', series.yAxis.format(parseFloat(formattedRawValue)))
                        : series.yAxis.format(parseFloat(formattedRawValue));

                    // Measure text dimensions
                    const textSize: ChartSizeProps = measureText(
                        stackLabelText,
                        props.font as TextStyleModel,
                        chart.themeStyle.datalabelFont
                    );

                    // Define padding for spacing
                    const padding: number = 10;

                    // Determine background color
                    const backgroundColor: string | undefined = props?.fill === 'transparent' && chartBackground === 'transparent'
                        ? ((series.chart.theme.indexOf('Dark') > -1 || series.chart.theme.indexOf('HighContrast') > -1) ? 'black' : 'white')
                        : props?.fill !== 'transparent'
                            ? props?.fill
                            : chartBackground;

                    // Calculate contrast for text color
                    const rgbValue: ColorValue = convertHexToColor(colorNameToHex(String(backgroundColor)));
                    const contrast: number = Math.round((rgbValue.r * 299 + rgbValue.g * 587 + rgbValue.b * 114) / 1000);

                    const alignmentValue: number = textSize.width +
                        (props.border?.width ?? 0) +
                        (Number(props.margin?.left)) +
                        (Number(props.margin?.right)) - padding / 2;

                    // Calculate position offsets
                    const yOffset: number = chart.requireInvertedAxis ? padding / 2 :
                        (chart.axisCollection[0].inverted ? (index === 0 ? (textSize.height + padding / 2) : -padding)
                            : (index === 0 ? -padding : (textSize.height + padding / 2)));

                    let xOffset: number = chart.requireInvertedAxis ?
                        ((chart.axisCollection[0]?.inverted ? (index === 0 ? -(padding + textSize.width / 2) :
                            (padding + textSize.width / 2)) : (index === 0 ? (padding + textSize.width / 2) :
                            -(padding + textSize.width / 2)))) : 0;

                    xOffset += props.align === 'Right' ? alignmentValue :
                        (props.align === 'Left' ? -alignmentValue : 0);

                    if (!series.clipRect) {
                        return;
                    }

                    // Calculate final position constrained within clip rect
                    const clip: Rect = series.clipRect;
                    let xPosition: number = Math.max(clip.x + textSize.width, Math.min(xOffset + clip.x + symbolLocation.x
                        , clip.x + clip.width - textSize.width));

                    let yPosition: number = Math.max(
                        clip.y + textSize.height,
                        Math.min(
                            yOffset + clip.y + symbolLocation.y -
                            ((Number(props.rotationAngle) > 0 && !chart.requireInvertedAxis) ? textSize.width / 2 : 0),
                            clip.y + clip.height - textSize.height
                        )
                    );
                    const isBorder: boolean = props.border?.color !== '' && props.border?.color !== 'Transparent' && Number(props.border?.width) > 0;
                    xPosition = chart.requireInvertedAxis && isBorder ? xPosition + (Number(props.border?.width) * 2) : xPosition;
                    yPosition = !chart.requireInvertedAxis && isBorder ? yPosition - (Number(props.border?.width) * 2) : yPosition;
                    // Create rectangle for label background
                    const rect: Rect = {
                        x: xPosition - textSize.width / 2 - (Number(props.margin?.left)),
                        y: yPosition - textSize.height - (Number(props.margin?.top)),
                        width: textSize.width + ((Number(props.margin?.left)) + (Number(props.margin?.right))),
                        height: textSize.height + padding / 2 + ((Number(props.margin?.top))
                            + (Number(props.margin?.bottom)))
                    };

                    // Create shape rect config
                    const shapeRect: ShapeRectConfig = {
                        id: `${chart.element.id}_StackLabel_TextShape_${stackLabelIndex}`,
                        fill: String(props.fill),
                        border: props.border!,
                        opacity: 1,
                        rect: rect,
                        rx: Number(props.borderRadius?.x),
                        ry: Number(props.borderRadius?.y),
                        transform: `rotate(${props.rotationAngle}, ${rect.width / 2 + rect.x}, ${rect.height / 2 + rect.y})`,
                        stroke: undefined
                    };

                    // Determine text color based on contrast
                    const textColor: string = props?.font?.color || (contrast >= 128 ? 'black' : 'white');

                    // Create text option
                    const textOption: TextOption = {
                        id: `${chart.element.id}_StackLabel_${stackLabelIndex}`,
                        x: xPosition,
                        y: yPosition,
                        anchor: 'middle',
                        text: stackLabelText,
                        transform: `rotate(${props.rotationAngle}, ${rect.width / 2 + rect.x}, ${rect.height / 2 + rect.y})`,
                        labelRotation: props.rotationAngle,
                        fontFamily: props.font?.fontFamily,
                        fontSize: props.font?.fontSize,
                        fontStyle: props.font?.fontStyle,
                        fontWeight: props.font?.fontWeight,
                        fill: textColor
                    };

                    // Add to stack labels collection
                    stackLabels.push({ shapeRect, textOption });
                    stackLabelIndex++;
                }
            });
        }
    });

    return stackLabels;
}

export default ChartStackLabelsRenderer;
