import { useEffect } from 'react';
import { FileItem } from '../types';
import type { FileUploadRefs } from '../file-upload';
import { FileUploadHandlers } from './useFileUploadHandlers';
import { FILEUPLOAD_RETRY } from '../constant';

/**
 * Polls `pendingRetries` every 100ms and re-starts any upload whose retry
 * deadline has passed. The interval is only active when there is at least
 * one pending retry.
 *
 * @private
 * @param {Object} pendingRetries - Map of fileId → retry timestamp (ms epoch).
 * @param {FileUploadRefs} refs - Shared ref bundle (`pendingRetriesRef` + `currentFilesRef` are read).
 * @param {FileUploadHandlers} handlers - Handler bundle (uses `startUpload`).
 * @returns {void}
 */
export const useRetryScheduler: (
    pendingRetries: Record<string, number>,
    refs: FileUploadRefs,
    handlers: FileUploadHandlers
) => void = (
    pendingRetries: Record<string, number>,
    refs: FileUploadRefs,
    handlers: FileUploadHandlers
): void => {
    const { startUpload } = handlers;

    useEffect((): void | (() => void) => {
        if (Object.keys(pendingRetries).length === 0) { return; }
        const interval: ReturnType<typeof setInterval> = setInterval((): void => {
            const now: number = Date.now();
            const toRetry: string[] = [];
            Object.entries(refs.pendingRetriesRef.current).forEach(
                ([fileId, retryTime]: [string, number]): void => {
                    if (now >= retryTime) {
                        toRetry.push(fileId);
                    }
                }
            );
            if (toRetry.length === 0) { return; }
            toRetry.forEach((fileId: string): void => {
                const fileItem: FileItem | undefined = refs.currentFilesRef.current.find(
                    (file: FileItem): boolean => file.id === fileId
                );
                if (fileItem) {
                    startUpload(fileItem);
                }
            });
        }, FILEUPLOAD_RETRY.pollInterval);

        return (): void => clearInterval(interval);
    }, [startUpload, refs.pendingRetriesRef, refs.currentFilesRef, pendingRetries]);
};
