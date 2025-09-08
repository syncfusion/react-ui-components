import * as React from 'react';
import { forwardRef, useEffect, useCallback, useRef, useImperativeHandle, FormEvent, Ref, FormHTMLAttributes, createContext } from 'react';
import {IL10n, L10n, preRender, useProviderContext} from '@syncfusion/react-base';

const VALIDATION_REGEX: { [key: string]: RegExp } = {
    EMAIL: /^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    // eslint-disable-next-line security/detect-unsafe-regex
    URL: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/,
    DATE_ISO: /^([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/,
    DIGITS: /^[0-9]*$/,
    PHONE: /^[+]?[0-9]{9,13}$/,
    CREDIT_CARD: /^\d{13,16}$/
};

/**
 * Specifies the possible value types for form fields.
 */
export type FormValueType = string | number | boolean | Date | File | FileList | string[] | number[] | React.ReactNode | null | undefined;

interface FormContextProps {
    registerField?: (fieldName: string) => void;
}

const FormContext: React.Context<FormContextProps | null> = createContext<FormContextProps | null>(null);
const FormProvider: React.Provider<FormContextProps | null> = FormContext.Provider;

/**
 * Defines the structure for a validation rule in the form system.
 *
 * A ValidationRule is a two-part array containing:
 * - A validation condition (as boolean, RegExp, number, function, etc.)
 * - An optional custom error message to show when validation fails
 *
 * The first element's type depends on the specific rule:
 * - For boolean rules (like 'required'): true/false
 * - For pattern rules (like 'email', 'regex'): RegExp object
 * - For range rules: number or number[] (min/max values)
 * - For equality checks: string (field name to compare with)
 * - For custom validation: () => boolean function
 *
 * ```tsx
 * const requiredRule: ValidationRule = [true, 'This field is required'];
 * ```
 */
export type ValidationRule = [boolean | RegExp | number | number[] | string | Date | (() => boolean), string?];

/**
 * Defines the comprehensive set of validation rules that can be applied to form fields.
 *
 * This interface outlines all available validation types that can be configured for
 * each field in the form. Each validation type accepts a ValidationRule containing
 * both the validation criteria and an optional custom error message.
 */
export interface FieldValidationRules {
    /**
     * Validates that the field has a non-empty value. When configured with [true], the field cannot be empty, null, or undefined.
     *
     * ```tsx
     * required: [true, 'This field must be filled in']
     * ```
     */
    required?: ValidationRule;

    /**
     * Validates that the input conforms to a standard email address format. Checks for proper formatting with @ symbol and domain structure.
     *
     * ```tsx
     * email: [true, 'Please enter a valid email address']
     * ```
     */
    email?: ValidationRule;

    /**
     * Validates that the input is a properly formatted URL. Checks for proper protocol, domain structure, and path format.
     *
     * ```tsx
     * url: [true, 'Please enter a valid website URL']
     * ```
     */
    url?: ValidationRule;

    /**
     * Validates that the input can be parsed as a valid date. Uses Date.parse() to validate the string can be converted to a date.
     *
     * ```tsx
     * date: [true, 'Please enter a valid date']
     * ```
     */
    date?: ValidationRule;

    /**
     * Validates that the input follows ISO date format (YYYY-MM-DD). Ensures strict compliance with the ISO date standard.
     *
     * ```tsx
     * dateIso: [true, 'Date must be in YYYY-MM-DD format']
     * ```
     */
    dateIso?: ValidationRule;

    /**
     * Validates that the input contains a valid numeric value. Ensures the field can be converted to a number without errors.
     *
     * ```tsx
     * number: [true, 'Please enter a number']
     * ```
     */
    number?: ValidationRule;

    /**
     * Validates that the input contains only numeric digits (0-9). Rejects inputs containing decimal points, signs, letter characters or spaces.
     *
     * ```tsx
     * digits: [true, 'Please enter only numeric digits']
     * ```
     */
    digits?: ValidationRule;

    /**
     * Validates that the input is a valid credit card number. Checks length (13-16 digits) and applies Luhn algorithm validation.
     *
     * ```tsx
     * creditCard: [true, 'Invalid credit card number']
     * ```
     */
    creditCard?: ValidationRule;

    /**
     * Validates that a string has at least the specified minimum length. Takes a number as the first parameter in the validation rule.
     *
     * ```tsx
     * minLength: [6, 'Must be at least 6 characters long']
     * ```
     */
    minLength?: ValidationRule;

    /**
     * Validates that a string doesn't exceed the specified maximum length. Takes a number as the first parameter in the validation rule.
     *
     * ```tsx
     * maxLength: [100, 'Cannot exceed 100 characters']
     * ```
     */
    maxLength?: ValidationRule;

    /**
     * Validates that a string's length falls within the specified range. Takes an array of two numbers [min, max] as the first parameter.
     *
     * ```tsx
     * rangeLength: [[8, 16], 'Must be between 8 and 16 characters']
     * ```
     */
    rangeLength?: ValidationRule;

    /**
     * Validates that a numeric value is at least the specified minimum. Takes a number as the first parameter in the validation rule.
     *
     * ```tsx
     * min: [18, 'Value must be at least 18']
     * ```
     */
    min?: ValidationRule;

    /**
     * Validates that a numeric value doesn't exceed the specified maximum. Takes a number as the first parameter in the validation rule.
     *
     * ```tsx
     * max: [100, 'Value cannot exceed 100']
     * ```
     */
    max?: ValidationRule;

    /**
     * Validates that a numeric value falls within the specified range. Takes an array of two numbers [min, max] as the first parameter.
     *
     * ```tsx
     * range: [[1, 10], 'Value must be between 1 and 10']
     * ```
     */
    range?: ValidationRule;

    /**
     * Validates that the input matches the specified regular expression pattern. Takes a RegExp object or a string pattern as the first parameter.
     *
     * ```tsx
     * regex: [/^[A-Z][a-z]+$/, 'Must start with capital letter followed by lowercase letters']
     * ```
     */
    regex?: ValidationRule;

    /**
     * Validates that the input conforms to a standard telephone number format. Checks for proper formatting of phone numbers with optional country code.
     *
     * ```tsx
     * tel: [true, 'Please enter a valid phone number']
     * ```
     */
    tel?: ValidationRule;

    /**
     * Validates that the field's value exactly matches another field's value. Takes the name of another field as the first parameter.
     *
     * ```tsx
     * equalTo: ['password', 'Passwords must match']
     * ```
     */
    equalTo?: ValidationRule;

    /**
     * Allows for completely custom validation logic as a function.
     *
     * This function receives the field value and should return either:
     * - A string containing an error message if validation fails
     * - null if validation passes
     *
     * ```tsx
     * customValidator: (value) => {
     *   if (typeof value === 'string' && !value.includes('@company.com')) {
     *     return 'Email must be a company email';
     *   }
     *   return null;
     * }
     * ```
     */
    customValidator?: (value: FormValueType) => string | null;
}

/**
 * Defines the complete validation schema for a form by mapping field names to their validation rules.
 *
 * This interface creates a dictionary where each key is a field name and each value
 * is an object containing all validation rules that apply to that field. The ValidationRules
 * object is passed to the Form component to establish the validation criteria for the entire form.
 *
 * ```tsx
 * const validationSchema: ValidationRules = {
 *   username: {
 *     required: [true, 'Username is required'],
 *     minLength: [3, 'Username must be at least 3 characters']
 *   },
 *
 *   email: {
 *     required: [true, 'Email is required'],
 *     email: [true, 'Please enter a valid email address']
 *   }
 * };
 * ```
 */
export interface ValidationRules {
    [fieldName: string]: FieldValidationRules;
}

/**
 * Specifies the state and callback properties provided by the Form component.
 *
 * The FormState interface provides comprehensive access to the form's state
 * and behavior through the onFormStateChange callback. It allows parent components
 * to build custom form UIs with full access to validation state, field values, and form event handlers.
 */
export interface FormState {
    /**
     * Specifies the current values for all form fields indexed by field name.
     * Access individual values using: values.fieldName
     *
     * ```tsx
     * const username = formState.values.username;
     * ```
     */
    values: Record<string, FormValueType>;

    /**
     * Specifies the current validation errors for all fields indexed by field name.
     * Fields without errors won't appear in this object.
     *
     */
    errors: Record<string, string>;

    /**
     * Specifies which fields in the form are valid (have no validation errors).
     *
     */
    valid: Record<string, boolean>;

    /**
     * Specifies if the form can be submitted. True when all fields are valid;
     * otherwise, all fields are marked as touched when attempted to submit.
     */
    allowSubmit: boolean;

    /**
     * Specifies if the form has been submitted at least once.
     * True after a submission attempt regardless of validation result.
     */
    submitted: boolean;

    /**
     * Specifies which fields in the form have been modified from their initial values.
     *
     */
    modified: Record<string, boolean>;

    /**
     * Specifies which fields have been touched (blurred after interaction).
     * Useful for determining when to display validation messages.
     *
     */
    touched: Record<string, boolean>;

    /**
     * Specifies which fields have been visited (received focus).
     *
     */
    visited: Record<string, boolean>;

    /**
     * Specifies a dictionary of field names for easy access to form fields.
     *
     */
    fieldNames: Record<string, string>;

    /**
     * Specifies the callback function to handle field value changes.
     * Use this instead of directly modifying input elements.
     *
     * @param name - The name of the field to update
     * @param options - Object containing the new value for the field.
     * @event onChange
     */
    onChange(name: string, options: { value: FormValueType }): void;

    /**
     * Specifies the callback function for when a field loses focus.
     *
     * @param fieldName - The name of the field that lost focus.
     * @event onBlur
     */
    onBlur(fieldName: string): void;

    /**
     * Specifies the callback function for when a field receives focus.
     * Records the field as visited.
     *
     * @param fieldName - The name of the field that received focus.
     * @event onFocus
     */
    onFocus(fieldName: string): void;

    /**
     * Specifies the callback function to reset the form to its initial state.
     * Clears all values, errors, and interaction states.
     *
     * @event onFormReset
     */
    onFormReset(): void;

    /**
     * Specifies the callback function to submit the form.
     * Can be used with a submit button's onClick event.
     *
     * @param event - The synthetic event from the form submission.
     * @event onSubmit
     */
    onSubmit(event: React.SyntheticEvent): void;
}

/**
 * Specifies initial values for form fields. Maps field names to their default values when the form loads.
 *
 * ```tsx
 * const initialValues: FormInitialValues = {
 *   username: 'john_doe'
 * };
 * ```
 */
export interface FormInitialValues {
    [fieldName: string]: FormValueType;
}

/**
 * Specifies the props interface for the Form component.
 */
export interface FormProps {
    /**
     * Specifies the validation rules for each form field. This object defines constraints that form fields must satisfy.
     */
    rules: ValidationRules;

    /**
     * Specifies the callback fired when form is submitted and all validation rules pass.
     *
     * @param {Record<string, FormValueType>} data - Specifies the form data containing all field values
     * @event onSubmit
     */
    onSubmit?: (data: Record<string, FormValueType>) => void;

    /**
     * Specifies the callback fired when form state changes.
     * This can be used to access form state from parent components for custom UI rendering.
     *
     * @param {FormState} formState - The current state of the form
     * @event onFormStateChange
     */
    onFormStateChange?: (formState: FormState) => void;

    /**
     * Specifies the initial values for form fields. These values populate the form.
     *
     * @default -
     */
    initialValues?: FormInitialValues;

    /**
     * Specifies whether to trigger validation on every input change. When true, validation occurs on each keystroke, providing immediate feedback.
     *
     * @default false
     */
    validateOnChange?: boolean;
}

/**
 * Specifies the FormValidator interface for imperative methods.
 */
export interface IFormValidator extends FormProps {
    /**
     * Validates the entire form against all defined rules.
     *
     * @returns {boolean} - Returns true if the form is valid, false otherwise.
     */
    validate(): boolean;

    /**
     * Resets the form to its initial state, clearing all values, errors, and interaction states.
     *
     * @returns {void}
     */
    reset(): void;

    /**
     * Validates a specific field against its defined rules.
     *
     * @param {string} fieldName - Specifies the name of the field to validate
     * @returns {boolean} - Returns true if the field is valid, false otherwise
     */
    validateField(fieldName: string): boolean;

    /**
     * Provides access to the underlying HTML form element.
     *
     * @private
     */
    element?: HTMLFormElement;
}

interface FormData {
    values: Record<string, FormValueType>;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    visited: Record<string, boolean>;
    modified: Record<string, boolean>;
    submitted: boolean;
    validated: Record<string, boolean>;
}

type FormComponentProps = FormProps & Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>;

/**
 * Provides a form component with built-in validation functionality. Manages form state tracking,
 * field validation, and submission handling.
 *
 * ```typescript
 * import { Form, FormField, FormState } from '@syncfusion/react-inputs';
 *
 * const [formState, setFormState] = useState<FormState>();
 *
 * <Form
 *   rules={{ username: { required: [true, 'Username is required'] } }}
 *   onSubmit={data => console.log(data)}
 *   onFormStateChange={setFormState} >
 *   <FormField name="username">
 *     <input
 *       name="username"
 *       value={(formState?.values.username || '') as string}
 *       onChange={(e) => formState?.onChange('username', { value: e.target.value })}
 *       onBlur={() => formState?.onBlur('username')}
 *       onFocus={() => formState?.onFocus('username')}
 *     />
 *     {formState?.errors?.username && (<div className="error">{formState.errors.username}</div>)}
 *   </FormField>
 *   <button type="submit">Submit</button>
 * </Form>
 * ```
 */
export const Form: React.ForwardRefExoticComponent<FormComponentProps & React.RefAttributes<IFormValidator>> =
forwardRef<IFormValidator, FormComponentProps>((props: FormComponentProps, ref: Ref<IFormValidator>) => {
    const {
        rules,
        onSubmit,
        onReset,
        children,
        onFormStateChange,
        initialValues = {},
        validateOnChange = false,
        className = '',
        ...otherProps
    } = props;
    const formRef: React.RefObject<HTMLFormElement | null> = useRef<HTMLFormElement>(null);
    const { locale, dir } = useProviderContext();
    const stateRef: React.RefObject<FormData> = useRef<FormData>({
        values: { ...initialValues },
        errors: {},
        touched: {},
        visited: {},
        modified: {},
        submitted: false,
        validated: {}
    });

    const notifyStateChange: () => void = useCallback(() => {
        if (onFormStateChange) {
            formStateRef.current = getFormState();
            onFormStateChange(formStateRef.current);
        }
    }, [onFormStateChange]);

    const setFieldValue: (field: string, value: FormValueType) => void = useCallback((field: string, value: FormValueType) => {
        stateRef.current = {
            ...stateRef.current,
            values: {
                ...stateRef.current.values,
                [field]: value
            },
            modified: {
                ...stateRef.current.modified,
                [field]: true
            }
        };
    }, []);

    const setFieldTouched: (field: string) => void = useCallback((field: string) => {
        stateRef.current = {
            ...stateRef.current,
            touched: {
                ...stateRef.current.touched,
                [field]: true
            }
        };
    }, []);

    const setFieldVisited: (field: string) => void = useCallback((field: string) => {
        stateRef.current = {
            ...stateRef.current,
            visited: {
                ...stateRef.current.visited,
                [field]: true
            }
        };
    }, []);

    const setFieldError: (field: string, error: string | null) => void = useCallback((field: string, error: string | null) => {
        const errors: Record<string, string> = { ...stateRef.current.errors };
        if (error) {
            errors[field as string] = error;
        } else {
            delete errors[field as string];
        }
        stateRef.current = {
            ...stateRef.current,
            errors
        };
    }, []);

    const setSubmitted: (value: boolean) => void = useCallback((value: boolean) => {
        stateRef.current = {
            ...stateRef.current,
            submitted: value
        };
    }, []);

    const resetForm: (values: Record<string, FormValueType>) => void = useCallback((values: Record<string, FormValueType>) => {
        stateRef.current = {
            values,
            errors: {},
            touched: {},
            visited: {},
            modified: {},
            submitted: false,
            validated: {}
        };
        notifyStateChange();
    }, [notifyStateChange]);

    const touchAllFields: () => void = useCallback(() => {
        const allTouched: Record<string, boolean> = {};
        Object.keys(stateRef.current.values).forEach((field: string) => {
            allTouched[field as string] = true;
        });
        stateRef.current = {
            ...stateRef.current,
            touched: allTouched
        };
    }, []);

    const visitAllFields: () => void = useCallback(() => {
        const allVisited: Record<string, boolean> = {};
        Object.keys(stateRef.current.values).forEach((field: string) => {
            allVisited[field as string] = true;
        });
        stateRef.current = {
            ...stateRef.current,
            visited: allVisited
        };
    }, []);

    const setBulkErrors: (errors: Record<string, string | null>) => void = useCallback((errors: Record<string, string | null>) => {
        const newErrors: { [x: string]: string; } = { ...stateRef.current.errors };
        Object.entries(errors).forEach(([field, error]: [string, string | null]) => {
            if (error) {
                newErrors[field as string] = error;
            } else {
                delete newErrors[field as string];
            }
        });
        stateRef.current = {
            ...stateRef.current,
            errors: newErrors
        };
        notifyStateChange();
    }, [notifyStateChange]);
    const rulesRef: React.RefObject<ValidationRules> = useRef<ValidationRules>(rules);
    const formStateRef: React.RefObject<FormState | null> = useRef<FormState>(null);
    const l10nRef: React.RefObject<IL10n | null> = useRef<IL10n>(null);
    const defaultErrorMessages: { [rule: string]: string } = {
        required: 'This field is required.',
        email: 'Please enter a valid email address.',
        url: 'Please enter a valid URL.',
        date: 'Please enter a valid date.',
        dateIso: 'Please enter a valid date (ISO).',
        creditCard: 'Please enter valid card number.',
        number: 'Please enter a valid number.',
        digits: 'Please enter only digits.',
        maxLength: 'Please enter no more than {0} characters.',
        minLength: 'Please enter at least {0} characters.',
        rangeLength: 'Please enter a value between {0} and {1} characters long.',
        range: 'Please enter a value between {0} and {1}.',
        max: 'Please enter a value less than or equal to {0}.',
        min: 'Please enter a value greater than or equal to {0}.',
        regex: 'Please enter a correct value.',
        tel: 'Please enter a valid phone number.',
        equalTo: 'Please enter the same value again.'
    };
    const registeredFields: React.RefObject<Record<string, boolean>> = useRef<Record<string, boolean>>({});
    const registerField: (fieldName: string) => void = (fieldName: string) => {
        registeredFields.current[fieldName as string] = true;
    };

    useEffect(() => {
        l10nRef.current = L10n('formValidator', defaultErrorMessages, locale);
        return () => {
            l10nRef.current = null;
        };
    }, [locale]);

    useEffect(() => {
        notifyStateChange();
        validateInitialValues();
        preRender('formValidator');
        return () => {
            l10nRef.current = null;
            rulesRef.current = {};
            registeredFields.current = {};
            if (formRef.current) {
                formRef.current = null;
            }
            formStateRef.current = null;
            if (onFormStateChange) {
                onFormStateChange(formStateRef.current as unknown as FormState );
            }
        };
    }, []);

    useEffect(() => {
        rulesRef.current = rules;
    }, [rules]);

    const validateInitialValues: () => void = (): void => {
        if (Object.keys(initialValues).length > 0) {
            const errors: Record<string, string | null> = {};

            for (const fieldName in initialValues) {
                if (Object.prototype.hasOwnProperty.call(initialValues, fieldName) &&
                    Object.prototype.hasOwnProperty.call(rulesRef.current, fieldName)) {
                    const error: string | null = validateFieldValue(fieldName, initialValues[fieldName as string]);
                    if (error) {
                        errors[fieldName as string] = error;
                    } else {
                        errors[fieldName as string] = null;
                    }
                }
            }
            if (Object.keys(errors).length > 0) {
                setBulkErrors(errors);
            }
        }
    };

    const formatErrorMessage: (ruleName: string, params: unknown) => string = (ruleName: string, params: unknown): string => {
        let formattedMessage: string = l10nRef.current?.getConstant(ruleName) as string;
        if (Array.isArray(params)) {
            params.forEach((value: unknown, index: number) => {
                const placeholder: string = `{${index}}`;
                if (formattedMessage.includes(placeholder)) {
                    formattedMessage = formattedMessage.replace(placeholder, String(value));
                }
            });
        } else {
            formattedMessage = formattedMessage.replace('{0}', String(params));
        }

        return formattedMessage;
    };

    const validateCreditCard: (value: string) => boolean = (value: string): boolean => {
        if (!VALIDATION_REGEX.CREDIT_CARD.test(value)) {
            return false;
        }
        const cardNumber: string = value.replace(/[\s-]/g, '');
        let sum: number = 0;
        let shouldDouble: boolean = false;
        for (let i: number = cardNumber.length - 1; i >= 0; i--) {
            let digit: number = parseInt(cardNumber.charAt(i), 10);
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return (sum % 10) === 0;
    };

    const validateFieldValue: (fieldName: string, value: FormValueType) => string | null =
        (fieldName: string, value: FormValueType): string | null => {
            const fieldRules: FieldValidationRules = rulesRef.current[fieldName as string];
            if (!fieldRules || !registeredFields.current[fieldName as string]) {return null; }
            const isValueEmpty: boolean = value === undefined || value === null || value.toString().trim() === '';
            const isRequired: boolean = fieldRules.required != null &&  fieldRules.required[0] !== false;
            if (isValueEmpty && !isRequired) {
                return null;
            }

            for (const ruleName in fieldRules) {
                if (Object.prototype.hasOwnProperty.call(fieldRules, ruleName)) {
                    const ruleValue: ValidationRule | ((value: FormValueType) => string | null) | undefined =
                    fieldRules[ruleName as keyof typeof fieldRules];
                    if (!ruleValue) {continue; }
                    let isValid: boolean = true;
                    let param: unknown = null;
                    let errorMessage: string | undefined;

                    if (ruleName === 'customValidator' && typeof ruleValue === 'function') {
                        const customError: string | null = ruleValue(value);
                        if (customError) {
                            return customError;
                        }
                        continue;
                    }

                    if (Array.isArray(ruleValue)) {
                        param = ruleValue[0];
                        errorMessage = ruleValue[1];

                        if (ruleName === 'required' && param === false) {
                            continue;
                        }
                    }

                    if (ruleName !== 'required' && (value === '' || value === null || value === undefined)) {
                        continue;
                    }

                    switch (ruleName) {
                    case 'required':
                        isValid = !isValueEmpty;
                        break;
                    case 'email':
                        isValid = VALIDATION_REGEX.EMAIL.test(value as string);
                        break;
                    case 'url':
                        isValid = VALIDATION_REGEX.URL.test(value as string);
                        break;
                    case 'date':
                        isValid = !isNaN(Date.parse(value as string));
                        break;
                    case 'dateIso':
                        isValid = VALIDATION_REGEX.DATE_ISO.test(value as string);
                        break;
                    case 'number':
                        isValid = !isNaN(Number(value)) && String(value).indexOf(' ') === -1;
                        break;
                    case 'digits':
                        isValid = VALIDATION_REGEX.DIGITS.test(value as string);
                        break;
                    case 'creditCard':
                        isValid = validateCreditCard(value as string);
                        break;
                    case 'minLength':
                        isValid = String(value).length >= Number(param);
                        break;
                    case 'maxLength':
                        isValid = String(value).length <= Number(param);
                        break;
                    case 'rangeLength':
                        if (Array.isArray(param)) {
                            isValid = String(value).length >= param[0] && String(value).length <= param[1];
                        }
                        break;
                    case 'min':
                        isValid = Number(value) >= Number(param);
                        break;
                    case 'max':
                        isValid = Number(value) <= Number(param);
                        break;
                    case 'range':
                        if (Array.isArray(param)) {
                            isValid = Number(value) >= param[0] && Number(value) <= param[1];
                        }
                        break;
                    case 'regex':
                        if (param instanceof RegExp) {
                            isValid = param.test(value as string);
                        } else if (typeof param === 'string') {
                            // eslint-disable-next-line security/detect-non-literal-regexp
                            isValid = new RegExp(param).test(value as string);
                        }
                        break;
                    case 'tel':
                        isValid = VALIDATION_REGEX.PHONE.test(value as string);
                        break;
                    case 'equalTo':
                        if (typeof param === 'string') {
                            isValid = value === stateRef.current.values[param as string];
                        }
                        break;
                    }

                    if (!isValid) {
                        if (errorMessage) {
                            return errorMessage;
                        } else {
                            return formatErrorMessage(ruleName, param);
                        }
                    }
                }
            }

            return null;
        };

    const validateForm: () => Record<string, string> = (): Record<string, string> => {
        const errors: Record<string, string> = {};
        const fields: string[] = Object.keys(rulesRef.current);

        for (const field of fields) {
            const error: string | null = validateFieldValue(field, stateRef.current.values[field as string]);
            if (!stateRef.current.values[field as string]) {
                setFieldValue(field, stateRef.current.values[field as string]);
            }
            if (error) {
                errors[field as string] = error;
            }
        }

        return errors;
    };

    const validate: () => boolean = (): boolean => {
        const formErrors: Record<string, string> = validateForm();
        for (const field in formErrors) {
            if (Object.prototype.hasOwnProperty.call(formErrors, field)) {
                setFieldError(field, formErrors[field as string]);
            }
        }
        const fields: string[] = Object.keys(rulesRef.current);
        for (const field of fields) {
            if (!formErrors[field as string]) {
                setFieldError(field, null);
            }
        }
        if (Object.keys(formErrors).length === 0) {
            stateRef.current = {
                ...stateRef.current,
                errors: {},
                touched: {},
                visited: {},
                modified: {},
                submitted: false,
                validated: {}
            };
        }
        notifyStateChange();

        return Object.keys(formErrors).length === 0;
    };

    const handleSubmit: (event: FormEvent<HTMLFormElement> | React.SyntheticEvent) => void =
        (event: FormEvent<HTMLFormElement> | React.SyntheticEvent): void => {
            event?.preventDefault();
            const isValid: boolean = validate();
            touchAllFields();
            visitAllFields();
            setSubmitted(true);
            notifyStateChange();
            if (isValid) {
                onSubmit?.(stateRef.current.values);
            }
        };

    const handleChange: (name: string, { value }: { value: FormValueType; }) => void =
        (name: string, { value }: { value: FormValueType }): void => {
            setFieldValue(name, value);
            if (validateOnChange) {
                const error: string | null = validateFieldValue(name, value);
                setFieldError(name, error);
            }
            notifyStateChange();
        };

    const handleBlur: (fieldName: string) => void = (fieldName: string): void => {
        setFieldTouched(fieldName);
        const error: string | null = validateFieldValue(fieldName, stateRef.current.values[fieldName as string]);
        setFieldError(fieldName, error);
        notifyStateChange();
    };

    const handleFormReset: (args?: FormEvent<HTMLFormElement>) => void =
    (args?: FormEvent<HTMLFormElement>): void => {
        resetForm({ ...initialValues });
        onReset?.(args as FormEvent<HTMLFormElement>);
    };

    const reset: () => void = (): void => {
        handleFormReset();
    };

    const getFormState: () => FormState = (): FormState => {
        const state: FormData = stateRef.current;
        return {
            values: state.values,
            errors: state.errors,
            submitted: state.submitted,
            touched: state.touched,
            visited: state.visited,
            modified: state.modified,
            valid: Object.keys(rulesRef.current).reduce((acc: Record<string, boolean>, fieldName: string) => {
                acc[fieldName as string] = !state.errors[fieldName as string];
                return acc;
            }, {} as Record<string, boolean>),
            allowSubmit: Object.keys(state.errors).length === 0,
            onChange: handleChange,
            onBlur: handleBlur,
            onFocus: handleFocus,
            onFormReset: handleFormReset,
            onSubmit: handleSubmit,
            fieldNames: Object.keys(registeredFields.current).reduce((acc: Record<string, string>, fieldName: string) => {
                acc[fieldName as string] = fieldName;
                return acc;
            }, {} as Record<string, string>)
        };
    };

    const validateField: (fieldName: string) => boolean = (fieldName: string): boolean => {
        const error: string | null = validateFieldValue(fieldName, stateRef.current.values[fieldName as string]);
        setFieldError(fieldName, error);
        notifyStateChange();
        return !error;
    };
    const publicAPI: Partial<IFormValidator> = React.useMemo(() => ({
        rules,
        initialValues,
        validateOnChange
    }), [rules, initialValues, validateOnChange]);

    useImperativeHandle(ref, () => ({
        ...publicAPI as IFormValidator,
        validate,
        reset,
        validateField,
        element: formRef.current as HTMLFormElement
    }), [publicAPI]);

    const formClassName: string = React.useMemo(() => {
        return [
            'sf-control sf-form-validator',
            dir === 'rtl' ? 'sf-rtl' : '',
            className
        ].filter(Boolean).join(' ');
    }, [dir, className]);

    const handleFocus: (fieldName: string) => void = (fieldName: string): void => {
        setFieldVisited(fieldName);
        notifyStateChange();
    };
    const formContextValue: FormContextProps = {
        registerField: registerField
    };

    return (
        <FormProvider value={formContextValue}>
            <form
                ref={formRef}
                className={formClassName}
                onSubmit={handleSubmit}
                onReset={handleFormReset}
                noValidate
                {...otherProps}
            >
                {children}
            </form>
        </FormProvider>
    );
}
);

Form.displayName = 'Form';

/**
 * Specifies the properties for the FormField component.
 */
export interface FormFieldProps {
    /**
     * Specifies the name of the field that must match a key in the rules object. This is required for proper validation.
     */
    name: string;

    /**
     * Specifies the children content for the form field. Children should include the actual form control elements like inputs, textarea, etc.
     */
    children: React.ReactNode;
}

/**
 * Specifies a component that connects form inputs with validation rules. The FormField component provides
 * an easy way to integrate form controls with the Form validation system, handling state management and
 * validation automatically.
 *
 * ```typescript
 * const [formState, setFormState] = useState<FormState>();
 *
 * <Form
 *   rules={{
 *     username: { required: [true, 'Username is required'] }
 *   }}
 *   onSubmit={data => console.log(data)}
 *   onFormStateChange={setFormState}
 * >
 *   <FormField name="username">
 *     <input
 *       name="username"
 *       value={formState?.values.username || ''}
 *       onChange={(e) => formState?.onChange('username', { value: e.target.value })}
 *       onBlur={() => formState?.onBlur('username')}
 *       onFocus={() => formState?.onFocus('username')}
 *     />
 *     {formState?.touched?.username && formState?.errors?.username && (
 *       <div className="error">{formState.errors.username}</div>
 *     )}
 *   </FormField>
 *   <button type="submit">Submit</button>
 * </Form>
 * ```
 *
 * @param {IFormFieldProps} props - Specifies the form field configuration properties
 * @returns {React.ReactNode} - Returns the children with access to form validation context
 */
export const FormField: React.FC<FormFieldProps> = (props: FormFieldProps): React.ReactNode => {
    const { name, children } = props;
    if (!name) {
        return null;
    }

    const formContext: FormContextProps | null = React.useContext(FormContext);
    if (!formContext) {
        return null;
    }
    if (formContext.registerField) {
        formContext.registerField(name);
    }
    return <>{children}</>;
};

FormField.displayName = 'FormField';
