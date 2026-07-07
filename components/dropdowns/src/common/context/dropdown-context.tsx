import { createContext, useContext, ReactNode, FC, Context } from 'react';
import { DropdownContextType } from './context-types';

/**
 * React Context for managing dropdown component state and functionality.
 * This context provides access to state, actions, refs, and configuration
 * for all composite components within the dropdown hierarchy.
 *
 * @private
 */
export const DropdownContext: Context<DropdownContextType | undefined> = createContext<DropdownContextType | undefined>(undefined);

export const DropdownProvider: FC<{ value: DropdownContextType; children: ReactNode; }> = DropdownContext.Provider;

export const useDropdownContext: () => DropdownContextType = (): DropdownContextType => {
    const context: DropdownContextType | undefined = useContext(DropdownContext);
    if (!context) {
        throw new Error(
            'useDropdownContext must be used within a DropdownProvider. ' +
            'Ensure the component is rendered as a child of the Dropdown component.'
        );
    }
    return context;
};
