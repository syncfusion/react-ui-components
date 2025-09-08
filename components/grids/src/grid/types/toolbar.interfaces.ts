import { IToolbar } from '@syncfusion/react-navigations';

/**
 * Defines the event arguments triggered by toolbar click actions in the Grid component. Includes details about the clicked item, the originating event, and support for preventing default behavior. Used to process user interactions with toolbar commands and apply custom logic before execution.
 */
export interface ToolbarClickEvent {
    /**
     * Represents the toolbar item that was clicked, containing its unique identifier and display text.
     * Provides details about the specific toolbar button or control that triggered the event.
     * Enables identification and processing of the clicked item’s properties.
     *
     * @default null
     */
    item?: {
        /**
         * Specifies the unique identifier of the clicked toolbar item.
         * Used to distinguish the item within the toolbar for processing or conditional logic.
         * Matches the ID defined in the toolbar item configuration.
         *
         * @default -
         */
        id?: string;

        /**
         * Specifies the display text of the clicked toolbar item.
         * Reflects the visible label or text shown on the toolbar button or control.
         * Useful for identifying the item’s purpose or for UI feedback.
         *
         * @default -
         */
        text?: string;
    };

    /**
     * Contains the original browser event that triggered the toolbar click.
     * Provides access to native event properties, such as mouse coordinates or event type, for advanced handling.
     * Useful for custom event processing or interaction with the DOM.
     *
     * @default null
     */
    event?: Event;

    /**
     * Indicates whether the default toolbar action should be canceled. When props.cancel is set to true, the associated command is immediately prevented from executing.
     */
    cancel?: boolean;
}

/**
 * Defines methods and properties for managing toolbar behavior in the Grid.
 * Provides functionality to control toolbar rendering, item states, and click handling.
 * Used internally to encapsulate toolbar operations and state management.
 *
 * @private
 */
export interface ToolbarAPI {
    /**
     * Retrieves the DOM element of the toolbar in the grid.
     * Returns the HTMLElement representing the toolbar or null if not rendered.
     * Enables access to the toolbar for manipulation or inspection.
     *
     * @returns {HTMLElement | null} The toolbar element.
     */
    getToolbar: () => HTMLElement | null;

    /**
     * Enables or disables specified toolbar items based on their IDs.
     * Updates the interaction state of the items, affecting their appearance and functionality.
     * Useful for dynamically controlling toolbar item availability based on grid state.
     *
     * @param {string[]} items - Array of item IDs to enable or disable.
     * @param {boolean} isEnable - Whether to enable or disable the items.
     * @returns {void}
     */
    enableItems: (items: string[], isEnable: boolean) => void;

    /**
     * Refreshes the toolbar items to reflect the current grid state.
     * Updates the appearance and state of toolbar items, such as enabled or disabled status.
     * Ensures the toolbar UI remains consistent with grid actions or data changes.
     *
     * @returns {void}
     */
    refreshToolbarItems: () => void;

    /**
     * Processes click events on toolbar items to trigger associated actions.
     * Handles user interactions with the toolbar, passing event details for custom logic.
     * Updates the grid or toolbar state based on the clicked item.
     *
     * @param {ToolbarClickEvent} args - Click event arguments.
     * @returns {void}
     */
    handleToolbarClick: (args: ToolbarClickEvent) => void;

    /**
     * Indicates whether the toolbar has been rendered in the grid.
     * When true, confirms the toolbar is visible and functional; when false, indicates it is not rendered.
     * Used to check the toolbar’s availability for operations.
     *
     * @default false
     */
    isRendered: boolean;

    /**
     * Stores a set of IDs for currently active toolbar items.
     * Tracks which items are in an active or highlighted state, such as during user interaction.
     * Enables dynamic management of toolbar item states.
     *
     * @default new Set()
     */
    activeItems: Set<string>;

    /**
     * Stores a set of IDs for currently disabled toolbar items.
     * Tracks which items are disabled and non-interactive, reflecting their state in the UI.
     * Used to manage item availability during grid operations.
     *
     * @default new Set()
     */
    disabledItems: Set<string>;

    /**
     * References the toolbar component for accessing its internal methods and properties.
     * Provides a React ref object to interact with the toolbar’s underlying functionality.
     * Used internally for advanced toolbar control and integration.
     *
     * @default null
     */
    toolbarRef: React.RefObject<IToolbar>;
}

/**
 * Configures individual toolbar items for the Grid’s toolbar.
 * Defines properties for buttons or controls, such as ID, text, and behavior.
 * Used to customize the appearance and functionality of toolbar items.
 */
export interface ToolbarItemConfig {
    /**
     * Specifies a unique identifier for the toolbar item.
     * Used to distinguish the item within the toolbar for event handling or state management.
     * Ensures accurate targeting of specific items in the toolbar.
     *
     * @default -
     */
    id: string;

    /**
     * Specifies the display text for the toolbar item.
     * Represents the visible label shown on the button or control in the toolbar UI.
     * Enhances user understanding of the item’s purpose or action.
     *
     * @default -
     */
    text: string;

    /**
     * Defines an icon for the toolbar item, typically an SVG element for optimal rendering.
     * Enhances the visual representation of the item, complementing or replacing the text.
     * Used to improve the toolbar’s aesthetic and usability.
     *
     * @default null
     */
    icon?: React.ReactNode;

    /**
     * Determines whether the toolbar item is disabled and non-interactive.
     * When true, prevents user interaction with the item, visually indicating its disabled state.
     * Useful for controlling item availability based on grid context.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies a custom click handler function for the toolbar item.
     * Executes custom logic when the item is clicked, allowing tailored grid interactions.
     * Enables developers to define specific actions for toolbar controls.
     *
     * @default null
     */
    onClick?: () => void;

    /**
     * Specifies the tooltip text displayed when hovering over the toolbar item.
     * Provides additional context or description for the item’s purpose or functionality.
     * Enhances user experience by offering guidance on toolbar actions.
     *
     * @default -
     */
    title?: string;
}

/**
 * Configures the entire toolbar component for the Grid.
 * Defines settings for toolbar items, event handling, and styling.
 * Used internally to manage the toolbar’s setup and behavior.
 *
 * @private
 */
export interface ToolbarConfig {
    /**
     * Contains an array of toolbar item definitions or string identifiers for prebuilt items.
     * Specifies the collection of buttons or controls to display in the toolbar.
     * Enables customization of the toolbar’s content and layout.
     *
     * @default []
     */
    toolbar?: (string | ToolbarItemConfig)[];

    /**
     * Specifies a unique identifier for the grid to generate unique toolbar item IDs.
     * Ensures that toolbar item IDs are distinct across multiple grid instances.
     * Used internally to prevent ID conflicts in the toolbar.
     *
     * @default -
     */
    gridId?: string;

    /**
     * Defines an event handler for toolbar item click events.
     * Processes click events for all toolbar items, receiving detailed event arguments.
     * Allows custom logic to be executed based on user interactions with the toolbar.
     *
     * @default null
     */
    onToolbarItemClick?: (args: ToolbarClickEvent) => void;

    /**
     * References the ToolbarAPI instance for managing toolbar operations.
     * Provides access to methods and properties for controlling the toolbar’s behavior.
     * Used internally to integrate the toolbar with grid functionality.
     *
     * @default null
     */
    toolbarAPI?: ToolbarAPI;

    /**
     * Specifies a CSS class to apply to the toolbar for custom styling.
     * Allows customization of the toolbar’s appearance to match the application’s design.
     * Enhances the visual integration of the toolbar with the grid.
     *
     * @default -
     */
    className?: string;
}

/**
 * Defines the internal configuration for toolbar items in the Grid.
 * Specifies detailed properties for rendering and managing toolbar buttons or controls.
 * Used internally to handle advanced toolbar item settings.
 *
 * @private
 */
export interface ToolbarItem {
    /**
     * Specifies the unique identifier for the toolbar item.
     * Used to associate the item with its button or input element in the toolbar.
     * Ensures accurate targeting for event handling and state management.
     *
     * @default -
     */
    id?: string;

    /**
     * Specifies the display text for the toolbar button or control.
     * Represents the visible label shown in the toolbar UI to indicate the item’s purpose.
     * Enhances user understanding and interaction with the toolbar.
     *
     * @default -
     */
    text?: string;

    /**
     * Defines the width of the toolbar button or command, in pixels or as a string.
     * Controls the visual size of the item, ensuring proper layout in the toolbar.
     * Set to 'auto' to adapt to content or available space.
     *
     * @default 'auto'
     */
    width?: number | string;

    /**
     * Determines whether the item is displayed in normal or overflow mode.
     * Supports 'Show' for always visible or 'Hide' for overflow menu placement when space is limited.
     * Manages toolbar item visibility in constrained layouts.
     *
     * @default 'Show'
     */
    overflow?: 'Show' | 'Hide';

    /**
     * Specifies the alignment of the toolbar item within the toolbar.
     * Supports 'Left', 'Center', or 'Right' to position the item in the toolbar layout.
     * Controls the visual arrangement of items for better organization.
     *
     * @default 'Left'
     */
    align?: 'Left' | 'Center' | 'Right';

    /**
     * Specifies the type of toolbar command to render, such as button, separator, or input.
     * Determines the item’s role and rendering style in the toolbar.
     * Affects how the item is displayed and interacted.
     *
     * @default 'Button'
     */
    type?: 'Button' | 'Separator' | 'Input';

    /**
     * Defines a custom template for the toolbar item, as a string or function.
     * Allows rendering custom HTML or React components instead of the default button or control.
     * Enables advanced customization of the item’s appearance and behavior.
     *
     * @default null
     */
    template?: string | Function;

    /**
     * Specifies the tooltip text displayed when hovering over the toolbar item.
     * Provides additional context or description for the item’s functionality.
     * Enhances user experience by offering guidance on toolbar actions.
     *
     * @default -
     */
    tooltipText?: string;

    /**
     * Defines an icon for the toolbar item, typically an SVG element for optimal rendering.
     * Enhances the visual representation of the item, complementing or replacing the text.
     * Improves the toolbar’s aesthetic and usability.
     *
     * @default null
     */
    icon?: React.ReactNode;

    /**
     * Determines whether the toolbar item is disabled and non-interactive.
     * When true, prevents user interaction and visually indicates the disabled state.
     * Useful for controlling item availability based on grid context.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Determines whether the toolbar item is visible in the UI.
     * When false, hides the item from the toolbar, preventing display and interaction.
     * Allows dynamic control of item visibility based on application state.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Specifies the tab order for the toolbar item in keyboard navigation.
     * Defines the sequence in which the item is focused when using the Tab key.
     * Enhances accessibility by controlling focus order in the toolbar.
     *
     * @default 0
     */
    tabIndex?: number;

    /**
     * Specifies additional HTML attributes to apply to the toolbar item’s element.
     * Allows customization of the item’s DOM properties, such as data attributes or ARIA labels.
     * Enhances flexibility for styling or accessibility requirements.
     *
     * @default {}
     */
    htmlAttributes?: { [key: string]: string | number | boolean | undefined };
}
