import { MenuItemProps } from '../components';

export const isPrintableKey: (key: string) => boolean = (key: string): boolean => key?.length === 1 && /[a-zA-Z0-9]/.test(key);

export const swapRtlArrowKey: (key: string, dir: string) => string =
    (key: string, dir: string): string => {
        if (dir !== 'rtl') { return key; }
        if (key === 'ArrowLeft') { return 'ArrowRight'; }
        if (key === 'ArrowRight') { return 'ArrowLeft'; }
        return key;
    };

export const isValidItem: (item: MenuItemProps | undefined) => boolean =
    (item: MenuItemProps | undefined): boolean => !!item && !item.disabled;
