import { useCallback, useRef, useState, useEffect, useMemo, JSX, RefObject, memo, forwardRef, useImperativeHandle, RefAttributes, CSSProperties } from 'react';
import { Form, FormField, IFormValidator, FormState, FormValueType } from '@syncfusion/react-inputs/src/form-validator/index';
import { ValueType, IValueFormatter } from '../../types/interfaces';
import { ColumnProps } from '../../types/column.interfaces';
import { EditType } from '../../types/enum';
import { EditCellRef, CellEditFormProps, CellEditFormRef } from '../../types/edit.interfaces';
import { EditCell } from './EditCell';
import { ValidationTooltips } from './ValidationTooltips';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts/GridProviders';
import { handleFieldChangeFn, handleFieldBlurFn } from './InlineEditForm';
import { useFormValidationRules } from '../../hooks/useFormValidationRules';
import { FormulaEditor } from './FormulaEditor';
import { getObject, getLeftPinnedOffsets, getRightPinnedOffsets, getLeftPinnedBoundaryField, getRightPinnedBoundaryField } from '../../utils/utils';

// Constants for CSS classes and service keys
const CSS_CLASS_PREFIX: string = 'sf-';
const CSS_ALIGN_SUFFIX: string = '-align';
const GRID_EDIT_CELL_CLASS: string = 'sf-grid-edit-cell sf-cell-editing';
const GRID_CELL_FORM_CLASS: string = 'sf-grid-cell-edit-form';
const VALUE_FORMATTER_SERVICE_KEY: string = 'valueFormatter';
const LEFT_PINNED_CELL: string = 'sf-left-pinned-cell';
const RIGHT_PINNED_CELL: string = 'sf-right-pinned-cell';
const LEFT_MOST_PINNED_CELL: string = 'sf-left-most-pinned-cell';
const RIGHT_MOST_PINNED_CELL: string = 'sf-right-most-pinned-cell';


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
            rowIndex,
            rowData,
            onFieldChange,
            validationErrors,
            onValidationChange
        }: CellEditFormProps<T>, ref: React.ForwardedRef<CellEditFormRef>): JSX.Element => {
            const formRef: RefObject<IFormValidator> = useRef<IFormValidator>(null);
            const editCellRef: RefObject<EditCellRef> = useRef<EditCellRef>(null);
            const editCellRefs: RefObject<{ [key: string]: EditCellRef; }> = useRef<{ [key: string]: EditCellRef }>({});
            const tdRef: RefObject<HTMLTableCellElement> = useRef<HTMLTableCellElement>(null);
            const { serviceLocator, getVisibleColumns, editSettings } = useGridComputedProvider<T>();
            const { formulaModule, offsetX, uiColumns } = useGridMutableProvider<T>();
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
            const leftPinnedOffsets: Map<string, number> = useMemo(() =>
                getLeftPinnedOffsets<T>(uiColumns as RefObject<ColumnProps<T>[]>, [column]), [column, uiColumns?.current]);
            const rightPinnedOffsets: Map<string, number> = useMemo(() =>
                getRightPinnedOffsets<T>(uiColumns as RefObject<ColumnProps<T>[]>, [column]), [column, uiColumns?.current]);
            const columnKey: string = column.field ?? column.headerText;
            const isLeftPinned: boolean = leftPinnedOffsets.has(columnKey);
            const isRightPinned: boolean = rightPinnedOffsets.has(columnKey);
            const leftPinnedBoundaryField: string | undefined = getLeftPinnedBoundaryField(leftPinnedOffsets);
            const rightPinnedBoundaryField: string | undefined = getRightPinnedBoundaryField(rightPinnedOffsets);
            const pinnedClassName: string = isLeftPinned ? ` ${LEFT_PINNED_CELL}` :
                (isRightPinned ? ` ${RIGHT_PINNED_CELL}` : '');
            const pinnedEdgeClassName: string = isLeftPinned && columnKey === leftPinnedBoundaryField ?
                ` ${LEFT_MOST_PINNED_CELL}` :
                (isRightPinned && columnKey === rightPinnedBoundaryField ? ` ${RIGHT_MOST_PINNED_CELL}` : '');
            const pinnedCellStyle: CSSProperties = isLeftPinned ? {
                left: `${(leftPinnedOffsets.get(columnKey) ?? 0) - offsetX}px`
            } : (isRightPinned ? {
                right: `${rightPinnedOffsets.get(columnKey) ?? 0}px`
            } : {});

            return (
                <td
                    ref={tdRef}
                    className={`${GRID_EDIT_CELL_CLASS}${pinnedClassName}${pinnedEdgeClassName}${!!column?.displayAsCheckBox && column?.edit?.type === EditType.CheckBox ? ` ${alignClass}` : ''}`}
                    style={pinnedCellStyle}
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
                            {editSettings?.mode === 'Cell' && formulaModule && column.allowFormula ? (
                                <FormulaEditor
                                    value={String(getObject(column.field, formState?.values) ?? formState?.values?.[column.field] ?? '')}
                                    columns={getVisibleColumns?.() ?? [column]}
                                    formulaModule={formulaModule}
                                    rowIndex={rowIndex}
                                    onChange={(newValue: string) => handleChange(newValue)}
                                    onBlur={(newValue: string) => handleBlur(newValue)}
                                />
                            ) : (
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
                            )}
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
