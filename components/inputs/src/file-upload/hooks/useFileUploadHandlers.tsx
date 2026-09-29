import { Dispatch, SetStateAction, useCallback, useEffect } from 'react';
import { IL10n } from '@syncfusion/react-base';
import { FileItem, UploadError, ValidationError, UploadRequestConfig, HTTPMethod, FILE_STATUS, HTTP_METHOD } from '../types';
import { validateFiles, createFileItem, validateDirectoryDrop } from '../utils';
import { uploadFile, uploadFileChunked, removeFile } from '../file-upload-service';
import type { FileUploadRefs } from '../file-upload';

/**
 * @private
 */
export interface FileUploadHandlersOptions {
    multiple: boolean;
    accept: string | string[] | undefined;
    maxFileSize: number;
    minFileSize: number;
    maxFiles: number | undefined;
    autoUpload: boolean;
    directory: boolean;
    saveUrl: string | undefined;
    removeUrl: string | undefined;
    method: HTTPMethod;
    headers: Record<string, string> | undefined;
    withCredentials: boolean;
    additionalData: Record<string, unknown> | undefined;
    timeout: number;
    chunkSize: number | undefined;
    retryCount: number;
    retryDelay: number;
    name: string;
    controlledFiles: FileItem[] | undefined;
    setFileItems: Dispatch<SetStateAction<FileItem[]>>;
    refs: FileUploadRefs;
    setPendingRetries: Dispatch<SetStateAction<Record<string, number>>>;
    l10n: IL10n | null;
    onSelect?: (args: { files: FileItem[]; event: Event }) => void;
    onValidationError?: (args: { file: File; error: ValidationError }) => void;
    onStart?: (args: { file: FileItem }) => void;
    onProgress?: (args: { file: FileItem; percent: number; event: ProgressEvent }) => void;
    onSuccess?: (args: { file: FileItem; response: unknown }) => void;
    onError?: (args: { file: FileItem; error: UploadError }) => void;
    onCancel?: (args: { file: FileItem }) => void;
    onPause?: (args: { file: FileItem }) => void;
    onResume?: (args: { file: FileItem }) => void;
    onRemove?: (args: { file: FileItem }) => void;
    onRetry?: (args: { file: FileItem }) => void;
    onChange?: (args: { files: FileItem[] }) => void;
}

/**
 * Bundle of all FileUpload event handlers. `updateFileItems` is the single
 * funnel for list mutations: it updates internal state in uncontrolled
 * mode and only fires `onChange` in controlled mode.
 *
 * @private
 */
export interface FileUploadHandlers {
    updateFileItems: (updater: FileItem[] | ((prev: FileItem[]) => FileItem[])) => void;
    handleFileSelect: (files: FileList | null, event: Event) => void;
    handleInvalidDirectoryDrop: (event: Event) => void;
    handleProgress: (fileItem: FileItem, percent: number, event: ProgressEvent) => void;
    handleSuccess: (fileItem: FileItem, response: unknown) => void;
    handleError: (fileItem: FileItem, error: UploadError) => void;
    startUpload: (fileItem: FileItem) => void;
    handleRetry: (fileItem: FileItem) => void;
    handleCancel: (fileItem: FileItem) => void;
    handleRemove: (fileItem: FileItem) => void;
    handleClear: () => void;
    handlePause: (fileItem: FileItem) => void;
    handleResume: (fileItem: FileItem) => void;
}

/**
 * Provides every event handler used by the FileUpload. Validates files,
 * applies list updates through `updateFileItems`, drives the XHR / chunked
 * upload lifecycle, and tracks retry attempts.
 *
 * @private
 * @param {FileUploadHandlersOptions} options - Bundle of props, refs, setters, and callbacks.
 * @returns {FileUploadHandlers} Memoized bundle of all event handlers.
 */
export const useFileUploadHandlers: (options: FileUploadHandlersOptions) => FileUploadHandlers = (
    options: FileUploadHandlersOptions
): FileUploadHandlers => {
    const {
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
        setFileItems,
        refs,
        setPendingRetries,
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
    } = options;

    const updateFileItems: (updater: FileItem[] | ((prev: FileItem[]) => FileItem[])) => void = useCallback(
        (updater: FileItem[] | ((prev: FileItem[]) => FileItem[])): void => {
            if (controlledFiles === undefined) {
                if (typeof updater === 'function') {
                    setFileItems((prev: FileItem[]): FileItem[] => updater(prev));
                } else {
                    setFileItems(updater);
                }
            }

            const newFiles: FileItem[] = typeof updater === 'function'
                ? updater(refs.currentFilesRef.current)
                : updater;
            onChange?.({ files: newFiles });
        },
        [controlledFiles, refs.currentFilesRef, setFileItems, onChange]
    );

    const handleFileSelect: (files: FileList | null, event: Event) => void = useCallback(
        (files: FileList | null, event: Event): void => {
            if (!files || files.length === 0) { return; }
            const filesArray: File[] = Array.from(files);
            const { validFiles, errors } = validateFiles(filesArray, {
                accept,
                maxFileSize,
                minFileSize,
                maxFiles,
                existingFiles: refs.currentFilesRef.current,
                l10n
            });
            errors.forEach((error: ValidationError): void => {
                if (error.file) {
                    onValidationError?.({ file: error.file, error });
                }
            });
            const errorFileItems: FileItem[] = errors
                .map((error: ValidationError): FileItem | null => {
                    if (!error.file) { return null; }
                    return {
                        ...createFileItem(error.file),
                        status: FILE_STATUS.error,
                        error
                    };
                })
                .filter((item: FileItem | null): item is FileItem => item !== null);

            const newFileItems: FileItem[] = validFiles.map(createFileItem);
            const allNewItems: FileItem[] = [...errorFileItems, ...newFileItems];

            if (allNewItems.length === 0) { return; }
            updateFileItems((prev: FileItem[]): FileItem[] => {
                const base: FileItem[] = multiple ? prev : [];
                return [...base, ...allNewItems];
            });

            if (newFileItems.length > 0) {
                onSelect?.({ files: newFileItems, event });
            }

            if (autoUpload && saveUrl && newFileItems.length > 0) {
                refs.uploadQueueRef.current?.push(...newFileItems);
            }

            if (refs.fileInputRef.current) {
                refs.fileInputRef.current.value = '';
            }
        },
        [accept, maxFileSize, minFileSize, maxFiles, multiple, autoUpload, saveUrl,
            onSelect, onValidationError, updateFileItems,
            refs.currentFilesRef, refs.uploadQueueRef, refs.fileInputRef, l10n]
    );

    const handleInvalidDirectoryDrop: (event: Event) => void = useCallback(
        (event: Event): void => {
            const dataTransfer: DataTransfer | null =
                (event as DragEvent).dataTransfer ?? null;
            const error: ValidationError | null = validateDirectoryDrop(dataTransfer, directory, l10n);
            if (error) {
                onValidationError?.({ file: new File([], ''), error });
            }
        },
        [directory, l10n, onValidationError]
    );

    const handleProgress: (fileItem: FileItem, percent: number, event: ProgressEvent) => void = useCallback(
        (fileItem: FileItem, percent: number, event: ProgressEvent): void => {
            updateFileItems((prev: FileItem[]): FileItem[] =>
                prev.map((item: FileItem): FileItem =>
                    item.id === fileItem.id ? { ...item, progress: percent } : item
                )
            );
            onProgress?.({ file: fileItem, percent, event });
        },
        [updateFileItems, onProgress]
    );

    const handleSuccess: (fileItem: FileItem, response: unknown) => void = useCallback(
        (fileItem: FileItem, response: unknown): void => {
            updateFileItems((prev: FileItem[]): FileItem[] =>
                prev.map((item: FileItem): FileItem =>
                    item.id === fileItem.id
                        ? {
                            ...item,
                            status: FILE_STATUS.success,
                            progress: 100,
                            response,
                            completed: new Date()
                        }
                        : item
                )
            );
            onSuccess?.({ file: { ...fileItem, status: FILE_STATUS.success, response }, response });
        },
        [updateFileItems, onSuccess]
    );

    const handleError: (fileItem: FileItem, error: UploadError) => void = useCallback(
        (fileItem: FileItem, error: UploadError): void => {
            const attempts: number = refs.retryAttemptsRef.current?.get(fileItem.id) || 0;
            if (attempts < retryCount) {
                refs.retryAttemptsRef.current?.set(fileItem.id, attempts + 1);
                setPendingRetries((prev: Record<string, number>): Record<string, number> => ({
                    ...prev,
                    [fileItem.id]: Date.now() + retryDelay
                }));
            } else {
                updateFileItems((prev: FileItem[]): FileItem[] =>
                    prev.map((item: FileItem): FileItem =>
                        item.id === fileItem.id
                            ? {
                                ...item,
                                status: FILE_STATUS.error,
                                error,
                                completed: new Date()
                            }
                            : item
                    )
                );
                onError?.({ file: { ...fileItem, status: FILE_STATUS.error, error }, error });
            }
        },
        [retryCount, retryDelay, updateFileItems, onError, refs.retryAttemptsRef, setPendingRetries]
    );

    const startUpload: (fileItem: FileItem) => void = useCallback(
        (fileItem: FileItem): void => {
            if (!saveUrl) {
                return;
            }
            updateFileItems((prev: FileItem[]): FileItem[] =>
                prev.map((item: FileItem): FileItem =>
                    item.id === fileItem.id
                        ? { ...item, status: FILE_STATUS.uploading, started: new Date() }
                        : item
                )
            );
            onStart?.({ file: fileItem });
            const config: UploadRequestConfig = {
                url: saveUrl,
                method,
                headers,
                withCredentials,
                additionalData,
                timeout,
                name
            };

            if (chunkSize && fileItem.size > chunkSize) {
                const chunkUpload: ReturnType<typeof uploadFileChunked> = uploadFileChunked({
                    ...config,
                    chunkSize,
                    file: fileItem.file,
                    fileItem,
                    onProgress: (percent: number, event: ProgressEvent) => handleProgress(fileItem, percent, event),
                    onSuccess: (response: unknown) => handleSuccess(fileItem, response),
                    onError: (error: UploadError) => handleError(fileItem, error)
                });

                updateFileItems((prev: FileItem[]): FileItem[] =>
                    prev.map((item: FileItem): FileItem =>
                        item.id === fileItem.id
                            ? {
                                ...item, chunkController: {
                                    pause: chunkUpload.pause, resume: chunkUpload.resume,
                                    cancel: chunkUpload.cancel
                                }
                            }
                            : item
                    )
                );
            } else {
                const xhr: XMLHttpRequest = uploadFile(
                    fileItem,
                    config,
                    (percent: number, event: ProgressEvent) => handleProgress(fileItem, percent, event),
                    (response: unknown) => handleSuccess(fileItem, response),
                    (error: UploadError) => handleError(fileItem, error)
                );
                updateFileItems((prev: FileItem[]): FileItem[] =>
                    prev.map((item: FileItem): FileItem =>
                        item.id === fileItem.id ? { ...item, xhr } : item
                    )
                );
            }
        },
        [saveUrl, method, headers, withCredentials, additionalData, timeout, chunkSize,
            onStart, updateFileItems, handleProgress, handleSuccess, handleError, name]
    );

    const handleRetry: (fileItem: FileItem) => void = useCallback(
        (fileItem: FileItem): void => {
            refs.retryAttemptsRef.current?.delete(fileItem.id);
            onRetry?.({ file: fileItem });
            startUpload(fileItem);
        },
        [onRetry, startUpload, refs.retryAttemptsRef]
    );

    const handleCancel: (fileItem: FileItem) => void = useCallback(
        (fileItem: FileItem): void => {
            if (fileItem.chunkController) {
                fileItem.chunkController.cancel();
            } else if (fileItem.xhr) {
                fileItem.xhr.abort();
            }

            updateFileItems((prev: FileItem[]): FileItem[] =>
                prev.map((item: FileItem): FileItem =>
                    item.id === fileItem.id
                        ? { ...item, status: FILE_STATUS.canceled, completed: new Date(), chunkController: undefined }
                        : item
                )
            );
            onCancel?.({ file: fileItem });
        },
        [onCancel, updateFileItems]
    );

    const handleRemove: (fileItem: FileItem) => void = useCallback(
        (fileItem: FileItem): void => {
            const afterRemove: () => void = (): void => {
                updateFileItems((prev: FileItem[]): FileItem[] => prev.filter((item: FileItem): boolean => item.id !== fileItem.id));
                onRemove?.({ file: fileItem });
            };
            if (removeUrl && fileItem.status === FILE_STATUS.success) {
                removeFile(
                    fileItem,
                    { url: removeUrl, method: HTTP_METHOD.POST, headers, withCredentials, name },
                    afterRemove, afterRemove );
            } else {
                afterRemove();
            }
        },
        [removeUrl, headers, withCredentials, name, onRemove, updateFileItems]
    );

    const handleClear: () => void = useCallback(
        (): void => {
            updateFileItems([]);
        },
        [updateFileItems]
    );

    const handlePause: (fileItem: FileItem) => void = useCallback(
        (fileItem: FileItem): void => {
            if (fileItem.chunkController) {
                fileItem.chunkController.pause();
            } else if (fileItem.xhr) {
                fileItem.xhr.abort();
            }
            updateFileItems((prev: FileItem[]): FileItem[] =>
                prev.map((item: FileItem): FileItem =>
                    item.id === fileItem.id
                        ? { ...item, status: FILE_STATUS.paused }
                        : item
                )
            );
            onPause?.({ file: { ...fileItem, status: FILE_STATUS.paused } });
        },
        [updateFileItems, onPause]
    );

    const handleResume: (fileItem: FileItem) => void = useCallback(
        (fileItem: FileItem): void => {
            if (fileItem.chunkController) {
                updateFileItems((prev: FileItem[]): FileItem[] =>
                    prev.map((item: FileItem): FileItem =>
                        item.id === fileItem.id ? { ...item, status: FILE_STATUS.uploading } : item
                    )
                );
                fileItem.chunkController.resume();
            } else {
                startUpload(fileItem);
            }
            onResume?.({ file: { ...fileItem, status: FILE_STATUS.uploading } });
        },
        [startUpload, updateFileItems, onResume]
    );

    useEffect((): () => void => {
        return (): void => {
            refs.currentFilesRef.current.forEach((file: FileItem): void => {
                file.chunkController?.cancel();
                file.xhr?.abort();
            });
        };
    }, [refs.currentFilesRef]);

    return {
        updateFileItems,
        handleFileSelect,
        handleInvalidDirectoryDrop,
        handleProgress,
        handleSuccess,
        handleError,
        startUpload,
        handleRetry,
        handleCancel,
        handleRemove,
        handleClear,
        handlePause,
        handleResume
    };
};
