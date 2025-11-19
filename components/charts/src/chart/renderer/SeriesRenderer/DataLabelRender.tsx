import { ChartBorderProps, ChartFontProps, ChartLocationProps, DataLabelContentFunction } from '../../base/interfaces';
import { calculateRect, getDataLabelText, getPosition, getRectanglePoints, getVisiblePoints, isCollide, isDataLabelOverlapWithChartBound, isRotatedRectIntersect, measureText, rotateTextSize, textElement } from '../../utils/helper';
import { LabelPosition } from '../../base/enum';
import { LayoutMap } from '../../layout/LayoutContext';
import { Chart, ColorValue, dataLabelOptions, DataLabelProperties, DataLabelRendererResult, LabelLocation, MarginModel, Points, Rect, SeriesProperties, ChartSizeProps, TextOption, TextStyleModel, DataLabelContentProps } from '../../chart-area/chart-interfaces';
import { HorizontalAlignment } from '@syncfusion/react-base';


/**
 * Interpolates between two values with easing applied
 *
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} progress - Raw animation progress (0-1)
 * @returns {number} Interpolated value with easing applied
 * @private
 */
function interpolateWithEasing(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}

/**
 * Converts a color name to its hexadecimal or RGB representation.
 *
 * @param {string} colorName - The name of the color to convert.
 * @returns {string} - The hexadecimal or RGB representation of the color.
 * @private
 */
export function colorNameToHex(colorName: string): string {
    // Return the color as is if it's already in hex format or rgba/rgb format
    // Using simpler, safer regex patterns to check color formats
    if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(colorName)) {
        return colorName;
    }
    // Separate check for rgba/rgb to avoid complex regex
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
 * Converts a hex color string or rgb/rgba string to RGB color components.
 *
 * @param {string} color - The hexadecimal or rgb/rgba color string.
 * @returns {ColorValue} - An object with r, g, b values.
 * @private
 */
export function convertHexToColor(color: string): ColorValue {
    let r: number = 0;
    let g: number = 0;
    let b: number = 0;

    if (color.startsWith('rgb')) {

        const cleanColor: string = color.replace(/[rgba()\s]/g, '');
        const parts : string[] = cleanColor.split(',');

        if (parts.length >= 3) {
            r = parseInt(parts[0], 10) || 0;
            g = parseInt(parts[1], 10) || 0;
            b = parseInt(parts[2], 10) || 0;
            return { r, g, b };
        }
    }

    // Remove the hash (#) if present
    color = color.replace('#', '');

    // Handle shorthand hex format (e.g., #CCC)
    if (color.length === 3) {
        r = parseInt(color.charAt(0) + color.charAt(0), 16);
        g = parseInt(color.charAt(1) + color.charAt(1), 16);
        b = parseInt(color.charAt(2) + color.charAt(2), 16);
    } else {
        r = parseInt(color.substring(0, 2), 16) || 0;
        g = parseInt(color.substring(2, 4), 16) || 0;
        b = parseInt(color.substring(4, 6), 16) || 0;
    }

    return { r, g, b };
}

// Define interfaces for the renderer return types
interface ShapeRectConfig {
    id: string;
    fill: string;
    border: ChartBorderProps;
    opacity: number;
    rect: Rect;
    rx: number;
    ry: number;
    transform: string;
    stroke: string | undefined;
}
/**
 * Defines the DataLabelRenderer interface for rendering data labels in charts.
 */
interface IDataLabelRenderer {
    /**
     * Renders all data labels for the given series.
     *
     * @param series The series to render labels for.
     * @param dataLabel Chart data label settings.
     * @param chartProps Chart-level event props/context.
     * @returns Array of DataLabelRendererResults representing each data label.
     */
    render: (series: SeriesProperties, dataLabel: DataLabelProperties,
    ) => ( DataLabelRendererResults[] | DataLabelRendererResult[]);
    /**
     * Renders an individual data label for a point.
     *
     * @param series The parent series.
     * @param point The data point to render the label for.
     * @param dataLabel Chart data label settings.
     * @param chartProps Chart-level event props/context.
     * @returns DataLabelRendererResult for the label.
     */
    renderDataLabel: (series: SeriesProperties, point: Points, dataLabel: DataLabelProperties) =>
    DataLabelRendererResults;
    /**
     * Determines if a data label should have a shape (background/stroke) and sets flag on dataLabel.
     *
     * @param style Label style (color and border).
     * @param dataLabel Chart data label props to update.
     */
    isDataLabelShape: (style: { color: string, border: ChartBorderProps }, dataLabel: DataLabelProperties) => void;
    /**
     * Calculates the rectangle region for a data label's text.
     *
     * @param point The data point.
     * @param series The parent series.
     * @param textSize The size of the label text.
     * @param dataLabel Chart data label settings.
     * @param labelIndex Label index if multiple per point.
     * @returns Rectangle where text should be rendered.
     */
    calculateTextPosition: (point: Points, series: SeriesProperties, textSize: ChartSizeProps,
        dataLabel: DataLabelProperties, labelIndex: number) => Rect;
    /**
     * Gets the anchor location (x, y) for a data label.
     *
     * @param point The data point to label.
     * @param series Parent series.
     * @param labelIndex Label index (for multi-line/or multi-label scenarios).
     * @returns ChartLocationProps where label should be anchored.
     */
    getLabelLocation: (point: Points, series: SeriesProperties, labelIndex: number) => ChartLocationProps;
    /**
     * Calculates label alignment offset.
     *
     * @param value Offset value (height/width, etc).
     * @param labelLocation Original label location.
     * @param alignment Alignment mode (Near/Far).
     * @param isMinus Is value negative.
     * @param isInverted Is chart axis inverted.
     * @returns New label location with alignment applied.
     */
    calculateAlignment: (value: number, labelLocation: number,
        alignment: HorizontalAlignment, isMinus: boolean, isInverted: boolean) => number;
    /**
     * Calculates the y position for path-based series (Line/Spline, etc).
     *
     * @param labelLocation Original y position.
     * @param position Label position (Top/Bottom/Auto).
     * @param size Text size.
     * @param dataLabel Data label settings.
     * @param series Parent series.
     * @param point The point data.
     * @param labelIndex Label index.
     * @returns Calculated label y.
     */
    calculatePathPosition: (labelLocation: number, position: LabelPosition, size: ChartSizeProps, dataLabel: DataLabelProperties
        , series: SeriesProperties, point: Points, labelIndex: number) => number;
    /**
     * Chooses the best actual y position to avoid data label overlap for path-based series.
     *
     * @param y Original y position.
     * @param series Parent series.
     * @param point Point data.
     * @param size Label text size.
     * @param labelIndex Label index.
     * @returns Y position to avoid overlap.
     */
    calculatePathActualPosition: (y: number, series: SeriesProperties, point: Points,
        size: ChartSizeProps, labelIndex: number, dataLabel: DataLabelProperties) => number;
    /**
     * Calculates the label's position for rectangle/bar/column series.
     *
     * @param labelLocation Original position.
     * @param rect The series symbol rectangle.
     * @param isMinus Is value negative.
     * @param position Label position (Top/Bottom/Outer/Middle).
     * @param series Parent series.
     * @param textSize Text size.
     * @param labelIndex Label index.
     * @param point Point data.
     * @returns Calculated label position.
     */
    calculateRectPosition: (labelLocation: number, rect: Rect, isMinus: boolean, position: LabelPosition, series: SeriesProperties
        , textSize: ChartSizeProps, labelIndex: number, point: Points, dataLabel: DataLabelProperties) => number;
}

export interface DataLabelRendererResults {
    shapeRect?: ShapeRectConfig;
    textOption: TextOption;
}

/**
 * Applies a custom content callback to modify the data label text.
 *
 * This function invokes the `content` callback defined in the data label configuration,
 * allowing developers to customize the label text dynamically based on the data value and index.
 *
 * @param {string} text - The original text content of the data label.
 * @param {number} index - The index of the data point associated with the label.
 * @param {DataLabelProperties} dataLabel - The data label configuration object to which the label belongs.
 * @returns {string | boolean} The modified label content after applying the callback. If the callback fails, the original text is returned.
 * @private
 */
export function applyDataLabelContentCallback(
    text: string,
    index: number,
    dataLabel: DataLabelProperties
): string | boolean {
    const contentCallback: DataLabelContentFunction = dataLabel?.formatter as DataLabelContentFunction;
    if (contentCallback && typeof contentCallback === 'function') {
        try {
            const customProps: string | boolean = contentCallback(index, text);
            return customProps;
        } catch (error) {
            return text;
        }
    }
    return text;
}

// Define the DataLabelRenderer module
export const DataLabelRenderer: IDataLabelRenderer  = {

    render: (series: SeriesProperties, dataLabel: DataLabelProperties ) => {
        let dataLabelProps: DataLabelRendererResults;
        const dataLabels: DataLabelRendererResults[] = [];
        dataLabel.markerHeight = 0;
        const index: number | string = series.index as number;
        dataLabel.commonId = series.chart.element.id + '_Series_' + index + '_Point_';
        dataLabel.chartBackground = series.chart.chartArea.background === 'transparent' ?
            series.chart.background : series.chart.chartArea.background;
        const visiblePoints: Points[] = getVisiblePoints(series);
        void (series.visible && (() => {
            for (let i: number = 0; i < visiblePoints.length; i++) {
                dataLabelProps = DataLabelRenderer.renderDataLabel(series, visiblePoints[i as number], dataLabel);
                dataLabels.push(dataLabelProps);
            }
        })());
        return dataLabels;
    },

    renderDataLabel: (series: SeriesProperties, point: Points, dataLabel: DataLabelProperties) => {
        void (!dataLabel.showZero && ((point.y === 0) || (point.y === 0)) && (null));
        dataLabel.margin = dataLabel.margin as MarginModel;
        let labelText: string[] = [];
        let labelLength: number;
        let xPos: number;
        let yPos: number;
        let degree: number;
        let labelLocation: LabelLocation = { x: 0, y: 0 };
        let textSize: ChartSizeProps;
        const clip: Rect = series.clipRect as Rect;
        let shapeRect: ShapeRectConfig | undefined;
        let isDataLabelOverlap: boolean = false;
        dataLabel.rotationAngle = dataLabel.intersectMode === 'Rotate90' ? 90 : dataLabel.rotationAngle;
        dataLabel.enableRotation = dataLabel.intersectMode === 'Rotate90' ? true : dataLabel.enableRotation;
        const angle: number = degree = dataLabel.rotationAngle as number;
        const border: ChartBorderProps = { width: dataLabel.border?.width, color: dataLabel.border?.color };
        const dataLabelFont: ChartFontProps = dataLabel.font as ChartFontProps;
        const isBorder: boolean = Number(border.width) > 0 && border.color !== 'Transparent' && border.color !== '';
        const dataLabelPosition: LabelPosition | undefined = series.isRectSeries && dataLabel.position === 'Auto'
            ? ((series?.type!.indexOf('Bar') > -1 || series?.type!.indexOf('Column') > -1) ? ((series?.type!.indexOf('Stacking') === -1)
                ? 'Outer' : 'Top') : 'Top') : dataLabel.position;
        if (
            (point.symbolLocations?.length && point.symbolLocations[0])
        ) {
            labelText = getDataLabelText(point, series, series.chart) as string[];
            labelLength = labelText.length;
            for (let i: number = 0; i < labelLength; i++) {
                const pointFont: ChartFontProps = {
                    fontSize: dataLabelFont.fontSize,
                    color: dataLabelFont.color,
                    fontFamily: dataLabelFont.fontFamily,
                    fontStyle: dataLabelFont.fontStyle,
                    fontWeight: dataLabelFont.fontWeight
                };
                const argsData: DataLabelContentProps = {
                    seriesName: series.name as string,
                    point: point, text: labelText[i as number], border: border,
                    color: dataLabel.fill as string,
                    font: pointFont, location: labelLocation,
                    textSize: measureText(
                        labelText[i as number], dataLabel.font as TextStyleModel,
                        series.chart.themeStyle.datalabelFont)
                };

                const customText: string | boolean =  applyDataLabelContentCallback(argsData.text, point.index, dataLabel);
                if (customText && typeof customText !== 'boolean') {
                    dataLabel.fontBackground = argsData.color;
                    DataLabelRenderer.isDataLabelShape(argsData, dataLabel);
                    dataLabel.markerHeight = dataLabel.markerHeight!;
                }

                const rotatedTextSize: ChartSizeProps = rotateTextSize(
                    dataLabel.font as ChartFontProps, customText as string,
                    dataLabel.rotationAngle as number, series.chart,
                    series.chart.themeStyle.datalabelFont);

                textSize = measureText(
                    customText as string, dataLabel.font as TextStyleModel, series.chart.themeStyle.datalabelFont);
                const rect: Rect = DataLabelRenderer.calculateTextPosition(point, series, textSize, dataLabel, i);
                const actualRect: Rect = { x: rect.x + clip.x, y: rect.y + clip.y, width: rect.width, height: rect.height };
                const labelRect: Rect = {
                    x: rect.x + (rect.width / 2) - rotatedTextSize.width / 2,
                    y: rect.y + (rect.height / 2) - rotatedTextSize.height / 2,
                    width: rotatedTextSize.width,
                    height: rotatedTextSize.height
                };
                const actualLabelRect: Rect = {
                    x: labelRect.x + clip.x, y: labelRect.y + clip.y, width: labelRect.width, height: labelRect.height
                };
                series.chart.rotatedDataLabelCollections = [];
                if (dataLabel.enableRotation) {
                    const rectCoordinates: ChartLocationProps[] = getRectanglePoints(isBorder ? actualRect : actualLabelRect);
                    isDataLabelOverlap = (dataLabel.intersectMode === 'Rotate90' || angle === -90) ? false : isDataLabelOverlapWithChartBound(rectCoordinates, series.chart, { x: 0, y: 0, width: 0, height: 0 });
                    if (!isDataLabelOverlap) {
                        series.chart.rotatedDataLabelCollections.push(rectCoordinates);
                        const currentPointIndex: number = series.chart.rotatedDataLabelCollections.length - 1;
                        for (let index: number = currentPointIndex; index >= 0; index--) {
                            if (series.chart.rotatedDataLabelCollections[currentPointIndex as number] &&
                                series.chart.rotatedDataLabelCollections[index - 1] &&
                                isRotatedRectIntersect(
                                    series.chart.rotatedDataLabelCollections[currentPointIndex as number] as ChartLocationProps[],
                                    series.chart.rotatedDataLabelCollections[index - 1] as ChartLocationProps[])
                            ) {
                                isDataLabelOverlap = true;
                                series.chart.rotatedDataLabelCollections[currentPointIndex as number] = [];
                                break;
                            }
                        }
                    }
                } else {
                    isDataLabelOverlap = isCollide( isBorder ? rect : labelRect, (series.chart).dataLabelCollections as Rect[], clip);
                }

                const CenterX: number = rect.x + rect.width / 2;
                const CenterY: number = rect.y + (rect.height / 2);
                xPos = CenterX;
                yPos = CenterY;
                if (!isDataLabelOverlap && series.isRectSeries && point.regions && point.regions[0] && dataLabelPosition !== 'Outer') {
                    const pointRegion: Rect = point.regions[0];
                    const rectCheck: Rect = isBorder ? rect : labelRect;

                    const case1: boolean = series.chart.requireInvertedAxis ? rectCheck.x < pointRegion.x :
                        rectCheck.y < pointRegion.y;
                    const case2: boolean = series.chart.requireInvertedAxis ? rectCheck.x
                        + rectCheck.width > pointRegion.x + pointRegion.width : rectCheck.y
                        + rectCheck.height > pointRegion.y + pointRegion.height;

                    if (case1 || case2) {
                        isDataLabelOverlap = true;
                    }
                }
                if (!isDataLabelOverlap || dataLabel.intersectMode === 'None') {
                    series.chart.dataLabelCollections.push(isBorder ? actualRect as Rect : actualLabelRect as Rect);
                    const backgroundColor: string = dataLabel.fontBackground === 'transparent' ?
                        ((series.chart.theme.indexOf('Dark') > -1 || series.chart.theme.indexOf('HighContrast') > -1) ? 'black' : 'white') :
                        dataLabel.fontBackground as string;
                    const rgbValue: ColorValue = convertHexToColor(colorNameToHex(backgroundColor));
                    const LUMINANCE_RED_COEFFICIENT: number = 299;
                    const LUMINANCE_GREEN_COEFFICIENT: number = 587;
                    const LUMINANCE_BLUE_COEFFICIENT: number = 114;
                    const LUMINANCE_DIVISOR: number = 1000;

                    const contrast: number = Math.round(
                        (rgbValue.r * LUMINANCE_RED_COEFFICIENT +
                     rgbValue.g * LUMINANCE_GREEN_COEFFICIENT +
                     rgbValue.b * LUMINANCE_BLUE_COEFFICIENT) / LUMINANCE_DIVISOR
                    );
                    labelLocation = { x: 0, y: 0 };

                    degree = 0;

                    xPos -= xPos + (textSize.width / 2) > clip.width ? (!series.chart.requireInvertedAxis && xPos > clip.width) ? 0 :
                        (xPos + textSize.width / 2) - clip.width : 0;
                    yPos -= (yPos + textSize.height > clip.y + clip.height && !(series.type!.indexOf('Bar') > -1)) ? (yPos + textSize.height) - (clip.y + clip.height) : 0;

                    if (dataLabel.border?.color !== '' && dataLabel.border?.width !== 0 && !dataLabel.enableRotation) {
                        if (rect.x + rect.width > clip.width) {
                            rect.x = rect.x - (rect.x + rect.width - (clip.width - border.width!));
                            xPos = rect.x + rect.width / 2;
                        }
                    }
                    shapeRect = dataLabel.isShape ? {
                        id: dataLabel.commonId as string + point.index + '_TextShape_' + i,
                        fill: argsData.color,
                        border: argsData.border,
                        opacity: dataLabel.opacity as number, // Provide a default value of 1 when opacity is undefined
                        rect: rect,
                        rx: dataLabel.borderRadius?.x as number,
                        ry: dataLabel.borderRadius?.y as number,
                        transform: dataLabel.enableRotation ? 'rotate(' + dataLabel.rotationAngle + ', ' + CenterX + ', ' + CenterY + ')' : '',
                        stroke: dataLabel.border?.dashArray
                    } : undefined;

                    if (point.originalY !== 0 && !point.textValue) {
                        point.textValue = customText as string;
                    }
                    if (typeof point.y === 'number' && point.originalY === 0) {
                        point.originalY = point.y;
                    }
                    const textOption: TextOption = textElement(
                        {
                            id: dataLabel.commonId as string + (point.index) + '_Text_' + i,
                            x: xPos,
                            y: yPos,
                            anchor: 'middle',
                            text: customText as string,
                            transform: dataLabel.enableRotation ? 'rotate(' + dataLabel.rotationAngle + ', ' + CenterX + ', ' + CenterY + ')' : '',
                            baseLine: 'auto',
                            labelRotation: degree
                        },
                        argsData.font,
                        argsData.font.color || ((contrast >= 128) ?
                            '#1E192B' :  '#E8DEF8'),
                        false,
                        series.clipRect,
                        false
                    ) as TextOption;

                    return dataLabel.isShape ? { shapeRect, textOption } : { textOption };
                }
            }
        }
        return { textOption: {} as TextOption };
    },
    isDataLabelShape: (style: { color: string, border: ChartBorderProps }, dataLabel: DataLabelProperties) => {
        dataLabel.isShape = (style.color !== 'transparent' || (style.border?.width ?? 0) > 0);
        dataLabel.borderWidth = style.border.width;
        void (!dataLabel.isShape && (dataLabel.margin = { left: 0, right: 0, bottom: 0, top: 0 }));
    },

    calculateTextPosition: (point: Points, series: SeriesProperties, textSize: ChartSizeProps,
                            dataLabel: DataLabelProperties, labelIndex: number): Rect => {
        const labelRegion: Rect = point.regions?.[0] as Rect;
        const location: ChartLocationProps = DataLabelRenderer.getLabelLocation(point, series, labelIndex);
        const padding: number = 5;
        const clipRect: Rect = series.clipRect as Rect;
        const dataLabelPosition: LabelPosition | undefined = series.isRectSeries && dataLabel.position === 'Auto' ? ((series?.type!.indexOf('Bar') > -1 || series?.type!.indexOf('Column') > -1) ? ((series?.type!.indexOf('Stacking') === -1) ? 'Outer' : 'Top') : 'Top') : dataLabel.position;

        if (!series.chart.requireInvertedAxis || !series.isRectSeries) {
            dataLabel.locationX = location.x;
            const alignmentValue: number = textSize.height + (dataLabel.borderWidth as number * 2) + (dataLabel.markerHeight as number) +
                (dataLabel.margin?.bottom as number)  + (dataLabel.margin?.top as number) + padding;
            location.x =
                DataLabelRenderer.calculateAlignment(
                    alignmentValue, location.x, dataLabel.textAlign as HorizontalAlignment,
                    series.isRectSeries ? Number(point.yValue) < 0 : false, series.chart.requireInvertedAxis
                );
            location.y = !series.isRectSeries ?
                DataLabelRenderer.calculatePathPosition(
                    location.y, dataLabelPosition as LabelPosition, textSize, dataLabel, series, point, labelIndex
                ) : DataLabelRenderer.calculateRectPosition(
                    location.y, labelRegion, (Number(point.yValue)) < 0 !== (series.yAxis?.inverted ?? false),
                    dataLabelPosition as LabelPosition, series, textSize, labelIndex, point, dataLabel
                );
        }
        else {

            const alignmentValue: number = textSize.width + Number(dataLabel?.borderWidth) +
                Number(dataLabel.margin?.left) + Number(dataLabel.margin?.right) - padding;

            location.x = DataLabelRenderer.calculateAlignment(
                alignmentValue,
                location.x,
                dataLabel.textAlign as HorizontalAlignment,
                Number(point.yValue) < 0,
                series.chart.requireInvertedAxis
            );

            location.x = DataLabelRenderer.calculateRectPosition(
                location.x,
                labelRegion,
                (Number(point.yValue)) < 0 !== (series.yAxis?.inverted ?? false),
                dataLabelPosition as LabelPosition,
                series,
                textSize,
                labelIndex,
                point,
                dataLabel
            );
        }

        const rect: Rect = calculateRect(location, textSize, dataLabel.margin as MarginModel);

        if (!(dataLabel.enableRotation === true && dataLabel.rotationAngle !== 0) &&
            !((rect.y > (clipRect.y + clipRect.height)) || (rect.x > (clipRect.x + clipRect.width)) ||
                (rect.x + rect.width < 0) || (rect.y + rect.height < 0))) {
            rect.x = rect.x < 0 ? (series.type === 'StackingColumn' && !series.chart.requireInvertedAxis ? 0 : padding) : rect.x;
            rect.y = (rect.y < 0 && !series.chart.requireInvertedAxis) && !(dataLabel.intersectMode === 'None') ? padding : rect.y;
            rect.x -= (rect.x + rect.width) > (clipRect.x + clipRect.width) ? (rect.x + rect.width)
                - (clipRect.x + clipRect.width) + padding : 0;
            rect.y -= (rect.y + rect.height) > (clipRect.y + clipRect.height) ? (rect.y + rect.height)
                - (clipRect.y + clipRect.height) + padding : 0;
            dataLabel.fontBackground = dataLabel.fontBackground === 'transparent' ? dataLabel.chartBackground : dataLabel.fontBackground;
        }

        let dataLabelOutRegion: boolean | undefined = false;
        dataLabelOutRegion = (dataLabel.inverted && series.isRectSeries && (rect.x + rect.width > labelRegion.x + labelRegion.width));
        dataLabel.fontBackground = dataLabelOutRegion ? dataLabel.chartBackground : dataLabel.fontBackground;
        return rect;
    },

    getLabelLocation: (point: Points, series: SeriesProperties, labelIndex: number): ChartLocationProps => {
        let location: ChartLocationProps = { x: 0, y: 0 };
        const labelRegion: Rect = point.regions?.[0] as Rect;
        const isInverted: boolean = series.chart.requireInvertedAxis;
        location =
            (isInverted && point.yValue === 0) ?
                { x: labelRegion.x + labelRegion.width, y: labelRegion.y + (labelRegion.height) / 2 } :
                (labelIndex === 0 || labelIndex === 1) ?
                    { x: point.symbolLocations?.[0]?.x as number, y: point.symbolLocations?.[0]?.y as number } :
                    ((labelIndex === 2 || labelIndex === 3)) ?
                        { x: point.symbolLocations?.[1]?.x as number, y: point.symbolLocations?.[1]?.y as number } :
                        isInverted ?
                            { x: labelRegion.x + (labelRegion.width) / 2, y: labelRegion.y } :
                            { x: labelRegion.x + labelRegion.width, y: labelRegion.y + (labelRegion.height) / 2 };

        return location;
    },

    calculateAlignment: (value: number, labelLocation: number,
                         alignment: HorizontalAlignment, isMinus: boolean, isInverted: boolean): number => {
        switch (alignment) {
        case 'Right': labelLocation = !isInverted ? (isMinus ? labelLocation + value : labelLocation - value) :
            (isMinus ? labelLocation - value : labelLocation + value); break;
        case 'Left': labelLocation = !isInverted ? (isMinus ? labelLocation - value : labelLocation + value) :
            (isMinus ? labelLocation + value : labelLocation - value); break;
        }
        return labelLocation;
    },

    calculatePathPosition: (
        labelLocation: number, position: LabelPosition,
        size: ChartSizeProps, dataLabel: DataLabelProperties, series: SeriesProperties, point: Points, labelIndex: number): number => {
        const padding: number = 10;
        dataLabel.fontBackground = dataLabel.fontBackground === 'transparent' ? dataLabel.chartBackground : dataLabel.fontBackground;
        switch (position) {
        case 'Top':
        case 'Outer':
            labelLocation = labelLocation - (dataLabel.markerHeight as number)
                    - (dataLabel.borderWidth as number) - size.height / 2 - (dataLabel.margin?.bottom as number) - padding;
            break;
        case 'Bottom':
            labelLocation = labelLocation + (dataLabel.markerHeight as number)
                    + (dataLabel.borderWidth as number) + size.height / 2 + (dataLabel.margin as MarginModel).top + padding;
            break;
        case 'Auto':
            labelLocation = DataLabelRenderer.calculatePathActualPosition(
                labelLocation, series, point, size, labelIndex, dataLabel
            );
            break;
        }
        return labelLocation;
    },

    calculatePathActualPosition: (
        y: number,
        series: SeriesProperties,
        point: Points,
        size: ChartSizeProps,
        labelIndex: number,
        dataLabel: DataLabelProperties
    ): number => {
        const points: Points[] = series.points || [];
        const index: number = point.index;
        const yValue: number = points[index as number].yValue as number;
        let position: LabelPosition;
        const nextPoint: Points | null = points.length - 1 > index ? points[index + 1] : null;
        const previousPoint: Points | null = index > 0 ? points[index - 1] : null;
        let yLocation: number = 0;
        let isOverLap: boolean = true;
        let labelRect: Rect;
        let isBottom: boolean;
        let positionIndex: number;
        const collection: Rect[] = series.chart.dataLabelCollections || [];
        const yAxisInversed: boolean = series.yAxis?.inverted || false;

        if (series.type === 'Bubble') {
            position = 'Top';
        } else if (series.type && series.type.indexOf('Step') > -1) {
            position = 'Top';
            if (index) {
                position = (!previousPoint || !previousPoint.visible || (yValue > (previousPoint.yValue as number) !== yAxisInversed)
                    || yValue === previousPoint.yValue) ? 'Top' : 'Bottom';
            }
        } else {
            if (index === 0) {
                position = (!nextPoint || !nextPoint.visible || yValue > (nextPoint.yValue as number) ||
                    (yValue < (nextPoint.yValue as number) && yAxisInversed)) ? 'Top' : 'Bottom';
            } else if (index === points.length - 1) {
                position = (!previousPoint || !previousPoint.visible || yValue > (previousPoint.yValue as number) ||
                    (yValue < (previousPoint.yValue as number) && yAxisInversed)) ? 'Top' : 'Bottom';
            } else {
                if (nextPoint && !nextPoint.visible && !(previousPoint && previousPoint.visible)) {
                    position = 'Top';
                } else if (nextPoint && (!nextPoint.visible || !previousPoint)) {
                    position = ((nextPoint.yValue as number) > yValue || (previousPoint && (previousPoint.yValue as number) > yValue)) ?
                        'Bottom' : 'Top';
                } else if (nextPoint && previousPoint) {
                    const slope: number = ((nextPoint.yValue as number) - (previousPoint.yValue as number)) / 2;
                    const intersectY: number = (slope * index) + ((nextPoint.yValue as number) - (slope * (index + 1)));
                    position = !yAxisInversed ? intersectY < yValue ? 'Top' : 'Bottom' :
                        intersectY < yValue ? 'Bottom' : 'Top';
                } else {
                    position = 'Top'; // Default fallback
                }
            }
        }

        isBottom = position === 'Bottom';
        positionIndex = ['Outer', 'Top', 'Bottom', 'Middle', 'Auto'].indexOf(position);

        while (isOverLap && positionIndex < 4) {
            const currentPosition: LabelPosition = getPosition(positionIndex);
            yLocation = DataLabelRenderer.calculatePathPosition(
                y,
                currentPosition,
                size,
                series.marker?.dataLabel as DataLabelProperties,
                series,
                point,
                labelIndex
            );

            const locationX: number = dataLabel?.locationX || 0;
            labelRect = calculateRect(
                { x: locationX, y: yLocation },
                size,
                (series.marker?.dataLabel?.margin || { left: 0, right: 0, top: 0, bottom: 0 }) as MarginModel
            );

            isOverLap = labelRect.y < 0 ||
                isCollide(labelRect, collection as Rect[], series.clipRect as Rect) ||
                (labelRect.y + labelRect.height) > (series.clipRect?.height || 0);

            positionIndex = isBottom ? positionIndex - 1 : positionIndex + 1;
            isBottom = false;
        }

        return yLocation;
    },

    calculateRectPosition: (
        labelLocation: number, rect: Rect, isMinus: boolean,
        position: LabelPosition, series: SeriesProperties, textSize: ChartSizeProps,
        labelIndex: number, point: Points, dataLabel: DataLabelProperties
    ): number => {

        const padding: number = 5;
        const margin: MarginModel = position === 'Middle' ?
            { left: 0, right: 0, top: 0, bottom: 0 } :
            series.marker?.dataLabel?.margin as MarginModel;

        let extraSpace: number;
        const textLength: number = (series?.marker?.dataLabel?.enableRotation ? textSize.width :
            (!series.chart.requireInvertedAxis ? textSize.height : textSize.width));
        if (position === 'Bottom' && series.type === 'StackingColumn' && !series.chart.requireInvertedAxis && rect.height < textSize.height) {
            extraSpace = Number(dataLabel?.borderWidth) +
                ((Math.abs(rect.height - textSize.height / 2) < padding) ? 0 : padding);
        } else {
            extraSpace = (dataLabel.isShape ? dataLabel?.borderWidth as number : 0) + textLength / 2 + (position !== 'Outer' && series.type!.indexOf('Column') > -1 &&
                (Math.abs(rect.height - textSize.height) < padding) ? 0 : padding);
        }

        const inverted: boolean  = series.chart.requireInvertedAxis;
        const yAxisInversed: boolean  = series.yAxis?.inverted ?? false;

        switch (position) {
        case 'Bottom':
            labelLocation = !inverted ?
                isMinus ? (labelLocation + ((-rect.height + extraSpace + margin.top))) :
                    (labelLocation + rect.height - extraSpace - margin.bottom) :
                isMinus ? (labelLocation + ((+ rect.width - extraSpace - margin.left))) :
                    (labelLocation - rect.width + extraSpace + margin.right);
            break;
        case 'Middle':
            labelLocation = !inverted ?
                (isMinus ? labelLocation - (rect.height / 2) : labelLocation + (rect.height / 2)) :
                (isMinus ? labelLocation + (rect.width / 2) : labelLocation - (rect.width / 2));
            break;
        default:
            labelLocation = calculateTopAndOuterPosition(labelLocation, rect, position, series, labelIndex
                , extraSpace, isMinus, point, inverted, yAxisInversed);
            break;
        }

        const check: boolean = !inverted ?
            (labelLocation < rect.y || labelLocation > rect.y + rect.height) :
            (labelLocation < rect.x || labelLocation > rect.x + rect.width);

        // Set font background based on position
        const fontBackground: string | undefined  = check ?
            (dataLabel?.fontBackground === 'transparent' ?
                (series.chart?.chartArea?.background ?? 'white') :
                dataLabel?.fontBackground) :
            dataLabel?.fontBackground === 'transparent' ? (point.color || series.interior) :
                dataLabel?.fontBackground;

        if (series.marker?.dataLabel) {
            dataLabel.fontBackground = fontBackground;
        }

        return labelLocation;
    }
};

/**
 * Calculates the position for data labels in 'Top' or 'Outer' positions
 * Adjusts the label location based on marker visibility, series type, and chart orientation
 *
 * @param {number} location - The initial label location (x or y) to adjust
 * @param {Rect} _rect - The rectangle representing the data point region
 * @param {LabelPosition} position - The desired label position ('Top', 'Outer', etc.)
 * @param {SeriesProperties} series - The series object containing styling and configuration
 * @param {number} _index - The index of the label (for multiple labels per point)
 * @param {number} extraSpace - Additional spacing to apply
 * @param {boolean} isMinus - Whether the value is negative
 * @param {Points} point - The data point object
 * @param {boolean} inverted - Whether the chart axes are inverted
 * @param {boolean} _yAxisInversed - Whether the Y-axis direction is inversed
 * @returns {number} The calculated position for the label
 * @private
 */
export function calculateTopAndOuterPosition(
    location: number, _rect: Rect, position: LabelPosition, series: SeriesProperties, _index: number,
    extraSpace: number, isMinus: boolean, point: Points, inverted: boolean, _yAxisInversed: boolean
): number {
    const margin: MarginModel = (series.marker?.dataLabel?.margin) as MarginModel;

    if (((isMinus && position === 'Top') || (!isMinus && position === 'Outer')) ||
        (position === 'Top' && series.visiblePoints![point.index].yValue === 0)) {
        location = !inverted ?
            location + ((-extraSpace - margin.bottom - (series.marker?.visible ? Number(series.marker?.height) / 2 : 0))) :
            location + ((+ extraSpace + margin.left + (series.marker?.visible ? Number(series.marker?.height) / 2 : 0)));
    } else {
        location = !inverted ?
            location + ((+ extraSpace + margin.top + (series.marker?.visible ? Number(series.marker?.height) / 2 : 0))) :
            location + ((- extraSpace - margin.right - (series.marker?.visible ? Number(series.marker?.height) / 2 : 0)));
    }

    return location;
}

/**
 * Applies an easing function to make the animation smoother
 * Uses the same quadratic ease-in-out function as the chart animation
 *
 * @param {number} progress - Raw animation progress (0-1)
 * @returns {number} Eased animation progress
 * @private
 */
function easeInOutQuad(progress: number): number {
    return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

/**
 * Global store for tracking data label positions across chart animations
 * Maps chart and series ids to data label positions and transforms
 */
const previousDataLabelPositions: Map<string, Map<string, dataLabelOptions[]>> = new Map<string, Map<string, {
    x: number,
    y: number,
    transform?: string,
    width?: number,
    height?: number,
    rx?: number,
    ry?: number
}[]>>();

/**
 * Renders shape elements (e.g., rectangle backgrounds) for a set of data labels for a series, with animated transitions.
 *
 * @param {DataLabelRendererResult[]} dataLabel - Array of data label renderer results (shapes and text info).
 * @param {number} index - The index of the series.
 * @param {React.RefObject<LayoutMap>} layoutRef - Reference to the layout map/chart context.
 * @param {number} [animationProgress=1] - Animation progress (0-1, default 1 = no animation).
 * @returns {React.ReactNode} SVG <g> element with child <rect> elements representing shape backgrounds, or null if nothing to render.
 * @private
 */
export function renderDataLabelShapesJSX(
    dataLabel: DataLabelRendererResult[],
    index: number,
    layoutRef: React.RefObject<LayoutMap>,
    animationProgress: number = 1
): React.ReactNode {
    if (!dataLabel || dataLabel.length === 0 || !(layoutRef.current?.chart as Chart)?.visibleSeries?.[index as number]) {
        return null;
    }

    const series: SeriesProperties = (layoutRef.current.chart as Chart).visibleSeries[index as number];
    const clipX: number = series.clipRect?.x as number;
    const clipY: number = series.clipRect?.y as number;
    const chartId: string = (layoutRef.current.chart as Chart).element.id;

    // Get or initialize positions map for this chart
    const chartKey: string = chartId;
    if (!previousDataLabelPositions.has(chartKey)) {
        previousDataLabelPositions.set(chartKey, new Map());
    }

    const chartPositions: Map<string, dataLabelOptions[]> = previousDataLabelPositions.get(chartKey)!;

    return (
        <g id={`containerShapeGroup${index}`}
            transform={`translate(${clipX}, ${clipY})`}
            clipPath={`url(#${chartId}_ChartSeriesClipRect_${index})`}>
            {dataLabel.map((labelData: DataLabelRendererResult, labelIndex: number) => {
                if (!labelData || labelData.shapeRect === undefined) {return null; }

                // Create a unique key for the label to track its position
                const labelKey: string = `${index}_shape_${labelIndex}`;

                // Get current position
                const currentX: number = labelData.shapeRect.rect.x;
                const currentY: number = labelData.shapeRect.rect.y;

                // Get previous position
                let previousX: number = currentX;
                let previousY: number = currentY;

                // Check if we have previous position data
                if (chartPositions.has(labelKey)) {
                    const pos: {
                        x: number;
                        y: number;
                        transform?: string;
                        width?: number;
                        height?: number;
                        rx?: number;
                        ry?: number;
                    } = chartPositions.get(labelKey)![0];
                    previousX = pos.x;
                    previousY = pos.y;
                }

                // Calculate interpolated position for animation
                let x: number = currentX;
                let y: number = currentY;

                // Apply eased interpolation for smoother animation
                if (animationProgress < 1) {
                    const easedProgress: number = easeInOutQuad(animationProgress);
                    x = interpolateWithEasing(previousX, currentX, easedProgress);
                    y = interpolateWithEasing(previousY, currentY, easedProgress);
                }

                // Get shape dimensions for animation
                const currentWidth: number = labelData.shapeRect.rect.width;
                const currentHeight: number = labelData.shapeRect.rect.height;
                const currentRx: number = labelData.shapeRect.rx;
                const currentRy: number = labelData.shapeRect.ry;

                // Look up previous dimensions
                let width: number = currentWidth;
                let height: number = currentHeight;
                let rx: number = currentRx;
                let ry: number = currentRy;

                // If we have previous position data with dimensions
                if (chartPositions.has(labelKey)) {
                    const previousDimensions: dataLabelOptions = chartPositions.get(labelKey)![0];
                    if (previousDimensions.width !== undefined &&
                        previousDimensions.height !== undefined &&
                        animationProgress < 1) {
                        width = interpolateWithEasing(previousDimensions.width, currentWidth, animationProgress);
                        height = interpolateWithEasing(previousDimensions.height, currentHeight, animationProgress);
                    }

                    if (previousDimensions.rx !== undefined &&
                        previousDimensions.ry !== undefined &&
                        animationProgress < 1) {
                        rx = interpolateWithEasing(previousDimensions.rx, currentRx, animationProgress);
                        ry = interpolateWithEasing(previousDimensions.ry, currentRy, animationProgress);
                    }
                }

                // Store current position and dimensions for future animations if animation is complete
                if (animationProgress === 1) {
                    if (!chartPositions.has(labelKey)) {
                        chartPositions.set(labelKey, []);
                    }
                    const positions: dataLabelOptions[] = chartPositions.get(labelKey)!;
                    positions[0] = {
                        x: currentX,
                        y: currentY,
                        transform: labelData.shapeRect.transform,
                        width: currentWidth,
                        height: currentHeight,
                        rx: currentRx,
                        ry: currentRy
                    };
                }

                return (
                    <rect key={labelData.shapeRect.id}
                        id={labelData.shapeRect.id}
                        opacity={labelData.shapeRect.opacity * (animationProgress < 1 ? animationProgress : 1)}
                        fill={labelData.shapeRect.fill}
                        x={x}
                        y={y}
                        width={width}
                        rx={rx}
                        ry={ry}
                        height={height}
                        stroke={labelData.shapeRect.border?.color}
                        strokeDasharray={labelData.shapeRect.stroke}
                        transform = {labelData.shapeRect.transform}
                        strokeWidth={labelData.shapeRect.border?.width} />
                );
            })}
        </g>
    );
}

/**
 * Parses the formatted value from label text to extract the numeric value, prefix and suffix for use in animation.
 *
 * @param {string|number} text - The label text as string or number.
 * @returns {{ value: number, format: string, prefix: string, suffix: string }} Object with value, format, prefix, suffix.
 * @private
 */
function parseFormattedText(text: string | number): {
    value: number;
    format: string;
    prefix: string;
    suffix: string;
} {
    if (typeof text === 'number') {
        return { value: text, format: text.toString(), prefix: '', suffix: '' };
    }

    const textStr: string = String(text).trim();
    const chars: string[] = [...textStr];
    let numberStart: number = -1;
    let numberEnd: number = -1;

    for (let i: number = 0; i < chars.length; i++) {
        const c: string = chars[i as number];
        if ((c >= '0' && c <= '9') || c === '-' || c === '.') {
            if (numberStart === -1) {numberStart = i; }
            numberEnd = i;
        } else if (numberStart !== -1) {
            break;
        }
    }

    if (numberStart === -1) {
        return { value: 0, format: textStr, prefix: '', suffix: textStr };
    }

    const numStr: string = textStr.slice(numberStart, numberEnd + 1);
    const value: number = parseFloat(numStr);
    const prefix: string = textStr.slice(0, numberStart).trim();
    const suffix: string = textStr.slice(numberEnd + 1).trim();

    return {
        value: isNaN(value) ? 0 : value,
        format: textStr,
        prefix,
        suffix
    };
}

/**
 * Renders text elements for a set of data labels for a series, including number text animation for updated data points.
 *
 * @param {DataLabelRendererResult[]} dataLabel - Array of data label renderer results (text and shape info).
 * @param {number} index - Series index.
 * @param {React.RefObject<LayoutMap>} layoutRef - Reference to layout map/chart context.
 * @param {number} [animationProgress=1] - Animation progress (0-1).
 * @param {number} [_legendClick] - Used to rerender after legend click (not used directly).
 * @returns {React.ReactNode} SVG <g> element with <text> labels, or null.
 * @private
 */
export function renderDataLabelTextJSX(
    dataLabel: DataLabelRendererResult[],
    index: number,
    layoutRef: React.RefObject<LayoutMap>,
    animationProgress: number = 1,
    _legendClick?: number
): React.ReactNode {
    if (!dataLabel || dataLabel.length === 0 || !(layoutRef.current?.chart as Chart)?.visibleSeries?.[index as number]) {
        return null;
    }

    const series: SeriesProperties = (layoutRef.current.chart as Chart).visibleSeries[index as number];
    const clipX: number = series.clipRect?.x as number;
    const clipY: number = series.clipRect?.y as number;
    const chartId: string = (layoutRef.current.chart as Chart).element.id;

    // Get or initialize positions map for this chart
    const chartKey: string = chartId;
    if (!previousDataLabelPositions.has(chartKey)) {
        previousDataLabelPositions.set(chartKey, new Map());
    }

    const chartPositions: Map<string, dataLabelOptions[]> = previousDataLabelPositions.get(chartKey)!;
    return (
        <g id={`containerTextGroup${index}`}
            transform={`translate(${clipX}, ${clipY})`}
            clipPath={`url(#${chartId}_ChartSeriesClipRect_${index})`}
            aria-hidden="true">
            {dataLabel.map((labelData: DataLabelRendererResult, labelIndex: number) => {
                // Create a unique key for the label to track its position
                const labelKey: string = `${index}_text_${labelIndex}`;
                if (!labelData || !labelData.textOption || !labelData.textOption.renderOptions) {
                    return null;
                }
                // Get current position
                const currentX: number = labelData.textOption.renderOptions.x;
                const currentY: number = labelData.textOption.renderOptions.y;
                const currentTransform: string = labelData.textOption.renderOptions.transform;

                // Get previous position
                let previousX: number = currentX;
                let previousY: number = currentY;

                // Check if we have previous position data
                if (chartPositions.has(labelKey)) {
                    const pos: dataLabelOptions = chartPositions.get(labelKey)![0];
                    previousX = pos.x;
                    previousY = pos.y;
                }

                // Calculate interpolated position for animation
                let x: number = currentX;
                let y: number = currentY;

                // Apply eased interpolation for smoother animation
                if (animationProgress < 1) {
                    x = interpolateWithEasing(previousX, currentX, animationProgress);
                    y = interpolateWithEasing(previousY, currentY, animationProgress);
                }

                // Store current position for future animations if animation is complete
                if (animationProgress === 1) {
                    if (!chartPositions.has(labelKey)) {
                        chartPositions.set(labelKey, []);
                    }
                    const positions: dataLabelOptions[] = chartPositions.get(labelKey)!;
                    positions[0] = { x: currentX, y: currentY, transform: currentTransform };
                }
                const pointIndex: number = labelIndex;
                let displayText: string = labelData.textOption.text as string;
                // Try to get point for this data label
                if (series.points && pointIndex < series.points.length) {
                    const point: Points = series.points[pointIndex as number];
                    // If point has original Y value, perform text animation
                    if (point && point.originalY !== undefined && typeof point.originalY === 'number' &&
                        typeof point.y === 'number') {
                        if (series.pointUpdated && (/\d/.test(displayText))) {
                            const parsedEnd: {
                                value: number;
                                format: string;
                                prefix: string;
                                suffix: string;
                            } = parseFormattedText(displayText);
                            const start: number = Math.round(Number(point.originalY));
                            const end: number = Math.round(parsedEnd.value);

                            // Skip animation if values are identical
                            if (start === end) {
                                displayText = labelData.textOption.text as string;
                            } else {
                                // Check if increasing or decreasing
                                const isIncreasing: boolean = end > start;

                                // Calculate the total number of frames for animation
                                // Shorter for smaller changes, longer for bigger changes
                                const maxFrames: number = 20;
                                const minFrames: number = 5;
                                const difference: number = Math.abs(end - start);
                                const totalFrames: number = Math.min(maxFrames, Math.max(minFrames, difference));

                                // Calculate which frame we're on based on animation progress
                                const currentFrame: number = Math.min(
                                    totalFrames - 1,
                                    Math.floor(animationProgress * totalFrames)
                                );
                                const stepsPerFrame: number = Math.max(1, Math.floor(difference / totalFrames));

                                // Calculate current value with step-by-step animation
                                let currentValue: number;

                                if (isIncreasing) {
                                    currentValue = Math.min(end, start + (currentFrame * stepsPerFrame));
                                } else {
                                    currentValue = Math.max(end, start - (currentFrame * stepsPerFrame));
                                }

                                // For the last frame, ensure we show the exact end value
                                if (animationProgress >= 0.99) {
                                    currentValue = end;
                                }
                                displayText = parsedEnd.prefix + currentValue.toString() + parsedEnd.suffix;
                            }
                        }
                        else {
                            displayText = labelData.textOption.text as string;
                        }
                    }
                }

                return (
                    <text
                        key={labelData.textOption.renderOptions.id}
                        id={labelData.textOption.renderOptions.id}
                        x={x}
                        y={y}
                        fill={labelData.textOption.renderOptions.fill}
                        fontSize={labelData.textOption.renderOptions['font-size']}
                        fontFamily={labelData.textOption.renderOptions['font-family']}
                        fontWeight={labelData.textOption.renderOptions['font-weight']}
                        fontStyle={labelData.textOption.renderOptions['font-style']}
                        textAnchor={labelData.textOption.renderOptions['text-anchor']}
                        transform={labelData.textOption.renderOptions.transform}
                        dominantBaseline={'middle'}
                    >
                        {displayText}
                    </text>
                );
            })}
        </g>
    );
}

/**
 * Renders complete set of data label shapes and texts for a series, grouped together.
 *
 * @param {DataLabelRendererResult[]} dataLabel - The array of label rendering results.
 * @param {number} index - Series index.
 * @param {React.RefObject<LayoutMap>} layoutRef - Reference to layout context/List.
 * @param {number} _labelOpacity - Not used directly (label opacity is computed inside shapes/text).
 * @param {number} [animationProgress=1] - Animation progress (0-1).
 * @returns {React.ReactNode} React fragment with both shape and text elements for data labels.
 * @private
 */
export function renderDataLabelJSX(
    dataLabel: DataLabelRendererResult[],
    index: number,
    layoutRef: React.RefObject<LayoutMap>,
    _labelOpacity: number,
    animationProgress: number = 1
): React.ReactNode {
    if (!dataLabel || dataLabel.length === 0) {
        return null;
    }

    return (
        <>
            {renderDataLabelShapesJSX(dataLabel, index, layoutRef, animationProgress)}
            {renderDataLabelTextJSX(dataLabel, index, layoutRef, animationProgress)}
        </>
    );
}

export const calculateAlignment: (value: number, labelLocation: number, alignment: HorizontalAlignment,
    isMinus: boolean, isInverted: boolean) => number = DataLabelRenderer.calculateAlignment;
export const isDataLabelShape: (style: { color: string, border: ChartBorderProps },
    dataLabel: DataLabelProperties) => void = DataLabelRenderer.isDataLabelShape;
export const getLabelLocation: (point: Points, series: SeriesProperties, labelIndex: number) =>
ChartLocationProps = DataLabelRenderer.getLabelLocation;
export const calculateTextPosition: (point: Points, series: SeriesProperties, textSize: ChartSizeProps,
    dataLabel: DataLabelProperties, labelIndex: number) => Rect = DataLabelRenderer.calculateTextPosition;
export const calculateRectPosition: (
    labelLocation: number, rect: Rect, isMinus: boolean,
    position: LabelPosition, series: SeriesProperties, textSize: ChartSizeProps,
    labelIndex: number, point: Points, dataLabel: DataLabelProperties
) => number = DataLabelRenderer.calculateRectPosition;
export default DataLabelRenderer;
