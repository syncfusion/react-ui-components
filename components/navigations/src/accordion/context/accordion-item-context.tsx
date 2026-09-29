import { createContext, useContext, type Context, type ReactNode, type FC, memo } from 'react';
import type { AccordionItemContextValue } from '../internal-types';

/**
 * Specifies the React context for the per-item payload.
 *
 * @private
 */
export const AccordionItemContext: Context<AccordionItemContextValue | undefined> =
    createContext<AccordionItemContextValue | undefined>(undefined);

/**
 * Specifies the `AccordionItemProvider` component.
 *
 * @private
 */
export interface AccordionItemProviderProps {
    value: AccordionItemContextValue;
    children: ReactNode;
}

export const AccordionItemProvider: FC<AccordionItemProviderProps> = memo(
    (props: AccordionItemProviderProps): ReactNode => (
        <AccordionItemContext.Provider value={props.value}>
            {props.children}
        </AccordionItemContext.Provider>
    )
);

AccordionItemProvider.displayName = 'AccordionItemProvider';

export const useAccordionItemContext: () => AccordionItemContextValue = (): AccordionItemContextValue => {
    const ctx: AccordionItemContextValue | undefined = useContext(AccordionItemContext);
    if (ctx === undefined) {
        throw new Error('useAccordionItemContext must be used within a Accordion component.');
    }
    return ctx;
};
