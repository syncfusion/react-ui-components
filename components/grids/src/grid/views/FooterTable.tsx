import {
    forwardRef,
    ForwardRefExoticComponent,
    RefAttributes,
    useImperativeHandle,
    useRef,
    useMemo,
    memo,
    JSX,
    RefObject
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
            const { colElements: ColElements } = useGridMutableProvider();
            const { id } = useGridComputedProvider();

            // Refs for DOM elements and child components
            const footerTableRef: RefObject<HTMLTableElement> = useRef<HTMLTableElement>(null);
            const rowSectionRef: RefObject<FooterRowsRef> = useRef<FooterRowsRef>(null);

            /**
             * Memoized colgroup element to prevent unnecessary re-renders
             * Contains column definitions for the table
             */
            const colGroupContent: JSX.Element = useMemo<JSX.Element>(() => (
                <colgroup
                    key={`summarycontent-${id}-colgroup`}
                    id={`summarycontent-${id}-colgroup`}
                >
                    {ColElements}
                </colgroup>
            ), [ColElements, id]);

            /**
             * Expose internal elements and methods through the forwarded ref
             */
            useImperativeHandle(ref, () => ({
                footerTableRef: footerTableRef.current,
                getFooterTable: () => footerTableRef.current,
                ...(rowSectionRef.current)
            }), [footerTableRef.current, rowSectionRef.current]);

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
