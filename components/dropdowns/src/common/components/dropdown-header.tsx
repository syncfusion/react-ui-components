import { FC, memo } from 'react';
import { DropdownContextType, useDropdownContext } from '../context';
import { CSS_CLASSES } from '../constants';

export const DropdownHeader: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        config: { headerTemplate }
    } = context;

    if (!headerTemplate) {
        return null;
    }

    return (
        <div className={CSS_CLASSES.HEADER}>
            {headerTemplate}
        </div>
    );
});

DropdownHeader.displayName = 'DropdownHeader';

export default DropdownHeader;
