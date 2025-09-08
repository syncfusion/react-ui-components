import { LabelPosition, TextOverflow, TitlePosition } from '../base/enum';
import { ChartBorderProps, ChartSeriesProps, ChartFontProps, ChartLocationProps} from '../base/interfaces';
import { getNumberFormat, HorizontalAlignment, isNullOrUndefined, merge, NumberFormatOptions } from '@syncfusion/react-base';
import { AxisTextStyle } from '../chart-axis/base';
import { extend } from '@syncfusion/react-base';
import { RectOption } from '../base/Legend-base';
import { AxisModel, Chart, ColumnProps, MarginModel, PathOptions, Points, Rect, RowProps, SeriesProperties, ChartSizeProps, TextOption, TextStyleModel, VisibleRangeProps } from '../chart-area/chart-interfaces';

/**
 * Measures the size of the given text using the specified font and theme font style.
 *
 * @param {string} text - The text to measure.
 * @param {TextStyleModel} font - The font style used for measuring the text.
 * @param {TextStyleModel} themeFontStyle - Additional theme font styles that could influence text rendering.
 * @returns {Size} The calculated size of the text, including width and height dimensions.
 * @private
 */
export function measureText(text: string, font: TextStyleModel, themeFontStyle: TextStyleModel): ChartSizeProps {
    const svg: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const textEl: SVGTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.textContent = text;

    const fontStyle: string = font.fontStyle || themeFontStyle.fontStyle;
    const fontWeight: string = font.fontWeight || themeFontStyle.fontWeight;
    const fontSize: string = font.fontSize || themeFontStyle.fontSize;
    const fontFamily: string = font.fontFamily || themeFontStyle.fontFamily;

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
 * Calculates the horizontal position of a chart title based on the alignment setting.
 *
 * @param {Rect} rect - The rectangle object representing the position and size of the container.
 * @param {Alignment} textAlignment - The settings for the title's style, including text alignment.
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
 * Trims the text to fit within the specified width.
 *
 * @param {number} maxWidth - The maximum width allowed for the text.
 * @param {string} text - The text string to trim.
 * @param {TextStyleModel} font - The font style used for the text.
 * @param {boolean} isRtlEnabled - Boolean indicating if right-to-left text is enabled.
 * @param {TextStyleModel} themeFontStyle - The theme font style.
 * @returns {string} - The trimmed text that fits within the specified width.
 * @private
 */
export function useTextTrim(
    maxWidth: number, text: string, font: TextStyleModel,
    isRtlEnabled: boolean, themeFontStyle: TextStyleModel): string {
    let label: string = text;
    let size: number = measureText(text, font, themeFontStyle).width;

    if (size > maxWidth) {
        for (let i: number = text.length - 1; i >= 0; --i) {
            label = isRtlEnabled ? '...' + text.substring(0, i) : text.substring(0, i) + '...';
            size = measureText(label, font, themeFontStyle).width;
            if (size <= maxWidth) {
                return label;
            }
        }
    }
    return label;
}

/**
 * Wraps the input text into multiple lines based on the specified maximum width and font style.
 *
 * @param {string} currentLabel - The text to be wrapped.
 * @param {number} maximumWidth - The maximum width allowed for each line of text.
 * @param {TextStyleModel} font - The font style used for rendering the text.
 * @param {boolean} isRtlEnabled - Specifies whether right-to-left text direction is enabled.
 * @param {TextStyleModel} [themeFontStyle] - The font style used as the base for the text wrapping operation.
 * @param {boolean} [clip=false] - Specifies whether text exceeding the maximum width should be clipped.
 * @param {number} [maximumLabelHeight] - The total height available for the wrapped text.
 * @returns {string[]} An array of strings representing the wrapped lines of text.
 * @private
 */
export function useTextWrap(
    currentLabel: string, maximumWidth: number, font: TextStyleModel, isRtlEnabled: boolean, themeFontStyle: TextStyleModel,
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
 * Retrieves the title text for display, considering styling and overflow settings.
 *
 * @param {string} title - The title text to be processed.
 * @param {TextStyleModel} style - The style to be applied to the title text.
 * @param {number} width - The width constraint for displaying the title.
 * @param {boolean} isRtlEnabled - Flag indicating if right-to-left text is enabled.
 * @param {TextStyleModel} themeFontStyle - Additional font styling based on the theme.
 * @param {TextOverflow} textOverflow - The overflow strategy for handling long text.
 * @returns {string[]} An array of strings representing the processed title text.
 * @private
 */
export function getTitle(
    title: string, style: TextStyleModel, width: number, isRtlEnabled: boolean,
    themeFontStyle: TextStyleModel, textOverflow: TextOverflow): string[] {
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
 * Checks if both minimum and maximum values of the axis are set.
 *
 * @param {AxisModel} axis - The axis model object containing axis properties.
 * @returns {boolean} True if both minimum and maximum values are defined; otherwise, false.
 * @private
 */
export function setRange(axis: AxisModel): boolean {
    return (axis.minimum != null && axis.maximum != null);
}

/**
 * Calculates the actual number of desired intervals for the given axis based on the available size.
 *
 * @param {ChartSizeProps} availableSize - The size available for rendering the axis, with properties for width and height.
 * @param {AxisModel} axis - The axis model object that contains properties for defining the axis.
 * @returns {number} The calculated number of intervals adjusted for the available space.
 * @private
 */
export function getActualDesiredIntervalsCount(availableSize: ChartSizeProps, axis: AxisModel): number {

    const size: number = axis.orientation === 'Horizontal' ? availableSize.width : availableSize.height;
    if (isNullOrUndefined(axis.desiredIntervals)) {
        let desiredIntervalsCount: number = (axis.orientation === 'Horizontal' ? 0.533 : 1) * (axis.maxLabelDensity as number);
        desiredIntervalsCount = Math.max((size * (desiredIntervalsCount / 100)), 1);
        return desiredIntervalsCount;
    } else {
        return axis.desiredIntervals as number;
    }
}

/**
 * Computes the logarithm of a value to the specified base.
 *
 * @param {number} value - The numerical value to compute the logarithm for.
 * @param {number} base - The base to which the logarithm should be computed.
 * @returns {number} The logarithm of the value to the specified base.
 * @private
 */
export function logBase(value: number, base: number): number {
    return Math.log(value) / Math.log(base);
}

/**
 * Determines if a value is within a specified visible range.
 *
 * @param {number} value - The value to check against the specified range.
 * @param {VisibleRangeProps} range - The range object containing minimum and maximum boundaries.
 * @returns {boolean} True if the value is within the specified range; otherwise, false.
 * @private
 */
export function withIn(value: number, range: VisibleRangeProps): boolean {
    return (value <= range.maximum) && (value >= range.minimum);
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
 * Converts a value to a coefficient relative to a specified axis.
 *
 * @param {number} value - The numerical value to convert to a coefficient.
 * @param {AxisModel} axis - The axis model containing the visible range information.
 * @returns {number} The coefficient representing the position of the value relative to the axis range.
 * @private
 */
export function valueToCoefficient(value: number, axis: AxisModel): number {
    const range: VisibleRangeProps = axis.visibleRange;
    const result: number = (value - range.minimum) / (range.delta);
    const isInverse: boolean = axis.isAxisInverse as boolean;
    return isInverse ? (1 - result) : result;
}


/**
 * Converts the first character of a string to lowercase.
 *
 * @param {string} str - The string to convert.
 * @returns {string} The converted string.
 * @private
 */
export function firstToLowerCase(str: string): string {
    return str.substr(0, 1).toLowerCase() + str.substr(1);
}

/**
 * Extracts and returns a list of visible points from the given series.
 *
 * @param {SeriesProperties} series - The series object containing an array of points.
 * @returns {Points[]} An array of visible points cloned from the series.
 * @private
 */
export function useVisiblePoints(series: SeriesProperties): Points[] {

    const points: Points[] = [];
    series.points.map((point: Points) => {
        points.push(extend({}, point) as Points);
    });
    const tempPoints: Points[] = [];
    let tempPoint: Points;
    let pointIndex: number = 0;
    for (let i: number = 0; i < points.length; i++) {
        tempPoint = points[i as number];
        if (isNullOrUndefined(tempPoint.x)) {
            continue;
        } else {
            tempPoint.index = pointIndex++;
            tempPoints.push(tempPoint);
        }
    }
    return tempPoints;
}


/**
 * Calculates the chart coordinates (in pixels) for a given data point based on the X and Y axes.
 *
 * @param {number} x - The X value of the data point.
 * @param {number} y - The Y value of the data point.
 * @param {AxisModel} xAxis - The X-axis model used to scale the X value.
 * @param {AxisModel} yAxis - The Y-axis model used to scale the Y value.
 * @param {boolean} [isInverted=false] - Optional flag indicating whether the chart is inverted (horizontal orientation).
 * @returns {ChartLocationProps} The pixel coordinates representing the location of the data point on the chart.
 * @private
 */
export function getPoint(
    x: number,
    y: number,
    xAxis: AxisModel,
    yAxis: AxisModel,
    isInverted?: boolean
): ChartLocationProps {
    x = ((xAxis.valueType === 'Logarithmic') ?
        logBase(((x > 0) ? x : Math.pow(xAxis.logBase as number, xAxis.visibleRange.minimum)), xAxis.logBase as number) : x);
    y = ((yAxis.valueType === 'Logarithmic') ?
        logBase(((y > 0) ? y : Math.pow(yAxis.logBase as number, yAxis.visibleRange.minimum)), yAxis.logBase as number) : y);
    x = valueToCoefficient(x, xAxis);
    y = valueToCoefficient(y, yAxis);
    const xLength: number = (isInverted ? xAxis.rect.height : xAxis.rect.width);
    const yLength: number = (isInverted ? yAxis.rect.width : yAxis.rect.height);
    const locationX: number = isInverted ? y * (yLength) : x * (xLength);
    const locationY: number = isInverted ? (1 - x) * (xLength) : (1 - y) * (yLength);
    return { x: locationX, y: locationY };
}

/**
 * Determines if a value is strictly inside a specified visible range, excluding the boundaries.
 *
 * @param {number} value - The numerical value to check against the specified range.
 * @param {VisibleRangeProps} range - The range object containing minimum and maximum limits.
 * @returns {boolean} True if the value is strictly within the specified range (not equal to min or max); otherwise, false.
 * @private
 */
export function inside(value: number, range: VisibleRangeProps): boolean {
    return (value < range.maximum) && (value > range.minimum);
}

/**
 * Calculates the size of text when rotated at a specified angle.
 *
 * @param {string} text - The text to measure.
 * @param {TextStyleModel} font - The font settings to be used for the text.
 * @param {number} angle - The angle at which the text is rotated.
 * @param {TextStyleModel} themeFont - The theme font settings to apply.
 * @returns {Size} The dimensions of the rotated text.
 * @private
 */
export function getRotatedTextSize(text: string, font: TextStyleModel, angle: number, themeFont: TextStyleModel): ChartSizeProps {
    const textLines: string[] = isBreakLabel(text) ? text.split('<br>') : [text];

    let maxWidth: number = 0;
    let totalHeight: number = 0;
    //let lineHeight = 0;

    for (const line of textLines) {
        const size: ChartSizeProps = measureText(line, font, themeFont);
        maxWidth = Math.max(maxWidth, size.width);
        totalHeight += size.height;
        //lineHeight = size.height; // last one used for spacing below
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
 * Calculates the maximum width and height required to display an array of text strings
 * using the specified text and default font styles.
 *
 * @param {string[]} texts - An array of text strings whose maximum size is to be determined.
 * @param {TextStyleModel} textStyle - The font style to apply to each text string.
 * @param {TextStyleModel} defaultFont - The default font style to fall back on if necessary.
 * @returns {ChartSizeProps} An object containing the maximum width and height required for the text strings.
 * @private
 */
export function getMaxTextSize(texts: string[], textStyle: TextStyleModel, defaultFont: TextStyleModel): ChartSizeProps {
    let maxWidth: number = 0;
    let maxHeight: number = 0;

    texts.forEach((text: string) => {
        const size: ChartSizeProps = measureText(text, textStyle, defaultFont);
        maxWidth = Math.max(maxWidth, size.width);
        maxHeight = Math.max(maxHeight, size.height);
    });

    return { width: maxWidth, height: maxHeight };
}

/**
 * Calculates the maximum size (width and height) of an array of text strings when rotated at a given angle.
 *
 * @param {string[]} texts - An array of text strings for which the maximum size needs to be computed.
 * @param {number} angle - The angle at which the text is to be rotated.
 * @param {TextStyleModel} textStyle - The style settings for the text.
 * @param {TextStyleModel} defaultFont - The default font styling to use.
 * @returns {ChartSizeProps} An object representing the maximum width and height of the rotated text.
 * @private
 */
export function getMaxRotatedTextSize(
    texts: string[], angle: number, textStyle: TextStyleModel, defaultFont: TextStyleModel): ChartSizeProps {
    let maxWidth: number = 0;
    let maxHeight: number = 0;
    texts.forEach((text: string) => {
        const size: ChartSizeProps = getRotatedTextSize(text, textStyle, angle, defaultFont);
        maxWidth = Math.max(maxWidth, size.width);
        maxHeight = Math.max(maxHeight, size.height);
    });

    return { width: maxWidth, height: maxHeight };
}

export const getPathLength: (d: string) => number = (d: string) => {
    // If path contains Bezier curves (spline series)
    if (d.includes('C')) {
        return approximateBezierCurveLength(d);
    }
    const commands: RegExpMatchArray | null = d.match(/[ML][^ML]*/g);
    let totalLength: number = 0;
    let prevX: number = 0;
    let prevY: number = 0;
    commands?.forEach((command: string, i: number) => {
        const coords: number[] = command.slice(1).trim().split(' ').map(Number);
        const [x, y] = coords;
        if (i === 0) {
            prevX = x;
            prevY = y;
        } else {
            totalLength += Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2));
        }
        prevX = x;
        prevY = y;
    });

    return totalLength;
};

/**
 * Calculates approximate length of a path containing Bezier curves
 *
 * @param {string} d - SVG path data
 * @returns {number} - Approximate length of the path
 * @private
 */
function approximateBezierCurveLength(d: string): number {
    // Parse path into segments
    const segments: Array<{command: string; params: number[]}> = parsePathSegments(d);
    let totalLength: number = 0;

    // Current position tracker
    let currentX: number = 0;
    let currentY: number = 0;

    for (const segment of segments) {
        const { command, params } = segment;

        switch (command) {
        case 'M': // Move to
            currentX = params[0];
            currentY = params[1];
            break;

        case 'L': {// Line to
            const dx: number = params[0] - currentX;
            const dy: number = params[1] - currentY;
            totalLength += Math.sqrt(dx * dx + dy * dy);
            currentX = params[0];
            currentY = params[1];
            break;
        }

        case 'C': // Cubic Bezier
            // Cubic Bezier has 6 params: [x1, y1, x2, y2, x, y]
            totalLength += cubicBezierLength(
                currentX, currentY,
                params[0], params[1],
                params[2], params[3],
                params[4], params[5],
                10 // Sample points - higher for better accuracy
            );
            currentX = params[4]; // End x
            currentY = params[5]; // End y
            break;
        }
    }

    return totalLength;
}

/**
 * Parse SVG path data into command segments
 *
 * @param {string} d - SVG path data
 * @returns {Array<{command: string, params: number[]}>} - Parsed segments
 * @private
 */
function parsePathSegments(d: string): Array<{command: string; params: number[]}> {
    const segments: Array<{command: string; params: number[]}> = [];
    const commands: RegExpMatchArray | [] = d.match(/([MLCc])([^MLCc]*)/g) || [];

    for (const cmd of commands) {
        const command: string = cmd[0];
        const paramStr: string = cmd.substring(1).trim();
        const params: number[] = paramStr.split(/[\s,]+/).map(Number).filter((n: number) => !isNaN(n));

        segments.push({
            command,
            params
        });
    }

    return segments;
}

/**
 * Calculate approximate length of a cubic Bezier curve using sampling
 *
 * @param {number} x0 - Start x
 * @param {number} y0 - Start y
 * @param {number} x1 - Control point 1 x
 * @param {number} y1 - Control point 1 y
 * @param {number} x2 - Control point 2 x
 * @param {number} y2 - Control point 2 y
 * @param {number} x3 - End x
 * @param {number} y3 - End y
 * @param {number} samples - Number of sample points
 * @returns {number} - Approximate curve length
 * @private
 */
function cubicBezierLength(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    samples: number
): number {
    let length: number = 0;
    let prevX: number = x0;
    let prevY: number = y0;

    // Sample points along the curve
    for (let i: number = 1; i <= samples; i++) {
        const t: number = i / samples;

        // Cubic Bezier formula
        const t1: number = 1 - t;
        const tOneThird: number = t1 * t1 * t1;
        const tOneSecondT: number = 3 * t1 * t1 * t;
        const tOneT2: number = 3 * t1 * t * t;
        const tThree: number = t * t * t;

        const x: number = tOneThird * x0 + tOneSecondT * x1 + tOneT2 * x2 + tThree * x3;
        const y: number = tOneThird * y0 + tOneSecondT * y1 + tOneT2 * y2 + tThree * y3;

        // Add distance between sample points
        const dx: number = x - prevX;
        const dy: number = y - prevY;
        length += Math.sqrt(dx * dx + dy * dy);

        prevX = x;
        prevY = y;
    }

    return length;
}

/**
 * Converts a degree value to radians.
 *
 * @param {number} degree - The degree value to convert.
 * @returns {number} - The equivalent value in radians.
 * @private
 */
export function degreeToRadian(degree: number): number {
    return degree * (Math.PI / 180);
}

/**
 * Helper function to determine whether there is an intersection between the two polygons described
 * by the lists of vertices. Uses the Separating Axis Theorem.
 *
 * @param {ChartLocationProps[]} a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon.
 * @param {ChartLocationProps[]} b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon.
 * @returns {boolean} if there is any intersection between the 2 polygons, false otherwise.
 * @private
 */
export function isRotatedRectIntersect(a: ChartLocationProps[], b: ChartLocationProps[]): boolean {
    const polygons: ChartLocationProps[][] = [a, b];
    let minA: number; let maxA: number; let projected: number; let i: number;
    let i1: number; let j: number; let minB: number; let maxB: number;

    for (i = 0; i < polygons.length; i++) {

        // for each polygon, look at each edge of the polygon, and determine if it separates
        // the two shapes
        const polygon: ChartLocationProps[] = polygons[i as number];
        for (i1 = 0; i1 < polygon.length; i1++) {

            // grab 2 vertices to create an edge
            const i2: number = (i1 + 1) % polygon.length;
            const p1: ChartLocationProps = polygon[i1 as number];
            const p2: ChartLocationProps = polygon[i2 as number];

            // find the line perpendicular to this edge
            const normal: ChartLocationProps = { x: p2.y - p1.y, y: p1.x - p2.x };

            minA = maxA = 0;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (j = 0; j < a.length; j++) {
                projected = normal.x * a[j as number].x + normal.y * a[j as number].y;
                minA = isNullOrUndefined(minA) || projected < minA ? projected : minA;
                maxA = isNullOrUndefined(maxA) || projected > maxA ? projected : maxA;
            }

            // for each vertex in the second shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            minB = maxB = 0;
            for (j = 0; j < b.length; j++) {
                projected = normal.x * b[j as number].x + normal.y * b[j as number].y;
                minB = isNullOrUndefined(minB) || projected < minB ? projected : minB;
                maxB = isNullOrUndefined(maxB) || projected > maxB ? projected : maxB;
            }
            // if there is no overlap between the projects, the edge we are looking at separates the two
            // polygons, and we know there is no overlap
            return !(maxA < minB || maxB < minA);
        }
    }
    return true;
}

/**
 * Checks if the provided coordinates are within the bounds of the rectangle.
 *
 * @param {number} x - The x-coordinate to check.
 * @param {number} y - The y-coordinate to check.
 * @param {Rect} bounds - The bounding rectangle.
 * @param {number} width - The width of the area to include in the bounds check.
 * @param {number} height - The height of the area to include in the bounds check.
 * @returns {boolean} - Returns true if the coordinates are within the bounds; otherwise, false.
 * @private
 */
export function withInBounds(x: number, y: number, bounds: Rect, width: number = 0, height: number = 0): boolean {
    return (x >= bounds.x - width && x <= bounds.x + bounds.width + width && y >= bounds.y - height
        && y <= bounds.y + bounds.height + height);
}

/**
 * Function type definition for creating rectangle options.
 *
 * @param {string} id - Unique identifier for the rectangle
 * @param {string} fill - Fill color of the rectangle
 * @param {Object} border - Border properties
 * @param {number} border.width - Width of the border
 * @param {string|null} border.color - Color of the border, can be null
 * @param {number} opacity - Opacity value between 0 and 1
 * @param {Object} rect - Rectangle dimensions and position
 * @param {number} rect.x - X coordinate of the rectangle
 * @param {number} rect.y - Y coordinate of the rectangle
 * @param {number} rect.width - Width of the rectangle
 * @param {number} rect.height - Height of the rectangle
 * @param {number} [rx] - Optional horizontal corner radius
 * @param {number} [ry] - Optional vertical corner radius
 * @param {string} [transform] - Optional transformation string
 * @param {string} [dashArray] - Optional dash array pattern for stroke
 * @returns {RectOption} A rectangle option object
 * @private
 */
type CreateRectOptionFn = (
    id: string,
    fill: string,
    border: { width: number; color: string | null },
    opacity: number,
    rect: { x: number; y: number; width: number; height: number },
    rx?: number,
    ry?: number,
    transform?: string,
    dashArray?: string
) => RectOption;

/**
 * Creates a rectangle option object with the specified properties
 * @param {string} id - Unique identifier for the rectangle
 * @param {string} fill - Fill color of the rectangle
 * @param {Object} border - Border properties
 * @param {number} border.width - Width of the border
 * @param {string|null} border.color - Color of the border, can be null
 * @param {number} opacity - Opacity value between 0 and 1
 * @param {Object} rect - Rectangle dimensions and position
 * @param {number} rect.x - X coordinate of the rectangle
 * @param {number} rect.y - Y coordinate of the rectangle
 * @param {number} rect.width - Width of the rectangle
 * @param {number} rect.height - Height of the rectangle
 * @param {number} [rx] - Optional horizontal corner radius, defaults to 0
 * @param {number} [ry] - Optional vertical corner radius, defaults to 0
 * @param {string} [transform] - Optional transformation string, defaults to empty string
 * @param {string} [dashArray] - Optional dash array pattern for stroke, defaults to empty string
 * @returns {RectOption} A rectangle option object with all properties configured
 * @private
 */
export const createRectOption: CreateRectOptionFn = (
    id: string,
    fill: string,
    border: { width: number; color: string | null },
    opacity: number,
    rect: { x: number; y: number; width: number; height: number },
    rx?: number,
    ry?: number,
    transform?: string,
    dashArray?: string
) => ({
    id,
    fill,
    stroke: border.width !== 0 && border.color ? border.color : 'transparent',
    strokeWidth: border.width,
    strokeDasharray: dashArray ?? '',
    opacity,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    rx: rx as number,
    ry: ry as number,
    transform: transform as string,
    d: ''
});

/**
 * Sets the color of a data point.
 *
 * @param {Points} point - The data point.
 * @param {string} color - The fallback/default color to use.
 * @returns {string} The computed color for the point.
 * @private
 */
export function setPointColor(
    point: Points,
    color: string
): string {
    color = point.interior || color;
    return color;
}

/**
 * Sets the border color of a data point.
 *
 * @param {Points} point - The data point for which to set the border color.
 * @param {ChartBorderProps} border - The border color to set.
 * @returns {ChartBorderProps} - The updated border color.
 * @private
 */
export function setBorderColor(point: Points, border: ChartBorderProps): ChartBorderProps {
    border.width = point && point.isEmpty ? ((point.series as SeriesProperties)?.emptyPointSettings?.border?.width || border.width) :
        border.width;
    border.width = Math.max(0, border.width!);
    border.color = point && point.isEmpty ? ((point.series as SeriesProperties)?.emptyPointSettings?.border?.color || border.color) :
        border.color;
    border.color = border.color || 'transparent';
    return border;
}

/**
 * Calculates the shapes based on the specified parameters.
 *
 * @param {ChartLocation} location - The location for the shape.
 * @param {Size} size - The size of the shape.
 * @param {string} shape - The type of shape.
 * @param {PathOptions} options - Additional options for the path.
 * @param {string} url - A URL for the shape if applicable.
 * @returns {PathOptions} The calculated shapes.
 * @private
 */
export const calculateShapes: (
    location: ChartLocationProps,
    size: ChartSizeProps,
    shape: string,
    options: PathOptions,
    url: string
) => PathOptions | Element = (
    location: ChartLocationProps,
    size: ChartSizeProps,
    shape: string,
    options: PathOptions,
    url: string
): PathOptions | Element => {
    let dir: string;
    const width: number = size.width;
    const height: number = size.height;
    const lx: number = location.x;
    const ly: number = location.y;
    const y: number = location.y + (-height / 2);
    const x: number = location.x + (-width / 2);
    const eq: number = 72;
    let xVal: number;
    let yVal: number;
    switch (shape) {
    case 'Bubble':
    case 'Circle':
        merge(options, { 'rx': width / 2, 'ry': height / 2, 'cx': lx, 'cy': ly });
        break;
    case 'Plus':
        dir = 'M' + ' ' + x + ' ' + ly + ' ' + 'L' + ' ' + (lx + (width / 2)) + ' ' + ly + ' ' +
                        'M' + ' ' + lx + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + lx + ' ' +
                        (ly + (-height / 2));
        merge(options, { 'd': dir });
        break;
    case 'Cross':
        dir = 'M' + ' ' + x + ' ' + (ly + (-height / 2)) + ' ' + 'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' +
                        'M' + ' ' + x + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (-height / 2));
        merge(options, { 'd': dir });
        break;
    case 'Multiply':
        dir = 'M ' + (lx) + ' ' + (ly) + ' L ' +
                        (lx) + ' ' + (ly) + ' M ' +
                        (lx) + ' ' + (ly) + ' L ' + (lx) + ' ' + (ly);
        merge(options, { 'd': dir, stroke: options.fill });
        break;
    case 'HorizontalLine':
        dir = 'M' + ' ' + x + ' ' + ly + ' ' + 'L' + ' ' + (lx + (width / 2)) + ' ' + ly;
        merge(options, { 'd': dir });
        break;
    case 'VerticalLine':
        dir = 'M' + ' ' + lx + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + lx + ' ' + (ly + (-height / 2));
        merge(options, { 'd': dir });
        break;
    case 'Diamond':
        dir = 'M' + ' ' + x + ' ' + ly + ' ' +
                        'L' + ' ' + lx + ' ' + (ly + (-height / 2)) + ' ' +
                        'L' + ' ' + (lx + (width / 2)) + ' ' + ly + ' ' +
                        'L' + ' ' + lx + ' ' + (ly + (height / 2)) + ' ' +
                        'L' + ' ' + x + ' ' + ly + ' z';
        merge(options, { 'd': dir });
        break;
    case 'Rectangle':
    case 'Hilo':
    case 'HiloOpenClose':
    case 'Candle':
    case 'Waterfall':
    case 'BoxAndWhisker':
    case 'StepArea':
    case 'RangeStepArea':
    case 'StackingStepArea':
    case 'Square':
    case 'Flag':
        dir = 'M' + ' ' + x + ' ' + (ly + (-height / 2)) + ' ' +
                        'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (-height / 2)) + ' ' +
                        'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' +
                        'L' + ' ' + x + ' ' + (ly + (height / 2)) + ' ' +
                        'L' + ' ' + x + ' ' + (ly + (-height / 2)) + ' z';
        merge(options, { 'd': dir });
        break;
    case 'Pyramid':
    case 'Triangle':
        dir = 'M' + ' ' + x + ' ' + (ly + (height / 2)) + ' ' +
                        'L' + ' ' + lx + ' ' + (ly + (-height / 2)) + ' ' +
                        'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' +
                        'L' + ' ' + x + ' ' + (ly + (height / 2)) + ' z';
        merge(options, { 'd': dir });
        break;
    case 'Funnel':
    case 'InvertedTriangle':
        dir = 'M' + ' ' + (lx + (width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                        'L' + ' ' + lx + ' ' + (ly + (height / 2)) + ' ' +
                        'L' + ' ' + (lx - (width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                        'L' + ' ' + (lx + (width / 2)) + ' ' + (ly - (height / 2)) + ' z';
        merge(options, { 'd': dir });
        break;
    case 'Pentagon':
        dir = '';
        for (let i: number = 0; i <= 5; i++) {
            xVal = (width / 2) * Math.cos((Math.PI / 180) * (i * eq));
            yVal = (height / 2) * Math.sin((Math.PI / 180) * (i * eq));
            if (i === 0) {
                dir = 'M' + ' ' + (lx + xVal) + ' ' + (ly + yVal) + ' ';
            } else {
                dir = dir.concat('L' + ' ' + (lx + xVal) + ' ' + (ly + yVal) + ' ');
            }
        }
        dir = dir.concat('Z');
        merge(options, { 'd': dir });
        break;
    case 'Image':
        merge(options, { 'href': url, 'height': height, 'width': width, x: x, y: y });
        break;
    case 'Star': {
        const cornerPoints: number = 5;
        const outerRadius: number = Math.min(width, height) / 2;
        const innerRadius: number = outerRadius / 2;
        const angle: number = Math.PI / cornerPoints;
        let starPath: string = '';
        for (let i: number = 0; i < 2 * cornerPoints; i++) {
            const radius: number = (i % 2 === 0) ? outerRadius : innerRadius;
            const currentX: number = lx + radius * Math.cos(i * angle - Math.PI / 2);
            const currentY: number = ly + radius * Math.sin(i * angle - Math.PI / 2);
            starPath += (i === 0 ? 'M' : 'L') + currentX + ',' + currentY;
        }
        starPath += 'Z';
        merge(options, { 'd': starPath });
        break;
    }
    }
    options = calculateLegendShapes(location, { width: width, height: height }, shape, options);
    return options;
};

/**
 * Calculates the legend shapes based on the provided parameters.
 *
 * @param {ChartLocationProps} location - The location for the shape.
 * @param {Size} size - The size of the shape.
 * @param {string} shape - The type of shape.
 * @param {PathOptions} options - Additional options for the path.
 * @returns {PathOptions} - The calculated legend shape.
 * @private
 */
export const calculateLegendShapes: (
    location: ChartLocationProps, size: ChartSizeProps, shape: string, options: PathOptions) => PathOptions =
        (location: ChartLocationProps, size: ChartSizeProps, shape: string, options: PathOptions): PathOptions => {
            const padding: number = 10;
            let dir: string = '';
            const space: number = 2;
            const height: number = size.height;
            const width: number = size.width;
            const lx: number = location.x;
            const ly: number = location.y;
            switch (shape) {
            case 'Line':
            case 'StackingLine':
            case 'StackingLine100':
                dir = 'M' + ' ' + (lx + (-width * (3 / 4))) + ' ' + (ly) + ' ' +
                        'L' + ' ' + (lx + (width * (3 / 4))) + ' ' + (ly);
                merge(options, { 'd': dir });
                break;
            case 'StepLine':
                options.fill = 'transparent';
                dir = 'M' + ' ' + (lx + (-width / 2) - (padding / 4)) + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + (lx +
                        (-width / 2) + (width / 10)) + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + (lx + (-width / 2) + (width / 10))
                        + ' ' + (ly) + ' ' + 'L' + ' ' + (lx + (-width / 10)) + ' ' + (ly) + ' ' + 'L' + ' ' + (lx + (-width / 10))
                        + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + (lx + (width / 5)) + ' ' + (ly + (height / 2)) + ' ' + 'L' +
                        ' ' + (lx + (width / 5)) + ' ' + (ly + (-height / 2)) + ' ' + 'L' + ' ' + (lx + (width / 2)) + ' ' + (ly +
                            (-height / 2)) + 'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' + 'L' + '' + (lx + (width / 2)
                                + (padding / 4)) + ' ' + (ly + (height / 2));
                merge(options, { 'd': dir });
                break;
            case 'UpArrow':
                options.fill = options.stroke;
                options.stroke = 'transparent';
                dir = 'M' + ' ' + (lx + (-width / 2)) + ' ' + (ly + (height / 2)) + ' ' +
                        'L' + ' ' + (lx) + ' ' + (ly - (height / 2)) + ' ' +
                        'L' + ' ' + (lx + (width / 2)) + ' ' + (ly + (height / 2)) +
                        'L' + ' ' + (lx + (width / 2) - space) + ' ' + (ly + (height / 2)) + ' ' +
                        'L' + ' ' + (lx) + ' ' + (ly - (height / 2) + (2 * space)) +
                        'L' + (lx - (width / 2) + space) + ' ' + (ly + (height / 2)) + ' Z';
                merge(options, { 'd': dir });
                break;
            case 'DownArrow':
                options.fill = options.stroke;
                options.stroke = 'transparent';
                dir = 'M' + ' ' + (lx - (width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                        'L' + ' ' + (lx) + ' ' + (ly + (height / 2)) + ' ' +
                        'L' + ' ' + (lx + (width / 2)) + ' ' + (ly - (height / 2)) +
                        'L' + ' ' + (lx + (width / 2) - space) + ' ' + (ly - (height / 2)) + ' ' +
                        'L' + ' ' + (lx) + ' ' + (ly + (height / 2) - (2 * space)) +
                        'L' + (lx - (width / 2) + space) + ' ' + (ly - (height / 2)) + ' Z';
                merge(options, { 'd': dir });
                break;
            case 'RightArrow':
                options.fill = options.stroke;
                options.stroke = 'transparent';
                dir = 'M' + ' ' + (lx + (-width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                        'L' + ' ' + (lx + (width / 2)) + ' ' + (ly) + ' ' + 'L' + ' ' +
                        (lx + (-width / 2)) + ' ' + (ly + (height / 2)) + ' L' + ' ' + (lx + (-width / 2)) + ' ' +
                        (ly + (height / 2) - space) + ' ' + 'L' + ' ' + (lx + (width / 2) - (2 * space)) + ' ' + (ly) +
                        ' L' + (lx + (-width / 2)) + ' ' + (ly - (height / 2) + space) + ' Z';
                merge(options, { 'd': dir });
                break;
            case 'LeftArrow':
                options.fill = options.stroke;
                options.stroke = 'transparent';
                dir = 'M' + ' ' + (lx + (width / 2)) + ' ' + (ly - (height / 2)) + ' ' +
                        'L' + ' ' + (lx + (-width / 2)) + ' ' + (ly) + ' ' + 'L' + ' ' +
                        (lx + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' +
                        (lx + (width / 2)) + ' ' + (ly + (height / 2) - space) + ' L' + ' ' + (lx + (-width / 2) + (2 * space))
                        + ' ' + (ly) + ' L' + (lx + (width / 2)) + ' ' + (ly - (height / 2) + space) + ' Z';
                merge(options, { 'd': dir });
                break;
            case 'Column':
            case 'StackingColumn':
            case 'StackingColumn100':
                dir = 'M' + ' ' + (lx - 3 * (width / 5)) + ' ' + (ly - (height / 5)) + ' ' + 'L' + ' ' +
                        (lx + 3 * (-width / 10)) + ' ' + (ly - (height / 5)) + ' ' + 'L' + ' ' +
                        (lx + 3 * (-width / 10)) + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' ' + (lx - 3 *
                            (width / 5)) + ' ' + (ly + (height / 2)) + ' ' + 'Z' + ' ' + 'M' + ' ' +
                        (lx + (-width / 10) - (width / 20)) + ' ' + (ly - (height / 4) - (padding / 2))
                        + ' ' + 'L' + ' ' + (lx + (width / 10) + (width / 20)) + ' ' + (ly - (height / 4) -
                            (padding / 2)) + ' ' + 'L' + ' ' + (lx + (width / 10) + (width / 20)) + ' ' + (ly
                                + (height / 2)) + ' ' + 'L' + ' ' + (lx + (-width / 10) - (width / 20)) + ' ' + (ly +
                                    (height / 2)) + ' ' + 'Z' + ' ' + 'M' + ' ' + (lx + 3 * (width / 10)) + ' ' + (ly) + ' ' +
                        'L' + ' ' + (lx + 3 * (width / 5)) + ' ' + (ly) + ' ' + 'L' + ' '
                        + (lx + 3 * (width / 5)) + ' ' + (ly + (height / 2)) + ' ' + 'L' + ' '
                        + (lx + 3 * (width / 10)) + ' ' + (ly + (height / 2)) + ' ' + 'Z';
                merge(options, { 'd': dir });
                break;
            case 'Bar':
            case 'StackingBar':
            case 'StackingBar100':
                dir = 'M' + ' ' + (lx + (-width / 2) + (-padding / 4)) + ' ' + (ly - 3 * (height / 5)) + ' '
                        + 'L' + ' ' + (lx + 3 * (width / 10)) + ' ' + (ly - 3 * (height / 5)) + ' ' + 'L' + ' ' +
                        (lx + 3 * (width / 10)) + ' ' + (ly - 3 * (height / 10)) + ' ' + 'L' + ' ' +
                        (lx - (width / 2) + (-padding / 4)) + ' ' + (ly - 3 * (height / 10)) + ' ' + 'Z' + ' '
                        + 'M' + ' ' + (lx + (-width / 2) + (-padding / 4)) + ' ' + (ly - (height / 5)
                            + (padding / 20)) + ' ' + 'L' + ' ' + (lx + (width / 2) + (padding / 4)) + ' ' + (ly
                                - (height / 5) + (padding / 20)) + ' ' + 'L' + ' ' + (lx + (width / 2) + (padding / 4))
                        + ' ' + (ly + (height / 10) + (padding / 20)) + ' ' + 'L' + ' ' + (lx - (width / 2)
                            + (-padding / 4)) + ' ' + (ly + (height / 10) + (padding / 20)) + ' ' + 'Z' + ' ' + 'M'
                        + ' ' + (lx - (width / 2) + (-padding / 4)) + ' ' + (ly + (height / 5)
                            + (padding / 10)) + ' ' + 'L' + ' ' + (lx + (-width / 4)) + ' ' + (ly + (height / 5)
                                + (padding / 10)) + ' ' + 'L' + ' ' + (lx + (-width / 4)) + ' ' + (ly + (height / 2)
                                    + (padding / 10)) + ' ' + 'L' + ' ' + (lx - (width / 2) + (-padding / 4))
                        + ' ' + (ly + (height / 2) + (padding / 10)) + ' ' + 'Z';
                merge(options, { 'd': dir });
                break;
            case 'Spline':
                options.fill = 'transparent';
                dir = 'M' + ' ' + (lx - (width / 2)) + ' ' + (ly + (height / 5)) + ' ' + 'Q' + ' '
                        + lx + ' ' + (ly - height) + ' ' + lx + ' ' + (ly + (height / 5))
                        + ' ' + 'M' + ' ' + lx + ' ' + (ly + (height / 5)) + ' ' + 'Q' + ' ' + (lx
                            + (width / 2)) + ' ' + (ly + (height / 2)) + ' ' + (lx + (width / 2)) + ' '
                        + (ly - (height / 2));
                merge(options, { 'd': dir });
                break;
            case 'Area':
                dir = 'M' + ' ' + (lx - (width / 2) - (padding / 4)) + ' ' + (ly + (height / 2))
                        + ' ' + 'L' + ' ' + (lx + (-width / 4) + (-padding / 8)) + ' ' + (ly - (height / 2))
                        + ' ' + 'L' + ' ' + (lx) + ' ' + (ly + (height / 4)) + ' ' + 'L' + ' ' + (lx
                            + (width / 4) + (padding / 8)) + ' ' + (ly + (-height / 2) + (height / 4)) + ' '
                        + 'L' + ' ' + (lx + (height / 2) + (padding / 4)) + ' ' + (ly + (height / 2)) + ' ' + 'Z';
                merge(options, { 'd': dir });
                break;
            case 'SplineArea':
                dir = 'M' + ' ' + (lx - (width / 2)) + ' ' + (ly + (height / 5)) + ' ' + 'Q' + ' ' + lx
                        + ' ' + (ly - height) + ' ' + lx + ' ' + (ly + (height / 5)) + ' ' + 'Z' + ' ' + 'M'
                        + ' ' + lx + ' ' + (ly + (height / 5)) + ' ' + 'Q' + ' ' + (lx + (width / 2)) + ' '
                        + (ly + (height / 2)) + ' ' + (lx + (width / 2)) + ' '
                        + (ly - (height / 2)) + ' ' + ' Z';
                merge(options, { 'd': dir });
                break;
            }
            return options;
        };


/**
 * Draws a symbol at the specified location.
 *
 * @param {ChartLocationProps} location - The location to draw the symbol.
 * @param {string} shape - The shape of the symbol.
 * @param {Size} size - The size of the symbol.
 * @param {string} url - The URL of the image symbol.
 * @param {PathOptions} options - The options for drawing the symbol.
 * @returns {Element} - The element representing the drawn symbol.
 * @private
 */
export function drawSymbol(
    location: ChartLocationProps, shape: string, size: ChartSizeProps, url: string, options: PathOptions
): Element {
    const shapeOption: PathOptions | Element = calculateShapes(location, size, shape, options, url);
    return shapeOption as Element;
}
/**
 * Compares two data sources for equality.
 *
 * @param {any} a - The first data source to compare.
 * @param {any} b - The second data source to compare.
 * @returns {boolean} True if the data sources are equal, false otherwise.
 * @private
 */
export function areDataSourcesEqual(a: any, b: any): any {
    if (!a || !b || a.length !== b.length) { return false; }
    return a.every((point: Points, i: number) => point.x === b[i as number].x && point.y === b[i as number].y);
}

/**
 * Trims the text and performs line breaks based on the maximum width and font settings.
 *
 * @param {number} maxWidth - The maximum width allowed for the text.
 * @param {string} text - The text to be trimmed.
 * @param {AxisTextStyle} font - The font settings for the text.
 * @param {TextStyleModel} themeFontStyle - Optional. The font style based on the theme.
 * @returns {string[]} - An array of trimmed text lines with line breaks.
 * @private
 */
export function lineBreakLabelTrim(maxWidth: number, text: string, font: AxisTextStyle, themeFontStyle: TextStyleModel): string[] {
    const labelCollection: string[] = [];
    const breakLabels: string[] = text.split('<br>');
    for (let i: number = 0; i < breakLabels.length; i++) {
        text = breakLabels[i as number];
        let size: number = measureText(text, font as TextStyleModel, themeFontStyle).width;
        void((size > maxWidth) ? (
            (() => {
                const textLength: number = text.length;
                for (let i: number = textLength - 1; i >= 0; --i) {
                    text = text.substring(0, i) + '...';
                    size = measureText(text, font as TextStyleModel, themeFontStyle).width;
                    if (size <= maxWidth) {
                        labelCollection.push(text);
                        break;
                    }
                }
            })()
        ) : labelCollection.push(text));

    }
    return labelCollection;
}

/**
 * Gets the rectangle location constrained by the outer boundary
 *
 * @param {ChartLocationProps} startLocation - The starting location of the rectangle
 * @param {ChartLocationProps} endLocation - The ending location of the rectangle
 * @param {Rect} outerRect - The outer rectangle boundary
 * @returns {Rect} The constrained rectangle
 * @private
 */
export function getRectLocation(startLocation: ChartLocationProps, endLocation: ChartLocationProps, outerRect: Rect): Rect {
    const x: number = (endLocation.x < outerRect.x) ? outerRect.x :
        (endLocation.x > (outerRect.x + outerRect.width)) ? outerRect.x + outerRect.width : endLocation.x;
    const y: number = (endLocation.y < outerRect.y) ? outerRect.y :
        (endLocation.y > (outerRect.y + outerRect.height)) ? outerRect.y + outerRect.height : endLocation.y;

    return ({
        x: (x > startLocation.x ? startLocation.x : x),
        y: (y > startLocation.y ? startLocation.y : y),
        width: Math.abs(x - startLocation.x),
        height: Math.abs(y - startLocation.y)
    }
    );
}

/**
 * Returns the value constrained within the specified minimum and maximum limits.
 *
 * @param {number} value - The input value.
 * @param {number} min - The minimum limit.
 * @param {number} max - The maximum limit.
 * @returns {number} - The constrained value.
 * @private
 */
export function minMax(value: number, min: number, max: number): number {
    return value > max ? max : (value < min ? min : value);
}

/**
 * Checks if zooming is enabled for the axis.
 *
 * @param {AxisModel} axis - The axis to check for zooming.
 * @returns {boolean} - Returns true if zooming is enabled for the axis, otherwise false.
 * @private
 */
export function isZoomSet(axis: AxisModel): boolean {
    return ((axis.zoomFactor as number) < 1 && (axis.zoomPosition as number) >= 0);
}
/**
 * Calculates the minimum points delta between data points on the provided axis.
 *
 * @param {AxisModel} axis - The axis for which to calculate the minimum points delta.
 * @param {Series[]} seriesCollection - The collection of series in the chart.
 * @returns {number} The minimum points delta.
 * @private
 */
export function getMinPointsDelta(axis: AxisModel, seriesCollection: SeriesProperties[]): number {
    let minDelta: number = Number.MAX_VALUE;
    let xValues: (number | null)[];
    let minVal: number;
    let seriesMin: number;
    const stackingGroups: string[] = [];

    for (let index: number = 0; index < seriesCollection.length; index++) {
        const series: SeriesProperties = seriesCollection[index as number];
        xValues = [];
        if (series.visible &&
            (axis.name === series.xAxisName || (axis.name === 'primaryXAxis' && series.xAxisName === null)
                || (axis.name === series.chart.axisCollection[0].name && !series.xAxisName))) {
            xValues = series.points.map((point: Points) => {
                return point.xValue;
            });
            xValues.sort((first: number | null, second: number | null) => {
                if (first === null && second === null) { return 0; }
                if (first === null) { return -1; }
                if (second === null) { return 1; }
                return first - second;
            });
            if (xValues.length === 1) {
                if (axis.valueType === 'Category') {
                    const minValue: number = series.xAxis.visibleRange.minimum;
                    const delta: number = (xValues[0] as number) - minValue;
                    minDelta = delta !== 0 ? Math.min(minDelta, delta) : minDelta;
                } else if (axis.valueType === 'DateTime') {
                    const timeOffset: number = seriesCollection.length === 1 ? 25920000 : 2592000000;
                    seriesMin = (series.xMin === series.xMax) ? (series.xMin - timeOffset) : series.xMin;
                    minVal = (xValues[0] as number) - (!isNullOrUndefined(seriesMin) ? seriesMin : axis.visibleRange.minimum);
                    minDelta = minVal !== 0 ? Math.min(minDelta, minVal) : minDelta;
                } else {
                    seriesMin = series.xMin;
                    minVal = (xValues[0] as number) - (!isNullOrUndefined(seriesMin) ?
                        seriesMin : axis.visibleRange.minimum);
                    if (minVal !== 0) {
                        minDelta = Math.min(minDelta, minVal);
                    }
                }
            } else {
                for (let i: number = 0; i < xValues.length; i++) {
                    const value: number | null = xValues[i as number];
                    if (i > 0 && value) {
                        minVal = series.type && series.type.indexOf('Stacking') > -1 && axis.valueType === 'Category' ?
                            stackingGroups.length : (value as number) - (xValues[(i as number) - 1] as number);
                        if (minVal !== 0) {
                            minDelta = Math.min(minDelta, minVal);
                        }
                    }
                }
            }
        }
    }
    if (minDelta === Number.MAX_VALUE) {
        minDelta = 1;
    }
    return minDelta;
}

/**
 * Checks if the given value is within the range of the provided axis.
 *
 * @param {number} value - The value to check against the axis range.
 * @param {AxisModel} axis - The axis model containing the range to check against.
 * @returns {number} The original value if it's within range, or the closest boundary value if outside the range.
 * @private
 */
export function logWithIn(value: number, axis: AxisModel): number {
    return axis.valueType === 'Logarithmic' ? logBase(value, axis.logBase as number) : value;
}

/**
 * Checks if a point is within the range of the previous and next points in a series.
 *
 * @param {Points} previousPoint - The previous point in the series.
 * @param {Points} currentPoint - The current point to check.
 * @param {Points} nextPoint - The next point in the series.
 * @param {Series} series - The series to which the points belong.
 * @returns {boolean} - A boolean indicating if the point is within the range.
 * @private
 */
export function withInRange(previousPoint: Points, currentPoint: Points, nextPoint: Points, series: SeriesProperties): boolean {
    if (series.chart.delayRedraw && series.chart.enableAnimation) {
        return true;
    }
    const mX2: number = logWithIn(currentPoint.xValue || 0, series.xAxis);
    const mX1: number = previousPoint ? logWithIn(previousPoint.xValue || 0, series.xAxis) : mX2;
    const mX3: number = nextPoint ? logWithIn(nextPoint.xValue || 0, series.xAxis) : mX2;
    const xStart: number = Math.floor(series.xAxis.visibleRange.minimum as number);
    const xEnd: number = Math.ceil(series.xAxis.visibleRange.maximum as number);
    return ((mX1 >= xStart && mX1 <= xEnd) || (mX2 >= xStart && mX2 <= xEnd) ||
        (mX3 >= xStart && mX3 <= xEnd) || (xStart >= mX1 && xStart <= mX3));
}

/**
 * Creates a rectangle with the specified position and size.
 *
 * @param {number} x - The x-coordinate of the rectangle's top-left corner.
 * @param {number} y - The y-coordinate of the rectangle's top-left corner.
 * @param {number} width - The width of the rectangle.
 * @param {number} height - The height of the rectangle.
 * @returns {Rect} The rectangle object containing x, y, width, and height.
 * @private
 */
const createRect: (x: number, y: number, width: number, height: number) =>
Rect = (x: number, y: number, width: number, height: number): Rect => ({
    x, y, width, height
});

/**
 * Calculates the rectangle to be used for rendering a label or element,
 * considering location, text size, and margin.
 *
 * @param {ChartLocationProps} location - The location object containing x and y coordinates.
 * @param {Size} textSize - The size of the text as a Size object (width and height).
 * @param {MarginModel} margin - The margin values as a MarginModel object (left, right, top, bottom).
 * @returns {Rect} The computed rectangle based on given parameters.
 * @private
 */
export function calculateRect(location: ChartLocationProps, textSize: ChartSizeProps, margin: MarginModel): Rect {
    return createRect(
        location.x - (textSize.width / 2) - margin.left,
        location.y - (textSize.height / 2) - margin.top,
        textSize.width + margin.left + margin.right,
        textSize.height + margin.top + margin.bottom
    );
}

/**
 * Gets the array of formatted data label text(s) for the given data point and series.
 *
 * @param {Points} currentPoint - The current data point.
 * @param {SeriesProperties} series - The properties of the series to which the point belongs.
 * @param {Chart} chart - The chart object for accessing locale and formatting options.
 * @returns {string[]} An array of text strings for the data label(s) of the point.
 * @private
 */
export function getDataLabelText(currentPoint: Points, series: SeriesProperties, chart: Chart): string[] {
    const labelFormat: string = (series.marker?.dataLabel?.format
        ? series.marker.dataLabel.format : series.yAxis.labelStyle.format) as string;
    const text: string[] = [];
    const customLabelFormat: boolean = labelFormat.match('{value}') !== null;
    switch (series.seriesType) {
    case 'XY':
        text.push(currentPoint.text || (currentPoint.yValue as number).toString());
        if ((labelFormat) && !currentPoint.text) {
            const option: NumberFormatOptions = {
                locale: chart.locale,
                useGrouping: false,
                format: customLabelFormat ? '' : labelFormat
            };
            series.yAxis.format = getNumberFormat(option);
            for (let i: number = 0; i < text.length; i++) {
                text[i as number] = customLabelFormat ? labelFormat.replace('{value}', series.yAxis.format(parseFloat(text[i as number]))) :
                    series.yAxis.format(parseFloat(text[i as number]));
            }
        }
        return text;
    default:
        // Add default case to ensure all code paths return a value
        return text;
    }
}

/**
 * Retrieves the points of a rectangle.
 *
 * @param {Rect} rect - The rectangle whose points are to be retrieved.
 * @returns {ChartLocationProps[]} - The points of the rectangle.
 * @private
 */
export function getRectanglePoints(rect: Rect): ChartLocationProps[] {
    const loc1: ChartLocationProps = {x: rect.x, y: rect.y};
    const loc2: ChartLocationProps = {x: rect.x + rect.width, y: rect.y};
    const loc3: ChartLocationProps = {x: rect.x + rect.width, y: rect.y + rect.height};
    const loc4: ChartLocationProps = {x: rect.x, y: rect.y + rect.height};
    return [loc1, loc2, loc3, loc4];
}

/**
 * Gets the visible points from the given series by filtering out points with null or undefined x value.
 * Assigns a continuous index to each visible point.
 *
 * @param {SeriesProperties} series - The series object containing the points array.
 * @returns {Points[]} An array of visible Points with updated index.
 * @private
 */
export function getVisiblePoints(series: SeriesProperties): Points[] {
    const points: Points[] = series.points;
    const tempPoints: Points[] = [];
    let tempPoint: Points;
    let pointIndex: number = 0;
    for (let i: number = 0; i < points.length; i++) {
        tempPoint = points[i as number];
        void(isNullOrUndefined(tempPoint.x) || (tempPoint.index = pointIndex++, tempPoints.push(tempPoint)));
        continue;
    }
    return tempPoints;
}

/**
 * Checks whether a given rectangle collides with any rectangle in the provided collection,
 * considering an offset by the given clipping rectangle.
 *
 * @param {Rect} rect - The rectangle to check for collision.
 * @param {Rect[]} collections - An array of rectangles to check against.
 * @param {Rect} clipRect - The clipping rectangle whose x and y are used as offsets.
 * @returns {boolean} True if a collision is detected; otherwise, false.
 * @private
 */
export function isCollide(rect: Rect, collections: Rect[], clipRect: Rect): boolean {
    const currentRect: Rect = {x: rect.x + clipRect.x, y: rect.y + clipRect.y, width: rect.width, height: rect.height};
    const isCollide: boolean = collections.some((rect: Rect) => {
        return (currentRect.x < rect.x + rect.width && currentRect.x + currentRect.width > rect.x &&
            currentRect.y < rect.y + rect.height && currentRect.height + currentRect.y > rect.y);
    });
    return isCollide;
}

/**
 * Checks whether any of the given label rectangle coordinates overlap with the chart area boundary.
 * The input label locations are offset using the clip rectangle before boundary check.
 *
 * @param {ChartLocationProps[]} rectCoordinates - Array of chart locations (label center points).
 * @param {Chart} chart - The chart object (to access chart area rectangle).
 * @param {Rect} clip - The clip rectangle, its x and y used as offset to the label positions.
 * @returns {boolean} True if any label rectangle is out of chart bounds; otherwise, false.
 * @private
 */
export function isDataLabelOverlapWithChartBound(rectCoordinates: ChartLocationProps[], chart: Chart, clip: Rect): boolean {
    for (let index: number = 0; index < rectCoordinates.length; index++) {
        if (!withInBounds(rectCoordinates[index as number].x + clip.x,
                          rectCoordinates[index as number].y + clip.y, chart.chartAreaRect)) {
            return true;
        }
    }
    return false;
}

/**
 * Rotates the size of text based on the provided angle.
 *
 * @param {Font} font - The font style of the text.
 * @param {string} text - The text to be rotated.
 * @param {number} angle - The angle of rotation.
 * @param {Chart | Chart3D} chart - The chart instance.
 * @param {Font} themeFontStyle - The font style based on the theme.
 * @returns {Size} - The rotated size of the text.
 * @private
 */
export function rotateTextSize(
    font: ChartFontProps, text: string, angle: number, chart: Chart, themeFontStyle: ChartFontProps): ChartSizeProps {
    const svg: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const textEl: SVGTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    const textCollection: string[] = [];
    let labelText: string = '';

    labelText = isBreakLabel(text)
        ? text.split('<br>')[0]
        : text as string;

    textEl.textContent = labelText;

    const fontStyle: string = font.fontStyle as string;
    const fontWeight: string = font.fontWeight as string;
    const fontSize: string = font.fontSize as string;
    const fontFamily: string = font.fontFamily as string;
    textEl.setAttribute('id', 'rotate_text');
    textEl.style.fontStyle = fontStyle;
    textEl.style.fontWeight = fontWeight;
    textEl.style.fontSize = fontSize;
    textEl.style.fontFamily = fontFamily;
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('transform', `rotate(${angle}, 0, 0)`);
    textEl.setAttribute('x', `${chart.chartAreaRect.x}`);
    textEl.setAttribute('y', `${chart.chartAreaRect.y}`);

    // Handle multi-line text with tspan elements
    if (textCollection.length > 1) {
        textEl.textContent = '';

        for (let i: number = 0; i < textCollection.length; i++) {
            const tspanEl: SVGTSpanElement = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspanEl.textContent = textCollection[i as number];
            tspanEl.setAttribute('x', '0');

            if (i === 0) {
                tspanEl.setAttribute('dy', '0');
            } else {

                const height: number = measureText(textCollection[i as number],
                                                   font as TextStyleModel, themeFontStyle as TextStyleModel).height;
                tspanEl.setAttribute('dy', height.toString());
            }

            textEl.appendChild(tspanEl);
        }
    }

    svg.appendChild(textEl);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', `${chart.chartAreaRect.width}`);
    svg.setAttribute('height', `${chart.chartAreaRect.height}`);


    document.body.appendChild(svg);
    const bbox: DOMRect = textEl.getBoundingClientRect();
    document.body.removeChild(svg);

    return { width: bbox.width, height: bbox.height };
}

/**
 * Represents the result of a text element creation operation.
 * This interface contains all necessary properties to render text in SVG.
 *
 * @private
 */
interface TextElementResult {
    /**
     * Contains rendering options for the text element.
     */
    renderOptions: {
        /** Optional identifier for the text element */
        id?: string | number;
        /** X-coordinate position for the text */
        x: number;
        /** Y-coordinate position for the text */
        y: number;
        /** Fill color for the text */
        fill: string;
        /** Font size for the text */
        'font-size': string | number;
        /** Font style (normal, italic, etc.) */
        'font-style': string;
        /** Font family name */
        'font-family': string;
        /** Font weight (normal, bold, numeric values) */
        'font-weight': string | number;
        /** Optional text anchor position (start, middle, end) */
        'text-anchor'?: string;
        /** Optional rotation angle for the label */
        labelRotation?: number;
        /** Optional SVG transform attribute value */
        transform?: string;
        /** Optional opacity value */
        opacity?: number;
        /** Optional dominant-baseline attribute value */
        'dominant-baseline'?: string;
    };
    /** The text content to be displayed */
    text: string;
    /** X-coordinate translation offset */
    transX: number;
    /** Y-coordinate translation offset */
    transY: number;
}

/**
 * Creates and returns the rendering options and actual text content for an SVG/text label in the chart.
 *
 * @param {TextOption} option - The text element configuration, including position, id, text, anchor, etc.
 * @param {Font} font - The font style options to apply (size, family, style, weight, opacity).
 * @param {string} color - The color to use for the text fill.
 * @param {boolean} isMinus - If true and text is an array, selects the last element; otherwise, uses the first. Used for special minus handling.
 * @param {Rect} [seriesClipRect] - Optional clipping rectangle, used for calculating translated X/Y coordinates for the text.
 * @param {boolean} [isDataLabelWrap] - Optional flag, if true applies additional centering logic (for wrapped data labels).
 * @returns {TextElementResult} An object containing the SVG render options, the actual text content, and translation values.
 * @private
 */
export function textElement(
    option: TextOption, font: ChartFontProps, color: string,
    isMinus: boolean = false,
    seriesClipRect?: Rect,
    isDataLabelWrap?: boolean
): TextElementResult | TextOption {
    let renderOptions: TextElementResult['renderOptions'] = {
        x: 0,
        y: 0,
        fill: '',
        'font-size': '',
        'font-style': '',
        'font-family': '',
        'font-weight': ''
    };
    const width: number = 0;

    const maxWidth: number = 0;

    const dx: number = (option.text!.length > 1 && isDataLabelWrap) ? (option.x! + maxWidth / 2 - width / 2) : option.x as number;
    renderOptions = {
        'id': option.id,
        'x': dx,
        'y': option.y,
        'fill': color ? color : 'black',
        'font-size': font.fontSize as string,
        'font-style': font.fontStyle as string,
        'font-family': font.fontFamily as string,
        'font-weight': font.fontWeight as string,
        'text-anchor': option.anchor,
        'labelRotation': option.labelRotation,
        'transform': option.transform,
        'opacity': font.opacity,
        'dominant-baseline': option.baseLine
    };
    const text: string = typeof option.text === 'string' ? option.text : isMinus ? option.text![option.text!.length - 1] : option.text![0];
    const transX: number = seriesClipRect?.x as number;
    const transY: number = seriesClipRect?.y as number;
    return {renderOptions, text, transX, transY};
}
/**
 * Interface representing stack values for chart rendering.
 *
 * @private
 */
export interface StackValuesType {
    /**
     * Start values of the stack
     */
    startValues?: number[];

    /**
     * End values of the stack
     */
    endValues?: number[];
}

/**
 * Finds the collection of series based on the column, row, and stack status.
 *
 * @param {Column} column - The column object containing axes details.
 * @param {Row} row - The row object containing axes details.
 * @param {boolean} isStack - Specifies whether the series are stacked.
 * @returns {Series[]} - Returns a collection of series.
 * @private
 */
export function findSeriesCollection(column: ColumnProps, row: RowProps, isStack: boolean): SeriesProperties[] {
    const seriesCollection: SeriesProperties[] = [];

    for (const rowAxis of row.axes) {
        for (const rowSeries of rowAxis.series) {
            for (const axis of column.axes) {
                for (const series of axis.series) {
                    if (series === rowSeries && series.visible && isRectangularSeriesType(series, isStack)) {
                        seriesCollection.push(series);
                    }
                }
            }
        }
    }

    return seriesCollection;
}

/**
 * Checks if the series in the chart are rectangular.
 *
 * @param {Series} series - The series to be checked.
 * @param {boolean} isStack - Specifies whether the series are stacked.
 * @returns {boolean} - Returns true if the series in the chart are rectangular, otherwise false.
 * @private
 */
export function isRectangularSeriesType(series: SeriesProperties, isStack: boolean): boolean {
    const type: string = (series.type ?? '').toLowerCase();
    return (
        type.includes('column') || type.includes('bar') || isStack
    );
}

/**
 * Gets the label position based on the position index
 *
 * @param {number} positionIndex - Index of the position in the positions array
 * @returns {LabelPosition} The corresponding label position or 'Top' as default
 * @private
 */
export function getPosition(positionIndex: number): LabelPosition {
    const positions: LabelPosition[] = ['Outer', 'Top', 'Bottom', 'Middle', 'Auto'];
    return positions[positionIndex as number] || 'Top';
}

/**
 * Checks if any visible series exists before the specified index.
 * Used to determine if a series should be keyboard focusable with tabindex.
 *
 * @param {ChartSeriesProps[]} visibleSeries - Array of series to check
 * @param {number} index - The index position to check against
 * @returns {boolean} Returns true if any visible series exists before the specified index
 * @private
 */
export function checkTabindex(visibleSeries: ChartSeriesProps[], index: number): boolean {
    for (let i: number = 0; i < index; i++) {
        if (visibleSeries[i as number].visible) {
            return true;
        }
    }
    return false;
}
