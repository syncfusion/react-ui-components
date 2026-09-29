import { RefObject, FC, InputHTMLAttributes, ChangeEvent, memo, useMemo } from 'react';
import { FILEUPLOAD_CLASSES } from '../constant';

/**
 * The hidden `<input type="file">` that backs the file picker. The element is
 * visually hidden but remains focusable and accessible. When `directory` is
 * `true`, both the standard `directory` and the legacy `webkitdirectory`
 * attributes are set so folder selection works across browsers.
 *
 */
interface FileDropInputProps {
    inputRef: RefObject<HTMLInputElement | null>;
    name: string;
    multiple: boolean;
    accept: string | string[] | undefined;
    disabled: boolean;
    directory: boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    extraProps?: InputHTMLAttributes<HTMLInputElement>;
}

/**
 * The hidden `<input type="file">` that backs the file picker. The element is
 * visually hidden but remains focusable and accessible. When `directory` is
 * `true`, both the standard `directory` and the legacy `webkitdirectory`
 * attributes are set so folder selection works across browsers.
 *
 * @private
 * @param {FileDropInputProps} props - Component props.
 * @param {Object} props.inputRef - Ref attached to the input element.
 * @param {string} props.name - Form name for the input.
 * @param {boolean} props.multiple - Whether multiple files can be selected.
 * @param {string} props.accept - Accepted file types or extensions.
 * @param {boolean} props.disabled - Whether the input is disabled.
 * @param {boolean} props.directory - Whether directory selection is allowed.
 * @param {Function} props.onChange - Change handler.
 * @param {Object} [props.extraProps] - Extra native input attributes to forward.
 * @returns {Object} The rendered hidden file input.
 */
export const FileDropInput: FC<FileDropInputProps> = memo(({
    inputRef,
    name,
    multiple,
    accept,
    disabled,
    directory,
    onChange,
    extraProps
}: FileDropInputProps) => {
    const acceptAttribute: string | undefined = useMemo(
        (): string | undefined => (Array.isArray(accept) ? accept.join(',') : accept),
        [accept]
    );

    const directoryAttributes: InputHTMLAttributes<HTMLInputElement> | undefined = useMemo(
        (): InputHTMLAttributes<HTMLInputElement> | undefined =>
            directory ? ({ webkitdirectory: 'true', directory: 'true' } as InputHTMLAttributes<HTMLInputElement>) : undefined,
        [directory]
    );

    const safeExtraProps: InputHTMLAttributes<HTMLInputElement> = useMemo(
        (): InputHTMLAttributes<HTMLInputElement> => extraProps ?? {},
        [extraProps]
    );

    return (
        <input
            ref={inputRef}
            type="file"
            name={name}
            className={FILEUPLOAD_CLASSES.fileSelectInput}
            multiple={multiple}
            accept={acceptAttribute}
            onChange={onChange}
            disabled={disabled}
            {...safeExtraProps}
            {...(directoryAttributes ?? {})}
            aria-hidden="true"
        />
    );
});

FileDropInput.displayName = 'FileDropInput';
