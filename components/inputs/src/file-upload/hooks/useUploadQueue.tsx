import { Dispatch, SetStateAction, useCallback, useEffect } from 'react';
import { FileItem, FILE_STATUS } from '../types';
import type { FileUploadRefs } from '../file-upload';
import { FileUploadHandlers } from './useFileUploadHandlers';
import { hasValidationError } from '../utils';

/**
 * Owns the upload-queue lifecycle. `uploadAll()` starts every file in
 * `idle | queued | error` state, serially in sequential mode and in
 * parallel otherwise.
 *
 * @private
 */
export interface UseUploadQueueResult {
    uploadAll: () => void;
}

/**
 * Owns the upload-queue lifecycle. `uploadAll()` starts every file in
 * `idle | queued | error` state, serially in sequential mode and in
 * parallel otherwise.
 *
 * @private
 * @param {boolean} sequential - Whether uploads must be serialized.
 * @param {FileItem[]} currentFiles - Latest visible file list.
 * @param {FileUploadRefs} refs - Shared ref bundle from `useFileUploadRefs`.
 * @param {FileUploadHandlers} handlers - Handler bundle (uses `startUpload`).
 * @param {Function} setIsUploading - Setter for the in-flight flag.
 * @returns {UseUploadQueueResult} Bundle exposing `uploadAll`.
 */
export const useUploadQueue: (
    sequential: boolean,
    currentFiles: FileItem[],
    refs: FileUploadRefs,
    handlers: FileUploadHandlers,
    setIsUploading: Dispatch<SetStateAction<boolean>>
) => UseUploadQueueResult = (
    sequential: boolean,
    currentFiles: FileItem[],
    refs: FileUploadRefs,
    handlers: FileUploadHandlers,
    setIsUploading: Dispatch<SetStateAction<boolean>>
): UseUploadQueueResult => {
    const { startUpload } = handlers;

    const uploadAll: () => void = useCallback((): void => {
        const filesToUpload: FileItem[] = currentFiles.filter(
            (item: FileItem): boolean => (
                item.status === FILE_STATUS.idle ||
                item.status === FILE_STATUS.queued ||
                item.status === FILE_STATUS.error
            ) && !hasValidationError(item)
        );
        if (filesToUpload.length === 0) { return; }
        setIsUploading(true);
        if (sequential) {
            refs.uploadQueueRef.current = [...filesToUpload];
            const firstFile: FileItem | undefined = refs.uploadQueueRef.current?.shift();
            if (firstFile) { startUpload(firstFile); }
        } else {
            refs.uploadQueueRef.current = [];
            filesToUpload.forEach((item: FileItem): void => startUpload(item));
        }
    }, [currentFiles, sequential, startUpload, refs.uploadQueueRef, setIsUploading]);

    useEffect((): void => {
        if (refs.uploadQueueRef.current && refs.uploadQueueRef.current.length > 0) {
            if (sequential) {
                const hasActiveUpload: boolean = refs.currentFilesRef.current.some(
                    (item: FileItem): boolean => item.status === FILE_STATUS.uploading
                );

                if (!hasActiveUpload) {
                    const nextFileFromQueue: FileItem | undefined = refs.uploadQueueRef.current?.shift();
                    if (nextFileFromQueue) {
                        const actualFileItem: FileItem | undefined = refs.currentFilesRef.current.find(
                            (file: FileItem): boolean => file.id === nextFileFromQueue.id
                        );
                        if (actualFileItem && actualFileItem.status === FILE_STATUS.idle) {
                            startUpload(actualFileItem);
                        }
                    }
                }
            } else {
                const filesToStart: FileItem[] = [...refs.uploadQueueRef.current];
                refs.uploadQueueRef.current = [];
                filesToStart.forEach((queuedFile: FileItem): void => {
                    const actualFileItem: FileItem | undefined = refs.currentFilesRef.current.find(
                        (file: FileItem): boolean => file.id === queuedFile.id
                    );
                    if (actualFileItem && actualFileItem.status === FILE_STATUS.idle) {
                        startUpload(actualFileItem);
                    }
                });
            }
        }
    }, [sequential, startUpload, refs.uploadQueueRef, refs.currentFilesRef]);

    return { uploadAll };
};
