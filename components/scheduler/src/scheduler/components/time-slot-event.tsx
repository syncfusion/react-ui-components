import { FC, memo, Fragment, ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useTimeSlotEvent, DayEventsWrapper } from '../hooks/useTimeSlotEvent';
import { useMonthEvents } from '../hooks/useMonthEvents';
import { useMoreIndicator } from '../hooks/useMoreIndicator';
import { EventService } from '../services/EventService';
import { DateService } from '../services/DateService';
import { ProcessedEventsData } from '../types/internal-interface';
import { ChevronDownDoubleIcon, ChevronUpDoubleIcon, ChevronLeftDoubleIcon, ChevronRightDoubleIcon } from '@syncfusion/react-icons';
import { SchedulerEventClickEvent } from '../types/scheduler-types';
import { CSS_CLASSES } from '../common/constants';
import { DraggableEvent } from './drag-and-drop';
import { useSchedulerLocalization } from '../common/locale';
import { useProviderContext } from '@syncfusion/react-base';
import { MoreIndicator } from './more-indicator';
import { PositioningService } from '../services/PositioningService';
import ResizeHandlers from './resizeHandlers';
import { clearAndSelectAppointment } from '../utils/actions';

export const TimeSlotEvent: FC = memo(() => {

    const {
        eventTemplate,
        onEventClick,
        onEventDoubleClick,
        eventDrag,
        eventResize = true,
        maxEventsPerRow = 3,
        timeScale,
        readOnly,
        quickPopupRef
    } = useSchedulerPropsContext();

    const { dayWrappers } = useTimeSlotEvent();
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const { renderDates } = useSchedulerRenderDatesContext();
    const { getAllEventsForDate, getHiddenEventCount } = useMonthEvents(renderDates, maxEventsPerRow);
    const { handleMoreClick } = useMoreIndicator(getAllEventsForDate);

    const renderSpannedContent: (eventInfo: ProcessedEventsData) => ReactNode = (eventInfo: ProcessedEventsData) => {
        if (timeScale.enable) {
            return (
                <Fragment>
                    {!eventInfo.isFirstDay && (
                        <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.UP_ARROW_ICON}`}>
                            <ChevronUpDoubleIcon />
                        </div>
                    )}
                    {renderStandardEventContent(eventInfo)}
                    {!eventInfo.isLastDay && (
                        <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.DOWN_ARROW_ICON}`}>
                            <ChevronDownDoubleIcon />
                        </div>
                    )}
                </Fragment>
            );
        } else {
            const { isOverflowLeft, isOverflowRight } = PositioningService.getOverflowDirection(eventInfo, renderDates);
            return (
                <Fragment>
                    {isOverflowLeft && (
                        <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.LEFT_ARROW_ICON}`}>
                            <ChevronLeftDoubleIcon />
                        </div>
                    )}
                    {renderStandardEventContent(eventInfo)}
                    {isOverflowRight && (
                        <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.RIGHT_ARROW_ICON}`}>
                            <ChevronRightDoubleIcon />
                        </div>
                    )}
                </Fragment>
            );
        }
    };

    const renderStandardEventContent: (eventInfo: ProcessedEventsData) => ReactNode = (eventInfo: ProcessedEventsData) => {
        const { event, timeDisplay } = eventInfo;
        return (
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                <div className={`${CSS_CLASSES.SUBJECT}`}>
                    {event.subject || getString('addTitle')}
                </div>
                {!event.isBlock && event.location && (
                    <div className={`${CSS_CLASSES.EVENT_LOCATION} ${CSS_CLASSES.ELLIPSIS}`} title={event.location}>
                        {event.location}
                    </div>
                )}
                {!event.isBlock && (
                    <div className={`${CSS_CLASSES.EVENT_TIME} ${CSS_CLASSES.ELLIPSIS}`} title={timeDisplay}>
                        {timeDisplay}
                    </div>
                )}
            </div>
        );
    };

    /**
     * Render the content of an event
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @returns {ReactNode} The rendered event content
     */
    const renderEventContent: (eventInfo: ProcessedEventsData) => ReactNode = (eventInfo: ProcessedEventsData): ReactNode => {
        if (eventTemplate) {
            return eventTemplate(eventInfo.event);
        }
        else if (eventInfo.totalSegments) {
            return renderSpannedContent(eventInfo);
        }
        return renderStandardEventContent(eventInfo);
    };

    const handleEventClick: (
        e: MouseEvent<HTMLDivElement>,
        eventInfo: ProcessedEventsData
    ) => void = (
        e: MouseEvent<HTMLDivElement>,
        eventInfo: ProcessedEventsData
    ): void => {
        if (eventInfo.event.isBlock) {
            e?.preventDefault();
            e?.stopPropagation();
            return;
        }
        clearAndSelectAppointment(e.currentTarget);
        if (onEventClick) {
            const eventClickArgs: SchedulerEventClickEvent = {
                event: e,
                data: eventInfo.event,
                element: e.currentTarget
            };
            onEventClick(eventClickArgs);
        }
    };

    const handleEventDoubleClick: (
        e: MouseEvent<HTMLDivElement>,
        eventInfo: ProcessedEventsData
    ) => void = (
        e: MouseEvent<HTMLDivElement>,
        eventInfo: ProcessedEventsData
    ): void => {
        if (eventInfo.event.isReadonly || readOnly || eventInfo.event.isBlock) {
            e?.preventDefault();
            e?.stopPropagation();
            return;
        }
        if (onEventDoubleClick) {
            quickPopupRef?.current?.hide();
            const eventClickArgs: SchedulerEventClickEvent = {
                event: e,
                data: eventInfo.event,
                element: e.currentTarget
            };
            onEventDoubleClick(eventClickArgs);
        }
    };

    const handleKeyDown: (
        e: KeyboardEvent<HTMLDivElement>,
        eventInfo: ProcessedEventsData
    ) => void = (
        e: KeyboardEvent<HTMLDivElement>,
        eventInfo: ProcessedEventsData
    ): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleEventClick(e as unknown as MouseEvent<HTMLDivElement>, eventInfo);
        }
    };

    if (!dayWrappers) {
        return <div className={CSS_CLASSES.EVENT_CONTAINER}></div>;
    }

    const isTimeScaleDisabled: boolean = !(timeScale && timeScale.enable);

    return (
        <div className={CSS_CLASSES.EVENT_CONTAINER}>
            {dayWrappers.map((dayWrapper: DayEventsWrapper) => {
                const nonBlockEvents: ProcessedEventsData[] = dayWrapper.events.filter((e: ProcessedEventsData) => !e.event.isBlock);
                const blockEvents: ProcessedEventsData[] = dayWrapper.events.filter((e: ProcessedEventsData) => e.event.isBlock);

                const visibleNonBlock: ProcessedEventsData[] = isTimeScaleDisabled
                    ? nonBlockEvents.slice(0, maxEventsPerRow)
                    : nonBlockEvents;
                const date: Date = new Date(dayWrapper.dateTimestamp);
                const dateKey: string = DateService.generateDateKey(date);
                const hiddenCount: number = isTimeScaleDisabled ? getHiddenEventCount(dateKey) : 0;

                // Filter to only first segments in render range
                const firstSegments: ProcessedEventsData[] = visibleNonBlock.filter(
                    (seg: ProcessedEventsData) => (
                        (seg.totalSegments && seg.totalSegments > 1 && seg.isFirstSegmentInRenderRange) ||
                        (!seg.totalSegments || seg.totalSegments <= 1))
                );

                const eventsToRender: ProcessedEventsData[] = isTimeScaleDisabled ? firstSegments : [...blockEvents, ...firstSegments];

                return (
                    <div className={CSS_CLASSES.DAY_WRAPPER} key={dayWrapper.key} data-date={dayWrapper.dateTimestamp}>
                        {eventsToRender.map((eventInfo: ProcessedEventsData) => {
                            const { isOverflowTop, isOverflowBottom } = PositioningService.getOverflowDirection(eventInfo, renderDates);
                            const className: string = eventInfo.eventClasses.join(' ');
                            const commonProps: React.HTMLAttributes<HTMLDivElement> = {
                                style: eventInfo.eventStyle,
                                'data-id': String(eventInfo.event.id),
                                'data-guid': eventInfo.event.guid,
                                'aria-label': EventService.getAriaLabel(eventInfo.event),
                                tabIndex: 0,
                                onClick: (e: MouseEvent<HTMLDivElement>) => handleEventClick(e, eventInfo),
                                onDoubleClick: (e: MouseEvent<HTMLDivElement>) => handleEventDoubleClick(e, eventInfo),
                                onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, eventInfo)
                            } as unknown as React.HTMLAttributes<HTMLDivElement>;
                            const children: ReactNode = renderEventContent(eventInfo);
                            const allowEdit: boolean = !eventInfo.event.isBlock && !eventInfo.event.isReadonly && !readOnly;
                            return eventDrag && allowEdit ? (
                                <DraggableEvent
                                    key={eventInfo.eventKey}
                                    data={eventInfo.event}
                                    className={className}
                                    containerProps={commonProps}
                                >
                                    {eventResize && allowEdit ? (
                                        <ResizeHandlers
                                            isVertical={timeScale.enable}
                                            data={eventInfo.event}
                                            hasPrevious={isOverflowTop}
                                            hasNext={isOverflowBottom}
                                        >
                                            {children}
                                        </ResizeHandlers>
                                    ) : (
                                        <>{children}</>
                                    )}
                                </DraggableEvent>
                            ) : (
                                <div key={eventInfo.eventKey} className={className} {...commonProps}>
                                    {eventResize && allowEdit ? (
                                        <ResizeHandlers
                                            isVertical={timeScale.enable}
                                            data={eventInfo.event}
                                            hasPrevious={isOverflowTop}
                                            hasNext={isOverflowBottom}
                                        >
                                            {children}
                                        </ResizeHandlers>
                                    ) : (
                                        <>{children}</>
                                    )}
                                </div>
                            );
                        })}
                        {isTimeScaleDisabled && hiddenCount > 0 && (
                            <MoreIndicator
                                date={new Date(dayWrapper.dateTimestamp)}
                                count={hiddenCount}
                                onMoreClick={handleMoreClick}
                                topPx={dayWrapper.moreIndicatorTopPx}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
});

TimeSlotEvent.displayName = 'TimeSlotEvent';
export default TimeSlotEvent;
