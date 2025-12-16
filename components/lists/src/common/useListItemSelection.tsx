import { useState, useCallback } from 'react';
import { DataSource, FieldsMapping } from './types';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { getFieldValues } from './utils';

/**
 * An interface that holds clicked ListView item details.
 */
export interface SelectEvent {
    /**
     * Specifies the clicked list item data.
     */
    data?: { [key: string]: Object };

    /**
     * Specifies the DOM event object triggered by the user's interaction through mouse or keyboard.
     */
    event: React.MouseEvent | React.KeyboardEvent;

    /**
     * Specifies whether the item is selected.
     */
    selected?: boolean;

    /**
     * Specifies whether the item is checked (for checkbox enabled lists).
     */
    checked?: boolean;

    /**
     * Specifies the index of the list item.
     */
    index?: number;
}

export interface SelectionState {
    selectedItemIndex: number;
    focusedItemIndex: number;
    activeItemsId: string[];
}

export interface UseListItemSelectionProps {
    disabled: boolean;
    checkBox: boolean;
    fields: FieldsMapping;
    listItemDatas: DataSource[];
    curDSLevel: string[];
    onSelect?: (event: SelectEvent) => void;
    setListItemDatas: (data: DataSource[]) => void;
    contentRef: React.RefObject<HTMLDivElement>;
}

export type UseListItemSelectionResult = {
    selectedItemIndex: number;
    focusedItemIndex: number;
    activeItemsId: string[];
    handleSelection: (li: HTMLLIElement, e: React.MouseEvent | React.KeyboardEvent, index: number) => void;
    keyActionHandler: (e: React.KeyboardEvent<HTMLLIElement>, index: number) => void;
    setCheckboxLI: (li: HTMLLIElement, e: React.MouseEvent | React.KeyboardEvent, index: number) => void;
    uncheckAllItems: () => void;
    isValidLI: (li: Element) => boolean;
};

export const useListItemSelection: ({ disabled, checkBox, fields, listItemDatas, curDSLevel,
    onSelect, setListItemDatas, contentRef }: UseListItemSelectionProps) => UseListItemSelectionResult = ({
    disabled,
    checkBox,
    fields,
    listItemDatas,
    curDSLevel,
    onSelect,
    setListItemDatas,
    contentRef
}: UseListItemSelectionProps) => {
    const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
    const [focusedItemIndex, setFocusedItemIndex] = useState<number>(-1);
    const [activeItemsId, setActiveItemsId] = useState<string[]>([]);

    const isValidLI: (li: Element) => boolean = (li: Element): boolean => {
        return (
            li &&
            li.classList.contains('sf-list-item') &&
            !li.classList.contains('sf-list-group-item') &&
            !li.classList.contains('sf-disabled') &&
            !li.classList.contains('sf-display-none')
        );
    };

    const getItemData: (li?: DataSource | HTMLLIElement | undefined) => DataSource = (li?: HTMLLIElement | DataSource): DataSource => {
        const listFields: DataSource = getElementUID(li as HTMLLIElement);
        return findItemFromDS(listItemDatas, listFields as DataSource) as DataSource;
    };

    const getElementUID: (obj: DataSource | HTMLElement) => DataSource = (obj: DataSource | HTMLElement): DataSource => {
        let listFields: DataSource = {};
        if (obj instanceof HTMLElement) {
            listFields[fields.id as string] = obj.getAttribute('data-uid') as FieldsMapping;
        } else {
            listFields = obj as DataSource;
        }
        return listFields;
    };

    const findItemFromDS: (dataSource: DataSource[], listFields: DataSource, parent?: boolean) => DataSource[] | DataSource | undefined = (
        dataSource: DataSource[],
        listFields: DataSource,
        parent: boolean = false
    ): DataSource[] | DataSource | undefined => {
        for (const data of dataSource) {
            const fieldData: DataSource = getFieldValues(data, fields) as DataSource;
            if ((listFields[fields.id as string]) &&
                    (!listFields[fields.id as string] || (!isNullOrUndefined(fieldData[fields.id as string]) &&
                        fieldData[fields.id as string].toString()) ===
                        listFields[fields.id as string].toString()) &&
                    (!listFields[fields.text as string] ||
                        fieldData[fields.text as string] === listFields[fields.text as string])) {
                return parent ? dataSource : data;
            }
            else if (Object.prototype.hasOwnProperty.call(fieldData as object, fields.child as string) &&
                    (fieldData[fields.child as string] as object[]).length) {
                const childResult: DataSource | DataSource[] | undefined = findItemFromDS(
                    fieldData[fields.child as string] as DataSource[],
                    listFields,
                    parent
                );
                if (childResult) {
                    return childResult;
                }
            }
        }
        return undefined;
    };

    const updateDataSource: (listItemId: string) => DataSource[] = useCallback((listItemId: string): DataSource[] => {
        const selectedFieldName: string = fields.selected as string || 'selected';
        const updatedDataSource: DataSource[] =
            listItemDatas.map((item: DataSource) => {
                if (item.isHeader === true) {
                    return item;
                }
                if ((item[fields.id as string]).toString() === listItemId) {
                    setActiveItemsId([listItemId.toString()]);
                    return {
                        ...item,
                        [selectedFieldName]: true
                    };
                } else {
                    return {
                        ...item,
                        [selectedFieldName]: false
                    };
                }
            });
        return updatedDataSource;
    }, [fields, listItemDatas]);

    const processSelection: (li: HTMLLIElement, e: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>,
        itemId: string | null, index: number) => void = useCallback((
        li: HTMLLIElement,
        e: React.MouseEvent | React.KeyboardEvent,
        itemId: string | null,
        index: number
    ): void => {
        const selectedItemData: DataSource = getItemData(li);
        const eventArgs: SelectEvent = {data: selectedItemData, event: e, selected: true, index: index};
        onSelect?.(eventArgs);
        if (!li.classList.contains('sf-has-child')) {
            setSelectedItemIndex(index);
            setListItemDatas(updateDataSource(itemId as string));
        }
        setFocusedItemIndex(-1);
    }, [onSelect, updateDataSource, setListItemDatas]);

    const handleSelection: (li: HTMLLIElement, e: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>, index: number)
    => void = useCallback((li: HTMLLIElement, e: React.MouseEvent | React.KeyboardEvent, index: number): void => {
        if (isValidLI(li) && !li.classList.contains('sf-selected') && !disabled) {
            const itemId: string | null = li.getAttribute('data-uid');
            processSelection(li, e, itemId, index);
        }
    }, [disabled, processSelection]);

    const uncheckAllItems: () => void = useCallback((): void => {
        if (checkBox) {
            const updatedDataSource: DataSource[] =
                listItemDatas.map((item: DataSource) => {
                    return {
                        ...item,
                        [fields.checked as string || 'checked']: false
                    };
                });
            setListItemDatas(updatedDataSource);
        }
    }, [checkBox, fields, listItemDatas, setListItemDatas]);

    const updateCheckboxState: (listItemId: string) => void = useCallback((listItemId: string): void => {
        const checkedFieldName: string = fields.checked as string || 'checked';
        const updatedDataSource: DataSource[] =
            listItemDatas.map((item: DataSource) => {
                if ((item[fields.id as string]).toString() === listItemId) {
                    const currentCheckedValue: boolean | string = item[`${checkedFieldName}`] as boolean | string;
                    const isCurrentlyChecked: boolean =
                        currentCheckedValue === true ||
                        currentCheckedValue === 'true';
                    if (isCurrentlyChecked) {
                        setActiveItemsId((prev: string[]) => prev.filter((item: string) =>
                            item.toString() !== listItemId.toString()));
                        return {
                            ...item,
                            [checkedFieldName]: false
                        };
                    } else {
                        setActiveItemsId((prev: string[]) => [...prev, listItemId.toString()]);
                        return {
                            ...item,
                            [checkedFieldName]: true
                        };
                    }
                }
                return item;
            });
        setListItemDatas(updatedDataSource);
    }, [fields, listItemDatas, setListItemDatas]);

    const setCheckboxLI: (li: HTMLLIElement, e: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>
        , index: number) => void = useCallback((
        li: HTMLLIElement,
        e: React.MouseEvent | React.KeyboardEvent,
        index: number
    ): void => {
        const itemId: string = li.getAttribute('data-uid') as string;
        const checkedItemData: DataSource = getItemData(li);
        const isActive: boolean = !li.classList.contains('sf-active');
        const eventArgs: SelectEvent = {data: checkedItemData, event: e, checked: isActive, index: index};
        onSelect?.(eventArgs as SelectEvent);
        updateCheckboxState(itemId);
        setFocusedItemIndex(index);
    }, [onSelect, updateCheckboxState]);

    const findValidIndex: (startIndex: number, direction: number, allValidListItems: HTMLLIElement[], key: string) => number = (
        startIndex: number,
        direction: number,
        allValidListItems: HTMLLIElement[],
        key: string
    ): number => {
        let index: number = key === 'arrowKey' ? startIndex + direction : startIndex;
        while (index >= 0 && index < allValidListItems.length) {
            if (isValidLI(allValidListItems[`${index}`])) {
                return index;
            }
            index += direction;
        }
        return -1;
    };

    const homeKeyHandler: (e: React.KeyboardEvent<HTMLLIElement>, end: boolean) => void
    = useCallback((e: React.KeyboardEvent<HTMLLIElement>, end: boolean): void => {
        if (Object.keys(listItemDatas).length && contentRef.current) {
            const allItems: HTMLLIElement[] = Array.from(contentRef.current?.querySelectorAll('.sf-list-item'));
            const newIndex: number = end ? allItems.length - 1 : findValidIndex(0, 1, allItems, 'homeKey');
            if (newIndex !== -1) {
                const li: HTMLLIElement = allItems[`${newIndex}`];
                if (li.classList.contains('sf-has-child') || checkBox) {
                    setFocusedItemIndex(newIndex);
                    setSelectedItemIndex(-1);
                } else {
                    handleSelection(li, e, newIndex);
                }
                li.focus();
            }
        }
    }, [checkBox, contentRef, handleSelection, listItemDatas]);

    const arrowKeyHandler: (e: React.KeyboardEvent<HTMLLIElement>, prev: boolean) => void
    = useCallback((e: React.KeyboardEvent<HTMLLIElement>, prev: boolean): void => {
        if (Object.keys(listItemDatas).length && contentRef.current) {
            const allItems: HTMLLIElement[] = Array.from(contentRef.current?.querySelectorAll('.sf-list-item'));
            const currentIndex: number = focusedItemIndex !== -1 ?
                focusedItemIndex :
                selectedItemIndex !== -1 ? selectedItemIndex : -1;
            let newIndex: number;
            if (currentIndex !== -1) {
                newIndex = findValidIndex(currentIndex, prev ? -1 : 1, allItems, 'arrowKey');
            } else {
                newIndex = findValidIndex(prev ? allItems.length : -1, prev ? -1 : 1, allItems, 'arrowKey');
            }
            if (newIndex !== -1) {
                const li: HTMLLIElement = allItems[`${newIndex}`];
                if (li.classList.contains('sf-has-child') || checkBox) {
                    setFocusedItemIndex(newIndex);
                    setSelectedItemIndex(-1);
                } else {
                    handleSelection(li, e, newIndex);
                }
                li.focus();
            }
        }
    }, [checkBox, contentRef, focusedItemIndex, handleSelection, listItemDatas, selectedItemIndex]);

    const enterKeyHandler: (e: React.KeyboardEvent<HTMLLIElement>) => void = useCallback((e: React.KeyboardEvent<HTMLLIElement>): void => {
        if (Object.keys(listItemDatas).length && contentRef.current) {
            const li: HTMLLIElement = e.currentTarget as HTMLLIElement;
            if (li && li.classList.contains('sf-has-child')) {
                setFocusedItemIndex(-1);
            }
        }
    }, [contentRef, listItemDatas]);

    const spaceKeyHandler: (e: React.KeyboardEvent<HTMLLIElement>, index: number) => void
    = useCallback((e: React.KeyboardEvent<HTMLLIElement>, index: number): void => {
        if (!disabled && checkBox && Object.keys(listItemDatas).length && contentRef.current) {
            if (checkBox) {
                const li: HTMLLIElement = e.target as HTMLLIElement;
                setCheckboxLI(li, e, index);
                li.focus();
            }
        }
    }, [checkBox, contentRef, disabled, listItemDatas, setCheckboxLI]);

    const keyActionHandler: (e: React.KeyboardEvent<HTMLLIElement>, index: number) => void
    = useCallback((e: React.KeyboardEvent<HTMLLIElement>, index: number): void => {
        switch (e.key) {
        case 'Home':
            e.preventDefault();
            homeKeyHandler(e, false);
            break;
        case 'End':
            e.preventDefault();
            homeKeyHandler(e, true);
            break;
        case 'ArrowDown':
            e.preventDefault();
            arrowKeyHandler(e, false);
            break;
        case 'ArrowUp':
            e.preventDefault();
            arrowKeyHandler(e, true);
            break;
        case 'Enter':
            e.preventDefault();
            enterKeyHandler(e);
            break;
        case 'Backspace':
            e.preventDefault();
            if (checkBox && curDSLevel[curDSLevel.length - 1]) {
                uncheckAllItems();
            }
            break;
        case ' ':
            e.preventDefault();
            if (!isNullOrUndefined(e.target) && (e.target as HTMLElement).classList.contains('sf-focused')) {
                spaceKeyHandler(e, index);
            }
            break;
        }
    }, [
        homeKeyHandler,
        arrowKeyHandler,
        enterKeyHandler,
        checkBox,
        curDSLevel,
        uncheckAllItems,
        spaceKeyHandler
    ]);

    return {
        selectedItemIndex,
        focusedItemIndex,
        activeItemsId,
        handleSelection,
        keyActionHandler,
        setCheckboxLI,
        uncheckAllItems,
        isValidLI
    };
};
