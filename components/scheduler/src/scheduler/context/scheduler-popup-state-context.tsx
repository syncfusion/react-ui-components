import { Context, createContext, useCallback, useContext, useMemo, useState, FC, ReactNode, ReactElement } from 'react';

/** @private */
export interface SchedulerPopupState {
    morePopupVisible: boolean;
    morePopupShow: () => void;
    morePopupHide: () => void;
}

const SchedulerPopupContext: Context<SchedulerPopupState | undefined> = createContext<SchedulerPopupState | undefined>(undefined);

/**
 * Provider component that manages the visibility state of the MorePopup.
 *
 * @param {ReactNode} children - Child components
 * @returns {ReactElement} The provider wrapping the given children
 * @private
 */
export const SchedulerPopupStateProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }): ReactElement => {
    const [morePopupVisible, setmorePopupVisible] = useState<boolean>(false);

    const morePopupShow: () => void = useCallback(() => {
        setmorePopupVisible(true);
    }, []);

    const morePopupHide: () => void = useCallback(() => {
        setmorePopupVisible(false);
    }, []);

    const value: SchedulerPopupState = useMemo(() => ({
        morePopupVisible,
        morePopupShow,
        morePopupHide
    }), [morePopupVisible, morePopupShow, morePopupHide]);

    return <SchedulerPopupContext.Provider value={value}>{children}</SchedulerPopupContext.Provider>;
};

/**
 * Hook to access the MorePopup visibility context.
 *
 * @returns {SchedulerPopupContextValue} The MorePopup visibility context
 * @throws {Error} If used outside of a PopupStateProvider
 * @private
 */
export const useSchedulerPopupContext: () => SchedulerPopupState = (): SchedulerPopupState => {
    const context: SchedulerPopupState | undefined = useContext(SchedulerPopupContext);
    if (!context) {
        throw new Error('useSchedulerPopupContext must be used within PopupStateProvider');
    }
    return context;
};

SchedulerPopupContext.displayName = 'SchedulerPopupContext';
