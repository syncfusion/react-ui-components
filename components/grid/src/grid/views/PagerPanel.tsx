import { PageProps, Pager, PagerRef } from '@syncfusion/react-pager/src/page';
import { forwardRef, ForwardRefExoticComponent, RefAttributes,  Ref, memo, JSX, useRef, useCallback } from 'react';
import { IGrid } from '../types/grid.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { PagerArgsInfo } from '../types/page.interfaces';
import { MutableGridSetter } from '../types/interfaces';
import { ActionType } from '../types/enum';

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
        const { setCurrentPage, setGridAction, allowKeyboard, pageSettings } = grid;
        const { totalRecordsCount, cssClass, editModule } = useGridMutableProvider();
        const pagerRef: React.RefObject<PagerRef> = useRef<PagerRef>(null);
        const setPagerRef: (instance: PagerRef) => void = useCallback((instance: PagerRef | null): void => {
            pagerRef.current = instance;
            if (typeof ref === 'function') {
                ref(instance);
            } else if (ref) {
                ref.current = instance;
            }
        }, [ref]);
        const clickHander: (e: PagerArgsInfo) => void = async(e: PagerArgsInfo) => {
            // Stop the third-party pager from changing its visual page before confirmation.
            e.cancel = true;
            e.isPageLoading = false;
            const args: PagerArgsInfo = {
                cancel: false, currentPage: e.currentPage, previousPage: e.oldPage, requestType: ActionType.Paging
            };
            args.type = 'pageChanging';
            args.isPageLoading = false;
            const confirmResult: boolean = await editModule?.checkUnsavedChanges?.() ?? true;
            if (!isNullOrUndefined(confirmResult) && !confirmResult) {
                return;
            }
            grid.onPageChangeStart?.(args);
            if (args.cancel) {
                return;
            }
            setCurrentPage(args.currentPage as number);
            setGridAction(args);
            pagerRef.current?.goToPage?.(args.currentPage as number);
        };

        return (
            <Pager
                ref={setPagerRef}
                className={cssClass + ' sf-grid-pager'}
                totalRecordsCount={totalRecordsCount}
                pageSize={props.pageSize}
                pageCount={props.pageCount}
                currentPage={pageSettings.currentPage}
                enableRtl={grid.enableRtl}
                locale={grid.locale}
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
