import { ChartFontProps } from '../base/interfaces';
import { AxisLabelPosition, EdgeLabelPlacement, LabelIntersectMode, LabelPlacement, TextOverflow } from '../base/enum';
import { HorizontalAlignment } from '@syncfusion/react-base';


/**
 * Interface for a class Font.
 *
 * @private
 */
export interface AxisTextStyle {

    /**
     * Specifies the style of the text.
     *
     * @default 'Normal'
     */
    fontStyle?: string;

    /**
     * Specifies the size of the text.
     *
     * @default '16px'
     */
    fontSize?: string;

    /**
     * Specifies the font weight of the text.
     *
     * @default 'Normal'
     */
    fontWeight?: string;

    /**
     * Specifies the color of the text.
     *
     * @default ''
     */
    color?: string;

    /**
     * Specifies the alignment of the text.
     *
     * @default 'Center'
     */
    textAlign?: HorizontalAlignment;

    /**
     * Specifies the font family for the text.
     */
    fontFamily?: string;

    /**
     * Specifies the opacity level for the text.
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Specifies how the chart title text should handle overflow.
     *
     * @default 'Wrap'
     */
    textOverflow?: TextOverflow;
}

/**
 * Interface for dateFormatOptions
 *
 * @private
 */
export interface DateFormatOptions {
    /**
     * Specifies the skeleton for date formatting.
     */
    skeleton?: string;
    /**
     * Specifies the type of date formatting either date, dateTime or time.
     */
    type?: string;
    /**
     * Specifies custom date formatting to be used.
     */
    format?: string;
    /**
     * Specifies the calendar mode other than gregorian
     */
    calendar?: string;
    /**
     * Enable server side date formating.
     */
    isServerRendered?: boolean;
    /**
     * Determines the locale of the date formatting.
     */
    locale?: string;
}

/**
 * Defines the style settings for axis labels in a chart.
 * Extends basic font properties and includes additional customization options.
 */
export interface ChartAxisLabelProps extends ChartFontProps {

    /**
     * Specifies the angle in degrees to rotate the axis label text.
     * A positive value rotates the label clockwise, and a negative value rotates it counterclockwise.
     *
     * @default 0
     */
    rotationAngle?: number;

    /**
     * Used to format the axis label. This property accepts global string formats such as `C`, `n1`, `P`, etc.
     * It also accepts placeholders like `{value}°C`, where `{value}` represents the axis label (e.g., 20°C).
     *
     * @default ''
     */
    format?: string;

    /**
     * Specifies the skeleton format used for processing date-time values.
     *
     * @default ''
     */
    skeleton?: string;

    /**
     * The `padding` property adjusts the distance to ensure a clear space between the axis labels and the axis line.
     *
     * @default 5
     */
    padding?: number;

    /**
     * The `position` property determines where the axis labels are rendered in relation to the axis line.
     * Available options are:
     * - `Inside`: Renders the labels inside the axis line.
     * - `Outside`: Renders the labels outside the axis line.
     *
     * @default 'Outside'
     */
    position?: AxisLabelPosition;

    /**
     * The `placement` property controls where the category axis labels are rendered in relation to the axis ticks.
     * Available options are:
     * - `BetweenTicks`: Renders the label between the axis ticks.
     * - `OnTicks`: Renders the label directly on the axis ticks.
     *
     * @default 'BetweenTicks'
     */
    placement?: LabelPlacement;

    /**
     * Specifies the action to take when axis labels intersect with each other.
     * The available options are:
     * - `None`: Shows all labels without any modification.
     * - `Hide`: Hides the label if it intersects with another label.
     * - `Trim`: Trims the label text to fit within the available space.
     * - `Wrap`: Wraps the label text to fit within the available space.
     * - `MultipleRows`: Displays the label text in multiple rows to avoid intersection.
     * - `Rotate45`: Rotates the label text by 45 degrees to avoid intersection.
     * - `Rotate90`: Rotates the label text by 90 degrees to avoid intersection.
     *
     * @default Trim
     */
    intersectAction?: LabelIntersectMode;

    /**
     * When set to `true`, axis labels will automatically wrap to fit within the width defined by `maxLabelWidth`.
     * This helps maintain readability by preventing label overflow, especially when labels are long or the chart has limited space.
     *
     * @default false
     */
    enableWrap?: boolean;

    /**
     * When set to `true`, axis labels are trimmed based on the `maxLabelWidth` setting.
     * This helps prevent label overflow and ensures a cleaner layout, especially when labels are long or space is limited on the chart.
     *
     * @default false
     */
    enableTrim?: boolean;

    /**
     * Specifies the maximum width of an axis label.
     *
     * @default 34
     */
    maxLabelWidth?: number;

    /**
     * The `edgeLabelPlacement` property ensures that labels positioned at the edges of the axis do not overlap with the axis boundaries or other chart elements, offering several options to improve chart readability by managing edge labels effectively.
     * Available options are:
     * - `None`: No action will be performed on edge labels.
     * - `Hide`: Edge labels will be hidden to prevent overlap.
     * - `Shift`: Edge labels will be shifted to fit within the axis bounds without overlapping.
     *
     * @default 'Shift'
     */
    edgeLabelPlacement?: EdgeLabelPlacement;

    /**
     * Determines the alignment of the text within its container.
     *
     * Available options:
     * - `Left`: Aligns the text to the left.
     * - `Center`: Aligns the text to the center.
     * - `Right`: Aligns the text to the right.
     *
     * @default 'Center'
     */
    align?: HorizontalAlignment;

    /**
     * A callback function that allows for custom rendering of axis labels.
     * This function is invoked for each axis label and receives the label's properties as an argument.
     * Available arguments are:
     * - `value`- The numeric value of the axis label.
     * - `text` - The current formatted text of the axis label.
     *
     * @param {number} value - The numeric value of the axis label.
     * @param {string} text - The current formatted text of the axis label.
     * @default null
     */
    formatter?: (value: number, text: string) => string | boolean;
}

/**
 * A function type that defines how to customize the content of an axis label.
 * This function receives the label value and current text, and returns the modified text.
 *
 * @param {number} value - The numeric value of the axis label.
 * @param {string} text - The current formatted text of the axis label.
 * @returns {string} The custom text to display for the axis label.
 * @private
 */
export type AxisLabelContentFunction = (value: number, text: string) => string | boolean;

/**
 * Defines the style settings for the axis title in a chart.
 * Extends basic font properties and includes customization for padding and rotation.
 */
export interface ChartAxisTitleProps extends ChartFontProps {
    /**
     * Specifies the text content of the axis title.
     *
     * @default ''
     */
    text?: string;

    /**
     * Specifies the padding between the axis title and the axis labels.
     *
     * @default 5
     */
    padding?: number;

    /**
     * Defines an angle for rotating the axis title. By default, the angle is calculated based on the position and orientation of the axis.
     *
     * @default null
     */
    rotationAngle?: number;

    /**
     * Determines the alignment of the axis title within its container.
     *
     * Available options:
     * - `Left`: Aligns the axis title to the left.
     * - `Center`: Aligns the axis title to the center.
     * - `Right`: Aligns the axis title to the right.
     *
     * @default 'Center'
     */
    align?: HorizontalAlignment;

    /**
     * Controls how the axis title behaves when it overflows its container.
     *
     * Available options:
     * - `Wrap`: Wraps the axis title to the next line.
     * - `Trim`: Trims the overflowed axis title.
     * - `None`: Displays the axis title even if it overlaps other elements.
     *
     * @default 'Wrap'
     */
    overflow?: TextOverflow;
}
