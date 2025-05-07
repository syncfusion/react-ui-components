import { ReactNode } from 'react';
interface ProviderContextProps {
    locale: string;
    dir: string;
    ripple: boolean;
}
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
export declare const Provider: React.FC<ProviderProps>;
/**
 * Custom hook to consume locale context.
 *
 * @private
 * @returns {ProviderContextProps} - The locale context value.
 */
export declare function useProviderContext(): ProviderContextProps;
export {};
