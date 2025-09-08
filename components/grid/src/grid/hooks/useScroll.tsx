import { CSSProperties, useCallback, useLayoutEffect, useRef, UIEvent, useMemo, useState, useEffect, RefObject } from 'react';
import { Browser, isNullOrUndefined } from '@syncfusion/react-base';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { IGrid } from '../types/grid.interfaces';
import { MutableGridSetter, UseScrollResult, ScrollElements, ScrollCss } from '../types/interfaces';

/**
 * Custom hook to manage scroll synchronization between header and content panels
 *
 * @private
 * @returns {UseScrollResult} Scroll-related APIs and functions
 */
export const useScroll: () => UseScrollResult = (): UseScrollResult => {
    const grid: Partial<IGrid> & Partial<MutableGridSetter> = useGridComputedProvider();
    const { height, enableRtl, enableStickyHeader } = grid;
    const { getParentElement } = useGridMutableProvider();
    const [scrollStyles, setScrollStyles] = useState<{ headerPadding: CSSProperties; headerContentBorder: CSSProperties; }>({
        headerPadding: {},
        headerContentBorder: {}
    });

    // Use ref to maintain references to DOM elements
    const elementsRef: RefObject<ScrollElements> = useRef<ScrollElements>({
        headerScrollElement: null,
        contentScrollElement: null,
        footerScrollElement: null
    });

    /**
     * Determine CSS properties based on RTL/LTR mode
     *
     * @returns {ScrollCss} CSS properties for scroll customization
     */
    const getCssProperties: ScrollCss = useMemo((): ScrollCss => {
        return {
            border: enableRtl ? 'borderLeftWidth' : 'borderRightWidth',
            padding: enableRtl ? 'paddingLeft' : 'paddingRight'
        };
    }, [enableRtl]);

    /**
     * Get browser-specific threshold for scrollbar calculations
     *
     * @returns {number} Threshold value
     */
    const getThreshold: () => number = useCallback((): number => {
        // Safely access Browser.info with multiple fallbacks
        if (!Browser?.info) { return 1; }
        const browserName: string = Browser.info.name;
        return browserName === 'mozilla' ? 0.5 : 1;
    }, []);

    /**
     * Calculate scrollbar width
     *
     * @returns {number} Width of the scrollbar
     */
    const getScrollBarWidth: () => number = useCallback((): number => {
        const { contentScrollElement } = elementsRef.current;
        return (contentScrollElement.offsetWidth - contentScrollElement.clientWidth) | 0;
    }, []);

    /**
     * Set padding based on scrollbar width to ensure header and content alignment
     */
    const setPadding: () => void = useCallback((): void => {

        const scrollWidth: number = getScrollBarWidth() - getThreshold();
        const cssProps: ScrollCss = getCssProperties;

        const paddingValue: string = scrollWidth > 0 ? `${scrollWidth}px` : '0px';
        const borderValue: string = scrollWidth > 0 ? '1px' : '0px';

        setScrollStyles({
            headerPadding: { [cssProps.padding]: paddingValue },
            headerContentBorder: { [cssProps.border]: borderValue }
        });
    }, [getScrollBarWidth, getThreshold, getCssProperties]);

    const setSticky: (headerEle: HTMLElement, top?: number, width?: number, left?: number, isAddStickyHeader?: boolean) => void =
        useCallback((headerEle: HTMLElement, top?: number, width?: number, left?: number, isAddStickyHeader?: boolean): void => {
            if (isAddStickyHeader) {
                headerEle.classList.add('sf-sticky');
            } else {
                headerEle.classList.remove('sf-sticky');
            }
            headerEle.style.width = width != null ? width + 'px' : '';
            headerEle.style.top = top != null ? top + 'px' : '';
            headerEle.style.left = left !== null ? left + 'px' : '';
        }, []);

    /**
     * Complete implementation of makeStickyHeader following original component logic exactly
     * This matches the original scroll.ts makeStickyHeader method line by line
     */
    const makeStickyHeader: () => void = useCallback(() => {
        const { contentScrollElement, headerScrollElement } = elementsRef.current;
        if (!getParentElement() || !contentScrollElement) {
            return;
        }

        const gridElement: HTMLElement = getParentElement();
        const contentRect: DOMRect = contentScrollElement.getBoundingClientRect();

        if (!contentRect) {
            return;
        }

        // Handle window scale for proper positioning
        const windowScale: number = window.devicePixelRatio;
        const headerEle: HTMLElement = headerScrollElement?.parentElement;
        const toolbarEle: HTMLElement | null = gridElement.querySelector('.sf-toolbar');

        if (!headerEle) {
            return;
        }

        // Calculate total height including all sticky elements (exact original logic)
        const height: number = headerEle.offsetHeight +
            (toolbarEle ? toolbarEle.offsetHeight : 0);

        const parentTop: number = gridElement.getBoundingClientRect().top;
        let top: number = contentRect.top - (parentTop < 0 ? 0 : parentTop);
        const left: number = contentRect.left;

        // Handle window scale adjustment (from original)
        if (windowScale !== 1) {
            top = Math.ceil(top);
        }

        // Apply sticky positioning when scrolled (exact original logic)
        if (top < height && contentRect.bottom > 0) {
            headerEle.classList.add('sf-sticky');
            let elemTop: number = 0;

            // Handle toolbar sticky positioning (from original)
            if (toolbarEle) {
                setSticky(toolbarEle, elemTop, contentRect.width, left, true);
                elemTop += toolbarEle.getBoundingClientRect().height;
            }

            // Handle main header sticky positioning (from original)
            setSticky(headerEle, elemTop, contentRect.width, left, true);

        } else {
            // Remove sticky positioning when not needed (exact original logic)
            if (headerEle.classList.contains('sf-sticky')) {
                setSticky(headerEle, null, null, null, false);

                if (toolbarEle) {
                    setSticky(toolbarEle, null, null, null, false);
                }
            }
        }
    }, [setSticky, getParentElement]);

    const addEventListener: () => void = useCallback((): void => {
        const scrollableParent: HTMLElement = getScrollbleParent(getParentElement().parentElement);
        if (scrollableParent) {
            window.addEventListener('scroll', makeStickyHeader);
        }
    }, [getParentElement, makeStickyHeader]);

    const removeEventListener: () => void = useCallback((): void => {
        window.removeEventListener('scroll', makeStickyHeader);
    }, [makeStickyHeader]);

    const getScrollbleParent: (node: HTMLElement) => HTMLElement = useCallback((node: HTMLElement): HTMLElement => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parent: HTMLElement = isNullOrUndefined(node.tagName) ? (node as any).scrollingElement : node;
        const overflowY: string = document.defaultView.getComputedStyle(parent, null).overflowY;
        if (parent.scrollHeight > parent.clientHeight && overflowY !== 'visible' ||
            node.tagName === 'HTML' || node.tagName === 'BODY') {
            return node;
        } else {
            return getScrollbleParent(node.parentNode as HTMLElement);
        }
    }, []);

    // Update padding when height or RTL mode changes
    useLayoutEffect(() => {
        if (elementsRef.current.contentScrollElement) {
            setPadding();
        }
    }, [height, enableRtl, setPadding]);

    useEffect(() => {
        if (enableStickyHeader) {
            addEventListener();
        }
        return () => {
            if (enableStickyHeader) {
                removeEventListener();
            }
        };
    }, [enableStickyHeader]);

    /**
     * Set reference to header scroll element
     *
     * @param {HTMLElement | null} element - Header scroll DOM element
     */
    const setHeaderScrollElement: (element: HTMLElement | null) => void = useCallback((element: HTMLElement | null): void => {
        elementsRef.current.headerScrollElement = element;
    }, []);

    /**
     * Set reference to content scroll element
     *
     * @param {HTMLElement | null} element - Content scroll DOM element
     */
    const setContentScrollElement: (element: HTMLElement | null) => void = useCallback((element: HTMLElement | null): void => {
        elementsRef.current.contentScrollElement = element;
    }, []);

    /**
     * Set reference to footer scroll element
     *
     * @param {HTMLElement | null} element - Footer element
     */
    const setFooterScrollElement: (element: HTMLElement | null) => void = useCallback((element: HTMLElement | null): void => {
        elementsRef.current.footerScrollElement = element;
    }, []);

    /**
     * Handle content scroll events and synchronize header scroll position
     * Optimized for immediate synchronization to prevent gridline misalignment
     *
     * @param {UIEvent<HTMLDivElement>} args - Scroll event arguments
     */
    const onContentScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const { headerScrollElement, footerScrollElement } = elementsRef.current;

        const target: HTMLDivElement = args.target as HTMLDivElement;
        const left: number = target.scrollLeft;

        // IMMEDIATE synchronization - no requestAnimationFrame delay to prevent gridline misalignment
        headerScrollElement.scrollLeft = left;
        if (footerScrollElement) {
            footerScrollElement.scrollLeft = left;
        }
    }, []);

    /**
     * Handle header scroll events and synchronize content scroll position
     * This is especially important for keyboard navigation (tabbing)
     * Optimized for immediate synchronization to prevent gridline misalignment
     *
     * @param {UIEvent<HTMLDivElement>} args - Scroll event arguments
     */
    const onHeaderScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const { contentScrollElement } = elementsRef.current;

        const target: HTMLDivElement = args.target as HTMLDivElement;
        const left: number = target.scrollLeft;

        // IMMEDIATE synchronization - no requestAnimationFrame delay to prevent gridline misalignment
        contentScrollElement.scrollLeft = left;
    }, []);

    /**
     * Handle footer scroll events and synchronize content scroll position
     * This maintains consistency between footer and content scroll positions
     * Optimized for immediate synchronization to prevent gridline misalignment
     *
     * @param {UIEvent<HTMLDivElement>} args - Scroll event arguments
     */
    const onFooterScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const { contentScrollElement } = elementsRef.current;

        const target: HTMLDivElement = args.target as HTMLDivElement;
        const left: number = target.scrollLeft;

        // IMMEDIATE synchronization - no requestAnimationFrame delay to prevent gridline misalignment
        contentScrollElement.scrollLeft = left;
    }, []);

    // Clean up resources on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            // Clear references to DOM elements
            elementsRef.current = {
                headerScrollElement: null,
                contentScrollElement: null,
                footerScrollElement: null
            };
        };
    }, []);

    // Memoize API objects to prevent unnecessary re-renders
    const publicScrollAPI: Partial<IGrid> = useMemo(() => ({ ...grid }), [grid]);

    const privateScrollAPI: UseScrollResult['privateScrollAPI'] = useMemo(() => ({
        getCssProperties,
        headerContentBorder: scrollStyles.headerContentBorder,
        headerPadding: scrollStyles.headerPadding,
        onContentScroll,
        onHeaderScroll,
        onFooterScroll
    }), [getCssProperties, scrollStyles.headerContentBorder, scrollStyles.headerPadding, onContentScroll, onHeaderScroll, onFooterScroll]);

    const protectedScrollAPI: UseScrollResult['protectedScrollAPI'] = useMemo(() => ({
        setPadding
    }), [setPadding]);

    return {
        publicScrollAPI,
        privateScrollAPI,
        protectedScrollAPI,
        setHeaderScrollElement,
        setContentScrollElement,
        setFooterScrollElement
    };
};
