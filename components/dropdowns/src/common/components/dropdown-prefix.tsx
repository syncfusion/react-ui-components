import { FC, memo } from 'react';
import { renderAdornmentElement } from '@syncfusion/react-inputs';
import { DropdownContextType, useDropdownContext } from '../context';

export const DropdownPrefix: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const { config: { prefix } } = context;

    if (!prefix) {
        return null;
    }

    return <>{renderAdornmentElement(prefix)}</>;
});

DropdownPrefix.displayName = 'DropdownPrefix';

export default DropdownPrefix;
