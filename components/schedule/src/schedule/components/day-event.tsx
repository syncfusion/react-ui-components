import { FC, useRef, RefObject, useCallback, MouseEvent, ReactNode, KeyboardEvent, HTMLAttributes } from 'react';
import { EventClickArgs } from '../types/schedule-types';
import { useSchedulePropsContext } from '../context/schedule-context';
import { useScheduleRenderDatesContext } from '../context/schedule-render-dates-context';
import { ChevronLeftDoubleIcon, ChevronRightDoubleIcon } from '@syncfusion/react-icons';
import { DayEventProps } from '../types/internal-interface';
import { EventService } from '../services/EventService';
import { useEventPositioning } from '../hooks/useEventPositioning';
import { useProviderContext, formatDate } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../common/constants';
import { DraggableEvent } from './drag-and-drop';
import { useScheduleLocalization } from '../common/locale';
import ResizeHandlers from './resizeHandlers';
import { clearAndSelectAppointment } from '../utils/actions';

export const DayEvent: FC<DayEventProps> = (props: DayEventProps) => {
    const {
        weekRenderDates,
        isBlockedEvent,
        ...eventInfo
    } = props;

    const { renderDates } = useScheduleRenderDatesContext();

    const {
        timeFormat,
        eventTemplate,
        onEventClick,
        onEventDoubleClick,
        allowDragAndDrop,
        allowResizing = true
    } = useSchedulePropsContext();

    const { locale } = useProviderContext();
    const { getString } = useScheduleLocalization(locale || 'en-US');
    const eventRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

    const {
        processedEvent,
        overflowDirection,
        positionStyle
    } = useEventPositioning({
        eventInfo,
        renderDates: weekRenderDates ? weekRenderDates : renderDates
    });

    const { isOverflowLeft, isOverflowRight } = overflowDirection;

    const handleClick: (e: MouseEvent<HTMLDivElement>) => void =
    useCallback((e: MouseEvent<HTMLDivElement>) => {
        clearAndSelectAppointment(e.currentTarget);
        e.stopPropagation();
        if (onEventClick) {
            const eventClickArgs: EventClickArgs = {
                event: e,
                data: eventInfo.event,
                element: e.currentTarget
            };
            onEventClick(eventClickArgs);
        }
    }, [onEventClick, processedEvent]);

    const handleDoubleClick: (e: MouseEvent<HTMLDivElement>) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (onEventDoubleClick) {
            const eventClickArgs: EventClickArgs = {
                event: e,
                data: eventInfo.event,
                element: e.currentTarget
            };
            onEventDoubleClick(eventClickArgs);
        }
    }, [onEventDoubleClick, processedEvent]);

    const formattedTime: (time: Date) => string = (time: Date) => {
        return formatDate(
            time ?? new Date(),
            { type: 'time', skeleton: 'short', format: timeFormat, locale: locale }
        );
    };

    const renderOverflowIndicator: (direction: 'left' | 'right') => ReactNode = (direction: 'left' | 'right') => (
        <div className={`sf-indicator sf-icons sf-${direction}-icon`}>
            {direction === 'left' ? <ChevronLeftDoubleIcon /> : <ChevronRightDoubleIcon />}
        </div>
    );

    const renderTime: (time: string) => ReactNode = (time: string) => <div className={CSS_CLASSES.TIME}>{time}</div>;

    const renderSpannedContent: () => ReactNode = useCallback(() => {
        const { subject, isAllDay, startTime, endTime } = processedEvent;
        if (!eventInfo.totalSegments) { return null; }

        const renderLeft: () => ReactNode = () =>
            isOverflowLeft ? renderOverflowIndicator('left') : !isAllDay && renderTime(formattedTime(startTime));

        const renderRight: () => ReactNode = () =>
            isOverflowRight ? renderOverflowIndicator('right') : !isAllDay && renderTime(formattedTime(endTime));

        return (
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                {renderLeft()}
                <div className={`${CSS_CLASSES.SUBJECT} ${CSS_CLASSES.TEXT_CENTER} ${CSS_CLASSES.ELLIPSIS}`}>
                    {subject || getString('addTitle')}
                </div>
                {renderRight()}
            </div>
        );
    }, [processedEvent, eventInfo, locale, timeFormat, isOverflowLeft, isOverflowRight]);

    const renderStandardEventContent: () => ReactNode = useCallback(() => {
        const { subject, startTime, isAllDay } = processedEvent;
        return (
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                {!isAllDay && renderTime(formattedTime(startTime))}
                <div className={`${CSS_CLASSES.SUBJECT} ${CSS_CLASSES.ELLIPSIS}`}>
                    {subject || getString('addTitle')}
                </div>
            </div>
        );
    }, [processedEvent]);

    const renderBlockEventContent: () => ReactNode = useCallback(() => {
        const { subject } = processedEvent;
        return (
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                <div className={`${CSS_CLASSES.SUBJECT} ${CSS_CLASSES.ELLIPSIS}`}>
                    {subject || getString('addTitle')}
                </div>
            </div>
        );
    }, [processedEvent]);

    const renderEventContent: () => ReactNode = useCallback(() => {
        if (eventTemplate) {
            if (typeof eventTemplate === 'function') {
                return eventTemplate(processedEvent);
            }
            return eventTemplate;
        }
        else if (isBlockedEvent) {
            return renderBlockEventContent();
        }
        else if (eventInfo.totalSegments) {
            return renderSpannedContent();
        }
        return renderStandardEventContent();
    }, [
        eventTemplate,
        processedEvent,
        renderSpannedContent,
        renderStandardEventContent,
        renderBlockEventContent,
        eventInfo,
        isOverflowLeft,
        isOverflowRight
    ]);

    // Combined style with event specific and position styles
    const finalStyle: React.CSSProperties = {
        ...(eventInfo.eventStyle || {}),
        ...positionStyle
    };

    const className: string = eventInfo.eventClasses.join(' ');
    const commonProps: HTMLAttributes<HTMLDivElement> & {
        'data-id': string | number;
        'data-guid': string;
        'aria-label': string;
    } = {
        'data-id': processedEvent.id,
        'aria-label': EventService.getAriaLabel(processedEvent),
        'data-guid': eventInfo.event.guid,
        role: 'button' as const,
        tabIndex: 0,
        onClick: handleClick,
        onDoubleClick: handleDoubleClick,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                handleClick(e as unknown as MouseEvent<HTMLDivElement>);
            }
        },
        style: finalStyle
    };
    const children: ReactNode = renderEventContent();

    return (
        allowDragAndDrop ? (
            <DraggableEvent
                data={processedEvent}
                className={className}
                containerProps={commonProps}
                ref={eventRef}
            >
                {allowResizing ? (
                    <ResizeHandlers
                        data={processedEvent}
                        hasPrevious={isOverflowLeft}
                        hasNext={isOverflowRight}
                    >
                        {children}
                    </ResizeHandlers>
                ) : (
                    <>{children}</>
                )}
            </DraggableEvent>
        ) : (
            <div ref={eventRef} className={className} {...commonProps}>
                {allowResizing ? (
                    <ResizeHandlers
                        data={processedEvent}
                        hasPrevious={isOverflowLeft}
                        hasNext={isOverflowRight}
                    >
                        {children}
                    </ResizeHandlers>
                ) : (
                    <>{children}</>
                )}
            </div>
        )
    );
};

DayEvent.displayName = 'DayEvent';
export default DayEvent;
