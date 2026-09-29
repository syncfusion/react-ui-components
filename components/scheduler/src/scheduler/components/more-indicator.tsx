import { FC, MouseEvent, KeyboardEvent, CSSProperties } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulerLocalization } from '../common/locale';
import { Browser, useProviderContext } from '@syncfusion/react-base';
import { ResourceLevel } from '../services/ResourceGroupingService';

/** @private */
export interface MoreIndicatorProps {
    /**
     * Start of the more-indicator range. Timeline slots pass the slot start time;
     * date-only views pass the calendar day.
     */
    startDate: Date;
    count: number;
    onMoreClick: (
        e: MouseEvent<HTMLElement>, startDate: Date, resource?: ResourceLevel, endDate?: Date
    ) => void;
    style?: CSSProperties;
    resource?: ResourceLevel;
    /** Optional exclusive end of the filter range for timeline more indicators. */
    endDate?: Date;
}

export const MoreIndicator: FC<MoreIndicatorProps> = (props: MoreIndicatorProps) => {
    const { startDate, count, onMoreClick, style, resource, endDate } = props;
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');

    const handleKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            const syntheticEvent: MouseEvent<HTMLElement> = {
                ...e,
                currentTarget: e.currentTarget,
                type: 'click'
            } as unknown as MouseEvent<HTMLElement>;
            onMoreClick(syntheticEvent, startDate, resource, endDate);
        }
    };

    return (
        <div
            className={`${CSS_CLASSES.MORE_INDICATOR} ${CSS_CLASSES.LINK}`}
            style={style}
            onClick={(e: MouseEvent<HTMLDivElement>) => onMoreClick(e, startDate, resource, endDate)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
        >
            <div className={CSS_CLASSES.ELLIPSIS}>+{count} {!Browser.isDevice && `${getString('more')}`} </div>
        </div>
    );
};

export default MoreIndicator;
