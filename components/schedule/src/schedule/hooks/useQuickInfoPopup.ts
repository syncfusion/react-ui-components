import { useEffect, useRef, useState, useCallback, RefObject, Dispatch, SetStateAction } from 'react';
import { EventModel, CellClickEvent, EventClickArgs } from '../types/schedule-types';
import { IQuickInfoPopup } from '../components/popup/quick-info-popup';

/**
 * Interface for legacy useSchedulePopups hook (for backward compatibility)
 */
export interface UseSchedulePopupsResult {
    /**
     * Ref for the quick info popup (handles both cell and event clicks)
     */
    cellEditRef: RefObject<IQuickInfoPopup>;

    /**
     * Ref for the event edit popup (maintained for backward compatibility)
     */
    eventEditRef: RefObject<IQuickInfoPopup>;

    /**
     * Handler for cell click - directly calls the standalone popup
     */
    handleCellClick: (data: CellClickEvent, element: HTMLElement) => void;

    /**
     * Handler for event click - directly calls the standalone popup
     */
    handleEventClick: (data: EventModel, element: HTMLElement) => void;

    /**
     * Handler for edit event
     */
    handleEditEvent: () => void;
}

/**
 * Interface for legacy usePopupState hook (for backward compatibility)
 */
export interface UsePopupStateResult {
    visible: boolean;
    setVisible: Dispatch<SetStateAction<boolean>>;
    target: HTMLElement | null;
    setTarget: Dispatch<SetStateAction<HTMLElement | null>>;
    containerRef: RefObject<HTMLDivElement>;
    popupElement: RefObject<HTMLDivElement>;
    scheduleElement: RefObject<HTMLDivElement | null>;
    handleClose: () => void;
    handleRef: (el: HTMLDivElement | null) => void;
}

/**
 * Result interface for consolidated usePopup hook
 */
export interface UsePopupResult {
    visible: boolean;
    setVisible: Dispatch<SetStateAction<boolean>>;
    target: HTMLElement | null;
    setTarget: Dispatch<SetStateAction<HTMLElement | null>>;
    containerRef: RefObject<HTMLDivElement>;
    popupElement: RefObject<HTMLDivElement>;
    scheduleElement: RefObject<HTMLDivElement | null>;
    handleClose: () => void;
    handleRef: (el: HTMLDivElement | null) => void;
    cellEditRef: RefObject<IQuickInfoPopup>;
    eventEditRef: RefObject<IQuickInfoPopup>;
    handleCellClick: (data: CellClickEvent, element: HTMLElement) => void;
    handleEventClick: (data: EventModel, element: HTMLElement) => void;
    handleEditEvent: () => void;
    closeAllPopups: () => void;
    onCellClickHandler: (args: CellClickEvent) => void;
    onEventClickHandler: (args: EventClickArgs) => void;
}

/**
 * Consolidated hook for popup management.
 * Combines functionality from usePopupState and useSchedulePopups
 *
 * @param {Function} onCellClick - User-provided cell click handler
 * @param {Function} onEventClick - User-provided event click handler
 * @param {Function} onClose - Function to call when popup is closed
 * @returns {UsePopupResult} - Combined popup state and handlers
 */
export const usePopup: (
    onCellClick?: (args: CellClickEvent) => void,
    onEventClick?: (args: EventClickArgs) => void,
    onClose?: () => void
) => UsePopupResult = (
    onCellClick?: (args: CellClickEvent) => void,
    onEventClick?: (args: EventClickArgs) => void,
    onClose?: () => void
): UsePopupResult => {
    const [visible, setVisible] = useState<boolean>(false);
    const [target, setTarget] = useState<HTMLElement | null>(null);
    const containerRef: RefObject<HTMLDivElement> = useFocusTrap(visible);
    const popupElement: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const scheduleElement: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const cellEditRef: RefObject<IQuickInfoPopup> = useRef<IQuickInfoPopup>(null);
    const eventEditRef: RefObject<IQuickInfoPopup> = useRef<IQuickInfoPopup>(null);
    const handleClose: () => void = useCallback((): void => {
        setVisible(false);
        onClose?.();
    }, [onClose]);

    useEscapeKey(handleClose);

    useEffect(() => {
        if (target) {
            scheduleElement.current = target.closest('.sf-schedule') as HTMLDivElement;
        }
    }, [target]);

    /**
     * Handles the ref assignment for popup container
     */
    const handleRef: (el: HTMLDivElement | null) => void = useCallback((el: HTMLDivElement | null): void => {
        if (containerRef && typeof containerRef === 'object' && 'current' in containerRef) {
            containerRef.current = el;
        }
        popupElement.current = el;
    }, [containerRef]);

    /**
     * Close all popups
     */
    const closeAllPopups: () => void = useCallback((): void => {
        cellEditRef.current?.hide();
        eventEditRef.current?.hide();
    }, []);

    /**
     * Handles cell click
     */
    const handleCellClick: (data: CellClickEvent, element: HTMLElement) => void = useCallback(
        (data: CellClickEvent, element: HTMLElement): void => {
            cellEditRef.current?.handleCellClick(data, element);
        }, []);

    /**
     * Handles event click
     */
    const handleEventClick: (data: EventModel, element: HTMLElement) => void = useCallback(
        (data: EventModel, element: HTMLElement): void => {
            cellEditRef.current?.handleEventClick(data, element);
        }, []);

    /**
     * Handles editing existing events
     */
    const handleEditEvent: () => void = useCallback((): void => {
        closeAllPopups();
    }, []);

    /**
     * Comprehensive cell click handler that combines user-defined and internal popup handlers
     * Executes user callback first, then triggers internal popup logic if element is present
     */
    const onCellClickHandler: (args: CellClickEvent) => void = useCallback((args: CellClickEvent): void => {
        if (onCellClick) {
            onCellClick(args);
        }

        if (args && args.element) {
            if (args.nativeEvent) {
                args.nativeEvent.stopPropagation();
            }
            handleCellClick(args, args.element);
        }
    }, [onCellClick, handleCellClick]);

    /**
     * Comprehensive event click handler that combines user-defined and internal popup handlers
     * Executes user callback first, then triggers internal popup logic if event and element are present
     */
    const onEventClickHandler: (args: EventClickArgs) => void = useCallback((args: EventClickArgs): void => {
        if (onEventClick) {
            onEventClick(args);
        }

        if (args && args.data && args.event.currentTarget) {
            handleEventClick(args.data, args.event.currentTarget as HTMLElement);
        }
    }, [onEventClick, handleEventClick]);

    return {
        visible,
        setVisible,
        target,
        setTarget,
        containerRef,
        popupElement,
        scheduleElement,
        handleClose,
        handleRef,
        cellEditRef,
        eventEditRef,
        handleCellClick,
        handleEventClick,
        handleEditEvent,
        closeAllPopups,
        onCellClickHandler,
        onEventClickHandler
    };
};

/**
 * Legacy hook to handle Escape key press for popups
 * This is exported directly from usePopup.ts for backward compatibility
 *
 * @param {Function} onClose Callback to execute on Escape key press
 * @returns {void} No return value
 */
export const useEscapeKey: (onClose: () => void) => void = (onClose: () => void): void => {
    useEffect(() => {
        const handleEscKey: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document?.addEventListener('keydown', handleEscKey);

        return () => {
            document?.removeEventListener('keydown', handleEscKey);
        };
    }, [onClose]);
};

/**
 * Legacy hook to handle focus trap for modal popups
 * This is exported directly from usePopup.ts for backward compatibility
 *
 * @param {boolean} isOpen Whether the popup is open
 * @returns {RefObject<HTMLDivElement>} Ref to be attached to the popup container
 */
export const useFocusTrap: (isOpen: boolean) => RefObject<HTMLDivElement> = (isOpen: boolean): RefObject<HTMLDivElement> => {
    const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const previousFocusRef: RefObject<HTMLElement> = useRef<HTMLElement>(null);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            previousFocusRef.current = document?.activeElement as HTMLElement;

            const focusableElements: NodeListOf<Element> = containerRef.current.querySelectorAll(
                'a[href]:not([tabindex="-1"]),input:not([disabled]):not([tabindex="-1"]),' +
            'textarea:not([disabled]):not([tabindex="-1"]),button:not([disabled]):not([tabindex="-1"]),' +
            'select:not([disabled]):not([tabindex="-1"]),[tabindex]:not([tabindex="-1"]),[contentEditable=true]:not([tabindex="-1"])'
            );

            const firstEle: Element = focusableElements[0];
            const lastEle: Element = focusableElements[focusableElements.length - 1];

            const handleTabKey: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
                if (lastEle && document?.activeElement === lastEle && !e.shiftKey) {
                    e.preventDefault();
                    (firstEle as HTMLElement).focus();
                }
                if (firstEle && document?.activeElement === firstEle && e.shiftKey) {
                    e.preventDefault();
                    (lastEle as HTMLElement).focus();
                }
            };

            document?.addEventListener('keydown', handleTabKey);
            return () => {
                document?.removeEventListener('keydown', handleTabKey);
                if (previousFocusRef.current?.focus) {
                    previousFocusRef.current.focus();
                }
            };
        }
        return (): void => { /* No cleanup needed */ };
    }, [isOpen]);

    return containerRef;
};

export default usePopup;
