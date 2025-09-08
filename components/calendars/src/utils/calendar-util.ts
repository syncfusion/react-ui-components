export const addMonths: (actualDate: Date, i: number) => Date = (actualDate: Date, i: number): Date => {
    const date: Date = new Date(actualDate.getTime());
    const day: number = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + i);
    date.setDate(Math.min(day, getMaxDays(date)));
    return date;
};

export const addYears: (date: Date, years: number) => Date = (date: Date, years: number): Date => {
    const d: Date = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
};

export const getWeekNumber: (date: Date) => number = (date: Date): number => {
    const currentDate: number = new Date(date).valueOf();
    const firstDayOfYear: number = new Date(date.getFullYear(), 0, 1).valueOf();
    return Math.ceil((((currentDate - firstDayOfYear) + 86400000) / 86400000) / 7);
};

const getMaxDays: (d: Date) => number = (d: Date) => {
    let date: number = 28;
    const tmpDate: Date = new Date(d);
    const month: number = tmpDate.getMonth();
    while (tmpDate.getMonth() === month) {
        ++date;
        tmpDate.setDate(date);
    }
    return date - 1;
};

