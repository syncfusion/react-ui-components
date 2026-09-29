import { FC, memo } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useTimeSlotEvent, DayEventsWrapper } from '../hooks/useTimeSlotEvent';
import { useMonthEvents } from '../hooks/useMonthEvents';
import { useMoreIndicator } from '../hooks/useMoreIndicator';
import { DateService } from '../services/DateService';
import { ProcessedEventsData } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';
import { MoreIndicator } from './more-indicator';
import { PositioningService } from '../services/PositioningService';
import { Appointment } from './appointment';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { isNullOrUndefined } from '@syncfusion/react-base';

export const TimeSlotEvent: FC = memo(() => {

    const {
        maxEventsStack = 3,
        timeScale,
        startHourTuple,
        endHourTuple
    } = useSchedulerPropsContext();

    const { dayWrappers } = useTimeSlotEvent();
    const { renderDates } = useSchedulerRenderDatesContext();
    const { leafResources } = useResourceGroupingContext();
    const { getAllEventsForDate, getHiddenEventCount } = useMonthEvents(renderDates, maxEventsStack);
    const { handleMoreClick } = useMoreIndicator(getAllEventsForDate);

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
                    ? nonBlockEvents.slice(0, maxEventsStack)
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

                            return (
                                <Appointment
                                    key={eventInfo.eventKey}
                                    eventInfo={eventInfo}
                                    isVertical={true}
                                    hasPrevious={isOverflowTop}
                                    hasNext={isOverflowBottom}
                                    groupIndex={dayWrapper.groupIndex}
                                />
                            );
                        })}
                        {isTimeScaleDisabled && hiddenCount > 0 && (
                            <MoreIndicator
                                startDate={new Date(dayWrapper.dateTimestamp)}
                                count={hiddenCount}
                                onMoreClick={handleMoreClick}
                                style={{ top: dayWrapper.moreIndicatorTopPx }}
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
