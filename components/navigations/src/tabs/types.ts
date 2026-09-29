import { MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent, SyntheticEvent, HTMLAttributes, RefAttributes } from 'react';
import { TabProps, TabPanelProps } from './rendering';
import { RenderMode } from '..';
/**
 * Specifies the value type of a tab. Tabs can be looked up by string or number.
 * Strings are recommended for SSR-stable IDs.
 *
 */
export type TabValue = string | number;

/**
 * Specifies where the tab list sits relative to the panels.
 *
 * - `'Top'` (default) — tab list above panels (horizontal).
 * - `'Bottom'` — tab list below panels (horizontal).
 * - `'Left'` — tab list on the left of panels (vertical).
 * - `'Right'` — tab list on the right of panels (vertical).
 *
 */
export type HeaderPlacement = 'Top' | 'Bottom' | 'Left' | 'Right';

/**
 * Specifies how tabs overflow the host viewport.
 *
 * - 'Scrollable' (default) — Tabs that exceed the host's inline-size are navigated via prev/next buttons of an HScroll/VScroll wrapper.
 * - 'Popup' — Tabs that exceed the host's inline-size are listed inside a popup menu accessed via a "more" trigger button.
 */
export type TabOverflowMode = 'Scrollable' | 'Popup';

/**
 * Specifies the visual treatment applied to the active tab.
 *
 * - 'default' (default) — The active tab renders a `::after` underline.
 * - 'fill' — The active tab renders a filled background instead of an underline.
 * - 'accent' — The active tab renders with an accent text color while keeping the `::after` underline.
 */
export type TabVariant = 'default' | 'fill' | 'accent';

/**
 * Specifies the detail for the tab close callback.
 *
 */
export interface TabCloseEvent {
    /**
     * Specifies the value of the tab being closed.
     */
    value: TabValue;
    /**
     * Specifies the underlying event that triggered the click the close icon.
     */
    event: Event | SyntheticEvent;
}

/**
 * Specifies the change event detail for `onValueChange`.
 *
 */
export interface TabsChangeEvent {
    /**
     * Specifies the new active value.
     */
    value: TabValue;
    /**
     * Specifies the previous active value.
     */
    previousValue: TabValue | null;
    /**
     * Specifies the underlying event that triggered the change.
     */
    event: Event | SyntheticEvent;
}

/**
 * Specifies the focus change event detail for `onFocusChange`.
 *
 */
export interface TabsFocusEvent {
    /**
     * Specifies the new focused value.
     */
    focusedValue: TabValue;
    /**
     * Specifies the previous focused value.
     */
    previousFocusedValue: TabValue | null;
    /**
     * Specifies the underlying keyboard or mouse event.
     */
    event: ReactKeyboardEvent | ReactMouseEvent;
}

/**
 * Specifies the options for the public `useTabs` hook.
 *
 */
export interface TabsOptions {

    /**
     * Specifies the initially selected tab in uncontrolled mode.
     *
     * @default -
     */
    defaultValue?: TabValue;

    /**
     * Specifies the currently selected tab in controlled mode.
     *
     * @default -
     */
    value?: TabValue;

    /**
     * Triggers when the selected tab changes.
     *
     * @event onValueChange
     */
    onValueChange?: (event: TabsChangeEvent) => void;

    /**
     * Triggers when focus moves to a different tab.
     *
     * @event onFocusChange
     */
    onFocusChange?: (event: TabsFocusEvent) => void;

    /**
     * Specifies whether a focused tab is selected automatically.
     *
     * @default false
     */
    selectOnFocus?: boolean;

    /**
     * Specifies whether keyboard navigation wraps between the first and last tabs.
     *
     * @default true
     */
    loopFocus?: boolean;

    /**
     * Specifies the position of the tab header relative to the tab panels.
     *
     * @default 'Top'
     */
    headerPlacement?: HeaderPlacement;

    /**
     * Specifies how tabs that exceed the host's inline-size are handled.
     *
     * - 'Scrollable' (default) — tabs overflow via an `HScroll` / `VScroll` wrapper with prev/next nav buttons.
     * - 'Popup' — tabs overflow via a "more" trigger that opens a `<Popup>` listing the overflowed items.
     *
     * @default 'Scrollable'
     */
    overflowMode?: TabOverflowMode;

    /**
     * Specifies the pixel distance for one prev/next click on the scroll wrapper.
     * `null` (default) means one viewport width/height.
     *
     * @default null
     */
    scrollStep?: number | null;

    /**
     * Specifies the visual treatment applied to the active tab.
     *
     * - 'default' — `::after` underline on the active tab.
     * - 'fill' — Filled background on the active tab.
     * - 'accent' — Accent text color on the active tab.
     *
     * @default 'default'
     */
    variant?: TabVariant;

    /**
     * Triggers when a tab's close button is clicked or `Delete` is pressed on a focused closeable tab.
     *
     * @event onClose
     */
    onClose?: (event: TabCloseEvent) => void;

}

/**
 * Specifies the props for the root `<Tabs>` component.
 *
 */
export interface TabsProps extends TabsOptions {

    /**
     * Specifies whether the component suppresses default class names.
     *
     * @private
     * @default false
     */
    unstyled?: boolean;

    /**
     * Specifies the approach used to manage mounting and unmounting of tab content.
     *
     * @default 'Active'
     */
    renderMode?: RenderMode;
}
/**
 * Specifies the props for containers that may have an optional id.
 *
 * @private
 */
export interface UseTabContainerProps {
    /**
     * Specifies the optional id for the container element.
     *
     */
    id?: string;
}

/**
 * Specifies the props for the tab indicator component.
 *
 * @private
 */
export interface UseTabIndicatorProps {
    /**
     * Specifies the id for the element, or null to auto-generate.
     *
     */
    id: string | null;
    /**
     * Specifies the placement of the tab header.
     *
     */
    placement: HeaderPlacement;
}

/**
 * Specifies the props for the tabs root container.
 *
 * @private
 */
export interface UseTabsRootProps extends UseTabIndicatorProps {
    /**
     * Specifies the text direction for the component.
     *
     */
    dir?: 'ltr' | 'rtl' | null;
}

/**
 * Specifies the memoized DOM-prop getters that return the exact props for each element to spread.
 *
 * @private
 */
export interface UseTabsGetters {
    /**
     * Specifies the props for an individual `<Tab>` element, including a `ref` callback that registers the node with the reducer.
     *
     */
    getTabProps: (value: TabValue, props?: TabProps) => HTMLAttributes<HTMLDivElement>;
    /**
     * Specifies the props for an individual `<TabPanel>` element.
     *
     */
    getPanelProps: (value: TabValue, props?: TabPanelProps) => HTMLAttributes<HTMLDivElement>;
    /**
     * Specifies the ARIA and identity props for the tab-list container.
     *
     */
    getTabListProps: (props?: UseTabContainerProps) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
    /**
     * Specifies the identity props for the tab-panels container.
     *
     */
    getTabPanelsProps: (props?: UseTabContainerProps) => HTMLAttributes<HTMLDivElement>;
    /**
     * Specifies the ARIA and orientation props for the rendered indicator node.
     *
     */
    getTabIndicatorProps: (props: UseTabIndicatorProps) => HTMLAttributes<HTMLDivElement>;
    /**
     * Specifies the root container props, including `dir` mirroring and the placement metadata used by CSS hooks.
     *
     */
    getTabsRootProps: (props: UseTabsRootProps) => HTMLAttributes<HTMLDivElement>;
}

/**
 * Specifies the imperative helpers for keyboard shortcuts, programmatic navigation, and scroll-into-view.
 *
 * @private
 */
export interface UseTabsHelpers {
    /**
     * Specifies the function that programmatically selects the tab with the given `value`, firing `onValueChange` through the reducer.
     *
     */
    selectValue: (value: TabValue, event: Event | SyntheticEvent) => void;
    /**
     * Specifies the function that marks a tab as focused (or clears focus with `null`) without changing selection.
     *
     */
    setFocused: (value: TabValue | null) => void;
    /**
     * Specifies the function that scrolls the DOM node for `value` into view; a no-op when unmounted.
     *
     */
    scrollToValue: (value: TabValue) => void;
}
