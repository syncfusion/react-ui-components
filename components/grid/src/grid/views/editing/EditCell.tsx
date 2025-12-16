import { forwardRef, useImperativeHandle, useRef, RefObject, useCallback, JSX, isValidElement, memo, ReactElement, RefAttributes, createElement } from 'react';
import { ActionType, EditType, ValueType } from '../../types';
import { MutableGridSetter } from '../../types/interfaces';
import { GridRef } from '../../types/grid.interfaces';
import { EditParams, EditCellProps, EditCellRef, EditCellInputRef } from '../../types/edit.interfaces';
import { TextBox, ITextBox, TextBoxProps } from '@syncfusion/react-inputs';
import { NumericTextBox, INumericTextBox, NumericTextBoxProps, TextBoxChangeEvent, NumericChangeEvent } from '@syncfusion/react-inputs';
import { Checkbox, ICheckbox, CheckboxProps, CheckboxChangeEvent } from '@syncfusion/react-buttons';
import { DatePicker, IDatePicker, DatePickerProps, DatePickerChangeEvent } from '@syncfusion/react-calendars';
import { DropDownList, IDropDownList, DropDownListProps, ChangeEvent as DDLChangeEvent, DataLoadEvent } from '@syncfusion/react-dropdowns';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { DataManager, DataResult, DataUtil, Predicate, Query } from '@syncfusion/react-data';
import { getCustomDateFormat } from '../../utils';
import { getNumberPattern, Position } from '@syncfusion/react-base';

/**
 * EditCell component for rendering different types of edit inputs
 *
 * @param props - EditCell component props
 * @param ref - Forward ref for imperative methods
 * @returns EditCell component
 */
export const EditCell: <T>(props: EditCellProps<T> & RefAttributes<EditCellRef>) => ReactElement =
    memo(forwardRef<EditCellRef, EditCellProps>(<T, >({
        column,
        value,
        data,
        error,
        onChange,
        onBlur,
        onFocus,
        isAdd,
        disabled,
        formState,
        rowObject,
        popupRef
    }: EditCellProps<T>, ref: React.ForwardedRef<EditCellRef>) => {
        // Type for component refs that can be either native HTML elements or Syncfusion components
        const inputRef: RefObject<EditCellInputRef> = useRef<EditCellInputRef>(null);

        // Access grid context to get complete dataSource for dropdown
        const gridContext: Partial<GridRef<T>> & Partial<MutableGridSetter<T>> = useGridComputedProvider<T>();
        const { cssClass, commandColumnModule, editModule } = useGridMutableProvider();
        const { commandEdit } = commandColumnModule;
        const dataSource: T[] | DataManager | DataResult = gridContext.dataSource;

        /**
         * Focuses the input element (works with both native inputs and Syncfusion components)
         * Enhanced focus handling with proper element checking
         */
        const focus: () => void = useCallback(() => {
            // Don't focus disabled elements
            // Primary key fields should be enabled during add operations
            // Added disabled prop to fully support showAddNewRow functionality
            const isDisabled: boolean = disabled || column.allowEdit === false || (column.isPrimaryKey === true && !isAdd);
            if (isDisabled || !inputRef.current) {
                return;
            }

            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                const currentInput: HTMLInputElement | HTMLSelectElement | ITextBox | INumericTextBox | ICheckbox | IDatePicker
                | IDropDownList = inputRef.current;

                // Check if currentInput is a valid DOM element before using DOM methods
                if (!currentInput) {
                    return;
                }

                if ('element' in currentInput && currentInput.element) {
                    // For Syncfusion components, focus the underlying element
                    const element: HTMLElement = currentInput.element as HTMLElement;
                    if (element && typeof element.querySelector === 'function') {
                        if (element && !element.hasAttribute('disabled') && !(element.hasAttribute('readonly') && !element.classList.contains('sf-dropdownlist')) && typeof element.focus === 'function') {
                            ((element.classList.contains('sf-date-wrapper') || element.classList.contains('sf-datepicker')) ? element.querySelector('input') : element).focus();
                        }
                    }
                    else if (element && !element.hasAttribute('disabled') && !element.hasAttribute('readonly') && typeof element.focus === 'function') {
                        element.focus();
                    }
                }
            });
        }, [column.allowEdit, column.isPrimaryKey, isAdd]);

        /**
         * Gets the current value
         *
         * @returns {ValueType | Object | null} The current value of the edit cell
         */
        const getValue: () => ValueType | Object | null = (): ValueType | Object | null => {
            return value;
        };

        /**
         * Sets the value
         */
        const setValue: (newValue: ValueType | Object | null) => void = useCallback((newValue: ValueType | Object | null) => {
            onChange?.(newValue);
        }, [onChange, value]);

        // Expose imperative methods via ref
        useImperativeHandle(ref, () => ({
            focus,
            getValue,
            setValue,
            inputRef
        }), [focus, getValue, setValue, onChange, isAdd, inputRef]);

        /**
         * Handle Syncfusion component change events
         * Prevents input values from clearing during typing
         */
        const handleSyncfusionChange: (newValue: ValueType | null | Object) => void =
            useCallback((newValue: ValueType | null) => {
                // Call onChange immediately for form validator state real-time updates
                onChange?.(newValue);
            }, [onChange]);

        /**
         * Handle Syncfusion component blur events
         * Enhanced blur handling with proper element checking and validation trigger
         */
        const handleSyncfusionBlur: () => void = useCallback(() => {
            setTimeout(() => {
                onBlur?.(value);
            }, 0); // Datepicker blur validation remove fix
        }, [onBlur, value, formState]);

        /**
         * Handle Syncfusion component focus events
         * Enhanced focus handling to maintain focus state
         */
        const handleSyncfusionFocus: () => void = useCallback(() => {
            onFocus?.();
        }, [onFocus, formState]);

        /**
         * Render editor component with fallback to HTML input
         * This structure allows easy replacement when Syncfusion components become available
         * Added disabled state support for non-editable columns
         * Primary key fields should be enabled during add operations
         *
         * @param {string} editorType - The type of editor to render (textbox, numeric, checkbox, etc.)
         * @param {Object} editorProps - Additional properties to pass to the editor component
         * @returns {JSX.Element} The rendered editor component as JSX element
         */
        const renderEditor: (editorType: string, editorProps?: EditParams) => JSX.Element =
            (editorType: string, editorProps: EditParams = {}): JSX.Element => {
                // Use isAdd parameter to determine if this is an add operation
                // This replaces the complex isAddOperation calculation with the passed parameter
                // Added disabled prop to fully support showAddNewRow functionality
                const isDisabled: boolean = disabled || column.allowEdit === false || (column.isPrimaryKey === true && !isAdd);
                const baseProps: {[key: string]: string | number | boolean} = {
                    'data-mappinguid': column.uid,
                    'id': `${commandEdit.current ? rowObject.uid + '-' : ''}grid-edit-${column.field}`
                };
                const popupMode: boolean = editModule.editSettings.mode === 'Popup' && popupRef ? true : false;
                const placeHolder: string = column.headerText ? column.headerText : column.field;

                switch (editorType) {
                case 'textbox':
                    return (
                        <TextBox
                            ref={inputRef as React.Ref<ITextBox>}
                            className={`sf-field${formState?.errors[column.field] ?
                                ' sf-error' : ''}` + (cssClass !== '' ? (' ' + cssClass) : '')}
                            value={value?.toString() || ''}
                            onChange={isDisabled ? undefined : (event: TextBoxChangeEvent) =>
                                handleSyncfusionChange(event.value)}
                            onBlur={isDisabled ? undefined : handleSyncfusionBlur}
                            onFocus={isDisabled ? undefined : handleSyncfusionFocus}
                            labelMode={'Never'}
                            disabled={isDisabled}
                            readOnly={isDisabled}
                            {...(popupMode ? { placeholder: placeHolder, labelMode: 'Always' } : {})}
                            {...baseProps}
                            {...editorProps as TextBoxProps}
                        />
                    );

                case 'numeric':
                    return (
                        <NumericTextBox
                            ref={inputRef as React.Ref<INumericTextBox>}
                            className={`sf-field${formState?.errors[column.field] ?
                                ' sf-error' : ''}` + (cssClass !== '' ? (' ' + cssClass) : '')}
                            format={(typeof (column.format) === 'object' ? getNumberPattern(column.format, false)?.toLowerCase() :
                                (column.format as string)?.toLowerCase()) ?? 'n2'} // only provided string format support.
                            value={value as number || null}
                            onChange={isDisabled ? undefined : (event: NumericChangeEvent) =>
                                handleSyncfusionChange(event.value)}
                            onBlur={isDisabled ? undefined : handleSyncfusionBlur}
                            onFocus={isDisabled ? undefined : handleSyncfusionFocus}
                            labelMode={'Never'}
                            disabled={isDisabled}
                            readOnly={isDisabled}
                            role="spinbutton"
                            autoComplete="off"
                            {...(popupMode ? { placeholder: placeHolder, labelMode: 'Always' } : {})}
                            {...baseProps}
                            {...editorProps as NumericTextBoxProps}
                        />
                    );

                case 'checkbox':
                    return (
                        <Checkbox
                            ref={inputRef as React.Ref<ICheckbox>}
                            className={`sf-field${formState?.errors[column.field] ?
                                ' sf-error' : ''}` + (cssClass !== '' ? (' ' + cssClass) : '')}
                            checked={Boolean(value)}
                            onChange={isDisabled ? undefined : (event: CheckboxChangeEvent) =>
                                handleSyncfusionChange(event.value)}
                            onBlur={isDisabled ? undefined : (args: React.FocusEventHandler<HTMLInputElement> &
                            React.FocusEvent<HTMLInputElement>) => {
                                args.target.closest('.sf-checkbox-wrapper.sf-field')?.classList.remove('sf-focus');
                                handleSyncfusionBlur();
                            }}
                            onFocus={isDisabled ? undefined : (args: React.FocusEventHandler<HTMLInputElement> &
                            React.FocusEvent<HTMLInputElement>) => {
                                args.target.closest('.sf-checkbox-wrapper.sf-field')?.classList.add('sf-focus');
                                handleSyncfusionFocus();
                            }}
                            label={' '}
                            disabled={isDisabled}
                            {...(popupMode ? { label: placeHolder, labelPlacement: Position.Left } : {})}
                            {...baseProps}
                            {...editorProps as Omit<CheckboxProps, 'size'>}
                        />
                    );

                case 'datepicker':
                    return (
                        <DatePicker
                            ref={inputRef as React.Ref<IDatePicker>}
                            className={`sf-field${formState?.errors[column.field] ?
                                ' sf-error' : ''}` + (cssClass !== '' ? (' ' + cssClass) : '')}
                            value={value ? new Date(value as Date) : null}
                            onChange={isDisabled ? undefined : ((args: DatePickerChangeEvent) => {
                                handleSyncfusionChange(args.value as Date);
                            }) as any}
                            format={column.format ? getCustomDateFormat(column.format, column.type) : 'M/d/yyyy'} // only provided string format support
                            onClose={isDisabled ? undefined : handleSyncfusionBlur}
                            onOpen={isDisabled ? undefined : handleSyncfusionFocus}
                            labelMode={'Never'}
                            disabled={isDisabled}
                            onBlur={isDisabled ? undefined : handleSyncfusionBlur}
                            readOnly={isDisabled}
                            {...(popupMode ? { placeholder: placeHolder, labelMode: 'Always' } : {})}
                            {...baseProps}
                            {...editorProps as DatePickerProps}
                        />
                    );

                case 'dropdown':
                    return (
                        <DropDownList
                            ref={inputRef as React.Ref<IDropDownList>}
                            className={`sf-field${formState?.errors[column.field] ?
                                ' sf-error' : ''}` + (cssClass !== '' ? (' ' + cssClass) : '')}
                            value={value}
                            dataSource={(dataSource instanceof DataManager ? dataSource :
                                'result' in dataSource ? dataSource.result : new DataManager(dataSource as Object[])) as
                                DataManager | string[] | { [key: string]: object; }[] | number[] | boolean[]}
                            fields={{ value: column.field }}
                            query={new Query().where(new Predicate(column.field, 'notEqual', null, true, false)).select(
                                editorProps.fields
                                    ? [editorProps.fields.value, editorProps.fields.text].filter(Boolean)
                                    : [column.field])
                            }
                            onDataLoad={(e: DataLoadEvent) => {
                                e.data = DataUtil.distinct(e.data as Object[], column.field, true) as { [key: string]: unknown; }[];
                            }}
                            onChange={isDisabled ? undefined : (args: DDLChangeEvent) => {
                                handleSyncfusionChange(args.value);
                            }}
                            onClose={isDisabled ? undefined : handleSyncfusionBlur}
                            onOpen={isDisabled ? undefined : handleSyncfusionFocus}
                            disabled={isDisabled}
                            onBlur={isDisabled ? undefined : handleSyncfusionBlur}
                            popupSettings={{height: '200px', width: editorProps?.popupSettings?.width || '100%'}}
                            sortOrder={(editorProps as DropDownListProps).sortOrder}
                            labelMode={'Never'}
                            readOnly={isDisabled}
                            allowObjectBinding={editorProps.allowObjectBinding || false}
                            filterable={editorProps.filterable || false}
                            filterType={editorProps.filterType || 'StartsWith'}
                            ignoreAccent={editorProps.ignoreAccent || false}
                            ignoreCase={true}
                            {...(popupMode ? {
                                zindex: parseInt(window.getComputedStyle(popupRef.current.element).zIndex, 10),
                                placeholder: placeHolder,
                                labelMode: 'Always'
                            } : {})}
                            {...baseProps}
                            {...editorProps as DropDownListProps}
                        />
                    );

                default:
                    return (
                        <TextBox
                            ref={inputRef as React.Ref<ITextBox>}
                            className={`sf-field${formState?.errors[column.field] ?
                                ' sf-error' : ''}` + (cssClass !== '' ? (' ' + cssClass) : '')}
                            value={value?.toString() || ''}
                            onChange={isDisabled ? undefined : (event: TextBoxChangeEvent) =>
                                handleSyncfusionChange(event.value)}
                            onBlur={isDisabled ? undefined : handleSyncfusionBlur}
                            onFocus={isDisabled ? undefined : handleSyncfusionFocus}
                            labelMode={'Never'}
                            disabled={isDisabled}
                            readOnly={isDisabled}
                            {...(popupMode ? { placeholder: placeHolder, labelMode: 'Always' } : {})}
                            {...baseProps}
                            {...editorProps as TextBoxProps}
                        />
                    );
                }
            };

        // Render custom edit template if provided
        if (column.editTemplate) {
            if (typeof column.editTemplate === 'string' || isValidElement(column.editTemplate)) {
                return column.editTemplate;
            } else {
                return createElement(column.editTemplate, {
                    defaultValue: value,
                    column,
                    data,
                    error,
                    action: isAdd ? 'Add' : ActionType.Edit,
                    onChange
                });
            }
        }

        // Support edit.type property patterns
        const editType: string | EditType = column.edit?.type;
        const editParams: EditParams = column.edit?.params || {};

        // Render based on edit type configuration
        if (editType) {
            let editorComponent: JSX.Element;
            switch (editType) {

            case EditType.NumericTextBox:
                editorComponent = renderEditor('numeric', editParams);
                break;

            case EditType.TextBox:
                editorComponent = renderEditor('textbox', {
                    ...editParams
                });
                break;

            case EditType.CheckBox:
                editorComponent = renderEditor('checkbox', editParams);
                break;

            case EditType.DatePicker:
                // Use DatePicker component for datePickerEdit
                editorComponent = renderEditor('datepicker', editParams);
                break;

            case EditType.DropDownList:
                // Use DropDownList component for dropDownEdit
                editorComponent = renderEditor('dropdown', editParams);
                break;
            }

            return editorComponent;
        }

        // Render default type
        const editorComponent: JSX.Element = renderEditor('', {...editParams});
        return (
            <>
                {editorComponent}
            </>
        );
    })) as <T>(props: EditCellProps<T> & RefAttributes<EditCellRef>) => ReactElement;

(EditCell as React.ForwardRefExoticComponent<EditCellProps & React.RefAttributes<EditCellRef>>).displayName = 'EditCell';
