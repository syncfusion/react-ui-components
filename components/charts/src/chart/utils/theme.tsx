import { Browser } from '@syncfusion/react-base';
import { Theme } from '../../common';
import { Rect, TextStyleModel } from '../chart-area/chart-interfaces';

export interface IThemeStyle {
    axisLabel: string;
    axisTitle: string;
    axisLine: string;
    polarRadarGridLine: string;
    polarRadarTickLine: string;
    majorGridLine: string;
    minorGridLine: string;
    majorTickLine: string;
    minorTickLine: string;
    legendLabel: string;
    background: string;
    areaBorder: string;
    errorBar: string;
    crosshairLine: string;
    crosshairBackground: string;
    crosshairFill: string;
    crosshairLabel: string;
    tooltipFill: string;
    tooltipBoldLabel: string;
    tooltipLightLabel: string;
    tooltipHeaderLine: string;
    markerShadow: string | null;
    selectionRectFill: string;
    selectionRectStroke: string;
    selectionCircleStroke: string;
    tabColor: string;
    bearFillColor: string;
    bullFillColor: string;
    toolkitSelectionColor: string;
    toolkitFill: string;
    toolkitIconRectOverFill: string;
    toolkitIconRectSelectionFill: string;
    toolkitIconRect: Rect;  // Use appropriate type for Rect
    chartTitleFont: TextStyleModel;
    axisLabelFont: TextStyleModel
    legendTitleFont: TextStyleModel;
    legendLabelFont: TextStyleModel;
    tooltipLabelFont: TextStyleModel;
    axisTitleFont: TextStyleModel;
    datalabelFont: TextStyleModel;
    serieslabelFont: TextStyleModel;
    chartSubTitleFont: TextStyleModel;
    crosshairLabelFont: TextStyleModel;
    stripLineLabelFont: TextStyleModel;
    histogram: string;
    scrollbarTrackColor: string;
    scrollbarThumbColor: string;
    resizeCircleColor: string;
    resizeCircleArrowColor: string;
    resizeCircleBorderColor: string;
}

/**
 * Retrieves the style configuration corresponding to the specified theme.
 *
 * @param {Theme} theme - The theme for which the color style needs to be retrieved.
 * @returns {IThemeStyle} The style associated with the specified theme.
 * @private
 */
export function getThemeColor(theme: Theme): IThemeStyle {
    let style: IThemeStyle;
    switch (theme) {
    case 'Material':
        style = {
            axisLabel: '#49454E',
            axisTitle: '#1E192B',
            axisLine: '#E7E3F0',
            polarRadarGridLine: '#eaeaea',
            polarRadarTickLine: '#b5b5b5',
            majorGridLine: '#F3F1F8',
            minorGridLine: '#F3F1F8',
            majorTickLine: '#F3F1F8',
            minorTickLine: ' #F3F1F8',
            legendLabel: '#49454E',
            background: 'transparent',
            areaBorder: '#E7E0EC',
            errorBar: '#79747E',
            crosshairLine: '#9E9E9E',
            crosshairBackground: 'rgba(73, 69, 78, 0.1)',
            crosshairFill: '#313033',
            crosshairLabel: '#F4EFF4',
            tooltipFill: '#313033',
            tooltipBoldLabel: '#F4EFF4',
            tooltipLightLabel: '#F4EFF4',
            tooltipHeaderLine: '#F4EFF4',
            markerShadow: null,
            selectionRectFill: 'rgb(98, 0, 238, 0.06)',
            selectionRectStroke: '#6200EE',
            selectionCircleStroke: '#79747E',
            tabColor: '#49454E',
            bearFillColor: '#E53935',
            bullFillColor: '#43A047',
            toolkitSelectionColor: '#49454E',
            toolkitFill: '#49454E',
            toolkitIconRectOverFill: '#EADDFF',
            toolkitIconRectSelectionFill: '#EADDFF',
            toolkitIconRect: { x: -4, y: -5, height: 26, width: 26 },
            histogram: '#D21020',
            scrollbarTrackColor: '#E0E0E0',
            scrollbarThumbColor: '#9E9E9E',
            resizeCircleColor: '#E6E6E6',
            resizeCircleArrowColor: '#6E6E6E',
            resizeCircleBorderColor: '#9E9E9E',
            chartTitleFont: {
                color: '#1C1B1F', fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'Regular', fontWeight: '400'
            },
            axisLabelFont: {
                color: '#1C1B1F', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendTitleFont: {
                color: '#1C1B1F', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Normal', fontWeight: '600'
            },
            legendLabelFont: {
                color: '#1C1B1F', fontFamily: 'Roboto', fontSize: Browser.isDevice ? '12px' : '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            tooltipLabelFont: {
                color: '#F4EFF4', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: ''
            },
            axisTitleFont: {
                color: '#1C1B1F', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            datalabelFont: {
                color: '#1E192B', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
            },
            serieslabelFont: {
                color: '#969696', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Normal', fontWeight: '400'
            },
            chartSubTitleFont: {
                color: '#49454E', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            crosshairLabelFont: {
                color: '#F4EFF4', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
            },
            stripLineLabelFont: {
                color: '#79747E', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
            }
        };
        break;
    case 'MaterialDark':
        style = {
            axisLabel: '#CAC4D0',
            axisTitle: '#E8DEF8',
            axisLine: '#322E3A',
            polarRadarGridLine: '#514F4F',
            polarRadarTickLine: '#414040',
            majorGridLine: '#2A2831',
            minorGridLine: '#2A2831',
            majorTickLine: '#2A2831',
            minorTickLine: ' #2A2831',
            legendLabel: '#CAC4D0',
            background: 'transparent',
            areaBorder: '#49454F',
            errorBar: '#938F99',
            crosshairLine: '#9E9E9E',
            crosshairBackground: 'rgba(73, 69, 78, 0.1)',
            crosshairFill: '#E6E1E5',
            crosshairLabel: '#313033',
            tooltipFill: '#E6E1E5',
            tooltipBoldLabel: '#313033',
            tooltipLightLabel: '#313033',
            tooltipHeaderLine: '#313033',
            markerShadow: null,
            selectionRectFill: 'rgba(78, 170, 255, 0.06)',
            selectionRectStroke: '#4EAAFF',
            selectionCircleStroke: '#938F99',
            tabColor: '#CAC4D0',
            bearFillColor: '#FF7043',
            bullFillColor: '#66BB6A',
            toolkitSelectionColor: '#CAC4D0',
            toolkitFill: '#CAC4D0',
            toolkitIconRectOverFill: '#4F378B',
            toolkitIconRectSelectionFill: '#4F378B',
            toolkitIconRect: { x: -4, y: -5, height: 26, width: 26 },
            histogram: '#FF9E45',
            scrollbarTrackColor: '#E0E0E0',
            scrollbarThumbColor: '#9E9E9E',
            resizeCircleColor: '#E6E6E6',
            resizeCircleArrowColor: '#6E6E6E',
            resizeCircleBorderColor: '#9E9E9E',
            chartTitleFont: {
                color: '#E6E1E5', fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'SemiBold', fontWeight: '600'
            },
            axisLabelFont: {
                color: '#E6E1E5', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendTitleFont: {
                color: '#E6E1E5', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Normal', fontWeight: '600'
            },
            legendLabelFont: {
                color: '#E6E1E5', fontFamily: 'Roboto', fontSize: Browser.isDevice ? '12px' : '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            tooltipLabelFont: {
                color: '#313033', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: ''
            },
            axisTitleFont: {
                color: '#E6E1E5', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            datalabelFont: {
                color: '#E8DEF8', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
            },
            serieslabelFont: {
                color: '#969696', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Normal', fontWeight: '400'
            },
            chartSubTitleFont: {
                color: '#CAC4D0', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            crosshairLabelFont: {
                color: '#313033', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
            },
            stripLineLabelFont: {
                color: '#E6E1E5', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
            }
        };
        break;

    case 'Tailwind':
        style = {
            axisLabel: '#6B7280',
            axisTitle: '#9CA3AF',
            axisLine: '#D1D5DB',
            polarRadarGridLine: '#E5E7EB',
            polarRadarTickLine: '#D1D5DB',
            majorGridLine: '#E5E7EB',
            minorGridLine: '#E5E7EB',
            majorTickLine: '#E5E7EB',
            minorTickLine: '#E5E7EB',
            legendLabel: '#9CA3AF',
            background: 'transparent',
            areaBorder: '#E7E0EC',
            errorBar: '#374151',
            crosshairLine: '#1F2937',
            crosshairBackground: 'rgba(73, 69, 78, 0.1)',
            crosshairFill: '#111827     ',
            crosshairLabel: '#F9FAFB',
            tooltipFill: '#111827',
            tooltipBoldLabel: '#F9FAFB',
            tooltipLightLabel: '#F9FAFB',
            tooltipHeaderLine: '#D1D5DB',
            markerShadow: null,
            selectionRectFill: 'rgba(224, 231, 255, 0.25)',
            selectionRectStroke: '#4F46E5',
            selectionCircleStroke: '#79747E',
            tabColor: '#4F46E5',
            bearFillColor: '#2ecd71',
            bullFillColor: '#e74c3d',
            toolkitSelectionColor: '#4F46E5',
            toolkitFill: '#6B7280',
            toolkitIconRectOverFill: 'transparent',
            toolkitIconRectSelectionFill: 'transparent',
            toolkitIconRect: { x: -4, y: -5, height: 26, width: 26 },
            histogram: '#D035A4',
            scrollbarTrackColor: '#E5E7EB',
            scrollbarThumbColor: '#D1D5DB',
            resizeCircleColor: '#FFFFFF',
            resizeCircleArrowColor: '#6B7280',
            resizeCircleBorderColor: '#9E9E9E',
            chartTitleFont: {
                color: '#111827', fontFamily: 'Inter', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            axisLabelFont: {
                color: '#6B7280', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendTitleFont: {
                color: '#111827', fontFamily: 'Inter', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            legendLabelFont: {
                color: '#6B7280', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Medium', fontWeight: '400'
            },
            tooltipLabelFont: {
                color: '#F9FAFB', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            axisTitleFont: {
                color: '#6B7280', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            datalabelFont: {
                color: '#111827', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Medium', fontWeight: '400'
            },
            serieslabelFont: {
                color: '#969696', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Normal', fontWeight: '400'
            },
            chartSubTitleFont: {
                color: '#6B7280', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'SemiBold', fontWeight: '600'
            },
            crosshairLabelFont: {
                color: '#F9FAFB', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            stripLineLabelFont: {
                color: '#111827', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            }
        };
        break;

    case 'TailwindDark':
        style = {
            axisLabel: '#9CA3AF',
            axisTitle: '#F3F4F6',
            axisLine: '#4B5563',
            polarRadarGridLine: '#374151',
            polarRadarTickLine: '#4B5563',
            majorGridLine: '#374151',
            minorGridLine: '#374151',
            majorTickLine: '#374151',
            minorTickLine: '#374151',
            legendLabel: '#F3F4F6',
            background: 'transparent',
            areaBorder: '#49454F',
            errorBar: '#938F99',
            crosshairLine: '#9CA3AF',
            crosshairBackground: 'rgba(73, 69, 78, 0.1)',
            crosshairFill: '#F9FAFB',
            crosshairLabel: '#1F2937',
            tooltipFill: '#F9FAFB',
            tooltipBoldLabel: '#1F2937',
            tooltipLightLabel: '#1F2937',
            tooltipHeaderLine: '#374151',
            markerShadow: null,
            selectionRectFill: 'rgba(78, 170, 255, 0.06)',
            selectionRectStroke: '#6366F1',
            selectionCircleStroke: '#282727',
            tabColor: '#CAC4D0',
            bearFillColor: '#EF291F',
            bullFillColor: '#0D72DE',
            toolkitSelectionColor: '#22D3EE',
            toolkitFill: '#D1D5DB',
            toolkitIconRectOverFill: 'transparent',
            toolkitIconRectSelectionFill: 'transparent',
            toolkitIconRect: { x: -4, y: -5, height: 26, width: 26 },
            histogram: '#D035A4',
            scrollbarTrackColor: '#6B7280',
            scrollbarThumbColor: '#374151',
            resizeCircleColor: '#4B5563',
            resizeCircleArrowColor: '#ADB5BD',
            resizeCircleBorderColor: '#9E9E9E',
            chartTitleFont: {
                color: '#FFFFFF', fontFamily: 'Inter', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            axisLabelFont: {
                color: '#F3F4F6', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendTitleFont: {
                color: '#FFFFFF', fontFamily: 'Inter', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            legendLabelFont: {
                color: '#9CA3AF', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            tooltipLabelFont: {
                color: '#1F2937', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            axisTitleFont: {
                color: '#F3F4F6', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            datalabelFont: {
                color: '#FFFFFF', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Medium', fontWeight: '400'
            },
            serieslabelFont: {
                color: '#969696', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Normal', fontWeight: '400'
            },
            chartSubTitleFont: {
                color: '#F3F4F6', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'SemiBold', fontWeight: '600'
            },
            crosshairLabelFont: {
                color: '#1F2937', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Medium', fontWeight: '500'
            },
            stripLineLabelFont: {
                color: '#FFFFFF', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            }
        };
        break;
    case 'Bootstrap':
        style = {
            axisLabel: '#212529',
            axisTitle: '#212529',
            axisLine: '#DEE2E6',
            polarRadarGridLine: '#eaeaea',
            polarRadarTickLine: '#b5b5b5',
            majorGridLine: '#E9ECEF',
            minorGridLine: '#E9ECEF',
            majorTickLine: '#E9ECEF',
            minorTickLine: '#E9ECEF',
            legendLabel: '#212529',
            background: 'transparent',
            areaBorder: '#E7E0EC',
            errorBar: '#79747E',
            crosshairLine: '#343A40',
            crosshairBackground: 'rgba(73, 69, 78, 0.1)',
            crosshairFill: '#212529',
            crosshairLabel: '#FFFFFF',
            tooltipFill: '#000000E5',
            tooltipBoldLabel: '#FFFFFF',
            tooltipLightLabel: '#FFFFFF',
            tooltipHeaderLine: '#DEE2E6',
            markerShadow: null,
            selectionRectFill: 'rgba(134,183,254, 0.1)',
            selectionRectStroke: '#0D6EFD',
            selectionCircleStroke: '#6B7280',
            tabColor: '#0D6EFD',
            bearFillColor: '#DC3545',
            bullFillColor : '#6F42C1',
            toolkitSelectionColor: '#6E757D',
            toolkitFill: '#6E757D',
            toolkitIconRectOverFill: '#F8F9FA',
            toolkitIconRectSelectionFill: '#F8F9FA',
            toolkitIconRect: { x: -4, y: -5, height: 26, width: 26 },
            histogram: '#D21020',
            scrollbarTrackColor: '#E5E7EB',
            scrollbarThumbColor: '#D1D5DB',
            resizeCircleColor: '#FFFFFF',
            resizeCircleArrowColor: '#6B7280',
            resizeCircleBorderColor: '#9E9E9E',
            chartTitleFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            axisLabelFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendTitleFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '18px', fontStyle: 'Normal', fontWeight: '500'
            },
            legendLabelFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            tooltipLabelFont: {
                color: '#FFFFFF', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            axisTitleFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            datalabelFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            serieslabelFont: {
                color: '#969696', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Normal', fontWeight: '400'
            },
            chartSubTitleFont: {
                color: '#212529BF', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'SemiBold', fontWeight: '600'
            },
            crosshairLabelFont: {
                color: '#FFFFFF', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
            },
            stripLineLabelFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            }
        };
        break;

    case 'BootstrapDark':
        style = {
            axisLabel: '#DEE2E6',
            axisTitle: '#DEE2E6',
            axisLine: '#495057',
            polarRadarGridLine: '#514F4F',
            polarRadarTickLine: '#414040',
            majorGridLine: '#343A40',
            minorGridLine: '#343A40',
            majorTickLine: '#343A40',
            minorTickLine: '#343A40',
            legendLabel: '#DEE2E6',
            background: 'transparent',
            areaBorder: '#49454F',
            errorBar: '#938F99',
            crosshairLine: '#ADB5BD',
            crosshairBackground: 'rgba(73, 69, 78, 0.1)',
            crosshairFill: '#DEE2E6',
            crosshairLabel: '#212529',
            tooltipFill: '#FFFFFFE5',
            tooltipBoldLabel: '#212529',
            tooltipLightLabel: '#212529',
            tooltipHeaderLine: '#444C54',
            markerShadow: null,
            selectionRectFill: 'rgba(134,183,254, 0.25)',
            selectionRectStroke: '#0D6EFD',
            selectionCircleStroke: '#0D6EFD',
            tabColor: '#0D6EFD',
            bearFillColor: '#DC3545',
            bullFillColor : '#6F42C1',
            toolkitSelectionColor: '#F8F9FA',
            toolkitFill: '#ADB5BD',
            toolkitIconRectOverFill: '#2B3035',
            toolkitIconRectSelectionFill: '#343A40',
            toolkitIconRect: { x: -4, y: -5, height: 26, width: 26 },
            histogram: '#FF9E45',
            scrollbarTrackColor: '#E5E7EB',
            scrollbarThumbColor: '#D1D5DB',
            resizeCircleColor: '#FFFFFF',
            resizeCircleArrowColor: '#6B7280',
            resizeCircleBorderColor: '#9E9E9E',
            chartTitleFont: {
                color: '#DEE2E6', fontFamily: 'Helvetica', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            axisLabelFont: {
                color: '#DEE2E6', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendTitleFont: {
                color: '#DEE2E6', fontFamily: 'Helvetica', fontSize: '18px', fontStyle: 'Normal', fontWeight: '500'
            },
            legendLabelFont: {
                color: '#DEE2E6', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            tooltipLabelFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            },
            axisTitleFont: {
                color: '#DEE2E6', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            datalabelFont: {
                color: '#DEE2E6', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            serieslabelFont: {
                color: '#969696', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Normal', fontWeight: '400'
            },
            chartSubTitleFont: {
                color: '#DEE2E6BF', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            crosshairLabelFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'Normal', fontWeight: '500'
            },
            stripLineLabelFont: {
                color: '#DEE2E6', fontFamily: 'Helvetica', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
            }
        };
        break;

    }
    return style;
}


/**
 * Gets an array of series colors for chart visualization.
 *
 * @param {Theme} theme - The theme for which to retrieve the series colors.
 * @returns {string[]} - An array of series colors.
 * @private
 */
export function getSeriesColor(theme: Theme): string[] {
    let palette: string[];
    switch (theme) {
    case 'Material':
        palette = [
            '#1E88E5', '#F25087', '#FB8C00', '#43A047', '#E53935',
            '#706C6C', '#F2BD02', '#00ACC1', '#7443B2', '#324070'
        ];
        break;
    case 'MaterialDark':
        palette = [
            '#1E88E5', '#F25087', '#FB8C00', '#43A047', '#E53935',
            '#706C6C', '#F2BD02', '#00ACC1', '#7443B2', '#324070'
        ];
        break;
    case 'Tailwind':
        palette = [
            '#7CCF00', '#8E51FF', '#E12AFB', '#00B8DB', '#FF6900', '#8E51FF', '#FF2056', '#00A6F4',
            '#00C950', '#F0B100', '#1F2937', '#9CA3AF', '#D1D5DB', '#E5E7EB'
        ];
        break;
    case 'TailwindDark':
        palette = [
            '#7CCF00', '#8E51FF', '#E12AFB', '#00B8DB', '#FF6900', '#8E51FF', '#FF2056', '#00A6F4',
            '#00C950', '#F0B100', '#1F2937', '#4B5563', '#374151', '#282F3C'
        ];
        break;
    case 'Bootstrap':
    case 'BootstrapDark':
        palette = [
            '#3F51B5', '#2196F3', '#FF9800', '#F44336', '#9C27B0',
            '#4CAF50', '#FDD835', '#2196F5', '#E91E63', '#673AB7'
        ];
        break;
    }

    return palette;
}
