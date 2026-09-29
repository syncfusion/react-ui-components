import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, type ForwardRefExoticComponent, type HTMLAttributes, type Ref, type RefAttributes } from 'react';
import { AccordionProps, UseAccordionReturn } from './types';
import { useAccordion } from './use-accordion';
import { AccordionContextProvider } from './context/accordion-context';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import { COMMON_CLASSES } from '../common/constants';
import { ACCORDION_CLASSES } from './constants';
import { AccordionContextValue } from './internal-types';

/**
 * Interface for Accordion component instance.
 */
export interface IAccordion extends AccordionProps {

    /**
     * Specifies the DOM element of the Accordion.
     *
     * @private
     * @default null
     */
    element: HTMLDivElement | null;
}

type AccordionComponentProps = AccordionProps & Omit<HTMLAttributes<HTMLDivElement>, keyof AccordionProps>;

/**
 * A vertically stacked, collapsible content container. Each panel pairs a header with a content region, with single- or multi-open behavior and
 * controlled and uncontrolled value support.
 *
 * ```typescript
 * import { Accordion, AccordionPanel, AccordionHeader, AccordionTrigger, AccordionIndicator, AccordionContent } from '@syncfusion/react-navigations';
 *
 * export default function App() {
 *     return (
 *         <Accordion defaultValue={['service']}>
 *             <AccordionPanel value='service'>
 *                 <AccordionHeader>
 *                     <AccordionTrigger>What is this service about? <AccordionIndicator /></AccordionTrigger>
 *                 </AccordionHeader>
 *                 <AccordionContent>
 *                     Service details…
 *                 </AccordionContent>
 *             </AccordionPanel>
 *         </Accordion>
 *     );
 * }
 * ```
 */
export const Accordion: ForwardRefExoticComponent<AccordionComponentProps & RefAttributes<IAccordion>> =
    memo(forwardRef<IAccordion, AccordionComponentProps>((props: AccordionComponentProps, ref: Ref<IAccordion>) => {
        const {
            value,
            defaultValue,
            onChange,
            multiple = false,
            openOnFocus = false,
            renderMode = 'Active',
            unstyled = false,
            borderless = false,
            className,
            children,
            ...rest
        } = props;

        const { dir } = useProviderContext();

        useEffect(() => {
            preRender('accordion');
        }, []);

        const hookReturn: UseAccordionReturn = useAccordion({
            value,
            defaultValue,
            onChange,
            multiple,
            openOnFocus,
            renderMode,
            borderless
        });

        const renderModeClassName: string = useMemo((): string => {
            switch (renderMode) {
            case 'Retained':
                return ACCORDION_CLASSES.RENDER_RETAINED;
            case 'All':
                return ACCORDION_CLASSES.RENDER_ALL;
            case 'Active':
            default:
                return ACCORDION_CLASSES.RENDER_ACTIVE;
            }
        }, [renderMode]);

        const rootClassName: string = useMemo((): string => {
            if (unstyled) {
                return className ?? '';
            }
            return [
                ACCORDION_CLASSES.ROOT,
                renderModeClassName,
                borderless ? ACCORDION_CLASSES.BORDERLESS : '',
                COMMON_CLASSES.CONTROL,
                dir === 'rtl' ? COMMON_CLASSES.RTL : '',
                className
            ].filter(Boolean).join(' ');
        }, [unstyled, renderModeClassName, borderless, dir, className]);

        const { rootProps, rootRef } = hookReturn;
        const mergedRootProps: HTMLAttributes<HTMLDivElement> = {
            ...rootProps,
            className: rootClassName,
            ...rest
        };

        useImperativeHandle(ref, (): IAccordion => ({
            value,
            defaultValue,
            multiple,
            openOnFocus,
            renderMode,
            unstyled,
            borderless,
            element: rootRef.current
        }), [value, defaultValue, multiple, openOnFocus, renderMode, unstyled, borderless, rootRef]);

        const providerValue: AccordionContextValue = useMemo(() => ({
            hook: hookReturn,
            getDisabled: hookReturn.getDisabled,
            shouldMount: hookReturn.shouldMount,
            unstyled
        }), [hookReturn, unstyled]);

        return (
            <AccordionContextProvider value={providerValue}>
                <div  {...mergedRootProps}>
                    {children}
                </div>
            </AccordionContextProvider>
        );
    }));

Accordion.displayName = 'Accordion';
