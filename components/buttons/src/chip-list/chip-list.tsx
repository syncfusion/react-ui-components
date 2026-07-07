import { forwardRef, ForwardRefExoticComponent, HTMLAttributes, ReactNode, Ref, RefAttributes, RefObject, useCallback, useEffect,
    useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, memo, FC, type MouseEvent, type KeyboardEvent
} from 'react';
import { ChipBaseProps, Chip, ChipDeleteEvent, IChip, ChipColor } from '../chip/chip';
import { isNullOrUndefined, preRender, useProviderContext, Size } from '@syncfusion/react-base';

/**
 * Selection types for ChipList
 */
export type SelectionType = 'Single' | 'Multiple' | 'None';

/**
 * @ignore
 */
export interface ChipListProps {
    /**
     * This chips property helps to render ChipList component.
     * ```html
     * <ChipList chips={['Chip1', 'Chip2']} />
     * ```
     *
     * @default []
     */
    chips?: string[] | ChipItemProps[];

    /**
     * Specifies a value that indicates whether the ChipList component is disabled or not.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies the selected chip items in the ChipList.
     * ```html
     * <ChipList selectedChips={[0, 1]} />
     * ```
     *
     * @default []
     */
    selectedChips?: number[];

    /**
     * Defines the selection type of the ChipList. The available types are single, multiple, and none.
     *
     * @default 'None'
     */
    selection?: SelectionType;

    /**
     * Enables or disables the delete functionality of a ChipList.
     *
     * @default false
     */
    removable?: boolean;

    /**
     * Specifies the size of the chiplist. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Triggers when the chip item is removed.
     *
     * @event onDelete
     */
    onDelete?: (event: ChipListDeleteEvent) => void;

    /**
     * Triggers when the selected chips in the ChipList change.
     *
     * @event onSelect
     */
    onSelect?: (event: ChipListSelectEvent) => void;

}

/**
 * Represents the properties of a Chip component.
 */
export interface ChipItemProps extends ChipBaseProps {

    /**
     * Specifies the custom classes to be added to the chip element.
     *
     * @default -
     */
    className?: string;

    /**
     * Specifies the additional HTML attributes in a key-value pair format.
     *
     * @default -
     */
    htmlAttributes?: HTMLAttributes<HTMLDivElement>;

    /**
     * Specifies the children to be rendered for the chip item.
     * This can be a React node, a function that returns a React node, or a string.
     *
     * @default -
     */
    children?: ReactNode;
}

/**
 * Represents the arguments for the chip selection event.
 */
export interface ChipListSelectEvent {
    /**
     * Specifies the indexes of the chips that are currently selected.
     */
    selectedChipIndexes: number[];

    /**
     * Specifies the event that triggered the select action.
     */
    event: MouseEvent | KeyboardEvent;
}

/**
 * Represents the arguments for the chip deletion event.
 */
export interface ChipListDeleteEvent {
    /**
     * Specifies the remaining chips after deletion.
     */
    chips: string[] | ChipItemProps[];

    /**
     * Specifies the event that triggered the delete action.
     */
    event: MouseEvent | KeyboardEvent;
}

/**
 * Represents the main properties and methods of the ChipList component.
 */
export interface IChipList extends ChipListProps {
    /**
     * Specifies the ChipList component element.
     *
     * @private
     */
    element: HTMLDivElement | null;

    /**
     * Gets the selected chips from the ChipList.
     *
     * @public
     * @returns {string[] | ChipItemProps[]}
     */
    getSelectedChips(): string[] | ChipItemProps[];
}

type ChipListComponentProps = ChipListProps & Omit<HTMLAttributes<HTMLDivElement>, | 'onSelect'>;

/**
 * The ChipList component displays a collection of chips that can be used to represent multiple items in a compact form.
 * It supports various selection modes, chip deletion, and customization options.
 *
 * ```typescript
 * import { ChipList } from "@syncfusion/react-buttons";
 *
 * <ChipList chips={['Apple', 'Banana', 'Cherry']} selection='Multiple' removable={true} />
 * ```
 */
export const ChipList: ForwardRefExoticComponent<ChipListComponentProps & RefAttributes<IChipList>> =
forwardRef<IChipList, ChipListProps>((props: ChipListComponentProps, ref: Ref<IChipList>) => {
    const chipListRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const [chipData, setChipData] = useState<string[] | ChipItemProps[]>([]);
    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const prevSelectedChipsRef: RefObject<number[]> = useRef<number[]>([]);
    const { dir } = useProviderContext();

    const {
        chips = [],
        className,
        disabled = false,
        selectedChips = [],
        selection = 'None',
        removable = false,
        size = Size.Medium,
        onClick,
        onDelete,
        onSelect,
        ...otherProps
    } = props;

    useEffect(() => {
        let newChipData: string[] | ChipItemProps[] | null = null;
        if (chips.length > 0) {
            newChipData = chips.map((chip: ChipItemProps) => chip) as string[] | ChipItemProps[];
        }
        if (newChipData !== null) {
            setChipData(newChipData);
        }
        else {
            setChipData(chips);
        }
    }, [chips, className, disabled]);

    useEffect(() => {
        if (selectedIndexes.length > 0) {
            if (selection === 'Single') {
                setSelectedIndexes((prev: number[]) => [prev[prev.length - 1]]);
            }
            else if (selection === 'None') {
                setSelectedIndexes([]);
            }
        }
    }, [selection]);

    useEffect(() => {
        if ((selectedChips && chipData.length > 0 && JSON.stringify(prevSelectedChipsRef.current) !== JSON.stringify(selectedChips))) {
            if (selection === 'None') { return; }
            let finalSelectedIndexes: number[] = [];
            if (selection === 'Single') {
                finalSelectedIndexes = selectedChips.slice(0, 1);
            } else if (selection === 'Multiple') {
                finalSelectedIndexes = selectedChips;
            }
            setSelectedIndexes(finalSelectedIndexes);
            (prevSelectedChipsRef.current as number[]) = selectedChips;
        }
    }, [selectedChips, chipData]);

    useEffect(() => {
        if (chips.length > 0) {
            setChipData(chips);
        }
    }, [chips]);

    useEffect(() => {
        if (selectedChips.length > 0) {
            setSelectedIndexes(selectedChips);
        }
    }, [selectedChips]);

    useLayoutEffect(() => {
        preRender('chipList');
    }, []);

    const refInstance: Partial<ChipListProps & IChipList> = {
        chips: chipData,
        disabled,
        selectedChips,
        selection,
        removable,
        size
    };

    refInstance.getSelectedChips = (): string[] | ChipItemProps[] => {
        if (selection === 'None' || selectedIndexes.length === 0) {
            return [];
        }
        const data: (string | ChipItemProps)[] = [];

        selectedIndexes.forEach((index: number) => {
            const chip: string | ChipItemProps = chipData[index as number];
            (data).push(chip);
        });

        if (selection === 'Single') {
            return data[0] ? data as string[] | ChipItemProps[] : [];
        }
        return data as string[] | ChipItemProps[];
    };

    useImperativeHandle(ref, () => ({
        ...refInstance as IChipList,
        element: chipListRef.current
    }));

    const handleFocus: (index: number) => void = useCallback((index: number) => {
        setFocusedIndex(index);
    }, []);

    const handleBlur: () => void = useCallback(() => {
        setFocusedIndex(null);
    }, []);

    const handleClick: (e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, index: number) => void =
    useCallback((e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, index: number) => {
        if (onClick) {
            onClick(e as MouseEvent<HTMLDivElement>);
        }
        if (selection !== 'None') {
            setFocusedIndex(null);
            let newSelectedIndexes: number[] = [...selectedIndexes];
            if (selection === 'Single') {
                newSelectedIndexes = [index];
            } else if (selection === 'Multiple') {
                newSelectedIndexes = selectedIndexes.includes(index)
                    ? selectedIndexes.filter((i: number) => i !== index)
                    : [...selectedIndexes, index];
            }
            if (onSelect) {
                onSelect({event: e as MouseEvent<HTMLDivElement>, selectedChipIndexes: newSelectedIndexes});
            }
            else {
                setSelectedIndexes(newSelectedIndexes);
            }
        }
    }, [onClick, selection, selectedIndexes, onSelect, refInstance]);

    const handleDelete: (e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, index: number) => void =
    useCallback((e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, index: number) => {
        e.stopPropagation();
        if (onDelete) {
            const updatedChips: string[] | ChipItemProps[] =
            chipData.filter((_: string | ChipItemProps, i: number) => i !== index) as string[] | ChipItemProps[];
            onDelete({event: e as MouseEvent<HTMLDivElement>, chips: updatedChips});
        } else {
            setChipData((prevChipData: string[] | ChipItemProps[]) =>
                prevChipData.filter((_: string | ChipItemProps, i: number) =>
                    i !== index) as string[] | ChipItemProps[]);
            if (chipData.length > 1) {
                if (selection !== 'None') {
                    setSelectedIndexes((prevSelected: number[]) => prevSelected.filter((i: number) => i !== index)
                        .map((i: number) => i > index ? i - 1 : i));
                }
                const newFocusIndex: number = index !== 0 ? index - 1 : 0;
                (chipListRef.current?.children[newFocusIndex as number] as HTMLElement)?.focus();
            }
        }
    }, [onDelete, chipData]);

    const handleKeyDown: (e: KeyboardEvent<HTMLDivElement>, index: number, chip: ChipItemProps) => void =
    useCallback((e: KeyboardEvent<HTMLDivElement>, index: number, chip: ChipItemProps) => {
        switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            handleClick(e, index);
            break;
        case 'Delete':
        case 'Backspace':
            if (removable && chip.removable !== false) {
                e.preventDefault();
                handleDelete(e, index);
            }
            break;
        }
    }, [handleClick, handleDelete, removable]);

    const memoizedOnClick: (index: number) => (e: MouseEvent<HTMLDivElement>) => void  = useCallback((index: number) => {
        return (e: MouseEvent<HTMLDivElement>) => handleClick(e, index);
    }, [handleClick, selectedIndexes]);

    const MemoizedOnDelete: (index: number) => (args: ChipDeleteEvent) => void = useCallback((index: number) => {
        return (args: ChipDeleteEvent) => removable && handleDelete(args.event as MouseEvent<HTMLDivElement>, index);
    }, [removable, handleDelete]);

    const MemoizedOnFocus: (index: number) => () => void = useCallback((index: number) => {
        return () => handleFocus(index);
    }, [handleFocus]);

    const MemoizedOnKeyDown: (index: number, chip: ChipItemProps) => (e: KeyboardEvent<HTMLDivElement>) =>
    void  = useCallback((index: number, chip: ChipItemProps) => {
        return (e: KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, index, chip);
    }, [handleKeyDown]);

    const memoizedChipData: string[] | ChipItemProps[] = useMemo(() => chipData, [chipData]);

    const memoizedSelectedIndexes: number[] = useMemo(() => selectedIndexes, [selectedIndexes]);

    const memoizedFocusedIndex: number | null = useMemo(() => focusedIndex, [focusedIndex]);

    const renderContent: ReactNode = useMemo(() =>
        memoizedChipData.map((chip: string | ChipItemProps, index: number) => (
            <ChipListItem
                key={index}
                chip={chip}
                index={index}
                listProps={props}
                selection={selection}
                selectedIndexes={memoizedSelectedIndexes}
                focusedIndex={memoizedFocusedIndex}
                onChipClick={memoizedOnClick}
                onChipDelete={MemoizedOnDelete}
                onChipFocus={MemoizedOnFocus}
                onChipBlur={handleBlur}
                onChipKeyDown={MemoizedOnKeyDown}
                size={size}
            />
        )), [memoizedChipData, props, selection, memoizedSelectedIndexes, memoizedFocusedIndex,
        memoizedOnClick, MemoizedOnDelete, MemoizedOnFocus, handleBlur, MemoizedOnKeyDown, size]
    );

    const classes: string = useMemo(() => {
        return [
            'sf-control',
            'sf-chip-list',
            'sf-chip-set',
            selection === 'Multiple' ? 'sf-chip-multi-selection' : selection === 'Single' ? 'sf-chip-selection' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            props.className,
            !disabled ? '' : 'sf-disabled'
        ].filter(Boolean).join(' ');
    }, [selection, dir, props.className, disabled]);

    return (
        <div
            ref={chipListRef}
            className={classes}
            role="listbox"
            aria-multiselectable={selection === 'Multiple' ? 'true' : 'false'}
            aria-disabled={(disabled) ? 'true' : 'false'}
            {...otherProps}
        >
            {renderContent}
        </div>
    );
});

export default memo(ChipList);

interface ChipListItemProps {
    chip: string | ChipItemProps;
    index: number;
    listProps: ChipListComponentProps;
    selection: SelectionType;
    selectedIndexes: number[];
    focusedIndex: number | null;
    onChipClick: (index: number) => (e: MouseEvent<HTMLDivElement>) => void;
    onChipDelete: (index: number) => (args: ChipDeleteEvent) => void;
    onChipFocus: (index: number) => () => void;
    onChipBlur: () => void;
    onChipKeyDown: (index: number, chip: ChipItemProps) => (e: KeyboardEvent<HTMLDivElement>) => void;
    size: Size;
}

const ChipListItem: FC<ChipListItemProps> = memo(({
    chip,
    index,
    listProps,
    selection,
    selectedIndexes,
    focusedIndex,
    onChipClick,
    onChipDelete,
    onChipFocus,
    onChipBlur,
    onChipKeyDown,
    size
}: ChipListItemProps) => {
    const chipProps: ChipItemProps = typeof chip === 'object' ? chip : { text: chip.toString() };
    const { children, className, removable, htmlAttributes, color, size: chipSize, ...restChipProps } = chipProps;
    const isSelected: boolean = selectedIndexes.includes(index);
    const isFocused: boolean = focusedIndex === index;
    const isEnabled: boolean = chipProps.disabled !== true && listProps.disabled !== true;

    const chipClassNames: string = [
        'sf-chip',
        selection === 'Multiple' ? 'sf-selectable' : '',
        className ? className : listProps.className,
        isEnabled ? '' : `sf-disabled sf-chip-${chipProps.color ? 'variant' : 'invariant'}-disabled`,
        isSelected ? 'sf-active' : '',
        isFocused ? 'sf-focused' : '',
        chipProps.avatar ? 'sf-chip-avatar-wrap' :
            chipProps.leadingIcon ? 'sf-chip-icon-wrap' : '',
        chipProps.variant === 'Outlined' ? 'sf-outline' : '',
        chipProps.color ? `sf-${color?.toLowerCase()}` : '',
        chipProps.avatar || chipProps.leadingIcon || chipProps.leadingIconUrl || selection === 'Multiple' ? 'sf-chip-has-icon' : '',
        size ? `sf-chip-${size.toLowerCase()}` : ''
    ].filter(Boolean).join(' ');

    const { onClick, ...otherHtmlAttributes }: HTMLAttributes<HTMLDivElement> = htmlAttributes || {};

    return (
        <MemoizedChip
            {...restChipProps}
            chipColor={color}
            removable={listProps.removable ? !isNullOrUndefined(removable) ? removable : true : false}
            className={chipClassNames}
            children={children}
            size={size}
            onClick={onChipClick(index)}
            onDelete={onChipDelete(index)}
            onFocus={onChipFocus(index)}
            onBlur={onChipBlur}
            tabIndex={isEnabled ? 0 : -1}
            role='option'
            onKeyDown={onChipKeyDown(index, chipProps)}
            aria-selected={isSelected ? 'true' : 'false'}
            aria-disabled={!isEnabled ? 'true' : 'false'}
            aria-label={chipProps.text}
            index={index}
            disabled={!isEnabled}
            isFocused={isFocused}
            isSelected={isSelected}
            {...otherHtmlAttributes}
        />
    );
});

interface MemoizedChipProps extends Omit<IChip, 'color'>, HTMLAttributes<HTMLDivElement> {
    index: number;
    isSelected: boolean;
    isFocused: boolean;
    className?: string;
    chipColor?: ChipColor;
    size?: Size;
}

const MemoizedChip: FC<MemoizedChipProps> = memo(
    ({ isSelected, isFocused, chipColor, size, ...props }: MemoizedChipProps) => <Chip {...props} color={chipColor} size={size} />,
    (prevProps: MemoizedChipProps, nextProps: MemoizedChipProps) => {
        return (prevProps.text === nextProps.text &&
            prevProps.value === nextProps.value &&
            prevProps.disabled === nextProps.disabled &&
            prevProps.removable === nextProps.removable &&
            prevProps.className === nextProps.className &&
            prevProps.isSelected === nextProps.isSelected &&
            prevProps.isFocused === nextProps.isFocused &&
            prevProps.index === nextProps.index &&
            prevProps.onClick?.toString() === nextProps.onClick?.toString() &&
            prevProps.onDelete?.toString === nextProps.onDelete?.toString &&
            prevProps.variant === nextProps.variant &&
            prevProps.chipColor === nextProps.chipColor &&
            prevProps.size === nextProps.size &&
            prevProps.avatar === nextProps.avatar &&
            prevProps.leadingIcon === nextProps.leadingIcon &&
            prevProps.trailingIcon === nextProps.trailingIcon);
    }
);
