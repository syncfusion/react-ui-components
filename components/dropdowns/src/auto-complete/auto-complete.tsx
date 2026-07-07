import { forwardRef, ForwardRefExoticComponent, InputHTMLAttributes, memo, ReactElement, ReactNode, Ref, RefAttributes, RefObject, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { validationProps } from '@syncfusion/react-inputs';
import { DropDownProps, DropDownSelectionProps, InputProps } from '../common/types';
import { IDropdown, Dropdown } from '../common/dropdown';
import { preRender, useStableId } from '@syncfusion/react-base';
import { DropdownInput, DropdownMenu, DropdownHeader, DropdownListContent, DropdownNoRecords, DropdownError, DropdownFooter, DropdownClearButton, DropdownPrefix, DropdownSuffix } from '../common/components';
import { CSS_CLASSES } from '../common/constants';

/**
 * Props for the Autocomplete component.
 *
 * @default -
 */
export interface AutocompleteProps extends DropDownProps, DropDownSelectionProps, validationProps, InputProps {
    /**
     *Specifies whether the input field automatically fills with the first matching
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
     * Specifies the minimum number of characters required before suggestions appear.
     *
     * @default 0
     */
    minLength?: number;

    /**
     *Specifies the maximum number of suggestions to display.
     *
     *@default -
     */
    maxSuggestions?: number;

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
 * Imperative API for Autocomplete.
 */
export interface IAutocomplete extends AutocompleteProps {
    /**
     * Reference to the input element.
     *
     * @private
     * @default null
     */
    element?: HTMLInputElement | null;
}

type IAutocompleteProps = AutocompleteProps & Omit<InputHTMLAttributes<HTMLSpanElement>, keyof AutocompleteProps>;

/**
 * Autocomplete lets users type to search or choose a single option from a list. It supports controlled and uncontrolled usage (value / defaultValue),
 * works with local or remote data sources, supports custom item.
 *
 * ```typescript
 * import { Autocomplete } from "@syncfusion/react-dropdowns";
 *
 * export default function App() {
 *   const data = [
 *     { text: "Apple", value: "apple" },
 *     { text: "Banana", value: "banana" },
 *     { text: "Cherry", value: "cherry" }
 *   ];
 *
 *   return (
 *     <Autocomplete
 *       id="fruits"
 *       dataSource={data}
 *       fields={{ text: "text", value: "value" }}
 *       placeholder="Select a fruit" />
 *   );
 * }
 * ```
 */
export const Autocomplete: ForwardRefExoticComponent<IAutocompleteProps & RefAttributes<IAutocomplete>> =
    forwardRef<IAutocomplete, IAutocompleteProps>((props: IAutocompleteProps, ref: Ref<IAutocomplete>) => {
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
            customValue = false,
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
            autofill = false,
            autoHighlight,
            resizable,
            minLength = 0,
            maxSuggestions,
            valueTemplate,
            prefix,
            suffix,
            helperText,
            helperTextOnFocus = false,
            helperTextDirection = 'Left',
            ...restProps
        } = props;

        const generatedId: string = useStableId('sf-autocomplete');
        const autocompleteId: string = id ?? generatedId;
        const baseRef: RefObject<IDropdown | null> = useRef<IDropdown>(null);

        const publicAPI: Partial<IAutocomplete> = useMemo(() => ({
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
            filterType,
            debounceDelay,
            valid,
            validationMessage,
            validityStyles,
            skipDisabledItems,
            autofill,
            autoHighlight,
            resizable,
            minLength,
            maxSuggestions,
            prefix,
            suffix,
            helperText,
            helperTextOnFocus,
            helperTextDirection
        }), [dataSource, fields, value, defaultValue, placeholder, disabled, readOnly, labelMode, size, variant, className, required,
            inputProps, clearButton, loading, popupSettings, open, defaultOpen, query, sortOrder, allowObjectBinding,
            customValue, itemTemplate, headerTemplate, footerTemplate, groupTemplate, noRecordsTemplate, onErrorTemplate,
            virtualization, ignoreCase, ignoreAccent, filterType, debounceDelay, valid, validationMessage, validityStyles,
            skipDisabledItems, autofill, autoHighlight, resizable, minLength, maxSuggestions, prefix, suffix, helperText,
            helperTextDirection, helperTextOnFocus, valueTemplate]);

        useImperativeHandle(ref, () => ({
            ...publicAPI,
            element: baseRef.current?.element
        }), [publicAPI, baseRef]);

        useEffect(() => {
            preRender('autocomplete');
        }, []);

        return (
            <Dropdown
                {...restProps}
                {...publicAPI}
                ref={baseRef}
                id={autocompleteId}
                spanClickable={false}
                componentClassName={CSS_CLASSES.AUTOCOMPLETE_ROOT}
                inputClassName={CSS_CLASSES.AUTOCOMPLETE_INPUT}
                localeComponentName='autoComplete'
                ariaLabel='autocomplete'
                forceFilterOnOpen={true}
                dropdownIcon={false}
                filterable={true}
                inputValueRenderer={valueTemplate}
            >
                <DropdownPrefix />
                <DropdownInput />
                <DropdownSuffix />
                <span className={CSS_CLASSES.ICONS_WRAPPER}>
                    <DropdownClearButton />
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

export default memo(Autocomplete);
