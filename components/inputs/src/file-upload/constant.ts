/**
 * FileUpload Component Class Names Constants
 * Centralized location for all CSS class names used in the FileUpload component
 */
export const FILEUPLOAD_CLASSES: { [key: string]: string } = {
    uploadContainer: 'sf-upload sf-pos-relative',
    control: 'sf-control',
    disabled: 'sf-disabled',
    dragging: 'sf-dragging',
    rtl: 'sf-rtl',
    fileSelectWrap: 'sf-file-select sf-display-flex',
    browsBtn: 'sf-file-browse-btn',
    fileDropText: 'sf-file-drop-text',
    fileSelectInput: 'sf-file-select-input sf-display-none',
    uploadFiles: 'sf-upload-files',
    uploadFileList: 'sf-upload-file-list sf-display-flex',
    autoUploadDisabled: 'sf-auto-upload-disabled',
    fileContainer: 'sf-file-container sf-content-between',
    fileInfo: 'sf-file-info sf-display-flex',
    fileName: 'sf-file-name-text',
    fileSize: 'sf-file-size',
    fileStatus: 'sf-file-status',
    uploadSuccess: 'sf-upload-success',
    uploadError: 'sf-upload-error',
    uploadProgress: 'sf-upload-progress',
    uploadPaused: 'sf-upload-paused',
    uploadCanceled: 'sf-upload-canceled',
    uploadIdle: 'sf-upload-idle',
    uploadFails: 'sf-upload-fails',
    fileActions: 'sf-file-actions sf-display-inline-flex',
    fileAbortBtn: 'sf-file-abort-btn',
    filePlayBtn: 'sf-file-play-btn',
    fileResumeBtn: 'sf-file-resume-btn',
    fileCancelBtn: 'sf-file-cancel-btn',
    fileReloadBtn: 'sf-file-reload-btn',
    fileRetryBtn: 'sf-file-retry-btn',
    fileCloseBtn: 'sf-file-close-btn',
    fileRemoveBtn: 'sf-file-remove-btn',
    fileDeleteBtn: 'sf-file-delete-btn',
    progressWrapper: 'sf-progress-wrapper sf-content-center',
    progressBarContainer: 'sf-progress-bar-container',
    progressBar: 'sf-progress-bar',
    progressText: 'sf-progress-text',
    chunkInfo: 'sf-chunk-info',
    uploadActions: 'sf-upload-actions sf-content-end',
    fileClearBtn: 'sf-file-clear-btn',
    fileUploadBtn: 'sf-file-upload-btn',
    dragHover: 'sf-drag-hover',
    dragDropDisabled: 'sf-drag-drop-disabled sf-content-center'
};

export const FILEUPLOAD_RETRY: { [key: string]: number } = {
    pollInterval: 100
};

export const FILEUPLOAD_FORM_FIELDS: { [key: string]: string } = {
    defaultFieldName: 'UploadFiles',
    chunkIndex: 'chunkIndex',
    totalChunks: 'totalChunks',
    fileName: 'FileName',
    fileSize: 'FileSize'
};
