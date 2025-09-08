import { isNullOrUndefined } from '@syncfusion/react-base';
import { ServiceLocator } from '../types/interfaces';
/**
 * Creates a new ServiceLocator instance
 *
 * @returns {ServiceLocator} A ServiceLocator instance
 * @private
 */
export const createServiceLocator: () => ServiceLocator = (): ServiceLocator => {
    const servicesMap: { [x: string]: Object } = {};

    const serviceLocator: ServiceLocator = {
        /**
         * @returns {Object} The services map
         */
        get services(): { readonly [x: string]: Object } {
            return servicesMap;
        },

        register: <T, >(name: string, type: T): void => {
            if (isNullOrUndefined(servicesMap[name as string])) {
                servicesMap[name as string] = type;
            }
        },

        unregisterAll: (): void => {
            Object.keys(servicesMap).forEach((key: string) => {
                delete servicesMap[key as string];
            });
        },

        getService: <T, >(name: string): T => {
            if (isNullOrUndefined(servicesMap[name as string])) {
                throw new Error(`The service ${name} is not registered`);
            }
            return servicesMap[name as string] as T;
        }
    };

    return serviceLocator;
};

