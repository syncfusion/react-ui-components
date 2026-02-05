import { useCallback, MouseEvent } from 'react';
import { DateService } from '../services/DateService';
import { useSchedulePropsContext } from '../context/schedule-context';
import { ProcessedEventsData } from '../types/internal-interface';
import { EventModel, MoreClickEvent } from '../types/schedule-types';

/**
 * Hook that provides handler for "more events" click to open popup with events for a date.
 *
 * @param {Function} getAllEventsForDate - Function to retrieve all processed events for the given date key.
 * @returns {void} Handle more click for more event.
 */
export function useMoreIndicator(
    getAllEventsForDate: (dateKey: string) => ProcessedEventsData[]
): { handleMoreClick: (e: MouseEvent<HTMLElement>, date: Date) => void } {
    const { onMoreEventsClick, morePopupRef } = useSchedulePropsContext();

    const handleMoreClick: (e: MouseEvent<HTMLElement>, date: Date) => void =
    useCallback((e: MouseEvent<HTMLElement>, date: Date): void => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }

        const args: MoreClickEvent = {
            date,
            element: e.target as HTMLElement
        };

        if (onMoreEventsClick) {
            onMoreEventsClick(args);
        }

        if (args && args.element) {
            const dateKey: string = DateService.generateDateKey(args.date);
            const allEvents: ProcessedEventsData[] = getAllEventsForDate(dateKey);
            const eventModels: EventModel[] = allEvents.map((eventData: ProcessedEventsData) => eventData.event);
            morePopupRef?.current?.open(args.date, eventModels, args.element);
        }
    }, [getAllEventsForDate, onMoreEventsClick, morePopupRef]);

    return { handleMoreClick };
}

export default useMoreIndicator;
