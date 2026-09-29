import type { HTMLAttributes, RefObject, SyntheticEvent } from 'react';

/**
 * Specifies a primitive identifier for an item in a collection.
 *
 * @private
 */
export type AccordionPanelValue = string | number;

/**
 * Specifies an ordered list of item identifiers representing a resolved state.
 *
 * @private
 */
export type AccordionValue = Array<AccordionPanelValue>;

/**
 * Specifies the panel mount strategy.
 *
 * - `Active` (default) - mount only the currently expanded panels; unmount when collapsed.
 * - `Retained` - mount a panel on its first expansion; never unmount.
 * - `All` - mount every panel on initial render.
 *
 * @default RenderMode.Active
 */
export type RenderMode = 'All' | 'Retained' | 'Active';

/**
 * Specifies the value change event detail.
 *
 */
export interface AccordionChangeEvent {
    /**
     * Specifies the resolved state observed after the change.
     */
    value: Array<string | number>;

    /**
     * Specifies the underlying SyntheticEvent.
     */
    event?: SyntheticEvent;
}

/**
 * Specifies the shared option shape for component and hook.
 *
 * @private
 */
export interface AccordionBaseOptions {
    /**
     * Specifies the active panel values.
     *
     * @default -
     */
    value?: Array<string | number>;

    /**
     * Specifies the default value of active panels.
     *
     * @default -
     */
    defaultValue?: Array<string | number>;

    /**
     * Specifies the callback fired when the value changes.
     *
     * @event onChange
     */
    onChange?: (event: AccordionChangeEvent) => void;
}

/**
 * Specifies the interface of useAccordion.
 *
 * @private
 */
export interface UseAccordionOptions extends AccordionBaseOptions {
    /**
     * Specifies whether multiple items can be active together.
     *
     * @default false
     */
    multiple?: boolean;

    /**
     * Specifies whether focusing a header opens the panel content.
     *
     * @default false
     */
    openOnFocus?: boolean;

    /**
     * Specifies the panel mount strategy.
     *
     * @default RenderMode.Active
     */
    renderMode?: RenderMode;

    /**
     * Specifies whether the accordion is rendered without visible borders.
     *
     * @default false
     */
    borderless?: boolean;
}

/**
 * Specifies the interface of Accordion component.
 *
 * @private
 */
export interface AccordionProps extends UseAccordionOptions {

    /**
     * Specifies whether built-in theme classes are suppressed.
     *
     * @private
     * @default false
     */
    unstyled?: boolean;
}

/**
 * Specifies the interface of useAccordion state.
 *
 * @private
 */
export interface UseAccordionState {
    /**
     * Specifies the active values.
     */
    value: Array<string | number>;

    /**
     * Specifies the focused item.
     */
    focusedValue?: string | number;
}

/**
 * Specifies the interface of useAccordion return.
 *
 * @private
 */
export interface UseAccordionReturn {
    /**
     * Specifies the state accordion.
     */
    state: UseAccordionState;

    /**
     * Specifies the HTML attributes for the root element.
     */
    rootProps: HTMLAttributes<HTMLDivElement>;

    /**
     * Specifies a live ref to the root DOM node.
     */
    rootRef: RefObject<HTMLDivElement | null>;

    /**
     * Specifies a getter for the spreadable HTML attributes of an item.
     */
    getPanelProps: (value: string | number, disabled?: boolean) => HTMLAttributes<HTMLElement>;

    /**
     * Specifies a getter for the spreadable HTML attributes of a header.
     */
    getHeaderProps: (value: string | number) => HTMLAttributes<HTMLElement>;

    /**
     * Specifies a getter for the spreadable HTML attributes of a trigger.
     */
    getTriggerProps: (value: string | number) => HTMLAttributes<HTMLDivElement>;

    /**
     * Specifies a getter for the spreadable HTML attributes of a content.
     */
    getContentProps: (value: string | number) => HTMLAttributes<HTMLDivElement>;

    /**
     * Specifies a getter for the spreadable HTML attributes of an indicator.
     */
    getIndicatorProps: (value: string | number) => HTMLAttributes<HTMLSpanElement>;

    /**
     * Specifies a predicate indicating whether the value is in the resolved state.
     */
    isOpen: (value: string | number) => boolean;

    /**
     * Specifies the action that adds the value to the resolved state.
     */
    open: (value: string | number) => void;

    /**
     * Specifies the action that removes the value from the resolved state.
     */
    close: (value: string | number) => void;

    /**
     * Specifies a selector returning the registered disabled flag for the value.
     */
    getDisabled: (value: string | number) => boolean;

    /**
     * Specifies the mount-mode predicate for the value's content.
     */
    shouldMount: (value: string | number) => boolean;
}

/**
 * Specifies the panel open/closed state exposed to render-prop children of `AccordionIndicator`.
 *
 */
export interface AccordionIndicatorTemplateContext {
    /**
     * Specifies whether the parent panel is currently open.
     */
    isOpen: boolean;
}
