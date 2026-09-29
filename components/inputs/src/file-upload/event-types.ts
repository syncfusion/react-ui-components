import { FileItem, UploadError, ValidationError } from './types';

/**
 * Specifies the event arguments passed to callbacks that operate on a FileItem.
 *
 */
export interface FileEvent {
    /**
     * Specifies the FileItem object associated with the event.
     *
     * @default -
     */
    file: FileItem;
}

/**
 * Specifies the event arguments passed to the onSelect callback when files are selected.
 */
export interface SelectEvent {
    /**
     * Specifies the array of FileItem objects selected by the user.
     *
     * @default -
     */
    files: FileItem[];

    /**
     * Specifies the original DOM event from file selection or drag-and-drop.
     *
     * @default -
     */
    event: Event;
}

/**
 * Specifies the event arguments passed to the onValidationError callback when file validation fails.
 */
export interface ValidationErrorEvent {
    /**
     * Specifies the file for which the validation error occurred.
     *
     * @default -
     */
    file: File;

    /**
     * Specifies the validation error details including code and message.
     *
     * @default -
     */
    error: ValidationError;
}

/**
 * Specifies the event arguments passed to the onProgress callback during file upload.
 */
export interface ProgressEventArgs extends FileEvent {
    /**
     * Specifies the upload progress as a percentage from 0 to 100.
     *
     * @default -
     */
    percent: number;

    /**
     * Specifies the ProgressEvent from the XMLHttpRequest containing upload progress details.
     *
     * @default -
     */
    event: ProgressEvent;
}

/**
 * Specifies the event arguments passed to the onSuccess callback when file upload completes successfully.
 */
export interface SuccessEvent extends FileEvent {
    /**
     * Specifies the server response data from the upload request.
     *
     * @default -
     */
    response: unknown;
}

/**
 * Specifies the event arguments passed to the onError callback when file upload fails.
 */
export interface ErrorEvent extends FileEvent {
    /**
     * Specifies the upload error details including code, message, and HTTP status.
     *
     * @default -
     */
    error: UploadError;
}

/**
 * Specifies the event arguments passed to the onChange callback when the file list changes.
 */
export interface ChangeEvent {
    /**
     * Specifies the updated array of FileItem objects after the change.
     *
     * @default -
     */
    files: FileItem[];
}

/**
 * Specifies the event arguments passed to the onComplete callback when all files complete uploading.
 */
export interface CompleteEvent {
    /**
     * Specifies the array of all FileItem objects that completed uploading.
     *
     * @default -
     */
    files: FileItem[];

    /**
     * Specifies the number of files that failed to upload.
     *
     * @default -
     */
    failedCount: number;
}

/**
 * Specifies the callback event handlers for the FileUpload component lifecycle.
 * @private
 */
export interface FileUploadCallbacks {
    /**
     * Specifies the callback triggered when files are selected from the file picker or dropped.
     *
     * @event onSelect
     */
    onSelect?: (args: SelectEvent) => void;

    /**
     * Specifies the callback triggered when a selected file fails validation.
     *
     * @event onValidationError
     */
    onValidationError?: (args: ValidationErrorEvent) => void;

    /**
     * Specifies the callback triggered when a file upload starts.
     *
     * @event onStart
     */
    onStart?: (args: FileEvent) => void;

    /**
     * Specifies the callback triggered during file upload to report progress.
     *
     * @event onProgress
     */
    onProgress?: (args: ProgressEventArgs) => void;

    /**
     * Specifies the callback triggered when a file upload completes successfully.
     *
     * @event onSuccess
     */
    onSuccess?: (args: SuccessEvent) => void;

    /**
     * Specifies the callback triggered when a file upload fails.
     *
     * @event onError
     */
    onError?: (args: ErrorEvent) => void;

    /**
     * Specifies the callback triggered when an in-progress file upload is canceled by the user.
     *
     * @event onCancel
     */
    onCancel?: (args: FileEvent) => void;

    /**
     * Specifies the callback triggered when an in-progress file upload is paused.
     *
     * @event onPause
     */
    onPause?: (args: FileEvent) => void;

    /**
     * Specifies the callback triggered when a paused file upload is resumed.
     *
     * @event onResume
     */
    onResume?: (args: FileEvent) => void;

    /**
     * Specifies the callback triggered when a file is removed from the upload queue.
     *
     * @event onRemove
     */
    onRemove?: (args: FileEvent) => void;

    /**
     * Specifies the callback triggered when a failed file upload is retried.
     *
     * @event onRetry
     */
    onRetry?: (args: FileEvent) => void;

    /**
     * Specifies the callback triggered when the file list changes (files added, removed, or status updated).
     *
     * @event onChange
     */
    onChange?: (args: ChangeEvent) => void;

    /**
     * Specifies the callback triggered when all files have completed uploading.
     *
     * @event onComplete
     */
    onComplete?: (args: CompleteEvent) => void;
}
