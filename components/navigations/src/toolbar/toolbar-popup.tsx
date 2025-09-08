import {
    useRef, HTMLAttributes, useMemo, RefObject, useCallback, useEffect, useLayoutEffect, useState, Children, isValidElement, ReactNode,
    cloneElement, ReactElement, CSSProperties, ForwardRefExoticComponent, RefAttributes, memo, forwardRef, Ref, useImperativeHandle
} from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@syncfusion/react-icons';
import { isVisible, closest, useProviderContext } from '@syncfusion/react-base';
import { Popup, IPopup, CollisionType } from '@syncfusion/react-popups';
import { OverflowMode, Orientation } from './toolbar';
import { ToolbarItem, IToolbarItem } from './toolbar-item';
import { ToolbarSeparator, IToolbarSeparator } from './toolbar-separator';
import { ToolbarSpacer, IToolbarSpacer } from './toolbar-spacer';

const CLS_ITEMS: string = 'sf-toolbar-items';
const CLS_POPUPICON: string = 'sf-popup-up-icon';
const CLS_POPUPDOWN: string = 'sf-popup-down-icon';
const CLS_POPUPOPEN: string = 'sf-popup-open';
const CLS_POPUPNAV: string = 'sf-toolbar-hor-nav';
const CLS_TBARNAVACT: string = 'sf-nav-active';
const CLS_POPUPCLASS: string = 'sf-toolbar-popup-items';
const CLS_HIDDEN_POPUP: string = 'sf-hidden-popup';
const CLS_EXTENDABLE_CLASS: string = 'sf-toolbar-extended-items';
const CLS_EXTENDPOPUP: string = 'sf-extended-nav';
const CLS_OVERFLOW: string = 'sf-toolbar-popup-overflow';
const CLS_SEPARATOR: string = 'sf-toolbar-separator';
const CLS_SPACER: string = 'sf-toolbar-spacer';
const CLS_ITEM: string = 'sf-toolbar-item';
const CLS_ICON: string = 'sf-toolbar-popup-icon sf-icon';

/**
 * Specifies the props for the ToolbarPopup component.
 * @private
 */
export interface ToolbarPopupProps {
    /**
     * Specifies the reference to the toolbar element.
     * Used to access the toolbar DOM element for measurements and positioning.
     *
     * @default null
     */
    toolbarRef: RefObject<HTMLDivElement | null>;

    /**
     * Specifies the layout direction of toolbar items.
     *
     * The possible values are:
     * - Horizontal: Arranges Toolbar items in a row from left to right.
     * - Vertical: Stacks Toolbar items in a column from top to bottom.
     *
     * @default Orientation.Horizontal
     */
    orientation: Orientation;

    /**
     * Specifies whether the Toolbar reference is ready.
     * This property indicates if the toolbar element has been properly initialized.
     *
     * @default false
     */
    isToolbarRefReady: boolean;

    /**
     * Specifies the Toolbar display mode for overflow content.
     * This property determines how overflowing items are handled (Popup or Extended).
     *
     * @default OverflowMode.Popup
     */
    overflowMode: OverflowMode;

    /**
     * Specifies whether popups adjust their position to avoid overlapping with other elements.
     * This property is applicable only when in `Popup` mode.
     *
     * @default true
     */
    collision?: boolean;

    /**
     * Specifies the visibility state of the popup externally.
     * When true, the popup is displayed; otherwise, it's hidden.
     *
     * @default false
     */
    isPopupVisible: boolean;

    /**
     * Specifies the callback function triggered when the popup's open/close state changes.
     * This function is called with the updated state whenever the popup visibility changes.
     *
     * @param isOpen boolean value indicating whether the popup is open (true) or closed (false)
     */
    onPopupOpenChange: (isOpen: boolean) => void;

    /**
     * Specifies the callback function triggered when the overflow state changes.
     * This function is called to set up proper keyboard navigation for toolbar items.
     */
    onOverflowChange: () => void;
}

/**
 * Specifies the reference interface for the ToolbarPopup component.
 * @private
 */
export interface ToolbarPopupRef {
    /**
     * Specifies the method to refresh the overflow calculation for popup toolbar items.
     * This method recalculates which items should be visible in the toolbar
     * and which should be moved to the popup based on current dimensions and content.
     */
    refreshOverflow: () => void;
}

type IToolbarPopupProps = ToolbarPopupProps & HTMLAttributes<HTMLDivElement>;
type IToolbarSeparatorProps = IToolbarSeparator & HTMLAttributes<HTMLDivElement>;
type IToolbarSpacerProps = IToolbarSpacer & HTMLAttributes<HTMLDivElement>;
type IToolbarItemProps = IToolbarItem & HTMLAttributes<HTMLDivElement>;
type IToolbarItems = ReactElement<IToolbarItemProps | IToolbarSeparatorProps | IToolbarSpacerProps>;

/**
 * ToolbarPopup component that renders the overflowing toolbar items in the popup.
 *
 * This component manages the display of toolbar items that don't fit in the available space
 * by moving them to a popup. It supports both Popup and Extended overflow modes and
 * automatically calculates which items should be visible in the toolbar and which should
 * be moved to the popup based on available space.
 */
const ToolbarPopup: ForwardRefExoticComponent<IToolbarPopupProps & RefAttributes<ToolbarPopupRef>> = memo(forwardRef<
ToolbarPopupRef, IToolbarPopupProps
>((props: IToolbarPopupProps, ref: Ref<ToolbarPopupRef>) => {
    const {
        toolbarRef,
        orientation,
        overflowMode,
        isToolbarRefReady,
        children,
        className,
        collision,
        isPopupVisible,
        onPopupOpenChange,
        onOverflowChange
    } = props;

    const getItems: (items: ReactNode) => IToolbarItems[] = useCallback((items: ReactNode): IToolbarItems[] => {
        return Children.toArray(items)
            .filter((child: ReactNode): child is IToolbarItems =>
                isValidElement(child) && (child.type === ToolbarItem || child.type === ToolbarSeparator || child.type === ToolbarSpacer)
            )
            .map((child: IToolbarItems, index: number) =>
                cloneElement(child, { key: child.key || index })
            );
    }, []);

    const resizeObserverRef: RefObject<ResizeObserver | null> = useRef<ResizeObserver | null>(null);
    const previousChildrenCountRef: RefObject<number> = useRef<number>(Children.count(children));
    const itemsRef: RefObject<IToolbarItems[]> = useRef<IToolbarItems[]>(getItems(children));
    const toolbarItemsRef: RefObject<IToolbarItems[]> = useRef<IToolbarItems[]>([...itemsRef.current]);
    const popupItemsRef: RefObject<IToolbarItems[]> = useRef<IToolbarItems[]>([]);
    const popupNavRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const popupRef: RefObject<IPopup | null> = useRef<IPopup>(null);

    const { dir }: { dir: string } = useProviderContext();

    const [toolbarItems, setToolbarItems] = useState<IToolbarItems[]>([...toolbarItemsRef.current]);
    const [popupItems, setPopupItems] = useState<IToolbarItems[]>([]);
    const [hasInitialRenderCompleted, setHasInitialRenderCompleted] = useState<boolean>(false);
    const [isPopupOpen, setIsPopupOpen] = useState(isPopupVisible);
    const [isPopupRefresh, setIsPopupRefresh] = useState<boolean>(false);
    const [popupStyles, setPopupStyles] = useState<CSSProperties>({ maxHeight: '' });

    const getEleWidth: (item: HTMLElement | null) => number = useCallback((item: HTMLElement | null): number => {
        let width: number = 0;
        if (item) {
            width = orientation === Orientation.Vertical ? item.offsetHeight : item.offsetWidth;
        }
        return width;
    }, [orientation]);

    const getEleLeft: (item: HTMLElement | null) => number = useCallback((item: HTMLElement | null): number => {
        let width: number = 0;
        if (item) {
            width = orientation === Orientation.Vertical ? item.offsetTop : item.offsetLeft;
        }
        return width;
    }, [orientation]);

    const getPopupNavOffset: () => number = useCallback((): number => {
        if (popupNavRef.current) {
            return getEleWidth(popupNavRef.current);
        }
        return orientation === Orientation.Horizontal ? 40 : 48;
    }, [getEleWidth, orientation]);

    const getElementOffsetY: () => number = useCallback((): number => {
        return toolbarRef.current ? toolbarRef.current.offsetHeight : 0;
    }, [overflowMode]);

    const getToolbarPopupWidth: () => number = useCallback((): number => {
        let toolbarWidth: number = 0;
        if (toolbarRef.current) {
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(toolbarRef.current);
            const width: number = parseFloat(computedStyle.width);
            const borderRightWidth: number = parseFloat(computedStyle.borderRightWidth);
            toolbarWidth = width + (borderRightWidth * 2);
        }
        return toolbarWidth;
    }, []);

    const onPopupOpen: () => void = useCallback((): void => {
        if (toolbarRef.current && popupRef.current?.element) {
            const popupElement: HTMLElement = popupRef.current.element;
            const toolbarElement: HTMLElement | null = toolbarRef.current;
            const popupElementPos: number = popupElement.offsetTop + popupElement.offsetHeight +
                (toolbarElement.getBoundingClientRect().top || 0);
            const scrollVal: number = window.scrollY || 0;
            if (orientation === Orientation.Horizontal && (window.innerHeight + scrollVal) < popupElementPos &&
                toolbarElement.offsetTop < popupElement.offsetHeight && overflowMode === OverflowMode.Popup) {
                let overflowHeight: number = (popupElement.offsetHeight - ((popupElementPos - window.innerHeight - scrollVal) + 5));
                for (let i: number = 0; i < popupElement.childElementCount; i++) {
                    const ele: HTMLElement = popupElement.children[parseInt(i.toString(), 10)] as HTMLElement;
                    if (ele.offsetTop + ele.offsetHeight > overflowHeight) {
                        overflowHeight = ele.offsetTop;
                        break;
                    }
                }
                setPopupStyles((prevStyles: CSSProperties) => ({ ...prevStyles, maxHeight: `${overflowHeight}px` }));
            } else if (orientation === Orientation.Vertical) {
                const tbEleData: DOMRect = toolbarElement.getBoundingClientRect();
                setPopupStyles((prevStyles: CSSProperties) => ({
                    ...prevStyles,
                    maxHeight: `${tbEleData.top + toolbarElement.offsetHeight}px`,
                    bottom: '0'
                }));
            }
        }
    }, [overflowMode, orientation]);

    const onPopupClose: () => void = useCallback((): void => {
        setIsPopupOpen(false);
        setPopupStyles({ maxHeight: '' });
    }, []);

    const updateOverflowItems: (itemsElement: HTMLElement | null) => void = useCallback((itemsElement: HTMLElement | null): void => {
        if (toolbarRef.current && itemsElement && isVisible(toolbarRef.current)) {
            const toolbarItemsData: IToolbarItems[] = [...toolbarItems];
            const popupItemsData: IToolbarItems[] = [...popupItems];
            const items: HTMLElement[] = Array.from(itemsElement.children) as HTMLElement[];
            const toolbarWidth: number = getEleWidth(toolbarRef.current);
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(itemsElement);
            const padding: number = parseInt(orientation === Orientation.Vertical ?
                computedStyle.paddingTop : computedStyle.paddingLeft, 10);

            if (dir === 'rtl' && orientation === Orientation.Horizontal) {
                const itemsGap: number = parseInt(computedStyle.gap, 10) || 0;
                const totalItems: number = items.length;
                let totalRequiredWidth: number = 0;

                items.forEach((item: HTMLElement) => {
                    totalRequiredWidth += getEleWidth(item);
                });

                totalRequiredWidth += (padding * 2) + (itemsGap * (totalItems - 1));

                const isOverflow: boolean = totalRequiredWidth > toolbarWidth;
                const popupNavWidth: number = popupItemsData.length > 0 || isOverflow ? getPopupNavOffset() : 0;
                const availableToolbarWidth: number = toolbarWidth - popupNavWidth;

                if (totalRequiredWidth > availableToolbarWidth) {
                    let requiredWidth: number = totalRequiredWidth;

                    for (let i: number = totalItems - 1; i >= 0; i--) {
                        const item: HTMLElement = items[parseInt(i.toString(), 10)];

                        if (requiredWidth > availableToolbarWidth || item.classList.contains(CLS_SEPARATOR)) {
                            const itemWidth: number = getEleWidth(item);
                            requiredWidth -= (itemWidth + ((i === 0) ? 0 : itemsGap));

                            popupItemsData.unshift(toolbarItemsData[parseInt(i.toString(), 10)]);
                            toolbarItemsData.pop();
                        } else {
                            break;
                        }
                    }
                }
            } else {
                let itemWidth: number = getEleWidth(items[items.length - 1]);
                let itemLeft: number = getEleLeft(items[items.length - 1]);
                const isOverflow: boolean = itemLeft + itemWidth + padding > toolbarWidth;
                const popupNavWidth: number = popupItemsData.length > 0 || isOverflow ? getPopupNavOffset() : 0;
                const availableWidth: number = toolbarWidth - popupNavWidth;

                for (let i: number = items.length - 1; i >= 0; i--) {
                    const item: HTMLElement = items[parseInt(i.toString(), 10)];
                    itemWidth = getEleWidth(item);
                    itemLeft = getEleLeft(item);
                    const isItemOverflow: boolean = (itemLeft + itemWidth + padding > availableWidth);

                    if (isItemOverflow || item.classList.contains(CLS_SEPARATOR)) {
                        popupItemsData.unshift(toolbarItemsData[parseInt(i.toString(), 10)]);
                        toolbarItemsData.pop();
                    } else {
                        break;
                    }
                }
            }
            toolbarItemsRef.current = toolbarItemsData;
            popupItemsRef.current = popupItemsData;
        }
    }, [orientation, getEleWidth, getEleLeft, getPopupNavOffset, toolbarItems, popupItems, dir]);

    const setItems: () => void = useCallback((): void => {
        if (toolbarItems !== toolbarItemsRef.current) {
            setToolbarItems((prev: IToolbarItems[]) => prev.length !== toolbarItemsRef.current.length ?
                [...toolbarItemsRef.current] : prev
            );
            setPopupItems((prev: IToolbarItems[]) => prev.length !== popupItemsRef.current.length ? [...popupItemsRef.current] : prev);
        }
    }, [toolbarItems]);

    const resize: () => void = useCallback((): void => {
        if (toolbarRef.current && !isPopupRefresh) {
            const toolbarItems: HTMLElement = toolbarRef.current.querySelector(`.${CLS_ITEMS}`) as HTMLElement;
            if (overflowMode === OverflowMode.Popup) {
                setIsPopupOpen((prevState: boolean) => prevState ? false : prevState);
            }
            updateOverflowItems(toolbarItems);
            setItems();
            setIsPopupRefresh(popupItemsRef.current.length > 0 ? true : false);
        }
    }, [updateOverflowItems, isPopupRefresh, setItems, overflowMode]);

    const resizeRef: RefObject<() => void> = useRef<() => void>(resize);

    useLayoutEffect(() => {
        resizeRef.current = resize;
    }, [resize]);

    const getItemsWidth: (itemsElement: HTMLElement) => number = useCallback((itemsElement: HTMLElement): number => {
        let totalWidth: number = 0;
        if (itemsElement) {
            const items: HTMLElement[] = Array.from(itemsElement.children) as HTMLElement[];
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(itemsElement);
            const itemsGap: number = parseInt(computedStyle.gap, 10) || 0;
            const itemPadding: number =
                parseInt((orientation === Orientation.Vertical ? computedStyle.paddingTop : computedStyle.paddingLeft), 10);

            items.forEach((item: HTMLElement) => {
                totalWidth += (item.classList.contains(CLS_SPACER) ? 0 : getEleWidth(item)) + itemsGap;
            });

            if (items.length > 0) {
                totalWidth -= itemsGap;
            }
            totalWidth += (itemPadding * 2);
        }
        return totalWidth;
    }, [getEleWidth, orientation]);

    const popupEleRefresh: (availableSpace: number, popup: HTMLElement) => void = useCallback((
        availableSpace: number, popup: HTMLElement
    ): void => {
        const popupItemElements: HTMLElement[] = [].slice.call(popup.querySelectorAll(`.${CLS_ITEM}`));
        const toolbarItemsData: IToolbarItems[] = [...toolbarItems];
        const popupItemsData: IToolbarItems[] = [...popupItems];
        const itemsElement: HTMLElement = toolbarRef.current?.querySelector(`.${CLS_ITEMS}`) as HTMLElement;
        const itemsGap: number = parseInt(window.getComputedStyle(itemsElement).gap, 10) || 0;

        for (let i: number = 0; i < popupItemElements.length; i++) {
            const item: HTMLElement = popupItemElements[parseInt(i.toString(), 10)];
            const isSpacer: boolean = item.classList.contains(CLS_SPACER);
            const hasToolbarItems: boolean = toolbarItemsData.length > 0;
            const itemWidth: number = (isSpacer ? 0 : getEleWidth(item)) + (hasToolbarItems ? itemsGap : 0);
            let isSpaceAvailable: boolean = availableSpace > itemWidth;

            if (isSpacer || item.classList.contains(CLS_SEPARATOR)) {
                let nextItemWidth: number = itemWidth;
                let j: number = i + 1;

                while (j < popupItemElements.length) {
                    const nextItem: HTMLElement = popupItemElements[parseInt(j.toString(), 10)];
                    const isNextSpacer: boolean = nextItem.classList.contains(CLS_SPACER);
                    nextItemWidth += (isNextSpacer ? 0 : getEleWidth(nextItem)) + (hasToolbarItems ? itemsGap : 0);

                    if (!nextItem.classList.contains(CLS_SPACER) && !nextItem.classList.contains(CLS_SEPARATOR)) {
                        break;
                    }
                    j++;
                }

                isSpaceAvailable = availableSpace > nextItemWidth;
            }

            if (isSpaceAvailable) {
                toolbarItemsData.push(popupItemsData[0]);
                popupItemsData.shift();
                availableSpace -= itemWidth;
            } else {
                break;
            }
        }
        toolbarItemsRef.current = toolbarItemsData;
        popupItemsRef.current = popupItemsData;
    }, [getEleWidth, toolbarItems, popupItems]);

    const popupRefresh: () => void = useCallback((): void => {
        if (toolbarRef.current && popupRef.current?.element) {
            const itemsElement: HTMLElement = toolbarRef.current.querySelector(`.${CLS_ITEMS}`) as HTMLElement;
            const itemsElementWidth: number = getEleWidth(itemsElement);
            const itemsWidth: number = getItemsWidth(itemsElement);
            const availableSpace: number = itemsElementWidth - itemsWidth;
            const itemsGap: number = parseInt(window.getComputedStyle(itemsElement).gap, 10) || 0;
            const popupItemWidth: number = getEleWidth(popupRef.current.element.querySelector(`.${CLS_ITEM}`)) + itemsGap;
            const isSpaceAvailable: boolean = availableSpace > popupItemWidth;

            const popupElements: HTMLElement[] = [].slice.call(popupRef.current.element.querySelectorAll(`.${CLS_ITEM}`));
            let popupItemsWidth: number = 0;
            popupElements.forEach((item: HTMLElement) => {
                popupItemsWidth += item.classList.contains(CLS_SPACER) ? 0 : getEleWidth(item);
            });
            popupItemsWidth += (popupElements.length * itemsGap);
            const isResetToDefault: boolean = (availableSpace + getPopupNavOffset()) > popupItemsWidth;

            if (isResetToDefault) {
                toolbarItemsRef.current = [...itemsRef.current];
                popupItemsRef.current = [];
            } else if (isSpaceAvailable) {
                popupEleRefresh(availableSpace, popupRef.current.element);
            }
        }
    }, [getEleWidth, getItemsWidth, popupEleRefresh]);

    const onPopupClick: () => void = useCallback((): void => {
        if (overflowMode === OverflowMode.Popup && isPopupOpen) {
            setIsPopupOpen(false);
        }
    }, [overflowMode, isPopupOpen]);

    const onPopupNavClick: () => void = (): void => {
        setIsPopupOpen((prev: boolean) => !prev);
    };

    const refreshOverflow: () => void = useCallback(() => {
        resize();
    }, [resize]);

    useEffect(() => {
        if (overflowMode === OverflowMode.Popup || overflowMode === OverflowMode.Extended) {
            const closePopup: (event: Event) => void = (event: Event): void => {
                if (overflowMode === OverflowMode.Popup && popupRef.current && popupRef.current.element) {
                    const isNotPopup: boolean = !closest(event.target as Element, '.sf-popup');
                    const isOpen: boolean = popupRef.current.element.classList.contains(CLS_POPUPOPEN);
                    if (isNotPopup && isOpen) {
                        setIsPopupOpen(false);
                    }
                }
            };
            document.addEventListener('click', closePopup);
            document.addEventListener('scroll', closePopup, true);

            return () => {
                document.removeEventListener('click', closePopup);
                document.removeEventListener('scroll', closePopup, true);
            };
        }
        return undefined;
    }, [overflowMode]);

    useEffect(() => {
        onPopupOpenChange(isPopupOpen);
    }, [isPopupOpen, onPopupOpenChange]);

    useEffect(() => {
        setIsPopupOpen((prev: boolean) => prev !== isPopupVisible ? isPopupVisible : prev);
    }, [isPopupVisible]);

    useEffect(() => {
        onOverflowChange();
    }, [toolbarItems, onOverflowChange]);

    useLayoutEffect(() => {
        if (toolbarRef.current && isToolbarRefReady && !hasInitialRenderCompleted) {
            resizeRef.current();
            setHasInitialRenderCompleted(true);
        }
    }, [isToolbarRefReady, hasInitialRenderCompleted]);

    useEffect(() => {
        if (toolbarRef.current) {
            let isFirstObservation: boolean = true;

            if (!resizeObserverRef.current) {
                resizeObserverRef.current = new ResizeObserver(() => {
                    if (isFirstObservation) {
                        isFirstObservation = false;
                        return;
                    }
                    resizeRef.current();
                });
                resizeObserverRef.current.observe(toolbarRef.current);
            }

            return () => {
                resizeObserverRef.current?.disconnect();
                resizeObserverRef.current = null;
            };
        }
        return undefined;
    }, []);

    useLayoutEffect(() => {
        if (isPopupRefresh) {
            popupRefresh();
            setItems();
            setIsPopupOpen((prev: boolean) => prev && popupItemsRef.current.length <= 0 ? false : prev);
            setIsPopupRefresh(false);
        }
    }, [isPopupRefresh, popupRefresh, setItems]);

    useLayoutEffect(() => {
        const currentCount: number = Children.count(children);
        if (hasInitialRenderCompleted && previousChildrenCountRef.current !== currentCount) {
            previousChildrenCountRef.current = Children.count(children);
            itemsRef.current = getItems(children);
            toolbarItemsRef.current = [...itemsRef.current];
            popupItemsRef.current = [];
            setToolbarItems([...itemsRef.current]);
            setPopupItems([]);
            setIsPopupOpen(false);
            setHasInitialRenderCompleted(false);
        }
    }, [children, hasInitialRenderCompleted, getItems]);

    useImperativeHandle(ref, () => ({
        refreshOverflow
    }), [refreshOverflow]);

    const classes: string = useMemo(() => {
        const classArray: string[] = [CLS_ITEMS];
        if (popupItems.length > 0) {
            classArray.push(CLS_OVERFLOW);
        }
        return classArray.join(' ');
    }, [popupItems]);

    const popupNavClasses: string = useMemo(() => {
        const classArray: string[] = [CLS_POPUPNAV];
        if (overflowMode === OverflowMode.Extended) {
            classArray.push(CLS_EXTENDPOPUP);
        }
        if (isPopupOpen) {
            classArray.push(CLS_TBARNAVACT);
        }
        return classArray.join(' ');
    }, [overflowMode, isPopupOpen]);

    const popupClasses: string = useMemo(() => {
        const classArray: string[] = [CLS_POPUPCLASS];
        if (overflowMode === OverflowMode.Extended) {
            classArray.push(CLS_EXTENDABLE_CLASS);
        }
        if (className) {
            classArray.push(className);
        }
        if (isPopupRefresh) {
            classArray.push(CLS_HIDDEN_POPUP);
        }
        return classArray.join(' ');
    }, [overflowMode, className, isPopupRefresh]);

    return (
        <>
            <div className={classes}>
                {toolbarItems}
            </div>
            {
                (popupItems.length > 0) &&
                <div
                    ref={popupNavRef}
                    className={popupNavClasses}
                    tabIndex={0}
                    role='button'
                    aria-haspopup='true'
                    aria-label='overflow'
                    aria-expanded={isPopupOpen ? 'true' : 'false'}
                    onClick={onPopupNavClick}
                >
                    <div className={`${isPopupOpen ? CLS_POPUPICON : CLS_POPUPDOWN} ${CLS_ICON}`}>
                        {isPopupOpen ? <ChevronUpIcon/> : <ChevronDownIcon/>}
                    </div>
                </div>
            }
            {
                popupItems.length > 0 &&
                <Popup
                    ref={popupRef}
                    className={popupClasses}
                    relateTo={toolbarRef.current as HTMLElement}
                    offsetY={orientation === Orientation.Vertical ? 0 : getElementOffsetY()}
                    open={isPopupOpen}
                    onOpen={onPopupOpen}
                    onClose={onPopupClose}
                    collision={{ Y: collision ? CollisionType.None : CollisionType.None, X: CollisionType.None }}
                    position={dir === 'rtl' ? { X: 'left', Y: 'top' } : { X: 'right', Y: 'top' }}
                    width={
                        overflowMode === OverflowMode.Extended && orientation === Orientation.Horizontal ?
                            getToolbarPopupWidth() : undefined
                    }
                    offsetX={overflowMode === OverflowMode.Extended && orientation === Orientation.Horizontal ? 0 : undefined}
                    animation={{
                        show: { name: 'FadeIn', duration: 100 },
                        hide: { name: 'FadeOut', duration: 100 }
                    }}
                    style={popupStyles}
                    onClick={onPopupClick}
                >
                    {
                        popupItems
                    }
                </Popup>
            }
        </>
    );
}));
ToolbarPopup.displayName = 'ToolbarPopup';
export { ToolbarPopup };
