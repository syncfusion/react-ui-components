import {
    useState, useEffect, useCallback, useMemo, useImperativeHandle, useRef, forwardRef, memo, Ref, RefObject,
    InputHTMLAttributes, ForwardRefExoticComponent, RefAttributes, ChangeEventHandler, ChangeEvent, MouseEvent, ReactNode
} from 'react';
import { preRender, useProviderContext, useRippleEffect, Color, Size, Position, useStableId } from '@syncfusion/react-base';
import { SwitchProps } from './types';

/**
 * Interface for the Switch component ref instance
 */
export interface ISwitch extends SwitchProps {
    /**
     * The hidden `<input type="checkbox" role="switch">` DOM node.
     *
     * @private
     */
    element?: HTMLInputElement | null;
}

type ISwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & ISwitch;

const WRAPPER: string = 'sf-control sf-switch-wrapper sf-display-inline-flex sf-prevent-select';
const DISABLED: string = 'sf-disabled sf-no-pointer';
const SWITCH_CLASS: string = 'sf-switch';
const HANDLE_BASE: string = 'sf-switch-handle sf-content-center';
const HANDLE_CHECKED: string = 'sf-switch-handle-checked';
const HANDLE_ICON: string = 'sf-switch-handle-icon';
const TRACK_BASE: string = 'sf-switch-track sf-display-inline-flex';
const TRACK_CHECKED: string = 'sf-switch-track-checked';
const STATE_LAYER: string = 'sf-switch-state-layer';
const ICON_CENTER: string = 'sf-switch-icon sf-content-center';
const TRACK_LABEL_BASE: string = 'sf-switch-track-label sf-display-inline-flex';
const TRACK_LABEL_ON: string = 'sf-switch-track-label-on';
const TRACK_LABEL_OFF: string = 'sf-switch-track-label-off';
const LABEL_CLASS_NAME: string = 'sf-label';
const SWITCH_LABEL_BASE: string = 'sf-switch-label';

/**
 * The Switch component is a binary toggle control for settings and standalone options
 * that take immediate effect. It follows the Material Design 3 specification.
 *
 * ```typescript
 * import { Switch } from "@syncfusion/react-buttons";
 *
 * <Switch checked={true} label="Dark mode" />
 * ```
 */
export const Switch: ForwardRefExoticComponent<ISwitchProps & RefAttributes<ISwitch>> =
    forwardRef<ISwitch, ISwitchProps>((props: ISwitchProps, ref: Ref<ISwitch>) => {
        const {
            onChange,
            checked,
            defaultChecked = false,
            color = Color.Primary,
            checkedIcon,
            uncheckedIcon,
            className = '',
            disabled = false,
            labelPlacement = Position.Right,
            name = '',
            label = '',
            value = '',
            size = Size.Medium,
            onTrackLabel = null,
            offTrackLabel = null,
            readOnly = false,
            ...domProps
        } = props;

        const inputId: string = domProps.id ?? useStableId('sf-switch');
        const isControlled: boolean = checked !== undefined;
        const [checkedState, setCheckedState] = useState<boolean>(() => {
            if (isControlled) {
                return !!checked;
            }
            return defaultChecked;
        });

        const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
        const { dir, ripple } = useProviderContext();
        const { rippleMouseDown, Ripple } = useRippleEffect(ripple, { isCenterRipple: true });
        const hasIcon: boolean = !!(checkedIcon || uncheckedIcon);

        const publicAPI: Partial<ISwitch> = useMemo<Partial<ISwitch>>(() => ({
            checked,
            value,
            color,
            size,
            checkedIcon,
            uncheckedIcon,
            onTrackLabel,
            offTrackLabel
        }), [checked, value, color, size, checkedIcon, uncheckedIcon, onTrackLabel, offTrackLabel]);

        useImperativeHandle(ref, () => ({
            ...publicAPI as ISwitch,
            element: inputRef.current
        }), [publicAPI]);

        useEffect(() => {
            if (isControlled) {
                setCheckedState(!!checked);
            }
        }, [checked, isControlled]);

        useEffect(() => {
            preRender('switch');
        }, []);

        const handleStateChange: ChangeEventHandler<HTMLInputElement> = useCallback(
            (event: ChangeEvent<HTMLInputElement>): void => {
                if (disabled || readOnly) {
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
            [onChange, isControlled, disabled, readOnly]
        );

        const handleMouseDown: (e: MouseEvent<HTMLLabelElement>) => void = useCallback(
            (e: MouseEvent<HTMLLabelElement>): void => {
                if (ripple && rippleMouseDown) {
                    rippleMouseDown(e);
                }
            },
            [ripple, rippleMouseDown]
        );

        const currentChecked: boolean = isControlled ? !!checked : checkedState;

        const wrapperClass: string = useMemo(() => [
            WRAPPER,
            className,
            color ? `sf-${color.toLowerCase()}` : '',
            disabled ? DISABLED : '',
            readOnly ? 'sf-readonly' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            size ? `sf-${size.toLowerCase()}` : ''
        ].filter(Boolean).join(' '), [className, color, disabled, readOnly, dir, size]);

        const handleClass: string = useMemo(() => [
            HANDLE_BASE,
            currentChecked ? HANDLE_CHECKED : '',
            hasIcon ? HANDLE_ICON : ''
        ].filter(Boolean).join(' '), [currentChecked, hasIcon]);

        const trackClass: string = useMemo(() => [
            TRACK_BASE,
            currentChecked ? TRACK_CHECKED : ''
        ].filter(Boolean).join(' '), [currentChecked]);

        const activeIcon: ReactNode = currentChecked ? (checkedIcon ?? null) : (uncheckedIcon ?? null);
        const labelClass: string = useMemo(() =>
            `${SWITCH_LABEL_BASE} sf-${labelPlacement.toLowerCase()} sf-display-inline-flex sf-switch-${size.toLowerCase()}`,
                                           [labelPlacement, size]);
        const trackLabelClass: string = useMemo(() =>
            `${TRACK_LABEL_BASE} ${currentChecked ? TRACK_LABEL_ON : TRACK_LABEL_OFF}`,
                                                [currentChecked]);

        return (
            <div
                className={wrapperClass}
            >
                <label
                    className={labelClass}
                    htmlFor={inputId}
                    onMouseDown={handleMouseDown}
                >
                    {(labelPlacement === Position.Left || labelPlacement === Position.Top) && label && (
                        <span className={LABEL_CLASS_NAME}>{label}</span>
                    )}
                    <input
                        ref={inputRef}
                        id={inputId}
                        className={SWITCH_CLASS}
                        type="checkbox"
                        role="switch"
                        name={name}
                        value={value}
                        checked={currentChecked}
                        disabled={disabled}
                        readOnly={readOnly}
                        aria-checked={currentChecked}
                        aria-label={!label ? 'Switch' : undefined}
                        aria-readonly={readOnly}
                        title={label || 'Toggle switch'}
                        onChange={handleStateChange}
                        {...domProps}
                    />
                    <div className={trackClass}>
                        {(onTrackLabel || offTrackLabel) && (
                            <span className={trackLabelClass}>
                                {currentChecked ? onTrackLabel : offTrackLabel}
                            </span>
                        )}
                        <span className={handleClass}>
                            <span
                                className={STATE_LAYER}
                            >
                                {ripple && !disabled && <Ripple />}
                            </span>
                            {hasIcon && (
                                <span className={ICON_CENTER}>
                                    {activeIcon}
                                </span>
                            )}
                        </span>
                    </div>
                    {(labelPlacement === Position.Right || labelPlacement === Position.Bottom) && label && (
                        <span className={LABEL_CLASS_NAME}>{label}</span>
                    )}
                </label>
            </div>
        );
    });

export default memo(Switch);
