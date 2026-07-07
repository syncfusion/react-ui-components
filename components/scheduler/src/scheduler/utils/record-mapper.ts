import { EventFields, EventModel } from '../types/scheduler-types';
import { DEFAULT_FIELDS, getEventModelFields } from './default-props';

/**
 * Translates event data from user field names to internal format.
 * - Maps custom field names to standard property names
 * - Keeps extra fields that are not in the standard mapping
 *
 * @param {Record<string, any>} data - Event data with custom field names
 * @param {EventFields} fields - Field name mappings
 * @returns {EventModel} Converted event data
 * @private
 */
export const makeInternalRecord: (data: Record<string, any>, fields?: EventFields) => EventModel =
    (data: Record<string, any>, fields?: EventFields): EventModel => {

        if (!data) { return undefined; }
        const internalKeys: EventModel = getEventModelFields(fields ?? DEFAULT_FIELDS);
        const result: EventModel = {};
        for (const [key, value] of Object.entries(data)) {
            result[(internalKeys[key as string] || key) as keyof EventModel] = value;
        }

        return result;
    };

/**
 * Translates event data from internal format back to user field names.
 * - Maps standard property names to custom field names
 * - Keeps extra fields that are not in the standard mapping
 *
 * @param {EventModel} event - Event data in internal format
 * @param {EventFields} fields - Field name mappings
 * @returns {Record<string, any>} Converted event data
 * @private
 */
export const makeExternalRecord: (event: EventModel, fields?: EventFields) => Record<string, any> =
    (event: EventModel, fields?: EventFields): Record<string, any> => {
        const resolvedFields: Required<EventFields> = { ...DEFAULT_FIELDS, ...fields } as Required<EventFields>;

        if (!event) { return undefined; }
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(event)) {
            const fieldKey: string | number = resolvedFields[key as keyof EventFields];
            result[(fieldKey || key) as string] = value;
        }

        return result;
    };
