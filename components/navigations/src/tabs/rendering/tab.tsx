import { memo, ReactNode, HTMLAttributes, useMemo, useRef, useCallback } from 'react';
import { TabValue, TabCloseEvent } from '../types';
import { COMMON_CLASSES, TABS_CLASSES } from '../../common/constants';
import { useTabsContext } from '../tabs-context';
import { CloseIcon } from '@syncfusion/react-icons';
import { Button } from '@syncfusion/react-buttons';
import { Color, Size, Variant } from '@syncfusion/react-base';

/**
 * Specifies the props for the `<Tab>` sub-component.
 *
 * @public
 */
export interface TabProps {

    /**
     * Specifies the value that uniquely identifies the tab.
     *
     * @default -
     */
    value: TabValue;

    /**
     * Specifies whether the tab is disabled and non-interactive.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies the optional close handler. When provided, the tab renders a close button that
     * triggers this callback; pressing `Delete` on a focused closeable tab also fires it.
     *
     * @default -
     */
    onClose?: (event: TabCloseEvent) => void;

    /**
     * Specifies the tab label content.
     *
     * @default -
     */
    children: ReactNode;
}

type TabComponentProps = TabProps & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown' | 'onKeyPress' | 'onKeyUp' | 'onFocus' | 'onBlur'>;

const TabInner: (props: TabComponentProps) => ReactNode =
    (props: TabComponentProps): ReactNode => {
        const { value, disabled, onClose, children } = props;
        const ctx: ReturnType<typeof useTabsContext> = useTabsContext();
        const isActive: boolean = ctx.isItemActive(value);
        const isFocused: boolean = ctx.isItemFocused(value);
        const effectiveDisabled: boolean = !!disabled;
        const hasClose: boolean = !effectiveDisabled && typeof onClose === 'function';
        const hostRef: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const setHostRef: (el: HTMLDivElement | null) => void = useCallback((el: HTMLDivElement | null): void => {
            hostRef.current = el;
        }, []);

        const composedClassName: string = useMemo((): string => (
            ctx.unstyled ? ''
                : [TABS_CLASSES.TAB,
                    isActive && TABS_CLASSES.TAB_SELECTED,
                    isFocused && TABS_CLASSES.TAB_FOCUSED,
                    effectiveDisabled && TABS_CLASSES.TAB_DISABLED,
                    hasClose && TABS_CLASSES.TAB_HAS_CLOSE,
                    TABS_CLASSES.DISPLAY_INLINE_FLEX,
                    TABS_CLASSES.ALIGN_CENTER,
                    TABS_CLASSES.POS_RELATIVE,
                    TABS_CLASSES.PREVENT_SELECT,
                    TABS_CLASSES.NOWRAP,
                    COMMON_CLASSES.CONTROL,
                    effectiveDisabled ? TABS_CLASSES.CURSOR_NOT_ALLOWED : TABS_CLASSES.CURSOR_POINTER].filter(Boolean).join(' ')
        ), [ctx.unstyled, isActive, isFocused, effectiveDisabled, hasClose]);

        const { ref: registerRef, ...tabDOMProps } = ctx.getTabProps(value, props) as { ref?: (el: HTMLDivElement | null) => void } & Omit<ReturnType<typeof ctx.getTabProps>, 'ref'>;

        const composedRef: (el: HTMLDivElement | null) => void = useCallback((el: HTMLDivElement | null): void => {
            setHostRef(el);
            registerRef?.(el);
        }, [setHostRef, registerRef]);

        const closeButton: ReactNode = hasClose ? (
            <Button
                size={Size.Small}
                color={Color.Primary}
                variant={Variant.Standard}
                icon={<CloseIcon height={16} width={16} />}
                className={ctx.unstyled ? '' : TABS_CLASSES.TAB_CLOSE}
                {...ctx.getTabCloseButtonProps(value, onClose)}
            />
        ) : null;

        return (
            <>
                <div
                    ref={composedRef}
                    className={composedClassName}
                    {...tabDOMProps}
                >
                    <span className={TABS_CLASSES.TAB_LABEL}>
                        {children}
                    </span>
                    {closeButton}
                </div>
            </>
        );
    };

export const Tab: (props: TabComponentProps) => ReactNode =
    memo(TabInner, (prev: TabComponentProps, next: TabComponentProps): boolean => {
        if (prev.value !== next.value) { return false; }
        if (prev.disabled !== next.disabled) { return false; }
        if (typeof prev.onClose !== typeof next.onClose) { return false; }
        return true;
    });
