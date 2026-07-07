import { FC, memo } from 'react';
import { DropdownContextType, useDropdownContext } from '../context';
import { CSS_CLASSES } from '../constants';

export const DropdownFooter: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        config: { footerTemplate }
    } = context;

    if (!footerTemplate) {
        return null;
    }

    return (
        <div className={CSS_CLASSES.FOOTER}>
            {footerTemplate}
        </div>
    );
});

DropdownFooter.displayName = 'DropdownFooter';

export default DropdownFooter;
