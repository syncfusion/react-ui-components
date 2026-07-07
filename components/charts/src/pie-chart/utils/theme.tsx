
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
    case 'Tailwind':
        style = {
            tabColor: '#49454E',
            chartTitleFont: {
                color: '#111827', fontFamily: 'Inter', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            chartSubTitleFont: {
                color: '#49454E', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendLabel: '#6B7280',
            legendTitleFont: {
                color: '#1C1B1F', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Normal', fontWeight: '600'
            },
            legendLabelFont: {
                color: '#6B7280', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            datalabelFont: {
                color: '#4B5563', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            }
        };
        break;
    case 'TailwindDark':
        style = {
            tabColor: '#CAC4D0',
            chartTitleFont: {
                color: '#FFFFFF', fontFamily: 'Inter', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            chartSubTitleFont: {
                color: '#CAC4D0', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendLabel: '#9CA3AF',
            legendTitleFont: {
                color: '#E6E1E5', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Normal', fontWeight: '600'
            },
            legendLabelFont: {
                color: '#9CA3AF', fontFamily: 'Inter', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            datalabelFont: {
                color: '#D1D5DB', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'Regular', fontWeight: '400'
            }
        };
        break;
    case 'Bootstrap':
        style = {
            tabColor: '#49454E',
            chartTitleFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            chartSubTitleFont: {
                color: '#49454E', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendLabel: '#212529',
            legendTitleFont: {
                color: '#1C1B1F', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Normal', fontWeight: '600'
            },
            legendLabelFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            datalabelFont: {
                color: '#FFFFFF', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            }
        };
        break;
    case 'BootstrapDark':
        style = {
            tabColor: '#CAC4D0',
            chartTitleFont: {
                color: '#FFFFFF', fontFamily: 'Helvetica', fontSize: '18px', fontStyle: 'Medium', fontWeight: '500'
            },
            chartSubTitleFont: {
                color: '#CAC4D0', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Regular', fontWeight: '400'
            },
            legendLabel: '#DEE2E6',
            legendTitleFont: {
                color: '#E6E1E5', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Normal', fontWeight: '600'
            },
            legendLabelFont: {
                color: '#DEE2E6', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            },
            datalabelFont: {
                color: '#212529', fontFamily: 'Helvetica', fontSize: '14px', fontStyle: 'Medium', fontWeight: '500'
            }
        };
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
    case 'MaterialDark':
        palette = [
            '#1E88E5', '#F25087', '#FB8C00', '#43A047', '#E53935',
            '#706C6C', '#F2BD02', '#00ACC1', '#7443B2', '#324070'
        ];
        break;
    case 'Tailwind':
    case 'TailwindDark':
        palette = [
            '#7CCF00', '#8E51FF', '#E12AFB', '#00B8DB', '#FF6900',
            '#8E51FF', '#FF2056', '#9CA3AF', '#D1D5DB', '#E5E7EB'
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
