import { forwardRef, useState, useEffect, useImperativeHandle, useCallback, ChangeEvent } from 'react';
import * as React from 'react';
import { preRender, useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import { Size } from '../button/button';

/**
 * Interface representing Switch component properties.
 *
 */
export interface SwitchProps {
    /**
     * Specifies a value that indicates whether the Switch is `checked` or not. When set to `true`, the Switch will be in `checked` state.
     *
     *
     * @default false
     */
    checked?: boolean;

    /**
     * Defines `name` attribute for the Switch. It is used to reference form data (Switch value) after a form is submitted.
     *
     * @default -
     */
    name?: string;

    /**
     * Specifies a text that indicates the Switch is in checked state.
     *
     * @default -
     */
    onLabel?: string;

    /**
     * Specifies a text that indicates the Switch is in unchecked state.
     *
     * @default -
     */
    offLabel?: string;

    /**
     * Defines `value` attribute for the Switch. It is a form data passed to the server when submitting the form.
     *
     * @default -
     */
    value?: string;

    /**
     * Specifies the size style of the switch button. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Callback fired on change event.
     *
     *  @event change
     */
    onChange?: (args: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Interface for exposing imperative methods for the Switch component.
 */
export interface ISwitch extends SwitchProps {
    /**
     * This is Switch component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}

type ISwitchProps = ISwitch & React.InputHTMLAttributes<HTMLInputElement>;

/**
 * The Switch component is a toggle switch offering a binary decision interface, visually indicating the state between on and off with optional label customization for clear communication.
 *
 * ```typescript
 * <Switch checked={true} onLabel="Enabled" offLabel="Disabled" />
 * ```
 */
export const Switch: React.ForwardRefExoticComponent<ISwitchProps & React.RefAttributes<ISwitch>> =
    forwardRef<ISwitch, ISwitchProps>((props: ISwitchProps, ref: React.Ref<ISwitch>) => {
        const {
            checked,
            className = '',
            disabled = false,
            name = '',
            onLabel = '',
            offLabel = '',
            value = '',
            size = Size.Medium,
            onChange,
            ...domProps
        } = props;

        const isControlled: boolean = checked !== undefined;
        const [isChecked, setIsChecked] = useState<boolean>(() => isControlled ? !!checked : !!domProps.defaultChecked);
        const switchRef: React.RefObject<HTMLInputElement | null> = React.useRef<HTMLInputElement | null>(null);
        const [isFocused, setIsFocused] = useState(false);
        const { dir, ripple } = useProviderContext();
        const rippleContainerRef: React.RefObject<HTMLSpanElement | null> = React.useRef<HTMLSpanElement | null>(null);
        const { rippleMouseDown, Ripple } = useRippleEffect(ripple, { duration: 400, isCenterRipple: true });

        const publicAPI: Partial<ISwitch> = {
            checked,
            onLabel,
            offLabel,
            name,
            value,
            size
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as ISwitch,
            element: switchRef.current
        }), [isChecked, disabled, publicAPI]);

        useEffect(() => {
            if (isControlled) {
                setIsChecked(!!checked);
            }
        }, [checked, isControlled]);

        useEffect(() => {
            preRender('switch');
        }, []);

        const togglable: () => void = useCallback(() => {
            if (disabled) {
                return;
            }
            const newCheckedState: boolean = !isChecked;
            if (!isControlled) {
                setIsChecked(newCheckedState);
            }
            if (onChange) {
                const syntheticEvent: any = {
                    ...new Event('change', { bubbles: true }),
                    target: { ...switchRef.current, checked: newCheckedState, value } as HTMLInputElement,
                    currentTarget: switchRef.current
                };
                onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
            }
        }, [isChecked, isControlled, onChange, disabled]);

        const handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void = (event: React.ChangeEvent<HTMLInputElement>) => {
            if (disabled) {
                return;
            }
            const newChecked: boolean = event.target.checked;
            if (!isControlled) {
                setIsChecked(newChecked);
            }
            onChange?.(event);
        };

        const handleBlur: () => void = () => setIsFocused(false);
        const handleFocus: () => void = () => setIsFocused(true);

        const handleKeyUp: any = (event: React.KeyboardEvent<HTMLInputElement>): void => {
            if ((event.key === ' ' || event.key === 'Space') && event.target === switchRef.current) {
                event.preventDefault();
                togglable();
            }
        };

        const handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
            if (ripple && rippleContainerRef.current && rippleMouseDown) {
                const syntheticEvent: React.MouseEvent<HTMLSpanElement> = {
                    ...e,
                    currentTarget: rippleContainerRef.current,
                    target: rippleContainerRef.current,
                    preventDefault: e.preventDefault,
                    stopPropagation: e.stopPropagation
                } as React.MouseEvent<HTMLSpanElement>;
                rippleMouseDown(syntheticEvent);
            }
        }, [ripple, rippleMouseDown]);

        const switchClasses: string = [
            'sf-control',
            'sf-switch',
            'sf-lib',
            isFocused ? 'sf-focus' : '',
            typeof size === 'string' ? (size.toLowerCase() === 'medium' ? '' : `sf-${size.toLowerCase() === 'large' ? 'bigger' : size.toLowerCase()}`) : '',
            className
        ].join(' ');

        return (
            <div className={`sf-switch-wrapper ${isFocused ? 'sf-focus' : ''} ${typeof size === 'string' ? `sf-${size.toLowerCase() === 'large' ? 'bigger' : size.toLowerCase()}` : ''} ${className} ${disabled ? 'sf-switch-disabled' : ''} ${(dir === 'rtl') ? 'sf-rtl' : ''}`} onClick={() => togglable()} onMouseDown={handleMouseDown}>
                <input
                    ref={switchRef}
                    type="checkbox"
                    className={switchClasses}
                    name={name}
                    value={value}
                    checked={isControlled ? !!checked : isChecked}
                    disabled={disabled}
                    onKeyUp={handleKeyUp}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    {...domProps}
                />
                <span className={`sf-switch-inner ${isChecked ? 'sf-switch-active' : ''}`}>
                    <span className="sf-switch-on">{onLabel}</span>
                    <span className="sf-switch-off">{offLabel}</span>
                </span>
                <span className={`sf-switch-handle ${isChecked ? 'sf-switch-active' : ''}`}>
                    <span ref={rippleContainerRef} className={`sf-ripple-container ${isChecked ? 'sf-ripple-check' : ''}`}>
                        {ripple && <Ripple />}
                    </span>
                </span>
            </div>
        );
    });

export default Switch;
