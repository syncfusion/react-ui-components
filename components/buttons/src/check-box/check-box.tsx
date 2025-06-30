import { useState, useEffect, useCallback, useImperativeHandle, useRef, forwardRef, Ref, JSX, InputHTMLAttributes, ChangeEvent } from 'react';
import { preRender, useProviderContext, SvgIcon, useRippleEffect } from '@syncfusion/react-base';
import {Color, LabelPlacement, Size} from '../button/button';

const CHECK: string = 'sf-check';
const DISABLED: string = 'sf-checkbox-disabled';
const FRAME: string = 'sf-frame';
const INDETERMINATE: string = 'sf-stop';
const LABEL: string = 'sf-label';
const WRAPPER: string = 'sf-checkbox-wrapper';
const CheckBoxClass: string = 'sf-control sf-checkbox sf-lib';

/**
 * Properties interface for the CheckBox component
 *
 */
export interface CheckBoxProps {

    /**
     * Specifies if the CheckBox is in an `indeterminate` state, which visually presents it as neither checked nor unchecked; setting this to `true` will make the CheckBox appear in an indeterminate state.
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
     * Specifies the size style of the checkbox. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    icon?: React.ReactNode;

    checkedIcon?: React.ReactNode;

    /**
     * Specifies the position of the label relative to the CheckBox. It determines whether the label appears before or after the checkbox element in the UI.
     *
     * @default 'After'
     */
    labelPlacement?: LabelPlacement;

    /**
     * Specifies a value that indicates whether the CheckBox is `checked` or not. When set to `true`, the CheckBox will be in `checked` state.
     *
     * @default false
     */
    checked?: boolean;

    /**
     * Specifies the Color style of the button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Danger', and 'Info'.
     *
     * @default -
     */
    color?: Color;

    /**
     * Defines `value` attribute for the CheckBox. It is a form data passed to the server when submitting the form.
     *
     *
     * @default -
     */
    value?: string;

    /**
     * Triggers when the CheckBox state has been changed by user interaction, allowing custom logic to be executed in response to the state change.
     *
     * @event change
     */
    onChange?: (args: ChangeEvent) => void;
}

/**
 * Interface to define the structure of the CheckBox component reference instance
 *
 */
export interface ICheckBox extends CheckBoxProps {
    /**
     * This is checkbox component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}

type ICheckBoxProps = ICheckBox & InputHTMLAttributes<HTMLInputElement>;

/**
 * The CheckBox component allows users to select one or multiple options from a list, providing a visual representation of a binary choice with states like checked, unchecked, or indeterminate.
 *
 * ```typescript
 * <CheckBox checked={true} label="Accept Terms and Conditions" />
 * ```
 */

export const Checkbox: React.ForwardRefExoticComponent<ICheckBoxProps & React.RefAttributes<ICheckBox>> =
    forwardRef<ICheckBox, ICheckBoxProps>((props: ICheckBoxProps, ref: Ref<ICheckBox>) => {
        const {
            onChange,
            checked,
            color,
            icon,
            checkedIcon,
            className = '',
            disabled = false,
            indeterminate = false,
            labelPlacement = 'After',
            name = '',
            value = '',
            size = Size.Medium,
            ...domProps
        } = props;

        const isControlled: boolean = checked !== undefined;
        const [checkedState, setCheckedState] = useState<boolean>(() => {
            if (isControlled) {
                return checked!;
            }
            return domProps.defaultChecked || false;
        });

        const [isIndeterminate, setIsIndeterminate] = useState(indeterminate);
        const [isFocused, setIsFocused] = useState(false);
        const [storedLabel, setStoredLabel] = useState<string>(props.label ?? '');
        const [storedLabelPosition, setStoredLabelPosition] = useState<LabelPlacement>(
            labelPlacement ?? 'After'
        );

        const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
        const wrapperRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const rippleContainerRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
        const { dir, ripple } = useProviderContext();
        const { rippleMouseDown, Ripple} = useRippleEffect(ripple, {isCenterRipple: true});
        const checkIcon: string = 'M23.8284 3.75L8.5 19.0784L0.17157 10.75L3 7.92157L8.5 13.4216L21 0.92157L23.8284 3.75Z';
        const indeterminateIcon: string = 'M0.5 0.5H17.5V3.5H0.5V0.5Z';

        const publicAPI: Partial<ICheckBox> = {
            checked,
            indeterminate,
            value,
            color,
            size,
            icon,
            checkedIcon
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as ICheckBox,
            element: inputRef.current
        }), [publicAPI]);

        useEffect(() => {
            if (isControlled) {
                setCheckedState(!!checked);
            }
        }, [checked, isControlled]);

        useEffect(() => {
            setStoredLabel(props.label ?? '');
            setStoredLabelPosition(labelPlacement ?? 'After');
        }, [props.label, labelPlacement]);

        useEffect(() => {
            preRender('checkbox');
        }, []);

        useEffect(() => {
            setIsIndeterminate(indeterminate);
        }, [indeterminate]);

        const handleStateChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
            (event: React.ChangeEvent<HTMLInputElement>): void => {
                const newChecked: boolean = event.target.checked;
                setIsIndeterminate(false);
                setIsFocused(false);
                if (!isControlled) {
                    setCheckedState(newChecked);
                }
                onChange?.(event);
            },
            [onChange, isControlled]
        );

        const handleFocus: () => void = () => {
            setIsFocused(true);
        };

        const handleBlur: () => void = () => {
            setIsFocused(false);
        };

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

        const wrapperClass: string = [
            WRAPPER,
            className,
            color && color.toLowerCase() !== 'secondary' ? `sf-${color.toLowerCase()}` : '',
            disabled ? DISABLED : '',
            isFocused ? 'sf-focus' : '',
            !disabled && dir === 'rtl' ? 'sf-rtl' : '',
            size && size.toLowerCase() !== 'medium' ? `sf-${size.toLowerCase()}` : ''
        ].filter(Boolean).join(' ');

        const renderRipple: () => JSX.Element = () => (
            <span ref={rippleContainerRef} className={`sf-ripple-container ${checkedState ? 'sf-ripple-check' : ''}`}>
                {ripple && <Ripple />}
            </span>
        );

        const renderLabel: (label: string) => JSX.Element = (label: string) => (
            <span className={`${LABEL} ${storedLabelPosition === 'Bottom' ? 'sf-bottom' : ''}`}>{label}</span>
        );

        const renderIcons: () => JSX.Element = () => {
            const sizeDimensions: any = {
                Small: { width: '12', height: '12', viewBox: '0 0 26 20' },
                Medium: { width: '12', height: '12', viewBox: '0 0 25 20' },
                Large: { width: '16', height: '16', viewBox: '0 0 26 20' }
            };
            const dimensions: any = sizeDimensions[size as keyof typeof sizeDimensions] || sizeDimensions.Medium;
            return (
                <span className={`sf-icons ${FRAME} ${isIndeterminate ? INDETERMINATE : checkedState ? CHECK : ''}`}>
                    {isIndeterminate && (
                        <SvgIcon
                            width={dimensions.width}
                            height={dimensions.height}
                            viewBox="0 0 20 2"
                            d={indeterminateIcon}
                            fill="currentColor"
                        />
                    )}
                    {checkedState && !isIndeterminate && (
                        <SvgIcon
                            width={dimensions.width}
                            height={dimensions.height}
                            viewBox={dimensions.viewBox}
                            d={checkIcon}
                            fill="currentColor"
                        />
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
                <label>
                    <input
                        ref={inputRef}
                        className={`${CheckBoxClass} ${className}`}
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
                    {storedLabelPosition === 'Before' && renderLabel(storedLabel)}
                    {(storedLabelPosition === 'After' || storedLabelPosition === 'Bottom' || (checkedIcon && icon)) && renderRipple()}
                    {checkedState ? checkedIcon : icon}
                    {!checkedIcon && !icon && renderIcons()}
                    {storedLabelPosition === 'Before' && renderRipple()}
                    {(storedLabelPosition === 'After' || storedLabelPosition === 'Bottom') && renderLabel(storedLabel)}
                </label>
            </div>
        );
    });

Checkbox.displayName = 'CheckBox';
export default Checkbox;

// Define the type for the component's props
interface CSSCheckBoxProps {
    className?: string;
    checked?: boolean;
    label?: string;
}

const createCSSCheckBox: (props: CSSCheckBoxProps) => JSX.Element = (props: CSSCheckBoxProps): JSX.Element => {
    const {
        className = '',
        checked = false,
        label = '',
        ...domProps
    } = props;
    const { dir, ripple } = useProviderContext();
    const checkIcon: string = 'M23.8284 3.75L8.5 19.0784L0.17157 10.75L3 7.92157L8.5 13.4216L21 0.92157L23.8284 3.75Z';
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
        <div className={`sf-checkbox-wrapper sf-css ${className} ${(dir === 'rtl') ? 'sf-rtl' : ''}`} onMouseDown={handleMouseDown} {...domProps}>
            {<span ref={rippleContainerRef} className={`sf-ripple-container ${checked ? 'sf-ripple-check' : ''}`}>
                {ripple && <Ripple />}
            </span>}
            <span className={`sf-frame e-icons ${checked ? 'sf-check' : ''}`}>
                {checked && (
                    <SvgIcon width='12' height='12' viewBox='0 0 25 20' d={checkIcon} fill="currentColor"></SvgIcon>
                )}
            </span>
            {label && (
                <span className={LABEL}>{label}</span>
            )}
        </div>
    );
};

// Component definition for CheckBox using create function
export const CSSCheckbox: React.FC<CSSCheckBoxProps> = (props: CSSCheckBoxProps): JSX.Element => {
    return createCSSCheckBox(props);
};
