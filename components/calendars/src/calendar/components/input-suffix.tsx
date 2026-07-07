import * as React from 'react';
import { renderAdornmentElement } from '@syncfusion/react-inputs';

export interface InputSuffixProps {
    suffix?: React.ReactNode;
}

export const InputSuffix: React.FC<InputSuffixProps> = React.memo(({ suffix }: InputSuffixProps) => {
    if (!suffix) {
        return null;
    }

    return <>{renderAdornmentElement(suffix)}</>;
});

InputSuffix.displayName = 'InputSuffix';

export default InputSuffix;
