import {
    forwardRef, useImperativeHandle, useRef, HTMLAttributes, useLayoutEffect, useState, useMemo, memo,
    RefObject, RefAttributes, Ref, ForwardRefExoticComponent, useCallback, KeyboardEvent
} from 'react';
import { preRender, useProviderContext, closest, isNullOrUndefined, Orientation } from '@syncfusion/react-base';
import { ToolbarMultiRow } from './toolbar-multi-row';
import { ToolbarScrollable, ToolbarScrollableRef } from './toolbar-scrollable';
import { ToolbarPopup, ToolbarPopupRef } from './toolbar-popup';
export { Orientation };

/**
 * Specifies the options of Toolbar display mode. Display option is considered when Toolbar content exceeds the available space.
 */
export enum OverflowMode {
    /**
     * All the elements are displayed in a single line with horizontal or vertical scrolling enabled.
     */
    Scrollable = 'Scrollable',

    /**
     * Overflowing elements are moved to the popup. Shows the overflowing Toolbar items when you click the expand button. If the popup content overflows the height of the page, the rest of the elements will be hidden.
     */
    Popup = 'Popup',

    /**
     * Displays the overflowing Toolbar items in multiple rows within the Toolbar, allowing all items to remain visible by wrapping to new lines as needed.
     */
    MultiRow = 'MultiRow',

    /**
     * Hides the overflowing Toolbar items in the next row. Shows the overflowing Toolbar items when you click the expand button.
     */
    Extended = 'Extended'
}

const CLS_TOOLBAR: string = 'sf-toolbar';
const CLS_VERTICAL: string = 'sf-toolbar-vertical';
const CLS_ITEMS: string = 'sf-toolbar-items';
const CLS_RTL: string = 'sf-rtl';
const CLS_TBARSCRLNAV: string = 'sf-hscroll-nav';
const CLS_POPUPNAV: string = 'sf-toolbar-hor-nav';
const CLS_POPUPCLASS: string = 'sf-toolbar-popup-items';
const CLS_EXTENDABLE_TOOLBAR: string = 'sf-toolbar-extended';
const CLS_MULTIROW_TOOLBAR: string = 'sf-toolbar-multirow';
const CLS_EXTENDEDPOPOPEN: string = 'sf-tbar-extended';
const CLS_POPUP_TOOLBAR: string = 'sf-toolbar-popup';

/**
 * Specifies the props for the Toolbar component.
 */
export interface ToolbarProps {
    /**
     * Specifies whether keyboard interaction is enabled within the Toolbar.
     * When set to `true` (default), keyboard navigation is allowed.
     *
     * @default true
     */
    keyboardNavigation?: boolean;

    /**
     * Specifies whether popups adjust their position to avoid overlapping with other elements.
     * This property is applicable only when in `Popup` and `Extended` modes.
     *
     * @default true
     */
    collision?: boolean;

    /**
     * Specifies the layout direction of how the Toolbar items are arranged.
     *
     * The possible values for this property as follows
     * - Horizontal: Arranges Toolbar items in a row from left to right.
     * - Vertical: Stacks Toolbar items in a column from top to bottom.
     *
     * @default Orientation.Horizontal
     */
    orientation?: Orientation;

    /**
     * Specifies the Toolbar display mode when Toolbar content exceeds the viewing area.
     *
     * The possible values for this property as follows
     * - Scrollable: All elements are displayed in a single line with horizontal or vertical scrolling enabled.
     * - Popup: Overflowing elements are moved to the popup. Shows the overflowing Toolbar items when you click the expand button. if the popup content overflows the height of the page, the rest of the elements will be hidden.
     * - MultiRow: Displays the overflowing Toolbar items in multiple rows within the Toolbar, allowing all items to remain visible by wrapping to new lines as needed.
     * - Extended: Hides the overflowing Toolbar items in the next row. Shows the overflowing Toolbar items when you click the expand button.
     *
     * @default OverflowMode.Scrollable
     */
    overflowMode?: OverflowMode;

    /**
     * Specifies the scrolling distance in pixels when the Toolbar items overflow in Scrollable mode.
     * This property is applicable only when the Toolbar is in `Scrollable` mode.
     *
     * @default undefined
     */
    scrollStep?: number;
}

/**
 * Specifies the interface for the Toolbar component.
 */
export interface IToolbar extends ToolbarProps {
    /**
     * Specifies the Toolbar element.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;

    /**
     * Refreshes the Toolbar overflow state and recalculates item visibility.
     * This method should be called when Toolbar content or container dimensions change.
     * Note: This method is not applicable when the Toolbar is in MultiRow mode.
     *
     * @public
     * @returns {void}
     */
    refreshOverflow(): void;
}

interface ElementContext {
    isToolbar: boolean;
    items: HTMLElement[];
    currentIndex: number;
}

type NavigationDirection = 'next' | 'previous' | 'first' | 'last';
type IToolbarProps = ToolbarProps & HTMLAttributes<HTMLDivElement>;

/**
 * The Toolbar component helps users to effectively organize and quickly access frequently used actions.
 * It provides multiple overflow handling modes to accommodate different UI requirements and screen sizes.
 *
 * ```typescript
 * import { Toolbar, ToolbarItem, ToolbarSeparator, ToolbarSpacer, OverflowMode } from "@syncfusion/react-navigations";
 *
 * <Toolbar overflowMode={OverflowMode.Popup} style={{ width: '300px' }}>
 *   <ToolbarItem><Button>Cut</Button></ToolbarItem>
 *   <ToolbarItem><Button>Copy</Button></ToolbarItem>
 *   <ToolbarSeparator />
 *   <ToolbarItem><Button>Paste</Button></ToolbarItem>
 *   <ToolbarSpacer />
 *   <ToolbarItem><Button>Help</Button></ToolbarItem>
 * </Toolbar>
 * ```
 */
export const Toolbar: ForwardRefExoticComponent<IToolbarProps & RefAttributes<IToolbar>> = memo(forwardRef<
IToolbar, IToolbarProps
>((props: IToolbarProps, ref: Ref<IToolbar>) => {
    const {
        keyboardNavigation = true,
        children,
        className = '',
        collision = true,
        orientation = Orientation.Horizontal,
        overflowMode = OverflowMode.Scrollable,
        scrollStep = undefined,
        ...eleAttr
    } = props;

    const toolbarRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const focusItemsRef: RefObject<{ toolbar: HTMLElement[]; popup: HTMLElement[]; }> =
        useRef<{ toolbar: HTMLElement[]; popup: HTMLElement[]; }>({ toolbar: [], popup: [] });
    const focusItemRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const scrollableRef: RefObject<ToolbarScrollableRef | null> = useRef<ToolbarScrollableRef>(null);
    const popupRef: RefObject<ToolbarPopupRef | null> = useRef<ToolbarPopupRef>(null);

    const { dir }: { dir: string } = useProviderContext();

    const [isToolbarRefReady, setIsToolbarRefReady] = useState<boolean>(false);
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);

    const isItemDisabled: (item: HTMLElement) => boolean = useCallback((item: HTMLElement): boolean => {
        return item.hasAttribute('disabled') || item.getAttribute('aria-disabled') === 'true' || item.classList.contains('sf-disabled');
    }, []);

    const findNextEnabledItem: (items: HTMLElement[], startIndex: number, direction: number) => number =
    useCallback((items: HTMLElement[], startIndex: number, direction: number): number => {
        if (!items.length) {return -1; }
        const itemCount: number = items.length;
        let index: number = startIndex;
        let loopCount: number = 0;
        while (loopCount < itemCount) {
            index = (index + direction + itemCount) % itemCount;
            if (!isItemDisabled(items[index as number])) {
                return index;
            }
            loopCount++;
        }
        return -1;
    }, [isItemDisabled]);

    const onOverflowChange: () => void = useCallback((): void => {
        if (keyboardNavigation && toolbarRef.current) {
            const queryElements: (containerClass: string) => HTMLElement[] = (containerClass: string): HTMLElement[] => {
                return toolbarRef.current ? Array.from(toolbarRef.current.querySelectorAll(`.${containerClass} .sf-btn`)) : [];
            };
            focusItemsRef.current.toolbar = queryElements(CLS_ITEMS);

            if (overflowMode === OverflowMode.Extended || overflowMode === OverflowMode.Popup) {
                focusItemsRef.current.popup = queryElements(CLS_POPUPCLASS);
            }

            let focusItemIndex: number = 0;
            if (focusItemRef.current) {
                focusItemIndex = focusItemsRef.current.toolbar.indexOf(focusItemRef.current);
                focusItemIndex = focusItemIndex === -1 ? 0 : focusItemIndex;
            }

            const allItems: HTMLElement[] = [...focusItemsRef.current.toolbar, ...focusItemsRef.current.popup];
            if (focusItemIndex >= 0 && focusItemIndex < allItems.length && isItemDisabled(allItems[focusItemIndex as number])) {
                focusItemIndex = findNextEnabledItem(allItems, -1, 1);
            }

            allItems.forEach((item: HTMLElement, i: number) => {
                item.tabIndex = i === focusItemIndex ? 0 : -1;
                if (i === focusItemIndex) {
                    focusItemRef.current = item;
                }
            });
        }
    }, [keyboardNavigation, overflowMode, isItemDisabled, findNextEnabledItem]);

    const getElementContext: (target: HTMLElement) => ElementContext = useCallback((target: HTMLElement): ElementContext => {
        const isInPopup: boolean = !!closest(target, '.' + CLS_POPUPCLASS);
        return {
            isToolbar: !isInPopup,
            items: isInPopup ? focusItemsRef.current.popup : focusItemsRef.current.toolbar,
            currentIndex: isInPopup ?
                focusItemsRef.current.popup.indexOf(target) :
                focusItemsRef.current.toolbar.indexOf(target)
        };
    }, []);

    const isInPopup: (target: HTMLElement) => boolean = useCallback((target: HTMLElement): boolean => {
        return !isNullOrUndefined(closest(target, '.' + CLS_POPUPCLASS));
    }, []);

    const isPopupNavElement: (target: HTMLElement) => boolean = useCallback((target: HTMLElement): boolean => {
        return !isNullOrUndefined(closest(target, '.' + CLS_POPUPNAV));
    }, []);

    const manageFocus: (newIndex: number, isToolbar: boolean) => void = useCallback((newIndex: number, isToolbar: boolean): void => {
        const items: HTMLElement[] = isToolbar ? focusItemsRef.current.toolbar : focusItemsRef.current.popup;
        if (newIndex > -1 && newIndex < items.length) {
            items.forEach((item: HTMLElement) => {
                item.tabIndex = -1;
            });

            const item: HTMLElement = items[parseInt(newIndex.toString(), 10)];
            item.tabIndex = 0;
            item.focus();

            if (isToolbar) {
                focusItemRef.current = item;
            }
        }
    }, []);

    const navigateItems: (target: HTMLElement, direction: NavigationDirection) => void = useCallback((
        target: HTMLElement, direction: NavigationDirection
    ): void => {
        const { isToolbar, items, currentIndex }: ElementContext = getElementContext(target);
        if (!items.length) {return; }
        let newIndex: number;
        switch (direction) {
        case 'next':
            newIndex = findNextEnabledItem(items, currentIndex, 1);
            break;
        case 'previous':
            newIndex = findNextEnabledItem(items, currentIndex, -1);
            break;
        case 'first':
            newIndex = findNextEnabledItem(items, -1, 1);
            break;
        case 'last':
            newIndex = findNextEnabledItem(items, items.length, -1);
            break;
        }

        if (newIndex !== -1) {
            manageFocus(newIndex, isToolbar);
        }
    }, [getElementContext, manageFocus, findNextEnabledItem]);

    const handleHorizontalNavigation: (target: HTMLElement, key: string) => void = useCallback((target: HTMLElement, key: string): void => {
        if (orientation === Orientation.Horizontal) {
            const isNavButton: boolean = target.classList.contains(CLS_POPUPNAV);
            const isScrollButton: boolean = target.classList.contains(CLS_TBARSCRLNAV);

            if (key === 'ArrowRight' && toolbarRef.current === target) {
                manageFocus(0, true);
                return;
            }

            if ((key === 'ArrowRight' || key === 'ArrowLeft') && !isNavButton && !isScrollButton) {
                const direction: NavigationDirection = key === 'ArrowRight' ? 'next' : 'previous';
                navigateItems(target, direction);
            }
        }
    }, [manageFocus, navigateItems, orientation]);

    const handleVerticalNavigation: (target: HTMLElement, key: string) => void = useCallback((target: HTMLElement, key: string): void => {
        const isVerticalMode: boolean = orientation === Orientation.Vertical;
        const inPopup: boolean = isInPopup(target);
        const isPopupNav: boolean = isPopupNavElement(target);

        if (key === 'ArrowUp' && !isPopupNav && (isVerticalMode || inPopup)) {
            navigateItems(target, 'previous');
        } else if (key === 'ArrowDown') {
            if (isPopupNav && isPopupVisible && focusItemsRef.current.popup.length > 0) {
                manageFocus(0, false);
            } else if (isVerticalMode || inPopup) {
                navigateItems(target, 'next');
            }
        }
    }, [isInPopup, isPopupNavElement, isPopupVisible, manageFocus, navigateItems, orientation]);

    const handleEdgeNavigation: (target: HTMLElement, key: string) => void = useCallback((target: HTMLElement, key: string): void => {
        const direction: NavigationDirection = key === 'Home' ? 'first' : 'last';
        navigateItems(target, direction);
    }, [navigateItems]);

    const handleTabNavigation: (target: HTMLElement) => void = useCallback((target: HTMLElement): void => {
        const isNavButton: boolean = target.classList.contains(CLS_POPUPNAV);
        const isScrollButton: boolean = target.classList.contains(CLS_TBARSCRLNAV);
        const toolbarElement: HTMLDivElement | null = toolbarRef.current;

        if (!isScrollButton && !isNavButton && toolbarElement === target && focusItemsRef.current.toolbar) {
            if (focusItemRef.current && !isItemDisabled(focusItemRef.current)) {
                focusItemRef.current.focus();
            } else {
                const firstEnabledIndex: number = findNextEnabledItem(focusItemsRef.current.toolbar, -1, 1);
                if (firstEnabledIndex !== -1) {
                    manageFocus(firstEnabledIndex, true);
                }
            }
        }
    }, [manageFocus, isItemDisabled, findNextEnabledItem]);

    const handleEnterKey: (target: HTMLElement) => void = useCallback((target: HTMLElement): void => {
        const isNavButton: boolean = target.classList.contains(CLS_POPUPNAV);

        if (isNavButton) {
            setIsPopupVisible((prevState: boolean) => !prevState);
        }
    }, []);

    const handleEscapeKey: () => void = useCallback((): void => {
        if (overflowMode === OverflowMode.Popup && isPopupVisible) {
            setIsPopupVisible(false);
        }
    }, [isPopupVisible, overflowMode]);

    const keyActionHandler: (e: KeyboardEvent<HTMLElement>) => void = useCallback((e: KeyboardEvent<HTMLElement>): void => {
        if (!toolbarRef.current || !keyboardNavigation || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
            return;
        }

        const target: HTMLElement = e.target as HTMLElement;
        e.preventDefault();

        const keyHandlers: Record<string, () => void> = {
            ArrowRight: () => handleHorizontalNavigation(target, e.key),
            ArrowLeft: () => handleHorizontalNavigation(target, e.key),
            ArrowUp: () => handleVerticalNavigation(target, e.key),
            ArrowDown: () => handleVerticalNavigation(target, e.key),
            Home: () => handleEdgeNavigation(target, e.key),
            End: () => handleEdgeNavigation(target, e.key),
            Tab: () => handleTabNavigation(target),
            Enter: () => handleEnterKey(target),
            Escape: () => handleEscapeKey()
        };

        const handler: (() => void) | undefined = keyHandlers[e.key];
        if (handler) {
            handler();
        }
    }, [
        keyboardNavigation,
        handleHorizontalNavigation,
        handleVerticalNavigation,
        handleEdgeNavigation,
        handleTabNavigation,
        handleEnterKey,
        handleEscapeKey
    ]);

    const handleDocKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void = useCallback((e: KeyboardEvent<HTMLDivElement>): void => {
        if (!keyboardNavigation || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
            return;
        }

        const popupCheck: boolean = overflowMode === OverflowMode.Popup && isPopupVisible;
        if (e.key === 'Tab' && (e.target as HTMLElement).classList.contains(CLS_POPUPNAV) && popupCheck) {
            setIsPopupVisible(false);
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'End' || e.key === 'Home') {
            e.preventDefault();
        }
    }, [keyboardNavigation, overflowMode, isPopupVisible]);

    const handlePopupStateChange: (isOpen: boolean) => void = useCallback((isOpen: boolean) => {
        setIsPopupVisible(isOpen);
    }, []);

    const refreshOverflow: () => void = useCallback((): void => {
        if (overflowMode === OverflowMode.Scrollable && scrollableRef.current) {
            scrollableRef.current.refreshOverflow();
        } else if ((overflowMode === OverflowMode.Popup || overflowMode === OverflowMode.Extended) && popupRef.current) {
            popupRef.current.refreshOverflow();
        }
    }, [overflowMode]);

    useLayoutEffect(() => {
        preRender('toolbar');
        setIsToolbarRefReady(true);
    }, []);

    const classes: string = useMemo(() => {
        const classArray: string[] = ['sf-control', CLS_TOOLBAR, 'sf-lib'];
        if (dir === 'rtl') {
            classArray.push(CLS_RTL);
        }
        switch (overflowMode) {
        case OverflowMode.MultiRow:
            classArray.push(CLS_MULTIROW_TOOLBAR);
            break;
        case OverflowMode.Popup:
            classArray.push(CLS_POPUP_TOOLBAR);
            break;
        case OverflowMode.Extended:
            classArray.push(CLS_EXTENDABLE_TOOLBAR);
            if (isPopupVisible) {
                classArray.push(CLS_EXTENDEDPOPOPEN);
            }
            break;
        }
        if (orientation === Orientation.Vertical) {
            classArray.push(CLS_VERTICAL);
        }
        if (className) {
            classArray.push(className);
        }
        return classArray.join(' ');
    }, [className, dir, orientation, isPopupVisible, overflowMode]);

    const publicAPI: Partial<IToolbar> = {
        keyboardNavigation,
        collision,
        orientation,
        overflowMode,
        scrollStep
    };

    useImperativeHandle(ref, () => {
        return {
            ...publicAPI as IToolbar,
            refreshOverflow: refreshOverflow,
            element: toolbarRef.current
        };
    });

    return (
        <div
            ref={toolbarRef}
            className={classes}
            role='toolbar'
            aria-orientation={orientation.toLowerCase() as 'horizontal' | 'vertical'}
            onKeyDown={handleDocKeyDown}
            onKeyUp={keyActionHandler}
            {...eleAttr}
        >
            {(() => {
                switch (overflowMode) {
                case OverflowMode.Scrollable:
                    return (
                        <ToolbarScrollable
                            key={`scrollable-${orientation}-toolbar`}
                            ref={scrollableRef}
                            toolbarRef={toolbarRef}
                            orientation={orientation}
                            scrollStep={scrollStep}
                            onOverflowChange={onOverflowChange}
                            className={className}
                        >
                            {children}
                        </ToolbarScrollable>
                    );
                case OverflowMode.MultiRow:
                    return (
                        <ToolbarMultiRow onOverflowChange={onOverflowChange}>
                            {children}
                        </ToolbarMultiRow>
                    );
                case OverflowMode.Popup:
                case OverflowMode.Extended:
                    return (
                        <ToolbarPopup
                            key={`${overflowMode === OverflowMode.Popup ? 'popup' : 'extended'}-${orientation}-toolbar`}
                            ref={popupRef}
                            toolbarRef={toolbarRef}
                            isToolbarRefReady={isToolbarRefReady}
                            orientation={orientation}
                            overflowMode={overflowMode}
                            collision={collision}
                            isPopupVisible={isPopupVisible}
                            onPopupOpenChange={handlePopupStateChange}
                            onOverflowChange={onOverflowChange}
                            className={className}
                        >
                            {children}
                        </ToolbarPopup>
                    );
                }
            })()}
        </div>
    );
}));
Toolbar.displayName = 'Toolbar';
export default Toolbar;
