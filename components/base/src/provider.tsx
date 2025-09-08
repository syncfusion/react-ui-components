import { createContext, useContext, ReactNode } from 'react';

// Define the shape of the context
interface ProviderContextProps {
    locale: string;
    dir: string;
    ripple: boolean;
    animate: boolean;
}

// Create context with default empty fallback
const ProviderContext: React.Context<ProviderContextProps> = createContext<ProviderContextProps>({locale: 'en-US', dir: 'ltr', ripple: false, animate: true});

/**
 * Props for the Provider context.
 */
export interface ProviderProps {
    /**
     * Components that will have access to the provided context value.
     */
    children: ReactNode;
    /**
     * Specifies the locale for the component.
     *
     * @default 'en-US'
     */
    locale?: string;
    /**
     * Specifies the text direction of the component. Use 'ltr' for left-to-right or 'rtl' for right-to-left.
     *
     * @default 'ltr'
     */
    dir?: string;
    /**
     * Enables or disables the ripple effect for the component.
     *
     * @default false
     */
    ripple?: boolean;
    /**
     * Enables or disables the animation effect for the component.
     *
     * @default true
     */
    animate?: boolean;
}

// The Locale provider component
export const Provider: React.FC<ProviderProps> = (props: ProviderProps) => {
    const { children, locale = 'en-US', dir = 'ltr', ripple = false, animate = true} = props;
    return (
        <ProviderContext.Provider value={{ locale, dir, ripple, animate }}>
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
