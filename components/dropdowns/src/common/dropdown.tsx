import { useImperativeHandle, useMemo, useEffect, useRef, JSX, InputHTMLAttributes, ForwardRefExoticComponent, forwardRef, RefAttributes, RefObject, ReactNode, Children, isValidElement, ComponentType, Ref } from 'react';
import { Size, SortOrder, useProviderContext, Variant, useStableId } from '@syncfusion/react-base';
import { DropdownContextType, DropdownProvider } from './context';
import { useDropdownState } from './hooks/useDropdownState';
import { renderFloatLabelElement } from '@syncfusion/react-inputs';
import { useDropdownValueSync, UseDropdownValueSyncProps } from './hooks';
import { ChevronDownFillIcon } from '@syncfusion/react-icons';
import { DropdownProps } from './types';
import { buildContainerClasses, isSameData } from './utils';
import { ListItemData } from './types';
import { CSS_CLASSES } from './constants';
import { DropdownHelperText } from './components';

const DEFAULT_DROPDOWN_ICON: JSX.Element = <ChevronDownFillIcon />;

/**
 * Imperative API for Dropdown.
 */
export interface IDropdown extends DropdownProps {
    /**
     * Reference to the Dropdown element.
     *
     * @private
     * @default null
     */
    element?: HTMLInputElement | null;
}

/**
 * @private
 */
export type IDropdownProps = DropdownProps & Omit<InputHTMLAttributes<HTMLSpanElement>, keyof DropdownProps>;

export const Dropdown: ForwardRefExoticComponent<IDropdownProps & RefAttributes<IDropdown>> =
    forwardRef<IDropdown, IDropdownProps>((props: IDropdownProps, ref: Ref<IDropdown>) => {
        const {
            id,
            dataSource = [],
            fields,
            value,
            defaultValue,
            placeholder,
            disabled = false,
            readOnly = false,
            multiSelectable = false,
            maximumSelectionLength = 0,
            hideSelectedItem = false,
            filterable = false,
            filterType = 'StartsWith',
            ignoreCase = true,
            ignoreAccent = false,
            debounceDelay = 0,
            minLength = 0,
            maxSuggestions,
            forceFilterOnOpen = false,
            customValue = false,
            autofill = false,
            autoHighlight = false,
            resizable = false,
            closeOnSelect = true,
            openOnClick = true,
            size = Size.Medium,
            variant = Variant.Standard,
            labelMode = 'Never',
            checkbox = false,
            showSelectAll = false,
            enableSelectionOrder = false,
            mode,
            delimiterChar = ',',
            itemTemplate,
            groupTemplate,
            headerTemplate,
            footerTemplate,
            noRecordsTemplate,
            valueTemplate,
            onErrorTemplate,
            inputClassName,
            filterPlaceholder,
            clearButton,
            localeComponentName,
            ariaLabel,
            componentClassName,
            popupSettings,
            required = false,
            valid,
            validationMessage,
            query,
            sortOrder = SortOrder.None,
            virtualization,
            skipDisabledItems = true,
            spanClickable = false,
            allowObjectBinding = false,
            open,
            defaultOpen = false,
            loading = false,
            addTagOnBlur,
            className,
            inputProps,
            validityStyles,
            dropdownIcon = DEFAULT_DROPDOWN_ICON,
            selectAllText,
            unSelectAllText,
            prefix,
            suffix,
            helperText,
            helperTextOnFocus = false,
            helperTextDirection = 'Left',
            enableGroupedCheckBox,
            multiSelectValueTemplate,
            inputValueRenderer,
            onOpen,
            onClose,
            onChange,
            onFilter,
            onDataRequest,
            onDataLoad,
            onError,
            onCustomValueSelect,
            onResize,
            onScroll,
            chipTemplate,
            onChipClick,
            onChipDelete,
            onSelectAll,
            children,
            ...restAttributes
        } = props;

        const { dir, locale } = useProviderContext();
        const initialDataSourceRef: RefObject<string | null> = useRef<string | null>(null);
        const initialFieldsRef: RefObject<string | null> = useRef<string | null>(null);
        const generatedId: string = useStableId('sf-dropdown');
        const dropdownId: string = id ?? generatedId;

        const contextValue: DropdownContextType = useDropdownState({
            id: dropdownId,
            dataSource,
            fields,
            value,
            defaultValue,
            placeholder,
            disabled,
            readOnly,
            multiSelectable,
            maximumSelectionLength,
            hideSelectedItem,
            filterable,
            filterType,
            ignoreCase,
            ignoreAccent,
            debounceDelay,
            minLength,
            maxSuggestions,
            forceFilterOnOpen,
            customValue,
            autofill,
            autoHighlight,
            resizable,
            closeOnSelect,
            openOnClick,
            size,
            variant,
            labelMode,
            checkbox,
            showSelectAll,
            enableSelectionOrder,
            mode,
            delimiterChar,
            itemTemplate,
            groupTemplate,
            headerTemplate,
            footerTemplate,
            noRecordsTemplate,
            valueTemplate,
            onErrorTemplate,
            inputClassName,
            filterPlaceholder,
            clearButton,
            localeComponentName,
            ariaLabel,
            componentClassName,
            popupSettings,
            required,
            valid,
            validationMessage,
            query,
            sortOrder,
            virtualization,
            skipDisabledItems,
            spanClickable,
            allowObjectBinding,
            open,
            defaultOpen,
            loading,
            addTagOnBlur,
            className,
            inputProps,
            validityStyles,
            dropdownIcon,
            selectAllText,
            unSelectAllText,
            prefix,
            suffix,
            helperText,
            helperTextOnFocus,
            helperTextDirection,
            enableGroupedCheckBox,
            multiSelectValueTemplate,
            inputValueRenderer,
            onOpen,
            onClose,
            onChange,
            onFilter,
            onDataRequest,
            onDataLoad,
            onError,
            onCustomValueSelect,
            onResize,
            onScroll,
            chipTemplate,
            onChipClick,
            onChipDelete,
            onSelectAll,
            locale,
            dir
        });

        const {
            state: { dropdownValue, isSpanFocused, text, itemData, isPopupOpen, listData, popupListData },
            refs: { inputElementRef, dropdownRootRef, isFetchedRef, remoteCacheRef },
            internalProps: { resolvedFields, isInputValid, uiLoading, onKeyHandler, dropDownClick, showPopup, prefetchData,
                typeAheadMatchedItem, setTypeAheadMatchedItem, isRemoteData, getTextByValue },
            actions: { setIsSpanFocused, setIsPopupOpen, setIsLoading, setText, setItemData, setDropdownValue }
        } = contextValue;

        useImperativeHandle(ref, () => ({
            element: inputElementRef.current
        } as IDropdown), [inputElementRef]);

        const dropdownValueSyncProps: UseDropdownValueSyncProps = useMemo(() => ({
            state: { itemData, dropdownValue, listData, isPopupOpen, popupListData },
            actions: { setTextValue: setText, setItemData, setDropdownValue },
            config: { spanClickable, dataSource, customValue, multiSelectable, value, defaultValue, allowObjectBinding },
            internalProps: { resolvedFields, prefetchData, getTextByValue }

        }), [itemData, dropdownValue, listData, isPopupOpen, popupListData, setText, setItemData, setDropdownValue, spanClickable,
            dataSource, customValue, multiSelectable, value, defaultValue, allowObjectBinding, resolvedFields, prefetchData,
            getTextByValue]);

        useDropdownValueSync(dropdownValueSyncProps);

        const containerClassNames: string = useMemo(() => {
            const baseClasses: string[] = [CSS_CLASSES.INPUT_GROUP, CSS_CLASSES.CONTROL, CSS_CLASSES.DROPDOWN_ROOT];
            if (className) {
                baseClasses.push(className);
            }
            return buildContainerClasses({
                baseClasses,
                componentClassName,
                isLoading: uiLoading,
                disabled,
                isRtl: dir === 'rtl',
                readOnly,
                floatLabel: labelMode !== 'Never',
                size: String(size),
                isInputValid,
                validityStyles,
                variant: String(variant),
                isFocused: isSpanFocused,
                isMultiSelect: multiSelectable,
                mode: String(mode),
                hasSelectedItems: Boolean(itemData && itemData.length > 0)
            });
        }, [disabled, className, dir, readOnly, labelMode, size, variant, isSpanFocused, isInputValid,
            validityStyles, uiLoading, componentClassName, mode, multiSelectable, itemData]);

        useEffect(() => {
            if (open === undefined && defaultOpen) {
                setIsSpanFocused(true);
                showPopup?.();
            }
        }, []);

        useEffect(() => {
            if (spanClickable && isPopupOpen && filterable) {
                requestAnimationFrame(() => {
                    setIsSpanFocused(false);
                });
            }
        }, [isPopupOpen, filterable, spanClickable]);

        useEffect(() => {
            if (open === undefined) { return; }
            setIsPopupOpen(open);
            setIsSpanFocused(open);
            if (open) {
                inputElementRef.current?.focus();
            }
        }, [open, inputElementRef, setIsPopupOpen, setIsSpanFocused]);

        useEffect(() => {
            if (initialDataSourceRef.current === null) {
                initialDataSourceRef.current = JSON.stringify(props.dataSource) ?? null;
            }
            if (initialFieldsRef.current === null) {
                initialFieldsRef.current = JSON.stringify(props.fields) ?? null;
            }
        }, []);

        useEffect(() => {
            if (!isSameData(props.dataSource, initialDataSourceRef.current) ||
                !isSameData(props.fields, initialFieldsRef.current)) {
                initialDataSourceRef.current = JSON.stringify(props.dataSource) ?? null;
                initialFieldsRef.current = JSON.stringify(props.fields) ?? null;
                remoteCacheRef.current = null;
                if (isFetchedRef?.current) {
                    isFetchedRef.current = false;
                    prefetchData();
                }
                setIsLoading(false);
            }
        }, [props.dataSource, props.fields]);

        useEffect(() => {
            if (multiSelectable && !showSelectAll && isPopupOpen && !itemData?.length && !typeAheadMatchedItem && listData.length > 0) {
                if (customValue && text) { return; }
                const firstValidItem: ListItemData | undefined = listData.find((item: ListItemData) => !item.isDisabled && !item.isHeader);
                if (firstValidItem) {
                    setTypeAheadMatchedItem(firstValidItem);
                }
            }
        }, [isRemoteData, isPopupOpen, spanClickable, setIsLoading]);

        const { inputChildren, popupChild } = useMemo(() => {
            const inputArr: ReactNode[] = [];
            let popup: ReactNode = null;
            Children.forEach(children, (child: ReactNode) => {
                if (isValidElement(child)) {
                    const childType: ComponentType<unknown> = child.type as ComponentType<unknown>;
                    const displayName: string = childType.displayName || childType.name || String(child.type);
                    if (displayName === 'DropdownMenu') {
                        popup = child;
                    } else {
                        inputArr.push(child);
                    }
                } else {
                    inputArr.push(child);
                }
            });

            return { inputChildren: inputArr, popupChild: popup };
        }, [children]);

        return (
            <DropdownProvider value={contextValue}>
                <>
                    <span
                        ref={dropdownRootRef} className={containerClassNames} tabIndex={-1}
                        onKeyDown={onKeyHandler} onMouseDown={dropDownClick} {...restAttributes}
                    >
                        {inputChildren}
                        {labelMode !== 'Never' ? renderFloatLabelElement(labelMode, isSpanFocused, (text || (itemData && itemData.length > 0)) ? 'validValue' : '', placeholder, dropdownId) :  null}
                    </span>
                    <DropdownHelperText />
                    {popupChild}
                </>
            </DropdownProvider>
        );
    });

Dropdown.displayName = 'Dropdown';

export default Dropdown;
