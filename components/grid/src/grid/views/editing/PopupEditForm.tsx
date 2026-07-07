import * as React from 'react';
import { useState, useCallback, memo, forwardRef, useRef, useMemo, JSX, RefObject, CSSProperties, useImperativeHandle, createElement } from 'react';
import { Dialog, IDialog } from '@syncfusion/react-popups';
import { Button, ICheckbox } from '@syncfusion/react-buttons';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { EditCell, handleFieldBlurFn, handleFieldChangeFn, internalDataFn, ValidationTooltips } from '../index';
import { ColumnProps, InlineEditFormRef, EditCellRef, IValueFormatter, ValueType, UseEditResult } from '../../types';
import { IL10n, isNullOrUndefined, Variant } from '@syncfusion/react-base';
import { Form, FormField, FormState, FormValueType, IFormValidator, INumericTextBox, ITextBox } from '@syncfusion/react-inputs';
import { getObject } from '../../utils';
import { IDatePicker } from '@syncfusion/react-calendars';
import { IDropDownList } from '@syncfusion/react-dropdowns';
import { useFormValidationRules } from '../../hooks';

// CSS class names for popup edit form
const POPUP_EDIT_CLASS: string = 'sf-grid-popup-edit';
const POPUP_EDIT_CANCEL_CLASS: string = 'sf-grid-popup-edit-cancel';
const POPUP_EDIT_SAVE_CLASS: string = 'sf-grid-popup-edit-save';
const EDIT_CELL_CLASS: string = 'sf-cell sf-grid-edit-cell';
const EDIT_FORM_CLASS: string = 'sf-grid-edit-form';
const EDIT_TABLE_CLASS: string = 'sf-grid-edit-table';
const DATE_WRAPPER_CLASS: string = 'sf-date-wrapper';
const DATEPICKER_CLASS: string = 'sf-datepicker';

/**
 * PopupEditForm component renders a modal dialog for editing grid records with form validation.
 * Provides imperative methods for form validation, cell editing, and data retrieval via ref.
 *
 * @param {RefAttributes<InlineEditFormRef<Record<string, unknown>>>} props - Component props (forwarded ref only)
 * @param {React.ForwardedRef<InlineEditFormRef<Record<string, unknown>>>} ref - Imperative methods ref exposing validateForm, getEditCells, getFormElement, getCurrentData
 * @returns {ReactElement} Modal dialog with form fields, validation tooltips, and save/cancel buttons
 */
export const PopupEditForm: React.ForwardRefExoticComponent<React.RefAttributes<InlineEditFormRef<Record<string, unknown>>>> =
    memo(forwardRef((_props: {}, ref: React.ForwardedRef<InlineEditFormRef<Record<string, unknown>>>) => {

        const { id, serviceLocator, getPrimaryKeyFieldNames, columns } = useGridComputedProvider<Record<string, unknown>>();
        const { cssClass, editModule } = useGridMutableProvider<Record<string, unknown>>();
        const formatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>('valueFormatter');
        const { editSettings, editData, originalData, editRowIndex, validationErrors, updateEditData } = editModule;
        const primaryKey: string = getPrimaryKeyFieldNames?.()[0];
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
        const formRef: React.RefObject<IFormValidator> = useRef<IFormValidator>(null);
        const editCellRefs: React.RefObject<{ [key: string]: EditCellRef | undefined }> =
            useRef<{ [key: string]: EditCellRef | undefined }>({});
        const rowRef: RefObject<HTMLTableRowElement> = useRef<HTMLTableRowElement>(null);
        const dialogClass: string = cssClass ? cssClass + ' ' + POPUP_EDIT_CLASS : POPUP_EDIT_CLASS;
        const isAddOperation: boolean = isNullOrUndefined(originalData);
        const [formState, setFormState] = useState<FormState | null>(null);
        const popupRef: React.RefObject<IDialog> = useRef<IDialog>(null);
        const focusableInputRef: React.RefObject<HTMLElement> = useRef<HTMLElement>(null);
        const { rules: formValidationRules } = useFormValidationRules(columns);
        const [internalData, setInternalData] =
            useState(internalDataFn(isAddOperation, editData, columns as ColumnProps<Record<string, unknown>>[]));

        /**
         * Extract focusable input element from component instance
         */
        const setFocusableInput: (cellRef: EditCellRef) => void = useCallback((cellRef: EditCellRef) => {
            if (cellRef?.inputRef?.current && isNullOrUndefined(focusableInputRef.current)) {
                const currentInput: HTMLInputElement | HTMLSelectElement | ITextBox | INumericTextBox
                | ICheckbox | IDatePicker | IDropDownList = cellRef.inputRef.current;

                if ('element' in currentInput && currentInput.element) {
                    const element: HTMLElement = currentInput.element as HTMLElement;
                    focusableInputRef.current = (element.classList.contains(DATE_WRAPPER_CLASS) ||
                        element.classList.contains(DATEPICKER_CLASS)) ? element.querySelector('input')
                        : element;
                }
            }
        }, []);

        const colGroupContent: JSX.Element = useMemo<JSX.Element>(() => {
            const idKey: string = `${id}-${isAddOperation ? 'add' : 'edit'}-colgroup`;
            return (
                <colgroup key={idKey} id={idKey}>
                    <col />
                </colgroup>
            );
        }, [id, isAddOperation]);

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

        const handleFieldChange: (column: ColumnProps<Record<string, unknown>>, value: ValueType, formatter: IValueFormatter,
            internalData: Record<string, unknown>, setInternalData: (value: React.SetStateAction<Record<string, unknown>>) =>
            void, formState: FormState, stableOnFieldChange: (field: string, value: ValueType | null) => void) =>
        void = useCallback(handleFieldChangeFn, [formState]);

        const handleFieldBlur: (column: ColumnProps<Record<string, unknown>>, value: ValueType | Record<string, unknown>,
            formatter: IValueFormatter, internalData: Record<string, unknown>,
            setInternalData: (value: React.SetStateAction<Record<string, unknown>>) => void, isAddOperation: boolean,
            editModule: UseEditResult<Record<string, unknown>>, formState: FormState, formRef: RefObject<IFormValidator>) =>
        void = useCallback(handleFieldBlurFn, [formState]);

        /**
         * Memoized onFocus handler to prevent unnecessary re-renders
         */
        const onEditCellFocus: (field: string) => void = useCallback((field: string) => {
            formState?.onFocus?.(field);
        }, [formState]);

        /**
         * Render edit fields with proper data binding
         */
        const renderEditFields: React.JSX.Element[] = useMemo(() => {
            if (!formState) { return null; }

            return columns.map((column: ColumnProps<Record<string, unknown>>) => {

                const editable: boolean = column.allowEdit !== false && column.visible &&
                    column.field && (isAddOperation ? column.isPrimaryKey : !column.isPrimaryKey);
                const fieldError: string = validationErrors[column.field];

                if (!column.visible) {
                    return <React.Fragment key={`edit-row-${column.field}`}></React.Fragment>;
                }

                return (
                    <tr
                        role='row'
                        key={`edit-row-${column.field}`}
                    >
                        <td
                            key={`edit-cell-${column.field}`}
                            className={EDIT_CELL_CLASS}
                            data-mappinguid={column.uid}
                            role='gridcell'
                            aria-colindex={1}
                            aria-invalid={fieldError ? 'true' : 'false'}
                            aria-label={`${localization?.getConstant('columnHeaderLabel')} ${column.headerText}`}
                            style={{
                                textAlign: (column.textAlign?.toLowerCase() as CSSProperties['textAlign'])
                            }}
                        >
                            <FormField name={column.field}>
                                <EditCell
                                    ref={(cellRef: EditCellRef | null) => {
                                        storeEditCellRef(column.field, cellRef);
                                        if (cellRef && editable) {
                                            setFocusableInput(cellRef);
                                        }
                                    }}
                                    column={column}
                                    value={getObject(column.field, formState?.values) ?? formState?.values?.[column.field]}
                                    data={internalData}
                                    error={formState?.errors[column.field]}
                                    onChange={(value: unknown) => handleFieldChange(
                                        column, value as ValueType, formatter, internalData,
                                        setInternalData, formState, updateEditData)}
                                    onBlur={(value: ValueType | Object | undefined) => handleFieldBlur(
                                        column, value as ValueType | Record<string, unknown>, formatter,
                                        internalData, setInternalData, isAddOperation, editModule, formState, formRef)}
                                    onFocus={() => onEditCellFocus(column.field)}
                                    isAdd={isAddOperation}
                                    formState={formState}
                                    popupRef={popupRef}
                                />
                            </FormField>
                        </td>
                    </tr>
                );
            });
        }, [columns, internalData, validationErrors, isAddOperation, handleFieldChange, handleFieldBlur, storeEditCellRef, formState,
            onEditCellFocus]);

        /**
         * Validate the form using FormValidator component
         */
        const validateForm: () => boolean = useCallback((): boolean => {
            if (formRef.current) {
                const isFormValid: boolean = formRef.current.validate();
                return isFormValid;
            }
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
         * Get current form internal parsed data
         */
        const getCurrentData: () => Record<string, unknown> = useCallback(() => {
            return internalData as Record<string, unknown>;
        }, [internalData]);

        /**
         * Creates popup template element from editSettings when custom template mode is enabled.
         */
        const popupTemplate: React.JSX.Element = useMemo(() => {
            return createElement(editSettings.popupTemplate, {
                data: editData,
                isAdd: isAddOperation
            });
        }, []);

        /**
         * Expose imperative methods via ref
         */
        useImperativeHandle(ref, () => ({
            rowRef: rowRef,
            validateForm,
            getEditCells,
            getFormElement,
            getCurrentData,
            editCellRefs,
            formState,
            formRef
        }), [validateForm, getEditCells, getFormElement, getCurrentData, formState,
            editCellRefs.current, formRef.current, rowRef]);

        return (
            <Dialog
                ref={popupRef}
                id={id + '_popup_edit'}
                open={true}
                modal={true}
                draggable={true}
                target={document.body}
                header={isAddOperation ? localization?.getConstant('addNewRecordLabel') : localization?.getConstant('detailsOfLabel') + ' ' + editData[`${primaryKey}`]}
                style={{ width: '464px' }}
                initialFocusRef={focusableInputRef}
                footer={
                    <>
                        <Button
                            variant={Variant.Standard}
                            className={cssClass ? cssClass + ' ' + POPUP_EDIT_CANCEL_CLASS : POPUP_EDIT_CANCEL_CLASS}
                            aria-label={localization?.getConstant('cancelButtonLabel')}
                        >
                            {localization?.getConstant('cancelButtonLabel')}
                        </Button>
                        <Button
                            variant={Variant.Standard}
                            className={cssClass ? cssClass + ' ' + POPUP_EDIT_SAVE_CLASS : POPUP_EDIT_SAVE_CLASS}
                            aria-label={localization?.getConstant('saveButtonLabel')}
                        >
                            {localization?.getConstant('saveButtonLabel')}
                        </Button>
                    </>
                }
                {...editSettings.popupSettings}
                className={editSettings.popupSettings?.className ? editSettings.popupSettings.className + ' ' + dialogClass : dialogClass}
            >
                {editSettings.mode === 'PopupTemplate' ?
                    popupTemplate
                    :
                    <div
                        ref={rowRef}
                    >
                        <Form
                            ref={formRef}
                            rules={formValidationRules}
                            initialValues={internalData as Record<string, FormValueType>}
                            validateOnChange={true}
                            onFormStateChange={(args: FormState) => {
                                setFormState(args);
                            }}
                            className={EDIT_FORM_CLASS + (cssClass !== '' ? ' ' + cssClass : '')}
                            id={`grid-edit-form-${editRowIndex}`}
                            aria-label={`${isAddOperation ? localization?.getConstant('addButtonLabel') : localization?.getConstant('editButtonLabel')} ${localization?.getConstant('recordFormLabel')}`}
                            role='form'
                        >
                            <table
                                className={EDIT_TABLE_CLASS}
                                role='grid'
                            >
                                {colGroupContent}
                                <tbody role='rowgroup'>
                                    {renderEditFields}
                                </tbody>
                            </table>

                            {formState && Object.keys(formState.errors).length > 0 && (
                                <ValidationTooltips formState={formState} editCellRefs={editCellRefs} rowRef={rowRef} />
                            )}
                        </Form>
                    </div>
                }
            </Dialog>
        );
    })) as React.ForwardRefExoticComponent<React.RefAttributes<InlineEditFormRef<Record<string, unknown>>>>;

(PopupEditForm as React.ForwardRefExoticComponent<React.RefAttributes<InlineEditFormRef<Record<string, unknown>>>>).displayName = 'PopupEditForm';
