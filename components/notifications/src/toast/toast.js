import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, createContext, useContext, useRef } from 'react';
import { Button } from '@syncfusion/react-buttons';
import { getUniqueID, preRender, SvgIcon, useProviderContext } from '@syncfusion/react-base';
import { Animation } from '@syncfusion/react-base';
import { Severity } from '../message';
/**
 * Defines the horizontal positioning options for components like Toasts, Popups, and Dialogs.
 */
export var PositionX;
(function (PositionX) {
    /**
     * Positions the component at the left edge of its container or target element.
     */
    PositionX["Left"] = "Left";
    /**
     * Positions the component at the right edge of its container or target element.
     */
    PositionX["Right"] = "Right";
    /**
     * Positions the component horizontally centered within its container or relative to its target element.
     */
    PositionX["Center"] = "Center";
})(PositionX || (PositionX = {}));
/**
 * Defines the vertical positioning options for Toasts component.
 */
export var PositionY;
(function (PositionY) {
    /**
     * Positions the component at the top edge of its container or target element.
     */
    PositionY["Top"] = "Top";
    /**
     * Positions the component at the bottom edge of its container or target element.
     */
    PositionY["Bottom"] = "Bottom";
})(PositionY || (PositionY = {}));
let toastCounter = 0;
/**
 * Toast component for displaying temporary notifications to users.
 *
 * The Toast component provides a non-intrusive way to show informational,
 * success, warning, or error messages that automatically dismiss after
 * a configurable timeout period.
 *
 * ```typescript
 * <Toast content="Operation completed successfully" open={true} position={{ X: 'Right', Y: 'Bottom' }} />
 *```
 */
export const Toast = forwardRef((props, ref) => {
    const { width = 'auto', height = 'auto', open = false, id = getUniqueID('toast_'), title, icon, className = '', content, newestOnTop = true, closeButton = false, progressBar = false, timeout = 5000, progressDirection = 'Rtl', position = { X: PositionX.Left, Y: PositionY.Top }, buttons = [], target = 'body', animation = {
        show: {
            name: 'FadeIn',
            duration: 0,
            timingFunction: 'ease-out'
        },
        hide: {
            name: 'FadeOut',
            duration: 0,
            timingFunction: 'ease-out'
        }
    }, onOpen, severity, onClose, onClick, children, extendedTimeout = 1000 } = props;
    const [toasts, setToasts] = useState([]);
    const toastRef = useRef(null);
    const initialOpenState = useRef(open);
    const [interactionToasts, setInteractionToasts] = useState({});
    const { dir } = useProviderContext();
    const closeIcon = 'M8.58578 10.0001L0.585754 2.00003L1.99997 0.585815L10 8.58584L18 0.585815L19.4142 2.00003L11.4142 10.0001L19.4142 18L18 19.4142L10 11.4143L2.00003 19.4142L0.585812 18L8.58578 10.0001Z';
    const progressWidth = '100%';
    const progressRefs = useRef(new Map());
    const publicAPI = {
        open,
        animation,
        position
    };
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        element: toastRef.current
    }));
    useEffect(() => {
        progressRefs.current.forEach((bar) => {
            if (bar) {
                requestAnimationFrame(() => {
                    bar.style.width = '0%';
                });
            }
        });
    }, [toasts]);
    useEffect(() => {
        if (!open && initialOpenState.current === open) {
            return;
        }
        initialOpenState.current = open;
        if (open) {
            show(content || children);
        }
        else {
            hide();
        }
    }, [open]);
    useEffect(() => {
        preRender('toast');
    }, []);
    const show = useCallback((content) => {
        const toastId = `toast-${++toastCounter}`;
        if (animation.show) {
            animation.show.begin = () => {
                setToasts((prevToasts) => {
                    const newToast = { id: toastId, content };
                    return newestOnTop ? [newToast, ...prevToasts] : [...prevToasts, newToast];
                });
            };
            animation.show.end = () => {
                onOpen?.();
            };
            if (Animation) {
                const animationInstance = Animation(animation.show);
                if (animationInstance.animate) {
                    animationInstance.animate(toastRef.current);
                }
            }
        }
        if (timeout > 0) {
            setTimeout(() => {
                if (!Object.prototype.hasOwnProperty.call(interactionToasts, String(toastId))) {
                    hide(toastId);
                }
            }, timeout);
        }
        return toastId;
    }, [newestOnTop, timeout, interactionToasts]);
    const hide = useCallback((toastId) => {
        const toastElement = toastId
            ? document.getElementById(toastId)
            : toastRef.current?.querySelector('.sf-toast');
        if (!toastElement) {
            return;
        }
        if (animation.hide) {
            animation.hide.begin = () => {
                let duration = animation.hide?.duration ? animation.hide.duration - 30 : 0;
                duration = duration > 0 ? duration : 0;
                setTimeout(() => {
                    setToasts((prevToasts) => {
                        if (toastId) {
                            return prevToasts.filter((toast) => toast.id !== toastId);
                        }
                        else {
                            return prevToasts.slice(1);
                        }
                    });
                    if (toastId) {
                        setInteractionToasts((prev) => {
                            const newState = { ...prev };
                            delete newState[String(toastId)];
                            return newState;
                        });
                    }
                }, duration);
            };
            animation.hide.end = () => {
                onClose?.();
            };
            if (Animation) {
                const animationInstance = Animation(animation.hide);
                if (animationInstance.animate) {
                    animationInstance.animate(toastElement);
                }
            }
        }
    }, [onClose]);
    useImperativeHandle(ref, () => ({ show, hide }));
    const handleClick = useCallback((e, toastId) => {
        onClick?.(e);
        setInteractionToasts((prev) => ({ ...prev, [toastId]: true }));
        if (timeout !== 0 && extendedTimeout > 0) {
            setTimeout(() => hide(toastId), extendedTimeout);
        }
        if (closeButton && e.target.closest('.sf-toast-close-icon')) {
            hide(toastId);
        }
    }, [onClick, closeButton, hide]);
    const containerPosition = `sf-toast-${position?.Y?.toLowerCase()}-${position?.X?.toLowerCase()}`;
    return (_jsx("div", { ref: toastRef, id: id, className: `sf-control sf-toast sf-lib sf-toast-container ${containerPosition} ${(severity && severity !== 'Normal') ? severity === 'Error' ? 'sf-toast-danger' : `sf-toast-${severity.toLowerCase()}` : ''} ${className} ${(dir === 'rtl') ? 'sf-rtl' : ''}`, style: {
            position: target !== 'body' ? 'absolute' : 'fixed',
            zIndex: target !== 'body' ? 1000000001 : 1004
        }, children: toasts.map(({ id, content }) => (_jsxs("div", { id: id, className: `sf-toast ${className || ''} ${(severity && severity !== 'Normal') ? severity === 'Error' ? 'sf-toast-danger' : `sf-toast-${severity.toLowerCase()}` : ''} ${icon ? 'sf-toast-header-icon' : ''}`, role: "alert", style: { width, height }, onClick: (e) => handleClick(e, id), children: [icon && _jsx("div", { className: 'sf-toast-icon sf-icons', children: icon }), _jsxs("div", { className: "sf-toast-message", children: [title && _jsx("div", { className: "sf-toast-title", children: title }), _jsx("div", { className: "sf-toast-content", children: content })] }), closeButton && (_jsx("div", { className: "sf-toast-close-icon", children: _jsx(SvgIcon, { d: closeIcon }) })), progressBar && (_jsx("div", { className: "sf-toast-progress", children: _jsx("div", { ref: (el) => {
                            if (el) {
                                progressRefs.current.set(id, el);
                            }
                            else {
                                progressRefs.current.delete(id);
                            }
                        }, className: `sf-toast-progress-bar ${progressDirection === 'Rtl' ? 'sf-toast-progress-rtl' : ''}`, style: {
                            width: progressWidth,
                            transition: `width ${timeout}ms linear`,
                            transform: progressDirection === 'Rtl' ? 'scaleX(-1)' : 'none'
                        } }) })), buttons.length > 0 && (_jsx("div", { className: "sf-toast-actions", children: buttons.map((btn, index) => (_jsx(Button, { ...btn.model, onClick: btn.click }, index))) }))] }, id))) }));
});
const ToastContext = createContext(null);
export let globalToastRef = null;
export const ToastProvider = ({ children }) => {
    const toastRef = useRef(null);
    const [toastProps, setToastProps] = useState({});
    const info = 'M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM13 11V17H11V11H13ZM13 9V7H11V9H13Z';
    const success = 'M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12ZM12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM10.5 16.4142L17.9142 9L16.5 7.58578L10.5 13.5858L7.50003 10.5858L6.08582 12L10.5 16.4142Z';
    const warning = 'M10.2691 2.99378C11.0395 1.66321 12.9605 1.6632 13.7308 2.99378L22.9964 18.9979C23.7683 20.3312 22.8062 22 21.2655 22H2.73444C1.19378 22 0.231653 20.3313 1.00358 18.9979L10.2691 2.99378ZM21.2655 20L12 3.99585L2.73444 20L21.2655 20ZM13 14V9H11V14H13ZM13 16H11V18.5H13V16Z';
    const danger = 'M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12ZM12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM12 10.5858L8.50003 7.08582L7.08582 8.50003L10.5858 12L7.08582 15.5L8.50003 16.9142L12 13.4142L15.5 16.9142L16.9142 15.5L13.4142 12L16.9142 8.50003L15.5 7.08582L12 10.5858Z';
    useEffect(() => {
        ToastUtility.setGlobalToastRef(toastRef.current);
        return () => {
            ToastUtility.setGlobalToastRef(null);
        };
    }, []);
    const show = (content, options = {}) => {
        const { severity = Severity.Info, timeout = 5000, extendedTimeout = 1000, position = { X: 'Right', Y: 'Top' }, closeButton = true, title } = options;
        let icon;
        let className;
        switch (severity) {
            case 'Success':
                icon = _jsx(SvgIcon, { d: success });
                className = 'sf-toast-success';
                break;
            case 'Warning':
                icon = _jsx(SvgIcon, { d: warning });
                className = 'sf-toast-warning';
                break;
            case 'Error':
                icon = _jsx(SvgIcon, { d: danger });
                className = 'sf-toast-danger';
                break;
            case 'Info':
            default:
                icon = _jsx(SvgIcon, { d: info });
                className = 'sf-toast-info';
                break;
        }
        setToastProps({
            content: (_jsx("div", { className: className, children: content })),
            className,
            icon,
            timeout,
            extendedTimeout,
            position,
            closeButton,
            title
        });
        if (toastRef.current) {
            return toastRef.current?.show(content);
        }
        else {
            return '';
        }
    };
    const hide = (toastId) => {
        if (toastRef.current) {
            toastRef.current.hide(toastId);
        }
        else {
            console.warn('Toast reference is not available');
        }
    };
    return (_jsxs(ToastContext.Provider, { value: { show, hide }, children: [children, _jsx(Toast, { ref: toastRef, ...toastProps })] }));
};
/**
 * Hook to use the Toast context
 *
 * @returns {Object} An object with show and hide methods for managing toasts
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        return;
    }
    return context;
};
/**
 * Utility object for managing toasts globally
 */
export const ToastUtility = {
    setGlobalToastRef: (ref) => {
        globalToastRef = ref;
    },
    show: (content) => {
        if (globalToastRef) {
            return globalToastRef.show(content);
        }
        else {
            return '';
        }
    },
    hide: (toastId) => {
        if (globalToastRef) {
            globalToastRef.hide(toastId);
        }
    }
};
