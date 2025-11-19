import { useEffect, useState, useRef, useLayoutEffect, useImperativeHandle, forwardRef, useMemo, useReducer, useCallback, JSX } from 'react';
import {
    measureText,
    findDirection,
    calculateShapes,
    withInAreaBounds,
    createTooltipLocation,
    createRect,
    createPathOption,
    createSize,
    getTooltipThemeColor
} from './helper';
import { TooltipPlacement } from './enum';
import { TextStyle, MarkerShape, TextSpanElement, TooltipProps, ITooltipThemeStyle, RenderOption, PathOption, Rect, Size, TooltipLocation } from './models';

const defaultProps: Partial<TooltipProps> = {
    shared: false,
    crosshair: false,
    enableShadow: false,
    header: '',
    opacity: 0.75,
    textStyle: {},
    enableAnimation: true,
    duration: 300,
    inverted: false,
    isNegative: false,
    border: { color: '', width: 1, dashArray: '' },
    content: [],
    markerSize: 10,
    clipBounds: { x: 0, y: 0 },
    palette: [],
    shapes: [],
    location: { x: 0, y: 0 },
    offset: 0,
    rx: 4,
    ry: 4,
    marginX: 5,
    marginY: 5,
    arrowPadding: 7,
    theme: 'Material3',
    areaBounds: { x: 0, y: 0, width: 0, height: 0 },
    isCanvas: false,
    isTextWrap: false,
    isFixed: false,
    controlName: '',
    showNearestTooltip: false,
    enableRTL: false,
    allowHighlight: false,
    showHeaderLine: true
};

/**
 * Defines methods exposed by the Tooltip component ref.
 */
export interface TooltipRefHandle {
    /** Fades out the tooltip, setting its opacity to 0. */
    fadeOut: () => void;
    /** Fades in the tooltip, setting its opacity to 1. */
    fadeIn: () => void;
}
// Define state types for grouped state
type TextData = {
    textSpans: TextSpanElement[];
    markerPoints: number[];
    isWrap: boolean;
    wrappedText: string;
};
type ShapesData = {
    pathData: string;
    headerLineData: string;
    markerShapes: MarkerShape[];
    textTransform: string;
};
type FilterData = {
    showFilter: boolean;
    filterDef: string;
    shadowId: string;
};
// Define reducer state and action types
type TooltipState = {
    elementSize: Size;
    textData: TextData;
    shapesData: ShapesData;
    filterData: FilterData;
    tooltipPosition: { x: number, y: number };
    tooltipOpacity: number;
    isInitialAppearance: boolean;
};
type TooltipAction =
    | { type: 'UPDATE_SIZE'; payload: Size }
    | { type: 'UPDATE_TEXT_DATA'; payload: Partial<TextData> }
    | { type: 'UPDATE_SHAPES_DATA'; payload: Partial<ShapesData> }
    | { type: 'UPDATE_FILTER_DATA'; payload: Partial<FilterData> }
    | { type: 'SET_TOOLTIP_POSITION'; payload: { x: number, y: number } }
    | { type: 'SET_TOOLTIP_OPACITY'; payload: number }
    | { type: 'SET_INITIAL_APPEARANCE'; payload: boolean };

/**
 * Reducer function to manage tooltip state with grouped state updates.
 * Handles various tooltip state transitions through a centralized dispatch.
 *
 * @param {TooltipState} state - The current state of the tooltip
 * @param {TooltipAction} action - The action to perform on the state
 * @returns {TooltipState} The new state after applying the action
 */
function tooltipReducer(state: TooltipState, action: TooltipAction): TooltipState {
    switch (action.type) {
    case 'UPDATE_SIZE':
        // Prevent unnecessary updates if size is the same
        if (state.elementSize.width === action.payload.width &&
                state.elementSize.height === action.payload.height) {
            return state;
        }
        return { ...state, elementSize: action.payload };
    case 'UPDATE_TEXT_DATA':
        return { ...state, textData: { ...state.textData, ...action.payload } };
    case 'UPDATE_SHAPES_DATA':
        return { ...state, shapesData: { ...state.shapesData, ...action.payload } };
    case 'UPDATE_FILTER_DATA':
        return { ...state, filterData: { ...state.filterData, ...action.payload } };
    case 'SET_TOOLTIP_POSITION':
        // Prevent unnecessary updates if position is the same
        if (state.tooltipPosition.x === action.payload.x &&
                state.tooltipPosition.y === action.payload.y) {
            return state;
        }
        return { ...state, tooltipPosition: action.payload };
    case 'SET_TOOLTIP_OPACITY':
        if (state.tooltipOpacity === action.payload) {
            return state;
        }
        return { ...state, tooltipOpacity: action.payload };
    case 'SET_INITIAL_APPEARANCE':
        if (state.isInitialAppearance === action.payload) {
            return state;
        }
        return { ...state, isInitialAppearance: action.payload };
    default:
        return state;
    }
}

export const Tooltip: React.ForwardRefExoticComponent<TooltipProps & React.RefAttributes<TooltipRefHandle>> =
forwardRef<TooltipRefHandle, TooltipProps>((props: TooltipProps, ref: React.ForwardedRef<TooltipRefHandle>) => {
    const mergedProps: TooltipProps = useMemo(() => ({ ...defaultProps, ...props }), [props]);
    const tooltipId: string = 'tooltip';

    // Still need separate state for theme as it's used in other calculations
    const [themeStyle, setThemeStyle] = useState<ITooltipThemeStyle>(
        getTooltipThemeColor(mergedProps.theme || 'Material3')
    );

    // Use refs for values that don't trigger re-renders
    const elementSizeRef: React.RefObject<Size> = useRef<Size>({ width: 100, height: 50 });
    const formattedTextRef: React.RefObject<string[]> = useRef<string[]>([]);
    const fadeTimeoutRef: React.RefObject<NodeJS.Timeout> = useRef<NodeJS.Timeout | null>(null);
    const arrowLocationRef: React.RefObject<TooltipLocation> = useRef<TooltipLocation>(createTooltipLocation(0, 0));
    const tipLocationRef: React.RefObject<TooltipLocation> = useRef<TooltipLocation>(createTooltipLocation(0, 0));
    const templateRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement | null>(null);
    const outOfBoundRef: React.RefObject<boolean> = useRef(false);
    const processingRef: React.RefObject<boolean> = useRef(false); // Prevent recursive processing
    const lastUpdateRef: React.RefObject<{
        content: string; header: string;
        location: {
            x: number;
            y: number;
        };
        shared: boolean;
    }> = useRef({
        content: '',
        header: '',
        location: { x: 0, y: 0 },
        shared: false
    });

    // Constants
    let padding: number = 5;
    const highlightPadding: number = 3;
    const areaMargin: number = 10;
    const arrowPadding: number = mergedProps.arrowPadding ?? 7;
    const marginX: number = mergedProps.marginX || 5;
    const marginY: number = mergedProps.marginY || 5;
    const rx: number = mergedProps.rx || 4;
    const ry: number = mergedProps.ry || 4;

    // Computed base values with proper memoization
    const baseX: number = useMemo(() => marginX * 2, [marginX]);
    const baseY: number = useMemo(() => {
        const fontSize: string = '12px';
        const font: TextStyle = { ...(mergedProps.textStyle || {}) };
        let textHeight: number = 0;
        if (mergedProps.controlName === 'Chart' && parseFloat(fontSize) < parseFloat(font.size || themeStyle.textStyle.headerTextSize as string)) {
            textHeight = (parseFloat(font.size || themeStyle.textStyle.size as string) - parseFloat(fontSize));
        }
        return (textHeight + marginY * 2 + padding * 2 + (marginY === 2 ? 3 : 0));
    }, [marginY, padding, mergedProps.controlName, mergedProps.textStyle, themeStyle]);
    // Initialize state using useReducer for grouped state
    const initialState: TooltipState = useMemo(() => ({
        elementSize: { width: 100, height: 50 },
        textData: {
            textSpans: [],
            markerPoints: [],
            isWrap: false,
            wrappedText: ''
        },
        shapesData: {
            pathData: '',
            headerLineData: '',
            markerShapes: [],
            textTransform: 'translate(0,0)'
        },
        filterData: {
            showFilter: false,
            filterDef: '',
            shadowId: ''
        },
        tooltipPosition: {
            x: mergedProps.location?.x || 0,
            y: mergedProps.location?.y || 0
        },
        tooltipOpacity: 0,
        isInitialAppearance: true
    }), []); // Empty dependency array since this should only run once

    const [state, dispatch] = useReducer(tooltipReducer, initialState);

    // Memoized content check to prevent unnecessary processing
    const contentKey: string = useMemo(() => {
        const content: string = Array.isArray(mergedProps.content) ? mergedProps.content.join('|') : '';
        const header: string = mergedProps.header || '';
        const location: string = `${mergedProps.location?.x || 0},${mergedProps.location?.y || 0}`;
        return `${content}_${header}_${location}_${mergedProps.shared}`;
    }, [mergedProps.content, mergedProps.header, mergedProps.location, mergedProps.shared]);

    // Template handling with useLayoutEffect
    useLayoutEffect(() => {
        if (mergedProps.template && templateRef.current && !processingRef.current) {
            try {
                processingRef.current = true;

                const rect: DOMRect = templateRef.current.getBoundingClientRect();
                const newSize: Size = { width: rect.width, height: rect.height };

                if (newSize.width > 0 && newSize.height > 0) {
                    elementSizeRef.current = newSize;
                    dispatch({ type: 'UPDATE_SIZE', payload: newSize });

                    arrowLocationRef.current = createTooltipLocation(0, 0);
                    tipLocationRef.current = createTooltipLocation(0, 0);
                    padding = 0;

                    if (mergedProps.areaBounds && mergedProps.location) {
                        const tooltipRect: Rect = calculateTooltipPosition(
                            mergedProps.areaBounds as Rect,
                            mergedProps.location as TooltipLocation,
                            arrowLocationRef.current,
                            tipLocationRef.current
                        );
                        dispatch({ type: 'SET_TOOLTIP_POSITION', payload: { x: tooltipRect.x, y: tooltipRect.y } });
                    }
                }
            } finally {
                processingRef.current = false;
            }
        }
    }, [mergedProps.template, mergedProps.data, contentKey]);

    // Initialize theme when component mounts
    useEffect(() => {
        setThemeStyle(getTooltipThemeColor(mergedProps.theme || 'Material3'));
    }, [mergedProps.theme]);

    // Process tooltip text - memoized to prevent excessive calls
    const processTooltipText: () => string[] = useCallback((): string[] => {
        if (processingRef.current) {
            return formattedTextRef.current;
        }

        try {
            processingRef.current = true;

            // Format text
            const newFormattedText: string[] = [];
            if (mergedProps.header && mergedProps.header.replace(/<b>/g, '').replace(/<\/b>/g, '').trim() !== '') {
                newFormattedText.push(mergedProps.header);
            }
            const allText: string[] = [...newFormattedText, ...(mergedProps.content || [])];
            formattedTextRef.current = allText;

            if (allText.length === 0) {
                const emptyState: Partial<TextData> = {
                    textSpans: [],
                    markerPoints: []
                };
                dispatch({ type: 'UPDATE_TEXT_DATA', payload: emptyState });
                dispatch({ type: 'UPDATE_SIZE', payload: { width: 0, height: 0 } });
                elementSizeRef.current = { width: 0, height: 0 };
                return allText;
            }

            // Begin text processing
            let height: number = 0;
            let width: number = 0;
            let subWidth: number = 0;

            // Get font style
            const font: TextStyle = { ...(mergedProps.textStyle || {}) };
            const leftSpace: number = (mergedProps.areaBounds?.x ?? 0) + (mergedProps.location?.x ?? 0);
            const rightSpace: number = ((mergedProps.areaBounds?.x ?? 0) + (mergedProps.areaBounds?.width ?? 0)) -
                    (mergedProps.areaBounds?.x ?? 0 + (mergedProps.location?.x ?? 0));
            const headerContent: string = mergedProps.header ? mergedProps.header.replace(/<b>/g, '').replace(/<\/b>/g, '').trim() : '';
            const isBoldTag: boolean = mergedProps.header ? (mergedProps.header.indexOf('<b>') > -1 && mergedProps.header.indexOf('</b>') > -1) : false;

            // Calculate header width
            const headerWidth: number = allText.length > 0 ?
                measureText(allText[0], font, themeStyle.textStyle).width +
                    (2 * marginX) + arrowPadding : 0;

            const isLeftSpace: boolean = ((mergedProps.location?.x ?? 0) - headerWidth) < (mergedProps.location?.x ?? 0);
            const isRightSpace: boolean = ((mergedProps.areaBounds?.x ?? 0) + (mergedProps.areaBounds?.width ?? 0)) <
                    ((mergedProps.location?.x ?? 0) + headerWidth);

            let headerSpace: number = 0;
            let isRow: boolean = true;
            let isColumn: boolean = true;
            const newMarkerPoint: number[] = [];
            const markerSize: number = (mergedProps.shapes?.length ?? 0) > 0 ? (mergedProps.markerSize || 10) : 0;
            const markerPadding: number = (mergedProps.shapes?.length ?? 0) > 0 ? 5 : 0;
            const spaceWidth: number = 4;
            const fontSize: string = '12px';
            let fontWeight: string = '400';
            const dy: number = (22 / parseFloat(fontSize)) * (parseFloat(font.size || themeStyle.textStyle.size as string));
            const contentWidth: number[] = [];
            let textHeight: number = 0;

            if (mergedProps.controlName === 'Chart' && parseFloat(fontSize) < parseFloat(font.size || themeStyle.textStyle.headerTextSize as string)) {
                textHeight = (parseFloat(font.size || themeStyle.textStyle.size as string) - parseFloat(fontSize));
            }

            const withoutHeader: boolean = allText.length === 1 && allText[0].indexOf(' : <b>') > -1;
            const isHeader: boolean = mergedProps.header !== '';
            const size: number = isHeader && isBoldTag ? 16 : 13;
            const newTextSpans: TextSpanElement[] = [];
            let isWrapVal: boolean = false;
            let wrappedTextVal: string = '';

            // Process each text element
            for (let k: number = 0; k < allText.length; k++) {
                let textCollection: string[] = allText[k as number].replace(/<(b|strong)>/g, '<b>')
                    .replace(/<\/(b|strong)>/g, '</b>')
                    .split(/<br.*?>/g);

                // Handle text wrapping
                if (mergedProps.isTextWrap && mergedProps.header !== allText[k as number] && allText[k as number].indexOf('<br') === -1) {
                    const subStringLength: number = Math.round(leftSpace > rightSpace ? (leftSpace / size) : (rightSpace / size));
                    textCollection = splitTextIntoChunks(allText[k as number], subStringLength);
                }

                // Handle header wrapping
                if (k === 0 && !withoutHeader && mergedProps.isTextWrap &&
                        (leftSpace < headerWidth || isLeftSpace) &&
                        (rightSpace < headerWidth || isRightSpace)) {
                    const subStringLength: number = Math.round(leftSpace > rightSpace ? (leftSpace / size) : (rightSpace / size));
                    const header: string = headerContent !== '' ? headerContent : allText[k as number];
                    textCollection = splitTextIntoChunks(header, subStringLength);
                    wrappedTextVal = isBoldTag ? `<b>${textCollection.join('<br>')}</b>` : textCollection.join('<br>');
                    isWrapVal = textCollection.length > 1;
                }

                // Skip empty collections
                if (textCollection[0] === '') {
                    continue;
                }

                // Add marker point for non-header elements
                if ((k !== 0) || (headerContent === '')) {
                    newMarkerPoint.push(
                        baseY + height -
                            (textHeight !== 0 ? ((textHeight / (mergedProps.markerSize || 10)) *
                                (parseFloat(font.size || themeStyle.textStyle.headerTextSize as string) /
                                 (mergedProps.markerSize || 10))) : 0)
                    );
                }

                // Process each line in text collection
                for (let i: number = 0; i < textCollection.length; i++) {
                    let lines: string[] = textCollection[i as number]
                        .replace(/<b>/g, '<br><b>')
                        .replace(/<\/b>/g, '</b><br>')
                        .replace(/:/g, mergedProps.enableRTL ? ': \u200E' : '<br>\u200E:<br>')
                        .split('<br>');

                    // Handle RTL text
                    if (mergedProps.enableRTL && lines.length > 0 && textCollection[i as number].includes(':')) {
                        const colonIndex: number = textCollection[i as number].indexOf(':');
                        if (colonIndex > -1) {
                            const label: string = textCollection[i as number].substring(0, colonIndex).trim();
                            const value: string = textCollection[i as number].substring(colonIndex + 1).trim();
                            lines = [`${label}: \u200E${value}`];
                        }
                    }

                    subWidth = 0;
                    isColumn = true;
                    height += dy;

                    // Process each line segment
                    for (let j: number = 0; j < lines.length; j++) {
                        let line: string = lines[j as number];

                        // Handle RTL text
                        if (mergedProps.enableRTL && line !== '' && isRTLText(line)) {
                            line = preserveNumbersInRtl(line);
                            if (isRTLText(line)) {
                                line = line.concat('\u200E');
                            }
                        }

                        // Handle whitespace
                        if (!/\S/.test(line) && line !== '') {
                            line = ' ';  // Trim multiple whitespace to single
                        }

                        // Process non-empty lines
                        if ((!isColumn && line === ' ') || (line.replace(/<b>/g, '').replace(/<\/b>/g, '').trim() !== '')) {
                            subWidth += line !== ' ' ? spaceWidth : 0;

                            // Calculate position for tspan
                            let x: number | undefined;
                            let tspanDy: number | undefined;

                            // Set position and style based on layout
                            if (isColumn && !isRow) {
                                if (mergedProps.header && mergedProps.header.indexOf('<br') > -1 && k !== 0) {
                                    headerSpace += mergedProps.header.split(/<br.*?>/g).length;
                                }
                                x = (marginX * 2) + (markerSize + markerPadding);
                                tspanDy = dy + (isColumn ? headerSpace : 0);
                                headerSpace = 0;
                            } else {
                                if (isRow && isColumn) {
                                    x = (headerContent === '') ?
                                        ((marginX * 2) + (markerSize + markerPadding)) :
                                        (marginX * 2) + (isWrapVal ? (markerSize + markerPadding) : 0);
                                    tspanDy = undefined;
                                } else {
                                    x = undefined;
                                    tspanDy = undefined;
                                }
                            }
                            isColumn = false;

                            // Set font styling
                            if (line.indexOf('<b>') > -1 || ((isBoldTag && j === 0 && k === 0) && (isHeader || isWrapVal))) {
                                fontWeight = '600';
                                font.fontWeight = fontWeight;
                            } else {
                                fontWeight = fontWeight === '600' ? fontWeight : 'normal';
                                font.fontWeight = fontWeight;
                            }

                            // Reset font weight after bold text
                            if (line.indexOf('</b>') > -1 || ((isBoldTag && j === lines.length - 1 && k === 0) && (isHeader || isWrapVal))) {
                                fontWeight = 'normal';
                            }

                            // Determine final font weight
                            const finalFontWeight: string = determineElementFontWeight(k, line, font);

                            // Set font size based on content type
                            const fontSize: string = (mergedProps.header === allText[k as number]) ?
                                font.size || themeStyle.textStyle.headerTextSize as string :
                                (line.indexOf('<b>') > -1 || line.indexOf('</b>') > -1) ?
                                    font.size || themeStyle.textStyle.boldTextSize as string :
                                    font.size || themeStyle.textStyle.size as string;

                            // Create text span style
                            const style: React.CSSProperties = {
                                fontFamily: 'inherit',
                                fontStyle: 'inherit',
                                fontSize,
                                fontWeight: finalFontWeight
                            };

                            // Process and set text content
                            const processedLine: string = getTooltipTextContent(line);

                            // Measure text width for positioning
                            const textMeasure: Size = measureText(processedLine, { ...font, size: fontSize }, themeStyle.textStyle);
                            subWidth += textMeasure.width;

                            // Create text span element
                            newTextSpans.push({
                                id: `${tooltipId}_text_span_${k}_${i}_${j}`,
                                content: processedLine,
                                x,
                                dy: tspanDy,
                                style
                            });
                            isRow = false;
                        }
                    }
                    subWidth -= spaceWidth;
                    width = Math.max(width, subWidth);
                    contentWidth.push(subWidth);
                }
            }

            // Set calculated size
            const newSize: Size = {
                width: width + (width > 0 ? (2 * marginX) : 0) + (markerSize + markerPadding),
                height: height
            };

            // Update both state and ref for element size
            elementSizeRef.current = newSize;
            dispatch({ type: 'UPDATE_SIZE', payload: newSize });

            // Prepare data for state update
            const textData: Partial<TextData> = {
                textSpans: newTextSpans,
                markerPoints: newMarkerPoint,
                isWrap: isWrapVal,
                wrappedText: wrappedTextVal
            };
            dispatch({ type: 'UPDATE_TEXT_DATA', payload: textData });

            // Center header text if needed
            if (mergedProps.showHeaderLine && headerContent !== '' && newTextSpans.length > 0 && !isWrapVal) {
                const centerX: number = (newSize.width + (2 * padding)) / 2 -
                        measureText(headerContent, { ...font, fontWeight: '600' }, themeStyle.textStyle, true).width / 2;

                // Update first text span to be centered
                const updatedSpans: TextSpanElement[] = [...newTextSpans];
                updatedSpans[0] = {
                    ...updatedSpans[0],
                    x: centerX
                };
                dispatch({
                    type: 'UPDATE_TEXT_DATA',
                    payload: { textSpans: updatedSpans }
                });
            }

            // Handle RTL content if needed
            if (mergedProps.enableRTL) {
                const idx: number = isHeader ? 1 : 0;
                const updatedSpans: TextSpanElement[] = [...newTextSpans];
                for (let i: number = 0; i < updatedSpans.length; i++) {
                    const span: TextSpanElement = updatedSpans[i as number];
                    if (span.x !== undefined && ((!isHeader) || i > 0)) {
                        if (idx >= 0 && idx < contentWidth.length) {
                            updatedSpans[i as number] = {
                                ...span,
                                x: (elementSizeRef.current.width - (markerSize + markerPadding + contentWidth[idx as number]))
                            };
                        }
                    }
                }
                dispatch({
                    type: 'UPDATE_TEXT_DATA',
                    payload: { textSpans: updatedSpans }
                });
            }

            return allText;
        } catch (error) {
            return formattedTextRef.current;
        } finally {
            processingRef.current = false;
        }
    }, [contentKey, themeStyle, baseY, marginX, arrowPadding, mergedProps]);

    // Process tooltip text with memoization and change detection
    useLayoutEffect(() => {
        if (!mergedProps.template) {
            const currentKey: string = `${mergedProps.content?.join('|') || ''}_${mergedProps.header || ''}`;
            const lastKey: string = `${lastUpdateRef.current.content}_${lastUpdateRef.current.header}`;

            if (currentKey !== lastKey) {
                processTooltipText();
                lastUpdateRef.current = {
                    content: mergedProps.content?.join('|') || '',
                    header: mergedProps.header || '',
                    location: mergedProps.location || { x: 0, y: 0 },
                    shared: mergedProps.shared || false
                };
            }
        }
    }, [contentKey, mergedProps.template, processTooltipText]);

    // Calculate and update tooltip positioning - with proper dependency management
    useEffect(() => {
        if (processingRef.current) {
            return;
        }

        if (elementSizeRef.current.width > 0 &&
                elementSizeRef.current.height > 0 &&
                mergedProps.areaBounds &&
                mergedProps.location &&
                !mergedProps.template) {

            try {
                processingRef.current = true;

                // Reset arrow and tip locations
                arrowLocationRef.current = createTooltipLocation(0, 0);
                tipLocationRef.current = createTooltipLocation(0, 0);

                // Get tooltip position and dimensions
                const tooltipRect: Rect = calculateTooltipPosition(
                    mergedProps.areaBounds as Rect,
                    mergedProps.location as TooltipLocation,
                    arrowLocationRef.current,
                    tipLocationRef.current
                );

                // Only update position if it has changed significantly
                const threshold: number = 1; // 1 pixel threshold
                if (Math.abs(state.tooltipPosition.x - tooltipRect.x) > threshold ||
                        Math.abs(state.tooltipPosition.y - tooltipRect.y) > threshold) {
                    dispatch({ type: 'SET_TOOLTIP_POSITION', payload: { x: tooltipRect.x, y: tooltipRect.y } });
                }

                // Determine tooltip placement
                let isTop: boolean = false;
                let isBottom: boolean = false;
                let isLeft: boolean = false;

                if (mergedProps.tooltipPlacement) {
                    isTop = mergedProps.tooltipPlacement.indexOf('Top') > -1;
                    isBottom = mergedProps.tooltipPlacement.indexOf('Bottom') > -1;
                    isLeft = mergedProps.tooltipPlacement.indexOf('Left') > -1;
                } else {
                    if (!mergedProps.inverted) {
                        isTop = (tooltipRect.y < (mergedProps.location.y + (mergedProps.clipBounds?.y || 0)));
                        isBottom = !isTop;
                    } else {
                        isLeft = (tooltipRect.x < (mergedProps.location.x + (mergedProps.clipBounds?.x || 0)));
                    }
                }

                const isRight: boolean = !isLeft && !isTop && !isBottom;

                // Calculate path for tooltip shape
                const start: number = (mergedProps.border?.width || 1) / 2;
                const x: number = mergedProps.inverted ? (isLeft ? 0 : arrowPadding) : 0;
                const y: number = !mergedProps.inverted ? (isTop ? 0 : arrowPadding) : 0;
                const pointRect: Rect = createRect(
                    start + x,
                    start + y,
                    tooltipRect.width - start,
                    tooltipRect.height - start
                );

                // Generate path data
                const path: string = findDirection(
                    rx,
                    ry,
                    pointRect,
                    arrowLocationRef.current,
                    arrowPadding,
                    isTop,
                    isBottom,
                    isLeft,
                    tipLocationRef.current.x,
                    tipLocationRef.current.y
                );

                // Set text transform
                let transform: string = 'translate(0,0)';
                if (isBottom) {
                    transform = `translate(0,${mergedProps.arrowPadding})`;
                }
                if (isRight) {
                    transform = `translate(${mergedProps.arrowPadding},0)`;
                }

                // Update shapes data
                dispatch({
                    type: 'UPDATE_SHAPES_DATA',
                    payload: {
                        pathData: path,
                        textTransform: transform
                    }
                });

                // Generate header line if needed
                if (mergedProps.header !== '' && mergedProps.showHeaderLine) {
                    generateHeaderLine(isBottom, isLeft, isTop, tooltipRect);
                }

                // Generate marker shapes if needed
                if (mergedProps.shapes && mergedProps.shapes.length > 0) {
                    generateMarkerShapes(isBottom, isRight);
                }

                // Handle shadow filter
                if (mergedProps.enableShadow) {
                    const id: string = `${tooltipId}_shadow`;
                    let shadow: string = `<filter id="${id}" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/>`;
                    shadow += '<feOffset dx="3" dy="3" result="offsetblur"/><feComponentTransfer><feFuncA type="linear" slope="0.5"/>';
                    shadow += '</feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
                    dispatch({
                        type: 'UPDATE_FILTER_DATA',
                        payload: {
                            showFilter: true,
                            shadowId: id,
                            filterDef: shadow
                        }
                    });
                } else {
                    dispatch({
                        type: 'UPDATE_FILTER_DATA',
                        payload: { showFilter: false }
                    });
                }
            } finally {
                processingRef.current = false;
            }
        }
    }, [
        // Only depend on essential props that affect positioning
        mergedProps.location?.x,
        mergedProps.location?.y,
        mergedProps.areaBounds?.x,
        mergedProps.areaBounds?.y,
        mergedProps.areaBounds?.width,
        mergedProps.areaBounds?.height,
        state.elementSize.width,
        state.elementSize.height,
        mergedProps.shared,
        contentKey
    ]);

    // Track tooltip visibility changes
    useEffect(() => {
        if (state.tooltipOpacity === 1) {
            const timer: NodeJS.Timeout = setTimeout(() => {
                dispatch({ type: 'SET_INITIAL_APPEARANCE', payload: false });
            }, 50);
            return () => clearTimeout(timer);
        } else {
            dispatch({ type: 'SET_INITIAL_APPEARANCE', payload: true });
            return undefined;
        }
    }, [state.tooltipOpacity]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        fadeOut: () => {
            dispatch({ type: 'SET_TOOLTIP_OPACITY', payload: 0 });
        },
        fadeIn: () => {
            dispatch({ type: 'SET_TOOLTIP_OPACITY', payload: 1 });
        }
    }), []);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (fadeTimeoutRef.current) {
                clearTimeout(fadeTimeoutRef.current);
            }
            processingRef.current = false;
        };
    }, []);

    // Helper functions (memoized where beneficial)
    const generateMarkerShapes: (isBottom: boolean, isRight: boolean) => void = useCallback((isBottom: boolean, isRight: boolean): void => {
        if (!mergedProps.shapes || mergedProps.shapes.length === 0 || !state.textData.markerPoints.length) {
            dispatch({ type: 'UPDATE_SHAPES_DATA', payload: { markerShapes: [] } });
            return;
        }

        const size: number = mergedProps.markerSize || 10;
        const newShapes: MarkerShape[] = [];
        let count: number = 0;

        const x: number = (mergedProps.enableRTL ? elementSizeRef.current.width :
            (marginX * 2) + (size / 2)) + (isRight ? arrowPadding : 0);

        for (const shape of mergedProps.shapes) {
            if (shape !== 'None' && count < state.textData.markerPoints.length) {
                const strokedShapes: string[] = ['Cross', 'Plus', 'HorizontalLine', 'VerticalLine'];
                const isStrokedShape: boolean = strokedShapes.includes(shape);
                let paddings: number = 0;

                if ((mergedProps.header?.indexOf('<br') || -1) > -1) {
                    paddings = ((mergedProps.header?.split(/<br.*?>/g).length || 0) + count);
                }

                const y: number = state.textData.markerPoints[count as number] - padding +
                        (isBottom ? arrowPadding : paddings);

                const shapeOption: PathOption = createPathOption(
                    `${tooltipId}_Trackball_${count}`,
                    mergedProps.palette?.[count as number] || '#000000',
                    1,
                    isStrokedShape ? mergedProps.palette?.[count as number] || '#000000'
                        : mergedProps.theme === 'Material3' ? '#cccccc' : '#ffffff',
                    1,
                    null
                );

                const location: TooltipLocation = createTooltipLocation(x, y);
                const shapeSize: Size = createSize(size, size);
                const shapeData: {
                    renderOption: RenderOption;
                    functionName: string;
                } = calculateShapes(location, shapeSize, shape, shapeOption);

                if (shapeData.functionName === 'Ellipse') {
                    newShapes.push({
                        id: `marker_${count}`,
                        type: 'ellipse',
                        cx: shapeData.renderOption.cx,
                        cy: shapeData.renderOption.cy,
                        rx: shapeData.renderOption.rx,
                        ry: shapeData.renderOption.ry,
                        fill: shapeOption.fill,
                        stroke: shapeOption.stroke,
                        strokeWidth: shapeOption.strokeWidth
                    });
                } else if (shapeData.functionName === 'Image') {
                    newShapes.push({
                        id: `marker_${count}`,
                        type: 'image',
                        x: shapeData.renderOption.x,
                        y: shapeData.renderOption.y,
                        width: shapeData.renderOption.width,
                        height: shapeData.renderOption.height,
                        fill: '',
                        stroke: '',
                        strokeWidth: 0
                    });
                } else {
                    newShapes.push({
                        id: `marker_${count}`,
                        type: 'path',
                        d: shapeData.renderOption.d,
                        fill: shapeOption.fill,
                        stroke: shapeOption.stroke,
                        strokeWidth: shapeOption.strokeWidth
                    });
                }
                count++;
            }
        }
        dispatch({ type: 'UPDATE_SHAPES_DATA', payload: { markerShapes: newShapes } });
    }, [mergedProps.shapes, mergedProps.markerSize, mergedProps.enableRTL, marginX,
        arrowPadding, state.textData.markerPoints, mergedProps.header, mergedProps.palette, mergedProps.theme, tooltipId, padding]);

    const generateHeaderLine: (isBottom: boolean, isLeft: boolean, isTop: boolean, rect: Rect) => void =
        useCallback((isBottom: boolean, isLeft: boolean, isTop: boolean, rect: Rect): void => {
            let wrapPadding: number = 2;
            let padding: number = 0;
            const wrapHeader: string = state.textData.isWrap ? state.textData.wrappedText : mergedProps.header;

            if (state.textData.isWrap && typeof (wrapHeader) === 'string' && (wrapHeader.indexOf('<') > -1 || wrapHeader.indexOf('>') > -1)) {
                const textArray: string[] = wrapHeader.split('<br>');
                wrapPadding = textArray.length;
            }

            if (mergedProps.header && mergedProps.header.indexOf('<br') > -1) {
                padding = 5 * (mergedProps.header.split(/<br.*?>/g).length - 1);
            }

            const font: TextStyle = { ...(mergedProps.textStyle || {}) };
            const headerSize: number = measureText(
                state.textData.isWrap ? state.textData.wrappedText : mergedProps.header,
                font,
                themeStyle.textStyle
            ).height + (marginY * wrapPadding) +
                (isBottom ? arrowPadding : 0) +
                (state.textData.isWrap ? 5 : padding);

            const xLength: number = (marginX * 3) + (!isLeft && !isTop && !isBottom ? arrowPadding : 0);
            const lineEnd: number = (rect.width + (!isLeft && !isTop && !isBottom ? arrowPadding : 0) - (marginX * 2));
            const direction: string = `M ${xLength} ${headerSize} L ${lineEnd} ${headerSize}`;

            dispatch({ type: 'UPDATE_SHAPES_DATA', payload: { headerLineData: direction } });
        }, [state.textData.isWrap, state.textData.wrappedText, mergedProps.header,
            mergedProps.textStyle, themeStyle.textStyle, marginY, marginX, arrowPadding]);


    /**
     * Wraps numeric values in a string with a left-to-right (LTR) span when RTL (right-to-left) layout is enabled.
     *
     * @param {string} text - The input string potentially containing numeric values.
     * @returns {string} The modified string with numeric values wrapped in <span dir="ltr"> tags if RTL is enabled;
     *          otherwise, returns the original string unchanged.
     */
    function preserveNumbersInRtl(text: string): string {
        if (!mergedProps.enableRTL) { return text; }
        return text.replace(/(\d+\.\d+|\d+)/g, (match: string) => {
            return `<span dir="ltr">${match}</span>`;
        });
    }

    /**
     * Splits a text string into chunks of specified maximum length.
     *
     * @param {string} text - The text to split into chunks
     * @param {number} chunkSize - The maximum size of each chunk
     * @returns {string[]} An array of text chunks
     */
    function splitTextIntoChunks(text: string, chunkSize: number): string[] {
        const chunks: string[] = [];
        let currentIndex: number = 0;
        while (currentIndex < text.length) {
            chunks.push(text.substring(currentIndex, currentIndex + chunkSize));
            currentIndex += chunkSize;
        }
        return chunks.length > 0 ? chunks : [text];
    }

    /**
     * Determines the font weight based on content type and theme configuration.
     *
     * @param {number} k - Index of the current content (header or text).
     * @param {string} line - The specific line of text being processed.
     * @param {TextStyle} font - The font styles applied to tooltip text.
     * @returns {string} The calculated font weight for the given line of text.
     */
    function determineElementFontWeight(k: number, line: string, font: TextStyle): string {
        if (mergedProps.header === formattedTextRef.current[k as number] &&
            (mergedProps.header.indexOf('<b>') === -1 || mergedProps.header.indexOf('</b>') === -1)) {
            return mergedProps.textStyle?.fontWeight || themeStyle.textStyle.fontWeight || '400';
        } else if (line.indexOf('<b>') > -1 || line.indexOf('</b>') > -1) {
            return 'bold';
        } else if ((line.indexOf('<b>') === -1 || line.indexOf('</b>') === -1)) {
            return mergedProps.textStyle?.fontWeight || themeStyle.textStyle.fontWeight || '400';
        } else {
            return mergedProps.textStyle?.fontWeight || font.fontWeight || 'normal';
        }
    }

    /**
     * Checks if the provided tooltip content is in a right-to-left (RTL) language.
     *
     * @param {string} tooltipContent - The content of the tooltip to check.
     * @returns {boolean} True if the content is RTL, otherwise false.
     */
    function isRTLText(tooltipContent: string): boolean {
        return /[\u0590-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(tooltipContent);
    }

    /**
     * Processes text content to remove any HTML tags for display purposes.
     *
     * @param {string} tooltipText - The raw text content potentially containing HTML tags.
     * @returns {string} Cleaned text content without HTML tags.
     */
    function getTooltipTextContent(tooltipText: string): string {
        if (!tooltipText) {
            return '';
        }
        return tooltipText.replace(/<[^>]*>/g, '');
    }

    /**
     * Calculates the position of the tooltip based on given bounds and locations,
     * considering inversion and positioning of arrows.
     *
     * @param {Rect} bounds - The bounding rectangle in which the tooltip must fit.
     * @param {TooltipLocation} symbolLocation - The location of the symbol to which the tooltip is anchored.
     * @param {TooltipLocation} arrowLocation - The location of the tooltip's arrow.
     * @param {TooltipLocation} tipLocation - The location of the tooltip's tip.
     * @returns {Rect} The calculated rectangle representing the tooltip's position and size.
     */
    function calculateTooltipPosition(
        bounds: Rect,
        symbolLocation: TooltipLocation,
        arrowLocation: TooltipLocation,
        tipLocation: TooltipLocation
    ): Rect {
        if (mergedProps.isFixed) {
            const width: number = elementSizeRef.current.width + (2 * marginX);
            const height: number = elementSizeRef.current.height + (2 * marginY);
            return createRect(symbolLocation.x, symbolLocation.y, width, height);
        }

        if (mergedProps.location) {
            const { x, y } = mergedProps.location;
            if (mergedProps.content && mergedProps.content.length > 1 && mergedProps.shared) {
                return sharedTooltipLocation(bounds, x, y);
            }
        }

        if (mergedProps.tooltipPlacement) {
            const tooltipRect: Rect = getCurrentPosition(bounds, symbolLocation, arrowLocation, tipLocation);
            return tooltipRect;
        }

        let location: TooltipLocation = createTooltipLocation(symbolLocation.x, symbolLocation.y);
        const width: number = elementSizeRef.current.width + (2 * marginX);
        const height: number = elementSizeRef.current.height + (2 * marginY);
        const markerHeight: number = mergedProps.offset || 0;
        const clipX: number = mergedProps.clipBounds?.x || 0;
        const clipY: number = mergedProps.clipBounds?.y || 0;
        const boundsX: number = bounds.x;
        const boundsY: number = bounds.y;
        outOfBoundRef.current = false;

        // Position based on inverted state
        if (!mergedProps.inverted) {
            // Normal tooltip positioning (above/below point)
            location = createTooltipLocation(
                location.x + clipX - elementSizeRef.current.width / 2 - padding,
                location.y + clipY - elementSizeRef.current.height - (2 * (mergedProps.allowHighlight ? highlightPadding : padding)) -
                    arrowPadding - markerHeight
            );
            arrowLocation.x = tipLocation.x = width / 2;

            // Adjust for boundary constraints
            if ((location.y < boundsY || mergedProps.isNegative) && !(mergedProps.controlName === 'Progressbar')) {
                location.y = (symbolLocation.y < 0 ? 0 : symbolLocation.y) + clipY + markerHeight;
            }

            if (location.y + height + arrowPadding > boundsY + bounds.height) {
                location.y = Math.min(symbolLocation.y, boundsY + bounds.height) + clipY
                        - elementSizeRef.current.height - (2 * padding) - arrowPadding - markerHeight;
            }

            if (((location.x + width > boundsX + bounds.width) && location.y < boundsY || mergedProps.isNegative) &&
                    !(mergedProps.controlName === 'Progressbar')) {
                location.y = (symbolLocation.y < 0 ? 0 : symbolLocation.y) + clipY + markerHeight;
            }

            // Horizontal adjustments
            if (location.x < boundsX && !(mergedProps.controlName === 'Progressbar')) {
                arrowLocation.x -= (boundsX - location.x);
                tipLocation.x -= (boundsX - location.x);
                location.x = boundsX;
            }

            if (location.x + width > boundsX + bounds.width && !(mergedProps.controlName === 'Progressbar')) {
                arrowLocation.x += ((location.x + width) - (boundsX + bounds.width));
                tipLocation.x += ((location.x + width) - (boundsX + bounds.width));
                location.x -= ((location.x + width) - (boundsX + bounds.width));
            }

            // Arrow position adjustments
            if (arrowLocation.x + arrowPadding > width - rx) {
                arrowLocation.x = width - rx - arrowPadding;
                tipLocation.x = width - rx - arrowPadding;
            }

            if (arrowLocation.x - arrowPadding < rx) {
                arrowLocation.x = tipLocation.x = rx + arrowPadding;
            }

            // Chart-specific logic
            if (mergedProps.controlName === 'Chart') {
                if (((bounds.x + bounds.width) - (location.x + arrowLocation.x)) < areaMargin + arrowPadding ||
                        (location.x + arrowLocation.x) < areaMargin + arrowPadding) {
                    outOfBoundRef.current = true;
                }

                if (mergedProps.template && (location.y < 0)) {
                    location.y = symbolLocation.y + clipY + markerHeight;
                }

                // Switch to inverted mode if out of bounds
                if (!withInAreaBounds(location.x, location.y, bounds) || outOfBoundRef.current) {
                    mergedProps.inverted = !mergedProps.inverted;

                    location = createTooltipLocation(
                        symbolLocation.x + markerHeight + clipX,
                        symbolLocation.y + clipY - elementSizeRef.current.height / 2 - padding
                    );
                    tipLocation.x = arrowLocation.x = 0;
                    tipLocation.y = arrowLocation.y = height / 2;

                    if ((location.x + arrowPadding + width > boundsX + bounds.width) || mergedProps.isNegative) {
                        location.x = (symbolLocation.x > boundsX + bounds.width ? bounds.width : symbolLocation.x)
                                + clipX - markerHeight - (arrowPadding + width);
                    }

                    if (location.x < boundsX) {
                        location.x = (symbolLocation.x < 0 ? 0 : symbolLocation.x) + markerHeight + clipX;
                    }

                    if (location.y <= boundsY) {
                        tipLocation.y -= (boundsY - location.y);
                        arrowLocation.y -= (boundsY - location.y);
                        location.y = boundsY;
                    }

                    if (location.y + height >= bounds.height + boundsY) {
                        arrowLocation.y += ((location.y + height) - (bounds.height + boundsY));
                        tipLocation.y += ((location.y + height) - (bounds.height + boundsY));
                        location.y -= ((location.y + height) - (bounds.height + boundsY));
                    }

                    if (arrowPadding + arrowLocation.y > height - ry) {
                        arrowLocation.y = height - arrowPadding - ry;
                        tipLocation.y = height;
                    }

                    if (arrowLocation.y - arrowPadding < ry) {
                        arrowLocation.y = arrowPadding + ry;
                        tipLocation.y = 0;
                    }
                }
            }
        } else {
            // Inverted positioning (left/right of point)
            location = createTooltipLocation(
                location.x + clipX + markerHeight,
                location.y + clipY - elementSizeRef.current.height / 2 - padding
            );
            arrowLocation.y = tipLocation.y = height / 2;

            if ((location.x + width + arrowPadding > boundsX + bounds.width) || mergedProps.isNegative) {
                location.x = (symbolLocation.x > boundsX + bounds.width ? bounds.width : symbolLocation.x)
                        + clipX - markerHeight - (width + arrowPadding);
            }

            if (location.x < boundsX) {
                location.x = (symbolLocation.x < 0 ? 0 : symbolLocation.x) + clipX + markerHeight;
            }

            if (location.x + width + arrowPadding > boundsX + bounds.width) {
                location.x = (symbolLocation.x > bounds.width + boundsX ? bounds.width : symbolLocation.x)
                        + clipX - markerHeight - (width + arrowPadding);
            }

            if (location.y <= boundsY) {
                arrowLocation.y -= (boundsY - location.y);
                tipLocation.y -= (boundsY - location.y);
                location.y = boundsY;
            }

            if (location.y + height >= boundsY + bounds.height) {
                arrowLocation.y += ((location.y + height) - (boundsY + bounds.height));
                tipLocation.y += ((location.y + height) - (boundsY + bounds.height));
                location.y -= ((location.y + height) - (boundsY + bounds.height));
            }

            if (arrowLocation.y + arrowPadding > height - ry) {
                arrowLocation.y = height - ry - arrowPadding;
                tipLocation.y = height;
            }

            if (arrowLocation.y - arrowPadding < ry) {
                arrowLocation.y = tipLocation.y = ry + arrowPadding;
            }

            // Chart-specific logic for inverted mode
            if (mergedProps.controlName === 'Chart') {
                if ((location.y + arrowLocation.y) < areaMargin + arrowPadding ||
                        ((bounds.y + bounds.height) - (location.y + arrowLocation.y)) < areaMargin + arrowPadding) {
                    outOfBoundRef.current = true;
                }

                if (!withInAreaBounds(location.x, location.y, bounds) || outOfBoundRef.current) {
                    mergedProps.inverted = !mergedProps.inverted;
                    location = createTooltipLocation(
                        symbolLocation.x + clipX - padding - elementSizeRef.current.width / 2,
                        symbolLocation.y + clipY - elementSizeRef.current.height - (2 * padding) - markerHeight - arrowPadding
                    );
                    tipLocation.x = arrowLocation.x = width / 2;
                    tipLocation.y = arrowLocation.y = 0;
                    if (location.x + width > boundsX + bounds.width) {
                        arrowLocation.x += ((location.x + width) - (boundsX + bounds.width));
                        tipLocation.x += ((location.x + width) - (boundsX + bounds.width));
                        location.x -= ((location.x + width) - (boundsX + bounds.width));
                    }
                    // Arrow position adjustments
                    if (arrowLocation.x + (arrowPadding) > width - (rx)) {
                        arrowLocation.x = width - (rx) - (arrowPadding);
                        tipLocation.x = width - (rx) - (arrowPadding);
                    }
                    if (arrowLocation.x - (arrowPadding) < (rx)) {
                        arrowLocation.x = tipLocation.x = (rx) + (arrowPadding);
                    }
                }
            }
        }
        return createRect(location.x, location.y, width, height);
    }

    /**
     * Calculates the tooltip location for shared tooltips, using the provided bounds and coordinates.
     *
     * @param {Rect} bounds - The bounding rectangle for the tooltip placement.
     * @param {number} x - The x-coordinate of the initial tooltip position.
     * @param {number} y - The y-coordinate of the initial tooltip position.
     * @returns {Rect} Adjusted rectangle representing the tooltip's position.
     */
    function sharedTooltipLocation(bounds: Rect, x: number, y: number): Rect {
        const width: number = elementSizeRef.current.width + (2 * marginX);
        const height: number = elementSizeRef.current.height + (2 * marginY);
        const tooltipRect: Rect = createRect(
            x + 4 * padding,
            y - height - padding,
            width,
            height
        );

        if (tooltipRect.y < bounds.y) {
            tooltipRect.y += (tooltipRect.height + 2 * padding);
        }

        if (tooltipRect.y + tooltipRect.height > bounds.y + bounds.height) {
            tooltipRect.y = Math.max(
                (bounds.y + bounds.height) - (tooltipRect.height + 2 * padding),
                bounds.y
            );
        }

        if (tooltipRect.x + tooltipRect.width > bounds.x + bounds.width) {
            const locationX: number = mergedProps.location?.x ?? 0;
            tooltipRect.x = (bounds.x + locationX) - (tooltipRect.width + 4 * padding);
        }

        if (tooltipRect.x < bounds.x) {
            tooltipRect.x = bounds.x;
        }

        return tooltipRect;
    }

    /**
     * Determines the current tooltip position and adjusts it based on the layout.
     *
     * @param {Rect} bounds - Bounds for positioning.
     * @param {TooltipLocation} symbolLocation - Initial symbol location.
     * @param {TooltipLocation} arrowLocation - Location adjustments for arrow.
     * @param {TooltipLocation} tipLocation - Location adjustments for tip.
     * @returns {Rect} Tooltip rectangle with updated positioning.
     */
    function getCurrentPosition(bounds: Rect, symbolLocation: TooltipLocation,
                                arrowLocation: TooltipLocation, tipLocation: TooltipLocation): Rect {
        const position: TooltipPlacement | undefined = mergedProps.tooltipPlacement;
        const clipX: number = mergedProps.clipBounds?.x || 0;
        const clipY: number = mergedProps.clipBounds?.y || 0;
        const markerHeight: number = mergedProps.offset || 0;
        const width: number = elementSizeRef.current.width + (2 * marginX);
        const height: number = elementSizeRef.current.height + (2 * marginY);
        let location: TooltipLocation = createTooltipLocation(symbolLocation.x, symbolLocation.y);

        if (position === 'Top' || position === 'Bottom') {
            location = createTooltipLocation(
                location.x + clipX - elementSizeRef.current.width / 2 - padding,
                location.y + clipY - elementSizeRef.current.height - (2 * padding) - arrowPadding - markerHeight
            );
            arrowLocation.x = tipLocation.x = width / 2;

            if (position === 'Bottom') {
                location.y = symbolLocation.y + clipY + markerHeight;
            }

            if (bounds.x + bounds.width < location.x + width) {
                location.x = (bounds.width > width) ? ((bounds.x + bounds.width) - width + 6) : bounds.x;
                arrowLocation.x = tipLocation.x = (bounds.width > width) ? (bounds.x + symbolLocation.x - location.x) : symbolLocation.x;
            } else if (bounds.x > location.x) {
                location.x = bounds.x;
                arrowLocation.x = tipLocation.x = symbolLocation.x;
            }
        } else {
            location = createTooltipLocation(
                location.x + clipX + markerHeight,
                location.y + clipY - elementSizeRef.current.height / 2 - padding
            );
            arrowLocation.y = tipLocation.y = height / 2;

            if (position === 'Left') {
                location.x = symbolLocation.x + clipX - markerHeight - (width + arrowPadding);
            }

            if (bounds.y + bounds.height < location.y + height) {
                location.y = (bounds.height > height) ? ((bounds.y + bounds.height) - height + 6) : bounds.y;
                arrowLocation.y = tipLocation.y = (bounds.height > height) ? (bounds.y + symbolLocation.y - location.y) : symbolLocation.y;
            } else if (bounds.y > location.y) {
                location.y = bounds.y;
                arrowLocation.y = tipLocation.y = symbolLocation.y;
            }
        }

        return createRect(location.x, location.y, width, height);
    }

    // Memoized render functions
    const renderMarkers: () => JSX.Element[] = useCallback((): JSX.Element[] => {
        return state.shapesData.markerShapes.map((shape: MarkerShape) => {
            if (shape.type === 'ellipse') {
                return (
                    <ellipse
                        key={shape.id}
                        cx={shape.cx}
                        cy={shape.cy}
                        rx={shape.rx}
                        ry={shape.ry}
                        fill={shape.fill}
                        stroke={shape.stroke}
                        strokeWidth={shape.strokeWidth}
                    />
                );
            } else if (shape.type === 'image') {
                return (
                    <image
                        key={shape.id}
                        x={shape.x}
                        y={shape.y}
                        width={shape.width}
                        height={shape.height}
                        xlinkHref={shape.fill}
                    />
                );
            } else {
                return (
                    <path
                        key={shape.id}
                        d={shape.d}
                        fill={shape.fill}
                        stroke={shape.stroke}
                        strokeWidth={shape.strokeWidth}
                    />
                );
            }
        });
    }, [state.shapesData.markerShapes]);

    const renderTextSpans: () => JSX.Element[] = useCallback((): JSX.Element[] => {
        return state.textData.textSpans.map((span: TextSpanElement, index: number) => (
            <tspan
                key={span.id || index}
                x={span.x}
                dy={span.dy}
                style={span.style}
                fill={mergedProps.textStyle?.color || themeStyle.tooltipLightLabel}
            >
                {
                    mergedProps.enableRTL
                        ? span.content.replace(/:(?!\u200E)/g, ': \u200E')
                        : span.content
                }
            </tspan>
        ));
    }, [state.textData.textSpans, mergedProps.textStyle?.color, mergedProps.enableRTL, themeStyle.tooltipLightLabel]);

    // Final component render
    return (
        <>
            {mergedProps.template && mergedProps.data ? (
                <div
                    id={tooltipId}
                    className="e-tooltip"
                    style={{
                        position: 'absolute',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        opacity: state.tooltipOpacity,
                        left: state.tooltipPosition.x + 'px',
                        top: state.tooltipPosition.y + 'px',
                        transition: (mergedProps.enableAnimation && !state.isInitialAppearance && state.tooltipOpacity === 1)
                            ? 'top 300ms ease-out, left 300ms ease-out, opacity 300ms ease-out'
                            : 'opacity 300ms ease-out'
                    }}
                >
                    <div
                        id={`${tooltipId}parent_template`}
                        ref={templateRef}
                        style={{
                            padding: 0,
                            backgroundColor: 'transparent',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {mergedProps.template(mergedProps.data)}
                    </div>
                </div>
            ) : (
                <g
                    id={`${tooltipId}_group`}
                    transform={`translate(${state.tooltipPosition.x},${state.tooltipPosition.y})`}
                    className="e-tooltip"
                    style={{
                        opacity: state.tooltipOpacity,
                        transition: (mergedProps.enableAnimation && !state.isInitialAppearance && state.tooltipOpacity === 1)
                            ? 'transform 300ms ease-out, opacity 300ms ease-out'
                            : 'opacity 300ms ease-out'
                    }}
                >
                    {state.filterData.showFilter && (
                        <defs id={`${tooltipId}SVG_tooltip_definition`}
                            dangerouslySetInnerHTML={{ __html: state.filterData.filterDef }}
                        />
                    )}
                    <path
                        id={`${tooltipId}_path`}
                        d={state.shapesData.pathData}
                        strokeWidth={mergedProps.border?.width || 1}
                        fill={mergedProps.fill || themeStyle?.tooltipFill}
                        opacity={(mergedProps.opacity === 0.75) ? 1 : mergedProps.opacity}
                        stroke={mergedProps.border?.color || ''}
                        strokeDasharray={mergedProps.border?.dashArray}
                        filter={state.filterData.showFilter ? `url(#${state.filterData.shadowId})` : undefined}
                    />
                    {state.shapesData.headerLineData && (
                        <path
                            id={`${tooltipId}_header_path`}
                            d={state.shapesData.headerLineData}
                            strokeWidth={1.5}
                            fill="none"
                            opacity={0.2}
                            stroke={themeStyle.tooltipHeaderLine}
                        />
                    )}
                    <text
                        id={`${tooltipId}_text`}
                        transform={state.shapesData.textTransform}
                        x={baseX}
                        y={baseY}
                        fontFamily={(mergedProps?.textStyle && mergedProps?.textStyle.fontFamily) || themeStyle?.textStyle.fontFamily}
                        fontStyle={(mergedProps?.textStyle && mergedProps?.textStyle.fontStyle) || 'Normal'}
                        fontSize={(mergedProps?.textStyle && mergedProps?.textStyle.size) || themeStyle?.textStyle.size}
                        opacity={(mergedProps?.textStyle && mergedProps?.textStyle.opacity) || themeStyle?.textStyle.opacity}
                        fill={(mergedProps?.textStyle && mergedProps?.textStyle.color) || themeStyle?.textStyle.color}
                        textAnchor={mergedProps?.enableRTL ? 'end' : ''}
                    >
                        {renderTextSpans()}
                    </text>
                    <g id={`${tooltipId}_trackball_group`}>
                        {renderMarkers()}
                    </g>
                </g>
            )}
        </>
    );
});
export default Tooltip;
