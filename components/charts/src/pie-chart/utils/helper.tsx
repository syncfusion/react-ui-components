import { HorizontalAlignment } from '@syncfusion/react-base';
import { PieChartBorderProps, PieChartFontProps, PieChartLocationProps, PieChartSizeProps } from '../base/interfaces';
import { TextOverflow, TitlePosition } from '../../common';
import { LegendOptions, PathOptions, Rect, RectOption } from '../base/internal-interfaces';
import { Index, useTextTrim } from '../renderer/series-renderer/series-helper';
import { PieLegendShape } from '../base/enum';

/**
 * Calculates the maximum size (width and height) of an array of text strings when rotated at a given angle.
 *
 * @param {string[]} texts - An array of text strings for which the maximum size needs to be computed.
 * @param {number} angle - The angle at which the text is to be rotated.
 * @param {PieChartFontProps} textStyle - The style settings for the text.
 * @param {PieChartFontProps} defaultFont - The default font styling to use.
 * @returns {PieChartSizeProps} An object representing the maximum width and height of the rotated text.
 * @private
 */
export function getMaxRotatedTextSize(
    texts: string[], angle: number, textStyle: PieChartFontProps, defaultFont: PieChartFontProps): PieChartSizeProps {
    let maxWidth: number = 0;
    let maxHeight: number = 0;
    texts.forEach((text: string) => {
        const size: PieChartSizeProps = getRotatedTextSize(text, textStyle, angle, defaultFont);
        maxWidth = Math.max(maxWidth, size.width);
        maxHeight = Math.max(maxHeight, size.height);
    });

    return { width: maxWidth, height: maxHeight };
}

/**
 * Calculates the size of text when rotated at a specified angle.
 *
 * @param {string} text - The text to measure.
 * @param {PieChartFontProps} font - The font settings to be used for the text.
 * @param {number} angle - The angle at which the text is rotated.
 * @param {PieChartFontProps} themeFont - The theme font settings to apply.
 * @returns {PieChartSizeProps} The dimensions of the rotated text.
 * @private
 */
export function getRotatedTextSize(text: string, font: PieChartFontProps, angle: number, themeFont: PieChartFontProps): PieChartSizeProps {
    const textLines: string[] = isBreakLabel(text) ? text.split('<br>') : [text];

    let maxWidth: number = 0;
    let totalHeight: number = 0;
    //let lineHeight = 0;

    for (const line of textLines) {
        const size: PieChartSizeProps = measureText(line, font, themeFont);
        maxWidth = Math.max(maxWidth, size.width);
        totalHeight += size.height;
    }

    // Add small line padding to simulate <tspan> spacing
    const totalWithPadding: number = totalHeight + ((textLines.length - 1) * 2); // adjust padding here as needed

    // Rotation math
    const radians: number = (angle * Math.PI) / 180;
    const rotatedWidth: number = Math.abs(Math.cos(radians) * maxWidth) + Math.abs(Math.sin(radians) * totalWithPadding);
    const rotatedHeight: number = Math.abs(Math.sin(radians) * maxWidth) + Math.abs(Math.cos(radians) * totalWithPadding);
    return { width: rotatedWidth, height: rotatedHeight };
}

/**
 * Checks if a label contains a line break.
 *
 * @param {string} label - The label to check.
 * @returns {boolean} - True if the label contains a line break, otherwise false.
 * @private
 */
export function isBreakLabel(label: string): boolean {
    return label.indexOf('<br>') !== -1;
}

/**
 * Measures the size of the given text using the specified font and theme font style.
 *
 * @param {string} text - The text to measure.
 * @param {PieChartFontProps} font - The font style used for measuring the text.
 * @param {PieChartFontProps} themeFontStyle - Additional theme font styles that could influence text rendering.
 * @returns {PieChartSizeProps} The calculated size of the text, including width and height dimensions.
 * @private
 */
export function measureText(text: string, font: PieChartFontProps, themeFontStyle: PieChartFontProps): PieChartSizeProps {
    const svg: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const textEl: SVGTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.textContent = text;

    const fontStyle: string = font.fontStyle || themeFontStyle.fontStyle as string;
    const fontWeight: string = font.fontWeight || themeFontStyle.fontWeight as string;
    const fontSize: string = font.fontSize || themeFontStyle.fontSize as string;
    const fontFamily: string = font.fontFamily || themeFontStyle.fontFamily as string;

    textEl.style.fontStyle = fontStyle;
    textEl.style.fontWeight = fontWeight;
    textEl.style.fontSize = fontSize;
    textEl.style.fontFamily = fontFamily;

    svg.appendChild(textEl);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    svg.style.pointerEvents = 'none';

    document.body.appendChild(svg);
    const bbox: DOMRect = textEl.getBoundingClientRect();
    document.body.removeChild(svg);
    return { width: bbox.width, height: bbox.height };
}

/**
 * Retrieves the title text for display, considering styling and overflow settings.
 *
 * @param {string} title - The title text to be processed.
 * @param {PieChartFontProps} style - The style to be applied to the title text.
 * @param {number} width - The width constraint for displaying the title.
 * @param {boolean} isRtlEnabled - Flag indicating if right-to-left text is enabled.
 * @param {PieChartFontProps} themeFontStyle - Additional font styling based on the theme.
 * @param {TextOverflow} textOverflow - The overflow strategy for handling long text.
 * @returns {string[]} An array of strings representing the processed title text.
 * @private
 */
export function getTitle(
    title: string, style: PieChartFontProps, width: number, isRtlEnabled: boolean,
    themeFontStyle: PieChartFontProps, textOverflow: TextOverflow): string[] {
    let titleCollection: string[] = [];
    switch (textOverflow) {
    case 'Wrap':
        titleCollection = useTextWrap(title, width, style, isRtlEnabled, themeFontStyle, title.indexOf(' ') < 0 ? true : false);
        break;
    case 'Trim':
        titleCollection.push(useTextTrim(width, title, style, isRtlEnabled, themeFontStyle));
        break;
    default:
        titleCollection.push(title);
        break;
    }
    return titleCollection;
}


/**
 * Wraps the input text into multiple lines based on the specified maximum width and font style.
 *
 * @param {string} currentLabel - The text to be wrapped.
 * @param {number} maximumWidth - The maximum width allowed for each line of text.
 * @param {PieChartFontProps} font - The font style used for rendering the text.
 * @param {boolean} isRtlEnabled - Specifies whether right-to-left text direction is enabled.
 * @param {PieChartFontProps} [themeFontStyle] - The font style used as the base for the text wrapping operation.
 * @param {boolean} [clip=false] - Specifies whether text exceeding the maximum width should be clipped.
 * @param {number} [maximumLabelHeight] - The total height available for the wrapped text.
 * @returns {string[]} An array of strings representing the wrapped lines of text.
 * @private
 */
export function useTextWrap(
    currentLabel: string, maximumWidth: number, font: PieChartFontProps, isRtlEnabled: boolean, themeFontStyle: PieChartFontProps,
    clip?: boolean, maximumLabelHeight?: number): string[] {
    const textCollection: string[] = currentLabel.split(' ');
    let label: string = '';
    const labelCollection: string[] = [];
    let text: string;
    let textHeight: number = 0;
    for (let i: number = 0, len: number = textCollection.length; i < len; i++) {
        text = textCollection[i as number];
        const measuredWidth: number = measureText(label + (label === '' ? '' : ' ' + text), font, themeFontStyle).width;
        void (measuredWidth < maximumWidth
            ? label = label + (label === '' ? '' : ' ') + text
            : maximumLabelHeight
                ? (
                    (label !== '' && textHeight < maximumLabelHeight)
                        ? (
                            labelCollection.push(
                                clip ? label : useTextTrim(maximumWidth, label, font, isRtlEnabled, themeFontStyle)
                            ),
                            label = text
                        )
                        : textHeight < maximumLabelHeight
                            ? (
                                labelCollection.push(
                                    clip ? text : useTextTrim(maximumWidth, text, font, isRtlEnabled, themeFontStyle)
                                ),
                                text = ''
                            )
                            : null
                )
                : (
                    label !== ''
                        ? (
                            labelCollection.push(
                                clip ? label : useTextTrim(maximumWidth, label, font, isRtlEnabled, themeFontStyle)
                            ),
                            label = text
                        )
                        : (
                            labelCollection.push(
                                clip ? text : useTextTrim(maximumWidth, text, font, isRtlEnabled, themeFontStyle)
                            ),
                            text = ''
                        )
                ));

        void (label && i === len - 1 && labelCollection.push(
            clip ? label : useTextTrim(maximumWidth, label, font, isRtlEnabled, themeFontStyle)
        ));
        textHeight += measureText(text as string, font, themeFontStyle).width;
    }
    return labelCollection;
}

/**
 * Wraps the input text into multiple lines based on the specified maximum width and font style.
 *
 * @param {string} currentLabel - The text to be wrapped.
 * @param {number} maximumWidth - The maximum width allowed for each line of text.
 * @param {PieChartFontProps} font - The font style used for rendering the text.
 * @param {boolean} isRtlEnabled - Specifies whether right-to-left text direction is enabled.
 * @param {boolean} clip - Specifies whether text exceeding the maximum width should be clipped.
 * @param {PieChartFontProps} themeFontStyle - The font style used as the base for the text wrapping operation.
 * @param {number} maximumLabelHeight - The total height available for the wrapped text.
 * @returns {string[]} An array of strings representing the wrapped lines of text.
 * @private
 */
export function textWrap(currentLabel: string, maximumWidth: number, font: PieChartFontProps, isRtlEnabled: boolean,
                         clip?: boolean, themeFontStyle?: PieChartFontProps, maximumLabelHeight?: number): string[] {
    const textCollection: string[] = currentLabel.split(' ');
    let label: string = '';
    const labelCollection: string[] = [];
    let text: string;
    const lineHeight: number = measureText('chartMeasureText', font, themeFontStyle as PieChartFontProps).height;
    let textHeight: number = 0;
    for (let i: number = 0, len: number = textCollection.length; i < len; i++) {
        text = textCollection[i as number];
        if (measureText(label.concat(label === '' ? '' : ' ' + text), font, themeFontStyle as PieChartFontProps).width < maximumWidth) {
            label = label.concat((label === '' ? '' : ' ') + text);
        }
        else {
            if (label !== '') {
                textHeight += lineHeight;
                if (maximumLabelHeight && textHeight > maximumLabelHeight) {
                    labelCollection[labelCollection.length - 1] += '...';
                    return labelCollection;
                }
                labelCollection.push(clip ? label :
                    useTextTrim(maximumWidth, label, font, isRtlEnabled, themeFontStyle as PieChartFontProps));
                label = text;
            }
            else {
                textHeight += lineHeight;
                if (maximumLabelHeight && textHeight > maximumLabelHeight) {
                    labelCollection[labelCollection.length - 1] += '...';
                    return labelCollection;
                }
                labelCollection.push(clip ? text :
                    useTextTrim(maximumWidth, text, font, isRtlEnabled, themeFontStyle as PieChartFontProps));
            }
        }
        if (label && i === len - 1) {
            textHeight += lineHeight;
            if (maximumLabelHeight && textHeight > maximumLabelHeight) {
                labelCollection[labelCollection.length - 1] += '...';
                return labelCollection;
            }
            labelCollection.push(clip ? label : useTextTrim(maximumWidth, label, font, isRtlEnabled, themeFontStyle as PieChartFontProps));
        }
    }
    return labelCollection;
}

/**
 * Determines the text anchor position based on the alignment, RTL setting, and title position.
 *
 * @param {HorizontalAlignment} alignment - The alignment setting for the text.
 * @param {boolean} enableRtl - A boolean that represents whether right-to-left text is enabled.
 * @param {TitlePosition} position - The position where the title is placed (e.g., 'Left', 'Center', etc.).
 * @returns {string} The computed text anchor for the given alignment, RTL, and position.
 * @private
 */
export function getTextAnchor(alignment: HorizontalAlignment, enableRtl: boolean, position: TitlePosition): string {
    if (position === 'Left') {
        let anchor: string = alignment === 'Left' ? 'end' : alignment === 'Right' ? 'start' : 'middle';
        anchor = enableRtl ? (anchor === 'end' ? 'start' : anchor === 'start' ? 'end' : anchor) : anchor;
        return anchor;
    }
    if (position === 'Right') {
        let anchor: string = alignment === 'Left' ? 'start' : alignment === 'Right' ? 'end' : 'middle';
        anchor = enableRtl ? (anchor === 'end' ? 'start' : anchor === 'start' ? 'end' : anchor) : anchor;
        return anchor;
    }
    if (enableRtl) {
        return alignment === 'Left' ? 'end' : alignment === 'Right' ? 'start' : 'middle';
    }
    return alignment === 'Left' ? 'start' : alignment === 'Right' ? 'end' : 'middle';
}

/**
 * Gets the text anchor based on the specified alignment and Right-to-Left setting.
 *
 * @param {HorizontalAlignment} alignment - The alignment of the text.
 * @param {boolean} enableRtl - Specifies whether Right-to-Left is enabled.
 * @returns {string} - The text anchor value.
 * @private
 */
export function getCenterLabelTextAnchor(alignment: HorizontalAlignment, enableRtl: boolean): string {
    switch (alignment) {
    case 'Left':
        return enableRtl ? 'end' : 'start';
    case 'Right':
        return enableRtl ? 'start' : 'end';
    default:
        return 'middle';
    }
}

/**
 * Calculates the maximum width and height required to display an array of text strings
 * using the specified text and default font styles.
 *
 * @param {string[]} texts - An array of text strings whose maximum size is to be determined.
 * @param {PieChartFontProps} textStyle - The font style to apply to each text string.
 * @param {PieChartFontProps} defaultFont - The default font style to fall back on if necessary.
 * @returns {PieChartSizeProps} An object containing the maximum width and height required for the text strings.
 * @private
 */
export function getMaxTextSize(texts: string[], textStyle: PieChartFontProps, defaultFont: PieChartFontProps): PieChartSizeProps {
    let maxWidth: number = 0;
    let maxHeight: number = 0;

    texts.forEach((text: string) => {
        const size: PieChartSizeProps = measureText(text, textStyle, defaultFont);
        maxWidth = Math.max(maxWidth, size.width);
        maxHeight = Math.max(maxHeight, size.height);
    });

    return { width: maxWidth, height: maxHeight };
}

/**
 * Calculates the horizontal position of a chart title based on the alignment setting.
 *
 * @param {Rect} rect - The rectangle object representing the position and size of the container.
 * @param { HorizontalAlignment} textAlignment - The settings for the title's style, including text alignment.
 * @returns {number} The x-coordinate for the title position.
 * @private
 */
export function titlePositionX(rect: Rect, textAlignment: HorizontalAlignment): number {
    if (textAlignment === 'Left') {
        return rect.x;
    } else if (textAlignment === 'Center') {
        return rect.x + rect.width / 2;
    } else {
        return rect.x + rect.width;
    }
}

/**
 * Creates a fully configured legend option object with the specified properties.
 *
 * @param {string} text - Legend text to display, representing the series or point name.
 * @param {string} fill - Fill color for the legend marker, matching the series or point color.
 * @param {PieLegendShape} shape - Visual shape of the legend marker (circle, rectangle, triangle, etc.).
 * @param {boolean} visible - Initial visibility state of the legend item in the chart.
 * @param {string} type - Type classification of the chart series this legend represents.
 * @param {string} [url] - Optional image URL for image-based markers.
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
    shape: PieLegendShape,
    visible: boolean,
    type: string,
    url?: string,
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
 * Creates a fully configured rectangle options object for rendering SVG rectangles in charts.
 *
 * @param {string} id - Unique identifier for the rectangle element used in DOM selection and events.
 * @param {string} fill - Fill color for the rectangle interior (CSS color string or gradient reference).
 * @param {PieChartBorderProps} border - Border configuration object containing width and color properties.
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
    border: PieChartBorderProps,
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

/**
 * Converts a string to a number based on the given container size.
 *
 * @param {string | null | undefined} value - The string value to convert to a number.
 * @param {number} containerSize - The size of the container, used as a context for conversion.
 * @returns {number} The converted number. Returns 0 if the input value is null or undefined.
 * @private
 */
export function stringToNumber(value: string | null | undefined, containerSize: number): number {
    if (!value) { return 0; } // Return 0 instead of null to avoid type issues
    if (value.includes('%')) {
        const percentage: number = parseFloat(value);
        return isNaN(percentage) ? 0 : (containerSize / 100) * percentage;
    }
    const numberValue: number = parseFloat(value);
    return isNaN(numberValue) ? 0 : numberValue;
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
 * Modifies the given rectangle by reducing its size based on the provided thickness.
 *
 * @param {Rect} rect - The rectangle that will be adjusted in place by subtracting thickness.
 * @param {Thickness} thickness - The thickness values to subtract from each side of the rectangle.
 * @returns {Rect} - The modified rectangle with updated dimensions.
 * @private
 */
export function subtractThickness(rect: Rect, thickness: Thickness): Rect {
    rect.x += thickness.left;
    rect.y += thickness.top;
    rect.width -= thickness.left + thickness.right;
    rect.height -= thickness.top + thickness.bottom;
    return rect;
}

/**
 * Converts a degree angle into a Cartesian coordinate on a circle.
 *
 * @param {number} degree - The angle in degrees to convert.
 * @param {number} radius - The radius of the circle.
 * @param {PieChartLocationProps} center - The center coordinates of the circle.
 * @returns {PieChartLocationProps} Returns the calculated x and y coordinates on the circle's circumference.
 * @private
 */
export function degreeToLocation(degree: number, radius: number, center: PieChartLocationProps): PieChartLocationProps {
    const radian: number = (degree * Math.PI) / 180;
    return { x: Math.cos(radian) * radius + center.x, y: Math.sin(radian) * radius + center.y };
}

/**
 * Adjusts the corner radius of a pie slice based on its angular span.
 *
 * @param {number} startAngle - The starting angle of the slice in radians.
 * @param {number} endAngle - The ending angle of the slice in radians.
 * @param {number} radius - The radius of the pie slice.
 * @param {number} cornerRadius - The desired corner radius to apply.
 * @returns {number} Returns the adjusted corner radius based on the slice angle.
 * @private
 */
export function adjustCornerRadius(startAngle: number, endAngle: number, radius: number, cornerRadius: number): number {
    let anglePerSlice: number = Math.abs(endAngle - startAngle);
    if (anglePerSlice > Math.PI) {
        anglePerSlice = 2 * Math.PI - anglePerSlice;
    }
    const angleFactor: number = anglePerSlice / (2 * Math.PI);
    const adjustedCornerRadius: number = radius * angleFactor;
    return Math.min(cornerRadius, adjustedCornerRadius);
}

/**
 * Finds the index from the given id.
 *
 * @param {string} id - The id to search for.
 * @param {boolean} [isPoint=false] - Specifies if the id represents a data point (optional).
 * @returns {number} - The index found from the id.
 * @private
 */
export function indexFinder(id: string, isPoint: boolean = false): number | Index {
    let ids: string[] = ['NaN', 'NaN'];

    if (id.indexOf('_Point_') > -1) {
        ids = id.split('_Series_')[1].split('_Point_');
    }
    else if (id.indexOf('_shape_') > -1 && (!isPoint || (isPoint && id.indexOf('_legend_') === -1))) {
        ids = id.split('_shape_');
        ids[0] = '0';
    } else if (id.indexOf('_text_') > -1 && (!isPoint || (isPoint && id.indexOf('_legend_') === -1))) {
        ids = id.split('_text_');
        ids[0] = '0';
    }
    else if (id.indexOf('_datalabel_') > -1) {
        ids = id.split('_datalabel_')[1].split('_g_');
        ids[0] = ids[0].replace('Series_', '');
    }
    return isPoint
        ? { series: parseInt(ids[0], 10), point: parseInt(ids[1], 10) }
        : parseInt(ids[1], 10);
}
