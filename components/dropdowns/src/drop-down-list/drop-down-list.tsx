import { useEffect, forwardRef, useMemo, useImperativeHandle, InputHTMLAttributes, ForwardRefExoticComponent, RefAttributes, Ref, RefObject, useRef, memo } from 'react';
import { AnimationOptions, preRender, useStableId } from '@syncfusion/react-base';
import { DropDownListProps } from './types';
import { IDropdown, Dropdown } from '../common/dropdown';
import { DropdownClearButton, DropdownValueTemplate, DropdownError, DropdownFooter, DropdownHeader, DropdownIcon, DropdownInput, DropdownListContent, DropdownMenu, DropdownNoRecords, DropdownPopupInput, DropdownPrefix, DropdownSuffix } from '../common/components';
import { CSS_CLASSES } from '../common/constants';

export { AnimationOptions };

type IDropDownListProps = DropDownListProps & Omit<InputHTMLAttributes<HTMLDivElement>, keyof DropDownListProps>;

/**
 * Specifies the methods and extended properties for DropdownList component.
 */
export interface IDropDownList extends DropDownListProps {

    /**
     * Specifies the DOM element of the component.
     *
     * @private
     */
    element?: HTMLElement | null;
}

/**
 * DropDownList lets users choose a single option from a list. It works with local or remote data sources, supports custom item, group, header, footer, and value templates,
 * offers built-in filtering with debounce and case/accent handling, enables grouping and sorting, and keyboard navigation.
 *
 * ```typescript
 * import { DropDownList } from "@syncfusion/react-dropdowns";
 *
 * export default function App() {
 *   const data = [
 *     { text: "Apple", value: "apple" },
 *     { text: "Banana", value: "banana" },
 *     { text: "Cherry", value: "cherry" }
 *   ];
 *
 *   return (
 *     <DropDownList
 *       id="fruits"
 *       dataSource={data}
 *       fields={{ text: "text", value: "value" }}
 *       placeholder="Select a fruit" />
 *   );
 * }
 * ```
 */
export const DropDownList: ForwardRefExoticComponent<IDropDownListProps & RefAttributes<IDropDownList>> =
    forwardRef<IDropDownList, IDropDownListProps>((props: IDropDownListProps, ref: Ref<IDropDownList>) => {
        const {
            dataSource,
            query,
            fields,
            value,
            placeholder = '',
            id,
            disabled = false,
            readOnly = false,
            popupSettings = {},
            allowObjectBinding = false,
            labelMode,
            open,
            defaultOpen,
            skipDisabledItems,
            defaultValue,
            ignoreCase = true,
            ignoreAccent = false,
            filterable = false,
            filterType = 'StartsWith',
            filterPlaceholder = '',
            debounceDelay = 0,
            sortOrder,
            loading = false,
            size,
            variant,
            inputProps = {},
            itemTemplate,
            headerTemplate,
            footerTemplate,
            groupTemplate,
            valueTemplate,
            noRecordsTemplate,
            clearButton = false,
            dropdownIcon,
            valid,
            validationMessage = '',
            validityStyles = true,
            required,
            className,
            virtualization,
            resizable,
            prefix,
            suffix,
            onErrorTemplate,
            helperText,
            helperTextOnFocus = false,
            helperTextDirection = 'Left',
            ...otherProps
        } = props;

        useEffect(() => {
            preRender('dropdownlist');
        }, []);

        const generatedId: string = useStableId('sf-dropdownlist');
        const dropdownListId: string = id ?? generatedId;
        const baseRef: RefObject<IDropdown | null> = useRef<IDropdown>(null);

        const publicAPI: Partial<IDropDownList> = useMemo(() => ({
            dataSource,
            query,
            fields,
            value,
            placeholder,
            id: dropdownListId,
            disabled,
            readOnly,
            popupSettings,
            allowObjectBinding,
            labelMode,
            open,
            defaultOpen,
            skipDisabledItems,
            defaultValue,
            ignoreCase,
            ignoreAccent,
            filterable,
            filterType,
            filterPlaceholder,
            debounceDelay,
            sortOrder,
            loading,
            size,
            variant,
            inputProps,
            itemTemplate,
            headerTemplate,
            footerTemplate,
            groupTemplate,
            valueTemplate,
            noRecordsTemplate,
            clearButton,
            dropdownIcon,
            valid,
            validationMessage,
            validityStyles,
            required,
            className,
            virtualization,
            resizable,
            prefix,
            suffix,
            onErrorTemplate,
            helperText,
            helperTextOnFocus,
            helperTextDirection
        }), [dataSource, query, fields, value, placeholder, dropdownListId, disabled, readOnly, popupSettings, allowObjectBinding, open,
            defaultOpen, skipDisabledItems, defaultValue, ignoreCase, ignoreAccent, filterable, filterType, filterPlaceholder, labelMode,
            debounceDelay, sortOrder, loading, size, variant, inputProps, itemTemplate, headerTemplate, footerTemplate, groupTemplate,
            valueTemplate, noRecordsTemplate, clearButton, dropdownIcon, valid, validationMessage, validityStyles, required, className,
            virtualization, resizable, prefix, suffix, onErrorTemplate, helperText, helperTextOnFocus, helperTextDirection]);

        useImperativeHandle(ref, () => ({
            ...publicAPI as IDropDownList,
            element: baseRef.current?.element
        }), [publicAPI, baseRef]);

        return (
            <Dropdown
                {...otherProps}
                {...publicAPI}
                id={dropdownListId}
                ref={baseRef}
                componentClassName='sf-ddl'
                spanClickable
                inputClassName='sf-dropdown-list'
                localeComponentName='dropdownList'
                ariaLabel='dropdownlist'
            >
                <DropdownValueTemplate />
                <DropdownPrefix />
                <DropdownInput />
                <DropdownSuffix />
                <span className={CSS_CLASSES.ICONS_WRAPPER}>
                    <DropdownClearButton />
                    <DropdownIcon />
                </span>
                <DropdownMenu>
                    <DropdownPopupInput />
                    <DropdownHeader />
                    <DropdownListContent />
                    <DropdownNoRecords />
                    <DropdownError />
                    <DropdownFooter />
                </DropdownMenu>
            </Dropdown>
        );
    });

export default memo(DropDownList);
