import { useRef, useCallback } from 'react';

export interface ConfirmationDialogState {
    visible: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
}

export const useConfirmationDialog: () => {
    show: (config: Omit<ConfirmationDialogState, 'visible'>) => void;
    hide: () => void;
    setStateUpdater: (callback: (state: ConfirmationDialogState) => void) => void;
} = () => {
    const stateRef: React.RefObject<ConfirmationDialogState> = useRef<ConfirmationDialogState>({ visible: false });
    const setStateRef: React.RefObject<(state: ConfirmationDialogState) => void> =
        useRef<((state: ConfirmationDialogState) => void) | null>(null);

    const show: (config: Omit<ConfirmationDialogState, 'visible'>) => void = useCallback((config: Omit<ConfirmationDialogState, 'visible'>) => {
        stateRef.current = { ...config, visible: true };
        setStateRef.current?.(stateRef.current);
    }, []);

    const hide: () => void = useCallback(() => {
        stateRef.current.visible = false;
        setStateRef.current?.({ ...stateRef.current });
    }, []);

    return {
        show,
        hide,
        setStateUpdater: (callback: (state: ConfirmationDialogState) => void) => {
            setStateRef.current = callback;
        }
    };
};
