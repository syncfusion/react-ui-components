import { FC, memo, useMemo } from 'react';
import { Spinner } from '@syncfusion/react-popups';
import { DropdownContextType, useDropdownContext } from '../context';
import { Size } from '../../drop-down-list/types';
import { buildIconClasses } from '../utils';

export const DropdownIcon: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { isPopupOpen },
        config: { size, dropdownIcon },
        internalProps: { dropdownIconClick, uiLoading }
    } = context;

    const iconClassNames: string = useMemo(() => {
        return buildIconClasses(isPopupOpen);
    }, [isPopupOpen]);

    return (
        <>
            {!uiLoading && dropdownIcon ? (<span onMouseDown={dropdownIconClick} aria-hidden='true' className={iconClassNames} > {dropdownIcon} </span>) : null}
            {uiLoading ? (<Spinner size={size === Size.Small ? '16px' : '20px'} visible={true} />) : null}
        </>
    );
});

DropdownIcon.displayName = 'DropdownIcon';

export default DropdownIcon;
