import { forwardRef, ForwardRefExoticComponent, RefAttributes, useImperativeHandle, useRef, useMemo, memo, CSSProperties, RefObject, JSX } from 'react';
import { HeaderTableBase } from './index';
import { HeaderPanelRef, HeaderTableRef, IHeaderPanelBase } from '../types';
import { useGridComputedProvider } from '../contexts';

// CSS class constants following enterprise naming convention
const CSS_HEADER_TABLE: string = 'sf-table';

/**
 * Default styles for header table to ensure consistent rendering
 *
 * @type {CSSProperties}
 */
const DEFAULT_TABLE_STYLE: CSSProperties = {
    borderCollapse: 'separate',
    borderSpacing: '0.25px'
};

/**
 * HeaderPanelBase component renders the static area for the grid header.
 * This component wraps the HeaderTableBase in a scrollable container and
 * is responsible for organizing the header rows and synchronizing scrolling behavior.
 *
 * @component
 * @private
 * @param {Partial<IHeaderPanelBase>} props - Component properties
 * @param {object} props.panelAttributes - Attributes to apply to the header panel container
 * @param {object} props.scrollContentAttributes - Attributes to apply to the scrollable content container
 * @param {RefObject<HeaderPanelRef>} ref - Forwarded ref to expose internal elements
 * @returns {JSX.Element} The rendered header container with scrollable table
 */
const HeaderPanelBase: ForwardRefExoticComponent<Partial<IHeaderPanelBase> & RefAttributes<HeaderPanelRef>> =
    memo(forwardRef<HeaderPanelRef, Partial<IHeaderPanelBase>>(
        (props: Partial<IHeaderPanelBase>, ref: RefObject<HeaderPanelRef>) => {
            const { panelAttributes, scrollContentAttributes } = props;
            const { sortSettings, filterSettings, gridLines } = useGridComputedProvider();

            // Refs for DOM elements and child components
            const headerPanelRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const headerScrollRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const headerTableRef: RefObject<HeaderTableRef> = useRef<HeaderTableRef>(null);

            /**
             * Expose internal elements and methods through the forwarded ref
             * Only define properties specific to HeaderPanel and forward HeaderTable properties
             */
            useImperativeHandle(ref, () => ({
                // HeaderPanel specific properties
                headerPanelRef: headerPanelRef.current,
                headerScrollRef: headerScrollRef.current,

                // Forward all properties from HeaderTable
                ...(headerTableRef.current)
            }), [headerPanelRef.current, headerScrollRef.current, headerTableRef.current]);

            const headerTableSort: string = sortSettings?.enabled || filterSettings?.enabled ? 'sf-sortfilter' : '';
            const headerTableFilter: string = filterSettings?.enabled && gridLines === 'Default' ? 'sf-filterbartable' : '';
            const headerRightBorder: string = !filterSettings?.enabled || (filterSettings.enabled && (gridLines === 'Vertical' || gridLines === 'None'))  ? ' sf-headerborder' : '';
            /**
             * Memoized header table component to prevent unnecessary re-renders
             */
            const headerTable: JSX.Element = useMemo(() => (
                <HeaderTableBase
                    ref={headerTableRef}
                    className={`${CSS_HEADER_TABLE} ${headerTableSort} ${headerTableFilter}`}
                    role="presentation"
                    style={DEFAULT_TABLE_STYLE}
                />
            ), [headerTableFilter]);

            return (
                <div
                    ref={headerPanelRef}
                    {...panelAttributes}
                >
                    <div
                        ref={headerScrollRef}
                        {...scrollContentAttributes}
                        className={scrollContentAttributes.className + headerRightBorder}
                    >
                        {headerTable}
                    </div>
                </div>
            );
        }
    ), (prevProps: Partial<IHeaderPanelBase>, nextProps: Partial<IHeaderPanelBase>) => {
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
HeaderPanelBase.displayName = 'HeaderPanelBase';

/**
 * Export the HeaderPanelBase component for direct usage if needed
 *
 * @private
 */
export { HeaderPanelBase };
