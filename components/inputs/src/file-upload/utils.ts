import { IL10n } from '@syncfusion/react-base';
import { ValidationError, FileItem, FileStatus, UploadError } from './types';
import { FILEUPLOAD_CLASSES } from './constant';

export const formatString: (
    template: string,
    ...args: (string | number)[]
) => string = (
    template: string,
    ...args: (string | number)[]
): string => {
    return template.replace(/{(\d+)}/g, (match: string, index: string): string => {
        const argIndex: number = parseInt(index, 10);
        return argIndex < args.length ? String(args[argIndex as number]) : match;
    });
};

export const generateFileId: () => string = (): string => {
    return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatFileSize: (bytes: number) => string = (bytes: number): string => {
    if (bytes <= 0 || !Number.isFinite(bytes)) {
        return '0 Bytes';
    }
    const k: number = 1024;
    const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i: number = Math.floor(Math.log(bytes) / Math.log(k));
    i = Math.max(0, Math.min(i, sizes.length - 1));
    const value: number = bytes / Math.pow(k, i);
    return `${Math.round(value * 100) / 100} ${sizes[i as number]}`;
};

export const parseAccept: (
    accept: string | string[] | undefined
) => { extensions: string[]; mimeTypes: string[] } = (
    accept: string | string[] | undefined
): { extensions: string[]; mimeTypes: string[] } => {
    if (!accept) {
        return { extensions: [], mimeTypes: [] };
    }
    const acceptArray: string[] = Array.isArray(accept)
        ? accept
        : accept.split(',').map((s: string): string => s.trim());
    const extensions: string[] = [];
    const mimeTypes: string[] = [];
    acceptArray.forEach((item: string): void => {
        if (item.startsWith('.')) {
            extensions.push(item.toLowerCase());
        } else {
            mimeTypes.push(item.toLowerCase());
        }
    });
    return { extensions, mimeTypes };
};

export const isValidFileType: (
    file: File,
    accept: string | string[] | undefined
) => boolean = (
    file: File,
    accept: string | string[] | undefined
): boolean => {
    if (!accept) { return true; }
    const { extensions, mimeTypes } = parseAccept(accept);
    const fileName: string = file.name.toLowerCase();
    const fileType: string = file.type.toLowerCase();
    const hasValidExtension: boolean =
      extensions.length === 0 || extensions.some((ext: string): boolean => fileName.endsWith(ext));
    const hasValidMimeType: boolean =
      mimeTypes.length === 0 || mimeTypes.some((mime: string): boolean => {
          if (mime.endsWith('/*')) {
              const mimePrefix: string = mime.slice(0, -2);
              return fileType.startsWith(mimePrefix);
          }
          return fileType === mime;
      });

    return hasValidExtension && hasValidMimeType;
};

export const validateFile: (
    file: File,
    options: {
        accept?: string | string[];
        maxFileSize?: number;
        minFileSize?: number;
        existingFiles?: FileItem[];
        l10n?: IL10n | null;
    }
) => ValidationError | null = (
    file: File,
    options: {
        accept?: string | string[];
        maxFileSize?: number;
        minFileSize?: number;
        existingFiles?: FileItem[];
        l10n?: IL10n | null;
    }
): ValidationError | null => {
    const { accept, maxFileSize, minFileSize, existingFiles, l10n } = options;
    if (accept && !isValidFileType(file, accept)) {
        return {
            code: 'INVALID_FILE_TYPE',
            message: formatString(getLocalized('invalidFileType', 'File type "{0}" is not allowed', l10n), file.type),
            file
        };
    }
    if (maxFileSize && file.size > maxFileSize) {
        return {
            code: 'FILE_SIZE_EXCEEDED',
            message: formatString(getLocalized('fileSizeExceeded', 'File size {0} exceeds maximum {1}', l10n), formatFileSize(file.size), formatFileSize(maxFileSize)),
            file
        };
    }
    if (minFileSize && file.size < minFileSize) {
        return {
            code: 'MIN_FILE_SIZE_NOT_MET',
            message: formatString(getLocalized('minFileSizeNotMet', 'File size {0} is below minimum {1}', l10n), formatFileSize(file.size), formatFileSize(minFileSize)),
            file
        };
    }
    if (existingFiles && existingFiles.some((item: FileItem): boolean => item.file.name === file.name && item.file.size === file.size)) {
        return {
            code: 'DUPLICATE_FILE',
            message: formatString(getLocalized('duplicateFile', 'File "{0}" already exists', l10n), file.name),
            file
        };
    }
    return null;
};

export const validateFiles: (
    files: File[],
    options: {
        accept?: string | string[];
        maxFileSize?: number;
        minFileSize?: number;
        maxFiles?: number;
        maxTotalSize?: number;
        existingFiles?: FileItem[];
        l10n?: IL10n | null;
    }
) => { validFiles: File[]; errors: ValidationError[] } = (
    files: File[],
    options: {
        accept?: string | string[];
        maxFileSize?: number;
        minFileSize?: number;
        maxFiles?: number;
        maxTotalSize?: number;
        existingFiles?: FileItem[];
        l10n?: IL10n | null;
    }
): { validFiles: File[]; errors: ValidationError[] } => {
    const { maxFiles, maxTotalSize, existingFiles = [], l10n } = options;
    const validFiles: File[] = [];
    const errors: ValidationError[] = [];

    if (maxFiles && (existingFiles.length + files.length) > maxFiles) {
        errors.push({
            code: 'MAX_FILES_EXCEEDED',
            message: formatString(
                getLocalized('maxFilesExceeded', 'Cannot add {0} files. Maximum {1} files allowed.', l10n),
                files.length,
                maxFiles
            )
        });
        return { validFiles, errors };
    }

    const existingTotalSize: number = existingFiles.reduce(
        (sum: number, item: FileItem): number => sum + item.size,
        0
    );
    let currentTotalSize: number = existingTotalSize;
    for (const file of files) {
        const error: ValidationError | null = validateFile(file, { ...options, existingFiles, l10n });
        if (error) {
            errors.push(error);
            continue;
        }
        if (maxTotalSize && (currentTotalSize + file.size) > maxTotalSize) {
            errors.push({
                code: 'MAX_TOTAL_SIZE_EXCEEDED',
                message: formatString(
                    getLocalized('maxTotalSizeExceeded', 'Adding this file would exceed total size limit of {0}', l10n),
                    formatFileSize(maxTotalSize)
                ),
                file
            });
            continue;
        }
        validFiles.push(file);
        currentTotalSize += file.size;
    }
    return { validFiles, errors };
};

export const createFileItem: (file: File) => FileItem = (file: File): FileItem => {
    return {
        id: generateFileId(),
        file,
        status: 'idle',
        progress: 0,
        size: file.size,
        type: file.type,
        name: file.name,
        created: new Date()
    };
};

export const calculateChunks: (fileSize: number, chunkSize: number) => number = (fileSize: number, chunkSize: number): number => {
    return Math.ceil(fileSize / chunkSize);
};

export const getFileExtension: (filename: string) => string = (filename: string): string => {
    const lastDot: number = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.slice(lastDot);
};

export const getLocalized: (key: string, fallback: string, l10n?: IL10n | null) => string = (
    key: string,
    fallback: string,
    l10n?: IL10n | null
): string => {
    return (l10n?.getConstant(key) as string) || fallback;
};

export const getStatusText: (fileItem: FileItem, l10n?: IL10n | null) => string = (
    fileItem: FileItem,
    l10n?: IL10n | null
): string => {
    const resolvedL10n: IL10n | undefined = l10n ?? undefined;
    switch (fileItem.status) {
    case 'success': return getLocalized('uploadSuccess', 'File Uploaded Successfully', resolvedL10n);
    case 'error': return fileItem.error?.message ?? getLocalized('uploadFailed', 'Upload failed', resolvedL10n);
    case 'uploading': return getLocalized('uploading', 'Uploading...', resolvedL10n);
    case 'paused': return getLocalized('paused', 'Paused', resolvedL10n);
    case 'queued': return getLocalized('ready', 'Ready', resolvedL10n);
    default: return '';
    }
};

export const getStatusClass: (status: FileStatus | string) => string = (status: FileStatus | string): string => {
    switch (status) {
    case 'success':   return FILEUPLOAD_CLASSES.uploadSuccess;
    case 'error':     return FILEUPLOAD_CLASSES.uploadError;
    case 'uploading': return FILEUPLOAD_CLASSES.uploadProgress;
    case 'paused':    return FILEUPLOAD_CLASSES.uploadPaused;
    case 'canceled':  return FILEUPLOAD_CLASSES.uploadCanceled;
    default:          return FILEUPLOAD_CLASSES.uploadIdle;
    }
};

export const getStatusTextClass: (status: FileStatus | string) => string = (status: FileStatus | string): string => {
    switch (status) {
    case 'success':   return FILEUPLOAD_CLASSES.uploadSuccess;
    case 'error':     return FILEUPLOAD_CLASSES.uploadFails;
    case 'uploading': return FILEUPLOAD_CLASSES.uploadProgress;
    default:          return '';
    }
};

export const combineClasses: (
    ...classes: (string | undefined | false)[]
) => string = (
    ...classes: (string | undefined | false)[]
): string => {
    return classes.filter(Boolean).join(' ');
};

const VALIDATION_ERROR_CODES: ReadonlySet<string> = new Set([
    'FILE_SIZE_EXCEEDED',
    'INVALID_FILE_TYPE',
    'MIN_FILE_SIZE_NOT_MET',
    'MAX_FILES_EXCEEDED',
    'MAX_TOTAL_SIZE_EXCEEDED',
    'DUPLICATE_FILE',
    'DIRECTORY_REQUIRED'
]);

const hasErrorCode: (error: ValidationError | UploadError, codes: ReadonlySet<string>) => boolean =
    (error: ValidationError | UploadError, codes: ReadonlySet<string>): boolean =>
        'code' in error && codes.has(error.code as string);

export const isRetryableError: (fileItem: FileItem) => boolean = (fileItem: FileItem): boolean => {
    if (fileItem.status !== 'error' || !fileItem.error) {
        return false;
    }
    return !hasErrorCode(fileItem.error, VALIDATION_ERROR_CODES);
};

export const hasValidationError: (fileItem: FileItem) => boolean = (fileItem: FileItem): boolean => {
    if (!fileItem.error) {
        return false;
    }
    return hasErrorCode(fileItem.error, VALIDATION_ERROR_CODES);
};

/**
 * Inspects the DataTransfer's `items` collection to determine
 * whether the drop contains at least one directory entry. Used by the
 * directory-only upload mode to reject drops that consist solely of
 * individual files.
 *
 * @private
 * @param {DataTransfer | null} dataTransfer - The DataTransfer from a drop event.
 * @returns {boolean} `true` if at least one item is a directory, `false` otherwise.
 */
export const hasDirectoryInDataTransfer: (dataTransfer: DataTransfer | null) => boolean = (
    dataTransfer: DataTransfer | null
): boolean => {
    if (!dataTransfer) { return false; }
    const items: DataTransferItemList = dataTransfer.items;
    if (!items || items.length === 0) { return false; }
    for (let i: number = 0; i < items.length; i++) {
        const item: DataTransferItem | null = items[i as number];
        if (item && item.kind === 'file') {
            const entry: FileSystemEntry | null = (item as DataTransferItem &
            { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.() ?? null;
            if (entry && entry.isDirectory) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Validates a drop event against directory-only mode. Returns a
 * `DIRECTORY_REQUIRED` error if directory upload is enabled but the
 * drop contains no directory entries. Returns `null` if the drop is
 * either acceptable for the current mode or directory mode is off.
 *
 * @private
 * @param {DataTransfer | null} dataTransfer - The DataTransfer from a drop event.
 * @param {boolean} directory - Whether directory-only mode is enabled.
 * @param {IL10n | null} [l10n] - Optional localization instance for messages.
 * @returns {ValidationError | null} The validation error or `null` when valid.
 */
export const validateDirectoryDrop: (
    dataTransfer: DataTransfer | null,
    directory: boolean,
    l10n?: IL10n | null
) => ValidationError | null = (
    dataTransfer: DataTransfer | null,
    directory: boolean,
    l10n?: IL10n | null
): ValidationError | null => {
    if (!directory) { return null; }
    if (hasDirectoryInDataTransfer(dataTransfer)) { return null; }
    return {
        code: 'DIRECTORY_REQUIRED',
        message: getLocalized('directoryRequired', 'Please drop a directory. Individual files are not allowed.', l10n)
    };
};

interface DroppedEntry {
    isFile: boolean;
    fullPath: string;
    file?: (success: (file: File) => void, error?: () => void) => void;
    createReader?: () => DroppedDirectoryReader;
}

interface DroppedDirectoryReader {
    readEntries: (success: (entries: DroppedEntry[]) => void, error?: () => void) => void;
}

const readDroppedEntry: (entry: DroppedEntry) => Promise<File[]> = async (
    entry: DroppedEntry
): Promise<File[]> => {
    if (entry.isFile) {
        return new Promise((resolve: (files: File[]) => void): void => {
            entry.file?.((file: File): void => {
                Object.defineProperty(file, 'webkitRelativePath', {
                    value: entry.fullPath.replace(/^\//, '') || file.name,
                    configurable: true
                });
                resolve([file]);
            }, (): void => resolve([]));
        });
    }
    const reader: DroppedDirectoryReader | undefined = entry.createReader?.();
    if (!reader) { return []; }
    const entries: DroppedEntry[] = [];
    const readBatch: () => Promise<void> = (): Promise<void> => new Promise((resolve: () => void): void => {
        reader.readEntries((batch: DroppedEntry[]): void => {
            if (batch.length === 0) { resolve(); return; }
            entries.push(...batch);
            readBatch().then(resolve);
        }, (): void => resolve());
    });
    await readBatch();
    const files: File[][] = await Promise.all(entries.map(readDroppedEntry));
    return files.flat();
};

export const readDirectoryFromDataTransfer: (dataTransfer: DataTransfer | null) => Promise<File[]> = async (
    dataTransfer: DataTransfer | null
): Promise<File[]> => {
    if (!dataTransfer?.items) { return dataTransfer?.files ? Array.from(dataTransfer.files) : []; }
    const entries: DroppedEntry[] = [];
    for (let i: number = 0; i < dataTransfer.items.length; i++) {
        const item: DataTransferItem = dataTransfer.items[i as number];
        const entry: DroppedEntry | null = (item as DataTransferItem & {
            webkitGetAsEntry?: () => DroppedEntry | null;
        }).webkitGetAsEntry?.() ?? null;
        if (entry) { entries.push(entry); }
    }
    if (entries.length === 0) { return dataTransfer.files ? Array.from(dataTransfer.files) : []; }
    const files: File[][] = await Promise.all(entries.map(readDroppedEntry));
    return files.flat();
};

export const toFileList: (files: File[]) => FileList = (files: File[]): FileList => ({
    ...files,
    length: files.length,
    item: (index: number): File | null => files[index as number] ?? null
} as unknown as FileList);

export const readDirectoryFileList: (
    dataTransfer: DataTransfer | null
) => Promise<FileList | null> = async (
    dataTransfer: DataTransfer | null
): Promise<FileList | null> => {
    const files: File[] = await readDirectoryFromDataTransfer(dataTransfer);
    return files.length > 0 ? toFileList(files) : null;
};
