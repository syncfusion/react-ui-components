import { useCallback, type RefObject } from 'react';
import { Animation, Effect, type AnimationOptions, type IAnimation } from '@syncfusion/react-base';
import type { CommonMenuProps } from '../../menu/types';

interface UseMenuAnimationOptions {
    animation: CommonMenuProps['animation'];
    isPopup: boolean;
    parentRef: RefObject<HTMLUListElement | null>;
    focusedItemRef: RefObject<HTMLLIElement | null>;
}

export interface UseMenuAnimationReturn {
    applyAnimation: (targetElement: HTMLElement) => void;
    focusAfterOpen: () => void;
}

export const useMenuAnimation: (opts: UseMenuAnimationOptions) => UseMenuAnimationReturn =
    (opts: UseMenuAnimationOptions): UseMenuAnimationReturn => {
        const { animation, isPopup, parentRef, focusedItemRef } = opts;

        const applyAnimation: (targetElement: HTMLElement) => void = useCallback(
            (targetElement: HTMLElement): void => {
                if (!targetElement || targetElement.hasAttribute('sf-animate')) { return; }

                if (
                    animation == null ||
                    (animation.duration && animation.duration <= 0) ||
                    animation.effect === 'None' ||
                    targetElement.style.visibility === 'visible'
                ) {
                    targetElement.style.visibility = 'visible';
                    if (isPopup) { parentRef.current?.focus(); }
                    return;
                }
                const animationName: Effect =
                    !isPopup && animation.effect === 'SlideDown' ? 'MenuSlideDown' as Effect : animation.effect as Effect;
                const animationRef: IAnimation = Animation({
                    duration: animation.duration,
                    timingFunction: animation.easing,
                    name: animationName,
                    begin: (args?: AnimationOptions): void => {
                        if (args?.element) {
                            args.element.style.visibility = 'visible';
                            if (animation.effect === 'SlideDown') {
                                const height: number = args.element.offsetHeight;
                                if (!isPopup) {
                                    args.element.style.setProperty('--sf-slide-height', `${height}px`);
                                }
                                args.element.style.maxHeight = `${height}px`;
                                args.element.style.overflow = 'hidden';
                            }
                        }
                    },
                    end: (args?: AnimationOptions): void => {
                        if (args?.element) {
                            if (animation.effect === 'SlideDown') {
                                args.element.style.maxHeight = '';
                                args.element.style.removeProperty('--sf-slide-height');
                            }
                            if (isPopup) { parentRef.current?.focus(); }
                        }
                    }
                });

                animationRef.animate(targetElement);
            },
            [animation, isPopup, parentRef]
        );

        const focusAfterOpen: () => void = useCallback((): void => {
            if (isPopup) { return; }
            window.requestAnimationFrame((): void => {
                focusedItemRef.current?.focus();
            });
        }, [isPopup, focusedItemRef]);

        return { applyAnimation, focusAfterOpen };
    };
