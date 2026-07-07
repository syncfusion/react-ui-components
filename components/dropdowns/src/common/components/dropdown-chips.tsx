import { useMemo, useCallback, FC, memo, ReactNode, type MouseEvent } from 'react';
import { ChipItemProps, Chip, ChipDeleteEvent } from '@syncfusion/react-buttons';
import { DropdownContextType, useDropdownContext } from '../context';
import { getTextValueField, compareItemData, removeItem, extractValuesFromItems, getLastItemData, getDataByValueField } from '../utils';
import { T } from '../../drop-down-list/types';
import { ListItemData } from '../types';
import { DisplayMode } from '../../multi-select/types';
import { CSS_CLASSES } from '../constants';

export const DropdownChips: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { itemData, isSpanFocused, listData, isPopupOpen },
        actions: { setItemData, setDropdownValue },
        refs: { inputElementRef },
        config: { multiSelectable, mode, delimiterChar = ',', disabled, chipTemplate, onChipDelete, onChange, onChipClick,
            multiSelectValueTemplate
        },
        internalProps: { getDataByValue, resolvedFields }
    } = context;

    const effectiveMode: 'chips' | 'delimiter' = useMemo(() => {
        switch (mode) {
        case DisplayMode.Auto:
            return isSpanFocused ? 'chips' : 'delimiter';
        case DisplayMode.Delimiter:
            return 'delimiter';
        case DisplayMode.Box:
        default:
            return 'chips';
        }
    }, [mode, isSpanFocused]);

    const chipItems: ChipItemProps[] = useMemo(() =>
        itemData?.map((item: T) => ({
            text: String(getTextValueField(item, 'text', resolvedFields)),
            value: getTextValueField(item, 'value', resolvedFields),
            children: chipTemplate?.(item)
        })) as ChipItemProps[], [itemData, resolvedFields, chipTemplate]);

    const delimiterClassNames: string = useMemo(() => {
        return [
            CSS_CLASSES.MULTISELECT_VALUES_CLASS,
            CSS_CLASSES.MULTISELECT_DELIMITER,
            !isSpanFocused ? CSS_CLASSES.ELLIPSIS : CSS_CLASSES.DELIMITER_FOCUSED
        ].filter(Boolean).join(' ');
    }, [isSpanFocused]);

    const chipClassNames: string = useMemo(() => {
        return [
            CSS_CLASSES.MULTISELECT_VALUES_CLASS,
            CSS_CLASSES.MULTISELECT_CHIP_WRAPPER
        ].filter(Boolean).join(' ');
    }, []);

    const handleChipDelete: (args: ChipDeleteEvent) => void = useCallback((args: ChipDeleteEvent): void => {
        if (itemData) {
            const removedValue: string | number | undefined = args.data.value;
            const updatedItemData: T[] = removeItem(itemData, removedValue, resolvedFields);
            const updatedDropdownValue: T[] | null = extractValuesFromItems(updatedItemData, resolvedFields);
            setItemData((updatedItemData.length > 0 ? updatedItemData : []));
            setDropdownValue(updatedDropdownValue);
            const currentItemData: T | null = (updatedItemData.length > 0 ? updatedItemData[0] : null);
            if (onChange) {
                onChange({
                    event: args.event,
                    previousItemData: getLastItemData(itemData),
                    value: updatedDropdownValue,
                    itemData: currentItemData
                });
            }
            if (onChipDelete) {
                const removedItemData: T[] = itemData.filter((item: T) => {
                    return compareItemData(getTextValueField(item, 'value', resolvedFields), removedValue);
                });
                onChipDelete(removedItemData?.[0]);
            }
            inputElementRef.current?.focus();
        }
    }, [itemData, resolvedFields, setItemData, setDropdownValue, onChange, inputElementRef, onChipDelete]);

    const listDataItems: T[] = useMemo(() => listData.map((data: ListItemData) => data.item), [listData] );

    const onChipClickHandler: (e: MouseEvent<HTMLDivElement>) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        const currentValue: string | undefined = e.currentTarget.dataset.value;
        if (onChipClick && currentValue) {
            const currentClickedItem: T | undefined = isPopupOpen ? getDataByValue(currentValue) :
                getDataByValueField(currentValue, listDataItems, resolvedFields, listData[0]);
            onChipClick({ event: e, itemData: currentClickedItem as T });
        }
    }, [resolvedFields, listData, listDataItems, onChipClick, isPopupOpen, getDataByValue]);

    const getMultiSelectValueTemplate: ReactNode = useMemo(() => {
        return multiSelectValueTemplate?.(itemData as T[]);
    }, [multiSelectValueTemplate, itemData]);

    if (!multiSelectable || !itemData || itemData.length === 0) {
        return null;
    }

    if (multiSelectValueTemplate) {
        return (<div className={CSS_CLASSES.MULTISELECT_VALUES_CLASS}> {getMultiSelectValueTemplate} </div>);
    }

    if (effectiveMode === 'delimiter') {
        if (isSpanFocused) {
            return (
                <div className={delimiterClassNames}>
                    {itemData.map((item: T, index: number) => {
                        const text: string = String(getTextValueField(item, 'text', resolvedFields));
                        const isLast: boolean = index === itemData.length - 1;
                        return (
                            <span key={index} className={CSS_CLASSES.DELIMITER_ITEM}>
                                {text}
                                {!isLast && `${delimiterChar} `}
                            </span>
                        );
                    })}
                </div>
            );
        } else {
            const delimitedText: string = itemData.map((item: T) => getTextValueField(item, 'text', resolvedFields)).join(delimiterChar + ' ');
            return (
                <div className={delimiterClassNames}>
                    {delimitedText}
                </div>
            );
        }
    }

    return (
        <div className={chipClassNames}>
            {chipItems.map((chip: ChipItemProps, index: number) => (
                <Chip key={chip.value} text={chip.text} value={chip.value} removable={true} children={chip.children}
                    disabled={disabled} onClick={onChipClickHandler} onDelete={handleChipDelete} data-index={index} />
            ))}
        </div>
    );
});

DropdownChips.displayName = 'DropdownChips';

export default DropdownChips;
