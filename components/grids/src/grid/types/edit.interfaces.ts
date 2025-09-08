import { RefObject, ComponentType } from 'react';
import { ColumnProps } from '../types/column.interfaces';
import { useEdit } from '../hooks';
import { IFormValidator } from '@syncfusion/react-inputs';
import { ITextBox, TextBoxProps, FormState } from '@syncfusion/react-inputs';
import { INumericTextBox, NumericTextBoxProps } from '@syncfusion/react-inputs';
import { ICheckbox, CheckboxProps } from '@syncfusion/react-buttons';
import { IDatePicker, DatePickerProps } from '@syncfusion/react-calendars';
import { IDropDownList, DropDownListProps } from '@syncfusion/react-dropdowns';
import { EditType } from '../types/enum';
import { ValueType } from './';

/**
 * Edit mode enumeration for Grid edit modes.
 *
 * @private
 */
export type EditMode = 'Normal';

/**
 * Represents the configuration options for enabling and customizing editing behavior in a grid component.
 *
 * This interface provides control over record-level operations such as adding, editing, and deleting,
 * as well as customization of edit modes, confirmation dialogs, and integration of custom templates.
 */
export interface EditSettings {
    /**
     * Determines whether new records can be added to the grid.
     *
     * When this property is set to true, new rows can be inserted either through programmatic methods
     * or by using toolbar 'Add' action. To enable this functionality, at least one column must be defined
     * as a primary key using the isPrimaryKey property in the column configuration.
     *
     * @default false
     */
    allowAdd?: boolean;

    /**
     * Determines whether existing records in the grid can be edited.
     *
     * When this property is set to true, users can modify cell values in existing rows either through
     * programmatic updates or via toolbar 'Edit' interaction. Editing requires that at least one column
     * is marked as a primary key using the isPrimaryKey property.
     *
     * @default false
     */
    allowEdit?: boolean;

    /**
     * Determines whether records can be deleted from the grid.
     *
     * When this property is enabled, rows can be removed either programmatically or through toolbar 'Delete' action.
     * Deletion operations require that at least one column is configured as a primary key.
     *
     * @default false
     */
    allowDelete?: boolean;

    /**
     * Specifies the editing mode used within the grid.
     *
     * The editing mode defines how users interact with editable cells.
     *
     * Supported mode include:
     * - Normal: Allows inline editing directly within grid cells.
     *
     * @default 'Normal'
     * @private
     */
    mode?: EditMode;

    /**
     * Indicates whether double-clicking a row should activate edit mode in the Grid.
     *
     * When set to true, users can initiate editing by double-clicking a row.
     * If set to false, double-click interactions will not trigger edit mode.
     * This property is useful for controlling interaction behavior in editable grids.
     *
     * @default true
     */
    editOnDoubleClick?: boolean;

    /**
     * Controls whether a confirmation dialog is displayed when saving or discarding changes.
     *
     * When enabled, the grid prompts users to confirm actions such as saving edits, cancelling changes,
     * or navigating away from an edited row. If disabled, these actions proceed without confirmation.
     *
     * @default true
     */
    confirmOnEdit?: boolean;

    /**
     * Controls whether a confirmation dialog is displayed before deleting a record.
     *
     * When enabled, users are prompted to confirm the deletion action to prevent accidental data loss.
     * If disabled, records are deleted immediately without confirmation.
     *
     * @default false
     */
    confirmOnDelete?: boolean;

    /**
     * Determines whether the grid should automatically display a persistent "Add New Row" form when initialized.
     *
     * When this property is enabled, the grid enters an edit state by default, allowing to add new records
     * without interacting with an explicit add toolbar button. This feature requires that allowAdd is set to true.
     *
     * @default false
     * @private
     */
    showAddNewRow?: boolean;

    /**
     * Specifies a custom React component to be used as the edit template for grid rows.
     *
     * This component replaces the default editing interface and receives the current row data as props.
     * It can be used to implement advanced form layouts, validation logic, or third-party integrations.
     *
     * @default null
     */
    template?: React.ComponentType<string | number | boolean | Record<string, unknown> | Date>;

    /**
     * Specifies the position at which a new row is inserted into the grid.
     *
     * Supported values include:
     * - Top: Inserts the new row at the beginning of the grid.
     * - Bottom: Inserts the new row at the end of the grid.
     *
     * @default 'Top'
     */
    newRowPosition?: 'Top' | 'Bottom';
}

/**
 * Edit state interface for managing edit operations
 *
 * @private
 */
export interface EditState {
    isEdit: boolean;
    editRowIndex: number;
    editCellField: string | null;
    editData: Object;
    originalData: Record<string, string | number | boolean | Object | Date> | Object;
    validationErrors: { [field: string]: string };
    showAddNewRowData: Record<string, ValueType | null>; // Data for the persistent add new row
    isShowAddNewRowActive: boolean; // Whether the add new row is currently active
    isShowAddNewRowDisabled: boolean; // Whether the add new row inputs should be disabled (but still visible)
}

/**
 * Interface for the useEdit hook return type
 *
 * @private
 */
export interface UseEditResult {
    isEdit: boolean;
    editSettings: EditSettings;
    editRowIndex: number;
    editData: Object;
    validationErrors: { [field: string]: string };
    originalData: Record<string, string | number | boolean | Date> | Object;
    showAddNewRowData: Record<string, unknown>;
    isShowAddNewRowActive: boolean;
    isShowAddNewRowDisabled: boolean;
    editRow: (rowElement?: HTMLTableRowElement) => Promise<void>;
    saveChanges: () => Promise<boolean>;
    cancelChanges: () => Promise<void>;
    addRecord: (data?: Object | null, index?: number) => void;
    deleteRecord: (fieldName?: string, data?: ValueType | null) => Promise<void>;
    updateRow: (index: number, data: Object) => void;
    validateEditForm: () => boolean;
    validateField: (field: string) => boolean;
    updateEditData: (field: string, value: ValueType | null) => void;
    getCurrentEditData: () => ValueType | null;
    handleGridClick: (event: React.MouseEvent) => void;
    handleGridDoubleClick: (event: React.MouseEvent, rowElement?: HTMLTableRowElement) => void;
    checkUnsavedChanges: () => Promise<boolean>;
    // Dialog state and methods for confirmation dialogs
    isDialogOpen: boolean;
    dialogConfig: ConfirmDialogConfig;
    onDialogConfirm: (() => void) | null;
    onDialogCancel: (() => void) | null;
    nextPrevEditRowInfo: RefObject<KeyboardEvent>;
    focusLastField: RefObject<boolean>;
    escEnterIndex: RefObject<number>;
}

/**
 * Type definition for edit strategy module that represents the return type of the useEdit hook.
 *
 * @private
 */
export type editModule = ReturnType<typeof useEdit>;

/**
 * Props interface for custom edit template components used in grid.
 *
 * This interface defines the structure of data and callbacks passed to a custom
 * React component used for editing grid rows.
 */
export interface EditTemplateProps {
    /**
     * The initial value for the field being edited.
     *
     * This value is typically used to populate the input control within the template.
     *
     * @default -
     */
    defaultValue: ValueType;

    /**
     * Configuration object for the current column being edited.
     *
     * Includes metadata such as field name, data type, validation rules, and display settings.
     *
     * @default -
     */
    column: ColumnProps;

    /**
     * Complete data object for the row currently being edited.
     *
     * Useful for accessing other field values or performing conditional logic within the template.
     *
     * @default -
     */
    rowData: Object | Record<string, ValueType>;

    /**
     * Validation error message associated with the current field.
     *
     * If present, this message should be displayed to the user to indicate input issues.
     *
     * @private
     * @default -
     */
    error: string;

    /**
     * Specifies the current editing context in which the template is being rendered.
     *
     * This property indicates whether the template is used for adding a new record or editing an existing one.
     * It helps differentiate between create and update operations, allowing conditional rendering or logic
     * based on the editing mode.
     *
     * Supported values:
     * - Add: The template is used to create a new record.
     * - Edit: The template is used to modify an existing record.
     *
     * @default -
     */
    action: 'Add' | 'Edit';

    /**
     * Callback function triggered when the field value changes.
     *
     * @param value - The updated value from the input control.
     * @returns void
     */
    onChange(value: ValueType): void;
}

/**
 * Represents the event triggered when a form is initialized for editing or adding a row.
 *
 * This interface provides access to the form validator and the associated row data,
 * allowing configuration of validation logic and dynamic form behavior during rendering.
 */
export interface FormRenderEvent {
    /**
     * Holds a reference to the form validator instance used for validating input fields.
     *
     * Enables access to validation methods and state, allowing programmatic control
     * over form validation during initialization or interaction.
     *
     * @default null
     */
    formRef?: RefObject<IFormValidator>;

    /**
     * Specifies the index of the row for which the form is rendered.
     *
     * Identifies the row's position in the grid's data source, supporting both
     * edit and insert operations within the grid component.
     *
     * @default -
     */
    rowIndex?: number;

    /**
     * Contains the complete data object for the row being edited or added.
     *
     * Provides access to field values required for conditional rendering,
     * dynamic validation, or logic execution during form setup.
     *
     * @default -
     */
    rowData?: Object;
}


/**
 * Event structure triggered during a row edit operation.
 *
 * This interface allows access to the row data and index, and supports cancellation
 * of the edit operation based on custom conditions.
 */
export interface RowEditEvent {
    /**
     * Data object containing the current values of the row being edited.
     *
     * @default -
     */
    rowData?: Object;

    /**
     * Index of the row being edited in the grid's data source.
     *
     * @default -
     */
    rowIndex?: number;

    /**
     * Flag indicating whether to cancel the edit operation.
     *
     * Set to true to prevent the row from entering edit mode.
     *
     * @default false
     */
    cancel?: boolean;
}

/**
 * Describes the structure of the event triggered during a row add operation in the grid.
 *
 * Provides access to the new row's data and index, and supports conditional cancellation
 * of the insertion process based on custom logic or validation requirements.
 */
export interface RowAddEvent {
    /**
     * The initial data object for the row being added.
     *
     * Represents the field values intended for insertion, allowing transformation,
     * validation, or enrichment prior to committing the row to the grid.
     *
     * @default -
     */
    rowData?: Object;

    /**
     * The zero-based index at which the new row will be inserted in the grid's data source.
     *
     * Indicates the target position for the new entry, which can be used to determine
     * placement logic or enforce ordering constraints.
     *
     * @default -
     */
    rowIndex?: number;

    /**
     * Indicates whether the add operation should be canceled.
     *
     * When set to true, the row insertion is prevented, allowing conditional control
     * over grid updates based on business rules or validation outcomes.
     *
     * @default false
     */
    cancel?: boolean;
}

/**
 * Event triggered at the start of a delete operation.
 *
 * It provides access to the records targeted for deletion and
 * supports cancellation of the operation based on custom logic.
 */
export interface DeleteEvent {
    /**
     * Array of record objects that are about to be deleted from the grid.
     *
     * Each object represents a row in the grid's data source.
     *
     * @default -
     */
    data?: Object[];

    /**
     * Specifies whether to cancel the delete operation.
     * If true, the deletion is aborted and no changes are made.
     *
     * @default false
     */
    cancel?: boolean;

    /**
     * Specifies the type of action being performed, such as add, edit, or delete.
     *
     * @default -
     */
    action?: string;
}

/**
 * Event triggered at the start of a save operation.
 *
 * It provides access to the current and previous row data,
 * and supports cancellation of the save based on validation or business rules.
 */
export interface SaveEvent {
    /**
     * Data object containing the latest values for the row being saved.
     *
     * Includes all fields that were edited or added.
     *
     * @default -
     */
    editedRowData?: Object;

    /**
     * Index of the row being saved within the grid's data source.
     *
     * Useful for identifying the row position during update operations.
     *
     * @default -
     */
    rowIndex?: number;

    /**
     * Original data of the row before any modifications were made.
     *
     * Useful for comparing changes or reverting edits.
     *
     * @default -
     */
    rowData?: Object;

    /**
     * Flag indicating whether to cancel the save operation.
     *
     * Set to true to prevent the row from being saved.
     *
     * @default false
     */
    cancel?: boolean;

    /**
     * Specifies the type of action being performed, such as add, edit, or delete.
     *
     * @default -
     */
    action?: string;
}

/**
 * Event triggered when an edit or add form is cancelled.
 *
 * It provides access to the form state and row context,
 * allowing cleanup or rollback logic to be executed.
 */
export interface CancelFormEvent {
    /**
     * Data object containing the current form state for the row.
     *
     * Includes field values at the time of cancellation.
     *
     * @default -
     */
    rowData?: Object;

    /**
     * Index of the row being edited or added in the grid's data source.
     *
     * @default -
     */
    rowIndex?: number;

    /**
     * Reference to the form component used for editing or adding the row.
     *
     * Can be used to reset validation or perform cleanup actions.
     *
     * @default -
     */
    formRef?: RefObject<IFormValidator>;
}

/**
 * Union type for all possible component ref types that EditCell can handle
 *
 * @private
 */
export type EditCellInputRef = HTMLInputElement | HTMLSelectElement | ITextBox | INumericTextBox | ICheckbox | IDatePicker | IDropDownList;

/**
 * Union type for edit component parameters that combines all possible props from different edit input components.
 *
 * @private
 */
export type EditParams = Partial<TextBoxProps & NumericTextBoxProps & CheckboxProps & DatePickerProps & DropDownListProps>;

/**
 * Configuration interface for column-level edit settings in the grid.
 *
 * Defines the type of input component to render during editing and allows
 * passing component-specific configuration parameters.
 */
export interface ColumnEditConfig {
    /**
     * Specifies the type of edit component to be rendered for the column.
     *
     * Determines the input control used during editing, such as a textbox, dropdown,
     * date picker, or checkbox. Custom string identifiers may also be used for
     * custom edit components.
     *
     * @default EditType.TextBox | 'stringEdit'
     */
    type?: EditType | string;

    /**
     * Configuration parameters passed to the edit component.
     *
     * These parameters vary depending on the selected edit type and may include
     * properties such as placeholder text, formatting options,
     * and dropdown data sources.
     *
     * Supports partial props from multiple component types including:
     * TextBoxProps, `NumericTextBoxProps`, `CheckboxProps`, `DatePickerProps`, and `DropDownListProps`.
     *
     * @default -
     */
    params?: Partial<TextBoxProps & NumericTextBoxProps & CheckboxProps & DatePickerProps & DropDownListProps>;
}

/**
 * Props interface for EditCell component
 *
 * @private
 */
export interface EditCellProps {
    /**
     * Column configuration object containing properties and settings for the current column being edited.
     *
     * @default -
     */
    column: ColumnProps;

    /**
     * The current value of the cell being edited.
     *
     * @defaut -
     */
    value: string | number | boolean | Object | undefined;

    /**
     * The complete data object for the current row, providing context for the edit operation.
     *
     * @default -
     */
    rowData: Object;

    /**
     * Validation error message to display for the current cell, if any validation fails.
     *
     * @default -
     */
    error?: string;

    /**
     * Specifies whether the input should automatically receive focus when the edit cell is rendered.
     *
     * @default false
     */
    autoFocus?: boolean;

    /**
     * Callback function triggered when the cell value changes during editing.
     *
     * @param value - The new value from the edit component
     * @returns {void}
     */
    onChange(value: unknown): void;

    /**
     * Callback function triggered when the input loses focus.
     *
     * @param value - The current value when focus is lost
     * @returns {void}
     */
    onBlur(value: string | number | boolean | Object | undefined): void;

    /**
     * Callback function triggered when the input gains focus.
     *
     * @returns {void}
     */
    onFocus(): void;

    /**
     * Internal property indicating whether this is an add operation rather than an edit operation.
     *
     * @default false
     */
    isAdd?: boolean;

    /**
     * Specifies whether the input should be disabled. Used for showAddNewRow feature when editing another row.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Form validation state object from the FormValidator component.
     *
     * @default null
     */
    formState?: FormState;
}

/**
 * Ref interface for EditCell component
 *
 * @private
 */
export interface EditCellRef {
    /**
     * Sets focus on the input element of the edit cell.
     *
     * @returns {void}
     */
    focus(): void;

    /**
     * Retrieves the current value from the edit cell input.
     *
     * @returns {ValueType | null} The current value of the edit cell
     */
    getValue(): ValueType | null;

    /**
     * Sets a new value for the edit cell input.
     *
     * @param value - The value to set in the edit cell
     * @returns {void}
     */
    setValue(value: ValueType | null): void;
}

/**
 * Props interface for EditForm component
 *
 * @private
 */
export interface EditFormProps {
    /**
     * Array of column configuration objects that define the structure and properties of the form fields.
     *
     * @default []
     */
    columns: ColumnProps[];

    /**
     * The current data object containing the values being edited in the form.
     *
     * @default {}
     */
    editData: Object;

    /**
     * Object containing validation error messages for each field, keyed by field name.
     *
     * @default {}
     */
    validationErrors: { [field: string]: string };

    /**
     * The index of the row being edited in the grid's data source.
     *
     * @default -
     */
    editRowIndex: number;

    /**
     * Unique identifier for the row being edited, used for tracking and validation purposes.
     *
     * @default -
     */
    rowUid: string;

    /**
     * Callback function triggered when a field value changes in the edit form.
     *
     * @param field - The field name that changed
     * @param value - The new value for the field
     * @returns {void}
     */
    onFieldChange?: (field: string, value: string | number | boolean | Record<string, unknown> | Date) => void;

    /**
     * Callback function triggered when the form should be saved.
     *
     * @param isForwardTab - Optional parameter indicating if save was triggered by tab navigation
     * @returns {void}
     */
    onSave?: (isForwardTab?: boolean) => void;

    /**
     * Callback function triggered when the form editing should be cancelled.
     *
     * @returns {void}
     */
    onCancel?: () => void;

    /**
     * Custom component to use as the edit template instead of the default form fields.
     *
     * @default null
     */
    template?: ComponentType<string | number | boolean | Record<string, unknown> | Date>;

    /**
     * Specifies whether the form inputs should be disabled. Used for showAddNewRow feature when editing an existing row.
     *
     * @default false
     */
    disabled?: boolean;
}

/**
 * Ref interface for EditForm component
 *
 * @private
 */
export interface InlineEditFormRef {
    /**
     * Sets focus on the first editable field in the form.
     *
     * @returns {void}
     */
    focusFirstField: () => void;

    /**
     * Validates all form fields and returns the validation result.
     *
     * @returns {boolean} True if validation passes, false otherwise
     */
    validateForm: () => boolean;

    /**
     * Retrieves an array of all edit cell references in the form.
     *
     * @returns {EditCellRef[]} Array of edit cell references
     */
    getEditCells: () => EditCellRef[];

    /**
     * Gets the HTML form element reference.
     *
     * @returns {HTMLFormElement | null} The form element or null if not available
     */
    getFormElement: () => HTMLFormElement | null;

    /**
     * Retrieves the current data from all form fields.
     *
     * @returns {string | number | boolean | Record<string, ValueType> | Date} The current form data
     */
    getCurrentData: () => string | number | boolean | Record<string, ValueType> | Date;

    /**
     * Reference object containing all edit cell refs organized by field name.
     *
     * @default {}
     */
    editCellRefs: React.RefObject<{ [field: string]: EditCellRef }>;

    /**
     * Current state of the form validation from FormValidator.
     *
     * @default null
     */
    formState: FormState;

    /**
     * Reference to the FormValidator instance for the form.
     *
     * @default null
     */
    formRef: React.RefObject<IFormValidator>;
}

/**
 * Props interface for InlineEditForm component
 *
 * @private
 */
export interface InlineEditFormProps extends EditFormProps {
    /**
     * Stable key used for React memoization to prevent unnecessary re-renders.
     *
     * @default -
     */
    stableKey: string;

    /**
     * Specifies whether the form inputs should be disabled. Used for showAddNewRow feature when editing an existing row.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Indicates whether this form is being used for an add operation rather than an edit operation.
     *
     * @default false
     */
    isAddOperation: boolean;
}

/**
 * Props interface for ConfirmDialog component
 *
 * @private
 */
export interface ConfirmDialogProps {
    /**
     * Specifies whether the confirmation dialog is currently open and visible.
     *
     * @default false
     */
    isOpen?: boolean;

    /**
     * Configuration object containing the dialog's content, buttons, and styling information.
     *
     * @default null
     */
    config?: ConfirmDialogConfig | null;

    /**
     * Callback function triggered when the confirm button is clicked.
     *
     * @returns {void}
     */
    onConfirm?: () => void;

    /**
     * Callback function triggered when the cancel button is clicked.
     *
     * @returns {void}
     */
    onCancel?: () => void;
}

/**
 * Props interface for ValidationTooltips component that displays validation errors using React Tooltip.
 * This component properly integrates with the FormValidator and displays validation errors.
 *
 * @private
 */
export interface ValidationTooltipsProps {
    /**
     * Current validation state from the FormValidator component containing error information.
     *
     * @default null
     */
    formState: FormState | null;

    /**
     * Reference object containing all edit cell refs organized by field name for tooltip positioning.
     *
     * @default null
     */
    editCellRefs?: React.RefObject<{ [field: string]: EditCellRef }>;
}

/**
 * Configuration interface for confirmation dialogs used in edit operations
 *
 * @private
 */
export interface ConfirmDialogConfig {
    /**
     * The title text displayed at the top of the confirmation dialog.
     *
     * @default -
     */
    title: string;

    /**
     * The main message content displayed in the dialog body.
     *
     * @default -
     */
    message: string;

    /**
     * Text displayed on the confirm button. If not specified, a default confirm text is used.
     *
     * @default 'Confirm'
     */
    confirmText?: string;

    /**
     * Text displayed on the cancel button. If not specified, a default cancel text is used.
     *
     * @default 'Cancel'
     */
    cancelText?: string;

    /**
     * The type of dialog which determines the styling, icons, and color scheme used.
     *
     * @default 'confirm'
     */
    type?: 'confirm' | 'delete' | 'warning' | 'info';
}

/**
 * State interface for managing confirmation dialog state
 *
 * @private
 */
export interface DialogState {
    /**
     * Indicates whether the dialog is currently open and visible.
     *
     * @default false
     */
    isOpen: boolean;

    /**
     * Configuration object for the dialog content and appearance.
     *
     * @default null
     */
    config: ConfirmDialogConfig | null;

    /**
     * Callback function to execute when the confirm button is clicked.
     *
     * @default null
     */
    onConfirm: (() => void) | null;

    /**
     * Callback function to execute when the cancel button is clicked.
     *
     * @default null
     */
    onCancel: (() => void) | null;
}

/**
 * Return interface for the useConfirmDialog hook
 *
 * @private
 */
export interface UseConfirmDialogResult {
    /**
     * Shows a confirmation dialog for delete operations.
     *
     * @returns {Promise<boolean>} Promise resolving to true if confirmed, false if cancelled
     */
    confirmOnDelete: () => Promise<boolean>;

    /**
     * Shows a confirmation dialog with custom configuration for edit operations.
     *
     * @param config - Configuration object for the dialog
     * @returns {Promise<boolean>} Promise resolving to true if confirmed, false if cancelled
     */
    confirmOnEdit: (config: ConfirmDialogConfig) => Promise<boolean>;

    /**
     * Indicates whether any confirmation dialog is currently open.
     *
     * @default false
     */
    isDialogOpen: boolean;

    /**
     * Current configuration of the open dialog, or null if no dialog is open.
     *
     * @default null
     */
    dialogConfig: ConfirmDialogConfig | null;

    /**
     * Handler function for when the user confirms the dialog action.
     *
     * @returns {void}
     */
    onDialogConfirm: () => void;

    /**
     * Handler function for when the user cancels the dialog action.
     *
     * @returns {void}
     */
    onDialogCancel: () => void;
}
