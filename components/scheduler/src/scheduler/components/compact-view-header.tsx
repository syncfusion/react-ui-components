import { FC, MouseEvent, ReactNode } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { useResourceGroupingContext, ResourceGroupingContextType } from '../context/resource-grouping-context';
import { useProviderContext } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../common/locale';
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { ChevronRightIcon, MenuIcon } from '@syncfusion/react-icons';

export const CompactViewHeader: FC = (): ReactNode => {
    const { isCompact, selectedResourcePath, treeVisible, toggleTree }: ResourceGroupingContextType = useResourceGroupingContext();
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');

    if (!isCompact) {
        return null;
    }

    const resourcePath: string[] = selectedResourcePath ?? [];
    const handleMouseDown: (event: MouseEvent<HTMLButtonElement>) => void = (event: MouseEvent<HTMLButtonElement>): void => {
        event.nativeEvent.stopImmediatePropagation();
    };
    const handleMenuClick: () => void = (): void => toggleTree();

    return (
        <div className={CSS_CLASSES.COMPACT_VIEW_HEADER}>
            <Button
                className={CSS_CLASSES.COMPACT_VIEW_MENU_BTN}
                onMouseDown={handleMouseDown}
                onClick={handleMenuClick}
                aria-label={treeVisible ? getString('closeResourceList') : getString('openResourceList')}
                aria-expanded={treeVisible}
                icon={<MenuIcon />}
                color={Color.Secondary}
                variant={Variant.Standard}
            />
            <div
                className={CSS_CLASSES.COMPACT_VIEW_BREADCRUMB}
            >
                {resourcePath.length > 0 && resourcePath.map((name: string, index: number): ReactNode => (
                    <span
                        key={`${name}-${index}`}
                        className={CSS_CLASSES.COMPACT_VIEW_BREADCRUMB_LEVEL}
                    >
                        <div className={CSS_CLASSES.RESOURCE_NAME}>{name}</div>
                        {index < resourcePath.length - 1 && (
                            <ChevronRightIcon
                                className={CSS_CLASSES.COMPACT_VIEW_RESOURCE_NAME_SEPARATOR}
                                aria-hidden="true"
                            />
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default CompactViewHeader;
