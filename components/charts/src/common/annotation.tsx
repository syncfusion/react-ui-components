import { HorizontalAlignment, VerticalAlignment } from '@syncfusion/react-base';

/**
 * Specifies the coordinate unit type for chart annotations. They are:
 * ```props
 * Pixel :- Positions annotations using pixel values relative to the chart container.
 * Point :- Positions annotations using axis values relative to chart data points.
 * ```
 */
export type AnnotationCoordinateUnit =
    'Pixel' |
    'Point';

/**
 * Internal result shape that mirrors the "options" pattern in stack labels.
 * We keep the existing rendering shape but compute and store all values ahead of render.
 *
 * @private
 */
export interface AnnotationRendererResults {
    id: string;
    left: number;
    top: number;
    width: number;
    height: number;
    visible: boolean;
    contentHtml: string;
    ariaLabel: string;
    role: string;
    tabIndex: number;
}

/**
 * Determines whether the given content string contains HTML markup.
 *
 * Heuristic:
 * - Trims the string and checks if it starts with "<"
 * - Verifies presence of an HTML-like tag using a regex
 *
 * @param {string | null | undefined} content - The annotation content to evaluate.
 * @returns {boolean} True if the content appears to be HTML; otherwise, false.
 * @private
 */
export function isHtmlContent(content?: string | null): boolean {
    if (!content) { return false; }
    const textElement: string = String(content).trim();
    return (textElement.startsWith('<') && /<\/?[a-z][\s\S]*>/i.test(textElement));
}

/**
 * Calculates position based on alignment parameters.
 *
 * @param {HorizontalAlignment | VerticalAlignment | undefined} alignment - Horizontal or vertical alignment
 * @param {number} size - Size value in direction to align
 * @param {number} value - Base coordinate value
 * @returns {number} Adjusted coordinate position
 * @private
 */
export function setAlignmentValue(
    alignment: HorizontalAlignment | VerticalAlignment | undefined,
    size: number,
    value: number
): number {
    switch (alignment) {
    case 'Top':
    case 'Left':
        return value - size;
    case 'Bottom':
    case 'Right':
        return value;
    case 'Center':
        return value - size / 2;
    default:
        return value;
    }
}
