import { useCallback, type KeyboardEvent } from 'react';

export interface usePickerInputKeyDownOptions {
    maskOnKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
    pickerOnKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Hook for merging mask and picker input keydown behavior.
 *
 * @param {usePickerInputKeyDownOptions} options - Configuration for merged input keydown handling.
 * @returns {Function} Combined input keydown handler.
 */
export default function usePickerInputKeyDown(options: usePickerInputKeyDownOptions): (e: KeyboardEvent<HTMLInputElement>) => void {
    const { maskOnKeyDown, pickerOnKeyDown } = options;
    return useCallback((e: KeyboardEvent<HTMLInputElement>): void => {
        if (maskOnKeyDown) {
            if ((e.altKey || e.metaKey) && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                pickerOnKeyDown(e);
                return;
            }
            maskOnKeyDown(e);
            return;
        }
        pickerOnKeyDown(e);
    }, [maskOnKeyDown, pickerOnKeyDown]);
}
