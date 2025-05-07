import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
// Create context with default empty fallback
const ProviderContext = createContext({ locale: 'en-US', dir: 'ltr', ripple: false });
// The Locale provider component
export const Provider = (props) => {
    const { children, locale = 'en-US', dir = 'ltr', ripple = false } = props;
    return (_jsx(ProviderContext.Provider, { value: { locale, dir, ripple }, children: children }));
};
/**
 * Custom hook to consume locale context.
 *
 * @private
 * @returns {ProviderContextProps} - The locale context value.
 */
export function useProviderContext() {
    return useContext(ProviderContext);
}
