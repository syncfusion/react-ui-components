import { createContext, useContext, type Context, type ReactNode, type FC } from 'react';
import type { AccordionContextValue } from '../internal-types';

/**
 * Specifies the React context shared between `<Accordion>`.
 *
 * @private
 */
export const AccordionContext: Context<AccordionContextValue | undefined> =
    createContext<AccordionContextValue | undefined>(undefined);

/**
 * Specifies the `AccordionContextProvider` component.
 *
 * @private
 */
export interface AccordionContextProviderProps {
    value: AccordionContextValue;
    children: ReactNode;
}

export const AccordionContextProvider: FC<AccordionContextProviderProps> =
    (props: AccordionContextProviderProps): ReactNode => (
        <AccordionContext.Provider value={props.value}>
            {props.children}
        </AccordionContext.Provider>
    );

AccordionContextProvider.displayName = 'AccordionContextProvider';

export const useAccordionContext: () => AccordionContextValue = (): AccordionContextValue => {
    const ctx: AccordionContextValue | undefined = useContext(AccordionContext);
    if (ctx === undefined) {
        throw new Error('useAccordionContext must be used within a Accordion component.');
    }
    return ctx;
};
