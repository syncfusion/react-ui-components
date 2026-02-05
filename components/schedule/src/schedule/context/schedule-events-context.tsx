import { Context, createContext, useContext } from 'react';
import { EventModel } from '../types/schedule-types';

export const ScheduleEventsContext: Context<{eventsData?: EventModel[]} | undefined> =
createContext<{eventsData?: EventModel[]} | undefined>(undefined);

/**
 * Hook for using the Schedule events data context.
 *
 * @returns {EventModel[]} The Schedule events data context.
 */
export const useScheduleEventsContext: () => {eventsData?: EventModel[]} = (): {eventsData?: EventModel[]} => {
    const context: {eventsData?: EventModel[]} | undefined = useContext(ScheduleEventsContext);
    if (context === undefined) {
        throw new Error('useScheduleEventsContext must be used within a Schedule');
    }
    return context;
};

ScheduleEventsContext.displayName = 'ScheduleEventsContext';
