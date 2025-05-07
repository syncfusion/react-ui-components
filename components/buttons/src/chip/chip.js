import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { preRender, useProviderContext, SvgIcon, useRippleEffect } from '@syncfusion/react-base';
import * as React from 'react';
/**
 * The Chip component represents information in a compact form, such as entity attribute, text, or action.
 *
 * ```typescript
 * <Chip color="primary" removable={true}>Anne</Chip>
 * ```
 */
export const Chip = React.memo(forwardRef((props, ref) => {
    const { value, text, avatar, leadingIcon, trailingIcon, className, disabled = false, leadingIconUrl, trailingIconUrl, children, removable, variant, color, onDelete, onClick, ...otherProps } = props;
    const publicAPI = {
        value,
        text,
        avatar,
        leadingIcon,
        trailingIcon,
        disabled,
        leadingIconUrl,
        trailingIconUrl,
        removable,
        variant,
        color
    };
    const chipRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const { dir, ripple } = useProviderContext();
    const closeIcon = 'M10.5858 12.0001L2.58575 4.00003L3.99997 2.58582L12 10.5858L20 2.58582L21.4142 4.00003L13.4142 12.0001L21.4142 20L20 21.4142L12 13.4143L4.00003 21.4142L2.58581 20L10.5858 12.0001Z';
    const selectIcon = 'M21.4142 6L9.00003 18.4142L2.58582 12L4.00003 10.5858L9.00003 15.5858L20 4.58578L21.4142 6Z';
    const { rippleMouseDown, Ripple } = useRippleEffect(ripple);
    useLayoutEffect(() => {
        preRender('chip');
    }, []);
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        element: chipRef.current
    }));
    const handleDelete = React.useCallback((e) => {
        if (!removable) {
            return;
        }
        e.stopPropagation();
        const eventArgs = {
            event: e,
            data: props
        };
        if (onDelete) {
            onDelete(eventArgs);
        }
    }, [onDelete, text, props]);
    const handleSpanDelete = React.useCallback((e) => {
        if (removable) {
            handleDelete(e);
        }
    }, [removable, handleDelete]);
    const handleClick = React.useCallback((e) => {
        if (onClick) {
            onClick(e);
        }
    }, [onClick, text, props]);
    const handleKeyDown = React.useCallback((e) => {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                handleClick(e);
                break;
            case 'Delete':
            case 'Backspace':
                if (removable) {
                    e.preventDefault();
                    handleDelete(e);
                }
                break;
        }
    }, [removable, handleClick, handleDelete]);
    const handleFocus = React.useCallback(() => {
        setIsFocused(true);
    }, []);
    const handleBlur = React.useCallback(() => {
        setIsFocused(false);
    }, []);
    const chipClassName = React.useMemo(() => {
        if (className?.includes('sf-chip')) {
            return className;
        }
        return [
            'sf-chip sf-control sf-lib sf-chip-list',
            className,
            disabled ? 'sf-disabled' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            avatar ? 'sf-chip-avatar-wrap' :
                leadingIcon ? 'sf-chip-icon-wrap' : '',
            isFocused ? 'sf-focused' : '',
            variant === 'outlined' ? 'sf-outline' : '',
            color ? `sf-${color}` : ''
        ].filter(Boolean).join(' ');
    }, [className, disabled, dir, avatar, leadingIcon, isFocused, variant, color]);
    const avatarClasses = React.useMemo(() => {
        return [
            'sf-chip-avatar',
            typeof avatar === 'string' ? avatar : ''
        ].filter(Boolean).join(' ');
    }, [avatar]);
    const trailingIconClasses = React.useMemo(() => {
        return [
            trailingIconUrl && !removable ? 'sf-trailing-icon-url' : 'sf-chip-delete',
            removable ? 'sf-dlt-btn' : (typeof trailingIcon === 'string' ? trailingIcon : '')
        ].filter(Boolean).join(' ');
    }, [trailingIconUrl, removable, trailingIcon]);
    return (_jsxs("div", { ref: chipRef, className: chipClassName, tabIndex: disabled ? -1 : 0, role: "button", "aria-disabled": disabled ? 'true' : 'false', "aria-label": text ? text : undefined, "data-value": value ? value.toString() : undefined, onClick: handleClick, onFocus: handleFocus, onBlur: handleBlur, onKeyDown: handleKeyDown, onMouseDown: rippleMouseDown, ...otherProps, children: [chipClassName.includes('sf-selectable') && (_jsx("span", { className: 'sf-selectable-icon', children: _jsx(SvgIcon, { width: '12', height: '12', d: selectIcon }) })), (avatar) && (_jsx("span", { className: avatarClasses, children: typeof avatar !== 'string' && avatar })), (leadingIcon && !avatar) && (typeof leadingIcon === 'string' ?
                _jsx("span", { className: `sf-chip-icon ${leadingIcon}` }) :
                _jsx("span", { className: "sf-chip-icon", children: leadingIcon })), (leadingIconUrl && !leadingIcon && !avatar) && (_jsx("span", { className: "sf-chip-avatar sf-image-url", children: leadingIconUrl && (_jsx("img", { className: 'sf-leading-image', src: leadingIconUrl, alt: "leading image" })) })), children ? (_jsx("div", { className: "sf-chip-template", children: children })) : text ? (_jsx("span", { className: "sf-chip-text", children: text })) : null, (trailingIcon || trailingIconUrl || removable) && (_jsxs("span", { className: trailingIconClasses, onClick: handleSpanDelete, children: [removable && (_jsx(SvgIcon, { width: '13', height: '13', d: closeIcon })), !removable && typeof trailingIcon !== 'string' && trailingIcon, !removable && trailingIconUrl && (_jsx("img", { className: 'sf-trailing-image', src: trailingIconUrl, alt: "trailing image" }))] })), ripple && _jsx(Ripple, {})] }));
}));
export default Chip;
