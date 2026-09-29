import { ReactNode } from 'react';

/**
 * Identifies a built-in or consumer-defined sidebar panel.
 */
export type SideBarPanelId = 'columns' | 'filters' | 'editing' | string;

/**
 * Describes the panel content supplied by a grid sidebar module.
 */
export interface SideBarPanelContent<T = unknown> {
    /**
     * Renders the panel content for the current grid instance.
     */
    render?: (context: SideBarPanelContext<T>) => ReactNode;

    /**
     * Static React content for a custom panel.
     */
    content?: ReactNode;
}

/**
 * Context supplied to sidebar panel content renderers.
 */
export interface SideBarPanelContext<T = unknown> {
    /**
     * The grid row data type.
     */
    rowData?: T[];

    /**
     * The panel identifier currently being rendered.
     */
    panelId: string;
}

/**
 * Defines the injectable contract for a built-in sidebar panel module.
 */
export type SideBarToolPanelModule<T = unknown> = () => SideBarPanelContent<T>;

/**
 * Defines one panel displayed in the grid sidebar.
 */
export interface SideBarToolPanel<T = unknown> {
    /**
     * Stable identifier used to select the panel.
     */
    id: SideBarPanelId;

    /**
     * Text displayed beside or within the panel control.
     */
    label?: string;

    /**
     * Identifies the built-in panel behavior.
     */
    type?: 'columns' | 'filters' | 'editing' | 'custom';

    /**
     * Custom or module-provided panel content.
     */
    content?: SideBarPanelContent<T>;
}

/**
 * Configures the grid sidebar and its panel collection.
 */
export interface SideBarDef<T = unknown> {
    /**
     * Enables or disables the sidebar.
     *
     * @default true
     */
    enabled?: boolean;

    /**
     * Panels displayed in the sidebar rail.
     */
    toolPanels?: Array<SideBarToolPanel<T> | SideBarPanelId>;

    /**
     * Panel selected when the sidebar first opens.
     */
    defaultToolPanel?: string;

    /**
     * Opens the first tool panel when the sidebar initializes.
     *
     * @default false
     */
    openByDefault?: boolean;

    /**
     * Places the sidebar on the left or right side of the grid.
     */
    position?: 'left' | 'right';

    /**
     * Hides the sidebar rail controls while retaining the panel host.
     */
    hideButtons?: boolean;
}

/**
 * Public sidebar configuration accepted by the Grid component.
 */
export type SideBar<T = unknown> = SideBarDef<T>;
