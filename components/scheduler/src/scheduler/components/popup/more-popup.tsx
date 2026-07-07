import {
    forwardRef, useImperativeHandle, ReactElement, useCallback, ReactNode,
    ForwardRefExoticComponent, RefAttributes, ForwardedRef, MouseEvent, KeyboardEvent, Fragment
} from 'react';
import { Popup, CollisionType } from '@syncfusion/react-popups';
import { CSS_CLASSES } from '../../common/constants';
import { EventModel } from '../../types/scheduler-types';
import { RecurrenceIcon } from '../recurrence-icon';
import { renderPopupCloseButton } from './quick-info-popup';
import { useMorePopup } from '../../hooks/useMorePopup';
import { useOutsideClick } from '../../hooks/useScheduler';
import { Browser, formatDate } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../../common/locale';
import { createPortal } from 'react-dom';
import { useSchedulerPropsContext } from '../../context/scheduler-context';
import { ViewService } from '../../services/ViewService';
import { EventService } from '../../services/EventService';
import { useSchedulerPopupContext } from '../../context/scheduler-popup-state-context';
/**
 * Interface for the MorePopup component
 *
 * @private
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
        target,
        popupElement,
        schedulerElement,
        locale,
        handleClose,
        handleEventClick,
        handleNavigation,
        open
    } = useMorePopup();

    const { eventTemplate, getAvailableViews, resources, eventSettings } = useSchedulerPropsContext();
    const isDayViewAvailable: boolean = ViewService.isDayViewAvailable(getAvailableViews);
    const { morePopupVisible } = useSchedulerPopupContext();

    const { getString } = useSchedulerLocalization(locale || 'en-US');
    useImperativeHandle(ref, () => ({
        element: popupElement.current,
        open
    }));

    useOutsideClick(popupElement, morePopupVisible, handleClose);

    const renderEventContent: (event: EventModel) => ReactNode = useCallback((event: EventModel) => {
        if (eventTemplate) {
            return eventTemplate(event);
        }
        return (
            <Fragment>
                <div className={`${CSS_CLASSES.SUBJECT} ${CSS_CLASSES.ELLIPSIS}`}>
                    {event.subject || getString('addTitle')}
                </div>
                <RecurrenceIcon event={event} />
            </Fragment>
        );
    }, [eventTemplate, getString]);

    /**
     * Render the more popup content
     *
     * @returns {ReactElement} The more popup content
     */
    const renderMorePopupContent: () => ReactElement = (): ReactElement => (
        <div ref={popupElement} className={CSS_CLASSES.MORE_EVENT_POPUP}>
            <div className={CSS_CLASSES.MORE_EVENT_HEADER}>
                <div className={`${CSS_CLASSES.MORE_EVENT_DATE_HEADER} ${isDayViewAvailable ? CSS_CLASSES.LINK : ''}`} onClick={(e: MouseEvent<HTMLElement>) => handleNavigation(e, isDayViewAvailable)} tabIndex={0}>
                    {formatDate(date, { format: 'E', calendar: 'gregorian', locale: locale })} {formatDate(date, { format: 'd', calendar: 'gregorian', locale: locale })}
                </div>
                <div className='sf-more-event-close'>
                    {renderPopupCloseButton(handleClose, getString('close'))}
                </div>
            </div>
            <div className={CSS_CLASSES.MORE_EVENT_CONTENT}>
                {events.map((event: EventModel): ReactElement => {
                    const resourceColor: string | undefined =
                        EventService.getResourceColor(event, resources, eventSettings?.resourceColorField);
                    return (
                        <div
                            className={CSS_CLASSES.APPOINTMENT}
                            style={resourceColor ? { backgroundColor: resourceColor } : undefined}
                            onClick={(e: MouseEvent<HTMLDivElement>) => handleEventClick(event, e.currentTarget as HTMLElement)}
                            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleEventClick(event, e.currentTarget as HTMLElement);
                                }
                            }}
                            data-id={`Appointment_${event.id}`}
                            data-guid={event.guid}
                            role="button"
                            tabIndex={0}
                            key={`eventId-${event.id}`}
                        >
                            {renderEventContent(event)}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (!morePopupVisible || !target) {
        return null;
    }

    if (Browser.isDevice) {
        return createPortal(
            <div className={`${CSS_CLASSES.CONTROL} ${CSS_CLASSES.MORE_POPUP_WRAPPER} ${CSS_CLASSES.MOBILE_POPUP}`}>
                {renderMorePopupContent()}
            </div>,
            document?.body
        );
    }

    return (
        <Popup
            open={morePopupVisible}
            relateTo={target}
            position={{ X: 'right', Y: 'top' }}
            collision={{
                X: CollisionType.Flip,
                Y: CollisionType.Flip
            }}
            autoReposition={true}
            onClose={handleClose}
            className={CSS_CLASSES.MORE_POPUP_WRAPPER}
            viewPortElementRef={schedulerElement || null}
            zIndex={1000}
        >
            {renderMorePopupContent()}
        </Popup>
    );
});

MorePopup.displayName = 'MorePopup';
