import { FC, memo } from 'react';
import { renderAdornmentElement } from '@syncfusion/react-inputs';
import { DropdownContextType, useDropdownContext } from '../context';

export const DropdownSuffix: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const { config: { suffix } } = context;

    if (!suffix) {
        return null;
    }

    return <>{renderAdornmentElement(suffix)}</>;
});

DropdownSuffix.displayName = 'DropdownSuffix';

export default DropdownSuffix;
