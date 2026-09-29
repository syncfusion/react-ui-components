import { createContext, useContext } from 'react';
import { IL10n } from '@syncfusion/react-base';
import { FileItem } from './types';
import { FileUploadHandlers } from './hooks/useFileUploadHandlers';

/**
 * Helpers passed to `<FileList>`'s function-as-child render prop so
 * consumers can build a fully custom row template without reaching into
 * the context directly.
 *
 * @private
 */
export interface FileUploadRowHelpers {
    retry: (fileId: string) => void;
    cancel: (fileId: string) => void;
    remove: (fileId: string) => void;
    pause: (fileId: string) => void;
    resume: (fileId: string) => void;
}

/**
 * Resolved config flags exposed through the context so every compound
 * child can render against the same source of truth.
 *
 * @private
 */
export interface FileUploadConfig {
    saveUrl?: string;
    removeUrl?: string;
    showRetry?: boolean;
    showCancel?: boolean;
    showRemove?: boolean;
    showProgressBar?: boolean;
    dragDropEnabled?: boolean;
    disabled?: boolean;
    autoUpload?: boolean;
}

/**
 * The single shared context that every compound child consumes.
 * Defaults to `null` — any compound child rendered outside a `<FileUpload>`
 * root will surface a clear dev-mode error.
 *
 * @private
 */
export interface FileUploadContextValue {
    files: FileItem[];
    isUploading: boolean;
    handlers: FileUploadHandlers;
    config: FileUploadConfig;
    helpers: FileUploadRowHelpers;
    l10n: IL10n | null;
    browseLabel: string;
    uploadLabel: string;
    clearLabel: string;
    dragDropLabel: string;
    canUpload: boolean;
    canClear: boolean;
    allFilesUploaded: boolean;
    uploadAll: () => void;
    onClear: () => void;
    triggerBrowse: () => void;
}

export const FileUploadContext: React.Context<FileUploadContextValue | null> = createContext<FileUploadContextValue | null>(null);

/**
 * Hook that returns the nearest `<FileUpload>` context value. Throws
 * when called outside a `<FileUpload>` root so compound children get
 * a single, consistent dev-mode error.
 *
 * @returns {FileUploadContextValue} The nearest `<FileUpload>` context value.
 * @private
 */
export const useFileUploadContext: () => FileUploadContextValue = (): FileUploadContextValue => {
    const ctx: FileUploadContextValue | null = useContext(FileUploadContext);
    if (!ctx) {
        throw new Error('Component must be used inside a <FileUpload> root.');
    }
    return ctx;
};
