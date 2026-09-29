import {
    forwardRef,
    ForwardRefExoticComponent,
    RefAttributes,
    useImperativeHandle,
    useRef,
    useMemo,
    useCallback,
    memo,
    RefObject,
    JSX,
    ReactElement,
    Dispatch,
    SetStateAction
} from 'react';
import { HeaderRowsRef, IHeaderRowsBase, RowRef, VirtualColumnInfo } from '../types/interfaces';
import { IRow, ICell, ColumnsChildren } from '../types/interfaces';
import { RenderType, RowType, WrapMode } from '../types/enum';
import { ColumnProps, FlattenedColumn } from '../types/column.interfaces';
import { useGridMutableProvider, useGridComputedProvider } from '../contexts/GridProviders';
import { RowBase } from '../components/Row';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { computeStackedHeaderMatrix } from '../hooks/useSpanning';

// CSS class constants following enterprise naming convention
const CSS_COLUMN_HEADER: string = 'sf-grid-header-row';
const CSS_FILTER_HEADER: string = 'sf-filter-row';

/**
 * HeaderRowsBase component renders the header rows within the table header section.
 * Manages header row generation with support for multi-level headers and filter bar row.
 * Exposes internal header rows collection and row objects via forwarded ref for external manipulation.
 *
 * @component
 * @private
 * @param {Partial<IHeaderRowsBase>} props - Component properties
 * @param {RefObject<HeaderRowsRef>} ref - Forwarded ref exposing getHeaderRows() and getHeaderRowsObject() methods
 * @returns {JSX.Element} The rendered thead element containing header rows
 */
const HeaderRowsBase: (props: Partial<IHeaderRowsBase> & RefAttributes<HeaderRowsRef>) => ReactElement =
    memo(forwardRef<HeaderRowsRef, Partial<IHeaderRowsBase>>(
        <T, >(props: Partial<IHeaderRowsBase>, ref: RefObject<HeaderRowsRef>) => {
            const { columnsDirective, headerRowDepth, offsetX } = useGridMutableProvider<T>();
            const { filterSettings, rowClass, stackedHeaderColumns, stackedFlattedColumns, stackedFlattedColumnProps,
                isStackedHeader,  scrollModule } = useGridComputedProvider<T>();
            const { rowHeight, textWrapSettings, virtualizationSettings } = useGridComputedProvider<T>();

            // Refs for DOM elements and child components
            const headerSectionRef: RefObject<HTMLTableSectionElement> = useRef<HTMLTableSectionElement>(null);
            const rowsObjectRef: RefObject<IRow<ColumnProps<T>>[]> = useRef<IRow<ColumnProps<T>>[]>([]);

            /**
             * Returns the collection of header row elements
             *
             * @returns {HTMLCollectionOf<HTMLTableRowElement> | undefined} Collection of header row elements
             */
            const getHeaderRows: () => HTMLCollectionOf<HTMLTableRowElement> | undefined = useCallback(() => {
                return headerSectionRef.current?.children as HTMLCollectionOf<HTMLTableRowElement>;
            }, [headerSectionRef.current?.children]);

            /**
             * Returns the row options objects with DOM element references
             *
             * @returns {IRow<ColumnProps>[]} Array of row options objects with element references
             */
            const getHeaderRowsObject: () => IRow<ColumnProps<T>>[] = useCallback(() => rowsObjectRef.current, []);

            /**
             * Expose internal elements and methods through the forwarded ref
             */
            useImperativeHandle(ref, () => ({
                headerSectionRef: headerSectionRef.current,
                getHeaderRows,
                getHeaderRowsObject
            }), [getHeaderRows, getHeaderRowsObject, offsetX]);

            /**
             * Callback to store row element references directly in the row object
             *
             * @param {number} index - Row index
             * @param {HTMLTableRowElement} element - Row DOM element
             */
            const storeRowRef: (index: number, element: HTMLTableRowElement,
                cellRef: ICell<ColumnProps<T>>[], setRowObject: Dispatch<SetStateAction<IRow<ColumnProps<T>>>>) => void =
                useCallback((index: number, element: HTMLTableRowElement, cellRef: ICell<ColumnProps<T>>[],
                             setRowObject: Dispatch<SetStateAction<IRow<ColumnProps<T>>>>) => {
                    // Directly update the element reference in the row object
                    if (rowsObjectRef.current[index as number]) { // StrictMode purpose type gaurd condition added.
                        rowsObjectRef.current[index as number].element = element;
                        rowsObjectRef.current[index as number].cells = cellRef;
                        rowsObjectRef.current[index as number].setRowObject = setRowObject;
                    }
                }, []);

            /**
             * Memoized row ref callback to prevent unnecessary child re-renders
             *
             * @param {RowRef<T>} element - Row ref element
             * @param {number} index - Row index
             */
            const handleRowRef: (element: RowRef<T>, index: number) => void = useCallback((element: RowRef<T>, index: number) => {
                if (element?.rowRef?.current) {
                    storeRowRef(index, element.rowRef.current, element.getCells(), element.setRowObject);
                }
            }, [storeRowRef]);

            /**
             * Memoized callback to compute and apply stacked header matrix to rows and rowOptions
             *
             * @param {JSX.Element[]} rows - Array of rendered row elements
             * @param {IRow<ColumnProps>[]} rowOptions - Array of row option objects
             */
            const applyStackedHeaderMatrix: (
                rows: JSX.Element[],
                rowOptions: IRow<ColumnProps<T>>[],
                leafColumns: FlattenedColumn<T>[],
                stackedHeaderColumns: FlattenedColumn<T>[]
            ) => void = useCallback(
                (
                    rows: JSX.Element[],
                    rowOptions: IRow<ColumnProps<T>>[],
                    leafColumns: FlattenedColumn<T>[],
                    stackedHeaderColumns: FlattenedColumn<T>[]
                ) => {
                    const stackedHeaderMatrix: ICell<ColumnProps<T>>[][] = computeStackedHeaderMatrix(
                        headerRowDepth, leafColumns, stackedHeaderColumns) as ICell<ColumnProps<T>>[][];
                    for (let idx: number = 0, spanEnd: number = rows.length; idx < spanEnd; idx++) {
                        if (idx >= 0 && idx < stackedHeaderMatrix.length && stackedHeaderMatrix[parseInt(idx.toString(), 10)]
                            && rows[parseInt(idx.toString(), 10)].props.row) {
                            const cells: ICell<ColumnProps<T>>[] = stackedHeaderMatrix[parseInt(idx.toString(), 10)];
                            // Update the row prop directly to ensure the Row component receives the latest spanCells
                            rows[parseInt(idx.toString(), 10)].props.row.stackedHeaderCells = cells;
                            if (rowOptions[parseInt(idx.toString(), 10)]) {
                                rowOptions[parseInt(idx.toString(), 10)].stackedHeaderCells = cells;
                            }
                        }
                    }
                }, [headerRowDepth]);

            /**
             * Memoized header row content to prevent unnecessary re-renders
             */
            const headerRowContent: JSX.Element[] | null = useMemo(() => {
                const rows: JSX.Element[] = [];
                const rowOptions: IRow<ColumnProps<T>>[] = [];
                // Generate header rows based on headerRowDepth
                const { flattedData, visibleFlattedElements } = (stackedHeaderColumns ?? []).reduce(
                    (acc: { flattedData: FlattenedColumn<T>[]; visibleFlattedElements: ColumnProps[]; },
                     column: FlattenedColumn<T>) => {
                        const isVisibleColumn: boolean = column.leafCount === 1 && column.element?.props?.field &&
                        column.element?.props?.visible !== false;
                        if (isVisibleColumn) {
                            acc.flattedData.push(column);
                            acc.visibleFlattedElements.push(column.element.props);
                        }
                        return acc;
                    },
                    { flattedData: [] as FlattenedColumn<T>[], visibleFlattedElements: [] as ColumnProps[] });
                for (let rowIndex: number = 0; rowIndex < headerRowDepth; rowIndex++) {
                    const options: IRow<ColumnProps<T>> = {};
                    options.rowIndex = rowIndex;
                    options.flattedData = flattedData;
                    options.flattedColumns = stackedFlattedColumns;
                    const rowId: string = `grid-header-row-${rowIndex}-${Math.random().toString(36).substr(2, 5)}`;
                    // Store the options object for getRowsObject
                    rowOptions.push({ ...options });
                    const rowCustomClass: string = !isNullOrUndefined(rowClass) ? (typeof rowClass === 'function' ?
                        rowClass({rowType: RowType.Header, rowIndex: options.rowIndex}) : rowClass) : '';
                    rows.push(
                        <RowBase<T>
                            ref={(element: RowRef<T>) => handleRowRef(element, rowIndex)}
                            role='row'
                            row={options}
                            key={rowId}
                            rowType={RenderType.Header}
                            aria-rowindex={options.rowIndex + 1}
                            className={`${CSS_COLUMN_HEADER} ${textWrapSettings?.enabled && textWrapSettings?.wrapMode === WrapMode.Header ? 'sf-wrap' : ''}`.trim()
                                + (rowCustomClass.length ? `${' ' + rowCustomClass}` : '')}
                            style={{ height : `${rowHeight}px`}}
                        >
                            {(columnsDirective.props as ColumnsChildren).children}
                        </RowBase>
                    );
                    if (rowIndex === headerRowDepth - 1 && filterSettings?.enabled) {
                        rows.push(
                            <RowBase<T>
                                role='row'
                                key={rowId + '-filterbar'}
                                rowType={RenderType.Filter}
                                aria-rowindex={options.rowIndex + 1 + 1}
                                className={`${CSS_FILTER_HEADER}`}
                            >
                                {(columnsDirective.props as ColumnsChildren).children}
                            </RowBase>
                        );
                    }
                }

                if (isStackedHeader && stackedHeaderColumns?.length) {
                    // Apply span matrix only when columnsArray or data structure changes
                    let leafColumns: FlattenedColumn<T>[] = flattedData;
                    if (virtualizationSettings.enabled) {
                        const virtualColumnInfo: VirtualColumnInfo | undefined = scrollModule?.virtualColumnInfo;
                        if (virtualColumnInfo) {
                            leafColumns = flattedData.slice(virtualColumnInfo.startIndex, virtualColumnInfo.endIndex);
                            virtualColumnInfo.visibleStackedHeaderColumns =
                                visibleFlattedElements.slice(virtualColumnInfo.startIndex, virtualColumnInfo.endIndex) as ColumnProps[];
                        }
                    }
                    applyStackedHeaderMatrix(rows, rowOptions, leafColumns, stackedHeaderColumns);
                }

                // Store the row options in the ref for access via getRowsObject
                rowsObjectRef.current = rowOptions;
                return rows;
            }, [columnsDirective, headerRowDepth, applyStackedHeaderMatrix, textWrapSettings?.enabled,
                textWrapSettings, rowHeight, filterSettings?.enabled,
                rowClass, stackedHeaderColumns, stackedFlattedColumnProps, stackedFlattedColumns, isStackedHeader,
                scrollModule?.virtualColumnInfo?.startIndex && isStackedHeader, isStackedHeader && offsetX]);

            return (
                <thead
                    {...props}
                    ref={headerSectionRef}
                >
                    {headerRowContent}
                </thead>
            );
        }
    )) as (props: Partial<IHeaderRowsBase> & RefAttributes<HeaderRowsRef>) => ReactElement;

/**
 * Set display name for debugging purposes
 */
(HeaderRowsBase as ForwardRefExoticComponent<Partial<IHeaderRowsBase> & RefAttributes<HeaderRowsRef>>).displayName = 'HeaderRowsBase';

/**
 * Export the HeaderRowsBase component for use in other components
 *
 * @private
 */
export { HeaderRowsBase };
