export const ACCORDION_CLASSES: Record<string, string> = {
    ROOT: 'sf-accordion',
    PANEL: 'sf-accordion-panel',
    HEADER: 'sf-accordion-header sf-pos-relative',
    TRIGGER: 'sf-accordion-trigger',
    CONTENT: 'sf-accordion-content',
    INDICATOR: 'sf-accordion-indicator',
    OPEN: 'sf-accordion-open',
    DEFAULT_OPEN: 'sf-accordion-default-open',
    CLOSED: 'sf-accordion-closed',
    DISABLED: 'sf-accordion-disabled sf-cursor-not-allowed sf-no-pointer',
    FOCUSED: 'sf-accordion-focused',
    RENDER_ACTIVE: 'sf-accordion-mode-active',
    RENDER_RETAINED: 'sf-accordion-mode-retained',
    RENDER_ALL: 'sf-accordion-mode-all',
    BORDERLESS: 'sf-accordion-borderless',
    CONTENT_CENTER: 'sf-content-center',
    CONTENT_BETWEEN: 'sf-content-between sf-cursor-pointer',
    DISPLAY_NONE: 'sf-display-none'
} as const;

