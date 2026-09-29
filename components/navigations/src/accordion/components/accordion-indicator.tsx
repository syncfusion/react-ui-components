import { memo, useMemo, type FC, type HTMLAttributes, type ReactNode } from 'react';
import { useAccordionContext } from '../context/accordion-context';
import { useAccordionItemContext } from '../context/accordion-item-context';
import { ACCORDION_CLASSES } from '../constants';
import { ChevronDownIcon } from '@syncfusion/react-icons';
import { AccordionContextValue } from '../internal-types';
import { AccordionIndicatorTemplateContext } from '../types';

/**
 * `AccordionIndicator` is a semantic container for the decorative state indicator in `Accordion`.
 * Provides consistent styling and structure for displaying a panel's open/closed state.
 *
 * ```tsx
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
export interface AccordionIndicatorProps {
    /**
     * Specifies the child content for the component.
     *
     * @default -
     */
    children?: (ctx: AccordionIndicatorTemplateContext) => ReactNode;

    /**
     * Specifies additional class names merged onto the indicator.
     *
     * @default -
     */
    className?: string;
}

type IAccordionIndicatorProps = AccordionIndicatorProps & Omit<HTMLAttributes<HTMLSpanElement>, keyof AccordionIndicatorProps>;

export const AccordionIndicator: FC<IAccordionIndicatorProps> = memo((props: IAccordionIndicatorProps): ReactNode => {
    const { children, className, ...restProps } = props;
    const { value } = useAccordionItemContext();
    const ctx: AccordionContextValue = useAccordionContext();
    const indicatorProps: HTMLAttributes<HTMLSpanElement> = ctx.hook.getIndicatorProps(value);

    const isOpen: boolean = ctx.hook.isOpen(value);

    const mergedClassName: string = useMemo((): string => {
        if (ctx.unstyled) {
            return className ?? '';
        }
        return [
            ACCORDION_CLASSES.INDICATOR,
            isOpen ? ACCORDION_CLASSES.OPEN : ACCORDION_CLASSES.CLOSED,
            isOpen && !children ? ACCORDION_CLASSES.DEFAULT_OPEN : '',
            className
        ].filter(Boolean).join(' ');
    }, [ctx.unstyled, isOpen, className, children]);

    const merged: HTMLAttributes<HTMLSpanElement> = useMemo((): HTMLAttributes<HTMLSpanElement> => ({
        ...restProps,
        ...indicatorProps,
        className: mergedClassName
    }), [restProps, indicatorProps, mergedClassName]);

    const content: ReactNode = useMemo((): ReactNode => {
        if (typeof children === 'function') {
            return children({ isOpen });
        }
        return <ChevronDownIcon />;
    }, [children, isOpen]);

    return (
        <span {...merged}>
            {content}
        </span>
    );
});

AccordionIndicator.displayName = 'AccordionIndicator';
