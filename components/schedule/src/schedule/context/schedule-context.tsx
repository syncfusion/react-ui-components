import { Context, createContext, useContext } from 'react';
import { defaultScheduleProps } from '../utils/default-props';
import { ActiveViewProps } from '../types/internal-interface';

export const ScheduleContext: Context<ActiveViewProps | undefined> = createContext<ActiveViewProps | undefined>(defaultScheduleProps);

/**
 * Hook for using the Schedule context.
 *
 * @returns {ActiveViewProps} The Schedule context.
 */
export const useSchedulePropsContext: () => ActiveViewProps = (): ActiveViewProps => {
    const context: ActiveViewProps | undefined = useContext(ScheduleContext);
    if (context === undefined) {
        throw new Error('useSchedulePropsContext must be used within a Schedule');
    }
    return context;
};

ScheduleContext.displayName = 'SchedulePropsContext';
