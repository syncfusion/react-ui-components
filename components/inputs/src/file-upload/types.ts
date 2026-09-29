import { RefObject } from 'react';
import { IL10n } from '@syncfusion/react-base';
import { FileUploadCallbacks } from './event-types';

/**
 * Specifies the different states a file can have during the upload lifecycle.
 * - 'idle': File is ready for upload
 * - 'validating': File is being validated
 * - 'queued': File is queued for upload
 * - 'uploading': File is currently uploading
 * - 'success': File uploaded successfully
 * - 'error': File upload failed
 * - 'canceled': File upload was canceled
 * - 'paused': File upload is paused
 * - 'removed': File was removed from the queue
 *
 * @default 'idle'
 */
export type FileStatus =
  | 'idle'
  | 'validating'
  | 'queued'
  | 'uploading'
  | 'success'
  | 'error'
  | 'canceled'
  | 'paused'
  | 'removed'
  | 'ready';

export const FILE_STATUS: { [Key in FileStatus]: FileStatus } = {
    idle: 'idle',
    validating: 'validating',
    queued: 'queued',
    uploading: 'uploading',
    success: 'success',
    error: 'error',
    canceled: 'canceled',
    paused: 'paused',
    removed: 'removed',
    ready: 'ready'
};

/**
 * Specifies the HTTP methods supported for file upload and removal requests.
 * - 'POST': Standard method for uploading files
 * - 'PUT': Alternative method for uploading/updating files
 * - 'DELETE': Method for removing uploaded files
 * @private
 */
export type HTTPMethod = 'POST' | 'PUT' | 'DELETE';

export const HTTP_METHOD: { [Key in HTTPMethod]: HTTPMethod } = {
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
};

/**
 * Specifies the validation error codes that can occur when validating files.
 * - 'INVALID_FILE_TYPE': File type is not allowed
 * - 'FILE_SIZE_EXCEEDED': File exceeds maximum size limit
 * - 'MIN_FILE_SIZE_NOT_MET': File is smaller than minimum size
 * - 'MAX_FILES_EXCEEDED': Maximum file count limit reached
 * - 'MAX_TOTAL_SIZE_EXCEEDED': Total size limit exceeded
 * - 'DUPLICATE_FILE': File already exists in the list
 */
export type ValidationErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_SIZE_EXCEEDED'
  | 'MIN_FILE_SIZE_NOT_MET'
  | 'MAX_FILES_EXCEEDED'
  | 'MAX_TOTAL_SIZE_EXCEEDED'
  | 'DUPLICATE_FILE'
  | 'DIRECTORY_REQUIRED';

/**
 * Specifies the upload error codes that can occur during file upload.
 * - 'UPLOAD_FAILED': General upload failure
 * - 'TIMEOUT': Upload request timed out
 * - 'NETWORK_ERROR': Network connectivity error
 * - 'ABORT': Upload was aborted by user
 */
export type UploadErrorCode =
  | 'UPLOAD_FAILED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'ABORT';

/**
 * Specifies the information about chunked upload progress for large files.
 *
 * @private
 */
export interface ChunkInfo {
    /**
     * Specifies the current chunk index being uploaded (0-based).
     *
     * @default -
     */
    currentChunk: number;

    /**
     * Specifies the total number of chunks the file is divided into.
     *
     * @default -
     */
    totalChunks: number;

    /**
     * Specifies the total number of bytes uploaded so far across all chunks.
     *
     * @default -
     */
    uploadedBytes: number;
}

/**
 * Specifies the chunk upload controller with pause, resume, and cancel methods.
 * Only present when chunked upload is active.
 *
 * @private
 */
export interface ChunkController {
    /**
     * Pauses the current chunk upload.
     */
    pause: () => void;

    /**
     * Resumes a paused chunk upload.
     */
    resume: () => void;

    /**
     * Cancels the current chunk upload.
     */
    cancel: () => void;
}

/**
 * Specifies the structure of validation errors returned when file validation fails.
 */
export interface ValidationError {
    /**
     * Specifies the validation error code indicating the type of validation failure.
     *
     * @default -
     */
    code: ValidationErrorCode;

    /**
     * Specifies the human-readable error message describing the validation failure.
     *
     * @default -
     */
    message: string;

    /**
     * Specifies the File object that failed validation, if applicable.
     *
     * @default -
     */
    file?: File;
}

/**
 * Specifies the structure of upload errors returned when file upload fails.
 */
export interface UploadError {
    /**
     * Specifies the upload error code indicating the type of upload failure.
     *
     * @default -
     */
    code: UploadErrorCode;

    /**
     * Specifies the human-readable error message describing the upload failure.
     *
     * @default -
     */
    message: string;

    /**
     * Specifies the HTTP status code returned by the server, if applicable.
     *
     * @default -
     */
    status?: number;

    /**
     * Specifies the File object that failed to upload, if applicable.
     *
     * @default -
     */
    file?: File;
}

/**
 * Specifies the structure of a file item in the file upload with metadata and upload state.
 */
export interface FileItem {
    /**
     * Specifies a unique identifier generated for each file in the upload queue.
     *
     * @default -
     */
    id: string;

    /**
     * Specifies the File object containing file data.
     *
     * @default -
     */
    file: File;

    /**
     * Specifies the current status of the file in the upload lifecycle.
     *
     * @default 'idle'
     */
    status: FileStatus;

    /**
     * Specifies the upload progress as a percentage from 0 to 100.
     *
     * @default 0
     */
    progress: number;

    /**
     * Specifies the validation or upload error if the file failed, if applicable.
     *
     * @default -
     */
    error?: ValidationError | UploadError;

    /**
     * Specifies the server response after successful upload, if applicable.
     *
     * @default -
     */
    response?: unknown;

    /**
     * Specifies the file size in bytes.
     *
     * @default -
     */
    size: number;

    /**
     * Specifies the MIME type of the file.
     *
     * @default -
     */
    type: string;

    /**
     * Specifies the name of the file.
     *
     * @default -
     */
    name: string;

    /**
     * Specifies the timestamp when the file item was created.
     *
     * @default -
     */
    created: Date;

    /**
     * Specifies the timestamp when the upload started, if applicable.
     *
     * @default -
     */
    started?: Date;

    /**
     * Specifies the timestamp when the upload completed, if applicable.
     *
     * @default -
     */
    completed?: Date;

    /**
     * Specifies the XMLHttpRequest object used for the upload, if applicable.
     *
     * @default -
     * @private
     */
    xhr?: XMLHttpRequest;

    /**
     * Specifies the chunk upload controller with pause, resume, and cancel methods.
     * Only present when chunked upload is active.
     *
     * @default -
     * @private
     */
    chunkController?: ChunkController;

    /**
     * Specifies the chunked upload information for large files, if applicable.
     *
     * @default -
     * @private
     */
    chunkInfo?: ChunkInfo;
}

/**
 * Specifies common upload operation callbacks for progress, success, and error handling.
 * These callbacks are reused in both standard and chunked upload configurations.
 *
 * @private
 */
export interface UploadOperationCallbacks {
    /**
     * Callback triggered during upload to report progress.
     * `percent` is the upload progress from 0 to 100.
     * `event` is the ProgressEvent from the XMLHttpRequest.
     *
     * @event onProgress
     */
    onProgress: (percent: number, event: ProgressEvent) => void;

    /**
     * Callback triggered when upload completes successfully.
     * `response` contains the server response data.
     *
     * @event onSuccess
     */
    onSuccess: (response: unknown) => void;

    /**
     * Callback triggered when upload fails.
     * `error` contains the upload error details.
     *
     * @event onError
     */
    onError: (error: UploadError) => void;
}

/**
 * Specifies common file list display and action configuration options.
 * These options are reused across file list components and the main FileUpload component.
 *
 * @private
 */
export interface FileListConfig {
    /**
     * Specifies whether to show the retry button for failed uploads.
     *
     * @default true
     */
    showRetry?: boolean;

    /**
     * Specifies whether to show the cancel button for in-progress uploads.
     *
     * @default true
     */
    showCancel?: boolean;

    /**
     * Specifies whether to show the remove button for files in the list.
     *
     * @default true
     */
    showRemove?: boolean;

    /**
     * Specifies whether to show the progress bar during file uploads.
     *
     * @default true
     */
    showProgressBar?: boolean;

    /**
     * Specifies compound children (`<BrowseButton>`, `<DragHint>`,
     * `<FileList>`, `<Actions>`) for the composition API.
     *
     * @default -
     */
    children?: React.ReactNode;

    /**
     * Specifies the localization instance for translating UI text.
     *
     * @private
     *
     * @default -
     */
    l10n?: IL10n | null;
}

/**
 * Specifies common file action callbacks for list operations.
 * These callbacks handle user interactions with files in the upload list.
 *
 * @private
 */
export interface FileListCallbacks {
    /**
     * Callback triggered when retry button is clicked for a failed file upload.
     *
     * @event onRetry
     */
    onRetry?: (fileItem: FileItem) => void;

    /**
     * Callback triggered when cancel button is clicked for an in-progress upload.
     *
     * @event onCancel
     */
    onCancel?: (fileItem: FileItem) => void;

    /**
     * Callback triggered when remove button is clicked to remove a file.
     *
     * @event onRemove
     */
    onRemove?: (fileItem: FileItem) => void;

    /**
     * Callback triggered when pause button is clicked for a chunk upload in progress.
     *
     * @event onPause
     */
    onPause?: (fileItem: FileItem) => void;
    /**
     * Callback triggered when resume/play button is clicked for a paused chunk upload.
     *
     * @event onResume
     */
    onResume?: (fileItem: FileItem) => void;
}

/**
 * Specifies the base configuration for upload requests to the server.
 * Contains common properties used for both single and chunked uploads.
 *
 * @private
 */
export interface BaseUploadConfig {
    /**
     * Specifies the server endpoint URL where the file will be uploaded.
     *
     * @default -
     */
    url: string;

    /**
     * Specifies the HTTP method used for the upload request.
     *
     * @default 'POST'
     */
    method: HTTPMethod;

    /**
     * Specifies custom HTTP headers to include with the upload request.
     *
     * @default -
     */
    headers?: Record<string, string>;

    /**
     * Specifies whether credentials (cookies, authorization) should be sent with the request.
     *
     * @default false
     */
    withCredentials?: boolean;

    /**
     * Specifies additional form data to send along with the file in the upload request.
     *
     * @default -
     */
    additionalData?: Record<string, unknown>;

    /**
     * Specifies the timeout duration in milliseconds for the upload request.
     *
     * @default 30000
     */
    timeout?: number;

    /**
     * Specifies the FormData key name used when sending files to the server.
     * This should match the parameter name in your server-side controller.
     *
     * @default 'UploadFiles'
     */
    name?: string;
}

/**
 *
 * @private
 */
export type UploadRequestConfig = BaseUploadConfig;

/**
 * Specifies the configuration for chunked file upload when files are split into multiple parts.
 * Extends BaseUploadConfig with additional chunk-specific properties and callbacks.
 *
 * @private
 */
export interface ChunkUploadConfig extends BaseUploadConfig, UploadOperationCallbacks {
    /**
     * Specifies the size in bytes for each file chunk (e.g., 512 * 1024 for 512KB chunks).
     *
     * @default -
     */
    chunkSize: number;

    /**
     * Specifies the File object being uploaded.
     *
     * @default -
     */
    file: File;

    /**
     * Specifies the FileItem object containing metadata and status information.
     *
     * @default -
     */
    fileItem: FileItem;
}

/**
 * Specifies the properties and event handlers for the FileUpload component.
 * Extends FileUploadCallbacks for events and FileListConfig for display options.
 * @private
 */
export interface FileUploadProps extends FileUploadCallbacks, FileListConfig {
    /**
     * Specifies whether multiple files can be selected at once.
     *
     * @default true
     */
    multiple?: boolean;

    /**
     * Specifies the accepted file types as MIME types or extensions (e.g., '.pdf', 'image/*', '.doc,.docx').
     * Can be a string or array of strings.
     *
     * @default -
     */
    accept?: string | string[];

    /**
     * Specifies whether directory selection is allowed instead of individual files.
     *
     * @default false
     */
    directory?: boolean;

    /**
     * Specifies whether drag-and-drop file selection is enabled.
     * When set to `false`, users can only select files through the browse button.
     *
     * @default true
     */
    dragDropEnabled?: boolean;

    /**
     * Specifies the maximum number of files allowed to be uploaded.
     *
     * @default -
     */
    maxFiles?: number;

    /**
     * Specifies the maximum file size allowed in bytes (e.g., 5 * 1024 * 1024 for 5MB).
     *
     * @default 30000000
     */
    maxFileSize?: number;

    /**
     * Specifies the minimum file size required in bytes.
     *
     * @default 0
     */
    minFileSize?: number;

    /**
     * Specifies the controlled file list. When provided, the parent fully owns
     * the list and must update it via `onChange`. The component will not modify
     * its own state — every change fires `onChange` and waits for the new value
     * to flow back through this prop.
     *
     * @default -
     */
    files?: FileItem[];

    /**
     * Specifies the initial list of FileItem objects with metadata and status.
     *
     * @default -
     */
    defaultFiles?: FileItem[];

    /**
     * Specifies the server endpoint URL for uploading files.
     *
     * @default -
     */
    saveUrl?: string;

    /**
     * Specifies the server endpoint URL for removing uploaded files.
     *
     * @default -
     */
    removeUrl?: string;

    /**
     * Specifies the HTTP method used for upload requests.
     *
     * @private
     *
     * @default 'POST'
     */
    method?: HTTPMethod;

    /**
     * Specifies custom HTTP headers to include with upload requests.
     *
     * @default -
     */
    headers?: Record<string, string>;

    /**
     * Specifies whether credentials (cookies, authorization headers) should be sent with upload requests.
     *
     * @default false
     */
    withCredentials?: boolean;

    /**
     * Specifies additional form data to send with upload requests (e.g., `{ userId: '123' }`).
     *
     * @default -
     */
    additionalData?: Record<string, unknown>;

    /**
     * Specifies whether files should upload immediately after selection.
     * When false, files are queued and must be uploaded manually.
     *
     * @default false
     */
    autoUpload?: boolean;

    /**
     * Specifies whether files should upload one at a time sequentially.
     * When false, multiple uploads occur in parallel.
     *
     * @default false
     */
    sequential?: boolean;

    /**
     * Specifies the chunk size in bytes for chunked uploads of large files (e.g., 512 * 1024 for 512KB chunks).
     * Chunked upload is enabled when this property is set.
     *
     * @default -
     */
    chunkSize?: number;

    /**
     * Specifies the timeout duration in milliseconds for upload requests.
     *
     * @default 30000
     */
    timeout?: number;

    /**
     * Specifies the maximum number of retry attempts for failed uploads.
     *
     * @default 0
     */
    retryCount?: number;

    /**
     * Specifies the delay in milliseconds between retry attempts.
     *
     * @default 1000
     */
    retryDelay?: number;

    /**
     * Specifies the drop target to handle the drag-and-drop upload.
     * Accepts a `RefObject<HTMLElement>` pointing to the target element.
     * By default, the component creates a wrapper around the file input that acts as the drop target.
     *
     * @default -
     */
    dropArea?: RefObject<HTMLElement>;
}
