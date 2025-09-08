import { JSX, ReactElement } from 'react';
import { ChartSeriesType, ChartMarkerShape, Theme, IntervalType, LegendShape, Orientation, TitlePosition, StripLineSizeUnit, ZIndex } from '../base/enum';
import { ChartBorderProps, ChartAreaProps, ChartComponentProps, ChartStackLabelsProps, ChartFontProps, ZoomEndEvent, MajorGridLines, MajorTickLines, ChartMarkerProps, MinorGridLines, MinorTickLines, TitleSettings, ChartTooltipProps, ChartSeriesProps, ChartZoomSettingsProps, ChartAxisProps, ChartStripLineProps, ChartTitleProps, ChartLegendProps, Column, Row, ChartDataLabelProps, ChartLocationProps, CornerRadius } from '../base/interfaces';
import { BaseLegend } from '../base/Legend-base';
import { Animation } from '../common/base';
import { DataLabelRendererResults } from '../renderer/SeriesRenderer/DataLabelRender';
import { IThemeStyle } from '../utils/theme';
import { ChartAxisLabelProps, ChartAxisTitleProps } from '../chart-axis/base';
import AreaSeriesRenderer from '../renderer/SeriesRenderer/AreaSeriesRenderer';
import StackingColumnSeriesRenderer from '../renderer/SeriesRenderer/StackingColumnSeriesRenderer';
import StackingBarSeriesRenderer from '../renderer/SeriesRenderer/StackingBarSeriesRenderer';
import ScatterSeriesRenderer from '../renderer/SeriesRenderer/ScatterSeriesRenderer';
import BubbleSeriesRenderer from '../renderer/SeriesRenderer/BubbleSeriesRenderer';
import SplineAreaSeriesRenderer from '../renderer/SeriesRenderer/SplineAreaSeriesRenderer';
import BarSeries from '../renderer/SeriesRenderer/BarSeriesRenderer';
import SplineSeriesRenderer from '../renderer/SeriesRenderer/SplineSeriesRenderer';
import StepLineSeriesRenderer from '../renderer/SeriesRenderer/StepLineSeriesRenderer';
import ColumnSeries from '../renderer/SeriesRenderer/ColumnSeriesRenderer';
import LineSeriesRenderer from '../renderer/SeriesRenderer/lineSeriesRenderer';
import { useData } from '../common/data';
import { StackValuesType } from '../utils/helper';
import { TooltipRefHandle } from '@syncfusion/react-svg-tooltip';
import { VerticalAlignment, HorizontalAlignment } from '@syncfusion/react-base';

/**
 * Represents a two-dimensional size with width and height.
 *
 */
export interface ChartSizeProps {
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
 * Represents an RGB color value.
 *
 * @private
 */
export interface ColorValue {
    /**
     * Red component value (0-255)
     */
    r: number,

    /**
     * Green component value (0-255)
     */
    g: number,

    /**
     * Blue component value (0-255)
     */
    b: number
}

/**
 * Represents the result of a data management operation.
 *
 * @private
 */
export interface DataManagerResult {
    /**
     * The resulting data object
     */
    result: Object;

    /**
     * The count of items in the result
     */
    count: number;
}

/**
 * Represents a rectangle defined by its position and dimensions.
 *
 * @private
 */
export type Rect = {
    /**
     * The x-coordinate of the rectangle's top-left corner.
     */
    x: number;

    /**
     * The y-coordinate of the rectangle's top-left corner.
     */
    y: number;

    /**
     * The height of the rectangle.
     */
    height: number;

    /**
     * The width of the rectangle.
     */
    width: number;
}

/**
 * Defines the margin settings around the chart area.
 *
 * @private
 */
export interface MarginModel {

    /**
     * The left margin of the chart, specified in pixels.
     *
     * @default 10
     */
    left: number;

    /**
     * The right margin of the chart, specified in pixels.
     *
     * @default 10
     */
    right: number;

    /**
     * The top margin of the chart, specified in pixels.
     *
     * @default 10
     */
    top: number;

    /**
     * The bottom margin of the chart, specified in pixels.
     *
     * @default 10
     */
    bottom: number;
}

/**
 * Represents the main configuration for the chart.
 *
 * @private
 */
export interface Chart {
    /**
     * The initial clipping rectangle for the chart
     */
    initialClipRect: Rect;

    /**
     * Collection of rectangles for data labels
     */
    dataLabelCollections: Rect[];

    /**
     * Internationalization object for the chart
     */
    intl: Object;

    /**
     * Animation settings for the chart
     */
    animated: Animation;

    /**
     * Determines whether tooltip tracking is disabled
     */
    disableTrackTooltip: boolean;

    /**
     * Indicates whether chart movement has started
     */
    startMove: boolean;

    /**
     * Indicates whether redraw operations should be delayed
     */
    delayRedraw: boolean;

    /**
     * Indicates whether the chart is being used on a touch device
     */
    isTouch: boolean;

    /**
     * Indicates whether a double tap has occurred
     */
    isDoubleTap: boolean;

    /**
     * Indicates whether panning has started
     */
    startPanning: boolean;

    /**
     * Indicates whether UI operations have been performed
     */
    performedUI: boolean;

    /**
     * Rectangle used for zooming operations
     */
    zoomingRect: Rect;

    /**
     * Indicates whether the chart is currently zoomed
     */
    isZoomed: boolean;

    /**
     * Indicates whether the chart is currently being zoomed via mouse wheel or pinch gesture
     */
    isGestureZooming: boolean;

    /**
     * Y-coordinate of mouse down event
     */
    mouseDownY: number;

    /**
     * X-coordinate of mouse down event
     */
    mouseDownX: number;

    /**
     * Indicates whether chart dragging is in progress
     */
    isChartDrag: boolean;

    /**
     * Indicates whether points have been removed
     */
    pointsRemoved: boolean;

    /**
     * Settings for zoom functionality
     */
    zoomSettings: ChartZoomSettingsProps;

    /**
     * Threshold value for various operations
     */
    threshold: number;

    /**
     * Previously recorded mouse move X-coordinate
     */
    previousMouseMoveX: number;

    /**
     * Previously recorded mouse move Y-coordinate
     */
    previousMouseMoveY: number;

    /**
     * Collections of rotated data label locations
     */
    rotatedDataLabelCollections: ChartLocationProps[][] | null;

    /**
     * A React state dispatcher to update the series rendering options.
     */
    setSeriesOptions?: React.Dispatch<React.SetStateAction<RenderOptions[][]>>;

    /**
     * Contains the visual representation options for each series in the chart.
     */
    seriesOptions?: RenderOptions[];

    /**
     * Contains the configuration for data point markers across different series.
     */
    markerOptions?: ChartMarkerProps[];

    /**
     * Contains formatting and positioning options for data labels displayed with series points.
     */
    dataLabelOptions?: DataLabelRendererResult[];

    /**
     * Contains rendering details for labels displaying cumulative values at the top of stacked series.
     */
    stackLabelsOptions: DataLabelRendererResults[];

    /**
     * Count of the mouse click
     */
    clickCount: number;

    /**
     * Reference to the chart instance used for zoom-based redraw operations.
     */
    zoomRedraw: boolean;

    /**
     * Animation duration for chart transitions, in milliseconds.
     */
    duration: number;

    /** Height of the chart. */
    height: number;

    /** Width of the chart. */
    width: number;

    /** The HTML element in which the chart is rendered. */
    element: HTMLElement;

    /** Margin around the chart. */
    margin: { top: number; right: number; bottom: number; left: number };

    /** Border settings for the chart. */
    border: { color: string; width: number; dashArray: string };

    /** Rectangle bounds of the chart area. */
    rect: { x: number; y: number; width: number; height: number };

    /** Background color of the chart. */
    background: string;

    /** Background image of the chart. */
    backgroundImage: string;

    /** Available size for rendering the chart. */
    availableSize: { height: number; width: number };

    /** Clipping rectangle for the chart area. */
    clipRect: Rect;

    /** Enables right-to-left rendering. */
    enableRtl: boolean;

    /** Locale used in the chart. */
    locale: string;

    /** Theme applied to the chart. */
    theme: Theme;

    /** Style settings based on the theme. */
    themeStyle: IThemeStyle;

    /** Indicates if the chart is transposed. */
    iSTransPosed: boolean;

    /** Indicates if an inverted axis is required. */
    requireInvertedAxis: boolean;

    /** Collection of all series in the chart. */
    series: ChartSeriesProps[];

    /** Enables series animation. */
    animateSeries: boolean;

    /** Indicates if RTL rendering is enabled. */
    isRtlEnabled: boolean;

    /** Indicates if the chart is redrawn. */
    redraw: boolean;

    /** Series that are currently visible. */
    visibleSeries: SeriesProperties[];

    /** Row configurations in the chart. */
    rows: RowProps[];

    /** Column configurations in the chart. */
    columns: ColumnProps[];

    /** Collection of horizontal axes. */
    horizontalAxes: AxisModel[];

    /** Collection of vertical axes. */
    verticalAxes: AxisModel[];

    /** All axes used in the chart. */
    axisCollection: AxisModel[];

    /** Enables or disables animation. */
    enableAnimation?: boolean;

    /** Rectangle for the chart area. */
    chartAreaRect: Rect;

    /** Title settings for the chart. */
    titleSettings: TitleOptions;

    /** Subtitle settings for the chart. */
    subTitleSettings: TitleOptions;

    /** Layout values for axis calculations. */
    chartAxislayout: ChartAxisLayout;

    /** Configuration for the chart area. */
    chartArea: ChartAreaProps;

    /** Options for rendering pane lines. */
    paneLineOptions: PathOptions[];

    /**
     * The `selectionMode` property determines how data points or series can be highlighted or selected.
     */
    selectionMode: SelectionMode;

    /** Mouse X value of the chart. */
    mouseX: number;

    /** Mouse Y value of the chart. */
    mouseY: number;

    /**
     * Configuration options for the secondary axis in the chart.
     */
    axes: AxisModel[];

    /**
     * Properties and configuration options passed to the chart component.
     * These include data, appearance settings, and behavior customizations.
     */
    chartProps: ChartComponentProps;

    /**
     * This property controls whether columns for different series appear next to each other in a column chart.
     *
     */
    enableSideBySidePlacement?: boolean;

    /**
     * Configuration options for stack labels in the chart.
     * Stack labels display the total value for stacked series, including customization options.
     * for appearance and positioning, and other visual elements to enhance chart readability.
     * This property allows users to modify how stack labels are rendered in a stacked chart.
     */
    stackLabels?: ChartStackLabelsProps;

    /**
     * Index of the currently selected legend item.
     */
    currentLegendIndex: number;

    /**
     * ID of the previously interacted chart element.
     */
    previousTargetId: string;

    /**
     * Index of the currently selected series in the chart.
     */
    currentSeriesIndex: number;

    /**
     * Index of the currently selected data point in the chart.
     */
    currentPointIndex: number;

    /**
     * Indicates whether a legend item was clicked.
     */
    isLegendClicked: boolean;

    /**
     * Target width or dimension to which the chart should resize.
     */
    resizeTo: number;

    /**
     * Triggers a re-measurement and re-rendering of the chart
     */
    triggerRemeasure?: () => void;

    /**
     * Reference to the tooltip component for managing tooltip functionality.
     */
    tooltipRef: React.RefObject<TooltipRefHandle | null>;

    /**
     * Reference to the tooltip component for managing tooltip functionality.
     */
    trackballRef: React.RefObject<SVGGElement | null>

    /**
     * Module that handles tooltip creation and management.
     */
    tooltipModule: ChartTooltipProps;

    /**
     * Configuration options for the stripline behind in the chart.
     */
    striplineBehind: StriplineOptions[];

    /**
     * Configuration options for the stripline over in the chart.
     */
    striplineOver: StriplineOptions[];

    /**
     * Triggers the rendering of chart axes.
     */
    axisRender: (isLegendClicked?: boolean) => void;

    /**
     * Defines a set of colors used for rendering chart series.
     * Each color in the array is applied sequentially to the series.
     *
     * @default []
     */
    palettes?: string[];
}


/**
 * Represents the layout measurements and clipping rectangles for chart axes and series.
 *
 * @private
 */
export interface ChartAxisLayout {
    /**
     * The initial clipping rectangle that defines the drawable chart area before axis adjustments.
     */
    initialClipRect: Rect;

    /**
     * The size occupied by the left axis area (in pixels).
     */
    leftSize: number;

    /**
     * The size occupied by the right axis area (in pixels).
     */
    rightSize: number;

    /**
     * The size occupied by the top axis area (in pixels).
     */
    topSize: number;

    /**
     * The size occupied by the bottom axis area (in pixels).
     */
    bottomSize: number;

    /**
     * The clipping rectangle applied to the series area, adjusted for axes layout.
     */
    seriesClipRect: Rect;
}

/**
 * Represents the layout state of the chart, including elements like title, subtitle, legend, and visible series.
 *
 * @private
 */
export interface LayoutState {
    /**
     * The root DOM element where the chart is rendered.
     */
    element: Element;

    /**
     * Indicates whether the chart series should be animated during rendering.
     */
    animateSeries: boolean;

    /**
     * The chart instance containing configuration and state.
     */
    chart?: Chart;

    /**
     * Configuration for the chart's main title, including text, style, size, and rendering options.
     */
    chartTitle?: {
        /**
         * The text content of the chart title.
         */
        title: string;

        /**
         * The style settings applied to the chart title.
         */
        titleStyle: TitleSettings;

        /**
         * The size of the chart title element.
         */
        titleSize: ChartSizeProps;

        /**
         * Additional rendering options for the chart title.
         */
        titleOptions: TitleOptions;
    };

    /**
     * Configuration for the chart's subtitle, including text, style, and size.
     */
    chartSubTitle?: {
        /**
         * The text content of the chart subtitle.
         */
        title: string;

        /**
         * The style settings applied to the chart subtitle.
         */
        titleStyle: TitleSettings;

        /**
         * The size of the chart subtitle element.
         */
        titleSize: ChartSizeProps;
    };

    /**
     * The legend configuration and rendering logic for the chart.
     */
    ChartLegend?: BaseLegend;

    /**
     * The list of series that are currently visible in the chart.
     */
    visibleSeries?: SeriesProperties[];
}

/**
 * Represents the base configuration for zoom functionality.
 *
 * @private
 * @extends ZoomSettings
 */
export interface BaseZoom extends ChartZoomSettingsProps {
    /**
     * The rectangle area where zooming is performed.
     */
    zoomingRect?: Rect;

    /**
     * Indicates whether the chart is currently zoomed.
     */
    isZoomed?: boolean;

    /**
     * Indicates whether panning is in progress.
     */
    isPanning?: boolean;

    /**
     * Indicates whether UI operations have been performed.
     */
    performedUI?: boolean;

    /**
     * Indicates whether panning has started.
     */
    startPanning?: boolean;

    /**
     * Array of zoom axis ranges.
     */
    zoomAxes?: IZoomAxisRange[];

    /**
     * List of touch points at the start of interaction.
     */
    touchStartList?: ITouches[] | TouchList;

    /**
     * Collection of zoom complete event arguments.
     */
    zoomCompleteEvtCollection: ZoomEndEvent[];

    /**
     * List of touch points during movement.
     */
    touchMoveList?: ITouches[] | TouchList;

    /**
     * Element that is the target of pinch actions.
     */
    pinchTarget?: Element;

    /**
     * Rectangle defining the offset for zoom operations.
     */
    offset?: Rect;
}

/**
 * Represents touch interaction data.
 *
 * @private
 */
export interface ITouches {
    /**
     * X coordinate of the touch point relative to the page.
     */
    pageX?: number;

    /**
     * Y coordinate of the touch point relative to the page.
     */
    pageY?: number;

    /**
     * Unique identifier for the touch point.
     */
    pointerId?: number;
}

/**
 * Represents the range values for zoom axis.
 *
 * @private
 */
export interface IZoomAxisRange {
    /**
     * Actual minimum value of the axis.
     */
    actualMin?: number;

    /**
     * Actual delta value of the axis.
     */
    actualDelta?: number;

    /**
     * Minimum value of the axis.
     */
    min?: number;

    /**
     * Delta value of the axis.
     */
    delta?: number;
}

/**
 * Represents a numerical range with additional computed properties.
 *
 * @private
 */
export interface DoubleRangeType {
    /**
     * The starting value of the range.
     */
    start: number;

    /**
     * The ending value of the range.
     */
    end: number;

    /**
     * The difference between the end and start values.
     */
    delta: number;

    /**
     * The midpoint value of the range.
     */
    median: number;
}

/**
 * Represents a label that is visible on an axis, including its text, style, size, and position.
 *
 * @private
 */
export interface VisibleLabel {
    /**
     * The displayed text of the label. It can be a single string or multiple lines as an array of strings.
     */
    text: string | string[];

    /**
     * The numeric value associated with the label on the axis.
     */
    value: number;

    /**
     * The font styling applied to the label text.
     */
    labelStyle: ChartFontProps;

    /**
     * The rendered size (width and height) of the label text.
     */
    size: ChartSizeProps;

    /**
     * The size of the label when it is broken into multiple lines (wrapped).
     */
    breakLabelSize: ChartSizeProps;

    /**
     * The index position of the label in the labels collection.
     */
    index: number;

    /**
     * The original, unmodified text of the label before any formatting or truncation.
     */
    originalText: string;
}


/**
 * Extends the base Axis interface with additional properties for internal calculations,
 * rendering, and configuration specific to chart axes.
 *
 * @private
 */
export interface AxisModel extends ChartAxisProps {
    /**
     * The orientation of the axis (e.g., 'Horizontal' or 'Vertical').
     */
    orientation?: Orientation;

    /**
     * The collection of series associated with this axis.
     */
    series: SeriesProperties[];

    /**
     * The array of label strings displayed on the axis.
     */
    labels: string[];

    /**
     * Object representing index labels (optional).
     */
    indexLabels?: {};

    /**
     * Specifies whether Right-To-Left (RTL) layout is enabled for this axis.
     */
    isRTLEnabled?: boolean;

    /**
     * Specifies whether the axis is positioned on the opposed side of the chart.
     */
    isAxisOpposedPosition: boolean;

    /**
     * Indicates whether the axis direction is inverted.
     */
    isAxisInverse: boolean;

    /**
     * Internal flag indicating the visibility of the axis.
     */
    internalVisibility: boolean;

    /**
     * Optional React element module related to the axis (used in React implementations).
     */
    baseModule?: ReactElement;

    /**
     * Numerical range information including start, end, delta, and median values.
     */
    doubleRange: DoubleRangeType;

    /**
     * The actual visible range of the axis, including min, max, interval, and delta.
     */
    actualRange: VisibleRangeProps;

    /**
     * Array of interval divisions used for axis calculations.
     */
    intervalDivs: number[];

    /**
     * The currently visible range on the axis.
     */
    visibleRange: VisibleRangeProps;

    /**
     * Collection of visible labels on the axis.
     */
    visibleLabels: VisibleLabel[];

    /**
     * A function to format axis label values.
     */
    format: Function;

    /**
     * The first label on the axis.
     */
    startLabel: string;

    /**
     * The last label on the axis.
     */
    endLabel: string;

    /**
     * The maximum rendered size of the axis labels.
     */
    maxLabelSize: ChartSizeProps;

    /**
     * The rectangular area representing the axis layout.
     */
    rect: Rect;

    /**
     * The updated rectangular area after layout adjustments.
     */
    updatedRect: Rect;

    /**
     * Configuration options for the axis line rendering.
     */
    axisLineOptions: PathOptions;

    /**
     * Configuration options for axis labels as SVG text elements.
     */
    axislabelOptions: TextOption[];

    /**
     * Major grid line settings.
     */
    majorGridLines: MajorGridLines;

    /**
     * Minor grid line settings.
     */
    minorGridLines: MinorGridLines;

    /**
     * Minor tick line settings.
     */
    minorTickLines: MinorTickLines;

    /**
     * Major tick line settings.
     */
    majorTickLines: MajorTickLines;

    /**
     * Collection of path options for rendering major grid lines.
     */
    axisMajorGridLineOptions: PathOptions[];

    /**
     * Collection of path options for rendering minor grid lines.
     */
    axisMinorGridLineOptions: PathOptions[];

    /**
     * Collection of path options for rendering major tick lines.
     */
    axisMajorTickLineOptions: PathOptions[];

    /**
     * Collection of path options for rendering minor tick lines.
     */
    axisMinorTickLineOptions: PathOptions[];

    /**
     * Collection of text options for axis titles.
     */
    axisTitleOptions: TextOption[];

    /**
     * The padding interval applied to the axis.
     */
    paddingInterval: number;

    /**
     * The maximum length of points on the axis.
     */
    maxPointLength: number;

    /**
     * Indicates whether the axis is used in a 100% stacked chart.
     */
    isStack100: boolean;

    /**
     * Collection of title strings for the axis.
     */
    titleCollection: string[];

    /**
     * The rendered size of the axis title.
     */
    titleSize: ChartSizeProps;

    /**
     * Specifies the type of interval for the axis (e.g., years, months, days).
     */
    actualIntervalType: IntervalType;

    /**
     * Indicates if the interval is intended to be in decimal format.
     */
    isIntervalInDecimal: boolean;

    /**
     * Defines the interval value for the datetime axis.
     */
    dateTimeInterval: number;

    /**
     * Collection of path options for axis label borders.
     */
    axisLabelBorderOptions: PathOptions[];

    /**
     * The rotation angle applied to axis labels.
     */
    angle: number;

    /**
     * The rotated label text.
     */
    rotatedLabel: string;

    /**
     * Reference to the parent chart instance.
     */
    chart: Chart;

    /**
     * Options for customizing the appearance of the axis title, including font family, size, style, weight, and color.
     */
    titleStyle: ChartAxisTitleProps;

    /**
     * This property allows defining various font settings to control how the labels are displayed on the axis.
     */
    labelStyle: ChartAxisLabelProps;

    /**
     * The JSX element representing the label of the axis
     */
    labelElement: JSX.Element;

    /**
     * The JSX element representing the major tick lines on the axis.
     */
    majorTickLineElement: JSX.Element;

    /**
     * The JSX element representing the minor tick lines on the axis
     */
    minorTickLineElement: JSX.Element;

    /**
     * The JSX element representing the border or outline of the axis.
     */
    borderElement: JSX.Element;

    /**
     * Specifies the collection of strip lines for the axis, which are visual elements used to mark or highlight specific ranges.
     */
    stripLines?: ChartStripLineProps[];
}

/**
 * Defines the properties for the StripLine component, used to wrap and render StripLine elements.
 *
 * @private
 */
export interface StripLineProps {
    /**
     * Specifies the child elements (StripLine components) to be rendered inside the StripLine container.
     */
    children?: React.ReactNode;
}

/**
 * Interface for a class StriplineOptions.
 *
 * @private
 */
export interface StriplineOptions {

    /**
     * Toggles the visibility of the strip line.
     */
    visible?: boolean;

    /**
     * Defines the starting and ending range of the strip line on the axis.
     */
    range?: StripLineRangeProps;

    /**
     * Configures the visual appearance and styling of the strip line.
     */
    style?: StripLineStyleProps;

    /**
     * Customizes the text displayed within the strip line.
     */
    text?: StripLineTextProps;

    /**
     * Configures repeating strip lines to render across a regular interval.
     */
    repeat?: StripLineRepeatProps;

    /**
     * Defines a segmented strip line in the axis.
     */
    segment?: StripLineSegmentProps;

    /**
     * The rectangular area for the stripline.
     */
    rect?: Rect;

    /**
     * The stripline settings model.
     */
    stripLine?: ChartStripLineProps;

    /**
     * Unique identifier for the stripline element.
     */
    id?: string;

    /**
     * The axis associated with the stripline.
     */
    axis?: AxisModel;

    /**
     * The index of the axis in the collection.
     */
    axisIndex?: number;

    /**
     * Reference to the chart instance.
     */
    chart?: Chart;

    /**
     * The position of the stripline.
     */
    position?: ZIndex;

}

/**
 * Defines the axis range for a strip line.
 */
export interface StripLineRangeProps {

    /**
     * Specifies the starting value of the strip line on the axis.
     */
    start?: Object | number | Date;

    /**
     * Specifies the ending value of the strip line on the axis.
     */
    end?: Object | number | Date;

    /**
     * Determines the width or height of the strip line, calculated from the `start` value.
     */
    size?: number;

    /**
     * Specifies how the `size` property is interpreted (e.g., as pixels or axis units).
     */
    sizeType?: StripLineSizeUnit;

    /**
     * Determines whether the strip line should originate from the axis origin (zero).
     */
    shouldStartFromAxis?: boolean;
}

/**
 * Configures the visual styling of the strip line.
 */
export interface StripLineStyleProps {

    /**
     * Sets the background color of the strip line.
     */
    color?: string;

    /**
     * Sets the opacity of the strip line, ranging from 0 (transparent) to 1 (opaque).
     */
    opacity?: number;

    /**
     * Defines a dash pattern for the strip line's border (e.g., "10,5").
     */
    dashArray?: string;

    /**
     * Specifies a URL for a background image to be displayed within the strip line.
     */
    imageUrl?: string;

    /**
     * Configures the border properties of the strip line, such as color and width.
     */
    border?: ChartBorderProps;

    /**
     * Controls the rendering order of the strip line relative to the chart series.
     * Use 'Behind' to draw it behind the series or 'Over' to draw it in front.
     */
    zIndex?: ZIndex;
}

/**
 * Configures the text displayed inside a strip line.
 */
export interface StripLineTextProps {

    /**
     * Specifies the text content to be displayed within the strip line.
     */
    content?: string;

    /**
     * Defines the font and color styling for the strip line text.
     */
    style?: ChartFontProps;

    /**
     * Sets the rotation angle of the text in degrees.
     */
    rotation?: number;

    /**
     * Controls the horizontal alignment of the text.
     */
    hAlign?: HorizontalAlignment;

    /**
     * Controls the vertical alignment of the text.
     */
    vAlign?: VerticalAlignment;
}

/**
 * Configures the properties for creating repeating strip lines.
 */
export interface StripLineRepeatProps {

    /**
     * Enables or disables the repeating strip line feature.
     */
    isEnabled?: boolean;

    /**
     * Defines the interval at which the strip line should repeat.
     */
    every?: Object | number | Date;

    /**
     * Specifies the maximum axis value at which the repetitions should stop.
     */
    until?: Object | number | Date;
}

/**
 * Configures a segmented strip line that is rendered only within the specified range
 */
export interface StripLineSegmentProps {

    /**
     * Enables or disables the segmented strip line feature.
     */
    isEnabled?: boolean;

    /**
     * Specifies the name of the axis that will define the visible range of the strip line.
     */
    axisName?: string;

    /**
     * Defines the starting value for the segment on the axis specified by `axisName`.
     */
    start?: Object | number | Date;

    /**
     * Defines the ending value for the segment on the axis specified by `axisName`.
     */
    end?: Object | number | Date;
}

/**
 * Represents a row in the chart layout containing axis information and computed size metrics.
 *
 * @private
 */
export interface RowProps {
    /**
     * The collection of axis models associated with this row.
     */
    axes: AxisModel[];

    /**
     * Sizes of elements positioned far from the chart center in this row.
     */
    farSizes: number[];

    /**
     * Sizes of elements positioned near the chart center in this row.
     */
    nearSizes: number[];

    /**
     * Sizes of elements positioned inside far side of the chart in this row.
     */
    insideFarSizes: number[];

    /**
     * Sizes of elements positioned inside near side of the chart in this row.
     */
    insideNearSizes: number[];

    /**
     * The computed height of the row in pixels.
     */
    computedHeight: number;

    /**
     * The computed top offset position of the row relative to the chart container.
     */
    computedTop: number;

    /**
     * The height of the row as a string accepts input both as '100px' and '100%'.
     * If specified as '100%', the row renders to the full height of its chart.
     *
     * @default '100%'
     */
    height: string;

    /**
     * Options to customize the border of the rows.
     */
    border: ChartBorderProps;
}

/**
 * Represents a column in the chart layout containing axis information and computed size metrics.
 *
 * @private
 */
export interface ColumnProps {
    /**
     * The collection of axis models associated with this column.
     */
    axes: AxisModel[];

    /**
     * Sizes of elements positioned far from the chart center in this column.
     */
    farSizes: number[];

    /**
     * Sizes of elements positioned near the chart center in this column.
     */
    nearSizes: number[];

    /**
     * Sizes of elements positioned inside far side of the chart in this column.
     */
    insideFarSizes: number[];

    /**
     * Sizes of elements positioned inside near side of the chart in this column.
     */
    insideNearSizes: number[];

    /**
     * The computed width of the column in pixels.
     */
    computedWidth: number;

    /**
     * The computed left offset position of the column relative to the chart container.
     */
    computedLeft: number;

    /**
     * The height of the row as a string accepts input both as '100px' and '100%'.
     * If specified as '100%', the row renders to the full height of its chart.
     *
     * @default '100%'
     */
    width: string;

    /**
     * Options to customize the border of the rows.
     */
    border: ChartBorderProps;
}

/**
 * Defines the thickness or margin values for all four sides of an element.
 *
 * @private
 */
export interface Thickness {
    /**
     * The thickness or margin on the left side, in pixels.
     */
    left: number;

    /**
     * The thickness or margin on the right side, in pixels.
     */
    right: number;

    /**
     * The thickness or margin on the top side, in pixels.
     */
    top: number;

    /**
     * The thickness or margin on the bottom side, in pixels.
     */
    bottom: number;
}


/**
 * Defines the properties used to render a path or line element in SVG, typically for gridlines or custom paths in charts.
 *
 * @private
 */
export interface PathOptions {
    /**
     * Specifies the dash pattern for the path, used to create dashed lines.
     */
    dashArray?: string | number | undefined;

    /**
     * The unique identifier for the SVG path element.
     */
    id?: string;

    /**
     * The SVG path data (`d` attribute) that defines the shape of the path.
     */
    d?: string;

    /**
     * The stroke color of the path.
     */
    stroke?: string;

    /**
     * The width of the stroke used to draw the path, in pixels.
     */
    strokeWidth: number;

    /**
     * Specifies the pattern of dashes and gaps used to stroke the path.
     */
    strokeDasharray?: string;

    /**
     * The fill color of the path.
     */
    fill?: string;

    /**
     * The starting X coordinate for line-based paths.
     */
    x1?: number;

    /**
     * The ending X coordinate for line-based paths.
     */
    x2?: number;

    /**
     * The starting Y coordinate for line-based paths.
     */
    y1?: number;

    /**
     * The ending Y coordinate for line-based paths.
     */
    y2?: number;

    /**
     * The opacity for line-based paths.
     */
    opacity?: number;

    /**
     * The X coordinate of the center for elliptical or circular paths.
     */
    cx?: number;

    /**
     * The Y coordinate of the center for elliptical or circular paths.
     */
    cy?: number;

    /**
     * The radius on X-axis for elliptical paths.
     */
    rx?: number;

    /**
     * The radius on Y-axis for elliptical paths.
     */
    ry?: number;
}


/**
 * Defines the properties used to render a text element in SVG, typically for axis labels, titles, or data labels in charts.
 *
 * @private
 */
export interface TextOption {
    /**
     * Unique identifier for the text element.
     */
    id?: string;

    /**
     * Specifies the text anchor alignment. Common values include 'start', 'middle', and 'end'.
     */
    anchor?: string;

    /**
     * The text content to be rendered. Can be a string or an array of strings (for multi-line text).
     */
    text: string | string[];

    /**
     * The transform attribute used to apply SVG transformations like rotation or translation.
     */
    transform?: string;

    /**
     * The X-coordinate for the text position.
     */
    x: number;

    /**
     * The Y-coordinate for the text position.
     */
    y: number;

    /**
     * The rotation angle of the text label in degrees.
     */
    labelRotation?: number;

    /**
     * Specifies the font family to be used for the text.
     */
    fontFamily?: string;

    /**
     * Specifies the weight (thickness) of the font.
     */
    fontWeight?: string;

    /**
     * Specifies the font size (e.g., '12px', '1em').
     */
    fontSize?: string;

    /**
     * Specifies the font style (e.g., 'normal', 'italic').
     */
    fontStyle?: string;

    /**
     * The opacity level of the text, ranging from 0 (transparent) to 1 (opaque).
     */
    opacity?: number;

    /**
     * The fill color of the text.
     */
    fill?: string;

    /**
     * Specifies the baseline alignment for the text (e.g., 'alphabetic', 'middle', 'hanging').
     */
    baseLine?: string;

    /**
     * The length of the interval associated with this text label (used in axis rendering).
     */
    intervalLength?: number;

    /**
     * The width allocated for X position placement, often used in alignment calculations.
     */
    XPositionWidth?: number;

    /**
     * Indicates whether the text is part of a broken axis label.
     */
    isAxisBreakLabel?: boolean;
}

/**
 * Represents the base configuration for Series.
 *
 * @private
 *
 * @extends Series
 */
export interface SeriesProperties extends ChartSeriesProps {
    isPointRemoved: boolean;
    /**
     * Indicates whether a data point gets updated in the series.
     *
     * @default false
     */
    pointUpdated: boolean;
    /**
     * Indicates whether a new data point has been added to the series.
     *
     * @default false
     */
    isPointAdded: boolean;

    /**
     * Controls whether marker animations should be skipped.
     *
     * @default false
     */
    skipMarkerAnimation: boolean;

    /**
     * Tolerance value for Y-axis calculations to handle minor variations in position.
     */
    yTolerance: number;

    /**
     * Tolerance value for X-axis calculations to handle minor variations in position.
     */
    xTolerance: number;

    /**
     * Indicates whether the series properties have changed and require re-rendering.
     * Used internally to optimize performance by avoiding unnecessary redraws.
     */
    propsChange: boolean;

    /**
     * Reference to the chart component properties passed from parent component.
     * Contains configuration options that affect series rendering and behavior.
     */
    chartProps: ChartComponentProps;

    /**
     * Indicates whether this series' legend item has been clicked by the user.
     * Used to track legend interaction state for visibility toggling.
     */
    isLegendClicked: boolean;

    /**
     * Specifies the visual representation type for this series.
     */
    drawType: ChartSeriesType;

    /**
     * Indicates whether data fetch has been requested for this series.
     */
    dataFetchRequested?: boolean;

    /**
     * Specifies the position index of the series in the chart.
     */
    position?: number;

    /**
     * Indicates the number of rectangles used to render the series.
     * Relevant for column, bar, and other rectangle-based series types.
     */
    rectCount?: number;

    /**
     * Determines whether this series is rendered using rectangles.
     * Used to apply specific rendering optimizations for rectangle-based series.
     */
    isRectSeries: boolean;

    /**
     * Contains the calculated stacked values for this series.
     * Used in stacked charts to determine the proper positioning of each data point.
     */
    stackedValues: StackValuesType;

    /**
     * Maximum size value for series points.
     * Used to normalize point sizes in bubble and scatter charts.
     */
    sizeMax: number;

    /**
     * Stores the previous Y-coordinate value during animations or updates.
     * Used to calculate transitions between different data states.
     */
    previousY: number;

    /**
     * Stores the previous X-coordinate value during animations or updates.
     * Used to calculate transitions between different data states.
     */
    previousX: number;

    /**
     * URL path to the image used in legend for this series.
     */
    legendImageUrl: string;

    /**
     * Defines the visual category of this series (e.g., 'Line', 'Column', 'Area').
     */
    seriesType: string;

    /**
     * Stores the index of a data point that has been removed from the series.
     * Used for tracking animations and preserving continuity during data updates.
     */
    removedPointIndex: number;

    /**
     * Reference to the horizontal axis associated with this series.
     */
    xAxis: AxisModel;

    /**
     * Reference to the vertical axis associated with this series.
     * Controls how y-values are mapped to screen coordinates.
     */
    yAxis: AxisModel;

    /**
     * Defines the rectangular region where the series should be rendered.
     */
    clipRect?: Rect;

    /**
     * Contains the data processing logic and state for this series.
     * Handles data fetching, transformation and preparation for rendering.
     */
    dataModule?: ReturnType<typeof useData> | null;

    /**
     * Contains the currently rendered subset of data in the viewable chart area.
     * Helps optimize performance by only processing visible data points.
     */
    currentViewData: Object | null;

    /**
     * Collection of all data points in this series with their calculated positions.
     */
    points: Points[];

    /**
     * Grouping identifier for the series when using multiple series types.
     */
    category?: string;

    /**
     * The position of this series in the chart's series collection.
     */
    index: number;

    /**
     * Primary color used for filling the series visualization elements..
     */
    interior: string;

    /**
     * Optional secondary fill color used for gradient or specialized rendering effects.
     */
    fill?: string | null;

    /**
     * The smallest y-value present in the series data.
     */
    yMin: number;

    /**
     * The smallest x-value present in the series data.
     */
    xMin: number;

    /**
     * The largest x-value present in the series data.
     */
    xMax: number;

    /**
     * Array containing all x-coordinate values in the series.
     */
    xData: number[];

    /**
     * Array containing all y-coordinate values in the series.
     * Allows for direct access to y-values for calculations and rendering.
     */
    yData: number[];

    /**
     * The largest y-value present in the series data.
     * Used for axis scaling and determining the visible range.
     */
    yMax: number;

    /**
     * Reference to the parent chart instance containing this series.
     */
    chart: Chart;

    /**
     * Visibility of series in chart.
     */
    visible: boolean;

    /**
     * DOM/SVG element representing the data point markers for this series.
     */
    symbolElement?: Element | null;

    /**
     * Collection of data points that are currently in the visible chart area.
     */
    visiblePoints?: Points[];

    /**
     * Total number of data records in the series.
     */
    recordsCount: number;

    /**
     * Defines the visual shape displayed in the chart legend for this series.
     */
    legendShape?: LegendShape;

    /**
     * Collection of control points used for drawing curves in line-based series.
     */
    drawPoints?: ControlPoints[];

    /**
     * The primary SVG element container for this series visualization.
     * Acts as the parent element for all visual components of the series.
     */
    seriesElement: Element;

    /**
     * The SVG path element that defines the actual shape of the series.
     * Contains the path data for lines, areas, or other series visualizations.
     */
    pathElement: Element;

    /**
     * Controls the rendering order of this series relative to other series.
     * Higher values cause the series to be rendered on top of series with lower values.
     */
    zOrder?: number;

    /**
     * Array of data values that are currently selected or active.
     */
    currentData: Array<number | string>;

    /**
     * Indicates the progress of the marker animation.
     */
    markerAnimationProgress?: number;

    /**
     * Defines the clip path used for marker rendering.
     */
    markerClipPath?: string;
}

/**
 * Represents a collection of marker options for chart data points with array-like functionality.
 * Used to manage and iterate through multiple marker configurations in chart series.
 *
 * @private
 */
export interface MarkerOptionsList {
    /**
     * Array of marker options for rendering data point markers
     */
    [index: number]: MarkerOptions;
    /**
     * Length of the marker options array
     */
    length: number;
    /**
     * Map function for iterating through marker options
     */
    map: (callback: (option: MarkerOptions, index: number) => JSX.Element) => JSX.Element[];

}

/**
 * Defines properties for a rectangular marker or clipping area used in chart visualizations.
 * Controls both the dimensions and visual styling of rectangular elements in markers.
 *
 * @private
 */
export interface MarkerOptionsRect {
    /**
     * X-coordinate of the marker clipping rectangle
     */
    x?: number;
    /**
     * Y-coordinate of the marker clipping rectangle
     */
    y?: number;
    /**
     * Width of the marker clipping rectangle
     */
    width?: number;
    /**
     * Height of the marker clipping rectangle
     */
    height?: number;
    /**
     * Fill color of the rectangle
     */
    fill?: string;
    /**
     * Stroke color for the rectangle border
     */
    stroke?: string;
    /**
     * Stroke width for the rectangle border
     */
    strokeWidth?: number;
    /**
     * Opacity of the rectangle
     */
    opacity?: number;
    /**
     * Radius for x-axis rounded corners
     */
    rx?: number;
    /**
     * Radius for y-axis rounded corners
     */
    ry?: number;
    /**
     * SVG transform attribute value
     */
    transform?: string;
    /**
     * Unique ID for the rectangle element
     */
    id?: string;
}

/**
 * Represents a group of marker symbols within an SVG element.
 * Used for organizing and applying shared transformations to collections of related markers.
 *
 * @private
 */
export interface MarkerSymbolGroup {
    /**
     * Unique ID for the symbol group
     */
    id: string;
    /**
     * SVG transform attribute value for positioning the group
     */
    transform: string;
    /**
     * SVG clip-path reference
     */
    'clip-path'?: string;
}

/**
 * Represents options for configuring data point markers in charts.
 * Controls the visual appearance, position, shape, and animation of markers that highlight points on series.
 *
 * @private
 */
export interface MarkerOptions {
    /**
     * Unique identifier for the marker
     */
    id: string;

    /**
     * Fill color of the marker
     */
    fill: string;

    /**
     * Border properties of the marker
     */
    border: ChartBorderProps;

    /**
     * Opacity of the marker (0-1)
     */
    opacity: number;

    /**
     * Pattern of dashes for the marker outline
     */
    dashArray?: string;

    /**
     * SVG transform attribute value
     */
    transform?: string;

    /**
     * Allows for additional custom properties
     */
    [key: string]: unknown;

    /**
     * Shape of the marker
     */
    shape?: ChartMarkerShape;

    /**
     * X coordinate of the marker center
     */
    cx?: number;

    /**
     * Y coordinate of the marker center
     */
    cy?: number;

    /**
     * Previous X coordinate for animation
     */
    previousCx?: number;

    /**
     * Previous Y coordinate for animation
     */
    previousCy?: number;
}


/**
 * Represents an HTML element along with its available size dimensions.
 *
 * @private
 */
export interface ElementWithSize {
    /**
     * The HTML element reference.
     */
    element: HTMLElement;

    /**
     * The available size of the element, including width and height.
     */
    availableSize: ChartSizeProps;
}

/**
 * Interface representing the two control points used for Bezier curve calculations in the chart.
 *
 * @private
 */
export interface ControlPoints {
    /**
     * The first control point location for the curve.
     */
    controlPoint1: ChartLocationProps;

    /**
     * The second control point location for the curve.
     */
    controlPoint2: ChartLocationProps;
}


/**
 * Interface representing the collection of series modules used in the chart.
 *
 * @private
 */
export interface SeriesModules {
    /**
     * The module representing the line series type.
     */
    lineSeriesModule: typeof LineSeriesRenderer;

    /**
     * The module representing the column series type.
     */
    columnSeriesModule: typeof ColumnSeries;

    /**
     * The module representing the bar series type.
     */
    barSeriesModule: typeof BarSeries;

    /**
     * The module representing the spline series type.
     */
    splineSeriesModule: typeof SplineSeriesRenderer;

    /**
     * The module representing the area series type.
     */
    stepLineSeriesModule: typeof StepLineSeriesRenderer;

    /**
     * The module representing the area series type.
     */
    areaSeriesModule: typeof AreaSeriesRenderer;

    /**
     * The module representing the stacking column series type.
     */
    stackingColumnSeriesModule: typeof StackingColumnSeriesRenderer;

    /**
     * The module representing the stacking bar series type.
     */
    stackingBarSeriesModule: typeof StackingBarSeriesRenderer;

    /**
     * The module represents the scatter series type.
     */
    scatterSeriesModule: typeof ScatterSeriesRenderer

    /**
     * The module represents the bubble series type.
     */
    bubbleSeriesModule: typeof BubbleSeriesRenderer;

    /**
     * The module representing the spline area series type.
     */
    splineAreaSeriesModule: typeof SplineAreaSeriesRenderer;
}

/**
 * Represents the options used to render an SVG path element.
 *
 * @private
 */
export interface RenderOptions {
    /**
     * Unique identifier for the SVG element.
     */
    id: string;

    /**
     * Fill color of the SVG element.
     */
    fill: string;

    /**
     * Width of the stroke applied to the SVG element.
     *
     * @default undefined
     */
    strokeWidth: number | undefined;

    /**
     * Stroke color of the SVG element.
     *
     * @default undefined
     */
    stroke: string | undefined;

    /**
     * Opacity level of the SVG element, where 1 is fully opaque and 0 is fully transparent.
     *
     * @default undefined
     */
    opacity: number | undefined;

    /**
     * Stroke dash pattern for the SVG element, defined as a string of comma-separated values (e.g., "5,3").
     *
     * @default undefined
     */
    dashArray: string | undefined;

    /**
     * The path data string that defines the shape to be rendered.
     */
    d: string;
}



/**
 * Interface representing the configuration for a clipping rectangle in the chart.
 *
 * @private
 */
export interface ClipRectModel {
    /**
     * Specifies the stroke width of the clipping rectangle's border.
     *
     * @default undefined
     */
    strokeWidth?: string | number | undefined;

    /**
     * Specifies the stroke color of the clipping rectangle.
     *
     * @default undefined
     */
    stroke?: string | undefined;

    /**
     * Defines the unique identifier for the clipping rectangle element.
     */
    id: string;

    /**
     * Specifies the fill color of the clipping rectangle.
     */
    fill: string;

    /**
     * Defines the border settings for the clipping rectangle, including width and color.
     */
    border: {
        /**
         * Width of the rectangle border.
         */
        width: number;
        /**
         * Color of the rectangle border.
         */
        color: string;
    };

    /**
     * Specifies the opacity of the clipping rectangle.
     */
    opacity: number;

    /**
     * Defines the rectangular region's position and dimensions.
     */
    rect: {
        /**
         * X-coordinate of the rectangle.
         */
        x: number;
        /**
         * Y-coordinate of the rectangle.
         */
        y: number;
        /**
         * Width of the rectangle.
         */
        width: number | undefined;
        /**
         * Height of the rectangle.
         */
        height: number | undefined;
    };

    /**
     * Specifies the width of the clipping rectangle.
     */
    width: number;

    /**
     * Specifies the height of the clipping rectangle.
     */
    height: number;
}

/**
 * Interface representing the properties of a series SVG element in the chart.
 *
 * @private
 */
export interface SeriesElementModel {
    /**
     * Specifies the unique identifier of the SVG element.
     */
    id: string;

    /**
     * Defines the transform attribute used to apply translation, rotation, or scaling to the SVG element.
     */
    transform: string;

    /**
     * Specifies the clipping path applied to the SVG element to restrict the rendering region.
     */
    clipPath: string;

    /**
     * Defines the CSS style string applied to the SVG element.
     */
    style: string;

    /**
     * Specifies the ARIA role attribute, indicating the purpose of the SVG element.
     */
    role: string;

    /**
     * Sets the tab index for the element to manage keyboard navigation order.
     */
    tabindex: string;

    /**
     * Defines the ARIA label attribute, providing a textual description for screen readers.
     */
    'aria-label': string;
}

/**
 * Represents a location where a tooltip should be positioned in the chart.
 * May contain null values when position is being calculated or reset.
 *
 * @private
 */
export interface TooltipLocation {
    /**
     * The x-coordinate of the location.
     */
    x: number | null;

    /**
     * The y-coordinate of the location.
     */
    y: number | null;
}

/**
 * Represents the precise position where a data label should be placed in the chart.
 * Used for positioning textual information about data points.
 *
 * @private
 */
export interface LabelLocation {
    /**
     * The x-coordinate of the location.
     */
    x: number;

    /**
     * The y-coordinate of the location.
     */
    y: number;
}


/**
 * Defines the configuration options for rendering chart data labels as SVG elements.
 * Controls styling, positioning, and formatting of the textual representations of data values.
 *
 * @private
 */
export interface dataLabelRenderOptions {
    /**
     * Unique identifier for the data label SVG element.
     */
    id: string;

    /**
     * The x-coordinate position of the data label.
     */
    x: number;

    /**
     * The y-coordinate position of the data label.
     */
    y: number;

    /**
     * The background fill color of the data label.
     */
    fill: string;

    /**
     * The font size of the data label text (e.g., '12px', '0.8em').
     */
    'font-size': string;

    /**
     * The font style of the data label text (e.g., 'normal', 'italic').
     */
    'font-style': string;

    /**
     * The font family used for the data label text (e.g., 'Arial', 'Verdana').
     */
    'font-family': string;

    /**
     * The font weight of the data label text (e.g., 'normal', 'bold').
     */
    'font-weight': string;

    /**
     * The text anchor alignment for the data label (e.g., 'start', 'middle', 'end').
     */
    'text-anchor': string;

    /**
     * Optional rotation angle for the data label in degrees.
     */
    labelRotation?: number;

    /**
     * Optional SVG transform string to apply additional transformations to the data label.
     */
    transform?: string;

    /**
     * Optional opacity level for the data label, from 0 (transparent) to 1 (opaque).
     */
    opacity?: number;

    /**
     * Optional dominant baseline alignment for the text (e.g., 'auto', 'middle', 'hanging').
     */
    'dominant-baseline'?: string;

    /**
     * The width of the stroke for the data label's background shape or border.
     */
    strokeWidth: number;

    /**
     * The color of the stroke for the data label's background shape or border.
     */
    stroke: string;

    /**
     * The dash pattern for the data label's background shape or border (e.g., '3,3' for dashed lines).
     */
    dashArray: string;

    /**
     * The path data attribute defining the shape of the data label's background container.
     */
    d: string;
}


/**
 * Represents the result of a text element rendering operation, containing both
 * the path rendering options and positioning information.
 * Used for managing text elements with background shapes or containers in charts.
 *
 * @private
 */
export interface TextElementResult {
    /**
     * The rendering options for the background shape or container of the text element.
     */
    renderOptions: RenderOptions;

    /**
     * The actual text content to be displayed.
     */
    text: string;

    /**
     * The x-coordinate transformation or offset to be applied to the text element.
     */
    transX: number;

    /**
     * The y-coordinate transformation or offset to be applied to the text element.
     */
    transY: number;
}


/**
 * Interface representing the style settings for text elements in the chart.
 * Provides a consistent way to define appearance properties for all textual elements like labels and titles.
 *
 * @private
 */
export interface TextStyleModel {
    /**
     * The color of the text (e.g., '#000000' or 'red').
     */
    color: string;

    /**
     * The font size of the text (e.g., '12px', '1em').
     */
    fontSize: string;

    /**
     * The font style of the text (e.g., 'normal', 'italic', 'oblique').
     */
    fontStyle: string;

    /**
     * The font family of the text (e.g., 'Arial', 'Verdana').
     */
    fontFamily: string;

    /**
     * The weight of the font (e.g., 'normal', 'bold', 'lighter', or numeric values).
     */
    fontWeight: string;
}

/**
 * Options for positioning and styling the container of a data label.
 * Controls the rectangular area in which a data label is rendered and its visual appearance.
 *
 * @private
 */
export interface dataLabelOptions {
    /**
     * The x-coordinate of the label.
     */
    x: number;

    /**
     * The y-coordinate of the label.
     */
    y: number;

    /**
     * Optional SVG transform string to apply transformations like rotate, scale, etc.
     */
    transform?: string;

    /**
     * Optional width of the label.
     */
    width?: number;

    /**
     * Optional height of the label.
     */
    height?: number;

    /**
     * Optional x-axis radius for rounded corners.
     */
    rx?: number;

    /**
     * Optional y-axis radius for rounded corners.
     */
    ry?: number;
}

/**
 * Options for defining a marker's position and shape in chart visualizations.
 * Used to configure the visual representation of data points on series.
 *
 * @private
 */
export interface markerOptions {
    /**
     * The x-coordinate (center) of the marker.
     */
    cx: number;

    /**
     * The y-coordinate (center) of the marker.
     */
    cy: number;

    /**
     * Optional SVG path data string to define a custom shape.
     */
    d?: string;

    /**
     * Optional predefined shape name (e.g., 'circle', 'square', 'triangle').
     */
    pathShape?: string;
}

/**
 * Represents data for an axis during zoom operations in interactive charts.
 * Stores zoom state, factors, and visible range information for axis manipulation.
 *
 */
export interface AxisDataProps {
    /**
     * The zoom factor applied to the axis.
     * A value between 0 and 1 indicating the scale level of the zoom.
     */
    zoomFactor: number;

    /**
     * The zoom position of the axis.
     * Represents the starting position of the zoomed view as a normalized value.
     */
    zoomPosition: number;

    /**
     * The visible range of the axis after zooming.
     * Includes minimum, maximum, interval, and delta values.
     */
    axisRange: VisibleRangeProps;

    /**
     * The name of the axis being zoomed.
     */
    axisName: string;
}

/**
 * Represents configuration options for a chart title's position, style, and layout.
 *
 * @private
 */
export interface TitleOptions {
    /**
     * The x-coordinate position of the title.
     */
    x: number;

    /**
     * The y-coordinate position of the title.
     */
    y: number;

    /**
     * The rotation applied to the title text (e.g., '0', '45', '90').
     */
    rotation: string;

    /**
     * The SVG text-anchor alignment for the title (e.g., 'start', 'middle', 'end').
     */
    textAnchor: string;

    /**
     * The text style settings applied to the title.
     */
    textStyle: TextStyleModel;

    /**
     * The lines of text that make up the title.
     */
    title: string[];

    /**
     * The rectangle defining the border area around the title.
     */
    titleBorder: Rect;

    /**
     * The position of the title relative to the chart (e.g., 'Top', 'Bottom', 'Left', 'Right').
     */
    position: TitlePosition;

    /**
     * The width of the title border.
     */
    borderWidth: number;

    /**
     * The size of the rendered title.
     */
    titleSize: ChartSizeProps;
}

/**
 * Represents the visible range configuration of a chart axis.
 *
 */
export interface VisibleRangeProps {
    /**
     * The minimum value visible on the axis.
     */
    minimum: number;

    /**
     * The maximum value visible on the axis.
     */
    maximum: number;

    /**
     * The interval between axis ticks or labels.
     */
    interval: number;

    /**
     * The difference between the maximum and minimum values.
     * Typically used for scaling and layout calculations.
     */
    delta: number;
}

/**
 * Represents the rendering result for a data label in a chart series.
 * Contains properties for both the background shape and text content.
 *
 * @private
 */
export interface DataLabelRendererResult {
    /**
     * Optional configuration for the background shape of the data label.
     * When provided, a shape will be rendered behind the text.
     */
    shapeRect?: {
        /** Unique identifier for the shape element */
        id: string;
        /** Background fill color of the shape */
        fill: string;
        /** Border configuration for the shape */
        border: {
            /** Optional width of the border in pixels */
            width?: number;
            /** Optional color of the border */
            color?: string
        };
        /** Opacity value for the shape (0-1) */
        opacity: number;
        /** Position and dimension of the rectangle */
        rect: Rect;
        /** Horizontal corner radius for rounded rectangles */
        rx: number;
        /** Vertical corner radius for rounded rectangles */
        ry: number;
        /** SVG transform string for positioning the shape */
        transform: string;
        /** Optional stroke color for the outline */
        stroke?: string;
    };
    /**
     * Configuration for the text content of the data label.
     * This is always required as data labels must display text.
     */
    textOption: {
        /**
         * Text content to display in the data label.
         * Can be a single string or an array of strings for multi-line labels.
         */
        text: string | string[];
        /**
         * Rendering options for the text element
         */
        renderOptions: {
            /** Unique identifier for the text element */
            id: string;
            /** X-coordinate position of the text */
            x: number;
            /** Y-coordinate position of the text */
            y: number;
            /** Text color */
            fill: string;
            /** Font size with unit (e.g., '12px') */
            'font-size': string;
            /** Font family name */
            'font-family': string;
            /** Font weight (e.g., 'normal', 'bold') */
            'font-weight': string;
            /** Font style (e.g., 'normal', 'italic') */
            'font-style': string;
            /** Text anchor position (e.g., 'start', 'middle', 'end') */
            'text-anchor': string;
            /** SVG transform string for positioning the text */
            transform: string;
        };
    };
}

/**
 * Represents the type definition of bubble series module.
 *
 * @private
 */
export interface BubbleSeriesType {
    render: (series: SeriesProperties, isInverted: boolean) =>
    { options: RenderOptions[]; marker: ChartMarkerProps };
    doAnimation: Function;
}

/**
 * Represents the type definition of scatter series module.
 *
 * @private
 */
export interface ScatterSeriesType {
    render: (series: SeriesProperties, isInverted: boolean) =>
    { options: RenderOptions[]; marker: ChartMarkerProps };
    renderPoint: (
        point: Points,
        series: SeriesProperties,
        markerShape: ChartMarkerShape,
        scatterBorder: { width: number; color: string; dashArray: string },
        isInverted: boolean
    ) => MarkerOptions | null;
    doAnimation: Function;
}

/**
 * Represents the type definition and conatines the parameters required for step line series module.
 *
 * @private
 */
export interface StepLineSeriesType {
    previousX: number;
    previousY: number;
    render: (series: SeriesProperties, isInverted: boolean) =>
    RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: {
            previousPathLengthRef: React.RefObject<number[]>;
            isInitialRenderRef: React.RefObject<boolean[]>;
            renderedPathDRef: React.RefObject<string[]>;
            animationProgress: number;
            isFirstRenderRef: React.RefObject<boolean>;
            previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
        },
        enableAnimation: boolean,
        _currentSeries: SeriesProperties,
        _currentPoint: Points | undefined,
        _pointIndex: number,
        visibleSeries?: SeriesProperties[]
    ) => {
        strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string;
        animatedDirection?: string; animatedTransform?: string;
    };
}

/**
 * Represents the base configuration for DataLabel.
 *
 * @private
 *
 * @extends DataLabel
 */
export interface DataLabelProperties extends ChartDataLabelProps {
    /**
     * Indicates whether the data labels should be inverted.
     */
    inverted?: boolean;
    /**
     * A common identifier used for data label elements.
     *
     * @default undefined
     */
    commonId?: string;
    /**
     * Background color of the chart, used for positioning data labels.
     *
     * @default undefined
     */
    chartBackground?: string;
    /**
     * X-coordinate position of the data label.
     *
     * @default undefined
     */
    locationX?: number;
    /**
     * Reference to the parent chart instance.
     *
     * @default undefined
     */
    chart?: Chart;
    /**
     * Height of the marker associated with the data label.
     *
     * @default undefined
     */
    markerHeight?: number;
    /**
     * Width of the border around the data label.
     *
     * @default undefined
     */
    borderWidth?: number;
    /**
     * Indicates whether the data label is rendered as a shape.
     *
     * @default undefined
     */
    isShape?: boolean;
    /**
     * Background color of the font used in the data label.
     *
     * @default undefined
     */
    fontBackground?: string;

}
/**
 * Defines a single data point in a chart series.
 *
 * @private
 */
export interface DataPoint {
    /**
     * The x-value of the data point.
     * Can be a number (for a numeric axis) or a string (for a category or date axis).
     */
    x: number | string;
    /**
     * The y-value of the data point.
     * Represents the quantitative value plotted along the y-axis.
     */
    y: number;
}
/**
 * Interface representing the marker element data for animation.
 * Used when animating individual marker properties.
 *
 * @private
 */
export interface MarkerElementData {
    /** The x-radius for elliptical shapes */
    rx?: number;
    /** The y-radius for elliptical shapes */
    ry?: number;
    /** The radius for circular shapes */
    r?: number;
    /** The opacity of the marker element */
    opacity?: number;
    /** Additional data for tracking animation */
    _animationData?: {
        /** Original x position */
        originalX?: number;
        /** Original y position */
        originalY?: number;
        /** Target x position */
        targetX?: number;
        /** Target y position */
        targetY?: number;
    };
}
/**
 * Represents the position and appearance data for a chart marker.
 * Used to track marker positions across animations for smooth transitions.
 *
 * @private
 */
export type MarkerPosition = {
    /** X-coordinate of the marker center */
    cx: number;
    /** Y-coordinate of the marker center */
    cy: number;
    /** SVG path data for complex marker shapes */
    d?: string;
    /** The shape identifier of the marker */
    pathShape?: string;
};
/**
 * Represents the base configuration for Marker.
 *
 * @private
 *
 * @extends Marker
 */
export interface MarkerProperties extends ChartMarkerProps {
    /**
     * A collection of marker rendering options used for visualizing data points.
     * Each option includes styling properties such as shape, size, color, and border.
     */
    markerOptionsList?: MarkerOptionsList;
    /**
     * Contains configuration settings for marker rendering, including visibility,
     * animation effects, and interaction behavior.
     */
    options?: MarkerOptionsRect;
    /**
     * Represents the SVG group element that contains all marker symbols rendered for the series.
     * Useful for batch operations such as animation, visibility toggling, or event handling.
     */
    symbolGroup?: MarkerSymbolGroup;
}

/**
 * Represents a data point in a chart series with its properties and state information.
 *
 * @private
 */
export interface Points {
    /** The text representation of the point's value. */
    textValue: string;
    /** The original y-value before any transformations or calculations. */
    originalY: number;
    /** Specifies the x-value of the point. */
    x: Object;
    /** Specifies the y-value of the point. */
    y: Object;
    /** Indicates whether the point is visible. */
    visible: boolean;
    /** Specifies the text associated with the point. */
    text: string;
    /** Specifies the tooltip content for the point. */
    tooltip: string;
    /** Specifies the color of the point. */
    color: string;
    /** Specifies the locations of symbols associated with the point. */
    symbolLocations: ChartLocationProps[] | null;
    /** Specifies the x-value of the point. */
    xValue: number | null;
    /** Specifies the y-value of the point. */
    yValue: number | null;
    /** Specifies the index of the point in the series. */
    index: number;
    /** Specifies the regions associated with the point. */
    regions: Rect[] | null;
    /** Specifies the percentage value of the point. */
    percentage: number | null;
    /** Indicates whether the point is empty. */
    isEmpty: boolean;
    /** Specifies the region data of the point. */
    regionData: null;
    /** Specifies the minimum value of the point. */
    minimum: number;
    /** Specifies the maximum value of the point. */
    maximum: number;
    /** Specifies the interior color of the point. */
    interior: string;
    /** Specifies the series to which the point belongs. */
    series: Object;
    /**
     * Specifies whether the point is in the visible range.
     */
    isPointInRange: boolean;
    /**
     * Defines the marker settings for the data point.
     */
    marker: ChartMarkerProps;
    /** Specifies the size value of the point. */
    size: Object;
}

/**
 * Interface defining the core functionality for line series rendering in charts.
 * Provides methods for calculating line directions, rendering series, and handling animations.
 *
 * @private
 */
export interface LineSeriesInterface {
    /**
     * Determines the direction of a line segment between two points.
     *
     * @param firstPoint - The starting point coordinates and data
     * @param secondPoint - The ending point coordinates and data
     * @param series - The series properties containing style and behavior settings
     * @param isInverted - Whether the chart axes are inverted
     * @param getPointLocation - Function to retrieve point location coordinates
     * @param startPoint - The starting point identifier
     * @returns The direction string used for path construction
     */
    getLineDirection: (
        firstPoint: Points,
        secondPoint: Points,
        series: SeriesProperties,
        isInverted: boolean,
        getPointLocation: Function,
        startPoint: string
    ) => string;

    /**
     * Renders a line series with optional markers.
     *
     * @param series - The series properties containing data and styling information
     * @param isInverted - Whether the chart axes are inverted
     * @returns Either an array of render options or an object containing both options and marker properties
     */
    render: (series: SeriesProperties, isInverted: boolean) =>
    RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };

    /**
     * Handles animation for line series.
     *
     * @param pathOptions - The path rendering options and properties
     * @param index - The index of the series being animated
     * @param animationState - Animation state object containing refs and progress
     * @param enableAnimation - Flag indicating if animation is enabled
     * @param _currentSeries - The current series being processed (unused)
     * @param _currentPoint - The current point being processed (unused)
     * @param _pointIndex - The index of the current point (unused)
     * @param visibleSeries - Array of visible series for animation calculation
     * @returns Animation properties including dash patterns and transforms
     */
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: {
            previousPathLengthRef: React.RefObject<number[]>;
            isInitialRenderRef: React.RefObject<boolean[]>;
            renderedPathDRef: React.RefObject<string[]>;
            animationProgress: number;
            isFirstRenderRef: React.RefObject<boolean>;
            previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
        },
        enableAnimation: boolean,
        _currentSeries: SeriesProperties,
        _currentPoint: Points | undefined,
        _pointIndex: number,
        visibleSeries: SeriesProperties[]
    ) => {
        strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string;
        animatedDirection?: string; animatedTransform?: string;
    };
}

/**
 * Defines the animation state structure for area series rendering.
 * This interface encapsulates all the necessary state and references required to manage
 * smooth animations during area series transitions, including initial rendering and data updates.
 *
 * @private
 */
export interface AreaSeriesAnimateState {
    /**
     * Reference to an array storing the previous path lengths for each series.
     */
    previousPathLengthRef: React.RefObject<number[]>;
    /**
     * Reference to an array tracking which series are in their initial render state.
     */
    isInitialRenderRef: React.RefObject<boolean[]>;
    /**
     * Reference to a record storing the previously rendered path data strings.
     */
    renderedPathDRef: React.RefObject<Record<string, string>>;
    /**
     * The current animation progress as a value between 0 and 1.
     */
    animationProgress: number;
    /**
     * Reference tracking if this is the very first render of the entire chart.
     */
    isFirstRenderRef: React.RefObject<boolean>;
    /**
     * Reference to the previous series rendering options for all series.
     */
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
}
/**
 * Defines the contract for the Area Series Renderer module.
 *
 * @private
 */
export interface AreaSeriesRendererType {
    /**
     * Generates an SVG path command segment for a single data point in an area series.
     */
    getAreaPathDirection: Function;
    /**
     * Generates SVG path segments to handle empty (null/undefined) data points in area series.
     */
    getAreaEmptyDirection: Function;
    /**
     * Calculates and returns animation properties for area series paths.
     */
    doAnimation: Function;
    /**
     * The main rendering function that processes an entire area series and generates all required SVG paths.
     */
    render: Function;
}
/**
 * Defines the animation state structure for spline area series rendering.
 *
 * @private
 */
export interface SplineAreaSeriesAnimateState {
    /**
     * Reference to an array storing the previous path lengths for each series.
     */
    previousPathLengthRef: React.RefObject<number[]>;
    /**
     * Reference to boolean flags indicating whether each series is in its initial render state.
     */
    isInitialRenderRef: React.RefObject<boolean[]>;
    /**
     * Reference to a record storing the previously rendered SVG path data strings.
     */
    renderedPathDRef: React.RefObject<Record<string, string>>;
    /**
     * Current animation progress as a normalized value between 0 and 1.
     */
    animationProgress: number;
    /**
     * Reference to a boolean flag indicating if this is the very first render of the chart.
     */
    isFirstRenderRef: React.RefObject<boolean>;
    /**
     * Reference to the previous frame's series rendering options.
     */
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
}
/**
 * Defines the contract for the Spline Area Series Renderer module.
 *
 * @private
 */
export interface SplineAreaSeriesInterface {
    /**
     * Computes natural spline coefficients using the natural boundary conditions.
     */
    naturalSplineCoefficients: Function;
    /**
     * Generates control points for cubic Bezier curves between two consecutive data points.
     */
    getControlPoints: Function;
    /**
     * Manages animation effects for spline area series during rendering transitions.
     */
    doAnimation: Function;
    /**
     * Main rendering function that generates SVG path elements for spline area series.
     */
    render: Function;
}
/**
 * Represents parsed SVG path command data with coordinate values and control points.
 *
 * @private
 */
export interface CommandValues {
    /**
     * The SVG path command type identifier.
     */
    type: string;
    /**
     * The target x-coordinate for the path command.
     */
    x: number;
    /**
     * The target y-coordinate for the path command.
     */
    y: number;
    /**
     * The x-coordinate of the first control point for cubic Bezier curves.
     */
    cx1?: number;
    /**
     * The y-coordinate of the first control point for cubic Bezier curves.
     */
    cy1?: number;
    /**
     * The x-coordinate of the second control point for cubic Bezier curves.
     */
    cx2?: number;
    /**
     * The y-coordinate of the second control point for cubic Bezier curves.
     */
    cy2?: number;
}

/**
 * Represents a single path command used in vector graphics or chart rendering.
 * Each command includes a type (e.g., 'M' for move, 'L' for line, 'C' for curve)
 * and a list of coordinates relevant to that command.
 *
 * @private
 */
export type PathCommand = {

    /**
     * The type of path command, such as 'M' (move), 'L' (line), 'C' (cubic Bézier curve), etc.
     * This determines how the coordinates should be interpreted.
     */
    type: string;

    /**
     * An array of numerical values representing the coordinates for the path command.
     * The number and meaning of these values depend on the command type.
     */
    coords: number[];
};


/**
 * Defines the properties passed to child components within the chart provider context.
 * These properties include chart configuration, data, rendering flags, and update methods.
 *
 * @private
 */
export interface ChartProviderChildProps {
    /**
     * General properties for the chart component such as dimensions, theme, and rendering options.
     */
    chartProps: ChartComponentProps;

    /**
     * Configuration for the chart's main title including text, style, and alignment.
     */
    chartTitle: ChartTitleProps;

    /**
     * Configuration for the chart's subtitle including text, style, and alignment.
     */
    chartSubTitle: ChartTitleProps;

    /**
     * Defines the layout and background settings of the chart area.
     */
    chartArea: ChartAreaProps;

    /**
     * Configuration for the chart legend including position, visibility, and styling.
     */
    chartLegend: ChartLegendProps;

    /**
     * Indicates whether the chart should be rendered.
     */
    render: boolean;

    /**
     * Reference to the parent DOM element along with its size information.
     */
    parentElement: ElementWithSize;

    /**
     * Array of column definitions used for data binding in the chart.
     */
    columns: Column[];

    /**
     * Array of row data used for populating the chart.
     */
    rows: Row[];

    /**
     * Series configuration including type, data mapping, and styling.
     */
    chartSeries: ChartSeriesProps[];

    /**
     * Tooltip configuration for displaying data point information on hover.
     */
    chartTooltip: ChartTooltipProps;

    /**
     * Configuration for stack labels displayed on stacked chart series.
     */
    chartStackLabels: ChartStackLabelsProps;

    /**
     * Updates the stack labels configuration.
     */
    setChartStackLabels: (stackLabels: ChartStackLabelsProps) => void;

    /**
     * Updates the chart title configuration.
     */
    setChartTitle: (titleProps: ChartTitleProps) => void;

    /**
     * Updates the chart subtitle configuration.
     */
    setChartSubTitle: (subtitleProps: ChartTitleProps) => void;

    /**
     * Updates the chart area configuration.
     */
    setChartArea: (areaProps: ChartAreaProps) => void;

    /**
     * Updates the chart legend configuration.
     */
    setChartLegend: (legendProps: ChartLegendProps) => void;

    /**
     * Updates the chart columns.
     */
    setChartColumns: (columns: Column[]) => void;

    /**
     * Updates the chart rows.
     */
    setChartRows: (rows: Row[]) => void;

    /**
     * Updates the primary X-axis configuration.
     */
    setChartPrimaryXAxis: (xAxis: AxisModel) => void;

    /**
     * Updates the primary Y-axis configuration.
     */
    setChartPrimaryYAxis: (yAxis: AxisModel) => void;

    /**
     * Updates the chart series configuration.
     */
    setChartSeries: (series: ChartSeriesProps[]) => void;

    /**
     * Updates the collection of axes used in the chart.
     */
    setChartAxes: (axes: AxisModel[]) => void;

    /**
     * Configuration for zooming and panning behavior in the chart.
     */
    chartZoom: ChartZoomSettingsProps;

    /**
     * Updates the chart zoom settings.
     */
    setChartZoom: (zoom: ChartZoomSettingsProps) => void;

    /**
     * Collection of axis models used in the chart.
     */
    axisCollection: AxisModel[];

    /**
     * Updates the chart tooltip configuration.
     */
    setChartTooltip: (tooltip: ChartTooltipProps) => void;
}

/**
 * Represents the event arguments used during the rendering of a data point in the chart.
 *
 * @private
 */
export interface PointRenderingEvent {
    /**
     * The name of the series to which the point belongs
     */
    seriesName: string;

    /**
     * The data point being rendered.
     */
    point: Points;

    /**
     * The fill color applied to the point.
     */
    fill: string;

    /**
     * The border styling applied to the point.
     */
    border: ChartBorderProps;

    /**
     * The height of the marker representing the point, in pixels.
     */
    markerHeight?: number;

    /**
     * The width of the marker representing the point, in pixels
     */
    markerWidth?: number;

    /**
     * The shape used to render the point marker
     */
    markerShape?: ChartMarkerShape;

    /**
     * The corner radius configuration applied to the point marker.
     */
    cornerRadius?: CornerRadius;

    /**
     * Indicates whether the event should be canceled.
     * Set to `true` to prevent the default action.
     */
    cancel: boolean;
}

/**
 * Represents the event arguments triggered during the rendering of data labels in the chart.
 *
 * @private
 */
export interface DataLabelContentProps {
    /**
     * The name of the series to which the data label belongs.
     */
    seriesName: string
    /**
     * The data point associated with the label.
     */
    point: Points;
    /**
     * The text content of the label.
     */
    text: string;
    /**
     * The dimensions of the label text, including width and height.
     */
    textSize: ChartSizeProps;
    /**
     * The fill color applied to the label.
     */
    color: string;
    /**
     * The border styling applied to the label.
     */
    border: ChartBorderProps;
    /**
     * The font styling applied to the label text.
     */
    font: ChartFontProps;
    /**
     * Specifies whether the data label position can be adjusted.
     */
    location: LabelLocation;
}
