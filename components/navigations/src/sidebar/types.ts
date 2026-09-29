import type { ButtonHTMLAttributes, HTMLAttributes, RefObject, SyntheticEvent } from 'react';

/**
 * Specifies the Sidebar placement within the container.
 *
 * - `Left` - Displays the Sidebar on the left side of the container.
 * - `Right` - Displays the Sidebar on the right side of the container.
 */
export type SidebarPosition = 'Left' | 'Right';

/**
 * Specifies the Sidebar display behavior when opened.
 *
 * - `Over` - Shows the Sidebar over the content without affecting the layout.
 * - `Push` - Pushes the content to make space for the Sidebar.
 */
export type SidebarMode = 'Over' | 'Push';

/**
 * Specifies the duration of the sidebar transition animation in milliseconds.
 */
export interface SidebarTransition {
    /**
     * Specifies the duration of the enter/open transition in milliseconds.
     *
     * @default 300
     */
    enter?: number;

    /**
     * Specifies the duration of the exit/close transition in milliseconds.
     *
     * @default 300
     */
    exit?: number;
}

/**
 * Specifies the optional anchor, presentation, and timing configuration.
 *
 * @private
 */
export interface SidebarBaseProps {
    /**
     * Specifies the edge the Sidebar anchors to.
     *
     * @default 'Left'
     */
    position?: SidebarPosition;

    /**
     * Specifies how the Sidebar interacts with the surrounding content.
     *
     * @default 'Push'
     */
    mode?: SidebarMode;

    /**
     * Specifies whether to render a backdrop overlay when the sidebar is open.
     *
     * @default false
     */
    backdrop?: boolean;

    /**
     * Specifies the duration of the sidebar transition animation in milliseconds.
     *
     * @default { enter: 300, exit: 300 }
     */
    transition?: SidebarTransition;

    /**
     * Specifies whether the sidebar can collapse into a compact docked state
     * while remaining visible.
     *
     * @default false
     */
    dockable?: boolean;

    /**
     * Specifies the width of the sidebar when dockable mode is enabled and
     * the sidebar is in its docked state.
     *
     * @default '48px'
     */
    dockableWidth?: string;

    /**
     * Specifies the media query used to automatically control the sidebar's
     * responsive open and closed state.
     *
     * @default -
     */
    mediaQuery?: string;
}

/**
 * Specifies the select event arguments when the sidebar's open state changes.
 */
export interface SidebarChangeEvent {
    /**
     * Specifies the next open state of the sidebar.
     */
    open: boolean;

    /**
     * Specifies the React synthetic event triggered by the user interaction.
     *
     * @default -
     */
    event?: SyntheticEvent | Event;
}

/**
 * Specifies the Sidebar component props.
 *
 * @private
 */
export interface SidebarProps extends SidebarBaseProps {
    /**
     * Specifies the controlled visibility.
     *
     * @default -
     */
    open?: boolean;

    /**
     * Specifies whether clicking outside closes the sidebar.
     *
     * @default true
     */
    closeOnDocumentClick?: boolean;

    /**
     * Specifies the initial visibility of the Sidebar in uncontrolled mode.
     *
     * @default false
     */
    defaultOpen?: boolean;

    /**
     * Specifies the callback triggered when the sidebar's `open` state changes.
     *
     * @event onOpenChange
     */
    onOpenChange?: (event: SidebarChangeEvent) => void;

    /**
     * Specifies whether to suppress the default theme styling.
     *
     * @private
     * @default false
     */
    unstyled?: boolean;
}

/**
 * Specifies the input props for the useSidebar hook.
 *
 * @private
 */
export type UseSidebarProps = SidebarProps & Omit<HTMLAttributes<HTMLDivElement>, keyof SidebarProps> & {
    rootRef?: RefObject<HTMLDivElement|null>;
};

/**
 * Specifies the resolved, read-only state returned by useSidebar.
 *
 * @private
 */
export interface UseSidebarState extends Required<SidebarBaseProps> {
    /**
     * Specifies the resolved visibility.
     */
    open: boolean;

    /**
     * Specifies the resolved width used by the Sidebar layout.
     */
    width?: string | number;
}

/**
 * Specifies the return value of the `useSidebar()` hook.
 *
 * @private
 */
export type UseSidebarReturn = {
    /**
     * Specifies the current sidebar state.
     */
    state: UseSidebarState;

    /**
     * Specifies the props to spread onto the root container.
     */
    rootProps: HTMLAttributes<HTMLDivElement>;

    /**
     * Specifies the props to spread onto the trigger element.
     */
    triggerProps: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>;

    /**
     * Specifies the props to spread onto the backdrop element.
     */
    backdropProps: HTMLAttributes<HTMLDivElement>;

    /**
     * Specifies the props to spread onto a close button inside the consumer's children.
     */
    closeProps: ButtonHTMLAttributes<HTMLButtonElement>;

    /**
     * Specifies the props to spread onto the main container.
     */
    mainProps: HTMLAttributes<HTMLElement>;
};

