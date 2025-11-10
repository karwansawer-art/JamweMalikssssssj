export const getPlural = (num: number, unit: 'month' | 'day' | 'hour' | 'minute' | 'second'): string => {
    const plurals = {
        month: { single: 'شهر', dual: 'شهران', plural: 'أشهر' },
        day: { single: 'يوم', dual: 'يومان', plural: 'أيام' },
        hour: { single: 'ساعة', dual: 'ساعتان', plural: 'ساعات' },
        minute: { single: 'دقيقة', dual: 'دقيقتان', plural: 'دقائق' },
        second: { single: 'ثانية', dual: 'ثانيتان', plural: 'ثواني' },
    };
    const unitPlurals = plurals[unit];
    if (num === 1) return unitPlurals.single;
    if (num === 2) return unitPlurals.dual;
    return unitPlurals.plural;
};


export const getTimeDifference = (start: Date, end: Date) => {
    if (start > end) {
        return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
    }

    let totalMilliseconds = end.getTime() - start.getTime();

    const milliseconds = totalMilliseconds % 1000;

    let totalSeconds = Math.floor(totalMilliseconds / 1000);
    const seconds = totalSeconds % 60;
    
    let totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    
    let totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    
    let totalDays = Math.floor(totalHours / 24);
    
    // As per user request, using a fixed 30-day month for the calculation.
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;

    return {
        months,
        days,
        hours,
        minutes,
        seconds,
        milliseconds
    };
};