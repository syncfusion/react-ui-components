import * as React from 'react';
import { useContext, useEffect } from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartIndicatorProps, ChartLinearGradientProps, ChartRadialGradientProps } from '../base/interfaces';
import { ChartProviderChildProps, ChartIndicatorSettings } from '../chart-area/chart-interfaces';
import { Animation, ConnectorProps } from '../../common';
import { extractGradientChildren, extractStops, buildParsedGradient } from '../utils/gradient/gradientParsing';
import { buildGradientSignature } from '../utils/gradient/gradientPipeline';

/**
 * Declarative child used to declare a single technical indicator in JSX.
 * This component intentionally renders nothing — it only carries props.
 *
 * @param {ChartIndicatorProps} _props - Technical indicator configuration properties
 * @returns {null} - It is used only to pass the indicators configuration to the chart through the React context.
 */
export const ChartIndicator: React.FC<ChartIndicatorProps> = (_props: ChartIndicatorProps): null => {
    return null;
};

/**
 * Defines the properties for the IndicatorCollection component.
 *
 * @private
 */
export interface IndicatorCollectionProps {
    children?: React.ReactNode;
}

/**
 * Collects `ChartIndicator` children, merges each child with the
 * default indicator configuration and publishes the resulting
 * `ChartIndicatorSettings[]` to the chart context.
 *
 * @param {IndicatorCollectionProps} props - Component props
 * @param {React.ReactNode} [props.children] - Child ChartIndicator components
 * @returns {null} This component renders nothing
 */
export const ChartIndicatorCollection: React.FC<IndicatorCollectionProps> = (
    { children }: IndicatorCollectionProps
): null => {
    const chartContext: ChartProviderChildProps = useContext(ChartContext) as ChartProviderChildProps;

    /**
     * Tracks changes to the gradient type, coordinates, and color stops
     * nested inside each chart indicator.
     *
     * @private
     */
    const indicatorGradientSignature: string = React.Children.toArray(children)
        .map((child: React.ReactNode): string => {
            if (
                !React.isValidElement(child) ||
                child.type !== ChartIndicator
            ) {
                return 'none';
            }

            const indicatorProps: ChartIndicatorProps =
                child.props as ChartIndicatorProps;

            return buildGradientSignature(
                indicatorProps.children
            );
        })
        .join('|');

    const mergedChildren: ChartIndicatorSettings[] = React.useMemo((): ChartIndicatorSettings[] => {
        const childNodes: React.ReactElement[] = React.Children.toArray(children) as React.ReactElement[];

        const indicatorElements: Array<React.ReactElement<ChartIndicatorProps>> = childNodes.filter(
            (child: React.ReactElement): boolean => React.isValidElement(child) && child.type === ChartIndicator
        ) as Array<React.ReactElement<ChartIndicatorProps>>;

        return indicatorElements.map((el: React.ReactElement<ChartIndicatorProps>): ChartIndicatorSettings => {
            const defaultIndicatorConfig: ChartIndicatorSettings
                = defaultChartConfigs.ChartIndicators as ChartIndicatorSettings;
            const indicatorProps: ChartIndicatorProps = el.props as ChartIndicatorProps;

            const mergedIndicator: ChartIndicatorSettings = {
                ...defaultIndicatorConfig,
                ...indicatorProps
            } as ChartIndicatorSettings;

            // Preserve inner defaults for known nested objects by merging explicitly
            if (indicatorProps.macdLine) {
                mergedIndicator.macdLine = { ...(defaultIndicatorConfig.macdLine as ConnectorProps)
                    , ...indicatorProps.macdLine } as ConnectorProps;
            }
            if (indicatorProps.upperLine) {
                mergedIndicator.upperLine = { ...(defaultIndicatorConfig.upperLine as ConnectorProps)
                    , ...indicatorProps.upperLine } as ConnectorProps;
            }
            if (indicatorProps.lowerLine) {
                mergedIndicator.lowerLine = { ...(defaultIndicatorConfig.lowerLine as ConnectorProps)
                    , ...indicatorProps.lowerLine } as ConnectorProps;
            }
            if (indicatorProps.periodLine) {
                mergedIndicator.periodLine = { ...(defaultIndicatorConfig.periodLine as ConnectorProps)
                    , ...indicatorProps.periodLine } as ConnectorProps;
            }
            if (indicatorProps.animation) {
                mergedIndicator.animation = { ...(defaultIndicatorConfig.animation) as Animation
                    , ...indicatorProps.animation } as Animation;
            }

            const childEl: React.ReactElement<ChartIndicatorProps> = el;
            const gradProps: ChartLinearGradientProps | ChartRadialGradientProps | null =
                extractGradientChildren(
                    (childEl.props as { children?: React.ReactNode }).children
                );

            if (gradProps) {
                const parsed: ReturnType<typeof buildParsedGradient> =
                    buildParsedGradient(gradProps, extractStops(gradProps.children));

                if (parsed && parsed.stops && parsed.kind) {
                    mergedIndicator.gradientProps = gradProps;
                    mergedIndicator.gradientStops = parsed.stops;
                    mergedIndicator.gradientKind = parsed.kind;
                } else {
                    mergedIndicator.gradientProps = undefined;
                    mergedIndicator.gradientStops = undefined;
                    mergedIndicator.gradientKind = undefined;
                }
            } else {
                mergedIndicator.gradientProps = undefined;
                mergedIndicator.gradientStops = undefined;
                mergedIndicator.gradientKind = undefined;
            }

            return mergedIndicator;
        });
    }, [children, indicatorGradientSignature]);

    useEffect((): void => {
        chartContext?.setChartIndicator?.(mergedChildren);
    }, [chartContext, mergedChildren]);

    return null;
};

ChartIndicatorCollection.displayName = 'ChartIndicatorCollection';
