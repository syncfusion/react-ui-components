import { TooltipPlacement, TooltipShape, TooltipTheme } from './enum';

/**
 * Configuration options for tooltip components.
 */
export interface TooltipProps {
    /** Indicates whether the tooltip is shared among multiple data points. */
    shared?: boolean;
    /** Enables or disables the crosshair feature. */
    crosshair?: boolean;
    /** Enables or disables the shadow effect for the tooltip. */
    enableShadow?: boolean;
    /** Background fill color of the tooltip. */
    fill?: string;
    /** Text content for the tooltip header. */
    header: string;
    /** Opacity level for the tooltip (0 to 1). */
    opacity?: number;
    /** Text style options for the tooltip content. */
    textStyle?: TextStyle;
    /** Custom template for the tooltip, either as an HTML string or a render function. */
    template?: Function;
    /** Enables or disables animation effects when showing/hiding the tooltip. */
    enableAnimation?: boolean;
    /** Duration of the tooltip animation in milliseconds. */
    duration?: number;
    /** Determines if the tooltip should be inverted (horizontal vs. vertical orientation). */
    inverted?: boolean;
    /** Indicates if the tooltip represents negative values. */
    isNegative?: boolean;
    /** Border styling options for the tooltip. */
    border?: TooltipBorder;
    /** Array of content strings to display in the tooltip. */
    content?: string[];
    /** Size of the marker symbols in pixels. */
    markerSize?: number;
    /** Bounds for clipping the tooltip positioning. */
    clipBounds?: TooltipLocation;
    /** Array of colors for the series markers in the tooltip. */
    palette?: string[];
    /** Array of shape types for the series markers in the tooltip. */
    shapes?: TooltipShape[];
    /** Position coordinates where the tooltip should be displayed. */
    location?: TooltipLocation;
    /** Offset distance from the tooltip position in pixels. */
    offset?: number;
    /** X-radius for rounded corners of the tooltip. */
    rx?: number;
    /** Y-radius for rounded corners of the tooltip. */
    ry?: number;
    /** Horizontal margin within the tooltip in pixels. */
    marginX?: number;
    /** Vertical margin within the tooltip in pixels. */
    marginY?: number;
    /** Padding around the tooltip arrow in pixels. */
    arrowPadding?: number;
    /** Data object to be passed to tooltip template functions. */
    data?: Object;
    /** Boundary constraints for tooltip positioning. */
    areaBounds?: AreaBounds;
    /** Available size for the tooltip rendering area. */
    availableSize?: Size;
    /** Indicates if the tooltip is being rendered on a canvas element. */
    isCanvas?: boolean;
    /** Enables text wrapping within the tooltip. */
    isTextWrap?: boolean;
    /** Determines if the tooltip is fixed in position. */
    isFixed?: boolean;
    /** Explicitly sets the tooltip placement direction. */
    tooltipPlacement?: TooltipPlacement;
    /** Reference to the parent control instance. */
    controlInstance?: object;
    /** Name of the parent control. */
    controlName?: string;
    /** Shows tooltip for the nearest data point. */
    showNearestTooltip?: boolean;
    /** Enables right-to-left text direction for the tooltip. */
    enableRTL?: boolean;
    /** Enables highlighting of the tooltip. */
    allowHighlight?: boolean;
    /** Shows or hides the header line separator in the tooltip. */
    showHeaderLine?: boolean;
    /** Theme to apply to the tooltip. */
    theme?: TooltipTheme;
}

/**
 * Represents a single text span element within the tooltip.
 */
export interface TextSpanElement {
    /** Unique identifier for the text span. */
    id: string;
    /** The actual text content to display. */
    content: string;
    /** X-coordinate for text positioning. */
    x?: number;
    /** Y-coordinate for text positioning. */
    y?: number;
    /** Delta-y for relative text positioning. */
    dy?: number;
    /** CSS styles to apply to the text span. */
    style: React.CSSProperties;
}

/**
 * Represents a marker shape rendered in the tooltip.
 */
export interface MarkerShape {
    /** Unique identifier for the marker. */
    id: string;
    /** The type of SVG element to render ('ellipse', 'path', or 'image'). */
    type: string;
    /** SVG path data string for path-based markers. */
    d?: string;
    /** X-coordinate for circle center (for ellipse markers). */
    cx?: number;
    /** Y-coordinate for circle center (for ellipse markers). */
    cy?: number;
    /** X-radius for ellipse markers. */
    rx?: number;
    /** Y-radius for ellipse markers. */
    ry?: number;
    /** X-coordinate for element positioning (for image markers). */
    x?: number;
    /** Y-coordinate for element positioning (for image markers). */
    y?: number;
    /** Width for element sizing (for image markers). */
    width?: number;
    /** Height for element sizing (for image markers). */
    height?: number;
    /** Fill color for the marker or image URL for image markers. */
    fill: string;
    /** Stroke color for the marker outline. */
    stroke: string;
    /** Stroke width for the marker outline in pixels. */
    strokeWidth: number;
}

/**
 * Represents the theme style configuration for tooltips.
 */
export interface ITooltipThemeStyle {
    /** Background fill color of the tooltip. */
    tooltipFill: string;
    /** Color for bold text in the tooltip. */
    tooltipBoldLabel: string;
    /** Color for regular (non-bold) text in the tooltip. */
    tooltipLightLabel: string;
    /** Color for the horizontal divider line in the tooltip header. */
    tooltipHeaderLine: string;
    /** Text styling options for the tooltip content. */
    textStyle: TextStyle;
}

/**
 * Represents rendering options for tooltip shapes and elements.
 */
export interface RenderOption {
    /** SVG path data string for path-based elements. */
    d?: string;
    /** X-radius for rounded rectangle corners. */
    rx?: number;
    /** Y-radius for rounded rectangle corners. */
    ry?: number;
    /** X-coordinate for circle center. */
    cx?: number;
    /** Y-coordinate for circle center. */
    cy?: number;
    /** X-coordinate for element positioning. */
    x?: number;
    /** Y-coordinate for element positioning. */
    y?: number;
    /** Width for element sizing. */
    width?: number;
    /** Height for element sizing. */
    height?: number;
    /** Fill color for the element. */
    fill?: string;
    /** Stroke color for the element outline. */
    stroke?: string;
    /** Stroke width for the element outline in pixels. */
    strokeWidth?: number;
    /** URL reference for image elements. */
    href?: string;
}


/**
 * Defines styling options for text elements in tooltips.
 */
export interface TextStyle {
    /**
     * Font size for the text, specified as a CSS font-size value (e.g., '12px').
     */
    size?: string;

    /**
     * Text color specified as a CSS color value.
     */
    color?: string;

    /**
     * Font family for the text.
     */
    fontFamily?: string;

    /**
     * Font weight for the text, can be specified as a string (e.g., 'bold', 'normal', '600').
     * Can be null to use the default font weight.
     */
    fontWeight?: string | null;

    /**
     * Font style for the text (e.g., 'normal', 'italic').
     */
    fontStyle?: string;

    /**
     * Opacity level for the text, ranging from 0 (transparent) to 1 (opaque).
     */
    opacity?: number;

    /**
     * Font size specifically for header text.
     */
    headerTextSize?: string;

    /**
     * Font size specifically for bold text.
     */
    boldTextSize?: string;
}

/**
 * Defines border styles for tooltips.
 */
export interface TooltipBorder {
    /**
     * Color of the border, specified as a CSS color value.
     */
    color?: string;

    /**
     * Width of the border in pixels.
     */
    width?: number;

    /**
     * Dash array pattern for the border stroke (e.g., '3,3' for a dashed line).
     */
    dashArray?: string;
}

/**
 * Defines the boundaries in which the tooltip can be positioned.
 */
export interface AreaBounds {
    /**
     * X-coordinate of the top-left corner of the bounds.
     */
    x: number;

    /**
     * Y-coordinate of the top-left corner of the bounds.
     */
    y: number;

    /**
     * Width of the bounds area in pixels.
     */
    width: number;

    /**
     * Height of the bounds area in pixels.
     */
    height: number;
}

/**
 * Defines the style properties for different tooltip themes.
 */
export interface TooltipThemeStyle {
    /**
     * Background fill color of the tooltip.
     */
    tooltipFill: string;

    /**
     * Color for bold labels in the tooltip.
     */
    tooltipBoldLabel: string;

    /**
     * Color for regular (non-bold) labels in the tooltip.
     */
    tooltipLightLabel: string;

    /**
     * Color for the header separator line in the tooltip.
     */
    tooltipHeaderLine: string;

    /**
     * Text style configuration for the tooltip.
     */
    textStyle: TextStyle;
}

/**
 * Represents a two-dimensional size with width and height.
 */
export interface Size {
    /** The width of the size in pixels. */
    width: number;
    /** The height of the size in pixels. */
    height: number;
}

/**
 * Represents a rectangle with position and dimensions.
 */
export interface Rect {
    /** The x-coordinate of the rectangle's top-left corner. */
    x: number;
    /** The y-coordinate of the rectangle's top-left corner. */
    y: number;
    /** The width of the rectangle in pixels. */
    width: number;
    /** The height of the rectangle in pixels. */
    height: number;
}

/**
 * Represents the side positioning information.
 */
export interface Side {
    /** Indicates if the element is positioned at the bottom. */
    isBottom: boolean;
    /** Indicates if the element is positioned at the right. */
    isRight: boolean;
}

/**
 * Represents text rendering options.
 */
export interface TextOption {
    /** Unique identifier for the text element. */
    id: string;
    /** X-coordinate for text positioning. */
    x: number;
    /** Y-coordinate for text positioning. */
    y: number;
    /** Text anchor position (start, middle, end). */
    anchor: string;
    /** The text content to be displayed. */
    text: string;
}

/**
 * Represents path rendering options for SVG elements.
 */
export interface PathOption {
    /** Unique identifier for the path element. */
    id: string;
    /** Fill color for the path. */
    fill: string;
    /** Opacity value for the path (0 to 1). */
    opacity: number;
    /** Stroke color for the path outline. */
    stroke: string;
    /** Stroke width for the path outline in pixels. */
    strokeWidth: number;
    /** Dash array pattern for the path stroke, or null for solid line. */
    dashArray: string | null;
    /** SVG path data string. */
    d?: string;
    /** X-radius for rounded rectangle corners. */
    rx?: number;
    /** Y-radius for rounded rectangle corners. */
    ry?: number;
    /** X-coordinate for circle center. */
    cx?: number;
    /** Y-coordinate for circle center. */
    cy?: number;
    /** URL reference for image elements. */
    href?: string;
    /** Height for element sizing. */
    height?: number;
    /** Width for element sizing. */
    width?: number;
    /** X-coordinate for element positioning. */
    x?: number;
    /** Y-coordinate for element positioning. */
    y?: number;
}

/**
 * Represents a location point for tooltips.
 */
export interface TooltipLocation {
    /** X-coordinate of the tooltip location. */
    x: number;
    /** Y-coordinate of the tooltip location. */
    y: number;
}
