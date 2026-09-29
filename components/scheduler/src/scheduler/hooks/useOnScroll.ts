import { useCallback } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';

export const useOnScroll: () => { onScroll: () => void; } = (): { onScroll: () => void } => {
    const { schedulerRef } = useSchedulerPropsContext();
    const onScroll: () => void = useCallback((): void => {
        schedulerRef?.current?.closeQuickInfoPopup?.();
    }, [schedulerRef]);

    return { onScroll };
};
