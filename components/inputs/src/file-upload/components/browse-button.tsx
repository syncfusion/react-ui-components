import { ButtonHTMLAttributes, FC, memo, ReactNode, useCallback } from 'react';
import { Button, Variant, Color } from '@syncfusion/react-buttons';
import { FILEUPLOAD_CLASSES } from '../constant';
import { useFileUploadContext } from '../context';
import { combineClasses } from '../utils';

/**
 * `BrowseButtonProps` defines the properties for the `BrowseButton` component,
 * a trigger element inside the `FileUpload` component that opens the system file
 * picker dialog so users can select one or more files.
 *
 * ```tsx
 * import { FileUpload, BrowseButton } from '@syncfusion/react-inputs';
 * import { UploadIcon } from '@syncfusion/react-icons';
 *
 * export default function App() {
 *    return (
 *         <FileUpload
 *           saveUrl="https://services.syncfusion.com/react/production/api/FileUploader/Save"
 *           removeUrl="https://services.syncfusion.com/react/production/api/FileUploader/Remove"
 *         >
 *             <BrowseButton><UploadIcon />Upload resume</BrowseButton>
 *         </FileUpload>
 *    );
 * }
 * ```
 */
export interface BrowseButtonProps {
    /**
     * Specifies whether the trigger element is disabled.
     *
     * @default -
     */
    disabled?: boolean;
    /**
     * Specifies an additional CSS class name for the trigger element.
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

type IBrowseButtonProps = BrowseButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'color'>;

/**
 * Renders a filled secondary `<Button>` that opens the file picker.
 * Pulls its click handler, disabled flag, and label from the root.
 *
 * ```tsx
 * <FileUpload>
 *     <BrowseButton>Select files</BrowseButton>
 * </FileUpload>
 * ```
 *
 * @returns {JSX.Element} The rendered browse button element.
 */
export const BrowseButton: FC<IBrowseButtonProps> = memo(({
    disabled,
    className,
    children,
    ...restProps
}: IBrowseButtonProps) => {
    const { config, browseLabel, triggerBrowse } = useFileUploadContext();
    const isDisabled: boolean = disabled ?? config.disabled ?? false;
    const label: ReactNode = children ?? browseLabel;

    const handleClick: () => void = useCallback((): void => {
        triggerBrowse();
    }, [triggerBrowse]);

    return (
        <Button
            className={combineClasses(FILEUPLOAD_CLASSES.browsBtn, className)}
            variant={Variant.Filled}
            color={Color.Secondary}
            onClick={handleClick}
            disabled={isDisabled}
            aria-label={browseLabel}
            title={browseLabel}
            {...restProps}
        >
            {label}
        </Button>
    );
});

BrowseButton.displayName = 'BrowseButton';
