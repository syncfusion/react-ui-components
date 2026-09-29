import { FC, HTMLAttributes, memo, ReactNode } from 'react';
import { FILEUPLOAD_CLASSES } from '../constant';
import { useFileUploadContext } from '../context';
import { combineClasses } from '../utils';

/**
 * `DragHintProps` defines the properties for the `DragHint` component.
 * It is a semantic container for the drag-and-drop helper text inside the `FileUpload` component.
 * Renders only when dragDropEnabled is true and a label is available.
 *
 * ```tsx
 * import { FileUpload, DragHint } from '@syncfusion/react-inputs';
 *
 * export default function App() {
 *   return (
 *     <FileUpload
 *       saveUrl="https://services.syncfusion.com/react/production/api/FileUploader/Save"
 *       removeUrl="https://services.syncfusion.com/react/production/api/FileUploader/Remove"
 *     >
 *       <DragHint>or drop PDF / DOC / image files here</DragHint>
 *     </FileUpload>
 *   );
 * }
 * ```
 */
export interface DragHintProps {
    /**
     * Specifies an additional CSS class name for the rendered text element.
     *
     * @default -
     */
    className?: string;
    /**
     * Specifies the child content for the component.
     *
     * @default -
     */
    children?: ReactNode;
}

type IDragHintProps = DragHintProps & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

/**
 * Renders the drag-and-drop hint text shown next to the browse
 * button. Renders only when `dragDropEnabled` is true and the root
 * has not provided a custom drag hint via children. Falls back to
 * the root's localized `dragDrop` label when no children are
 * provided.
 *
 * ```tsx
 * import { FileUpload, BrowseButton, DragHint } from '@syncfusion/react-fileupload';
 *
 * export default function App() {
 *     return (
 *         <FileUpload>
 *             <BrowseButton>Browse files</BrowseButton>
 *             <DragHint>or drop files here</DragHint>
 *         </FileUpload>
 *     );
 * }
 * ```
 *
 * @returns {JSX.Element | null} The rendered drag hint element, or `null` when disabled or no label is available.
 */
export const DragHint: FC<IDragHintProps> = memo(({ className, children, ...restProps }: IDragHintProps) => {
    const { config, dragDropLabel } = useFileUploadContext();
    if (!config.dragDropEnabled) {
        return null;
    }
    const text: ReactNode = children ?? dragDropLabel;
    if (!text) {
        return null;
    }
    return (
        <span
            className={combineClasses(FILEUPLOAD_CLASSES.fileDropText, className)}
            {...restProps}
        >
            {text}
        </span>
    );
});

DragHint.displayName = 'DragHint';
