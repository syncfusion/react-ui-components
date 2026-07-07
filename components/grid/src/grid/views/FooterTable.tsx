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
    useState,
    useLayoutEffect
} from 'react';
import { FooterRowsBase } from './FooterRows';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';
import {
    FooterRowsRef,
    FooterTableRef,
    IFooterTableBase
} from '../types';
import { parseUnit } from '../utils';

/**
 * FooterTableBase component renders the table structure for grid footer
 *
 * @component
 * @private
 * @param {Partial<IFooterTableBase>} props - Component properties
 * @param {string} [props.className] - Additional CSS class names
 * @param {string} [props.role] - ARIA role attribute
 * @param {Object} [props.style] - Inline styles for the table
 * @param {RefObject<FooterTableRef>} ref - Forwarded ref to expose internal elements and methods
 * @returns {JSX.Element} The rendered footer table component
 */
const FooterTableBase: ForwardRefExoticComponent<Partial<IFooterTableBase> & RefAttributes<FooterTableRef>> =
    memo(forwardRef<FooterTableRef, Partial<IFooterTableBase>>(
        (props: Partial<IFooterTableBase>, ref: RefObject<FooterTableRef>) => {
            const { tableScrollerPadding, ...rest } = props;
            // Access grid context providers
            const { colElements: ColElements, offsetX, virtualSettings } = useGridMutableProvider();
            const { id, scrollModule } = useGridComputedProvider();

            // Refs for DOM elements and child components
            const footerTableRef: RefObject<HTMLTableElement> = useRef<HTMLTableElement>(null);
            const rowSectionRef: RefObject<FooterRowsRef> = useRef<FooterRowsRef>(null);
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
                    } else {
                        const startIndex: number = scrollModule?.virtualColumnInfo?.startIndex;
                        const endIndex: number = scrollModule?.virtualColumnInfo?.endIndex;
                        totalWidth.current = 0;
                        for (let i: number = startIndex; i < endIndex; i++) {
                            const col: JSX.Element = ColElements[i as number];
                            visibleCols.push(col);

                            // Optional: If you ever need cumulative width, you can calculate here
                            const styleWidth: number = col?.props?.style?.width;
                            totalWidth.current += parseUnit(styleWidth);
                        }
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
                virtualSettings.enableColumn,
                scrollModule?.virtualColumnInfo?.startIndex,
                scrollModule?.virtualColumnInfo?.endIndex,
                forceRerender, totalWidth.current
            ]);

            /**
             * Expose internal elements and methods through the forwarded ref
             */
            useImperativeHandle(ref, () => ({
                footerTableRef: footerTableRef.current,
                getFooterTable: () => footerTableRef.current,
                columnClientWidth: totalWidth.current,
                ...(rowSectionRef.current)
            }), [footerTableRef.current, rowSectionRef.current, totalWidth.current]);

            useLayoutEffect(() => {
                setForceRerender({});
            }, [offsetX]);

            /**
             * Memoized footer rows component to prevent unnecessary re-renders
             */
            const footerRows: JSX.Element = useMemo(() => (
                <FooterRowsBase
                    ref={rowSectionRef}
                    role="rowgroup"
                    tableScrollerPadding={tableScrollerPadding}
                />
            ), [tableScrollerPadding]);

            return (
                <table
                    ref={footerTableRef}
                    {...rest}
                >
                    {colGroupContent}
                    {footerRows}
                </table>
            );
        }
    ));

/**
 * Set display name for debugging purposes
 */
FooterTableBase.displayName = 'FooterTableBase';

/**
 * Export the FooterTableBase component for use in other components
 *
 * @private
 */
export { FooterTableBase };
