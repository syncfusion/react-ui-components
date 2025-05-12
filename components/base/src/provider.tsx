import { createContext, useContext, ReactNode } from 'react';

// Define the shape of the context
interface ProviderContextProps {
    locale: string;
    dir: string;
    ripple: boolean;
}

// Create context with default empty fallback
const ProviderContext: React.Context<ProviderContextProps> = createContext<ProviderContextProps>({locale: 'en-US', dir: 'ltr', ripple: false});

/**
 * Props for the Provider context.
 */
export interface ProviderProps {
    /**
     * Child components that will be wrapped by the Provider.
     */
    children: ReactNode;
    /**
     * Overrides the global culture and localization settings for the component.
     *
     * @default 'en-US'
     */
    locale?: string;
    /**
     * Specifies the component’s rendering direction, with ltr for left-to-right and rtl for right-to-left direction.
     *
     * @default 'ltr'
     */
    dir?: string;
    /**
     * Enable or disable the ripple effect for supported components.
     *
     * @default false
     */
    ripple?: boolean;
}

// The Locale provider component
export const Provider: React.FC<ProviderProps> = (props: ProviderProps) => {
    const { children, locale = 'en-US', dir = 'ltr', ripple = false } = props;
    return (
        <ProviderContext.Provider value={{ locale, dir, ripple }}>
            {children}
        </ProviderContext.Provider>
    );
};

/**
 * Custom hook to consume locale context.
 *
 * @private
 * @returns {ProviderContextProps} - The locale context value.
 */
export function useProviderContext(): ProviderContextProps {
    return useContext(ProviderContext);
}
