import { FC, memo, ReactNode, MouseEvent, KeyboardEvent, HTMLAttributes, useCallback } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { EventService } from '../services/EventService';
import { AppointmentProps, ProcessedEventsData } from '../types/internal-interface';
import { DraggableEvent } from './drag-and-drop';
import ResizeHandlers from './resizeHandlers';
import { useEventRendering } from '../hooks/useEventRendering';

export const Appointment: FC<AppointmentProps> = memo(({
    eventInfo,
    isVertical = true,
    hasPrevious,
    hasNext,
    groupIndex
}: AppointmentProps) => {
    const {
        eventDrag,
        eventResize,
        readOnly,
        timeScale
    } = useSchedulerPropsContext();

    const {
        handleClick,
        handleDoubleClick,
        getEventContent,
        getTimelineTimeSlotEventContent
    } = useEventRendering({ variant: 'timeSlot' });

    const renderEventContent: (info: ProcessedEventsData) => ReactNode = useCallback(
        (info: ProcessedEventsData): ReactNode =>
            isVertical ? getEventContent(info) : getTimelineTimeSlotEventContent(info),
        [isVertical, getEventContent, getTimelineTimeSlotEventContent]
    );

    const handleKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as unknown as MouseEvent<HTMLDivElement>, eventInfo.event, !!eventInfo.event.isBlock);
        }
    };

    const className: string = [
        ...(eventInfo.eventClasses || [])
    ].filter(Boolean).join(' ');

    const commonProps: HTMLAttributes<HTMLDivElement> = {
        style: eventInfo.eventStyle,
        'data-id': String(eventInfo.event.id),
        'data-guid': eventInfo.event.guid,
        'aria-label': EventService.getAriaLabel(eventInfo.event),
        'data-group-index': groupIndex,
        tabIndex: 0,
        onClick: (e: MouseEvent<HTMLDivElement>) => handleClick(e, eventInfo.event, !!eventInfo.event.isBlock),
        onDoubleClick: (e: MouseEvent<HTMLDivElement>) =>
            handleDoubleClick(e, eventInfo.event, !!eventInfo.event.isBlock),
        onKeyDown: handleKeyDown
    } as HTMLAttributes<HTMLDivElement>;

    const children: ReactNode = renderEventContent(eventInfo);
    const allowEdit: boolean = !eventInfo.event.isBlock && !eventInfo.event.isReadonly && !readOnly;

    const resizeWrapped: ReactNode = (eventResize?.enable && allowEdit) ? (
        <ResizeHandlers
            isVertical={isVertical && (timeScale?.enable ?? true)}
            data={eventInfo.event}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
        >
            {children}
        </ResizeHandlers>
    ) : (
        <>{children}</>
    );

    return (eventDrag?.enable && allowEdit) ? (
        <DraggableEvent
            key={eventInfo.eventKey}
            data={eventInfo.event}
            className={className}
            containerProps={commonProps}
        >
            {resizeWrapped}
        </DraggableEvent>
    ) : (
        <div key={eventInfo.eventKey} className={className} {...commonProps}>
            {resizeWrapped}
        </div>
    );
});

Appointment.displayName = 'Appointment';
export default Appointment;
