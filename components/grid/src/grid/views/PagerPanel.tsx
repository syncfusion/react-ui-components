import { PageProps, Pager, PagerRef } from '@syncfusion/react-pager';
import { forwardRef, ForwardRefExoticComponent, RefAttributes,  Ref, memo, RefObject, JSX, useState } from 'react';
import { IGrid, GridRef } from '../types/grid.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { PagerArgsInfo } from '../types/page.interfaces';
import { MutableGridSetter } from '../types/interfaces';

/**
 * PagerPanelBase component renders the pagination controls for the grid.
 * This component encapsulates pagination functionality by wrapping the Pager component,
 * handling page navigation events, and maintaining synchronization between the grid state and pagination UI.
 * It supports features like page size selection, navigation buttons, and custom templates for pagination rendering.
 *
 * @param {Partial<PageProps>} props - Configuration for the pager including current page, total pages, and page count state
 * @param {RefObject<PagerRef>} ref - Forwarded ref that exposes imperative methods for parent components
 * @returns {JSX.Element} The rendered pager element.
 */

const PagerPanelBase: ForwardRefExoticComponent<PageProps & RefAttributes<PagerRef>> =
    memo(forwardRef<PagerRef, Partial<PageProps>>((props: Partial<PageProps>, ref: Ref<PagerRef>): JSX.Element => {
        const grid: Partial<IGrid> & Partial<MutableGridSetter> = useGridComputedProvider();
        const gridObj: Partial<GridRef> & Partial<MutableGridSetter> = useGridComputedProvider();
        const { setCurrentPage, setGridAction, allowKeyboard, pageSettings } = grid;
        const { totalRecordsCount, cssClass, editModule } = useGridMutableProvider();
        const [_, setPagerCurrentPage] = useState(props.currentPage);
        const clickHander: (e: PagerArgsInfo) => void = async(e: PagerArgsInfo) => {
            const args: PagerArgsInfo = {
                cancel: false, currentPage: e.currentPage, previousPage: e.oldPage, requestType: 'paging'
            };
            args.type = 'pageChanging';
            const confirmResult: boolean = await editModule?.checkUnsavedChanges?.();
            if (!isNullOrUndefined(confirmResult) && !confirmResult) {
                setPagerCurrentPage(pageSettings.currentPage); // force re-render as well not change pager currentPage state.
                return;
            }
            grid.onPageChangeStart?.(args);
            args.isPageLoading = false;
            if (args.cancel) {
                return;
            }
            setCurrentPage(args.currentPage as number);
            setGridAction(args);
        };

        const addAriaAttribute: () => void = () => {
            requestAnimationFrame(() => {
                if (!(props.template) && (ref as RefObject<PagerRef>).current && (ref as RefObject<PagerRef>).current.element) {
                    if (gridObj?.getContentTable?.()) {
                        (ref as RefObject<PagerRef>).current.element.setAttribute('aria-controls', gridObj?.getContentTable?.().id);
                    }
                }
            });
        };

        return (
            <Pager
                ref={ref}
                className={cssClass}
                totalRecordsCount={totalRecordsCount}
                pageSize={props.pageSize}
                pageCount={props.pageCount}
                currentPage={pageSettings.currentPage}
                enableRtl={grid.enableRtl}
                locale={grid.locale}
                updateAriaAttribute={addAriaAttribute}
                click={clickHander}
                template={props.template}
                allowKeyboard={allowKeyboard}
            />
        );
    }
    ));

/**
 * Set display name for debugging purposes
 */
PagerPanelBase.displayName = 'PagerPanelBase';

/**
 * Export the PagerPanelBase component for direct usage if needed
 *
 * @private
 */
export { PagerPanelBase };
