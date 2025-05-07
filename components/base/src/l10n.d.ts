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
export declare function L10n(controlName: string, localeStrings: Object, locale?: string): IL10n;
export declare namespace L10n {
    var locale: object;
    var load: (localeObject: Object) => void;
}
