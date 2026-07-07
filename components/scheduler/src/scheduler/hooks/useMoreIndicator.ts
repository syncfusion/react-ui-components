import { useCallback, MouseEvent } from 'react';
import { DateService } from '../services/DateService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { ProcessedEventsData } from '../types/internal-interface';
import { EventModel, SchedulerMoreEventsClickEvent } from '../types/scheduler-types';
import { ResourceLevel } from '../services/ResourceGroupingService';

/**
 * Hook that provides handler for "more events" click to open popup with events for a date.
 *
 * @param {Function} getAllEventsForDate - Function to retrieve all processed events for the given date key.
 * @returns {void} Handle more click for more event.
 * @private
 */
export function useMoreIndicator(
    getAllEventsForDate: (dateKey: string, resourceLeaf?: ResourceLevel) => ProcessedEventsData[]
): { handleMoreClick: (e: MouseEvent<HTMLElement>, date: Date, resource?: ResourceLevel) => void } {
    const { onMoreEventsClick, morePopupRef } = useSchedulerPropsContext();

    const handleMoreClick: (e: MouseEvent<HTMLElement>, date: Date, resource?: ResourceLevel) => void =
    useCallback((e: MouseEvent<HTMLElement>, date: Date, resource?: ResourceLevel): void => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }

        if (date && e.target) {
            const dateKey: string = DateService.generateDateKey(date);
            const allEvents: ProcessedEventsData[] = getAllEventsForDate(dateKey, resource);
            const eventModels: EventModel[] = allEvents.map((eventData: ProcessedEventsData) => eventData.event);
            const moreEventsArgs: SchedulerMoreEventsClickEvent = {
                cancel: false,
                data: eventModels
            };

            if (onMoreEventsClick) {
                onMoreEventsClick(moreEventsArgs);
            }
            if (moreEventsArgs.cancel) { return; }
            morePopupRef?.current?.open(date, eventModels, e.target as HTMLElement);
        }
    }, [getAllEventsForDate, onMoreEventsClick, morePopupRef]);

    return { handleMoreClick };
}

export default useMoreIndicator;
