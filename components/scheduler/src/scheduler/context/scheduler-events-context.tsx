import { Context, createContext, useContext } from 'react';
import { EventModel } from '../types/scheduler-types';

export const SchedulerEventsContext: Context<{eventsData?: EventModel[]} | undefined> =
createContext<{eventsData?: EventModel[]} | undefined>(undefined);

/**
 * Hook for using the Scheduler events data context.
 *
 * @returns {EventModel[]} The Scheduler events data context.
 */
export const useSchedulerEventsContext: () => {eventsData?: EventModel[]} = (): {eventsData?: EventModel[]} => {
    const context: {eventsData?: EventModel[]} | undefined = useContext(SchedulerEventsContext);
    if (context === undefined) {
        throw new Error('useSchedulerEventsContext must be used within a Scheduler');
    }
    return context;
};

SchedulerEventsContext.displayName = 'SchedulerEventsContext';
