import { forwardRef, ForwardRefExoticComponent, RefAttributes, useImperativeHandle, useRef, useMemo, memo, CSSProperties, RefObject, JSX } from 'react';
import { FooterTableBase } from './FooterTable';
import { useGridComputedProvider } from '../contexts';
import {
    FooterPanelRef, FooterTableRef, IFooterPanelBase
} from '../types';

// Constant CSS class
const CSS_FOOTER_TABLE: string = 'sf-table';

/**
 * Default styles for footer table to ensure consistent rendering
 *
 * @type {CSSProperties}
 */
const DEFAULT_TABLE_STYLE: CSSProperties = {
    borderCollapse: 'separate',
    borderSpacing: '0.25px'
};

/**
 * FooterPanelBase component renders the static area for the grid footer.
 * This component wraps the FooterTableBase in a scrollable container and
 * is responsible for organizing the footer rows and synchronizing scrolling behavior.
 *
 * @component
 * @private
 * @param {Partial<IFooterPanelBase>} props - Component properties
 * @param {object} props.panelAttributes - Attributes to apply to the footer panel container
 * @param {object} props.scrollContentAttributes - Attributes to apply to the scrollable content container
 * @param {RefObject<FooterPanelRef>} ref - Forwarded ref to expose internal elements
 * @returns {JSX.Element} The rendered footer container with scrollable table
 */
const FooterPanelBase: ForwardRefExoticComponent<Partial<IFooterPanelBase> & RefAttributes<FooterPanelRef>> =
    memo(forwardRef<FooterPanelRef, Partial<IFooterPanelBase>>(
        (props: Partial<IFooterPanelBase>, ref: RefObject<FooterPanelRef>) => {
            const { panelAttributes, scrollContentAttributes, tableScrollerPadding } = props;
            const { id } = useGridComputedProvider();

            // Refs for DOM elements and child components
            const footerPanelRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const footerScrollRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const footerTableRef: RefObject<FooterTableRef> = useRef<FooterTableRef>(null);

            /**
             * Expose internal elements and methods through the forwarded ref
             * Only define properties specific to FooterPanel and forward FooterTable properties
             */
            useImperativeHandle(ref, () => ({
                // FooterPanel specific properties
                footerPanelRef: footerPanelRef.current,
                footerScrollRef: footerScrollRef.current,

                // Forward all properties from FooterTable
                ...(footerTableRef.current)
            }), [footerPanelRef.current, footerScrollRef.current, footerTableRef.current]);

            /**
             * Memoized footer table component to prevent unnecessary re-renders
             */
            const footerTable: JSX.Element = useMemo(() => (
                <FooterTableBase
                    ref={footerTableRef}
                    className={`${CSS_FOOTER_TABLE}`}
                    role="presentation"
                    id={`${id}_summarycontent_table`}
                    style={DEFAULT_TABLE_STYLE}
                    tableScrollerPadding={tableScrollerPadding}
                />
            ), [tableScrollerPadding]);

            return (
                <div
                    ref={footerPanelRef}
                    {...panelAttributes}
                >
                    <div
                        ref={footerScrollRef}
                        {...scrollContentAttributes}
                    >
                        {footerTable}
                    </div>
                </div>
            );
        }
    ), (prevProps: Partial<IFooterPanelBase>, nextProps: Partial<IFooterPanelBase>) => {
        // Custom comparison function for memo to prevent unnecessary re-renders
        // Only re-render if styles have changed
        const prevStyle: CSSProperties = prevProps.panelAttributes?.style;
        const nextStyle: CSSProperties = nextProps.panelAttributes?.style;
        const prevScrollStyle: CSSProperties = prevProps.scrollContentAttributes?.style;
        const nextScrollStyle: CSSProperties = nextProps.scrollContentAttributes?.style;

        // Deep comparison of style objects
        const stylesEqual: boolean =
            JSON.stringify(prevStyle) === JSON.stringify(nextStyle) &&
            JSON.stringify(prevScrollStyle) === JSON.stringify(nextScrollStyle);

        return stylesEqual;
    });

/**
 * Set display name for debugging purposes
 */
FooterPanelBase.displayName = 'FooterPanelBase';

/**
 * Export the FooterPanelBase component for direct usage if needed
 *
 * @private
 */
export { FooterPanelBase };
