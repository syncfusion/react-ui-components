import { useCallback, useEffect, useMemo, useState } from 'react';
import { getZindexPartial, PopupSettings } from '@syncfusion/react-popups';

export interface UsePickerPopupOptions {
    open?: boolean;
    defaultOpen?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    containerRef: React.RefObject<HTMLElement | null>;
    contentRefs?: Array<React.RefObject<HTMLElement | null>>;
    extraInsideRefs?: Array<React.RefObject<HTMLElement | null>>;
    inputRef?: React.RefObject<HTMLElement | null>;
    enableAltDownToOpen?: boolean;
    enableAltUpToClose?: boolean;
    enableEscapeToClose?: boolean;
    popupSettings?: PopupSettings;
    onAltDownGlobal?: () => void;
    onAltUpGlobal?: () => void;
    onEscapeGlobal?: () => void;
}

export interface UsePickerPopupResult {
    isOpen: boolean;
    showPopup: () => void;
    hidePopup: () => void;
    togglePopup: () => void;
    resolvedPopupSettings?: PopupSettings;
}

/**
 * Hook for managing picker popup open/close state, outside-click detection, and keyboard interactions.
 *
 * @param {UsePickerPopupOptions} opts - Configuration options including open state, refs, and callbacks.
 * @returns {UsePickerPopupResult} Object containing popup state and control functions.
 */
export default function usePickerPopup(opts: UsePickerPopupOptions): UsePickerPopupResult {
    const {
        open,
        defaultOpen = false,
        disabled = false,
        readOnly = false,
        onOpen,
        onClose,
        containerRef,
        contentRefs = [],
        extraInsideRefs = [],
        inputRef,
        enableAltDownToOpen = true,
        enableAltUpToClose = true,
        enableEscapeToClose = true,
        popupSettings,
        onAltDownGlobal,
        onAltUpGlobal,
        onEscapeGlobal
    } = opts;

    const isControlled: boolean = open !== undefined;
    const [innerOpen, setInnerOpen] = useState<boolean>(!!defaultOpen);
    const isOpen: boolean = isControlled ? !!open : innerOpen;

    const resolvedPopupSettings: PopupSettings | undefined = useMemo(() => {
        const baseZIndex: number = popupSettings && typeof popupSettings.zIndex === 'number' ? popupSettings.zIndex : 1000;
        if (baseZIndex === 1000) {
            const calculatedZIndex: number = containerRef.current ? getZindexPartial(containerRef.current) : 1000;
            return {
                ...popupSettings,
                zIndex: Math.max(3, calculatedZIndex + 1)
            };
        } else {
            return {
                ...popupSettings,
                zIndex: baseZIndex
            };
        }
    }, [popupSettings, containerRef.current]);

    const showPopup: () => void = useCallback((): void => {
        if (disabled || readOnly) {
            return;
        }
        if (!isOpen && !isControlled) {
            setInnerOpen(true);
        }
        if (!isOpen) {
            onOpen?.();
        }
    }, [disabled, readOnly, isOpen, isControlled, onOpen]);

    const hidePopup: () => void = useCallback((): void => {
        if (!isOpen) {
            return;
        }
        if (!isControlled) {
            setInnerOpen(false);
        }
        onClose?.();
        inputRef?.current?.focus?.();
    }, [isOpen, isControlled, onClose, inputRef]);

    const togglePopup: () => void = useCallback((): void => {
        if (isOpen) {
            hidePopup();
        } else {
            showPopup();
        }
    }, [isOpen, hidePopup, showPopup]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const insideAny: (target: Node) => boolean = (target: Node): boolean => {
            const getNode: (cur: unknown) => Node | null = (cur: unknown): Node | null => {
                if (cur instanceof Node) {
                    return cur;
                }
                if (typeof cur === 'object' && cur !== null) {
                    const element: unknown = (cur as { element?: unknown }).element;
                    if (element instanceof Node) {
                        return element;
                    }
                }
                return null;
            };

            if (containerRef.current?.contains(target)) {
                return true;
            }

            for (const list of [contentRefs, extraInsideRefs]) {
                for (const r of list) {
                    const node: Node | null = getNode(r.current);
                    if (node?.contains(target)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const handleMouseDown: (e: MouseEvent) => void = (e: MouseEvent): void => {
            const target: Node = e.target as Node;
            if (!insideAny(target)) {
                hidePopup();
            }
        };

        const handleKeyDown: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            if ((e.altKey || e.metaKey) && e.key === 'ArrowDown' && enableAltDownToOpen) {
                e.preventDefault();
                e.stopPropagation();
                if (onAltDownGlobal) {
                    onAltDownGlobal();
                } else {
                    showPopup();
                }
                return;
            }
            if ((e.altKey || e.metaKey) && e.key === 'ArrowUp' && enableAltUpToClose) {
                e.preventDefault();
                e.stopPropagation();
                if (onAltUpGlobal) {
                    onAltUpGlobal();
                } else {
                    hidePopup();
                }
                return;
            }
            if ((e.key === 'Escape' || e.key === 'Esc') && enableEscapeToClose) {
                e.preventDefault();
                e.stopPropagation();
                if (onEscapeGlobal) {
                    onEscapeGlobal();
                } else {
                    hidePopup();
                }
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [
        isOpen,
        containerRef,
        contentRefs,
        extraInsideRefs,
        hidePopup,
        showPopup,
        enableAltDownToOpen,
        enableAltUpToClose,
        enableEscapeToClose,
        onAltDownGlobal,
        onAltUpGlobal,
        onEscapeGlobal
    ]);

    return { isOpen, showPopup, hidePopup, togglePopup, resolvedPopupSettings };
}
