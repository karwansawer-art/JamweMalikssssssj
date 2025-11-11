import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase.ts';
import type { JournalEntry, UserProfile } from '../types.ts';
import { BookIcon, PlusIcon, TrashIcon, EditIcon } from './ui/Icons.tsx';
import JournalEntryForm from './journal/JournalEntryForm.tsx';

const formatTimeAgo = (date: Date): string => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
    if (seconds < 60) return "الآن";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `قبل ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `قبل ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `قبل ${days} يوم`;
    const months = Math.floor(days / 30);
    return months < 12 ? `قبل ${Math.floor(months / 12)} سنة` : `قبل ${Math.floor(months / 12)} سنة`;
};

interface JournalProps {
    user: User;
    userProfile: UserProfile;
}

const Journal: React.FC<JournalProps> = ({ user, userProfile }) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null);
    const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<JournalEntry | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'users', user.uid, 'journalEntries'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEntries = snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data, timestamp: (data.timestamp as any).toDate() } as JournalEntry;
            });
            setEntries(fetchedEntries);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching journal entries:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleDelete = async () => {
        if (showDeleteConfirm) {
            try {
                await deleteDoc(doc(db, 'users', user.uid, 'journalEntries', showDeleteConfirm.id));
                setShowDeleteConfirm(null);
                setExpandedEntryId(null);
            } catch (error) {
                console.error("Error deleting entry:", error);
            }
        }
    };

    const handleAddClick = () => {
        setEntryToEdit(null);
        setShowForm(true);
    };

    const handleEditClick = (entry: JournalEntry) => {
        setEntryToEdit(entry);
        setShowForm(true);
    };

    return (
        <div className="text-white pb-40">
            <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-10 flex justify-between items-center p-4 bg-sky-950/80 backdrop-blur-sm">
                <div className="w-10"></div> {/* Spacer */}
                <h1 className="text-2xl font-bold text-white text-shadow text-center">اليوميات</h1>
                <div className="w-10"></div> {/* Spacer */}
            </header>
            <main className="space-y-4 p-4 pt-20">
                {loading ? (
                    <p className="text-center text-sky-300 py-10">جارِ تحميل اليوميات...</p>
                ) : entries.length > 0 ? (
                    entries.map(entry => {
                        const isExpanded = expandedEntryId === entry.id;
                        return (
                            <article 
                                key={entry.id} 
                                onClick={() => setExpandedEntryId(prevId => prevId === entry.id ? null : entry.id)} 
                                className="w-full text-right bg-sky-950/50 backdrop-blur-sm border border-sky-700/50 rounded-lg shadow-lg hover:bg-sky-900/70 transition-colors cursor-pointer p-4 space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-4xl">{entry.mood}</span>
                                    <div>
                                        <p className="font-bold text-sky-200">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                                        <p className="text-xs text-sky-400">{entry.timestamp ? formatTimeAgo(entry.timestamp) : ''}</p>
                                    </div>
                                </div>
                                <p className={`text-sky-300 whitespace-pre-wrap break-words transition-all duration-300 ${!isExpanded ? 'line-clamp-3' : ''}`}>{entry.text}</p>
                                
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-sky-700/50 flex justify-end gap-2 animate-fade-in">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(entry); }} 
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-yellow-300 bg-sky-800/60 border border-transparent hover:bg-sky-700/80 rounded-md transition-colors"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                            <span>تعديل</span>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(entry); }} 
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-400 bg-sky-800/60 border border-transparent hover:bg-sky-700/80 rounded-md transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            <span>حذف</span>
                                        </button>
                                    </div>
                                )}
                            </article>
                        );
                    })
                ) : (
                    <div className="text-center py-16 px-4">
                        <BookIcon className="w-24 h-24 mx-auto text-sky-700" />
                        <h3 className="mt-4 text-xl font-semibold text-sky-300">لم تكتب شيئاً بعد</h3>
                        <p className="mt-2 text-sky-400">ابدأ بتدوين يومياتك بالضغط على زر الإضافة.</p>
                    </div>
                )}
            </main>

            {showForm && <JournalEntryForm onClose={() => setShowForm(false)} user={user} entryToEdit={entryToEdit} />}
            
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                    <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
                        <h3 className="text-xl font-bold text-red-400 text-center">تأكيد الحذف</h3>
                        <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في حذف هذه اليومية؟</p>
                        <div className="flex justify-center gap-4 pt-4">
                            <button onClick={() => setShowDeleteConfirm(null)} className="px-6 py-2 font-semibold text-white rounded-md bg-gray-600 hover:bg-gray-500">إلغاء</button>
                            <button onClick={handleDelete} className="px-6 py-2 font-semibold text-white rounded-md bg-red-600 hover:bg-red-500">حذف</button>
                        </div>
                    </div>
                </div>
            )}

            <button onClick={handleAddClick} className="fixed z-40 left-6 bottom-20 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-lg hover:scale-110 transition-transform duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950/50 focus:ring-teal-400" aria-label="إضافة يومية جديدة">
                <PlusIcon className="w-8 h-8" />
            </button>
        </div>
    );
};

export default Journal;
