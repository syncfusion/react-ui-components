import * as React from 'react';
import { useState, useCallback, memo, RefAttributes, forwardRef, ReactElement, useRef, useMemo, JSX, RefObject, CSSProperties, useImperativeHandle, createElement } from 'react';
import { Dialog, IDialog } from '@syncfusion/react-popups';
import { Button, ICheckbox } from '@syncfusion/react-buttons';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { EditCell, handleFieldBlurFn, handleFieldChangeFn, internalDataFn, ValidationTooltips } from '../index';
import { ColumnProps, InlineEditFormRef, EditCellRef, IValueFormatter, ValueType, UseEditResult } from '../../types';
import { IL10n, isNullOrUndefined, Variant } from '@syncfusion/react-base';
import { Form, FormField, FormState, FormValueType, IFormValidator, INumericTextBox, ITextBox, ValidationRules } from '@syncfusion/react-inputs';
import { getObject } from '../../utils';
import { IDatePicker } from '@syncfusion/react-calendars';
import { IDropDownList } from '@syncfusion/react-dropdowns';
import { useFormValidationRules } from '../../hooks';

/**
 * PopupEditForm component renders a modal dialog for editing grid records with form validation.
 *
 * @param {RefAttributes<InlineEditFormRef<T>>} props - Component props (forwarded ref only)
 * @param {React.ForwardedRef<InlineEditFormRef<T>>} ref - Imperative methods ref for validateForm, getEditCells, getFormElement, getCurrentData
 * @returns {ReactElement} Modal dialog with form fields, validation tooltips, and save/cancel buttons
 */
export const PopupEditForm: <T>(props: RefAttributes<InlineEditFormRef<T>>) => ReactElement =
    memo(forwardRef<InlineEditFormRef>(<T, >(_props: {}, ref: React.ForwardedRef<InlineEditFormRef<T>>) => {

        const { id, serviceLocator, getPrimaryKeyFieldNames, columns } = useGridComputedProvider<T>();
        const { cssClass, editModule } = useGridMutableProvider<T>();

        const formatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>('valueFormatter');
        const { editSettings, editData, originalData, editRowIndex, validationErrors, updateEditData } = editModule;
        const primaryKey: string = getPrimaryKeyFieldNames?.()[0];
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
        const formRef: React.RefObject<IFormValidator> = useRef<IFormValidator>(null);
        const editCellRefs: React.RefObject<{ [field in keyof T]?: EditCellRef }> = useRef<{ [field in keyof T]?: EditCellRef }>({});
        const rowRef: RefObject<HTMLTableRowElement> = useRef<HTMLTableRowElement>(null);

        const dialogClass: string = cssClass ? cssClass + ' sf-grid-popup-edit' : 'sf-grid-popup-edit';

        const isAddOperation: boolean = isNullOrUndefined(originalData);
        const [formState, setFormState] = useState<FormState | null>(null);

        const popupRef: React.RefObject<IDialog> = useRef<IDialog>(null);
        const focusableInputRef: React.RefObject<HTMLElement> = useRef<HTMLElement>(null);

        const formValidationRules: ValidationRules = useFormValidationRules(columns);

        const [internalData, setInternalData] = useState<T>(internalDataFn(isAddOperation, editData, columns as ColumnProps<T>[]));

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

        const handleFieldChange: (column: ColumnProps<T>, value: ValueType, formatter: IValueFormatter, internalData: T,
            setInternalData: (value: React.SetStateAction<T>) => void, formState: FormState,
            stableOnFieldChange: (field: string, value: ValueType | null) => void) =>
        void = useCallback(handleFieldChangeFn, [formState]);

        const handleFieldBlur: (column: ColumnProps<T>, value: ValueType | Record<string, unknown>, formatter: IValueFormatter,
            internalData: T, setInternalData: (value: React.SetStateAction<T>) => void, isAddOperation: boolean,
            editModule: UseEditResult<T>, formState: FormState, formRef: RefObject<IFormValidator>) =>
        void = useCallback(handleFieldBlurFn, [formState]);

        /**
         * Render edit fields with proper data binding
         */
        const renderEditFields: React.JSX.Element[] = useMemo(() => {
            if (!formState) { return null; }

            return columns.map((column: ColumnProps<T>) => {

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
                            className={'sf-cell sf-grid-edit-cell'}
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
                                        if (cellRef?.inputRef?.current && editable && isNullOrUndefined(focusableInputRef.current)) {
                                            const currentInput: HTMLInputElement | HTMLSelectElement | ITextBox | INumericTextBox
                                            | ICheckbox | IDatePicker | IDropDownList = cellRef.inputRef.current;

                                            if ('element' in currentInput && currentInput.element) {
                                                const element: HTMLElement = currentInput.element as HTMLElement;
                                                focusableInputRef.current = (element.classList.contains('sf-date-wrapper') || element.classList.contains('sf-datepicker')) ? element.querySelector('input') : element;
                                            }
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
                                    onFocus={() => {
                                        formState?.onFocus?.(column.field);
                                    }}
                                    isAdd={isAddOperation}
                                    formState={formState}
                                    popupRef={popupRef}
                                />
                            </FormField>
                        </td>
                    </tr>
                );
            });
        }, [columns, internalData, validationErrors, isAddOperation, handleFieldChange, handleFieldBlur, storeEditCellRef, formState]);

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
         * Get current form data
         */
        const getCurrentData: () => T = useCallback(() => {
            return formState?.values as T;
        }, [formState]);

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
                            className={cssClass ? cssClass + ' sf-grid-popup-edit-cancel' : 'sf-grid-popup-edit-cancel'}
                            aria-label={localization?.getConstant('cancelButtonLabel')}
                        >
                            {localization?.getConstant('cancelButtonLabel')}
                        </Button>
                        <Button
                            variant={Variant.Standard}
                            className={cssClass ? cssClass + ' sf-grid-popup-edit-save' : 'sf-grid-popup-edit-save'}
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
                            className={'sf-grid-edit-form' + (cssClass !== '' ? ' ' + cssClass : '')}
                            id={`grid-edit-form-${editRowIndex}`}
                            aria-label={`${isAddOperation ? localization?.getConstant('addButtonLabel') : localization?.getConstant('editButtonLabel')} ${localization?.getConstant('recordFormLabel')}`}
                            role='form'
                        >
                            <table
                                className='sf-grid-edit-table'
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
    })) as <T>(props: RefAttributes<InlineEditFormRef<T>>) => ReactElement;

(PopupEditForm as React.ForwardRefExoticComponent<React.RefAttributes<InlineEditFormRef>>).displayName = 'PopupEditForm';
