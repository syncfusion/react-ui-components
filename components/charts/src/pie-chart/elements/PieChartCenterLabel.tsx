
import { ChartContext, ChartProviderChildProps } from '../layout/ChartProvider';
import { useContext, useEffect, useMemo, useRef } from 'react';
import { defaultChartConfigs } from '../base/default-properties';
import { PieChartCenterLabelProps, PieChartCenterLabelTextProps, PieChartLabelProps } from '../base/interfaces';

/**
 * PieChartCenterLabel updates the chart's center-label configuration in the ChartContext.
 * It merges the incoming props with defaults so each label inherits the default text/textStyle
 * from defaultChartConfigs.CenterLabel.label[0], then pushes the merged config to the provider.
 *
 * Note: This component renders nothing; it only updates context state for consumers.
 *
 * @param {PieChartCenterLabelProps} props - Center-label configuration to merge with defaults.
 * @returns {JSX.Element | null} Returns null as nothing is rendered to the DOM.
 */
export const PieChartCenterLabel: React.FC<PieChartCenterLabelProps> = (props: PieChartCenterLabelProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    const defaultCenterLabel: PieChartCenterLabelProps = defaultChartConfigs?.CenterLabel;
    const defaultLabelItem: PieChartLabelProps = defaultCenterLabel?.label?.[0] as PieChartLabelProps;
    const defaultTextStyle: PieChartCenterLabelTextProps = defaultLabelItem?.textStyle as PieChartCenterLabelTextProps;

    const mergedLabels: {
        text: string | undefined;
        textStyle: PieChartCenterLabelTextProps;
    }[] | undefined = useMemo(() => {

        return props?.label?.map((item: PieChartLabelProps) => {
            const itemTextStyle: PieChartCenterLabelTextProps = item?.textStyle as PieChartCenterLabelTextProps;
            return {
                ...defaultLabelItem,
                ...item,
                text: item?.text,
                textStyle: {
                    ...defaultTextStyle,
                    ...itemTextStyle
                }
            };
        });
    }, [props.label, defaultLabelItem, defaultTextStyle]);

    const nextCenterLabelConfig: {
        label: PieChartLabelProps[] | undefined;
        hoverTextFormat: string | undefined;
    } = useMemo(() => {
        const label: PieChartLabelProps[] | undefined = mergedLabels && mergedLabels.length > 0 ? mergedLabels : defaultCenterLabel.label;
        return {
            ...defaultCenterLabel,
            ...props,
            label,
            hoverTextFormat: props.hoverTextFormat ?? defaultCenterLabel.hoverTextFormat
        };
    }, [mergedLabels, props, defaultCenterLabel]);

    const lastSignatureRef: { current: string | null } = useRef<string | null>(null);

    useEffect(() => {
        const signature: string = JSON.stringify(nextCenterLabelConfig);
        if (lastSignatureRef.current !== signature) {
            lastSignatureRef.current = signature;
            context?.setChartCenterLabel(nextCenterLabelConfig);
        }
    }, [nextCenterLabelConfig, context]);

    return null;
};
