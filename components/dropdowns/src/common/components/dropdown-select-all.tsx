import { useMemo, useCallback, FC, memo, type SyntheticEvent } from 'react';
import { Checkbox } from '@syncfusion/react-buttons';
import { DropdownContextType, useDropdownContext } from '../context';
import { buildSelectAllNodeClasses } from '../utils';
import { CSS_CLASSES } from '../constants';

export const DropdownSelectAll: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        actions: { setIsSpanFocused },
        config: { multiSelectable, checkbox, showSelectAll, selectAllText, unSelectAllText, size },
        refs: { inputElementRef },
        internalProps: { isAllSelected, isIndeterminate, handleSelectAll, isShowSelectAllFocused },
        state: {itemData}
    } = context;

    const onSelectAllClick: (e: SyntheticEvent) => void = useCallback((e: SyntheticEvent) => {
        handleSelectAll(e);
        inputElementRef.current?.focus();
        setIsSpanFocused(true);
    }, [inputElementRef, setIsSpanFocused, itemData]);

    const selectAllNodeClassNames: string = useMemo(() => {
        return buildSelectAllNodeClasses(isShowSelectAllFocused);
    }, [isShowSelectAllFocused]);

    if (!multiSelectable || !checkbox || !showSelectAll) {
        return null;
    }

    return (
        <>
            <div className={selectAllNodeClassNames} onMouseDown={onSelectAllClick}>
                <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} type='hidden' size={size} readOnly tabIndex={-1} />
                <span className={CSS_CLASSES.SELECT_ALL_TEXT}>
                    {isAllSelected ? unSelectAllText : selectAllText}
                </span>
            </div>
            <div className={`${CSS_CLASSES.SEPARATOR} ${CSS_CLASSES.NO_POINTER}`}></div>
        </>
    );
});

DropdownSelectAll.displayName = 'DropdownSelectAll';

export default DropdownSelectAll;
