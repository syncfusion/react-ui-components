import { Context, createContext, useContext } from 'react';

export const SchedulerRenderDatesContext: Context<{renderDates?: Date[]} | undefined> =
createContext<{renderDates?: Date[]} | undefined>(undefined);

/**
 * Hook for using the Scheduler render dates context.
 *
 * @returns {Date[]} The Scheduler render dates context.
 */
export const useSchedulerRenderDatesContext: () => {renderDates?: Date[]} = (): {renderDates?: Date[]} => {
    const context: {renderDates?: Date[]} | undefined = useContext(SchedulerRenderDatesContext);
    if (context === undefined) {
        throw new Error('useSchedulerRenderDatesContext must be used within a Scheduler');
    }
    return context;
};

SchedulerRenderDatesContext.displayName = 'SchedulerRenderDatesContext';
