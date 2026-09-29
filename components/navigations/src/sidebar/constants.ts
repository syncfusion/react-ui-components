
export const SIDEBAR_CLASSES: Record<string, string> = {
    ROOT: 'sf-sidebar',
    BACKDROP: 'sf-sidebar-backdrop',
    CONTENT_SHIFTED: 'sf-sidebar-content-shifted',
    TRANSITION: 'sf-sidebar-transition',
    LAYOUT: 'sf-sidebar-layout',
    MAIN: 'sf-sidebar-main',
    TRIGGER: 'sf-sidebar-trigger',
    OPEN: 'sf-sidebar-open',
    CLOSE: 'sf-sidebar-close',
    PUSH: 'sf-sidebar-push',
    OVER: 'sf-sidebar-over',
    LEFT: 'sf-sidebar-left',
    RIGHT: 'sf-sidebar-right',
    RTL: 'sf-rtl'
} as const;

export const SIDEBAR_ZINDEX_BASE: number = 1000;
export const SIDEBAR_ZINDEX_GAP: number = 1;

export const SIDEBAR_DATA_ATTRS: Record<string, string> = {
    OPEN: 'data-open',
    POSITION: 'data-position',
    MODE: 'data-mode',
    BACKDROP: 'data-backdrop',
    UNSTYLED: 'data-unstyled',
    DOCKABLE: 'data-dockable'
} as const;

export const SIDEBAR_CSS_VARS: Record<string, string> = {
    WIDTH: '--sf-sidebar-width',
    WIDTH_OPEN: '--sf-sidebar-width-open',
    DOCK_WIDTH: '--sf-sidebar-dock-width',
    TRANSITION_ENTER: '--sf-sidebar-transition-enter',
    TRANSITION_EXIT: '--sf-sidebar-transition-exit'
} as const;

export const SIDEBAR_DEFAULTS: Record<string, number> = {
    TRANSITION_MS: 300,
    DOCK_WIDTH: 48,
    DEFAULT_WIDTH: 260
} as const;

export const SIDEBAR_STATE_MODE: Record<'OVER' | 'PUSH', 'over' | 'push'> = {
    OVER: 'over',
    PUSH: 'push'
} as const;

export default SIDEBAR_CLASSES;
