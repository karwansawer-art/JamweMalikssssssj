import React, { useMemo } from 'react';
import type { Habit } from '../../types.ts';
import { CloseIcon, ChartBarIcon, FlameIcon } from '../ui/Icons.tsx';

// Copying helper functions here to keep changes self-contained within the file
const getISODate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calculateStreaks = (logs: { [date: string]: boolean } = {}) => {
    const logDates = Object.keys(logs).filter(key => logs[key]).map(key => new Date(key));
    logDates.sort((a, b) => b.getTime() - a.getTime());

    if (logDates.length === 0) {
        return { currentStreak: 0, bestStreak: 0 };
    }

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const firstLogTime = logDates[0].getTime();
    
    if (firstLogTime === today.getTime() || firstLogTime === yesterday.getTime()) {
        currentStreak = 1;
        let lastDate = logDates[0];
        for (let i = 1; i < logDates.length; i++) {
            const currentDate = logDates[i];
            const expectedDate = new Date(lastDate);
            expectedDate.setDate(lastDate.getDate() - 1);
            if (currentDate.getTime() === expectedDate.getTime()) {
                currentStreak++;
                lastDate = currentDate;
            } else {
                break;
            }
        }
    }

    let bestStreak = 0;
    if (logDates.length > 0) {
        bestStreak = 1;
        let currentBest = 1;
        const ascendingDates = logDates.slice().reverse();
        for (let i = 1; i < ascendingDates.length; i++) {
            const prevDate = ascendingDates[i - 1];
            const currentDate = ascendingDates[i];
            const expectedDate = new Date(prevDate);
            expectedDate.setDate(prevDate.getDate() + 1);
            if (currentDate.getTime() === expectedDate.getTime()) {
                currentBest++;
            } else {
                currentBest = 1;
            }
            if (currentBest > bestStreak) {
                bestStreak = currentBest;
            }
        }
    }
    return { currentStreak, bestStreak };
};

interface HabitStatsModalProps {
    onClose: () => void;
    habits: Habit[];
}

const HabitStatsModal: React.FC<HabitStatsModalProps> = ({ onClose, habits }) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const stats = useMemo(() => habits.map(habit => {
        const logs = habit.logs || {};
        const { currentStreak, bestStreak } = calculateStreaks(logs);

        const monthCompletions = Object.keys(logs).filter(dateStr => {
            const logDate = new Date(dateStr);
            return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
        }).length;

        const totalCompletions = Object.keys(logs).length;

        return {
            id: habit.id,
            name: habit.name,
            icon: habit.icon,
            monthCompletions,
            totalCompletions,
            currentStreak,
            bestStreak,
        };
    }).sort((a, b) => b.totalCompletions - a.totalCompletions), [habits, currentMonth, currentYear]);

    const monthName = today.toLocaleString('ar-EG', { month: 'long' });

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <ChartBarIcon className="w-7 h-7 text-sky-300" />
                        <h2 className="text-xl font-bold text-sky-200">إحصائيات العادات</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto space-y-4">
                    {habits.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-full text-center text-sky-400">
                            <ChartBarIcon className="w-24 h-24 text-sky-700 mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold text-sky-300">لا توجد بيانات لعرضها</h3>
                            <p className="mt-2">ابدأ بتتبع عاداتك لترى إحصائياتك هنا.</p>
                        </div>
                    ) : (
                        stats.map(stat => (
                            <div key={stat.id} className="bg-sky-900/50 p-4 rounded-lg border border-sky-700/50">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-4xl">{stat.icon}</span>
                                    <h3 className="font-bold text-lg text-teal-300">{stat.name}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-black/30 p-2 rounded-md">
                                        <p className="text-xs text-sky-400">إنجاز الشهر ({monthName})</p>
                                        <p className="font-bold text-xl">{stat.monthCompletions}</p>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded-md">
                                        <p className="text-xs text-sky-400">إجمالي الإنجاز</p>
                                        <p className="font-bold text-xl">{stat.totalCompletions}</p>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded-md">
                                        <p className="text-xs text-sky-400">الإنجاز الحالي</p>
                                        <p className="font-bold text-xl flex items-center justify-center gap-1">
                                            <FlameIcon className={`w-5 h-5 ${stat.currentStreak > 0 ? 'text-orange-400' : 'text-slate-500'}`} />
                                            {stat.currentStreak}
                                        </p>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded-md">
                                        <p className="text-xs text-sky-400">أفضل إنجاز</p>
                                        <p className="font-bold text-xl flex items-center justify-center gap-1">
                                            <FlameIcon className={`w-5 h-5 ${stat.bestStreak > 0 ? 'text-yellow-400' : 'text-slate-500'}`} />
                                            {stat.bestStreak}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </main>
            </div>
        </div>
    );
};

export default HabitStatsModal;