import { Context, createContext, useCallback, useContext, useMemo, useState, FC, ReactNode } from 'react';
import { ProcessedEventsData } from '../types/internal-interface';
import { EventModel } from '../types/scheduler-types';

interface CloneEventData {
    guid?: string;
    segments?: ProcessedEventsData[];
    isDayEvent?: boolean;
    draggedEvent?: EventModel;
    sourceTopPx?: number;
}

interface CloneEventState extends CloneEventData {
    visible: boolean;
}

/** @private */
export interface CloneEventContextValue extends CloneEventState {
    show: (payload: CloneEventData) => void;
    hide: () => void;
}

const CloneEventContext: Context<CloneEventContextValue | undefined> = createContext<CloneEventContextValue | undefined>(undefined);

export const CloneEventProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<CloneEventState>({
        visible: false,
        guid: null,
        segments: [],
        isDayEvent: false,
        draggedEvent: null,
        sourceTopPx: 0
    });

    const show: (payload: CloneEventData) => void = useCallback((payload: CloneEventData) => {
        setState({
            visible: true,
            guid: payload?.guid,
            segments: payload?.segments ?? [],
            isDayEvent: !!payload?.isDayEvent,
            draggedEvent: payload?.draggedEvent ?? null,
            sourceTopPx: payload?.sourceTopPx ?? 0
        });
    }, []);

    const hide: () => void = useCallback(() => {
        setState({
            visible: false,
            guid: null,
            segments: [],
            isDayEvent: false,
            draggedEvent: null,
            sourceTopPx: 0
        });
    }, []);

    const value: CloneEventContextValue = useMemo(() => ({
        ...state,
        show,
        hide
    }), [state, show, hide]);

    return <CloneEventContext.Provider value={value}>{children}</CloneEventContext.Provider>;
};

export const useCloneEventContext: () => CloneEventContextValue = (): CloneEventContextValue => {
    const context: CloneEventContextValue | undefined = useContext(CloneEventContext);
    if (!context) {
        throw new Error('useCloneEventContext must be used within CloneEventProvider');
    }
    return context;
};
