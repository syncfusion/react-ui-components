import {
    CSSProperties,
    ReactElement,
    RefObject,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    MouseEvent,
    FocusEvent,
    Dispatch,
    SetStateAction,
    Children
} from 'react';
import { isNullOrUndefined, formatUnit, getValue, setValue, extend } from '@syncfusion/react-base/src/util';
import { closest, removeClass, createElement } from '@syncfusion/react-base/src/dom';
import { Browser } from '@syncfusion/react-base/src/browser';
import { IL10n, L10n } from '@syncfusion/react-base/src/l10n';
import { preRender } from '@syncfusion/react-base/src/component';
import { useProviderContext } from '@syncfusion/react-base/src/provider';
import { SanitizeHtmlHelper } from '@syncfusion/react-base/src/sanitize-helper';
import { initializeTelemetry } from '@syncfusion/react-base/src/telemetry';
import {
    SCROLL_MODE_OVERRIDE_MESSAGE,
    DISABLE_ROW_DOM_VIRTUALIZATION_MESSAGE,
    AUTO_HEIGHT_OVERRIDE_MESSAGE,
    INFINITE_SCROLL_LOCAL_DATA_MESSAGE,
    AGGREGATE_INFINITE_SCROLL_MESSAGE,
    GROUP_INFINITE_SCROLL_MESSAGE,
    PAGER_WITH_SERVER_VIRTUAL_INFINITE_SCROLL_MESSAGE
} from '../constants/warnings';
import { createServiceLocator } from '../services/service-locator';
import { useValueFormatter } from '../services/value-formatter';
import {
    MutableGridBase,
    IValueFormatter,
    DataRequestEvent,
    IRow,
    DataChangeRequestEvent,
    PendingState,
    ValueType
} from '../types/interfaces';
import {
    GridLine,
    ClipMode,
    SelectionMode,
    Theme,
    ThemeDefaults,
    AutoSelectMode,
    LoadingIndicatorType,
    ActionType,
    GroupType,
    ScrollMode,
    GroupSummaryPosition,
    ResizeMode,
    AutoFitMode,
    ColumnType,
    PageSizeMode
} from '../types/enum';
import { GroupedData, GroupSettings, UseGroupResult } from '../types/grouping.interfaces';
import { ContextMenuSettings, contextMenuModule } from '../types/context.interfaces';
import { UseCommandColumnResult } from '../types/command.interfaces';
import { CellSelectionModel } from '../types/cell-selection.interfaces';
import { selectionModule, SelectionSettings } from '../types/selection.interfaces';
import { SortDescriptor, SortSettings, SortModule } from '../types/sort.interfaces';
import { GridRef, TextWrapSettings, RowInfo, IGrid, IGridBase, RecordDoubleClickEvent, LoadingIndicatorSettings, RowNumberSettings } from '../types/grid.interfaces';
import { filterModule, FilterSettings, FilterPredicates } from '../types/filter.interfaces';
import { editModule, EditSettings } from '../types/edit.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { aggregateModule, AggregateRowProps, AggregatesComponent } from '../types/aggregate.interfaces';
import { CellFocusEvent, FocusedCellInfo, IFocusMatrix, Matrix } from '../types/focus.interfaces';
import { PagerArgsInfo, pagerModule, PageSettings } from '../types/page.interfaces';
import { searchModule, SearchSettings } from '../types/search.interfaces';
import { ToolbarAPI } from '../types/toolbar.interfaces';
import { ServiceLocator, UseDataResult, GridResult, UseAggregateSelectionResult } from '../types/interfaces';
import { Clipboard, ClipboardSettings } from '../types/clipboard.interfaces';
import {
    iterateArrayOrObject,
    setGridTelemetryFeatureList,
    setGridModuleInjectionWarning,
    applyColumnWidthConstraints,
    executeGridAsyncAction,
    dispatchGridCancelBegin,
    clearChildGridLocalStorage
} from '../utils/utils';
import { ITooltip } from '@syncfusion/react-popups/src/tooltip';
import { VirtualSettings, VirtualizationSettings, VirtualDomType, VirtualBufferSettings } from '../types/virtualization.interface';
import { InfiniteScrollState } from '../types/infinite-scroll.interface';
import { DetailRowTemplate, RowCollapseEvent, RowExpandEvent } from '../types/master-detail';
import { columnChooserModule } from '../types/column-chooser.interface';
import { useData } from '../models/useData';
import { useAggregateSelection } from './useAggregateSelection';
import { StagedRowData, UseBatchEditResult } from '../types/batch-edit.interfaces';
import { useCellSelection } from './useCellSelection';
import { useFocusStrategy } from './useFocusStrategy';
import { useColumns } from './useRender';
import { useSort } from './useSort';
import { useSelection } from './useSelection';
import { DataManager, DataUtil, Query, QueryOptions, DataResult, ReturnType as DataReturnType, AdaptorOptions, ODataAdaptor, WebApiAdaptor, CacheAdaptor, WebMethodAdaptor, UrlAdaptor } from '@syncfusion/react-data';
import { ColumnResizeModule, ResizeSettings } from '../types/resize.interfaces';
import { ColumnAutoFitModule } from '../types/auto-fit.interfaces';
import { AutoFill, AutoFillSettings } from '../types/autofill.interfaces';
import { detailGridModule } from '../types/detail-grid.interfaces';
import { ColumnReorderModule, ReorderSettings } from '../types/reorder.interfaces';
import { PinningModuleResult, PinningSettings } from '../types/pinning.interfaces';
import { PinScope } from '../types/enum';
import { useUndoRedo } from './useUndoRedo';
import { UseUndoRedoResult } from '../types/undoredo.interfaces';
import { ITreeDataSettings, ITreeDataResult, TreeGridRow } from '../types/treeData.interfaces';
import { FormulaModuleResult } from '../types/formula.interfaces';

/**
 * Default localization strings for the grid
 */
const defaultLocale: Record<string, string> = {
    noRecordsMessage: 'No records to display',
    filterBarTooltip: '\'s filter bar cell',
    invalidFilterMessage: 'Invalid filter data',
    booleanTrueLabel: 'true',
    booleanFalseLabel: 'false',
    addButtonLabel: 'Add',
    editButtonLabel: 'Edit',
    cancelButtonLabel: 'Cancel',
    printButtonLabel: 'Print',
    pdfButtonLabel: 'PDF Export',
    excelButtonLabel: 'Excel Export',
    selectRowsToEdit: 'Select rows to edit',
    editRecordDetails: 'Edit Record Details',
    columnsToolPanelLabel: 'Columns',
    filtersToolPanelLabel: 'Filters',
    editToolPanelLabel: 'Edit',
    customToolPanelLabel: 'Custom',
    updateButtonLabel: 'Update',
    deleteButtonLabel: 'Delete',
    editRowLabel: 'Edit this row',
    deleteRowLabel: 'Delete this row',
    updateRowLabel: 'Save changes to this row',
    cancelRowLabel: 'Cancel editing this row',
    commandActionsLabel: 'Command actions',
    searchButtonLabel: 'Search',
    unsavedChangesConfirmation: 'Unsaved changes will be lost. Are you sure you want to continue?',
    batchSaveConfirmation: 'Are you sure you want to save changes?',
    batchCancelConfirmation: 'Are you sure you want to cancel the changes?',
    noRecordsEditMessage: 'No records selected for edit operation',
    noRecordsDeleteMessage: 'No records selected for delete operation',
    okButtonLabel: 'OK',
    confirmDeleteMessage: 'Are you sure you want to delete the record?',
    chooseRecordsToDelete: 'Choose records to delete',
    deleteSelectedRecordsOnPage: 'Delete {0} selected record{1} on this page',
    deleteSelectedRecordsOnPageDescription: 'Only removes items currently visible in the grid view',
    deleteAllSelectedRecordsAcrossPages: 'Delete all {0} selected records across pages',
    deleteAllSelectedRecordsAcrossPagesDescription: 'Removes records from the current page along with {0} additional selections from other pages',
    deleteAllSelectedRecordsAcrossPagesDescriptionNoCurrentPage : 'Removes {0} record{1} selected on other pages',
    deleteAllSelectedRecordsFromLoadedPages: 'Delete all {0} selected records from loaded pages',
    deleteAllSelectedRecordsFromLoadedPagesDescription: 'Removes records from the current page along with {0} additional selections from loaded pages',
    deleteAllSelectedRecordsFromLoadedPagesDescriptionNoCurrentPage: 'Removes {0} record{1} from loaded pages',
    selectAllRows: 'Select all rows',
    selectRow: 'Select row',
    startsWith: 'Starts With',
    doesNotStartWith: 'Does Not Start With',
    like: 'Like',
    endsWith: 'Ends With',
    doesNotEndWith: 'Does Not End With',
    contains: 'Contains',
    doesNotContain: 'Does Not Contain',
    isNull: 'Null',
    isNotNull: 'Not Null',
    isEmpty: 'Empty',
    isNotEmpty: 'Not Empty',
    equal: 'Equal',
    notEqual: 'Not Equal',
    lessThan: 'Less Than',
    lessThanOrEqual: 'Less Than Or Equal',
    greaterThan: 'Greater Than',
    greaterThanOrEqual: 'Greater Than Or Equal',
    in: 'In',
    notIn: 'Not In',
    saveButtonLabel: 'Save',
    addNewRecordLabel: 'Add New Record',
    detailsOfLabel: 'Details of',
    recordFormLabel: 'Record Form',
    columnHeaderLabel: 'Column header',
    selectAll: 'Select All',
    noMatches: 'No matches found',
    chooseColumns: 'Choose Column',
    noResult: 'No matches found',
    clearFilter: 'Clear Filter',
    clear: 'Clear',
    sortAtoZ: 'Sort A to Z',
    sortZtoA: 'Sort Z to A',
    sortByOldest: 'Sort by Oldest',
    sortByNewest: 'Sort by Newest',
    sortSmallestToLargest: 'Sort Smallest to Largest',
    sortLargestToSmallest: 'Sort Largest to Smallest',
    addCurrentSelection: 'Add current selection to filter',
    blanks: 'Blanks',
    oKButton: 'OK',
    cancelButton: 'Cancel',
    primary: 'Default',
    advanced: 'Advanced',
    enterValue: 'Enter value',
    and: 'AND',
    or: 'OR',
    filterTrue: 'True',
    filterFalse: 'False',
    editRecordLabel: 'Edit Record',
    deleteRecordLabel: 'Delete Record',
    firstPageLabel: 'First Page',
    prevPageLabel: 'Previous Page',
    lastPageLabel: 'Last Page',
    nextPageLabel: 'Next Page',
    sortAscendingLabel: 'Sort Ascending',
    sortDescendingLabel: 'Sort Descending',
    clearSortLabel: 'Clear sort',
    clearSelectionLabel: 'Clear selection',
    selectRowLabel: 'Select row',
    clearRowSelectionLabel: 'Clear row selection',
    selectLabel: 'Select',
    sumLabel: 'Sum',
    averageLabel: 'Average',
    minLabel: 'Min',
    maxLabel: 'Max',
    countLabel: 'Count',
    trueCountLabel: 'True Count',
    falseCountLabel: 'False Count',
    customLabel: 'Custom',
    expandAllGroups: 'Expand all groups',
    collapseAllGroups: 'Collapse all groups',
    columnChooser: 'Columns',
    pinColumnLabel: 'Pin Column',
    pinToLeftLabel: 'Pin to Left',
    pinToRightLabel: 'Pin to Right',
    unpinColumnLabel: 'Unpin Column',
    pinRowLabel: 'Pin Row',
    unpinRowLabel: 'Unpin Row',
    pinToTopLabel: 'Pin to Top',
    pinToBottomLabel: 'Pin to Bottom',
    checkBox: 'Check Box',
    expanded: 'Expanded',
    collapsed: 'Collapsed',
    singleColumnGroupLabel: 'Group',
    singleColumnUnGroupLabel: 'UnGroup',
    groupDropAreaLabel: 'Group drop area',
    groupDropAreaHintText: 'Drag a column header here to group its column',
    groupDropAreaTitle: 'Row Groups',
    aggregateDropAreaLabel: 'Aggregate drop area',
    aggregateDropAreaTitle: 'Values',
    columnChooserGroupDropAreaHintText: 'Drag here to group its column',
    columnChooserAggregateDropAreaHintText: 'Drag here to aggregate',
    filterLabel: 'Filter',
    aggregateLabel: 'Aggregate',
    chartLabel: 'Chart',
    barChartLabel: 'Bar Chart',
    barLabel: 'Bar',
    stackingBarLabel: 'Stacked Bar',
    stackingBar100Label: 'Stacked Bar 100%',
    pieLabel: 'Pie Chart',
    columnChartLabel: 'Column Chart',
    columnLabel: 'Column',
    stackingColumnLabel: 'Stacked Column',
    stackingColumn100Label: 'Stacked Column 100%',
    lineChartLabel: 'Line Chart',
    lineLabel: 'Line',
    stackingLineLabel: 'Stacked Line',
    stackingLine100Label: 'Stacked Line 100%',
    areaChartLabel: 'Area Chart',
    areaLabel: 'Area',
    stackingAreaLabel: 'Stacked Area',
    stackingArea100Label: 'Stacked Area 100%',
    scatterLabel: 'Scatter Chart'
};

/**
 * CSS class names used in the Grid component
 */
const CSS_CLASS_NAMES: Record<string, string> = {
    CONTROL: 'sf-control',
    GRID: 'sf-grid',
    RTL: 'sf-rtl',
    GRID_SPAN: 'sf-spanned-grid',
    GRID_HOVER: 'sf-row-hover',
    MAC_SAFARI: 'sf-mac-safari',
    MIN_HEIGHT: 'sf-row-min-height',
    HIDE_LINES: 'sf-hide-lines',
    STACKED_HEADER: 'sf-stacked-header-grid'
};

const KEY_CODES: Record<string, number> = {
    ALT_J: 74,
    ALT_W: 87,
    ENTER: 13,
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39
};

/**
 * Custom hook to manage grid state and configuration
 *
 * @private
 * @param {Partial<IGridBase>} props - Grid component properties
 * @param {RefObject<GridRef>} gridRef - Reference object for rendering interactions
 * @param {RefObject<ITooltip>} ellipsisTooltipRef - Tooltip reference
 * @returns {GridResult} An object containing various grid-related state and API
 */
export const useGridComputedProps: <T, >(props: Partial<IGridBase<T>>, gridRef?: RefObject<GridRef<T>>,
    ellipsisTooltipRef?: RefObject<ITooltip>) => GridResult<T> = <T, >(
    props: Partial<IGridBase<T>>,
    gridRef?: RefObject<GridRef<T>>,
    ellipsisTooltipRef?: RefObject<ITooltip>
): GridResult<T> => {
    const baseProvider: {
        locale: string;
        dir: string;
        ripple: boolean;
    } = useProviderContext();
    const enableDevMode: boolean = useMemo(() => props.enableDevMode ?? true, [props.enableDevMode]);

    const locale: string = useMemo(() =>
        props.locale || baseProvider.locale, [props.locale, baseProvider.locale]);
    const localeObj: IL10n = useMemo(() => {
        const l10n: IL10n = L10n('grid', defaultLocale, locale);
        l10n.setLocale(locale);
        return l10n;
    }, [locale]);
    const valueFormatterService: IValueFormatter = useValueFormatter(locale);
    const serviceLocator: ServiceLocator = useMemo(() => {
        const locator: ServiceLocator = createServiceLocator();
        locator.register('localization', localeObj);
        locator.register('valueFormatter', valueFormatterService);
        return locator;
    }, [localeObj, valueFormatterService]);
    const dataState: RefObject<PendingState> = useRef({isPending: false, resolver: undefined, isEdit: false});
    const dataSource: DataManager | DataResult = useMemo(() => {
        if (props.dataSource instanceof DataManager) {
            window.localStorage.removeItem((gridRef?.current?.getDataModule() as {dataManager: {guidId: string}})?.dataManager?.guidId);
            if (props.virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
                props.virtualizationSettings?.scrollMode === ScrollMode.Infinite) {
                return new DataManager({
                    ...props.dataSource.dataSource,
                    enableCache: props.groupSettings?.enabled && props.groupSettings?.columns?.length ? false :
                        (props.virtualizationSettings?.enableCache ?? true)
                }, props.dataSource.defaultQuery, props.dataSource.adaptor);
            }
            return props.dataSource;
        }
        else if (Array.isArray(props.dataSource)) {
            return new DataManager({
                json: props.dataSource
            });
        }
        else if (props.dataSource && props.dataSource.result) {
            dataState.current.isPending = true;
            return props.dataSource;
        }
        return new DataManager([]);
    }, [props.dataSource, props.virtualizationSettings?.enableCache, props.virtualizationSettings?.scrollMode]);

    const query: Query = useMemo(() => props.query instanceof Query ? props.query : new Query(), [props.query]);
    // Trigger load event on initial render
    useMemo(() => {
        if (props.onGridRenderStart) {
            props.onGridRenderStart();
        }
    }, []);
    // const [isContentBusy, setIsContentBusy] = useState<boolean>(true);
    const [isInitialLoad, setInitialLoad] = useState(true);
    const isInitialBeforePaint: RefObject<boolean> = useRef(true);
    const tooltipContent: RefObject<string> = useRef('');
    const resizeHandlePointerDownTimeout: RefObject<NodeJS.Timeout | null> = useRef(null);
    const childArray: ReactElement[] = Array.isArray(props.children)
        ? props.children as ReactElement[]
        : Children.toArray(props.children) as ReactElement[];
    const directiveAggregates: ReactElement | undefined = childArray.find((child: ReactElement) => {
        return child && !!(child.type as AggregatesComponent)?.AggregateModule;
    });
    const aggregateModule: aggregateModule = (props?.modules?.GridAllModules ?? props?.modules ??
        (directiveAggregates?.type as AggregatesComponent))?.AggregateModule?.<T>(props, gridRef, directiveAggregates);
    const aggregates: AggregateRowProps[] = useMemo(() => aggregateModule?.aggregates ?? [], [aggregateModule?.aggregates]);

    // Update the `currentPage` state value with the `pageSettings` changes
    useEffect(() => {
        if (props.pageSettings?.currentPage && currentPage !== props.pageSettings?.currentPage) {
            gridRef.current.goToPage?.(props.pageSettings?.currentPage);
        }
    }, [props.pageSettings]);
    const [currentPage, setCurrentPage] = useState<number>(props.pageSettings?.currentPage || 1);
    const [currentViewData, setCurrentViewData] = useState<T[]>([]);

    const [totalRecordsCount, setTotalRecordsCount] = useState<number>(props.pageSettings?.estimatedTotalRecordsCount || 0);
    // Initialize tree data settings based on props or use default values

    const isRemoteData: (props:  Partial<IGridBase<T>>) => boolean = useCallback((props:  Partial<IGridBase<T>>) => {
        if (props.dataSource instanceof DataManager) {
            const adaptor: AdaptorOptions = props.dataSource.adaptor;
            return (adaptor instanceof ODataAdaptor ||
                (adaptor instanceof WebApiAdaptor) || (adaptor instanceof WebMethodAdaptor) ||
                (adaptor instanceof CacheAdaptor) || adaptor instanceof UrlAdaptor);
        }
        return false;
    }, []);
    const isOffline: boolean = useMemo(() => {
        if (isRemoteData(props)) {
            const dm: DataManager = props.dataSource as DataManager;
            return !isNullOrUndefined(dm.ready) && props.dataSource instanceof DataManager;
        }
        return true && props.dataSource instanceof DataManager;
    }, []);

    const isTreeMode: boolean = useMemo(() =>
        props.isTreeMode || false, [props.isTreeMode]);

    const treeColumnIndex: number = useMemo(() =>
        props.treeColumnIndex ?? 0, [props.treeColumnIndex]);

    const treeDataChildrenField: string | undefined = useMemo(() =>
        props.treeDataChildrenField || null, [props.treeDataChildrenField]);

    const treeDataIdMapping: string | undefined = useMemo(() =>
        props.treeDataIdMapping || null, [props.treeDataIdMapping]);

    const treeDataParentIdField: string | undefined = useMemo(() =>
        props.treeDataParentIdField || null, [props.treeDataParentIdField]);

    const excludeChildrenWithFiltering: boolean = useMemo(() =>
        props.excludeChildrenWithFiltering ?? false, [props.excludeChildrenWithFiltering]);

    const isChildrenGrid: boolean = useMemo(() =>
        props.isChildrenGrid ?? false, [props.isChildrenGrid]);

    /**
     * Construct treeDataSettings object from individual props for internal use
     */
    const treeDataSettings: ITreeDataSettings = useMemo(() => ({
        enabled: isTreeMode,
        treeColumnIndex: treeColumnIndex,
        treeDataChildrenField: treeDataChildrenField,
        treeDataIdMapping: treeDataIdMapping,
        treeDataParentIdField: treeDataParentIdField,
        excludeChildrenWithFiltering: excludeChildrenWithFiltering
    }), [isTreeMode, treeColumnIndex, treeDataChildrenField, treeDataIdMapping, treeDataParentIdField, excludeChildrenWithFiltering]);

    const [pageWiseGroupResponseViewData, setPageWiseGroupResponseViewData] = useState<Map<number, GroupedData<T>[]>>(new Map());
    const [virtualCachedViewData, setVirtualCachedViewData] = useState<Map<number, T>>(new Map());

    const uiColumns: RefObject<ColumnProps<T>[]> = useRef([]);
    const { columns: preparedColumns, children, headerRowDepth, colElements, uiColumns: noTypeUiColumns, isCheckBoxColumn,
        totalVirtualColumnWidth, columnOffsets, visibleColumns, stackedHeaderColumns, stackedFlattedColumns, isStackedHeader,
        isCommandEditEnabled, setColumnChooserState, reorderState,
        isAutoHeightEnabled, isSpannedColumns, singleGroupColumn, groupCaptionAggregateType, visibleStackedHeaderColumns,
        allStackedColumnProps, stackedFlattedColumnProps, stackedRowEntries, fieldOrderMap, uidOrderMap, columnMap,
        columnUidMap, leftPinnedColumns, rightPinnedColumns, columnWidthInfo, setColumnWidthState,
        setColumnReorderState } = useColumns<T>({
        ...props }, serviceLocator, gridRef, dataState, isInitialBeforePaint,
                                                currentViewData, uiColumns.current);
    useMemo(() => {
        uiColumns.current = noTypeUiColumns;
    }, [noTypeUiColumns]);
    // Initialize search settings based on props or use default values
    const defaultSearchSettings: SearchSettings = {
        enabled: props.searchSettings?.enabled || false,
        fields: props.searchSettings?.fields || [],
        value: props.searchSettings?.value || '',
        operator: props.searchSettings?.operator  || 'contains',
        caseSensitive: props.searchSettings?.caseSensitive ?? true,
        ignoreAccent: props.searchSettings?.ignoreAccent || false
    };

    const searchSettings: SearchSettings = useMemo(() =>
        defaultSearchSettings, [props.searchSettings]);

    // Initialize filter settings based on props or use default values
    const defaultFilterSettings: FilterSettings = {
        enabled: props.filterSettings?.enabled || false,
        enableFilterBarOperator: props.filterSettings?.enableFilterBarOperator || false,
        columns: props.filterSettings?.columns || [],
        type: props.filterSettings?.type || 'FilterBar',
        mode: props.filterSettings?.mode ?? (props.filterSettings?.type === 'Excel' || props.filterSettings?.type === 'CheckBox'
            || props.filterSettings?.type === 'Menu' ? 'OnEnter' : 'Immediate'),
        loadingIndicator: props.filterSettings?.loadingIndicator || 'Shimmer',
        immediateModeDelay: props.filterSettings?.immediateModeDelay || 1500,
        ignoreAccent: props.filterSettings?.ignoreAccent || false,
        operators: props.filterSettings?.operators || null,
        caseSensitive: props.filterSettings?.caseSensitive || false
    };

    const filterSettings: FilterSettings = useMemo(() => {
        if (!props.filterSettings?.enabled) {
            defaultFilterSettings.columns = [];
        }
        return defaultFilterSettings;
    }, [props.filterSettings?.enabled, props.filterSettings]);

    const contextMenuSettings: ContextMenuSettings = useMemo(() => {
        return {
            enabled: false,
            items: [],
            menuSettings: {},
            ...(props.contextMenuSettings ? props.contextMenuSettings : {})
        };
    }, [props.contextMenuSettings]);

    const clipboardSettings: ClipboardSettings = useMemo(() => {
        return {
            enabled: true,
            allowPaste: true,
            allowCut: true,
            copyWithHeaders: false,
            allowRowCopy: false,
            ...(props.clipboardSettings || {})
        };
    }, [props.clipboardSettings]);

    const autoFillSettings: AutoFillSettings = useMemo(() => {
        return {
            enabled: props.autoFillSettings?.enabled || false,
            allowedDirection: props.autoFillSettings?.allowedDirection || 'both',
            preventBackwardFill: props.autoFillSettings?.preventBackwardFill || false,
            fillOperation: props.autoFillSettings?.fillOperation,
            excludeFromAutoFill: props.autoFillSettings?.excludeFromAutoFill || undefined
        };
    }, [props.autoFillSettings]);

    const editSettings: EditSettings<T> = useMemo(() => {
        return {
            allowAdd: props?.editSettings?.allowAdd || ((props?.modules?.GridAllModules || props?.modules?.ClipboardModule ||
                props?.modules?.AutoFillModule) && clipboardSettings?.enabled && clipboardSettings?.allowPaste) || false,
            allowEdit: props?.editSettings?.allowEdit || ((props?.modules?.GridAllModules || props?.modules?.ClipboardModule) &&
            clipboardSettings?.enabled && clipboardSettings?.allowPaste) || ((props?.modules?.GridAllModules ||
                props?.modules?.AutoFillModule) && autoFillSettings?.enabled) || false,
            allowDelete: props?.editSettings?.allowDelete || ((props?.modules?.GridAllModules || props?.modules?.ClipboardModule) &&
            clipboardSettings?.enabled && clipboardSettings?.allowCut) || ((props?.modules?.GridAllModules ||
                props?.modules?.AutoFillModule) && autoFillSettings?.enabled) || false,
            ...(props?.editSettings as EditSettings<T>)
        };
    }, [props?.editSettings, props?.modules?.ClipboardModule, clipboardSettings?.enabled, clipboardSettings?.allowPaste,
        clipboardSettings?.allowCut, autoFillSettings?.enabled, props?.modules?.AutoFillModule]);

    // Initialize group settings based on props or use default values
    const groupSettings: GroupSettings = useMemo(() => {
        return {
            enabled: props.groupSettings?.enabled || false,
            columns: props.groupSettings?.columns || [],
            type: props.groupSettings?.type || GroupType.GroupRows,
            autoSort: props.groupSettings?.autoSort ?? true,
            allowReorder: props.groupSettings?.allowReorder || false,
            defaultExpanded: props.groupSettings?.defaultExpanded ?? false,
            captionFormat: props.groupSettings?.captionFormat || 'compact',
            showDropArea: props.groupSettings?.showDropArea || false,
            // showGroupedColumn: props.groupSettings?.showGroupedColumn || false,
            // showUngroupButton: props.groupSettings?.showUngroupButton !== false,
            autoRefreshOnEdit: props.groupSettings?.autoRefreshOnEdit || true,
            groupSummaryPosition: props.groupSettings?.groupSummaryPosition ?? (() => GroupSummaryPosition.Undefined)
        };
    }, [props.groupSettings, props.groupSettings?.columns, props.groupSettings?.groupSummaryPosition]);

    // Unified pinning settings cover rows + columns.
    const pinningSettings: PinningSettings = useMemo(() => ({
        enabled: props.pinningSettings?.enabled ?? false,
        type: props.pinningSettings?.type ?? PinScope.Row,
        allowTopPin: props.pinningSettings?.allowTopPin ?? true,
        allowBottomPin: props.pinningSettings?.allowBottomPin ?? true
    }), [props.pinningSettings]);

    const [gridAction, setGridAction] = useState<Object>({});


    const expandedGroupCountRef: RefObject<number> = useRef(0);
    const loadedPageWiseGroupExpandedCountRef: RefObject<Map<number, number>> = useRef(new Map());
    const loadedPageWiseVirtualGroupStartEndRowIndexes: RefObject<Map<number, {startIndex: number, endIndex: number}>> = useRef(new Map());
    // Update the `currentPage` state value with the `pageSettings.enabled` changes
    useEffect(() => {
        if (!props.pageSettings?.enabled && currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [props.pageSettings?.enabled]);

    const theme: Theme = useMemo(() => {
        return props.theme || Theme.Material;
    }, [props.theme]);
    const height: string | number = useMemo(() =>
        props.height || 'auto', [props.height]);
    const width: string | number = useMemo(() =>
        props.width || 'auto', [props.width]);

    const resizeSettings: ResizeSettings = useMemo((): ResizeSettings => {
        return {
            enabled: props.resizeSettings?.enabled ?? false,
            mode: props.resizeSettings?.mode ?? ResizeMode.Auto,
            throttle: props.resizeSettings?.throttle ?? 150,
            resizeKeyboardStep: props.resizeSettings?.resizeKeyboardStep ?? 10,
            ...props.resizeSettings
        };
    }, [props.resizeSettings]);

    const virtualizationSettings: VirtualizationSettings = useMemo(() => {
        const defaultViewPortBuffer: VirtualBufferSettings = {
            rows: (((isNullOrUndefined(props.virtualizationSettings?.enabled) || props.virtualizationSettings?.enabled) &&
                props.virtualizationSettings?.type === VirtualDomType.Column) || props.virtualizationSettings?.enabled === false) &&
                !props.virtualizationSettings?.preventMaxRenderedRows ? 500 : 5,
            columns: 5
        };
        const finalViewPortBuffer: VirtualBufferSettings = { // user provided partial object values maintained with default values.
            rows: props.virtualizationSettings?.viewPortBuffer?.rows ?? defaultViewPortBuffer.rows,
            columns: props.virtualizationSettings?.viewPortBuffer?.columns ?? defaultViewPortBuffer.columns
        };

        // const groupWithVirtualCacheOverrideMessage: string = [
        //     'Syncfusion Pure React Data Grid:',
        //     '- Caching is temporarily not compatible with grouped data in Virtual (Known Count) ScrollMode.',
        //     '- Detected incompatible configuration with grouped data and Virtual ScrollMode.',
        //     '- Overriding enableCache to false to prevent potential data inconsistencies.'
        // ].join('\n');

        return {
            enabled: true,
            type: VirtualDomType.Both,
            scrollMode: ScrollMode.Auto,
            enableCache: true,
            preventMaxRenderedRows: false,
            throttleTime: 150,
            ...props.virtualizationSettings,
            viewPortBuffer: finalViewPortBuffer,
            ...((props.virtualizationSettings?.scrollMode === ScrollMode.Virtual || props.virtualizationSettings?.scrollMode ===
                ScrollMode.Infinite) && (Array.isArray(props.dataSource)) ? (() => {
                    if (enableDevMode) {
                        console.warn(SCROLL_MODE_OVERRIDE_MESSAGE);
                    }
                    return { scrollMode: ScrollMode.Auto };
                })() : {}), // Virtual/Infinite scroll not possible/compatible with array data source, so override scrollMode to Auto.
            ...((props.virtualizationSettings?.scrollMode === ScrollMode.Virtual || props.virtualizationSettings?.scrollMode ===
                ScrollMode.Infinite) && props.virtualizationSettings?.type === VirtualDomType.Column ? (() => {
                    if (enableDevMode) {
                        console.warn(DISABLE_ROW_DOM_VIRTUALIZATION_MESSAGE);
                    }
                    return { type: VirtualDomType.Both };
                })() : {}), // Virtual Scroll not possible/compatible without row dom virtualization.
            ...(height === 'auto' ? (() => {
                if (enableDevMode) {
                    console.warn(AUTO_HEIGHT_OVERRIDE_MESSAGE);
                }
                return { type: VirtualDomType.Column, ...(!props.virtualizationSettings?.preventMaxRenderedRows ?
                    { viewPortBuffer: { ...finalViewPortBuffer, rows: props.virtualizationSettings?.viewPortBuffer?.rows ?? 500 } } : {}) };
            })() : {}), // Auto height row dom virtualization layout not possible/compatible.
            ...(groupSettings?.enabled && (isNullOrUndefined(props.virtualizationSettings?.enableCache) ||
                props.virtualizationSettings?.enableCache) && groupSettings?.columns?.length ? (() => {
                    // console.warn(groupWithVirtualCacheOverrideMessage);
                    return { enableCache: false };
                })() : {}) // Caching temporarily not possible/compatible with grouped data in Virtual scroll mode.
        };
    }, [props.virtualizationSettings, height, dataSource, groupSettings]);
    const scrollMode: ScrollMode = useMemo(() => {
        return virtualizationSettings.scrollMode;
    }, [virtualizationSettings]);

    const virtualSettings: VirtualSettings = useMemo(() => {
        return {
            enableRow: virtualizationSettings.enabled && virtualizationSettings.type !== VirtualDomType.Column,
            enableColumn: isAutoHeightEnabled || props.isMasterDetail ? false : (virtualizationSettings.enabled &&
                virtualizationSettings.type !== VirtualDomType.Row),
            rowBuffer: virtualizationSettings.viewPortBuffer.rows,
            columnBuffer: virtualizationSettings.viewPortBuffer.columns,
            preventMaxRenderedRows: virtualizationSettings.preventMaxRenderedRows,
            enableCache: virtualizationSettings.enableCache,
            throttleTime: virtualizationSettings.throttleTime
        };
    }, [virtualizationSettings]);

    const groupModule: UseGroupResult<T> = (props?.modules?.GridAllModules ?? props?.modules)?.GroupModule?.<T>(
        gridRef,
        groupSettings,
        setGridAction,
        setCurrentViewData as Dispatch<SetStateAction<(GroupedData<T> | T)[]>>,
        currentViewData,
        setVirtualCachedViewData,
        virtualizationSettings,
        loadedPageWiseGroupExpandedCountRef,
        loadedPageWiseVirtualGroupStartEndRowIndexes,
        pageWiseGroupResponseViewData,
        totalRecordsCount,
        props,
        setCurrentPage,
        uiColumns,
        setColumnChooserState,
        groupSettings?.groupSummaryPosition,
        groupCaptionAggregateType
    );

    // Validate that both tree and group modes are not enabled simultaneously
    if (treeDataSettings.enabled && groupSettings.enabled) {
        console.warn(
            '[TreeGrid] Cannot enable both tree and group modes. Tree takes priority. ' +
            'Set groupSettings.enabled = false to use tree data.'
        );
    }

    const sortSettings: SortSettings = useMemo(() => {
        const combinedSortColumn: SortDescriptor[] = [];
        if (groupModule?.groupSettings.enabled && groupModule?.groupSettings?.columns?.length && groupModule?.groupSettings.autoSort) {
            for (let groupFieldIndex: number = 0; groupFieldIndex < groupModule?.groupSettings.columns?.length; groupFieldIndex++) {
                const field: string = groupModule?.groupSettings.columns[parseInt(groupFieldIndex.toString(), 10)];
                combinedSortColumn.push({
                    field,
                    direction: props.sortSettings?.columns?.find((column: SortDescriptor) => column.field === field)?.direction ??
                        'Ascending'
                });
            }
        }
        if (props.sortSettings?.columns) {
            if (props?.sortSettings?.enabled) {
                for (let i: number = 0; i < props.sortSettings?.columns?.length; i++) {
                    if (!groupModule?.groupSettings?.enabled ||
                        !groupModule?.groupSettings.columns.includes(props.sortSettings?.columns[parseInt(i.toString(), 10)].field)) {
                        combinedSortColumn.push(props.sortSettings?.columns[parseInt(i.toString(), 10)]);
                    }
                }
            }
        }
        // Initialize sort settings based on props or use default values
        const defaultSortSettings: SortSettings = {
            enabled: props.sortSettings?.enabled || false,
            mode: props?.sortSettings?.mode !== 'Single' || isNullOrUndefined(props?.sortSettings?.mode) ? 'Multiple' : 'Single',
            columns: combinedSortColumn || [],
            allowUnsort: props.sortSettings?.allowUnsort !== false
        };
        return defaultSortSettings;
    }, [
        props?.sortSettings?.enabled,
        props?.sortSettings?.mode,
        props.sortSettings
    ]);

    const rowHeight: number | null = useMemo(
        () => props.rowHeight || (virtualSettings.enableRow || isCommandEditEnabled
            ? ThemeDefaults[theme as Theme].rowHeight
            : null),
        [props.rowHeight, theme, virtualSettings]
    );
    const getRowHeight: ((props: Partial<RowInfo<T>>) => number) = useMemo(() => props.getRowHeight ?? null, [props.getRowHeight]);
    const [offsetX, setOffsetX] = useState<number>(0);
    const [offsetY, setOffsetY] = useState<number>(0);
    const loadingIndicatorSettings: LoadingIndicatorSettings = useMemo(() => {
        return { indicatorType: props.loadingIndicatorSettings?.indicatorType ? props.loadingIndicatorSettings?.indicatorType :
            (scrollMode === ScrollMode.Auto ? LoadingIndicatorType.Spinner : LoadingIndicatorType.Shimmer),
        ...props.loadingIndicatorSettings };
    }, [props.loadingIndicatorSettings?.indicatorType, scrollMode]);

    const virtualChangeDetectedPageSize: number = useMemo(() => {
        return props.pageSettings?.pageSize || (
            (props.virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
             props.virtualizationSettings?.scrollMode === ScrollMode.Infinite) ? 50 :
                (!props.pageSettings?.enabled && virtualSettings.enableRow ? currentViewData?.length : 12)
        );
    }, [props.pageSettings, props.virtualizationSettings?.scrollMode, virtualSettings.enableRow, currentViewData?.length]);

    const [infiniteScrollState, setInfiniteScrollState] = useState<InfiniteScrollState>({
        isInfiniteEndReached: false,
        serverPageSize: undefined,
        nextContinuationToken: null,
        isVirtualScrollRequest: props.pageSettings?.estimatedTotalRecordsCount ? true : false
    });
    // Initialize page settings based on props or use default values
    const defaultPageSettings: PageSettings = {
        enabled: props.pageSettings?.enabled || false,
        pageSize: infiniteScrollState.serverPageSize ?? virtualChangeDetectedPageSize,
        pageSizeControlledBy: props.pageSettings?.pageSizeControlledBy ?? (virtualizationSettings.scrollMode === ScrollMode.Infinite ?
            'server' : 'client'),
        pageCount: props.pageSettings?.pageCount || 0,
        currentPage: currentPage,
        template: props.pageSettings?.template || null,
        totalRecordsCount: totalRecordsCount,
        estimatedTotalRecordsCount: props.pageSettings?.estimatedTotalRecordsCount || 0,
        pageSizeMode: props.pageSettings?.pageSizeMode || PageSizeMode.All
    };
    const stableRest: RefObject<Partial<IGridBase<T>>> = useRef(props);
    const generatedId: string = useId().replace(/:/g, '');
    const id: string = useMemo(() => props.id || `grid_${generatedId}`, [props.id, generatedId]);

    const columns: ColumnProps<T>[] = useMemo(() =>
        preparedColumns as ColumnProps<T>[], [preparedColumns]);

    const clipMode: ClipMode | string = useMemo(() => {
        return props.clipMode;
    }, [props.clipMode]);

    const enableGridChart: boolean = useMemo(() => {
        return props.enableGridChart ?? false;
    }, [props.enableGridChart]);

    const gridLines: GridLine | string = useMemo(() =>
        props.gridLines || 'Default', [props.gridLines]);
    const enableRtl: boolean = useMemo(() =>
        (props.enableRtl ?? baseProvider.dir === 'rtl') || false, [props.enableRtl, baseProvider.dir]);
    const enableHover: boolean = useMemo(() =>
        props.enableHover !== false, [props.enableHover]);
    const allowKeyboard: boolean = useMemo(() =>
        props.allowKeyboard !== false, [props.allowKeyboard]);
    const selectionSettings: SelectionSettings = useMemo(() => {
        const selectionType: string = props.selectionSettings?.type || 'Row';
        return {
            enabled: true,
            mode: selectionType === 'Cell' || isCheckBoxColumn ? SelectionMode.Multiple : SelectionMode.Single,
            type: selectionType,
            enableToggle: isCheckBoxColumn,
            headerCheckbox: true,
            persistSelection: isCheckBoxColumn || props.dragAndDropSettings?.enabled === true,
            autoSelectMode: isCheckBoxColumn ? AutoSelectMode.Default : AutoSelectMode.Intermediate,
            // cellSelectionType: CellSelectionType.BoxWithBorder,
            ...(props.selectionSettings || {})
        };
    }, [columns, props.selectionSettings, isCheckBoxColumn]);
    const pageSettings: PageSettings = useMemo(() =>
        defaultPageSettings, [props.pageSettings, infiniteScrollState.serverPageSize]);
    const textWrapSettings: TextWrapSettings = useMemo(() => {
        if (gridRef.current?.textWrapSettings?.wrapMode === props.textWrapSettings?.wrapMode) {
            return gridRef.current?.textWrapSettings;
        }
        return {... { wrapMode: 'Both' }, ...(props.textWrapSettings || {})};
    }, [props.textWrapSettings]);
    const enableHtmlSanitizer: boolean = useMemo(() =>
        props.enableHtmlSanitizer || false, [props.enableHtmlSanitizer]);
    const enableStickyHeader: boolean = useMemo(() =>
        props.enableStickyHeader || false, [props.enableStickyHeader]);

    const enableAltRow: boolean = useMemo(() =>
        props.enableAltRow ?? true, [props.enableAltRow]);
    const rowNumberSettings: RowNumberSettings = useMemo(() => ({
        enabled: props.rowNumberSettings?.enabled ?? false,
        ...props.rowNumberSettings
    }), [props.rowNumberSettings]);
    const emptyRecordTemplate: string | Function | ReactElement = useMemo(() =>
        props.emptyRecordTemplate || null, [props.emptyRecordTemplate]);
    const rowTemplate: string | Function | ReactElement = useMemo(() =>
        props.rowTemplate || null, [props.rowTemplate]);

    const detailRowTemplate: DetailRowTemplate<T> | ReactElement | string = useMemo(() =>
        props.detailRowTemplate || null, [props.detailRowTemplate]);
    const detailGridModule: detailGridModule = (props?.modules?.GridAllModules ?? props?.modules)?.DetailGridModule?.();
    const isMasterDetail: boolean = useMemo(() =>
        Boolean(props.isMasterDetail && detailGridModule), [props.isMasterDetail, detailGridModule]);
    const detailRowHeight: number = useMemo(() =>
        props.detailRowHeight || 300, [props.detailRowHeight]);
    const defaultExpandedRows: number[] = useMemo(() =>
        props.defaultExpandedRows || [], [props.defaultExpandedRows]);

    const resizeModule: ColumnResizeModule = (props?.modules?.GridAllModules ?? props?.modules)?.ResizeModule?.(
        gridRef,
        resizeSettings,
        columns,
        props.onColumnResizeStart,
        props.onColumnResize,
        props.onColumnResizeEnd,
        enableRtl,
        uiColumns.current,
        columnWidthInfo,
        setColumnWidthState,
        ellipsisTooltipRef
    );

    const autoFit: AutoFitMode = useMemo(() => {
        return props.autoFit;
    }, [props.autoFit]);

    const autoFitModule: ColumnAutoFitModule = (props?.modules?.GridAllModules ?? props?.modules)?.AutoFitModule?.(
        gridRef,
        autoFit,
        columns,
        props.onColumnResizeStart,
        props.onColumnResizeEnd,
        uiColumns.current,
        columnWidthInfo,
        setColumnWidthState
    );

    const reorderSettings: ReorderSettings = useMemo(() => ({
        enabled: props.reorderSettings?.enabled ?? false
    }), [props.reorderSettings]);

    const reorderModule: ColumnReorderModule<T> = (props?.modules?.GridAllModules ?? props?.modules)?.ReorderModule?.({
        gridRef,
        reorderSettings,
        columns,
        uiColumns,
        onColumnReorderStart: props.onColumnReorderStart,
        onColumnDrag: props.onColumnDrag,
        onColumnReorderEnd: props.onColumnReorderEnd,
        setColumnReorderState,
        rtl: enableRtl,
        reorderState,
        isStackedHeader,
        stackedFlattedColumnProps,
        allStackedColumnProps
    });

    const expansion: Map<number, boolean> = new Map();
    if (isMasterDetail && defaultExpandedRows.length) {
        for (let i: number = 0; i < defaultExpandedRows.length; i++) {
            if (defaultExpandedRows[parseInt(i.toString(), 10)] > 0) {
                expansion.set(defaultExpandedRows[parseInt(i.toString(), 10)] - 1, true);
            }
        }
    }

    const [expansionState, setExpansionState] = useState<Map<number, boolean>>(expansion);
    const previousExpansionPage: RefObject<number> = useRef<number>(currentPage);
    useEffect(() => {
        if (previousExpansionPage.current !== currentPage) {
            previousExpansionPage.current = currentPage;
            if (isMasterDetail) {
                setExpansionState((previousState: Map<number, boolean>) =>
                    previousState.size ? new Map<number, boolean>() : previousState);
            }
        }
    }, [currentPage, isMasterDetail]);
    const [responseData, setResponseData] = useState<Object>({});

    const cssClass: string = useMemo(() => {
        return props.className || '';
    }, [props.className]);

    /**
     * Compute CSS class names for the grid
     */
    const className: string = useMemo<string>(() => {
        const baseClasses: string[] = [
            CSS_CLASS_NAMES.CONTROL,
            CSS_CLASS_NAMES.GRID
        ];

        if (enableRtl) {
            baseClasses.push(CSS_CLASS_NAMES.RTL);
        }

        if (isSpannedColumns) {
            baseClasses.push(CSS_CLASS_NAMES.GRID_SPAN);
        }

        if (textWrapSettings?.enabled && textWrapSettings.wrapMode === 'Both') {
            baseClasses.push('sf-wrap');
        }

        if (gridLines !== 'Default' && gridLines !== 'None') {
            baseClasses.push(`sf-${gridLines.toLowerCase()}-lines`);
        } else if (gridLines === 'None') {
            baseClasses.push(CSS_CLASS_NAMES.HIDE_LINES);
        }

        if (enableHover) {
            baseClasses.push(CSS_CLASS_NAMES.GRID_HOVER);
        }

        if (isStackedHeader) {
            baseClasses.push(CSS_CLASS_NAMES.STACKED_HEADER);
        }

        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) || Browser.isSafari()) {
            baseClasses.push(CSS_CLASS_NAMES.MAC_SAFARI);
        }

        if (rowHeight) {
            baseClasses.push(CSS_CLASS_NAMES.MIN_HEIGHT);
        }

        if (cssClass) {
            baseClasses.push(...cssClass.split(' '));
        }

        return baseClasses.join(' ');
    }, [enableRtl, enableHover, rowHeight, gridLines, cssClass,
        filterSettings?.enabled, selectionSettings, textWrapSettings?.enabled, textWrapSettings,
        enableHtmlSanitizer, enableStickyHeader, isStackedHeader]);

    /**
     * Compute CSS styles for the grid container
     */
    const styles: CSSProperties = useMemo<CSSProperties>(() => ({
        width: formatUnit(width),
        height: formatUnit(height),
        minHeight: formatUnit(height)
    }), [width, height]);

    /**
     * Gets a Column by column name.
     *
     * @param  {string} field - Specifies the column name.
     *
     * @returns {ColumnProps} Returns the column
     */
    const getColumnByField: (field: string) => ColumnProps<T> = useCallback((field: string): ColumnProps<T> => {
        return iterateArrayOrObject<ColumnProps<T>, ColumnProps<T>>(columns, (item: ColumnProps<T>) => {
            if (item.field === field) {
                return item;
            }
            return undefined;
        })[0];
    }, [columns]);

    /**
     * Retrieves an array of all hidden columns in the Grid.
     *
     * The `getHiddenColumns` method returns an array containing all the column configuration objects that are currently hidden in the Grid.
     *
     * @returns {ColumnProps[]} Returns an array of `ColumnProps` objects representing all the currently hidden columns.
     *
     * @example
     * ```tsx
     * gridRef.current.getHiddenColumns();
     * ```
     */
    const getHiddenColumns: () => ColumnProps<T>[] = useCallback((): ColumnProps<T>[] => {
        const cols: ColumnProps<T>[] = [];
        for (const col of (columns)) {
            if (col.visible === false) {
                cols.push(col);
            }
        }
        return cols as ColumnProps<T>[];
    }, [columns]);

    /**
     * Retrieves row information based on a target cell element.
     *
     * The `getRowInfo` method returns detailed information about the row that contains the specified target element.
     *
     * @param {Element | EventTarget} target - The cell element or event target used to identify the corresponding row.
     *
     * @returns {RowInfo} Returns a `RowInfo` object containing details about the associated row.
     *
     * @example
     * ```tsx
     * gridRef.current.getRowInfo(event.target);
     * ```
     */
    const getRowInfo: (target: Element | EventTarget) => RowInfo<T> = useCallback((target: Element | EventTarget): RowInfo<T> => {
        const ele: Element = target as Element;
        let args: Object = { target: target };
        if (!isNullOrUndefined(target)) {
            const cell: Element = closest(ele, '.sf-grid-content-row .sf-cell');
            if (!cell) {
                const row: Element = closest(ele, '.sf-grid-content-row');
                if (!isNullOrUndefined(row) && !row.classList.contains('sf-grid-add-row')) {
                    const rowObj: IRow<ColumnProps<T>> = gridRef.current.getRowObjectFromUID(row.getAttribute('data-uid'));
                    const rowIndex: number = parseInt(row.getAttribute('data-rowindex'), 10) - 1;
                    const ariaRowIndex: number = parseInt(row.getAttribute('aria-rowindex'), 10) - 1;
                    args = { row: row, data: rowObj.data, rowIndex: rowIndex, ariaRowIndex: ariaRowIndex };
                }
                return args;
            }
            const cellIndex: number = parseInt(cell.getAttribute('data-colindex'), 10) - 1;
            const ariaCellIndex: number = parseInt(cell.getAttribute('aria-colindex'), 10) - 1;
            const row: Element = closest(cell, '.sf-grid-content-row');
            if (!isNullOrUndefined(cell) && !isNaN(cellIndex) && !isNullOrUndefined(row)) {
                const rowIndex: number = parseInt(row.getAttribute('data-rowindex'), 10) - 1;
                const ariaRowIndex: number = parseInt(row.getAttribute('aria-rowindex'), 10) - 1;
                const rows: Element[] = Array.from(gridRef?.current.getRows() || []);
                const index: number = cellIndex;
                const rowsObject: Element[] = rows.filter((r: Element) => r?.getAttribute('data-uid') === row?.getAttribute('data-uid'));
                let data: T = {} as T;
                let column: ColumnProps<T>;
                if (Object.keys(rowsObject).length) {
                    const rowObject: IRow<ColumnProps<T>> = gridRef?.current.getRowObjectFromUID(rowsObject[0].getAttribute('data-uid'));
                    data = rowObject.data as T;
                    column = rowObject.cells[parseInt(index.toString(), 10)].column as ColumnProps<T>;
                }
                args = {
                    cell: cell, cellIndex: cellIndex, columnIndex: cellIndex, row: row, rowIndex: rowIndex,
                    data: data, column: column, target: target, ariaRowIndex: ariaRowIndex, ariaColIndex: ariaCellIndex
                };
            }
        }
        return args;
    }, []);

    /**
     * Get primary key field names from columns
     */
    const getPrimaryKeyFieldNames: () => string[] = useCallback((): string[] => {
        const primaryKeys: string[] = [];
        // Add null check for grid.columns to prevent runtime errors
        if (columns) {
            for (const column of columns) {
                if (column.isPrimaryKey && column.field) {
                    primaryKeys.push(column.field);
                }
            }
        }
        return primaryKeys.length > 0 ? primaryKeys : ['id']; // Default to 'id' if no primary key found
    }, [columns]);

    /**
     * @returns {ColumnProps[]} returns array of column models
     */
    const getVisibleColumns: () => ColumnProps<T>[] = useCallback((): ColumnProps<T>[] => {
        return visibleColumns;
    }, [columns, uiColumns.current, visibleColumns]);

    /**
     * Gets a column by UID.
     *
     * @param  {string} uid - Specifies the column UID.
     *
     * @returns {ColumnProps} Returns the column
     */
    const getColumnByUid: (uid: string) => ColumnProps<T> = useCallback((uid: string): ColumnProps<T> => {
        const gridCols: ColumnProps<T>[] = isStackedHeader ? allStackedColumnProps : uiColumns.current ?? columns;
        for (const col of gridCols) {
            if (col.uid === uid) {
                return col;
            }
        }
        return undefined;
    }, [columns, uiColumns.current]);

    /**
     * Get the parent element
     */
    const getParentElement: () => HTMLElement = useCallback((): HTMLElement => {
        return gridRef?.current?.element as HTMLElement;
    }, [gridRef?.current?.element]);

    /**
     * Updates and refresh the particular row values based on the given primary key value.
     * Primary key column must be specified using columns.isPrimaryKey property.
     *
     * @param {string| number} key - Specifies the PrimaryKey value of dataSource.
     * @param {Object} data - To update new data for the particular row.
     *
     * @returns {void}
     */
    const setRowData: (key: string | number, data?: T, isDataSourceChangeRequired?: boolean) => void =
        useCallback(async(key: string | number, data?: T, isDataSourceChangeRequired: boolean = false): Promise<void> => {
            const rowuID: string = 'uid';
            const pkName: string = gridRef.current?.getPrimaryKeyFieldNames()[0];
            const selectedRow: IRow<ColumnProps<T>> = gridRef.current?.getRowsObject().filter((r: IRow<{}>) =>
                getValue(pkName, r.data) === key)[0] as IRow<ColumnProps<T>>;
            if (selectedRow === undefined || selectedRow === null) {
                dispatchGridCancelBegin(gridRef, 'RowDataUpdate');
                return;
            }
            const saveArgs: { requestType: string; action: string; data: T; previousData: T | GroupedData<T> } = {
                requestType: 'save',
                action: 'Edit',
                data: data,
                previousData: selectedRow.data
            };

            const selectRowEle: Element[] = selectedRow ? [].slice.call(
                gridRef.current?.element.querySelectorAll('[data-uid=' + selectedRow[`${rowuID}`] + ']')) : undefined;
            try {
                const customBinding: boolean = dataOperations.dataManager && 'result' in dataOperations.dataManager;
                if (isDataSourceChangeRequired) {
                    await dataOperations.getData(customBinding ? { ...saveArgs } : {
                        requestType: 'update',
                        data: data
                    });
                }
                if (!isNullOrUndefined(selectedRow) && selectRowEle.length) {
                    const rowObjectData: T = { ...selectedRow.data, ...data };
                    selectedRow.setRowObject({ ...selectedRow, data: rowObjectData });
                } else {
                    return; // if updated cell not inside the current view
                }
            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef.current?.onError(error as Error);
                return;
            }
        }, [gridRef.current]);

    /**
     * Updates particular cell value based on the given primary key value.
     * Primary key column must be specified using columns.isPrimaryKey property.
     *
     * @param {string| number} key - Specifies the PrimaryKey value of dataSource.
     * @param {string } field - Specifies the field name which you want to update.
     * @param {ValueType} value - To update new value for the particular cell.
     *
     * @returns {void}
     */
    const setCellValue: (key: string | number, field: string, value: ValueType | null,
        isDataSourceChangeRequired?: boolean) => void =
        useCallback(async (key: string | number, field: string, value: ValueType | null,
                           isDataSourceChangeRequired?: boolean) => {
            const rowuID: string = 'uid';
            const pkName: string = gridRef.current?.getPrimaryKeyFieldNames()[0];
            const selectedRow: IRow<ColumnProps<T>> = gridRef.current?.getRowsObject().filter((r: IRow<{}>) =>
                getValue(pkName, r.data) === key)[0] as IRow<ColumnProps<T>>;
            if (selectedRow === undefined || selectedRow === null) {
                dispatchGridCancelBegin(gridRef, 'CellValueUpdate');
                return;
            }
            const selectRowEle: Element[] = selectedRow ? [].slice.call(
                gridRef.current?.element.querySelectorAll('[data-uid=' + selectedRow[`${rowuID}`] + ']')) : undefined;
            const changedRowData: T = DataUtil.setValue(field, value, { ...selectedRow.data }) as T;
            try {
                if (isDataSourceChangeRequired) {
                    await dataOperations.getData({
                        requestType: 'update',
                        data: changedRowData
                    });
                }
                if (!isNullOrUndefined(selectedRow) && selectRowEle.length) {
                    const rowObjectData: T = { ...selectedRow.data, ...changedRowData };
                    selectedRow.setRowObject({ ...selectedRow, data: rowObjectData });
                } else {
                    return; // if updated cell not inside the current view
                }
            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef.current?.onError(error as Error);
                return;
            }
        }, [gridRef.current]);

    /**
     * Updates one or more fields across multiple records in bulk.
     *
     * @param {Object} changedData - Field names and their new values to apply to all matching records.
     * @param {Object[]} [rowData] - Optional records to update. Falls back to selected records.
     * @param {Function} [callback] - Optional callback invoked with the result after the changes are saved.
     *
     * @returns {void}
     */
    const saveBulkChanges: (changedData: Object, rowData?: Object[], callback?: Function) => void =
        useCallback(async(changedData: Object, rowData?: Object[], callback?: Function) => {
            const primaryKey: string = gridRef.current?.getPrimaryKeyFieldNames()[0];
            const records: Object[] = rowData && rowData.length ? rowData : (gridRef.current?.getSelectedRecords() as Object[]);
            const fields: string[] = Object.keys(changedData);
            if (!primaryKey || !fields.length || !records.length) {
                if (!isNullOrUndefined(callback) && typeof callback === 'function') {
                    callback(undefined);
                }
                return;
            }
            const changes: { addedRecords: T[]; deletedRecords: T[]; changedRecords: T[] } =
                { addedRecords: [], deletedRecords: [], changedRecords: [] };
            const original: { addedRecords: T[]; deletedRecords: T[]; changedRecords: T[] } =
                { addedRecords: [], deletedRecords: [], changedRecords: [] };
            for (const record of records) {
                original.changedRecords.push(extend({}, {}, record, true) as T);
                for (const field of fields) {
                    if (field === primaryKey || isNullOrUndefined(gridRef.current?.getColumnByField(field))) {
                        continue;
                    }
                    const cellValue: string | number | boolean | Date = getValue(field, changedData);
                    setValue(field, cellValue, record);
                }
                changes.changedRecords.push(extend({}, {}, record, true) as T);
            }
            const dataModuleResult: UseDataResult = gridRef.current?.getDataModule() as UseDataResult;
            const promise: Object = (dataModuleResult.dataManager as DataManager).saveChanges(
                changes, primaryKey, undefined, undefined, original);
            const triggerCallback: Function = (args: Object) => {
                if (!isNullOrUndefined(callback) && typeof callback === 'function') {
                    callback(args);
                }
            };
            if (dataModuleResult.isRemote()) {
                (promise as Promise<Object>).then((e: Object) => {
                    triggerCallback(e);
                }).catch((e: Object) => {
                    triggerCallback({ error: e });
                });
            } else {
                triggerCallback(promise);
            }
        }, [gridRef.current]);

    /**
     * Updates a full row (by primary key) and resolves once the grid's UI has committed the change.
     * Resolves without rejecting when the row is not found or is not currently rendered (no-op).
     *
     * @param {string | number} key - Specifies the PrimaryKey value of dataSource.
     * @param {T} data - To update new data for the particular row.
     * @param {boolean} [isDataSourceChangeRequired] - Whether the underlying data source should also be updated.
     * @returns {Promise<void>} Resolves after the row value is updated.
     */
    const setRowDataAsync: (key: string | number, data?: T, isDataSourceChangeRequired?: boolean) => Promise<void> =
        useCallback((key: string | number, data?: T, isDataSourceChangeRequired?: boolean): Promise<void> =>
            executeGridAsyncAction(gridRef, 'RowDataUpdate', () => setRowData(key, data, isDataSourceChangeRequired)),
                    [gridRef, setRowData]);

    /**
     * Updates a single cell value (by primary key) and resolves once the grid's UI has committed the change.
     * Resolves without rejecting when the row is not found or is not currently rendered (no-op).
     *
     * @param {string | number} key - Specifies the PrimaryKey value of dataSource.
     * @param {string} field - Specifies the field name which the value should be updated for.
     * @param {ValueType | null} value - The new value for the particular cell.
     * @param {boolean} [isDataSourceChangeRequired] - Whether the underlying data source should also be updated.
     * @returns {Promise<void>} Resolves after the cell value is updated.
     */
    const setCellValueAsync: (key: string | number, field: string, value: ValueType | null,
        isDataSourceChangeRequired?: boolean) => Promise<void> =
        useCallback((key: string | number, field: string, value: ValueType | null,
                     isDataSourceChangeRequired?: boolean): Promise<void> =>
            executeGridAsyncAction(gridRef, 'CellValueUpdate', () => setCellValue(key, field, value, isDataSourceChangeRequired)),
                    [gridRef, setCellValue]);

    /**
     * Updates one or more fields across multiple records in bulk and resolves when the changes are saved.
     *
     * @param {Object} changedData - Field names and their new values to apply to all matching records.
     * @param {Object[]} [rowData] - Optional records to update. Falls back to selected records.
     *
     * @returns {Promise<Object>} A promise that resolves with the save result once the operation completes.
     */
    const saveBulkChangesAsync: (changedData: Object, rowData?: Object[]) => Promise<Object | void> =
        useCallback(async(changedData: Object, rowData?: Object[]): Promise<Object | void> => {
            let saveResult: Object | void;
            await executeGridAsyncAction(gridRef, 'BulkSave', (): Promise<void> =>
                new Promise<void>((resolve: () => void, reject: (reason?: Object) => void) => {
                    gridRef.current?.saveBulkChanges(changedData, rowData, (args: Object): void => {
                        if (args && (args as { error?: Object }).error) {
                            reject(args);
                        } else {
                            saveResult = args;
                            resolve();
                        }
                    });
                }));
            return saveResult;
        }, [gridRef.current]);

    /**
     * Get the columns directive element
     */
    const columnsDirective: ReactElement = useMemo(() => {
        return children as ReactElement;
    }, [children]);

    // Get header, content, and aggregate row counts for focus strategy
    const headerRowCount: number = useMemo(() => headerRowDepth, [headerRowDepth]);
    const contentRowCount: number = useMemo(() => currentViewData?.length || 0, [currentViewData]);
    const aggregateRowCount: number = useMemo(() => aggregates?.length || 0, [aggregates]);

    const filterModule: filterModule = (props?.modules?.GridAllModules ??
        props?.modules)?.FilterModule?.(gridRef, filterSettings, setGridAction, serviceLocator, setCurrentPage, virtualSettings,
                                        scrollMode);

    const searchModule: searchModule = (props?.modules?.GridAllModules ??
        props?.modules)?.SearchModule?.(gridRef, searchSettings,
                                        setGridAction, setCurrentPage, virtualSettings, scrollMode);

    const sortModule: SortModule = useSort(gridRef, sortSettings, setGridAction, groupModule, isInitialLoad);

    // Call useTreeData hook to handle tree data normalization and expansion state
    const treeModule: ITreeDataResult = (props?.modules?.GridAllModules ?? props?.modules)?.TreeDataModule?.(
        gridRef,
        setCurrentViewData as Dispatch<SetStateAction<(TreeGridRow[] | T[])>>,
        Array.isArray(props.dataSource) ? props.dataSource as T[] : [],
        treeDataSettings,
        pageSettings,
        filterModule?.filterSettings,
        sortModule?.sortSettings,
        searchModule?.searchSettings,
        setTotalRecordsCount as Dispatch<SetStateAction<number>>,
        currentPage as number,
        isOffline
    );
    useMemo(() => {
        const sortedColumns: SortDescriptor[] = sortModule.sortSettings.columns;
        if (sortedColumns.length) {
            const validColumns: SortDescriptor[] = sortedColumns.filter((sortedColumn: SortDescriptor) => {
                const column: ColumnProps<T> = columns.find((col: ColumnProps<T>) => col.field === sortedColumn.field);
                return column?.allowSort;
            });
            if (sortedColumns.length !== validColumns.length) {
                sortModule.setSortSettings((prev: SortSettings) => ({ ...prev, columns: validColumns }));
            }
        }

        const filteredColumns: FilterPredicates[] = filterModule?.filterSettings.columns;
        if (filteredColumns?.length) {
            const validColumns: FilterPredicates[] = filteredColumns.filter((filteredColumn: FilterPredicates) => {
                const column: ColumnProps<T> = columns.find((col: ColumnProps<T>) => col.field === filteredColumn.field);
                return column?.allowFilter;
            });
            if (filteredColumns.length !== validColumns.length) {
                filterModule?.setFilterSettings((prev: FilterSettings) => ({ ...prev, columns: validColumns }));
            }
        }
    }, [columns]);

    /**
     * Retrieves all records from the Grid based on the current settings.
     *
     * The `getData` method returns an array of data objects reflecting the applied paging, filters, sorting, searching and grouping settings.
     * For a remote data source, it returns only the current view data.
     *
     * @param {boolean} skipPage - If `true`, excludes pagination information from the returned data.
     * @param {boolean} requiresCount - If `true`, then the service returns result and count.
     *
     * @returns {Object[] | Promise<Response | DataReturnType>} Returns an array of records based on current settings in grid.
     *
     * @example
     * ```tsx
     * gridRef.current.getData();
     * ```
     */
    const getData: (skipPage?: boolean, requiresCount?: boolean, data?: Object[] | DataManager) => Object[] | Promise<Response
    | DataReturnType> = useCallback((skipPage?: boolean, requiresCount?: boolean, data?: Object[] | DataManager): Object[] |
    Promise<Response | DataReturnType> => {
        const finalDataSource: Object[] | DataManager | DataResult = data ?? dataSource;
        const query: Query = dataModule.generateQuery();
        if (requiresCount) {
            query.requiresCount();
        }
        if (skipPage) {
            query.queries = query.queries.filter((query: QueryOptions) => query.fn !== 'onPage');
        }
        if (finalDataSource && dataModule.isRemote() && finalDataSource instanceof DataManager) {
            // Especially usefull for edit update whole data based aggregate
            return dataOperations?.getData?.({}, query) as Promise<DataReturnType>;
        } else if ('result' in finalDataSource) {
            // For custom binding, pass proper request object with requestType for data operations
            return dataOperations?.getData?.({ requestType: 'getData' }, query) as Promise<DataReturnType>;
        } else {
            if (finalDataSource instanceof DataManager) {
                return (finalDataSource as DataManager).executeLocal(query);
            } else {
                return new DataManager(finalDataSource as DataManager, query).executeLocal(query);
            }
        }
    }, [dataSource, currentViewData, currentPage, sortModule]);

    useMemo(() => {
        if (!isInitialLoad) {
            gridRef.current?.scrollModule?.setVirtualColumnEndIndex(getVisibleColumns?.());
        }
    }, [getVisibleColumns]);

    const commandColumnModule: UseCommandColumnResult<T> = (props?.modules?.GridAllModules ??
        props?.modules)?.CommandColumnModule?.(isCommandEditEnabled && virtualSettings.enableColumn);

    // Initialize focus strategy - single source of truth for focus state
    const focusModule: ReturnType<typeof useFocusStrategy> = useFocusStrategy(
        headerRowCount,
        contentRowCount,
        aggregateRowCount,
        virtualSettings.enableColumn ? ((!gridRef.current?.scrollModule?.virtualColumnInfo.columns?.length ||
            (gridRef.current?.scrollModule?.virtualColumnInfo.columns.length === 1 &&
                gridRef.current?.scrollModule?.virtualColumnInfo.columns[0]?.uid === 'empty-cell-uid')) &&
            visibleColumns.length ? visibleColumns.slice(gridRef.current?.scrollModule?.virtualColumnInfo?.startIndex,
                                                         gridRef.current?.scrollModule?.virtualColumnInfo?.endIndex) :
            gridRef.current?.scrollModule?.virtualColumnInfo.columns) : visibleColumns,
        gridRef,
        virtualSettings,
        virtualChangeDetectedPageSize,
        {
            onCellFocus: (args: CellFocusEvent<T>) => {
                if (props.onCellFocus) {
                    const eventArgs: CellFocusEvent<T> = {
                        column: args.column,
                        columnIndex: args.columnIndex,
                        event: args.event,
                        data: args.data,
                        rowIndex: args.rowIndex,
                        virtualAriaRowIndex: args.virtualAriaRowIndex,
                        virtualAriaColIndex: args.virtualAriaColIndex
                    };
                    props.onCellFocus(eventArgs);
                }
                // const captionRow: Element | null = args?.element.closest('.sf-grid-groupcaptionrow');
                // if (!captionRow) {
                gridScoped.selectionModule.onCellFocus({...args, rowIndex: args.virtualAriaRowIndex - 1});
                // }
            },
            onCellClick: (args: CellFocusEvent<T>) => {
                if (props.onCellClick) {
                    const eventArgs: CellFocusEvent<T> = {
                        column: args.column,
                        columnIndex: args.columnIndex,
                        event: args.event,
                        data: args.data,
                        rowIndex: args.rowIndex
                    };
                    props.onCellClick(eventArgs);
                }
            },
            beforeCellFocus: (args: CellFocusEvent<T>) => {
                if (props.onCellFocusStart) {
                    props.onCellFocusStart(args);
                }
            }
        },
        commandColumnModule,
        groupModule?.groupSettings.enabled && groupModule?.groupSettings.columns?.length
            ? expandedGroupCountRef.current
            : totalRecordsCount,
        expansionState
    );

    const keyDownHandler: (e: React.KeyboardEvent | KeyboardEvent) => void = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
        // Handle undo/redo shortcuts - only when not in edit mode
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
            if (editModule?.isEdit && editSettings?.allowBatchSave !== true) {
                return;
            }
            if (!e.shiftKey && editSettings?.allowUndoRedo) {
                e.preventDefault();
                void gridRef.current?.undo?.();
                return;
            }
        }

        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y') && editSettings?.allowUndoRedo) {
            if (editModule?.isEdit && editSettings?.allowBatchSave !== true) {
                return;
            }
            e.preventDefault();
            void gridRef.current?.redo?.();
            return;
        }
        if (e.altKey) {
            if (e.keyCode === KEY_CODES.ALT_J) {
                const currentInfo: FocusedCellInfo = focusModule?.getFocusInfo();
                if (currentInfo && currentInfo.element) {
                    removeClass([currentInfo.element, currentInfo.elementToFocus],
                                ['sf-focused', 'sf-focus']);
                    currentInfo.element.tabIndex = -1;
                }
                gridRef.current?.element.focus();
            }
            if (e.keyCode === KEY_CODES.ALT_W) {
                // First ensure we're in content mode
                focusModule.setActiveMatrix('Content');

                // Focus the content area
                focusModule.focusContent();

                // Add outline to the focused cell
                focusModule.addOutline();

                // Prevent default browser behavior
                e.preventDefault();
            }
            if (e.keyCode === KEY_CODES.RIGHT_ARROW || e.keyCode === KEY_CODES.LEFT_ARROW) {
                const target: HTMLElement = e.target as HTMLElement;
                if (target.closest('.sf-cell') && target.querySelector('.sf-resize-handler')) {
                    resizeModule?.onResizeHandleKeyDown(e as React.KeyboardEvent);
                }
            }
        }
    }, [focusModule, gridRef.current?.currentViewData, gridRef.current?.scrollModule?.virtualColumnInfo.columns, visibleColumns,
        resizeModule]);

    const aggregateSelection: UseAggregateSelectionResult = useAggregateSelection();

    useMemo(() => {
        if (scrollMode === ScrollMode.Infinite) {
            setTotalRecordsCount(pageSettings?.estimatedTotalRecordsCount ?? 0);
            setInfiniteScrollState((prevState: InfiniteScrollState) => ({
                ...prevState,
                isInfiniteEndReached: false,
                isVirtualScrollRequest: pageSettings?.estimatedTotalRecordsCount ? true : false
            }));
            if (gridRef.current?.scrollModule?.virtualRowInfo?.currentPages) {
                gridRef.current.scrollModule.virtualRowInfo.currentPages = [1];
            }
            setCurrentPage(1);
            if (pageSettings?.currentPage !== 1) {
                // Prepare pager arguments
                const args: PagerArgsInfo = {
                    cancel: false,
                    currentPage: 1,
                    previousPage: pageSettings.currentPage,
                    requestType: ActionType.Paging,
                    type: 'pageChanging'
                };
                setGridAction(args);
            }
            if (gridRef.current?.scrollModule?.virtualRowInfo?.startIndex) {
                gridRef.current.scrollModule.virtualRowInfo.startIndex = 0;
            }
            if (gridRef.current?.contentScrollRef?.scrollTop) {
                gridRef.current.contentScrollRef.scrollTop = 0;
            }
        }
    }, [filterModule?.filterSettings?.columns, filterModule?.filterSettings?.columns.length, sortModule.sortSettings?.columns,
        sortModule.sortSettings?.columns.length, searchModule?.searchSettings?.value]);

    // Initialize data operations following original Data class pattern
    // The original Data class is initialized with grid instance and service locator
    // We need to pass the grid instance to useData, not just the dataSource
    const gridInstance: {
        dataSource: DataManager | DataResult;
        query: Query;
        columns: ColumnProps<T>[];
        aggregates: AggregateRowProps[];
        sortSettings: SortSettings;
        filterSettings: FilterSettings;
        searchSettings: SearchSettings;
        pageSettings: PageSettings;
        groupSettings: GroupSettings;
        scrollMode: ScrollMode;
        getPrimaryKeyFieldNames: () => string[];
        onDataRequest: (args: DataRequestEvent) => void;
        onDataChangeRequest: (args: DataChangeRequestEvent<T>) => void;
        aggregateSelection: UseAggregateSelectionResult;
        virtualizationSettings: VirtualizationSettings;
        totalRecordsCount: number;
    } = useMemo(() => ({
        dataSource,
        query,
        columns: uiColumns.current ?? columns,
        aggregates,
        sortSettings: sortModule?.sortSettings,
        filterSettings: filterModule?.filterSettings,
        searchSettings: searchModule?.searchSettings,
        groupSettings: groupModule?.groupSettings,
        pageSettings,
        scrollMode,
        currentPage,
        getPrimaryKeyFieldNames,
        onDataRequest: props.onDataRequest,
        onDataChangeRequest: props.onDataChangeRequest,
        aggregateSelection,
        virtualizationSettings,
        totalRecordsCount,
        isStackedHeader,
        stackedFlattedColumnProps
    }), [props.dataSource, query, sortSettings?.enabled, groupSettings.enabled, filterModule?.filterSettings?.enabled, totalRecordsCount,
        pageSettings?.enabled, sortModule?.sortSettings, searchModule?.searchSettings?.enabled, uiColumns.current,
        columns, filterModule?.filterSettings, searchModule?.searchSettings, pageSettings, currentPage, scrollMode, aggregateSelection,
        isStackedHeader, stackedFlattedColumnProps]);

    const dataOperations: UseDataResult<T> = useData<T>(gridInstance, gridAction, dataState, groupCaptionAggregateType);
    const restoreRowDataForUndo: (key: string | number, data: T, _rowIndex?: number) => Promise<void> = useCallback(async (
        key: string | number, data: T
    ): Promise<void> => {
        const primaryKeyField: string = gridRef.current?.getPrimaryKeyFieldNames?.()?.[0];
        const selectedRow: IRow<ColumnProps<T>> | undefined = gridRef.current?.getRowsObject?.()
            ?.find((row: IRow<ColumnProps<T>>) => getValue(primaryKeyField, row.data) === key);
        const cachedRow: T | undefined = Array.from(virtualCachedViewData.values()).find((row: T) =>
            getValue(primaryKeyField, row) === key) as T | undefined;
        const currentViewRow: T | undefined = currentViewData.find((row: T) =>
            getValue(primaryKeyField, row) === key) as T | undefined;
        const previousData: T = (selectedRow?.data ?? currentViewRow ?? cachedRow) as T;
        const isCustomBinding: boolean = !!dataOperations.dataManager && 'result' in dataOperations.dataManager;
        if (isCustomBinding && virtualizationSettings.scrollMode === ScrollMode.Infinite) {
            if (gridRef.current?.scrollModule?.isDataOperationPreventVirtualCache) {
                gridRef.current.scrollModule.isDataOperationPreventVirtualCache.current = true;
            }
        }
        await dataOperations.getData(isCustomBinding ? {
            requestType: 'save',
            action: ActionType.Edit,
            data,
            previousData
        } as { requestType: string; data: T; } : {
            requestType: 'update',
            data
        });
        if (selectedRow) {
            selectedRow.setRowObject?.((previousRowObject: IRow<ColumnProps<T>>) => ({
                ...previousRowObject,
                data: { ...previousRowObject.data, ...data }
            }));
        }
        setCurrentViewData((previousRows: T[]) => previousRows.map((row: T) =>
            getValue(primaryKeyField, row) === key ? { ...row, ...data } : row));
        if (gridRef.current?.aggregates?.length) {
            setResponseData((previousResponse: Object) => {
                const response: { result?: T[]; aggregates?: Object } = previousResponse as { result?: T[]; aggregates?: Object };
                const sourceRows: T[] = Array.isArray(response.result) ? response.result : currentViewData;
                return {
                    ...response,
                    aggregates: isCustomBinding ? response.aggregates : undefined,
                    result: sourceRows.map((row: T) =>
                        getValue(primaryKeyField, row) === key ? { ...row, ...data } : row)
                };
            });
        }
        if (virtualizationSettings.scrollMode === ScrollMode.Virtual || virtualizationSettings.scrollMode === ScrollMode.Infinite) {
            setVirtualCachedViewData((previousData: Map<number, T>) => {
                const updatedData: Map<number, T> = new Map<number, T>();
                previousData.forEach((row: T, index: number) => {
                    updatedData.set(index, getValue(primaryKeyField, row) === key ? { ...row, ...data } : row);
                });
                return updatedData;
            });
        }
    }, [currentViewData, dataOperations, gridRef, setCurrentViewData, virtualCachedViewData, virtualizationSettings.scrollMode]);
    const dataModule: UseDataResult<T> = dataOperations;

    useEffect(() => {
        if (scrollMode === ScrollMode.Infinite) {
            // Validation: Infinite mode requires remote data source
            const isLocalData: boolean = !dataModule.isRemote() && dataSource instanceof Array;
            if (enableDevMode && isLocalData) {
                console.warn(INFINITE_SCROLL_LOCAL_DATA_MESSAGE);
            }
        }
    }, [scrollMode, dataModule]);
    const selectionModule: selectionModule<T> =
        useSelection<T>(gridRef, currentViewData, totalRecordsCount, isCheckBoxColumn, dataModule, virtualSettings, scrollMode,
                        props.isRowSelectable, isInitialLoad, visibleColumns, groupModule, expandedGroupCountRef,
                        groupCaptionAggregateType);

    useMemo(() => {
        if (!selectionSettings.enabled) {
            selectionModule.clearSelection();
        }
    }, [selectionSettings.enabled]);

    // Initialize cell selection module - always created per Rules of Hooks
    const cellSelectionModule: CellSelectionModel = useCellSelection<T>(
        gridRef,
        currentViewData,
        visibleColumns,
        selectionSettings,
        isSpannedColumns
    );
    const isCtrlKeySelectionRef: RefObject<boolean> = useRef<boolean>(false);

    const pinningModule: PinningModuleResult<T> = (props.modules?.GridAllModules?.PinningModule ??
        props.modules?.PinningModule)?.({ gridRef, setColumnChooserState, uiColumns, isInitialLoad });
    const batchEditStagedRowsRef: RefObject<Map<string | number, StagedRowData<T>>> = useRef(new Map());
    const batchEditModuleRef: RefObject<UseBatchEditResult<T> | undefined> = useRef<UseBatchEditResult<T> | undefined>(undefined);

    // Initialize undo/redo module for action history tracking
    const undoRedoModule: UseUndoRedoResult = useUndoRedo(
        gridRef,
        editSettings,
        {
            onUndoStart: props.onUndoStart,
            onUndoComplete: props.onUndoComplete,
            onRedoStart: props.onRedoStart,
            onRedoComplete: props.onRedoComplete
        },
        batchEditModuleRef,
        setCurrentViewData,
        restoreRowDataForUndo
    );

    const editModule: editModule<T> = ((props?.modules?.GridAllModules ?? commandColumnModule)?.EditModule ??
        props?.modules?.EditModule)?.<T>(
        gridRef,
        serviceLocator,
        visibleColumns,
        currentViewData,
        dataModule,
        focusModule,
        selectionModule,
        editSettings,
        setGridAction,
        setCurrentPage,
        setResponseData,
        commandColumnModule,
        virtualSettings,
        pinningModule,
        batchEditStagedRowsRef,
        undoRedoModule
    );
    batchEditModuleRef.current = editModule?.batchEditModule;

    const formulaModule: FormulaModuleResult<T> | null = ((props?.modules?.GridAllModules ?? props?.modules)?.FormulaModule)?.(
        gridRef,
        serviceLocator,
        visibleColumns,
        currentViewData,
        dataModule,
        {
            ...(props.formulaSettings ?? {}),
            enabled: props.formulaSettings?.enabled === true
        },
        setGridAction,
        virtualSettings,
        { ...props, editSettings: editModule?.editSettings ?? editSettings }
    ) ?? null;

    const autoFillModule: AutoFill | null = (props?.modules?.GridAllModules ?? props.modules)?.AutoFillModule?.({
        gridRef,
        currentViewData,
        visibleColumns,
        selectionSettings,
        cellSelectionModule,
        editSettings: editModule?.editSettings ?? editSettings,
        autoFillSettings,
        props,
        columnMap,
        dataOperations,
        setCurrentViewData: setCurrentViewData,
        fieldOrderMap,
        selectionModule,
        setRowData,
        clipboardSettings,
        setResponseData,
        undoRedoModule,
        isCtrlKeySelectionRef,
        editModule,
        serviceLocator,
        focusModule,
        setGridAction,
        setCurrentPage,
        commandColumnModule,
        virtualSettings,
        pinningModule,
        batchEditStagedRowsRef
    });

    // Initialize clipboard module via the modules prop, or use the one created by autofill.
    const clipboardModule: Clipboard | null = autoFillModule?.clipboardModule ?? (props?.modules?.GridAllModules ??
        props?.modules)?.ClipboardModule?.({
        gridRef,
        currentViewData,
        visibleColumns,
        selectionSettings,
        cellSelectionModule,
        selectionModule,
        setRowData,
        editSettings: editModule?.editSettings ?? props.editSettings as EditSettings<T>,
        clipboardSettings,
        onClipboardCopy: props.onClipboardCopy,
        onClipboardPaste: props.onClipboardPaste,
        onClipboardCut: props.onClipboardCut,
        setResponseData,
        setCurrentViewData,
        dataOperations,
        fieldOrderMap,
        columnMap,
        undoRedoModule
    });

    const columnChooserModule: columnChooserModule = (props?.modules?.GridAllModules ?? props?.modules)?.ColumnChooserModule?.();
    // Initialize toolbar module if toolbar is configured
    // Pass modules directly to avoid context provider issues during initial rendering
    const toolbarModule: ToolbarAPI | null = (props?.modules?.GridAllModules?.ToolbarModule ?? props?.modules?.ToolbarModule ??
        editModule?.ToolbarModule ?? searchModule?.ToolbarModule ?? columnChooserModule?.ToolbarModule)?.(
        {
            toolbar: props.toolbar,
            gridId: id,
            onToolbarItemClick: props.onToolbarItemClick,
            className: cssClass
        },
        editModule,
        selectionModule,
        currentViewData,
        searchSettings?.enabled,
        commandColumnModule,
        selectionSettings,
        props.showColumnChooser,
        virtualSettings,
        totalRecordsCount,
        gridRef
    );
    const pagerModule: pagerModule = (props?.modules?.GridAllModules ?? props?.modules)?.PagerModule?.();
    const contextMenuModule: contextMenuModule = (props?.modules?.GridAllModules ?? props?.modules)?.ContextMenuModule?.();

    /**
     * Toggle expansion state for a specific row
     *
     * @param {number} rowIndex - The row identifier to toggle
     * @param {T} [rowData] - Optional: the row data object
     */
    const onExpandStateChange: (rowIndex: number, rowData?: T) => void = useCallback((rowIndex: number, rowData?: T): void => {
        setExpansionState((prevState: Map<number, boolean>) => {
            const newState: Map<number, boolean> = new Map(prevState);
            const shouldExpand: boolean = !prevState.has(rowIndex) || !prevState.get(rowIndex);
            const expandCollapseArgs: RowExpandEvent<T> | RowCollapseEvent<T> = { rowIndex: rowIndex, data: rowData as T };
            if (shouldExpand) {
                if (props.onRowExpand) {
                    props.onRowExpand(expandCollapseArgs);
                }
                if (!expandCollapseArgs.cancel){
                    newState.set(rowIndex, shouldExpand);
                }
            } else {
                if (props.onRowCollapse) {
                    props.onRowCollapse(expandCollapseArgs);
                }
                if (!expandCollapseArgs.cancel) {
                    newState.delete(rowIndex);
                }
            }
            return newState;
        });
    }, [props.onRowExpand, props.onRowCollapse]);

    const isChildGrid:
    (e: MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | FocusEvent<HTMLDivElement> | MouseEvent) => boolean =
        useCallback((e: MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | FocusEvent<HTMLDivElement> | MouseEvent) => {
            const gridElement: Element = (e.target as HTMLElement)?.closest('.sf-grid');
            if (gridElement && gridElement?.id !== gridRef.current?.element?.id) {
                return true;
            }
            return false;
        }, []);

    const isStopPropagationPreventDefault:
    (e: MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>) => boolean =
        useCallback((e: MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>) => {
            return e.defaultPrevented && e.isPropagationStopped();
        }, []);

    const handleGridClick: (e: MouseEvent) => void = useCallback(async (e: MouseEvent<HTMLDivElement>) => {
        if (isChildGrid(e)) {
            return;
        }
        props?.onClick?.(e);
        const target: HTMLElement = e.target as HTMLElement;
        const toolbarAction: boolean = toolbarModule && props?.toolbar?.length
            && target?.closest('.sf-toolbar')?.parentElement === gridRef.current.element;
        const isGroupDropAreaAction: boolean = !!(groupModule && groupSettings.enabled && target?.closest('.sf-group-drop-area'));
        const datePicker: boolean = target?.closest('.sf-datepicker')?.classList.contains('sf-popup-open');
        const dropDown: boolean = target?.closest('.sf-ddl')?.classList.contains('sf-popup-open');
        const checkbox: boolean = target?.tagName === 'INPUT' && (e.target as HTMLElement)?.classList.contains('sf-grid-checkselect');
        const isHeaderCellClick: boolean = !!target?.closest('.sf-grid-header-row .sf-cell');
        const expansionIcon: HTMLElement = target?.closest('.sf-detail-toggle-icon');
        if (expansionIcon) {
            const clickedCell: HTMLTableCellElement = target.closest('td[role="gridcell"]') as HTMLTableCellElement;
            const rowInfo: RowInfo<T> = gridRef.current?.getRowInfo(clickedCell);
            onExpandStateChange(rowInfo?.ariaRowIndex, rowInfo?.data);
            return;
        }
        // Ensure grid is fully initialized before handling clicks
        // This fixes the initial rendering click issue
        if (isInitialLoad || !gridRef.current?.element || !currentViewData?.length || toolbarAction || datePicker || isGroupDropAreaAction
            || editModule?.isDialogOpen || editModule?.isDeleteDialogOpen || checkbox || dropDown || (selectionSettings?.checkboxOnly && !isHeaderCellClick) || (e.target as Element).closest('.sf-column-chooser-dialog')) {
            if (toolbarAction || isGroupDropAreaAction) {
                if (isGroupDropAreaAction) {
                    sortModule?.handleGridClick?.(e);
                }
                focusModule.setGridFocus(false);
            }
            return;
        }

        editModule?.handleGridClick?.(e);

        if (e.defaultPrevented || e.isPropagationStopped()) {
            return;
        }
        if (target?.closest('.sf-grid-popup-edit')) {
            if (target.closest('.sf-grid-popup-edit-save')) {
                editModule?.saveDataChanges();
            } else if (target.closest('.sf-grid-popup-edit-cancel') || target.closest('.sf-dlg-closeicon-btn')) {
                editModule?.cancelDataChanges();
            }
            return;
        }

        // Handle caption row toggle (group expand/collapse) - FIRST, similar to selection module pattern
        const captionButton: HTMLElement | null = target?.closest('.sf-group-togglebtn') as HTMLElement | null;
        const captionRow: Element | null = target?.closest('.sf-grid-groupcaptionrow');
        if (captionButton && captionRow && groupSettings?.enabled && groupModule) {
            const rowInfo: RowInfo<T> = gridRef.current?.getRowInfo(captionRow);
            if (rowInfo?.data) {
                // Pass the entire row object (GroupedData) to toggleGroup
                groupModule?.toggleGroup(rowInfo);
                e.preventDefault();
                const colIndex: number = parseInt(target?.closest('td')?.getAttribute('data-colindex') ?? '1', 10) - 1;
                requestAnimationFrame(() => {
                    // After toggling the group, move focus back to the caption cell to maintain focus context
                    focusModule.navigateToCell(rowInfo.rowIndex, colIndex, 'Content', undefined, true);
                });
                return;
            }
        }

        // Handle cell selection if enabled, otherwise handle row selection
        if (selectionSettings?.type === 'Cell' && cellSelectionModule) {
            isCtrlKeySelectionRef.current = e.ctrlKey || e.metaKey;
            cellSelectionModule.handleGridClick(e);
            requestAnimationFrame(() => {
                autoFillModule?.showFillHandle?.();
            });
        } else {
            // Handle row selection FIRST and IMMEDIATELY, regardless of focus state
            // This ensures row selection happens on the first click, even when coming from outside grid focus
            selectionModule.handleGridClick(e);
            autoFillModule?.removeFillHandle?.();
        }

        // Set grid focus AFTER selection to avoid interference
        // This prevents focus management from disrupting the selection process
        if (!focusModule.isGridFocused) {
            focusModule.setGridFocus(true);
        }

        focusModule.handleGridClick(e);

        // Finally handle sorting (if applicable)
        if (!((e.target as Element).closest('.sf-grid-filter-container') || target?.closest('.sf-resize-handler'))) {
            sortModule?.handleGridClick?.(e);
        }
    }, [focusModule, selectionModule, sortModule, groupModule, editModule, isInitialLoad, gridRef, currentViewData, editSettings,
        groupSettings]);

    /**
     * Handle grid-level double-click event for editing
     * Single event handler at grid level instead of per-row handlers
     */
    const handleGridDoubleClick: (e: MouseEvent) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (isChildGrid(e)) {
            return;
        }
        props?.onDoubleClick?.(e);
        // Ensure grid is fully initialized before handling double-clicks
        if (isInitialLoad || !gridRef.current?.element || !currentViewData?.length || isStopPropagationPreventDefault(e)) {
            return;
        }
        const target: Element = e.target as Element;
        const clickedCell: HTMLTableCellElement = target.closest('td[role="gridcell"], th[role="columnheader"]') as HTMLTableCellElement;
        // Only proceed if we clicked on a valid cell
        if (!clickedCell) {
            return;
        }
        editModule?.handleGridDoubleClick(e);
        const rowInfo: RowInfo<T> = gridRef.current?.getRowInfo(clickedCell);
        props.onRowDoubleClick?.({
            event: e,
            cell: rowInfo.cell,
            columnIndex: rowInfo.columnIndex,
            row: rowInfo.row,
            rowIndex: rowInfo.rowIndex,
            data: rowInfo.data,
            column: rowInfo.column
        } as RecordDoubleClickEvent<T>);
        if (target?.closest('.sf-resize-handler')) {
            if (resizeHandlePointerDownTimeout.current) {
                clearTimeout(resizeHandlePointerDownTimeout.current);
                resizeHandlePointerDownTimeout.current = null;
            }
            autoFitModule?.onResizeHandleDoubleClick(e);
        }
    }, [editModule, isInitialLoad, gridRef, currentViewData, editSettings, autoFitModule]);

    const isEllipsisTooltip: boolean = useMemo((): boolean => {
        const col: ColumnProps<T>[] = uiColumns.current ?? columns;
        if (clipMode === 'EllipsisWithTooltip') {
            return true;
        }
        for (let i: number = 0; i < col.length; i++) {
            if (col[parseInt(i.toString(), 10)].clipMode === 'EllipsisWithTooltip') {
                return true;
            }
        }
        return false;
    }, [clipMode, uiColumns.current, columns]);

    /**
     * To create table for ellipsiswithtooltip
     *
     * @param {Element} table - Defines the table
     * @param {string} tag - Defines the tag
     * @param {string} type - Defines the type
     * @returns {HTMLDivElement} Returns the HTML div ELement
     * @private
     */
    const createTable: (table: Element, tag: string, type: string) => HTMLDivElement =
        useCallback((table: Element, tag: string, type: string) => {
            const myTableDiv: HTMLDivElement = createElement('div') as HTMLDivElement;
            myTableDiv.className = gridRef.current?.element.className;
            myTableDiv.style.cssText = 'display: inline-block;visibility:hidden;position:absolute';
            const mySubDiv: HTMLDivElement = createElement('div') as HTMLDivElement;
            mySubDiv.className = tag;
            const myTable: HTMLTableElement = createElement('table') as HTMLTableElement;
            myTable.className = table.className;
            myTable.style.cssText = 'table-layout: auto;width: auto';
            const ele: string = (type === 'Header') ? 'th' : 'td';
            const myTr: HTMLTableRowElement = createElement('tr', {
                attrs: { role: 'row' },
                className: type === 'Header' ? 'sf-grid-header-row' : 'sf-grid-content-row'
            }) as HTMLTableRowElement;
            const mytd: HTMLElement = createElement(ele) as HTMLElement;
            myTr.appendChild(mytd);
            myTable.appendChild(myTr);
            mySubDiv.appendChild(myTable);
            myTableDiv.appendChild(mySubDiv);
            document.body.appendChild(myTableDiv);
            return myTableDiv;
        }, []);

    const ellipsisTooltipEvaluateInfo: {
        htable: HTMLDivElement, ctable: HTMLDivElement,
        create: () => void;
        destroy: () => void
    } = useMemo(() => {
        let htable: HTMLDivElement;
        let ctable: HTMLDivElement;
        const create: () => void = () => {
            const headerTable: Element = gridRef.current?.getHeaderTable?.() ??
                gridRef.current?.element?.querySelector('.sf-grid-header-container table');
            const headerDivTag: string = 'sf-grid-header-container';
            const contentTable: Element = gridRef.current?.getContentTable?.() ??
                gridRef.current?.element?.querySelector('.sf-grid-content-container table');
            const contentDivTag: string = 'sf-grid-content-container';
            if (headerTable && !ellipsisTooltipEvaluateInfo?.htable) {
                ellipsisTooltipEvaluateInfo.htable = createTable(headerTable, headerDivTag, 'Header');
            }
            if (contentTable && !ellipsisTooltipEvaluateInfo?.ctable) {
                ellipsisTooltipEvaluateInfo.ctable = createTable(contentTable, contentDivTag, 'Content');
            }
        };
        const destroy: () => void = () => {
            if (document.body.contains(ellipsisTooltipEvaluateInfo.htable)) {
                document.body.removeChild(ellipsisTooltipEvaluateInfo.htable);
                ellipsisTooltipEvaluateInfo.htable = null;
            }
            if (document.body.contains(ellipsisTooltipEvaluateInfo.ctable)) {
                document.body.removeChild(ellipsisTooltipEvaluateInfo.ctable);
                ellipsisTooltipEvaluateInfo.ctable = null;
            }
        };
        return { htable, ctable, create, destroy };
    }, [currentViewData, editModule?.isEdit, clipMode, uiColumns.current]);

    /**
     * To evaluate sf-ellipsistooltip class required or not
     *
     * @param {HTMLElement} element - Defines the original cell reference element
     * @returns {boolean} Define whether sf-ellipsistooltip class required for cell or not.
     * @private
     */
    const evaluateTooltipStatus: (element: HTMLElement) => boolean =
        useCallback((element: HTMLElement): boolean => {
            if (!ellipsisTooltipEvaluateInfo.htable) {
                ellipsisTooltipEvaluateInfo.create();
            }
            const header: boolean = element?.parentElement?.classList?.contains?.('sf-grid-header-row');
            const table: HTMLDivElement = header ? ellipsisTooltipEvaluateInfo.htable :
                ellipsisTooltipEvaluateInfo.ctable;
            if (!table || !element) {
                return false;
            }
            const ele: string = header ? 'th' : 'td';
            table.querySelector(ele).className = element?.className;
            const targetElement: HTMLElement = table.querySelector(ele);
            targetElement.innerHTML = '';
            Array.from(element?.childNodes).forEach((child: ChildNode) => {
                targetElement.appendChild(child.cloneNode(true));
            });
            const width: number = table.querySelector(ele).getBoundingClientRect().width;
            if (width > element?.getBoundingClientRect?.()?.width) {
                return true;
            }
            return false;
        }, [ellipsisTooltipEvaluateInfo]);

    const getEllipsisTooltipContent: () => string = useCallback(() => {
        return tooltipContent.current;
    }, [tooltipContent.current, uiColumns.current]);

    const handleGridMouseMove: (e: MouseEvent) => void = useCallback((e: MouseEvent) => {
        const resizeHelper: boolean = (e.target as HTMLElement)?.closest?.('.sf-grid')?.querySelector('.sf-grid-resize-helper') ? true : false;
        if (isChildGrid(e) || resizeHelper) {
            return;
        }
        if (isEllipsisTooltip) {
            const element: HTMLElement = (e.target as Element)?.closest('.sf-ellipsistooltip') as HTMLElement;
            if (!element) {
                return;
            }
            if ((element || (e.relatedTarget as Element)?.closest?.('.sf-ellipsistooltip')) && e.type === 'mouseout' &&
                (ellipsisTooltipRef.current?.target?.current !== element ||
                    element !== (e.relatedTarget as Element)?.closest?.('.sf-ellipsistooltip') as HTMLElement)) {
                ellipsisTooltipRef.current?.closeTooltip?.();
            }
            const tagName: string = (e.target as Element).tagName;
            const elemNames: string[] = ['A', 'BUTTON', 'INPUT'];
            if (element && e.type !== 'mouseout' && !(Browser.isDevice && elemNames.indexOf(tagName) !== -1)) {
                if (element?.getElementsByClassName?.('sf-grid-header-text')?.length) {
                    const innerElement: HTMLElement = element.getElementsByClassName('sf-grid-header-text')[0] as HTMLElement;
                    tooltipContent.current = SanitizeHtmlHelper.sanitize(innerElement.innerText);
                } else {
                    tooltipContent.current = SanitizeHtmlHelper.sanitize(element?.innerText);
                }
                if (element !== ellipsisTooltipRef.current?.target?.current) {
                    ellipsisTooltipRef.current?.openTooltip?.(element);
                    requestAnimationFrame(() => {
                        const tooltipPopup: HTMLElement = document.body.querySelector('.sf-ellipsis-tooltip.sf-popup-close');
                        if (tooltipPopup) {
                            tooltipPopup.classList.remove('sf-popup-close'); // seems tooltip maintain class on rapid hover due to our element childNode text length detection delay.
                            tooltipPopup.classList.add('sf-popup-open');
                        }
                    });
                }
            }
        }
    }, [isEllipsisTooltip]);

    const handleGridMouseOut: (e: MouseEvent) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (isChildGrid(e)) {
            return;
        }
        props?.onMouseOut?.(e);
        if (isStopPropagationPreventDefault(e)) { return; }
        handleGridMouseMove(e);
    }, [isEllipsisTooltip]);
    const handleGridMouseOver: (e: MouseEvent) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (isChildGrid(e)) {
            return;
        }
        props?.onMouseOver?.(e);
        if (isStopPropagationPreventDefault(e)) { return; }
        handleGridMouseMove(e);
    }, [isEllipsisTooltip]);

    const handleGridMouseDown: (e: MouseEvent) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (isChildGrid(e)) {
            return;
        }
        props?.onMouseDown?.(e);
        if (isStopPropagationPreventDefault(e)) { return; }
        focusModule.focusByClick = true;
        if ((e.target as Element).closest('.sf-grid-content-container,.sf-grid-header-container') && (e.shiftKey || e.ctrlKey)) {
            e.preventDefault();
        }
        filterModule?.mouseDownHandler?.(e);

        // Forward to cell selection module so drag selection can start on mousedown
        if (selectionSettings?.type === 'Cell' && cellSelectionModule) {
            cellSelectionModule.handleGridMouseDown(e);
            requestAnimationFrame(() => {
                autoFillModule?.showFillHandle?.();
            });
            if (isStopPropagationPreventDefault(e)) {
                return;
            }
        }
    }, [focusModule, filterModule, cellSelectionModule, selectionSettings, isStopPropagationPreventDefault]);

    const handleGridFocus: (e: FocusEvent) => void = useCallback((e: FocusEvent<HTMLDivElement>) => {
        if (isChildGrid(e) || e.target.closest('.sf-excel-filter') || e.target.closest('.sf-datetimepicker')
            || e.target.closest('.sf-excel-filter-dropdown') || e.target.closest('.sf-column-chooser-dialog')) {
            return;
        }
        props?.onFocus?.(e);
        const isGroupDropAreaTarget: boolean = !!(groupSettings.enabled && e.target?.closest('.sf-group-drop-area'));
        const groupDropAreaWithFocusElement: Element = gridRef.current?.element?.querySelector('.sf-group-drop-area.sf-focused');
        if ((pageSettings?.enabled && e.target?.closest('.sf-pager') && e.target.closest('.sf-pager').parentElement === gridRef.current.element)
        || (props?.toolbar?.length && e.target?.closest('.sf-toolbar')?.parentElement === gridRef.current.element) || isStopPropagationPreventDefault(e)
        || e.target.closest('#' + id + 'EditAlert') || e.target.closest('#' + id + 'SelectionDelete') || e.target.closest('.sf-filterbar-dropdown')
        || e.target.classList.contains('sf-virtualrowscrollbar') || e.target.classList.contains('sf-virtualcolumnscrollbar') ||
            isGroupDropAreaTarget) {
            if (isGroupDropAreaTarget && !groupModule?.groupedColumns?.length && !groupDropAreaWithFocusElement) {
                e.target?.classList.add('sf-focused');
            }
            return;
        } else if (groupDropAreaWithFocusElement) {
            groupDropAreaWithFocusElement.classList.remove('sf-focused');
        }
        // Check if grid is in edit mode to prevent focus interference
        const isGridInEditMode: boolean = (editModule?.isEdit && !commandColumnModule?.commandEdit.current) || false;
        const commandEditForm: boolean = commandColumnModule?.commandEdit.current && e?.target?.closest('.sf-grid-edit-form')
            ? true : false;
        // If grid is in edit mode, don't interfere with edit focus management
        // This prevents the focus from jumping to header cell when edit form regains focus
        if (isGridInEditMode || commandEditForm) {
            // Just set grid focus state but don't move focus around
            if (focusModule && !focusModule.isGridFocused) {
                focusModule.setGridFocus(true);
            }
            return;
        }
        // When the grid receives focus, set grid focus state and focus first cell if needed
        if (focusModule && !focusModule.isGridFocused) {
            focusModule.setGridFocus(true);

            // Determine if focus is coming from before or after the grid
            const relatedTarget: HTMLElement = e.relatedTarget as HTMLElement;
            const gridElement: HTMLElement = gridRef.current.element;

            // Check if we can determine the focus direction
            let isForwardTabbing: boolean = true;

            if (relatedTarget) {
                // Try to determine if we're tabbing forward or backward
                // This is a heuristic and may not be 100% accurate in all cases
                const allFocusableElements: Element[] = Array.from(document.querySelectorAll(
                    'div.sf-grid, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                ));

                const gridIndex: number = allFocusableElements.indexOf(gridElement);
                const relatedIndex: number = allFocusableElements.indexOf(relatedTarget);
                const targetIndex: number = allFocusableElements.indexOf(e.target);

                if (gridIndex > -1 && relatedIndex > -1) {
                    isForwardTabbing = relatedIndex < gridIndex;
                    if (gridElement.contains(relatedTarget) && targetIndex > -1) {
                        isForwardTabbing = relatedIndex < targetIndex;
                    } else if (gridElement.contains(relatedTarget) && gridElement.contains(e.target) &&
                        isNullOrUndefined(e.target.getAttribute('tabindex')) && targetIndex === -1) {
                        const bitmask: number = e.target.compareDocumentPosition(relatedTarget);
                        e.target = allFocusableElements[(relatedIndex + (bitmask >= 0 ? 1 : -1)) as number] as HTMLDivElement;
                        isForwardTabbing = bitmask >= 0;
                    }
                }
            }
            if (focusModule.focusByClick) {
                focusModule.focusByClick = false;
                return;
            } else {
                focusModule.focusByClick = false;
            }
            // Only navigate to a cell if no cell is currently focused
            const { getFocusedCell } = focusModule;
            const focusedCell: FocusedCellInfo = getFocusedCell();
            if (focusedCell.rowIndex === -1 && focusedCell.colIndex === -1 && gridRef.current.allowKeyboard) {
                if (!isForwardTabbing) {
                    focusModule.setActiveMatrix(aggregates?.length ? 'Aggregate' : 'Content');
                    const matrix: IFocusMatrix = focusModule.getActiveMatrix();
                    let lastCell: number[] = isSpannedColumns ? [matrix?.matrix?.length - 1, matrix?.matrix?.[matrix?.rows]?.length - 1]
                        : [matrix.rows, matrix.columns];
                    if (matrix.matrix?.[lastCell[0]]?.[lastCell[1]] === 0) {
                        lastCell = matrix.findCellIndex(lastCell, false);
                    }
                    matrix.current = lastCell;
                    requestAnimationFrame(() => { // default shift tab to enter grid content or aggregate browser auto scroll behavior execution taking time allowed here, after that apply our logic to focus proper element.
                        requestAnimationFrame(() => {
                            focusModule?.debounceLastVirtualRowCellFocusHelper(contentRowCount > 0);
                            focusModule.focus(undefined, commandColumnModule?.commandEdit.current ? e : undefined);
                        });
                    });
                    return;
                } else {
                    // When tabbing forward into grid, focus first header cell
                    // But only if we have header content, otherwise focus first content cell
                    if (headerRowCount > 0) {
                        // Use requestAnimationFrame to ensure the DOM is ready
                        // Focus the first cell when tabbing forward into the grid
                        focusModule.navigateToFirstCell();
                    } else {
                        // No header, focus first content cell
                        focusModule.setActiveMatrix('Content');
                        requestAnimationFrame(() => {
                            focusModule.focus();
                        });
                    }
                }
            }
        } else if (focusModule && focusModule.focusByClick) {
            focusModule.focusByClick = false;
        }
    }, [focusModule, editModule, headerRowCount, aggregateRowCount, contentRowCount, groupModule]);

    const handleGridBlur: (e: FocusEvent) => void = useCallback((e: FocusEvent<HTMLDivElement>) => {
        if (isChildGrid(e)) {
            return;
        }
        props?.onBlur?.(e);

        const groupDropAreaWithFocusElement: Element = gridRef.current?.element?.querySelector('.sf-group-drop-area.sf-focused');
        if (groupDropAreaWithFocusElement) {
            groupDropAreaWithFocusElement.classList.remove('sf-focused');
        }
        if ((props?.toolbar?.length && e.target?.closest('.sf-toolbar')?.parentElement === gridRef.current.element) ||
            (groupSettings.enabled && e.target?.closest('.sf-group-drop-area')) ||
            isStopPropagationPreventDefault(e)) {
            return;
        }
        // Check if grid is in edit mode to prevent focus interference
        const isGridInEditMode: boolean = (editModule?.isEdit && !commandColumnModule?.commandEdit.current) || false;
        const commandEditForm: boolean = commandColumnModule?.commandEdit.current && e?.target?.closest('.sf-grid-edit-form')
            ? true : false;

        // If grid is in edit mode, don't interfere with edit focus management
        // This prevents the focus from jumping to header cell when edit form regains focus
        if (isGridInEditMode || commandEditForm) {
            // Just set grid focus state but don't move focus around
            if (focusModule && !focusModule.isGridFocused) {
                focusModule.setGridFocus(true);
            }
            return;
        }

        // When the grid loses focus, update grid focus state
        // Only if focus is truly moving outside the grid
        if (focusModule && focusModule.isGridFocused) {
            // Check if focus is staying within the grid or related elements
            const relatedTarget: HTMLElement = e.relatedTarget as HTMLElement;

            // Don't remove focus if:
            // 1. Focus is moving to another element within the grid
            // 2. Focus is moving to a grid popup
            // 3. Focus is moving to a specific element that should maintain grid focus
            let isStayingInGrid: boolean | Element = (e.target && (e.target as HTMLElement).closest('#' + id + '_toolbar')) ||
                e.target?.closest('.sf-datepicker')  || e.target?.closest('.sf-datetimepicker') || e.target?.closest('.sf-grid-contextmenu')
                || e.target?.closest('.sf-group-drop-area') ||
                // Focus moving to another element within the grid
                (e.currentTarget?.contains(relatedTarget) ||
                    // Focus moving to a grid popup
                    (relatedTarget && (relatedTarget?.closest?.('.sf-grid-popup') || relatedTarget?.closest?.('.sf-grid-contextmenu'))) ||
                    // Focus still within the grid (using document.activeElement)
                    document.activeElement && document.activeElement.closest('.sf-grid')) as boolean;
            isStayingInGrid = relatedTarget && relatedTarget?.closest?.('.sf-pager') ? false : isStayingInGrid;
            const isVirtualFocusStayingInGrid: boolean = isStayingInGrid && relatedTarget &&
                !relatedTarget?.classList?.contains('sf-virtualrowscrollbar') &&
                !relatedTarget?.classList?.contains('sf-virtualcolumnscrollbar');
            if (!isVirtualFocusStayingInGrid) {
                isStayingInGrid = isVirtualFocusStayingInGrid;
            }
            if (!isStayingInGrid) {
                // Clear focus completely when leaving the grid
                focusModule.clearIndicator();
                focusModule.removeFocus();
                focusModule.setGridFocus(false);
                if (virtualizationSettings.enabled && document.activeElement.classList.contains('sf-cell')) {
                    (document.activeElement as HTMLTableCellElement).blur();
                }
            }
        }
    }, [focusModule]);


    const handleGridKeyUp: (e: React.KeyboardEvent) => void = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isChildGrid(e)) {
            return;
        }
        props?.onKeyUp?.(e);
        const target: Element = e.target as Element;
        if (target.closest('.sf-excel-filter') || target.closest('.sf-excel-filter-dropdown') || target.closest('.sf-column-chooser-dialog')) { return; }
        if (isStopPropagationPreventDefault(e)) {
            return;
        }
        if (e.keyCode !== 13) {
            filterModule?.keyUpHandler?.(e as React.KeyboardEvent);
        }
    }, [filterModule]);

    const handleGridKeyDown: (e: React.KeyboardEvent) => void = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isChildGrid(e)) {
            return;
        }
        props?.onKeyDown?.(e);
        const target: Element = e.target as Element;
        const expansionIcon: Element = target.closest('.sf-detail-toggle-icon') || target.querySelector('.sf-detail-toggle-icon');
        if (isMasterDetail && (e.altKey || e.ctrlKey) && (e.code === 'ArrowDown' || e.code === 'ArrowUp') && expansionIcon) {
            const expandCell: HTMLTableCellElement = target.closest('td[role="gridcell"]') as HTMLTableCellElement;
            const rowInfo: RowInfo<T> = gridRef.current?.getRowInfo(expandCell);
            if (rowInfo && ((e.code === 'ArrowDown' && !(expansionState.has(rowInfo.ariaRowIndex))) ||
                (e.code === 'ArrowUp' && (expansionState.has(rowInfo.ariaRowIndex))))) {
                onExpandStateChange(rowInfo.ariaRowIndex, rowInfo.data);
            }
            return;
        }
        // Check for cancellation or specific dropdown open condition
        if (target.closest('.sf-excel-filter') || target.closest('.sf-excel-filter-dropdown') || target.closest('.sf-column-chooser-dialog')) { return; }
        const isDropdownOpenCondition: boolean = editModule?.isEdit &&
                                      target?.closest('.sf-grid-edit-form') &&
                                      (target?.closest('.sf-ddl') || target?.closest('.sf-datepicker')) &&
                                      e.altKey &&
                                      e.code === 'ArrowDown';
        const popupKeyDown: boolean = target?.closest('.sf-datepicker') && target?.closest('.sf-datepicker').classList.contains('sf-popup');
        if (isStopPropagationPreventDefault(e) || isDropdownOpenCondition || editModule?.isDialogOpen ||
            editModule?.isDeleteDialogOpen || popupKeyDown) {
            e.preventDefault();
            e.stopPropagation();
            return; // Early return to prevent further processing
        }
        if (target?.closest('.sf-grid-popup-edit')) {
            if (e.key === 'Enter' && target.closest('.sf-dlg-content')
                && !(target.classList.contains('sf-dropdownlist') && target.getAttribute('aria-expanded') === 'true')) {
                editModule?.saveDataChanges();
            } else if (e.key === 'Escape') {
                editModule?.cancelDataChanges();
            }
            return;
        }
        sortModule?.keyUpHandler?.(e as React.KeyboardEvent);
        if (sortModule && e.keyCode === 13 && closest(e.target as Element, '.sf-grid-header-row .sf-cell')) {
            return;
        }
        const pageAction: boolean = pageSettings?.enabled && (e.target as HTMLElement)?.closest('.sf-pager')
            && (e.target as HTMLElement).closest('.sf-pager').parentElement === gridRef.current.element;
        const toolbarAction: boolean = toolbarModule && props?.toolbar?.length &&
            (e.target as HTMLElement)?.closest('.sf-toolbar')?.parentElement === gridRef.current.element;
        const isGroupDropAreaAction: boolean = !!(groupSettings.enabled && (e.target as HTMLElement)?.closest('.sf-group-drop-area'));
        const commandItemEnter: boolean = (e.target as HTMLElement)?.closest('.sf-grid-command-cell') && e.key === 'Enter';
        if ((e.key === 'Shift' && e.shiftKey) || (e.key === 'Control' && e.ctrlKey) || pageAction || toolbarAction || commandItemEnter
            || (e.target as HTMLElement)?.closest('.sf-grid-contextmenu') || isGroupDropAreaAction) { return; }

        // Enhanced keyboard action handling based on original TypeScript implementation
        // This implements comprehensive keyboard actions including Insert and Delete keys
        const isMacLike: boolean = /(Mac)/i.test(navigator.platform);

        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'H' || e.key === 'h')) {
            if (editModule?.isEdit) {
                return;
            }
            e.preventDefault();
            if (e.shiftKey) {
                void clipboardModule?.copyToClipboard(true);
            }
            else {
                void clipboardModule?.copyToClipboard();
            }
            return;
        }

        // Check for edit form - support both row edit form and cell edit form
        const editForm: HTMLElement | null = (e.target as HTMLElement)?.closest('.sf-grid-edit-form') ||
                                             (e.target as HTMLElement)?.closest('.sf-grid-cell-edit-form');

        // Batch edit: start editing immediately on printable keys when a cell is already focused.
        const isPrintableBatchEditKey: boolean = editModule?.editSettings?.allowBatchSave === true &&
            !editModule?.isEdit &&
            !editForm &&
            !e.ctrlKey && !e.metaKey && !e.altKey &&
            /^[A-Za-z0-9]$/.test(e.key) &&
            !(target as HTMLElement)?.closest('input, textarea, select');

        if (isPrintableBatchEditKey) {
            const focusedCell: FocusedCellInfo = focusModule?.getFocusInfo?.();
            if (focusedCell && !focusedCell.isHeader && !focusedCell.isAggregate) {
                const rowObjects: IRow<ColumnProps<T>>[] = gridRef.current?.getRowsObject?.() ?? [];
                const visibleColumns: ColumnProps<T>[] = gridRef.current?.getVisibleColumns?.() ?? [];
                const rowObject: IRow<ColumnProps<T>> | undefined = rowObjects[focusedCell.rowIndex] as IRow<ColumnProps<T>> | undefined;
                const column: ColumnProps<T> | undefined = visibleColumns[focusedCell.colIndex];
                const primaryKeyField: string | undefined = getPrimaryKeyFieldNames()?.[0];

                if (rowObject?.data && column?.field && !column.isPrimaryKey && column.allowEdit !== false && primaryKeyField) {
                    const primaryKeyValue: string | number | undefined = rowObject.data[primaryKeyField as string];
                    if (!isNullOrUndefined(primaryKeyValue)) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (editModule?.editSettings?.mode === 'Normal') {
                            const rowElement: HTMLTableRowElement | undefined = gridRef.current?.getRowByIndex?.(
                                focusedCell.rowIndex
                            ) as HTMLTableRowElement | undefined;
                            void editModule?.editRecord?.(rowElement, column.field, e.key);
                        } else if (editModule?.editSettings?.mode === 'Cell') {
                            void editModule?.editCell(primaryKeyValue, column.field, rowObject.uid, e.key);
                        }
                        return;
                    }
                }
            }
        }

        // Handle edit-specific keyboard events first
        if (editSettings?.allowEdit || editSettings?.allowAdd || editSettings?.allowDelete) {
            const commandEdit: boolean = commandColumnModule?.commandEdit.current;
            const row: HTMLTableRowElement = target?.closest('.sf-grid-content-row');
            const uid: string = row?.getAttribute('data-uid');
            // Insert key or Mac Cmd+Enter to add record
            if ((e.key === 'Insert' || (isMacLike && e.metaKey && e.key === 'Enter')) &&
                editSettings?.allowAdd && (!editModule?.isEdit || commandEdit)) {
                e.preventDefault();
                editModule?.addRecord?.();
                return;
            }

            // Delete key to delete selected record
            if (e.key === 'Delete' && editModule?.editSettings?.mode !== 'Cell' && editSettings?.allowDelete && (!editModule?.isEdit || commandEdit)) {
                const target: HTMLElement = e.target as HTMLElement;
                // Safety checks: ignore if focus is on input elements (except checkboxes)
                const isInputFocused: boolean = target.tagName === 'INPUT' && !target.classList.contains('sf-checkselect');
                const isDialogOpen: Element = document.querySelector('.sf-popup-open.sf-edit-dialog');

                if (!isInputFocused && !isDialogOpen) {
                    e.preventDefault();
                    editModule?.deleteRecord?.();
                    return;
                }
            }

            // F2 key to start editing
            if (e.key === 'F2' && editModule?.editSettings?.mode !== 'Cell' && (!editModule?.isEdit || commandEdit)) {
                e.preventDefault();
                editModule?.editRecord?.(commandEdit ? row : undefined);
                return;
            }

            // Enter key to save changes (when in edit mode)
            if (editModule && e.key === 'Enter' && editModule?.editSettings?.mode !== 'Cell' && (editModule?.isEdit || commandEdit)) {
                const target: HTMLElement = e.target as HTMLElement;
                // Only handle if not in input field or specific grid context
                if (!target.closest('.sf-unboundcelldiv') &&
                    (target.closest('.sf-grid-content-container') || target.closest('.sf-grid-header-content')) && editForm) {
                    e.preventDefault();
                    editModule.escEnterIndex.current = parseInt((e.target as HTMLElement)?.closest('td')?.getAttribute('aria-colindex'), 10) - 1;
                    // Normal + Batch: stage row changes only; do not persist to datasource here.
                    (editModule?.saveDataChanges as Function)?.(undefined, undefined, 'Key', commandEdit ? uid : undefined);
                    return;
                }
            }

            // Escape key to cancel editing
            if (editModule && e.key === 'Escape' && editModule?.editSettings?.mode !== 'Cell' && (editModule?.isEdit || commandEdit) && editForm) {
                e.preventDefault();
                editModule.escEnterIndex.current = parseInt((e.target as HTMLElement)?.closest('td')?.getAttribute('aria-colindex'), 10) - 1;
                // Normal + Batch: close row form without persisting datasource changes.
                (editModule?.cancelDataChanges as Function)?.('Key', commandEdit ? uid : undefined);
                return;
            }
        }

        const isGridInEditMode: boolean = editModule?.isEdit || commandColumnModule?.commandEdit.current || false;

        // Handle keyboard events in real Cell Edit Mode only.
        // Normal + Batch row editing must not enter the cell-edit keyboard flow.
        if (editModule?.editSettings?.mode === 'Cell' && editModule?.editSettings?.allowEdit) {
            const cellEditKeys: string[] = ['Tab', 'F2', 'Enter', 'Delete', 'Escape'];
            if (cellEditKeys.includes(e.key)) {
                // Delegate all Cell Edit keyboard events to consolidated handler for better separation of concerns
                editModule?.handleCellEditKeyDown?.(
                    e,
                    focusModule?.navigateToNextCell
                ).catch?.((err: Error) => {
                    console.error('Error handling keyboard event in Cell edit mode:', err);
                });
            }
        }

        // Handle Tab key for Row edit mode (Normal/Popup/PopupTemplate)
        if (isGridInEditMode && e.key === 'Tab' && editForm && editModule?.editSettings?.mode !== 'Cell' && editModule?.editSettings?.allowBatchSave !== true) {
            // Row mode: use the standard editCellTab event for Tab navigation
            const tabEvent: CustomEvent = new CustomEvent('editCellTab', {
                detail: {
                    field: getColumnByUid((e.target as HTMLElement)?.closest('td')?.getAttribute('data-mappinguid')).field,
                    direction: e.shiftKey ? 'backward' : 'forward',
                    originalEvent: e
                }
            });
            editForm?.dispatchEvent(tabEvent);
            return;
        }

        // Handle keyboard navigation
        if (!target?.closest('.sf-filter-template-cell')) {
            filterModule?.keyUpHandler?.(e as React.KeyboardEvent);
        }
        const { getFocusInfo } = focusModule;
        const focusedCell: FocusedCellInfo = getFocusInfo();
        // Check if we're on the first header cell and pressing Shift+Tab
        const isFirstHeaderCell: boolean = focusedCell.isHeader &&
            focusedCell.rowIndex === focusModule.firstFocusableHeaderCellIndex?.[0] &&
            focusedCell.colIndex === focusModule.firstFocusableHeaderCellIndex?.[1];
        const isShiftTab: boolean = e.key === 'Tab' && e.shiftKey;

        // Check if we're on the last content cell and pressing Tab
        const activeMatrix: IFocusMatrix = focusModule.getActiveMatrix();
        const lastSpanColIndex: number = activeMatrix?.matrix?.[focusedCell.rowIndex]?.length - 1;
        const isLastContentCell: boolean = !focusedCell.isHeader && !aggregates?.length &&
            (focusedCell.rowIndex === focusModule.lastFocusableContentCellIndex?.[0] &&
            focusedCell.colIndex === focusModule.lastFocusableContentCellIndex?.[1] ||
            // Also check if on actual last visible cell (accounts for spanning cells not in matrix)
            focusedCell.rowIndex === focusModule.lastFocusableContentCellIndex?.[0] && focusedCell.colIndex >= lastSpanColIndex) &&
            !focusModule.isNextCommandItem(e);
        const isLastAggregateCell: boolean = focusedCell.isAggregate &&
            focusedCell.rowIndex === focusModule.lastFocusableAggregateCellIndex?.[0] &&
            focusedCell.colIndex === focusModule.lastFocusableAggregateCellIndex?.[1];
        const isTab: boolean = e.key === 'Tab' && !e.shiftKey;

        // If we're on the first header cell and pressing Shift+Tab, or
        // on the last content cell and pressing Tab, let the default behavior happen
        if ((isFirstHeaderCell && isShiftTab) || ((isLastContentCell || isLastAggregateCell) && isTab)) {
            // Clear focus completely
            focusModule.clearIndicator();
            focusModule.removeFocus();
            focusModule.setGridFocus(false);

            // Don't prevent default to allow natural tab navigation
            return;
        }

        const isInMaskVirtualLoadingCell: boolean | Element = target?.querySelector('.sf-cell .sf-skeleton');
        if (isInMaskVirtualLoadingCell && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Handle cell selection keyboard navigation if enabled
        if (selectionSettings?.type === 'Cell' && cellSelectionModule) {
            cellSelectionModule.handleKeyDown(e);
        }

        // Handle caption row toggle (group expand/collapse) - FIRST, similar to selection module pattern
        const captionButton: HTMLElement | null = target?.closest('.sf-group-togglebtn') as HTMLElement | null;
        const captionRow: Element | null = target.closest('.sf-grid-groupcaptionrow');
        const rowObject: IRow<ColumnProps<T>> = captionRow ? gridRef.current?.getRowObjectFromUID(captionRow.getAttribute('data-uid')) :
            undefined;
        const isAltGroupToggleAction: boolean = e.altKey && rowObject?.isCaptionRow && ((e.code === 'ArrowDown' &&
            !rowObject?.isExpand) || (e.code === 'ArrowUp' && rowObject?.isExpand));
        const isCtrlGroupExpandCollapseAllAction: boolean = e.ctrlKey && (e.code === 'ArrowDown' || e.code === 'ArrowUp');
        const groupableHeaderCell: HTMLTableCellElement = e.ctrlKey && e.code === 'Space' && target?.closest('th.sf-cell');
        if (groupSettings?.enabled) {
            if (captionButton && captionRow && groupModule && (isAltGroupToggleAction || (captionButton && e.code === 'Enter'))) {
                const rowInfo: RowInfo<T> = gridRef.current?.getRowInfo(captionRow);
                if (rowInfo?.data) {
                    // Pass the entire row object (GroupedData) to toggleGroup
                    groupModule?.toggleGroup(rowInfo);
                    const colIndex: number = parseInt(target?.closest('td')?.getAttribute('data-colindex') ?? '1', 10) - 1;
                    requestAnimationFrame(() => {
                        // After toggling the group, move focus back to the caption cell to maintain focus context
                        focusModule.navigateToCell(rowInfo.rowIndex, colIndex, 'Content', undefined, true);
                    });
                    e.preventDefault();
                    return;
                }
            } else if (captionButton && isCtrlGroupExpandCollapseAllAction) {
                const tempFocusedCellInfo: FocusedCellInfo = {...focusModule?.focusedCell.current};
                const matrixType: Matrix = tempFocusedCellInfo.isAggregate ? 'Aggregate' : (tempFocusedCellInfo.isHeader ? 'Header' :
                    'Content');
                gridRef.current.contentScrollRef.scrollTop = 0;
                gridRef.current.scrollModule.virtualRowInfo.startIndex = 0;
                if (e.code === 'ArrowDown') {
                    groupModule?.expandAll();
                } else {
                    groupModule?.collapseAll();
                }
                requestAnimationFrame(() => {
                    if (rowObject.indent > 1) {
                        focusModule.navigateToCell(0, 0, matrixType);
                    } else {
                        focusModule.navigateToCell(0, tempFocusedCellInfo.colIndex, matrixType);
                    }
                });
                e.preventDefault();
                return;
            } else if (groupableHeaderCell) {
                const headerCellUid: string = groupableHeaderCell.querySelector('.sf-grid-header-cell')?.getAttribute('data-mappinguid');
                const field: string = getVisibleColumns?.()?.find((column: ColumnProps) => column.uid === headerCellUid)?.field;
                groupModule?.groupColumn([field]);
            }
        }
        // Otherwise, handle navigation normally
        focusModule.handleKeyDown(e);
    }, [focusModule, filterModule, editSettings, editModule, selectionSettings, cellSelectionModule, clipboardModule]);

    const handleGridPointerDown: (e: React.PointerEvent) => void = useCallback((e: React.PointerEvent) => {
        const target: HTMLElement = e.target as HTMLElement;
        if (target?.closest('.sf-resize-handler')) {
            if (resizeHandlePointerDownTimeout.current) {
                clearTimeout(resizeHandlePointerDownTimeout.current);
            }
            resizeHandlePointerDownTimeout.current = setTimeout(() => {
                const groupingHelper: boolean = (target as HTMLElement)?.closest?.('.sf-grid')?.querySelector('.sf-groupable-header-clone') ? true : false;
                if (groupingHelper) { return; }
                resizeModule?.onResizeHandlePointerDown(e);
                resizeHandlePointerDownTimeout.current = null;
            }, 200);
        } else if (reorderModule?.reorderSettings?.enabled && target?.closest('.sf-grid-header-row') && target?.closest('.sf-cell')) {
            reorderModule?.onColumnPointerDown(e);
        }
    }, [resizeModule, reorderModule]);

    const handleGridPointerUp: (e: React.PointerEvent) => void = useCallback((_e: React.PointerEvent) => {
        if (resizeHandlePointerDownTimeout.current) {
            clearTimeout(resizeHandlePointerDownTimeout.current);
            resizeHandlePointerDownTimeout.current = null;
        }
    }, []);

    useEffect(() => {
        if (allowKeyboard) {
            document.body.addEventListener('keydown', keyDownHandler);
        }
        return () => {
            if (allowKeyboard) {
                document.body.removeEventListener('keydown', keyDownHandler);
            }
        };
    }, [allowKeyboard, visibleColumns, gridRef.current?.scrollModule?.virtualColumnInfo.columns]);

    // Initialize grid and handle cleanup
    useEffect(() => {
        // Set up focus management when grid mounts
        // Set the first focusable element's tabIndex to 0
        focusModule.setFirstFocusableTabIndex();
        preRender('grid');
        initializeTelemetry('DataGrid');
        setGridTelemetryFeatureList<T>(props, { aggregates });
        setGridModuleInjectionWarning<T>(props, { aggregates, isCommandEditEnabled });
        if (props.onGridInit) {
            props.onGridInit(); // trigger only once on initial render, once Dom element mounted.
        }
        isInitialBeforePaint.current = false;
        if (enableDevMode && isInitialLoad && scrollMode === ScrollMode.Infinite && (aggregates?.length ||
            (groupSettings?.enabled && groupSettings?.columns?.length && groupCaptionAggregateType.size))) {
            console.warn(AGGREGATE_INFINITE_SCROLL_MESSAGE);
        }
        if (enableDevMode && isInitialLoad && scrollMode === ScrollMode.Infinite && groupSettings?.enabled &&
            groupSettings?.columns?.length) {
            console.warn(GROUP_INFINITE_SCROLL_MESSAGE);
        }

        if (enableDevMode && isInitialLoad && pageSettings?.enabled && (scrollMode === ScrollMode.Virtual ||
            scrollMode === ScrollMode.Infinite)) {
            console.warn(PAGER_WITH_SERVER_VIRTUAL_INFINITE_SCROLL_MESSAGE);
        }
        return () => {
            const gridProperties: object = {
                pageSettings: gridRef?.current?.pageSettings,
                sortSettings: gridRef?.current?.sortSettings,
                groupSettings: gridRef?.current?.groupSettings,
                searchSettings: gridRef?.current?.searchSettings,
                filterSettings: gridRef?.current?.filterSettings,
                selectedRowIndexes: gridRef?.current?.selectedRowIndexes,
                columns: gridRef.current?.columns,
                defaultExpandedRows: gridRef.current?.defaultExpandedRows
            };
            if (gridRef?.current?.isChildrenGrid) {
                window.localStorage.setItem(gridRef?.current?.id, JSON.stringify(gridProperties));
            } else {
                clearChildGridLocalStorage(!gridRef?.current?.isChildrenGrid &&
                    !isNullOrUndefined(gridRef?.current?.detailCellRendererParams));
            }
            props.onGridDestroy?.();
            window.localStorage.removeItem((gridRef?.current?.getDataModule() as {dataManager: {guidId: string}})?.dataManager?.guidId);
            isInitialBeforePaint.current = null;
        };
    }, []);

    useEffect(() => {
        isInitialBeforePaint.current = false;
    }, [columnsDirective]);

    // Only update the ref if props has meaningfully changed
    useEffect(() => {
        stableRest.current = props;
    }, [props]); // we might use a custom comparison for props here to avoid re-render.

    /**
     * @private
     */
    const getGroupCaptionAggregateType: () => Map<string, string[]> = useCallback(() => {
        return groupCaptionAggregateType;
    }, [groupCaptionAggregateType]);

    const isInitialResize: RefObject<boolean> = useRef(true);
    const previousObservedWidth: RefObject<number> = useRef(null);
    const disableResizeObserver: RefObject<boolean> = useRef<boolean>(false);
    useEffect(() => {
        isInitialResize.current = true;
        previousObservedWidth.current = null;
        disableResizeObserver.current = false;
        let resizeStopTimer: number;
        const observer: ResizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
            const observedWidth: number = entries[0]?.contentRect.width;
            if (previousObservedWidth.current === observedWidth) {
                return;
            }
            previousObservedWidth.current = observedWidth;
            if (isInitialResize.current) {
                isInitialResize.current = false;
                return;
            }
            clearTimeout(resizeStopTimer);
            resizeStopTimer = window.setTimeout(() => {
                if (columnWidthInfo.current.hasDynamicWidth && !columnWidthInfo.current.resizeTableWidth) {
                    columnWidthInfo.current.renderInitialWidth = true;
                    setColumnWidthState({});
                }
            }, resizeSettings.throttle);
        });
        if (gridRef.current?.element) {
            observer.observe(gridRef.current.element);
        }
        return () => {
            clearTimeout(resizeStopTimer);
            observer.disconnect();
        };
    }, [resizeSettings]);

    const setColumnWidths: (gridRef: RefObject<GridRef>, uiColumns: ColumnProps<T>[]) => void =
        useCallback((gridRef: RefObject<GridRef>, uiColumns: ColumnProps<T>[]): void => {
            const contentTable: HTMLTableElement = gridRef.current.getContentTable?.();
            const initialTableWidth: number = contentTable?.getBoundingClientRect().width;
            const headerTable: HTMLElement = gridRef.current.getHeaderTable();
            const proposedWidths: Map<string, number> = new Map();
            for (let i: number = 0; i < uiColumns.length; i++) {
                const column: ColumnProps<T> = uiColumns[i as number];
                const div: Element = headerTable?.querySelector('[data-mappinguid="' + column.uid + '"]');
                if (div) {
                    const width: number = div.closest('.sf-cell').getBoundingClientRect().width;
                    proposedWidths.set(column.uid, width);
                }
            }

            interface WidthEntry {
                column: ColumnProps<T>;
                width: number;
                frozen: boolean;
            }
            const entries: WidthEntry[] = [];
            for (let i: number = 0; i < uiColumns.length; i++) {
                const column: ColumnProps<T> = uiColumns[i as number];
                if (proposedWidths.has(column.uid)) {
                    const autoFitMode: AutoFitMode = column.autoFit ?? autoFit;
                    const isAutoFit: boolean = autoFitModule && isInitialLoad && autoFitMode
                        && !(column.type === ColumnType.Checkbox || column.type === ColumnType.Command);
                    const entry: WidthEntry = {
                        column: column,
                        width: proposedWidths.get(column.uid) as number,
                        frozen: false
                    };
                    if (isAutoFit) {
                        entry.width = autoFitModule?.autoFitColumn(column, autoFitMode);
                        entry.frozen = true;
                    }
                    if (!isNullOrUndefined(column.minWidth) && entry.width < column.minWidth) {
                        entry.width = column.minWidth;
                        entry.frozen = true;
                    } else if (!isNullOrUndefined(column.maxWidth) && entry.width > column.maxWidth) {
                        entry.width = column.maxWidth;
                        entry.frozen = true;
                    }
                    entries.push(entry);
                }
            }

            let active: WidthEntry[] = entries.filter((entry: WidthEntry) => !entry.frozen);
            const entriesWidth: number = entries.reduce((sum: number, entry: WidthEntry) => sum + entry.width, 0);
            let remainingWidth: number = initialTableWidth - entriesWidth;
            let safetyGuard: number = entries.length + 1;
            while (active.length && remainingWidth !== 0 && safetyGuard-- > 0) {
                const nextActive: WidthEntry[] = [];
                let allocatedWidth: number = 0;
                const widthPerActiveColumn: number = remainingWidth / active.length;
                for (let i: number = 0; i < active.length; i++) {
                    const entry: WidthEntry = active[i as number];
                    const previousWidth: number = entry.width;
                    const requestedWidth: number = previousWidth + widthPerActiveColumn;
                    const constrainedWidth: number = applyColumnWidthConstraints(entry.column, requestedWidth);
                    entry.width = constrainedWidth;
                    allocatedWidth += constrainedWidth - previousWidth;
                    if (constrainedWidth === requestedWidth) {
                        nextActive.push(entry);
                    } else {
                        entry.frozen = true;
                    }
                }
                remainingWidth -= allocatedWidth;
                if (nextActive.length === active.length) {
                    break;
                }
                active = nextActive;
            }

            for (let i: number = 0; i < entries.length; i++) {
                const entry: WidthEntry = entries[i as number];
                entry.column.width = entry.width + 'px';
            }
        }, [autoFit, autoFitModule, isInitialLoad]);

    useEffect(() => {
        if (uiColumns.current && !columnWidthInfo.current.resizeTableWidth && (columnWidthInfo.current.hasDynamicWidth
            || (isInitialLoad && (columnWidthInfo.current.hasAutoFitWidth || autoFit)))) {
            if (columnWidthInfo.current.widthProcess) {
                columnWidthInfo.current.widthProcess = false;
            } else {
                setColumnWidths(gridRef, uiColumns.current);
                columnWidthInfo.current.widthProcess = true;
                setColumnWidthState({});
            }
        }

        const contentTable: HTMLTableElement = gridRef.current.getContentTable?.();
        const content: Element = contentTable.closest('.sf-grid-content');
        const headerTable: HTMLTableElement = gridRef.current.getHeaderTable?.();
        const footerTable: HTMLTableElement = gridRef.current.getFooterTable?.();
        const tableBorderClass: string = 'sf-grid-table-border';

        if (contentTable?.getBoundingClientRect().width < content?.clientWidth) {
            contentTable?.classList.add(tableBorderClass);
            headerTable?.classList.add(tableBorderClass);
            footerTable?.classList.add(tableBorderClass);
        } else {
            contentTable?.classList.remove(tableBorderClass);
            headerTable?.classList.remove(tableBorderClass);
            footerTable?.classList.remove(tableBorderClass);
        }
    }, [colElements, uiColumns.current]);

    /**
     * Private API for internal grid operations
     */
    const gridInternal: GridResult<T>['gridInternal'] = useMemo(() => ({
        styles,
        isEllipsisTooltip,
        setCurrentViewData,
        setInitialLoad,
        handleGridClick,
        handleGridDoubleClick,
        handleGridMouseDown,
        handleGridMouseOut,
        handleGridMouseOver,
        getEllipsisTooltipContent,
        handleGridFocus,
        handleGridBlur,
        handleGridKeyDown,
        handleGridKeyUp,
        setCurrentPage,
        setTotalRecordsCount,
        setGridAction,
        handleGridPointerDown,
        handleGridPointerUp
    }), [styles, setCurrentViewData, handleGridClick, handleGridDoubleClick, setCurrentPage, setTotalRecordsCount,
        setGridAction, handleGridMouseDown, handleGridMouseOut, handleGridMouseOver, getEllipsisTooltipContent,
        handleGridPointerDown, handleGridPointerUp]);

    // Ensure fill handle renders/cleans up when cell selection changes
    const selectedCellCount: number = cellSelectionModule?.selectedCells?.size ?? 0;
    useEffect(() => {
        if (selectionSettings?.type === 'Cell' && selectionSettings?.enabled) {
            autoFillModule?.showFillHandle?.();
        } else {
            autoFillModule?.removeFillHandle?.();
        }
    }, [selectedCellCount, selectionSettings?.type, selectionSettings?.enabled]);


    /**
     * Public API exposed to consumers of the grid
     * Always keep memorized public APIs for Grid component context provider
     * This will prevent unnecessary re-rendering of child components
     * These are for readonly purpose - if a property needs to be updated,
     * it should not be included here but in the protected API
     */
    const gridAPI: IGrid<T> = useMemo(() => ({
        ...stableRest.current,
        getVisibleColumns,
        stackedHeaderColumns,
        stackedFlattedColumns,
        visibleStackedHeaderColumns: visibleStackedHeaderColumns,
        allStackedColumnProps,
        stackedFlattedColumnProps,
        stackedRowEntries,
        isStackedHeader,
        getColumnByUid,
        getColumnByField,
        getData,
        getHiddenColumns,
        getRowInfo,
        getPrimaryKeyFieldNames,
        setRowData,
        setCellValue,
        saveBulkChanges,
        setRowDataAsync,
        setCellValueAsync,
        saveBulkChangesAsync,
        copyToClipboard: clipboardModule?.copyToClipboard,
        pasteFromClipboard: clipboardModule?.pasteFromClipboard,
        cutToClipboard: clipboardModule?.cutToClipboard,
        applyFill: autoFillModule?.applyFill,
        autoFillModule,
        serviceLocator,
        className,
        dataSource: dataOperations.dataManager,
        id,
        height,
        children,
        clipMode,
        enableGridChart,
        width,
        enableRtl,
        enableHover,
        enableDevMode,
        selectionSettings,
        gridLines,
        filterSettings: filterModule?.filterSettings ?? filterSettings,
        resizeSettings: resizeModule?.resizeSettings ?? resizeSettings,
        autoFit: autoFitModule?.autoFit ?? autoFit,
        sortSettings: sortModule?.sortSettings,
        searchSettings: searchModule?.searchSettings ?? searchSettings,
        detailGridModule,
        pageSettings,
        textWrapSettings,
        enableHtmlSanitizer,
        enableStickyHeader,
        rowHeight,
        enableAltRow,
        rowNumberSettings,
        columns,
        isSpannedColumns,
        locale,
        query,
        emptyRecordTemplate,
        rowTemplate,
        detailRowTemplate,
        isMasterDetail,
        detailRowHeight,
        defaultExpandedRows,
        aggregates,
        editSettings,
        allowKeyboard,
        columnChooserSettings: props.columnChooserSettings,
        getRowHeight,
        onExpandStateChange,
        theme,
        loadingIndicatorSettings,
        contextMenuSettings,
        virtualizationSettings,
        groupSettings: groupModule?.groupSettings ?? groupSettings,
        pinningSettings,
        undo: undoRedoModule?.undo,
        redo: undoRedoModule?.redo,
        getUndoActionsCount: undoRedoModule?.getUndoActionsCount,
        getRedoActionsCount: undoRedoModule?.getRedoActionsCount,
        clearUndoRedoHistory: undoRedoModule?.clearHistory
    } as IGrid<T>), [
        getVisibleColumns,
        stackedHeaderColumns,
        visibleStackedHeaderColumns,
        allStackedColumnProps,
        stackedFlattedColumnProps,
        stackedRowEntries,
        isStackedHeader,
        getColumnByUid,
        getColumnByField,
        getData,
        getHiddenColumns,
        getRowInfo,
        getPrimaryKeyFieldNames,
        setRowData,
        setCellValue,
        saveBulkChanges,
        setRowDataAsync,
        setCellValueAsync,
        saveBulkChangesAsync,
        clipboardModule,
        autoFillModule,
        serviceLocator,
        className,
        dataOperations.dataManager,
        id,
        height,
        children,
        clipMode,
        enableGridChart,
        width,
        enableRtl,
        enableHover,
        enableDevMode,
        selectionSettings,
        gridLines,
        filterModule?.filterSettings,
        resizeModule?.resizeSettings,
        autoFitModule?.autoFit,
        sortModule?.sortSettings,
        searchModule?.searchSettings,
        detailGridModule,
        pageSettings,
        textWrapSettings,
        enableHtmlSanitizer,
        enableStickyHeader,
        rowHeight,
        enableAltRow,
        rowNumberSettings,
        columns,
        locale,
        query,
        emptyRecordTemplate,
        rowTemplate,
        detailRowTemplate,
        isMasterDetail,
        detailRowHeight,
        defaultExpandedRows,
        aggregates,
        allowKeyboard,
        getRowHeight,
        onExpandStateChange,
        theme,
        loadingIndicatorSettings,
        contextMenuSettings,
        groupModule?.groupSettings,
        pinningSettings,
        undoRedoModule,
        props
    ]);

    /**
     * Protected API for internal grid components
     */
    const gridScoped: Partial<MutableGridBase<T>> = useMemo(() => ({
        currentViewData,
        pageWiseGroupResponseViewData,
        setPageWiseGroupResponseViewData,
        virtualCachedViewData,
        setVirtualCachedViewData,
        columnsDirective,
        headerRowDepth,
        colElements,
        isInitialLoad,
        focusModule,
        selectionModule,
        cellSelectionModule,
        getParentElement,
        evaluateTooltipStatus,
        sortModule,
        searchModule,
        filterModule,
        groupModule,
        pinningModule,
        editModule,
        formulaModule,
        aggregateSelection,
        toolbarModule,
        pagerModule,
        contextMenuModule,
        columnChooserModule,
        currentPage,
        totalRecordsCount,
        expandedGroupCountRef,
        loadedPageWiseGroupExpandedCountRef,
        loadedPageWiseVirtualGroupStartEndRowIndexes,
        gridAction,
        isInitialBeforePaint,
        uiColumns,
        cssClass,
        responseData,
        setResponseData,
        dataModule,
        commandColumnModule,
        isCheckBoxColumn,
        offsetX,
        offsetY,
        setOffsetX,
        setOffsetY,
        totalVirtualColumnWidth,
        columnOffsets,
        virtualSettings,
        scrollMode,
        setColumnChooserState,
        infiniteScrollState,
        setInfiniteScrollState,
        expansionState,
        singleGroupColumn,
        groupCaptionAggregateType,
        fieldOrderMap,
        uidOrderMap,
        columnMap,
        columnUidMap,
        leftPinnedColumns,
        rightPinnedColumns,
        resizeModule,
        autoFitModule,
        reorderModule,
        columnWidthInfo,
        setColumnWidthState,
        disableResizeObserver,
        aggregateModule,
        treeModule,
        isOffline,
        treeDataSettings,
        isChildrenGrid
    }), [currentViewData, virtualCachedViewData, columnsDirective, headerRowDepth, colElements, isInitialLoad, focusModule, groupModule,
        selectionModule, cellSelectionModule, getParentElement, sortModule, searchModule, filterModule, editModule, sortSettings,
        searchSettings, evaluateTooltipStatus, uiColumns.current, setVirtualCachedViewData, currentPage, totalRecordsCount, gridAction,
        isInitialBeforePaint, cssClass, responseData, setResponseData, dataModule, offsetX, offsetY, setOffsetX, setOffsetY,
        totalVirtualColumnWidth, commandColumnModule, columnOffsets, virtualSettings, scrollMode, setColumnChooserState, isCheckBoxColumn,
        aggregateSelection, infiniteScrollState, expansionState, expandedGroupCountRef, singleGroupColumn, groupCaptionAggregateType,
        loadedPageWiseGroupExpandedCountRef, pageWiseGroupResponseViewData, setPageWiseGroupResponseViewData, aggregateModule,
        loadedPageWiseVirtualGroupStartEndRowIndexes, fieldOrderMap, uidOrderMap, columnMap, columnUidMap,
        leftPinnedColumns, rightPinnedColumns, resizeModule,
        autoFitModule, columnWidthInfo, setColumnWidthState, pagerModule, contextMenuModule, columnChooserModule, reorderModule,
        pinningModule, formulaModule, treeModule, isOffline, treeDataSettings, isChildrenGrid
    ]);

    useEffect(() => {
        gridRef.current = {
            ...gridRef.current,
            ...gridAPI,
            // Ensure currentViewData is always up-to-date in gridRef
            currentViewData: currentViewData,
            getGroupCaptionAggregateType
        };
        ellipsisTooltipEvaluateInfo.destroy();
    }, [gridAPI, currentViewData, ellipsisTooltipEvaluateInfo]);

    return { gridInternal, gridAPI, gridScoped };
};
