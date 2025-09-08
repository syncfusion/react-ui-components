
import { TooltipTheme } from './enum';
import { ITooltipThemeStyle, PathOption, Rect, RenderOption, Size, TextStyle, TooltipLocation } from './models';


/**
 * Determines the appropriate theme styles for tooltips based on the specified theme.
 *
 * @param {TooltipTheme} theme - The current theme for which tooltip styles are needed.
 * @returns {ITooltipThemeStyle} The style properties applied to the tooltip for the current theme.
 */
export function getTooltipThemeColor(theme: TooltipTheme): ITooltipThemeStyle {
    let style: ITooltipThemeStyle;
    switch (theme) {
    case 'Material3':
        style = {
            tooltipFill: '#313033',
            tooltipBoldLabel: '#F4EFF4',
            tooltipLightLabel: '#F4EFF4',
            tooltipHeaderLine: '#F4EFF4',
            textStyle: { fontFamily: 'Roboto', color: '#F4EFF4', fontWeight: '400', size: '12px', headerTextSize: '12px', boldTextSize: '12px' }
        };
        break;
    case 'Material3Dark':
        style = {
            tooltipFill: '#E6E1E5',
            tooltipBoldLabel: '#313033',
            tooltipLightLabel: '#313033',
            tooltipHeaderLine: '#313033',
            textStyle: { fontFamily: 'Roboto', color: '#313033', fontWeight: '400', size: '12px', headerTextSize: '12px', boldTextSize: '12px' }
        };
        break;
    }
    return style;
}


/**
 * Creates a Size object with specified width and height.
 *
 * @param {number} width - The width value.
 * @param {number} height - The height value.
 * @returns {Size} A Size object with the specified dimensions.
 */
export function createSize(width: number, height: number): Size {
    return { width, height };
}

/**
 * Creates a Rect object with specified position and dimensions.
 *
 * @param {number} x - The x-coordinate of the rectangle.
 * @param {number} y - The y-coordinate of the rectangle.
 * @param {number} width - The width of the rectangle.
 * @param {number} height - The height of the rectangle.
 * @returns {Rect} A Rect object with the specified position and dimensions.
 */
export function createRect(x: number, y: number, width: number, height: number): Rect {
    return { x, y, width, height };
}

/**
 * Creates a PathOption object for path rendering.
 *
 * @param {string} id - The unique identifier for the path element.
 * @param {string} fill - The fill color for the path.
 * @param {number} opacity - The opacity value for the path.
 * @param {string} stroke - The stroke color for the path.
 * @param {number} strokeWidth - The stroke width for the path.
 * @param {string | null} dashArray - The dash array pattern for the path, or null for solid line.
 * @returns {PathOption} A PathOption object with the specified properties.
 */
export function createPathOption(
    id: string,
    fill: string,
    opacity: number,
    stroke: string,
    strokeWidth: number,
    dashArray: string | null
): PathOption {
    return { id, fill, opacity, stroke, strokeWidth, dashArray };
}

/**
 * Creates a TooltipLocation object with specified coordinates.
 *
 * @param {number} x - The x-coordinate for the tooltip.
 * @param {number} y - The y-coordinate for the tooltip.
 * @returns {TooltipLocation} A TooltipLocation object with the specified coordinates.
 */
export function createTooltipLocation(x: number, y: number): TooltipLocation {
    return { x, y };
}

/**
 * Measures the dimensions of text with specified font styles.
 *
 * @param {string} text - The text to measure.
 * @param {TextStyle} font - The font style to apply to the text.
 * @param {TextStyle} [themeFontStyle] - Optional theme font style to use as fallback.
 * @param {boolean} [isHeader] - Whether the text is a header, affecting style selection.
 * @returns {Size} The width and height of the text with the specified styles.
 */
export function measureText(
    text: string,
    font: TextStyle,
    themeFontStyle?: TextStyle,
    isHeader?: boolean
): Size {
    const htmlObject: HTMLSpanElement = document.createElement('span');
    document.body.appendChild(htmlObject);

    htmlObject.style.position = 'fixed';
    htmlObject.style.fontSize =
        font.size ||
        (isHeader ? themeFontStyle?.headerTextSize : themeFontStyle?.size) ||
        '12px';
    htmlObject.style.fontStyle =
        font.fontStyle || themeFontStyle?.fontStyle || 'normal';
    htmlObject.style.fontFamily =
        font.fontFamily || themeFontStyle?.fontFamily || 'Segoe UI';
    htmlObject.style.fontWeight =
        font.fontWeight || themeFontStyle?.fontWeight || 'normal';
    htmlObject.style.visibility = 'hidden';
    htmlObject.style.top = '-100px';
    htmlObject.style.left = '0';
    htmlObject.style.whiteSpace = 'nowrap';
    htmlObject.style.lineHeight = 'normal';

    // Handle <br> tags
    if (text.indexOf('<br>') > -1 || text.indexOf('<br/>') > -1) {
        htmlObject.innerHTML = text;
    } else {
        htmlObject.textContent = text;
    }

    const width: number = htmlObject.offsetWidth;
    const height: number = htmlObject.offsetHeight;

    document.body.removeChild(htmlObject);

    return createSize(width, height);
}

/**
 * Checks if the provided coordinates are within the bounds of the area.
 *
 * @param {number} x - The x-coordinate to check.
 * @param {number} y - The y-coordinate to check.
 * @param {Rect} areaBounds - The bounding rectangle of the area.
 * @param {number} [width=0] - The width of the area to include in the bounds check.
 * @param {number} [height=0] - The height of the area to include in the bounds check.
 * @returns {boolean} Returns true if the coordinates are within the bounds; otherwise, false.
 */
export function withInAreaBounds(
    x: number,
    y: number,
    areaBounds: Rect,
    width: number = 0,
    height: number = 0
): boolean {
    return (
        x >= areaBounds.x - width &&
        x <= areaBounds.x + areaBounds.width + width &&
        y >= areaBounds.y - height &&
        y <= areaBounds.y + areaBounds.height + height
    );
}

/**
 * Determines the path direction for tooltip rendering based on positioning parameters.
 *
 * @param {number} rX - The x-radius for rounded corners.
 * @param {number} rY - The y-radius for rounded corners.
 * @param {Rect} rect - The rectangle defining the tooltip area.
 * @param {TooltipLocation} arrowLocation - The location for the tooltip arrow.
 * @param {number} arrowPadding - The padding around the arrow.
 * @param {boolean} top - Whether the tooltip is positioned at the top.
 * @param {boolean} bottom - Whether the tooltip is positioned at the bottom.
 * @param {boolean} left - Whether the tooltip is positioned at the left.
 * @param {number} tipX - The x-coordinate of the tooltip tip.
 * @param {number} tipY - The y-coordinate of the tooltip tip.
 * @returns {string} The SVG path data for the tooltip shape.
 */
export function findDirection(
    rX: number,
    rY: number,
    rect: Rect,
    arrowLocation: TooltipLocation,
    arrowPadding: number,
    top: boolean,
    bottom: boolean,
    left: boolean,
    tipX: number,
    tipY: number
): string {
    let direction: string = '';
    const startX: number = rect.x;
    const startY: number = rect.y;
    const width: number = rect.x + rect.width;
    const height: number = rect.y + rect.height;

    if (top) {
        // Top positioning logic
        direction = `M ${startX} ${startY + rY} Q ${startX} ${startY} ${startX + rX
        } ${startY} L ${width - rX} ${startY} Q ${width} ${startY} ${width} ${startY + rY
        }`;
        direction += ` L ${width} ${height - rY} Q ${width} ${height} ${width - rX
        } ${height}`;

        if (arrowPadding !== 0) {
            direction += ` L ${arrowLocation.x + arrowPadding} ${height}`;
            direction += ` L ${tipX} ${height + arrowPadding} L ${arrowLocation.x - arrowPadding
            } ${height}`;
        }

        if (arrowLocation.x - arrowPadding > startX) {
            direction += ` L ${startX + rX
            } ${height} Q ${startX} ${height} ${startX} ${height - rY} z`;
        } else {
            if (arrowPadding === 0) {
                direction += ` L ${startX + rX
                } ${height} Q ${startX} ${height} ${startX} ${height - rY} z`;
            } else {
                direction += ` L ${startX} ${height + rY} z`;
            }
        }
    } else if (bottom) {
        // Bottom positioning logic
        direction += `M ${startX} ${startY + rY} Q ${startX} ${startY} ${startX + rX
        } ${startY} L ${arrowLocation.x - arrowPadding} ${startY}`;
        direction += ` L ${tipX} ${arrowLocation.y}`;
        direction += ` L ${arrowLocation.x + arrowPadding} ${startY}`;
        direction += ` L ${width - rX} ${startY} Q ${width} ${startY} ${width} ${startY + rY
        }`;
        direction += ` L ${width} ${height - rY} Q ${width} ${height} ${width - rX
        } ${height} L ${startX + rX} ${height} Q ${startX} ${height} ${startX} ${height - rY
        } z`;
    } else if (left) {
        // Left positioning logic
        direction += `M ${startX} ${startY + rY} Q ${startX} ${startY} ${startX + rX
        } ${startY}`;
        direction += ` L ${width - rX} ${startY} Q ${width} ${startY} ${width} ${ startY + rY
        }`;
        direction += ` L ${width} ${arrowLocation.y - arrowPadding}`;

        direction = direction + ` L ${width + arrowPadding} ${tipY}`;

        direction = direction + ` L ${width} ${arrowLocation.y + arrowPadding}`;

        direction += ` L ${width} ${height - rY} Q ${width} ${height} ${width - rX
        } ${height}`;
        direction += ` L ${startX + rX} ${height} Q ${startX} ${height} ${startX} ${height - rY
        } z`;
    } else {
        // Right positioning logic
        direction += `M ${startX + rX} ${startY} Q ${startX} ${startY} ${startX} ${startY + rY
        }`;
        direction += ` L ${startX} ${arrowLocation.y - arrowPadding}`;

        direction = direction + ` L ${startX - arrowPadding} ${tipY}`;

        direction = direction + ` L ${startX} ${arrowLocation.y + arrowPadding}`;

        direction += ` L ${startX} ${height - rY} Q ${startX} ${height} ${startX + rX
        } ${height}`;
        direction += ` L ${width - rX} ${height} Q ${width} ${height} ${width} ${height - rY
        }`;
        direction += ` L ${width} ${startY + rY} Q ${width} ${startY} ${width - rX
        } ${startY} z`;
    }

    return direction;
}

/**
 * Calculates the shape rendering options for a tooltip marker based on shape type.
 *
 * @param {TooltipLocation} location - The location coordinates for the shape.
 * @param {Size} size - The size dimensions for the shape.
 * @param {string} shape - The type of shape to render (e.g., 'Circle', 'Rectangle', 'Diamond').
 * @param {PathOption} options - The base rendering options for the shape.
 * @returns {{ renderOption: RenderOption, functionName: string }} The rendering options and function name for the shape.
 */
export function calculateShapes(
    location: TooltipLocation,
    size: Size,
    shape: string,
    options: PathOption
): { renderOption: RenderOption, functionName: string } {
    let path: string = '';
    let functionName: string = 'Path';
    const width: number = size.width;
    const height: number = size.height;
    const locX: number = location.x;
    const locY: number = location.y;

    const x: number = location.x - (width / 2);
    let updatedOptions: PathOption = { ...options };

    switch (shape) {
    case 'Circle':
    case 'Bubble':
        functionName = 'Ellipse';
        updatedOptions = {
            ...updatedOptions,
            rx: width / 2,
            ry: height / 2,
            cx: locX,
            cy: locY
        };
        break;
    case 'Plus':
        path = `M ${x} ${locY} L ${locX + width / 2} ${locY} M ${locX} ${locY + height / 2} L ${locX} ${locY - height / 2}`;
        updatedOptions = { ...updatedOptions, d: path, stroke: options.fill };
        break;
    case 'Cross':
        path = `M ${x} ${locY - height / 2} L ${locX + width / 2} ${locY + height / 2} M ${x} ${locY + height / 2} L ${locX + width / 2} ${locY - height / 2}`;
        updatedOptions = { ...updatedOptions, d: path, stroke: options.fill };
        break;
    case 'HorizontalLine':
        path = `M ${x} ${locY} L ${locX + width / 2} ${locY}`;
        updatedOptions = { ...updatedOptions, d: path, stroke: options.fill };
        break;
    case 'VerticalLine':
        path = `M ${locX} ${locY + height / 2} L ${locX} ${locY - height / 2}`;
        updatedOptions = { ...updatedOptions, d: path, stroke: options.fill };
        break;
    case 'Diamond':
        path = `M ${x} ${locY} L ${locX} ${locY - height / 2} L ${locX + width / 2} ${locY} L ${locX} ${locY + height / 2} L ${x} ${locY} z`;
        updatedOptions = { ...updatedOptions, d: path };
        break;
    case 'Rectangle':
        path = `M ${x} ${locY - height / 2} L ${locX + width / 2} ${locY - height / 2} L ${locX + width / 2} ${locY + height / 2} L ${x} ${locY + height / 2} L ${x} ${locY - height / 2} z`;
        updatedOptions = { ...updatedOptions, d: path };
        break;
    case 'Triangle':
        path = `M ${x} ${locY + height / 2} L ${locX} ${locY - height / 2} L ${locX + width / 2} ${locY + height / 2} L ${x} ${locY + height / 2} z`;
        updatedOptions = { ...updatedOptions, d: path };
        break;
    case 'InvertedTriangle':
        path = `M ${locX + width / 2} ${locY - height / 2} L ${locX} ${locY + height / 2} L ${locX - width / 2} ${locY - height / 2} L ${locX + width / 2} ${locY - height / 2} z`;
        updatedOptions = { ...updatedOptions, d: path };
        break;
    case 'Pentagon': {
        const eq: number = 72;
        let xValue: number;
        let yValue: number;
        for (let i: number = 0; i <= 5; i++) {
            xValue = (width / 2) * Math.cos((Math.PI / 180) * (i * eq));
            yValue = (height / 2) * Math.sin((Math.PI / 180) * (i * eq));
            if (i === 0) {
                path = `M ${locX + xValue} ${locY + yValue} `;
            } else {
                path += `L ${locX + xValue} ${locY + yValue} `;
            }
        }
        path += 'Z';
        updatedOptions = { ...updatedOptions, d: path };
        break;
    }
    case 'Star': {
        const cornerPoints: number = 5;
        const outerRadius: number = Math.min(width, height) / 2;
        const innerRadius: number = outerRadius / 2;
        const angle: number = Math.PI / cornerPoints;
        let starPath: string = '';
        for (let i: number = 0; i < 2 * cornerPoints; i++) {
            const radius: number = i % 2 === 0 ? outerRadius : innerRadius;
            const currentX: number = locX + radius * Math.cos(i * angle - Math.PI / 2);
            const currentY: number = locY + radius * Math.sin(i * angle - Math.PI / 2);
            starPath += (i === 0 ? 'M' : 'L') + currentX + ',' + currentY;
        }
        starPath += 'Z';
        updatedOptions = { ...updatedOptions, d: starPath };
        break;
    }
    }

    return { renderOption: updatedOptions, functionName: functionName };
}
