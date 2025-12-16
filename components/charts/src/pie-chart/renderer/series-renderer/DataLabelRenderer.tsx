import { getNumberFormat, isNullOrUndefined } from '@syncfusion/react-base';
import { degreeToLocation, measureText, stringToNumber, subtractThickness } from '../../utils/helper';
import { ConnectorProps, PieChartDataLabelProps, PieChartMarginProps, PieChartSizeProps, PieChartBorderProps, PieChartFontProps, PieChartLocationProps, PieDataLabelContentFunction, PieChartDataLabelFormatterProps } from '../../base/interfaces';
import { Chart, PieBase, Points, Rect, SeriesProperties, TextRenderOptions } from '../../base/internal-interfaces';
import { PieLabelPosition } from '../../base/enum';
import { useTextTrim } from './series-helper';

// Utilities to derive readable text color similar to chart renderer
interface RGB { r: number; g: number; b: number }

/**
 * Converts a CSS color name into a concrete color string (hex or rgb).
 * Falls back to the computed style when a named color is provided.
 *
 * @param {string} colorName - The input CSS color name or color string.
 * @returns {string} A color string in hex or rgb/rgba format.
 * @private
 */
export function colorNameToHex(colorName: string): string {
    if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(colorName)) { return colorName; }
    if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(colorName) ||
        /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|0\.[0-9]{1,3}|1|1\.0{1,3})\s*\)$/.test(colorName)) {
        return colorName;
    }
    const element: HTMLDivElement = document.createElement('div');
    element.style.color = colorName;
    document.body.appendChild(element);
    const computedColor: string = window.getComputedStyle(element).color;
    document.body.removeChild(element);
    return computedColor || colorName;
}

/**
 * Converts a hex or rgb/rgba color string into an RGB object.
 *
 * @param {string} color - Color in hex (e.g., #RRGGBB or #RGB) or rgb/rgba string.
 * @returns {RGB} An object with red, green, and blue components.
 * @private
 */
export function convertHexToColor(color: string): RGB {
    let r: number = 0; let g: number = 0; let b: number = 0;
    if (color?.startsWith('rgb')) {
        const clean: string = color.replace(/[rgba()\s]/g, '');
        const parts: string[] = clean.split(',');
        if (parts.length >= 3) {
            r = parseInt(parts[0], 10) || 0;
            g = parseInt(parts[1], 10) || 0;
            b = parseInt(parts[2], 10) || 0;
            return { r, g, b };
        }
    }
    const hex: string = (color || '').replace('#', '');
    if (hex.length === 3) {
        r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
        g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
        b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else {
        r = parseInt(hex.substring(0, 2), 16) || 0;
        g = parseInt(hex.substring(2, 4), 16) || 0;
        b = parseInt(hex.substring(4, 6), 16) || 0;
    }
    return { r, g, b };
}

/**
 * Determines a readable text color for a given background color.
 *
 * Uses perceived luminance weighting (299/587/114) to choose between
 * dark and light text so that labels remain legible across themes and
 * background fills. This mirrors the logic used in chart data labels.
 *
 * @param {string} bg - Background color as hex or rgb/rgba string
 * @returns {string} Contrasting text color hex string
 */
const chooseReadableText: (bg: string) => string = (bg: string): string => {
    const rgb: RGB = convertHexToColor(colorNameToHex(bg));
    const Lr: number = 299; const Lg: number = 587; const Lb: number = 114; const D: number = 1000;
    const contrast: number = Math.round((rgb.r * Lr + rgb.g * Lg + rgb.b * Lb) / D);
    return contrast >= 128 ? '#49454E' : '#CAC4D0';
};

/**
 * Applies a custom content callback to modify the data label text (Pie).
 *
 * @param {string} text - Current formatted label text
 * @param {number} index - The index of the data point associated with the label.
 * @param {PieChartDataLabelProps} dataLabel Pie data label configuration object to which the label belongs.
 * @returns {string} - The modified label content after applying callback.
 * @private
 */
function applyPieDataLabelContentCallback(
    text: string,
    index: number,
    dataLabel: PieChartDataLabelProps
): string {
    const contentCallback: PieDataLabelContentFunction = dataLabel?.formatter as PieDataLabelContentFunction;
    if (contentCallback && typeof contentCallback === 'function') {
        try {
            const args: PieChartDataLabelFormatterProps = { index, text };
            return contentCallback(args);
        } catch {
            return text;
        }
    }
    return text;
}

/**
 * Renders data labels for all visible points in the visible circular series.
 *
 * @param {Chart} accumulation - The chart instance containing series and pie configuration.
 * @param {SeriesProperties} series - The visible series whose data labels are rendered.
 * @returns {void}
 *
 * @private
 */
export function renderDataLabels(accumulation: Chart, series: SeriesProperties): void {
    findAreaRect(series, accumulation);
    series.leftSidePoints = [];
    series.rightSidePoints = [];
    const firstQuarter: Points[] = [];
    const secondQuarter: Points[] = [];
    for (const point of series.points) {
        if (point.visible) {
            if (series.dataLabel?.showZero || (!series.dataLabel?.showZero && ((point.y !== 0) || (point.y === 0 &&
                series.emptyPointSettings?.mode === 'Zero')))) {
                renderDataLabel(
                    point, series.dataLabel as PieChartDataLabelProps, accumulation
                );
            }
        }
        if (point.originalMidAngle >= 90 && point.originalMidAngle <= 270) {
            series.leftSidePoints.push(point);
        } else {
            if (point.originalMidAngle >= 0 && point.originalMidAngle <= 90) {
                secondQuarter.push(point);
            } else {
                firstQuarter.push(point);
            }
        }
    }
    firstQuarter.sort((a: Points, b: Points) => a.originalMidAngle - b.originalMidAngle);
    secondQuarter.sort((a: Points, b: Points) => a.originalMidAngle - b.originalMidAngle);
    series.leftSidePoints.sort((a: Points, b: Points) => a.originalMidAngle - b.originalMidAngle);
    series.rightSidePoints = firstQuarter.concat(secondQuarter);
    if (accumulation.smartLabels && series.dataLabel?.visible) {
        const modifiedPoints: Points[] =
            series.leftSidePoints.concat(series.rightSidePoints).sort((a: Points, b: Points) => a.index - b.index);
        for (const p of modifiedPoints) {
            if (!isNullOrUndefined(p.argsData) && !isNullOrUndefined(p.y)) {
                finalizeDatalabels(p, modifiedPoints, series.dataLabel, series);
            }
        }
    }
}

/**
 * Computes the drawable area rectangle for data labels after applying chart margins.
 *
 * @param {SeriesProperties} series - The series to update with computed areaRect.
 * @param {Chart} accumulation - The chart instance containing margin and size.
 * @returns {void}
 *
 * @private
 */
function findAreaRect(series: SeriesProperties, accumulation: Chart): void {
    series.areaRect = { x: 0, y: 0, width: accumulation.availableSize.width, height: accumulation.availableSize.height };
    const margin: PieChartMarginProps = accumulation.margin;
    subtractThickness(series.areaRect, {
        left: margin.left as number, right: margin.right as number,
        top: margin.top as number, bottom: margin.bottom as number
    });
}

/**
 * Creates and caches the per-point data label options such as text, style and initial size.
 *
 * @param {Points} point - The data point for which the label is created.
 * @param {PieChartDataLabelProps} dataLabel - Data label settings.
 * @param {Chart} accumulation - The chart instance used for measuring and theme font.
 * @returns {void}
 *
 * @private
 */
function renderDataLabel(
    point: Points, dataLabel: PieChartDataLabelProps, accumulation: Chart
): void {
    const border: PieChartBorderProps = { width: dataLabel.border?.width, color: dataLabel.border?.color };
    point.label = getDatalabelText(dataLabel.format as string, point.originalText || point.y.toString());
    const isInside: boolean = (dataLabel.position as PieLabelPosition) === 'Inside';
    const theme: string = (accumulation as Chart).theme || '';
    const defaultBgForTheme: string = (theme.indexOf('Dark') > -1) ? 'black' : 'white';
    const chartBg: string = ((accumulation as Chart).background && (accumulation as Chart).background !== 'transparent')
        ? (accumulation as Chart).background as string
        : (((accumulation as Chart).background !== 'transparent' && (accumulation as Chart).background) || defaultBgForTheme);

    const bgForContrast: string = (dataLabel.fill && String(dataLabel.fill).toLowerCase() !== 'transparent')
        ? (dataLabel.fill as string)
        : (isInside ? (point.color as string) : chartBg);

    const computedFont: PieChartFontProps = { ...(dataLabel.font as PieChartFontProps) };
    if (!computedFont.color || computedFont.color === 'inherit') {
        computedFont.color = chooseReadableText(bgForContrast);
    }

    const argsData: TextRenderOptions = {
        series: accumulation.visibleSeries[0], point: point,
        text: point.label, border: border, color: dataLabel.fill as string,
        font: computedFont as PieChartFontProps
    };
    const customText: string = applyPieDataLabelContentCallback(argsData.text, point.index, dataLabel);
    if (typeof customText === 'string') {
        argsData.text = customText;
    }
    //accumulation.trigger(textRender, argsData);
    point.argsData = argsData;
    //const isTemplate: boolean = argsData.template !== null;
    point.labelVisible = true;
    point.text = point.label = argsData.text;
    point.labelCollection = [];
    point.marginValue = argsData.border.width ? (5 + argsData.border.width) : 1;
    calculateLabelSize(point, dataLabel, accumulation);
}

/**
 * Resolves the display text for a label using the provided format and numeric formatting.
 *
 * @param {string} labelFormat - Label format string. Supports "{value}" token for numeric values.
 * @param {string} labelText - Raw label text or numeric value as string.
 * @returns {string} - The formatted label text.
 */
function getDatalabelText(labelFormat: string, labelText: string): string {
    if (Number(labelText)) {
        const customLabelFormat: boolean = labelFormat.match('{value}') !== null;
        const format: Function = getNumberFormat({
            format: customLabelFormat ? '' : labelFormat
        });
        labelText = customLabelFormat ? labelFormat.replace('{value}', format(parseFloat(labelText))) : format(parseFloat(labelText));
    }
    return labelText;
}

/**
 * Calculates label text collection and size, then computes position and final region.
 *
 * @param {Points} point - The point whose data label size is calculated.
 * @param {PieChartDataLabelProps} dataLabel - Data label settings.
 * @param {Chart} accumulation - Chart for measurement context.
 * @returns {void}
 *
 * @private
 */
function calculateLabelSize(point: Points, dataLabel: PieChartDataLabelProps, accumulation: Chart): void {
    calculateLabelCollection(point, dataLabel, accumulation);
    const textSize: PieChartSizeProps = getTextSize(point.labelCollection, dataLabel, accumulation);
    textSize.height += 4;
    textSize.width += 4;
    point.textSize = textSize;
    getDataLabelPosition(point, dataLabel, textSize, accumulation);
    if (point.labelRegion) {
        correctLabelRegion(point.labelRegion, point.textSize);
    }
}
/**
 * Applies padding correction to label region and text size to avoid visual overlap with borders.
 *
 * @param {Rect} labelRegion - The computed label rectangle to be adjusted.
 * @param {PieChartSizeProps} textSize - Measured text size to be adjusted.
 * @param {number} [padding=4] - Padding to subtract from region and text size.
 * @returns {void}
 *
 * @private
 */
function correctLabelRegion(labelRegion: Rect, textSize: PieChartSizeProps, padding: number = 4): void {
    labelRegion.height -= padding;
    labelRegion.width -= padding;
    labelRegion.x += padding / 2;
    labelRegion.y += padding / 2;
    textSize.height -= padding;
    textSize.width -= padding;
}

/**
 * Computes the radial position of a label (inside/outside) and resolves smart label if enabled.
 *
 * @param {Points} point - Target point.
 * @param {PieChartDataLabelProps} dataLabel - Data label settings.
 * @param {PieChartSizeProps} textSize - Measured text size with padding.
 * @param {Chart} accumulation - Chart with pie configuration.
 * @returns {void}
 *
 * @private
 */
function getDataLabelPosition(
    point: Points, dataLabel: PieChartDataLabelProps, textSize: PieChartSizeProps, accumulation: Chart): void {
    let radius: number;
    if (!isVariousRadius(accumulation)) {
        if ((dataLabel.position as PieLabelPosition) === 'Inside') {
            radius = accumulation.pieSeries.labelRadius;
        } else {
            const connectorLen: number = stringToNumber((dataLabel.connectorStyle?.length || '4%'), accumulation.pieSeries.size / 2);
            radius = accumulation.pieSeries.pieBaseRadius + connectorLen;
        }
    } else {
        if ((dataLabel.position as PieLabelPosition) === 'Inside') {
            const outer: number = stringToNumber(point.sliceRadius, accumulation.pieSeries.pieBaseRadius);
            const inner: number = accumulation.pieSeries.innerRadius;
            radius = (((outer - inner) / 2) + inner);
        } else {
            const connectorLen: number = stringToNumber((dataLabel.connectorStyle?.length || '4%'), accumulation.pieSeries.size / 2);
            radius = stringToNumber(point.sliceRadius, accumulation.pieSeries.size / 2) + connectorLen;
        }
    }

    if (accumulation.titleSettings?.title) {
        const titleSize: PieChartSizeProps = measureText(accumulation.titleSettings.title[0], accumulation.titleSettings.textStyle,
                                                         accumulation.themeStyle.datalabelFont as PieChartFontProps);
        accumulation.visibleSeries[0].titleRect = {
            x: accumulation.availableSize.width / 2 - titleSize.width / 2,
            y: accumulation.margin.top,
            width: titleSize.width, height: titleSize.height
        };
    }

    getLabelRegion(point, dataLabel.position as PieLabelPosition, textSize, radius, point.marginValue, accumulation);
    point.labelAngle = point.originalMidAngle;
    point.labelPosition = dataLabel.position as PieLabelPosition;
    if (accumulation.smartLabels) {
        getSmartLabel(point, dataLabel, textSize, accumulation.visibleSeries[0].points, accumulation);
    }
}

/**
 * Computes the rectangular region for the label at a given radial distance and angle.
 *
 * @param {Points} point - Target point.
 * @param {PieLabelPosition} position - Label position (Inside/Outside).
 * @param {PieChartSizeProps} textSize - Text size including padding.
 * @param {number} labelRadius - Radial distance at which to place the label.
 * @param {number} margin - Margin applied around text.
 * @param {Chart} accumulation - Chart for center and radius.
 * @param {number} [endAngle=0] - Optional explicit angle to place outside labels.
 * @returns {void}
 *
 * @private
 */
function getLabelRegion(
    point: Points, position: PieLabelPosition, textSize: PieChartSizeProps,
    labelRadius: number, margin: number, accumulation: Chart, endAngle: number = 0): void {
    const labelAngle: number = endAngle || point.originalMidAngle;
    const space: number = 20;

    const location: PieChartLocationProps = degreeToLocation(
        labelAngle, labelRadius, accumulation.pieSeries.center as PieChartLocationProps);
    const labelWidth: number = textSize.width + (margin * 2);
    const labelHeight: number = textSize.height + (margin * 2);
    if (position === 'Inside') {
        point.labelRegion = {
            x: location.x - (labelWidth / 2),
            y: location.y - (labelHeight / 2),
            width: labelWidth,
            height: labelHeight
        };
    } else {
        point.labelRegion = {
            x: location.x,
            y: location.y,
            width: labelWidth,
            height: labelHeight
        };
    }

    if (position === 'Outside') {
        point.labelRegion.y -= point.labelRegion.height / 2;
        if (labelAngle >= 90 && labelAngle <= 270) {
            point.labelRegion.x -= (point.labelRegion.width + space);
        } else {
            point.labelRegion.x += space;
        }
    }
}

/**
 * Builds the label text collection (single or multiple lines) and computes trimming based on max width.
 *
 * @param {Points} point - Target point.
 * @param {PieChartDataLabelProps} dataLabel - Data label settings.
 * @param {Chart} accumulation - Chart context for measuring and layout.
 * @returns {void}
 *
 * @private
 */
function calculateLabelCollection(point: Points, dataLabel: PieChartDataLabelProps, accumulation: Chart): void {
    if (!isNullOrUndefined(point.argsData.template)) {
        return;
    }
    const position: PieLabelPosition = point.labelPosition || dataLabel.position;
    const labelRadius: number = (!isVariousRadius(accumulation) ? accumulation.pieSeries.labelRadius :
        getLabelRadius(accumulation.visibleSeries[0], point));
    const radius: number = !isVariousRadius(accumulation) ? (accumulation.pieSeries.radius - accumulation.pieSeries.innerRadius) :
        getLabelRadius(accumulation.visibleSeries[0], point);
    const location: PieChartLocationProps = degreeToLocation(point.originalMidAngle, labelRadius, accumulation.pieSeries.center);
    const padding: number = 20;
    let maxWidth: number = dataLabel.maxLabelWidth as number;
    if (!maxWidth) {
        if (position === 'Outside') {
            maxWidth = (location.x >= (accumulation.pieSeries.center?.x as number)) ?
                (accumulation.visibleSeries[0].areaRect.x + accumulation.visibleSeries[0].areaRect.width - location.x) :
                (location.x - accumulation.visibleSeries[0].areaRect.x);
        }
        else {
            maxWidth = (radius - padding);
        }
    }
    if ((point.label.indexOf('<br>') !== -1)) {
        point.labelCollection = point.label.split('<br>');
    }
    else {
        point.labelCollection[0] = useTextTrim(maxWidth, point.label, point.argsData.font, accumulation.enableRtl,
                                               accumulation.themeStyle.datalabelFont as PieChartFontProps);
    }
}

/**
 * Indicates whether the series uses per-point radius mapping (various radius pie).
 *
 * @param {Chart} accumulation - The chart containing pie series configuration.
 * @returns {boolean} - True if various radius is enabled; otherwise, false.
 */
function isVariousRadius(accumulation: Chart): boolean {
    return accumulation.pieSeries.isRadiusMapped;
}

/**
 * Gets the effective label radius for a point considering inside/outside positions and connector length.
 *
 * @param {SeriesProperties} series - Series settings.
 * @param {Points} point - Target point.
 * @returns {number} - The computed label radius.
 */
function getLabelRadius(series: SeriesProperties, point: Points): number {
    return series.dataLabel?.position === 'Inside' ?
        ((((stringToNumber(point.sliceRadius, series.chart.pieSeries.pieBaseRadius) -
            series.chart.pieSeries.innerRadius)) / 2) + series.chart.pieSeries.innerRadius) :
        (stringToNumber(point.sliceRadius, series.chart.pieSeries.size / 2) + stringToNumber(
            series.dataLabel?.connectorStyle?.length || '4%', series.chart.pieSeries.size / 2));

}

/**
 * Calculates the combined width and height for a label's text collection.
 *
 * @param {string[]} labelCollection - The lines of text to render.
 * @param {PieChartDataLabelProps} dataLabel - Data label settings including font and maxWidth.
 * @param {Chart} accumulation - Chart context for theme font.
 * @returns {PieChartSizeProps} - The measured width and height.
 */
function getTextSize(labelCollection: string[], dataLabel: PieChartDataLabelProps, accumulation: Chart): PieChartSizeProps {
    let height: number = 0;
    const font: PieChartFontProps = dataLabel.font as PieChartFontProps;
    let width: number = dataLabel.maxLabelWidth ? dataLabel.maxLabelWidth : 0;
    let textSize: PieChartSizeProps;
    for (let i: number = 0; i < labelCollection.length; i++) {
        textSize = measureText(labelCollection[i as number], font, accumulation.themeStyle.datalabelFont as PieChartFontProps);
        width = Math.max(textSize.width, width);
        height += textSize.height;
    }
    if (dataLabel.maxLabelWidth) {
        width = dataLabel.maxLabelWidth;
    }
    return ({ width: width, height: height });
}

/**
 * Applies smart label logic to avoid overlapping by switching to outside and/or adjusting angle.
 *
 * @param {Points} point - Target point whose label is being arranged.
 * @param {PieChartDataLabelProps} dataLabel - Data label settings.
 * @param {PieChartSizeProps} textSize - Label text size with padding.
 * @param {Points[]} points - All points for collision checks.
 * @param {Chart} accumulation - Chart context.
 * @returns {void}
 *
 * @private
 */
function getSmartLabel(
    point: Points, dataLabel: PieChartDataLabelProps, textSize: PieChartSizeProps,
    points: Points[], accumulation: Chart): void {
    let labelRadius: number = accumulation.pieSeries.radius;
    const connectorLength: string = dataLabel.connectorStyle?.length || '4%';
    labelRadius += stringToNumber(connectorLength, labelRadius);
    let previousPoint: Points = findPreviousPoint(points, point.index, point.labelPosition) as Points;
    if (dataLabel.position === 'Inside') {
        point.labelRegion.height -= 4;
        point.labelRegion.width -= 4;
        if (previousPoint && previousPoint.labelRegion && !dataLabel.enableRotation &&
            (isOverlap(point.labelRegion, previousPoint.labelRegion)
                || isOverlapping(point, points)) && point.region && point.labelRegion && !containsRect(point.region, point.labelRegion)) {
            point.labelPosition = 'Outside';
            calculateLabelCollection(point, dataLabel, accumulation);
            textSize = getTextSize(point.labelCollection, dataLabel, accumulation);
            textSize.height += 4;  // 4 for calculation with padding for smart label shape
            textSize.width += 4;
            point.textSize = textSize;
            getLabelRegion(point, point.labelPosition, textSize, labelRadius, point.marginValue, accumulation);
            previousPoint = findPreviousPoint(points, point.index, point.labelPosition) as Points;
            if (previousPoint && (isOverlap(point.labelRegion, previousPoint.labelRegion) ||
                isConnectorLineOverlapping(point, previousPoint, accumulation))) {
                setOuterSmartLabel(previousPoint, point, dataLabel.border?.width as number,
                                   labelRadius, textSize, point.marginValue, accumulation);
            }
        }
    } else {
        if (previousPoint && previousPoint.labelRegion && (isOverlap(point.labelRegion, previousPoint.labelRegion)
            || isOverlapping(point, points) || isConnectorLineOverlapping(point, previousPoint, accumulation))) {
            setOuterSmartLabel(previousPoint, point, dataLabel.border?.width as number,
                               labelRadius, textSize, point.marginValue, accumulation);
        }
    }
}

/**
 * Adjusts the angle of outside labels to avoid overlap with previous labels and connectors.
 *
 * @param {Points} previousPoint - The previous visible point on the same side.
 * @param {Points} point - Current point.
 * @param {number} border - Border width used for spacing.
 * @param {number} labelRadius - Radial distance for outside labels.
 * @param {PieChartSizeProps} textsize - Label size with padding.
 * @param {number} margin - Margin around the label.
 * @param {Chart} accumulation - Chart context.
 * @returns {void}
 *
 * @private
 */
function setOuterSmartLabel(
    previousPoint: Points, point: Points, border: number, labelRadius: number,
    textsize: PieChartSizeProps, margin: number, accumulation: Chart): void {
    let labelAngle: number = getOverlappedAngle(
        previousPoint.labelRegion, point.labelRegion, point.originalMidAngle, border * 2, accumulation);
    getLabelRegion(point, 'Outside', textsize, labelRadius, margin, accumulation, labelAngle);
    if (labelAngle > point.endAngle) {
        labelAngle = point.originalMidAngle;
    }
    point.labelAngle = labelAngle;
    while (point.labelVisible && (isOverlap(previousPoint.labelRegion, point.labelRegion) || labelAngle <= previousPoint.labelAngle
        || labelAngle <= point.originalMidAngle * 0.9 || isConnectorLineOverlapping(point, previousPoint, accumulation))) {
        if (labelAngle > point.endAngle) {
            break;
        }
        point.labelAngle = labelAngle;
        getLabelRegion(point, 'Outside', textsize, labelRadius, margin, accumulation, labelAngle);
        labelAngle += 0.1;
    }
}

/**
 * Gets the previous point that is visible and has a label at the same position (Inside/Outside).
 *
 * @param {Points[]} points - All series points.
 * @param {number} index - Current point index.
 * @param {PieLabelPosition} position - Target label position to match.
 * @returns {Points | null} - The previous matching point or null.
 */
function findPreviousPoint(points: Points[], index: number, position: PieLabelPosition): Points | null {
    let point: Points = points[0];
    for (let i: number = index - 1; i >= 0; i--) {
        point = points[i as number];
        if (point.visible && point.labelVisible && point.labelRegion && point.labelPosition === position) {
            return point;
        }
    }
    return null;
}

/**
 * Computes an alternate angle to place the outside label when two label regions overlap.
 *
 * @param {Rect} first - The region of the previous label.
 * @param {Rect} second - The region of the current label (mutable for y adjustment).
 * @param {number} angle - Current angle.
 * @param {number} padding - Additional padding between labels.
 * @param {Chart} accumulation - Chart context for center reference.
 * @returns {number} - The computed angle in degrees.
 */
function getOverlappedAngle(first: Rect, second: Rect, angle: number, padding: number, accumulation: Chart): number {
    let x: number = first.x;
    if (angle >= 90 && angle <= 270) {
        second.y = first.y - (padding + second.height / 2);
        x = first.x + first.width;
    } else {
        second.y = first.y + first.height + padding;
    }
    return getAngle(accumulation.pieSeries.center, { x: x, y: second.y });
}

/**
 * Converts a vector from center to point into a clockwise degree angle in [0,360).
 *
 * @param {PieChartLocationProps} center - Center point.
 * @param {PieChartLocationProps} point - Target point.
 * @returns {number} - Angle in degrees.
 *
 * @private
 */
export function getAngle(center: PieChartLocationProps, point: PieChartLocationProps): number {
    let angle: number = Math.atan2((point.y - center.y), (point.x - center.x));
    angle = angle < 0 ? (6.283 + angle) : angle;
    return angle * (180 / Math.PI);
}

/**
 * Checks if the specified rect overlap each other.
 *
 * @param {Rect} currentRect - The first rect.
 * @param {Rect} rect - The second rect.
 * @returns {boolean} - Returns true if the rect overlap; otherwise, false.
 *
 * @private
 */
export function isOverlap(currentRect: Rect, rect: Rect): boolean {
    return (currentRect.x < rect.x + rect.width && currentRect.x + currentRect.width > rect.x &&
        currentRect.y < rect.y + rect.height && currentRect.height + currentRect.y > rect.y);
}

/**
 * Checks if the given point's label region overlaps with any previous visible label region.
 *
 * @param {Points} currentPoint - Current point whose label region is checked.
 * @param {Points[]} points - All points.
 * @returns {boolean} - True if overlapping with any previous label region; otherwise, false.
 */
function isOverlapping(currentPoint: Points, points: Points[]): boolean {
    for (let i: number = currentPoint.index - 1; i >= 0; i--) {
        if (points[i as number].visible && points[i as number].labelVisible &&
            points[i as number].labelRegion && currentPoint.labelRegion &&
            currentPoint.labelVisible && isOverlap(currentPoint.labelRegion, points[i as number].labelRegion)) {
            return true;
        }
    }
    return false;
}

/**
 * Checks if the connector lines between start and label regions intersect with current or previous labels.
 *
 * @param {Points} point - Current point.
 * @param {Points} previous - Previous point on the same side.
 * @param {Chart} accumulation - Chart context.
 * @returns {boolean} - True if any connector intersects a label region; otherwise, false.
 */
function isConnectorLineOverlapping(point: Points, previous: Points, accumulation: Chart): boolean {
    const start: PieChartLocationProps = getLabelLocation(point, accumulation);
    const end: PieChartLocationProps = { x: 0, y: 0 };
    getEdgeOfLabel(point.labelRegion, point.labelAngle, end, 0, point);

    const previousstart: PieChartLocationProps = getLabelLocation(previous, accumulation);
    const previousend: PieChartLocationProps = { x: 0, y: 0 };
    getEdgeOfLabel(previous.labelRegion, previous.labelAngle, previousend, 0, point);
    return isLineRectangleIntersect(start, end, point.labelRegion) ||
        isLineRectangleIntersect(start, end, previous.labelRegion) ||
        isLineRectangleIntersect(previousstart, previousend, point.labelRegion);
}

/**
 * Determines whether the line segment (line1->line2) intersects with the given rectangle.
 *
 * @param {PieChartLocationProps} line1 - Line start.
 * @param {PieChartLocationProps} line2 - Line end.
 * @param {Rect} rect - Rectangle to test against.
 * @returns {boolean} - True if the line intersects the rectangle; otherwise, false.
 */
function isLineRectangleIntersect(line1: PieChartLocationProps, line2: PieChartLocationProps, rect: Rect): boolean {
    const rectPoints: PieChartLocationProps[] = [
        { x: Math.round(rect.x), y: Math.round(rect.y) },
        { x: Math.round((rect.x + rect.width)), y: Math.round(rect.y) },
        { x: Math.round((rect.x + rect.width)), y: Math.round((rect.y + rect.height)) },
        { x: Math.round(rect.x), y: Math.round((rect.y + rect.height)) }
    ];
    line1.x = Math.round(line1.x);
    line1.y = Math.round(line1.y);
    line2.x = Math.round(line2.x);
    line2.y = Math.round(line2.y);
    for (let i: number = 0; i < rectPoints.length; i++) {
        if (isLinesIntersect(line1, line2, rectPoints[i as number], rectPoints[(i + 1) % rectPoints.length])) {
            return true;
        }
    }
    return false;
}

/**
 * Determines whether two line segments (point1->point2) and (point11->point12) intersect.
 *
 * @param {PieChartLocationProps} point1 - First line start.
 * @param {PieChartLocationProps} point2 - First line end.
 * @param {PieChartLocationProps} point11 - Second line start.
 * @param {PieChartLocationProps} point12 - Second line end.
 * @returns {boolean} - True if the lines intersect; otherwise, false.
 */
function isLinesIntersect(point1: PieChartLocationProps, point2: PieChartLocationProps,
                          point11: PieChartLocationProps, point12: PieChartLocationProps): boolean {
    const a1: number = point2.y - point1.y;
    const b1: number = point1.x - point2.x;
    const c1: number = a1 * point1.x + b1 * point1.y;
    const a2: number = point12.y - point11.y;
    const b2: number = point11.x - point12.x;
    const c2: number = a2 * point11.x + b2 * point11.y;
    const delta: number = a1 * b2 - a2 * b1;
    if (delta !== 0) {
        const x: number = (b2 * c1 - b1 * c2) / delta;
        const y: number = (a1 * c2 - a2 * c1) / delta;
        let lies: boolean = Math.min(point1.x, point2.x) <= x && x <= Math.max(point1.x, point2.x);
        lies = lies && Math.min(point1.y, point2.y) <= y && y <= Math.max(point1.y, point2.y);
        lies = lies && Math.min(point11.x, point12.x) <= x && x <= Math.max(point11.x, point12.x);
        lies = lies && Math.min(point11.y, point12.y) <= y && y <= Math.max(point11.y, point12.y);
        return lies;
    }
    return false;
}

/**
 * Finds the anchor point on the label rectangle where the connector should end and updates the middle control point.
 *
 * @param {Rect} labelshape - Label rectangle.
 * @param {number} angle - Angle used to decide which edge to connect.
 * @param {PieChartLocationProps} middle - Output control point for curvy connector.
 * @param {number} [border=1] - Connector border width.
 * @param {Points} [point] - Optional point for special cases.
 * @returns {PieChartLocationProps} - The end point on the label edge.
 */
function getEdgeOfLabel(labelshape: Rect, angle: number, middle: PieChartLocationProps,
                        border: number = 1, point?: Points): PieChartLocationProps {
    const edge: PieChartLocationProps = { x: labelshape.x, y: labelshape.y };
    const space: number = 10;
    if (angle >= 90 && angle <= 270) {
        edge.x += labelshape.width + border / 2 + space;
        edge.y += labelshape.height / 2;
        middle.x = edge.x + 10;
        middle.y = edge.y;
    } else if (point && point.region && point.region.x > point.labelRegion.x) {
        edge.x += border * 2 + labelshape.width + space;
        edge.y += labelshape.height / 2;
        middle.x = edge.x + 10;
        middle.y = edge.y;
    } else {
        edge.x -= space - border / 2;
        edge.y += labelshape.height / 2;
        middle.x = edge.x - 10;
        middle.y = edge.y;
    }
    return edge;
}

/**
 * Gets the location at which the connector should start based on the point geometry.
 *
 * @param {Points} point - Target point.
 * @param {Chart} accumulation - Chart context for center and radii.
 * @returns {PieChartLocationProps} - The start location for the connector.
 */
function getLabelLocation(point: Points, accumulation: Chart): PieChartLocationProps {
    return degreeToLocation(
        point.originalMidAngle,
        (isVariousRadius(accumulation) ? stringToNumber(point.sliceRadius, accumulation.pieSeries.seriesRadius) :
            accumulation.pieSeries.radius),
        accumulation.pieSeries.center
    );
}

/**
 * Checks if the specified rect is completely contained within another rect.
 *
 * @param {Rect} currentRect - The rect to check if it's contained.
 * @param {Rect} rect - The containing rect.
 * @returns {boolean} - Returns true if the specified rect is completely contained within the containing rect; otherwise, false.
 *
 * @private
 */
export function containsRect(currentRect: Rect, rect: Rect): boolean {
    return (currentRect.x <= rect.x && currentRect.x + currentRect.width >= rect.x + rect.width &&
        currentRect.y <= rect.y && currentRect.height + currentRect.y >= rect.y + rect.height);
}

/**
 * Final validation of label visibility and trimming against area and title bounds.
 *
 * @param {Points} point - Current point.
 * @param {Points[]} points - All points to test overlap with.
 * @param {PieChartDataLabelProps} dataLabel - Data label settings.
 * @param {SeriesProperties} series - Series for area rect and center.
 * @returns {void}
 *
 * @private
 */
function finalizeDatalabels(point: Points, points: Points[], dataLabel: PieChartDataLabelProps, series: SeriesProperties): void {
    const accumulation: Chart = series.chart;
    const titleRect: Rect | undefined = series.titleRect as Rect | undefined;
    if (isOverlapping(point, points) || (titleRect && point.labelRegion && isOverlap(point.labelRegion, titleRect))) {
        if (point.labelPosition === 'Outside' && accumulation.smartLabels) {
            point.labelVisible = false;
        }
    }

    if (point.labelVisible && point.labelRegion) {
        const position: string = (point.labelRegion.x >= (series.chart.pieSeries.center?.x as number)) ? 'InsideRight' : 'InsideLeft';
        textTrimmingInRect(point, series.areaRect, dataLabel.font as PieChartFontProps, position, accumulation);
    }

    if (point.labelVisible && point.labelRegion && !dataLabel.maxLabelWidth && accumulation.smartLabels &&
        ((point.labelRegion.y + point.labelRegion.height / 2 > series.areaRect.y + series.areaRect.height) ||
            point.labelRegion.y < series.areaRect.y || point.labelRegion.x < series.areaRect.x ||
            point.labelRegion.x + point.labelRegion.width > series.areaRect.x + series.areaRect.width)) {
        point.labelVisible = false;
    }
}

/**
 * Trims the label text to fit inside the specified rectangle depending on position and RTL.
 *
 * @param {Points} point - Target point containing label state.
 * @param {Rect} rect - The rectangle to fit within.
 * @param {PieChartFontProps} font - Font settings for measurement.
 * @param {string} position - Location hint (Right/Left/InsideRight/InsideLeft).
 * @param {Chart} accumulation - Chart context for RTL and theme font.
 * @returns {void}
 *
 * @private
 */
function textTrimmingInRect(point: Points, rect: Rect, font: PieChartFontProps, position: string, accumulation: Chart): void {
    if (isOverlap(point.labelRegion as Rect, rect)) {
        let size: number = (point.labelRegion as Rect).width;
        if (position === 'Right') {
            size = rect.x - (point.labelRegion as Rect).x;
        } else if (position === 'Left') {
            size = (point.labelRegion as Rect).x - (rect.x + rect.width);
            if (size < 0) {
                size += (point.labelRegion as Rect).width;
                (point.labelRegion as Rect).x = rect.x + rect.width;
            }
        } else if (position === 'InsideRight') {
            size = (rect.x + rect.width) - (point.labelRegion as Rect).x;
        } else if (position === 'InsideLeft') {
            size = ((point.labelRegion as Rect).x + (point.labelRegion as Rect).width) - rect.x;
            if (size < (point.labelRegion as Rect).width) {
                (point.labelRegion as Rect).x = rect.x;
            }
        } else if (accumulation.smartLabels) {
            point.labelVisible = false;
        }
        if (point.labelVisible && point.labelRegion) {
            if ((point.label.indexOf('<br>') !== -1)) {
                point.labelCollection = point.label.split('<br>');
            } else if (size < (point.labelRegion as Rect).width) {
                point.labelCollection[0] = useTextTrim(size - (point.marginValue * 2), point.label, font, accumulation.enableRtl,
                                                       accumulation.themeStyle.datalabelFont as PieChartFontProps);
                (point.labelRegion as Rect).width = size;
            }
            for (let i: number = 0; i < point.labelCollection.length; i++) {
                if (point.labelCollection[i as number].length === 3 && point.labelCollection[i as number].indexOf('...') > -1) {
                    point.labelVisible = false; break;
                }
            }
        }
    }
}

/**
 * Builds the SVG path string for the connector between a slice and its outside label.
 *
 * @param {Points} point - The data point.
 * @param {Chart} chart - The chart instance containing series and pie settings.
 * @returns {string} - The connector path string or empty string on errors.
 *
 * @private
 */
export function buildConnectorPath(point: Points, chart: Chart): string {
    try {
        const pie: PieBase = chart.pieSeries;
        const dataLabel: PieChartDataLabelProps = chart.visibleSeries[0].dataLabel as PieChartDataLabelProps;
        const connector: ConnectorProps = dataLabel.connectorStyle as ConnectorProps;
        const connectorWidth: number = (connector.width as number) || 1;
        const outerRadius: number = pie.isRadiusMapped ? stringToNumber(point.sliceRadius, pie.size / 2) : pie.radius;
        const start: PieChartLocationProps = degreeToLocation(point.originalMidAngle, Math.max(outerRadius, 0),
                                                              pie.center as PieChartLocationProps);
        const label: Rect = point.labelRegion as Rect;
        const labelAngle: number = chart.smartLabels ? point.originalMidAngle : point.labelAngle || point.originalMidAngle;
        const middle: PieChartLocationProps = { x: 0, y: 0 } as PieChartLocationProps;
        const end: PieChartLocationProps = getEdgeOfLabel(label, labelAngle, middle, connectorWidth, point);
        const type: string = (connector.type as string) || 'Curve';
        if (type === 'Curve') {
            return `M ${start.x} ${start.y} Q ${middle.x} ${middle.y} ${end.x} ${end.y}`;
        } else {
            return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        }
    } catch {
        return '';
    }
}
