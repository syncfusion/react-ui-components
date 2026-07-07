import { useMemo, useCallback, FC, memo, type MouseEvent } from 'react';
import { DropdownContextType, useDropdownContext } from '../context';
import { buildCustomValueClasses } from '../utils';

export const DropdownCustomValue: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { text },
        config: { customValue, multiSelectable },
        internalProps: { commitIfCustom, isCustomElemFocused }
    } = context;

    const onCustomValueClick: (e: MouseEvent<HTMLSpanElement>) => void = useCallback((e: MouseEvent<HTMLSpanElement>) => {
        commitIfCustom?.(e);
    }, [commitIfCustom]);

    const customValueClassNames: string = useMemo(() => {
        return buildCustomValueClasses(isCustomElemFocused);
    }, [isCustomElemFocused]);

    if (!customValue || !multiSelectable || !text) {
        return null;
    }

    return (<span className={customValueClassNames} onMouseDown={onCustomValueClick}>{text}</span>);
});

DropdownCustomValue.displayName = 'DropdownCustomValue';

export default DropdownCustomValue;
