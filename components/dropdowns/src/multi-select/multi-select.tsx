import { forwardRef, ForwardRefExoticComponent, InputHTMLAttributes, memo, Ref, RefAttributes, RefObject, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { IDropdown, Dropdown } from '../common/dropdown';
import { preRender, useStableId } from '@syncfusion/react-base';
import { DisplayMode, MultiSelectProps } from './types';
import { ChangeEvent, T } from '../drop-down-list/types';
import { DropdownInput, DropdownClearButton, DropdownIcon, DropdownMenu, DropdownHeader, DropdownListContent, DropdownNoRecords, DropdownError, DropdownFooter, DropdownChips, DropdownSelectAll, DropdownCustomValue, DropdownPrefix, DropdownSuffix } from '../common/components';
import { CSS_CLASSES } from '../common/constants';

type IMultiSelectProps = MultiSelectProps & Omit<InputHTMLAttributes<HTMLSpanElement>, keyof MultiSelectProps>;

/**
 * Imperative API for MultiSelect component
 */
export interface IMultiSelect extends MultiSelectProps {
    /**
     * Reference to the input element
     *
     * @private
     */
    element?: HTMLInputElement | null;
}

/**
 * The MultiSelect component provides an input with an integrated dropdown popup for selecting multiple options from a list.
 * It supports controlled and uncontrolled usage, local or remote data sources, filtering, custom value creation,
 * tag/delimiter display modes, checkbox selection, select all functionality, and virtualization for large datasets.
 *
 * ```typescript
 * import { MultiSelect } from "@syncfusion/react-dropdowns";
 *
 * export default function App() {
 *   const data = [
 *     { text: "Apple", value: "apple" },
 *     { text: "Banana", value: "banana" },
 *     { text: "Cherry", value: "cherry" }
 *   ];
 *
 *   return (
 *     <MultiSelect
 *       id="fruits"
 *       dataSource={data}
 *       fields={{ text: "text", value: "value" }}
 *       placeholder="Select fruits" />
 *   );
 * }
 * ```
 */
export const MultiSelect: ForwardRefExoticComponent<IMultiSelectProps & RefAttributes<IMultiSelect>> =
    forwardRef<IMultiSelect, IMultiSelectProps>((props: IMultiSelectProps, ref: Ref<IMultiSelect>) => {
        const {
            id,
            dataSource = [],
            fields,
            value,
            defaultValue,
            placeholder = '',
            disabled = false,
            readOnly = false,
            labelMode,
            size,
            variant,
            className,
            required,
            inputProps = {},
            clearButton = false,
            loading = false,
            popupSettings = {},
            open,
            defaultOpen,
            query,
            sortOrder,
            allowObjectBinding = false,
            itemTemplate,
            headerTemplate,
            footerTemplate,
            groupTemplate,
            noRecordsTemplate,
            onErrorTemplate,
            virtualization,
            ignoreCase = true,
            ignoreAccent = false,
            filterType = 'StartsWith',
            debounceDelay = 0,
            valid,
            validationMessage = '',
            validityStyles = true,
            skipDisabledItems,
            checkbox = false,
            closeOnSelect = false,
            openOnClick = true,
            maximumSelectionLength = 0,
            customValue,
            filterable,
            dropdownIcon = false,
            mode = DisplayMode.Auto,
            delimiterChar = ',',
            resizable,
            prefix,
            suffix,
            chipTemplate,
            valueTemplate,
            hideSelectedItem = false,
            addTagOnBlur,
            showSelectAll,
            selectAllText = 'Select All',
            unSelectAllText = 'Unselect All',
            enableSelectionOrder = false,
            onChange,
            helperText,
            helperTextOnFocus = false,
            helperTextDirection = 'Left',
            ...restProps
        } = props;
        const stableId: string = useStableId('sf-multiselect');
        const multiSelectId: string = id ?? stableId;
        const baseRef: RefObject<IDropdown | null> = useRef<IDropdown>(null);

        const publicAPI: Partial<IMultiSelect> = useMemo(() => ({
            id: multiSelectId,
            dataSource,
            fields,
            value,
            defaultValue,
            placeholder,
            disabled,
            readOnly,
            labelMode,
            size,
            variant,
            className,
            required,
            inputProps,
            clearButton,
            loading,
            popupSettings,
            open,
            defaultOpen,
            query,
            sortOrder,
            allowObjectBinding,
            itemTemplate,
            headerTemplate,
            footerTemplate,
            groupTemplate,
            noRecordsTemplate,
            onErrorTemplate,
            virtualization,
            ignoreCase,
            ignoreAccent,
            filterType,
            debounceDelay,
            valid,
            validationMessage,
            validityStyles,
            skipDisabledItems,
            delimiterChar,
            mode,
            checkbox,
            closeOnSelect,
            openOnClick,
            maximumSelectionLength,
            customValue,
            filterable,
            dropdownIcon,
            resizable,
            prefix,
            suffix,
            chipTemplate,
            valueTemplate,
            hideSelectedItem,
            addTagOnBlur,
            showSelectAll,
            selectAllText,
            unSelectAllText,
            enableSelectionOrder,
            helperText,
            helperTextOnFocus,
            helperTextDirection
        }), [dataSource, fields, value, defaultValue, placeholder, disabled, readOnly, labelMode, size, variant, className, required,
            inputProps, clearButton, loading, popupSettings, open, defaultOpen, query, sortOrder, allowObjectBinding, multiSelectId,
            itemTemplate, headerTemplate, footerTemplate, groupTemplate, noRecordsTemplate, onErrorTemplate, virtualization, ignoreCase,
            ignoreAccent, filterType, debounceDelay, valid, validationMessage, validityStyles, skipDisabledItems, delimiterChar,
            mode, checkbox, closeOnSelect, openOnClick, maximumSelectionLength, customValue, resizable, hideSelectedItem, showSelectAll,
            selectAllText, unSelectAllText, enableSelectionOrder, prefix, suffix, chipTemplate, helperText, helperTextOnFocus,
            filterable, helperTextDirection, addTagOnBlur, valueTemplate, dropdownIcon]);

        useImperativeHandle(ref, () => ({
            ...publicAPI,
            element: baseRef.current?.element
        }), [publicAPI, baseRef]);

        useEffect(() => {
            preRender('multiselect');
        }, []);

        const onChangeHandler: (args: ChangeEvent) => void = useCallback((args: ChangeEvent) => {
            onChange?.({
                event: args.event, itemData: args.itemData as T,
                previousItemData: args.previousItemData as T, value: args.value as T[]
            });
        }, [onChange]);

        return (
            <Dropdown
                {...restProps}
                {...publicAPI}
                ref={baseRef}
                id={multiSelectId}
                spanClickable={false}
                componentClassName='sf-multiselect'
                inputClassName='sf-multiselect-input'
                localeComponentName='multiSelect'
                ariaLabel='multiselect'
                multiSelectable
                forceFilterOnOpen={filterable}
                dropdownIcon={dropdownIcon === true ? undefined : dropdownIcon}
                onChange={onChangeHandler}
                multiSelectValueTemplate={valueTemplate}
            >
                <DropdownPrefix />
                <DropdownChips />
                <DropdownInput />
                <DropdownSuffix />
                <span className={CSS_CLASSES.ICONS_WRAPPER}>
                    <DropdownClearButton />
                    <DropdownIcon />
                </span>
                <DropdownMenu>
                    <DropdownSelectAll />
                    <DropdownCustomValue />
                    <DropdownHeader />
                    <DropdownListContent />
                    <DropdownNoRecords />
                    <DropdownError />
                    <DropdownFooter />
                </DropdownMenu>
            </Dropdown>
        );
    });

export default memo(MultiSelect);
