import { FC, memo, useCallback, useMemo, RefObject, type ChangeEvent, type KeyboardEvent } from 'react';
import { InputBase, renderClearButton, Size } from '@syncfusion/react-inputs';
import { Spinner } from '@syncfusion/react-popups';
import { DropdownContextType, useDropdownContext } from '../context';
import { isFilterKeyBlocked } from '../utils';
import { CSS_CLASSES } from '../constants';

export const DropdownPopupInput: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { isPopupFilterLoading, typedString, isDataInitialized },
        actions: { setTypedString },
        refs: { filterInputElementRef },
        config: { id, size, filterable, filterPlaceholder, spanClickable, dataSource },
        internalProps: { clearText, handleInputChange, keyActionHandler }
    } = context;

    const handleFilterChange: (e: ChangeEvent<HTMLInputElement>) => void =
        useCallback((e: ChangeEvent<HTMLInputElement>): void => {
            const currentText: string = e.target.value;
            setTypedString(currentText);
            handleInputChange(e);
        }, [setTypedString, dataSource]);

    const filterWrapperClasses: string = useMemo(() => {
        return [
            CSS_CLASSES.INPUT_GROUP,
            CSS_CLASSES.CONTROL,
            CSS_CLASSES.INPUT_FOCUS,
            CSS_CLASSES.POPUP_INPUT_FILTER,
            size === Size.Small ? CSS_CLASSES.SMALL : size === Size.Large ? CSS_CLASSES.LARGE : CSS_CLASSES.MEDIUM
        ].filter(Boolean).join(' ');
    }, [size]);

    const handleFilterKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void =
        useCallback((e: KeyboardEvent<HTMLInputElement>) => {
            if (isFilterKeyBlocked(e.key)) {
                return;
            }
            keyActionHandler?.(e);
        }, [keyActionHandler]);

    if (!filterable || !spanClickable || !isDataInitialized) {
        return null;
    }

    return (
        <span className={CSS_CLASSES.POPUP_INPUT_PARENT}>
            <span className={filterWrapperClasses} >
                <InputBase
                    name={id + '_filter'}
                    ref={filterInputElementRef as RefObject<HTMLInputElement>}
                    type='text'
                    value={typedString}
                    className={CSS_CLASSES.POPUP_INPUT_FILTER_ELEMENT}
                    placeholder={filterPlaceholder}
                    title='Filter'
                    onChange={handleFilterChange}
                    onKeyDown={handleFilterKeyDown}
                />
                {isPopupFilterLoading ? (<Spinner size={size === Size.Small ? '16px' : '20px'} />) : renderClearButton(typedString, clearText)}
            </span>
        </span>
    );
});

DropdownPopupInput.displayName = 'DropdownPopupInput';

export default DropdownPopupInput;
