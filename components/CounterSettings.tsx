import React, { useState } from 'react';
import { doc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../services/firebase';
import type { UserProfile, Tab } from '../types';
import { BackIcon, ResetIcon, CalendarIcon, ImageIcon, TrashIcon } from './ui/Icons.tsx';

declare const uploadcare: any;

const SetDateModal: React.FC<{ onClose: () => void; onSave: (date: string) => void; }> = ({ onClose, onSave }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSave = () => {
        onSave(date);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-sm bg-sky-950 border border-sky-500/50 rounded-lg p-6 space-y-4 text-white">
                <h3 className="text-xl font-bold text-sky-300">تعيين تاريخ بداية جديد</h3>
                <p className="text-sky-200">اختر التاريخ الذي تريد أن يبدأ العداد منه.</p>
                <input
                    type="date"
                    className="w-full bg-black/30 border border-sky-400/50 rounded-md p-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
                <div className="flex justify-end gap-4 pt-2">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-gray-500">إلغاء</button>
                    <button onClick={handleSave} className="px-4 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-sky-600 to-sky-800 hover:from-sky-500 hover:to-sky-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-sky-500">حفظ</button>
                </div>
            </div>
        </div>
    );
};


const ResetConfirmationModal: React.FC<{ onConfirm: () => void; onClose: () => void; }> = ({ onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-sm bg-sky-950 border border-yellow-500/50 rounded-lg p-6 space-y-4 text-white">
                <h3 className="text-xl font-bold text-yellow-300 text-center">تأكيد تصفير العداد</h3>
                <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في تصفير العداد؟ سيبدأ العد من اللحظة الحالية.</p>
                <div className="flex justify-center gap-4 pt-4">
                    <button onClick={onClose} className="px-6 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-gray-500">لا</button>
                    <button onClick={onConfirm} className="px-6 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-yellow-500">نعم، قم بالتصفير</button>
                </div>
            </div>
        </div>
    );
};

const DeleteImageConfirmationModal: React.FC<{ onConfirm: () => void; onClose: () => void; }> = ({ onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-sm bg-sky-950 border border-red-500/50 rounded-lg p-6 space-y-4 text-white">
                <h3 className="text-xl font-bold text-red-400 text-center">تأكيد حذف الصورة</h3>
                <p className="text-sky-200 text-center">هل أنت متأكد من رغبتك في حذف صورة العداد المخصصة؟</p>
                <div className="flex justify-center gap-4 pt-4">
                     <button onClick={onClose} className="px-6 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-gray-500">إلغاء</button>
                    <button onClick={onConfirm} className="px-6 py-2 font-semibold text-white rounded-md transition-all duration-300 ease-in-out shadow-md border border-white/20 focus:outline-none bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-950 focus:ring-red-500">نعم، قم بالحذف</button>
                </div>
            </div>
        </div>
    );
};

interface CounterSettingsProps {
    user: User;
    userProfile: UserProfile;
    setActiveTab: (tab: Tab) => void;
    isDeveloper: boolean;
    setUserProfile: (profile: UserProfile) => void;
}

const CounterSettings: React.FC<CounterSettingsProps> = ({ user, userProfile, setActiveTab, isDeveloper, setUserProfile }) => {
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showSetDateModal, setShowSetDateModal] = useState(false);
    const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
    
    const hasCustomImage = !!userProfile?.counterImage;

    const clearBadgeHistory = () => {
        for (const key in localStorage) {
            if (key.startsWith(`celebrated_${user.uid}_`)) {
                localStorage.removeItem(key);
            }
        }
    };

    const handleResetCounter = () => {
        setShowResetConfirm(false);
        const now = new Date();
        if (user.isAnonymous) {
            setUserProfile({ ...userProfile, startDate: now });
        } else {
            setDoc(doc(db, "users", user.uid), { startDate: now }, { merge: true });
        }
        clearBadgeHistory();
    };

    const handleSetStartDate = (date: string) => {
        const startDate = new Date(date);
        if (user.isAnonymous) {
            setUserProfile({ ...userProfile, startDate: startDate });
        } else {
            setDoc(doc(db, "users", user.uid), { startDate }, { merge: true });
        }
        clearBadgeHistory();
        setShowSetDateModal(false);
    };

    const handleSetCounterImage = (imageUrl: string) => {
        if(isDeveloper){
            updateDoc(doc(db, "app_config", "global_settings"), {
                counterImage: imageUrl
            });
        }
    };
    
    const handleDeleteCounterImage = () => {
        setShowDeleteImageConfirm(false);
        if(isDeveloper){
            updateDoc(doc(db, "app_config", "global_settings"), {
                counterImage: deleteField()
            });
        }
    };

    const openUploadcareDialog = () => {
        const dialog = uploadcare.openDialog(null, {
            imagesOnly: true,
            crop: '1:1.25',
        });

        dialog.done((fileGroup: any) => {
            fileGroup.promise().done((fileInfo: any) => {
                handleSetCounterImage(String(fileInfo.cdnUrl)); // Ensure it's a string
            });
        });
    };

    return (
        <div className="text-white pt-4">
             <header className="relative mb-6">
                 <button onClick={() => setActiveTab('home')} className="absolute top-1/2 -translate-y-1/2 left-0 p-2 rounded-full text-sky-200 hover:text-white hover:bg-sky-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500" aria-label="العودة">
                    <BackIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-2xl font-bold text-center text-white text-shadow">اعدادات العداد</h1>
            </header>
            
            <div className="mt-8 p-4 bg-sky-900/30 rounded-lg space-y-2 max-w-sm mx-auto">
                <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-white/10 transition-colors">
                    <ResetIcon className="w-6 h-6 text-yellow-300" />
                    <span>تصفير العداد</span>
                </button>
                <button onClick={() => setShowSetDateModal(true)} className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-white/10 transition-colors">
                    <CalendarIcon className="w-6 h-6 text-teal-300" />
                    <span>تعيين تاريخ بداية جديد</span>
                </button>
                {isDeveloper && (
                    <>
                        <button onClick={openUploadcareDialog} className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-white/10 transition-colors">
                            <ImageIcon className="w-6 h-6 text-cyan-300" />
                            <span>{hasCustomImage ? "تغيير صورة العداد" : "إضافة صورة للعداد"}</span>
                        </button>
                        {hasCustomImage && (
                            <button onClick={() => setShowDeleteImageConfirm(true)} className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-white/10 transition-colors">
                                <TrashIcon className="w-6 h-6 text-red-400" />
                                <span className="text-red-400">حذف صورة العداد</span>
                            </button>
                        )}
                    </>
                )}
            </div>

            {showResetConfirm && <ResetConfirmationModal onConfirm={handleResetCounter} onClose={() => setShowResetConfirm(false)} />}
            {showSetDateModal && <SetDateModal onSave={handleSetStartDate} onClose={() => setShowSetDateModal(false)} />}
            {showDeleteImageConfirm && <DeleteImageConfirmationModal onConfirm={handleDeleteCounterImage} onClose={() => setShowDeleteImageConfirm(false)} />}
        </div>
    );
};

export default CounterSettings;