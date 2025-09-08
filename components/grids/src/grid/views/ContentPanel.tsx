import {
    forwardRef,
    ForwardRefExoticComponent,
    RefAttributes,
    useImperativeHandle,
    useRef,
    useMemo,
    memo,
    CSSProperties,
    RefObject,
    JSX
} from 'react';
import { ContentTableBase } from './index';
import {
    ContentPanelRef,
    IContentPanelBase,
    ContentTableRef
} from '../types';
import {
    useGridComputedProvider
} from '../contexts';

// CSS class constants following enterprise naming convention
const CSS_CONTENT_TABLE: string = 'sf-table';

/**
 * Default styles for content table to ensure consistent rendering
 *
 * @type {CSSProperties}
 */
const DEFAULT_TABLE_STYLE: CSSProperties = {
    borderCollapse: 'separate',
    borderSpacing: '0.25px'
};

/**
 * ContentPanelBase component renders the scrollable grid content area
 *
 * @component
 * @private
 * @param {Partial<IContentPanelBase>} props - Component properties
 * @param {object} props.panelAttributes - Attributes to apply to the content panel container
 * @param {object} props.scrollContentAttributes - Attributes to apply to the scrollable content container
 * @param {RefObject<ContentPanelRef>} ref - Forwarded ref to expose internal elements and methods
 * @returns {JSX.Element} The rendered grid content wrapper
 */
const ContentPanelBase: ForwardRefExoticComponent<Partial<IContentPanelBase> & RefAttributes<ContentPanelRef>> =
    memo(forwardRef<ContentPanelRef, Partial<IContentPanelBase>>(
        (props: Partial<IContentPanelBase>, ref: RefObject<ContentPanelRef>) => {
            const { panelAttributes, scrollContentAttributes } = props;
            const { id } = useGridComputedProvider();

            // Refs for DOM elements and child components
            const contentPanelRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const contentScrollRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const contentTableRef: RefObject<ContentTableRef> = useRef<ContentTableRef>(null);

            /**
             * Expose internal elements and methods through the forwarded ref
             * Only define properties specific to ContentPanel and forward ContentTable properties
             */
            useImperativeHandle(ref, () => ({
                // ContentPanel specific properties
                contentPanelRef: contentPanelRef.current,
                contentScrollRef: contentScrollRef.current,

                // Forward all properties from ContentTable
                ...(contentTableRef.current as ContentTableRef)
            }), [contentPanelRef.current, contentScrollRef.current, contentTableRef.current]);

            /**
             * Memoized content table component to prevent unnecessary re-renders
             */
            const contentTable: JSX.Element = useMemo(() => (
                <ContentTableBase
                    ref={contentTableRef}
                    className={CSS_CONTENT_TABLE}
                    role="presentation"
                    id={`${id}_content_table`}
                    style={DEFAULT_TABLE_STYLE}
                />
            ), [id]);

            return (
                <div
                    {...panelAttributes}
                    ref={contentPanelRef}
                >
                    <div
                        ref={contentScrollRef}
                        {...scrollContentAttributes}
                    >
                        {contentTable}
                    </div>
                </div>
            );
        }
    ), (prevProps: Partial<IContentPanelBase>, nextProps: Partial<IContentPanelBase>) => {
        // Custom comparison function for memo to prevent unnecessary re-renders
        // Only re-render if styles have changed
        const prevStyle: CSSProperties = prevProps.scrollContentAttributes?.style;
        const nextStyle: CSSProperties = nextProps.scrollContentAttributes?.style;
        const isBusyEqual: boolean = prevProps.scrollContentAttributes?.['aria-busy'] === nextProps.scrollContentAttributes?.['aria-busy'];
        prevProps.panelAttributes.className = nextProps.panelAttributes.className;

        // Deep comparison of style objects
        const stylesEqual: boolean = JSON.stringify(prevStyle) === JSON.stringify(nextStyle);

        return stylesEqual && isBusyEqual;
    });

/**
 * Set display name for debugging purposes
 */
ContentPanelBase.displayName = 'ContentPanelBase';

/**
 * Export the ContentPanelBase component for use in other components
 *
 * @private
 */
export { ContentPanelBase };
