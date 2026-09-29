import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

export const useControlledState: <T>(controlled: T | undefined, defaultValue: T, onOpenChange?: (value: T) => void
) => [T, Dispatch<SetStateAction<T>>] = <T>(controlled: T | undefined, defaultValue: T, onOpenChange?: (value: T) => void
): [T, Dispatch<SetStateAction<T>>] => {
    const [internal, setInternal] = useState<T>(defaultValue);
    const value: T = controlled !== undefined ? controlled : internal;

    const setValue: Dispatch<SetStateAction<T>> = useCallback(
        (next: SetStateAction<T>): void => {
            const resolved: T = typeof next === 'function'
                ? (next as (prev: T) => T)(value)
                : next;
            if (controlled === undefined) { setInternal(resolved); }
            onOpenChange?.(resolved);
        },
        [controlled, onOpenChange, value]
    );

    return [value, setValue] as const;
};

export default useControlledState;
