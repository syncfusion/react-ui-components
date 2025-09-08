import { Browser } from '@syncfusion/react-base';
import { Theme } from '../base/enum';
import { Rect, TextStyleModel } from '../chart-area/chart-interfaces';

export interface IThemeStyle {
    axisLabel: string;
    axisTitle: string;
    axisLine: string;
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
    chartSubTitleFont: TextStyleModel;
    crosshairLabelFont: TextStyleModel;
    stripLineLabelFont: TextStyleModel;
}

/**
 * Returns the theme style based on the provided theme.
 *
 * @param {Theme} theme - The theme for which the color style needs to be retrieved.
 * @returns {IThemeStyle} The style associated with the specified theme.
 * @private
 */
export function getThemeColor(theme: Theme): IThemeStyle {
    let style: IThemeStyle;
    switch (theme) {
    case 'Material3':
        style = {
            axisLabel: '#49454E',
            axisTitle: '#1E192B',
            axisLine: '#E7E3F0',
            majorGridLine: '#F3F1F8',
            minorGridLine: '#F3F1F8',
            majorTickLine: '#F3F1F8',
            minorTickLine: ' #F3F1F8',
            legendLabel: '#49454E',
            background: 'transparent',
            areaBorder: '#E7E0EC',
            errorBar: '#79747E',
            crosshairLine: '#49454E',
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
            bearFillColor: '#5887FF',
            bullFillColor: '#F7523F',
            toolkitSelectionColor: '#49454E',
            toolkitFill: '#49454E',
            toolkitIconRectOverFill: '#EADDFF',
            toolkitIconRectSelectionFill: '#EADDFF',
            toolkitIconRect: { x: -4, y: -5, height: 26, width: 26 },
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
    case 'Material3Dark':
        style = {
            axisLabel: '#CAC4D0',
            axisTitle: '#E8DEF8',
            axisLine: '#322E3A',
            majorGridLine: '#2A2831',
            minorGridLine: '#2A2831',
            majorTickLine: '#2A2831',
            minorTickLine: ' #2A2831',
            legendLabel: '#CAC4D0',
            background: 'transparent',
            areaBorder: '#49454F',
            errorBar: '#938F99',
            crosshairLine: '#CAC4D0',
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
            bearFillColor: '#B3F32F',
            bullFillColor: '#FF9E45',
            toolkitSelectionColor: '#CAC4D0',
            toolkitFill: '#CAC4D0',
            toolkitIconRectOverFill: '#4F378B',
            toolkitIconRectSelectionFill: '#4F378B',
            toolkitIconRect: { x: -4, y: -5, height: 26, width: 26 },
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
    case 'Material3':
        palette = [
            '#1E88E5', '#F25087', '#FB8C00', '#43A047', '#E53935',
            '#706C6C', '#F2BD02', '#00ACC1', '#7443B2', '#324070'
        ];
        break;
    case 'Material3Dark':
        palette = [
            '#1E88E5', '#F25087', '#FB8C00', '#43A047', '#E53935',
            '#706C6C', '#F2BD02', '#00ACC1', '#7443B2', '#324070'
        ];
        break;
    }
    return palette;
}
