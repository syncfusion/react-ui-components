import { useMemo, useCallback, useEffect, JSX, ReactNode, RefAttributes, HTMLAttributes, FC, memo, RefObject, useRef, type MouseEvent } from 'react';
import { ListItems, SelectEvent, FieldsMapping, DataSource, GroupedData, GetItemPropsOptions, scrollIntoItem } from '@syncfusion/react-lists';
import { DropdownContextType, useDropdownContext } from '../context';
import { compareItemData, getIndexOfItemData, getLastItemData, getTextValueField, isPrimitive, isSameData, isValueFieldMatched, resolveItemDisplayText, splitMatches, updateItemData } from '../utils';
import { ScrollMode, T } from '../../drop-down-list/types';
import { getValue, isNullOrUndefined } from '@syncfusion/react-base';
import { DataManager, Query } from '@syncfusion/react-data';
import { Checkbox } from '@syncfusion/react-buttons';
import { CSS_CLASSES } from '../constants';
import { GroupState } from '../hooks';

export const DropdownListContent: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { popupListData, itemData, isDataInitialized, isActionFailed, dropdownValue, text },
        refs: { listBaseKey, inputElementRef, filterInputElementRef, popupContentRef },
        actions: { setText, setItemData, setDropdownValue, setTypedString },
        config: { itemTemplate, groupTemplate, id, maximumSelectionLength, multiSelectable, closeOnSelect, spanClickable, showSelectAll,
            customValue, filterable, dataSource, debounceDelay, query, forceFilterOnOpen, autoHighlight, checkbox, size,
            enableGroupedCheckBox, onChange },
        internalProps: { resolvedFields, getFormattedValue, getTextByValue, getDataByValue, handleInternalScrollRequest, getScrollContainer,
            fetchRemoteVirtualData, formListData, getQuery, filter, hidePopup, clearText, computedNonHiddenItems, reorderSelectedItemCount,
            computedDisabledItems, resolvedVirtualization: virtualization, setTypeAheadMatchedItem, typeAheadMatchedItem: focusedItem,
            groupStates, getHeaderGroupKey, toggleGroupByKey }
    } = context;

    const initialDataSourceRef: RefObject<string | null> = useRef<string | null>(null);
    const filterTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const previousSelectedItemsRef: RefObject<T[] | null> = useRef<T[] | null>(itemData);

    const listBaseClasses: string = useMemo(() => {
        const isPrimitiveArray: boolean = Array.isArray(popupListData) && popupListData.length > 0 && isPrimitive(popupListData[0]);
        return [
            CSS_CLASSES.CONTENT,
            CSS_CLASSES.DD_BASE,
            (!isPrimitiveArray && resolvedFields.groupBy) ? CSS_CLASSES.GROUP_CLASS : '',
            popupListData.length === 0 ? CSS_CLASSES.NO_DATA : ''
        ].filter(Boolean).join(' ');
    }, [resolvedFields.groupBy, popupListData]);

    const onItemClick: (args: SelectEvent) => void = useCallback((args: SelectEvent) => {
        const event: MouseEvent<Element> = args.event as unknown as MouseEvent<HTMLLIElement>;
        event.preventDefault();
        const target: Element = event.target as Element;
        const checkboxWrapper: Element | null = target.closest('.' + CSS_CLASSES.CHECKBOX_WRAPPER) || (target.children.length > 0 ? target.children[0] : null);
        if (checkboxWrapper) {
            const groupKey: string = (checkboxWrapper as HTMLElement).dataset.groupKey as string;
            if (groupKey) {
                onGroupMouseDown(event, groupKey);
                return;
            }
        }

        const li: HTMLLIElement | null = target.closest('.' + CSS_CLASSES.LIST_ITEM);
        if (li) {
            const dataValue: string = li.dataset?.value as string;
            if (!isNullOrUndefined(dataValue)) {
                const formattedValue: T = getFormattedValue?.(dataValue);
                const textByValue: string = getTextByValue(formattedValue) || '';
                const displayText: string = resolveItemDisplayText(textByValue, formattedValue, !!resolvedFields?.text);
                setText?.(multiSelectable ? '' : displayText);
                const selectedData: T | undefined = getDataByValue(formattedValue);
                let nextValue: T = formattedValue;
                let newValues: T[] | null = null;
                if (selectedData !== null && selectedData !== undefined) {
                    setTypeAheadMatchedItem(null);
                    setItemData(updateItemData(itemData, selectedData, Boolean(multiSelectable), maximumSelectionLength) as T[]);
                    if (isPrimitive(selectedData)) {
                        newValues = updateItemData(dropdownValue, selectedData, Boolean(multiSelectable), maximumSelectionLength) as T[];
                        setDropdownValue(newValues);
                        nextValue = selectedData as string;
                    } else if (formattedValue !== null && formattedValue !== undefined) {
                        newValues = updateItemData(dropdownValue, formattedValue, Boolean(multiSelectable), maximumSelectionLength) as T[];
                        setDropdownValue(newValues);
                        nextValue = formattedValue;
                    }
                    if (multiSelectable && filterable) {
                        clearText(event);
                    }
                }

                if (onChange && nextValue !== undefined) {
                    onChange({
                        event: event,
                        previousItemData: getLastItemData(itemData) ?? null,
                        value: spanClickable ? nextValue : multiSelectable ? newValues : getTextValueField(selectedData as { [key: string]: unknown; }, 'text', resolvedFields),
                        itemData: selectedData ? selectedData : null
                    });
                }
            }
            if (closeOnSelect) {
                hidePopup?.();
            }
            inputElementRef?.current?.focus();
        }
    }, [setText, setDropdownValue, inputElementRef, resolvedFields, setItemData, getFormattedValue, getTextByValue, clearText,
        itemData, onChange, spanClickable, multiSelectable, dropdownValue, closeOnSelect, maximumSelectionLength, getDataByValue]);

    const getItemProps: (args: GetItemPropsOptions) => HTMLAttributes<HTMLElement> = useCallback((args: GetItemPropsOptions):
    HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement> => {

        let itemValue: string = '';
        let text: string = '';
        if (isPrimitive(args.item)) {
            itemValue = text = String(args.item);
        } else {
            itemValue = String(getValue(resolvedFields.value || '', args.item));
            text = String(getValue(resolvedFields.text || resolvedFields.value || '', args.item));
        }
        let isActive: boolean = false;
        try {
            if (itemData !== undefined && itemData !== null) {
                isActive = itemData.some((item: T) => {
                    const currVal: string = typeof item === 'object' ? String((item as Record<string, unknown>)[resolvedFields.value || 'value']) : String(item);
                    const currText: string = typeof item === 'object' ? String((item as Record<string, unknown>)[resolvedFields.text || resolvedFields.value || '']) : String(item);
                    return String(itemValue) === currVal && String(text) === currText;
                });
            }
        } catch {
            isActive = false;
        }
        if (multiSelectable && enableGroupedCheckBox && (args.item as GroupedData).isHeader) {
            const groupKey: string = getHeaderGroupKey(args.item);
            const grp: GroupState = groupStates[groupKey as string] ?? { checked: false, indeterminate: false };
            isActive = grp.checked;
        }
        let isFocused: boolean = itemData && itemData.length > 0 ? false : ((popupListData?.[0] as GroupedData).isHeader ?
            args.index === 1 : args.index === 0);

        if (focusedItem !== null && focusedItem !== undefined) {
            isFocused = String(getTextValueField(args.item, 'value', resolvedFields)) === String(getTextValueField(focusedItem.item, 'value', resolvedFields));
        }
        isFocused = (showSelectAll || (customValue && multiSelectable && text)) && !focusedItem ? false : isFocused;
        const isDisabled: string | boolean | undefined = resolvedFields.disabled && typeof args.item === 'object' && getValue(resolvedFields.disabled, args.item) === true;
        const isDisabledByMaxSelection: boolean = Array.from(computedDisabledItems).some((disabledItem: T) =>
            compareItemData(disabledItem, args.item));
        const itemClassName: string = [
            isActive ? CSS_CLASSES.ACTIVE : '',
            isFocused ? CSS_CLASSES.ITEM_FOCUS : '',
            isDisabled || isDisabledByMaxSelection ? CSS_CLASSES.DISABLED : '',
            reorderSelectedItemCount > 0 && reorderSelectedItemCount < computedNonHiddenItems.length && args.index === reorderSelectedItemCount - 1 ? CSS_CLASSES.SEPARATOR : ''
        ].filter(Boolean).join(' ');

        return {
            className: itemClassName,
            id: `${id}_option_${args.index}`,
            'aria-selected': isActive ? true : false,
            'aria-disabled': (isDisabled || isDisabledByMaxSelection) ? true : false
        };
    }, [popupListData, listBaseClasses, resolvedFields, itemData, id, focusedItem, computedDisabledItems, showSelectAll, multiSelectable,
        text, customValue, reorderSelectedItemCount, computedNonHiddenItems.length, enableGroupedCheckBox, getHeaderGroupKey]);

    const processedFields: FieldsMapping = useMemo((): FieldsMapping => {
        if (!resolvedFields || Object.keys(resolvedFields).length === 0) {
            return resolvedFields;
        }
        return {
            id: resolvedFields?.value, text: resolvedFields?.text, groupBy: resolvedFields?.groupBy,
            disabled: resolvedFields?.disabled, htmlAttributes: resolvedFields?.htmlAttributes
        };
    }, [resolvedFields]);

    const getListItems: () => HTMLLIElement[] = useCallback((): HTMLLIElement[] => {
        if (popupContentRef.current) {
            return Array.from(popupContentRef.current.getElementsByClassName(CSS_CLASSES.LIST_ITEM)) as HTMLLIElement[];
        }
        return [];
    }, [popupContentRef]);

    const scrollItemIntoViewWithin: (container: HTMLElement, el: HTMLElement) => void =
        useCallback((container: HTMLElement, el: HTMLElement) => {
            const popupElement: HTMLElement = popupContentRef?.current?.parentElement as HTMLElement;
            const originalDisplay: string = popupElement.style.display;
            popupElement.style.visibility = 'hidden';
            popupElement.style.display = 'block';
            const itemTop: number = el.offsetTop;
            const itemBottom: number = itemTop + el.offsetHeight;
            const viewTop: number = container.scrollTop;
            const viewBottom: number = container.scrollTop + container.clientHeight;
            if (itemBottom > viewBottom) {
                container.scrollTop = itemBottom - container.clientHeight;
            } else if (itemTop < viewTop) {
                container.scrollTop = Math.max(0, itemTop);
            }
            popupElement.style.visibility = '';
            popupElement.style.display = originalDisplay;
        }, [popupContentRef]);

    useEffect(() => {
        if (filterable && filterInputElementRef.current) {
            filterInputElementRef.current.focus({ preventScroll: true });
        }
    }, [filterable, filterInputElementRef, isDataInitialized]);

    useEffect(() => {
        if (!isDataInitialized || !isSameData(dataSource, initialDataSourceRef.current)) {
            initialDataSourceRef.current = JSON.stringify(dataSource) ?? null;
            if (forceFilterOnOpen && !spanClickable && inputElementRef?.current?.value.trim() !== '') {
                if (debounceDelay && debounceDelay > 0) {
                    if (filterTimerRef.current) {
                        clearTimeout(filterTimerRef.current);
                        filterTimerRef.current = null;
                    }
                    filterTimerRef.current = window.setTimeout(() => {
                        filter(dataSource as T[], undefined);
                        clearTimeout(filterTimerRef.current as unknown as number);
                        filterTimerRef.current = null;
                    }, debounceDelay);
                } else {
                    filter(dataSource as T[], undefined);
                }
            } else {
                if (dataSource instanceof DataManager && virtualization && virtualization.scrollMode === ScrollMode.FetchViewPort) {
                    const initialTake: number = virtualization.pageSize + (virtualization.overscanCount ?? 5);
                    const initialQuery: Query = getQuery(new Query()).skip(0).take(initialTake).requiresCount();
                    fetchRemoteVirtualData(dataSource, initialQuery);
                } else {
                    formListData(dataSource as T[], query);
                }
            }
        }
    }, [dataSource, query, isDataInitialized]);

    useEffect(() => {
        return () => {
            if (filterTimerRef.current) {
                clearTimeout(filterTimerRef.current);
                filterTimerRef.current = null;
            }
            setTypedString?.('');
        };
    }, []);
    useEffect(() => {
        if (multiSelectable && filterable && Boolean(virtualization)) {
            const selectionChanged: boolean = !compareItemData(previousSelectedItemsRef.current, itemData);
            if (selectionChanged) {
                previousSelectedItemsRef.current = itemData;
                return;
            }
        }
        if (!isDataInitialized || (isNullOrUndefined(itemData) && !focusedItem)) { return; }
        const currentItemData: T | null = focusedItem ? focusedItem.item : getLastItemData(itemData as T[]);
        const currValue: T = typeof currentItemData === 'object' && currentItemData !== null
            ? (getValue(resolvedFields?.value ?? 'value', currentItemData)) : (currentItemData);
        if (isNullOrUndefined(currValue)) { return; }
        const listItems: HTMLLIElement[] = getListItems();
        const activeItem: HTMLLIElement | undefined =
            listItems?.find((item: HTMLElement) => item?.dataset?.value === String(currValue));
        const container: HTMLElement | null = getScrollContainer();
        if (activeItem && container) {
            scrollItemIntoViewWithin(container, activeItem);
        }
        else if (Boolean(virtualization) && container && itemData) {
            const currentIndex: number = getIndexOfItemData(getLastItemData(itemData), popupListData, resolvedFields);
            if (currentIndex !== -1) {
                scrollIntoItem(currentIndex, container);
            }
        }
    }, [popupListData]);

    const highlightTemplate: (item: T) => JSX.Element =  useCallback((item: T) => {
        const rawText: string = String(getTextValueField(item, 'text', resolvedFields));
        const parts: { text: string; highlight: boolean; }[] = splitMatches(rawText, text);
        return (
            <span className={CSS_CLASSES.DD_ITEM}>
                {parts.map((p: { text: string; highlight: boolean; }, i: number) =>
                    p.highlight
                        ? <span key={i} className={CSS_CLASSES.DD_HIGHLIGHT}>{p.text}</span>
                        : <span key={i}>{p.text}</span>
                )}
            </span>
        );
    }, [resolvedFields.text, text]);

    const effectiveItemTemplate: Function | ReactNode = useMemo(() => {
        if (!autoHighlight) { return itemTemplate; }
        return itemTemplate ?? highlightTemplate;
    }, [autoHighlight, itemTemplate, highlightTemplate]);

    const checkboxTemplate: (item: T) => ReactNode = useCallback((item: T) => {
        const valueField: string = resolvedFields.value || '';
        const isChecked: boolean = !!(itemData && isValueFieldMatched(itemData, item, valueField));
        const templateContent: JSX.Element | ReactNode = effectiveItemTemplate ? (typeof effectiveItemTemplate === 'function'
            ? effectiveItemTemplate(item) : effectiveItemTemplate) : <>{String(getTextValueField(item, 'text', resolvedFields))}</>;
        return (
            <div className={CSS_CLASSES.CHECKBOX_WRAPPER} >
                <Checkbox checked={isChecked} readOnly type='hidden' className={CSS_CLASSES.CHECKBOX_ITEM} tabIndex={-1} size={size} />
                <div className={CSS_CLASSES.ITEM_CONTENT}>
                    {templateContent}
                </div>
            </div>
        );
    }, [resolvedFields, itemData, effectiveItemTemplate, size]);

    const checkboxWrappedTemplate: Function | ReactNode = useMemo(() => {
        if (!checkbox) { return effectiveItemTemplate; }
        return checkboxTemplate;
    }, [effectiveItemTemplate, itemData, resolvedFields, checkbox, size]);

    const onGroupMouseDown: (e: MouseEvent<Element>, groupKey: string) => void =
    useCallback((e: MouseEvent<Element>, groupKey: string) => {
        e.preventDefault();
        e.stopPropagation();
        const { newItemData, newDropdownValue } = toggleGroupByKey(groupKey);
        setItemData(updateItemData(itemData, newItemData.length > 0 ? newItemData : [], Boolean(multiSelectable), maximumSelectionLength));
        setDropdownValue(updateItemData(dropdownValue, newDropdownValue.length > 0 ? newDropdownValue : null,
                                        Boolean(multiSelectable), maximumSelectionLength));
        if (onChange) {
            onChange({
                event: e,
                previousItemData: getLastItemData(itemData) ?? null,
                value: newDropdownValue,
                itemData: getLastItemData(newItemData) as string
            });
        }
    }, [toggleGroupByKey, setItemData, setDropdownValue, onChange, itemData]);

    const groupCheckboxTemplate: Function | ReactNode = useMemo(() => {
        if (!enableGroupedCheckBox) { return groupTemplate; }
        return (headerItem: T) => {
            const groupKey: string = getHeaderGroupKey(headerItem);
            const grp: GroupState = groupStates[groupKey as string] ?? { checked: false, indeterminate: false };
            const templateContent: ReactNode = groupTemplate ? (typeof groupTemplate === 'function' ?
                groupTemplate(headerItem) : groupTemplate) : <>{String(getTextValueField(headerItem, 'text', resolvedFields))}</>;

            return (
                <div className={CSS_CLASSES.CHECKBOX_WRAPPER} data-group-key={groupKey}>
                    <Checkbox
                        checked={grp.checked}
                        indeterminate={grp.indeterminate}
                        size={size}
                        readOnly
                        tabIndex={-1}
                        className={CSS_CLASSES.CHECKBOX_ITEM}
                    />
                    <div className={CSS_CLASSES.ITEM_CONTENT}>{templateContent}</div>
                </div>
            );
        };
    }, [groupStates, getHeaderGroupKey, resolvedFields, size, enableGroupedCheckBox, groupTemplate, onGroupMouseDown]);

    if (!isDataInitialized || isActionFailed || computedNonHiddenItems.length === 0) {
        return null;
    }

    return (
        <ListItems
            key={`list-base${listBaseKey.current}`}
            getItemProps={getItemProps}
            items={computedNonHiddenItems as DataSource[]}
            parentClass={listBaseClasses}
            itemTemplate={checkboxWrappedTemplate}
            groupTemplate={groupCheckboxTemplate}
            fields={processedFields}
            ariaAttributes={{
                itemRole: 'option',
                listRole: 'listbox',
                groupItemRole: 'presentation'
            }}
            onSelect={onItemClick}
            virtualization={virtualization}
            onScrollRequest={handleInternalScrollRequest}
            disableDefaultInteractions={true} />
    );
});

DropdownListContent.displayName = 'DropdownListContent';

export default DropdownListContent;
