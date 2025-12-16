import * as React from 'react';
import { useEffect, useCallback, useMemo } from 'react';
import { formatUnit } from '@syncfusion/react-base';
import type { IPopup } from '@syncfusion/react-popups';
import type { PopupEvent } from '../types';

/**
 * Specifies the properties used by the `usePopupManagement` hook to manage the state and behavior of the DropDownList component.
 *
 * @private
 */
interface PopupManagementParams {
    isOpenControlled: boolean;
    isPopupOpen: boolean;
    open?: boolean;
    setIsPopupOpen: (v: boolean) => void;
    setAriaExpanded: (v: boolean) => void;
    setIsSpanFocused: (v: boolean) => void;
    spanElementRef: React.RefObject<HTMLSpanElement>;
    inputElementRef: React.RefObject<HTMLInputElement>;
    popupRef: React.RefObject<IPopup>;
    onOpen?: (args: PopupEvent) => void;
    onClose?: (args: PopupEvent) => void;
    popupWidth: string;
    popupHeight: string;
    className: string | undefined;
}

/**
 * Specifies the return structure of the `usePopupManagement` hook used in dropdown components.
 *
 * @private
 */
interface PopupManagementReturn {
    showPopup: (e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | Event) => void;
    hidePopup: (e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | Event) => void;
    setPopupWidth: () => string;
    setPopupHeight: () => string;
    popupClassNames: string;
}

export const usePopupManagement: (params: PopupManagementParams) => PopupManagementReturn
= (params: PopupManagementParams): PopupManagementReturn => {

    const popupClassNames: string = useMemo(() => {
        return [
            'sf-ddl sf-popup',
            params.className
        ].filter(Boolean).join(' ');
    }, [params.className]);

    const {
        isOpenControlled,
        isPopupOpen,
        open,
        setIsPopupOpen,
        setAriaExpanded,
        setIsSpanFocused,
        spanElementRef,
        inputElementRef,
        popupRef,
        onOpen,
        onClose,
        popupWidth,
        popupHeight
    } = params;

    const showPopup: (e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
    | Event) => void = useCallback((e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | Event) => {
        if (!isOpenControlled) {
            setIsPopupOpen(true);
            setAriaExpanded(true);
            spanElementRef.current?.focus();
        }
        if (onOpen) {
            const eventArgs: PopupEvent = {event: e};
            onOpen(eventArgs);
        }
    }, [isOpenControlled, setIsPopupOpen, setAriaExpanded, spanElementRef, onOpen, popupRef]);

    const hidePopup: (e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
    | Event) => void = useCallback((e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | Event) => {
        if (!isOpenControlled) {
            setIsPopupOpen(false);
            setAriaExpanded(false);
        }
        if (onClose && popupRef.current) {
            const eventArgs: PopupEvent = {event: e};
            onClose(eventArgs);
        }
        if (!open) {
            setIsSpanFocused(true);
            inputElementRef?.current?.focus();
        }
    }, [isOpenControlled, setIsPopupOpen, setAriaExpanded, onClose, popupRef, open, setIsSpanFocused, inputElementRef]);

    const handleDocumentClick: (e: MouseEvent) => void = useCallback((e: MouseEvent) => {
        const target: Node = e.target as Node;
        const isOutsideInput: boolean = !!spanElementRef.current && !spanElementRef.current.contains(target);
        const isOutsidePopup: boolean = !!popupRef.current?.element && !popupRef.current.element.contains(target);
        const elementTarget: Element | null = target instanceof Element ? target : null;
        if ((isPopupOpen && isOutsideInput && isOutsidePopup) ||
                (!isOutsideInput && popupRef.current?.element?.classList.contains('sf-input-group'))) {
            hidePopup(e);
            setIsSpanFocused(false);
        }
        if (
            isOutsideInput &&
                !(elementTarget && elementTarget.matches('.sf-list-item')) &&
                !(elementTarget && elementTarget.matches('.sf-input-icon'))
        ) {
            setIsSpanFocused(false);
        }
    }, [isPopupOpen, hidePopup, setIsSpanFocused, spanElementRef, popupRef]);

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
        return computePopupSize(popupWidth, spanElementRef.current as HTMLElement | null, 'width');
    }, [popupWidth, spanElementRef, computePopupSize]);

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
    }, [isPopupOpen, handleDocumentClick]);

    useEffect(() => {
        const handleScroll: (e: Event) => void = (e: Event) => {
            const isOutsidePopup: boolean | null | undefined = popupRef.current?.element &&
                !popupRef.current.element.contains(e.target as Node) && !spanElementRef.current.contains(e.target as Node);
            if (isPopupOpen && isOutsidePopup) {
                hidePopup(e);
                setIsSpanFocused(false);
            }
        };
        if (isPopupOpen) {
            document.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [isPopupOpen, hidePopup, popupRef, setIsSpanFocused]);

    return { showPopup, hidePopup, setPopupWidth: setPopupWidthCalc, setPopupHeight: setPopupHeightCalc, popupClassNames };
};
