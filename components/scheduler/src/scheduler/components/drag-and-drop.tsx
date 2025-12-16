import { memo, ForwardedRef, forwardRef, ReactNode } from 'react';
import { EventModel } from '../types/scheduler-types';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

interface DraggableEventProps {
    data: EventModel;
    className?: string;
    containerProps?: React.HTMLAttributes<HTMLDivElement>;
    children?: ReactNode;
}

export const DraggableEvent: React.NamedExoticComponent<any> = memo(
    forwardRef<HTMLDivElement, DraggableEventProps>((props: DraggableEventProps, ref: ForwardedRef<HTMLDivElement>) => {
        const { children, data, className, containerProps } = props;
        const { mergedRef, composedProps } = useDragAndDrop({
            ref,
            data,
            containerProps
        });

        return (
            <div ref={mergedRef} className={className} {...composedProps}>
                {children}
            </div>
        );
    })
);

DraggableEvent.displayName = 'DraggableEvent';
