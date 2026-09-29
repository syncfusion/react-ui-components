import { useCallback, MouseEvent } from 'react';
import { DateService } from '../services/DateService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { ProcessedEventsData } from '../types/internal-interface';
import { EventModel, SchedulerMoreEventsClickEvent } from '../types/scheduler-types';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { isNullOrUndefined } from '@syncfusion/react-base';

/**
 * Hook that provides handler for "more events" click to open popup with events for a date.
 * Events are filtered on demand via {@link getAllEventsForDate}
 * (optional range uses {@link startDate} when {@link endDate} is provided).
 *
 * @param {Function} getAllEventsForDate - Function to retrieve processed events for the given date key
 * (and optional resource / start-end range).
 * @returns {{ handleMoreClick: Function }} More-indicator click handler.
 * @private
 */
export function useMoreIndicator(
    getAllEventsForDate: (dateKey: string, resourceLeaf?: ResourceLevel, startDate?: Date, endDate?: Date) => ProcessedEventsData[]
): { handleMoreClick: (e: MouseEvent<HTMLElement>, startDate: Date, resource?: ResourceLevel, endDate?: Date) => void; } {
    const { onMoreEventsClick, morePopupRef } = useSchedulerPropsContext();

    const handleMoreClick:
    (e: MouseEvent<HTMLElement>, startDate: Date, resource?: ResourceLevel, endDate?: Date) => void =
    useCallback((e: MouseEvent<HTMLElement>, startDate: Date, resource?: ResourceLevel, endDate?: Date): void => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }

        if (startDate && e.target) {
            const dateKey: string = DateService.generateDateKey(startDate);
            const allEvents: (ProcessedEventsData)[] =
                getAllEventsForDate(dateKey, resource, !isNullOrUndefined(endDate) ? startDate : undefined, endDate);

            if (!allEvents || allEvents.length === 0) { return; }
            const eventModels: EventModel[] = allEvents.map((eventData: ProcessedEventsData) => {
                return eventData.event;
            });
            const moreEventsArgs: SchedulerMoreEventsClickEvent = {
                cancel: false,
                data: eventModels
            };

            if (onMoreEventsClick) {
                onMoreEventsClick(moreEventsArgs);
            }
            if (!moreEventsArgs.cancel && morePopupRef?.current) {
                const groupOrder: (string | number)[] | undefined = resource?.groupOrder;
                morePopupRef.current.open(startDate, eventModels, e.target as HTMLElement, groupOrder);
            }
        }
    }, [getAllEventsForDate, onMoreEventsClick, morePopupRef]);

    return { handleMoreClick };
}

export default useMoreIndicator;
