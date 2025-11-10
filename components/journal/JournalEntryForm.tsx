import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { JournalEntry, UserProfile } from '../../types.ts';
import { CloseIcon } from '../ui/Icons.tsx';
import { ErrorAlert } from '../ui/Alert.tsx';

const MOODS = [
    { emoji: '😊', label: 'سعيد' },
    { emoji: '😢', label: 'حزين' },
    { emoji: '😠', label: 'غاضب' },
    { emoji: '😌', label: 'هادئ' },
    { emoji: '🤔', label: 'متردد' },
    { emoji: '🥳', label: 'متحمس' },
    { emoji: '😪', label: 'متعب' },
];

const MoodPickerModal: React.FC<{ onClose: () => void; onSelectMood: (mood: string) => void; }> = ({ onClose, onSelectMood }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div 
                className="w-full max-w-sm bg-sky-950 border border-sky-500/50 rounded-lg p-6 space-y-4 text-white"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-sky-300 text-center">كيف تشعر اليوم؟</h3>
                <div className="grid grid-cols-3 gap-4 pt-4">
                    {MOODS.map(({ emoji, label }) => (
                        <button
                            key={emoji}
                            onClick={() => onSelectMood(emoji)}
                            className="flex flex-col items-center justify-center gap-2 p-3 bg-sky-800/50 hover:bg-sky-700/80 rounded-lg transition-all duration-200 transform hover:scale-110"
                        >
                            <span className="text-4xl">{emoji}</span>
                            <span className="text-sm font-semibold text-sky-200">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface JournalEntryFormProps {
    onClose: () => void;
    user: User;
    entryToEdit: JournalEntry | null;
    userProfile: UserProfile;
    setUserProfile: (profile: UserProfile) => void;
}
const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ onClose, user, entryToEdit, userProfile, setUserProfile }) => {
    const [text, setText] = useState(entryToEdit?.text || '');
    const [mood, setMood] = useState(entryToEdit?.mood || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMoodPicker, setShowMoodPicker] = useState(false);

    const handleSave = async () => {
        if (!text.trim()) {
            setError("الرجاء كتابة اليوميات.");
            return;
        }
        if (!mood) {
            setError("الرجاء اختيار شعورك لهذا اليوم.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (user.isAnonymous) {
                const currentEntries = userProfile.journalEntries || [];
                if (entryToEdit) {
                    const updatedEntries = currentEntries.map(e => e.id === entryToEdit.id ? {...e, text, mood} : e);
                     setUserProfile({
                        ...userProfile,
                        journalEntries: updatedEntries,
                    });
                } else {
                    const newEntry: JournalEntry = {
                        id: Date.now().toString(), // Simple unique ID for local
                        text,
                        mood,
                        timestamp: new Date(),
                    };
                    setUserProfile({
                        ...userProfile,
                        journalEntries: [...currentEntries, newEntry],
                    });
                }
            } else {
                const journalCollection = collection(db, 'users', user.uid, 'journalEntries');
                if (entryToEdit) {
                    await updateDoc(doc(journalCollection, entryToEdit.id), { text, mood });
                } else {
                    await addDoc(journalCollection, {
                        text, mood, timestamp: serverTimestamp()
                    });
                }
            }
            onClose();
        } catch (error) {
            console.error("Error saving journal entry:", error);
            setError("حدث خطأ أثناء الحفظ.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200">{entryToEdit ? 'تعديل اليومية' : 'يومية جديدة'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <CloseIcon className="w-6 h-6 text-white" />
                    </button>
                </header>
                <main className="flex-grow p-4 flex flex-col space-y-4 overflow-y-auto">
                    {error && <ErrorAlert message={error} />}
                    <div className="flex flex-col flex-grow">
                        <label className="block text-sky-200 mb-2 font-semibold">كيف كان يومك؟</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="اكتب هنا..."
                            className="w-full flex-grow bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sky-200 mb-2 font-semibold">شعورك اليوم:</label>
                        <button 
                            type="button" 
                            onClick={() => setShowMoodPicker(true)}
                            className="w-full text-right bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex justify-between items-center hover:bg-slate-700/80 transition-colors"
                        >
                            {mood ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{mood}</span>
                                    <span className="font-semibold text-white">{MOODS.find(m => m.emoji === mood)?.label}</span>
                                </div>
                            ) : (
                                <span className="text-slate-400">اختر شعورك...</span>
                            )}
                            <span className="text-slate-400 text-xs">▼</span>
                        </button>
                    </div>
                </main>
                <footer className="p-4 border-t border-sky-400/30 flex-shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-lg border border-white/20 focus:outline-none bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 hover:shadow-xl hover:scale-105 active:scale-95 active:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-900/50 focus:ring-teal-400 disabled:opacity-50"
                    >
                        {loading ? 'جارِ الحفظ...' : 'حفظ'}
                    </button>
                </footer>
            </div>
            {showMoodPicker && (
                <MoodPickerModal 
                    onClose={() => setShowMoodPicker(false)}
                    onSelectMood={(selectedEmoji) => {
                        setMood(selectedEmoji);
                        setShowMoodPicker(false);
                    }}
                />
            )}
        </div>
    );
};

export default JournalEntryForm;