import { memo, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, ReactNode, JSX, NamedExoticComponent, useRef, useState, useCallback, useEffect } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { useResize } from '../hooks/useResize';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { EventModel } from '../types/scheduler-types';
import { Position, Browser, Touch } from '@syncfusion/react-base';

interface ResizeHandlersProps {
    isVertical?: boolean;
    data?: EventModel;
    children?: ReactNode;
    hasPrevious?: boolean;
    hasNext?: boolean;
}

const isBrowser: boolean = typeof document !== 'undefined' && typeof window !== 'undefined';
const stop: (e: ReactMouseEvent | ReactTouchEvent) => void = (e: ReactMouseEvent | ReactTouchEvent) => {
    e?.stopPropagation();
    if (e?.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation?.();
    }
};

const getResizeHandlerClass: (dir: Position) => string = (dir: Position): string => {
    switch (dir) {
    case Position.Top: return CSS_CLASSES.TOP_RESIZE_HANDLER; case Position.Bottom: return CSS_CLASSES.BOTTOM_RESIZE_HANDLER;
    case Position.Left: return CSS_CLASSES.LEFT_RESIZE_HANDLER; default: return CSS_CLASSES.RIGHT_RESIZE_HANDLER;
    }
};

const Handler: ({ dir, resizeStart, showResizeHandle }: { dir: Position;
    resizeStart?: (d: Position, e: ReactMouseEvent | ReactTouchEvent) => void; showResizeHandle?: boolean; }) => JSX.Element | null = ({
    dir, resizeStart, showResizeHandle }: { dir: Position; resizeStart?: (d: Position, e: ReactMouseEvent | ReactTouchEvent) => void;
    showResizeHandle?: boolean; }) => {
    if (Browser.isDevice && !showResizeHandle) { return null; }
    return (
        <div
            className={`${CSS_CLASSES.EVENT_RESIZE_CLASS} ${getResizeHandlerClass(dir)}`}
            onMouseDown={(e: ReactMouseEvent<HTMLDivElement>) => { stop(e); resizeStart?.(dir, e); }}
            onTouchStart={(e: ReactTouchEvent<HTMLDivElement>) => { stop(e); resizeStart?.(dir, e); }}
        >
            {dir === Position.Top || dir === Position.Bottom ? (<div className={CSS_CLASSES.VERTICAL_RESIZE_INNER} />) :
                (<div className={CSS_CLASSES.HORIZONTAL_RESIZE_INNER} /> )}
            {Browser.isDevice && showResizeHandle && (
                <div className={CSS_CLASSES.MOB_RESIZE_DOT}
                    onMouseDown={(e: ReactMouseEvent<HTMLDivElement>) => { stop(e); resizeStart?.(dir, e); }}
                    onTouchStart={(e: ReactTouchEvent<HTMLDivElement>) => { stop(e); resizeStart?.(dir, e); }}
                />
            )}
        </div>
    );
};

export const ResizeHandlers: NamedExoticComponent<ResizeHandlersProps> =
    memo(({ isVertical = false, data, children,
        hasPrevious, hasNext }: ResizeHandlersProps): JSX.Element => {
        const { eventResize } = useSchedulerPropsContext();
        if (!eventResize) { return <>{children}</>; }
        const { resizeStart: effective } = useResize(data);
        const wrapRef: React.RefObject<HTMLElement> = useRef<HTMLDivElement>(null);
        const eventRef: React.RefObject<HTMLElement> = useRef<HTMLElement>(null);
        const [showResizeHandle, setShowResizeHandle] = useState(false);

        Touch(eventRef, {
            tapHold: () => { if (Browser.isDevice) { setShowResizeHandle(true); } }
        });

        useEffect(() => {
            const ele: HTMLElement = eventRef.current;
            if (!ele) { return undefined; }
            const prevent: (event: Event) => void = (event: Event) => {
                event.preventDefault();
            };
            ele.addEventListener('contextmenu', prevent, true);
            return () => {
                ele.removeEventListener('contextmenu', prevent, true);
            };
        }, []);

        const hideMobileHandler: (dir: Position, e: ReactMouseEvent | ReactTouchEvent) => void =
        useCallback((dir: Position, e: ReactMouseEvent | ReactTouchEvent) => {
            effective(dir, e);
            if (!Browser.isDevice) { return; }
            const hide: () => void = () => {
                setShowResizeHandle(false);
                if (isBrowser) {
                    document.removeEventListener('mouseup', hide, true);
                    document.removeEventListener('touchend', hide, true);
                }
            };
            if (isBrowser) {
                document.addEventListener('mouseup', hide, { capture: true, once: true });
                document.addEventListener('touchend', hide, { capture: true, once: true });
            }
        }, [effective]);

        useEffect(() => {
            if (!Browser.isDevice || !showResizeHandle) { return undefined; }
            const onOutside: (event: Event) => void = (event: Event) => {
                const target: Node = event.target as Node | null;
                if (wrapRef.current && target && !wrapRef.current.contains(target)) {
                    setShowResizeHandle(false);
                }
            };
            if (isBrowser) {
                document.addEventListener('mousedown', onOutside, true);
                document.addEventListener('touchstart', onOutside, true);
            }
            return () => {
                if (isBrowser) {
                    document.removeEventListener('mousedown', onOutside, true);
                    document.removeEventListener('touchstart', onOutside, true);
                }
            };
        }, [showResizeHandle]);

        const startDirection: Position = isVertical ? Position.Top : Position.Left;
        const endDirection: Position = isVertical ? Position.Bottom : Position.Right;
        return (
            <div className={`${CSS_CLASSES.RESIZE_CONTAINER}`} ref={(ele: HTMLDivElement) => { wrapRef.current = ele; eventRef.current = ele ?
                (ele.closest(`.${CSS_CLASSES.APPOINTMENT}`) as HTMLElement) : null; }}>
                {!hasPrevious && (
                    <Handler dir={startDirection} resizeStart={hideMobileHandler} showResizeHandle={showResizeHandle} />
                )}
                {children}
                {!hasNext && (
                    <Handler dir={endDirection} resizeStart={hideMobileHandler} showResizeHandle={showResizeHandle} />
                )}
            </div>
        );
    });

ResizeHandlers.displayName = 'ResizeHandlers';

export default ResizeHandlers;
