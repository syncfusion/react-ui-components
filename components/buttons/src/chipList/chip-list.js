import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Chip } from '../chip/chip';
import { isNullOrUndefined, preRender, useProviderContext } from '@syncfusion/react-base';
import * as React from 'react';
/**
 * The ChipList component displays a collection of chips that can be used to represent multiple items in a compact form.
 * It supports various selection modes, chip deletion, and customization options.
 *
 * ```typescript
 * <ChipList chips={['Apple', 'Banana', 'Cherry']} selection='multiple' removable={true} />
 * ```
 */
export const ChipList = forwardRef((props, ref) => {
    const chipListRef = useRef(null);
    const [chipData, setChipData] = useState([]);
    const [selectedIndexes, setSelectedIndexes] = useState([]);
    const [focusedIndex, setFocusedIndex] = useState(null);
    const prevSelectedChipsRef = useRef([]);
    const { dir } = useProviderContext();
    const { chips = [], className, disabled = false, selectedChips = [], selection = 'none', removable = false, onClick, onDelete, onSelect, ...otherProps } = props;
    useEffect(() => {
        let newChipData = null;
        if (chips.length > 0) {
            newChipData = chips.map((chip) => chip);
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
            if (selection === 'single') {
                setSelectedIndexes((prev) => [prev[prev.length - 1]]);
            }
            else if (selection === 'none') {
                setSelectedIndexes([]);
            }
        }
    }, [selection]);
    useEffect(() => {
        if ((selectedChips && chipData.length > 0 && JSON.stringify(prevSelectedChipsRef.current) !== JSON.stringify(selectedChips))) {
            if (selection === 'none') {
                return;
            }
            let finalSelectedIndexes = [];
            if (selection === 'single') {
                finalSelectedIndexes = selectedChips.slice(0, 1);
            }
            else if (selection === 'multiple') {
                finalSelectedIndexes = selectedChips;
            }
            setSelectedIndexes(finalSelectedIndexes);
            prevSelectedChipsRef.current = selectedChips;
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
    const refInstance = {
        chips: chipData,
        disabled,
        selectedChips,
        selection,
        removable
    };
    refInstance.getSelectedChips = () => {
        if (selection === 'none' || selectedIndexes.length === 0) {
            return [];
        }
        const data = [];
        selectedIndexes.forEach((index) => {
            const chip = chipData[index];
            (data).push(chip);
        });
        if (selection === 'single') {
            return data[0] ? [data[0]] : [];
        }
        return data;
    };
    useImperativeHandle(ref, () => ({
        ...refInstance,
        element: chipListRef.current
    }));
    const handleFocus = useCallback((index) => {
        setFocusedIndex(index);
    }, []);
    const handleBlur = useCallback(() => {
        setFocusedIndex(null);
    }, []);
    const handleClick = useCallback((e, index) => {
        if (onClick) {
            onClick(e);
        }
        if (selection !== 'none') {
            setFocusedIndex(null);
            let newSelectedIndexes = [...selectedIndexes];
            if (selection === 'single') {
                newSelectedIndexes = [index];
            }
            else if (selection === 'multiple') {
                newSelectedIndexes = selectedIndexes.includes(index)
                    ? selectedIndexes.filter((i) => i !== index)
                    : [...selectedIndexes, index];
            }
            if (onSelect) {
                onSelect({ event: e, selectedChipIndexes: newSelectedIndexes });
            }
            else {
                setSelectedIndexes(newSelectedIndexes);
            }
        }
    }, [onClick, selection, selectedIndexes, onSelect, refInstance]);
    const handleDelete = useCallback((e, index) => {
        e.stopPropagation();
        if (onDelete) {
            const updatedChips = chipData.filter((_, i) => i !== index);
            onDelete({ event: e, chips: updatedChips });
        }
        else {
            setChipData((prevChipData) => prevChipData.filter((_, i) => i !== index));
            if (chipData.length > 1) {
                const newFocusIndex = index !== 0 ? index - 1 : 0;
                chipListRef.current?.children[newFocusIndex]?.focus();
            }
        }
    }, [onDelete, chipData]);
    const handleKeyDown = useCallback((e, index, chip) => {
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
    const memoizedOnClick = useCallback((index) => {
        return (e) => handleClick(e, index);
    }, [handleClick, selectedIndexes]);
    const MemoizedOnDelete = useCallback((index) => {
        return (args) => removable && handleDelete(args.event, index);
    }, [removable, handleDelete]);
    const MemoizedOnFocus = useCallback((index) => {
        return () => handleFocus(index);
    }, [handleFocus]);
    const MemoizedOnKeyDown = useCallback((index, chip) => {
        return (e) => handleKeyDown(e, index, chip);
    }, [handleKeyDown]);
    const memoizedChipData = useMemo(() => chipData, [chipData]);
    const memoizedSelectedIndexes = useMemo(() => selectedIndexes, [selectedIndexes]);
    const memoizedFocusedIndex = useMemo(() => focusedIndex, [focusedIndex]);
    const renderChip = (chip, index, props, selectedIndexes, focusedIndex, memoizedOnClick, MemoizedOnDelete, MemoizedOnFocus, handleBlur, MemoizedOnKeyDown) => {
        const chipProps = typeof chip === 'object' ? chip : { text: chip.toString() };
        const { children, className, removable, htmlAttributes, color, ...restChipProps } = chipProps;
        const isSelected = selectedIndexes.includes(index);
        const isFocused = focusedIndex === index;
        const isEnabled = chipProps.disabled !== true && props.disabled !== true;
        const chipClassNames = [
            'sf-chip',
            selection === 'multiple' ? 'sf-selectable' : '',
            className ? className : props.className,
            isEnabled ? '' : 'sf-disabled',
            isSelected ? 'sf-active' : '',
            isFocused ? 'sf-focused' : '',
            chipProps.avatar ? 'sf-chip-avatar-wrap' :
                chipProps.leadingIcon ? 'sf-chip-icon-wrap' : '',
            chipProps.variant === 'outlined' ? 'sf-outline' : '',
            chipProps.color ? `sf-${color}` : ''
        ].filter(Boolean).join(' ');
        const { onClick, ...otherHtmlAttributes } = htmlAttributes || {};
        return (_jsx(MemoizedChip, { ...restChipProps, chipColor: color, removable: props.removable ? !isNullOrUndefined(removable) ? removable : true : false, className: chipClassNames, children: children, onClick: memoizedOnClick(index), onDelete: MemoizedOnDelete(index), onFocus: MemoizedOnFocus(index), onBlur: handleBlur, tabIndex: isEnabled ? 0 : -1, role: 'option', onKeyDown: MemoizedOnKeyDown(index, chipProps), "aria-selected": isSelected ? 'true' : 'false', "aria-disabled": !isEnabled ? 'true' : 'false', "aria-label": chipProps.text, index: index, disabled: !isEnabled, isFocused: isFocused, isSelected: isSelected, ...otherHtmlAttributes }, index));
    };
    const renderContent = useMemo(() => memoizedChipData.map((chip, index) => renderChip(chip, index, props, memoizedSelectedIndexes, memoizedFocusedIndex, memoizedOnClick, MemoizedOnDelete, MemoizedOnFocus, handleBlur, MemoizedOnKeyDown)), [memoizedChipData, props, memoizedSelectedIndexes, memoizedFocusedIndex,
        memoizedOnClick, MemoizedOnDelete, MemoizedOnFocus, handleBlur, MemoizedOnKeyDown]);
    const classes = React.useMemo(() => {
        return [
            'sf-control',
            'sf-chip-list',
            'sf-chip-set',
            selection === 'multiple' ? 'sf-multi-selection' : selection === 'single' ? 'sf-selection' : '',
            'sf-lib',
            dir === 'rtl' ? 'sf-rtl' : '',
            props.className,
            !disabled ? '' : 'sf-disabled'
        ].filter(Boolean).join(' ');
    }, [selection, dir, props.className, disabled]);
    return (_jsx("div", { ref: chipListRef, className: classes, role: "listbox", "aria-multiselectable": selection === 'multiple' ? 'true' : 'false', "aria-disabled": (disabled) ? 'true' : 'false', ...otherProps, children: renderContent }));
});
export default React.memo(ChipList);
const MemoizedChip = React.memo(({ isSelected, isFocused, chipColor, ...props }) => _jsx(Chip, { ...props, color: chipColor }), (prevProps, nextProps) => {
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
        prevProps.avatar === nextProps.avatar &&
        prevProps.leadingIcon === nextProps.leadingIcon &&
        prevProps.trailingIcon === nextProps.trailingIcon);
});
