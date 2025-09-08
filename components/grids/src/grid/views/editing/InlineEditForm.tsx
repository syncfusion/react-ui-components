import { memo, useRef, useEffect, useCallback, forwardRef, useMemo, useState, useImperativeHandle, CSSProperties, JSX } from 'react';
import { FieldValidationRules, Form, FormField, FormState, FormValueType, IFormValidator, ValidationRules } from '@syncfusion/react-inputs';
import { EditCell, ValidationTooltips } from '../index';
import { EditCellRef, InlineEditFormProps, InlineEditFormRef } from '../../types/edit.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { IValueFormatter, ValueType } from '../../types';
import { ColumnProps, ColumnValidationConfig, IColumnBase } from '../../types/column.interfaces';
import { getObject } from '../../utils';
import { DataUtil } from '@syncfusion/react-data';
import { isNullOrUndefined, isUndefined } from '@syncfusion/react-base';

/**
 * InlineEditForm component that prevents unnecessary re-renders during typing
 *
 * @param props - InlineEditForm component props
 * @param ref - Forward ref for imperative methods
 * @returns Memoized EditForm component
 */
export const InlineEditForm: React.ForwardRefExoticComponent<InlineEditFormProps & React.RefAttributes<InlineEditFormRef>> =
    memo(forwardRef<InlineEditFormRef, InlineEditFormProps>(({
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
        isAddOperation
    }: InlineEditFormProps, ref: React.ForwardedRef<InlineEditFormRef>) => {
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

        const formRef: React.RefObject<IFormValidator> = useRef<IFormValidator>(null);
        const editCellRefs: React.RefObject<{ [field: string]: EditCellRef }> = useRef<{ [field: string]: EditCellRef }>({});
        const { rowHeight, id, getVisibleColumns, serviceLocator, editModule, contentPanelRef, contentTableRef,
            height } = useGridComputedProvider();
        const { colElements: ColElements, cssClass } = useGridMutableProvider();
        const formatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>('valueFormatter');

        /**
         * Internal data state that's isolated from grid until save
         */
        const [internalData, setInternalData] = useState<Object>(() => {
            // For add operations, start with truly empty data
            if (isAddOperation) {
                const addData: Record<string, unknown> = {};
                columns.forEach((column: ColumnProps) => {
                    if (column.field && column.defaultValue !== undefined) {
                        // Apply defaultValue only when explicitly set
                        if (column.type === 'string') {
                            addData[column.field] = typeof column.defaultValue === 'string'
                                ? column.defaultValue
                                : String(column.defaultValue);
                        } else {
                            addData[column.field] = column.defaultValue;
                        }
                    }
                    // Don't set any value if no defaultValue is specified
                });
                return addData;
            } else {
                // For edit operations, use all existing data
                return editData ? { ...editData } : {};
            }
        });

        const isLastRow: boolean = useMemo(() => {
            return height !== 'auto' && ((editModule?.editSettings?.newRowPosition === 'Bottom' && isAddOperation) ||
                (!isAddOperation && rowUid === contentTableRef?.rows?.[contentTableRef?.rows?.length - 1].getAttribute('data-uid'))) &&
                (contentPanelRef?.firstElementChild as HTMLElement)?.offsetHeight > contentTableRef?.scrollHeight;
        }, [contentPanelRef, contentTableRef?.rows?.length, editModule?.editSettings, isAddOperation]);

        /**
         * Enhanced FormValidator integration with comprehensive validation rule mapping
         * This creates a proper ValidationRules object for the FormValidator component
         */
        const formValidationRules: ValidationRules = useMemo(() => {
            const rules: ValidationRules = {};

            columns.forEach((column: ColumnProps) => {
                if (column.field && column.visible && (column.validationRules || column.type || column.edit?.type)) {
                    const columnRules: FieldValidationRules = {};
                    const validationRules: ColumnValidationConfig = column.validationRules || {};

                    // Convert column validation rules to FormValidator format
                    if (validationRules.required !== undefined && validationRules.required !== false) {
                        columnRules.required = [validationRules.required, 'This field is required.'];
                    }

                    if (validationRules.minLength !== undefined) {
                        columnRules.minLength = [validationRules.minLength, `Please enter at least ${validationRules.minLength} characters.`];
                    }

                    if (validationRules.maxLength !== undefined) {
                        columnRules.maxLength = [validationRules.maxLength, `Please enter no more than ${validationRules.maxLength} characters.`];
                    }

                    if (validationRules.min !== undefined) {
                        columnRules.min = [validationRules.min, `Please enter a value greater than or equal to ${validationRules.min}.`];
                    }

                    if (validationRules.max !== undefined) {
                        columnRules.max = [validationRules.max, `Please enter a value less than or equal to ${validationRules.max}.`];
                    }

                    // Enhanced range validation support
                    if (validationRules.range && Array.isArray(validationRules.range) && validationRules.range.length === 2) {
                        columnRules.range = [validationRules.range, `Please enter a value in between ${validationRules.range[0]} and ${validationRules.range[1]}.`];
                    }

                    // Enhanced range length validation support
                    if (validationRules.rangeLength && Array.isArray(validationRules.rangeLength) &&
                    validationRules.rangeLength.length === 2) {
                        columnRules.rangeLength = [validationRules.rangeLength,
                            `Please enter between ${
                                validationRules.rangeLength[0]
                            } and ${validationRules.rangeLength[1]} characters.`];
                    }

                    // Enhanced regex validation support
                    if (validationRules.regex) {
                        columnRules.regex = [validationRules.regex, 'This field format is invalid.'];
                    }

                    if (validationRules.email) {
                        columnRules.email = [validationRules.email, 'Please enter a valid email.'];
                    }

                    if (validationRules.url) {
                        columnRules.url = [validationRules.url, 'Please enter a valid url.'];
                    }

                    if (validationRules.digits) {
                        columnRules.digits = [validationRules.digits, 'Please enter digits(0-9) only.'];
                    }

                    if (validationRules.creditCard) {
                        columnRules.creditCard = [validationRules.creditCard, 'Please enter a valid creditcard number.'];
                    }

                    if (validationRules.tel) {
                        columnRules.tel = [validationRules.tel, 'Please enter a valid telephone number.'];
                    }

                    if (validationRules.equalTo) {
                        columnRules.equalTo = [validationRules.equalTo,
                            `This field value not matches with ${validationRules.equalTo} field value.`];
                    }

                    // Enhanced custom validation with proper error handling
                    if (validationRules.customValidator && typeof validationRules.customValidator === 'function') {
                        columnRules.customValidator = (value: FormValueType) => {
                            try {
                                const result: string | null = validationRules.customValidator(value);
                                return result || null;
                            } catch (error) {
                                return `Validation error: ${(error as Error).message}`;
                            }
                        };
                    }

                    if (column.type === 'number') {
                        columnRules.number = [validationRules.number, 'Please enter a valid number.'];
                    }

                    if (column.type === 'date') {
                        columnRules.date = [validationRules.date, 'Please enter a valid date.'];
                    }

                    // Only add rules if there are actual validation rules defined
                    if (Object.keys(columnRules).length > 0) {
                        rules[column.field] = columnRules;
                    }
                }
            });

            return rules;
        }, [columns]);

        const isNewSessionRef: React.RefObject<boolean> = useRef(false);

        // Track Tab direction for proper focus management after save
        const lastTabDirectionRef: React.RefObject<boolean | null> = useRef<boolean>(true); // true = forward (Tab), false = backward (Shift+Tab)

        // Reset the new session flag after initialization
        useEffect(() => {
            if (isNewSessionRef.current) {
                isNewSessionRef.current = false;
            }
        });

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
        const focusFirstField: () => void = useCallback(() => {
            let firstEditableColumn: ColumnProps | undefined;

            if (isAddOperation) {
                // For add operations, primary key fields are enabled and should be focused first
                firstEditableColumn = columns.find((col: ColumnProps) =>
                    col.allowEdit !== false && col.visible &&
                    col.field &&
                    col.isPrimaryKey === true
                );

                // If no primary key field found, find the first non-primary key editable field
                if (!firstEditableColumn) {
                    firstEditableColumn = columns.find((col: ColumnProps) =>
                        col.allowEdit !== false && col.visible &&
                        !col.isPrimaryKey &&
                        col.field
                    );
                }
            } else {
                // For edit operations, skip primary key fields (they're disabled)
                // Focus the first non-primary key editable field
                if (editModule.focusLastField.current) {
                    firstEditableColumn = [...columns].reverse().find((col: ColumnProps) =>
                        col.allowEdit !== false && col.visible &&
                        !col.isPrimaryKey &&
                        col.field
                    );
                } else {
                    firstEditableColumn = columns.find((col: ColumnProps) =>
                        col.allowEdit !== false && col.visible &&
                        !col.isPrimaryKey &&
                        col.field
                    );
                }
                editModule.focusLastField.current = false;
            }

            if (firstEditableColumn && editCellRefs.current[firstEditableColumn.field]) {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        editCellRefs?.current?.[firstEditableColumn?.field]?.focus?.();
                    }, 0);
                });
            }
        }, [columns, isAddOperation]);

        /**
         * Enhanced FormValidator validation state management
         * This tracks the FormValidator's internal validation state properly
         */
        const [formState, setFormState] = useState<FormState | null>(null);

        /**
         * Validate the form using FormValidator component
         * This ensures validation works correctly without unnecessary re-rendering
         */
        const validateForm: () => boolean = useCallback((): boolean => {
            if (formRef.current) {
                // Trigger FormValidator validation
                const isFormValid: boolean = formRef.current.validate();
                return isFormValid;
            }
            // Fallback to existing validation errors check when FormValidator is not available
            return Object.keys(validationErrors).length === 0;
        }, [validationErrors]);

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
         * Get current form data
         */
        const getCurrentData: () => string | number | boolean | Record<string, unknown> | Date = useCallback(() => {
            return formState?.values;
        }, [formState]);

        /**
         * Handle field value change with proper data isolation
         * This prevents re-renders while maintaining data consistency
         */
        const handleFieldChange: (column: ColumnProps, value: ValueType) =>
        void = useCallback((column: ColumnProps, value: ValueType) => {
            let formattedValue: ValueType = (column?.type === 'date' || column?.type === 'datetime' || column?.type === 'number') && typeof value === 'string' ?
                (formatter.fromView(value, (column as IColumnBase)?.parseFn, column?.type)) : value;
            if ((column?.type === 'number' && isNaN(formattedValue as number)) ||
                ((column?.type === 'date' || column?.type === 'datetime') && isUndefined(formattedValue as string))) {
                formattedValue = '';
            }
            // Update internal data immediately for UI responsiveness
            const topLevelKey: string = column.field.split('.')[0];
            const copiedComplexData: Object = column.field.includes('.') && typeof internalData[topLevelKey as string] === 'object'
                ? {
                    ...internalData,
                    [topLevelKey]: JSON.parse(JSON.stringify(internalData[topLevelKey as string]))
                }
                : { ...internalData };

            const editedData: Object = DataUtil.setValue(column.field, formattedValue, copiedComplexData);
            setInternalData({...editedData});

            // Update FormValidator state
            if (!isNullOrUndefined(internalData[topLevelKey as string]) && typeof internalData[topLevelKey as string] === 'object'
                && !(internalData[topLevelKey as string] instanceof Date)) {
                formState?.onChange?.(topLevelKey, { value: {
                    ...editedData[topLevelKey as string],
                    [column.field.split('.')[1]]: value
                } as FormValueType });
            } else {
                formState?.onChange?.(column.field, { value: value as FormValueType });
            }
            // Notify parent for validation but don't expose data until save
            stableOnFieldChange?.(column.field, formattedValue);
        }, [stableOnFieldChange, formState]);

        /**
         * Handle field blur
         * Enhanced blur handling to properly trigger FormValidator validation
         * This ensures validation happens on every field blur event
         */
        const handleFieldBlur: (column: ColumnProps, value: string | number | boolean | Record<string, unknown> | Date) =>
        void = useCallback((column: ColumnProps, value: string | number | boolean | Record<string, unknown> | Date) => {
            value = (column?.type === 'date' || column?.type === 'number') && typeof value === 'string' ?
                (formatter.fromView(value, (column as IColumnBase)?.parseFn, column?.type)) : value;
            // Update internal data on blur (consistency check)
            const topLevelKey: string = column.field.split('.')[0];
            const copiedComplexData: Object = column.field.includes('.') && typeof internalData[topLevelKey as string] === 'object'
                ? {
                    ...internalData,
                    [topLevelKey]: JSON.parse(JSON.stringify(internalData[topLevelKey as string]))
                }
                : { ...internalData };

            const editedData: Object = DataUtil.setValue(column.field, value, copiedComplexData);
            setInternalData({...editedData});

            if (!(isAddOperation && editModule.isShowAddNewRowActive) ||
                (isAddOperation && formState && Object.keys(formState.errors).length > 0)) {
                // Always trigger FormValidator blur validation
                // This is essential for proper validation behavior
                formState?.onBlur?.(column.field);

                // Also trigger manual validation for immediate feedback
                // This ensures validation errors are displayed immediately on blur
                formRef.current?.validateField?.(column.field);
            }

        }, [formState]);

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
        const handleTabBoundaryNavigation: (event: KeyboardEvent, currentField: string) => boolean =
            useCallback((event: KeyboardEvent, currentField: string) => {
                // Get editable columns based on operation type
                let editableColumns: ColumnProps[];

                if (isAddOperation) {
                    // For add operations, include primary key fields (they're enabled)
                    editableColumns = columns.filter((col: ColumnProps) =>
                        col.allowEdit !== false &&
                        col.field
                    );
                } else {
                    // For edit operations, exclude primary key fields (they're disabled)
                    editableColumns = columns.filter((col: ColumnProps) =>
                        col.allowEdit !== false && col.visible &&
                        !col.isPrimaryKey &&
                        col.field
                    );
                }

                const currentIndex: number = editableColumns.findIndex((col: ColumnProps) => col.field === currentField);

                if (currentIndex === -1) {
                    return false;
                }

                const isTabForward: boolean = event.key === 'Tab' && !event.shiftKey;
                const isTabBackward: boolean = event.key === 'Tab' && event.shiftKey;
                const isLastField: boolean = currentIndex === editableColumns.length - 1;
                const isFirstField: boolean = currentIndex === 0;

                // Detect boundary conditions for auto-save
                if ((isTabForward && isLastField) || (isTabBackward && isFirstField)) {
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
            }, [columns, isAddOperation, onSave]);

        /**
         * Render edit cells with proper data binding
         * For add operations, primary key fields should be focused first
         * For edit operations, skip primary key fields (they're disabled)
         */
        const renderEditCells: React.JSX.Element[] = useMemo(() => {
            if (!formState) { return null; }

            return columns.map((column: ColumnProps, index: number) => {
                // For add operations, primary key fields should be editable
                // For edit operations, primary key fields should be disabled
                // Also check column/field visiibility and the disabled prop for showAddNewRow functionality
                const isEditable: boolean = column.allowEdit !== false && column.field && column.visible &&
                                (isAddOperation || !column.isPrimaryKey) && !disabled;

                // Handle undefined values properly for truly empty edit forms
                // Let EditCell handle undefined values appropriately for each input type
                const fieldError: string = validationErrors[column.field];

                if (!isEditable) {
                    return column.visible ? (
                        <td
                            key={`edit-cell-${column.field || index}`}
                            className={'sf-rowcell sf-edit-cell sf-edit-disabled' + (isAddOperation && isLastRow ? ' sf-lastrowadded' : '') +
                                (!isAddOperation && isLastRow ? ' sf-lastrowcell' : '')}
                            data-mappinguid={column.uid}
                            role='gridcell'
                            aria-colindex={index + 1}
                            aria-label={`column header ${column.headerText}`}
                            style={{
                                textAlign: (column.textAlign?.toLowerCase() as CSSProperties['textAlign'])
                            }}
                        >
                            <FormField name={column.field}>
                                <EditCell
                                    ref={(cellRef: EditCellRef | null) => storeEditCellRef(column.field, cellRef)}
                                    column={{ ...column, allowEdit: false }}
                                    value={getObject(column.field, formState?.values) ?? formState?.values?.[column.field]}
                                    rowData={internalData}
                                    error={formState?.errors[column.field]}
                                    onChange={handleFieldChange.bind(null, column)}
                                    onBlur={handleFieldBlur.bind(null, column)}
                                    disabled={disabled}
                                    onFocus={() => {
                                        formState?.onFocus?.(column.field);
                                    }}
                                    isAdd={isAddOperation}
                                    formState={formState}
                                />
                            </FormField>
                        </td>
                    ) : (
                        <td
                            key={`edit-cell-${column.field}`}
                            className='sf-rowcell sf-hide'
                        ></td>
                    );
                }

                return column.visible ? (
                    <td
                        key={`edit-cell-${column.field}`}
                        className={'sf-rowcell sf-edit-cell' + (isAddOperation && isLastRow ? ' sf-lastrowadded' : '') +
                            (!isAddOperation && isLastRow ? ' sf-lastrowcell' : '')}
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
                                rowData={internalData}
                                error={formState?.errors[column.field]}
                                onChange={handleFieldChange.bind(null, column)}
                                onBlur={handleFieldBlur.bind(null, column)}
                                disabled={disabled}
                                onFocus={() => {
                                    formState?.onFocus?.(column.field);
                                }}
                                isAdd={isAddOperation}
                                formState={formState}
                            />
                        </FormField>
                    </td>
                ) : (
                    <td
                        key={`edit-cell-${column.field}`}
                        className='sf-rowcell sf-hide'
                    ></td>
                );
            });
        }, [columns, internalData, validationErrors, isAddOperation, disabled, handleFieldChange,
            handleFieldBlur, handleEnter, handleEscape, storeEditCellRef
        ]);

        // Render custom edit template if provided
        if (CustomTemplate) {
            return (
                <tr className={`sf-row ${isAddOperation ? 'sf-addedrow' : 'sf-editedrow'}`}>
                    <td colSpan={getVisibleColumns?.().length} className='sf-editcell sf-normaledit'>
                        <Form
                            ref={formRef}
                            rules={formValidationRules}
                            initialValues={internalData as Record<string, FormValueType>}
                            validateOnChange={!(isAddOperation && editModule?.isShowAddNewRowActive) || (isAddOperation &&
                            formState && Object.keys(formState.errors).length > 0)}
                            onFormStateChange={setFormState}
                            className={'sf-gridform' + (cssClass !== '' ? ' ' + cssClass : '')}
                            id={`grid-edit-form-${editRowIndex}`}
                            aria-label={`${isAddOperation ? 'Add' : 'Edit'} Record Form`}
                            role='form'
                        >
                            <div className='sf-edit-template-container'>
                                <CustomTemplate
                                    rowData={internalData}
                                    columns={columns}
                                    validationErrors={validationErrors}
                                    onSave={onSave}
                                    onCancel={onCancel}
                                    onFieldChange={stableOnFieldChange}
                                    formState={formState}
                                />
                            </div>
                            {formState && Object.keys(formState.errors).length > 0 && (
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
        }, [handleTabBoundaryNavigation]);

        /**
         * Enhanced focus management for proper auto-focus behavior
         * Only focus on initial mount and when starting a new edit session
         */
        const hasInitialFocusAttempted: React.RefObject<boolean> = useRef(false);
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
                    activeElement.closest('.sf-editedrow') ||
                    activeElement.closest('.sf-addedrow')
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
        const colGroupContent: JSX.Element = useMemo<JSX.Element>(() => (
            <colgroup
                key={`${id}-${isAddOperation ? 'add' : 'edit'}-colgroup`}
                id={`${id}-${isAddOperation ? 'add' : 'edit'}-colgroup`}
            >
                {ColElements.length ? ColElements : null}
            </colgroup>
        ), [ColElements, id, isAddOperation]);

        return rowUid ? (
            <tr
                className={'sf-row ' + (rowUid.includes('grid-add-row') ? 'sf-addedrow' : 'sf-editedrow')}
                aria-rowindex={editRowIndex + 1}
                data-uid={rowUid}
                style={{ height: `${rowHeight}px` }}
            >
                <td colSpan={getVisibleColumns?.().length} className='sf-editcell sf-normaledit'>
                    <Form
                        ref={formRef}
                        rules={formValidationRules}
                        initialValues={internalData as Record<string, FormValueType>}
                        validateOnChange={!(isAddOperation && editModule?.isShowAddNewRowActive) || (isAddOperation &&
                            formState && Object.keys(formState.errors).length > 0)}
                        onFormStateChange={(args: FormState) => {
                            setFormState(args);
                        }}
                        className={'sf-gridform' + (cssClass !== '' ? ' ' + cssClass : '')}
                        id={`grid-edit-form-${editRowIndex}`}
                        aria-label={`${isAddOperation ? 'Add' : 'Edit'} Record Form`}
                        role='form'
                    >
                        <table
                            className='sf-table sf-inline-edit'
                            cellSpacing='0.25'
                            role='grid'
                            style={{ borderCollapse: 'separate', borderSpacing: '0.25px', width: '100%' }}
                        >
                            {colGroupContent}
                            <tbody role='rowgroup'>
                                <tr
                                    role='row'
                                    style={{ height: `${rowHeight}px` }}
                                >
                                    {renderEditCells}
                                </tr>
                            </tbody>
                        </table>

                        {formState && Object.keys(formState.errors).length > 0 && (
                            <ValidationTooltips formState={formState} editCellRefs={editCellRefs} />
                        )}
                    </Form>
                </td>
            </tr>
        ) : (
            <></>
        );
    }));

InlineEditForm.displayName = 'InlineEditForm';
