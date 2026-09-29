import { RefObject, useCallback, useEffect, useState } from 'react';
import { hasDirectoryInDataTransfer, readDirectoryFileList } from './utils';

export interface UseDropAreaOptions {
    dropArea?: RefObject<HTMLElement>;
    disabled: boolean;
    directory?: boolean;
    dragDropEnabled?: boolean;
    onFiles: (files: FileList, event: Event) => void;
    onInvalidDirectoryDrop?: (event: Event) => void;
}

export interface UseDropAreaResult {
    /**
     * Specifies, whether the drop area is currently being dragged over.
     * Apply a class or `data-drag-over` attribute declaratively
     * in JSX instead of imperatively via `classList`.
     * @private
     */
    isDragOver: boolean;
}

const suppressDragEvent: (e: DragEvent) => void = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
};

/**
 * Tracks drag-and-drop state for the provided element using React state.
 * Returns `isDragOver` so the consumer can apply the drag-hover styling
 * declaratively (via class or `data-drag-over` attribute) instead of
 * imperatively calling `classList.add` / `classList.remove` on the target.
 *
 * @param {UseDropAreaOptions} options Drop-area configuration and callbacks.
 * @returns {UseDropAreaResult} Current drag-over flag.
 * @private
 */
export const useDropArea: (options: UseDropAreaOptions) => UseDropAreaResult = (
    { dropArea, disabled, directory = false, dragDropEnabled = true, onFiles, onInvalidDirectoryDrop }: UseDropAreaOptions
): UseDropAreaResult => {
    const [isDragOver, setIsDragOver] = useState<boolean>(false);

    const handleFiles: (files: FileList, event: Event) => void = useCallback(
        (files: FileList, event: Event): void => { onFiles(files, event); },
        [onFiles]
    );

    const handleInvalidDirectoryDrop: (event: Event) => void = useCallback(
        (event: Event): void => { onInvalidDirectoryDrop?.(event); },
        [onInvalidDirectoryDrop]
    );

    useEffect((): (() => void) | void => {
        if (!dropArea) { return; }
        if (!dragDropEnabled) { return; }
        const target: HTMLElement | null = dropArea.current;
        if (!target) { return; }
        let dragCounter: number = 0;

        const onDragEnter: (e: DragEvent) => void = (e: DragEvent): void => {
            suppressDragEvent(e);
            dragCounter += 1;
            if (dragCounter === 1) {
                setIsDragOver(true);
            }
        };

        const onDragLeave: (e: DragEvent) => void = (e: DragEvent): void => {
            suppressDragEvent(e);
            dragCounter -= 1;
            if (dragCounter <= 0) {
                dragCounter = 0;
                setIsDragOver(false);
            }
        };

        const onDragOver: (e: DragEvent) => void = (e: DragEvent): void => {
            suppressDragEvent(e);
        };

        const onDrop: (e: DragEvent) => void = (e: DragEvent): void => {
            suppressDragEvent(e);
            dragCounter = 0;
            setIsDragOver(false);
            if (disabled) { return; }
            if (directory && !hasDirectoryInDataTransfer(e.dataTransfer ?? null)) {
                handleInvalidDirectoryDrop(e);
                return;
            }
            if (directory && e.dataTransfer) {
                readDirectoryFileList(e.dataTransfer).then((fileList: FileList | null): void => {
                    if (fileList) {
                        handleFiles(fileList, e);
                    }
                });
                return;
            }
            if (e.dataTransfer?.files) {
                handleFiles(e.dataTransfer.files, e);
            }
        };

        target.addEventListener('dragenter', onDragEnter);
        target.addEventListener('dragleave', onDragLeave);
        target.addEventListener('dragover', onDragOver);
        target.addEventListener('drop', onDrop);

        return (): void => {
            target.removeEventListener('dragenter', onDragEnter);
            target.removeEventListener('dragleave', onDragLeave);
            target.removeEventListener('dragover', onDragOver);
            target.removeEventListener('drop', onDrop);
            setIsDragOver(false);
        };
    }, [dropArea, disabled, directory, dragDropEnabled, handleFiles, handleInvalidDirectoryDrop]);

    return { isDragOver };
};
