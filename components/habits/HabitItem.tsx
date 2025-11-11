import React, { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import type { Habit, UserProfile } from '../../types.ts';
import { TrashIcon, FlameIcon, CheckIcon, BellIcon } from '../ui/Icons.tsx';
import HabitReminderModal from './HabitReminderModal.tsx';

// Keep this helper local to the file, as it's specific to the habit log structure.
const getISODate = (date: Date): string => {
    // Uses local date parts to avoid timezone shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to get ISO dates for the current week (Sunday to Saturday)
const getWeekRange = (date: Date): string[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Go to Sunday (0 for Sunday, 1 for Monday, etc.)
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDates.push(getISODate(d));
    }
    return weekDates;
};

const calculateStreaks = (logs: { [date: string]: boolean } = {}) => {
    const logDates = Object.keys(logs).filter(key => logs[key]).map(key => {
        const d = new Date(key);
        d.setHours(0, 0, 0, 0); // Normalize to start of day
        return d;
    });
    logDates.sort((a, b) => b.getTime() - a.getTime()); // Sort descending

    if (logDates.length === 0) {
        return { currentStreak: 0, bestStreak: 0 };
    }

    // --- Calculate Current Streak ---
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const firstLogTime = logDates[0].getTime();
    
    // A streak can only exist if the habit was completed today or yesterday
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

    // --- Calculate Best Streak ---
    let bestStreak = 0;
    if (logDates.length > 0) {
        bestStreak = 1; // At least one log counts as a streak of 1
        let currentBest = 1;
        // Sort dates ascending for best streak calculation
        const ascendingDates = logDates.slice().reverse();
        for (let i = 1; i < ascendingDates.length; i++) {
            const prevDate = ascendingDates[i - 1];
            const currentDate = ascendingDates[i];
            
            const expectedDate = new Date(prevDate);
            expectedDate.setDate(prevDate.getDate() + 1); // Check if current is the next day after prev

            if (currentDate.getTime() === expectedDate.getTime()) {
                currentBest++;
            } else {
                currentBest = 1; // Streak broken, reset
            }
            
            if (currentBest > bestStreak) {
                bestStreak = currentBest;
            }
        }
    }

    return { currentStreak, bestStreak };
};

interface HabitItemProps {
    habit: Habit;
    user: User;
    onDelete: () => void;
    onToggleComplete: () => void;
}

const HabitItem: React.FC<HabitItemProps> = ({ habit, user, onDelete, onToggleComplete }) => {
    
    const [showReminderModal, setShowReminderModal] = useState(false);
    
    const { currentStreak, bestStreak } = useMemo(() => calculateStreaks(habit.logs), [habit.logs]);
    const todayKey = getISODate(new Date());
    const isCompletedToday = habit.logs?.[todayKey];

    const currentWeekDays = useMemo(() => getWeekRange(new Date()), []);
    const weeklyCompletions = useMemo(() => {
        if (!habit.logs) return 0;
        return currentWeekDays.filter(dateKey => habit.logs?.[dateKey]).length;
    }, [habit.logs, currentWeekDays]);

    const weeklyProgressPercentage = (weeklyCompletions / 7) * 100;


    return (
        <>
            <article className="w-full bg-sky-900/40 rounded-lg p-4 border border-sky-700/50 space-y-4 flex flex-col">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">{habit.icon}</span>
                        <h3 className="text-lg font-semibold text-sky-200">{habit.name}</h3>
                    </div>
                    <div className="flex items-center">
                        <button 
                            onClick={() => setShowReminderModal(true)} 
                            className="p-2 text-sky-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            aria-label={`تذكيرات عادة ${habit.name}`}
                        >
                            <BellIcon className="w-5 h-5"/>
                        </button>
                        <button 
                            onClick={onDelete} 
                            className="p-2 text-red-500 hover:text-red-300 hover:bg-white/10 rounded-full transition-colors"
                            aria-label={`حذف عادة ${habit.name}`}
                        >
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                
                <div className="flex justify-around items-center bg-black/30 p-3 rounded-md text-center">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-sky-400">الإنجاز الحالي</span>
                        <div className="flex items-center gap-1 font-bold text-lg">
                            <FlameIcon className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-400' : 'text-slate-500'}`} />
                            <span className={`${currentStreak > 0 ? 'text-white' : 'text-slate-400'}`}>{currentStreak} أيام</span>
                        </div>
                        {/* NEW: Visual Streak Indicator (7 days) */}
                        <div className="flex gap-1 mt-1">
                            {[...Array(7)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ease-in-out ${
                                        i < currentStreak ? 'bg-orange-400 scale-105 shadow-sm' : 'bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="w-px h-8 bg-sky-700/50"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-sky-400">أفضل إنجاز</span>
                        <div className="flex items-center gap-1 font-bold text-lg">
                            <FlameIcon className={`w-5 h-5 ${bestStreak > 0 ? 'text-yellow-400' : 'text-slate-500'}`} />
                            <span className={`${bestStreak > 0 ? 'text-white' : 'text-slate-400'}`}>{bestStreak} أيام</span>
                        </div>
                        <div className="h-3 w-16 mt-1" /> {/* Spacer for alignment */}
                    </div>
                </div>
                
                {/* NEW: Weekly Progress Bar */}
                <div className="flex flex-col items-start gap-2 bg-black/30 p-3 rounded-md">
                    <h4 className="text-sm font-semibold text-sky-400">تقدم هذا الأسبوع</h4>
                    <div className="w-full h-3 bg-slate-700 rounded-full" role="progressbar" aria-valuenow={weeklyProgressPercentage} aria-valuemin={0} aria-valuemax={100}>
                        <div
                            className="h-full bg-cyan-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${weeklyProgressPercentage}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-sky-300 mt-1">
                        {weeklyCompletions} من 7 أيام مكتملة
                    </p>
                </div>

                <button
                    onClick={onToggleComplete}
                    className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-900/50 mt-auto ${
                        isCompletedToday 
                            ? 'bg-gradient-to-br from-teal-500 to-green-600 text-white hover:from-teal-400 hover:to-green-500 focus:ring-teal-400'
                            : 'bg-slate-700/50 text-sky-300 hover:bg-slate-600/50 hover:text-white focus:ring-slate-400'
                    }`}
                >
                    {isCompletedToday ? <CheckIcon className="w-6 h-6" /> : null}
                    <span>{isCompletedToday ? 'تم إنجاز اليوم' : 'إنجاز اليوم'}</span>
                </button>
            </article>
            {showReminderModal && (
                <HabitReminderModal 
                    onClose={() => setShowReminderModal(false)}
                    habit={habit}
                    user={user}
                />
            )}
        </>
    );
};

export default HabitItem;
