import { DataManager, Query } from '@syncfusion/react-data';
import { PieEmptyPointMode, GroupModes, PieLegendShape, PieLabelPosition, ConnectorType, LegendAlignment } from './enum';
import { HorizontalAlignment } from '@syncfusion/react-base';
import { TextOverflow, Theme, TitlePosition, FadeOutMode, LegendPosition } from '../../common/enum';
import { FocusOutlineProps } from '../../common/interfaces';
import { Animation } from '../../common/interfaces';
import * as React from 'react';

/**
 * Defines the configuration options for the PieChart component.
 *
 * @public
 */
export interface PieChartComponentProps {

    /**
     * Unique identifier for the pie chart element.
     *
     * @default ''
     */
    id?: string;

    /**
     * Sets the width of the chart. Accepts values in pixels (e.g., `'100px'`) or percentages (e.g., `'100%'`).
     * If set to `'100%'`, the chart occupies the full width of its parent container.
     *
     * @default null
     */
    width?: string;

    /**
     * Sets the height of the chart. Accepts values in pixels (e.g., `'100px'`) or percentages (e.g., `'100%'`).
     * If set to `'100%'`, the chart occupies the full height of its parent container.
     *
     * @default null
     */
    height?: string;

    /**
     * Provides accessibility options for the pie chart container element.
     *
     * @default { ariaLabel: null, focusable: true, role: null, tabIndex: 0 }
     */
    accessibility?: PieChartAccessibilityProps;

    /**
     * Customizes the chart border using `color`, `width`, and `dashArray` properties.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    border?: PieChartBorderProps;

    /**
     * Defines the margins around the chart, including left, right, top, and bottom.
     * These margins create space between the chart's outer edge and its container.
     *
     * @default { left: 10, right: 10, top: 10, bottom: 10 }
     */
    margin?: PieChartMarginProps;

    /**
     * Sets a background image for the chart. Accepts a string value representing a URL or image path.
     *
     * @default ''
     */
    backgroundImage?: string;

    /**
     * Sets the background color of the chart. Accepts valid CSS color strings such as hex or rgba values.
     *
     * @default transparent
     */
    background?: string;

    /**
     * Visual theme applied to the pie chart.
     *
     * Available options:
     * - `Material`: Applies the Material light theme.
     * - `MaterialDark`: Applies the Material dark theme.
     *
     * @default Material
     */
    theme?: Theme;

    /**
     * Represents child elements that can be nested inside the chart component.
     *
     * @private
     */
    children?: React.ReactNode;

    /**
     * Specifies the center position of the pie chart using `x` and `y` coordinates.
     *
     * @default { x: '50%', y: '50%' }
     */
    center?: PieChartCenterProps;

    /**
     * Specifies the visual outline style applied when the chart container receives focus.
     *
     * @default { width: 1.5, color: null, offset: 0 }
     */
    focusOutline?: FocusOutlineProps;

    /**
     * When set to true, labels for the points will be placed smartly to avoid overlapping.
     *
     * @default true
     */
    smartLabels?: boolean;

    /**
     * Optional function that allows customization of each point in the series.
     *
     * @default null
     */
    pointRender?: (event: PieChartPointRenderProps) => string;

    /**
     * Triggered after a legend item is clicked.
     * Provides details about the clicked legend item, including its associated series and data points
     *
     * @event onLegendClick
     */
    onLegendClick?: (event: PieLegendClickEvent) => void;

    /**
     * Triggered when the mouse moves over the chart.
     * Provides information about the mouse event, including the target element and pointer coordinates relative to the chart.
     *
     * @event onMouseMove
     */
    onMouseMove?: (event: PieChartMouseEvent) => void;

    /**
     * Optional function to customize the point of the series.
     *
     * @event onMouseEnter
     */
    onMouseEnter?: (event: PieChartMouseEvent) => void;

    /**
     * Triggered when the mouse leaves the chart.
     * Provides information about the mouse event, including the target element and pointer coordinates relative to the chart.
     *
     * @event onClick
     */
    onMouseLeave?: (event: PieChartMouseEvent) => void;

    /**
     * Triggered when the chart is clicked.
     * Provides information about the mouse event, including the target element and pointer coordinates.
     *
     * @event onClick
     */
    onClick?: (event: PieChartMouseEvent) => void;

    /**
     * Triggered when a data point in the chart is clicked.
     * Provides details about the clicked point, including its position, series index, and mouse coordinates.
     *
     * @event onPointClick
     */
    onPointClick?: (event: PiePointClickEvent) => void;

    /**
     * Triggered after the chart is resized.
     * Provides details about the chart's size before and after the resize.
     *
     * @event onResize
     */
    onResize?: (event: PieResizeEvent) => void;

}

/**
 * Provides event arguments for the chart resize event after it has occurred.
 */
export interface PieResizeEvent {

    /**
     * Size of the chart before resizing.
     */
    previousSize: PieChartSizeProps;

    /**
     * Size of the chart after resizing.
     */
    currentSize: PieChartSizeProps;

}

/**
 * Represents the event arguments triggered when a data point is clicked in the chart.
 */
export interface PiePointClickEvent {

    /**
     * The index of the clicked point within its data series.
     */
    pointIndex: number;

    /**
     * The index of the series that contains the clicked point.
     */
    seriesIndex: number;

    /**
     * The x-coordinate of the mouse pointer relative to the chart area at the time of the click.
     */
    x: number;

    /**
     * The y-coordinate of the mouse pointer relative to the chart area at the time of the click.
     */
    y: number;
}

/**
 * Provides information about mouse events triggered within the chart.
 *
 * @public
 */
export interface PieChartMouseEvent {

    /**
     * The ID of the element that is the target of the mouse event.
     *
     */
    target: string;

    /**
     * The X-coordinate of the mouse pointer relative to the chart.
     *
     */
    x: number;

    /**
     * The Y-coordinate of the mouse pointer relative to the chart.
     *
     */
    y: number;
}

/**
 * Configuration options for enhancing the accessibility of chart elements.
 *
 * @public
 */
export interface PieChartAccessibilityProps {

    /**
     * Provides a descriptive label for the chart to assist screen readers.
     * This value is automatically mapped to the `aria-label` attribute in the DOM.
     *
     * @default null
     */
    ariaLabel?: string;

    /**
     * Specifies the ARIA role of the chart element. Helps assistive technologies understand the semantic purpose of the chart (e.g., "img", "figure", "application").
     * If not set, the default role will be inferred based on the element type.
     *
     * @default null
     */
    role?: string;

    /**
     * Determines whether chart elements can receive keyboard focus.
     * Set to `false` to exclude chart elements from the tab order, which may be useful for purely decorative charts.
     *
     * @default true
     */
    focusable?: boolean;

    /**
     * Controls the tab order for keyboard navigation.
     * A value of `0` places the chart element in the natural tab sequence.
     *
     * @default 0
     */
    tabIndex?: number;
}

/**
 * Defines the center position of the Pie series within the chart.
 *
 * @public
 */
export interface PieChartCenterProps {

    /**
     * Specifies the horizontal position (x-coordinate) of the pie chart center.
     * Accepts values in percentage (e.g., `'50%'`) or pixels (e.g., `'100px'`).
     *
     * @default '50%'
     */
    x?: string;

    /**
     * Specifies the vertical position (y-coordinate) of the pie chart center.
     * Accepts values in percentage (e.g., `'50%'`) or pixels (e.g., `'100px'`).
     *
     * @default '50%'
     */
    y?: string;
}

/**
 * Defines the configuration options for customizing the appearance of a border.
 *
 * @public
 */
export interface PieChartBorderProps {

    /**
     * Specifies the color of the border. Accepts any valid CSS color string, including hexadecimal and RGBA formats.
     *
     * @default ''
     */
    color?: string;

    /**
     * Sets the width of the border in pixels.
     *
     * @default 1
     */
    width?: number;

    /**
     * Defines the dash pattern for the border stroke.
     * Accepts a string of numbers that specify the lengths of dashes and gaps.
     *
     * @default ''
     */
    dashArray?: string;
}

/**
 * Defines the configuration options for a series in a Pie chart.
 *
 * @public
 */
export interface PieChartSeriesProps {

    /**
     * Specifies the data source for the series. It can be an array of JSON objects, or an instance of DataManager.
     *
     * @default ''
     */
    dataSource?: Object | DataManager;

    /**
     * Specifies a query to select data from the data source. This property is applicable only when the data source is an `ej.DataManager`.
     *
     * @default ''
     */
    query?: Query | string;

    /**
     * The field name in the data source that contains the x-value.
     *
     * @default ''
     */
    xField?: string;

    /**
     * Specifies the name of the series.
     *
     * @default ''
     */
    name?: string;

    /**
     * The field name in the data source that provides values for tooltips.
     *
     * @default ''
     */
    tooltipField?: string;

    /**
     * The field name in the data source that contains the y-value.
     *
     * @default ''
     */
    yField?: string;

    /**
     * Toggles the visibility of the series. Set `true` to show and `false` to hide.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Defines customization options for the border of the series points.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    border?: PieChartBorderProps;

    /**
     * The field name in the data source that maps color values to individual points.
     *
     * @default ''
     */
    colorField?: string;

    /**
     * Groups points with y-values less than the specified value into a single slice named 'Others'.
     *
     * @default null
     */
    groupTo?: string | null;

    /**
     * Defines the grouping mode for points with smaller values.
     * Available Options are:
     * - `Value`: Groups points based on their y-value.
     * - `Point`: Groups points based on their index.
     *
     * @default Value
     */
    groupMode?: GroupModes;

    /**
     * Specifies an array of colors used to render the points in the series.
     *
     * @default []
     */
    palettes?: string[];

    /**
     * Specifies the starting angle of the series in degrees.
     *
     * @default 0
     */
    startAngle?: number;

    /**
     * Specifies the ending angle of the series in degree.
     *
     * @default null
     */
    endAngle?: number;

    /**
     * Defines the radius of the pie series as a percentage of the chart size.
     *
     * @default null
     */
    radius?: string;

    /**
     * Defines the inner radius of the pie series as a percentage, creating a donut chart when greater than 0%.
     *
     * @default 0%
     */
    innerRadius?: string;

    /**
     * When set to true, enables exploding points on click or touch interaction.
     *
     * @default false
     */
    explode?: boolean;

    /**
     * Specifies the distance of exploded points from the center, in pixels or percentage.
     *
     * @default 15%
     */
    explodeOffset?: string;

    /**
     * When set to true, explodes all points in the series on initial load.
     *
     * @default false
     */
    explodeAll?: boolean;

    /**
     * Specifies the index of the point to be exploded on initial load.
     *
     * @default null
     */
    explodeIndex?: number;

    /**
     * Sets the opacity of the series, with a value between 0 and 1 where 0 is fully transparent and 1 is fully opaque.
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Provides accessibility options for the pie chart series elements.
     *
     * @default { ariaLabel: null, focusable: true, role: null, tabIndex: 0 }
     */
    accessibility?: PieChartAccessibilityProps;

    /**
     * Specifies the rounded corner radius for the series.
     * When set, the series will render with rounded corners based on the provided radius value.
     *
     * @default 0
     */
    borderRadius?: number;

    /**
     * Customization options for the appearance of empty points in the series, where `null` or `undefined` values are considered as empty points.
     *
     * @default { border: {color: 'gray', width: 1 }, mode: 'Drop', fill: 'gray' }
     */
    emptyPointSettings?: PieEmptyPointSettings;

    /**
     * Specifies animation settings for the series, including options to enable or disable animation, and configure its duration and delay for smoother visual transitions.
     *
     * @default { enable: true, duration: 1000, delay: 0 }
     */
    animation?: Animation;

    /**
     * Shows the border for pie chart segments when the mouse hovers over a data point.
     *
     * @default true
     */
    showBorderOnHover?: boolean;

    /**
     * The data label property can be used to show the data label and customize its position and styling.
     *
     * @private
     */
    dataLabel?: PieChartDataLabelProps;

    /**
     * Represents child elements that can be nested inside the series component.
     *
     * @private
     */
    children?: React.ReactNode;
}

/**
 * Defines the configuration settings for data labels in a Pie Chart series.
 */
export interface PieChartDataLabelProps {

    /**
     * When set to true, data labels for the series are rendered.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Controls whether data labels for zero values are displayed.
     * When set to false, labels for zero values will not be rendered.
     *
     * @default true
     */
    showZero?: boolean;

    /**
     * Specifies the data source field that contains the data label value.
     *
     * @default ''
     */
    name?: string;

    /**
     * The background color of the data label. Accepts hex and rgba values as valid CSS color strings.
     *
     * @default transparent
     */
    fill?: string;

    /**
     * Specifies the position of the data label relative to the data point.
     *
     * The available options are:
     * * Outside - Places the data label outside the data point, typically used to avoid overlap.
     * * Inside - Places the data label inside the data point, useful for displaying labels within the point.
     *
     * @default Inside
     */
    position?: PieLabelPosition;

    /**
     * Specifies the rotation angle of the data label in degrees.
     *
     * @default 0
     */
    rotationAngle?: number;

    /**
     * When set to true, the data label will be rotated according to the specified angle
     *
     * @default false
     */
    enableRotation?: boolean;

    /**
     * Configures the appearance of the border lines with options for width and color properties.
     *
     * @default { width: 0, color: '', dashArray: '' }
     */
    border?: PieChartBorderProps;

    /**
     * Specifies the X-axis rounded corner radius for the data label.
     * Note that `border` values must not be null for this feature to work.
     *
     * @default 5
     */
    rx?: number;

    /**
     * Specifies the Y-axis rounded corner radius for the data label.
     * Note that `border` values must not be null for this feature to work.
     *
     * @default 5
     */
    ry?: number;

    /**
     * Customizes the appearance of the data label text with options for font size, color, style, weight, and family.
     *
     * @default { fontStyle: 'Normal', fontSize: '12px', fontWeight: 'Normal', color: '', fontFamily: '', opacity: 1 }
     */
    font?: PieChartFontProps;

    /**
     * Options to customize the connector line in the series.
     * By default, the connector length for the Pie series is set to '4%'. For other series, it is set to `null`.
     *
     * @default { width:1, type: 'Curve', color:'', dashArray:'', length:'' }
     */
    connectorStyle?: ConnectorProps;

    /**
     * Used to format the data label, accepting global string formats like `C`, `n1`, `P`, etc.
     * It also supports placeholders, such as `{value}°C`, where `{value}` represents the point data label (e.g., 20°C).
     *
     * @default ''
     */
    format?: string;

    /**
     * Limits the label width and applies wrapping or trimming when the content exceeds the specified width.
     *
     * @default null
     */
    maxLabelWidth?: number | null;

    /**
     * Optional function to customize the content of the data label.
     *
     * If provided, this callback will be invoked for each data label during rendering.
     * It receives the following arguments:
     * - `index`: The index of the data point in the series.
     * - `text`: The current formatted text of the data label.
     *
     * @param index The index of the data point in the series.
     * @param text The current formatted text of the data label.
     * @returns A string value to customize the label rendering.
     *
     * @default null
     */
    formatter?: (props: PieChartDataLabelFormatterProps) => string;
}

/**
 * A function type used to customize the content of data labels.
 *
 * @param {number} index - The index of the data point associated with the label.
 * @param {text} text - The current formatted text of the data label.
 * @returns {string} A string representing the customized label content.
 * @private
 */
export type PieDataLabelContentFunction = (data: PieChartDataLabelFormatterProps) => string;

/**
 * Represents configuration options for connector lines in the chart.
 */
export interface ConnectorProps {

    /**
     * Specifies the type of connector line used in the chart.
     * The available options are:
     * - `Curve`: Renders a smooth curved connector line.
     * - `Line`: Renders a straight connector line.
     *
     * @default Curve
     */
    type?: ConnectorType;

    /**
     * Specifies the color of the connector line.
     * Accepts any valid CSS color string (e.g., hex, rgba).
     *
     * @default ''
     */
    color?: string;

    /**
     * Specifies the width of the connector line in pixels.
     *
     * @default 1
     */
    width?: number;

    /**
     * Specifies the length of the connector line in pixels.
     *
     * @default 4%
     */
    length?: string;

    /**
     * Specifies the dash pattern of the connector line.
     *
     * @default ''
     */
    dashArray?: string;
}

/**
 * Defines configuration options for the chart's title, including styling, positioning, and accessibility features.
 *
 * @public
 */
export interface PieChartTitleProps {

    /**
     * Specifies the main title text of the chart. This text provides context or a label for the chart's data.
     *
     * @default ''
     */
    text?: string;

    /**
     * Defines the font and color styling for the title. This includes properties
     * like font family, size, weight, and color, allowing the text to match the chart's
     * overall aesthetic or to be emphasized.
     *
     * @default { color: '', fontFamily: '', fontSize: '', fontStyle: '', fontWeight: '', opacity: 1 }
     */
    font?: PieChartFontProps;

    /**
     * Determines the alignment of the title within its container.
     *
     * Available options:
     * - `Left`: Aligns the text to the left.
     * - `Center`: Aligns the text to the center.
     * - `Right`: Aligns the text to the right.
     *
     * @default Center
     */
    align?: HorizontalAlignment;

    /**
     * Controls how the title behaves when it overflows its container.
     *
     * Available options:
     * - `Wrap`: Wraps the text to the next line.
     * - `Trim`: Trims the overflowed text.
     * - `None`: Displays the text even if it overlaps other elements.
     *
     * @default Wrap
     */
    textOverflow?: TextOverflow;

    /**
     * Determines the position of the chart title relative to the chart area.
     *
     * Available options:
     * - `Top`: Displays the title above the chart.
     * - `Left`: Displays the title to the left of the chart.
     * - `Bottom`: Displays the title below the chart.
     * - `Right`: Displays the title to the right of the chart.
     * - `Custom`: Allows manual positioning using `x` and `y` coordinates.
     *
     * @default Top
     */
    position?: TitlePosition;

    /**
     * X-coordinate for positioning the chart title. Only applicable when `position` is set to `Custom`.
     *
     * @default 0
     */
    x?: number;

    /**
     * Y-coordinate for positioning the chart title.Only applicable when `position` is set to `Custom`.
     *
     * @default 0
     */
    y?: number;

    /**
     * The background color of the chart title area.
     * Accepts any valid CSS color value.
     *
     * @default transparent
     */
    background?: string;

    /**
     * Defines the border styling for the chart title area.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    border?: PieChartTitleBorderProps;

    /**
     * Provides customization options to enhance accessibility for the chart title.
     *
     * @default { ariaLabel: null, focusable: true, role: null, tabIndex: 0 }
     */
    accessibility?: PieChartAccessibilityProps;
}

/**
 * Represents the border configuration for the chart title.
 *
 * @public
 */
export interface PieChartTitleBorderProps {

    /**
     * Defines the color of the border. Accepts any valid CSS color string, including hexadecimal and RGBA formats.
     *
     * @default transparent
     */
    color?: string;

    /**
     * Specifies the thickness of the border around the chart title and subtitle.
     *
     * @default 0
     */
    width?: number;

    /**
     * Sets the corner radius of the border, enabling rounded corners.
     *
     * @default 0.8
     */
    cornerRadius?: number;

    /**
     * Specifies the dash pattern used for the border stroke.
     * Accepts a string of numbers that define the lengths of dashes and gaps.
     *
     * @default ''
     */
    dashArray?: string;
}

/**
 * Defines the margin settings around the chart area.
 *
 * @public
 */
export interface PieChartMarginProps {

    /**
     * Specifies the left margin of the chart, in pixels.
     *
     * @default 10
     */
    left?: number;

    /**
     * Specifies the right margin of the chart, in pixels.
     *
     * @default 10
     */
    right?: number;

    /**
     * Specifies the top margin of the chart, in pixels.
     *
     * @default 10
     */
    top?: number;

    /**
     * Specifies the bottom margin of the chart, in pixels.
     *
     * @default 10
     */
    bottom?: number;
}

/**
 * Represents a two-dimensional size with width and height.
 *
 * @public
 */
export interface PieChartSizeProps {

    /**
     * Defines the height of the element in pixels.
     */
    width: number;

    /**
     * Defines the width of the element in pixels.
     */
    height: number;
}

/**
 * Defines the font styling options for text elements.
 *
 * @public
 */
export interface PieChartFontProps {

    /**
     * Specifies the font style of the text (e.g., 'Normal', 'Italic').
     *
     * @default Normal
     */
    fontStyle?: string;

    /**
     * Sets the font size of the text in pixels.
     *
     * @default ''
     */
    fontSize?: string;

    /**
     * Specifies the font weight (thickness) of the text (e.g., 'Normal', 'Bold', '400').
     *
     * @default Normal
     */
    fontWeight?: string;

    /**
     * Sets the color of the text. Accepts any valid CSS color string, including hexadecimal and RGBA formats.
     *
     * @default ''
     */
    color?: string;

    /**
     * Specifies the font family used for the text (e.g., 'Arial', 'Verdana', 'sans-serif').
     *
     * @default ''
     */
    fontFamily?: string;

    /**
     * Sets the opacity level of the text. A value of 1 means fully opaque, while 0 means fully transparent.
     *
     * @default 1
     */
    opacity?: number;
}

/**
 * Defines the configuration options for the pie chart legend.
 */
export interface PieChartLegendProps {

    /**
     * When set to `false`, the legend is hidden from view, allowing more space for the chart area.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Specifies the height of the legend area in pixels.
     *
     * @default ''
     */
    height?: string;

    /**
     * Specifies the width of the legend area in pixels.
     *
     * @default ''
     */
    width?: string;

    /**
     * Specifies the exact coordinates for positioning the legend when using custom positioning.
     * Contains x and y properties to determine the precise location within the chart container.
     *
     * The `position` must be set to `Custom` for this to take effect.
     *
     * @default { x: 0, y: 0 }
     */
    location?: PieChartLocationProps;

    /**
     * Determines where the legend appears in relation to the chart area.
     * Controls both the orientation of legend items and their overall placement.
     *
     * Available options:
     * * `Auto` - Intelligently positions the legend based on available space.
     * * `Top` - Positions the legend above the chart with horizontal item layout.
     * * `Left` - Positions the legend to the left with vertical item layout.
     * * `Bottom` - Positions the legend below the chart with horizontal item layout.
     * * `Right` - Positions the legend to the right with vertical item layout.
     * * `Custom` - Positions according to the coordinates specified in the `location` property.
     *
     * @default Auto
     */
    position?: LegendPosition;

    /**
     * Sets the internal padding between the legend border and its content elements.
     *
     * @default 8
     */
    padding?: number;

    /**
     * Controls the horizontal and vertical spacing between adjacent legend items.
     *
     * @default null
     */
    itemPadding?: number | null;

    /**
     * Specifies the alignment of the legend within its container region in the chart.
     * The behavior of this property depends on the legend's position:
     *
     * - For horizontal legend positions (`Top`, `Bottom`, `Auto`):
     *   - `Left`: Aligns the legend to the start (left) of the chart container.
     *   - `Center`: Aligns the legend to the center of the chart container.
     *   - `Right`: Aligns the legend to the end (right) of the chart container.
     *
     * - For vertical legend positions (`Left`, `Right`):
     *   - `Top`: Aligns the legend to the top of the chart container.
     *   - `Center`: Aligns the legend to the vertical center of the chart container.
     *   - `Bottom`: Aligns the legend to the bottom of the chart container.
     *
     * If an invalid alignment is provided for the current layout direction,
     * the legend defaults to `Center` alignment.
     *
     * @default Center
     */
    align?: LegendAlignment;

    /**
     * Customizes the appearance of text in legend items.
     *
     * @default { fontStyle: 'Normal', fontSize: '12px', fontWeight: 'Normal', color: '', fontFamily: '' }
     */
    textStyle?: PieChartFontProps;

    /**
     * Controls the height of the visual indicator symbol for each legend item.
     *
     * @default 10
     */
    shapeHeight?: number;

    /**
     * Controls the width of the visual indicator symbol for each legend item.
     *
     * @default 10
     */
    shapeWidth?: number;

    /**
     * Customizes the border around the entire legend area.
     * Controls color, width, and dash pattern of the legend's outer frame.
     *
     * @default { width: 1, color: '', dashArray: '' }
     */
    border?: PieChartBorderProps;

    /**
     * Sets the external spacing around the legend, controlling its distance from other chart elements.
     *
     * @default { left: 0, right: 0, top: 0, bottom: 0 }
     */
    margin?: PieChartMarginProps;

    /**
     * Sets the internal spacing between the legend border and its content.
     * Creates visual breathing room within the legend container for better readability.
     *
     * @default { left: 0, right: 0, top: 0, bottom: 0 }
     */
    containerPadding?: PieChartPaddingProps;

    /**
     * Controls the space between each legend item's shape and its text.
     *
     * @default 8
     */
    shapePadding?: number;

    /**
     * Sets the background color for the legend area.
     * Can use any valid CSS color format including hex, rgb, or named colors.
     *
     * @default transparent
     */
    background?: string;

    /**
     * Controls the transparency of the entire legend.
     * Values range from 0 (completely transparent) to 1 (fully opaque).
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Controls whether clicking a legend item toggles the visibility of its corresponding series.
     * When disabled, legend items become informational only without interactive behavior.
     *
     * @default true
     */
    toggleVisibility?: boolean;

    /**
     * Specifies a title to be displayed for the legend.
     * The title provides a descriptive heading for the legend items.
     *
     * @default ''
     */
    title?: string;

    /**
     * Customizes the appearance of the legend title text.
     *
     * @default { fontStyle: 'Normal', fontSize: '12px', fontWeight: 'Normal', color: '', fontFamily: '' }
     */
    titleStyle?: PieChartFontProps;

    /**
     * Determines the alignment of the title within its container.
     *
     * Available options:
     * - `Left`: Aligns the title to the left.
     * - `Center`: Aligns the title to the center.
     * - `Right`: Aligns the title to the right.
     *
     * @default Center
     */
    titleAlign?: HorizontalAlignment;

    /**
     * Controls how the title behaves when it overflows its container.
     *
     * Available options:
     * - `Wrap`: Wraps the title to the next line.
     * - `Trim`: Trims the overflowed title.
     * - `None`: Displays the title even if it overlaps other elements.
     *
     * @default Wrap
     */
    titleOverflow?: TextOverflow;

    /**
     * Limits the maximum width of the legend title in pixels.
     * Text exceeding this width will wrap according to the textWrap property.
     *
     * @default 100
     */
    maxTitleWidth?: number;

    /**
     * Limits the maximum width of individual legend item labels in pixels.
     * Prevents long text from extending beyond the desired width.
     *
     * @default null
     */
    maxLabelWidth?: number | null;

    /**
     * When set to `true`, navigation controls (such as arrows or pagination indicators) are shown in the legend,
     * allowing users to view additional legend items that do not fit within the visible area.
     *
     * @default true
     */
    enablePages?: boolean;

    /**
     * When enabled, reverses the order of elements within each legend item.
     * Places text before the shape/symbol instead of the default shape-then-text order.
     *
     * @default false
     */
    inversed?: boolean;

    /**
     * When set to `true`, the legend items are shown in reverse sequence— the last item in the data appears first, and the first item appears last.
     *
     * @default false
     */
    reverse?: boolean;

    /**
     * When enabled, forces all legend items to have the same width.
     * Creates a more uniform, grid-like appearance for the legend.
     *
     * @default false
     */
    fixedWidth?: boolean;

    /**
     * Provides options to enhance accessibility for screen readers and keyboard navigation.
     *
     * @default { ariaLabel: null, focusable: true, role: null, tabIndex: 0 }
     */
    accessibility?: PieChartAccessibilityProps;

    /**
     * Specifies the image URL for the legend icon.
     * Requires `Shape` to be set as `Image`.
     *
     * @default ''
     */
    imageUrl?: string;

    /**
     * Specifies the shape of the legend icon for each data point.
     *
     * Available options:
     * - 'Circle'
     * - 'Rectangle'
     * - 'Triangle'
     * - 'Diamond'
     * - 'Cross'
     * - 'HorizontalLine'
     * - 'VerticalLine'
     * - 'Pentagon'
     * - 'InvertedTriangle'
     * - 'SeriesType'
     * - 'Plus'
     * - 'Star'
     * - 'Image'
     *
     * @default SeriesType
     */
    shape?: PieLegendShape;
}

/**
 * Provides event arguments triggered when a legend item is clicked in the chart.
 */
export interface PieLegendClickEvent {

    /**
     * The shape of the visual marker used in the clicked legend item.
     */
    shape: PieLegendShape;

    /**
     * The name of the chart series associated with the clicked legend item.
     */
    seriesName: string;

    /**
     * The label text displayed in the clicked legend item.
     */
    text: string;

    /**
     * Indicates whether the event should be canceled.
     * Set to `true` to prevent the default action.
     */
    cancel: boolean;
}

/**
 * Defines optional padding values around the chart content.
 *
 * Padding creates spacing between the chart's rendering area and its container
 * or surrounding elements, helping to control layout and visual balance.
 */
export interface PieChartPaddingProps {
    /**
     * Padding on the left side of the chart, in pixels.
     *
     * @default 0
     */
    left?: number;

    /**
     * Padding on the right side of the chart, in pixels.
     *
     * @default 0
     */
    right?: number;

    /**
     * Padding on the top side of the chart, in pixels.
     *
     * @default 0
     */
    top?: number;

    /**
     * Padding on the bottom side of the chart, in pixels.
     *
     * @default 0
     */
    bottom?: number;
}

/**
 * Represents a point location in a 2D chart coordinate space.
 *
 * @public
 */
export interface PieChartLocationProps {

    /**
     * The horizontal position (x-coordinate) of the location in chart space.
     *
     * @default 0
     */
    x: number;

    /**
     * The vertical position (y-coordinate) of the location in chart space.
     *
     * @default 0
     */
    y: number;
}

/**
 * Configuration options for handling empty data points in a chart series.
 *
 * @public
 */
export interface PieEmptyPointSettings {

    /**
     * Sets the fill color for empty points in the series.
     *
     * @default null
     */
    fill?: string;

    /**
     * Customizes the border of empty points, including color and width.
     *
     * @default { color: 'transparent', width: 0, dashArray: '' }
     */
    border?: PieChartBorderProps;

    /**
     * Specifies how empty or missing data points should be rendered in the series.
     * Available modes:
     * * `Zero` - Treats empty points as zero values.
     * * `Drop` - Ignores empty points during rendering.
     * * `Average` - Replaces empty points with the average of the previous and next points.
     *
     * @default Drop
     */
    mode?: PieEmptyPointMode;
}

/**
 * Represents the configuration options for the center label text in a Pie chart.
 *
 * @public
 */
export interface PieChartLabelProps {

    /**
     * Specifies the text to be displayed in the center label.
     *
     * @default ''
     */
    text?: string;

    /**
     * Defines the font styling options for the center label text.
     *
     * @default { color: '', fontFamily: '', fontStyle: 'Normal', fontWeight: 'Normal', opacity: 1 }
     */
    textStyle?: PieChartCenterLabelTextProps;
}

/**
 * Represents the configuration options for the center label displayed in Pie charts.
 *
 * @public
 */
export interface PieChartCenterLabelProps {

    /**
     * Specifies the collection of label configurations to be displayed at the center of the pie chart.
     *
     * @default []
     */
    label?: PieChartLabelProps[];

    /**
     * Specifies the format of the center label text when hovering over a pie segment.
     * Use placeholders (e.g., {`{point.x}`}, {`{point.y}`}) to display dynamic values.
     *
     * @default ''
     */
    hoverTextFormat?: string;
}

/**
 * Defines the configuration options for the center label text in a pie chart.
 *
 * @public
 */
export interface PieChartCenterLabelTextProps extends PieChartFontProps {

    /**
     * Specifies the horizontal alignment of the center label text.
     * Available options:
     * - 'Near': Aligns the text to the left.
     * - 'Center': Aligns the text to the center.
     * - 'Far': Aligns the text to the right.
     *
     * @default Center
     */
    textAlignment?: HorizontalAlignment;
}

/**
 * Provides customization options for rendering individual points in a chart series.
 *
 * @public
 */
export interface PieChartPointRenderProps {

    /**
     * Specifies the color applied to the point.
     *
     */
    color: string;

    /**
     * Indicates the index of the current point.
     *
     */
    pointIndex: number;

    /**
     * Indicates the xField value of the point.
     *
     */
    xValue: number | Date | string | null;

    /**
     * Indicates the yField value of the point.
     *
     */
    yValue: number | Date | string | null;
}

/**
 * Represents the context data available for rendering a custom tooltip template in a chart.
 *
 * @public
 */
export interface PieChartTooltipTemplateProps {

    /**
     * The X-coordinate of the data point in the chart.
     *
     */
    x: number;

    /**
     * The Y-coordinate of the data point in the chart.
     *
     */
    y: number;

    /**
     * The value to be displayed in the tooltip, mapped from the `tooltipField` in the series configuration.
     *
     */
    tooltip: string;

    /**
     * The index of the series to which the data point belongs.
     *
     */
    seriesIndex: number;

    /**
     * The index of the data point within the series.
     *
     */
    pointIndex: number;
}

/**
 * Represents the configuration options for tooltips in a pie chart.
 *
 * @public
 */
export interface PieChartTooltipProps {

    /**
     * When set to `true`, tooltips are displayed when hovering over data points.
     *
     * @default false
     */
    enable?: boolean;

    /**
     * When set to `true`, displays colored markers within the tooltip to indicate the corresponding series for each data point.
     *
     * @default true
     */
    showMarker?: boolean;

    /**
     * Sets the background color of the tooltip.
     * Accepts any valid CSS color value (hex, RGB, named colors).
     *
     * @default ''
     */
    fill?: string;

    /**
     * Customizes the header text displayed at the top of the tooltip.
     * By default, displays the series name.
     *
     * @default ''
     */
    headerText?: string;

    /**
     * Controls the transparency level of the tooltip.
     * Values range from 0 (fully transparent) to 1 (fully opaque).
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Defines a custom format string for tooltip content displayed when hovering over data points.
     *
     * The format can include placeholder tokens that will be replaced with actual values:
     * - `${point.x}` - Represents the x-value of the data point.
     * - `${point.y}` - Represents the y-value of the data point.
     * - `${series.name}` - Represents the name of the data series the point belongs to.
     *
     * @default ''
     */
    format?: string;

    /**
     * When set to `true`, enables smooth animation when the tooltip transitions between data points.
     *
     * @default true
     */
    enableAnimation?: boolean;

    /**
     * Sets the duration of tooltip animations in milliseconds.
     *
     * @default 300
     */
    duration?: number;

    /**
     * Controls how long the fade-out animation lasts when hiding the tooltip.
     *
     * @default 150
     */
    fadeOutDuration?: number;

    /**
     * Specifies a fixed position for the tooltip relative to the chart.
     * For example, `x: 20` positions the tooltip 20 pixels to the right.
     *
     * @default { x: 0, y: 0 }
     */
    location?: PieChartLocationProps;

    /**
     * When set to `true`, displays a horizontal line separating the tooltip header from its content.
     *
     * @default false
     */
    showHeaderLine?: boolean;

    /**
     * Defines the font styling for the tooltip text, including font family, size, weight, and color.
     *
     * @default { color: '', fontFamily: '', fontStyle: 'Normal', fontWeight: 'Normal', opacity: 1 }
     */
    textStyle?: PieChartFontProps;

    /**
     * Defines customization options for the tooltip border, including color, width, and dash pattern.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    border?: PieChartBorderProps;

    /**
     * Specifies the fade-out animation mode when hiding the tooltip.
     *
     * Available options:
     * - `Click`: The tooltip is removed when the user clicks on the chart.
     * - `Move`: The tooltip fades out after a short delay when the pointer moves away.
     *
     * @default Move
     */
    fadeOutMode?: FadeOutMode;

    /**
     * A callback function that allows for custom rendering of chart tooltips.
     * This function is invoked for each tooltip and receives its properties as an argument.
     * Available arguments:
     * - `text`: The content of the tooltip, which can be a string or an array of strings.
     *
     * @param text The content of the tooltip to be formatted.
     * @returns A string, an array of strings, or a boolean to customize the tooltip rendering.
     *
     * @default null
     */
    formatter?: (props: PieChartTooltipFormatterProps) => string | string[] | boolean;

    /**
     * Custom template function for rendering the tooltip content.
     *
     * This function receives the data point properties and returns a JSX element
     * to access the data point values.
     *
     * @default null
     */
    template?: ((props: PieChartTooltipTemplateProps) => React.ReactNode);
}

/**
 * Defines the input parameters for the tooltip formatter callback in the Pie Chart.
 */
export interface PieChartTooltipFormatterProps {
    /**
     * The tooltip content to be formatted.
     * Can be a single string or an array of strings for multiline tooltips.
     */
    text: string | string[];
}

/**
 * Defines the input parameters for the data label formatter callback in the Pie Chart.
 */
export interface PieChartDataLabelFormatterProps {
    /**
     * The zero-based index of the data point being formatted.
     */
    index: number;
    /**
     * The current text/value of the data label for the data point.
     */
    text: string;
}
