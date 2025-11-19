import {
    useEffect,
    useRef,
    useMemo,
    useCallback,
    memo,
    JSX,
    RefObject,
    MemoExoticComponent,
    ReactElement
} from 'react';
import {
    CellType,
    CellTypes,
    ColumnType,
    WrapMode
} from '../types';
import { IGrid } from '../types/grid.interfaces';
import { SortDescriptor } from '../types/sort.interfaces';
import { MutableGridSetter } from '../types/interfaces';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';
import { useColumn } from '../hooks';
import { isNullOrUndefined, SanitizeHtmlHelper } from '@syncfusion/react-base';
import { Checkbox } from '@syncfusion/react-buttons';
import { ArrowUpIcon, ArrowDownIcon } from '@syncfusion/react-icons';
import { ColumnProps, IColumnBase, ColumnRef, CellClassProps } from '../types/column.interfaces';

// CSS class constants following enterprise naming convention
const CSS_HEADER_CELL_DIV: string = 'sf-grid-header-cell';
const CSS_HEADER_TEXT: string = 'sf-grid-header-text';
const CSS_SORT_ICON: string = 'sf-grid-sort-container sf-icons';
const CSS_SORT_NUMBER: string = 'sf-grid-sort-order';
const CSS_DESCENDING_SORT: string = 'sf-descending sf-icon-descending';
const CSS_ASENDING_SORT: string = 'sf-ascending sf-icon-ascending';

/**
 * ColumnBase component renders a table cell (th or td) with appropriate content
 *
 * @component
 * @private
 * @param {IColumnBase} props - Component properties
 * @param {RefObject<ColumnRef>} ref - Forwarded ref to expose internal elements
 * @returns {JSX.Element} The rendered table cell (th or td)
 */
const ColumnBase: <T>(props: Partial<IColumnBase<T>>) => JSX.Element = memo(<T, >(props: Partial<IColumnBase<T>>) => {
    const grid: Partial<IGrid<T>> & Partial<MutableGridSetter<T>> = useGridComputedProvider<T>();
    const { onHeaderCellRender, onCellRender, onAggregateCellRender, enableHtmlSanitizer, getColumnByField,
        textWrapSettings, clipMode } = grid;
    const { isInitialBeforePaint, cssClass, evaluateTooltipStatus, isInitialLoad } = useGridMutableProvider<T>();

    // Get column-specific APIs and properties
    const { publicAPI, privateAPI } = useColumn<T>(props);

    const {
        cellType,
        visibleClass,
        alignHeaderClass,
        alignClass,
        formattedValue
    } = privateAPI;

    const { ...column } = publicAPI;

    const {
        index,
        field,
        headerText,
        disableHtmlEncode,
        allowSort,
        customAttributes,
        cellClass
    } = column;
    const aggregateCellClass: string | ((props?: CellClassProps<T>) => string) = props?.cell?.aggregateColumn?.cellClass;

    // Create ref for the cell element
    const cellRef: RefObject<ColumnRef> = useRef<ColumnRef>({
        cellRef: useRef<HTMLTableCellElement>(null)
    });

    /**
     * Handle header cell info event
     */
    const handleHeaderCellInfo: Function = useCallback(() => {
        if (onHeaderCellRender && cellRef.current?.cellRef.current) {
            onHeaderCellRender({
                node: cellRef.current.cellRef.current,
                cell: props.cell,
                column: column
            });
        }
    }, []);

    /**
     * Handle aggregate cell info event
     */
    const handleAggregateCellInfo: Function = useCallback(() => {
        if (onAggregateCellRender && cellRef.current?.cellRef.current) {
            onAggregateCellRender({
                data: props.row.data,
                cell: cellRef.current.cellRef.current,
                column: props.cell.aggregateColumn
            });
        }
    }, []);

    /**
     * Handle query cell info event
     */
    const handleQueryCellInfo: Function = useCallback(() => {
        if (onCellRender && cellRef.current?.cellRef.current) {
            onCellRender({
                cell: cellRef.current.cellRef.current,
                column: column,
                data: props.row.data,
                colSpan: props.cell.colSpan,
                rowSpan: props.cell.rowSpan
            });
        }
    }, []);

    useEffect(() => {
        if (column.clipMode === 'Clip' || (!column.clipMode && clipMode === 'Clip')) {
            if (cellRef.current?.cellRef.current?.classList?.contains?.('sf-ellipsistooltip')) {
                cellRef.current?.cellRef.current?.classList?.remove?.('sf-ellipsistooltip');
            }
            cellRef.current?.cellRef.current?.classList?.add?.('sf-clip');
        } else if (column.clipMode === 'EllipsisWithTooltip' || (!column.clipMode && clipMode === 'EllipsisWithTooltip')
            && !(textWrapSettings?.enabled && (textWrapSettings.wrapMode === WrapMode.Content
            || textWrapSettings.wrapMode === 'Both'))) {
            if (column.type !== 'checkbox' && evaluateTooltipStatus(cellRef.current?.cellRef.current)) {
                if (cellRef.current?.cellRef.current?.classList?.contains?.('sf-clip')) {
                    cellRef.current?.cellRef.current?.classList?.remove?.('sf-clip');
                }
                cellRef.current?.cellRef.current?.classList?.add?.('sf-ellipsistooltip');
            }
        }
    }, [column.clipMode, clipMode]);

    /**
     * Trigger appropriate cell info events based on cell type
     */
    useEffect(() => {
        if (isInitialBeforePaint.current) { return; }
        if (cellType === CellTypes.Header) {
            handleHeaderCellInfo();
        } else if (cellType === CellTypes.Summary) {
            handleAggregateCellInfo();
        } else if (column?.uid !== 'empty-cell-uid') {
            handleQueryCellInfo();
        }
    }, [formattedValue, handleHeaderCellInfo, handleQueryCellInfo, handleAggregateCellInfo, isInitialBeforePaint.current]);

    useEffect(() => {
        if (isInitialBeforePaint.current) { return; }
        if (!isInitialLoad && column?.uid === 'empty-cell-uid') {
            handleQueryCellInfo();
        }
    }, [formattedValue, isInitialLoad, handleQueryCellInfo, isInitialBeforePaint.current]);

    const headerSortProperties: { index: number, className: string, direction: string } = useMemo(() => {
        if (cellType !== CellTypes.Header) { return null; }
        const sortedColumn: SortDescriptor[] = grid.sortSettings?.columns;
        let index: number | null = null;
        let cssSortClassName: string = '';
        let direction: string = 'none';
        for (let i: number = 0, len: number = sortedColumn?.length; i < len; i++) {
            if (column.field === sortedColumn?.[parseInt(i.toString(), 10)].field) {
                index = sortedColumn?.length > 1 ? i + 1 : null;
                direction = sortedColumn?.[parseInt(i.toString(), 10)].direction;
                cssSortClassName = sortedColumn?.[parseInt(i.toString(), 10)].direction === 'Ascending' ? CSS_ASENDING_SORT :
                    sortedColumn?.[parseInt(i.toString(), 10)].direction === 'Descending' ? CSS_DESCENDING_SORT : '';
            }
        }
        return { index: index, className: cssSortClassName, direction: direction };
    }, [grid.sortSettings]);

    /**
     * Method to sanitize any suspected untrusted strings and scripts before rendering them.
     *
     * @param {string} value - Specifies the html value to sanitize
     * @returns {string} Returns the sanitized html string
     */

    const sanitizeContent: (value: string) => string | JSX.Element = useCallback((value: string): string | JSX.Element => {
        let sanitizedValue: string;
        if (enableHtmlSanitizer) {
            sanitizedValue =  SanitizeHtmlHelper.sanitize(value);
        } else {
            sanitizedValue = value;
        }
        if (cellType === CellTypes.Data && getColumnByField?.(column.field)?.type === ColumnType.Boolean && column.displayAsCheckBox) {
            const checked: boolean = isNaN(parseInt(sanitizedValue?.toString(), 10)) ? sanitizedValue === 'true' :
                parseInt(sanitizedValue.toString(), 10) > 0;
            return <Checkbox checked={checked} disabled={true} className={cssClass}/>;
        } else {
            return sanitizedValue;
        }
    }, [getColumnByField]);

    /**
     * Memoized header cell content
     */
    const headerCellContent: JSX.Element | null = useMemo(() => {
        if (cellType !== CellTypes.Header) { return null; }

        // Extract existing className from customAttributes to avoid duplication
        const existingClassName: string = customAttributes.className;

        // Create array of unique class names to avoid duplicates
        const classNames: string[] = props.cell.className.split(' ');

        // Add existing classes from customAttributes (includes cell type classes from Row.tsx)
        if (!isNullOrUndefined(existingClassName)) {
            classNames.push(...existingClassName.split(' ').filter((cls: string) => cls.trim()));
        }

        // Add alignment class if not already present
        classNames.push(alignHeaderClass);

        // Add custom header cell class.
        classNames.push(!isNullOrUndefined(cellClass) ? (typeof cellClass === 'function' ?
            cellClass({rowIndex: props.row.index, column, cellType: CellType.Header}) : cellClass) : '');

        // Remove duplicates and join
        const finalClassName: string = [...new Set(classNames)].filter((cls: string) => cls).join(' ');
        const content: string | JSX.Element = !isNullOrUndefined(props.cell.column.headerTemplate) ? formattedValue as ReactElement
            : sanitizeContent(formattedValue as string || headerText || field);

        return (
            <th
                ref={cellRef.current.cellRef}
                {...customAttributes}
                className={finalClassName}
                aria-sort={headerSortProperties.direction === 'Ascending' ? 'ascending' :
                    headerSortProperties.direction === 'Descending' ? 'descending' : 'none'}
            >
                <div className='sf-cell-inner'>
                    <div className={CSS_HEADER_CELL_DIV} data-mappinguid={props.cell.column.uid} key={`header-cell-${props.cell?.column?.uid}`}>
                        <span className={CSS_HEADER_TEXT} {...(disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ?
                            { children: content } :
                            { dangerouslySetInnerHTML: { __html: content } })}
                        />
                        {allowSort && grid?.sortSettings?.enabled && (
                            headerSortProperties.direction === 'Ascending' ? (
                                <span className={`${CSS_SORT_ICON} ${headerSortProperties.className}`}>
                                    <ArrowUpIcon />
                                </span>
                            ) : headerSortProperties.direction === 'Descending' ? (
                                <span className={`${CSS_SORT_ICON} ${headerSortProperties.className}`}>
                                    <ArrowDownIcon />
                                </span>
                            ) : null
                        )}
                        {headerSortProperties.index && <span className={CSS_SORT_NUMBER}>{headerSortProperties.index}</span>}
                    </div>
                </div>
            </th>
        );
    }, [
        cellType,
        index,
        customAttributes,
        cellClass,
        alignHeaderClass,
        visibleClass,
        formattedValue,
        field,
        headerText,
        disableHtmlEncode,
        props.row?.index,
        grid.sortSettings
    ]);

    /**
     * Memoized data cell content
     */
    const dataCellContent: JSX.Element | null = useMemo(() => {
        if (cellType !== CellTypes.Data) { return null; }

        // Extract existing className from customAttributes to avoid duplication
        const existingClassName: string = customAttributes.className;

        // Create array of unique class names to avoid duplicates
        const classNames: string[] = props.cell.className.split(' ');

        // Add existing classes from customAttributes (includes cell type classes from Row.tsx)
        if (!isNullOrUndefined(existingClassName)) {
            classNames.push(...existingClassName.split(' ').filter((cls: string) => cls.trim()));
        }

        // Add alignment class if not already present
        classNames.push(alignClass);

        // Add custom content cell class.
        classNames.push(!isNullOrUndefined(cellClass) ? (typeof cellClass === 'function' ?
            cellClass({data: props.row.data, rowIndex: props.row.index, column, cellType: CellType.Content}) : cellClass) : '');

        const content: string | JSX.Element = !isNullOrUndefined(props.cell.column.template) ? formattedValue as ReactElement
            : sanitizeContent(formattedValue as string);
        classNames.push(content === '' || isNullOrUndefined(content) ? 'sf-empty-cell' : '');
        // Remove duplicates and join
        const finalClassName: string = [...new Set(classNames)].filter((cls: string) => cls).join(' ');

        return (
            <td
                ref={cellRef.current.cellRef}
                {...customAttributes}
                className={finalClassName}
                {...(disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ?
                    { children: content } :
                    { dangerouslySetInnerHTML: { __html: content } })} />
        );
    }, [
        cellType,
        customAttributes,
        cellClass,
        alignClass,
        visibleClass,
        formattedValue,
        index,
        disableHtmlEncode,
        props.row?.index
    ]);

    /**
     * Memoized summary cell content
     */
    const summaryCellContent: JSX.Element | null = useMemo(() => {
        if (cellType !== CellTypes.Summary) { return null; }

        // Extract existing className from customAttributes to avoid duplication
        const existingClassName: string = customAttributes.className;

        // Create array of unique class names to avoid duplicates
        const classNames: string[] = [];

        // Add existing classes from customAttributes (includes cell type classes from Row.tsx)
        classNames.push(...existingClassName.split(' ').filter((cls: string) => cls.trim()));

        // Add alignment class if not already present
        classNames.push(alignClass);

        // Add custom aggregate class.
        classNames.push(!isNullOrUndefined(aggregateCellClass) ? (typeof aggregateCellClass === 'function' ?
            aggregateCellClass({data: props.row.data, rowIndex: props.row.index, column, cellType: CellType.Aggregate}) : aggregateCellClass) : '');

        const content: string | JSX.Element = props.cell.isTemplate ? formattedValue as ReactElement
            : sanitizeContent(formattedValue as string);

        classNames.push(content === '' || isNullOrUndefined(content) ? 'sf-empty-cell' : '');
        // Remove duplicates and join
        const finalClassName: string = [...new Set(classNames)].filter((cls: string) => cls).join(' ');
        return (
            <td
                ref={cellRef.current.cellRef}
                data-mappinguid={props.cell.column.uid}
                {...customAttributes}
                className={finalClassName}
                {...(disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ?
                    { children: content } :
                    { dangerouslySetInnerHTML: { __html: content } })}
            />
        );
    }, [
        cellType,
        customAttributes,
        cellClass,
        alignClass,
        visibleClass,
        formattedValue,
        index,
        disableHtmlEncode,
        props.row?.index
    ]);

    // Return the appropriate cell content based on cell type
    return cellType === CellTypes.Header ? headerCellContent : cellType === CellTypes.Summary ? summaryCellContent : dataCellContent;
}
) as <T>(props: Partial<IColumnBase<T>>) => JSX.Element;

/**
 * Set display name for debugging purposes
 */
(ColumnBase as MemoExoticComponent<<T>(props: Partial<IColumnBase<T>>) => JSX.Element>).displayName = 'ColumnBase';

/**
 * Column component for declarative usage in user code
 *
 * @component
 * @example
 * ```tsx
 * <Column field="name" headerText="Name" />
 * ```
 * @param {Partial<ColumnProps>} _props - Column configuration properties
 * @returns {JSX.Element} ColumnBase component with the provided properties
 */
export const Column: <T>(props: Partial<ColumnProps<T>>) => JSX.Element =
// eslint-disable-next-line @typescript-eslint/no-unused-vars
<T, >(_props: Partial<ColumnProps<T>>): JSX.Element => {
    return null;
};

/**
 * Export the ColumnBase component for internal use
 *
 * @private
 */
export { ColumnBase };
