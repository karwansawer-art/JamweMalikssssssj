import React, { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { Habit, UserProfile } from '../../types.ts';
import { PlusIcon, ChartBarIcon } from '../ui/Icons.tsx';
import AddHabitModal from './AddHabitModal.tsx';
import HabitItem from './HabitItem.tsx';
import HabitStatsModal from './HabitStatsModal.tsx';

interface HabitsScreenProps {
    user: User;
    userProfile: UserProfile;
    setUserProfile: (profile: UserProfile) => void;
}

const getISODate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const HabitsScreen: React.FC<HabitsScreenProps> = ({ user, userProfile, setUserProfile }) => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
    const lastCheckedTime = useRef<string | null>(null);

    useEffect(() => {
        if (user.isAnonymous) {
            const guestHabits = userProfile.habits || [];
            const processedHabits = guestHabits.map(h => ({ ...h, createdAt: h.createdAt ? new Date(h.createdAt) : new Date() })).sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime());
            setHabits(processedHabits);
            setLoading(false);
        } else {
            const q = query(collection(db, 'users', user.uid, 'habits'), orderBy('createdAt', 'asc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedHabits = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data, createdAt: (data.createdAt as any).toDate() } as Habit;
                });
                setHabits(fetchedHabits);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching habits:", error);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user, userProfile]);

    // Request notification permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Setup reminder interval checker
    useEffect(() => {
        const checkReminders = () => {
            if (Notification.permission !== 'granted' || habits.length === 0) {
                return;
            }

            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            if (currentTime === lastCheckedTime.current) {
                return;
            }
            lastCheckedTime.current = currentTime;

            habits.forEach(habit => {
                if (habit.reminders?.includes(currentTime)) {
                    const todayKey = getISODate(now);
                    if (!habit.logs?.[todayKey]) {
                        new Notification('تذكير: حان وقت عادتك', {
                            body: `${habit.name} ${habit.icon}`,
                        });
                    }
                }
            });
        };
        
        const intervalId = setInterval(checkReminders, 30000); // Check every 30 seconds
        
        return () => clearInterval(intervalId);
    }, [habits]);

    const confirmDeleteHabit = async () => {
        if (habitToDelete) {
            try {
                if (user.isAnonymous) {
                    const updatedHabits = (userProfile.habits || []).filter(h => h.id !== habitToDelete.id);
                    setUserProfile({ ...userProfile, habits: updatedHabits });
                } else {
                    await deleteDoc(doc(db, 'users', user.uid, 'habits', habitToDelete.id));
                }
            } catch (error) {
                console.error("Error deleting habit:", error);
            } finally {
                setHabitToDelete(null);
            }
        }
    };

    const handleToggleComplete = (habit: Habit) => {
        const todayKey = getISODate(new Date());
        const isCompleted = habit.logs?.[todayKey];
        if (user.isAnonymous) {
            const updatedHabits = habits.map(h => {
                if (h.id === habit.id) {
                    const newLogs = { ...h.logs };
                    if (isCompleted) {
                        delete newLogs[todayKey];
                    } else {
                        newLogs[todayKey] = true;
                    }
                    return { ...h, logs: newLogs };
                }
                return h;
            });
            setUserProfile({ ...userProfile, habits: updatedHabits });
        } else {
            const habitRef = doc(db, 'users', user.uid, 'habits', habit.id);
            const newLogValue = isCompleted ? deleteField() : true;
            updateDoc(habitRef, { [`logs.${todayKey}`]: newLogValue }).catch(console.error);
        }
    }

    return (
        <div className="text-white">
            <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-10 flex justify-between items-center p-4 bg-sky-950/80 backdrop-blur-sm">
                <div className="w-10"></div> {/* Spacer to center the title */}
                <h1 className="text-2xl font-bold text-white text-shadow text-center">العادات</h1>
                <button 
                    onClick={() => setShowStatsModal(true)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="إحصائيات العادات"
                >
                    <ChartBarIcon className="w-7 h-7 text-sky-300" />
                </button>
            </header>

            <main className="space-y-4 p-4 pt-20">
                {loading ? (
                    <p className="text-center text-sky-300 py-10">جارِ تحميل العادات...</p>
                ) : habits.length > 0 ? (
                    habits.map(habit => (
                        <HabitItem 
                            key={habit.id} 
                            habit={habit} 
                            user={user} 
                            onDelete={() => setHabitToDelete(habit)}
                            onToggleComplete={() => handleToggleComplete(habit)}
                            setUserProfile={setUserProfile}
                            userProfile={userProfile}
                        />
                    ))
                ) : (
                    <div className="text-center py-16 px-4">
                        <h3 className="mt-4 text-xl font-semibold text-sky-300">لم تقم بإضافة أي عادات بعد</h3>
                        <p className="mt-2 text-sky-400">ابدأ ببناء عادات إيجابية بالضغط على زر الإضافة.</p>
                    </div>
                )}
            </main>
            
            {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} user={user} userProfile={userProfile} setUserProfile={setUserProfile} />}
            {showStatsModal && <HabitStatsModal onClose={() => setShowStatsModal(false)} habits={habits} />}
            
            {habitToDelete && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                    <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
                        <h3 className="text-xl font-bold text-red-400 text-center">تأكيد الحذف</h3>
                        <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في حذف عادة "{habitToDelete.name}"؟</p>
                        <div className="flex justify-center gap-4 pt-4">
                            <button onClick={() => setHabitToDelete(null)} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
                            <button onClick={confirmDeleteHabit} className="px-6 py-2 font-semibold text-white rounded-md bg-red-600 hover:bg-red-500">حذف</button>
                        </div>
                    </div>
                </div>
            )}

            <button 
                onClick={() => setShowAddModal(true)} 
                className="fixed z-40 left-6 bottom-20 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-lg hover:scale-110 transition-transform duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950/50 focus:ring-teal-400" 
                aria-label="إضافة عادة جديدة"
            >
                <PlusIcon className="w-8 h-8" />
            </button>
        </div>
    );
};

export default HabitsScreen;