import { TabValue } from '../types';
import { TabMeta } from '../internal-types';

export const createTabRegistry: () => {
    get: (value: TabValue) => TabMeta | undefined;
    register: (meta: TabMeta) => void;
    unregister: (value: TabValue) => void;
} = (): {
    get: (value: TabValue) => TabMeta | undefined;
    register: (meta: TabMeta) => void;
    unregister: (value: TabValue) => void;
} => {
    const map: Map<TabValue, TabMeta> = new Map();

    return {
        get: (value: TabValue): TabMeta | undefined => map.get(value),
        register: (meta: TabMeta): void => {
            map.set(meta.value, meta);
        },
        unregister: (value: TabValue): void => {
            map.delete(value);
        }
    };
};
