import { FC, useRef, RefObject, useCallback, MouseEvent, ReactNode, KeyboardEvent, HTMLAttributes } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { DayEventProps } from '../types/internal-interface';
import { EventService } from '../services/EventService';
import { useEventPositioning } from '../hooks/useEventPositioning';
import { useProviderContext } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../common/constants';
import { DraggableEvent } from './drag-and-drop';
import { useSchedulerLocalization } from '../common/locale';
import ResizeHandlers from './resizeHandlers';
import { useEventRendering } from '../hooks/useEventRendering';

export const DayEvent: FC<DayEventProps> = (props: DayEventProps) => {
    const {
        weekRenderDates,
        isBlockedEvent,
        ...eventInfo
    } = props;

    const { renderDates } = useSchedulerRenderDatesContext();

    const {
        eventDrag,
        eventResize,
        readOnly
    } = useSchedulerPropsContext();

    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
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

    const {
        getEventContent: getSharedEventContent,
        handleClick: onClickHandler,
        handleDoubleClick: onDoubleClickHandler
    } = useEventRendering({
        variant: 'day',
        event: eventInfo.event,
        totalSegments: eventInfo.totalSegments,
        isOverflowLeft,
        isOverflowRight
    });

    const handleClick: (e: MouseEvent<HTMLDivElement>) => void =
        useCallback((e: MouseEvent<HTMLDivElement>): void => {
            onClickHandler(e, eventInfo.event, isBlockedEvent);
        }, [onClickHandler, eventInfo.event, isBlockedEvent]);

    const handleDoubleClick: (e: MouseEvent<HTMLDivElement>) => void =
        useCallback((e: MouseEvent<HTMLDivElement>): void => {
            onDoubleClickHandler(e, eventInfo.event, isBlockedEvent);
        }, [onDoubleClickHandler, eventInfo.event, isBlockedEvent]);

    const renderBlockEventContent: () => ReactNode = useCallback(() => {
        const { subject } = processedEvent;
        return (
            <div className={`${CSS_CLASSES.INNER_APPOINTMENT}`}>
                <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                    <div className={`${CSS_CLASSES.SUBJECT}`}>
                        {subject || getString('addTitle')}
                    </div>
                </div>
            </div>
        );
    }, [processedEvent, getString]);

    const renderEventContent: () => ReactNode = useCallback(() => {
        if (isBlockedEvent) {
            return renderBlockEventContent();
        }
        return getSharedEventContent();
    }, [isBlockedEvent, renderBlockEventContent, getSharedEventContent]);

    // Combined style with event specific and position styles
    const finalStyle: React.CSSProperties = {
        ...(eventInfo.eventStyle || {}),
        ...positionStyle
    };

    const className: string = eventInfo.eventClasses.join(' ');
    const commonProps: HTMLAttributes<HTMLDivElement> & {
        'data-id': string | number;
        'data-guid': string;
        'data-group-index': number;
        'aria-label': string;
    } = {
        'data-id': processedEvent.id,
        'aria-label': EventService.getAriaLabel(processedEvent),
        'data-guid': eventInfo.event.guid,
        'data-group-index': eventInfo.groupIndex,
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
    const allowEdit: boolean = !isBlockedEvent && !eventInfo.event.isReadonly && !readOnly;

    return (
        eventDrag?.enable && allowEdit ? (
            <DraggableEvent
                data={processedEvent}
                className={className}
                containerProps={commonProps}
                ref={eventRef}
            >
                {eventResize?.enable && allowEdit ? (
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
                {eventResize?.enable && allowEdit ? (
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
