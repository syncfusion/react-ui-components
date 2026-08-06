import {
    forwardRef, useImperativeHandle, ReactElement,
    ForwardRefExoticComponent, RefAttributes, ForwardedRef
} from 'react';
import { Popup, CollisionType } from '@syncfusion/react-popups';
import { CSS_CLASSES } from '../../common/constants';
import { EventModel } from '../../types/schedule-types';
import { renderPopupCloseButton } from './quick-info-popup';
import { useMorePopup } from '../../hooks/useMorePopup';
import { useOutsideClick } from '../../hooks/useSchedule';
import { formatDate } from '@syncfusion/react-base';
import { useScheduleLocalization } from '../../common/locale';

/**
 * Interface for the MorePopup component
 */
export interface IMorePopup {
    /**
     * Open the popup to show more events
     */
    open: (date: Date, events: EventModel[], element: HTMLElement) => void;
}

/**
 * MorePopup component for displaying additional events in month view
 */
export const MorePopup: ForwardRefExoticComponent<RefAttributes<IMorePopup>
> = forwardRef<IMorePopup>((_props: {}, ref: ForwardedRef<IMorePopup>) => {

    const {
        date,
        events,
        visible,
        target,
        popupElement,
        scheduleElement,
        locale,
        handleClose,
        handleEventClick,
        handleNavigation,
        open
    } = useMorePopup();

    const { getString } = useScheduleLocalization(locale || 'en-US');
    useImperativeHandle(ref, () => ({
        element: popupElement.current,
        open
    }));

    useOutsideClick(popupElement, visible, handleClose);

    /**
     * Render the more popup content
     *
     * @returns {ReactElement} The more popup content
     */
    const renderMorePopupContent: () => ReactElement = (): ReactElement => (
        <div ref={popupElement} className={CSS_CLASSES.MORE_EVENT_POPUP}>
            <div className={CSS_CLASSES.MORE_EVENT_HEADER}>
                <div className={`${CSS_CLASSES.MORE_EVENT_DATE_HEADER} ${CSS_CLASSES.LINK}`} onClick={handleNavigation} tabIndex={0}>
                    {formatDate(date, { format: 'E', calendar: 'gregorian', locale: locale })} {formatDate(date, { format: 'd', calendar: 'gregorian', locale: locale })}
                </div>
                <div className='sf-more-event-close'>
                    {renderPopupCloseButton(handleClose, getString('close'))}
                </div>
            </div>
            <div className={CSS_CLASSES.MORE_EVENT_CONTENT}>
                {events.map((event: EventModel): ReactElement => (
                    <div
                        className={CSS_CLASSES.APPOINTMENT}
                        style={{ backgroundColor: event.categoryColor as string }}
                        onClick={() => handleEventClick(event)}
                        data-id={`Appointment_${event.id}`}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={`${CSS_CLASSES.SUBJECT} ${CSS_CLASSES.ELLIPSIS}`}>
                            {event.subject || getString('addTitle')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (!visible || !target) {
        return null;
    }

    return (
        <Popup
            open={visible}
            relateTo={target}
            position={{ X: 'right', Y: 'top' }}
            collision={{
                X: CollisionType.Flip,
                Y: CollisionType.Flip
            }}
            autoReposition={true}
            onClose={handleClose}
            className={CSS_CLASSES.MORE_POPUP_WRAPPER}
            viewPortElementRef={scheduleElement || null}
            zIndex={1000}
        >
            {renderMorePopupContent()}
        </Popup>
    );
});

MorePopup.displayName = 'MorePopup';
