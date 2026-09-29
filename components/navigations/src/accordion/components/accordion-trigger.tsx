import { memo, useCallback, useMemo, type FC, type HTMLAttributes, type ReactNode, MouseEvent } from 'react';
import { useAccordionContext } from '../context/accordion-context';
import { useAccordionItemContext } from '../context/accordion-item-context';
import { ACCORDION_CLASSES } from '../constants';
import { AccordionContextValue } from '../internal-types';
import { useProviderContext, useRippleEffect } from '@syncfusion/react-base';

/**
 * `AccordionTrigger` is a semantic container for the clickable trigger row in `Accordion`.
 * Provides consistent styling and structure for toggling a panel's open/closed state and enabling interactive header behavior.
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
export interface AccordionTriggerProps {
    /**
     * Specifies the child content for the component.
     *
     * @default -
     */
    children?: ReactNode;

    /**
     * Specifies additional class names merged onto the trigger.
     *
     * @default -
     */
    className?: string;
}

type IAccordionTriggerProps = AccordionTriggerProps & HTMLAttributes<HTMLDivElement>;

export const AccordionTrigger: FC<IAccordionTriggerProps> = memo((props: IAccordionTriggerProps): ReactNode => {
    const { children, className, ...restProps } = props;
    const { value, disabled } = useAccordionItemContext();
    const ctx: AccordionContextValue = useAccordionContext();
    const { onMouseDown, ...remainingProps } = ctx.hook.getTriggerProps(value);
    const { ripple } = useProviderContext();
    const { Ripple, rippleMouseDown } = useRippleEffect(ripple);

    const isOpen: boolean = ctx.hook.isOpen(value);
    const hookDisabled: boolean = ctx.getDisabled(value);
    const effectiveDisabled: boolean = disabled || hookDisabled;

    const handleMouseDown: (e: MouseEvent<HTMLDivElement>) => void = useCallback((e: MouseEvent<HTMLDivElement>): void => {
        rippleMouseDown(e);
        onMouseDown?.(e);
    }, [onMouseDown, rippleMouseDown]);

    const mergedClassName: string = useMemo((): string => {
        if (ctx.unstyled) {
            return className ?? '';
        }
        return [
            ACCORDION_CLASSES.TRIGGER,
            ACCORDION_CLASSES.CONTENT_BETWEEN,
            isOpen ? ACCORDION_CLASSES.OPEN : ACCORDION_CLASSES.CLOSED,
            effectiveDisabled ? ACCORDION_CLASSES.DISABLED : '',
            className
        ].filter(Boolean).join(' ');
    }, [ctx.unstyled, isOpen, effectiveDisabled, className]);

    const merged: HTMLAttributes<HTMLDivElement> = useMemo(() => ({
        ...restProps,
        ...remainingProps,
        'aria-disabled': effectiveDisabled ? true : undefined,
        'data-disabled': effectiveDisabled ? 'true' : undefined,
        'className': mergedClassName
    }), [restProps, remainingProps, effectiveDisabled, mergedClassName]);

    return (
        <div {...merged} onMouseDown={handleMouseDown}>
            {children}
            {ripple ? <Ripple /> : null}
        </div>
    );
});

AccordionTrigger.displayName = 'AccordionTrigger';
