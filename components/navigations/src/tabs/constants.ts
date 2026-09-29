import { TABS_CLASSES } from '../common/constants';
import { HeaderPlacement } from './types';

export const orientationFromPlacement: (placement: 'Top' | 'Bottom' | 'Left' | 'Right') =>
'horizontal' | 'vertical' = (placement: 'Top' | 'Bottom' | 'Left' | 'Right'): 'horizontal' | 'vertical' => {
    return (placement === 'Left' || placement === 'Right') ? 'vertical' : 'horizontal';
};

export const TAB_KEYS: {
    readonly ARROW_LEFT: 'ArrowLeft';
    readonly ARROW_RIGHT: 'ArrowRight';
    readonly ARROW_UP: 'ArrowUp';
    readonly ARROW_DOWN: 'ArrowDown';
    readonly HOME: 'Home';
    readonly END: 'End';
    readonly ENTER: 'Enter';
    readonly SPACE: ' ';
} = {
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    HOME: 'Home',
    END: 'End',
    ENTER: 'Enter',
    SPACE: ' '
} as const;

export const PLACEMENT_CLASS: Record<HeaderPlacement, string> = {
    Top: TABS_CLASSES.TOP,
    Bottom: TABS_CLASSES.BOTTOM,
    Left: TABS_CLASSES.LEFT,
    Right: TABS_CLASSES.RIGHT
};
