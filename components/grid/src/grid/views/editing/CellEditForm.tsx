import { useCallback, useRef, useState, useEffect, useMemo, JSX, RefObject, memo, forwardRef, useImperativeHandle, RefAttributes } from 'react';
import { Form, FormField, IFormValidator, FormState, FormValueType } from '@syncfusion/react-inputs';
import { ValueType, EditCellRef, IValueFormatter, EditType, CellEditFormProps, CellEditFormRef } from '../../types';
import { EditCell } from './EditCell';
import { ValidationTooltips } from './ValidationTooltips';
import { useGridComputedProvider } from '../../contexts';
import { handleFieldChangeFn, handleFieldBlurFn } from './InlineEditForm';
import { useFormValidationRules } from '../../hooks/useFormValidationRules';
import { getObject } from '../../utils/utils';

// Constants for CSS classes and service keys
const CSS_CLASS_PREFIX: string = 'sf-';
const CSS_ALIGN_SUFFIX: string = '-align';
const GRID_EDIT_CELL_CLASS: string = 'sf-grid-edit-cell sf-cell-editing';
const GRID_CELL_FORM_CLASS: string = 'sf-grid-cell-edit-form';
const VALUE_FORMATTER_SERVICE_KEY: string = 'valueFormatter';


/**
 * CellEditForm component renders a single cell editor with validation support.
 *
 * @template T - Row data type
 * @param props - CellEditForm component props
 * @param ref - Forward ref to expose CellEditFormRef with formRef, editCellRef, formState, and methods
 * @returns A table cell editor element
 */

export const CellEditForm: <T>(props: CellEditFormProps<T> & RefAttributes<CellEditFormRef>) => JSX.Element = memo(
    forwardRef<CellEditFormRef, CellEditFormProps>(
        <T, >({
            field,
            value,
            column,
            rowData,
            onFieldChange,
            validationErrors,
            onValidationChange
        }: CellEditFormProps<T>, ref: React.ForwardedRef<CellEditFormRef>): JSX.Element => {
            const formRef: RefObject<IFormValidator> = useRef<IFormValidator>(null);
            const editCellRef: RefObject<EditCellRef> = useRef<EditCellRef>(null);
            const editCellRefs: RefObject<{ [key: string]: EditCellRef; }> = useRef<{ [key: string]: EditCellRef }>({});
            const tdRef: RefObject<HTMLTableCellElement> = useRef<HTMLTableCellElement>(null);
            const { serviceLocator } = useGridComputedProvider<T>();
            const formatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>(VALUE_FORMATTER_SERVICE_KEY);

            // Initialize internal data state with single field
            const [internalData, setInternalData] = useState<T>({ [field]: value } as T);
            const [isAddOperation] = useState<boolean>(false); // Cell edit is always edit, not add

            // Get validation rules for this column
            const { rules: formValidationRules } = useFormValidationRules([column]);

            // FormValidator state management
            const [formState, setFormState] = useState<FormState | null>(null);

            const error: string | undefined = validationErrors?.[field as string] || formState?.errors?.[field as string];

            /**
             * Expose CellEditForm state to parent component.
             * Provides access to formRef, and editCellRef for validation and editing control.
             */
            useImperativeHandle(ref, () => ({
                formRef,
                editCellRef
            }), [formRef, editCellRef]);

            // Stable callback wrappers
            const stableOnFieldChange: (fieldName: string, newValue: ValueType) => void =
                useCallback((fieldName: string, newValue: ValueType): void => {
                    onFieldChange(fieldName, newValue);
                }, [onFieldChange]);

            /**
             * Handle value change in the editor using InlineEditForm's logic.
             * Integrates with FormValidator for real-time validation.
             *
             * @param {ValueType} newValue - The new value from the editor
             */
            const handleChange: (newValue: ValueType) => void = useCallback((newValue: unknown): void => {
                handleFieldChangeFn(
                    column,
                    newValue as ValueType,
                    formatter,
                    internalData,
                    setInternalData,
                    formState as FormState,
                    stableOnFieldChange
                );
            }, [column, formatter, internalData, formState, stableOnFieldChange]);

            /**
             * Handle blur event when the editor loses focus.
             * Triggers validation using InlineEditForm's logic.
             *
             * @param {ValueType | Object | undefined} blurValue - The current value
             */
            const handleBlur: (blurValue: Object | ValueType) => void = useCallback((blurValue: ValueType | Object | undefined): void => {
                handleFieldBlurFn(
                    column,
                    blurValue as ValueType,
                    formatter,
                    internalData,
                    setInternalData,
                    isAddOperation,
                    undefined, // editModule not needed for validation
                    formState as FormState,
                    formRef
                );
            }, [column, formatter, internalData, isAddOperation, formState]);

            /**
             * Handle focus event when the editor gains focus.
             * Can be used for tracking focus state or analytics.
             */
            const handleFocus: () => void = useCallback((): void => {
                // Optional: track focus events or update UI state
            }, []);

            // Sync validation errors from formState back to parent (editModule)
            // This ensures saveCellChanges() can check validation before saving
            useEffect(() => {
                if (onValidationChange && formState) {
                    const errors: Record<string, string> = formState.errors;
                    onValidationChange(errors as Record<string, string>);
                }
            }, [formState, onValidationChange]);

            // Auto-focus the editor when the cell enters edit mode
            // Click outside is handled by grid-level handleGridClick in useEdit.ts
            // Enter/Escape keys are handled by grid-level handleGridKeyDown in useGrid.tsx
            useEffect(() => {
                if (editCellRef.current) {
                    editCellRef.current.focus();
                }
            }, []);

            // Memoizes the CSS class for cell alignment to prevent unnecessary recomputation
            const alignClass: string = useMemo((): string => `${CSS_CLASS_PREFIX}${(column.textAlign).toLowerCase()}${CSS_ALIGN_SUFFIX}`, [column.textAlign]);

            return (
                <td
                    ref={tdRef}
                    className={GRID_EDIT_CELL_CLASS + (!!column?.displayAsCheckBox && column?.edit?.type === EditType.CheckBox ? ` ${alignClass}` : '')}
                    role="gridcell"
                    aria-invalid={!!error}
                    data-testid={`cell-edit-${String(field)}`}
                >
                    <Form
                        ref={formRef}
                        key={`cell-form-${String(field)}`}
                        initialValues={{ [field]: internalData[field as string] } as Record<string, FormValueType>}
                        rules={formValidationRules}
                        validateOnChange={true}
                        onFormStateChange={setFormState}
                        className={GRID_CELL_FORM_CLASS}
                        id={`grid-cell-edit-form-${String(field)}`}
                        aria-label="Cell Edit Form"
                        role="form"
                    >
                        <FormField name={field}>
                            <EditCell
                                ref={editCellRef}
                                column={column}
                                value={getObject(column.field, formState?.values) ?? formState?.values?.[column.field]}
                                data={rowData}
                                error={error}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onFocus={handleFocus}
                                autoFocus={true}
                                formState={formState || undefined}
                            />
                        </FormField>
                    </Form>
                    {formState && Object.keys(formState.errors).length > 0 && (
                        <ValidationTooltips formState={formState} editCellRefs={editCellRefs} />
                    )}
                </td>
            );
        }
    )
) as <T>(props: CellEditFormProps<T> & RefAttributes<CellEditFormRef>) => React.ReactElement;
