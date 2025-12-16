import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PieChartCenterLabelProps, PieChartFontProps, PieChartSizeProps, PieChartLabelProps, PieChartCenterLabelTextProps } from '../base/interfaces';
import { useLayout } from '../layout/LayoutContext';
import { getCenterLabelTextAnchor, measureText, textWrap } from '../utils/helper';
import { useCenterLabelRenderVersion, useSeriesRenderVersion } from '../hooks/events';
import { HorizontalAlignment } from '@syncfusion/react-base';
import { CenterLabelOptionsProps, CenterLabelRenderResultsProps, Chart, Points, SeriesProperties } from '../base/internal-interfaces';

/**
 * Renders the center label(s) for a chart by calculating their positions, wrapping text if necessary,
 * and preparing options for display. Supports multiple labels and stores per-label options/lines.
 *
 * @param {PieChartCenterLabelProps} props - The properties defining the text style and content for the center label(s).
 * @param {React.RefObject<Chart>} layoutRef - A reference to the chart instance, used to access series data, theme, and other chart properties.
 * @param {string} [hoveredText] - Optional. When provided, renders this text as a temporary hover label instead of the configured labels.
 *
 * @returns {void} This function does not return a value; it mutates the layoutRef's options and wrapped labels.
 */
export const renderCenterLabel: (props: PieChartCenterLabelProps, layoutRef: React.RefObject<Chart>, hoveredText?: string) => void =
(props: PieChartCenterLabelProps, layoutRef: React.RefObject<Chart>, hoveredText?: string): void => {

    const innerRadius: number = layoutRef.current.pieSeries.innerRadius as number;
    const outerRadius: number = layoutRef.current.pieSeries.radius as number;
    const maxWidth: number = layoutRef.current.pieSeries.innerRadius
        ? (2 * innerRadius) * 0.7071067
        : (2 * outerRadius) * 0.7071067;
    let previousBlockHeight: number = 0;
    const labelsConfig: PieChartLabelProps[] = hoveredText ? [{text: hoveredText, textStyle: props?.label?.[0].textStyle}]
        : (props.label) as PieChartLabelProps[];

    const processLabelAtIndex: (labelIndex: number) => void = (labelIndex: number): void => {
        const labelConfig: PieChartLabelProps | undefined = labelsConfig[labelIndex as number];
        const textStyle: PieChartCenterLabelTextProps | undefined =
            labelConfig?.textStyle;

        const alignment: HorizontalAlignment =
            ((textStyle?.textAlignment as HorizontalAlignment) ?? 'Center') as HorizontalAlignment;
        const anchor: string = getCenterLabelTextAnchor(alignment, layoutRef.current.enableRtl);

        const rawText: string = hoveredText
            ?  hoveredText : (labelConfig?.text) as string;
        const splitLines: string[] = rawText.split('<br>');

        // Measure first line to get height
        const firstLineSize: PieChartSizeProps = measureText(
            splitLines[0],
            textStyle as PieChartFontProps,
            layoutRef.current.themeStyle.chartTitleFont
        );

        // Wrap each line if needed by maxWidth
        const wrappedCollection: string[] = [];
        // Track max line height across wrapped lines for consistent tspan spacing
        let effectiveLineHeightPx: number = 0;
        for (let lineIndex: number = 0; lineIndex < splitLines.length; lineIndex++) {
            const originalLine: string = splitLines[lineIndex as number];
            const measuredOriginalLineSize: PieChartSizeProps = measureText(
                originalLine,
                textStyle as PieChartFontProps,
                layoutRef.current.themeStyle.chartTitleFont
            );
            effectiveLineHeightPx = Math.max(effectiveLineHeightPx, measuredOriginalLineSize.height || 0);
            if (measuredOriginalLineSize.width > maxWidth) {
                const wrappedLines: string[] = textWrap(
                    originalLine,
                    maxWidth,
                    textStyle as PieChartFontProps,
                    layoutRef.current.enableRtl,
                    undefined,
                    layoutRef.current.themeStyle.chartTitleFont
                );
                // Update effectiveLineHeightPx by measuring each wrapped segment
                for (let wrappedIndex: number = 0; wrappedIndex < wrappedLines.length; wrappedIndex++) {
                    const wrappedSegmentSize: PieChartSizeProps = measureText(
                        wrappedLines[wrappedIndex as number],
                        textStyle as PieChartFontProps,
                        layoutRef.current.themeStyle.chartTitleFont
                    );
                    effectiveLineHeightPx = Math.max(effectiveLineHeightPx, wrappedSegmentSize.height || 0);
                }
                wrappedCollection.push(...wrappedLines);
            } else {
                wrappedCollection.push(originalLine);
            }
        }

        // Compute total block height using effective line height to match tspan stepping in JSX
        const labelBlockHeightPx: number = effectiveLineHeightPx * wrappedCollection.length;

        const computedLabelCenterY: number = layoutRef.current.pieSeries.center.y + effectiveLineHeightPx;

        const optionForLabel: CenterLabelOptionsProps = {
            id: layoutRef.current.element.id + '_centerLabel_' + String(labelIndex),
            x: layoutRef.current.pieSeries.center.x,
            y: previousBlockHeight + computedLabelCenterY,
            anchor: anchor,
            baseLine: 'auto',
            text: '',
            transform: '',
            // Carry the line height we actually want tspans to use
            centerLabelSizeOptions: {
                ...firstLineSize,
                height: effectiveLineHeightPx
            }
        };
        if (hoveredText) {
            layoutRef.current.textHoverRenderResults[0] = {
                wrappedLabels: wrappedCollection,
                centerLabelOptions: optionForLabel
            };
        }
        else {
            layoutRef.current.centerLabelRenderResults[labelIndex as number] = {
                wrappedLabels: wrappedCollection,
                centerLabelOptions: optionForLabel
            };
        }
        previousBlockHeight += labelBlockHeightPx;
    };

    for (let labelIndex: number = 0; labelIndex < labelsConfig.length; labelIndex++) {
        processLabelAtIndex(labelIndex);
    }
    let semiPie: boolean = false;
    if (layoutRef.current.visibleSeries[0].startAngle &&
        layoutRef.current.visibleSeries[0].endAngle &&
        Math.abs(layoutRef.current.visibleSeries[0].endAngle - layoutRef.current.visibleSeries[0].startAngle) === 180) {
        semiPie = true;
    }
    layoutRef.current.centerLabelCollectionTransform = `translate(0,-${semiPie ? previousBlockHeight : previousBlockHeight / 2})`;
};

interface VersionInfo {
    version: number;
}

/**
 * A React functional component that renders the center label(s) for a chart based on layout phase and rendering options.
 * It manages timing for label visibility (e.g., during animations) and uses the renderCenterLabel function in the measuring phase.
 *
 * @param {PieChartCenterLabelProps} props - The properties defining the text style and content for the center label(s).
 *
 * @returns {JSX.Element | null} Returns one or more <text> SVG elements with wrapped <tspan> elements if rendering conditions are met; otherwise, null.
 */
export const CenterLabelRenderer: React.FC<PieChartCenterLabelProps> = (props: PieChartCenterLabelProps) => {
    const { layoutRef, phase, reportMeasured, isSeriesAnimated } = useLayout();
    const [version, setVersion] = useState(0);
    const centerLabelInfo: VersionInfo = useCenterLabelRenderVersion(layoutRef.current?.element?.id);
    const timerRef: React.RefObject<number | NodeJS.Timeout | null> = useRef<NodeJS.Timeout | number | null>(null);
    const [showLabel, setShowLabel] = useState(false);

    useEffect(() => {
        setVersion(centerLabelInfo.version);
    }, [centerLabelInfo.version]);

    useEffect(() => {
        renderCenterLabel(props, layoutRef);
    }, [
        props.label,
        props.hoverTextFormat
    ]);

    useLayoutEffect(() => {
        if (phase === 'measuring') {
            renderCenterLabel(props, layoutRef);
            reportMeasured('Chart');
        }
    }, [phase]);

    useEffect(() => {
        if (layoutRef.current.format !== '' || version > 0) {
            setShowLabel(true);
            return;
        }
        if (!layoutRef.current.animateSeries) {
            setShowLabel(true);
            return;
        }
        if (timerRef.current) {
            clearTimeout((timerRef.current as number));
            timerRef.current = null;
        }
        const duration: number = layoutRef.current?.visibleSeries?.[0].animation?.duration as number;
        if (duration === 0 || isSeriesAnimated) {
            setShowLabel(true);
            return;
        }
        setShowLabel(false);

        return () => {
            if (timerRef.current) {
                clearTimeout((timerRef.current as number));
                timerRef.current = null;
            }
        };
    }, [phase, version, layoutRef.current?.element?.id, isSeriesAnimated]);

    const legendClickedInfo: { version: number; id: string } = useSeriesRenderVersion();

    useEffect(() => {

        if (legendClickedInfo && legendClickedInfo.id === (layoutRef.current as Chart)?.element.id) {
            const series: SeriesProperties = layoutRef.current?.visibleSeries?.[0 as number];
            const points: Points[] = series?.points;
            const allPointsHidden: boolean = Array.isArray(points) && points.length > 0
                ? points.every((point: Points) => point.visible === false)
                : false;
            setShowLabel(!allPointsHidden);
        }
    }, [legendClickedInfo.version]);

    const optionsArray: CenterLabelRenderResultsProps[] = layoutRef.current.textHoverRenderResults
        && layoutRef.current.textHoverRenderResults.length > 0 ? layoutRef.current.textHoverRenderResults
        : layoutRef.current.centerLabelRenderResults;


    if (!(phase === 'rendering' && showLabel && optionsArray.length)) {
        return null;
    }

    return (
        <g id={`${layoutRef.current.element.id}_centerLabel_Collection`} transform={layoutRef.current.centerLabelCollectionTransform}>
            {optionsArray.map((optionForIndex: CenterLabelRenderResultsProps, labelIndex: number) => {

                const styleForIndex: PieChartFontProps | undefined = props?.label?.[labelIndex as number].textStyle;
                return (
                    <text
                        key={optionForIndex.centerLabelOptions.id}
                        id={`${layoutRef.current.element.id}_centerLabel_${labelIndex}`}
                        x={optionForIndex.centerLabelOptions.x}
                        y={optionForIndex.centerLabelOptions.y}
                        textAnchor={optionForIndex.centerLabelOptions.anchor}
                        dominantBaseline="auto"
                        style={{
                            fontFamily: styleForIndex?.fontFamily,
                            fontSize: styleForIndex?.fontSize,
                            fill: styleForIndex?.color || layoutRef.current.themeStyle.chartTitleFont.color as string,
                            fontWeight: styleForIndex?.fontWeight
                        }}
                    >
                        {optionForIndex.wrappedLabels.map((lineText: string, lineIndex: number) => (
                            <tspan
                                key={`${optionForIndex.centerLabelOptions.id}_tspan_${lineIndex}`}
                                x={optionForIndex.centerLabelOptions.x}
                                y={optionForIndex.centerLabelOptions.y
                                    + lineIndex * optionForIndex.centerLabelOptions.centerLabelSizeOptions.height}
                                style={{
                                    fontFamily: 'inherit',
                                    fontStyle: 'inherit',
                                    fontSize: 'inherit',
                                    fontWeight:
                                        lineText.indexOf('<b>') > -1 || lineText.indexOf('</b>') > -1 ? 'bold' : 'inherit'
                                }}
                            >
                                {lineText}
                            </tspan>
                        ))}
                    </text>
                );
            })}
        </g>
    );
};
