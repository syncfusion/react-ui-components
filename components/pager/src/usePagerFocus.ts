import { addClass, extend, isNullOrUndefined, removeClass } from '@syncfusion/react-base';
import { RefObject, useEffect, useRef } from 'react';
import { PagerRef } from './page';

interface keyPressArgs extends KeyboardEvent {
    cancel?: boolean;
}

interface ActionFocus {
    className: string;
    pageIndex: number;
}

interface PagerFocusProps {
    pageRef: RefObject<PagerRef>;
    currentPage: number;
    allowKeyboard: boolean;
    totalRecordsCount: number;
    pageSize: number;
}

interface PagerFocusResult {
    actionFocus: RefObject<ActionFocus>;
    handleFocus: (e: React.FocusEvent<Element>) => void;
    handleBlur: () => void;
    handleKeyDown: (e: React.KeyboardEvent<Element>) => void;
    setFirstLastTabIndex: () => void;
    removeDisabledTabIndex: () => void;
    getClass: (element: Element) => string;
}

/**
 * Custom hook for handling the page focus.
 *
 * @param {PagerFocusProps} props The properties for the page focus.
 * @returns {PagerFocusResult} An object containing information related to page focus.
 */
export const usePagerFocus: (props: PagerFocusProps) => PagerFocusResult =
    (props: PagerFocusProps): PagerFocusResult => {

        const { pageRef, currentPage, allowKeyboard, totalRecordsCount, pageSize } = props;
        const actionFocus: RefObject<ActionFocus> = useRef<ActionFocus>({ className: '', pageIndex: 0 });

        const getFocusablePagerElements: (element: Element, previousElements: Element[]) => Element[] =
            (element: Element, previousElements: Element[]): Element[] => {
                const target: Element = element;
                const targetChildrens: HTMLCollection = target.children;
                let pagerElements: Element[] = previousElements;
                const classes: string[] = ['sf-pagesizes', 'sf-first', 'sf-prev', 'sf-next', 'sf-last'];
                for (let i: number = 0; i < targetChildrens.length; i++) {
                    const element: Element = targetChildrens[parseInt(i.toString(), 10)];
                    if (element.children.length > 0 && !classes.some((selector: string) => element.classList.contains(selector))) {
                        pagerElements = getFocusablePagerElements(element, pagerElements);
                    } else {
                        const tabindexElement: Element = targetChildrens[parseInt(i.toString(), 10)];
                        if (tabindexElement.hasAttribute('tabindex') && !element.classList.contains('sf-disable')
                            && (element as HTMLElement).style.display !== 'none'
                            && !isNullOrUndefined((element as HTMLElement).offsetParent)) {
                            pagerElements.push(tabindexElement);
                        }
                    }
                }
                return pagerElements;
            };

        const addFocus: (element: Element, addFocusClass: boolean) => void = (element: Element, addFocusClass: boolean): void => {
            if (!isNullOrUndefined(element)) {
                if (addFocusClass) {
                    addClass([element], ['sf-focused', 'sf-focus']);
                }
                (element as HTMLElement).tabIndex = allowKeyboard ? 0 : -1;
            }
        };

        const getTabFocusElement: () => Element = (): Element => {
            let focusedTabIndexElement: Element;
            const tabindexElements: NodeListOf<Element> = pageRef.current.element.querySelectorAll('[tabindex]:not([tabindex="-1"])');
            for (let i: number = 0; i < tabindexElements.length; i++) {
                const element: Element = tabindexElements[parseInt(i.toString(), 10)];
                if (element && (element.classList.contains('sf-focused') || element.classList.contains('sf-input-focus'))) {
                    focusedTabIndexElement = element;
                    break;
                }
            }
            return focusedTabIndexElement;
        };

        const handleFocus: (e: React.FocusEvent<Element>) => void = (e: React.FocusEvent<Element>): void => {
            const focusedTabIndexElement: Element = getTabFocusElement();
            const element: HTMLDivElement = pageRef.current.element;
            element.tabIndex = -1;
            if (isNullOrUndefined(focusedTabIndexElement)) {
                const target: Element = e.target as Element;
                if (target === element) {
                    return;
                }
                if (!target.classList.contains('sf-disable')) {
                    addFocus(target, true);
                }
            }
        };

        const getFocusedElement: () => Element = (): Element => {
            return pageRef.current.element.querySelector('.sf-focused');
        };

        const removeFocus: (element: Element, removeFocusClass: boolean) => void =
            (element: Element, removeFocusClass: boolean): void => {
                if (removeFocusClass) {
                    removeClass([element], ['sf-focused', 'sf-focus']);
                }
                (element as HTMLElement).tabIndex = -1;
            };

        const removeDisabledTabIndex: () => void = (): void => {
            const disabledTabIndex: HTMLElement[] = [...pageRef.current.element.querySelectorAll('.sf-disable[tabindex="0"]')] as HTMLElement[];
            for (let i: number = 0; i < disabledTabIndex.length; i++) {
                disabledTabIndex[parseInt(i.toString(), 10)].tabIndex = -1;
            }
        };

        const setFirstLastTabIndex: () => void = (): void => {
            const focusablePagerElements: Element[] = getFocusablePagerElements(pageRef.current.element, []);
            if (focusablePagerElements.length > 0) {
                (focusablePagerElements[0] as HTMLElement).tabIndex = allowKeyboard ? 0 : -1;
                (focusablePagerElements[focusablePagerElements.length - 1] as HTMLElement).tabIndex = allowKeyboard ? 0 : -1;
            }
        };

        const handleBlur: () => void = (): void => {
            const focusedElement: Element = getFocusedElement();
            const element: HTMLDivElement = pageRef.current.element;
            if (!isNullOrUndefined(focusedElement)) {
                removeFocus(focusedElement, true);
            }
            setFirstLastTabIndex();
            element.tabIndex = -1;
        };

        const keyDownHandler: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            if (e.altKey && e.keyCode === 74) {
                e.preventDefault();
                setPagerFocus();
            }
        };

        useEffect(() => {
            if (allowKeyboard) {
                document.body.addEventListener('keydown', keyDownHandler);
            }
            return () => {
                if (allowKeyboard) {
                    document.body.removeEventListener('keydown', keyDownHandler);
                }
            };
        }, [allowKeyboard]);

        const checkPagerHasFocus: () => boolean = (): boolean => {
            return getTabFocusElement() ? true : false;
        };

        const setPagerFocus: () => void = (): void => {
            const focusablePagerElements: Element[] = getFocusablePagerElements(pageRef.current.element, []);
            if (focusablePagerElements.length > 0) {
                (focusablePagerElements[0] as HTMLElement).focus();
            }
        };

        const changeFocusByTab: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            const currentItemPagerFocus: Element = getTabFocusElement();
            const focusablePagerElements: Element[] = getFocusablePagerElements(pageRef.current.element, []);
            if (focusablePagerElements.length > 0) {
                for (let i: number = 0; i < focusablePagerElements.length; i++) {
                    if (currentItemPagerFocus === focusablePagerElements[parseInt(i.toString(), 10)]) {
                        const incrementNumber: number = i + 1;
                        if (incrementNumber < focusablePagerElements.length) {
                            e.preventDefault();
                            (focusablePagerElements[parseInt(incrementNumber.toString(), 10)] as HTMLElement).focus();
                        }
                        break;
                    }
                }
            }
        };

        const changeFocusByShiftTab: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            const currentItemPagerFocus: Element = getTabFocusElement();
            const focusablePagerElements: Element[] = getFocusablePagerElements(pageRef.current.element, []);
            if (focusablePagerElements.length > 0) {
                for (let i: number = 0; i < focusablePagerElements.length; i++) {
                    if (currentItemPagerFocus === focusablePagerElements[parseInt(i.toString(), 10)]) {
                        const decrementNumber: number = i - 1;
                        if (decrementNumber >= 0) {
                            e.preventDefault();
                            (focusablePagerElements[parseInt(decrementNumber.toString(), 10)] as HTMLElement).focus();
                        }
                        break;
                    }
                }
            }
        };

        const getActiveElement: () => Element = (): Element => {
            return pageRef.current.element.querySelector('.sf-active');
        };

        const getClass: (element: Element) => string = (element: Element): string => {
            let currentClass: string;
            const classList: string[] = ['sf-mfirst', 'sf-mprev', 'sf-first', 'sf-prev', 'sf-pp',
                'sf-np', 'sf-next', 'sf-last', 'sf-mnext', 'sf-mlast', 'sf-numericitem'];
            for (let i: number = 0; i < classList.length; i++) {
                if (element && element.classList.contains(classList[parseInt(i.toString(), 10)])) {
                    currentClass = classList[parseInt(i.toString(), 10)];
                    return currentClass;
                }
            }
            return currentClass;
        };

        const goToPageByKey: (className: string, pageIndex: number) => void =
            (className: string, pageIndex: number): void => {
                const args: { currentPage: number, oldPage: number, cancel: boolean } = {
                    currentPage: pageIndex, oldPage: currentPage, cancel: false
                };
                const totalPages: number = totalRecordsCount % pageSize === 0 ? (totalRecordsCount / pageSize) :
                    (parseInt((totalRecordsCount / pageSize).toString(), 10) + 1);
                if (pageIndex >= 1 && pageIndex <= totalPages && pageIndex !== currentPage) {
                    pageRef.current.click?.(args);
                    if (args.cancel) {
                        return;
                    }
                    actionFocus.current = { className, pageIndex };
                    pageRef.current.goToPage(pageIndex);
                }
            };

        const navigateToPageByEnterOrSpace: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            const currentItemPagerFocus: Element = getFocusedElement();
            if (currentItemPagerFocus) {
                e.preventDefault();
                const pageIndex: number = parseInt(currentItemPagerFocus.getAttribute('page-index'), 10);
                goToPageByKey(getClass(currentItemPagerFocus), pageIndex);
            }
        };

        const navigateToPageByKey: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            const actionClass: string = (e.keyCode === 37 || e.keyCode === 33) ? '.sf-prev'
                : (e.keyCode === 39 || e.keyCode === 34) ? '.sf-next'
                    : e.keyCode === 35 ? '.sf-last' : e.keyCode === 36 ? '.sf-first' : '';
            const pagingItem: Element = pageRef.current.element.querySelector(actionClass);
            if (!isNullOrUndefined(pagingItem) && pagingItem.hasAttribute('page-index')
                && !isNaN(parseInt(pagingItem.getAttribute('page-index'), 10))) {
                e.preventDefault();
                const pageIndex: number = parseInt(pagingItem.getAttribute('page-index'), 10);
                goToPageByKey('sf-numericitem', pageIndex);
            }
        };

        const changePagerFocus: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            if (e.shiftKey && e.keyCode === 9) {
                changeFocusByShiftTab(e);
            } else if (e.keyCode === 9) {
                changeFocusByTab(e);
            } else if (e.keyCode === 13 || e.keyCode === 32) {
                navigateToPageByEnterOrSpace(e);
            } else if (e.keyCode === 37 || e.keyCode === 39 || e.keyCode === 35
                || e.keyCode === 36 || e.keyCode === 33 || e.keyCode === 34) {
                navigateToPageByKey(e);
            }
        };

        const onKeyPress: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            if (checkPagerHasFocus()) {
                changePagerFocus(e);
            } else {
                e.preventDefault();
                setPagerFocus();
            }
        };

        const handleKeyDown: (e: React.KeyboardEvent<Element>) => void = (e: React.KeyboardEvent<Element>): void => {
            const presskey: keyPressArgs = extend(e, { cancel: false }) as keyPressArgs;
            onKeyPress(presskey);
        };

        const removeTabIndex: () => void = (): void => {
            const elements: NodeListOf<Element> = pageRef.current.element.querySelectorAll('[tabindex="0"]');
            for (let i: number = 0; i < elements.length; i++) {
                (elements[parseInt(i.toString(), 10)] as HTMLElement).tabIndex = -1;
            }
        };

        useEffect(() => {
            const focusedElement: Element = getFocusedElement();
            if (focusedElement) {
                removeFocus(focusedElement, true);
            }
            if (actionFocus.current.className === 'sf-numericitem') {
                removeTabIndex();
                const focusElement: HTMLElement = pageRef.current.element.querySelector(`.sf-numericitem[page-index="${actionFocus.current.pageIndex}"]`);
                if (focusElement) {
                    addFocus(focusElement, true);
                    focusElement.focus();
                }
            } else if (actionFocus.current.className !== '') {
                removeTabIndex();
                const focusElement: HTMLElement = pageRef.current.element.querySelector('.' + actionFocus.current.className);
                if (focusElement.classList.contains('sf-disable')) {
                    focusElement.tabIndex = -1;
                    const currentActivePage: HTMLElement = getActiveElement() as HTMLElement;
                    if (currentActivePage) {
                        addFocus(currentActivePage, true);
                        currentActivePage.focus();
                    }
                } else if (focusElement) {
                    addFocus(focusElement, true);
                    focusElement.focus();
                }
            }
            actionFocus.current = { className: '', pageIndex: 0 };
        }, [currentPage]);

        return {
            actionFocus,
            handleFocus,
            handleKeyDown,
            handleBlur,
            setFirstLastTabIndex,
            getClass,
            removeDisabledTabIndex
        };

    };
