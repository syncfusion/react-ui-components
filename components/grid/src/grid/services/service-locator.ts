import { isNullOrUndefined } from '@syncfusion/react-base';
import { ServiceLocator } from '../types/interfaces';

// ServiceLocator constants
const SERVICE_NOT_REGISTERED_ERROR: string = 'The service {0} is not registered';

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

        register: <T extends object>(name: string, type: T): void => {
            if (isNullOrUndefined(servicesMap[name as string])) {
                servicesMap[name as string] = type;
            }
        },

        unregisterAll: (): void => {
            Object.keys(servicesMap).forEach((key: string) => {
                delete servicesMap[key as string];
            });
        },

        getService: <T extends object>(name: string): T => {
            if (isNullOrUndefined(servicesMap[name as string])) {
                throw new Error(SERVICE_NOT_REGISTERED_ERROR.replace('{0}', name));
            }
            return servicesMap[name as string] as T;
        }
    };

    return serviceLocator;
};

