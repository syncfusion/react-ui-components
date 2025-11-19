import {
    MemoExoticComponent,
    useRef,
    memo,
    Ref,
    JSX,
    useMemo,
    useEffect
} from 'react';
import { L10n, IL10n } from '@syncfusion/react-base';
import { PageProps, defaultConstants  } from './page';
import { ChevronLeftIcon, ChevronRightIcon, FirstPageIcon, LastPageIcon } from '@syncfusion/react-icons';

// CSS class constants following enterprise naming convention
const CSS_FIRST_PAGE: string = 'sf-pager-first sf-icons';
const CSS_PREV_PAGE: string = 'sf-pager-previous sf-icons';
const CSS_NEXT_PAGE: string = 'sf-pager-next sf-icons';
const CSS_LAST_PAGE: string = 'sf-pager-last sf-icons';
const CSS_FIRST_LINK_SPACE: string = 'sf-pp sf-spacing';
const CSS_LINK_LAST_SPACE: string = 'sf-np sf-spacing';
const CSS_DISABLE: string = ' sf-disable';
const CSS_DEFAULT: string = ' sf-pager-icons';
const CSS_NUMERIC_ITEM_DIABLE: string = ' sf-pager-item-disable sf-disable';
const CSS_NUMERIC_ITEM_ENABLE: string = ' sf-numeric-item sf-pager-icons';

/**
 * Interface for pager reference exposed to parent components
 */
export interface NumericProps extends PageProps {

    /**
     * Defines the total number of pages count which is used to render numeric container.
     */
    totalPages?: number;

    /**
     * Optional function to update ARIA attributes for accessibility enhancements.
     */
    updateAriaAttribute?: (args: {}) => void;

}


/**
 * NumericContainer component renders a Numeric Container element
 *
 * @component
 * @internal
 * @param {NumericProps} props - Component properties
 * @returns {JSX.Element} The rendered Numeric Container div
 */
const NumericContainer: MemoExoticComponent<(props: Partial<NumericProps>) => JSX.Element> = memo((props: Partial<NumericProps>) => {
    const { pageCount, currentPage, totalRecordsCount, totalPages, locale, updateAriaAttribute, enableRtl } = props;
    const numericContainerRef: Ref<HTMLDivElement> = useRef<HTMLDivElement>(null);

    const firstPageValue: number = useMemo(() => {
        let firstPageValue: number = ((currentPage as number) / (pageCount as number)) > 1 ?
            ((Math.ceil(currentPage / pageCount) * pageCount) - (pageCount - 1)) : 1;
        if (((currentPage as number === totalPages && firstPageValue !== totalPages) && (pageCount as number <= totalPages)) &&
            ((currentPage as number) % (pageCount as number) === 0)) {
            firstPageValue = (currentPage as number) - (pageCount as number) + 1;
        }
        return firstPageValue;
    }, [currentPage, pageCount, totalPages]);

    const pageInfoLocale: IL10n = L10n('pager', defaultConstants, locale);

    const nextPageLinkNumber: number = useMemo(() => {
        return (totalPages && (pageCount + firstPageValue) <= totalPages) ? (pageCount + firstPageValue) : totalPages + 1;
    }, [pageCount, currentPage, totalPages]);

    const renderPagerLinksContainer: JSX.Element[] = useMemo(() => {
        const links: JSX.Element[] = [];
        for (let i: number = firstPageValue; i < nextPageLinkNumber; i++) {
            const isActive: boolean = currentPage === i;
            const classes: string = `sf-numeric-item sf-spacing ${isActive ? 'sf-current-item sf-active' : 'sf-pager-icons'}`;
            const ariaLabel: string = `${pageInfoLocale.getConstant('pageLabel')} ${i} ${pageInfoLocale.getConstant('pagerOfLabel')} ${10} ${pageInfoLocale.getConstant('pagesLabel')}`;
            links.push(
                <a
                    key={i}
                    className={classes}
                    tabIndex={-1}
                    aria-label={ariaLabel}
                    href="#"
                    aria-current={isActive ? 'page' : undefined}
                    page-index={i}
                >
                    {i}
                </a>
            );
        }
        return links;
    }, [pageCount, currentPage, totalPages]);

    useEffect(() => {
        if (renderPagerLinksContainer && updateAriaAttribute) {
            updateAriaAttribute({});
        }
    }, [renderPagerLinksContainer]);



    return (
        <div
            ref={(elemnt: HTMLDivElement) => {
                numericContainerRef.current = elemnt;
            }}
            className='sf-pager-container'
            role='navigation'>
            <div
                className={`${CSS_FIRST_PAGE}${currentPage as number > 1 ? `${CSS_DEFAULT}` : `${CSS_DISABLE}`}`}
                title={pageInfoLocale.getConstant('firstPageTooltip')}
                tabIndex={-1}
                role="button"
                page-index={1}
            >
                {enableRtl ? (
                    <LastPageIcon className={`sf-font-size-xl ${currentPage as number > 1 ? '' : 'sf-disabled'}`} />
                ) : (
                    <FirstPageIcon className={`sf-font-size-xl ${currentPage as number > 1 ? '' : 'sf-disabled'}`} />
                )}
            </div>
            <div
                className={`${CSS_PREV_PAGE}${currentPage as number > 1 ? `${CSS_DEFAULT}` : `${CSS_DISABLE}`}`}
                title={pageInfoLocale.getConstant('previousPageTooltip')}
                tabIndex={-1}
                role="button"
                page-index={(currentPage as number) - 1}
            >
                {enableRtl ? (
                    <ChevronRightIcon className={`sf-font-size-xl ${currentPage as number > 1 ? '' : 'sf-disabled'}`} />
                ) : (
                    <ChevronLeftIcon className={`sf-font-size-xl ${currentPage as number > 1 ? '' : 'sf-disabled'}`} />
                )}
            </div>
            <div>
                <a
                    className={`${CSS_FIRST_LINK_SPACE}${((currentPage as number) > (pageCount as number)) ? `${CSS_NUMERIC_ITEM_ENABLE}` : `${CSS_NUMERIC_ITEM_DIABLE}`}`}
                    title={pageInfoLocale.getConstant('previousPageGroupTooltip')}
                    aria-label={pageInfoLocale.getConstant('previousPageGroupTooltip')}
                    tabIndex={-1}
                    href="#"
                    page-index={firstPageValue > (pageCount as number) ?
                        firstPageValue - (pageCount as number) : firstPageValue}
                >
                    ...
                </a>
            </div>
            <div className='sf-pager-numeric-container'>
                {renderPagerLinksContainer}
            </div>
            <div>
                <a
                    className={`${CSS_LINK_LAST_SPACE}${(nextPageLinkNumber > (totalPages as number)) ? `${CSS_NUMERIC_ITEM_DIABLE}` : `${CSS_NUMERIC_ITEM_ENABLE}`}`}
                    title={pageInfoLocale.getConstant('nextPageGroupTooltip')}
                    aria-label={pageInfoLocale.getConstant('nextPageGroupTooltip')}
                    tabIndex={-1}
                    href="#"
                    page-index={nextPageLinkNumber || 1}
                >
                    ...
                </a>
            </div>
            <div
                className={`${CSS_NEXT_PAGE}${((currentPage === totalPages) || totalRecordsCount === 0) ? `${CSS_DISABLE}` : `${CSS_DEFAULT}`}`}
                title={pageInfoLocale.getConstant('nextPageTooltip')}
                tabIndex={-1}
                role="button"
                page-index={(currentPage as number) + 1}
            >
                {enableRtl ? (
                    <ChevronLeftIcon className={`sf-font-size-xl ${((currentPage === totalPages) || totalRecordsCount === 0) ? 'sf-disabled' : ''}`} />
                ) : (
                    <ChevronRightIcon className={`sf-font-size-xl ${((currentPage === totalPages) || totalRecordsCount === 0) ? 'sf-disabled' : ''}`} />
                )}
            </div>
            <div
                className={`${CSS_LAST_PAGE}${((currentPage === totalPages) || totalRecordsCount === 0) ? `${CSS_DISABLE}` : `${CSS_DEFAULT}`}`}
                title={pageInfoLocale.getConstant('lastPageTooltip')}
                tabIndex={-1}
                role="button"
                page-index={totalPages || 1}
            >
                {enableRtl ? (
                    <FirstPageIcon className={`sf-font-size-xl ${((currentPage === totalPages) || totalRecordsCount === 0) ? 'sf-disabled' : ''}`} />
                ) : (
                    <LastPageIcon className={`sf-font-size-xl ${((currentPage === totalPages) || totalRecordsCount === 0) ? 'sf-disabled' : ''}`} />
                )}
            </div>
        </div>
    );
});

/**
 * Set display name for debugging purposes
 */
NumericContainer.displayName = 'NumericContainer';

/**
 * Export the NumericContainer component for internal use
 *
 * @internal
 */
export { NumericContainer };
