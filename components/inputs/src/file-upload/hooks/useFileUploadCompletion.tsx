import { Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import { FileItem, FILE_STATUS, FileStatus } from '../types';
import type { FileUploadRefs } from '../file-upload';
import { hasValidationError } from '../utils';

/**
 * Detects upload completion and fires `onComplete` when a batch
 * transitions from "some files uploading" to "no files uploading or queued".
 *
 * @private
 */
export interface UseFileUploadCompletionResult {
    allFilesUploaded: boolean;
    hasUploadableFiles: boolean;
    canClear: boolean;
}

const UPLOADABLE_STATUSES: Set<FileStatus> = new Set([
    FILE_STATUS.idle,
    FILE_STATUS.queued,
    FILE_STATUS.ready
]);

/**
 * Detects upload completion and fires `onComplete` when a batch
 * transitions from "some files uploading" to "no files uploading or queued".
 *
 * @private
 * @param {FileItem[]} currentFiles - Latest visible file list.
 * @param {boolean} isUploading - Whether any upload is currently in flight.
 * @param {FileUploadRefs} refs - Shared ref bundle (`wasUploadingRef` is the edge-detector).
 * @param {Function} setIsUploading - Setter for the in-flight flag.
 * @param {Function} [onComplete] - Consumer callback fired once per batch.
 * @returns {UseFileUploadCompletionResult} Derived flags: `allFilesUploaded`, `hasUploadableFiles`, `canClear`.
 */
export const useFileUploadCompletion: (
    currentFiles: FileItem[],
    isUploading: boolean,
    refs: FileUploadRefs,
    setIsUploading: Dispatch<SetStateAction<boolean>>,
    onComplete?: (args: { files: FileItem[]; failedCount: number }) => void
) => UseFileUploadCompletionResult = (
    currentFiles: FileItem[],
    isUploading: boolean,
    refs: FileUploadRefs,
    setIsUploading: Dispatch<SetStateAction<boolean>>,
    onComplete?: (args: { files: FileItem[]; failedCount: number }) => void
): UseFileUploadCompletionResult => {
    const { wasUploadingRef } = refs;

    useEffect(() => {
        if (isUploading) {
            wasUploadingRef.current = true;
        }
    }, [isUploading]);

    useEffect(() => {
        if (currentFiles.length === 0) {
            wasUploadingRef.current = false;
            return;
        }
        if (!isUploading) {
            return;
        }
        const hasActiveUploads: boolean = currentFiles.some(
            (file: FileItem) =>
                file.status === FILE_STATUS.uploading ||
                file.status === FILE_STATUS.queued
        );

        if (!hasActiveUploads && wasUploadingRef.current) {
            wasUploadingRef.current = false;
            setIsUploading(false);
            const failedFiles: FileItem[] = currentFiles.filter(
                (file: FileItem): boolean => file.status === FILE_STATUS.error
            );
            if (onComplete) {
                onComplete?.({ files: currentFiles, failedCount: failedFiles.length });
            }
        }
    }, [currentFiles, isUploading, setIsUploading, onComplete]);
    const allFilesUploaded: boolean = useMemo((): boolean => {
        if (!currentFiles || currentFiles.length === 0) {
            return false;
        }
        const validFiles: FileItem[] = currentFiles.filter((file: FileItem) => !hasValidationError(file));
        if (validFiles.length === 0) {
            return false;
        }
        return validFiles.every((file: FileItem) => file.status === FILE_STATUS.success);
    }, [currentFiles]);

    const hasUploadableFiles: boolean = useMemo((): boolean => {
        if (!currentFiles || currentFiles.length === 0 || isUploading) {
            return false;
        }
        return currentFiles.some(
            (file: FileItem) =>
                UPLOADABLE_STATUSES.has(file.status) && !hasValidationError(file)
        );
    }, [currentFiles, isUploading]);

    const canClear: boolean = useMemo((): boolean => {
        return currentFiles.length > 0 && !isUploading;
    }, [currentFiles.length, isUploading]);

    return { allFilesUploaded, hasUploadableFiles, canClear };
};
