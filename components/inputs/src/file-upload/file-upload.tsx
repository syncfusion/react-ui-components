import { forwardRef, isValidElement, ReactElement, ReactNode, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, RefObject, Children } from 'react';
import { IButton } from '@syncfusion/react-buttons';
import { IL10n, L10n, preRender, useProviderContext } from '@syncfusion/react-base';
import { FileUploadProps, FileItem } from './types';
import { combineClasses, hasDirectoryInDataTransfer, readDirectoryFileList } from './utils';
import { useDropArea } from './use-drop-area';
import { FILEUPLOAD_CLASSES } from './constant';
import { useFileUploadHandlers } from './hooks/useFileUploadHandlers';
import { useUploadQueue } from './hooks/useUploadQueue';
import { useRetryScheduler } from './hooks/useRetryScheduler';
import { useFileUploadCompletion } from './hooks/useFileUploadCompletion';
import { FileDropInput } from './components/file-drop-input';
import { BrowseButton } from './components/browse-button';
import { DragHint } from './components/drag-hint';
import { Actions, UploadButton, ClearButton } from './components/upload-actions';
import { FileList } from './file-list';
import { FileUploadContext, FileUploadContextValue } from './context';

/**
 * Built-in English defaults for the file upload's action labels and drag hint.
 * Final fallback when no `L10n` constant is available for the active locale.
 * To customize the label, supply an `<L10n>` provider at the app root, or
 * pass a custom React node as `children` to the compound button:
 *   - `<BrowseButton>Select files</BrowseButton>`
 *
 * @private
 */
const DEFAULT_FILEUPLOAD_TEXT: Readonly<{ [rule: string]: string }> = {
    browse: 'Browse',
    dragDropText: 'Or drag and drop files here',
    upload: 'Upload',
    clear: 'Clear'
};

export interface IFileUpload extends FileUploadProps {
    /**
     * Specifies the DOM element FileUpload component.
     *
     * @private
     * @default null
     */
    element?: HTMLInputElement | null;
}

/**
 * Resolved prop shape for the FileUpload component: the public `FileUploadProps`
 * plus any extra native `<input>` attributes that the consumer spreads in
 * (these are forwarded to the hidden file input via `FileDropInput`).
 *
 * @private
 */
type IFileUploadProps = FileUploadProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof FileUploadProps>;

/**
 * Bundle of all non-stateful mutable references used by the FileUpload component.
 *
 * @private
 */
export interface FileUploadRefs {
    fileInputRef: RefObject<HTMLInputElement | null>;
    uploadButtonRef: RefObject<IButton | null>;
    dragCounterRef: RefObject<number>;
    uploadQueueRef: RefObject<FileItem[]>;
    retryAttemptsRef: RefObject<Map<string, number>>;
    wasUploadingRef: RefObject<boolean>;
    l10nRef: RefObject<IL10n | null>;
    currentFilesRef: RefObject<FileItem[]>;
    pendingRetriesRef: RefObject<Record<string, number>>;
}

const isChildOf: (node: ReactNode, Component: { displayName?: string }) => boolean =
    (node: ReactNode, Component: { displayName?: string }): boolean => {
        if (!isValidElement(node)) { return false; }
        const type: ReactElement['type'] = node.type;
        return type === Component || (type as { displayName?: string })?.displayName === Component.displayName;
    };

/**
 * The FileUpload component enables users to select and upload
 * files to a server with features like drag-and-drop, validation, chunked uploads, retry logic,
 * and progress tracking. It supports both single and multiple file uploads with sequential or
 * parallel processing.
 *
 * ```typescript
 * import { FileUpload } from "@syncfusion/react-inputs";
 *
 * export default function App() {
 *     return (
 *         <FileUpload
 *             saveUrl="https://services.syncfusion.com/react/production/api/FileUploader/Save"
 *             removeUrl="https://services.syncfusion.com/react/production/api/FileUploader/Remove"
 *         />
 *     );
 * }
 * ```
 */
export const FileUpload: React.ForwardRefExoticComponent<IFileUploadProps & React.RefAttributes<IFileUpload>> =
    forwardRef<IFileUpload, IFileUploadProps>((props: IFileUploadProps, ref: React.Ref<IFileUpload>) => {
        const {
            multiple = true,
            accept,
            directory = false,
            dragDropEnabled = true,
            disabled = false,
            name = 'UploadFiles',
            maxFiles,
            maxFileSize = 30000000,
            minFileSize = 0,
            files: controlledFiles,
            defaultFiles,
            saveUrl,
            removeUrl,
            method = 'POST',
            headers,
            withCredentials = false,
            additionalData,
            autoUpload = true,
            sequential = false,
            chunkSize,
            timeout = 30000,
            retryCount = 0,
            retryDelay = 1000,
            showRetry = true,
            showCancel = true,
            showRemove = true,
            showProgressBar = true,
            className = '',
            children,
            onSelect,
            onValidationError,
            onStart,
            onProgress,
            onSuccess,
            onError,
            onCancel,
            onPause,
            onResume,
            onRemove,
            onRetry,
            onChange,
            onComplete,
            dropArea,
            ...otherProps
        } = props;

        const { locale, dir } = useProviderContext();
        const [fileItems, setFileItems] = useState<FileItem[]>((): FileItem[] => {
            if (defaultFiles) { return defaultFiles; }
            return [];
        });
        const [isDragging, setIsDragging] = useState<boolean>(false);
        const [isUploading, setIsUploading] = useState<boolean>(false);
        const [pendingRetries, setPendingRetries] = useState<Record<string, number>>({});
        const [localeKey, setLocaleKey] = useState<string>('en');
        const isInternalDragDropEnabled: boolean = dragDropEnabled && !dropArea;
        const currentFiles: FileItem[] = useMemo((): FileItem[] => {
            return controlledFiles !== undefined ? controlledFiles : fileItems;
        }, [controlledFiles, fileItems]);
        const state: {
            fileItems: FileItem[];
            setFileItems: React.Dispatch<React.SetStateAction<FileItem[]>>;
            isDragging: boolean;
            setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
            isUploading: boolean;
            setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
            pendingRetries: Record<string, number>;
            setPendingRetries: React.Dispatch<React.SetStateAction<Record<string, number>>>;
            localeKey: string;
            setLocaleKey: React.Dispatch<React.SetStateAction<string>>;
            currentFiles: FileItem[];
        } = {
            fileItems, setFileItems,
            isDragging, setIsDragging,
            isUploading, setIsUploading,
            pendingRetries, setPendingRetries,
            localeKey, setLocaleKey,
            currentFiles
        };

        const fileInputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const uploadButtonRef: RefObject<IButton | null> = useRef<IButton>(null);
        const dragCounterRef: RefObject<number> = useRef<number>(0);
        const uploadQueueRef: RefObject<FileItem[]> = useRef<FileItem[]>([]);
        const retryAttemptsRef: RefObject<Map<string, number>> = useRef<Map<string, number>>(new Map());
        const wasUploadingRef: RefObject<boolean> = useRef<boolean>(false);
        const l10nRef: RefObject<IL10n | null> = useRef<IL10n | null>(null);
        const currentFilesRef: RefObject<FileItem[]> = useRef<FileItem[]>(currentFiles);
        const pendingRetriesRef: RefObject<Record<string, number>> = useRef<Record<string, number>>(pendingRetries);
        useEffect((): void => { currentFilesRef.current = currentFiles; }, [currentFiles]);
        useEffect((): void => { pendingRetriesRef.current = pendingRetries; }, [pendingRetries]);
        const refs: FileUploadRefs = {
            fileInputRef, uploadButtonRef, dragCounterRef, uploadQueueRef,
            retryAttemptsRef, wasUploadingRef, l10nRef,
            currentFilesRef, pendingRetriesRef
        };
        const [l10n, setL10n] = useState<IL10n | null>(
            (): IL10n => L10n('fileUpload', DEFAULT_FILEUPLOAD_TEXT, locale)
        );
        useEffect((): void => {
            setL10n(L10n('fileUpload', DEFAULT_FILEUPLOAD_TEXT, locale));
            setLocaleKey(locale);
        }, [locale]);
        useEffect((): (() => void) => {
            preRender('fileUpload');
            return (): void => {
                currentFilesRef.current.forEach((file: FileItem): void => {
                    file.xhr?.abort();
                });
            };
        }, []);

        const getLocalizedText: (key: string) => string = useCallback(
            (key: string): string => {
                return (l10n?.getConstant(key) as string) || DEFAULT_FILEUPLOAD_TEXT[key as string];
            },
            [l10n]
        );
        const getBrowseText: () => string = useCallback((): string => getLocalizedText('browse'), [getLocalizedText]);
        const getUploadText: () => string = useCallback((): string => getLocalizedText('upload'), [getLocalizedText]);
        const getClearText: () => string = useCallback((): string => getLocalizedText('clear'), [getLocalizedText]);
        const getDragDropText: () => string = useCallback((): string => getLocalizedText('dragDropText'), [getLocalizedText]);

        const handlers: ReturnType<typeof useFileUploadHandlers> = useFileUploadHandlers({
            multiple,
            accept,
            maxFileSize,
            minFileSize,
            maxFiles,
            autoUpload,
            directory,
            saveUrl,
            removeUrl,
            method,
            headers,
            withCredentials,
            additionalData,
            timeout,
            chunkSize,
            retryCount,
            retryDelay,
            name,
            controlledFiles,
            setFileItems: state.setFileItems,
            refs,
            setPendingRetries: state.setPendingRetries,
            l10n,
            onSelect,
            onValidationError,
            onStart,
            onProgress,
            onSuccess,
            onError,
            onCancel,
            onPause,
            onResume,
            onRemove,
            onRetry,
            onChange
        });

        const { uploadAll } = useUploadQueue(
            sequential,
            state.currentFiles,
            refs,
            handlers,
            state.setIsUploading
        );

        useRetryScheduler(state.pendingRetries, refs, handlers);

        const { allFilesUploaded, hasUploadableFiles, canClear } = useFileUploadCompletion(
            state.currentFiles,
            state.isUploading,
            refs,
            state.setIsUploading,
            onComplete
        );

        useEffect((): void => {
            if (autoUpload && !state.isUploading && refs.uploadQueueRef.current && refs.uploadQueueRef.current.length > 0) {
                uploadAll();
            }
        }, [autoUpload, state.isUploading, uploadAll]);

        useEffect((): void => {
            if (!autoUpload && state.currentFiles.length > 0 && refs.uploadButtonRef.current) {
                const buttonElement: HTMLElement | null | undefined = refs.uploadButtonRef.current.element;
                if (buttonElement) {
                    buttonElement.focus();
                }
            }
        }, [state.currentFiles.length, autoUpload, refs.uploadButtonRef]);

        const suppressDragEvent: (e: { preventDefault(): void; stopPropagation(): void }) => void =
            (e: { preventDefault(): void; stopPropagation(): void }): void => {
                e.preventDefault();
                e.stopPropagation();
            };

        const handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void = useCallback(
            (e: React.DragEvent<HTMLDivElement>): void => {
                suppressDragEvent(e);
                refs.dragCounterRef.current = (refs.dragCounterRef.current || 0) + 1;
                if (refs.dragCounterRef.current === 1) {
                    state.setIsDragging(true);
                }
            }, [refs.dragCounterRef, state.setIsDragging]);

        const handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void = useCallback(
            (e: React.DragEvent<HTMLDivElement>): void => {
                suppressDragEvent(e);
                refs.dragCounterRef.current = (refs.dragCounterRef.current || 0) - 1;
                if (refs.dragCounterRef.current === 0) {
                    state.setIsDragging(false);
                }
            }, [refs.dragCounterRef, state.setIsDragging]);

        const handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void = useCallback(
            (e: React.DragEvent<HTMLDivElement>): void => {
                suppressDragEvent(e);
            }, []);

        const handleDrop: (e: React.DragEvent<HTMLDivElement>) => void = useCallback(
            (e: React.DragEvent<HTMLDivElement>): void => {
                suppressDragEvent(e);
                state.setIsDragging(false);
                refs.dragCounterRef.current = 0;
                if (disabled) { return; }
                const dataTransfer: DataTransfer = e.dataTransfer;
                if (directory && !hasDirectoryInDataTransfer(dataTransfer)) {
                    handlers.handleInvalidDirectoryDrop(e.nativeEvent);
                    return;
                }
                if (directory) {
                    readDirectoryFileList(dataTransfer).then((fileList: FileList | null): void => {
                        if (fileList) {
                            handlers.handleFileSelect(fileList, e.nativeEvent);
                        }
                    });
                    return;
                }
                const files: FileList = dataTransfer.files;
                handlers.handleFileSelect(files, e.nativeEvent);
            }, [disabled, directory, handlers, refs.dragCounterRef, state.setIsDragging]
        );

        const handleBrowseClick: () => void = useCallback(
            (): void => {
                refs.fileInputRef.current?.click();
            }, [refs.fileInputRef]);

        const handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>): void => {
                handlers.handleFileSelect(e.target.files, e.nativeEvent);
            }, [handlers.handleFileSelect]);
        useDropArea({
            dropArea,
            disabled,
            directory,
            dragDropEnabled,
            onFiles: (files: FileList, event: Event): void => {
                handlers.handleFileSelect(files, event);
            },
            onInvalidDirectoryDrop: (event: Event): void => {
                handlers.handleInvalidDirectoryDrop(event);
            }
        });

        const jsxChildren: ReactNode[] = Array.isArray(children)
            ? (children as ReactNode[])
            : children !== null && children !== undefined
                ? [children as ReactNode]
                : [];
        const { browseButton, dragHint, fileList, actions } = useMemo(() => {
            let browseButton: ReactNode = null;
            let dragHint: ReactNode = null;
            let fileList: ReactNode = null;
            let actions: ReactNode = null;
            Children.toArray(jsxChildren).forEach((child: ReactNode) => {
                if (isChildOf(child, BrowseButton)) {
                    browseButton = child;
                    return;
                }
                if (isChildOf(child, DragHint)) {
                    dragHint = child;
                    return;
                }
                if (isChildOf(child, FileList)) {
                    fileList = child;
                    return;
                }
                if (isChildOf(child, Actions)) {
                    actions = child;
                    return;
                }
            });
            return { browseButton, dragHint, fileList, actions };
        }, [jsxChildren]);

        const rowHelpers: FileUploadContextValue['helpers'] = useMemo(() => {
            const runForFile: (fileId: string, apply: (item: FileItem) => void) => void =
                (fileId: string, apply: (item: FileItem) => void): void => {
                    const target: FileItem | undefined = currentFilesRef.current.find((file: FileItem) => file.id === fileId);
                    if (target) { apply(target); }
                };
            return {
                retry:   (id: string): void => runForFile(id, handlers.handleRetry),
                cancel:  (id: string): void => runForFile(id, handlers.handleCancel),
                remove:  (id: string): void => runForFile(id, handlers.handleRemove),
                pause:   (id: string): void => runForFile(id, handlers.handlePause),
                resume:  (id: string): void => runForFile(id, handlers.handleResume)
            };
        }, [handlers]);

        const contextValue: FileUploadContextValue = useMemo(() => ({
            files: state.currentFiles,
            isUploading: state.isUploading,
            l10n,
            handlers,
            config: {
                saveUrl,
                removeUrl,
                showRetry,
                showCancel,
                showRemove,
                showProgressBar,
                dragDropEnabled: isInternalDragDropEnabled,
                disabled,
                autoUpload
            },
            helpers: rowHelpers,
            browseLabel: getBrowseText(),
            uploadLabel: getUploadText(),
            clearLabel: getClearText(),
            dragDropLabel: getDragDropText(),
            canUpload: hasUploadableFiles,
            canClear,
            allFilesUploaded,
            uploadAll,
            onClear: handlers.handleClear,
            triggerBrowse: handleBrowseClick
        }), [
            state, l10n, handlers, saveUrl, removeUrl, dragDropEnabled,
            disabled, autoUpload, rowHelpers, getBrowseText,
            getUploadText, getClearText, getDragDropText, handleBrowseClick, hasUploadableFiles,
            canClear, allFilesUploaded, uploadAll, children
        ]);

        const publicAPI: Partial<IFileUploadProps> = useMemo((): Partial<IFileUploadProps> => ({
            multiple,
            accept,
            directory,
            dragDropEnabled,
            disabled,
            name,
            maxFiles,
            maxFileSize,
            minFileSize,
            files: controlledFiles,
            defaultFiles,
            saveUrl,
            removeUrl,
            method,
            headers,
            withCredentials,
            additionalData,
            autoUpload,
            sequential,
            chunkSize,
            timeout,
            retryCount,
            retryDelay,
            showRetry,
            showCancel,
            showRemove,
            showProgressBar,
            className,
            children,
            onSelect,
            onValidationError,
            onStart,
            onProgress,
            onSuccess,
            onError,
            onCancel,
            onPause,
            onResume,
            onRemove,
            onRetry,
            onChange,
            onComplete,
            dropArea
        }), [
            multiple, accept, directory, dragDropEnabled, disabled, name, maxFiles, maxFileSize,
            minFileSize, controlledFiles, defaultFiles, saveUrl, removeUrl, method,
            headers, withCredentials, additionalData, autoUpload, sequential,
            chunkSize, timeout, retryCount, retryDelay, showRetry,
            showCancel, showRemove, showProgressBar, className,
            children, onSelect, onValidationError, onStart, onProgress,
            onSuccess, onError, onCancel, onPause,
            onResume, onRemove, onRetry, onChange, onComplete, dropArea
        ]);

        useImperativeHandle(
            ref,
            () => ({
                ...publicAPI as IFileUpload,
                element: refs.fileInputRef.current
            }),
            [publicAPI, refs.fileInputRef]
        );

        const fileUploadClassName: string = useMemo((): string => {
            return combineClasses(
                FILEUPLOAD_CLASSES.uploadContainer,
                FILEUPLOAD_CLASSES.control,
                className,
                disabled && FILEUPLOAD_CLASSES.disabled,
                state.isDragging && FILEUPLOAD_CLASSES.dragging,
                dir === 'rtl' && FILEUPLOAD_CLASSES.rtl,
                !autoUpload && FILEUPLOAD_CLASSES.autoUploadDisabled
            );
        }, [className, disabled, state.isDragging, dir, autoUpload]);

        const browseRow: ReactNode = (
            <div className={combineClasses(
                FILEUPLOAD_CLASSES.fileSelectWrap,
                !isInternalDragDropEnabled && FILEUPLOAD_CLASSES.dragDropDisabled
            )}>
                {browseButton ?? <BrowseButton disabled={disabled} />}
                {dragHint ?? (isInternalDragDropEnabled ? <DragHint /> : null)}
            </div>
        );
        const fileListZone: ReactNode = fileList ?? (
            <FileList />
        );
        const actionsZone: ReactNode = actions ?? (
            <Actions>
                <UploadButton />
                <ClearButton />
            </Actions>
        );

        return (
            <FileUploadContext.Provider value={contextValue}>
                <div
                    className={fileUploadClassName}
                    onDragEnter={isInternalDragDropEnabled ? handleDragEnter : undefined}
                    onDragLeave={isInternalDragDropEnabled ? handleDragLeave : undefined}
                    onDragOver={isInternalDragDropEnabled ? handleDragOver : undefined}
                    onDrop={isInternalDragDropEnabled ? handleDrop : undefined}
                >
                    <FileDropInput
                        inputRef={refs.fileInputRef}
                        name={name}
                        multiple={multiple}
                        accept={accept}
                        disabled={disabled}
                        directory={directory}
                        onChange={handleInputChange}
                        extraProps={otherProps}
                    />

                    {browseRow}
                    {fileListZone}
                    {actionsZone}
                </div>
            </FileUploadContext.Provider>
        );
    });

export default FileUpload;
