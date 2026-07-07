import { useLayoutEffect, useCallback, RefObject, Dispatch, SetStateAction } from 'react';
import { isCollide, fit } from '@syncfusion/react-popups';
import { Browser } from '@syncfusion/react-base';
import { Orientation, SubmenuType } from '../../menu/types';
import { getBoundedHorizontalPosition, getBoundedVerticalPosition, getCollisionBoundary, getContainerPosition, getLast, isRootContainer } from '../utils';
import { SubmenuRenderMode } from '../../menu';
import { OffsetPosition } from '../../context-menu';

interface UseSubmenuPositionArgs {
    openSubmenus: SubmenuType[];
    submenuRefs: RefObject<Map<string, HTMLElement | null>>;
    parentRef: RefObject<HTMLUListElement | null>;
    layoutDir: string;
    isEmbedded: boolean;
    orientation?: Orientation;
    container?: HTMLElement;
    setOpenSubmenus: Dispatch<SetStateAction<SubmenuType[]>>;
    applyAnimation: (el: HTMLElement) => void;
    focusAfterOpen: () => void;
    toLocalPosition: (p: { x: number; y: number }) => { x: number; y: number };
    toPagePosition: (p: { x: number; y: number }) => { x: number; y: number };
    submenuRenderMode?: SubmenuRenderMode;
}

export const useSubmenuPositionEffect: (args: UseSubmenuPositionArgs) => void = (args: UseSubmenuPositionArgs): void => {

    const {
        openSubmenus, submenuRefs, parentRef, layoutDir, isEmbedded, orientation, setOpenSubmenus, applyAnimation,
        focusAfterOpen, toLocalPosition, toPagePosition, container, submenuRenderMode
    } = args;

    const updateLastPosition: (activeSubmenu: SubmenuType, x: number, y: number, positionChanged: boolean) => void =
        useCallback((activeSubmenu: SubmenuType, x: number, y: number, positionChanged: boolean): void => {
            if (x === activeSubmenu.position.x && y === activeSubmenu.position.y) { return; }
            setOpenSubmenus((prev: SubmenuType[]): SubmenuType[] => {
                const prevLast: SubmenuType | undefined = getLast<SubmenuType>(prev);
                if (!prevLast) { return prev; }
                submenuRefs.current.clear();
                return [...prev.slice(0, prev.length - 1), { ...prevLast, position: { x, y }, positionChanged }];
            });
        }, [setOpenSubmenus]);

    const resolveEmbeddedCandidateLeft: (submenuElement: HTMLElement, pageX: number, pageY: number, submenuWidth: number,
        anchorRect: DOMRect, isRootDropdown: boolean) => number =
        useCallback((
            submenuElement: HTMLElement, pageX: number, pageY: number, submenuWidth: number,
            anchorRect: DOMRect, isRootDropdown: boolean): number => {
            if (layoutDir !== 'rtl') {
                if (isRootDropdown) { return pageX; }
                const sides: string[] = isCollide(submenuElement, document.documentElement, pageX, pageY);
                if (!sides.includes('right') && !sides.includes('left')) { return pageX; }
                const spaceRight: number = window.innerWidth - anchorRect.right;
                const spaceLeft: number = anchorRect.left;
                const candidate: number =
                    spaceRight >= submenuWidth ? anchorRect.right : spaceLeft >= submenuWidth ? anchorRect.left - submenuWidth
                        : spaceRight >= spaceLeft ? anchorRect.right : anchorRect.left - submenuWidth;
                return candidate;
            }
            const spaceRight: number = window.innerWidth - anchorRect.right;
            const rtlCandidate: number = isRootDropdown ? anchorRect.right - submenuWidth
                : anchorRect.left >= submenuWidth ? anchorRect.left - submenuWidth : spaceRight >= submenuWidth ? anchorRect.right
                    : anchorRect.left >= spaceRight ? anchorRect.left - submenuWidth : anchorRect.right;
            return rtlCandidate;
        }, [layoutDir]);

    const applyEmbeddedPosition: (activeSubmenu: SubmenuType, submenuElement: HTMLElement) => void =
        useCallback(
            (activeSubmenu: SubmenuType, submenuElement: HTMLElement): void => {
                let nextLeftLocal: number = activeSubmenu.position.x;
                let nextTopLocal: number = activeSubmenu.position.y;
                let needsUpdate: boolean = false;
                const MIN_POSITION_DELTA: number = 0.75;
                const submenuRect: DOMRect = submenuElement.getBoundingClientRect();
                const overflowBottom: number = submenuRect.bottom - window.innerHeight;
                const overflowTop: number = submenuRect.top;
                const anchorRect: DOMRect = activeSubmenu.currentTarget.getBoundingClientRect();
                if (overflowBottom > MIN_POSITION_DELTA) {
                    nextTopLocal -= activeSubmenu.parentIndex.length === 1 && orientation === Orientation.Horizontal ?
                        (anchorRect.height + submenuRect.height) : overflowBottom;
                    needsUpdate = true;
                } else if (overflowTop < -MIN_POSITION_DELTA) {
                    nextTopLocal += -overflowTop;
                    needsUpdate = true;
                }
                const submenuWidth: number = submenuElement.offsetWidth || submenuRect.width || 0;
                const pagePosition: { x: number; y: number } = toPagePosition({ x: nextLeftLocal, y: nextTopLocal });
                const isRootDropdown: boolean = orientation === Orientation.Horizontal && activeSubmenu.parentIndex.length === 1;
                const candidateLeftPage: number = resolveEmbeddedCandidateLeft(
                    submenuElement, pagePosition.x, pagePosition.y, submenuWidth, anchorRect, isRootDropdown);
                const fittedOffset: OffsetPosition = fit(
                    submenuElement, null, { X: true, Y: false }, { top: pagePosition.y, left: candidateLeftPage }) as OffsetPosition;
                const newLeftLocal: number = toLocalPosition({ x: fittedOffset.left, y: pagePosition.y }).x;
                if (Math.abs(newLeftLocal - nextLeftLocal) > MIN_POSITION_DELTA) {
                    nextLeftLocal = Math.round(newLeftLocal);
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    updateLastPosition(activeSubmenu, nextLeftLocal, nextTopLocal, true);
                    return;
                }
                applyAnimation(submenuElement);
                focusAfterOpen();
            },
            [orientation, toPagePosition, toLocalPosition, resolveEmbeddedCandidateLeft, updateLastPosition, applyAnimation, focusAfterOpen]
        );

    const applyPopupPosition: (activeSubmenu: SubmenuType, submenuElement: HTMLElement) => void =
        useCallback(
            (activeSubmenu: SubmenuType, submenuElement: HTMLElement): void => {
                if (Browser.isDevice) {
                    applyAnimation(submenuElement);
                    focusAfterOpen();
                    return;
                }
                let left: number = activeSubmenu.position.x;
                let top: number = activeSubmenu.position.y;
                const pagePosition: { x: number; y: number } = toPagePosition({ x: left, y: top });
                let leftPage: number = pagePosition.x;
                let topPage: number = pagePosition.y;
                const submenuRect: DOMRect = submenuElement.getBoundingClientRect();
                const submenuWidth: number = submenuElement.offsetWidth || submenuRect.width || 0;
                const previousUlKey: string = openSubmenus.length > 1 ? openSubmenus[openSubmenus.length - 2].parentIndex.join('-') : '';
                const previousUl: HTMLElement | null =
                    openSubmenus.length === 1 ? parentRef.current : (submenuRefs.current.get(previousUlKey) ?? null);
                const previousRect: DOMRect | undefined = previousUl?.getBoundingClientRect();
                if (activeSubmenu.positionChanged && previousRect && submenuWidth > 0) {
                    applyAnimation(submenuElement);
                    focusAfterOpen();
                    return;
                }
                const isDefaultContainer: boolean = isRootContainer(container);
                const collisionBoundary: HTMLElement = getCollisionBoundary(container);
                const boundaryWidth: number = collisionBoundary.clientWidth || 0;
                const collisionLeft: number = layoutDir === 'rtl' ? leftPage - submenuWidth : leftPage;
                const customContainerCollide: boolean = !isDefaultContainer && submenuWidth > 0 && boundaryWidth > 0 && (collisionLeft <
                    collisionBoundary.scrollLeft || collisionLeft + submenuWidth > collisionBoundary.scrollLeft + boundaryWidth);

                const collide: string[] = isCollide(
                    submenuElement, collisionBoundary, layoutDir === 'rtl' ? leftPage - submenuWidth : leftPage, topPage);
                if (collide.includes('left') || collide.includes('right') || customContainerCollide) {
                    if (previousRect) {
                        const containerLeft: number = !isDefaultContainer && container ? container.clientLeft : 0;
                        const newLeftPage: number =
                            layoutDir === 'rtl' ? previousRect.right + window.scrollX
                                : previousRect.left + window.scrollX - submenuWidth + containerLeft;
                        left = !isDefaultContainer && container
                            ? getContainerPosition(newLeftPage, topPage, container).x : toLocalPosition({ x: newLeftPage, y: topPage }).x;
                        leftPage = newLeftPage;
                    }
                }
                if (layoutDir === 'rtl' && !collide.includes('right') && !collide.includes('left') && !customContainerCollide) {
                    const newLeftPage: number = leftPage - submenuWidth;
                    left = !isDefaultContainer && container ? left - submenuWidth : toLocalPosition({ x: newLeftPage, y: topPage }).x;
                    leftPage = newLeftPage;
                }
                if (collide.includes('bottom')) {
                    const fitBoundary: HTMLElement | null = isDefaultContainer ? null : collisionBoundary;
                    const fitted: OffsetPosition = fit(
                        submenuElement, fitBoundary, { X: false, Y: true }, { top: topPage, left: leftPage }) as OffsetPosition;
                    topPage = fitted.top;
                    top = toLocalPosition({ x: leftPage, y: topPage }).y;
                }
                if (!isDefaultContainer && container) {
                    if (!activeSubmenu.positionChanged) {
                        left -= container.clientLeft;
                        if (top === activeSubmenu.position.y) { top -= container.clientTop; }
                    }
                    left = getBoundedHorizontalPosition(left, submenuElement, collisionBoundary);
                    top = getBoundedVerticalPosition(top, submenuElement, collisionBoundary);
                }
                if (left !== activeSubmenu.position.x || top !== activeSubmenu.position.y) {
                    updateLastPosition(activeSubmenu, left, top, true);
                    return;
                }
                applyAnimation(submenuElement);
                focusAfterOpen();
            },
            [layoutDir, toPagePosition, toLocalPosition, updateLastPosition,
                applyAnimation, focusAfterOpen, openSubmenus, parentRef, submenuRefs, isEmbedded, container]);

    const positionSubmenu: (activeSubmenu: SubmenuType) => boolean = useCallback((activeSubmenu: SubmenuType): boolean => {
        const pathKey: string = activeSubmenu.parentIndex.join('-');
        const submenuElement: HTMLElement | null | undefined = submenuRefs.current.get(pathKey);
        if (!submenuElement) { return false; }
        if (isEmbedded && submenuRenderMode === 'inline') {
            applyEmbeddedPosition(activeSubmenu, submenuElement);
        } else {
            applyPopupPosition(activeSubmenu, submenuElement);
        }
        return true;
    }, [submenuRefs, isEmbedded, submenuRenderMode, applyEmbeddedPosition, applyPopupPosition]);

    useLayoutEffect((): (() => void) | void => {
        const activeSubmenu: SubmenuType | undefined = getLast<SubmenuType>(openSubmenus);
        if (!activeSubmenu) { return; }
        if (positionSubmenu(activeSubmenu)) { return; }
        const rafId: number = window.requestAnimationFrame((): void => {
            positionSubmenu(activeSubmenu);
        });
        return (): void => {
            window.cancelAnimationFrame(rafId);
        };
    }, [openSubmenus, positionSubmenu]);
};
