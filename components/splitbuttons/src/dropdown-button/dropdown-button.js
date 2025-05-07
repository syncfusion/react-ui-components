import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Popup, CollisionType } from '@syncfusion/react-popups';
import { Button, IconPosition } from '@syncfusion/react-buttons';
import { useProviderContext, preRender, SvgIcon, Animation } from '@syncfusion/react-base';
import * as React from 'react';
/**
 * The DropDownButton component is an interactive button that reveals a menu of actions or options when clicked, providing a dropdown interface for intuitive user interaction.
 *
 * ```typescript
 * <DropDownButton items={menuItems} icon={profileIcon} iconPosition={IconPosition.Right}/>
 * ```
 */
export const DropDownButton = forwardRef((props, ref) => {
    const { children, className = '', icon, iconPosition = IconPosition.Left, items = [], popupWidth = 'auto', animation = { duration: 400, timingFunction: 'ease' }, disabled = false, lazyOpen = false, itemTemplate, target, relateTo, color, variant, size, onClose, onOpen, onSelect, ...domProps } = props;
    const buttonRef = useRef(null);
    const popupRef = useRef(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [menuItems, setMenuItems] = useState(items);
    const { dir } = useProviderContext();
    const caretIcon = 'M5 8.5L12 15.5L19 8.5';
    const isMounted = useRef(true);
    const updateMenuItems = (items, setMenuItems) => {
        if (isMounted) {
            setMenuItems((prevItems) => {
                const isDifferent = items.length !== prevItems.length || items.some((item, index) => {
                    const prevItem = prevItems[index];
                    return (item.id !== prevItem?.id ||
                        item.text !== prevItem?.text ||
                        item.url !== prevItem?.url ||
                        item.disabled !== prevItem?.disabled ||
                        typeof item.icon === 'string' ? item.icon !== prevItem?.icon : !React.isValidElement(item.icon));
                });
                return isDifferent ? items : prevItems;
            });
        }
    };
    useEffect(() => {
        updateMenuItems(items, setMenuItems);
        return () => {
            isMounted.current = false;
        };
    }, [items]);
    useEffect(() => {
        preRender('dropDownButton');
    }, []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            const buttonElement = buttonRef.current?.element;
            const popupElement = popupRef.current?.element;
            const targetNode = event.target;
            if (buttonElement && popupElement) {
                if (!buttonElement.contains(targetNode) && !popupElement.contains(targetNode)) {
                    setIsPopupOpen(false);
                    if (onClose && isPopupOpen) {
                        onClose(event);
                    }
                }
            }
        };
        if (isPopupOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        const handleKeyDown = (event) => {
            if (!isPopupOpen || !popupRef.current) {
                return;
            }
            const popupElement = popupRef.current?.element;
            const ul = popupElement?.querySelector('ul');
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const isDownKey = event.key === 'ArrowDown';
                upDownKeyHandler(ul, isDownKey);
            }
            if (event.key === 'Escape') {
                setIsPopupOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPopupOpen, onClose, menuItems]);
    const publicAPI = {
        iconPosition,
        icon,
        target,
        popupWidth,
        items,
        lazyOpen,
        relateTo,
        itemTemplate,
        color,
        variant,
        size
    };
    const animationOptions = animation?.name !== undefined ? {
        name: animation.name,
        duration: animation.duration,
        timingFunction: animation.timingFunction
    } : null;
    const togglePopup = (event) => {
        if (!isPopupOpen) {
            if (animationOptions) {
                const animationInstance = Animation(animationOptions);
                if (animationInstance.animate) {
                    const popupElement = popupRef.current?.element?.children[0];
                    if (popupElement) {
                        animationInstance.animate(popupElement, {
                            begin: (args) => {
                                const element = args?.element;
                                if (element && element.parentElement) {
                                    const parent = element.parentElement;
                                    const originalDisplay = parent.style.display;
                                    parent.style.display = 'block';
                                    parent.style.maxHeight = parent.offsetHeight + 'px';
                                    parent.style.display = originalDisplay;
                                }
                            }
                        });
                    }
                }
            }
            setIsPopupOpen(true);
            if (onOpen) {
                onOpen(event);
            }
        }
        else {
            setIsPopupOpen(false);
            if (onClose) {
                onClose(event);
            }
        }
    };
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        toggle: togglePopup,
        element: buttonRef.current?.element
    }), [publicAPI]);
    const itemClickHandler = (item, event) => {
        if (item.disabled) {
            return;
        }
        setIsPopupOpen(false);
        if (onSelect) {
            const args = {
                event,
                item
            };
            onSelect(args);
        }
    };
    const renderItemContent = React.useCallback((item) => {
        if (typeof itemTemplate === 'function') {
            return itemTemplate(item);
        }
        if (typeof itemTemplate === 'string') {
            return _jsx("div", { children: itemTemplate });
        }
        return (_jsxs(_Fragment, { children: [item.icon && typeof item.icon === 'string' && (_jsx("span", { className: `sf-menu-icon ${item.icon}` })), item.icon && typeof item.icon !== 'string' && (_jsx("span", { className: 'sf-menu-icon', children: item.icon })), _jsx("span", { children: item.text })] }));
    }, [itemTemplate]);
    const handleItemClick = React.useCallback((item, event) => {
        event.stopPropagation();
        itemClickHandler(item, event);
    }, [itemClickHandler]);
    const renderItems = React.useCallback(() => (_jsx("ul", { role: 'menu', tabIndex: 0, "aria-label": 'dropdown menu', children: menuItems.map((item, index) => {
            const liClassName = `sf-item ${item.hasSeparator ? 'sf-separator' : ''} ${item.disabled ? 'sf-disabled' : ''}`;
            return (_jsx("li", { className: liClassName, role: item.hasSeparator ? 'separator' : 'menuitem', "aria-label": item.text, "aria-disabled": item.disabled ? 'true' : 'false', onClick: item.disabled && item.hasSeparator ? undefined :
                    (event) => handleItemClick(item, event), children: !item.hasSeparator && renderItemContent(item) }, item.id || `item-${index}`));
        }) })), [menuItems, renderItemContent, handleItemClick]);
    const upDownKeyHandler = (ul, isDownKey) => {
        const items = Array.from(ul.children);
        const currentIdx = items.findIndex((item) => item.classList.contains('sf-focused'));
        items.forEach((item) => {
            item.classList.remove('sf-selected', 'sf-focused');
        });
        const itemsCount = items.length;
        let nextIdx;
        if (currentIdx === -1) {
            nextIdx = isDownKey ? 0 : itemsCount - 1;
        }
        else {
            nextIdx = isDownKey ? currentIdx + 1 : currentIdx - 1;
            if (nextIdx < 0) {
                nextIdx = itemsCount - 1;
            }
            else if (nextIdx >= itemsCount) {
                nextIdx = 0;
            }
        }
        let tries = 0;
        while ((items[nextIdx].classList.contains('sf-disabled') ||
            items[nextIdx].classList.contains('sf-separator')) &&
            tries < itemsCount) {
            nextIdx = isDownKey
                ? (nextIdx + 1) % itemsCount
                : (nextIdx - 1 + itemsCount) % itemsCount;
            tries++;
        }
        const nextItem = items[nextIdx];
        nextItem.classList.add('sf-focused');
        nextItem.focus();
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Button, { ref: buttonRef, className: `${className} sf-dropdown-btn`, icon: icon, color: color, variant: variant, size: size, iconPosition: iconPosition, disabled: disabled, onClick: (event) => {
                    event.preventDefault();
                    togglePopup(event);
                }, "aria-haspopup": 'true', "aria-expanded": isPopupOpen ? 'true' : 'false', ...domProps, children: [children, _jsx("span", { className: `sf-btn-icon sf-icons sf-icon-${iconPosition === 'Top' ? 'bottom' : 'right'} sf-caret`, children: _jsx(SvgIcon, { fill: 'currentColor', width: '16', height: '16', viewBox: "0 0 20 25", d: caretIcon }) })] }), (isPopupOpen || !lazyOpen) && (_jsx(Popup, { isOpen: isPopupOpen, ref: popupRef, targetRef: target || buttonRef.current, relateTo: relateTo || buttonRef.current?.element, position: { X: 'left', Y: 'bottom' }, showAnimation: animation, collision: (dir === 'rtl') ? { X: CollisionType.Fit, Y: CollisionType.Flip } : { X: CollisionType.Flip, Y: CollisionType.Flip }, width: popupWidth, className: `sf-dropdown-popup ${popupWidth !== 'auto' ? 'sfdropdown-popup-width' : ''}`, onClose: () => setIsPopupOpen(false), children: renderItems() }))] }));
});
export default React.memo(DropDownButton);
