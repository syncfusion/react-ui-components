import { useEffect, useCallback, useMemo, useRef, RefObject, type MouseEvent, type KeyboardEvent } from 'react';
import { formatUnit } from '@syncfusion/react-base';
import { PopupEvent } from '../../drop-down-list/types';
import { UseDropdownPopupProps, useDropdownPopupReturn } from './hook-types';
import { CSS_CLASSES } from '../constants';

export const useDropdownPopup: (props: UseDropdownPopupProps) => useDropdownPopupReturn = (props: UseDropdownPopupProps):
useDropdownPopupReturn => {
    const {
        state: { isPopupOpen },
        actions: { setIsPopupOpen, setIsSpanFocused },
        config: { onOpen, onClose, multiSelectable, open, combinedPopupSettings },
        refs: { dropdownRootRef, inputElementRef, popupRef }
    } = props;

    const isOpenControlled: boolean = useMemo(() => open !== undefined, [open]);
    const previousHeightRef: RefObject<number | null> = useRef<number | null>(null);
    const popupWidth: string = combinedPopupSettings.width as string;
    const popupHeight: string = combinedPopupSettings.height as string;

    const showPopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>
    | Event) => void = useCallback((e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => {
        if (!isOpenControlled) {
            setIsPopupOpen(true);
            inputElementRef.current?.focus();
        }
        if (onOpen) {
            const eventArgs: PopupEvent = { event: e };
            onOpen(eventArgs);
        }
    }, [isOpenControlled, setIsPopupOpen, inputElementRef, onOpen, popupRef]);

    const hidePopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>
    | Event) => void = useCallback((e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => {
        if (!isOpenControlled) {
            setIsPopupOpen(false);
        }
        if (onClose && popupRef.current) {
            const eventArgs: PopupEvent = { event: e };
            onClose(eventArgs);
        }
        if (!open) {
            setIsSpanFocused(true);
        }
    }, [isOpenControlled, setIsPopupOpen, onClose, popupRef, open, setIsSpanFocused, inputElementRef]);

    const getEventPath: (e: globalThis.MouseEvent) => EventTarget[] = (e: globalThis.MouseEvent) => {
        return e.composedPath?.() ?? [];
    };

    const isOutside: (path: EventTarget[], el: HTMLElement | null | undefined) => boolean =
    (path: EventTarget[], el: HTMLElement | null | undefined) => {
        return !!el && !path.includes(el);
    };

    const handleDocumentClick: (e: globalThis.MouseEvent) => void = useCallback((e: globalThis.MouseEvent) => {
        const path: EventTarget[] = getEventPath(e);
        const elementTarget: Element = (path[0] ?? e.target) as Element;
        const isOutsideInput: boolean = isOutside(path, dropdownRootRef.current);
        const isOutsidePopup: boolean = isOutside(path, popupRef.current?.element);
        if ((isPopupOpen && isOutsideInput && isOutsidePopup) ||
            (!isOutsideInput && popupRef.current?.element?.classList.contains(CSS_CLASSES.INPUT_GROUP))) {
            hidePopup(e);
            setIsSpanFocused(false);
        }
        if (isOutsideInput && !(elementTarget && elementTarget.closest('.' + CSS_CLASSES.LIST_ITEM)) &&
        !(elementTarget && elementTarget.matches('.' + CSS_CLASSES.INPUT_ICON))) {
            setIsSpanFocused(false);
        }
    }, [isPopupOpen, hidePopup, setIsSpanFocused, dropdownRootRef, popupRef]);

    const computePopupSize: (raw: string, el: HTMLElement | null, axis: 'width' | 'height') => string = useCallback((raw: string, el: HTMLElement | null, axis: 'width' | 'height'): string => {
        const unit: string = formatUnit(raw);
        if (!unit.includes('%')) { return unit; }
        const percent: number = parseFloat(unit);
        if (!el || Number.isNaN(percent)) { return unit; }
        const rect: DOMRect | null = typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
        const offset: number = axis === 'width' ? el.offsetWidth : el.offsetHeight;
        const rectVal: number = rect ? (axis === 'width' ? rect.width : rect.height) : 0;
        let styleVal: number = 0;
        if (typeof window !== 'undefined' && window.getComputedStyle) {
            const cs: CSSStyleDeclaration = window.getComputedStyle(el);
            const cssDim: string = axis === 'width' ? cs.width : cs.height;
            styleVal = parseFloat(cssDim || '0') || 0;
        }
        const base: number = offset || rectVal || styleVal || 0;
        return `${(base * percent) / 100}px`;
    }, []);

    const setPopupWidthCalc: () => string = useCallback((): string => {
        return computePopupSize(popupWidth, dropdownRootRef.current as HTMLElement | null, 'width');
    }, [popupWidth, dropdownRootRef, computePopupSize]);

    const setPopupHeightCalc: () => string = useCallback((): string => {
        return computePopupSize(popupHeight, inputElementRef.current as HTMLElement | null, 'height');
    }, [popupHeight, inputElementRef, computePopupSize]);

    useEffect(() => {
        if (isPopupOpen) {
            document.addEventListener('mousedown', handleDocumentClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, [isPopupOpen]);

    const handleScroll: (e: Event) => void = (e: Event) => {
        const isOutsidePopup: boolean | null | undefined = popupRef.current?.element &&
            !popupRef.current.element.contains(e.target as Node) && !dropdownRootRef.current?.contains(e.target as Node);
        if (isPopupOpen && isOutsidePopup) {
            hidePopup(e);
            setIsSpanFocused(false);
        }
    };

    useEffect(() => {
        if (isPopupOpen) {
            document.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [isPopupOpen, hidePopup, popupRef, setIsSpanFocused]);

    useEffect(() => {
        if (!multiSelectable || !isPopupOpen || !dropdownRootRef.current || !popupRef.current) {
            return;
        }
        const resizeObserver: ResizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
            entries.forEach((entry: ResizeObserverEntry) => {
                const currentHeight: number = entry.contentRect.height;
                if (previousHeightRef.current !== null && previousHeightRef.current !== currentHeight) {
                    if (popupRef.current && typeof popupRef.current.refreshPosition === 'function') {
                        popupRef.current.refreshPosition();
                    }
                }
                previousHeightRef.current = currentHeight;
            });
        });
        resizeObserver.observe(dropdownRootRef.current);
        return () => {
            resizeObserver.disconnect();
        };
    }, [isPopupOpen, dropdownRootRef, popupRef, previousHeightRef, multiSelectable]);

    return { showPopup, hidePopup, setPopupWidth: setPopupWidthCalc, setPopupHeight: setPopupHeightCalc };
};
