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
    useEffect
} from 'react';
import {
    HeaderRowsRef,
    IHeaderRowsBase,
    RowRef,
    IRow,
    ICell,
    RenderType
} from '../types';
import { ColumnProps } from '../types/column.interfaces';
import {
    useGridMutableProvider,
    useGridComputedProvider } from '../contexts';
import { RowBase } from '../components';
import { ColumnsChildren } from '../types/interfaces';
import { isNullOrUndefined } from '@syncfusion/react-base';

// CSS class constants following enterprise naming convention
const CSS_COLUMN_HEADER: string = 'sf-columnheader';
const CSS_FILTER_HEADER: string = 'sf-filterbar';

/**
 * HeaderRowsBase component renders the header rows within the table header section
 *
 * @component
 * @private
 * @param {Partial<IHeaderRowsBase>} props - Component properties
 * @param {RefObject<HeaderRowsRef>} ref - Forwarded ref to expose internal elements and methods
 * @returns {JSX.Element} The rendered thead element with header rows
 */
const HeaderRowsBase: ForwardRefExoticComponent<Partial<IHeaderRowsBase> & RefAttributes<HeaderRowsRef>> =
    memo(forwardRef<HeaderRowsRef, Partial<IHeaderRowsBase>>(
        (props: Partial<IHeaderRowsBase>, ref: RefObject<HeaderRowsRef>) => {
            const { columnsDirective, headerRowDepth } = useGridMutableProvider();
            const { filterSettings, rowClass } = useGridComputedProvider();
            const { rowHeight, textWrapSettings } = useGridComputedProvider();

            // Refs for DOM elements and child components
            const headerSectionRef: RefObject<HTMLTableSectionElement> = useRef<HTMLTableSectionElement>(null);
            const rowsObjectRef: RefObject<IRow<ColumnProps>[]> = useRef<IRow<ColumnProps>[]>([]);

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
            const getHeaderRowsObject: () => IRow<ColumnProps>[] = useCallback(() => rowsObjectRef.current, [rowsObjectRef.current]);

            /**
             * Expose internal elements and methods through the forwarded ref
             */
            useImperativeHandle(ref, () => ({
                headerSectionRef: headerSectionRef.current,
                getHeaderRows,
                getHeaderRowsObject
            }), [getHeaderRows, getHeaderRowsObject]);

            /**
             * Callback to store row element references directly in the row object
             *
             * @param {number} index - Row index
             * @param {HTMLTableRowElement} element - Row DOM element
             */
            const storeRowRef: (index: number, element: HTMLTableRowElement, cellRef: ICell<ColumnProps>[]) => void =
                useCallback((index: number, element: HTMLTableRowElement, cellRef: ICell<ColumnProps>[]) => {
                    // Directly update the element reference in the row object
                    if (rowsObjectRef.current[index as number]) { // StrictMode purpose type gaurd condition added.
                        rowsObjectRef.current[index as number].element = element;
                        rowsObjectRef.current[index as number].cells = cellRef;
                    }
                }, []);

            /**
             * Memoized header row content to prevent unnecessary re-renders
             */
            const headerRowContent: JSX.Element[] | null = useMemo(() => {
                const rows: JSX.Element[] = [];
                const rowOptions: IRow<ColumnProps>[] = [];
                // Generate header rows based on headerRowDepth
                for (let rowIndex: number = 0; rowIndex < headerRowDepth; rowIndex++) {
                    const options: IRow<ColumnProps> = {};
                    options.index = rowIndex;
                    const rowId: string = `grid-header-row-${rowIndex}-${Math.random().toString(36).substr(2, 5)}`;
                    // Store the options object for getRowsObject
                    rowOptions.push({ ...options });
                    const rowCustomClass: string = !isNullOrUndefined(rowClass) ? (typeof rowClass === 'function' ?
                        rowClass({rowType: 'header', rowIndex: options.index}) : rowClass) : '';
                    rows.push(
                        <RowBase
                            ref={(element: RowRef) => {
                                if (element?.rowRef?.current) {
                                    storeRowRef(rowIndex, element.rowRef.current, element.getCells());
                                }
                            }}
                            role='row'
                            row={options}
                            key={rowId}
                            rowType={RenderType.Header}
                            className={`${CSS_COLUMN_HEADER} ${textWrapSettings?.enabled && textWrapSettings?.wrapMode === 'Header' ? 'sf-wrap' : ''}`.trim()
                                + (rowCustomClass.length ? `${' ' + rowCustomClass}` : '')}
                            style={{ height : `${rowHeight}px`}}
                        >
                            {(columnsDirective.props as ColumnsChildren).children}
                        </RowBase>
                    );
                    if (rowIndex === headerRowDepth - 1 && filterSettings?.enabled) {
                        rows.push(
                            <RowBase
                                role='row'
                                key={rowId + '-filterbar'}
                                rowType={RenderType.Filter}
                                className={`${CSS_FILTER_HEADER}`}
                            >
                                {(columnsDirective.props as ColumnsChildren).children}
                            </RowBase>
                        );
                    }
                }

                // Store the row options in the ref for access via getRowsObject
                rowsObjectRef.current = rowOptions;
                return rows;
            }, [columnsDirective, textWrapSettings?.enabled, textWrapSettings, rowHeight, filterSettings?.enabled, rowClass]);

            useEffect(() => {
                return () => {
                    rowsObjectRef.current = [];
                };
            }, []);

            return (
                <thead
                    {...props}
                    ref={headerSectionRef}
                >
                    {headerRowContent}
                </thead>
            );
        }
    ));

/**
 * Set display name for debugging purposes
 */
HeaderRowsBase.displayName = 'HeaderRowsBase';

/**
 * Export the HeaderRowsBase component for use in other components
 *
 * @private
 */
export { HeaderRowsBase };
