import { HTMLAttributes, ReactNode, memo, FC, NamedExoticComponent  } from 'react';
import { FILEUPLOAD_CLASSES } from './constant';
import { combineClasses } from './utils';
import { FileListItem } from './file-list-item';
import { FileItem } from './types';
import { useFileUploadContext, FileUploadContextValue } from './context';

/**
 * `FileListRender` is a function that can be passed as a child to `<FileList>`.
 * It defines how each file row should be rendered. When a function is supplied,
 * the default row template is replaced with the content returned from the function.
 * @private
 */
export type FileListRender = (file: FileItem, helpers: {
    retry: (fileId: string) => void;
    cancel: (fileId: string) => void;
    remove: (fileId: string) => void;
    pause: (fileId: string) => void;
    resume: (fileId: string) => void;
}) => ReactNode;

/**
 * Props for the `<FileList>` child of `<FileUpload>`.
 * @private
 */
export interface FileListProps {
    /**
     * Render function `(file, helpers) => ReactNode` for custom rows,
     * or any React children. The function form suppresses the default
     * per-row template.
     *
     * @default -
     * @private
     */
    children?: FileListRender | ReactNode | ReactNode[];
    /**
     * Additional CSS class name for the underlying `<ul>` element.
     *
     * @default -
     */
    className?: string;
}

type IFileListProps = FileListProps & Omit<HTMLAttributes<HTMLUListElement>, 'children'>;

/**
 * Renders the file-list zone. Returns `null` when the file list is empty.
 *
 * ```tsx
 * <FileList />
 *
 * <FileList>
 *   {(file, helpers) => (
 *     <div>
 *       {file.name}
 *       <button onClick={() => helpers.retry(file.id)}>Retry</button>
 *     </div>
 *   )}
 * </FileList>
 * ```
 *
 * @param {IFileListProps} props - The props for the FileList component.
 * @returns {React.JSX.Element | null} The rendered file list, or `null` when the file list is empty.
 */
const FileListInternal: FC<IFileListProps> = (props: IFileListProps) => {
    const ctx: FileUploadContextValue = useFileUploadContext();
    const { files, config, handlers, helpers, l10n }: FileUploadContextValue = ctx;
    const children: IFileListProps['children'] = props.children;
    const className: IFileListProps['className'] = props.className;
    const rest: Omit<IFileListProps, 'children' | 'className'> = (() => {
        const { children: _children, className: _className, ...restProps }: IFileListProps = props;
        return restProps;
    })();

    if (files.length === 0) { return null; }

    if (typeof children === 'function') {
        const render: FileListRender = children;
        return (
            <ul className={combineClasses(FILEUPLOAD_CLASSES.uploadFiles, className)} {...rest}>
                {files.map((file: FileItem) => (
                    <li
                        key={file.id}
                        className={FILEUPLOAD_CLASSES.uploadFileList}
                        data-file-name={file.name}
                    >
                        {render(file, helpers)}
                    </li>
                ))}
            </ul>
        );
    }

    if (children !== undefined) {
        return (
            <ul className={combineClasses(FILEUPLOAD_CLASSES.uploadFiles, className)} {...rest}>
                {children}
            </ul>
        );
    }

    return (
        <ul className={combineClasses(FILEUPLOAD_CLASSES.uploadFiles, className)} {...rest}>
            {files.map((fileItem: FileItem) => (
                <FileListItem
                    key={fileItem.id}
                    fileItem={fileItem}
                    showRetry={config.showRetry}
                    showCancel={config.showCancel}
                    showRemove={config.showRemove}
                    showProgressBar={config.showProgressBar}
                    onRetry={handlers.handleRetry}
                    onCancel={handlers.handleCancel}
                    onRemove={handlers.handleRemove}
                    onPause={handlers.handlePause}
                    onResume={handlers.handleResume}
                    l10n={l10n}
                />
            ))}
        </ul>
    );
};

/**
 * `<FileList>` child of `<FileUpload>`. Memoized; updates flow in via the root.
 */
export const FileList: NamedExoticComponent<IFileListProps> = memo(FileListInternal);
FileList.displayName = 'FileList';

export default FileList;
