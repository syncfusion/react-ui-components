import { useMemo, HTMLAttributes, ForwardRefExoticComponent, forwardRef, RefAttributes, Ref, useImperativeHandle, RefObject, useRef } from 'react';
import { useProviderContext } from '@syncfusion/react-base';
import { HeaderPlacement, TabsProps } from './types';
import { COMMON_CLASSES, TABS_CLASSES } from '../common/constants';
import { useTabs } from './use-tabs';
import { TabsProvider } from './tabs-context';
import { orientationFromPlacement, PLACEMENT_CLASS } from './constants';

/**
 * Interface for Tabs component instance.
 */
export interface ITabs extends TabsProps {

    /**
     * Specifies the DOM element of the tabs.
     *
     * @private
     * @default null
     */
    element: HTMLDivElement | null;
}

type TabsComponentProps = TabsProps & HTMLAttributes<HTMLDivElement>;

/**
 * A tabs component that renders a tab list, a panel container, and an optional
 * active-tab indicator.
 *
 * ```tsx
 * import { Tabs, Tab, TabList, TabPanel, TabPanels } from "@syncfusion/react-navigations";
 *
 * export default function App() {
 *     return (
 *         <Tabs defaultValue="overview">
 *             <TabList>
 *                 <Tab value="overview">Overview</Tab>
 *                 <Tab value="specs">Specs</Tab>
 *             </TabList>
 *             <TabPanels>
 *                 <TabPanel value="overview">Overview content</TabPanel>
 *                 <TabPanel value="specs">Specs content</TabPanel>
 *             </TabPanels>
 *         </Tabs>
 *     );
 * }
 * ```
 */
export const Tabs: ForwardRefExoticComponent<TabsComponentProps & RefAttributes<ITabs>> =
    forwardRef<ITabs, TabsComponentProps>((props: TabsComponentProps, ref: Ref<ITabs>) => {
        const {
            unstyled,
            defaultValue,
            value,
            onValueChange,
            onFocusChange,
            selectOnFocus,
            loopFocus,
            headerPlacement = 'Top',
            renderMode,
            overflowMode,
            scrollStep,
            variant,
            onClose,
            className,
            style,
            children,
            id
        } = props;

        const { dir } = useProviderContext();
        const orientation: 'horizontal' | 'vertical' = orientationFromPlacement(headerPlacement);
        const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

        const headless: ReturnType<typeof useTabs> = useTabs({
            defaultValue,
            value,
            onValueChange,
            onFocusChange,
            selectOnFocus,
            loopFocus,
            headerPlacement,
            overflowMode,
            scrollStep,
            variant,
            onClose
        });

        useImperativeHandle(ref, (): ITabs => ({
            unstyled,
            defaultValue,
            value,
            selectOnFocus,
            loopFocus,
            headerPlacement,
            renderMode,
            overflowMode,
            scrollStep,
            variant,
            onClose,
            element: rootRef.current
        }), [unstyled, defaultValue, value, selectOnFocus, loopFocus, headerPlacement,
            renderMode, overflowMode, scrollStep, variant,
            onClose]);

        const config: typeof headless.contextValue = useMemo((): typeof headless.contextValue => ({
            ...headless.contextValue,
            unstyled: unstyled === true,
            renderMode: renderMode || 'Active'
        }), [headless.contextValue, unstyled, renderMode]);

        const resolveVariantClass: string = ((): string => {
            if (variant === 'fill') { return TABS_CLASSES.FILL; }
            if (variant === 'accent') { return TABS_CLASSES.ACCENT; }
            return TABS_CLASSES.DEFAULT_VARIANT;
        })();

        const resolveOverflowClass: string = ((): string => {
            if (overflowMode === 'Popup') { return TABS_CLASSES.POPUP; }
            return TABS_CLASSES.SCROLLABLE;
        })();

        const rootClassName: string = useMemo((): string => {
            if (config.unstyled) { return className ? className : ''; }
            return [
                TABS_CLASSES.ROOT,
                PLACEMENT_CLASS[headerPlacement as HeaderPlacement],
                orientation === 'vertical' ? TABS_CLASSES.VERTICAL : TABS_CLASSES.HORIZONTAL,
                resolveVariantClass,
                resolveOverflowClass,
                config.hasIndicator ? TABS_CLASSES.HAS_INDICATOR : null,
                TABS_CLASSES.POS_RELATIVE,
                TABS_CLASSES.DISPLAY_FLEX,
                dir === 'rtl' ? COMMON_CLASSES.RTL : '',
                className
            ].filter(Boolean).join(' ');
        }, [config.unstyled, headerPlacement, orientation, variant, overflowMode,
            config.hasIndicator, dir, className]);

        const rootDOMProps: ReturnType<typeof config.getTabsRootProps> = config.getTabsRootProps({
            id: id as string,
            placement: headerPlacement
        });

        return (
            <TabsProvider value={config}>
                <div
                    ref={rootRef}
                    className={rootClassName}
                    style={style}
                    {...rootDOMProps}
                >
                    {children}
                </div>
            </TabsProvider>
        );
    });
