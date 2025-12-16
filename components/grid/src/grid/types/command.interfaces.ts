import { Button } from '@syncfusion/react-buttons';
import * as React from 'react';
import { CommandItemType } from './enum';
import { ColumnProps } from './column.interfaces';
import { IRow } from './interfaces';
import { RefObject } from 'react';
import { InlineEditFormRef } from './edit.interfaces';

/**
 * Defines the properties for configuring individual command items (buttons) in a command column.
 * Specifies command item type, styling, and rendering options for action buttons in grid rows.
 * Used to customize command buttons like Edit, Delete, Save, and Cancel for CRUD operations.
 */
export interface CommandItemProps {
    /**
     * Specifies the type of command button. Supported types are `Edit`, `Delete`, `Update`, and `Cancel`.
     * If no type is defined in the command column directive, the item is treated as a custom command button container, allowing you to render and return a custom component instead of the default button.
     *
     * @type {CommandItemType}
     * @default undefined
     */
    type?: CommandItemType;

    /**
     * Provides custom properties to the Syncfusion `Button` component rendered as a command item.
     * Allows customization of button appearance, styling, and behavior through standard `Button` component props.
     *
     * @type {React.ComponentProps<typeof Button>}
     * @default undefined
     */
    buttonProps?: React.ComponentProps<typeof Button>;

    /**
     * Allows rendering custom child elements (ReactNode) instead of built-in command buttons.
     * Enables complete customization of command cell content with custom components or HTML elements.
     *
     * @type {React.ReactNode}
     * @default undefined
     */
    children?: React.ReactNode;
}

/**
 * Defines the event arguments passed to command item callback functions.
 * Provides context information about the current row and column when a command action occurs.
 */
export interface CommandItemEvent {
    /**
     * Contains the column configuration object for the command column.
     * Provides metadata such as field name, header text, and other column properties.
     *
     * @type {ColumnProps}
     * @default -
     */
    column: ColumnProps;

    /**
     * Contains the complete data object for the current row being rendered.
     * Provides access to all field values in the row for context-aware command generation.
     * Useful for conditional command display based on row data (e.g., hiding Edit button if record is locked).
     *
     * @type {Object}
     * @default -
     */
    data: Object;
}

/**
 * Used to configure command column behavior and customize available command items.
 */
export interface CommandColumnProps {
    /**
     * Callback function that returns command item buttons for each row in the grid.
     * Receives the current row's data and column configuration to determine which commands to display.
     *
     * @param {CommandItemEvent} event - Contains column configuration and row data for determining commands
     * @returns {React.ReactElement<CommandItemProps>[]} Array of CommandItem elements to display in the cell
     *
     * @default undefined
     */
    getCommandItems?: (event: CommandItemEvent) => React.ReactElement<CommandItemProps>[];
}

/**
 * Defines the base interface for the CommandColumn component structure.
 * Provides the essential data and configuration needed for rendering command buttons in a grid row.
 * Used internally by the CommandColumnBase component to render row-specific command items.
 *
 * @private
 */
export interface ICommandColumnBase {
    /**
     * Contains the command column's configuration and settings.
     * Includes properties such as field, headerText, getCommandItems callback, and other column metadata.
     * Used to determine which command items to display and how to configure them.
     *
     * @type {ColumnProps}
     * @default -
     */
    column: ColumnProps;

    /**
     * Represents the current grid row for which command items are being rendered.
     * Provides access to row data, row index, and row state information.
     * Used to pass context to the getCommandItems callback and determine row-specific command availability.
     *
     * @type {IRow<ColumnProps>}
     * @default -
     */
    row: IRow<ColumnProps>;
}

/**
 * Defines the return type and structure for the useCommandColumn custom React hook.
 * Provides state management references for tracking command column edit operations and inline form states.
 * Used to manage the editing state of rows and form references for validation and submission.
 *
 * @private
 */
export interface UseCommandColumnResult {
    /**
     * Reference tracking whether any command column row is currently in edit mode.
     * Boolean flag indicating the overall edit state of the command column.
     * Used to determine if the grid is actively editing any row and to enable/disable certain grid features.
     *
     * @type {RefObject<boolean>}
     * @default false
     */
    commandEdit: RefObject<boolean>;

    /**
     * Reference object mapping row unique identifiers (UIDs) to their individual edit state.
     * Tracks which specific rows are currently in edit mode, enabling row-level edit state detection.
     * Used to determine appropriate command items to display (Edit/Delete vs Save/Cancel).
     *
     * @type {RefObject<{ [key: string]: boolean; }>}
     * @default {}
     */
    commandEditRef: RefObject<{ [key: string]: boolean; }>;

    /**
     * Reference array containing newly added rows that are in edit mode.
     * Tracks rows created with the add new row feature but not yet saved to the grid.
     * Used to distinguish new rows from existing rows and apply appropriate UI/commands.
     *
     * @type {RefObject<IRow<ColumnProps>[]>}
     * @default []
     */
    commandAddRef: RefObject<IRow<ColumnProps>[]>;

    /**
     * Reference object mapping row UIDs to inline edit form component references for existing rows.
     * Provides direct access to edit form components for rows being edited (not newly added).
     * Used for form validation, field focus management, and data submission handling.
     *
     * @type {RefObject<{ [key: string]: RefObject<InlineEditFormRef>; }>}
     * @default {}
     */
    commandEditInlineFormRef: RefObject<{ [key: string]: RefObject<InlineEditFormRef>; }>;

    /**
     * Reference object mapping row UIDs to inline edit form component references for newly added rows.
     * Provides direct access to add form components for rows created with the add new row feature.
     * Used for form validation, field focus management, and new record submission handling.
     * Distinguished from commandEditInlineFormRef to support different form behaviors for new vs existing records.
     *
     * @type {RefObject<{ [key: string]: RefObject<InlineEditFormRef>; }>}
     * @default {}
     */
    commandAddInlineFormRef: RefObject<{ [key: string]: RefObject<InlineEditFormRef>; }>;
}
