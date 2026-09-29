import { useCallback, useEffect, useLayoutEffect, useRef, RefObject } from 'react';
import { TabValue, HeaderPlacement } from '../types';
import { TabsState } from '../internal-types';

export interface UseTabsIndicatorResult {
    hostRef: RefObject<HTMLDivElement | null>;
}

/**
 * @private
 */
export const INDICATOR_PROPS: ReadonlyArray<string> = [
    '--tab-indicator-inline-start',
    '--tab-indicator-inline-end',
    '--tab-indicator-top',
    '--tab-indicator-bottom',
    '--tab-indicator-width',
    '--tab-indicator-height',
    '--tab-indicator-visible'
];

interface PlacementMath {
    crossVar: 'top' | 'bottom';
    crossStart: (tabRect: DOMRect, hostRect: DOMRect, host: HTMLDivElement) => number;
    mainStart: (tabRect: DOMRect, hostRect: DOMRect, host: HTMLDivElement) => number;
}

/**
 * @private
 */
export const UNDERLINE_SIZE: number = 3;

/**
 * @private
 */
export const PLACEMENT_MATH: Record<HeaderPlacement, PlacementMath> = {
    Top: {
        crossVar: 'top',
        crossStart: (t: DOMRect, h: DOMRect, host: HTMLDivElement) => t.top - h.top + host.scrollTop,
        mainStart: (t: DOMRect, h: DOMRect, host: HTMLDivElement) => t.left - h.left + host.scrollLeft
    },
    Bottom: {
        crossVar: 'bottom',
        crossStart: (t: DOMRect, h: DOMRect, host: HTMLDivElement) => h.bottom - t.bottom + host.scrollTop,
        mainStart: (t: DOMRect, h: DOMRect, host: HTMLDivElement) => t.left - h.left + host.scrollLeft
    },
    Left: {
        crossVar: 'top',
        crossStart: (t: DOMRect, h: DOMRect, host: HTMLDivElement) => t.top - h.top + host.scrollTop,
        mainStart: (t: DOMRect, h: DOMRect, host: HTMLDivElement) => t.left + t.width - UNDERLINE_SIZE - h.left + host.scrollLeft
    },
    Right: {
        crossVar: 'top',
        crossStart: (t: DOMRect, h: DOMRect, host: HTMLDivElement) => t.top - h.top + host.scrollTop,
        mainStart: (t: DOMRect, h: DOMRect, host: HTMLDivElement) => t.left - h.left + host.scrollLeft
    }
};

interface LatestRefs {
    getElement: (value: TabValue) => HTMLElement | null;
    state: TabsState;
    placement: HeaderPlacement;
    hasIndicator: boolean;
}

/**
 * Applies the specified CSS custom property values to the host element.
 *
 * @private
 * @param {HTMLDivElement} host The host element to update.
 * @param {Record<string, string>} props CSS custom property names and values.
 * @returns {void}
 */
export const setHostProps: (
    host: HTMLDivElement,
    props: Record<string, string>
) => void =
    (
        host: HTMLDivElement,
        props: Record<string, string>
    ): void => {
        for (const name in props) {
            if (Object.prototype.hasOwnProperty.call(props, name)) {
                host.style.setProperty(name, props[name as string]);
            }
        }
    };

/**
 * Removes all indicator-related CSS custom properties from the host element.
 *
 * @private
 * @param {HTMLDivElement} host The host element to clear.
 * @returns {void}
 */
export const clearHostIndicator: (host: HTMLDivElement) => void =
    (host: HTMLDivElement): void => {
        for (const name of INDICATOR_PROPS) {
            host.style.removeProperty(name);
        }
    };

export const useTabsIndicator: (
    state: TabsState,
    getElement: (value: TabValue) => HTMLElement | null,
    hasIndicator?: boolean,
    headerPlacement?: HeaderPlacement
) => UseTabsIndicatorResult =
    (
        state: TabsState,
        getElement: (value: TabValue) => HTMLElement | null,
        hasIndicator: boolean = false,
        headerPlacement: HeaderPlacement = 'Top'
    ): UseTabsIndicatorResult => {
        const hostRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const latestRef: RefObject<LatestRefs> = useRef<LatestRefs>({
            getElement, state, placement: headerPlacement, hasIndicator
        });
        latestRef.current = { getElement, state, placement: headerPlacement, hasIndicator };

        const writeVariables: () => void = useCallback((): void => {
            const latest: LatestRefs = latestRef.current;
            if (!latest.hasIndicator) { return; }
            const hostEl: HTMLDivElement | null = hostRef.current;
            if (hostEl === null) { return; }
            const active: TabValue | null = latest.state.value;
            if (active === null) {
                setHostProps(hostEl, { '--tab-indicator-visible': '0' });
                return;
            }
            const tabEl: HTMLElement | null = latest.getElement(active);
            if (tabEl === null) {
                setHostProps(hostEl, { '--tab-indicator-visible': '0' });
                return;
            }
            const hostRect: DOMRect = hostEl.getBoundingClientRect();
            const tabRect: DOMRect = tabEl.getBoundingClientRect();
            const math: PlacementMath = PLACEMENT_MATH[latest.placement];
            setHostProps(hostEl, {
                '--tab-indicator-inline-start': `${math.mainStart(tabRect, hostRect, hostEl)}px`,
                '--tab-indicator-inline-end': 'auto',
                [`--tab-indicator-${math.crossVar}`]: `${math.crossStart(tabRect, hostRect, hostEl)}px`,
                '--tab-indicator-width': `${tabRect.width}px`,
                '--tab-indicator-height': `${tabRect.height}px`,
                '--tab-indicator-visible': '1'
            });
        }, []);

        useLayoutEffect(() => {
            latestRef.current = { getElement, state, placement: headerPlacement, hasIndicator };
            writeVariables();
        }, [writeVariables, hasIndicator, state.value, state.tabCount, getElement, state, headerPlacement]);

        useEffect(() => {
            if (!hasIndicator) { return; }
            if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame((): void => { writeVariables(); });
            }
        }, [hasIndicator, writeVariables, state.value]);

        useEffect(() => {
            if (hasIndicator) { return; }
            const hostEl: HTMLDivElement | null = hostRef.current;
            if (hostEl === null) { return; }
            clearHostIndicator(hostEl);
        }, [hasIndicator]);
        return { hostRef };
    };

