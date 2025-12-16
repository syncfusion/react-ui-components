export const getTimeValue: (time: Date | null) => number = (time: Date | null): number => {
    if (!time) {
        return -1;
    }
    return time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
};

export const isSameCalendarDay: Function = (a: Date, b: Date): boolean => {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
};

export const isTimeWithinRange: (time: Date, minTime: Date | null | undefined, maxTime: Date | null | undefined) => boolean =
    (time: Date, minTime: Date | null | undefined, maxTime: Date | null | undefined): boolean => {
        if (!minTime && !maxTime) {
            return true;
        }
        const t: number = getTimeValue(time);
        const hasMin: boolean = !!minTime;
        const hasMax: boolean = !!maxTime;
        const min: number = hasMin ? getTimeValue(minTime as Date) : -1;
        const max: number = hasMax ? getTimeValue(maxTime as Date) : -1;
        if (hasMin && hasMax) {
            const sameDay: boolean = isSameCalendarDay(minTime as Date, maxTime as Date);
            if (sameDay) {
                if (min === max) {
                    return t === min;
                }
                if (min > max) {
                    return false;
                }
                return t >= min && t <= max;
            }
            if (min === max) {
                return t === min;
            }
            if (min > max) {
                return t >= min || t <= max;
            }
            return t >= min && t <= max;
        }

        if (hasMin) {
            return t >= min;
        }
        if (hasMax) {
            return t <= max;
        }

        return true;
    };
