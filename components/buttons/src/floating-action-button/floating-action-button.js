import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Button, IconPosition, Color } from '../button/button';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import * as React from 'react';
/**
 * Defines the position of FAB (Floating Action Button) in target.
 */
export var FabPosition;
(function (FabPosition) {
    /**
     * Positions the FAB at the target's top left corner.
     */
    FabPosition["TopLeft"] = "TopLeft";
    /**
     * Places the FAB on the top-center position of the target.
     */
    FabPosition["TopCenter"] = "TopCenter";
    /**
     * Positions the FAB at the target's top right corner.
     */
    FabPosition["TopRight"] = "TopRight";
    /**
     * Positions the FAB in the middle of target's left side.
     */
    FabPosition["MiddleLeft"] = "MiddleLeft";
    /**
     * Positions the FAB in the center of target.
     */
    FabPosition["MiddleCenter"] = "MiddleCenter";
    /**
     * Positions the FAB in the middle of target's right side.
     */
    FabPosition["MiddleRight"] = "MiddleRight";
    /**
     * Positions the FAB at the target's bottom left corner.
     */
    FabPosition["BottomLeft"] = "BottomLeft";
    /**
     * Places the FAB on the bottom-center position of the target.
     */
    FabPosition["BottomCenter"] = "BottomCenter";
    /**
     * Positions the FAB at the target's bottom right corner.
     */
    FabPosition["BottomRight"] = "BottomRight";
})(FabPosition || (FabPosition = {}));
/**
 * The Floating Action Button (FAB) component offers a prominent primary action for an application interface, prominently positioned and styled to stand out with custom icon support.
 *
 * ```typescript
 * <Fab color={Color.Success} position={FabPosition.BottomLeft}>FAB</Fab>
 * ```
 */
export const Fab = forwardRef((props, ref) => {
    const buttonRef = useRef(null);
    const { dir } = useProviderContext();
    const { disabled = false, position = FabPosition.BottomRight, iconPosition = IconPosition.Left, className = '', togglable = false, icon, children, color = Color.Primary, size, visible = true, ...domProps } = props;
    const fabPositionClasses = getFabPositionClasses(position, dir);
    const classNames = [
        'sf-control',
        'sf-fab',
        'sf-lib',
        'sf-btn',
        className || '',
        visible ? '' : 'sf-fab-hidden',
        dir === 'rtl' ? 'sf-rtl' : '',
        icon && !children ? 'sf-icon-btn' : '',
        ...fabPositionClasses
    ].filter(Boolean).join(' ');
    const publicAPI = {
        iconPosition,
        icon,
        togglable,
        visible,
        color,
        size
    };
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        element: buttonRef.current?.element
    }), [publicAPI]);
    useEffect(() => {
        preRender('fab');
    }, []);
    function getFabPositionClasses(position, dir) {
        const positions = {
            vertical: '',
            horizontal: '',
            middle: '',
            align: ''
        };
        if (['BottomLeft', 'BottomCenter', 'BottomRight'].indexOf(position) !== -1) {
            positions.vertical = 'sf-fab-bottom';
        }
        else {
            positions.middle = 'sf-fab-top';
        }
        if (['MiddleLeft', 'MiddleRight', 'MiddleCenter'].indexOf(position) !== -1) {
            positions.vertical = 'sf-fab-middle';
        }
        if (['TopCenter', 'BottomCenter', 'MiddleCenter'].indexOf(position) !== -1) {
            positions.align = 'sf-fab-center';
        }
        const isRight = ['TopRight', 'MiddleRight', 'BottomRight'].indexOf(position) !== -1;
        if ((!((dir === 'rtl') || isRight) || ((dir === 'rtl') && isRight))) {
            positions.horizontal = 'sf-fab-left';
        }
        else {
            positions.horizontal = 'sf-fab-right';
        }
        return Object.values(positions).filter(Boolean);
    }
    return (_jsx(Button, { ref: buttonRef, className: classNames, icon: icon, color: color, size: size, disabled: disabled, iconPosition: icon ? iconPosition : undefined, togglable: togglable, ...domProps, children: children }));
});
export default React.memo(Fab);
