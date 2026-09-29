import {
    forwardRef,
    ForwardRefExoticComponent,
    RefAttributes,
    useImperativeHandle,
    useRef,
    useMemo,
    memo,
    JSX,
    RefObject,
    ReactElement,
    useState,
    useLayoutEffect
} from 'react';
import { ContentRowsBase } from './ContentRows';
import { ContentTableRef, IContentTableBase, ContentRowsRef } from '../types/interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { buildVisibleColumnGroup, parseUnit } from '../utils/utils';

/**
 * ContentTableBase component renders the table structure for grid content
 *
 * @component
 * @private
 * @param {Partial<IContentTableBase>} props - Component properties
 * @param {string} [props.className] - Additional CSS class names
 * @param {string} [props.role] - ARIA role attribute
 * @param {string} [props.id] - ID attribute for the table
 * @param {Object} [props.style] - Inline styles for the table
 * @param {RefObject<ContentTableRef>} ref - Forwarded ref to expose internal elements and methods
 * @returns {JSX.Element} The rendered content table component
 */
const ContentTableBase: <T>(props: Partial<IContentTableBase> & RefAttributes<ContentTableRef<T>>) => ReactElement =
    memo(forwardRef<ContentTableRef, Partial<IContentTableBase>>(
        <T, >(props: Partial<IContentTableBase>, ref: RefObject<ContentTableRef<T>>) => {
            // Access grid context providers
            const { colElements: ColElements, offsetX, virtualSettings, columnWidthInfo, leftPinnedColumns,
                rightPinnedColumns } = useGridMutableProvider<T>();
            const { id, scrollModule, rowNumberSettings, dragAndDropSettings, getVisibleColumns } = useGridComputedProvider<T>();

            // Refs for DOM elements and child components
            const contentTableRef: RefObject<HTMLTableElement | null>  = useRef<HTMLTableElement>(null);
            const rowSectionRef: RefObject<ContentRowsRef<T> | null> = useRef<ContentRowsRef<T>>(null);
            const [forceRerender, setForceRerender] = useState<Object>({});
            const totalWidth: RefObject<number> = useRef(0);
            /**
             * Memoized colgroup element to prevent unnecessary re-renders
             * Contains column definitions for the table
             */
            const colGroupContent: JSX.Element = useMemo(() => {
                let visibleCols: JSX.Element[] = [];

                if (ColElements.length) {
                    if (!virtualSettings.enableColumn) {
                        visibleCols = ColElements;
                        if (columnWidthInfo.current.maxTableWidth || columnWidthInfo.current.resizeTableWidth) {
                            totalWidth.current = 0;
                            for (let i: number = 0; i < ColElements.length; i++) {
                                const styleWidth: number = ColElements[i as number]?.props?.style?.width;
                                totalWidth.current += parseUnit(styleWidth);
                            }
                        }
                    } else {
                        const startIndex: number = scrollModule?.virtualColumnInfo?.startIndex ?? 0;
                        const endIndex: number = scrollModule?.virtualColumnInfo?.endIndex ?? ColElements.length;
                        const nextGroup: { visibleCols: JSX.Element[]; totalWidth: number } = buildVisibleColumnGroup(
                            ColElements,
                            getVisibleColumns(),
                            leftPinnedColumns,
                            rightPinnedColumns,
                            startIndex,
                            endIndex
                        );
                        visibleCols = nextGroup.visibleCols;
                        totalWidth.current = nextGroup.totalWidth;
                    }
                }

                return (
                    <colgroup
                        key={`content-${id}-colgroup`}
                        id={`content-${id}-colgroup`}
                    >
                        {visibleCols.length > 0 ? visibleCols : null}
                    </colgroup>
                );
            }, [
                ColElements,
                id,
                offsetX,
                getVisibleColumns,
                virtualSettings.enableColumn,
                scrollModule?.virtualColumnInfo?.startIndex,
                scrollModule?.virtualColumnInfo?.endIndex,
                forceRerender, totalWidth.current, rowNumberSettings?.enabled, dragAndDropSettings?.enabled
            ]);

            /**
             * Expose internal elements and methods through the forwarded ref
             * Only define properties specific to ContentTable and forward ContentRows properties
             */
            useImperativeHandle(ref, () => ({
                // ContentTable specific properties
                contentTableRef: contentTableRef.current,
                getContentTable: () => contentTableRef.current,
                columnClientWidth: totalWidth.current,
                // Forward all properties from ContentRows
                ...(rowSectionRef.current)
            }), [contentTableRef.current, rowSectionRef.current, totalWidth.current]);

            useLayoutEffect(() => {
                setForceRerender({});
            }, [offsetX]);

            /**
             * Memoized content rows component to prevent unnecessary re-renders
             */
            const contentRows: JSX.Element = useMemo(() => (
                <ContentRowsBase<T>
                    ref={rowSectionRef}
                    role="rowgroup"
                    pinBucket={props.pinBucket}
                />
            ), [props.pinBucket]);

            return (
                <table
                    ref={contentTableRef}
                    {...props}
                    style={{
                        ...props.style, ...(columnWidthInfo.current.maxTableWidth || columnWidthInfo.current.resizeTableWidth ?
                            { width: totalWidth.current } : {})
                    }}
                >
                    {colGroupContent}
                    {contentRows}
                </table>
            );
        }
    )) as <T>(props: Partial<IContentTableBase> & RefAttributes<ContentTableRef<T>>) => ReactElement;

/**
 * Set display name for debugging purposes
 */
(ContentTableBase as ForwardRefExoticComponent<Partial<IContentTableBase> & RefAttributes<ContentTableRef>>).displayName = 'ContentTableBase';

/**
 * Export the ContentTableBase component for use in other components
 *
 * @private
 */
export { ContentTableBase };
