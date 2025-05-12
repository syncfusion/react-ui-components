import { NumberFormatOptions, DateFormatOptions, defaultCurrencyCode } from '../internationalization';
import { NumericParts } from './number-parser';
import { getValue, isNullOrUndefined, extend } from '../util';
import { ParserBase as parser } from './parser-base';
import { DateFormat, FormatOptions } from './date-formatter';
import { NumberFormat, FormatParts, CommonOptions } from './number-formatter';
import { isUndefined } from '../util';

/**
 * Interface for NumericSkeleton structure
 */
export interface NumericSkeleton {
    type?: string;
    isAccount?: boolean;
    fractionDigits?: number;
}

/**
 * Interface for GenericFormatOptions structure
 */
export interface GenericFormatOptions {
    nData?: NegativeData;
    pData?: NegativeData;
    zeroData?: NegativeData;
}

/**
 * Interface for GroupSize structure
 */
export interface GroupSize {
    primary?: number;
    secondary?: number;
}

/**
 * Interface for NegativeData structure
 *
 * @private
 */
export interface NegativeData extends FormatParts {
    nlead?: string;
    nend?: string;
    groupPattern?: string;
    minimumFraction?: number;
    maximumFraction?: number;
}

/**
 * Interface for Dependables structure
 */
export interface Dependables {
    parserObject?: Object;
    dateObject?: Object;
    numericObject?: Object;
}

/**
 * Interface for TimeZoneOptions structure
 */
export interface TimeZoneOptions {
    hourFormat?: string;
    gmtFormat?: string;
    gmtZeroFormat?: string;
}

/**
 * Interface for DateObject structure
 */
export interface DateObject {
    year?: number;
    month?: number;
    date?: number;
}

/**
 * Interface defining the exported properties and methods in the IntlBase namespace.
 */
export interface IIntlBase {
    negativeDataRegex?: RegExp;
    customRegex?: RegExp;
    latnParseRegex?: RegExp;
    fractionRegex?: RegExp;
    defaultCurrency?: string;
    mapper?: string[];
    dateConverterMapper?: RegExp;
    islamicRegex?: RegExp;
    formatRegex?: RegExp;
    currencyFormatRegex?: RegExp;
    curWithoutNumberRegex?: RegExp;
    dateParseRegex?: RegExp;
    basicPatterns?: string[];
    defaultObject?: Object;
    monthIndex?: Object;
    month?: string;
    days?: string;
    patternMatcher?: { [key: string]: string };
    /**
     * Computes the resultant date pattern.
     *
     * @private
     * @param skeleton - Pattern skeleton.
     * @param dateObject - Date-related object mapping.
     * @param type - Format type.
     * @param isIslamic - Islamic mode flag.
     * @returns {string} The resultant pattern.
     */
    getResultantPattern?(
        skeleton: string,
        dateObject: Object,
        type: string,
        isIslamic?: boolean,
    ): string;

    /**
     * Retrieves dependables based on the CLDR data.
     *
     * @private
     * @param cldr - CLDR object data.
     * @param culture - Culture code.
     * @param mode - Calendar mode.
     * @param isNumber - Flag indicating number operations.
     * @returns {Dependables} Dependable objects.
     */
    getDependables?(
        cldr: Object,
        culture: string,
        mode: string,
        isNumber?: boolean
    ): Dependables;

    /**
     * Fetches the symbol pattern for given parameters.
     *
     * @private
     * @param type - Format type.
     * @param numSystem - Number system.
     * @param obj - Formatting object.
     * @param isAccount - Account mode flag.
     * @returns {string} Symbol pattern.
     */
    getSymbolPattern?(
        type: string,
        numSystem: string,
        obj: Object,
        isAccount: boolean
    ): string;

    /**
     * Determines the proper numeric skeleton.
     *
     * @private
     * @param skeleton - Skeleton string.
     * @returns {NumericSkeleton} Numeric skeleton details.
     */
    getProperNumericSkeleton?(skeleton: string): NumericSkeleton;

    /**
     * Fetches format data for numbers.
     *
     * @private
     * @param pattern - Number pattern.
     * @param needFraction - Fraction requirement flag.
     * @param cSymbol - Currency symbol.
     * @param fractionOnly - Fraction data flag.
     * @returns {NegativeData} Number format details.
     */
    getFormatData?(
        pattern: string,
        needFraction: boolean,
        cSymbol: string,
        fractionOnly?: boolean
    ): NegativeData;

    /**
     * Changes the currency symbol in a given string.
     *
     * @private
     * @param val - The value containing the currency symbol.
     * @param sym - The new currency symbol.
     * @returns {string} The value with the currency symbol replaced.
     */
    changeCurrencySymbol?(val: string, sym: string): string;

    /**
     * Retrieves the currency symbol based on the currency code.
     *
     * @private
     * @param numericObject - The numeric object containing currency details.
     * @param currencyCode - The currency code.
     * @param altSymbol - Alternate symbol if applicable.
     * @param ignoreCurrency - Flag to ignore currency in lookup.
     * @returns {string} The currency symbol.
     */
    getCurrencySymbol?(
        numericObject: Object,
        currencyCode: string,
        altSymbol?: string,
        ignoreCurrency?: boolean
    ): string;

    /**
     * Returns custom number format options.
     *
     * @private
     * @param format - The custom format string.
     * @param dOptions - Common options for number formatting.
     * @param obj - Dependable object.
     * @returns {GenericFormatOptions} Custom number format options.
     */
    customFormat?(
        format: string,
        dOptions: CommonOptions,
        obj: Dependables
    ): GenericFormatOptions;

    /**
     * Defines custom number format details.
     *
     * @private
     * @param format - Format string.
     * @param dOptions - Common options.
     * @param numObject - Numeric object.
     * @returns {NegativeData} Custom number formats.
     */
    customNumberFormat?(
        format: string,
        dOptions?: CommonOptions,
        numObject?: Object
    ): NegativeData;

    /**
     * Determines if a format is currency or percent type.
     *
     * @private
     * @param parts - The parts of the format string.
     * @param actual - The actual identifier.
     * @param symbol - The symbol used.
     * @returns {NegativeData} Formatting options.
     */
    isCurrencyPercent?(
        parts: string[],
        actual: string,
        symbol: string
    ): NegativeData;

    /**
     * Retrieves date separator for a given date object.
     *
     * @private
     * @param dateObj - The date configuration object.
     * @returns {string} Date separator.
     */
    getDateSeparator?(dateObj: Object): string;

    /**
     * Obtains the native date time format based on given options.
     *
     * @private
     * @param culture - Cultural context.
     * @param options - Date format settings.
     * @param cldr - CLDR object.
     * @param isExcelFormat - Flag for formatting in Excel.
     * @returns {string} Compiled date time pattern.
     */
    getActualDateTimeFormat?(
        culture: string,
        options: DateFormatOptions,
        cldr?: Object,
        isExcelFormat?: boolean
    ): string;

    /**
     * Processes symbols within a format string.
     *
     * @private
     * @param actual - Original pattern string.
     * @param option - Formatting options.
     * @returns {string} Processed pattern.
     */
    processSymbol?(actual: string, option: CommonOptions): string;

    /**
     * Returns number format pattern for a culture.
     *
     * @private
     * @param culture - Cultural context.
     * @param options - Number format configurations.
     * @param cldr - CLDR object.
     * @param isExcel - Excel integration flag.
     * @returns {string} Numeric pattern.
     */
    getActualNumberFormat?(
        culture: string,
        options: NumberFormatOptions,
        cldr?: Object,
        isExcel?: boolean
    ): string;

    /**
     * Constructs pattern for fraction digits.
     *
     * @private
     * @param minDigits - Minimum digits required.
     * @param maxDigits - Maximum available digits.
     * @returns {string} Pattern string with fraction digits.
     */
    fractionDigitsPattern?(
        pattern: string,
        minDigits: number,
        maxDigits?: number
    ): string;

    /**
     * Constructs pattern for integer digits.
     *
     * @private
     * @param pattern - Base pattern.
     * @param digits - Integer digit enforcement count.
     * @returns {string} The pattern with integer digits.
     */
    minimumIntegerPattern?(pattern: string, digits: number): string;

    /**
     * Generates pattern to represent numeric grouping.
     *
     * @private
     * @param pattern - Base numeric pattern.
     * @returns {string} Group-patterned string.
     */
    groupingPattern?(pattern: string): string;

    /**
     * Returns first day of the week for the given culture.
     *
     * @private
     * @param culture - Cultural context.
     * @param cldr - CLDR data.
     * @returns {number} The index number of the first day.
     */
    getWeekData?(culture: string, cldr?: Object): number;

    /**
     * Calculates the week number of the year for a given date.
     *
     * @private
     * @param date - The date to calculate the week number for.
     * @returns {number} The week number in the year.
     */
    getWeekOfYear?(date: Date): number;
}

/**
 * Collection of methods and constants related to internationalization, date and number formatting.
 */
export const IntlBase: IIntlBase = (() => {
    const regExp: RegExpConstructor = RegExp;
    const props: IIntlBase = {
        // eslint-disable-next-line security/detect-unsafe-regex
        negativeDataRegex: /^(('[^']+'|''|[^*#@0,.E])*)(\*.)?((([#,]*[0,]*0+)(\.0*[0-9]*#*)?)|([#,]*@+#*))(E\+?0+)?(('[^']+'|''|[^*#@0,.E])*)$/,
        // eslint-disable-next-line security/detect-unsafe-regex
        customRegex: /^(('[^']+'|''|[^*#@0,.])*)(\*.)?((([0#,]*[0,]*[0#]*[0# ]*)(\.[0#]*)?)|([#,]*@+#*))(E\+?0+)?(('[^']+'|''|[^*#@0,.E])*)$/,
        latnParseRegex: /0|1|2|3|4|5|6|7|8|9/g,
        defaultCurrency: '$',
        dateConverterMapper: /dddd|ddd/ig,
        islamicRegex: /^islamic/,
        formatRegex: new regExp('(^[ncpae]{1})([0-1]?[0-9]|20)?$', 'i'),
        currencyFormatRegex: new regExp('(^[ca]{1})([0-1]?[0-9]|20)?$', 'i'),
        curWithoutNumberRegex: /(c|a)$/ig,
        dateParseRegex: /([a-z])\1*|'([^']|'')+'|''|./gi,
        basicPatterns: ['short', 'medium', 'long', 'full']
    };
    const fractionRegex: RegExp = /[0-9]/g;
    const mapper: string[] = ['infinity', 'nan', 'group', 'decimal'];
    const patternRegex: RegExp = /G|M|L|H|c|'| a|yy|y|EEEE|E/g;
    const patternMatch: object = {
        'G': '',
        'M': 'm',
        'L': 'm',
        'H': 'h',
        'c': 'd',
        '\'': '"',
        ' a': ' AM/PM',
        'yy': 'yy',
        'y': 'yyyy',
        'EEEE': 'dddd',
        'E': 'ddd'
    };
    const defaultFirstDay: string = 'sun';
    const firstDayMapper: object = {
        'sun': 0,
        'mon': 1,
        'tue': 2,
        'wed': 3,
        'thu': 4,
        'fri': 5,
        'sat': 6
    };
    const typeMapper: object = {
        '$': 'isCurrency',
        '%': 'isPercent',
        '-': 'isNegative',
        0: 'nlead',
        1: 'nend'
    };
    props.defaultObject = {
        'dates': {
            'calendars': {
                'gregorian': {
                    'months': {
                        'stand-alone': {
                            'abbreviated': {
                                '1': 'Jan',
                                '2': 'Feb',
                                '3': 'Mar',
                                '4': 'Apr',
                                '5': 'May',
                                '6': 'Jun',
                                '7': 'Jul',
                                '8': 'Aug',
                                '9': 'Sep',
                                '10': 'Oct',
                                '11': 'Nov',
                                '12': 'Dec'
                            },
                            'narrow': {
                                '1': 'J',
                                '2': 'F',
                                '3': 'M',
                                '4': 'A',
                                '5': 'M',
                                '6': 'J',
                                '7': 'J',
                                '8': 'A',
                                '9': 'S',
                                '10': 'O',
                                '11': 'N',
                                '12': 'D'
                            },
                            'wide': {
                                '1': 'January',
                                '2': 'February',
                                '3': 'March',
                                '4': 'April',
                                '5': 'May',
                                '6': 'June',
                                '7': 'July',
                                '8': 'August',
                                '9': 'September',
                                '10': 'October',
                                '11': 'November',
                                '12': 'December'
                            }
                        }
                    },
                    'days': {
                        'stand-alone': {
                            'abbreviated': {
                                'sun': 'Sun',
                                'mon': 'Mon',
                                'tue': 'Tue',
                                'wed': 'Wed',
                                'thu': 'Thu',
                                'fri': 'Fri',
                                'sat': 'Sat'
                            },
                            'narrow': {
                                'sun': 'S',
                                'mon': 'M',
                                'tue': 'T',
                                'wed': 'W',
                                'thu': 'T',
                                'fri': 'F',
                                'sat': 'S'
                            },
                            'short': {
                                'sun': 'Su',
                                'mon': 'Mo',
                                'tue': 'Tu',
                                'wed': 'We',
                                'thu': 'Th',
                                'fri': 'Fr',
                                'sat': 'Sa'
                            },
                            'wide': {
                                'sun': 'Sunday',
                                'mon': 'Monday',
                                'tue': 'Tuesday',
                                'wed': 'Wednesday',
                                'thu': 'Thursday',
                                'fri': 'Friday',
                                'sat': 'Saturday'
                            }
                        }
                    },
                    'dayPeriods': {
                        'format': {
                            'wide': {
                                'am': 'AM',
                                'pm': 'PM'
                            }
                        }
                    },
                    'eras': {
                        'eraNames': {
                            '0': 'Before Christ',
                            '0-alt-variant': 'Before Common Era',
                            '1': 'Anno Domini',
                            '1-alt-variant': 'Common Era'
                        },
                        'eraAbbr': {
                            '0': 'BC',
                            '0-alt-variant': 'BCE',
                            '1': 'AD',
                            '1-alt-variant': 'CE'
                        },
                        'eraNarrow': {
                            '0': 'B',
                            '0-alt-variant': 'BCE',
                            '1': 'A',
                            '1-alt-variant': 'CE'
                        }
                    },
                    'dateFormats': {
                        'full': 'EEEE, MMMM d, y',
                        'long': 'MMMM d, y',
                        'medium': 'MMM d, y',
                        'short': 'M/d/yy'
                    },
                    'timeFormats': {
                        'full': 'h:mm:ss a zzzz',
                        'long': 'h:mm:ss a z',
                        'medium': 'h:mm:ss a',
                        'short': 'h:mm a'
                    },
                    'dateTimeFormats': {
                        'full': '{1} \'at\' {0}',
                        'long': '{1} \'at\' {0}',
                        'medium': '{1}, {0}',
                        'short': '{1}, {0}',
                        'availableFormats': {
                            'd': 'd',
                            'E': 'ccc',
                            'Ed': 'd E',
                            'Ehm': 'E h:mm a',
                            'EHm': 'E HH:mm',
                            'Ehms': 'E h:mm:ss a',
                            'EHms': 'E HH:mm:ss',
                            'Gy': 'y G',
                            'GyMMM': 'MMM y G',
                            'GyMMMd': 'MMM d, y G',
                            'GyMMMEd': 'E, MMM d, y G',
                            'h': 'h a',
                            'H': 'HH',
                            'hm': 'h:mm a',
                            'Hm': 'HH:mm',
                            'hms': 'h:mm:ss a',
                            'Hms': 'HH:mm:ss',
                            'hmsv': 'h:mm:ss a v',
                            'Hmsv': 'HH:mm:ss v',
                            'hmv': 'h:mm a v',
                            'Hmv': 'HH:mm v',
                            'M': 'L',
                            'Md': 'M/d',
                            'MEd': 'E, M/d',
                            'MMM': 'LLL',
                            'MMMd': 'MMM d',
                            'MMMEd': 'E, MMM d',
                            'MMMMd': 'MMMM d',
                            'ms': 'mm:ss',
                            'y': 'y',
                            'yM': 'M/y',
                            'yMd': 'M/d/y',
                            'yMEd': 'E, M/d/y',
                            'yMMM': 'MMM y',
                            'yMMMd': 'MMM d, y',
                            'yMMMEd': 'E, MMM d, y',
                            'yMMMM': 'MMMM y'
                        }
                    }
                },
                'islamic': {
                    'months': {
                        'stand-alone': {
                            'abbreviated': {
                                '1': 'Muh.',
                                '2': 'Saf.',
                                '3': 'Rab. I',
                                '4': 'Rab. II',
                                '5': 'Jum. I',
                                '6': 'Jum. II',
                                '7': 'Raj.',
                                '8': 'Sha.',
                                '9': 'Ram.',
                                '10': 'Shaw.',
                                '11': 'Dhuʻl-Q.',
                                '12': 'Dhuʻl-H.'
                            },
                            'narrow': {
                                '1': '1',
                                '2': '2',
                                '3': '3',
                                '4': '4',
                                '5': '5',
                                '6': '6',
                                '7': '7',
                                '8': '8',
                                '9': '9',
                                '10': '10',
                                '11': '11',
                                '12': '12'
                            },
                            'wide': {
                                '1': 'Muharram',
                                '2': 'Safar',
                                '3': 'Rabiʻ I',
                                '4': 'Rabiʻ II',
                                '5': 'Jumada I',
                                '6': 'Jumada II',
                                '7': 'Rajab',
                                '8': 'Shaʻban',
                                '9': 'Ramadan',
                                '10': 'Shawwal',
                                '11': 'Dhuʻl-Qiʻdah',
                                '12': 'Dhuʻl-Hijjah'
                            }
                        }
                    },
                    'days': {
                        'stand-alone': {
                            'abbreviated': {
                                'sun': 'Sun',
                                'mon': 'Mon',
                                'tue': 'Tue',
                                'wed': 'Wed',
                                'thu': 'Thu',
                                'fri': 'Fri',
                                'sat': 'Sat'
                            },
                            'narrow': {
                                'sun': 'S',
                                'mon': 'M',
                                'tue': 'T',
                                'wed': 'W',
                                'thu': 'T',
                                'fri': 'F',
                                'sat': 'S'
                            },
                            'short': {
                                'sun': 'Su',
                                'mon': 'Mo',
                                'tue': 'Tu',
                                'wed': 'We',
                                'thu': 'Th',
                                'fri': 'Fr',
                                'sat': 'Sa'
                            },
                            'wide': {
                                'sun': 'Sunday',
                                'mon': 'Monday',
                                'tue': 'Tuesday',
                                'wed': 'Wednesday',
                                'thu': 'Thursday',
                                'fri': 'Friday',
                                'sat': 'Saturday'
                            }
                        }
                    },
                    'dayPeriods': {
                        'format': {
                            'wide': {
                                'am': 'AM',
                                'pm': 'PM'
                            }
                        }
                    },
                    'eras': {
                        'eraNames': {
                            '0': 'AH'
                        },
                        'eraAbbr': {
                            '0': 'AH'
                        },
                        'eraNarrow': {
                            '0': 'AH'
                        }
                    },
                    'dateFormats': {
                        'full': 'EEEE, MMMM d, y G',
                        'long': 'MMMM d, y G',
                        'medium': 'MMM d, y G',
                        'short': 'M/d/y GGGGG'
                    },
                    'timeFormats': {
                        'full': 'h:mm:ss a zzzz',
                        'long': 'h:mm:ss a z',
                        'medium': 'h:mm:ss a',
                        'short': 'h:mm a'
                    },
                    'dateTimeFormats': {
                        'full': '{1} \'at\' {0}',
                        'long': '{1} \'at\' {0}',
                        'medium': '{1}, {0}',
                        'short': '{1}, {0}',
                        'availableFormats': {
                            'd': 'd',
                            'E': 'ccc',
                            'Ed': 'd E',
                            'Ehm': 'E h:mm a',
                            'EHm': 'E HH:mm',
                            'Ehms': 'E h:mm:ss a',
                            'EHms': 'E HH:mm:ss',
                            'Gy': 'y G',
                            'GyMMM': 'MMM y G',
                            'GyMMMd': 'MMM d, y G',
                            'GyMMMEd': 'E, MMM d, y G',
                            'h': 'h a',
                            'H': 'HH',
                            'hm': 'h:mm a',
                            'Hm': 'HH:mm',
                            'hms': 'h:mm:ss a',
                            'Hms': 'HH:mm:ss',
                            'M': 'L',
                            'Md': 'M/d',
                            'MEd': 'E, M/d',
                            'MMM': 'LLL',
                            'MMMd': 'MMM d',
                            'MMMEd': 'E, MMM d',
                            'MMMMd': 'MMMM d',
                            'ms': 'mm:ss',
                            'y': 'y G',
                            'yyyy': 'y G',
                            'yyyyM': 'M/y GGGGG',
                            'yyyyMd': 'M/d/y GGGGG',
                            'yyyyMEd': 'E, M/d/y GGGGG',
                            'yyyyMMM': 'MMM y G',
                            'yyyyMMMd': 'MMM d, y G',
                            'yyyyMMMEd': 'E, MMM d, y G',
                            'yyyyMMMM': 'MMMM y G',
                            'yyyyQQQ': 'QQQ y G',
                            'yyyyQQQQ': 'QQQQ y G'
                        }
                    }
                }
            },
            'timeZoneNames': {
                'hourFormat': '+HH:mm;-HH:mm',
                'gmtFormat': 'GMT{0}',
                'gmtZeroFormat': 'GMT'
            }
        },
        'numbers': {
            'currencies': {
                'USD': {
                    'displayName': 'US Dollar',
                    'symbol': '$',
                    'symbol-alt-narrow': '$'
                },
                'EUR': {
                    'displayName': 'Euro',
                    'symbol': '€',
                    'symbol-alt-narrow': '€'
                },
                'GBP': {
                    'displayName': 'British Pound',
                    'symbol-alt-narrow': '£'
                }
            },
            'defaultNumberingSystem': 'latn',
            'minimumGroupingDigits': '1',
            'symbols-numberSystem-latn': {
                'decimal': '.',
                'group': ',',
                'list': ';',
                'percentSign': '%',
                'plusSign': '+',
                'minusSign': '-',
                'exponential': 'E',
                'superscriptingExponent': '×',
                'perMille': '‰',
                'infinity': '∞',
                'nan': 'NaN',
                'timeSeparator': ':'
            },
            'decimalFormats-numberSystem-latn': {
                'standard': '#,##0.###'
            },
            'percentFormats-numberSystem-latn': {
                'standard': '#,##0%'
            },
            'currencyFormats-numberSystem-latn': {
                'standard': '¤#,##0.00',
                'accounting': '¤#,##0.00;(¤#,##0.00)'
            },
            'scientificFormats-numberSystem-latn': {
                'standard': '#E0'
            }
        }
    };
    props.monthIndex = {
        3: 'abbreviated',
        4: 'wide',
        5: 'narrow',
        1: 'abbreviated'
    };
    props.month = 'months';
    props.days = 'days';
    props.patternMatcher = {
        C: 'currency',
        P: 'percent',
        N: 'decimal',
        A: 'currency',
        E: 'scientific'
    };

    /**
     * Returns the resultant pattern based on the skeleton, dateObject, and the type provided.
     *
     * @param {string} skeleton ?
     * @param {Object} dateObject ?
     * @param {string} type ?
     * @returns {string} Resultant pattern.
     */
    props.getResultantPattern = (
        skeleton: string, dateObject: Object, type: string): string => {
        let resPattern: string;
        const iType: string = type || 'date';
        if (props.basicPatterns.indexOf(skeleton) !== -1) {
            resPattern = getValue(iType + 'Formats.' + skeleton, dateObject);
            if (iType === 'dateTime') {
                const dPattern: string = getValue('dateFormats.' + skeleton, dateObject);
                const tPattern: string = getValue('timeFormats.' + skeleton, dateObject);
                resPattern = resPattern.replace('{1}', dPattern).replace('{0}', tPattern);
            }
        } else {
            resPattern = getValue('dateTimeFormats.availableFormats.' + skeleton, dateObject);
        }
        if (isUndefined(resPattern) && skeleton === 'yMd') {
            resPattern = 'M/d/y';
        }
        return resPattern;
    };

    /**
     * Returns the dependable object for provided cldr data and culture.
     *
     * @param {Object} cldr ?
     * @param {string} culture ?
     * @param {string} mode ?
     * @param {boolean} isNumber ?
     * @returns {Dependables} Dependable object.
     */
    props.getDependables = (cldr: Object, culture: string, mode: string, isNumber?: boolean): Dependables => {
        const ret: Dependables = {};
        const calendartype: string = mode || 'gregorian';
        ret.parserObject = parser.getMainObject(cldr, culture) || (IntlBase.defaultObject);
        if (isNumber) {
            ret.numericObject = getValue('numbers', ret.parserObject);
        } else {
            const dateString: string = ('dates.calendars.' + calendartype);
            ret.dateObject = getValue(dateString, ret.parserObject);
        }
        return ret;
    };

    /**
     * Returns the symbol pattern for provided parameters.
     *
     * @param {string} type ?
     * @param {string} numSystem ?
     * @param {Object} obj ?
     * @param {boolean} isAccount ?
     * @returns {string} Symbol pattern.
     */
    props.getSymbolPattern = (type: string, numSystem: string, obj: Object, isAccount: boolean): string => {
        return getValue(
            type + 'Formats-numberSystem-' + numSystem + (isAccount ? '.accounting' : '.standard'),
            obj
        ) || (isAccount ? getValue(
            type + 'Formats-numberSystem-' + numSystem + '.standard',
            obj
        ) : '');
    };

    /**
     * Returns the proper numeric skeleton.
     *
     * @param {string} skeleton ?
     * @returns {NumericSkeleton} Numeric skeleton.
     */
    props.getProperNumericSkeleton = (skeleton: string): NumericSkeleton => {
        const matches: RegExpMatchArray | null = skeleton.match(props.formatRegex);
        const ret: NumericSkeleton = {};
        const pattern: string = matches ? matches[1].toUpperCase() : '';
        ret.isAccount = (pattern === 'A');
        ret.type = props.patternMatcher[`${pattern}`];
        if (matches && skeleton.length > 1 && matches[2]) {
            ret.fractionDigits = parseInt(matches[2], 10);
        }
        return ret;
    };

    /**
     * Returns format data for number formatting.
     *
     * @param {string} pattern ?
     * @param {boolean} needFraction ?
     * @param {string} cSymbol ?
     * @param {boolean} fractionOnly ?
     * @returns {NegativeData} Format data.
     */
    props.getFormatData = (pattern: string, needFraction: boolean, cSymbol: string, fractionOnly?: boolean): NegativeData => {
        const nData: NegativeData = fractionOnly ? {} : { nlead: '', nend: '' };
        const match: string[] | null = pattern.match(props.customRegex);
        if (match) {
            if (!fractionOnly) {
                nData.nlead = props.changeCurrencySymbol(match[1], cSymbol);
                nData.nend = props.changeCurrencySymbol(match[10], cSymbol);
                nData.groupPattern = match[4];
            }
            const fraction: string = match[7];
            if (fraction && needFraction) {
                const fmatch: string[] | null = fraction.match(fractionRegex);
                nData.minimumFraction = fmatch ? fmatch.length : 0;
                nData.maximumFraction = fraction.length - 1;
            }
        }
        return nData;
    };

    /**
     * Changes currency symbol.
     *
     * @param {string} val ?
     * @param {string} sym ?
     * @returns {string} Changed symbol.
     */
    props.changeCurrencySymbol = (val: string, sym: string): string => {
        if (val) {
            val = val.replace(props.defaultCurrency, sym);
            return (sym === '') ? val.trim() : val;
        }
        return '';
    };

    /**
     * Returns currency symbol based on currency code.
     *
     * @param {Object} numericObject ?
     * @param {string} currencyCode ?
     * @param {string} altSymbol ?
     * @param {string} ignoreCurrency ?
     * @returns {string} Currency symbol.
     */
    props.getCurrencySymbol = (
        numericObject: Object, currencyCode: string, altSymbol?: string, ignoreCurrency?: boolean
    ): string => {
        const symbol: string = altSymbol ? ('.' + altSymbol) : '.symbol';
        const getCurrency: string = ignoreCurrency ? '$'
            : getValue('currencies.' + currencyCode + symbol, numericObject)
            || getValue('currencies.' + currencyCode + '.symbol-alt-narrow', numericObject)
            || '$';
        return getCurrency;
    };

    /**
     * Returns formatting options for custom number format.
     *
     * @param {string} format ?
     * @param {CommonOptions} dOptions ?
     * @param {Dependables} obj ?
     * @returns {GenericFormatOptions} Custom format options.
     */
    props.customFormat = (format: string, dOptions: CommonOptions, obj: Dependables): GenericFormatOptions => {
        const options: GenericFormatOptions = {};
        const formatSplit: string[] = format.split(';');
        const data: string[] = ['pData', 'nData', 'zeroData'];
        for (let i: number = 0; i < formatSplit.length; i++) {
            options[data[parseInt(i.toString(), 10)]] = props.customNumberFormat(formatSplit[parseInt(i.toString(), 10)], dOptions, obj);
        }
        if (isNullOrUndefined(options.nData)) {
            options.nData = extend({}, options.pData);
            options.nData.nlead = (dOptions?.minusSymbol || '-') + options.nData.nlead;
        }
        return options;
    };

    /**
     * Returns custom formatting options.
     *
     * @param {string} format ?
     * @param {CommonOptions} dOptions ?
     * @param {Object} numObject ?
     * @returns {NegativeData} Custom number format.
     */
    props.customNumberFormat = (format: string, dOptions?: CommonOptions, numObject?: Object): NegativeData => {
        const cOptions: NegativeData = { type: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 };
        const pattern: string[] | null = format.match(props.customRegex);
        if (isNullOrUndefined(pattern) || (pattern[5] === '' && format !== 'N/A')) {
            cOptions.type = undefined;
            return cOptions;
        }
        cOptions.nlead = pattern[1];
        cOptions.nend = pattern[10];
        let integerPart: string = pattern[6];
        const spaceCapture: boolean = integerPart.match(/ $/g) ? true : false;
        const spaceGrouping: boolean = integerPart.replace(/ $/g, '').indexOf(' ') !== -1;
        cOptions.useGrouping = integerPart.indexOf(',') !== -1 || spaceGrouping;
        integerPart = integerPart.replace(/,/g, '');
        const fractionPart: string = pattern[7];
        if (integerPart.indexOf('0') !== -1) {
            cOptions.minimumIntegerDigits = integerPart.length - integerPart.indexOf('0');
        }
        if (!isNullOrUndefined(fractionPart)) {
            cOptions.minimumFractionDigits = fractionPart.lastIndexOf('0');
            cOptions.maximumFractionDigits = fractionPart.lastIndexOf('#');
            if (cOptions.minimumFractionDigits === -1) {
                cOptions.minimumFractionDigits = 0;
            }
            if (cOptions.maximumFractionDigits === -1 || cOptions.maximumFractionDigits < cOptions.minimumFractionDigits) {
                cOptions.maximumFractionDigits = cOptions.minimumFractionDigits;
            }
        }
        if (!isNullOrUndefined(dOptions)) {
            dOptions.isCustomFormat = true;
            extend(cOptions, props.isCurrencyPercent([cOptions.nlead, cOptions.nend], '$', dOptions.currencySymbol));
            if (!cOptions.isCurrency) {
                extend(cOptions, props.isCurrencyPercent([cOptions.nlead, cOptions.nend], '%', dOptions.percentSymbol));
            }
        } else {
            extend(cOptions, props.isCurrencyPercent([cOptions.nlead, cOptions.nend], '%', '%'));
        }
        if (!isNullOrUndefined(numObject)) {
            const symbolPattern: string = props.getSymbolPattern(
                cOptions.type, dOptions.numberMapper.numberSystem, numObject, false);
            if (cOptions.useGrouping) {
                cOptions.groupSeparator = spaceGrouping ? ' ' : dOptions.numberMapper.numberSymbols[mapper[2]];
                cOptions.groupData = NumberFormat.getGroupingDetails(symbolPattern.split(';')[0]);
            }
            cOptions.nlead = cOptions.nlead.replace(/'/g, '');
            cOptions.nend = spaceCapture ? ' ' + cOptions.nend.replace(/'/g, '') : cOptions.nend.replace(/'/g, '');
        }
        return cOptions;
    };

    /**
     * Evaluates if formatting applies to currency or percent type.
     *
     * @param {string[]} parts ?
     * @param {string} actual ?
     * @param {string} symbol ?
     * @returns {NegativeData} Information on currency or percent formatting.
     */
    props.isCurrencyPercent = (parts: string[], actual: string, symbol: string): NegativeData => {
        const options: NegativeData = { nlead: parts[0], nend: parts[1] };
        for (let i: number = 0; i < 2; i++) {
            const part: string = parts[parseInt(i.toString(), 10)];
            const loc: number = part.indexOf(actual);
            if ((loc !== -1) && ((loc < part.indexOf('\'')) || (loc > part.lastIndexOf('\'')))) {
                options[typeMapper[parseInt(i.toString(), 10)]] = part.substr(0, loc) + symbol + part.substr(loc + 1);
                options[typeMapper[`${actual}`]] = true;
                options.type = options.isCurrency ? 'currency' : 'percent';
                break;
            }
        }
        return options;
    };

    /**
     * Returns culture-based date separator.
     *
     * @param {Object} dateObj ?
     * @returns {string} Date separator.
     */
    props.getDateSeparator = (dateObj: Object): string => {
        const value: string[] = (getValue('dateFormats.short', dateObj) || '').match(/[dM]([^dM])[dM]/i);
        return value ? value[1] : '/';
    };

    /**
     * Returns native date time pattern.
     *
     * @param {string} culture ?
     * @param {DateFormatOptions} options ?
     * @param {Object} cldr ?
     * @param {boolean} isExcelFormat ?
     * @returns {string} Actual date time pattern.
     */
    props.getActualDateTimeFormat = (
        culture: string, options: DateFormatOptions, cldr?: Object, isExcelFormat?: boolean
    ): string => {
        const dependable: Dependables = props.getDependables(cldr, culture, options.calendar);
        let actualPattern: string = options.format || props.getResultantPattern(options.skeleton, dependable.dateObject, options.type);
        if (isExcelFormat) {
            actualPattern = actualPattern.replace(patternRegex, (pattern: string): string => {
                return patternMatch[`${pattern}`];
            });
            if (actualPattern.indexOf('z') !== -1) {
                const tLength: number = actualPattern.match(/z/g).length || 0;
                let timeZonePattern: string;
                const formatOptions: FormatOptions = { timeZone: {} };
                formatOptions.numMapper = parser.getNumberMapper(dependable.parserObject, parser.getNumberingSystem(cldr));
                formatOptions.timeZone = getValue('dates.timeZoneNames', dependable.parserObject);
                const value: Date = new Date();
                const timezone: number = value.getTimezoneOffset();
                let pattern: string = (tLength < 4) ? '+H;-H' : formatOptions.timeZone.hourFormat;
                pattern = pattern.replace(/:/g, formatOptions.numMapper.timeSeparator);
                if (timezone === 0) {
                    timeZonePattern = formatOptions.timeZone.gmtZeroFormat;
                } else {
                    timeZonePattern = DateFormat.getTimeZoneValue(timezone, pattern);
                    timeZonePattern = formatOptions.timeZone.gmtFormat.replace(/\{0\}/, timeZonePattern);
                }
                actualPattern = actualPattern.replace(/[z]+/, '"' + timeZonePattern + '"');
            }
            actualPattern = actualPattern.replace(/ $/, '');
        }
        return actualPattern;
    };

    /**
     * Processes symbols in format.
     *
     * @param {string} actual ?
     * @param {CommonOptions} option ?
     * @returns {string} Processed symbols.
     */
    props.processSymbol = (actual: string, option: CommonOptions): string => {
        if (actual.indexOf(',') !== -1) {
            const split: string[] = actual.split(',');
            actual = (split[0] + getValue('numberMapper.numberSymbols.group', option) +
                split[1].replace('.', getValue('numberMapper.numberSymbols.decimal', option)));
        } else {
            actual = actual.replace('.', getValue('numberMapper.numberSymbols.decimal', option));
        }
        return actual;
    };

    /**
     * Returns native number pattern.
     *
     * @param {string} culture ?
     * @param {NumberFormatOptions} options ?
     * @param {Object} cldr ?
     * @param {boolean} isExcel ?
     * @returns {string} Actual number format.
     */
    props.getActualNumberFormat = (
        culture: string, options: NumberFormatOptions, cldr?: Object, isExcel?: boolean
    ): string => {
        const dependable: Dependables = props.getDependables(cldr, culture, '', true);
        const parseOptions: NumericParts = { custom: true };
        let minFrac: number;
        const curObj: GenericFormatOptions & { hasNegativePattern?: boolean } = {};
        const curMatch: string[] | null = (options.format)?.match(props.currencyFormatRegex);
        const dOptions: CommonOptions = {};
        if (curMatch) {
            dOptions.numberMapper = parser.getNumberMapper(dependable.parserObject, parser.getNumberingSystem(cldr), true);
            const curCode: string = props.getCurrencySymbol(
                dependable.numericObject,
                options.currency || defaultCurrencyCode,
                options.altSymbol
            );
            let symbolPattern: string = props.getSymbolPattern(
                'currency', dOptions.numberMapper.numberSystem, dependable.numericObject, (/a/i).test(options.format));
            symbolPattern = symbolPattern.replace(/\u00A4/g, curCode);
            const split: string[] = symbolPattern.split(';');
            curObj.hasNegativePattern = (split.length > 1);
            curObj.nData = props.getFormatData(split[1] || '-' + split[0], true, curCode);
            curObj.pData = props.getFormatData(split[0], false, curCode);
            if (!curMatch[2] && !options.minimumFractionDigits && !options.maximumFractionDigits) {
                minFrac = props.getFormatData(symbolPattern.split(';')[0], true, '', true).minimumFraction;
            }
        }
        let actualPattern: string;
        if ((props.formatRegex.test(options.format)) || !(options.format)) {
            extend(parseOptions, props.getProperNumericSkeleton(options.format || 'N'));
            parseOptions.custom = false;
            actualPattern = '###0';
            if (parseOptions.fractionDigits || options.minimumFractionDigits || options.maximumFractionDigits || minFrac) {
                const defaultMinimum: number = 0;
                if (parseOptions.fractionDigits) {
                    options.minimumFractionDigits = options.maximumFractionDigits = parseOptions.fractionDigits;
                }
                actualPattern = props.fractionDigitsPattern(
                    actualPattern, minFrac || parseOptions.fractionDigits ||
                    options.minimumFractionDigits || defaultMinimum,
                    options.maximumFractionDigits || defaultMinimum);
            }
            if (options.minimumIntegerDigits) {
                actualPattern = props.minimumIntegerPattern(actualPattern, options.minimumIntegerDigits);
            }
            if (options.useGrouping) {
                actualPattern = props.groupingPattern(actualPattern);
            }
            if (parseOptions.type === 'currency') {
                const cPattern: string = actualPattern;
                actualPattern = curObj.pData.nlead + cPattern + curObj.pData.nend;
                if (curObj.hasNegativePattern) {
                    actualPattern += ';' + curObj.nData.nlead + cPattern + curObj.nData.nend;
                }
            }
            if (parseOptions.type === 'percent') {
                actualPattern += ' %';
            }
        } else {
            actualPattern = options.format.replace(/'/g, '"');
        }
        if (Object.keys(dOptions).length > 0) {
            actualPattern = !isExcel ? props.processSymbol(actualPattern, dOptions) : actualPattern;
        }
        return actualPattern;
    };

    /**
     * Constructs the pattern for fraction digits.
     *
     * @param {string} pattern ?
     * @param {number} minDigits ?
     * @param {number} maxDigits ?
     * @returns {string} Pattern with fraction digits.
     */
    props.fractionDigitsPattern = (pattern: string, minDigits: number, maxDigits?: number): string => {
        pattern += '.';
        for (let i: number = 0; i < minDigits; i++) {
            pattern += '0';
        }
        if (minDigits < maxDigits) {
            const diff: number = maxDigits - minDigits;
            for (let j: number = 0; j < diff; j++) {
                pattern += '#';
            }
        }
        return pattern;
    };

    /**
     * Constructs the pattern for minimum integer digits.
     *
     * @param {string} pattern ?
     * @param {number} digits ?
     * @returns {string} Pattern with minimum integer digits.
     */
    props.minimumIntegerPattern = (pattern: string, digits: number): string => {
        const parts: string[] = pattern.split('.');
        let integer: string = '';
        for (let i: number = 0; i < digits; i++) {
            integer += '0';
        }
        return parts[1] ? (integer + '.' + parts[1]) : integer;
    };

    /**
     * Constructs the pattern for grouping.
     *
     * @param {string} pattern ?
     * @returns {string} Grouped pattern.
     */
    props.groupingPattern = (pattern: string): string => {
        const parts: string[] = pattern.split('.');
        let integerPart: string = parts[0];
        const no: number = 3 - integerPart.length % 3;
        const hash: string = (no && no === 1) ? '#' : (no === 2 ? '##' : '');
        integerPart = hash + integerPart;
        pattern = '';
        for (let i: number = integerPart.length - 1; i > 0; i -= 3) {
            pattern = ',' + integerPart[i - 2] + integerPart[i - 1] + integerPart[parseInt(i.toString(), 10)] + pattern;
        }
        pattern = pattern.slice(1);
        return parts[1] ? (pattern + '.' + parts[1]) : pattern;
    };

    /**
     * Returns week data based on culture.
     *
     * @param {string} culture ?
     * @param {Object} cldr ?
     * @returns {number} Week data.
     */
    props.getWeekData = (culture: string, cldr?: Object): number => {
        let firstDay: string = defaultFirstDay;
        const mapper: Object = getValue('supplemental.weekData.firstDay', cldr);
        let iCulture: string = culture;
        if ((/en-/).test(iCulture)) {
            iCulture = iCulture.slice(3);
        }
        iCulture = iCulture.slice(0, 2).toUpperCase() + iCulture.substr(2);
        if (mapper) {
            firstDay = mapper[`${iCulture}`] || mapper[iCulture.slice(0, 2)] || defaultFirstDay;
        }
        return firstDayMapper[`${firstDay}`];
    };

    /**
     * Gets the week number of the year.
     *
     * @param {Date} date ?
     * @returns {number} Week number.
     */
    props.getWeekOfYear = (date: Date): number => {
        const newYear: Date = new Date(date.getFullYear(), 0, 1);
        let day: number = newYear.getDay();
        let weeknum: number;
        day = (day >= 0 ? day : day + 7);
        const daynum: number = Math.floor((date.getTime() - newYear.getTime() -
            (date.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
        if (day < 4) {
            weeknum = Math.floor((daynum + day - 1) / 7) + 1;
            if (weeknum > 52) {
                const nYear: Date = new Date(date.getFullYear() + 1, 0, 1);
                let nday: number = nYear.getDay();
                nday = nday >= 0 ? nday : nday + 7;
                weeknum = nday < 4 ? 1 : 53;
            }
        } else {
            weeknum = Math.floor((daynum + day - 1) / 7);
        }
        return weeknum;
    };
    return props;
})();
