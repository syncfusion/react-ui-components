import { ChartBorderProps, ChartLegendProps, ChartLocationProps } from './interfaces';
import { ChartSeriesType, ChartMarkerShape, LegendPosition, LegendShape } from './enum';
import { Chart, PathOptions, Rect, ChartSizeProps, TextOption } from '../chart-area/chart-interfaces';

/**
 * Interface for the base legend component that defines core functionality and properties.
 *
 * @interface BaseLegend
 * @extends ChartLegendProps
 * @private
 */
export interface BaseLegend extends ChartLegendProps {
    /** Reference to the parent chart instance for coordinating interactions and layout. */
    chart?: Chart;
    /** Comprehensive legend configuration properties inherited from the chart. */
    legend?: ChartLegendProps;
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
    /** Collection of x-coordinates for positioning pagination elements. */
    pageXCollections?: number[];
    /** Maximum number of columns allowed in a multi-column legend layout. */
    maxColumns?: number;
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
    position?: LegendPosition;
    /** Number of rows in the chart's data structure, used for layout calculations. */
    chartRowCount?: number;
    /** Calculated bounding rectangle that defines the legend's position and dimensions. */
    legendBounds?: Rect;
    /** Collection of all legend items with their configuration and state information. */
    legendCollections?: LegendOptions[];
    /** Collection of title text strings for multiple legend sections. */
    legendTitleCollections?: string[];
    /** Calculated dimensions of the legend title for layout positioning. */
    legendTitleSize?: ChartSizeProps;
    /** Boolean flag indicating whether the legend is positioned at the top of the chart. */
    isTop?: boolean;
    /** Boolean flag indicating whether the legend includes a title element. */
    isTitle?: boolean;
    /** Timer ID reference for managing tooltip clearing operations. */
    clearTooltip?: number;
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
    itemPadding?: number;
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
    legendTitleLoction?: ChartLocationProps
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
    shape: LegendShape;
    /** Controls visibility state of this legend item without removing it from the DOM. */
    visible: boolean;
    /** Classification of the chart series this legend item represents. */
    type: ChartSeriesType;
    /** Calculated dimensions of the text element for layout planning. */
    textSize: ChartSizeProps;
    /** Coordinates where this legend item is positioned within the legend container. */
    location: ChartLocationProps;
    /** URL reference for image-based markers when applicable. */
    url?: string;
    /** Zero-based index of the data point this legend item represents in the series. */
    pointIndex?: number;
    /** Zero-based index of the series this legend item represents in the chart. */
    seriesIndex?: number;
    /** Custom shape for the marker that may differ from the default legend shape. */
    markerShape?: ChartMarkerShape;
    /** Controls whether the marker symbol is shown alongside the legend text. */
    markerVisibility?: boolean;
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
 * Creates a fully configured legend option object with the specified properties.
 *
 * @param {string} text - Legend text to display, representing the series or point name.
 * @param {string} fill - Fill color for the legend marker, matching the series or point color.
 * @param {LegendShape} shape - Visual shape of the legend marker (circle, rectangle, triangle, etc.).
 * @param {boolean} visible - Initial visibility state of the legend item in the chart.
 * @param {ChartSeriesType} type - Type classification of the chart series this legend represents.
 * @param {string} [url] - Optional image URL for image-based markers.
 * @param {ChartMarkerShape} [markerShape] - Optional custom shape for the marker that may differ from the legend shape.
 * @param {boolean} [markerVisibility] - Controls whether the marker symbol appears alongside the text.
 * @param {number} [pointIndex] - Zero-based index of the specific data point in multi-point series.
 * @param {number} [seriesIndex] - Zero-based index of the series within the chart's collection.
 * @param {string} [dashArray] - SVG dash pattern for representing line styles (e.g., "5,2" for dashed lines).
 * @param {string} [originalText] - Preserved original text before any modifications for display.
 * @returns {LegendOptions} A fully configured legend options object ready for rendering.
 * @private
 */
export const createLegendOption: Function = (
    text: string,
    fill: string,
    shape: LegendShape,
    visible: boolean,
    type: ChartSeriesType,
    url?: string,
    markerShape?: ChartMarkerShape,
    markerVisibility?: boolean,
    pointIndex?: number,
    seriesIndex?: number,
    dashArray?: string,
    originalText?: string
): LegendOptions => {
    return {
        render: true,
        text,
        fill,
        shape,
        url,
        visible,
        type,
        markerVisibility,
        markerShape,
        pointIndex,
        seriesIndex,
        dashArray,
        originalText: originalText || text,
        textSize: { width: 0, height: 0 },
        location: { x: 0, y: 0 },
        textCollection: []
    };
};

/**
 * Creates a fully configured path options object for rendering SVG paths in the legend.
 *
 * @param {string} id - Unique identifier for the path element used in DOM selection and events.
 * @param {string} fill - Fill color for the path interior (CSS color string or gradient reference).
 * @param {number} strokeWidth - Width of the stroke outline in pixels.
 * @param {string} stroke - Stroke color for the path outline (CSS color string).
 * @param {number} opacity - Opacity value between 0 (transparent) and 1 (opaque).
 * @param {string} strokeDasharray - Pattern for dashed lines (e.g., "5,2" for dashed lines).
 * @param {string} d - SVG path data string defining the shape geometry.
 * @param {number} [rx] - X-axis radius for rounded corners in rectangular shapes.
 * @param {number} [ry] - Y-axis radius for rounded corners in rectangular shapes.
 * @param {number} [cx] - X-coordinate of the center point for circular shapes.
 * @param {number} [cy] - Y-coordinate of the center point for circular shapes.
 * @returns {PathOptions} Fully configured path options object ready for rendering.
 * @private
 */
export const createPathOption: Function = (
    id: string,
    fill: string,
    strokeWidth: number,
    stroke: string,
    opacity: number,
    strokeDasharray: string,
    d: string,
    rx?: number,
    ry?: number,
    cx?: number,
    cy?: number
): PathOptions => {
    return {
        id,
        fill,
        stroke,
        strokeWidth,
        strokeDasharray,
        opacity,
        d,
        rx,
        ry,
        cx,
        cy
    };
};

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
 * Creates a fully configured rectangle options object for rendering SVG rectangles in charts.
 *
 * @param {string} id - Unique identifier for the rectangle element used in DOM selection and events.
 * @param {string} fill - Fill color for the rectangle interior (CSS color string or gradient reference).
 * @param {ChartBorderProps} border - Border configuration object containing width and color properties.
 * @param {number} opacity - Opacity value between 0 (transparent) and 1 (opaque).
 * @param {Rect} rect - Rectangle dimensions and position object with x, y, width and height properties.
 * @param {number} rx - X-axis radius for rounded corners in pixels.
 * @param {number} ry - Y-axis radius for rounded corners in pixels.
 * @param {string} transform - SVG transform attribute value for positioning and transformations.
 * @param {string} strokeDasharray - Pattern for dashed lines (e.g., "5,2" for dashed borders).
 * @returns {RectOption} Fully configured rectangle options object ready for rendering.
 * @private
 */
export const createRectOption: Function = (
    id: string,
    fill: string,
    border: ChartBorderProps,
    opacity: number,
    rect: Rect,
    rx: number,
    ry: number,
    transform: string,
    strokeDasharray: string
): RectOption => {
    const stroke: string = border.width !== 0 && border.color !== '' && border.color !== null && border.color
        ? border.color
        : 'transparent';

    return {
        id,
        fill,
        stroke: stroke,
        strokeWidth: border.width as Required<number>,
        strokeDasharray: strokeDasharray,
        opacity: opacity,
        d: '',
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        rx: rx,
        ry: ry,
        transform: transform
    };
};
