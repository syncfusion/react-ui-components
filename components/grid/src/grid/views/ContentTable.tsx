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
import { ContentRowsBase } from './index';
import {
    ContentTableRef,
    IContentTableBase,
    ContentRowsRef, MutableGridSetter
} from '../types/interfaces';
import { IGrid } from '../types/grid.interfaces';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';

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
const ContentTableBase: ForwardRefExoticComponent<Partial<IContentTableBase> & RefAttributes<ContentTableRef>> =
    memo(forwardRef<ContentTableRef, Partial<IContentTableBase>>(
        (props: Partial<IContentTableBase>, ref: RefObject<ContentTableRef>) => {
            // Access grid context providers
            const { colElements: ColElements } = useGridMutableProvider();
            const grid: Partial<IGrid> & Partial<MutableGridSetter> = useGridComputedProvider();
            const { id } = grid;

            // Refs for DOM elements and child components
            const contentTableRef: RefObject<HTMLTableElement | null>  = useRef<HTMLTableElement>(null);
            const rowSectionRef: RefObject<ContentRowsRef | null> = useRef<ContentRowsRef>(null);

            /**
             * Memoized colgroup element to prevent unnecessary re-renders
             * Contains column definitions for the table
             */
            const colGroupContent: JSX.Element = useMemo<JSX.Element>(() => (
                <colgroup
                    key={`content-${id}-colgroup`}
                    id={`content-${id}-colgroup`}
                >
                    {ColElements.length ? ColElements : null}
                </colgroup>
            ), [ColElements, id]);

            /**
             * Expose internal elements and methods through the forwarded ref
             * Only define properties specific to ContentTable and forward ContentRows properties
             */
            useImperativeHandle(ref, () => ({
                // ContentTable specific properties
                contentTableRef: contentTableRef.current,
                getContentTable: () => contentTableRef.current,
                // Forward all properties from ContentRows
                ...(rowSectionRef.current)
            }), [contentTableRef.current, rowSectionRef.current]);

            /**
             * Memoized content rows component to prevent unnecessary re-renders
             */
            const contentRows: JSX.Element = useMemo(() => (
                <ContentRowsBase
                    ref={rowSectionRef}
                    role="rowgroup"
                />
            ), []);

            return (
                <table
                    ref={contentTableRef}
                    {...props}
                >
                    {colGroupContent}
                    {contentRows}
                </table>
            );
        }
    ));

/**
 * Set display name for debugging purposes
 */
ContentTableBase.displayName = 'ContentTableBase';

/**
 * Export the ContentTableBase component for use in other components
 *
 * @private
 */
export { ContentTableBase };
