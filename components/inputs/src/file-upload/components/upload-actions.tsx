import { ButtonHTMLAttributes, FC, HTMLAttributes, ReactNode, useCallback, memo } from 'react';
import { Button, Variant, Color } from '@syncfusion/react-buttons';
import { FILEUPLOAD_CLASSES } from '../constant';
import { useFileUploadContext } from '../context';
import { combineClasses } from '../utils';

/**
 * `ActionsProps` defines the properties for the `Actions` component,
 * a semantic container that hosts the batch-level controls of `UploadButton` and `ClearButton`
 * for the `FileUpload` component.
 * ```tsx
 * import { FileUpload, Actions, UploadButton, ClearButton } from '@syncfusion/react-inputs';
 *
 * export default function App() {
 *     return (
 *         <FileUpload
 *           saveUrl="https://services.syncfusion.com/react/production/api/FileUploader/Save"
 *           removeUrl="https://services.syncfusion.com/react/production/api/FileUploader/Remove"
 *           autoUpload={false}
 *         >
 *             <Actions>
 *                 <UploadButton>Upload file</UploadButton>
 *                 <ClearButton>Clear file</ClearButton>
 *             </Actions>
 *         </FileUpload>
 *     );
 * }
 * ```
 */
export interface ActionsProps {
    /**
     * Specifies an additional CSS class name for the action row.
     *
     * @default -
     */
    className?: string;
    /**
     * Specifies the row children, which are typically `<UploadButton>` and `<ClearButton>`.
     *
     * @default -
     */
    children?: ReactNode;
}

/**
 * Internal resolved prop shape — the public `ActionsProps` plus the
 * full native `<div>` attribute bag, with `children` excluded so the
 * component controls it.
 *
 * @private
 */
type IActionsProps = ActionsProps & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/**
 * Renders the batch-level action row. Returns `null` when `autoUpload`
 * is on or the file list is empty.
 *
 * ```tsx
 * <FileUpload autoUpload={false}>
 *     <Actions>
 *         <UploadButton>Upload</UploadButton>
 *         <ClearButton>Clear</ClearButton>
 *     </Actions>
 * </FileUpload>
 * ```
 *
 * @returns {JSX.Element | null} The rendered action row, or `null` when `autoUpload` is on or the file list is empty.
 */
export const Actions: FC<IActionsProps> = memo(({ className, children, ...restProps }: IActionsProps) => {
    const { config, files } = useFileUploadContext();
    if (config.autoUpload || files.length === 0) {
        return null;
    }
    return (
        <div
            className={combineClasses(FILEUPLOAD_CLASSES.uploadActions, className)}
            {...restProps}
        >
            {children}
        </div>
    );
});

Actions.displayName = 'Actions';

/**
 * `UploadButtonProps` defines the properties for the `UploadButton` component,
 * a button inside the `FileUpload` component that starts the upload for
 * every queued file in one action. Renders only inside `<Actions>` and when
 * there are files that can be uploaded.
 *
 * ```tsx
 * import { FileUpload, Actions, UploadButton, ClearButton } from '@syncfusion/react-inputs';
 *
 * export default function App() {
 *     return (
 *         <FileUpload
 *           saveUrl="https://services.syncfusion.com/react/production/api/FileUploader/Save"
 *           removeUrl="https://services.syncfusion.com/react/production/api/FileUploader/Remove"
 *           autoUpload={false}
 *         >
 *             <Actions>
 *                 <UploadButton>Upload file</UploadButton>
 *                 <ClearButton>Clear file</ClearButton>
 *             </Actions>
 *         </FileUpload>
 *     );
 * }
 * ```
 */
export interface UploadButtonProps {
    /**
     * Specifies whether the button is disabled.
     *
     * @default -
     */
    disabled?: boolean;
    /**
     * Specifies an additional CSS class name for the button element.
     *
     * @default -
     */
    className?: string;
    /**
     * Specifies the child content for the component.
     *
     * @default -
     */
    children?: ReactNode;
}

type IUploadButtonProps = UploadButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'color'>;

/**
 * Renders the "Upload" button. Triggers the root's `uploadAll()`.
 *
 * ```tsx
 * <FileUpload autoUpload={false}>
 *     <Actions>
 *         <UploadButton>Upload</UploadButton>
 *     </Actions>
 * </FileUpload>
 * ```
 *
 * @returns {JSX.Element} The rendered upload button element.
 */
export const UploadButton: FC<IUploadButtonProps> = memo(({
    disabled,
    className,
    children,
    ...restProps
}: IUploadButtonProps) => {
    const {
        config,
        isUploading,
        allFilesUploaded,
        canUpload,
        uploadAll,
        uploadLabel
    } = useFileUploadContext();
    const isDisabled: boolean = disabled ?? (
        config.disabled || isUploading || !config.saveUrl || allFilesUploaded || !canUpload
    );
    const handleClick: () => void = useCallback((): void => {
        if (isDisabled) {
            return;
        }
        uploadAll();
    }, [isDisabled, uploadAll]);
    return (
        <Button
            className={combineClasses(FILEUPLOAD_CLASSES.fileUploadBtn, className)}
            variant={Variant.Standard}
            onClick={handleClick}
            disabled={isDisabled}
            aria-label={uploadLabel}
            title={uploadLabel}
            {...restProps}
        >
            {children ?? uploadLabel}
        </Button>
    );
});

UploadButton.displayName = 'UploadButton';

/**
 * `ClearButtonProps` defines the properties for the `ClearButton` component,
 * a button inside the `FileUpload` component that removes every file from
 * the upload queue in one action. Renders only inside `<Actions>` and when the file list is non-empty.
 * ```tsx
 * import { FileUpload, Actions, UploadButton, ClearButton } from '@syncfusion/react-inputs';
 *
 * export default function App() {
 *     return (
 *         <FileUpload
 *           saveUrl="https://services.syncfusion.com/react/production/api/FileUploader/Save"
 *           removeUrl="https://services.syncfusion.com/react/production/api/FileUploader/Remove"
 *           autoUpload={false}
 *         >
 *             <Actions>
 *                 <UploadButton>Upload file</UploadButton>
 *                 <ClearButton>Clear file</ClearButton>
 *             </Actions>
 *         </FileUpload>
 *     );
 * }
 * ```
 */
export interface ClearButtonProps {
    /**
     * Specifies whether the button is disabled.
     *
     * @default -
     */
    disabled?: boolean;
    /**
     * Specifies an additional CSS class name for the button element.
     *
     * @default -
     */
    className?: string;
    /**
     * Specifies the child content for the component.
     *
     * @default -
     */
    children?: ReactNode;
}

/**
 * Internal resolved prop shape — the public `ClearButtonProps` plus
 * the full native `<button>` attribute bag, with `children` and
 * `color` excluded so the component controls them.
 *
 * @private
 */
type IClearButtonProps = ClearButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'color'>;

/**
 * Renders the "Clear" button. Triggers the root's `handleClear()`.
 *
 * ```tsx
 * <FileUpload autoUpload={false}>
 *     <Actions>
 *         <ClearButton>Clear</ClearButton>
 *     </Actions>
 * </FileUpload>
 * ```
 *
 * @returns {JSX.Element} The rendered clear button element.
 */
export const ClearButton: FC<IClearButtonProps> = memo(({
    disabled,
    className,
    children,
    ...restProps
}: IClearButtonProps) => {
    const { canClear, onClear, clearLabel } = useFileUploadContext();
    const isDisabled: boolean = disabled ?? !canClear;
    const handleClick: () => void = useCallback((): void => {
        if (isDisabled) {
            return;
        }
        onClear();
    }, [isDisabled, onClear]);
    return (
        <Button
            className={combineClasses(FILEUPLOAD_CLASSES.fileClearBtn, className)}
            variant={Variant.Standard}
            color={Color.Secondary}
            onClick={handleClick}
            disabled={isDisabled}
            aria-label={clearLabel}
            title={clearLabel}
            {...restProps}
        >
            {children ?? clearLabel}
        </Button>
    );
});

ClearButton.displayName = 'ClearButton';
