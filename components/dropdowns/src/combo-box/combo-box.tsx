import { forwardRef, ForwardRefExoticComponent, InputHTMLAttributes, memo, ReactElement, ReactNode, Ref, RefAttributes, RefObject, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { validationProps } from '@syncfusion/react-inputs';
import { DropDownProps, DropDownFilterIconProps, DropDownSelectionProps, InputProps } from '../common/types';
import { IDropdown, Dropdown } from '../common/dropdown';
import { preRender, useStableId } from '@syncfusion/react-base';
import {
    DropdownClearButton, DropdownError, DropdownFooter, DropdownHeader, DropdownIcon, DropdownInput,
    DropdownListContent, DropdownMenu, DropdownNoRecords, DropdownPrefix, DropdownSuffix
} from '../common/components';
import { CSS_CLASSES } from '../common/constants';

/**
 * Props for the ComboBox component.
 *
 * @default -
 */
export interface ComboBoxProps extends DropDownProps, DropDownFilterIconProps, DropDownSelectionProps, validationProps, InputProps {
    /**
     * Specifies whether the input field automatically fills with the first matching
     * suggestion during typing. The auto-filled portion appears highlighted.
     *
     * @default false
     */
    autofill?: boolean;

    /**
     * Specifies whether to highlight the matched search text within each suggestion.
     *
     * @default false
     */
    autoHighlight?: boolean;

    /** Specifies whether users can commit custom text values (not in the suggestion list) by pressing Enter.
     * When enabled, free-form input is accepted as a valid selection.
     *
     *@default false
     */
    customValue?: boolean;

    /**
     * Specifies a custom template for rendering the value in the input element, allowing for customized appearance.
     *
     * @default -
     */
    valueTemplate?: (inputElement: ReactElement<HTMLInputElement>) => ReactNode;

    /** Specifies the callback invoked when a custom value (not in the suggestion list)
     * is committed via Enter key. Receives the custom string value as a parameter.
     *
     * @event onCustomValueSelect
     */
    onCustomValueSelect?: (value: string) => void;
}

/**
 * Imperative API for ComboBox.
 */
export interface IComboBox extends ComboBoxProps {
    /**
     * Reference to the input element.
     *
     * @private
     * @default null
     */
    element?: HTMLInputElement | null;
}

type IComboBoxProps = ComboBoxProps & Omit<InputHTMLAttributes<HTMLSpanElement>, keyof ComboBoxProps>;

/**
 * ComboBox lets users type to search or choose a single option from a list. It supports controlled and uncontrolled usage (value / defaultValue),
 * works with local or remote data sources, supports custom item.
 *
 * ```typescript
 * import { ComboBox } from "@syncfusion/react-dropdowns";
 *
 * export default function App() {
 *   const data = [
 *     { text: "Apple", value: "apple" },
 *     { text: "Banana", value: "banana" },
 *     { text: "Cherry", value: "cherry" }
 *   ];
 *
 *   return (
 *     <ComboBox
 *       id="fruits"
 *       dataSource={data}
 *       fields={{ text: "text", value: "value" }}
 *       placeholder="Select a fruit" />
 *   );
 * }
 * ```
 */
export const ComboBox: ForwardRefExoticComponent<IComboBoxProps & RefAttributes<IComboBox>> =
    forwardRef<IComboBox, IComboBoxProps>((props: IComboBoxProps, ref: Ref<IComboBox>) => {
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
            dropdownIcon,
            loading = false,
            popupSettings = {},
            open,
            defaultOpen,
            query,
            sortOrder,
            allowObjectBinding = false,
            customValue = false,
            itemTemplate,
            headerTemplate,
            footerTemplate,
            groupTemplate,
            noRecordsTemplate,
            onErrorTemplate,
            valueTemplate,
            virtualization,
            ignoreCase = true,
            ignoreAccent = false,
            filterable = false,
            filterType = 'StartsWith',
            debounceDelay = 0,
            valid,
            validationMessage = '',
            validityStyles = true,
            skipDisabledItems,
            autofill = false,
            autoHighlight,
            resizable,
            prefix,
            suffix,
            helperText,
            helperTextOnFocus = false,
            helperTextDirection = 'Left',
            ...restProps
        } = props;

        const generatedId: string = useStableId('sf-combobox');
        const comboboxId: string = id ?? generatedId;
        const baseRef: RefObject<IDropdown | null> = useRef<IDropdown>(null);

        const publicAPI: Partial<IComboBox> = useMemo(() => ({
            prefix,
            suffix,
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
            dropdownIcon,
            loading,
            popupSettings,
            open,
            defaultOpen,
            query,
            sortOrder,
            allowObjectBinding,
            customValue,
            itemTemplate,
            headerTemplate,
            footerTemplate,
            groupTemplate,
            noRecordsTemplate,
            onErrorTemplate,
            valueTemplate,
            virtualization,
            ignoreCase,
            ignoreAccent,
            filterable,
            filterType,
            debounceDelay,
            valid,
            validationMessage,
            validityStyles,
            skipDisabledItems,
            autofill,
            autoHighlight,
            resizable,
            helperText,
            helperTextOnFocus,
            helperTextDirection
        }), [dataSource, fields, value, defaultValue, placeholder, disabled, readOnly, labelMode, size, variant, className, required,
            inputProps, clearButton, dropdownIcon, loading, popupSettings, open, defaultOpen, query, sortOrder, allowObjectBinding,
            customValue, itemTemplate, headerTemplate, footerTemplate, groupTemplate, noRecordsTemplate, onErrorTemplate,
            virtualization, ignoreCase, ignoreAccent, filterable, filterType, debounceDelay, valid, validationMessage, validityStyles,
            skipDisabledItems, autofill, autoHighlight, resizable, valueTemplate, prefix, suffix, helperText, helperTextOnFocus,
            helperTextDirection]);

        useImperativeHandle(ref, () => ({
            ...publicAPI,
            element: baseRef.current?.element
        }), [publicAPI, baseRef]);

        useEffect(() => {
            preRender('combobox');
        }, []);

        return (
            <Dropdown
                {...restProps}
                {...publicAPI}
                ref={baseRef}
                id={comboboxId}
                spanClickable={false}
                componentClassName={CSS_CLASSES.COMBOBOX_ROOT}
                inputClassName={CSS_CLASSES.COMBOBOX_INPUT}
                localeComponentName='comboBox'
                ariaLabel='combobox'
                forceFilterOnOpen={filterable}
                inputValueRenderer={valueTemplate}
            >
                <DropdownPrefix />
                <DropdownInput />
                <DropdownSuffix />
                <span className={CSS_CLASSES.ICONS_WRAPPER}>
                    <DropdownClearButton />
                    <DropdownIcon />
                </span>
                <DropdownMenu>
                    <DropdownHeader />
                    <DropdownListContent />
                    <DropdownNoRecords />
                    <DropdownError />
                    <DropdownFooter />
                </DropdownMenu>
            </Dropdown>
        );
    });

export default memo(ComboBox);
