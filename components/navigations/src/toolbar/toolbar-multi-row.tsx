import { FC, memo, HTMLAttributes, useEffect, useRef, RefObject, Children  } from 'react';
import { isNullOrUndefined } from '@syncfusion/react-base';

const CLS_ITEMS: string = 'sf-toolbar-items';
const CLS_MULTIROW: string = 'sf-toolbar-multirow-items';

/**
 * @private
 */
export interface ToolbarMultiRowProps {
    /**
     * Callback function that is triggered to handle keyboard interactions with the toolbar.
     *
     * This is called after the component mounts to set up proper keyboard navigation
     * for toolbar items.
     */
    onOverflowChange: () => void;
}

type IToolbarMultiRowProps = ToolbarMultiRowProps & HTMLAttributes<HTMLDivElement>;

/**
 * ToolbarMultiRow component that renders toolbar items in multiple rows.
 *
 * This component allows toolbar items to wrap to the next line when they exceed
 * the available horizontal space, providing better space utilization and
 * responsive behavior for toolbars with many items.
 */
const ToolbarMultiRow: FC<IToolbarMultiRowProps> = memo((props: IToolbarMultiRowProps) => {
    const {
        children,
        onOverflowChange
    } = props;

    const previousChildrenCountRef: RefObject<number | null> = useRef<number>(null);

    useEffect(() => {
        const currentCount: number = Children.count(children);
        if (isNullOrUndefined(previousChildrenCountRef.current) || previousChildrenCountRef.current !== currentCount) {
            previousChildrenCountRef.current = Children.count(children);
            onOverflowChange();
        }
    }, [onOverflowChange, children]);

    return (
        <div className={`${CLS_ITEMS} ${CLS_MULTIROW}`}>
            {children}
        </div>
    );
});
ToolbarMultiRow.displayName = 'ToolbarMultiRow';
export { ToolbarMultiRow };
