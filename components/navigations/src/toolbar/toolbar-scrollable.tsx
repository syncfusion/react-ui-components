import {
    useRef, HTMLAttributes, useState, memo, useMemo, RefObject, useCallback,
    forwardRef, Ref, useImperativeHandle, ForwardRefExoticComponent, RefAttributes,
    useEffect, Children
} from 'react';
import { isVisible, isNullOrUndefined } from '@syncfusion/react-base';
import { Orientation } from './toolbar';
import { HScroll, VScroll } from '../common/index';

const CLS_ITEMS: string = 'sf-toolbar-items';
const CLS_HSCROLLBAR: string = 'sf-hscroll-bar';
const CLS_VSCROLLBAR: string = 'sf-vscroll-bar';
const CLS_HSCROLLCNT: string = 'sf-hscroll-content';
const CLS_VSCROLLCNT: string = 'sf-vscroll-content';

/**
 * Specifies the props for the ToolbarScrollable component.
 */
export interface ToolbarScrollableProps {
    /**
     * Specifies the reference to the toolbar element.
     * Used to access the toolbar DOM element for measurements and manipulation.
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
     * Specifies the scrolling distance in pixels when the toolbar items overflow in Scrollable mode.
     * This property controls how far items scroll when navigation buttons are clicked.
     *
     * @default undefined
     */
    scrollStep?: number;

    /**
     * Specifies the callback function triggered when the overflow state changes.
     * This function is called to set up proper keyboard navigation for toolbar items.
     */
    onOverflowChange: () => void;
}

/**
 * Specifies the reference interface for the ToolbarScrollable component.
 */
export interface ToolbarScrollableRef {
    /**
     * Specifies the method to refresh the overflow calculation for scrollable toolbar items.
     * This method recalculates the scrollable area and updates the visibility
     * of scroll buttons based on current dimensions and content.
     */
    refreshOverflow: () => void;
}

type IToolbarScrollableProps = ToolbarScrollableProps & HTMLAttributes<HTMLDivElement>;

/**
 * ToolbarScrollable component that renders toolbar items with scrolling capability.
 *
 * This component manages the display of toolbar items that don't fit in the available space
 * by providing horizontal or vertical scrolling functionality. It automatically detects
 * when content overflows and renders appropriate scroll controls based on the toolbar's
 * orientation.
 */
const ToolbarScrollable: ForwardRefExoticComponent<IToolbarScrollableProps & RefAttributes<ToolbarScrollableRef>> = memo(forwardRef<
ToolbarScrollableRef, IToolbarScrollableProps
>((props: IToolbarScrollableProps, ref: Ref<ToolbarScrollableRef>) => {
    const {
        toolbarRef,
        orientation,
        scrollStep,
        children,
        className,
        onOverflowChange
    } = props;

    const resizeObserverRef: RefObject<ResizeObserver | null> = useRef<ResizeObserver | null>(null);
    const previousChildrenCountRef: RefObject<number | null> = useRef<number>(null);
    const resizeTimerRef: RefObject<number | null> = useRef<number | null>(null);

    const [isOverflow, setIsOverflow] = useState<boolean>(false);
    const [activeScrollStep, setActiveScrollStep] = useState<number | undefined>(scrollStep);

    const getScrollCntEle: (itemsElement: HTMLElement) => HTMLElement = useCallback((itemsElement: HTMLElement): HTMLElement => {
        return itemsElement.querySelector('.' + (orientation === Orientation.Vertical ? CLS_VSCROLLCNT : CLS_HSCROLLCNT)) as HTMLElement;
    }, [orientation]);

    const checkOverflow: () => boolean = useCallback((): boolean => {
        let itemsOverflowing: boolean = false;
        if (toolbarRef.current && isVisible(toolbarRef.current)) {
            let itemsElement: HTMLElement = toolbarRef.current.querySelector(`.${CLS_ITEMS}`) as HTMLElement;
            itemsElement = isOverflow ? getScrollCntEle(itemsElement) : itemsElement;
            const isVertical: boolean = orientation === Orientation.Vertical;
            const toolbarWidth: number = isVertical ? toolbarRef.current.offsetHeight : toolbarRef.current.offsetWidth;
            const itemsWidth: number = isVertical ? itemsElement.scrollHeight : itemsElement.scrollWidth;

            if (itemsWidth > toolbarWidth) {
                itemsOverflowing = true;
            }
            else {
                itemsOverflowing = false;
            }
        }
        return itemsOverflowing;
    }, [isOverflow, orientation, getScrollCntEle]);

    const resize: (updateScrollStep?: boolean) => void = useCallback((updateScrollStep: boolean = true): void => {
        if (toolbarRef.current) {
            if (resizeTimerRef.current) {
                clearTimeout(resizeTimerRef.current);
            }
            const isOverflowing: boolean = checkOverflow();
            if (isOverflowing !== isOverflow) {
                setIsOverflow(isOverflowing);
            }

            if (isOverflowing && updateScrollStep) {
                resizeTimerRef.current = window.setTimeout(() => {
                    if (toolbarRef.current) {
                        const selector: string = orientation === Orientation.Vertical ? `.${CLS_VSCROLLBAR}` : `.${CLS_HSCROLLBAR}`;
                        const scrollBar: HTMLElement = toolbarRef.current.querySelector(selector) as HTMLElement;
                        if (scrollBar) {
                            setActiveScrollStep(orientation === Orientation.Vertical ? scrollBar.offsetHeight : scrollBar.offsetWidth);
                        }
                    }
                }, 500);
            }
        }
    }, [checkOverflow, orientation, isOverflow]);

    const resizeRef: RefObject<(updateScrollStep?: boolean) => void> = useRef<(updateScrollStep?: boolean) => void>(resize);

    useEffect(() => {
        resizeRef.current = resize;
    }, [resize]);

    const refreshOverflow: () => void = useCallback(() => {
        resizeRef.current();
    }, []);

    useEffect(() => {
        if (toolbarRef.current) {
            let isFirstObservation: boolean = true;

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
    }, []);

    useEffect(() => {
        const currentCount: number = Children.count(children);
        if (isNullOrUndefined(previousChildrenCountRef.current) || previousChildrenCountRef.current !== currentCount) {
            previousChildrenCountRef.current = Children.count(children);
            onOverflowChange();
            resizeRef.current(false);
        }
    }, [children, onOverflowChange]);

    useEffect(() => {
        onOverflowChange();
    }, [isOverflow, onOverflowChange]);

    useImperativeHandle(ref, () => ({
        refreshOverflow
    }), [refreshOverflow]);

    const classes: string = useMemo(() => {
        const classArray: string[] = [CLS_ITEMS];
        if (className) {
            classArray.push(className);
        }
        return classArray.join(' ');
    }, [className]);

    if (isOverflow) {
        if (orientation === Orientation.Horizontal) {
            return (
                <HScroll scrollStep={activeScrollStep} className={classes}>
                    {children}
                </HScroll>
            );
        } else {
            return (
                <VScroll scrollStep={activeScrollStep} className={classes}>
                    {children}
                </VScroll>
            );
        }
    } else {
        return <div className={classes}>{children}</div>;
    }
}));
ToolbarScrollable.displayName = 'ToolbarScrollable';
export { ToolbarScrollable };
