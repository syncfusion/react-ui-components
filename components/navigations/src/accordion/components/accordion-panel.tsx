import { memo, useMemo, type FC, type HTMLAttributes, type ReactNode } from 'react';
import { useAccordionContext } from '../context/accordion-context';
import { AccordionItemProvider } from '../context/accordion-item-context';
import { ACCORDION_CLASSES } from '../constants';
import { AccordionContextValue, AccordionItemContextValue } from '../internal-types';

/**
 * `AccordionPanel` is a semantic container for a panel in `Accordion`.
 * Provides consistent styling and structure for grouping a panel's header and content within the accordion.
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
export interface AccordionPanelProps {
    /**
     * Specifies the panel identity.
     *
     * @default -
     */
    value: string | number;

    /**
     * Specifies whether the panel is disabled.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies the child content for the component.
     *
     * @default -
     */
    children?: ReactNode;
}

type IAccordionPanelProps = AccordionPanelProps & HTMLAttributes<HTMLElement>;

export const AccordionPanel: FC<IAccordionPanelProps> = memo((props: IAccordionPanelProps): ReactNode => {
    const { value, disabled = false, children, className, ...restProps } = props;
    const ctx: AccordionContextValue = useAccordionContext();
    const panelProps: HTMLAttributes<HTMLElement> = ctx.hook.getPanelProps(value, disabled);

    const isOpen: boolean = ctx.hook.isOpen(value);
    const isFocused: boolean = ctx.hook.state.focusedValue === value;
    const hookDisabled: boolean = ctx.getDisabled(value);
    const effectiveDisabled: boolean = disabled || hookDisabled;

    const mergedClassName: string = useMemo((): string => {
        if (ctx.unstyled) {
            return className ?? '';
        }
        return [
            ACCORDION_CLASSES.PANEL,
            isOpen ? ACCORDION_CLASSES.OPEN : ACCORDION_CLASSES.CLOSED,
            effectiveDisabled ? ACCORDION_CLASSES.DISABLED : '',
            isFocused ? ACCORDION_CLASSES.FOCUSED : '',
            className
        ].filter(Boolean).join(' ');
    }, [ctx.unstyled, isOpen, isFocused, effectiveDisabled, className]);

    const merged: HTMLAttributes<HTMLElement> = useMemo((): HTMLAttributes<HTMLElement> => ({
        ...restProps,
        ...panelProps,
        className: mergedClassName
    }), [restProps, panelProps, mergedClassName]);

    const itemContextValue: AccordionItemContextValue = useMemo(() => ({ value, disabled: effectiveDisabled }), [value, effectiveDisabled]);

    return (
        <AccordionItemProvider value={itemContextValue}>
            <div {...merged}>
                {children}
            </div>
        </AccordionItemProvider>
    );
});

AccordionPanel.displayName = 'AccordionPanel';
