import { FC, memo } from 'react';
import { HelperText } from '@syncfusion/react-inputs';
import { DropdownContextType, useDropdownContext } from '../context';

export const DropdownHelperText: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { isSpanFocused },
        config: { helperText, helperTextOnFocus = false, helperTextDirection = 'Left' }
    } = context;

    if (!helperText) {
        return null;
    }

    return (
        <HelperText
            helperText={helperText}
            helperTextOnFocus={helperTextOnFocus}
            isFocused={isSpanFocused}
            helperTextDirection={helperTextDirection}
        />
    );
});

DropdownHelperText.displayName = 'DropdownHelperText';

export default DropdownHelperText;
