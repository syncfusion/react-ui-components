import { Context, createContext, useContext } from 'react';
import { defaultSchedulerProps } from '../utils/default-props';
import { ActiveViewProps } from '../types/internal-interface';

export const SchedulerContext: Context<ActiveViewProps | undefined> = createContext<ActiveViewProps | undefined>(defaultSchedulerProps);

/**
 * Hook for using the Scheduler context.
 *
 * @returns {ActiveViewProps} The Scheduler context.
 */
export const useSchedulerPropsContext: () => ActiveViewProps = (): ActiveViewProps => {
    const context: ActiveViewProps | undefined = useContext(SchedulerContext);
    if (context === undefined) {
        throw new Error('useSchedulerPropsContext must be used within a Scheduler');
    }
    return context;
};

SchedulerContext.displayName = 'SchedulerPropsContext';
