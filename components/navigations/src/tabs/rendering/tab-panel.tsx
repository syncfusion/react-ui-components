import { useMemo, useRef, useEffect, RefObject, ReactNode, HTMLAttributes } from 'react';
import { TabValue } from '../types';
import { TABS_CLASSES } from '../../common/constants';
import { useTabsContext } from '../tabs-context';
import { RenderMode } from '../..';

/**
 * Specifies the props for the `<TabPanel>` sub-component.
 *
 * @public
 */
export interface TabPanelProps {

    /**
     * Specifies the value that uniquely identifies the panel;
     * must match the parent `<Tab>`.
     */
    value: TabValue;

    /**
     * Specifies the class name appended to the panel element.
     *
     * @default -
     */
    className?: string;

    /**
     * Specifies the panel content.
     *
     * @default -
     */
    children: ReactNode;
}

type TabPanelComponentProps = TabPanelProps & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown' | 'onKeyPress' | 'onKeyUp' | 'onFocus' | 'onBlur'>;

interface TabPanelPrimitiveProps extends TabPanelComponentProps {
    value: TabValue;
}

/**
 * Determines whether a tab panel should be mounted based on its active state,
 * previous activation state, and the configured render mode.
 *
 * @private
 * @param {boolean} active Indicates whether the tab is currently active.
 * @param {boolean} wasActive Indicates whether the tab has previously been active.
 * @param {RenderMode} renderMode The rendering strategy for the tab panel.
 * @returns {'mounted' | 'unmounted'} The mount state of the tab panel.
 */
const computeMountState: (
    active: boolean,
    wasActive: boolean,
    renderMode: RenderMode
) => 'mounted' | 'unmounted' =
    (active: boolean, wasActive: boolean, renderMode: RenderMode): 'mounted' | 'unmounted' => {
        switch (renderMode) {
        case 'All':
            return 'mounted';
        case 'Active':
            return active ? 'mounted' : 'unmounted';
        case 'Retained':
        default:

            return active || wasActive ? 'mounted' : 'unmounted';
        }
    };

export const TabPanel: (props: TabPanelComponentProps) => ReactNode =
    (props: TabPanelPrimitiveProps): ReactNode => {
        const { value, className, style, children } = props;
        const ctx: ReturnType<typeof useTabsContext> = useTabsContext();
        const wasActiveRef: RefObject<boolean> = useRef<boolean>(false);
        const isActive: boolean = ctx.isItemActive(value);

        useEffect(() => {
            if (isActive) {
                wasActiveRef.current = true;
            }
        }, [isActive]);

        const wasActive: boolean = wasActiveRef.current;
        const renderMode: RenderMode = ctx.renderMode;
        const mountState: 'mounted' | 'unmounted' = computeMountState(isActive, wasActive, renderMode);
        const panelRenderProps: ReturnType<typeof ctx.getPanelProps> = ctx.getPanelProps(value, props);
        const composedClassName: string = useMemo((): string => {
            return ctx.unstyled
                ? (className || '')
                : [TABS_CLASSES.PANEL, isActive && TABS_CLASSES.PANEL_ACTIVE, className]
                    .filter(Boolean)
                    .join(' ');
        }, [ctx.unstyled, isActive, className]);

        if (mountState === 'unmounted') { return null; }
        return (
            <div
                className={composedClassName}
                style={style}
                {...panelRenderProps}
            >
                {children}
            </div>
        );
    };
