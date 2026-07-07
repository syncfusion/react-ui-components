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
    SetStateAction
} from 'react';
import {
    Browser,
    closest,
    isNullOrUndefined,
    formatUnit,
    getValue,
    IL10n,
    L10n,
    removeClass,
    useProviderContext,
    SanitizeHtmlHelper,
    createElement,
    preRender
} from '@syncfusion/react-base';
import { useValueFormatter, createServiceLocator } from '../services';
import { Query, DataManager, DataResult, QueryOptions, ReturnType as DataReturnType } from '@syncfusion/react-data';
import {
    MutableGridBase,
    IValueFormatter,
    DataRequestEvent,
    GridLine,
    IRow,
    ClipMode,
    DataChangeRequestEvent,
    PendingState,
    FilterPredicates,
    ValueType,
    SelectionMode,
    UseCommandColumnResult,
    Theme,
    ThemeDefaults,
    VirtualizationSettings,
    VirtualDomType,
    VirtualBufferSettings,
    AutoSelectMode,
    LoadingIndicatorType,
    CellSelectionModel,
    ContextMenuSettings,
    ActionType,
    GroupedData, GroupSettings,
    GroupType
} from '../types';
import { selectionModule, SelectionSettings } from '../types/selection.interfaces';
import { SortDescriptor, SortSettings, SortModule } from '../types/sort.interfaces';
import { GridRef, TextWrapSettings, RowInfo, IGrid, IGridBase, RecordDoubleClickEvent, LoadingIndicatorSettings } from '../types/grid.interfaces';
import { filterModule, FilterSettings } from '../types/filter.interfaces';
import { editModule, EditSettings } from '../types/edit.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { AggregateRowProps } from '../types/aggregate.interfaces';
import { CellFocusEvent, FocusedCellInfo, IFocusMatrix, Matrix } from '../types/focus.interfaces';
import { PagerArgsInfo, PageSettings } from '../types/page.interfaces';
import { searchModule, SearchSettings } from '../types/search.interfaces';
import { ToolbarAPI } from '../types/toolbar.interfaces';
import { ServiceLocator, UseDataResult, GridResult, UseAggregateSelectionResult } from '../types/interfaces';
import {
    useAggregates, useColumns, useSelection, useSort, useSearch, useEdit, useToolbar,
    useFocusStrategy, useFilter, useAggregateSelection, useCellSelection, useGroup,
    UseGroupResult
} from './index';
import { useData } from '../models';
import { iterateArrayOrObject } from '../utils';
import { ITooltip } from '@syncfusion/react-popups';
import { useCommandColumn } from './useCommandColumn';
import { ScrollMode, VirtualSettings } from '../types';
import { InfiniteScrollState } from '../types/infinite-scroll.interface';
import { DetailRowTemplate, RowCollapseEvent, RowExpandEvent } from '../types/master-detail';

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
    updateButtonLabel: 'Update',
    deleteButtonLabel: 'Delete',
    editRowLabel: 'Edit this row',
    deleteRowLabel: 'Delete this row',
    updateRowLabel: 'Save changes to this row',
    cancelRowLabel: 'Cancel editing this row',
    commandActionsLabel: 'Command actions',
    searchButtonLabel: 'Search',
    unsavedChangesConfirmation: 'Unsaved changes will be lost. Are you sure you want to continue?',
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
    SelectAllRows: 'Select all rows',
    SelectRow: 'Select row',
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
    SelectAll: 'Select All',
    NoMatches: 'No matches found',
    ChooseColumns: 'Choose Column',
    NoResult: 'No matches found',
    ClearFilter: 'Clear Filter',
    Clear: 'Clear',
    SortAtoZ: 'Sort A to Z',
    SortZtoA: 'Sort Z to A',
    SortByOldest: 'Sort by Oldest',
    SortByNewest: 'Sort by Newest',
    SortSmallestToLargest: 'Sort Smallest to Largest',
    SortLargestToSmallest: 'Sort Largest to Smallest',
    AddCurrentSelection: 'Add current selection to filter',
    Blanks: 'Blanks',
    OKButton: 'OK',
    CancelButton: 'Cancel',
    Primary: 'Default',
    advanced: 'Advanced',
    enterValue: 'Enter value',
    and: 'AND',
    or: 'OR',
    FilterTrue: 'True',
    FilterFalse: 'False',
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
    CheckBox: 'Check Box',
    Expanded: 'Expanded',
    Collapsed: 'Collapsed',
    singleColumnGroupLabel: 'Group',
    groupDropAreaLabel: 'Group drop area',
    groupDropAreaHintText: 'Drag a column header here to group its column'
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
    HIDE_LINES: 'sf-hide-lines'
};

const KEY_CODES: Record<string, number> = {
    ALT_J: 74,
    ALT_W: 87,
    ENTER: 13
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
    const aggregates: AggregateRowProps[] = useAggregates<T>(props, gridRef);




    const [currentViewData, setCurrentViewData] = useState<T[]>([]);
    const [pageWiseGroupResponseViewData, setPageWiseGroupResponseViewData] = useState<Map<number, GroupedData<T>[]>>(new Map());
    const [virtualCachedViewData, setVirtualCachedViewData] = useState<Map<number, T>>(new Map());

    const uiColumns: RefObject<ColumnProps<T>[]> = useRef([]);
    const { columns: preparedColumns, children, headerRowDepth, colElements, uiColumns: noTypeUiColumns, isCheckBoxColumn,
        totalVirtualColumnWidth, columnOffsets, visibleColumns, isCommandEditEnabled, setColumnChooserState,
        isAutoHeightEnabled, isSpannedColumns, singleGroupColumn, groupCaptionAggregateType } = useColumns<T>({
        ...props }, serviceLocator, gridRef, dataState, isInitialBeforePaint, currentViewData, uiColumns.current);
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
        mode: props.filterSettings?.mode ?? (props.filterSettings?.type === 'Excel' || props.filterSettings?.type === 'CheckBox' ? 'OnEnter' : 'Immediate'),
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
            autoRefreshOnEdit: props.groupSettings?.autoRefreshOnEdit || true
        };
    }, [props.groupSettings, props.groupSettings?.columns]);

    const [gridAction, setGridAction] = useState<Object>({});

    // Update the `currentPage` state value with the `pageSettings` changes
    useEffect(() => {
        if (props.pageSettings?.currentPage && currentPage !== props.pageSettings?.currentPage) {
            gridRef.current.goToPage?.(props.pageSettings?.currentPage);
        }
    }, [props.pageSettings]);

    const [currentPage, setCurrentPage] = useState<number>(props.pageSettings?.currentPage || 1);
    const [totalRecordsCount, setTotalRecordsCount] = useState<number>(props.pageSettings?.estimatedTotalRecordsCount || 0);
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

        const scrollModeOverrideMessage: string = [
            'Syncfusion Pure React Data Grid:',
            '- Local in-memory data does not require server-side handling for Virtual (Known Count)' +
            ' and Infinite (Unknown Count) ScrollModes.',
            '- Detected incompatible configuration with array data source.',
            '- Overriding scrollMode to Auto for optimal performance.',
            '- Learn more: https://react.syncfusion.com/react-ui/data-grid/scrolling/configuration/#scroll-modes'
        ].join('\n');

        const disableRowDOMVirtualizationMessage: string = [
            'Syncfusion Pure React Data Grid:',
            '- Disabling DOM virtualization on server-side Virtual (Known Count) and Infinite' +
            ' (Unknown Count) ScrollModes is not supported due to invalid configuration.',
            '- Detected incompatible configuration with server-side performance optimization.',
            '- Overriding virtualization type to Both for optimal performance.'
        ].join('\n');

        const autoHeightOverrideMessage: string = [
            'Syncfusion Pure React Data Grid:',
            '- Auto height is not compatible with row DOM virtualization.',
            '- Detected height set to "auto" with virtualization settings.',
            '- Use either responsive grid height (100%) with a parent container static' +
            ' height (e.g., 90vh) or a fixed static height (e.g., 90vh) for optimal performance.',
            '- Overriding virtualization type to Column for optimal layout handling.',
            '- Learn more: https://react.syncfusion.com/react-ui/data-grid/scrolling/configuration/#row-virtualization'
        ].join('\n');

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
                        console.warn(scrollModeOverrideMessage);
                    }
                    return { scrollMode: ScrollMode.Auto };
                })() : {}), // Virtual/Infinite scroll not possible/compatible with array data source, so override scrollMode to Auto.
            ...((props.virtualizationSettings?.scrollMode === ScrollMode.Virtual || props.virtualizationSettings?.scrollMode ===
                ScrollMode.Infinite) && props.virtualizationSettings?.type === VirtualDomType.Column ? (() => {
                    if (enableDevMode) {
                        console.warn(disableRowDOMVirtualizationMessage);
                    }
                    return { type: VirtualDomType.Both };
                })() : {}), // Virtual Scroll not possible/compatible without row dom virtualization.
            ...(height === 'auto' ? (() => {
                if (enableDevMode) {
                    console.warn(autoHeightOverrideMessage);
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

    const groupModule: UseGroupResult<T> = useGroup<T>(
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
        setColumnChooserState
    );

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
        estimatedTotalRecordsCount: props.pageSettings?.estimatedTotalRecordsCount || 0
    };
    const stableRest: RefObject<Partial<IGridBase<T>>> = useRef(props);
    const generatedId: string = useId().replace(/:/g, '');
    const id: string = useMemo(() => props.id || `grid_${generatedId}`, [props.id, generatedId]);

    const columns: ColumnProps<T>[] = useMemo(() =>
        preparedColumns as ColumnProps<T>[], [preparedColumns]);

    const clipMode: ClipMode | string = useMemo(() => {
        return props.clipMode;
    }, [props.clipMode]);

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
            persistSelection: isCheckBoxColumn,
            autoSelectMode: isCheckBoxColumn ? AutoSelectMode.Default : AutoSelectMode.Intermediate,
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
    const emptyRecordTemplate: string | Function | ReactElement = useMemo(() =>
        props.emptyRecordTemplate || null, [props.emptyRecordTemplate]);
    const rowTemplate: string | Function | ReactElement = useMemo(() =>
        props.rowTemplate || null, [props.rowTemplate]);

    const detailRowTemplate: DetailRowTemplate<T> | ReactElement | string = useMemo(() =>
        props.detailRowTemplate || null, [props.detailRowTemplate]);
    const isMasterDetail: boolean = useMemo(() =>
        props.isMasterDetail || false, [props.isMasterDetail]);
    const detailRowHeight: number = useMemo(() =>
        props.detailRowHeight || 300, [props.detailRowHeight]);
    const defaultExpandedRows: number[] = useMemo(() =>
        props.defaultExpandedRows || [], [props.defaultExpandedRows]);

    const expansion: Map<number, boolean> = new Map();
    if (isMasterDetail && defaultExpandedRows.length) {
        for (let i: number = 0; i < defaultExpandedRows.length; i++) {
            if (defaultExpandedRows[parseInt(i.toString(), 10)] > 0) {
                expansion.set(defaultExpandedRows[parseInt(i.toString(), 10)] - 1, true);
            }
        }
    }

    const [expansionState, setExpansionState] = useState<Map<number, boolean>>(expansion);

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
        enableHtmlSanitizer, enableStickyHeader]);

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
                const rowsObject: Element[] = rows.filter((r: Element) => r.getAttribute('data-uid') === row.getAttribute('data-uid'));
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
        const gridCols: ColumnProps<T>[] = uiColumns.current ?? columns;
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
                return;
            }
            const selectRowEle: Element[] = selectedRow ? [].slice.call(
                gridRef.current?.element.querySelectorAll('[data-uid=' + selectedRow[`${rowuID}`] + ']')) : undefined;
            try {
                if (isDataSourceChangeRequired) {
                    await dataOperations.getData({
                        requestType: 'update',
                        data: data
                    });
                }
                if (!isNullOrUndefined(selectedRow) && selectRowEle.length) {
                    const rowObjectData: T = {...selectedRow.data, ...data};
                    selectedRow.setRowObject({...selectedRow, data: rowObjectData});
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
                return;
            }
            const selectRowEle: Element[] = selectedRow ? [].slice.call(
                gridRef.current?.element.querySelectorAll('[data-uid=' + selectedRow[`${rowuID}`] + ']')) : undefined;
            const changedRowData: T = { ...selectedRow.data, [field]: value } as T;
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
     * Get the columns directive element
     */
    const columnsDirective: ReactElement = useMemo(() => {
        return children as ReactElement;
    }, [children]);

    // Get header, content, and aggregate row counts for focus strategy
    const headerRowCount: number = useMemo(() => headerRowDepth, [headerRowDepth]);
    const contentRowCount: number = useMemo(() => currentViewData?.length || 0, [currentViewData]);
    const aggregateRowCount: number = useMemo(() => aggregates?.length || 0, [aggregates]);

    const filterModule: filterModule =
        useFilter(gridRef, filterSettings, setGridAction, serviceLocator, setCurrentPage, virtualSettings, scrollMode);

    const searchModule: searchModule = useSearch(gridRef, searchSettings, setGridAction, setCurrentPage, virtualSettings, scrollMode);

    const sortModule: SortModule = useSort(gridRef, sortSettings, setGridAction, groupModule, isInitialLoad);

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

        const filteredColumns: FilterPredicates[] = filterModule.filterSettings.columns;
        if (filteredColumns.length) {
            const validColumns: FilterPredicates[] = filteredColumns.filter((filteredColumn: FilterPredicates) => {
                const column: ColumnProps<T> = columns.find((col: ColumnProps<T>) => col.field === filteredColumn.field);
                return column?.allowFilter;
            });
            if (filteredColumns.length !== validColumns.length) {
                filterModule.setFilterSettings((prev: FilterSettings) => ({ ...prev, columns: validColumns }));
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

    const commandColumnModule: UseCommandColumnResult<T> = useCommandColumn(isCommandEditEnabled && virtualSettings.enableColumn);

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
        groupModule.groupSettings.enabled && groupModule.groupSettings.columns?.length ? expandedGroupCountRef.current : totalRecordsCount,
        expansionState
    );

    const keyDownHandler: (e: React.KeyboardEvent | KeyboardEvent) => void = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
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
        }
    }, [focusModule, gridRef.current?.currentViewData, gridRef.current?.scrollModule?.virtualColumnInfo.columns, visibleColumns]);

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
    }, [filterModule.filterSettings?.columns, filterModule.filterSettings?.columns.length, sortModule.sortSettings?.columns,
        sortModule.sortSettings?.columns.length, searchModule.searchSettings?.value]);

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
        totalRecordsCount
    }), [props.dataSource, query, sortSettings?.enabled, groupSettings.enabled, filterModule?.filterSettings?.enabled, totalRecordsCount,
        pageSettings?.enabled, sortModule?.sortSettings, searchModule?.searchSettings?.enabled, uiColumns.current,
        columns, filterModule?.filterSettings, searchModule?.searchSettings, pageSettings, currentPage, scrollMode, aggregateSelection]);

    const dataOperations: UseDataResult<T> = useData<T>(gridInstance, gridAction, dataState, groupCaptionAggregateType);
    const dataModule: UseDataResult<T> = dataOperations;

    useEffect(() => {
        if (scrollMode === ScrollMode.Infinite) {
            // Validation: Infinite mode requires remote data source
            const isLocalData: boolean = !dataModule.isRemote() && dataSource instanceof Array;
            if (enableDevMode && isLocalData) {
                console.warn(
                    [
                        'Syncfusion Pure React Data Grid:',
                        '- ScrollMode.Infinite requires a remote data source (DataManager).',
                        '- Local data arrays are not supported with infinite scroll mode.',
                        '- Please use ScrollMode.Auto (default) for local data.'
                    ].join('\n')
                );
            }
        }
    }, [scrollMode, dataModule]);
    const selectionModule: selectionModule<T> =
        useSelection<T>(gridRef, currentViewData, totalRecordsCount, isCheckBoxColumn, dataModule, virtualSettings, scrollMode,
                        props.isRowSelectable, isInitialLoad, visibleColumns, groupModule, expandedGroupCountRef);

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

    const editModule: editModule<T> = useEdit<T>(
        gridRef,
        serviceLocator,
        uiColumns.current ?? columns,
        currentViewData,
        dataModule,
        focusModule,
        selectionModule,
        props.editSettings as EditSettings<T>,
        setGridAction,
        setCurrentPage,
        setResponseData,
        commandColumnModule,
        virtualSettings
    );

    // Initialize toolbar module if toolbar is configured
    // Pass modules directly to avoid context provider issues during initial rendering
    const toolbarModule: ToolbarAPI | null = useToolbar(
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
        totalRecordsCount
    );

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
            const expandCollapseArgs: RowExpandEvent<T> | RowCollapseEvent<T> = { rowIndex: rowIndex, data: rowData };
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
        const toolbarAction: boolean = props?.toolbar?.length
            && target?.closest('.sf-toolbar')?.parentElement === gridRef.current.element;
        const isGroupDropAreaAction: boolean = !!(groupSettings.enabled && target?.closest('.sf-group-drop-area'));
        const datePicker: boolean = target?.closest('.sf-datepicker')?.classList.contains('sf-popup-open');
        const dropDown: boolean = target?.closest('.sf-ddl')?.classList.contains('sf-popup-open');
        const checkbox: boolean = target?.tagName === 'INPUT' && (e.target as HTMLElement)?.classList.contains('sf-grid-checkselect');
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
            || editModule?.isDialogOpen || editModule?.isDeleteDialogOpen || checkbox || dropDown || selectionSettings?.checkboxOnly || (e.target as Element).closest('.sf-column-chooser-dialog')) {
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
                editModule.saveDataChanges();
            } else if (target.closest('.sf-grid-popup-edit-cancel') || target.closest('.sf-dlg-closeicon-btn')) {
                editModule.cancelDataChanges();
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
                groupModule.toggleGroup(rowInfo);
                e.preventDefault();
                requestAnimationFrame(() => {
                    // After toggling the group, move focus back to the caption cell to maintain focus context
                    focusModule.navigateToCell(rowInfo.rowIndex, parseInt(target?.closest('td')?.getAttribute('data-colindex') ?? '1', 10) - 1, 'Content');
                });
                return;
            }
        }

        // Handle cell selection if enabled, otherwise handle row selection
        if (selectionSettings?.type === 'Cell' && cellSelectionModule) {
            cellSelectionModule.handleGridClick(e);
        } else {
            // Handle row selection FIRST and IMMEDIATELY, regardless of focus state
            // This ensures row selection happens on the first click, even when coming from outside grid focus
            selectionModule.handleGridClick(e);
        }

        // Set grid focus AFTER selection to avoid interference
        // This prevents focus management from disrupting the selection process
        if (!focusModule.isGridFocused) {
            focusModule.setGridFocus(true);
        }

        focusModule.handleGridClick(e);

        // Finally handle sorting (if applicable)
        if (!(e.target as Element).closest('.sf-grid-filter-container')) {
            sortModule?.handleGridClick?.(e);
        }
    }, [focusModule, selectionModule, sortModule, groupModule, editModule, isInitialLoad, gridRef, currentViewData, props.editSettings,
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
    }, [editModule, isInitialLoad, gridRef, currentViewData, props.editSettings]);

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
        if (isChildGrid(e)) {
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
            if (isStopPropagationPreventDefault(e)) {
                return;
            }
        }
    }, [focusModule, filterModule, cellSelectionModule, selectionSettings, isStopPropagationPreventDefault]);

    const handleGridFocus: (e: FocusEvent) => void = useCallback((e: FocusEvent<HTMLDivElement>) => {
        if (isChildGrid(e) || e.target.closest('.sf-excel-filter') || e.target.closest('.sf-excel-filter-dropdown') || e.target.closest('.sf-column-chooser-dialog')) {
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
            if (isGroupDropAreaTarget && !groupModule.groupedColumns?.length && !groupDropAreaWithFocusElement) {
                e.target?.classList.add('sf-focused');
            }
            return;
        } else if (groupDropAreaWithFocusElement) {
            groupDropAreaWithFocusElement.classList.remove('sf-focused');
        }
        // Check if grid is in edit mode to prevent focus interference
        const isGridInEditMode: boolean = (editModule?.isEdit && !commandColumnModule.commandEdit.current) || false;
        const commandEditForm: boolean = commandColumnModule.commandEdit.current && e?.target?.closest('.sf-grid-edit-form')
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
                            focusModule.focus(undefined, commandColumnModule.commandEdit.current ? e : undefined);
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
        const isGridInEditMode: boolean = (editModule?.isEdit && !commandColumnModule.commandEdit.current) || false;
        const commandEditForm: boolean = commandColumnModule.commandEdit.current && e?.target?.closest('.sf-grid-edit-form')
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
                e.target?.closest('.sf-datepicker') || e.target?.closest('.sf-grid-contextmenu') ||
                e.target?.closest('.sf-group-drop-area') ||
                // Focus moving to another element within the grid
                (e.currentTarget?.contains(relatedTarget) ||
                    // Focus moving to a grid popup
                    (relatedTarget && (relatedTarget.closest('.sf-grid-popup') || relatedTarget.closest('.sf-grid-contextmenu'))) ||
                    // Focus still within the grid (using document.activeElement)
                    document.activeElement && document.activeElement.closest('.sf-grid')) as boolean;
            isStayingInGrid = relatedTarget && relatedTarget.closest('.sf-pager') ? false : isStayingInGrid;
            const isVirtualFocusStayingInGrid: boolean = isStayingInGrid && relatedTarget &&
                !relatedTarget.classList.contains('sf-virtualrowscrollbar') &&
                !relatedTarget.classList.contains('sf-virtualcolumnscrollbar');
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
        if (isMasterDetail && e.altKey && (e.code === 'ArrowDown' || e.code === 'ArrowUp') && target.querySelector('.sf-detail-toggle-icon')) {
            const expandCell: HTMLTableCellElement = target.closest('td[role="gridcell"]') as HTMLTableCellElement;
            const rowInfo: RowInfo<T> = gridRef.current?.getRowInfo(expandCell);
            if ((e.code === 'ArrowDown' && !(expansionState.has(rowInfo.ariaRowIndex))) ||
                (e.code === 'ArrowUp' && (expansionState.has(rowInfo.ariaRowIndex)))) {
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
                editModule.saveDataChanges();
            } else if (e.key === 'Escape') {
                editModule.cancelDataChanges();
            }
            return;
        }
        sortModule?.keyUpHandler?.(e as React.KeyboardEvent);
        if (sortModule && e.keyCode === 13 && closest(e.target as Element, '.sf-grid-header-row .sf-cell')) {
            return;
        }
        const pageAction: boolean = pageSettings?.enabled && (e.target as HTMLElement)?.closest('.sf-pager')
            && (e.target as HTMLElement).closest('.sf-pager').parentElement === gridRef.current.element;
        const toolbarAction: boolean = props?.toolbar?.length &&
            (e.target as HTMLElement)?.closest('.sf-toolbar')?.parentElement === gridRef.current.element;
        const isGroupDropAreaAction: boolean = !!(groupSettings.enabled && (e.target as HTMLElement)?.closest('.sf-group-drop-area'));
        const commandItemEnter: boolean = (e.target as HTMLElement)?.closest('.sf-grid-command-cell') && e.key === 'Enter';
        if ((e.key === 'Shift' && e.shiftKey) || (e.key === 'Control' && e.ctrlKey) || pageAction || toolbarAction || commandItemEnter
            || (e.target as HTMLElement)?.closest('.sf-grid-contextmenu') || isGroupDropAreaAction) { return; }

        // Enhanced keyboard action handling based on original TypeScript implementation
        // This implements comprehensive keyboard actions including Insert and Delete keys
        const isMacLike: boolean = /(Mac)/i.test(navigator.platform);

        // Check for edit form - support both row edit form and cell edit form
        const editForm: HTMLElement | null = (e.target as HTMLElement)?.closest('.sf-grid-edit-form') ||
                                             (e.target as HTMLElement)?.closest('.sf-grid-cell-edit-form');
        // Handle edit-specific keyboard events first
        if (props.editSettings?.allowEdit || props.editSettings?.allowAdd || props.editSettings?.allowDelete) {
            const commandEdit: boolean = commandColumnModule.commandEdit.current;
            const row: HTMLTableRowElement = target?.closest('.sf-grid-content-row');
            const uid: string = row?.getAttribute('data-uid');
            // Insert key or Mac Cmd+Enter to add record
            if ((e.key === 'Insert' || (isMacLike && e.metaKey && e.key === 'Enter')) &&
                props.editSettings?.allowAdd && (!editModule?.isEdit || commandEdit)) {
                e.preventDefault();
                editModule?.addRecord?.();
                return;
            }

            // Delete key to delete selected record
            if (e.key === 'Delete' && editModule?.editSettings?.mode !== 'Cell' && props.editSettings?.allowDelete && (!editModule?.isEdit || commandEdit)) {
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
            if (e.key === 'Enter' && editModule?.editSettings?.mode !== 'Cell' && (editModule?.isEdit || commandEdit)) {
                const target: HTMLElement = e.target as HTMLElement;
                // Only handle if not in input field or specific grid context
                if (!target.closest('.sf-unboundcelldiv') &&
                    (target.closest('.sf-grid-content-container') || target.closest('.sf-grid-header-content')) && editForm) {
                    e.preventDefault();
                    editModule.escEnterIndex.current = parseInt((e.target as HTMLElement)?.closest('td')?.getAttribute('aria-colindex'), 10) - 1;
                    (editModule?.saveDataChanges as Function)?.(undefined, undefined, 'Key', commandEdit ? uid : undefined);
                    return;
                }
            }

            // Escape key to cancel editing
            if (e.key === 'Escape' && editModule?.editSettings?.mode !== 'Cell' && (editModule?.isEdit || commandEdit) && editForm) {
                e.preventDefault();
                editModule.escEnterIndex.current = parseInt((e.target as HTMLElement)?.closest('td')?.getAttribute('aria-colindex'), 10) - 1;
                (editModule?.cancelDataChanges as Function)?.('Key', commandEdit ? uid : undefined);
                return;
            }
        }

        const isGridInEditMode: boolean = editModule?.isEdit || commandColumnModule.commandEdit.current || false;

        // Handle keyboard events in Cell Edit Mode using consolidated handler (Tab, F2, Enter, Delete, Escape)
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
        if (isGridInEditMode && e.key === 'Tab' && editForm && editModule?.editSettings?.mode !== 'Cell') {
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
                    groupModule.toggleGroup(rowInfo);
                    requestAnimationFrame(() => {
                        // After toggling the group, move focus back to the caption cell to maintain focus context
                        focusModule.navigateToCell(rowInfo.rowIndex, parseInt(target?.closest('td')?.getAttribute('data-colindex') ?? '1', 10) - 1, 'Content');
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
                    groupModule.expandAll();
                } else {
                    groupModule.collapseAll();
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
    }, [focusModule, filterModule, props.editSettings, editModule, selectionSettings, cellSelectionModule]);

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
        if (props.onGridInit) {
            props.onGridInit(); // trigger only once on initial render, once Dom element mounted.
        }
        isInitialBeforePaint.current = false;
        if (enableDevMode && isInitialLoad && scrollMode === ScrollMode.Infinite && (aggregates?.length ||
            (groupSettings?.enabled && groupSettings?.columns?.length && groupCaptionAggregateType.size))) {
            const aggregateInfiniteScrollMessage: string = [
                'Syncfusion Pure React Data Grid:',
                '- Aggregates in infinite scroll mode display values only from the last' +
                ' loaded request due to unknown total record count.',
                '- This behavior is expected because infinite scrolling does not maintain' +
                ' a complete dataset context.',
                '- Consider using pagination or virtual scrolling for accurate aggregate values across the entire dataset.',
                '- Learn more: https://react.syncfusion.com/react-ui/data-grid/scrolling/infinite-scroll/?theme=material#aggregation-and-grouping'
            ].join('\n');

            console.warn(aggregateInfiniteScrollMessage);
        }
        if (enableDevMode && isInitialLoad && scrollMode === ScrollMode.Infinite && groupSettings?.enabled &&
            groupSettings?.columns?.length) {
            const groupInfiniteScrollMessage: string = [
                'Syncfusion Pure React Data Grid:',
                '- Grouping in infinite scroll mode may lead to unexpected behavior due to unknown total record count.',
                '- This is because infinite scrolling dynamically loads data without a complete dataset context, which can affect group' +
                ' counts and expand/collapse behavior.',
                '- Consider using pagination or virtual scrolling for more consistent grouping behavior across the entire dataset.',
                '- Learn more: https://react.syncfusion.com/react-ui/data-grid/scrolling/infinite-scroll/?theme=material#aggregation-and-grouping'
            ].join('\n');
            console.warn(groupInfiniteScrollMessage);
        }

        if (enableDevMode && isInitialLoad && pageSettings?.enabled && (scrollMode === ScrollMode.Virtual ||
            scrollMode === ScrollMode.Infinite)) {
            const pagerWithServerVirtualInfiniteScrollMessage: string = [
                'Syncfusion Pure React Data Grid:',
                '- Using pager with server-side pagination in virtual or infinite scroll mode may lead to unexpected behavior.',
                '- This is because server-side pagination relies on explicit page navigation, while virtual/infinite scrolling' +
                ' dynamically loads data (server-side pagination) as the user scrolls.',
                '- Consider using either pager for server-side pagination or disabling the pager for virtual/infinite scroll scenarios.'
            ].join('\n');
            console.warn(pagerWithServerVirtualInfiniteScrollMessage);
        }
        return () => {
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
        setGridAction
    }), [styles, setCurrentViewData, handleGridClick, handleGridDoubleClick, setCurrentPage, setTotalRecordsCount,
        setGridAction, handleGridMouseDown, handleGridMouseOut, handleGridMouseOver, getEllipsisTooltipContent]);

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
        getColumnByUid,
        getColumnByField,
        getData,
        getHiddenColumns,
        getRowInfo,
        getPrimaryKeyFieldNames,
        setRowData,
        setCellValue,
        serviceLocator,
        className,
        dataSource: dataOperations.dataManager,
        id,
        height,
        children,
        clipMode,
        width,
        enableRtl,
        enableHover,
        enableDevMode,
        selectionSettings,
        gridLines,
        filterSettings: filterModule?.filterSettings,
        sortSettings: sortModule?.sortSettings,
        searchSettings: searchModule?.searchSettings,
        pageSettings,
        textWrapSettings,
        enableHtmlSanitizer,
        enableStickyHeader,
        rowHeight,
        enableAltRow,
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
        editSettings: props.editSettings,
        allowKeyboard,
        columnChooserSettings: props.columnChooserSettings,
        getRowHeight,
        onExpandStateChange,
        theme,
        loadingIndicatorSettings,
        contextMenuSettings,
        virtualizationSettings,
        groupSettings: groupModule?.groupSettings
    } as IGrid<T>), [
        getVisibleColumns,
        getColumnByUid,
        getColumnByField,
        getData,
        getHiddenColumns,
        getRowInfo,
        getPrimaryKeyFieldNames,
        setRowData,
        setCellValue,
        serviceLocator,
        className,
        dataOperations.dataManager,
        id,
        height,
        children,
        clipMode,
        width,
        enableRtl,
        enableHover,
        enableDevMode,
        selectionSettings,
        gridLines,
        filterModule?.filterSettings,
        sortModule?.sortSettings,
        searchModule?.searchSettings,
        pageSettings,
        textWrapSettings,
        enableHtmlSanitizer,
        enableStickyHeader,
        rowHeight,
        enableAltRow,
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
        editModule,
        aggregateSelection,
        toolbarModule,
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
        groupCaptionAggregateType
    }), [currentViewData, virtualCachedViewData, columnsDirective, headerRowDepth, colElements, isInitialLoad, focusModule, groupModule,
        selectionModule, cellSelectionModule, getParentElement, sortModule, searchModule, filterModule, editModule, sortSettings,
        searchSettings, evaluateTooltipStatus, uiColumns.current, setVirtualCachedViewData, currentPage, totalRecordsCount, gridAction,
        isInitialBeforePaint, cssClass, responseData, setResponseData, dataModule, offsetX, offsetY, setOffsetX, setOffsetY,
        totalVirtualColumnWidth, commandColumnModule, columnOffsets, virtualSettings, scrollMode, setColumnChooserState, isCheckBoxColumn,
        aggregateSelection, infiniteScrollState, expansionState, expandedGroupCountRef, singleGroupColumn, groupCaptionAggregateType,
        loadedPageWiseGroupExpandedCountRef, pageWiseGroupResponseViewData, setPageWiseGroupResponseViewData,
        loadedPageWiseVirtualGroupStartEndRowIndexes
    ]);

    useEffect(() => {
        gridRef.current = {
            ...gridRef.current,
            ...gridAPI,
            // Ensure currentViewData is always up-to-date in gridRef
            currentViewData: currentViewData
        };
        ellipsisTooltipEvaluateInfo.destroy();
    }, [gridAPI, currentViewData, ellipsisTooltipEvaluateInfo]);

    return { gridInternal, gridAPI, gridScoped };
};
