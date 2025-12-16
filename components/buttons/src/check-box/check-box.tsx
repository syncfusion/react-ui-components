import { useState, useEffect, useCallback, useImperativeHandle, useRef, forwardRef, Ref, JSX, InputHTMLAttributes } from 'react';
import { preRender, useProviderContext, useRippleEffect, getUniqueID, Color, Size, Position } from '@syncfusion/react-base';
import { CheckLargeIcon, IntermediateBarIcon} from '@syncfusion/react-icons';

/**
 * Interface for Checkbox change event arguments
 */
export interface CheckboxChangeEvent {
    /**
     * The initial event object received from the input element.
     */
    event: React.ChangeEvent<HTMLInputElement>;

    /**
     * The current checked state of the Checkbox.
     */
    value: boolean;
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
export interface CheckboxProps {

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
    icon?: React.ReactNode;

    /**
     * Specifies a custom icon to be displayed in checked state. This replaces the default Checkbox check mark.
     *
     * @default -
     */
    checkedIcon?: React.ReactNode;

    /**
     * Specifies a custom icon to be displayed in the indeterminate state. This replaces the default indeterminate icon.
     *
     * @default -
     */
    indeterminateIcon?: React.ReactNode;

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

export const Checkbox: React.ForwardRefExoticComponent<ICheckboxProps & React.RefAttributes<ICheckbox>> =
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
            id= getUniqueID('checkbox'),
            ...domProps
        } = props;

        const isControlled: boolean = checked !== undefined;
        const [checkedState, setCheckedState] = useState<boolean>(() => {
            if (isControlled) {
                return checked!;
            }
            return defaultChecked;
        });

        const [isIndeterminate, setIsIndeterminate] = useState(indeterminate);
        const [isFocused, setIsFocused] = useState(false);
        const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
        const wrapperRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const rippleContainerRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
        const { dir, ripple } = useProviderContext();
        const { rippleMouseDown, Ripple} = useRippleEffect(ripple, {isCenterRipple: true});

        const publicAPI: Partial<ICheckbox> = {
            checked,
            indeterminate,
            value,
            color,
            size,
            icon,
            checkedIcon
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as ICheckbox,
            element: inputRef.current
        }), [publicAPI]);

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

        const handleStateChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
            (event: React.ChangeEvent<HTMLInputElement>): void => {
                const newChecked: boolean = event.target.checked;
                setIsIndeterminate(isIndeterminate);
                setIsFocused(false);
                if (!isControlled) {
                    setCheckedState(newChecked);
                }
                if (onChange) {
                    onChange({ event, value: newChecked });
                }
            },
            [onChange, isControlled, isIndeterminate]
        );

        const handleFocus: () => void = () => {
            setIsFocused(true);
        };

        const handleBlur: () => void = () => {
            setIsFocused(false);
        };

        const handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
            if (!ripple || !rippleContainerRef.current || !rippleMouseDown){
                return;
            }
            const syntheticEvent: React.MouseEvent<HTMLSpanElement, MouseEvent> = {
                ...e,
                currentTarget: rippleContainerRef.current,
                target: rippleContainerRef.current,
                preventDefault: e.preventDefault,
                stopPropagation: e.stopPropagation
            } as React.MouseEvent<HTMLSpanElement>;
            rippleMouseDown(syntheticEvent);
        }, [ripple, rippleMouseDown]);

        const wrapperClass: string = [
            WRAPPER,
            className,
            color && color.toLowerCase() !== 'secondary' ? `sf-${color.toLowerCase()}` : '',
            disabled ? DISABLED : '',
            isFocused ? 'sf-focus' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            size && size.toLowerCase() !== 'medium' ? `sf-${size.toLowerCase()}` : ''
        ].filter(Boolean).join(' ');

        const renderRipple: () => JSX.Element = useCallback(() => (
            <span ref={rippleContainerRef} className={`sf-checkbox-ripple sf-checkbox-ripple-${size.toLowerCase().substring(0, 2)}  ${(labelPlacement === 'Top' || labelPlacement === 'Bottom') ? 'sf-checkbox-vertical' : 'sf-checkbox-horizontal'}`}>
                {ripple && <Ripple />}
            </span>
        ), [ripple, size, labelPlacement, rippleContainerRef]);

        const sizeMap: Record<string, string> = {
            small: 'sf-font-size-sm',
            large: 'sf-font-size-base'
        };
        const labelFontSizeClass: string = size ? sizeMap[size.toLowerCase()] ?? 'sf-font-size-sm' : 'sf-font-size-sm';

        const renderIcons: () => JSX.Element = () => {
            const getSizeDimensions: (size: Size) => number = (size: Size): number => {
                const sizeMap: Record<Size, number> = {
                    [Size.Small]: 12,
                    [Size.Medium]: 14,
                    [Size.Large]: 16
                };
                return sizeMap[size as Size] ?? 14;
            };
            const dimensions: number = getSizeDimensions(size);
            return (
                <span className={`sf-checkbox-icons ${FRAME}-${size.toLowerCase().substring(0, 2)} ${isIndeterminate ? INDETERMINATE : checkedState ? CHECK : ''}`}>
                    {isIndeterminate && indeterminateIcon ? (
                        indeterminateIcon
                    ) : isIndeterminate && (
                        <IntermediateBarIcon width={20} height={20} fill='currentColor' />
                    )}
                    {checkedState && !isIndeterminate && (
                        <CheckLargeIcon width={dimensions} height={dimensions} fill="currentColor" />
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
                <label className={`sf-checkbox-label sf-${labelPlacement.toLowerCase()} sf-checkbox-${size.toLowerCase()}`}>
                    <input
                        ref={inputRef}
                        id={id}
                        className={`${CHECKBOX_CLASS} ${className}`}
                        type="checkbox"
                        name={name}
                        value={value}
                        checked={isControlled ? checked : checkedState}
                        disabled={disabled}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={handleStateChange}
                        {...domProps}
                    />
                    {label && (<span className={`${LABEL} ${labelFontSizeClass}`}>{label}</span>)}
                    {ripple && renderRipple()}
                    {checkedState ? checkedIcon : icon}
                    {!checkedIcon && !icon && renderIcons()}
                </label>
            </div>
        );
    });

Checkbox.displayName = 'Checkbox';
export default Checkbox;

// Define the type for the component's props
interface CSSCheckboxProps {
    className?: string;
    checked?: boolean;
    label?: string;
}

const createCSSCheckbox: (props: CSSCheckboxProps) => JSX.Element = (props: CSSCheckboxProps): JSX.Element => {
    const {
        className = '',
        checked = false,
        label = '',
        ...domProps
    } = props;
    const { dir, ripple } = useProviderContext();
    const rippleContainerRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const { rippleMouseDown, Ripple} = useRippleEffect(ripple, {isCenterRipple: true});
    const handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (ripple && rippleContainerRef.current && rippleMouseDown) {
            const syntheticEvent: React.MouseEvent<HTMLSpanElement, MouseEvent> = {
                ...e,
                currentTarget: rippleContainerRef.current,
                target: rippleContainerRef.current,
                preventDefault: e.preventDefault,
                stopPropagation: e.stopPropagation
            } as React.MouseEvent<HTMLSpanElement>;
            rippleMouseDown(syntheticEvent);
        }
    }, [ripple, rippleMouseDown]);
    return (
        <div className={`sf-checkbox-wrapper ${className} ${(dir === 'rtl') ? 'sf-rtl' : ''}`} onMouseDown={handleMouseDown} {...domProps}>
            {<span ref={rippleContainerRef} className={`sf-ripple-container sf-checkbox-ripple sf-checkbox-ripple-me ${checked ? 'sf-ripple-check' : ''} sf-checkbox-horizontal`}>
                {ripple && <Ripple />}
            </span>}
            <span className={`sf-checkbox-frame-me sf-checkbox-icons ${checked ? 'sf-checkbox-checked' : ''}`}>
                {checked && (
                    <CheckLargeIcon width={12} height={12} fill='currentColor'/>
                )}
            </span>
            {label && (
                <span className={LABEL}>{label}</span>
            )}
        </div>
    );
};

// Component definition for Checkbox using create function
export const CSSCheckbox: React.FC<CSSCheckboxProps> = (props: CSSCheckboxProps): JSX.Element => {
    return createCSSCheckbox(props);
};
