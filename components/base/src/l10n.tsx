import { extend, isNullOrUndefined } from './util';
import { defaultCulture } from './internationalization';

/**
 * L10n modules provides localized text for different culture.
 */
export interface IL10n {
    /**
     * Sets the locale text.
     *
     * @param {string} locale
     * @returns {void}
     */
    setLocale(locale: string): void;

    /**
     * Returns current locale text for the property based on the culture name and control name.
     *
     * @param {string} prop - Specifies the property for which localize text to be returned.
     * @returns {string}
     */
    getConstant(prop: string): string;
}

/**
 * L10n modules provides localized text for different culture.
 *
 * @param {string} controlName - name of the control.
 * @param {object} localeStrings - collection of locale string.
 * @param {string} locale - default locale string.
 * @returns {L10n} - Returns configured properties and methods for localization.
 */
export function L10n(controlName: string, localeStrings: Object, locale?: string): IL10n {
    let currentLocale: object = {};

    /**
     * Sets the locale text.
     *
     * @param {string} locale - Specifies the locale to be set.
     * @returns {void}
     */
    function setLocale(locale: string): void {
        const intLocale: Object = intGetControlConstant(L10n.locale, locale);
        currentLocale = intLocale || localeStrings;
    }
    /**
     * Returns current locale text for the property based on the culture name and control name.
     *
     * @param {string} prop - Specifies the property for which localized text to be returned.
     * @returns {string} ?
     */
    function getConstant(prop: string): string {
        if (!isNullOrUndefined(currentLocale[`${prop}`])) {
            return currentLocale[`${prop}`];
        } else {
            return localeStrings[`${prop}`] || '';
        }
    }

    /**
     * Returns the control constant object for current object and the locale specified.
     *
     * @param {Object} curObject ?
     * @param {string} locale ?
     * @returns {Object} ?
     */
    function intGetControlConstant(curObject: Object, locale: string): Object {
        if (curObject[`${locale}`]) {
            return curObject[`${locale}`][`${controlName}`];
        }
        return null;
    }

    setLocale(locale || defaultCulture);

    return {
        setLocale,
        getConstant
    };
}

L10n.locale = {} as object;

/**
 * Sets the global locale for all components.
 *
 * @param {Object} localeObject - Specifies the localeObject to be set as global locale.
 * @returns {void}
 */
L10n.load = (localeObject: Object): void => {
    L10n.locale = extend(L10n.locale, localeObject, {}, true);
};
