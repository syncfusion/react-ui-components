import { DataManager } from '@syncfusion/react-data';

export const isDataManager: (value: unknown) => boolean = (value: unknown): boolean => {
    if (value === null || value === undefined || typeof value !== 'object') {
        return false;
    }
    return value instanceof DataManager;
};

export const isLocalArray: (value: unknown) => value is readonly unknown[] = (value: unknown): value is ReadonlyArray<unknown> => {
    return Array.isArray(value);
};

export const isEmpty: (value: unknown) => boolean = (value: unknown): boolean => {
    if (value === undefined || value === null) {
        return true;
    }
    if (Array.isArray(value) && value.length === 0) {
        return true;
    }
    return false;
};
