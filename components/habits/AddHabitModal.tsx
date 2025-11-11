import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.ts';
import type { Habit, UserProfile } from '../../types.ts';
import { CloseIcon } from '../ui/Icons.tsx';

const HABIT_SUGGESTIONS = [
    { name: 'صلاة الفجر', icon: '🕌' },
    { name: 'أذكار الصباح والمساء', icon: '📿' },
    { name: 'قراءة القرآن', icon: '📖' },
    { name: 'الصيام', icon: '🌙' },
    { name: 'الرياضة', icon: '🏃‍♂️' },
    { name: 'شرب الماء', icon: '💧' },
    { name: 'الاستيقاظ مبكراً', icon: '☀️' },
    { name: 'الأكل الصحي', icon: '🍎' },
    { name: 'كتابة اليوميات', icon: '📝' },
    { name: 'تعلم شيء جديد', icon: '🧠' },
    { name: 'الصدقة', icon: '🙏' },
    { name: 'صلة الرحم', icon: '👪' },
    { name: 'النوم مبكراً', icon: '💤' },
    { name: 'التخطيط لليوم', icon: '📅' },
    { name: 'وقت بدون هاتف', icon: '📵' },
    { name: 'الدعاء', icon: '🤲' },
    { name: 'تنظيف الأسنان', icon: '🦷' },
    { name: 'الترتيب والنظافة', icon: '🧹' },
    { name: 'الامتناع عن الغيبة', icon: '🤐' },
    { name: 'قضاء وقت مع العائلة', icon: '🤗' },
];

const CUSTOM_HABIT_ICONS = [
    '📖', '🏃‍♂️', '💧', '☀️', '💪', '🍎', '📝', '🎨', '🧠', '🙏', '🕌',
    '📿', '🌙', '🕋', '🤲', '🤐', '❤️', '🌱', '🌳', '🏞️', '📵', '🖥️', '🚶‍♂️', 
    '🏊', '🚲', '💤', '😊', '👍', '💰', '🧹', '🥗', '🗣️', '👪', '🤝', '📈', 
    '📉', '🕊️', '🧐', '🛠️', '👟', '🍵', '📞', '💸', '🧑‍💻', '🍲', '🛏️', '🕓',
    '✈️', '📷', '🎮', '🐶', '🖌️', '🍳', '💡', '🌍', '🛍️', '📅', '🧘‍♀️',
    '🧼', '🦷', '🧺', '⏰', '🎁', '💐', '💬', '🤗', '🥰', '🎭', '🎬',
    '🛹', '🩺', '💊', '📦', '📊', '📮'
];


interface AddHabitModalProps {
    onClose: () => void;
    user: User;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ onClose, user }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCustom, setIsCustom] = useState(false);

    const handleSuggestionClick = (suggestion: { name: string; icon: string }) => {
        setName(suggestion.name);
        setIcon(suggestion.icon);
        setIsCustom(true); // Go to the form to confirm/edit
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError("الرجاء إدخال اسم العادة.");
            return;
        }
        if (!icon) {
            setError("الرجاء اختيار أيقونة للعادة.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            await addDoc(collection(db, 'users', user.uid, 'habits'), {
                name,
                icon,
                createdAt: serverTimestamp(),
                logs: {}
            });
            onClose();
        } catch (err) {
            console.error("Error saving habit:", err);
            setError("حدث خطأ أثناء الحفظ.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-sky-950/90 border border-sky-500/50 rounded-lg flex flex-col h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-200">إضافة عادة جديدة</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                
                {!isCustom ? (
                    <main className="p-6 space-y-4 overflow-y-auto">
                        <h3 className="font-semibold text-sky-200 text-center">اختر من الاقتراحات:</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {HABIT_SUGGESTIONS.map(suggestion => (
                                <button key={suggestion.name} onClick={() => handleSuggestionClick(suggestion)} className="flex flex-col items-center gap-2 p-3 bg-sky-800/50 hover:bg-sky-700/70 rounded-lg transition-colors">
                                    <span className="text-3xl">{suggestion.icon}</span>
                                    <span className="text-sm font-semibold text-sky-200">{suggestion.name}</span>
                                </button>
                            ))}
                        </div>
                         <div className="relative flex py-5 items-center">
                            <div className="flex-grow border-t border-sky-700"></div>
                            <span className="flex-shrink mx-4 text-sky-400">أو</span>
                            <div className="flex-grow border-t border-sky-700"></div>
                        </div>
                        <button onClick={() => setIsCustom(true)} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-slate-600 hover:bg-slate-500">
                            إنشاء عادة مخصصة
                        </button>
                    </main>
                ) : (
                    <>
                        <main className="p-6 space-y-6 flex-grow overflow-y-auto">
                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                            <input 
                                type="text" 
                                placeholder="اسم العادة (مثال: قراءة القرآن)" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-sky-800/60 border border-sky-700 rounded-lg py-2 px-4 text-white placeholder-sky-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <div>
                                <label className="block text-sky-200 mb-3 font-semibold">اختر أيقونة:</label>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {CUSTOM_HABIT_ICONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setIcon(emoji)}
                                            className={`p-2 w-12 h-12 flex items-center justify-center rounded-full transition-all text-2xl ${icon === emoji ? 'bg-sky-500 scale-110 ring-2 ring-white' : 'bg-sky-800/60 hover:scale-110'}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </main>
                        <footer className="p-4 border-t border-sky-400/30 flex-shrink-0">
                            <button onClick={handleSave} disabled={loading} className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors bg-teal-600 hover:bg-teal-500 disabled:opacity-50">
                                {loading ? 'جارِ الحفظ...' : 'حفظ العادة'}
                            </button>
                        </footer>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddHabitModal;
