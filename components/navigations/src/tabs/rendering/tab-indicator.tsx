import { memo, CSSProperties, ReactNode, useEffect, useMemo, HTMLAttributes } from 'react';
import { TABS_CLASSES } from '../../common/constants';
import { useTabsContext } from '../tabs-context';

/**
 * Specifies the props for the optional `<TabIndicator>` sub-component.
 *
 * @public
 */
export interface TabIndicatorProps {

    /**
     * Specifies the class name appended to the indicator element.
     *
     * @default -
     */
    className?: string;

    /**
     * Specifies the indicator transition duration in milliseconds.
     *
     * @default 200
     */
    transitionDuration?: number;

    /**
     * Specifies the indicator transition easing function name.
     *
     * @default 'ease'
     */
    transitionEasing?: string;

    /**
     * Specifies any custom content rendered inside the indicator
     * (typically empty).
     *
     * @default -
     */
    children?: ReactNode;
}

type TabIndicatorComponentProps = TabIndicatorProps & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown' | 'onKeyPress' | 'onKeyUp' | 'onFocus' | 'onBlur'>;

const TabIndicatorInner: (props: TabIndicatorComponentProps) => ReactNode =
    (props: TabIndicatorComponentProps): ReactNode => {
        const { className, style, id, transitionDuration, transitionEasing, children } = props;
        const ctx: ReturnType<typeof useTabsContext> = useTabsContext();

        useEffect(() => {
            ctx.setHasIndicator(true);
            return (): void => { ctx.setHasIndicator(false); };
        }, [ctx.setHasIndicator]);

        const duration: number = transitionDuration !== undefined ? transitionDuration : 200;
        const easing: string = transitionEasing !== undefined ? transitionEasing : 'ease';

        const composedClassName: string = useMemo((): string => {
            const orientationClass: string =
                ctx.headerPlacement === 'Bottom' ? TABS_CLASSES.INDICATOR_HORIZONTAL_BOTTOM
                    : ctx.headerPlacement === 'Right' ? TABS_CLASSES.INDICATOR_VERTICAL_RIGHT
                        : ctx.headerPlacement === 'Left' ? TABS_CLASSES.INDICATOR_VERTICAL
                            : TABS_CLASSES.INDICATOR_HORIZONTAL;
            return ctx.unstyled
                ? (className || '')
                : [
                    TABS_CLASSES.INDICATOR,
                    TABS_CLASSES.POS_ABSOLUTE,
                    TABS_CLASSES.NO_POINTER,
                    orientationClass,
                    className
                ].filter(Boolean).join(' ');
        }, [ctx.unstyled, className, ctx.headerPlacement]);

        const composedStyle: CSSProperties = useMemo((): CSSProperties => ({
            ...(style || {}),
            '--tab-indicator-transition-duration': `${duration}ms`,
            '--tab-indicator-transition-easing': easing
        }) as CSSProperties, [style, duration, easing]);

        const indicatorDOMProps: ReturnType<typeof ctx.getTabIndicatorProps> =
            ctx.getTabIndicatorProps({ id: id ?? null, placement: ctx.headerPlacement });

        return (
            <div
                className={composedClassName}
                style={composedStyle}
                {...indicatorDOMProps}
            >
                {children}
            </div>
        );
    };

export const TabIndicator: (props: TabIndicatorComponentProps) => ReactNode =
    memo(TabIndicatorInner, (prev: TabIndicatorComponentProps, next: TabIndicatorComponentProps): boolean => {
        if (prev.className !== next.className) { return false; }
        if (prev.style !== next.style) { return false; }
        if (prev.id !== next.id) { return false; }
        if (prev.transitionDuration !== next.transitionDuration) { return false; }
        if (prev.transitionEasing !== next.transitionEasing) { return false; }
        if (prev.children !== next.children) { return false; }
        return true;
    });
