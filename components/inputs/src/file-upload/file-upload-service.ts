import { FileItem, UploadError, UploadRequestConfig, ChunkUploadConfig } from './types';
import { calculateChunks } from './utils';
import { FILEUPLOAD_FORM_FIELDS } from './constant';

const parseResponse: (text: string) => unknown = (text: string): unknown => {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

const appendAdditionalData: (
    formData: FormData,
    additionalData: Record<string, unknown> | undefined
) => void = (formData: FormData, additionalData: Record<string, unknown> | undefined): void => {
    if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]: [string, unknown]): void => {
            formData.append(key, String(value));
        });
    }
};

const applyXhrConfig: (xhr: XMLHttpRequest, config: UploadRequestConfig) => void = (
    xhr: XMLHttpRequest,
    config: UploadRequestConfig
): void => {
    if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]: [string, unknown]): void => {
            xhr.setRequestHeader(key, String(value));
        });
    }
    if (config.withCredentials) {
        xhr.withCredentials = true;
    }
    if (config.timeout) {
        xhr.timeout = config.timeout;
    }
};

const attachXhrEventListeners: (
    xhr: XMLHttpRequest,
    onSuccess: (response: unknown) => void,
    onError: (error: UploadError) => void,
    file: File,
    errorContext: string
) => void = (
    xhr: XMLHttpRequest,
    onSuccess: (response: unknown) => void,
    onError: (error: UploadError) => void,
    file: File,
    errorContext: string = 'Upload'
): void => {
    const handleLoad: () => void = (): void => {
        if (xhr.status >= 200 && xhr.status < 300) {
            onSuccess(parseResponse(xhr.responseText));
        } else {
            onError({
                code: 'UPLOAD_FAILED',
                message: `${errorContext} failed with status ${xhr.status}`,
                status: xhr.status,
                file
            });
        }
    };

    const handleNetworkError: () => void = (): void => {
        onError({
            code: 'NETWORK_ERROR',
            message: `Network error during ${errorContext.toLowerCase()}`,
            file
        });
    };

    const handleTimeout: () => void = (): void => {
        onError({
            code: 'TIMEOUT',
            message: `${errorContext} timeout exceeded`,
            file
        });
    };

    const handleAbort: () => void = (): void => {
        onError({
            code: 'ABORT',
            message: `${errorContext} was aborted`,
            file
        });
    };

    xhr.addEventListener('load', handleLoad);
    xhr.addEventListener('error', handleNetworkError);
    xhr.addEventListener('timeout', handleTimeout);
    xhr.addEventListener('abort', handleAbort);
};

export const uploadFile: (
    fileItem: FileItem,
    config: UploadRequestConfig,
    onProgress: (percent: number, event: ProgressEvent) => void,
    onSuccess: (response: unknown) => void,
    onError: (error: UploadError) => void
) => XMLHttpRequest = (
    fileItem: FileItem,
    config: UploadRequestConfig,
    onProgress: (percent: number, event: ProgressEvent) => void,
    onSuccess: (response: unknown) => void,
    onError: (error: UploadError) => void
): XMLHttpRequest => {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    const formData: FormData = new FormData();
    const fieldName: string = config.name || 'UploadFiles';
    formData.append(fieldName, fileItem.file);
    appendAdditionalData(formData, config.additionalData);
    xhr.upload.addEventListener('progress', (event: ProgressEvent): void => {
        if (event.lengthComputable) {
            const percent: number = Math.round((event.loaded / event.total) * 100);
            onProgress(percent, event);
        }
    });

    attachXhrEventListeners(xhr, onSuccess, onError, fileItem.file, 'Upload');

    xhr.open(config.method, config.url);
    applyXhrConfig(xhr, config);
    xhr.send(formData);
    return xhr;
};

export const uploadFileChunked: (config: ChunkUploadConfig) => {
    xhr: XMLHttpRequest | null;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
} = (config: ChunkUploadConfig): {
    xhr: XMLHttpRequest | null;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
} => {
    const { file, chunkSize, fileItem, onProgress, onSuccess, onError } = config;
    const totalChunks: number = calculateChunks(file.size, chunkSize);
    let currentChunk: number = 0;
    let isPaused: boolean = false;
    let currentXhr: XMLHttpRequest | null = null;
    let uploadedBytes: number = 0;

    const uploadChunk: () => void = (): void => {
        if (isPaused || currentChunk >= totalChunks) {
            return;
        }
        const start: number = currentChunk * chunkSize;
        const end: number = Math.min(start + chunkSize, file.size);
        const chunk: Blob = file.slice(start, end);
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        currentXhr = xhr;
        const formData: FormData = new FormData();
        const fieldName: string = config.name || FILEUPLOAD_FORM_FIELDS.defaultFieldName;
        formData.append(fieldName, chunk);
        formData.append(FILEUPLOAD_FORM_FIELDS.chunkIndex, currentChunk.toString());
        formData.append(FILEUPLOAD_FORM_FIELDS.totalChunks, totalChunks.toString());
        formData.append(FILEUPLOAD_FORM_FIELDS.fileName, file.name);
        formData.append(FILEUPLOAD_FORM_FIELDS.fileSize, file.size.toString());
        appendAdditionalData(formData, config.additionalData);

        if (fileItem.chunkInfo) {
            fileItem.chunkInfo.currentChunk = currentChunk;
            fileItem.chunkInfo.uploadedBytes = uploadedBytes;
        }

        const handleProgress: (event: ProgressEvent) => void = (event: ProgressEvent): void => {
            if (event.lengthComputable) {
                const chunkProgress: number = uploadedBytes + event.loaded;
                const totalProgress: number = Math.round((chunkProgress / file.size) * 100);
                onProgress(totalProgress, event);
            }
        };

        const handleLoad: () => void = (): void => {
            if (xhr.status >= 200 && xhr.status < 300) {
                uploadedBytes += (end - start);
                currentChunk++;

                if (currentChunk >= totalChunks) {
                    onSuccess(parseResponse(xhr.responseText));
                } else {
                    uploadChunk();
                }
            } else {
                onError({
                    code: 'UPLOAD_FAILED',
                    message: `Chunk upload failed with status ${xhr.status}`,
                    status: xhr.status,
                    file: fileItem.file
                });
            }
        };

        const handleNetworkError: () => void = (): void => {
            onError({
                code: 'NETWORK_ERROR',
                message: 'Network error during chunk upload',
                file: fileItem.file
            });
        };

        const handleTimeout: () => void = (): void => {
            onError({
                code: 'TIMEOUT',
                message: 'Chunk upload timeout',
                file: fileItem.file
            });
        };

        const handleAbort: () => void = (): void => {
            if (!isPaused) {
                onError({
                    code: 'ABORT',
                    message: 'Chunk upload aborted',
                    file: fileItem.file
                });
            }
        };

        xhr.upload.addEventListener('progress', handleProgress);
        xhr.addEventListener('load', handleLoad);
        xhr.addEventListener('error', handleNetworkError);
        xhr.addEventListener('timeout', handleTimeout);
        xhr.addEventListener('abort', handleAbort);
        xhr.open(config.method, config.url);
        applyXhrConfig(xhr, config);
        xhr.send(formData);
    };
    fileItem.chunkInfo = {
        currentChunk: 0,
        totalChunks,
        uploadedBytes: 0
    };
    uploadChunk();
    return {
        xhr: currentXhr,
        pause: (): void => {
            isPaused = true;
            if (currentXhr) {
                currentXhr.abort();
            }
        },
        resume: (): void => {
            isPaused = false;
            uploadChunk();
        },
        cancel: (): void => {
            isPaused = true;
            if (currentXhr) {
                currentXhr.abort();
            }
        }
    };
};

export const removeFile: (
    fileItem: FileItem,
    config: UploadRequestConfig,
    onSuccess: () => void,
    onError: (error: UploadError) => void
) => XMLHttpRequest = (
    fileItem: FileItem,
    config: UploadRequestConfig,
    onSuccess: () => void,
    onError: (error: UploadError) => void
): XMLHttpRequest => {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    const formData: FormData = new FormData();
    const fieldName: string = config.name || 'UploadFiles';
    formData.append(fieldName, fileItem.name);
    appendAdditionalData(formData, config.additionalData);
    attachXhrEventListeners(xhr, onSuccess, (error: UploadError) => onError(error), fileItem.file, 'Remove');
    xhr.open(config.method, config.url);
    applyXhrConfig(xhr, config);
    xhr.send(formData);
    return xhr;
};
