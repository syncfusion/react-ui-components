/**
 * Defines how chart text should behave when it exceeds the boundaries of its container.
 * ```props
 * None :- Displays the full text even if it overlaps with other chart elements.
 * Wrap :- Breaks the text into multiple lines to fit within the container.
 * Trim :- Cuts off the text and may append ellipsis if it exceeds the container width.
 * ```
 */
export type TextOverflow =
    'None' |
    'Wrap' |
    'Trim';

/**
 * Defines the built-in themes available for rendering the chart.
 * ```props
 * Material :- Renders the chart using the Material theme.
 * MaterialDark :- Renders the chart using the Material dark theme.
 * ```
 */
export type Theme =
    'Material' |
    'MaterialDark';

/**
 * Specifies the position of the chart title.
 * ```props
 * Top :- Places the title at the top of the chart.
 * Right :- Places the title on the right side of the chart.
 * Bottom :- Places the title at the bottom of the chart.
 * Left :- Places the title on the left side of the chart.
 * Custom :- Places the title at a custom position based on specified x and y coordinates.
 * ```
 */
export type TitlePosition =
    'Top' |
    'Right' |
    'Bottom' |
    'Left' |
    'Custom';


/**
 * Specifies the position of the chart legend.
 * ```props
 * Auto :- Automatically places the legend based on the chart area type.
 * Top :- Displays the legend at the top of the chart.
 * Left :- Displays the legend on the left side of the chart.
 * Bottom :- Displays the legend at the bottom of the chart.
 * Right :- Displays the legend on the right side of the chart.
 * Custom :- Positions the legend based on specified x and y coordinates.
 * ```
 */
export type LegendPosition =
    'Auto' |
    'Top' |
    'Left' |
    'Bottom' |
    'Right' |
    'Custom';

/**
 * Defines how tooltips fade out in the chart.
 * ```props
 * Click :- Removes the tooltip when the user clicks.
 * Move :- Removes the tooltip after a short delay when the pointer moves.
 * ```
 */
export type FadeOutMode =
    'Click' |
    'Move';
