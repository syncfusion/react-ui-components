import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
// Individual ripple component
export const RippleElement = ({ x, y, size, duration, onAnimationComplete }) => {
    const rippleRef = useRef(null);
    useEffect(() => {
        const ripple = rippleRef.current;
        if (!ripple) {
            return undefined;
        }
        void ripple.offsetWidth;
        ripple.style.transform = 'scale(1)';
        const fadeTimer = setTimeout(() => {
            if (ripple) {
                ripple.style.opacity = '0';
            }
        }, duration / 2);
        const cleanupTimer = setTimeout(() => {
            if (ripple) {
                ripple.style.opacity = '0';
                ripple.style.visibility = 'hidden';
            }
            if (onAnimationComplete) {
                onAnimationComplete();
            }
        }, duration);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(cleanupTimer);
        };
    }, [duration, onAnimationComplete]);
    return (_jsx("div", { ref: rippleRef, className: "sf-ripple-element", style: {
            width: `${size}px`,
            height: `${size}px`,
            left: `${Number(x) - Number(size) / 2}px`,
            top: `${Number(y) - Number(size) / 2}px`,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            opacity: '0.2',
            transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            visibility: 'visible'
        } }));
};
export const RippleContainer = forwardRef((props, ref) => {
    const { maxRipples = 2 } = props;
    const containerRef = useRef(null);
    const [ripples, setRipples] = useState([]);
    const nextIdRef = useRef(0);
    const createRipple = useCallback((x, y, size, duration, isCenterRipple) => {
        const id = nextIdRef.current++;
        setRipples((prevRipples) => {
            if (prevRipples.length >= maxRipples) {
                return [
                    ...prevRipples.slice(prevRipples.length - maxRipples + 1),
                    { id, x, y, size, duration, isCenterRipple }
                ];
            }
            return [
                ...prevRipples,
                { id, x, y, size, duration, isCenterRipple }
            ];
        });
    }, [maxRipples]);
    const removeRipple = useCallback((id) => {
        setRipples((prevRipples) => prevRipples.filter((r) => r.id !== id));
    }, []);
    useImperativeHandle(ref, () => ({
        createRipple
    }));
    return (_jsx("span", { ref: containerRef, className: "sf-ripple-wrapper", children: ripples.map((ripple) => (_jsx(RippleElement, { x: ripple.x, y: ripple.y, size: String(ripple.size), duration: ripple.duration, isCenterRipple: ripple.isCenterRipple, onAnimationComplete: () => removeRipple(ripple.id) }, ripple.id))) }));
});
const closestParent = (element, selector) => {
    if (!selector) {
        return null;
    }
    let el = element;
    while (el) {
        if (el.matches && el.matches(selector)) {
            return el;
        }
        el = el.parentElement;
        if (!el) {
            break;
        }
    }
    return null;
};
/**
 * useRippleEffect function provides wave effect when an element is clicked.
 *
 * @param {boolean} isEnabled - Whether the ripple effect is enabled.
 * @param {RippleOptions} options - Optional configuration for the ripple effect.
 * @returns {RippleEffect} - Ripple effect controller object.
 */
export function useRippleEffect(isEnabled, options) {
    const rippleRef = useRef(null);
    const defaultOptions = {
        duration: 350,
        isCenterRipple: false,
        ignore: null,
        selector: null,
        ...options
    };
    const maxRipples = 2;
    const ignoreRipple = useCallback((target) => {
        if (!isEnabled || closestParent(target, defaultOptions.ignore || '')) {
            return true;
        }
        return false;
    }, [isEnabled, defaultOptions.ignore]);
    const createRipple = useCallback((e) => {
        if (!isEnabled || !rippleRef.current) {
            return;
        }
        let target = e.currentTarget;
        if (defaultOptions.selector) {
            const matchedTarget = closestParent(target, defaultOptions.selector);
            if (!matchedTarget) {
                return;
            }
            target = matchedTarget;
        }
        if (ignoreRipple(target)) {
            return;
        }
        const rect = target.getBoundingClientRect();
        const offsetX = e.pageX - window.pageXOffset;
        const offsetY = e.pageY - window.pageYOffset;
        let rippleX;
        let rippleY;
        let rippleSize;
        if (defaultOptions.isCenterRipple) {
            rippleX = rect.width / 2;
            rippleY = rect.height / 2;
            rippleSize = Math.max(rect.width, rect.height);
        }
        else {
            rippleX = offsetX - rect.left;
            rippleY = offsetY - rect.top;
            const sizeX = Math.max(Math.abs(rect.width - rippleX), rippleX) * 2;
            const sizeY = Math.max(Math.abs(rect.height - rippleY), rippleY) * 2;
            rippleSize = Math.sqrt(sizeX * sizeX + sizeY * sizeY);
        }
        rippleRef.current.createRipple(rippleX, rippleY, rippleSize, defaultOptions.duration || 350, defaultOptions.isCenterRipple || false);
    }, [isEnabled, defaultOptions, ignoreRipple]);
    const Ripple = useCallback(() => (_jsx(RippleContainer, { ref: rippleRef, maxRipples: maxRipples })), []);
    return {
        rippleMouseDown: createRipple,
        Ripple
    };
}
