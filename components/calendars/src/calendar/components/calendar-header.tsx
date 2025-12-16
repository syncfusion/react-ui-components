import * as React from 'react';
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { ChevronLeftIcon, ChevronRightIcon } from '@syncfusion/react-icons';
import { CalendarHeaderProps } from '../types';
import { IL10n, L10n, useProviderContext } from '@syncfusion/react-base';

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentView,
    headerTitle,
    disabled,
    onTitleClick,
    onPrevClick,
    onNextClick,
    className
}: CalendarHeaderProps): React.JSX.Element => {
    const prevDisabled: boolean = disabled || !onPrevClick;
    const nextDisabled: boolean = disabled || !onNextClick;
    const { dir, locale } = useProviderContext();
    const l10: IL10n = L10n('calendar', { key: String(currentView) }, locale);
    const previousTitle: string = l10.getConstant(`previous${currentView}`) ||
        `Previous ${String(currentView).toLowerCase()}`;
    const nextTitle: string = l10.getConstant(`next${currentView}`) ||
        `Next ${String(currentView).toLowerCase()}`;
    const chevronLeft: React.ReactNode = <ChevronLeftIcon viewBox="0 0 26 24" />;
    const chevronRight: React.ReactNode = <ChevronRightIcon viewBox="0 0 20 26" />;
    const classNames: string = ['sf-calendar-header', className].filter(Boolean).join(' ');
    const isDecade: boolean = String(currentView).toLowerCase() === 'decade';
    return (
        <div className={classNames}>
            <Button
                variant={Variant.Standard}
                color={Color.Secondary}
                className={`sf-calendar-title sf-radius-2 ${isDecade ? 'sf-readonly' : ''}`}
                onClick={onTitleClick}
                onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                    if (e.key === 'Enter' && onTitleClick) {
                        e.preventDefault();
                        onTitleClick(e);
                    }
                }}
                aria-label={`${headerTitle}`}
                tabIndex={(disabled || isDecade) ? -1 : 0}
            >
                {headerTitle}
            </Button>

            <div className="sf-calendar-icon">
                <Button
                    className="sf-prev sf-radius-full"
                    disabled={prevDisabled}
                    variant={Variant.Standard}
                    color={Color.Secondary}
                    onClick={onPrevClick}
                    onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                        if (e.key === 'Enter' && onPrevClick) {
                            e.preventDefault();
                            e.stopPropagation();
                            onPrevClick(e);
                        }
                    }}
                    aria-label={previousTitle}
                    title={previousTitle}
                    aria-disabled={prevDisabled}
                    icon={dir === 'rtl' ? chevronRight : chevronLeft}
                />
                <Button
                    className="sf-next sf-radius-full"
                    disabled={nextDisabled}
                    variant={Variant.Standard}
                    color={Color.Secondary}
                    onClick={onNextClick}
                    onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                        if (e.key === 'Enter' && onNextClick) {
                            e.preventDefault();
                            e.stopPropagation();
                            onNextClick(e);
                        }
                    }}
                    aria-label={nextTitle}
                    title={nextTitle}
                    aria-disabled={nextDisabled}
                    icon={dir === 'rtl' ? chevronLeft : chevronRight}
                />
            </div>
        </div>
    );
};
