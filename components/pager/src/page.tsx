import {
    forwardRef,
    useRef,
    useImperativeHandle,
    useEffect,
    useState,
    HTMLAttributes,
    ReactElement,
    RefObject,
    RefAttributes,
    useCallback,
    MouseEvent,
    KeyboardEvent,
    Ref,
    useMemo,
    JSX
} from 'react';
import { closest, IL10n, L10n, preRender } from '@syncfusion/react-base';
import { NumericContainer } from './numericContainer';
import { usePager } from './usePager';
import { usePagerFocus } from './usePagerFocus';
import { ChevronLeftIcon, ChevronRightIcon, FirstPageIcon, LastPageIcon } from '@syncfusion/react-icons';

export const defaultConstants: { [key: string]: string } = {
    currentPageLabel: '{0} of {1} pages',
    totalItemsLabel: '({0} items)',
    totalItemLabel: '({0} item)',
    firstPageTooltip: 'Go to first page',
    lastPageTooltip: 'Go to last page',
    nextPageTooltip: 'Go to next page',
    previousPageTooltip: 'Go to previous page',
    nextPageGroupTooltip: 'Go to next page group',
    previousPageGroupTooltip: 'Go to previous page group',
    pagerStatusMessage: 'Pager external message',
    pageLabel: 'Page ',
    pagerOfLabel: ' of ',
    pagesLabel: ' Pages'
};

// CSS class constants following enterprise naming convention
const CSS_MOBLIE_FIRST_PAGE: string = 'sf-pager-mfirst sf-icons';
const CSS_MOBLIE_PREV_PAGE: string = 'sf-pager-mprevious sf-icons';
const CSS_MOBLIE_NEXT_PAGE: string = 'sf-pager-mnext sf-icons';
const CSS_MOBLIE_LAST_PAGE: string = 'sf-pager-mlast sf-icons';
const CSS_DISABLE: string = ' sf-disable';
const CSS_DEFAULT: string = ' sf-pager-icons';
const CSS_PARENT_MSG_BAR: string = 'sf-pager-message-bar';
const CSS_PAGE_MSG: string = 'sf-pager-number-message-container';
const CSS_PAGE_COUNT_MSG: string = 'sf-pager-count-message-container';
const CSS_PAGE_EXTERNAL_MSG: string = 'sf-pager-external-message';

/**
 * Page component props for configuring and rendering a pager.
 */
export interface PageProps {
    /**
     * Optional ID to uniquely identify the pager.
     *
     */
    id?: string;

    /**
     * Defines the records count of visible page.
     *
     * @default 12
     */
    pageSize?: number;

    /**
     * Defines the number of pages to display in pager container.
     *
     * @default 10
     */
    pageCount?: number;

    /**
     * Defines the current page number of pager.
     *
     * @default 1
     */
    currentPage?: number;

    /**
     * Gets or Sets the total records count which is used to render numeric container.
     *
     * @default 0
     */
    totalRecordsCount?: number;

    /**
     * Overrides the global culture and localization value for this component. Default global culture is 'en-US'.
     *
     * @default ''
     */
    locale?: string;

    /**
     * Enables right-to-left layout when set to true.
     *
     * @default false
     */
    enableRtl?: boolean;

    /**
     * Whether keyboard action is enabled for the pager.
     *
     * @default true
     */
    allowKeyboard?: boolean;

    /**
     *  Defines the template as string or React element ID which renders customized elements in pager instead of default elements.
     *
     * @default null
     */
    template?: string | ReactElement | Function;

    /**
     * Callback when page is initialized and mounted
     *
     * @default null
     */
    created?: (args: {}) => void;

    /**
     * Triggers when click on the numeric items
     *
     * @default null
     */
    click?: (args: {}) => void;

    /**
     * Optional function to update ARIA attributes for accessibility enhancements.
     *
     * @hidden
     */
    updateAriaAttribute?: (args: {}) => void;

    /**
     * Navigates to the target page according to the given number.
     *
     * @param  {number} pageNo - Defines the page number to navigate.
     * @returns {void}
     */
    goToPage?: (pageNo: number) => void;

    /**
     * If `enableExternalMessage` set to true, then it adds the message to Pager.
     *
     * @default false
     */
    enableExternalMessage?: boolean;

    /**
     * Defines the external message of Pager.
     *
     * @default null
     */
    externalMessage?: string;

    /**
     * @hidden
     */
    className?: string;
}

/**
 * Interface for pager reference exposed to parent components
 */
export interface PagerRef extends PageProps {
    /**
     * Reference to the pager root DOM element
     */
    element?: HTMLDivElement | null;

    /**
     * Optional ID to uniquely identify the pager.
     */
    id?: string;

    /**
     * Defines the records count of visible page.
     */
    pageSize?: number;

    /**
     * Defines the number of pages to display in pager container.
     */
    pageCount?: number;

    /**
     * Defines the current page number of pager.
     */
    currentPage?: number;

    /**
     * Gets or Sets the total records count which is used to render numeric container.
     */
    totalRecordsCount?: number;

    /**
     * Overrides the global culture and localization value for this component. Default global culture is 'en-US'.
     */
    locale?: string;

    /**
     * Enables right-to-left layout when set to true.
     */
    enableRtl?: boolean;

    /**
     * Defines the total number of pages count which is used to render numeric container.
     */
    totalPages?: number;

    /**
     *  Defines the template as string or React element ID which renders customized elements in pager instead of default elements.
     */
    template?: string | ReactElement | Function;

    /**
     * Callback when page is initialized and mounted
     */
    created?: (args: {}) => void;

    /**
     * Triggers when click on the numeric items
     */
    click?: (args: {}) => void;

    /**
     * Optional function to update ARIA attributes for accessibility enhancements.
     * @hidden
     */
    updateAriaAttribute?: (args: {}) => void;

    /**
     * Navigates to the specified target page.
     *
     * @param  {number} pageNo - Defines the page number to navigate.
     * @returns {void}
     */
    goToPage?: (pageNo: number) => void;

    /**
     * If `enableExternalMessage` set to true, then it adds the message to Pager.
     *
     */
    enableExternalMessage?: boolean;

    /**
     * Defines the text of the external message.
     *
     * @param  {string} message - Defines the message to update.
     * @returns {void}
     */
    updateExternalMessage?: (message: string) => void;

    /**
     * Defines the external message of Pager.
     *
     */
    externalMessage?: string;

    /**
     * @hidden
     */
    className?: string;

}

/**
 * Interface representing the page component methods.
 */
export interface IPager extends PageProps {

    /**
     * This is page component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}

type IPageProps = IPager & HTMLAttributes<HTMLDivElement>;

/**
 * `Pager` is a feature-rich Paging implementation for React applications
 * It supports totalRecordsCount, pageSize behavior.
 *
 * @component
 * @example
 * ```tsx
 * <Pager totalRecordsCount={20} pageSize={1}>
 * </Pager>
 *
 * @param {Partial<PageProps>} props - Configuration for the pager including current page, total pages, and page count state
 * @param {RefObject<PagerRef>} ref - Forwarded ref that exposes imperative methods for parent components
 * @returns {JSX.Element} The rendered pager element
 * ```
 */
export const Pager: React.ForwardRefExoticComponent<IPageProps & RefAttributes<PagerRef>> =
    forwardRef<PagerRef, Partial<IPageProps>>((props: Partial<PageProps>, ref: Ref<PagerRef>) => {
        const { publicAPI, totalPages, currentPage, setcurrentPage } = usePager(props);
        const { pageSize, pageCount, totalRecordsCount, locale, enableExternalMessage,
            externalMessage, className, enableRtl, allowKeyboard, id } = publicAPI;
        const pageRef: RefObject<PagerRef> = useRef<PagerRef>(null);
        const { actionFocus, handleBlur, handleFocus, handleKeyDown, setFirstLastTabIndex, getClass, removeDisabledTabIndex } =
            usePagerFocus({ pageRef, currentPage, allowKeyboard, totalRecordsCount, pageSize });
        const [enableExternalMsg, setEnableExternalMsg] = useState<boolean>(enableExternalMessage);
        const [pagerStatusMessage, setExternalMsg] = useState<string>(externalMessage);
        const updateAriaAttribute: (args: {}) => void = props.updateAriaAttribute;
        // Update pegerRef with render properties when they become available
        useEffect(() => {
            pageRef.current = {
                ...pageRef.current,
                currentPage: currentPage,
                totalPages: totalPages,
                totalRecordsCount: totalRecordsCount
            };
        }, [pageRef.current, currentPage, totalPages, totalRecordsCount]);
        // Initialize pagerRef with all the properties
        if (pageRef.current === null) {
            pageRef.current = {
                currentPage: currentPage,
                totalPages: totalPages,
                enableExternalMessage: enableExternalMessage,
                externalMessage: externalMessage,
                totalRecordsCount: totalRecordsCount,
                goToPage: (pageNo: number) => {
                    const totalPagesValue: number = totalRecordsCount ? totalRecordsCount : pageRef.current.totalRecordsCount;
                    const totalPage: number = totalPagesValue % pageSize === 0 ? (totalPagesValue / pageSize) :
                        (parseInt((totalPagesValue / pageSize).toString(), 10) + 1);
                    if (pageNo >= 1 && pageNo <= totalPage && pageNo !== pageRef.current.currentPage) {
                        setcurrentPage(pageNo);
                    }
                },
                updateExternalMessage: (message: string) => {
                    setEnableExternalMsg(true);
                    setExternalMsg(message);
                },
                // Include all public API computed properties
                ...publicAPI
            };
        }

        // Expose DOM ref to parent via forwardRef
        useImperativeHandle(ref, () => pageRef.current as PagerRef);
        const [pageNumberText, setPageNumberText] = useState('');
        const [pageCountText, setPageCountText] = useState('');
        const pageInfoLocale: IL10n = L10n('pager', defaultConstants, locale);

        const refresh: () => void = useCallback(() => {

            const pagerMessageFormat: (str: string, args: number[]) => string = (str: string, args: number[]): string => {
                for (let i: number = 0; i < args.length; i++) {
                    // Using string replacement instead of RegExp constructor to avoid security lint issues
                    const placeholder: string = `{${i}}`;
                    const value: string = isValidLocale(locale) ? args[parseInt(i.toString(), 10)].toLocaleString() :
                        args[parseInt(i.toString(), 10)].toString();
                    str = str.split(placeholder).join(value); // Alternative to replace that doesn't use RegExp
                }
                return str;
            };

            const isValidLocale: (locale?: string) => boolean = (locale?: string): boolean => {
                try {
                    new Intl.NumberFormat(locale);
                    return true;
                } catch (e) {
                    return false;
                }
            };

            const currentPageLabel: string = totalRecordsCount as number <= 1 ? 'totalItemLabel' : 'totalItemsLabel';
            const formattedPageInfo: string = pagerMessageFormat(pageInfoLocale.getConstant('currentPageLabel'), [
                totalRecordsCount as number === 0 ? 0 : currentPage as number, totalPages || 0, totalRecordsCount || 0]);

            const formattedPageCount: string = pagerMessageFormat(pageInfoLocale.getConstant(currentPageLabel), [
                totalRecordsCount || 0, totalRecordsCount ? pageSize as number * (currentPage as number - 1) + 1 : 0,
                (pageSize as number) * (currentPage as number) > (totalRecordsCount as number) ? totalRecordsCount as number :
                    pageSize as number * (currentPage as number)]);

            setPageNumberText(formattedPageInfo + ' ');
            setPageCountText(formattedPageCount);
            removeDisabledTabIndex();
            setFirstLastTabIndex();
        }, [totalRecordsCount, currentPage, totalPages, locale, pageSize, allowKeyboard]);

        useEffect(() => {
            preRender('page');
            refresh();
        }, [currentPage, totalRecordsCount, pageSize, locale, totalPages, refresh]);

        useEffect(() => {
            const totalPage: number = totalRecordsCount % pageSize === 0 ? (totalRecordsCount / pageSize) :
                (parseInt((totalRecordsCount / pageSize).toString(), 10) + 1);
            if (totalPage && currentPage > totalPage) {
                setcurrentPage(totalPage);
            }
        }, [pageSize]);

        const handleContainerClick: (e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void = useCallback((
            e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
            let target: HTMLElement = e.target as HTMLElement;
            if (target.classList.contains('sf-numeric-item')) {
                e.preventDefault();
            }
            if (target.tagName === 'svg' || target.tagName === 'path') {
                target = closest(target, '.sf-icons') as HTMLElement;
            }
            if (!target?.classList.contains('sf-disable')) {
                const pageIndex: number = parseInt(target?.getAttribute('page-index') || '', 10);
                if (!isNaN(pageIndex) || target?.hasAttribute('page-index')) {
                    const args: { currentPage: number, oldPage: number, cancel: boolean, isPageLoading: boolean } = {
                        currentPage: pageIndex, oldPage: currentPage, cancel: false, isPageLoading: true };
                    props.click?.(args);
                    if (args.cancel) {
                        return false;
                    }
                    actionFocus.current = { className: getClass(target), pageIndex: pageIndex };
                    if (args.isPageLoading) {
                        setcurrentPage(pageIndex);
                    }
                }
            }
            return false;
        }, [currentPage]);

        const pagerElement: () => React.ReactNode = useCallback((): React.ReactNode => {
            return (<>
                <div
                    className={`${CSS_MOBLIE_FIRST_PAGE}${currentPage as number > 1 ? `${CSS_DEFAULT}` : `${CSS_DISABLE}`}`}
                    title={pageInfoLocale.getConstant('firstPageTooltip')}
                    aria-label={pageInfoLocale.getConstant('firstPageTooltip')}
                    tabIndex={-1}
                    page-index={1}
                >
                    {enableRtl ? (
                        <LastPageIcon className={`sf-font-size-xs ${currentPage as number > 1 ? '' : 'sf-disabled'}`} />
                    ) : (
                        <FirstPageIcon className={`sf-font-size-xs ${currentPage as number > 1 ? '' : 'sf-disabled'}`} />
                    )}
                </div>
                <div
                    className={`${CSS_MOBLIE_PREV_PAGE}${currentPage as number > 1 ? `${CSS_DEFAULT}` : `${CSS_DISABLE}`}`}
                    title={pageInfoLocale.getConstant('previousPageTooltip')}
                    aria-label={pageInfoLocale.getConstant('previousPageTooltip')}
                    tabIndex={-1}
                    page-index={(currentPage as number) - 1}
                >
                    {enableRtl ? (
                        <ChevronRightIcon className={`sf-font-size-xs ${ currentPage === totalPages || totalRecordsCount === 0 ? 'sf-disabled' : '' }`} />
                    ) : (
                        <ChevronLeftIcon className={`sf-font-size-xs ${ currentPage === totalPages || totalRecordsCount === 0 ? 'sf-disabled' : '' }`} />
                    )}
                </div>

                <NumericContainer {...{ pageCount, currentPage, totalRecordsCount, totalPages, locale,
                    updateAriaAttribute, enableRtl }  } />
                <div className={`${CSS_PARENT_MSG_BAR}`} >
                    <span className={`${CSS_PAGE_MSG}`} style={{ textAlign: 'right' }}>
                        {pageNumberText}
                    </span>
                    <span className={`${CSS_PAGE_COUNT_MSG}`} style={{ textAlign: 'right' }}>
                        {pageCountText}
                    </span>
                </div>
                <div
                    className={`${CSS_MOBLIE_NEXT_PAGE}${((currentPage === totalPages) || totalRecordsCount === 0) ? `${CSS_DISABLE}` : `${CSS_DEFAULT}`}`}
                    title={pageInfoLocale.getConstant('nextPageTooltip')}
                    aria-label={pageInfoLocale.getConstant('nextPageTooltip')}
                    tabIndex={-1}
                    page-index={(currentPage as number) + 1}
                >
                    {enableRtl ? (
                        <ChevronLeftIcon className={`sf-font-size-xs ${ currentPage === totalPages || totalRecordsCount === 0 ? 'sf-disabled' : '' }`} />
                    ) : (
                        <ChevronRightIcon className={`sf-font-size-xs ${ currentPage === totalPages || totalRecordsCount === 0 ? 'sf-disabled' : '' }`} />
                    )}
                </div>
                <div
                    className={`${CSS_MOBLIE_LAST_PAGE}${((currentPage === totalPages) || totalRecordsCount === 0) ? `${CSS_DISABLE}` : `${CSS_DEFAULT}`}`}
                    title={pageInfoLocale.getConstant('lastPageTooltip')}
                    aria-label={pageInfoLocale.getConstant('lastPageTooltip')}
                    tabIndex={-1}
                    page-index={totalPages}
                >
                    {enableRtl ? (
                        <FirstPageIcon className={`sf-font-size-xs ${currentPage as number > 1 ? '' : 'sf-disabled'}`} />
                    ) : (
                        <LastPageIcon className={`sf-font-size-xs ${currentPage as number > 1 ? '' : 'sf-disabled'}`} />
                    )}
                </div>
            </>);
        }, [currentPage, totalPages, totalRecordsCount, pageCount, pageNumberText, pageCountText, locale, enableRtl]);

        const enablePagerMessage:  string = useMemo(() => {
            if (pagerStatusMessage && pagerStatusMessage.toString().length) {
                return '';
            }
            return 'none';

        }, [pagerStatusMessage]);

        const enableExternalPanel: JSX.Element = useMemo<JSX.Element>(() => (
            <div
                className={`${CSS_PAGE_EXTERNAL_MSG}`}
                aria-label={pageInfoLocale.getConstant('pagerStatusMessage')}
                style={{ display: enablePagerMessage }}
            >{pagerStatusMessage}
            </div>
        ), [pagerStatusMessage, enablePagerMessage]);

        return (
            <div
                ref={(el: HTMLDivElement) => {
                    pageRef.current.element = el;
                }}
                id={id}
                className={className}
                data-role="page"
                tabIndex={-1}
                onClick={handleContainerClick}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={allowKeyboard ? handleKeyDown : undefined}
            >
                {props.template ? (typeof props.template === 'function' ? props.template({ currentPage: currentPage, totalPages: totalPages, totalRecordsCount: totalRecordsCount, pageSize: pageSize }) : props.template) : pagerElement()}
                {enableExternalMsg && enableExternalPanel}
            </div>
        );
    });

export default Pager;
