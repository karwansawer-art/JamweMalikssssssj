import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile, LeaderboardEntry } from '../../types.ts';
import { db } from '../../services/firebase.ts';
import { doc, setDoc } from 'firebase/firestore';
import { CloseIcon, LeaderboardIcon, CameraIcon } from '../ui/Icons.tsx';
import BadgesModal from './BadgesModal.tsx';
import AvatarPickerModal from '../ui/AvatarPickerModal.tsx';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    leaderboard: LeaderboardEntry[];
    loading: boolean;
    isDeveloper: boolean;
    setLeaderboard: React.Dispatch<React.SetStateAction<LeaderboardEntry[]>>;
}

const getDayPlural = (days: number): string => {
    if (days === 0) return '٠ أيام';
    if (days === 1) return 'يوم واحد';
    if (days === 2) return 'يومان';
    if (days >= 3 && days <= 10) return `${days} أيام`;
    return `${days} يومًا`;
};

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ 
    isOpen, 
    onClose, 
    currentUser, 
    leaderboard, 
    loading,
    isDeveloper,
    setLeaderboard
}) => {
    const [viewingBadgesFor, setViewingBadgesFor] = useState<UserProfile | null>(null);
    const [userToEditAvatar, setUserToEditAvatar] = useState<UserProfile | null>(null);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    if (!isOpen) return null;

    const handleAvatarUpdate = async (newPhotoURL: string) => {
        if (!userToEditAvatar || !isDeveloper) return;
        try {
            const userDocRef = doc(db, 'users', userToEditAvatar.uid);
            // Use setDoc with merge for robustness, although users in leaderboard should exist.
            await setDoc(userDocRef, { photoURL: newPhotoURL }, { merge: true });

            // Update local leaderboard state for immediate UI feedback
            setLeaderboard(prev => prev.map(entry => 
                entry.user.uid === userToEditAvatar.uid 
                ? { ...entry, user: { ...entry.user, photoURL: newPhotoURL } } 
                : entry
            ));
            
            // Close modal and reset state
            setShowAvatarPicker(false);
            setUserToEditAvatar(null);
        } catch (error) {
            console.error("Error updating avatar:", error);
            // Optionally show an alert to the developer
        }
    };

    const getRankContent = (rank: number) => {
        if (rank === 1) return <span className="text-2xl">🥇</span>;
        if (rank === 2) return <span className="text-2xl">🥈</span>;
        if (rank === 3) return <span className="text-2xl">🥉</span>;
        return <span className="font-bold">{rank}</span>;
    };
    
    const currentUserIndex = leaderboard.findIndex(entry => entry.user.uid === currentUser.uid);
    const totalParticipants = leaderboard.length;


    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="w-full h-full max-w-md bg-sky-950/90 text-white flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-sky-400/30 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <LeaderboardIcon className="w-7 h-7 text-yellow-300" />
                        <h2 className="text-xl font-bold text-sky-200 text-shadow">لوحة الصدارة</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-grow overflow-y-auto p-2">
                    {currentUser.isAnonymous && (
                        <div className="bg-yellow-900/50 text-yellow-200 p-3 rounded-lg text-center text-sm m-2">
                            ملاحظة: إذا كنت تريد أن يظهر اسمك في لوحة الصدارة، يرجى إنشاء حساب.
                        </div>
                    )}
                    {loading ? (
                        <p className="text-center text-sky-400 py-10">جارِ تحميل القائمة...</p>
                    ) : leaderboard.length > 0 ? (
                        <ul className="space-y-2">
                            {leaderboard.map(({ user, days }, index) => {
                                const isCurrentUser = user.uid === currentUser.uid;
                                const rank = index + 1;
                                return (
                                    <li 
                                        key={user.uid}
                                        className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${isCurrentUser ? 'bg-sky-600 border-2 border-sky-300' : 'bg-sky-800/50'}`}
                                    >
                                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-lg">
                                            {getRankContent(rank)}
                                        </div>
                                        <button onClick={() => setViewingBadgesFor(user)} className="group flex items-center gap-4 flex-grow overflow-hidden text-right">
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || ' '}&background=0284c7&color=fff&size=128`}
                                                    alt={user.displayName || 'User Avatar'}
                                                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-sky-500/50"
                                                />
                                                {isDeveloper && (
                                                    <div 
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent opening badges modal
                                                            setUserToEditAvatar(user);
                                                            setShowAvatarPicker(true);
                                                        }}
                                                        className="absolute -bottom-1 -right-1 bg-sky-600 p-1.5 rounded-full hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 ring-offset-2 ring-offset-sky-800 focus:ring-sky-300 cursor-pointer"
                                                        aria-label={`تغيير صورة ${user.displayName}`}
                                                    >
                                                        <CameraIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow overflow-hidden">
                                                <p className="font-semibold truncate group-hover:underline">{user.displayName || 'مستخدم'}</p>
                                            </div>
                                        </button>
                                        <div className="flex-shrink-0 font-bold text-lg text-yellow-300">
                                            {getDayPlural(days)}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-center text-sky-400 py-10">لا يوجد مستخدمون في لوحة الصدارة بعد. ابدأ عدادك لتظهر هنا!</p>
                    )}
                </main>
                 {currentUserIndex !== -1 && totalParticipants > 0 && (
                    <footer className="p-3 border-t border-sky-400/30 flex-shrink-0 text-center bg-sky-900">
                        <p className="font-semibold text-sky-200">
                            أنت في المرتبة 
                            <span className="text-yellow-300 font-bold mx-1">{currentUserIndex + 1}</span> 
                            من أصل 
                            <span className="text-yellow-300 font-bold mx-1">{totalParticipants}</span>
                        </p>
                    </footer>
                )}
            </div>
            {viewingBadgesFor && (
                <BadgesModal
                    isOpen={!!viewingBadgesFor}
                    onClose={() => setViewingBadgesFor(null)}
                    userProfile={viewingBadgesFor}
                    currentUser={currentUser}
                />
            )}
             <AvatarPickerModal 
                isOpen={showAvatarPicker}
                onClose={() => {
                    setShowAvatarPicker(false);
                    setUserToEditAvatar(null);
                }}
                onSelectAvatar={handleAvatarUpdate}
            />
        </div>
    );
};

export default LeaderboardModal;