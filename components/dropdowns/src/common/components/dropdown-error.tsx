import { FC, memo, useMemo } from 'react';
import { DropdownContextType, useDropdownContext } from '../context';
import { IL10n, L10n } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../constants';

const ERROR_MESSAGE: string = 'Request Failed';
const DEFAULT_COMPONENT: string = 'dropdownList';
const LOCALE_PROP: string = 'errorMessage';

export const DropdownError: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { isActionFailed, isDataInitialized },
        config: { onErrorTemplate, localeComponentName, locale }
    } = context;

    const defaultText: string = useMemo(() => {
        const localeStrings: Record<string, string> = { errorMessage: ERROR_MESSAGE };
        const l10nInstance: IL10n = L10n(localeComponentName || DEFAULT_COMPONENT, localeStrings, locale);
        return l10nInstance.getConstant(LOCALE_PROP);
    }, [locale, localeComponentName]);

    if (!isActionFailed || isDataInitialized) {
        return null;
    }

    return (
        <>
            {onErrorTemplate ? onErrorTemplate : <div className={CSS_CLASSES.ERROR_WRAPPER_CLASS}>
                { defaultText}
            </div>}
        </>
    );
});

DropdownError.displayName = 'DropdownError';

export default DropdownError;
