import * as React from 'react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useProviderContext, ResizeDirections } from '@syncfusion/react-base';
import { ResizeEvent } from '../index';
export { ResizeDirections };

type ResizeLimits = {
    minWidthPx: number;
    minHeightPx: number;
    maxWidthPx: number;
    maxHeightPx: number;
}

type ResizeOriginState = {
    width: number;
    height: number;
    left: number;
    top: number;
    mouseX: number;
    mouseY: number;
}

/**
 * Specifies the options for the useResize hook.
 */
export interface IResize {
    /**
     * Specifies whether resizing is enabled. When false, all resize capabilities are disabled
     * and handles will not be rendered.
     *
     * @default false
     */
    enabled?: boolean;

    /**
     * Specifies which edges or corners of the element can be dragged to resize it.
     * Array of directions like 'North', 'SouthEast', etc. Use 'All' to enable all handles.
     * Cardinal directions create border handles, while corner directions create corner handles.
     *
     * @default ['SouthEast']
     */
    handles?: ResizeDirections[];

    /**
     * Specifies the minimum width constraint for the resizable element.
     *
     * @default 100
     */
    minWidth?: number | string;

    /**
     * Specifies the minimum height constraint for the resizable element.
     *
     * @default 100
     */
    minHeight?: number | string;

    /**
     * Specifies the maximum width constraint for the resizable element.
     * Can be specified as pixels, percentage, or other CSS units.
     * Prevents resizing beyond this width.
     *
     * @default Number.MAX_SAFE_INTEGER
     */
    maxWidth?: number | string;

    /**
     * Specifies the maximum height constraint for the resizable element.
     * Can be specified as pixels, percentage, or other CSS units.
     * Prevents resizing beyond this height.
     *
     * @default Number.MAX_SAFE_INTEGER
     */
    maxHeight?: number | string;

    /**
     * Specifies the element that defines the boundaries for resizing.
     * The element cannot be resized beyond the boundaries of this container.
     *
     * @default document.body
     */
    boundary?: HTMLElement;

    /**
     * Specifies the callback fired when resize operation starts.
     * Receives a ResizeEvent object with current dimensions and direction.
     *
     * @event resizeStart
     */
    onResizeStart?: (args: ResizeEvent) => void;

    /**
     * Specifies the callback fired continuously during resize operation.
     * Receives a ResizeEvent object with updated dimensions and direction.
     *
     * @event resize
     */
    onResize?: (args: ResizeEvent) => void;

    /**
     * Specifies the callback fired when resize operation ends.
     * Receives a ResizeEvent object with final dimensions and direction.
     *
     * @event resizeStop
     */
    onResizeStop?: (args: ResizeEvent) => void;
}

/**
 * Specifies the state and functionality returned by the useResize hook.
 * Provides access to current dimensions, resize direction information, and methods for rendering resize handles.
 */
export interface IResizeContext {
    /**
     * Specifies the current width of the resized element in pixels.
     * Updates dynamically during resize operations.
     */
    width: number;

    /**
     * Specifies the current height of the resized element in pixels.
     * Updates dynamically during resize operations.
     */
    height: number;

    /**
     * Specifies the current active resize direction if a resize is in progress.
     */
    direction: ResizeDirections;

    /**
     * Specifies the function to render resize handles with optional icon for corner handles.
     * Automatically positions handles based on configured directions.
     *
     * @param iconComponent Optional React element to display in corner handles
     * @returns Array of resize handle elements ready to be rendered
     */
    renderResizeHandles: (iconComponent?: React.ReactNode) => React.ReactNode[];
}

const DEFAULT_MIN_SIZE: number = 100;
const BORDER_HANDLE_SIZE: number = 2;

/**
 * Specifies a custom hook that provides resize functionality for React components.
 * Allows elements to be resized by dragging handles on the edges and corners,
 * with support for minimum/maximum size constraints and multiple resize directions.
 *
 * @param {React.RefObject<HTMLElement>} elementRef - Reference to the element that will be made resizable
 * @param {IResize} options - Resize configuration options including constraints and event handlers
 * @returns {IResizeContext} Resize state and handle rendering function
 */
export function useResize(
    elementRef: React.RefObject<HTMLElement>,
    options: IResize
): IResizeContext {
    const {
        enabled = false,
        handles = ['SouthEast'],
        minWidth = DEFAULT_MIN_SIZE,
        minHeight = DEFAULT_MIN_SIZE,
        maxWidth = Number.MAX_SAFE_INTEGER,
        maxHeight = Number.MAX_SAFE_INTEGER,
        boundary,
        onResizeStart,
        onResize,
        onResizeStop
    } = options;

    const { dir } = useProviderContext();
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const currentDirectionRef: React.RefObject<ResizeDirections | undefined> = useRef<ResizeDirections | undefined>(undefined);
    const originalStateRef: React.RefObject<ResizeOriginState> = useRef<ResizeOriginState>({
        width: 0, height: 0, left: 0, top: 0, mouseX: 0, mouseY: 0 });
    const limitsRef: React.RefObject<ResizeLimits> = useRef<ResizeLimits>({ minWidthPx: DEFAULT_MIN_SIZE,
        minHeightPx: DEFAULT_MIN_SIZE, maxWidthPx: Number.MAX_SAFE_INTEGER, maxHeightPx: Number.MAX_SAFE_INTEGER });
    const allDirections: ResizeDirections[] = ['North', 'East', 'South', 'West', 'NorthEast', 'NorthWest', 'SouthEast', 'SouthWest'];

    const parseToPixels: (value: number | string | undefined, defaultValue: number, referenceSize: number) => number = useCallback((
        value: number | string | undefined, defaultValue: number, referenceSize: number ): number => {
        if (value === undefined) {return defaultValue; }
        if (typeof value === 'number') {return value; }
        if ( typeof value !== 'string') {return defaultValue; }

        if (value.endsWith('%')) {
            const percentage: number = parseFloat(value) / 100;
            return referenceSize * percentage;
        }
        if (value.endsWith('px')) {
            return parseFloat(value);
        }
        if (elementRef.current && typeof window !== 'undefined') {
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(elementRef.current);
            const fontSize: number = parseFloat(computedStyle.fontSize);
            const rootFontSize: number = parseFloat(getComputedStyle(document.documentElement).fontSize);
            if (value.endsWith('em')) {
                return parseFloat(value) * fontSize;
            }
            if (value.endsWith('rem')) {
                return parseFloat(value) * rootFontSize;
            }
            if (value.endsWith('vh')) {
                return (parseFloat(value) / 100) * window.innerHeight;
            }
            if (value.endsWith('vw')) {
                return (parseFloat(value) / 100) * window.innerWidth;
            }
            if (value.endsWith('vmin')) {
                const minV: number = Math.min(window.innerWidth, window.innerHeight);
                return (parseFloat(value) / 100) * minV;
            }
            if (value.endsWith('vmax')) {
                const maxV: number = Math.max(window.innerWidth, window.innerHeight);
                return (parseFloat(value) / 100) * maxV;
            }
            if (value.endsWith('ch')) {
                return parseFloat(value) * fontSize * 0.5;
            }
            if (value.endsWith('ex')) {
                return parseFloat(value) * fontSize * 0.5;
            }
        }

        return defaultValue;
    }, [elementRef]);

    const updateResizeLimits: () => void = useCallback(() => {
        if (!elementRef.current) {return; }

        const parentElement: HTMLElement = elementRef.current.parentElement || document.body;
        const parentRect: DOMRect = parentElement.getBoundingClientRect();

        limitsRef.current = {
            minWidthPx: parseToPixels(minWidth, DEFAULT_MIN_SIZE, parentRect.width),
            minHeightPx: parseToPixels(minHeight, DEFAULT_MIN_SIZE, parentRect.height),
            maxWidthPx: parseToPixels(maxWidth, Number.MAX_SAFE_INTEGER, parentRect.width),
            maxHeightPx: parseToPixels(maxHeight, Number.MAX_SAFE_INTEGER, parentRect.height)
        };
    }, [minWidth, minHeight, maxWidth, maxHeight, parseToPixels]);

    const isCardinalDirection: (direction: string) => boolean = useCallback((direction: string): boolean => {
        return ['North', 'South', 'East', 'West'].includes(direction);
    }, []);

    const getActiveHandles: () => ResizeDirections[] = useCallback((): ResizeDirections[] => {
        if (!enabled) {
            return [];
        }

        const mapRtlDirections: (direction: ResizeDirections) => ResizeDirections = (direction: ResizeDirections): ResizeDirections => {
            const rtlMap: Record<ResizeDirections, ResizeDirections> = {
                'East': 'West',
                'West': 'East',
                'NorthEast': 'NorthWest',
                'NorthWest': 'NorthEast',
                'SouthEast': 'SouthWest',
                'SouthWest': 'SouthEast',
                'North': 'North',
                'South': 'South',
                'All': 'All'
            };

            return rtlMap[direction as ResizeDirections];
        };

        let activeHandles: ResizeDirections[];

        if (handles.includes('All')) {
            activeHandles = [...allDirections];
        } else {
            activeHandles = handles?.length > 0
                ? handles.filter((dir: ResizeDirections) => allDirections.includes(dir))
                : ['SouthEast'];
        }
        if (dir === 'rtl') {
            return activeHandles.map(mapRtlDirections);
        }

        return activeHandles;
    }, [enabled, handles, dir]);

    useEffect(() => {
        if (elementRef.current && enabled) {
            const rect: DOMRect = elementRef.current.getBoundingClientRect();
            setWidth(rect.width);
            setHeight(rect.height);
            updateResizeLimits();
        }
    }, [elementRef.current, enabled, updateResizeLimits]);

    useEffect(() => {
        if (enabled) {
            updateResizeLimits();
        }
    }, [minWidth, minHeight, maxWidth, maxHeight, enabled, updateResizeLimits]);

    const handleResizeStart: (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, direction: ResizeDirections) => void =
    useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, direction: ResizeDirections) => {
        if (!enabled || !elementRef.current) { return; }
        if (!('touches' in e)) {
            e.preventDefault();
        }
        updateResizeLimits();
        const rect: DOMRect = elementRef.current.getBoundingClientRect();
        originalStateRef.current.width = rect.width;
        originalStateRef.current.height = rect.height;
        originalStateRef.current.left  = rect.left;
        originalStateRef.current.top  = rect.top;
        let clientX: number; let clientY: number;
        if ('changedTouches' in e) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }
        originalStateRef.current.mouseX  = clientX;
        originalStateRef.current.mouseY   = clientY;
        currentDirectionRef.current = direction;
        if (onResizeStart && elementRef.current) {
            const rect: DOMRect = elementRef.current.getBoundingClientRect();
            const resizeEvent: ResizeEvent = {
                event: e as Event,
                width: rect.width,
                height: rect.height,
                direction: currentDirectionRef.current,
                cancel: false
            };
            onResizeStart(resizeEvent);
            if (resizeEvent.cancel) {
                return;
            }
        }
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('touchmove', handleResize);
        document.addEventListener('mouseup', handleResizeEnd);
        document.addEventListener('touchend', handleResizeEnd);
    }, [enabled, onResizeStart, elementRef, boundary, updateResizeLimits]);

    const handleResize: (e: MouseEvent | TouchEvent) => void = useCallback((e: MouseEvent | TouchEvent) => {
        if (!elementRef.current) {
            return;
        }
        if (!('touches' in e)) {
            e.preventDefault();
        }
        let clientX: number; let clientY: number;
        if ('changedTouches' in e) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }
        const deltaX: number = clientX - originalStateRef.current.mouseX;
        const deltaY: number = clientY - originalStateRef.current.mouseY;
        let newWidth: number = originalStateRef.current.width;
        let newHeight: number = originalStateRef.current.height;
        let newLeft: number = originalStateRef.current.left;
        let newTop: number = originalStateRef.current.top;
        const direction: ResizeDirections = currentDirectionRef.current as ResizeDirections;
        const { minWidthPx, maxWidthPx, minHeightPx, maxHeightPx } = limitsRef.current;
        if (direction.includes('East')) {
            newWidth = Math.max(minWidthPx, Math.min(maxWidthPx, originalStateRef.current.width + deltaX));
        }
        if (direction.includes('West')) {
            const widthChange: number = -deltaX;
            newWidth = Math.max(minWidthPx, Math.min(maxWidthPx, originalStateRef.current.width + widthChange));
            if (newWidth !== originalStateRef.current.width) {
                newLeft = originalStateRef.current.left - (newWidth - originalStateRef.current.width);
            }
        }
        if (direction.includes('South')) {
            newHeight = Math.max(minHeightPx, Math.min(maxHeightPx, originalStateRef.current.height + deltaY));
        }
        if (direction.includes('North')) {
            const heightChange: number = -deltaY;
            newHeight = Math.max(minHeightPx, Math.min(maxHeightPx, originalStateRef.current.height + heightChange));
            if (newHeight !== originalStateRef.current.height) {
                newTop = originalStateRef.current.top - (newHeight - originalStateRef.current.height);
            }
        }
        if (boundary && boundary !== document.body) {
            const boundaryRect: DOMRect = boundary.getBoundingClientRect();
            if (newLeft < boundaryRect.left) {
                newLeft = boundaryRect.left;
                newWidth = originalStateRef.current.width - (boundaryRect.left - originalStateRef.current.left);
            }
            if (newTop < boundaryRect.top) {
                newTop = boundaryRect.top;
                newHeight = originalStateRef.current.height - (boundaryRect.top - originalStateRef.current.top);
            }
            if (newLeft + newWidth > boundaryRect.right) {
                newWidth = boundaryRect.right - newLeft;
            }
            if (newTop + newHeight > boundaryRect.bottom) {
                newHeight = boundaryRect.bottom - newTop;
            }
        }
        setWidth(newWidth);
        setHeight(newHeight);
        if (elementRef.current) {
            elementRef.current.style.width = `${newWidth}px`;
            elementRef.current.style.height = `${newHeight}px`;
            elementRef.current.style.left = `${newLeft}px`;
            elementRef.current.style.top = `${newTop}px`;
            if (boundary && boundary !== document.body) {
                elementRef.current.style.position = 'fixed';
            }
            else {
                elementRef.current.style.position = 'absolute';
            }
        }
        if (onResize) {
            onResize({
                event: e,
                width: newWidth,
                height: newHeight,
                direction: direction
            });
        }
    }, [onResize, boundary]);

    const handleResizeEnd: (e: MouseEvent | TouchEvent) => void = useCallback((e: MouseEvent | TouchEvent) => {
        if (onResizeStop && elementRef.current) {
            const rect: DOMRect = elementRef.current.getBoundingClientRect();
            onResizeStop({
                event: e,
                width: rect.width,
                height: rect.height,
                direction: currentDirectionRef.current as ResizeDirections
            });
        }

        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('touchmove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.removeEventListener('touchend', handleResizeEnd);
    }, [onResizeStop, handleResize]);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('touchmove', handleResize);
            document.removeEventListener('mouseup', handleResizeEnd);
            document.removeEventListener('touchend', handleResizeEnd);
        };
    }, [handleResize, handleResizeEnd]);

    const getHandleProps: (direction: ResizeDirections) => React.HTMLAttributes<HTMLElement> =
    useCallback((direction: ResizeDirections) => {
        const directionToClassMap: Record<string, string> = {
            'North': 'north sf-resize-ns',
            'South': 'south sf-resize-ns',
            'East': 'east sf-resize-ew',
            'West': 'west sf-resize-ew',
            'NorthEast': 'north-east sf-resize-nesw',
            'NorthWest': 'north-west sf-resize-nwse',
            'SouthEast': 'south-east sf-resize-nwse',
            'SouthWest': 'south-west sf-resize-nesw',
            'All': 'all'
        };
        const directionClass: string = directionToClassMap[direction as string];
        const isCardinal: boolean = isCardinalDirection(direction);
        const baseStyle: React.CSSProperties = {
            position: 'absolute',
            zIndex: 1000
        };
        let positionStyle: React.CSSProperties = {};
        if (isCardinal) {
            if (direction === 'North') {
                positionStyle = {
                    height: `${BORDER_HANDLE_SIZE}px`,
                    width: '100%',
                    top: '0',
                    left: '0'
                };
            } else if (direction === 'South') {
                positionStyle = {
                    height: `${BORDER_HANDLE_SIZE}px`,
                    width: '100%',
                    bottom: '0',
                    left: '0'
                };
            } else if (direction === 'East') {
                positionStyle = {
                    width: `${BORDER_HANDLE_SIZE}px`,
                    height: '100%',
                    right: '0',
                    top: '0'
                };
            } else if (direction === 'West') {
                positionStyle = {
                    width: `${BORDER_HANDLE_SIZE}px`,
                    height: '100%',
                    left: '0',
                    top: '0'
                };
            }
        }

        return {
            className: isCardinal
                ? `sf-dlg-border-resize sf-dlg-${directionClass}`
                : `sf-dlg-resize-handle sf-dlg-${directionClass}`,
            ...(isCardinal ? {style: { ...baseStyle, ...positionStyle }} : {}),
            onMouseDown: (e: React.MouseEvent) => handleResizeStart(e, direction),
            onTouchStart: (e: React.TouchEvent) => handleResizeStart(e, direction),
            role: 'button',
            'aria-label': `Resize ${direction}`
        };
    }, [handleResizeStart, isCardinalDirection]);

    const renderResizeHandles: (iconComponent?: React.ReactNode) => React.ReactNode[] =
    useCallback((iconComponent?: React.ReactNode): React.ReactNode[] => {
        const handles: ResizeDirections[] = getActiveHandles();
        return handles.map((direction: ResizeDirections) => {
            const props: React.HtmlHTMLAttributes<HTMLElement> = getHandleProps(direction);
            const isCorner: boolean = !isCardinalDirection(direction);
            const ElementType: 'span' | 'div' = isCardinalDirection(direction) ? 'span' : 'div';

            return (
                <ElementType
                    key={direction}
                    {...props}
                >
                    {isCorner && iconComponent}
                </ElementType>
            );
        });
    }, [getActiveHandles, getHandleProps, isCardinalDirection]);

    return {
        width,
        height,
        direction: currentDirectionRef.current as ResizeDirections,
        renderResizeHandles
    };
}
