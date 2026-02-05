import { useState, useRef, RefObject, useEffect } from 'react';
import { EventModel } from '../types/schedule-types';
import { useProviderContext } from '@syncfusion/react-base';
import { useSchedulePropsContext } from '../context/schedule-context';
import { useNavigate } from './useDateHeader';

interface PopupState {
    date: Date | null;
    events: EventModel[];
    visible: boolean;
    target: HTMLElement | null;
}

interface MorePopupHookResult {
    date: Date | null;
    events: EventModel[];
    visible: boolean;
    target: HTMLElement | null;
    popupElement: RefObject<HTMLDivElement>;
    scheduleElement: RefObject<HTMLDivElement | null>;
    locale: string | undefined;
    handleClose: () => void;
    handleEventClick: (event: EventModel) => void;
    handleNavigation: () => void;
    open: (moreDate: Date, moreEvents: EventModel[], element: HTMLElement) => void;
}

/**
 * Custom hook for managing the state and logic of the MorePopup component
 *
 * @returns {MorePopupHookResult} Object containing popup state and handler functions
 */
export const useMorePopup: () => MorePopupHookResult = (): MorePopupHookResult => {
    const [popupState, setPopupState] = useState<PopupState>({
        date: null,
        events: [],
        visible: false,
        target: null
    });
    const popupElement: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const scheduleElement: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const { locale } = useProviderContext();
    const { handleDateClick } = useNavigate();

    const { quickPopupRef } = useSchedulePropsContext();

    useEffect(() => {
        if (popupState.target) {
            scheduleElement.current = popupState.target.closest('.sf-schedule') as HTMLDivElement;
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
            visible: false
        });
    };

    /**
     * Handles event click
     *
     * @param {EventModel} event - Event model
     * @returns {void}
     */
    const handleEventClick: (event: EventModel) => void =
        (event: EventModel): void => {
            quickPopupRef.current?.handleEventClick(event, popupState.target);
            handleClose();
        };

    /**
     * Handles schedule navigation
     *
     * @returns {void}
     */
    const handleNavigation: () => void = (): void => {
        handleDateClick(popupState.date);
        handleClose();
    };

    /**
     * Handles more popup open
     *
     * @param {Date} moreDate - Date of more popup
     * @param {EventModel[]} moreEvents - Events of more popup
     * @param {HTMLElement} element - Target element
     * @returns {void}
     */
    const open: (moreDate: Date, moreEvents: EventModel[], element: HTMLElement) => void = (
        moreDate: Date,
        moreEvents: EventModel[],
        element: HTMLElement
    ): void => {
        setPopupState({
            date: moreDate,
            events: moreEvents,
            target: element,
            visible: true
        });
    };

    return {
        date: popupState.date,
        events: popupState.events,
        visible: popupState.visible,
        target: popupState.target,
        popupElement,
        scheduleElement,
        locale,
        handleClose,
        handleEventClick,
        handleNavigation,
        open
    };
};
