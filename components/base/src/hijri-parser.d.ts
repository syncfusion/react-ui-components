/**
 * Hijri parser custom hook
 */
interface HijriDate {
    year: number;
    month: number;
    date: number;
}
interface IHijriParser {
    getHijriDate: (gDate: Date) => HijriDate;
    toGregorian: (year: number, month: number, day: number) => Date;
}
/**
 * Custom hook for Hijri date parsing.
 */
export declare const HijriParser: IHijriParser;
export {};
