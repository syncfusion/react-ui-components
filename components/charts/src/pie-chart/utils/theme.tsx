
import { Theme } from '../../common';
import { PieChartFontProps } from '../base/interfaces';

/**
 * Represents the theme styling options for a chart component.
 *
 * @private
 */
export interface ThemeStyle {

    /**
     * The color used for active or selected tabs in the chart UI.
     * Typically used to highlight the current view or section.
     */
    tabColor: string;

    /**
     * Font styling for the chart's main title.
     * Includes properties like font size, weight, family, and color.
     */
    chartTitleFont: PieChartFontProps;

    /**
     * Font styling for the chart's subtitle.
     * Useful for providing additional context or description below the main title.
     */
    chartSubTitleFont: PieChartFontProps;

    /**
     * The text color or style applied to legend labels.
     * Used to display series names or categories in the chart legend.
     */
    legendLabel: string;

    /**
     * Font styling for the legend title.
     * Defines properties like font size, weight, and color for the legend heading.
     */
    legendTitleFont: PieChartFontProps;

    /**
     * Font styling for the legend labels.
     * Controls the appearance of individual legend items (e.g., series names).
     */
    legendLabelFont: PieChartFontProps;

    /**
     * Font styling for data labels in the chart.
     * Defines properties like font size, weight, and color for customizing label appearance.
     */
    datalabelFont?: PieChartFontProps;

}

/**
 * Returns the theme style based on the provided theme.
 *
 * @param {Theme} theme - The theme for which the color style needs to be retrieved.
 * @returns {ThemeStyle} The style associated with the specified theme.
 * @private
 */
export function getThemeColor(theme: Theme): ThemeStyle {
    let style: ThemeStyle;
    switch (theme) {
    case 'Material':
        style = {
            tabColor: '#49454E',
            chartTitleFont: {
                color: '#1C1B1F', fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'Regular', fontWeight: '400'
            },
            chartSubTitleFont: {
                color: '#49454E', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendLabel: '#49454E',
            legendTitleFont: {
                color: '#1C1B1F', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Normal', fontWeight: '600'
            },
            legendLabelFont: {
                color: '#1C1B1F', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            datalabelFont: {
                color: '#49454E', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
            }
        };
        break;
    case 'MaterialDark':
        style = {
            tabColor: '#CAC4D0',
            chartTitleFont: {
                color: '#E6E1E5', fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'SemiBold', fontWeight: '600'
            },
            chartSubTitleFont: {
                color: '#CAC4D0', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendLabel: '#CAC4D0',
            legendTitleFont: {
                color: '#E6E1E5', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Normal', fontWeight: '600'
            },
            legendLabelFont: {
                color: '#E6E1E5', fontFamily: 'Roboto', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            datalabelFont: {
                color: '#CAC4D0', fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'Normal', fontWeight: '400'
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
    }
    return palette;
}
