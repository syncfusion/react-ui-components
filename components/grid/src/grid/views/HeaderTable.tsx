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
import { HeaderRowsBase } from './index';
import {
    HeaderRowsRef,
    HeaderTableRef,
    IHeaderTableBase
} from '../types';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';

/**
 * HeaderTableBase component renders the table structure for grid headers
 *
 * @component
 * @private
 * @param {Partial<IHeaderTableBase>} props - Component properties
 * @param {string} [props.className] - Additional CSS class names
 * @param {string} [props.role] - ARIA role attribute
 * @param {Object} [props.style] - Inline styles for the table
 * @param {RefObject<HeaderTableRef>} ref - Forwarded ref to expose internal elements and methods
 * @returns {JSX.Element} The rendered header table component
 */
const HeaderTableBase: ForwardRefExoticComponent<Partial<IHeaderTableBase> & RefAttributes<HeaderTableRef>> =
    memo(forwardRef<HeaderTableRef, Partial<IHeaderTableBase>>(
        (props: Partial<IHeaderTableBase>, ref: RefObject<HeaderTableRef>) => {
            // Access grid context providers
            const { colElements: ColElements } = useGridMutableProvider();
            const { id } = useGridComputedProvider();

            // Refs for DOM elements and child components
            const headerTableRef: RefObject<HTMLTableElement> = useRef<HTMLTableElement>(null);
            const rowSectionRef: RefObject<HeaderRowsRef> = useRef<HeaderRowsRef>(null);

            /**
             * Memoized colgroup element to prevent unnecessary re-renders
             * Contains column definitions for the table
             */
            const colGroupContent: JSX.Element = useMemo<JSX.Element>(() => (
                <colgroup
                    key={`${id}-colgroup`}
                    id={`${id}-colgroup`}
                >
                    {ColElements.length ? ColElements : null}
                </colgroup>
            ), [ColElements, id]);

            /**
             * Expose internal elements and methods through the forwarded ref
             */
            useImperativeHandle(ref, () => ({
                headerTableRef: headerTableRef.current,
                getHeaderTable: () => headerTableRef.current,
                ...(rowSectionRef.current)
            }), [headerTableRef.current, rowSectionRef.current]);

            /**
             * Memoized header rows component to prevent unnecessary re-renders
             */
            const headerRows: JSX.Element = useMemo(() => (
                <HeaderRowsBase
                    ref={rowSectionRef}
                    role="rowgroup"
                />
            ), []);

            return (
                <table
                    ref={headerTableRef}
                    {...props}
                >
                    {colGroupContent}
                    {headerRows}
                </table>
            );
        }
    ));

/**
 * Set display name for debugging purposes
 */
HeaderTableBase.displayName = 'HeaderTableBase';

/**
 * Export the HeaderTableBase component for use in other components
 *
 * @private
 */
export { HeaderTableBase };
