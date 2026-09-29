import { memo, useMemo, type FC, type HTMLAttributes, type ReactNode } from 'react';
import { useAccordionContext } from '../context/accordion-context';
import { useAccordionItemContext } from '../context/accordion-item-context';
import { ACCORDION_CLASSES } from '../constants';
import { AccordionContextValue } from '../internal-types';

/**
 * `AccordionHeader` is a semantic container for the clickable header row in `Accordion`.
 * Provides consistent styling and structure for displaying a panel's header and integrating trigger and indicator controls.
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
export interface AccordionHeaderProps {
    /**
     * Specifies the child content for the component.
     *
     * @default -
     */
    children?: ReactNode;

    /**
     * Specifies additional class names merged onto the header.
     *
     * @default -
     */
    className?: string;
}

type IAccordionHeaderProps = AccordionHeaderProps & HTMLAttributes<HTMLElement>;

export const AccordionHeader: FC<IAccordionHeaderProps> = memo((props: IAccordionHeaderProps): ReactNode => {
    const { children, className, ...restProps } = props;
    const { value, disabled } = useAccordionItemContext();
    const ctx: AccordionContextValue = useAccordionContext();
    const headerProps: HTMLAttributes<HTMLElement> = ctx.hook.getHeaderProps(value);

    const hookDisabled: boolean = ctx.getDisabled(value);
    const effectiveDisabled: boolean = disabled || hookDisabled;

    const mergedClassName: string = useMemo((): string => {
        if (ctx.unstyled) {
            return className ?? '';
        }
        return [
            ACCORDION_CLASSES.HEADER,
            ACCORDION_CLASSES.CONTENT_CENTER,
            className
        ].filter(Boolean).join(' ');
    }, [ctx.unstyled, className]);

    const merged: HTMLAttributes<HTMLElement> = useMemo(() => ({
        ...restProps,
        ...headerProps,
        'data-disabled': effectiveDisabled ? 'true' : undefined,
        'className': mergedClassName
    }), [restProps, headerProps, effectiveDisabled, mergedClassName]);

    return (
        <div {...merged}>
            {children}
        </div>
    );
});

AccordionHeader.displayName = 'AccordionHeader';
