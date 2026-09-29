import { ReactNode, HTMLAttributes, useMemo } from 'react';
import { COMMON_CLASSES, TABS_CLASSES } from '../../common/constants';
import { useTabsContext } from '../tabs-context';

/**
 * Specifies the props for the `<TabPanels>` sub-component.
 *
 * @public
 */
export interface TabPanelsProps {

    /**
     * Specifies the class name appended to the panels container.
     *
     * @default -
     */
    className?: string;

    /**
     * Specifies the panel children composed of `<TabPanel>` elements.
     *
     * @default -
     */
    children: ReactNode;
}

type TabPanelsComponentProps = TabPanelsProps & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown' | 'onKeyPress' | 'onKeyUp' | 'onFocus' | 'onBlur'>;

export const TabPanels: (props: TabPanelsComponentProps) => ReactNode =
    (props: TabPanelsComponentProps): ReactNode => {
        const { className, style, id, children } = props;
        const ctx: ReturnType<typeof useTabsContext> = useTabsContext();
        const composedClassName: string = useMemo((): string => {
            return ctx.unstyled
                ? (className || '')
                : [
                    TABS_CLASSES.PANELS,
                    TABS_CLASSES.POS_RELATIVE,
                    COMMON_CLASSES.CONTROL,
                    className
                ].filter(Boolean).join(' ');
        }, [ctx.unstyled, className]);

        const panelsDOMProps: ReturnType<typeof ctx.getTabPanelsProps> = ctx.getTabPanelsProps({ id });

        return (
            <div
                className={composedClassName}
                style={style}
                {...panelsDOMProps}
            >
                {children}
            </div>
        );
    };
