import { getValue, containerObject, isNullOrUndefined, productToComponentsMap } from './util';
import { createElement } from './dom';

export const pdfViewerSDKComponents: string[] = ['grid', 'chart', 'maps', 'schedule', 'gantt', 'richtexteditor', 'kanban', 'treegrid', 'filemanager', 'pivotview', 'diagram', 'blockeditor', 'spreadsheet', 'DocumentEditor', 'headless-editor', 'richtexteditor-ui'];
export const spreadsheetEditorSDKComponents: string[] = ['maps', 'schedule', 'gantt', 'richtexteditor', 'kanban', 'treegrid', 'filemanager', 'pivotview', 'diagram', 'blockeditor', 'PdfViewer', 'DocumentEditor', 'pdf', 'pdf-extract', 'headless-editor', 'richtexteditor-ui'];
export const wordEditorSDKComponents: string[] = ['grid', 'maps', 'schedule', 'gantt', 'richtexteditor', 'kanban', 'treegrid', 'filemanager', 'pivotview', 'diagram', 'blockeditor', 'PdfViewer', 'spreadsheet', 'pdf', 'pdf-extract'];
export const gridSDKComponents: string[] = ['maps', 'schedule', 'gantt', 'richtexteditor', 'kanban', 'filemanager', 'diagram', 'blockeditor', 'spreadsheet', 'DocumentEditor', 'PdfViewer', 'pdf', 'pdf-extract', 'headless-editor', 'richtexteditor-ui'];
export const fileManagerSDKComponents: string[] = ['chart', 'treegrid', 'pivotview', 'maps', 'schedule', 'gantt', 'richtexteditor', 'kanban', 'diagram', 'blockeditor', 'spreadsheet', 'DocumentEditor', 'PdfViewer', 'pdf', 'pdf-extract', 'headless-editor', 'richtexteditor-ui'];
export const chartsSDKComponents: string[] = ['grid', 'treegrid', 'pivotview', 'schedule', 'gantt', 'richtexteditor', 'kanban', 'filemanager', 'diagram', 'blockeditor', 'spreadsheet', 'DocumentEditor', 'PdfViewer', 'pdf', 'pdf-extract', 'headless-editor', 'richtexteditor-ui'];
export const rteSDKComponents: string[] = ['chart', 'treegrid', 'pivotview', 'maps', 'schedule', 'gantt', 'kanban', 'diagram', 'spreadsheet', 'DocumentEditor', 'PdfViewer', 'pdf', 'pdf-extract'];
export const diagramSDKComponents: string[] = ['grid', 'treegrid', 'pivotview', 'chart', 'maps', 'schedule', 'gantt', 'richtexteditor', 'kanban', 'filemanager', 'blockeditor', 'spreadsheet', 'DocumentEditor', 'PdfViewer', 'pdf', 'pdf-extract', 'headless-editor', 'richtexteditor-ui'];
export const ganttSDKComponents: string[] = ['chart', 'pivotview', 'schedule', 'diagram', 'blockeditor', 'spreadsheet', 'DocumentEditor', 'PdfViewer', 'pdf', 'pdf-extract'];
export const schedulerSDKComponents: string[] = ['grid', 'treegrid', 'pivotview', 'chart', 'maps', 'gantt', 'richtexteditor', 'kanban', 'filemanager', 'diagram', 'blockeditor', 'spreadsheet', 'DocumentEditor', 'PdfViewer', 'pdf', 'pdf-extract', 'headless-editor', 'richtexteditor-ui'];

const bypassKey: number[] = [115, 121, 110, 99, 102, 117, 115, 105, 111, 110, 46,
    105, 115, 76, 105, 99, 86, 97, 108, 105, 100, 97, 116, 101, 100];
const bypassKey2: number[] = [115, 121, 110, 99, 102, 117, 115, 105,
    111, 110, 46, 105, 115, 69, 83, 85, 73, 76, 105, 99, 86, 97, 108, 105, 100, 97, 116, 101, 100];
const esUI: string[] = ['spreadsheet', 'DocumentEditor', 'PdfViewer', 'pdf', 'pdf-extract'];

/**
 * Product map with base64-encoded product names
 */
const productMap: { [key: string]: string } = {
    PDFViewerSDK: 'UERGVmlld2Vy',
    DocumentSDK: 'RG9jdW1lbnQ==',
    DOCXEditorSDK: 'V29yZEVkaXRvcg=',
    SchedulerSDK: 'U2NoZWR1bGVyU0RL',
    GanttSDK: 'R2FudHRTREs=',
    DiagramSDK: 'RGlhZ3JhbVNESw==',
    RichTextEditorSDK: 'UmljaFRleHRFZGl0b3JTREs=',
    GridSDK: 'R3JpZFNESw==',
    ChartSDK: 'Q2hhcnRTREs=',
    FileManagerSDK: 'RmlsZU1hbmFnZXJTREs=',
    Markdown: 'TWFya2Rvd24=',
    UIComponent: 'VUlDb21wb25lbnQ='
};

/**
 * Build component to product map dynamically from productToComponentsMap
 * This reduces duplication and makes maintenance easier
 *
 * @returns {buildComponentToProductMap} Component-to-product mapping.
 */
function buildComponentToProductMap(): { [key: string]: string } {
    const map: { [key: string]: string } = {};

    for (const [product, components] of Object.entries(productToComponentsMap ?? {})) {
        for (const component of components) {
            // eslint-disable-next-line security/detect-object-injection
            map[component] = product;
        }
    }
    return map;
}

const componentToProductMap: { [key: string]: string } = buildComponentToProductMap();

let accountURL: string;
let banner: boolean = true;

export type ILicenseValidator = {
    isLicensed: boolean,
    version: string,
    platform: RegExp,
    errors: IErrorType,
    validate: (component: string) => boolean,
    getDecryptedData: (key: string) => string,
    getInfoFromKey: () => IValidator[]
}

/**
 * License validation module
 *
 * @param {string} key - License key to validate
 * @returns {LicenseValidator} License validator object
 * @private
 */
export function LicenseValidator(key: string = ''): ILicenseValidator {
    let isLicensed: boolean = true;
    const version: string = '35';
    const platform: RegExp = /JavaScript|ASPNET|ASPNETCORE|ASPNETMVC|FileFormats|essentialstudio/i;
    const prefixRegex: RegExp = /essentialui|pdfviewersdk|documentsdk|spreadsheeteditorsdk|schedulersdk|ganttsdk|diagramsdk|richtexteditorsdk|gridsdk|chartsdk|filemanagersdk|docxeditorsdk/i;
    const incorrectPlatform: RegExp = /JavaScript|ASPNET|ASPNETCORE|ASPNETMVC|FileFormats/i;
    const errors: IErrorType = {
        noLicense: '<span>This application was built using a trial version of Syncfusion<sup>®</sup> Essential Studio<sup>®</sup>.' +
            ' To remove the license validation message permanently, a valid license key must be included.</span>',
        trailExpired: '<span>This application was built using a trial version of Syncfusion<sup>®</sup> Essential Studio<sup>®</sup>, which has now expired.' +
            ' To remove the license validation message permanently, a valid license key must be included.</span>',
        versionMismatched: '<span>The included Syncfusion<sup>®</sup> key and package versions do not match. Ensure that the license key corresponds to the same package version.</span>',
        platformMismatched: '<span>The included Syncfusion<sup>®</sup> license key is not compatible with this platform. Please register the appropriate platform license keys.</span>',
        invalidKey: '<span>The included Syncfusion<sup>®</sup> license key is invalid. Please register a valid license key to use the corresponding UI components.</span>',
        uiSuite: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the UI Components. To use other Document solutions SDK components, please register the appropriate license keys.</span>',
        documentSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the Document SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        pdfSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the PDF Viewer SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        spreadSheetSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the Spreadsheet Editor SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        docxEditorSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the DOCX Editor SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        gridSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the Grid SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        filemanagerSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the FileManager SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        ganttSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the Gantt SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        rteSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the RTE SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        diagaramSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the Diagram SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        schedulerSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the Scheduler SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>',
        chartSdk: '<span>The included Syncfusion<sup>®</sup> license key is valid only for the Chart SDK components. To use other UI or SDK components, please register the appropriate license keys.</span>'
    };

    const validatedPlatforms: string[] = [];

    const allowedComponentsMap: { [key: string]: string[] } = {
        'pdfviewersdk': pdfViewerSDKComponents,
        'spreadsheeteditorsdk': spreadsheetEditorSDKComponents,
        'docxeditorsdk': wordEditorSDKComponents,
        'gridsdk': gridSDKComponents,
        'filemanagersdk': fileManagerSDKComponents,
        'chartsdk': chartsSDKComponents,
        'richtexteditorsdk': rteSDKComponents,
        'diagramsdk': diagramSDKComponents,
        'ganttsdk': ganttSDKComponents,
        'schedulersdk': schedulerSDKComponents
    };

    /**
     * To manage licensing operation.
     */
    const manager: {
        setKey: (key: string) => void;
        getKey: () => string;
    } = (() => {
        let licKey: string = '';
        /**
         * Sets the license key.
         *
         * @param {string} key - Specifies the license key.
         * @returns {void}
         */
        function set(key: string): void { licKey = key; }
        /**
         * Gets the license key.
         *
         * @returns {string} -Gets the license key.
         */
        function get(): string { return licKey; }
        return {
            setKey: set,
            getKey: get
        };
    })();

    /**
     * To manage npx licensing operation.
     */
    const npxManager: {
        getKey: () => string;
    } = (() => {
        const npxLicKey: string = 'npxKeyReplace';
        /**
         * Gets the license key.
         *
         * @returns {string} - Gets the license key.
         */
        function get(): string { return npxLicKey; }
        return {
            getKey: get
        };
    })();

    manager.setKey(key);

    /**
     * To validate the provided license key.
     *
     * @param {string} component - Specifies the component name.
     * @returns {boolean} ?
     */
    function validate(component: string): boolean {
        const contentKey: number[] = [115, 121, 110, 99, 102, 117, 115, 105, 111, 110, 46, 108, 105,
            99, 101, 110, 115, 101, 67, 111, 110, 116, 101, 110, 116];
        const URLKey: number[] = [115, 121, 110, 99, 102, 117, 115, 105, 111, 110, 46, 99, 108,
            97, 105, 109, 65, 99, 99, 111, 117, 110, 116, 85, 82, 76];
        if ((containerObject && !getValue(convertToChar(bypassKey), containerObject) && !getValue('Blazor', containerObject))) {
            let validateMsg: string | null = null;
            let validateURL: string | null = null;
            if ((manager && manager.getKey()) || (npxManager && npxManager.getKey() !== 'npxKeyReplace')) {
                const result: IValidator[] = getInfoFromKey();
                if (result && result.length) {
                    let componentRestrictedMsg: string | undefined;
                    for (const res of result) {
                        let hasError: boolean = false;
                        if ((!platform.test(res.platform) && !prefixRegex.test(res.platform)) || res.invalidPlatform) {
                            validateMsg = errors.platformMismatched;
                        }
                        else if (incorrectPlatform.test(res.platform) && parseInt(res.version.split('.')[0], 10) > 30) {
                            validateMsg = errors.platformMismatched;
                        }
                        else if (prefixRegex.test(res.platform) && parseInt(res.version.split('.')[0], 10) > 30) {
                            const restrictionMsg: string | null = restrictComponent(component, res.platform);
                            if (restrictionMsg) {
                                componentRestrictedMsg = restrictionMsg;
                                hasError = true;
                            }
                            else {
                                componentRestrictedMsg = null;
                                isLicensed = true;
                            }
                            if (((res.minVersion >= res.lastValue) && (res.minVersion !== res.lastValue)) ||
                                (res.lastValue < parseInt(version, 10))) {
                                validateMsg = errors.versionMismatched;
                                validateMsg = validateMsg.replace('##LicenseVersion', res.version);
                                validateMsg = validateMsg.replace('##Requireversion', version + '.x');
                            }
                            else {
                                if (res.lastValue == null || isNaN(res.lastValue)) {
                                    validateMsg = errors.versionMismatched;
                                    validateMsg = validateMsg.replace('##LicenseVersion', res.version);
                                    validateMsg = validateMsg.replace('##Requireversion', version + '.x');
                                }
                            }
                            if (res.expiryDate) {
                                const expDate: Date = new Date(res.expiryDate);
                                const currDate: Date = new Date();
                                if (expDate !== currDate && expDate < currDate) {
                                    validateMsg = errors.trailExpired;
                                    hasError = true;
                                }
                            }
                            if ((res.platform === 'documentsdk') && (component !== 'pdf' && component !== 'pdf-extract')) {
                                isLicensed = false;
                            }
                            if (!validateMsg && !componentRestrictedMsg) {
                                break;
                            }
                        }
                        else {
                            if (((res.minVersion >= res.lastValue) && (res.minVersion !== res.lastValue)) ||
                                (res.lastValue < parseInt(version, 10))) {
                                validateMsg = errors.versionMismatched;
                                validateMsg = validateMsg.replace('##LicenseVersion', res.version);
                                validateMsg = validateMsg.replace('##Requireversion', version + '.x');
                            }
                            else {
                                if (res.lastValue == null || isNaN(res.lastValue)) {
                                    validateMsg = errors.versionMismatched;
                                    validateMsg = validateMsg.replace('##LicenseVersion', res.version);
                                    validateMsg = validateMsg.replace('##Requireversion', version + '.x');
                                }
                            }
                            if (res.expiryDate) {
                                const expDate: Date = new Date(res.expiryDate);
                                const currDate: Date = new Date();
                                if (expDate !== currDate && expDate < currDate) {
                                    validateMsg = errors.trailExpired;
                                } else {
                                    break;
                                }
                            }
                        }
                        if (!hasError && prefixRegex.test(res.platform)) {
                            validatedPlatforms.push(res.platform);
                        }
                    }
                    if (!validatedPlatforms.length || componentRestrictedMsg) {
                        validateMsg = validateMsg || componentRestrictedMsg;
                    }
                } else {
                    validateMsg = errors.invalidKey;
                }
            } else {
                const licenseContent: string = getValue(convertToChar(contentKey), containerObject);
                validateURL = getValue(convertToChar(URLKey), containerObject);
                if (licenseContent && licenseContent !== '') {
                    validateMsg = licenseContent;
                } else {
                    validateMsg = errors.noLicense;
                }
            }
            if (validateMsg && typeof document !== 'undefined' && !isNullOrUndefined(document)) {
                if (component !== 'pdf' && component !== 'pdf-extract') {
                    if (banner) {
                        const plValue: string = getProductCode(component);
                        accountURL = (validateURL && validateURL !== '') ? validateURL : `https://www.syncfusion.com/account/claim-license-key?${plValue}&vs=Mjc=&utm_source=es_license_validation_banner&utm_medium=listing&utm_campaign=license-information`;
                        const errorDiv: HTMLElement = createElement('div', {
                            innerHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; left: 16px; top:15px; width: 24px; height: 24px;">
                    <g clip-path="url(#clip0_199_4)">
                        <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M11.25 11.25H12V16.5H12.75" fill="#616063"/>
                        <path d="M11.25 11.25H12V16.5H12.75" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M11.8125 9C12.4338 9 12.9375 8.49632 12.9375 7.875C12.9375 7.25368 12.4338 6.75 11.8125 6.75C11.1912 6.75 10.6875 7.25368 10.6875 7.875C10.6875 8.49632 11.1912 9 11.8125 9Z" fill="#737373"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_199_4">
                        <rect width="24" height="24" fill="white"/>
                        </clipPath>
                    </defs>
                    </svg>` + validateMsg + ' ' + '<a style="text-decoration: none;color: #0000EE;font-weight: 500;" href=' + accountURL + '>Claim your free account</a>' + '<button aria-label="Close" class="license-banner-close" style="position: absolute; right: 20px; top: 15px; background: none; border: none; cursor: pointer; padding: 0; "><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L5 15M5 5L15 15" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
                        });
                        errorDiv.setAttribute('style', `position: fixed;
                  top: 10px;
                  left: 10px;
                  right: 10px;
                  font-size: 14px;
                  background: #EEF2FF;
                  color: #222222;
                  z-index: 999999999;
                  text-align: left;
                  border: 1px solid #EEEEEE;
                  padding: 10px 40px 10px 50px;
                  border-radius: 8px;
                  font-family: Helvetica Neue, Helvetica, Arial;`);
                        const closeButton: HTMLElement | null = errorDiv.querySelector('.license-banner-close');
                        if (closeButton) {
                            // tslint:disable-next-line:typedef
                            closeButton.addEventListener('click', function () {
                                errorDiv.remove();
                            });
                        }
                        document.body.appendChild(errorDiv);
                        banner = false;
                    }
                }
                isLicensed = false;
            }
        }
        return isLicensed;
    }

    /**
     * Get the product code (base64-encoded) for the component
     *
     * @param {string} component - The component name
     * @returns {string} - The base64-encoded product code
     */
    function getProductCode(component: string): string {
        // eslint-disable-next-line security/detect-object-injection
        const productName: string = componentToProductMap[component] || 'UIComponent';
        // eslint-disable-next-line security/detect-object-injection
        return productMap[productName] || productMap.UIComponent;
    }

    function restrictComponent(component: string, platform: string): string | null {
        const ignoreList: string[] = ['DocumentEditor', 'spreadsheet', 'PdfViewer'];
        if (platform === 'essentialui') {
            return ignoreList.indexOf(component) === -1 ? null : errors.uiSuite;
        }
        if (platform === 'documentsdk') {
            if (component === 'pdf' || component === 'pdf-extract') {
                isLicensed = true;
                return null;
            }
            return errors.documentSdk;
        }
        const errorMap: Record<string, string> = {
            gridsdk: errors.gridSdk,
            filemanagersdk: errors.filemanagerSdk,
            chartsdk: errors.chartSdk,
            richtexteditorsdk: errors.rteSdk,
            diagramsdk: errors.diagaramSdk,
            ganttsdk: errors.ganttSdk,
            schedulersdk: errors.schedulerSdk,
            pdfviewersdk: errors.pdfSdk,
            docxeditorsdk: errors.docxEditorSdk,
            spreadsheeteditorsdk: errors.spreadSheetSdk
        };
        // eslint-disable-next-line security/detect-object-injection
        const list: string[] = allowedComponentsMap[platform] || [];
        // eslint-disable-next-line security/detect-object-injection
        return list.indexOf(component) === -1 ? null : errorMap[platform];
    // eslint-disable-next-line security/detect-object-injection
    }

    /**
     * Decrypts base64 encoded data from the provided key.
     *
     * @param {string} key - The base64 encoded key to decrypt
     * @returns {string} The decrypted string or empty string if decryption fails
     */
    function getDecryptedData(key: string): string {
        try {
            return atob(key);
        }
        catch (error) {
            return '';
        }
    }

    /**
     * Get license information from key.
     *
     * @returns {IValidator} - Get license information from key.
     */
    function getInfoFromKey(): IValidator[] {
        try {
            let licKey: string = '';
            const pkey: number[] = [5439488, 7929856, 5111808, 6488064, 4587520, 7667712, 5439488,
                6881280, 5177344, 7208960, 4194304, 4456448, 6619136, 7733248, 5242880, 7077888,
                6356992, 7602176, 4587520, 7274496, 7471104, 7143424];
            let decryptedStr: string[] = [];
            const resultArray: IValidator[] = [];
            let invalidPlatform: boolean = false;
            let isNpxKey: boolean = false;
            if (manager.getKey()) {
                licKey = manager.getKey();
            } else {
                isNpxKey = true;
                licKey = npxManager.getKey().split('npxKeyReplace')[1];
            }
            const licKeySplit: string[] = licKey.split(';');
            for (const lKey of licKeySplit) {
                const decodeStr: string = getDecryptedData(lKey);
                if (!decodeStr) {
                    continue;
                }
                let k: number = 0;
                let buffr: string = '';
                if (!isNpxKey) {
                    for (let i: number = 0; i < decodeStr.length; i++, k++) {
                        if (k === pkey.length) { k = 0; }
                        const c: number = decodeStr.charCodeAt(i);
                        buffr += String.fromCharCode(c ^ (pkey[parseInt(k.toString(), 10)] >> 16));
                    }
                } else {
                    const charKey: string = decodeStr[decodeStr.length - 1];
                    const decryptedKey: number[] = [];
                    for (let i: number = 0; i < decodeStr.length; i++) {
                        decryptedKey[parseInt(i.toString(), 10)] = decodeStr[parseInt(i.toString(), 10)].charCodeAt(0)
                            - charKey.charCodeAt(0);
                    }
                    for (let i: number = 0; i < decryptedKey.length; i++) {
                        buffr += String.fromCharCode(decryptedKey[parseInt(i.toString(), 10)]);
                    }
                }
                if (platform.test(buffr) || prefixRegex.test(buffr)) {
                    decryptedStr = buffr.split(';');
                    invalidPlatform = false;
                    if (decryptedStr.length > 3) {
                        const minVersion: number = parseInt(decryptedStr[1].split('.')[0], 10);
                        const lastValue: number = parseInt(decryptedStr[4], 10);
                        resultArray.push({
                            platform: decryptedStr[0],
                            version: decryptedStr[1],
                            expiryDate: decryptedStr[2],
                            lastValue: lastValue,
                            minVersion: minVersion
                        });
                    }
                } else if (buffr && buffr.split(';').length > 3) {
                    invalidPlatform = true;
                }
            }
            if (invalidPlatform && !resultArray.length) {
                return [{ invalidPlatform: invalidPlatform }];
            } else {
                return resultArray.length ? resultArray : [];
            }
        } catch (error) {
            return [];
        }
    }

    return {
        isLicensed,
        version,
        platform,
        errors,
        validate,
        getDecryptedData,
        getInfoFromKey
    };
}

let licenseValidator: ILicenseValidator = LicenseValidator();

/**
 * Converts the given number to characters.
 *
 * @private
 * @param {number} cArr - Specifies the license key as number.
 * @returns {string} ?
 */
export function convertToChar(cArr: number[]): string {
    let ret: string = '';
    for (const arr of cArr) {
        ret += String.fromCharCode(arr);
    }
    return ret;
}

/**
 * To set license key.
 *
 * @param {string} key - license key
 * @returns {void}
 */
export function registerLicense(key: string): void {
    licenseValidator = LicenseValidator(key);
}

/**
 * Validates the license key.
 *
 * @private
 * @param {string} component - Specifies the component name.
 * @param {string} [key] - Optional license key to validate
 * @returns {boolean} Returns true if license is valid, false otherwise
 */
export function validateLicense(component: string, key?: string): boolean {
    if (key) {
        registerLicense(key);
    }
    if (containerObject) {
        const val2: string = getValue(convertToChar(bypassKey2), containerObject);
        if ((val2 && esUI.indexOf(component) === -1)) {
            return true;
        }
    }
    return licenseValidator.validate(component);
}

/**
 * Gets the version information from the license validator.
 *
 * @private
 * @returns {string} The version string from the license validator
 */
export function getVersion(): string {
    return licenseValidator.version;
}

interface IValidator {
    prefixRegex?: string;
    incorrectPlatform?: string;
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
    uiSuite: string;
    documentSdk: string;
    pdfSdk: string;
    spreadSheetSdk: string;
    docxEditorSdk: string;
    gridSdk: string;
    filemanagerSdk: string;
    ganttSdk: string;
    rteSdk: string;
    diagaramSdk: string;
    schedulerSdk: string;
    chartSdk: string;
}
