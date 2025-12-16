import { TitlePosition, LegendPosition } from '../../common';
import { TooltipRefHandle } from '@syncfusion/react-svg-tooltip';
import { useData } from '../renderer/series-renderer/ProcessData';
import { ThemeStyle } from '../utils/theme';
import { PieLabelPosition, PieLegendShape } from './enum';
import { PieChartFontProps, PieChartLocationProps, PieChartSizeProps, PieChartComponentProps, PieChartSeriesProps, PieChartLegendProps, PieChartBorderProps, PieChartTooltipFormatterProps } from './interfaces';
import { PieChartTooltipProps } from './interfaces';

/**
 * Circular chart configuration options.
 *
 * @private
 */
export interface Chart extends PieChartComponentProps {


    /** Indicates whether the chart has been updated; can be a boolean or an array of strings. */
    updated: boolean | string[];

    /** Collections of center labels. */
    centerLabelCollectionTransform: string;

    centerLabelRenderResults: CenterLabelRenderResultsProps[]

    textHoverRenderResults: CenterLabelRenderResultsProps[];

    /** Rectangle bounds of the chart area. */
    rect: { x: number; y: number; width: number; height: number };

    /** The HTML element in which the chart is rendered. */
    element: HTMLElement;

    /** Available size for rendering the chart. */
    availableSize: { height: number; width: number };

    /** Style settings based on the theme. */
    themeStyle: ThemeStyle;

    /** Clipping rectangle for the chart area. */
    clipRect: Rect;

    /** Margin around the chart. */
    margin: { top: number; right: number; bottom: number; left: number };

    /** Border settings for the chart. */
    border: { color: string; width: number; dashArray: string };

    /** Title settings for the chart. */
    titleSettings: TitleOptions;

    /** Enables right-to-left rendering. */
    enableRtl: boolean;

    /** Subtitle settings for the chart. */
    subTitleSettings: TitleOptions;

    /**
     * The list of series that are currently visible in the chart.
     */
    visibleSeries: SeriesProperties[];

    /**
     * Triggers a re-measurement and re-rendering of the chart.
     */
    triggerRemeasure?: () => void;

    /** Pie series configuration. */
    pieSeries: PieBase;

    /** Distance for exploding pie slices. */
    explodeDistance: number;

    /** Origin location of the chart. */
    origin: PieChartLocationProps;

    /** Configuration for the chart legend. */
    chartLegend: BaseLegend;

    /** Indicates whether the legend has been clicked. */
    isLegendClicked: boolean;

    /** Enables series animation. */
    animateSeries: boolean;

    /** Format string for the chart display. */
    format: string;

    /** Mouse X value of the chart. */
    mouseX: number;

    /** Mouse Y value of the chart. */
    mouseY: number;

    /**
     * Indicates whether the chart is being used on a touch device
     */
    isTouch: boolean;

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
     * Indicates whether a double tap has occurred
     */
    isDoubleTap: boolean;

    /**
     * Count of the mouse click
     */
    clickCount: number;

    /**
     * Properties and configuration options passed to the chart component.
     * These include data, appearance settings, and behavior customizations.
     */
    chartProps: PieChartComponentProps;

    /**
     * Module that handles tooltip creation and management.
     */
    tooltipModule: PieChartTooltipProps;

    /**
     * ID of the previously interacted chart element.
     */
    previousTargetId: string;

    /**
     * Reference to the tooltip component for managing tooltip functionality.
     */
    tooltipRef: React.RefObject<TooltipRefHandle | null>;

    /**
     * Reference to the tooltip component for managing tooltip functionality.
     */
    trackballRef: React.RefObject<SVGGElement | null>

    /**
     * Target width or dimension to which the chart should resize.
     */
    resizeTo: number;
}

/**
 * Options for center labels, including positioning and styling.
 *
 * @private
 */
export interface CenterLabelRenderResultsProps {
    /** Options for center labels, including positioning and styling. */
    centerLabelOptions: CenterLabelOptionsProps;
    /** List of wrapped labels for the chart. */
    wrappedLabels: string[];
}

/**
 * Options for center labels, including positioning and styling.
 *
 * @private
 */
export interface CenterLabelOptionsProps {
    /** Unique identifier for the label. */
    id: string;

    /** X-coordinate position of the label. */
    x: number;

    /** Y-coordinate position of the label. */
    y: number;

    /** Anchor point for text alignment (e.g., 'start', 'middle', 'end'). */
    anchor: string;

    /** Baseline for vertical text alignment (e.g., 'top', 'middle', 'bottom'). */
    baseLine: string;

    /** Text content of the label. */
    text: string;

    /** Transformation applied to the label (e.g., rotate, translate). */
    transform: string;

    /** Size options for the center label. */
    centerLabelSizeOptions: PieChartSizeProps;
}

/**
 * Represents the properties for a circular chart series, extending the base series configuration.
 *
 * @private
 */
export interface SeriesProperties extends PieChartSeriesProps {

    /**
     * The index of the series within the chart.
     *
     * @private
     */
    index: number;

    /**
     * Contains the data processing logic and state for this series.
     * Handles data fetching, transformation and preparation for rendering.
     */
    dataModule?: ReturnType<typeof useData> | null;

    /**
     * Collection of data points in the series.
     */
    points: Points[];

    /**
     * Contains the currently rendered subset of data in the viewable chart area.
     * Helps optimize performance by only processing visible data points.
     */
    currentViewData: Object | null;

    /**
     * Total number of data records in the series.
     */
    recordsCount: number;

    /**
     * Reference to the chart instance that owns this series.
     */
    chart: Chart;

    /**
     * Indicates whether data fetch has been requested for this series.
     */
    dataFetchRequested?: boolean;

    /**
     * Sum of all point values in the series.
     */
    sumOfPoints: number;

    /**
     * Sum of all clubbed point values in the series.
     */
    sumOfClub: number;

    /**
     * Collection of points that have been grouped or clubbed together.
     */
    clubbedPoints: Points[];

    /**
     * Stores the last applied `groupTo` value for grouping points.
     */
    lastGroupTo: string;

    /**
     * Defines the rendering options for each path element in the series.
     */
    elementOptions: PathElementOption[];

    /** Collection of points positioned on the right side of the chart. */
    rightSidePoints: Points[];

    /** Collection of points positioned on the left side of the chart. */
    leftSidePoints: Points[];

    /** Defines the rectangular area occupied by the chart. */
    areaRect: Rect;

    /** Defines the rectangular area occupied by the chart title. */
    titleRect: Rect;
}

/**
 * Defines and manages the data points within a series of a circular chart (Pie, Doughnut, etc.).
 *
 * @private
 */
export interface Points {

    /**
     * The x-value of the pie point.
     */
    x: Object;

    /**
     * The y-value of the pie point.
     */
    y: number;

    /**
     * Indicates whether the point is visible in the chart.
     */
    visible: boolean;

    /**
     * The text displayed for the point (e.g., label or annotation).
     */
    text: string;

    /**
     * The tooltip text associated with the point.
     */
    tooltip: string;

    /**
     * The radius of the slice for this point, expressed as a percentage or pixel value.
     */
    sliceRadius: string;

    /**
     * The original text value before any formatting or transformation.
     */
    originalText: string;

    /**
     * The label text displayed for the point.
     */
    label: string;

    /**
     * The color applied to the point.
     */
    color: string;

    /**
     * The percentage value of the point relative to the total sum of all points.
     */
    percentage: number;

    /**
     * The location of the symbol representing the point in the chart.
     */
    symbolLocation: PieChartLocationProps;

    /**
     * The index of the point within the series.
     */
    index: number;

    /**
     * The mid-angle of the slice, used for positioning labels and connectors.
     */
    midAngle: number;

    /**
     * The final mid-angle value of the slice after animation completes.
     */
    originalMidAngle: number;

    /**
     * The starting angle of the slice in degrees.
     */
    startAngle: number;

    /**
     * The ending angle of the slice in degrees.
     */
    endAngle: number;

    /**
     * The angle at which the label is positioned.
     */
    labelAngle: number;

    /**
     * The rectangular region occupied by the point.
     */
    region: Rect;

    /**
     * The rectangular region allocated for the point's label.
     */
    labelRegion: Rect;

    /**
     * Indicates whether the label for this point is visible.
     */
    labelVisible: boolean;

    /**
     * The ratio of the y-value relative to the total sum.
     */
    yRatio: number;

    /**
     * The ratio of the height used for rendering the point.
     */
    heightRatio: number;

    /**
     * Collection of regions associated with the point (e.g., for hit-testing).
     */
    regions: Rect[];

    /**
     * Indicates whether the point is exploded (moved outward from the center).
     */
    isExplode: boolean;

    /**
     * Indicates whether the point is grouped or clubbed with others.
     */
    isClubbed: boolean;

    /**
     * Indicates whether the point is sliced (separated visually).
     */
    isSliced: boolean;

    /**
     * The starting position of the slice in rendering calculations.
     */
    start: number;

    /**
     * The degree span of the slice.
     */
    degree: number;

    /**
     * The transformation applied to the point for rendering (e.g., SVG transform).
     */
    transform: string;

    /**
     * The y-coordinate separator value for label positioning.
     */
    separatorY: string;

    /**
     * Indicates whether the label has been adjusted to avoid overlap.
     */
    adjustedLabel: boolean;

    /**
     * The length of the connector line between the slice and its label.
     */
    connectorLength: number;

    /** Rendering options for the text element, including font and alignment details. */
    argsData: TextRenderOptions;

    /** Collection of all label texts associated with the current series or chart. */
    labelCollection: string[];

    /** The margin value applied around the label for spacing adjustments. */
    marginValue: number;

    /** Represents the size of the text element, including width and height. */
    textSize: PieChartSizeProps;

    /** Specifies the final position of the label after layout adjustments. */
    labelPosition: PieLabelPosition;

}

/**
 * Defines the base properties for rendering a Pie or Doughnut chart.
 *
 * @private
 */
export interface PieBase {

    /**
     * The starting angle of the pie chart in degrees.
     * Determines where the first slice begins.
     */
    startAngle: number;

    /**
     * The final start-angle value of the slice after animation completes
     */
    originalStartAngle: number;

    /**
     * The total angle covered by the pie chart in degrees.
     * For a full circle, this is typically 360.
     */
    totalAngle: number;

    /**
     * The inner radius of the pie chart.
     * Used to create a doughnut chart when greater than zero.
     */
    innerRadius: number;

    /**
     * The center coordinates of the pie base.
     */
    pieBaseCenter: PieChartLocationProps;

    /**
     * The radius of the pie base.
     */
    pieBaseRadius: number;

    /**
     * The radius used for positioning labels in the pie base.
     */
    pieBaseLabelRadius: number;

    /**
     * Indicates whether the radius is mapped from data values.
     */
    isRadiusMapped: boolean;

    /**
     * The radius of the series within the pie chart.
     */
    seriesRadius: number;

    /**
     * The size of the pie chart in pixels.
     */
    size: number;

    /**
     * The center coordinates of the actual pie chart.
     */
    pieCenter: PieChartLocationProps;

    /**
     * The radius of the actual pie chart.
     */
    pieRadius: number;

    /**
     * The radius used for positioning labels in the actual pie chart.
     */
    pieLabelRadius: number;

    /**
     * The computed radius for rendering the pie chart.
     */
    radius: number;

    /**
     * The computed radius for positioning labels.
     */
    labelRadius: number;

    /**
     * The center coordinates of the chart area.
     */
    center: PieChartLocationProps;
}

/**
 * Defines the configuration options for an SVG path element used in chart rendering.
 *
 * @private
 */
export interface PathElementOption {

    /**
     * Unique identifier for the path element.
     */
    id: string;

    /**
     * Specifies the width of the border stroke around the path.
     */
    borderWidth: number;

    /**
     * Specifies the color of the border stroke.
     */
    borderColor: string;

    /**
     * Sets the opacity level of the path element.
     * Accepts a value between 0 (fully transparent) and 1 (fully opaque).
     */
    opacity: number;

    /**
     * Defines the dash pattern for the stroke.
     * Example: "5,3" creates a dashed line with 5px dash and 3px gap.
     */
    dashArray: string;

    /**
     * The SVG path data string that defines the shape of the element.
     */
    d: string;

    /**
     * Specifies the fill color for the path element.
     */
    fill: string;

    /**
     * The transformation applied to the path element (e.g., translate, rotate).
     */
    transform: string;

    /**
     * Indicates the direction of the border rendering (e.g., inside or outside).
     */
    borderDirection: string;

    /**
     * Current point value that should pushed into options for aria-label.
     */
    point: Points;
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
    availableSize: PieChartSizeProps;
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
    titleSize: PieChartSizeProps;

    /**
     * The text style settings applied to the title.
     */
    textStyle: PieChartFontProps;
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
 * Interface for the base legend component that defines core functionality and properties.
 *
 * @interface BaseLegend
 * @extends PieChartLegendProps
 * @private
 */
export interface BaseLegend extends PieChartLegendProps {
    /** Reference to the parent chart instance for coordinating interactions and layout. */
    chart?: Chart;
    /** Comprehensive legend configuration properties inherited from the chart. */
    legend?: PieChartLegendProps;
    /** Maximum height allowed for an individual legend item in pixels. */
    maxItemHeight?: number;
    /** Collection of calculated row heights used for layout positioning. */
    rowHeights?: number[];
    /** Collection of calculated page heights when pagination is enabled for the legend. */
    pageHeights?: number[];
    /** Collection of calculated column heights for multi-column legend layouts. */
    columnHeights?: number[];
    /** Boolean flag indicating whether the legend content requires pagination due to space constraints. */
    isPaging?: boolean;
    /** Height of the SVG clipping path applied to limit the visible legend items. */
    clipPathHeight?: number;
    /** Total number of pages available when pagination is enabled. */
    totalPages?: number;
    /** Boolean flag indicating whether the legend has a vertical orientation layout. */
    isVertical?: boolean;
    /** Standard five-pixel measurement used for consistent spacing and alignment. */
    fivePixel?: number;
    /** Number of rows calculated for the current legend layout configuration. */
    rowCount?: number;
    /** The pixel dimensions of pagination navigation buttons. */
    pageButtonSize?: number;
    /** Maximum width constraint for the legend component in pixels. */
    maxWidth?: number;
    /** Unique identifier for the legend DOM element used for selection and events. */
    legendID?: string;
    /** SVG clipping rectangle definition for limiting visible content area. */
    clipRect?: RectOption;
    /** Reference to the SVG group element that contains the translatable legend content. */
    legendTranslateGroup?: Element;
    /** Currently active page number in a paginated legend, starting from 0. */
    currentPage?: number;
    /** Opacity value for the backward navigation arrow (0-1), controlled by page position. */
    backwardArrowOpacity?: number;
    /** Opacity value for the forward navigation arrow (0-1), controlled by page position. */
    forwardArrowOpacity?: number;
    /** Text description used for screen readers to improve accessibility. */
    accessbilityText?: string;
    /** Width of pagination arrow buttons in pixels. */
    arrowWidth?: number;
    /** Height of pagination arrow buttons in pixels. */
    arrowHeight?: number;
    /** Position of the legend relative to the chart's plotting area. */
    legendPosition?: LegendPosition;
    /** Number of rows in the chart's data structure, used for layout calculations. */
    chartRowCount?: number;
    /** Calculated bounding rectangle that defines the legend's position and dimensions. */
    legendBounds?: Rect;
    /** Collection of all legend items with their configuration and state information. */
    legendCollections?: LegendOptions[];
    /** Collection of title text strings for multiple legend sections. */
    legendTitleCollections?: string[];
    /** Calculated dimensions of the legend title for layout positioning. */
    legendTitleSize?: PieChartSizeProps;
    /** Boolean flag indicating whether the legend includes a title element. */
    isTitle?: boolean;
    /** SVG clipping rectangle specifically for paginated legend content. */
    pagingClipRect?: RectOption;
    /** The page number currently displayed to the user (1-based index for display). */
    currentPageNumber?: number;
    /** Collection of interactive region definitions for legend items. */
    legendRegions?: ILegendRegions[];
    /** Collection of bounding rectangles for pagination interactive elements. */
    pagingRegions?: Rect[];
    /** Total number of pages calculated for pagination display. */
    totalNoOfPages?: number;
    /** Boolean flag indicating whether Right-to-Left text direction is enabled. */
    isRtlEnable?: boolean;
    /** Boolean flag indicating whether legend items should be displayed in reverse order. */
    isReverse?: boolean;
    /** Pixel padding between individual legend items for spacing. */
    legendItemPadding?: number;
    /** SVG transform attribute value for positioning the legend container. */
    transform?: string;
    /** Configuration options for the "page up" navigation button. */
    pageUpOption?: PathOptions;
    /** Configuration options for the "page down" navigation button. */
    pageDownOption?: PathOptions;
    /** Text rendering options for pagination information display. */
    pageTextOption?: TextOption;
    /** SVG translate transform value specifically for legend positioning. */
    legendTranslate?: string;
    /** Calculated position for the legend title element. */
    legendTitleLoction?: PieChartLocationProps;
    /** Clipping rectangle for the chart legend. */
    legendClipRect?: Rect;
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
 * Interface for legend options that define the appearance and behavior of individual legend items.
 *
 * @interface LegendOptions
 * @private
 */
export interface LegendOptions {
    /** Boolean flag determining whether this legend item should be included in rendering. */
    render: boolean;
    /** Preserved original text content before any truncation or modification for display. */
    originalText: string;
    /** Display text shown in the legend item, possibly truncated or modified for layout. */
    text: string;
    /** Color value for the legend marker background. */
    fill: string;
    /** Visual shape of the legend marker symbol. */
    shape: PieLegendShape;
    /** Controls visibility state of this legend item without removing it from the DOM. */
    visible: boolean;
    /** Classification of the chart series this legend item represents. */
    type: string;
    /** Calculated dimensions of the text element for layout planning. */
    textSize: PieChartSizeProps;
    /** Coordinates where this legend item is positioned within the legend container. */
    location: PieChartLocationProps;
    /** URL reference for image-based markers when applicable. */
    url?: string;
    /** Zero-based index of the data point this legend item represents in the series. */
    pointIndex?: number;
    /** Zero-based index of the series this legend item represents in the chart. */
    seriesIndex?: number;
    /** Array of text segments for handling multi-line or wrapped legend labels. */
    textCollection?: string[];
    /** SVG dash pattern definition for line series representations (e.g., "5,2"). */
    dashArray?: string;
    /** Detailed rendering options for the legend symbol. */
    symbolOption?: PathOptions;
    /** Detailed rendering options for the legend marker. */
    markerOption?: PathOptions;
    /** Detailed rendering options for the legend text. */
    textOption?: TextOption;
}

/**
 * Interface for defining interactive regions within the legend.
 *
 * @interface ILegendRegions
 * @private
 */
export interface ILegendRegions {
    /** Bounding rectangle defining the clickable/interactive area. */
    rect: Rect;
    /** Zero-based index corresponding to the associated legend item. */
    index: number;
}

/**
 * Interface that defines properties for SVG rectangle elements used in charts and legends.
 *
 * @interface RectOption
 * @private
 */
export interface RectOption {
    /** Unique identifier for the rectangle element used in DOM selection and events. */
    id: string;
    /** Fill color for the rectangle interior (CSS color string or gradient reference). */
    fill: string;
    /** Stroke color for the rectangle outline (CSS color string). */
    stroke: string;
    /** Width of the stroke outline in pixels. */
    strokeWidth: number;
    /** Pattern for dashed lines (e.g., "5,2" for dashed borders). */
    strokeDasharray: string;
    /** Opacity value between 0 (transparent) and 1 (opaque). */
    opacity: number;
    /** SVG path data (preserved for compatibility with path interfaces but not used for rectangles). */
    d: string;
    /** X-coordinate of the top-left corner of the rectangle. */
    x: number;
    /** Y-coordinate of the top-left corner of the rectangle. */
    y: number;
    /** Width of the rectangle in pixels. */
    width: number;
    /** Height of the rectangle in pixels. */
    height: number;
    /** X-axis radius for rounded corners in pixels. */
    rx: number;
    /** Y-axis radius for rounded corners in pixels. */
    ry: number;
    /** SVG transform attribute value for positioning and transforming the rectangle. */
    transform: string;
}

/**
 * Accumulation Chart TextRender event arguments.
 *
 * @interface TextRenderOptions
 * @private
 */
export interface TextRenderOptions {
    /** Defines the series of the labels. */
    series: PieChartSeriesProps;
    /** Defines the point of the label. */
    point: Points;
    /** Defines the text of the label. */
    text: string;
    /** Defines the fill color of the label. */
    color: string;
    /** Defines the border of the label. */
    border: PieChartBorderProps;
    /** Defines the template for the data label.
     *
     * @aspType string
     */
    template?: string | Function;
    /** Defines the font used for the label. */
    font: PieChartFontProps;
}

/**
 * Represents a function that customizes the content of a tooltip.
 *
 * @param {string | string[]} text - The input string used to generate the tooltip content.
 * @returns {string | string[] | boolean} A string representing the modified tooltip content.
 * @private
 */
export type TooltipContentFunction = (data: PieChartTooltipFormatterProps) => string | string[] | boolean;
