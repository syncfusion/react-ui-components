import {
    forwardRef,
    ForwardRefExoticComponent,
    RefAttributes,
    useImperativeHandle,
    useRef,
    useLayoutEffect,
    useMemo,
    memo,
    JSX,
    RefObject,
    ReactNode,
    useEffect,
    ReactElement,
    useCallback,
    useState
} from 'react';
import { HeaderPanelBase, ContentPanelBase, PagerPanelBase, GridToolbar, PopupEditForm, ColumnChooserDialog, ContextMenuPanelBase } from './index';
import { RenderRef, IRenderBase, HeaderPanelRef, ContentPanelRef, FooterPanelRef, WrapMode, InlineEditFormRef, ColumnProps, IRow, ScrollMode, LoadingIndicatorType, ActionType, ColumnChooserBeforeOpenEvent, ColumnChooserSettings, ColumnChooserApplyEvent, ContextMenuPanelRef, SortDescriptor } from '../types';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { useRender, useScroll } from '../hooks';
import { ToolbarItemProps, ToolbarAPI } from '../types/toolbar.interfaces';
import { PagerRef } from '@syncfusion/react-pager';
import { FooterPanelBase } from './FooterPanel';
import { Spinner, SpinnerProps } from '@syncfusion/react-popups';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { DataManager } from '@syncfusion/react-data';
import { addLastRowBorder } from '../utils';
import { GroupDropArea } from '../views';

/**
 * CSS class names used in the Render component
 */
const CSS_CLASS_NAMES: Record<string, string> = {
    GRID_HEADER: 'sf-grid-header-container',
    HEADER_CONTENT: 'sf-grid-header-content',
    GRID_CONTENT: 'sf-grid-content-container',
    CONTENT: 'sf-grid-content',
    GRID_FOOTER: 'sf-grid-footer-container',
    GRID_FOOTER_PADDING: 'sf-grid-footer-padding',
    FOOTER_CONTENT: 'sf-grid-summary-content'
};

/**
 * Custom hook to synchronize scroll elements between header and content panels
 *
 * @private
 * @param {Object} headerRef - Reference to the header panel
 * @param {Object} contentRef - Reference to the content panel
 * @param {Object} footerRef - Reference to the footer panel
 * @param {Function} setHeaderElement - Function to set the header scroll element
 * @param {Function} setContentElement - Function to set the content scroll element
 * @param {Function} setFooterElement - Function to set the footer scroll element
 * @param {Function} setPadding - Function to set padding for scroll elements
 * @returns {void}
 */
const useSyncScrollElements: (
    headerRef: RefObject<HeaderPanelRef>,
    contentRef: RefObject<ContentPanelRef>,
    footerRef: RefObject<FooterPanelRef>,
    setHeaderElement: (el: HTMLElement | null) => void,
    setContentElement: (el: HTMLElement | null) => void,
    setFooterElement: (el: HTMLElement | null) => void,
    setPadding: () => void
) => void = (
    headerRef: RefObject<HeaderPanelRef>,
    contentRef: RefObject<ContentPanelRef>,
    footerRef: RefObject<FooterPanelRef>,
    setHeaderElement: (el: HTMLElement | null) => void,
    setContentElement: (el: HTMLElement | null) => void,
    setFooterElement: (el: HTMLElement | null) => void,
    setPadding: () => void
): void => {
    useLayoutEffect(() => {
        const headerElement: HTMLDivElement = headerRef.current?.headerScrollRef;
        setHeaderElement(headerElement);

        const contentElement: HTMLDivElement = contentRef.current?.contentScrollRef;
        setContentElement(contentElement);
        setPadding();

        const footerElement: HTMLDivElement = footerRef.current?.footerScrollRef;
        setFooterElement(footerElement);

        return () => {
            setHeaderElement(null);
            setContentElement(null);
            setFooterElement(null);
        };
    }, [headerRef, contentRef, footerRef.current, setHeaderElement, setContentElement, setFooterElement, setPadding]);
};

/**
 * Base component for rendering the grid structure with header and content panels
 *
 * @component
 */
const RenderBase: <T>(_props: Partial<IRenderBase> & RefAttributes<RenderRef<T>>) => ReactElement = memo(
    forwardRef<RenderRef, Partial<IRenderBase>>(<T, >(_props: Partial<IRenderBase>, ref: RefObject<RenderRef<T>>) => {
        const headerPanelRef: RefObject<HeaderPanelRef> = useRef<HeaderPanelRef>(null);
        const contentPanelRef: RefObject<ContentPanelRef<T>> = useRef<ContentPanelRef<T>>(null);
        const footerPanelRef: RefObject<FooterPanelRef> = useRef<FooterPanelRef>(null);
        const contextMenuPanelRef: RefObject<ContextMenuPanelRef> = useRef<ContextMenuPanelRef>(null);
        const pagerObjectRef:  RefObject<PagerRef> = useRef<PagerRef>(null);
        const popupEditFormRef: RefObject<InlineEditFormRef<T>> = useRef<InlineEditFormRef<T>>(null);

        const { privateRenderAPI, protectedRenderAPI } = useRender<T>();
        const { privateScrollAPI, protectedScrollAPI, setHeaderScrollElement, setContentScrollElement, setFooterScrollElement } =
            useScroll<T>(contentPanelRef.current);
        const { setPadding } = protectedScrollAPI;
        const [isContentHeightUpdateRequired, setContentHeightUpdateRequired] = useState<Object>({});
        const { headerContentBorder, headerPadding, onContentScroll, onVirtualRowContentScroll, onVirtualColumnContentScroll,
            onHeaderScroll, onFooterScroll, getCssProperties } = privateScrollAPI;
        const { textWrapSettings, pageSettings, aggregates, toolbar, id, columns, dataSource, editSettings, height,
            loadingIndicatorSettings, getColumns, columnChooserSettings, showColumnChooser,
            contextMenuSettings, element, groupSettings, sortSettings } = useGridComputedProvider<T>();
        const  { indicatorType, params } = loadingIndicatorSettings;
        const { columnsDirective, currentViewData, totalRecordsCount, cssClass, toolbarModule, editModule, scrollMode, virtualSettings,
            infiniteScrollState, expandedGroupCountRef, groupModule } = useGridMutableProvider<T>();

        // Column Chooser state management - moved from useGrid
        const [isColumnChooserOpen, setIsColumnChooserOpen] = useState<boolean>(false);
        const [columnChooserPosition, setColumnChooserPosition] = useState<{ x?: number; y?: number } | undefined>(undefined);

        /**
         * Opens the column chooser dialog programmatically.
         * The dialog is automatically appended to the grid's parent element via the Dialog component's target prop.
         *
         * @param {number} x - Optional X coordinate for custom positioning
         * @param {number} y - Optional Y coordinate for custom positioning
         *
         * @example
         * ```tsx
         * // Open at default position (near toolbar button)
         * gridRef.current.openColumnChooser();
         *
         * // Open at custom position
         * gridRef.current.openColumnChooser(100, 200);
         * ```
         */
        const openColumnChooser: (x?: number, y?: number) => void = useCallback((x?: number, y?: number) => {
            if (showColumnChooser === false) {
                return;
            }
            // Set position if provided, otherwise use default positioning logic in ColumnChooserDialog
            setColumnChooserPosition(x !== undefined || y !== undefined ? { x, y } : undefined);
            setIsColumnChooserOpen(true);
        }, [showColumnChooser]);

        /**
         * Closes the column chooser dialog
         */
        const closeColumnChooser: () => void = useCallback(() => {
            setIsColumnChooserOpen(false);
            setColumnChooserPosition(undefined);
        }, []);

        /**
         * Handle before open event for column chooser dialog
         */
        const { onColumnChooserBeforeOpen } = useGridComputedProvider();
        const handleColumnChooserBeforeOpen: (
            event: { cancel: boolean; columnChooserSettings?: ColumnChooserSettings }
        ) => void = useCallback(
            (event: { cancel: boolean; columnChooserSettings?: ColumnChooserSettings }) => {
                if (onColumnChooserBeforeOpen) {
                    const args: ColumnChooserBeforeOpenEvent = {
                        cancel: false,
                        type: ActionType.ColumnChooserBeforeOpen,
                        enableSearch: event.columnChooserSettings?.enableSearch,
                        operator: event.columnChooserSettings?.operator,
                        ignoreAccent: event.columnChooserSettings?.ignoreAccent,
                        sortDirection: event.columnChooserSettings?.sortDirection,
                        selectedColumns: event.columnChooserSettings?.selectedColumns
                    };
                    onColumnChooserBeforeOpen(args);
                    // Propagate cancel flag back to the dialog
                    event.cancel = args.cancel;
                }
            },
            [onColumnChooserBeforeOpen]
        );

        /**
         * Handle apply event for column chooser dialog
         */
        const { onColumnChooserApply } = useGridComputedProvider();
        const handleColumnChooserApply: (
            event: { columnVisibility?: Map<string, boolean>; columnChooserSettings?: ColumnChooserSettings }
        ) => void = useCallback(
            (event: { columnVisibility?: Map<string, boolean>; columnChooserSettings?: ColumnChooserSettings }
            ) => {
                if (onColumnChooserApply) {
                    const args: ColumnChooserApplyEvent = {
                        type: ActionType.ColumnChooserApply,
                        columnVisibility: event.columnVisibility,
                        enableSearch: event.columnChooserSettings?.enableSearch,
                        operator: event.columnChooserSettings?.operator,
                        ignoreAccent: event.columnChooserSettings?.ignoreAccent,
                        sortDirection: event.columnChooserSettings?.sortDirection,
                        selectedColumns: event.columnChooserSettings?.selectedColumns
                    };
                    onColumnChooserApply(args);
                }
            },
            [onColumnChooserApply]
        );

        // Synchronize scroll elements between header and content panels
        useSyncScrollElements(
            headerPanelRef,
            contentPanelRef,
            footerPanelRef,
            setHeaderScrollElement,
            setContentScrollElement,
            setFooterScrollElement,
            setPadding
        );

        const refreshContentUI: () => void = useCallback(() => {
            contentPanelRef.current?.setRequireMoreVirtualRowsForceRefresh?.({});
        }, []);

        // Expose methods and properties through ref
        useImperativeHandle(ref, () => ({
            // Render specific methods
            refresh: protectedRenderAPI.refresh,
            showSpinner: protectedRenderAPI.showSpinner,
            hideSpinner: protectedRenderAPI.hideSpinner,
            scrollModule: protectedScrollAPI,
            openColumnChooser,
            // Forward all properties from header and content panels
            ...(headerPanelRef.current as HeaderPanelRef),
            ...(contentPanelRef.current as ContentPanelRef<T>),
            ...(footerPanelRef.current as FooterPanelRef),
            ...(contextMenuPanelRef.current as ContextMenuPanelRef),
            pagerModule: pagerObjectRef.current,
            ...(editModule.editSettings.mode === 'Popup' && editModule.isEdit ?
                isNullOrUndefined(editModule.originalData) ? { addInlineRowFormRef: popupEditFormRef }
                    : { editInlineRowFormRef: popupEditFormRef } : {}),
            refreshContentUI,
            isContentBusy: privateRenderAPI.isContentBusy
        }), [
            protectedRenderAPI.refresh,
            headerPanelRef.current,
            contentPanelRef.current,
            footerPanelRef.current,
            pagerObjectRef.current,
            popupEditFormRef.current,
            openColumnChooser,
            contextMenuPanelRef.current
        ]);

        const pagerPanel: JSX.Element = useMemo(() => (
            <PagerPanelBase
                ref={pagerObjectRef}
                {...pageSettings}
            />

        ), [totalRecordsCount, pageSettings]);

        const isNoColumnRemoteData: boolean = useMemo(() => {
            return !columns.length && dataSource instanceof DataManager && dataSource.dataSource.url
                && Array.isArray(currentViewData) && currentViewData?.length > 0;
        }, [columns, dataSource, currentViewData]);

        // Memoize header panel to prevent unnecessary re-renders
        const headerPanel: JSX.Element = useMemo(() => {
            return (<HeaderPanelBase
                ref={(panelRef: HeaderPanelRef) => {
                    headerPanelRef.current = panelRef;
                    if (isNoColumnRemoteData) {
                        setContentHeightUpdateRequired({});
                    }
                }}
                panelAttributes={{
                    style: { ...headerPadding },
                    className: CSS_CLASS_NAMES.GRID_HEADER
                }}
                scrollContentAttributes={{
                    style: headerContentBorder,
                    className: CSS_CLASS_NAMES.HEADER_CONTENT,
                    onScroll: onHeaderScroll
                }}
            />
            );
        }, [headerPadding, headerContentBorder, onHeaderScroll, isNoColumnRemoteData]);

        useMemo(() => {
            if (scrollMode === ScrollMode.Infinite && !protectedScrollAPI.isDataOperationPreventVirtualCache.current) {
                return;
            }
            if (contentPanelRef.current?.contentScrollRef && virtualSettings.enableRow && virtualSettings.enableCache) {
                contentPanelRef.current.contentScrollRef.scrollTop = 0;
                protectedScrollAPI.virtualRowInfo.startIndex = 0;
            }
        }, [totalRecordsCount]);
        useMemo(() => {
            protectedScrollAPI.virtualRowInfo.endIndex = (groupSettings.enabled && groupSettings.columns?.length &&
                expandedGroupCountRef.current ? expandedGroupCountRef.current : (scrollMode === ScrollMode.Virtual ||
                    scrollMode === ScrollMode.Infinite ? totalRecordsCount : currentViewData?.length)) ?? 0;
        }, [currentViewData, totalRecordsCount, expandedGroupCountRef.current]);

        // Memoize content panel to prevent unnecessary re-renders
        const contentPanel: JSX.Element = useMemo(() => {
            const groupDropAreaHeight: number = groupModule?.groupDropAreaRef.current?.getBoundingClientRect().height ?? 0;
            const toolbarHeight: number = toolbarModule?.getToolbar()?.getBoundingClientRect().height ?? 0;
            const headerHeight: number = headerPanelRef.current?.headerPanelRef?.getBoundingClientRect().height ?? 0;
            const footerHeight: number = footerPanelRef.current?.footerPanelRef?.getBoundingClientRect().height ?? 0;
            const pagerHeight: number = pagerObjectRef.current?.element?.getBoundingClientRect().height ?? 0;

            const totalHeight: string = `calc(${privateRenderAPI.contentStyles.height} - ${groupDropAreaHeight}px - ${toolbarHeight}px - ${headerHeight + 2}px - ${footerHeight}px - ${pagerHeight}px)`;

            return (<ContentPanelBase<T>
                ref={(panelRef: ContentPanelRef<T>) => {
                    contentPanelRef.current = panelRef;
                    if (privateRenderAPI.isContentBusy && columns.length && panelRef &&
                        panelRef.contentSectionRef.clientHeight < panelRef.contentPanelRef.clientHeight) {
                        refreshContentUI();
                    }
                    if (height !== 'auto' && (panelRef?.contentPanelRef.firstElementChild as HTMLElement)?.offsetHeight >
                        panelRef?.contentTableRef?.scrollHeight) {
                        addLastRowBorder(panelRef?.contentTableRef, editSettings);
                    }
                }}
                setHeaderPadding={setPadding}
                panelAttributes={{
                    className: `${CSS_CLASS_NAMES.GRID_CONTENT} ${textWrapSettings?.enabled &&
                        textWrapSettings?.wrapMode === WrapMode.Content ? 'sf-wrap' : ''}`.trim(),
                    style: {
                        height: totalHeight,
                        position: 'relative' // required inline element styles for responsive UI state update
                    }
                }}
                scrollContentAttributes={{
                    className: CSS_CLASS_NAMES.CONTENT,
                    style: {
                        ...privateRenderAPI.contentStyles,
                        height: '100%' // required inline element styles for responsive UI state update
                    },
                    onScroll: onContentScroll
                }}
                virtualRowScrollContentAttributes={{
                    onScroll: onVirtualRowContentScroll
                }}
                virtualColumnScrollContentAttributes={{
                    onScroll: onVirtualColumnContentScroll
                }}
            />
            );
        }, [setPadding, privateRenderAPI.contentStyles, privateRenderAPI.isContentBusy, onContentScroll, isContentHeightUpdateRequired]);

        const footerPanel: JSX.Element = useMemo(() => {
            if (!columnsDirective || !currentViewData || currentViewData.length === 0) {
                return null;
            }
            const tableScrollerPadding: boolean = headerPadding[`${getCssProperties.padding}`] && headerPadding[`${getCssProperties.padding}`] !== '0px' ? true : false;
            const cssClass: string = `${CSS_CLASS_NAMES.GRID_FOOTER} ${tableScrollerPadding ? CSS_CLASS_NAMES.GRID_FOOTER_PADDING : ''}`;
            return (<FooterPanelBase
                ref={footerPanelRef}
                panelAttributes={{
                    style: headerPadding,
                    className: cssClass.trim()
                }}
                scrollContentAttributes={{
                    className: CSS_CLASS_NAMES.FOOTER_CONTENT,
                    onScroll: onFooterScroll
                }}
                tableScrollerPadding={tableScrollerPadding}
            />);
        }, [headerPadding, getCssProperties, columnsDirective, currentViewData, onFooterScroll]);

        const popupEditPanel: JSX.Element = useMemo(() => {
            if ((editModule.editSettings.mode === 'Popup' || editModule.editSettings.mode === 'PopupTemplate') && editModule.isEdit) {
                return (
                    <PopupEditForm
                        ref={(ref: InlineEditFormRef<Record<string, unknown>>) => {
                            if (ref?.formRef?.current) {
                                popupEditFormRef.current = ref as InlineEditFormRef<T>;
                                editModule.popupEditFormRef.current = ref as InlineEditFormRef<T>;
                            }
                            if (ref && !isNullOrUndefined(editModule.originalData)) {
                                editModule.rowObject.setRowObject((prev: IRow<ColumnProps<T>>) =>
                                    ({ ...prev, editInlineRowFormRef: { current: ref as InlineEditFormRef<T> } }));
                            }
                        }}
                    />
                );
            }
            return null;
        }, [editModule]);

        const contextMenuPanel: JSX.Element = useMemo(() => {
            if (element && contextMenuSettings.enabled) {
                return <ContextMenuPanelBase ref={contextMenuPanelRef} />;
            }
            return null;
        }, [element, contextMenuSettings]);

        useEffect(() => {
            if (!privateRenderAPI.isContentBusy && editModule?.isShowAddNewRowActive && !editModule?.isShowAddNewRowDisabled) {
                contentPanelRef?.current?.addInlineRowFormRef?.current?.focusFirstField();
            }
        }, [privateRenderAPI.isContentBusy]);
        useEffect(() => {
            setContentHeightUpdateRequired({});
        }, [toolbar, groupSettings?.showDropArea]);

        const loadingSpinnerProps: SpinnerProps = indicatorType === LoadingIndicatorType.Spinner ? params : {};
        return (
            <>
                <Spinner visible={privateRenderAPI.isContentBusy && ((!infiniteScrollState?.isVirtualScrollRequest &&
                    scrollMode === ScrollMode.Infinite) || indicatorType === LoadingIndicatorType.Spinner)}
                className={cssClass} overlay={true} {...loadingSpinnerProps} />
                {groupSettings?.enabled && groupSettings?.showDropArea && (
                    <GroupDropArea
                        cssClass={cssClass}
                        groupColumns={groupModule.groupedColumns.map((field: string) =>
                            (getColumns?.()).find((column: ColumnProps) => column.field === field)) || []}
                        onUngroupColumn={groupModule.ungroupColumn}
                        sortDirections={sortSettings?.columns?.reduce(
                            (acc: Record<string, 'Ascending' | 'Descending'>, col: SortDescriptor) => {
                                acc[col.field as string] = col.direction as 'Ascending' | 'Descending';
                                return acc;
                            }, {}
                        ) ?? {}}
                    />
                )}
                {toolbarModule && toolbar?.length > 0 && (
                    <GridToolbar
                        key={id + '_grid_toolbar'}
                        className={cssClass}
                        toolbar={(toolbar as (string | ToolbarItemProps)[]) || []}
                        gridId={id}
                        toolbarAPI={toolbarModule as ToolbarAPI}
                    />
                )}
                {showColumnChooser && (
                    <ColumnChooserDialog
                        isOpen={isColumnChooserOpen}
                        onClose={closeColumnChooser}
                        columns={getColumns?.() || []}
                        position={columnChooserPosition}
                        settings={columnChooserSettings}
                        onBeforeOpen={handleColumnChooserBeforeOpen}
                        onApply={handleColumnChooserApply}
                    />
                )}
                {headerPanel}
                {contentPanel}
                {aggregates?.length ? footerPanel : null}
                {pageSettings?.enabled && pagerPanel}
                {popupEditPanel}
                {contextMenuPanel}
            </>
        );
    })
) as (_props: Partial<IRenderBase> & RefAttributes<RenderRef>) => ReactElement;

/**
 * Columns component that wraps RenderBase for external usage
 *
 * @returns {JSX.Element} Rendered component
 */
export const Columns: React.FC<{ children?: ReactNode }> = (): JSX.Element => {
    return null;
};

export {
    RenderBase
};

(RenderBase as ForwardRefExoticComponent<Partial<IRenderBase> & RefAttributes<RenderRef>>).displayName = 'RenderBase';
