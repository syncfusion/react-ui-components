import { AxisLabelPosition, ChartRangePadding, ChartSeriesType, EmptyPointMode, StepPosition, AxisValueType, LabelPosition, LegendShape, ChartMarkerShape, ZoomMode, ToolbarItems, SplineType, IntervalType, SkeletonType, StripLineSizeUnit, ZIndex, DataLabelIntersectMode, CrosshairLineType, SelectionMode, SelectionPattern, ErrorBarType, TrendlineTypes, ColumnFacet, BoxPlotMode, ScrollbarPosition, IndicatorsType, FinancialDataField, MacdType, LegendMode } from './enum';
import { DataManager, Query } from '@syncfusion/react-data';
import { AxisDataProps, Chart, ChartSizeProps, ChartTrendlineModel, VisibleRangeProps } from '../chart-area/chart-interfaces';
import { Animation } from '../../common';
import { HorizontalAlignment, VerticalAlignment } from '@syncfusion/react-base';
import { JSX } from 'react';
import { FadeOutMode, LegendPosition, TextOverflow, Theme, TitlePosition } from '../../common';
import { ConnectorProps, FocusOutlineProps } from '../../common/interfaces';
import { AnnotationCoordinateUnit } from '../../common/annotation';


/**
 * Represents the border configuration for the chart title.
 */
export interface TitleBorder {

    /**
     * Defines the color of the border. Accepts any valid CSS color string, including hexadecimal and RGBA formats.
     *
     * @default 'transparent'
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
 * Defines the configuration options for customizing the chart title and subtitle.
 *
 * @private
 */
export interface TitleSettings {

    /**
     * Specifies the font style for the chart title and subtitle text.
     *
     * @default 'Normal'
     */
    fontStyle?: string;

    /**
     * Sets the font size for the chart title and subtitle.
     *
     * @default ''
     */
    size?: string;

    /**
     * Specifies the font weight (thickness) for the chart title and subtitle text.
     *
     * @default '500'
     */
    fontWeight?: string;

    /**
     * Sets the text color for the chart title and subtitle.
     *
     * @default ''
     */
    color?: string;

    /**
     * Determines how the title and subtitle text is aligned within its container.
     *
     * @default 'Center'
     */
    textAlignment?: HorizontalAlignment;

    /**
     * Specifies the font family used for the chart title and subtitle.
     *
     * @default ''
     */
    fontFamily?: string;

    /**
     * Sets the opacity of the title and subtitle text.
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Controls how the title and subtitle text behaves when it exceeds the available space.
     *
     * Available options:
     * - `None`: Displays the full text even if it overlaps with other chart elements.
     * - `Wrap`: Breaks the text into multiple lines to fit within the container.
     * - `Trim`: Cuts off the text and may append ellipsis if it exceeds the container width.
     *
     * @default 'Wrap'
     */
    textOverflow?: TextOverflow;

    /**
     * Specifies the position of the chart title and subtitle.
     *
     * Available options:
     * - `Top`: Displays the title and subtitle at the top of the chart.
     * - `Left`: Displays them on the left side.
     * - `Bottom`: Displays them at the bottom.
     * - `Right`: Displays them on the right side.
     * - `Custom`: Positions them based on the specified `x` and `y` coordinates.
     *
     * @default 'Top'
     */
    position?: TitlePosition;

    /**
     * Defines the X-coordinate for positioning the chart title and subtitle when using `Custom` position.
     *
     * @default 0
     */
    x?: number;

    /**
     * Defines the Y-coordinate for positioning the chart title and subtitle when using `Custom` position.
     *
     * @default 0
     */
    y?: number;

    /**
     * Sets the background color for the chart title and subtitle area.
     *
     * @default 'transparent'
     */
    background?: string;

    /**
     * Configures the border settings for the chart title and subtitle.
     */
    border?: TitleBorder;

    /**
     * Provides accessibility options for the chart title and subtitle elements.
     *
     * @default { ariaLabel: '', focusable: true, role: 'img', tabIndex: 0 }
     */
    accessibility?: ChartAccessibilityProps;
}

/**
 * Defines the configuration options for customizing the appearance of a border.
 */
export interface ChartBorderProps {

    /**
     * Specifies the color of the border. Accepts any valid CSS color string, including hexadecimal and RGBA formats.
     *
     * @default ''
     */
    color?: string;

    /**
     * Sets the width of the border in pixels.
     *
     * @default 0
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
 * Defines the margin settings around the chart area.
 */
export interface ChartMarginProps {

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
 * Defines the font styling options for text elements.
 */
export interface ChartFontProps {

    /**
     * Specifies the font style of the text (e.g., 'Normal', 'Italic').
     *
     * @default ''
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
     * @default ''
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
 * Defines configuration options for the connector line in a Waterfall series.
 */
export interface ChartWaterfallConnectorProps {

    /**
     * Enables or disables the connector line.
     *
     * When set to `true`, a line is drawn between consecutive columns to show the progression
     * of values.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Specifies the color of the connector line.
     *
     * @default ''
     */
    strokeColor?: string;

    /**
     * Specifies the width of the connector line in pixels.
     *
     * @default 1
     */
    strokeWidth?: number;

    /**
     * Specifies the dash pattern of the connector line.
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Specifies the opacity of the connector line.
     * Value ranges from 0 to 1.
     *
     * @default 1
     */
    strokeOpacity?: number;
}

/**
 * Specifies visual styling options for whisker stems and end caps in chart series that render
 * whiskers, such as the Box‑and‑Whisker chart.
 *
 * This configuration controls the stroke appearance of whiskers that represent the data range
 * outside the interquartile box.
 */
export interface ChartWhiskerStyleProps {

    /**
     * Stroke color for both whiskers and stems and their end caps.
     *
     * If not specified, the series border color is used as a fallback.
     *
     * @default ''
     */
    stroke?: string;

    /**
     * Stroke width applied to both whisker stems and their end caps.
     *
     * If not specified, the series border width is used as a fallback.
     *
     * @default 1
     */
    width?: number;

    /**
     * Specifies the dash pattern applied to whisker stems and end caps.
     *
     * The value follows the SVG/CSS `stroke-dasharray` format (for example: '5,5' or '10,3,2').
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Determines the relative length of the whisker end caps.
     *
     * The value is expressed as a ratio of the available box width.
     *
     * @default 0.5
     */
    capLength?: number;
}

/**
 * Defines the configuration options for customizing the chart area.
 */
export interface ChartAreaProps {

    /**
     * Customizes the border appearance of the chart area, controlling border color, width, and dash pattern.
     *
     * @default {color: '', width: 0, dashArray: ''}
     */
    border?: ChartBorderProps;

    /**
     * Sets the background color of the chart area.
     * Accepts valid CSS color strings including hex, RGB, and named colors.
     *
     * @default 'transparent'
     */
    background?: string;

    /**
     * Controls the transparency level of the chart area's background.
     * A value of 1 is fully opaque, while 0 is fully transparent.
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Specifies a background image for the chart area.
     * Accepts a URL or a local image path.
     *
     * @default ''
     */
    backgroundImage?: string;

    /**
     * Sets the width of the chart area in pixels, helping maintain consistent chart proportions across different container sizes.
     * Accepts values in pixels (e.g., '500px').
     *
     * @default null
     */
    width?: string;

    /**
     * Defines the margin around the chart area.
     * Creates space between the chart container and the plotting area.
     *
     * @default {left: 0, right: 0, top: 0, bottom: 0}
     */
    margin?: ChartMarginProps;
}

/**
 * Defines the configuration options for a single level of multi-level axis labels.
 *
 * @public
 */
export interface ChartMultiLevelLabelProps {
    /**
     * Defines the position of the multi-level labels.
     * The available options are:
     * * Left: Places the multi-level labels close to the chart elements.
     * * Center: Positions the multi-level labels in the center of the chart elements.
     * * Right: Places the multi-level labels further from the chart elements.
     *
     * @default 'Center'
     */
    alignment?: HorizontalAlignment;

    /**
     * Defines the text overflow behavior for multi-level labels.
     * The available options are:
     * * Trim: Trims the text that overflows for multi-level labels.
     * * Wrap: Wraps the text that overflows for multi-level labels.
     * * None: No text overflow handling for multi-level labels.
     *
     * @default 'Wrap'
     */
    overflow?: TextOverflow;

    /**
     * Options to customize the text styling for multi-level labels.
     * Includes font family, size, weight, color, and opacity settings.
     */
    textStyle?: ChartFontProps;

    /**
     * The `border` property allows customization of the border for multi-level labels.
     * It includes options to set the color, width, and dash pattern of the border.
     *
     * @default {color: '', width: 0, dashArray: ''}
     */
    border?: ChartBorderProps;

    /**
     * Configures multi-level categories for multi-level labels.
     * Each category defines a range within the axis with a start and end value.
     */
    categories?: ChartMultiLevelLabelCategoryProps[];
}

/**
 * Defines the configuration options for a single category within a multi-level label level.
 *
 * @public
 */
export interface ChartMultiLevelLabelCategoryProps {
    /**
     * Specifies the text to be displayed for the multi-level label category.
     *
     * @default ''
     */
    text: string;

    /**
     * Specifies the starting axis value for the multi-level label category.
     * This value defines where the category span begins on the axis.
     *
     * @default null
     */
    start: string | number | Date;

    /**
     * Specifies the ending axis value for the multi-level label category.
     * This value defines where the category span ends on the axis.
     *
     * @default null
     */
    end: string | number | Date;

    /**
     * Specifies the maximum width for the text in pixels.
     * If the text exceeds this width, overflow handling (Trim/Wrap) is applied.
     *
     * @default null
     */
    maximumTextWidth?: number;
}

/**
 * Defines the configuration options for customizing chart selection behavior
 */
export interface ChartSelectionProps {

    /**
     * Specifies how data points or series can be selected or highlighted.
     *
     * Available options:
     * - 'None': Disables selection.
     * - 'Series': Selects the entire series.
     * - 'Point': Selects individual data points.
     * - 'Cluster': Selects a group of related data points.
     *
     * @default 'None'
     */
    mode?: SelectionMode;

    /**
     * Enables selection of multiple data points, series, or clusters.
     * Note that the `selectionMode` must be set to `Point`, `Series`, or `Cluster` for multi-selection to be enabled.
     *
     * @default false
     */
    allowMultiSelection?: boolean;

    /**
     * Defines the indexes of points to be selected when the chart is initially rendered.
     * Note that `selectionMode` or `highlightMode` must be set to `Point`, `Series`, or `Cluster` for this feature to work.
     *
     * @default []
     */
    selectedDataIndexes?: ChartIndexesProps[];

    /**
     * Specifies the visual pattern applied to selected data points or series.
     * The available options are:
     * * 'None': No selection pattern is applied.
     * * 'Chessboard': Applies a chessboard pattern as the selection effect.
     * * 'Dots': Applies a dot pattern as the selection effect.
     * * 'DiagonalForward': Applies a forward diagonal line pattern as the selection effect.
     * * 'Crosshatch': Applies a crosshatch pattern as the selection effect.
     * * 'Pacman': Applies a Pacman pattern as the selection effect.
     * * 'DiagonalBackward': Applies a backward diagonal line pattern as the selection effect.
     * * 'Grid': Applies a grid pattern as the selection effect.
     * * 'Turquoise': Applies a turquoise pattern as the selection effect.
     * * 'Star': Applies a star pattern as the selection effect.
     * * 'Triangle': Applies a triangle pattern as the selection effect.
     * * 'Circle': Applies a circle pattern as the selection effect.
     * * 'Tile': Applies a tile pattern as the selection effect.
     * * 'HorizontalDash': Applies a horizontal dash pattern as the selection effect.
     * * 'VerticalDash': Applies a vertical dash pattern as the selection effect.
     * * 'Rectangle': Applies a rectangle pattern as the selection effect.
     * * 'Box': Applies a box pattern as the selection effect.
     * * 'VerticalStripe': Applies a vertical stripe pattern as the selection effect.
     * * 'HorizontalStripe': Applies a horizontal stripe pattern as the selection effect.
     * * 'Bubble': Applies a bubble pattern as the selection effect.
     *
     * @default 'None'
     */
    pattern?: SelectionPattern;
}


/**
 * Internal interface for managing chart selection state.
 *
 * @private
 */
export interface BaseSelection extends ChartSelectionProps {

    /** Chart instance associated with the selection. */
    chart?: Chart;

    /** True if the selection was triggered from the legend. */
    isLegendSelection?: boolean;

    /** True if the selection should be added to existing selections. */
    isAdd?: boolean;

    /** Indexes of currently selected data points in the chart. */
    chartSelectedDataIndexes?: ChartIndexesProps[];

    /** Elements that were previously selected. */
    previousSelectedElements?: Element[];

    /** Optional name identifier for the selection context. */
    name?: string;

    /** Color used to highlight selected elements. */
    fill?: string;

    /** True if the element is currently selected. */
    isSelected?: boolean;

    /** True if the highlight was triggered from the legend. */
    isLegendHighlight?: boolean;

    /** True if the highlight was triggered from the tooltip. */
    isTooltipHighlight?: boolean;

    /** True if legend toggling is enabled for selection. */
    isLegendToggle?: boolean;
}

/**
 * Defines the configuration options for customizing chart highlight behavior.
 */
export interface ChartHighlightProps {

    /**
     * Specifies how data points or series can be highlighted.
     *
     * Available options:
     * - 'None': Disables highlighting.
     * - 'Series': Highlights the entire series.
     * - 'Point': Highlights individual data points.
     * - 'Cluster': Highlights a group of related data points.
     *
     * @default 'None'
     */
    mode?: SelectionMode;

    /**
     * Specifies the color used to highlight a data point when hovered.
     *
     * @default ''
     */
    fill?: string;

    /**
     * Defines the visual pattern applied to highlighted data points or series.
     *
     * The available options are:
     * * 'None': No highlight pattern is applied.
     * * 'Chessboard': Applies a chessboard pattern as the highlight effect.
     * * 'Dots': Applies a dot pattern as the highlight effect.
     * * 'DiagonalForward': Applies a forward diagonal line pattern as the highlight effect.
     * * 'Crosshatch': Applies a crosshatch pattern as the highlight effect.
     * * 'Pacman': Applies a Pacman pattern as the highlight effect.
     * * 'DiagonalBackward': Applies a backward diagonal line pattern as the highlight effect.
     * * 'Grid': Applies a grid pattern as the highlight effect.
     * * 'Turquoise': Applies a turquoise pattern as the highlight effect.
     * * 'Star': Applies a star pattern as the highlight effect.
     * * 'Triangle': Applies a triangle pattern as the highlight effect.
     * * 'Circle': Applies a circle pattern as the highlight effect.
     * * 'Tile': Applies a tile pattern as the highlight effect.
     * * 'HorizontalDash': Applies a horizontal dash pattern as the highlight effect.
     * * 'VerticalDash': Applies a vertical dash pattern as the highlight effect.
     * * 'Rectangle': Applies a rectangle pattern as the highlight effect.
     * * 'Box': Applies a box pattern as the highlight effect.
     * * 'VerticalStripe': Applies a vertical stripe pattern as the highlight effect.
     * * 'HorizontalStripe': Applies a horizontal stripe pattern as the highlight effect.
     * * 'Bubble': Applies a bubble pattern as the highlight effect.
     *
     * @default 'None'
     */
    pattern?: SelectionPattern;
}

/**
 * Represents the index information for a data point within a chart.
 * Used to identify specific series and points for selection or highlighting.
 */
export interface ChartIndexesProps {

    /**
     * Index of the series in the chart.
     * Determines which series the data point belongs to.
     *
     * @default 0
     */
    seriesIndex?: number;

    /**
     * Index of the data point within the specified series.
     * Used to target a specific point for selection or interaction.
     *
     * @default 0
     */
    pointIndex?: number;

    /**
     * Index of the trendline within the specified series.
     * Used to identify which trendline is being referenced when multiple trendlines exist.
     * Only applicable when working with trendline elements.
     *
     * @private
     * @default 0
     */
    trendlineIndex?: number;

}

/**
 * Defines the configuration options for enabling and customizing zooming and panning in the chart.
 */
export interface ChartZoomSettingsProps {

    /**
     * Enables zooming by selecting a rectangular region within the chart area.
     * Users can click and drag to define the region they want to zoom into.
     *
     * @default false
     */
    selectionZoom?: boolean;

    /**
     * Enables zooming with pinch gestures on touch-enabled devices.
     * Users can pinch in to zoom in and pinch out to zoom out.
     *
     * @default false
     */
    pinchZoom?: boolean;

    /**
     * Enables chart zooming using the mouse wheel for desktop users.
     * Scroll up to zoom in and scroll down to zoom out.
     *
     * @default false
     */
    mouseWheelZoom?: boolean;

    /**
     * Specifies the zooming direction for chart interactions.
     *
     * This property controls which axes can be zoomed when using the chart's zoom features.
     * Selecting the appropriate mode allows users to focus on specific dimensions of the data.
     *
     * Available options:
     * - `XY`: Enables both horizontal and vertical zooming, allowing users to zoom freely in any direction.
     * - `X`: Enables horizontal zooming only, restricting zoom operations to the X-axis.
     * - `Y`: Enables vertical zooming only, restricting zoom operations to the Y-axis.
     *
     * Note: The `selectionZoom` property must be set to `true` for this setting to take effect.
     *
     * @default 'XY'
     */
    mode?: ZoomMode;

    /**
     * Enables chart panning without requiring toolbar interaction.
     * When enabled, users can pan a zoomed chart directly by clicking and dragging.
     *
     * @default false
     */
    pan?: boolean;

    /**
     * Provides accessibility options for zoom-related UI elements.
     * Enhances screen reader support and keyboard navigation for zoom controls.
     *
     * @default {}
     */
    accessibility?: ChartAccessibilityProps;

    /**
     * Provides configuration settings for the zoom toolbar displayed on the chart.
     * Lets you control its visibility, toolbar items, and position within the chart area.
     *
     * @default { visible: false, items: ['ZoomIn', 'ZoomOut', 'Pan', 'Reset'] }
     */
    toolbar?: ChartToolbarProps;

    /**
     * Enables or disables the rendering of scrollbars for zoomed axes.
     *
     * When set to true, scrollbars are rendered for axes that have scrollbar settings enabled and whose
     * visible range is smaller than the total data range.
     *
     * @default false
     */
    enableScrollbar?: boolean;
}

/**
 *  Defines configuration options for enabling and customizing the scrollbar associated with an axis.
 */
export interface ChartScrollbarProps {
    /**
     * Enables or disables the scrollbar for the associated axis.
     *
     * @default true
     */
    enable?: boolean;

    /**
     * Specifies the thickness of the scrollbar track. For horizontal scrollbars this represents height;
     * for vertical scrollbars, this represents width.
     *
     * @default 14
     */
    thickness?: number;

    /**
     * Specifies the background color of the scrollbar track.
     *
     * @default '#E0E0E0'
     */
    trackColor?: string;

    /**
     * Defines the corner radius of the scrollbar thumb.
     *
     * @default 6
     */
    thumbRadius?: number;

    /**
     * Specifies the fill color of the scrollbar thumb.
     *
     * @default '#9E9E9E'
     */
    thumbColor?: string;

    /**
     * Defines the corner radius of the scrollbar track.
     *
     * @default 6
     */
    trackRadius?: number;

    /**
     * Specifies the position of the scrollbar relative to the axis.
     *
     * Available options:
     * - `Top`: Places the scrollbar at the top of the chart. Applicable only for horizontal scrollbars.
     * - `Bottom`: Places the scrollbar at the bottom of the chart. Applicable only for horizontal scrollbars.
     * - `Left`: Places the scrollbar on the left side of the chart. Applicable only for vertical scrollbars.
     * - `Right`: Places the scrollbar on the right side of the chart. Applicable only for vertical scrollbars.
     * - `PlaceNextToAxisLine`: Places the scrollbar next to the axis line.
     *
     * @default 'PlaceNextToAxisLine'
     */
    position?: ScrollbarPosition;

    /**
     * Specifies whether interactions on the scrollbar can modify the zoom factor of the axis.
     * When set to false, scrollbar interaction performs panning only without changing zoom level.
     *
     * @default false
     */
    enableZoom?: boolean;

    /**
     * Configures the resize handles shown on the scrollbar thumb.
     *
     * @default { circleColor: '#E6E6E6', borderColor: '#9E9E9E', borderWidth: 1, arrowColor: '#6E6E6E' }
     */
    resizeCircle?: ResizeCircleSettingProps;
}

/**
 * Defines configuration options for customizing the resize handles displayed on the scrollbar thumb.
 */
export interface ResizeCircleSettingProps {
    /**
     * Fill color of the resize circles.
     *
     * @default '#E6E6E6'
     */
    circleColor?: string;

    /**
     * Border color of the resize circles.
     *
     * @default '#9E9E9E'
     */
    borderColor?: string;

    /**
     * Border width of the resize circles.
     *
     * @default 1
     */
    borderWidth?: number;

    /**
     * Color of the arrow inside resize circles.
     *
     * @default '#6E6E6E'
     */
    arrowColor?: string;
}

/**
 * Represents the event arguments triggered when a zoom operation is completed on the chart.
 */
export interface ZoomEndEvent {

    /**
     * The name of the axis that was zoomed during the operation.
     */
    axisName?: string;

    /**
     * The zoom factor applied to the axis before the zoom operation.
     */
    previousZoomFactor?: number;

    /**
     * The zoom position of the axis before the zoom operation.
     */
    previousZoomPosition?: number;

    /**
     * The zoom factor applied to the axis after the zoom operation.
     */
    currentZoomFactor?: number;

    /**
     * The zoom position of the axis after the zoom operation.
     */
    currentZoomPosition?: number;

    /**
     * The visible range of the axis after the zoom operation.
     * Includes updated minimum, maximum, interval, and delta values.
     */
    currentVisibleRange?: VisibleRangeProps;

    /**
     * The visible range of the axis before the zoom operation.
     * Includes previous minimum, maximum, interval, and delta values.
     */
    previousVisibleRange?: VisibleRangeProps;

}

/**
 * Represents the event arguments triggered during a zooming operation on the chart.
 */
export interface ZoomStartEvent {

    /**
     * A collection of axis data involved in the zoom operation.
     */
    axisData: AxisDataProps[];

    /**
     * Indicates whether the event should be canceled.
     * Set to `true` to prevent the default action.
     */
    cancel: boolean;
}

/**
 * Defines the positioning options for the zoom toolbar within the chart.
 */
export interface ToolbarPosition {

    /**
     * Specifies the horizontal alignment of the toolbar.
     *
     * Available options:
     * - `Right`: Aligns the toolbar to the right side of the chart.
     * - `Center`: Centers the toolbar horizontally within the chart.
     * - `Left`: Aligns the toolbar to the left side of the chart.
     *
     * @default 'Right'
     */
    hAlign?: HorizontalAlignment;

    /**
     * Specifies the vertical alignment of the toolbar.
     *
     * Available options:
     * - `Top`: Positions the toolbar at the top of the chart.
     * - `Center`: Centers the toolbar vertically within the chart.
     * - `Bottom`: Positions the toolbar at the bottom of the chart.
     *
     * @default 'Top'
     */
    vAlign?: VerticalAlignment;

    /**
     * Sets the horizontal offset of the toolbar from its default position, in pixels.
     *
     * @default 0
     */
    x?: number;

    /**
     * Sets the vertical offset of the toolbar from its default position, in pixels.
     *
     * @default 0
     */
    y?: number;

}

/**
 * Defines the configuration options for customizing the chart zoom toolbar.
 */
export interface ChartToolbarProps {

    /**
     * When set to `true`, the zoom toolbar is displayed by default and remains permanently visible during chart interaction.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Defines the set of interactive tools available in the chart's zooming toolbar.
     *
     * Available options:
     * - `ZoomIn`: Displays a tool that allows users to zoom into the chart.
     * - `ZoomOut`: Displays a tool that allows users to zoom out of the chart.
     * - `Pan`: Enables panning across the chart by dragging.
     * - `Reset`: Resets the chart view to its original state.
     *
     * @default '["ZoomIn", "ZoomOut", "Pan", "Reset"]'
     */
    items?: ToolbarItems[];

    /**
     * Customizes the position of the zoom toolbar within the chart area.
     *
     * @default { hAlign: 'Right', vAlign: 'Top', x: 0, y: 0 }
     */
    position?: ToolbarPosition;
}

/**
 * Defines the configuration options for customizing a row within the chart layout.
 */
export interface Row {

    /**
     * Sets the height of the row.
     * Accepts values in pixels (e.g., `'100px'`) or percentages (e.g., `'100%'`).
     * If set to `'100%'`, the row occupies the full height of the chart.
     *
     * @default '100%'
     */
    height?: string;

    /**
     * Customizes the border of the row.
     * Accepts a `ChartBorderProps` object to configure the border color, width, and dash pattern.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    border?: ChartBorderProps;
}

/**
 * Represents the configuration options for the Chart component.
 *
 * @public
 */
export interface ChartComponentProps {

    /**
     * Unique identifier for the chart element.
     *
     * @default ''
     *
     * @example
     * ```tsx
     * <Chart id='container'>
     * </Chart>
     * ```
     */
    id?: string;

    /**
     * Sets the width of the chart. Accepts values in pixels (e.g., `'100px'`) or percentages (e.g., `'100%'`).
     * If set to `'100%'`, the chart occupies the full width of its parent container.
     *
     * @default null
     *
     * @example
     * ```tsx
     * <Chart width='100px'>
     * </Chart>
     * ```
     */
    width?: string;

    /**
     * Sets the height of the chart. Accepts values in pixels (e.g., `'100px'`) or percentages (e.g., `'100%'`).
     * If set to `'100%'`, the chart occupies the full height of its parent container.
     *
     * @default null
     *
     * @example
     * ```tsx
     * <Chart height='100px'>
     * </Chart>
     * ```
     */
    height?: string;

    /**
     * Customizes the chart border using `color`, `width`, and `dashArray` properties.
     *
     * @default { color: '', width: 1, dashArray: '' }
     *
     * @example
     * ```tsx
     * <Chart border={{ color: '#0078D4', width: 2, dashArray: '2,2' }}>
     * </Chart>
     * ```
     */
    border?: ChartBorderProps;

    /**
     * Represents child elements that can be nested inside the chart component.
     *
     * @private
     */
    children?: React.ReactNode;

    /**
     * Customizes the margins around the chart.
     * Defines the space between the chart's outer edge and its chart area.
     *
     * @default { top: 10, right: 10, bottom: 10, left: 10 }
     *
     * @example
     * ```tsx
     * <Chart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
     * </Chart>
     * ```
     */
    margin?: ChartMarginProps;

    /**
     * Sets the background color of the chart.
     * Accepts valid CSS color strings in hex or RGBA formats.
     *
     * @default ''
     *
     * @example
     * ```tsx
     * <Chart background='#0078D4'>
     * </Chart>
     * ```
     */
    background?: string;

    /**
     * Sets the background image of the chart.
     * Accepts a URL or local image path.
     *
     * @default ''
     *
     * @example
     * ```tsx
     * <Chart backgroundImage='https://ej2.syncfusion.com/demos/src/chart/images/sunny.png'>
     * </Chart>
     * ```
     */
    backgroundImage?: string;

    /**
     * If set to `true`, the chart is rendered in a transposed layout, swapping the X and Y axes.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Chart transposed={true}>
     * </Chart>
     * ```
     */
    transposed?: boolean;

    /**
     * Applies a visual theme to the chart.
     *
     * Available options:
     * - `Material`: Applies the Material light theme.
     * - `MaterialDark`: Applies the Material dark theme.
     * - `Tailwind`: Applies the Tailwind theme.
     * - `TailwindDark`: Applies the Tailwind dark theme.
     * - `Bootstrap`: Applies the Bootstrap theme.
     * - `BootstrapDark`: Applies the Bootstrap dark theme.
     *
     * @default 'Material'
     *
     * @example
     * ```tsx
     * <Chart theme='Material'>
     * </Chart>
     * ```
     */
    theme?: Theme;

    /**
     * Defines a set of colors used for rendering chart series.
     * Each color in the array is applied sequentially to the series.
     *
     * @default []
     *
     * @example
     * ```tsx
     * <Chart palettes={['#2C3E50', '#E74C3C', '#3498DB', '#F39C12', '#27AE60', '#9B59B6']}>
     * </Chart>
     * ```
     */
    palettes?: string[];

    /**
     * Provides accessibility options for chart container element.
     *
     * @default { ariaLabel: '', focusable: true, role: '', tabIndex: 0 }
     *
     * @example
     * ```tsx
     * <Chart accessibility={{ ariaLabel: 'Sales performance chart showing monthly revenue trends', focusable: true, role: 'img', tabIndex: 0 }}>
     * </Chart>
     * ```
     */
    accessibility?: ChartAccessibilityProps;

    /**
     * Specifies the visual outline style applied when the chart container receives focus.
     *
     * @default { width: 1.5, color: null, offset: 0 }
     *
     * @example
     * ```tsx
     * <Chart focusOutline={{ width: 2, color: '#0078D4', offset: 2 }}>
     * </Chart>
     * ```
     */
    focusOutline?: FocusOutlineProps;

    /**
     * Controls whether columns for different series appear side by side in a column chart.
     *
     * @default true
     *
     * @example
     * ```tsx
     * <Chart enableSideBySidePlacement={true}>
     * </Chart>
     * ```
     */
    enableSideBySidePlacement?: boolean;

    /**
     * Triggered continuously while a zooming operation is in progress.
     * Fires when the user finishes a zoom action, such as releasing the mouse or completing a pinch gesture.
     * Provides details about the zoomed axis, including its name, zoom factor, zoom position, and visible range before and after the operation.
     *
     * @event onZoomEnd
     *
     * @example
     * ```tsx
     * <Chart onZoomEnd={(args) => {
     *     console.log('Zoom End:', args.axisName);
     *   }}>
     * </Chart>
     * ```
     */
    onZoomEnd?: (args: ZoomEndEvent) => void;

    /**
     * Triggered after a zoom selection operation is completed.
     * Fires during user interactions such as dragging, pinching, or mouse wheel zooming.
     * Provides access to the axis data involved in the zoom operation.
     *
     * @event onZoomStart
     *
     * @example
     * ```tsx
     * <Chart onZoomStart={(args) => {
     *     console.log('Zoom Start:', args.axisData);
     *   }}>
     * </Chart>
     * ```
     */
    onZoomStart?: (args: ZoomStartEvent) => void;

    /**
     * Triggered when the mouse moves over the chart.
     * Provides information about the mouse event, including the target element and pointer coordinates relative to the chart.
     *
     * @event onMouseMove
     *
     * @example
     * ```tsx
     * <Chart onMouseMove={(args) => {
     *     console.log('Mouse Move:', args.x);
     *   }}>
     * </Chart>
     * ```
     */
    onMouseMove?: (args: ChartMouseEvent) => void;

    /**
     * Triggered when the mouse enters a chart element.
     * Provides information about the mouse event, including the target element and pointer coordinates relative to the chart.
     *
     * @event onMouseEnter
     *
     * @example
     * ```tsx
     * <Chart onMouseEnter={(args) => {
     *     console.log('Mouse Enter:', args.x);
     *   }}>
     * </Chart>
     * ```
     */
    onMouseEnter?: (args: ChartMouseEvent) => void;

    /**
     * Triggered when the chart is clicked.
     * Provides information about the mouse event, including the target element and pointer coordinates.
     *
     * @event onClick
     *
     * @example
     * ```tsx
     * <Chart onClick={(args) => {
     *     console.log('Click:', args.x);
     *   }}>
     * </Chart>
     * ```
     */
    onClick?: (args: ChartMouseEvent) => void;

    /**
     * Triggered when the mouse leaves the chart.
     * Provides information about the mouse event, including the target element and pointer coordinates relative to the chart.
     *
     * @event onClick
     *
     * @example
     * ```tsx
     * <Chart onMouseLeave={(args) => {
     *     console.log('Mouse Leave:', args.x);
     *   }}>
     * </Chart>
     * ```
     */
    onMouseLeave?: (args: ChartMouseEvent) => void;

    /**
     * Triggered after a legend item is clicked.
     * Provides details about the clicked legend item including associated series and data points.
     *
     * @event onLegendClick
     *
     * @example
     * ```tsx
     * <Chart onLegendClick={(args) => {
     *     console.log('Legend Click:', args.text);
     *   }}>
     * </Chart>
     * ```
     */
    onLegendClick?: (args: LegendClickEvent) => void;

    /**
     * Triggered after an axis label is clicked.
     * Provides details about the clicked label including its position, value, and associated axis.
     *
     * @event onAxisLabelClick
     *
     * @example
     * ```tsx
     * <Chart onAxisLabelClick={(args) => {
     *     console.log('Axis Label Click:', args.text);
     *   }}>
     * </Chart>
     * ```
     */
    onAxisLabelClick?: (args: AxisLabelClickEvent) => void;


    /**
     * Triggered when a multi-level label is clicked in the chart.
     * Provides details about the clicked label, including its axis, text, level, and range.
     *
     * @event onMultiLevelLabelClick
     *
     * @example
     * ```tsx
     * <Chart onMultiLevelLabelClick={(args) => {
     *     console.log('Multi Level Label Click:', args.text);
     *   }}>
     * </Chart>
     * ```
     */
    onMultiLevelLabelClick?: (args: MultiLevelLabelClickEvent) => void;

    /**
     * Triggered when a data point in the chart is clicked.
     * Provides details about the clicked point, including its position, series index, and mouse coordinates.
     *
     * @event onPointClick
     *
     * @example
     * ```tsx
     * <Chart onPointClick={(args) => {
     *     console.log('Point Click:', args.seriesIndex);
     *   }}>
     * </Chart>
     * ```
     */
    onPointClick?: (args: PointClickEvent) => void;

    /**
     * Triggered after the chart is resized.
     * Provides details about the chart's size before and after the resize.
     *
     * @event onResize
     *
     * @example
     * ```tsx
     * <Chart onResize={(args) => {
     *     console.log('Resize:', args.currentSize);
     *   }}>
     * </Chart>
     * ```
     */
    onResize?: (args: ResizeEvent) => void;

    /**
     * Specifies a callback function to customize the color of individual points in the series.
     *
     * @default null
     *
     * @example
     * ```tsx
     * <Chart pointRender={(args) => {
     *     console.log('Point Render:', args.color);
     *   }}>
     * </Chart>
     * ```
     */
    pointRender?: (args: PointRenderProps) => string;

    /**
     * Specifies a template to display when the chart has no data.
     *
     * This template is rendered when all series data sources are empty.
     * It supports both HTML string content and React functional templates.
     *
     * @default null
     *
     * @example
     * ```tsx
     * <Chart noDataTemplate={`<div style="text-align:center; padding:10px; color:#888;">No data available to display</div>`}>
     * </Chart>
     * ```
     */
    noDataTemplate?: string | Function;
}

/**
 * Provides information about mouse events triggered within the chart.
 */
export interface ChartMouseEvent {

    /**
     * The ID of the element that is the target of the mouse event.
     */
    target: string;

    /**
     * The X-coordinate of the mouse pointer relative to the chart.
     */
    x: number;

    /**
     * The Y-coordinate of the mouse pointer relative to the chart.
     */
    y: number;

    /**
     * Defines a collection of axis data, where the key is the axis name and the value is the axis value at the mouse location.
     */
    axisData: { [key: string]: number };

}

/**
 * Represents a chart axis with configurable properties for data type, appearance, and behavior.
 */
export interface ChartAxisProps {

    /**
     * Specifies the type of data the axis represents to ensure appropriate rendering.
     *
     * Available options:
     * - `Double`: Numeric axis for numerical data.
     * - `DateTime`: Date-time axis for temporal data.
     * - `Category`: Category axis for categorical data.
     * - `Logarithmic`: Logarithmic axis for data with a wide range of values.
     *
     * @default 'Double'
     */
    valueType?: AxisValueType;

    /**
     * A unique identifier for the axis.
     * To associate an axis with a series, set this name in the series' `xAxisName` or `yAxisName`.
     *
     * @default ''
     */
    name?: string;

    /**
     * Specifies the index of the column to which the axis is assigned when the chart area is divided using `columns`.
     *
     * @default 0
     */
    columnIndex?: number;

    /**
     * Specifies how many columns or rows the axis should span in the chart layout.
     *
     * @default 1
     */
    span?: number;

    /**
     * Specifies the index of the row to which the axis is assigned when the chart area is divided using `rows`.
     *
     * @default 0
     */
    rowIndex?: number;

    /**
     * When set to `true`, the axis is rendered on the opposite side of its default position.
     *
     * @default false
     */
    opposedPosition?: boolean;

    /**
     * When set to `true`, the axis is rendered in reverse order, displaying values from maximum to minimum.
     *
     * @default false
     */
    inverted?: boolean;

    /**
     * When set to `true`, data points are rendered based on their index position rather than their actual x-axis values.
     *
     * @default false
     */
    indexed?: boolean;

    /**
     * When set to `false`, axis labels are hidden from the chart.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Sets the maximum value of the axis range.
     * Defines the upper bound of the axis and controls the visible data range.
     *
     * @default null
     */
    maximum?: Object;

    /**
     * Sets the minimum value of the axis range.
     * Defines the lower bound of the axis and controls the visible data range.
     *
     * @default null
     */
    minimum?: Object;

    /**
     * Specifies the interval between axis labels or ticks.
     *
     * @default null
     */
    interval?: number;

    /**
     * Defines how intervals are calculated and displayed on a date-time axis.
     *
     * Available options:
     * - `Auto`: Automatically determines the interval based on the data.
     * - `Years`: Uses yearly intervals.
     * - `Months`: Uses monthly intervals.
     * - `Days`: Uses daily intervals.
     * - `Hours`: Uses hourly intervals.
     * - `Minutes`: Uses minute-based intervals.
     * - `Seconds`: Uses second-based intervals.
     *
     * @default 'Auto'
     */
    intervalType?: IntervalType;

    /**
     * Specifies the skeleton format used for processing date-time values.
     *
     * @default ''
     */
    skeleton?: string;

    /**
     * Specifies the format type used for date-time formatting.
     *
     * Available options:
     * - `Date`: Formats and displays only the date portion.
     * - `DateTime`: Formats and displays both date and time.
     * - `Time`: Formats and displays only the time portion.
     *
     * @default 'DateTime'
     */
    skeletonType?: SkeletonType;

    /**
     * When set to `true`, the axis starts from zero, ensuring a baseline reference for data comparison.
     * When set to `false`, the axis starts from the minimum value in the dataset, which can help highlight variations
     * in data when zero is not a meaningful starting point.
     *
     * @default true
     */
    startFromZero?: boolean;

    /**
     * Specifies the desired number of intervals for the axis.
     * The actual number may vary depending on the available space and data range.
     *
     * @default null
     */
    desiredIntervals?: number;

    /**
     * Specifies the maximum number of labels per 100 pixels of axis length.
     *
     * @default 3
     */
    maxLabelDensity?: number;

    /**
     * Sets the position of the zoomed axis within the zoomed range.
     * Value ranges from 0 to 1.
     *
     * @default 0
     */
    zoomPosition?: number;

    /**
     * Scales the axis by the specified factor.
     * For example, a `zoomFactor` of 0.5 scales the chart by 200% along this axis.
     *
     * > Value must be between 0 and 1.
     *
     * @default 1
     */
    zoomFactor?: number;

    /**
     * Customizes the appearance of the axis line.
     * Accepts an `AxisLine` object to configure properties such as color, width, and dash pattern.
     *
     * @default {width: 1, color: '', dashArray: ''}
     */
    lineStyle?: AxisLine;

    /**
     * Sets padding around the chart area in pixels.
     *
     * @default {left: 0, right: 0, top: 0,  bottom: 0}
     */
    plotOffset?: ChartPaddingProps;

    /**
     * Specifies React child elements to be rendered within the chart component.
     * Can include configuration components, annotations, or custom elements.
     *
     * @private
     */
    children?: React.ReactNode;

    /**
     * Determines the position of axis ticks relative to the axis line.
     *
     * Available options:
     * - `Inside`: Renders ticks inside the axis line.
     * - `Outside`: Renders ticks outside the axis line.
     *
     * @default 'Outside'
     */
    tickPosition?: AxisLabelPosition;

    /**
     * Specifies the number of minor ticks per interval.
     *
     * @default 0
     */
    minorTicksPerInterval?: number;

    /**
     * Controls how padding is applied to the axis range.
     *
     * Available options:
     * - `None`: No padding.
     * - `Normal`: Padding based on range calculation.
     * - `Additional`: Adds one interval to both ends of the range.
     * - `Round`: Rounds the range to the nearest interval.
     *
     * @default 'Auto'
     */
    rangePadding?: ChartRangePadding;

    /**
     * Sets the base value for a logarithmic axis.
     *
     * > `valueType` must be set to `Logarithmic` for this to take effect.
     *
     * @default 10
     */
    logBase?: number;

    /**
     * Defines the configuration for where and how the axis line intersects with another axis.
     * This includes the intersection value, the target axis, and whether overlapping of axis elements is allowed.
     *
     * @default { value:null, axis:'', allowOverlap:true}
     */
    crossAt?: ChartAxisCrossingProps;

    /**
     * The coefficient value adjusts the radius
     * size of  the polar or radar chart.
     *
     * A higher value increases the radius size,
     * while a smaller value decreases it.
     *
     * `coefficient` is a layout-level property
     * controlling overall radial scale.
     *
     * @default 100
     */
    coefficient?: number;

    /**
     * Specifies the starting angle of the
     * circular axis for a polar or radar chart.
     *
     * The angle is measured in degrees from
     * the horizontal axis and determines the
     * initial angle from which the series
     * rendering begins.
     *
     * @default 0
     */
    startAngle?: number;
}


/**
 * Defines the configuration options for customizing a column within the chart layout.
 */
export interface Column {

    /**
     * Sets the width of the column.
     * Accepts values in pixels (e.g., `'100px'`) or percentages (e.g., `'100%'`).
     * If set to `'100%'`, the column occupies the full width of the chart.
     *
     * @default '100%'
     */
    width?: string;

    /**
     * Customizes the border of the column.
     * Accepts a `ChartBorderProps` object to configure the border color, width, and dash pattern.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    border?: ChartBorderProps;
}

/**
 * Defines the properties for the Columns layout component used in chart rendering.
 *
 * @private
 */
export interface ColumnsProps {

    /**
     * React child elements to be rendered inside the Columns layout.
     * These can include axis configurations, series, or other chart components.
     */
    children?: React.ReactNode;
}

/**
 * Defines the appearance settings for major grid lines in the chart.
 */
export interface MajorGridLines {

    /**
     * Specifies the width of the major grid lines, in pixels.
     * A value of `0` hides the grid lines.
     *
     * @default null
     */
    width?: number | null;

    /**
     * Defines the dash pattern for the major grid lines.
     * Accepts a string of comma-separated numbers (e.g., `'5,5'`) to create dashed lines.
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Specifies the color of the major grid lines.
     * Accepts any valid CSS color string.
     *
     * @default ''
     */
    color?: string;
}

/**
 * Defines the appearance settings for minor grid lines in the chart.
 */
export interface MinorGridLines {

    /**
     * Specifies the width of the minor grid lines, in pixels.
     * A value of `0` hides the grid lines.
     *
     * @default 0.7
     */
    width?: number;

    /**
     * Defines the dash pattern for the minor grid lines.
     * Accepts a string of comma-separated numbers (e.g., `'2,2'`) to create dashed lines.
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Specifies the color of the minor grid lines.
     * Accepts any valid CSS color string.
     *
     * @default ''
     */
    color?: string;
}

/**
 * Defines the appearance settings for major tick lines in the chart.
 */
export interface MajorTickLines {

    /**
     * Specifies the width of the major tick lines, in pixels.
     * A value of `0` hides the tick lines.
     *
     * @default 0
     */
    width?: number;

    /**
     * Specifies the height of the major tick lines, in pixels.
     * Determines how far the tick lines extend from the axis.
     *
     * @default 5
     */
    height?: number;

    /**
     * Specifies the color of the major tick lines.
     * Accepts any valid CSS color string.
     *
     * @default ''
     */
    color?: string;
}

/**
 * Defines the appearance settings for minor tick lines in the chart.
 */
export interface MinorTickLines {

    /**
     * Specifies the width of the minor tick lines, in pixels.
     * A value of `0` hides the tick lines.
     *
     * @default 0.7
     */
    width?: number;

    /**
     * Specifies the height of the minor tick lines, in pixels.
     * Determines how far the tick lines extend from the axis.
     *
     * @default 5
     */
    height?: number;

    /**
     * Specifies the color of the minor tick lines.
     * Accepts any valid CSS color string.
     *
     * @default ''
     */
    color?: string;
}

/**
 * Defines the properties for the Series layout component, typically used to wrap and render one or more chart series.
 *
 * @private
 */
export interface SeriesProps {

    /**
     * React child elements (series components) to be rendered inside the Series container.
     */
    children?: React.ReactNode;
}

/**
 * Represents the configuration model for a chart series.
 * Extend this interface to define properties related to series data and appearance.
 *
 * @public
 */
export interface ChartSeriesProps {
    /**
     * Specifies the name of the field in the data source that maps values to the x-axis of the chart. This property is essential for identifying which data dimension should be plotted horizontally, such as categories, timestamps, or numerical values.
     *
     * @default ''
     */
    xField?: string;

    /**
     * Controls the visibility of the series on the chart.
     * When set to `false`, the series is hidden.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Defines the border styling for the series. This includes customization options such as border color and width.
     *
     * @default { color: '', width: 0 }
     */
    border?: ChartBorderProps;

    /**
     * Specifies the name of the horizontal axis associated with the series.
     * Requires the `axes` configuration in the chart.
     *
     * @default null
     */
    xAxisName?: string | null;

    /**
     * Specifies the name of the vertical axis associated with the series. Requires the `axes` configuration in the chart.
     *
     * @default null
     */
    yAxisName?: string | null;

    /**
     * Sets the fill color of the series. Accepts any valid CSS color value, including hex codes, RGB, RGBA, HSL.
     *
     * @default ''
     */

    fill?: string | null;

    /**
     * Defines the stroke width of the series, in pixels. This controls the thickness of the line type series.
     *
     * @default 1
     */
    width?: number;

    /**
     * Defines the dash pattern for the stroke in `Line` type series. Use a string format to specify dash and gap lengths (e.g., "4,2").
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Specifies the data source for the series.
     * Can be an array of JSON objects or an instance of `DataManager`.
     *
     * @default ''
     */
    dataSource?: Object | DataManager;

    /**
     * Defines a query to retrieve data from the data source.
     * Applicable only when using `ej.DataManager` as the data source.
     *
     * @default ''
     */
    query?: Query | string;

    /**
     * Enables complex property mapping to improve performance when binding large data sets.
     *
     * @default false
     */
    enableComplexProperty?: boolean;

    /**
     * Sets the name of the series, which is displayed in the chart legend.
     * Useful for identifying multiple series.
     *
     * @default ''
     */
    name?: string;

    /**
     * Specifies the name of the field in the data source that provides the values to be plotted along the y-axis. This property is used to map vertical data points in the chart, such as numerical values or metrics.
     *
     * @default ''
     */
    yField?: string;

    /**
     * Sets the opacity of the series.
     * Accepts a value between 0 (fully transparent) and 1 (fully opaque).
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Specifies the name of the data field that contains the values used to determine the size (radius) of each bubble in a bubble chart.
     *
     * @default ''
     */
    sizeField?: string;

    /**
     * Determines the rendering order of the series within the chart. Series with higher `zOrder` values are drawn above those with lower values.
     *
     * @default 0
     */
    zOrder?: number;

    /**
     * Defines the type of series used to visualize the data.
     * Supported types include:
     * - `Line` - Renders a line chart.
     * - `MultiColoredLine` - Renders a multicolored line chart.
     * - `Column` - Renders a column chart.
     * - `Area` - Renders an area chart.
     * - `StepArea` - Renders a step area chart.
     * - `Bar` - Renders a bar chart.
     * - `StackingArea` - Renders a stacking area chart.
     * - `StackingArea100` - Renders a 100% stacking area chart.
     * - `StackingColumn` - Renders a stacking column chart.
     * - `StackingBar` - Renders a stacking bar chart.
     * - `StackingColumn100` - Renders a 100% stacking column chart.
     * - `StackingBar100` - Renders a 100% stacking bar chart.
     * - `StepLine` - Renders a step line chart.
     * - `SplineArea` - Renders a spline area chart.
     * - `Scatter` - Renders a scatter chart.
     * - `Spline` - Renders a spline chart.
     * - `Bubble` - Renders a bubble chart.
     * - `Candle` - Renders a candle chart.
     * - `Hilo` - Renders a hilo chart.
     * - `HiloOpenClose` - Renders a hiloOpenClose chart.
     * - `RangeArea` - Renders a rangeArea chart.
     * - `RangeColumn` - Renders a rangeColumn chart.
     * - `SplineRangeArea` - Renders a spline range area series.
     * - `Waterfall` - Renders a waterfall series.
     * - `MultiColoredArea` - Renders a MultiColoredArea chart.
     * - `Histogram` - Renders a histogram series.
     * - `PolarLine` - Renders a polar line chart.
     * - `PolarSpline` - Renders a polar spline chart.
     * - `PolarArea` - Renders a polar area chart.
     * - `PolarSplineArea` - Renders a polar spline area chart.
     * - `PolarColumn` - Renders a polar column chart.
     * - `PolarStackingArea` - Renders a polar stacking area chart.
     * - `PolarStackingColumn` - Renders a polar stacking column chart.
     * - `PolarRangeColumn` - Renders a polar range column chart.
     * - `PolarScatter` - Renders a polar scatter chart.
     * - `RadarLine` - Renders a radar line chart.
     * - `RadarSpline` - Renders a radar spline chart.
     * - `RadarArea` - Renders a radar area chart.
     * - `RadarSplineArea` - Renders a radar spline area chart.
     * - `RadarColumn` - Renders a radar column chart.
     * - `RadarStackingArea` - Renders a radar stacking area chart.
     * - `RadarStackingColumn` - Renders a radar stacking column chart.
     * - `RadarRangeColumn` - Renders a radar range column chart.
     * - `RadarScatter` - Renders a radar scatter chart.
     * - `Pareto` - Renders a pareto series.
     * -`StackingLine` - Renders a stacking line chart.
     * -`StackingLine100` - Renders a 100% stacking line chart.
     * - `BoxAndWhisker` - Renders a box and whisker chart.
     * - `StackingStepArea` - Renders a stacking step area chart.
     *
     * @default 'Line'
     */
    type?: ChartSeriesType;

    /**
     * Specifies the position of steps in step line chart type.
     * * `Left` - Steps begin from the left side of the second point.
     * * `Right` - Steps begin from the right side of the first point.
     * * `Center` - Steps begin between the data points.
     *
     * @default 'Left'
     */
    step?: StepPosition;

    /**
     * Enhances accessibility for series elements to ensure compatibility with assistive technologies, such as screen readers and keyboard navigation.
     *
     * @default { ariaLabel: '', descriptionFormat: '', focusable: true, role: '', tabIndex: 0 }
     */
    accessibility?: SeriesAccessibility;

    /**
     * Customizes the appearance of empty points in the series.
     * Points with `null` or `undefined` values are treated as empty.
     *
     * @default { border: {color: 'gray', width: 1 }, mode: 'Gap', fill: 'gray' }
     */
    emptyPointSettings?: EmptyPointSettings;

    /**
     * Determines whether vertical risers are rendered in a step series.
     * When set to `true`, the step series is drawn without vertical lines between horizontal steps, resulting in a flat step appearance.
     * Applicable only to step series chart types.
     *
     * @default false
     */
    noRisers?: boolean;

    /**
     * Maps a data source field to assign individual colors to each point in the series.
     *
     * @default ''
     */
    colorField?: string;

    /**
     *
     * Specifies animation settings for the series, including options to enable or disable animation, and configure its duration and delay for smoother visual transitions.
     *
     * @default { enable: true, duration: 1000, delay: 0 }
     */
    animation?: Animation;

    /**
     * Groups series in stacked column and stacked bar charts.
     * Series with the same `stackingGroup` value are stacked together.
     *
     * @default ''
     */
    stackingGroup?: string;

    /**
     * Selects the algorithm used to draw curved lines between data points in spline series.
     *
     * Available options:
     * * `Natural` - Renders a natural spline.
     * * `Cardinal` - Renders a cardinal spline.
     * * `Clamped` - Renders a clamped spline.
     * * `Monotonic` - Renders a monotonic spline.
     *
     * @default 'Natural'
     */
    splineType?: SplineType;

    /**
     * Specifies the tension parameter for cardinal splines. This affects the curvature of the spline.
     *
     * @default 0.5
     */
    cardinalSplineTension?: number;

    /**
     * Defines a custom format string for displaying tooltips when hovering over data points in this series.
     *
     * The format string can include placeholders that will be replaced with actual values.
     *
     * @default ''
     */
    tooltipFormat?: string;

    /**
     * Maps a specific field from the data source to use as tooltip content.
     * The mapped field's value is stored in the point's tooltip property and it can be accessed through tooltip format.
     *
     *
     * @default ''
     */
    tooltipField?: string;

    /**
     * Specifies the shape used to represent the series in the chart legend.
     *
     * Available options:
     * - `Circle`: Renders a circular legend shape.
     * - `Rectangle`: Renders a rectangular legend shape.
     * - `Triangle`: Renders a triangular legend shape.
     * - `Diamond`: Renders a diamond-shaped legend.
     * - `Cross`: Renders a cross-shaped legend.
     * - `HorizontalLine`: Renders a horizontal line as the legend shape.
     * - `VerticalLine`: Renders a vertical line as the legend shape.
     * - `Pentagon`: Renders a pentagon-shaped legend.
     * - `InvertedTriangle`: Renders an inverted triangle shape.
     * - `SeriesType`: Uses the shape based on the series type.
     * - `Image`: Renders a custom image as the legend shape.
     *
     * @default 'SeriesType'
     */
    legendShape?: LegendShape;

    /**
     * Sets a fixed column width in pixels for points in column and bar charts. This property overrides relative sizing and ensures consistent column width across categories.
     *
     * @default null
     */
    columnWidthInPixel?: number;

    /**
     * Defines the spacing between columns in column or bar charts.
     * Accepts a value between 0 and 1.
     *
     * @default 0
     */
    columnSpacing?: number;

    /**
     * Specifies the relative width of each column in column and bar charts. Accepts a value between `0` and `1`, where `1` means columns occupy the full available width within a category, and `0.5` means they occupy half the space.
     *
     * @default null
     */
    columnWidth?: number;

    /**
     * Specifies a group name to overlay mutually exclusive chart series.
     * Series in the same group share the same baseline and axis location.
     *
     * @default ''
     */
    groupName?: string;

    /**
     * Defines the corner radius for data points.
     *
     * @default { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 }
     */
    cornerRadius?: CornerRadius;

    /**
     * Settings for displaying markers at each data point in the series. Allows customization of shape, size, and color of marker.
     *
     * @private
     */
    marker?: ChartMarkerProps;

    /**
     * Specifies the collection of trendlines to be displayed for the series.
     *
     * Trendlines identify trends or patterns in data by fitting a line or curve through data points.
     * Supports multiple types: Linear, Exponential, Logarithmic, Polynomial, Power, and Moving Average.
     *
     * @default []
     * @private
     */
    trendlines?: ChartTrendlineModel[];

    /**
     * Sets the minimum radius for data points (bubbles) in the series.
     *
     * @default 1
     */
    minRadius?: number;

    /**
     * Sets the maximum radius for data points (bubbles) in the series.
     *
     * @default 3
     */
    maxRadius?: number;

    /**
     * Enables the solid candlestick rendering style in charts.
     *
     * When enabled, candlesticks are filled based on the relationship between
     * the open and close prices of the current data point:
     * * A candle is filled (solid) if the close is below the open.
     * * A candle is hollow if the close is above the open.
     *
     * @default false
     */
    enableSolidCandles?: boolean;

    /**
     * Specifies the fill color for bullish candles or points,
     * where the closing price is higher than the opening price.
     *
     * Commonly used to indicate upward price movement.
     *
     * @default ''
     */
    bullFillColor?: string | null;

    /**
     * Specifies the fill color for bearish candles or points,
     * where the closing price is lower than the opening price.
     *
     * Commonly used to indicate downward price movement.
     *
     * @default ''
     */
    bearFillColor?: string | null;

    /**
     * Specifies the data field name that contains the high price value
     * for each data point in the financial chart.
     *
     * This value represents the highest price reached during the time interval.
     *
     * @default ''
     */
    high?: string;

    /**
     * Specifies the data field name that contains the low price value
     * for each data point in the financial chart.
     *
     * This value represents the lowest price reached during the time interval.
     *
     * @default ''
     */
    low?: string;

    /**
     * Specifies the data field name that contains the opening price value
     * for each data point in the financial chart.
     *
     * This value represents the price at the beginning of the time interval.
     *
     * @default ''
     */
    open?: string;

    /**
     * Specifies the data field name that contains the closing price value
     * for each data point in the financial chart.
     *
     * This value represents the price at the end of the time interval.
     *
     * @default ''
     */
    close?: string;

    /**
     * Determines whether tooltips for the chart series are enabled.
     * Set to `false` to hide the tooltip for a particular series.
     *
     * @default true
     */
    enableTooltip?: boolean;

    /**
     * configuration options for customizing the appearance and behavior of a Waterfall chart series.
     */
    waterfallSettings?: ChartWaterfallSettings;

    /**
     * Specifies whether to join the start and
     * end points of a line or area series in a
     * polar or radar chart to form a closed
     * SVG path.
     *
     * This property is applicable only to polar
     * and radar series types.
     *
     * @default true
     */
    isClosedPath?: boolean;

    /**
     * Configuration options for customizing
     * the appearance and behavior of a
     * Histogram chart series.
     */
    histogramSettings?: ChartHistogramSettings;

    /**
     * Specifies the visual facet used to render column and bar series data points.
     * Affects only the visual geometry of the series and does not influence data processing, layout, axis calculations, animations, or interactions.
     * **Note:** Applicable only to **Column** and **Bar** series types.
     *
     * @default 'Rectangle'
     *
     */
    columnFacet?: ColumnFacet;


    /**
     * Configuration options for customizing the behavior and visual appearance of a Box‑and‑Whisker chart series.
     *
     * Includes settings for quartile calculation,
     * whisker styling, mean display, and outlier
     * rendering.
     */
    boxAndWhiskerSettings?: ChartBoxAndWhiskerSettings;

    /**
     * Specifies the data source field that contains the volume value.
     * This property is applicable only to candle (candlestick) series and is used to render volume-related information associated with the candle data.
     * It is not used by other chart series types. Technical indicators that require volume data will read it indirectly from the associated candle series.
     *
     * @default ''
     */
    volume?: string;

}

/**
 * Configures options for displaying series names as inline labels in the chart.
 */
export interface ChartSeriesLabelProps {
    /**
     * Enables or disables the rendering of series names as inline labels.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Defines the custom text to display as the series label.
     * If not specified, the series name will be used.
     *
     * @default ''
     */
    text?: string;

    /**
     * Specifies the font properties for the series label.
     *
     * @default { color: '', fontFamily: '', fontSize: '14px', fontStyle: 'Normal', fontWeight: 'Normal', opacity: 1 }
     */
    font?: ChartFontProps;

    /**
     * Specifies the background color of the inline series label.
     *
     * @default 'transparent'
     */
    background?: string;

    /**
     * Specifies the border properties for the inline label.
     *
     * @default { color: '', width: 0, dashArray: '' }
     */
    border?: ChartBorderProps;

    /**
     * Sets the opacity of the series label.
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Determines whether to show the label text even when it overlaps with other labels.
     *
     * @default false
     */
    showOverlapText?: boolean;
}

/**
 * configuration options for customizing the appearance and behavior of a Waterfall chart series.
 */
export interface ChartWaterfallSettings {

    /**
     * Configures the connector line that visually links the columns in a Waterfall chart.
     *
     * @default  { strokeWidth: 1, strokeColor: '#5F6A6A', strokeDasharray: '', strokeOpacity: 1 }
     */
    connectorLine?: ChartWaterfallConnectorProps;

    /**
     * Specifies the fill color for columns representing negative values in the Waterfall chart.
     *
     * @default '#C64E4A'
     */
    negativeColor?: string;

    /**
     * Specifies the fill color for columns representing positive values in the Waterfall chart.
     *
     * @default ''
     */
    positiveColor?: string;

    /**
     * Defines the fill color for intermediate (sub-total) sum columns in the Waterfall chart.
     *
     * @default '#4E81BC'
     */
    subtotalColor?: string;

    /**
     * Defines the fill color for the final total sum column in the Waterfall chart.
     *
     * @default '#4E81BC'
     */
    totalColor?: string | null;

    /**
     * Specifies the indexes of data points that should be treated as intermediate sum points.
     *
     * @default []
     */
    intermediateSumIndexes?: number[];

    /**
     * Specifies the indexes of data points that should be treated as total sum points.
     *
     * @default []
     */
    sumIndexes?: number[];
}

/**
 * Configuration options for customizing the appearance and behavior of a Histogram
 * chart series.
 */
export interface ChartHistogramSettings {
    /**
     * Indicates whether to display the normal distribution curve for the Histogram series.
     *
     * When enabled, the chart calculates and renders a smooth normal distribution curve
     * based on the sample mean and sample standard deviation of the Histogram data.
     *
     * @default false
     */
    showNormalDistribution?: boolean;

    /**
     * Specifies the bin interval (bin width) used to group numeric values in the Histogram.
     *
     * When set to `null`, This ensures optimal bin sizing based on the
     * distribution and variance of the dataset.
     *
     * @default null
     */
    binInterval?: number | null;

    /**
     * Specifies the opacity of the normal distribution curve.
     * Accepts values from 0 (fully transparent) to 1 (fully opaque).
     *
     * @default 1
     */
    normalCurveOpacity?: number;

    /**
     * Defines the stroke (line) color used when rendering the normal distribution curve.
     * If not specified, the color is automatically assigned based on the chart's active theme.
     *
     * @default ''
     */
    normalCurveColor?: string;

    /**
     * Defines the stroke width of the normal distribution curve, measured in pixels.
     *
     * @default 2
     */
    normalCurveWidth?: number;

    /**
     * Specifies the dash pattern for the normal distribution curve stroke.
     * Provide a string of comma-separated values (e.g., '4,2') to apply dashed line styling.
     *
     * @default ''
     */
    normalCurveDashArray?: string;
}

/**
 * Defines the visual appearance settings for an LastValueLabel line in the chart.
 *
 * @public
 */
export interface ChartLineStyleProps {

    /**
     * Specifies the thickness of the LastValueLabel line in pixels.
     *
     * @default 1
     */
    width?: number;

    /**
     * Defines the dash pattern used to render the LastValueLabel line.
     * Accepts a string of comma-separated numbers (e.g., `'2,2'`) to create dashed lines.
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Specifies the color of the LastValueLabel line.
     * Accepts any valid CSS color string.
     *
     * @default ''
     */
    color?: string;
}

/**
 * Provides configuration options for controlling the calculation logic and visual appearance of a Box‑and‑Whisker chart series.
 */
export interface ChartBoxAndWhiskerSettings {
    /**
     * Defines the statistical method used to calculate quartiles and whisker ranges in the Box‑and‑Whisker series.
     * - `Exclusive`– Quartiles exclude the median from the halves.
     * - `Inclusive` – Quartiles include the median in both halves.
     * - `Normal`– Uses the standard box plot calculation method.
     *
     * @default 'Normal'
     */
    boxPlotMode?: BoxPlotMode;

    /**
     *  Indicates whether the mean value should be calculated and visually rendered as a marker or line within the box.
     *
     * @default true
     */
    showMean?: boolean;

    /** Determines whether values outside the whisker range should be treated as outliers and rendered as individual markers.
     *
     * When enabled, outliers are collected into `symbolLocations` and rendered using the existing marker rendering pipeline.
     *
     * @default true
     */
    showOutliers?: boolean;

    /**
     * Specifies the visual styling for whisker stems and end caps in the Box‑and‑Whisker series.
     *
     * Includes control over line color, width, dash pattern, and cap length.
     *
     * @default  { color: '', width: 1, dashArray: '', capLength: 0.5 }
     */
    whiskerStyle?: ChartWhiskerStyleProps;
}

/**
 * Configuration options for handling empty data points in a chart series.
 */
export interface EmptyPointSettings {

    /**
     * Sets the fill color for empty points in the series.
     *
     * @default ''
     */
    fill?: string;

    /**
     * Customizes the border of empty points, including color and width.
     *
     * @default { color: 'transparent', width: 0 }
     */
    border?: ChartBorderProps;

    /**
     * Specifies how empty or missing data points should be rendered in the series.
     * Available modes:
     * * `Gap` - Displays empty points as gaps in the series.
     * * `Zero` - Treats empty points as zero values.
     * * `Drop` - Ignores empty points during rendering.
     * * `Average` - Replaces empty points with the average of the previous and next points.
     *
     * @default 'Gap'
     */
    mode?: EmptyPointMode;
}

/**
 * Configuration options for enhancing the accessibility of chart elements.
 */
export interface ChartAccessibilityProps {

    /**
     * Provides a descriptive label for the chart to assist screen readers.
     * This value is automatically mapped to the `aria-label` attribute in the DOM.
     *
     * @default ''
     */
    ariaLabel?: string;

    /**
     * Specifies the ARIA role of the chart element. Helps assistive technologies understand the semantic purpose of the chart (e.g., "img", "figure", "application").
     * If not set, the default role will be inferred based on the element type.
     *
     * @default ''
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
 * Extends accessibility settings specifically for chart series elements.
 */
export interface SeriesAccessibility extends ChartAccessibilityProps {

    /**
     * Defines a format string for the accessibility description of the chart series.
     * This format is used by screen readers to describe the series contextually.
     *
     * @default null
     */
    descriptionFormat?: string;
}

/**
 * Configuration options for rendering markers in a chart series.
 */
export interface ChartMarkerProps {

    /**
     * When set to `true`, the marker is rendered and visible on the chart.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Specifies the shape of the marker used in the series.
     * Available options:
     * * `Circle` - Circular marker.
     * * `Rectangle` - Rectangular marker.
     * * `Triangle` - Triangular marker.
     * * `Diamond` - Diamond-shaped marker.
     * * `HorizontalLine` - Horizontal line marker.
     * * `VerticalLine` - Vertical line marker.
     * * `Pentagon` - Pentagon-shaped marker.
     * * `InvertedTriangle` - Inverted triangle marker.
     * * `Image` - Custom image marker.
     * * `Star` - Star-shaped marker.
     * * `Cross` - Cross-shaped marker.
     * * `Plus` - Plus-shaped marker.
     * * `None` - disable the marker.
     *
     * @default null
     */
    shape?: ChartMarkerShape | null;

    /**
     * Sets the URL of the image to be used as a marker and it requires `shape` to be set to `Image`.
     *
     * @default ''
     */
    imageUrl?: string;

    /**
     * Specifies the height of the marker in pixels.
     *
     * @default 5
     */
    height?: number;

    /**
     * Determines whether the marker should be filled with the series color.
     * When set to `true`, the marker is filled using the corresponding series color, enhancing visual distinction.
     * When set to `false`, the marker will be rendered with no fill or default styling.
     *
     * @default false
     */
    filled?: boolean;

    /**
     * Specifies the width of the marker in pixels.
     *
     * @default 5
     */
    width?: number;

    /**
     * Defines the border styling for the marker, including width and color.
     *
     * @default { color: '', width: 2, dashArray: '' }
     */
    border?: ChartBorderProps;

    /**
     * Sets the fill color of the marker. Accepts valid CSS color values such as hex codes or RGBA. Defaults to the series color if not specified.
     *
     * @default ''
     */
    fill?: string | null;

    /**
     *
     * When set to `true`, markers are visually emphasized on hover or selection, enhancing visibility and user feedback during data exploration.
     *
     * @default true
     */
    highlightable?: boolean;

    /**
     * Sets the opacity of the marker.
     * Accepts values from 0 (fully transparent) to 1 (fully opaque).
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Defines the configuration for displaying and styling data labels associated with markers.
     *
     * @private
     */
    dataLabel?: ChartDataLabelProps;

    /**
     * Adjusts the marker's position relative to its data point using horizontal and vertical offsets.
     *
     * @default { x: 0, y: 0 }
     */
    offset?: ChartLocationProps;

    /**
     * Allows rendering of child components within the marker.
     *
     * @private
     */
    children?: React.ReactNode;
}

/**
 * Configuration options for customizing data labels in chart series.
 */
export interface ChartDataLabelProps {

    /**
     * Controls the visibility of data labels in the series. Set to `true` to display labels for each data point.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Sets whether to display data labels for zero values in the series.
     *
     * When `true`, labels are shown even when the value is zero.
     * When `false`, labels for zero values are hidden.
     *
     * @default true
     */
    showZero?: boolean;

    /**
     * Maps a specific field from the data source to use as the data label content.
     *
     * The mapped field's value is displayed as the label for each data point.
     *
     * @default ''
     */
    labelField?: string | null;

    /**
     * Specifies the background color of the data label.
     * Use any valid CSS color values such as hex codes or RGBA.
     *
     * @default 'transparent'
     */
    fill?: string;

    /**
     * Used to format the data label. This property accepts global string formats such as `C`, `n1`, `P`, etc. It also accepts placeholders like `{value}°C`, where `{value}` represents the data label (e.g., 20°C).
     *
     * @default ''
     */
    format?: string | null;

    /**
     * Specifies opacity level of the data label background.
     * Accepts values from 0 (transparent) to 1 (opaque).
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Specifies the rotation angle (in degrees) for the data label.
     *
     * A positive value rotates the label clockwise, while a negative value rotates it counterclockwise.
     * This property is only effective when `enableRotation` is set to `true`.
     *
     * @default 0
     */
    rotationAngle?: number;

    /**
     * Specifies whether the data label should be rotated based on the provided angle.
     *
     * When set to `true`, the label is rotated according to the `angle` value.
     * When set to `false`, the label remains in its default orientation regardless of the angle.
     *
     * @default false
     */
    enableRotation?: boolean;

    /**
     * Sets the position of the data label relative to the data point.
     * Available options:
     * * `Outer` - Outside the data point.
     * * `Top` - Above the data point.
     * * `Bottom` - Below the data point.
     * * `Middle` - Centered on the data point.
     * * `Auto` - Automatically determined based on context.
     *
     * @default 'Auto'
     */
    position?: LabelPosition;


    /**
     * Specifies the horizontal (`x`) and vertical (`y`) corner radius
     * for the background of the data label.
     *
     * This controls how rounded the corners of the label background appear.
     *
     * @default { x: 5, y: 5 }
     */
    borderRadius?: BorderRadiusProps;

    /**
     * Sets the alignment of the data label relative to the data point.
     *
     * Available options:
     * * `Left` - Left-aligned.
     * * `Center` - Center-aligned.
     * * `Right` - Right-aligned.
     *
     * @default 'Center'
     */
    textAlign?: HorizontalAlignment;

    /**
     * Customizes the border appearance of the data label, including width and color.
     *
     * @default { color: '', width: 1 }
     */
    border?: ChartBorderProps;

    /**
     * Sets the margin around the data label with top, right, bottom, and left values.
     *
     * @default { left: 5, right: 5, top: 5, bottom: 5 }
     */
    margin?: ChartMarginProps;

    /**
     * Customizes the font used in the data label, including size, color, style, weight, and family.
     *
     * @default { color: '', fontFamily: '', fontSize: '', fontStyle: 'Normal', fontWeight: '', opacity: 1 }
     */
    font?: ChartFontProps;

    /**
     * Specifies how overlapping data labels are handled.
     * Available options:
     * * `None` - All labels are shown, even if they overlap.
     * * `Hide` - Overlapping labels are hidden.
     * * `Rotate90` - Labels are rotated 90° to reduce overlap.
     *
     * @default 'Hide'
     */
    intersectMode?: DataLabelIntersectMode;

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
     * @returns A string or boolean value to customize the label rendering.
     *
     * @default null
     */
    formatter?: (index: number, text: string) => string | boolean;

    /**
     * Custom template function for rendering the data label content.
     *
     * This function receives the data point properties and returns a JSX element
     * to access the data point values.
     *
     * @default null
     */
    template?: ((data: ChartDataLabelTemplateProps) => JSX.Element | null);
}

/**
 * A function type used to customize the content of data labels.
 *
 * @param {number} index - The index of the data point associated with the label.
 * @param {text} text - The current formatted text of the data label.
 * @returns {string} A string representing the customized label content.
 * @private
 */
export type DataLabelContentFunction = (index: number, text: string) => string | boolean;

/**
 * Represents the event arguments triggered when a data point is clicked in the chart.
 */
export interface PointClickEvent {

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

    /**
     * The x-coordinate of the mouse pointer relative to the entire page.
     */
    pageX?: number;

    /**
     * The y-coordinate of the mouse pointer relative to the entire page.
     */
    pageY?: number;
}

/**
 * Defines the corner radius settings for chart elements.
 */
export interface CornerRadius {

    /**
     * Specifies the radius for the top-left corner.
     *
     * @default 0
     */
    topLeft?: number;

    /**
     * Specifies the radius for the top-right corner.
     *
     * @default 0
     */
    topRight?: number;

    /**
     * Specifies the radius for the bottom-left corner.
     *
     * @default 0
     */
    bottomLeft?: number;

    /**
     * Specifies the radius for the bottom-right corner.
     *
     * @default 0
     */
    bottomRight?: number;
}

/**
 * Defines configuration options for the chart's title, including styling, positioning, and accessibility features.
 */
export interface ChartTitleProps {

    /**
     * Specifies the main title text of the chart. This text provides context or a label for the chart's data.
     *
     * @default ''
     */
    text?: string;

    /**
     * Specifies the font style of the title (e.g., 'Normal', 'Italic').
     *
     * @default ''
     */
    fontStyle?: string;

    /**
     * Sets the font size of the text in pixels.
     *
     * @default ''
     */
    fontSize?: string;

    /**
     * Specifies the font weight (thickness) of the title (e.g., 'Normal', 'Bold', '400').
     *
     * @default ''
     */
    fontWeight?: string;

    /**
     * Sets the color of the title. Accepts any valid CSS color string, including hexadecimal and RGBA formats.
     *
     * @default ''
     */
    color?: string;

    /**
     * Determines the alignment of the title within its container.
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
     * Specifies the font family used for the title (e.g., 'Arial', 'Verdana', 'sans-serif').
     *
     * @default ''
     */
    fontFamily?: string;

    /**
     * Sets the opacity level of the title. A value of 1 means fully opaque, while 0 means fully transparent.
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Controls how the title behaves when it overflows its container.
     *
     * Available options:
     * - `Wrap`: Wraps the text to the next line.
     * - `Trim`: Trims the overflowed text.
     * - `None`: Displays the text even if it overlaps other elements.
     *
     * @default 'Wrap'
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
     * @default 'Top'
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
     * @default 'transparent'
     */
    background?: string;

    /**
     * Defines the border styling for the chart title area.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    border?: TitleBorder;

    /**
     * Provides customization options to enhance accessibility for the chart title.
     *
     * @default { ariaLabel: '', focusable: true, role: 'img', tabIndex: 0 }
     */
    accessibility?: ChartAccessibilityProps;
}

/**
 * Represents the configuration model for tooltips in charts.
 */
export interface ChartTooltipProps {

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
     * When set to `true`, displays a single tooltip showing all data points that share the same x-value.
     *
     * @default false
     */
    shared?: boolean;

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
     * @default 1000
     */
    fadeOutDuration?: number;

    /**
     * Specifies a fixed position for the tooltip relative to the chart.
     * For example, `x: 20` positions the tooltip 20 pixels to the right.
     *
     * @default { x: 0, y: 0 }
     */
    location?: ChartLocationProps;

    /**
     * When set to `true`, includes the nearest data point in the shared tooltip.
     *
     * @default true
     */
    showNearestPoint?: boolean;

    /**
     * When set to `true`, displays a horizontal line separating the tooltip header from its content.
     *
     * @default false
     */
    showHeaderLine?: boolean;

    /**
     * Defines the font styling for the tooltip text, including font family, size, weight, and color.
     *
     * @default { color: '', fontFamily: '', fontSize: '', fontStyle: '', fontWeight: '', opacity: 1 }
     */
    textStyle?: ChartFontProps;

    /**
     * Customizes the tooltip border, including color and width.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    border?: ChartBorderProps;

    /**
     * Specifies the fade-out animation mode when hiding the tooltip.
     *
     * Available options:
     * - `Click`: The tooltip is removed when the user clicks on the chart.
     * - `Move`: The tooltip fades out after a short delay when the pointer moves away.
     *
     * @default 'Move'
     */
    fadeOutMode?: FadeOutMode;

    /**
     * When set to `true`, displays a tooltip for the data point nearest to the cursor.
     * Applicable for line, area, spline, and spline area series.
     *
     * @default true
     */
    showNearestTooltip?: boolean;

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
    formatter?: (text: string | string[]) => string | string[] | boolean;

    /**
     * Custom template function for rendering the tooltip content.
     *
     * This function receives the data point properties and returns a JSX element
     * to access the data point values.
     *
     * @default null
     */
    template?: ((data: ChartTooltipTemplateProps) => JSX.Element | null);

    /**
     * Specifies whether the tooltip should follow the pointer position dynamically. When set to true, the tooltip position is updated based on the current mouse or touch coordinates instead of the data point location. This property is ignored if an explicit location is provided for the tooltip.
     *
     * @default false
     */
    followPointer?: boolean;

    /**
     * Specifies the distance, in pixels, between the tooltip and the associated data point. This value is applied only when followPointer is set to false.When followPointer is enabled, this property has no effect.
     *
     * @default 0
     */
    distance?: number;

}

/**
 * Provides data for the event triggered when an axis label is clicked in a chart.
 */
export interface AxisLabelClickEvent {

    /**
     * The name of the axis to which the clicked label belongs is represented.
     */
    axisName: string;

    /**
     * The text content of the clicked axis label.
     */
    text: string;

    /**
     * The index of the clicked axis label.
     */
    index: number;

    /**
     * The location of the clicked axis label within the chart.
     */
    location: ChartLocationProps;

    /**
     * The value associated with the clicked axis label.
     */
    value: number;
}

/**
 * Provides data for the event triggered when a multi-level axis label is clicked in the chart.
 */
export interface MultiLevelLabelClickEvent {

    /**
     * Gets the name of the axis associated with the clicked multi-level label.
     */
    axisName: string;

    /**
     * Gets the text value of the clicked multi-level label.
     */
    text: string;

    /**
     * Gets the level index of the clicked multi-level label.
     */
    level: number;

    /**
     * Gets the starting value of the clicked multi-level label.
     */
    start: number | Date | string;

    /**
     * Gets the ending value of the clicked multi-level label.
     */
    end: number | Date | string;
}

/**
 * Provides event arguments for the chart resize event after it has occurred.
 */
export interface ResizeEvent {

    /**
     * Size of the chart before resizing.
     */
    previousSize: ChartSizeProps;

    /**
     * Size of the chart after resizing.
     */
    currentSize: ChartSizeProps;

}

/**
 * Defines the border radius configuration for chart elements.
 * This interface provides properties to customize the corner radius for both horizontal and vertical axes.
 */
export interface BorderRadiusProps {
    /**
     * Sets the horizontal (X-axis) corner radius for the element background.
     * This property controls the curvature of the left and right corners.
     *
     * @default 5
     */
    x?: number;

    /**
     * Sets the vertical (Y-axis) corner radius for the element background.
     * This property controls the curvature of the top and bottom corners.
     *
     * @default 5
     */
    y?: number;
}

/**
 * Defines the configuration options for stack labels in a chart.
 */
export interface ChartStackLabelsProps {

    /**
     * When set to `true`, stack labels are displayed on the chart.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Sets the background color of the stack labels.
     * Accepts valid CSS color values such as hex codes or RGBA.
     *
     * @default 'transparent'
     */
    fill?: string;

    /**
     * Custom format string for the stack label text.
     * Supports placeholders such as `{value}`, where `{value}` represents the total stack value.
     *
     * @default ''
     */
    format?: string | null;

    /**
     * Specifies the rotation angle of the stack labels in degrees.
     *
     * @default 0
     */
    rotationAngle?: number;

    /**
     * Defines the border radius configuration for the stack label background.
     * Controls the curvature of corners for both horizontal and vertical axes.
     *
     * @default { rx: 0, ry: 0 }
     */
    borderRadius?: BorderRadiusProps;

    /**
     * Configures the margin around the stack label.
     *
     * @default { left: 0, right: 0, top: 0, bottom: 0 }
     */
    margin?: ChartMarginProps;

    /**
     * Customizes the border appearance of the stack labels.
     *
     * @default { color: 'transparent', width: 0 }
     */
    border?: ChartBorderProps;

    /**
     * Defines the font styling for the stack label text.
     *
     * @default { fontStyle: 'Normal', fontSize: '12px', fontWeight: 'Normal', color: '', fontFamily: '', opacity: 1 }
     */
    font?: ChartFontProps;

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
}

/**
 * Defines the configuration options for the chart legend.
 */
export interface ChartLegendProps {

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
     * > The `position` must be set to `Custom` for this to take effect.
     *
     * @default { x: 0, y: 0 }
     */
    location?: ChartLocationProps;

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
     * @default 'Auto'
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
    itemPadding?: number;

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
     * @default 'Center'
     */
    align?: HorizontalAlignment | VerticalAlignment;

    /**
     * Customizes the appearance of text in legend items.
     *
     * @default { fontStyle: 'Normal', fontSize: '12px', fontWeight: 'Normal', color: '', fontFamily: '' }
     */
    textStyle?: ChartFontProps;

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
    border?: ChartBorderProps;

    /**
     * Sets the external spacing around the legend, controlling its distance from other chart elements.
     *
     * @default { left: 0, right: 0, top: 0, bottom: 0 }
     */
    margin?: ChartMarginProps;

    /**
     * Sets the internal spacing between the legend border and its content.
     * Creates visual breathing room within the legend container for better readability.
     *
     * @default { left: 0, right: 0, top: 0, bottom: 0 }
     */
    containerPadding?: ChartPaddingProps;

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
     * @default 'transparent'
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
    titleStyle?: ChartFontProps;

    /**
     * Determines the alignment of the title within its container.
     *
     * Available options:
     * - `Left`: Aligns the title to the left.
     * - `Center`: Aligns the title to the center.
     * - `Right`: Aligns the title to the right.
     *
     * @default 'Center'
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
     * @default 'Wrap'
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
    maxLabelWidth?: number;

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
     * @default { tabIndex: 0, focusable: true }
     */
    accessibility?: ChartAccessibilityProps;

    /**
     * Defines the mode for displaying legend items.
     * * Series - Legend items are generated based on the count of series.
     * * Point - Legend items are created according to each unique data point.
     * * Range - Legend items are generated based on the range color mapping property.
     * * Gradient - Displays a single linear bar that represents the range color mapping property.
     *
     * @default 'Series'
     */
    mode?: LegendMode;
}

/**
 * Provides event arguments triggered when a legend item is clicked in the chart.
 */
export interface LegendClickEvent {

    /**
     * The shape of the visual marker used in the clicked legend item.
     */
    shape: LegendShape;

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
 * Configures the properties for customizing strip lines on a chart axis.
 * Strip lines are used to highlight specific vertical or horizontal ranges in the plot area,
 * making it easier to visualize key thresholds, targets, or events.
 */
export interface ChartStripLineProps {

    /**
     * Enables the visibility of strip lines on the chart.
     * When set to `true`, the strip lines will be rendered on the axis.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Specifies the range and dimensions of the strip line on the axis. This object defines
     * where the strip line begins, its width or height, and how its size is calculated,
     * forming the core of the highlighted region.
     *
     * @default { shouldStartFromAxis: false, start: null, end: null, size: null, sizeType: 'Auto' }
     */
    range?: StripLineRangeProps;

    /**
     * Customizes the visual appearance of the strip line, including its background and border.
     * You can set properties like color, opacity, background images, and dash patterns
     * to make the strip line stand out or blend in with the chart's design.
     *
     * @default { color: '#808080', opacity: 1, dashArray: '', imageUrl: '', border: { color: '', width: 1, dashArray: '' }, zIndex: 'Behind' }
     */
    style?: StripLineStyleProps;

    /**
     * Configures the text displayed within the strip line. This allows you to add descriptive
     * labels or annotations directly on the highlighted range, with options to control text
     * content, styling, rotation, and alignment.
     *
     * @default { content: '', font: { color: '', fontFamily: '', fontSize: '', fontStyle: '', fontWeight: '', opacity: 1 }, rotation: null, hAlign: 'Center', vAlign: 'Center' }
     */
    text?: StripLineTextProps;

    /**
     * Configures repeating strip lines that recur at a regular interval. This is useful for
     * highlighting patterns, such as weekends on a date-time axis or alternating bands
     * for every 'n' units on a numeric axis.
     *
     * @default { enable: false, every: null, until: null }
     */
    repeat?: StripLineRepeatProps;

    /**
     * Configures a segmented strip line that is rendered only within the specified range of
     * another axis. This enables the creation of conditional highlights that are visible only
     * when a data point falls within a specific range on two different axes.
     *
     * @default { enable: false, start: null, end: null, axisName: null }
     */
    segment?: StripLineSegmentProps;
}

/**
 * Defines the axis range and dimensions for a strip line. This determines the position,
 * length, and scaling of the highlighted area on the chart's plot area.
 */
export interface StripLineRangeProps {

    /**
     * Specifies the starting value of the strip line on the axis.
     * This can be a numeric, date-time, or category value that marks the beginning
     * of the highlighted range. This property is ignored if `size` is set.
     *
     * @default null
     */
    start?: string | number | Date;

    /**
     * Specifies the ending value of the strip line on the axis. When both `start` and `end`
     * are provided, the strip line will cover the exact range between them.
     * This property is ignored if `size` is set.
     *
     * @default null
     */
    end?: string | number | Date;

    /**
     * Determines the width or height of the strip line, calculated from the `start` value.
     * This offers a flexible way to define the strip line's length without specifying
     * an explicit `end` value.
     *
     * @default null
     */
    size?: number;

    /**
     * Specifies how the `size` property is interpreted, either in pixel values or axis units.
     * When set to 'Pixel', the strip line has a fixed size regardless of zoom level.
     * 'Auto' (or axis units) makes the strip line scale with the axis.
     *
     * Available options:
     * - `Auto`: In numeric axis, size is interpreted as a number; in DateTime axis, as milliseconds.
     * - `Pixel`: The strip line size is in pixels.
     * - `Years`: The strip line size is based on years (DateTime axis only).
     * - `Months`: The strip line size is based on months (DateTime axis only).
     * - `Days`: The strip line size is based on days (DateTime axis only).
     * - `Hours`: The strip line size is based on hours (DateTime axis only).
     * - `Minutes`: The strip line size is based on minutes (DateTime axis only).
     * - `Seconds`: The strip line size is based on seconds (DateTime axis only).
     *
     * @default 'Auto'
     */
    sizeType?: StripLineSizeUnit;

    /**
     * Determines whether the strip line should originate from the axis origin (zero).
     * If `true`, the strip line will render from the baseline of the axis up to the `end` value,
     * which is ideal for highlighting ranges from the start of the plot area.
     *
     * @default false
     */
    shouldStartFromAxis?: boolean;
}

/**
 * Configures the visual styling of the strip line. This allows for customization of
 * colors, borders, and layering to ensure the strip line is both informative
 * and aesthetically pleasing within the chart's design.
 */
export interface StripLineStyleProps {

    /**
     * Sets the background color of the strip line. This color fills the entire area
     * defined by the strip line's range, making it visually distinct from the
     * rest of the plot area.
     *
     * @default '#808080'
     */
    color?: string;

    /**
     * Sets the opacity of the strip line, ranging from 0 (fully transparent) to 1 (fully opaque).
     * This is useful for creating subtle highlights that do not obscure the chart's
     * grid lines or data points behind them.
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Defines a dash pattern for the strip line's border, creating a dashed or dotted line effect.
     * The pattern is specified as a string of comma-separated numbers (e.g., "10,5"),
     * representing the length of the dash followed by the length of the gap.
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Specifies a URL for a background image to be displayed within the strip line.
     * This image will be clipped to the boundaries of the strip line and can be used
     * to create textured or patterned highlights.
     *
     * @default ''
     */
    imageUrl?: string;

    /**
     * Configures the border properties of the strip line, such as its color, width, and dash pattern.
     * A border can help visually separate the strip line from adjacent elements
     * or the chart's plot area.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    border?: ChartBorderProps;

    /**
     * Controls the rendering order of the strip line relative to the chart series.
     * Use 'Behind' to draw it behind the series or 'Over' to draw it in front.
     *
     * @default 'Behind'
     */
    zIndex?: ZIndex;
}

/**
 * Configures the text displayed inside a strip line, allowing for annotations and labels.
 * This provides control over the text's content, appearance, and positioning, making it
 * possible to add meaningful context directly to the highlighted range.
 */
export interface StripLineTextProps {

    /**
     * Specifies the text content to be displayed within the strip line. This can be a simple
     * label, a value, or any descriptive string that adds information to the highlighted area.
     *
     * @default ''
     */
    content?: string;

    /**
     * Defines the font and color styling for the strip line text. This includes properties
     * like font family, size, weight, and color, allowing the text to match the chart's
     * overall aesthetic or to be emphasized.
     *
     * @default { color: '', fontFamily: '', fontSize: '', fontStyle: '', fontWeight: '', opacity: 1 }
     */
    font?: ChartFontProps;

    /**
     * Sets the rotation angle of the text in degrees from its anchor point.
     * This is useful for fitting longer text into narrow strip lines or for creating
     * stylistic effects.
     *
     * @default null
     */
    rotation?: number;

    /**
     * Controls the horizontal alignment of the text within the strip line.
     * Options include 'Left', 'Center', and 'Right', determining whether the text is
     * positioned at the beginning, middle, or end of the strip line's horizontal space.
     *
     * @default 'Center'
     */
    hAlign?: HorizontalAlignment;

    /**
     * Controls the vertical alignment of the text within the strip line.
     * Options include 'Top', 'Center', and 'Bottom', positioning the text at the top,
     * middle, or bottom of the strip line's vertical space.
     *
     * @default 'Center'
     */
    vAlign?: VerticalAlignment;
}

/**
 * Configures the properties for creating repeating strip lines, which are used to
 * highlight recurring intervals across an axis. This is ideal for visualizing patterns
 * like weekly cycles, alternating colored bands, or periodic thresholds.
 */
export interface StripLineRepeatProps {

    /**
     * Enables or disables the repeating strip line feature. When `true`, the strip line
     * will be redrawn at the specified interval across the axis range.
     *
     * @default false
     */
    enable?: boolean;

    /**
     * Defines the interval at which the strip line should repeat. This value determines
     * the gap between the start of one strip line and the start of the next,
     * creating a regular, predictable pattern.
     *
     * @default null
     */
    every?: string | number | Date;

    /**
     * Specifies the maximum axis value at which the repetitions should stop. If not provided,
     * the strip lines will continue to repeat until the end of the visible axis range.
     *
     * @default null
     */
    until?: string | number | Date;
}

/**
 * Configures a segmented strip line that is rendered only when the data falls within
 * the specified range of another axis. This allows for creating conditional highlights
 * that depend on values from two different axes.
 */
export interface StripLineSegmentProps {

    /**
     * Enables or disables the segmented strip line feature. When `true`, the strip line's
     * visibility will be controlled by the range specified on a different axis.
     *
     * @default false
     */
    enable?: boolean;

    /**
     * Specifies the name of the axis that will define the visible range of the strip line.
     * The strip line will only appear in the sections where the data aligns
     * with the `start` and `end` values of this target axis.
     *
     * @default null
     */
    axisName?: string;

    /**
     * Defines the starting value for the segment on the axis specified by `axisName`.
     * This marks the beginning of the range on the controlling axis where the
     * strip line becomes visible.
     *
     * @default null
     */
    start?: string | number | Date;

    /**
     * Defines the ending value for the segment on the axis specified by `axisName`.
     * This marks the end of the range on the controlling axis, beyond which the
     * strip line will no longer be visible.
     *
     * @default null
     */
    end?: string | number | Date;
}

/**
 * Defines the visual appearance settings for an axis line in the chart.
 */
export interface AxisLine {

    /**
     * Specifies the thickness of the axis line in pixels.
     *
     * @default 1
     */
    width?: number;

    /**
     * Defines the dash pattern used to render the axis line.
     * Accepts a string of comma-separated numbers (e.g., `'2,2'`) to create dashed lines.
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Specifies the color of the axis line.
     * Accepts any valid CSS color string.
     *
     * @default ''
     */
    color?: string;
}

/**
 * Configuration options for displaying a label for the last visible data point in a series.
 * The label is axis-aligned and appears on the chart's axis edge.
 *
 * @public
 */
export interface ChartLastValueLabelProps {
    /**
     * Enables or disables the display of the last value label.
     *
     * @default false
     */
    enable?: boolean;

    /**
     * The background color for the label.
     * Accepts any valid CSS color string.
     *
     * @default ''
     */
    background?: string;

    /**
     * The border properties for the label.
     *
     * @default { color: '#D3D3D3', width: 1, dashArray: '' }
     */
    border?: ChartBorderProps;

    /**
     * Customizes the font styling for the label text.
     *
     * @default { fontSize: '12px', fontFamily: 'Roboto', fontWeight: 'Normal', fontStyle: 'Normal', opacity: 1, color: '' }
     */
    font?: ChartFontProps;

    /**
     * Line styling for connector/grid lines behind the labels.
     * Contains width, color and dashArray.
     *
     * @default { width: 1, color: '', dashArray: '' }
     */
    lineStyle?: ChartLineStyleProps;

    /**
     * Rounded corner radius (X) for the label background.
     *
     * @default 5
     */
    rx?: number;

    /**
     * Rounded corner radius (Y) for the label background.
     *
     * @default 5
     */
    ry?: number;
}

/**
 * Represents a point location in a 2D chart coordinate space.
 *
 */
export interface ChartLocationProps {

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
 * Defines optional padding values around the chart content.
 *
 * Padding creates spacing between the chart's rendering area and its container
 * or surrounding elements, helping to control layout and visual balance.
 */
export interface ChartPaddingProps {
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
 * Represents a function that customizes the content of a tooltip.
 *
 * @param {string | string[]} text - The input string used to generate the tooltip content.
 * @returns {string | string[] | boolean} A string representing the modified tooltip content.
 * @private
 */
export type TooltipContentFunction = (text: string | string[]) => string | string[] | boolean;

/**
 * Represents the context data available for rendering a custom tooltip template in a chart.
 */
export interface ChartTooltipTemplateProps {
    /** The X-coordinate of the data point in the chart. */
    x: number;

    /** The Y-coordinate of the data point in the chart. */
    y: number;

    /** The value to be displayed in the tooltip, mapped from the `tooltipField` in the series configuration. */
    tooltip: string;

    /** The index of the series to which the data point belongs. */
    seriesIndex: number;

    /** The index of the data point within the series. */
    pointIndex: number;
}

/**
 * Represents the context data available for rendering a custom data label template in a chart.
 */
export interface ChartDataLabelTemplateProps {
    /** The X-coordinate of the data point in the chart. */
    x: number;

    /** The Y-coordinate of the data point in the chart. */
    y: number;

    /** The value to be displayed as a data label, mapped from the `labelField` in the series configuration. */
    label: string;

    /** The index of the series to which the data point belongs. */
    seriesIndex: number;

    /** The index of the data point within the series. */
    pointIndex: number;
}

/**
 * Defines the configuration options for the chart crosshair.
 *
 */
export interface ChartCrosshairProps {

    /**
     * Enables or disables the crosshair line.
     * When set to `true`, the crosshair line is visible.
     *
     * @default false
     */
    enable?: boolean;

    /**
     * Specifies the visual style of the crosshair line.
     *
     * You can customize the line's color, width, and dash pattern
     * using the `dashArray` property.
     *
     * @default { color: '', width: 1, dashArray: '' }
     */
    lineStyle?: ChartCrosshairLineStyleProps;

    /**
     * Determines the orientation of the crosshair lines.
     *
     * Available options:
     * - `Both`: Displays both vertical and horizontal lines.
     * - `Vertical`: Displays only the vertical line.
     * - `Horizontal`: Displays only the horizontal line.
     *
     * @default 'Both'
     */
    lineType?: CrosshairLineType;

    /**
     * Highlights the entire category range on hover.
     *
     * This option is applicable only for category axes.
     *
     * @default false
     */
    highlightCategory?: boolean;

    /**
     * Specifies whether the crosshair should snap to the nearest data point or follow the mouse pointer.
     *
     * When `false`, the crosshair freely follows the mouse pointer's X and Y coordinates across the chart.
     *
     * @default true
     */
    snap?: boolean;

}

/**
 * Represents the styling options for crosshair lines in a chart.
 *
 */
export interface ChartCrosshairLineStyleProps {
    /**
     * Specifies the color of the crosshair lines.
     * Accepts any valid CSS color string, including hexadecimal, RGB, or RGBA formats.
     *
     * @default ''
     */
    color?: string;

    /**
     * Sets the width of the crosshair lines, in pixels.
     *
     * @default 1
     */
    width?: number;

    /**
     * Defines the dash pattern for the crosshair lines.
     * Accepts a string of numbers that specify the lengths of dashes and gaps (e.g., "5,3").
     *
     * @default '5,5'
     */
    dashArray?: string;

    /**
     * Sets the transparency level of the crosshair lines.
     * Accepts a value from `0` (fully transparent) to `1` (fully opaque).
     *
     * @default 1
     */
    opacity?: number;
}

/**
 * Configuration options for the crosshair axis tooltip in the chart.
 *
 */
export interface ChartCrosshairTooltipProps {
    /**
     * When set to true, a tooltip will be displayed at the axis intersection point
     * when the crosshair is active.
     *
     * @default false
     */
    enable?: boolean;

    /**
     * Specifies the background color of the axis tooltip.
     *
     * @default ''
     */
    fill?: string;

    /**
     * Customizes the text style of the axis tooltip.
     * Accepts font-related properties such as font size, color, weight, and family.
     *
     * @default { fontStyle: 'Normal', fontSize: '', fontWeight: 'Normal', color: '', fontFamily: '', opacity: 1 }
     */
    textStyle?: ChartFontProps;

    /**
     * Formatter for the crosshair axis tooltip text.
     *
     * @param {number} value - The numeric value at the crosshair on the axis.
     * @param {string} text - The current formatted text of the axis tooltip.
     * @returns {string | boolean} A string to override the tooltip text, or a boolean to keep it unchanged.
     * @default null
     */
    formatter?: (value: number, text: string) => string | boolean;
}

/**
 * Represents the configuration options for axis crossing in a chart.
 */
export interface ChartAxisCrossingProps {
    /**
     * Defines the value at which the axis line intersects with another axis.
     * This can be a numeric value, date, or category name, depending on the axis type.
     *
     * @default null
     */
    value?: number | Date | string | null;

    /**
     * Specifies the name of the target axis that the current axis line should intersect.
     *
     * @default ''
     */
    axis?: string | null;

    /**
     * Indicates whether the axis line is allowed to overlap axis elements such as labels and titles.
     * When set to `true`, the axis line may cross over these elements.
     *
     * @default true
     */
    allowOverlap?: boolean;
}

/**
 * Represents an annotation element displayed on the chart.
 */
export interface ChartAnnotationProps {
    /**
     * X-axis position of the annotation.
     * - When coordinateUnit is 'Pixel', specify offset in pixels.
     * - When coordinateUnit is 'Point', specify the axis value.
     *
     * @default null
     */
    x?: string | Date | number;

    /**
     * Y-axis position of the annotation.
     * - When coordinateUnit is 'Pixel', specify offset in pixels.
     * - When coordinateUnit is 'Point', specify the axis value.
     *
     * @default null
     */
    y?: string | number;

    /**
     * Content of the annotation. Accepts HTML string, plain text, or DOM element ID.
     *
     * @default ''
     */
    content?: string;

    /**
     * Horizontal alignment relative to the X-position.
     * Available Options:
     * - `Right`: Aligns the annotation to the right of its anchor/target.
     * - `Center`: Centers the annotation horizontally on its anchor/target.
     * - `Left`: Aligns the annotation to the left of its anchor/target.
     *
     * @default 'Center'
     */
    hAlign?: HorizontalAlignment;

    /**
     * Defines whether position values are axis-based ('Point') or pixel-based ('Pixel').
     *
     * @default 'Point'
     */
    coordinateUnit?: AnnotationCoordinateUnit;

    /**
     * Vertical alignment relative to the Y-position.
     * Available options :
     * - `Top`: Aligns the annotation above its anchor/target.
     * - `Center`: Vertically centers the annotation on its anchor/target.
     * - `Bottom`: Aligns the annotation below its anchor/target.
     *
     * @default 'Center'
     */
    vAlign?: VerticalAlignment;

    /**
     * Name of the X-axis to bind when coordinateUnit is 'Point'.
     *
     * @default null
     */
    xAxisName?: string | null;

    /**
     * Name of the Y-axis to bind when coordinateUnit is 'Point'.
     *
     * @default null
     */
    yAxisName?: string | null;

    /**
     * Enhances accessibility for annotation elements to ensure compatibility with assistive technologies, such as screen readers and keyboard navigation.
     *
     * @default { ariaLabel: '', role: 'img', focusable: false, tabIndex: 0 }
     */
    accessibility?: ChartAccessibilityProps;
}

/**
 * Configuration options for customizing error bars in chart series.
 */
export interface ChartErrorBarProps {

    /**
     * Specifies whether error bars should be displayed for the data.
     * When set to true, error bars will be rendered to represent data variability or uncertainty.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Specifies the type of error bar to render on the chart.
     * Determines how the error values are calculated and displayed.
     * The available options are:
     * * `Percentage` - Renders an error bar based on percentage.
     * * `StandardDeviation`- Renders an error bar using standard deviation.
     * * `StandardError`- Renders an error bar using standard error.
     * * `Custom`- Renders a custom-defined error bar.
     *
     * @default 'Custom'
     */
    type?: ErrorBarType;

    /**
     * Specifies the stroke color of the error bar. Accepts hex, rgba, or any valid CSS color string.
     *
     * @default ''
     */
    color?: string;

    /**
     * Specifies the vertical error value associated with each data point. This value can be mapped from a specific field in the data source.
     *
     * @default 1
     */
    verticalError?: number | string;

    /**
     * Defines the width of the error bars in the chart series.
     * This value controls the thickness of the error bars, allowing customization of their appearance.
     *
     * @default 1
     */
    width?: number;

    /**
     * Specifies the horizontal error value associated with each data point. This value can be mapped from a specific field in the data source.
     *
     * @default 0
     */
    horizontalError?: number | string;

    /**
     * Allows customization of the appearance and behavior of the caps at the ends of error bars in a chart series.
     *
     * @default { width: 1, length: 10, color: "", opacity: 1 }
     */
    errorBarCap?: ChartErrorBarCapProps;

    /**
     * Defines the color for the error bar, which is mapped to the data source mapping name.
     *
     * @default ''
     */
    errorBarColorField?: string;
}

/**
 * Configuration options for customizing the caps at the ends of error bars in a chart series.
 */
export interface ChartErrorBarCapProps {
    /**
     * Specifies the width of the error bar cap in pixels.
     *
     * @default 1
     */
    width?: number;
    /**
     * Specifies the length of the caps on the error bars, measured in pixels.
     *
     * @default 10
     */
    length?: number;
    /**
     * Specifies the stroke color of the cap.
     * Accepts hex, rgba, or any valid CSS color string.
     *
     * @default ''
     */
    color?: string;
    /**
     * Specifies the opacity of the error bar caps.
     * Accepts a value between 0 (fully transparent) and 1 (fully opaque).
     *
     * @default 1
     */
    opacity?: number;
}

/**
 * Provides options to customize the rendering of individual points in a chart.
 *
 * @public
 */
export interface PointRenderProps {

    /**
     * The color applied to the point.
     *
     */
    color: string;

    /**
     * The zero-based index of the series in the chart.
     *
     */
    seriesIndex: number;

    /**
     * The value of the xField for the point.
     *
     */
    xValue: number | Date | string | null;

    /**
     * The value of the yField for the point.
     *
     */
    yValue: number | Date | string | null;
}

/**
 * Configuration options for rendering a trendline on a chart series.
 * Trendlines help visualize overall trends or direction in the underlying data, and can be
 * projected forward or backward to indicate potential movement.
 * Note: Trendlines are only computed when the parent series has `visible: true`.
 */
export interface ChartTrendlineProps {
    /**
     * Display name of the trendline shown in the chart legend.
     *
     * @default ''
     */
    name?: string;

    /**
     * Dash pattern for the trendline stroke, as comma-separated segment lengths.
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Controls the visibility of the trendline.
     * When set to `false`, the trendline will be hidden from the chart.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Specifies the type of trendline to be rendered.
     *
     * Available options:
     * - `Linear`: A straight line showing the general direction of data.
     * - `Exponential`: A curve fitting data with exponential growth or decay.
     * - `Polynomial`: A curve fitting data with a polynomial function.
     * - `Power`: A curve representing data with a power function.
     * - `Logarithmic`: A curve fitting data with a logarithmic scale.
     * - `MovingAverage`: Smoothens data using a moving average calculation.
     *
     * @default 'Linear'
     */
    type?: TrendlineTypes;

    /**
     * Defines the number of periods used to compute a moving average.
     *
     * @default 2
     */
    period?: number;

    /**
     * Specifies the polynomial order for the polynomial trendline.
     * Only applicable when `type` is set to `Polynomial`.
     *
     * @default 2
     */
    polynomialOrder?: number;

    /**
     * Defines the number of data periods to extend the trendline backward from the first data
     * point.
     *
     * @default 0
     */
    backwardForecast?: number;

    /**
     * Defines the number of periods by which the trendline should extend forward from the last
     * data point.
     *
     * @default 0
     */
    forwardForecast?: number;

    /**
     * Configures animation settings for the trendline, including duration and delay.
     *
     * @default { enable: true, duration: 1000, delay: 0 }
     */
    animation?: Animation;

    /**
     * Enables or disables tooltips for the trendline.
     * When enabled, hovering over the trendline displays a tooltip with relevant information.
     *
     * @default true
     */
    enableTooltip?: boolean;

    /**
     * Specifies the y-intercept value for the trendline.
     * This forces the trendline to pass through a specific point on the y-axis.
     *
     * @default null
     */
    intercept?: number;

    /**
     * Sets the stroke color of the trendline. Accepts any valid CSS color string.
     *
     * @default ''
     */
    stroke?: string;

    /**
     * Specifies the width of the trendline in pixels.
     *
     * @default 2
     */
    width?: number;

    /**
     * Opacity of the trendline stroke (0–1).
     *
     * @default 1
     */
    opacity?: number;

    /**
     * Defines the shape used to represent the trendline in the chart legend.
     *
     * - When set to `'SeriesType'` (default), the trendline uses a straight line marker in the
     *   legend (regardless of parent series type), styled with the trendline's stroke.
     * - Other values (Circle, Triangle, etc.) render the corresponding marker shape.
     *
     * @default 'SeriesType'
     */
    legendShape?: LegendShape;

    /**
     * Provides accessibility options for trendline elements to ensure compatibility
     * with assistive technologies.
     *
     * @default { ariaLabel: '', focusable: true, tabIndex: 0, role: '' }
     */
    accessibility?: ChartAccessibilityProps;
}

/**
 * Provides options for customizing the Pareto series line configuration in the chart.
 */
export interface ChartParetoOptionsProps {

    /**
     * Fill color of the Pareto line. Accepts CSS color strings (e.g., hex or rgba).
     * By default, a color based on the theme is used.
     *
     * @default null
     */
    fill?: string;

    /**
     * Thickness of the Pareto line (in pixels).
     *
     * @default 1
     */
    width?: number;

    /**
     * Dash pattern for the Pareto line stroke.
     *
     * @default '0'
     */
    dashArray?: string;

    /**
     * Specifies whether to display the axis associated with the Pareto line.
     *
     * @default true
     */
    showAxis?: boolean;
}

/**
 * Defines the configuration for rendering technical indicators that represent
 * market trends based on derived statistical calculations.
 *
 * Technical compute values from a source series and render them
 * either as overlays or in separate indicator panels for advanced analysis.
 */
export interface ChartIndicatorProps {

    /**
     * Specifies the type of technical indicator to be rendered.
     *
     * Supported indicator types include:
     * * `Sma` – Simple Moving Average
     * * `Ema` – Exponential Moving Average
     * * `Tma` – Triangular Moving Average
     * * `Atr` – Average True Range
     * * `AccumulationDistribution` – Accumulation / Distribution
     * * `Momentum` – Momentum Indicator
     * * `Rsi` – Relative Strength Index
     * * `Macd` – Moving Average Convergence Divergence
     * * `Stochastic` – Stochastic Oscillator
     * * `BollingerBands` – Bollinger Bands
     *
     * @default 'Sma'
     */
    type?: IndicatorsType;

    /**
     * Specifies the look back period used to calculate the indicator values.
     *
     * This property is applicable to indicators that rely on rolling window
     * calculations such as moving averages, RSI, ATR, and Momentum.
     *
     * @default 14
     */
    period?: number;

    /**
     * Defines the look back period used to calculate the %K value
     * in the Stochastic Oscillator.
     *
     * @default 14
     */
    kPeriod?: number;

    /**
     * Defines the smoothing period used to calculate the %D value
     * in the Stochastic Oscillator.
     *
     * @default 3
     */
    dPeriod?: number;

    /**
     * Specifies the over bought threshold value.
     *
     * This property is applicable to RSI and Stochastic indicators.
     *
     * @default 80
     */
    overBought?: number;

    /**
     * Specifies the over sold threshold value.
     *
     * This property is applicable to RSI and Stochastic indicators.
     *
     * @default 20
     */
    overSold?: number;

    /**
     * Defines the standard deviation multiplier used to calculate the upper and lower Bollinger Bands.
     *
     * @default 2
     */
    standardDeviation?: number;

    /**
     * Specifies the slow period used to calculate the MACD line.
     *
     * @default 12
     */
    slowPeriod?: number;

    /**
     * Specifies the fast period used to calculate the MACD line.
     *
     * @default 26
     */
    fastPeriod?: number;

    /**
     * Enables or disables the rendering of over bought and over sold
     * regions for applicable indicators.
     *
     * @default true
     */
    showZones?: boolean;

    /**
     * Configures the visual appearance of the MACD line.
     *
     * @default { color: '#ff9933', width: 2 }
     */
    macdLine?: ConnectorProps;

    /**
     * Specifies the rendering mode of the MACD indicator.
     *
     * @default 'Both'
     */
    macdType?: MacdType;

    /**
     * Specifies the fill color for positive histogram bars
     * in the MACD indicator.
     *
     * @default '#2ecd71'
     */
    macdPositiveColor?: string;

    /**
     * Specifies the fill color for negative histogram bars
     * in the MACD indicator.
     *
     * @default '#e74c3d'
     */
    macdNegativeColor?: string;

    /**
     * Specifies the fill color used for the Bollinger Bands range area.
     *
     * @default 'rgba(211,211,211,0.25)'
     */
    bandColor?: string;

    /**
     * Configures the appearance of the upper line
     * in band based technical indicators.
     *
     * @default { type: 'Line', color: '#000', width: 1, length: '', dashArray: '' }
     */
    upperLine?: ConnectorProps;

    /**
     * Configures the appearance of the lower line
     * in band based technical indicators.
     *
     * @default { type: 'Line', color: '#000', width: 1, length: '', dashArray: '' }
     */
    lowerLine?: ConnectorProps;

    /**
     * Configures the appearance of the central or signal line used in technical indicators.
     *
     * @default { type: 'Line', color: '#000', width: 1, length: '', dashArray: '' }
     */
    periodLine?: ConnectorProps;

    /**
     * Specifies accessibility settings for technical indicator elements.
     *
     * @default { ariaLabel: '', focusable: true, tabIndex: 0, role: '' }
     */
    accessibility?: ChartAccessibilityProps;

    /**
     * Specifies the name of the source series used for calculating the indicator values.
     *
     * @default ''
     */
    seriesName?: string;

    /**
     * Determines whether the indicator is visible.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Specifies the name of the horizontal axis associated with the indicator.
     *
     * This property requires the axis to be defined in the chart axes collection.
     *
     * @default null
     */
    xAxisName?: string | null;

    /**
     * Specifies the name of the vertical axis associated with the indicator.
     *
     * This property enables rendering the indicator in a separate
     * sub panel with an independent Y axis.
     *
     * @default null
     */
    yAxisName?: string | null;

    /**
     * Configures the animation settings for the indicator rendering.
     *
     * Animation is enabled by default and supports duration and delay.
     *
     * @default { enable: true, duration: 1000, delay: 0 }
     */
    animation?: Animation;

    /**
     * Specifies the stroke or fill color of the indicator.
     *
     * For technical indicators, this value represents the color of signal or trend lines.
     *
     * @default ''
     */
    fill?: string;

    /**
     * Specifies the stroke width of indicator lines.
     *
     * @default 1
     */
    width?: number;

    /**
     * Defines the dash pattern applied to indicator lines.
     *
     * @default ''
     */
    dashArray?: string;

    /**
     * Specifies the financial data field used to compare the current value
     * with previous values when calculating technical indicators.
     *
     * This property is applicable to indicators that require price-based
     * Comparisons such as RSI, MACD, ATR, and Stochastic.
     *
     * @default 'Close'
     */
    field?: FinancialDataField;
}

/**
 * Defines configuration options for applying Y-value–based color mapping.
 */
export interface ChartRangeColorProps {

    /**
     * Specifies the inclusive starting value of the color-mapped range.
     *
     * @default 0
     */
    start?: number;

    /**
     * Specifies the inclusive ending value of the color-mapped range.
     *
     * @default 0
     */
    end?: number;

    /**
     * Defines the fill color applied to points within the specified range.
     *
     * @default ''
     */
    fill?: string;

    /**
     * Specifies the text displayed for this range in the legend.
     *
     * @default ''
     */
    label?: string;
}


