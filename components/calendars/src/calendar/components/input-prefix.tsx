import * as React from 'react';
import { renderAdornmentElement } from '@syncfusion/react-inputs';

export interface InputPrefixProps {
    prefix?: React.ReactNode;
}

export const InputPrefix: React.FC<InputPrefixProps> = React.memo(({ prefix }: InputPrefixProps ) => {
    if (!prefix) {
        return null;
    }

    return <>{renderAdornmentElement(prefix)}</>;
});

InputPrefix.displayName = 'InputPrefix';

export default InputPrefix;
