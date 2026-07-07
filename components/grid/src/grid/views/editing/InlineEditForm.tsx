import { memo, useRef, useEffect, useCallback, forwardRef, useMemo, useState, useImperativeHandle, CSSProperties, JSX, RefObject, RefAttributes, ForwardRefExoticComponent } from 'react';
import { Form, FormField, FormState, FormValueType, IFormValidator } from '@syncfusion/react-inputs';
import { EditCell, ValidationTooltips } from '../index';
import { EditCellRef, InlineEditFormProps, InlineEditFormRef, UseEditResult } from '../../types/edit.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { EditType, IValueFormatter, ValueType } from '../../types';
import { ColumnProps, IColumnBase } from '../../types/column.interfaces';
import { getObject } from '../../utils';
import { DataUtil } from '@syncfusion/react-data';
import { IL10n, isNullOrUndefined, isUndefined } from '@syncfusion/react-base';
import { Checkbox } from '@syncfusion/react-buttons';
import { CommandColumnBase } from '../../components/CommandColumn';
import { useFormValidationRules } from '../../hooks';

// CSS class name constants to avoid hardcoded strings
const CELL: string = 'sf-cell';
const GRID_EDIT_CELL: string = 'sf-grid-edit-cell';
const EDIT_DISABLED: string = 'sf-edit-disabled';
const LAST_ROW: string = 'sf-last-row';
const LAST_CELL: string = 'sf-last-cell';
const DISPLAY_NONE: string = 'sf-display-none';
const GRID_COMMAND_CELL: string = 'sf-grid-command-cell';
const GRID_CHECKSELECT: string = 'sf-grid-checkselect';
const GRID_CONTENT_ROW: string = 'sf-grid-content-row';
const GRID_ADD_ROW: string = 'sf-grid-add-row';
const GRID_EDIT_ROW: string = 'sf-grid-edit-row';
const EDIT_TEMPLATE_CONTAINER: string = 'sf-edit-template-container';
const GRID_EDIT_FORM: string = 'sf-grid-edit-form';
const GRID_EDIT_TABLE: string = 'sf-grid-edit-table';

/**
 * Initializes internal data for edit/add operations with default values.
 *
 * @private
 * @template T - Data row type
 * @param {boolean} isAddOperation - Indicates whether this is an add or edit operation
 * @param {T} editData - Existing data object for edit operations
 * @param {ColumnProps<T>[]} columns - Array of column definitions containing default values
 * @returns {T} Initialized data object with default values applied
 */
const internalDataFn: <T>(isAddOperation: boolean, editData: T, columns: ColumnProps<T>[]) => T =
    <T, >(isAddOperation: boolean, editData: T, columns: ColumnProps<T>[]): T => {
        if (isAddOperation && !(editData && Object.keys(editData).length)) {
            const addData: T = {} as T;
            columns.forEach((column: ColumnProps<T>) => {
                if (column.field && column.defaultValue !== undefined) {
                    if (column.type === 'string') {
                        addData[column.field] = typeof column.defaultValue === 'string'
                            ? column.defaultValue
                            : String(column.defaultValue);
                    } else {
                        addData[column.field] = column.defaultValue;
                    }
                }
            });
            return addData;
        } else {
            return editData ? { ...editData } : {} as T;
        }
    };

/**
 * Updates internal form data and notifies parent of field changes on user input.
 * Handles value formatting and complex nested field updates.
 *
 * @private
 * @template T - Data row type
 * @param {ColumnProps<T>} column - Column configuration containing field information
 * @param {ValueType} value - New field value from user input
 * @param {IValueFormatter} formatter - Formatter service for converting view values to data values
 * @param {T} internalData - Current internal form data object
 * @param {Function} setInternalData - State setter for updating internal data
 * @param {FormState} formState - Current form validation state
 * @param {Function} stableOnFieldChange - Stable callback reference to notify field changes
 * @returns {void}
 */
const handleFieldChangeFn: <T>(column: ColumnProps<T>, value: ValueType, formatter: IValueFormatter, internalData: T,
    setInternalData: (value: React.SetStateAction<T>) => void, formState: FormState,
    stableOnFieldChange: (field: string, value: ValueType | null) => void) => void =
    <T, >(column: ColumnProps<T>, value: ValueType, formatter: IValueFormatter, internalData: T,
        setInternalData: (value: React.SetStateAction<T>) => void, formState: FormState,
        stableOnFieldChange: (field: string, value: ValueType | null) => void) => {
        let formattedValue: ValueType = (column?.type === 'date' || column?.type === 'datetime' || column?.type === 'number') && typeof value === 'string' ?
            (formatter.fromView(value, (column as IColumnBase<T>)?.parseFn, column?.type)) : value;
        if ((column?.type === 'number' && isNaN(formattedValue as number)) ||
            ((column?.type === 'date' || column?.type === 'datetime') && isUndefined(formattedValue as string))) {
            formattedValue = '';
        }
        const topLevelKey: string = column.field.split('.')[0];
        const copiedComplexData: Object = column.field.includes('.') && typeof internalData[topLevelKey as string] === 'object'
            ? {
                ...internalData,
                [topLevelKey]: JSON.parse(JSON.stringify(internalData[topLevelKey as string]))
            }
            : { ...internalData };
        const editedData: T = DataUtil.setValue(column.field, formattedValue, copiedComplexData) as T;
        setInternalData({ ...editedData });
        if (!isNullOrUndefined(internalData[topLevelKey as string]) && typeof internalData[topLevelKey as string] === 'object'
            && !(internalData[topLevelKey as string] instanceof Date)) {
            formState?.onChange?.(topLevelKey, {
                value: {
                    ...editedData[topLevelKey as string],
                    [column.field.split('.')[1]]: value
                } as FormValueType
            });
        } else {
            formState?.onChange?.(column.field, { value: value as FormValueType });
        }
        stableOnFieldChange?.(column.field, formattedValue);
    };

/**
 * Validates field on blur and updates internal data for consistency.
 * Triggers FormValidator field validation based on operation type and form state.
 *
 * @private
 * @template T - Data row type
 * @param {ColumnProps<T>} column - Column configuration containing field information
 * @param {ValueType | Record<string, unknown>} value - Field value to validate
 * @param {IValueFormatter} formatter - Formatter service for converting view values to data values
 * @param {T} internalData - Current internal form data object
 * @param {Function} setInternalData - State setter for updating internal data
 * @param {boolean} isAddOperation - Indicates whether this is an add or edit operation
 * @param {UseEditResult<T>} editModule - Edit module containing edit settings and state
 * @param {FormState} formState - Current form validation state
 * @param {RefObject<IFormValidator>} formRef - Reference to FormValidator component
 * @returns {void}
 */
const handleFieldBlurFn: <T>(column: ColumnProps<T>, value: ValueType | Record<string, unknown>, formatter: IValueFormatter,
    internalData: T, setInternalData: (value: React.SetStateAction<T>) => void, isAddOperation: boolean, editModule: UseEditResult<T>,
    formState: FormState, formRef: RefObject<IFormValidator>) => void =
    <T, >(column: ColumnProps<T>, value: ValueType | Record<string, unknown>, formatter: IValueFormatter,
        internalData: T, setInternalData: (value: React.SetStateAction<T>) => void, isAddOperation: boolean, editModule: UseEditResult<T>,
        formState: FormState, formRef: RefObject<IFormValidator>) => {
        value = (column?.type === 'date' || column?.type === 'number') && typeof value === 'string' ?
            (formatter.fromView(value, (column as IColumnBase<T>)?.parseFn, column?.type)) : value;
        const topLevelKey: string = column.field.split('.')[0];
        const copiedComplexData: Object = column.field.includes('.') && typeof internalData[topLevelKey as string] === 'object'
            ? {
                ...internalData,
                [topLevelKey]: JSON.parse(JSON.stringify(internalData[topLevelKey as string]))
            }
            : { ...internalData };
        const editedData: T = DataUtil.setValue(column.field, value, copiedComplexData) as T;
        setInternalData({ ...editedData });
        if (!(isAddOperation && editModule.isShowAddNewRowActive) ||
            (isAddOperation && formState && formState.errors && Object.keys(formState.errors).length > 0)) {
            formState?.onBlur?.(column.field);
            formRef.current?.validateField?.(column.field);
        }
    };

/**
 * InlineEditForm component that prevents unnecessary re-renders during typing
 *
 * @param props - InlineEditForm component props
 * @param ref - Forward ref for imperative methods
 * @returns Memoized EditForm component
 */
export const InlineEditForm: ForwardRefExoticComponent<InlineEditFormProps<unknown> & RefAttributes<InlineEditFormRef<unknown>>> =
    memo(forwardRef(<T, >({
        editData,
        validationErrors,
        onFieldChange,
        onSave,
        onCancel,
        columns,
        editRowIndex,
        rowUid,
        template: CustomTemplate,
        disabled = false,
        isAddOperation,
        rowObject
    }: InlineEditFormProps<T>, ref: React.ForwardedRef<InlineEditFormRef<T>>) => {
        // Use refs to store stable callback references
        const onFieldChangeRef: React.RefObject<((field: string, value: ValueType | null) => void) |
        undefined> = useRef(onFieldChange);

        // Only update refs when callbacks actually change
        useEffect(() => {
            onFieldChangeRef.current = onFieldChange;
        }, [onFieldChange]);

        // Create stable callback wrappers that don't change on every render
        const stableOnFieldChange: (field: string, value: ValueType | null) => void =
            useCallback((field: string, value: ValueType | null): void => {
                // Use the current ref value to ensure we always have the latest callback
                onFieldChangeRef.current?.(field, value);
            }, []);

        const rowRef: RefObject<HTMLTableRowElement> = useRef<HTMLTableRowElement>(null);
        const formRef: React.RefObject<IFormValidator> = useRef<IFormValidator>(null);
        const editCellRefs: React.RefObject<{ [field in keyof T]?: EditCellRef }> = useRef<{ [field in keyof T]?: EditCellRef }>({});
        const { rowHeight, id, getVisibleColumns, serviceLocator, editModule, contentPanelRef, contentTableRef,
            height, scrollModule, contentScrollRef } = useGridComputedProvider<T>();
        const { colElements: ColElements, cssClass, focusModule, commandColumnModule, offsetX, virtualSettings, columnOffsets,
            totalRecordsCount } = useGridMutableProvider<T>();
        const { commandEdit, commandEditInlineFormRef } = commandColumnModule;
        const formatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>('valueFormatter');
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');

        /**
         * Internal data state that's isolated from grid until save
         */
        const [internalData, setInternalData] = useState<T>(internalDataFn(isAddOperation, editData, columns));

        const isLastRow: boolean = useMemo(() => {
            return height !== 'auto' && ((editModule?.editSettings?.newRowPosition === 'Bottom' && isAddOperation) ||
                (!isAddOperation && rowUid === contentTableRef?.rows?.[contentTableRef?.rows?.length - 1].getAttribute('data-uid'))) &&
                (contentPanelRef?.firstElementChild as HTMLElement)?.offsetHeight > contentTableRef?.scrollHeight;
        }, [contentPanelRef, contentTableRef?.rows?.length, editModule?.editSettings, isAddOperation]);

        /**
         * Enhanced FormValidator integration with comprehensive validation rule mapping
         * This creates a proper ValidationRules object for the FormValidator component
         */
        const { rules: formValidationRules, columns: validationNonRenderedColumn } = useFormValidationRules(columns);
        const isNewSessionRef: React.RefObject<boolean> = useRef(false);

        // Track Tab direction for proper focus management after save
        const lastTabDirectionRef: React.RefObject<boolean | null> = useRef<boolean>(true); // true = forward (Tab), false = backward (Shift+Tab)

        // Reset the new session flag after initialization
        useEffect(() => {
            if (isNewSessionRef.current) {
                isNewSessionRef.current = false;
            }
        });

        useEffect(() => {
            isNewSessionRef.current = true;
        }, [editRowIndex]);

        /**
         * Store edit cell ref
         */
        const storeEditCellRef: (field: string, cellRef: EditCellRef | null) => void =
            useCallback((field: string, cellRef: EditCellRef | null) => {
                if (cellRef) {
                    editCellRefs.current[field as string] = cellRef;
                } else {
                    delete editCellRefs.current[field as string];
                }
            }, []);

        /**
         * Focus the first editable field
         * For add operations, primary key fields should be focused first
         * For edit operations, skip primary key fields (they're disabled)
         */
        const focusFirstField: (last?: boolean, edit?: boolean) => void = useCallback((last?: boolean, edit?: boolean) => {
            let firstEditableColumn: ColumnProps<T> | undefined;

            if (isAddOperation) {
                // For add operations, primary key fields are enabled and should be focused first
                firstEditableColumn = (last ? [...columns].reverse() : columns).find((col: ColumnProps<T>) =>
                    (col.allowEdit !== false || col.getCommandItems) && col.visible &&
                    (col.field || col.getCommandItems) &&
                    (col.isPrimaryKey === true || edit)
                );

                // If no primary key field found, find the first non-primary key editable field
                if (!firstEditableColumn) {
                    firstEditableColumn = columns.find((col: ColumnProps<T>) =>
                        col.allowEdit !== false && col.visible &&
                        !col.isPrimaryKey &&
                        col.field
                    );
                }
            } else {
                // For edit operations, skip primary key fields (they're disabled)
                // Focus the first non-primary key editable field
                if (editModule.focusLastField.current || last) {
                    firstEditableColumn = [...columns].reverse().find((col: ColumnProps<T>) =>
                        (col.allowEdit !== false || col.getCommandItems) && col.visible &&
                        !col.isPrimaryKey &&
                        (col.field || col.getCommandItems)
                    );
                } else {
                    firstEditableColumn = columns.find((col: ColumnProps<T>) =>
                        (col.allowEdit !== false || col.getCommandItems) && col.visible &&
                        !col.isPrimaryKey &&
                        (col.field || col.getCommandItems)
                    );
                }
                editModule.focusLastField.current = false;
            }

            if ((firstEditableColumn && editCellRefs.current[firstEditableColumn.field]) || firstEditableColumn?.getCommandItems) {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        focusModule.removeFocusTabIndex();
                        focusModule.setGridFocus(true);
                        if (firstEditableColumn?.getCommandItems) {
                            const commandItems: HTMLElement[] = focusModule.getCommandItems(rowRef.current.querySelector(`.${GRID_COMMAND_CELL}`));
                            (last ? commandItems[commandItems.length - 1] : commandItems[0]).focus();
                        } else {
                            editCellRefs?.current?.[firstEditableColumn?.field]?.focus?.();
                        }
                    }, 0);
                });
            } else if (firstEditableColumn && !editCellRefs.current[firstEditableColumn.field]) {
                const colIndex: number = getVisibleColumns?.()?.indexOf(firstEditableColumn);
                if (colIndex) {
                    contentScrollRef.scrollLeft = columnOffsets[colIndex as number];
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            editCellRefs.current?.[firstEditableColumn.field]?.focus();
                        });
                    });
                }
            }
        }, [columns, isAddOperation]);

        /**
         * Enhanced FormValidator validation state management
         * This tracks the FormValidator's internal validation state properly
         */
        const [formState, setFormState] = useState<FormState | null>(validationErrors && Object.keys(validationErrors)?.length &&
            virtualSettings.enableRow ? (commandEdit.current ?
                { ...commandEditInlineFormRef?.current?.[rowUid as string]?.current?.formState } :
                {...editModule?.getCurrentFormState()}) : null);
        const isSubmitValidationScrollRequired: RefObject<boolean> = useRef<boolean>(false);

        /**
         * Memoized onFocus callback to prevent re-renders in renderEditCells loop.
         * Created after formState to ensure proper dependency management.
         */
        const handleCellFocus: (field: string) => void = useCallback((field: string) => {
            formState?.onFocus?.(field);
        }, [formState]);

        /**
         * Validate the form using FormValidator component
         * This ensures validation works correctly without unnecessary re-rendering
         */
        const validateForm: () => boolean = useCallback((): boolean => {
            if (formRef.current) {
                // Trigger FormValidator validation
                const isFormValid: boolean = formRef.current.validate();
                isSubmitValidationScrollRequired.current = !isFormValid;
                return isFormValid;
            }
            // Fallback to existing validation errors check when FormValidator is not available
            return Object.keys(validationErrors).length === 0;
        }, [validationErrors]);

        useMemo(() => {
            if (formState?.errors) {
                const firstErrorField: string = Object.keys(formState?.errors)?.[0];
                if (firstErrorField && isSubmitValidationScrollRequired.current && validationNonRenderedColumn.size &&
                    validationNonRenderedColumn.has(firstErrorField)) {
                    const colIndex: number = getVisibleColumns?.()?.indexOf(validationNonRenderedColumn.get(firstErrorField));
                    if (colIndex) {
                        contentScrollRef.scrollLeft = columnOffsets[colIndex as number];
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                editCellRefs.current?.[firstErrorField as string]?.focus();
                            });
                        });
                    }
                }
                isSubmitValidationScrollRequired.current = false;
            }
        }, [formState?.errors]);

        /**
         * Get all edit cell refs
         */
        const getEditCells: () => EditCellRef[] = useCallback((): EditCellRef[] => {
            return Object.values(editCellRefs.current);
        }, []);

        /**
         * Get the form element
         */
        const getFormElement: () => HTMLFormElement | null = useCallback((): HTMLFormElement | null => {
            return formRef.current.element;
        }, []);

        /**
         * Get current form internal parsed data
         */
        const getCurrentData: () => T = useCallback(() => {
            return internalData as T;
        }, [internalData]);

        /**
         * Handle field value change with proper data isolation
         * This prevents re-renders while maintaining data consistency
         */
        const handleFieldChange: (column: ColumnProps<T>, value: ValueType, formatter: IValueFormatter, internalData: T,
            setInternalData: (value: React.SetStateAction<T>) => void, formState: FormState,
            stableOnFieldChange: (field: string, value: ValueType | null) => void) =>
        void = useCallback(handleFieldChangeFn, [stableOnFieldChange, formState]);

        /**
         * Handle field blur
         * Enhanced blur handling to properly trigger FormValidator validation
         * This ensures validation happens on every field blur event
         */
        const handleFieldBlur: (column: ColumnProps<T>, value: ValueType | Record<string, unknown>, formatter: IValueFormatter,
            internalData: T, setInternalData: (value: React.SetStateAction<T>) => void, isAddOperation: boolean,
            editModule: UseEditResult<T>, formState: FormState, formRef: RefObject<IFormValidator>) =>
        void = useCallback(handleFieldBlurFn, [formState]);

        /**
         * Handle Enter key (save)
         */
        const handleEnter: () => void = useCallback(() => {
            onSave?.();
        }, [onSave]);

        /**
         * Handle Escape key (cancel)
         */
        const handleEscape: () => void = useCallback(() => {
            onCancel?.();
        }, [onCancel]);

        /**
         * Expose imperative methods via ref
         */
        useImperativeHandle(ref, () => ({
            rowRef: rowRef,
            focusFirstField,
            validateForm,
            getEditCells,
            getFormElement,
            getCurrentData,
            editCellRefs,
            formState,
            formRef
        }), [focusFirstField, validateForm, getEditCells, getFormElement, getCurrentData, formState,
            editCellRefs.current, formRef.current]);

        /**
         * Enhanced Tab boundary detection and auto-save behavior
         * This function detects when Tab/Shift+Tab navigation reaches the boundaries of the edit form
         * and automatically saves the form while maintaining proper focus management
         * For add operations, include primary key fields in boundary detection
         */
        const handleTabBoundaryNavigation: (event: React.KeyboardEvent, currentField: string) => boolean =
            useCallback((event: React.KeyboardEvent, currentField: string) => {
                // Get editable columns based on operation type
                let editableColumns: ColumnProps<T>[];

                if (isAddOperation) {
                    // For add operations, include primary key fields (they're enabled)
                    editableColumns = columns.filter((col: ColumnProps<T>) =>
                        (col.allowEdit !== false || col.getCommandItems) && col.visible &&
                        (col.field || col.getCommandItems)
                    );
                } else {
                    // For edit operations, exclude primary key fields (they're disabled)
                    editableColumns = columns.filter((col: ColumnProps<T>) =>
                        (col.allowEdit !== false || col.getCommandItems) && col.visible &&
                        !col.isPrimaryKey &&
                        (col.field || col.getCommandItems)
                    );
                }

                const currentIndex: number = editableColumns.findIndex((col: ColumnProps<T>) => col.field === currentField);

                if (currentIndex === -1) {
                    return false;
                }
                const commandItem: boolean = focusModule.isNextCommandItem(event);
                const isTabForward: boolean = event.key === 'Tab' && !event.shiftKey;
                const isTabBackward: boolean = event.key === 'Tab' && event.shiftKey;
                const isLastField: boolean = currentIndex === editableColumns.length - 1 && !commandItem;
                const isFirstField: boolean = currentIndex === 0 && !commandItem;

                // Detect boundary conditions for auto-save
                if ((isTabForward && isLastField) || (isTabBackward && isFirstField)) {
                    if (commandEdit.current) {
                        focusModule.editToRow(event);
                        return false;
                    }
                    // Track Tab direction for proper focus management
                    lastTabDirectionRef.current = isTabForward;

                    // Auto-save when reaching edit form boundaries
                    // Based on the information in your clipboard, this implements the expected behavior where
                    // continuously pressing Tab or Shift+Tab to exit focus from edit form should
                    // automatically save the changes and move focus to the appropriate cell of the saved content row
                    // Prevent the default Tab behavior to avoid focus jumping
                    event.preventDefault();
                    event.stopPropagation();

                    // Use setTimeout to ensure proper timing for auto-save
                    setTimeout(() => {
                        // Pass Tab direction to save function for proper focus management
                        // This triggers the enhanced endEdit function in useEdit with proper direction info
                        onSave?.(lastTabDirectionRef.current);
                    }, 0);
                    return true; // Indicate that boundary navigation was handled
                }

                return false; // Indicate that normal Tab navigation should continue
            }, [columns, isAddOperation, onSave, focusModule]);

        /**
         * Render edit cells with proper data binding
         * For add operations, primary key fields should be focused first
         * For edit operations, skip primary key fields (they're disabled)
         */
        const renderEditCells: React.JSX.Element[] | null = useMemo(() => {
            if (!formState) { return null; }

            const startVirtualIndex: number = scrollModule?.virtualColumnInfo.startIndex;
            const endVirtualIndex: number = scrollModule?.virtualColumnInfo.endIndex;
            const visibleColumns: ColumnProps[] = getVisibleColumns();
            const finalColumns: ColumnProps[] = virtualSettings.enableColumn ?
                (scrollModule?.virtualColumnInfo?.columns?.length && totalRecordsCount ? scrollModule?.virtualColumnInfo?.columns :
                    (visibleColumns.length ? visibleColumns : columns).slice(startVirtualIndex, endVirtualIndex)) : columns;
            const renderedCells: React.JSX.Element[] = finalColumns.map((column: ColumnProps<T>, index: number) => {
                // For add operations, primary key fields should be editable
                // For edit operations, primary key fields should be disabled
                // Also check column/field visiibility and the disabled prop for showAddNewRow functionality
                const isEditable: boolean = column.allowEdit !== false && column.field && column.visible &&
                                (isAddOperation || !column.isPrimaryKey) && !disabled;

                // Handle undefined values properly for truly empty edit forms
                // Let EditCell handle undefined values appropriately for each input type
                const fieldError: string = validationErrors[column.field];

                // Computes the CSS class for cell alignment
                const alignClass: string = `sf-${(column.textAlign ?? 'Left').toLowerCase()}-align`;

                if (column.type === 'checkbox') {
                    return (
                        <td
                            key={`edit-cell-${column.field || index}`}
                            className={`${CELL} ${alignClass}`}
                        >
                            <Checkbox
                                className={GRID_CHECKSELECT}
                                aria-label={localization?.getConstant('SelectRow')}
                                disabled={true}
                            />
                        </td>
                    );
                }
                const commandColumn: boolean = !isNullOrUndefined(column.getCommandItems);
                if (!isEditable) {
                    return column.visible ? (
                        <td
                            key={`edit-cell-${column.field || index}`}
                            className={`${CELL} ${GRID_EDIT_CELL} ${EDIT_DISABLED}${isAddOperation && isLastRow ? ` ${LAST_ROW}` : ''}${!isAddOperation && isLastRow ? ` ${LAST_CELL}` : ''}${commandColumn ? ` ${GRID_COMMAND_CELL}` : ''}${!!column?.displayAsCheckBox && column?.edit?.type === EditType.CheckBox ? ` ${alignClass}` : ''}`}
                            data-mappinguid={column.uid}
                            role='gridcell'
                            aria-colindex={index + 1}
                            aria-label={`column header ${column.headerText}`}
                            style={{
                                textAlign: (column.textAlign?.toLowerCase() as CSSProperties['textAlign'])
                            }}
                        >
                            {commandColumn ?
                                <CommandColumnBase row={rowObject} column={column} />
                                :
                                <FormField name={column.field}>
                                    <EditCell
                                        ref={(cellRef: EditCellRef | null) => storeEditCellRef(column.field, cellRef)}
                                        column={{ ...column, allowEdit: false }}
                                        value={getObject(column.field, formState?.values) ?? formState?.values?.[column.field]}
                                        data={internalData as T}
                                        error={formState?.errors?.[column.field]}
                                        onChange={(value: unknown) => handleFieldChange(
                                            column, value as ValueType, formatter, internalData,
                                            setInternalData, formState, stableOnFieldChange)}
                                        onBlur={(value: ValueType | Object | undefined) => handleFieldBlur(
                                            column, value as ValueType | Record<string, unknown>, formatter,
                                            internalData, setInternalData, isAddOperation, editModule, formState, formRef)}
                                        disabled={disabled}
                                        onFocus={() => handleCellFocus(column.field)}
                                        isAdd={isAddOperation}
                                        formState={formState}
                                        rowObject={rowObject}
                                    />
                                </FormField>
                            }
                        </td>
                    ) : (
                        <td
                            key={`edit-cell-${column.field}`}
                            className={`${CELL} ${DISPLAY_NONE}`}
                        ></td>
                    );
                }

                return column.visible ? (
                    <td
                        key={`edit-cell-${column.field}`}
                        className={`${CELL} ${GRID_EDIT_CELL}${isAddOperation && isLastRow ? ` ${LAST_ROW}` : ''}${!isAddOperation && isLastRow ? ` ${LAST_CELL}` : ''}${!!column?.displayAsCheckBox && column?.edit?.type === EditType.CheckBox ? ` ${alignClass}` : ''}`}
                        data-mappinguid={column.uid}
                        role='gridcell'
                        aria-colindex={index + 1}
                        aria-invalid={fieldError ? 'true' : 'false'}
                        aria-label={`column header ${column.headerText}`}
                        style={{
                            textAlign: (column.textAlign?.toLowerCase() as CSSProperties['textAlign'])
                        }}
                    >
                        <FormField name={column.field}>
                            <EditCell
                                ref={(cellRef: EditCellRef | null) => storeEditCellRef(column.field, cellRef)}
                                column={column}
                                value={getObject(column.field, formState?.values) ?? formState?.values?.[column.field]}
                                data={internalData}
                                error={formState?.errors?.[column.field]}
                                onChange={(value: unknown) => handleFieldChange(
                                    column, value as ValueType, formatter, internalData,
                                    setInternalData, formState, stableOnFieldChange)}
                                onBlur={(value: ValueType | Object | undefined) => handleFieldBlur(
                                    column, value as ValueType | Record<string, unknown>, formatter,
                                    internalData, setInternalData, isAddOperation, editModule, formState, formRef)}
                                disabled={disabled}
                                onFocus={() => handleCellFocus(column.field)}
                                isAdd={isAddOperation}
                                formState={formState}
                                rowObject={rowObject}
                            />
                        </FormField>
                    </td>
                ) : (
                    <td
                        key={`edit-cell-${column.field}`}
                        className={`${CELL} ${DISPLAY_NONE}`}
                    ></td>
                );
            });

            // Render hidden FormFields for non-rendered virtual columns with validation rules
            // This ensures validation runs on all fields with validation rules, even if they're not visible
            const hiddenValidationFields: React.JSX.Element[] = [];
            if (virtualSettings.enableColumn && validationNonRenderedColumn.size > 0) {
                Array.from(validationNonRenderedColumn.entries()).forEach(([field]: [string, ColumnProps<T>]) => {
                    hiddenValidationFields.push(
                        <FormField key={`hidden-validation-${field}`} name={field}>
                            <></>
                        </FormField>
                    );
                });
            }

            return [...renderedCells, ...hiddenValidationFields];
        }, [columns, internalData, validationErrors, isAddOperation, disabled, handleFieldChange, offsetX,
            handleFieldBlur, handleEnter, handleEscape, storeEditCellRef, formState, virtualSettings, handleCellFocus
        ]);

        // Render custom edit template if provided
        if (CustomTemplate) {
            return (
                <tr className={`${GRID_CONTENT_ROW} ${isAddOperation ? GRID_ADD_ROW : GRID_EDIT_ROW}`}>
                    <td colSpan={getVisibleColumns?.().length} >
                        <Form
                            ref={formRef}
                            rules={formValidationRules}
                            initialValues={internalData as Record<string, FormValueType>}
                            validateOnChange={!(isAddOperation && editModule?.isShowAddNewRowActive) || (isAddOperation &&
                            formState && formState.errors && Object.keys(formState.errors).length > 0)}
                            onFormStateChange={setFormState}
                            className={`${GRID_EDIT_FORM}${cssClass !== '' ? ` ${cssClass}` : ''}`}
                            id={`grid-edit-form-${editRowIndex}`}
                            aria-label={`${isAddOperation ? 'Add' : 'Edit'} Record Form`}
                            role='form'
                        >
                            <div className={EDIT_TEMPLATE_CONTAINER}>
                                <CustomTemplate
                                    data={internalData as T}
                                    columns={columns}
                                    validationErrors={validationErrors}
                                    onSave={onSave}
                                    onCancel={onCancel}
                                    onFieldChange={stableOnFieldChange}
                                    formState={formState}
                                    isAddOperation={isAddOperation}
                                    disabled={disabled}
                                    setInternalData={setInternalData}
                                />
                            </div>
                            {formState && formState.errors && Object.keys(formState.errors).length > 0 && (
                                <ValidationTooltips formState={formState} editCellRefs={editCellRefs} />
                            )}
                        </Form>
                    </td>
                </tr>
            );
        }

        useEffect(() => {
            const resetShowAddNewRowForm: (event: CustomEvent) => void = (event: CustomEvent) => {
                const { editData } = event.detail;
                setInternalData(editData);
                requestAnimationFrame(() => {
                    formRef.current?.reset?.();
                });
            };
            if (isAddOperation && editModule?.isShowAddNewRowActive && !editModule?.isShowAddNewRowDisabled) {
                formRef.current?.element?.addEventListener('resetShowAddNewRowForm', resetShowAddNewRowForm as EventListener);
            }
            return () => {
                formRef.current?.element?.removeEventListener?.('resetShowAddNewRowForm', resetShowAddNewRowForm as EventListener);
            };
        }, [formState, internalData, formRef]);

        /**
         * Handle custom Tab navigation events from EditCell components
         * Enhanced to handle boundary navigation for auto-save behavior
         */
        useEffect(() => {
            const handleTabEvent: (event: CustomEvent) => void = (event: CustomEvent) => {
                const { field, originalEvent } = event.detail;

                // First check if this is a boundary navigation that should trigger auto-save
                if (originalEvent && handleTabBoundaryNavigation(originalEvent, field)) {
                    // Prevent the original Tab event from continuing
                    originalEvent.preventDefault();
                    originalEvent.stopPropagation();
                    editModule.nextPrevEditRowInfo.current = originalEvent;
                    // Boundary navigation was handled (auto-save triggered), don't continue with normal navigation
                    return;
                }
                if (isAddOperation && editModule.isShowAddNewRowActive && !formState?.errors) {
                    formState?.onBlur?.(field);
                    formRef.current.validateField(field);
                }
            };

            formRef.current?.element?.addEventListener('editCellTab', handleTabEvent as EventListener);

            return () => {
                formRef.current?.element?.removeEventListener('editCellTab', handleTabEvent as EventListener);
            };
        }, [handleTabBoundaryNavigation, focusModule]);

        /**
         * Enhanced focus management for proper auto-focus behavior
         * Only focus on initial mount and when starting a new edit session
         */
        const hasInitialFocusAttempted: React.RefObject<boolean> =
            useRef(virtualSettings.enableRow &&
                !isNullOrUndefined(commandColumnModule?.commandEditInlineFormRef?.current?.[rowUid as string] ??
                commandColumnModule?.commandAddInlineFormRef?.current?.[rowUid as string]));
        const focusTimeoutRef: React.RefObject<NodeJS.Timeout | null> = useRef<NodeJS.Timeout | null>(null);

        useEffect(() => {
            // Reset focus attempt flag when starting a new edit session
            if (isNewSessionRef.current) {
                hasInitialFocusAttempted.current = false;
            }

            // Only attempt focus once per edit session
            if (hasInitialFocusAttempted.current) {
                return undefined;
            }

            hasInitialFocusAttempted.current = true;

            // Clear any existing focus timeout
            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
            }

            // Use timeout instead of requestAnimationFrame for better reliability
            focusTimeoutRef.current = setTimeout(() => {
                const activeElement: HTMLElement | null = document.activeElement as HTMLElement;
                const isAlreadyFocusedInEdit: boolean | Element = activeElement && (
                    activeElement.closest(`.${GRID_EDIT_ROW}`) ||
                    activeElement.closest(`.${GRID_ADD_ROW}`)
                );

                // Always auto-focus for new edit sessions, regardless of current focus
                // This ensures proper focus behavior when clicking on different rows or starting edit
                if ((isNewSessionRef.current || !isAlreadyFocusedInEdit) && !editModule?.isShowAddNewRowActive) {
                    focusFirstField();
                }
            }, 0); // Reduced delay for better responsiveness

            return () => {
                clearTimeout(focusTimeoutRef.current);
            };
        }, [editRowIndex, rowUid]); // Re-run when edit session changes

        /**
         * Memoized colgroup element to prevent unnecessary re-renders
         * Contains column definitions for the table
         */
        const colGroupContent: JSX.Element = useMemo(() => {
            let visibleCols: JSX.Element[] = [];

            if (!virtualSettings.enableRow && !virtualSettings.enableColumn) {
                visibleCols = ColElements;
            } else {
                const startIndex: number = scrollModule?.virtualColumnInfo?.startIndex ?? 0;
                const endIndex: number = scrollModule?.virtualColumnInfo?.endIndex ?? ColElements?.length;
                for (let i: number = startIndex; i < endIndex; i++) {
                    const col: JSX.Element = ColElements?.[i as number];
                    visibleCols.push(col);
                }
            }

            return (
                <colgroup
                    key={`content-${id}-colgroup`}
                    id={`content-${id}-colgroup`}
                >
                    {visibleCols}
                </colgroup>
            );
        }, [
            ColElements,
            id,
            offsetX,
            virtualSettings.enableColumn,
            scrollModule?.virtualColumnInfo?.startIndex,
            scrollModule?.virtualColumnInfo?.endIndex
        ]);

        return rowUid ? (
            <tr
                ref={rowRef}
                className={`${GRID_CONTENT_ROW} ${rowUid.includes('grid-add-row') ? GRID_ADD_ROW : GRID_EDIT_ROW}`}
                aria-rowindex={editRowIndex + 1}
                data-uid={rowUid}
                style={{ height: `${rowObject?.height ?? rowHeight}px` }}
            >
                <td colSpan={getVisibleColumns?.().length}>
                    <Form
                        ref={formRef}
                        rules={formValidationRules}
                        initialValues={internalData as Record<string, FormValueType>}
                        validateOnChange={!(isAddOperation && editModule?.isShowAddNewRowActive) || (isAddOperation &&
                            formState && formState.errors && Object.keys(formState.errors).length > 0)}
                        onFormStateChange={(args: FormState) => {
                            setFormState(args);
                        }}
                        className={`${GRID_EDIT_FORM}${cssClass !== '' ? ` ${cssClass}` : ''}`}
                        id={`grid-edit-form-${editRowIndex}`}
                        aria-label={`${isAddOperation ? 'Add' : 'Edit'} Record Form`}
                        role='form'
                    >
                        <table
                            className={GRID_EDIT_TABLE}
                            cellSpacing='0.25'
                            role='grid'
                            style={{ borderCollapse: 'separate', borderSpacing: '0.25px', width: '100%', tableLayout: 'fixed' }}
                        >
                            {colGroupContent}
                            <tbody role='rowgroup'>
                                <tr
                                    role='row'
                                    style={{ height: `${rowObject?.height ?? rowHeight}px` }}
                                >
                                    {renderEditCells}
                                </tr>
                            </tbody>
                        </table>

                        {formState && formState.errors && Object.keys(formState.errors).length > 0 && (
                            <ValidationTooltips formState={formState} editCellRefs={editCellRefs} rowRef={rowRef} />
                        )}
                    </Form>
                </td>
            </tr>
        ) : (
            <></>
        );
    })) as unknown as React.ForwardRefExoticComponent<InlineEditFormProps & React.RefAttributes<InlineEditFormRef>>;

(InlineEditForm as React.ForwardRefExoticComponent<InlineEditFormProps & React.RefAttributes<InlineEditFormRef>>).displayName = 'InlineEditForm';


// Re-export functions for backward compatibility and external use
export { internalDataFn, handleFieldChangeFn, handleFieldBlurFn };
