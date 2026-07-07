import { useMemo, useCallback, useState, useEffect, ReactNode, FC, RefObject } from 'react';
import { IResize, Popup, ResizeEvent, getZindexPartial, useResize } from '@syncfusion/react-popups';
import { DropdownContextType, useDropdownContext } from '../context';
import { buildPopupElementClasses } from '../utils';
import { Size } from '../../drop-down-list/types';
import { createPortal } from 'react-dom';
import { ResizerRightIcon } from '@syncfusion/react-icons';
import { CSS_CLASSES } from '../constants';

/**
 * DropdownMenu Component props
 *
 * @private
 */
export interface DropdownMenuProps {
    children?: ReactNode;
}

export const DropdownMenu: FC<DropdownMenuProps> = ({ children }: DropdownMenuProps) => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { isPopupOpen },
        refs: { popupContentRef, popupRef, dropdownRootRef },
        config: { size, id, onResize, resizable, className, popupSettings, enableGroupedCheckBox },
        internalProps: { setPopupWidth, setPopupHeight, combinedPopupSettings }
    } = context;

    const [popupDimensions, setPopupDimensions] = useState<{ height: number, width: number }>({ height: 0, width: 0 });
    const [calculatedZIndex, setCalculatedZIndex] = useState<number>(1000);

    const onResizeHandler: (args: ResizeEvent) => void = useCallback((args: ResizeEvent) => {
        setPopupDimensions({ height: args.height, width: args.width });
        onResize?.(args);
    }, [onResize]);

    const resizeOptions: IResize = useMemo(() => ({
        enabled: resizable,
        handles: ['SouthEast'],
        onResize: onResizeHandler
    }), [resizable, onResizeHandler]);

    const { renderResizeHandles } = useResize(popupRef as unknown as RefObject<HTMLElement>, resizeOptions);

    const popupClass: string = useMemo(() => {
        return [
            className,
            enableGroupedCheckBox ? CSS_CLASSES.GROUP_CHECKBOX : ''
        ].filter(Boolean).join(' ');
    }, [className]);

    const popupElementClassNames: string = useMemo(() => {
        return buildPopupElementClasses({ popupClassNames: popupClass, isResizable: resizable });
    }, [popupClass, resizable]);

    useEffect(() => {
        const explicit: number | undefined = popupSettings?.zIndex;
        let base: number = (typeof explicit === 'number' && Number.isFinite(explicit)) ? explicit : 1000;
        if (base === 1000 && dropdownRootRef.current) {
            const partial: number = Number(getZindexPartial(dropdownRootRef.current));
            if (Number.isFinite(partial)) {
                base = partial;
            }
        }
        setCalculatedZIndex(Math.max(3, base + 1));
    }, [popupSettings?.zIndex, dropdownRootRef]);

    if (!isPopupOpen || !dropdownRootRef?.current || !combinedPopupSettings) {
        return null;
    }

    return (
        <>{isPopupOpen && typeof document !== 'undefined' && createPortal(
            <Popup
                ref={popupRef}
                className={popupElementClassNames}
                id={`${id}_popup`}
                relateTo={dropdownRootRef.current as HTMLElement}
                width={popupDimensions.width ? popupDimensions.width : setPopupWidth()}
                height="auto"
                position={combinedPopupSettings.position}
                zIndex={calculatedZIndex}
                collision={combinedPopupSettings.collision}
                open={isPopupOpen}
                autoReposition={combinedPopupSettings.autoReposition}
                animation={{ show: { name: 'FadeIn', duration: 100 }, hide: { name: 'FadeOut', duration: 100 } }}
                offsetX={combinedPopupSettings.offsetX}
                offsetY={combinedPopupSettings.offsetY}
                style={{ maxHeight: popupDimensions.height ? popupDimensions.height : setPopupHeight() }}
            >
                <div ref={popupContentRef} className={size === Size.Small ? CSS_CLASSES.SMALL : size === Size.Large ? CSS_CLASSES.LARGE :
                    CSS_CLASSES.MEDIUM}>
                    {children}
                    {(resizable) && renderResizeHandles(<ResizerRightIcon fill='currentColor' />)}
                </div>
            </Popup>,
            document.body
        )}</>
    );
};

DropdownMenu.displayName = 'DropdownMenu';

export default DropdownMenu;
