import * as React from 'react';
import { Button, Variant } from '@syncfusion/react-buttons';
import { IL10n, L10n, useProviderContext } from '@syncfusion/react-base';
import { CalendarFooterProps } from '../types';


export const CalendarFooter: React.FC<CalendarFooterProps> = ({
    disabled,
    onTodayClick,
    className
}: CalendarFooterProps): React.JSX.Element => {
    const { locale } = useProviderContext();
    const l10n: IL10n = L10n('calendar', { today: 'Today' }, locale);
    const todayLabel: string = l10n.getConstant('today');
    const classNames: string = ['sf-calendar-footer', className].filter(Boolean).join(' ');
    return (
        <div className={classNames}>
            <Button
                tabIndex={disabled ? -1 : 0}
                className="sf-today sf-radius-2"
                variant={Variant.Standard}
                disabled={disabled}
                onClick={onTodayClick}
                aria-label={todayLabel}
            >
                {todayLabel}
            </Button>
        </div>
    );
};
