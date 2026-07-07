import { FC, memo, useMemo } from 'react';
import { DropdownContextType, useDropdownContext } from '../context';
import { IL10n, L10n } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../constants';

const NO_RECORDS_FOUND: string = 'No Records Found';
const DEFAULT_COMPONENT: string = 'dropdownList';
const LOCALE_PROP: string = 'noRecordsMessage';

export const DropdownNoRecords: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { isDataInitialized },
        config: { noRecordsTemplate, localeComponentName, locale },
        internalProps: { computedNonHiddenItems }
    } = context;

    const defaultText: string = useMemo(() => {
        const localeStrings: Record<string, string> = { noRecordsMessage: NO_RECORDS_FOUND };
        const l10nInstance: IL10n = L10n(localeComponentName || DEFAULT_COMPONENT, localeStrings, locale);
        return l10nInstance.getConstant(LOCALE_PROP);
    }, [locale, localeComponentName]);

    if (!isDataInitialized || computedNonHiddenItems.length > 0) {
        return null;
    }

    return (
        <>
            {noRecordsTemplate ? noRecordsTemplate : <div className={`${CSS_CLASSES.ERROR_WRAPPER_CLASS} ${CSS_CLASSES.NO_RECORDS}`}>
                {defaultText}
            </div>}
        </>
    );
});

DropdownNoRecords.displayName = 'DropdownNoRecords';

export default DropdownNoRecords;
