import { FC, memo, ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useTimeSlotEvent, DayEventsWrapper } from '../hooks/useTimeSlotEvent';
import { useMonthEvents } from '../hooks/useMonthEvents';
import { useMoreIndicator } from '../hooks/useMoreIndicator';
import { EventService } from '../services/EventService';
import { DateService } from '../services/DateService';
import { ProcessedEventsData } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';
import { DraggableEvent } from './drag-and-drop';
import { MoreIndicator } from './more-indicator';
import { PositioningService } from '../services/PositioningService';
import ResizeHandlers from './resizeHandlers';
import { useEventRendering } from '../hooks/useEventRendering';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { isNullOrUndefined } from '@syncfusion/react-base';

export const TimeSlotEvent: FC = memo(() => {

    const {
        eventDrag,
        eventResize,
        maxEventsPerRow = 3,
        timeScale,
        readOnly,
        startHourTuple,
        endHourTuple
    } = useSchedulerPropsContext();

    const { dayWrappers } = useTimeSlotEvent();
    const { renderDates } = useSchedulerRenderDatesContext();
    const { leafResources } = useResourceGroupingContext();
    const { getAllEventsForDate, getHiddenEventCount } = useMonthEvents(renderDates, maxEventsPerRow);
    const { handleMoreClick } = useMoreIndicator(getAllEventsForDate);

    /**
     * Hook is called once at component level (Rules of Hooks compliant).
     * Context values (timeFormat, locale, eventTemplate, timeScale, renderDates)
     * are read once and captured in stable memoized callbacks.
     * Each function accepts eventInfo as a parameter, serving all events in the loop.
     */
    const {
        getEventContent: renderEventContent,
        handleClick,
        handleDoubleClick
    } = useEventRendering({ variant: 'timeSlot' });

    const handleKeyDown: (
        e: KeyboardEvent<HTMLDivElement>,
        eventInfo: ProcessedEventsData
    ) => void = (
        e: KeyboardEvent<HTMLDivElement>,
        eventInfo: ProcessedEventsData
    ): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e as unknown as MouseEvent<HTMLDivElement>, eventInfo.event, !!eventInfo.event.isBlock);
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
                const resourceLeaf: ResourceLevel = !isNullOrUndefined(dayWrapper.groupIndex) && leafResources
                    ? leafResources[dayWrapper.groupIndex]
                    : undefined;
                const dateKey: string = DateService.generateDateKey(date);
                const hiddenCount: number = isTimeScaleDisabled ? getHiddenEventCount(dateKey, resourceLeaf) : 0;

                // Filter to only first segments in render range
                const firstSegments: ProcessedEventsData[] = visibleNonBlock.filter(
                    (seg: ProcessedEventsData) => (
                        (seg.totalSegments && seg.totalSegments > 1 && seg.isFirstSegmentInRenderRange) ||
                        (!seg.totalSegments || seg.totalSegments <= 1))
                );

                const eventsToRender: ProcessedEventsData[] = isTimeScaleDisabled ? firstSegments : [...blockEvents, ...firstSegments];

                return (
                    <div
                        className={CSS_CLASSES.DAY_WRAPPER}
                        key={dayWrapper.key}
                        data-date={dayWrapper.dateTimestamp}
                        data-group-index={dayWrapper.groupIndex}
                    >
                        {eventsToRender.map((eventInfo: ProcessedEventsData) => {
                            const { isOverflowTop, isOverflowBottom } =
                                PositioningService.getOverflowDirection(eventInfo, renderDates, startHourTuple, endHourTuple);
                            const className: string = eventInfo.eventClasses.join(' ');
                            const commonProps: React.HTMLAttributes<HTMLDivElement> = {
                                style: eventInfo.eventStyle,
                                'data-id': String(eventInfo.event.id),
                                'data-guid': eventInfo.event.guid,
                                'aria-label': EventService.getAriaLabel(eventInfo.event),
                                'data-group-index': dayWrapper.groupIndex,
                                tabIndex: 0,
                                onClick: (e: MouseEvent<HTMLDivElement>) => handleClick(e, eventInfo.event, !!eventInfo.event.isBlock),
                                onDoubleClick: (e: MouseEvent<HTMLDivElement>) =>
                                    handleDoubleClick(e, eventInfo.event, !!eventInfo.event.isBlock),
                                onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, eventInfo)
                            } as unknown as React.HTMLAttributes<HTMLDivElement>;
                            const children: ReactNode = renderEventContent(eventInfo);
                            const allowEdit: boolean = !eventInfo.event.isBlock && !eventInfo.event.isReadonly && !readOnly;
                            return eventDrag.enable && allowEdit ? (
                                <DraggableEvent
                                    key={eventInfo.eventKey}
                                    data={eventInfo.event}
                                    className={className}
                                    containerProps={commonProps}
                                >
                                    {eventResize.enable && allowEdit ? (
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
                                    {eventResize.enable && allowEdit ? (
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
                                resource={resourceLeaf}
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
