import { useState, useEffect, useCallback, useImperativeHandle, useRef, forwardRef, Ref, JSX, InputHTMLAttributes,
    useMemo, ReactNode, ForwardRefExoticComponent, RefAttributes, RefObject, ChangeEventHandler, type ChangeEvent,
    type MouseEvent, type KeyboardEvent
} from 'react';
import { preRender, useProviderContext, useRippleEffect, Color, Size, Position, useStableId } from '@syncfusion/react-base';
import { CheckLargeIcon, IntermediateBarIcon} from '@syncfusion/react-icons';

/**
 * Interface for Checkbox change event arguments
 */
export interface CheckboxChangeEvent {
    /**
     * The initial event object received from the input element.
     */
    event: ChangeEvent<HTMLInputElement>;

    /**
     * The current checked state of the Checkbox.
     */
    value: boolean;
}

/**
 * Validation-related properties for components.
 */
interface validationProps {
    /**
     * Specifies whether the component is a required field in a form. When set to true,
     * the component will be marked as required.
     *
     * @default -
     */
    required?: boolean;

    /**
     * Specifies whether to override the validity state of the component. If valid is set, the required property will be ignored.
     *
     * @default -
     */
    valid?: boolean;

    /**
     * Specifies the form error message of the component.
     *
     * @default ''
     */
    validationMessage?: string;

    /**
     * Specifies whether to apply visual representation of the invalid state of the component.
     * If set to false, no visual representation of the invalid state of the component will be applied.
     *
     * @default true
     */
    validityStyles?: boolean;
}

const CHECK: string = 'sf-checkbox-checked';
const DISABLED: string = 'sf-disabled sf-no-pointer';
const FRAME: string = 'sf-checkbox-frame';
const INDETERMINATE: string = 'sf-checkbox-indeterminate';
const LABEL: string = 'sf-label';
const WRAPPER: string = 'sf-control sf-checkbox-wrapper';
const CHECKBOX_CLASS: string = 'sf-checkbox';

/**
 * Properties interface for the Checkbox component
 *
 */
export interface CheckboxProps extends validationProps {

    /**
     * Specifies if the Checkbox is in an `indeterminate` state, which visually presents it as neither checked nor unchecked; setting this to `true` will make the Checkbox appear in an indeterminate state.
     *
     * @default false
     */
    indeterminate?: boolean;

    /**
     * Defines the text label for the Checkbox component, helping users understand its purpose.
     *
     * @default -
     */
    label?: string;

    /**
     * Specifies the size style of the Checkbox. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Specifies a custom icon to be displayed in unchecked state. This replaces the default Checkbox appearance.
     *
     * @default -
     */
    icon?: ReactNode;

    /**
     * Specifies a custom icon to be displayed in checked state. This replaces the default Checkbox check mark.
     *
     * @default -
     */
    checkedIcon?: ReactNode;

    /**
     * Specifies a custom icon to be displayed in the indeterminate state. This replaces the default indeterminate icon.
     *
     * @default -
     */
    indeterminateIcon?: ReactNode;

    /**
     * Specifies the position of the label relative to the Checkbox. It determines whether the label appears before or after the Checkbox element in the UI.
     *
     * @default Position.Right
     */
    labelPlacement?: Position;

    /**
     * Specifies a value that indicates whether the Checkbox is `checked` or not. When set to `true`, the Checkbox will be in `checked` state.
     *
     * @default false
     */
    checked?: boolean;

    /**
     * Specifies the initial checked state of the Checkbox. Use for uncontrolled components.
     *
     * @default false
     */
    defaultChecked?: boolean;

    /**
     * Specifies the Color style of the button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Error', and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;

    /**
     * Defines `value` attribute for the Checkbox. It is a form data passed to the server when submitting the form.
     *
     *
     * @default -
     */
    value?: string;

    /**
     * Triggers when the Checkbox state has been changed by user interaction, allowing custom logic to be executed in response to the state change.
     *
     * @event onChange
     */
    onChange?: (event: CheckboxChangeEvent) => void;
}

/**
 * Interface to define the structure of the Checkbox component reference instance
 *
 */
export interface ICheckbox extends CheckboxProps {
    /**
     * This is Checkbox component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}

type ICheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & ICheckbox;

/**
 * The Checkbox component allows users to select one or multiple options from a list, providing a visual representation of a binary choice with states like checked, unchecked, or indeterminate.
 *
 * ```typescript
 * import { Checkbox } from "@syncfusion/react-buttons";
 *
 * <Checkbox checked={true} label="Accept Terms and Conditions" />
 * ```
 */

export const Checkbox: ForwardRefExoticComponent<ICheckboxProps & RefAttributes<ICheckbox>> =
    forwardRef<ICheckbox, ICheckboxProps>((props: ICheckboxProps, ref: Ref<ICheckbox>) => {
        const {
            onChange,
            checked,
            defaultChecked = false,
            color = Color.Primary,
            icon,
            checkedIcon,
            indeterminateIcon,
            className = '',
            disabled = false,
            indeterminate = false,
            labelPlacement = Position.Right,
            name = '',
            label = '',
            value = '',
            size = Size.Medium,
            id,
            required,
            valid,
            validationMessage = '',
            validityStyles = true,
            ...domProps
        } = props;

        const isControlled: boolean = checked !== undefined;
        const [checkedState, setCheckedState] = useState<boolean>(() => {
            if (isControlled) {
                return !!checked;
            }
            return defaultChecked;
        });

        const [isIndeterminate, setIsIndeterminate] = useState(indeterminate);
        const [isFocused, setIsFocused] = useState(false);
        const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
        const wrapperRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const rippleContainerRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
        const { dir, ripple } = useProviderContext();
        const { rippleMouseDown, Ripple} = useRippleEffect(ripple, {isCenterRipple: true});
        const isReadOnly: boolean = !!domProps.readOnly && !disabled;
        const ariaReadonlyValue: 'true' | undefined = isReadOnly ? 'true' : undefined;
        const requiredAttribute: boolean | undefined = (!disabled && (required === true || valid === false)) ? true : undefined;
        const isChecked: boolean = isControlled ? !!checked : checkedState;
        const isInputValid: boolean = valid !== undefined ? !!valid : (required ? isChecked : true);
        const ariaInvalidValue: 'true' | undefined = !isInputValid ? 'true' : undefined;
        const uniqueId: string = id ?? useStableId('sf-checkbox');
        const publicAPI: Partial<ICheckbox> = useMemo(() => ({
            checked,
            indeterminate,
            value,
            color,
            size,
            icon,
            checkedIcon
        }), [checked, indeterminate, value, color, size, icon, checkedIcon]);

        useImperativeHandle(ref, () => ({
            ...publicAPI as ICheckbox,
            element: inputRef.current
        }), [publicAPI]);

        useEffect(() => {
            const element: HTMLInputElement | null = inputRef.current;
            if (!element || typeof element.setCustomValidity !== 'function') { return; }
            if (isInputValid) {
                element.setCustomValidity('');
            } else if (validationMessage) {
                element.setCustomValidity(validationMessage);
            }
        }, [isInputValid, validationMessage]);

        useEffect(() => {
            if (isControlled) {
                setCheckedState(!!checked);
            }
        }, [checked, isControlled]);

        useEffect(() => {
            preRender('checkbox');
        }, []);

        useEffect(() => {
            setIsIndeterminate(indeterminate);
        }, [indeterminate]);

        const handleStateChange: ChangeEventHandler<HTMLInputElement> = useCallback(
            (event: ChangeEvent<HTMLInputElement>): void => {
                if (isReadOnly) {
                    return;
                }
                const newChecked: boolean = event.target.checked;
                if (!isControlled) {
                    setCheckedState(newChecked);
                }
                if (onChange) {
                    onChange({ event, value: newChecked });
                }
            },
            [onChange, isControlled, isReadOnly]
        );

        const handleFocus: () => void = () => {
            setIsFocused(true);
        };

        const handleBlur: () => void = () => {
            setIsFocused(false);
        };

        const handleMouseDown: (e: MouseEvent<HTMLDivElement>) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
            if (!ripple || !rippleContainerRef.current || !rippleMouseDown){
                return;
            }
            const syntheticEvent: MouseEvent<HTMLSpanElement, globalThis.MouseEvent> = {
                ...e,
                currentTarget: rippleContainerRef.current,
                target: rippleContainerRef.current,
                preventDefault: e.preventDefault,
                stopPropagation: e.stopPropagation
            } as MouseEvent<HTMLSpanElement>;
            rippleMouseDown(syntheticEvent);
        }, [ripple, rippleMouseDown]);

        const handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void =
            useCallback((e: KeyboardEvent<HTMLInputElement>) => {
                if (isReadOnly && (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, [isReadOnly]);

        const wrapperClass: string = useMemo(() => [
            WRAPPER,
            className,
            color && color.toLowerCase() !== 'secondary' ? `sf-${color.toLowerCase()}` : '',
            disabled ? DISABLED : '',
            isFocused ? 'sf-focus' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            size && size.toLowerCase() !== 'medium' ? `sf-${size.toLowerCase()}` : '',
            isReadOnly ? 'sf-readonly' : ''
        ].filter(Boolean).join(' '), [className, color, disabled, isFocused, dir, size, isReadOnly]);

        const renderRipple: () => JSX.Element = () => (
            <span ref={rippleContainerRef} className={`sf-checkbox-ripple sf-checkbox-ripple-${size.toLowerCase().substring(0, 2)}`}>
                {ripple && <Ripple />}
                <input
                    ref={inputRef}
                    id={uniqueId}
                    className={`${CHECKBOX_CLASS} ${className}`}
                    type="checkbox"
                    name={name}
                    value={value}
                    checked={isChecked}
                    disabled={disabled}
                    aria-readonly={ariaReadonlyValue}
                    required={requiredAttribute}
                    aria-invalid={ariaInvalidValue}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={handleStateChange}
                    onKeyDown={handleKeyDown}
                    {...domProps}
                />
                {isChecked && checkedIcon ? checkedIcon : !checkedState && icon ? icon : renderIcons()}
            </span>
        );

        const showError: boolean = validityStyles !== false && !isInputValid;
        const renderIcons: () => JSX.Element = () => {
            const iconError: boolean = showError && !isChecked && !isIndeterminate;
            return (
                <span className={[
                    'sf-checkbox-icons',
                    `${FRAME}-${size.toLowerCase().substring(0, 2)}`,
                    isIndeterminate ? INDETERMINATE : isChecked ? CHECK : '',
                    iconError ? 'sf-error' : ''
                ].filter(Boolean).join(' ')}>
                    {isIndeterminate && indeterminateIcon ? (
                        indeterminateIcon
                    ) : isIndeterminate && (
                        <IntermediateBarIcon width={20} height={20} fill='currentColor' />
                    )}
                    {isChecked && !isIndeterminate && (
                        <CheckLargeIcon fill="currentColor" />
                    )}
                </span>
            );
        };

        return (
            <div
                ref={wrapperRef}
                className={wrapperClass}
                aria-disabled={disabled ? 'true' : 'false'}
                onMouseDown={handleMouseDown}
            >
                <label className={`sf-checkbox-label sf-${labelPlacement.toLowerCase()} sf-checkbox-${size.toLowerCase()}`}
                >
                    {label && (<span className={`${LABEL}`}>{label}</span>)}
                    {renderRipple()}
                </label>
            </div>
        );
    });

Checkbox.displayName = 'Checkbox';
export default Checkbox;
