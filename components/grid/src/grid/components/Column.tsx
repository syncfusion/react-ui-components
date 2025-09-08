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
    AggregateCellClassEvent,
    CellType,
    ColumnType
} from '../types';
import { IGrid } from '../types/grid.interfaces';
import { SortDescriptorModel } from '../types/sort.interfaces';
import { MutableGridSetter } from '../types/interfaces';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';
import { useColumn } from '../hooks';
import { isNullOrUndefined, SanitizeHtmlHelper, SvgIcon } from '@syncfusion/react-base';
import { Checkbox } from '@syncfusion/react-buttons';
import { ArrowUpIcon, ArrowDownIcon } from '@syncfusion/react-icons';
import { ColumnProps, IColumnBase, ColumnRef } from '../types/column.interfaces';

// CSS class constants following enterprise naming convention
const CSS_HEADER_CELL_DIV: string = 'sf-headercelldiv';
const CSS_HEADER_TEXT: string = 'sf-headertext';
const CSS_SORT_ICON: string = 'sf-sortfilterdiv sf-icons';
const CSS_SORT_NUMBER: string = 'sf-sortnumber';
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
const ColumnBase: MemoExoticComponent<(props: Partial<IColumnBase>) => JSX.Element> = memo((props: Partial<IColumnBase>) => {
    const grid: Partial<IGrid> & Partial<MutableGridSetter> = useGridComputedProvider();
    const { onHeaderCellRender, onCellRender, onAggregateCellRender, enableHtmlSanitizer, getColumnByField,
        textWrapSettings, clipMode } = grid;
    const { isInitialBeforePaint, cssClass, evaluateTooltipStatus, isInitialLoad } = useGridMutableProvider();

    // Get column-specific APIs and properties
    const { publicAPI, privateAPI } = useColumn(props);

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
        headerCellClass,
        dataCellClass
    } = column;
    const aggregateCellClass: string | ((props?: AggregateCellClassEvent) => string) = props?.cell?.aggregateColumn?.aggregateCellClass;

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
                rowData: props.row.data,
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
                rowData: props.row.data,
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
            cellRef.current?.cellRef.current?.classList?.add?.('sf-gridclip');
        } else if (column.clipMode === 'EllipsisWithTooltip' || (!column.clipMode && clipMode === 'EllipsisWithTooltip')
            && !(textWrapSettings?.enabled && (textWrapSettings.wrapMode === 'Content'
            || textWrapSettings.wrapMode === 'Both'))) {
            if (column.type !== 'checkbox' && evaluateTooltipStatus(cellRef.current?.cellRef.current)) {
                if (cellRef.current?.cellRef.current?.classList?.contains?.('sf-gridclip')) {
                    cellRef.current?.cellRef.current?.classList?.remove?.('sf-gridclip');
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
        if (cellType === CellType.Header) {
            handleHeaderCellInfo();
        } else if (cellType === CellType.Summary) {
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
        if (cellType !== CellType.Header) { return null; }
        const sortedColumn: SortDescriptorModel[] = grid.sortSettings?.columns;
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
        if (cellType === CellType.Data && getColumnByField?.(column.field)?.type === ColumnType.Boolean && column.displayAsCheckBox) {
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
        if (cellType !== CellType.Header) { return null; }

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
        classNames.push(!isNullOrUndefined(headerCellClass) ? (typeof headerCellClass === 'function' ?
            headerCellClass({rowIndex: props.row.index, column}) : headerCellClass) : '');

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
                <div className={CSS_HEADER_CELL_DIV} data-mappinguid={props.cell.column.uid} key={`header-cell-${props.cell?.column?.uid}`}>
                    {headerSortProperties.index && <span className={CSS_SORT_NUMBER}>{headerSortProperties.index}</span>}
                    <span className={CSS_HEADER_TEXT} {...(disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ?
                        { children: content } :
                        { dangerouslySetInnerHTML: { __html: content } })}
                    />
                </div>
                {allowSort && grid?.sortSettings?.enabled &&
                <div className={`${CSS_SORT_ICON} ${headerSortProperties.className}`}>
                    {headerSortProperties.direction === 'Ascending' ? <ArrowUpIcon /> :
                        headerSortProperties.direction === 'Descending' ?  <ArrowDownIcon /> : <SvgIcon></SvgIcon>}
                </div>}
            </th>
        );
    }, [
        cellType,
        index,
        customAttributes,
        headerCellClass,
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
        if (cellType !== CellType.Data) { return null; }

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
        classNames.push(!isNullOrUndefined(dataCellClass) ? (typeof dataCellClass === 'function' ?
            dataCellClass({rowData: props.row.data, rowIndex: props.row.index, column}) : dataCellClass) : '');

        // Remove duplicates and join
        const finalClassName: string = [...new Set(classNames)].filter((cls: string) => cls).join(' ');
        const content: string | JSX.Element = !isNullOrUndefined(props.cell.column.template) ? formattedValue as ReactElement
            : sanitizeContent(formattedValue as string);

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
        dataCellClass,
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
        if (cellType !== CellType.Summary) { return null; }

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
            aggregateCellClass({rowData: props.row.data, rowIndex: props.row.index, column}) : aggregateCellClass) : '');

        // Remove duplicates and join
        const finalClassName: string = [...new Set(classNames)].filter((cls: string) => cls).join(' ');
        const content: string | JSX.Element = props.cell.isTemplate ? formattedValue as ReactElement
            : sanitizeContent(formattedValue as string);
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
        aggregateCellClass,
        alignClass,
        visibleClass,
        formattedValue,
        index,
        disableHtmlEncode,
        props.row?.index
    ]);

    // Return the appropriate cell content based on cell type
    return cellType === CellType.Header ? headerCellContent : cellType === CellType.Summary ? summaryCellContent : dataCellContent;
}
);

/**
 * Set display name for debugging purposes
 */
ColumnBase.displayName = 'ColumnBase';

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Column: (props: Partial<ColumnProps>) => JSX.Element = (_props: Partial<ColumnProps>): JSX.Element => {
    return null;
};

/**
 * Export the ColumnBase component for internal use
 *
 * @private
 */
export { ColumnBase };
