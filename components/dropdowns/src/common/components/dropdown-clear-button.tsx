import { FC, memo, useCallback, type MouseEvent } from 'react';
import { renderClearButton } from '@syncfusion/react-inputs';
import { DropdownContextType, useDropdownContext } from '../context';
import { getLastItemData, updateItemData } from '../utils';

const VALID_TEXT: string = 'valid';

export const DropdownClearButton: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { text, itemData, isSpanFocused, isPopupOpen, dropdownValue },
        actions: { setText, setDropdownValue, setItemData },
        config: { clearButton, multiSelectable, spanClickable, onChange, filterable },
        internalProps: { hidePopup, clearText }
    } = context;

    const handleClear: (e: MouseEvent) => void = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setText('');
        setDropdownValue(updateItemData(dropdownValue, null, Boolean(multiSelectable)));
        setItemData(updateItemData(itemData, null, Boolean(multiSelectable)));
        if (!spanClickable) {
            if (isPopupOpen) {
                hidePopup();
            }
            if (filterable) {
                clearText(e);
            }
        }
        if (onChange) {
            onChange({
                event: e, previousItemData: getLastItemData(itemData) ?? null,
                value: multiSelectable ? [] : null, itemData: null
            });
        }
    }, [onChange, itemData, setText, setDropdownValue, setItemData, isPopupOpen, dropdownValue, clearText]);

    const shouldShowClearButton: boolean = Boolean(clearButton && (text || (itemData?.length ?? 0) > 0) && (isSpanFocused || isPopupOpen));

    if (!shouldShowClearButton) { return null; }

    return renderClearButton(VALID_TEXT, handleClear, clearButton);
});

DropdownClearButton.displayName = 'DropdownClearButton';

export default DropdownClearButton;
