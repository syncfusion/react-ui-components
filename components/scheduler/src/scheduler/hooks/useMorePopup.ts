import { useState, useRef, RefObject, useEffect, MouseEvent } from 'react';
import { EventModel } from '../types/scheduler-types';
import { useProviderContext } from '@syncfusion/react-base';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useNavigate } from './useDateHeader';
import { useEscapeKey } from './useQuickInfoPopup';
import { useSchedulerPopupContext } from '../context/scheduler-popup-state-context';

interface PopupState {
    date: Date | null;
    events: EventModel[];
    target: HTMLElement | null;
    groupOrder?: (string | number)[];
}

interface MorePopupHookResult {
    date: Date | null;
    events: EventModel[];
    target: HTMLElement | null;
    groupOrder?: (string | number)[];
    popupElement: RefObject<HTMLDivElement>;
    schedulerElement: RefObject<HTMLDivElement | null>;
    locale: string | undefined;
    handleClose: () => void;
    handleEventClick: (event: EventModel, element: HTMLElement) => void;
    handleNavigation: (event: MouseEvent<HTMLElement>, isDayViewAvailable: boolean) => void;
    open: (moreDate: Date, moreEvents: EventModel[], element: HTMLElement, groupOrder?: (string | number)[]) => void;
}

/**
 * Custom hook for managing the state and logic of the MorePopup component
 *
 * @returns {MorePopupHookResult} Object containing popup state and handler functions
 * @private
 */
export const useMorePopup: () => MorePopupHookResult = (): MorePopupHookResult => {
    const [popupState, setPopupState] = useState<PopupState>({
        date: null,
        events: [],
        target: null,
        groupOrder: undefined
    });
    const { morePopupShow, morePopupHide } = useSchedulerPopupContext();
    const popupElement: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const schedulerElement: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const { locale } = useProviderContext();
    const { handleDateClick } = useNavigate();

    const { quickPopupRef } = useSchedulerPropsContext();

    useEffect(() => {
        if (popupState.target) {
            schedulerElement.current = popupState.target.closest('.sf-scheduler') as HTMLDivElement;
        }
    }, [popupState.target]);

    /**
     * Close the popup
     *
     * @returns {void}
     */
    const handleClose: () => void = (): void => {
        setPopupState({
            date: null,
            events: [],
            target: null,
            groupOrder: undefined
        });
        morePopupHide();
    };

    useEscapeKey(handleClose);

    /**
     * Handles event click
     *
     * @param {EventModel} event - Event model
     * @param {HTMLElement} element - Target element
     * @returns {void}
     */
    const handleEventClick: (event: EventModel, element: HTMLElement) => void =
        (event: EventModel, element: HTMLElement): void => {
            quickPopupRef.current?.handleEventClick(event, element);
        };

    /**
     * Navigates the scheduler to the current date.
     *
     * @param {MouseEvent<HTMLElement>} event - The mouse event that initiated the navigation.
     * @param {boolean} isDayViewAvailable - Indicates day view is available or not
     * @returns {void}
     */
    const handleNavigation: (event: MouseEvent<HTMLElement>, isDayViewAvailable: boolean) => void =
        (event: MouseEvent<HTMLElement>, isDayViewAvailable: boolean): void => {
            if (isDayViewAvailable) {
                handleDateClick(event, popupState.date);
                handleClose();
            }
        };

    /**
     * Handles more popup open
     *
     * @param {Date} moreDate - Date of more popup
     * @param {EventModel[]} moreEvents - Events of more popup
     * @param {HTMLElement} element - Target element
     * @param {(string | number)[]} [groupOrder] - Optional resource group order for context-aware color rendering
     * @returns {void}
     */
    const open: (moreDate: Date, moreEvents: EventModel[], element: HTMLElement, groupOrder?: (string | number)[]) => void = (
        moreDate: Date,
        moreEvents: EventModel[],
        element: HTMLElement,
        groupOrder?: (string | number)[]
    ): void => {
        setPopupState({
            date: moreDate,
            events: moreEvents,
            target: element,
            groupOrder: groupOrder
        });
        morePopupShow();
    };

    return {
        date: popupState.date,
        events: popupState.events,
        target: popupState.target,
        groupOrder: popupState.groupOrder,
        popupElement,
        schedulerElement,
        locale,
        handleClose,
        handleEventClick,
        handleNavigation,
        open
    };
};
