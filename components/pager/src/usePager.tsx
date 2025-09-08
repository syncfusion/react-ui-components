import {  useEffect, useMemo, useState, useId, Dispatch, SetStateAction } from 'react';
import { PageProps } from './page';
import { Browser } from '@syncfusion/react-base';


/**
 * CSS class names used in the Pager component
 */
const CSS_CLASS_NAMES: Record<string, string> = {
    CONTROL: 'sf-control',
    PAGER: 'sf-pager',
    LIB: 'sf-lib',
    RTL: 'sf-rtl',
    MAC_SAFARI: 'sf-mac-safari',
    DEVICE: 'sf-device'
};

/**
 * Result interface for the usePager hook
 */
interface PagerResult {
    /**
     * Public API exposed to consumers of the pager
     */
    publicAPI: Partial<PageProps>;

    /**
     * Defines the total number of pages count which is used to render numeric container
     */
    totalPages?: number;

    setcurrentPage: Dispatch<SetStateAction<number>>;

    currentPage?: number;

}


/**
 * Custom hook for handling the page's state and behavior.
 *
 * @param {Partial<PageProps>} props The properties for the page.
 * @returns {PageProps} An object containing various pager-related state and API
 */
export const usePager: (props: Partial<PageProps>) => PagerResult = (
    props: Partial<PageProps>): PagerResult => {

    const { ...rest } = props;

    const [currentPage, setcurrentPage] = useState<number>(rest.currentPage || 1);

    const generatedId: string = useId().replace(/:/g, '');
    const id: string = useMemo(() => rest.id || `pager_${generatedId}`, [rest.id, generatedId]);
    const pageSize: string | number = useMemo(() =>
        rest.pageSize || 12, [rest.pageSize]);
    const pageCount: string | number = useMemo(() =>
        rest.pageCount || 10, [rest.pageCount]);
    const totalRecordsCount: string | number = useMemo(() =>
        rest.totalRecordsCount || 0, [rest.totalRecordsCount]);
    const enableRtl: boolean = useMemo(() =>
        rest.enableRtl || false, [rest.enableRtl]);
    const allowKeyboard: boolean = useMemo(() =>
        rest.allowKeyboard !== false, [rest.allowKeyboard]);
    const locale: string = useMemo(() =>
        rest.locale || 'en-US', [rest.locale]);
    const enableExternalMessage: boolean = useMemo(() =>
        rest.enableExternalMessage || false, [rest.enableExternalMessage]);
    const externalMessage: string = useMemo(() =>
        rest.externalMessage || null, [rest.externalMessage]);


    /**
     * Compute CSS class names for the pager
     */
    const className: string = useMemo<string>(() => {
        const baseClasses: string[] = [
            CSS_CLASS_NAMES.CONTROL,
            CSS_CLASS_NAMES.PAGER,
            CSS_CLASS_NAMES.LIB
        ];

        if (enableRtl) {
            baseClasses.push(CSS_CLASS_NAMES.RTL);
        }

        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) || Browser.isSafari()) {
            baseClasses.push(CSS_CLASS_NAMES.MAC_SAFARI);
        }

        if (Browser.isDevice) {
            baseClasses.push(CSS_CLASS_NAMES.DEVICE);
        }


        if (rest.className) {
            baseClasses.push(...rest.className.split(' '));
        }

        return baseClasses.join(' ');
    }, [enableRtl,  rest.className]);

    const [totalPages, setTotalPages] = useState<number>();

    useEffect(() => {
        setTotalPages(
            ((totalRecordsCount as number) % (pageSize  as number) === 0) ? ((totalRecordsCount as number) / (pageSize as number)) :
                (parseInt(((totalRecordsCount as number) / (pageSize as number)).toString(), 10) + 1)
        );
    }, [totalRecordsCount, pageSize]);

    // Effect for triggering events after pager creation
    useEffect(() => {
        if (rest.created) {
            rest.created({}); // trigger only once on initial render, once Dom element mounted.
        }
    }, []);

    /**
     * Public API exposed to consumers of the pager
     * Always keep memorized public APIs for Pager component context provider
     * This will prevent unnecessary re-rendering of child components
     * These are for readonly purpose - if a property needs to be updated,
     * it should not be included here but in the protected API
     */
    const publicAPI: Partial<PageProps> = useMemo(() => ({
        ...rest,
        pageSize,
        pageCount,
        className,
        totalRecordsCount,
        enableRtl,
        locale,
        enableExternalMessage,
        externalMessage,
        id,
        allowKeyboard
    }), [pageSize, pageCount, className, totalRecordsCount, enableRtl, locale, id, enableExternalMessage, externalMessage,
        allowKeyboard, rest]);

    return { ...rest, publicAPI, totalPages, currentPage, setcurrentPage};
};
