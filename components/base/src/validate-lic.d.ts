export declare const componentList: string[];
export type ILicenseValidator = {
    isValidated: boolean;
    isLicensed: boolean;
    version: string;
    platform: RegExp;
    errors: IErrorType;
    validate: () => boolean;
    getDecryptedData: (key: string) => string;
    getInfoFromKey: () => IValidator[];
};
/**
 * License validation module
 *
 * @private
 * @param {string} key - License key to validate
 * @returns {LicenseValidator} License validator object
 * @private
 */
export declare function LicenseValidator(key?: string): ILicenseValidator;
/**
 * Converts the given number to characters.
 *
 * @private
 * @param {number} cArr - Specifies the license key as number.
 * @returns {string} ?
 */
export declare function convertToChar(cArr: number[]): string;
/**
 * To set license key.
 *
 * @param {string} key - license key
 * @returns {void}
 */
export declare function registerLicense(key: string): void;
/**
 * Validates the license key.
 *
 * @private
 * @param {string} [key] - Optional license key to validate
 * @returns {boolean} Returns true if license is valid, false otherwise
 */
export declare function validateLicense(key?: string): boolean;
/**
 * Gets the version information from the license validator.
 *
 * @private
 * @returns {string} The version string from the license validator
 */
export declare function getVersion(): string;
/**
 * Method for create overlay over the sample
 *
 * @private
 * @returns {void}
 */
export declare function createLicenseOverlay(): void;
interface IValidator {
    version?: string;
    expiryDate?: string;
    platform?: string;
    invalidPlatform?: boolean;
    lastValue?: number;
    minVersion?: number;
}
interface IErrorType {
    noLicense: string;
    trailExpired: string;
    versionMismatched: string;
    platformMismatched: string;
    invalidKey: string;
}
export {};
