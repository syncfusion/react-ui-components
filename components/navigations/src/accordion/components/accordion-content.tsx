import { memo, useMemo, type FC, type HTMLAttributes, type ReactNode } from 'react';
import { useAccordionContext } from '../context/accordion-context';
import { useAccordionItemContext } from '../context/accordion-item-context';
import { ACCORDION_CLASSES } from '../constants';
import { AccordionContextValue } from '../internal-types';

/**
 * `AccordionContent` is a semantic container for the collapsible content region in `Accordion`.
 * Provides consistent styling and structure for displaying a panel's body when it is expanded.
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
export interface AccordionContentProps {
    /**
     * Specifies the child content for the component.
     *
     * @default -
     */
    children?: ReactNode;

    /**
     * Specifies additional class names merged onto the content.
     *
     * @default -
     */
    className?: string;
}

type IAccordionContentProps = AccordionContentProps & HTMLAttributes<HTMLDivElement>;

export const AccordionContent: FC<IAccordionContentProps> = memo((props: IAccordionContentProps): ReactNode => {
    const { children, className, ...restProps } = props;
    const { value } = useAccordionItemContext();
    const ctx: AccordionContextValue = useAccordionContext();
    const mounted: boolean = ctx.shouldMount(value);
    const contentProps: HTMLAttributes<HTMLDivElement> = ctx.hook.getContentProps(value);

    const isOpen: boolean = ctx.hook.isOpen(value);

    const mergedClassName: string = useMemo((): string => {
        if (ctx.unstyled) {
            return className ?? '';
        }
        return [
            ACCORDION_CLASSES.CONTENT,
            mounted && !isOpen ?  ACCORDION_CLASSES.DISPLAY_NONE : '',
            className
        ].filter(Boolean).join(' ');
    }, [ctx.unstyled, isOpen, className, mounted]);

    const merged: HTMLAttributes<HTMLDivElement> = useMemo((): HTMLAttributes<HTMLDivElement> => ({
        ...restProps,
        ...contentProps,
        className: mergedClassName
    }), [restProps, contentProps, mergedClassName]);

    if (!mounted) {
        return null;
    }

    return (
        <div {...merged}>
            {children}
        </div>
    );
});

AccordionContent.displayName = 'AccordionContent';
