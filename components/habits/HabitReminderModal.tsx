import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { Habit, UserProfile } from '../../types.ts';
import { CloseIcon, ClockIcon, TrashIcon, Spinner } from '../ui/Icons.tsx';

interface HabitReminderModalProps {
    onClose: () => void;
    habit: Habit;
    user: User;
    userProfile: UserProfile;
    setUserProfile: (profile: UserProfile) => void;
}

const HabitReminderModal: React.FC<HabitReminderModalProps> = ({ onClose, habit, user, userProfile, setUserProfile }) => {
    const [reminders, setReminders] = useState<string[]>(habit.reminders || []);
    const [newTime, setNewTime] = useState('09:00');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addReminder = () => {
        if (newTime && !reminders.includes(newTime)) {
            const updatedReminders = [...reminders, newTime].sort();
            setReminders(updatedReminders);
        }
    };

    const removeReminder = (timeToRemove: string) => {
        setReminders(reminders.filter(time => time !== timeToRemove));
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            if (user.isAnonymous) {
                const updatedHabits = userProfile.habits?.map(h => 
                    h.id === habit.id ? { ...h, reminders: reminders } : h
                );
                setUserProfile({ ...userProfile, habits: updatedHabits });
            } else {
                const habitRef = doc(db, 'users', user.uid, 'habits', habit.id);
                await updateDoc(habitRef, { reminders: reminders });
            }
            onClose();
        } catch (err) {
            console.error("Error saving reminders:", err);
            setError("حدث خطأ أثناء الحفظ.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[70vh]">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200">تذكيرات "{habit.name}"</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 space-y-6 overflow-y-auto flex-grow">
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    
                    <div className="space-y-3">
                        <label className="font-semibold text-sky-200">أوقات التذكير الحالية:</label>
                        {reminders.length > 0 ? (
                            <ul className="space-y-2">
                                {reminders.map(time => (
                                    <li key={time} className="flex items-center justify-between p-2 bg-sky-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <ClockIcon className="w-5 h-5 text-sky-300" />
                                            <span className="font-mono text-lg">{time}</span>
                                        </div>
                                        <button onClick={() => removeReminder(time)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-full">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-sky-400 py-4">لا توجد تذكيرات لهذه العادة.</p>
                        )}
                    </div>
                    
                    <div className="border-t border-sky-700/50 pt-6 space-y-3">
                         <label htmlFor="time-input" className="font-semibold text-sky-200">إضافة تذكير جديد:</label>
                         <div className="flex gap-2">
                            <input
                                id="time-input"
                                type="time"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <button onClick={addReminder} className="px-4 py-2 font-semibold text-white rounded-md bg-sky-600 hover:bg-sky-500">
                                إضافة
                            </button>
                         </div>
                    </div>
                </main>
                <footer className="p-4 border-t border-sky-400/30 flex-shrink-0">
                    <button onClick={handleSave} disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-teal-600 hover:bg-teal-500 disabled:opacity-50">
                        {loading ? <Spinner className="w-6 h-6 mx-auto" /> : 'حفظ التغييرات'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default HabitReminderModal;