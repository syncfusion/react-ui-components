import { FC } from 'react';
import { MonthViewProps } from '../types/scheduler-types';
import { WeekDayHeader } from '../components/week-day-header';
import { MonthRow } from '../components/month-row';
import { CSS_CLASSES } from '../common/constants';

export const MonthView: FC<MonthViewProps> = () => {

    return (
        <div className={`${CSS_CLASSES.VERTICAL_VIEW} ${CSS_CLASSES.MONTH_VIEW}`}>
            <div className={CSS_CLASSES.MAIN_SCROLL_CONTAINER}>
                <div className={CSS_CLASSES.STICKY_HEADER}>
                    <WeekDayHeader />
                </div>
                <div className={CSS_CLASSES.CONTENT_SECTION}>
                    <div className={CSS_CLASSES.WORK_CELLS_CONTAINER}>
                        <div className={CSS_CLASSES.DAY_CLONE_CONTAINER}></div>
                        <MonthRow />
                    </div>
                </div>
            </div>
        </div>
    );
};

MonthView.displayName = 'MonthView';
