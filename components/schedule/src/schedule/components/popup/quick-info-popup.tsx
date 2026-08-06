import {
    forwardRef, useImperativeHandle, useRef, useState, useCallback, ReactElement,
    ForwardRefExoticComponent, RefAttributes, SetStateAction, RefObject, Dispatch, ReactNode, FC, ForwardedRef,
    useEffect
} from 'react';
import { TimelineDayIcon, CloseIcon, LocationIcon, PageColumnsIcon } from '@syncfusion/react-icons';
import { Button, Color, IButton, Variant } from '@syncfusion/react-buttons';
import { TextBoxChangeEvent, TextBox, ITextBox } from '@syncfusion/react-inputs';
import { Popup, CollisionType, ActionOnScrollType } from '@syncfusion/react-popups';
import { CSS_CLASSES } from '../../common/constants';
import { DateService } from '../../services/DateService';
import { CellClickEvent, EventModel } from '../../types/schedule-types';
import { useProviderContext } from '@syncfusion/react-base';
import { usePopup } from '../../hooks/useQuickInfoPopup';
import { useScheduleLocalization } from '../../common/locale';
import { useOutsideClick } from '../../hooks/useSchedule';
import { EventService } from '../../services/EventService';
import { useSchedulePropsContext } from '../../context/schedule-context';

/**
 * Shared utility function to render close button for popups
 *
 * @param {Function} onClose The close handler function
 * @param {string} ariaLabel The aria-label for accessibility (default: 'Close')
 * @returns {ReactElement} The close button element
 */
export const renderPopupCloseButton: (onClose: () => void, ariaLabel?: string) => ReactElement = (
    onClose: () => void,
    ariaLabel: string = 'Close'
): ReactElement => {
    return (
        <Button
            className={`${CSS_CLASSES.POPUP_CLOSE} ${CSS_CLASSES.ROUND}`}
            onClick={onClose}
            aria-label={ariaLabel}
            key='close-btn'
            icon={<CloseIcon />}
            color={Color.Secondary}
            variant={Variant.Standard}
        />
    );
};

/**
 * Props interface for PopupWrapper component
 */
export interface PopupWrapperProps {
    visible: boolean;
    target: HTMLElement | null;
    popupPosition?: { X: string; Y: string };
    scheduleElement: RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onOpen?: () => void;
    children: ReactNode;
}

/**
 * Shared popup wrapper component
 *
 * @param {PopupWrapperProps} props - The component props
 * @returns {ReactElement | null} The popup wrapper
 */
export const PopupWrapper: FC<PopupWrapperProps> = (
    { visible, target, scheduleElement, popupPosition, onClose, onOpen, children }: PopupWrapperProps
) => {
    if (!visible || !target) {
        return null;
    }

    return (
        <Popup
            open={visible}
            relateTo={target}
            position={popupPosition}
            collision={{
                X: CollisionType.Flip,
                Y: CollisionType.Fit
            }}
            actionOnScroll={ActionOnScrollType.None}
            autoReposition={true}
            onOpen={onOpen}
            onClose={onClose}
            className={`${CSS_CLASSES.POPUP_WRAPPER}`}
            viewPortElementRef={scheduleElement}
        >
            {children}
        </Popup>
    );
};

/**
 * Shared popup utility function type for creating base imperative handle methods
 */
export interface BaseImperativeHandleMethods {
    show: () => void;
    hide: () => void;
    element: HTMLDivElement | null;
}

/**
 * Shared utility function to create base imperative handle methods
 *
 * @param {Function} setVisible The setVisible function
 * @param {Object} popupElement The popup element ref
 * @returns {BaseImperativeHandleMethods} The base imperative handle methods
 */
export const createBaseImperativeHandle: (
    setVisible: Dispatch<SetStateAction<boolean>>,
    popupElement: RefObject<HTMLDivElement>
) => BaseImperativeHandleMethods = (
    setVisible: Dispatch<SetStateAction<boolean>>,
    popupElement: RefObject<HTMLDivElement>
): BaseImperativeHandleMethods => ({
    show: () => setVisible(true),
    hide: () => setVisible(false),
    element: popupElement.current
});

/**
 * Base interface for schedule popup components
 */
export interface ISchedulePopupBase {
    /**
     * Show the popup
     */
    show: () => void;

    /**
     * Hide the popup
     */
    hide: () => void;

    /**
     * Focus the popup (optional - only needed for components with focusable elements)
     */
    focus?: () => void;

    /**
     * The popup DOM element
     */
    element: HTMLDivElement | null;
}

/**
 * Interface for the QuickInfoPopup component
 */
export interface IQuickInfoPopup extends ISchedulePopupBase {
    /**
     * Handle cell click to show popup
     */
    handleCellClick: (data: CellClickEvent, element: HTMLElement) => void;

    /**
     * Handle event click to show popup
     */
    handleEventClick: (data: EventModel, element: HTMLElement) => void;

    /**
     * Trigger the popup's delete action (imperative)
     */
    handleDelete: () => void;
}

/**
 * Props for the QuickInfoPopup component
 */
export interface QuickInfoPopupProps {
    onClose?: () => void;
    onEditEvent: (eventData: EventModel) => void;
    onMoreDetails: (cellData: CellClickEvent) => void;
}

/**
 * Combined QuickInfoPopup component that handles both cell and event popups
 */
export const QuickInfoPopup: ForwardRefExoticComponent<QuickInfoPopupProps & RefAttributes<IQuickInfoPopup>> =
forwardRef<IQuickInfoPopup, QuickInfoPopupProps>((props: QuickInfoPopupProps,  ref: ForwardedRef<IQuickInfoPopup>) => {

    const { onClose, onEditEvent, onMoreDetails } = props;

    const { scheduleRef, eventSettings, showQuickInfoPopup, showDeleteAlert, currentView } = useSchedulePropsContext();

    const [cellData, setCellData] = useState<CellClickEvent>({} as CellClickEvent);
    const [eventData, setEventData] = useState<EventModel>({} as EventModel);
    const [formData, setFormData] = useState<EventModel>({} as EventModel);
    const [popupType, setPopupType] = useState<'cell' | 'event' | null>(null);
    const [popupPosition, setPopupPosition] = useState({ X: 'right', Y: 'top' });
    const [shouldFocus, setShouldFocus] = useState(false);

    const textBoxRef: RefObject<ITextBox> = useRef<ITextBox>(null);
    const editRef: RefObject<IButton> = useRef<IButton>(null);

    const {
        visible,
        setVisible,
        target,
        setTarget,
        popupElement,
        scheduleElement,
        handleClose,
        closeAllPopups,
        handleRef
    } = usePopup(onClose);

    const { locale } = useProviderContext();
    useOutsideClick(popupElement, visible, handleClose);
    const { getString } = useScheduleLocalization(locale || 'en-US');

    useEffect(() => {
        if (shouldFocus) {
            requestAnimationFrame(() => {
                focusTextBox();
            });
            setShouldFocus(false);
        }
    }, [shouldFocus]);

    useImperativeHandle(ref, () => ({
        ...createBaseImperativeHandle(setVisible, popupElement),
        handleCellClick: (cellData: CellClickEvent, element: HTMLElement) => {
            if (!showQuickInfoPopup) {
                return;
            }
            setCellData(cellData);
            setTarget(element);
            setPopupType('cell');
            setFormData({
                [eventSettings.fields.startTime]: cellData.startTime,
                [eventSettings.fields.endTime]: (cellData.isAllDay) ? DateService.addDays(cellData.endTime, -1) : cellData.endTime,
                [eventSettings.fields.isAllDay]: cellData.isAllDay
            });
            cellPopupClick();
            setVisible(true);
        },
        handleEventClick: (eventData: EventModel, element: HTMLElement) => {
            if (!showQuickInfoPopup) {
                return;
            }
            setEventData(eventData);
            setTarget(element);
            setPopupType('event');
            cellPopupClick();
            setVisible(true);
        },
        handleDelete: openDeleteConfirmation
    }));

    const onOpen: () => void = (): void => {
        setPopupPosition(
            currentView?.toLowerCase() === 'day'
                ? { X: 'center', Y: 'center' }
                : { X: 'right', Y: 'top' }
        );
        setShouldFocus(true);
    };

    const cellPopupClick: () => void = (): void => {
        if (textBoxRef || editRef) {
            handleClose();
        }
        requestAnimationFrame(() => {
            focusTextBox();
        });
    };

    /**
     * Utility function to focus the text box
     *
     * @returns {void}
     */
    const focusTextBox: () => void = (): void => {
        if (popupType === 'cell') {
            if (textBoxRef.current && textBoxRef.current.element) {
                const element: HTMLInputElement = textBoxRef.current.element as HTMLInputElement;
                element.focus();
            }
        }
        else if (popupType === 'event') {
            if (editRef.current && editRef.current.element) {
                const element: HTMLInputElement = editRef.current.element as HTMLInputElement;
                element.focus();
            }
        }
    };

    /**
     * Handles the subject text change event
     *
     * @param {TextBoxChangeEvent} args - The event arguments
     * @returns {void}
     */
    const handleSubjectChange: (args: TextBoxChangeEvent) => void = useCallback((args: TextBoxChangeEvent): void => {
        const value: string = args.value;
        const event: EventModel = {
            ...formData,
            subject: value
        };
        setFormData(event);
    }, [formData]);

    /**
     * Handles the save action for cell popups
     *
     * @returns {void}
     */
    const handleSave: () => void = useCallback((): void => {
        const updatedData: EventModel = {
            ...formData,
            [eventSettings.fields.id]: EventService.generateEventGuid(),
            [eventSettings.fields.subject]: formData.subject || getString('newEvent')
        };
        scheduleRef?.current?.addEvent?.(updatedData);
        handleClose();
        closeAllPopups();
    }, [formData, handleClose]);

    /**
     * Handles the edit action for event popups
     *
     * @returns {void}
     */
    const handleEdit: () => void = useCallback((): void => {
        onEditEvent(eventData);
        handleClose();
    }, [eventData, handleClose, onEditEvent]);

    const handleMoreDetails: () => void = useCallback((): void => {
        onMoreDetails(cellData);
        handleClose();
    }, [cellData, handleClose, onMoreDetails]);

    /**
     * Handles the delete action for event popups
     *
     * @returns {void}
     */
    const openDeleteConfirmation: () => void = useCallback((): void => {
        const performDelete: () => void = (): void => {
            if (popupType === 'event' && eventData) {
                scheduleRef?.current?.deleteEvent?.(eventData);
            }
            handleClose();
            closeAllPopups();
        };
        showDeleteAlert?.(performDelete);
        setVisible(false);
    }, [popupType, eventData, handleClose, closeAllPopups, scheduleRef, showDeleteAlert]);

    /**
     * Handles key down events for button actions (Enter or Space)
     *
     * @param {Function} callback - The callback function to execute
     * @returns {Function} The key down handler
     */
    const createKeyDownHandler: (callback: () => void) => (e: React.KeyboardEvent<HTMLButtonElement | HTMLInputElement>) => void =
        (callback: () => void) => (e: React.KeyboardEvent<HTMLButtonElement | HTMLInputElement>): void => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                callback();
            }
        };

    /**
     * Render the cell popup content
     *
     * @returns {ReactElement} The cell popup content
     */
    const renderCellPopupContent: () => ReactElement = (): ReactElement => (
        <div
            ref={handleRef}
            className={`${CSS_CLASSES.QUICK_INFO_WRAPPER} ${CSS_CLASSES.CELL_POPUP}`}
        >
            <div className={CSS_CLASSES.POPUP_HEADER}>
                <div className={`${CSS_CLASSES.POPUP_HEADER_WRAP} ${CSS_CLASSES.CONTENT_RIGHT}`}>
                    {renderPopupCloseButton(handleClose, getString('close'))}
                </div>
            </div>

            <div className={`${CSS_CLASSES.POPUP_CONTENT}`}>
                <div className={CSS_CLASSES.POPUP_INPUT_WRAP}>
                    <TextBox
                        ref={textBoxRef}
                        className={CSS_CLASSES.CELL_SUBJECT}
                        placeholder={getString('addTitle')}
                        onKeyDown={createKeyDownHandler(handleSave)}
                        onChange={handleSubjectChange}
                        value={formData.subject || ''}
                    />
                </div>
                {cellData.startTime && cellData.endTime && (
                    <div className={`${CSS_CLASSES.CELL_TIME} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                        <span className={`${CSS_CLASSES.POPUP_ICON} ${CSS_CLASSES.ICON} ${CSS_CLASSES.ICON_SIZE}`}>
                            <TimelineDayIcon />
                        </span>
                        <span className={CSS_CLASSES.POPUP_TIME_TEXT}>
                            {DateService.formatCellDateRange(new Date(cellData.startTime), new Date(cellData.endTime), locale)}
                        </span>
                    </div>
                )}
            </div>

            <div className={`${CSS_CLASSES.POPUP_FOOTER} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                <Button
                    className={CSS_CLASSES.POPUP_MORE_DETAILS}
                    onClick={handleMoreDetails}
                    color={Color.Primary}
                    variant={Variant.Standard}
                >
                    {getString('moreDetails')}
                </Button>
                <Button
                    className={CSS_CLASSES.SAVE_EVENT}
                    onClick={handleSave}
                    onKeyDown={createKeyDownHandler(handleSave)}
                    color={Color.Primary}
                    variant={Variant.Standard}
                >
                    {getString('save')}
                </Button>
            </div>
        </div>
    );

    /**
     * Render the event popup content
     *
     * @returns {ReactElement} The event popup content
     */
    const renderEventPopupContent: () => ReactElement = (): ReactElement => (
        <div
            ref={handleRef}
            className={`${CSS_CLASSES.QUICK_INFO_WRAPPER} ${CSS_CLASSES.EVENT_POPUP}`}
        >
            <div className={`${CSS_CLASSES.POPUP_HEADER} ${CSS_CLASSES.POPUP_CELL_HEADER} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                <div className={CSS_CLASSES.SUBJECT}>
                    {eventData.subject || getString('addTitle')}
                </div>
                <div className={`${CSS_CLASSES.POPUP_HEADER_WRAP}`}>
                    {renderPopupCloseButton(handleClose, getString('close'))}
                </div>
            </div>

            <div className={`${CSS_CLASSES.POPUP_CONTENT}`}>
                {eventData.startTime && eventData.endTime && (
                    <div className={`${CSS_CLASSES.CELL_TIME} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                        <span className={`${CSS_CLASSES.POPUP_ICON} ${CSS_CLASSES.ICON} ${CSS_CLASSES.ICON_SIZE}`}>
                            <TimelineDayIcon />
                        </span>
                        <span className={CSS_CLASSES.POPUP_TIME_TEXT}>
                            {DateService.formatPopupDateRange(eventData, locale)}
                        </span>
                    </div>
                )}

                {eventData.location && (
                    <div className={`${CSS_CLASSES.LOCATION} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                        <span className={`${CSS_CLASSES.POPUP_ICON} ${CSS_CLASSES.ICON} ${CSS_CLASSES.ICON_SIZE}`}>
                            <LocationIcon />
                        </span>
                        <span className={CSS_CLASSES.POPUP_LOCATION_TEXT}>
                            {eventData.location}
                        </span>
                    </div>
                )}

                {eventData.description && (
                    <div className={`${CSS_CLASSES.DESCRIPTION} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                        <span className={`${CSS_CLASSES.POPUP_ICON} ${CSS_CLASSES.ICON} ${CSS_CLASSES.ICON_SIZE}`}>
                            <PageColumnsIcon />
                        </span>
                        <span className={CSS_CLASSES.POPUP_DESCRIPTION_TEXT}>
                            {eventData.description}
                        </span>
                    </div>
                )}
            </div>

            <div className={`${CSS_CLASSES.POPUP_FOOTER} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                <Button
                    ref={editRef}
                    className={CSS_CLASSES.EDIT_EVENT}
                    disabled={!!eventData?.isReadonly}
                    onClick={handleEdit}
                    onKeyDown={createKeyDownHandler(handleEdit)}
                    color={Color.Primary}
                    variant={Variant.Standard}
                >
                    {getString('edit')}
                </Button>
                <Button
                    className={CSS_CLASSES.DELETE_EVENT}
                    disabled={!!eventData?.isReadonly}
                    onClick={openDeleteConfirmation}
                    onKeyDown={createKeyDownHandler(openDeleteConfirmation)}
                    color={Color.Primary}
                    variant={Variant.Standard}
                >
                    {getString('delete')}
                </Button>
            </div>
        </div>
    );

    return (
        <PopupWrapper
            visible={visible}
            target={target}
            popupPosition={popupPosition}
            scheduleElement={scheduleElement}
            onClose={handleClose}
            onOpen={onOpen}
        >
            {popupType === 'cell' ? renderCellPopupContent() : renderEventPopupContent()}
        </PopupWrapper>
    );
});

QuickInfoPopup.displayName = 'QuickInfoPopup';

export default QuickInfoPopup;
