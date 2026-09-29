import { useCallback, useEffect, useMemo, useRef, useState, RefObject } from 'react';
import { TabValue } from '../types';

export interface UseTabsOverflowOptions {
    hostRef: RefObject<HTMLDivElement | null>;
    triggerRef: RefObject<HTMLButtonElement | null>;
    tabOrderRef: { current: ReadonlyArray<TabValue> };
    orientation: 'horizontal' | 'vertical';
    enabled: boolean;
}

export interface UseTabsOverflowResult {
    hasOverflow: boolean;
    visibleTabIds: ReadonlyArray<TabValue>;
    overflowTabIds: ReadonlyArray<TabValue>;
    refreshOverflow: () => void;
}

const TAB_FALLBACK_ESTIMATE: number = 72;

const measureSize: (el: HTMLElement, isVertical: boolean) => number =
    (el: HTMLElement, isVertical: boolean): number =>
        isVertical ? el.offsetHeight : el.offsetWidth;

export const useTabsOverflow: (options: UseTabsOverflowOptions) => UseTabsOverflowResult =
    (options: UseTabsOverflowOptions): UseTabsOverflowResult => {
        const { hostRef, triggerRef, tabOrderRef, orientation, enabled } = options;
        const [hasOverflow, setHasOverflow] = useState<boolean>(false);
        const [visibleTabIds, setVisibleTabIds] = useState<ReadonlyArray<TabValue>>([]);
        const [overflowTabIds, setOverflowTabIds] = useState<ReadonlyArray<TabValue>>([]);

        const tabSizesCacheRef: RefObject<Map<TabValue, number>> = useRef<Map<TabValue, number>>(new Map());
        const observerRef: RefObject<ResizeObserver | null> = useRef<ResizeObserver | null>(null);
        const measureRafRef: RefObject<number | null> = useRef<number | null>(null);

        const isVertical: boolean = orientation === 'vertical';

        const resetOverflow: () => void = useCallback((): void => {
            setHasOverflow(false);
            setVisibleTabIds([]);
            setOverflowTabIds([]);
        }, []);

        const measure: () => void = useCallback((): void => {
            if (!enabled) {
                resetOverflow();
                return;
            }
            const host: HTMLDivElement | null = hostRef.current;
            if (!host) {
                return;
            }
            const order: readonly TabValue[] = tabOrderRef.current;
            if (order.length === 0) {
                resetOverflow();
                return;
            }

            const hostSize: number = isVertical ? host.clientHeight : host.clientWidth;
            if (hostSize <= 0) {
                setHasOverflow(false);
                setVisibleTabIds(order);
                setOverflowTabIds([]);
                return;
            }

            const style: CSSStyleDeclaration = window.getComputedStyle(host);
            const computedGap: number = parseFloat(isVertical ? style.rowGap : style.columnGap) || parseFloat(style.gap) || 16;
            const previousSizes: Map<TabValue, number> = tabSizesCacheRef.current;
            const measured: Map<TabValue, number> = new Map<TabValue, number>();
            let sumKnown: number = 0;
            let countKnown: number = 0;
            const children: HTMLCollection = host.children;

            for (let i: number = 0; i < order.length; i++) {
                const value: TabValue = order[i as number];
                const el: HTMLElement | undefined = children[i as number] as HTMLElement | undefined;

                if (el && el.classList.contains('sf-tab')) {
                    const s: number = measureSize(el, isVertical);
                    measured.set(value, s);
                    sumKnown += s;
                    countKnown++;
                } else if (previousSizes.has(value)) {
                    const s: number = previousSizes.get(value)!;
                    measured.set(value, s);
                    sumKnown += s;
                    countKnown++;
                }
            }

            const fallbackSize: number = countKnown > 0 ? Math.round(sumKnown / countKnown) : TAB_FALLBACK_ESTIMATE;
            for (const value of order) {
                if (!measured.has(value)) {
                    measured.set(value, fallbackSize);
                }
            }
            tabSizesCacheRef.current = measured;

            let totalWithGaps: number = 0;
            for (let i: number = 0; i < order.length; i++) {
                const val: TabValue = order[i as number];
                const size: number = measured.get(val) ?? fallbackSize;
                totalWithGaps += size + (i > 0 ? computedGap : 0);
            }

            if (totalWithGaps > hostSize) {
                const triggerSize: number = 36;
                const availableForTabs: number = hostSize - triggerSize - computedGap;

                const visible: TabValue[] = [];
                const overflow: TabValue[] = [];
                let accumulated: number = 0;

                for (const value of order) {
                    const size: TabValue = measured.get(value) ?? fallbackSize;
                    const needed: number = visible.length === 0 ? size : size + computedGap;

                    if (visible.length === 0 || accumulated + needed <= availableForTabs) {
                        visible.push(value);
                        accumulated += needed;
                    } else {
                        overflow.push(value);
                    }
                }

                setHasOverflow(overflow.length > 0);
                setVisibleTabIds(visible);
                setOverflowTabIds(overflow);
            }
        }, [enabled, hostRef, triggerRef, tabOrderRef, isVertical]);

        const refreshOverflow: () => void = useCallback((): void => measure(), [measure]);

        const measureRef: RefObject<() => void> = useRef<() => void>(measure);
        measureRef.current = measure;

        const scheduleMeasure: () => void = useCallback((): void => {
            const raf: ((callback: FrameRequestCallback) => number) | undefined = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : undefined;
            const cancel: ((handle: number) => void) | undefined = typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : undefined;
            if (!raf) {
                measureRef.current();
                return;
            }
            if (measureRafRef.current !== null && cancel) {
                cancel(measureRafRef.current);
            }
            measureRafRef.current = raf(() => {
                measureRafRef.current = null;
                measureRef.current();
            });
        }, []);

        useEffect(() => {
            return () => {
                if (measureRafRef.current !== null && typeof cancelAnimationFrame !== 'undefined') {
                    cancelAnimationFrame(measureRafRef.current);
                    measureRafRef.current = null;
                }
            };
        }, []);

        useEffect(() => {
            if (!enabled || typeof ResizeObserver === 'undefined') {
                return undefined;
            }
            const host: HTMLDivElement | null = hostRef.current;
            if (!host) {
                return undefined;
            }

            const observer: ResizeObserver = new ResizeObserver(() => {
                scheduleMeasure();
            });
            observer.observe(host);
            observerRef.current = observer;

            scheduleMeasure();

            return () => {
                observer.disconnect();
                if (observerRef.current === observer) {
                    observerRef.current = null;
                }
            };
        }, [enabled, hostRef, scheduleMeasure]);

        useEffect(() => {
            return () => {
                tabSizesCacheRef.current.clear();
                if (observerRef.current) {
                    observerRef.current.disconnect();
                    observerRef.current = null;
                }
                if (measureRafRef.current !== null && typeof cancelAnimationFrame !== 'undefined') {
                    cancelAnimationFrame(measureRafRef.current);
                    measureRafRef.current = null;
                }
            };
        }, []);

        const tabOrderLength: number = tabOrderRef.current.length;
        useEffect(() => {
            scheduleMeasure();
        }, [enabled, tabOrderLength, scheduleMeasure]);

        return useMemo((): UseTabsOverflowResult => ({
            hasOverflow,
            visibleTabIds,
            overflowTabIds,
            refreshOverflow
        }), [hasOverflow, visibleTabIds, overflowTabIds, refreshOverflow]);
    };
