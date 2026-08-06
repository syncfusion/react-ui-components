import { Context, createContext, useContext } from 'react';

export const ScheduleRenderDatesContext: Context<{renderDates?: Date[]} | undefined> =
createContext<{renderDates?: Date[]} | undefined>(undefined);

/**
 * Hook for using the Schedule render dates context.
 *
 * @returns {Date[]} The Schedule render dates context.
 */
export const useScheduleRenderDatesContext: () => {renderDates?: Date[]} = (): {renderDates?: Date[]} => {
    const context: {renderDates?: Date[]} | undefined = useContext(ScheduleRenderDatesContext);
    if (context === undefined) {
        throw new Error('useScheduleRenderDatesContext must be used within a Schedule');
    }
    return context;
};

ScheduleRenderDatesContext.displayName = 'ScheduleRenderDatesContext';
