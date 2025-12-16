import { FC, MouseEvent, KeyboardEvent, CSSProperties } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulerLocalization } from '../common/locale';
import { Browser, useProviderContext } from '@syncfusion/react-base';

/** @private */
export interface MoreIndicatorProps {
    date: Date;
    count: number;
    onMoreClick: (e: MouseEvent<HTMLElement>, date: Date) => void;
    topPx?: number;
}

export const MoreIndicator: FC<MoreIndicatorProps> = (props: MoreIndicatorProps) => {
    const { date, count, onMoreClick, topPx } = props;
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const style: CSSProperties | undefined = topPx !== undefined ? { top: `${topPx}px` } : undefined;

    const handleKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            const syntheticEvent: MouseEvent<HTMLElement> = {
                ...e,
                currentTarget: e.currentTarget,
                type: 'click'
            } as unknown as MouseEvent<HTMLElement>;
            onMoreClick(syntheticEvent, date);
        }
    };

    return (
        <div
            className={`${CSS_CLASSES.MORE_INDICATOR} ${CSS_CLASSES.LINK}`}
            style={style}
            onClick={(e: MouseEvent<HTMLDivElement>) => onMoreClick(e, date)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
        >
            +{count} {!Browser.isDevice && `${getString('more')}`}
        </div>
    );
};

export default MoreIndicator;
