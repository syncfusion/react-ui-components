import { FC, JSX, memo, ReactNode, useCallback } from 'react';
import { Button } from '@syncfusion/react-buttons';
import { Color, IL10n, Variant } from '@syncfusion/react-base';
import { CircleRemoveIcon, CloseIcon, PauseIcon, PlayIcon, RefreshIcon, TrashIcon } from '@syncfusion/react-icons';
import { FileItem, FILE_STATUS } from './types';
import { formatFileSize, getLocalized, getStatusClass, getStatusText, getStatusTextClass, combineClasses, isRetryableError } from './utils';
import { FILEUPLOAD_CLASSES } from './constant';

const IDLE_STATUSES: ReadonlySet<string> = new Set([FILE_STATUS.idle, FILE_STATUS.queued, FILE_STATUS.canceled]);

export interface FileListItemProps {
    fileItem: FileItem;
    showRetry?: boolean;
    showCancel?: boolean;
    showRemove?: boolean;
    showProgressBar?: boolean;
    onRetry?: (fileItem: FileItem) => void;
    onCancel?: (fileItem: FileItem) => void;
    onRemove?: (fileItem: FileItem) => void;
    onPause?: (fileItem: FileItem) => void;
    onResume?: (fileItem: FileItem) => void;
    children?: (fileItem: FileItem) => ReactNode;
    l10n?: IL10n | null;
}

export const FileListItem: FC<FileListItemProps> = memo(({
    fileItem,
    showRetry = true,
    showCancel = true,
    showRemove = true,
    showProgressBar = true,
    onRetry,
    onCancel,
    onRemove,
    onPause,
    onResume,
    children,
    l10n
}: FileListItemProps): JSX.Element => {

    const handleCancelClick: () => void = useCallback((): void => { onCancel?.(fileItem); }, [onCancel, fileItem]);
    const handlePauseClick: () => void = useCallback((): void => { onPause?.(fileItem); }, [onPause, fileItem]);
    const handleResumeClick: () => void = useCallback((): void => { onResume?.(fileItem); }, [onResume, fileItem]);
    const handleRetryClick: () => void = useCallback((): void => { onRetry?.(fileItem); }, [onRetry, fileItem]);
    const handleRemoveClick: () => void = useCallback((): void => { onRemove?.(fileItem); }, [onRemove, fileItem]);

    if (children) {
        return (
            <li
                className={combineClasses(FILEUPLOAD_CLASSES.uploadFileList, getStatusClass(fileItem.status))}
                data-file-name={fileItem.name}
            >
                {children(fileItem)}
            </li>
        );
    }

    const statusText: string = getStatusText(fileItem, l10n);
    const statusClass: string = getStatusTextClass(fileItem.status);
    const isUploading: boolean = fileItem.status === FILE_STATUS.uploading;
    const isPaused: boolean = fileItem.status === FILE_STATUS.paused;
    const isError: boolean = fileItem.status === FILE_STATUS.error;
    const isSuccess: boolean = fileItem.status === FILE_STATUS.success;
    const isIdle: boolean = IDLE_STATUSES.has(fileItem.status);
    const progressValue: number = fileItem.progress ?? 0;
    const isChunkUpload: boolean = fileItem.chunkInfo !== undefined;
    const titleAbort: string = getLocalized('abort', 'Abort', l10n);
    const titlePause: string = getLocalized('pause', 'Pause', l10n);
    const titleResume: string = getLocalized('resume', 'Resume', l10n);
    const titleRetry: string = getLocalized('retry', 'Retry', l10n);
    const titleRemove: string = getLocalized('remove', 'Remove file', l10n);
    const titleDelete: string = getLocalized('delete', 'Delete file', l10n);

    const abortButton: ReactNode = showCancel && onCancel && (
        <Button
            title={titleAbort}
            aria-label={titleAbort}
            className={FILEUPLOAD_CLASSES.fileAbortBtn}
            variant={Variant.Standard}
            color={Color.Secondary}
            onClick={handleCancelClick}
            icon={<CircleRemoveIcon />}
        />
    );

    return (
        <li
            className={combineClasses(FILEUPLOAD_CLASSES.uploadFileList, getStatusClass(fileItem.status))}
            data-file-name={fileItem.name}
            aria-describedby={isError ? `upload-error-${fileItem.id}` : undefined}
        >
            <span className={FILEUPLOAD_CLASSES.fileContainer}>

                <span className={FILEUPLOAD_CLASSES.fileInfo}>
                    <span className={combineClasses(FILEUPLOAD_CLASSES.fileName, 'sf-ellipsis')} title={fileItem.name}>
                        {fileItem.name}
                    </span>
                    <span className={FILEUPLOAD_CLASSES.fileSize}>
                        {formatFileSize(fileItem.size)}
                    </span>
                    {statusText && (
                        <span
                            id={isError ? `upload-error-${fileItem.id}` : undefined}
                            className={combineClasses(FILEUPLOAD_CLASSES.fileStatus, statusClass)}
                            role={isError ? 'alert' : 'status'}
                            aria-live={isError ? 'assertive' : 'polite'}
                        >
                            {statusText}
                        </span>
                    )}
                </span>

                <span className={FILEUPLOAD_CLASSES.fileActions}>
                    {isChunkUpload && isUploading && (
                        <>
                            {onPause && (
                                <Button
                                    title={titlePause}
                                    aria-label={titlePause}
                                    className={FILEUPLOAD_CLASSES.filePlayBtn}
                                    variant={Variant.Standard}
                                    color={Color.Secondary}
                                    onClick={handlePauseClick}
                                    icon={<PauseIcon />}
                                />
                            )}
                            {abortButton}
                        </>
                    )}

                    {isChunkUpload && isPaused && (
                        <>
                            {onResume && (
                                <Button
                                    title={titleResume}
                                    aria-label={titleResume}
                                    className={FILEUPLOAD_CLASSES.fileResumeBtn}
                                    variant={Variant.Standard}
                                    color={Color.Secondary}
                                    onClick={handleResumeClick}
                                    icon={<PlayIcon />}
                                />
                            )}
                            {abortButton}
                        </>
                    )}

                    {!isChunkUpload && isUploading && abortButton}

                    {isError && isRetryableError(fileItem) && showRetry && onRetry && (
                        <Button
                            title={titleRetry}
                            aria-label={titleRetry}
                            className={FILEUPLOAD_CLASSES.fileRetryBtn}
                            variant={Variant.Standard}
                            color={Color.Secondary}
                            onClick={handleRetryClick}
                            icon={<RefreshIcon />}
                        />
                    )}
                    {isError && showRemove && onRemove && (
                        <Button
                            title={titleRemove}
                            aria-label={titleRemove}
                            className={FILEUPLOAD_CLASSES.fileCloseBtn}
                            variant={Variant.Standard}
                            color={Color.Secondary}
                            onClick={handleRemoveClick}
                            icon={<CloseIcon />}
                        />
                    )}

                    {isIdle && showRemove && onRemove && (
                        <Button
                            title={titleRemove}
                            aria-label={titleRemove}
                            className={FILEUPLOAD_CLASSES.fileCloseBtn}
                            variant={Variant.Standard}
                            color={Color.Secondary}
                            onClick={handleRemoveClick}
                            icon={<CloseIcon />}
                        />
                    )}

                    {isSuccess && showRemove && onRemove && (
                        <Button
                            title={titleDelete}
                            aria-label={titleDelete}
                            className={FILEUPLOAD_CLASSES.fileDeleteBtn}
                            variant={Variant.Standard}
                            color={Color.Secondary}
                            onClick={handleRemoveClick}
                            icon={<TrashIcon />}
                        />
                    )}

                </span>

            </span>

            {showProgressBar && (isUploading || isPaused) && (
                <div
                    className={FILEUPLOAD_CLASSES.progressWrapper}
                    role="progressbar"
                    aria-valuenow={progressValue}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Upload progress for ${fileItem.name}`}
                >
                    <div className={FILEUPLOAD_CLASSES.progressBarContainer}>
                        <div
                            className={FILEUPLOAD_CLASSES.progressBar}
                            style={{ width: `${progressValue}%` }}
                        />
                    </div>
                    <span className={FILEUPLOAD_CLASSES.progressText}>
                        {progressValue}%
                    </span>
                </div>
            )}
        </li>
    );
});
