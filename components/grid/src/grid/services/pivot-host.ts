import type { PivotHost } from '@syncfusion/pivot-engine';
import { getDateFormat, getNumberFormat, getNumberParser } from '@syncfusion/react-base/src/internationalization';
import type { DateFormatOptions, NumberFormatOptions } from '@syncfusion/pivot-engine';

/**
 * The same formatting host is constructed independently in each execution context.
 *
 * @param {*} locale - locale.
 * @returns {*} Result.
 */
export function createReactPivotHost(locale?: string): PivotHost {
    return {
        globalize: {
            getDateFormat: (options: DateFormatOptions) =>
                (value: Date) => getDateFormat({ ...options, locale })(value),
            formatNumber: (value: number, options: NumberFormatOptions) => getNumberFormat({ ...options, locale })(value),
            parseNumber: (value: string, options: NumberFormatOptions) => getNumberParser({ ...options, locale })(value)
        },
        localeObj: { getConstant: (key: string) => new Map<string, string>([
            ['grandTotal', 'Grand Total'], ['null', '(Blank)'], ['undefined', '(Blank)']
        ]).get(key) || key },
        sanitize: (value: string) => value
    };
}
